// "Explora": reto interactivo al final de "Aprende" (estilo Brilliant). El estudiante mueve controles,
// la escena 3D responde en vivo y debe lograr cada reto para seguir. Así la escena deja de ser decorado:
// se convierte en el experimento donde se comprueba la idea de la lección.
//   ctl: deslizadores ({min,max,step,v}) u opciones ({opts}, valor = índice, -1 = sin elegir).
//   scene(v): estado de la escena (se mezcla con el del paso `at`, por defecto el último).
//   read(v): lectura en vivo bajo los controles (HTML corto).
//   tasks: retos en orden; ok(v) dice si el estudiante ya lo logró; win explica por qué.
//   predict: pregunta opcional antes de tocar nada ("¿qué crees que pasará?").

export type Vals = Record<string, number>;
export type Ctl = { id: string; label: string } & (
  | { min: number; max: number; step: number; v: number; unit?: string; fmt?: (x: number) => string }
  | { opts: string[]; v?: number }
);
export type Task = { ask: string; ok: (v: Vals) => boolean; win: string; hint?: string };
export type Explore = {
  at?: number;
  predict?: { q: string; o: string[]; a: number; e: string };
  ctl: Ctl[];
  scene: (v: Vals) => Record<string, unknown>;
  read?: (v: Vals) => string;
  tasks: Task[];
};

/** Número con coma decimal y sin ceros sobrantes. */
export const fm = (x: number, d = 2) => String(+x.toFixed(d)).replace('.', ',');
const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;
const sub = (s: string) => s.replace(/(\d+)/g, (m) => m.split('').map((c) => '₀₁₂₃₄₅₆₇₈₉'[+c]).join(''));
const rx = (r: [number, string][], p: [number, string][], extra: Record<string, unknown> = {}) => ({ type: 'reaction', r, p, ...extra });

// Elementos Z 1-36 para los retos de tabla periódica: [símbolo, nombre, periodo, grupo, radio pm, electronegatividad]
const PT: [string, string, number, number, number, number | null][] = [
  ['H', 'Hidrógeno', 1, 1, 53, 2.2], ['He', 'Helio', 1, 18, 31, null],
  ['Li', 'Litio', 2, 1, 167, 0.98], ['Be', 'Berilio', 2, 2, 112, 1.57], ['B', 'Boro', 2, 13, 87, 2.04], ['C', 'Carbono', 2, 14, 67, 2.55], ['N', 'Nitrógeno', 2, 15, 56, 3.04], ['O', 'Oxígeno', 2, 16, 48, 3.44], ['F', 'Flúor', 2, 17, 42, 3.98], ['Ne', 'Neón', 2, 18, 38, null],
  ['Na', 'Sodio', 3, 1, 190, 0.93], ['Mg', 'Magnesio', 3, 2, 145, 1.31], ['Al', 'Aluminio', 3, 13, 118, 1.61], ['Si', 'Silicio', 3, 14, 111, 1.9], ['P', 'Fósforo', 3, 15, 98, 2.19], ['S', 'Azufre', 3, 16, 88, 2.58], ['Cl', 'Cloro', 3, 17, 79, 3.16], ['Ar', 'Argón', 3, 18, 71, null],
  ['K', 'Potasio', 4, 1, 243, 0.82], ['Ca', 'Calcio', 4, 2, 194, 1.0], ['Sc', 'Escandio', 4, 3, 184, 1.36], ['Ti', 'Titanio', 4, 4, 176, 1.54], ['V', 'Vanadio', 4, 5, 171, 1.63], ['Cr', 'Cromo', 4, 6, 166, 1.66], ['Mn', 'Manganeso', 4, 7, 161, 1.55], ['Fe', 'Hierro', 4, 8, 156, 1.83], ['Co', 'Cobalto', 4, 9, 152, 1.88], ['Ni', 'Níquel', 4, 10, 149, 1.91], ['Cu', 'Cobre', 4, 11, 145, 1.9], ['Zn', 'Zinc', 4, 12, 142, 1.65],
  ['Ga', 'Galio', 4, 13, 136, 1.81], ['Ge', 'Germanio', 4, 14, 125, 2.01], ['As', 'Arsénico', 4, 15, 114, 2.18], ['Se', 'Selenio', 4, 16, 103, 2.55], ['Br', 'Bromo', 4, 17, 94, 2.96], ['Kr', 'Kriptón', 4, 18, 88, 3.0],
];
const at = (p: number, g: number) => PT.find((e) => e[2] === p && e[3] === g);
const MAIN = [1, 2, 13, 14, 15, 16, 17];

