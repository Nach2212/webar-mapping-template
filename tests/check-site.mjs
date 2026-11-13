// node tests/check-site.mjs — revisa, sin navegador, que el sitio esté completo:
// cada config es válida, sus archivos existen, el .mind es válido y trae
// suficientes marcadores, y los enlaces locales de los .md no están rotos.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { inspectMind, validateConfig } from '../utils.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];
const isLocal = (src) => !/^(https?:|data:|blob:|\/\/)/.test(src);

for (const file of ['config.js', 'examples/config.js']) {
  const { CONFIG } = await import(pathToFileURL(join(root, file)));
  for (const p of validateConfig(CONFIG)) problems.push(`${file}: ${p.where} → ${p.code} (${p.value})`);
  if (!CONFIG || !Array.isArray(CONFIG.targets)) continue;

  const mindPath = join(root, CONFIG.targetsFile ?? '');
  if (!existsSync(mindPath)) problems.push(`${file}: no existe ${CONFIG.targetsFile}`);
  else {
    const info = inspectMind(readFileSync(mindPath));
    if (!info.ok) problems.push(`${file}: ${CONFIG.targetsFile} no es un .mind válido (${info.reason})`);
    else if (info.count < CONFIG.targets.length) problems.push(`${file}: define ${CONFIG.targets.length} marcadores y ${CONFIG.targetsFile} trae ${info.count}`);
  }
  for (const t of CONFIG.targets) for (const c of t.content ?? []) {
    if (typeof c.src === 'string' && isLocal(c.src) && !existsSync(join(root, c.src))) problems.push(`${file}: no existe ${c.src}`);
  }
  console.log(`✓ ${file}: ${CONFIG.targets.length} marcador(es)`);
}

// Enlaces e imágenes locales en la documentación
const mdFiles = [
  ...readdirSync(root).filter((f) => f.endsWith('.md')),
  ...(existsSync(join(root, 'docs')) ? readdirSync(join(root, 'docs')).filter((f) => f.endsWith('.md')).map((f) => `docs/${f}`) : []),
  ...(existsSync(join(root, 'examples', 'README.md')) ? ['examples/README.md'] : [])
];
for (const md of mdFiles) {
  const text = readFileSync(join(root, md), 'utf8');
  const links = [...text.matchAll(/\]\(([^)\s]+)\)/g), ...text.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
  for (const link of links) {
    if (!isLocal(link) || link.startsWith('#') || link.startsWith('mailto:')) continue;
    const target = resolve(dirname(join(root, md)), decodeURIComponent(link.split('#')[0].split('?')[0]));
    if (!existsSync(target)) problems.push(`${md}: enlace roto → ${link}`);
  }
  console.log(`✓ ${md}: ${links.length} enlaces`);
}

// README en español e inglés deben tener las mismas secciones (misma cantidad de títulos)
const headings = (f) => (readFileSync(join(root, f), 'utf8').match(/^#{1,3} /gm) ?? []).length;
for (const [es, en] of [['README.md', 'README.en.md'], ['docs/primer-mapping.md', 'docs/first-mapping.en.md'], ['docs/solucion-de-problemas.md', 'docs/troubleshooting.en.md']]) {
  if (!existsSync(join(root, es)) || !existsSync(join(root, en))) { problems.push(`falta ${es} o ${en}`); continue; }
  if (headings(es) !== headings(en)) problems.push(`${es} (${headings(es)} títulos) y ${en} (${headings(en)}) no están sincronizados`);
}

if (problems.length) {
  console.error('\n' + problems.map((p) => '✗ ' + p).join('\n'));
  process.exit(1);
}
console.log('\nSitio completo ✓');
