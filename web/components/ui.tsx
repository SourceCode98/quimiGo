import type { CSSProperties } from 'react';
export const gc = (gradeId: string) => ({ ['--gc']: `var(--${gradeId})` }) as CSSProperties;
export function Stars({ n }: { n: number | null | undefined }) {
  if (n === null || n === undefined) return <span className="stars">☆☆☆</span>;
  return <span className="stars" aria-label={`${n} de 3 estrellas`}><b>{'★'.repeat(n)}</b>{'☆'.repeat(3 - n)}</span>;
}
