import { ALL_LESSONS, LESSON_BY_ID } from '@/content';
import type { Lessons } from './game';

// Orden dentro de cada módulo: una lección se abre cuando se terminó "Aprende" de la anterior del mismo módulo,
// y el reto del módulo cuando se terminó "Aprende" de todas sus lecciones. El servidor aplica la misma regla.
export function prevInUnit(id: string) {
  const l = LESSON_BY_ID[id];
  return l && l.lessonIndex > 0 ? l.unit.lessons[l.lessonIndex - 1] : null;
}
export const learned = (lessons: Lessons, id: string) => !!lessons[id]?.learn;
export const lessonReady = (lessons: Lessons, id: string) => { const p = prevInUnit(id); return !p || learned(lessons, p.id); };
export const retoReady = (lessons: Lessons, unitId: string) =>
  ALL_LESSONS.filter((l) => l.unit.id === unitId).every((l) => learned(lessons, l.id));
