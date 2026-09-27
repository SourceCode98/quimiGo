// Utilidades compartidas por las escenas 3D del grupo B (mol, lattice, reaction, chain).
import { THREE, EL, three, reduce } from '../widgets.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export const SC = 1.35; // escala Å -> unidades de escena (igual que buildMol)
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = t => { t = clamp(t, 0, 1); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const easeOut = t => { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); };
export const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1); // progreso 0..1 de t dentro de [a,b]

/** Crea el stage y el mundo 3D con mejor iluminación. Devuelve {st, o} (o = null sin WebGL). */
export function makeStage(el, cls) {
  const st = document.createElement('div');
  st.className = 'stage sc-stage scb-3d' + (cls ? ' ' + cls : '');
  el.appendChild(st);
  const o = three(st);
  if (!o) return { st, o: null };
  const R = o.R;
  o.cam.fov = 30; o.cam.updateProjectionMatrix();
  R.outputColorSpace = THREE.SRGBColorSpace;
  R.toneMapping = THREE.NeutralToneMapping;
  R.toneMappingExposure = 1.05;
  // iluminación: la de three() es tenue con luces físicas; la reforzamos
  const hemi = new THREE.HemisphereLight(0xe8f1ff, 0x202a33, 1.4);
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(4, 7, 9);
  const rim = new THREE.DirectionalLight(0x9cc3ff, 1.3); rim.position.set(-6, 3, -7);
  const fill = new THREE.DirectionalLight(0xffe6c8, .5); fill.position.set(-6, -4, 5);
  o.scene.add(hemi, key, rim, fill);
  let pm = null, envTex = null;
  try {
    pm = new THREE.PMREMGenerator(R);
    envTex = pm.fromScene(new RoomEnvironment(), .04).texture;
    o.scene.environment = envTex;
    o.scene.environmentIntensity = .55;
  } catch (e) { /* sin entorno: no pasa nada */ }
  const baseDispose = o.dispose;
  o.dispose = () => {
    baseDispose();
    if (envTex) envTex.dispose();
    if (pm) pm.dispose();
    GEO.forEach(g => g.dispose());
  };
  // geometrías compartidas (por escena)
  const GEO = [];
  o.SPH = new THREE.SphereGeometry(1, 32, 24); GEO.push(o.SPH);
  o.SPH_LO = new THREE.SphereGeometry(1, 20, 14); GEO.push(o.SPH_LO);
  o.CYL = new THREE.CylinderGeometry(1, 1, 1, 16, 1, true); GEO.push(o.CYL);
  o.CONE = new THREE.ConeGeometry(1, 1, 20); GEO.push(o.CONE);
  o.shared = new Set(GEO);
  return { st, o };
}

/** Material de átomo. */
export function atomMat(sym, extra) {
  const E = EL[sym] || EL.C;
  return new THREE.MeshPhysicalMaterial(Object.assign({
    color: E.hex, roughness: .32, metalness: 0, clearcoat: .35, clearcoatRoughness: .35,
  }, extra || {}));
}
export function atomRadius(sym, f) { const E = EL[sym]; return (E ? E.r3 : .4) * (f || 1); }

/** Etiqueta con clase opcional. Devuelve la entrada {obj, d}. */
export function lab(o, obj, text, cls) {
  o.label(obj, text);
  const l = o.labels[o.labels.length - 1];
  if (cls) l.d.className += ' ' + cls;
  return l;
}
export function unlab(o, l) {
  const i = o.labels.indexOf(l);
  if (i >= 0) o.labels.splice(i, 1);
  l.d.remove();
}
/** Quita un objeto del padre y libera sus materiales/geometrías no compartidas y sus etiquetas. */
export function drop(o, obj) {
  if (!obj) return;
  const set = new Set();
  obj.traverse(x => set.add(x));
  o.labels.slice().forEach(l => { if (set.has(l.obj)) unlab(o, l); });
  obj.traverse(x => {
    if (x.geometry && !o.shared.has(x.geometry)) x.geometry.dispose();
    if (x.material) (Array.isArray(x.material) ? x.material : [x.material]).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
  });
  if (obj.parent) obj.parent.remove(obj);
}
export function countMeshes(o) { let n = 0; o.scene.traverse(x => { if (x.isMesh || x.isPoints || x.isLine || x.isLineSegments || x.isSprite) n++; }); return n; }

const UP = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1), Y = new THREE.Vector3(0, 1, 0);
const _d = new THREE.Vector3(), _p = new THREE.Vector3(), _m = new THREE.Vector3();

