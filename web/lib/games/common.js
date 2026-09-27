// Piezas compartidas de los minijuegos: pantallas de inicio y final, HUD (puntos, tiempo, vidas),
// racha, estrellas, confeti, ventanas emergentes de puntos y ciclo de vida de cada partida.
import { esc, reduce } from '../widgets.js';

// Bucle de animación; si fn devuelve false, se detiene. Devuelve la función para detenerlo.
export function frames(fn) {
  let id = 0, last = performance.now(), on = true;
  const f = (now) => {
    if (!on) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (fn(dt) === false) { on = false; return; }
    id = requestAnimationFrame(f);
  };
  id = requestAnimationFrame(f);
  return () => { on = false; cancelAnimationFrame(id); };
}

export const nf = (n) => Math.round(n).toLocaleString('es-CO');
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
export const vib = (p) => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* sin vibración */ } };
export const mmss = (s) => { s = Math.max(0, Math.ceil(s)); const m = Math.floor(s / 60); return m + ':' + String(s % 60).padStart(2, '0'); };

const bestKey = (spec, key) => 'ql-best-' + (spec.id || key);
export function getBest(spec, key) {
  try { const v = localStorage.getItem(bestKey(spec, key)); return v === null ? null : +v; } catch (e) { return null; }
}
function setBest(spec, key, v) { try { localStorage.setItem(bestKey(spec, key), String(Math.round(v))); } catch (e) { /* sin almacenamiento */ } }

export function starsHTML(n, cls) {
  let h = '<span class="gm-stars ' + (cls || '') + '" role="img" aria-label="' + n + ' de 3 estrellas">';
  for (let i = 0; i < 3; i++) h += '<i class="' + (i < n ? 'on' : '') + '" style="--i:' + i + '">★</i>';
  return h + '</span>';
}

// Umbrales: si spec.stars = [s1, s2, s3] manda el puntaje; si no, el juego decide.
export function rate(score, th) { let s = 0; th.forEach((t) => { if (score >= t) s++; }); return s; }

const CONF_COLORS = ['var(--accent)', 'var(--gold)', 'var(--ok)', '#E05A8A', '#4FC3C1', '#F0A030'];
const isTyping = (t) => t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

/**
 * makeGame(el, spec, finish, def) → dispose
 * def: { key, name, how, icon, time:'down'|'up'|false, lives:n, stars(res)→0..3, play(g), lines(res)→[[etiqueta, valor]] }
 */
