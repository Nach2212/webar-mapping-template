// Pruebas de las funciones puras. Corren igual en el navegador (tests/index.html)
// y en Node (node tests/run-node.mjs). Sin frameworks: cada test lanza si falla.
import {
  validateConfig, inspectMind, pickMime, fileExt, pickQuality, QUALITY, shouldDowngrade,
  captureSize, cameraErrorKey, safeConfigPath, numParam, isSameOrigin, pickLang
} from '../utils.js';
import { STRINGS, makeT } from '../i18n.js';

const eq = (a, b, msg = '') => {
  const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A !== B) throw new Error(`${msg} esperaba ${B}, obtuve ${A}`);
};
const ok = (v, msg = 'condición falsa') => { if (!v) throw new Error(msg); };

const goodConfig = () => ({
  targetsFile: 'targets/targets.mind',
  maxVideoSeconds: 30,
  targets: [{ name: 'a', content: [{ type: 'image', src: 'x.png', width: 0.5, position: [0, 0, 0.1] }] }]
});
// Cabecera real de un .mind: { v: 2, dataList: [ … ] }
const mindHeader = (arrayHeader) => new Uint8Array([0x82, 0xa1, 0x76, 0x02, 0xa8, ...[...'dataList'].map((c) => c.charCodeAt(0)), ...arrayHeader, 0x83]);

