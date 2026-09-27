'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useQL } from './Providers';

// Solo docentes y estudiantes con código de curso ven los cursos, lecciones, retos y juegos.
// La portada, "Entrar" y las páginas del docente (que piden su propia sesión) quedan abiertas.
const OPEN = (p: string) => p === '/' || p.startsWith('/entrar') || p.startsWith('/docente');

export function AccessGate({ children }: { children: ReactNode }) {
  const { ready, user } = useQL();
  const p = usePathname();
  if (OPEN(p)) return <>{children}</>;
  if (!ready) return <p className="muted">Cargando…</p>;
  if (user) {
    // Un estudiante solo ve el grado de su curso.
    const g = p.match(/^\/(?:grado\/(\d+)|leccion\/g(\d+)u|reto\/g(\d+)u)/);
    const n = g && Number(g[1] || g[2] || g[3]);
    if (user.role === 'student' && n && user.grade && n !== user.grade) {
      return (
        <section className="locked-card">
          <span className="lock-ic" aria-hidden>🔒</span>
          <h1>Este contenido es de {n}°</h1>
          <p>Tu curso es de {user.grade}°. Aquí ves solo los módulos que tu profe habilita para tu curso.</p>
          <Link className="btn" href={`/grado/${user.grade}`}>Ir a mis módulos</Link>
        </section>
      );
    }
    return <>{children}</>;
  }
  return (
    <section className="locked-card">
      <span className="lock-ic" aria-hidden>🔒</span>
      <h1>Entra para ver los cursos</h1>
      <p>Los cursos son para estudiantes con el código que les da su profe y para docentes con cuenta.</p>
      <Link className="btn" href="/entrar">Entrar</Link>
    </section>
  );
}
