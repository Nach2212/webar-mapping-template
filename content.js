import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * Crea el contenido de un item de config.js.
 * `media` acumula lo que el loop principal necesita: videos, audios, spinners, mixers.
 */
export function buildContent(item, loader, media) {
  const videos = media.videos;
  const group = new THREE.Group();
  const w = item.width ?? 1;

  if (item.type === 'video') {
    const v = document.createElement('video');
    v.src = item.src;
    v.loop = item.loop ?? true;
    v.muted = true;            // necesario para autoplay en móviles
    v.playsInline = true;
    v.crossOrigin = 'anonymous';
    v.preload = 'auto';
    videos.push(v);
    const tex = new THREE.VideoTexture(v);
    tex.colorSpace = THREE.SRGBColorSpace;
    const vw = () => (v.videoHeight ? v.videoHeight / v.videoWidth : 9 / 16);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true })
    );
    v.addEventListener('loadedmetadata', () => mesh.scale.set(w, w * vw(), 1));
    mesh.scale.set(w, w * vw(), 1);
    mesh.position.set(...(item.position ?? [0, 0, 0.01]));
    group.add(mesh);
    group.userData.video = v;
  } else if (item.type === 'model') {
    // Modelo 3D .glb / .gltf (con sus animaciones, si las trae)
    new GLTFLoader().load(
      item.src,
      (gltf) => {
        const m = gltf.scene;
        m.scale.setScalar(item.scale ?? 1);
        m.position.set(...(item.position ?? [0, 0, 0]));
        if (item.rotation) m.rotation.set(...item.rotation); // radianes
        if (item.spin) m.userData.spin = true;
        group.add(m);
        media.spinners.push(...(item.spin ? [m] : []));
        if (gltf.animations.length) {
          const mixer = new THREE.AnimationMixer(m);
          gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
          media.mixers.push(mixer);
        }
      },
      undefined,
      (e) => console.error('[webar] no pude cargar el modelo', item.src, e)
    );
    media.needsLight = true;
  } else if (item.type === 'audio') {
    const au = new Audio(item.src);
    au.loop = item.loop ?? true;
    au.volume = item.volume ?? 1;
    au.preload = 'auto';
    media.audios.push(au);
  } else {
    const tex = loader.load(item.src);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    const img = new Image();
    img.onload = () => mesh.scale.set(w, w * (img.height / img.width), 1);
    img.src = item.src;
    mesh.scale.set(w, w, 1);
    mesh.position.set(...(item.position ?? [0, 0, 0.01]));
    if (item.spin) { mesh.userData.spin = true; media.spinners.push(mesh); }
    group.add(mesh);
  }
  return group;
}
