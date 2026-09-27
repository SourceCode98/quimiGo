// Controla el reactor.
//  mode 'gas': mantén la presión de un gas (PV = nRT) en la franja verde moviendo T y V mientras el ambiente cambia.
//  mode 'equilibrium': N₂ + 3H₂ ⇌ 2NH₃ (exotérmica). Usa presión, temperatura y retiro de producto para superar la meta.
// spec: { mode:'gas'|'equilibrium', time:60 }
import { canvasStage, reduce, fmt, EL } from '../widgets.js';
import { makeGame, clamp, pick } from './common.js';

const R = 0.082;
const lerp = (a, b, k) => a + (b - a) * k;
const tempColor = (f) => { // 0 frío (azul) → 1 caliente (rojo)
  f = clamp(f, 0, 1);
  const c = [[80, 160, 255], [120, 220, 170], [255, 200, 80], [255, 90, 70]];
  const i = Math.min(2, Math.floor(f * 3)), k = f * 3 - i;
  return 'rgb(' + c[i].map((v, j) => Math.round(lerp(v, c[i + 1][j], k))).join(',') + ')';
};
function slider(id, label, min, max, step, val, unit, cls) {
  return '<label class="gm-sl ' + (cls || '') + '" for="' + id + '"><span class="gm-slh"><b>' + label + '</b><output id="' + id + 'v">' + val + ' ' + unit + '</output></span>' +
    '<input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"></label>';
}

export default function reactor(el, spec, finish) {
  return spec.mode === 'equilibrium' ? equilibrium(el, spec, finish) : gas(el, spec, finish);
}

