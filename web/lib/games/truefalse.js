// ¿Mito o verdad?: una afirmación a la vez; desliza la tarjeta (o usa botones o ← →) para decidir.
// spec: { items:[{s:'El agua hierve a 92 °C en Bogotá', a:true, e:'Hay menos presión atmosférica a 2600 m.'}], time:60, lives:3 }
import { esc, shuffle, reduce } from '../widgets.js';
import { makeGame, clamp } from './common.js';

export default function truefalse(el, spec, finish) {
  const items = (spec.items || []).filter((it) => it && it.s && typeof it.a === 'boolean');
  const TIME = spec.time || 60;
  const LIVES = spec.lives || 3;
  const target = Math.max(1, Math.min(items.length, 12));
  return makeGame(el, spec, finish, {
    key: 'truefalse', name: '¿Mito o verdad?', icon: '⇄', time: 'down', lives: LIVES,
    how: 'Lee cada afirmación y decide: ¿es un mito o es verdad? Desliza la tarjeta o usa los botones.',
    rules: [TIME + ' segundos', LIVES + ' vidas', '3 seguidas: puntos ×2', 'Teclas ← Mito · Verdad →'],
    stars: (r) => (r.correct >= Math.ceil(target * 0.9) ? 3 : r.correct >= Math.ceil(target * 0.7) ? 2 : r.correct >= Math.ceil(target * 0.4) ? 1 : 0),
    lines: (r) => [['Aciertos', r.correct + ' de ' + r.asked], ['Mejor racha', String(r.bestStreak)], ['Precisión', r.asked ? Math.round((100 * r.correct) / r.asked) + ' %' : '—']],
    play(g) {
      const deck = shuffle(items.slice());
      let qi = -1, cur = null, state = 'idle', correct = 0, asked = 0, t0 = 0, card = null, waitT = null;
      const missed = [];
      g.stage.innerHTML =
        '<div class="gm-mv-deck">' +
        '<div class="gm-mv-side l" aria-hidden="true"><b>✗</b><span>Mito</span></div>' +
        '<div class="gm-mv-side r" aria-hidden="true"><b>✓</b><span>Verdad</span></div>' +
        '<div class="gm-mv-under" aria-hidden="true"></div>' +
        '</div>' +
        '<div class="gm-mv-btns">' +
        '<button type="button" class="gm-mv-b no" data-v="0"><kbd>←</kbd><span>Mito</span></button>' +
        '<button type="button" class="gm-mv-b yes" data-v="1"><span>Verdad</span><kbd>→</kbd></button>' +
        '</div>';
      const deckE = g.stage.querySelector('.gm-mv-deck');
      const under = deckE.querySelector('.gm-mv-under');
      const sideL = deckE.querySelector('.gm-mv-side.l');
      const sideR = deckE.querySelector('.gm-mv-side.r');
      const btns = [...g.stage.querySelectorAll('.gm-mv-b')];
      const info = () => g.info('<span>Afirmación <b>' + Math.max(1, Math.min(deck.length, qi + 1)) + '</b> de ' + deck.length + '</span><span><b>' + correct + '</b> aciertos</span>');

      const done = (reason) => {
        state = 'over';
        g.end({ reason, correct, asked, detail: { correct, asked, bestStreak: g.bestStreak, lives: g.lives, missed: missed.slice(0, 10) } });
      };

      function next() {
        if (waitT) { g.cancel(waitT); waitT = null; }
        if (card) { const old = card; old.classList.add('gm-mv-gone'); g.after(260, () => old.remove()); }
        qi++;
        if (qi >= deck.length) { card = null; return done('¡Respondiste todas las afirmaciones!'); }
        cur = deck[qi];
        card = document.createElement('div');
        card.className = 'gm-mv-card';
        card.setAttribute('role', 'group');
        card.setAttribute('aria-label', 'Afirmación');
        card.innerHTML =
          '<i class="gm-mv-stamp no">MITO</i><i class="gm-mv-stamp yes">VERDAD</i>' +
          '<p class="gm-qn">¿Mito o verdad?</p><p class="gm-mv-s">' + esc(cur.s) + '</p>' +
          '<p class="gm-mv-tip">Desliza a la izquierda o a la derecha</p>';
        card.classList.toggle('long', cur.s.length > 110);
        deckE.appendChild(card);
        under.classList.toggle('last', qi >= deck.length - 1);
        bindDrag(card);
        state = 'ask';
        btns.forEach((b) => (b.disabled = false));
        info();
        g.say(cur.s);
        t0 = performance.now();
        g.resume();
      }

      function answer(v) {
        if (state !== 'ask' || !card) return;
        state = 'show';
        asked++;
        btns.forEach((b) => (b.disabled = true));
        const ok = v === cur.a;
        const dir = v ? 1 : -1;
        const btn = btns[v ? 1 : 0];
        g.bump(btn, 'gm-press');
        const c = card;
        c.classList.add('fly');
        c.style.transform = 'translateX(' + dir * 130 + '%) rotate(' + dir * 22 + 'deg)';
        c.style.opacity = '0';
        (v ? sideR : sideL).classList.add(ok ? 'good' : 'bad');
        g.after(500, () => { sideL.classList.remove('good', 'bad'); sideR.classList.remove('good', 'bad'); });
        if (ok) {
          correct++;
          const m = g.hit();
          const secs = (performance.now() - t0) / 1000;
          const fast = secs < 3 ? 50 : secs < 6 ? 20 : 0;
          g.good(btn);
          g.add(100 * m + fast, deckE);
        } else {
          g.miss();
          g.bad(btn);
          missed.push(cur.s);
        }
        info();
        const left = ok ? g.lives : g.loseLife();
        if (!ok) g.pause();
        // tarjeta de resultado con la explicación
        const res = document.createElement('div');
        res.className = 'gm-mv-card res ' + (ok ? 'ok' : 'no');
        res.innerHTML =
          '<p class="gm-mv-vd"><b>' + (ok ? '¡Correcto!' : '¡Uy, no!') + '</b> ' + (cur.a ? 'Es verdad.' : 'Es un mito.') + '</p>' +
          (cur.e ? '<p class="gm-mv-e">' + esc(cur.e) + '</p>' : '<p class="gm-mv-e gm-mv-q">' + esc(cur.s) + '</p>') +
          '<button type="button" class="gm-btn sm gm-mv-next">Seguir</button>';
        g.after(reduce ? 0 : 180, () => {
          if (!g.alive) return;
          c.remove();
          card = res;
          deckE.appendChild(res);
          g.bump(res, 'gm-in');
          if (!ok) g.bump(res, 'gm-shake');
          res.querySelector('.gm-mv-next').onclick = () => cont();
          g.say((ok ? 'Correcto. ' : 'Incorrecto. ') + (cur.a ? 'Es verdad. ' : 'Es un mito. ') + (cur.e || ''));
        });
        state = left <= 0 ? 'dying' : 'show';
        const ms = ok ? (cur.e ? 1900 : 900) : (cur.e ? 3600 : 1800);
        waitT = g.after(ms, cont);
      }
      function cont() {
        if (state === 'dying') { state = 'over'; return done('Te quedaste sin vidas'); }
        if (state !== 'show') return;
        next();
      }

      function bindDrag(c) {
        let id = null, x0 = 0, y0 = 0, dx = 0, moved = false;
        const move = (e) => {
          if (e.pointerId !== id) return;
          dx = e.clientX - x0;
          if (!moved && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(e.clientY - y0)) moved = true;
          if (!moved) return;
          const w = deckE.clientWidth;
          const f = clamp(dx / (w * 0.3), -1, 1);
          c.style.transform = 'translateX(' + dx.toFixed(0) + 'px) rotate(' + (dx * 0.05).toFixed(1) + 'deg)';
          c.style.setProperty('--yes', Math.max(0, f).toFixed(2));
          c.style.setProperty('--no', Math.max(0, -f).toFixed(2));
          sideL.classList.toggle('hot', f < -0.55);
          sideR.classList.toggle('hot', f > 0.55);
        };
        const up = (e) => {
          if (e.pointerId !== id) return;
          id = null;
          c.classList.remove('drag');
          sideL.classList.remove('hot'); sideR.classList.remove('hot');
          if (moved && Math.abs(dx) > Math.max(70, deckE.clientWidth * 0.18) && state === 'ask') { answer(dx > 0); return; }
          c.style.transform = '';
          c.style.setProperty('--yes', '0');
          c.style.setProperty('--no', '0');
        };
        c.addEventListener('pointerdown', (e) => {
          if (state !== 'ask' || id !== null) return;
          id = e.pointerId; x0 = e.clientX; y0 = e.clientY; dx = 0; moved = false;
          c.classList.add('drag');
          try { c.setPointerCapture(e.pointerId); } catch (x) { /* ignorar */ }
        });
        c.addEventListener('pointermove', move);
        c.addEventListener('pointerup', up);
        c.addEventListener('pointercancel', up);
      }

      g.stage.querySelector('.gm-mv-btns').addEventListener('click', (e) => { const b = e.target.closest('.gm-mv-b'); if (b) answer(b.dataset.v === '1'); });
      g.key((e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); if (state === 'ask') answer(e.key === 'ArrowRight'); else if (state === 'show' || state === 'dying') cont(); }
        else if ((e.key === 'Enter' || e.key === ' ') && (state === 'show' || state === 'dying') && e.target.tagName !== 'BUTTON') { e.preventDefault(); cont(); }
      });
      g.clock(TIME, () => { if (state !== 'over') done('¡Se acabó el tiempo!'); });
      if (!deck.length) { deckE.insertAdjacentHTML('beforeend', '<div class="gm-mv-card"><p class="gm-mv-s">No hay afirmaciones en este reto.</p></div>'); btns.forEach((b) => (b.disabled = true)); g.pause(); return; }
      next();
    },
  });
}
