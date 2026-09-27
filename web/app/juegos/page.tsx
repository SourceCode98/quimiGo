'use client';
import { useState } from 'react';
import Link from 'next/link';
import { GRADES } from '@/content';
import { UNIT_GAMES } from '@/content/games';
import { GameHost } from '@/components/GameHost';
import { useQL } from '@/components/Providers';
import { Stars } from '@/components/ui';

const IC: Record<string, string> = { blitz: '⏱', memory: '▦', builder: '⚛', hunter: '⌖', sorter: '⇣', balancer: '⚖', reactor: '◎' };
const NAME: Record<string, string> = { blitz: 'Contrarreloj', memory: 'Parejas', builder: 'Constructor 3D', hunter: 'Cazador de elementos', sorter: 'Atrapa y clasifica', balancer: 'Balanceo relámpago', reactor: 'Controla el reactor' };
type Free = { game: string; id: string; title: string; d: string; [k: string]: unknown };
const FREE: Free[] = [
  { game: 'hunter', id: 'free-hunter', title: 'Cazador de elementos', d: 'Toda la tabla, Z 1 a 36', time: 90 },
  { game: 'builder', id: 'free-builder', title: 'Constructor 3D libre', d: 'Arma 8 moléculas', targets: ['H2O', 'CO2', 'NH3', 'CH4', 'C2H4', 'C2H5OH', 'H2CO', 'CH3OH'], palette: ['H', 'C', 'N', 'O'] },
  { game: 'reactor', id: 'free-reactor', title: 'Reactor de gas', d: 'Mantén la presión estable', mode: 'gas' },
  ...GRADES.map((g) => ({ game: 'blitz', id: 'free-blitz-' + g.id, title: `Contrarreloj ${g.n}°`, d: `Preguntas de todo el grado ${g.n}°`, items: g.units.flatMap((u) => u.lessons.flatMap((l) => l.quiz)), time: 60, lives: 3, gc: g.id })),
];

export default function Juegos() {
  const { state } = useQL();
  const [free, setFree] = useState<Free | null>(null);
  if (free) return (
    <>
      <section className="reto-head"><span className="mono">Juego libre · sin XP</span><h1>{free.title}</h1></section>
      <section className="block"><GameHost spec={free} /></section>
      <div className="nav"><button className="btn ghost" onClick={() => setFree(null)}>← Volver a los juegos</button></div>
    </>
  );
  return (
    <>
      <section className="hero"><span className="mono">Arcade QuimicaLearn</span><h1>Juegos de química</h1>
        <p>Retos de cada unidad para ganar XP y estrellas, y juegos libres para practicar. Ideales para iniciar o cerrar una clase en video beam.</p></section>
      <div className="arcade">
        <section className="arcade-grade"><h2>Juego libre</h2><div className="gamecards">
          {FREE.map((f) => (
            <button key={f.id} className="gamecard" style={{ ['--gc' as string]: f.gc ? `var(--${f.gc})` : 'var(--accent)' }} onClick={() => setFree(f)}>
              <span className="gi">{IC[f.game]}</span><b>{f.title}</b><small>{NAME[f.game]} · {f.d}</small>
            </button>
          ))}
        </div></section>
        {GRADES.map((g) => (
          <section className="arcade-grade" key={g.id}><h2>Retos de {g.n}° · {g.title}</h2><div className="gamecards">
            {g.units.filter((u) => UNIT_GAMES[u.id]).map((u) => {
              const sp = UNIT_GAMES[u.id];
              return (
                <Link key={u.id} href={`/reto/${u.id}`} className="gamecard" style={{ ['--gc' as string]: `var(--${g.id})` }}>
                  <span className="gi">{IC[sp.game]}</span><b>{sp.title}</b><small>{NAME[sp.game]} · {u.title}</small><Stars n={state.lessons[u.id + 'r']?.stars} />
                </Link>
              );
            })}
          </div></section>
        ))}
      </div>
    </>
  );
}
