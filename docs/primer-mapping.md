# Tu primer mapping, paso a paso

Esta guía te lleva desde cero hasta tener tu propio marcador con contenido AR funcionando en el celular, y luego montado con un proyector. No necesitas programar ni instalar nada: todo se hace desde el navegador.

*English: [first-mapping.en.md](first-mapping.en.md)*

**Tiempo:** unos 30 minutos la primera vez.
**Necesitas:** una cuenta de GitHub, un celular, una imagen para usar de marcador y algo que mostrar encima (una imagen, un video, un modelo 3D o un sonido).

## 1. Copia la plantilla y publícala

1. En [la página del repo](https://github.com/Nach2212/webar-mapping-template) toca **Fork** (arriba a la derecha) y luego **Create fork**. Puedes cambiarle el nombre, por ejemplo a `mi-mapping`. Déjalo **público**.
2. En tu repo nuevo entra a **Settings → Pages**. En *Build and deployment* elige **Deploy from a branch**, rama **main**, carpeta **/ (root)** y guarda.
3. Espera uno o dos minutos. Tu sitio queda en `https://TU-USUARIO.github.io/mi-mapping/`.

## 2. Prueba la demo tal como viene

1. Abre tu link en el celular y toca **Activar cámara**. Acepta el permiso.
2. En el computador abre `targets/marker-demo.png` (desde GitHub mismo sirve) y apunta el celular a la pantalla.
3. Debe aparecer un círculo cian girando sobre la imagen. Prueba los botones de foto y video.

Si esto funciona, tu sitio está bien publicado. Si no, mira [Solución de problemas](solucion-de-problemas.md) antes de seguir.

## 3. Prepara tu marcador

El marcador es la imagen que la cámara va a reconocer. Un buen marcador tiene:

- **Mucho detalle** repartido por toda la imagen (dibujos, texturas, texto grande).
- **Formas que no se repiten.** Un tablero de ajedrez o un patrón de lunares confunden al sistema.
- **Bordes marcados y buen contraste.**
- Proporción cómoda: algo como una hoja apaisada funciona bien. Tamaño del archivo: entre 600 y 1500 px de ancho es suficiente.

Evita: logos simples sobre fondo liso, fotos borrosas, grandes zonas de un solo color.

**Si lo vas a proyectar:** el negro de un proyector se ve gris cuando hay luz ambiente y los colores se lavan. Usa tonos medios y contornos gruesos, y haz la prueba real con el proyector lo antes posible.

¿No tienes una imagen todavía? Usa uno de los [marcadores de ejemplo](../examples/) (`examples/markers/`): están hechos con estos criterios.

## 4. Compila el marcador

La cámara no usa tu imagen directamente sino un archivo `.mind` que se genera a partir de ella.

1. Abre `https://TU-USUARIO.github.io/mi-mapping/compile.html` en el computador.
2. Elige tus imágenes **todas juntas**. La página muestra el orden: `#0`, `#1`, `#2`… **Ese orden importa.**
3. Toca **Compilar** y espera (puede tardar un minuto con varias imágenes). Se descarga `targets.mind` y aparece un texto para pegar en `config.js`.
4. En tu repo de GitHub entra a la carpeta `targets/`, toca **Add file → Upload files**, sube el `targets.mind` nuevo (reemplaza al anterior) y confirma con **Commit changes**.

Cada vez que cambies o agregues un marcador hay que volver a compilar **todas** las imágenes juntas.

## 5. Sube tu contenido

En la carpeta `assets/` de tu repo: **Add file → Upload files**. Formatos recomendados:

| Contenido | Formato | Consejo |
|---|---|---|
| Imagen | PNG (con transparencia) o JPG | Hasta ~1024 px por lado |
| Video | MP4 (H.264 + AAC) | 720p o menos, pocos segundos, menos de 5 MB |
| Modelo 3D | `.glb` | Menos de 3 MB; pocas texturas y livianas |
| Sonido | MP3 o M4A | Corto y que se pueda repetir en bucle |

Usa nombres simples, sin espacios ni tildes: `ballena.mp4`, no `Ballena final (2).mp4`. Los archivos pesados hacen que el público espere: mientras más liviano, mejor.

## 6. Edita config.js

En GitHub abre `config.js` y toca el lápiz ✏️. Busca `targets: [` y deja un bloque por cada marcador, **en el mismo orden** que mostró el compilador:

```js
targets: [
  {
    name: 'ballena',                 // marcador #0
    content: [
      { type: 'video', src: 'assets/ballena.mp4', width: 1, position: [0, 0, 0.01], sound: true },
      { type: 'audio', src: 'assets/mar.mp3', loop: true, volume: 0.8 }
    ]
  },
  {
    name: 'faro',                    // marcador #1
    content: [
      { type: 'model', src: 'assets/faro.glb', scale: 0.4, position: [0, 0, 0.1], spin: true }
    ]
  }
]
```

Cómo se ubican las cosas:

- La unidad es el **ancho del marcador**: `width: 1` cubre todo el ancho, `width: 0.5` la mitad.
- `position: [x, y, z]` parte del centro del marcador: `x` a la derecha, `y` hacia arriba, `z` hacia la persona (se "despega" del marcador).
- Para que un video calce justo sobre el marcador, usa `width: 1` y un video con la misma proporción que la imagen.

Más arriba en el mismo archivo puedes cambiar el título y el texto de inicio (`title`, `intro`), la marca de agua (`watermark`) y la duración máxima de los videos (`maxVideoSeconds`).

Guarda con **Commit changes**. En uno o dos minutos el sitio se actualiza.

## 7. Prueba y ajusta

1. Abre tu link en el celular (si ya estaba abierto, recarga la página).
2. Apunta a tu marcador. Si escribiste algo mal en `config.js` o falta un archivo, la app te muestra exactamente qué línea revisar.
3. Agrega `?debug` al final del link para ver en pantalla qué marcador se detecta y a cuántos FPS corre.
4. Ajusta `position`, `width` o `scale` hasta que quede como quieres. Cambios chicos, uno a la vez.

Prueba también: acercarte y alejarte, mirar de lado (unos 30° a 45°), y con la luz que habrá el día de la muestra.

## 8. Móntalo con el proyector

- **Tamaño:** proyecta el marcador lo bastante grande como para que, desde donde va a estar el público, ocupe cerca de la mitad del ancho de la pantalla del celular. Si la gente tiene que acercarse mucho para que funcione, agrándalo.
- **Luz:** mientras más oscuro el lugar, mejor contraste. Evita que un foco le pegue directo a la proyección.
- **Superficie:** lisa y clara. Las arrugas y los relieves deforman el marcador.
- **Enfoque y keystone:** un marcador desenfocado o muy trapezoidal se detecta peor.
- **Acceso del público:** genera un código QR con tu link (cualquier generador de QR sirve) y ponlo a la vista, impreso o proyectado al lado. Agrega una frase corta: «Escanea, toca Activar cámara y apunta a la imagen».
- **Internet:** la primera carga baja unos pocos MB (las librerías de AR) más tu contenido. Si la señal del lugar es mala, considera un wifi abierto para el público.

## 9. Lista para el día de la muestra

- [ ] Probado con el proyector real, en el lugar y con la luz real.
- [ ] Probado en al menos un Android y un iPhone.
- [ ] El QR abre el link correcto (con `https://`).
- [ ] Fotos y videos se guardan y se pueden compartir.
- [ ] Hay un cartel con las instrucciones en una línea.
- [ ] Sabes qué hacer si alguien no ve nada: recargar la página, revisar el permiso de cámara, acercarse.

¿Algo no funcionó? Mira [Solución de problemas](solucion-de-problemas.md) o [abre un issue](https://github.com/Nach2212/webar-mapping-template/issues/new/choose).
