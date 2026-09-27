// Escena 2D: ilustraciones animadas de laboratorio y de la vida diaria (ver SPEC.md, "lab").
// Cada tipo vive en ./lab/*.js y exporta {tag, svg(u, state), mount?(svg, api)}; mount devuelve {tick(t), step(n, state), still, dispose}.
import { reduce, nid } from '../widgets.js';
import { VW, VH } from './lab/kit.js';
import * as sep from './lab/separation.js';
import * as env from './lab/environment.js';
import * as rx from './lab/reactions.js';
import * as safety from './lab/safety.js';

const KINDS = Object.assign({}, sep, env, rx, safety);

export default function (el) {
  const stage = document.createElement('div');
  stage.className = 'stage sc-stage sc-2d sc-lab' + (reduce ? ' sc-reduce' : '');
  const tag = document.createElement('div');
  tag.className = 'sc-tag';
  stage.appendChild(tag);
  const note = document.createElement('div');
  note.className = 'sc-note';
  note.setAttribute('aria-live', 'polite');
  el.appendChild(stage);
  el.appendChild(note);

  let cur = null;
  const leaving = new Set();
  let raf = 0, visible = true;

  function frame(now) {
    raf = 0;
    const all = cur ? [cur, ...leaving] : [...leaving];
    all.forEach((c) => { if (c.inst.tick) c.inst.tick(Math.max(0, (now - c.t0) / 1000)); });
    if (visible && all.some((c) => c.inst.tick)) raf = requestAnimationFrame(frame);
  }
  function run() {
    if (reduce || raf || !visible) return;
    raf = requestAnimationFrame(frame);
  }
  const io = typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver((es) => { visible = es.some((e) => e.isIntersecting); if (visible) run(); })
    : null;
  if (io) io.observe(stage);

  // Ajusta el tamaño de los rótulos que no caben en el escenario visible (pantallas angostas o fuentes más anchas).
  function fit(svg) {
    if (!svg || !svg.isConnected) return;
    const sr = stage.getBoundingClientRect();
    if (!sr.width) return;
    const lo = sr.left + 4, hi = sr.right - 4;
    svg.querySelectorAll('text.sc-t').forEach((t) => {
      if (!t.dataset.fs) t.dataset.fs = t.getAttribute('font-size') || '17';
      const fs0 = +t.dataset.fs;
      t.setAttribute('font-size', fs0);
      const r = t.getBoundingClientRect();
      if (!r.width || (r.left >= lo && r.right <= hi)) return;
      const a = t.getAttribute('text-anchor') || 'start';
      const room = a === 'start' ? hi - r.left : a === 'end' ? r.right - lo : 2 * Math.min(r.left + r.width / 2 - lo, hi - r.left - r.width / 2);
      const f = Math.max(0.68, Math.min(1, room / r.width));
      t.setAttribute('font-size', (fs0 * f).toFixed(2));
    });
  }
  const refit = () => { if (cur) fit(cur.layer.firstChild); };
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(refit) : null;
  if (ro) ro.observe(stage);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit).catch(() => {});

  function build(kind, state) {
    const def = KINDS[kind];
    const u = nid() + 'l';
    const layer = document.createElement('div');
    layer.className = 'sc-layer';
    layer.innerHTML = '<svg viewBox="0 0 ' + VW + ' ' + VH + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + def.tag + '" style="overflow:visible">' + def.svg(u, state) + '</svg>';
    stage.insertBefore(layer, tag);
    const svg = layer.firstChild;
    const api = { u, note: (h) => { note.innerHTML = h || ''; }, stage };
    note.innerHTML = '';
    const inst = (def.mount && def.mount(svg, api, state)) || {};
    if (reduce && inst.tick) inst.tick(inst.still != null ? inst.still : 4);
    fit(svg);
    const c = { kind, layer, inst, t0: performance.now() };
    requestAnimationFrame(() => requestAnimationFrame(() => layer.classList.add('sc-on')));
    return c;
  }

  return {
    set(state) {
      state = state || {};
      const kind = KINDS[state.kind] ? state.kind : 'filtration';
      tag.textContent = KINDS[kind].tag;
      if (cur && cur.kind === kind) {
        if (cur.inst.step) cur.inst.step(state.step || 0, state);
        return;
      }
      if (cur) {
        const old = cur;
        leaving.add(old);
        old.layer.classList.remove('sc-on');
        setTimeout(() => { leaving.delete(old); if (old.inst.dispose) old.inst.dispose(); old.layer.remove(); }, reduce ? 0 : 600);
      }
      cur = build(kind, state);
      if (cur.inst.step) cur.inst.step(state.step || 0, state);
      run();
    },
    dispose() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (io) io.disconnect();
      if (ro) ro.disconnect();
      [cur, ...leaving].forEach((c) => c && c.inst.dispose && c.inst.dispose());
      cur = null;
      leaving.clear();
      stage.remove();
      note.remove();
    },
  };
}
