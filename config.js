// ============================================================
//  CONFIGURACIÓN — esto es lo único que necesitas editar 🎯
// ============================================================
export const CONFIG = {
  // Archivo compilado con tus marcadores (ver compile.html)
  targetsFile: 'targets/targets.mind',

  // Textos de la pantalla de inicio ('' = usa los textos por defecto)
  title: '',
  intro: '',

  // Idioma de botones y mensajes: 'auto' (según el celular), 'es' o 'en'
  lang: 'auto',

  // Marca de agua que sale en fotos y videos ('' para quitarla)
  watermark: 'webar-mapping-template',

  // Duración máxima del video en segundos
  maxVideoSeconds: 30,

  // ¿Incluir el sonido del contenido (audios y videos con sound: true) en los
  // videos grabados? Ponlo en false si notas problemas de sonido al grabar.
  recordAudio: true,

  // Calidad: 'auto' (recomendado: se adapta al celular), 'high' o 'low'
  // (low = menos resolución, pensado para celulares de gama baja)
  quality: 'auto',

  // Un item por marcador, EN EL MISMO ORDEN en que el compilador mostró las
  // imágenes. El primero es el índice 0, el segundo el 1, etc.
  targets: [
    {
      name: 'demo',
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
        //   loop: true,
        //   sound: false             // true = el video suena (por defecto va sin sonido)
        // }
      ]
    }
  ]
};
