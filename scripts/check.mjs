#!/usr/bin/env node
/* =========================================================================
   ui-interaction-skill · 自检
   在改动库 / 模板 / 文档后跑一遍，尽早抓语法、依赖、规则回归。

   用法：
     node scripts/check.mjs

   检查项：
   - 所有 JS / .mjs 语法
   - HTML 内联脚本语法（vm.Script 编译，不执行）
   - library/manifest.json 可解析且计数正确
   - clean after 页面audit = 0；templates 的 P0 只来自故意做坏的 before
   - tests/fixtures：good = 0，bad 命中预期规则
   - 文档中的本地 Markdown 链接存在
   ========================================================================= */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, extname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const notes = [];

function ok(label) {
  console.log('  ✓ ' + label);
}
function fail(label, detail) {
  errors.push(label + (detail ? ' — ' + detail : ''));
  console.log('  ✗ ' + label + (detail ? ' — ' + detail : ''));
}
function runNode(args) {
  return spawnSync(process.execPath, args, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  });
}
function read(rel) {
  return readFileSync(join(ROOT, rel), 'utf8');
}
function walk(dir, out = []) {
  for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
    const rel = join(dir, entry.name).replace(/\\/g, '/');
    if (entry.isDirectory()) walk(rel, out);
    else out.push(rel);
  }
  return out;
}

console.log('\n[1/6] JS 语法');
const jsFiles = [
  'library/motion-kit.js',
  'library/motion-kit.esm.js',
  'library/adapters/react.js',
  'library/adapters/vue.js',
  'scripts/audit.mjs',
  'scripts/new-demo.mjs',
  'scripts/bundle-demo.mjs',
  'scripts/check.mjs',
  'scripts/design-lint.mjs',
  'scripts/design-brief.mjs',
  'scripts/direction.mjs',
  'scripts/brand-check.mjs',
  'scripts/design-ledger.mjs',
  'scripts/critique.mjs',
  'scripts/export.mjs',
  'scripts/smoke.mjs',
  'scripts/screenshot.mjs',
  'scripts/sanitize.mjs',
  'scripts/brief.mjs',
  'scripts/iterate.mjs',
  'scripts/lib/select.mjs',
];
for (const file of jsFiles) {
  const result = runNode(['--check', file]);
  if (result.status === 0) ok(file);
  else fail(file, (result.stderr || '').split('\n')[0]);
}

