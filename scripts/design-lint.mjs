#!/usr/bin/env node
/* 设计层静态检查：tokens 对比度 / type scale / spacing / CJK fallback /
   组件状态选择器 / design.json 合法性。
   用法：
     node scripts/design-lint.mjs [--json] [--quiet] [--brief design.json]
*/
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const findings = [];

function read(rel) {
  return readFileSync(resolve(ROOT, rel), 'utf8');
}

function add(severity, rule, message, file) {
  findings.push({ severity, rule, message, file });
}

function hexToRgb(hex) {
  if (typeof hex !== 'string') return null;
  let value = hex.trim().replace('#', '');
  if (value.length === 3) value = value.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(value)) return null;
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function luminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const channel = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  if (la == null || lb == null) return 0;
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function parseArgs(argv) {
  const out = { json: false, quiet: false, brief: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') out.json = true;
    else if (arg === '--quiet') out.quiet = true;
    else if (arg === '--brief') out.brief = argv[++i];
    else if (arg === '--help' || arg === '-h') out.help = true;
  }
  return out;
}

function validateTokens(tokens) {
  const scale = tokens.typeScale || {};
  const ratio = Number(scale.ratio);
  if (!(ratio >= 1.2 && ratio <= 1.35)) {
    add('P1', 'design/type-scale', 'typeScale.ratio 应在 1.2–1.35，当前 ' + ratio);
  }
  const sizes = Object.keys(scale.sizes || {});
  if (sizes.length > 7) {
    add('P1', 'design/type-scale', '字号层级 ' + sizes.length + ' 级，应 ≤7');
  }

  for (const [name, steps] of Object.entries(tokens.spacing || {})) {
    if (!Array.isArray(steps) || steps.length !== 7) {
      add('P2', 'design/spacing', name + ' spacing 应为 7 级');
      continue;
    }
    for (let i = 1; i < steps.length; i += 1) {
      if (!(steps[i] > steps[i - 1])) {
        add('P1', 'design/spacing', name + ' spacing 不是严格递增');
        break;
      }
    }
  }

  const layout = tokens.layout || {};
  if (Number(layout.touchTarget) < 44) {
    add('P1', 'design/touch', 'touchTarget 应 ≥44');
  }
  if (!(Number(layout.proseCh) >= 45 && Number(layout.proseCh) <= 75)) {
    add('P1', 'design/prose', 'proseCh 应在 45–75');
  }
  if (Number(layout.maxHierarchy) > 4) {
    add('P1', 'design/hierarchy', 'maxHierarchy 应 ≤4');
  }

  for (const [name, a] of Object.entries(tokens.archetypes || {})) {
    const file = 'design-core/tokens.json';
    const inkBg = contrast(a.ink, a.bg);
    if (inkBg < 4.5) {
      add('P0', 'design/contrast', name + ' ink/bg 对比 ' + inkBg.toFixed(2) + ':1，需 ≥4.5');
    }
    const mutedBg = contrast(a.muted, a.bg);
    if (mutedBg < 4.5) {
      add('P1', 'design/contrast', name + ' muted/bg 对比 ' + mutedBg.toFixed(2) + ':1，需 ≥4.5');
    }
    const accentInk = contrast(a.accentInk, a.accent);
    if (accentInk < 4.5) {
      add('P0', 'design/contrast', name + ' accentInk/accent 对比 ' + accentInk.toFixed(2) + ':1，需 ≥4.5');
    }
    const accentBg = contrast(a.accent, a.bg);
    if (accentBg < 3) {
      add('P1', 'design/contrast', name + ' accent/bg 对比 ' + accentBg.toFixed(2) + ':1，需 ≥3（大字/UI）');
    }
    const fontText = JSON.stringify(a.fonts || {});
    if (!/(PingFang SC|Noto (Sans|Serif) SC|Songti SC)/.test(fontText)) {
      add('P2', 'design/cjk-fallback', name + ' 字体栈缺少明确 CJK fallback');
    }
    void file;
  }
}

