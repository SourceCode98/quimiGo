// Cazador de elementos: aparece una pista y hay que tocar el elemento correcto en la tabla periódica.
// spec: { clues:[{c:'Soy el gas noble del periodo 3', a:'Ar'}, ...], time:90 }  (sin clues: se generan)
import { EL, ELZ, CAT, PT, esc, shuffle } from '../widgets.js';
import { makeGame, clamp, pick } from './common.js';

const CATN = { ng: 'gas noble', am: 'metal alcalino', at: 'alcalinotérreo', ha: 'halógeno', mt: 'metaloide' };
const FACT = {
  H: 'Soy el elemento más liviano de todos', He: 'Soy el gas que hace flotar los globos', Li: 'Estoy en las baterías de tu celular',
  B: 'Estoy en el bórax con el que se hace slime', C: 'Soy la base de toda la química orgánica y de la vida', N: 'Formo cerca del 78 % del aire',
  O: 'Lo respiras: formo el 21 % del aire', F: 'Estoy en la crema dental para proteger los dientes', Ne: 'Doy la luz naranja de los avisos luminosos',
  Na: 'Con el cloro formo la sal de cocina', Mg: 'Estoy en el centro de la clorofila de las plantas', Al: 'Soy el metal liviano de las latas de gaseosa',
  Si: 'Estoy en la arena y en los chips de los computadores', P: 'Estoy en la cabeza de los fósforos y en tu ADN', S: 'Huelo a huevo podrido en los volcanes como el Nevado del Ruiz',
  Cl: 'Desinfecto el agua de las piscinas', Ar: 'Soy el gas noble que llena algunos bombillos', K: 'Abundo en el banano',
  Ca: 'Formo tus huesos y tus dientes', Ti: 'Soy un metal fuerte y liviano que se usa en prótesis', Cr: 'Hago brillar y no oxidarse al acero inoxidable',
  Fe: 'Estoy en la hemoglobina de tu sangre y en los clavos', Co: 'Doy el color azul a algunos vidrios y cerámicas', Ni: 'Colombia me extrae en Cerro Matoso, Córdoba',
  Cu: 'Soy el metal rojizo de los cables eléctricos', Zn: 'Recubro el hierro galvanizado para que no se oxide', Br: 'Soy un no metal líquido a temperatura ambiente',
  Kr: 'Soy un gas noble del periodo 4',
};

function autoClues() {
  const els = ELZ.slice(1);
  const uniq = {};
  els.forEach((e) => { const k = e.cat + '|' + PT(e.z)[0]; uniq[k] = (uniq[k] || 0) + 1; });
  const make = (e) => {
    const [p, g] = PT(e.z);
    const opts = [
      () => 'Busca el elemento: ' + e.name,
      () => 'Tengo ' + e.z + ' protones',
      () => 'Estoy en el grupo ' + g + ' y el periodo ' + p,
    ];
    if (CATN[e.cat] && uniq[e.cat + '|' + p] === 1) opts.push(() => 'Soy el ' + CATN[e.cat] + ' del periodo ' + p, () => 'Soy el ' + CATN[e.cat] + ' del periodo ' + p);
    if (FACT[e.sym]) opts.push(() => FACT[e.sym], () => FACT[e.sym]);
    return { c: pick(opts)(), a: e.sym };
  };
  // más peso a Z 1-20 y a los metales conocidos
  const common = els.filter((e) => e.z <= 20 || ['Fe', 'Cu', 'Zn', 'Ni', 'Br', 'Kr', 'Ti', 'Cr'].includes(e.sym));
  const rest = els.filter((e) => !common.includes(e));
  return shuffle(common).concat(shuffle(rest)).slice(0, 36).map(make);
}

