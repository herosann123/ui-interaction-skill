#!/usr/bin/env node
/* 生成 3 个真实设计方向页 + 方向卡 + 选择清单。
   用法：
     node scripts/direction.mjs --title "Northwind 改版" --copy "一句话说明" --slug northwind
     node scripts/direction.mjs --title "..." --copy "..." --directions editorial-warm,gallery-swiss,deep-aurora
*/
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE = join(ROOT, 'directions', '_board.html');

const DIRECTIONS = {
  'editorial-warm': {
    label: 'EDITORIAL / WARM', family: 'editorial', why: '暖纸与衬线，适合品牌、内容与作品集',
    metric: '62.4%', metricLabel: '本周激活率 · +14.2%', font: 'Fraunces + Noto Serif SC', radius: '14px',
  },
  'editorial-ink': {
    label: 'EDITORIAL / INK', family: 'editorial', why: '深墨与旧金，适合出版、文化与酒店',
    metric: 'No. 04', metricLabel: '季度刊 · 2026 冬', font: 'Playfair + Noto Serif SC', radius: '2px',
  },
  'gallery-swiss': {
    label: 'GALLERY / SWISS', family: 'gallery', why: '极简瑞士，适合工作室、摄影与 SaaS',
    metric: '24', metricLabel: 'SELECTED WORKS', font: 'Inter', radius: '0',
  },
  'gallery-brutalist': {
    label: 'GALLERY / BRUTALIST', family: 'gallery', why: '硬边框与荧光底，适合独立杂志与实验品牌',
    metric: '2026', metricLabel: 'ISSUE 07 / NOISE', font: 'JetBrains Mono', radius: '0',
  },
  'deep-terminal': {
    label: 'DEEP / TERMINAL', family: 'deep-space', why: '终端薄荷，适合 DevTool 与基础设施',
    metric: '99.99%', metricLabel: 'UPTIME · 30 DAYS', font: 'JetBrains Mono', radius: '2px',
  },
  'deep-aurora': {
    label: 'DEEP / AURORA', family: 'deep-space', why: '深空柔光，适合 AI 与创作者工具',
    metric: '4.9/5', metricLabel: '18,000+ CREATORS', font: 'Space Grotesk', radius: '24px',
  },
  'old-heritage': {
    label: 'OLD MONEY / HERITAGE', family: 'old-money', why: '墨绿旧金，适合酒店、地产与财经',
    metric: '1926', metricLabel: 'EST. · ONE HUNDRED YEARS', font: 'Playfair + Noto Serif SC', radius: '2px',
  },
  'old-luxe': {
    label: 'OLD MONEY / LUXE', family: 'old-money', why: '墨黑夜金，适合会员制与高端服务',
    metric: 'By invite', metricLabel: 'MEMBERS ONLY · 2026', font: 'Playfair', radius: '0',
  },
  'soft-care': {
    label: 'SOFT / CARE', family: 'gallery', why: '柔和晨雾，适合健康、教育与日常工具',
    metric: '7 天', metricLabel: '连续记录 · 保持下去', font: 'Inter', radius: '20px',
  },
};

function parse(argv) {
  const out = { title: '一个新产品', copy: '把复杂的体验，收进一个清晰的界面。', slug: 'direction', directions: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') out.help = true;
    else if (arg === '--title') out.title = argv[++i];
    else if (arg === '--copy') out.copy = argv[++i];
    else if (arg === '--slug') out.slug = argv[++i];
    else if (arg === '--out') out.out = argv[++i];
    else if (arg === '--directions') out.directions = argv[++i];
  }
  return out;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function slugify(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9一-龥]+/g, '-').replace(/^-+|-+$/g, '') || 'direction';
}

function pickDirections(input) {
  const wanted = input ? input.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const defaults = ['editorial-warm', 'gallery-swiss', 'deep-aurora'];
  const list = [];
  for (const name of wanted.concat(defaults)) {
    if (!DIRECTIONS[name]) continue;
    if (list.includes(name)) continue;
    // 避免前两个方向同属一个家族
    if (list.length < 2 && list.some((n) => DIRECTIONS[n].family === DIRECTIONS[name].family)) continue;
    list.push(name);
    if (list.length === 3) break;
  }
  if (list.length < 3) {
    for (const name of Object.keys(DIRECTIONS)) {
      if (!list.includes(name)) list.push(name);
      if (list.length === 3) break;
    }
  }
  return list;
}

