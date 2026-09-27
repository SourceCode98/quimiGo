// Contrarreloj: preguntas de opción múltiple al azar contra el reloj, con racha y vidas.
// spec: { items:[{q, o:[...], a (índice o texto de la opción), e}], time:60, lives:3 }
import { esc, shuffle } from '../widgets.js';
import { makeGame } from './common.js';

const FIXED = /^(todas|ninguna|ambas)\b/i;

function prep(it) {
  const o = (it.o || []).map(String);
  let a = typeof it.a === 'number' ? it.a : o.indexOf(String(it.a));
  if (a < 0 || a >= o.length) a = 0;
  let idx = o.map((_, i) => i);
  if (!o.some((x) => FIXED.test(x))) idx = shuffle(idx);
  return { q: it.q, o: idx.map((i) => o[i]), a: idx.indexOf(a), e: it.e || '', right: o[a] };
}

export default function blitz(el, spec, finish) {
  const items = (spec.items || []).filter((it) => it && it.q && it.o && it.o.length >= 2);
  const LIVES = spec.lives || 3;
  const TIME = spec.time || 60;
  const target = Math.max(1, Math.min(items.length, 12));
  return makeGame(el, spec, finish, {
    key: 'blitz', name: 'Contrarreloj', icon: '⏱', time: 'down', lives: LIVES,
    how: 'Responde todas las preguntas que puedas antes de que se acabe el tiempo.',
    rules: [TIME + ' segundos', LIVES + ' vidas', '3 seguidas: puntos ×2', '6 seguidas: ×3'],
    stars: (r) => (r.correct >= Math.ceil(target * 0.9) ? 3 : r.correct >= Math.ceil(target * 0.7) ? 2 : r.correct >= Math.ceil(target * 0.4) ? 1 : 0),
    lines: (r) => [['Aciertos', r.correct + ' de ' + r.asked], ['Mejor racha', String(r.bestStreak)], ['Precisión', r.asked ? Math.round((100 * r.correct) / r.asked) + ' %' : '—']],
    play(g) {
      const deck = shuffle(items.slice()).map(prep);
      let qi = -1, cur = null, locked = false, correct = 0, asked = 0, t0 = 0;
      const missed = [];
      g.stage.innerHTML =
        '<div class="gm-q" aria-live="polite"><p class="gm-qn"></p><h3 class="gm-qt"></h3></div>' +
        '<div class="gm-opts" role="group" aria-label="Opciones"></div>' +
        '<div class="gm-exp" hidden></div>';
      const qBox = g.stage.querySelector('.gm-q');
      const qn = g.stage.querySelector('.gm-qn');
      const qt = g.stage.querySelector('.gm-qt');
      const opts = g.stage.querySelector('.gm-opts');
      const exp = g.stage.querySelector('.gm-exp');

      const done = (reason) => g.end({
        reason, correct, asked,
        detail: { correct, asked, bestStreak: g.bestStreak, lives: g.lives, missed: missed.slice(0, 10) },
      });

      function next() {
        qi++;
        if (qi >= deck.length) return done('¡Respondiste todas las preguntas!');
        cur = deck[qi];
        locked = false;
        exp.hidden = true;
        qn.textContent = 'Pregunta ' + (qi + 1) + ' de ' + deck.length;
        qt.innerHTML = esc(cur.q);
        opts.className = 'gm-opts' + (cur.o.length === 2 ? ' two' : '') + (cur.o.some((x) => x.length > 38) ? ' long' : '');
        opts.innerHTML = cur.o.map((x, i) => '<button type="button" class="gm-opt" data-i="' + i + '"><kbd>' + (i + 1) + '</kbd><span>' + esc(x) + '</span></button>').join('');
        g.bump(qBox, 'gm-in');
        g.bump(opts, 'gm-in');
        g.info('<span><b>' + correct + '</b> aciertos</span>');
        t0 = performance.now();
        g.resume();
      }

      function choose(i) {
        if (locked || !cur || i < 0 || i >= cur.o.length) return;
        locked = true;
        asked++;
        const btns = opts.querySelectorAll('.gm-opt');
        btns.forEach((b) => (b.disabled = true));
        const b = btns[i];
        if (i === cur.a) {
          correct++;
          const m = g.hit();
          const secs = (performance.now() - t0) / 1000;
          const fast = secs < 4 ? 50 : secs < 7 ? 20 : 0;
          b.classList.add('right');
          g.good(b);
          g.add(100 * m + fast, b);
          g.info('<span><b>' + correct + '</b> aciertos</span>');
          g.after(520, next);
        } else {
          g.miss();
          b.classList.add('wrong');
          btns[cur.a].classList.add('right');
          g.bad(b);
          missed.push(cur.q);
          const left = g.loseLife();
          g.pause();
          exp.hidden = false;
          // Con respuesta incorrecta el juego espera (reloj en pausa) hasta que el estudiante lea la explicación.
          exp.innerHTML = '<b>Respuesta: ' + esc(cur.right) + '.</b> ' + esc(cur.e) +
            '<div class="gm-exp-go"><button type="button" class="gm-btn sm">' + (left <= 0 ? 'Ver resultado' : 'Entendido, continuar') + '</button></div>';
          g.bump(exp, 'gm-in');
          const goB = exp.querySelector('button');
          waiting = () => { waiting = null; left <= 0 ? done('Te quedaste sin vidas') : next(); };
          goB.onclick = () => waiting && waiting();
          g.after(60, () => goB.focus());
        }
      }

      opts.addEventListener('click', (e) => { const b = e.target.closest('.gm-opt'); if (b) choose(+b.dataset.i); });
      let waiting = null;
      g.key((e) => {
        if (waiting) { if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') { e.preventDefault(); waiting(); } return; }
        const n = parseInt(e.key, 10); if (n >= 1 && n <= 9) { e.preventDefault(); choose(n - 1); }
      });
      g.clock(TIME, () => done('¡Se acabó el tiempo!'));
      if (!deck.length) { qt.textContent = 'No hay preguntas en este reto.'; return; }
      next();
    },
  });
}
