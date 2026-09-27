// Escena 2D: gráficas animadas con ejes rotulados (ver SPEC.md, "graph").
// Se dibuja en píxeles reales (viewBox = tamaño del escenario) para que el texto sea nítido y legible en cualquier ancho.
import { fmt, esc, reduce } from '../widgets.js';

const NS = 'http://www.w3.org/2000/svg';
const C = { a: '#7FB2EA', b: '#F2A65A', c: '#6FD19A', d: '#F0897F', e: '#AE98EA', f: '#E7B460', ink: '#E6ECF1', mute: '#9AA8B3' };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = (x) => { x = clamp(x); return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; };
const lerp = (a, b, f) => a + (b - a) * f;
const f1 = (v, d = 1) => fmt(v, d);
const sub = (s) => esc(s).replace(/_(\d+)/g, '<tspan baseline-shift="sub" font-size="75%">$1</tspan>');

/* ---------- marco de ejes ---------- */
function frame(W, H, o) {
  const sm = W < 560;
  const m = { l: o.ml != null ? o.ml : sm ? 50 : 62, r: o.mr != null ? o.mr : 18, t: 46, b: sm ? 42 : 48 };
  const X0 = m.l, X1 = W - m.r, Y0 = H - m.b, Y1 = m.t;
  const sx = (v) => X0 + ((v - o.x[0]) / (o.x[1] - o.x[0])) * (X1 - X0);
  const sy = (v) => Y0 - ((v - o.y[0]) / (o.y[1] - o.y[0])) * (Y0 - Y1);
  const ix = (px) => o.x[0] + ((px - X0) / (X1 - X0)) * (o.x[1] - o.x[0]);
  const iy = (py) => o.y[0] + ((Y0 - py) / (Y0 - Y1)) * (o.y[1] - o.y[0]);
  let h = '';
  (o.yt || []).forEach((v) => { h += '<line class="sc-g-grid" x1="' + X0 + '" x2="' + X1 + '" y1="' + sy(v) + '" y2="' + sy(v) + '"/>' + (o.noYLabels ? '' : '<text class="sc-g-tk" x="' + (X0 - 8) + '" y="' + (sy(v) + 4) + '" text-anchor="end">' + (o.fy ? o.fy(v) : f1(v)) + '</text>'); });
  (o.xt || []).forEach((v) => { h += '<line class="sc-g-grid" y1="' + Y1 + '" y2="' + Y0 + '" x1="' + sx(v) + '" x2="' + sx(v) + '"/>' + (o.noXLabels ? '' : '<text class="sc-g-tk" y="' + (Y0 + 17) + '" x="' + sx(v) + '" text-anchor="middle">' + (o.fx ? o.fx(v) : f1(v)) + '</text>'); });
  h += '<path class="sc-g-ax" d="M' + X0 + ' ' + (Y1 - 6) + 'V' + Y0 + 'H' + (X1 + 4) + '"/>';
  h += '<text class="sc-g-al" x="' + (X0 + X1) / 2 + '" y="' + (H - 8) + '" text-anchor="middle">' + sub(o.xl) + '</text>';
  h += '<text class="sc-g-al" transform="translate(' + (sm ? 13 : 16) + ' ' + (Y0 + Y1) / 2 + ') rotate(-90)" text-anchor="middle">' + sub(o.yl) + '</text>';
  return { sx, sy, ix, iy, X0, X1, Y0, Y1, html: h, sm };
}
const path = (pts) => 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L');
const fpath = (F, f, a, b, n = 120) => path(Array.from({ length: n + 1 }, (_, i) => { const v = a + ((b - a) * i) / n; return [F.sx(v), F.sy(f(v))]; }));
/** interpolación monótona suave entre datos (x creciente) */
function smooth(data) {
  return (x) => {
    if (x <= data[0][0]) return data[0][1];
    for (let i = 1; i < data.length; i++) if (x <= data[i][0]) {
      const [x0, y0] = data[i - 1], [x1, y1] = data[i];
      const m0 = i > 1 ? (y1 - data[i - 2][1]) / (x1 - data[i - 2][0]) : (y1 - y0) / (x1 - x0);
      const m1 = i < data.length - 1 ? (data[i + 1][1] - y0) / (data[i + 1][0] - x0) : (y1 - y0) / (x1 - x0);
      const h = x1 - x0, t = (x - x0) / h, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * h * m0 + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * h * m1;
    }
    return data[data.length - 1][1];
  };
}
const draw = (d, c, o = {}) => '<path class="sc-g-draw' + (o.cls ? ' ' + o.cls : '') + '" d="' + d + '" fill="none" stroke="' + c + '" stroke-width="' + (o.w || 3) + '" stroke-linecap="round" stroke-linejoin="round"' + (o.dash ? ' data-dash="' + o.dash + '"' : '') + ' style="--dl:' + (o.dl || 0) + 's;--dd:' + (o.dd || 1.4) + 's"' + (o.op ? ' opacity="' + o.op + '"' : '') + '/>';
const lbl = (x, y, t, c, o = {}) => '<text class="sc-g-lb sc-g-in" x="' + x + '" y="' + y + '" text-anchor="' + (o.a || 'middle') + '" fill="' + c + '" style="--dl:' + (o.dl || 0) + 's"' + (o.fs ? ' font-size="' + o.fs + '"' : '') + '>' + sub(t) + '</text>';
const marker = (c) => '<g class="gm"><line class="sc-g-guide gm-gx"/><line class="sc-g-guide gm-gy"/><circle class="gm-c" r="7" fill="' + c + '" stroke="#0E161C" stroke-width="2.5"/><g class="gm-r"><rect rx="6" fill="rgba(14,22,28,.9)" stroke="' + c + '" stroke-width="1.2"/><text class="sc-g-lb" fill="#fff" style="stroke:none"></text></g></g>';

