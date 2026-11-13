// Pruebas de punta a punta en Chrome headless con una CÁMARA SIMULADA que
// "ve" el marcador. Sin dependencias: Node 22+ y Chrome instalado.
//
//   node tests/e2e.mjs            corre todo
//   node tests/e2e.mjs foto       corre solo las pruebas cuyo nombre contiene "foto"
//
// Ojo: esto prueba el motor de Chrome de escritorio. No reemplaza probar en
// un celular real (cámara, permisos, Safari de iOS).
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, sleep } from './lib/cdp.mjs';
import { serve } from './lib/server.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const filter = process.argv[2] ?? '';
const tmp = mkdtempSync(join(tmpdir(), 'webar-cam-'));
const generated = new Map(); // archivos de prueba creados al vuelo
const server = await serve(root, 0, generated);
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

/** Crea un video .y4m de un cuadro con el marcador al centro: será "lo que ve la cámara". */
async function makeFakeCamera(markerPath, name, { size = 1, tilt = 0 } = {}) {
  const chrome = await launch();
  try {
    await chrome.goto(`${server.url}/tests/fixtures/blank.html`);
    const b64 = await chrome.evaluate(`(async () => {
      const W = 640, H = 480;
      const img = new Image();
      img.src = ${JSON.stringify('/' + markerPath)};
      await img.decode();
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const g = c.getContext('2d');
      g.fillStyle = '#6f6a63'; g.fillRect(0, 0, W, H);
      const s = Math.min(460 / img.naturalWidth, 340 / img.naturalHeight) * ${size};
      const w = img.naturalWidth * s, h = img.naturalHeight * s;
      g.translate(W / 2, H / 2); g.rotate(${tilt} * Math.PI / 180);
      g.transform(1, 0, ${tilt ? -0.25 : 0}, 1, 0, 0); // inclinación: simula mirar el marcador de lado
      g.drawImage(img, -w / 2, -h / 2, w, h);
      g.resetTransform();
      const px = g.getImageData(0, 0, W, H).data;
      const out = new Uint8Array(W * H * 3 / 2);
      let u = W * H, v = u + (W * H) / 4;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4, r = px[i], gg = px[i + 1], b = px[i + 2];
        out[y * W + x] = 0.299 * r + 0.587 * gg + 0.114 * b;
        if (y % 2 === 0 && x % 2 === 0) {
          out[u++] = 128 - 0.168736 * r - 0.331264 * gg + 0.5 * b;
          out[v++] = 128 + 0.5 * r - 0.418688 * gg - 0.081312 * b;
        }
      }
      let str = ''; for (let i = 0; i < out.length; i += 0x8000) str += String.fromCharCode.apply(null, out.subarray(i, i + 0x8000));
      return btoa(str);
    })()`);
    const frame = Buffer.from(b64, 'base64');
    const file = join(tmp, name + '.y4m');
    writeFileSync(file, Buffer.concat([Buffer.from('YUV4MPEG2 W640 H480 F30:1 Ip A1:1 C420jpeg\n'), Buffer.from('FRAME\n'), frame]));
    return file;
  } finally {
    await chrome.close();
  }
}

const withCamera = (file) => ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', `--use-file-for-fake-video-capture=${file}`];

/** Abre la app, toca "Activar cámara" y espera a que el marcador aparezca. */
async function openAndTrack(chrome, query = '') {
  await chrome.goto(`${server.url}/index.html?lang=es&debug${query}`);
  await chrome.waitFor(`window.__webar && window.__webar.phase === 'ready'`, 'que la app quede lista', 60000);
  await chrome.click('#startBtn');
  await chrome.waitFor(`window.__webar.phase === 'running' || window.__webar.phase === 'error'`, 'que arranque la cámara', 90000);
  assert(await chrome.evaluate(`window.__webar.phase`) === 'running', 'La app mostró un error: ' + await chrome.evaluate(`window.__webar.error`));
  await chrome.waitFor(`window.__webar.visible.length > 0`, 'que detecte el marcador', 90000);
}

/** Abre la app con una configuración y espera el mensaje de error. Devuelve su texto. */
async function expectError(chrome, query, { start = false } = {}) {
  await chrome.goto(`${server.url}/index.html?lang=es${query}`);
  if (start) {
    await chrome.waitFor(`window.__webar && window.__webar.phase === 'ready'`, 'que la app quede lista', 60000);
    await chrome.click('#startBtn');
  }
  await chrome.waitFor(`window.__webar && window.__webar.phase === 'error'`, 'el mensaje de error', 60000);
  assert(await chrome.evaluate(`!document.getElementById('msg').classList.contains('hidden') && !!document.querySelector('#msg button')`), 'El mensaje de error no está visible o no tiene botón');
  return chrome.evaluate(`document.getElementById('msg').textContent`);
}

