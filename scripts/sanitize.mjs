#!/usr/bin/env node
/* 演示页脱敏：移除脚本 / 内联事件 / javascript: URL，并遮盖常见密钥。
   用法：
     node scripts/sanitize.mjs --in old.html --out old.safe.html
     node scripts/sanitize.mjs --in old.html --out old.safe.html --keep-scripts
*/
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const SECRETS = [
  /\bsk-[A-Za-z0-9_-]{16,}\b/g,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g,
  /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\bAIza[0-9A-Za-z_-]{20,}\b/g,
];

export function sanitizeHtml(html, options = {}) {
  const warnings = [];
  let out = html;

  if (!options.keepScripts) {
    const before = out.length;
    out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '<!-- script removed by sanitize -->');
    out = out.replace(/<script\b[^>]*\/>/gi, '<!-- script removed by sanitize -->');
    if (out.length !== before) warnings.push('已移除内联脚本 / 外部脚本');
  }

  const beforeEvents = out;
  out = out.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  if (out !== beforeEvents) warnings.push('已移除 on* 内联事件');

  out = out.replace(/\b(href|src|action)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, '$1="#"');
  out = out.replace(/<iframe\b[^>]*\bsrc\s*=\s*["']https?:\/\/[^"']*["'][^>]*>[\s\S]*?<\/iframe>/gi, '<!-- external iframe removed by sanitize -->');

  for (const pattern of SECRETS) {
    const before = out;
    out = out.replace(pattern, '[redacted]');
    if (out !== before) warnings.push('已遮盖疑似密钥');
  }

  const note = '<!-- sanitized by scripts/sanitize.mjs · 请人工复核占位与业务内容 -->\n';
  return { html: note + out, warnings: Array.from(new Set(warnings)) };
}

function parse(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') out.help = true;
    else if (arg === '--in') out.in = argv[++i];
    else if (arg === '--out') out.out = argv[++i];
    else if (arg === '--keep-scripts') out.keepScripts = true;
  }
  return out;
}

function main() {
  const args = parse(process.argv.slice(2));
  if (args.help || !args.in || !args.out) {
    console.log('用法: node scripts/sanitize.mjs --in <html> --out <html> [--keep-scripts]');
    process.exitCode = args.help ? 0 : 1;
    return;
  }
  const input = resolve(process.cwd(), args.in);
  if (!existsSync(input)) {
    console.error('[sanitize] 找不到：' + args.in);
    process.exitCode = 1;
    return;
  }
  const result = sanitizeHtml(readFileSync(input, 'utf8'), { keepScripts: args.keepScripts });
  const output = resolve(process.cwd(), args.out);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, result.html, 'utf8');
  console.log('[sanitize] → ' + args.out);
  if (result.warnings.length) result.warnings.forEach((w) => console.log('  - ' + w));
}

main();
