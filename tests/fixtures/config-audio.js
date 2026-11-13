// Prueba: un marcador con audio. El WAV (tono de 440 Hz) se genera aquí mismo
// para no guardar archivos binarios de prueba en el repo.
function toneWav(seconds = 1, freq = 440, rate = 22050) {
  const n = Math.floor(seconds * rate);
  const b = new Uint8Array(44 + n * 2);
  const v = new DataView(b.buffer);
  const str = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); str(8, 'WAVEfmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.sin((2 * Math.PI * freq * i) / rate) * 0.5 * 32767, true);
  let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
  return 'data:audio/wav;base64,' + btoa(s);
}

export const CONFIG = {
  targetsFile: 'targets/targets.mind',
  lang: 'es',
  watermark: '',
  targets: [{
    name: 'demo',
    content: [
      { type: 'audio', src: toneWav(), loop: true, volume: 1 },
      { type: 'model', src: 'assets/demo-cube.glb', scale: 0.3, position: [0, 0, 0.15], spin: true }
    ]
  }]
};
