// Atrapa partículas: caen partículas y tarjetas; mueve el vaso para atrapar solo las que cumplen la regla.
// spec: { rule:'Atrapa solo los metales', good:['Na','Fe','Cu'], bad:['O','Cl','Ne'], time:45, lives:3 }
//   Si una cadena es un símbolo de EL se dibuja como átomo de su color; si no, como tarjeta ('H2O', 'Jugo de limón').
import { esc, fH, EL } from '../widgets.js';
import { makeGame, clamp } from './common.js';

const FULL = 8; // atrapadas para llenar el vaso (bonificación)
const inkOn = (hex) => { const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255; return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#15202B' : '#FFFFFF'; };
const isFormula = (s) => /^[A-Z][A-Za-z0-9()]*[+-]?$/.test(s) && /\d/.test(s);
const label = (s) => (isFormula(s) ? fH(s) : esc(s));

let uid = 0;
const beakerSVG = (id) =>
  '<svg viewBox="0 0 100 100" aria-hidden="true">' +
  '<defs><clipPath id="' + id + '"><path d="M14 10 L14 86 Q14 93 21 93 L79 93 Q86 93 86 86 L86 10 Z"/></clipPath></defs>' +
  '<g clip-path="url(#' + id + ')"><rect class="gm-ca-liq" x="0" y="0" width="100" height="100"/>' +
  '<circle class="gm-ca-bub" cx="32" cy="84" r="3"/><circle class="gm-ca-bub b2" cx="58" cy="88" r="2.4"/><circle class="gm-ca-bub b3" cx="72" cy="82" r="2"/></g>' +
  '<path class="gm-ca-glass" d="M6 6 Q14 6 14 12 L14 86 Q14 93 21 93 L79 93 Q86 93 86 86 L86 12 Q86 6 94 6"/>' +
  '<path class="gm-ca-marks" d="M72 30 H86 M76 46 H86 M72 62 H86 M76 78 H86"/>' +
  '</svg>';

export default function catcher(el, spec, finish) {
  const good = (spec.good || []).map(String).filter(Boolean);
  const bad = (spec.bad || []).map(String).filter(Boolean);
  const rule = spec.rule || 'Atrapa solo las partículas correctas';
  const TIME = spec.time || 45;
  const LIVES = spec.lives || 3;
  const k = TIME / 45;
  const th = [Math.max(3, Math.round(8 * k)), Math.max(5, Math.round(16 * k)), Math.max(7, Math.round(24 * k))];
  return makeGame(el, spec, finish, {
    key: 'catcher', name: 'Atrapa partículas', icon: '⚗', time: 'down', lives: LIVES,
    how: 'Mueve el vaso para atrapar solo lo que cumple la regla y esquiva lo demás.',
    rules: [esc(rule), TIME + ' segundos', LIVES + ' vidas', 'Arrastra, mueve el mouse o usa ← →'],
    stars: (r) => (r.caught >= th[2] ? 3 : r.caught >= th[1] ? 2 : r.caught >= th[0] ? 1 : 0),
    lines: (r) => [['Atrapadas', String(r.caught)], ['Esquivadas', String(r.dodged)], ['Mejor racha', String(r.bestStreak)]],
    play(g) {
      g.stage.innerHTML =
        '<div class="gm-ca-rule"><span>Regla</span><b>' + esc(rule) + '</b></div>' +
        '<div class="gm-ca-field" role="application" aria-label="Zona de juego. Usa las flechas izquierda y derecha para mover el vaso.">' +
        '<div class="gm-ca-lvl" aria-hidden="true"></div><div class="gm-ca-say" aria-hidden="true"></div>' +
        '<div class="gm-ca-beaker">' + beakerSVG('gm-ca-clip' + ++uid) + '</div>' +
        '<div class="gm-sready">¡Prepárate!</div></div>';
      const field = g.stage.querySelector('.gm-ca-field');
      const beaker = field.querySelector('.gm-ca-beaker');
      const liq = beaker.querySelector('.gm-ca-liq');
      const lvlE = field.querySelector('.gm-ca-lvl');
      const sayE = field.querySelector('.gm-ca-say');
      const ready = field.querySelector('.gm-sready');
      let sayT = null;
      let items = [], started = false, over = false, elapsed = 0, spawnT = 0.2, level = 1;
      let caught = 0, dodged = 0, wrongCaught = 0, escaped = 0, fill = 0;
      let W = field.clientWidth, H = field.clientHeight, bw = beaker.offsetWidth, bh = beaker.offsetHeight;
      let bx = W / 2, tx = W / 2, keyDir = 0;
      const keys = { l: false, r: false };
      const oops = [];
      let bagG = [], bagB = [];
      const draw = () => g.info('<span><b>' + caught + '</b> ' + (caught === 1 ? 'atrapada' : 'atrapadas') + '</span><span>Nivel <b>' + level + '</b></span>');
      draw();
      const drawFill = () => { liq.setAttribute('y', String(93 - (0.12 + 0.88 * (fill / FULL)) * 80)); beaker.style.setProperty('--lv', (fill / FULL).toFixed(3)); };
      drawFill();

      const take = (bag, src) => { if (!bag.length) { bag.push(...src); for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; } } return bag.pop(); };

      function spawn() {
        const pGood = !bad.length ? 1 : !good.length ? 0 : 0.56;
        const isGood = Math.random() < pGood;
        const s = isGood ? take(bagG, good) : take(bagB, bad);
        if (s === undefined) return;
        const e = EL[s];
        const d = document.createElement('div');
        d.className = 'gm-ca-it ' + (e ? 'atom' : 'card');
        if (e) { d.style.cssText = '--c:' + e.css + ';--ci:' + inkOn(e.hex); d.innerHTML = '<b>' + esc(s) + '</b>'; }
        else d.innerHTML = '<span>' + label(s) + '</span>';
        field.insertBefore(d, beaker);
        const w = d.offsetWidth, h = d.offsetHeight;
        // evita que salga justo encima del anterior
        let x = 6 + Math.random() * Math.max(0, W - w - 12);
        const last = items[items.length - 1];
        if (last && Math.abs(last.x - x) < w * 0.6 && last.y < h) x = clamp(x + (x > W / 2 ? -1 : 1) * w * 1.2, 6, Math.max(6, W - w - 6));
        const fallT = Math.max(1.35, 3.5 - elapsed * 0.05);
        const wob = level >= 3 ? (Math.random() < 0.5 ? -1 : 1) * Math.min(1, (level - 2) * 0.35) * (10 + Math.random() * 18) : 0;
        const it = { el: d, s, good: isGood, x, x0: x, y: -h - 4, w, h, v: (H + h) / fallT, st: 'fall', ph: Math.random() * 6, wob };
        place(it);
        items.push(it);
      }
      function place(it) { it.el.style.transform = 'translate3d(' + it.x.toFixed(1) + 'px,' + it.y.toFixed(1) + 'px,0)'; }
      function gone(it, ms) { it.st = 'done'; g.after(ms, () => it.el.remove()); }

      function catchIt(it) {
        const fr = g.at(beaker, 0.5, 0.2);
        if (it.good) {
          caught++;
          const m = g.hit();
          fill++;
          it.el.classList.add('in');
          it.el.style.transform = 'translate3d(' + (bx - it.w / 2).toFixed(1) + 'px,' + (H - bh * 0.7 - it.h / 2).toFixed(1) + 'px,0) scale(.35)';
          gone(it, 260);
          g.good(beaker);
          beaker.classList.remove('hurt');
          g.bump(beaker, 'gm-ca-gulp');
          g.add(100 * m, fr);
          if (fill >= FULL) {
            fill = 0;
            g.after(180, () => { g.add(300, { x: fr.x, y: fr.y - 40 }, '¡Vaso lleno! +300'); g.confetti(26); });
            g.bump(beaker, 'gm-ca-full');
          }
          drawFill();
          draw();
          g.say('Bien: ' + it.s);
        } else {
          wrongCaught++;
          oops.push(it.s);
          g.miss();
          it.el.classList.add('no');
          it.st = 'bounce';
          it.vy = -260; it.vx = (it.x + it.w / 2 < bx ? -1 : 1) * 160;
          g.after(700, () => it.el.remove());
          g.bad(beaker);
          beaker.classList.add('hurt');
          g.after(450, () => beaker.classList.remove('hurt'));
          g.bump(field, 'gm-ca-flash');
          sayE.innerHTML = '✗ <b>' + label(it.s) + '</b> no cumple la regla';
          const sw = sayE.offsetWidth;
          sayE.style.left = clamp(bx, sw / 2 + 6, Math.max(sw / 2 + 6, W - sw / 2 - 6)) + 'px';
          g.bump(sayE, 'on');
          if (sayT) g.cancel(sayT);
          sayT = g.after(1400, () => sayE.classList.remove('on'));
          fill = Math.max(0, fill - 2);
          drawFill();
          g.say(it.s + ' no cumple la regla. Pierdes una vida.');
          if (g.loseLife() <= 0) end('Te quedaste sin vidas');
        }
      }
      function land(it) {
        it.st = 'land';
        it.el.classList.add('floor');
        place(it);
        if (it.good) {
          escaped++;
          g.miss();
          g.pop('¡Se escapó!', { x: clamp(it.x + it.w / 2, 60, W - 60) + g.at(field, 0, 0).x, y: g.at(field, 0, 1).y - 30 }, 'no');
        } else dodged++;
        gone(it, 520);
      }
      function end(reason) {
        if (over) return;
        over = true;
        g.pause();
        g.after(700, () => g.end({
          reason, caught, dodged,
          detail: { caught, dodged, wrong: wrongCaught, escaped, bestStreak: g.bestStreak, lives: g.lives, mistakes: oops.slice(0, 10) },
        }));
      }

      function resize() {
        W = field.clientWidth; H = field.clientHeight; bw = beaker.offsetWidth; bh = beaker.offsetHeight;
        tx = clamp(tx, bw / 2, W - bw / 2); bx = clamp(bx, bw / 2, W - bw / 2);
      }
      let ro = null;
      if (window.ResizeObserver) { ro = new ResizeObserver(resize); ro.observe(field); g.cleanups.push(() => ro.disconnect()); }

      g.frame((dt) => {
        if (!ro) resize();
        // vaso
        if (keys.l || keys.r) { keyDir = (keys.r ? 1 : 0) - (keys.l ? 1 : 0); tx = clamp(tx + keyDir * Math.max(420, W * 1.15) * dt, bw / 2, W - bw / 2); }
        const px = bx;
        bx += (tx - bx) * Math.min(1, dt * 22);
        const tilt = clamp((bx - px) / Math.max(dt, 0.001) / 90, -9, 9);
        beaker.style.transform = 'translate3d(' + (bx - bw / 2).toFixed(1) + 'px,0,0) rotate(' + tilt.toFixed(1) + 'deg)';
        if (!started || over) return;
        elapsed += dt;
        const nl = 1 + Math.floor(elapsed / 9);
        if (nl !== level) { level = nl; draw(); lvlE.textContent = '¡Nivel ' + level + '!'; g.bump(lvlE, 'gm-ca-lvlin'); g.after(1300, () => lvlE.classList.remove('gm-ca-lvlin')); }
        // aparición
        spawnT -= dt;
        if (spawnT <= 0) { spawn(); spawnT = Math.max(0.42, 1.05 - elapsed * 0.016) * (0.8 + Math.random() * 0.4); }
        const mouth = H - bh + bh * 0.12;
        for (let i = 0; i < items.length; i++) {
          const it = items[i];
          if (it.st === 'fall') {
            const pb = it.y + it.h;
            it.y += it.v * dt;
            if (it.wob) { it.ph += dt * 2.6; it.x = clamp(it.x0 + Math.sin(it.ph) * it.wob, 2, W - it.w - 2); }
            const cx = it.x + it.w / 2;
            if (pb < mouth && it.y + it.h >= mouth && Math.abs(cx - bx) < bw * 0.5 + it.w * 0.18) catchIt(it);
            else if (it.y + it.h >= H - 2) { it.y = H - it.h - 2; land(it); }
            if (it.st === 'fall') place(it);
          } else if (it.st === 'bounce') {
            it.vy += 900 * dt; it.y += it.vy * dt; it.x += it.vx * dt;
            place(it);
          }
        }
        items = items.filter((it) => it.st === 'fall' || it.st === 'bounce');
      });

      // controles: arrastrar o mover el mouse en la zona
      let drag = null;
      const fx = (e) => { const r = field.getBoundingClientRect(); return clamp(e.clientX - r.left, bw / 2, W - bw / 2); };
      g.on(field, 'pointerdown', (e) => {
        drag = e.pointerId;
        try { field.setPointerCapture(e.pointerId); } catch (x) { /* ignorar */ }
        tx = fx(e);
      });
      g.on(field, 'pointermove', (e) => { if (drag === e.pointerId || e.pointerType === 'mouse') tx = fx(e); });
      const up = (e) => { if (drag === e.pointerId) drag = null; };
      g.on(field, 'pointerup', up);
      g.on(field, 'pointercancel', up);
      const KL = { ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r' };
      g.key((e) => { const k2 = KL[e.key]; if (k2) { e.preventDefault(); keys[k2] = true; } });
      g.on(document, 'keyup', (e) => { const k2 = KL[e.key]; if (k2) keys[k2] = false; });
      g.on(window, 'blur', () => { keys.l = keys.r = false; });

      g.clock(TIME, () => end('¡Se acabó el tiempo!'));
      g.pause();
      if (!good.length && !bad.length) { ready.textContent = 'No hay partículas en este reto.'; return; }
      g.after(1000, () => { ready.remove(); started = true; g.resume(); });
    },
  });
}
