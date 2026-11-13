import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import { buildContent } from './content.js';
import { createCapture } from './capture.js';
import { makeT } from './i18n.js';
import { QUALITY, VERSION, cameraErrorKey, inspectMind, numParam, pickLang, pickQuality, safeConfigPath, shouldDowngrade, validateConfig } from './utils.js';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const debug = params.has('debug');
// ?config=carpeta/config.js permite tener varias experiencias en el mismo sitio.
const configParam = params.get('config');
const configFile = configParam === null ? 'config.js' : safeConfigPath(configParam);

// Estado visible desde la consola (window.__webar) y desde las pruebas.
const state = { version: VERSION, phase: 'boot', error: null, visible: [], camera: '', quality: '', fps: 0, recorder: '' };
window.__webar = state;

let t = makeT('es');
let mindar = null;
let capture = null;
let media = { videos: [], audios: [], sounds: [], spinners: [], mixers: [], needsLight: false };
let anchors = [];
let toastTimer = 0;

// ---------- Mensajes ----------
function toast(text) {
  const el = $('toast');
  el.textContent = text;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 6000);
}

/** Error que impide seguir: detiene todo y muestra el motivo con un botón para reintentar. */
function fatal(text, details = []) {
  console.error('[webar]', text, ...details);
  state.phase = 'error';
  state.error = text;
  stopEverything();

  const m = $('msg');
  m.textContent = '';
  const h = document.createElement('h2');
  h.textContent = t('errTitle');
  const p = document.createElement('p');
  p.textContent = text;
  m.append(h, p);
  if (details.length) {
    const ul = document.createElement('ul');
    details.forEach((d) => { const li = document.createElement('li'); li.textContent = d; ul.appendChild(li); });
    m.appendChild(ul);
  }
  const b = document.createElement('button');
  b.className = 'btn';
  b.textContent = t('retry');
  b.addEventListener('click', () => location.reload());
  m.appendChild(b);

  for (const id of ['start', 'hint', 'controls', 'preview', 'toast']) $(id).classList.add('hidden');
  m.classList.remove('hidden');
  window.__webarBooted();
}

/** Apaga cámara, tracking, grabación y sonido. Se puede llamar más de una vez. */
function stopEverything() {
  if (capture) capture.dispose();
  [...media.videos, ...media.audios].forEach((el) => el.pause());
  if (!mindar) return;
  try { mindar.renderer.setAnimationLoop(null); } catch (_) { /* nada */ }
  try { mindar.controller && mindar.controller.stopProcessVideo(); } catch (_) { /* nada */ }
  const stream = mindar.video && mindar.video.srcObject;
  if (stream) stream.getTracks().forEach((track) => track.stop());
}

