// Escena 2D: tabla periódica Z 1-36 con modos de resaltado (ver SPEC.md, "ptable").
import { EL, ELZ, CAT, PT, fmt, esc, reduce } from '../widgets.js';

const METAL = { am: 1, at: 1, tr: 1, mp: 1 };
const KIND3 = {
  metal: ['Metales', '#5E86B8'],
  mt: ['Metaloides', '#9A7FD1'],
  non: ['No metales', '#4FA56A'],
};
const kind3 = (e) => (METAL[e.cat] ? 'metal' : e.cat === 'mt' ? 'mt' : 'non');
const VAL = { 1: 1, 2: 2, 13: 3, 14: 4, 15: 5, 16: 6, 17: 7, 18: 8 };
const VALC = ['', '#D0564F', '#D98B3A', '#C9B03A', '#5AA469', '#2EA3A0', '#4F8FD0', '#6F6CC9', '#A866B8'];
const GNAME = {
  1: 'Metales alcalinos (y el hidrógeno)', 2: 'Metales alcalinotérreos', 13: 'Familia del boro', 14: 'Familia del carbono',
  15: 'Familia del nitrógeno', 16: 'Anfígenos o calcógenos', 17: 'Halógenos', 18: 'Gases nobles',
};
// rampa secuencial (bajo -> alto), legible sobre fondo oscuro
const RAMP = ['#1F3B5A', '#26608C', '#2E8BA8', '#4DB39A', '#A5D17A', '#F2D45C', '#F5A142'];
function ramp(x) {
  x = Math.max(0, Math.min(1, x)) * (RAMP.length - 1);
  const i = Math.min(RAMP.length - 2, Math.floor(x)), f = x - i;
  const a = hex(RAMP[i]), b = hex(RAMP[i + 1]);
  return 'rgb(' + a.map((v, k) => Math.round(v + (b[k] - v) * f)).join(',') + ')';
}
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const RAD = [31, 243], ENR = [0.8, 4.0];

