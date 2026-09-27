// Escena visual de cada lección para el momento "Aprende".
// Cada paso (steps[i]) acompaña el párrafo i de la lección. t = título corto del paso; x = texto propio del paso
// (solo cuando la lección tiene menos párrafos que pasos). El resto de campos es el estado de la escena (ver lib/SPEC.md).
const R = (s) => s.split('+').map((x) => { const m = x.trim().match(/^(\d*)\s*(\S+)$/); return [m[1] ? +m[1] : 1, m[2]]; });
const rx = (left, right, extra = {}) => ({ r: R(left), p: R(right), ...extra });

export const LESSON_SCENES = {
  /* ---------------- 6° ---------------- */
  g6u1l1: { type: 'particles', phase: 'solid', temp: 0.3, species: [{ f: 'H2O', n: 18, label: 'Agua' }], steps: [
    { t: 'Todo lo que tiene masa y volumen', phase: 'liquid' },
    { t: 'La luz y el sonido no son materia', empty: true },
    { t: 'Masa y volumen se pueden medir', empty: false, phase: 'solid' },
  ] },
  g6u1l2: { type: 'column', layers: [{ n: 'Miel', d: 1.42, c: '#C98A1B' }, { n: 'Agua', d: 1.0, c: '#4F8FD0' }, { n: 'Aceite', d: 0.92, c: '#E4C35A' }], objs: [], steps: [
    { t: 'Propiedades generales: masa y volumen', objs: [] },
    { t: 'Propiedades específicas identifican', objs: [{ n: 'Uva', d: 1.1, c: '#7B3F8C' }] },
    { t: 'Densidad: ¿flota o se hunde?', drop: true, objs: [{ n: 'Corcho', d: 0.24, c: '#B08050' }, { n: 'Hielo', d: 0.92, c: '#CFEAF7' }, { n: 'Uva', d: 1.1, c: '#7B3F8C' }, { n: 'Moneda', d: 8.9, c: '#C88033' }] },
  ] },
  g6u1l3: { type: 'particles', species: [{ f: 'H2O', n: 20, label: 'Agua' }], steps: [
    { t: 'Sólido, líquido y gas', phase: 'solid', temp: 0.2 },
    { t: 'Calentar acelera las partículas', phase: 'liquid', temp: 0.55 },
    { t: 'Hervir depende de la presión', phase: 'gas', temp: 0.85 },
  ] },
  g6u2l1: { type: 'particles', phase: 'gas', temp: 0.35, steps: [
    { t: 'Sustancias puras', species: [{ f: 'O2', n: 12, label: 'Oxígeno' }] },
    { t: 'Elemento: un solo tipo de átomo', species: [{ f: 'Fe', n: 27, label: 'Hierro' }], phase: 'solid' },
    { t: 'Compuesto: elementos unidos', species: [{ f: 'H2O', n: 14, label: 'Agua' }], phase: 'liquid' },
  ] },
  g6u2l2: { type: 'particles', phase: 'liquid', temp: 0.35, steps: [
    { t: 'Una mezcla conserva cada sustancia', layout: 'mixed', species: [{ f: 'H2O', n: 14, label: 'Agua' }, { f: 'Na', n: 6, label: 'Sal' }] },
    { t: 'Homogénea: no se distinguen', layout: 'dissolve', dissolve: 1, species: [{ f: 'Na', n: 8, label: 'Azúcar' }, { f: 'H2O', n: 16, label: 'Agua' }] },
    { t: 'Heterogénea: se ven las partes', layout: 'layers', species: [{ f: 'C', n: 12, label: 'Aceite' }, { f: 'H2O', n: 14, label: 'Agua' }] },
  ] },
  g6u2l3: { type: 'lab', kind: 'filtration', steps: [
    { t: 'Separar usando las propiedades', kind: 'magnet' },
    { t: 'Filtrar, decantar, evaporar, destilar', kind: 'filtration' },
    { t: 'Decantación', x: 'Decantación: el líquido más denso queda abajo y se deja salir abriendo la llave del embudo. Así se separan agua y aceite.', kind: 'decantation' },
    { t: 'Evaporación', x: 'Evaporación: al calentar agua de mar, el agua se va como vapor y la sal queda en forma de cristales.', kind: 'evaporation' },
    { t: 'Destilación', x: 'Destilación: el líquido que hierve primero se evapora, se enfría en el refrigerante y cae en otro recipiente. Así se separa el alcohol del agua.', kind: 'distillation' },
  ] },
  g6u3l1: { type: 'lab', kind: 'kitchen', steps: [
    { t: 'Cambio físico: la misma sustancia', type: 'particles', phase: 'solid', temp: 0.25, species: [{ f: 'H2O', n: 18, label: 'Hielo' }] },
    { t: 'Cambio químico: sustancias nuevas', type: 'lab', kind: 'evidence' },
    { t: 'Quemar, oxidar, fermentar', type: 'reaction', ...rx('CH4 + 2O2', 'CO2 + 2H2O', { count: true }) },
  ] },
  g6u3l2: { type: 'lab', kind: 'kitchen', steps: [
    { t: 'La arepa que se dora', step: 0 },
    { t: 'Bicarbonato y vinagre', step: 1 },
    { t: 'Picar, derretir, disolver', step: 2 },
  ] },

  /* ---------------- 7° ---------------- */
  g7u1l1: { type: 'atom', Z: 3, N: 4, E: 3, steps: [
    { t: 'Dalton y Thomson', model: 'thomson' },
    { t: 'Rutherford: un núcleo diminuto', model: 'rutherford' },
    { t: 'Bohr y el modelo actual', model: 'bohr' },
    { t: 'Orbitales', x: 'En el modelo mecánico-cuántico no hay órbitas fijas: el electrón está en una nube de probabilidad llamada orbital. Donde la nube es más densa, es más probable encontrarlo.', model: 'cloud' },
  ] },
  g7u1l2: { type: 'atom', model: 'bohr', Z: 6, N: 6, E: 6, steps: [
    { t: 'Núcleo y electrones', focus: 'nucleus' },
    { t: 'Z define el elemento', focus: null, Z: 6, N: 6, E: 6 },
    { t: 'Iones e isótopos', Z: 11, N: 12, E: 10, focus: 'valence' },
  ] },
  g7u2l1: { type: 'ptable', hl: 'cats', steps: [
    { t: 'Ordenados por número atómico', hl: 'none', els: ['H', 'He', 'Li'] },
    { t: 'Periodos y grupos', hl: 'periods', periods: [2, 3], els: [] },
    { t: 'Familias de elementos', hl: 'groups', groups: [1, 17, 18] },
  ] },
  g7u2l2: { type: 'ptable', hl: 'metals', steps: [
    { t: 'Metales', els: ['Na', 'Fe', 'Cu'] },
    { t: 'No metales', els: ['O', 'N', 'Cl'] },
    { t: 'Metaloides', els: ['Si', 'B', 'Ge'] },
  ] },
  g7u2l3: { type: 'ptable', hl: 'radius', arrow: true, steps: [
    { t: 'Propiedades que se repiten', hl: 'cats', arrow: false },
    { t: 'Radio atómico', hl: 'radius', arrow: true },
    { t: 'Electronegatividad', hl: 'en', arrow: true, els: ['F'] },
  ] },
  g7u3l1: { type: 'mol', mol: 'H2O', steps: [
    { t: 'La fórmula dice qué y cuántos', mol: 'H2O' },
    { t: 'El subíndice cuenta átomos', mol: 'CO2', pair: 'CH4' },
    { t: 'Pocos elementos, millones de sustancias', mol: 'C2H5OH', pair: 'CH3COOH' },
  ] },
  g7u3l2: { type: 'particles', species: [{ f: 'H2O', n: 20, label: 'Agua' }], steps: [
    { t: 'Fuerzas de atracción', phase: 'solid', temp: 0.15 },
    { t: 'Temperatura contra atracción', phase: 'gas', temp: 0.8 },
    { t: 'Puentes de hidrógeno', type: 'lattice', kind: 'hbond' },
  ] },

  /* ---------------- 8° ---------------- */
  g8u1l1: { type: 'lab', kind: 'evidence', steps: [
    { t: 'Reactivos se convierten en productos', type: 'reaction', ...rx('2H2 + O2', '2H2O') },
    { t: 'Evidencias de una reacción', type: 'lab', kind: 'evidence' },
    { t: '¿Se formó una sustancia nueva?', type: 'particles', phase: 'gas', temp: 0.8, species: [{ f: 'H2O', n: 16, label: 'Vapor de agua' }] },
  ] },
  g8u1l2: { type: 'reaction', ...rx('CH4 + 2O2', 'CO2 + 2H2O'), steps: [
    { t: 'Reactivos → productos', count: false },
    { t: 'Lavoisier: la masa se conserva', type: 'lab', kind: 'scale' },
    { t: 'Mismos átomos a cada lado', type: 'reaction', count: true },
  ] },
  g8u1l3: { type: 'reaction', count: true, steps: [
    { t: 'Primero metales y no metales', ...rx('N2 + 3H2', '2NH3') },
    { t: 'Nunca cambies subíndices', mol: 'H2O', type: 'mol', pair: 'H2O2' },
    { t: 'Los enteros más pequeños', type: 'reaction', ...rx('C3H8 + 5O2', '3CO2 + 4H2O') },
  ] },
  g8u2l1: { type: 'particles', phase: 'gas', species: [{ f: 'N2', n: 16, label: 'Nitrógeno' }, { f: 'O2', n: 5, label: 'Oxígeno' }], steps: [
    { t: 'Partículas separadas y rápidas', temp: 0.5 },
    { t: 'Presión = choques', temp: 0.5, pressure: true },
    { t: 'Temperatura = movimiento', temp: 0.95, pressure: true },
  ] },
  g8u2l2: { type: 'particles', phase: 'gas', species: [{ f: 'He', n: 22, label: 'Gas' }], pressure: true, steps: [
    { t: 'Boyle: menos volumen, más presión', vol: 0.5, temp: 0.5 },
    { t: 'Charles: más temperatura, más volumen', type: 'graph', kind: 'charles' },
    { t: 'Gay-Lussac: más temperatura, más presión', type: 'graph', kind: 'gaylussac' },
  ] },
  g8u2l3: { type: 'graph', kind: 'boyle', steps: [
    { t: 'PV = nRT', type: 'particles', phase: 'gas', temp: 0.6, vol: 0.8, pressure: true, species: [{ f: 'He', n: 20, label: 'Gas' }] },
    { t: 'Gas ideal y gas real', type: 'graph', kind: 'boyle' },
  ] },
  g8u3l1: { type: 'mol', mol: 'H2O', steps: [
    { t: 'Masa y peso', type: 'column', layers: [{ n: 'Agua', d: 1, c: '#4F8FD0' }], objs: [{ n: 'Tu masa no cambia', d: 0.95, c: '#E6B460' }], drop: true },
    { t: 'Contar por paquetes: el mol', type: 'particles', phase: 'solid', temp: 0.1, species: [{ f: 'C', n: 27, label: 'Carbono' }] },
    { t: 'Masa molar del agua', type: 'mol', mol: 'H2O' },
  ] },
  g8u3l2: { type: 'column', layers: [{ n: 'Mercurio', d: 13.6, c: '#AAB4BE' }, { n: 'Agua', d: 1.0, c: '#4F8FD0' }, { n: 'Aceite', d: 0.92, c: '#E4C35A' }], objs: [], steps: [
    { t: 'Identificar materiales', objs: [{ n: 'Madera', d: 0.6, c: '#A0703C' }, { n: 'Plástico PET', d: 1.38, c: '#9AD1E8' }], drop: true },
    { t: 'Metales densos', objs: [{ n: 'Hierro', d: 7.87, c: '#8C8C8C' }, { n: 'Oro', d: 19.3, c: '#D4AF37' }, { n: 'Madera', d: 0.6, c: '#A0703C' }], drop: true },
    { t: 'Aire caliente sube', type: 'particles', phase: 'gas', temp: 0.95, vol: 1, species: [{ f: 'N2', n: 12, label: 'Aire caliente' }] },
  ] },

  /* ---------------- 9° ---------------- */
  g9u1l1: { type: 'particles', phase: 'liquid', layout: 'dissolve', temp: 0.4, species: [{ f: 'Na', n: 10, label: 'Sal (soluto)' }, { f: 'H2O', n: 18, label: 'Agua (solvente)' }], steps: [
    { t: 'Soluto y solvente', dissolve: 0.6 },
    { t: 'Solubilidad', type: 'graph', kind: 'solubility', curves: ['KNO3', 'NaCl', 'azucar'] },
    { t: 'Solución saturada', type: 'particles', dissolve: 0.7, species: [{ f: 'Na', n: 16, label: 'Sal que sobra' }, { f: 'H2O', n: 16, label: 'Agua' }] },
  ] },
  g9u1l2: { type: 'graph', kind: 'dilution', steps: [
    { t: '¿Cuánto soluto hay?', type: 'particles', phase: 'liquid', layout: 'dissolve', dissolve: 1, species: [{ f: 'Na', n: 6, label: 'Soluto' }, { f: 'H2O', n: 20, label: 'Agua' }] },
    { t: 'Porcentajes', type: 'graph', kind: 'dilution' },
    { t: 'Partes por millón', type: 'particles', phase: 'liquid', layout: 'dissolve', dissolve: 1, species: [{ f: 'Cl', n: 1, label: 'Cloro' }, { f: 'H2O', n: 26, label: 'Agua' }] },
  ] },
  g9u1l3: { type: 'graph', kind: 'dilution', steps: [
    { t: 'Moles por litro', type: 'particles', phase: 'liquid', layout: 'dissolve', dissolve: 1, species: [{ f: 'Na', n: 10, label: 'NaCl' }, { f: 'H2O', n: 18, label: 'Agua' }] },
    { t: '58,5 g en 1 L = 1 M', type: 'mol', mol: 'NaCl' },
    { t: 'Diluir: M₁V₁ = M₂V₂', type: 'graph', kind: 'dilution' },
  ] },
  g9u2l1: { type: 'reaction', steps: [
    { t: 'Arrhenius: H⁺ y OH⁻', type: 'mol', mol: 'HCl', pair: 'NaOH', dipole: true },
    { t: 'Brønsted-Lowry: donar y aceptar H⁺', type: 'mol', mol: 'NH3', lp: true },
    { t: 'Nunca se prueban', type: 'lab', kind: 'pictograms' },
  ] },
  g9u2l2: { type: 'graph', kind: 'phscale', steps: [
    { t: 'De 0 a 14', mark: 7 },
    { t: 'Cada unidad es ×10', mark: 3 },
    { t: 'Indicador de repollo morado', type: 'lab', kind: 'indicator' },
  ] },
  g9u2l3: { type: 'reaction', ...rx('HCl + NaOH', 'NaClp + H2O', { count: true }), steps: [
    { t: 'Ácido + base → sal + agua' },
    { t: 'H⁺ + OH⁻ → H₂O', type: 'reaction', ...rx('HCl + NaOH', 'NaClp + H2O', { count: false }) },
    { t: 'Antiácidos y cal', type: 'lab', kind: 'antacid' },
  ] },
  g9u3l1: { type: 'lab', kind: 'greenhouse', steps: [
    { t: 'Efecto invernadero y lluvia ácida', kind: 'greenhouse' },
    { t: 'Material particulado PM2,5', kind: 'smog' },
    { t: 'Ozono troposférico', type: 'mol', mol: 'O3', pair: 'NO2' },
  ] },
  g9u3l2: { type: 'lab', kind: 'pictograms', steps: [
    { t: 'Leer la etiqueta', step: 0 },
    { t: 'Pictogramas de peligro', step: 1 },
    { t: 'Mezclas peligrosas', step: 2 },
  ] },

  /* ---------------- 10° ---------------- */
  g10u1l1: { type: 'orbital', Z: 8, steps: [
    { t: 'Niveles y subniveles', show: ['1s', '2s', '2p'], Z: null },
    { t: 'Orden de llenado', show: ['1s', '2s', '2p'], Z: 8 },
    { t: 'Electrones de valencia', type: 'atom', model: 'bohr', Z: 8, N: 8, E: 8, focus: 'valence' },
  ] },
  g10u1l2: { type: 'orbital', show: ['2p'], Z: 7, steps: [
    { t: 'Orbital: dónde está el electrón', show: ['1s', '2s'], Z: null },
    { t: 'Regla de Hund', show: ['2p'], Z: 7, hund: true },
    { t: 'Electrones desapareados', show: ['2p'], Z: 8, hund: true },
  ] },
  g10u1l3: { type: 'atom', model: 'bohr', Z: 6, N: 6, E: 6, steps: [
    { t: 'Carbono-12 y carbono-14', N: 8 },
    { t: 'Vida media', type: 'graph', kind: 'decay' },
    { t: 'Fisión nuclear', type: 'atom', fission: true, Z: 36, N: 50, E: 36 },
  ] },
  g10u2l1: { type: 'mol', mol: 'H2O', lp: true, steps: [
    { t: 'Completar el octeto', type: 'lattice', kind: 'transfer' },
    { t: 'Pares compartidos y libres', type: 'mol', mol: 'NH3', lp: true },
    { t: 'El octeto del agua', type: 'mol', mol: 'H2O', lp: true },
  ] },
  g10u2l2: { type: 'lattice', kind: 'transfer', steps: [
    { t: 'Iónico: ΔEN > 1,7', kind: 'transfer' },
    { t: 'Covalente polar y apolar', type: 'mol', mol: 'HCl', pair: 'O2', dipole: true },
    { t: 'Metálico: mar de electrones', type: 'lattice', kind: 'metal' },
  ] },
  g10u2l3: { type: 'mol', lp: true, steps: [
    { t: 'Los pares se alejan', mol: 'CH4' },
    { t: 'Tetraédrica, piramidal, angular', mol: 'NH3', pair: 'H2O' },
    { t: 'Trigonal plana y lineal', mol: 'BF3', pair: 'CO2' },
  ] },
  g10u3l1: { type: 'reaction', steps: [
    { t: 'Oxígeno + otro elemento', type: 'mol', mol: 'CaO', pair: 'CO2' },
    { t: 'Óxido básico y óxido ácido', type: 'reaction', ...rx('2Ca + O2', '2CaO', { count: true }) },
    { t: 'Nombres con prefijos y Stock', type: 'mol', mol: 'SO3', pair: 'CO' },
  ] },
  g10u3l2: { type: 'reaction', count: true, steps: [
    { t: 'Óxido básico + agua → hidróxido', ...rx('CaO + H2O', 'CaOH2') },
    { t: 'Óxido ácido + agua → oxácido', ...rx('SO3 + H2O', 'H2SO4') },
    { t: 'Hidrácidos', type: 'mol', mol: 'HCl', dipole: true },
  ] },
  g10u3l3: { type: 'reaction', ...rx('HCl + NaOH', 'NaClp + H2O', { count: true }), steps: [
    { t: 'Ácido + base → sal', },
    { t: 'Haloideas y oxisales', type: 'lattice', kind: 'ionic' },
    { t: 'De -hídrico a -uro', type: 'ptable', hl: 'groups', groups: [17], els: ['Cl'] },
  ] },
  g10u4l1: { type: 'reaction', count: true, steps: [
    { t: 'Síntesis y descomposición', ...rx('2H2 + O2', '2H2O') },
    { t: 'Óxido-reducción', type: 'lattice', kind: 'transfer' },
    { t: 'Descomposición', x: 'En la descomposición un compuesto se separa en sustancias más simples. El agua oxigenada se descompone en agua y oxígeno: por eso burbujea sobre una herida.', type: 'reaction', ...rx('2H2O2', '2H2O + O2') },
  ] },
  g10u4l2: { type: 'particles', phase: 'solid', temp: 0.1, species: [{ f: 'C', n: 27, label: '1 mol = 6,02 × 10²³' }], steps: [
    { t: 'El mol cuenta partículas' },
    { t: 'moles = masa ÷ masa molar', type: 'mol', mol: 'H2SO4' },
    { t: '49 g de H₂SO₄ = 0,5 mol', type: 'mol', mol: 'H2SO4' },
  ] },
  g10u4l3: { type: 'reaction', ...rx('CH4 + 2O2', 'CO2 + 2H2O', { count: true }), steps: [
    { t: 'Los coeficientes son proporciones' },
    { t: 'masa → moles → moles → masa', count: true },
    { t: 'Reactivo límite', ...rx('2H2 + O2', '2H2O', { count: true }) },
  ] },

  /* ---------------- 11° ---------------- */
  g11u1l1: { type: 'reaction', mode: 'collide', ...rx('H2 + Cl2', '2HCl'), steps: [
    { t: 'Choques con energía suficiente', temp: 0.3 },
    { t: 'Temperatura y catalizadores', type: 'graph', kind: 'energy' },
    { t: 'Más temperatura, más choques', x: 'Compara: al subir la temperatura hay más choques y más de ellos superan la energía de activación. Por eso la comida se daña más rápido fuera de la nevera.', type: 'reaction', mode: 'collide', temp: 0.9 },
  ] },
  g11u1l2: { type: 'reaction', mode: 'reversible', ...rx('N2 + 3H2', '2NH3'), steps: [
    { t: 'Reacciones reversibles' },
    { t: 'Le Châtelier', type: 'graph', kind: 'equilibrium', mark: null },
    { t: 'Perturbar el equilibrio', type: 'graph', kind: 'equilibrium', mark: 1 },
  ] },
  g11u2l1: { type: 'mol', mol: 'CH4', steps: [
    { t: 'Cuatro enlaces, cadenas y anillos', mol: 'C6H6', pair: 'C3H8' },
    { t: 'sp³, sp² y sp', mol: 'C2H6', pair: 'C2H4' },
    { t: 'Lineal: sp', x: 'En el etino (acetileno) cada carbono tiene un triple enlace y forma una molécula lineal de 180°. Se usa en los sopletes de soldadura.', mol: 'C2H2' },
  ] },
  g11u2l2: { type: 'mol', steps: [
    { t: 'Alcanos, alquenos y alquinos', mol: 'C2H6', pair: 'C2H4', highlight: 'C=C' },
    { t: 'Prefijos: met, et, prop, but…', mol: 'C3H8', pair: 'C4H10' },
    { t: 'Fórmulas generales', mol: 'C2H2', highlight: 'C#C' },
  ] },
  g11u2l3: { type: 'mol', steps: [
    { t: 'Misma fórmula, otra estructura', mol: 'C4H10', pair: 'iC4H10' },
    { t: 'Cadena, posición y función', mol: 'C2H5OH', pair: 'CH3OCH3', highlight: 'OH' },
    { t: 'Isomería de posición', x: 'En el 1-propanol el –OH está en un extremo; en el 2-propanol, en el carbono del medio. El 2-propanol es el alcohol isopropílico de los botiquines.', mol: 'C3H7OH', pair: 'iC3H7OH', highlight: 'OH' },
  ] },
  g11u3l1: { type: 'mol', highlight: 'OH', steps: [
    { t: 'El grupo –OH', mol: 'CH3OH' },
    { t: 'Puentes de hidrógeno', type: 'lattice', kind: 'hbond' },
    { t: 'Fermentación', type: 'lab', kind: 'fermentation' },
  ] },
  g11u3l2: { type: 'mol', highlight: 'CO', steps: [
    { t: 'El grupo carbonilo C=O', mol: 'CH3CHO', pair: 'C3H6O' },
    { t: 'Formaldehído y acetona', mol: 'H2CO', pair: 'C3H6O' },
  ] },
  g11u3l3: { type: 'mol', steps: [
    { t: 'Ácidos carboxílicos: –COOH', mol: 'CH3COOH', highlight: 'COOH' },
    { t: 'Ésteres: olor a frutas', type: 'reaction', ...rx('CH3COOH + C2H5OH', 'CH3COOC2H5 + H2O', { count: true }) },
    { t: 'Aminas: –NH₂', type: 'mol', mol: 'CH3NH2', highlight: 'NH2' },
  ] },
  g11u4l1: { type: 'chain', kind: 'starch', steps: [
    { t: 'Carbohidratos', kind: 'starch' },
    { t: 'Lípidos', x: 'Lípidos: aceites y grasas. Un triglicérido tiene una cabeza de glicerol y tres colas largas de ácidos grasos. Guardan energía y forman las membranas de las células.', kind: 'lipid' },
    { t: 'Proteínas', x: 'Proteínas: cadenas de aminoácidos que se pliegan en formas precisas. Forman músculos, uñas y enzimas que aceleran las reacciones del cuerpo.', kind: 'protein' },
    { t: 'Ácidos nucleicos', x: 'Ácidos nucleicos: el ADN es una doble hélice con cuatro bases (A, T, C, G) que guardan la información genética.', kind: 'dna' },
  ] },
  g11u4l2: { type: 'chain', kind: 'polyethylene', grow: true, steps: [
    { t: 'Monómeros que se encadenan', kind: 'polyethylene', grow: true },
    { t: 'Naturales y sintéticos', kind: 'starch' },
    { t: 'Cientos de años', type: 'lab', kind: 'plastic' },
  ] },
  g11u4l3: { type: 'reaction', ...rx('C3H8 + 5O2', '3CO2 + 4H2O', { count: true }), steps: [
    { t: 'Combustión completa' },
    { t: 'Destilación fraccionada', type: 'lab', kind: 'refinery' },
    { t: 'Biocombustibles', type: 'lab', kind: 'fermentation' },
  ] },
};