export const tests = [
  ['validateConfig: configuración válida', () => eq(validateConfig(goodConfig()), [])],
  ['validateConfig: sin CONFIG', () => eq(validateConfig(undefined)[0].code, 'cfg_missing')],
  ['validateConfig: sin targets', () => {
    const c = goodConfig(); c.targets = [];
    eq(validateConfig(c).map((e) => e.code), ['cfg_targets']);
  }],
  ['validateConfig: tipo mal escrito', () => {
    const c = goodConfig(); c.targets[0].content[0].type = 'vido';
    const [e] = validateConfig(c);
    eq([e.code, e.where, e.value], ['cfg_type', 'targets[0].content[0].type', 'vido']);
  }],
  ['validateConfig: type omitido se acepta (imagen por defecto)', () => {
    const c = goodConfig(); delete c.targets[0].content[0].type;
    eq(validateConfig(c), []);
  }],
  ['validateConfig: falta src, position mala, número malo', () => {
    const c = goodConfig();
    c.targets[0].content.push({ type: 'video', position: [0, 0], width: '1' });
    eq(validateConfig(c).map((e) => e.code).sort(), ['cfg_number', 'cfg_src', 'cfg_vec3']);
  }],
  ['validateConfig: content vacío es válido, content ausente no', () => {
    const c = goodConfig(); c.targets.push({ name: 'b', content: [] }, { name: 'c' });
    eq(validateConfig(c).map((e) => e.where), ['targets[2].content']);
  }],
  ['validateConfig: maxVideoSeconds y quality', () => {
    const c = goodConfig(); c.maxVideoSeconds = 0; c.quality = 'ultra';
    eq(validateConfig(c).map((e) => e.code), ['cfg_number', 'cfg_quality']);
  }],

  ['inspectMind: 1 marcador', () => eq(inspectMind(mindHeader([0x91])), { ok: true, count: 1, reason: null })],
  ['inspectMind: 3 marcadores', () => eq(inspectMind(mindHeader([0x93])).count, 3)],
  ['inspectMind: 20 marcadores (array16)', () => eq(inspectMind(mindHeader([0xdc, 0x00, 0x14])).count, 20)],
  ['inspectMind: acepta ArrayBuffer', () => eq(inspectMind(mindHeader([0x92]).buffer).count, 2)],
  ['inspectMind: vacío', () => eq(inspectMind(new Uint8Array(0)).reason, 'empty')],
  ['inspectMind: lista de marcadores vacía', () => eq(inspectMind(mindHeader([0x90])).reason, 'empty')],
  ['inspectMind: página 404 en HTML', () => eq(inspectMind(new TextEncoder().encode('\n<!DOCTYPE html><html>')).reason, 'html')],
  ['inspectMind: basura', () => eq(inspectMind(new Uint8Array([1, 2, 3, 4])).reason, 'format')],
  ['inspectMind: versión antigua', () => {
    const b = mindHeader([0x91]); b[3] = 1;
    eq(inspectMind(b).reason, 'version');
  }],

  ['pickMime: Safari (solo mp4)', () => eq(pickMime((m) => m.startsWith('video/mp4'), true), 'video/mp4;codecs="avc1.42E01E,mp4a.40.2"')],
  ['pickMime: solo webm', () => eq(pickMime((m) => m.startsWith('video/webm'), false), 'video/webm;codecs="vp9"')],
  ['pickMime: solo webm genérico', () => eq(pickMime((m) => m === 'video/webm', true), 'video/webm')],
  ['pickMime: nada soportado', () => eq(pickMime(() => false, true), null)],
  ['pickMime: isTypeSupported que lanza', () => eq(pickMime(() => { throw new Error('x'); }, false), null)],
  ['fileExt', () => eq([fileExt('video/mp4;codecs=avc1'), fileExt('video/webm'), fileExt('image/jpeg')], ['mp4', 'webm', 'jpg'])],

  ['pickQuality: forzado', () => eq([pickQuality('low', { deviceMemory: 8 }).name, pickQuality('high', { deviceMemory: 1 }).name], ['low', 'high'])],
  ['pickQuality: auto con poca memoria', () => eq(pickQuality('auto', { deviceMemory: 2, hardwareConcurrency: 8 }).name, 'low')],
  ['pickQuality: auto normal y sin datos (iPhone)', () => eq([pickQuality('auto', { deviceMemory: 8, hardwareConcurrency: 8 }).name, pickQuality('auto', {}).name], ['high', 'high'])],
  ['QUALITY: low es más liviano que high', () => ok(QUALITY.low.pixelRatio < QUALITY.high.pixelRatio && QUALITY.low.captureMax < QUALITY.high.captureMax && QUALITY.low.fps <= QUALITY.high.fps)],
  ['shouldDowngrade', () => eq([shouldDowngrade([30, 12, 14, 15]), shouldDowngrade([12, 14, 30]), shouldDowngrade([10, 10])], [true, false, false])],

  ['captureSize: no agranda', () => eq(captureSize(412, 820, 1280), { W: 412, H: 820, scale: 1 })],
  ['captureSize: limita el lado largo y deja pares', () => {
    const s = captureSize(1081, 1921, 1280);
    ok(s.H <= 1280 && s.W % 2 === 0 && s.H % 2 === 0, JSON.stringify(s));
  }],
  ['captureSize: tamaño 0 no rompe', () => ok(captureSize(0, 0, 1280).W >= 2)],

  ['cameraErrorKey', () => eq([
    cameraErrorKey({ name: 'NotAllowedError' }), cameraErrorKey({ name: 'NotFoundError' }), cameraErrorKey({ name: 'NotReadableError' }),
    cameraErrorKey(undefined), cameraErrorKey({ name: 'NotAllowedError' }, { isSecureContext: false }), cameraErrorKey(null, { hasMediaDevices: false })
  ], ['errDenied', 'errNoCamera', 'errBusy', 'errCameraOther', 'errInsecure', 'errNoCameraApi'])],

  ['safeConfigPath: rutas válidas', () => eq([safeConfigPath('config.js'), safeConfigPath('examples/config.js'), safeConfigPath('a-b/c_d/mi.config.js')], ['config.js', 'examples/config.js', 'a-b/c_d/mi.config.js'])],
  ['safeConfigPath: rechaza rutas peligrosas', () => eq([
    'https://evil.example/x.js', '//evil.example/x.js', '../x.js', 'a/../../x.js', '/x.js', 'data:text/javascript,alert(1)//.js', 'x.json', '', null, 'a b.js', '.hidden.js'
  ].map(safeConfigPath), Array(11).fill(null))],

  ['numParam', () => eq([numParam('0.5', 1), numParam('abc', 1), numParam(null, 1), numParam('', 1), numParam('99', 1, 0, 10), numParam('-5', 1, 0, 10)], [0.5, 1, 1, 1, 10, 0])],
  ['isSameOrigin', () => eq([
    isSameOrigin('assets/a.mp3', 'https://x.github.io/repo/'), isSameOrigin('https://cdn.example/a.mp3', 'https://x.github.io/repo/'),
    isSameOrigin('blob:https://x.github.io/1', 'https://x.github.io/repo/')
  ], [true, false, true])],
  ['pickLang', () => eq([
    pickLang('auto', ['en-US', 'es']), pickLang('auto', ['fr-FR']), pickLang('auto', ['fr', 'en']), pickLang('en', ['es-CL']), pickLang('es', ['en'], 'en'), pickLang('auto', [], 'xx')
  ], ['en', 'es', 'en', 'en', 'en', 'es'])],

  ['i18n: es y en tienen las mismas claves', () => eq(Object.keys(STRINGS.es).sort(), Object.keys(STRINGS.en).sort())],
  ['i18n: mismas variables {x} en ambos idiomas', () => {
    const vars = (s) => (s.match(/\{\w+\}/g) ?? []).sort();
    for (const k of Object.keys(STRINGS.es)) eq(vars(STRINGS.es[k]), vars(STRINGS.en[k]), k + ':');
  }],
  ['i18n: makeT reemplaza variables y no rompe con claves desconocidas', () => {
    const t = makeT('en');
    eq([t('warnAsset', { file: 'a.png' }), t('nope'), makeT('zz')('start')], ['Could not load: a.png', 'nope', 'Activar cámara']);
  }],
  ['i18n: cada código de validateConfig tiene texto', () => {
    const c = { targetsFile: '', maxVideoSeconds: -1, quality: 'x', targets: [{ content: [null, { type: 'x', position: 1 }] }, {}] };
    const codes = [...validateConfig(c), ...validateConfig(null), ...validateConfig({ targetsFile: 'a', targets: [] })].map((e) => e.code);
    ok(codes.length >= 8);
    for (const code of codes) ok(STRINGS.es[code] && STRINGS.en[code], 'falta texto para ' + code);
  }]
];

export async function runAll(report = () => {}) {
  let failed = 0;
  for (const [name, fn] of tests) {
    try { await fn(); report(name, null); } catch (e) { failed++; report(name, e); }
  }
  return { total: tests.length, failed };
}
