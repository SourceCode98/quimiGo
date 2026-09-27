// Escena "particles": caja de vidrio 3D con partículas (sólido, líquido, gas, mezclas, disolución, presión).
import { THREE, EL, M, reduce, esc, fH, parseF, three } from '../widgets.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// Interior de la caja (unidades de escena)
const BW = 3.4, BH = 3.0, BD = 1.9;
const X0 = -BW / 2, X1 = BW / 2, Y0 = -BH / 2, Y1 = BH / 2, Z0 = -BD / 2, Z1 = BD / 2;
const FALLBACK = '#D8DEE4';

function softTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.25, 'rgba(255,255,255,.7)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function shadowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(0,0,0,.55)'); r.addColorStop(.6, 'rgba(0,0,0,.25)'); r.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

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
  o.scene.environment = env; o.scene.environmentIntensity = 0.75;
  const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(3, 6, 5); o.scene.add(key);
  const rim = new THREE.DirectionalLight(0x9fc4ff, 0.8); rim.position.set(-4, 2, -5); o.scene.add(rim);
  return { st, o, cleanup() { clearTimeout(hintT); env.dispose(); o.scene.remove(key); o.scene.remove(rim); } };
}

// ---------- especies ----------
function specTemplates(sp) {
  // Devuelve {templates:[{parts:[{el,p,r}], ext}], color, label, formula, els:[símbolos]}
  const f = String(sp.f || 'H2O');
  const m = M[f];
  const lbl = sp.label || (m ? m.n : EL[f] ? EL[f].name : f);
  if (m && m.ionic) {
    const els = [];
    m.a.forEach(a => { if (els.indexOf(a[0]) < 0) els.push(a[0]); });
    const templates = els.map((e, i) => ({ parts: [{ el: e, p: new THREE.Vector3(), r: i === 0 && els.length > 1 ? 0.72 : 1 }], ext: 1 }));
    return { templates, ionic: true, color: EL[els[els.length - 1]].css, label: lbl, formula: f, els };
  }
  if (m && m.a.length <= 16) {
    const c = m.a.reduce((s, a) => [s[0] + a[1], s[1] + a[2], s[2] + a[3]], [0, 0, 0]).map(v => v / m.a.length);
    const parts = m.a.map(a => ({ el: a[0], p: new THREE.Vector3(a[1] - c[0], a[2] - c[1], a[3] - c[2]), r: EL[a[0]].r3 * 1.45 }));
    const ext = Math.max.apply(null, parts.map(q => q.p.length() + q.r));
    let heavy = parts[0].el; parts.forEach(q => { if (EL[q.el].z > EL[heavy].z) heavy = q.el; });
    const els = []; parts.forEach(q => { if (els.indexOf(q.el) < 0) els.push(q.el); });
    return { templates: [{ parts, ext }], color: EL[heavy].css, label: lbl, formula: f, els };
  }
  if (EL[f]) return { templates: [{ parts: [{ el: f, p: new THREE.Vector3(), r: 1 }], ext: 1 }], color: EL[f].css, label: lbl, formula: f, els: [f] };
  // fórmula desconocida: esfera genérica
  let els = [];
  try { els = Object.keys(parseF(f)).filter(e => EL[e]); } catch (e) { els = []; }
  return { templates: [{ parts: [{ el: null, p: new THREE.Vector3(), r: 1 }], ext: 1 }], color: FALLBACK, label: lbl, formula: f, els: [] };
}

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export default function (el) {
  const { st, o, cleanup } = setup(el);
  const legend = document.createElement('div'); legend.className = 'legend sc-legend'; el.appendChild(legend);
  if (!o) {
    return { set(s) { legend.innerHTML = ''; }, dispose() { st.remove(); legend.remove(); } };
  }
  const meter = document.createElement('div'); meter.className = 'sc-meter'; meter.hidden = true;
  meter.innerHTML = '<span>Choques/s</span><b>0</b>'; st.appendChild(meter);
  const meterB = meter.querySelector('b');

  o.zoom = 8.4; o.rot.x = 0.36; o.rot.y = 0.45;
  const root = o.root;
  const sphereGeo = new THREE.SphereGeometry(1, 20, 14);
  const soft = softTexture(), shadowT = shadowTexture();
  const V = new THREE.Vector3(), V2 = new THREE.Vector3(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), MTX = new THREE.Matrix4();

  // ---------- caja de vidrio ----------
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.1, roughness: 0.05, metalness: 0, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.2 });
  const box = new THREE.Group(); root.add(box);
  const T = 0.03; // separación del vidrio respecto al interior
  const faces = [];
  const addFace = (w, h, pos, rot) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glassMat); m.position.copy(pos); m.rotation.set(rot[0], rot[1], rot[2]); m.renderOrder = 5; box.add(m); faces.push(m); return m; };
  addFace(BW + 2 * T, BH + T, new THREE.Vector3(0, 0, Z1 + T), [0, 0, 0]);
  addFace(BW + 2 * T, BH + T, new THREE.Vector3(0, 0, Z0 - T), [0, 0, 0]);
  addFace(BD + 2 * T, BH + T, new THREE.Vector3(X1 + T, 0, 0), [0, Math.PI / 2, 0]);
  addFace(BD + 2 * T, BH + T, new THREE.Vector3(X0 - T, 0, 0), [0, Math.PI / 2, 0]);
  const floorMat = new THREE.MeshPhysicalMaterial({ color: 0x9fc4e8, transparent: true, opacity: 0.22, roughness: 0.2, clearcoat: 1, depthWrite: false });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(BW + 2 * T, 0.06, BD + 2 * T), floorMat); floor.position.y = Y0 - T - 0.03; floor.renderOrder = 4; box.add(floor);
  const lidMat = glassMat.clone(); lidMat.opacity = 0.12;
  const lid = new THREE.Mesh(new THREE.PlaneGeometry(BW + 2 * T, BD + 2 * T), lidMat); lid.rotation.x = -Math.PI / 2; lid.position.y = Y1 + T; lid.renderOrder = 5; box.add(lid);
  // aristas finas y brillantes
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0xd8ecff, emissive: 0x284860, roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.75 });
  const edgeGeoV = new THREE.CylinderGeometry(0.018, 0.018, BH + 2 * T, 8);
  const edgeGeoX = new THREE.CylinderGeometry(0.018, 0.018, BW + 2 * T, 8);
  const edgeGeoZ = new THREE.CylinderGeometry(0.018, 0.018, BD + 2 * T, 8);
  const topEdges = [];
  [[X0 - T, Z0 - T], [X1 + T, Z0 - T], [X0 - T, Z1 + T], [X1 + T, Z1 + T]].forEach(([x, z]) => { const e = new THREE.Mesh(edgeGeoV, edgeMat); e.position.set(x, 0, z); box.add(e); });
  [Y0 - T, Y1 + T].forEach(y => {
    [Z0 - T, Z1 + T].forEach(z => { const e = new THREE.Mesh(edgeGeoX, edgeMat); e.rotation.z = Math.PI / 2; e.position.set(0, y, z); box.add(e); if (y > 0) topEdges.push(e); });
    [X0 - T, X1 + T].forEach(x => { const e = new THREE.Mesh(edgeGeoZ, edgeMat); e.rotation.x = Math.PI / 2; e.position.set(x, y, 0); box.add(e); if (y > 0) topEdges.push(e); });
  });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(BW * 1.9, BD * 2.6), new THREE.MeshBasicMaterial({ map: shadowT, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = Y0 - 0.12; shadow.renderOrder = 1; root.add(shadow);

  // ---------- émbolo ----------
  const piston = new THREE.Group(); root.add(piston);
  const metal = new THREE.MeshStandardMaterial({ color: 0xaab4bf, metalness: 0.85, roughness: 0.3, transparent: true, opacity: 1 });
  const plateMat = new THREE.MeshStandardMaterial({ color: 0x8a96a3, metalness: 0.7, roughness: 0.35, transparent: true, opacity: 1 });
  const plate = new THREE.Mesh(new THREE.BoxGeometry(BW - 0.02, 0.12, BD - 0.02), plateMat); plate.position.y = 0.06; piston.add(plate);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1, 16), metal); piston.add(rod);
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.1, 24), metal); piston.add(knob);
  piston.visible = false;
  let pistonAlpha = 0;

  // ---------- destellos de choque ----------
  const flashMat = new THREE.SpriteMaterial({ map: soft, color: 0xffe08a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const flashes = [];
  for (let i = 0; i < 18; i++) { const s = new THREE.Sprite(flashMat.clone()); s.visible = false; s.renderOrder = 8; root.add(s); flashes.push({ s, life: 0 }); }
  let flashIx = 0;
  const flash = (x, y, z) => { const f = flashes[flashIx++ % flashes.length]; f.s.position.set(x, y, z); f.life = 1; f.s.visible = true; };

  // ---------- franjas (layers) ----------
  let bands = []; // {mesh, lab}
  const clearBands = () => { bands.forEach(b => { root.remove(b.mesh); b.mesh.geometry.dispose(); b.mesh.material.dispose(); unlabel(b.anchor); root.remove(b.anchor); }); bands = []; };
  function unlabel(obj) { o.labels = o.labels.filter(l => { if (l.obj === obj) { l.d.remove(); return false; } return true; }); }

  // ---------- cuerpo del líquido (solo en disolución) ----------
  const liqMat = new THREE.MeshPhysicalMaterial({ color: 0x6fb6ff, transparent: true, opacity: 0, roughness: 0.1, clearcoat: 1, depthWrite: false });
  const liq = new THREE.Mesh(new THREE.BoxGeometry(BW - 0.01, 1, BD - 0.01), liqMat); liq.renderOrder = 3; liq.visible = false; root.add(liq);
  let liqLevel = null, liqTarget = null, liqCur = Y0, liqAlpha = 0;

  // ---------- estado de simulación ----------
  let S0 = { phase: 'gas', temp: 0.5, vol: 1, layout: 'mixed', dissolve: 0 };
  let pops = []; // poblaciones (la última es la activa)
  let volCur = 1, volTarget = 1, showPiston = false, lidOn = true, pressureOn = false;
  let hits = 0, rate = 0, rateAcc = 0, time = 0;
  let D = 0.6; // diámetro de colisión actual

  function makePop(species) {
    const defs = species.map(specTemplates);
    const N = Math.min(90, species.reduce((s, sp) => s + Math.max(0, Math.round(sp.n == null ? 12 : sp.n)), 0));
    const d = clamp(Math.cbrt(0.4 * BW * BH * BD * 0.55 / (Math.max(1, N) * 0.5236)), 0.4, 0.72);
    const particles = [];
    const groups = []; // instanced meshes
    const meshMap = {}; // key -> {mesh, count}
    species.forEach((sp, si) => {
      const n = Math.max(0, Math.min(60, Math.round(sp.n == null ? 12 : sp.n)));
      const def = defs[si];
      for (let k = 0; k < n; k++) {
        const ti = def.ionic ? k % def.templates.length : 0;
        particles.push({ si, ti, p: new THREE.Vector3(), v: new THREE.Vector3(), q: new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd(0, 6.3), rnd(0, 6.3), rnd(0, 6.3))), w: new THREE.Vector3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)), home: new THREE.Vector3(), beh: 'gas', ph: rnd(0, 6.3), lo: Y0, hi: Y1, rank: 0 });
      }
    });
    // instanced meshes por especie/plantilla/elemento
    species.forEach((sp, si) => {
      const def = defs[si];
      def.templates.forEach((tp, ti) => {
        const cnt = particles.filter(p => p.si === si && p.ti === ti).length;
        const scale = d * (tp.parts.length > 1 ? 0.56 : def.ionic ? 0.42 : 0.4) / tp.ext;
        const byEl = {};
        tp.parts.forEach((pt, pi) => { const k = pt.el || '?'; (byEl[k] = byEl[k] || []).push(pi); });
        Object.keys(byEl).forEach(e => {
          const E = EL[e];
          const mat = new THREE.MeshStandardMaterial({ color: E ? E.hex : 0xd8dee4, roughness: 0.32, metalness: 0.05, envMapIntensity: 0.9 });
          if (E && (e === 'H' || e === 'He')) mat.roughness = 0.25;
          const mesh = new THREE.InstancedMesh(sphereGeo, mat, Math.max(1, cnt * byEl[e].length));
          mesh.count = cnt * byEl[e].length; mesh.frustumCulled = false; mesh.renderOrder = 2;
          root.add(mesh);
          groups.push({ mesh, si, ti, parts: byEl[e].map(pi => tp.parts[pi]), scale });
        });
      });
    });
    return { defs, particles, groups, d, appear: 0, target: 1 };
  }
  function killPop(pop) { pop.groups.forEach(g => { root.remove(g.mesh); g.mesh.material.dispose(); g.mesh.dispose(); }); }

  // ---------- lógica de posiciones objetivo ----------
  function latticeHomes(count, sp, cx, cz, maxX, maxZ) {
    const nx = Math.max(1, Math.min(maxX, Math.floor((BW - 0.1) / sp)));
    const nz = Math.max(1, Math.min(maxZ, Math.floor((BD - 0.1) / sp)));
    const per = nx * nz; const out = [];
    for (let i = 0; i < count; i++) {
      const layer = Math.floor(i / per), r = i % per, ix = r % nx, iz = Math.floor(r / nx);
      out.push(new THREE.Vector3(cx + (ix - (nx - 1) / 2) * sp, Y0 + sp / 2 + layer * sp, cz + (iz - (nz - 1) / 2) * sp));
    }
    return out;
  }
  function cubeHomes(count, sp) {
    // cristal compacto centrado en el fondo, con celdas alternadas para iónicos
    const n = Math.max(1, Math.ceil(Math.cbrt(count)));
    const nz = Math.min(n, Math.max(1, Math.floor((BD - 0.1) / sp)));
    const nx = n;
    const layers = Math.ceil(count / (nx * nz)) + 1;
    const cells = [];
    for (let y = 0; y < layers; y++) for (let z = 0; z < nz; z++) for (let x = 0; x < nx; x++) cells.push({ x, y, z, par: (x + y + z) & 1 });
    return { cells, nx, nz, sp };
  }

  function assign(state) {
    const pop = pops[pops.length - 1]; if (!pop) return;
    const d = pop.d; D = d;
    const phase = state.phase || 'gas', layout = state.layout || 'mixed';
    const P = pop.particles;
    const ceil = Y0 + BH * volTarget;
    // bandas para 'layers'
    let bandsY = null;
    if (layout === 'layers') {
      const counts = pop.defs.map((_, si) => P.filter(p => p.si === si).length);
      let y = Y0; bandsY = counts.map(c => { const h = Math.max(d * 1.15, c * 0.5236 * d * d * d / (0.5 * BW * BD)) + 0.08; const r = [y, y + h]; y += h; return r; });
      const top = bandsY[bandsY.length - 1][1];
      if (top > ceil) { const k = (ceil - Y0) / (top - Y0); bandsY = bandsY.map(([a, b]) => [Y0 + (a - Y0) * k, Y0 + (b - Y0) * k]); }
    }
    // hogares de sólido
    if (layout === 'dissolve') {
      const sol = P.filter(p => p.si === 0);
      const c = cubeHomes(sol.length, d * 1.02);
      const ionic = pop.defs[0] && pop.defs[0].ionic;
      // asigna celdas: iónicos por paridad
      const used = new Array(c.cells.length).fill(false);
      sol.forEach((p, i) => {
        let j = -1;
        for (let k = 0; k < c.cells.length; k++) if (!used[k] && (!ionic || c.cells[k].par === p.ti)) { j = k; break; }
        if (j < 0) for (let k = 0; k < c.cells.length; k++) if (!used[k]) { j = k; break; }
        used[j] = true; const cl = c.cells[j];
        p.home.set((cl.x - (c.nx - 1) / 2) * c.sp, Y0 + c.sp / 2 + cl.y * c.sp, (cl.z - (c.nz - 1) / 2) * c.sp);
      });
      // orden de liberación: primero los de afuera (más lejos del centro del cristal)
      const cy = sol.reduce((s, p) => s + p.home.y, 0) / Math.max(1, sol.length);
      const ranked = sol.slice().sort((a, b) => V.set(b.home.x, b.home.y - cy, b.home.z).lengthSq() - V2.set(a.home.x, a.home.y - cy, a.home.z).lengthSq() || b.home.y - a.home.y);
      const k = Math.round(clamp(state.dissolve == null ? 0 : +state.dissolve, 0, 1) * sol.length);
      ranked.forEach((p, i) => { p.beh = i < k ? 'solute' : 'crystal'; });
      P.filter(p => p.si !== 0).forEach(p => { p.beh = phase === 'gas' ? 'gas' : 'liquid'; });
      // nivel del líquido (solución) y hogares repartidos para el soluto disuelto
      liqLevel = Y0 + clamp(P.length * 0.5236 * d * d * d / (0.5 * BW * BD) + d * 0.4, d * 2.2, BH * 0.72);
      const rel = ranked.slice(0, k); const cols = Math.max(1, Math.ceil(Math.sqrt(rel.length * 1.6)));
      rel.forEach((p, i) => {
        const cx = (i % cols + 0.5) / cols, cz = ((i * 7) % 3 + 0.5) / 3, cy = ((i * 5) % 4 + 0.5) / 4;
        p.home.set(X0 + d / 2 + cx * (BW - d), Y0 + d / 2 + cy * (liqLevel - Y0 - d), Z0 + d / 2 + cz * (BD - d));
      });
    } else {
      // intercala especies en la red para 'mixed'
      const order = layout === 'layers' ? P.slice() : interleave(P);
      const homes = latticeHomes(order.length, d * 1.03, 0, 0, 99, 99);
      if (layout === 'layers') {
        pop.defs.forEach((_, si) => {
          const sub = P.filter(p => p.si === si); const [lo] = bandsY[si];
          const hs = latticeHomes(sub.length, d * 1.03, 0, 0, 99, 99);
          sub.forEach((p, i) => p.home.set(hs[i].x, hs[i].y - Y0 + lo, hs[i].z));
        });
      } else order.forEach((p, i) => p.home.copy(homes[i]));
      P.forEach(p => { p.beh = phase === 'solid' ? 'solid' : phase === 'liquid' || layout === 'layers' ? 'liquid' : 'gas'; });
      if (layout === 'layers' && phase === 'solid') P.forEach(p => { p.beh = 'solid'; });
    }
    if (layout !== 'dissolve') liqLevel = null;
    P.forEach(p => { if (bandsY) { p.lo = bandsY[p.si][0]; p.hi = bandsY[p.si][1]; } else { p.lo = Y0; p.hi = liqLevel && p.beh !== 'gas' ? liqLevel : Y1; } });
    liqTarget = liqLevel ? liqLevel : null;
    // visuales de franjas
    clearBands();
    if (bandsY) {
      bandsY.forEach(([lo, hi], si) => {
        const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(pop.defs[si].color), transparent: true, opacity: 0.1, depthWrite: false, roughness: 0.4 });
        const m = new THREE.Mesh(new THREE.BoxGeometry(BW, hi - lo, BD), mat); m.position.y = (lo + hi) / 2; m.renderOrder = 3; root.add(m);
        const anchor = new THREE.Object3D(); anchor.position.set(X1 + 0.1, (lo + hi) / 2, Z1); root.add(anchor);
        o.label(anchor, pop.defs[si].label); const L = o.labels[o.labels.length - 1]; L.d.classList.add('sc-lab-side');
        bands.push({ mesh: m, anchor, alpha: 0 });
      });
    }
  }
  function interleave(P) {
    const by = {}; P.forEach(p => { (by[p.si + ':' + p.ti] = by[p.si + ':' + p.ti] || []).push(p); });
    const lists = Object.keys(by).map(k => by[k]); const out = [];
    let any = true, i = 0; while (any) { any = false; lists.forEach(l => { if (i < l.length) { out.push(l[i]); any = true; } }); i++; }
    return out;
  }

  function scatter(pop, state) {
    // posiciones iniciales razonables para cada comportamiento
    const r = pop.d / 2; const ceil = Y0 + BH * volTarget;
    pop.particles.forEach(p => {
      if (p.beh === 'solid' || p.beh === 'crystal') p.p.copy(p.home);
      else if (p.beh === 'gas') p.p.set(rnd(X0 + r, X1 - r), rnd(Y0 + r, ceil - r), rnd(Z0 + r, Z1 - r));
      else p.p.set(rnd(X0 + r, X1 - r), rnd(Math.max(p.lo, Y0) + r, Math.min(p.hi, ceil, Y0 + 1.4) - r), rnd(Z0 + r, Z1 - r));
      const a = rnd(0, 6.3), b = rnd(-1, 1); p.v.set(Math.cos(a) * Math.sqrt(1 - b * b), b, Math.sin(a) * Math.sqrt(1 - b * b)).multiplyScalar(speedFor(state.temp));
    });
  }
  const speedFor = t => 1.1 + clamp(t == null ? 0.5 : +t, 0, 1) * 3.4;

  // ---------- física ----------
  function step(dt, temp, record) {
    const pop = pops[pops.length - 1]; if (!pop) return;
    const P = pop.particles, d = pop.d, r = d / 2, n = P.length;
    const ceil = Y0 + BH * volCur;
    const tSp = speedFor(temp), kick = 0.7 + clamp(temp, 0, 1) * 2.4, amp = 0.015 + clamp(temp, 0, 1) * 0.07;
    time += dt;
    for (let i = 0; i < n; i++) {
      const p = P[i];
      if (p.beh === 'solid' || p.beh === 'crystal') {
        const tx = p.home.x + Math.sin(time * 23 + p.ph) * amp, ty = p.home.y + Math.sin(time * 19 + p.ph * 2) * amp, tz = p.home.z + Math.sin(time * 21 + p.ph * 3) * amp;
        const k = 55, c = 2 * Math.sqrt(k);
        p.v.x += (k * (tx - p.p.x) - c * p.v.x) * dt; p.v.y += (k * (ty - p.p.y) - c * p.v.y) * dt; p.v.z += (k * (tz - p.p.z) - c * p.v.z) * dt;
        Q.identity(); p.q.slerp(Q, Math.min(1, dt * 3));
      } else if (p.beh === 'solute') {
        const k = 2.2, c = 1.6;
        p.v.x += (k * (p.home.x - p.p.x) - c * p.v.x) * dt; p.v.y += (k * (p.home.y - p.p.y) - c * p.v.y) * dt; p.v.z += (k * (p.home.z - p.p.z) - c * p.v.z) * dt;
        const sq = Math.sqrt(dt) * kick * 0.8; p.v.x += rnd(-1, 1) * sq; p.v.y += rnd(-1, 1) * sq; p.v.z += rnd(-1, 1) * sq;
        rotate(p, dt, 0.8 + temp * 1.5);
      } else if (p.beh === 'liquid') {
        p.v.y -= (liqLevel != null ? 2.5 : 7) * dt;
        const damp = Math.exp(-2.2 * dt); p.v.multiplyScalar(damp);
        const sq = Math.sqrt(dt) * kick; p.v.x += rnd(-1, 1) * sq; p.v.y += rnd(-1, 1) * sq * 0.6; p.v.z += rnd(-1, 1) * sq;
        rotate(p, dt, 0.8 + temp * 1.5);
      } else {
        const sp = p.v.length();
        if (sp < 0.05) p.v.set(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).setLength(tSp);
        else p.v.multiplyScalar(1 + (tSp / sp - 1) * Math.min(1, dt * 1.6));
        rotate(p, dt, 1.5 + temp * 3);
      }
      p.p.addScaledVector(p.v, dt);
    }
    // choques entre partículas
    const d2 = d * d;
    for (let i = 0; i < n; i++) {
      const a = P[i];
      for (let j = i + 1; j < n; j++) {
        const b = P[j];
        const dx = b.p.x - a.p.x, dy = b.p.y - a.p.y, dz = b.p.z - a.p.z, q = dx * dx + dy * dy + dz * dz;
        if (q >= d2 || q < 1e-9) continue;
        const dist = Math.sqrt(q), nx = dx / dist, ny = dy / dist, nz = dz / dist, over = d - dist;
        const fa = a.beh === 'crystal' || a.beh === 'solid' ? 0 : 1, fb = b.beh === 'crystal' || b.beh === 'solid' ? 0 : 1;
        const tot = fa + fb || 1; const wa = fa / tot, wb = fb / tot;
        if (fa + fb === 0) continue;
        a.p.x -= nx * over * wa; a.p.y -= ny * over * wa; a.p.z -= nz * over * wa;
        b.p.x += nx * over * wb; b.p.y += ny * over * wb; b.p.z += nz * over * wb;
        const rv = (b.v.x - a.v.x) * nx + (b.v.y - a.v.y) * ny + (b.v.z - a.v.z) * nz;
        if (rv < 0) {
          const e = a.beh === 'gas' && b.beh === 'gas' ? 1 : 0.2;
          const jn = -(1 + e) * rv / (fa && fb ? 2 : 1);
          if (fa) { a.v.x -= jn * nx; a.v.y -= jn * ny; a.v.z -= jn * nz; }
          if (fb) { b.v.x += jn * nx; b.v.y += jn * ny; b.v.z += jn * nz; }
        }
      }
    }
    // paredes
    for (let i = 0; i < n; i++) {
      const p = P[i]; if (p.beh === 'crystal' || p.beh === 'solid') continue;
      const e = p.beh === 'gas' ? 1 : 0.25;
      const lo = Math.max(Y0, p.lo) + r, hi = Math.min(ceil, p.hi) - r;
      wall(p, 'x', X0 + r, X1 - r, e, record, r);
      wall(p, 'z', Z0 + r, Z1 - r, e, record, r);
      wall(p, 'y', lo, Math.max(lo, hi), e, record, r);
    }
  }
  function wall(p, ax, lo, hi, e, record, r) {
    const gas = p.beh === 'gas';
    if (p.p[ax] < lo) { p.p[ax] = lo; if (p.v[ax] < 0) { if (gas && record) hit(p, ax, -r); p.v[ax] = -p.v[ax] * e; } }
    else if (p.p[ax] > hi) { p.p[ax] = hi; if (p.v[ax] > 0) { if (gas && record) hit(p, ax, r); p.v[ax] = -p.v[ax] * e; } }
  }
  function hit(p, ax, off) {
    hits++;
    if (pressureOn && Math.abs(p.v[ax]) > 0.6) { V.copy(p.p); V[ax] += off; flash(V.x, V.y, V.z); }
  }
  function rotate(p, dt, s) {
    const l = p.w.length(); if (l < 1e-6) return;
    Q.setFromAxisAngle(V.copy(p.w).divideScalar(l), l * s * dt); p.q.premultiply(Q);
  }

  // ---------- dibujo ----------
  function draw(pop) {
    const a = pop.appear; const ease = a * a * (3 - 2 * a);
    pop.groups.forEach(g => {
      let k = 0;
      pop.particles.forEach(p => {
        if (p.si !== g.si || p.ti !== g.ti) return;
        g.parts.forEach(pt => {
          V.copy(pt.p).multiplyScalar(g.scale).applyQuaternion(p.q).add(p.p);
          const s = pt.r * g.scale * ease;
          MTX.compose(V, p.q, S.set(s, s, s)); g.mesh.setMatrixAt(k++, MTX);
        });
      });
      g.mesh.instanceMatrix.needsUpdate = true;
    });
  }

  // ---------- leyenda ----------
  function renderLegend(state) {
    const sp = state.empty ? [] : (state.species || []);
    if (!sp.length) { legend.innerHTML = ''; legend.hidden = true; return; }
    legend.hidden = false;
    legend.innerHTML = sp.map(s => {
      const d = specTemplates(s);
      const dots = (d.els.length ? d.els : [null]).map(e => '<i class="dot" style="background:' + (e ? EL[e].css : FALLBACK) + '"></i>').join('');
      const showF = d.formula && d.formula !== d.label && (M[d.formula] || (!s.label && (EL[d.formula] || /\d/.test(d.formula))));
      return '<span>' + dots + esc(d.label) + (showF ? ' <small class="sc-f">' + fH(d.formula) + '</small>' : '') + '</span>';
    }).join('');
  }

  let cur = null, sway = 0;
  const specKey = s => s.empty ? 'empty' : JSON.stringify((s.species || []).map(x => [x.f, x.n == null ? 12 : x.n, x.label]));

  function apply(state, prev) {
    const s = Object.assign({ phase: 'gas', temp: 0.5, layout: 'mixed', dissolve: 0, lid: true, empty: false, pressure: false }, state || {});
    if (!state || !state.phase) s.phase = s.layout === 'dissolve' || s.layout === 'layers' ? 'liquid' : 'gas';
    if (!s.species || !s.species.length) s.species = [{ f: 'H2O', n: 12 }];
    const first = !cur;
    volTarget = s.vol == null ? 1 : clamp(+s.vol, 0.3, 1);
    showPiston = volTarget < 0.999 || (s.vol != null && s.pressure);
    lidOn = s.lid !== false;
    pressureOn = !!s.pressure;
    meter.hidden = !pressureOn;
    const key = specKey(s);
    const newPop = !cur || specKey(cur) !== key;
    if (newPop) {
      pops.forEach(p => { p.target = 0; });
      if (!s.empty) { const pop = makePop(s.species); pops.push(pop); }
    }
    cur = s;
    if (s.empty) { clearBands(); }
    else {
      assign(s);
      const pop = pops[pops.length - 1];
      if (newPop) {
        if (first || reduce) volCur = volTarget;
        scatter(pop, s);
        const ceil = volCur; volCur = volTarget; // asentar con el volumen final
        for (let i = 0; i < 120; i++) step(1 / 40, +s.temp, false);
        volCur = first || reduce ? volTarget : ceil;
      } else if (prev && prev.phase === 'solid' && s.phase === 'gas') {
        // sublimar/evaporar: un empujón inicial
        pop.particles.forEach(p => p.v.y += rnd(1, 3));
      }
    }
    renderLegend(s);
    if (first || reduce) { snap(); }
  }
  function snap() {
    volCur = volTarget;
    pops.forEach(p => { p.appear = p.target; });
    pops = pops.filter(p => { if (p.appear <= 0) { killPop(p); return false; } return true; });
    pistonAlpha = showPiston ? 1 : 0;
    bands.forEach(b => { b.alpha = 1; });
    visuals(0);
  }

  function visuals(dt) {
    // émbolo
    pistonAlpha += ((showPiston ? 1 : 0) - pistonAlpha) * Math.min(1, dt * 5);
    if (dt === 0) pistonAlpha = showPiston ? 1 : 0;
    piston.visible = pistonAlpha > 0.02;
    const py = Y0 + BH * volCur;
    piston.position.y = py + (1 - pistonAlpha) * 0.9;
    metal.opacity = plateMat.opacity = pistonAlpha;
    const rodLen = Math.max(0.3, Y1 + 0.6 - py);
    rod.scale.y = rodLen; rod.position.y = 0.12 + rodLen / 2; knob.position.y = 0.12 + rodLen + 0.05;
    lid.visible = lidOn && !piston.visible;
    topEdges.forEach(e => { e.visible = true; });
    // líquido
    const lt = liqTarget == null ? 0 : 1;
    liqAlpha += (lt - liqAlpha) * (dt === 0 ? 1 : Math.min(1, dt * 3));
    if (liqTarget != null) liqCur += (liqTarget - liqCur) * (dt === 0 ? 1 : Math.min(1, dt * 3));
    liq.visible = liqAlpha > 0.01; liqMat.opacity = 0.16 * liqAlpha;
    const lh = Math.max(0.01, liqCur - Y0); liq.scale.y = lh; liq.position.y = Y0 + lh / 2;
    // franjas
    bands.forEach(b => { b.alpha += (1 - b.alpha) * Math.min(1, dt * 3 || 1); b.mesh.material.opacity = 0.1 * b.alpha; });
    // poblaciones
    pops.forEach(p => draw(p));
    // destellos
    flashes.forEach(f => {
      if (!pressureOn) f.life = 0;
      if (f.life <= 0) { f.s.visible = false; return; }
      f.life -= dt * 3.2; const l = Math.max(0, f.life);
      f.s.material.opacity = l * 0.95; const sc = 0.2 + (1 - l) * 0.35; f.s.scale.set(sc, sc, sc);
      if (!pressureOn) f.life = 0;
    });
  }

  o.tick = dt => {
    sway += dt;
    if (o.auto) { o.rot.y = 0.45 + Math.sin(sway * 0.3) * 0.35; root.rotation.y = o.rot.y; }
    volCur += (volTarget - volCur) * Math.min(1, dt * 2.2);
    const temp = cur ? +cur.temp || 0 : 0.5;
    const pop = pops[pops.length - 1];
    if (pop && cur && !cur.empty) { step(dt / 2, temp, true); step(dt / 2, temp, true); }
    pops.forEach(p => { p.appear += Math.sign(p.target - p.appear) * Math.min(Math.abs(p.target - p.appear), dt * 2.5); });
    pops = pops.filter(p => { if (p.target === 0 && p.appear <= 0) { killPop(p); return false; } return true; });
    // choques por segundo
    rateAcc += dt;
    if (rateAcc >= 0.5) { const inst = hits / rateAcc; rate = rate ? rate * 0.5 + inst * 0.5 : inst; hits = 0; rateAcc = 0; if (pressureOn) meterB.textContent = String(Math.round(rate)); }
    visuals(dt);
  };

  return {
    set(state, prev) {
      apply(state, prev);
      if (reduce && pressureOn) {
        // estimación estática de choques por segundo
        hits = 0; for (let i = 0; i < 40; i++) step(1 / 40, +cur.temp || 0, true);
        meterB.textContent = String(Math.round(hits)); hits = 0; snap();
      }
    },
    dispose() {
      o.tick = null; clearBands(); pops.forEach(killPop); pops = [];
      o.dispose(); cleanup(); sphereGeo.dispose(); soft.dispose(); shadowT.dispose(); flashes.forEach(f => f.s.material.dispose());
      st.remove(); legend.remove();
    }
  };
}
