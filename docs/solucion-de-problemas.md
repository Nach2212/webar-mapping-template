# Solución de problemas

*English: [troubleshooting.en.md](troubleshooting.en.md)*

## Antes de nada

1. **Recarga la página.** Resuelve la mayoría de los casos (sobre todo después de cambiar de app o bloquear la pantalla).
2. Revisa que el link empiece con **`https://`**.
3. Agrega **`?debug`** al final del link: muestra en pantalla la versión, qué marcador se detecta, la resolución de la cámara, los FPS y la calidad. Esos datos son los que más ayudan al reportar un problema.

## La cámara no abre

| Mensaje en pantalla | Causa | Qué hacer |
|---|---|---|
| «No hay permiso para usar la cámara» | Se negó el permiso (ahora o antes) | Toca el candado o el ícono junto a la dirección → Permisos → Cámara → Permitir, y recarga. En iPhone: Ajustes → Safari → Cámara |
| «La cámara solo funciona en páginas seguras (https)» | El link es `http://` o una IP local | Usa el link `https://` de GitHub Pages, o un túnel https si pruebas en tu red |
| «Este navegador no deja usar la cámara» | Abriste el link dentro de Instagram, Facebook, TikTok u otra app | Menú ⋯ → «Abrir en el navegador» (Chrome o Safari) |
| «La cámara está ocupada» | Otra app o pestaña la está usando | Cierra videollamadas y otras pestañas con cámara, y recarga |
| «No encontré ninguna cámara» | El equipo no tiene cámara o está deshabilitada | Prueba en otro dispositivo |
| «La cámara se detuvo» | El sistema la apagó al cambiar de app o bloquear la pantalla | Toca **Reintentar** |
| El botón queda en «Cargando…» y aparece un aviso amarillo | No se pudieron bajar las librerías, o el navegador es muy antiguo | Revisa la conexión. iPhone: necesita iOS 16.4 o superior. Android: actualiza Chrome |

## La cámara abre pero no aparece el contenido

