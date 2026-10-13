export function mountScene(el: HTMLElement, spec: Record<string, unknown>): { step(i: number, patch?: Record<string, unknown>): void; dispose(): void };
