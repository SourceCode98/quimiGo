'use client';
import { useQL } from './Providers';

const n = (k: number) => `${k} ${k === 1 ? 'intento' : 'intentos'}`;

/** Texto corto para el encabezado de la sección: "Intento 2 de 3". Vacío si no hay límite. */
export function useTriesLabel(id: string) {
  const { triesLeft } = useQL();
  const t = triesLeft(id);
  if (!t.limit) return '';
  return t.left > 0 ? `Intento ${t.used + 1} de ${t.limit}` : `Sin intentos (${t.limit})`;
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