- **¿Es el mismo marcador que compilaste?** Si cambiaste la imagen, hay que compilar de nuevo y subir el `targets.mind` nuevo.
- **Luz y reflejos.** En una pantalla, sube el brillo y evita reflejos; impreso, que no brille. Proyectado: oscurece el lugar.
- **Distancia.** El marcador debería ocupar cerca de la mitad del ancho de la pantalla del celular. Acércate.
- **Ángulo.** De frente funciona mejor; muy de lado deja de detectarse.
- **Marcador pobre.** Imágenes con poco detalle, borrosas o con patrones repetidos se detectan mal. Mira los [consejos](primer-mapping.md#3-prepara-tu-marcador) o prueba con un [marcador de ejemplo](../examples/).
- **Con `?debug` dice «marcador: —»:** la cámara no lo reconoce (revisa lo anterior). **Si dice el nombre del marcador pero no ves nada:** el problema es el contenido: mira si aparece un aviso «No pude cargar: …» (ruta o nombre de archivo mal escrito; ojo con mayúsculas y minúsculas), o si `position` lo dejó fuera de la pantalla.

## El contenido aparece mal ubicado, girado o tiembla

- **Corrido o de otro tamaño:** ajusta `position`, `width` o `scale` en `config.js`. La unidad es el ancho del marcador y el centro es `[0, 0, 0]`.
- **Girado 90°:** la imagen que estás mirando está rotada respecto a la que compilaste (pasa con fotos de celular que guardan la orientación aparte). Abre la imagen en un editor, expórtala de nuevo como PNG y vuelve a compilar.
- **Tiembla:** baja `?cf=` (por ejemplo `?cf=0.00005`) para suavizar. Si responde con retraso, sube `?beta=` (por ejemplo `?beta=0.01`). Cuando encuentres valores que te gusten, cuéntalo en un issue.
- **Aparece en el marcador equivocado:** el orden de `targets` en `config.js` no coincide con el orden en que el compilador mostró las imágenes.

## No suena o el sonido no queda en el video

- El celular está en silencio o con el volumen de multimedia en cero.
- Los videos van **sin sonido por defecto**: agrega `sound: true` al item.
- El sonido solo empieza después de tocar **Activar cámara** (los navegadores lo exigen) y suena mientras el marcador está a la vista.
- **Sonido de otro sitio web:** si `src` apunta a otro dominio, puede sonar pero no queda en la grabación. Pon el archivo en `assets/`.
- **iPhone:** `volume` se ignora (siempre suena al máximo). Después de grabar por primera vez, el sonido pasa por el sistema de audio web, que en iPhone obedece al interruptor de silencio: si deja de sonar, revisa ese interruptor.
- Si el sonido da problemas al grabar, pon `recordAudio: false` en `config.js`: los videos se graban sin sonido y la reproducción vuelve a ser la normal.

## Foto y video

- **«Este navegador no puede grabar video»:** falta soporte de grabación (navegadores antiguos). Las fotos siguen funcionando.
- **El video se cortó solo:** llegó a `maxVideoSeconds`, giraste el celular (un video no puede cambiar de tamaño a la mitad) o saliste de la pestaña.
- **No aparece «Compartir»:** ese navegador no permite compartir archivos; usa **Descargar**.
- **El video no se puede adelantar o no muestra duración:** pasa con algunos WebM grabados en el navegador. Se reproduce bien igual; al subirlo a una red social se corrige.
- **No se guarda en la galería:** con **Descargar** queda en la carpeta de descargas; con **Compartir** puedes elegir «Guardar video/imagen».

## Va lento o se calienta el celular

El seguimiento del marcador es lo que más trabajo le da al celular. La app ya limita la resolución con que dibuja y, en modo `quality: 'auto'`, baja sola la calidad si detecta menos de 20 FPS durante unos segundos.

- Fuerza el modo liviano con `?q=low` en el link, o `quality: 'low'` en `config.js` para todos.
- Usa contenido liviano: videos de 720p o menos, modelos `.glb` de menos de 3 MB, imágenes de hasta 1024 px.
- Menos marcadores = archivo `.mind` más chico y arranque más rápido.
- Cierra otras apps y pestañas. El modo de ahorro de batería reduce el rendimiento.
- Mira los FPS con `?debug` y, si puedes, [cuéntanos tu celular y el resultado](https://github.com/Nach2212/webar-mapping-template/issues/new?template=device-report.md): el modo liviano todavía no está medido en celulares reales de gama baja.

## Errores al editar config.js o compilar

| Mensaje | Qué significa |
|---|---|
| «No pude cargar el archivo de configuración» | `config.js` tiene un error de sintaxis: falta una coma, una llave o una comilla. Compara con el original |
| «Hay errores en la configuración» + lista | Cada línea dice dónde está el problema, por ejemplo `targets[0].content[1].type: tipo desconocido` (el segundo item del primer marcador) |
| «No encontré el archivo de marcadores» | La ruta de `targetsFile` no existe. Revisa carpeta, nombre y mayúsculas |
| «…no es un archivo .mind válido» / «…versión antigua» | Vuelve a compilar con `compile.html` |
| «config.js define N marcadores pero … solo trae M» | Compila todas las imágenes juntas, o quita bloques de `targets` |
| En `compile.html`: «No pude cargar el compilador» | Sin conexión al CDN. Revisa internet y recarga |
| En `compile.html`: «La compilación falló» | Usa imágenes más chicas (hasta ~1500 px) o prueba en Chrome de escritorio |

Recuerda que GitHub Pages tarda uno o dos minutos en publicar cada cambio, y que el celular puede mostrar una versión guardada: recarga la página.

## iPhone y Safari

El proyecto todavía **no está confirmado en un iPhone real** ([issue #6](https://github.com/Nach2212/webar-mapping-template/issues/6)). El código sigue lo que documenta Apple (videos en línea, audio desbloqueado con el toque inicial, grabación en MP4), pero puede haber sorpresas. Lo que sí se sabe:

- Necesita **iOS 16.4 o superior**.
- En iPhone todos los navegadores (Chrome, Firefox) usan el motor de Safari: se comportan igual.
- Usa videos **MP4 (H.264)**; evita WebM.
- Si pruebas en un iPhone, por favor deja un [reporte de dispositivo](https://github.com/Nach2212/webar-mapping-template/issues/new?template=device-report.md), funcione o no.

## Cómo reportar un problema

[Abre un issue](https://github.com/Nach2212/webar-mapping-template/issues/new/choose) con:

1. Modelo del celular, sistema y navegador (con versión).
2. Qué hiciste y qué viste (el texto exacto del mensaje, si hubo).
3. Una captura de pantalla con `?debug` activado.
4. Si es posible, el link de tu sitio.
