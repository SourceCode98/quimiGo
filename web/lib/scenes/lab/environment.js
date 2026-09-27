// Química y ambiente: efecto invernadero, smog urbano, refinería y degradación de residuos.
import { P, T, Tf, callout, flame, vgrad, hgrad, rng, seg, ease, lerp, clamp, q, qa } from './kit.js';
import { fmt } from '../../widgets.js';

/** trayectoria ondulada entre dos puntos */
function wave(x1, y1, x2, y2, amp = 5, wl = 16) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  let d = 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1);
  const n = Math.max(8, Math.round(L / 3));
  for (let i = 1; i <= n; i++) {
    const s = (i / n) * L, w = Math.sin((s / wl) * Math.PI * 2) * amp * Math.min(1, s / 12, (L - s) / 12);
    d += 'L' + (x1 + ux * s - uy * w).toFixed(1) + ' ' + (y1 + uy * s + ux * w).toFixed(1);
  }
  return d;
}
const arrowDefs = (u, list) => list.map(([id, c]) => '<marker id="' + u + id + '" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto"><path d="M0 0L10 5L0 10z" fill="' + c + '"/></marker>').join('');
const co2 = (x, y, s = 1, a = 0) => '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + a + ') scale(' + s + ')"><circle cx="-8" cy="0" r="5" fill="#E0433B"/><circle cx="8" cy="0" r="5" fill="#E0433B"/><circle cx="0" cy="0" r="5.6" fill="#59636C" stroke="#8A949C" stroke-width=".8"/></g>';