export function makeGame(el, spec, finish, def) {
  spec = spec || {};
  const root = document.createElement('div');
  root.className = 'gm gm-' + def.key;
  root.innerHTML = '<div class="gm-body"></div><div class="gm-fx" aria-hidden="true"></div><div class="gm-live" aria-live="polite"></div>';
  el.innerHTML = '';
  el.appendChild(root);
  const body = root.querySelector('.gm-body');
  const fx = root.querySelector('.gm-fx');
  const live = root.querySelector('.gm-live');
  const mountTimers = new Set();
  let keyH = null; // manejador de teclado de la pantalla actual
  let round = null;
  let disposed = false;

  const later = (ms, fn) => { const t = setTimeout(() => { mountTimers.delete(t); fn(); }, ms); mountTimers.add(t); return t; };
  const onKey = (e) => {
    if (disposed || !keyH || e.altKey || e.ctrlKey || e.metaKey) return;
    if (isTyping(e.target) && e.target.type !== 'range') return;
    const other = e.target.closest && e.target.closest('.gm');
    if (other && other !== root) return;
    if (!root.isConnected || !root.offsetParent) return;
    keyH(e);
  };
  document.addEventListener('keydown', onKey);

  function confetti(n) {
    if (reduce || disposed) return;
    n = n || 46;
    const r = root.getBoundingClientRect();
    const frag = document.createDocumentFragment();
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i');
      p.className = 'gm-conf';
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const v = 160 + Math.random() * Math.min(420, r.height * 0.9);
      p.style.cssText = '--x:' + (r.width * (0.3 + Math.random() * 0.4)).toFixed(0) + 'px;--dx:' + (Math.cos(a) * v).toFixed(0) + 'px;--dy:' + (Math.sin(a) * v).toFixed(0) +
        'px;--r:' + ((Math.random() - 0.5) * 900).toFixed(0) + 'deg;--d:' + (0.9 + Math.random() * 0.7).toFixed(2) + 's;background:' + CONF_COLORS[i % CONF_COLORS.length] +
        ';' + (i % 3 === 0 ? 'border-radius:50%;' : '');
      frag.appendChild(p);
    }
    const box = document.createElement('div');
    box.className = 'gm-confbox';
    box.appendChild(frag);
    fx.appendChild(box);
    later(1900, () => box.remove());
  }

  // ventana emergente de puntos ("+200") sobre un elemento o punto
  function pop(text, at, kind) {
    if (disposed) return;
    const r = root.getBoundingClientRect();
    let x = r.width / 2, y = r.height / 2;
    if (at && at.getBoundingClientRect) { const b = at.getBoundingClientRect(); x = b.left + b.width / 2 - r.left; y = b.top + b.height / 2 - r.top; }
    else if (at && typeof at.x === 'number') { x = at.x; y = at.y; }
    const p = document.createElement('div');
    p.className = 'gm-pop ' + (kind || 'ok');
    p.textContent = text;
    p.style.left = clamp(x, 40, r.width - 40) + 'px';
    p.style.top = clamp(y, 24, r.height - 10) + 'px';
    fx.appendChild(p);
    later(reduce ? 700 : 1000, () => p.remove());
  }

  function bump(node, cls) {
    if (!node) return;
    node.classList.remove(cls);
    void node.offsetWidth; // reinicia la animación
    node.classList.add(cls);
  }

  /* ---------- pantalla de inicio ---------- */
  function startScreen() {
    const best = getBest(spec, def.key);
    body.innerHTML =
      '<div class="gm-screen gm-start">' +
      '<div class="gm-badge" aria-hidden="true">' + esc(def.icon || '★') + '</div>' +
      '<p class="gm-kicker">' + esc(def.name) + '</p>' +
      '<h2 class="gm-title">' + esc(spec.title || def.name) + '</h2>' +
      '<p class="gm-how">' + def.how + '</p>' +
      (def.rules ? '<ul class="gm-rules">' + def.rules.map((r) => '<li>' + r + '</li>').join('') + '</ul>' : '') +
      '<button class="gm-btn gm-go" type="button">Jugar</button>' +
      '<p class="gm-best">' + (best !== null ? 'Tu récord: <b>' + nf(best) + '</b>' : 'Aún no tienes récord en este reto') + '</p>' +
      '<p class="gm-keys">Tecla <kbd>Enter</kbd> para empezar</p>' +
      '</div>';
    const go = body.querySelector('.gm-go');
    go.onclick = startRound;
    keyH = (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.tagName !== 'BUTTON') { e.preventDefault(); startRound(); } };
  }

  /* ---------- partida ---------- */
  function startRound() {
    if (disposed) return;
    if (round) round.kill();
    const g = newRound();
    round = g;
    keyH = (e) => { if (g.keyFn) g.keyFn(e); };
    const cl = def.play(g);
    if (typeof cl === 'function') g.cleanups.push(cl);
    g.stage.focus({ preventScroll: true });
  }

  function newRound() {
    const timers = new Set(), intervals = new Set(), stops = [], offs = [];
    body.innerHTML =
      '<div class="gm-playwrap">' +
      '<div class="gm-hud">' +
      '<div class="gm-hs gm-score"><span>Puntos</span><b>0</b><em class="gm-combo" hidden></em></div>' +
      '<div class="gm-hs gm-info"></div>' +
      '<div class="gm-hs gm-lives"' + (def.lives ? '' : ' hidden') + ' aria-label="Vidas"></div>' +
      '<div class="gm-hs gm-time"' + (def.time ? '' : ' hidden') + '><span>' + (def.time === 'up' ? 'Tiempo' : 'Quedan') + '</span><b>0:00</b></div>' +
      '<div class="gm-tbar"' + (def.time === 'down' ? '' : ' hidden') + '><i></i></div>' +
      '</div>' +
      '<div class="gm-stage-wrap" tabindex="-1"></div>' +
      '</div>';
    const hud = body.querySelector('.gm-hud');
    const scoreB = hud.querySelector('.gm-score b');
    const comboE = hud.querySelector('.gm-combo');
    const infoE = hud.querySelector('.gm-info');
    const livesE = hud.querySelector('.gm-lives');
    const timeB = hud.querySelector('.gm-time b');
    const timeE = hud.querySelector('.gm-time');
    const tbar = hud.querySelector('.gm-tbar i');
    const stage = body.querySelector('.gm-stage-wrap');

    const g = {
      spec, root, stage, hud, alive: true, score: 0, streak: 0, bestStreak: 0, mult: 1, lives: def.lives || 0,
      cleanups: [], keyFn: null, t: 0, total: 0, running: false, stats: {},
      after(ms, fn) { const t = setTimeout(() => { timers.delete(t); if (g.alive) fn(); }, ms); timers.add(t); return t; },
      cancel(t) { clearTimeout(t); timers.delete(t); },
      every(ms, fn) { const t = setInterval(() => { if (g.alive) fn(); }, ms); intervals.add(t); return t; },
      frame(fn) { const s = frames(fn); stops.push(s); return s; },
      on(t, ev, fn, o) { t.addEventListener(ev, fn, o); offs.push(() => t.removeEventListener(ev, fn, o)); },
      key(fn) { g.keyFn = fn; },
      pop, confetti, bump, say(t) { live.textContent = t; },
      // punto relativo al juego dentro de un elemento (fx, fy de 0 a 1)
      at(node, fx, fy) { const r = root.getBoundingClientRect(), b = node.getBoundingClientRect(); return { x: b.left - r.left + b.width * (fx === undefined ? 0.5 : fx), y: b.top - r.top + b.height * (fy === undefined ? 0.5 : fy) }; },
      info(html) { infoE.innerHTML = html; },
      add(pts, at, label) {
        pts = Math.round(pts);
        g.score = Math.max(0, g.score + pts);
        scoreB.textContent = nf(g.score);
        bump(scoreB, 'gm-bump');
        if (pts !== 0 || label) pop(label || ((pts > 0 ? '+' : '') + nf(pts)), at, pts < 0 ? 'no' : g.mult > 1 ? 'combo' : 'ok');
      },
      setScore(v) { g.score = Math.max(0, Math.round(v)); scoreB.textContent = nf(g.score); },
      // racha: ×2 con 3 seguidas, ×3 con 6
      hit() {
        g.streak++; g.bestStreak = Math.max(g.bestStreak, g.streak);
        const m = g.streak >= 6 ? 3 : g.streak >= 3 ? 2 : 1;
        if (m !== g.mult) { g.mult = m; if (m > 1) { pop('¡Racha ×' + m + '!', { x: root.clientWidth / 2, y: 80 }, 'combo'); g.say('Racha por ' + m); } }
        g.mult = m;
        comboE.hidden = g.streak < 2;
        comboE.textContent = m > 1 ? '×' + m : g.streak + ' seguidas';
        comboE.className = 'gm-combo' + (m > 1 ? ' m' + m : '');
        bump(comboE, 'gm-bump');
        return m;
      },
      miss() { g.streak = 0; g.mult = 1; comboE.hidden = true; },
      loseLife() {
        if (!def.lives) return 0;
        g.lives = Math.max(0, g.lives - 1);
        drawLives(true);
        bump(hud, 'gm-hurt');
        return g.lives;
      },
      good(node) { vib(25); if (node) bump(node, 'gm-good'); },
      bad(node) { vib([60, 40, 60]); if (node) bump(node, 'gm-shake'); },
      // reloj: 'down' cuenta hacia atrás desde sec y llama onZero; 'up' cuenta hacia arriba
      clock(sec, onZero) {
        g.total = sec || 0; g.t = def.time === 'down' ? g.total : 0; g.running = true;
        drawTime();
        g.frame((dt) => {
          if (!g.running || !g.alive) return;
          if (def.time === 'down') { g.t -= dt; if (g.t <= 0) { g.t = 0; g.running = false; drawTime(); onZero && onZero(); return; } }
          else g.t += dt;
          drawTime();
        });
      },
      pause() { g.running = false; },
      resume() { if (g.alive) g.running = true; },
      addTime(s) { g.t = Math.min(g.total, g.t + s); drawTime(); },
      end(res) {
        if (!g.alive) return;
        res = res || {};
        g.kill();
        endScreen(Object.assign({ score: g.score, bestStreak: g.bestStreak }, res));
      },
      kill() {
        if (!g.alive) return;
        g.alive = false; g.running = false;
        timers.forEach(clearTimeout); intervals.forEach(clearInterval); stops.forEach((s) => s()); offs.forEach((f) => f());
        g.cleanups.forEach((f) => { try { f(); } catch (e) { /* ignorar */ } });
        g.keyFn = null;
      },
    };
    let lastSec = -1;
    function drawTime() {
      const s = def.time === 'down' ? Math.ceil(g.t) : Math.floor(g.t);
      if (s !== lastSec) { timeB.textContent = mmss(s); lastSec = s; }
      if (def.time === 'down') {
        const f = g.total ? g.t / g.total : 0;
        tbar.style.transform = 'scaleX(' + f.toFixed(4) + ')';
        timeE.classList.toggle('low', g.t <= 10 && g.t > 0);
        tbar.parentNode.classList.toggle('low', g.t <= 10);
      }
    }
    function drawLives(hurt) {
      let h = '';
      for (let i = 0; i < def.lives; i++) h += '<i class="' + (i < g.lives ? 'on' : 'off') + (hurt && i === g.lives ? ' lost' : '') + '">♥</i>';
      livesE.innerHTML = h;
      livesE.setAttribute('aria-label', 'Vidas: ' + g.lives);
    }
    if (def.lives) drawLives(false);
    return g;
  }

  /* ---------- pantalla final ---------- */
  function endScreen(res) {
    const score = Math.max(0, Math.round(res.score || 0));
    let stars = Array.isArray(spec.stars) && spec.stars.length === 3 ? rate(score, spec.stars) : def.stars(res);
    stars = clamp(Math.round(stars) || 0, 0, 3);
    const prev = getBest(spec, def.key);
    const record = score > 0 && (prev === null || score > prev);
    if (record) setBest(spec, def.key, score);
    const best = record ? score : prev;
    const msg = res.title || (stars === 3 ? '¡Excelente!' : stars === 2 ? '¡Muy bien!' : stars === 1 ? 'Buen intento' : 'Sigue practicando');
    const lines = (def.lines ? def.lines(res) : []).filter(Boolean);
    body.innerHTML =
      '<div class="gm-screen gm-end s' + stars + '">' +
      (res.reason ? '<p class="gm-kicker">' + esc(res.reason) + '</p>' : '') +
      starsHTML(stars, 'gm-big') +
      '<h2 class="gm-title">' + esc(msg) + '</h2>' +
      '<div class="gm-final"><b>' + (reduce ? nf(score) : '0') + '</b><span>puntos</span></div>' +
      (record && prev !== null ? '<p class="gm-record">¡Nuevo récord personal!</p>' : best !== null ? '<p class="gm-best">Tu récord: <b>' + nf(best) + '</b></p>' : '') +
      (lines.length ? '<dl class="gm-lines">' + lines.map((l) => '<div><dt>' + esc(l[0]) + '</dt><dd>' + esc(l[1]) + '</dd></div>').join('') + '</dl>' : '') +
      (res.extra || '') +
      '<button class="gm-btn gm-again" type="button">Jugar otra vez</button>' +
      '</div>';
    const again = body.querySelector('.gm-again');
    again.onclick = startRound;
    keyH = (e) => { if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') { e.preventDefault(); startRound(); } };
    live.textContent = 'Fin de la partida. ' + stars + ' estrellas, ' + nf(score) + ' puntos.';
    // conteo animado del puntaje
    if (!reduce) {
      const b = body.querySelector('.gm-final b');
      const t0 = performance.now(), D = 900;
      mountStops.push(frames(() => {
        const k = Math.min(1, (performance.now() - t0) / D);
        b.textContent = nf(score * (1 - Math.pow(1 - k, 3)));
        return k < 1;
      }));
    }
    if (stars >= 2 || (record && prev !== null)) later(reduce ? 0 : 450, () => confetti(stars === 3 ? 70 : 40));
    try { again.focus({ preventScroll: true }); } catch (e) { /* ignorar */ }
    round = null;
    finish && finish({ score, stars, detail: res.detail || {} });
  }
  const mountStops = [];

  startScreen();

  return function dispose() {
    if (disposed) return;
    disposed = true;
    if (round) round.kill();
    mountTimers.forEach(clearTimeout);
    mountStops.forEach((s) => s());
    document.removeEventListener('keydown', onKey);
    keyH = null;
    el.innerHTML = '';
  };
}
