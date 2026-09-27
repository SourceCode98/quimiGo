// Escena "orbital": formas 3D de orbitales s, p y d, con diagrama de cajas (Aufbau y regla de Hund).
import { THREE, ELZ, reduce, esc, three } from '../widgets.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const S_R = [0.8, 1.5, 2.05, 2.5];
const S_COL = ['#5FB8FF', '#8C9DFF', '#B08BFF', '#D08AE8'];
const P_L = [0, 1.45, 2.0, 2.45];
const P_COL = { x: '#FF6B6B', y: '#3FD07E', z: '#4F9BFF' };
const D_COL = { xz: '#FFB347', z2: '#D17BFF' };
const AUFBAU = ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d', '5p'];
const CAP = { s: 2, p: 6, d: 10 };
// Ejes químicos -> ejes de la escena (z química vertical)
const AX = { x: [1, 0, 0], y: [0, 0, -1], z: [0, 1, 0] };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const backOut = t => { t = clamp(t, 0, 1); const c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

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
  o.scene.environment = env; o.scene.environmentIntensity = 0.8;
  const key = new THREE.DirectionalLight(0xffffff, 1.7); key.position.set(3, 5, 6); o.scene.add(key);
  const rim = new THREE.DirectionalLight(0xa8c8ff, 1.0); rim.position.set(-5, 2, -4); o.scene.add(rim);
  return { st, o, cleanup() { clearTimeout(hintT); env.dispose(); o.scene.remove(key); o.scene.remove(rim); } };
}

function parseOrb(k) {
  const m = /^([1-7])([spd])$/.exec(String(k).trim());
  return m ? { key: m[1] + m[2], n: +m[1], l: m[2] } : null;
}

// Perfil de un lóbulo (gota, punta en el núcleo, extremo redondeado)
function lobeGeo(L, W) {
  const pts = [];
  for (let i = 0; i <= 28; i++) {
    const a = i / 28 * Math.PI;
    const r = W * Math.sin(a) * Math.sqrt((1 - Math.cos(a)) / 2);
    pts.push(new THREE.Vector2(Math.max(0.0001, r), L * (1 - Math.cos(a)) / 2));
  }
  return new THREE.LatheGeometry(pts, 40);
}

const RIM_VS = 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }';
const RIM_FS = 'uniform vec3 c; uniform float op; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0); gl_FragColor = vec4(c * (0.7 + 0.8 * f), (0.08 + 0.62 * f) * op); \n#include <colorspace_fragment>\n }';

