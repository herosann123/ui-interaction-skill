#!/usr/bin/env node
/* =========================================================================
   ui-interaction-skill · 改版 Demo 脚手架
   生成一个可运行的 Before/After 目录：
     ui-runs/<日期-slug>/
       index.html        对照壳（Before / After / Split）
       before.html       原页面
       after.html        改版页面
       assets/           motion-kit.css / motion-kit.js
       manifest.json     本次改版元数据
       CHANGELOG.md      v1 记录
       NOTES.md          交付前待办

   用法：
     node scripts/new-demo.mjs --name checkout-refresh --title "结算页改版"
     node scripts/new-demo.mjs --name hero-test --template hero --before ./old.html
     node scripts/new-demo.mjs --name x --after ./new.html --patterns "①,⑤,④"
   ========================================================================= */

import {
  existsSync,
  mkdirSync,
  copyFileSync,
  readFileSync,
  writeFileSync,
  statSync,
  readdirSync,
} from 'node:fs';
import { basename, dirname, join, resolve, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { selectFindings, briefMarkdown } from './lib/select.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CWD = process.cwd();
const VERSION = '1.0.0';

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') out.help = true;
    else if (arg === '--force') out.force = true;
    else if (arg === '--single') out.single = true;
    else if (arg.startsWith('--')) {
      const key = arg.slice(2);
      out[key] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    } else if (!out._) out._ = arg;
  }
  return out;
}

