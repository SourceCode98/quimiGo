import { ALL_LESSONS, LESSON_BY_ID } from '@/content';
import { lessonGames } from '@/content/lesson-games';
import { isDone, type Lessons } from './game';

// Orden dentro de cada lección: Aprende → Practica → Juega (todos sus minijuegos con el mínimo de estrellas) → Demuestra.
// La lección siguiente del módulo se abre al terminar Demuestra de la anterior, y el reto del módulo
// cuando todas sus lecciones terminaron Demuestra. El servidor aplica las mismas reglas.
export function prevInUnit(id: string) {
  const l = LESSON_BY_ID[id];
  return l && l.lessonIndex > 0 ? l.unit.lessons[l.lessonIndex - 1] : null;
}
export const lessonReady = (lessons: Lessons, id: string) => { const p = prevInUnit(id); return !p || isDone(lessons, p.id); };
export const retoReady = (lessons: Lessons, unitId: string) =>
  ALL_LESSONS.filter((l) => l.unit.id === unitId).every((l) => isDone(lessons, l.id));

/** Hasta qué sección puede llegar el estudiante: 1 Aprende, 2 Practica, 3 Juega, 4 Demuestra. */
export const passed = (lessons: Lessons, gameId: string, gameMin: number) => (lessons[gameId]?.stars ?? -1) >= gameMin;
export function stageOf(lessons: Lessons, id: string, gameMin = 2) {
  const r = lessons[id];
  if (!r?.learn) return 1;
  if (!r.act) return 2;
  const games = lessonGames(id);
  if (games.some((g) => !passed(lessons, g.id, gameMin))) return 3;
  return 4;
}
