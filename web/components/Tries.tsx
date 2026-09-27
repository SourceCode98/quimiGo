'use client';
import { useQL } from './Providers';

const n = (k: number) => `${k} ${k === 1 ? 'intento' : 'intentos'}`;

/** Intentos que le quedan al estudiante, siempre visibles para él: "Te quedan 2 de 3 intentos". Vacío para el docente. */
export function useTriesLabel(id: string) {
  const { triesLeft, user } = useQL();
  if (user?.role !== 'student') return '';
  const t = triesLeft(id);
  if (!t.limit) return 'Intentos ilimitados';
  return t.left > 0 ? `Te ${t.left === 1 ? 'queda' : 'quedan'} ${t.left} de ${n(t.limit)}` : `Sin intentos (usaste ${n(t.limit)})`;
}

/** Aviso cuando el estudiante ya usó todos los intentos que fijó su docente. */
export function NoTries({ id, what }: { id: string; what: string }) {
  const { triesLeft, state } = useQL();
  const t = triesLeft(id);
  const st = state.lessons[id]?.stars;
  return (
    <div className="notries">
      <b>Ya usaste tus {n(t.limit)} en {what}.</b>
      <span>Tu mejor resultado: <span className="stars-big">{'★'.repeat(st || 0)}{'☆'.repeat(3 - (st || 0))}</span></span>
      <small>Tu profe decide cuántos intentos hay en cada sección. Si necesitas otro, pídeselo.</small>
    </div>
  );
}
