// Cambios químicos en la vida diaria: cocina, evidencias de reacción, balanza de Lavoisier, indicador de repollo, antiácido y fermentación.
import { P, BENCH, T, Tf, callout, bench, glow, beaker, erlen, tube, flame, bubbles, steam, drop, badge, panel, vgrad, rng, seg, ease, lerp, clamp, q, qa } from './kit.js';

const hx = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, f) => { const A = hx(a), B = hx(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * clamp(f))).join(',') + ')'; };
const highlight = (els) => (n, st) => { const on = st && st.step != null ? n : -1; els.forEach((g, i) => g.classList.toggle('sc-off', on >= 0 && i !== on)); };

/* ------------------------------------------------------------------ cocina */
export const kitchen = {
  tag: 'Cambios en la cocina',
  svg(u) {
    const r = rng(17);
    const PX = [14, 210, 406], W = 180;
    const stove = (cx) => '<rect x="' + (cx - 62) + '" y="206" width="124" height="14" rx="4" fill="#3A4652"/><rect x="' + (cx - 62) + '" y="206" width="124" height="3" fill="#56636F"/>' + flame(cx - 18, 206, 0.45) + flame(cx, 206, 0.55, 0.1) + flame(cx + 18, 206, 0.45, 0.2);
    // 1. arepa en el budare
    const c1 = PX[0] + W / 2;
    let spots = '';
    for (let i = 0; i < 14; i++) spots += '<ellipse cx="' + (c1 - 34 + r() * 68).toFixed(1) + '" cy="' + (161 + r() * 12).toFixed(1) + '" rx="' + (2 + r() * 3).toFixed(1) + '" ry="' + (1.2 + r() * 1.5).toFixed(1) + '" fill="#6B3E14"/>';
    const p1 = '<g class="sc-dim kt-p">' + panel(PX[0], 36, W, 266) +
      stove(c1) +
      '<ellipse cx="' + c1 + '" cy="190" rx="64" ry="12" fill="#1E2227"/><ellipse cx="' + c1 + '" cy="186" rx="62" ry="10" fill="#2D3238"/><rect x="' + (c1 + 58) + '" y="182" width="26" height="7" rx="3" fill="#1E2227"/>' +
      '<ellipse cx="' + c1 + '" cy="180" rx="46" ry="12" fill="#C9A45C"/>' +
      '<ellipse class="kt-arepa" cx="' + c1 + '" cy="170" rx="46" ry="14" fill="#F1E2B4"/>' +
      '<path d="M' + (c1 - 46) + ' 170V178Q' + c1 + ' 194 ' + (c1 + 46) + ' 178V170" fill="#E7CF95" opacity=".6"/>' +
      '<g class="kt-spots" opacity="0">' + spots + '</g>' +
      '<g class="kt-smoke" opacity="0">' + steam(r, 3, c1 - 26, c1 + 26, 156, 60, { c: 'rgba(200,200,200,.6)', w: 2.5 }) + '</g>' +
      T(c1, 248, 'Arepa en el budare', { s: 15 }) + badge(c1, 278, 'Cambio químico', '#F2A65A', { cls: 'kt-b' }) + '</g>';
    // 2. olla con agua hirviendo
    const c2 = PX[1] + W / 2;
    const p2 = '<g class="sc-dim kt-p">' + panel(PX[1], 36, W, 266) + stove(c2) +
      '<path d="M' + (c2 - 52) + ' 120H' + (c2 + 52) + 'V192Q' + (c2 + 52) + ' 204 ' + (c2 + 40) + ' 204H' + (c2 - 40) + 'Q' + (c2 - 52) + ' 204 ' + (c2 - 52) + ' 192Z" fill="#8C99A6"/>' +
      '<path d="M' + (c2 - 52) + ' 120H' + (c2 + 52) + 'V132H' + (c2 - 52) + 'Z" fill="#A9B4BE"/>' +
      '<path d="M' + (c2 - 44) + ' 136V194" stroke="rgba(255,255,255,.35)" stroke-width="4" stroke-linecap="round"/>' +
      '<rect x="' + (c2 - 68) + '" y="132" width="16" height="7" rx="3" fill="#3A4652"/><rect x="' + (c2 + 52) + '" y="132" width="16" height="7" rx="3" fill="#3A4652"/>' +
      '<ellipse cx="' + c2 + '" cy="121" rx="50" ry="8" fill="' + P.water + '"/><ellipse cx="' + c2 + '" cy="120" rx="46" ry="5" fill="' + P.waterTop + '"/>' +
      bubbles(r, 7, c2 - 38, c2 + 38, 124, 8, { r: 3, d: 0.8, wob: 4 }) +
      steam(r, 5, c2 - 36, c2 + 36, 108, 40) +
      T(c2, 248, 'Agua hirviendo', { s: 15 }) + badge(c2, 278, 'Cambio físico', '#7FB2EA', { cls: 'kt-b' }) + '</g>';
    // 3. bicarbonato + vinagre
    const c3 = PX[2] + W / 2;
    const bk = beaker(c3 - 34, 132, 68, 88, { marks: false });
    let foam = '';
    for (let i = 0; i < 16; i++) foam += '<circle cx="' + (c3 - 30 + r() * 60).toFixed(1) + '" cy="' + (128 - r() * 16).toFixed(1) + '" r="' + (5 + r() * 6).toFixed(1) + '" fill="#F4F1EA"/>';
    const p3 = '<g class="sc-dim kt-p">' + panel(PX[2], 36, W, 266) +
      '<defs><clipPath id="' + u + 'kc"><path d="' + bk.clip + '"/></clipPath></defs>' +
      '<rect x="' + (c3 - 80) + '" y="220" width="160" height="6" rx="3" fill="#3A4652"/>' +
      bk.back + '<g clip-path="url(#' + u + 'kc)"><rect x="' + (c3 - 40) + '" y="160" width="80" height="70" fill="#E9D9A6" opacity=".55"/>' + bubbles(r, 16, c3 - 28, c3 + 28, 214, 60, { r: 2.6, d: 1.1 }) + '</g>' +
      '<g class="kt-foam sc-ab">' + foam + '<path d="M' + (c3 - 30) + ' 132Q' + (c3 - 34) + ' 150 ' + (c3 - 30) + ' 168" stroke="#F4F1EA" stroke-width="8" stroke-linecap="round" fill="none"/></g>' +
      bk.front +
      // cuchara con bicarbonato
      '<g transform="rotate(-24 ' + (c3 + 20) + ' 90)"><rect x="' + (c3 + 10) + '" y="86" width="64" height="6" rx="3" fill="#C3CDD5"/><ellipse cx="' + (c3 + 6) + '" cy="89" rx="16" ry="7" fill="#C3CDD5"/><ellipse cx="' + (c3 + 6) + '" cy="86" rx="11" ry="4" fill="#FFFFFF"/></g>' +
      [0, 0.3, 0.6].map((d) => '<circle class="sc-a sc-drop" cx="' + (c3 - 4 + d * 10) + '" cy="104" r="2" fill="#FFFFFF" style="--d:.9s;--dl:' + d + 's;--dy:16px"/>').join('') +
      T(c3, 248, 'Bicarbonato + vinagre', { s: 14 }) + badge(c3, 278, 'Cambio químico', '#F2A65A', { cls: 'kt-b' }) + '</g>';
    return '<defs>' + '</defs>' + p1 + p2 + p3;
  },
  mount(svg) {
    const ps = qa(svg, '.kt-p'), ar = q(svg, '.kt-arepa'), sp = q(svg, '.kt-spots'), sm = q(svg, '.kt-smoke'), fo = q(svg, '.kt-foam'), bs = qa(svg, '.kt-b');
    return {
      still: 6,
      tick(t) {
        const c = t % 10;
        const k = ease(seg(c, 0.5, 6)) * (1 - seg(c, 9, 10));
        ar.setAttribute('fill', k < 0.5 ? mix('#F1E2B4', '#E6B85C', k * 2) : mix('#E6B85C', '#C9832E', (k - 0.5) * 2));
        sp.setAttribute('opacity', clamp((k - 0.3) / 0.7));
        sm.setAttribute('opacity', clamp((k - 0.4) / 0.4));
        const f = 0.55 + 0.45 * Math.abs(Math.sin(t * 0.9));
        fo.style.transform = 'scale(1,' + f.toFixed(3) + ')';
        bs.forEach((b, i) => { const s = seg(t, 0.3 + i * 0.35, 0.8 + i * 0.35); b.style.opacity = s; b.style.transform = 'scale(' + (0.6 + 0.4 * ease(s)) + ')'; });
      },
      step: highlight(ps),
    };
  },
};

