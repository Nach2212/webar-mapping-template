// Compila marcadores desde la terminal usando compile.html en Chrome headless.
// Uso:  node tools/compile.mjs salida.mind imagen0.png imagen1.png …
// (Opcional: la forma normal es abrir compile.html en el navegador.)
import { writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from '../tests/lib/cdp.mjs';
import { serve } from '../tests/lib/server.mjs';
import { inspectMind } from '../utils.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export async function compileMarkers(images) {
  const rel = images.map((p) => relative(root, resolve(p)).replaceAll('\\', '/'));
  if (rel.some((p) => p.startsWith('..'))) throw new Error('Las imágenes deben estar dentro de la carpeta del proyecto.');
  const server = await serve(root);
  const chrome = await launch();
  try {
    await chrome.goto(`${server.url}/compile.html`);
    await chrome.waitFor(`!document.getElementById('status').textContent.includes('Cargando')`, 'que cargue el compilador', 60000);
    await chrome.evaluate(`(async () => {
      HTMLAnchorElement.prototype.click = function () {}; // sin descarga: leemos el resultado directo
      const dt = new DataTransfer();
      for (const p of ${JSON.stringify(rel)}) {
        const blob = await (await fetch(p)).blob();
        dt.items.add(new File([blob], p.split('/').pop(), { type: blob.type }));
      }
      const input = document.getElementById('files');
      input.files = dt.files;
      input.dispatchEvent(new Event('change'));
    })()`);
    await chrome.waitFor(`!document.getElementById('go').disabled`, 'que se lean las imágenes');
    await chrome.click('#go');
    await chrome.waitFor(`window.lastCompiled || document.getElementById('status').classList.contains('error')`, 'la compilación', 300000);
    const b64 = await chrome.evaluate(`(async () => {
      if (!window.lastCompiled) return null;
      const u8 = new Uint8Array(await window.lastCompiled.blob.arrayBuffer());
      let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
      return btoa(s);
    })()`);
    if (!b64) throw new Error('La compilación falló: ' + await chrome.evaluate(`document.getElementById('status').textContent`));
    return Buffer.from(b64, 'base64');
  } finally {
    await chrome.close();
    server.close();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [out, ...images] = process.argv.slice(2);
  if (!out || !images.length) {
    console.error('Uso: node tools/compile.mjs salida.mind imagen0.png imagen1.png …');
    process.exit(1);
  }
  const buf = await compileMarkers(images);
  const info = inspectMind(buf);
  if (!info.ok || info.count !== images.length) throw new Error(`Resultado inesperado: ${JSON.stringify(info)}`);
  writeFileSync(out, buf);
  console.log(`✅ ${out}: ${info.count} marcador(es), ${buf.length} bytes`);
}
