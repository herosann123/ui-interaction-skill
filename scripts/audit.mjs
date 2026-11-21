#!/usr/bin/env node
/* =========================================================================
   ui-interaction-skill · 前端交互体检器
   零依赖静态扫描：从代码里找「可优化 / 可替代」的证据，不做视觉打分。

   用法：
     node scripts/audit.mjs <文件或目录...> [--json] [--out report.md]
                            [--fail-on p0|p1|p2] [--quiet]

   设计原则：
   - 只报可定位到 file:line 的证据（启发式，需人工/运行复核）
   - 规则按 P0/P1/P2 分级，并映射到 SKILL 的模式编号
   - 不臆测截图观感；不做审美评分
   ========================================================================= */

import {
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
  existsSync,
  mkdirSync,
} from 'node:fs';
import { join, relative, resolve, extname, basename, dirname } from 'node:path';

const VERSION = '1.0.0';
const CWD = process.cwd();

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.next', '.nuxt', '.svelte-kit', '.astro', 'dist',
  'build', 'out', 'coverage', 'vendor', '.cache', '.turbo', '.vercel',
  '.output', 'target', '.idea', '.vscode', '__pycache__', '_smoke',
]);
const TEXT_EXT = new Set([
  '.html', '.htm', '.xhtml', '.css', '.scss', '.sass', '.less', '.wxss',
  '.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.vue', '.svelte', '.astro',
  '.wxml', '.php', '.twig', '.erb',
]);
const HTML_EXT = /\.(html?|xhtml|vue|svelte|astro|php|twig|erb)$/i;
const CSS_EXT = /\.(css|scss|sass|less|wxss)$/i;
const JS_EXT = /\.(m?[jt]sx?|cjs|vue|svelte|astro)$/i;

const SEVERITY_RANK = { P0: 0, P1: 1, P2: 2 };
const CONFIDENCE_RANK = { high: 0, medium: 1, low: 2 };

