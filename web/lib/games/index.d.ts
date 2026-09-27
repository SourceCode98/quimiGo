export type GameResult = { score: number; stars: number; detail?: unknown };
export function mountGame(el: HTMLElement, spec: Record<string, unknown>, finish: (r: GameResult) => void): () => void;
export const GAME_INFO: Record<string, { name: string; ic: string }>;
