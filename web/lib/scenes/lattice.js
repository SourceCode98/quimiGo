// Escena "lattice": tipos de enlace y redes (iónica, metálica, covalente, transferencia de electrones, puentes de hidrógeno).
import { EL, M } from '../widgets.js';
import { THREE, SC, makeStage, Bond, atomMat, lab, unlab, drop, glowTex, fitZoom, caption, ease, easeOut, seg, clamp, lerp, reduce } from './b-kit.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const TITLES = {
  ionic: ['Red iónica', 'NaCl'], metal: ['Enlace metálico', 'Cu'], covalent: ['Red covalente', 'diamante (C)'], graphite: ['Red covalente', 'grafito (C)'],
  transfer: ['Transferencia de electrones', 'Na + Cl'], hbond: ['Puentes de hidrógeno', 'H₂O'],
};
const E_COL = 0x5BB2FF;

export default function (el) {
  const { st, o } = makeStage(el, 'scb-lat');
  const cap = caption(st);
  const phase = document.createElement('div'); phase.className = 'scb-phase'; st.appendChild(phase);
  const legend = document.createElement('div'); legend.className = 'legend scb-legend scb-lg'; el.appendChild(legend);
  if (!o) return { set(s) { renderLegend((s && s.kind) || 'ionic'); }, dispose() { el.innerHTML = ''; } };
  const eTex = glowTex('rgba(200,230,255,1)', 'rgba(80,160,255,0)');
  let cur = null, dying = [], clock = 0, zoomTarget = 9, myZoom = null;

  function renderLegend(kind) {
    const dot = (c, t) => '<span><i class="dot" style="background:' + c + '"></i>' + t + '</span>';
    const L = {
      ionic: dot(EL.Na.css, 'Na⁺ catión') + dot(EL.Cl.css, 'Cl⁻ anión'),
      metal: dot('#C88033', 'Ion metálico (+)') + dot('#5BB2FF', 'Electrón libre (e⁻)'),
      covalent: dot(EL.C.css, 'Carbono') + '<span>— enlace covalente</span>',
      graphite: dot(EL.C.css, 'Carbono') + '<span>— enlace covalente</span><span>⋯ capas unidas débilmente</span>',
      transfer: dot(EL.Na.css, 'Sodio') + dot(EL.Cl.css, 'Cloro') + dot('#5BB2FF', 'Electrón de valencia'),
      hbond: dot(EL.O.css, 'Oxígeno') + dot(EL.H.css, 'Hidrógeno') + '<span><i class="scb-dash"></i>Puente de hidrógeno</span>',
    };
    legend.innerHTML = L[kind] || '';
  }

  /* ---------- iónica ---------- */
  function ionic(W) {
    const d = 2.05, ions = [];
    const lines = [];
    for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
      const na = (x + y + z) & 1; const sym = na ? 'Na' : 'Cl';
      const m = new THREE.Mesh(o.SPH, atomMat(sym)); const r = na ? .42 : .74; m.scale.setScalar(r);
      m.position.set(x * d, y * d, z * d); W.add(m); ions.push({ m, base: m.position.clone(), ph: Math.random() * 6 });
      if (x < 1) lines.push(x * d, y * d, z * d, (x + 1) * d, y * d, z * d);
      if (y < 1) lines.push(x * d, y * d, z * d, x * d, (y + 1) * d, z * d);
      if (z < 1) lines.push(x * d, y * d, z * d, x * d, y * d, (z + 1) * d);
      if ((x === 1 && y === 1 && z === 1) || (x === 1 && y === 1 && z === 0)) lab(o, m, na ? 'Na⁺' : 'Cl⁻', 'scb-ion');
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
    W.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x8FA3B3, transparent: true, opacity: .5, toneMapped: false })));
    return { zoom: fitZoom(o, 8.6, 8.6, 1.05), auto: true, step(dt) { ions.forEach(i => { i.m.position.copy(i.base).addScalar(Math.sin(clock * 7 + i.ph) * .025); }); } };
  }

  /* ---------- metálica ---------- */
  function metal(W) {
    const d = 1.9, n = 3;
    const plus = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.font = 'bold 50px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('+', 32, 35); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    const mat = new THREE.MeshPhysicalMaterial({ color: 0xC88033, metalness: .55, roughness: .28, clearcoat: .4 });
    const pm = new THREE.SpriteMaterial({ map: plus, transparent: true, depthTest: false, opacity: .95 });
    const ions = [];
    for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) for (let z = 0; z < n; z++) {
      const m = new THREE.Mesh(o.SPH, mat); m.scale.setScalar(.5); m.position.set((x - 1) * d, (y - 1) * d, (z - 1) * d); W.add(m);
      const s = new THREE.Sprite(pm); s.scale.setScalar(.45); s.renderOrder = 5; m.add(s); s.scale.setScalar(.9);
      ions.push({ m, base: m.position.clone(), ph: Math.random() * 6 });
    }
    // mar de electrones
    const N = 110, L = d * 1.5 + .4;
    const pos = new Float32Array(N * 3), vel = [];
    for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - .5) * 2 * L; pos[i * 3 + 1] = (Math.random() - .5) * 2 * L; pos[i * 3 + 2] = (Math.random() - .5) * 2 * L; vel.push(V(Math.random() - .5, Math.random() - .5, Math.random() - .5).normalize().multiplyScalar(1.2 + Math.random())); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ map: eTex, color: 0x9FD0FF, size: .34, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    W.add(pts);
    const box = new THREE.Box3(); lab(o, ions[26].m, 'Cu⁺', 'scb-ion');
    return {
      zoom: fitZoom(o, 8.2, 8.2, 1.05), auto: true,
      step(dt) {
        ions.forEach(i => { i.m.position.copy(i.base).addScalar(Math.sin(clock * 6 + i.ph) * .03); });
        for (let i = 0; i < N; i++) {
          const v = vel[i];
          v.x += (Math.random() - .5) * dt * 4; v.y += (Math.random() - .5) * dt * 4; v.z += (Math.random() - .5) * dt * 4;
          const sp = v.length(); if (sp > 2.4) v.multiplyScalar(2.4 / sp);
          for (let k = 0; k < 3; k++) {
            const key = 'xyz'[k]; let p = pos[i * 3 + k] + v[key] * dt;
            if (p > L) { p = L; v[key] = -Math.abs(v[key]); } if (p < -L) { p = -L; v[key] = Math.abs(v[key]); }
            pos[i * 3 + k] = p;
          }
        }
        g.attributes.position.needsUpdate = true;
      },
      extra: [plus],
    };
  }

  /* ---------- covalente (diamante o grafito) ---------- */
  function covalent(W, graphite) {
    const P = [];
    if (!graphite) {
      const a = 3.1, basis = [[0, 0, 0], [0, .5, .5], [.5, 0, .5], [.5, .5, 0]];
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) basis.forEach(b => {
        [[0, 0, 0], [.25, .25, .25]].forEach(s => { const p = V((i + b[0] + s[0] - .125) * a, (j + b[1] + s[1] - .125) * a, (k + b[2] + s[2] - .125) * a); if (p.length() < 3.5) P.push(p); });
      });
    } else {
      const cc = 1.42 * .95, sp = 2.0;
      for (let layer = -1; layer <= 1; layer++) {
        const shift = layer === 0 ? cc : 0;
        for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) {
          const bx = i * cc * 1.5, bz = j * cc * Math.sqrt(3) + (i & 1 ? cc * Math.sqrt(3) / 2 : 0);
          [0, cc].forEach(dx => { const p = V(bx + dx + shift - .7, layer * sp, bz); if (Math.hypot(p.x, p.z) < 3.6) P.push(p); });
        }
      }
    }
    const nn = graphite ? 1.42 * .95 : 3.1 * Math.sqrt(3) / 4;
    const atoms = P.map(p => { const m = new THREE.Mesh(o.SPH, atomMat('C')); m.scale.setScalar(graphite ? .27 : .3); m.position.copy(p); W.add(m); return m; });
    let nb = 0;
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
      const dd = P[i].distanceTo(P[j]);
      if (Math.abs(dd - nn) < .08) { new Bond(o, W, atoms[i], atoms[j], 1, { tone: false, r: .08, color: 0x9AA6B2 }); nb++; }
    }
    if (graphite) { // líneas punteadas entre capas
      const pts = []; P.forEach(p => { if (p.y > .5 && Math.hypot(p.x, p.z) < 2.2) { pts.push(p.x, p.y, p.z, p.x, p.y - 2, p.z); } });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      const ln = new THREE.LineSegments(g, new THREE.LineDashedMaterial({ color: 0x8FA3B3, dashSize: .12, gapSize: .12, transparent: true, opacity: .5 })); ln.computeLineDistances(); W.add(ln);
    }
    // una etiqueta
    const front = atoms.reduce((b, m) => (m.position.z + m.position.y * .3 > b.position.z + b.position.y * .3 ? m : b), atoms[0]);
    lab(o, front, 'C');
    return { zoom: fitZoom(o, 7.4, graphite ? 6.2 : 7.2, 1.05), auto: true, step() { } };
  }

  /* ---------- transferencia Na → Cl ---------- */
  function transfer(W) {
    const na = new THREE.Mesh(o.SPH, atomMat('Na')), cl = new THREE.Mesh(o.SPH, atomMat('Cl'));
    W.add(na, cl);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x8FB7D9, transparent: true, opacity: .55, toneMapped: false });
    const ringNa = new THREE.Mesh(new THREE.TorusGeometry(1.45, .02, 8, 96), ringMat.clone());
    const ringCl = new THREE.Mesh(new THREE.TorusGeometry(1.25, .02, 8, 96), ringMat);
    na.add(ringNa); cl.add(ringCl); // (escala del padre se compensa abajo)
    const eMat = new THREE.MeshStandardMaterial({ color: E_COL, emissive: 0x2266CC, emissiveIntensity: .9, roughness: .3 });

    const e = n => { const m = new THREE.Mesh(o.SPH_LO, eMat); m.scale.setScalar(.12); W.add(m); return m; };
    const clE = []; for (let i = 0; i < 7; i++) clE.push(e());
    const ve = e();
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: eTex, color: 0x9FD0FF, transparent: true, opacity: .8, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.setScalar(.7); W.add(glow);
    const lNa = lab(o, na, 'Na', 'scb-ion'), lCl = lab(o, cl, 'Cl', 'scb-ion'), lE = lab(o, ve, 'e⁻', 'scb-e');
    // flechas de atracción (→ ←)
    const attr = new THREE.Group(); W.add(attr);
    const aMat = new THREE.MeshBasicMaterial({ color: 0xF3C470, transparent: true, opacity: 0, toneMapped: false });
    const mkArrow = () => { const g = new THREE.Group(); const sh = new THREE.Mesh(o.CYL, aMat); const hd = new THREE.Mesh(o.CONE, aMat); g.add(sh, hd); attr.add(g); return { g, sh, hd }; };
    const arrs = [mkArrow(), mkArrow()];
    const CYC = 8.4;
    const S = {
      zoom: fitZoom(o, 8.8, 3.6, 1.05), auto: false,
      step() {
        const t = reduce ? 5.2 : clock % CYC;
        const tr = ease(seg(t, 1.3, 2.9));         // viaje del electrón
        const ion = ease(seg(t, 2.8, 3.6));        // se forman iones
        const come = ease(seg(t, 3.8, 5.0));       // se atraen
        const back = ease(seg(t, 7.6, 8.4));       // reinicio
        const k = ion * (1 - back), kc = come * (1 - back);
        const rNa = lerp(.8, .45, k), rCl = lerp(.52, .8, k);
        const sepFar = 2.75, sepNear = (.45 + .8 + .3) / 2;
        const sep = lerp(sepFar, sepNear, kc);
        na.position.set(-sep, 0, 0); cl.position.set(sep, 0, 0);
        na.scale.setScalar(rNa); cl.scale.setScalar(rCl);
        ringNa.scale.setScalar(1 / rNa); ringCl.scale.setScalar(1 / rCl);
        ringNa.material.opacity = .55 * (1 - k); ringNa.visible = k < .98;
        // electrones del Cl (7 y un hueco hacia el Na)
        const RCl = 1.25, spin = clock * .25;
        for (let i = 0; i < 7; i++) { const a = Math.PI + (i + 1) * Math.PI / 4 + spin * 0; clE[i].position.set(cl.position.x + Math.cos(a) * RCl, Math.sin(a) * RCl, 0); }
        const start = V(na.position.x + 1.45, 0, 0), end = V(cl.position.x - RCl, 0, 0);
        if (t < 1.3 || back > 0 && t > 7.6) { const a = Math.sin(clock * 1.2) * .5; start.set(na.position.x + Math.cos(a) * 1.45, Math.sin(a) * 1.45, 0); ve.position.copy(start); }
        else { ve.position.copy(start).lerp(end, tr); ve.position.y += Math.sin(Math.PI * tr) * .9; }
        if (back > 0) { ve.position.lerp(V(na.position.x + 1.45, 0, 0), back); }
        glow.position.copy(ve.position); glow.material.opacity = .5 + .3 * Math.sin(clock * 6);
        lNa.d.textContent = k > .5 ? 'Na⁺' : 'Na'; lCl.d.textContent = k > .5 ? 'Cl⁻' : 'Cl';
        lE.d.style.opacity = tr > 0 && tr < 1 ? 1 : 0;
        // atracción
        aMat.opacity = .7 * seg(t, 3.6, 4.2) * (1 - back);
        const x0 = na.position.x + rNa + .15, x1 = cl.position.x - rCl - .15, gapL = x1 - x0;
        attr.visible = aMat.opacity > .01 && gapL > .9;
        arrs.forEach((A, i) => {
          const L = Math.max(.2, gapL / 2 - .12), dir = i ? -1 : 1, xs = i ? x1 : x0;
          A.sh.scale.set(.03, L - .22, .03); A.sh.rotation.z = -dir * Math.PI / 2; A.sh.position.set(xs + dir * (L - .22) / 2, 0, 0);
          A.hd.scale.set(.1, .22, .1); A.hd.rotation.z = -dir * Math.PI / 2; A.hd.position.set(xs + dir * (L - .11), 0, 0);
        });
        phase.textContent = t < 1.3 ? 'Átomos neutros' : t < 2.9 ? 'El sodio cede su electrón de valencia' : t < 3.8 ? 'Se forman iones: Na⁺ y Cl⁻' : t < 7.6 ? 'Se atraen: enlace iónico' : '';
      },
      extra: [ringNa.geometry, ringCl.geometry],
      kill() { phase.textContent = ''; },
    };
    return S;
  }

  /* ---------- puentes de hidrógeno ---------- */
  function hbond(W) {
    const w = M.H2O; const OH = .96 * SC, HB = 1.9 * SC; // H···O
    const oLoc = V(0, 0, 0);
    const mols = [];
    const addWater = (O, h1dir, roll) => {
      // agua con un O-H en la dirección h1dir y el otro a 104,5°
      const u = h1dir.clone().normalize();
      let p = V(0, 1, 0).cross(u); if (p.lengthSq() < .01) p = V(1, 0, 0).cross(u); p.normalize();
      p.applyAxisAngle(u, roll);
      const a = 104.5 * Math.PI / 180; const u2 = u.clone().multiplyScalar(Math.cos(a)).addScaledVector(p, Math.sin(a));
      const g = new THREE.Group(); W.add(g);
      const mo = new THREE.Mesh(o.SPH, atomMat('O')); mo.scale.setScalar(.4); mo.position.copy(O); g.add(mo);
      const h1 = new THREE.Mesh(o.SPH, atomMat('H')); h1.scale.setScalar(.25); h1.position.copy(O).addScaledVector(u, OH); g.add(h1);
      const h2 = new THREE.Mesh(o.SPH, atomMat('H')); h2.scale.setScalar(.25); h2.position.copy(O).addScaledVector(u2, OH); g.add(h2);
      new Bond(o, g, mo, h1, 1, { ca: EL.O.hex, cb: EL.H.hex, ra: .4, rb: .25 }); new Bond(o, g, mo, h2, 1, { ca: EL.O.hex, cb: EL.H.hex, ra: .4, rb: .25 });
      const m = { g, O: mo, H: [h1, h2], u, u2 }; mols.push(m); return m;
    };
    // central: O en el origen, H hacia abajo-izquierda y abajo-derecha
    const c = addWater(oLoc, V(.8, -.62, 0), Math.PI / 2 + .0);
    // pares libres del central (aprox. tetraédricos)
    const lp1 = c.u.clone().add(c.u2).normalize().negate();
    const nrm = c.u.clone().cross(c.u2).normalize();
    const lpA = lp1.clone().multiplyScalar(.58).addScaledVector(nrm, .81).normalize(), lpB = lp1.clone().multiplyScalar(.58).addScaledVector(nrm, -.81).normalize();
    const links = [];
    // donadores desde el central
    [[c.H[0], c.u], [c.H[1], c.u2]].forEach(([h, d], i) => {
      const O = h.position.clone().addScaledVector(d, HB);
      const m = addWater(O, V(d.x * .3 + (i ? -1 : 1) * .6, .5, .6), i * 1.3 + .4);
      links.push([h, m.O]);
      // segunda capa desde uno de sus H
      if (i === 0) { const h2 = m.H[0]; const O2 = h2.position.clone().addScaledVector(m.u, HB); const m2 = addWater(O2, V(.2, -.7, -.5), 2.1); links.push([h2, m2.O]); }
    });
    // aceptores: aguas que apuntan un H al O central
    [lpA, lpB].forEach((d, i) => {
      const O = d.clone().multiplyScalar(OH + HB);
      const m = addWater(O, d.clone().negate(), i * 1.9 + .8);
      links.push([m.H[0], c.O]);
      if (i === 1) { const d2 = m.u2.clone(); const O2 = m.H[1].position.clone().addScaledVector(d2, HB); const m2 = addWater(O2, V(-.5, .6, .2), .5); links.push([m.H[1], m2.O]); }
    });
    // centrar
    const box = new THREE.Box3().setFromObject(W); const ctr = box.getCenter(V(0, 0, 0));
    W.children.forEach(ch => ch.position.sub(ctr));
    // guiones dorados
    const dMat = new THREE.MeshBasicMaterial({ color: 0xF6CF84, transparent: true, opacity: .95, toneMapped: false });
    const dashes = [];
    links.forEach(([h, O], li) => {
      const a = h.getWorldPosition(V(0, 0, 0)), b = O.getWorldPosition(V(0, 0, 0));
      W.worldToLocal(a); W.worldToLocal(b);
      const dir = b.clone().sub(a); const L = dir.length(); dir.normalize();
      const s0 = .28, s1 = L - .42, n = 5, q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir);
      for (let k = 0; k < n; k++) {
        const t0 = s0 + (s1 - s0) * k / n, len = (s1 - s0) / n * .55;
        const m = new THREE.Mesh(o.CYL, dMat); m.scale.set(.055, len, .055); m.quaternion.copy(q); m.position.copy(a).addScaledVector(dir, t0 + len / 2); W.add(m); dashes.push(m);
      }
      if (li === 0) { const an = new THREE.Object3D(); an.position.copy(a).lerp(b, .5).add(V(0, .35, 0)); W.add(an); lab(o, an, 'Puente de H', 'scb-soft'); }
    });
    const dn = new THREE.Object3D(); dn.position.set(0, 1.9, 0); c.O.add(dn); lab(o, dn, 'δ−', 'scb-dneg');
    const dp = new THREE.Object3D(); dp.position.copy(c.u2).multiplyScalar(2.2); c.H[1].add(dp); lab(o, dp, 'δ+', 'scb-dpos');
    const size = box.getSize(V(0, 0, 0));
    return { zoom: fitZoom(o, Math.max(size.x, size.z) + 1, size.y + 1, 1.05), auto: true, step() { dMat.opacity = .65 + .35 * Math.sin(clock * 3); } };
  }

  function build(kind, state) {
    const W = new THREE.Group(); o.root.add(W);
    let S;
    if (kind === 'metal') S = metal(W);
    else if (kind === 'covalent') S = covalent(W, state.form === 'graphite');
    else if (kind === 'transfer') S = transfer(W);
    else if (kind === 'hbond') S = hbond(W);
    else S = ionic(W);
    S.W = W; S.grow = reduce ? 1 : 0; S.kind = kind;
    W.scale.setScalar(reduce ? 1 : .001);
    return S;
  }

  o.tick = dt => {
    clock += dt;
    if (cur) {
      cur.grow = Math.min(1, cur.grow + dt / .5); cur.W.scale.setScalar(Math.max(.001, easeOut(cur.grow)));
      cur.step(dt);
      if (!cur.auto) { o.rot.y += (0 - o.rot.y) * (1 - Math.exp(-dt * 3)); }
    }
    dying.slice().forEach(d => { d.k -= dt / .35; d.W.scale.setScalar(Math.max(.001, ease(d.k))); if (d.k <= 0) { d.extra && d.extra.forEach(x => x.dispose()); drop(o, d.W); dying.splice(dying.indexOf(d), 1); } });
    if (myZoom === null || Math.abs(o.zoom - myZoom) < 1e-6) { o.zoom += (zoomTarget - o.zoom) * (1 - Math.exp(-dt * 4)); myZoom = o.zoom; }
  };

  return {
    set(state) {
      state = state || {};
      let kind = state.kind || 'ionic';
      if (!TITLES[kind]) kind = 'ionic';
      const tk = kind === 'covalent' && state.form === 'graphite' ? 'graphite' : kind;
      if (cur && cur.tk === tk) return;
      if (cur) { cur.kill && cur.kill(); dying.push({ W: cur.W, k: 1, extra: cur.extra }); if (reduce) { const d = dying.pop(); d.extra && d.extra.forEach(x => x.dispose()); drop(o, d.W); } }
      cur = build(kind, state); cur.tk = tk;
      o.auto = cur.auto; if (!cur.auto) { o.rot.x = -.08; } else { o.rot.x = -.35; }
      cap.innerHTML = '<b>' + TITLES[tk][0] + '</b><span>' + TITLES[tk][1] + '</span>';
      renderLegend(tk);
      zoomTarget = cur.zoom; if (myZoom === null) o.zoom = zoomTarget; myZoom = o.zoom;
      cur.step(0);
    },
    dispose() {
      if (cur && cur.extra) cur.extra.forEach(x => x.dispose());
      dying.forEach(d => d.extra && d.extra.forEach(x => x.dispose()));
      eTex.dispose(); o.tick = null; o.dispose(); el.innerHTML = '';
    },
    _o: o,
  };
}
