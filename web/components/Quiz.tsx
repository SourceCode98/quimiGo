'use client';
import { useState } from 'react';
import type { QuizItem } from '@/content/types';

// oneByOne: una pregunta por pantalla, como en las misiones (estilo Brilliant).
export function Quiz({ items, onFinish, canRetry = true, oneByOne = false }: { items: QuizItem[]; onFinish: (correct: number) => void; canRetry?: boolean; oneByOne?: boolean }) {
  const [round, setRound] = useState(0);
  const [at, setAt] = useState(0);
  const [ans, setAns] = useState<Record<number, number>>({});
  const total = Object.keys(ans).length;
  const correct = Object.entries(ans).filter(([qi, oi]) => items[+qi].a === oi).length;

  const pick = (qi: number, oi: number) => {
    if (qi in ans) return;
    const next = { ...ans, [qi]: oi };
    setAns(next);
    if (Object.keys(next).length === items.length) onFinish(Object.entries(next).filter(([q, o]) => items[+q].a === o).length);
  };

  return (
    <div key={round}>
      {oneByOne && <div className="mono quiz-count">Pregunta {at + 1} de {items.length}</div>}
      {items.map((q, qi) => {
        if (oneByOne && qi !== at) return null;
        const chosen = ans[qi];
        const answered = chosen !== undefined;
        return (
          <div className="qcard" key={qi}>
            <p><b>{qi + 1}. </b><b dangerouslySetInnerHTML={{ __html: q.q }} /></p>
            <div className="opts">
              {q.o.map((o, oi) => (
                <button key={oi} className={'opt' + (answered && oi === q.a ? ' right' : '') + (answered && oi === chosen && oi !== q.a ? ' wrong' : '')}
                  disabled={answered} onClick={() => pick(qi, oi)}>
                  <span className="k">{'ABCD'[oi]}</span><span dangerouslySetInnerHTML={{ __html: o }} />
                </button>
              ))}
            </div>
            {answered && (
              <div className={'fb ' + (chosen === q.a ? 'ok' : 'no')}>
                {chosen === q.a ? 'Correcto. ' : 'No es esa. '}<span dangerouslySetInnerHTML={{ __html: q.e }} />
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
