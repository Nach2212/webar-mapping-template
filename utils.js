// Funciones puras (sin DOM ni three.js) para poder probarlas en tests/.
// Pure helpers (no DOM, no three.js) so they can be unit-tested in tests/.

export const VERSION = '0.2.0';

export const CONTENT_TYPES = ['image', 'video', 'model', 'audio'];

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isVec3 = (v) => Array.isArray(v) && v.length === 3 && v.every(isNum);

/**
 * Revisa config.js y devuelve una lista de problemas ({ code, where, value }).
 * Lista vacía = todo bien. Los códigos se traducen en i18n.js (cfg_*).
 */
export function validateConfig(cfg) {
  const out = [];
  const bad = (code, where, value) => out.push({ code, where, value: String(value) });

  if (!cfg || typeof cfg !== 'object') return [{ code: 'cfg_missing', where: 'CONFIG', value: '' }];
  if (typeof cfg.targetsFile !== 'string' || !cfg.targetsFile.trim()) bad('cfg_targetsFile', 'targetsFile', cfg.targetsFile);
  if (cfg.maxVideoSeconds !== undefined && !(isNum(cfg.maxVideoSeconds) && cfg.maxVideoSeconds > 0)) {
    bad('cfg_number', 'maxVideoSeconds', cfg.maxVideoSeconds);
  }
  if (cfg.quality !== undefined && !['auto', 'high', 'low'].includes(cfg.quality)) bad('cfg_quality', 'quality', cfg.quality);
  if (!Array.isArray(cfg.targets) || cfg.targets.length === 0) {
    bad('cfg_targets', 'targets', cfg.targets);
    return out;
  }

  cfg.targets.forEach((t, i) => {
    const at = `targets[${i}]`;
    if (!t || typeof t !== 'object' || !Array.isArray(t.content)) return bad('cfg_content', `${at}.content`, t && t.content);
    t.content.forEach((c, j) => {
      const w = `${at}.content[${j}]`;
      if (!c || typeof c !== 'object') return bad('cfg_item', w, c);
      if (c.type !== undefined && !CONTENT_TYPES.includes(c.type)) bad('cfg_type', `${w}.type`, c.type);
      if (typeof c.src !== 'string' || !c.src.trim()) bad('cfg_src', `${w}.src`, c.src);
      for (const k of ['width', 'scale', 'volume']) {
        if (c[k] !== undefined && !isNum(c[k])) bad('cfg_number', `${w}.${k}`, c[k]);
      }
      for (const k of ['position', 'rotation']) {
        if (c[k] !== undefined && !isVec3(c[k])) bad('cfg_vec3', `${w}.${k}`, JSON.stringify(c[k]));
      }
    });
  });
  return out;
}

/**
 * Mira la cabecera de un archivo .mind (msgpack: { v: 2, dataList: [...] })
 * sin decodificarlo entero. Devuelve { ok, count, reason }.
 * reason: 'empty' | 'html' | 'format' | 'version'. count = cuántos marcadores trae.
 */
export function inspectMind(buffer) {
  const b = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (b.length === 0) return { ok: false, count: 0, reason: 'empty' };

  // Un 404 "disfrazado" (página HTML en vez del archivo) empieza con '<'
  let s = 0;
  while (s < b.length && (b[s] === 0x20 || b[s] === 0x0a || b[s] === 0x0d || b[s] === 0x09 || b[s] === 0xef || b[s] === 0xbb || b[s] === 0xbf)) s++;
  if (b[s] === 0x3c) return { ok: false, count: 0, reason: 'html' };

  let p = 0;
  let pairs;
  if ((b[0] & 0xf0) === 0x80) { pairs = b[0] & 0x0f; p = 1; }
  else if (b[0] === 0xde && b.length >= 3) { pairs = (b[1] << 8) | b[2]; p = 3; }
  else return { ok: false, count: 0, reason: 'format' };

  const readKey = () => {
    let len;
    if ((b[p] & 0xe0) === 0xa0) { len = b[p] & 0x1f; p += 1; }
    else if (b[p] === 0xd9) { len = b[p + 1]; p += 2; }
    else return null;
    if (p + len > b.length) return null;
    let k = '';
    for (let i = 0; i < len; i++) k += String.fromCharCode(b[p + i]);
    p += len;
    return k;
  };

  let version = null;
  let count = null;
  for (let n = 0; n < pairs && p < b.length; n++) {
    const key = readKey();
    if (key === 'v') {
      if (b[p] <= 0x7f) { version = b[p]; p += 1; } else break;
    } else if (key === 'dataList') {
      if ((b[p] & 0xf0) === 0x90) count = b[p] & 0x0f;
      else if (b[p] === 0xdc && p + 2 < b.length) count = (b[p + 1] << 8) | b[p + 2];
      else if (b[p] === 0xdd && p + 4 < b.length) count = ((b[p + 1] << 24) | (b[p + 2] << 16) | (b[p + 3] << 8) | b[p + 4]) >>> 0;
      break; // lo que sigue son los datos de los marcadores
    } else break;
  }

  if (count === null) return { ok: false, count: 0, reason: 'format' };
  if (version !== null && version !== 2) return { ok: false, count, reason: 'version' };
  if (count === 0) return { ok: false, count: 0, reason: 'empty' };
  return { ok: true, count, reason: null };
}