/* ------------------------------------------------------------------ evidencias de reacción */
export const evidence = {
  tag: 'Evidencias de una reacción química',
  svg(u) {
    const r = rng(23);
    const X = [8, 156, 304, 452], W = 140;
    const titles = [['Cambio', 'de color'], ['Formación', 'de gas'], ['Formación de', 'precipitado'], ['Luz', 'y calor']];
    let h = '<defs>' + vgrad(u + 'w', [[0, '#DDEFFA', 0.35], [1, '#BFE3F7', 0.5]]) +
      '<radialGradient id="' + u + 'mg"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".25" stop-color="#FFF6D6" stop-opacity=".95"/><stop offset=".6" stop-color="#FFE08A" stop-opacity=".35"/><stop offset="1" stop-color="#FFE08A" stop-opacity="0"/></radialGradient></defs>';
    X.forEach((x, i) => {
      const cx = x + W / 2;
      h += '<g class="sc-dim ev-p">' + panel(x, 22, W, 300) + T(cx, 52, titles[i][0], { s: 15 }) + T(cx, 70, titles[i][1], { s: 15 });
      const bk = beaker(cx - 36, 176, 72, 104, { marks: false });
      h += '<defs><clipPath id="' + u + 'c' + i + '"><path d="' + bk.clip + '"/></clipPath></defs>';
      if (i === 0) {
        h += bk.back + '<g clip-path="url(#' + u + 'c0)"><rect class="ev-col" x="' + (cx - 40) + '" y="206" width="80" height="80" fill="#DDEFFA" opacity=".6"/></g>' + bk.front +
          // gotero
          '<rect x="' + (cx - 5) + '" y="96" width="10" height="46" rx="2" fill="rgba(220,235,245,.35)" stroke="' + P.glass + '" stroke-width="1.5"/><path d="M' + (cx - 5) + ' 142L' + cx + ' 158L' + (cx + 5) + ' 142Z" fill="rgba(220,235,245,.35)" stroke="' + P.glass + '" stroke-width="1.5"/><rect x="' + (cx - 8) + '" y="82" width="16" height="16" rx="6" fill="#D9453B"/>' +
          '<g class="sc-a sc-drop" style="--d:1.6s;--dy:42px">' + drop(cx, 166, 0.7, '#E86FA8') + '</g>';
      } else if (i === 1) {
        h += bk.back + '<g clip-path="url(#' + u + 'c1)"><rect x="' + (cx - 40) + '" y="200" width="80" height="90" fill="url(#' + u + 'w)"/>' +
          '<rect x="' + (cx - 14) + '" y="268" width="28" height="9" rx="4" fill="#F4F1EA"/>' + bubbles(r, 22, cx - 28, cx + 28, 266, 70, { r: 3, d: 1.4, spread: 6 }) + '</g>' +
          '<rect x="' + (cx - 40) + '" y="199" width="80" height="2" fill="#E6F3FB" opacity=".8"/>' + bk.front +
          '<g opacity=".8">' + bubbles(r, 5, cx - 22, cx + 22, 196, 60, { r: 2.4, d: 1.8, fill: 'none', stroke: 'rgba(255,255,255,.45)' }) + '</g>';
      } else if (i === 2) {
        let ppt = '';
        for (let k = 0; k < 40; k++) ppt += '<circle class="ev-pp" data-x="' + (cx - 28 + r() * 56).toFixed(1) + '" data-y0="' + (208 + r() * 30).toFixed(1) + '" data-y1="' + (268 + r() * 8).toFixed(1) + '" data-d="' + (r() * 1.5).toFixed(2) + '" cx="0" cy="0" r="' + (1.8 + r() * 1.6).toFixed(1) + '" fill="#F4D35E"/>';
        h += bk.back + '<g clip-path="url(#' + u + 'c2)"><rect x="' + (cx - 40) + '" y="200" width="80" height="90" fill="url(#' + u + 'w)"/>' + ppt + '</g>' + bk.front +
          '<g transform="rotate(35 ' + (cx + 34) + ' 128)"><path d="M' + (cx + 26) + ' 96V152A8 8 0 0 0 ' + (cx + 42) + ' 152V96" fill="rgba(220,235,245,.15)" stroke="' + P.glass + '" stroke-width="2"/><rect x="' + (cx + 27.5) + '" y="120" width="13" height="38" fill="#DDEFFA" opacity=".45"/></g>' +
          '<path class="sc-flow" d="M' + (cx + 13) + ' 150Q' + (cx + 8) + ' 170 ' + (cx + 8) + ' 200" stroke="#DDEFFA" stroke-width="3" stroke-dasharray="8 5" fill="none" opacity=".7" style="--d:.6s"/>';
      } else {
        h += '<circle class="sc-a sc-pulse ev-glow" cx="' + (cx + 4) + '" cy="150" r="64" fill="url(#' + u + 'mg)" style="--d:.5s;--lo:.7"/>' +
          Array.from({ length: 10 }, (_, k) => { const a = (k / 10) * Math.PI * 2; return '<path class="sc-a sc-twinkle" d="M' + (cx + 4 + Math.cos(a) * 24).toFixed(1) + ' ' + (150 + Math.sin(a) * 24).toFixed(1) + 'L' + (cx + 4 + Math.cos(a) * 40).toFixed(1) + ' ' + (150 + Math.sin(a) * 40).toFixed(1) + '" stroke="#FFF6D6" stroke-width="2.4" stroke-linecap="round" style="--d:.9s;--dl:' + (-k * 0.13).toFixed(2) + 's"/>'; }).join('') +
          // cinta de magnesio y pinza
          '<path d="M' + (cx + 4) + ' 152L' + (cx - 30) + ' 214" stroke="#C3CDD5" stroke-width="3"/><path d="M' + (cx - 26) + ' 208L' + (cx - 52) + ' 262M' + (cx - 32) + ' 204L' + (cx - 62) + ' 256" stroke="#8C99A6" stroke-width="5" stroke-linecap="round"/>' +
          '<circle cx="' + (cx + 4) + '" cy="150" r="9" fill="#FFFFFF"/>' +
          steam(r, 3, cx + 24, cx + 52, 250, 60, { c: 'rgba(255,177,153,.7)', w: 2.5 }) +
          T(cx + 38, 290, 'Mg', { s: 13, cls: 'sc-m' });
      }
      h += '</g>';
    });
    return h;
  },
  mount(svg) {
    const ps = qa(svg, '.ev-p'), col = q(svg, '.ev-col');
    const pp = qa(svg, '.ev-pp').map((el) => ({ el, x: +el.dataset.x, y0: +el.dataset.y0, y1: +el.dataset.y1, d: +el.dataset.d }));
    return {
      still: 5,
      tick(t) {
        const c = t % 8;
        const k = ease(seg(c, 0.8, 3.2)) * (1 - seg(c, 7, 8));
        col.setAttribute('fill', mix('#DDEFFA', '#D6378A', k));
        col.setAttribute('opacity', (0.55 + 0.35 * k).toFixed(2));
        pp.forEach((p) => {
          const a = seg(c, 0.4 + p.d * 0.5, 1.2 + p.d * 0.5), f = ease(seg(c, 1.6 + p.d, 4.6 + p.d));
          p.el.setAttribute('cx', (p.x + Math.sin(c * 2 + p.d * 7) * 2 * (1 - f)).toFixed(1));
          p.el.setAttribute('cy', lerp(p.y0, p.y1, f).toFixed(1));
          p.el.style.opacity = a * (1 - seg(c, 7, 8));
        });
      },
      step: highlight(ps),
    };
  },
};

