// Escena "column": probeta 3D con capas de líquidos por densidad y objetos que flotan o se hunden.
import { THREE, reduce, esc, three } from '../widgets.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const RI = 0.62, RO = 0.665, Y0 = -1.95, H = 3.9, YT = Y0 + H, FILL = 3.05;
const OS = 1.3; // escala de los objetos
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const dens = d => (Math.round(d * 100) / 100).toFixed(2).replace('.', ',') + ' g/cm³';
const plain = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

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
  o.scene.environment = env; o.scene.environmentIntensity = 0.85;
  const key = new THREE.DirectionalLight(0xffffff, 1.7); key.position.set(3, 5, 6); o.scene.add(key);
  const rim = new THREE.DirectionalLight(0xa8c8ff, 1.0); rim.position.set(-5, 2, -4); o.scene.add(rim);
  return { st, o, cleanup() { clearTimeout(hintT); env.dispose(); o.scene.remove(key); o.scene.remove(rim); } };
}

// Forma del objeto según su nombre
function objMesh(ob) {
  const n = plain(ob.n), col = new THREE.Color(ob.c || '#C0C8D0');
  let geo, mat, h = 0.28, rot = null;
  const std = (extra) => new THREE.MeshPhysicalMaterial(Object.assign({ color: col, roughness: 0.45, clearcoat: 0.3 }, extra || {}));
  if (/corcho|tapon/.test(n)) { geo = new THREE.CylinderGeometry(0.15, 0.13, 0.26, 24); mat = std({ roughness: 0.9, clearcoat: 0 }); h = 0.26; rot = [0.25, 0, 0.35]; }
  else if (/moneda|metal|arandela/.test(n)) { geo = new THREE.CylinderGeometry(0.17, 0.17, 0.045, 32); mat = std({ metalness: 0.9, roughness: 0.28, clearcoat: 0.6 }); h = 0.1; rot = [0.35, 0, 0.2]; }
  else if (/hielo|cubo/.test(n)) { geo = new THREE.BoxGeometry(0.27, 0.27, 0.27); mat = std({ color: new THREE.Color(ob.c || '#DDF3FF'), roughness: 0.08, transparent: true, opacity: 0.72, clearcoat: 1 }); h = 0.27; rot = [0.2, 0.5, 0.1]; }
  else if (/huevo/.test(n)) { geo = new THREE.SphereGeometry(0.14, 24, 18); geo.scale(1, 1.3, 1); mat = std({ roughness: 0.6 }); h = 0.36; }
  else if (/madera|tabla|bloque|lego|plastico/.test(n)) { geo = new THREE.BoxGeometry(0.3, 0.18, 0.22); mat = std({ roughness: 0.7 }); h = 0.18; rot = [0, 0.4, 0.1]; }
  else if (/piedra|roca|grava/.test(n)) { geo = new THREE.DodecahedronGeometry(0.15, 0); mat = std({ roughness: 0.95, flatShading: true, clearcoat: 0 }); h = 0.28; rot = [0.3, 0.2, 0.5]; }
  else if (/tornillo|clavo|tuerca/.test(n)) { geo = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 12); mat = std({ metalness: 0.85, roughness: 0.35 }); h = 0.18; rot = [0, 0, 1.1]; }
  else if (/uva|arveja|bola|pelota|canica|esfera|tomate|mora/.test(n)) { geo = new THREE.SphereGeometry(0.14, 28, 20); mat = std({ roughness: 0.25, clearcoat: 0.9 }); h = 0.28; }
  else { geo = new THREE.SphereGeometry(0.14, 28, 20); mat = std({ roughness: 0.35 }); h = 0.28; }
  const mesh = new THREE.Mesh(geo, mat); if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
  mesh.renderOrder = 3;
  return { mesh, h: h * OS };
}