/**
 * Elige el formato de grabación. mp4 primero (se comparte mejor y es lo único
 * que graba Safari); webm como respaldo (Chrome/Firefox antiguos).
 */
export function pickMime(isSupported, withAudio) {
  const list = withAudio
    ? ['video/mp4;codecs="avc1.42E01E,mp4a.40.2"', 'video/mp4', 'video/webm;codecs="vp9,opus"', 'video/webm;codecs="vp8,opus"', 'video/webm']
    : ['video/mp4;codecs="avc1.42E01E"', 'video/mp4', 'video/webm;codecs="vp9"', 'video/webm;codecs="vp8"', 'video/webm'];
  return list.find((m) => { try { return isSupported(m); } catch (_) { return false; } }) ?? null;
}

export const fileExt = (mime) => (String(mime).startsWith('video/mp4') ? 'mp4' : String(mime).startsWith('video/webm') ? 'webm' : 'jpg');

export const QUALITY = {
  // pixelRatio: tope del devicePixelRatio · captureMax: lado largo de fotos/videos (px)
  high: { name: 'high', pixelRatio: 2, captureMax: 1280, fps: 30, videoBits: 5_000_000, camera: null },
  low: { name: 'low', pixelRatio: 1, captureMax: 854, fps: 24, videoBits: 2_500_000, camera: { width: 640, height: 480 } }
};

/**
 * setting: 'auto' | 'high' | 'low'. En 'auto' se parte en 'low' solo si el
 * equipo declara muy poca memoria o núcleos; el resto se ajusta midiendo FPS.
 */
export function pickQuality(setting, env = {}) {
  if (setting === 'high' || setting === 'low') return QUALITY[setting];
  const mem = env.deviceMemory;
  const cores = env.hardwareConcurrency;
  const weak = (isNum(mem) && mem <= 2) || (isNum(cores) && cores <= 2);
  return weak ? QUALITY.low : QUALITY.high;
}

/** ¿Hay que bajar la calidad? true si las últimas `need` mediciones de FPS son bajas. */
export function shouldDowngrade(fpsSamples, min = 20, need = 3) {
  if (fpsSamples.length < need) return false;
  return fpsSamples.slice(-need).every((f) => f < min);
}

/** Tamaño del canvas de captura: lado largo <= max y dimensiones pares (lo exigen los codecs). */
export function captureSize(cssW, cssH, max) {
  const scale = Math.min(1, max / Math.max(cssW, cssH, 1));
  const even = (n) => Math.max(2, Math.round((n * scale) / 2) * 2);
  return { W: even(cssW), H: even(cssH), scale };
}

/** Traduce un error de cámara a una clave de mensaje (i18n.js). */
export function cameraErrorKey(err, env = {}) {
  if (env.isSecureContext === false) return 'errInsecure';
  if (env.hasMediaDevices === false) return 'errNoCameraApi';
  const name = err && err.name;
  if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') return 'errDenied';
  if (name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'DevicesNotFoundError') return 'errNoCamera';
  if (name === 'NotReadableError' || name === 'AbortError' || name === 'TrackStartError') return 'errBusy';
  if (name === 'TimeoutError') return 'errTimeout';
  return 'errCameraOther';
}

/**
 * ?config=carpeta/config.js → solo rutas relativas dentro del sitio, terminadas
 * en .js. Nada de http:, //, .. ni caracteres raros (se usa en un import()).
 */
export function safeConfigPath(p) {
  if (typeof p !== 'string' || !/^[A-Za-z0-9_\-]+(\/[A-Za-z0-9_\-.]+)*\.js$|^[A-Za-z0-9_\-.]+\.js$/.test(p)) return null;
  if (p.includes('..') || p.startsWith('.')) return null;
  return p;
}

/** Número desde un parámetro de URL, con valor por defecto y límites. */
export function numParam(value, fallback, min = -Infinity, max = Infinity) {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** ¿`src` es del mismo origen que la página? (el audio de otro dominio no se puede mezclar en la grabación) */
export function isSameOrigin(src, base) {
  try {
    const u = new URL(src, base);
    if (u.protocol === 'blob:' || u.protocol === 'data:') return true;
    return u.origin === new URL(base).origin;
  } catch (_) {
    return false;
  }
}

/** Idioma de la interfaz: 'es' | 'en'. */
export function pickLang(setting, navLangs = [], param = null) {
  const norm = (l) => (typeof l === 'string' ? l.toLowerCase().slice(0, 2) : '');
  for (const cand of [param, setting === 'auto' ? null : setting, ...navLangs]) {
    const l = norm(cand);
    if (l === 'es' || l === 'en') return l;
  }
  return 'es';
}
