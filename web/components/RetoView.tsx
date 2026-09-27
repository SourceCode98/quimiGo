'use client';
import Link from 'next/link';
import { useMemo } from 'react';
import { UNIT_BY_ID, unitGame } from '@/content/units';
import { GameHost } from './GameHost';
import { useQL } from './Providers';
import { gc } from './ui';
import { Locked } from './Locked';
import { GAME_NAME as INFO } from '@/content/game-names';

export function RetoView({ unitId }: { unitId: string }) {
  const { record, canOpen, ready } = useQL();
  const u = UNIT_BY_ID[unitId];
  const spec = useMemo(() => unitGame(u)!, [u]);
  const next = u.grade.units[u.index + 1];
  if (!ready) return <p className="muted">Cargando…</p>;
  if (!canOpen(u.id)) return <Locked what={`El reto de “${u.title}”`} gradeN={u.grade.n} />;
  return (
    <>
      <section className="reto-head" style={gc(u.grade.id)}>
        <span className="mono">Grado {u.grade.n}° · Unidad {u.index + 1}: {u.title} · Reto de la unidad</span>
        <h1>{spec.title}</h1>
        <p style={{ color: 'var(--muted)' }}>{INFO[spec.game]}. Supera el reto para ganar XP y estrellas.</p>
      </section>
      <section className="block">
        <GameHost spec={spec} onFinish={(r) => record(spec.id, { act: true, stars: Math.max(0, Math.min(3, r.stars | 0)) })} />
      </section>
      <div className="nav">
        <Link className="btn ghost" href={`/grado/${u.grade.n}`}>← Volver al grado {u.grade.n}°</Link>
        {next && <Link className="btn" href={`/leccion/${next.lessons[0].id}`}>Siguiente unidad: {next.title} →</Link>}
      </div>
    </>
  );
}
