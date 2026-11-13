# webar-mapping-template

Plantilla **WebAR** lista para usar: apunta la cámara del celular a una imagen (marcador) y aparece contenido encima (imagen, video, modelo 3D o sonido), con botones para **sacar fotos y grabar videos con el AR incluido**. Sin instalar apps, sin build, funciona en el navegador y se publica gratis en GitHub Pages.

> Pensada para **mapping AR**: marcadores proyectados o impresos que activan una escena en el celular de cada persona.

*English: [README.en.md](README.en.md)*

<p align="center"><img src="demo.gif" alt="Demo: la cámara detecta el marcador y aparece el contenido AR encima" width="260"></p>

<p align="center"><b><a href="https://nach2212.github.io/webar-mapping-template/">▶ Probar la demo en vivo</a></b> (ábrela en tu celular y apunta a <a href="targets/marker-demo.png"><code>targets/marker-demo.png</code></a>)</p>

## Probarlo en 2 minutos

1. Abre la [demo](https://nach2212.github.io/webar-mapping-template/) en tu celular y toca **Activar cámara**.
2. Abre [`targets/marker-demo.png`](targets/marker-demo.png) en otra pantalla (o imprímela) y apunta el celular hacia ella. Debería aparecer un círculo cian girando.
3. Usa 📷 para sacar una foto y ⏺ para grabar un video; al terminar puedes compartirlo o descargarlo.

Si algo falla, la app te dice qué pasó. Más ayuda en [Solución de problemas](docs/solucion-de-problemas.md).

## Tu primer mapping

La guía paso a paso está en **[docs/primer-mapping.md](docs/primer-mapping.md)**: desde copiar la plantilla hasta montarla con un proyector. El resumen:

1. Copia este repo (*Fork*) y activa GitHub Pages.
2. Abre `compile.html`, sube las imágenes de tus marcadores y guarda el archivo que descarga en `targets/targets.mind`.
3. Pon tus imágenes, videos, modelos y sonidos en `assets/`.
4. Edita `config.js`: un bloque por marcador, en el mismo orden en que el compilador mostró las imágenes.

```js
targets: [
  {
    name: 'portal',
    content: [
      { type: 'video', src: 'assets/ballena.mp4', width: 1, position: [0, 0, 0.01], sound: true },
      { type: 'image', src: 'assets/brillo.png',  width: 0.4, position: [0, 0, 0.05], spin: true }
    ]
  }
]
```

## Tipos de contenido

| `type` | Qué muestra | Opciones |
|---|---|---|
| `image` | Imagen (PNG con transparencia sirve) | `src`, `width`, `position`, `spin` |
| `video` | Video sobre el marcador | `src`, `width`, `position`, `loop`, `sound` |
| `model` | Modelo 3D `.glb`/`.gltf` con sus animaciones | `src`, `scale`, `position`, `rotation`, `spin` |
| `audio` | Sonido mientras el marcador está a la vista | `src`, `loop`, `volume` |

- **Medidas:** `1` equivale al ancho del marcador. `width: 0.5` es la mitad de su ancho.
- **`position: [x, y, z]`:** `x` hacia la derecha, `y` hacia arriba, `z` hacia ti (saliendo del marcador). El centro del marcador es `[0, 0, 0]`.
- **`rotation`** va en radianes; **`spin: true`** hace girar el contenido.
- **`sound: true`** hace que un video suene (por defecto va en silencio para que pueda empezar solo).
- El sonido de los `audio` y de los videos con `sound: true` **queda grabado en los videos** que captura la persona.

Hay un cubo de prueba en `assets/demo-cube.glb`.

## Opciones de config.js

| Opción | Para qué sirve | Por defecto |
|---|---|---|
| `targetsFile` | Ruta del archivo `.mind` con tus marcadores | `'targets/targets.mind'` |
| `title`, `intro` | Textos de la pantalla de inicio | textos genéricos |
| `lang` | Idioma de botones y mensajes: `'auto'`, `'es'` o `'en'` | `'auto'` |
| `watermark` | Marca de agua de fotos y videos (`''` la quita) | — |
| `maxVideoSeconds` | Duración máxima de cada video | `30` |
| `recordAudio` | Incluir el sonido del contenido en los videos grabados | `true` |
| `quality` | `'auto'`, `'high'` o `'low'` (ver [rendimiento](docs/solucion-de-problemas.md#va-lento-o-se-calienta-el-celular)) | `'auto'` |
| `targets` | Tus marcadores y su contenido | — |

Si te equivocas al editar (un tipo mal escrito, un archivo que no existe, más marcadores que los compilados), la app lo muestra en pantalla en vez de quedarse en negro.

## Marcadores de ejemplo

En [`examples/`](examples/) hay tres marcadores originales pensados para mapping, ya compilados:

| Engranajes | Constelación | Mosaico |
|---|---|---|
| <img src="examples/markers/01-engranajes.png" width="240" alt="Marcador de engranajes"> | <img src="examples/markers/02-constelacion.png" width="240" alt="Marcador de constelación"> | <img src="examples/markers/03-mosaico.png" width="240" alt="Marcador de mosaico"> |

Pruébalos con **[la demo de ejemplos](https://nach2212.github.io/webar-mapping-template/?config=examples/config.js)** (`?config=examples/config.js`) apuntando a cualquiera de las tres imágenes. Puedes usarlos tal cual en tu proyecto: hay versión `.svg` para imprimir o proyectar en grande.

## Parámetros útiles en la URL

| Parámetro | Para qué sirve |
|---|---|
| `?debug` | Muestra en pantalla versión, marcador detectado, cámara, FPS y calidad (útil para reportar problemas) |
| `?config=carpeta/config.js` | Usa otro archivo de configuración: varias experiencias en un mismo sitio |
| `?wm=Mi%20Texto` | Cambia la marca de agua (`?wm=` la quita) |
| `?lang=en` | Fuerza el idioma (`es` o `en`) |
| `?q=low` | Fuerza la calidad (`low` o `high`) |
| `?cf=0.0001` | `filterMinCF` de MindAR (menos = más suave) |
| `?beta=0.001` | `filterBeta` de MindAR (más = responde más rápido, pero tiembla) |

## Compatibilidad

Necesita un navegador con *import maps*: **Chrome 89+**, **Safari / iOS 16.4+** o **Firefox 108+**, y que la página esté en **https**.

| Función | Android · Chrome | iPhone · Safari | Chrome de escritorio |
|---|---|---|---|
| Abrir cámara y seguir el marcador | ✅ | ❓ | 🧪 |
| Contenido `image` | ✅ | ❓ | 🧪 |
| Contenido `video`, `model`, `audio` | ❓ | ❓ | 🧪 |
| Foto con AR | ❓ | ❓ | 🧪 |
| Video con AR | ❓ | ❓ | 🧪 |
| Sonido dentro del video grabado | ❓ | ❓ | 🧪 |
| Botón Compartir | ❓ | ❓ | — (se usa Descargar) |

- ✅ probado en un celular real · 🧪 probado solo con pruebas automáticas (Chrome de escritorio con cámara simulada) · ❓ aún sin probar en un dispositivo real.
- **¿Tienes uno de esos celulares?** Ayuda mucho un [reporte de dispositivo](https://github.com/Nach2212/webar-mapping-template/issues/new?template=device-report.md): toma 2 minutos.

Cosas a saber (según la documentación de cada navegador):

- **Formato del video grabado:** MP4 donde el navegador lo permite (Safari siempre; Chrome reciente) y WebM en los demás.
- **iPhone:** el volumen de `audio` no se puede ajustar (`volume` se ignora, suena al máximo). Para tus videos usa MP4 (H.264); WebM no funciona en iOS antiguos.
- **Navegadores dentro de apps** (Instagram, Facebook, TikTok): muchos no dan acceso a la cámara. La app avisa y pide abrir el link en Chrome o Safari.
- **Dependencias:** three.js 0.160 y MindAR 1.2.5 se cargan desde un CDN con versión fija. No subas three más allá de 0.161 (MindAR 1.2.5 deja de cargar).

## Consejos para buenos marcadores

- Mucho detalle, alto contraste y formas únicas. Evita zonas planas grandes y patrones repetidos.
- **Si lo vas a proyectar**: el negro del proyector se ve gris con luz ambiente, así que usa tonos medios y bordes bien marcados.
- Prueba impreso vs proyectado, y a 0°, 30° y 45°.
- Cada marcador con mucho detalle suma cerca de 0,5 MB al archivo `.mind`: usa los que necesites.

## Solución de problemas

Lo más común (la lista completa está en [docs/solucion-de-problemas.md](docs/solucion-de-problemas.md)):

| Síntoma | Qué revisar |
|---|---|
| «No hay permiso para usar la cámara» | Permiso del sitio en el navegador (candado junto a la dirección) |
| La cámara abre pero no aparece nada | Luz, reflejos y distancia; que el marcador sea el mismo que compilaste; prueba con `?debug` |
| «No encontré el archivo de marcadores» | Que `targets/targets.mind` exista y que `targetsFile` tenga la ruta correcta |
| El botón queda en «Cargando…» | Conexión a internet; navegador muy antiguo (iPhone: iOS 16.4 o superior) |
| El contenido aparece girado o corrido | `position` / `rotation` en `config.js`; que el marcador no esté rotado respecto al compilado |

## Publicar gratis (GitHub Pages)

1. Sube todo a un repo.
2. *Settings → Pages → Deploy from a branch → `main` / root*.
3. Abre `https://TU-USUARIO.github.io/TU-REPO/`. **Necesita https** para que el navegador deje usar la cámara (Pages ya lo trae).

## Probar en tu computador y correr las pruebas

No hay nada que instalar ni compilar. Sirve la carpeta con cualquier servidor estático:

```bash
python3 -m http.server 8000
```

Abre `http://localhost:8000` (en `localhost` la cámara funciona sin https). Para probar desde el celular necesitas https: publica en Pages o usa un túnel (`cloudflared`, `ngrok`).

Pruebas (opcionales, para quien modifica el código):

| Qué | Cómo | Necesita |
|---|---|---|
| Pruebas unitarias + carga de la app | Abre `http://localhost:8000/tests/` | Solo el navegador |
| Lo mismo, en la terminal | `node tests/run-node.mjs` y `node tests/check-site.mjs` | Node 22+ |
| De punta a punta con cámara simulada | `node tests/e2e.mjs` | Node 22+ y Chrome |

Las pruebas de punta a punta le muestran el marcador a una cámara falsa de Chrome y revisan detección, foto, video, sonido grabado y cada mensaje de error. No reemplazan probar en un celular real.

## Cómo funciona

- [MindAR](https://github.com/hiukim/mind-ar-js) (MIT) para el image tracking.
- [three.js](https://threejs.org/) para dibujar el contenido sobre el marcador.
- La captura compone cámara + escena 3D + marca de agua en un `<canvas>` y lo graba con `MediaRecorder`; el sonido se suma con Web Audio.

Estructura:

- `config.js` — **lo único que editas**.
- `index.html`, `app.js` — pantalla, cámara, tracking y mensajes.
- `content.js` — construye imagen / video / modelo / audio para cada marcador.
- `capture.js` — foto y video con AR y sonido.
- `i18n.js` — textos en español e inglés. `utils.js` — validaciones y funciones auxiliares.
- `compile.html` — compilador de marcadores en el navegador.
- `examples/` — marcadores de ejemplo. `tests/`, `tools/` — pruebas y utilidades (no se necesitan para usar la plantilla).

## Créditos y licencia

- Código: [MIT](LICENSE) © Ignacio Aguayo Pichún. Cambios en [CHANGELOG.md](CHANGELOG.md); cómo aportar en [CONTRIBUTING.md](CONTRIBUTING.md).
- Los marcadores de `examples/` son originales de este proyecto (MIT).
- El marcador `targets/marker-demo.png` y su `.mind` vienen del ejemplo oficial de MindAR (licencia MIT). Cámbialos por los tuyos.
