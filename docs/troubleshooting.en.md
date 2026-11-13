# Troubleshooting

*Español: [solucion-de-problemas.md](solucion-de-problemas.md)*

## First things first

1. **Reload the page.** It fixes most cases (especially after switching apps or locking the screen).
2. Check that the link starts with **`https://`**.
3. Add **`?debug`** to the end of the link: it shows the version, which marker is detected, camera resolution, FPS and quality on screen. That is the most useful information when reporting a problem.

## The camera won't open

| Message on screen | Cause | What to do |
|---|---|---|
| "Camera permission is blocked" | Permission was denied (now or earlier) | Tap the padlock or icon next to the address → Permissions → Camera → Allow, then reload. On iPhone: Settings → Safari → Camera |
| "The camera only works on secure pages (https)" | The link is `http://` or a local IP | Use the GitHub Pages `https://` link, or an https tunnel if testing on your network |
| "This browser won't allow camera access" | You opened the link inside Instagram, Facebook, TikTok or another app | Menu ⋯ → "Open in browser" (Chrome or Safari) |
| "The camera is in use" | Another app or tab is using it | Close video calls and other camera tabs, then reload |
| "No camera was found" | The device has no camera or it is disabled | Try another device |
| "The camera stopped" | The system turned it off when you switched apps or locked the screen | Tap **Try again** |
| The button stays on "Loading…" and a yellow notice appears | The libraries could not be downloaded, or the browser is very old | Check the connection. iPhone: iOS 16.4 or later is required. Android: update Chrome |

## The camera opens but no content appears

- **Is it the marker you compiled?** If you changed the image you must compile again and upload the new `targets.mind`.
- **Light and reflections.** On a screen, raise the brightness and avoid glare; printed, avoid glossy paper. Projected: darken the room.
- **Distance.** The marker should fill about half the width of the phone screen. Move closer.
- **Angle.** Head-on works best; from a steep angle it stops being detected.
- **Weak marker.** Images with little detail, blur or repeated patterns track poorly. See the [tips](first-mapping.en.md#3-prepare-your-marker) or try an [example marker](../examples/).
- **`?debug` shows "marcador: —":** the camera does not recognise it (check the points above). **If it shows the marker's name but you see nothing:** the content is the problem: look for a "Could not load: …" notice (wrong path or file name; mind upper and lower case), or check whether `position` placed it off screen.

## Content is misplaced, rotated or jittery

- **Shifted or the wrong size:** adjust `position`, `width` or `scale` in `config.js`. The unit is the marker's width and the centre is `[0, 0, 0]`.
- **Rotated 90°:** the image you are looking at is rotated compared to the one you compiled (it happens with phone photos that store orientation separately). Open the image in an editor, export it again as PNG and recompile.
- **Jittery:** lower `?cf=` (for example `?cf=0.00005`) to smooth it. If it lags, raise `?beta=` (for example `?beta=0.01`). When you find values you like, share them in an issue.
- **Shows on the wrong marker:** the order of `targets` in `config.js` does not match the order the compiler listed the images.

## No sound, or the sound is missing from the video

- The phone is muted or media volume is at zero.
- Videos are **silent by default**: add `sound: true` to the item.
- Sound only starts after tapping **Enable camera** (browsers require it) and plays while the marker is in view.
- **Sound from another website:** if `src` points to another domain it may play but will not be in the recording. Put the file in `assets/`.
- **iPhone:** `volume` is ignored (it always plays at full volume). After the first recording, sound goes through the web audio system, which on iPhone obeys the silent switch: if it goes quiet, check that switch.
- If sound misbehaves while recording, set `recordAudio: false` in `config.js`: videos are recorded without sound and playback goes back to normal.

## Photo and video

- **"This browser can't record video":** recording is not supported (old browsers). Photos still work.
- **The video stopped by itself:** it reached `maxVideoSeconds`, you rotated the phone (a video cannot change size midway) or you left the tab.
- **There is no "Share" button:** that browser cannot share files; use **Download**.
- **The video cannot be scrubbed or shows no duration:** it happens with some WebM files recorded in the browser. It still plays fine; uploading it to a social network fixes it.
- **It is not saved to the gallery:** **Download** puts it in the downloads folder; with **Share** you can choose "Save video/image".

## It is slow or the phone gets hot

Marker tracking is the heaviest work for the phone. The app already limits its drawing resolution and, with `quality: 'auto'`, lowers quality by itself if it sees fewer than 20 FPS for a few seconds.

- Force the light mode with `?q=low` in the link, or `quality: 'low'` in `config.js` for everyone.
- Use light content: videos at 720p or less, `.glb` models under 3 MB, images up to 1024 px.
- Fewer markers = a smaller `.mind` file and a faster start.
- Close other apps and tabs. Battery saver mode reduces performance.
- Check FPS with `?debug` and, if you can, [tell us your phone and the result](https://github.com/Nach2212/webar-mapping-template/issues/new?template=device-report.md): the light mode has not yet been measured on real low-end phones.

## Errors when editing config.js or compiling

| Message | What it means |
|---|---|
| "Could not load the config file" | `config.js` has a syntax error: a missing comma, brace or quote. Compare with the original |
| "There are errors in the configuration" + list | Each line says where the problem is, e.g. `targets[0].content[1].type: unknown type` (the second item of the first marker) |
| "Marker file … was not found" | The `targetsFile` path does not exist. Check folder, name and letter case |
| "…is not a valid .mind file" / "…old MindAR version" | Compile again with `compile.html` |
| "config.js defines N markers but … only contains M" | Compile all images together, or remove blocks from `targets` |
| In `compile.html`: "Could not load the compiler" | No connection to the CDN. Check your internet and reload |
| In `compile.html`: "Compilation failed" | Use smaller images (up to ~1500 px) or try desktop Chrome |

Remember that GitHub Pages takes a minute or two to publish each change, and that the phone may show a cached version: reload the page.

## iPhone and Safari

The project is **not yet confirmed on a real iPhone** ([issue #6](https://github.com/Nach2212/webar-mapping-template/issues/6)). The code follows what Apple documents (inline video, audio unlocked by the first tap, MP4 recording), but there may be surprises. What is known:

- It needs **iOS 16.4 or later**.
- On iPhone every browser (Chrome, Firefox) uses Safari's engine: they behave the same.
- Use **MP4 (H.264)** videos; avoid WebM.
- If you test on an iPhone, please leave a [device report](https://github.com/Nach2212/webar-mapping-template/issues/new?template=device-report.md), whether it works or not.

## How to report a problem

[Open an issue](https://github.com/Nach2212/webar-mapping-template/issues/new/choose) with:

1. Phone model, system and browser (with version).
2. What you did and what you saw (the exact message text, if any).
3. A screenshot with `?debug` enabled.
4. If possible, the link to your site.