/* ================= gas ideal ================= */
function gas(el, spec, finish) {
  const TIME = spec.time || 60;
  const LO = 1.6, HI = 2.2, PMAX = 4, n = 0.2;
  return makeGame(el, spec, finish, {
    key: 'reactor', name: 'Controla el reactor', icon: '◎', time: 'down',
    how: 'Mantén la presión del gas en la franja verde. El ambiente cambiará la temperatura y el volumen: ¡compénsalo con los controles!',
    rules: ['PV = nRT', TIME + ' segundos', 'Puntaje = segundos en la franja'],
    stars: (r) => { const f = r.inBand / TIME; return f >= 0.85 ? 3 : f >= 0.7 ? 2 : f >= 0.5 ? 1 : 0; },
    lines: (r) => [['En la franja', Math.round(r.inBand) + ' de ' + TIME + ' s'], ['Cambios superados', String(r.events)]],
    play(g) {
      const id = 'gmr' + Math.random().toString(36).slice(2, 7);
      g.stage.innerHTML = '<div class="gm-rstage"></div>' +
        '<div class="gm-rstat" aria-live="polite"></div>' +
        '<div class="gm-ctrls">' + slider(id + 't', 'Temperatura', 150, 600, 5, 300, 'K', 'temp') + slider(id + 'v', 'Volumen', 1, 5, 0.05, 2.6, 'L') + '</div>' +
        '<p class="gm-keys">Teclas <kbd>↑</kbd> <kbd>↓</kbd> temperatura · <kbd>←</kbd> <kbd>→</kbd> volumen</p>';
      const cs = canvasStage(g.stage.querySelector('.gm-rstage'), 300);
      cs.st.classList.add('gm-rcanvas');
      g.cleanups.push(() => cs.off());
      const ctx = cs.ctx;
      const tIn = g.stage.querySelector('#' + id + 't'), vIn = g.stage.querySelector('#' + id + 'v');
      const tOut = g.stage.querySelector('#' + id + 'tv'), vOut = g.stage.querySelector('#' + id + 'vv');
      const stat = g.stage.querySelector('.gm-rstat');
      let T = 300, V = 2.6, pShow = 0, inBand = 0, events = 0, evT = 3.5, drift = 0, flash = 0, wasIn = true;
      const moves = []; // cambios animados {k:'T'|'V', from, to, t}
      const P = () => (n * R * T) / V;
      const parts = Array.from({ length: 42 }, () => ({ x: Math.random(), y: Math.random(), a: Math.random() * 6.28, s: 0.6 + Math.random() * 0.8 }));
      const hits = [];
      function syncInputs() {
        tIn.value = Math.round(T); vIn.value = V.toFixed(2);
        tOut.textContent = Math.round(T) + ' K'; vOut.textContent = fmt(V, 1) + ' L';
      }
      tIn.addEventListener('input', () => { T = +tIn.value; moves.length = 0; syncInputs(); });
      vIn.addEventListener('input', () => { V = +vIn.value; moves.length = 0; syncInputs(); });
      g.key((e) => {
        if (e.target === tIn || e.target === vIn) return; // el deslizador ya maneja sus flechas
        const d = { ArrowUp: ['T', 10], ArrowDown: ['T', -10], ArrowRight: ['V', 0.1], ArrowLeft: ['V', -0.1] }[e.key];
        if (!d) return;
        e.preventDefault();
        if (d[0] === 'T') T = clamp(T + d[1], 150, 600); else V = clamp(V + d[1], 1, 5);
        moves.length = 0;
        syncInputs();
      });
      const EVENTS = [
        ['T', 1, '¡Ola de calor! La temperatura sube'], ['T', -1, '¡Frente frío! La temperatura baja'],
        ['V', 1, 'El émbolo se aflojó: el volumen aumenta'], ['V', -1, '¡Alguien comprimió el cilindro! El volumen baja'],
      ];
      let toastT = null;
      function toast(t) {
        let d = g.stage.querySelector('.gm-rstage .gm-toast');
        if (!d) { d = document.createElement('div'); d.className = 'gm-toast warn'; cs.st.appendChild(d); }
        d.textContent = t; d.classList.add('show');
        if (toastT) g.cancel(toastT);
        toastT = g.after(2200, () => d.classList.remove('show'));
      }
      function event() {
        const e = pick(EVENTS);
        let dir = e[1];
        // evita salirse del rango: invierte si hace falta
        if (e[0] === 'T' && ((dir > 0 && T > 480) || (dir < 0 && T < 230))) dir = -dir;
        if (e[0] === 'V' && ((dir > 0 && V > 4) || (dir < 0 && V < 1.8))) dir = -dir;
        const txt = EVENTS.find((x) => x[0] === e[0] && x[1] === dir)[2];
        const amt = e[0] === 'T' ? dir * (70 + Math.random() * 70) : dir * (0.7 + Math.random() * 0.7);
        const from = e[0] === 'T' ? T : V;
        const to = e[0] === 'T' ? clamp(T + amt, 150, 600) : clamp(V + amt, 1, 5);
        moves.push({ k: e[0], from, to, t: 0 });
        events++;
        toast(txt);
        g.say(txt);
        drift = (Math.random() - 0.5) * 6; // deriva lenta de la temperatura
      }
      syncInputs();
      pShow = P();
      g.frame((dt) => {
        if (!g.running) { draw(dt); return; }
        // cambios del ambiente
        evT -= dt;
        if (evT <= 0) { event(); evT = 4.5 + Math.random() * 3; }
        moves.forEach((m) => {
          m.t = Math.min(1, m.t + dt / (reduce ? 0.01 : 1.1));
          const v = lerp(m.from, m.to, 1 - Math.pow(1 - m.t, 3));
          if (m.k === 'T') T = v; else V = v;
        });
        for (let i = moves.length - 1; i >= 0; i--) if (moves[i].t >= 1) moves.splice(i, 1);
        T = clamp(T + drift * dt, 150, 600);
        syncInputs();
        const p = P();
        const ok = p >= LO && p <= HI;
        if (ok) inBand += dt;
        if (ok !== wasIn) { wasIn = ok; if (ok) g.good(stat); else g.bad(stat); }
        g.setScore(Math.floor(inBand));
        stat.className = 'gm-rstat ' + (ok ? 'in' : 'out');
        stat.innerHTML = ok ? '<b>✓ En la franja</b> <span>¡Sigue así!</span>'
          : p > HI ? '<b>Presión muy alta</b> <span>Baja la temperatura o aumenta el volumen</span>'
            : '<b>Presión muy baja</b> <span>Sube la temperatura o reduce el volumen</span>';
        g.info('<span><b>' + Math.floor(inBand) + ' s</b> en la franja</span>');
        draw(dt);
      });

      function draw(dt) {
        const W = cs.W, H = cs.H;
        if (!W) return;
        ctx.clearRect(0, 0, W, H);
        const p = P();
        pShow = lerp(pShow, p, Math.min(1, dt * 8));
        // cilindro
        const cw = Math.min(W * (W < 520 ? 0.36 : 0.42), 250), cx = Math.max(16, W * 0.1), top = 30, ch = H - 60;
        const gh = ch * (V / 5.2), gy = top + ch - gh;
        ctx.fillStyle = 'rgba(255,255,255,.04)';
        ctx.fillRect(cx, top, cw, ch);
        const grd = ctx.createLinearGradient(0, gy, 0, top + ch);
        grd.addColorStop(0, 'rgba(127,178,234,.10)'); grd.addColorStop(1, 'rgba(127,178,234,.22)');
        ctx.fillStyle = grd;
        ctx.fillRect(cx, gy, cw, gh);
        ctx.strokeStyle = '#9AA8B3'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(cx, top - 6); ctx.lineTo(cx, top + ch); ctx.lineTo(cx + cw, top + ch); ctx.lineTo(cx + cw, top - 6); ctx.stroke();
        // émbolo
        ctx.fillStyle = '#B8C4CE';
        ctx.fillRect(cx + 3, gy - 14, cw - 6, 14);
        ctx.fillRect(cx + cw / 2 - 6, 0, 12, Math.max(0, gy - 14));
        ctx.fillStyle = '#8795A1'; ctx.fillRect(cx + 3, gy - 3, cw - 6, 3);
        // partículas
        const sp = Math.sqrt(T / 300) * (reduce ? 0 : 1);
        const col = tempColor((T - 150) / 450);
        ctx.fillStyle = col;
        parts.forEach((q) => {
          q.x += Math.cos(q.a) * sp * q.s * dt * 1.6;
          q.y += Math.sin(q.a) * sp * q.s * dt * 1.6 * (cw / Math.max(40, gh));
          if (q.x < 0 || q.x > 1) { q.a = Math.PI - q.a; q.x = clamp(q.x, 0, 1); hits.push({ x: cx + 3 + Math.round(q.x) * (cw - 6), y: gy + 6 + q.y * (gh - 12), t: 0.2 }); }
          if (q.y < 0 || q.y > 1) { q.a = -q.a; q.y = clamp(q.y, 0, 1); hits.push({ x: cx + 6 + q.x * (cw - 12), y: q.y > 0.5 ? gy + gh - 1 : gy + 1, t: 0.2 }); }
          ctx.beginPath(); ctx.arc(cx + 6 + q.x * (cw - 12), gy + 6 + q.y * (gh - 12), 5, 0, 6.283); ctx.fill();
        });
        ctx.strokeStyle = 'rgba(255,240,180,.8)'; ctx.lineWidth = 1.5;
        for (let i = hits.length - 1; i >= 0; i--) {
          const h = hits[i]; h.t -= dt;
          if (h.t <= 0 || hits.length > 60) { hits.splice(i, 1); continue; }
          ctx.globalAlpha = h.t * 4; ctx.beginPath(); ctx.arc(h.x, h.y, 10 - h.t * 30, 0, 6.283); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#E6ECF1'; ctx.font = '600 13px "IBM Plex Sans",sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('n = 0,2 mol', cx + cw / 2, top + ch + 20);
        // manómetro
        const r = Math.min((W - (cx + cw)) * 0.36, H * 0.42, 150), gx = cx + cw + (W - cx - cw) / 2, gyy = H * 0.6;
        const ang = (v) => Math.PI + (clamp(v, 0, PMAX) / PMAX) * Math.PI;
        ctx.lineCap = 'butt';
        ctx.lineWidth = r * 0.2;
        ctx.strokeStyle = 'rgba(255,255,255,.12)';
        ctx.beginPath(); ctx.arc(gx, gyy, r, Math.PI, 2 * Math.PI); ctx.stroke();
        ctx.strokeStyle = '#3FB27F';
        ctx.beginPath(); ctx.arc(gx, gyy, r, ang(LO), ang(HI)); ctx.stroke();
        ctx.strokeStyle = 'rgba(240,120,110,.55)';
        ctx.beginPath(); ctx.arc(gx, gyy, r, ang(3.2), ang(PMAX)); ctx.stroke();
        ctx.fillStyle = '#9AA8B3'; ctx.font = '500 11px "IBM Plex Mono",monospace';
        for (let v = 0; v <= PMAX; v++) { const a = ang(v); ctx.fillText(String(v), gx + Math.cos(a) * (r + r * 0.2), gyy + Math.sin(a) * (r + r * 0.2) + 4); }
        const a = ang(pShow);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(gx, gyy); ctx.lineTo(gx + Math.cos(a) * r * 0.95, gyy + Math.sin(a) * r * 0.95); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(gx, gyy, 7, 0, 6.283); ctx.fill();
        const ok = p >= LO && p <= HI;
        ctx.fillStyle = ok ? '#6FD19A' : '#F19B93';
        ctx.font = '800 ' + Math.round(clamp(r * 0.3, 18, 34)) + 'px "Bricolage Grotesque",sans-serif';
        ctx.fillText(fmt(p, 2) + ' atm', gx, gyy + r * 0.42 + 8);
        ctx.fillStyle = '#9AA8B3'; ctx.font = '600 12px "IBM Plex Sans",sans-serif';
        ctx.fillText('Presión', gx, gyy + r * 0.42 + 28);
      }
      g.clock(TIME, () => g.end({ reason: '¡Terminó el turno!', inBand, events, score: Math.floor(inBand), detail: { secondsInBand: Math.round(inBand), events } }));
    },
  });
}

/* ================= equilibrio de Haber ================= */
function equilibrium(el, spec, finish) {
  const TIME = spec.time || 60;
  const META = spec.goal || Math.round((10 * TIME) / 60);
  const xeq = (P, T) => 1 / (1 + Math.exp((T - (330 + 0.75 * P)) / 55));
  const kr = (T) => 0.03 * Math.exp((T - 300) / 85);
  const COOL = 2.5;
  return makeGame(el, spec, finish, {
    key: 'reactor', name: 'Controla el reactor', icon: '◎', time: 'down',
    how: 'Produce amoníaco: N₂ + 3H₂ ⇌ 2NH₃ (libera calor). Ajusta presión y temperatura y retira el NH₃ para superar la meta.',
    rules: ['Meta: ' + META + ' t de NH₃', TIME + ' segundos', 'Principio de Le Châtelier'],
    stars: (r) => (r.prod >= META * 1.3 ? 3 : r.prod >= META ? 2 : r.prod >= META * 0.5 ? 1 : 0),
    lines: (r) => [['Producción', fmt(r.prod, 1) + ' t'], ['Meta', META + ' t'], ['Retiros', String(r.pulls)]],
    play(g) {
      const id = 'gmq' + Math.random().toString(36).slice(2, 7);
      g.stage.innerHTML = '<div class="gm-rstage"></div>' +
        '<div class="gm-eqrow"><div class="gm-cbars"></div><div class="gm-eqread"></div></div>' +
        '<div class="gm-ctrls">' + slider(id + 'p', 'Presión', 50, 300, 5, 100, 'atm') + slider(id + 't', 'Temperatura', 300, 700, 5, 400, '°C', 'temp') + '</div>' +
        '<div class="gm-pullw"><button type="button" class="gm-btn gm-pull"><i></i><span>Retirar NH₃</span></button><div class="gm-wear" hidden><span>Desgaste del reactor</span><div><i></i></div></div></div>' +
        '<p class="gm-keys">Tecla <kbd>Espacio</kbd> retira el NH₃ · <kbd>↑</kbd> <kbd>↓</kbd> temperatura · <kbd>←</kbd> <kbd>→</kbd> presión</p>';
      const cs = canvasStage(g.stage.querySelector('.gm-rstage'), 280);
      cs.st.classList.add('gm-rcanvas');
      g.cleanups.push(() => cs.off());
      const ctx = cs.ctx;
      const pIn = g.stage.querySelector('#' + id + 'p'), tIn = g.stage.querySelector('#' + id + 't');
      const pOut = g.stage.querySelector('#' + id + 'pv'), tOut = g.stage.querySelector('#' + id + 'tv');
      const bars = g.stage.querySelector('.gm-cbars'), read = g.stage.querySelector('.gm-eqread');
      const pull = g.stage.querySelector('.gm-pull'), pullFill = pull.querySelector('i');
      const wearBox = g.stage.querySelector('.gm-wear'), wearFill = wearBox.querySelector('i');
      bars.innerHTML = [['N₂', EL.N.css], ['H₂', '#A9B8C4'], ['NH₃', '#E7B460']].map((b) => '<div class="gm-cb2"><span>' + b[0] + '</span><div><i style="background:' + b[1] + '"></i></div><b></b></div>').join('');
      const barEls = [...bars.querySelectorAll('.gm-cb2')];
      let P = 100, T = 400, x = 0, prod = 0, cool = 0, wear = 0, halt = 0, pulls = 0, evT = 9, shown = 0, tank = 0;
      const moves = [];
      // moléculas: u unidades de reacción; N₂ = 8 − u, H₂ = 24 − 3u, NH₃ = 2u
      const mols = [];
      const add = (type, px, py) => mols.push({ type, x: px === undefined ? Math.random() : px, y: py === undefined ? Math.random() : py, a: Math.random() * 6.28, r: Math.random() * 6.28, life: 0, out: 0 });
      for (let i = 0; i < 8; i++) add('N2');
      for (let i = 0; i < 24; i++) add('H2');
      const cnt = (t) => mols.filter((m) => m.type === t && !m.out).length;
      function sync() { pIn.value = Math.round(P); tIn.value = Math.round(T); pOut.textContent = Math.round(P) + ' atm'; tOut.textContent = Math.round(T) + ' °C'; }
      pIn.addEventListener('input', () => { P = +pIn.value; sync(); });
      tIn.addEventListener('input', () => { T = +tIn.value; moves.length = 0; sync(); });
      function doPull() {
        if (cool > 0 || halt > 0 || !g.running) return;
        const got = 2 * x;
        if (got < 0.01) { g.pop('Aún no hay NH₃', g.at(pull), 'no'); return; }
        prod += got; pulls++;
        x = 0; cool = COOL;
        mols.forEach((m) => { if (m.type === 'NH3' && !m.out) m.out = 1; });
        g.good(pull);
        g.pop('+' + fmt(got, 1) + ' t', g.at(pull, 0.5, 0), 'ok');
        g.say('Retiraste ' + fmt(got, 1) + ' toneladas de amoníaco');
        if (prod >= META && prod - got < META) { g.confetti(40); g.pop('¡Meta cumplida!', g.at(cs.st, 0.5, 0.35), 'combo'); }
      }
      pull.addEventListener('click', doPull);
      g.key((e) => {
        if (e.key === ' ' || e.key === 'r' || e.key === 'R' || (e.key === 'Enter' && e.target === g.stage)) { e.preventDefault(); doPull(); return; }
        if (e.target === pIn || e.target === tIn) return;
        const d = { ArrowUp: ['T', 10], ArrowDown: ['T', -10], ArrowRight: ['P', 10], ArrowLeft: ['P', -10] }[e.key];
        if (!d) return;
        e.preventDefault();
        if (d[0] === 'T') { T = clamp(T + d[1], 300, 700); moves.length = 0; } else P = clamp(P + d[1], 50, 300);
        sync();
      });
      let toastT = null;
      function toast(t, kind) {
        let d = cs.st.querySelector('.gm-toast');
        if (!d) { d = document.createElement('div'); d.className = 'gm-toast'; cs.st.appendChild(d); }
        d.className = 'gm-toast show ' + (kind || 'warn'); d.textContent = t;
        if (toastT) g.cancel(toastT);
        toastT = g.after(2400, () => d.classList.remove('show'));
      }
      sync();
      g.frame((dt) => {
        if (g.running) step(dt);
        draw(dt);
      });
      function step(dt) {
        // eventos
        evT -= dt;
        if (evT <= 0) {
          evT = 10 + Math.random() * 6;
          if (T < 600 && Math.random() < 0.6) { moves.push({ from: T, to: Math.min(700, T + 90), t: 0 }); toast('Falla en la refrigeración: la temperatura sube'); }
          else { const to = Math.max(50, P - 70); P = to; sync(); toast('Fuga de gas: la presión baja'); }
        }
        moves.forEach((m) => { m.t = Math.min(1, m.t + dt / 1.2); T = lerp(m.from, m.to, 1 - Math.pow(1 - m.t, 3)); });
        for (let i = moves.length - 1; i >= 0; i--) if (moves[i].t >= 1) moves.splice(i, 1);
        if (moves.length) sync();
        // desgaste por presión excesiva
        if (P > 250) wear += ((P - 250) / 50) * 0.07 * dt; else wear = Math.max(0, wear - 0.04 * dt);
        if (wear >= 1 && halt <= 0) { halt = 4; wear = 0.35; P = 150; sync(); toast('¡Parada de emergencia! Demasiada presión'); g.bad(cs.st); }
        wearBox.hidden = wear <= 0.01 && P <= 250;
        wearFill.style.transform = 'scaleX(' + clamp(wear, 0, 1).toFixed(3) + ')';
        if (halt > 0) halt -= dt;
        else {
          const xe = xeq(P, T);
          x += kr(T) * (xe - x) * dt;
          x = clamp(x, 0, 1);
        }
        cool = Math.max(0, cool - dt);
        pull.disabled = cool > 0 || halt > 0;
        pullFill.style.transform = 'scaleX(' + (cool > 0 ? (1 - cool / COOL).toFixed(3) : 1) + ')';
        pull.classList.toggle('ready', cool <= 0 && halt <= 0 && x > 0.05);
        // moléculas acordes a x
        const u = Math.round(x * 8);
        let guard = 8;
        while (cnt('NH3') < 2 * u && cnt('N2') > 0 && cnt('H2') >= 3 && guard--) {
          const n2 = mols.find((m) => m.type === 'N2' && !m.out);
          const px = n2.x, py = n2.y;
          mols.splice(mols.indexOf(n2), 1);
          for (let k = 0; k < 3; k++) { const h = mols.find((m) => m.type === 'H2' && !m.out); mols.splice(mols.indexOf(h), 1); }
          add('NH3', px, py); add('NH3', clamp(px + 0.05, 0, 1), py);
        }
        guard = 8;
        while (cnt('NH3') > 2 * u + 1 && guard--) {
          for (let k = 0; k < 2; k++) { const a = mols.find((m) => m.type === 'NH3' && !m.out); mols.splice(mols.indexOf(a), 1); }
          add('N2'); for (let k = 0; k < 3; k++) add('H2');
        }
        // al retirar, el reactor se recarga con N₂ y H₂ frescos
        const missing = 8 - cnt('N2') - cnt('NH3') / 2;
        for (let k = 0; k < Math.floor(missing + 0.01); k++) { add('N2', 0, Math.random()); for (let j = 0; j < 3; j++) add('H2', 0, Math.random()); }
        // lecturas
        const N2 = 1 - x, H2 = 3 * (1 - x), NH3 = 2 * x;
        [N2, H2, NH3].forEach((v, i) => {
          barEls[i].querySelector('i').style.transform = 'scaleX(' + (v / 3).toFixed(3) + ')';
          barEls[i].querySelector('b').textContent = fmt(v, 2);
        });
        const xe = xeq(P, T), k = kr(T);
        const rate = k < 0.12 ? 'lenta' : k < 0.45 ? 'media' : 'rápida';
        read.innerHTML = '<div><span>Rendimiento en equilibrio</span><b>' + Math.round(xe * 100) + ' %</b></div>' +
          '<div><span>Velocidad</span><b class="' + (k < 0.12 ? 'lo' : k < 0.45 ? 'mid' : 'hi') + '">' + rate + '</b></div>' +
          '<div><span>Producción</span><b>' + fmt(prod, 1) + ' / ' + META + ' t</b></div>';
        g.setScore(Math.round(prod * 10));
        g.info('<span><b>' + fmt(prod, 1) + ' t</b> de ' + META + ' t</span>');
      }
      function draw(dt) {
        const W = cs.W, H = cs.H;
        if (!W) return;
        ctx.clearRect(0, 0, W, H);
        const tw = Math.min(90, W * 0.2);
        const vx = 16, vy = 34, vw = W - tw - 70, vh = H - 60;
        // recipiente
        ctx.fillStyle = 'rgba(' + Math.round(lerp(60, 200, (T - 300) / 400)) + ',80,60,.13)';
        ctx.strokeStyle = halt > 0 ? '#F19B93' : '#9AA8B3'; ctx.lineWidth = 3;
        roundRect(ctx, vx, vy, vw, vh, 18); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#9AA8B3'; ctx.font = '600 13px "IBM Plex Sans",sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('Reactor · ' + Math.round(P) + ' atm · ' + Math.round(T) + ' °C', vx + 4, vy - 12);
        // tubo y tanque
        const tx = W - tw - 16, ty = vy + 20, th = vh - 20;
        ctx.strokeStyle = '#9AA8B3';
        ctx.beginPath(); ctx.moveTo(vx + vw, vy + vh * 0.5); ctx.lineTo(tx, vy + vh * 0.5); ctx.stroke();
        roundRect(ctx, tx, ty, tw, th, 10); ctx.stroke();
        tank = lerp(tank, prod, Math.min(1, dt * 4));
        const lv = clamp(tank / (META * 1.4), 0, 1);
        ctx.fillStyle = 'rgba(231,180,96,.55)';
        ctx.fillRect(tx + 3, ty + th - 3 - (th - 6) * lv, tw - 6, (th - 6) * lv);
        const my = ty + th - 3 - (th - 6) * (1 / 1.4);
        ctx.strokeStyle = '#6FD19A'; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(tx - 4, my); ctx.lineTo(tx + tw + 4, my); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#6FD19A'; ctx.font = '700 12px "IBM Plex Sans",sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Meta', tx + tw / 2, my - 6);
        ctx.fillStyle = '#E6ECF1'; ctx.font = '600 13px "IBM Plex Sans",sans-serif';
        ctx.fillText('NH₃', tx + tw / 2, ty - 8);
        ctx.font = '800 16px "Bricolage Grotesque",sans-serif';
        ctx.fillText(fmt(prod, 1) + ' t', tx + tw / 2, ty + th + 20);
        // moléculas
        const sp = (reduce || halt > 0 ? 0 : 1) * (0.25 + (T - 300) / 500);
        const pad = 16;
        for (let i = mols.length - 1; i >= 0; i--) {
          const m = mols[i];
          m.life = Math.min(1, m.life + dt * 3);
          let px, py;
          if (m.out) {
            m.out += dt * 1.6;
            const k = Math.min(1, m.out - 1);
            const sx = vx + pad + m.x * (vw - 2 * pad), sy = vy + pad + m.y * (vh - 2 * pad);
            px = lerp(sx, tx + tw / 2, k); py = lerp(sy, vy + vh * 0.5, k * k);
            if (k >= 1) { mols.splice(i, 1); continue; }
          } else {
            m.x += Math.cos(m.a) * sp * dt * 0.5; m.y += Math.sin(m.a) * sp * dt * 0.5 * (vw / vh);
            if (m.x < 0 || m.x > 1) { m.a = Math.PI - m.a; m.x = clamp(m.x, 0, 1); }
            if (m.y < 0 || m.y > 1) { m.a = -m.a; m.y = clamp(m.y, 0, 1); }
            m.r += sp * dt * 2;
            px = vx + pad + m.x * (vw - 2 * pad); py = vy + pad + m.y * (vh - 2 * pad);
          }
          ctx.globalAlpha = m.life;
          molecule(ctx, m.type, px, py, m.r);
        }
        ctx.globalAlpha = 1;
      }
      g.clock(TIME, () => g.end({ reason: prod >= META ? '¡Cumpliste la meta de producción!' : 'Se acabó el turno', prod, pulls, score: Math.round(prod * 10), detail: { production: Math.round(prod * 10) / 10, goal: META, pulls } }));
    },
  });
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function ball(c, x, y, r, col) {
  const g = c.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
  g.addColorStop(0, '#fff'); g.addColorStop(0.35, col); g.addColorStop(1, col);
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill();
}
function molecule(c, type, x, y, rot) {
  const cs = Math.cos(rot), sn = Math.sin(rot);
  const N = EL.N.css, H = EL.H.css;
  if (type === 'N2') { ball(c, x - cs * 5, y - sn * 5, 7, N); ball(c, x + cs * 5, y + sn * 5, 7, N); }
  else if (type === 'H2') { ball(c, x - cs * 3.5, y - sn * 3.5, 4.5, H); ball(c, x + cs * 3.5, y + sn * 3.5, 4.5, H); }
  else {
    c.strokeStyle = 'rgba(255,224,138,.9)'; c.lineWidth = 2;
    c.beginPath(); c.arc(x, y, 13.5, 0, 6.283); c.stroke();
    for (let k = 0; k < 3; k++) { const a = rot + (k * 2 * Math.PI) / 3; ball(c, x + Math.cos(a) * 8, y + Math.sin(a) * 8, 4.5, H); }
    ball(c, x, y, 7.5, N);
  }
}