export default function (el) {
  const stage = document.createElement('div');
  stage.className = 'stage sc-stage sc-2d sc-pt' + (reduce ? ' sc-reduce' : '');
  stage.innerHTML = '<div class="sc-tag"></div><div class="sc-ptw"></div>';
  const leg = document.createElement('div');
  leg.className = 'legend sc-leg';
  el.appendChild(stage);
  el.appendChild(leg);
  const wrap = stage.querySelector('.sc-ptw');
  const tag = stage.querySelector('.sc-tag');

  // casillas
  const cells = {};
  ELZ.forEach((e) => {
    if (!e) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sc-ptc';
    b.setAttribute('aria-label', e.name + ', número atómico ' + e.z);
    b.innerHTML = '<em></em><small>' + e.z + '</small><b>' + e.sym + '</b><i></i>';
    b.addEventListener('click', () => pick(e.z));
    wrap.appendChild(b);
    cells[e.z] = b;
  });
  const heads = [];
  for (let g = 1; g <= 18; g++) {
    const h = document.createElement('div');
    h.className = 'sc-pth';
    h.textContent = g;
    wrap.appendChild(h);
    heads.push(h);
  }
  const pers = [];
  for (let p = 1; p <= 4; p++) {
    const h = document.createElement('div');
    h.className = 'sc-pth';
    h.textContent = p;
    wrap.appendChild(h);
    pers.push(h);
  }
  const card = document.createElement('div');
  card.className = 'sc-ptcard';
  card.setAttribute('aria-live', 'polite');
  wrap.appendChild(card);
  const ov = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  ov.setAttribute('class', 'sc-ptov');
  wrap.appendChild(ov);

  let S = { hl: 'none' }, sel = null, L = null;

  function layout() {
    const W = stage.clientWidth, H = stage.clientHeight;
    if (!W || !H) return;
    const pad = W < 560 ? 8 : 14;
    const top = 30; // espacio para la etiqueta del modo
    const wide = W / H > 2;
    // columnas: etiqueta de periodo (0.6) + 18 + flecha vertical (0.8); filas: cabecera .5 + 4 + flecha .8 (+ tarjeta si no es ancho)
    const cw = (W - 2 * pad) / (18 + 1.4);
    const cardH = wide ? 0 : 78;
    let ch = (H - top - pad - cardH - 6) / (4 + 1.3);
    ch = Math.min(ch, cw * 1.5);
    const cs = Math.min(cw, wide ? ch : cw);
    const rh = wide ? cs : ch;
    const tw = cs * 19.4, th = rh * 5.3 + (wide ? 0 : cardH + 6);
    const ox = (W - tw) / 2 + cs * 0.6, oy = top + Math.max(0, (H - top - pad - th) / 2) + rh * 0.5;
    L = { W, H, cs, rh, ox, oy, wide };
    wrap.style.setProperty('--fs', Math.max(10, Math.min(20, cs * 0.36)) + 'px');
    wrap.style.setProperty('--fz', Math.max(8, Math.min(11, cs * 0.19)) + 'px');
    stage.classList.toggle('sc-small', cs < 30);
    const g = 2; // separación
    ELZ.forEach((e) => {
      if (!e) return;
      const [p, c] = PT(e.z), b = cells[e.z];
      Object.assign(b.style, { left: ox + (c - 1) * cs + g / 2 + 'px', top: oy + (p - 1) * rh + g / 2 + 'px', width: cs - g + 'px', height: rh - g + 'px' });
      b.querySelector('small').style.display = cs >= 34 ? '' : 'none';
    });
    heads.forEach((h, i) => Object.assign(h.style, { left: ox + i * cs + 'px', top: oy - rh * 0.5 + 'px', width: cs + 'px', lineHeight: rh * 0.5 + 'px' }));
    pers.forEach((h, i) => Object.assign(h.style, { left: ox - cs * 0.6 + 'px', top: oy + i * rh + 'px', width: cs * 0.6 + 'px', lineHeight: rh + 'px' }));
    // tarjeta: hueco central (ancho) o debajo de la tabla (angosto)
    const cr = wide
      ? { x: ox + 2 * cs + 4, y: oy + 4, w: cs * 10 - 8, h: rh * 3 - 8 }
      : { x: ox - cs * 0.6, y: oy + rh * 4.8 + 6, w: cs * 19.4, h: cardH };
    Object.assign(card.style, { left: cr.x + 'px', top: cr.y + 'px', width: cr.w + 'px', height: cr.h + 'px' });
    ov.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    ov.setAttribute('width', W);
    ov.setAttribute('height', H);
    paint(false);
  }

  function paint(anim) {
    if (!L) return;
    const hl = S.hl || 'none';
    const groups = [].concat(S.groups || []), periods = [].concat(S.periods || []), els = [].concat(S.els || []);
    const showVal = L.cs >= 40;
    ELZ.forEach((e) => {
      if (!e) return;
      const b = cells[e.z], [p, g] = PT(e.z);
      let bg = '#1C2934', fg = '#E6ECF1', lo = false, txt = '', circ = 0;
      if (hl === 'cats') { bg = CAT[e.cat][1]; fg = '#fff'; }
      else if (hl === 'metals') { bg = KIND3[kind3(e)][1]; fg = '#fff'; }
      else if (hl === 'radius') {
        const x = (e.rad - RAD[0]) / (RAD[1] - RAD[0]);
        bg = ramp(x); fg = x > 0.62 ? '#14202A' : '#fff';
        if (showVal) txt = e.rad;
        circ = 0.25 + 0.7 * Math.sqrt(x);
      } else if (hl === 'en') {
        if (e.en == null) { bg = '#26323C'; fg = '#8795A1'; if (showVal) txt = '—'; }
        else { const x = (e.en - ENR[0]) / (ENR[1] - ENR[0]); bg = ramp(x); fg = x > 0.62 ? '#14202A' : '#fff'; if (showVal) txt = fmt(e.en, 2); }
      } else if (hl === 'valence') {
        const v = e.z === 2 ? 2 : VAL[g];
        if (v) { bg = VALC[v]; fg = '#fff'; if (showVal) txt = v + ' e⁻'; } else lo = true;
      } else if (hl === 'groups') {
        if (groups.includes(g)) { bg = '#2F6FB0'; fg = '#fff'; } else lo = true;
      } else if (hl === 'periods') {
        if (periods.includes(p)) { bg = '#2F6FB0'; fg = '#fff'; } else lo = true;
      }
      if (els.length && hl !== 'groups' && hl !== 'periods' && !els.includes(e.sym) && hl === 'none') lo = true;
      b.style.backgroundColor = bg;
      b.style.color = fg;
      b.classList.toggle('sc-lo', lo);
      b.classList.toggle('sc-pz', els.includes(e.sym) && !reduce);
      b.classList.toggle('sc-on', sel === e.z || (reduce && els.includes(e.sym)));
      b.querySelector('i').textContent = txt;
      b.querySelector('i').style.display = txt ? '' : 'none';
      const em = b.querySelector('em');
      const d = circ && L.cs >= 34 ? circ * Math.min(L.cs, L.rh) * 0.9 : 0;
      em.style.width = em.style.height = d + 'px';
      em.style.opacity = d ? 1 : 0;
    });
    heads.forEach((h, i) => {
      const g = i + 1;
      h.textContent = hl === 'valence' && VAL[g] ? (L.cs >= 34 ? VAL[g] + ' e⁻' : VAL[g]) : g;
      h.classList.toggle('sc-on', (hl === 'groups' && groups.includes(g)) || (hl === 'valence' && !!VAL[g]));
      h.style.opacity = hl === 'valence' && !VAL[g] ? 0.35 : 1;
    });
    pers.forEach((h, i) => h.classList.toggle('sc-on', hl === 'periods' && periods.includes(i + 1)));
    drawOverlay(hl);
    drawCard();
  }

  function drawOverlay(hl) {
    const { cs, rh, ox, oy } = L;
    const X = (c) => ox + (c - 1) * cs, Y = (r) => oy + (r - 1) * rh;
    let h = '<defs><marker id="scpta" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#FFE08A"/></marker></defs>';
    // escalera metales / metaloides
    const stair = 'M' + X(13) + ' ' + Y(2) + 'V' + Y(3) + 'H' + X(14) + 'V' + Y(5);
    h += '<path class="sc-fade" d="' + stair + '" fill="none" stroke="#FFE08A" stroke-width="' + Math.max(2.5, cs * 0.09) + '" stroke-linejoin="round" stroke-linecap="round" style="opacity:' + (hl === 'metals' ? 1 : 0) + '"/>';
    // flechas de tendencia
    const arrows = (hl === 'radius' || hl === 'en') && S.arrow !== false;
    const up = hl === 'en';
    const yb = Y(5) + rh * 0.42, x1 = X(1) + cs * 0.3, x2 = X(19) - cs * 0.3;
    const xr = X(19) + cs * 0.4, y1 = Y(1) + rh * 0.2, y2 = Y(5) - rh * 0.2;
    const sw = Math.max(3, cs * 0.12);
    const lbl = hl === 'en' ? 'Aumenta la electronegatividad' : 'Aumenta el radio atómico';
    const fs = Math.max(10, Math.min(14, cs * 0.28));
    const tw = lbl.length * fs * 0.56 + 16;
    const cx = (x1 + x2) / 2;
    h += '<g class="sc-fade" style="opacity:' + (arrows ? 1 : 0) + '">' +
      '<line x1="' + (up ? x1 : x2) + '" y1="' + yb + '" x2="' + (up ? x2 : x1) + '" y2="' + yb + '" stroke="#FFE08A" stroke-width="' + sw + '" marker-end="url(#scpta)" stroke-linecap="round"/>' +
      '<line x1="' + xr + '" y1="' + (up ? y2 : y1) + '" x2="' + xr + '" y2="' + (up ? y1 : y2) + '" stroke="#FFE08A" stroke-width="' + sw + '" marker-end="url(#scpta)" stroke-linecap="round"/>' +
      '<rect x="' + (cx - tw / 2) + '" y="' + (yb - fs * 0.8) + '" width="' + tw + '" height="' + fs * 1.6 + '" rx="' + fs * 0.8 + '" fill="#101A22" stroke="#FFE08A" stroke-width="1.2"/>' +
      '<text x="' + cx + '" y="' + (yb + fs * 0.36) + '" text-anchor="middle" font-size="' + fs + '" font-weight="600" fill="#FFE08A">' + lbl + '</text></g>';
    ov.innerHTML = h;
  }

  function title() {
    const hl = S.hl || 'none', gs = [].concat(S.groups || []), ps = [].concat(S.periods || []);
    if (hl === 'groups' && gs.length) return gs.length === 1 ? 'Grupo ' + gs[0] + (GNAME[gs[0]] ? ' · ' + GNAME[gs[0]] : '') : 'Grupos ' + gs.join(' y ');
    if (hl === 'periods' && ps.length) return ps.length === 1 ? 'Periodo ' + ps[0] : 'Periodos ' + ps.join(' y ');
    return {
      none: 'Tabla periódica · Z 1 a 36', cats: 'Familias de elementos', metals: 'Metales, no metales y metaloides',
      radius: 'Radio atómico (pm)', en: 'Electronegatividad (escala de Pauling)', valence: 'Electrones de valencia', groups: 'Grupos (columnas)', periods: 'Periodos (filas)',
    }[hl] || 'Tabla periódica';
  }

  function drawCard() {
    const hl = S.hl || 'none';
    tag.textContent = title();
    const e = sel ? ELZ[sel] : null;
    if (!e) {
      let sub = 'Toca una casilla para ver sus datos.';
      if (hl === 'groups') sub = 'Los elementos de un mismo grupo tienen propiedades químicas parecidas.';
      else if (hl === 'periods') sub = 'En un periodo, los elementos tienen el mismo número de capas de electrones.';
      else if (hl === 'metals') sub = 'La línea dorada (escalera) separa los metales de los no metales.';
      else if (hl === 'valence') sub = 'En los grupos 1, 2 y 13 a 18, el grupo indica los electrones de la última capa.';
      else if (hl === 'radius') sub = 'Más cálido = átomo más grande.';
      else if (hl === 'en') sub = 'Más cálido = atrae con más fuerza los electrones.';
      const els = [].concat(S.els || []).map((s) => EL[s]).filter(Boolean);
      if (els.length) sub = els.map((x) => '<b>' + esc(x.name) + '</b> (' + x.sym + ')').join(' · ');
      card.innerHTML = '<h4>' + esc(title()) + '</h4><p>' + sub + '</p>';
      return;
    }
    const [p, g] = PT(e.z);
    const extra = hl === 'radius' ? ' · Radio: <b>' + e.rad + ' pm</b>' : hl === 'en' ? ' · Electronegatividad: <b>' + (e.en == null ? '—' : fmt(e.en, 2)) + '</b>' : '';
    card.innerHTML = '<h4>' + esc(e.name) + ' (' + e.sym + ')</h4>' +
      '<p>Z = <b>' + e.z + '</b> · Masa: <b>' + fmt(e.m, 1) + ' u</b>' + extra + '</p>' +
      '<p><span class="sc-sw" style="background:' + CAT[e.cat][1] + '"></span>' + CAT[e.cat][0] + ' · Grupo ' + g + ', periodo ' + p + '</p>';
  }

  function legend() {
    const hl = S.hl || 'none';
    let h = '';
    if (hl === 'cats') h = Object.keys(CAT).map((k) => '<span><i class="dot" style="background:' + CAT[k][1] + '"></i>' + CAT[k][0] + '</span>').join('');
    else if (hl === 'metals') h = Object.keys(KIND3).map((k) => '<span><i class="dot" style="background:' + KIND3[k][1] + '"></i>' + KIND3[k][0] + '</span>').join('') + '<span><i class="dot" style="background:#FFE08A;height:3px;border:0"></i>Escalera</span>';
    else if (hl === 'radius' || hl === 'en') {
      const g = 'linear-gradient(90deg,' + RAMP.join(',') + ')';
      h = hl === 'radius'
        ? '<span>31 pm <i class="sc-grad" style="background:' + g + '"></i> 243 pm</span>'
        : '<span>0,8 <i class="sc-grad" style="background:' + g + '"></i> 4,0</span><span><i class="dot" style="background:#26323C"></i>Sin valor (gases nobles)</span>';
    } else if (hl === 'valence') h = [1, 2, 3, 4, 5, 6, 7, 8].map((v) => '<span><i class="dot" style="background:' + VALC[v] + '"></i>' + v + '</span>').join('');
    leg.innerHTML = h;
  }

  function pick(z) {
    sel = sel === z ? null : z;
    paint(true);
  }

  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => layout()) : null;
  if (ro) ro.observe(stage);
  else window.addEventListener('resize', layout);

  return {
    set(state) {
      S = state || { hl: 'none' };
      if (!['none', 'groups', 'periods', 'cats', 'metals', 'radius', 'en', 'valence'].includes(S.hl)) S = Object.assign({}, S, { hl: 'none' });
      sel = null;
      legend();
      if (!L) layout();
      else paint(true);
    },
    dispose() {
      if (ro) ro.disconnect();
      else window.removeEventListener('resize', layout);
      stage.remove();
      leg.remove();
    },
  };
}