export default function hunter(el, spec, finish) {
  const given = (spec.clues || []).filter((c) => c && c.c && EL[c.a] && EL[c.a].z <= 36);
  const TIME = spec.time || 90;
  const target = given.length ? Math.min(given.length, 14) : 14;
  return makeGame(el, spec, finish, {
    key: 'hunter', name: 'Cazador de elementos', icon: '⌖', time: 'down',
    how: 'Lee la pista y toca el elemento correcto en la tabla periódica. ¡Entre más rápido, más puntos!',
    rules: [TIME + ' segundos', 'Rapidez = puntos extra', '3 seguidas: ×2'],
    stars: (r) => (r.found >= Math.ceil(target * 0.9) ? 3 : r.found >= Math.ceil(target * 0.6) ? 2 : r.found >= Math.ceil(target * 0.3) ? 1 : 0),
    lines: (r) => [['Encontrados', r.found + ' de ' + r.asked], ['Mejor racha', String(r.bestStreak)], ['Promedio', r.found ? (r.avg.toFixed(1).replace('.', ',') + ' s') : '—']],
    play(g) {
      const clues = given.length ? shuffle(given.slice()) : autoClues();
      // tabla: celdas con posición normal (18 columnas) y forma corta para celular
      let cells = '';
      for (let gcol = 1; gcol <= 18; gcol++) cells += '<span class="gm-ptl dk" style="--c:' + (gcol + 1) + ';--r:1">' + gcol + '</span>';
      for (let p = 1; p <= 4; p++) cells += '<span class="gm-ptl dk" style="--c:1;--r:' + (p + 1) + '">' + p + '</span>';
      const MAINCOL = { 1: 1, 2: 2, 13: 3, 14: 4, 15: 5, 16: 6, 17: 7, 18: 8 };
      [1, 2, 13, 14, 15, 16, 17, 18].forEach((gc) => { cells += '<span class="gm-ptl mb" style="--mc:' + ((MAINCOL[gc] - 1) * 5 + 1) + ' / span 5;--mr:1">' + gc + '</span>'; });
      cells += '<span class="gm-ptl mb gm-ptd" style="--mc:1 / span 40;--mr:6">Metales de transición (grupos 3 a 12, periodo 4)</span>';
      ELZ.slice(1).forEach((e) => {
        const [p, gc] = PT(e.z);
        let mc, mr;
        if (MAINCOL[gc]) { mc = (MAINCOL[gc] - 1) * 5 + 1; mr = p + 1; }
        else { const i = e.z - 21; mc = 8 + (i % 5) * 5; mr = 7 + Math.floor(i / 5); }
        cells += '<button type="button" class="gm-el" data-s="' + e.sym + '" style="--c:' + (gc + 1) + ';--r:' + (p + 1) + ';--mc:' + mc + ' / span 5;--mr:' + mr + ';--cc:' + CAT[e.cat][1] + '" aria-label="' + e.name + '">' + e.sym + '</button>';
      });
      const used = [...new Set(ELZ.slice(1).map((e) => e.cat))];
      g.stage.innerHTML =
        '<div class="gm-clue"><p class="gm-qn"></p><h3 class="gm-qt"></h3><div class="gm-speed"><i></i></div></div>' +
        '<div class="gm-pt">' + cells + '</div>' +
        '<div class="gm-legend">' + used.map((c) => '<span><i style="background:' + CAT[c][1] + '"></i>' + CAT[c][0] + '</span>').join('') + '</div>';
      const qn = g.stage.querySelector('.gm-qn'), qt = g.stage.querySelector('.gm-qt'), clueBox = g.stage.querySelector('.gm-clue');
      const speed = g.stage.querySelector('.gm-speed i');
      const cellOf = (s) => g.stage.querySelector('.gm-el[data-s="' + s + '"]');
      let ci = -1, cur = null, t0 = 0, tries = 0, found = 0, asked = 0, lock = false, sumT = 0;
      const missed = [];
      const done = (reason) => g.end({ reason, found, asked, avg: found ? sumT / found : 0, detail: { found, asked, bestStreak: g.bestStreak, missed: missed.slice(0, 10) } });

      function next() {
        ci++;
        if (ci >= clues.length) return done('¡Resolviste todas las pistas!');
        cur = clues[ci]; tries = 0; lock = false;
        g.stage.querySelectorAll('.gm-el.no').forEach((b) => b.classList.remove('no'));
        qn.textContent = 'Pista ' + (ci + 1);
        qt.textContent = cur.c;
        g.bump(clueBox, 'gm-in');
        t0 = performance.now();
        g.info('<span><b>' + found + '</b> ' + (found === 1 ? 'encontrado' : 'encontrados') + '</span>');
        g.say('Pista: ' + cur.c);
      }
      g.frame(() => {
        if (!cur || lock) return;
        const s = (performance.now() - t0) / 1000;
        speed.style.transform = 'scaleX(' + clamp(1 - s / 10, 0, 1).toFixed(3) + ')';
      });
      function tap(sym) {
        if (lock || !cur) return;
        const b = cellOf(sym);
        if (!b) return;
        if (sym === cur.a) {
          lock = true; asked++; found++;
          const s = (performance.now() - t0) / 1000;
          sumT += s;
          const m = g.hit();
          const bonus = Math.round(clamp(100 - 10 * s, 0, 100));
          b.classList.add('yes');
          g.good(b);
          g.add((100 + bonus) * m, b);
          g.say('¡Correcto! ' + EL[sym].name);
          g.after(550, () => { b.classList.remove('yes'); next(); });
        } else {
          tries++;
          g.miss();
          b.classList.add('no');
          g.bad(b);
          if (tries >= 3) {
            lock = true; asked++;
            missed.push(cur.c);
            const r = cellOf(cur.a);
            r.classList.add('reveal');
            qt.innerHTML = esc(cur.c) + ' <span class="gm-was">→ ' + esc(EL[cur.a].name) + ' (' + cur.a + ')</span>';
            g.after(1500, () => { r.classList.remove('reveal'); next(); });
          }
        }
      }
      g.stage.querySelector('.gm-pt').addEventListener('click', (e) => { const b = e.target.closest('.gm-el'); if (b) tap(b.dataset.s); });
      // teclado: escribe el símbolo (ej. F, e → Fe)
      let buf = '', bufT = null;
      const flush = () => { const s = buf; buf = ''; if (EL[s] && EL[s].z <= 36) { cellOf(s).focus({ preventScroll: true }); tap(s); } };
      g.key((e) => {
        if (!/^[a-zA-Z]$/.test(e.key)) return;
        e.preventDefault();
        buf = buf ? buf + e.key.toLowerCase() : e.key.toUpperCase();
        if (bufT) g.cancel(bufT);
        const longer = ELZ.slice(1).some((x) => x.sym.length > buf.length && x.sym.startsWith(buf));
        if (!longer || buf.length === 2) flush();
        else bufT = g.after(650, flush);
      });
      g.clock(TIME, () => done('¡Se acabó el tiempo!'));
      next();
    },
  });
}
