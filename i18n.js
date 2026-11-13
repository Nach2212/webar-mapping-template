// Textos de la interfaz en español e inglés. Para cambiar un texto, edítalo aquí.
// UI strings in Spanish and English. Edit them here.

export const STRINGS = {
  es: {
    title: 'WebAR Mapping',
    intro: 'Apunta la cámara al marcador para ver la magia ✨',
    loading: 'Cargando…',
    start: 'Activar cámara',
    opening: 'Abriendo la cámara…',
    hint: 'Busca el marcador…',
    retry: 'Reintentar',
    photo: 'Sacar foto',
    record: 'Grabar video',
    stop: 'Detener grabación',
    share: 'Compartir',
    download: 'Descargar',
    close: 'Cerrar',
    previewPhoto: 'Tu foto',
    previewVideo: 'Tu video',

    errTitle: 'Algo no salió bien 😕',
    errInsecure: 'La cámara solo funciona en páginas seguras (https). Abre el link con https:// al inicio.',
    errNoCameraApi: 'Este navegador no deja usar la cámara. Si abriste el link desde Instagram, WhatsApp u otra app, ábrelo en Chrome o Safari.',
    errDenied: 'No hay permiso para usar la cámara. Actívalo en los ajustes del sitio (el candado junto a la dirección) y vuelve a intentar.',
    errNoCamera: 'No encontré ninguna cámara en este dispositivo.',
    errBusy: 'La cámara está ocupada por otra app o pestaña. Ciérrala y vuelve a intentar.',
    errTimeout: 'La cámara tardó demasiado en responder. Revisa tu conexión y vuelve a intentar.',
    errCameraOther: 'No pude abrir la cámara. Revisa los permisos y que la página esté en https.',
    errStart: 'No pude iniciar el seguimiento del marcador. Recarga la página; si sigue fallando, prueba con otro navegador.',
    errCameraLost: 'La cámara se detuvo (pasa al cambiar de app o bloquear la pantalla).',
    errConfigLoad: 'No pude cargar el archivo de configuración «{file}». Revisa que exista y que no tenga errores de sintaxis.',
    errConfig: 'Hay errores en la configuración ({file}):',
    errMindFetch: 'No encontré el archivo de marcadores «{file}». Compílalo con compile.html y guárdalo en esa ruta.',
    errMind_empty: 'El archivo de marcadores «{file}» está vacío. Vuelve a compilarlo con compile.html.',
    errMind_html: '«{file}» no es un archivo de marcadores (el servidor devolvió una página web: probablemente la ruta está mal).',
    errMind_format: '«{file}» no es un archivo .mind válido. Vuelve a compilarlo con compile.html.',
    errMind_version: '«{file}» fue compilado con una versión antigua de MindAR. Vuelve a compilarlo con compile.html.',
    errMindCount: 'config.js define {want} marcadores pero «{file}» solo trae {have}. Compila todas las imágenes juntas o quita los que sobran.',
    errNoRecorder: 'Este navegador no puede grabar video. Las fotos sí funcionan.',
    errRecFailed: 'La grabación falló. Intenta de nuevo con un video más corto.',
    warnAsset: 'No pude cargar: {file}',
    warnShare: 'No pude compartir; usa «Descargar».',

    cfg_missing: 'falta `export const CONFIG = { … }`',
    cfg_targetsFile: 'debe ser la ruta del archivo .mind',
    cfg_targets: 'debe ser una lista con al menos un marcador',
    cfg_content: 'debe ser una lista (puede ir vacía: [])',
    cfg_item: 'debe ser un objeto { type, src, … }',
    cfg_type: "tipo desconocido: usa 'image', 'video', 'model' o 'audio'",
    cfg_src: 'falta la ruta del archivo (src)',
    cfg_number: 'debe ser un número',
    cfg_vec3: 'debe ser una lista de 3 números, p. ej. [0, 0, 0.05]',
    cfg_quality: "usa 'auto', 'high' o 'low'"
  },
  en: {
    title: 'WebAR Mapping',
    intro: 'Point your camera at the marker to see the magic ✨',
    loading: 'Loading…',
    start: 'Enable camera',
    opening: 'Opening the camera…',
    hint: 'Look for the marker…',
    retry: 'Try again',
    photo: 'Take photo',
    record: 'Record video',
    stop: 'Stop recording',
    share: 'Share',
    download: 'Download',
    close: 'Close',
    previewPhoto: 'Your photo',
    previewVideo: 'Your video',

    errTitle: 'Something went wrong 😕',
    errInsecure: 'The camera only works on secure pages (https). Open the link with https:// at the start.',
    errNoCameraApi: "This browser won't allow camera access. If you opened the link from Instagram, WhatsApp or another app, open it in Chrome or Safari instead.",
    errDenied: 'Camera permission is blocked. Enable it in the site settings (the padlock next to the address) and try again.',
    errNoCamera: 'No camera was found on this device.',
    errBusy: 'The camera is in use by another app or tab. Close it and try again.',
    errTimeout: 'The camera took too long to respond. Check your connection and try again.',
    errCameraOther: "Couldn't open the camera. Check the permissions and that the page is served over https.",
    errStart: "Couldn't start marker tracking. Reload the page; if it keeps failing, try another browser.",
    errCameraLost: 'The camera stopped (this happens when you switch apps or lock the screen).',
    errConfigLoad: 'Could not load the config file "{file}". Check that it exists and has no syntax errors.',
    errConfig: 'There are errors in the configuration ({file}):',
    errMindFetch: 'Marker file "{file}" was not found. Compile it with compile.html and save it at that path.',
    errMind_empty: 'Marker file "{file}" is empty. Compile it again with compile.html.',
    errMind_html: '"{file}" is not a marker file (the server returned a web page: the path is probably wrong).',
    errMind_format: '"{file}" is not a valid .mind file. Compile it again with compile.html.',
    errMind_version: '"{file}" was compiled with an old MindAR version. Compile it again with compile.html.',
    errMindCount: 'config.js defines {want} markers but "{file}" only contains {have}. Compile all images together or remove the extra ones.',
    errNoRecorder: "This browser can't record video. Photos still work.",
    errRecFailed: 'Recording failed. Try again with a shorter video.',
    warnAsset: 'Could not load: {file}',
    warnShare: "Couldn't share; use “Download”.",

    cfg_missing: 'missing `export const CONFIG = { … }`',
    cfg_targetsFile: 'must be the path to the .mind file',
    cfg_targets: 'must be a list with at least one marker',
    cfg_content: 'must be a list (it can be empty: [])',
    cfg_item: 'must be an object { type, src, … }',
    cfg_type: "unknown type: use 'image', 'video', 'model' or 'audio'",
    cfg_src: 'missing file path (src)',
    cfg_number: 'must be a number',
    cfg_vec3: 'must be a list of 3 numbers, e.g. [0, 0, 0.05]',
    cfg_quality: "use 'auto', 'high' or 'low'"
  }
};

/** Devuelve t(clave, { variables }) para el idioma dado. */
export function makeT(lang) {
  const dict = STRINGS[lang] ?? STRINGS.es;
  return (key, vars = {}) => {
    const s = dict[key] ?? STRINGS.es[key] ?? key;
    return s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
  };
}