export const EXPLORE: Record<string, Explore> = {
  /* ---------------- 6° ---------------- */
  g6u1l1: {
    ctl: [{ id: 'p', label: 'Pon en la caja', opts: ['Agua de un vaso', 'Aire de un globo', 'Luz de una linterna', 'Sonido de un timbre', 'Una piedra'], v: -1 }],
    scene: (v) => [
      { empty: false, phase: 'liquid', temp: 0.4, species: [{ f: 'H2O', n: 18, label: 'Agua' }] },
      { empty: false, phase: 'gas', temp: 0.5, species: [{ f: 'N2', n: 12, label: 'Nitrógeno' }, { f: 'O2', n: 4, label: 'Oxígeno' }] },
      { empty: true }, { empty: true },
      { empty: false, phase: 'solid', temp: 0.15, species: [{ f: 'Si', n: 27, label: 'Piedra' }] },
    ][v.p] || {},
    read: (v) => (v.p < 0 ? 'Elige algo y mira qué aparece dentro de la caja.' : v.p === 2 || v.p === 3 ? 'La caja queda vacía: no hay partículas que pesar ni que ocupen lugar.' : 'Aparecen partículas: tiene masa y ocupa un lugar.'),
    tasks: [
      { ask: 'Encuentra algo que <b>no</b> sea materia.', ok: (v) => v.p === 2 || v.p === 3, win: 'La luz y el sonido no pesan ni ocupan un lugar: son energía, no materia.' },
      { ask: '¿El aire es materia? Ponlo en la caja y compruébalo.', ok: (v) => v.p === 1, win: 'Sí. El aire tiene partículas: pesa y ocupa un lugar aunque no lo veas. Por eso infla el globo.' },
    ],
  },
  g6u1l2: {
    ctl: [{ id: 'm', label: 'Masa del bloque', min: 2, max: 20, step: 0.5, v: 5, unit: 'g' }],
    scene: (v) => ({ drop: true, objs: [{ n: 'Tu bloque', d: v.m / 10, c: '#E05A9B' }] }),
    read: (v) => {
      const d = v.m / 10;
      return `Volumen: 10 cm³ · <b>densidad = masa ÷ volumen = ${fm(v.m)} ÷ 10 = ${fm(d)} g/cm³</b>`;
    },
    tasks: [
      { ask: 'Haz que el bloque quede <b>debajo del aceite pero encima del agua</b>.', ok: (v) => v.m / 10 > 0.92 && v.m / 10 < 1, win: 'Su densidad quedó entre la del aceite (0,92) y la del agua (1,0): se hunde en el aceite y flota en el agua.', hint: 'Busca una densidad entre 0,92 y 1 g/cm³.' },
      { ask: 'Ahora haz que se quede <b>entre el agua y la miel</b>.', ok: (v) => v.m / 10 > 1 && v.m / 10 < 1.42, win: 'Es más denso que el agua (1,0) pero menos que la miel (1,42).' },
      { ask: 'Por último, haz que llegue <b>hasta el fondo</b>.', ok: (v) => v.m / 10 > 1.42, win: 'Más masa en el mismo espacio: ahora es más denso que la miel y se hunde en todo.' },
    ],
  },
  g6u1l3: {
    at: 3,
    ctl: [
      { id: 'c', label: 'Lugar', opts: ['Cartagena (nivel del mar)', 'Bogotá (2600 m)'], v: 0 },
      { id: 't', label: 'Temperatura', min: -20, max: 110, step: 1, v: -10, unit: '°C' },
    ],
    scene: (v) => {
      const boil = v.c === 1 ? 92 : 100;
      const phase = v.t <= 0 ? 'solid' : v.t < boil ? 'liquid' : 'gas';
      return { phase, temp: Math.min(1, Math.max(0.1, (v.t + 20) / 130)), species: [{ f: 'H2O', n: 20, label: 'Agua' }] };
    },
    read: (v) => {
      const boil = v.c === 1 ? 92 : 100;
      return `Agua a <b>${v.t} °C</b>: ${v.t <= 0 ? 'hielo (sólido)' : v.t < boil ? 'líquida' : 'hierve y se vuelve vapor'}`;
    },
    tasks: [
      { ask: 'Derrite el hielo: llévalo a <b>líquido</b>.', ok: (v) => v.t > 0 && v.t < 92, win: 'Al calentar, las partículas se mueven más rápido hasta que se sueltan y se deslizan: el hielo se derrite a 0 °C.' },
      { ask: 'Ve a <b>Bogotá</b> y encuentra la temperatura <b>más baja</b> a la que hierve el agua.', ok: (v) => v.c === 1 && v.t === 92, win: 'En Bogotá hierve a 92 °C: en la montaña hay menos aire empujando (menos presión) y al agua le cuesta menos hervir.', hint: 'Sube la temperatura de grado en grado y mira cuándo aparece el vapor.' },
      { ask: 'Vuelve a <b>Cartagena</b> y pon el agua a 95 °C. ¿Hierve?', ok: (v) => v.c === 0 && v.t === 95, win: 'No. En Cartagena hay más aire empujando (más presión) y el agua necesita llegar a 100 °C.' },
    ],
  },
  g6u2l1: {
    ctl: [{ id: 'p', label: 'Sustancia', opts: ['Oxígeno (O₂)', 'Hierro (Fe)', 'Agua (H₂O)', 'Dióxido de carbono (CO₂)', 'Helio (He)'], v: -1 }],
    scene: (v) => [
      { phase: 'gas', temp: 0.4, species: [{ f: 'O2', n: 12, label: 'Oxígeno' }] },
      { phase: 'solid', temp: 0.15, species: [{ f: 'Fe', n: 27, label: 'Hierro' }] },
      { phase: 'liquid', temp: 0.35, species: [{ f: 'H2O', n: 14, label: 'Agua' }] },
      { phase: 'gas', temp: 0.4, species: [{ f: 'CO2', n: 12, label: 'Dióxido de carbono' }] },
      { phase: 'gas', temp: 0.5, species: [{ f: 'He', n: 16, label: 'Helio' }] },
    ][v.p] || {},
    read: (v) => ['Cada partícula: <b>2 átomos de oxígeno</b>.', 'Cada partícula: <b>1 átomo de hierro</b>.', 'Cada partícula: <b>2 de hidrógeno + 1 de oxígeno</b>.', 'Cada partícula: <b>1 de carbono + 2 de oxígeno</b>.', 'Cada partícula: <b>1 átomo de helio</b>.'][v.p] || 'Elige una sustancia y mira de qué están hechas sus partículas.',
    tasks: [
      { ask: 'Encuentra un <b>compuesto</b>.', ok: (v) => v.p === 2 || v.p === 3, win: 'Sus partículas unen átomos de elementos <b>distintos</b>: eso es un compuesto.' },
      { ask: 'Encuentra un <b>elemento</b> cuyas partículas tengan <b>dos átomos</b>.', ok: (v) => v.p === 0, win: 'El oxígeno O₂ tiene dos átomos, pero del mismo tipo: sigue siendo un elemento.' },
    ],
  },
  g6u2l2: {
    ctl: [{ id: 'p', label: 'Mezcla', opts: ['Agua con sal', 'Agua con aceite', 'Agua con azúcar', 'Agua con arena'], v: -1 }],
    scene: (v) => [
      { phase: 'liquid', layout: 'dissolve', dissolve: 1, species: [{ f: 'Na', n: 8, label: 'Sal' }, { f: 'H2O', n: 16, label: 'Agua' }] },
      { phase: 'liquid', layout: 'layers', species: [{ f: 'C', n: 12, label: 'Aceite' }, { f: 'H2O', n: 14, label: 'Agua' }] },
      { phase: 'liquid', layout: 'dissolve', dissolve: 1, species: [{ f: 'C6H12O6', n: 6, label: 'Azúcar' }, { f: 'H2O', n: 16, label: 'Agua' }] },
      { phase: 'liquid', layout: 'dissolve', dissolve: 0, species: [{ f: 'Si', n: 10, label: 'Arena' }, { f: 'H2O', n: 16, label: 'Agua' }] },
    ][v.p] || {},
    read: (v) => ['Las partículas de sal se reparten por todo el líquido.', 'El aceite forma una capa aparte encima del agua.', 'El azúcar se reparte por todo el líquido.', 'La arena se queda en el fondo, sin mezclarse.'][v.p] || 'Elige una mezcla y observa dónde quedan sus partículas.',
    tasks: [
      { ask: 'Encuentra una mezcla <b>heterogénea</b> (se ven sus partes).', ok: (v) => v.p === 1 || v.p === 3, win: 'Se distinguen las partes: el aceite o la arena quedan separados del agua.' },
      { ask: 'Ahora una mezcla <b>homogénea</b>.', ok: (v) => v.p === 0 || v.p === 2, win: 'Lo que echaste se reparte por todo el líquido: todo se ve igual, pero cada sustancia sigue ahí.' },
    ],
  },
  g6u2l3: {
    ctl: [
      { id: 'm', label: 'Mezcla', opts: ['Agua y aceite', 'Arena y limaduras de hierro', 'Agua de mar', 'Agua con arena', 'Alcohol y agua'], v: -1 },
      { id: 'k', label: 'Método', opts: ['Imán', 'Filtración', 'Decantación', 'Evaporación', 'Destilación'], v: -1 },
    ],
    scene: (v) => (v.k >= 0 ? { type: 'lab', kind: ['magnet', 'filtration', 'decantation', 'evaporation', 'distillation'][v.k] } : {}),
    read: (v) => {
      if (v.m < 0 || v.k < 0) return 'Elige una mezcla y el método con que la separarías.';
      const good = [2, 0, 3, 1, 4][v.m] === v.k;
      const why = ['El aceite flota: se deja salir el agua por la llave del embudo.', 'El imán atrae el hierro y deja la arena.', 'El agua se evapora y quedan los cristales de sal.', 'El papel filtro retiene la arena y deja pasar el agua.', 'El alcohol hierve primero, se condensa y cae en otro recipiente.'][v.m];
      return good ? '✓ ' + why : '✗ Con ese método esta mezcla no se separa bien.';
    },
    tasks: [
      { ask: 'Separa el <b>agua y el aceite</b>.', ok: (v) => v.m === 0 && v.k === 2, win: 'Decantación: el agua queda abajo y sale primero por la llave; el aceite se queda arriba.' },
      { ask: 'Saca la <b>sal del agua de mar</b>.', ok: (v) => v.m === 2 && v.k === 3, win: 'Evaporación: el agua se va como vapor y la sal se queda.' },
      { ask: 'Separa el <b>alcohol del agua</b>.', ok: (v) => v.m === 4 && v.k === 4, win: 'Destilación: el alcohol hierve antes que el agua, se va como vapor y se recoge aparte.' },
    ],
  },
  g6u3l1: {
    ctl: [{ id: 'p', label: 'Cambio', opts: ['Hielo que se derrite', 'Gas que arde en la estufa', 'Azúcar que se disuelve', 'Agua que hierve'], v: -1 }],
    scene: (v) => [
      { type: 'particles', phase: 'liquid', temp: 0.35, species: [{ f: 'H2O', n: 18, label: 'Agua' }] },
      rx([[1, 'CH4'], [2, 'O2']], [[1, 'CO2'], [2, 'H2O']], { count: true }),
      { type: 'particles', phase: 'liquid', layout: 'dissolve', dissolve: 1, species: [{ f: 'C6H12O6', n: 6, label: 'Azúcar' }, { f: 'H2O', n: 16, label: 'Agua' }] },
      { type: 'particles', phase: 'gas', temp: 0.85, species: [{ f: 'H2O', n: 18, label: 'Vapor de agua' }] },
    ][v.p] || {},
    read: (v) => ['Las partículas siguen siendo H₂O: solo se mueven distinto.', 'Los átomos se reorganizan: aparecen CO₂ y agua, que antes no estaban.', 'El azúcar se reparte entre el agua, pero sigue siendo azúcar.', 'Las partículas siguen siendo H₂O, ahora separadas y rápidas.'][v.p] || 'Elige un cambio y mira qué pasa con las partículas.',
    tasks: [
      { ask: 'Encuentra el <b>cambio químico</b>.', ok: (v) => v.p === 1, win: 'Se forman sustancias nuevas (CO₂ y agua) a partir del gas y el oxígeno.' },
      { ask: 'Encuentra un cambio <b>físico</b> en el que el agua pase a gas.', ok: (v) => v.p === 3, win: 'Al hervir, el agua cambia de estado pero sigue siendo H₂O.' },
    ],
  },
  g6u3l2: {
    ctl: [{ id: 'p', label: 'En la cocina', opts: ['Dorar una arepa', 'Hervir agua', 'Bicarbonato con vinagre'], v: -1 }],
    scene: (v) => (v.p >= 0 ? { step: v.p } : {}),
    read: (v) => ['El calor cambia el color, el olor y el sabor de la arepa.', 'Sale vapor, pero el vapor sigue siendo agua.', 'Aparecen burbujas que antes no estaban.'][v.p] || 'Elige qué hacer en la cocina.',
    tasks: [
      { ask: 'Encuentra el cambio que produce <b>un gas nuevo</b>.', ok: (v) => v.p === 2, win: 'Las burbujas son CO₂: una sustancia nueva. Es un cambio químico.' },
      { ask: 'Encuentra un cambio químico causado por el <b>calor</b>.', ok: (v) => v.p === 0, win: 'Al dorarse, los azúcares y las proteínas forman sustancias nuevas de otro color y olor.' },
    ],
  },

  /* ---------------- 7° ---------------- */
  g7u1l1: {
    ctl: [{ id: 'p', label: 'Modelo', opts: ['Dalton (1808)', 'Thomson (1897)', 'Rutherford (1911)', 'Bohr (1913)', 'Actual'], v: -1 }],
    scene: (v) => (v.p >= 0 ? { type: 'atom', model: ['dalton', 'thomson', 'rutherford', 'bohr', 'cloud'][v.p] } : {}),
    read: (v) => ['Una esfera maciza que no se puede dividir.', 'Una torta positiva con electrones incrustados, como uvas pasas.', 'Lanzó partículas contra una lámina de oro: casi todas pasaron y unas pocas rebotaron.', 'Electrones en órbitas fijas, como pisos de un edificio.', 'Una nube donde es probable encontrar al electrón.'][v.p] || 'Recorre los modelos y mira cómo cambió la idea del átomo.',
    tasks: [
      { ask: '¿Qué modelo descubrió que el átomo es <b>casi todo vacío</b> con un núcleo diminuto?', ok: (v) => v.p === 2, win: 'Rutherford: si casi todo pasa por la lámina, casi todo es vacío; lo que rebota choca con el núcleo.' },
      { ask: '¿En qué modelo el electrón <b>ya no tiene una órbita fija</b>?', ok: (v) => v.p === 4, win: 'En el modelo actual solo sabemos dónde es probable encontrarlo: el orbital.' },
    ],
  },
  g7u1l2: {
    ctl: [
      { id: 'z', label: 'Protones', min: 1, max: 11, step: 1, v: 1 },
      { id: 'n', label: 'Neutrones', min: 0, max: 14, step: 1, v: 0 },
      { id: 'e', label: 'Electrones', min: 0, max: 12, step: 1, v: 1 },
    ],
    scene: (v) => ({ type: 'atom', model: 'bohr', focus: null, Z: v.z, N: v.n, E: v.e }),
    read: (v) => {
      const el = PT[v.z - 1], q = v.z - v.e;
      return `<b>${el[1]}</b> (${el[0]}) · número de masa ${v.z + v.n} · carga ${q === 0 ? '0 (neutro)' : (q > 0 ? '+' : '−') + Math.abs(q)}`;
    },
    tasks: [
      { ask: 'Construye un átomo de <b>carbono neutro</b>.', ok: (v) => v.z === 6 && v.e === 6, win: 'Con 6 protones es carbono; con 6 electrones las cargas se cancelan.', hint: 'Lo que define al elemento son los protones.' },
      { ask: 'Conviértelo en <b>carbono-14</b> sin que deje de ser carbono.', ok: (v) => v.z === 6 && v.n === 8, win: '6 protones + 8 neutrones = 14. Es un isótopo: mismo elemento, otra masa.' },
      { ask: 'Construye el ion <b>sodio Na⁺</b>.', ok: (v) => v.z === 11 && v.e === 10, win: '11 protones y 10 electrones: perdió un electrón y quedó con carga +1.' },
    ],
  },
  g7u2l1: {
    ctl: [
      { id: 'p', label: 'Periodo (fila)', min: 1, max: 4, step: 1, v: 1 },
      { id: 'g', label: 'Grupo (columna)', min: 1, max: 18, step: 1, v: 1 },
    ],
    scene: (v) => { const e = at(v.p, v.g); return { type: 'ptable', hl: 'groups', groups: [v.g], els: e ? [e[0]] : [], arrow: false }; },
    read: (v) => { const e = at(v.p, v.g); return e ? `Periodo ${v.p}, grupo ${v.g}: <b>${e[1]} (${e[0]})</b>` : `En el periodo ${v.p} no hay elemento en el grupo ${v.g}.`; },
    tasks: [
      { ask: 'Encuentra el <b>gas noble del periodo 3</b>.', ok: (v) => v.p === 3 && v.g === 18, win: 'El argón: los gases nobles están en el grupo 18.' },
      { ask: 'Encuentra el <b>halógeno del periodo 2</b>.', ok: (v) => v.p === 2 && v.g === 17, win: 'El flúor: los halógenos forman el grupo 17.' },
      { ask: 'Encuentra el <b>metal alcalino del periodo 4</b>.', ok: (v) => v.p === 4 && v.g === 1, win: 'El potasio: los alcalinos están en el grupo 1 (el hidrógeno está arriba, pero no es metal).' },
    ],
  },
  g7u2l2: {
    ctl: [{ id: 'p', label: 'Elemento', opts: ['Sodio (Na)', 'Cloro (Cl)', 'Silicio (Si)', 'Hierro (Fe)', 'Azufre (S)', 'Germanio (Ge)'], v: -1 }],
    scene: (v) => ({ type: 'ptable', hl: 'metals', els: v.p >= 0 ? [['Na', 'Cl', 'Si', 'Fe', 'S', 'Ge'][v.p]] : [] }),
    read: (v) => ['Brilla, conduce muy bien la electricidad y pierde electrones con facilidad.', 'Gas verdoso, no conduce la electricidad y tiende a ganar electrones.', 'Brilla un poco y conduce solo a medias: con él se hacen los chips.', 'Brilla, conduce el calor y la electricidad, y se puede doblar.', 'Sólido amarillo, opaco y quebradizo; no conduce.', 'Brilla un poco y conduce a medias: se usa en electrónica.'][v.p] || 'Elige un elemento y mira dónde está y cómo se comporta.',
    tasks: [
      { ask: 'Encuentra un <b>metaloide</b>.', ok: (v) => v.p === 2 || v.p === 5, win: 'Está sobre la "escalera" y tiene propiedades intermedias entre metal y no metal.' },
      { ask: 'Encuentra un <b>no metal sólido</b>.', ok: (v) => v.p === 4, win: 'El azufre: opaco, quebradizo y mal conductor, aunque es sólido.' },
    ],
  },
  g7u2l3: {
    ctl: [
      { id: 'k', label: 'Mostrar', opts: ['Radio atómico', 'Electronegatividad'], v: 0 },
      { id: 'p', label: 'Periodo', min: 2, max: 4, step: 1, v: 2 },
      { id: 'g', label: 'Posición en el periodo', min: 1, max: 7, step: 1, v: 1 },
    ],
    scene: (v) => { const e = at(v.p, MAIN[v.g - 1]); return { type: 'ptable', hl: v.k === 1 ? 'en' : 'radius', arrow: true, els: e ? [e[0]] : [] }; },
    read: (v) => { const e = at(v.p, MAIN[v.g - 1])!; return `<b>${e[1]} (${e[0]})</b> · radio ${e[4]} pm · electronegatividad ${fm(e[5] || 0)}`; },
    tasks: [
      { ask: 'Encuentra el átomo <b>más grande del periodo 3</b>.', ok: (v) => v.p === 3 && v.g === 1, win: 'El sodio: a la izquierda el núcleo tiene menos protones y jala menos a los electrones.' },
      { ask: 'Encuentra el elemento <b>más electronegativo</b> de todos.', ok: (v) => v.p === 2 && v.g === 7, win: 'El flúor: arriba a la derecha, pequeño y con un núcleo que atrae fuerte.' },
      { ask: 'En el grupo 1, ¿cuál es más grande? Muévete por los periodos y quédate en el mayor.', ok: (v) => v.p === 4 && v.g === 1, win: 'El potasio: al bajar por un grupo se agregan pisos de electrones y el átomo crece.' },
    ],
  },
  g7u3l1: {
    ctl: [{ id: 'p', label: 'Molécula', opts: ['H₂O', 'CO₂', 'CH₄', 'NH₃', 'C₂H₅OH'], v: -1 }],
    scene: (v) => (v.p >= 0 ? { mol: ['H2O', 'CO2', 'CH4', 'NH3', 'C2H5OH'][v.p], pair: null } : {}),
    read: (v) => (v.p >= 0 ? 'Cuenta los átomos de la molécula usando los subíndices de la fórmula.' : 'Elige una fórmula y mira su molécula.'),
    tasks: [
      { ask: 'Encuentra la molécula que tiene <b>5 átomos</b>.', ok: (v) => v.p === 2, win: 'CH₄: 1 carbono + 4 hidrógenos = 5 átomos.' },
      { ask: 'Encuentra la que tiene <b>3 átomos y dos son de oxígeno</b>.', ok: (v) => v.p === 1, win: 'CO₂: el subíndice 2 dice que hay dos oxígenos.' },
      { ask: 'Encuentra la que tiene <b>9 átomos</b>.', ok: (v) => v.p === 4, win: 'C₂H₅OH: 2 C + 6 H + 1 O = 9. ¡Ojo con el H del OH!' },
    ],
  },
  g7u3l2: {
    at: 0,
    ctl: [{ id: 't', label: 'Calor que le das', min: 0, max: 100, step: 1, v: 10, unit: '%' }],
    scene: (v) => ({ type: 'particles', phase: v.t < 30 ? 'solid' : v.t < 70 ? 'liquid' : 'gas', temp: Math.max(0.08, v.t / 100), species: [{ f: 'H2O', n: 20, label: 'Agua' }] }),
    read: (v) => (v.t < 30 ? 'Gana la <b>atracción</b>: las partículas quedan fijas y solo vibran.' : v.t < 70 ? '<b>Empate</b>: se deslizan, pero siguen juntas.' : 'Gana el <b>movimiento</b>: las partículas escapan y se separan.'),
    tasks: [
      { ask: 'Haz que el <b>movimiento</b> venza a la atracción.', ok: (v) => v.t >= 70, win: 'Con suficiente calor, las partículas se mueven tan rápido que se escapan: gas.' },
      { ask: 'Busca el punto donde <b>se deslizan pero siguen juntas</b>.', ok: (v) => v.t >= 30 && v.t < 70, win: 'Líquido: la atracción todavía las mantiene juntas, pero ya no en su sitio.' },
      { ask: 'Deja que gane la <b>atracción</b> otra vez.', ok: (v) => v.t < 30, win: 'Al enfriar, las partículas pierden rapidez y la atracción las fija: sólido.' },
    ],
  },

  /* ---------------- 8° ---------------- */
  g8u1l1: {
    ctl: [{ id: 'p', label: 'Situación', opts: ['Agua que hierve', 'Hidrógeno + oxígeno', 'Hielo que se derrite', 'Gas que arde en la estufa'], v: -1 }],
    scene: (v) => [
      { type: 'particles', phase: 'gas', temp: 0.85, species: [{ f: 'H2O', n: 16, label: 'Vapor de agua' }] },
      rx([[2, 'H2'], [1, 'O2']], [[2, 'H2O']]),
      { type: 'particles', phase: 'liquid', temp: 0.35, species: [{ f: 'H2O', n: 16, label: 'Agua' }] },
      rx([[1, 'CH4'], [2, 'O2']], [[1, 'CO2'], [2, 'H2O']]),
    ][v.p] || {},
    tasks: [
      { ask: 'Encuentra una situación donde se forme una <b>sustancia nueva</b>.', ok: (v) => v.p === 1 || v.p === 3, win: 'Los átomos se separan y se vuelven a unir de otra forma: hay productos nuevos.' },
      { ask: 'Al hervir, ¿cambia la sustancia? Elige el agua que hierve y mira.', ok: (v) => v.p === 0, win: 'No: siguen siendo moléculas de H₂O, solo más separadas. Es un cambio físico.' },
    ],
  },
  g8u1l2: {
    at: 0,
    ctl: [{ id: 'x', label: 'Moléculas de O₂', min: 1, max: 4, step: 1, v: 1 }],
    scene: (v) => rx([[1, 'CH4'], [v.x, 'O2']], [[1, 'CO2'], [2, 'H2O']], { count: true }),
    read: (v) => `Átomos de oxígeno: <b>${2 * v.x} antes</b> y <b>4 después</b>`,
    predict: { q: 'Si en una reacción la masa se conserva, los átomos de cada elemento antes y después deben ser…', o: ['Iguales', 'Más después', 'Menos después'], a: 0, e: 'Los átomos no se crean ni se destruyen: solo se reorganizan.' },
    tasks: [
      { ask: 'Ajusta el O₂ para que <b>no se pierda ni sobre ningún átomo</b>.', ok: (v) => v.x === 2, win: 'Con 2 O₂ hay 4 oxígenos a cada lado: la masa se conserva (Lavoisier).' },
    ],
  },
  g8u1l3: {
    at: 1,
    ctl: [
      { id: 'a', label: 'N₂', min: 1, max: 3, step: 1, v: 1 },
      { id: 'b', label: 'H₂', min: 1, max: 6, step: 1, v: 1 },
      { id: 'c', label: 'NH₃', min: 1, max: 4, step: 1, v: 1 },
    ],
    scene: (v) => rx([[v.a, 'N2'], [v.b, 'H2']], [[v.c, 'NH3']], { count: true }),
    read: (v) => `N: ${2 * v.a} → ${v.c} · H: ${2 * v.b} → ${3 * v.c}`,
    tasks: [
      { ask: 'Balancea la ecuación con los <b>enteros más pequeños</b>.', ok: (v) => v.a === 1 && v.b === 3 && v.c === 2, win: 'N₂ + 3H₂ → 2NH₃: 2 N y 6 H a cada lado.', hint: 'Empieza por el nitrógeno: hay 2 a la izquierda.' },
      { ask: 'Ahora duplica todo. ¿Sigue balanceada?', ok: (v) => v.a === 2 && v.b === 6 && v.c === 4, win: 'Sí, pero se escribe con los enteros más pequeños: 1, 3, 2.' },
    ],
  },
  g8u2l1: {
    ctl: [{ id: 't', label: 'Temperatura', min: 0, max: 100, step: 1, v: 40, unit: '%' }],
    scene: (v) => ({ type: 'particles', phase: 'gas', pressure: true, temp: Math.max(0.05, v.t / 100) }),
    read: (v) => (v.t < 30 ? 'Partículas lentas: pocos choques.' : v.t < 70 ? 'Partículas a velocidad media.' : 'Partículas muy rápidas: choques fuertes y seguidos.') + ' Mira el medidor de choques.',
    predict: { q: 'Si calientas el gas, ¿qué pasa con los choques contra las paredes?', o: ['Aumentan', 'Disminuyen', 'No cambian'], a: 0, e: 'La temperatura mide qué tan rápido se mueven las partículas.' },
    tasks: [
      { ask: '<b>Calienta</b> el gas y mira el medidor de choques.', ok: (v) => v.t >= 85, win: 'Más temperatura → partículas más rápidas → más choques por segundo → más presión.' },
      { ask: 'Ahora <b>enfríalo</b> casi del todo.', ok: (v) => v.t <= 10, win: 'Casi sin movimiento hay pocos choques: la presión baja.' },
    ],
  },
  g8u2l2: {
    at: 0,
    ctl: [{ id: 'V', label: 'Volumen', min: 0.4, max: 1, step: 0.05, v: 1, unit: 'L', fmt: (x) => fm(x) }],
    scene: (v) => ({ type: 'particles', phase: 'gas', temp: 0.5, pressure: true, vol: v.V, species: [{ f: 'He', n: 22, label: 'Gas' }] }),
    read: (v) => `V = ${fm(v.V)} L → <b>P = ${fm(1 / v.V, 2)} atm</b> · P × V = 1`,
    predict: { q: 'Si reduces el volumen a la mitad (con la misma temperatura), la presión…', o: ['Se duplica', 'Se reduce a la mitad', 'No cambia'], a: 0, e: 'Las mismas partículas en la mitad del espacio chocan el doble de veces.' },
    tasks: [
      { ask: 'Haz que la presión sea <b>2 atm</b>.', ok: (v) => near(v.V, 0.5), win: 'La mitad del volumen, el doble de presión: P y V van al contrario (ley de Boyle).' },
      { ask: 'Ahora llévala a <b>2,5 atm</b>.', ok: (v) => near(v.V, 0.4), win: 'P × V = 1 → V = 1 ÷ 2,5 = 0,4 L.' },
    ],
  },
  g8u2l3: {
    at: 0,
    ctl: [
      { id: 'T', label: 'Temperatura', min: 150, max: 600, step: 50, v: 300, unit: 'K' },
      { id: 'V', label: 'Volumen', min: 0.5, max: 1, step: 0.05, v: 0.5, unit: 'L', fmt: (x) => fm(x) },
    ],
    scene: (v) => ({ type: 'particles', phase: 'gas', pressure: true, temp: v.T / 600, vol: v.V, species: [{ f: 'He', n: 20, label: 'Gas' }] }),
    read: (v) => `<b>P = ${fm((v.T / 300) * (0.5 / v.V), 2)} atm</b> (misma cantidad de gas)`,
    tasks: [
      { ask: 'Sube la temperatura a <b>600 K</b> sin cambiar el volumen.', ok: (v) => v.T === 600 && near(v.V, 0.5), win: 'La presión se duplica: con volumen fijo, P es proporcional a T.' },
      { ask: 'Deja 600 K y devuelve la presión a <b>1 atm</b>.', ok: (v) => v.T === 600 && near(v.V, 1), win: 'El doble de espacio compensa el doble de temperatura: la presión vuelve a 1 atm (PV = nRT).' },
    ],
  },
  g8u3l1: {
    ctl: [{ id: 'g', label: 'Agua', min: 0, max: 72, step: 4.5, v: 9, unit: 'g', fmt: (x) => fm(x, 1) }],
    scene: (v) => ({ type: 'particles', phase: 'liquid', temp: 0.3, species: [{ f: 'H2O', n: Math.max(1, Math.round((v.g / 18) * 8)), label: 'Agua' }] }),
    read: (v) => `n = ${fm(v.g, 1)} g ÷ 18 g/mol = <b>${fm(v.g / 18, 2)} mol</b>`,
    tasks: [
      { ask: 'Toma exactamente <b>1 mol</b> de agua.', ok: (v) => near(v.g, 18), win: 'La masa molar del agua es 18 g/mol (2 H + 1 O = 2 + 16): 18 g son 1 mol, 6,02 × 10²³ moléculas.' },
      { ask: 'Ahora toma <b>2 mol</b>.', ok: (v) => near(v.g, 36), win: '2 × 18 g = 36 g.' },
      { ask: 'Y por último <b>0,25 mol</b>.', ok: (v) => near(v.g, 4.5), win: '0,25 × 18 g = 4,5 g.' },
    ],
  },
  g8u3l2: {
    at: 0,
    ctl: [{ id: 'p', label: 'Objeto', opts: ['Madera', 'Plástico PET', 'Hierro', 'Oro'], v: -1 }],
    scene: (v) => ({ type: 'column', drop: true, objs: v.p >= 0 ? [[{ n: 'Madera', d: 0.6, c: '#A0703C' }, { n: 'Plástico PET', d: 1.38, c: '#9AD1E8' }, { n: 'Hierro', d: 7.87, c: '#8C8C8C' }, { n: 'Oro', d: 19.3, c: '#D4AF37' }][v.p]] : [] }),
    read: () => 'Capas: aceite 0,92 · agua 1,0 · mercurio 13,6 g/cm³',
    tasks: [
      { ask: 'Encuentra un sólido que se <b>hunda en el agua pero flote en el mercurio</b>.', ok: (v) => v.p === 1 || v.p === 2, win: 'Su densidad está entre 1,0 y 13,6 g/cm³: más denso que el agua, menos que el mercurio.' },
      { ask: 'Encuentra el que llega <b>hasta el fondo</b>.', ok: (v) => v.p === 3, win: 'El oro (19,3 g/cm³) es más denso incluso que el mercurio.' },
    ],
  },

  /* ---------------- 9° ---------------- */
  g9u1l1: {
    at: 4,
    ctl: [{ id: 'x', label: 'Sal en 100 mL de agua', min: 0, max: 60, step: 2, v: 10, unit: 'g' }],
    scene: (v) => ({ type: 'particles', phase: 'liquid', layout: 'dissolve', dissolve: v.x ? Math.min(1, 36 / v.x) : 1, species: [{ f: 'Na', n: Math.max(1, Math.round(v.x / 3)), label: 'Sal' }, { f: 'H2O', n: 18, label: 'Agua' }] }),
    read: (v) => `Disuelta: <b>${Math.min(v.x, 36)} g</b> · En el fondo: <b>${Math.max(0, v.x - 36)} g</b>`,
    tasks: [
      { ask: 'Prepara una solución <b>saturada sin que sobre sal</b> en el fondo.', ok: (v) => v.x === 36, win: 'Justo 36 g: el agua llenó su cupo. Ese límite es la solubilidad de la sal.', hint: 'Agrega sal hasta justo antes de que empiece a quedar en el fondo.' },
      { ask: 'Agrega sal hasta que <b>sobren 10 g</b>.', ok: (v) => v.x === 46, win: 'Ya no cabe más: lo que pase de 36 g se queda sin disolver.' },
    ],
  },
  g9u1l2: {
    at: 2,
    ctl: [{ id: 'g', label: 'Soluto', min: 0, max: 40, step: 2, v: 4, unit: 'g' }],
    scene: (v) => ({ type: 'particles', phase: 'liquid', layout: 'dissolve', dissolve: 1, species: [{ f: 'Na', n: Math.max(1, Math.round(v.g / 2)), label: 'Soluto' }, { f: 'H2O', n: 20, label: 'Agua' }] }),
    read: (v) => `Solución total: 200 g · <b>% m/m = ${v.g} ÷ 200 × 100 = ${fm((v.g / 200) * 100, 1)} %</b>`,
    tasks: [
      { ask: 'Prepara una solución al <b>10 %</b>.', ok: (v) => v.g === 20, win: '20 g de soluto en 200 g de solución: 10 de cada 100 g son soluto.' },
      { ask: 'Ahora una al <b>5 %</b>.', ok: (v) => v.g === 10, win: 'La mitad de soluto en la misma cantidad de solución: la mitad de concentración.' },
    ],
  },
  g9u1l3: {
    at: 1,
    ctl: [
      { id: 'n', label: 'NaCl', min: 0.1, max: 1, step: 0.1, v: 0.5, unit: 'mol', fmt: (x) => fm(x, 1) },
      { id: 'V', label: 'Volumen', min: 0.25, max: 2, step: 0.25, v: 2, unit: 'L', fmt: (x) => fm(x) },
    ],
    scene: (v) => ({ type: 'particles', phase: 'liquid', layout: 'dissolve', dissolve: 1, vol: Math.min(1, 0.35 + v.V * 0.325), species: [{ f: 'Na', n: Math.max(1, Math.round(v.n * 16)), label: 'NaCl' }, { f: 'H2O', n: 18, label: 'Agua' }] }),
    read: (v) => `<b>M = ${fm(v.n, 1)} mol ÷ ${fm(v.V)} L = ${fm(v.n / v.V, 2)} mol/L</b>`,
    tasks: [
      { ask: 'Prepara una solución <b>1 M</b> usando <b>0,5 mol</b>.', ok: (v) => near(v.n, 0.5) && near(v.V, 0.5), win: '0,5 mol ÷ 0,5 L = 1 M: un mol en cada litro.' },
      { ask: 'Dilúyela a <b>0,5 M</b> sin cambiar los moles.', ok: (v) => near(v.n, 0.5) && near(v.V, 1), win: 'Agregaste agua y los moles no cambiaron: 1 × 0,5 = 0,5 × 1. El doble de litros, la mitad de molaridad.' },
    ],
  },
  g9u2l1: {
    at: 5,
    ctl: [{ id: 'p', label: 'Sustancia', opts: ['HCl', 'NaOH', 'NH₃', 'H₂O'], v: -1 }],
    scene: (v) => (v.p >= 0 ? [{ type: 'mol', mol: 'HCl', pair: null, dipole: true, lp: false }, { type: 'mol', mol: 'NaOH', pair: null, dipole: false, lp: false }, { type: 'mol', mol: 'NH3', pair: null, lp: true, dipole: false }, { type: 'mol', mol: 'H2O', pair: null, lp: true, dipole: false }][v.p] : {}),
    read: (v) => ['En agua suelta un <b>H⁺</b>.', 'En agua suelta un <b>OH⁻</b>.', 'No tiene OH⁻, pero puede <b>recibir un H⁺</b>.', 'Puede pasar un H⁺ o recibirlo.'][v.p] || 'Elige una sustancia y mira qué hace en el agua.',
    tasks: [
      { ask: 'Encuentra una base según <b>Arrhenius</b> (suelta OH⁻).', ok: (v) => v.p === 1, win: 'En agua, el NaOH se separa en Na⁺ y OH⁻.' },
      { ask: 'Encuentra una base que <b>no tenga OH⁻</b>.', ok: (v) => v.p === 2, win: 'El amoníaco recibe el H⁺ que le pasan: es base según Brønsted-Lowry.' },
    ],
  },
  g9u2l2: {
    at: 0,
    ctl: [{ id: 'x', label: 'pH', min: 0, max: 14, step: 0.5, v: 7, fmt: (x) => fm(x, 1) }],
    scene: (v) => ({ type: 'graph', kind: 'phscale', mark: v.x }),
    read: (v) => (v.x === 7 ? 'Neutro, como el agua pura.' : `<b>${(10 ** Math.abs(7 - v.x)).toLocaleString('es-CO', { maximumFractionDigits: 1 })} veces</b> más ${v.x < 7 ? 'ácido' : 'básico'} que el agua pura.`),
    tasks: [
      { ask: 'Encuentra un pH <b>100 veces más ácido</b> que el agua pura.', ok: (v) => v.x === 5, win: 'Dos puntos por debajo de 7: 10 × 10 = 100. Es el pH del café.' },
      { ask: 'Encuentra algo <b>1000 veces más básico</b> que el agua pura.', ok: (v) => v.x === 10, win: 'Tres puntos por encima de 7: 10 × 10 × 10 = 1.000. Es el pH del jabón.' },
    ],
  },
  g9u2l3: {
    at: 5,
    ctl: [{ id: 'x', label: 'Soda (NaOH 0,1 M) que agregas a 10 mL de HCl 0,1 M', min: 0, max: 20, step: 1, v: 0, unit: 'mL' }],
    scene: (v) => {
      const ph = v.x < 10 ? -Math.log10((0.1 * (10 - v.x)) / (10 + v.x)) : v.x === 10 ? 7 : 14 + Math.log10((0.1 * (v.x - 10)) / (10 + v.x));
      return { type: 'graph', kind: 'phscale', mark: +ph.toFixed(1) };
    },
    read: (v) => (v.x < 10 ? 'Todavía sobra ácido.' : v.x === 10 ? 'Todo el H⁺ reaccionó con el OH⁻: <b>neutro</b>.' : 'Ahora sobra base.'),
    tasks: [
      { ask: 'Neutraliza el ácido: llega a <b>pH 7</b>.', ok: (v) => v.x === 10, win: 'Cada H⁺ encontró su OH⁻ y formaron agua. Solo quedan sal y agua.' },
      { ask: 'Pásate un poco: agrega <b>2 mL más</b>.', ok: (v) => v.x === 12, win: 'Con solo 2 mL de más ya sobra base y el pH pasa de 11. Por eso, cerca del final, se agrega gota a gota.' },
    ],
  },
  g9u3l1: {
    ctl: [{ id: 'p', label: 'Contaminante', opts: ['CO₂', 'PM2,5', 'Ozono (O₃)', 'SO₂'], v: -1 }],
    scene: (v) => [{ type: 'lab', kind: 'greenhouse' }, { type: 'lab', kind: 'smog' }, { type: 'mol', mol: 'O3', pair: 'NO2' }, { type: 'mol', mol: 'SO2', pair: null }][v.p] || {},
    read: (v) => ['Atrapa el calor que la Tierra devuelve al espacio.', 'Partículas diminutas que salen del humo de buses y fábricas.', 'Se forma cuando el sol actúa sobre los gases de los carros.', 'Sale al quemar combustibles con azufre; con el agua forma ácido.'][v.p] || 'Elige un contaminante y mira qué hace.',
    tasks: [
      { ask: 'Encuentra el que causa el <b>efecto invernadero</b>.', ok: (v) => v.p === 0, win: 'El CO₂ deja entrar la luz del sol pero retiene el calor.' },
      { ask: 'Encuentra el que produce <b>lluvia ácida</b>.', ok: (v) => v.p === 3, win: 'El SO₂ reacciona con el agua de las nubes y forma ácido sulfúrico.' },
      { ask: 'Encuentra el que <b>llega hasta los pulmones</b>.', ok: (v) => v.p === 1, win: 'El PM2,5 es tan fino que pasa la nariz y llega al fondo de los pulmones.' },
    ],
  },
  g9u3l2: {
    ctl: [{ id: 'p', label: 'Pictograma', opts: ['Llama', 'Mano y metal corroídos', 'Calavera', 'Signo de exclamación', 'Pez y árbol', 'Llama sobre un círculo'], v: -1 }],
    scene: (v) => ({ type: 'lab', kind: 'pictograms', step: v.p >= 0 ? v.p : null }),
    tasks: [
      { ask: '¿Qué pictograma lleva la <b>gasolina</b>?', ok: (v) => v.p === 0, win: 'Inflamable: se prende con facilidad. Lejos del fuego y de las chispas.' },
      { ask: '¿Y el <b>destapador de cañerías</b> (soda cáustica)?', ok: (v) => v.p === 1, win: 'Corrosivo: destruye la piel y los metales. Guantes y gafas.' },
      { ask: '¿Y un producto que <b>mata a los peces</b> si se bota al río?', ok: (v) => v.p === 4, win: 'Peligro ambiental: nunca se bota por el desagüe.' },
    ],
  },

  /* ---------------- 10° ---------------- */
  g10u1l1: {
    at: 4,
    ctl: [{ id: 'z', label: 'Electrones (Z)', min: 1, max: 20, step: 1, v: 1 }],
    scene: (v) => ({ type: 'building', Z: v.z, focus: 'valence', order: false }),
    read: (v) => {
      const order: [string, number][] = [['1s', 2], ['2s', 2], ['2p', 6], ['3s', 2], ['3p', 6], ['4s', 2]];
      let left = v.z; const cfg: string[] = [];
      for (const [o, c] of order) { if (left <= 0) break; const k = Math.min(c, left); cfg.push(o + '<sup>' + k + '</sup>'); left -= k; }
      const top = v.z > 18 ? 4 : v.z > 10 ? 3 : v.z > 2 ? 2 : 1, val = v.z - [0, 0, 2, 10, 18][top];
      return `<b>${PT[v.z - 1][1]}</b>: ${cfg.join(' ')}<br>Último piso: ${top} · electrones de valencia: <b>${val}</b>`;
    },
    tasks: [
      { ask: 'Agrega electrones hasta llenar el <b>2s</b> sin poner nada en el 2p.', ok: (v) => v.z === 4, win: 'El berilio: 1s² 2s². Ya están llenos los dos apartamentos s de abajo.', hint: 'En 1s caben 2 y en 2s caben 2.' },
      { ask: 'Ahora llena el piso 2 <b>por completo</b>.', ok: (v) => v.z === 10, win: 'El neón: 2 + 2 + 6 = 10. Piso 2 lleno, por eso casi no reacciona.' },
      { ask: 'Encuentra el átomo con <b>un solo electrón de valencia</b> en el piso 3.', ok: (v) => v.z === 11, win: 'El sodio: …2p⁶ 3s¹. Ese electrón solito es el que regala con facilidad.' },
    ],
  },
  g10u1l2: {
    at: 4,
    ctl: [{ id: 'z', label: 'Número atómico (Z)', min: 5, max: 10, step: 1, v: 5 }],
    scene: (v) => ({ type: 'orbital', show: ['2p'], Z: v.z, hund: true }),
    read: (v) => `<b>${PT[v.z - 1][1]}</b>: ${v.z - 4} electrones en los tres orbitales 2p · solos (desapareados): <b>${v.z - 4 <= 3 ? v.z - 4 : 10 - v.z}</b>`,
    tasks: [
      { ask: 'Encuentra el átomo con <b>más electrones desapareados</b> en 2p.', ok: (v) => v.z === 7, win: 'El nitrógeno: 3 electrones, uno en cada orbital (regla de Hund).' },
      { ask: 'Encuentra el primero en que un orbital 2p queda con <b>un par</b>.', ok: (v) => v.z === 8, win: 'El oxígeno: el cuarto electrón ya no tiene orbital vacío y se aparea.' },
    ],
  },
  g10u1l3: {
    at: 4,
    ctl: [{ id: 'y', label: 'Tiempo', min: 0, max: 22920, step: 573, v: 0, unit: 'años', fmt: (x) => x.toLocaleString('es-CO') }],
    scene: (v) => ({ type: 'graph', kind: 'decay', mark: v.y }),
    read: (v) => `Queda <b>${fm(100 * 0.5 ** (v.y / 5730), 1)} %</b> del carbono-14`,
    tasks: [
      { ask: 'Un hueso conserva el <b>50 %</b> de su carbono-14. ¿Cuántos años tiene?', ok: (v) => v.y === 5730, win: 'Una vida media: 5730 años.' },
      { ask: 'Otro conserva el <b>25 %</b>. ¿Cuántos años tiene?', ok: (v) => v.y === 11460, win: 'Dos vidas medias: la mitad de la mitad. 2 × 5730 = 11 460 años.' },
    ],
  },
  g10u2l1: {
    ctl: [{ id: 'p', label: 'Molécula', opts: ['H₂O', 'NH₃', 'CH₄', 'HCl'], v: -1 }],
    scene: (v) => (v.p >= 0 ? { type: 'mol', mol: ['H2O', 'NH3', 'CH4', 'HCl'][v.p], lp: true, pair: null } : {}),
    read: (v) => (v.p >= 0 ? 'Las nubes son pares libres; los palitos son enlaces (pares compartidos). Cuenta los del átomo central.' : 'Elige una molécula.'),
    tasks: [
      { ask: 'Encuentra la molécula cuyo átomo central tiene <b>2 pares libres</b>.', ok: (v) => v.p === 0, win: 'El O del agua: 2 pares compartidos + 2 libres = 8 electrones.' },
      { ask: 'Encuentra la que <b>no tiene ningún par libre</b>.', ok: (v) => v.p === 2, win: 'El C del metano usa sus 4 pares para enlazar 4 hidrógenos.' },
      { ask: 'Encuentra un átomo con <b>3 pares libres</b>.', ok: (v) => v.p === 3, win: 'El cloro del HCl: 1 par compartido + 3 libres.' },
    ],
  },
  g10u2l2: {
    ctl: [
      { id: 'a', label: 'Átomo A', opts: ['Sodio (Na)', 'Magnesio (Mg)', 'Hidrógeno (H)', 'Carbono (C)'], v: -1 },
      { id: 'b', label: 'Átomo B', opts: ['Cloro (Cl)', 'Oxígeno (O)', 'Hidrógeno (H)', 'Sodio (Na)'], v: -1 },
    ],
    scene: (v) => {
      if (v.a < 0 || v.b < 0) return {};
      const A = ['Na', 'Mg', 'H', 'C'][v.a], B = ['Cl', 'O', 'H', 'Na'][v.b];
      const ea = [0.93, 1.31, 2.2, 2.55][v.a], eb = [3.16, 3.44, 2.2, 0.93][v.b], d = Math.abs(ea - eb);
      const metal = (A === 'Na' || A === 'Mg') && B === 'Na';
      if (metal) return { type: 'lattice', kind: 'metal' };
      if (d > 1.7 || B === 'Na') return { type: 'lattice', kind: 'transfer' };
      const key = A + B === 'HCl' ? 'HCl' : A + B === 'HO' ? 'H2O' : A + B === 'HH' ? 'H2' : A + B === 'CH' ? 'CH4' : A + B === 'CO' ? 'CO2' : 'HCl';
      return { type: 'mol', mol: key, pair: null, dipole: d > 0.4, lp: false };
    },
    read: (v) => {
      if (v.a < 0 || v.b < 0) return 'Elige dos átomos para unirlos.';
      const ea = [0.93, 1.31, 2.2, 2.55][v.a], eb = [3.16, 3.44, 2.2, 0.93][v.b], d = Math.abs(ea - eb);
      const metal = v.a <= 1 && v.b === 3;
      return `Electronegatividad ${fm(ea)} y ${fm(eb)} · <b>ΔEN = ${fm(d)}</b>` + (metal ? ' · dos metales' : '');
    },
    tasks: [
      { ask: 'Forma un enlace <b>iónico</b>.', ok: (v) => v.a >= 0 && v.b >= 0 && Math.abs([0.93, 1.31, 2.2, 2.55][v.a] - [3.16, 3.44, 2.2, 0.93][v.b]) > 1.7 && !(v.a <= 1 && v.b === 3), win: 'Con ΔEN > 1,7 un átomo arranca el electrón del otro: quedan iones que se atraen.' },
      { ask: 'Forma un enlace <b>covalente apolar</b>.', ok: (v) => v.a === 2 && v.b === 2, win: 'Dos átomos iguales (ΔEN = 0) comparten los electrones por igual.' },
      { ask: 'Forma un enlace <b>metálico</b>.', ok: (v) => v.a <= 1 && v.a >= 0 && v.b === 3, win: 'Entre metales los electrones quedan libres: un mar de electrones.' },
    ],
  },
  g10u2l3: {
    at: 4,
    ctl: [
      { id: 'd', label: 'Pares alrededor del átomo central', min: 2, max: 4, step: 1, v: 4 },
      { id: 'l', label: 'De ellos, pares libres', min: 0, max: 2, step: 1, v: 0 },
    ],
    scene: (v) => { const k = ({ '4-0': 'CH4', '4-1': 'NH3', '4-2': 'H2O', '3-0': 'BF3', '2-0': 'CO2' } as Record<string, string>)[v.d + '-' + v.l]; return k ? { type: 'mol', mol: k, pair: null, lp: true } : {}; },
    read: (v) => ({ '4-0': '<b>Tetraédrica</b>, 109,5° (CH₄)', '4-1': '<b>Piramidal</b>, 107° (NH₃)', '4-2': '<b>Angular</b>, 104,5° (H₂O)', '3-0': '<b>Trigonal plana</b>, 120° (BF₃)', '2-0': '<b>Lineal</b>, 180° (CO₂)' } as Record<string, string>)[v.d + '-' + v.l] || 'Con tan pocos pares, esa combinación no tiene ejemplo en esta lección.',
    predict: { q: 'Si cambias un enlace por un par libre, el ángulo entre los enlaces…', o: ['Se cierra un poco', 'Se abre', 'No cambia'], a: 0, e: 'El par libre ocupa más espacio y empuja a los enlaces.' },
    tasks: [
      { ask: 'Forma una molécula <b>piramidal</b>.', ok: (v) => v.d === 4 && v.l === 1, win: '4 pares, 1 libre: el par libre empuja y el ángulo baja a 107°.' },
      { ask: 'Forma una molécula <b>angular</b>.', ok: (v) => v.d === 4 && v.l === 2, win: '4 pares, 2 libres: el agua, con 104,5°.' },
      { ask: 'Forma una molécula <b>lineal</b>.', ok: (v) => v.d === 2 && v.l === 0, win: 'Solo 2 pares: se alejan al máximo, 180°.' },
    ],
  },
  g10u3l1: {
    at: 3,
    ctl: [{ id: 'p', label: 'Elemento + oxígeno', opts: ['Calcio (Ca)', 'Sodio (Na)', 'Carbono (C)', 'Azufre (S)', 'Nitrógeno (N)'], v: -1 }],
    scene: (v) => (v.p === 1 ? { type: 'lattice', kind: 'ionic' } : v.p >= 0 ? { type: 'mol', mol: ['CaO', '', 'CO2', 'SO3', 'NO2'][v.p], pair: null } : {}),
    read: (v) => ['Se forma <b>CaO</b>, óxido de calcio (cal viva).', 'Se forma <b>Na₂O</b>, óxido de sodio.', 'Se forma <b>CO₂</b>, dióxido de carbono.', 'Se forma <b>SO₃</b>, trióxido de azufre.', 'Se forma <b>NO₂</b>, dióxido de nitrógeno.'][v.p] || 'Elige qué elemento se une con el oxígeno.',
    tasks: [
      { ask: 'Forma un <b>óxido básico</b>.', ok: (v) => v.p === 0 || v.p === 1, win: 'Metal + oxígeno = óxido básico. Con agua forma un hidróxido.' },
      { ask: 'Forma un <b>óxido ácido</b>.', ok: (v) => v.p >= 2, win: 'No metal + oxígeno = óxido ácido. Con agua forma un oxácido.' },
    ],
  },
  g10u3l2: {
    at: 1,
    ctl: [{ id: 'p', label: 'Óxido + agua', opts: ['CaO (óxido de calcio)', 'SO₃ (trióxido de azufre)'], v: -1 }],
    scene: (v) => (v.p === 0 ? rx([[1, 'CaO'], [1, 'H2O']], [[1, 'CaOH2']], { count: true }) : v.p === 1 ? rx([[1, 'SO3'], [1, 'H2O']], [[1, 'H2SO4']], { count: true }) : {}),
    read: (v) => ['CaO + H₂O → <b>Ca(OH)₂</b>, hidróxido de calcio', 'SO₃ + H₂O → <b>H₂SO₄</b>, ácido sulfúrico'][v.p] || 'Elige el óxido que vas a mezclar con agua.',
    tasks: [
      { ask: 'Obtén un <b>hidróxido</b> (una base).', ok: (v) => v.p === 0, win: 'Óxido básico + agua → hidróxido. Es la cal apagada.' },
      { ask: 'Obtén un <b>oxácido</b>.', ok: (v) => v.p === 1, win: 'Óxido ácido + agua → oxácido: tiene H, el no metal y O.' },
    ],
  },
  g10u3l3: {
    at: 0,
    ctl: [
      { id: 'a', label: 'Ácido', opts: ['HCl (clorhídrico)', 'H₂SO₄ (sulfúrico)'], v: -1 },
      { id: 'b', label: 'Base', opts: ['NaOH', 'Ca(OH)₂'], v: -1 },
    ],
    scene: (v) => (v.a === 0 && v.b === 0 ? rx([[1, 'HCl'], [1, 'NaOH']], [[1, 'NaClp'], [1, 'H2O']], { count: true }) : v.a >= 0 && v.b >= 0 ? { type: 'lattice', kind: 'ionic' } : {}),
    read: (v) => (v.a < 0 || v.b < 0 ? 'Elige un ácido y una base.' : 'Se forma <b>' + [['NaCl, cloruro de sodio', 'CaCl₂, cloruro de calcio'], ['Na₂SO₄, sulfato de sodio', 'CaSO₄, sulfato de calcio']][v.a][v.b] + '</b> y agua.'),
    tasks: [
      { ask: 'Forma una sal <b>haloidea</b> (sin oxígeno).', ok: (v) => v.a === 0 && v.b >= 0, win: 'Viene de un hidrácido: -hídrico cambia a -uro (clorhídrico → cloruro).' },
      { ask: 'Forma una <b>oxisal</b>.', ok: (v) => v.a === 1 && v.b >= 0, win: 'Viene de un oxácido: -ico cambia a -ato (sulfúrico → sulfato).' },
      { ask: 'Forma el <b>yeso</b> (sulfato de calcio).', ok: (v) => v.a === 1 && v.b === 1, win: 'H₂SO₄ + Ca(OH)₂ → CaSO₄ + 2H₂O.' },
    ],
  },
  g10u4l1: {
    ctl: [{ id: 'p', label: 'Reacción', opts: ['2H₂ + O₂ → 2H₂O', '2H₂O₂ → 2H₂O + O₂', 'Na + Cl → NaCl'], v: -1 }],
    scene: (v) => [rx([[2, 'H2'], [1, 'O2']], [[2, 'H2O']], { count: true }), rx([[2, 'H2O2']], [[2, 'H2O'], [1, 'O2']], { count: true }), { type: 'lattice', kind: 'transfer' }][v.p] || {},
    read: (v) => ['Dos sustancias se unen y forman una sola.', 'Una sustancia se separa en dos más simples.', 'Un átomo le pasa un electrón al otro.'][v.p] || 'Elige una reacción y mírala.',
    tasks: [
      { ask: 'Encuentra la reacción de <b>descomposición</b>.', ok: (v) => v.p === 1, win: 'El agua oxigenada se separa en agua y oxígeno: por eso burbujea en una herida.' },
      { ask: 'Encuentra una de <b>óxido-reducción</b> donde se ve el electrón pasar.', ok: (v) => v.p === 2, win: 'El sodio se oxida (pierde un electrón) y el cloro se reduce (lo gana).' },
    ],
  },
  g10u4l2: {
    at: 0,
    ctl: [{ id: 'g', label: 'H₂SO₄', min: 0, max: 196, step: 24.5, v: 0, unit: 'g', fmt: (x) => fm(x, 1) }],
    scene: (v) => ({ type: 'particles', phase: 'liquid', temp: 0.3, species: [{ f: 'H2SO4', n: Math.max(1, Math.round((v.g / 98) * 6)), label: 'H₂SO₄' }] }),
    read: (v) => `Masa molar 98 g/mol · <b>n = ${fm(v.g, 1)} ÷ 98 = ${fm(v.g / 98, 2)} mol</b>`,
    tasks: [
      { ask: 'Toma <b>0,5 mol</b> de ácido sulfúrico.', ok: (v) => near(v.g, 49), win: '0,5 × 98 = 49 g.' },
      { ask: 'Ahora <b>2 mol</b>.', ok: (v) => near(v.g, 196), win: '2 × 98 = 196 g.' },
    ],
  },
  g10u4l3: {
    ctl: [
      { id: 'h', label: 'H₂', min: 0, max: 6, step: 1, v: 1, unit: 'mol' },
      { id: 'o', label: 'O₂', min: 0, max: 4, step: 1, v: 1, unit: 'mol' },
    ],
    scene: (v) => ({ type: 'particles', phase: 'gas', temp: 0.5, species: [...(v.h ? [{ f: 'H2', n: v.h * 3, label: 'H₂' }] : []), ...(v.o ? [{ f: 'O2', n: v.o * 3, label: 'O₂' }] : [])].concat(v.h || v.o ? [] : [{ f: 'H2', n: 1, label: 'H₂' }]) }),
    read: (v) => {
      const w = Math.min(v.h, 2 * v.o), lh = v.h - w, lo = v.o - w / 2;
      return `2H₂ + O₂ → 2H₂O · Se forman <b>${w} mol de agua</b>` + (lh ? ` · sobran ${lh} mol de H₂` : '') + (lo ? ` · sobran ${fm(lo, 1)} mol de O₂` : '');
    },
    tasks: [
      { ask: 'Forma <b>4 mol de agua sin que sobre nada</b>.', ok: (v) => v.h === 4 && v.o === 2, win: 'La proporción es 2 : 1. 4 mol de H₂ con 2 de O₂ dan 4 de agua.' },
      { ask: 'Pon <b>4 mol de H₂ y 3 de O₂</b>. ¿Cuál se acaba primero?', ok: (v) => v.h === 4 && v.o === 3, win: 'El H₂ es el reactivo límite: se acaba primero y sobra 1 mol de O₂.' },
    ],
  },

  /* ---------------- 11° ---------------- */
  g11u1l1: {
    at: 0,
    ctl: [{ id: 't', label: 'Temperatura', min: 0, max: 100, step: 5, v: 30, unit: '%' }],
    scene: (v) => ({ type: 'reaction', mode: 'collide', temp: Math.max(0.05, v.t / 100) }),
    read: (v) => (v.t < 30 ? 'Pocos choques tienen la energía de activación.' : v.t < 70 ? 'Algunos choques ya superan la energía de activación.' : 'Muchos choques superan la energía de activación.') + ' Mira el contador de choques efectivos.',
    predict: { q: 'Si subes la temperatura, ¿qué pasa con los choques que logran reaccionar?', o: ['Aumentan', 'Disminuyen', 'No cambian'], a: 0, e: 'Las partículas chocan más seguido y con más energía.' },
    tasks: [
      { ask: 'Haz que la reacción vaya <b>rápido</b>.', ok: (v) => v.t >= 80, win: 'Más temperatura: más choques y más de ellos superan la energía de activación.' },
      { ask: 'Ahora casi <b>detenla</b>, como en la nevera.', ok: (v) => v.t <= 10, win: 'En frío casi ningún choque tiene energía suficiente: por eso la nevera conserva la comida.' },
    ],
  },
  g11u1l2: {
    at: 0,
    ctl: [{ id: 'p', label: 'Cambio en N₂ + 3H₂ ⇌ 2NH₃ (libera calor)', opts: ['Agregar N₂', 'Retirar NH₃', 'Aumentar la presión', 'Calentar'], v: -1 }],
    scene: (v) => (v.p >= 0 ? { type: 'reaction', mode: 'reversible', speed: v.p === 3 ? 1.6 : 1, temp: v.p === 3 ? 0.9 : 0.5 } : {}),
    read: (v) => ['El sistema gasta el N₂ que sobra: <b>→ más NH₃</b>.', 'El sistema repone el NH₃ que falta: <b>→ más NH₃</b>.', 'Hay 4 moléculas de gas a la izquierda y 2 a la derecha: se va hacia menos moléculas, <b>→ más NH₃</b>.', 'La reacción libera calor; al calentar, el sistema lo gasta yendo al revés: <b>← menos NH₃</b>.'][v.p] || 'Elige un cambio y mira hacia dónde responde el equilibrio.',
    tasks: [
      { ask: 'Encuentra el cambio que produce <b>menos amoníaco</b>.', ok: (v) => v.p === 3, win: 'Le Châtelier: si la reacción libera calor, calentar la empuja hacia los reactivos.' },
      { ask: 'Encuentra un cambio que funcione por el <b>número de moléculas de gas</b>.', ok: (v) => v.p === 2, win: 'Más presión favorece el lado con menos moléculas de gas: 2 NH₃ en vez de 4.' },
    ],
  },
  g11u2l1: {
    ctl: [{ id: 'p', label: 'Enlace entre los carbonos', opts: ['Sencillo (etano)', 'Doble (eteno)', 'Triple (etino)'], v: -1 }],
    scene: (v) => (v.p >= 0 ? { mol: ['C2H6', 'C2H4', 'C2H2'][v.p], pair: null } : {}),
    read: (v) => ['Cada C: 4 enlaces sencillos, en forma de tetraedro.', 'Cada C: un doble enlace y dos sencillos, todo en un plano.', 'Cada C: un triple enlace y uno sencillo, en línea recta.'][v.p] || 'Elige el enlace entre los dos carbonos y gira la molécula.',
    tasks: [
      { ask: 'Encuentra el carbono <b>sp²</b> (trigonal plano, 120°).', ok: (v) => v.p === 1, win: 'El eteno: con un doble enlace el carbono es sp² y queda plano.' },
      { ask: 'Encuentra el carbono <b>lineal de 180°</b>.', ok: (v) => v.p === 2, win: 'El etino: con un triple enlace el carbono es sp.' },
    ],
  },
  g11u2l2: {
    ctl: [
      { id: 'n', label: 'Carbonos', min: 1, max: 4, step: 1, v: 1 },
      { id: 'b', label: 'Enlace más fuerte', opts: ['Solo sencillos', 'Un doble', 'Un triple'], v: 0 },
    ],
    scene: (v) => { const k = ({ '1-0': 'CH4', '2-0': 'C2H6', '3-0': 'C3H8', '4-0': 'C4H10', '2-1': 'C2H4', '2-2': 'C2H2', '3-1': 'C2H4', '4-1': 'C2H4', '3-2': 'C2H2', '4-2': 'C2H2' } as Record<string, string>)[v.n + '-' + v.b]; return k ? { mol: k, pair: null, highlight: v.b === 1 ? 'C=C' : v.b === 2 ? 'C#C' : null } : { mol: 'CH4', pair: null, highlight: null }; },
    read: (v) => {
      if (v.n === 1 && v.b > 0) return 'Con un solo carbono no hay enlace C–C: necesitas al menos 2.';
      const pre = ['met', 'et', 'prop', 'but'][v.n - 1], suf = ['ano', 'eno', 'ino'][v.b];
      const h = v.b === 0 ? 2 * v.n + 2 : v.b === 1 ? 2 * v.n : 2 * v.n - 2;
      return `<b>${pre}${suf}</b> · ${sub(`C${v.n === 1 ? '' : v.n}H${h}`)} · fórmula ${['CₙH₂ₙ₊₂', 'CₙH₂ₙ', 'CₙH₂ₙ₋₂'][v.b]}` + (v.n > 2 && v.b > 0 ? `<br><small>La escena muestra el ${v.b === 1 ? 'doble' : 'triple'} enlace en la molécula más pequeña que lo tiene.</small>` : '');
    },
    tasks: [
      { ask: 'Construye el <b>propano</b> del gas de cilindro.', ok: (v) => v.n === 3 && v.b === 0, win: 'prop = 3 carbonos, -ano = solo enlaces sencillos: C₃H₈.' },
      { ask: 'Construye el <b>etino</b> (acetileno).', ok: (v) => v.n === 2 && v.b === 2, win: 'et = 2 carbonos, -ino = triple enlace: C₂H₂.' },
      { ask: 'Construye un <b>alqueno de 4 carbonos</b>.', ok: (v) => v.n === 4 && v.b === 1, win: 'El buteno, C₄H₈: cumple CₙH₂ₙ.' },
    ],
  },
  g11u2l3: {
    ctl: [
      { id: 'a', label: 'Molécula A', opts: ['Butano', 'Isobutano', '1-propanol', '2-propanol', 'Etanol', 'Dimetil éter'], v: -1 },
      { id: 'b', label: 'Molécula B', opts: ['Butano', 'Isobutano', '1-propanol', '2-propanol', 'Etanol', 'Dimetil éter'], v: -1 },
    ],
    scene: (v) => { const K = ['C4H10', 'iC4H10', 'C3H7OH', 'iC3H7OH', 'C2H5OH', 'CH3OCH3']; return v.a >= 0 ? { mol: K[v.a], pair: v.b >= 0 && v.b !== v.a ? K[v.b] : null, highlight: v.a >= 2 ? 'OH' : null } : {}; },
    read: (v) => {
      const F = ['C₄H₁₀', 'C₄H₁₀', 'C₃H₈O', 'C₃H₈O', 'C₂H₆O', 'C₂H₆O'];
      if (v.a < 0 || v.b < 0) return 'Elige dos moléculas para compararlas.';
      if (v.a === v.b) return 'Es la misma molécula: elige otra para B.';
      return `A: ${F[v.a]} · B: ${F[v.b]} · ` + (F[v.a] === F[v.b] ? '<b>misma fórmula molecular</b>' : 'fórmulas distintas');
    },
    tasks: [
      { ask: 'Elige dos isómeros <b>de cadena</b>.', ok: (v) => [v.a, v.b].sort().join() === '0,1', win: 'Butano e isobutano: la cadena es recta o ramificada.' },
      { ask: 'Ahora dos isómeros <b>de posición</b>.', ok: (v) => [v.a, v.b].sort().join() === '2,3', win: '1-propanol y 2-propanol: el –OH cambia de carbono.' },
      { ask: 'Y dos isómeros <b>de función</b>.', ok: (v) => [v.a, v.b].sort().join() === '4,5', win: 'Etanol y dimetil éter: misma fórmula, distinto grupo funcional (alcohol y éter).' },
    ],
  },
  g11u3l1: {
    at: 0,
    ctl: [{ id: 'p', label: 'Alcohol', opts: ['Metanol', 'Etanol', '1-propanol'], v: -1 }],
    scene: (v) => (v.p >= 0 ? { type: 'mol', mol: ['CH3OH', 'C2H5OH', 'C3H7OH'][v.p], highlight: 'OH', pair: null } : {}),
    read: (v) => ['CH₃OH · hierve a 65 °C · tóxico', 'C₂H₅OH · hierve a 78 °C', 'C₃H₇OH · hierve a 97 °C'][v.p] || 'Elige un alcohol y busca su grupo –OH.',
    tasks: [
      { ask: 'Encuentra el alcohol de las <b>bebidas y del antiséptico</b>.', ok: (v) => v.p === 1, win: 'El etanol: 2 carbonos y un –OH.' },
      { ask: 'Encuentra el que <b>hierve a mayor temperatura</b>.', ok: (v) => v.p === 2, win: 'Más carbonos = molécula más grande = más atracción entre moléculas.' },
    ],
  },
  g11u3l2: {
    ctl: [{ id: 'p', label: 'Molécula', opts: ['Formaldehído', 'Etanal', 'Acetona'], v: -1 }],
    scene: (v) => (v.p >= 0 ? { mol: ['H2CO', 'CH3CHO', 'C3H6O'][v.p], highlight: 'CO', pair: null } : {}),
    read: (v) => ['El C=O está en el extremo de la cadena.', 'El C=O está en el extremo de la cadena.', 'El C=O está en un carbono del medio.'][v.p] || 'Elige una molécula y busca el grupo C=O.',
    tasks: [
      { ask: 'Encuentra la <b>cetona</b>.', ok: (v) => v.p === 2, win: 'En las cetonas el carbonilo está entre dos carbonos. La acetona es el quitaesmalte.' },
      { ask: 'Encuentra el aldehído que se usa en el <b>formol</b>.', ok: (v) => v.p === 0, win: 'El formaldehído: el aldehído más simple, con el C=O en el extremo.' },
    ],
  },
  g11u3l3: {
    at: 0,
    ctl: [{ id: 'p', label: 'Molécula', opts: ['Ácido acético', 'Acetato de etilo', 'Metilamina'], v: -1 }],
    scene: (v) => [{ type: 'mol', mol: 'CH3COOH', highlight: 'COOH', pair: null }, { type: 'mol', mol: 'CH3COOC2H5', highlight: null, pair: null }, { type: 'mol', mol: 'CH3NH2', highlight: 'NH2', pair: null }][v.p] || {},
    read: (v) => ['Grupo –COOH: ácido carboxílico.', 'Grupo –COO– entre dos cadenas: éster.', 'Grupo –NH₂: amina.'][v.p] || 'Elige una molécula y mira su grupo funcional.',
    tasks: [
      { ask: 'Encuentra la que <b>huele a frutas</b>.', ok: (v) => v.p === 1, win: 'Los ésteres dan el olor de muchas frutas; se forman con un ácido y un alcohol.' },
      { ask: 'Encuentra la del <b>vinagre</b>.', ok: (v) => v.p === 0, win: 'El ácido acético: su grupo –COOH lo hace ácido.' },
      { ask: 'Encuentra la que <b>huele a pescado</b>.', ok: (v) => v.p === 2, win: 'Las aminas, con nitrógeno, dan el olor del pescado.' },
    ],
  },
  g11u4l1: {
    ctl: [{ id: 'p', label: 'Biomolécula', opts: ['Almidón', 'Triglicérido', 'Proteína', 'ADN'], v: -1 }],
    scene: (v) => (v.p >= 0 ? { type: 'chain', kind: ['starch', 'lipid', 'protein', 'dna'][v.p] } : {}),
    read: (v) => ['Muchas glucosas unidas en cadena.', 'Glicerol con tres colas largas.', 'Aminoácidos que se pliegan en hélice.', 'Doble hélice con cuatro bases.'][v.p] || 'Elige una biomolécula y mira cómo está armada.',
    tasks: [
      { ask: 'Encuentra la que <b>guarda la información genética</b>.', ok: (v) => v.p === 3, win: 'El ADN: el orden de sus bases A, T, C y G es el mensaje.' },
      { ask: 'Encuentra la que forma <b>músculos y enzimas</b>.', ok: (v) => v.p === 2, win: 'Las proteínas: cadenas de aminoácidos plegadas.' },
      { ask: 'Encuentra la que guarda energía en la <b>papa y el arroz</b>.', ok: (v) => v.p === 0, win: 'El almidón: un carbohidrato hecho de glucosas.' },
    ],
  },
  g11u4l2: {
    at: 0,
    ctl: [
      { id: 'k', label: 'Monómero', opts: ['Eteno → polietileno', 'Cloroeteno → PVC'], v: 0 },
      { id: 'n', label: 'Monómeros unidos', min: 2, max: 10, step: 1, v: 2 },
    ],
    scene: (v) => ({ type: 'chain', kind: v.k === 1 ? 'pvc' : 'polyethylene', grow: true, n: v.n }),
    read: (v) => `${v.n} × ${v.k === 1 ? 'C₂H₃Cl (62,5 g/mol)' : 'C₂H₄ (28 g/mol)'} = <b>${fm(v.n * (v.k === 1 ? 62.5 : 28), 1)} g/mol</b>`,
    tasks: [
      { ask: 'Arma una cadena de polietileno de <b>224 g/mol</b>.', ok: (v) => v.k === 0 && v.n === 8, win: '224 ÷ 28 = 8 monómeros. Un plástico real tiene miles.' },
      { ask: 'Cambia al monómero del <b>PVC</b> de los tubos.', ok: (v) => v.k === 1, win: 'El PVC se forma igual, pero cada monómero lleva un cloro.' },
    ],
  },
  g11u4l3: {
    at: 0,
    ctl: [{ id: 'x', label: 'Moléculas de O₂', min: 1, max: 6, step: 1, v: 2 }],
    scene: (v) => rx([[1, 'C3H8'], [v.x, 'O2']], [[3, 'CO2'], [4, 'H2O']], { count: true }),
    read: (v) => `Oxígenos: <b>${2 * v.x} antes</b> y <b>10 después</b> (6 en el CO₂ + 4 en el agua)`,
    tasks: [
      { ask: 'Dale al propano el oxígeno justo para una <b>combustión completa</b>.', ok: (v) => v.x === 5, win: 'C₃H₈ + 5O₂ → 3CO₂ + 4H₂O. Con menos oxígeno sale CO y hollín: combustión incompleta.' },
    ],
  },
};