/** coloca el marcador: punto (x,y), guías hacia los ejes y una etiqueta */
function placeMarker(svg, F, x, y, text, o = {}) {
  const g = svg.querySelector('.gm');
  if (!g) return;
  const set = (el, a) => { for (const k in a) el.setAttribute(k, a[k]); };
  g.style.opacity = o.hide ? 0 : 1;
  set(g.querySelector('.gm-c'), { cx: x, cy: y });
  set(g.querySelector('.gm-gx'), { x1: x, y1: y, x2: x, y2: F.Y0, opacity: o.noGuides ? 0 : 1 });
  set(g.querySelector('.gm-gy'), { x1: F.X0, y1: y, x2: x, y2: y, opacity: o.noGuides ? 0 : 1 });
  const r = g.querySelector('.gm-r'), tx = r.querySelector('text'), rc = r.querySelector('rect');
  if (tx.textContent !== text) tx.textContent = text;
  const w = (tx.getComputedTextLength ? tx.getComputedTextLength() : text.length * 7) + 16, h = 24;
  let bx = x + 12, by = y - h - 10;
  if (bx + w > F.X1 + 10) bx = Math.max(F.X0 + 6, x - w - 12);
  if (by < F.Y1 - 30) by = y + 12;
  set(rc, { x: bx, y: by, width: w, height: h });
  set(tx, { x: bx + 8, y: by + 16.5 });
}

/* ---------- tipos ---------- */
const K = {};

K.heating = {
  tag: 'Curva de calentamiento del agua',
  build(W, H, st) {
    const F = frame(W, H, { x: [0, 20], y: [-20, 120], xt: [0, 5, 10, 15, 20], yt: [-20, 0, 20, 40, 60, 80, 100, 120], xl: 'Tiempo de calentamiento (min)', yl: 'Temperatura (°C)' });
    const pts = (b) => { const t1 = 5 + (7 * (b + 0) / 100); return [[0, -20], [2, 0], [5, 0], [t1, b], [t1 + 5, b], [t1 + 7, b + 20]]; };
    const bog = st.mark != null && st.mark !== 100 ? clamp(+st.mark, 60, 110) : null;
    const main = pts(100), alt = bog != null ? pts(bog) : null;
    const P = (a) => path(a.map(([x, y]) => [F.sx(x), F.sy(y)]));
    const ph = [['Sólido', 1, -10, 'start'], ['Fusión', 3.5, 0], ['Líquido', 8.5, 50], ['Ebullición', 14.5, 100], ['Gas', 18.2, 110]];
    let h = F.html;
    const bp = (alt || main)[3][0];
    h += '<rect x="' + F.sx(2) + '" y="' + F.Y1 + '" width="' + (F.sx(5) - F.sx(2)) + '" height="' + (F.Y0 - F.Y1) + '" fill="rgba(127,178,234,.07)" class="sc-g-in"/>';
    h += '<rect x="' + F.sx(bp) + '" y="' + F.Y1 + '" width="' + (F.sx(bp + 5) - F.sx(bp)) + '" height="' + (F.Y0 - F.Y1) + '" fill="rgba(240,137,127,.07)" class="sc-g-in"/>';
    h += draw(P(main), bog != null ? '#5E7C99' : C.a, { w: bog != null ? 2.5 : 3.5, cls: bog != null ? '' : 'gp' });
    if (alt) {
      h += draw(P(alt), C.b, { w: 3.5, dl: 0.4, cls: 'gp' });
      h += '<line class="sc-g-guide sc-g-in" x1="' + F.X0 + '" x2="' + F.X1 + '" y1="' + F.sy(bog) + '" y2="' + F.sy(bog) + '" style="--dl:1.2s;stroke:' + C.b + '"/>';
      h += lbl(F.sx(pts(bog)[3][0]) + 6, F.sy(bog) + 18, Math.round(bog) === 92 ? 'Bogotá ≈ 92 °C' : 'Ebullición a ' + f1(bog) + ' °C', C.b, { a: 'start', dl: 1.3 });
      h += lbl(F.sx(14.5), F.sy(100) - 8, F.sm ? 'Nivel del mar' : 'Nivel del mar: 100 °C', '#8FB3D6', { dl: 1 });
    }
    ph.forEach(([t, x, y, a], i) => { if (t === 'Ebullición' && alt) return; if (t === 'Gas') x = Math.min(18.2, (alt || main)[4][0] + 1.4); h += lbl(F.sx(x), F.sy(y) - 10, t, C.ink, { a: a || 'middle', dl: 0.5 + i * 0.2 }); });
    h += marker(alt ? C.b : C.a);
    return { html: h, F, run: 'loop' };
  },
  ball(svg, F, p) { const y = F.iy(p.y); return Math.round(y) + ' °C'; },
};

function gasLaw(o) {
  return {
    tag: o.tag,
    build(W, H, st) {
      const F = frame(W, H, o.frame);
      let h = F.html;
      if (o.dashTo) h += draw(fpath(F, o.f, o.frame.x[0], o.dashTo), '#5E7C99', { w: 2.2, dash: '6 6' }) + lbl(F.sx(o.dashTo * 0.45), F.sy(o.f(o.dashTo * 0.45)) + 18, 'extrapolación', '#8FB3D6', { a: 'start', dl: 1.2, fs: 11 });
      h += draw(fpath(F, o.f, o.dashTo || o.a, o.b), C.a, { w: 3.5, cls: 'gp' });
      if (o.area) h += '<rect class="gm-area" fill="rgba(127,178,234,.12)" stroke="rgba(127,178,234,.35)"/>';
      h += lbl(o.lx(F), o.ly(F), o.note, '#C3CFD8', { a: o.la || 'start', dl: 1.2 });
      h += marker(C.f);
      return { html: h, F, run: st.mark == null ? 'sweep' : 'mark' };
    },
    at: (F, v) => { v = clamp(v, o.a, o.b); return [F.sx(v), F.sy(o.f(v)), o.read(v)]; },
    range: [o.a, o.b],
    area: o.area,
  };
}
K.boyle = gasLaw({
  tag: 'Ley de Boyle · temperatura constante',
  frame: { x: [0, 6], y: [0, 12], xt: [0, 1, 2, 3, 4, 5, 6], yt: [0, 2, 4, 6, 8, 10, 12], xl: 'Volumen (L)', yl: 'Presión (atm)' },
  f: (v) => 6 / v, a: 0.5, b: 6, area: true,
  read: (v) => 'V = ' + f1(v) + ' L · P = ' + f1(6 / v) + ' atm',
  note: 'P · V = constante', lx: (F) => F.sx(3.2), ly: (F) => F.sy(7.5),
});
K.charles = gasLaw({
  tag: 'Ley de Charles · presión constante',
  frame: { x: [0, 500], y: [0, 5], xt: [0, 100, 200, 273, 400, 500], yt: [0, 1, 2, 3, 4, 5], xl: 'Temperatura (K)', yl: 'Volumen (L)' },
  f: (T) => T / 100, a: 150, b: 500, dashTo: 150,
  read: (T) => 'T = ' + Math.round(T) + ' K (' + Math.round(T - 273) + ' °C) · V = ' + f1(T / 100) + ' L',
  note: 'V / T = constante', lx: (F) => F.sx(320), ly: (F) => F.sy(0.9),
});
K.gaylussac = gasLaw({
  tag: 'Ley de Gay-Lussac · volumen constante',
  frame: { x: [0, 500], y: [0, 2], xt: [0, 100, 200, 273, 400, 500], yt: [0, 0.5, 1, 1.5, 2], xl: 'Temperatura (K)', yl: 'Presión (atm)', fy: (v) => f1(v) },
  f: (T) => T / 250, a: 150, b: 500, dashTo: 150,
  read: (T) => 'T = ' + Math.round(T) + ' K · P = ' + f1(T / 250, 2) + ' atm',
  note: 'P / T = constante', lx: (F) => F.sx(320), ly: (F) => F.sy(0.36),
});

