// Prueba: un archivo de contenido no existe (no debe impedir que el AR funcione).
export const CONFIG = {
  targetsFile: 'targets/targets.mind',
  lang: 'es',
  targets: [{ name: 'x', content: [{ type: 'image', src: 'assets/no-existe.png' }] }]
};