/* ------------------------------------------------------------------ efecto invernadero */
export const greenhouse = {
  tag: 'Efecto invernadero',
  svg(u) {
    const r = rng(21);
    let stars = '';
    for (let i = 0; i < 40; i++) stars += '<circle class="sc-a sc-twinkle" cx="' + (-300 + r() * 1200).toFixed(0) + '" cy="' + (r() * 200).toFixed(0) + '" r="' + (0.6 + r() * 1.1).toFixed(1) + '" fill="#DCE8F2" style="--d:' + (1.6 + r() * 2.5).toFixed(1) + 's;--dl:' + (-r() * 3).toFixed(1) + 's"/>';
    let mols = '';
    for (let i = 0; i < 17; i++) {
      const x = -30 + i * 40 + r() * 16, R = 690 + (r() - 0.5) * 20, y = 900 - Math.sqrt(R * R - (x - 300) * (x - 300));
      mols += '<g class="sc-a sc-bob" style="--d:' + (2 + r() * 2).toFixed(1) + 's;--dl:' + (-r() * 2).toFixed(1) + 's;--dy:' + (r() < 0.5 ? -4 : 4) + 'px">' + co2(x, y, 0.8, (r() * 60 - 30).toFixed(0)) + '</g>';
    }
    const sunRays = Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return '<path d="M' + (Math.cos(a) * 46).toFixed(1) + ' ' + (Math.sin(a) * 46).toFixed(1) + 'L' + (Math.cos(a) * 60).toFixed(1) + ' ' + (Math.sin(a) * 60).toFixed(1) + '" stroke="#FFD166" stroke-width="4" stroke-linecap="round"/>'; }).join('');
    const yS = (x, R) => 900 - Math.sqrt(R * R - (x - 300) * (x - 300));
    const inc = [[104, 96, 232], [112, 84, 360], [88, 104, 150]];
    const ir1 = [[248, yS(248, 640)], [300, yS(300, 692)], [352, yS(352, 640)]];
    const ir2 = [[410, yS(410, 640)], [452, yS(452, 692)], [494, yS(494, 640)]];
    return '<defs>' + arrowDefs(u, [['ay', '#FFD166'], ['ar', '#FF7B54']]) +
      '<radialGradient id="' + u + 'sun"><stop offset="0" stop-color="#FFF4C2"/><stop offset=".55" stop-color="#FFD166"/><stop offset="1" stop-color="#F7A531"/></radialGradient>' +
      '<radialGradient id="' + u + 'sg"><stop offset="0" stop-color="#FFD166" stop-opacity=".45"/><stop offset="1" stop-color="#FFD166" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + u + 'earth" cx="300" cy="900" r="640" gradientUnits="userSpaceOnUse"><stop offset=".9" stop-color="#1F5F8B"/><stop offset="1" stop-color="#3C8DC0"/></radialGradient>' +
      '<radialGradient id="' + u + 'atm" cx="300" cy="900" r="712" gradientUnits="userSpaceOnUse"><stop offset=".895" stop-color="#6FB7E8" stop-opacity=".35"/><stop offset=".96" stop-color="#6FB7E8" stop-opacity=".12"/><stop offset="1" stop-color="#6FB7E8" stop-opacity="0"/></radialGradient>' +
      '</defs>' + stars +
      '<circle cx="300" cy="900" r="712" fill="url(#' + u + 'atm)"/>' +
      // capa de gases
      '<path d="M-360 ' + yS(-360, 680) + 'A680 680 0 0 1 960 ' + yS(960, 680) + '" fill="none" stroke="rgba(170,180,195,.14)" stroke-width="30"/>' +
      '<circle cx="300" cy="900" r="640" fill="url(#' + u + 'earth)"/>' +
      // continentes
      '<path d="M150 272C180 262 220 268 240 262C262 256 280 266 300 264C330 262 350 272 380 268L400 290C360 300 320 296 280 300C240 304 200 298 160 300Z" fill="#3E9A5B"/>' +
      '<path d="M430 282C460 272 500 276 530 272L560 300C520 306 480 304 440 306Z" fill="#3E9A5B"/><path d="M40 300C60 290 90 292 110 288L118 318C90 322 60 320 40 322Z" fill="#3E9A5B"/>' +
      '<path d="M-340 900A640 640 0 0 1 940 900" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="2"/>' +
      mols +
      // sol
      '<circle cx="62" cy="54" r="90" fill="url(#' + u + 'sg)"/>' +
      '<g transform="translate(62 54)"><g class="sc-a sc-spin" style="--d:40s">' + sunRays + '</g></g>' +
      '<circle cx="62" cy="54" r="38" fill="url(#' + u + 'sun)"/>' +
      // rayos del sol
      inc.map(([x1, y1, x2], i) => '<path class="sc-flow" d="' + wave(x1, y1, x2, yS(x2, 640) - 6, 4, 14) + '" fill="none" stroke="#FFD166" stroke-width="3" stroke-dasharray="26 14" marker-end="url(#' + u + 'ay)" style="--d:' + (0.9 + i * 0.15) + 's"/>').join('') +
      // calor que rebota
      '<path class="sc-flow" d="' + wave(ir1[0][0], ir1[0][1] - 4, ir1[1][0], ir1[1][1] + 10, 5, 18) + '" fill="none" stroke="#FF7B54" stroke-width="3" stroke-dasharray="26 14" style="--d:1.1s"/>' +
      '<path class="sc-flow" d="' + wave(ir1[1][0], ir1[1][1] + 10, ir1[2][0], ir1[2][1] - 6, 5, 18) + '" fill="none" stroke="#FF7B54" stroke-width="3" stroke-dasharray="26 14" marker-end="url(#' + u + 'ar)" style="--d:1.1s"/>' +
      '<path class="sc-flow" d="' + wave(ir2[0][0], ir2[0][1] - 4, ir2[1][0], ir2[1][1] + 10, 5, 18) + '" fill="none" stroke="#FF7B54" stroke-width="3" stroke-dasharray="26 14" style="--d:1.2s"/>' +
      '<path class="sc-flow" d="' + wave(ir2[1][0], ir2[1][1] + 10, ir2[2][0], ir2[2][1] - 6, 5, 18) + '" fill="none" stroke="#FF7B54" stroke-width="3" stroke-dasharray="26 14" marker-end="url(#' + u + 'ar)" style="--d:1.2s"/>' +
      '<path class="sc-flow" d="' + wave(530, yS(530, 640) - 4, 590, 60, 5, 18) + '" fill="none" stroke="#FF7B54" stroke-width="3" stroke-dasharray="26 14" marker-end="url(#' + u + 'ar)" opacity=".75" style="--d:1.2s"/>' +
      T(62, 118, 'Sol', { s: 17 }) +
      T(150, 150, 'Radiación solar', { a: 'middle', s: 15, fill: '#FFE08A' }) +
      T(300, 150, 'Calor (infrarrojo)', { s: 15, fill: '#FFB199' }) +
      Tf(460, 180, 'Capa de CO_2 y otros gases', { a: 'middle', s: 15 }) +
      T(566, 38, 'Escapa', { a: 'end', s: 14, cls: 'sc-m' }) +
      T(300, 318, 'Tierra', { s: 17 });
  },
};

