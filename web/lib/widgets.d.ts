import type { Activity } from '@/content/types';
export function mountWidget(el: HTMLElement, spec: Activity, done: () => void): (() => void) | null;
