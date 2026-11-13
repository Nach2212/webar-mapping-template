# Marcadores de ejemplo · Example markers

Tres marcadores originales pensados para mapping: mucho detalle, formas que no se repiten, bordes marcados y tonos medios que aguantan un proyector.

Three original markers designed for mapping: dense detail, non-repeating shapes, strong edges and mid tones that survive a projector.

| # | Nombre · Name | PNG (pantalla · screen) | SVG (imprimir / proyectar · print / project) |
|---|---|---|---|
| 0 | Engranajes · Gears | [01-engranajes.png](markers/01-engranajes.png) | [01-engranajes.svg](markers/01-engranajes.svg) |
| 1 | Constelación · Constellation | [02-constelacion.png](markers/02-constelacion.png) | [02-constelacion.svg](markers/02-constelacion.svg) |
| 2 | Mosaico · Mosaic | [03-mosaico.png](markers/03-mosaico.png) | [03-mosaico.svg](markers/03-mosaico.svg) |

## Probarlos · Try them

1. Abre `index.html?config=examples/config.js` en tu celular ([demo](https://nach2212.github.io/webar-mapping-template/?config=examples/config.js)).
   Open `index.html?config=examples/config.js` on your phone.
2. Apunta a cualquiera de las tres imágenes · Point at any of the three images.

## Usarlos en tu proyecto · Use them in your project

- **Los tres:** copia `examples/targets.mind` a `targets/targets.mind` y usa los bloques de [`examples/config.js`](config.js) en tu `config.js`.
  **All three:** copy `examples/targets.mind` to `targets/targets.mind` and reuse the blocks from `examples/config.js`.
- **Solo algunos:** compílalos de nuevo con `compile.html` eligiendo solo esos PNG.
  **Only some:** compile them again with `compile.html`, picking just those PNGs.

Los archivos se regeneran con `node tools/make-examples.mjs` (necesita Node 22+ y Chrome). Licencia MIT, igual que el resto del proyecto.

These files are regenerated with `node tools/make-examples.mjs` (needs Node 22+ and Chrome). MIT licensed, like the rest of the project.
