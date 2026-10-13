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
import { passed, prevInUnit, stageOf } from '@/lib/order';
import { isDone } from '@/lib/game';

const html = (s: string) => ({ __html: s });
const stars = (k: number) => '★'.repeat(k) + '☆'.repeat(3 - k);
const SECTION = ['', 'Aprende', 'Practica', 'Juega', 'Demuestra'];

// Cada lección es una misión: una pantalla a la vez, como en Brilliant.
// ¿Qué crees? → Aprende (pasos con escena) → Idea clave → Practica → Juega → Demuestra → Misión cumplida.
// Las secciones conservan su orden (stageOf); el docente puede saltar a cualquier pantalla.
type Screen = { k: 'hook' | 'learn' | 'key' | 'act' | 'game' | 'quiz' | 'end'; sec: number; gi?: number; label: string };

export function LessonView({ id }: { id: string }) {
  const { state, visit, record, canOpen, lessonOpen, ready, triesLeft, toast, user } = useQL();
  const l = LESSON_BY_ID[id];
  const g = l.grade;
  const idx = ALL_LESSONS.indexOf(l);
  const next = ALL_LESSONS[idx + 1];
  const r = state.lessons[id] || { stars: null, act: false };
  const act = ACT_NAME[l.act.type] || '';
  const games = useMemo(() => lessonGames(id), [id]);
  const [quizPlayed, setQuizPlayed] = useState(false);
  const [guess, setGuess] = useState<number | null>(null);
  const [learnSeen, setLearnSeen] = useState(false);
  const quizLabel = useTriesLabel(id);
  const open = canOpen(l.unit.id) && lessonOpen(id);
  const before = prevInUnit(id);
  const nextSameUnit = next && next.unit.id === l.unit.id;
  const student = user?.role === 'student';
  // Estrellas mínimas que el docente pide en cada minijuego de "Juega" (2 por defecto).
  const gameMin = user?.role === 'student' ? user.limits?.gameMin ?? 2 : 2;
  const stage = student ? stageOf(state.lessons, id, gameMin) : 4;
  const quizDone = isDone(state.lessons, id);
  const learnDone = !!r.learn || learnSeen;
  const onSeenAll = () => { setLearnSeen(true); if (!r.learn) record(id, { learn: true }); };
  const hook = l.quiz[0];

  const screens = useMemo<Screen[]>(() => [
    ...(hook ? [{ k: 'hook', sec: 1, label: '¿Qué crees?' } as Screen] : []),
    { k: 'learn', sec: 1, label: 'Aprende' },
    { k: 'key', sec: 1, label: 'Idea clave' },
    { k: 'act', sec: 2, label: act || 'Practica' },
    ...games.map((x, i) => ({ k: 'game', sec: 3, gi: i, label: x.title }) as Screen),
    { k: 'quiz', sec: 4, label: 'Demuestra' },
    { k: 'end', sec: 5, label: 'Misión cumplida' },
  ], [hook, act, games]);

  // ¿Se puede entrar a esta pantalla? (el docente entra a todas)
  const canEnter = (s: Screen) => {
    if (!student) return true;
    if (s.k === 'hook') return true;
    if (s.k === 'learn') return guess !== null || learnDone;
    if (s.k === 'key') return learnDone;
    if (s.k === 'end') return quizDone;
    return stage >= s.sec;
  };
  // ¿Ya cumplió lo que pide esta pantalla para seguir?
  const complete = (s: Screen) => {
    if (s.k === 'hook') return guess !== null || learnDone;
    if (s.k === 'learn') return learnDone;
    if (s.k === 'act') return !!r.act;
    if (s.k === 'game') return passed(state.lessons, games[s.gi!].id, gameMin);
    if (s.k === 'quiz') return quizDone;
    return true;
  };
  const need = (s: Screen) => ({
    hook: 'Elige una respuesta para continuar',
    learn: 'Revisa todos los pasos para continuar',
    act: 'Completa la actividad para continuar',
    game: `Consigue al menos ${gameMin} ${gameMin === 1 ? 'estrella' : 'estrellas'} para continuar`,
    quiz: 'Responde las preguntas para terminar',
    key: '', end: '',
  })[s.k];

  // Al abrir, retoma donde quedó: la primera pantalla sin completar.
  const resumeAt = () => {
    if (!student) return 0;
    const i = screens.findIndex((s) => !complete(s));
    return i < 0 ? screens.length - 1 : Math.max(0, i);
  };
  const [cur, setCur] = useState(0);
  const started = useRef<string | null>(null);
  useEffect(() => {
    if (!ready || started.current === id) return;
    started.current = id;
    setCur(r.learn ? resumeAt() : 0);
    setGuess(null); setLearnSeen(false); setQuizPlayed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, ready]);

  const top = useRef<HTMLDivElement>(null);
  const goTo = (i: number) => {
    if (i < 0 || i >= screens.length || !canEnter(screens[i])) return;
    setCur(i);
    const t = top.current?.getBoundingClientRect();
    if (t && t.top < 0) top.current!.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  };

  // Avisa al estudiante cada vez que desbloquea una sección o la lección siguiente.
  const seen = useRef({ id, stage, quizDone });
  useEffect(() => {
    const was = seen.current;
    seen.current = { id, stage, quizDone };
    if (!student || was.id !== id) return;
    if (!was.quizDone && quizDone) toast(nextSameUnit ? `Desbloqueaste la siguiente misión: ${next.title}` : '¡Misión cumplida!');
    else if (stage > was.stage) toast(`Desbloqueaste “${SECTION[stage]}”`);
  }, [id, stage, quizDone, student, nextSameUnit, next, toast]);

  useEffect(() => { if (open) visit(id, g.id); }, [id, g.id, visit, open]);

  if (!ready) return <p className="muted">Cargando…</p>;
  if (!canOpen(l.unit.id)) return <Locked what={`El módulo “${l.unit.title}”`} gradeN={g.n} />;
  if (!open && before) return (
    <section className="locked-card">
      <span className="lock-ic" aria-hidden>🔒</span>
      <h1>Primero termina la misión anterior</h1>
      <p>Las misiones del módulo se abren una tras otra. Completa <b>{before.title}</b> y esta se abrirá.</p>
      <Link className="btn" href={`/leccion/${before.id}`}>Ir a {before.title}</Link>
    </section>
  );

  const s = screens[Math.min(cur, screens.length - 1)];
  const nextS = screens[cur + 1];
  const ok = complete(s);
  const game = s.k === 'game' ? games[s.gi!] : null;

  const body = () => {
    switch (s.k) {
      case 'hook': return (
        <div className="ms-hook">
          <span className="mono">Antes de empezar, ¿qué crees?</span>
          <h2 dangerouslySetInnerHTML={html(hook.q)} />
          <p className="muted">No pasa nada si no sabes. Elige lo que te parezca; al final de “Aprende” verás si acertaste.</p>
          <div className="opts">
            {hook.o.map((o, oi) => (
              <button key={oi} className={'opt' + (guess === oi ? ' picked' : '')} aria-pressed={guess === oi} onClick={() => setGuess(oi)}>
                <span className="k">{'ABCD'[oi]}</span><span dangerouslySetInnerHTML={html(o)} />
              </button>
            ))}
          </div>
        </div>
      );
      case 'learn': return (
        <div id="aprende">
          <Learn key={id} l={l} extras={false} onSeenAll={onSeenAll} onNext={() => { if (learnDone || !student) goTo(cur + 1); }} />
          {!learnDone && student && <p className="ms-need">Revisa todos los pasos (los puntos numerados) para seguir.</p>}
        </div>
      );
      case 'key': return (
        <div className="ms-key">
          {hook && (
            <div className={'fb ' + (guess === null ? 'info' : guess === hook.a ? 'ok' : 'info')}>
              <b>{guess === null ? 'La pregunta del inicio: ' : guess === hook.a ? '¡Acertaste tu predicción! ' : 'Tu predicción no era la correcta, y está bien: ahora ya sabes por qué. '}</b>
              <span dangerouslySetInnerHTML={html(hook.q)} /> <b dangerouslySetInnerHTML={html(hook.o[hook.a])} />. <span dangerouslySetInnerHTML={html(hook.e)} />
            </div>
          )}
          <div className="key"><span className="mono">Idea clave</span><p dangerouslySetInnerHTML={html(l.key)} /></div>
          {l.co && <div className="co"><span className="mono">En Colombia</span><p dangerouslySetInnerHTML={html(l.co)} /></div>}
        </div>
      );
      case 'act': return <Widget key={id} spec={l.act} onDone={() => { if (!r.act) record(id, { act: true }); }} />;
      case 'game': return <GameScreen key={game!.id} game={game!} gameMin={gameMin} />;
      case 'quiz': return (
        <>
          {quizLabel && <span className="mono">{quizLabel}</span>}
          {triesLeft(id).left <= 0 && !quizPlayed
            ? <NoTries id={id} what="este quiz" />
            : <Quiz key={id} oneByOne items={l.quiz} canRetry={triesLeft(id).left > 0} onFinish={(n) => { setQuizPlayed(true); record(id, { stars: n }); }} />}
        </>
      );
      case 'end': return (
        <div className="ms-end">
          <span className="ms-medal" aria-hidden>★</span>
          <h2>¡Misión cumplida!</h2>
          <p>Demuestra: <b className="stars-big">{stars(r.stars ?? 0)}</b></p>
          {games.length > 0 && <ul className="ms-sum">{games.map((x) => <li key={x.id}>{x.title}: <b>{stars(state.lessons[x.id]?.stars ?? 0)}</b></li>)}</ul>}
          <div className="key"><span className="mono">Lo que aprendiste</span><p dangerouslySetInnerHTML={html(l.key)} /></div>
          <div className="row">
            {next && nextSameUnit && lessonOpen(next.id) && <Link className="btn" href={`/leccion/${next.id}`}>Siguiente misión: {next.title} →</Link>}
            <Link className={'btn' + (next && nextSameUnit && lessonOpen(next.id) ? ' ghost' : '')} href={`/grado/${g.n}#${l.unit.id}`}>Volver al mapa</Link>
            <button className="btn ghost" onClick={() => goTo(0)}>Repasar desde el inicio</button>
          </div>
        </div>
      );
    }
  };

  return (
    <>
      <section className="lhead ms-head" style={gc(g.id)} ref={top}>
        <div className="ms-top">
          <Link className="ms-back" href={`/grado/${g.n}#${l.unit.id}`}>← Mapa</Link>
          <span className="mono">Grado {g.n}° · {l.unit.title} · Misión {l.lessonIndex + 1} de {l.unit.lessons.length}</span>
        </div>
        <h1>{l.title}</h1>
        <nav className="ms-bar" aria-label="Pantallas de la misión">
          {screens.map((x, i) => (
            <button key={i} className={`sec${Math.min(x.sec, 4)}` + ((x.k === 'end' ? quizDone : complete(x) && i < cur) ? ' done' : '') + (i === cur ? ' cur' : '')}
              disabled={!canEnter(x)} aria-current={i === cur ? 'step' : undefined} aria-label={`${x.label}${canEnter(x) ? '' : ' (bloqueado)'}`} title={x.label}
              onClick={() => goTo(i)} />
          ))}
        </nav>
        <div className="ms-secs" aria-hidden>
          {[1, 2, ...(games.length ? [3] : []), 4].map((k) => <span key={k} className={s.sec === k ? 'on' : stage > k || quizDone ? 'ok' : ''}>{SECTION[k]}</span>)}
        </div>
      </section>

      <section className="tbox teacher">
        <span className="mono">Guía docente</span>
        <dl>
          <dt>Estándar</dt><dd>{l.std}</dd>
          {l.dba && <><dt>DBA</dt><dd>{l.dba}</dd></>}
          <dt>Duración</dt><dd>{l.time} minutos</dd>
          <dt>Inicio</dt><dd>La misión abre con “¿Qué crees?”: úsela como pregunta detonante con todo el curso antes de mostrar la respuesta.</dd>
          <dt>Desarrollo</dt><dd>Pasos de “Aprende” en video beam y actividad “{act}” en parejas.</dd>
          <dt>Cierre</dt><dd>Quiz de 3 preguntas; vuelvan a la pregunta detonante.</dd>
          {l.tip && <><dt>Sugerencia</dt><dd dangerouslySetInnerHTML={html(l.tip)} /></>}
        </dl>
      </section>

      <section className={'block ms-card' + (s.k === 'learn' ? ' wide' : '')} key={cur} aria-live="polite">
        {s.k !== 'hook' && s.k !== 'end' && (
          <div className="bhead"><span className="i">{s.sec}</span><div><h2>{s.k === 'key' ? 'Idea clave' : s.k === 'game' ? game!.title : SECTION[s.sec]}</h2>
            <span className="mono">{s.k === 'act' ? `${act} · +20 XP` : s.k === 'game' ? `${GAME_NAME[game!.game] || 'Minijuego'} · +20 XP y hasta 3 estrellas` : s.k === 'quiz' ? '3 preguntas · 10 XP por acierto' : s.k === 'learn' ? 'Paso a paso con la escena' : 'Lo esencial en una frase'}</span></div></div>
        )}
        {body()}
      </section>

      {s.k !== 'end' && (
        <div className="ms-nav">
          <button className="btn ghost" disabled={cur === 0} onClick={() => goTo(cur - 1)}>← Atrás</button>
          {!ok && student && s.k !== 'learn' && need(s) && <span className="ms-need">{need(s)}</span>}
          {s.k !== 'learn' && nextS && (
            <button className="btn" disabled={!canEnter(nextS) || (student && !ok)} onClick={() => goTo(cur + 1)}>
              {nextS.k === 'end' ? 'Terminar misión ★' : 'Continuar →'}
            </button>
          )}
        </div>
      )}
    </>
  );
}

function GameScreen({ game, gameMin }: { game: ReturnType<typeof lessonGames>[number]; gameMin: number }) {
  const { state, record, triesLeft } = useQL();
  const label = useTriesLabel(game.id);
  const st = state.lessons[game.id]?.stars;
  return (
    <>
      <span className="mono">{label}{label ? ' · ' : ''}{st != null ? `Mejor resultado ${stars(st)}${passed(state.lessons, game.id, gameMin) ? ' · Superado' : ''}` : `Necesitas ${gameMin}★`}</span>
      {triesLeft(game.id).left <= 0
        ? <NoTries id={game.id} what={`“${game.title}”`} />
        : <GameHost spec={game} onFinish={(res) => record(game.id, { act: true, stars: Math.max(0, Math.min(3, res.stars | 0)) })} />}
    </>
  );
}
