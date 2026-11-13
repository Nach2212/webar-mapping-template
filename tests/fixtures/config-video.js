// Prueba: un marcador con video con sonido. tests/e2e.mjs genera el video
// (magenta, con un tono) y lo sirve en tests/tmp/video.webm.
export const CONFIG = {
  targetsFile: 'targets/targets.mind',
  lang: 'es',
  watermark: '',
  targets: [{
    name: 'demo',
    content: [{ type: 'video', src: 'tests/tmp/video.webm', width: 1, position: [0, 0, 0.01], loop: true, sound: true }]
  }]
};
