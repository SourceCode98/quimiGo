// Escena "atom": modelos atómicos 3D (Dalton, Thomson, Rutherford, Bohr, nube), iones, isótopos y fisión.
import { THREE, EL, ELZ, reduce, esc, three } from '../widgets.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const P_COL = 0xE5534B, N_COL = 0xA3AEB9, E_COL = 0x6CD3FF, GOLD = 0xFFC857;
const SHELL_CAP = [2, 8, 8, 18];
const RING = [1.1, 1.72, 2.34, 2.96];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function texture(draw, size) {
  const c = document.createElement('canvas'); c.width = c.height = size || 64;
  draw(c.getContext('2d'), c.width); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const softTex = () => texture((g, s) => { const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.3, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, s, s); });
const plusTex = () => texture((g, s) => { g.strokeStyle = '#fff'; g.lineWidth = s * 0.16; g.lineCap = 'round'; g.beginPath(); g.moveTo(s * .22, s / 2); g.lineTo(s * .78, s / 2); g.moveTo(s / 2, s * .22); g.lineTo(s / 2, s * .78); g.stroke(); });

function setup(el) {
  const st = document.createElement('div'); st.className = 'stage sc-stage';
  el.appendChild(st);
  const hint = document.createElement('span'); hint.className = 'hint sc-hint'; hint.textContent = 'Arrastra para girar';
  st.appendChild(hint);
  const o = three(st, () => hint.classList.add('sc-off'));
  const hintT = setTimeout(() => hint.classList.add('sc-off'), 7000);
  if (!o) { clearTimeout(hintT); hint.remove(); return { st, o: null, cleanup() {} }; }
  const pm = new THREE.PMREMGenerator(o.R); const room = new RoomEnvironment();
  const env = pm.fromScene(room, 0.04).texture; pm.dispose(); if (room.dispose) room.dispose();
  o.scene.environment = env; o.scene.environmentIntensity = 0.7;
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(3, 5, 6); o.scene.add(key);
  const rim = new THREE.DirectionalLight(0x9fc4ff, 0.9); rim.position.set(-5, 2, -4); o.scene.add(rim);
  return { st, o, cleanup() { clearTimeout(hintT); env.dispose(); o.scene.remove(key); o.scene.remove(rim); } };
}

// Esfera de nucleones empaquetados (determinista)
function cluster(n, r, seed) {
  const R = r * Math.cbrt(Math.max(1, n)) * 1.12, rand = rng(seed || 7), pts = [];
  for (let i = 0; i < n; i++) {
    let x, y, z; do { x = rand() * 2 - 1; y = rand() * 2 - 1; z = rand() * 2 - 1; } while (x * x + y * y + z * z > 1);
    pts.push(new THREE.Vector3(x, y, z).multiplyScalar(R * 0.9));
  }
  const d = 2 * r * 0.93, d2 = d * d, v = new THREE.Vector3();
  for (let it = 0; it < 40; it++) {
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      v.subVectors(pts[j], pts[i]); const q = v.lengthSq();
      if (q < d2 && q > 1e-9) { const l = Math.sqrt(q), push = (d - l) / 2; v.multiplyScalar(push / l); pts[i].sub(v); pts[j].add(v); }
    }
    pts.forEach(p => p.multiplyScalar(0.985));
  }
  return pts;
}
function shells(E) {
  const out = []; let left = Math.max(0, E);
  for (let k = 0; k < 4 && left > 0; k++) { const c = Math.min(SHELL_CAP[k], left); out.push(c); left -= c; }
  return out;
}
const defaultN = Z => { const e = ELZ[Z]; return e ? Math.max(0, Math.round(e.m - 0.01) - Z) : Z; };

