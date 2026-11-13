// ============================================================
//  EJEMPLOS — tres marcadores listos para probar
//  Ábrelo con:  index.html?config=examples/config.js
//  y apunta a cualquiera de las imágenes de examples/markers/
// ============================================================
// Ojo: las rutas (src, targetsFile) siempre se escriben desde la carpeta
// principal del sitio, aunque este archivo esté dentro de examples/.
export const CONFIG = {
  targetsFile: 'examples/targets.mind',
  title: 'Ejemplos',
  intro: 'Apunta la cámara a uno de los tres marcadores de examples/markers/',
  lang: 'auto',
  watermark: 'webar-mapping-template',
  maxVideoSeconds: 20,
  recordAudio: true,
  quality: 'auto',

  // Mismo orden en que se compilaron: 01, 02, 03
  targets: [
    {
      name: 'engranajes', // examples/markers/01-engranajes.png
      content: [
        { type: 'image', src: 'assets/demo-overlay.png', width: 0.45, position: [0, 0, 0.05], spin: true }
      ]
    },
    {
      name: 'constelacion', // examples/markers/02-constelacion.png
      content: [
        { type: 'model', src: 'assets/demo-cube.glb', scale: 0.15, position: [0, 0, 0.2], spin: true },
        { type: 'audio', src: 'examples/campanas.wav', loop: true, volume: 0.8 }
      ]
    },
    {
      name: 'mosaico', // examples/markers/03-mosaico.png
      content: [
        { type: 'image', src: 'assets/demo-overlay.png', width: 0.3, position: [-0.25, 0, 0.05], spin: true },
        { type: 'model', src: 'assets/demo-cube.glb', scale: 0.12, position: [0.25, 0, 0.15], spin: true }
      ]
    }
  ]
};
