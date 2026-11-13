// Cliente mínimo del protocolo DevTools de Chrome, sin dependencias (Node 22+).
// Lanza Chrome headless y permite evaluar JS y hacer clics "de verdad".
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ].filter(Boolean);
  const found = candidates.find((p) => existsSync(p));
  if (!found) throw new Error('No encontré Chrome. Define CHROME_PATH con la ruta del ejecutable.');
  return found;
}

export async function launch({ args = [], width = 412, height = 820 } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'webar-e2e-'));
  const proc = spawn(findChrome(), [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${dir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--no-sandbox',
    '--enable-unsafe-swiftshader', // WebGL por software donde no hay GPU (CI)
    '--ignore-gpu-blocklist',
    '--mute-audio',
    `--window-size=${width},${height}`,
    ...args,
    'about:blank'
  ], { stdio: 'ignore' });

  const portFile = join(dir, 'DevToolsActivePort');
  for (let i = 0; i < 150 && !existsSync(portFile); i++) await sleep(100);
  if (!existsSync(portFile)) { proc.kill(); throw new Error('Chrome no abrió el puerto de depuración'); }
  const port = readFileSync(portFile, 'utf8').split('\n')[0].trim();

  let target;
  for (let i = 0; i < 50 && !target; i++) {
    const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    target = list.find((t) => t.type === 'page');
    if (!target) await sleep(100);
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('No pude conectar con Chrome')); });

  let seq = 0;
  const pending = new Map();
  const listeners = [];
  const logs = [];
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    } else if (msg.method) {
      if (msg.method === 'Runtime.consoleAPICalled') {
        logs.push(`[${msg.params.type}] ` + msg.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
      } else if (msg.method === 'Runtime.exceptionThrown') {
        const d = msg.params.exceptionDetails;
        logs.push('[exception] ' + (d.exception?.description ?? d.text));
      }
      listeners.forEach((fn) => fn(msg));
    }
  };

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

  await send('Runtime.enable');
  await send('Page.enable');

  /** Evalúa una expresión (puede ser async) y devuelve su valor. */
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
    return r.result.value;
  };

  const goto = async (url) => {
    await send('Page.navigate', { url });
    for (let i = 0; i < 300; i++) {
      if (await evaluate('document.readyState').catch(() => '') === 'complete') return;
      await sleep(100);
    }
    throw new Error('La página no terminó de cargar: ' + url);
  };

  /** Espera hasta que la expresión sea verdadera; si no, falla con `what`. */
  const waitFor = async (expression, what, timeout = 30000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) {
      const v = await evaluate(expression).catch(() => false);
      if (v) return v;
      await sleep(200);
    }
    throw new Error(`Tiempo agotado esperando: ${what}`);
  };

  /** Clic real (cuenta como gesto del usuario, igual que un toque). */
  const click = async (selector) => {
    const pos = await evaluate(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); if (!e) return null;
      const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width }; })()`);
    if (!pos || !pos.w) throw new Error('No puedo hacer clic (no visible): ' + selector);
    for (const type of ['mousePressed', 'mouseReleased']) {
      await send('Input.dispatchMouseEvent', { type, x: pos.x, y: pos.y, button: 'left', clickCount: 1 });
    }
  };

  const close = async () => {
    try { await send('Browser.close'); } catch (_) { /* ya cerrado */ }
    await sleep(300);
    try { proc.kill(); } catch (_) { /* nada */ }
    try { rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch (_) { /* nada */ }
  };

  return { send, evaluate, goto, waitFor, click, close, logs, on: (fn) => listeners.push(fn) };
}

export { sleep };
