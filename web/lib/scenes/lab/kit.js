// Utilidades de dibujo SVG para las ilustraciones de laboratorio (viewBox 600 x 340).
import { esc } from '../../widgets.js';

export const VW = 600, VH = 340, BENCH = 292;

// Paleta común (sobre el fondo oscuro del .stage)
export const P = {
  ink: '#E8EEF3', mute: '#9AA8B3',
  glass: '#BFD8EA', glassFill: 'rgba(190,216,234,.09)', hi: 'rgba(255,255,255,.45)',
  water: '#4FA3E0', waterTop: '#8CC8F2', mud: '#8C6A45', oil: '#E8B84A', oilTop: '#F6D57E',
  sand: '#C89B62', sandD: '#9A7243', steel: '#8C99A6', steelD: '#56636F', steelL: '#C3CDD5',
  wood: '#8A5A3B', red: '#E4574B', green: '#6FD19A', blue: '#7FB2EA', gold: '#E7B460', orange: '#F2A65A',
  flameO: '#FF9F2E', flameY: '#FFE08A', flameB: '#5BC0EB',
};

export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const ease = (x) => { x = clamp(x); return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; };
/** progreso 0..1 de t entre a y b */
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const lerp = (a, b, f) => a + (b - a) * f;
/** generador pseudoaleatorio estable */
export function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

/** Texto con halo. o: {a:'start'|'middle'|'end', s:tamaño, cls, fill, w} */
export function T(x, y, t, o = {}) {
  return '<text class="sc-t' + (o.cls ? ' ' + o.cls : '') + '" x="' + x + '" y="' + y + '" text-anchor="' + (o.a || 'middle') + '" font-size="' + (o.s || 17) + '"' +
    (o.fill ? ' style="fill:' + o.fill + '"' : '') + (o.w ? ' font-weight="' + o.w + '"' : '') + '>' + esc(t) + '</text>';
}
/** Texto con subíndices: 'CO_2' -> CO₂ con tspan */
export function Tf(x, y, t, o = {}) {
  const body = esc(t).replace(/_(\d+)/g, '<tspan baseline-shift="sub" font-size="75%">$1</tspan>');
  return '<text class="sc-t' + (o.cls ? ' ' + o.cls : '') + '" x="' + x + '" y="' + y + '" text-anchor="' + (o.a || 'middle') + '" font-size="' + (o.s || 17) + '"' + (o.fill ? ' style="fill:' + o.fill + '"' : '') + '>' + body + '</text>';
}
/** Rótulo con línea guía: punto en (px,py), texto en (tx,ty) */
export function callout(px, py, tx, ty, text, o = {}) {
  const a = o.a || (tx < px ? 'end' : tx > px ? 'start' : 'middle');
  const lx = a === 'end' ? tx + 4 : a === 'start' ? tx - 4 : tx;
  const ly = a === 'middle' ? ty + (ty < py ? 5 : -16) : ty - 5;
  return '<g class="sc-call">' + '<path class="sc-lead" d="M' + px + ' ' + py + 'L' + lx + ' ' + ly + '"/>' + '<circle class="sc-lead-dot" cx="' + px + '" cy="' + py + '" r="2.6"/>' + T(tx, ty, text, o) + '</g>';
}
export const bench = () =>
  '<rect x="-1400" y="' + BENCH + '" width="3400" height="80" fill="#1E2A34"/>' +
  '<rect x="-1400" y="' + BENCH + '" width="3400" height="4" fill="#33434F"/>' +
  '<rect x="-1400" y="' + (BENCH + 4) + '" width="3400" height="10" fill="#18222B"/>';

