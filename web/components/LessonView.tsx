'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ACT_NAME, ALL_LESSONS, LESSON_BY_ID } from '@/content';
import { useQL } from './Providers';
import { Quiz } from './Quiz';
import { gc } from './ui';
import { Widget } from './Widget';
import { Learn } from './Learn';

const html = (s: string) => ({ __html: s });

export function LessonView({ id }: { id: string }) {
  const { state, visit, record } = useQL();
  const l = LESSON_BY_ID[id];
  const g = l.grade;
  const idx = ALL_LESSONS.indexOf(l);
  const prev = ALL_LESSONS[idx - 1], next = ALL_LESSONS[idx + 1];
  const r = state.lessons[id] || { stars: null, act: false };
  const act = ACT_NAME[l.act.type] || '';
  const [learned, setLearned] = useState(false);

  useEffect(() => { visit(id, g.id); }, [id, g.id, visit]);

  return (
    <>
      <section className="lhead" style={gc(g.id)}>
        <span className="mono">Grado {g.n}° · Unidad {l.unitIndex + 1}: {l.unit.title} · Lección {l.lessonIndex + 1}</span>
        <h1>{l.title}</h1>
        <nav className="phases" aria-label="Momentos">
          <a href="#aprende" className={learned ? 'ok' : ''}>1 Aprende</a>
          <a href="#practica" className={r.act ? 'ok' : ''}>2 Practica</a>
          <a href="#demuestra" className={r.stars !== null && r.stars !== undefined ? 'ok' : ''}>3 Demuestra</a>
        </nav>
      </section>

      <section className="tbox teacher">
        <span className="mono">Guía docente</span>
        <dl>
          <dt>Estándar</dt><dd>{l.std}</dd>
          {l.dba && <><dt>DBA</dt><dd>{l.dba}</dd></>}
          <dt>Duración</dt><dd>{l.time} minutos</dd>
          <dt>Inicio</dt><dd>Lance la primera pregunta de “Demuestra” como pregunta detonante, sin dar la respuesta.</dd>
          <dt>Desarrollo</dt><dd>Lectura guiada de “Aprende” y actividad “{act}” en video beam o en parejas.</dd>
          <dt>Cierre</dt><dd>Quiz de 3 preguntas; vuelvan a la pregunta detonante.</dd>
          {l.tip && <><dt>Sugerencia</dt><dd dangerouslySetInnerHTML={html(l.tip)} /></>}
        </dl>
      </section>

      <section className="block" id="aprende">
        <div className="bhead"><span className="i">1</span><div><h2>Aprende</h2><span className="mono">Explora paso a paso · usa las flechas o toca Siguiente</span></div></div>
        <Learn key={id} l={l} onSeenAll={() => setLearned(true)} />
      </section>

      <section className={'block' + (r.act ? ' ok' : '')} id="practica">
        <div className="bhead"><span className="i">2</span><div><h2>Practica</h2><span className="mono">{act} · +20 XP</span></div></div>
        <Widget key={id} spec={l.act} onDone={() => { if (!r.act) record(id, { act: true }); }} />
      </section>

      <section className={'block' + (r.stars !== null && r.stars !== undefined ? ' ok' : '')} id="demuestra">
        <div className="bhead"><span className="i">3</span><div><h2>Demuestra</h2><span className="mono">3 preguntas · 10 XP por acierto</span></div></div>
        <Quiz key={id} items={l.quiz} onFinish={(n) => record(id, { stars: n })} />
      </section>

      <div className="nav">
        {prev ? <Link className="btn ghost" href={`/leccion/${prev.id}`}>← {prev.title}</Link> : <span />}
        {next && <Link className="btn" href={`/leccion/${next.id}`}>Siguiente: {next.title} →</Link>}
      </div>
    </>
  );
}
