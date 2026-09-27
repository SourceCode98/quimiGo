// Escena "reaction": los átomos se reorganizan de reactivos a productos conservando su identidad.
// Modos: loop (ciclo con pausa), reversible (ida y vuelta, dos carriles a la vez), collide (choques efectivos).
import { M, EL } from '../widgets.js';
import './molecules-extra.js';
import { molFor, compOf } from './molecules-extra.js';
import { THREE, SC, makeStage, Bond, atomMat, lab, unlab, drop, glowTex, fitZoom, aspectOf, sub, ease, easeOut, seg, clamp, lerp, reduce } from './b-kit.js';

const PHASES = [
  ['hold0', 1.1, 'Reactivos'],
  ['appr', 1.0, 'Las moléculas chocan'],
  ['brk', .7, 'Se rompen enlaces'],
  ['trav', 1.8, 'Los átomos se reorganizan'],
  ['form', .7, 'Se forman enlaces nuevos'],
  ['hold1', 2.3, 'Productos: los mismos átomos'],
];
const T = {}; (() => { let t = 0; PHASES.forEach(([k, d]) => { T[k] = [t, t + d]; t += d; }); T.end = t; })();
const FADE = .45;

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const ION = /^[A-Z][a-z]?[\u207a\u207b\u00b2\u00b3]+$/;

function normList(list) {
  return (list || []).map(x => Array.isArray(x) ? (x.length === 1 ? [1, String(x[0])] : [Math.max(1, Math.round(+x[0]) || 1), String(x[1])]) : [1, String(x)]).filter(x => x[1]);
}
function tally(list, t, order) { list.forEach(([c, k]) => { const comp = compOf(k); Object.keys(comp).forEach(e => { if (!(e in t)) t[e] = 0; if (!order.includes(e)) order.push(e); t[e] += comp[e] * c; }); }); }
const fOf = k => (M[k] ? M[k].f : k);

/** Molécula como plantilla (posiciones locales centradas y escaladas). */
function tmpl(key) {
  const m = molFor(key);
  const n = m.a.length;
  const c = m.a.reduce((s, a) => [s[0] + a[1], s[1] + a[2], s[2] + a[3]], [0, 0, 0]).map(v => v / n);
  const atoms = m.a.map((a, i) => {
    let r = (EL[a[0]] ? EL[a[0]].r3 : .4); if (m.rad && m.rad[i]) r = m.rad[i];
    const l = m.lab && m.lab[i] && ION.test(m.lab[i]) ? m.lab[i] : a[0];
    return { sym: a[0], loc: V((a[1] - c[0]) * SC, (a[2] - c[1]) * SC, (a[3] - c[2]) * SC), r, lab: l };
  });
  let radius = .5; atoms.forEach(a => { radius = Math.max(radius, a.loc.length() + a.r); });
  const bmap = {}; m.b.forEach(([i, j, k]) => { bmap[Math.min(i, j) + '-' + Math.max(i, j)] = k; });
  return { key, m, atoms, bonds: m.b.map(b => b.slice()), bmap, radius };
}

/** Acomoda instancias en filas; devuelve posiciones centradas y tamaño. */
function rows(insts, R, pad) {
  const d = insts.map(x => 2 * x.t.radius + pad);
  const total = d.reduce((s, x) => s + x, 0), target = total / R;
  const rs = [[]]; let w = 0;
  insts.forEach((x, i) => { if (rs[rs.length - 1].length && w + d[i] > target * 1.08 && rs.length < R) { rs.push([]); w = 0; } rs[rs.length - 1].push(i); w += d[i]; });
  const rw = rs.map(r => r.reduce((s, i) => s + d[i], 0)), rh = rs.map(r => Math.max(...r.map(i => d[i])));
  const W = Math.max(...rw), H = rh.reduce((s, x) => s + x, 0);
  const pos = [];
  let y = H / 2;
  rs.forEach((r, ri) => { let x = -rw[ri] / 2; const cy = y - rh[ri] / 2; r.forEach(i => { pos[i] = V(x + d[i] / 2, cy, 0); x += d[i]; }); y -= rh[ri]; });
  return { W, H, pos, nrows: rs.length };
}

/** Asigna cada átomo de reactivo a un átomo de producto del mismo elemento (conserva enlaces si se puede). */
function mapAtoms(RA, PA, rBonds, pInsts) {
  const tgt = new Array(RA.length).fill(-1);
  const bySym = {};
  PA.forEach((a, i) => { (bySym[a.sym] = bySym[a.sym] || []).push(i); });
  const cost = (a, b) => Math.abs(a.pos.y - b.pos.y) * 1.2 + Math.abs(a.pos.x - b.pos.x) * .25 + Math.abs(a.pos.z - b.pos.z) * .5;
  // voraz por distancia
  const pairs = [];
  RA.forEach((a, i) => (bySym[a.sym] || []).forEach(j => pairs.push([cost(a, PA[j]), i, j])));
  pairs.sort((x, y) => x[0] - y[0]);
  const usedP = new Set();
  pairs.forEach(([, i, j]) => { if (tgt[i] < 0 && !usedP.has(j)) { tgt[i] = j; usedP.add(j); } });
  const score = () => {
    let s = 0;
    rBonds.forEach(([i, j, k]) => {
      const a = PA[tgt[i]], b = PA[tgt[j]]; if (!a || !b || a.inst !== b.inst) return;
      const kk = pInsts[a.inst].t.bmap[Math.min(a.li, b.li) + '-' + Math.max(a.li, b.li)];
      if (kk === k) s += 4; else if (kk !== undefined) s += 1.5;
    });
    RA.forEach((a, i) => { if (tgt[i] >= 0) s -= cost(a, PA[tgt[i]]) * .35; });
    return s;
  };
  let best = score();
  for (let pass = 0; pass < 12; pass++) {
    let improved = false;
    for (let i = 0; i < RA.length; i++) for (let j = i + 1; j < RA.length; j++) {
      if (RA[i].sym !== RA[j].sym) continue;
      [tgt[i], tgt[j]] = [tgt[j], tgt[i]];
      const s = score();
      if (s > best + 1e-6) { best = s; improved = true; } else[tgt[i], tgt[j]] = [tgt[j], tgt[i]];
    }
    if (!improved) break;
  }
  return tgt;
}

