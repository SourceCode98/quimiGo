// Métodos de separación de mezclas: filtración, decantación, evaporación, destilación, imantación y tamizado.
import { P, BENCH, T, callout, bench, glow, stand, ring, beaker, erlen, bunsen, bubbles, steam, drop, vgrad, rng, seg, ease, lerp, clamp, q, qa } from './kit.js';

const grains = (r, n, pts, fill, rad = 1.6) => {
  let h = '';
  for (let i = 0; i < n; i++) { const [x, y] = pts(r); h += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (rad * (0.6 + r() * 0.8)).toFixed(1) + '" fill="' + fill[i % fill.length] + '"/>'; }
  return h;
};

/* ------------------------------------------------------------------ filtración */
export const filtration = {
  tag: 'Filtración',
  svg(u) {
    const r = rng(7);
    const bk = beaker(250, 215, 100, 75);
    // vaso que vierte (arriba a la derecha, inclinado)
    const pour = '<g transform="rotate(-50 400 52)">' +
      '<clipPath id="' + u + 'pc"><path d="M375 17V80Q375 87 382 87H418Q425 87 425 80V17Z"/></clipPath>' +
      '<g clip-path="url(#' + u + 'pc)"><rect x="300" y="54" width="220" height="200" transform="rotate(50 400 52)" fill="url(#' + u + 'mud)"/></g>' +
      '<path d="M372 17Q375 17 375 23V80Q375 87 382 87H418Q425 87 425 80V23Q425 17 428 15" fill="none" stroke="' + P.glass + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M381 30V78" stroke="' + P.hi + '" stroke-width="3" stroke-linecap="round" opacity=".5"/></g>';
    return '<defs>' + vgrad(u + 'mud', [[0, '#9C7B55'], [1, '#6E5134']]) + vgrad(u + 'w', [[0, P.waterTop, 0.75], [1, P.water, 0.8]]) +
      vgrad(u + 'mw', [[0, '#8FB0BF', 0.85], [1, '#6F8E9C', 0.85]]) +
      '<clipPath id="' + u + 'bc"><path d="' + bk.clip + '"/></clipPath></defs>' +
      glow(u, 300, 170, 230) + bench() +
      stand(92, 30, [[100, 236]]) + ring(300, 100, 66) +
      bk.back +
      // filtrado que sube
      '<g clip-path="url(#' + u + 'bc)"><rect class="fl-lvl" x="240" y="250" width="120" height="60" fill="url(#' + u + 'w)"/><rect class="fl-top" x="240" y="250" width="120" height="2.5" fill="' + P.waterTop + '"/></g>' +
      // embudo
      '<path d="M225 86L293 172V230L307 234V172L375 86" fill="' + P.glassFill + '"/>' +
      '<rect x="296.5" y="172" width="7" height="58" fill="' + P.water + '" opacity=".55"/>' +
      // papel filtro
      '<path d="M234 91L300 168L366 91Z" fill="#EFE8D8"/><path d="M300 168L324 91" stroke="#CFC4AC" stroke-width="1.5"/><path d="M234 91L366 91" stroke="#FFFFFF" stroke-width="2" opacity=".6"/>' +
      // agua turbia y arena retenida
      '<path d="M248.7 108L271.8 135Q300 128 328.2 135L351.3 108Z" fill="url(#' + u + 'mw)"/>' +
      '<path d="M249 108H351" stroke="#B7D2DE" stroke-width="2"/>' +
      '<path d="M271.8 135Q300 128 328.2 135L300 168Z" fill="' + P.sand + '"/>' +
      grains(r, 40, (r) => { const y = 136 + r() * 28, hw = 28 * (168 - y) / 33; return [300 + (r() * 2 - 1) * hw * 0.85, y]; }, [P.sandD, '#DDB783', '#7B5A36']) +
      '<path d="M222 83Q225 85 227 88L293 172V230L307 234V172L373 88Q375 85 378 83" fill="none" stroke="' + P.glass + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M238 96L288 157" stroke="' + P.hi + '" stroke-width="3" stroke-linecap="round" opacity=".45"/>' +
      // gotas
      '<g class="fl-drops">' + [0, 0.45, 0.9].map((d) => '<g class="sc-a sc-drop" style="--d:1.35s;--dl:' + d + 's;--dy:40px">' + drop(300, 240, 0.8, P.waterTop) + '</g>').join('') + '</g>' +
      bk.front +
      pour + '<path class="sc-flow" d="M356 50Q344 58 338 110" fill="none" stroke="#8A6A47" stroke-width="5" stroke-linecap="round" stroke-dasharray="14 6" style="--d:.6s"/>' +
      callout(425, 72, 446, 124, 'Agua con arena', { a: 'start' }) +
      callout(360, 97, 446, 158, 'Papel filtro', { a: 'start' }) +
      callout(318, 150, 446, 192, 'Arena (residuo)', { a: 'start' }) +
      callout(338, 272, 446, 262, 'Agua filtrada', { a: 'start' });
  },
  mount(svg) {
    const lvl = q(svg, '.fl-lvl'), top = q(svg, '.fl-top'), drops = qa(svg, '.fl-drops > g');
    return {
      still: 5,
      tick(t) {
        const f = ((t % 12) / 12);
        const y = lerp(284, 252, ease(seg(f, 0, 0.85)));
        lvl.setAttribute('y', y); top.setAttribute('y', y);
        drops.forEach((d) => d.style.setProperty('--dy', (y - 244) + 'px'));
      },
    };
  },
};

