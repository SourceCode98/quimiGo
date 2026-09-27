// Constructor 3D: agrega los átomos que pide la molécula; cuando la composición coincide,
// los átomos sueltos vuelan a su lugar y se forma la molécula.
// spec: { targets:['H2O','CO2','NH3','CH4',...], palette:['H','C','N','O','Cl'] }
import { THREE, EL, M, esc, fH, reduce, shuffle, three } from '../widgets.js';
import '../scenes/molecules-extra.js'; // registra más moléculas en M (opcional)
import { makeGame, mmss, clamp } from './common.js';

const SC = 1.35;
const DEF = ['H2O', 'CO2', 'NH3', 'CH4', 'HCl', 'C2H4', 'CH3OH'];
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const back = (t) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const inkOn = (hex) => { const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255; return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#15202B' : '#FFFFFF'; };

function keyOf(t) {
  if (M[t]) return t;
  const k = Object.keys(M).find((x) => M[x].f === t);
  return k && !M[k].ionic ? k : null;
}
function compOf(m) { const c = {}; m.a.forEach((a) => (c[a[0]] = (c[a[0]] || 0) + 1)); return c; }

export default function builder(el, spec, finish) {
  const keys = (spec.targets && spec.targets.length ? spec.targets : DEF).map(keyOf).filter((k) => k && M[k].a.length <= 14);
  const need = new Set();
  keys.forEach((k) => M[k].a.forEach((a) => need.add(a[0])));
  let palette = (spec.palette && spec.palette.length ? spec.palette : ['H', 'C', 'N', 'O', 'Cl']).filter((s) => EL[s]);
  need.forEach((s) => { if (!palette.includes(s)) palette.push(s); });
  palette = palette.slice(0, 7);
  const N = keys.length;

  return makeGame(el, spec, finish, {
    key: 'builder', name: 'Constructor 3D', icon: '⚛', time: 'up',
    how: 'Agrega los átomos que necesita cada molécula. Cuando estén todos, ¡la molécula se arma sola!',
    rules: [N + ' moléculas', 'Sin errores y rápido: más estrellas'],
    stars: (r) => { const f = r.score / (N * 250); return !r.built ? 0 : f >= 0.72 ? 3 : f >= 0.45 ? 2 : 1; },
    lines: (r) => [['Moléculas', r.built + ' de ' + N], ['Errores', String(r.errors)], ['Tiempo', mmss(r.secs)], r.hints ? ['Pistas', String(r.hints)] : null],
    play(g) {
      const order = spec.shuffle === false ? keys.slice() : shuffle(keys.slice());
      g.stage.innerHTML =
        '<div class="gm-target"><div class="gm-tl"><p class="gm-qn"></p><h3 class="gm-tname"></h3></div>' +
        '<div class="gm-tf" aria-label="Fórmula"></div><button type="button" class="gm-btn ghost sm gm-hintb">Pista</button></div>' +
        '<div class="gm-hint" hidden></div>' +
        '<div class="stage gm-bstage"><div class="gm-bmsg"></div><div class="gm-bcount" aria-live="polite"></div></div>' +
        '<div class="gm-pal" style="--n:' + palette.length + '">' +
        palette.map((s, i) => {
          const E = EL[s];
          return '<div class="gm-elw"><button type="button" class="gm-add" data-s="' + s + '" style="--c:' + E.css + ';--ci:' + inkOn(E.hex) + '" aria-label="Agregar ' + E.name + '">' +
            '<b>' + s + '</b><em class="gm-cnt" hidden>0</em></button><small>' + E.name + ' <kbd>' + (i + 1) + '</kbd></small>' +
            '<button type="button" class="gm-rem" data-s="' + s + '" aria-label="Quitar ' + E.name + '">−</button></div>';
        }).join('') + '</div>';
      const $ = (s) => g.stage.querySelector(s);
      const stageEl = $('.gm-bstage'), msg = $('.gm-bmsg'), countEl = $('.gm-bcount'), hintEl = $('.gm-hint');
      const o = three(stageEl);
      let ti = -1, key = null, target = null, count = {}, atoms = [], locked = true, errors = 0, hints = 0, built = 0, tStart = 0, hintOn = false;
      const anims = []; // {t, d, fn(k), done}
      const geo = {}, mat = {};
      const errMat = o && new THREE.MeshStandardMaterial({ color: 0xff4d4d, emissive: 0x661111, roughness: 0.4 });
      const bondGeo = o && new THREE.CylinderGeometry(0.07, 0.07, 1, 12);
      const bondMat = o && new THREE.MeshStandardMaterial({ color: 0xa9b4be, roughness: 0.5 });
      const glowMat = o && new THREE.MeshBasicMaterial({ color: 0xfff1b0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
      const glow = o && new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), glowMat);
      let bonds = [];
      if (o) {
        o.auto = false; o.rot.x = -0.15; o.rot.y = 0;
        glow.visible = false; o.scene.add(glow);
        stageEl.insertAdjacentHTML('beforeend', '<div class="hint">Arrastra para girar</div>');
      } else {
        stageEl.insertAdjacentHTML('beforeend', '<div class="gm-flat"></div>');
      }
      const flat = stageEl.querySelector('.gm-flat');
      const G = (s) => geo[s] || (geo[s] = new THREE.SphereGeometry(EL[s].r3 * 1.2, 26, 18));
      const Mt = (s) => mat[s] || (mat[s] = new THREE.MeshStandardMaterial({ color: EL[s].hex, roughness: 0.38, metalness: 0.05 }));
      const anim = (d, fn, done) => { const a = { t: 0, d: reduce ? 0 : d, fn, done }; anims.push(a); if (reduce) { fn(1); done && done(); a.over = true; } return a; };

      g.frame((dt) => {
        for (let i = anims.length - 1; i >= 0; i--) {
          const a = anims[i];
          if (a.over) { anims.splice(i, 1); continue; }
          a.t += dt;
          const k = a.d ? Math.min(1, a.t / a.d) : 1;
          if (k > 0) a.fn(k);
          if (k >= 1) { anims.splice(i, 1); a.done && a.done(); }
        }
        if (!o || reduce) return;
        const now = performance.now() / 1000;
        atoms.forEach((a) => {
          if (a.state !== 'loose') return;
          a.mesh.position.set(a.home.x + Math.sin(now * 0.9 + a.ph) * 0.14, a.home.y + Math.sin(now * 1.3 + a.ph * 2) * 0.12 + a.rise, a.home.z + Math.cos(now * 0.7 + a.ph) * 0.1);
        });
      });

      function view() {
        const w = stageEl.clientWidth || 600, h = stageEl.clientHeight || 340;
        const halfH = o.zoom * Math.tan((20 * Math.PI) / 180);
        return { hw: halfH * (w / h), hh: halfH };
      }
      function homeFor() {
        const v = view();
        const X = Math.min(v.hw * 0.62, 4.5), Y = v.hh * 0.55;
        let best = null, bd = -1;
        for (let k = 0; k < 14; k++) {
          const p = new THREE.Vector3((Math.random() * 2 - 1) * X, (Math.random() * 2 - 1) * Y, (Math.random() - 0.5) * 1.2);
          const d = atoms.reduce((m, a) => (a.state === 'loose' ? Math.min(m, a.home.distanceTo(p)) : m), 99);
          if (d > bd) { bd = d; best = p; }
        }
        return best;
      }
      function drawCount() {
        const want = compOf(target);
        palette.forEach((s) => {
          const b = g.stage.querySelector('.gm-add[data-s="' + s + '"]');
          const c = count[s] || 0;
          const e = b.querySelector('.gm-cnt');
          e.hidden = !c; e.textContent = c;
          b.classList.toggle('over', c > (want[s] || 0));
          g.stage.querySelector('.gm-rem[data-s="' + s + '"]').disabled = !c || locked;
        });
        const parts = Object.keys(count).filter((s) => count[s]).map((s) => s + (count[s] > 1 ? '<sub>' + count[s] + '</sub>' : ''));
        countEl.innerHTML = parts.length ? 'Tienes: <b>' + parts.join('') + '</b>' : '';
        if (flat) flat.innerHTML = atoms.map((a) => '<i style="background:' + EL[a.sym].css + ';color:' + inkOn(EL[a.sym].hex) + '">' + a.sym + '</i>').join('');
      }
      function removeLabel(mesh) {
        const i = o.labels.findIndex((l) => l.obj === mesh);
        if (i >= 0) { o.labels[i].d.remove(); o.labels.splice(i, 1); }
      }
      function addAtom(s) {
        if (locked || !g.alive) return;
        const want = compOf(target);
        const btn = g.stage.querySelector('.gm-add[data-s="' + s + '"]');
        count[s] = (count[s] || 0) + 1;
        const a = { sym: s, state: 'loose', ph: Math.random() * 6.28, rise: 0 };
        if (o) {
          a.home = homeFor();
          a.mesh = new THREE.Mesh(G(s), Mt(s));
          a.mesh.position.copy(a.home);
          a.mesh.scale.setScalar(0.01);
          o.root.add(a.mesh);
          o.label(a.mesh, s);
          a.rise = -1.2;
          anim(0.45, (k) => { const b = back(k); a.mesh.scale.setScalar(Math.max(0.01, b)); a.rise = -1.2 * (1 - ease(k)); if (reduce) a.mesh.position.copy(a.home); });
        }
        atoms.push(a);
        msg.classList.add('off');
        g.bump(btn, 'gm-tap');
        if ((count[s] || 0) > (want[s] || 0)) {
          errors++;
          g.miss();
          g.info('<span><b>' + built + '</b> de ' + N + ' moléculas</span><span><b>' + errors + '</b> ' + (errors === 1 ? 'error' : 'errores') + '</span>');
          g.bad(btn);
          g.add(-25, btn);
          g.say(want[s] ? 'Sobra un átomo de ' + EL[s].name : target.n + ' no lleva ' + EL[s].name);
          toast(want[s] ? 'Sobra: ya tienes suficiente ' + EL[s].name.toLowerCase() : esc(target.n) + ' no lleva ' + EL[s].name.toLowerCase(), 'warn');
          if (o) { a.mesh.material = errMat; g.after(700, () => { if (a.mesh) a.mesh.material = Mt(s); }); }
        } else g.good();
        drawCount();
        check();
      }
      function removeAtom(s) {
        if (locked || !g.alive) return;
        let i = -1;
        for (let k = atoms.length - 1; k >= 0; k--) if (atoms[k].sym === s && atoms[k].state === 'loose') { i = k; break; }
        if (i < 0) return;
        const a = atoms.splice(i, 1)[0];
        count[s]--;
        if (o) {
          a.state = 'gone';
          removeLabel(a.mesh);
          const m = a.mesh;
          anim(0.25, (k) => m.scale.setScalar(Math.max(0.01, 1 - k)), () => o.root.remove(m));
        }
        drawCount();
        check();
      }
      function check() {
        const want = compOf(target);
        const ok = Object.keys(want).every((s) => count[s] === want[s]) && Object.keys(count).every((s) => !count[s] || want[s]);
        if (ok) assemble();
      }
      let toastT = null;
      function toast(html, kind) {
        let t = stageEl.querySelector('.gm-toast');
        if (!t) { t = document.createElement('div'); t.className = 'gm-toast'; stageEl.appendChild(t); }
        t.className = 'gm-toast show ' + (kind || '');
        t.innerHTML = html;
        if (toastT) g.cancel(toastT);
        toastT = g.after(1700, () => t.classList.remove('show'));
      }

      function assemble() {
        locked = true;
        g.pause();
        const secs = (performance.now() - tStart) / 1000;
        const tAdj = Math.max(0, secs - 0.6 * target.a.length);
        const bonus = Math.round(clamp(30 - tAdj, 0, 30) * 5);
        built++;
        drawCount();
        const finishUp = () => {
          const m = g.hit();
          g.add((100 + bonus) * (m > 1 ? 1.25 : 1), g.at(stageEl, 0.5, 0.42));
          g.confetti(36);
          g.good(stageEl);
          msg.innerHTML = '<b>¡' + esc(target.n) + '!</b><span>' + esc(target.g || '') + (target.ang && target.ang !== '—' ? ' · ' + esc(target.ang) : '') + '</span>';
          msg.classList.remove('off');
          msg.classList.add('win');
          g.say('Formaste ' + target.n);
          g.info('<span><b>' + built + '</b> de ' + N + ' moléculas</span>');
          g.after(2300, next);
        };
        if (!o) { finishUp(); return; }
        // posiciones finales
        const c = target.a.reduce((s, x) => [s[0] + x[1], s[1] + x[2], s[2] + x[3]], [0, 0, 0]).map((v) => v / target.a.length);
        const P = target.a.map((a) => new THREE.Vector3((a[1] - c[0]) * SC, (a[2] - c[1]) * SC, (a[3] - c[2]) * SC));
        // cuadra cada átomo suelto con la posición más cercana de su elemento
        const free = atoms.slice();
        const slots = target.a.map((a, i) => ({ s: a[0], i }));
        const pairs = [];
        slots.forEach((sl) => {
          let bi = -1, bd = 1e9;
          free.forEach((a, j) => { if (a.sym === sl.s) { const d = a.mesh.position.distanceTo(P[sl.i]); if (d < bd) { bd = d; bi = j; } } });
          pairs.push([free.splice(bi, 1)[0], sl.i]);
        });
        // sube el zoom si hace falta y centra la rotación
        const ext = Math.max(...P.map((p) => p.length())) + 0.8;
        const z0 = o.zoom, z1 = Math.max(5, ext * 2.7), rx0 = o.rot.x, ry0 = o.rot.y;
        const dy = -z1 * 0.07;
        anim(0.9, (k) => { const e = ease(k); o.zoom = z0 + (z1 - z0) * e; o.root.position.y = dy * e; o.rot.x = rx0 + (-0.25 - rx0) * e; o.rot.y = ry0 + (0.35 - ry0) * e; });
        const D = 1.05, stagger = Math.min(0.07, 0.5 / pairs.length);
        pairs.forEach(([a, i], n) => {
          a.state = 'fly';
          const from = a.mesh.position.clone(), to = P[i];
          const lift = 0.9 + Math.random() * 0.6;
          const t = anim(D + n * stagger, (k) => {
            const kk = clamp((k * (D + n * stagger) - n * stagger) / D, 0, 1);
            const e = ease(kk);
            a.mesh.position.lerpVectors(from, to, e);
            a.mesh.position.z += Math.sin(Math.PI * e) * lift;
            a.mesh.rotation.y = e * Math.PI * 2;
            const s = kk > 0.85 ? 1 + Math.sin(((kk - 0.85) / 0.15) * Math.PI) * 0.25 : 1;
            a.mesh.scale.setScalar(s);
          }, () => { a.state = 'placed'; a.mesh.position.copy(to); a.mesh.scale.setScalar(1); });
          void t;
        });
        // enlaces que crecen
        const tb = D + pairs.length * stagger;
        g.after(tb * 1000 * (reduce ? 0 : 1), () => {
          target.b.forEach(([i, j, k], n) => {
            const A = P[i], B = P[j], dir = B.clone().sub(A), len = dir.length();
            dir.normalize();
            let pp = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 0, 1));
            if (pp.length() < 0.1) pp = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0));
            pp.normalize();
            const m = Math.max(1, k);
            for (let q = 0; q < m; q++) {
              const off = pp.clone().multiplyScalar(k > 1 ? (q - (m - 1) / 2) * 0.17 : 0);
              const cy = new THREE.Mesh(bondGeo, bondMat);
              cy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
              const start = A.clone().add(off);
              cy.scale.set(1, 0.001, 1);
              o.root.add(cy);
              bonds.push(cy);
              anim(0.32 + n * 0.03, (kk) => {
                const e = ease(clamp((kk * (0.32 + n * 0.03) - n * 0.03) / 0.32, 0, 1));
                cy.scale.y = Math.max(0.001, len * e);
                cy.position.copy(start).addScaledVector(dir, (len * e) / 2);
              });
            }
          });
          // destello
          glow.visible = true;
          anim(0.7, (k) => { glow.scale.setScalar(0.5 + ext * 1.2 * ease(k)); glowMat.opacity = 0.45 * (1 - k); }, () => { glow.visible = false; });
          o.auto = true;
          finishUp();
        });
      }

      function clearMol(done) {
        const olds = atoms.map((a) => a.mesh).filter(Boolean).concat(bonds);
        atoms = []; bonds = [];
        if (!o) { done(); return; }
        o.labels.forEach((l) => l.d.remove());
        o.labels.length = 0;
        const s0 = olds.map((m) => m.scale.clone());
        anim(0.3, (k) => olds.forEach((m, i) => m.scale.copy(s0[i]).multiplyScalar(Math.max(0.001, 1 - ease(k)))), () => { olds.forEach((m) => o.root.remove(m)); done(); });
      }

      function next() {
        clearMol(() => {
          ti++;
          if (ti >= order.length) return g.end({ built, errors, hints, secs: g.t, reason: '¡Construiste todas las moléculas!', detail: { built, total: N, errors, hints, seconds: Math.round(g.t) } });
          key = order[ti];
          target = M[key];
          count = {};
          hintOn = false;
          hintEl.hidden = true;
          g.stage.querySelector('.gm-hintb').disabled = false;
          $('.gm-qn').textContent = 'Molécula ' + (ti + 1) + ' de ' + N;
          $('.gm-tname').textContent = target.n;
          $('.gm-tf').innerHTML = fH(target.f);
          g.bump($('.gm-target'), 'gm-in');
          msg.className = 'gm-bmsg';
          msg.innerHTML = '<span>Toca los átomos de abajo para agregarlos</span>';
          g.info('<span><b>' + built + '</b> de ' + N + ' moléculas</span><span><b>' + errors + '</b> ' + (errors === 1 ? 'error' : 'errores') + '</span>');
          if (o) {
            o.auto = false; o.rot.x = -0.15; o.rot.y = 0; o.root.position.y = 0;
            const c = target.a.reduce((s, x) => [s[0] + x[1], s[1] + x[2], s[2] + x[3]], [0, 0, 0]).map((v) => v / target.a.length);
            const ext = Math.max(...target.a.map((a) => Math.hypot(a[1] - c[0], a[2] - c[1], a[3] - c[2]) * SC)) + 0.8;
            o.zoom = Math.max(6.5, ext * 3);
          }
          drawCount();
          locked = false;
          tStart = performance.now();
          g.resume();
          drawCount();
        });
      }
      function showHint() {
        if (locked || hintOn) return;
        hintOn = true; hints++;
        g.add(-40, $('.gm-hintb'));
        const want = compOf(target);
        hintEl.innerHTML = 'Necesitas: ' + Object.keys(want).map((s) => '<span class="gm-chip"><i style="background:' + EL[s].css + '"></i><b>' + want[s] + '</b> ' + EL[s].name.toLowerCase() + '</span>').join('');
        hintEl.hidden = false;
        g.bump(hintEl, 'gm-in');
        $('.gm-hintb').disabled = true;
      }

      g.stage.querySelector('.gm-pal').addEventListener('click', (e) => {
        const a = e.target.closest('.gm-add'), r = e.target.closest('.gm-rem');
        if (a) addAtom(a.dataset.s);
        else if (r) removeAtom(r.dataset.s);
      });
      $('.gm-hintb').onclick = showHint;
      g.key((e) => {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= palette.length) { e.preventDefault(); addAtom(palette[n - 1]); return; }
        if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); const a = atoms.filter((x) => x.state === 'loose').pop(); if (a) removeAtom(a.sym); return; }
        const up = e.key.length === 1 ? e.key.toUpperCase() : '';
        const s = palette.find((p) => p[0] === up && (p.length === 1 || !palette.includes(up)));
        if (s && !e.shiftKey) { e.preventDefault(); addAtom(s); }
        else if (s && e.shiftKey) { e.preventDefault(); removeAtom(s); }
      });
      g.cleanups.push(() => {
        if (o) {
          o.scene.remove(glow);
          glow.geometry.dispose(); glowMat.dispose(); errMat.dispose(); bondGeo.dispose(); bondMat.dispose();
          Object.values(geo).forEach((x) => x.dispose()); Object.values(mat).forEach((x) => x.dispose());
          o.dispose();
        }
      });
      g.clock(0);
      g.info('');
      if (!N) { msg.textContent = 'No hay moléculas para construir.'; return; }
      next();
    },
  });
}
