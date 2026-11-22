#!/usr/bin/env node
/* 从 audit JSON 生成 demo brief。
   用法：node scripts/brief.mjs --in audit.json --out brief.md --title "定价页改版" [--max 5]
*/
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { selectFindings, briefMarkdown } from './lib/select.mjs';

function parse(argv) {
  const out = { max: 5 };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') out.help = true;
    else if (arg === '--in') out.in = argv[++i];
    else if (arg === '--out') out.out = argv[++i];
    else if (arg === '--title') out.title = argv[++i];
    else if (arg === '--max') out.max = parseInt(argv[++i], 10) || 5;
  }
  return out;
}

function main() {
  const args = parse(process.argv.slice(2));
  if (args.help || !args.in) {
    console.log('用法: node scripts/brief.mjs --in audit.json [--out brief.md] [--title "改版"] [--max 5]');
    process.exitCode = args.help ? 0 : 1;
    return;
  }
  const input = resolve(process.cwd(), args.in);
  if (!existsSync(input)) {
    console.error('[brief] 找不到：' + args.in);
    process.exitCode = 1;
    return;
  }
  const report = JSON.parse(readFileSync(input, 'utf8'));
  const findings = report.findings || report;
  const selected = selectFindings(findings, { max: args.max });
  const markdown = briefMarkdown(selected, { title: args.title || 'UI 改版' });
  const out = args.out ? resolve(process.cwd(), args.out) : null;
  if (out) {
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, markdown, 'utf8');
    console.log('[brief] ' + selected.length + ' 项 → ' + args.out);
  } else {
    console.log(markdown);
  }
}

main();