/** Resplandor suave detrás del montaje */
export const glow = (u, cx, cy, r, c = '#2A4052') =>
  '<radialGradient id="' + u + 'gl' + cx + '"><stop offset="0" stop-color="' + c + '" stop-opacity=".55"/><stop offset="1" stop-color="' + c + '" stop-opacity="0"/></radialGradient>' +
  '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + r + '" ry="' + r * 0.7 + '" fill="url(#' + u + 'gl' + cx + ')"/>';

/** Soporte universal: base, varilla y opcionalmente brazo con aro */
export function stand(x, top, arms = []) {
  let h = '<rect x="' + (x - 46) + '" y="' + (BENCH - 9) + '" width="92" height="9" rx="3" fill="' + P.steelD + '"/>' +
    '<rect x="' + (x - 3) + '" y="' + top + '" width="6" height="' + (BENCH - 9 - top) + '" rx="3" fill="' + P.steel + '"/>' +
    '<rect x="' + (x - 2) + '" y="' + top + '" width="1.6" height="' + (BENCH - 9 - top) + '" fill="' + P.steelL + '" opacity=".6"/>';
  arms.forEach(([y, x2]) => {
    h += '<rect x="' + Math.min(x, x2) + '" y="' + (y - 2.5) + '" width="' + Math.abs(x2 - x) + '" height="5" rx="2.5" fill="' + P.steel + '"/>' +
      '<rect x="' + (x - 6) + '" y="' + (y - 6) + '" width="12" height="12" rx="2" fill="' + P.steelD + '"/>';
  });
  return h;
}
export const ring = (cx, y, rx) => '<ellipse cx="' + cx + '" cy="' + y + '" rx="' + rx + '" ry="' + rx * 0.18 + '" fill="none" stroke="' + P.steel + '" stroke-width="4"/>';

/** Vaso de precipitados: devuelve {back, front, inner} donde inner es el rectángulo interior */
export function beaker(x, y, w, h, o = {}) {
  const lip = 6, r = 7;
  const d = 'M' + (x - lip) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y + 6) + 'V' + (y + h - r) + 'Q' + x + ' ' + (y + h) + ' ' + (x + r) + ' ' + (y + h) + 'H' + (x + w - r) + 'Q' + (x + w) + ' ' + (y + h) + ' ' + (x + w) + ' ' + (y + h - r) + 'V' + (y + 6) + 'Q' + (x + w) + ' ' + y + ' ' + (x + w + 3) + ' ' + (y - 2);
  let marks = '';
  if (o.marks !== false) for (let k = 1; k <= 3; k++) { const yy = y + h - (h - 10) * k / 4; marks += '<path d="M' + (x + w - 4) + ' ' + yy + 'h-' + (k % 2 ? 12 : 8) + '" stroke="' + P.glass + '" stroke-width="1.5" opacity=".55"/>'; }
  return {
    back: '<path d="' + d + '" fill="' + P.glassFill + '"/>',
    front: '<path d="' + d + '" fill="none" stroke="' + P.glass + '" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<path d="M' + (x + 5) + ' ' + (y + 14) + 'V' + (y + h - 12) + '" stroke="' + P.hi + '" stroke-width="3" stroke-linecap="round" opacity=".6"/>' + marks,
    clip: 'M' + x + ' ' + y + 'V' + (y + h - r) + 'Q' + x + ' ' + (y + h) + ' ' + (x + r) + ' ' + (y + h) + 'H' + (x + w - r) + 'Q' + (x + w) + ' ' + (y + h) + ' ' + (x + w) + ' ' + (y + h - r) + 'V' + y + 'Z',
  };
}

/** Matraz Erlenmeyer: base en (cx, yb), cuello arriba */
export function erlen(cx, yb, w, h, o = {}) {
  const nw = o.nw || w * 0.26, nh = o.nh || h * 0.28;
  const top = yb - h;
  const d = 'M' + (cx - nw / 2 - 4) + ' ' + top + 'H' + (cx - nw / 2) + 'V' + (top + nh) + 'L' + (cx - w / 2) + ' ' + (yb - 8) + 'Q' + (cx - w / 2 - 1) + ' ' + yb + ' ' + (cx - w / 2 + 9) + ' ' + yb + 'H' + (cx + w / 2 - 9) + 'Q' + (cx + w / 2 + 1) + ' ' + yb + ' ' + (cx + w / 2) + ' ' + (yb - 8) + 'L' + (cx + nw / 2) + ' ' + (top + nh) + 'V' + top + 'H' + (cx + nw / 2 + 4);
  const clip = 'M' + (cx - nw / 2) + ' ' + top + 'V' + (top + nh) + 'L' + (cx - w / 2) + ' ' + (yb - 8) + 'Q' + (cx - w / 2 - 1) + ' ' + yb + ' ' + (cx - w / 2 + 9) + ' ' + yb + 'H' + (cx + w / 2 - 9) + 'Q' + (cx + w / 2 + 1) + ' ' + yb + ' ' + (cx + w / 2) + ' ' + (yb - 8) + 'L' + (cx + nw / 2) + ' ' + (top + nh) + 'V' + top + 'Z';
  return {
    back: '<path d="' + d + '" fill="' + P.glassFill + '"/>',
    front: '<path d="' + d + '" fill="none" stroke="' + P.glass + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M' + (cx - w / 2 + 12) + ' ' + (yb - 14) + 'L' + (cx - nw / 2 - 2) + ' ' + (top + nh + 18) + '" stroke="' + P.hi + '" stroke-width="3" stroke-linecap="round" opacity=".5"/>',
    clip,
  };
}