export default function (el) {
  const { st, o, cleanup } = setup(el);
  const panel = document.createElement('div'); panel.className = 'sc-panel'; panel.hidden = true; st.appendChild(panel);
  if (!o) return { set() {}, dispose() { st.remove(); } };
  o.zoom = 9.4; o.rot.x = 0.22; o.rot.y = 0;
  const root = o.root;
  const sphere = new THREE.SphereGeometry(1, 20, 14);
  const soft = softTex(), plus = plusTex();
  const V = new THREE.Vector3(), MTX = new THREE.Matrix4(), QI = new THREE.Quaternion(), SC = new THREE.Vector3();

  // ---------- utilidades por capa ----------
  function makeLayer(kind) {
    const L = { kind, group: new THREE.Group(), alpha: 0, target: 1, mats: [], labels: [], update: null, focus: null, dispose: null };
    root.add(L.group);
    L.track = (m, part) => { m.transparent = true; L.mats.push({ m, base: m.opacity, part: part || 'all' }); return m; };
    L.label = (obj, txt, cls) => { o.label(obj, txt); const l = o.labels[o.labels.length - 1]; if (cls) l.d.classList.add(cls); l.d.style.opacity = 0; L.labels.push({ l, a: 0, t: 1 }); return l; };
    L.unlabel = entry => { o.labels = o.labels.filter(x => x !== entry.l); entry.l.d.remove(); L.labels = L.labels.filter(x => x !== entry); };
    L.fac = {}; // factor de foco por parte
    return L;
  }
  function killLayer(L) {
    L.labels.slice().forEach(e => L.unlabel(e));
    if (L.dispose) L.dispose();
    L.group.traverse(x => { if (x.geometry && x.geometry !== sphere) x.geometry.dispose(); if (x.material) x.material.dispose(); if (x.isInstancedMesh) x.dispose(); });
    root.remove(L.group);
  }
  function applyAlpha(L, dt) {
    const a = smooth(L.alpha);
    const f = L.fac;
    L.mats.forEach(e => { const k = f[e.part] ? f[e.part].v : 1; e.m.opacity = e.base * a * k; e.m.visible = e.m.opacity > 0.003; });
    L.labels.forEach(e => { e.a += (e.t - e.a) * Math.min(1, dt * 5 || 1); e.l.d.style.opacity = String(e.a * a); });
    const s = L.target ? 0.9 + 0.1 * a : 1 + 0.08 * (1 - a);
    L.group.scale.setScalar(s);
  }
  function setFac(L, part, v, glow) { if (!L.fac[part]) L.fac[part] = { v: 1, t: 1, g: 0, gt: 0 }; L.fac[part].t = v; L.fac[part].gt = glow || 0; }
  function stepFac(L, dt) { Object.keys(L.fac).forEach(k => { const f = L.fac[k]; const r = dt === 0 ? 1 : Math.min(1, dt * 4); f.v += (f.t - f.v) * r; f.g += (f.gt - f.g) * r; }); }

  // ---------- modelo de Bohr ----------
  function bohrLayer() {
    const L = makeLayer('bohr');
    const g = L.group;
    const nuc = new THREE.Group(); g.add(nuc);
    const pMat = L.track(new THREE.MeshStandardMaterial({ color: P_COL, roughness: 0.4, emissive: P_COL, emissiveIntensity: 0.05 }), 'nuc');
    const nMat = L.track(new THREE.MeshStandardMaterial({ color: N_COL, roughness: 0.45, emissive: N_COL, emissiveIntensity: 0.02 }), 'nuc');
    const CAP = 130;
    const pIM = new THREE.InstancedMesh(sphere, pMat, CAP), nIM = new THREE.InstancedMesh(sphere, nMat, CAP);
    [pIM, nIM].forEach(m => { m.count = 0; m.frustumCulled = false; nuc.add(m); });
    const glowMat = L.track(new THREE.SpriteMaterial({ map: soft, color: 0xff9a6b, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }), 'glow');
    const glow = new THREE.Sprite(glowMat); nuc.add(glow);
    const nucs = { p: [], n: [] }; // {pos, from, to, t, s, dying}
    const NR = 0.15;
    let nucR = 0.4;
    // anillos
    const rings = RING.map((R, k) => {
      const m = L.track(new THREE.MeshBasicMaterial({ color: 0x6f8faf, opacity: 0.55 }), 'ring' + k);
      const mesh = new THREE.Mesh(new THREE.TorusGeometry(R, 0.014, 8, 160), m); g.add(mesh);
      const anchor = new THREE.Object3D(); anchor.position.set(Math.cos(0.8) * R, Math.sin(0.8) * R, 0); g.add(anchor);
      return { mesh, m, R, anchor, vis: 0, visT: 0, phase: k * 1.3, lab: null };
    });
    const elecs = []; // {shell, slot, slotT, r, a, dying, mesh, halo}
    const eMatBase = new THREE.MeshStandardMaterial({ color: E_COL, emissive: E_COL, emissiveIntensity: 0.9, roughness: 0.3 });
    function addElectron(k) {
      const m = eMatBase.clone(); L.track(m, 'e' + k);
      const mesh = new THREE.Mesh(sphere, m); mesh.scale.setScalar(0.1); g.add(mesh);
      const hm = new THREE.SpriteMaterial({ map: soft, color: E_COL, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }); L.track(hm, 'e' + k);
      const halo = new THREE.Sprite(hm); halo.scale.setScalar(0.5); mesh.add(halo); halo.scale.setScalar(5);
      const e = { shell: k, slot: Math.random() * 6.28, slotT: 0, r: RING[k] + 3, a: 0, dying: false, mesh, halo, m, hm };
      elecs.push(e); return e;
    }
    function dropElectron(e) {
      L.mats = L.mats.filter(x => x.m !== e.m && x.m !== e.hm);
      g.remove(e.mesh); e.m.dispose(); e.hm.dispose();
    }
    let cfg = null;
    L.configure = (Z, N, E, instant) => {
      // núcleo
      const tot = Z + N;
      const pts = cluster(tot, NR, 11 + tot);
      nucR = pts.reduce((m, p) => Math.max(m, p.length()), 0) + NR;
      const rand = rng(3 + Z);
      const idx = pts.map((_, i) => i).sort(() => rand() - 0.5);
      const pPts = idx.slice(0, Z).map(i => pts[i]), nPts = idx.slice(Z).map(i => pts[i]);
      [['p', pPts], ['n', nPts]].forEach(([k, arr]) => {
        const list = nucs[k];
        list.forEach(q => { if (q.dying) return; });
        const alive = list.filter(q => !q.dying);
        arr.forEach((to, i) => {
          if (alive[i]) { const q = alive[i]; q.from = q.pos.clone(); q.to = to.clone(); q.t = instant ? 1 : 0; }
          else {
            const dir = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
            const q = { pos: dir.clone().multiplyScalar(4), from: dir.clone().multiplyScalar(4.5), to: to.clone(), t: instant ? 1 : -rand() * 0.3, s: instant ? 1 : 0, dying: false };
            list.push(q);
          }
        });
        alive.slice(arr.length).forEach(q => { q.dying = true; q.from = q.pos.clone(); q.to = q.pos.clone().setLength(4.5); q.t = instant ? 1 : 0; });
      });
      // electrones
      const want = shells(E);
      for (let k = 0; k < 4; k++) {
        const n = want[k] || 0;
        const cur = elecs.filter(e => e.shell === k && !e.dying);
        for (let i = cur.length; i < n; i++) cur.push(addElectron(k));
        cur.slice(n).forEach(e => { e.dying = true; });
        const keep = cur.slice(0, n);
        keep.forEach((e, i) => { e.slotT = (i / n) * Math.PI * 2; if (instant) { e.slot = e.slotT; e.r = RING[k]; e.a = 1; } });
        rings[k].visT = n > 0 ? 1 : 0; if (instant) rings[k].vis = rings[k].visT;
      }
      if (instant) { elecs.slice().forEach(e => { if (e.dying) { dropElectron(e); elecs.splice(elecs.indexOf(e), 1); } }); ['p', 'n'].forEach(k => { nucs[k] = nucs[k].filter(q => !q.dying); nucs[k].forEach(q => { q.pos.copy(q.to); q.t = 1; q.s = 1; }); }); }
      cfg = { Z, N, E, want };
    };
    L.focus = (focus) => {
      const want = cfg ? cfg.want : [];
      const last = want.length - 1;
      rings.forEach(r => { if (r.lab) { L.unlabel(r.lab); r.lab = null; } });
      for (let k = 0; k < 4; k++) {
        let ring = 1, el = 1, gold = 0;
        if (focus === 'nucleus') { ring = 0.25; el = 0.2; }
        else if (focus === 'valence') { ring = k === last ? 1.6 : 0.3; el = k === last ? 1 : 0.22; gold = k === last ? 1 : 0; }
        else if (focus === 'shells') { ring = 1.7; el = 0.55; gold = 0.5; }
        setFac(L, 'ring' + k, ring, gold); setFac(L, 'e' + k, el, focus === 'shells' ? 0 : gold);
      }
      setFac(L, 'nuc', focus === 'nucleus' ? 1 : focus ? 0.4 : 1, focus === 'nucleus' ? 1 : 0);
      setFac(L, 'glow', focus === 'nucleus' ? 2.6 : focus ? 0.4 : 1);
      if (focus === 'shells') want.forEach((_, k) => { rings[k].lab = { l: L.label(rings[k].anchor, 'n = ' + (k + 1), 'sc-lab-ring') }; rings[k].lab = L.labels[L.labels.length - 1]; });
      if (focus === 'valence' && last >= 0) { L.label(rings[last].anchor, 'Valencia · ' + want[last] + ' e⁻', 'sc-lab-gold'); rings[last].lab = L.labels[L.labels.length - 1]; }
    };
    const gold = new THREE.Color(GOLD), base = new THREE.Color(0x6f8faf), tmpC = new THREE.Color(), eC = new THREE.Color(E_COL);
    let t = 0;
    L.update = dt => {
      t += dt;
      // nucleones
      [['p', pIM], ['n', nIM]].forEach(([k, im]) => {
        const list = nucs[k];
        for (let i = list.length - 1; i >= 0; i--) {
          const q = list[i];
          q.t = Math.min(1, q.t + dt * 1.4);
          const e = smooth(q.t);
          q.pos.lerpVectors(q.from || q.to, q.to, e);
          q.s = q.dying ? 1 - e : Math.min(1, (q.s || 0) + dt * 3);
          if (q.dying && q.t >= 1) list.splice(i, 1);
        }
        im.count = list.length;
        list.forEach((q, i) => {
          const j = 0.012; V.set(q.pos.x + Math.sin(t * 9 + i) * j, q.pos.y + Math.cos(t * 8 + i * 2) * j, q.pos.z);
          MTX.compose(V, QI, SC.setScalar(NR * Math.max(0.001, q.s))); im.setMatrixAt(i, MTX);
        });
        im.instanceMatrix.needsUpdate = true;
      });
      const nf = L.fac.nuc ? L.fac.nuc.g : 0;
      pMat.emissiveIntensity = 0.05 + nf * 0.45; nMat.emissiveIntensity = 0.02 + nf * 0.35;
      glow.scale.setScalar(nucR * 4.2 + nf * 1.2);
      // anillos y electrones
      rings.forEach((r, k) => {
        r.vis += (r.visT - r.vis) * (dt === 0 ? 1 : Math.min(1, dt * 3));
        r.mesh.visible = r.vis > 0.01; r.mesh.scale.setScalar(0.85 + 0.15 * r.vis);
        const f = L.fac['ring' + k]; const gl = f ? f.g : 0;
        tmpC.copy(base).lerp(gold, gl); r.m.color.copy(tmpC);
        r.phase += dt * (0.9 / Math.pow(k + 1, 0.6));
      });
      rings.forEach((r, k) => { const e = L.mats.find(x => x.m === r.m); if (e) e.base = 0.55 * r.vis; });
      for (let i = elecs.length - 1; i >= 0; i--) {
        const e = elecs[i], k = e.shell, R = RING[k];
        let dd = e.slotT - e.slot; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); e.slot += dd * Math.min(1, dt * 3);
        if (e.dying) { e.r += dt * 2.8; e.a -= dt * 0.9; } else { e.r += (R - e.r) * Math.min(1, dt * 2.5); e.a = Math.min(1, e.a + dt * 1.8); }
        if (e.dying && e.a <= 0) { dropElectron(e); elecs.splice(i, 1); continue; }
        const ang = rings[k].phase + e.slot;
        e.mesh.position.set(Math.cos(ang) * e.r, Math.sin(ang) * e.r, 0);
        const f = L.fac['e' + k]; const gl = f ? f.g : 0;
        e.mesh.scale.setScalar(0.1 * (1 + gl * 0.25));
        tmpC.copy(eC).lerp(gold, gl); e.m.color.copy(tmpC); e.m.emissive.copy(tmpC); e.m.emissiveIntensity = 0.9 - gl * 0.45; e.hm.color.copy(tmpC);
        const tr = L.mats.find(x => x.m === e.m); if (tr) tr.base = clamp(e.a, 0, 1);
        const th = L.mats.find(x => x.m === e.hm); if (th) th.base = 0.55 * clamp(e.a, 0, 1);
      }
    };
    L.dispose = () => { elecs.slice().forEach(dropElectron); eMatBase.dispose(); };
    return L;
  }

  // ---------- Dalton ----------
  function daltonLayer(Z) {
    const L = makeLayer('dalton');
    const E = ELZ[Z] || EL.C;
    const m = L.track(new THREE.MeshPhysicalMaterial({ color: E.hex, roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.3 }));
    const s = new THREE.Mesh(new THREE.SphereGeometry(1.55, 48, 32), m); L.group.add(s);
    const gm = L.track(new THREE.SpriteMaterial({ map: soft, color: E.hex, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false }));
    const gs = new THREE.Sprite(gm); gs.scale.setScalar(5.2); gs.renderOrder = -1; L.group.add(gs);
    const lab = new THREE.Object3D(); lab.position.set(0, -2.05, 0); L.group.add(lab);
    L.label(lab, 'Esfera maciza e indivisible', 'sc-lab-soft');
    L.update = () => {};
    return L;
  }

  // ---------- Thomson ----------
  function thomsonLayer(E) {
    const L = makeLayer('thomson');
    const R = 1.9;
    const m = L.track(new THREE.MeshPhysicalMaterial({ color: 0xF4A3B8, roughness: 0.35, opacity: 0.42, clearcoat: 0.5, depthWrite: false, side: THREE.DoubleSide }));
    const s = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 32), m); s.renderOrder = 2; L.group.add(s);
    const inner = L.track(new THREE.SpriteMaterial({ map: soft, color: 0xFF8FB0, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
    const is = new THREE.Sprite(inner); is.scale.setScalar(R * 2.6); L.group.add(is);
    const pm = L.track(new THREE.SpriteMaterial({ map: plus, color: 0xFFE0E8, opacity: 0.85, depthWrite: false }));
    const rand = rng(5);
    const n = clamp(E, 1, 36);
    const em = L.track(new THREE.MeshStandardMaterial({ color: 0x2F5FD0, emissive: 0x1C3FA0, emissiveIntensity: 0.6, roughness: 0.3 }));
    const es = [];
    for (let i = 0; i < n; i++) {
      const y = 1 - 2 * (i + 0.5) / n, rr = Math.sqrt(1 - y * y), th = i * 2.39996;
      const rad = R * (0.55 + 0.3 * ((i * 7) % 5) / 4);
      const p = new THREE.Vector3(Math.cos(th) * rr * rad, y * rad, Math.sin(th) * rr * rad);
      const e = new THREE.Mesh(sphere, em); e.scale.setScalar(0.16); e.position.copy(p); e.renderOrder = 1; L.group.add(e); es.push({ e, p, ph: rand() * 6 });
    }
    const pl = Math.min(14, n + 4);
    for (let i = 0; i < pl; i++) {
      const y = 1 - 2 * (i + 0.5) / pl, rr = Math.sqrt(1 - y * y), th = i * 2.39996 + 1.2;
      const sp = new THREE.Sprite(pm); sp.scale.setScalar(0.28); sp.position.set(Math.cos(th) * rr * R * 0.8, y * R * 0.8, Math.sin(th) * rr * R * 0.8); sp.renderOrder = 3; L.group.add(sp);
    }
    const a1 = new THREE.Object3D(); a1.position.set(0, -R - 0.35, 0); L.group.add(a1);
    L.label(a1, 'Esfera positiva con electrones', 'sc-lab-soft');
    let t = 0;
    L.update = dt => { t += dt; es.forEach(x => { x.e.position.set(x.p.x + Math.sin(t * 3 + x.ph) * 0.03, x.p.y + Math.cos(t * 2.6 + x.ph) * 0.03, x.p.z); }); };
    return L;
  }

  // ---------- Rutherford ----------
  function rutherfordLayer(E) {
    const L = makeLayer('rutherford');
    const g = L.group, rand = rng(9);
    const nm = L.track(new THREE.MeshStandardMaterial({ color: 0xFF7A4D, emissive: 0xFF5A2A, emissiveIntensity: 0.8, roughness: 0.3 }));
    const nuc = new THREE.Mesh(sphere, nm); nuc.scale.setScalar(0.13); g.add(nuc);
    const gm = L.track(new THREE.SpriteMaterial({ map: soft, color: 0xFF8A5A, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
    const gs = new THREE.Sprite(gm); gs.scale.setScalar(0.9); g.add(gs);
    const n = clamp(E, 1, 8);
    const em = L.track(new THREE.MeshStandardMaterial({ color: E_COL, emissive: E_COL, emissiveIntensity: 0.9 }));
    const lm = L.track(new THREE.LineBasicMaterial({ color: 0x5f86ad, opacity: 0.45 }));
    const orbits = [];
    for (let i = 0; i < n; i++) {
      const a = 1.5 + rand() * 1.1, b = a * (0.45 + rand() * 0.3);
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI));
      const pts = []; for (let k = 0; k <= 96; k++) { const t = k / 96 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(t) * a, Math.sin(t) * b, 0).applyQuaternion(q)); }
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lm); g.add(line);
      const e = new THREE.Mesh(sphere, em); e.scale.setScalar(0.085); g.add(e);
      orbits.push({ a, b, q, e, ph: rand() * 6.28, w: 0.8 + rand() * 0.8 });
    }
    // partículas alfa
    const am = L.track(new THREE.MeshStandardMaterial({ color: GOLD, emissive: 0xFFB020, emissiveIntensity: 1 }));
    const tm = L.track(new THREE.LineBasicMaterial({ color: 0xFFD27A, opacity: 0.8 }));
    const alphas = [];
    const TR = 26;
    for (let i = 0; i < 6; i++) {
      const head = new THREE.Mesh(sphere, am); head.scale.setScalar(0.07); g.add(head);
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TR * 3), 3));
      const trail = new THREE.Line(geo, tm); trail.frustumCulled = false; g.add(trail);
      alphas.push({ head, trail, p: new THREE.Vector3(), v: new THREE.Vector3(), hist: [], wait: i * 0.55, live: false, n: i });
    }
    let shot = 0;
    const spawn = a => {
      shot++;
      const aim = shot % 4 === 0;
      const b = aim ? (rand() - 0.5) * 0.12 : (rand() < 0.5 ? -1 : 1) * (0.5 + rand() * 1.9);
      a.p.set(-5.2, b, (rand() - 0.5) * 0.8); a.v.set(3.2, 0, 0); a.hist = []; a.live = true;
    };
    const srcA = new THREE.Object3D(); srcA.position.set(-3.1, -2.75, 0); g.add(srcA);
    L.label(srcA, 'Partículas α', 'sc-lab-gold');
    const nA = new THREE.Object3D(); nA.position.set(0.55, -0.45, 0); g.add(nA);
    L.label(nA, 'Núcleo', 'sc-lab-soft');
    let t = 0;
    L.update = (dt, snap) => {
      t += dt;
      orbits.forEach(ob => { const u = t * ob.w + ob.ph; ob.e.position.set(Math.cos(u) * ob.a, Math.sin(u) * ob.b, 0).applyQuaternion(ob.q); });
      alphas.forEach(a => {
        if (!a.live) { a.wait -= dt; a.head.visible = a.trail.visible = false; if (a.wait <= 0) spawn(a); else return; }
        const sub = 4, h = dt / sub;
        for (let s = 0; s < sub; s++) {
          const r2 = Math.max(0.02, a.p.lengthSq()), r = Math.sqrt(r2);
          const K = 0.9; a.v.addScaledVector(a.p, K / (r2 * r) * h);
          a.p.addScaledVector(a.v, h);
        }
        a.hist.unshift(a.p.clone()); if (a.hist.length > TR) a.hist.pop();
        const arr = a.trail.geometry.attributes.position.array;
        for (let k = 0; k < TR; k++) { const q = a.hist[Math.min(k, a.hist.length - 1)]; arr[k * 3] = q.x; arr[k * 3 + 1] = q.y; arr[k * 3 + 2] = q.z; }
        a.trail.geometry.attributes.position.needsUpdate = true;
        a.head.position.copy(a.p); a.head.visible = a.trail.visible = true;
        if (Math.abs(a.p.x) > 5.6 || Math.abs(a.p.y) > 4) { a.live = false; a.wait = 0.2 + rand() * 0.6; }
      });
    };
    L.prewarm = () => { for (let i = 0; i < 90; i++) L.update(1 / 30); };
    return L;
  }

  // ---------- nube electrónica ----------
  function cloudLayer(E) {
    const L = makeLayer('cloud');
    const g = L.group;
    const want = shells(Math.max(1, E));
    const COUNT = 2600;
    const pos = new Float32Array(COUNT * 3), col = new Float32Array(COUNT * 3);
    const cIn = new THREE.Color(0xA8E6FF), cOut = new THREE.Color(0x4A8FE0), c = new THREE.Color();
    const tot = want.reduce((s, x) => s + x, 0);
    const sample = i => {
      let pick = Math.random() * tot, k = 0; while (k < want.length - 1 && pick > want[k]) { pick -= want[k]; k++; }
      const R = RING[k] * 0.9;
      const g1 = (Math.random() + Math.random() + Math.random() - 1.5) * 0.55;
      const r = Math.max(0.12, R * (1 + g1));
      const u = Math.random() * 2 - 1, th = Math.random() * 6.283, s = Math.sqrt(1 - u * u);
      pos[i * 3] = Math.cos(th) * s * r; pos[i * 3 + 1] = u * r; pos[i * 3 + 2] = Math.sin(th) * s * r;
      c.copy(cIn).lerp(cOut, clamp(r / 3, 0, 1)); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    };
    for (let i = 0; i < COUNT; i++) sample(i);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const pm = L.track(new THREE.PointsMaterial({ size: 0.17, map: soft, vertexColors: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true }));
    const pts = new THREE.Points(geo, pm); g.add(pts);
    const nm = L.track(new THREE.MeshStandardMaterial({ color: 0xFF7A4D, emissive: 0xFF5A2A, emissiveIntensity: 0.7 }));
    const nuc = new THREE.Mesh(sphere, nm); nuc.scale.setScalar(0.16); g.add(nuc);
    const lab = new THREE.Object3D(); lab.position.set(0, -RING[want.length - 1] * 0.9 - 0.7, 0); g.add(lab);
    L.label(lab, 'Nube de electrones', 'sc-lab-soft');
    let acc = 0;
    L.update = dt => {
      pts.rotation.y += dt * 0.1;
      acc += dt * COUNT * 0.6;
      let n = Math.floor(acc); acc -= n; n = Math.min(n, 400);
      for (let k = 0; k < n; k++) sample((Math.random() * COUNT) | 0);
      if (n) { geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true; }
    };
    return L;
  }

  // ---------- fisión ----------
  function fissionLayer() {
    const L = makeLayer('fission');
    const g = L.group;
    const NR = 0.105;
    const base = cluster(236, NR, 42);
    base.sort((a, b) => a.x - b.x);
    const rand = rng(17);
    // índice 0 (más a la izquierda) = neutrón que llega
    const ids = base.map((_, i) => i).slice(1).sort(() => rand() - 0.5);
    const protons = ids.slice(0, 92), neutrons = [0].concat(ids.slice(92));
    const pSorted = protons.slice().sort((a, b) => base[a].x - base[b].x), nSorted = neutrons.slice().sort((a, b) => base[a].x - base[b].x);
    const frag = new Array(236).fill(0); // 1 = Ba, 2 = Kr, 3 = libre
    pSorted.forEach((id, i) => { frag[id] = i < 56 ? 1 : 2; });
    const mid = nSorted.slice().sort((a, b) => Math.abs(base[a].x) - Math.abs(base[b].x)).slice(0, 3);
    const nRest = nSorted.filter(id => mid.indexOf(id) < 0);
    nRest.forEach((id, i) => { frag[id] = i < 85 ? 1 : 2; });
    mid.forEach(id => { frag[id] = 3; });
    const baPts = cluster(141, NR, 5).sort((a, b) => a.x - b.x), krPts = cluster(92, NR, 6).sort((a, b) => a.x - b.x);
    const tgt = new Array(236);
    const baIds = base.map((_, i) => i).filter(i => frag[i] === 1).sort((a, b) => base[a].x - base[b].x);
    const krIds = base.map((_, i) => i).filter(i => frag[i] === 2).sort((a, b) => base[a].x - base[b].x);
    baIds.forEach((id, i) => { tgt[id] = baPts[i]; }); krIds.forEach((id, i) => { tgt[id] = krPts[i]; });
    const dirs = [new THREE.Vector3(0.25, 1, 0.3), new THREE.Vector3(-0.35, -1, 0.2), new THREE.Vector3(0.1, 0.2, 1)].map(v => v.normalize());
    mid.forEach((id, i) => { tgt[id] = dirs[i]; });
    const isP = new Array(236).fill(false); protons.forEach(i => { isP[i] = true; });
    const pMat = L.track(new THREE.MeshStandardMaterial({ color: P_COL, roughness: 0.4, emissive: P_COL, emissiveIntensity: 0.05 }));
    const nMat = L.track(new THREE.MeshStandardMaterial({ color: N_COL, roughness: 0.45, emissive: 0x88ccff, emissiveIntensity: 0 }));
    const pIM = new THREE.InstancedMesh(sphere, pMat, 92), nIM = new THREE.InstancedMesh(sphere, nMat, 144);
    [pIM, nIM].forEach(m => { m.frustumCulled = false; g.add(m); });
    const flashM = L.track(new THREE.SpriteMaterial({ map: soft, color: 0xFFF1C2, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false }), 'flash');
    const flash = new THREE.Sprite(flashM); g.add(flash);
    const glowM = L.track(new THREE.SpriteMaterial({ map: soft, color: 0xFF9A6B, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }), 'glow');
    const glow = new THREE.Sprite(glowM); glow.scale.setScalar(3.4); g.add(glow);
    const fastM = L.track(new THREE.SpriteMaterial({ map: soft, color: 0x9FDFFF, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }), 'fast');
    const trails = mid.map(() => { const s = new THREE.Sprite(fastM); s.scale.setScalar(0.5); g.add(s); return s; });
    const inTrail = new THREE.Sprite(fastM); inTrail.scale.setScalar(0.5); g.add(inTrail);
    const aU = new THREE.Object3D(), aBa = new THREE.Object3D(), aKr = new THREE.Object3D(), aN = new THREE.Object3D();
    [aU, aBa, aKr, aN].forEach(a => g.add(a));
    const lU = L.label(aU, 'U-235'), lBa = L.label(aBa, 'Ba-141'), lKr = L.label(aKr, 'Kr-92'), lN = L.label(aN, 'n', 'sc-lab-n');
    const lab = (l) => L.labels.find(e => e.l === l);
    const PER = 6.4, T_ABS = 1.3, T_SPLIT = 2.5;
    let t = reduce ? 4.0 : 0;
    const P = new THREE.Vector3(), C1 = new THREE.Vector3(), C2 = new THREE.Vector3();
    const R = base.reduce((m, p) => Math.max(m, p.length()), 0);
    L.update = (dt, snapT) => {
      t = snapT != null ? snapT : (t + dt) % PER;
      let pi = 0, ni = 0;
      const pre = t < T_SPLIT;
      const def = smooth((t - T_ABS) / (T_SPLIT - T_ABS));
      const stretch = 1 + 0.95 * def;
      const wob = t > T_ABS && t < T_SPLIT ? Math.sin((t - T_ABS) * 22) * 0.04 * def : 0;
      const ts = t - T_SPLIT;
      const sep = ts > 0 ? 1.0 + (1 - Math.exp(-ts * 1.1)) * 1.9 : 0;
      const k = smooth(ts / 0.6);
      C1.set(-sep, 0.05 * sep, 0); C2.set(sep * 1.05, -0.05 * sep, 0);
      for (let i = 0; i < 236; i++) {
        const b = base[i];
        let x = b.x * stretch, y = b.y, z = b.z;
        const pinch = 1 - 0.5 * def * Math.exp(-(b.x * b.x) / (R * R) * 3);
        y *= pinch / Math.pow(stretch, 0.3) + wob; z *= pinch / Math.pow(stretch, 0.3) - wob;
        P.set(x, y, z);
        let s = NR;
        if (i === 0 && t < T_ABS) { const u = t / T_ABS; P.set(-5 + (5 + b.x) * u, b.y * u + 0.25 * (1 - u), b.z * u); }
        if (!pre) {
          if (frag[i] === 3) { const d = tgt[i]; P.copy(d).multiplyScalar(ts * 3.2 + 0.1); }
          else { const T = tgt[i], Cc = frag[i] === 1 ? C1 : C2; V.copy(T).add(Cc); P.lerp(V, k); }
        }
        let fade = 1;
        if (t > PER - 0.7) fade = smooth((PER - t) / 0.7);
        if (t < 0.3 && i !== 0) fade = smooth(t / 0.3);
        MTX.compose(P, QI, SC.setScalar(s * Math.max(0.001, fade)));
        if (isP[i]) pIM.setMatrixAt(pi++, MTX); else nIM.setMatrixAt(ni++, MTX);
        if (i === 0) { aN.position.copy(P).add(V.set(0, 0.3, 0)); inTrail.position.copy(P); }
      }
      pIM.instanceMatrix.needsUpdate = true; nIM.instanceMatrix.needsUpdate = true;
      // neutrones libres (destellos azules)
      mid.forEach((id, j) => { trails[j].visible = !pre; trails[j].position.copy(tgt[id]).multiplyScalar(ts * 3.2 + 0.1); });
      inTrail.visible = t < T_ABS;
      // destello
      const fl = ts > 0 && ts < 0.9 ? Math.sin(Math.min(1, ts / 0.9) * Math.PI) : 0;
      L.fac.flash = { v: fl, t: fl, g: 0, gt: 0 };
      flash.scale.setScalar(1 + ts * 6);
      glow.scale.setScalar(pre ? 3.4 * (1 + 0.2 * def) : 2.5);
      L.fac.glow = { v: pre ? 1 : 0.35, t: 1, g: 0, gt: 0 };
      aU.position.set(0, R + 0.45, 0); aBa.position.copy(C1).add(V.set(0, 1.05, 0)); aKr.position.copy(C2).add(V.set(0, 0.95, 0));
      const endFade = t > PER - 0.7 ? smooth((PER - t) / 0.7) : 1;
      lab(lU).t = pre ? endFade : 0; lab(lBa).t = ts > 0.5 ? endFade : 0; lab(lKr).t = ts > 0.5 ? endFade : 0; lab(lN).t = t < T_ABS - 0.1 ? 1 : 0;
    };
    return L;
  }

  // ---------- panel ----------
  function renderPanel(s) {
    if (s.show === false) { panel.hidden = true; return; }
    panel.hidden = false;
    if (s.fission) {
      panel.innerHTML = '<div class="sc-pn-t">Fisión nuclear</div><div class="sc-pn-eq">U-235 + n → Ba-141 + Kr-92 + 3 n</div>';
      return;
    }
    const E0 = ELZ[s.Z] || EL.C;
    const A = s.Z + s.N, q = s.Z - s.E;
    const iso = s.N !== defaultN(s.Z);
    const name = iso ? E0.name + '-' + A : E0.name;
    const tag = q > 0 ? 'Catión (perdió ' + q + ' e⁻)' : q < 0 ? 'Anión (ganó ' + (-q) + ' e⁻)' : iso ? 'Isótopo' : 'Átomo neutro';
    panel.innerHTML = '<div class="sc-pn-top"><span class="sc-pn-az"><sup>' + A + '</sup><sub>' + s.Z + '</sub></span><b class="sc-pn-sym">' + esc(E0.sym) + '</b><sup class="sc-pn-q">' + (q ? (Math.abs(q) > 1 ? Math.abs(q) : '') + (q > 0 ? '+' : '−') : '') + '</sup>' +
      '<div class="sc-pn-id"><div class="sc-pn-n">' + esc(name) + '</div><div class="sc-pn-tag' + (q ? ' sc-ion' : '') + '">' + esc(tag) + '</div></div></div>' +
      '<div class="sc-pn-c"><span><i class="dot" style="background:#E5534B"></i>' + s.Z + ' p⁺</span><span><i class="dot" style="background:#A3AEB9"></i>' + s.N + ' n⁰</span><span><i class="dot" style="background:#6CD3FF"></i>' + s.E + ' e⁻</span></div>';
  }

  // ---------- estado ----------
  let layers = [];
  let cur = null, sway = 0, zoomT = 9.4, zoomAnim = 0;
  const keyOf = s => s.fission ? 'fission' : s.model === 'bohr' ? 'bohr' : s.model === 'dalton' ? 'dalton|' + s.Z : s.model === 'thomson' ? 'thomson|' + s.E : s.model === 'rutherford' ? 'rutherford|' + s.E : 'cloud|' + s.E;
  function build(s) {
    let L;
    if (s.fission) L = fissionLayer();
    else if (s.model === 'bohr') L = bohrLayer();
    else if (s.model === 'dalton') L = daltonLayer(s.Z);
    else if (s.model === 'thomson') L = thomsonLayer(s.E);
    else if (s.model === 'rutherford') L = rutherfordLayer(s.E);
    else L = cloudLayer(s.E);
    L.key = keyOf(s);
    return L;
  }
  function norm(state) {
    const s = Object.assign({ model: 'bohr', focus: null, fission: false, show: true }, state || {});
    s.Z = clamp(Math.round(s.Z == null ? 6 : +s.Z), 1, 36);
    s.N = s.N == null ? defaultN(s.Z) : clamp(Math.round(+s.N), 0, 60);
    s.E = s.E == null ? s.Z : clamp(Math.round(+s.E), 0, 40);
    if (['dalton', 'thomson', 'rutherford', 'bohr', 'cloud'].indexOf(s.model) < 0) s.model = 'bohr';
    return s;
  }
  function set(state) {
    const s = norm(state);
    const first = !cur;
    const key = keyOf(s);
    let L = layers.find(x => x.key === key && x.target === 1) || layers.find(x => x.key === key);
    if (!L) { L = build(s); layers.push(L); if (L.prewarm) L.prewarm(); }
    layers.forEach(x => { x.target = x === L ? 1 : 0; });
    if (L.configure) L.configure(s.Z, s.N, s.E, first || reduce || L.alpha === 0);
    if (L.focus) L.focus(s.focus);
    cur = s;
    renderPanel(s);
    const outer = RING[Math.max(0, shells(s.E).length - 1)];
    zoomT = (st.clientWidth < 560 ? 1.16 : 1) * (s.fission ? 9.6 : s.model === 'rutherford' ? 10.6 : s.model === 'bohr' || s.model === 'cloud' ? Math.max(7.6, (outer + 1.05) * 2.75) : 9.2); zoomAnim = 1.5;
    if (first || reduce) { o.zoom = zoomT; root.position.y = st.clientWidth < 560 && !panel.hidden ? -0.5 : 0; }
    if (first || reduce) {
      layers.forEach(x => { x.alpha = x.target; stepFac(x, 0); });
      tick(0, true);
    }
  }
  function tick(dt, snap) {
    for (let i = layers.length - 1; i >= 0; i--) {
      const L = layers[i];
      L.alpha += Math.sign(L.target - L.alpha) * Math.min(Math.abs(L.target - L.alpha), dt * 1.7);
      if (L.target === 0 && L.alpha <= 0) { killLayer(L); layers.splice(i, 1); continue; }
      stepFac(L, snap ? 0 : dt);
      if (L.update) L.update(dt, snap && L.kind === 'fission' ? 3.45 : undefined);
      applyAlpha(L, snap ? 0 : dt);
    }
  }
  o.tick = dt => {
    sway += dt;
    if (o.auto) { o.rot.y = Math.sin(sway * 0.35) * 0.45; root.rotation.y = o.rot.y; }
    const narrow = st.clientWidth < 560 && !panel.hidden;
    root.position.y += ((narrow ? -0.5 : 0) - root.position.y) * Math.min(1, dt * 4);
    if (zoomAnim > 0) { zoomAnim -= dt; o.zoom += (zoomT - o.zoom) * Math.min(1, dt * 3); }
    tick(dt, false);
  };
  return {
    set,
    dispose() {
      o.tick = null; layers.forEach(killLayer); layers = [];
      o.dispose(); cleanup(); sphere.dispose(); soft.dispose(); plus.dispose(); st.remove();
    }
  };
}
