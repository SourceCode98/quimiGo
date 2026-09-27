'use client';
import Link from 'next/link';
import { useMemo } from 'react';
import { UNIT_BY_ID, unitGame } from '@/content/units';
import { GameHost } from './GameHost';
import { useQL } from './Providers';
import { gc } from './ui';
import { Locked } from './Locked';
import { NoTries, useTriesLabel } from './Tries';
import { GAME_NAME as INFO } from '@/content/game-names';

export function RetoView({ unitId }: { unitId: string }) {
  const { record, canOpen, retoOpen, ready, triesLeft } = useQL();
  const u = UNIT_BY_ID[unitId];
  const spec = useMemo(() => unitGame(u)!, [u]);
  const next = u.grade.units[u.index + 1];
  const label = useTriesLabel(spec.id);
  if (!ready) return <p className="muted">Cargando…</p>;
  if (!canOpen(u.id)) return <Locked what={`El reto de “${u.title}”`} gradeN={u.grade.n} />;
  if (!retoOpen(u.id)) return (
    <section className="locked-card">
      <span className="lock-ic" aria-hidden>🔒</span>
      <h1>Primero termina las lecciones del módulo</h1>
      <p>El reto se abre cuando completas cada lección de “{u.title}” hasta “Demuestra”.</p>
      <Link className="btn" href={`/grado/${u.grade.n}`}>Ver las lecciones</Link>
    </section>
  );
  return (
    <>
      <section className="reto-head" style={gc(u.grade.id)}>
        <span className="mono">Grado {u.grade.n}° · Unidad {u.index + 1}: {u.title} · Reto de la unidad</span>
        <h1>{spec.title}</h1>
        <p style={{ color: 'var(--muted)' }}>{INFO[spec.game]}. Supera el reto para ganar XP y estrellas.{label ? ` ${label}.` : ''}</p>
      </section>
      <section className="block">
        {triesLeft(spec.id).left <= 0
          ? <NoTries id={spec.id} what="este reto" />
          : <GameHost spec={spec} onFinish={(r) => record(spec.id, { act: true, stars: Math.max(0, Math.min(3, r.stars | 0)) })} />}
      </section>
      <div className="nav">
        <Link className="btn ghost" href={`/grado/${u.grade.n}`}>← Volver al grado {u.grade.n}°</Link>
        {next && <Link className="btn" href={`/leccion/${next.lessons[0].id}`}>Siguiente unidad: {next.title} →</Link>}
      </div>
    </>
  );
}
