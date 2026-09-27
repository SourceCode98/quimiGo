// Reglas de puntaje. El servidor las aplica para que el XP no se pueda inventar desde el navegador.
export const XP_ACTIVITY = 20;
export const XP_PER_STAR = 10;

export function applyResult(prev, { act, stars }) {
  const before = prev || { stars: null, act: false, attempts: 0 };
  const next = { ...before };
  let gained = 0;
  if (act && !before.act) { next.act = true; gained += XP_ACTIVITY; }
  if (stars !== undefined && stars !== null) {
    const best = before.stars ?? 0;
    if (stars > best) gained += (stars - best) * XP_PER_STAR;
    next.stars = Math.max(before.stars ?? 0, stars);
    next.attempts = (before.attempts || 0) + 1;
  }
  return { next, gained };
}

export function addDay(days, today) {
  const list = Array.isArray(days) ? days.filter((d) => typeof d === 'string') : [];
  if (!list.includes(today)) list.push(today);
  return list.slice(-60);
}