/** Tubo de ensayo vertical: boca en (cx, top) */
export function tube(cx, top, w, h) {
  const r = w / 2;
  const d = 'M' + (cx - r - 3) + ' ' + top + 'H' + (cx - r) + 'V' + (top + h - r) + 'A' + r + ' ' + r + ' 0 0 0 ' + (cx + r) + ' ' + (top + h - r) + 'V' + top + 'H' + (cx + r + 3);
  const clip = 'M' + (cx - r) + ' ' + top + 'V' + (top + h - r) + 'A' + r + ' ' + r + ' 0 0 0 ' + (cx + r) + ' ' + (top + h - r) + 'V' + top + 'Z';
  return {
    back: '<path d="' + clip + '" fill="' + P.glassFill + '"/>',
    front: '<path d="' + d + '" fill="none" stroke="' + P.glass + '" stroke-width="2.6" stroke-linejoin="round"/>' +
      '<path d="M' + (cx - r + 4) + ' ' + (top + 10) + 'V' + (top + h - r - 4) + '" stroke="' + P.hi + '" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>',
    clip,
  };
}

/** Llama con núcleo azul; (x, y) = base de la llama */
export function flame(x, y, s = 1, dl = 0) {
  const k = (v) => v * s;
  return '<g transform="translate(' + x + ' ' + y + ')">' +
    '<g class="sc-ab sc-flick" style="--dl:' + dl + 's">' +
    '<path d="M0 ' + k(-46) + 'C' + k(8) + ' ' + k(-30) + ' ' + k(15) + ' ' + k(-18) + ' ' + k(13) + ' ' + k(-8) + 'C' + k(11) + ' ' + k(2) + ' ' + k(-11) + ' ' + k(2) + ' ' + k(-13) + ' ' + k(-8) + 'C' + k(-15) + ' ' + k(-18) + ' ' + k(-8) + ' ' + k(-30) + ' 0 ' + k(-46) + 'Z" fill="' + P.flameO + '" opacity=".9"/>' +
    '<path d="M0 ' + k(-32) + 'C' + k(5) + ' ' + k(-22) + ' ' + k(9) + ' ' + k(-14) + ' ' + k(8) + ' ' + k(-7) + 'C' + k(6) + ' ' + k(0) + ' ' + k(-6) + ' ' + k(0) + ' ' + k(-8) + ' ' + k(-7) + 'C' + k(-9) + ' ' + k(-14) + ' ' + k(-5) + ' ' + k(-22) + ' 0 ' + k(-32) + 'Z" fill="' + P.flameY + '"/>' +
    '<path d="M0 ' + k(-16) + 'C' + k(4) + ' ' + k(-10) + ' ' + k(5) + ' ' + k(-6) + ' ' + k(4) + ' ' + k(-2) + 'C' + k(2) + ' ' + k(1) + ' ' + k(-2) + ' ' + k(1) + ' ' + k(-4) + ' ' + k(-2) + 'C' + k(-5) + ' ' + k(-6) + ' ' + k(-4) + ' ' + k(-10) + ' 0 ' + k(-16) + 'Z" fill="' + P.flameB + '"/>' +
    '</g></g>';
}
/** Mechero Bunsen con la boca en (x, y) */
export function bunsen(x, y, withFlame = true) {
  return (withFlame ? flame(x, y, 1) : '') +
    '<rect x="' + (x - 7) + '" y="' + y + '" width="14" height="' + (BENCH - y - 12) + '" rx="2" fill="' + P.steel + '"/>' +
    '<rect x="' + (x - 5) + '" y="' + y + '" width="3" height="' + (BENCH - y - 12) + '" fill="' + P.steelL + '" opacity=".6"/>' +
    '<rect x="' + (x - 11) + '" y="' + (BENCH - 30) + '" width="22" height="8" rx="2" fill="' + P.steelD + '"/>' +
    '<path d="M' + (x - 28) + ' ' + BENCH + 'Q' + (x - 26) + ' ' + (BENCH - 13) + ' ' + x + ' ' + (BENCH - 13) + 'Q' + (x + 26) + ' ' + (BENCH - 13) + ' ' + (x + 28) + ' ' + BENCH + 'Z" fill="' + P.steelD + '"/>';
}