/* ------------------------------------------------------------------ decantación */
const BULB = 'M292 52C270 62 242 95 242 125C242 160 280 190 294 205H306C320 190 358 160 358 125C358 95 330 62 308 52Z';
export const decantation = {
  tag: 'Decantación',
  svg(u) {
    const bk = beaker(250, 236, 100, 54);
    return '<defs>' + vgrad(u + 'oil', [[0, P.oilTop], [1, P.oil]]) + vgrad(u + 'w', [[0, P.waterTop, 0.85], [1, P.water, 0.9]]) +
      '<clipPath id="' + u + 'fc"><path d="' + BULB + '"/><rect x="296" y="200" width="8" height="60"/></clipPath><clipPath id="' + u + 'bc"><path d="' + bk.clip + '"/></clipPath></defs>' +
      glow(u, 300, 150, 230) + bench() +
      stand(150, 24, [[128, 238]]) +
      '<path d="M238 128A62 11 0 0 1 362 128" fill="none" stroke="' + P.steelD + '" stroke-width="4"/>' +
      '<path d="' + BULB + '" fill="' + P.glassFill + '"/>' +
      '<g clip-path="url(#' + u + 'fc)">' +
      '<rect class="dc-oil" x="230" y="80" width="140" height="70" fill="url(#' + u + 'oil)"/>' +
      '<rect class="dc-oilt" x="230" y="80" width="140" height="3" fill="#FFF0B8"/>' +
      '<rect class="dc-w" x="230" y="150" width="140" height="120" fill="url(#' + u + 'w)"/>' +
      '<rect class="dc-wt" x="230" y="150" width="140" height="2.5" fill="#D8EEFB"/>' +
      '</g>' +
      '<path d="' + BULB + '" fill="none" stroke="' + P.glass + '" stroke-width="3"/>' +
      '<path d="M254 108C256 92 268 78 282 68" stroke="' + P.hi + '" stroke-width="4" stroke-linecap="round" opacity=".5" fill="none"/>' +
      // cuello y tapón
      '<path d="M292 52V36M308 52V36" stroke="' + P.glass + '" stroke-width="3"/>' +
      '<path d="M289 24H311L308 38H292Z" fill="#3F4A55" stroke="#6B7A86" stroke-width="1.5"/>' +
      // vástago y llave
      '<path d="M296 205V262M304 205V262" stroke="' + P.glass + '" stroke-width="2.6"/>' +
      '<rect class="dc-sw" x="298" y="218" width="4" height="44" fill="' + P.water + '" opacity="0"/>' +
      '<rect x="284" y="207" width="32" height="12" rx="4" fill="#DDE6EC" stroke="' + P.glass + '" stroke-width="1.5"/>' +
      '<g class="dc-h"><rect x="279" y="210" width="42" height="6" rx="3" fill="#3C74B8"/><circle cx="300" cy="213" r="5" fill="#2A5A95"/></g>' +
      '<path d="M238 128A62 11 0 0 0 362 128" fill="none" stroke="' + P.steel + '" stroke-width="4"/>' +
      bk.back +
      '<g clip-path="url(#' + u + 'bc)"><rect class="dc-b" x="240" y="288" width="120" height="40" fill="url(#' + u + 'w)"/></g>' +
      '<path class="dc-st sc-flow" d="M300 262V290" stroke="' + P.water + '" stroke-width="4" stroke-dasharray="12 4" style="--d:.5s" opacity="0"/>' +
      bk.front +
      callout(350, 110, 396, 96, 'Aceite (menos denso)', { a: 'start' }) +
      callout(348, 168, 396, 166, 'Agua (más densa)', { a: 'start' }) +
      callout(318, 213, 396, 220, 'Llave', { a: 'start' }) +
      callout(345, 281, 396, 272, 'Agua separada', { a: 'start' });
  },
  mount(svg) {
    const oil = q(svg, '.dc-oil'), oilt = q(svg, '.dc-oilt'), w = q(svg, '.dc-w'), wt = q(svg, '.dc-wt'), h = q(svg, '.dc-h'), st = q(svg, '.dc-st'), sw = q(svg, '.dc-sw'), b = q(svg, '.dc-b');
    return {
      still: 4.2,
      tick(t) {
        const c = t % 11;
        const open = seg(c, 1, 1.5) * (1 - seg(c, 6.8, 7.3));
        const drain = ease(seg(c, 1.5, 6.8));
        const reset = seg(c, 9.5, 11);
        const d = drain * (1 - reset);
        const yi = lerp(150, 203, d);
        oil.setAttribute('y', yi - 70); oilt.setAttribute('y', yi - 70);
        w.setAttribute('y', yi); wt.setAttribute('y', yi);
        wt.style.opacity = yi > 200 ? 0 : 1;
        h.setAttribute('transform', 'rotate(' + (90 * open) + ' 300 213)');
        const flowing = open > 0.6 && drain < 0.995;
        st.style.opacity = flowing ? 1 : 0; sw.style.opacity = flowing ? 0.8 : 0;
        const by = lerp(288, 258, d);
        b.setAttribute('y', by);
        st.setAttribute('d', 'M300 262V' + by);
      },
    };
  },
};

