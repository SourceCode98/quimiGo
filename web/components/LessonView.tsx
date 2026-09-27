'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ACT_NAME, ALL_LESSONS, LESSON_BY_ID } from '@/content';
import { useQL } from './Providers';
import { Quiz } from './Quiz';
import { gc } from './ui';
import { Widget } from './Widget';
import { Learn } from './Learn';
import { Locked } from './Locked';
import { NoTries, useTriesLabel } from './Tries';
import { GameHost } from './GameHost';
import { lessonGames } from '@/content/lesson-games';
import { GAME_NAME } from '@/content/game-names';
import { prevInUnit, stageOf } from '@/lib/order';
import { isDone } from '@/lib/game';

const html = (s: string) => ({ __html: s });

export function LessonView({ id }: { id: string }) {
  const { state, visit, record, canOpen, lessonOpen, ready, triesLeft, toast, user } = useQL();
  const l = LESSON_BY_ID[id];
  const g = l.grade;
  const idx = ALL_LESSONS.indexOf(l);
  const prev = ALL_LESSONS[idx - 1], next = ALL_LESSONS[idx + 1];
  const r = state.lessons[id] || { stars: null, act: false };
  const act = ACT_NAME[l.act.type] || '';
  const games = useMemo(() => lessonGames(id), [id]);
  const [gi, setGi] = useState(0);
  const [quizPlayed, setQuizPlayed] = useState(false);
  const quizLabel = useTriesLabel(id);
  const gameLabel = useTriesLabel(games[gi]?.id || id + 'j1');
  const open = canOpen(l.unit.id) && lessonOpen(id);
  const before = prevInUnit(id);
  const nextSameUnit = next && next.unit.id === l.unit.id;
  // Secciones en orden para el estudiante: 1 Aprende, 2 Practica, 3 Juega, 4 Demuestra. El docente ve todo.
  const student = user?.role === 'student';
  const stage = student ? stageOf(state.lessons, id) : 4;
  const quizDone = isDone(state.lessons, id);
  const learnDone = !!r.learn;
  const onSeenAll = () => { if (!r.learn) record(id, { learn: true }); };
  const played = games.filter((x) => state.lessons[x.id]?.stars != null).length;
  // Avisa al estudiante cada vez que desbloquea una sección o la lección siguiente.
  const seen = useRef({ id, stage, quizDone });
  useEffect(() => {
    const was = seen.current;
    seen.current = { id, stage, quizDone };
    if (!student || was.id !== id) return;
    if (!was.quizDone && quizDone) toast(nextSameUnit ? `Desbloqueaste la siguiente lección: ${next.title}` : '¡Terminaste la lección!');
    else if (stage > was.stage) toast(`Desbloqueaste “${['', 'Aprende', 'Practica', 'Juega', 'Demuestra'][stage]}”`);
  }, [id, stage, quizDone, student, nextSameUnit, next, toast]);
  const lockedMsg = (need: string) => <div className="sec-locked"><span aria-hidden>🔒</span> Completa “{need}” para desbloquear esta sección.</div>;

  useEffect(() => { if (open) visit(id, g.id); }, [id, g.id, visit, open]);
  useEffect(() => { setGi(0); setQuizPlayed(false); }, [id]);

  if (!ready) return <p className="muted">Cargando…</p>;
  if (!canOpen(l.unit.id)) return <Locked what={`El módulo “${l.unit.title}”`} gradeN={g.n} />;
  if (!open && before) return (
    <section className="locked-card">
      <span className="lock-ic" aria-hidden>🔒</span>
      <h1>Primero termina la lección anterior</h1>
      <p>Las lecciones van en orden. Completa <b>{before.title}</b> hasta “Demuestra” y esta lección se abrirá.</p>
      <Link className="btn" href={`/leccion/${before.id}`}>Ir a {before.title}</Link>
    </section>
  );

  return (
    <>
      <section className="lhead" style={gc(g.id)}>
        <span className="mono">Grado {g.n}° · Unidad {l.unitIndex + 1}: {l.unit.title} · Lección {l.lessonIndex + 1}</span>
        <h1>{l.title}</h1>
        <nav className="phases" aria-label="Momentos">
          <a href="#aprende" className={learnDone ? 'ok' : ''}>1 Aprende</a>
          <a href="#practica" className={r.act ? 'ok' : stage < 2 ? 'locked' : ''}>{stage < 2 && '🔒 '}2 Practica</a>
          {games.length > 0 && <a href="#juega" className={played === games.length ? 'ok' : stage < 3 ? 'locked' : ''}>{stage < 3 && '🔒 '}3 Juega</a>}
          <a href="#demuestra" className={quizDone ? 'ok' : stage < 4 ? 'locked' : ''}>{stage < 4 && '🔒 '}{games.length > 0 ? 4 : 3} Demuestra</a>
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
        <div className="bhead"><span className="i">1</span><div><h2>Aprende</h2><span className="mono">{learnDone ? 'Completado · puedes repasar cuando quieras' : 'Revisa todos los pasos para desbloquear “Practica”'}</span></div></div>
        <Learn key={id} l={l} onSeenAll={onSeenAll} />
      </section>

      <section className={'block' + (r.act ? ' ok' : '')} id="practica">
        <div className="bhead"><span className="i">2</span><div><h2>Practica</h2><span className="mono">{act} · +20 XP</span></div></div>
        {stage < 2 ? lockedMsg('Aprende') : <Widget key={id} spec={l.act} onDone={() => { if (!r.act) record(id, { act: true }); }} />}
      </section>

      {games.length > 0 && (
        <section className={'block' + (played === games.length ? ' ok' : '')} id="juega">
          <div className="bhead"><span className="i">3</span><div><h2>Juega</h2><span className="mono">{games.length} minijuegos · +20 XP y hasta 3 estrellas cada uno</span></div></div>
          {stage < 3 ? lockedMsg('Practica') : <>
          <div className="juega-tabs" role="group" aria-label="Minijuegos de la lección">
              {games.map((x, i) => (
                <button key={x.id} aria-pressed={gi === i} onClick={() => setGi(i)}>
                  <b>{x.title}</b><small>{GAME_NAME[x.game] || 'Minijuego'} · {state.lessons[x.id]?.stars != null ? '★'.repeat(state.lessons[x.id]!.stars!) + '☆'.repeat(3 - state.lessons[x.id]!.stars!) : 'Sin jugar'}</small>
                </button>
              ))}
            </div>
            {gameLabel && <span className="mono">{gameLabel}</span>}
            {triesLeft(games[gi].id).left <= 0
              ? <NoTries id={games[gi].id} what={`“${games[gi].title}”`} />
              : <GameHost key={games[gi].id} spec={games[gi]} onFinish={(res) => record(games[gi].id, { act: true, stars: Math.max(0, Math.min(3, res.stars | 0)) })} />}
          </>}
        </section>
      )}

      <section className={'block' + (r.stars !== null && r.stars !== undefined ? ' ok' : '')} id="demuestra">
        <div className="bhead"><span className="i">{games.length > 0 ? 4 : 3}</span><div><h2>Demuestra</h2><span className="mono">3 preguntas · 10 XP por acierto{quizLabel ? ` · ${quizLabel}` : ''}</span></div></div>
        {stage < 4 ? lockedMsg(games.length ? 'Juega: los dos minijuegos' : 'Practica')
          : triesLeft(id).left <= 0 && !quizPlayed
          ? <NoTries id={id} what="este quiz" />
          : <Quiz key={id} items={l.quiz} canRetry={triesLeft(id).left > 0} onFinish={(n) => { setQuizPlayed(true); record(id, { stars: n }); }} />}
      </section>

      <div className="nav">
        {prev ? <Link className="btn ghost" href={`/leccion/${prev.id}`}>← {prev.title}</Link> : <span />}
        {next && (lessonOpen(next.id) || !nextSameUnit
          ? <Link className="btn" href={`/leccion/${next.id}`}>Siguiente: {next.title} →</Link>
          : <a className="btn is-locked" href="#demuestra" title="Completa todas las secciones de esta lección">🔒 Termina “Demuestra” para seguir</a>)}
      </div>
    </>
  );
}
