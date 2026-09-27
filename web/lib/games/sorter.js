// Atrapa y clasifica: las tarjetas caen; toca el recipiente correcto (o teclas 1, 2, 3...) antes de que lleguen al piso.
// spec: { bins:['Ácido','Base','Neutro'], items:[['Jugo de limón',0], ...], time:60 }
import { esc, shuffle } from '../widgets.js';
import { makeGame, clamp } from './common.js';

const BIN_COLORS = ['#D0564F', '#3A7BD5', '#2E9E5B', '#8E6BC9', '#D98B3A'];

export default function sorter(el, spec, finish) {
  const bins = (spec.bins && spec.bins.length ? spec.bins : ['Ácido', 'Base', 'Neutro']).slice(0, 5);
  const items = (spec.items || []).filter((it) => it && it[0] !== undefined && it[1] >= 0 && it[1] < bins.length);
  const TIME = spec.time || 60;
  const k = TIME / 60;
  const th = [Math.max(2, Math.round(6 * k)), Math.max(3, Math.round(12 * k)), Math.max(4, Math.round(18 * k))];
  return makeGame(el, spec, finish, {
    key: 'sorter', name: 'Atrapa y clasifica', icon: '⇣', time: 'down', lives: 3,
    how: 'Las tarjetas caen: toca el recipiente correcto antes de que lleguen al piso.',
    rules: [TIME + ' segundos', '3 vidas', 'Cada vez más rápido', 'Teclas 1 a ' + bins.length],
    stars: (r) => (r.correct >= th[2] ? 3 : r.correct >= th[1] ? 2 : r.correct >= th[0] ? 1 : 0),
    lines: (r) => [['Clasificadas', r.correct + ' de ' + r.seen], ['Mejor racha', String(r.bestStreak)]],
    play(g) {
      g.stage.innerHTML =
        '<div class="gm-field"><div class="gm-floor"></div><div class="gm-sready">¡Prepárate!</div></div>' +
        '<div class="gm-bins" style="--n:' + bins.length + '">' +
        bins.map((b, i) => '<button type="button" class="gm-bin" data-i="' + i + '" style="--bc:' + BIN_COLORS[i % BIN_COLORS.length] + '"><kbd>' + (i + 1) + '</kbd><span>' + esc(b) + '</span></button>').join('') +
        '</div>';
      const field = g.stage.querySelector('.gm-field');
      const binEls = [...g.stage.querySelectorAll('.gm-bin')];
      let deck = [], cards = [], correct = 0, seen = 0, speed = 1 / 7, spawnT = 0, started = false, over = false;
      const wrong = [];
      const draw = () => g.info('<span><b>' + correct + '</b> ' + (correct === 1 ? 'clasificada' : 'clasificadas') + '</span>');
      draw();
      const nextItem = () => { if (!deck.length) deck = shuffle(items.slice()); return deck.pop(); };

      function spawn() {
        if (!items.length || over) return;
        const it = nextItem();
        const c = document.createElement('div');
        c.className = 'gm-fall';
        c.innerHTML = '<div class="gm-fc"><span>' + esc(it[0]) + '</span></div>';
        field.appendChild(c);
        const W = field.clientWidth, cw = c.offsetWidth;
        const x = 8 + Math.random() * Math.max(0, W - cw - 16);
        const card = { el: c, it, x, y: -c.offsetHeight - 6, h: c.offsetHeight, state: 'fall' };
        c.style.left = x + 'px';
        c.style.transform = 'translateY(' + card.y + 'px)';
        cards.push(card);
        seen++;
        mark();
      }
      const lead = () => cards.filter((c) => c.state === 'fall').sort((a, b) => b.y - a.y)[0];
      function mark() {
        const l = lead();
        cards.forEach((c) => c.el.classList.toggle('lead', c === l));
      }
      function remove(card, ms) { card.el.classList.remove('lead'); g.after(ms, () => card.el.remove()); cards = cards.filter((c) => c !== card); mark(); }

      function sort(i) {
        if (!started || over) return;
        const card = lead();
        const bin = binEls[i];
        if (!bin) return;
        g.bump(bin, 'gm-press');
        if (!card) return;
        card.state = 'done';
        const fr = field.getBoundingClientRect(), br = bin.getBoundingClientRect();
        const tx = br.left + br.width / 2 - fr.left - card.el.offsetWidth / 2;
        const ty = br.top - fr.top + 10;
        if (card.it[1] === i) {
          correct++;
          const m = g.hit();
          const hb = Math.round(50 * clamp(1 - card.y / field.clientHeight, 0, 1));
          card.el.classList.add('ok');
          card.el.style.transition = 'transform .32s cubic-bezier(.5,0,.8,.6), left .32s cubic-bezier(.2,.6,.4,1), opacity .32s';
          card.el.style.left = tx + 'px';
          card.el.style.transform = 'translateY(' + ty + 'px) scale(.45)';
          card.el.style.opacity = '0.2';
          g.good(bin);
          bin.classList.add('hit');
          g.after(350, () => bin.classList.remove('hit'));
          g.add(100 * m + hb, bin);
          speed = Math.min(1 / 2.3, speed * 1.06);
          remove(card, 360);
          draw();
        } else {
          g.miss();
          card.el.classList.add('bad');
          card.el.innerHTML = '<div class="gm-fc"><span>' + esc(card.it[0]) + '</span><small>Es: ' + esc(bins[card.it[1]]) + '</small></div>';
          g.bad(bin);
          binEls[card.it[1]].classList.add('show');
          g.after(900, () => binEls[card.it[1]].classList.remove('show'));
          wrong.push(card.it[0]);
          remove(card, 1000);
          if (g.loseLife() <= 0) return end('Te quedaste sin vidas');
        }
        if (!cards.some((c) => c.state === 'fall')) spawnT = 0.25;
      }
      function drop(card) {
        card.state = 'done';
        card.el.classList.add('bad', 'splat');
        card.el.innerHTML = '<div class="gm-fc"><span>' + esc(card.it[0]) + '</span><small>Era: ' + esc(bins[card.it[1]]) + '</small></div>';
        g.miss();
        g.bad(card.el.firstChild);
        binEls[card.it[1]].classList.add('show');
        g.after(900, () => binEls[card.it[1]].classList.remove('show'));
        wrong.push(card.it[0]);
        remove(card, 1000);
        if (g.loseLife() <= 0) end('Te quedaste sin vidas');
        else spawnT = 0.6;
      }
      function end(reason) {
        if (over) return;
        over = true;
        g.after(900, () => g.end({ reason, correct, seen, detail: { correct, seen, bestStreak: g.bestStreak, missed: wrong.slice(0, 10) } }));
      }

      g.frame((dt) => {
        if (!started || over) return;
        const H = field.clientHeight;
        cards.forEach((c) => {
          if (c.state !== 'fall') return;
          c.y += (H + c.h) * speed * dt;
          c.el.style.transform = 'translateY(' + c.y.toFixed(1) + 'px)';
          if (c.y + c.h >= H - 6) drop(c);
        });
        const falling = cards.filter((c) => c.state === 'fall');
        if (spawnT > 0) { spawnT -= dt; if (spawnT <= 0 && !falling.length) spawn(); }
        else if (!falling.length) spawn();
        else if (correct >= 6 && falling.length < 2) {
          const top = falling.reduce((m, c) => Math.min(m, c.y), 1e9);
          if (top > H * 0.5) spawn();
        }
      });
      g.stage.querySelector('.gm-bins').addEventListener('click', (e) => { const b = e.target.closest('.gm-bin'); if (b) sort(+b.dataset.i); });
      g.key((e) => { const n = parseInt(e.key, 10); if (n >= 1 && n <= bins.length) { e.preventDefault(); sort(n - 1); } });
      const ready = field.querySelector('.gm-sready');
      g.pause();
      g.clock(TIME, () => end('¡Se acabó el tiempo!'));
      g.pause();
      g.after(900, () => { ready.remove(); started = true; g.resume(); });
      if (!items.length) ready.textContent = 'No hay tarjetas en este reto.';
    },
  });
}