/* ------------------------------------------------------------------ evaporación */
export const evaporation = {
  tag: 'Evaporación',
  svg(u) {
    const r = rng(11);
    const dish = 'M232 174Q300 236 368 174Z';
    let cr = '';
    for (let i = 0; i < 26; i++) {
      const x = 252 + r() * 96, yb = 176 + 26 * (1 - Math.pow((x - 300) / 58, 2)) - 2 - r() * 5, s = 2.5 + r() * 3.5;
      cr += '<rect x="' + (x - s / 2).toFixed(1) + '" y="' + (yb - s).toFixed(1) + '" width="' + s.toFixed(1) + '" height="' + s.toFixed(1) + '" transform="rotate(' + (r() * 40 - 20).toFixed(0) + ' ' + x.toFixed(1) + ' ' + yb.toFixed(1) + ')" fill="#FFFFFF" stroke="#CFE3EE" stroke-width=".6"/>';
    }
    return '<defs>' + vgrad(u + 'w', [[0, P.waterTop, 0.8], [1, P.water, 0.9]]) + vgrad(u + 'por', [[0, '#F4F7F9'], [1, '#BCC7CF']]) +
      '<clipPath id="' + u + 'dc"><path d="M236 176Q300 230 364 176Z"/></clipPath>' +
      '<pattern id="' + u + 'mesh" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 0L6 6M6 0L0 6" stroke="#9AA6B0" stroke-width=".8"/></pattern></defs>' +
      glow(u, 300, 190, 220, '#3A3326') + bench() +
      // trípode
      '<path d="M262 214L246 292M338 214L354 292M300 214V290" stroke="' + P.steelD + '" stroke-width="5" stroke-linecap="round"/>' +
      '<rect x="240" y="208" width="120" height="7" rx="2" fill="url(#' + u + 'mesh)" stroke="' + P.steel + '" stroke-width="1.5"/>' +
      '<g class="ev-fl">' + bunsen(300, 262) + '</g>' +
      // cápsula
      '<path d="' + dish + '" fill="url(#' + u + 'por)"/>' +
      '<g clip-path="url(#' + u + 'dc)"><rect class="ev-w" x="230" y="182" width="140" height="60" fill="url(#' + u + 'w)"/><rect class="ev-wt" x="230" y="182" width="140" height="2" fill="#D8EEFB"/></g>' +
      '<g class="ev-cr" opacity="0">' + cr + '</g>' +
      '<path d="M228 174H372" stroke="#F4F7F9" stroke-width="5" stroke-linecap="round"/>' +
      '<g class="ev-steam">' + steam(r, 6, 258, 342, 168, 90) + '</g>' +
      callout(346, 188, 420, 146, 'Agua salada', { a: 'start' }) +
      callout(318, 110, 420, 96, 'Vapor de agua', { a: 'start' }) +
      '<g class="ev-crl" opacity="0">' + callout(276, 196, 190, 150, 'Cristales de sal', { a: 'end' }) + '</g>' +
      callout(358, 211, 420, 208, 'Rejilla', { a: 'start' }) +
      callout(307, 272, 420, 262, 'Mechero', { a: 'start' });
  },
  mount(svg) {
    const w = q(svg, '.ev-w'), wt = q(svg, '.ev-wt'), cr = q(svg, '.ev-cr'), crl = q(svg, '.ev-crl'), stm = q(svg, '.ev-steam');
    let fixed = null;
    const api = {
      still: 8.6,
      tick(t) {
        const c = fixed != null ? fixed : t % 13;
        const k = ease(seg(c, 0.5, 8)) * (1 - seg(c, 11.4, 13));
        const y = lerp(180, 205, k);
        w.setAttribute('y', y); wt.setAttribute('y', y);
        w.style.opacity = wt.style.opacity = 1 - seg(k, 0.85, 1);
        const c2 = clamp((k - 0.35) / 0.55);
        cr.setAttribute('opacity', c2); crl.setAttribute('opacity', c2);
        stm.setAttribute('opacity', 1 - seg(k, 0.7, 1) * 0.85);
      },
      step(n) { fixed = n >= 1 ? 9 : null; if (fixed != null) api.tick(0); },
    };
    return api;
  },
};

