// Moléculas adicionales para la biblioteca M (coordenadas en Å) y geometrías de respaldo para reacciones.
// Importar este módulo registra las moléculas en M (efecto secundario) una sola vez.
import { M, EL, parseF, GROUP } from '../widgets.js';

/* ---------- vectores ---------- */
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const subv = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = a => Math.sqrt(dot(a, a));
const nrm = a => { const l = len(a) || 1; return mul(a, 1 / l); };
const perpTo = (u, ref) => { let p = subv(ref, mul(u, dot(ref, u))); if (len(p) < 1e-3) p = subv([0, 0, 1], mul(u, u[2])); if (len(p) < 1e-3) p = [1, 0, 0]; return nrm(p); };
const TET_C = 1 / 3, TET_S = Math.sqrt(8 / 9);

/** Constructor de moléculas con ayudas para hidrógenos. */
function B() {
  const a = [], b = [];
  const api = {
    a, b,
    at(sym, p) { a.push([sym, p[0], p[1], p[2]]); return a.length - 1; },
    bond(i, j, k) { b.push([i, j, k === undefined ? 1 : k]); },
    p(i) { return a[i].slice(1); },
    nb(i) { return b.filter(x => x[0] === i || x[1] === i).map(x => (x[0] === i ? x[1] : x[0])); },
    dirs(i) { return api.nb(i).map(j => nrm(subv(api.p(j), api.p(i)))); },
    // añade átomos (sym) en posiciones tetraédricas libres alrededor de i
    sp3(i, n, sym, L, ref) {
      const c = api.p(i), d = api.dirs(i); const out = [];
      if (d.length === 1) {
        const u = d[0], p = perpTo(u, ref || [0, 1, 0]), q = cross(u, p);
        for (let k = 0; k < 3 && out.length < n; k++) {
          const ph = k * 2 * Math.PI / 3;
          out.push(add(mul(u, -TET_C), add(mul(p, TET_S * Math.cos(ph)), mul(q, TET_S * Math.sin(ph)))));
        }
      } else if (d.length === 2) {
        const bis = nrm(mul(add(d[0], d[1]), -1)); const nn = nrm(cross(d[0], d[1]));
        const h = 54.75 * Math.PI / 180;
        out.push(add(mul(bis, Math.cos(h)), mul(nn, Math.sin(h))));
        if (n > 1) out.push(add(mul(bis, Math.cos(h)), mul(nn, -Math.sin(h))));
      } else if (d.length === 3) out.push(nrm(mul(add(add(d[0], d[1]), d[2]), -1)));
      else if (d.length === 0) { out.push([1, 0, 0]); }
      return out.slice(0, n).map(u => { const j = api.at(sym || 'H', add(c, mul(u, L || 1.09))); api.bond(i, j, 1); return j; });
    },
    // posición trigonal plana libre (con 2 vecinos) o dos posiciones (con 1 vecino y normal nz)
    sp2(i, n, sym, L, nz) {
      const c = api.p(i), d = api.dirs(i); const out = [];
      if (d.length === 2) out.push(nrm(mul(add(d[0], d[1]), -1)));
      else if (d.length === 1) { const u = d[0], w = nrm(cross(nz || [0, 0, 1], u)); out.push(add(mul(u, -.5), mul(w, .866)), add(mul(u, -.5), mul(w, -.866))); }
      return out.slice(0, n).map(u => { const j = api.at(sym || 'H', add(c, mul(u, L || 1.09))); api.bond(i, j, 1); return j; });
    },
  };
  return api;
}
const polar = (L, degFromX) => [L * Math.cos(degFromX * Math.PI / 180), L * Math.sin(degFromX * Math.PI / 180), 0];

/* ---------- definiciones ---------- */
const X = {};