/* ------------------------------------------------------------------ balanza de Lavoisier */
const atom = (x, y, s, rr) => '<circle cx="' + x + '" cy="' + y + '" r="' + rr + '" fill="' + (s === 'O' ? '#E0433B' : '#E6ECF1') + '" stroke="' + (s === 'O' ? '#A8302A' : '#9AA8B3') + '" stroke-width="1.2"/><circle cx="' + (x - rr * 0.35) + '" cy="' + (y - rr * 0.35) + '" r="' + rr * 0.3 + '" fill="#fff" opacity=".45"/>';
const H2 = (x, y) => atom(x - 5, y, 'H', 7) + atom(x + 5, y, 'H', 7);
const O2 = (x, y) => atom(x - 8, y, 'O', 10) + atom(x + 8, y, 'O', 10);
const H2O = (x, y) => atom(x - 11, y + 6, 'H', 7) + atom(x + 11, y + 6, 'H', 7) + atom(x, y - 2, 'O', 10.5);
export const scale = {
  tag: 'Conservación de la masa',
  svg(u) {
    const pan = (cls, content, label) => '<g class="' + cls + '"><path d="M-36 -86L-58 0M36 -86L58 0M0 -86V0" stroke="#8C99A6" stroke-width="1.4" opacity=".0"/>' +
      '<path d="M0 -92L-60 -6M0 -92L60 -6" stroke="#9AA8B3" stroke-width="1.6"/>' +
      '<g class="sc-badge sl-c">' + content + '</g>' +
      '<path d="M-68 -6H68Q60 12 0 12Q-60 12 -68 -6Z" fill="#C3CDD5" stroke="#8C99A6" stroke-width="1.5"/>' +
      '<g class="sl-m">' + T(0, 38, label, { s: 15 }) + '</g></g>';
    return '<defs>' + vgrad(u + 'b', [[0, '#C9D3DB'], [1, '#8C99A6']]) + '</defs>' + glow(u, 300, 170, 240) + bench() +
      // base y columna
      '<path d="M240 292L256 272H344L360 292Z" fill="#56636F"/><rect x="293" y="104" width="14" height="170" rx="4" fill="url(#' + u + 'b)"/>' +
      // escala del fiel
      '<path d="M270 138A40 40 0 0 1 330 138" fill="none" stroke="#6B7A86" stroke-width="2"/><path d="M300 96V104" stroke="#E7B460" stroke-width="2"/>' +
      '<g class="sl-beam">' +
      '<rect x="120" y="98" width="360" height="9" rx="4.5" fill="#C3CDD5" stroke="#8C99A6" stroke-width="1.2"/>' +
      '<path d="M300 104L296 150H304Z" fill="#E7B460"/>' +
      '<circle cx="128" cy="102" r="4" fill="#56636F"/><circle cx="472" cy="102" r="4" fill="#56636F"/></g>' +
      '<circle cx="300" cy="102" r="7" fill="#E7B460" stroke="#9A6412" stroke-width="1.5"/>' +
      '<g class="sl-L">' + pan('', H2(-40, -18) + H2(-12, -18) + O2(28, -18) + H2(-26, -34), '2 H₂ + O₂ · 36 g') + '</g>' +
      '<g class="sl-R">' + pan('', H2O(-22, -20) + H2O(22, -20), '2 H₂O · 36 g') + '</g>' +
      T(170, 300, 'Reactivos', { s: 15, cls: 'sc-m' }) + T(430, 300, 'Productos', { s: 15, cls: 'sc-m' }) +
      '<g class="sl-eq sc-badge">' + badge(300, 44, 'Masa inicial = masa final', '#E7B460', { s: 15 }) + '</g>';
  },
  mount(svg) {
    const beam = q(svg, '.sl-beam'), L = q(svg, '.sl-L'), R = q(svg, '.sl-R'), eq = q(svg, '.sl-eq');
    const cL = q(L, '.sl-c'), cR = q(R, '.sl-c'), mL = q(L, '.sl-m'), mR = q(R, '.sl-m');
    let th = 0, v = 0, last = 0;
    const place = (a) => {
      beam.setAttribute('transform', 'rotate(' + a.toFixed(2) + ' 300 102)');
      const rad = (a * Math.PI) / 180, c = Math.cos(rad), s = Math.sin(rad);
      L.setAttribute('transform', 'translate(' + (300 - 172 * c).toFixed(1) + ' ' + (102 - 172 * s + 94).toFixed(1) + ')');
      R.setAttribute('transform', 'translate(' + (300 + 172 * c).toFixed(1) + ' ' + (102 + 172 * s + 94).toFixed(1) + ')');
    };
    return {
      still: 8,
      tick(t) {
        const c = t % 11;
        const inL = seg(c, 0.4, 1) * (1 - seg(c, 10.3, 10.9)), inR = seg(c, 2.8, 3.4) * (1 - seg(c, 10.3, 10.9));
        const target = 9 * (inL - inR);
        if (t < last || t - last > 0.5) { th = target; v = 0; }
        const dt = Math.min(0.05, t - last); last = t;
        v += (-(th - target) * 26 - v * 3.2) * dt; th += v * dt;
        if (t === 0 || dt === 0) th = target;
        place(th);
        cL.style.opacity = inL; cL.style.transform = 'scale(' + (0.5 + 0.5 * ease(inL)) + ')';
        cR.style.opacity = inR; cR.style.transform = 'scale(' + (0.5 + 0.5 * ease(inR)) + ')';
        mL.style.opacity = inL; mR.style.opacity = inR;
        const e = seg(c, 5.2, 5.8) * (1 - seg(c, 10.2, 10.8));
        eq.style.opacity = e; eq.style.transform = 'scale(' + (0.7 + 0.3 * ease(e)) + ')';
      },
    };
  },
};

