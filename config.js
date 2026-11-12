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
          type: 'image',            // 'image' | 'video'
          src: 'assets/demo-overlay.png',
          width: 0.6,               // 1 = ancho completo del marcador
          position: [0, 0, 0.05],   // [x, y, z]  (z positivo = hacia ti)
          spin: true                // gira suavemente (opcional)
        }
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
