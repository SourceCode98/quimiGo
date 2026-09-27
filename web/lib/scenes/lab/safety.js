// Pictogramas de peligro del SGA (Sistema Globalmente Armonizado). Tocar uno muestra qué significa.
import { T, qa } from './kit.js';

const K = '#111';
const FLAME = '<path d="M-3 20C-22 17 -25 -1 -12 -13C-12 -4 -7 0 -4 2C-7 -12 1 -25 9 -31C7 -17 21 -9 21 6C21 15 13 20 3 20Z" fill="' + K + '"/><path d="M1 20C-8 18 -10 8 -4 1C-3 8 2 9 4 8C3 2 7 -4 10 -6C10 2 15 6 14 12C13 17 8 20 1 20Z" fill="#fff"/>';
const SYM = {
  flame: FLAME + '<rect x="-24" y="23" width="48" height="5" fill="' + K + '"/>',
  corrosive:
    // tubos que gotean
    '<g transform="rotate(-28 -14 -24)"><rect x="-20" y="-40" width="10" height="24" rx="1" fill="none" stroke="' + K + '" stroke-width="2.4"/><rect x="-19" y="-24" width="8" height="7" fill="' + K + '"/></g>' +
    '<g transform="rotate(28 14 -24)"><rect x="10" y="-40" width="10" height="24" rx="1" fill="none" stroke="' + K + '" stroke-width="2.4"/><rect x="11" y="-24" width="8" height="7" fill="' + K + '"/></g>' +
    '<path d="M-10 -12V-4M-10 0V4M12 -12V-4M12 0V4" stroke="' + K + '" stroke-width="2.4" stroke-linecap="round"/>' +
    // superficie corroída y mano
    '<path d="M2 10H30V20H2V16Q8 16 8 12Q6 10 2 10Z" fill="' + K + '"/>' +
    '<path d="M-30 20V12Q-30 8 -26 8H-22V4Q-22 1 -19 1Q-16 1 -16 4V8H-13Q-10 8 -10 11Q-12 13 -11 16Q-8 16 -8 20Z" fill="' + K + '"/>' +
    '<rect x="-32" y="23" width="64" height="4" fill="' + K + '"/>',
  toxic:
    '<g stroke="' + K + '" stroke-width="6" stroke-linecap="round"><path d="M-22 4L22 24M22 4L-22 24"/></g>' +
    '<circle cx="-23" cy="2" r="4" fill="' + K + '"/><circle cx="23" cy="2" r="4" fill="' + K + '"/><circle cx="-23" cy="26" r="4" fill="' + K + '"/><circle cx="23" cy="26" r="4" fill="' + K + '"/>' +
    '<path d="M0 -34C13 -34 20 -26 20 -15C20 -7 16 -3 12 -1V6H-12V-1C-16 -3 -20 -7 -20 -15C-20 -26 -13 -34 0 -34Z" fill="' + K + '"/>' +
    '<ellipse cx="-8" cy="-15" rx="5" ry="5.5" fill="#fff"/><ellipse cx="8" cy="-15" rx="5" ry="5.5" fill="#fff"/><path d="M0 -8L-3 -3H3Z" fill="#fff"/>' +
    '<path d="M-6 1V6M0 1V6M6 1V6" stroke="#fff" stroke-width="1.6"/>',
  irritant: '<path d="M-6 -30H6L4 10H-4Z" fill="' + K + '"/><circle cx="0" cy="21" r="6" fill="' + K + '"/>',
  env:
    // árbol seco
    '<path d="M-20 22V-8M-20 -2L-30 -14M-20 -6L-10 -20M-20 6L-28 -2M-20 2L-12 -6M-10 -20L-6 -26M-30 -14L-34 -20" stroke="' + K + '" stroke-width="3.2" stroke-linecap="round" fill="none"/>' +
    // pez muerto
    '<path d="M-4 14Q8 2 22 12Q8 22 -4 14Z" fill="' + K + '"/><path d="M22 12L32 5V19Z" fill="' + K + '"/><path d="M1 10L5 14M5 10L1 14" stroke="#fff" stroke-width="1.5"/>' +
    '<path d="M-34 24H32" stroke="' + K + '" stroke-width="3.5"/>',
  oxidizer: '<g transform="translate(0 -9) scale(.82)">' + FLAME + '</g><circle cx="0" cy="12" r="10.5" fill="none" stroke="' + K + '" stroke-width="5"/><rect x="-24" y="24" width="48" height="5" fill="' + K + '"/>',
};
const PICS = [
  ['flame', 'Inflamable', 'Se prende con facilidad. Mantenlo lejos de llamas, chispas y fuentes de calor. Ejemplos: alcohol, gasolina, acetona.'],
  ['corrosive', 'Corrosivo', 'Destruye la piel, los ojos y los metales. Usa guantes y gafas de seguridad. Ejemplos: ácido clorhídrico (muriático), soda cáustica del destapador.'],
  ['toxic', 'Tóxico', 'Puede causar una intoxicación grave o la muerte si se traga, se inhala o toca la piel. Ejemplos: algunos plaguicidas, metanol.'],
  ['irritant', 'Irritante', 'Puede irritar la piel, los ojos o las vías respiratorias, o causar alergias. Ejemplos: blanqueador, algunos detergentes.'],
  ['env', 'Peligro ambiental', 'Daña a los peces, las plantas y las fuentes de agua. No lo botes por el desagüe. Ejemplos: plaguicidas, aceite de motor usado.'],
  ['oxidizer', 'Comburente', 'Aporta oxígeno y aviva el fuego de otras sustancias. Guárdalo lejos de combustibles. Ejemplos: agua oxigenada concentrada, nitrato de potasio.'],
];
const XY = [[120, 70], [300, 70], [480, 70], [120, 206], [300, 206], [480, 206]];
const D = 54;

