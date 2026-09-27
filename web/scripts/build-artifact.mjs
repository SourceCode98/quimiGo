// Empaqueta actividades, escenas, juegos, contenido extra y three.js en un solo archivo para la versión publicada,
// y une las hojas de estilo de web/styles en ql-extra.css.
import { build } from 'esbuild';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
const outDir = new URL(process.argv[2] || '../../../plataforma/', import.meta.url).pathname;
await build({
  entryPoints: [new URL('../lib/artifact-entry.js', import.meta.url).pathname],
  bundle: true, minify: true, format: 'iife', target: 'es2019', outfile: outDir + 'ql-bundle.js', legalComments: 'none', charset: 'ascii',
});
const stylesDir = new URL('../styles/', import.meta.url).pathname;
const css = readdirSync(stylesDir).filter((f) => f.endsWith('.css')).sort().map((f) => `/* ${f} */\n` + readFileSync(stylesDir + f, 'utf8')).join('\n');
writeFileSync(outDir + 'ql-extra.css', css);
console.log('ok', outDir);
