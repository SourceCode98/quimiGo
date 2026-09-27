// Escena "mol": molécula 3D con pares libres, dipolo, grupo funcional resaltado y comparación lado a lado.
import { M, EL } from '../widgets.js';
import './molecules-extra.js';
import { molFor } from './molecules-extra.js';
import { THREE, makeStage, molGroup, atomText, lab, drop, fitZoom, caption, sub, ease, easeOut, clamp, reduce } from './b-kit.js';

const GROUPS = {
  OH: 'Hidroxilo (–OH)', COOH: 'Carboxilo (–COOH)', CO: 'Carbonilo (C=O)', NH2: 'Amino (–NH₂)',
  'C=C': 'Doble enlace C=C', 'C#C': 'Triple enlace C≡C', COO: 'Éster (–COO–)', CHO: 'Aldehído (–CHO)', COC: 'Éter (C–O–C)',
};

/** Índices de átomos del grupo funcional pedido. */
function findGroup(m, key) {
  const nb = i => m.b.filter(b => b[0] === i || b[1] === i).map(b => ({ j: b[0] === i ? b[1] : b[0], k: b[2] }));
  const S = i => m.a[i][0];
  const out = new Set();
  m.a.forEach((a, i) => {
    const s = a[0], n = nb(i);
    if (key === 'OH' && s === 'O') { const h = n.filter(x => S(x.j) === 'H'); if (h.length === 1 && n.length === 2) { out.add(i); h.forEach(x => out.add(x.j)); } }
    if (key === 'NH2' && s === 'N') { const h = n.filter(x => S(x.j) === 'H'); if (h.length >= 2) { out.add(i); h.slice(0, 2).forEach(x => out.add(x.j)); } }
    if ((key === 'COOH' || key === 'COO' || key === 'CO' || key === 'CHO') && s === 'C') {
      const od = n.find(x => S(x.j) === 'O' && x.k === 2); if (!od) return;
      const os = n.find(x => S(x.j) === 'O' && x.k === 1);
      if (key === 'CO') { out.add(i); out.add(od.j); }
      if (key === 'CHO') { const h = n.find(x => S(x.j) === 'H'); if (h) { out.add(i); out.add(od.j); out.add(h.j); } }
      if (os) {
        const oh = nb(os.j).find(x => S(x.j) === 'H'), oc = nb(os.j).find(x => S(x.j) === 'C' && x.j !== i);
        if (key === 'COOH' && oh) [i, od.j, os.j, oh.j].forEach(x => out.add(x));
        if (key === 'COO' && oc) [i, od.j, os.j].forEach(x => out.add(x));
      }
    }
    if (key === 'COC' && s === 'O') { const c = n.filter(x => S(x.j) === 'C' && x.k === 1); if (c.length === 2 && !c.some(x => nb(x.j).some(y => y.k === 2 && S(y.j) === 'O'))) { out.add(i); c.forEach(x => out.add(x.j)); } }
  });
  if (key === 'C=C' || key === 'C#C') { const k = key === 'C=C' ? 2 : 3; m.b.forEach(b => { if (b[2] === k && S(b[0]) === 'C' && S(b[1]) === 'C') { out.add(b[0]); out.add(b[1]); } }); }
  return [...out];
}