function main() {
  const args = parse(process.argv.slice(2));
  if (args.help) {
    console.log('用法: node scripts/direction.mjs --title "标题" --copy "一句话说明" [--slug name] [--directions a,b,c] [--out dir]');
    console.log('可用方向: ' + Object.keys(DIRECTIONS).join(', '));
    return;
  }
  if (!existsSync(TEMPLATE)) {
    console.error('[direction] 缺少模板 directions/_board.html');
    process.exitCode = 1;
    return;
  }
  const date = new Date();
  const stamp = date.getFullYear() + String(date.getMonth() + 1).padStart(2, '0') + String(date.getDate()).padStart(2, '0');
  const outDir = resolve(process.cwd(), args.out || join('directions', 'runs', stamp + '-' + slugify(args.slug)));
  mkdirSync(outDir, { recursive: true });

  const names = pickDirections(args.directions);
  const template = readFileSync(TEMPLATE, 'utf8');
  const rootRel = relative(outDir, ROOT).split(String.fromCharCode(92)).join('/') + '/';
  const title = esc(args.title);
  const copy = esc(args.copy);
  const cards = [];

  names.forEach((name, i) => {
    const meta = DIRECTIONS[name];
    const index = String.fromCharCode(65 + i);
    const html = template
      .replace(/\{\{root\}\}/g, rootRel)
      .replace(/\{\{title\}\}/g, title)
      .replace(/\{\{copy\}\}/g, copy)
      .replace(/\{\{direction\}\}/g, name)
      .replace(/\{\{label\}\}/g, meta.label)
      .replace(/\{\{index\}\}/g, index)
      .replace(/\{\{why\}\}/g, meta.why)
      .replace(/\{\{metric\}\}/g, meta.metric)
      .replace(/\{\{metricLabel\}\}/g, meta.metricLabel)
      .replace(/\{\{font\}\}/g, meta.font)
      .replace(/\{\{radius\}\}/g, meta.radius);
    const file = 'direction-' + index.toLowerCase() + '.html';
    writeFileSync(join(outDir, file), html, 'utf8');
    cards.push({ index, name, meta, file });
  });

  const backupNames = Object.keys(DIRECTIONS).filter((n) => !names.includes(n)).slice(0, 3);
  const cardHtml = cards.map((c) => (
    '<a class="dir-link" href="./' + c.file + '">' +
      '<span class="dir-link__tag">' + c.index + ' · ' + esc(c.meta.label) + '</span>' +
      '<b>' + esc(c.meta.why) + '</b>' +
      '<span class="dir-link__go">打开方向 →</span>' +
    '</a>'
  )).join('');

  const indexHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} · 3 个设计方向</title>
<link rel="stylesheet" href="${rootRel}design-core/tokens.css">
<link rel="stylesheet" href="${rootRel}design-core/typography.css">
<link rel="stylesheet" href="${rootRel}design-core/layout.css">
<link rel="stylesheet" href="${rootRel}library/motion-kit.css">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #e9e5db; color: #1a1712; font-family: var(--font-body); padding: 30px 0 60px; }
  .wrap { width: min(980px, calc(100% - 32px)); margin-inline: auto; }
  .top { display: flex; align-items: center; gap: 14px; padding-bottom: 18px; border-bottom: 1px solid rgba(26,23,18,.14); }
  .top a { color: #756e62; font-size: 12px; text-decoration: none; }
  .top .back { margin-left: auto; }
  h1 { margin-top: 30px; font-family: var(--font-display); font-size: clamp(36px, 5vw, 58px); font-weight: var(--display-weight); letter-spacing: var(--display-tracking); line-height: 1.05; }
  .lead { max-width: 64ch; margin-top: 10px; color: #756e62; font-size: 14px; }
  .hint { margin-top: 8px; color: #8a8378; font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.05em; }
  .list { display: grid; gap: 10px; margin-top: 24px; }
  .dir-link { display: grid; gap: 6px; padding: 18px 20px; border: 1px solid rgba(26,23,18,.14); border-radius: 14px; background: #fffdf8; color: inherit; text-decoration: none; }
  .dir-link:hover { border-color: #b4552f; }
  .dir-link__tag { color: #b4552f; font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.12em; }
  .dir-link b { font-size: 14px; font-weight: 500; }
  .dir-link__go { color: #756e62; font-family: var(--font-mono); font-size: 10px; }
  .next { margin-top: 22px; padding: 16px 18px; border-radius: 12px; background: rgba(26,23,18,.06); color: #4f4a41; font-size: 12px; line-height: 1.7; }
</style>
</head>
<body>
<div class="wrap">
  <div class="top"><b>UI Interaction Skill · Directions</b><a class="back" href="../../index.html">全部方向 ↗</a></div>
  <h1>${title}<br>三个方向</h1>
  <p class="lead">${copy}</p>
  <p class="hint">打开三个方向对比；选定一个后写进 direction-approved.md，再进入 design.json。</p>
  <div class="list">${cardHtml}</div>
  <div class="next">备选（未做成完整版）：${backupNames.map((n) => esc(DIRECTIONS[n].label)).join(' · ')}</div>
</div>
</body>
</html>
`;
  writeFileSync(join(outDir, 'index.html'), indexHtml, 'utf8');

  const md = [
    '# Directions · ' + args.title,
    '',
    '> ' + args.copy,
    '',
    '## 三个完整方向',
    '',
    ...cards.map((c) => '- **' + c.index + ' · ' + c.meta.label + '**：' + c.meta.why + ' → `' + c.file + '`'),
    '',
    '## 备选（一句话）',
    '',
    ...backupNames.map((n) => '- ' + DIRECTIONS[n].label + '：' + DIRECTIONS[n].why),
    '',
    '## 选择清单',
    '',
    '- [ ] 三个方向都已打开看过（不是只看截图）',
    '- [ ] 三个方向不属于同一外观家族',
    '- [ ] 选定一个，写进 `direction-approved.md`',
    '- [ ] 把方向映射到 design-core archetype，生成 `design.json`',
    '',
    '## 下一步',
    '',
    '```bash',
    'node scripts/design-brief.mjs --archetype ' + DIRECTIONS[names[0]].family + ' --density normal --layout landing --out design.json',
    '```',
    '',
  ].join('\n');
  writeFileSync(join(outDir, 'DIRECTIONS.md'), md, 'utf8');

  console.log('[direction] ' + names.length + ' 个方向 → ' + outDir);
  cards.forEach((c) => console.log('  ' + c.index + ' ' + c.meta.label + ' · ' + c.meta.why));
  console.log('  下一步：打开 index.html 对比；选定后写 direction-approved.md');
}

main();