function help() {
  return [
    '改版 Demo 脚手架 v' + VERSION,
    '',
    '用法：',
    '  node scripts/new-demo.mjs --name <slug> [选项]',
    '',
    '选项：',
    '  --name <slug>        本次改版标识（默认 demo-<时间戳>）',
    '  --title <文本>       对照壳标题（默认「UI 改版对照」）',
    '  --template <名称>    模板：demo-shell（默认）/ hero / feature-grid /',
    '                       ai-chat / mobile-feed / mobile-detail / dashboard',
    '  --after <file>       直接指定改版后页面（覆盖 --template）',
    '  --before <file>      直接指定改版前页面',
    '  --out <dir>          输出目录（默认 ui-runs/<日期-slug>）',
    '  --blank              生成空白 before/after 骨架（推荐交付用）',
    '  --from-audit <json>  从 audit --json 结果自动选 3–5 项，生成 BRIEF.md',
    '  --max <n>            从体检里最多选几项（默认 5）',
    '  --patterns <文本>    本次使用的模式，如 "①,⑤,④,⑬"',
    '  --files <文本>       变更文件说明（写进 manifest）',
    '  --single             额外生成 before.standalone.html / after.standalone.html',
    '  --force              允许写入已存在的目录（不删除未知文件）',
    '  --help               帮助',
    '',
    '示例：',
    '  node scripts/new-demo.mjs --name northwind --title "Northwind 改版"',
  ].join('\n');
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

function slugify(value) {
  const slug = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'demo-' + Date.now();
}

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function copyFile(from, to) {
  ensureDir(dirname(to));
  copyFileSync(from, to);
}

function readText(file) {
  return readFileSync(file, 'utf8');
}

function writeText(file, content) {
  ensureDir(dirname(file));
  writeFileSync(file, content, 'utf8');
}

function rewriteAssets(html) {
  return html
    .replace(/\.\.\/\.\.\/library\//g, 'assets/')
    .replace(/\.\.\/library\//g, 'assets/')
    .replace(/(['"(])library\/(motion-kit\.(?:css|js))/g, '$1assets/$2');
}

function templatePath(name) {
  if (!name) return null;
  const asFile = resolve(CWD, name);
  if (existsSync(asFile) && statSync(asFile).isFile()) return asFile;
  const asTemplate = join(ROOT, 'templates', name, 'index.html');
  if (existsSync(asTemplate)) return asTemplate;
  return null;
}

function placeholderBefore(safeTitle) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Before · ${safeTitle}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    display: grid; min-height: 100dvh; place-items: center; padding: 32px;
    background: #f2efe8; color: #1b1813; text-align: center;
    font-family: Inter, "PingFang SC", "Microsoft YaHei", sans-serif;
  }
  main { max-width: 560px; padding: 40px; border: 1px dashed rgba(27,24,19,.25); border-radius: 20px; background: #fffdf8; }
  h1 { font: 500 34px/1.1 "Iowan Old Style", "Songti SC", serif; letter-spacing: -.03em; }
  p { margin-top: 14px; color: #756e62; font-size: 14px; line-height: 1.6; }
  code { padding: 2px 6px; border-radius: 5px; background: rgba(27,24,19,.07); font-family: ui-monospace, monospace; font-size: 12px; }
</style>
</head>
<body>
  <main>
    <h1>把原页面放到这里</h1>
    <p>这是 <code>--before</code> 未提供时生成的占位页。把用户的原页面复制为 <code>before.html</code>，或在生成时传入 <code>--before ./old.html</code>。</p>
    <p>对照壳会原样加载它；不要在 before 里混入改版代码。</p>
  </main>
</body>
</html>
`;
}

function placeholderAfter(title) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>After · ${title}</title>
<link rel="stylesheet" href="assets/motion-kit.css">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    display: grid; min-height: 100dvh; place-items: center; padding: 32px;
    background: #f4f1e8; color: #1a1712; text-align: center;
    font-family: Inter, "PingFang SC", "Microsoft YaHei", sans-serif;
  }
  main { max-width: 620px; padding: 44px; border: 1px solid rgba(26,23,18,.14); border-radius: 22px; background: #fffdf8; box-shadow: 0 20px 60px rgba(26,23,18,.08); }
  .eyebrow { color: #b85940; font-family: ui-monospace, monospace; font-size: 10px; letter-spacing: .14em; }
  h1 { margin-top: 16px; font: 500 38px/1.05 "Iowan Old Style", "Songti SC", serif; letter-spacing: -.03em; }
  p { margin-top: 14px; color: #756e62; font-size: 14px; line-height: 1.65; }
  .actions { display: flex; justify-content: center; gap: 10px; margin-top: 24px; flex-wrap: wrap; }
</style>
<script>
  document.documentElement.classList.add('mk-js');
  setTimeout(function () { if (!window.MotionKit) document.documentElement.classList.remove('mk-js'); }, 2500);
</script>
</head>
<body>
  <main data-reveal>
    <p class="eyebrow">AFTER / BLANK</p>
    <h1>把改版后页面放到这里</h1>
    <p>这是空白骨架。把模板内容或用户的新页面写入 <code>after.html</code>，保留 before 的文案与信息结构；只改交互、层级与质感。</p>
    <div class="actions">
      <button type="button" class="mk-btn mk-btn--primary" data-ripple data-haptic="tap" data-toast="motion-kit 已加载">测试 motion-kit</button>
      <a class="mk-btn mk-btn--ghost" href="index.html">返回对照壳</a>
    </div>
  </main>
  <script src="assets/motion-kit.js" defer><\/script>
</body>
</html>
`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(help());
    return;
  }

  const name = args.name && args.name !== true ? String(args.name) : 'demo-' + Date.now();
  const slug = slugify(name);
  const title = args.title && args.title !== true ? String(args.title) : 'UI 改版对照';
  const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const templateName = args.template && args.template !== true ? String(args.template) : 'demo-shell';
  const outDir = resolve(
    CWD,
    args.out && args.out !== true ? String(args.out) : join('ui-runs', timestamp() + '-' + slug)
  );

  if (existsSync(outDir) && !args.force) {
    console.error('[new-demo] 目录已存在：' + relative(CWD, outDir));
    console.error('           换一个 --name，或加 --force（不会删除未知文件）。');
    process.exitCode = 1;
    return;
  }
  ensureDir(outDir);
  ensureDir(join(outDir, 'assets'));

  // 1. 库资产
  copyFile(join(ROOT, 'library', 'motion-kit.css'), join(outDir, 'assets', 'motion-kit.css'));
  copyFile(join(ROOT, 'library', 'motion-kit.js'), join(outDir, 'assets', 'motion-kit.js'));

  // 2. before / after / shell
  let shellSource;
  let afterSource;
  let beforeSource;

  if (args.blank) {
    shellSource = join(ROOT, 'templates', 'demo-shell', 'index.html');
    beforeSource = args.before && args.before !== true ? resolve(CWD, String(args.before)) : null;
    afterSource = null;
  } else if (templateName === 'demo-shell' && !args.after) {
    shellSource = join(ROOT, 'templates', 'demo-shell', 'index.html');
    beforeSource = args.before && args.before !== true
      ? resolve(CWD, String(args.before))
      : join(ROOT, 'templates', 'demo-shell', 'before.html');
    afterSource = join(ROOT, 'templates', 'demo-shell', 'after.html');
  } else {
    shellSource = join(ROOT, 'templates', 'demo-shell', 'index.html');
    afterSource = args.after && args.after !== true
      ? resolve(CWD, String(args.after))
      : templatePath(templateName);
    beforeSource = args.before && args.before !== true
      ? resolve(CWD, String(args.before))
      : null;
  }

  if (afterSource && !existsSync(afterSource)) {
    console.error('[new-demo] 找不到 after 模板：' + templateName);
    console.error('           可用模板：demo-shell / hero / feature-grid / ai-chat / mobile-feed / mobile-detail / dashboard');
    process.exitCode = 1;
    return;
  }
  if (beforeSource && !existsSync(beforeSource)) {
    console.error('[new-demo] 找不到 before 文件：' + beforeSource);
    process.exitCode = 1;
    return;
  }

  let shell = readText(shellSource);
  shell = shell
    .replace('<title>改版对照 · Northwind Analytics</title>', '<title>改版对照 · ' + safeTitle + '</title>')
    .replace('Northwind Analytics · 改版对照', safeTitle + ' · 改版对照')
    .replace('ui-interaction-skill · demo shell', 'ui-interaction-skill · ' + slug);

  // 生成目录不携带示例说明：统一留出待填结构，避免用户把 Northwind 文案当成自己的改动
  if (true) {
    const placeholderList = `<ol class="notes__list">
        <li class="change">
          <span class="change__num">01</span>
          <div>
            <b>待填写：第一处改动</b>
            <p><code>模式编号</code> + 改了什么 + 为什么 + 用户能感知到的收益。</p>
          </div>
        </li>
      </ol>`;
    const placeholderRemoved = `<div class="notes__section">已移除 / 已修复</div>
      <ul class="removed">
        <li>待填写：从体检报告里选了哪些项、删了什么、补了什么。</li>
      </ul>`;
    shell = shell
      .replace(/<ol class="notes__list">[\s\S]*?<\/ol>/, placeholderList)
      .replace(
        /<div class="notes__section">已移除 \/ 已修复<\/div>\s*<ul class="removed">[\s\S]*?<\/ul>/,
        placeholderRemoved
      );
  }

  writeText(join(outDir, 'index.html'), shell);

  let afterHtml = afterSource
    ? rewriteAssets(readText(afterSource))
    : placeholderAfter(safeTitle);
  afterHtml = afterHtml.replace(/<title>[\s\S]*?<\/title>/i, '<title>After · ' + safeTitle + '</title>');
  writeText(join(outDir, 'after.html'), afterHtml);

  if (beforeSource) {
    writeText(join(outDir, 'before.html'), rewriteAssets(readText(beforeSource)));
  } else {
    writeText(join(outDir, 'before.html'), placeholderBefore(safeTitle));
  }

  // 3. manifest
  let patterns = args.patterns && args.patterns !== true
    ? String(args.patterns).split(/[,，\s]+/).filter(Boolean)
    : [];
  let briefText = null;
  let auditSource = null;
  if (args['from-audit'] && args['from-audit'] !== true) {
    const auditPath = resolve(CWD, String(args['from-audit']));
    if (!existsSync(auditPath)) {
      console.error('[new-demo] 找不到 audit JSON：' + args['from-audit']);
      process.exitCode = 1;
      return;
    }
    const report = JSON.parse(readText(auditPath));
    const selected = selectFindings(report.findings || report, {
      max: parseInt(args.max, 10) || 5,
    });
    if (!patterns.length) {
      patterns = Array.from(
        new Set(selected.flatMap(function (f) { return f.patterns || []; }))
      );
    }
    briefText = briefMarkdown(selected, { title: title });
    auditSource = relative(CWD, auditPath).replace(/\\/g, '/');
    writeText(join(outDir, 'BRIEF.md'), briefText);
  }
  const manifest = {
    version: 1,
    name: slug,
    title,
    createdAt: new Date().toISOString(),
    template: templateName,
    source: {
      after: afterSource ? relative(CWD, afterSource).replace(/\\/g, '/') : null,
      before: beforeSource ? relative(CWD, beforeSource).replace(/\\/g, '/') : null,
      audit: auditSource,
    },
    patterns,
    files: [
      'index.html',
      'before.html',
      'after.html',
      'assets/motion-kit.css',
      'assets/motion-kit.js',
    ].concat(briefText ? ['BRIEF.md'] : []),
    notes: args.files && args.files !== true ? String(args.files) : '',
    status: 'draft',
    versions: [{ version: 1, at: new Date().toISOString(), changes: ['初始改版 Demo'] }],
  };
  writeText(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

  // 4. changelog / notes
  writeText(
    join(outDir, 'CHANGELOG.md'),
    `# CHANGELOG · ${title}

> 每次按用户反馈修改后追加一条；修改前把当前 \`after.html\` 复制到 \`versions/after-vN.html\`。

## v1 · ${new Date().toISOString().slice(0, 10)}

- 从模板 \`${templateName}\` 初始化
- 本次范围：${patterns.length ? patterns.join(' / ') : '待填写'}
- 对照壳：\`index.html\`（Before / After / Split）

## 待办

- [ ] 把 before.html 换成用户真实内容
- [ ] 把 after.html 的文案 / 品牌替换为用户真实内容
- [ ] 更新 index.html 右侧「改动说明」，写清改了什么、为什么
- [ ] 跑 \`node scripts/audit.mjs <用户源码> \` 对照修复项
- [ ] 检查 reduced-motion、键盘、390px 视口
`
  );

  writeText(
    join(outDir, 'NOTES.md'),
    `# 交付笔记 · ${title}

- 生成时间：${new Date().toISOString()}
- 模板：${templateName}
- 目录：\`${relative(CWD, outDir).replace(/\\/g, '/')}\`

## 在浏览器打开

直接双击 \`index.html\`（无需构建）。快捷键：\`1/2/3\` 切换 Before / After / Split，\`D\` 切换 390px，\`N\` 开关改动说明。

## 交付前自检

1. Before 与 After 使用同一份文案与信息层级（只改交互 / 质感）。
2. After 在 390px 与桌面都无横向溢出；输入字号 ≥16px。
3. 所有动效有 \`prefers-reduced-motion\` 静态版。
4. 弹层 / 抽屉 / Tab 可用键盘操作，Esc 可关闭。
5. 对照壳「改动说明」与 manifest 的 patterns 一致。
6. 完成后把 manifest.status 改为 \`review\`，收集反馈后进入 \`ITERATE.md\` 流程。
`
  );

  // 5. optional standalone
  if (args.single) {
    const bundle = join(ROOT, 'scripts', 'bundle-demo.mjs');
    if (existsSync(bundle)) {
      ['before', 'after'].forEach(function (name) {
        const input = join(outDir, name + '.html');
        const output = join(outDir, name + '.standalone.html');
        const result = spawnSync(
          process.execPath,
          [bundle, '--in', input, '--out', output],
          { stdio: 'inherit' }
        );
        if (result.status !== 0) process.exitCode = 1;
      });
    }
  }

  if (!args.blank && !args.before && !args.after) {
    console.log('[new-demo] 提示：当前 before/after 含模板示例内容；');
    console.log('           交付前请替换文案与品牌，或使用 --blank 生成空白骨架。');
  }
  console.log('[new-demo] 已生成：' + relative(CWD, outDir));
  console.log('           打开 index.html 查看 Before / After / Split');
  console.log('           下一步：替换内容 → 更新改动说明 → 按 ITERATE.md 收集反馈');
}

main();