console.log('\n[2/6] HTML 内联脚本');
const htmlFiles = ['index.html'].concat(walk('templates'), walk('components'), walk('presets'), walk('design-core'), walk('directions'), walk('cases')).filter((f) => extname(f) === '.html');
let inlineCount = 0;
for (const file of htmlFiles) {
  const html = read(file);
  const scripts = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    const attrs = match[1] || '';
    if (/\bsrc\s*=/i.test(attrs)) continue;
    if (/type\s*=\s*["'](?:application\/json|application\/ld\+json|text\/template)["']/i.test(attrs)) continue;
    if (/type\s*=\s*["']module["']/i.test(attrs)) continue; // ESM 由浏览器按模块解析，vm.Script 不适用
    scripts.push(match[2]);
  }
  for (let i = 0; i < scripts.length; i += 1) {
    if (!scripts[i].trim()) continue;
    inlineCount += 1;
    try {
      new vm.Script(scripts[i], { filename: file + '#inline-' + (i + 1) });
    } catch (err) {
      fail(file + ' 内联脚本 #' + (i + 1), err.message);
    }
  }
}
if (!errors.some((e) => e.includes('内联脚本'))) ok(htmlFiles.length + ' 个页面 / ' + inlineCount + ' 段内联脚本');

console.log('\n[3/6] Manifest');
try {
  const manifest = JSON.parse(read('library/manifest.json'));
  const counts = manifest.counts || {};
  if (counts.patterns === 56) ok('patterns = 56');
  else fail('patterns', String(counts.patterns));
  if (counts.templates === 9) ok('templates = 9');
  else fail('templates', String(counts.templates));
  if (counts.behaviors === (manifest.kit.behaviors || []).length) ok('behaviors = ' + counts.behaviors);
  else fail('behaviors 计数与数组长度不一致');
  if (counts.components === (manifest.components || []).length) ok('components = ' + counts.components);
  else fail('components 计数与数组长度不一致');
  if (counts.presets === (manifest.presets || []).length) ok('presets = ' + counts.presets);
  else fail('presets 计数与数组长度不一致');
} catch (err) {
  fail('library/manifest.json', err.message);
}

function auditJson(args) {
  const result = runNode(['scripts/audit.mjs', ...args, '--json']);
  if (result.status !== 0 && !result.stdout) {
    throw new Error((result.stderr || 'audit failed').split('\n')[0]);
  }
  return JSON.parse(result.stdout);
}

console.log('');
console.log('[3.5/6] Design Core');
try {
  const tokens = JSON.parse(read('design-core/tokens.json'));
  const archetypes = Object.keys(tokens.archetypes || {});
  if (archetypes.length === 4) ok('archetypes = 4 (' + archetypes.join(', ') + ')');
  else fail('archetypes', String(archetypes.length));
  if (Object.keys(tokens.spacing || {}).length === 3) ok('density = 3');
  else fail('density', String(Object.keys(tokens.spacing || {}).length));
  if ((tokens.states || []).length === 8) ok('states = 8');
  else fail('states', String((tokens.states || []).length));
  JSON.parse(read('design-core/brief.schema.json'));
  ok('brief.schema.json');
  JSON.parse(read('brand/brand.schema.json'));
  ok('brand.schema.json');
} catch (err) {
  fail('design-core', err.message);
}
{
  const result = runNode(['scripts/design-lint.mjs', '--quiet']);
  if (result.status === 0) ok('design-lint = 0');
  else fail('design-lint', (result.stdout || result.stderr || '').trim().split('\n').slice(-1)[0]);
}

console.log('\n[4/6] 体检回归');
try {
  const clean = auditJson(['templates/demo-shell/after.html']);
  if (clean.findings.length === 0) ok('clean after = 0');
  else fail('clean after', clean.findings.length + ' 项');
} catch (err) {
  fail('clean after audit', err.message);
}
try {
  const components = auditJson(['components']);
  if (components.findings.length === 0) ok('components = 0');
  else fail('components', components.findings.length + ' 项');
  const presets = auditJson(['presets']);
  if (presets.findings.length === 0) ok('presets = 0');
  else fail('presets', presets.findings.length + ' 项');
  const landing = auditJson(['index.html']);
  if (landing.findings.length === 0) ok('landing = 0');
  else fail('landing', landing.findings.length + ' 项');
  const core = auditJson(['design-core/index.html']);
  if (core.findings.length === 0) ok('design-core = 0');
  else fail('design-core', core.findings.length + ' 项');
  const directions = auditJson(['directions/index.html']);
  if (directions.findings.length === 0) ok('directions = 0');
  else fail('directions', directions.findings.length + ' 项');
  const cases = auditJson(['cases/index.html']);
  if (cases.findings.length === 0) ok('cases = 0');
  else fail('cases', cases.findings.length + ' 项');
} catch (err) {
  fail('components audit', err.message);
}
try {
  const templates = auditJson(['templates']);
  const p0 = templates.findings.filter((f) => f.severity === 'P0');
  const unexpected = p0.filter((f) => !f.file.includes('before.html'));
  if (unexpected.length === 0) ok('templates P0 只来自 before 示例');
  else fail('templates P0', unexpected.map((f) => f.file).join(', '));
} catch (err) {
  fail('templates audit', err.message);
}

console.log('\n[5/6] 规则 fixtures');
try {
  const good = auditJson(['tests/fixtures/good.html']);
  if (good.findings.length === 0) ok('good.html = 0');
  else fail('good.html', good.findings.map((f) => f.rule).join(', '));

  const bad = auditJson(['tests/fixtures/bad.html']);
  const badRules = new Set(bad.findings.map((f) => f.rule));
  const expectedBad = [
    'a11y/reduced-motion',
    'a11y/clickable-div',
    'a11y/img-alt',
    'a11y/input-label',
    'perf/layout-animation',
    'perf/transition-all',
    'mobile/touch-hijack',
    'mobile/no-touch-action',
    'mobile/no-pointercancel',
    'mobile/100vh',
    'perf/blur-heavy',
  ];
  const missBad = expectedBad.filter((r) => !badRules.has(r));
  if (missBad.length === 0) ok('bad.html 命中 ' + expectedBad.length + ' 个关键规则');
  else fail('bad.html 缺少', missBad.join(', '));

  const keyboard = auditJson(['tests/fixtures/keyboard-missing.html']);
  const kbHit = keyboard.findings.some(
    (f) => f.rule === 'a11y/clickable-div' && f.severity === 'P2'
  );
  if (kbHit) ok('keyboard-missing.html 命中可点击容器 P2');
  else fail('keyboard-missing.html', '未命中 a11y/clickable-div P2');

  const jsx = auditJson(['tests/fixtures/bad.jsx']);
  const jsxRules = new Set(jsx.findings.map((f) => f.rule));
  const expectedJsx = ['a11y/clickable-div', 'a11y/img-alt', 'a11y/input-label', 'a11y/target-blank'];
  const missJsx = expectedJsx.filter((r) => !jsxRules.has(r));
  if (missJsx.length === 0) ok('bad.jsx 命中 ' + expectedJsx.length + ' 个标签规则');
  else fail('bad.jsx 缺少', missJsx.join(', '));
} catch (err) {
  fail('fixtures audit', err.message);
}

console.log('\n[6/6] 文档本地链接');
const docs = [
  'SKILL.md',
  'AUDIT.md',
  'DEMO.md',
  'ITERATE.md',
  'INDEX.md',
  'CHANGELOG.md',
  'library/README.md',
  'components/STATES.md',
  'templates/README.md',
  'templates/demo-shell/CASE-STUDY.md',
  'examples/README.md',
  'examples/demo-brief.md',
  'examples/iteration-example.md',
  'DESIGN.md',
  'DIRECTION.md',
  'BRAND.md',
  'CRITIQUE.md',
  'directions/README.md',
  'cases/README.md',
  'brand/README.md',
  'design-core/README.md',
  'design-core/rules.md',
  'design-core/MIGRATION.md',
  'references/mapping.md',
  'references/anti-patterns.md',
];
let linkCount = 0;
let linkBad = 0;
const knownPrefix = /^(?:\.\.?\/)?(?:library|templates|scripts|references|examples|tests)\//;
const topLevelDoc = /^[A-Za-z0-9_-]+\.(?:md|html)$/;
const runFiles = new Set(['index.html', 'before.html', 'after.html', 'after.standalone.html', 'manifest.json', 'NOTES.md', 'CHANGELOG.md']);
const skipWord = /<|…|\*|vN|^ui-runs\//;

const rootDocs = new Set(['SKILL.md', 'AUDIT.md', 'DEMO.md', 'ITERATE.md', 'PATTERNS.md', 'INDEX.md', 'CHANGELOG.md']);

function checkLocal(doc, raw, fromBacktick) {
  let target = (raw || '').trim();
  if (!target) return;
  if (/^(https?:|mailto:|#)/i.test(target)) return;
  if (skipWord.test(target) || target.includes('://')) return;
  target = target.split('#')[0].split('?')[0];
  if (!target || runFiles.has(target)) return;

  let absolute = null;
  if (target.startsWith('./') || target.startsWith('../')) {
    absolute = resolve(ROOT, dirname(doc), target);
  } else if (knownPrefix.test(target)) {
    const local = resolve(ROOT, dirname(doc), target);
    const root = resolve(ROOT, target);
    absolute = existsSync(local) ? local : root;
  } else if (rootDocs.has(target)) {
    absolute = resolve(ROOT, target);
  } else if (!target.includes('/')) {
    // 裸文件名：可能是同一目录或根目录的文档，存在就计数；不存在则视为文字引用，不报错
    const local = resolve(ROOT, dirname(doc), target);
    const root = resolve(ROOT, target);
    if (existsSync(local) || existsSync(root)) linkCount += 1;
    return;
  } else {
    // 未知前缀的路径（例如用户项目示例），不检查
    return;
  }

  linkCount += 1;
  if (!existsSync(absolute)) {
    linkBad += 1;
    fail(doc + ' → ' + raw, '不存在');
  }
}

for (const doc of docs) {
  const content = read(doc);
  const mdLinks = /\[[^\]]*\]\(([^)]+)\)/g;
  let match;
  while ((match = mdLinks.exec(content)) !== null) checkLocal(doc, match[1], false);

  // 文档里用反引号写的 skill 内路径（例如 `library/manifest.json` / `references/mapping.md`）
  const codePaths = /`([^`\n]+\.(?:md|html|js|mjs|css|json))`/g;
  while ((match = codePaths.exec(content)) !== null) checkLocal(doc, match[1], true);
}
if (linkBad === 0) ok(linkCount + ' 个本地链接/路径');

console.log('\n' + '='.repeat(56));
if (errors.length) {
  console.log('✗ FAIL · ' + errors.length + ' 项');
  errors.forEach((e) => console.log('  - ' + e));
  process.exitCode = 1;
} else {
  console.log('✓ PASS · 全部检查通过');
}
