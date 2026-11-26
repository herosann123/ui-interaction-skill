#!/usr/bin/env node
/* 校验 brand.json：字段 / 资产文件 / 颜色对比度 / 来源。
   用法：node scripts/brand-check.mjs --in brand/brand.json [--json]
*/
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';

const findings = [];

function add(severity, rule, message) {
  findings.push({ severity, rule, message });
}

function hexToRgb(hex) {
  let value = String(hex || '').trim().replace('#', '');
  if (value.length === 3) value = value.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(value)) return null;
  return { r: parseInt(value.slice(0, 2), 16), g: parseInt(value.slice(2, 4), 16), b: parseInt(value.slice(4, 6), 16) };
}

function luminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const ch = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  return 0.2126 * ch(rgb.r) + 0.7152 * ch(rgb.g) + 0.0722 * ch(rgb.b);
}

function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  if (la == null || lb == null) return 0;
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function parse(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--in') out.in = argv[++i];
    else if (arg === '--json') out.json = true;
    else if (arg === '--help' || arg === '-h') out.help = true;
  }
  return out;
}

function main() {
  const args = parse(process.argv.slice(2));
  if (args.help || !args.in) {
    console.log('用法: node scripts/brand-check.mjs --in brand/brand.json [--json]');
    process.exitCode = args.help ? 0 : 1;
    return;
  }
  const file = resolve(process.cwd(), args.in);
  if (!existsSync(file)) {
    console.error('[brand-check] 找不到：' + args.in);
    process.exitCode = 1;
    return;
  }
  let brand;
  try {
    brand = JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    console.error('[brand-check] JSON 解析失败：' + err.message);
    process.exitCode = 1;
    return;
  }
  const base = dirname(file);
  const required = ['brand', 'assets', 'colors', 'fonts', 'sources', 'verifiedAt'];
  required.forEach((k) => { if (!(k in brand)) add('P0', 'brand/schema', '缺少字段 ' + k); });

  const assets = brand.assets || {};
  const assetList = [];
  if (assets.logo) assetList.push(['logo', assets.logo]);
  (assets.productShots || []).forEach((p) => assetList.push(['productShots', p]));
  (assets.uiScreenshots || []).forEach((p) => assetList.push(['uiScreenshots', p]));
  assetList.forEach(([kind, rel]) => {
    const abs = resolve(base, rel);
    if (!existsSync(abs)) {
      add('P0', 'brand/assets', kind + ' 文件不存在：' + rel);
      return;
    }
    if (statSync(abs).size === 0) {
      add('P1', 'brand/assets', kind + ' 文件为空：' + rel);
    }
    const ext = extname(abs).toLowerCase();
    if (!['.svg', '.png', '.jpg', '.jpeg', '.webp', '.avif'].includes(ext)) {
      add('P2', 'brand/assets', kind + ' 格式不是常见图片：' + rel);
    }
  });
  if (!assets.logo) {
    add('P2', 'brand/assets', '未提供官方 logo；页面应使用文字标识并注明缺失');
  }

  const colors = brand.colors || {};
  Object.entries(colors).forEach(([key, value]) => {
    if (!/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)) {
      add('P1', 'brand/colors', key + ' 不是 hex 颜色：' + value);
    }
  });
  if (colors.bg && colors.ink && contrast(colors.bg, colors.ink) < 4.5) {
    add('P0', 'brand/contrast', 'ink/bg 对比 ' + contrast(colors.bg, colors.ink).toFixed(2) + ':1，需 ≥4.5');
  }
  if (colors.accent && colors.accentInk && contrast(colors.accent, colors.accentInk) < 4.5) {
    add('P1', 'brand/contrast', 'accentInk/accent 对比 ' + contrast(colors.accent, colors.accentInk).toFixed(2) + ':1，需 ≥4.5');
  }

  if (!Array.isArray(brand.sources) || !brand.sources.length) {
    add('P1', 'brand/sources', 'sources 至少一条官方来源 URL');
  } else {
    brand.sources.forEach((url) => {
      if (!/^https?:\/\//.test(url)) add('P2', 'brand/sources', '来源不是 http(s) URL：' + url);
    });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(brand.verifiedAt || '')) {
    add('P1', 'brand/verifiedAt', 'verifiedAt 需为 YYYY-MM-DD');
  }

  const stats = { P0: 0, P1: 0, P2: 0 };
  findings.forEach((f) => { stats[f.severity] += 1; });
  if (args.json) {
    console.log(JSON.stringify({ stats, findings }, null, 2));
  } else {
    console.log('# Brand Check\n');
    console.log('P0 ' + stats.P0 + ' · P1 ' + stats.P1 + ' · P2 ' + stats.P2 + '\n');
    findings.forEach((f) => console.log('- [' + f.severity + '] `' + f.rule + '`: ' + f.message));
    if (!findings.length) console.log('✓ 品牌资产检查通过。');
  }
  if (stats.P0 || stats.P1) process.exitCode = 1;
}

main();
