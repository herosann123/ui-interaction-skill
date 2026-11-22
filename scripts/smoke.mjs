#!/usr/bin/env node
/* =========================================================================
   浏览器烟测（零依赖 CDP）
   - 自动找 Chrome（或 --chrome <path>）
   - 390 × 844、prefers-reduced-motion: reduce
   - 检查：横向溢出、内容不可见、控制台错误
   - 可选截图：--screenshots <dir>

   用法：
     node scripts/smoke.mjs
     node scripts/smoke.mjs --screenshots .smoke-shots
   ========================================================================= */

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parse(argv) {
  const out = { port: 9222 };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--chrome') out.chrome = argv[++i];
    else if (arg === '--port') out.port = parseInt(argv[++i], 10) || 9222;
    else if (arg === '--screenshots') out.screenshots = argv[++i] || '.smoke-shots';
  }
  return out;
}

function findChrome(explicit) {
  const candidates = [
    explicit,
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
  return candidates.find((p) => existsSync(p)) || null;
}

function walk(dir, out = []) {
  for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
    const rel = dir + '/' + entry.name;
    if (entry.isDirectory()) walk(rel, out);
    else if (extname(entry.name) === '.html') out.push(rel);
  }
  return out;
}

async function waitForChrome(base, timeout) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    try {
      const res = await fetch(base + '/json/version');
      if (res.ok) return true;
    } catch (err) { /* retry */ }
    await sleep(150);
  }
  return false;
}

function connect(url) {
  return new Promise((resolveWs, reject) => {
    const ws = new WebSocket(url);
    ws.onopen = () => resolveWs(ws);
    ws.onerror = (e) => reject(new Error('WebSocket 连接失败'));
  });
}

async function runPage(base, page, opts) {
  const url = 'file:///' + resolve(ROOT, page).replace(/\\/g, '/');
  const target = await (await fetch(base + '/json/new?' + encodeURIComponent(url), { method: 'PUT' })).json();
  const ws = await connect(target.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const events = [];
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    } else if (msg.method) events.push(msg);
  };
  const send = (method, params = {}) => new Promise((res) => {
    const i = ++id;
    pending.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params }));
  });

  await send('Runtime.enable');
  await send('Log.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  await send('Page.navigate', { url });
  await sleep(1300);
  const result = await send('Runtime.evaluate', {
    expression: `(() => ({
      kit: !!window.MotionKit,
      hidden: [...document.querySelectorAll('[data-reveal]')].filter(e => getComputedStyle(e).opacity === '0').length,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      title: document.title
    }))()`,
    returnByValue: true,
  });
  const errors = events.filter(
    (e) => e.method === 'Runtime.exceptionThrown' ||
      (e.method === 'Log.entryAdded' && e.params.entry.level === 'error')
  );

  let shotPath = null;
  if (opts.screenshots) {
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    const name = page.replace(/[\\/]/g, '__').replace(/\.html$/, '.png');
    shotPath = join(resolve(ROOT, opts.screenshots), name);
    mkdirSync(dirname(shotPath), { recursive: true });
    writeFileSync(shotPath, Buffer.from(shot.result.data, 'base64'));
  }

  ws.close();
  await fetch(base + '/json/close/' + target.id).catch(() => {});
  return {
    page,
    ...result.result.result.value,
    errors: errors.length,
    shot: shotPath,
  };
}

async function main() {
  const opts = parse(process.argv.slice(2));
  if (typeof WebSocket === 'undefined') {
    console.error('[smoke] 需要 Node 22+（global WebSocket）');
    process.exitCode = 1;
    return;
  }
  const chrome = findChrome(opts.chrome);
  if (!chrome) {
    console.error('[smoke] 没找到 Chrome/Edge；用 --chrome <path> 指定');
    process.exitCode = 1;
    return;
  }

  const profile = join(tmpdir(), 'motion-kit-smoke-' + process.pid);
  rmSync(profile, { recursive: true, force: true });
  const child = spawn(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    '--remote-debugging-port=' + opts.port,
    '--user-data-dir=' + profile,
    'about:blank',
  ], { stdio: 'ignore' });

  const base = 'http://127.0.0.1:' + opts.port;
  const ready = await waitForChrome(base, 12000);
  if (!ready) {
    child.kill();
    console.error('[smoke] Chrome 启动超时');
    process.exitCode = 1;
    return;
  }

  const pages = Array.from(new Set([
    'index.html',
    'templates/demo-shell/index.html',
    'templates/demo-shell/after.html',
    ...walk('templates'),
    ...walk('components'),
    ...walk('presets'),
  ])).filter((p) => !p.endsWith('templates/demo-shell/before.html'));

  let failed = 0;
  const rows = [];
  try {
    for (const page of pages) {
      try {
        const row = await runPage(base, page, opts);
        rows.push(row);
        const overflow = row.overflow > 1;
        const hidden = row.hidden > 0;
        const bad = overflow || hidden || row.errors > 0;
        if (bad) failed += 1;
        console.log(
          (bad ? '✗' : '✓') + ' ' + page +
          ' · overflow ' + row.overflow +
          ' · hidden ' + row.hidden +
          ' · errors ' + row.errors +
          (row.shot ? ' · ' + row.shot : '')
        );
      } catch (err) {
        failed += 1;
        console.log('✗ ' + page + ' — ' + err.message);
      }
    }
  } finally {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      child.kill('SIGTERM');
    }
    await sleep(600);
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    } catch (err) {
      console.warn('[smoke] 临时 profile 未清理：' + profile);
    }
  }

  console.log('\n' + (failed ? '✗ ' + failed + ' 页失败' : '✓ ' + pages.length + ' 页通过'));
  if (failed) process.exitCode = 1;
}

main();