/** Graba en Chrome un video corto magenta con un tono de 660 Hz (para probar type: 'video'). */
async function makeTestVideo() {
  const chrome = await launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  try {
    await chrome.goto(`${server.url}/tests/fixtures/blank.html`);
    const b64 = await chrome.evaluate(`(async () => {
      const c = document.createElement('canvas'); c.width = 320; c.height = 180;
      const g = c.getContext('2d');
      let n = 0;
      const paint = () => { g.fillStyle = '#ff00ff'; g.fillRect(0, 0, 320, 180); g.fillStyle = '#fff'; g.fillRect((n++ * 4) % 320, 0, 6, 180); };
      paint();
      const timer = setInterval(paint, 33);
      const ac = new AudioContext(); const osc = ac.createOscillator(); osc.frequency.value = 660;
      const dest = ac.createMediaStreamDestination(); osc.connect(dest); osc.start();
      const rec = new MediaRecorder(new MediaStream([...c.captureStream(30).getVideoTracks(), ...dest.stream.getAudioTracks()]), { mimeType: 'video/webm' });
      const chunks = []; rec.ondataavailable = (e) => chunks.push(e.data);
      rec.start(); await new Promise((r) => setTimeout(r, 2000));
      await new Promise((r) => { rec.onstop = r; rec.stop(); }); clearInterval(timer);
      const u8 = new Uint8Array(await new Blob(chunks).arrayBuffer());
      let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
      return btoa(s);
    })()`);
    return Buffer.from(b64, 'base64');
  } finally { await chrome.close(); }
}

/** Graba unos segundos con el botón y devuelve datos del video, incluido el volumen (RMS) de su audio. */
async function recordAndMeasure(chrome, ms = 3000) {
  await chrome.click('#rec');
  await chrome.waitFor(`document.getElementById('rec').classList.contains('on')`, 'que empiece a grabar');
  await sleep(ms);
  await chrome.click('#rec');
  await chrome.waitFor(`window.__webar.lastCapture && window.__webar.lastCapture.kind === 'video' && document.querySelector('#previewMedia video')`, 'la vista previa del video');
  return chrome.evaluate(`(async () => {
    const buf = await (await fetch(document.querySelector('#previewMedia video').src)).arrayBuffer();
    let rms = 0, seconds = 0;
    try {
      const audio = await new AudioContext().decodeAudioData(buf);
      const d = audio.getChannelData(0); let sum = 0;
      for (let i = 0; i < d.length; i++) sum += d[i] * d[i];
      rms = Math.sqrt(sum / d.length); seconds = audio.duration;
    } catch (_) { /* el archivo no trae audio */ }
    return { ...window.__webar.lastCapture, rms, audioSeconds: seconds };
  })()`);
}

const demoCam = await makeFakeCamera('targets/marker-demo.png', 'demo');
generated.set('/tests/tmp/video.webm', await makeTestVideo());