export default function (el) {
  const { st, o, cleanup } = setup(el);
  if (!o) return { set() {}, dispose() { st.remove(); } };
  o.zoom = 8.6; o.rot.x = 0.16; o.rot.y = 0;
  const root = o.root;
  const V = new THREE.Vector3(), W = new THREE.Vector3();

  // ---------- capa HTML de etiquetas ----------
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('class', 'sc-lead'); st.appendChild(svg);
  const tags = []; // {div, line, dot, side, getY, alpha, target, owner}
  function tag(side, html) {
    const d = document.createElement('div'); d.className = 'sc-tag sc-tag-' + side; d.innerHTML = html; st.appendChild(d);
    const line = document.createElementNS(svgNS, 'line'); const dot = document.createElementNS(svgNS, 'circle'); dot.setAttribute('r', '2.5');
    svg.appendChild(line); svg.appendChild(dot);
    const t = { div: d, line, dot, side, a: 0, y: 0 }; tags.push(t); return t;
  }
  function untag(t) { t.div.remove(); t.line.remove(); t.dot.remove(); const i = tags.indexOf(t); if (i >= 0) tags.splice(i, 1); }

  // ---------- probeta ----------
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xe6f2ff, transparent: true, opacity: 0.16, roughness: 0.04, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.4 });
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(RO, RO, H, 64, 1, true), glassMat); tube.position.y = Y0 + H / 2; tube.renderOrder = 10; root.add(tube);
  const bottom = new THREE.Mesh(new THREE.CylinderGeometry(RO, RO, 0.08, 64), glassMat); bottom.position.y = Y0 - 0.04; bottom.renderOrder = 10; root.add(bottom);
  const rimMat = new THREE.MeshPhysicalMaterial({ color: 0xf2f8ff, transparent: true, opacity: 0.45, roughness: 0.05, clearcoat: 1 });
  const rimT = new THREE.Mesh(new THREE.TorusGeometry(RO + 0.012, 0.025, 12, 64), rimMat); rimT.rotation.x = Math.PI / 2; rimT.position.y = YT; root.add(rimT);
  const footMat = new THREE.MeshPhysicalMaterial({ color: 0xdbe8f5, transparent: true, opacity: 0.35, roughness: 0.1, clearcoat: 1, depthWrite: false });
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.08, 0.12, 6), footMat); foot.position.y = Y0 - 0.14; foot.renderOrder = 9; root.add(foot);
  // graduación
  const tickPts = [];
  for (let i = 0; i <= 30; i++) {
    const y = Y0 + 0.25 + i * 0.1; if (y > YT - 0.25) break;
    const big = i % 5 === 0, a0 = Math.PI / 2 - (big ? 0.32 : 0.16), a1 = Math.PI / 2 + (big ? 0.32 : 0.16);
    for (let k = 0; k < 4; k++) {
      const u = a0 + (a1 - a0) * k / 4, v = a0 + (a1 - a0) * (k + 1) / 4;
      tickPts.push(new THREE.Vector3(Math.cos(u) * (RO + 0.003), y, Math.sin(u) * (RO + 0.003)), new THREE.Vector3(Math.cos(v) * (RO + 0.003), y, Math.sin(v) * (RO + 0.003)));
    }
  }
  const tickMat = new THREE.LineBasicMaterial({ color: 0xe8f1fa, transparent: true, opacity: 0.55 });
  const ticks = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(tickPts), tickMat); ticks.renderOrder = 11; root.add(ticks);
  // sombra
  const sc = document.createElement('canvas'); sc.width = sc.height = 128;
  const sg = sc.getContext('2d'); const gr = sg.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(0,0,0,.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); sg.fillStyle = gr; sg.fillRect(0, 0, 128, 128);
  const shadowT = new THREE.CanvasTexture(sc);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), new THREE.MeshBasicMaterial({ map: shadowT, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = Y0 - 0.21; root.add(shadow);

  // ---------- capas de líquido ----------
  const layerGeo = new THREE.CylinderGeometry(RI - 0.004, RI - 0.004, 1, 56);
  const ringGeo = new THREE.TorusGeometry(RI - 0.004, 0.008, 6, 64);
  let layers = []; // {key, d, c, mesh, ring, y0, y1, t0, t1, target, tag}
  const surfaceTop = () => layers.reduce((m, L) => Math.max(m, L.y1), Y0);
  function layerTargets() {
    const live = layers.filter(L => L.target).sort((a, b) => b.d - a.d);
    const th = live.length ? FILL / live.length : 0;
    live.forEach((L, i) => { L.t0 = Y0 + i * th; L.t1 = Y0 + (i + 1) * th; });
    // las que salen se colapsan en su sitio
    layers.filter(L => !L.target).forEach(L => { const m = (L.y0 + L.y1) / 2; L.t0 = m; L.t1 = m; });
  }

  // ---------- objetos ----------
  let objs = []; // {key, d, mesh, h, x, z, y, v, target, delay, alive, wob, tag, splashed}
  const splashes = [];
  const splashMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
  const splashGeo = new THREE.TorusGeometry(1, 0.02, 6, 48);
  for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(splashGeo, splashMat.clone()); m.rotation.x = Math.PI / 2; m.visible = false; root.add(m); splashes.push({ m, t: 1 }); }
  let splashIx = 0;
  const splash = (x, y, z) => { const s = splashes[splashIx++ % splashes.length]; s.m.position.set(x, y + 0.01, z); s.t = 0; s.m.visible = true; };

  function eqY(ob) {
    const live = layers.filter(L => L.target).sort((a, b) => b.d - a.d); // abajo -> arriba
    const h = ob.h;
    if (!live.length) return Y0 + h / 2;
    const top = live[live.length - 1];
    // recorre de arriba hacia abajo buscando la primera capa más densa que el objeto
    for (let i = live.length - 1; i >= 0; i--) {
      const L = live[i];
      if (L.d > ob.d) {
        const up = live[i + 1];
        let f;
        if (!up) f = clamp(ob.d / L.d, 0.1, 0.95); else f = clamp((ob.d - up.d) / (L.d - up.d), 0.08, 0.95);
        const y = L.t1 + h * (0.5 - f);
        return clamp(y, Y0 + h / 2, (top ? top.t1 : YT) + h / 2);
      }
    }
    return Y0 + h / 2 + 0.01;
  }
  function slots(n) {
    const X = { 1: [0], 2: [-0.22, 0.22], 3: [-0.3, 0, 0.3], 4: [-0.33, -0.11, 0.11, 0.33] }[Math.min(4, n)] || [];
    const out = [];
    for (let i = 0; i < n; i++) { const x = X[i] != null ? X[i] : (i % 4 - 1.5) * 0.2; out.push([x, (i % 2 ? -1 : 1) * 0.12 * (n > 2 ? 1 : 0.4)]); }
    return out;
  }

  // ---------- estado ----------
  let first = true, sway = 0;
  function set(state) {
    const s = Object.assign({ layers: null, objs: [], drop: true }, state || {});
    const Ls = Array.isArray(s.layers) && s.layers.length ? s.layers : [{ n: 'Agua', d: 1, c: '#3B8FD9' }];
    const Os = Array.isArray(s.objs) ? s.objs.slice(0, 6) : [];
    const instant = first || reduce;
    // capas
    const keys = Ls.map(l => String(l.n) + '|' + l.d);
    layers.forEach(L => { if (keys.indexOf(L.key) < 0) { L.target = 0; if (L.tag) L.tag.target = 0; } });
    Ls.forEach((l, i) => {
      let L = layers.find(x => x.key === keys[i]);
      if (!L) {
        const col = new THREE.Color(l.c || '#3B8FD9');
        const mat = new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.12, transparent: true, opacity: 0.72, clearcoat: 1, emissive: col, emissiveIntensity: 0.16, depthWrite: false });
        const mesh = new THREE.Mesh(layerGeo, mat); mesh.renderOrder = 2; root.add(mesh);
        const rm = new THREE.MeshBasicMaterial({ color: col.clone().lerp(new THREE.Color(0xffffff), 0.55), transparent: true, opacity: 0.8 });
        const ring = new THREE.Mesh(ringGeo, rm); ring.rotation.x = Math.PI / 2; ring.renderOrder = 4; root.add(ring);
        L = { key: keys[i], d: +l.d || 1, n: l.n, mesh, ring, y0: Y0, y1: Y0, t0: Y0, t1: Y0, target: 1 };
        L.tag = tag('r', '<b>' + esc(l.n) + '</b><span>' + dens(L.d) + '</span>');
        L.tag.target = 1;
        layers.push(L);
      }
      L.target = 1; L.tag.target = 1;
    });
    layerTargets();
    // al entrar: nueva capa nace con espesor 0 en su posición
    layers.forEach(L => { if (L.y0 === Y0 && L.y1 === Y0 && L.target && !instant) { const m = L.t0; L.y0 = m; L.y1 = m; } if (instant) { L.y0 = L.t0; L.y1 = L.t1; } });
    // objetos
    const sl = slots(Os.length);
    const okeys = Os.map(ob => String(ob.n) + '|' + ob.d);
    objs.forEach(ob => { if (okeys.indexOf(ob.key) < 0) ob.target = 0; });
    Os.forEach((ob, i) => {
      let it = objs.find(x => x.key === okeys[i] && x.target);
      if (!it) {
        const m = objMesh(ob); root.add(m.mesh);
        it = { key: okeys[i], d: +ob.d || 1, mesh: m.mesh, h: m.h, v: 0, a: 0, target: 1, wob: Math.random() * 6, splashed: false, baseRot: m.mesh.rotation.clone() };
        it.tag = tag('l', '<b>' + esc(ob.n) + '</b><span>' + dens(it.d) + '</span>');
        const dropIt = s.drop !== false && !instant;
        it.x = sl[i][0]; it.z = sl[i][1];
        it.delay = dropIt ? 0.35 + i * 0.5 : 0;
        it.y = dropIt ? YT + 0.9 : 0;
        it.dropping = dropIt;
        objs.push(it);
      }
      it.target = 1; it.x = sl[i][0]; it.z = sl[i][1];
    });
    objs.forEach(it => { it.eq = eqY(it); if (!it.dropping || instant) { if (instant || it.y === 0) it.y = it.eq; } });
    if (instant) { objs.forEach(it => { it.a = it.target; it.y = it.eq; it.delay = 0; it.dropping = false; }); tags.forEach(t => { t.a = 1; }); }
    first = false;
    if (instant) frame(0, true);
  }

  // ---------- cuadro ----------
  function frame(dt, snap) {
    // capas
    const k = snap ? 1 : Math.min(1, dt * 2.2);
    for (let i = layers.length - 1; i >= 0; i--) {
      const L = layers[i];
      L.y0 += (L.t0 - L.y0) * k; L.y1 += (L.t1 - L.y1) * k;
      const th = L.y1 - L.y0;
      if (!L.target && th < 0.03) { root.remove(L.mesh); root.remove(L.ring); L.mesh.material.dispose(); L.ring.material.dispose(); untag(L.tag); layers.splice(i, 1); continue; }
      L.mesh.visible = th > 0.004; L.mesh.scale.y = Math.max(0.001, th); L.mesh.position.y = (L.y0 + L.y1) / 2;
      L.ring.position.y = L.y1; L.ring.visible = th > 0.02;
    }
    const surf = surfaceTop();
    // objetos
    for (let i = objs.length - 1; i >= 0; i--) {
      const it = objs[i];
      if (!it.target) {
        it.a -= snap ? 1 : dt * 2.5;
        if (it.a <= 0) { root.remove(it.mesh); it.mesh.geometry.dispose(); it.mesh.material.dispose(); untag(it.tag); objs.splice(i, 1); continue; }
      } else it.a = Math.min(1, it.a + (snap ? 1 : dt * 3));
      it.eq = eqY(it);
      if (it.delay > 0) { it.delay -= dt; it.mesh.visible = false; it.tag.hold = true; continue; }
      it.mesh.visible = true; it.tag.hold = false;
      if (snap) { it.y = it.eq; it.v = 0; }
      else {
        const sub = 3, h = dt / sub;
        for (let q = 0; q < sub; q++) {
          if (it.y - it.h / 2 > surf && it.dropping) { it.v -= 7.5 * h; }
          else {
            if (it.dropping && !it.splashed) { it.splashed = true; splash(it.x, surf, it.z); it.v *= 0.35; }
            const K = 16, C = 3.4;
            it.v += (K * (it.eq - it.y) - C * it.v) * h;
          }
          it.y += it.v * h;
        }
        if (it.y <= Y0 + it.h / 2) { it.y = Y0 + it.h / 2; if (it.v < 0) it.v = -it.v * 0.25; }
      }
      it.wob += dt;
      it.mesh.position.set(it.x, it.y, it.z);
      const w = reduce ? 0 : Math.sin(it.wob * 2.2) * 0.05 * Math.min(1, Math.abs(it.v) + 0.3);
      it.mesh.rotation.set(it.baseRot.x + w, it.baseRot.y + it.wob * 0.15 * (reduce ? 0 : 1), it.baseRot.z + w * 0.6);
      it.mesh.scale.setScalar(Math.max(0.001, smooth(it.a)) * OS);
    }
    // salpicaduras
    splashes.forEach(s => { if (s.t >= 1) { s.m.visible = false; return; } s.t = Math.min(1, s.t + dt * 1.6); const r = 0.12 + s.t * (RI - 0.14); s.m.scale.setScalar(r); s.m.material.opacity = 0.7 * (1 - s.t); });
    placeTags(snap ? 0 : dt);
  }

  // ---------- etiquetas con líneas guía ----------
  function project(x, y, z, out) {
    V.set(x, y, z); root.localToWorld(V); V.project(o.cam);
    out.x = (V.x + 1) / 2 * st.clientWidth; out.y = (1 - V.y) / 2 * st.clientHeight; return out;
  }
  const P = { x: 0, y: 0 }, Q = { x: 0, y: 0 };
  function placeTags(dt) {
    const w = st.clientWidth, h = st.clientHeight;
    o.cam.updateMatrixWorld(); root.updateMatrixWorld();
    // radio de la probeta en píxeles
    project(0, 0, 0, P); W.set(RO, 0, 0); V.set(0, 0, 0); root.localToWorld(V); V.add(W).project(o.cam);
    const rpx = Math.abs((V.x + 1) / 2 * w - P.x);
    const narrow = w < 560;
    const gap = narrow ? 14 : 34;
    const sides = { l: [], r: [] };
    layers.forEach(L => { if (!L.tag) return; project(0, (L.y0 + L.y1) / 2, 0, P); L.tag.ax = P.x + rpx; L.tag.ay = P.y; L.tag.vis = L.y1 - L.y0 > 0.12 && L.target; sides.r.push(L.tag); });
    objs.forEach(it => { project(it.x, it.y, it.z, P); project(0, it.y, 0, Q); it.tag.ax = P.x - 6; it.tag.ay = P.y; it.tag.lx = Q.x - rpx; it.tag.vis = !!it.target && !it.tag.hold && it.mesh.visible && Math.abs(it.v) < 0.9 && Math.abs(it.y - it.eq) < 0.6; sides.l.push(it.tag); });
    ['l', 'r'].forEach(sd => {
      const arr = sides[sd].filter(t => t.vis).sort((a, b) => a.ay - b.ay);
      const TH = narrow ? 30 : 34;
      arr.forEach(t => { t.ty = t.ay; });
      for (let i = 1; i < arr.length; i++) if (arr[i].ty < arr[i - 1].ty + TH) arr[i].ty = arr[i - 1].ty + TH;
      const over = arr.length ? arr[arr.length - 1].ty - (h - 20) : 0;
      if (over > 0) arr.forEach(t => { t.ty -= over; });
      for (let i = arr.length - 2; i >= 0; i--) if (arr[i].ty > arr[i + 1].ty - TH) arr[i].ty = arr[i + 1].ty - TH;
      arr.forEach(t => { t.ty = Math.max(18, t.ty); });
    });
    const cx = project(0, 0, 0, P).x;
    tags.forEach(t => {
      const tgtA = t.vis && t.target !== 0 ? 1 : 0;
      t.a += (tgtA - t.a) * (dt ? Math.min(1, dt * 5) : 1);
      t.div.style.opacity = String(t.a); t.line.style.opacity = t.dot.style.opacity = String(t.a * 0.9);
      if (t.ty == null) t.ty = t.ay || 0;
      if (t.y == null || !dt) t.y = t.ty; else t.y += (t.ty - t.y) * Math.min(1, dt * 10);
      const edge = t.side === 'r' ? cx + rpx + gap : cx - rpx - gap;
      const tx = t.side === 'r' ? edge : edge;
      t.div.style.top = t.y + 'px';
      t.div.style.left = tx + 'px';
      const lx = t.side === 'r' ? tx - 4 : tx + 4;
      // Antes del primer cuadro con tamaño real la proyección da NaN o Infinity: no se dibuja la guía.
      if (![lx, t.y, t.ax, t.ay].every((v) => v == null || Number.isFinite(v))) { t.y = null; return; }
      t.line.setAttribute('x1', lx); t.line.setAttribute('y1', t.y); t.line.setAttribute('x2', t.ax || 0); t.line.setAttribute('y2', t.ay || 0);
      t.dot.setAttribute('cx', t.ax || 0); t.dot.setAttribute('cy', t.ay || 0);
    });
  }

  o.tick = dt => {
    sway += dt;
    if (o.auto) { o.rot.y = Math.sin(sway * 0.3) * 0.35; root.rotation.y = o.rot.y; }
    frame(dt, false);
  };
  // si hay movimiento reducido three() no llama tick: igual se reubican las etiquetas si cambia el tamaño
  const onResize = () => { if (reduce) placeTags(0); };
  window.addEventListener('resize', onResize);

  return {
    set,
    dispose() {
      o.tick = null; window.removeEventListener('resize', onResize);
      layers.forEach(L => { L.mesh.material.dispose(); L.ring.material.dispose(); });
      objs.forEach(it => { it.mesh.geometry.dispose(); it.mesh.material.dispose(); });
      layers = []; objs = [];
      tags.slice().forEach(untag);
      o.dispose(); cleanup(); layerGeo.dispose(); ringGeo.dispose(); shadowT.dispose(); splashMat.dispose(); st.remove();
    }
  };
}