export default function (el) {
  const { st, o, cleanup } = setup(el);
  const box = document.createElement('div'); box.className = 'sc-orbx'; box.hidden = true; el.appendChild(box);
  // ---------- diagrama de cajas ----------
  let timers = [];
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
  function configOf(Z) {
    const out = []; let left = Z;
    for (let i = 0; i < AUFBAU.length && left > 0; i++) { const k = AUFBAU[i], c = CAP[k[1]], e = Math.min(c, left); out.push([k, e, c]); left -= e; }
    return out;
  }
  function renderBoxes(s) {
    clearTimers();
    const Z = s && s.Z != null ? clamp(Math.round(+s.Z), 1, 36) : null;
    if (!Z) { box.hidden = true; box.innerHTML = ''; return; }
    box.hidden = false;
    const E = ELZ[Z];
    const parts = configOf(Z);
    const cfg = parts.map(([k, e]) => esc(k) + '<sup>' + e + '</sup>').join(' ');
    let html = '<div class="sc-orbx-h"><b>' + esc(E ? E.name : 'Z = ' + Z) + '</b><span class="mono">Z = ' + Z + '</span><span class="sc-orbx-cfg">' + cfg + '</span></div><div class="boxes sc-boxes">';
    const seq = []; // [idxCaja, flecha]
    let bi = 0;
    parts.forEach(([k, e, c]) => {
      const nb = c / 2;
      const up = Math.min(e, nb), down = e - up;
      html += '<div class="orb"><div class="cells">';
      for (let i = 0; i < nb; i++) {
        const un = i < up && i >= down;
        html += '<span class="sc-cell' + (un ? ' sc-un' : '') + '" data-b="' + (bi + i) + '"><i class="sc-ar sc-up">↑</i><i class="sc-ar sc-dn">↓</i></span>';
      }
      html += '</div><small>' + esc(k) + '</small></div>';
      for (let i = 0; i < up; i++) seq.push([bi + i, 'up']);
      for (let i = 0; i < down; i++) seq.push([bi + i, 'dn']);
      bi += nb;
    });
    html += '</div>';
    if (s.hund) html += '<button type="button" class="btn ghost sc-replay">Repetir llenado</button>';
    box.innerHTML = html;
    const cells = box.querySelectorAll('.sc-cell');
    const show = (i) => { const [b, d] = seq[i]; const c = cells[b]; if (c) c.classList.add(d === 'up' ? 'sc-has-up' : 'sc-has-dn'); };
    const unpaired = () => box.classList.add('sc-done');
    box.classList.remove('sc-done');
    if (s.hund && !reduce) {
      seq.forEach((_, i) => timers.push(setTimeout(() => show(i), 450 + i * 420)));
      timers.push(setTimeout(unpaired, 450 + seq.length * 420));
    } else { seq.forEach((_, i) => show(i)); unpaired(); }
    const rb = box.querySelector('.sc-replay');
    if (rb) rb.onclick = () => renderBoxes(s);
  }

  if (!o) return { set(s) { renderBoxes(s); }, dispose() { clearTimers(); st.remove(); box.remove(); } };
  o.zoom = 7.5; o.rot.x = 0.38;
  const root = o.root;
  const V = new THREE.Vector3();

  // ---------- ejes ----------
  const axes = new THREE.Group(); root.add(axes);
  const axMat = new THREE.LineBasicMaterial({ color: 0x8aa4bd, transparent: true, opacity: 0.35 });
  const axAnchors = {};
  let axLen = 2.4;
  ['x', 'y', 'z'].forEach(a => {
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const line = new THREE.Line(g, axMat); axes.add(line);
    const an = new THREE.Object3D(); axes.add(an);
    o.label(an, a); o.labels[o.labels.length - 1].d.classList.add('sc-lab-axis');
    axAnchors[a] = { line, an };
  });
  const setAxes = len => {
    ['x', 'y', 'z'].forEach(a => {
      const e = axAnchors[a], p = e.line.geometry.attributes.position.array;
      const d = AX[a];
      for (let k = 0; k < 3; k++) { p[k] = -d[k] * len; p[3 + k] = d[k] * len; }
      e.line.geometry.attributes.position.needsUpdate = true; e.line.geometry.computeBoundingSphere();
      e.an.position.set(d[0], d[1], d[2]).multiplyScalar(len + 0.22);
    });
  };
  const nucMat = new THREE.MeshStandardMaterial({ color: 0xffe2b0, emissive: 0xffb060, emissiveIntensity: 1.2 });
  const nuc = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), nucMat); root.add(nuc);

  // ---------- orbitales ----------
  let items = []; // {key, group, mats:[{m, base, rim}], labels:[], a, target}
  function lab(it, obj, html) {
    o.label(obj, ''); const l = o.labels[o.labels.length - 1]; l.d.innerHTML = html; l.d.classList.add('sc-lab-orb'); l.d.style.opacity = 0; it.labels.push(l);
  }
  function lobeMat(it, color) {
    const m = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(color), roughness: 0.28, clearcoat: 0.8, clearcoatRoughness: 0.2, transparent: true, opacity: 0.82, emissive: new THREE.Color(color), emissiveIntensity: 0.12, side: THREE.DoubleSide });
    it.mats.push({ m, base: 0.82 }); return m;
  }
  function addLobes(it, geo, color, dirs, phaseDark) {
    const g = new THREE.Group();
    dirs.forEach((d, i) => {
      const c = new THREE.Color(color); if (phaseDark && i % 2 === 1) c.multiplyScalar(0.62);
      const mesh = new THREE.Mesh(geo, lobeMat(it, c));
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
      mesh.renderOrder = 2; g.add(mesh);
    });
    it.group.add(g); return g;
  }
  function makeItem(spec, layout) {
    const it = { lv: 1, key: spec.key, spec, group: new THREE.Group(), mats: [], labels: [], a: 0, target: 1, ext: 1, layout };
    root.add(it.group);
    const n = spec.n;
    if (spec.l === 's') {
      const R = S_R[Math.min(3, n - 1)];
      const col = new THREE.Color(S_COL[Math.min(3, n - 1)]);
      const mk = (r, k) => {
        const m = new THREE.ShaderMaterial({ uniforms: { c: { value: col.clone() }, op: { value: k } }, vertexShader: RIM_VS, fragmentShader: RIM_FS, transparent: true, depthWrite: false });
        it.mats.push({ m, base: k, rim: true });
        const s = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32), m); s.renderOrder = 5; it.group.add(s);
      };
      mk(R, 1);
      if (n >= 2) mk(R * 0.38, 0.8); // nodo radial: capa interna
      const an = new THREE.Object3D(); an.position.set(R * 0.58, R * 0.62, R * 0.52); it.group.add(an);
      lab(it, an, esc(spec.key));
      it.ext = R;
    } else if (spec.l === 'p') {
      const L = P_L[Math.min(3, n - 1)] || 2.4;
      const geo = lobeGeo(L, L * 0.52);
      const ax = { x: new THREE.Vector3().fromArray(AX.x), y: new THREE.Vector3().fromArray(AX.y), z: new THREE.Vector3().fromArray(AX.z) };
      ['x', 'y', 'z'].forEach(a => {
        addLobes(it, geo, P_COL[a], [ax[a], ax[a].clone().negate()], true);
        const an = new THREE.Object3D(); an.position.copy(ax[a]).multiplyScalar(L + 0.2); it.group.add(an);
        lab(it, an, n + 'p<sub>' + a + '</sub>');
      });
      it.ext = L;
    } else if (spec.l === 'd') {
      const L = n === 3 ? 1.75 : 2.2;
      const side = layout === 'side';
      // d_xz: cuatro lóbulos en el plano xz (vertical), entre los ejes
      const gxy = new THREE.Group(); it.group.add(gxy);
      const geo = lobeGeo(L, L * 0.5);
      const dxy = [45, 225, 135, 315].map(a => new THREE.Vector3(Math.cos(a * Math.PI / 180), Math.sin(a * Math.PI / 180), 0));
      const g1 = addLobes(it, geo, D_COL.xz, dxy, true); gxy.add(g1);
      // d_z²: dos lóbulos en z y un anillo
      const gz = new THREE.Group(); it.group.add(gz);
      const geo2 = lobeGeo(L * 1.1, L * 0.55);
      const g2 = addLobes(it, geo2, D_COL.z2, [new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0)], false); gz.add(g2);
      const tor = new THREE.Mesh(new THREE.TorusGeometry(L * 0.42, L * 0.14, 20, 48), lobeMat(it, new THREE.Color(D_COL.z2).multiplyScalar(0.62)));
      tor.rotation.x = Math.PI / 2; tor.renderOrder = 2; gz.add(tor);
      if (side) { gxy.position.x = -L * 1.05; gz.position.x = L * 1.05; gxy.scale.setScalar(0.85); gz.scale.setScalar(0.85); }
      const a1 = new THREE.Object3D(); a1.position.set(gxy.position.x, -L * 0.95, 0); it.group.add(a1);
      const a2 = new THREE.Object3D(); a2.position.set(gz.position.x, L * 1.2, 0); it.group.add(a2);
      lab(it, a1, n + 'd<sub>xz</sub>'); lab(it, a2, n + 'd<sub>z²</sub>');
      it.ext = side ? L * 2 : L * 1.1; it.axis = L * 1.35;
    }
    it.group.scale.setScalar(0.001);
    return it;
  }
  function killItem(it) {
    it.labels.forEach(l => { o.labels = o.labels.filter(x => x !== l); l.d.remove(); });
    it.group.traverse(x => { if (x.geometry) x.geometry.dispose(); });
    it.mats.forEach(e => e.m.dispose());
    root.remove(it.group);
  }
  function applyItem(it) {
    const a = it.a;
    const sc = it.target ? backOut(a) : smooth(a);
    it.group.scale.setScalar(Math.max(0.001, sc));
    const op = smooth(a);
    it.mats.forEach(e => { if (e.rim) e.m.uniforms.op.value = e.base * op; else e.m.opacity = e.base * op; });
    it.lv += ((it.labelOn === false ? 0 : 1) - it.lv) * 0.2;
    it.labels.forEach(l => { l.d.style.opacity = String(clamp((a - 0.6) / 0.4, 0, 1) * it.lv); });
  }

  // ---------- estado ----------
  let zoomT = 7.5, zoomAnim = 0, first = true; let lastBoxes = null;
  function set(state) {
    const s = Object.assign({ show: ['1s'], Z: null, hund: false }, state || {});
    const list = (Array.isArray(s.show) ? s.show : [s.show]).map(parseOrb).filter(Boolean);
    const onlyD = list.length > 0 && list.every(x => x.l === 'd');
    const keys = list.map(x => x.key + (x.l === 'd' ? (onlyD ? ':side' : ':mid') : ''));
    items.forEach(it => { if (keys.indexOf(it.key) < 0) it.target = 0; });
    list.forEach((x, i) => {
      const k = keys[i];
      let it = items.find(y => y.key === k);
      if (!it) { it = makeItem(x, onlyD ? 'side' : 'mid'); it.key = k; items.push(it); }
      it.target = 1;
    });
    const live = items.filter(x => x.target);
    live.forEach(x => { x.labelOn = !(x.spec.l === 's' && live.some(y => y !== x && y.spec.l !== 's' && y.ext >= x.ext * 0.9)) && !(x.spec.l === 's' && live.some(y => y.spec.l === 's' && y.ext > x.ext) && live.some(y => y.spec.l === 'p')); });
    const ext = Math.max(1.2, Math.max.apply(null, items.filter(x => x.target).map(x => x.ext).concat([1.2])));
    axLen = Math.max.apply(null, live.map(x => x.axis || x.ext + 0.55).concat([1.75])); setAxes(axLen);
    zoomT = Math.max(5.2, ext * 3.1 + 1.6); zoomAnim = 1.5;
    const bk = JSON.stringify([s.Z, !!s.hund]);
    if (bk !== lastBoxes) { lastBoxes = bk; renderBoxes(s); }
    if (first || reduce) {
      o.zoom = zoomT;
      items = items.filter(it => { it.a = it.target; if (!it.target) { killItem(it); return false; } applyItem(it); return true; });
    }
    first = false;
  }
  o.tick = dt => {
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.a += Math.sign(it.target - it.a) * Math.min(Math.abs(it.target - it.a), dt * (it.target ? 1.4 : 2.2));
      if (!it.target && it.a <= 0) { killItem(it); items.splice(i, 1); continue; }
      applyItem(it);
    }
    if (zoomAnim > 0) { zoomAnim -= dt; o.zoom += (zoomT - o.zoom) * Math.min(1, dt * 3); }
  };
  return {
    set,
    dispose() {
      clearTimers(); o.tick = null; items.forEach(killItem); items = [];
      o.dispose(); cleanup(); axMat.dispose(); st.remove(); box.remove();
    }
  };
}
