// Genera los marcadores de ejemplo (examples/markers/*.svg y *.png), los compila
// en examples/targets.mind y crea el sonido de ejemplo (examples/campanas.wav).
// Son dibujos procedurales con semilla fija: siempre sale lo mismo.
// Uso:  node tools/make-examples.mjs
//
// El .svg es para imprimir o proyectar en grande; el .png (640×448) es el que
// se compila. Cada marcador con mucho detalle suma cerca de 0,5 MB al .mind.
//
// Criterios de un buen marcador para mapping (ver docs/primer-mapping.md):
// mucho detalle, formas que no se repiten, bordes marcados y tonos medios
// (sin negro puro ni blanco puro, que un proyector no reproduce bien).
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from '../tests/lib/cdp.mjs';
import { serve } from '../tests/lib/server.mjs';
import { compileMarkers } from './compile.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'examples', 'markers');
const W = 1200, H = 840;      // tamaño del dibujo (SVG)
const PW = 640, PH = 448;      // tamaño del PNG que se compila

function rng(seed) { // mulberry32
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f = (n) => n.toFixed(1);
const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">\n${body}\n</svg>\n`;

// ---------- 1. Engranajes ----------
function gears() {
  const r = rng(11);
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const palette = ['#f2e3b3', '#e8833a', '#1f3347', '#2aa198', '#c94f4f', '#f7f1de'];
  let out = `<rect width="${W}" height="${H}" fill="#3f7396"/>`;
  // fondo: placas y remaches irregulares
  for (let i = 0; i < 26; i++) {
    const x = r() * W, y = r() * H, w = 60 + r() * 220, h = 30 + r() * 120;
    out += `<rect x="${f(x - w / 2)}" y="${f(y - h / 2)}" width="${f(w)}" height="${f(h)}" rx="8" fill="${pick(['#356486', '#4b82a6', '#2d5877', '#5a8fb0'])}" transform="rotate(${f(r() * 180)} ${f(x)} ${f(y)})"/>`;
  }
  const gear = (cx, cy, R, teeth, color, hole) => {
    const depth = R * (0.16 + r() * 0.08);
    const rot = r() * Math.PI;
    let d = '';
    for (let i = 0; i < teeth; i++) {
      const step = (Math.PI * 2) / teeth;
      const a = rot + i * step;
      const pts = [[a, R - depth], [a + step * 0.18, R], [a + step * 0.5, R], [a + step * 0.68, R - depth]];
      pts.forEach(([ang, rad], k) => { d += `${i === 0 && k === 0 ? 'M' : 'L'}${f(cx + Math.cos(ang) * rad)} ${f(cy + Math.sin(ang) * rad)} `; });
    }
    let g = `<path d="${d}Z" fill="${color}" stroke="#1f3347" stroke-width="5" stroke-linejoin="round"/>`;
    g += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R * 0.62)}" fill="none" stroke="#1f3347" stroke-width="4" stroke-dasharray="${f(6 + r() * 14)} ${f(5 + r() * 10)}"/>`;
    const spokes = 3 + Math.floor(r() * 4);
    for (let s = 0; s < spokes; s++) {
      const a = rot + (s * Math.PI * 2) / spokes;
      g += `<circle cx="${f(cx + Math.cos(a) * R * 0.4)}" cy="${f(cy + Math.sin(a) * R * 0.4)}" r="${f(R * (0.07 + r() * 0.07))}" fill="${hole}" stroke="#1f3347" stroke-width="3"/>`;
    }
    g += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R * 0.2)}" fill="${hole}" stroke="#1f3347" stroke-width="5"/>`;
    g += `<rect x="${f(cx - R * 0.06)}" y="${f(cy - R * 0.2)}" width="${f(R * 0.12)}" height="${f(R * 0.14)}" fill="#1f3347"/>`;
    return g;
  };
  const spec = [
    [300, 290, 215, 14, '#f2e3b3', '#e8833a'], [640, 520, 190, 11, '#e8833a', '#f7f1de'], [930, 240, 170, 9, '#2aa198', '#f2e3b3'],
    [1050, 640, 130, 8, '#f7f1de', '#c94f4f'], [140, 680, 120, 7, '#c94f4f', '#f2e3b3'], [620, 150, 100, 10, '#1f3347', '#2aa198'],
    [390, 700, 85, 6, '#2aa198', '#1f3347'], [860, 470, 70, 5, '#f2e3b3', '#1f3347'], [70, 110, 75, 9, '#e8833a', '#1f3347'], [1130, 70, 60, 7, '#c94f4f', '#f7f1de']
  ];
  spec.forEach((s) => { out += gear(...s); });
  for (let i = 0; i < 70; i++) { // tornillos y marcas sueltas
    const x = 20 + r() * (W - 40), y = 20 + r() * (H - 40), s = 4 + r() * 9;
    out += r() < 0.5
      ? `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s)}" fill="${pick(palette)}" stroke="#1f3347" stroke-width="2.5"/>`
      : `<rect x="${f(x)}" y="${f(y)}" width="${f(s * 2.4)}" height="${f(s)}" fill="${pick(palette)}" stroke="#1f3347" stroke-width="2" transform="rotate(${f(r() * 180)} ${f(x)} ${f(y)})"/>`;
  }
  return svg(out);
}

