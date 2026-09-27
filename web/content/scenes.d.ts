export type SceneStep = { t?: string; x?: string; [k: string]: unknown };
export type SceneSpec = { type: string; steps?: SceneStep[]; [k: string]: unknown };
export const LESSON_SCENES: Record<string, SceneSpec>;
