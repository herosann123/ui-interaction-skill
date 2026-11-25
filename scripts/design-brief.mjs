#!/usr/bin/env node
/* 生成 / 校验 design.json。
   用法：
     node scripts/design-brief.mjs --archetype editorial --density normal --layout landing --out design.json
     node scripts/design-brief.mjs --validate design.json
*/
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const TOKENS = JSON.parse(readFileSync(resolve(ROOT, 'design-core/tokens.json'), 'utf8'));
const STATES = ['default', 'hover', 'focus', 'active', 'disabled', 'loading', 'error', 'success'];
const LAYOUTS = (TOKENS.layout && TOKENS.layout.skeletons) || ['landing', 'reading', 'flow', 'dashboard', 'gallery', 'app'];

function parse(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') out.help = true;
    else if (arg === '--archetype') out.archetype = argv[++i];
    else if (arg === '--density') out.density = argv[++i];
    else if (arg === '--layout') out.layout = argv[++i];
    else if (arg === '--accent') out.accent = argv[++i];
    else if (arg === '--title') out.title = argv[++i];
    else if (arg === '--out') out.out = argv[++i];
    else if (arg === '--validate') out.validate = argv[++i];
  }
  return out;
}

function validate(file) {
  const errors = [];
  let brief;
  try {
    brief = JSON.parse(readFileSync(resolve(process.cwd(), file), 'utf8'));
  } catch (err) {
    return ['不是合法 JSON：' + err.message];
  }
  const required = ['archetype', 'density', 'layout', 'typeScale', 'accent', 'motionBudget', 'states', 'verify'];
  required.forEach((key) => {
    if (!(key in brief)) errors.push('缺少 ' + key);
  });
  if (brief.archetype && !TOKENS.archetypes[brief.archetype]) errors.push('未知 archetype：' + brief.archetype);
  if (!['tight', 'normal', 'loose'].includes(brief.density)) errors.push('density 应为 tight/normal/loose');
  if (!LAYOUTS.includes(brief.layout)) errors.push('layout 不在允许集合内');
  if (!(Number(brief.typeScale) >= 1.2 && Number(brief.typeScale) <= 1.35)) errors.push('typeScale 应在 1.2–1.35');
  if (!/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(brief.accent || '')) errors.push('accent 应为 hex 颜色');
  if (!Array.isArray(brief.states) || brief.states.length < 8) errors.push('states 应覆盖 8 态');
  if (!brief.motionBudget || !Number.isInteger(brief.motionBudget.primary) || !Number.isInteger(brief.motionBudget.secondary)) {
    errors.push('motionBudget 需要 primary/secondary 整数');
  }
  if (!brief.verify || !Array.isArray(brief.verify.viewports) || typeof brief.verify.reducedMotion !== 'boolean') {
    errors.push('verify 需要 viewports[] 与 reducedMotion');
  }
  return errors;
}

function main() {
  const args = parse(process.argv.slice(2));
  if (args.help) {
    console.log('用法: node scripts/design-brief.mjs [--archetype editorial|gallery|deep-space|old-money] [--density tight|normal|loose] [--layout landing|reading|flow|dashboard|gallery|app] [--accent #hex] [--out design.json]');
    console.log('      node scripts/design-brief.mjs --validate design.json');
    return;
  }

  if (args.validate) {
    const errors = validate(args.validate);
    if (errors.length) {
      console.error('[design-brief] ' + errors.length + ' 个问题：');
      errors.forEach((e) => console.error('  - ' + e));
      process.exitCode = 1;
    } else {
      console.log('[design-brief] ✓ ' + args.validate);
    }
    return;
  }

  const archetype = args.archetype || 'editorial';
  if (!TOKENS.archetypes[archetype]) {
    console.error('[design-brief] 未知 archetype：' + archetype);
    process.exitCode = 1;
    return;
  }
  const density = args.density || 'normal';
  if (!['tight', 'normal', 'loose'].includes(density)) {
    console.error('[design-brief] density 应为 tight/normal/loose');
    process.exitCode = 1;
    return;
  }
  const layout = args.layout || 'landing';
  if (!LAYOUTS.includes(layout)) {
    console.error('[design-brief] layout 不在允许集合内：' + LAYOUTS.join('/'));
    process.exitCode = 1;
    return;
  }
  const accent = args.accent || TOKENS.archetypes[archetype].accent;
  if (!/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(accent)) {
    console.error('[design-brief] accent 应为 hex 颜色');
    process.exitCode = 1;
    return;
  }

  const brief = {
    title: args.title || 'UI design',
    archetype,
    density,
    layout,
    typeScale: TOKENS.typeScale.ratio,
    accent,
    motionBudget: { primary: 2, secondary: 1 },
    states: STATES,
    verify: { viewports: [390, 768, 1280], reducedMotion: true },
  };
  const output = JSON.stringify(brief, null, 2) + '\n';
  if (args.out) {
    const file = resolve(process.cwd(), args.out);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, output, 'utf8');
    console.log('[design-brief] → ' + args.out);
  } else {
    console.log(output);
  }
}

main();
