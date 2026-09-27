'use client';
import { useEffect, useRef, useState } from 'react';
import type { LessonRef } from '@/content';
import { LESSON_SCENES } from '@/content/scenes';

const html = (s: string) => ({ __html: s });

// "Aprende" paso a paso: la escena (3D o animada) cambia con cada paso del texto.
export function Learn({ l, onSeenAll }: { l: LessonRef; onSeenAll: () => void }) {
  const spec = LESSON_SCENES[l.id] || { type: 'mol', mol: 'H2O', steps: [] };
  const steps = spec.steps || [];
  const n = Math.max(steps.length, l.body.length);
  const [cur, setCur] = useState(0);
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0]));
  const box = useRef<HTMLDivElement>(null);
  const scene = useRef<{ step(i: number): void; dispose(): void } | null>(null);
  const done = useRef(onSeenAll);
  done.current = onSeenAll;

  useEffect(() => {
    let alive = true;
    import('@/lib/scenes/index.js').then(({ mountScene }) => {
      if (alive && box.current) scene.current = mountScene(box.current, spec);
    });
    return () => { alive = false; scene.current?.dispose(); scene.current = null; if (box.current) box.current.innerHTML = ''; };
  }, [spec]);

  const go = (i: number) => {
    const k = Math.max(0, Math.min(n - 1, i));
    setCur(k);
    scene.current?.step(k);
    // Vuelve a mostrar la animación: en celular queda arriba del texto y se pierde al leer.
    const r = box.current?.getBoundingClientRect();
    if (r && (r.top < 0 || r.bottom > innerHeight)) box.current!.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    setSeen((s) => { if (s.has(k)) return s; const x = new Set(s); x.add(k); return x; });
  };

  // Avisa una sola vez cuando se vieron todos los pasos (también si la lección tiene un solo paso).
  const fired = useRef(false);
  useEffect(() => { if (!fired.current && seen.size >= n) { fired.current = true; done.current(); } }, [seen, n]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const a = document.activeElement?.tagName || '';
      if (/INPUT|TEXTAREA|SELECT/.test(a)) return;
      const r = document.getElementById('aprende')?.getBoundingClientRect();
      if (!r || r.bottom < 0 || r.top > innerHeight) return;
      if (e.key === 'ArrowRight') { go(cur + 1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { go(cur - 1); e.preventDefault(); }
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  });

  const st = steps[cur] || {};
  const text = (st.x as string) || l.body[cur] || '';
  return (
    <div className="learn">
      <div className="learn-scene" ref={box} />
      <div className="learn-card">
        <div className="step-count">
          <div className="dots">
            {Array.from({ length: n }, (_, i) => (
              <button key={i} className={seen.has(i) ? 'seen' : ''} aria-current={i === cur ? 'step' : undefined} aria-label={`Paso ${i + 1}`} onClick={() => go(i)}>{i + 1}</button>
            ))}
          </div>
          <span className="mono">Paso {cur + 1} de {n}</span>
        </div>
        <div className="step-text enter" key={cur} aria-live="polite">
          {st.t && <h3>{st.t as string}</h3>}
          <p dangerouslySetInnerHTML={html(text)} />
        </div>
        <div className="step-nav">
          <button className="btn ghost" disabled={cur === 0} onClick={() => go(cur - 1)}>← Anterior</button>
          <button className="btn" onClick={() => (cur === n - 1 ? document.getElementById('practica')?.scrollIntoView({ behavior: 'smooth' }) : go(cur + 1))}>
            {cur === n - 1 ? 'Ir a practicar →' : 'Siguiente →'}
          </button>
        </div>
        <div className="learn-extra">
          <div className="key"><span className="mono">Idea clave</span><p dangerouslySetInnerHTML={html(l.key)} /></div>
          {l.co && <div className="co"><span className="mono">En Colombia</span><p dangerouslySetInnerHTML={html(l.co)} /></div>}
        </div>
      </div>
    </div>
  );
}