/* ------------------------------------------------------------------ smog en la ciudad */
function car(x, c, o = {}) {
  const w = o.w || 44, h = o.h || 16;
  const cab = o.bus ? '' : '<path d="M' + (w * 0.22) + ' 0L' + (w * 0.32) + ' ' + (-h * 0.62) + 'H' + (w * 0.72) + 'L' + (w * 0.84) + ' 0Z" fill="' + c + '"/><path d="M' + (w * 0.36) + ' -2L' + (w * 0.42) + ' ' + (-h * 0.5) + 'H' + (w * 0.68) + 'L' + (w * 0.76) + ' -2Z" fill="#A9D2EE" opacity=".85"/>';
  const win = o.bus ? Array.from({ length: Math.floor(w / 14) }, (_, i) => '<rect x="' + (6 + i * 14) + '" y="' + (-h + 4) + '" width="10" height="7" rx="1.5" fill="#A9D2EE" opacity=".85"/>').join('') : '';
  return '<g class="sc-drive" style="--d:' + o.d + 's;--dl:' + o.dl + 's;--x0:' + (o.x0 || -260) + 'px;--x1:' + (o.x1 || 900) + 'px">' +
    '<g transform="translate(' + x + ' ' + o.y + ')">' +
    // humo del exosto
    [0, 1, 2].map((i) => '<circle class="sc-a sc-steam" cx="-4" cy="-3" r="' + (5 + i) + '" fill="#6B6A66" style="--d:2.2s;--dl:' + (-i * 0.7) + 's;--dy:-44px;--dx:-26px;--o:.7"/>').join('') +
    cab + '<rect x="0" y="' + (o.bus ? -h : 0) + '" width="' + w + '" height="' + (o.bus ? h + 8 : 9) + '" rx="3" fill="' + c + '"/>' + win +
    '<circle cx="' + (w * 0.22) + '" cy="' + (o.bus ? 9 : 9) + '" r="4.5" fill="#1B1F24" stroke="#5F6A73" stroke-width="1.5"/><circle cx="' + (w * 0.8) + '" cy="9" r="4.5" fill="#1B1F24" stroke="#5F6A73" stroke-width="1.5"/>' +
    '<rect x="' + (w - 3) + '" y="' + (o.bus ? -2 : 1) + '" width="3" height="3" fill="#FFE08A"/></g></g>';
}
export const smog = {
  tag: 'Contaminación del aire',
  svg(u) {
    const r = rng(33);
    // edificios
    let b = '';
    const blds = [[-240, 70], [-205, 110], [-170, 60], [-140, 95], [-100, 130], [-60, 80], [-25, 105], [10, 150], [50, 88], [90, 118], [128, 70], [160, 132], [196, 205, 'colp'], [232, 100], [268, 150], [305, 84], [340, 124], [378, 96], [414, 138], [452, 80], [488, 110], [524, 92], [560, 124], [600, 76], [640, 104], [680, 86], [720, 118]];
    blds.forEach(([x, h, k]) => {
      const w = k ? 30 : 32 + (h % 3) * 3, y = 262 - h;
      const c = ['#2A3B4A', '#253442', '#2F4050'][Math.floor(r() * 3)];
      b += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + c + '"/>';
      for (let yy = y + 8; yy < 250; yy += 12) for (let xx = x + 5; xx < x + w - 6; xx += 8) if (r() < 0.45) b += '<rect x="' + xx + '" y="' + yy + '" width="4" height="6" fill="#F6D57E" opacity="' + (0.35 + r() * 0.5).toFixed(2) + '"/>';
      if (k) b += '<path d="M' + x + ' ' + y + 'L' + (x + w / 2) + ' ' + (y - 16) + 'L' + (x + w) + ' ' + y + 'Z" fill="#33485A"/><rect x="' + (x + w / 2 - 1) + '" y="' + (y - 30) + '" width="2" height="16" fill="#8C99A6"/><circle class="sc-a sc-pulse" cx="' + (x + w / 2) + '" cy="' + (y - 31) + '" r="3" fill="#FF5A4E" style="--d:1.2s"/>';
    });
    // partículas PM2,5
    let pm = '';
    for (let i = 0; i < 22; i++) pm += '<circle class="sm-p" r="' + (1.8 + r() * 1.6).toFixed(1) + '" fill="#2B2521" stroke="#8A7A66" stroke-width=".8" data-x="' + (-40 + r() * 400).toFixed(0) + '" data-y="' + (70 + r() * 90).toFixed(0) + '" data-tx="' + (478 + r() * 60).toFixed(0) + '" data-ty="' + (172 + r() * 50).toFixed(0) + '" data-o="' + r().toFixed(3) + '"/>';
    // pulmones
    const lung = (s) => '<path transform="translate(505 188) scale(' + s + ' 1)" d="M-6 -44C-6 -40 -8 -34 -14 -32C-30 -26 -44 -8 -46 16C-48 36 -40 50 -28 50C-16 50 -8 42 -8 28V-20" fill="url(#' + u + 'lg)" stroke="#F3A6B4" stroke-width="1.5"/>';
    return '<defs>' + vgrad(u + 'sky', [[0, '#2B3440'], [0.55, '#4A4A45'], [1, '#6B5E4E']]) + vgrad(u + 'hz', [[0, '#8C7B63', 0], [0.5, '#8C7B63', 0.55], [1, '#8C7B63', 0.2]]) +
      '<radialGradient id="' + u + 'lg" cx=".4" cy=".35"><stop offset="0" stop-color="#F7A8B8"/><stop offset="1" stop-color="#D96A83"/></radialGradient>' +
      '<clipPath id="' + u + 'in"><circle cx="505" cy="176" r="76"/></clipPath></defs>' +
      '<rect x="-1400" y="-20" width="3400" height="400" fill="url(#' + u + 'sky)"/>' +
      // cerros orientales con Monserrate
      '<path d="M-600 190L-420 150L-300 170L-200 120L-90 150L0 96L40 70L60 64L80 72L140 108L230 128L320 112L420 140L540 118L660 150L800 132L1200 170V262H-600Z" fill="#26413A"/>' +
      '<path d="M-600 205L-380 178L-240 196L-120 170L0 190L120 168L260 186L400 170L560 190L760 174L1200 196V262H-600Z" fill="#1E3530"/>' +
      '<rect x="54" y="54" width="12" height="10" fill="#E9E4DA"/><path d="M52 55L60 46L68 55Z" fill="#C9C0B0"/><rect x="58" y="42" width="4" height="8" fill="#E9E4DA"/>' +
      b +
      // calle
      '<rect x="-1400" y="262" width="3400" height="40" fill="#23272C"/><rect x="-1400" y="302" width="3400" height="140" fill="#1A1E22"/>' +
      '<path d="M-1400 282H2000" stroke="#E7D38A" stroke-width="2.5" stroke-dasharray="20 18"/>' +
      car(0, '#F2C230', { y: 268, d: 7, dl: -1, w: 42 }) + car(0, '#D9453B', { y: 290, d: 11, dl: -6, w: 110, h: 20, bus: 1, x0: 900, x1: -300 }).replace('<g transform="translate(0 290)">', '<g transform="translate(0 290) scale(-1 1)">') +
      car(0, '#4F8FD0', { y: 268, d: 8.5, dl: -5, w: 44 }) + car(0, '#F2C230', { y: 292, d: 9, dl: -2, w: 42, x0: 900, x1: -300 }).replace('<g transform="translate(0 292)">', '<g transform="translate(0 292) scale(-1 1)">') +
      car(0, '#E6ECF1', { y: 268, d: 9.5, dl: -8, w: 44 }) +
      // neblina de smog
      '<rect class="sc-pulse" x="-1400" y="40" width="3400" height="180" fill="url(#' + u + 'hz)" style="--d:6s;--lo:.7"/>' +
      '<g class="sm-ps">' + pm + '</g>' +
      // lupa: pulmones
      '<path d="M370 128L436 150" stroke="rgba(231,180,96,.6)" stroke-width="1.5" stroke-dasharray="4 4"/>' +
      '<circle cx="505" cy="176" r="80" fill="#1A1414" stroke="#E7B460" stroke-width="2.5"/>' +
      '<g clip-path="url(#' + u + 'in)"><circle cx="505" cy="176" r="80" fill="#2B1C20"/>' +
      '<path d="M505 116V140M505 140L494 150M505 140L516 150" stroke="#F3C7CF" stroke-width="5" stroke-linecap="round" fill="none"/>' +
      lung(1) + lung(-1) +
      '<path d="M494 150L478 170M478 170L470 190M478 170L486 196M516 150L532 170M532 170L540 190M532 170L524 196" stroke="#F3C7CF" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".8"/>' +
      '</g>' +
      '<g class="sm-pi"></g>' +
      T(505, 280, 'Pulmones', { s: 16 }) +
      '<g transform="translate(380 70)"><rect x="-4" y="-14" width="72" height="24" rx="12" fill="#2B2521" stroke="#8A7A66"/>' + T(32, 3, 'PM2,5', { s: 14, fill: '#F4E3C3' }) + '</g>' +
      T(150, 236, 'Humo de los carros', { s: 15 }).replace('<text', '<text dy="0"') ;
  },
  mount(svg) {
    const ps = qa(svg, '.sm-p').map((el) => ({ el, x: +el.dataset.x, y: +el.dataset.y, tx: +el.dataset.tx, ty: +el.dataset.ty, o: +el.dataset.o }));
    return {
      still: 3,
      tick(t) {
        ps.forEach((p) => {
          const f = ((t / 7 + p.o) % 1);
          const k = ease(f);
          const cx = lerp(p.x, 420, 0.6);
          const x = (1 - k) * (1 - k) * p.x + 2 * (1 - k) * k * cx + k * k * p.tx;
          const y = (1 - k) * (1 - k) * p.y + 2 * (1 - k) * k * (p.y - 40) + k * k * p.ty + Math.sin(t * 2 + p.o * 9) * 3;
          p.el.setAttribute('cx', x.toFixed(1)); p.el.setAttribute('cy', y.toFixed(1));
          p.el.style.opacity = Math.min(1, f * 6, (1 - f) * 8);
        });
      },
    };
  },
};