/* ------------------------------------------------------------------ indicador de repollo morado */
const IND = [['Limón', 2, '#D7263D'], ['Vinagre', 3, '#E0529C'], ['Agua', 7, '#8C5CC7'], ['Bicarbonato', 8.3, '#4C7FE0'], ['Jabón', 10, '#2BA59A'], ['Amoníaco', 11.5, '#5CBF4A'], ['Destapador', 14, '#E2D34A']];
const PHC = ['#C0392B', '#E74C3C', '#EB6B34', '#F39C12', '#F4C430', '#D4D83A', '#A8D14F', '#4CAF50', '#2BA88A', '#1F9BB4', '#2D7FC1', '#3C5DB8', '#5344A8', '#5E3796', '#5A2A82'];
export const indicator = {
  tag: 'Indicador de repollo morado',
  svg(u) {
    const xs = IND.map((_, i) => 72 + i * 76);
    let h = '<defs><linearGradient id="' + u + 'rc" x1="0" x2="1">' + IND.map((d, i) => '<stop offset="' + (i / (IND.length - 1)).toFixed(3) + '" stop-color="' + d[2] + '"/>').join('') + '</linearGradient></defs>' + glow(u, 300, 170, 260) + bench();
    // gradilla (atrás)
    h += '<rect x="30" y="226" width="540" height="10" rx="3" fill="#8A5A3B"/><rect x="40" y="236" width="10" height="56" fill="#6E4630"/><rect x="550" y="236" width="10" height="56" fill="#6E4630"/><rect x="30" y="280" width="540" height="8" rx="3" fill="#6E4630"/>';
    IND.forEach(([n, ph, c], i) => {
      const x = xs[i], tb = tube(x, 104, 30, 170);
      h += '<g class="sc-dim in-t"><clipPath id="' + u + 't' + i + '"><path d="' + tb.clip + '"/></clipPath>' + tb.back +
        '<g clip-path="url(#' + u + 't' + i + ')"><rect class="in-l" x="' + (x - 16) + '" y="176" width="32" height="110" fill="#E6EEF3" opacity=".35"/><rect x="' + (x - 16) + '" y="176" width="32" height="2" fill="#fff" opacity=".4"/></g>' + tb.front +
        '<rect x="' + (x - 18) + '" y="222" width="36" height="8" rx="2" fill="#A06B47"/>' +
        '<text x="' + x + '" y="262" text-anchor="middle" font-size="12" font-weight="700" fill="#fff" class="in-ph" opacity="0">' + String(ph).replace('.', ',') + '</text>' +
        T(x, i % 2 ? 330 : 312, n, { s: 13 }) + '</g>';
    });
    // gotero móvil
    h += '<g class="in-dr"><rect x="-5" y="-50" width="10" height="36" rx="2" fill="rgba(220,235,245,.3)" stroke="' + P.glass + '" stroke-width="1.5"/><path d="M-5 -14L0 0L5 -14Z" fill="rgba(220,235,245,.3)" stroke="' + P.glass + '" stroke-width="1.5"/><rect x="-5" y="-40" width="10" height="24" fill="#7B3FA0" opacity=".85"/><rect x="-8" y="-64" width="16" height="16" rx="6" fill="#7B3FA0"/>' +
      '<g class="in-drop" opacity="0">' + drop(0, 10, 0.7, '#8C4FC0') + '</g></g>';
    // escala
    h += '<rect x="130" y="20" width="340" height="9" rx="4.5" fill="url(#' + u + 'rc)"/>' + T(120, 30, 'Ácido', { a: 'end', s: 14 }) + T(480, 30, 'Básico', { a: 'start', s: 14 });
    return h;
  },
  mount(svg) {
    const tubes = qa(svg, '.in-t'), ls = qa(svg, '.in-l'), phs = qa(svg, '.in-ph'), dr = q(svg, '.in-dr'), dp = q(svg, '.in-drop');
    const xs = IND.map((_, i) => 72 + i * 76);
    return {
      still: 12,
      tick(t) {
        const c = t % 13, per = 1.3;
        const reset = seg(c, 11.8, 12.6);
        const i = Math.min(IND.length - 1, Math.floor(c / per));
        const f = (c - i * per) / per;
        const x = c < IND.length * per ? lerp(i > 0 ? xs[i - 1] : xs[0] - 40, xs[i], ease(seg(f, 0, 0.35))) : lerp(xs[IND.length - 1], xs[IND.length - 1] + 60, seg(c, IND.length * per, IND.length * per + 0.6));
        dr.setAttribute('transform', 'translate(' + x.toFixed(1) + ' 100)');
        const df = seg(f, 0.35, 0.65);
        dp.setAttribute('opacity', c < IND.length * per && df > 0 && df < 1 ? 1 : 0);
        dp.setAttribute('transform', 'translate(0 ' + (df * 70).toFixed(1) + ')');
        ls.forEach((l, k) => {
          const on = ease(seg(c, k * per + 0.6, k * per + 1.3)) * (1 - reset);
          l.setAttribute('fill', mix('#E6EEF3', IND[k][2], on));
          l.setAttribute('opacity', (0.35 + 0.55 * on).toFixed(2));
          phs[k].setAttribute('opacity', on.toFixed(2));
        });
      },
      step: highlight(tubes),
    };
  },
};

