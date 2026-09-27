export type QuizItem = { q: string; o: string[]; a: number; e: string };
// La especificación de cada actividad depende de su tipo (ver lib/widgets.js).
export type Activity = { type: string; [key: string]: unknown };
export type Lesson = {
  id: string; title: string; time: number; std: string; dba: string;
  body: string[]; key: string; co: string; act: Activity; quiz: QuizItem[]; tip?: string;
};
export type Unit = { id: string; title: string; desc: string; lessons: Lesson[] };
export type Grade = { id: string; n: number; title: string; desc: string; units: Unit[] };