export default function (el) {
  const { st, o } = makeStage(el, 'scb-mol');
  if (!o) return { set() {}, dispose() { el.innerHTML = ''; } };
  const cap = caption(st);
  const hint = document.createElement('div'); hint.className = 'hint'; hint.textContent = 'Arrastra para girar'; st.appendChild(hint);
  o.rot.x = -.22; o.rot.y = 0;
  const gold = 0xE7B460;
  let entries = [];     // {key, holder, mg, ov:{lp,dip,hl}, x, tx, s, ts, dying}
  let spin = 0, clock = 0, zoomTarget = 9, myZoom = null, cur = {};
  const anchorsRoot = new THREE.Group(); o.root.add(anchorsRoot);

  function makeEntry(key) {
    const m = M[key] || molFor(key);
    const holder = new THREE.Group(); o.root.add(holder);
    const mg = molGroup(o, m); holder.add(mg.g);
    mg.ry = .5; mg.atoms.forEach(a => { mg.ry = Math.max(mg.ry, Math.abs(a.p.y) * .976 + Math.abs(a.p.z) * .218 + a.r); });
    const big = m.a.length > 12;
    mg.atoms.forEach((a, i) => {
      const t = atomText(m, i);
      if (!t) return;
      if (big && (a.sym === 'C' || a.sym === 'H') && !(m.lab && m.lab[i])) return;
      if (big && m.ionic && m.a.findIndex(x => x[0] === a.sym) !== i) return;
      a.lab = lab(o, a.mesh, t);
    });
    const e = { key, m, holder, mg, ov: {}, x: 0, tx: 0, s: reduce ? 1 : 0, ts: 1, spin: 0 };
    // anclas para nombre debajo (modo par)
    e.nameAnchor = new THREE.Object3D(); anchorsRoot.add(e.nameAnchor);
    e.nameLab = lab(o, e.nameAnchor, m.n.replace(/ \(.*\)$/, ''), 'scb-name');
    e.nameLab.d.style.opacity = 0;
    return e;
  }

  /* ---------- capas: pares libres ---------- */
  function buildLp(e) {
    const g = new THREE.Group(); e.mg.g.add(g);
    const mat = new THREE.MeshPhysicalMaterial({ color: 0x7FB2EA, emissive: 0x1A3A66, transparent: true, opacity: 0, roughness: .3, depthWrite: false });
    (e.m.lp || []).forEach(([i, x, y, z]) => {
      const a = e.mg.atoms[i]; if (!a) return;
      const d = new THREE.Vector3(x, y, z).normalize();
      const l = new THREE.Mesh(o.SPH_LO, mat); l.scale.set(.19, .36, .19);
      l.position.copy(a.p).addScaledVector(d, a.r + .3); l.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d); g.add(l);
    });
    return { g, mats: [mat], max: .5, t: 0, labs: [] };
  }

  /* ---------- capa: dipolo ---------- */
  function buildDip(e) {
    const g = new THREE.Group(); e.mg.g.add(g);
    const m = e.m, A = e.mg.atoms;
    const q = A.map(() => 0);
    m.b.forEach(([i, j, k]) => { if (!k) return; const ei = EL[m.a[i][0]].en, ej = EL[m.a[j][0]].en; if (ei == null || ej == null) return; q[i] += (ej - ei) * .5; q[j] += (ei - ej) * .5; });
    const mu = new THREE.Vector3(); A.forEach((a, i) => mu.addScaledVector(a.p, q[i]));
    const mats = [], labs = [];
    const arrowMat = new THREE.MeshStandardMaterial({ color: gold, emissive: 0x6B4A10, roughness: .4, transparent: true, opacity: 0 }); mats.push(arrowMat);
    const arrow = (from, to, r) => {
      const d = new THREE.Vector3().subVectors(to, from), L = d.length(); d.normalize();
      const hl = Math.min(L * .4, r * 3.4), up = new THREE.Vector3(0, 1, 0), qn = new THREE.Quaternion().setFromUnitVectors(up, d);
      const sh = new THREE.Mesh(o.CYL, arrowMat); sh.scale.set(r, L - hl, r); sh.position.copy(from).addScaledVector(d, (L - hl) / 2); sh.quaternion.copy(qn);
      const hd = new THREE.Mesh(o.CONE, arrowMat); hd.scale.set(r * 2.6, hl, r * 2.6); hd.position.copy(from).addScaledVector(d, L - hl / 2); hd.quaternion.copy(qn);
      [sh, hd].forEach(x => { x.renderOrder = 20; g.add(x); });
      return { sh, hd, d, qn };
    };
    const pl = String(m.pol || '');
    const polar = /^Polar/.test(pl) ? mu.length() > .03 : /^Apolar/.test(pl) ? false : mu.length() > .25;
    if (polar) {
      const d = mu.clone().negate().normalize();
      let pp = new THREE.Vector3().crossVectors(d, new THREE.Vector3(0, 0, 1)); if (pp.lengthSq() < .01) pp.set(1, 0, 0); pp.normalize();
      let ext = 0; A.forEach(a => { ext = Math.max(ext, a.p.dot(pp) + a.r); });
      const L = Math.max(1.8, Math.min(e.mg.radius * 1.6, 3.2));
      const base = pp.clone().multiplyScalar(ext + .75);
      const from = base.clone().addScaledVector(d, -L / 2), to = base.clone().addScaledVector(d, L / 2);
      arrow(from, to, .07);
      // cruz de la cola (+)
      const cr = new THREE.Mesh(o.CYL, arrowMat); cr.scale.set(.06, .42, .06); cr.renderOrder = 20;
      cr.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pp); cr.position.copy(from).addScaledVector(d, .32); g.add(cr);
      const an0 = new THREE.Object3D(); an0.position.copy(base).addScaledVector(pp, .55); g.add(an0);
      labs.push(lab(o, an0, 'μ', 'scb-mu'));
      // nubes δ
      const neg = new THREE.MeshPhysicalMaterial({ color: 0xFF5A6E, emissive: 0x551020, transparent: true, opacity: 0, depthWrite: false, roughness: .6 });
      const pos = new THREE.MeshPhysicalMaterial({ color: 0x4DA8FF, emissive: 0x0E2F55, transparent: true, opacity: 0, depthWrite: false, roughness: .6 });
      mats.push(neg, pos);
      const idx = A.map((a, i) => i).filter(i => Math.abs(q[i]) > .12).sort((x, y) => Math.abs(q[y]) - Math.abs(q[x])).slice(0, 6);
      idx.forEach(i => {
        const a = A[i]; const c = new THREE.Mesh(o.SPH_LO, q[i] < 0 ? neg : pos); c.scale.setScalar(a.r * 1.5 + .14); c.position.copy(a.p); g.add(c);
        const an = new THREE.Object3D(); const out = a.p.clone(); if (out.lengthSq() < .01) out.copy(d).multiplyScalar(q[i] < 0 ? 1 : -1); out.normalize();
        an.position.copy(a.p).addScaledVector(out, a.r * 1.5 + .42); g.add(an);
        labs.push(lab(o, an, q[i] < 0 ? 'δ−' : 'δ+', q[i] < 0 ? 'scb-dneg' : 'scb-dpos'));
      });
    } else {
      const polarBonds = m.b.filter(([i, j, k]) => k && EL[m.a[i][0]].en != null && EL[m.a[j][0]].en != null && Math.abs(EL[m.a[i][0]].en - EL[m.a[j][0]].en) >= .5).length;
      if (polarBonds <= 4) m.b.forEach(([i, j, k]) => {
        if (!k) return; const ei = EL[m.a[i][0]].en, ej = EL[m.a[j][0]].en; if (ei == null || ej == null || Math.abs(ei - ej) < .5) return;
        const [lo, hi] = ei < ej ? [i, j] : [j, i];
        const a = A[lo].p, b = A[hi].p, mid = a.clone().lerp(b, .5), dd = b.clone().sub(a).normalize();
        const L = Math.min(a.distanceTo(b) * .8, 1.3);
        let pp = new THREE.Vector3().crossVectors(dd, new THREE.Vector3(0, 0, 1)); if (pp.lengthSq() < .01) pp.set(0, 1, 0); pp.normalize();
        const base = mid.clone().addScaledVector(pp, .42);
        arrow(base.clone().addScaledVector(dd, -L / 2), base.clone().addScaledVector(dd, L / 2), .045);
      });
      const an = new THREE.Object3D(); an.position.set(0, e.mg.ry + .45, 0); g.add(an);
      labs.push(lab(o, an, 'μ = 0', 'scb-mu'));
    }
    labs.forEach(l => { l.d.style.opacity = 0; });
    return { g, mats, max: 1, t: 0, labs, cloudMax: .24 };
  }

  /* ---------- capa: grupo funcional ---------- */
  function buildHl(e, key) {
    const idx = findGroup(e.m, key);
    if (!idx.length) return null;
    const set = new Set(idx);
    const g = new THREE.Group(); e.mg.g.add(g);
    const halo = new THREE.MeshBasicMaterial({ color: 0xF5C66A, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const c = new THREE.Vector3();
    idx.forEach(i => { const a = e.mg.atoms[i]; const h = new THREE.Mesh(o.SPH_LO, halo); h.scale.setScalar(a.r * 1.55 + .12); h.position.copy(a.p); g.add(h); c.add(a.p); });
    c.divideScalar(idx.length);
    const out = c.clone().setX(c.x * .25); if (out.y < 0) out.y *= .4; out.y += 1.2; out.normalize();
    let far = 0; idx.forEach(i => { far = Math.max(far, e.mg.atoms[i].p.clone().sub(c).length() + e.mg.atoms[i].r); });
    const an = new THREE.Object3D(); an.position.copy(c).addScaledVector(out, far + .85); g.add(an);
    const l = lab(o, an, GROUPS[key] || key, 'scb-grp'); l.d.style.opacity = 0;
    return { g, mats: [halo], max: .42, t: 0, labs: [l], set, key };
  }

  function setOv(e, name, want, builder) {
    const cur = e.ov[name];
    if (want) {
      if (cur && cur.key !== undefined && cur.key !== want) { cur.target = 0; cur.dying = true; e.ov[name + '_old' + Math.random()] = cur; delete e.ov[name]; }
      if (!e.ov[name]) { const b = builder(); if (b) { e.ov[name] = b; } }
      if (e.ov[name]) { e.ov[name].target = 1; e.ov[name].dying = false; }
    } else if (cur) cur.target = 0;
  }

  function layout(state) {
    const keys = [state.mol || 'H2O'].concat(state.pair ? [state.pair] : []).map(k => (M[k] ? k : k));
    const keep = [];
    keys.forEach((k, slot) => {
      let e = entries.find(x => !x.dying && x.key === k && x.slot === slot && !keep.includes(x));
      if (!e) { e = makeEntry(k); e.slot = slot; entries.push(e); }
      keep.push(e);
    });
    entries.forEach(e => { if (!keep.includes(e)) { e.dying = true; e.ts = 0; } });
    // posiciones
    const gap = 1.3;
    if (keep.length === 2) {
      const [A, Bm] = keep, tot = 2 * A.mg.radius + gap + 2 * Bm.mg.radius;
      A.tx = -tot / 2 + A.mg.radius; Bm.tx = tot / 2 - Bm.mg.radius;
    } else keep[0].tx = 0;
    keep.forEach(e => { e.ts = 1; if (e.s === 0) e.x = e.tx; });
    const w = keep.length === 2 ? (keep[0].mg.radius + keep[1].mg.radius) * 2 + gap : keep[0].mg.radius * 2;
    const h = Math.max(...keep.map(e => e.mg.ry)) * 2 + (keep.length === 2 ? 1.1 : 0) + (state.dipole ? .9 : 0) + (state.highlight ? 1.3 : 0);
    zoomTarget = Math.max(6.5, fitZoom(o, w + .6, h + .6, 1.14));
    // capas
    keep.forEach(e => {
      setOv(e, 'lp', !!state.lp, () => buildLp(e));
      setOv(e, 'dip', !!state.dipole, () => buildDip(e));
      setOv(e, 'hl', state.highlight || null, () => buildHl(e, state.highlight));
      e.pairMode = keep.length === 2;
    });
    // título
    if (keep.length === 1) { const m = keep[0].m; cap.innerHTML = '<b>' + m.n.replace(/ \(.*\)$/, '') + '</b><span class="f">' + sub(m.f) + '</span>'; }
    else cap.innerHTML = '<b>' + sub(keep[0].m.f) + '</b><span>vs</span><b>' + sub(keep[1].m.f) + '</b>';
  }

  function advance(dt) {
    const k = reduce ? 1 : 1 - Math.exp(-dt * 7);
    if (o.auto && !reduce) { o.rot.y = 0; clock += dt; spin = Math.sin(clock * .55) * .75; }
    if (myZoom === null || Math.abs(o.zoom - myZoom) < 1e-6) { o.zoom += (zoomTarget - o.zoom) * (reduce ? 1 : 1 - Math.exp(-dt * 4)); myZoom = o.zoom; }
    const maxR = Math.max(...entries.filter(x => !x.dying).map(x => x.mg.ry), 1);
    entries.slice().forEach(e => {
      e.s += (e.ts - e.s) * (reduce ? 1 : 1 - Math.exp(-dt * 6));
      e.x += (e.tx - e.x) * k;
      const sc = e.dying ? e.s : easeOut(e.s) * (1 + .06 * Math.sin(Math.PI * clamp(e.s, 0, 1)));
      e.holder.scale.setScalar(Math.max(1e-3, sc));
      e.holder.position.x = e.x;
      e.holder.rotation.y = spin + e.spin;
      e.nameAnchor.position.set(e.x, -maxR - .55, 0);
      e.nameLab.d.style.opacity = e.pairMode && !e.dying ? clamp(e.s, 0, 1) : 0;
      e.mg.atoms.forEach(a => { if (a.lab) a.lab.d.style.opacity = clamp(e.s * 1.4 - .4, 0, 1); });
      // capas
      let dim = 0, hlSet = null;
      Object.keys(e.ov).forEach(n => {
        const v = e.ov[n]; v.t += ((v.target || 0) - v.t) * (reduce ? 1 : 1 - Math.exp(-dt * 6));
        v.mats.forEach((m, i) => { m.opacity = v.t * (i > 0 && v.cloudMax ? v.cloudMax : v.max) * (n.startsWith('hl') ? .8 + .2 * Math.sin(spin * 5) : 1); });
        v.g.visible = v.t > .01;
        v.labs.forEach(l => { l.d.style.opacity = v.t * clamp(e.s, 0, 1); });
        if (n === 'hl') { dim = v.t; hlSet = v.set; }
        if (v.dying && v.t < .01) { v.labs.forEach(l => { const i = o.labels.indexOf(l); if (i >= 0) o.labels.splice(i, 1); l.d.remove(); }); drop(o, v.g); delete e.ov[n]; }
      });
      // atenuar lo que no es del grupo
      e.mg.atoms.forEach((a, i) => {
        const off = hlSet && !hlSet.has(i) ? dim : 0;
        a.mat.opacity = 1 - off * .78; a.mat.transparent = off > .01; a.mat.depthWrite = off < .5;
        if (a.lab) a.lab.d.style.opacity = Math.min(+a.lab.d.style.opacity, 1 - off * .85);
      });
      e.mg.bonds.forEach(b => { const off = hlSet && !(hlSet.has(b.i) && hlSet.has(b.j)) ? dim : 0; b.setOpacity(1 - off * .8); });
      if (e.dying && e.s < .02) {
        drop(o, e.holder); o.labels.slice().forEach(l => { if (l === e.nameLab) { o.labels.splice(o.labels.indexOf(l), 1); l.d.remove(); } }); anchorsRoot.remove(e.nameAnchor);
        entries.splice(entries.indexOf(e), 1);
      }
    });
    // enlaces siguen a los átomos (estáticos, pero actualizamos por si acaso al crear)
  }
  o.tick = advance;

  return {
    set(state) {
      cur = state || {};
      layout(cur);
      if (myZoom === null) o.zoom = zoomTarget; // primera vez: sin animar el zoom
      myZoom = o.zoom; // si el usuario usó la rueda, lo respetamos hasta el siguiente paso
      if (reduce) { advance(1); advance(1); }
    },
    dispose() { o.tick = null; o.dispose(); el.innerHTML = ''; },
    _o: o,
  };
}