const SOL = {
  KNO3: ['KNO_3', C.a, [13.3, 20.9, 31.6, 45.8, 63.9, 85.5, 110, 138, 169, 202, 246]],
  NaCl: ['NaCl', C.c, [35.7, 35.8, 36, 36.3, 36.6, 37, 37.3, 37.8, 38.4, 39, 39.8]],
  azucar: ['Azúcar', C.f, [179, 190, 204, 219, 238, 260, 287, 320, 362, 415, 487]],
  KCl: ['KCl', C.e, [27.6, 31, 34, 37, 40, 42.6, 45.5, 48.3, 51.1, 54, 56.7]],
  NaNO3: ['NaNO_3', C.d, [73, 80, 88, 96, 104, 114, 124, 134, 148, 161, 180]],
};
const SOLK = (k) => ({ azúcar: 'azucar', sugar: 'azucar', sacarosa: 'azucar', C12H22O11: 'azucar', Azúcar: 'azucar' }[k] || k);
K.solubility = {
  tag: 'Curvas de solubilidad',
  build(W, H, st) {
    const keys = [].concat(st.curves || ['KNO3', 'NaCl', 'azucar']).map(SOLK).filter((k) => SOL[k]);
    if (!keys.length) keys.push('KNO3', 'NaCl');
    const top = Math.max(...keys.map((k) => SOL[k][2][10]));
    const ymax = top > 300 ? 500 : top > 200 ? 260 : top > 100 ? 200 : 100;
    const step = ymax >= 500 ? 100 : ymax > 200 ? 50 : ymax > 100 ? 40 : 20;
    const yt = []; for (let v = 0; v <= ymax + 0.1; v += step) yt.push(v);
    const F = frame(W, H, { x: [0, 100], y: [0, ymax], xt: [0, 20, 40, 60, 80, 100], yt, xl: 'Temperatura (°C)', yl: 'g / 100 g de agua', mr: W < 560 ? 58 : 76, fy: (v) => fmt(v, 0) });
    let h = F.html;
    const fns = {};
    let ly = [];
    keys.forEach((k, i) => {
      const [n, c, d] = SOL[k];
      const f = smooth(d.map((v, j) => [j * 10, v]));
      fns[k] = f;
      h += draw(fpath(F, f, 0, 100), c, { w: 3.2, dl: i * 0.25 });
      ly.push([F.sy(d[10]), n, c, i]);
    });
    ly.sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < ly.length; i++) if (ly[i][0] - ly[i - 1][0] < 16) ly[i][0] = ly[i - 1][0] + 16;
    ly.forEach(([y, n, c, i]) => { h += lbl(F.X1 + 8, y + 4, n, c, { a: 'start', dl: 1 + i * 0.25 }); });
    h += '<g class="gs-mk" style="opacity:0"><line class="sc-g-guide gs-v" y1="' + F.Y1 + '" y2="' + F.Y0 + '"/>' + keys.map((k) => '<circle class="gs-d" data-k="' + k + '" r="5.5" fill="' + SOL[k][1] + '" stroke="#0E161C" stroke-width="2"/>').join('') + '<g class="gs-r"></g></g>';
    return { html: h, F, run: 'mark', fns, keys };
  },
};
K.solubility.mark = (svg, F, v, R) => {
  const g = svg.querySelector('.gs-mk');
  if (v == null) { g.style.opacity = 0; return; }
  g.style.opacity = 1;
  v = clamp(v, 0, 100);
  const x = F.sx(v);
  const ln = g.querySelector('.gs-v'); ln.setAttribute('x1', x); ln.setAttribute('x2', x);
  let items = [];
  g.querySelectorAll('.gs-d').forEach((d) => { const k = d.dataset.k, y = F.sy(R.fns[k](v)); d.setAttribute('cx', x); d.setAttribute('cy', y); items.push([y, k]); });
  const box = g.querySelector('.gs-r');
  const lines = ['A ' + Math.round(v) + ' °C'].concat(R.keys.map((k) => SOL[k][0].replace('_3', '₃') + ': ' + fmt(R.fns[k](v), 0) + ' g'));
  const w = F.sm ? 118 : 138, lh = 17, hh = lines.length * lh + 10;
  let bx = x + 12; if (bx + w > F.X1) bx = Math.max(F.X0 + 6, x - w - 12);
  const by = F.Y1 + 4;
  box.innerHTML = '<rect x="' + bx + '" y="' + by + '" width="' + w + '" height="' + hh + '" rx="7" fill="rgba(14,22,28,.9)" stroke="rgba(154,168,179,.35)"/>' +
    lines.map((t, i) => '<text x="' + (bx + 9) + '" y="' + (by + 18 + i * lh) + '" font-size="' + (F.sm ? 11.5 : 12.5) + '" font-weight="' + (i ? 500 : 700) + '" fill="' + (i ? SOL[R.keys[i - 1]][1] : '#fff') + '">' + esc(t) + '</text>').join('');
};

