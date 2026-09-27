'use client';
import { useState } from 'react';
import type { QuizItem } from '@/content/types';

export function Quiz({ items, onFinish, canRetry = true }: { items: QuizItem[]; onFinish: (correct: number) => void; canRetry?: boolean }) {
  const [round, setRound] = useState(0);
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
      {items.map((q, qi) => {
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
          </div>
        );
      })}
      {total === items.length && (
        <div className="result" style={{ marginTop: 14 }}>
          <span className="mono">Resultado</span>
          <span className="big">{'★'.repeat(correct)}{'☆'.repeat(3 - correct)}</span>
          <p>{correct === 3 ? '¡Perfecto! Dominas esta lección.' : correct === 2 ? 'Muy bien. Revisa la explicación de la que fallaste.' : (canRetry ? 'Vuelve a leer “Aprende” y repite el quiz para ganar más estrellas.' : 'Vuelve a leer “Aprende” y revisa las explicaciones.')}</p>
          {canRetry
            ? <button className="btn ghost" onClick={() => { setAns({}); setRound((r) => r + 1); }}>Repetir quiz</button>
            : <p className="muted">Ya no te quedan intentos para este quiz.</p>}
        </div>
      )}
    </div>
  );
}
