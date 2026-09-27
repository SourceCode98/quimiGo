// Escena "chain": macromoléculas (polietileno, PVC, almidón, proteína, ADN, lípido) que se arman paso a paso.
import { EL } from '../widgets.js';
import { THREE, SC, makeStage, Bond, atomMat, lab, drop, fitZoom, aspectOf, caption, ease, easeOut, seg, clamp, lerp, reduce } from './b-kit.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const INFO = {
  polyethylene: ['Polietileno', '(–CH₂–CH₂–)ₙ'], pvc: ['PVC (policloruro de vinilo)', '(–CH₂–CHCl–)ₙ'],
  starch: ['Almidón (amilosa)', 'glucosa + glucosa + …'], protein: ['Proteína', 'hélice α'],
  dna: ['ADN', 'doble hélice'], lipid: ['Triglicérido', 'glicerol + 3 ácidos grasos'],
};
const DEF_N = { polyethylene: 8, pvc: 8, starch: 5, protein: 18, dna: 20, lipid: 12 };
const MAX_N = { polyethylene: 10, pvc: 10, starch: 7, protein: 30, dna: 30, lipid: 16 };
const BASE = { A: '#FF6B6B', T: '#FFD166', G: '#06D6A0', C: '#4DA3FF' };
const AA = [['Gly', 'h'], ['Ala', 'h'], ['Ser', 'p'], ['Glu', 'a'], ['Lys', 'b'], ['Leu', 'h'], ['Thr', 'p'], ['Asp', 'a'], ['Arg', 'b'], ['Val', 'h'], ['Asn', 'p'], ['Phe', 'h']];
const AA_COL = { h: '#F2C94C', p: '#56CCF2', a: '#EB5757', b: '#6C8CFF' };

/** Motor de línea de tiempo: átomos que aparecen y se mueven, enlaces que aparecen o desaparecen, etiquetas con ventana. */
function engine(o, W) {
  const A = [], B = [], L = [], H = [], mats = {};
  const matFor = key => mats[key] || (mats[key] = key[0] === '#' ? new THREE.MeshPhysicalMaterial({ color: key, roughness: .35, clearcoat: .3 }) : atomMat(key));
  const api = {
    A, B, L, H,
    atom(key, r, p1, opt) {
      opt = opt || {};
      const m = new THREE.Mesh(o.SPH, matFor(key)); m.scale.setScalar(.001); W.add(m);
      const a = { m, r, p1: p1.clone(), p0: (opt.p0 || p1).clone(), t0: opt.t0 || 0, t1: opt.t1 || 0, tIn: opt.tIn || 0, arc: opt.arc || 0, bob: opt.bob || 0, ph0: Math.random() * 6.28 };
      m.position.copy(a.p0); A.push(a); return a;
    },
    bond(a, b, order, opt) {
      opt = opt || {};
      const bd = new Bond(o, W, a.m, b.m, order, Object.assign({ tone: opt.color === undefined, ca: opt.ca, cb: opt.cb, ra: a.r, rb: b.r }, opt));
      const x = { b: bd, a, bb: b, tIn: opt.tIn || 0, tOut: opt.tOut === undefined ? 1e9 : opt.tOut }; B.push(x); return x;
    },
    label(obj, text, cls, tIn, tOut) { const l = lab(o, obj, text, cls); l.d.style.opacity = 0; L.push({ l, tIn, tOut }); return l; },
    hook(f) { H.push(f); },
    step(t, clock, fade) {
      A.forEach(a => {
        const s = ease(seg(t, a.t0, a.t1));
        const vis = easeOut(seg(t, a.tIn, a.tIn + .35));
        a.m.position.copy(a.p0).lerp(a.p1, s);
        if (a.arc) a.m.position.y += Math.sin(Math.PI * s) * a.arc;
        if (a.bob) { const k = (1 - s) * a.bob; a.m.position.y += Math.sin(clock * 1.6 + a.ph0) * k; a.m.position.x += Math.cos(clock * 1.1 + a.ph0) * k * .5; }
        a.m.scale.setScalar(Math.max(.001, a.r * vis * fade));
        a.m.visible = vis * fade > .002;
      });
      B.forEach(x => {
        const op = seg(t, x.tIn, x.tIn + .35) * (1 - seg(t, x.tOut, x.tOut + .35)) * fade;
        x.b.setOpacity(op); if (op > .01) x.b.update();
      });
      L.forEach(x => { x.l.d.style.opacity = seg(t, x.tIn, x.tIn + .3) * (1 - seg(t, x.tOut, x.tOut + .3)) * fade; });
      H.forEach(f => f(t, clock, fade));
    },
  };
  return api;
}