K.rate = {
  tag: 'Velocidad de reacción',
  build(W, H, st) {
    const F = frame(W, H, { x: [0, 20], y: [0, 1], xt: [0, 5, 10, 15, 20], yt: [0, 0.25, 0.5, 0.75, 1], xl: 'Tiempo (s)', yl: 'Concentración (mol/L)', fy: (v) => f1(v, 2) });
    const A = (t) => Math.exp(-0.2 * t), B = (t) => 1 - A(t);
    let h = F.html + draw(fpath(F, A, 0, 20), C.a, { w: 3.5, cls: 'gp' }) + draw(fpath(F, B, 0, 20), C.b, { w: 3.5, dl: 0.3 });
    h += lbl(F.sx(10.5), F.sy(A(10.5)) - 12, 'Reactivo', C.a, { a: 'start', dl: 1 }) + lbl(F.sx(19.6), F.sy(B(19.6)) - 12, 'Producto', C.b, { a: 'end', dl: 1.2 });
    h += '<line class="gr-tan" stroke="' + C.f + '" stroke-width="2.4" stroke-linecap="round"/>' + '<circle class="gr-b" r="6" fill="' + C.b + '" stroke="#0E161C" stroke-width="2"/>' + marker(C.a);
    return { html: h, F, run: st.mark == null ? 'sweep' : 'mark', A, B };
  },
  at: (F, v) => { v = clamp(v, 0.2, 19.5); return [F.sx(v), F.sy(Math.exp(-0.2 * v)), 't = ' + f1(v) + ' s · [A] = ' + f1(Math.exp(-0.2 * v), 2) + ' mol/L']; },
  range: [0.3, 19.5],
  extra(svg, F, v) {
    v = clamp(v, 0.2, 19.5);
    const a = Math.exp(-0.2 * v), s = -0.2 * a, dx = 3;
    const t = svg.querySelector('.gr-tan');
    t.setAttribute('x1', F.sx(v - dx)); t.setAttribute('y1', F.sy(a - s * dx)); t.setAttribute('x2', F.sx(v + dx)); t.setAttribute('y2', F.sy(a + s * dx));
    const b = svg.querySelector('.gr-b'); b.setAttribute('cx', F.sx(v)); b.setAttribute('cy', F.sy(1 - a));
  },
};

K.equilibrium = {
  tag: 'Equilibrio químico',
  build(W, H, st) {
    const tm = st.mark != null ? (st.mark >= 6 && st.mark <= 26 ? +st.mark : 16) : null;
    const k = 0.35, Ae = 0.35;
    const A0 = (t) => Ae + (1 - Ae) * Math.exp(-k * t), B0 = (t) => 1 - A0(t);
    const A = (t) => (tm == null || t < tm ? A0(t) : 0.525 + (A0(tm) + 0.5 - 0.525) * Math.exp(-k * (t - tm)));
    const B = (t) => (tm == null || t < tm ? B0(t) : 0.975 - (0.975 - B0(tm)) * Math.exp(-k * (t - tm)));
    const F = frame(W, H, { x: [0, 30], y: [0, 1.2], xt: [0, 5, 10, 15, 20, 25, 30], yt: [0, 0.3, 0.6, 0.9, 1.2], xl: 'Tiempo (s)', yl: 'Concentración (mol/L)', fy: (v) => f1(v, 1) });
    let h = F.html;
    const eqs = [[11, tm == null ? 30 : tm]];
    if (tm != null && tm + 11 < 30) eqs.push([tm + 11, 30]);
    eqs.forEach(([a, b], i) => { h += '<rect class="sc-g-in" x="' + F.sx(a) + '" y="' + F.Y1 + '" width="' + (F.sx(b) - F.sx(a)) + '" height="' + (F.Y0 - F.Y1) + '" fill="rgba(111,209,154,.09)" style="--dl:' + (1.2 + i * 0.4) + 's"/>' + lbl((F.sx(a) + F.sx(b)) / 2, F.Y1 + 16, 'Equilibrio', C.c, { dl: 1.3 + i * 0.4 }); });
    const seg = (f, a, b) => fpath(F, f, a, b, 120);
    if (tm == null) h += draw(seg(A, 0, 30), C.a, { w: 3.5 }) + draw(seg(B, 0, 30), C.b, { w: 3.5, dl: 0.2 });
    else {
      h += draw(seg(A, 0, tm) + 'L' + F.sx(tm) + ' ' + F.sy(A0(tm) + 0.5) + seg(A, tm + 0.001, 30).replace('M', 'L'), C.a, { w: 3.5 }) + draw(seg(B, 0, 30), C.b, { w: 3.5, dl: 0.2 });
      h += '<line class="sc-g-guide sc-g-in" x1="' + F.sx(tm) + '" x2="' + F.sx(tm) + '" y1="' + F.Y1 + '" y2="' + F.Y0 + '" style="--dl:1s;stroke:' + C.f + '"/>' + lbl(F.sx(tm) + 6, F.sy(A0(tm) + 0.5) - 4, 'Se agrega reactivo', C.f, { a: 'start', dl: 1.1 });
    }
    h += lbl(F.sx(0.8), F.sy(1) - 10, 'Reactivos', C.a, { a: 'start', dl: 0.9 }) + lbl(F.sx(0.8), F.sy(0.06) - 8, 'Productos', C.b, { a: 'start', dl: 1 });
    return { html: h, F, run: 'none' };
  },
};