/* ------------------------------------------------------------------ antiácido */
const STOMACH = 'M292 20C292 44 290 60 280 74C236 74 188 108 184 162C180 222 226 280 300 284C366 288 424 256 444 214C452 198 466 190 486 194L488 168C462 162 440 170 424 190C408 210 384 218 360 212C334 206 322 180 324 150C326 118 336 92 334 66C333 50 332 36 332 20Z';
export const antacid = {
  tag: 'Antiácido en el estómago',
  svg(u) {
    const r = rng(41);
    const ion = (cls, c, sgn) => '<g class="' + cls + '"><circle r="8" fill="' + c + '" stroke="rgba(0,0,0,.25)"/><path d="' + (sgn === '+' ? 'M-4 0H4M0 -4V4' : 'M-4 0H4') + '" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></g>';
    let ions = '';
    for (let i = 0; i < 16; i++) ions += ion('an-h', '#E4574B', '+');
    let oh = '';
    for (let i = 0; i < 10; i++) oh += ion('an-oh', '#3C8BE0', '-');
    let wat = '';
    for (let i = 0; i < 10; i++) wat += '<g class="an-w" opacity="0"><circle cx="0" cy="-1" r="6" fill="#E0433B"/><circle cx="-6" cy="4" r="4" fill="#E6ECF1"/><circle cx="6" cy="4" r="4" fill="#E6ECF1"/></g>';
    const gy = (ph) => 282 - (ph / 14) * 220;
    return '<defs>' + vgrad(u + 'juice', [[0, '#D9D36A', 0.55], [1, '#B8B04A', 0.7]]) +
      '<linearGradient id="' + u + 'ph" x1="0" y1="1" x2="0" y2="0">' + PHC.map((c, i) => '<stop offset="' + (i / 14).toFixed(3) + '" stop-color="' + c + '"/>').join('') + '</linearGradient>' +
      '<clipPath id="' + u + 'sc"><path d="' + STOMACH + '"/></clipPath>' +
      '<radialGradient id="' + u + 'burn" cx="300" cy="220" r="160" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FF5A3C" stop-opacity=".5"/><stop offset="1" stop-color="#FF5A3C" stop-opacity="0"/></radialGradient></defs>' +
      '<circle class="an-burn" cx="300" cy="200" r="170" fill="url(#' + u + 'burn)"/>' +
      '<path d="' + STOMACH + '" fill="#5A2733"/>' +
      '<g clip-path="url(#' + u + 'sc)"><rect x="150" y="150" width="360" height="160" fill="url(#' + u + 'juice)"/><path d="M150 150H510" stroke="#EDE89A" stroke-width="2" opacity=".7"/>' +
      '<g class="an-bub">' + bubbles(r, 10, 250, 330, 262, 100, { r: 2.6, d: 1.2 }) + '</g></g>' +
      '<path d="' + STOMACH + '" fill="none" stroke="#E98A9C" stroke-width="9" stroke-linejoin="round"/>' +
      '<path d="' + STOMACH + '" fill="none" stroke="#F7B8C4" stroke-width="2" stroke-linejoin="round" opacity=".6"/>' +
      '<g class="an-ions">' + ions + oh + wat + '</g>' +
      '<g class="an-tab"><rect x="-17" y="-7" width="34" height="14" rx="7" fill="#F4F1EA" stroke="#C9C0B0" stroke-width="1.5"/><path d="M0 -6V6" stroke="#C9C0B0" stroke-width="1.2"/></g>' +
      // medidor de pH
      '<rect x="536" y="62" width="16" height="220" rx="8" fill="url(#' + u + 'ph)"/>' +
      [0, 7, 14].map((v) => '<text class="sc-t sc-m" x="560" y="' + (gy(v) + 5) + '" font-size="13" text-anchor="start">' + v + '</text>').join('') +
      T(544, 46, 'pH', { s: 16 }) +
      '<g class="an-nd"><path d="M532 0L518 -8V8Z" fill="#fff"/><text class="sc-t an-v" x="512" y="5" text-anchor="end" font-size="16">1,5</text></g>' +
      callout(212, 214, 150, 124, 'Exceso de ácido', { a: 'end', s: 15 }) +
      '<g class="an-l1">' + T(150, 142, 'H⁺ del HCl', { a: 'end', s: 14, cls: 'sc-m' }) + '</g>' +
      '<g class="an-l2" opacity="0">' + callout(356, 30, 400, 30, 'Antiácido (base)', { a: 'start', s: 15 }) + '</g>' +
      '<g class="an-l3" opacity="0">' + Tf(300, 324, 'H⁺ + OH⁻ → H_2O  (neutralización)', { s: 15, fill: '#9CE0B8' }) + '</g>';
  },
  mount(svg) {
    const r = rng(77);
    const d = new Path2D(STOMACH);
    const ctx = document.createElement('canvas').getContext('2d');
    const inside = (x, y) => ctx.isPointInPath(d, x, y) && ctx.isPointInPath(d, x, y + 12) && ctx.isPointInPath(d, x + 12, y) && ctx.isPointInPath(d, x - 12, y) && y > 164;
    const pt = () => { for (let k = 0; k < 400; k++) { const x = 190 + r() * 300, y = 160 + r() * 120; if (inside(x, y)) return [x, y]; } return [300, 240]; };
    const H = qa(svg, '.an-h').map((el) => { const [x, y] = pt(); return { el, x, y, p: r() * 6 }; });
    const OH = qa(svg, '.an-oh'), Wt = qa(svg, '.an-w');
    const tab = q(svg, '.an-tab'), nd = q(svg, '.an-nd'), nv = q(svg, '.an-v'), burn = q(svg, '.an-burn'), bub = q(svg, '.an-bub');
    const l2 = q(svg, '.an-l2'), l3 = q(svg, '.an-l3');
    const TX = 300, TY = 262;
    return {
      still: 9,
      tick(t) {
        const c = t % 13;
        const reset = seg(c, 11.6, 12.6);
        // pastilla: cae por el esófago y se hunde
        const fall = ease(seg(c, 0.3, 1.8));
        const tx = lerp(312, TX, fall), ty = c < 0.3 ? -30 : lerp(-20, TY, fall);
        const dis = seg(c, 2.2, 8.5);
        tab.setAttribute('transform', 'translate(' + tx.toFixed(1) + ' ' + ty.toFixed(1) + ') scale(' + (1 - 0.7 * dis) + ')');
        tab.style.opacity = 1 - seg(c, 8.3, 8.8) + reset;
        bub.style.opacity = dis > 0 && dis < 1 ? 1 : 0;
        l2.setAttribute('opacity', seg(c, 0.3, 0.8) * (1 - seg(c, 4, 4.5)));
        l3.setAttribute('opacity', seg(c, 3.5, 4.2) * (1 - reset));
        let done = 0;
        H.forEach((h, i) => {
          let x = h.x + Math.sin(t * 1.3 + h.p) * 6, y = h.y + Math.cos(t * 1.1 + h.p * 1.7) * 4;
          let op = 1;
          if (i < OH.length) {
            const t0 = 2.6 + i * 0.5;
            const k = ease(seg(c, t0, t0 + 1.4));
            const mx = lerp(TX, x, 0.55), my = lerp(TY, y, 0.55);
            const ox = lerp(TX, mx, k), oy = lerp(TY, my, k);
            x = lerp(x, mx, k); y = lerp(y, my, k);
            const gone = seg(c, t0 + 1.35, t0 + 1.6);
            op = 1 - gone;
            OH[i].setAttribute('transform', 'translate(' + ox.toFixed(1) + ' ' + oy.toFixed(1) + ')');
            OH[i].style.opacity = c < t0 ? 0 : (1 - gone) * (1 - reset);
            const w = seg(c, t0 + 1.35, t0 + 1.7) * (1 - seg(c, 10.6, 11.4));
            Wt[i].setAttribute('transform', 'translate(' + mx.toFixed(1) + ' ' + (my - w * 10).toFixed(1) + ')');
            Wt[i].setAttribute('opacity', w);
            if (gone >= 1) done++;
            op = Math.max(op, reset);
          }
          h.el.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')');
          h.el.style.opacity = op;
        });
        const ph = lerp(1.5, 4, (done / OH.length) * (1 - reset));
        nd.setAttribute('transform', 'translate(0 ' + (282 - (ph / 14) * 220).toFixed(1) + ')');
        nv.textContent = (Math.round(ph * 10) / 10).toString().replace('.', ',');
        burn.style.opacity = 1 - (done / OH.length) * (1 - reset) * 0.9;
      },
    };
  },
};