function validateComponentStates() {
  const sharedCss = existsSync(resolve(ROOT, 'components/components.css'))
    ? read('components/components.css')
    : '';
  const checks = [
    {
      file: 'components/buttons.html',
      need: ['mk-btn--primary', 'disabled', 'mk-btn--ghost'],
      rule: 'design/component-states',
      label: 'buttons 缺少状态/变体',
    },
    {
      file: 'components/forms.html',
      need: ['aria-invalid', 'error', 'focus-visible'],
      rule: 'design/component-states',
      label: 'forms 缺少错误/焦点状态',
    },
    {
      file: 'components/feedback.html',
      need: ['empty', 'alert--error', 'alert--success', 'aria-live'],
      rule: 'design/component-states',
      label: 'feedback 缺少空/错误/成功/播报状态',
    },
    {
      file: 'components/navigation.html',
      need: ['role="tab"', 'aria-selected', 'aria-current'],
      rule: 'design/component-states',
      label: 'navigation 缺少 tab/current 语义',
    },
    {
      file: 'components/data.html',
      need: ['data-counter', 'tabular-nums'],
      rule: 'design/component-states',
      label: 'data 缺少计数/tabular 数字',
    },
  ];
  for (const check of checks) {
    if (!existsSync(resolve(ROOT, check.file))) {
      add('P1', check.rule, '缺少组件文件 ' + check.file);
      continue;
    }
    const content = read(check.file) + ' ' + sharedCss;
    const missing = check.need.filter((needle) => content.indexOf(needle) === -1);
    if (missing.length) {
      add('P1', check.rule, check.label + '：' + missing.join(', '), check.file);
    }
  }
  const kit = existsSync(resolve(ROOT, 'library/motion-kit.css'))
    ? read('library/motion-kit.css')
    : '';
  if (!/:focus-visible/.test(kit)) {
    add('P1', 'design/component-states', 'motion-kit 缺少 :focus-visible 默认焦点环');
  }
}

function validateBrief(file) {
  if (!existsSync(file)) {
    add('P0', 'design/brief', '找不到 design brief：' + file);
    return;
  }
  let brief;
  try {
    brief = JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    add('P0', 'design/brief', 'design.json 不是合法 JSON：' + err.message);
    return;
  }
  const tokens = JSON.parse(read('design-core/tokens.json'));
  const allowedArchetypes = Object.keys(tokens.archetypes || {});
  const required = ['archetype', 'density', 'layout', 'typeScale', 'accent', 'motionBudget', 'states', 'verify'];
  for (const key of required) {
    if (!(key in brief)) add('P0', 'design/brief', 'design.json 缺少 ' + key);
  }
  if (brief.archetype && !allowedArchetypes.includes(brief.archetype)) {
    add('P0', 'design/brief', '未知 archetype：' + brief.archetype);
  }
  if (!['tight', 'normal', 'loose'].includes(brief.density)) {
    add('P0', 'design/brief', 'density 应为 tight/normal/loose');
  }
  if (!['landing', 'reading', 'flow', 'dashboard', 'gallery', 'app'].includes(brief.layout)) {
    add('P0', 'design/brief', 'layout 不在允许集合内');
  }
  if (!(Number(brief.typeScale) >= 1.2 && Number(brief.typeScale) <= 1.35)) {
    add('P0', 'design/brief', 'typeScale 应在 1.2–1.35');
  }
  if (!Array.isArray(brief.states) || brief.states.length < 8) {
    add('P1', 'design/brief', 'states 应覆盖 8 态');
  }
}

function summary() {
  const stats = { P0: 0, P1: 0, P2: 0 };
  findings.forEach((f) => { stats[f.severity] += 1; });
  return stats;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('用法: node scripts/design-lint.mjs [--json] [--quiet] [--brief design.json]');
    return;
  }
  const tokens = JSON.parse(read('design-core/tokens.json'));
  validateTokens(tokens);
  validateComponentStates();
  const brief = args.brief || 'design-core/examples/editorial.json';
  validateBrief(resolve(process.cwd(), brief));

  const stats = summary();
  if (args.json) {
    console.log(JSON.stringify({ stats, findings }, null, 2));
  } else if (args.quiet) {
    console.log('[design-lint] ' + findings.length + ' 项（P0 ' + stats.P0 + ' / P1 ' + stats.P1 + ' / P2 ' + stats.P2 + '）');
  } else {
    console.log('# Design Lint\n');
    console.log('> tokens / 排版 / 间距 / 组件状态 / design.json\n');
    console.log('P0 ' + stats.P0 + ' · P1 ' + stats.P1 + ' · P2 ' + stats.P2 + '\n');
    for (const f of findings) {
      console.log('- [' + f.severity + '] `' + f.rule + '`: ' + f.message + (f.file ? ' · `' + f.file + '`' : ''));
    }
    if (!findings.length) console.log('✓ 没有命中静态规则。');
  }
  if (stats.P0 || stats.P1) process.exitCode = 1;
}

main();
