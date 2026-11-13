import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * Crea el contenido de un item de config.js y devuelve un THREE.Group.
 *
 * ctx = {
 *   loader:  THREE.TextureLoader compartido
 *   media:   { videos, audios, sounds, spinners, mixers, needsLight } — lo que el loop necesita
 *            (sounds = elementos con sonido: audios y videos con `sound: true`)
 *   onError: (item, error) => void — se llama si el archivo no carga
 * }
 */
export function buildContent(item, ctx) {
  const { loader, media } = ctx;
  const fail = (e) => ctx.onError && ctx.onError(item, e);
  const group = new THREE.Group();
  const w = item.width ?? 1;

  if (item.type === 'video') {
    const v = document.createElement('video');
    v.crossOrigin = 'anonymous'; // antes de src: sin esto WebGL no puede usar videos de otro dominio
    v.loop = item.loop ?? true;
    v.muted = !item.sound;       // sin sonido por defecto: así puede empezar solo en móviles
    v.playsInline = true;
    // iOS mira los ATRIBUTOS (no solo las propiedades) para decidir si deja
    // reproducir sin pantalla completa y sin gesto del usuario.
    if (!item.sound) v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');
    v.preload = 'auto';
    v.addEventListener('error', () => fail(v.error));
    v.src = item.src;
    media.videos.push(v);
    if (item.sound) media.sounds.push(v);

    const tex = new THREE.VideoTexture(v);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true })
    );
    const fit = () => mesh.scale.set(w, w * (v.videoWidth ? v.videoHeight / v.videoWidth : 9 / 16), 1);
    v.addEventListener('loadedmetadata', fit);
    fit();
    mesh.position.set(...(item.position ?? [0, 0, 0.01]));
    group.add(mesh);
  } else if (item.type === 'model') {
    // Modelo 3D .glb / .gltf (con sus animaciones, si las trae)
    new GLTFLoader().load(
      item.src,
      (gltf) => {
        const m = gltf.scene;
        m.scale.setScalar(item.scale ?? 1);
        m.position.set(...(item.position ?? [0, 0, 0]));
        if (item.rotation) m.rotation.set(...item.rotation); // radianes
        group.add(m);
        if (item.spin) media.spinners.push(m);
        if (gltf.animations.length) {
          const mixer = new THREE.AnimationMixer(m);
          gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
          media.mixers.push(mixer);
        }
      },
      undefined,
      fail
    );
    media.needsLight = true;
  } else if (item.type === 'audio') {
    const au = new Audio();
    au.loop = item.loop ?? true;
    au.volume = Math.min(1, Math.max(0, item.volume ?? 1));
    au.preload = 'auto';
    au.addEventListener('error', () => fail(au.error));
    au.src = item.src;
    media.audios.push(au);
    media.sounds.push(au);
  } else {
    // 'image' (también es el valor por defecto si no se indica type)
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ transparent: true })
    );
    mesh.visible = false; // hasta que cargue: evita un cuadro blanco
    loader.load(
      item.src,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        mesh.material.map = tex;
        mesh.material.needsUpdate = true;
        mesh.scale.set(w, w * (tex.image.height / tex.image.width), 1);
        mesh.visible = true;
      },
      undefined,
      fail
    );
    mesh.position.set(...(item.position ?? [0, 0, 0.01]));
    if (item.spin) media.spinners.push(mesh);
    group.add(mesh);
  }
  return group;
}
