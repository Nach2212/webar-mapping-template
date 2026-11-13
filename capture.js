import { captureSize, fileExt, isSameOrigin, pickMime } from './utils.js';

/**
 * Foto y video con el AR incluido: compone cámara + escena 3D + marca de agua
 * en un <canvas> y lo graba con MediaRecorder, sumando el sonido del contenido.
 *
 * opts = {
 *   container:  el <div> que contiene el <video> de la cámara y el canvas WebGL
 *   glCanvas:   renderer.domElement
 *   watermark:  texto ('' = sin marca)
 *   quality:    perfil de utils.js (captureMax, fps, videoBits)
 *   maxSeconds: duración máxima del video
 *   sounds:     elementos <audio>/<video> cuyo sonido debe quedar en el video grabado
 *   onState:    ({ recording, seconds }) => void
 *   onResult:   ({ kind: 'photo' | 'video', blob, name }) => void
 *   onError:    (claveDeMensaje, error?) => void
 * }
 */
export function createCapture(opts) {
  const { container, glCanvas, watermark, quality, maxSeconds, sounds = [], onState, onResult, onError } = opts;
  const out = document.createElement('canvas');
  const ctx = out.getContext('2d', { alpha: false });
  let photoPending = false;
  let rec = null; // { recorder, canvasStream, chunks, t0, mime, failed }
  let lastCompose = 0;
  let mix = null; // { ctx, dest } · false si el navegador no pudo crear la mezcla

  /**
   * Sonido para la grabación: cada <audio>/<video> se conecta a un AudioContext
   * que lo manda a los parlantes (como antes) y además a un MediaStreamDestination,
   * cuya pista se suma al video. Se crea recién al grabar por primera vez (dentro
   * del toque en el botón), así quien no graba sigue con la reproducción normal.
   */
  function audioTrack() {
    if (mix === false) return null;
    // El audio de otro dominio sin CORS saldría en silencio al pasar por Web Audio: se deja fuera.
    const usable = sounds.filter((el) => el.crossOrigin !== null || isSameOrigin(el.currentSrc || el.src, location.href));
    if (!usable.length) return null;
    try {
      if (!mix) {
        const AC = window.AudioContext || window.webkitAudioContext;
        const ctx = new AC();
        const dest = ctx.createMediaStreamDestination();
        usable.forEach((el) => {
          const src = ctx.createMediaElementSource(el);
          src.connect(ctx.destination);
          src.connect(dest);
        });
        mix = { ctx, dest };
      }
      resumeAudio();
      return mix.dest.stream.getAudioTracks()[0] ?? null;
    } catch (e) {
      console.warn('[webar] no pude preparar el audio de la grabación', e);
      mix = false;
      return null;
    }
  }

  /** El sistema puede suspender el AudioContext (llamada, cambio de app): hay que reanudarlo. */
  function resumeAudio() {
    if (mix && mix.ctx.state !== 'running' && mix.ctx.state !== 'closed') mix.ctx.resume().catch(() => {});
  }

  const supported = (m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m);
  const canRecord = () => typeof out.captureStream === 'function' && !!pickMime(supported, false);

  /** Dibuja un cuadro en `out`. Devuelve false si no se pudo (p. ej. cambió el tamaño al grabar). */
  function compose() {
    const cr = container.getBoundingClientRect();
    const { W, H, scale } = captureSize(cr.width, cr.height, quality.captureMax);
    if (out.width !== W || out.height !== H) {
      // Girar el teléfono cambia el tamaño: un video no puede cambiar de tamaño
      // a mitad de camino, así que se cierra con lo grabado hasta ahí.
      if (rec) { stopRecording(); return false; }
      out.width = W;
      out.height = H;
    }
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    const draw = (el) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      try {
        ctx.drawImage(el, (r.left - cr.left) * scale, (r.top - cr.top) * scale, r.width * scale, r.height * scale);
      } catch (_) { /* video aún sin datos */ }
    };
    const cam = container.querySelector('video');
    if (cam && cam.readyState >= 2) draw(cam);
    draw(glCanvas);

    if (watermark) {
      ctx.font = `${Math.max(12, Math.round(W * 0.035))}px system-ui, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.shadowColor = 'rgba(0,0,0,.6)';
      ctx.shadowBlur = 6;
      ctx.textAlign = 'right';
      ctx.fillText(watermark, W - 16, H - 16);
      ctx.shadowBlur = 0;
    }
    return true;
  }

  function takePhoto() { photoPending = true; }

  function startRecording() {
    if (rec) return;
    if (!canRecord()) return onError('errNoRecorder');
    if (!compose()) return; // fija el tamaño del canvas antes de capturar

    let sound = audioTrack();
    let mime = sound ? pickMime(supported, true) : null;
    if (!mime) { sound = null; mime = pickMime(supported, false); } // sin formato con audio: se graba sin sonido

    let canvasStream = null;
    let recorder;
    try {
      canvasStream = out.captureStream(quality.fps);
      const stream = new MediaStream([...canvasStream.getVideoTracks(), ...(sound ? [sound] : [])]);
      recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: quality.videoBits });
    } catch (e) {
      if (canvasStream) canvasStream.getTracks().forEach((t) => t.stop());
      return onError('errRecFailed', e);
    }

    const session = { recorder, canvasStream, chunks: [], t0: performance.now(), mime, failed: false };
    recorder.ondataavailable = (e) => { if (e.data && e.data.size) session.chunks.push(e.data); };
    recorder.onerror = (e) => { session.failed = true; console.error('[webar] MediaRecorder', e.error ?? e); stopRecording(); };
    recorder.onstop = () => {
      canvasStream.getTracks().forEach((t) => t.stop()); // libera el stream del canvas (la pista de audio se reutiliza)
      if (rec === session) rec = null;
      onState({ recording: false, seconds: 0 });
      const blob = new Blob(session.chunks, { type: mime.split(';')[0] });
      if (session.failed || !blob.size) return onError('errRecFailed');
      onResult({ kind: 'video', blob, name: `webar-${Date.now()}.${fileExt(mime)}`, mime, hasAudio: !!sound });
    };

    try {
      recorder.start();
    } catch (e) {
      canvasStream.getTracks().forEach((t) => t.stop());
      return onError('errRecFailed', e);
    }
    rec = session;
    onState({ recording: true, seconds: 0 });
  }

  function stopRecording() {
    if (rec && rec.recorder.state !== 'inactive') rec.recorder.stop();
  }

  /** Llamar JUSTO después de renderer.render() (así no hace falta preserveDrawingBuffer). */
  function frame() {
    if (!photoPending && !rec) return;
    const now = performance.now();
    // Al grabar no hace falta componer más cuadros de los que el video guarda
    if (!photoPending && now - lastCompose < 1000 / quality.fps - 2) return;
    lastCompose = now;
    if (!compose()) return;

    if (photoPending) {
      photoPending = false;
      out.toBlob(
        (blob) => (blob ? onResult({ kind: 'photo', blob, name: `webar-${Date.now()}.jpg`, mime: 'image/jpeg' }) : onError('errRecFailed')),
        'image/jpeg',
        0.92
      );
    }
    if (rec) {
      const seconds = (now - rec.t0) / 1000;
      onState({ recording: true, seconds });
      if (seconds >= maxSeconds) stopRecording();
    }
  }

  return {
    takePhoto,
    startRecording,
    stopRecording,
    frame,
    canRecord,
    resumeAudio,
    get recording() { return !!rec; },
    get busy() { return photoPending || !!rec; },
    dispose() {
      stopRecording();
      if (mix && mix.ctx.state !== 'closed') mix.ctx.close().catch(() => {});
    }
  };
}