// Butano (anti, zigzag)
(() => {
  const m = B();
  const c = [[-1.915, -.43, 0], [-.638, .43, 0], [.638, -.43, 0], [1.915, .43, 0]].map(p => m.at('C', p));
  m.bond(c[0], c[1]); m.bond(c[1], c[2]); m.bond(c[2], c[3]);
  m.sp3(c[0], 3, 'H', 1.09, [-1, -1, 0]); m.sp3(c[3], 3, 'H', 1.09, [1, 1, 0]);
  m.sp3(c[1], 2); m.sp3(c[2], 2);
  X.C4H10 = { n: 'Butano', f: 'C4H10', g: 'Tetraédrica (cada C)', ang: '109,5°', pol: 'Apolar', a: m.a, b: m.b, lp: [] };
})();
// Isobutano (metilpropano)
(() => {
  const m = B(); const c0 = m.at('C', [0, 0, 0]);
  const hs = m.at('H', [0, 1.09, 0]); m.bond(c0, hs);
  [0, 120, 240].forEach(ph => {
    const r = ph * Math.PI / 180; const d = [TET_S * Math.cos(r), -TET_C, TET_S * Math.sin(r)];
    const ci = m.at('C', mul(d, 1.54)); m.bond(c0, ci); m.sp3(ci, 3, 'H', 1.09, [0, -1, 0]);
  });
  X.iC4H10 = { n: 'Isobutano (metilpropano)', f: 'C4H10', g: 'Tetraédrica (cada C)', ang: '109,5°', pol: 'Apolar', a: m.a, b: m.b, lp: [] };
})();
// Hidróxido de sodio: par iónico Na⁺ OH⁻
X.NaOH = { n: 'Hidróxido de sodio', f: 'NaOH', g: 'Par iónico (Na⁺ y OH⁻)', ang: '—', pol: 'Iónico', a: [['Na', -2.05, 0, 0], ['O', 0, 0, 0], ['H', .97, 0, 0]], b: [[0, 1, 0], [1, 2, 1]], lp: [], lab: ['Na⁺', 'OH⁻', ''], rad: [.45, 0, 0] };
// Óxido de calcio
X.CaO = { n: 'Óxido de calcio (cal viva)', f: 'CaO', g: 'Par iónico (Ca²⁺ y O²⁻)', ang: '—', pol: 'Iónico', a: [['Ca', -1.2, 0, 0], ['O', 1.2, 0, 0]], b: [[0, 1, 0]], lp: [], lab: ['Ca²⁺', 'O²⁻'], rad: [.5, .62] };
// Cloruro de sodio: par iónico (una unidad)
X.NaClp = { n: 'Cloruro de sodio', f: 'NaCl', g: 'Par iónico (Na⁺ y Cl⁻)', ang: '—', pol: 'Iónico', a: [['Na', -1.2, 0, 0], ['Cl', 1.2, 0, 0]], b: [[0, 1, 0]], lp: [], lab: ['Na⁺', 'Cl⁻'], rad: [.42, .72] };
// Ácido metanoico (fórmico)
(() => {
  const m = B(); const c = m.at('C', [0, 0, 0]); const o1 = m.at('O', [0, 1.21, 0]); m.bond(c, o1, 2);
  const o2 = m.at('O', polar(1.34, -30)); m.bond(c, o2);
  const h = m.at('H', add(m.p(o2), polar(.97, 43))); m.bond(o2, h);
  const hc = m.at('H', polar(1.09, 210)); m.bond(c, hc);
  X.HCOOH = { n: 'Ácido metanoico (fórmico)', f: 'HCOOH', g: 'Trigonal plana (COOH)', ang: '120°', pol: 'Polar', a: m.a, b: m.b, lp: [[1, .87, .5, 0], [1, -.87, .5, 0], [2, .2, -.6, .77], [2, .2, -.6, -.77]] };
})();
// Etanal (acetaldehído)
(() => {
  const m = B(); const c2 = m.at('C', [0, 0, 0]); const o = m.at('O', [0, 1.21, 0]); m.bond(c2, o, 2);
  const c1 = m.at('C', polar(1.5, 210)); m.bond(c2, c1);
  const h = m.at('H', polar(1.1, -30)); m.bond(c2, h);
  m.sp3(c1, 3, 'H', 1.09, [0, -1, 0]);
  X.CH3CHO = { n: 'Etanal (acetaldehído)', f: 'CH3CHO', g: 'Trigonal plana (CHO)', ang: '120°', pol: 'Polar', a: m.a, b: m.b, lp: [[1, .87, .5, 0], [1, -.87, .5, 0]] };
})();
// Acetato de etilo
(() => {
  const m = B();
  const c1 = m.at('C', [0, 0, 0]);
  const c2 = m.at('C', add(m.p(c1), polar(1.5, 30))); m.bond(c1, c2);
  const o2 = m.at('O', add(m.p(c2), polar(1.34, -30))); m.bond(c2, o2);
  const c3 = m.at('C', add(m.p(o2), polar(1.45, 30))); m.bond(o2, c3);
  const c4 = m.at('C', add(m.p(c3), polar(1.52, -30))); m.bond(c3, c4);
  const o1 = m.at('O', add(m.p(c2), [0, 1.21, 0])); m.bond(c2, o1, 2);
  m.sp3(c1, 3, 'H', 1.09, [-1, -.3, 0]); m.sp3(c3, 2); m.sp3(c4, 3, 'H', 1.09, [1, -.3, 0]);
  X.CH3COOC2H5 = { n: 'Etanoato de etilo (acetato de etilo)', f: 'CH3COOC2H5', g: 'Trigonal plana (éster)', ang: '120°', pol: 'Polar', a: m.a, b: m.b, lp: [] };
})();
// Glucosa (β-D-glucopiranosa, silla aproximada)
(() => {
  const m = B(); const R = 1.47; const ring = [];
  // orden: O5, C1, C2, C3, C4, C5
  const syms = ['O', 'C', 'C', 'C', 'C', 'C'];
  const sgn = [];
  for (let k = 0; k < 6; k++) {
    const th = (k * 60 + 90) * Math.PI / 180; const s = k % 2 ? .25 : -.25; sgn.push(s > 0 ? 1 : -1);
    ring.push(m.at(syms[k], [R * Math.cos(th), R * Math.sin(th), s]));
  }
  for (let k = 0; k < 6; k++) m.bond(ring[k], ring[(k + 1) % 6]);
  const radial = k => { const p = m.p(ring[k]); return nrm([p[0], p[1], 0]); };
  const eq = k => nrm(add(radial(k), [0, 0, -.33 * sgn[k]]));
  const ax = k => [0, 0, sgn[k]];
  // sustituyentes: C1-C4: OH ecuatorial y H axial; C5: CH2OH ecuatorial y H axial
  for (let k = 1; k <= 5; k++) {
    const c = ring[k], pc = m.p(c);
    const h = m.at('H', add(pc, mul(ax(k), 1.09))); m.bond(c, h);
    if (k < 5) {
      const o = m.at('O', add(pc, mul(eq(k), 1.43))); m.bond(c, o);
      const hh = m.at('H', add(m.p(o), mul(nrm(add(eq(k), [0, 0, .9 * sgn[k]])), .96))); m.bond(o, hh);
    } else {
      const c6 = m.at('C', add(pc, mul(eq(k), 1.52))); m.bond(c, c6);
      const o6 = m.at('O', add(m.p(c6), mul(nrm(add(eq(k), [0, 0, -.9 * sgn[k]])), 1.43))); m.bond(c6, o6);
      const h6 = m.at('H', add(m.p(o6), mul(nrm(add(eq(k), [.4, .4, .6])), .96))); m.bond(o6, h6);
      m.sp3(c6, 2);
    }
  }
  X.C6H12O6 = { n: 'Glucosa', f: 'C6H12O6', g: 'Anillo de seis (silla)', ang: '≈109°', pol: 'Polar', a: m.a, b: m.b, lp: [] };
})();
// Ozono, dióxido de azufre, dióxido de nitrógeno
X.O3 = { n: 'Ozono', f: 'O3', g: 'Angular', ang: '117°', pol: 'Polar', a: [['O', 0, .22, 0], ['O', 1.089, -.449, 0], ['O', -1.089, -.449, 0]], b: [[0, 1, 2], [0, 2, 1]], lp: [[0, 0, 1, 0]] };
X.SO2 = { n: 'Dióxido de azufre', f: 'SO2', g: 'Angular', ang: '119°', pol: 'Polar', a: [['S', 0, .24, 0], ['O', 1.232, -.486, 0], ['O', -1.232, -.486, 0]], b: [[0, 1, 2], [0, 2, 2]], lp: [[0, 0, 1, 0]] };
X.NO2 = { n: 'Dióxido de nitrógeno', f: 'NO2', g: 'Angular', ang: '134°', pol: 'Polar', a: [['N', 0, .16, 0], ['O', 1.105, -.309, 0], ['O', -1.105, -.309, 0]], b: [[0, 1, 2], [0, 2, 1]], lp: [] };
// Ácido sulfúrico
X.H2SO4 = { n: 'Ácido sulfúrico', f: 'H2SO4', g: 'Tetraédrica (S)', ang: '≈109°', pol: 'Polar', a: [['S', 0, 0, 0], ['O', 1.167, .825, 0], ['O', -1.167, .825, 0], ['O', 0, -.906, 1.281], ['O', 0, -.906, -1.281], ['H', .78, -1.10, 1.82], ['H', -.78, -1.10, -1.82]], b: [[0, 1, 2], [0, 2, 2], [0, 3, 1], [0, 4, 1], [3, 5, 1], [4, 6, 1]], lp: [] };
// Monóxido de carbono, trióxido de azufre, cloro, peróxido
X.CO = { n: 'Monóxido de carbono', f: 'CO', g: 'Lineal', ang: '180°', pol: 'Polar (débil)', a: [['C', -.564, 0, 0], ['O', .564, 0, 0]], b: [[0, 1, 3]], lp: [[0, -1, 0, 0], [1, 1, 0, 0]] };
X.SO3 = { n: 'Trióxido de azufre', f: 'SO3', g: 'Trigonal plana', ang: '120°', pol: 'Apolar', a: [['S', 0, 0, 0]].concat([90, 210, 330].map(d => ['O'].concat(polar(1.42, d)))), b: [[0, 1, 2], [0, 2, 2], [0, 3, 2]], lp: [] };
X.Cl2 = { n: 'Cloro', f: 'Cl2', g: 'Lineal', ang: '180°', pol: 'Apolar', a: [['Cl', -.995, 0, 0], ['Cl', .995, 0, 0]], b: [[0, 1, 1]], lp: [[0, -.33, .94, 0], [0, -.33, -.47, .82], [0, -.33, -.47, -.82], [1, .33, .94, 0], [1, .33, -.47, .82], [1, .33, -.47, -.82]] };
(() => {
  const m = B(); const o1 = m.at('O', [-.737, 0, 0]), o2 = m.at('O', [.737, 0, 0]); m.bond(o1, o2);
  const a1 = 102 * Math.PI / 180, dh = 112 * Math.PI / 180;
  const h1 = m.at('H', add(m.p(o1), mul([-Math.cos(Math.PI - a1), Math.sin(Math.PI - a1), 0], .95))); m.bond(o1, h1);
  const h2d = [Math.cos(Math.PI - a1), Math.sin(Math.PI - a1) * Math.cos(dh), Math.sin(Math.PI - a1) * Math.sin(dh)];
  const h2 = m.at('H', add(m.p(o2), mul(h2d, .95))); m.bond(o2, h2);
  X.H2O2 = { n: 'Peróxido de hidrógeno (agua oxigenada)', f: 'H2O2', g: 'Angular (cada O)', ang: '≈102°', pol: 'Polar', a: m.a, b: m.b, lp: [] };
})();
// Dimetil éter
(() => {
  const m = B(); const o = m.at('O', [0, .3, 0]);
  const c1 = m.at('C', add(m.p(o), polar(1.41, 180 + 34))); const c2 = m.at('C', add(m.p(o), polar(1.41, -34)));
  m.bond(o, c1); m.bond(o, c2);
  m.sp3(c1, 3, 'H', 1.09, [-1, 0, 0]); m.sp3(c2, 3, 'H', 1.09, [1, 0, 0]);
  X.CH3OCH3 = { n: 'Metoximetano (dimetil éter)', f: 'CH3OCH3', g: 'Angular (O)', ang: '≈112°', pol: 'Polar', a: m.a, b: m.b, lp: [[0, 0, .6, .8], [0, 0, .6, -.8]] };
})();
// 1-propanol y 2-propanol
(() => {
  const m = B();
  const c1 = m.at('C', [-1.915, -.43, 0]), c2 = m.at('C', [-.638, .43, 0]), c3 = m.at('C', [.638, -.43, 0]);
  const o = m.at('O', [1.83, .38, 0]); m.bond(c1, c2); m.bond(c2, c3); m.bond(c3, o);
  const h = m.at('H', add(m.p(o), polar(.96, -40))); m.bond(o, h);
  m.sp3(c1, 3, 'H', 1.09, [-1, -1, 0]); m.sp3(c2, 2); m.sp3(c3, 2);
  X.C3H7OH = { n: '1-propanol', f: 'C3H7OH', g: 'Tetraédrica (cada C)', ang: '≈109°', pol: 'Polar', a: m.a, b: m.b, lp: [] };
})();
(() => {
  const m = B(); const c2 = m.at('C', [0, 0, 0]);
  const c1 = m.at('C', [-1.26, -.89, 0]), c3 = m.at('C', [1.26, -.89, 0]); m.bond(c2, c1); m.bond(c2, c3);
  const o = m.at('O', [0, .72, 1.19]); m.bond(c2, o);
  const hc = m.at('H', [0, .64, -.88]); m.bond(c2, hc);
  const h = m.at('H', add(m.p(o), [0, .93, .25])); m.bond(o, h);
  m.sp3(c1, 3, 'H', 1.09, [-1, 0, 0]); m.sp3(c3, 3, 'H', 1.09, [1, 0, 0]);
  X.iC3H7OH = { n: '2-propanol (alcohol isopropílico)', f: 'C3H7OH', g: 'Tetraédrica (cada C)', ang: '≈109°', pol: 'Polar', a: m.a, b: m.b, lp: [] };
})();
// Hidróxido de calcio (aproximado: Ca²⁺ con dos OH⁻)
X.CaOH2 = { n: 'Hidróxido de calcio (cal apagada)', f: 'Ca(OH)2', g: 'Iónico (Ca²⁺ y 2 OH⁻)', ang: '—', pol: 'Iónico', a: [['Ca', 0, 0, 0], ['O', -2.05, -.4, 0], ['O', 2.05, -.4, 0], ['H', -2.95, -.7, 0], ['H', 2.95, -.7, 0]], b: [[0, 1, 0], [0, 2, 0], [1, 3, 1], [2, 4, 1]], lp: [], lab: ['Ca²⁺', 'OH⁻', 'OH⁻', '', ''], rad: [.5, 0, 0, 0, 0] };
// Carbonato de calcio (aproximado)
X.CaCO3 = { n: 'Carbonato de calcio', f: 'CaCO3', g: 'Iónico (Ca²⁺ y CO₃²⁻)', ang: '120°', pol: 'Iónico', a: [['C', .6, 0, 0], ['O', .6, 1.28, 0], ['O', 1.71, -.64, 0], ['O', -.51, -.64, 0], ['Ca', -2.2, -.9, 0]], b: [[0, 1, 2], [0, 2, 1], [0, 3, 1], [3, 4, 0]], lp: [], lab: ['', '', '', 'CO₃²⁻', 'Ca²⁺'], rad: [0, 0, 0, 0, .5] };