/* ------------------------------------------------------------------ destilación */
export const distillation = {
  tag: 'Destilación',
  svg(u) {
    const r = rng(5);
    const ang = 19.3;
    const er = erlen(440, 290, 88, 86, { nw: 22, nh: 26 });
    return '<defs>' + vgrad(u + 'mx', [[0, '#B0628F', 0.85], [1, '#7E3A64', 0.95]]) + vgrad(u + 'ds', [[0, '#D5EEFB', 0.8], [1, '#9FD2F0', 0.9]]) +
      '<clipPath id="' + u + 'fl"><circle cx="130" cy="176" r="46"/></clipPath><clipPath id="' + u + 'ec"><path d="' + er.clip + '"/></clipPath>' +
      '<pattern id="' + u + 'mesh" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 0L6 6M6 0L0 6" stroke="#9AA6B0" stroke-width=".8"/></pattern></defs>' +
      glow(u, 300, 170, 260) + bench() +
      // trípode y mechero
      '<path d="M95 232L82 292M165 232L178 292" stroke="' + P.steelD + '" stroke-width="5" stroke-linecap="round"/>' +
      '<rect x="80" y="226" width="100" height="7" rx="2" fill="url(#' + u + 'mesh)" stroke="' + P.steel + '" stroke-width="1.5"/>' +
      bunsen(130, 272) +
      // balón
      '<circle cx="130" cy="176" r="46" fill="' + P.glassFill + '"/>' +
      '<g clip-path="url(#' + u + 'fl)"><rect x="80" y="180" width="100" height="50" fill="url(#' + u + 'mx)"/><rect x="80" y="180" width="100" height="2.5" fill="#D59BC0"/>' +
      bubbles(r, 10, 100, 160, 222, 40, { r: 2.6, d: 1.3 }) + '</g>' +
      '<path d="M122 132A46 46 0 1 0 138 132V78H122Z" fill="none" stroke="' + P.glass + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M98 160A34 34 0 0 1 112 142" stroke="' + P.hi + '" stroke-width="4" stroke-linecap="round" fill="none" opacity=".5"/>' +
      // brazo lateral
      '<path d="M138 100L205 118" stroke="' + P.glass + '" stroke-width="7" stroke-linecap="round"/><path d="M138 100L205 118" stroke="#1A2530" stroke-width="2.5" stroke-linecap="round"/>' +
      // vapor en el cuello
      '<g opacity=".7">' + steam(r, 3, 124, 136, 132, 34, { w: 2, c: 'rgba(255,255,255,.6)' }) + '</g>' +
      // tapón y termómetro
      '<rect x="119" y="70" width="22" height="14" rx="3" fill="#7A2E2E"/>' +
      '<rect x="127" y="28" width="6" height="84" rx="3" fill="#EEF3F6" stroke="#9AA8B3" stroke-width="1"/><rect x="128.8" y="60" width="2.4" height="48" fill="#E4574B"/><circle cx="130" cy="110" r="4" fill="#E4574B"/>' +
      T(150, 42, '78 °C', { a: 'start', s: 15, fill: P.flameY }) +
      // refrigerante
      '<g transform="translate(205 117) rotate(' + ang + ')">' +
      '<rect x="18" y="-26" width="8" height="16" fill="rgba(79,163,224,.35)" stroke="' + P.glass + '" stroke-width="2"/>' +
      '<rect x="196" y="10" width="8" height="18" fill="rgba(79,163,224,.35)" stroke="' + P.glass + '" stroke-width="2"/>' +
      '<rect x="0" y="-13" width="222" height="26" rx="9" fill="rgba(79,163,224,.22)" stroke="' + P.glass + '" stroke-width="2.6"/>' +
      '<path class="sc-flowr" d="M10 -7H212M10 7H212" stroke="rgba(140,200,242,.55)" stroke-width="2" stroke-dasharray="6 14" style="--d:.9s"/>' +
      '<rect x="-12" y="-3.5" width="252" height="7" rx="3" fill="#15202A" stroke="' + P.glass + '" stroke-width="1.6"/>' +
      [0, 1, 2, 3, 4].map((i) => '<circle class="sc-drive" cx="0" cy="0" r="' + (2.6 - i * 0.2) + '" fill="' + (i > 2 ? '#BFE3F7' : 'rgba(255,255,255,.8)') + '" style="--d:2.4s;--dl:' + (-i * 0.48) + 's;--x0:-8px;--x1:236px"/>').join('') +
      '<path d="M6 -10H214" stroke="' + P.hi + '" stroke-width="2" stroke-linecap="round" opacity=".5"/></g>' +
      // alargadera
      '<path d="M428 195Q441 199 441 210V222" fill="none" stroke="' + P.glass + '" stroke-width="7" stroke-linecap="round"/><path d="M428 195Q441 199 441 210V222" fill="none" stroke="#15202A" stroke-width="2.5" stroke-linecap="round"/>' +
      // Erlenmeyer y destilado
      er.back + '<g clip-path="url(#' + u + 'ec)"><rect class="ds-lvl" x="390" y="282" width="100" height="20" fill="url(#' + u + 'ds)"/></g>' +
      [0, 0.7].map((d) => '<g class="sc-a sc-drop ds-drop" style="--d:1.4s;--dl:' + d + 's;--dy:50px">' + drop(441, 228, 0.75, '#BFE3F7') + '</g>').join('') +
      er.front +
      callout(133, 36, 150, 20, 'Termómetro', { a: 'start', s: 15 }) +
      callout(230, 96, 246, 64, 'Sale agua', { a: 'start', s: 15 }) +
      callout(317, 144, 330, 108, 'Refrigerante', { a: 'start' }) +
      callout(384, 210, 372, 250, 'Entra agua fría', { a: 'end', s: 15 }) +
      callout(452, 276, 500, 238, 'Destilado', { a: 'start' }) +
      callout(104, 200, 36, 150, 'Mezcla', { a: 'middle' });
  },
  mount(svg) {
    const lvl = q(svg, '.ds-lvl'), drops = qa(svg, '.ds-drop');
    return {
      still: 6,
      tick(t) {
        const f = (t % 14) / 14;
        const y = lerp(286, 258, ease(seg(f, 0, 0.9)));
        lvl.setAttribute('y', y);
        drops.forEach((d) => d.style.setProperty('--dy', (y - 232) + 'px'));
      },
    };
  },
};