/* ------------------------------------------------------------------ refinería */
const FR = [
  ['Gas', 'menos de 40 °C', '#D8E6EE'],
  ['Gasolina', '40 a 180 °C', '#F4D35E'],
  ['Queroseno', '180 a 250 °C', '#F2A65A'],
  ['Diésel', '250 a 350 °C', '#D9822B'],
  ['Lubricantes', '350 a 400 °C', '#A5643A'],
  ['Asfalto', 'más de 400 °C', '#4A3B34'],
];
export const refinery = {
  tag: 'Destilación fraccionada del petróleo',
  svg(u) {
    const r = rng(4);
    const ys = [52, 94, 136, 178, 220, 268];
    let rows = '';
    FR.forEach(([n, tmp, c], i) => {
      const y = ys[i];
      rows += '<g class="sc-dim rf-row" data-i="' + i + '">' +
        '<path d="M252 ' + y + 'H318" stroke="#5E6B77" stroke-width="9" stroke-linecap="round"/>' +
        '<path class="sc-flow" d="M252 ' + y + 'H318" stroke="' + c + '" stroke-width="4" stroke-dasharray="10 10" stroke-linecap="round" style="--d:' + (0.6 + i * 0.12) + 's"/>' +
        '<circle cx="334" cy="' + y + '" r="11" fill="' + c + '" stroke="' + (i === 5 ? '#8C7A6E' : 'rgba(0,0,0,.25)') + '" stroke-width="1.5"/>' +
        T(354, y + 6, n, { a: 'start', s: 17 }) + T(592, y + 6, tmp, { a: 'end', s: 15, cls: 'sc-m' }) +
        (i < 5 ? '<path d="M178 ' + (y + 20) + 'H250" stroke="rgba(191,216,234,.35)" stroke-width="2" stroke-dasharray="5 4"/>' : '') + '</g>';
    });
    return '<defs>' + vgrad(u + 'tw', [[0, '#3B6E9C'], [0.5, '#7E5A7A'], [1, '#C2452F']]) + vgrad(u + 'st', [[0, '#9AA6B0'], [1, '#6E7B86']]) + '</defs>' +
      '<rect x="-1400" y="292" width="3400" height="80" fill="#1E2A34"/><rect x="-1400" y="292" width="3400" height="4" fill="#33434F"/>' +
      // torre
      '<path d="M176 292V44Q176 24 214 24Q252 24 252 44V292Z" fill="url(#' + u + 'tw)" opacity=".85"/>' +
      '<g opacity=".95">' + bubblesUp(r) + '</g>' +
      '<path d="M176 292V44Q176 24 214 24Q252 24 252 44V292" fill="none" stroke="#C3CDD5" stroke-width="3"/>' +
      '<path d="M184 46Q186 34 204 30" stroke="rgba(255,255,255,.4)" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      // horno
      '<rect x="44" y="212" width="86" height="80" rx="6" fill="#3A4652" stroke="#6B7A86" stroke-width="2"/>' +
      '<rect x="56" y="232" width="62" height="44" rx="4" fill="#1A1414"/>' + flame(74, 274, 0.7) + flame(98, 274, 0.8, 0.12) +
      '<path d="M130 256H176" stroke="#5E6B77" stroke-width="10"/><path class="sc-flow" d="M130 256H176" stroke="#2B2521" stroke-width="5" stroke-dasharray="10 8" style="--d:.8s"/>' +
      '<path d="M-60 238H44" stroke="#5E6B77" stroke-width="10"/><path class="sc-flow" d="M-60 238H44" stroke="#2B2521" stroke-width="5" stroke-dasharray="10 8" style="--d:.8s"/>' +
      T(87, 204, 'Petróleo crudo', { a: 'middle', s: 15 }) +
      T(160, 40, 'Más frío', { a: 'end', s: 14, fill: '#9CC7EE' }) + T(160, 178, 'Más caliente', { a: 'end', s: 14, fill: '#FFB199' }) +
      '<path d="M166 166V56" stroke="#9AA8B3" stroke-width="1.6" marker-end="url(#' + u + 'ah)"/>' +
      '<marker id="' + u + 'ah" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#9AA8B3"/></marker>' +
      rows;
  },
  mount(svg) {
    const rows = qa(svg, '.rf-row');
    return {
      step(n, st) {
        const on = st && st.step != null ? n : -1;
        rows.forEach((g, i) => g.classList.toggle('sc-off', on >= 0 && i !== on));
      },
    };
  },
};
function bubblesUp(r) {
  let h = '';
  for (let i = 0; i < 16; i++) h += '<circle class="sc-a sc-rise" cx="' + (186 + r() * 56).toFixed(1) + '" cy="' + (276 - r() * 20).toFixed(0) + '" r="' + (2 + r() * 2).toFixed(1) + '" fill="rgba(255,255,255,.25)" stroke="rgba(255,255,255,.6)" style="--d:' + (3 + r() * 2).toFixed(1) + 's;--dl:' + (-r() * 5).toFixed(1) + 's;--dy:-' + (150 + r() * 90).toFixed(0) + 'px;--dx:0px;--o:.8"/>';
  return h;
}

