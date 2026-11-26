#!/usr/bin/env node
/* 生成 6 维视觉评审报告骨架（不自动打分）。
   用法：node scripts/critique.mjs --title "Northwind 改版" --screenshots a.png,b.png --out critique.md
*/
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

function parse(argv) {
  const out = { screenshots: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--title') out.title = argv[++i];
    else if (arg === '--screenshots') out.screenshots = String(argv[++i] || '').split(',').map((s) => s.trim()).filter(Boolean);
    else if (arg === '--out') out.out = argv[++i];
    else if (arg === '--help' || arg === '-h') out.help = true;
  }
  return out;
}

function main() {
  const args = parse(process.argv.slice(2));
  if (args.help) {
    console.log('用法: node scripts/critique.mjs --title "页面名" --screenshots desktop.png,mobile.png [--out critique.md]');
    return;
  }
  const title = args.title || 'Untitled';
  const screenshots = args.screenshots.filter((p) => existsSync(resolve(process.cwd(), p)));
  const missing = args.screenshots.filter((p) => !existsSync(resolve(process.cwd(), p)));
  const lines = [
    '# Critique · ' + title,
    '',
    '- 日期：' + new Date().toISOString().slice(0, 10),
    '- 证据：' + (screenshots.length ? screenshots.map((p) => '`' + p + '`').join(' · ') : '无截图'),
    '- 独立性：' + (screenshots.length ? '待确认（同一上下文时标注非独立）' : '无截图，只能做规格级检查'),
    '',
    '## 六维',
    '',
    '| 维度 | 分数 | 证据 / 位置 | 改什么 |',
    '| --- | --- | --- | --- |',
    '| 概念 / 立意 | /10 | | |',
    '| 哲学一致性 | /10 | | |',
    '| 视觉层级 | /10 | | |',
    '| 细节执行 | /10 | | |',
    '| 功能性 | /10 | | |',
    '| 创新性 | /10 | | |',
    '',
    '## Keep',
    '',
    '- ',
    '',
    '## Fix',
    '',
    '- ',
    '',
    '## Quick Wins',
    '',
    '- ',
    '',
    '## 未验证',
    '',
    '- 交互 / 键盘 / 性能 / 真实用户任务：截图推不出，需 `smoke.mjs` 或真机验证',
    '',
  ];
  if (!screenshots.length) {
    lines.push('> 没有真实截图：不要填写视觉分数，只做规格级检查。');
    lines.push('');
  }
  if (missing.length) {
    lines.push('> 以下截图路径不存在：' + missing.join(', '));
    lines.push('');
  }
  const out = lines.join('\n');
  if (args.out) {
    const file = resolve(process.cwd(), args.out);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, out, 'utf8');
    console.log('[critique] → ' + args.out);
  } else {
    console.log(out);
  }
}

main();