// ---------- Preparación (antes de tocar "Activar cámara") ----------
async function boot() {
  let CONFIG;
  if (!configFile) return fatal(t('errConfigLoad', { file: String(configParam).slice(0, 60) }));
  try {
    ({ CONFIG } = await import(`./${configFile}`));
  } catch (e) {
    console.error(e);
    return fatal(t('errConfigLoad', { file: configFile }), [String(e.message ?? e)]);
  }

  const lang = pickLang((CONFIG && CONFIG.lang) || 'auto', navigator.languages ?? [navigator.language], params.get('lang'));
  t = makeT(lang);
  state.lang = lang;
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-label]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nLabel)));

  const problems = validateConfig(CONFIG);
  if (problems.length) {
    return fatal(t('errConfig', { file: configFile }), problems.map((p) => `${p.where}: ${t(p.code)}${p.code === 'cfg_type' ? ` («${p.value}»)` : ''}`));
  }
  if (CONFIG.title) { $('title').textContent = CONFIG.title; document.title = CONFIG.title; }
  if (CONFIG.intro) $('intro').textContent = CONFIG.intro;

  // El archivo .mind se revisa aquí: si falta o está dañado, MindAR se queda
  // colgado sin avisar (pantalla negra para siempre).
  const file = CONFIG.targetsFile;
  let mindUrl;
  try {
    const res = await fetch(file);
    if (!res.ok) return fatal(t('errMindFetch', { file }), [`HTTP ${res.status}`]);
    const buf = await res.arrayBuffer();
    const info = inspectMind(buf);
    if (!info.ok) return fatal(t(`errMind_${info.reason}`, { file }));
    if (info.count < CONFIG.targets.length) return fatal(t('errMindCount', { file, want: CONFIG.targets.length, have: info.count }));
    if (info.count > CONFIG.targets.length) console.warn(`[webar] ${file} trae ${info.count} marcadores y ${configFile} solo usa ${CONFIG.targets.length}.`);
    mindUrl = URL.createObjectURL(new Blob([buf]));
  } catch (e) {
    console.error(e);
    return fatal(t('errMindFetch', { file }));
  }

  // Calidad: config.js (quality) o ?q=low / ?q=high. En 'auto' se parte según
  // el equipo y, si los FPS caen, se baja sola mientras se usa (ver loop).
  const qParam = params.get('q');
  const qSetting = qParam === 'low' || qParam === 'high' ? qParam : CONFIG.quality ?? 'auto';
  const quality = { ...pickQuality(qSetting, navigator) }; // copia: puede cambiar en 'auto'
  const fpsSamples = [];
  state.quality = quality.name;

  mindar = new MindARThree({
    container: $('ar'),
    imageTargetSrc: mindUrl,
    maxTrack: 1,
    uiLoading: 'no',
    uiScanning: 'no',
    uiError: 'no',
    filterMinCF: numParam(params.get('cf'), 0.0001, 0, 10),
    filterBeta: numParam(params.get('beta'), 0.001, 0, 1000)
  });
  const { renderer, scene, camera } = mindar;
  // MindAR usa el devicePixelRatio completo (3 en muchos celulares = 9 veces
  // más píxeles que dibujar). Con 2 se ve igual de bien y rinde mucho más.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.pixelRatio));
  const loader = new THREE.TextureLoader();
  const onError = (item, e) => {
    console.warn('[webar] no pude cargar', item.src, e);
    toast(t('warnAsset', { file: item.src }));
  };

  const refreshHint = () => {
    state.visible = anchors.filter((a) => a.visible).map((a) => a.name);
    $('hint').classList.toggle('hidden', state.visible.length > 0 || state.phase !== 'running');
  };
  const play = (el) => el.play().catch(() => {});

  anchors = CONFIG.targets.map((target, i) => {
    const anchor = mindar.addAnchor(i);
    const mine = { videos: [], audios: [], sounds: media.sounds, spinners: media.spinners, mixers: media.mixers, needsLight: false };
    target.content.forEach((item) => anchor.group.add(buildContent(item, { loader, media: mine, onError })));
    media.videos.push(...mine.videos);
    media.audios.push(...mine.audios);
    media.needsLight ||= mine.needsLight;

    const entry = { name: target.name ?? `#${i}`, visible: false, els: [...mine.videos, ...mine.audios] };
    anchor.onTargetFound = () => {
      if (debug) console.log('[webar] marcador encontrado:', entry.name);
      entry.visible = true;
      refreshHint();
      if (!document.hidden) entry.els.forEach(play);
    };
    anchor.onTargetLost = () => {
      if (debug) console.log('[webar] marcador perdido:', entry.name);
      entry.visible = false;
      refreshHint();
      entry.els.forEach((el) => el.pause());
    };
    return entry;
  });

  // Luz para los modelos 3D (los planos de imagen/video no la necesitan)
  if (media.needsLight) {
    scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 2.2));
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(0.5, 1, 1);
    scene.add(sun);
  }

  // ---------- Vista previa de la foto / video (para guardar o compartir) ----------
  let previewUrl = null;
  function closePreview() {
    $('preview').classList.add('hidden');
    $('previewMedia').textContent = '';
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  }
  function showPreview({ kind, blob, name, hasAudio }) {
    if (state.phase !== 'running') return;
    closePreview();
    previewUrl = URL.createObjectURL(blob);
    let el;
    if (kind === 'photo') {
      el = new Image();
      el.alt = t('previewPhoto');
    } else {
      el = document.createElement('video');
      el.controls = true;
      el.loop = true;
      el.playsInline = true;
      el.setAttribute('playsinline', ''); // iOS: sin esto abre el video a pantalla completa
      el.setAttribute('aria-label', t('previewVideo'));
    }
    el.src = previewUrl;
    $('previewMedia').appendChild(el);

    // Compartir necesita un toque del usuario: por eso va en un botón y no
    // directo al terminar la grabación.
    const shareFile = new File([blob], name, { type: blob.type });
    const canShare = !!(navigator.canShare && navigator.canShare({ files: [shareFile] }));
    $('shareBtn').classList.toggle('hidden', !canShare);
    $('shareBtn').onclick = async () => {
      try { await navigator.share({ files: [shareFile] }); }
      catch (e) { if (e.name !== 'AbortError') toast(t('warnShare')); }
    };
    $('downloadBtn').href = previewUrl;
    $('downloadBtn').download = name;
    $('preview').classList.remove('hidden');
    state.lastCapture = { kind, name, type: blob.type, size: blob.size, hasAudio: !!hasAudio };
  }
  $('closeBtn').addEventListener('click', closePreview);

  // ---------- Loop ----------
  const clock = new THREE.Clock();
  let wasVisible = false;
  let frames = 0;
  let fpsT0 = performance.now();
  function loop() {
    const dt = Math.min(clock.getDelta(), 0.1);
    const anyVisible = anchors.some((a) => a.visible);
    if (anyVisible) {
      media.spinners.forEach((s) => { s.rotation.z += dt * 0.8; });
      media.mixers.forEach((m) => m.update(dt));
    }
    // Sin marcador a la vista no hay nada que dibujar (un cuadro más para limpiar el anterior).
    if (anyVisible || wasVisible || capture.busy) renderer.render(scene, camera);
    wasVisible = anyVisible;
    capture.frame(); // justo después de render

    frames++;
    const now = performance.now();
    if (now - fpsT0 >= 1000) {
      state.fps = Math.round((frames * 1000) / (now - fpsT0));
      frames = 0;
      fpsT0 = now;
      // Calidad automática: tras 3 segundos seguidos bajo 20 FPS se pasa al perfil
      // liviano (nunca a mitad de una grabación: cambiaría el tamaño del video).
      if (qSetting === 'auto' && quality.name === 'high' && !document.hidden && !capture.recording) {
        fpsSamples.push(state.fps);
        if (fpsSamples.length > 5) fpsSamples.shift();
        if (shouldDowngrade(fpsSamples)) {
          Object.assign(quality, QUALITY.low);
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.pixelRatio));
          state.quality = 'low (auto)';
          console.warn('[webar] FPS bajos: cambio a calidad liviana');
        }
      }
      if (debug) {
        $('debug').textContent = [
          `webar-mapping-template v${VERSION}`,
          `marcador: ${state.visible.join(', ') || '—'}`,
          `cámara: ${state.camera} · pantalla: ${renderer.domElement.width}×${renderer.domElement.height}`,
          `fps: ${state.fps} · calidad: ${state.quality}`,
          `video: ${state.recorder}`
        ].join('\n');
      }
    }
  }

  // ---------- Arranque (toque en "Activar cámara") ----------
  async function start() {
    if (state.phase !== 'ready') return;
    state.phase = 'starting';
    const btn = $('startBtn');
    btn.disabled = true;
    btn.textContent = t('opening');

    // Los navegadores móviles solo dejan sonar audio tras un gesto del usuario:
    // "desbloqueamos" cada elemento ahora, dentro del toque (antes de cualquier await).
    // Los videos también: en iOS con "modo de bajo consumo" ni siquiera un video
    // sin sonido puede empezar solo si antes no se reprodujo con un toque.
    [...media.audios, ...media.videos].forEach((el) => {
      const wasMuted = el.muted;
      el.muted = true;
      el.play()
        .then(() => {
          // Si el marcador apareció mientras tanto, ya está sonando de verdad: no lo cortes.
          if (!anchors.some((a) => a.visible && a.els.includes(el))) { el.pause(); el.currentTime = 0; }
        })
        .catch(() => {})
        .finally(() => { el.muted = wasMuted; });
    });

    const env = { isSecureContext: window.isSecureContext, hasMediaDevices: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) };
    if (!env.isSecureContext || !env.hasMediaDevices) return fatal(t(cameraErrorKey(null, env)));

    const probe = probeCamera(quality.camera);
    try {
      await startTracking(mindar, probe);
    } catch (e) {
      console.error('[webar] start', e, probe.error);
      const key = probe.error || !probe.granted
        ? cameraErrorKey(probe.error ?? e)
        : (e && e.name === 'TimeoutError' ? 'errTimeout' : 'errStart');
      return fatal(t(key));
    } finally {
      probe.restore();
      URL.revokeObjectURL(mindUrl);
    }

    const track = mindar.video.srcObject.getVideoTracks()[0];
    track.addEventListener('ended', () => { if (state.phase === 'running') fatal(t('errCameraLost')); });
    state.camera = `${mindar.video.videoWidth}×${mindar.video.videoHeight}`;

    const watermark = (params.has('wm') ? params.get('wm') : CONFIG.watermark ?? '').slice(0, 80);
    capture = createCapture({
      container: $('ar'),
      glCanvas: renderer.domElement,
      watermark,
      quality,
      maxSeconds: CONFIG.maxVideoSeconds ?? 30,
      sounds: CONFIG.recordAudio === false ? [] : media.sounds,
      onState: ({ recording, seconds }) => {
        $('rec').classList.toggle('on', recording);
        $('rec').textContent = recording ? '⏹' : '⏺';
        $('rec').setAttribute('aria-label', t(recording ? 'stop' : 'record'));
        $('timer').textContent = recording ? `${Math.floor(seconds)}s` : '';
      },
      onResult: showPreview,
      onError: (key, e) => { if (e) console.error('[webar]', e); toast(t(key)); }
    });
    state.recorder = capture.canRecord() ? 'ok' : 'no soportado';

    $('photo').addEventListener('click', () => capture.takePhoto());
    document.addEventListener('pointerdown', () => capture.resumeAudio()); // por si el sistema suspendió el audio
    $('rec').addEventListener('click', () => (capture.recording ? capture.stopRecording() : capture.startRecording()));

    state.phase = 'running';
    $('start').classList.add('hidden');
    $('controls').classList.remove('hidden');
    if (debug) $('debug').classList.remove('hidden');
    refreshHint();
    renderer.setAnimationLoop(loop);

    // Al salir de la pestaña: se cierra la grabación y se pausa el sonido.
    // Al volver: se retoma, o se avisa si el sistema apagó la cámara.
    document.addEventListener('visibilitychange', () => {
      if (state.phase !== 'running') return;
      if (document.hidden) {
        capture.stopRecording();
        [...media.videos, ...media.audios].forEach((el) => el.pause());
      } else {
        if (track.readyState === 'ended') return fatal(t('errCameraLost'));
        mindar.video.play().catch(() => {});
        capture.resumeAudio();
        anchors.filter((a) => a.visible).forEach((a) => a.els.forEach(play));
      }
    });
  }

  $('startBtn').addEventListener('click', start);
  // iOS avisa el giro de pantalla antes de terminar de acomodar la página:
  // se vuelve a calcular el tamaño un momento después.
  window.addEventListener('orientationchange', () => setTimeout(() => { if (state.phase === 'running') mindar.resize(); }, 350));
  window.addEventListener('pagehide', stopEverything);
  // Si el navegador restaura la página desde su caché (botón "atrás"), la cámara ya no está: recargar.
  window.addEventListener('pageshow', (e) => { if (e.persisted) location.reload(); });

  state.phase = 'ready';
  $('startBtn').textContent = t('start');
  $('startBtn').disabled = false;
  window.__webarBooted();
}