export default function (el) {
  const { st, o } = makeStage(el, 'scb-chain');
  const cap = caption(st);
  const phase = document.createElement('div'); phase.className = 'scb-phase'; st.appendChild(phase);
  const legend = document.createElement('div'); legend.className = 'legend scb-legend scb-lg'; el.appendChild(legend);
  if (!o) return { set(s) { renderLegend((s && s.kind) || 'polyethylene'); }, dispose() { el.innerHTML = ''; } };
  o.auto = false; o.rot.x = -.18; o.rot.y = 0;
  let cur = null, dying = [], clock = 0, zoomTarget = 12, myZoom = null, lastAspect = 0, curState = null;

  function renderLegend(kind) {
    const dot = (c, t) => '<span><i class="dot" style="background:' + c + '"></i>' + t + '</span>';
    const L = {
      polyethylene: dot(EL.C.css, 'Carbono') + dot(EL.H.css, 'Hidrógeno'),
      pvc: dot(EL.C.css, 'Carbono') + dot(EL.H.css, 'Hidrógeno') + dot(EL.Cl.css, 'Cloro'),
      starch: dot(EL.C.css, 'Carbono') + dot(EL.O.css, 'Oxígeno') + '<span>(sin hidrógenos)</span>',
      protein: dot(AA_COL.h, 'Apolar') + dot(AA_COL.p, 'Polar') + dot(AA_COL.a, 'Ácido') + dot(AA_COL.b, 'Básico') + '<span><i class="scb-dash"></i>Puente de H</span>',
      dna: dot(BASE.A, 'Adenina') + dot(BASE.T, 'Timina') + dot(BASE.G, 'Guanina') + dot(BASE.C, 'Citosina'),
      lipid: dot(EL.C.css, 'Carbono') + dot(EL.O.css, 'Oxígeno') + '<span>(sin hidrógenos)</span>',
    };
    legend.innerHTML = L[kind] || '';
  }

  /* ---------- polietileno y PVC ---------- */
  function polymer(W, E, n, grow, pvc) {
    const dx = 1.277 * SC, hy = .43 * SC, CH = 1.09 * SC, CC2 = 1.34 * SC, CCl = 1.77 * SC;
    const N = 2 * n, x0 = -(N - 1) * dx / 2;
    const ang = 54.75 * Math.PI / 180;
    const step = .85, T0 = .9;
    const poolY = hy + 3.1;
    const Cs = [];
    let tEnd = 0;
    const lblAnchor = new THREE.Object3D(); W.add(lblAnchor);
    for (let k = 0; k < n; k++) {
      const t0 = grow ? T0 + k * step : 0, t1 = grow ? t0 + .95 : 0; tEnd = t1;
      // posiciones finales (cadena en zigzag, sp3)
      const ia = 2 * k, ib = 2 * k + 1;
      const fin = i => V(x0 + i * dx, (i % 2 ? hy : -hy), 0);
      const hFin = (i, s) => { const sg = i % 2 ? 1 : -1; return fin(i).add(V(0, sg * Math.cos(ang) * CH, s * Math.sin(ang) * CH)); };
      // posiciones iniciales: monómero suelto (sp2, plano) en la "reserva" de arriba
      const cx = x0 + (k + .5) * 2 * dx + (k % 2 ? .25 : -.25), cy = poolY + (k % 3) * .35, tilt = (k % 2 ? .35 : -.3);
      const R = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(.5 + tilt, tilt * 1.5, tilt));
      const loc = v => v.clone().applyMatrix4(R).add(V(cx, cy, 0));
      const sa = V(-CC2 / 2, 0, 0), sb = V(CC2 / 2, 0, 0);
      const h60 = (c, sgx, sgy) => c.clone().add(V(sgx * .5 * CH, sgy * .866 * CH, 0));
      const mk = (key, r, p1, p0) => E.atom(key, r, p1, grow ? { p0, t0, t1, tIn: .05 + k * .05, bob: .12 } : {});
      const Ca = mk('C', .4, fin(ia), loc(sa)), Cb = mk('C', .4, fin(ib), loc(sb));
      const Ha1 = mk('H', .25, hFin(ia, 1), loc(h60(sa, -1, 1))), Ha2 = mk('H', .25, hFin(ia, -1), loc(h60(sa, -1, -1)));
      const Hb1 = mk('H', .25, hFin(ib, 1), loc(h60(sb, 1, 1)));
      const Xb2 = pvc ? E.atom('Cl', .46, fin(ib).add(V(0, Math.cos(ang) * CCl, -Math.sin(ang) * CCl)), grow ? { p0: loc(sb.clone().add(V(.5 * CCl, -.866 * CCl, 0))), t0, t1, tIn: .05 + k * .05, bob: .12 } : {}) : mk('H', .25, hFin(ib, -1), loc(h60(sb, 1, -1)));
      [Ca, Cb, Ha1, Ha2, Hb1, Xb2].forEach(a => { a.ph0 = k * 1.3; });
      const cc = { ca: EL.C.hex, cb: EL.C.hex };
      E.bond(Ca, Cb, 1, Object.assign({ tIn: grow ? t1 - .25 : 0 }, cc));
      if (grow) E.bond(Ca, Cb, 2, Object.assign({ tIn: 0, tOut: t1 - .35 }, cc));
      [[Ca, Ha1], [Ca, Ha2], [Cb, Hb1], [Cb, Xb2]].forEach(([a, b]) => E.bond(a, b, 1, { ca: EL.C.hex, cb: EL[b === Xb2 && pvc ? 'Cl' : 'H'].hex }));
      if (k > 0) E.bond(Cs[Cs.length - 1], Ca, 1, Object.assign({ tIn: grow ? t1 - .2 : 0 }, cc));
      Cs.push(Ca, Cb);
      if (grow) E.hook((t) => { if ((k === 0 || t >= t0 - .3) && (k === n - 1 || t < t0 + step - .3)) lblAnchor.position.copy(Ca.m.position).lerp(Cb.m.position, .5).add(V(0, .95, 0)); });
    }
    // extremos: la cadena continúa
    const stubs = [];
    [[Cs[0], -1], [Cs[Cs.length - 1], 1]].forEach(([c, s]) => {
      const end = { m: new THREE.Object3D(), r: 0 }; W.add(end.m);
      const dir = V(s * dx, (c === Cs[0] ? -1 : 1) * 0 + (s < 0 ? hy * 2 * (c.p1.y < 0 ? 1 : -1) : hy * 2 * (c.p1.y < 0 ? 1 : -1)), 0).multiplyScalar(.55);
      end.m.position.copy(c.p1).add(dir);
      stubs.push(E.bond(c, end, 1, { tIn: grow ? tEnd + .2 : 0, color: 0x8C98A4, r: .06 }));
      const d = new THREE.Object3D(); d.position.copy(c.p1).add(dir.clone().multiplyScalar(1.7)); W.add(d);
      E.label(d, '···', 'scb-soft', grow ? tEnd + .3 : 0, 1e9);
    });
    const name = pvc ? 'Cloruro de vinilo' : 'Eteno';
    if (grow) E.label(lblAnchor, name, 'scb-soft', T0 - .6, tEnd + .1);
    const TL = grow ? tEnd + 3.2 : 1e9;
    E.hook((t, clk) => {
      phase.textContent = !grow ? '' : t < T0 ? 'Monómeros: ' + name.toLowerCase() : t < tEnd + .2 ? 'Se abre el doble enlace y se unen' : pvc ? 'Polímero: PVC' : 'Polímero: polietileno';
      W.rotation.y = Math.sin(clk * .35) * .22;
    });
    const w = N * dx + 4.2, h = grow ? poolY + hy + 2.2 : 2 * hy + 2.4;
    const yOff = grow ? -(poolY - hy) / 2 + .1 : 0;
    W.position.y = yOff;
    if (grow) E.hook(t => { W.position.y = lerp(yOff, 0, ease(seg(t, tEnd - .6, tEnd + .9))); });
    return { TL, w, h };
  }

  /* ---------- agua que sale en una condensación ---------- */
  function waterPop(E, W, p, tA, withLabel, waters) {
    const up = V(-.5, 1.2, 1.1);
    const mk = (sym, r, d) => E.atom(sym, r, p.clone().add(up).add(d), { p0: p.clone().add(d), t0: tA, t1: tA + 1.1, tIn: tA - .05 });
    const Ow = mk('O', .3, V(0, 0, 0)), H1 = mk('H', .2, V(.36, -.26, 0)), H2 = mk('H', .2, V(-.36, -.26, 0));
    E.bond(Ow, H1, 1, { tIn: tA, tOut: tA + 1.3, ca: EL.O.hex, cb: EL.H.hex }); E.bond(Ow, H2, 1, { tIn: tA, tOut: tA + 1.3, ca: EL.O.hex, cb: EL.H.hex });
    waters.push({ ms: [Ow, H1, H2], tA });
    if (withLabel) { const an = new THREE.Object3D(); W.add(an); E.label(an, 'H₂O', 'scb-soft', tA + .1, tA + 1.2); E.hook(() => { an.position.copy(Ow.m.position).add(V(.75, .1, 0)); }); }
  }
  function fadeWaters(t, waters) { waters.forEach(w => { const f = 1 - seg(t, w.tA + .7, w.tA + 1.3); w.ms.forEach(a => { a.m.scale.multiplyScalar(Math.max(.001, f)); }); }); }

  /* ---------- almidón: anillos de glucosa unidos por puentes de oxígeno ---------- */
  function starch(W, E, n, grow) {
    const rr = 1.28, sp = 2 * rr + 2.3, dip = .6;
    const T0 = .4, step = 1.1;
    let tEnd = 0; const rings = [], waters = [];
    const lblA = new THREE.Object3D(); W.add(lblA);
    const one = { tone: false, color: 0xAEB8C2, r: .075 };
    for (let i = 0; i < n; i++) {
      const c = V((i - (n - 1) / 2) * sp, 0, 0);
      const tIn = grow ? T0 + i * step : 0; tEnd = tIn + .9;
      const drop0 = V(0, 2.2, 0);
      const opt = p => (grow ? { p0: p.clone().add(drop0), t0: tIn, t1: tIn + .6, tIn } : {});
      const pt = th => c.clone().add(V(Math.cos(th) * rr, Math.sin(th) * rr * .92, Math.sin(th) * .25));
      const syms = ['C', 'O', 'C', 'C', 'C', 'C']; // C1, O5, C5, C4, C3, C2
      const at = syms.map((sy, j) => E.atom(sy, sy === 'O' ? .34 : .32, pt(j * Math.PI / 3), opt(pt(j * Math.PI / 3))));
      for (let j = 0; j < 6; j++) E.bond(at[j], at[(j + 1) % 6], 1, Object.assign({ tIn: grow ? tIn : 0 }, one));
      const c6p = at[2].p1.clone().add(V(-.25, 1.25, 0)), o6p = c6p.clone().add(V(.85, .75, 0));
      const C6 = E.atom('C', .3, c6p, opt(c6p)), O6 = E.atom('O', .32, o6p, opt(o6p));
      E.bond(at[2], C6, 1, Object.assign({ tIn: grow ? tIn : 0 }, one)); E.bond(C6, O6, 1, Object.assign({ tIn: grow ? tIn : 0 }, one));
      [4, 5].forEach(j => { const p = at[j].p1.clone().add(V(0, -1.15, .1)); const Ox = E.atom('O', .3, p, opt(p)); E.bond(at[j], Ox, 1, Object.assign({ tIn: grow ? tIn : 0 }, one)); });
      rings.push({ at, tIn, c });
      if (i > 0) {
        const a = rings[i - 1].at[0], b = at[3];
        const mid = a.p1.clone().lerp(b.p1, .5).add(V(0, -dip, 0));
        const tb = tIn + .55;
        const Ob = E.atom('O', .34, mid, grow ? { tIn: tb } : {});
        E.bond(a, Ob, 1, Object.assign({ tIn: grow ? tb : 0 }, one)); E.bond(Ob, b, 1, Object.assign({ tIn: grow ? tb : 0 }, one));
        if (grow) waterPop(E, W, mid.clone().add(V(0, -.2, .3)), tb, i === 1, waters);
      }
      if (grow) E.hook(t => { if (t >= tIn - .2 && t < tIn + step) lblA.position.copy(at[1].m.position).add(V(.2, .85, 0)); });
    }
    // extremos
    [[rings[0].at[3], -1], [rings[n - 1].at[0], 1]].forEach(([c, sg]) => {
      const end = { m: new THREE.Object3D(), r: 0 }; end.m.position.copy(c.p1).add(V(sg * 1.1, -dip * .9, 0)); W.add(end.m);
      E.bond(c, end, 1, { tIn: grow ? tEnd : 0, color: 0x8C98A4, r: .06 });
      const d = new THREE.Object3D(); d.position.copy(end.m.position).add(V(sg * .55, 0, 0)); W.add(d); E.label(d, '···', 'scb-soft', grow ? tEnd : 0, 1e9);
    });
    if (grow) E.label(lblA, 'Glucosa', 'scb-soft', T0, tEnd - .3);
    const TL = grow ? tEnd + 3.4 : 1e9;
    E.hook((t, clk) => { fadeWaters(t, waters); W.rotation.y = Math.sin(clk * .35) * .25; phase.textContent = !grow ? '' : t < tEnd ? 'Se unen glucosas y sale agua' : 'Almidón: muchas glucosas unidas'; });
    return { TL, w: n * sp + 3.4, h: 2 * rr + 2.4 + 2.6 };
  }

  /* ---------- proteína: cuentas que se pliegan en hélice α ---------- */
  function protein(W, E, n, grow) {
    const R = 1.4, rise = .6, turn = 100 * Math.PI / 180, lin = 1.0;
    const helix = i => V((i - (n - 1) / 2) * rise, Math.cos(i * turn) * R, Math.sin(i * turn) * R);
    const ext = i => V((i - (n - 1) / 2) * lin, (i % 2 ? .3 : -.3), 0);
    const tA = .15, tF0 = grow ? tA + n * .12 + .7 : 0, tF1 = grow ? tF0 + 2.4 : 0;
    const beads = [];
    const foldAll = grow || true;
    for (let i = 0; i < n; i++) {
      const [nm, cat] = AA[i % AA.length];
      const st0 = tF0 + (i / n) * .9;
      const b = E.atom(AA_COL[cat], .37, helix(i), foldAll ? { p0: ext(i), t0: grow ? st0 : -2, t1: grow ? st0 + 1.5 : -1, tIn: grow ? tA + i * .12 : 0 } : {});
      beads.push(b);
      if (i > 0) E.bond(beads[i - 1], b, 1, { tIn: grow ? tA + i * .12 + .1 : 0, color: 0xC8D2DC, r: .085 });
      if (i < 3) E.label(b.m, nm, 'scb-soft', grow ? tA + i * .12 + .2 : -1, grow ? tF0 : -1);
    }
    for (let i = 0; i + 4 < n; i++) E.bond(beads[i], beads[i + 4], 1, { tIn: grow ? tF1 - .2 + i * .03 : 0, color: 0xB8924E, r: .028 });
    const TL = grow ? tF1 + 3.6 : 1e9;
    E.hook((t, clk) => {
      const k = grow ? ease(seg(t, tF0, tF1)) : 1;
      W.rotation.x = clk * .22 * k;
      phase.textContent = !grow ? '' : t < tF0 ? 'Cadena de aminoácidos' : t < tF1 ? 'Se pliega…' : 'Hélice α (puentes de hidrógeno)';
    });
    const w = Math.max(n * lin * (grow ? 1 : 0), n * rise) + 2, h = grow ? 2 * R + 2.6 : 2 * R + 2;
    return { TL, w, h };
  }

  /* ---------- ADN: doble hélice que se cierra par por par ---------- */
  function dna(W, E, n, grow) {
    const R = 1.7, rise = .72, tw = 36 * Math.PI / 180, off = 150 * Math.PI / 180;
    const seq = 'ATGCGTACCGATTAGCCATG';
    const pair = { A: 'T', T: 'A', G: 'C', C: 'G' };
    const bbA = [], bbB = [];
    const step = .18, T0 = .2; let tEnd = 0;
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * rise, a = i * tw;
      const pa = V(x, Math.cos(a) * R, Math.sin(a) * R), pb = V(x, Math.cos(a + off) * R, Math.sin(a + off) * R);
      const tIn = grow ? T0 + i * step : 0; tEnd = tIn + .5;
      const A = E.atom('#E9A23B', .26, pa, { tIn: grow ? tIn : 0 }), B = E.atom('#A78BFA', .26, pb, { tIn: grow ? tIn : 0 });
      if (i > 0) { E.bond(bbA[i - 1], A, 1, { tIn: grow ? tIn : 0, color: 0xE9A23B, r: .12 }); E.bond(bbB[i - 1], B, 1, { tIn: grow ? tIn : 0, color: 0xA78BFA, r: .12 }); }
      bbA.push(A); bbB.push(B);
      const b1 = seq[i % seq.length], b2 = pair[b1];
      const mid = pa.clone().lerp(pb, .5);
      const hA = E.atom(BASE[b1], .001, mid, {}); hA.m.visible = false; // punto medio invisible
      E.bond(A, hA, 1, { tIn: grow ? tIn + .15 : 0, color: new THREE.Color(BASE[b1]).getHex(), r: .15 });
      E.bond(hA, B, 1, { tIn: grow ? tIn + .25 : 0, color: new THREE.Color(BASE[b2]).getHex(), r: .15 });
      if (i === 2 || i === 7) { const an = new THREE.Object3D(); an.position.copy(mid); W.add(an); E.label(an, b1 + '–' + b2, 'scb-soft', grow ? tIn + .4 : 0, 1e9); }
    }
    const TL = grow ? tEnd + 4 : 1e9;
    E.hook((t, clk) => { W.rotation.x = clk * .45; phase.textContent = !grow ? '' : t < tEnd ? 'Las bases se aparean: A con T, G con C' : 'Doble hélice'; });
    return { TL, w: n * rise + 1.6, h: 2 * R + 1.8 };
  }

  /* ---------- lípido: glicerol + 3 ácidos grasos (sin H) ---------- */
  function lipid(W, E, n, grow, unsat) {
    const dx = 1.277 * SC * .92, hy = .43 * SC, gapY = 2.35;
    const T0 = .6, stepT = 1.3;
    let tEnd = 0;
    const gly = [];
    for (let j = 0; j < 3; j++) gly.push(E.atom('C', .38, V(-2.2, (1 - j) * gapY, 0), { tIn: grow ? .1 : 0 }));
    E.bond(gly[0], gly[1], 1, { tIn: grow ? .3 : 0, ca: EL.C.hex, cb: EL.C.hex }); E.bond(gly[1], gly[2], 1, { tIn: grow ? .3 : 0, ca: EL.C.hex, cb: EL.C.hex });
    const glyLab = new THREE.Object3D(); glyLab.position.set(-2.2 - 1.1, 0, 0); W.add(glyLab);
    E.label(glyLab, 'Glicerol', 'scb-soft', grow ? .2 : 0, 1e9);
    const waters = [];
    for (let j = 0; j < 3; j++) {
      const y = (1 - j) * gapY;
      const tIn = grow ? T0 + j * stepT : 0, tA = tIn + .8; tEnd = tA + .3;
      const slide = V(7, 0, 0);
      const opt = p => (grow ? { p0: p.clone().add(slide), t0: tIn, t1: tA, tIn } : {});
      const Oe = E.atom('O', .36, V(-.95, y, 0), grow ? { tIn: tA - .1 } : {});
      E.bond(gly[j], Oe, 1, { tIn: grow ? tA - .1 : 0, ca: EL.C.hex, cb: EL.O.hex });
      const C1 = E.atom('C', .38, V(.3, y + .25, 0), opt(V(.3, y + .25, 0)));
      const Od = E.atom('O', .36, V(.3, y + 1.45, 0), opt(V(.3, y + 1.45, 0)));
      E.bond(C1, Od, 2, { tIn: grow ? tIn : 0, ca: EL.C.hex, cb: EL.O.hex });
      E.bond(Oe, C1, 1, { tIn: grow ? tA : 0, ca: EL.O.hex, cb: EL.C.hex });
      // cola en zigzag
      let prev = C1, px = .3, py = y + .25, phi = 0;
      const Lb = Math.hypot(dx, 2 * hy), zz = Math.atan2(2 * hy, dx), mK = Math.floor(n / 2);
      for (let k = 1; k < n; k++) {
        const ang = phi + (k % 2 ? -zz : zz);
        const nx = px + Lb * Math.cos(ang), ny = py + Lb * Math.sin(ang);
        const C = E.atom('C', .36, V(nx, ny, 0), opt(V(nx, ny, 0)));
        const dbl = unsat && j === 0 && k === mK;
        E.bond(prev, C, dbl ? 2 : 1, { tIn: grow ? tIn : 0, ca: EL.C.hex, cb: EL.C.hex });
        if (dbl) phi = .55;
        prev = C; px = nx; py = ny;
      }
      if (j === 2) { const an = new THREE.Object3D(); an.position.set(px + .2, y - 1.05, 0); W.add(an); E.label(an, 'Ácido graso', 'scb-soft', grow ? tA : 0, 1e9); }
      if (grow) waterPop(E, W, V(-.35, y - .2, .4), tA, j === 0, waters);
    }
    const TL = grow ? tEnd + 3.2 : 1e9;
    // el agua se desvanece
    E.hook((t, clk) => {
      fadeWaters(t, waters);
      W.rotation.y = Math.sin(clk * .35) * .25;
      phase.textContent = !grow ? '' : t < tEnd ? 'Cada ácido graso se une al glicerol y sale agua' : unsat ? 'Aceite: una cola doblada (insaturada)' : 'Grasa: tres colas saturadas';
    });
    const w = 2.2 + 1.5 + .3 + (n - 1) * dx + 1.6 - (unsat ? 1.2 : 0), h = 2 * gapY + 3 + (unsat ? 3.4 : 0);
    W.position.x = -((n - 1) * dx + .3 - 3.6) / 2; W.position.y = unsat ? -1.3 : -.4;
    return { TL, w, h };
  }

  function build(state) {
    let kind = state.kind || 'polyethylene'; if (!INFO[kind]) kind = 'polyethylene';
    const grow = state.grow !== false && !reduce;
    let n = Math.round(+state.n || DEF_N[kind]); n = clamp(n, 3, MAX_N[kind]);
    const asp = aspectOf(o);
    // en pantallas angostas mostramos menos unidades para que se vean grandes
    if (asp < 1.8) n = Math.min(n, { polyethylene: 4, pvc: 4, starch: 3, protein: 14, dna: 14, lipid: 8 }[kind]);
    else if (asp < 2.5) n = Math.min(n, { polyethylene: 6, pvc: 6, starch: 4, protein: 18, dna: 18, lipid: 10 }[kind]);
    const W = new THREE.Group(); const holder = new THREE.Group(); holder.add(W); o.root.add(holder);
    const E = engine(o, W);
    let r;
    if (kind === 'polyethylene' || kind === 'pvc') r = polymer(W, E, n, grow, kind === 'pvc');
    else if (kind === 'starch') r = starch(W, E, n, grow);
    else if (kind === 'protein') r = protein(W, E, n, grow);
    else if (kind === 'dna') r = dna(W, E, n, grow);
    else r = lipid(W, E, n, grow, !!state.unsat);
    cap.innerHTML = '<b>' + INFO[kind][0] + '</b><span>' + INFO[kind][1] + '</span>';
    renderLegend(kind);
    const zoom = fitZoom(o, r.w, r.h + 1.2, 1.04);
    let t = 0;
    const S = {
      holder, zoom, kind, grow: 0,
      step(dt) {
        t += dt;
        let tt = t, fade = 1;
        if (grow && isFinite(r.TL)) { const cyc = r.TL + .6; tt = t % cyc; if (tt > r.TL) fade = 1 - ease((tt - r.TL) / .5); }
        if (!grow) tt = 1e6;
        E.step(tt, clock, fade);
      },
      seek(x) { t = x; },
      kill() { phase.textContent = ''; },
    };
    holder.scale.setScalar(reduce ? 1 : .001);
    return S;
  }

  let frozen = false;
  o.tick = dt => {
    if (frozen) dt = 0;
    clock += dt;
    const a = aspectOf(o);
    if (lastAspect && Math.abs(a - lastAspect) / a > .04 && curState) { lastAspect = a; const s = curState; cur && cur.kill(); if (cur) { drop(o, cur.holder); } cur = null; api.set(s); return; }
    lastAspect = a;
    if (cur) { cur.grow = Math.min(1, cur.grow + dt / .45); cur.holder.scale.setScalar(Math.max(.001, easeOut(cur.grow))); cur.step(dt); }
    dying.slice().forEach(d => { d.k -= dt / .3; d.holder.scale.setScalar(Math.max(.001, ease(d.k))); if (d.k <= 0) { drop(o, d.holder); dying.splice(dying.indexOf(d), 1); } });
    if (myZoom === null || Math.abs(o.zoom - myZoom) < 1e-6) { o.zoom += (zoomTarget - o.zoom) * (1 - Math.exp(-dt * 4)); myZoom = o.zoom; }
  };

  const api = {
    set(state) {
      state = state || {};
      const sig = JSON.stringify([state.kind || 'polyethylene', state.grow !== false, state.n || 0, !!state.unsat]);
      if (cur && cur.sig === sig) return;
      curState = state;
      if (cur) { cur.kill(); if (reduce) drop(o, cur.holder); else dying.push({ holder: cur.holder, k: 1 }); }
      cur = build(state); cur.sig = sig;
      zoomTarget = cur.zoom; if (myZoom === null) o.zoom = zoomTarget; myZoom = o.zoom;
      lastAspect = aspectOf(o);
      cur.step(0);
    },
    dispose() { o.tick = null; o.dispose(); el.innerHTML = ''; },
    _o: o,
    _seek(x) { frozen = true; if (cur) { cur.seek(x); cur.step(0); } },
  };
  return api;
}