K.energy = {
  tag: 'Diagrama de energía',
  build(W, H, st) {
    const endo = st.mark != null && st.mark > 0;
    const R = endo ? 0.25 : 0.5, Pp = endo ? 0.55 : 0.18, pk = 0.92, pkc = endo ? 0.72 : 0.72;
    const s = (x) => { const u = clamp((x - 0.3) / 0.4); return u * u * (3 - 2 * u); };
    const E = (p) => (x) => { const base = R + (Pp - R) * s(x), mid = R + (Pp - R) * 0.5; return base + (p - mid) * Math.exp(-Math.pow((x - 0.5) / 0.12, 2)); };
    const F = frame(W, H, { x: [0, 1], y: [0, 1.05], xt: [], yt: [], xl: 'Avance de la reacción', yl: 'Energía', noXLabels: true, noYLabels: true });
    let h = F.html;
    const dx = F.sm ? 0 : 0;
    h += draw(fpath(F, E(pk), 0, 1), C.a, { w: 3.5, cls: 'gp' }) + draw(fpath(F, E(pkc), 0, 1), C.c, { w: 3, dl: 0.6, dash: '8 6' });
    const arr = (x, y1, y2, c, dl) => '<g class="sc-g-in" style="--dl:' + dl + 's"><line x1="' + x + '" x2="' + x + '" y1="' + y1 + '" y2="' + y2 + '" stroke="' + c + '" stroke-width="2"/><path d="M' + (x - 5) + ' ' + (y2 + (y2 < y1 ? 8 : -8)) + 'L' + x + ' ' + y2 + 'L' + (x + 5) + ' ' + (y2 + (y2 < y1 ? 8 : -8)) + '" fill="none" stroke="' + c + '" stroke-width="2"/></g>';
    const xa = F.sx(0.5);
    h += '<line class="sc-g-guide sc-g-in" x1="' + F.sx(0.02) + '" x2="' + F.sx(0.62) + '" y1="' + F.sy(R) + '" y2="' + F.sy(R) + '" style="--dl:1s"/>';
    h += arr(xa - 10, F.sy(R), F.sy(pk) + 2, C.a, 1.2) + lbl(xa - 16, F.sy(R + (pk - R) * 0.62) + 4, 'Eₐ', C.a, { a: 'end', dl: 1.3 });
    h += arr(xa + 10, F.sy(R), F.sy(pkc) + 2, C.c, 1.5) + lbl(xa + 16, F.sy(R + (pkc - R) * 0.45) + 4, 'Eₐ', C.c, { a: 'start', dl: 1.6 });
    const lx = F.X0 + 16, ly = F.Y1 + 10;
    h += '<g class="sc-g-in" style="--dl:.8s"><line x1="' + lx + '" x2="' + (lx + 26) + '" y1="' + ly + '" y2="' + ly + '" stroke="' + C.a + '" stroke-width="3"/><text class="sc-g-lb" x="' + (lx + 34) + '" y="' + (ly + 4) + '" fill="' + C.a + '">Sin catalizador</text>' +
      '<line x1="' + lx + '" x2="' + (lx + 26) + '" y1="' + (ly + 20) + '" y2="' + (ly + 20) + '" stroke="' + C.c + '" stroke-width="3" stroke-dasharray="7 5"/><text class="sc-g-lb" x="' + (lx + 34) + '" y="' + (ly + 24) + '" fill="' + C.c + '">Con catalizador</text></g>';
    const xh = F.sx(0.9);
    h += '<line class="sc-g-guide sc-g-in" x1="' + F.sx(0.4) + '" x2="' + (xh + 10) + '" y1="' + F.sy(R) + '" y2="' + F.sy(R) + '" style="--dl:1.8s"/>';
    h += arr(xh, F.sy(R), F.sy(Pp) + (endo ? 2 : -2), C.d, 1.9) + lbl(xh - 8, F.sy((R + Pp) / 2) + 4, endo ? 'ΔH > 0' : 'ΔH < 0', C.d, { a: 'end', dl: 2 });
    h += lbl(F.sx(0.1), F.sy(R) - 10, 'Reactivos', C.ink, { dl: 0.8 }) + lbl(F.sx(0.86), F.sy(Pp) + (endo ? -10 : 20), 'Productos', C.ink, { dl: 1, a: 'end' });
    h += lbl(F.X1 - 4, F.Y1 + 14, endo ? 'Reacción endotérmica' : 'Reacción exotérmica', C.d, { a: 'end', dl: 2.1 });
    h += marker(C.f);
    return { html: h, F, run: 'loop' };
  },
  ball: () => null,
};

K.decay = {
  tag: 'Decaimiento radiactivo del carbono-14',
  build(W, H, st) {
    const T = 5730, N = (t) => 100 * Math.pow(0.5, t / T);
    const xt = [0, 1, 2, 3, 4, 5].map((k) => k * T);
    const F = frame(W, H, { x: [0, 5 * T], y: [0, 100], xt, yt: [0, 25, 50, 75, 100], xl: 'Tiempo (años)', yl: 'Carbono-14 que queda (%)', mr: W < 560 ? 30 : 26, fx: (v) => (W < 560 && v ? fmt(v / 1000, 1) + ' mil' : fmt(v, 0)), fy: (v) => v + ' %' });
    let h = F.html + draw(fpath(F, N, 0, 5 * T), C.e, { w: 3.5, cls: 'gp' });
    [1, 2, 3].forEach((k, i) => {
      const x = F.sx(k * T), y = F.sy(N(k * T));
      h += '<g class="sc-g-in" style="--dl:' + (1 + i * 0.35) + 's"><path class="sc-g-guide" d="M' + x + ' ' + F.Y0 + 'V' + y + 'H' + F.X0 + '"/><circle cx="' + x + '" cy="' + y + '" r="4.5" fill="' + C.e + '"/></g>' +
        '<g class="gd-hl" data-v="' + k * T + '" style="transition:opacity .3s">' + lbl(x + 8, y - 8, ['50 %', '25 %', '12,5 %'][i], '#D8CCF5', { a: 'start', dl: 1 + i * 0.35 }) + '</g>';
    });
    h += lbl(F.X1 - 4, F.Y1 + 14, 'Vida media = 5730 años', C.e, { a: 'end', dl: 1.2 });
    h += marker(C.f);
    return { html: h, F, run: st.mark == null ? 'sweep' : 'mark' };
  },
  at: (F, v) => { v = clamp(v, 0, 5 * 5730); const n = 100 * Math.pow(0.5, v / 5730); return [F.sx(v), F.sy(n), fmt(Math.round(v / 10) * 10, 0) + ' años · ' + fmt(n, 1) + ' %']; },
  range: [0, 5 * 5730],
  extra(svg, F, v) { svg.querySelectorAll('.gd-hl').forEach((g) => { g.style.opacity = Math.abs(v - +g.dataset.v) < 0.18 * 5730 ? 0 : 1; }); },
};

