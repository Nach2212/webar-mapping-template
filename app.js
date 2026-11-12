import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import { CONFIG } from './config.js';

const $ = (id) => document.getElementById(id);
const container = $('ar');
const params = new URLSearchParams(location.search);
const watermark = params.has('wm') ? params.get('wm') : CONFIG.watermark;

function showMessage(html) {
  const m = $('msg');
  m.innerHTML = html;
  m.classList.remove('hidden');
}

// ---------- Contenido de cada marcador ----------
function buildContent(item, loader, videos) {
  const group = new THREE.Group();
  const w = item.width ?? 1;

  if (item.type === 'video') {
    const v = document.createElement('video');
    v.src = item.src;
    v.loop = item.loop ?? true;
    v.muted = true;            // necesario para autoplay en móviles
    v.playsInline = true;
    v.crossOrigin = 'anonymous';
    v.preload = 'auto';
    videos.push(v);
    const tex = new THREE.VideoTexture(v);
    tex.colorSpace = THREE.SRGBColorSpace;
    const vw = () => (v.videoHeight ? v.videoHeight / v.videoWidth : 9 / 16);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true })
    );
    v.addEventListener('loadedmetadata', () => mesh.scale.set(w, w * vw(), 1));
    mesh.scale.set(w, w * vw(), 1);
    mesh.position.set(...(item.position ?? [0, 0, 0.01]));
    group.add(mesh);
    group.userData.video = v;
  } else {
    const tex = loader.load(item.src);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    const img = new Image();
    img.onload = () => mesh.scale.set(w, w * (img.height / img.width), 1);
    img.src = item.src;
    mesh.scale.set(w, w, 1);
    mesh.position.set(...(item.position ?? [0, 0, 0.01]));
    if (item.spin) mesh.userData.spin = true;
    group.add(mesh);
  }
  return group;
}

// ---------- Arranque ----------
$('startBtn').addEventListener('click', async () => {
  $('start').classList.add('hidden');

  const mindar = new MindARThree({
    container,
    imageTargetSrc: CONFIG.targetsFile,
    maxTrack: 1,
    uiLoading: 'no',
    uiScanning: 'no',
    uiError: 'no',
    filterMinCF: parseFloat(params.get('cf') ?? '0.0001'),
    filterBeta: parseFloat(params.get('beta') ?? '0.001')
  });
  const { renderer, scene, camera } = mindar;
  const loader = new THREE.TextureLoader();
  const videos = [];
  const spinners = [];

  CONFIG.targets.forEach((t, i) => {
    const anchor = mindar.addAnchor(i);
    const myVideos = [];
    t.content.forEach((c) => {
      const g = buildContent(c, loader, myVideos);
      g.traverse((o) => o.userData.spin && spinners.push(o));
      anchor.group.add(g);
    });
    anchor.onTargetFound = () => {
      if (params.has('debug')) console.log('[webar] marcador encontrado:', t.name);
      $('hint').classList.add('hidden');
      myVideos.forEach((v) => v.play().catch(() => {}));
    };
    anchor.onTargetLost = () => {
      if (params.has('debug')) console.log('[webar] marcador perdido:', t.name);
      $('hint').classList.remove('hidden');
      myVideos.forEach((v) => v.pause());
    };
  });

  try {
    await mindar.start();
  } catch (e) {
    console.error(e);
    showMessage(
      `<h2>No pude abrir la cámara 😕</h2>
       <p>Revisa que diste permiso a la cámara y que la página está en <b>https</b>.</p>
       <button class="btn" onclick="location.reload()">Reintentar</button>`
    );
    return;
  }

  $('hint').classList.remove('hidden');
  $('controls').classList.remove('hidden');

  // ---------- Captura (foto / video con AR incluido) ----------
  const out = document.createElement('canvas');
  const ctx = out.getContext('2d');
  let photoRequested = false;
  let recorder = null;
  let chunks = [];
  let recStart = 0;

  function composeFrame() {
    const cr = container.getBoundingClientRect();
    const scale = Math.min(1, 1280 / Math.max(cr.width, cr.height));
    const W = Math.round((cr.width * scale) / 2) * 2; // dimensiones pares
    const H = Math.round((cr.height * scale) / 2) * 2;
    if (out.width !== W || out.height !== H) { out.width = W; out.height = H; }
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    const draw = (el) => {
      const r = el.getBoundingClientRect();
      ctx.drawImage(el, (r.left - cr.left) * scale, (r.top - cr.top) * scale, r.width * scale, r.height * scale);
    };
    const cam = container.querySelector('video');
    if (cam) draw(cam);
    draw(renderer.domElement);

    if (watermark) {
      ctx.font = `${Math.round(W * 0.035)}px system-ui, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.shadowColor = 'rgba(0,0,0,.6)';
      ctx.shadowBlur = 6;
      ctx.textAlign = 'right';
      ctx.fillText(watermark, W - 16, H - 16);
      ctx.shadowBlur = 0;
    }
  }

  async function save(blob, name) {
    const file = new File([blob], name, { type: blob.type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file] }); return; } catch (_) { /* cancelado */ }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  $('photo').addEventListener('click', () => { photoRequested = true; });

  function stopRecording() {
    if (recorder && recorder.state !== 'inactive') recorder.stop();
  }

  $('rec').addEventListener('click', () => {
    if (recorder && recorder.state === 'recording') return stopRecording();
    composeFrame(); // asegura tamaño del canvas antes de capturar
    const mime = ['video/mp4;codecs=avc1', 'video/webm;codecs=vp9', 'video/webm']
      .find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m));
    if (!mime) return showMessage('<p>Tu navegador no soporta grabar video 😕</p><button class="btn" onclick="location.reload()">Volver</button>');
    chunks = [];
    recorder = new MediaRecorder(out.captureStream(30), { mimeType: mime });
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.onstop = () => {
      const type = mime.startsWith('video/mp4') ? 'mp4' : 'webm';
      save(new Blob(chunks, { type: mime.split(';')[0] }), `webar-${Date.now()}.${type}`);
      $('rec').classList.remove('on');
      $('rec').textContent = '⏺';
      $('timer').textContent = '';
      recorder = null;
    };
    recorder.start();
    recStart = performance.now();
    $('rec').classList.add('on');
    $('rec').textContent = '⏹';
  });

  // ---------- Loop ----------
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = clock.getDelta();
    spinners.forEach((s) => (s.rotation.z += dt * 0.8));
    renderer.render(scene, camera);

    // Componer JUSTO después de render (así no hace falta preserveDrawingBuffer)
    if (photoRequested || recorder) {
      composeFrame();
      if (photoRequested) {
        photoRequested = false;
        out.toBlob((b) => b && save(b, `webar-${Date.now()}.jpg`), 'image/jpeg', 0.92);
      }
      if (recorder) {
        const s = (performance.now() - recStart) / 1000;
        $('timer').textContent = `${Math.floor(s)}s`;
        if (s >= CONFIG.maxVideoSeconds) stopRecording();
      }
    }
  });
});
