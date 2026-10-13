// Escena 2D "building": el átomo como un edificio. Pisos = niveles, apartamentos = subniveles (s, p),
// cada cuarto (orbital) tiene 2 camas (↑ y ↓). Sirve para enseñar configuración electrónica sin orbitales 3D.
// Estado: {Z: 0..20, focus: null|'floors'|'apts'|'cap'|'valence', order: false, cfg: true}
// Los electrones nuevos aparecen uno por uno, de abajo hacia arriba, en el orden de llenado.
import { reduce } from '../widgets.js';

const NAMES = ['', 'Hidrógeno', 'Helio', 'Litio', 'Berilio', 'Boro', 'Carbono', 'Nitrógeno', 'Oxígeno', 'Flúor', 'Neón', 'Sodio', 'Magnesio', 'Aluminio', 'Silicio', 'Fósforo', 'Azufre', 'Cloro', 'Argón', 'Potasio', 'Calcio'];
// Apartamentos en orden de llenado: [nombre, piso, cuartos]
const APTS = [['1s', 1, 1], ['2s', 2, 1], ['2p', 2, 3], ['3s', 3, 1], ['3p', 3, 3], ['4s', 4, 1]];
const SUP = (n) => String(n).split('').map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]).join('');
const NS = 'http://www.w3.org/2000/svg';
const W = 440, H = 300, FH = 52, GAP = 6, BW = 34, BH = 32;
const floorTop = (k) => H - 34 - k * (FH + GAP);
const aptX = (a) => (a[0].endsWith('s') ? 122 : 250);

