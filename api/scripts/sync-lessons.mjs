// Copia la lista de lecciones y retos del contenido de la web a src/lessons.json.
// Ejecuta `npm run sync-lessons` cada vez que agregues o quites lecciones en web/content.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const contentDir = join(here, '../../web/content');
const lessons = [];
for (const file of readdirSync(contentDir).filter((f) => /^g\d+\.ts$/.test(f)).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)))) {
  const src = readFileSync(join(contentDir, file), 'utf8');
  for (const m of src.matchAll(/\{id:'(g(\d+)u(\d+)l(\d+))'/g)) lessons.push({ id: m[1], grade: Number(m[2]), unit: Number(m[3]) });
}
// Retos de unidad (minijuegos): id = <unidad>r, definidos en web/content/games.js.
const games = readFileSync(join(contentDir, 'games.js'), 'utf8');
let retos = 0;
for (const m of games.matchAll(/^\s*(g(\d+)u(\d+)): \{ game:/gm)) { lessons.push({ id: m[1] + 'r', grade: Number(m[2]), unit: Number(m[3]), reto: true }); retos++; }
writeFileSync(join(here, '../src/lessons.json'), JSON.stringify(lessons, null, 1) + '\n');
console.log(`${lessons.length - retos} lecciones y ${retos} retos exportados`);