/* ------------------------------------------------------------------ fermentación */
export const fermentation = {
  tag: 'Fermentación',
  svg(u) {
    const r = rng(52);
    const er = erlen(300, 290, 150, 170, { nw: 34, nh: 60 });
    let yeast = '';
    for (let i = 0; i < 16; i++) {
      const x = 250 + r() * 100, y = 236 + r() * 44;
      yeast += '<g class="sc-a sc-bob" style="--d:' + (1.5 + r() * 2).toFixed(1) + 's;--dl:' + (-r() * 2).toFixed(1) + 's;--dy:-5px"><ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="4.2" ry="3.2" fill="#E9D6A8" stroke="#A88D57" stroke-width=".8"/>' + (r() < 0.4 ? '<circle cx="' + (x + 4.5).toFixed(1) + '" cy="' + (y - 2).toFixed(1) + '" r="2" fill="#E9D6A8" stroke="#A88D57" stroke-width=".8"/>' : '') + '</g>';
    }
    return '<defs>' + vgrad(u + 'liq', [[0, '#E8C872', 0.55], [1, '#C79A3A', 0.75]]) +
      '<radialGradient id="' + u + 'bal" cx=".35" cy=".3"><stop offset="0" stop-color="#FF8A7A"/><stop offset="1" stop-color="#D63A3A"/></radialGradient>' +
      '<clipPath id="' + u + 'ec"><path d="' + er.clip + '"/></clipPath></defs>' + glow(u, 300, 170, 240, '#3A3326') + bench() +
      // azúcar y levadura (utilería)
      '<path d="M84 268Q84 292 112 292H140Q168 292 168 268Z" fill="#DDE5EB"/><ellipse cx="126" cy="268" rx="42" ry="8" fill="#F4F7F9"/><path d="M92 268Q126 250 160 268Z" fill="#FFFFFF"/>' +
      '<rect x="470" y="244" width="62" height="48" rx="4" fill="#C58B5C"/><rect x="470" y="244" width="62" height="12" rx="4" fill="#A06B47"/><text x="501" y="279" text-anchor="middle" font-size="11" font-weight="700" fill="#FFF3DC">LEVADURA</text>' +
      er.back +
      '<g clip-path="url(#' + u + 'ec)"><rect x="200" y="214" width="200" height="90" fill="url(#' + u + 'liq)"/><rect x="200" y="214" width="200" height="2.5" fill="#F6E3A6"/>' + yeast +
      bubbles(r, 14, 244, 356, 284, 70, { r: 2.4, d: 1.8 }) + '</g>' +
      // CO₂ subiendo por el cuello
      '<g opacity=".8">' + bubbles(r, 5, 290, 310, 186, 70, { r: 2, d: 2, fill: 'none', stroke: 'rgba(255,255,255,.5)', wob: 4 }) + '</g>' +
      er.front +
      // globo
      '<g class="fe-bal"><path d="M300 118C262 116 246 84 250 58C254 26 280 12 300 12C320 12 346 26 350 58C354 84 338 116 300 118Z" fill="url(#' + u + 'bal)"/><path d="M276 40C282 30 290 26 298 25" stroke="rgba(255,255,255,.55)" stroke-width="4" stroke-linecap="round" fill="none"/></g>' +
      '<path d="M288 128Q288 116 294 114H306Q312 116 312 128V132H288Z" fill="#D63A3A"/>' +
      callout(343, 76, 420, 64, 'El CO₂ infla el globo', { a: 'start', s: 15 }) +
      callout(262, 256, 176, 206, 'Levadura', { a: 'end', s: 15 }) +
      T(126, 318, 'Azúcar', { s: 15 }) +
      callout(348, 232, 420, 196, 'Etanol en el líquido', { a: 'start', s: 15 }) +
      Tf(300, 324, 'C_6H_12O_6 → 2 C_2H_5OH + 2 CO_2', { s: 15, fill: '#FFE08A' });
  },
  mount(svg) {
    const b = q(svg, '.fe-bal');
    return {
      still: 7,
      tick(t) {
        const c = t % 12;
        const s = lerp(0.18, 1, ease(seg(c, 0.3, 9))) * (1 - 0.82 * ease(seg(c, 10.8, 12)));
        b.setAttribute('transform', 'translate(300 118) scale(' + s.toFixed(3) + ') translate(-300 -118)');
      },
    };
  },
};
