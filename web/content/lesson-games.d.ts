export type LessonGameSpec = { id: string; game: string; title: string; [key: string]: unknown };
export function lessonGames(lessonId: string): LessonGameSpec[];