let done = false;
export function registerExtra() {
  if (done) return; done = true;
  Object.keys(X).forEach(k => { if (!M[k]) M[k] = X[k]; });
}
registerExtra();
export const EXTRA_KEYS = Object.keys(X);

/* ---------- geometría de respaldo para fórmulas sin modelo ---------- */
const METAL = c => c === 'am' || c === 'at' || c === 'tr' || c === 'mp';
const VAL = { H: 1, C: 4, N: 3, O: 2, S: 2, P: 3, B: 3, Si: 4, F: 1, Cl: 1, Br: 1 };
const SUP = { 1: '⁺', 2: '²⁺', 3: '³⁺' }, SUPN = { 1: '⁻', 2: '²⁻', 3: '³⁻' };
const DIRS = n => {
  const r = Math.PI / 180;
  if (n === 1) return [[1, 0, 0]];
  if (n === 2) return [[1, 0, 0], [-1, 0, 0]];
  if (n === 3) return [90, 210, 330].map(d => [Math.cos(d * r), Math.sin(d * r), 0]);
  if (n === 4) return [[0, 1, 0], [TET_S, -TET_C, 0], [-TET_S / 2, -TET_C, TET_S * .866], [-TET_S / 2, -TET_C, -TET_S * .866]];
  if (n === 5) return [[0, 1, 0], [0, -1, 0], [1, 0, 0], [-.5, 0, .866], [-.5, 0, -.866]];
  const b = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const out = []; for (let i = 0; i < n; i++) out.push(i < 6 ? b[i] : nrm([Math.cos(i), Math.sin(i * 1.7), Math.cos(i * 2.3)]));
  return out;
};
const blen = (a, b) => Math.max(.9, ((EL[a] ? EL[a].r3 : .4) + (EL[b] ? EL[b].r3 : .4)) * 1.75);