export default function (el) {
  const { st, o } = makeStage(el, 'scb-rx');
  const below = document.createElement('div'); below.className = 'scb-below'; el.appendChild(below);
  const mk = (cls, parent) => { const d = document.createElement('div'); d.className = cls; (parent || st).appendChild(d); return d; };
  const cornerL = mk('scb-corner l'), cornerR = mk('scb-corner r'), phase = mk('scb-phase'), hud = mk('scb-hud'), errBox = mk('scb-err');
  errBox.hidden = true; hud.hidden = reduce;
  let sim = null, dying = [], clock = 0, lastAspect = 0;
  const flashTex = o ? glowTex('rgba(255,236,190,1)', 'rgba(255,190,90,0)') : null;
  const puffTex = o ? glowTex('rgba(190,215,240,.9)', 'rgba(150,180,210,0)') : null;
  if (o) { o.auto = false; o.rot.x = -.1; o.rot.y = 0; }

  /* ---------- panel inferior ---------- */
  function renderBelow(state, L, R, order, ok) {
    const r = normList(state.r), p = normList(state.p);
    const side = l => l.map(([c, k]) => '<span>' + (c > 1 ? c + ' ' : '') + sub(fOf(k)) + '</span>').join('<i>+</i>');
    const arrow = state.mode === 'reversible' ? '⇌' : '→';
    let h = '<div class="scb-eq" aria-label="Ecuación">' + side(r) + '<span class="ar">' + arrow + '</span>' + side(p) + '</div>';
    if (state.count !== false && state.count !== undefined || !ok) {
      const dots = (e, n) => n <= 16 ? '<span class="dots">' + ('<i style="background:' + EL[e].css + '"></i>').repeat(n) + '</span>' : '';
      h += '<div class="scb-count" role="table"><div class="h">Elemento</div><div class="h">Antes</div><div class="h">Después</div><div class="h"></div>';
      order.forEach(e => {
        const a = L[e] || 0, b = R[e] || 0, good = a === b, rb = good ? '' : ' rowbad';
        h += '<div class="el' + rb + '"><i class="dot" style="background:' + EL[e].css + '"></i>' + e + '</div>' +
          '<div class="n' + rb + '"><b>' + a + '</b>' + dots(e, a) + '</div><div class="n' + rb + '"><b' + (good ? '' : ' class="bad"') + '>' + b + '</b>' + dots(e, b) + '</div>' +
          '<div class="ck' + (good ? '' : ' bad') + rb + '">' + (good ? '✓' : (b > a ? 'sobra' + (b - a > 1 ? 'n ' : ' ') + (b - a) : 'falta' + (a - b > 1 ? 'n ' : ' ') + (a - b))) + '</div>';
      });
      h += '</div>';
    } else {
      h += '<div class="legend scb-legend">' + order.map(e => '<span><i class="dot" style="background:' + EL[e].css + '"></i>' + EL[e].name + '</span>').join('') + '</div>';
    }
    below.innerHTML = h;
  }

  /* ---------- construcción de moléculas-instancia ---------- */
  function inst(key, world) {
    const t = tmpl(key);
    return { key, t, world, pos: V(0, 0, 0), rock: Math.random() * 6.28 };
  }
  function newAtomMesh(world, sym, r) {
    const mesh = new THREE.Mesh(o.SPH, atomMat(sym)); mesh.scale.setScalar(r); world.add(mesh); return mesh;
  }
  const rotY = (v, a, out) => { const c = Math.cos(a), s = Math.sin(a); return out.set(v.x * c + v.z * s, v.y, -v.x * s + v.z * c); };
  const tmpV = V(0, 0, 0);

  /* ================= modo loop / reversible ================= */
  function buildLane(world, r, p, lOff, layout, withLabels) {
    const RI = [], PI = [];
    r.forEach(([c, k]) => { for (let i = 0; i < c; i++) RI.push(inst(k, world)); });
    p.forEach(([c, k]) => { for (let i = 0; i < c; i++) PI.push(inst(k, world)); });
    const { lr, lp, gap, offR, offP, vert } = layout(RI, PI);
    RI.forEach((x, i) => { x.home = lr.pos[i].clone().add(offR).add(lOff); });
    PI.forEach((x, i) => { x.home = lp.pos[i].clone().add(offP).add(lOff); x.arc = (lp.nrows > 1 ? ((vert ? lp.pos[i].x : lp.pos[i].y) >= 0 ? 1 : -1) : (i % 2 ? -1 : 1)) * (.55 + .2 * (i % 3)); x.stag = (i / Math.max(1, PI.length - 1)) * .25; });
    // centro de choque: los reactivos se juntan hacia el medio
    const cen = V(0, 0, 0); RI.forEach(x => cen.add(x.home)); cen.divideScalar(RI.length || 1);
    const meet = (vert ? V(0, gap * .2, 0) : V(-gap * .15, 0, 0)).add(lOff);
    RI.forEach(x => { x.meet = meet.clone().add(x.home.clone().sub(cen).multiplyScalar(.62)); });
    // átomos
    const RA = [], PA = [], rBonds = [];
    RI.forEach((x, ii) => { const base = RA.length; x.t.atoms.forEach((a, li) => RA.push({ sym: a.sym, inst: ii, li, pos: x.home.clone().add(a.loc), a })); x.t.bonds.forEach(([i, j, k]) => rBonds.push([base + i, base + j, k])); });
    PI.forEach((x, ii) => { x.t.atoms.forEach((a, li) => PA.push({ sym: a.sym, inst: ii, li, pos: x.home.clone().add(a.loc), a })); });
    const tgt = mapAtoms(RA, PA, rBonds, PI);
    const inv = []; tgt.forEach((j, i) => { inv[j] = i; });
    const atoms = RA.map((ra, i) => {
      const pa = PA[tgt[i]];
      const mesh = newAtomMesh(world, ra.sym, ra.a.r);
      const A = { mesh, ra, pa, rR: ra.a.r, rP: pa.a.r, labR: ra.a.lab, labP: pa.a.lab, jit: Math.random() * 6.28, st: Math.random() * .14 };
      if (withLabels) A.l = lab(o, mesh, A.labR, ION.test(A.labR) ? 'scb-ion' : '');
      return A;
    });
    // enlaces: conservados, rotos, nuevos
    const bonds = [];
    const pKey = (pi, a, b) => pi + ':' + Math.min(a, b) + '-' + Math.max(a, b);
    const pBondsSeen = new Set();
    rBonds.forEach(([i, j, k]) => {
      const a = PA[tgt[i]], b = PA[tgt[j]];
      const kept = a.inst === b.inst && PI[a.inst].t.bmap[Math.min(a.li, b.li) + '-' + Math.max(a.li, b.li)] === k;
      if (kept) pBondsSeen.add(pKey(a.inst, a.li, b.li));
      bonds.push({ b: new Bond(o, world, atoms[i].mesh, atoms[j].mesh, k, { tone: false }), kind: kept ? 'keep' : 'break' });
    });
    PI.forEach((x, pi) => {
      const base = PA.findIndex(q => q.inst === pi);
      x.t.bonds.forEach(([i, j, k]) => {
        if (pBondsSeen.has(pKey(pi, i, j))) return;
        const ai = inv[base + i], aj = inv[base + j];
        bonds.push({ b: new Bond(o, world, atoms[ai].mesh, atoms[aj].mesh, k, { tone: false }), kind: 'form' });
      });
    });
    // destello
    const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: flashTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    fl.position.copy(meet); fl.position.z += .6; world.add(fl);
    return { RI, PI, atoms, bonds, fl, meet, vert };
  }

  function laneLayout(o_, rN, pN, lanes) {
    // prueba varias cantidades de filas (y la disposición vertical en pantallas angostas) y escoge la de moléculas más grandes
    return (RI, PI) => {
      let best = null;
      const narrow = aspectOf(o) < 1.7, gap = narrow ? 1.7 : 2.2, gapV = 1.5, pad = narrow ? .4 : .55;
      for (let a = 1; a <= Math.min(3, RI.length); a++) for (let b = 1; b <= Math.min(3, PI.length); b++) {
        const lr = rows(RI, a, pad), lp = rows(PI, b, pad);
        const w = 2 * Math.max(lr.W, lp.W) + gap, h = Math.max(lr.H, lp.H) * lanes + (lanes > 1 ? .6 : 0);
        const z = fitZoom(o, w + .6, h + 1.7, 1.02);
        if (!best || z < best.z - .01) best = { z, lr, lp, gap, h, w, vert: false };
        {
          const wv = Math.max(lr.W, lp.W), hv = 2 * Math.max(lr.H, lp.H) + gapV;
          const zv = fitZoom(o, wv * lanes + (lanes > 1 ? .9 : 0) + .6, hv + 1.9, 1.02);
          if (zv < best.z * .9) best = { z: zv, lr, lp, gap: gapV, h: hv, w: wv, vert: true };
        }
      }
      // desplazamientos de cada lado
      if (best.vert) { const hh = Math.max(best.lr.H, best.lp.H); best.offR = V(0, best.gap / 2 + hh / 2, 0); best.offP = V(0, -(best.gap / 2 + hh / 2), 0); }
      else { const ww = Math.max(best.lr.W, best.lp.W); best.offR = V(-(best.gap / 2 + ww / 2), 0, 0); best.offP = V(best.gap / 2 + ww / 2, 0, 0); }
      return best;
    };
  }
  function setCorners(vert) {
    cornerL.textContent = 'Reactivos'; cornerR.textContent = 'Productos';
    cornerR.classList.toggle('v', !!vert);
  }

  function buildLoop(state, r, p) {
    const world = new THREE.Group(); o.root.add(world);
    const rev = state.mode === 'reversible';
    const atomsPer = r.reduce((s, [c, k]) => s + c * Object.values(compOf(k)).reduce((a, b) => a + b, 0), 0);
    const nl = rev && atomsPer <= 24 ? 2 : 1;
    const L = laneLayout(o, r.length, p.length, nl);
    // tamaño de carril
    const probe = L(r.flatMap(([c, k]) => Array.from({ length: c }, () => ({ t: tmpl(k) }))), p.flatMap(([c, k]) => Array.from({ length: c }, () => ({ t: tmpl(k) }))));
    const laneH = probe.h / nl + (nl > 1 ? .3 : 0);
    const labels = atomsPer * nl <= 12;
    const lanes = [], arrows = [];
    for (let i = 0; i < nl; i++) {
      const sgn = i === 0 ? 1 : -1;
      const off = nl === 1 ? V(0, 0, 0) : probe.vert ? V(-sgn * (probe.w / 2 + .45), 0, 0) : V(0, sgn * (laneH / 2 + .15), 0);
      lanes.push(buildLane(world, r, p, off, () => probe, labels));
      lanes[i].off = i === 0 ? 0 : T.end;
      // flecha de cada carril
      const an = new THREE.Object3D(); an.position.copy(off); world.add(an);
      arrows.push(lab(o, an, rev ? (probe.vert ? '⇅' : '⇌') : probe.vert ? '↓' : '→', 'scb-arrowlab'));
    }
    const zoom = probe.z;
    setCorners(probe.vert && nl === 1);
    if (probe.vert && nl > 1) { cornerL.textContent = ''; cornerR.textContent = ''; }
    // copia estática de productos para movimiento reducido
    const statics = [];
    if (reduce && !rev) lanes.forEach(ln => ln.PI.forEach(x => {
      x.t.atoms.forEach(a => { const m = newAtomMesh(world, a.sym, a.r); m.position.copy(x.home).add(a.loc); statics.push(m); });
      x.t.bonds.forEach(([i, j, k]) => { const b = new Bond(o, world, { position: x.home.clone().add(x.t.atoms[i].loc) }, { position: x.home.clone().add(x.t.atoms[j].loc) }, k, { tone: false }); statics.push(b); });
    }));
    let t = 0;
    const S = {
      world, zoom, rev, speed: clamp(+state.speed || 1, .25, 3),
      step(dt) {
        t += dt * S.speed;
        lanes.forEach(ln => poseLane(ln, t + ln.off, rev, clock));
        // textos
        if (rev) { phase.textContent = 'Equilibrio: ida y vuelta a la vez'; }
        else if (reduce) phase.textContent = '';
        else {
          const tc = t % (T.end + FADE);
          const ph = PHASES.find(([k]) => tc >= T[k][0] && tc < T[k][1]);
          phase.textContent = ph ? ph[2] : '';
          const tr = seg(tc, T.trav[0] - .2, T.trav[0] + .2) * (1 - seg(tc, T.trav[1] - .2, T.trav[1] + .2));
          arrows.forEach(a => { a.d.style.opacity = 1 - tr * .8; });
        }
      },
      kill() { phase.textContent = ''; },
      seek(x) { t = x; },
    };
    if (reduce && !rev) { lanes.forEach(ln => poseLane(ln, T.hold0[0] + .6, false, 0)); }
    return S;
  }

  function poseLane(ln, tAbs, rev, clk) {
    let tc, fade = 1;
    if (reduce) tc = rev ? T.hold0[0] + .5 : T.hold0[0] + .5;
    else if (rev) { const cyc = 2 * T.end; const m = ((tAbs % cyc) + cyc) % cyc; tc = m < T.end ? m : cyc - m; }
    else { const cyc = T.end + FADE; tc = tAbs % cyc; fade = tAbs < FADE ? easeOut(tAbs / FADE) : tc > T.end ? 1 - ease((tc - T.end) / FADE) : tc < FADE && tAbs > cyc ? easeOut(tc / FADE) : 1; }
    const ap = ease(seg(tc, T.appr[0], T.appr[1]));
    const shake = seg(tc, T.brk[0] - .2, T.brk[0] + .1) * (1 - seg(tc, T.trav[0] + .2, T.trav[0] + .5));
    const pR = V(0, 0, 0), pP = V(0, 0, 0);
    const spread = ease(seg(tc, T.brk[0] + .15, T.trav[0] + .35));
    ln.atoms.forEach(A => {
      const ri = ln.RI[A.ra.inst], pi = ln.PI[A.pa.inst];
      const cR = ri.home.clone().lerp(ri.meet, ap);
      rotY(A.ra.a.loc, Math.sin(clk * .7 + ri.rock) * .45, pR).multiplyScalar(1 + .45 * spread).add(cR);
      if (shake > 0) { pR.x += Math.sin(clk * 37 + A.jit) * .06 * shake; pR.y += Math.cos(clk * 41 + A.jit * 2) * .06 * shake; }
      rotY(A.pa.a.loc, Math.sin(clk * .6 + pi.rock) * .35 * seg(tc, T.form[0], T.hold1[0] + .6), pP).add(pi.home);
      const st = (pi.stag || 0) + A.st;
      const s = ease(seg(tc, T.trav[0] + .1 + st, T.trav[1] - .4 + st));
      const pos = A.mesh.position.copy(pR).lerp(pP, s);
      const b = Math.sin(Math.PI * s);
      if (ln.vert) pos.x += (pi.arc || .5) * b * .9; else pos.y += (pi.arc || .5) * b * .9; pos.z += .45 * b * Math.sign(pi.arc || 1);
      A.mesh.scale.setScalar(Math.max(1e-3, lerp(A.rR, A.rP, s) * fade));
      if (A.l) {
        const want = s > .5 ? A.labP : A.labR;
        if (A.l.d.textContent !== want) { A.l.d.textContent = want; A.l.d.className = 'lab' + (ION.test(want) ? ' scb-ion' : ''); }
        A.l.d.style.opacity = fade < .6 ? 0 : 1;
      }
    });
    const brk = 1 - seg(tc, T.brk[0], T.brk[0] + .5);
    const form = seg(tc, T.form[0], T.form[1]);
    ln.bonds.forEach(B => {
      const op = B.kind === 'keep' ? 1 : B.kind === 'break' ? brk : form;
      B.b.setOpacity(op * fade); B.b.update();
    });
    const fl = seg(tc, T.brk[0] - .15, T.brk[0] + .15) * (1 - seg(tc, T.brk[0] + .2, T.brk[1] + .2));
    ln.fl.material.opacity = fl * .55; ln.fl.scale.setScalar(.5 + 2.2 * fl);
    ln.fl.visible = fl > .01;
  }

  /* ================= modo collide ================= */
  function buildCollide(state, r, p) {
    const world = new THREE.Group(); o.root.add(world);
    const asp = aspectOf(o);
    const BY = 6.4, BX = clamp(BY * asp * .92, 6, 17), BZ = 3.2;
    const box = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(BX, BY, BZ)), new THREE.LineBasicMaterial({ color: 0x5E7688, transparent: true, opacity: .55 }));
    world.add(box);
    const unitAtoms = r.reduce((s, [c, k]) => s + c * Object.values(compOf(k)).reduce((a, b) => a + b, 0), 0);
    const unitMols = r.reduce((s, [c]) => s + c, 0);
    let copies = clamp(Math.floor(40 / unitAtoms), 1, 6);
    while (copies > 1 && copies * unitMols > 18) copies--;
    while (copies < 6 && copies * unitMols < 8 && (copies + 1) * unitAtoms <= 48) copies++;
    const temp = clamp(state.temp === undefined ? .5 : +state.temp, 0, 1);
    const vmag = () => (1 + 3.4 * temp) * (.65 + .7 * Math.random());
    const bodies = [];
    const pool = [];
    const sprite = (tex) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); s.visible = false; world.add(s); return s; };
    for (let i = 0; i < 8; i++) pool.push({ s: sprite(i < 3 ? flashTex : puffTex), big: i < 3, t: 1 });
    const fx = (pos, big) => { const f = pool.find(x => x.big === big && x.t >= 1); if (!f) return; f.t = 0; f.s.position.copy(pos); f.s.visible = true; };
    const rndDir = () => { const v = V(Math.random() - .5, Math.random() - .5, (Math.random() - .5) * .5); return v.normalize(); };
    const react = new Set(r.map(x => x[1]));
    const labels = false;
    function addBody(t, pos, vel, atoms, bonds, kind) {
      const b = { t, pos, vel, atoms, bonds, kind, rot: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random() * 6, Math.random() * 6, 0)), spin: V(Math.random() - .5, Math.random() - .5, Math.random() - .5).multiplyScalar(1.5), busy: false, cool: 0, alpha: 1 };
      bodies.push(b); return b;
    }
    function spawnAll() {
      const list = []; for (let c = 0; c < copies; c++) r.forEach(([n, k]) => { for (let i = 0; i < n; i++) list.push(k); });
      list.forEach((k, i) => {
        const t = tmpl(k);
        let pos, tries = 0;
        do { pos = V((Math.random() - .5) * (BX - 2 * t.radius - .4), (Math.random() - .5) * (BY - 2 * t.radius - .4), (Math.random() - .5) * (BZ - 2 * Math.min(t.radius, 1) - .2)); tries++; }
        while (tries < 40 && bodies.some(b => b.pos.distanceTo(pos) < (b.t.radius + t.radius) * .9));
        const atoms = t.atoms.map(a => ({ mesh: newAtomMesh(world, a.sym, a.r), loc: a.loc.clone(), a }));
        const bonds = t.bonds.map(([i, j, kk]) => ({ b: new Bond(o, world, atoms[i].mesh, atoms[j].mesh, kk, { tone: false }), i, j, k: kk }));
        addBody(t, pos, rndDir().multiplyScalar(vmag()), atoms, bonds, 'R');
      });
    }
    let hits = 0, good = 0, clockC = 0, doneT = 0, events = [], fadeT = 0, phaseR = 'run';
    const hudShow = () => { hud.innerHTML = '<span>Choques <b>' + hits + '</b></span><span class="ok">Efectivos <b>' + good + '</b></span>'; };
    function place(b) {
      b.atoms.forEach(A => { A.mesh.position.copy(A.loc).applyQuaternion(b.rot).add(b.pos); });
      b.bonds.forEach(B => B.b.update());
    }
    function clear() {
      events = [];
      bodies.forEach(b => { b.atoms.forEach(A => drop(o, A.mesh)); b.bonds.forEach(B => B.b.dispose()); });
      bodies.length = 0;
    }
    function tryReact(b1, b2, at) {
      // reunir un juego completo de reactivos
      const need = {}; r.forEach(([c, k]) => { need[k] = (need[k] || 0) + c; });
      const chosen = [b1, b2];
      need[b1.t.key]--; need[b2.t.key]--;
      if (need[b1.t.key] < 0 || need[b2.t.key] < 0) return false;
      for (const k of Object.keys(need)) {
        while (need[k] > 0) {
          const cand = bodies.filter(b => b.kind === 'R' && !b.busy && !chosen.includes(b) && b.t.key === k).sort((x, y) => x.pos.distanceTo(at) - y.pos.distanceTo(at))[0];
          if (!cand) return false; chosen.push(cand); need[k]--;
        }
      }
      // productos alrededor del punto de choque
      const PI = []; p.forEach(([c, k]) => { for (let i = 0; i < c; i++) PI.push({ t: tmpl(k) }); });
      const lay = rows(PI, PI.length > 3 ? 2 : 1, .25);
      const cen = at.clone();
      cen.x = clamp(cen.x, -BX / 2 + lay.W / 2 + .2, BX / 2 - lay.W / 2 - .2); cen.y = clamp(cen.y, -BY / 2 + lay.H / 2 + .2, BY / 2 - lay.H / 2 - .2); cen.z = 0;
      PI.forEach((x, i) => { x.home = lay.pos[i].clone().add(cen); });
      const RA = [], rBonds = [], PA = [];
      chosen.forEach((b, bi) => { const base = RA.length; b.atoms.forEach((A, li) => RA.push({ sym: A.a.sym, inst: bi, li, pos: A.mesh.position.clone(), A })); b.bonds.forEach(B => rBonds.push([base + B.i, base + B.j, B.k, B])); });
      PI.forEach((x, pi) => x.t.atoms.forEach((a, li) => PA.push({ sym: a.sym, inst: pi, li, pos: x.home.clone().add(a.loc), a })));
      const tgt = mapAtoms(RA, PA, rBonds, PI);
      const inv = []; tgt.forEach((j, i) => { inv[j] = i; });
      const ev = { t: 0, chosen, PI, RA, PA, tgt, from: RA.map(x => x.pos.clone()), keep: [], brk: [], form: [], cen };
      const seen = new Set();
      rBonds.forEach(([i, j, k, B]) => {
        const a = PA[tgt[i]], b = PA[tgt[j]];
        const kept = a.inst === b.inst && PI[a.inst].t.bmap[Math.min(a.li, b.li) + '-' + Math.max(a.li, b.li)] === k;
        if (kept) { seen.add(a.inst + ':' + Math.min(a.li, b.li) + '-' + Math.max(a.li, b.li)); ev.keep.push(B.b); } else ev.brk.push(B.b);
      });
      PI.forEach((x, pi) => {
        const base = PA.findIndex(q => q.inst === pi);
        x.t.bonds.forEach(([i, j, k]) => {
          if (seen.has(pi + ':' + Math.min(i, j) + '-' + Math.max(i, j))) return;
          const B = new Bond(o, world, RA[inv[base + i]].A.mesh, RA[inv[base + j]].A.mesh, k, { tone: false }); B.setOpacity(0);
          ev.form.push({ B, pi, i, j, k });
        });
      });
      chosen.forEach(b => { b.busy = true; });
      events.push(ev); fx(cen, true); good++;
      return true;
    }
    function finishEvent(ev) {
      // crear cuerpos de productos
      ev.PI.forEach((x, pi) => {
        const base = ev.PA.findIndex(q => q.inst === pi);
        const atoms = x.t.atoms.map((a, li) => { const A = ev.RA[ev.tgt.indexOf(base + li)].A; return { mesh: A.mesh, loc: a.loc.clone(), a }; });
        const bonds = [];
        x.t.bonds.forEach(([i, j, k]) => {
          const f = ev.form.find(q => q.pi === pi && ((q.i === i && q.j === j) || (q.i === j && q.j === i)));
          if (f) bonds.push({ b: f.B, i, j, k });
          else { const B = ev.keep.find(bb => (bb.a === atoms[i].mesh && bb.b === atoms[j].mesh) || (bb.a === atoms[j].mesh && bb.b === atoms[i].mesh)); if (B) bonds.push({ b: B, i, j, k }); }
        });
        const nb = addBody(x.t, x.home.clone(), V(0, 0, 0).add(x.home.clone().sub(ev.cen).normalize().multiplyScalar(1.2)).add(rndDir().multiplyScalar(vmag() * .7)), atoms, bonds, 'P');
        nb.rot.identity(); nb.cool = .6;
      });
      ev.brk.forEach(B => B.dispose());
      ev.chosen.forEach(b => bodies.splice(bodies.indexOf(b), 1));
    }
    spawnAll(); bodies.forEach(place); hudShow();
    const zoom = fitZoom(o, BX + .4, BY + 1.3, 1.02);
    const S = {
      world, zoom, speed: clamp(+state.speed || 1, .25, 3),
      step(dt) {
        dt *= S.speed; clockC += dt;
        if (phaseR === 'fade') {
          fadeT += dt; const f = 1 - clamp(fadeT / .5, 0, 1);
          bodies.forEach(b => b.atoms.forEach(A => A.mesh.scale.setScalar(Math.max(1e-3, A.a.r * f))));
          bodies.forEach(b => b.bonds.forEach(B => B.b.setOpacity(f)));
          if (fadeT > .55) { clear(); spawnAll(); hits = 0; good = 0; hudShow(); phaseR = 'in'; fadeT = 0; bodies.forEach(b => b.atoms.forEach(A => A.mesh.scale.setScalar(1e-3))); }
          return;
        }
        if (phaseR === 'in') { fadeT += dt; const f = easeOut(fadeT / .5); bodies.forEach(b => { b.atoms.forEach(A => A.mesh.scale.setScalar(Math.max(1e-3, A.a.r * f))); b.bonds.forEach(B => B.b.setOpacity(Math.min(1, f))); }); if (fadeT >= .5) phaseR = 'run'; }
        // mover
        bodies.forEach(b => {
          if (b.busy) return;
          b.pos.addScaledVector(b.vel, dt);
          const w = b.spin.length(); if (w > 0) b.rot.premultiply(new THREE.Quaternion().setFromAxisAngle(tmpV.copy(b.spin).divideScalar(w), w * dt));
          const rr = Math.min(b.t.radius * .8, 1.6);
          [['x', BX], ['y', BY], ['z', BZ]].forEach(([k, L]) => { const lim = L / 2 - Math.min(rr, L / 2 - .3); if (b.pos[k] > lim) { b.pos[k] = lim; b.vel[k] = -Math.abs(b.vel[k]); } if (b.pos[k] < -lim) { b.pos[k] = -lim; b.vel[k] = Math.abs(b.vel[k]); } });
          b.cool = Math.max(0, b.cool - dt);
        });
        // choques
        for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i], b = bodies[j]; if (a.busy || b.busy) continue;
          const d = tmpV.subVectors(b.pos, a.pos); const dist = d.length(); const R = (a.t.radius + b.t.radius) * .72;
          if (dist >= R || dist < 1e-4) continue;
          d.divideScalar(dist);
          const rel = a.vel.clone().sub(b.vel).dot(d);
          const push = (R - dist) / 2; a.pos.addScaledVector(d, -push); b.pos.addScaledVector(d, push);
          if (rel <= 0) continue;
          a.vel.addScaledVector(d, -rel); b.vel.addScaledVector(d, rel);
          if (a.cool > 0 || b.cool > 0) continue;
          a.cool = b.cool = .25;
          hits++;
          const at = a.pos.clone().lerp(b.pos, .5);
          const can = a.kind === 'R' && b.kind === 'R' && (a.t.key !== b.t.key || react.size === 1);
          const pr = .02 + .7 * temp * temp;
          if (can && Math.random() < pr && tryReact(a, b, at)) { /* efectivo */ } else fx(at, false);
          hudShow();
        }
        // eventos de reacción
        events.slice().forEach(ev => {
          ev.t += dt; const u = ev.t / 1.3;
          const s = ease(seg(u, .15, .85));
          ev.RA.forEach((ra, i) => {
            const pa = ev.PA[ev.tgt[i]];
            const pos = ra.A.mesh.position.copy(ev.from[i]).lerp(pa.pos, s);
            pos.z += Math.sin(Math.PI * s) * .5;
            if (s < .2) { pos.x += Math.sin(clockC * 40 + i) * .05; pos.y += Math.cos(clockC * 37 + i) * .05; }
            ra.A.mesh.scale.setScalar(lerp(ra.A.a.r, pa.a.r, s)); ra.A.a = s > .5 ? pa.a : ra.A.a;
          });
          ev.brk.forEach(B => { B.setOpacity(1 - seg(u, .05, .4)); B.update(); });
          ev.keep.forEach(B => B.update());
          ev.form.forEach(f => { f.B.setOpacity(seg(u, .65, 1)); f.B.update(); });
          if (u >= 1) { events.splice(events.indexOf(ev), 1); finishEvent(ev); }
        });
        bodies.forEach(b => { if (!b.busy) place(b); });
        pool.forEach(f => { if (f.t < 1) { f.t += dt / (f.big ? .7 : .35); const k = Math.min(1, f.t); f.s.material.opacity = (1 - k) * (f.big ? 1 : .55); f.s.scale.setScalar(f.big ? .8 + 3.5 * easeOut(k) : .4 + 1.1 * k); if (f.t >= 1) f.s.visible = false; } });
        // fin del ciclo
        const left = bodies.filter(b => b.kind === 'R');
        const kinds = new Set(left.map(b => b.t.key));
        const stuck = !events.length && (left.length === 0 || [...react].some(k => !kinds.has(k)));
        if (stuck) { doneT += dt; if (doneT > 3) { phaseR = 'fade'; fadeT = 0; doneT = 0; } }
        else if (clockC > 60) { phaseR = 'fade'; fadeT = 0; clockC = 0; }
        phase.textContent = '';
      },
      kill() { hud.innerHTML = ''; },
    };
    return S;
  }

  /* ================= ecuación sin balancear ================= */
  function buildStatic(r, p) {
    const world = new THREE.Group(); o.root.add(world);
    const RI = [], PI = [];
    r.forEach(([c, k]) => { for (let i = 0; i < c; i++) RI.push({ t: tmpl(k) }); });
    p.forEach(([c, k]) => { for (let i = 0; i < c; i++) PI.push({ t: tmpl(k) }); });
    const L = laneLayout(o, 0, 0, 1)(RI, PI);

    const groups = [];
    const put = (x, pos) => {
      const g = new THREE.Group(); g.position.copy(pos); world.add(g); groups.push(g);
      const ms = x.t.atoms.map(a => { const m = new THREE.Mesh(o.SPH, atomMat(a.sym)); m.scale.setScalar(a.r); m.position.copy(a.loc); g.add(m); return m; });
      x.t.bonds.forEach(([i, j, k]) => new Bond(o, g, ms[i], ms[j], k, { tone: false }));
    };
    RI.forEach((x, i) => put(x, L.lr.pos[i].clone().add(L.offR)));
    PI.forEach((x, i) => put(x, L.lp.pos[i].clone().add(L.offP)));
    const an = new THREE.Object3D(); world.add(an); lab(o, an, L.vert ? '↓' : '→', 'scb-arrowlab'); setCorners(L.vert);
    const zoom = L.z;
    return { world, zoom, step() { groups.forEach((g, i) => { g.rotation.y = Math.sin(clock * .6 + i) * .35; }); }, kill() { } };
  }

  /* ---------- ciclo ---------- */
  let zoomTarget = 9, myZoom = null, curState = null, frozen = false;
  function build(state) {
    const r = normList(state.r && state.r.length ? state.r : [[1, 'CH4'], [2, 'O2']]);
    const p = normList(state.p && state.p.length ? state.p : (state.r && state.r.length ? [] : [[1, 'CO2'], [2, 'H2O']]));
    const L = {}, R = {}, order = [];
    tally(r, L, order); tally(p, R, order);
    const ok = order.every(e => (L[e] || 0) === (R[e] || 0)) && p.length > 0;
    renderBelow(state, L, R, order, ok);
    if (!o) return null;
    const rev = state.mode === 'reversible';
    errBox.hidden = ok;
    let S;
    if (!ok) {
      const bad = order.filter(e => (L[e] || 0) !== (R[e] || 0));
      errBox.innerHTML = '<span>Ecuación sin balancear · ' + bad.map(e => e + ': ' + (L[e] || 0) + ' antes, ' + (R[e] || 0) + ' después').join(' · ') + '</span>';
      S = buildStatic(r, p);
      phase.textContent = ''; hud.innerHTML = '';
    } else if (state.mode === 'collide') {
      cornerL.textContent = ''; cornerR.textContent = '';
      S = buildCollide(state, r, p);
    } else S = buildLoop(state, r, p);
    S.sig = JSON.stringify([r, p, state.mode || 'loop', state.mode === 'collide' ? state.temp : 0]);
    S.world.scale.setScalar(reduce ? 1 : .001); S.grow = 0;
    return S;
  }

  if (o) {
    o.tick = dt => {
      if (frozen) dt = 0;
      clock += dt;
      const a = aspectOf(o);
      if (sim && Math.abs(a - lastAspect) / Math.max(a, .1) > .04 && lastAspect) { lastAspect = a; if (curState) { const s = curState; curState = null; api.set(s); } return; }
      lastAspect = a;
      if (sim) {
        sim.grow = Math.min(1, sim.grow + dt / .4);
        sim.world.scale.setScalar(Math.max(.001, easeOut(sim.grow)));
        sim.step(dt);
      }
      dying.slice().forEach(d => { d.k -= dt / .3; d.S.world.scale.setScalar(Math.max(.001, ease(d.k))); if (d.k <= 0) { drop(o, d.S.world); dying.splice(dying.indexOf(d), 1); } });
      if (myZoom === null || Math.abs(o.zoom - myZoom) < 1e-6) { o.zoom += (zoomTarget - o.zoom) * (1 - Math.exp(-dt * 5)); myZoom = o.zoom; }
    };
  }

  const api = {
    set(state) {
      state = state || {};
      const r = normList(state.r), p = normList(state.p);
      const sig = JSON.stringify([r.length ? r : null, p, state.mode || 'loop', state.mode === 'collide' ? state.temp : 0]);
      if (sim && curState && sim.sig0 === sig) {
        sim.speed = clamp(+state.speed || 1, .25, 3);
        curState = state;
        const L = {}, R = {}, order = []; tally(sim.r, L, order); tally(sim.p, R, order);
        renderBelow(state, L, R, order, order.every(e => (L[e] || 0) === (R[e] || 0)));
        return;
      }
      curState = state;
      if (sim && o) { sim.kill(); dying.push({ S: sim, k: 1 }); if (reduce) { drop(o, sim.world); dying.pop(); } }
      o && o.labels.slice().forEach(l => { if (!l.obj.parent || !isIn(l.obj)) unlab(o, l); });
      sim = build(state);
      if (sim) {
        sim.sig0 = sig; sim.r = r.length ? r : normList([[1, 'CH4'], [2, 'O2']]); sim.p = p.length ? p : (r.length ? [] : normList([[1, 'CO2'], [2, 'H2O']]));
        zoomTarget = sim.zoom; if (myZoom === null) { o.zoom = zoomTarget; } myZoom = o.zoom;
        lastAspect = aspectOf(o);
        sim.step(0);
      }
    },
    dispose() { if (o) { o.tick = null; o.dispose(); } el.innerHTML = ''; },
    _o: o,
    _seek(x) { frozen = true; if (sim && sim.seek) sim.seek(x); sim && sim.step(0); },
    _run() { frozen = false; },
  };
  const isIn = obj => { let x = obj; while (x) { if (sim && x === sim.world) return true; if (dying.some(d => d.S.world === x)) return true; x = x.parent; } return false; };
  return api;
}