/* ------------------------------------------------------------------ degradación de residuos */
const ICON = {
  paper: '<path d="M-14 -18H8L16 -10V18H-14Z" fill="#F1EEE6"/><path d="M8 -18V-10H16" fill="#D4CEC0"/><path d="M-9 -8H9M-9 -2H9M-9 4H9M-9 10H4" stroke="#A7A091" stroke-width="1.6"/>',
  bag: '<path d="M-16 -8H16L13 20H-13Z" fill="#E6ECF1" opacity=".9"/><path d="M-9 -8C-9 -22 -3 -22 -3 -8M3 -8C3 -22 9 -22 9 -8" fill="none" stroke="#E6ECF1" stroke-width="2.4"/><path d="M-10 0L-8 16M0 -2V18M9 1L7 16" stroke="#B7C3CC" stroke-width="1"/>',
  can: '<rect x="-11" y="-18" width="22" height="36" rx="4" fill="#C3CDD5"/><rect x="-11" y="-8" width="22" height="16" fill="#D9453B"/><ellipse cx="0" cy="-18" rx="11" ry="3" fill="#E6ECF1"/><path d="M-7 -12V14" stroke="rgba(255,255,255,.55)" stroke-width="2.4"/>',
  bottle: '<path d="M-4 -22H4V-16C4 -12 11 -10 11 -2V18Q11 22 7 22H-7Q-11 22 -11 18V-2C-11 -10 -4 -12 -4 -16Z" fill="rgba(143,200,242,.55)" stroke="#8FC8F2" stroke-width="1.5"/><rect x="-5" y="-26" width="10" height="5" rx="1.5" fill="#3C74B8"/><rect x="-11" y="2" width="22" height="9" fill="#6FD19A" opacity=".8"/>',
};
const WASTE = [['paper', 'Papel', 1 / 12, '1 mes', '#9ED39B'], ['bag', 'Bolsa plástica', 150, '150 años', '#F2D45C'], ['can', 'Lata de aluminio', 200, '200 años', '#F2A65A'], ['bottle', 'Botella plástica', 450, '450 años', '#F0897F']];
export const plastic = {
  tag: 'Tiempo de degradación',
  svg(u) {
    const X0 = 214, X1 = 540, sx = (y) => X0 + (y / 500) * (X1 - X0);
    let g = '';
    for (let y = 0; y <= 500; y += 100) g += '<path d="M' + sx(y) + ' 44V272" stroke="rgba(154,168,179,.14)"/>' + '<text class="sc-t sc-m" x="' + sx(y) + '" y="292" text-anchor="middle" font-size="14">' + fmt(y, 0) + '</text>';
    let rows = '';
    WASTE.forEach(([ic, n, yrs, lbl, c], i) => {
      const y = 76 + i * 58;
      rows += '<g class="sc-dim pl-row" data-i="' + i + '">' +
        '<g transform="translate(32 ' + y + ')">' + ICON[ic] + '</g>' +
        T(58, y + 6, n, { a: 'start', s: 16 }) +
        '<rect x="' + X0 + '" y="' + (y - 13) + '" width="' + (X1 - X0) + '" height="26" rx="6" fill="rgba(255,255,255,.04)"/>' +
        '<rect class="pl-bar" data-w="' + Math.max(4, sx(yrs) - X0).toFixed(1) + '" x="' + X0 + '" y="' + (y - 13) + '" width="4" height="26" rx="6" fill="' + c + '"/>' +
        '<text class="sc-t pl-val" data-x="' + (Math.max(4, sx(yrs) - X0) + X0 + 10).toFixed(1) + '" x="' + (X0 + 14) + '" y="' + (y + 6) + '" font-size="16" text-anchor="start" style="fill:' + c + '">' + lbl + '</text></g>';
    });
    const hx = sx(75);
    return '<defs></defs>' + g +
      '<path d="M' + X0 + ' 272H' + X1 + '" stroke="#6B7A86" stroke-width="1.5"/>' +
      '<text class="sc-t sc-m" x="' + X1 + '" y="318" text-anchor="end" font-size="14">años</text>' +
      rows +
      '<path d="M' + hx + ' 40V272" stroke="#E7B460" stroke-width="1.6" stroke-dasharray="5 4"/>' +
      '<g transform="translate(' + hx + ' 30)"><circle r="4" fill="#E7B460"/></g>' + T(hx + 10, 28, 'Una vida humana ≈ 75 años', { a: 'start', s: 14, fill: '#FFE08A' });
  },
  mount(svg) {
    const bars = qa(svg, '.pl-bar'), vals = qa(svg, '.pl-val'), rows = qa(svg, '.pl-row');
    return {
      still: 5,
      tick(t) {
        bars.forEach((b, i) => {
          const k = ease(seg(t, 0.3 + i * 0.45, 1.8 + i * 0.45));
          const w = lerp(4, +b.dataset.w, k);
          b.setAttribute('width', w.toFixed(1));
          vals[i].setAttribute('x', (214 + w + 10).toFixed(1));
          vals[i].style.opacity = seg(t, 0.3 + i * 0.45, 0.8 + i * 0.45);
        });
      },
      step(n, st) {
        const on = st && st.step != null ? n : -1;
        rows.forEach((g, i) => g.classList.toggle('sc-off', on >= 0 && i !== on));
      },
    };
  },
};
