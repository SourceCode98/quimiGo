// Ordena la secuencia: arrastra (o toca dos para intercambiar, o usa ▲ ▼) hasta dejar la lista en orden y comprueba.
// spec: { rounds:[{prompt:'Ordena de menor a mayor pH', items:['Jugo de limón','Café','Agua pura','Jabón'], labels?:['pH 2','pH 5','pH 7','pH 10']}], time:90 }
//   items vienen en el orden CORRECTO (de 2 a 8 por ronda); se barajan al mostrarlos.
import { esc, shuffle, reduce } from '../widgets.js';
import { makeGame, clamp } from './common.js';

const MAXI = 8;
const VALUE = 300, COST = 60, FLOOR = 60;

export default function order(el, spec, finish) {
  const rounds = (spec.rounds || [])
    .filter((r) => r && Array.isArray(r.items) && r.items.length >= 2)
    .map((r) => ({ prompt: r.prompt || 'Ordena la secuencia', items: r.items.slice(0, MAXI).map(String), labels: Array.isArray(r.labels) ? r.labels.slice(0, MAXI).map(String) : null }));
  const TIME = spec.time || 90;
  const N = rounds.length;
  return makeGame(el, spec, finish, {
    key: 'order', name: 'Ordena la secuencia', icon: '⇅', time: 'down', lives: 0,
    how: 'Pon cada lista en el orden correcto y pulsa «Comprobar». Cada intento fallido resta puntos.',
    rules: [N + (N === 1 ? ' ronda' : ' rondas'), TIME + ' segundos', 'Arrastra o toca dos para intercambiar', 'Sin errores: racha ×2'],
    stars: (r) => {
      if (!r.total) return 0;
      const f = r.solved / r.total;
      if (f >= 1 && r.mistakes <= Math.max(1, Math.floor(r.total / 3))) return 3;
      if (f >= 0.66 && r.mistakes <= r.total * 2) return 2;
      return r.solved >= 1 && f >= 0.33 ? 1 : 0;
    },
    lines: (r) => [['Rondas', r.solved + ' de ' + r.total], ['Intentos fallidos', String(r.mistakes)], r.bonus ? ['Bono de tiempo', '+' + r.bonus] : null],
    play(g) {
      let ri = -1, R = null, ord = [], sel = -1, value = VALUE, solved = 0, mistakes = 0, state = 'idle', roundMiss = 0;
      const log = [];
      g.stage.innerHTML =
        '<div class="gm-q gm-or-head" aria-live="polite"><p class="gm-qn"></p><h3 class="gm-qt"></h3></div>' +
        '<ol class="gm-or-list" aria-label="Lista para ordenar"></ol>' +
        '<div class="gm-or-foot"><p class="gm-or-tip">Arrastra una tarjeta, o toca dos para intercambiarlas.</p>' +
        '<button type="button" class="gm-btn gm-or-check">Comprobar</button></div>';
      const head = g.stage.querySelector('.gm-or-head');
      const qn = head.querySelector('.gm-qn');
      const qt = head.querySelector('.gm-qt');
      const list = g.stage.querySelector('.gm-or-list');
      const check = g.stage.querySelector('.gm-or-check');
      const tip = g.stage.querySelector('.gm-or-tip');
      const info = () => g.info('<span>Ronda <b>' + Math.max(1, Math.min(N, ri + 1)) + '</b> de ' + N + '</span><span>Vale <b>' + value + '</b></span>');
      const rows = () => [...list.children];
      const rowOf = (id) => list.querySelector('[data-id="' + id + '"]');

      function next() {
        ri++;
        if (ri >= N) return finishAll('¡Ordenaste todas las secuencias!');
        R = rounds[ri];
        const n = R.items.length;
        ord = R.items.map((_, i) => i);
        let tries = 0;
        do { ord = shuffle(ord); tries++; } while (tries < 20 && ord.every((v, i) => v === i));
        sel = -1; value = VALUE; roundMiss = 0; state = 'play';
        qn.textContent = 'Ronda ' + (ri + 1) + ' de ' + N;
        qt.textContent = R.prompt;
        list.style.setProperty('--n', String(n));
        list.innerHTML = ord.map((id) =>
          '<li class="gm-or-it" data-id="' + id + '" tabindex="0">' +
          '<span class="gm-or-n"></span><span class="gm-or-g" aria-hidden="true">⠿</span>' +
          '<span class="gm-or-t">' + esc(R.items[id]) + '</span>' + (R.labels && R.labels[id] ? '<small class="gm-or-lb">' + esc(R.labels[id]) + '</small>' : '') +
          '<span class="gm-or-mv"><button type="button" class="gm-or-up" aria-label="Subir">▲</button><button type="button" class="gm-or-dn" aria-label="Bajar">▼</button></span>' +
          '</li>').join('');
        number();
        check.textContent = 'Comprobar';
        check.disabled = false;
        tip.hidden = false;
        info();
        g.bump(head, 'gm-in');
        if (!reduce) rows().forEach((r, i) => { r.style.setProperty('--d', i * 50 + 'ms'); r.classList.add('gm-or-enter'); });
        g.say('Ronda ' + (ri + 1) + ': ' + R.prompt);
        g.resume();
      }
      function number() {
        rows().forEach((r, i) => {
          r.querySelector('.gm-or-n').textContent = String(i + 1);
          r.setAttribute('aria-label', (i + 1) + '. ' + R.items[+r.dataset.id]);
          r.querySelector('.gm-or-up').disabled = i === 0 || state !== 'play';
          r.querySelector('.gm-or-dn').disabled = i === ord.length - 1 || state !== 'play';
        });
      }
      // reordena el DOM con animación FLIP
      function render(focusId) {
        const before = {};
        rows().forEach((r) => { before[r.dataset.id] = r.getBoundingClientRect().top; r.classList.remove('ok', 'bad', 'gm-or-enter'); r.style.transform = ''; });
        ord.forEach((id) => list.appendChild(rowOf(id)));
        number();
        if (!reduce) {
          rows().forEach((r) => {
            const d = before[r.dataset.id] - r.getBoundingClientRect().top;
            if (!d) return;
            r.style.transition = 'none';
            r.style.transform = 'translateY(' + d + 'px)';
            void r.offsetWidth;
            r.style.transition = '';
            r.style.transform = '';
          });
        }
        if (focusId !== undefined) { const f = rowOf(focusId); if (f) f.focus({ preventScroll: true }); }
      }
      function setSel(i) {
        sel = i;
        rows().forEach((r, j) => r.classList.toggle('sel', j === sel));
      }
      function moveTo(from, to) {
        to = clamp(to, 0, ord.length - 1);
        if (from === to || state !== 'play') return;
        const [id] = ord.splice(from, 1);
        ord.splice(to, 0, id);
        render(id);
        if (sel >= 0) setSel(to);
      }
      function swap(a, b) {
        if (state !== 'play') return;
        [ord[a], ord[b]] = [ord[b], ord[a]];
        setSel(-1);
        render(ord[b]);
        g.bump(rowOf(ord[a]), 'gm-or-pop');
        g.bump(rowOf(ord[b]), 'gm-or-pop');
      }
      function tap(i) {
        if (state !== 'play') return;
        if (sel < 0) setSel(i);
        else if (sel === i) setSel(-1);
        else swap(sel, i);
      }

      function doCheck() {
        if (state === 'won') return next();
        if (state !== 'play') return;
        setSel(-1);
        const rs = rows();
        let good = 0;
        rs.forEach((r, i) => {
          const ok = ord[i] === i;
          r.classList.remove('ok', 'bad');
          void r.offsetWidth;
          r.classList.add(ok ? 'ok' : 'bad');
          if (ok) good++;
        });
        if (good === ord.length) return win();
        mistakes++; roundMiss++;
        g.miss();
        g.bad(check);
        const was = value;
        value = Math.max(FLOOR, value - COST);
        g.pop(good + ' de ' + ord.length + ' en su lugar', g.at(check, 0.5, -0.6), 'no');
        if (was !== value) g.after(350, () => g.pop('Vale −' + (was - value), g.at(head, 0.8, 0.5), 'no'));
        info();
        g.say(good + ' de ' + ord.length + ' en su lugar. Intenta otra vez.');
      }
      function win() {
        state = 'won';
        solved++;
        g.pause();
        const m = roundMiss === 0 ? g.hit() : (g.miss(), 1);
        const pts = value * m;
        log.push({ prompt: R.prompt, tries: roundMiss + 1 });
        rows().forEach((r, i) => { r.style.setProperty('--d', i * 80 + 'ms'); r.classList.add('won'); });
        number();
        list.classList.add('done');
        g.good(list);
        g.add(pts, list, (roundMiss === 0 ? '¡Perfecto! +' : '¡Bien! +') + pts);
        if (roundMiss === 0) g.confetti(28);
        tip.hidden = true;
        check.textContent = ri + 1 >= N ? 'Ver resultado' : 'Siguiente';
        g.say('¡Correcto! ' + R.items.join(', ') + (R.labels ? '. ' + R.items.map((t, i) => t + ': ' + (R.labels[i] || '')).join('; ') : ''));
        check.focus({ preventScroll: true });
      }
      function finishAll(reason) {
        state = 'over';
        const allDone = solved === N;
        const bonus = allDone ? Math.round(g.t) * 5 : 0;
        if (bonus) g.setScore(g.score + bonus);
        g.end({ reason, solved, total: N, mistakes, bonus, detail: { solved, total: N, mistakes, timeBonus: bonus, bestStreak: g.bestStreak, rounds: log } });
      }
      g.on(check, 'click', () => { list.classList.remove('done'); doCheck(); });

      // arrastre con eventos de puntero (mouse y táctil)
      let drag = null;
      list.addEventListener('click', (e) => {
        const b = e.target.closest('.gm-or-up, .gm-or-dn');
        if (!b) return;
        const i = rows().indexOf(b.closest('.gm-or-it'));
        moveTo(i, i + (b.classList.contains('gm-or-up') ? -1 : 1));
        const r = rowOf(ord[clamp(i + (b.classList.contains('gm-or-up') ? -1 : 1), 0, ord.length - 1)]);
        const nb = r && r.querySelector(b.classList.contains('gm-or-up') ? '.gm-or-up' : '.gm-or-dn');
        if (nb && !nb.disabled) nb.focus({ preventScroll: true });
      });
      list.addEventListener('pointerdown', (e) => {
        if (state !== 'play' || drag || e.button > 0 || e.target.closest('button')) return;
        const row = e.target.closest('.gm-or-it');
        if (!row) return;
        const rs = rows();
        drag = { row, id: e.pointerId, i: rs.indexOf(row), y0: e.clientY, dy: 0, on: false, to: rs.indexOf(row), rs, tops: rs.map((r) => r.offsetTop), hs: rs.map((r) => r.offsetHeight) };
        try { row.setPointerCapture(e.pointerId); } catch (x) { /* ignorar */ }
      });
      list.addEventListener('pointermove', (e) => {
        const d = drag;
        if (!d || e.pointerId !== d.id) return;
        d.dy = e.clientY - d.y0;
        if (!d.on && Math.abs(d.dy) > 7) { d.on = true; d.row.classList.add('drag'); list.classList.add('dragging'); setSel(-1); }
        if (!d.on) return;
        e.preventDefault();
        const minY = -d.tops[d.i] - 10, maxY = d.tops[d.tops.length - 1] + d.hs[d.hs.length - 1] - d.tops[d.i] - d.hs[d.i] + 10;
        const dy = clamp(d.dy, minY, maxY);
        d.row.style.transform = 'translateY(' + dy + 'px) scale(1.03)';
        const c = d.tops[d.i] + d.hs[d.i] / 2 + dy;
        let to = 0;
        d.rs.forEach((r, k) => { if (k !== d.i && d.tops[k] + d.hs[k] / 2 < c) to++; });
        d.to = to;
        const gap = d.rs.length > 1 ? (d.i > 0 ? d.tops[d.i] - d.tops[d.i - 1] - d.hs[d.i - 1] : d.tops[1] - d.tops[0] - d.hs[0]) : 0;
        const step = d.hs[d.i] + gap;
        d.rs.forEach((r, k) => {
          if (k === d.i) return;
          const s = d.i < to && k > d.i && k <= to ? -step : to < d.i && k >= to && k < d.i ? step : 0;
          r.style.transform = s ? 'translateY(' + s + 'px)' : '';
        });
      });
      const up = (e) => {
        const d = drag;
        if (!d || e.pointerId !== d.id) return;
        drag = null;
        list.classList.remove('dragging');
        d.row.classList.remove('drag');
        if (!d.on) { if (e.type === 'pointerup') tap(d.i); return; }
        if (d.to !== d.i) {
          // fija las posiciones visuales actuales antes del FLIP para que no salten
          const [id] = ord.splice(d.i, 1);
          ord.splice(d.to, 0, id);
          render();
          g.bump(d.row, 'gm-or-pop');
        } else d.rs.forEach((r) => (r.style.transform = ''));
      };
      list.addEventListener('pointerup', up);
      list.addEventListener('pointercancel', up);

      // teclado: ↑ ↓ cambian de tarjeta; Enter o Espacio la toma; con una tomada, ↑ ↓ la mueven
      g.key((e) => {
        if (state === 'won' && e.key === 'Enter' && e.target !== check) { e.preventDefault(); doCheck(); return; }
        const row = e.target.closest && e.target.closest('.gm-or-it');
        if (!row || e.target.tagName === 'BUTTON') return;
        const i = rows().indexOf(row);
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          const j = i + (e.key === 'ArrowUp' ? -1 : 1);
          if (sel === i) moveTo(i, j);
          else { const r = rows()[clamp(j, 0, ord.length - 1)]; if (r) r.focus(); }
        } else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(i); }
        else if (e.key === 'Escape') setSel(-1);
      });

      g.clock(TIME, () => { if (state !== 'over') finishAll('¡Se acabó el tiempo!'); });
      if (!N) { qt.textContent = 'No hay secuencias en este reto.'; check.disabled = true; tip.hidden = true; g.pause(); return; }
      next();
    },
  });
}
