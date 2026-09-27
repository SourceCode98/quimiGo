'use client';
import Link from 'next/link';

// Aviso cuando el docente aún no habilita el módulo para el curso del estudiante.
export function Locked({ what, gradeN }: { what: string; gradeN: number }) {
  return (
    <section className="locked-card">
      <span className="lock-ic" aria-hidden>🔒</span>
      <h1>{what} todavía está bloqueado</h1>
      <p>Tu profe habilita los módulos a medida que avanzan en clase. Cuando lo abra, aparecerá aquí.</p>
      <Link className="btn" href={`/grado/${gradeN}`}>Ver los módulos abiertos</Link>
    </section>
  );
}
