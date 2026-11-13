# Changelog

Los cambios importantes de cada versión. Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/); versiones según [SemVer](https://semver.org/lang/es/).

*All notable changes per version. English summaries follow each Spanish entry.*

## [0.2.0] - 2026-11-12

Versión centrada en confiabilidad: que la plantilla avise cuando algo falla, rinda mejor y se pueda probar sin celular.
*Reliability release: clear failures, better performance, and tests that run without a phone.*

> **Estado de las pruebas / Test status:** todo lo de esta versión se verificó en Chrome de escritorio con una cámara simulada. En un celular real (Android/Chrome, 2026-11-13) se confirmó: cámara y seguimiento, contenido de imagen, modelo 3D y audio, foto, video grabado y sonido dentro del video, con el marcador demo y un marcador de ejemplo en pantalla. Siguen pendientes: iPhone/Safari, contenido de video, botón Compartir, gama baja y marcadores proyectados.
> *Everything here was verified in desktop Chrome with a simulated camera. On a real phone (Android/Chrome) camera, tracking, image/model/audio content, photo, recorded video and recorded sound are confirmed. Still pending: iPhone/Safari, video content, Share button, low-end devices and projected markers.*

### Corregido · Fixed
- `compile.html` no compilaba: cargaba el compilador de MindAR (un módulo ES) como script clásico. *The marker compiler page was broken (ES module loaded as a classic script).*
- Un `.mind` faltante, dañado o con menos marcadores que `config.js` dejaba la pantalla en negro para siempre; ahora se explica el problema. *Missing/invalid `.mind` files no longer hang on a black screen.*
- Cancelar el menú de compartir ya no dispara una descarga. *Cancelling the share sheet no longer triggers a download.*
- `targets/marker-demo.png` traía un dato EXIF que lo mostraba girado 90° en navegadores. *Demo marker displayed rotated in browsers due to EXIF.*
- Las imágenes de contenido se descargaban dos veces. *Content images were fetched twice.*
- El stream del canvas no se liberaba después de cada grabación. *Canvas capture stream leaked after each recording.*
- Fotos y videos salían en baja resolución en celulares (se medían en píxeles CSS); ahora usan los píxeles reales de la pantalla hasta 1280 px. *Captures were low resolution on phones; they now use device pixels up to 1280 px.*

### Agregado · Added
- **Sonido dentro de los videos grabados** (items `audio` y videos con `sound: true`), opción `recordAudio`. *Content audio is recorded into captured videos.*
- Opción `sound: true` para videos con sonido. *`sound: true` for audible videos.*
- Mensajes de error específicos: permiso denegado, sin cámara, cámara ocupada, página sin https, navegador dentro de una app, errores en `config.js`, archivos de contenido que no cargan, sin conexión al CDN. *Specific error messages for every startup failure.*
- Vista previa de la foto o video con botones **Compartir** y **Descargar**. *Capture preview with Share and Download.*
- Perfiles de calidad (`quality: 'auto' | 'high' | 'low'`, `?q=`): límite de pixel ratio, cámara y captura más livianas, y bajada automática si caen los FPS. *Quality profiles for low-end phones.*
- Interfaz en español e inglés (`lang`, `?lang=`), y textos de inicio configurables (`title`, `intro`). *Spanish/English UI and configurable start texts.*
- `?config=carpeta/config.js` para tener varias experiencias en un mismo sitio. *Multiple experiences per site.*
- `?debug` ahora muestra un panel en pantalla (versión, marcador, cámara, FPS, calidad). *On-screen debug panel.*
- Tres marcadores de ejemplo originales con su compilado en `examples/`. *Three original example markers.*
- Pruebas sin build: página `tests/`, pruebas unitarias en Node, pruebas de punta a punta con cámara simulada y GitHub Action. *No-build tests and CI.*
- Guía «Tu primer mapping», solución de problemas y tabla de compatibilidad, en español e inglés. *Step-by-step guide, troubleshooting and compatibility table.*
- `tools/compile.mjs`: compilar marcadores desde la terminal. *CLI marker compiler.*

### Cambiado · Changed
- La captura se movió a `capture.js`; las funciones puras a `utils.js`; los textos a `i18n.js`. *Code split into capture/utils/i18n modules.*
- Al salir de la pestaña se cierra la grabación y se pausa el sonido; al volver se retoma o se avisa si el sistema apagó la cámara. *Proper pause/resume handling.*
- Ajustes para iOS/Safari según su documentación (videos en línea, desbloqueo de audio y video con el toque inicial). *iOS/Safari adjustments from documentation; untested on device.*

### Eliminado · Removed
- `aspect` en `config.js`: nunca se usó. Los `config.js` antiguos que lo tengan siguen funcionando. *`aspect` in config was never read; old configs still work.*

## [0.1.0] - 2026-11-12

Primera versión pública. *First public version.*

- Seguimiento de marcadores con MindAR + three.js, sin build. *Image tracking, zero build.*
- Contenido `image`, `video`, `model` (.glb) y `audio`. *Four content types.*
- Foto y video con el AR incluido y marca de agua. *Photo/video capture with watermark.*
- Compilador de marcadores en el navegador. *In-browser marker compiler.*

[0.2.0]: https://github.com/Nach2212/webar-mapping-template/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Nach2212/webar-mapping-template/releases/tag/v0.1.0