/** Construye una molécula aproximada para cualquier fórmula (VSEPR sencillo). */
export function makeMol(formula) {
  const cnt = parseF(formula); const els = Object.keys(cnt).filter(e => EL[e]);
  const total = els.reduce((s, e) => s + cnt[e], 0);
  const m = B();
  if (!total) return null;
  if (els.length === 1) {
    const e = els[0], n = cnt[e];
    if (n === 1) m.at(e, [0, 0, 0]);
    else if (n === 2) { const L = blen(e, e); m.at(e, [-L / 2, 0, 0]); m.at(e, [L / 2, 0, 0]); m.bond(0, 1, e === 'O' ? 2 : e === 'N' ? 3 : 1); }
    else if (METAL(EL[e].cat)) { // pequeño cúmulo metálico
      for (let i = 0; i < n; i++) m.at(e, [(i % 3 - 1) * 1.3, (Math.floor(i / 3) % 3 - 1) * 1.3, Math.floor(i / 9) * 1.3]);
    } else { const L = blen(e, e), R = L / (2 * Math.sin(Math.PI / n)); for (let i = 0; i < n; i++) { m.at(e, [R * Math.cos(i * 2 * Math.PI / n), R * Math.sin(i * 2 * Math.PI / n), i % 2 ? .3 : -.3]); if (i) m.bond(i - 1, i); } if (n > 2) m.bond(n - 1, 0); }
    return { n: formula, f: formula, g: '', ang: '', pol: '', a: m.a, b: m.b, lp: [] };
  }
  const nonH = els.filter(e => e !== 'H');
  const center = (nonH.length ? nonH : els).slice().sort((x, y) => (cnt[x] - cnt[y]) || ((EL[x].en || 0) - (EL[y].en || 0)))[0];
  const nc = cnt[center];
  const outer = []; els.forEach(e => { if (e !== center && e !== 'H') for (let i = 0; i < cnt[e]; i++) outer.push(e); });
  let hs = center === 'H' ? 0 : (cnt.H || 0);
  const hasO = outer.includes('O');
  const hOnCenter = hasO ? 0 : hs; // H van sobre O si hay O
  const cm = METAL(EL[center].cat);
  const ionic = cm && outer.some(e => !METAL(EL[e].cat));
  const lab = [];
  const f0 = ionic ? 1.25 : 1;
  const S = nc > 1 ? 2 * blen(center, outer[0] || 'H') * f0 * .92 : 0;
  const centers = []; for (let i = 0; i < nc; i++) centers.push(m.at(center, [(i - (nc - 1) / 2) * S, 0, 0]));
  const rest = outer.slice();
  // átomos puente entre centros vecinos (p. ej. Fe–O–Fe)
  if (nc > 1) for (let i = 0; i < nc - 1 && rest.length; i++) {
    const e = rest.shift(); const a = m.p(centers[i]), b = m.p(centers[i + 1]);
    const j = m.at(e, [(a[0] + b[0]) / 2, -.55, 0]); m.bond(centers[i], j, ionic && !METAL(EL[e].cat) ? 0 : 1); m.bond(centers[i + 1], j, ionic && !METAL(EL[e].cat) ? 0 : 1);
  }
  const groups = centers.map(() => []);
  rest.forEach((e, i) => groups[i % nc].push(e));
  for (let i = 0; i < hOnCenter; i++) groups[i % nc].push('H');
  centers.forEach((ci, k) => {
    const g = groups[k]; const n = g.length; let D = DIRS(n);
    const grp = GROUP(EL[center].z);
    if (nc > 1) D = n === 1 ? [[0, 1, 0]] : n === 2 ? [[0, .71, .71], [0, .71, -.71]] : n === 3 ? [[0, 1, 0], [0, -.5, .87], [0, -.5, -.87]] : D;
    else if (n === 2 && !cm && grp === 16) D = [polar(1, -38), polar(1, 218)];
    else if (n === 3 && !cm && grp === 15) D = [0, 120, 240].map(d => { const r = d * Math.PI / 180; return [Math.cos(r) * .94, -.33, Math.sin(r) * .94]; });
    g.forEach((e, q) => { const j = m.at(e, add(m.p(ci), mul(D[q], blen(center, e) * f0))); m.bond(ci, j, ionic && !METAL(EL[e].cat) ? 0 : 1); });
  });
  // H sobre los O externos
  if (hasO && hs) {
    const oIdx = m.a.map((x, i) => i).filter(i => m.a[i][0] === 'O');
    for (let i = 0; i < hs; i++) {
      const oi = oIdx[i % oIdx.length]; const d = m.dirs(oi); const u = d[0] || [1, 0, 0];
      const w = nrm(add(mul(u, -.35), mul(perpTo(mul(u, -1), [0, 0, 1]), .94)));
      const j = m.at('H', add(m.p(oi), mul(i >= oIdx.length ? mul(w, -1) : w, .96))); m.bond(oi, j, 1);
    }
  }
  // órdenes de enlace por valencia (solo covalente)
  if (!cm) {
    const deg = i => m.b.filter(b => b[0] === i || b[1] === i).reduce((s, b) => s + b[2], 0);
    const val = (i) => { const s = m.a[i][0]; let v = VAL[s] || 1; if (i < nc && hasO && (s === 'S' || s === 'P')) v = s === 'S' ? 6 : 5; if (i < nc && hasO && s === 'N') v = 4; return v; };
    for (let pass = 0; pass < 2; pass++) m.b.forEach(b => {
      const [i, j] = b; if (b[2] === 0) return;
      if (deg(i) < val(i) && deg(j) < val(j) && m.a[i][0] !== 'H' && m.a[j][0] !== 'H') b[2]++;
    });
  }
  // etiquetas de iones (solo binarios)
  if (ionic && els.length === 2) {
    const an = els.find(e => e !== center), qa = 18 - GROUP(EL[an].z);
    const zc = GROUP(EL[center].z); let qc = zc <= 2 ? zc : zc === 13 ? 3 : (cnt[an] * qa) / nc;
    if (!(qc >= 1 && qc <= 3 && qc === Math.round(qc))) qc = 0;
    m.a.forEach((a, i) => {
      const e = a[0];
      if (e === center) lab[i] = e + (SUP[qc] || '');
      else lab[i] = e + (SUPN[qa] || '');
    });
  }
  const rad = ionic && els.length === 2 ? m.a.map(a => a[0] === center ? EL[center].r3 * .8 : EL[a[0]].r3 * 1.45) : null;
  const out = { n: formula, f: formula, g: '', ang: '', pol: ionic ? 'Iónico' : '', a: m.a, b: m.b, lp: [] };
  if (lab.length) out.lab = lab;
  if (rad) out.rad = rad;
  return out;
}

/** Molécula para una clave o fórmula: usa M si existe y su composición coincide, si no una aproximada. */
export function molFor(key) {
  const k = String(key).trim();
  const m = M[k];
  if (m) {
    const want = parseF(m.f), got = {};
    m.a.forEach(a => { got[a[0]] = (got[a[0]] || 0) + 1; });
    const same = Object.keys(want).every(e => want[e] === got[e]) && Object.keys(got).every(e => want[e] === got[e]);
    if (same) return m;
    if (k === 'NaCl') return M.NaClp;
  }
  return makeMol(m ? m.f : k);
}
/** Composición de una clave (usa M[k].f si existe). */
export function compOf(key) { const m = M[String(key).trim()]; return parseF(m ? m.f : String(key)); }
