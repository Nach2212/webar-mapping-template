# Contribuir / Contributing

¡Gracias por querer aportar! Thanks for helping out.

## Qué ayuda más · What helps most

- **Reportes de dispositivo.** Probar en tu celular y contar qué funciona (usa la plantilla de issue «Reporte de dispositivo»). Hoy es lo que más falta, sobre todo iPhone y Android de gama baja.
  *Device reports: test on your phone and tell us what works. This is what the project needs most right now.*
- Reportes de errores con una captura usando `?debug`. *Bug reports with a `?debug` screenshot.*
- Mejoras de rendimiento, nuevos tipos de contenido, traducciones, marcadores de ejemplo. *Performance, new content types, translations, example markers.*

## Cómo probar cambios · Testing changes

No hay build ni dependencias. Sirve la carpeta con cualquier servidor estático:
*No build, no dependencies. Serve the folder with any static server:*

```bash
python3 -m http.server 8000
```

- `http://localhost:8000/tests/` corre las pruebas unitarias y revisa que la app cargue. *Runs unit tests and a load check in the browser.*
- Con Node 22+ y Chrome instalados / *With Node 22+ and Chrome installed*:

```bash
node tests/run-node.mjs
```

```bash
node tests/check-site.mjs
```

```bash
node tests/e2e.mjs
```

`tests/e2e.mjs` usa una cámara simulada: revisa detección del marcador, foto, video, sonido grabado y los mensajes de error. **No reemplaza probar en un celular real**: la cámara exige https, así que publica tu fork en GitHub Pages o usa un túnel (`cloudflared`, `ngrok`).
*The e2e suite uses a simulated camera. It does not replace testing on a real phone.*

## Reglas del proyecto · Project rules

1. **Sin build y sin dependencias que instalar.** Nada de frameworks ni bundlers: todo debe funcionar abriendo la carpeta con un servidor estático. *No build step, no frameworks, no bundlers.*
2. `config.js` es lo único que edita quien usa la plantilla: mantenlo simple y comentado. *`config.js` is the only file template users edit.*
3. Nunca pongas claves ni secretos en el código. *Never put keys or secrets in the code.*
4. Los textos visibles van en `i18n.js`, en español e inglés. `README.md` y `README.en.md` se actualizan juntos. *User-facing strings go in `i18n.js` in both languages; keep both READMEs in sync.*
5. Lógica nueva que se pueda probar sin cámara va en `utils.js` con su prueba en `tests/unit.js`. *Testable logic goes in `utils.js` with a test.*
6. **No inventes resultados.** En el PR di exactamente qué probaste y en qué dispositivo, y qué no pudiste probar. *Say exactly what you tested, on which device, and what you could not test.*

## Pull requests

1. Haz fork y crea una rama (`git checkout -b mi-mejora`). *Fork and branch.*
2. Commits pequeños, un cambio lógico por commit. *Small commits, one logical change each.*
3. Agrega una línea en `CHANGELOG.md`. *Add a line to `CHANGELOG.md`.*
4. Describe qué cambia y por qué. *Describe what changes and why.*

Al contribuir aceptas que tu aporte se publique bajo la licencia [MIT](LICENSE).
*By contributing you agree to release your work under the [MIT](LICENSE) license.*