// ---------- 2. Constelación ----------
function constellation() {
  const r = rng(27);
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  let out = `<rect width="${W}" height="${H}" fill="#2c3170"/>`;
  for (let i = 0; i < 14; i++) { // nebulosas: manchas grandes de tonos medios
    out += `<ellipse cx="${f(r() * W)}" cy="${f(r() * H)}" rx="${f(90 + r() * 230)}" ry="${f(60 + r() * 150)}" fill="${pick(['#3d4696', '#5a3f8f', '#27507f', '#6a4aa3', '#2f6d8c'])}" opacity="0.75" transform="rotate(${f(r() * 180)} ${f(W / 2)} ${f(H / 2)})"/>`;
  }
  const star = (cx, cy, R, points, color) => {
    const inner = R * (0.35 + r() * 0.2), rot = r() * Math.PI;
    let d = '';
    for (let i = 0; i < points * 2; i++) {
      const a = rot + (i * Math.PI) / points, rad = i % 2 ? inner : R;
      d += `${i ? 'L' : 'M'}${f(cx + Math.cos(a) * rad)} ${f(cy + Math.sin(a) * rad)} `;
    }
    return `<path d="${d}Z" fill="${color}" stroke="#171a45" stroke-width="${f(Math.max(2, R * 0.09))}" stroke-linejoin="round"/>`;
  };
  // estrellas principales unidas por líneas
  const main = [];
  for (let i = 0; i < 17; i++) main.push([70 + r() * (W - 140), 60 + r() * (H - 120), 26 + r() * 46, 4 + Math.floor(r() * 5)]);
  let lines = '';
  main.forEach((a, i) => {
    const near = main.map((b, j) => [j, Math.hypot(a[0] - b[0], a[1] - b[1])]).filter(([j]) => j !== i).sort((p, q) => p[1] - q[1]).slice(0, 2);
    near.forEach(([j]) => { if (j > i) lines += `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(main[j][0])}" y2="${f(main[j][1])}" stroke="#f3e9c6" stroke-width="5" stroke-dasharray="${f(10 + r() * 22)} ${f(8 + r() * 12)}"/>`; });
  });
  out += lines;
  // planetas con anillos
  [[210, 620, 78, '#e8833a', '#f3e9c6'], [960, 190, 96, '#3fb6a8', '#f08bb0'], [700, 660, 54, '#f08bb0', '#f3e9c6']].forEach(([x, y, R, c, ring]) => {
    out += `<ellipse cx="${x}" cy="${y}" rx="${f(R * 1.75)}" ry="${f(R * 0.42)}" fill="none" stroke="${ring}" stroke-width="9" transform="rotate(${f(-30 + r() * 60)} ${x} ${y})"/>`;
    out += `<circle cx="${x}" cy="${y}" r="${R}" fill="${c}" stroke="#171a45" stroke-width="6"/>`;
    for (let k = 0; k < 5; k++) out += `<circle cx="${f(x - R * 0.5 + r() * R)}" cy="${f(y - R * 0.5 + r() * R)}" r="${f(R * (0.08 + r() * 0.14))}" fill="#171a45" opacity="0.55"/>`;
  });
  main.forEach(([x, y, R, p]) => { out += star(x, y, R, p, pick(['#ffd95a', '#f3e9c6', '#f08bb0', '#8fe3d6', '#ffb347'])); });
  for (let i = 0; i < 150; i++) { // estrellas chicas
    const x = r() * W, y = r() * H, s = 3 + r() * 9;
    out += r() < 0.6
      ? `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s * 0.6)}" fill="${pick(['#f3e9c6', '#ffd95a', '#8fe3d6'])}"/>`
      : star(x, y, s * 1.5, 4, pick(['#f3e9c6', '#ffd95a', '#f08bb0']));
  }
  return svg(out);
}