const tests = [
  ['unitarias + carga en el navegador (tests/index.html)', async () => {
    const chrome = await launch();
    try {
      await chrome.goto(`${server.url}/tests/index.html`);
      await chrome.waitFor(`document.getElementById('summary').dataset.status !== 'running'`, 'que terminen las pruebas', 90000);
      const text = await chrome.evaluate(`document.getElementById('summary').textContent + '\\n' + [...document.querySelectorAll('li.fail')].map((l) => l.textContent).join('\\n')`);
      assert(await chrome.evaluate(`document.getElementById('summary').dataset.status`) === 'pass', text);
    } finally { await chrome.close(); }
  }],

  ['demo: detecta el marcador, saca foto y graba video', async () => {
    const chrome = await launch({ args: withCamera(demoCam) });
    try {
      await openAndTrack(chrome);
      assert(await chrome.evaluate(`document.getElementById('hint').classList.contains('hidden')`), 'La pista "Busca el marcador" debería ocultarse');

      // Foto
      await chrome.click('#photo');
      await chrome.waitFor(`window.__webar.lastCapture && window.__webar.lastCapture.kind === 'photo' && document.querySelector('#previewMedia img')`, 'la vista previa de la foto');
      const photo = await chrome.evaluate(`(async () => {
        const img = document.querySelector('#previewMedia img'); await img.decode();
        const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
        const g = c.getContext('2d'); g.drawImage(img, 0, 0);
        const d = g.getImageData(0, 0, c.width, c.height).data;
        let sum = 0; for (let i = 0; i < d.length; i += 4) sum += d[i] + d[i + 1] + d[i + 2];
        return { w: c.width, h: c.height, mean: sum / (d.length / 4 * 3), type: window.__webar.lastCapture.type,
                 download: document.getElementById('downloadBtn').download };
      })()`);
      assert(photo.type === 'image/jpeg' && photo.w >= 300 && photo.h >= 300, 'Foto con tamaño raro: ' + JSON.stringify(photo));
      assert(photo.mean > 20, 'La foto salió negra: ' + JSON.stringify(photo));
      assert(/^webar-\d+\.jpg$/.test(photo.download), 'Nombre de descarga inesperado: ' + photo.download);
      await chrome.click('#closeBtn');
      assert(await chrome.evaluate(`document.getElementById('preview').classList.contains('hidden')`), 'La vista previa no se cerró');

      // Video
      await chrome.click('#rec');
      await chrome.waitFor(`document.getElementById('rec').classList.contains('on')`, 'que empiece a grabar');
      await sleep(3000);
      await chrome.click('#rec');
      await chrome.waitFor(`window.__webar.lastCapture && window.__webar.lastCapture.kind === 'video' && document.querySelector('#previewMedia video')`, 'la vista previa del video');
      const video = await chrome.evaluate(`(async () => {
        const v = document.querySelector('#previewMedia video');
        if (v.readyState < 1) await new Promise((ok, no) => { v.onloadedmetadata = ok; v.onerror = () => no(new Error('el video grabado no se puede abrir')); });
        return { w: v.videoWidth, h: v.videoHeight, ...window.__webar.lastCapture, recOn: document.getElementById('rec').classList.contains('on') };
      })()`);
      assert(video.size > 10000 && video.w >= 300 && !video.recOn, 'Video inválido: ' + JSON.stringify(video));
      assert(video.hasAudio === false, 'Sin contenido con sonido, el video no debería llevar pista de audio');
      console.log(`      foto ${photo.w}×${photo.h} · video ${video.w}×${video.h} ${video.type} ${Math.round(video.size / 1024)} KB`);
      const errors = chrome.logs.filter((l) => l.startsWith('[exception]') || l.startsWith('[error]'));
      assert(errors.length === 0, 'Errores en la consola:\n' + errors.join('\n'));
    } finally { await chrome.close(); }
  }],

  ['demo: el video se corta solo al llegar a maxVideoSeconds', async () => {
    const chrome = await launch({ args: withCamera(demoCam) });
    try {
      await openAndTrack(chrome, '&config=tests/fixtures/config-short-video.js');
      await chrome.click('#rec');
      await chrome.waitFor(`window.__webar.lastCapture && window.__webar.lastCapture.kind === 'video'`, 'que el video se cierre solo', 15000);
    } finally { await chrome.close(); }
  }],

  ['audio: el sonido del marcador queda dentro del video grabado', async () => {
    const chrome = await launch({ args: withCamera(demoCam) });
    try {
      await openAndTrack(chrome, '&config=tests/fixtures/config-audio.js');
      const v = await recordAndMeasure(chrome);
      console.log(`      ${v.type} ${Math.round(v.size / 1024)} KB · audio ${v.audioSeconds.toFixed(1)} s · RMS ${v.rms.toFixed(3)}`);
      assert(v.hasAudio, 'La grabación no incluyó pista de audio');
      assert(v.rms > 0.02, 'El audio grabado está en silencio (RMS ' + v.rms + ')');
      const errors = chrome.logs.filter((l) => l.startsWith('[exception]') || l.startsWith('[error]'));
      assert(errors.length === 0, 'Errores en la consola:\n' + errors.join('\n'));
    } finally { await chrome.close(); }
  }],

  ['video: se ve sobre el marcador y su sonido queda grabado', async () => {
    const chrome = await launch({ args: withCamera(demoCam) });
    try {
      await openAndTrack(chrome, '&config=tests/fixtures/config-video.js');
      await sleep(1500);
      await chrome.click('#photo');
      await chrome.waitFor(`document.querySelector('#previewMedia img') && document.querySelector('#previewMedia img').naturalWidth > 0`, 'la foto');
      const magenta = await chrome.evaluate(`(() => {
        const img = document.querySelector('#previewMedia img');
        const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
        const g = c.getContext('2d'); g.drawImage(img, 0, 0);
        const d = g.getImageData(0, 0, c.width, c.height).data; let n = 0;
        for (let i = 0; i < d.length; i += 4) if (d[i] > 180 && d[i + 1] < 90 && d[i + 2] > 180) n++;
        return n / (d.length / 4);
      })()`);
      assert(magenta > 0.05, 'El video no aparece en la foto (magenta: ' + (magenta * 100).toFixed(1) + '%)');
      await chrome.click('#closeBtn');
      const v = await recordAndMeasure(chrome);
      console.log(`      video visible en ${(magenta * 100).toFixed(0)}% de la foto · audio RMS ${v.rms.toFixed(3)}`);
      assert(v.hasAudio && v.rms > 0.02, 'El sonido del video no quedó en la grabación: ' + JSON.stringify(v));
    } finally { await chrome.close(); }
  }],

  ['ejemplos: los 3 marcadores de examples/ se detectan (de frente, y lejos e inclinados)', async () => {
    const names = ['engranajes', 'constelacion', 'mosaico'];
    const files = ['01-engranajes', '02-constelacion', '03-mosaico'];
    for (const [label, pose] of [['de frente', {}], ['lejos e inclinado', { size: 0.6, tilt: 20 }]]) {
      for (let i = 0; i < 3; i++) {
        const cam = await makeFakeCamera(`examples/markers/${files[i]}.png`, `ej-${i}-${pose.tilt ?? 0}`, pose);
        const chrome = await launch({ args: withCamera(cam) });
        try {
          await openAndTrack(chrome, '&config=examples/config.js');
          const seen = await chrome.evaluate(`window.__webar.visible[0]`);
          assert(seen === names[i], `Mostrando ${files[i]} (${label}) se detectó «${seen}»`);
          await sleep(1200);
          assert(await chrome.evaluate(`window.__webar.visible[0]`) === names[i], `${files[i]} (${label}): el seguimiento se perdió`);
          const errors = chrome.logs.filter((l) => l.startsWith('[exception]') || l.startsWith('[error]'));
          assert(errors.length === 0, 'Errores en la consola: ' + errors.join(' | '));
        } finally { await chrome.close(); }
      }
    }
  }],

  ['rendimiento: perfiles de calidad limitan pixel ratio, cámara y captura', async () => {
    const measure = async (q) => {
      const chrome = await launch({ args: [...withCamera(demoCam), '--force-device-scale-factor=3'] });
      try {
        await openAndTrack(chrome, '&q=' + q);
        await chrome.click('#photo');
        await chrome.waitFor(`document.querySelector('#previewMedia img') && document.querySelector('#previewMedia img').naturalWidth > 0`, 'la foto');
        return await chrome.evaluate(`(() => { const c = document.querySelector('#ar canvas'); const i = document.querySelector('#previewMedia img');
          return { quality: window.__webar.quality, ratio: c.width / c.clientWidth, photoLong: Math.max(i.naturalWidth, i.naturalHeight), dpr: devicePixelRatio }; })()`);
      } finally { await chrome.close(); }
    };
    const high = await measure('high');
    const low = await measure('low');
    console.log(`      high ${JSON.stringify(high)}
      low  ${JSON.stringify(low)}`);
    assert(high.dpr === 3, 'La prueba necesita devicePixelRatio 3');
    assert(high.quality === 'high' && Math.abs(high.ratio - 2) < 0.05, 'high debería limitar el pixel ratio a 2');
    assert(low.quality === 'low' && Math.abs(low.ratio - 1) < 0.05, 'low debería usar pixel ratio 1');
    assert(low.photoLong <= 854 && high.photoLong <= 1280, 'Tamaño de captura fuera del límite');
  }],

  ['error: permiso de cámara denegado', async () => {
    const chrome = await launch({ args: ['--use-fake-device-for-media-stream', '--deny-permission-prompts'] });
    try {
      const text = await expectError(chrome, '', { start: true });
      assert(text.includes('No hay permiso para usar la cámara'), 'Mensaje inesperado: ' + text);
    } finally { await chrome.close(); }
  }],

  ['error: falta el archivo .mind', async () => {
    const chrome = await launch();
    try {
      const text = await expectError(chrome, '&config=tests/fixtures/config-missing-mind.js');
      assert(text.includes('No encontré el archivo de marcadores') && text.includes('targets/no-existe.mind'), 'Mensaje inesperado: ' + text);
    } finally { await chrome.close(); }
  }],

  ['error: el .mind es en realidad una página HTML', async () => {
    const chrome = await launch();
    try {
      const text = await expectError(chrome, '&config=tests/fixtures/config-html-mind.js');
      assert(text.includes('no es un archivo de marcadores'), 'Mensaje inesperado: ' + text);
    } finally { await chrome.close(); }
  }],

  ['error: config con más marcadores que el .mind', async () => {
    const chrome = await launch();
    try {
      const text = await expectError(chrome, '&config=tests/fixtures/config-too-many.js');
      assert(text.includes('define 2 marcadores') && text.includes('solo trae 1'), 'Mensaje inesperado: ' + text);
    } finally { await chrome.close(); }
  }],

  ['error: config.js mal escrito lista cada problema', async () => {
    const chrome = await launch();
    try {
      const text = await expectError(chrome, '&config=tests/fixtures/config-bad.js');
      assert(text.includes('targets[0].content[0].type') && text.includes('vido') && text.includes('targets[0].content[1].src') && text.includes('targets[0].content[1].position'), 'Mensaje inesperado: ' + text);
    } finally { await chrome.close(); }
  }],

  ['error: ?config con ruta no permitida o inexistente', async () => {
    const chrome = await launch();
    try {
      let text = await expectError(chrome, '&config=https://example.com/x.js');
      assert(text.includes('No pude cargar el archivo de configuración'), 'Mensaje inesperado: ' + text);
      text = await expectError(chrome, '&config=tests/fixtures/no-existe.js');
      assert(text.includes('No pude cargar el archivo de configuración'), 'Mensaje inesperado: ' + text);
    } finally { await chrome.close(); }
  }],

  ['aviso: un archivo de contenido que no existe no rompe el AR', async () => {
    const chrome = await launch({ args: withCamera(demoCam) });
    try {
      await chrome.goto(`${server.url}/index.html?lang=es&config=tests/fixtures/config-missing-asset.js`);
      await chrome.waitFor(`!document.getElementById('toast').classList.contains('hidden')`, 'el aviso de archivo faltante', 30000);
      assert((await chrome.evaluate(`document.getElementById('toast').textContent`)).includes('assets/no-existe.png'), 'El aviso no nombra el archivo');
      await chrome.click('#startBtn');
      await chrome.waitFor(`window.__webar.visible.length > 0`, 'que detecte el marcador igual', 90000);
    } finally { await chrome.close(); }
  }],

  ['aviso: sin conexión al CDN no queda en "Cargando…" para siempre', async () => {
    const chrome = await launch();
    try {
      await chrome.send('Network.enable');
      await chrome.send('Network.setBlockedURLs', { urls: ['*cdn.jsdelivr.net*'] });
      await chrome.goto(`${server.url}/index.html`);
      await chrome.waitFor(`!document.getElementById('bootNote').classList.contains('hidden')`, 'el aviso de que la app no cargó', 20000);
      assert((await chrome.evaluate(`document.getElementById('bootNote').textContent`)).includes('No se pudo cargar la app'), 'Texto inesperado');
    } finally { await chrome.close(); }
  }],

  ['interfaz en inglés con ?lang=en', async () => {
    const chrome = await launch();
    try {
      await chrome.goto(`${server.url}/index.html?lang=en`);
      await chrome.waitFor(`window.__webar && window.__webar.phase === 'ready'`, 'que la app quede lista', 60000);
      assert(await chrome.evaluate(`document.getElementById('startBtn').textContent`) === 'Enable camera', 'El botón no está en inglés');
      assert(await chrome.evaluate(`document.documentElement.lang`) === 'en', 'lang del documento');
    } finally { await chrome.close(); }
  }]
];

let failed = 0;
let ran = 0;
for (const [name, fn] of tests) {
  if (filter && !name.includes(filter)) continue;
  ran++;
  const t0 = Date.now();
  try {
    // Límite por prueba: en CI (WebGL por software) todo es más lento, pero nada debería colgarse.
    await Promise.race([fn(), new Promise((_, no) => setTimeout(() => no(new Error('La prueba superó los 5 minutos')), 300000).unref())]);
    console.log(`✓ ${name} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  } catch (e) {
    failed++;
    console.log(`✗ ${name}\n    ${String(e.message).split('\n').join('\n    ')}`);
  }
}
server.close();
try { rmSync(tmp, { recursive: true, force: true }); } catch (_) { /* nada */ }
console.log(`\n${ran - failed}/${ran} pruebas e2e OK`);
process.exit(failed ? 1 : 0);
