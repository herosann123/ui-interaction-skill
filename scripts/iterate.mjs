#!/usr/bin/env node
/* 给一个 run 目录做版本快照 + 更新 manifest / CHANGELOG。
   用法：node scripts/iterate.mjs --run ui-runs/x --note "CR-1：CTA 收敛" [--files "after.html,index.html"]
*/
import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

function parse(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') out.help = true;
    else if (arg === '--run') out.run = argv[++i];
    else if (arg === '--note') out.note = argv[++i];
    else if (arg === '--files') out.files = argv[++i];
  }
  return out;
}

function main() {
  const args = parse(process.argv.slice(2));
  if (args.help || !args.run || !args.note) {
    console.log('用法: node scripts/iterate.mjs --run <run目录> --note "本轮改了什么" [--files "after.html,index.html"]');
    process.exitCode = args.help ? 0 : 1;
    return;
  }
  const run = resolve(process.cwd(), args.run);
  const after = join(run, 'after.html');
  const manifestPath = join(run, 'manifest.json');
  if (!existsSync(after) || !existsSync(manifestPath)) {
    console.error('[iterate] run 目录需要 after.html 和 manifest.json：' + args.run);
    process.exitCode = 1;
    return;
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const versions = Array.isArray(manifest.versions) ? manifest.versions : [];
  const next = Math.max(0, ...versions.map((v) => Number(v.version) || 0)) + 1;
  const versionsDir = join(run, 'versions');
  mkdirSync(versionsDir, { recursive: true });
  const snapshot = join(versionsDir, 'after-v' + (next - 1) + '.html');
  // 修改前快照：v2 操作时保存当前（v1）的 after
  copyFileSync(after, snapshot);

  const entry = {
    version: next,
    at: new Date().toISOString(),
    basedOn: next - 1,
    changes: [args.note],
    files: (args.files || 'after.html,index.html').split(',').map((s) => s.trim()).filter(Boolean),
  };
  manifest.versions = versions.concat(entry);
  manifest.status = 'iterating';
  manifest.updatedAt = entry.at;
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  const log = '\n## v' + next + ' · ' + entry.at.slice(0, 10) + '\n\n- ' + args.note + '\n- 快照：`versions/after-v' + (next - 1) + '.html`\n';
  writeFileSync(join(run, 'CHANGELOG.md'), readFileSync(join(run, 'CHANGELOG.md'), 'utf8') + log, 'utf8');

  console.log('[iterate] v' + next + ' · ' + args.note);
  console.log('          修改前快照：' + snapshot);
  console.log('          下一步：编辑 after.html / index.html，然后跑验收。');
}

main();
