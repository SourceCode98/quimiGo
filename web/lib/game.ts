import { ALL_LESSONS, type LessonRef } from '@/content';

export type Rec = { stars: number | null; act: boolean };
export type Lessons = Record<string, Rec>;

export const LEVELS = ['Aprendiz', 'Curioso', 'Observador', 'Experimentador', 'Laboratorista', 'Analista', 'Investigador', 'Científico', 'Premio Nobel'];
export const STEP = 150;
export const levelOf = (xp: number) => {
  const i = Math.floor(xp / STEP);
  return { n: i + 1, name: LEVELS[Math.min(i, LEVELS.length - 1)], pct: ((xp % STEP) / STEP) * 100 };
};

export const BADGES = [
  { id: 'primera', ic: '1', t: 'Primer paso', d: 'Completa tu primera lección' },
  { id: 'unidad', ic: 'U', t: 'Unidad lista', d: 'Termina todas las lecciones de una unidad' },
  { id: 'grado', ic: 'G', t: 'Grado completo', d: 'Termina todas las lecciones de un grado' },
  { id: 'estrellas', ic: '★', t: 'Constelación', d: 'Consigue 3 estrellas en 10 lecciones' },
  { id: 'lab', ic: '⚗', t: 'Laboratorista', d: 'Completa 10 actividades interactivas' },
  { id: 'constancia', ic: '3d', t: 'Constancia', d: 'Estudia en 3 días distintos' },
  { id: 'viajero', ic: '↔', t: 'Viajero', d: 'Abre lecciones de 3 grados distintos' },
  { id: 'mil', ic: '1k', t: 'Mil XP', d: 'Llega a 1.000 XP' },
  { id: 'jugador', ic: '▶', t: 'Jugador', d: 'Supera 5 retos de unidad' },
  { id: 'campeon', ic: '♛', t: 'Campeón', d: 'Consigue 3 estrellas en 10 retos' },
];

export const isDone = (lessons: Lessons, id: string) => {
  const r = lessons[id];
  return !!r && r.stars !== null && r.stars !== undefined;
};

// Las insignias se calculan a partir del progreso, así nunca se desincronizan con el servidor.
export function earnedBadges(s: { xp: number; lessons: Lessons; days: string[]; grades: string[] }): Set<string> {
  const out = new Set<string>();
  const done = (l: LessonRef) => isDone(s.lessons, l.id);
  const recs = Object.values(s.lessons);
  if (ALL_LESSONS.some(done)) out.add('primera');
  const byUnit = new Map<string, LessonRef[]>();
  const byGrade = new Map<string, LessonRef[]>();
  for (const l of ALL_LESSONS) {
    byUnit.set(l.unit.id, [...(byUnit.get(l.unit.id) || []), l]);
    byGrade.set(l.grade.id, [...(byGrade.get(l.grade.id) || []), l]);
  }
  if ([...byUnit.values()].some((ls) => ls.every(done))) out.add('unidad');
  if ([...byGrade.values()].some((ls) => ls.every(done))) out.add('grado');
  if (recs.filter((r) => r.stars === 3).length >= 10) out.add('estrellas');
  if (recs.filter((r) => r.act).length >= 10) out.add('lab');
  if (new Set(s.days).size >= 3) out.add('constancia');
  if (new Set(s.grades).size >= 3) out.add('viajero');
  if (s.xp >= 1000) out.add('mil');
  const retos = Object.entries(s.lessons).filter(([k]) => /r$/.test(k)).map(([, r]) => r);
  if (retos.filter((r) => r.stars !== null && r.stars !== undefined).length >= 5) out.add('jugador');
  if (retos.filter((r) => r.stars === 3).length >= 10) out.add('campeon');
  return out;
}

// Mismas reglas que el servidor (api/src/game.js): +20 por la actividad y +10 por cada estrella nueva.
export function applyResult(prev: Rec | undefined, input: { act?: boolean; stars?: number }) {
  const before: Rec = prev || { stars: null, act: false };
  const next: Rec = { ...before };
  let gained = 0;
  if (input.act && !before.act) { next.act = true; gained += 20; }
  if (input.stars !== undefined) {
    const best = before.stars ?? 0;
    if (input.stars > best) gained += (input.stars - best) * 10;
    next.stars = Math.max(before.stars ?? 0, input.stars);
  }
  return { next, gained };
}

export const todayBogota = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