// ---------- 3. Mosaico ----------
function mosaic() {
  const r = rng(53);
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const tones = ['#d9574a', '#f0b84a', '#3f8fb8', '#3c9d7a', '#7a56a8', '#f3ead2', '#27374d', '#e98b5f', '#8cc7c4'];
  const cols = 9, rows = 7;
  const pts = [];
  for (let j = 0; j <= rows; j++) {
    pts.push([]);
    for (let i = 0; i <= cols; i++) {
      const edgeX = i === 0 || i === cols, edgeY = j === 0 || j === rows;
      pts[j].push([(i / cols) * W + (edgeX ? 0 : (r() - 0.5) * (W / cols) * 0.8), (j / rows) * H + (edgeY ? 0 : (r() - 0.5) * (H / rows) * 0.8)]);
    }
  }
  let out = `<rect width="${W}" height="${H}" fill="#27374d"/>`;
  const tri = (a, b, c) => {
    const cx = (a[0] + b[0] + c[0]) / 3, cy = (a[1] + b[1] + c[1]) / 3;
    let s = `<path d="M${f(a[0])} ${f(a[1])} L${f(b[0])} ${f(b[1])} L${f(c[0])} ${f(c[1])} Z" fill="${pick(tones)}" stroke="#1d2a3d" stroke-width="7" stroke-linejoin="round"/>`;
    const kind = r(); // un detalle distinto dentro de cada pieza
    if (kind < 0.3) s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(8 + r() * 16)}" fill="${pick(tones)}" stroke="#1d2a3d" stroke-width="3"/>`;
    else if (kind < 0.55) s += `<rect x="${f(cx - 12)}" y="${f(cy - 12)}" width="${f(14 + r() * 16)}" height="${f(10 + r() * 14)}" fill="${pick(tones)}" stroke="#1d2a3d" stroke-width="3" transform="rotate(${f(r() * 90)} ${f(cx)} ${f(cy)})"/>`;
    else if (kind < 0.75) s += `<path d="M${f(cx - 14)} ${f(cy + 10)} L${f(cx)} ${f(cy - 14 - r() * 8)} L${f(cx + 14)} ${f(cy + 10)} Z" fill="${pick(tones)}" stroke="#1d2a3d" stroke-width="3" transform="rotate(${f(r() * 360)} ${f(cx)} ${f(cy)})"/>`;
    return s;
  };
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const a = pts[j][i], b = pts[j][i + 1], c = pts[j + 1][i + 1], d = pts[j + 1][i];
    out += r() < 0.5 ? tri(a, b, c) + tri(a, c, d) : tri(a, b, d) + tri(b, c, d);
  }
  // formas grandes encima: dan estructura a escala media (ayuda a detectar de lejos)
  [[330, 300, 150], [860, 520, 180], [1010, 170, 95], [170, 660, 80]].forEach(([x, y, R]) => {
    out += `<circle cx="${x}" cy="${y}" r="${R}" fill="none" stroke="#f3ead2" stroke-width="16"/>`;
    out += `<circle cx="${x}" cy="${y}" r="${f(R * 0.72)}" fill="none" stroke="#1d2a3d" stroke-width="9" stroke-dasharray="${f(18 + r() * 30)} ${f(12 + r() * 18)}"/>`;
    out += `<circle cx="${x}" cy="${y}" r="${f(R * 0.3)}" fill="${pick(['#f0b84a', '#d9574a', '#8cc7c4'])}" stroke="#1d2a3d" stroke-width="7"/>`;
  });
  return svg(out);
}

const markers = [['01-engranajes', gears()], ['02-constelacion', constellation()], ['03-mosaico', mosaic()]];
mkdirSync(outDir, { recursive: true });
for (const [name, text] of markers) writeFileSync(join(outDir, `${name}.svg`), text);

// SVG → PNG con Chrome
const server = await serve(root);
const chrome = await launch({ width: W, height: H });
try {
  await chrome.goto(`${server.url}/tests/fixtures/blank.html`);
  for (const [name] of markers) {
    const b64 = await chrome.evaluate(`(async () => {
      const img = new Image(); img.src = '/examples/markers/${name}.svg'; await img.decode();
      const c = document.createElement('canvas'); c.width = ${PW}; c.height = ${PH};
      c.getContext('2d').drawImage(img, 0, 0, ${PW}, ${PH});
      return c.toDataURL('image/png').split(',')[1];
    })()`);
    writeFileSync(join(outDir, `${name}.png`), Buffer.from(b64, 'base64'));
    console.log(`✓ examples/markers/${name}.png`);
  }
} finally {
  await chrome.close();
  server.close();
}

// Sonido de ejemplo: campanas suaves en bucle (WAV mono, 22 kHz, ~2,4 s)
{
  const rate = 22050, seconds = 2.4, n = Math.floor(rate * seconds);
  const data = new Float32Array(n);
  [[523.25, 0], [659.25, 0.6], [783.99, 1.2], [659.25, 1.8]].forEach(([freq, at]) => {
    for (let i = Math.floor(at * rate); i < n; i++) {
      const t = i / rate - at;
      data[i] += Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 3.2) * 0.3 + Math.sin(2 * Math.PI * freq * 2 * t) * Math.exp(-t * 5) * 0.08;
    }
  });
  for (let i = 0; i < 400; i++) { data[i] *= i / 400; data[n - 1 - i] *= i / 400; } // sin "clic" al repetir
  const wav = Buffer.alloc(44 + n * 2);
  wav.write('RIFF', 0); wav.writeUInt32LE(36 + n * 2, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
  wav.write('data', 36); wav.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, data[i])) * 32767), 44 + i * 2);
  writeFileSync(join(root, 'examples', 'campanas.wav'), wav);
  console.log('✓ examples/campanas.wav');
}

const mind = await compileMarkers(markers.map(([name]) => join(outDir, `${name}.png`)));
writeFileSync(join(root, 'examples', 'targets.mind'), mind);
console.log(`✓ examples/targets.mind (${markers.length} marcadores, ${Math.round(mind.length / 1024)} KB)`);