/** Enlace entre dos objetos (mismo padre). order 0 = interacción iónica (fina). two-tone opcional. */
export class Bond {
  constructor(o, parent, a, b, order, opt) {
    opt = opt || {};
    this.a = a; this.b = b; this.order = order; this.o = o;
    this.g = new THREE.Group(); parent.add(this.g);
    this.r = opt.r || (order === 0 ? .045 : order > 1 ? .055 : .075);
    this.gap = opt.gap || .17;
    this.tone = opt.tone !== false && order > 0;
    this.meshes = [];
    this.mats = [];
    const n = Math.max(1, order);
    const mk = c => { const m = new THREE.MeshPhysicalMaterial({ color: c, roughness: .45, clearcoat: .2, transparent: true, opacity: 1 }); this.mats.push(m); return m; };
    let ca, cb;
    if (this.tone) {
      ca = mk(opt.ca !== undefined ? opt.ca : 0xB8C2CC); cb = mk(opt.cb !== undefined ? opt.cb : 0xB8C2CC);
    } else { ca = cb = mk(opt.color !== undefined ? opt.color : (order === 0 ? 0x7C8A96 : 0xB8C2CC)); }
    for (let q = 0; q < n; q++) {
      const m1 = new THREE.Mesh(o.CYL, ca), m2 = this.tone ? new THREE.Mesh(o.CYL, cb) : null;
      this.g.add(m1); if (m2) this.g.add(m2);
      this.meshes.push([m1, m2]);
    }
    this.ra = opt.ra || 0; this.rb = opt.rb || 0; // radios de los átomos (para mitades)
    this.opacity = 1; this.dash = order === 0;
    this.update();
  }
  setOpacity(x) {
    this.opacity = x;
    this.mats.forEach(m => { m.opacity = x; m.transparent = x < .999; m.depthWrite = x > .5; });
    this.g.visible = x > .01;
  }
  update(view) {
    const A = this.a.position, B = this.b.position;
    _d.subVectors(B, A); const len = _d.length(); if (len < 1e-5) { this.g.visible = false; return; }
    this.g.visible = this.opacity > .01;
    _d.divideScalar(len);
    _p.crossVectors(_d, view || Z); if (_p.lengthSq() < .01) _p.crossVectors(_d, Y); _p.normalize();
    const n = this.meshes.length;
    // punto de corte: centrado en la superficie visible entre esferas
    const cut = clamp(.5 + (this.ra - this.rb) / (2 * len), .2, .8);
    this.meshes.forEach(([m1, m2], q) => {
      const off = n > 1 ? (q - (n - 1) / 2) * this.gap : 0;
      const r = this.r;
      if (m2) {
        const l1 = len * cut, l2 = len - l1;
        m1.scale.set(r, l1, r); m2.scale.set(r, l2, r);
        m1.position.copy(A).addScaledVector(_d, l1 / 2).addScaledVector(_p, off);
        m2.position.copy(A).addScaledVector(_d, l1 + l2 / 2).addScaledVector(_p, off);
        m1.quaternion.setFromUnitVectors(UP, _d); m2.quaternion.copy(m1.quaternion);
      } else {
        m1.scale.set(r, len, r);
        m1.position.copy(A).addScaledVector(_d, len / 2).addScaledVector(_p, off);
        m1.quaternion.setFromUnitVectors(UP, _d);
      }
    });
  }
  dispose() { this.mats.forEach(m => m.dispose()); if (this.g.parent) this.g.parent.remove(this.g); }
}

/** Construye una molécula (formato M) como grupo. Devuelve {g, atoms:[{mesh,sym,mat,p,r,i}], bonds:[Bond], radius, labels:[]}. */
export function molGroup(o, m, opt) {
  opt = opt || {};
  const sc = opt.scale || SC;
  const g = new THREE.Group();
  const n = m.a.length;
  const c = m.a.reduce((s, x) => [s[0] + x[1], s[1] + x[2], s[2] + x[3]], [0, 0, 0]).map(v => v / n);
  const atoms = m.a.map((a, i) => {
    const sym = a[0];
    let r = atomRadius(sym);
    if (m.rad && m.rad[i]) r = m.rad[i];
    else if (m.ionic) r = sym === 'Na' ? .42 : sym === 'Cl' ? .72 : r;
    const mat = atomMat(sym);
    const mesh = new THREE.Mesh(o.SPH, mat);
    mesh.scale.setScalar(r);
    const p = new THREE.Vector3((a[1] - c[0]) * sc, (a[2] - c[1]) * sc, (a[3] - c[2]) * sc);
    mesh.position.copy(p);
    g.add(mesh);
    return { mesh, sym, mat, p, r, i };
  });
  const bonds = m.b.map(([i, j, k]) => new Bond(o, g, atoms[i].mesh, atoms[j].mesh, k, {
    ca: EL[atoms[i].sym].hex, cb: EL[atoms[j].sym].hex, ra: atoms[i].r, rb: atoms[j].r, tone: opt.tone,
  }));
  bonds.forEach((b, q) => { b.i = m.b[q][0]; b.j = m.b[q][1]; });
  let radius = 0; atoms.forEach(a => { radius = Math.max(radius, a.p.length() + a.r); });
  return { g, atoms, bonds, radius, m };
}

/** Texto de etiqueta de un átomo en una molécula. */
export function atomText(m, i) {
  if (m.lab && m.lab[i] !== undefined) return m.lab[i];
  if (m.ionic) { const s = m.a[i][0]; return s === 'Na' ? 'Na⁺' : s === 'Cl' ? 'Cl⁻' : s; }
  return m.a[i][0];
}

/** Textura circular suave (para puntos y destellos). */
export function glowTex(inner, outer) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, inner || 'rgba(255,255,255,1)'); gr.addColorStop(.35, inner || 'rgba(255,255,255,.8)'); gr.addColorStop(1, outer || 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** Ajusta el zoom para que una caja (ancho w, alto h en unidades de escena) quepa en el stage. */
export function fitZoom(o, w, h, margin) {
  const el = o.R.domElement.parentElement;
  const aspect = Math.max(.5, (el.clientWidth || 600) / (el.clientHeight || 340));
  const t = Math.tan(THREE.MathUtils.degToRad(o.cam.fov / 2)) * 2;
  const m = margin || 1.12;
  return Math.max(h * m / t, w * m / (t * aspect));
}
export function aspectOf(o) { const el = o.R.domElement.parentElement; return Math.max(.5, (el.clientWidth || 600) / (el.clientHeight || 340)); }

/** Pequeño HTML de título dentro del stage. */
export function caption(st) {
  const d = document.createElement('div'); d.className = 'scb-cap'; st.appendChild(d); return d;
}
export const sub = f => String(f).replace(/(\d+)/g, '<sub>$1</sub>');
export { THREE, EL, reduce };