/* ------------------------------------------------------------------ imantación */
export const magnet = {
  tag: 'Separación magnética',
  svg(u) {
    const r = rng(3);
    let fil = '';
    for (let i = 0; i < 34; i++) {
      const x = 162 + r() * 116, top = 262 - 22 * (1 - Math.pow((x - 220) / 60, 2)), y = top + 3 + r() * (272 - top);
      fil += '<line class="mg-f" data-x="' + x.toFixed(1) + '" data-y="' + y.toFixed(1) + '" data-a="' + (r() * 180).toFixed(0) + '" data-tx="' + ((r() < 0.5 ? -22 : 22) + (r() - 0.5) * 18).toFixed(1) + '" data-ty="' + (3 + r() * 16).toFixed(1) + '" data-ta="' + (70 + r() * 40).toFixed(0) + '" data-d="' + (r() * 0.7).toFixed(2) + '" x1="-4" y1="0" x2="4" y2="0" stroke="#AEB8C1" stroke-width="2.2" stroke-linecap="round"/>';
    }
    const U = 'M-40 0V-58A40 40 0 0 1 40 -58V0H18V-58A18 18 0 0 0 -18 -58V0Z';
    return '<defs>' + vgrad(u + 'mg', [[0, '#F06A5E'], [1, '#C2362C']]) + '</defs>' +
      glow(u, 280, 190, 240) + bench() +
      // plato
      '<ellipse cx="220" cy="280" rx="92" ry="12" fill="#DDE5EB"/><ellipse cx="220" cy="276" rx="84" ry="9" fill="#F1F5F8"/>' +
      // arena
      '<path d="M150 276Q160 246 220 238Q282 246 292 276Z" fill="' + P.sand + '"/>' +
      grains(r, 70, (r) => { const x = 158 + r() * 124; const top = 276 - 34 * (1 - Math.pow((x - 220) / 70, 2)); return [x, top + 2 + r() * (274 - top)]; }, [P.sandD, '#E3BE8A', '#7B5A36']) +
      '<g class="mg-fs">' + fil + '</g>' +
      '<g class="mg-m">' +
      '<path d="' + U + '" fill="url(#' + u + 'mg)" stroke="#8E2A22" stroke-width="1.5"/>' +
      '<rect x="-40" y="-14" width="22" height="14" fill="#D7DEE4" stroke="#8C99A6" stroke-width="1.2"/><rect x="18" y="-14" width="22" height="14" fill="#D7DEE4" stroke="#8C99A6" stroke-width="1.2"/>' +
      '<text x="-29" y="-3" text-anchor="middle" font-size="11" font-weight="700" fill="#1C2934">N</text><text x="29" y="-3" text-anchor="middle" font-size="11" font-weight="700" fill="#1C2934">S</text>' +
      '<path d="M-33 -56A33 33 0 0 1 -10 -86" stroke="rgba(255,255,255,.45)" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      T(52, -62, 'Imán', { a: 'start' }) +
      '<g class="mg-l" opacity="0">' + T(52, 14, 'Limaduras de hierro', { a: 'start', s: 16 }) + '</g>' +
      '</g>' +
      callout(176, 262, 108, 214, 'Arena', { a: 'end' }) +
      '<g class="mg-l0">' + callout(236, 262, 360, 244, 'Arena + limaduras de hierro', { a: 'start', s: 15 }) + '</g>';
  },
  mount(svg) {
    const m = q(svg, '.mg-m'), lab = q(svg, '.mg-l'), lab0 = q(svg, '.mg-l0');
    const fs = qa(svg, '.mg-f').map((el) => ({ el, x: +el.dataset.x, y: +el.dataset.y, a: +el.dataset.a, tx: +el.dataset.tx, ty: +el.dataset.ty, ta: +el.dataset.ta, d: +el.dataset.d }));
    return {
      still: 5.5,
      tick(t) {
        const c = t % 10;
        const down = ease(seg(c, 0.3, 1.8));
        const move = ease(seg(c, 3.2, 4.8));
        const back = ease(seg(c, 8, 9.6));
        const mx = lerp(220, 430, move * (1 - back)), my = lerp(lerp(118, 226, down), 150, move) * (1 - back) + 118 * back;
        m.setAttribute('transform', 'translate(' + mx.toFixed(1) + ' ' + my.toFixed(1) + ')');
        const hold = seg(c, 4.8, 5.3) * (1 - seg(c, 7.6, 8));
        lab.setAttribute('opacity', hold);
        lab0.setAttribute('opacity', 1 - seg(c, 1.6, 2.2) + seg(c, 9.2, 10));
        const fade = 1 - seg(c, 7.6, 8.1) + seg(c, 9, 9.8);
        fs.forEach((f) => {
          const k = ease(seg(c, 1.8 + f.d, 2.5 + f.d)) * (c < 8.5 ? 1 : 0);
          const x = lerp(f.x, mx + f.tx, k), y = lerp(f.y, my + f.ty, k), a = lerp(f.a, f.ta, k);
          f.el.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + a.toFixed(0) + ')');
          f.el.style.opacity = c < 8.5 ? (k > 0 ? fade : 1) : seg(c, 9, 9.8);
        });
      },
    };
  },
};