/**
 * MindAR pide la cámara por su cuenta y, si falla, rechaza sin decir por qué.
 * Envolvemos getUserMedia mientras arranca para conocer el error real
 * (permiso denegado, sin cámara, cámara ocupada…). De paso permite pedir una
 * resolución de cámara menor en el perfil de calidad liviano.
 */
function probeCamera(size) {
  const md = navigator.mediaDevices;
  const original = md.getUserMedia;
  const probe = {
    error: null,
    granted: false,
    restore() { try { delete md.getUserMedia; } catch (_) { /* nada */ } }
  };
  try {
    md.getUserMedia = function (constraints) {
      // Perfil liviano: se pide una cámara de baja resolución (menos píxeles que analizar).
      if (size && constraints && constraints.video && typeof constraints.video === 'object') {
        constraints = { ...constraints, video: { ...constraints.video, width: { ideal: size.width }, height: { ideal: size.height } } };
      }
      return original.call(md, constraints).then(
        (stream) => { probe.granted = true; return stream; },
        (e) => { probe.error = e; throw e; }
      );
    };
  } catch (_) { /* navegador que no deja envolverlo: seguimos sin el detalle */ }
  return probe;
}

/**
 * mindar.start() con dos resguardos:
 * - si algo falla dentro de MindAR después de abrir la cámara, su promesa no
 *   termina nunca (el error sale como "unhandledrejection"): lo capturamos;
 * - límite de 30 s contados desde que la cámara respondió (no antes: la
 *   persona puede tardar en aceptar el permiso).
 */
function startTracking(mindarInstance, probe) {
  return new Promise((resolve, reject) => {
    let grantedAt = 0;
    const finish = (fn, value) => {
      clearInterval(timer);
      window.removeEventListener('unhandledrejection', onRejection);
      fn(value);
    };
    const onRejection = (ev) => finish(reject, ev.reason ?? new Error('start'));
    const timer = setInterval(() => {
      if (probe.granted && !grantedAt) grantedAt = Date.now();
      if (grantedAt && Date.now() - grantedAt > 30000) finish(reject, Object.assign(new Error('timeout'), { name: 'TimeoutError' }));
    }, 500);
    window.addEventListener('unhandledrejection', onRejection);
    mindarInstance.start().then(() => finish(resolve), (e) => finish(reject, e));
  });
}

boot().catch((e) => {
  console.error(e);
  fatal(t('errStart'), [String(e && e.message ? e.message : e)]);
});
