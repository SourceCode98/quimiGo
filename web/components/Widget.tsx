'use client';
import { useEffect, useRef } from 'react';
import type { Activity } from '@/content/types';

// Las actividades son JavaScript puro (three.js, SVG, DOM). Se cargan solo en el navegador.
export function Widget({ spec, onDone }: { spec: Activity; onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    let cleanup: (() => void) | null = null;
    let alive = true;
    import('@/lib/widgets.js').then(({ mountWidget }) => {
      if (alive && ref.current) cleanup = mountWidget(ref.current, spec, () => done.current());
    });
    return () => {
      alive = false;
      try { cleanup?.(); } catch { /* */ }
      if (ref.current) ref.current.innerHTML = '';
    };
  }, [spec]);
  return <div ref={ref} />;
}
