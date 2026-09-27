// Parejas: cartas volteables; encuentra cada pareja (fórmula ↔ nombre, símbolo ↔ elemento...).
// spec: { pairs:[['NaCl','Sal de cocina'], ...] }  (se usan de 6 a 8 parejas)
import { esc, fH, shuffle } from '../widgets.js';
import { makeGame, mmss } from './common.js';

const FORMULA = /^(?:[A-Z][a-z]?\d*|\((?:[A-Z][a-z]?\d*)+\)\d*)+(?:[+-]|\d[+-])?$/;
const face = (t) => (FORMULA.test(t) && /\d|[A-Z].*[A-Z]/.test(t) ? '<span class="gm-fml">' + fH(t) + '</span>' : esc(t));
const ATOM = '<svg viewBox="0 0 40 40" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="20" cy="20" rx="17" ry="6.5"/><ellipse cx="20" cy="20" rx="17" ry="6.5" transform="rotate(60 20 20)"/><ellipse cx="20" cy="20" rx="17" ry="6.5" transform="rotate(120 20 20)"/></g><circle cx="20" cy="20" r="3.6" fill="currentColor"/></svg>';

export default function memory(el, spec, finish) {
  const all = (spec.pairs || []).filter((p) => p && p.length >= 2);
  const N = Math.min(8, all.length);
  return makeGame(el, spec, finish, {
    key: 'memory', name: 'Parejas', icon: '▦', time: 'up',
    how: 'Voltea dos cartas a la vez y encuentra cada pareja con la menor cantidad de movimientos.',
    rules: [N + ' parejas', 'Menos movimientos, más estrellas'],
    stars: (r) => (!r.won ? 0 : r.moves <= Math.ceil(N * 1.75) ? 3 : r.moves <= Math.ceil(N * 2.5) ? 2 : 1),
    lines: (r) => [['Movimientos', String(r.moves)], ['Tiempo', mmss(r.secs)], ['Mejor racha', String(r.bestStreak)]],
    play(g) {
      const pairs = shuffle(all.slice()).slice(0, N);
      const cards = shuffle(pairs.flatMap((p, i) => [{ p: i, s: 0, t: String(p[0]) }, { p: i, s: 1, t: String(p[1]) }]));
      const n = cards.length;
      const cols = n <= 12 ? 6 : n <= 14 ? 7 : 8;
      const mcols = n <= 12 ? 3 : 4;
      g.stage.innerHTML = '<div class="gm-grid" role="grid" style="--cols:' + cols + ';--mcols:' + mcols + '">' +
        cards.map((c, i) => '<button type="button" class="gm-card s' + c.s + '" data-i="' + i + '" aria-label="Carta ' + (i + 1) + ', boca abajo">' +
          '<span class="gm-cin"><span class="gm-cf gm-cback">' + ATOM + '</span><span class="gm-cf gm-cface' + (c.t.length > 16 ? ' long' : '') + (c.t.length > 5 ? ' fl' : '') + '">' + face(c.t) + '</span></span></button>').join('') +
        '</div>';
      const btns = [...g.stage.querySelectorAll('.gm-card')];
      let open = [], moves = 0, found = 0, busy = null;
      const upd = () => g.info('<span><b>' + moves + '</b> movimientos</span><span><b>' + found + '</b> de ' + N + ' parejas</span>');
      upd();

      function flip(i, on) {
        const b = btns[i];
        b.classList.toggle('open', on);
        b.setAttribute('aria-label', on ? 'Carta: ' + cards[i].t : 'Carta ' + (i + 1) + ', boca abajo');
      }
      function closeOpen() {
        if (busy) { g.cancel(busy); busy = null; }
        open.forEach((j) => { flip(j, false); btns[j].classList.remove('miss'); });
        open = [];
      }
      function tap(i) {
        const b = btns[i];
        if (!b || b.classList.contains('done') || open.includes(i)) return;
        if (open.length === 2) closeOpen();
        flip(i, true);
        open.push(i);
        if (open.length < 2) return;
        moves++;
        const [a, c] = open;
        if (cards[a].p === cards[c].p) {
          found++;
          const m = g.hit();
          open = [];
          g.after(260, () => {
            [a, c].forEach((j) => { btns[j].classList.add('done'); btns[j].disabled = true; });
            g.good(btns[c]);
            g.add(100 * m, btns[c]);
            g.say('Pareja encontrada: ' + cards[a].t + ' y ' + cards[c].t);
            if (found === N) g.after(700, () => { g.pause(); win(); });
          });
        } else {
          g.miss();
          busy = g.after(420, () => {
            [a, c].forEach((j) => btns[j].classList.add('miss'));
            g.bad(btns[c]);
            busy = g.after(650, closeOpen);
          });
        }
        upd();
      }
      function win() {
        const secs = g.t;
        const eff = Math.max(0, Math.round(2.5 * N - moves)) * 25;
        const fast = Math.max(0, Math.round(120 - secs)) * 2;
        g.setScore(g.score + eff + fast);
        g.end({ won: true, moves, secs, reason: '¡Encontraste todas las parejas!', detail: { moves, seconds: Math.round(secs), pairs: N, bestStreak: g.bestStreak } });
      }
      g.stage.querySelector('.gm-grid').addEventListener('click', (e) => { const b = e.target.closest('.gm-card'); if (b) tap(+b.dataset.i); });
      // flechas para moverse entre cartas
      g.key((e) => {
        const k = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: 'u', ArrowDown: 'd' }[e.key];
        if (k === undefined) return;
        e.preventDefault();
        const cur = btns.indexOf(document.activeElement);
        const c = getComputedStyle(g.stage.querySelector('.gm-grid')).gridTemplateColumns.split(' ').length;
        let j = cur < 0 ? 0 : k === 'u' ? cur - c : k === 'd' ? cur + c : cur + k;
        j = Math.max(0, Math.min(n - 1, j));
        btns[j].focus();
      });
      g.clock(0);
    },
  });
}
