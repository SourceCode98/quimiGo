'use client';
import { useState } from 'react';
import type { QuizItem } from '@/content/types';

const html = (s: string) => ({ __html: s });
// Formatos de pregunta para que "Demuestra" no sea siempre igual (solo en modo misión):
// elige (opción múltiple), juzga (¿es correcta esta respuesta?) y descarta (elimina las incorrectas).
type Fmt = 'elige' | 'juzga' | 'descarta';
const FMTS: Fmt[] = ['elige', 'juzga', 'descarta'];
const FMT_LABEL: Record<Fmt, string> = { elige: 'Elige la respuesta', juzga: '¿Es correcta esta respuesta?', descarta: 'Descarta las incorrectas' };

// oneByOne: una pregunta por pantalla, como en las misiones (estilo Brilliant). seed rota los formatos entre lecciones.
export function Quiz({ items, onFinish, canRetry = true, oneByOne = false, seed = 0 }: { items: QuizItem[]; onFinish: (correct: number) => void; canRetry?: boolean; oneByOne?: boolean; seed?: number }) {
  const [round, setRound] = useState(0);
  const [at, setAt] = useState(0);
  const [ans, setAns] = useState<Record<number, boolean>>({});
  const total = Object.keys(ans).length;
  const correct = Object.values(ans).filter(Boolean).length;
  const fmt = (qi: number): Fmt => (oneByOne ? FMTS[(qi + seed) % FMTS.length] : 'elige');

  const answer = (qi: number, ok: boolean) => {
    if (qi in ans) return;
    const next = { ...ans, [qi]: ok };
    setAns(next);
    if (Object.keys(next).length === items.length) onFinish(Object.values(next).filter(Boolean).length);
  };

  return (
    <div key={round}>
      {oneByOne && <div className="mono quiz-count">Pregunta {at + 1} de {items.length}</div>}
      {items.map((q, qi) => {
        if (oneByOne && qi !== at) return null;
        const answered = qi in ans;
        const F = fmt(qi);
        return (
          <div className="qcard" key={qi}>
            {oneByOne && <span className="ms-fmt">{FMT_LABEL[F]}</span>}
            <p><b>{qi + 1}. </b><b dangerouslySetInnerHTML={html(q.q)} /></p>
            {F === 'elige' && <Elige q={q} done={answered} onAnswer={(ok) => answer(qi, ok)} />}
            {F === 'juzga' && <Juzga q={q} seed={qi + seed + round} done={answered} onAnswer={(ok) => answer(qi, ok)} />}
            {F === 'descarta' && <Descarta q={q} done={answered} onAnswer={(ok) => answer(qi, ok)} />}
            {answered && (
              <div className={'fb ' + (ans[qi] ? 'ok' : 'no')}>
                {ans[qi] ? 'Correcto. ' : <>No era así. La respuesta es <b dangerouslySetInnerHTML={html(q.o[q.a])} />. </>}<span dangerouslySetInnerHTML={html(q.e)} />
              </div>
            )}
            {oneByOne && answered && qi < items.length - 1 && (
              <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setAt(qi + 1)}>Siguiente pregunta →</button>
            )}
          </div>
        );
      })}
      {total === items.length && (!oneByOne || at === items.length - 1) && (
        <div className="result" style={{ marginTop: 14 }}>
          <span className="mono">Resultado</span>
          <span className="big">{'★'.repeat(correct)}{'☆'.repeat(3 - correct)}</span>
          <p>{correct === 3 ? '¡Perfecto! Dominas esta lección.' : correct === 2 ? 'Muy bien. Revisa la explicación de la que fallaste.' : (canRetry ? 'Vuelve a leer “Aprende” y repite el quiz para ganar más estrellas.' : 'Vuelve a leer “Aprende” y revisa las explicaciones.')}</p>
          {canRetry
            ? <button className="btn ghost" onClick={() => { setAns({}); setAt(0); setRound((r) => r + 1); }}>Repetir quiz</button>
            : <p className="muted">Ya no te quedan intentos para este quiz.</p>}
        </div>
      )}
    </div>
  );
}

type P = { q: QuizItem; done: boolean; onAnswer: (ok: boolean) => void };

function Elige({ q, done, onAnswer }: P) {
  const [chosen, setChosen] = useState<number | null>(null);
  return (
    <div className="opts">
      {q.o.map((o, oi) => (
        <button key={oi} className={'opt' + (done && oi === q.a ? ' right' : '') + (done && oi === chosen && oi !== q.a ? ' wrong' : '')}
          disabled={done} onClick={() => { setChosen(oi); onAnswer(oi === q.a); }}>
          <span className="k">{'ABCD'[oi]}</span><span dangerouslySetInnerHTML={html(o)} />
        </button>
      ))}
    </div>
  );
}

// Muestra una respuesta propuesta (la correcta o una incorrecta) y el estudiante decide si es correcta.
function Juzga({ q, seed, done, onAnswer }: P & { seed: number }) {
  const wrong = q.o.map((_, i) => i).filter((i) => i !== q.a);
  const shown = seed % 2 === 0 ? q.a : wrong[seed % wrong.length];
  const isRight = shown === q.a;
  const [said, setSaid] = useState<boolean | null>(null);
  return (
    <>
      <div className={'ms-proposal' + (done ? (isRight ? ' right' : ' wrong') : '')}><span className="mono">Respuesta propuesta</span><span dangerouslySetInnerHTML={html(q.o[shown])} /></div>
      <div className="ms-binrow">
        {[true, false].map((v) => (
          <button key={String(v)} className={'btn' + (said === v ? '' : ' ghost')} disabled={done} onClick={() => { setSaid(v); onAnswer(v === isRight); }}>
            {v ? 'Sí, es correcta' : 'No, es incorrecta'}
          </button>
        ))}
      </div>
    </>
  );
}

// Toca las opciones incorrectas para descartarlas. Si descartas la correcta, se acaba.
function Descarta({ q, done, onAnswer }: P) {
  const [out, setOut] = useState<number[]>([]);
  const [hit, setHit] = useState<number | null>(null);
  const left = q.o.length - 1 - out.length;
  const tap = (oi: number) => {
    if (done || out.includes(oi)) return;
    if (oi === q.a) { setHit(oi); onAnswer(false); return; }
    const next = [...out, oi];
    setOut(next);
    if (next.length === q.o.length - 1) onAnswer(true);
  };
  return (
    <>
      {!done && <span className="muted" style={{ fontSize: '.9rem' }}>Toca {left === 1 ? 'la incorrecta que queda' : `las ${left} incorrectas`} hasta que solo quede la correcta.</span>}
      {hit !== null && <span className="muted" style={{ fontSize: '.9rem' }}>Descartaste la respuesta correcta (en verde).</span>}
      <div className="opts">
        {q.o.map((o, oi) => (
          <button key={oi} className={'opt ms-elim' + (out.includes(oi) ? ' gone' : '') + (done && oi === q.a ? ' right' : '') }
            disabled={done || out.includes(oi)} onClick={() => tap(oi)} aria-label={out.includes(oi) ? 'Descartada' : undefined}>
            <span className="k">{out.includes(oi) ? '✕' : 'ABCD'[oi]}</span><span dangerouslySetInnerHTML={html(o)} />
          </button>
        ))}
      </div>
    </>
  );
}
