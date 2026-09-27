'use client';
import Link from 'next/link';
import { ACT_NAME, GRADES } from '@/content';
import { UNIT_GAMES } from '@/content/games';
import { isDone } from '@/lib/game';
import { useQL } from './Providers';
import { gc, Stars } from './ui';

export function CourseView({ n }: { n: number }) {
  const { state, canOpen, user } = useQL();
  const g = GRADES.find((x) => x.n === n)!;
  const ls = g.units.flatMap((u) => u.lessons);
  const d = ls.filter((l) => isDone(state.lessons, l.id)).length;
  return (
    <>
      <section className="chead" style={gc(g.id)}>
        <span className="mono">Grado {g.n}° · {g.units.length} unidades · {ls.length} lecciones</span>
        <h1>{g.title}</h1>
        <p style={{ color: 'var(--muted)' }}>{g.desc}</p>
        <div className="gprog" style={{ maxWidth: 360 }}><div className="bar"><i style={{ width: (d / ls.length) * 100 + '%', background: `var(--${g.id})` }} /></div>{d} de {ls.length} completadas</div>
      </section>
      <section className="tbox teacher">
        <span className="mono">Plan del periodo para el docente</span>
        <div className="plan"><table>
          <thead><tr><th>Unidad</th><th>Lección</th><th>Referente MEN</th><th>Actividad</th><th>Min</th></tr></thead>
          <tbody>{g.units.map((u, ui) => u.lessons.map((l, li) => (
            <tr key={l.id}><td>{li === 0 ? `${ui + 1}. ${u.title}` : ''}</td><td>{l.title}</td><td>{l.dba || l.std}</td><td>{ACT_NAME[l.act.type]}</td><td>{l.time}</td></tr>
          )))}</tbody>
        </table></div>
      </section>
      <section className="units" style={gc(g.id)}>
        {g.units.map((u, ui) => canOpen(u.id) ? (
          <div className="unit" key={u.id}>
            <div className="unit-h"><h2>{ui + 1}. {u.title}</h2><span className="mono">{u.lessons.filter((l) => isDone(state.lessons, l.id)).length}/{u.lessons.length}</span></div>
            <p style={{ color: 'var(--muted)', fontSize: '.92rem' }}>{u.desc}</p>
            <div className="lessons">
              {u.lessons.map((l, li) => (
                <Link key={l.id} href={`/leccion/${l.id}`} className={'lrow' + (isDone(state.lessons, l.id) ? ' done' : '')}>
                  <span className="n">{li + 1}</span>
                  <span><b>{l.title}</b><small>{ACT_NAME[l.act.type]} · {l.time} min</small></span>
                  <Stars n={state.lessons[l.id]?.stars} />
                </Link>
              ))}
              {UNIT_GAMES[u.id] && (
                <Link href={`/reto/${u.id}`} className="reto-row">
                  <span className="gi">★</span>
                  <span><b>Reto de la unidad: {UNIT_GAMES[u.id].title}</b><small>Minijuego · +20 XP y hasta 3 estrellas</small></span>
                  <Stars n={state.lessons[u.id + 'r']?.stars} />
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="unit unit-locked" key={u.id}>
            <div className="unit-h"><h2>{ui + 1}. {u.title}</h2><span className="lock-badge">Bloqueado</span></div>
            <p style={{ color: 'var(--muted)', fontSize: '.92rem' }}>{u.desc}</p>
            <p className="muted" style={{ fontSize: '.88rem' }}>{u.lessons.length} lecciones{UNIT_GAMES[u.id] ? ' y un reto' : ''}. {user?.role === 'student' && user.grade === g.n ? 'Tu profe lo habilitará cuando lleguen a este tema.' : 'Este módulo no es de tu curso.'}</p>
          </div>
        ))}
      </section>
    </>
  );
}