const MOTION_RE =
  /(@keyframes\b|\btransition\s*:|\banimation\s*:|\brequestAnimationFrame\s*\(|\.animate\s*\(|setInterval\s*\()/;
const LAYOUT_PROP_RE = /\b(width|height|top|left|right|bottom|margin|padding|inset|font-size)\b/i;

/* ---------------------------------------------------------------------
   文件收集
   --------------------------------------------------------------------- */
function loadConfig() {
  const file = join(CWD, '.ui-audit.json');
  if (!existsSync(file)) return {};
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    console.error('[audit] 无法解析 .ui-audit.json，已忽略：' + err.message);
    return {};
  }
}

const config = loadConfig();
const disabledRules = new Set(config.disable || []);
const ignorePaths = (config.ignore || []).map((p) => p.replace(/\\/g, '/'));
const severityOverride = config.severity || {};

function shouldIgnore(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  return ignorePaths.some((part) => normalized.includes(part));
}

function collect(targets) {
  const files = [];
  const seen = new Set();

  function addFile(absolute) {
    if (seen.has(absolute)) return;
    seen.add(absolute);
    const rel = relative(CWD, absolute).replace(/\\/g, '/') || basename(absolute);
    if (shouldIgnore(rel)) return;
    const ext = extname(absolute).toLowerCase();
    if (!TEXT_EXT.has(ext)) return;
    if (/\.min\.(js|css)$/i.test(absolute)) return;

    let stat;
    try {
      stat = statSync(absolute);
    } catch (err) {
      return;
    }
    if (stat.size > 1.5 * 1024 * 1024) return;

    let content;
    try {
      content = readFileSync(absolute, 'utf8');
    } catch (err) {
      return;
    }
    if (looksMinified(content)) return;

    files.push({
      file: rel,
      abs: absolute,
      content,
      ext,
      kind: ext,
      html: HTML_EXT.test(ext),
      css: CSS_EXT.test(ext),
      js: JS_EXT.test(ext),
      jsx: /\.(jsx|tsx)$/i.test(ext),
    });
  }

  function walk(absolute) {
    const info = statSync(absolute);
    if (info.isFile()) {
      addFile(absolute);
      return;
    }
    if (!info.isDirectory()) return;
    let entries;
    try {
      entries = readdirSync(absolute, { withFileTypes: true });
    } catch (err) {
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        walk(join(absolute, entry.name));
      } else if (entry.isFile()) {
        addFile(join(absolute, entry.name));
      }
    }
  }

  for (const target of targets) {
    const absolute = resolve(CWD, target);
    if (!existsSync(absolute)) {
      console.error('[audit] 路径不存在：' + target);
      continue;
    }
    walk(absolute);
  }
  return files;
}

function looksMinified(content) {
  if (content.length < 2000) return false;
  const lines = content.split('\n');
  const sample = lines.slice(0, 30).join('\n').length;
  const avg = sample / Math.max(1, Math.min(30, lines.length));
  return avg > 600;
}

/* ---------------------------------------------------------------------
   跟随 HTML 的本地 CSS / JS 引用，避免「单文件扫描」漏掉全局降级
   --------------------------------------------------------------------- */
function expandDependencies(files) {
  const byAbs = new Map(files.map((f) => [f.abs, f]));
  const seen = new Set(files.map((f) => f.abs));
  const queue = files.slice();

  function addDep(from, item) {
    if (!from || !item || from === item) return;
    if (!from.dependencies) from.dependencies = [];
    if (from.dependencies.indexOf(item) === -1) from.dependencies.push(item);
  }

  function pushRef(from, ref) {
    if (!ref) return;
    if (/^(https?:)?\/\//.test(ref) || ref.startsWith('data:') || ref.startsWith('#')) return;
    const clean = ref.split('?')[0].split('#')[0];
    const abs = resolve(dirname(from.abs), clean);

    // 目标已在扫描集合里：仍然记录依赖关系（例如同时扫描了 templates 与 library）
    if (byAbs.has(abs)) {
      addDep(from, byAbs.get(abs));
      return;
    }
    if (!existsSync(abs)) return;
    let info;
    try {
      info = statSync(abs);
    } catch (err) {
      return;
    }
    if (!info.isFile() || info.size > 1.5 * 1024 * 1024) return;
    const ext = extname(abs).toLowerCase();
    if (!TEXT_EXT.has(ext)) return;
    let content;
    try {
      content = readFileSync(abs, 'utf8');
    } catch (err) {
      return;
    }
    if (looksMinified(content)) return;
    const rel = relative(CWD, abs).replace(/\\/g, '/');
    if (shouldIgnore(rel)) return;
    const item = {
      file: rel,
      abs,
      content,
      ext,
      kind: ext,
      html: HTML_EXT.test(ext),
      css: CSS_EXT.test(ext),
      js: JS_EXT.test(ext),
      jsx: /\.(jsx|tsx)$/i.test(ext),
      dependency: true,
    };
    seen.add(abs);
    byAbs.set(abs, item);
    files.push(item);
    queue.push(item);
    addDep(from, item);
  }

  while (queue.length) {
    const file = queue.pop();
    if (file.html) {
      eachMatch(file.content, /<link[^>]*>/gi, (m) => {
        if (!/stylesheet/i.test(m[0])) return null;
        const href = m[0].match(/href\s*=\s*["']([^"']+)["']/i);
        if (href) pushRef(file, href[1]);
        return null;
      });
      eachMatch(file.content, /<script[^>]*src\s*=\s*["']([^"']+)["']/gi, (m) => {
        pushRef(file, m[1]);
        return null;
      });
    }
    if (file.css) {
      eachMatch(file.content, /@import\s+(?:url\()?['"]?([^'")\s]+)['"]?\)?/gi, (m) => {
        pushRef(file, m[1]);
        return null;
      });
    }
  }
}

/* ---------------------------------------------------------------------
   定位与匹配工具
   --------------------------------------------------------------------- */
function locate(content, index) {
  const before = content.slice(0, Math.max(0, index));
  const line = before.split('\n').length;
  const lastBreak = before.lastIndexOf('\n');
  return { line, column: index - lastBreak };
}

function snippetAt(content, index) {
  const start = content.lastIndexOf('\n', Math.max(0, index)) + 1;
  let end = content.indexOf('\n', index);
  if (end === -1) end = content.length;
  const line = content.slice(start, end).trim().replace(/\s+/g, ' ');
  return line.length > 180 ? line.slice(0, 177) + '…' : line;
}

// HTML 里的文档/示例代码块不当作真实样式或脚本
function insideCode(content, index) {
  const before = content.slice(0, index);
  const preOpen = before.lastIndexOf('<pre');
  const preClose = before.lastIndexOf('</pre>');
  if (preOpen > preClose) return true;
  const codeOpen = before.lastIndexOf('<code');
  const codeClose = before.lastIndexOf('</code>');
  return codeOpen > codeClose;
}

function eachMatch(content, regex, mapper) {
  const out = [];
  regex.lastIndex = 0;
  let match;
  let guard = 0;
  while ((match = regex.exec(content)) !== null) {
    guard += 1;
    if (guard > 5000) break;
    out.push(mapper(match));
    if (match.index === regex.lastIndex) regex.lastIndex += 1;
  }
  return out;
}

function findKeyframeBlocks(content) {
  const blocks = [];
  const re = /@keyframes\s+[\w-]+\s*\{/g;
  let match;
  while ((match = re.exec(content)) !== null) {
    const open = content.indexOf('{', match.index);
    let depth = 0;
    let i = open;
    for (; i < content.length; i += 1) {
      if (content[i] === '{') depth += 1;
      else if (content[i] === '}') {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    blocks.push({
      index: match.index,
      body: content.slice(open + 1, i),
    });
    re.lastIndex = i + 1;
  }
  return blocks;
}

/* ---------------------------------------------------------------------
   规则定义
   --------------------------------------------------------------------- */
const rules = [];

function scanRule(rule) {
  rules.push({ type: 'scan', ...rule });
}
function projectRule(rule) {
  rules.push({ type: 'project', ...rule });
}

/* ---------- P0：可访问性硬约束 ---------- */

scanRule({
  id: 'a11y/clickable-div',
  title: '可点击容器缺少键盘语义',
  severity: 'P1',
  confidence: 'high',
  why: 'div / span 上的点击事件只服务鼠标；键盘用户无法聚焦或触发，读屏也不会播报为按钮。',
  fix: '优先换成 <button> / <a>；保留容器时补 role="button"、tabindex="0" 与 Enter/Space 键盘处理。',
  patterns: ['⑬', '㉓', '51'],
  kinds: ['html', 'jsx'],
  scan(content) {
    return eachMatch(
      content,
      /<(div|span|li|section|article)\b[^>]*(?:onclick|@click|v-on:click|on:click)\s*=[^>]*>/gi,
      (m) => {
        // 背景遮罩的「点空白关闭」不是控件
        if (
          /(modal|overlay|backdrop|mask)/i.test(m[0]) &&
          /(target\s*===\s*this|close\w*\s*\()/i.test(m[0])
        ) {
          return null;
        }
        if (/\brole\s*=|\btabindex\s*=/i.test(m[0])) {
          // 有语义但文件里完全没有键盘处理：降级为 P2，提示复核（可能由框架/父级绑定）
          if (/(keydown|keyup|onkeypress|@keydown|on:keydown)/i.test(content)) return null;
          return {
            index: m.index,
            severity: 'P2',
            confidence: 'medium',
            message: '有 role/tabindex，但文件内未见键盘处理',
          };
        }
        return { index: m.index };
      }
    ).filter(Boolean);
  },
});

scanRule({
  id: 'a11y/img-alt',
  title: '<img> 缺少 alt',
  severity: 'P1',
  confidence: 'high',
  why: '没有 alt 的图片在读屏中会被读成文件名或直接跳过，信息与装饰都失去了语义。',
  fix: '内容图写具体 alt；纯装饰图写 alt="" 或 aria-hidden="true"。',
  patterns: [],
  kinds: ['html', 'jsx'],
  scan(content) {
    return eachMatch(content, /<img\b[^>]*>/gi, (m) => {
      if (/\balt\s*=/i.test(m[0]) || /aria-hidden\s*=\s*["']true/i.test(m[0])) return null;
      return { index: m.index };
    }).filter(Boolean);
  },
});

scanRule({
  id: 'a11y/input-label',
  title: '表单控件没有可访问名称',
  severity: 'P1',
  confidence: 'medium',
  why: 'placeholder 不是 label：聚焦后提示消失，读屏也不会把它当作字段名。',
  fix: '用 <label for> 关联 id，或补 aria-label / aria-labelledby。',
  patterns: [],
  kinds: ['html', 'jsx'],
  scan(content) {
    return eachMatch(content, /<(input|textarea|select)\b[^>]*>/gi, (m) => {
      const tag = m[0];
      if (/type\s*=\s*["'](hidden|submit|button|reset|image)["']/i.test(tag)) return null;
      if (/\b(aria-label|aria-labelledby|id)\s*=/i.test(tag)) return null;
      // 被 <label>...</label> 包裹时视为有可访问名称
      const before = content.slice(Math.max(0, m.index - 600), m.index);
      const openLabel = before.lastIndexOf('<label');
      const closeLabel = before.lastIndexOf('</label>');
      if (openLabel > closeLabel) return null;
      return { index: m.index };
    }).filter(Boolean);
  },
});

scanRule({
  id: 'a11y/autoplay-media',
  title: '自动播放媒体未静音',
  severity: 'P1',
  confidence: 'high',
  why: '带声音的自动播放会被浏览器拦截，也会打断读屏和正在使用页面的人。',
  fix: '加 muted（或去掉 autoplay）；提供可见的播放/暂停按钮。',
  patterns: [],
  kinds: ['html', 'jsx'],
  scan(content) {
    return eachMatch(content, /<(video|audio)\b[^>]*\bautoplay\b[^>]*>/gi, (m) => {
      if (/\bmuted\b/i.test(m[0])) return null;
      return { index: m.index };
    }).filter(Boolean);
  },
});

scanRule({
  id: 'a11y/tabindex-positive',
  title: '正的 tabindex 打乱焦点顺序',
  severity: 'P2',
  confidence: 'high',
  why: 'tabindex > 0 会让元素跳到一个不自然的顺序，页面越大越难维护。',
  fix: '改为 tabindex="0"（可聚焦）或 "−1"（仅脚本聚焦），顺序交给 DOM。',
  patterns: [],
  kinds: ['html', 'jsx'],
  scan(content) {
    return eachMatch(content, /tabindex\s*=\s*["']([1-9]\d*)["']/gi, (m) => ({ index: m.index }));
  },
});

scanRule({
  id: 'a11y/target-blank',
  title: 'target="_blank" 未加 rel',
  severity: 'P2',
  confidence: 'high',
  why: '新标签页可以通过 window.opener 反向控制原页面；也是常见的审计项。',
  fix: '加 rel="noopener noreferrer"。',
  patterns: [],
  kinds: ['html', 'jsx'],
  scan(content) {
    return eachMatch(content, /<a\b[^>]*target\s*=\s*["']_blank["'][^>]*>/gi, (m) => {
      if (/rel\s*=\s*["'][^"']*noopener/i.test(m[0])) return null;
      return { index: m.index };
    }).filter(Boolean);
  },
});

projectRule({
  id: 'a11y/outline-none',
  title: '移除了焦点轮廓，但没有替代',
  severity: 'P1',
  confidence: 'high',
  why: 'outline: none 会让键盘用户失去当前位置；只补 :hover 不算替代。',
  fix: '改用 :focus-visible 提供清晰可见的焦点环；不要全局移除 outline。',
  patterns: [],
  project(files) {
    const hasFocusVisible = files.some((f) => /:focus-visible/.test(f.content));
    const out = [];
    for (const f of files) {
      eachMatch(f.content, /outline\s*:\s*(?:none|0)\b/gi, (m) => {
        out.push({
          file: f.file,
          content: f.content,
          index: m.index,
          severity: hasFocusVisible ? 'P2' : 'P1',
          message: hasFocusVisible
            ? '检测到 outline: none；项目中已有 :focus-visible，请确认覆盖到了这个元素。'
            : '检测到 outline: none，且项目中没有 :focus-visible 兜底。',
        });
        return null;
      });
    }
    return out;
  },
});

projectRule({
  id: 'a11y/reduced-motion',
  title: '有动效但没有 prefers-reduced-motion 降级',
  severity: 'P0',
  confidence: 'high',
  why: '前庭功能敏感的用户会因视差、缩放、抖动产生眩晕；这是交付硬约束，不是偏好。',
  fix: 'CSS 加 @media (prefers-reduced-motion: reduce) 静态版；JS 用 matchMedia 判断后直接落到 final state。',
  patterns: ['①', '⑤', '⑨', '㉒', '㊹'],
  project(files) {
    const hasReduced = (f) => /prefers-reduced-motion/.test(f.content);
    const projectHasReduced = files.some(hasReduced);
    const out = [];
    for (const f of files) {
      if (f.dependency) continue;
      if (!MOTION_RE.test(f.content)) continue;
      if (hasReduced(f)) continue;
      if ((f.dependencies || []).some(hasReduced)) continue;
      // JS 可能依赖全局 CSS 的 reduced 规则；有全局兜底时不单独报
      if (f.js && projectHasReduced) continue;
      out.push({
        file: f.file,
        content: f.content,
        index: Math.max(0, f.content.search(MOTION_RE)),
      });
    }
    return out;
  },
});

projectRule({
  id: 'a11y/custom-dialog',
  title: '自绘弹层缺少 dialog 语义',
  severity: 'P2',
  confidence: 'low',
  why: '自绘 modal 往往漏掉焦点陷阱、Esc、背景滚动锁和 aria-modal；这些正是原生 <dialog> 免费的。',
  fix: '迁移到 <dialog> + showModal()；保留自绘时补 role="dialog"、aria-modal、焦点管理、Esc 与滚动锁。',
  patterns: ['51', '50', '⑩'],
  project(files) {
    if (files.some((f) => /<dialog\b/i.test(f.content))) return [];
    const hit = files.find(
      (f) =>
        /class\s*=\s*["'][^"']*(modal|dialog|overlay)[^"']*["']/i.test(f.content) &&
        /position\s*:\s*fixed/i.test(f.content)
    );
    if (!hit) return [];
    const index = Math.max(
      0,
      hit.content.search(/class\s*=\s*["'][^"']*(modal|dialog|overlay)/i)
    );
    return [{ file: hit.file, content: hit.content, index }];
  },
});

/* ---------- 性能 ---------- */

scanRule({
  id: 'perf/transition-all',
  title: 'transition: all',
  severity: 'P2',
  confidence: 'high',
  why: 'all 会让无关属性一起变化，容易把布局属性也拖进动画，且很难定位性能问题。',
  fix: '只列真正要动的属性，例如 transform、opacity、background-color。',
  patterns: ['⑦'],
  kinds: ['style', 'html', 'jsx', 'js'],
  scan(content) {
    return eachMatch(content, /transition(?:-property)?\s*:\s*[^;{}]*\ball\b[^;{}]*;/gi, (m) => {
      if (insideCode(content, m.index)) return null;
      return { index: m.index };
    }).filter(Boolean);
  },
});

scanRule({
  id: 'perf/layout-animation',
  title: '动画/过渡包含布局属性',
  severity: 'P1',
  confidence: 'high',
  why: 'width / height / top / left / margin 每帧触发布局与绘制，低端机和大列表上会明显掉帧。',
  fix: '用 transform: translate / scale 替代位移与缩放；高度展开用 grid-template-rows 0fr→1fr（模式 53）。',
  patterns: ['①', '②', '⑦', '53'],
  kinds: ['style', 'html', 'jsx'],
  scan(content) {
    const out = [];
    eachMatch(content, /transition(?:-property)?\s*:\s*([^;{}]+);/gi, (m) => {
      if (insideCode(content, m.index)) return null;
      const props = m[1];
      if (LAYOUT_PROP_RE.test(props) && !/transform\s*:/.test(props)) {
        out.push({ index: m.index, message: 'transition 里出现了布局属性：' + props.trim() });
      }
      return null;
    });
    for (const block of findKeyframeBlocks(content)) {
      if (LAYOUT_PROP_RE.test(block.body)) {
        out.push({ index: block.index, message: '@keyframes 中直接动画布局属性' });
      }
    }
    return out;
  },
});

scanRule({
  id: 'perf/non-passive-scroll',
  title: '滚动 / 手势监听未声明 passive',
  severity: 'P1',
  confidence: 'medium',
  why: '非 passive 的 touchmove / wheel 会阻塞滚动；scroll 上的布局读取还会造成抖动。',
  fix: '只读监听加 { passive: true }；需要 preventDefault 时明确说明原因，并用 rAF 节流。',
  patterns: ['㉖', '㉗', '㉚'],
  kinds: ['js', 'html', 'jsx'],
  scan(content) {
    const out = [];
    eachMatch(content, /addEventListener\s*\(\s*['"](scroll|wheel|touchmove)['"]\s*,/gi, (m) => {
      const tail = content.slice(m.index, m.index + 600);
      if (!/passive\s*:\s*true/.test(tail)) {
        const which = m[1].toLowerCase();
        out.push({
          index: m.index,
          severity: which === 'scroll' ? 'P2' : 'P1',
          message: which + ' 监听没有 passive: true',
        });
      }
      return null;
    });
    return out;
  },
});

scanRule({
  id: 'perf/mousemove-throttle',
  title: '指针移动里直接写样式，没有 rAF 节流',
  severity: 'P2',
  confidence: 'medium',
  why: 'mousemove / pointermove 每秒可触发上百次；直接读布局再写 transform 会形成抖动。',
  fix: '用 requestAnimationFrame 合并到每帧一次；先读后写，或缓存 rect。',
  patterns: ['④', '⑨', '⑱'],
  kinds: ['js', 'html', 'jsx'],
  scan(content) {
    if (!/addEventListener\s*\(\s*['"](mousemove|pointermove)['"]/.test(content)) return [];
    if (!/\.style\.(transform|left|top)|\.style\.setProperty/.test(content)) return [];
    if (/requestAnimationFrame/.test(content)) return [];
    const index = content.search(/addEventListener\s*\(\s*['"](mousemove|pointermove)['"]/);
    return [{ index: Math.max(0, index) }];
  },
});

scanRule({
  id: 'perf/rect-in-handler',
  title: '滚动/指针处理里同步读布局',
  severity: 'P2',
  confidence: 'medium',
  why: '在 scroll / mousemove 里调用 getBoundingClientRect 且没有 rAF 合帧，会强制同步布局。',
  fix: '缓存 rect，resize 时重算；或用 rAF 把读取和写入分成两帧。',
  patterns: ['①', '⑨', '㉟'],
  kinds: ['js', 'html', 'jsx'],
  scan(content) {
    if (!/getBoundingClientRect/.test(content)) return [];
    if (!/addEventListener\s*\(\s*['"](scroll|mousemove|pointermove)['"]/.test(content)) return [];
    if (/requestAnimationFrame/.test(content)) return [];
    return [{ index: content.search(/getBoundingClientRect/) }];
  },
});

scanRule({
  id: 'perf/blur-heavy',
  title: 'backdrop-filter 模糊半径过大',
  severity: 'P2',
  confidence: 'high',
  why: '大面积 backdrop-filter 会持续重绘；移动端超过 ~24px 很容易掉帧。',
  fix: '降到 12–18px；移动端进一步降低或改半透明纯色；避免在滚动容器上叠 mix-blend-mode。',
  patterns: ['⑩'],
  kinds: ['style', 'html', 'jsx'],
  scan(content) {
    return eachMatch(
      content,
      /backdrop-filter\s*:\s*blur\(\s*(\d+(?:\.\d+)?)px/gi,
      (m) => {
        if (insideCode(content, m.index)) return null;
        if (parseFloat(m[1]) <= 24) return null;
        if (content.slice(Math.max(0, m.index - 8), m.index) === '-webkit-') return null;
        return { index: m.index, message: 'blur(' + m[1] + 'px) 偏重' };
      }
    ).filter(Boolean);
  },
});

scanRule({
  id: 'perf/blur-blend',
  title: 'blur 层上叠加 mix-blend-mode',
  severity: 'P2',
  confidence: 'medium',
  why: 'backdrop-filter 与混合模式叠加会显著增加合成开销，移动端常见掉帧点。',
  fix: '移动端去掉 mix-blend-mode，用普通透明度叠加；或把混合层与模糊层拆开。',
  patterns: ['⑩', '⑪', '⑳'],
  kinds: ['style', 'html', 'jsx'],
  scan(content) {
    return eachMatch(
      content,
      /[^{}]*\{[^{}]*(?:backdrop-filter[^{}]*mix-blend-mode|mix-blend-mode[^{}]*backdrop-filter)[^{}]*\}/gi,
      (m) => ({ index: m.index })
    );
  },
});

scanRule({
  id: 'perf/will-change',
  title: 'will-change 使用过宽',
  severity: 'P2',
  confidence: 'medium',
  why: 'will-change 会长期占用合成层；all 或大面积使用反而增加内存与绘制成本。',
  fix: '按需声明具体属性（transform / opacity），动画结束后移除，或只给少量关键元素。',
  patterns: [],
  kinds: ['style', 'html', 'jsx'],
  scan(content) {
    const out = [];
    eachMatch(content, /will-change\s*:\s*all/gi, (m) => {
      if (insideCode(content, m.index)) return null;
      out.push({ index: m.index, message: 'will-change: all' });
      return null;
    });
    const all = content.match(/will-change\s*:/gi) || [];
    if (!out.length && all.length > 8) {
      out.push({ index: content.search(/will-change\s*:/i), message: '同一文件出现 ' + all.length + ' 处 will-change' });
    }
    return out;
  },
});

scanRule({
  id: 'perf/interval-animation',
  title: '用 setInterval 驱动视觉更新',
  severity: 'P2',
  confidence: 'low',
  why: 'setInterval 与屏幕刷新不同步，容易抖动、堆积；后台标签页还会继续跑。',
  fix: '改用 requestAnimationFrame（或 CSS 动画）；必须轮询时在 visibilitychange 时暂停。',
  patterns: ['②', '③', '⑰'],
  kinds: ['js', 'html', 'jsx'],
  scan(content) {
    if (!/setInterval\s*\(/.test(content)) return [];
    if (!/\.style\.(transform|left|top|width|height|opacity)/.test(content)) return [];
    return [{ index: content.search(/setInterval\s*\(/) }];
  },
});

scanRule({
  id: 'perf/animate-shadow-filter',
  title: '过渡 box-shadow / filter',
  severity: 'P2',
  confidence: 'medium',
  why: '阴影与滤镜的过渡会触发重绘，元素多时比 transform / opacity 贵得多。',
  fix: '用伪元素预先画阴影并只过渡 opacity；滤镜动画尽量限制在单个小元素上。',
  patterns: ['⑩'],
  kinds: ['style', 'html', 'jsx'],
  scan(content) {
    return eachMatch(content, /transition(?:-property)?\s*:\s*([^;{}]+);/gi, (m) => {
      if (insideCode(content, m.index)) return null;
      if (/\b(box-shadow|filter|backdrop-filter)\b/i.test(m[1])) {
        return { index: m.index, message: '过渡属性：' + m[1].trim() };
      }
      return null;
    }).filter(Boolean);
  },
});

scanRule({
  id: 'motion/long-duration',
  title: '入场动效时长偏长',
  severity: 'P2',
  confidence: 'medium',
  why: '超过 1.5s 的入场会让用户等待；首屏关键信息更不该被动画拖住。',
  fix: '入场控制在 400–800ms；复杂叙事拆成多段，不要用一条长动画。',
  patterns: ['⑤', '②'],
  kinds: ['style', 'html', 'jsx'],
  scan(content) {
    return eachMatch(
      content,
      /(?:transition-duration|animation-duration)\s*:\s*([\d.]+)s/gi,
      (m) => {
        if (parseFloat(m[1]) <= 1.5) return null;
        return { index: m.index, message: m[1] + 's' };
      }
    ).filter(Boolean);
  },
});

scanRule({
  id: 'motion/linear-easing',
  title: '主交互使用 linear 缓动',
  severity: 'P2',
  confidence: 'low',
  why: 'linear 在 UI 里常显得机械；真实物体有加速与减速。（spinner / 进度条除外）',
  fix: '入场用 ease-out 系；弹簧用 cubic-bezier 或 linear() 采样；拖拽跟手阶段才用 linear。',
  patterns: ['⑦', '52'],
  kinds: ['style', 'html', 'jsx'],
  scan(content) {
    return eachMatch(
      content,
      /(?:transition\s*:\s*[^;{}]*\blinear\b[^;{}]*;|animation-timing-function\s*:\s*linear)/gi,
      (m) => {
        if (insideCode(content, m.index)) return null;
        if (/animation-timing-function/i.test(m[0])) return { index: m.index };
        // transition 简写要按逗号分层：只有「运动属性那一层」用 linear 才算问题
        var declaration = m[0].replace(/^transition\s*:\s*/i, '').replace(/;$/i, '');
        var layers = declaration.split(',');
        var mechanical = layers.some(function (layer) {
          return (
            /\blinear\b/i.test(layer) &&
            /(transform|translate|scale|rotate|\ball\b|\bwidth\b|\bheight\b|\bleft\b|\btop\b)/i.test(layer)
          );
        });
        if (!mechanical) return null;
        return { index: m.index };
      }
    ).filter(Boolean);
  },
});

scanRule({
  id: 'motion/list-hover-transform',
  title: '列表行 hover 位移动效',
  severity: 'P2',
  confidence: 'medium',
  why: '鼠标划过整列时每行都位移，视觉噪声大；列表项不应该抢注意力。',
  fix: '列表行只做颜色/背景反馈；把位移动效留给卡片或主 CTA。',
  patterns: [],
  kinds: ['style', 'html', 'jsx'],
  scan(content) {
    return eachMatch(content, /([^{}]*:hover[^{}]*)\{([^{}]*transform[^{}]*)\}/gi, (m) => {
      if (!/\b(li|tr|\.row|\.item|\.list-item)\b/i.test(m[1])) return null;
      return { index: m.index };
    }).filter(Boolean);
  },
});

scanRule({
  id: 'motion/hover-pointer-gate',
  title: '指针动效没有 hover/pointer 门控',
  severity: 'P1',
  confidence: 'medium',
  why: '磁吸、倾斜、自定义光标在触摸设备上坐标不稳定，必须用能力检测而不是屏幕宽度。',
  fix: "用 matchMedia('(hover: hover) and (pointer: fine)') 门控；触摸端给按压/静态替代。",
  patterns: ['④', '⑨', '⑱'],
  kinds: ['js', 'html', 'jsx'],
  scan(content) {
    // 只针对 hover 类指针效果；拖拽/滑动用 pointermove 是合理的
    if (!/(magnet|tilt|rotateX|rotateY|perspective|custom.?cursor|hover)/i.test(content)) return [];
    if (!/(mousemove|pointermove)/.test(content)) return [];
    if (/(hover:\s*hover|pointer:\s*fine|matchMedia)/.test(content)) return [];
    return [{ index: content.search(/mousemove|pointermove/) }];
  },
});

/* ---------- 移动端 / 手势 ---------- */

scanRule({
  id: 'mobile/touch-hijack',
  title: '用 preventDefault 劫持 touchmove / wheel',
  severity: 'P1',
  confidence: 'high',
  why: 'JS 手写滚动会丢掉原生惯性、回弹与无障碍滚动；还会与页面滚动打架。',
  fix: '优先原生滚动 + scroll-snap（㉖/㉘）；确需接管时限定在局部容器，并保留按钮替代入口。',
  patterns: ['㉖', '㉘', '㉚'],
  kinds: ['js', 'html', 'jsx'],
  scan(content) {
    const out = [];
    eachMatch(content, /addEventListener\s*\(\s*['"](touchmove|wheel)['"]/gi, (m) => {
      const tail = content.slice(m.index, m.index + 600);
      if (/preventDefault\s*\(/.test(tail)) {
        out.push({ index: m.index, message: m[1] + ' + preventDefault' });
      }
      return null;
    });
    return out;
  },
});

projectRule({
  id: 'mobile/no-touch-action',
  title: '拖拽交互没有声明 touch-action',
  severity: 'P1',
  confidence: 'medium',
  why: '触摸拖拽若不限制 touch-action，浏览器会把它当作页面滚动并触发 pointercancel。',
  fix: '拖拽面加 touch-action: none（或 pan-y），并监听 pointercancel 复位。',
  patterns: ['③', '㉗', '㉚', '㉛', '㊱'],
  project(files) {
    const globalHas = files.some((f) => /touch-action\s*:/.test(f.content));
    const out = [];
    for (const f of files) {
      if (f.dependency) continue;
      if (!/pointerdown/.test(f.content)) continue;
      if (!/(pointermove|setPointerCapture)/.test(f.content)) continue;
      const own = /touch-action\s*:/.test(f.content);
      const deps = (f.dependencies || []).some((d) => /touch-action\s*:/.test(d.content));
      // JS 可能依赖全局 CSS；HTML 内联脚本按自身判断，避免一个文件的 touch-action 掩盖另一个
      if (own || deps || (f.js && globalHas)) continue;
      out.push({
        file: f.file,
        content: f.content,
        index: f.content.search(/pointerdown/),
      });
    }
    return out;
  },
});

scanRule({
  id: 'mobile/no-pointercancel',
  title: '拖拽没有处理 pointercancel',
  severity: 'P1',
  confidence: 'medium',
  why: '来电、系统手势、滚动接管都会中断拖拽；不复位会留下半开状态。',
  fix: '监听 pointercancel，把位移/状态复位到安全位置；同时处理 pointerleave。',
  patterns: ['③', '㉗', '㉛', '㊲'],
  kinds: ['js', 'html', 'jsx'],
  scan(content) {
    if (!/pointerdown/.test(content)) return [];
    if (!/(pointermove|setPointerCapture)/.test(content)) return [];
    if (/pointercancel/.test(content)) return [];
    return [{ index: content.search(/pointerdown/) }];
  },
});

scanRule({
  id: 'mobile/input-font-zoom',
  title: '表单字号小于 16px',
  severity: 'P2',
  confidence: 'high',
  why: 'iOS Safari 聚焦小于 16px 的输入框会自动放大页面，打断填写。',
  fix: '输入类控件 font-size 至少 16px；视觉字号可以用 transform 或内层元素控制。',
  patterns: [],
  kinds: ['style', 'html', 'jsx'],
  scan(content) {
    const out = [];
    eachMatch(content, /([^{}]+)\{([^{}]*font-size\s*:\s*(\d+(?:\.\d+)?)px[^{}]*)\}/gi, (m) => {
      if (insideCode(content, m.index)) return null;
      if (!/(input|textarea|select)/i.test(m[1])) return null;
      if (parseFloat(m[3]) >= 16) return null;
      out.push({ index: m.index, message: m[1].trim().slice(0, 60) + ' → ' + m[3] + 'px' });
      return null;
    });
    return out;
  },
});

scanRule({
  id: 'mobile/100vh',
  title: '使用 100vh 而不是 100dvh',
  severity: 'P2',
  confidence: 'high',
  why: '移动端地址栏伸缩时 100vh 会溢出，底部按钮被顶出视口。',
  fix: '用 100dvh（保留 100vh 作 fallback），旋转/resize 后重新计算。',
  patterns: [],
  kinds: ['style', 'html', 'jsx'],
  scan(content) {
    if (/100dvh/.test(content)) return [];
    return eachMatch(content, /height\s*:\s*100vh/gi, (m) => {
      if (insideCode(content, m.index)) return null;
      return { index: m.index };
    }).filter(Boolean);
  },
});

/* ---------- 现代替代 ---------- */

scanRule({
  id: 'modern/max-height-accordion',
  title: '用 max-height 猜展开高度',
  severity: 'P2',
  confidence: 'high',
  why: 'max-height 是猜测值：内容变化会截断，动画时长也会因内容长短不稳定。',
  fix: '用 grid-template-rows: 0fr → 1fr（模式 53）或原生 <details>；新浏览器可用 interpolate-size。',
  patterns: ['53', '51'],
  kinds: ['style', 'html', 'jsx'],
  scan(content) {
    return eachMatch(content, /transition[^;{}]*max-height|max-height[^;{}]*transition/gi, (m) => {
      if (insideCode(content, m.index)) return null;
      return { index: m.index };
    }).filter(Boolean);
  },
});

projectRule({
  id: 'modern/custom-carousel',
  title: '手写 setInterval 轮播',
  severity: 'P2',
  confidence: 'medium',
  why: '定时翻页会抢走用户控制，且手写 transform 轮播丢掉惯性、回弹和边缘行为。',
  fix: '横向内容交给 scroll-snap（㉖/㉘），需要自动播放时提供暂停；指示点可用 56 兜底。',
  patterns: ['㉖', '㉘', '56', '14'],
  project(files) {
    const hit = files.find(
      (f) =>
        /setInterval\s*\(/.test(f.content) &&
        /(carousel|slider|swiper|banner|轮播)/i.test(f.content)
    );
    if (!hit) return [];
    if (files.some((f) => /scroll-snap/.test(f.content))) return [];
    return [
      {
        file: hit.file,
        content: hit.content,
        index: hit.content.search(/setInterval\s*\(/),
      },
    ];
  },
});

projectRule({
  id: 'modern/custom-popover',
  title: '手写 click-outside 弹层',
  severity: 'P2',
  confidence: 'low',
  why: '点击外部关闭通常漏掉 Esc、焦点返回、层叠上下文与屏幕阅读器语义。',
  fix: '优先 Popover API（51）；需要模态时用 <dialog>；定位交给锚点定位（54）。',
  patterns: ['51', '54', '50'],
  project(files) {
    const hit = files.find(
      (f) =>
        /document\.addEventListener\s*\(\s*['"]click['"]/.test(f.content) &&
        /\.contains\s*\([^)]*target/.test(f.content)
    );
    if (!hit) return [];
    if (files.some((f) => /\bpopover\b|showPopover|anchor-name|position-anchor/.test(f.content))) {
      return [];
    }
    return [
      {
        file: hit.file,
        content: hit.content,
        index: hit.content.search(/document\.addEventListener\s*\(\s*['"]click['"]/),
      },
    ];
  },
});

projectRule({
  id: 'anti/invisible-reveal',
  title: '渐入元素默认 opacity:0，存在不可见风险',
  severity: 'P1',
  confidence: 'low',
  why: '如果 JS 失败、脚本被拦截，或元素在观察器建立后才动态创建，内容会永久隐形。',
  fix: '只在 JS 就绪时添加隐藏类（如 html.mk-js）；把观察器挂在静态父容器；提供 reduced-motion 与失败兜底。',
  patterns: ['②', '49'],
  project(files) {
    const hit = files.find((f) =>
      /\.(?:reveal|rv|fade-in|fadein)\b[^{}]*\{[^{}]*opacity\s*:\s*0/i.test(f.content)
    );
    if (!hit) return [];
    if (files.some((f) => /prefers-reduced-motion/.test(f.content))) return [];
    return [
      {
        file: hit.file,
        content: hit.content,
        index: hit.content.search(/\.(?:reveal|rv|fade-in|fadein)\b[^{}]*\{/i),
      },
    ];
  },
});

/* ---------------------------------------------------------------------
   执行
   --------------------------------------------------------------------- */
function runRules(files) {
  const findings = [];
  const seen = new Set();
  const dependencyFiles = new Set(
    files.filter((f) => f.dependency).map((f) => f.file)
  );

  function push(rule, hit) {
    const severity = severityOverride[rule.id] || hit.severity || rule.severity;
    const loc = locate(hit.content, hit.index);
    const key = rule.id + '|' + hit.file + '|' + loc.line;
    if (seen.has(key)) return;
    seen.add(key);
    findings.push({
      rule: rule.id,
      title: rule.title,
      severity,
      confidence: hit.confidence || rule.confidence,
      file: hit.file,
      line: loc.line,
      column: loc.column,
      snippet: snippetAt(hit.content, hit.index),
      message: hit.message || '',
      why: rule.why,
      fix: rule.fix,
      patterns: rule.patterns || [],
    });
  }

  for (const rule of rules) {
    if (disabledRules.has(rule.id)) continue;

    if (rule.type === 'project') {
      let hits = [];
      try {
        hits = rule.project(files) || [];
      } catch (err) {
        console.error('[audit] 规则执行失败 ' + rule.id + ': ' + err.message);
      }
      for (const hit of hits) {
        // 依赖文件只用于全局判断（是否已有 reduced-motion / focus-visible 等），不在报告里单独列出
        if (hit.file && dependencyFiles.has(hit.file)) continue;
        push(rule, hit);
      }
      continue;
    }

    for (const file of files) {
      if (file.dependency) continue;
      const kind = file.css ? 'style' : file.html ? 'html' : file.jsx ? 'jsx' : file.js ? 'js' : 'html';
      if (rule.kinds && !rule.kinds.includes(kind)) continue;
      let hits = [];
      try {
        hits = rule.scan(file.content, file.file) || [];
      } catch (err) {
        console.error('[audit] 规则执行失败 ' + rule.id + ' @ ' + file.file + ': ' + err.message);
      }
      for (const hit of hits) {
        if (hit == null) continue;
        push(rule, { ...hit, file: file.file, content: file.content });
      }
    }
  }

  findings.sort((a, b) => {
    return (
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
      CONFIDENCE_RANK[a.confidence] - CONFIDENCE_RANK[b.confidence] ||
      a.file.localeCompare(b.file) ||
      a.line - b.line
    );
  });

  return findings;
}

/* ---------------------------------------------------------------------
   输出
   --------------------------------------------------------------------- */
function statsOf(findings) {
  return findings.reduce(
    (acc, f) => {
      acc[f.severity] = (acc[f.severity] || 0) + 1;
      return acc;
    },
    { P0: 0, P1: 0, P2: 0 }
  );
}

function toMarkdown(findings, scannedCount) {
  const stats = statsOf(findings);
  const lines = [];
  lines.push('# UI 交互体检报告');
  lines.push('');
  lines.push(
    '> 扫描 ' +
      scannedCount +
      ' 个文件，发现 ' +
      findings.length +
      ' 项。P0 ' +
      stats.P0 +
      ' · P1 ' +
      stats.P1 +
      ' · P2 ' +
      stats.P2 +
      '。'
  );
  lines.push('>');
  lines.push(
    '> 启发式扫描，只提供 file:line 级证据；每条都需要人工或运行复核后才算结论。'
  );
  lines.push('> 无截图 / 无真实运行 → 不做视觉评分。');
  lines.push('');
  lines.push('## 摘要');
  lines.push('');
  lines.push('| 级别 | 数量 | 含义 |');
  lines.push('| --- | --- | --- |');
  lines.push('| P0 | ' + stats.P0 + ' | 阻断交付：可访问性/永久不可见/明显错误 |');
  lines.push('| P1 | ' + stats.P1 + ' | 应优先修复：性能、手感、触摸兼容 |');
  lines.push('| P2 | ' + stats.P2 + ' | 优化项：现代替代、可维护性、细节 |');
  lines.push('');

  let currentSeverity = null;
  for (const f of findings) {
    if (f.severity !== currentSeverity) {
      currentSeverity = f.severity;
      lines.push('## ' + currentSeverity);
      lines.push('');
    }
    lines.push('### [' + f.severity + '] ' + f.title);
    lines.push('');
    lines.push('- 规则：`' + f.rule + '` · 置信度：' + f.confidence);
    lines.push('- 位置：`' + f.file + ':' + f.line + '`');
    lines.push('- 证据：`' + f.snippet.replace(/`/g, '\\`') + '`');
    if (f.message) lines.push('- 说明：' + f.message);
    lines.push('- 为什么：' + f.why);
    lines.push('- 建议：' + f.fix);
    if (f.patterns.length) lines.push('- 相关模式：' + f.patterns.join(' · '));
    lines.push('');
  }

  if (!findings.length) {
    lines.push('没有命中静态规则。仍建议按 `AUDIT.md` 的清单做人工复核。');
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('下一步：按 `AUDIT.md` §4 / §6 选出 3–5 个「信息价值高、风险可控」的改动，再交给 `DEMO.md` 生成 Before/After。');
  lines.push('');
  return lines.join('\n');
}

/* ---------------------------------------------------------------------
   CLI
   --------------------------------------------------------------------- */
function parseArgs(argv) {
  const out = { targets: [], json: false, out: null, failOn: null, quiet: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') out.json = true;
    else if (arg === '--quiet') out.quiet = true;
    else if (arg === '--out') out.out = argv[++i];
    else if (arg === '--fail-on') out.failOn = (argv[++i] || '').toUpperCase();
    else if (arg === '--help' || arg === '-h') out.help = true;
    else if (arg === '--version' || arg === '-v') out.version = true;
    else if (!arg.startsWith('-')) out.targets.push(arg);
    else console.error('[audit] 未知参数：' + arg);
  }
  return out;
}

function help() {
  return [
    'UI 交互体检器 v' + VERSION,
    '',
    '用法：',
    '  node scripts/audit.mjs <文件或目录...> [选项]',
    '',
    '选项：',
    '  --json            输出 JSON（默认 Markdown）',
    '  --out <file>      写入文件；不写则打印到 stdout',
    '  --fail-on p0|p1   出现对应级别及以上问题时退出码 1',
    '  --quiet           只打印摘要',
    '  -h, --help        帮助',
    '  -v, --version     版本',
    '',
    '配置 .ui-audit.json：',
    '  { "disable": ["rule/id"], "ignore": ["vendor/"], "severity": { "rule/id": "P2" } }',
    '',
    '只扫源码；node_modules / dist / build / 视频与截图目录默认跳过。',
  ].join('\n');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(help());
    return;
  }
  if (args.version) {
    console.log(VERSION);
    return;
  }

  const targets = args.targets.length ? args.targets : ['.'];
  const files = collect(targets);
  expandDependencies(files);
  const findings = runRules(files);
  const stats = statsOf(findings);

  const report = args.json
    ? JSON.stringify(
        {
          meta: {
            version: VERSION,
            cwd: CWD,
            scannedFiles: files.length,
            generatedAt: new Date().toISOString(),
          },
          stats,
          findings,
        },
        null,
        2
      )
    : toMarkdown(findings, files.length);

  if (args.out) {
    const outFile = resolve(CWD, args.out);
    mkdirSync(dirname(outFile), { recursive: true });
    writeFileSync(outFile, report, 'utf8');
    console.log(
      '[audit] ' +
        files.length +
        ' 文件 · ' +
        findings.length +
        ' 项（P0 ' +
        stats.P0 +
        ' / P1 ' +
        stats.P1 +
        ' / P2 ' +
        stats.P2 +
        '）→ ' +
        args.out
    );
  } else if (args.quiet) {
    console.log(
      '[audit] ' +
        files.length +
        ' 文件 · ' +
        findings.length +
        ' 项（P0 ' +
        stats.P0 +
        ' / P1 ' +
        stats.P1 +
        ' / P2 ' +
        stats.P2 +
        '）'
    );
  } else {
    console.log(report);
  }

  if (args.failOn && SEVERITY_RANK[args.failOn] != null) {
    const threshold = SEVERITY_RANK[args.failOn];
    if (findings.some((f) => SEVERITY_RANK[f.severity] <= threshold)) {
      process.exitCode = 1;
    }
  }
}

main();
