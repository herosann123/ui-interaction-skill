#!/usr/bin/env node
/* =========================================================================
   ui-interaction-skill · 单文件打包
   把 demo 页面里的 motion-kit.css / motion-kit.js 内联，便于发给别人或上传。

   用法：
     node scripts/bundle-demo.mjs --in ui-runs/x/after.html --out ui-runs/x/after.standalone.html
     node scripts/bundle-demo.mjs ui-runs/x/after.html
   ========================================================================= */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';

function parseArgs(argv) {
  const out = { single: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') out.help = true;
    else if (arg === '--single') out.single = true;
    else if (arg === '--in') out.in = argv[++i];
    else if (arg === '--out') out.out = argv[++i];
    else if (!arg.startsWith('-') && !out.in) out.in = arg;
  }
  return out;
}

function help() {
  return [
    '单文件打包 v1.0.0',
    '',
    '用法：',
    '  node scripts/bundle-demo.mjs --in <html> [--out <html>]',
    '  node scripts/bundle-demo.mjs <html>',
    '',
    '只内联 motion-kit.css / motion-kit.js；其他本地资源保持原样。',
    '不传 --out 时输出到同目录 <name>.standalone.html。',
  ].join('\n');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(help());
    return;
  }
  if (!args.in) {
    console.error('[bundle] 缺少 --in <html>');
    process.exitCode = 1;
    return;
  }

  const input = resolve(process.cwd(), args.in);
  if (!existsSync(input)) {
    console.error('[bundle] 文件不存在：' + args.in);
    process.exitCode = 1;
    return;
  }

  const out = args.out
    ? resolve(process.cwd(), args.out)
    : input.replace(/\.html?$/i, '') + '.standalone.html';

  let html = readFileSync(input, 'utf8');
  const baseDir = dirname(input);
  let inlinedCss = 0;
  let inlinedJs = 0;
  const missing = [];

  function inlineAsset(href) {
    const clean = href.split('?')[0].split('#')[0];
    if (!/motion-kit\.(?:css|js)$/i.test(clean)) return null;
    const target = resolve(baseDir, clean);
    if (!existsSync(target)) {
      missing.push(clean);
      return null;
    }
    const content = readFileSync(target, 'utf8');
    if (/\.css$/i.test(clean)) {
      inlinedCss += 1;
      // 避免内容中的 </style> 提前闭合标签
      return { type: 'css', content: content.replace(/<\/style/gi, '<\\/style') };
    }
    inlinedJs += 1;
    // 避免注释/字符串里的 </script> 提前闭合标签
    return { type: 'js', content: content.replace(/<\/script/gi, '<\\/script') };
  }

  html = html.replace(
    /<link\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi,
    (tag, href) => {
      if (!/stylesheet/i.test(tag)) return tag;
      const asset = inlineAsset(href);
      if (!asset) return tag;
      return '<style>\n' + asset.content + '\n</style>';
    }
  );

  html = html.replace(
    /<script\b([^>]*)\bsrc\s*=\s*["']([^"']+)["']([^>]*)><\/script>/gi,
    (tag, before, src, after) => {
      const asset = inlineAsset(src);
      if (!asset) return tag;
      const attrs = (before + ' ' + after).replace(/\bdefer\b/gi, '').trim();
      const attrText = attrs ? ' ' + attrs : '';
      return '<script' + attrText + '>\n' + asset.content + '\n</script>';
    }
  );

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html, 'utf8');

  const size = Buffer.byteLength(html, 'utf8');
  console.log(
    '[bundle] ' +
      relative(process.cwd(), out) +
      ' · CSS ' +
      inlinedCss +
      ' · JS ' +
      inlinedJs +
      ' · ' +
      (size / 1024).toFixed(1) +
      ' KB'
  );
  if (missing.length) {
    console.warn('[bundle] 未找到：' + missing.join(', ') + '（保持外链）');
    process.exitCode = 1;
  }
}

main();
