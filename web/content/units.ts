import { GRADES, LESSON_BY_ID, type LessonRef } from './index';
import type { Grade, Unit } from './types';
import { resolveUnitGame, UNIT_GAMES } from './games';

export type UnitRef = Unit & { grade: Grade; index: number };
export const ALL_UNITS: UnitRef[] = GRADES.flatMap((grade) => grade.units.map((u, index) => ({ ...u, grade, index })));
export const UNIT_BY_ID: Record<string, UnitRef> = Object.fromEntries(ALL_UNITS.map((u) => [u.id, u]));
export const RETO_IDS = ALL_UNITS.filter((u) => UNIT_GAMES[u.id]).map((u) => u.id + 'r');
export const unitGame = (u: Unit) => resolveUnitGame(u, LESSON_BY_ID as Record<string, LessonRef>);