/** Burbujas que suben: n burbujas en la franja [x0,x1] desde y0, suben dy */
export function bubbles(r, n, x0, x1, y0, dy, o = {}) {
  let h = '';
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, r()), rad = (o.r || 3) * (0.6 + r() * 0.8);
    h += '<circle class="sc-a sc-rise" cx="' + x.toFixed(1) + '" cy="' + (y0 - r() * (o.spread || 0)).toFixed(1) + '" r="' + rad.toFixed(1) + '" fill="' + (o.fill || 'rgba(255,255,255,.18)') + '" stroke="' + (o.stroke || 'rgba(255,255,255,.75)') + '" stroke-width="1.2" style="--d:' + ((o.d || 2) * (0.7 + r() * 0.6)).toFixed(2) + 's;--dl:' + (-r() * (o.d || 2) * 1.3).toFixed(2) + 's;--dy:' + (-dy * (0.7 + r() * 0.3)).toFixed(0) + 'px;--dx:' + ((r() - 0.5) * (o.wob || 8)).toFixed(0) + 'px"/>';
  }
  return h;
}
/** Vapor: volutas que suben */
export function steam(r, n, x0, x1, y0, dy = 60, o = {}) {
  let h = '';
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, (i + r() * 0.8) / n);
    h += '<path class="sc-a sc-steam" d="M' + x.toFixed(1) + ' ' + y0 + 'c-6 -8 6 -14 0 -22c-5 -7 4 -12 1 -17" fill="none" stroke="' + (o.c || 'rgba(230,240,248,.8)') + '" stroke-width="' + (o.w || 3) + '" stroke-linecap="round" style="--d:' + (2.4 + r() * 1.4).toFixed(2) + 's;--dl:' + (-r() * 3).toFixed(2) + 's;--dy:' + (-dy) + 'px;--dx:' + ((r() - 0.5) * 16).toFixed(0) + 'px"/>';
  }
  return h;
}
/** Gota (lágrima) centrada en (x,y) */
export const drop = (x, y, s = 1, c = P.water) =>
  '<path d="M' + x + ' ' + (y - 7 * s) + 'C' + (x + 4 * s) + ' ' + (y - 2 * s) + ' ' + (x + 5 * s) + ' ' + (y + 1 * s) + ' ' + (x + 5 * s) + ' ' + (y + 3 * s) + 'A' + 5 * s + ' ' + 5 * s + ' 0 0 1 ' + (x - 5 * s) + ' ' + (y + 3 * s) + 'C' + (x - 5 * s) + ' ' + (y + 1 * s) + ' ' + (x - 4 * s) + ' ' + (y - 2 * s) + ' ' + x + ' ' + (y - 7 * s) + 'Z" fill="' + c + '"/>';

/** Gradiente lineal vertical */
export const vgrad = (id, stops) => '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' + stops.map(([o, c, a]) => '<stop offset="' + o + '" stop-color="' + c + '"' + (a != null ? ' stop-opacity="' + a + '"' : '') + '/>').join('') + '</linearGradient>';
export const hgrad = (id, stops) => '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="0">' + stops.map(([o, c, a]) => '<stop offset="' + o + '" stop-color="' + c + '"' + (a != null ? ' stop-opacity="' + a + '"' : '') + '/>').join('') + '</linearGradient>';

/** Etiqueta tipo insignia (píldora de color) centrada en (x,y) */
export function badge(x, y, text, c, o = {}) {
  const s = o.s || 15, w = text.length * s * 0.6 + 22, h = s * 1.75;
  return '<g class="sc-badge' + (o.cls ? ' ' + o.cls : '') + '"' + (o.attr || '') + '><rect x="' + (x - w / 2) + '" y="' + (y - h / 2) + '" width="' + w + '" height="' + h + '" rx="' + h / 2 + '" fill="' + c + '"/>' +
    '<text x="' + x + '" y="' + (y + s * 0.36) + '" text-anchor="middle" font-size="' + s + '" font-weight="700" fill="' + (o.ink || '#0F1820') + '">' + esc(text) + '</text></g>';
}

/** Tarjeta/panel redondeado (para viñetas) */
export const panel = (x, y, w, h, o = {}) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (o.r || 14) + '" fill="' + (o.fill || 'rgba(255,255,255,.035)') + '" stroke="' + (o.stroke || 'rgba(154,168,179,.22)') + '" stroke-width="1.2"/>';

/** Cuadrícula de consulta: elementos por selector con caché */
export const q = (root, sel) => root.querySelector(sel);
export const qa = (root, sel) => Array.from(root.querySelectorAll(sel));
export const setA = (el, attrs) => { if (el) for (const k in attrs) el.setAttribute(k, attrs[k]); };
