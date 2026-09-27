'use client';
import { useEffect, useRef } from 'react';
import type { GameResult } from '@/lib/games/index';

// Monta un minijuego (JavaScript puro) solo en el navegador.
export function GameHost({ spec, onFinish }: { spec: Record<string, unknown>; onFinish?: (r: GameResult) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const fin = useRef(onFinish);
  fin.current = onFinish;
  useEffect(() => {
    let dispose: (() => void) | null = null;
    let alive = true;
    import('@/lib/games/index.js').then(({ mountGame }) => {
      if (alive && ref.current) dispose = mountGame(ref.current, spec, (r: GameResult) => fin.current?.(r));
    });
    return () => { alive = false; try { dispose?.(); } catch { /* */ } if (ref.current) ref.current.innerHTML = ''; };
  }, [spec]);
  return <div ref={ref} />;
}
