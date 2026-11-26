#!/usr/bin/env node
/* 外观账本：记录最近交付的方向/字体/颜色，提醒避免所有项目长成同一套。
   用法：
     node scripts/design-ledger.mjs --show
     node scripts/design-ledger.mjs --add --direction gallery-swiss --archetype gallery --fonts "Inter" --accent "#c8401f" --note "定价页"
*/
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const FILE = resolve(process.cwd(), '.design-ledger.json');

function parse(argv) {
  const out = { history: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--show') out.show = true;
    else if (arg === '--add') out.add = true;
    else if (arg === '--direction') out.direction = argv[++i];
    else if (arg === '--archetype') out.archetype = argv[++i];
    else if (arg === '--fonts') out.fonts = argv[++i];
    else if (arg === '--accent') out.accent = argv[++i];
    else if (arg === '--note') out.note = argv[++i];
    else if (arg === '--file') out.file = argv[++i];
    else if (arg === '--help' || arg === '-h') out.help = true;
  }
  return out;
}

function load() {
  if (!existsSync(FILE)) return { entries: [] };
  try {
    const data = JSON.parse(readFileSync(FILE, 'utf8'));
    return { entries: Array.isArray(data.entries) ? data.entries : [] };
  } catch (err) {
    return { entries: [] };
  }
}

function main() {
  const args = parse(process.argv.slice(2));
  if (args.help) {
    console.log('用法: node scripts/design-ledger.mjs --show | --add --direction <name> --archetype <name> [--fonts x] [--accent #hex] [--note 项目]');
    return;
  }
  const ledger = load();
  if (args.add) {
    if (!args.direction && !args.archetype) {
      console.error('[ledger] 至少提供 --direction 或 --archetype');
      process.exitCode = 1;
      return;
    }
    ledger.entries.push({
      at: new Date().toISOString(),
      direction: args.direction || null,
      archetype: args.archetype || null,
      fonts: args.fonts || null,
      accent: args.accent || null,
      note: args.note || null,
    });
    writeFileSync(FILE, JSON.stringify(ledger, null, 2) + '\n', 'utf8');
    console.log('[ledger] 已记录 · 共 ' + ledger.entries.length + ' 条');
  }

  const entries = ledger.entries.slice(-5);
  if (!entries.length) {
    console.log('[ledger] 暂无记录。');
    return;
  }
  console.log('# Design Ledger · last ' + entries.length + '\n');
  entries.forEach((e) => {
    console.log('- ' + (e.at || '').slice(0, 10) + ' · ' + (e.direction || '-') + ' · ' + (e.archetype || '-') + ' · ' + (e.fonts || '-') + ' · ' + (e.accent || '-') + (e.note ? ' · ' + e.note : ''));
  });
  const families = {};
  entries.forEach((e) => {
    const key = e.archetype || e.direction || 'unknown';
    families[key] = (families[key] || 0) + 1;
  });
  const top = Object.entries(families).sort((a, b) => b[1] - a[1])[0];
  if (top && top[1] >= 4) {
    console.log('\n⚠ 最近 ' + entries.length + ' 次里有 ' + top[1] + ' 次是「' + top[0] + '」。下一版至少换一个外观家族。');
  }
  if (!args.add) console.log('\n提示：选定方向后运行 --add 记录本次选择。');
}

main();