const PH = [['Jugo de limón', 2], ['Gaseosa', 3], ['Café', 5], ['Leche', 6.5], ['Agua pura', 7], ['Sangre', 7.4], ['Bicarbonato', 8.3], ['Jabón', 10], ['Blanqueador', 12.5], ['Destapador', 14]];
const PHC = ['#C0392B', '#E74C3C', '#EB6B34', '#F39C12', '#F4C430', '#D4D83A', '#A8D14F', '#4CAF50', '#2BA88A', '#1F9BB4', '#2D7FC1', '#3C5DB8', '#5344A8', '#5E3796', '#5A2A82'];
K.phscale = {
  tag: 'Escala de pH',
  build(W, H, st) {
    const sm = W < 560, L = sm ? 22 : 48, R = W - (sm ? 22 : 48);
    const sx = (v) => L + (v / 14) * (R - L);
    const by = Math.round(H * 0.52), bh = sm ? 26 : 32;
    const fs = sm ? 11 : 13, cw = fs * 0.56;
    let h = '<defs><linearGradient id="gph" x1="0" x2="1">' + PHC.map((c, i) => '<stop offset="' + (i / 14).toFixed(3) + '" stop-color="' + c + '"/>').join('') + '</linearGradient></defs>';
    h += '<rect class="sc-g-in" x="' + L + '" y="' + (by - bh / 2) + '" width="' + (R - L) + '" height="' + bh + '" rx="' + bh / 2 + '" fill="url(#gph)"/>';
    for (let i = 0; i <= 14; i++) h += '<text class="sc-g-in" x="' + sx(i) + '" y="' + (by + 4.5) + '" text-anchor="middle" font-size="' + (sm ? 11 : 13) + '" font-weight="700" fill="rgba(255,255,255,.92)" style="--dl:' + (0.03 * i) + 's">' + i + '</text>';
    // carriles de etiquetas (arriba y abajo) sin choques
    const lanes = [-1, 1, -2, 2, 3];
    const occ = {};
    PH.forEach(([n, v], i) => {
      const x = sx(v), w = n.length * fs * 0.6 + 10;
      const lx = clamp(x, L + w / 2 - 8, R - w / 2 + 8);
      const lane = lanes.find((ln) => !(occ[ln] || []).some(([a, b]) => lx - w / 2 < b + 6 && lx + w / 2 > a - 6)) || 3;
      (occ[lane] = occ[lane] || []).push([lx - w / 2, lx + w / 2]);
      const up = lane < 0, k = Math.abs(lane);
      const gap = sm ? 21 : 24, ly = up ? by - bh / 2 - 12 - (k - 1) * gap : by + bh / 2 + 20 + (k - 1) * gap;
      h += '<g class="sc-g-in" style="--dl:' + (0.5 + i * 0.08) + 's"><line x1="' + x + '" x2="' + x + '" y1="' + (up ? by - bh / 2 - 2 : by + bh / 2 + 2) + '" y2="' + (up ? ly + 4 : ly - 13) + '" stroke="rgba(195,207,216,.5)" stroke-width="1.2"/>' +
        '<circle cx="' + x + '" cy="' + (up ? by - bh / 2 - 3 : by + bh / 2 + 3) + '" r="2.5" fill="#E6ECF1"/>' +
        '<text class="sc-g-lb" x="' + lx + '" y="' + ly + '" text-anchor="middle" font-size="' + fs + '" fill="#E6ECF1">' + esc(n) + '</text></g>';
    });
    h += '<text class="sc-g-lb sc-g-in" x="' + L + '" y="' + (H - 12) + '" text-anchor="start" fill="#F0897F" style="--dl:.4s">← Ácido</text>' +
      '<text class="sc-g-lb sc-g-in" x="' + sx(7) + '" y="' + (H - 12) + '" text-anchor="middle" fill="#6FD19A" style="--dl:.4s">Neutro</text>' +
      '<text class="sc-g-lb sc-g-in" x="' + R + '" y="' + (H - 12) + '" text-anchor="end" fill="#AE98EA" style="--dl:.4s">Básico →</text>';
    const top = 40;
    h += '<g class="gp-m" style="opacity:0"><line x1="0" x2="0" y1="' + (top + 26) + '" y2="' + (by + bh / 2 + 4) + '" stroke="#fff" stroke-width="2" opacity=".85"/><path d="M0 ' + (by - bh / 2 + 2) + 'L-8 ' + (by - bh / 2 - 11) + 'H8Z" fill="#fff" stroke="#0E161C" stroke-width="2"/>' +
      '<rect class="gp-bx" x="-36" y="' + top + '" width="72" height="28" rx="8" fill="#fff"/><text class="gp-v" x="0" y="' + (top + 19.5) + '" text-anchor="middle" font-size="15" font-weight="800" fill="#0E161C"></text></g>';
    return { html: h, F: { sx, by, bh, L, R }, run: 'mark' };
  },
  mark(svg, F, v) {
    const g = svg.querySelector('.gp-m');
    if (v == null) { g.style.opacity = 0; return; }
    v = clamp(v, 0, 14);
    g.style.opacity = 1;
    g.setAttribute('transform', 'translate(' + F.sx(v) + ' 0)');
    const bx = g.querySelector('.gp-bx'), tv = g.querySelector('.gp-v'), off = clamp(F.sx(v), F.L + 26, F.R - 26) - F.sx(v);
    bx.setAttribute('x', off - 36); tv.setAttribute('x', off);
    const t = 'pH ' + fmt(v, 1);
    const tx = g.querySelector('.gp-v'); if (tx.textContent !== t) tx.textContent = t;
  },
};