export const pictograms = {
  tag: 'Pictogramas de peligro (SGA)',
  svg() {
    return PICS.map(([k, n], i) => {
      const [x, y] = XY[i];
      const dia = 'M0 ' + -D + 'L' + D + ' 0L0 ' + D + 'L' + -D + ' 0Z';
      return '<g class="sc-pick sc-dim sc-soft pg" data-i="' + i + '" tabindex="0" role="button" aria-label="' + n + '" transform="translate(' + x + ' ' + y + ')">' +
        '<g class="sc-grow">' +
        '<path class="sc-hit" d="M0 ' + -(D + 8) + 'L' + (D + 8) + ' 0L0 ' + (D + 8) + 'L' + -(D + 8) + ' 0Z"/>' +
        '<path class="sc-ring" d="M0 ' + -(D + 7) + 'L' + (D + 7) + ' 0L0 ' + (D + 7) + 'L' + -(D + 7) + ' 0Z" stroke-linejoin="round"/>' +
        '<path d="' + dia + '" fill="#fff" stroke="#D7261E" stroke-width="8" stroke-linejoin="round"/>' +
        '<g transform="scale(1.08)">' + SYM[k] + '</g></g>' +
        T(0, D + 22, n, { s: 16 }) + '</g>';
    }).join('');
  },
  mount(svg, api) {
    const gs = qa(svg, '.pg');
    let sel = -1;
    const show = (i) => {
      sel = i;
      gs.forEach((g, k) => { g.classList.toggle('sc-sel', k === i); g.classList.toggle('sc-off', i >= 0 && k !== i); g.setAttribute('aria-pressed', k === i); });
      api.note(i >= 0 ? '<b>' + PICS[i][1] + ':</b> ' + PICS[i][2] : 'Toca un pictograma para ver qué significa.');
    };
    const on = (e) => {
      const g = e.target.closest('.pg');
      if (!g) return;
      if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      const i = +g.dataset.i;
      show(sel === i ? -1 : i);
    };
    svg.addEventListener('click', on);
    svg.addEventListener('keydown', on);
    show(-1);
    return {
      step(n, st) { show(st && st.step != null ? Math.max(0, Math.min(5, n)) : -1); },
      dispose() { svg.removeEventListener('click', on); svg.removeEventListener('keydown', on); },
    };
  },
};
