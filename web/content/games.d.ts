import type { Unit, Lesson } from './types';
export type UnitGame = { game: string; title: string; [k: string]: unknown };
export const UNIT_GAMES: Record<string, UnitGame>;
export function resolveUnitGame(unit: Unit, lessonById: Record<string, Lesson>): (UnitGame & { id: string }) | null;
