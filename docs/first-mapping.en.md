# Your first mapping, step by step

This guide takes you from zero to your own marker with AR content running on a phone, and then set up with a projector. You don't need to code or install anything: everything happens in the browser.

*Español: [primer-mapping.md](primer-mapping.md)*

**Time:** about 30 minutes the first time.
**You need:** a GitHub account, a phone, an image to use as a marker and something to show on top of it (an image, a video, a 3D model or a sound).

## 1. Copy the template and publish it

1. On [the repo page](https://github.com/Nach2212/webar-mapping-template) click **Fork** (top right) and then **Create fork**. You can rename it, for example to `my-mapping`. Keep it **public**.
2. In your new repo go to **Settings → Pages**. Under *Build and deployment* choose **Deploy from a branch**, branch **main**, folder **/ (root)** and save.
3. Wait a minute or two. Your site lives at `https://YOUR-USER.github.io/my-mapping/`.

## 2. Try the demo as it comes

1. Open your link on the phone and tap **Enable camera**. Accept the permission.
2. On a computer open `targets/marker-demo.png` (straight from GitHub is fine) and point the phone at the screen.
3. A spinning cyan circle should appear on the image. Try the photo and video buttons.

If this works, your site is published correctly. If not, check [Troubleshooting](troubleshooting.en.md) before going on.

## 3. Prepare your marker

The marker is the image the camera will recognise. A good marker has:

- **Lots of detail** spread across the whole image (drawings, textures, large text).
- **Shapes that don't repeat.** A chessboard or a polka-dot pattern confuses the tracker.
- **Strong edges and good contrast.**
- A comfortable shape: something like a landscape sheet works well. File size: 600 to 1500 px wide is enough.

Avoid: simple logos on a flat background, blurry photos, large single-colour areas.

**If you are going to project it:** a projector's black looks grey under ambient light and colours wash out. Use mid tones and thick outlines, and test with the real projector as early as you can.

No image yet? Use one of the [example markers](../examples/) (`examples/markers/`): they were made with these criteria.

## 4. Compile the marker

The camera doesn't use your image directly but a `.mind` file generated from it.

1. Open `https://YOUR-USER.github.io/my-mapping/compile.html` on a computer.
2. Pick your images **all at once**. The page shows the order: `#0`, `#1`, `#2`… **That order matters.**
3. Click **Compile** and wait (it can take a minute with several images). `targets.mind` downloads and a snippet to paste into `config.js` appears.
4. In your GitHub repo open the `targets/` folder, click **Add file → Upload files**, upload the new `targets.mind` (it replaces the old one) and confirm with **Commit changes**.

Whenever you change or add a marker you must compile **all** the images together again.

## 5. Upload your content

In your repo's `assets/` folder: **Add file → Upload files**. Recommended formats:

| Content | Format | Tip |
|---|---|---|
| Image | PNG (with transparency) or JPG | Up to ~1024 px per side |
| Video | MP4 (H.264 + AAC) | 720p or less, a few seconds, under 5 MB |
| 3D model | `.glb` | Under 3 MB; few, light textures |
| Sound | MP3 or M4A | Short and loopable |

Use simple names without spaces or accents: `whale.mp4`, not `Whale final (2).mp4`. Heavy files make your audience wait: the lighter, the better.

## 6. Edit config.js

On GitHub open `config.js` and click the pencil ✏️. Find `targets: [` and write one block per marker, **in the same order** the compiler showed:

```js
targets: [
  {
    name: 'whale',                   // marker #0
    content: [
      { type: 'video', src: 'assets/whale.mp4', width: 1, position: [0, 0, 0.01], sound: true },
      { type: 'audio', src: 'assets/sea.mp3', loop: true, volume: 0.8 }
    ]
  },
  {
    name: 'lighthouse',              // marker #1
    content: [
      { type: 'model', src: 'assets/lighthouse.glb', scale: 0.4, position: [0, 0, 0.1], spin: true }
    ]
  }
]
```

How things are placed:

- The unit is the **marker's width**: `width: 1` covers the full width, `width: 0.5` half of it.
- `position: [x, y, z]` starts at the marker's centre: `x` to the right, `y` up, `z` towards the viewer (it "lifts off" the marker).
- To make a video fit exactly over the marker, use `width: 1` and a video with the same aspect ratio as the image.

Further up in the same file you can change the start screen title and text (`title`, `intro`), the watermark (`watermark`) and the maximum video length (`maxVideoSeconds`).

Save with **Commit changes**. The site updates in a minute or two.

## 7. Test and adjust

1. Open your link on the phone (if it was already open, reload the page).
2. Point at your marker. If you mistyped something in `config.js` or a file is missing, the app shows exactly which line to check.
3. Add `?debug` to the end of the link to see on screen which marker is detected and the FPS.
4. Adjust `position`, `width` or `scale` until it looks right. Small changes, one at a time.

Also try: moving closer and further away, looking from the side (around 30° to 45°), and under the lighting you will have on the day.

## 8. Set it up with the projector

- **Size:** project the marker large enough that, from where the audience will stand, it fills about half the width of the phone screen. If people have to get very close for it to work, make it bigger.
- **Light:** the darker the room, the better the contrast. Don't let a spotlight hit the projection directly.
- **Surface:** smooth and light-coloured. Wrinkles and relief distort the marker.
- **Focus and keystone:** an out-of-focus or heavily skewed marker is detected worse.
- **Audience access:** make a QR code with your link (any QR generator works) and put it in plain sight, printed or projected next to the marker. Add a short line: "Scan, tap Enable camera and point at the image".
- **Internet:** the first load downloads a few MB (the AR libraries) plus your content. If the venue's signal is poor, consider an open wifi for the audience.

## 9. Checklist for the day

- [ ] Tested with the real projector, at the venue, under the real lighting.
- [ ] Tested on at least one Android phone and one iPhone.
- [ ] The QR opens the right link (with `https://`).
- [ ] Photos and videos save and can be shared.
- [ ] There is a sign with the one-line instructions.
- [ ] You know what to do if someone sees nothing: reload the page, check the camera permission, move closer.

Something didn't work? See [Troubleshooting](troubleshooting.en.md) or [open an issue](https://github.com/Nach2212/webar-mapping-template/issues/new/choose).
