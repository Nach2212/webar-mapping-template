# webar-mapping-template (English)

A **zero-build WebAR template** for projection-mapping style experiences. Point a phone camera at an image (the *marker*) and content appears on top of it: images, video, 3D models (`.glb`) or audio. Built-in buttons capture **photos and videos with the AR baked in**. No app to install; it runs in the browser and deploys free on GitHub Pages.

![demo](demo.gif)

**Live demo:** https://nach2212.github.io/webar-mapping-template/ — open it on your phone and point the camera at `targets/marker-demo.png`.

## Quick start

1. Fork this repo and enable *Settings → Pages → Deploy from a branch → `main` / root*.
2. Open `https://YOUR-USER.github.io/YOUR-REPO/` on your phone (HTTPS is required for camera access; Pages provides it).
3. Tap **Activar cámara** and aim at the marker.

## Use your own markers

1. Open `compile.html`, upload your images (order matters) and download `targets.mind`.
2. Save it as `targets/targets.mind`.
3. Edit `config.js`: one block per marker, same order. Copy the `aspect` (height/width) the compiler shows.
4. Put your media in `assets/` and reference it with `src`.

## Content types

| `type` | Shows | Main options |
|---|---|---|
| `image` | An image (transparent PNG works) | `src`, `width`, `position`, `spin` |
| `video` | A video | `src`, `width`, `position`, `loop` |
| `model` | A `.glb`/`.gltf` 3D model with its animations | `src`, `scale`, `position`, `rotation`, `spin` |
| `audio` | Sound while the marker is tracked | `src`, `loop`, `volume` |

Note: audio plays on the phone but is not yet recorded into captured videos.

## URL parameters

`?wm=Text` changes the watermark (`?wm=` removes it) · `?debug` logs marker found/lost · `?cf=` / `?beta=` tune MindAR's one-euro filter.

## Credits

Built on [MindAR](https://github.com/hiukim/mind-ar-js) (MIT) and [three.js](https://threejs.org/). Code is [MIT](LICENSE). See [CONTRIBUTING.md](CONTRIBUTING.md) to help.
