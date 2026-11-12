// ============================================================
//  CONFIGURACIÓN — esto es lo único que necesitas editar 🎯
// ============================================================
export const CONFIG = {
  // Archivo compilado con tus marcadores (ver compile.html)
  targetsFile: 'targets/targets.mind',

  // Marca de agua que sale en fotos y videos ('' para quitarla)
  watermark: 'webar-mapping-template',

  // Duración máxima del video en segundos
  maxVideoSeconds: 30,

  // Un item por marcador, EN EL MISMO ORDEN en que subiste las imágenes
  // al compilador. El primero es el índice 0, el segundo el 1, etc.
  targets: [
    {
      name: 'demo',
      // alto / ancho de la imagen del marcador (marker-demo.png = 372 / 674)
      aspect: 372 / 674,
      content: [
        {
          type: 'image',            // 'image' | 'video' | 'model' | 'audio'
          src: 'assets/demo-overlay.png',
          width: 0.6,               // 1 = ancho completo del marcador
          position: [0, 0, 0.05],   // [x, y, z]  (z positivo = hacia ti)
          spin: true                // gira suavemente (opcional)
        }
        // Ejemplo con modelo 3D (.glb) — descomenta para probar el cubo de demo:
        // {
        //   type: 'model',
        //   src: 'assets/demo-cube.glb',
        //   scale: 0.3,              // tamaño relativo al ancho del marcador
        //   position: [0, 0, 0.15],
        //   rotation: [0, 0, 0],     // radianes (opcional)
        //   spin: true               // gira sobre el marcador (opcional)
        // },
        // Ejemplo con audio (suena al detectar el marcador, se pausa al perderlo):
        // { type: 'audio', src: 'assets/ambiente.mp3', loop: true, volume: 0.8 },
        // Ejemplo con video (descomenta y cambia el archivo):
        // {
        //   type: 'video',
        //   src: 'assets/mi-video.mp4',
        //   width: 1,
        //   position: [0, 0, 0.01],
        //   loop: true
        // }
      ]
    }
  ]
};
