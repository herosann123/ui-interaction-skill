#!/usr/bin/env node
/* HTML → PDF / PNG（零依赖 CDP，使用本机 Chrome/Edge）。
   用法：
     node scripts/export.mjs --in templates/demo-shell/after.html --out out.pdf
     node scripts/export.mjs --in ... --out out.png --full-page
     node scripts/export.mjs --in ... --out out.png --width 390 --height 844 --mobile
*/
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, resolve } from 'node:path';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parse(argv) {
  const out = { width: 1440, height: 1000, wait: 1500, fullPage: false, mobile: false, reduced: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--in') out.in = argv[++i];
    else if (arg === '--url') out.url = argv[++i];
    else if (arg === '--out') out.out = argv[++i];
    else if (arg === '--width') out.width = parseInt(argv[++i], 10) || 1440;
    else if (arg === '--height') out.height = parseInt(argv[++i], 10) || 1000;
    else if (arg === '--wait') out.wait = parseInt(argv[++i], 10) || 1500;
    else if (arg === '--full-page') out.fullPage = true;
    else if (arg === '--mobile') out.mobile = true;
    else if (arg === '--reduced') out.reduced = true;
    else if (arg === '--help' || arg === '-h') out.help = true;
  }
  return out;
}

function findChrome() {
  const candidates = [
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

function parseSize(args, format) {
  if (format === 'pdf') {
    return { paperWidth: args.width / 96, paperHeight: args.height / 96 };
  }
  return { width: args.width, height: args.height };
}

async function main() {
  const args = parse(process.argv.slice(2));
  if (args.help || (!args.in && !args.url) || !args.out) {
    console.log('用法: node scripts/export.mjs --in <html>|--url <url> --out <file.pdf|file.png> [--width 1440] [--height 1000] [--full-page] [--mobile] [--reduced]');
    process.exitCode = args.help ? 0 : 1;
    return;
  }
  if (typeof WebSocket === 'undefined') {
    console.error('[export] 需要 Node 22+（global WebSocket）');
    process.exitCode = 1;
    return;
  }
  const chrome = findChrome();
  if (!chrome) {
    console.error('[export] 没找到 Chrome/Edge；设置 CHROME_PATH');
    process.exitCode = 1;
    return;
  }
  const out = resolve(process.cwd(), args.out);
  const format = extname(out).toLowerCase() === '.pdf' ? 'pdf' : 'png';
  const targetUrl = args.url || 'file:///' + resolve(process.cwd(), args.in).replace(/\\/g, '/');
  const profile = resolve(tmpdir(), 'motion-kit-export-' + process.pid);
  rmSync(profile, { recursive: true, force: true });
  const port = 9444;
  const child = spawn(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    '--remote-debugging-port=' + port,
    '--user-data-dir=' + profile,
    'about:blank',
  ], { stdio: 'ignore' });
  const base = 'http://127.0.0.1:' + port;
  if (!(await waitForChrome(base, 12000))) {
    child.kill();
    console.error('[export] Chrome 启动超时');
    process.exitCode = 1;
    return;
  }
  const target = await (await fetch(base + '/json/new?' + encodeURIComponent(targetUrl), { method: 'PUT' })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  };
  await new Promise((r) => { ws.onopen = r; });
  const send = (method, params = {}) => new Promise((res) => {
    const i = ++id;
    pending.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params }));
  });

  try {
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: args.width,
      height: args.height,
      deviceScaleFactor: 1,
      mobile: args.mobile,
    });
    if (args.reduced) {
      await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    }
    await send('Page.navigate', { url: targetUrl });
    await sleep(args.wait);

    let data;
    if (format === 'pdf') {
      const size = parseSize(args, 'pdf');
      const pdf = await send('Page.printToPDF', {
        printBackground: true,
        preferCSSPageSize: false,
        paperWidth: size.paperWidth,
        paperHeight: size.paperHeight,
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
      });
      data = Buffer.from(pdf.result.data, 'base64');
    } else {
      let clip;
      if (args.fullPage) {
        const metrics = await send('Page.getLayoutMetrics');
        const size = metrics.result.cssContentSize || metrics.result.contentSize;
        clip = { x: 0, y: 0, width: Math.ceil(size.width), height: Math.ceil(size.height), scale: 1 };
      }
      const shot = await send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: true,
        ...(clip ? { clip } : {}),
      });
      data = Buffer.from(shot.result.data, 'base64');
    }
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, data);
    console.log('[export] ' + args.out + ' · ' + (data.length / 1024).toFixed(1) + ' KB');
  } finally {
    ws.close();
    if (process.platform === 'win32') {
      spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      child.kill('SIGTERM');
    }
    await sleep(500);
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    } catch (err) { /* noop */ }
    await fetch(base + '/json/close/' + target.id).catch(() => {});
  }
}

main();