K.dilution = {
  tag: 'Dilución',
  build(W, H, st) {
    const sm = W < 560;
    const f = st.mark != null && st.mark >= 1 ? Math.min(4, +st.mark) : 2;
    const bw = sm ? 104 : 140, bh = sm ? 150 : 190, base = H - (sm ? 44 : 50);
    const cx1 = W * (sm ? 0.25 : 0.27), cx2 = W * (sm ? 0.75 : 0.73);
    const beaker = (cx) => { const x = cx - bw / 2, y = base - bh; return '<path d="M' + (x - 6) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y + 6) + 'V' + (base - 8) + 'Q' + x + ' ' + base + ' ' + (x + 8) + ' ' + base + 'H' + (x + bw - 8) + 'Q' + (x + bw) + ' ' + base + ' ' + (x + bw) + ' ' + (base - 8) + 'V' + (y + 6) + 'Q' + (x + bw) + ' ' + y + ' ' + (x + bw + 4) + ' ' + (y - 2) + '" fill="rgba(190,216,234,.08)" stroke="#BFD8EA" stroke-width="3" stroke-linejoin="round"/>'; };
    const v1 = 0.22, lvl = (v) => base - 4 - (bh - 16) * v;
    let h = '<defs><clipPath id="gdc1"><rect x="' + (cx1 - bw / 2) + '" y="0" width="' + bw + '" height="' + base + '"/></clipPath><clipPath id="gdc2"><rect x="' + (cx2 - bw / 2) + '" y="0" width="' + bw + '" height="' + base + '"/></clipPath></defs>';
    h += '<rect x="' + (cx1 - bw / 2 + 2) + '" y="' + lvl(v1) + '" width="' + (bw - 4) + '" height="' + (base - lvl(v1) - 2) + '" rx="6" fill="#8E5BD6" opacity=".75"/>';
    h += '<rect class="gd-l2" x="' + (cx2 - bw / 2 + 2) + '" y="' + lvl(v1) + '" width="' + (bw - 4) + '" height="' + (base - lvl(v1) - 2) + '" rx="6" fill="#8E5BD6" opacity=".75"/>';
    h += '<g class="gd-p1"></g><g class="gd-p2"></g>';
    h += beaker(cx1) + beaker(cx2);
    h += '<text class="sc-g-lb" x="' + cx1 + '" y="' + (base - bh - 16) + '" text-anchor="middle" fill="#E6ECF1">Antes</text><text class="sc-g-lb" x="' + cx2 + '" y="' + (base - bh - 16) + '" text-anchor="middle" fill="#E6ECF1">Después</text>';
    const aw = sm ? 16 : 34;
    h += '<g class="sc-g-in" style="--dl:.3s"><path d="M' + (W / 2 - aw) + ' ' + (base - bh / 2) + 'H' + (W / 2 + aw - 4) + '" stroke="#7FB2EA" stroke-width="3"/><path d="M' + (W / 2 + aw - 12) + ' ' + (base - bh / 2 - 7) + 'L' + (W / 2 + aw - 2) + ' ' + (base - bh / 2) + 'L' + (W / 2 + aw - 12) + ' ' + (base - bh / 2 + 7) + '" fill="none" stroke="#7FB2EA" stroke-width="3"/>' +
      '<text class="sc-g-lb" x="' + W / 2 + '" y="' + (base - bh / 2 - 14) + '" text-anchor="middle" fill="#8CC8F2">+ agua</text></g>';
    const ml = 100;
    h += '<text class="sc-g-lb" x="' + cx1 + '" y="' + (base + 24) + '" text-anchor="middle" fill="#C3CFD8">' + ml + ' mL · 12 partículas</text>';
    h += '<text class="sc-g-lb gd-r" x="' + cx2 + '" y="' + (base + 24) + '" text-anchor="middle" fill="#C3CFD8"></text>';
    h += '<text class="sc-g-lb" x="' + cx1 + '" y="' + (base - bh - 34) + '" text-anchor="middle" fill="#C49BFF" font-size="' + (sm ? 11 : 12) + '">Más concentrada</text><text class="sc-g-lb" x="' + cx2 + '" y="' + (base - bh - 34) + '" text-anchor="middle" fill="#D9C4FF" font-size="' + (sm ? 11 : 12) + '">Más diluida (C ÷ ' + fmt(f, 1) + ')</text>';
    // pequeño "chorro" de agua
    h += '<path class="gd-pour sc-flow" d="M' + (cx2 + bw / 2 - 14) + ' ' + (base - bh - 30) + 'V' + (base - 30) + '" stroke="#8CC8F2" stroke-width="4" stroke-dasharray="12 5" style="--d:.5s;opacity:0"/>';
    return { html: h, F: { cx1, cx2, bw, base, lvl, v1, f, ml }, run: 'dil' };
  },
};

