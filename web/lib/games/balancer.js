// Balanceo relámpago: una ecuación a la vez; ajusta los coeficientes hasta que los átomos cuadren.
// spec: { rx:[{r:['H2','O2'], p:['H2O'], c:[2,1,2]}, ...], time:120 }
import { EL, parseF, fH, esc } from '../widgets.js';
import { makeGame } from './common.js';

const MAXC = 12;
const gcd = (a, b) => { while (b) { [a, b] = [b, a % b]; } return a; };
const col = (e) => (EL[e] ? EL[e].css : '#999');

export default function balancer(el, spec, finish) {
  const rx = (spec.rx || []).filter((r) => r && r.r && r.p && r.r.length && r.p.length);
  const TIME = spec.time || 120;
  const N = rx.length;
  return makeGame(el, spec, finish, {
    key: 'balancer', name: 'Balanceo relámpago', icon: '⚖', time: 'down',
    how: 'Usa + y − para cambiar los coeficientes hasta tener los mismos átomos a cada lado. Usa los enteros más pequeños.',
    rules: [N + ' ecuaciones', TIME + ' segundos', 'Rapidez = bonificación'],
    stars: (r) => { const f = N ? r.solved / N : 0; return f >= 1 ? 3 : f >= 0.6 ? 2 : f >= 0.3 ? 1 : 0; },
    lines: (r) => [['Balanceadas', r.solved + ' de ' + N], ['Tiempo usado', Math.round(r.used) + ' s'], r.skipped ? ['Saltadas', String(r.skipped)] : null],
    play(g) {
      let ri = -1, co = [], lock = true, touched = false, solved = 0, skipped = 0, t0 = 0, sel = 0;
      const results = [];
      g.stage.innerHTML =
        '<div class="gm-bhead"><p class="gm-qn"></p><button type="button" class="gm-btn ghost sm gm-skip">Saltar</button></div>' +
        '<div class="gm-eqbox"><div class="gm-eq"></div><div class="gm-stamp" aria-hidden="true">¡Balanceada!</div></div>' +
        '<div class="gm-atoms"></div><div class="gm-bfb" aria-live="polite"></div>' +
        '<p class="gm-keys">Flechas ← → eligen la sustancia, ↑ ↓ o un número cambian su coeficiente</p>';
      const eqBox = g.stage.querySelector('.gm-eqbox'), eq = g.stage.querySelector('.gm-eq'), atomsEl = g.stage.querySelector('.gm-atoms'), fb = g.stage.querySelector('.gm-bfb');
      const qn = g.stage.querySelector('.gm-qn');
      const mini = (f) => { const c = parseF(f); let d = ''; Object.keys(c).forEach((e) => { for (let i = 0; i < c[e]; i++) d += '<i style="background:' + col(e) + '"></i>'; }); return '<span class="gm-mini">' + d + '</span>'; };

      const all = () => { const r = rx[ri]; return r.r.concat(r.p); };
      function load() {
        ri++;
        if (ri >= N) return done('¡Balanceaste todas las ecuaciones!');
        co = all().map(() => 1);
        sel = 0;
        touched = false;
        lock = false;
        eqBox.classList.remove('ok', 'out');
        g.bump(eqBox, 'gm-slide');
        qn.innerHTML = 'Ecuación <b>' + (ri + 1) + '</b> de ' + N + (rx[ri].name ? ' · ' + esc(rx[ri].name) : '');
        const r = rx[ri];
        eq.innerHTML = all().map((f, i) =>
          (i === r.r.length ? '<span class="gm-sym">→</span>' : i > 0 ? '<span class="gm-sym">+</span>' : '') +
          '<div class="gm-term" data-i="' + i + '">' +
          '<button type="button" class="gm-cb" data-i="' + i + '" data-d="1" aria-label="Más ' + esc(f) + '">+</button>' +
          '<div class="gm-tv"><output class="gm-co">1</output><span class="gm-ff">' + fH(f) + '</span></div>' +
          '<button type="button" class="gm-cb" data-i="' + i + '" data-d="-1" aria-label="Menos ' + esc(f) + '">−</button>' +
          '<div class="gm-minis"></div></div>').join('');
        t0 = performance.now();
        fb.innerHTML = '';
        g.info('<span><b>' + solved + '</b> de ' + N + ' balanceadas</span>');
        render();
      }
      function render() {
        const r = rx[ri], f = all();
        eq.querySelectorAll('.gm-term').forEach((t, i) => {
          t.querySelector('.gm-co').textContent = co[i];
          t.querySelector('.gm-co').classList.toggle('one', co[i] === 1);
          t.classList.toggle('sel', i === sel);
          t.querySelector('.gm-minis').innerHTML = mini(f[i]).repeat(Math.min(co[i], 8)) + (co[i] > 8 ? '<em>+' + (co[i] - 8) + '</em>' : '');
          t.querySelector('[data-d="-1"]').disabled = co[i] <= 1 || lock;
          t.querySelector('[data-d="1"]').disabled = co[i] >= MAXC || lock;
        });
        const L = {}, R = {}, els = [];
        f.forEach((x, i) => { const c = parseF(x); Object.keys(c).forEach((e) => { if (!els.includes(e)) els.push(e); const s = i < r.r.length ? L : R; s[e] = (s[e] || 0) + c[e] * co[i]; }); });
        let ok = true;
        atomsEl.innerHTML = els.map((e) => {
          const a = L[e] || 0, b = R[e] || 0, q = a === b;
          if (!q) ok = false;
          const dots = (n) => { let d = ''; for (let i = 0; i < Math.min(n, 24); i++) d += '<i style="background:' + col(e) + '"></i>'; return d + (n > 24 ? '<em>+' + (n - 24) + '</em>' : ''); };
          return '<div class="gm-arow ' + (q ? 'eq' : 'ne') + '"><span class="gm-ael"><i style="background:' + col(e) + '"></i>' + esc(e) + '</span>' +
            '<span class="gm-adots l">' + dots(a) + '</span><b>' + a + '</b><span class="gm-arel">' + (q ? '=' : '≠') + '</span><b>' + b + '</b><span class="gm-adots">' + dots(b) + '</span></div>';
        }).join('');
        const gg = co.reduce(gcd);
        if (ok && gg > 1) fb.innerHTML = '<div class="gm-note">Está balanceada, pero puedes simplificar: divide todos los coeficientes entre ' + gg + '.</div>';
        else if (ok && !touched && !lock) fb.innerHTML = '<div class="gm-note">Cuenta los átomos: ¿ya está balanceada así? <button type="button" class="gm-btn sm gm-yes">Sí, ya está</button></div>';
        else if (!lock) fb.innerHTML = '';
        if (ok && gg === 1 && touched && !lock) win();
      }
      function win() {
        lock = true;
        solved++;
        const secs = (performance.now() - t0) / 1000;
        results.push(Math.round(secs));
        const m = g.hit();
        const bonus = Math.round(Math.max(0, 30 - secs) * 4);
        eqBox.classList.add('ok');
        g.good(eqBox);
        g.add((100 + bonus) * m, eqBox);
        if (bonus > 60) g.after(250, () => g.pop('¡Rapidísimo!', g.at(eqBox, 0.5, 0.15), 'combo'));
        g.confetti(28);
        g.say('¡Balanceada!');
        render();
        g.info('<span><b>' + solved + '</b> de ' + N + ' balanceadas</span>');
        g.after(1100, () => { eqBox.classList.add('out'); });
        g.after(1450, load);
      }
      function done(reason) {
        const used = TIME - g.t;
        if (solved === N && N) g.setScore(g.score + Math.round(g.t) * 5);
        g.end({ reason, solved, skipped, used, detail: { solved, total: N, skipped, seconds: results } });
      }
      function change(i, d) {
        if (lock || i < 0 || i >= co.length) return;
        const v = Math.max(1, Math.min(MAXC, co[i] + d));
        if (v === co[i]) return;
        co[i] = v; sel = i; touched = true;
        g.bump(eq.querySelectorAll('.gm-co')[i], 'gm-bump');
        render();
      }
      function setC(i, v) { if (lock) return; co[i] = Math.max(1, Math.min(MAXC, v)); touched = true; render(); }
      eq.addEventListener('click', (e) => {
        const b = e.target.closest('.gm-cb');
        if (b) { change(+b.dataset.i, +b.dataset.d); return; }
        const t = e.target.closest('.gm-term');
        if (t && !lock) { sel = +t.dataset.i; render(); }
      });
      fb.addEventListener('click', (e) => { if (e.target.closest('.gm-yes') && !lock) { touched = true; render(); } });
      g.stage.querySelector('.gm-skip').onclick = () => {
        if (lock) return;
        skipped++; lock = true; g.miss();
        const r = rx[ri];
        if (r.c && r.c.length === co.length) { co = r.c.slice(); }
        render();
        const r2 = rx[ri];
        fb.innerHTML = '<div class="gm-note">Solución: <b>' + all().map((f, i) => (i === r2.r.length ? ' → ' : i ? ' + ' : '') + (co[i] > 1 ? co[i] + ' ' : '') + fH(f)).join('') + '</b></div>';
        g.after(1800, () => { eqBox.classList.add('out'); g.after(350, load); });
      };
      g.key((e) => {
        if (lock) return;
        if (e.key === 'ArrowLeft') { e.preventDefault(); sel = (sel + co.length - 1) % co.length; render(); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); sel = (sel + 1) % co.length; render(); }
        else if (e.key === 'ArrowUp' || e.key === '+') { e.preventDefault(); change(sel, 1); }
        else if (e.key === 'ArrowDown' || e.key === '-') { e.preventDefault(); change(sel, -1); }
        else if (/^[1-9]$/.test(e.key)) { e.preventDefault(); setC(sel, +e.key); }
      });
      g.clock(TIME, () => done('¡Se acabó el tiempo!'));
      if (!N) { eq.textContent = 'No hay ecuaciones en este reto.'; return; }
      load();
    },
  });
}