/* ------------------------------------------------------------------ tamizado */
export const sieve = {
  tag: 'Tamizado',
  svg(u) {
    const r = rng(9);
    let peb = '';
    const cols = ['#8D8F93', '#A38B6D', '#6F7479', '#B49A78', '#7E6A55'];
    for (let i = 0; i < 12; i++) {
      const x = 222 + i * 14 + r() * 6, rx = 7 + r() * 6, ry = rx * (0.6 + r() * 0.2);
      peb += '<ellipse cx="' + x.toFixed(1) + '" cy="' + (147 - ry + r() * 2).toFixed(1) + '" rx="' + rx.toFixed(1) + '" ry="' + ry.toFixed(1) + '" fill="' + cols[i % 5] + '" stroke="rgba(0,0,0,.25)"/>';
    }
    for (let i = 0; i < 5; i++) {
      const x = 232 + i * 30 + r() * 10, rx = 6 + r() * 4;
      peb += '<ellipse cx="' + x.toFixed(1) + '" cy="' + (134 - r() * 6).toFixed(1) + '" rx="' + rx.toFixed(1) + '" ry="' + (rx * 0.7).toFixed(1) + '" fill="' + cols[(i + 2) % 5] + '" stroke="rgba(0,0,0,.25)"/>';
    }
    let fall = '';
    for (let i = 0; i < 26; i++) {
      const x = 214 + r() * 172;
      fall += '<circle class="sc-a sc-drop" cx="' + x.toFixed(1) + '" cy="156" r="' + (1.3 + r() * 1.2).toFixed(1) + '" fill="' + ['#E3BE8A', P.sand, '#B98A55'][i % 3] + '" style="--d:' + (0.9 + r() * 0.5).toFixed(2) + 's;--dl:' + (-r() * 1.5).toFixed(2) + 's;--dy:' + (96 + r() * 16).toFixed(0) + 'px"/>';
    }
    return '<defs><pattern id="' + u + 'mesh" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M0 0H7M0 0V7" stroke="#C9D2D9" stroke-width="1.1"/></pattern>' + vgrad(u + 'wd', [[0, '#B77B4F'], [1, '#8A5A3B']]) + vgrad(u + 'bw', [[0, '#3B5D7A'], [1, '#27415A']]) + '</defs>' +
      glow(u, 300, 180, 230) + bench() +
      // recipiente
      '<path d="M190 232H410L396 290H204Z" fill="url(#' + u + 'bw)" stroke="#5C7F9C" stroke-width="2"/>' +
      '<clipPath id="' + u + 'bc"><path d="M192 234H408L395 288H205Z"/></clipPath>' +
      '<g clip-path="url(#' + u + 'bc)"><path class="sv-m sc-ab" d="M200 290Q300 250 400 290Z" fill="' + P.sand + '"/></g>' +
      '<ellipse cx="300" cy="232" rx="110" ry="6" fill="#2F4B63" stroke="#5C7F9C" stroke-width="2"/>' +
      fall +
      // tamiz que se sacude
      '<g class="sc-shake" style="--d:.45s">' +
      '<rect x="206" y="150" width="188" height="8" fill="url(#' + u + 'mesh)"/>' +
      '<rect x="198" y="110" width="12" height="50" rx="3" fill="url(#' + u + 'wd)"/><rect x="390" y="110" width="12" height="50" rx="3" fill="url(#' + u + 'wd)"/>' +
      '<path d="M210 146Q300 138 390 146V150H210Z" fill="' + P.sand + '" opacity=".9"/>' + peb +
      '<rect x="198" y="106" width="204" height="8" rx="3" fill="#C58B5C"/>' +
      '</g>' +
      callout(402, 124, 436, 96, 'Tamiz', { a: 'start' }) +
      callout(360, 136, 436, 142, 'Piedras (se quedan)', { a: 'start' }) +
      callout(372, 272, 436, 262, 'Arena fina (pasa)', { a: 'start' });
  },
  mount(svg) {
    const m = q(svg, '.sv-m');
    return {
      still: 6,
      tick(t) {
        const f = (t % 12) / 12;
        const s = lerp(0.25, 1, ease(seg(f, 0, 0.9))) * (1 - seg(f, 0.94, 1) * 0.75);
        m.style.transform = 'scaleY(' + s.toFixed(3) + ')';
      },
    };
  },
};
