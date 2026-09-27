// Sección "Juega" de cada lección: dos minijuegos por lección (id = <lección>j1 y <lección>j2).
import { LESSON_GAMES_A } from './lesson-games-a.js';
import { LESSON_GAMES_B } from './lesson-games-b.js';

const ALL = { ...LESSON_GAMES_A, ...LESSON_GAMES_B };

/** Juegos de una lección con su id listo para guardar el avance. */
export function lessonGames(lessonId) {
  return (ALL[lessonId] || []).map((g, i) => ({ ...g, id: `${lessonId}j${i + 1}` }));
}