/* ---------- escena ---------- */
export default function (el) {
  const stage = document.createElement('div');
  stage.className = 'stage sc-stage sc-2d sc-graph' + (reduce ? ' sc-reduce' : '');
  const tag = document.createElement('div');
  tag.className = 'sc-tag';
  stage.appendChild(tag);
  el.appendChild(stage);

  let S = null, cur = null, raf = 0, visible = true;
  let mv = null; // valor mostrado del marcador (se interpola)
  let tw = null; // {from, to, t0}

  function render(anim) {
    const W = stage.clientWidth, H = stage.clientHeight;
    if (!W || !H || !S) return;
    const kind = K[S.kind] ? S.kind : 'heating';
    const def = K[kind];
    tag.textContent = def.tag;
    const R = def.build(W, H, S);
    const layer = document.createElement('div');
    layer.className = 'sc-layer';
    layer.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="' + esc(def.tag) + '" style="--gf:' + (W < 560 ? 11.5 : 13) + 'px">' + R.html + '</svg>';
    stage.insertBefore(layer, tag);
    const svg = layer.firstChild;
    // trazo animado
    svg.querySelectorAll('.sc-g-draw').forEach((p) => {
      const L = p.getTotalLength();
      const dash = p.dataset.dash;
      if (dash) { p.setAttribute('stroke-dasharray', dash); p.style.opacity = 0; p.style.transition = 'opacity .8s ease ' + (p.style.getPropertyValue('--dl') || '0s'); }
      else { p.setAttribute('stroke-dasharray', L + ' ' + L); p.style.strokeDashoffset = anim && !reduce ? L : 0; }
    });
    const old = cur;
    cur = { kind, layer, svg, R, def, t0: performance.now() };
    const show = () => {
      layer.classList.add('sc-on');
      svg.querySelectorAll('.sc-g-draw').forEach((p) => { if (p.dataset.dash) p.style.opacity = 1; else p.style.strokeDashoffset = 0; });
      svg.querySelectorAll('.sc-g-in').forEach((p) => p.classList.add('sc-v'));
    };
    if (anim && !reduce) { layer.getBoundingClientRect(); requestAnimationFrame(() => requestAnimationFrame(show)); }
    else { layer.style.transition = 'none'; svg.querySelectorAll('.sc-g-draw,.sc-g-in').forEach((p) => (p.style.transition = 'none')); show(); }
    if (old) {
      old.layer.classList.remove('sc-on');
      if (!anim || reduce) old.layer.remove();
      else setTimeout(() => old.layer.remove(), 600);
    }
    paint(performance.now());
    run();
  }

  function markValue(now) {
    if (!tw) return mv;
    const k = ease((now - tw.t0) / 700);
    if (k >= 1) { mv = tw.to; tw = null; return mv; }
    return lerp(tw.from, tw.to, k);
  }

  function paint(now) {
    if (!cur) return;
    const { svg, R, def, kind } = cur;
    const t = Math.max(0, (now - cur.t0) / 1000);
    const F = R.F;
    const v = markValue(now);
    if (R.run === 'loop') {
      const p = svg.querySelector('.gp');
      if (!p) return;
      const L = p.getTotalLength();
      const c = reduce ? 0.62 : Math.max(0, t - 1.2) % 9;
      const k = reduce ? 0.62 : clamp(c / 7.5);
      const pt = p.getPointAtLength(L * (kind === 'energy' ? ease(k) : k));
      const txt = def.ball(svg, F, pt);
      placeMarker(svg, F, pt.x, pt.y, txt || '', { noGuides: kind === 'energy', hide: t < 1.2 && !reduce });
      if (!txt) { const r = svg.querySelector('.gm-r'); r.style.opacity = 0; }
    } else if (R.run === 'sweep' && def.at) {
      const [a, b] = def.range;
      const ph = reduce ? 0.35 : Math.max(0, t - 1.2) / 8;
      const k = 0.5 - 0.5 * Math.cos(Math.PI * 2 * (ph % 1));
      const val = lerp(a + (b - a) * 0.08, b - (b - a) * 0.05, k);
      const [x, y, txt] = def.at(F, val);
      placeMarker(svg, F, x, y, txt, { hide: t < 1.2 && !reduce });
      if (def.area) area(svg, F, x, y);
      if (def.extra) def.extra(svg, F, val);
    } else if (R.run === 'mark') {
      if (def.mark) def.mark(svg, F, v, R);
      else if (def.at && v != null) {
        const [x, y, txt] = def.at(F, v);
        placeMarker(svg, F, x, y, txt);
        if (def.area) area(svg, F, x, y);
        if (def.extra) def.extra(svg, F, v);
      } else { const g = svg.querySelector('.gm'); if (g) g.style.opacity = 0; }
    } else if (R.run === 'dil') dil(svg, F, t);
  }
  function area(svg, F, x, y) { const a = svg.querySelector('.gm-area'); if (a) { a.setAttribute('x', F.X0); a.setAttribute('y', y); a.setAttribute('width', Math.max(0, x - F.X0)); a.setAttribute('height', Math.max(0, F.Y0 - y)); } }

  // partículas para la dilución (posiciones estables)
  const PR = [[0.1, 0.2], [0.45, 0.1], [0.8, 0.25], [0.25, 0.5], [0.62, 0.42], [0.92, 0.6], [0.05, 0.8], [0.38, 0.75], [0.72, 0.85], [0.55, 0.62], [0.15, 0.35], [0.85, 0.05]].map((p, i) => [p[0], p[1], i * 1.7]);
  function dil(svg, F, t) {
    const k = reduce ? 1 : ease(clamp((t - 0.6) / 2.2));
    const v2 = lerp(F.v1, F.v1 * F.f, k);
    const y2 = F.lvl(v2);
    const l2 = svg.querySelector('.gd-l2');
    l2.setAttribute('y', y2); l2.setAttribute('height', F.base - y2 - 2);
    l2.setAttribute('opacity', (0.75 * lerp(1, 1 / F.f, k) + 0.12).toFixed(3));
    const pour = svg.querySelector('.gd-pour');
    pour.style.opacity = k > 0 && k < 1 ? 1 : 0;
    pour.setAttribute('d', 'M' + (F.cx2 + F.bw / 2 - 14) + ' ' + (F.base - (F.base - F.lvl(1)) - 30) + 'V' + y2);
    const put = (g, cx, y) => {
      let h = '';
      PR.forEach(([a, b, p]) => {
        const x = cx - F.bw / 2 + 12 + a * (F.bw - 24) + (reduce ? 0 : Math.sin(t * 1.6 + p) * 3);
        const yy = y + 10 + b * (F.base - y - 20) + (reduce ? 0 : Math.cos(t * 1.3 + p) * 3);
        h += '<circle cx="' + x.toFixed(1) + '" cy="' + yy.toFixed(1) + '" r="5" fill="#E6D4FF" stroke="#5E3796" stroke-width="1.5"/>';
      });
      g.innerHTML = h;
    };
    put(svg.querySelector('.gd-p1'), F.cx1, F.lvl(F.v1));
    put(svg.querySelector('.gd-p2'), F.cx2, y2);
    const r = svg.querySelector('.gd-r');
    const txt = Math.round(F.ml * lerp(1, F.f, k)) + ' mL · 12 partículas';
    if (r.textContent !== txt) r.textContent = txt;
  }

  function frame(now) {
    raf = 0;
    paint(now);
    if (visible && !reduce && cur && (cur.R.run !== 'mark' || tw || cur.R.run === 'dil')) raf = requestAnimationFrame(frame);
    else if (visible && tw) raf = requestAnimationFrame(frame);
  }
  function run() { if (!raf && visible) raf = requestAnimationFrame(frame); }

  const io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver((es) => { visible = es.some((e) => e.isIntersecting); if (visible) run(); }) : null;
  if (io) io.observe(stage);
  let lastW = 0, lastH = 0;
  const onResize = () => { const W = stage.clientWidth, H = stage.clientHeight; if (W === lastW && H === lastH) return; lastW = W; lastH = H; if (cur) render(false); };
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null;
  if (ro) ro.observe(stage); else window.addEventListener('resize', onResize);

  const sig = (s) => JSON.stringify([s.kind, [].concat(s.curves || []), s.kind === 'heating' || s.kind === 'equilibrium' || s.kind === 'energy' || s.kind === 'dilution' ? s.mark : null, s.mark == null]);

  return {
    set(state) {
      const prev = S;
      S = Object.assign({}, state || {});
      if (!K[S.kind]) S.kind = 'heating';
      const m = S.mark != null && !isNaN(+S.mark) ? +S.mark : null;
      S.mark = m;
      lastW = stage.clientWidth; lastH = stage.clientHeight;
      if (!prev || !cur || sig(prev) !== sig(S)) {
        mv = m; tw = null;
        render(true);
      } else if (m !== mv) {
        const from = markValue(performance.now());
        tw = reduce || from == null || m == null ? null : { from, to: m, t0: performance.now() };
        mv = m;
        paint(performance.now());
        run();
      }
    },
    dispose() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (io) io.disconnect();
      if (ro) ro.disconnect(); else window.removeEventListener('resize', onResize);
      stage.remove();
    },
  };
}
