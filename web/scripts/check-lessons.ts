// Revisión de contenido: pasos de Aprende vs. escena, pregunta de control, reto Explora y estructura de juegos.
// Uso: cd web && npx tsx scripts/check-lessons.ts [prefijo-de-grado, ej. g7]
import { EXPLORE } from '../content/explore';
import { CHECKS } from '../content/checks';
import { ALL_LESSONS } from '../content';
import { LESSON_SCENES } from '../content/scenes.js';
const only = process.argv[2] || '';
let bad = 0;
const say = (...a: unknown[]) => { console.log(...a); bad++; };
for (const l of ALL_LESSONS) {
  if (!l.id.startsWith(only)) continue;
  const sc: any = (LESSON_SCENES as any)[l.id];
  const steps = sc?.steps || [];
  const n = Math.max(steps.length, l.body.length);
  if (steps.length !== l.body.length) say(l.id, `escena con ${steps.length} pasos pero Aprende tiene ${l.body.length} párrafos`);
  l.body.forEach((p, i) => { const w = p.replace(/<[^>]+>/g, '').split(/\s+/).length; if (w > 60) say(l.id, `paso ${i + 1} tiene ${w} palabras (máx. 60)`); });
  const ck = CHECKS[l.id];
  if (!ck) say(l.id, 'sin pregunta de control'); else if (ck.at >= n - 1) say(l.id, `check.at ${ck.at} debe ser < ${n - 1}`);
  if (l.quiz.length !== 3) say(l.id, 'el quiz debe tener 3 preguntas');
  const ex = EXPLORE[l.id];
  if (!ex) { say(l.id, 'sin Explora'); continue; }
  if ((ex.at ?? n - 1) > n - 1) say(l.id, `explore.at ${ex.at} fuera de rango`);
  const dims = ex.ctl.map((c: any) => 'opts' in c ? c.opts.map((_: any, i: number) => i) : Array.from({ length: Math.round((c.max - c.min) / c.step) + 1 }, (_, k) => +(c.min + k * c.step).toFixed(6)));
  let combos: any[] = [{}];
  ex.ctl.forEach((c, i) => { combos = combos.flatMap((o) => dims[i].map((x: number) => ({ ...o, [c.id]: x }))); });
  for (const v of combos) { try { ex.scene(v); ex.read?.(v); } catch (e: any) { say(l.id, 'Explora lanza error', e.message); break; } }
  ex.tasks.forEach((t, i) => { if (!combos.some((v) => t.ok(v))) say(l.id, `reto ${i + 1} imposible`); });
}
console.log(bad ? `${bad} problemas` : 'todo bien');
