'use client';
import { useEffect, useRef, useState } from 'react';
import { fm, type Explore as Ex, type Vals } from '@/content/explore';

const html = (s: string) => ({ __html: s });

// Reto "Explora": controles que mueven la escena en vivo y retos en orden. Avisa con onDone al lograrlos todos.
export function Explore({ ex, onScene, onDone }: { ex: Ex; onScene: (patch: Record<string, unknown>) => void; onDone: () => void }) {
  const init = () => Object.fromEntries(ex.ctl.map((c) => [c.id, 'opts' in c ? c.v ?? -1 : c.v])) as Vals;
  const [v, setV] = useState<Vals>(init);
  const [said, setSaid] = useState<number | null>(ex.predict ? null : -1);
  const [ti, setTi] = useState(0);
  const [won, setWon] = useState(false);
  const [hint, setHint] = useState(false);
  const [tries, setTries] = useState(0);
  const task = ex.tasks[ti];
  const last = ti === ex.tasks.length - 1;
  const scene = useRef(onScene);
  scene.current = onScene;
  const done = useRef(onDone);
  done.current = onDone;

  // La escena se actualiza poco después de soltar el control (los deslizadores no la reinician en cada píxel)
  // y el reto se revisa con el valor ya quieto, para que pasar de largo por la respuesta no cuente.
  useEffect(() => {
    const t = setTimeout(() => {
      scene.current(ex.scene(v));
      if (!won && said !== null && task.ok(v)) { setWon(true); if (last) done.current(); }
    }, 160);
    return () => clearTimeout(t);
  }, [v]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (id: string, x: number) => { if (won) setWon(false); setTries((n) => n + 1); setV((o) => ({ ...o, [id]: x })); };
  const next = () => { setTi(ti + 1); setWon(false); setHint(false); setTries(0); };
  const locked = said === null;

  return (
    <div className="step-text enter ex" aria-live="polite">
      <span className="mono">Explora · reto {Math.min(ti + 1, ex.tasks.length)} de {ex.tasks.length}</span>
      {ex.predict && said === null ? (
        <>
          <h3>Antes de mover nada, predice:</h3>
          <p dangerouslySetInnerHTML={html(ex.predict.q)} />
          <div className="ms-binrow">
            {ex.predict.o.map((o, i) => <button key={i} className="opt" onClick={() => setSaid(i)}><span dangerouslySetInnerHTML={html(o)} /></button>)}
          </div>
        </>
      ) : (
        <>
          {ex.predict && said !== null && said >= 0 && ti === 0 && !won && (
            <div className={'fb ' + (said === ex.predict.a ? 'ok' : 'info')}>
              {said === ex.predict.a ? 'Buena predicción. ' : 'Veamos si es así. '}<span dangerouslySetInnerHTML={html(ex.predict.e)} /> Compruébalo moviendo los controles.
            </div>
          )}
          <h3 dangerouslySetInnerHTML={html(task.ask)} />
        </>
      )}
      <div className={'ex-ctl' + (locked ? ' off' : '')}>
        {ex.ctl.map((c) => (
          <div className="ex-row" key={c.id}>
            {'opts' in c ? (
              <>
                <span className="ex-lbl">{c.label}</span>
                <div className="ex-opts" role="radiogroup" aria-label={c.label}>
                  {c.opts.map((o, i) => (
                    <button key={i} role="radio" aria-checked={v[c.id] === i} className={'chip' + (v[c.id] === i ? ' on' : '')} disabled={locked} onClick={() => set(c.id, i)}>{o}</button>
                  ))}
                </div>
              </>
            ) : (
              <label className="ex-sl">
                <span className="ex-lbl">{c.label} <b>{c.fmt ? c.fmt(v[c.id]) : fm(v[c.id])}{c.unit ? ' ' + c.unit : ''}</b></span>
                <input type="range" min={c.min} max={c.max} step={c.step} value={v[c.id]} disabled={locked}
                  onChange={(e) => set(c.id, +e.target.value)} />
              </label>
            )}
          </div>
        ))}
      </div>
      {ex.read && !locked && <div className="ex-read" dangerouslySetInnerHTML={html(ex.read(v))} />}
      {won ? (
        <div className="fb ok ex-win">
          <b>¡Lo lograste! </b><span dangerouslySetInnerHTML={html(task.win)} />
          {!last && <button className="btn" onClick={next}>Siguiente reto →</button>}
        </div>
      ) : !locked && task.hint && (hint ? (
        <div className="fb info"><b>Pista: </b><span dangerouslySetInnerHTML={html(task.hint)} /></div>
      ) : tries >= 6 && <button className="btn ghost ex-hint" onClick={() => setHint(true)}>Ver una pista</button>)}
    </div>
  );
}
