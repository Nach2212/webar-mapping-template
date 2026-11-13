// Prueba: el video debe cortarse solo a los 2 segundos.
export const CONFIG = {
  targetsFile: 'targets/targets.mind',
  lang: 'es',
  watermark: 'prueba',
  maxVideoSeconds: 2,
  targets: [{ name: 'demo', content: [{ type: 'image', src: 'assets/demo-overlay.png', width: 0.6, spin: true }] }]
};