export default function (el) {
  const stage = document.createElement('div');
  stage.className = 'stage sc-stage sc-2d sc-bld';
  el.appendChild(stage);
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('role', 'img');
  stage.appendChild(svg);

  let h = `<style>
    .bf rect{fill:rgba(255,255,255,.035);stroke:rgba(190,210,225,.25);stroke-width:1.2;transition:all .4s}
    .bf text{fill:#9FB3C4;font:700 15px "Bricolage Grotesque",system-ui,sans-serif;transition:all .4s}
    .ba .fr{fill:rgba(127,178,234,.06);stroke:rgba(127,178,234,.35);stroke-width:1.2;transition:all .4s}
    .ba .bx{fill:#0E161C;stroke:rgba(230,236,241,.55);stroke-width:1.4}
    .ba .nm{fill:#E6ECF1;font:800 16px "Bricolage Grotesque",system-ui,sans-serif}
    .ba .cap,.ba .ord{opacity:0;transition:opacity .4s}
    .ba .cap{fill:#F5C04E;font:800 14px system-ui,sans-serif}
    .ba .ord circle{fill:#4F8FD0}.ba .ord text{fill:#fff;font:800 11px system-ui,sans-serif}
    .e{opacity:0;transform:scale(.2);transform-box:fill-box;transform-origin:center;transition:opacity .3s,transform .35s cubic-bezier(.3,1.6,.5,1)}
    .e.on{opacity:1;transform:scale(1)}
    .e text{font:900 21px system-ui,sans-serif}
    .sc-bld.f-floors .bf rect{fill:rgba(127,178,234,.12);stroke:#7FB2EA;stroke-width:2}
    .sc-bld.f-floors .bf text{fill:#E6ECF1;font-size:16px}
    .sc-bld.f-floors .ba{opacity:.35}
    .sc-bld.f-apts .ba .fr{fill:rgba(127,178,234,.16);stroke:#7FB2EA;stroke-width:2}
    .sc-bld.f-cap .ba .cap,.sc-bld.s-order .ba .ord{opacity:1}
    .bf.val rect{fill:rgba(245,192,78,.13);stroke:#F5C04E;stroke-width:2.2}
    .bf.val text{fill:#F5C04E}
    .hd{fill:#E6ECF1;font:800 17px "Bricolage Grotesque",system-ui,sans-serif}
    .hd tspan.c{fill:#7FB2EA}.hd tspan.v{fill:#F5C04E}
        .nuc text{fill:#F0897F;font:700 13px system-ui,sans-serif}
  </style>`;
  // núcleo en la base
  h += `<g class="nuc"><line x1="20" x2="420" y1="${H - 22}" y2="${H - 22}" stroke="rgba(190,210,225,.25)"/><circle cx="220" cy="${H - 22}" r="11" fill="#E0433B" stroke="#0E161C" stroke-width="2"/><text x="238" y="${H - 8}">Núcleo (+)</text></g>`;
  for (let k = 1; k <= 4; k++) {
    const y = floorTop(k);
    h += `<g class="bf" data-k="${k}"><rect x="20" y="${y}" width="400" height="${FH}" rx="8"/><text x="32" y="${y + 22}">Piso ${k}</text></g>`;
  }
  APTS.forEach((a, ai) => {
    const [nm, k, n] = a, y = floorTop(k) + (FH - BH) / 2 + 4, x0 = aptX(a), w = n * BW + (n - 1) * 4;
    h += `<g class="ba" data-a="${ai}"><rect class="fr" x="${x0 - 5}" y="${y - 8}" width="${w + 10}" height="${BH + 12}" rx="7"/>`;
    h += `<text class="nm" x="${x0 - 8}" y="${y + BH / 2 + 5}" text-anchor="end">${nm}</text>`;
    h += `<text class="cap" x="${x0 + w + 10}" y="${y + BH / 2 + 5}">máx. ${n * 2}</text>`;
    h += `<g class="ord"><circle cx="${x0 + w + 20}" cy="${y + BH / 2}" r="10"/><text x="${x0 + w + 20}" y="${y + BH / 2 + 4}" text-anchor="middle">${ai + 1}</text></g>`;
    for (let b = 0; b < n; b++) {
      const bx = x0 + b * (BW + 4);
      h += `<rect class="bx" x="${bx}" y="${y}" width="${BW}" height="${BH}" rx="5"/>`;
      h += `<g class="e" data-a="${ai}" data-b="${b}" data-s="0"><text x="${bx + 10}" y="${y + 24}" text-anchor="middle" fill="#F5C04E">↑</text></g>`;
      h += `<g class="e" data-a="${ai}" data-b="${b}" data-s="1"><text x="${bx + 24}" y="${y + 24}" text-anchor="middle" fill="#7FB2EA">↓</text></g>`;
    }
    h += '</g>';
  });
  h += `<text class="hd" x="20" y="22"></text>`;
  svg.innerHTML = h;

  // orden de llenado de cada "cama": por apartamento, primero ↑ en cada cuarto (Hund) y luego ↓
  const seq = [];
  APTS.forEach((a, ai) => { for (let s = 0; s < 2; s++) for (let b = 0; b < a[2]; b++) seq.push(svg.querySelector(`.e[data-a="${ai}"][data-b="${b}"][data-s="${s}"]`)); });
  const hd = svg.querySelector('.hd');
  let Zc = 0;

  function set(state) {
    const s = state || {};
    const Z = Math.max(0, Math.min(20, Math.round(+s.Z || 0)));
    stage.className = 'stage sc-stage sc-2d sc-bld' + (s.focus ? ' f-' + s.focus : '') + (s.order ? ' s-order' : '');
    // electrones: los nuevos aparecen uno tras otro; los que sobran se van todos a la vez
    const step = reduce ? 0 : Math.min(0.22, 2.4 / Math.max(1, Math.abs(Z - Zc)));
    seq.forEach((e, i) => {
      const on = i < Z;
      e.style.transitionDelay = on && i >= Zc ? ((i - Zc) * step).toFixed(2) + 's' : '0s';
      e.classList.toggle('on', on);
    });
    Zc = Z;
    // configuración y piso de valencia
    let left = Z; const parts = []; let top = 0;
    APTS.forEach(([nm, k, n]) => { if (left > 0) { const c = Math.min(left, n * 2); parts.push([nm, c]); left -= c; top = Math.max(top, k); } });
    const val = parts.filter(([nm]) => +nm[0] === top).reduce((a, p) => a + p[1], 0);
    hd.innerHTML = Z && s.cfg !== false ? `${NAMES[Z]} · Z = ${Z} <tspan class="c" dx="6">${parts.map(([nm, c]) => nm + SUP(c)).join(' ')}</tspan>${s.focus === 'valence' ? `<tspan class="v" dx="8">· ${val} de valencia</tspan>` : ''}` : '';
    svg.querySelectorAll('.bf').forEach((g) => g.classList.toggle('val', s.focus === 'valence' && +g.dataset.k === top));
    svg.setAttribute('aria-label', Z ? `Edificio del ${NAMES[Z]}: ${parts.map(([nm, c]) => c + ' en ' + nm).join(', ')}` : 'Edificio del átomo vacío');
  }

  return { set, dispose() { stage.remove(); } };
}
