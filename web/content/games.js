// "Reto de la unidad": un minijuego al final de cada unidad (id = <unidad>r, ej. g8u1r).
// from: toma los ítems de las actividades de clasificación o balanceo de esas lecciones.
// quizFrom: 'unit' toma todas las preguntas de "Demuestra" de la unidad.
export const UNIT_GAMES = {
  g6u1: { game: 'sorter', title: '¿Materia o energía?', from: ['g6u1l1'], extra: [['Una nube', 0], ['El trueno', 1], ['Un celular', 0], ['El olor del café', 0], ['Las ondas de radio', 1]] },
  g6u2: { game: 'sorter', title: 'Elementos, compuestos y mezclas', from: ['g6u2l1'], extra: [['Cobre (Cu)', 0], ['Dióxido de carbono (CO₂)', 1], ['Ensalada de frutas', 2], ['Sancocho', 2], ['Helio (He)', 0], ['Amoníaco (NH₃)', 1]] },
  g6u3: { game: 'sorter', title: '¿Cambio físico o químico?', from: ['g6u3l1', 'g6u3l2'] },

  g7u1: { game: 'memory', title: 'Parejas del átomo', pairs: [
    ['Protón', 'Carga positiva, en el núcleo'], ['Neutrón', 'Sin carga, en el núcleo'], ['Electrón', 'Carga negativa, muy liviano'],
    ['Número atómico Z', 'Cantidad de protones'], ['Número de masa A', 'Protones + neutrones'], ['Ion', 'Ganó o perdió electrones'],
    ['Rutherford', 'Lámina de oro y núcleo'], ['Bohr', 'Niveles de energía'] ] },
  g7u2: { game: 'hunter', title: 'Cazador de la tabla periódica', time: 90 },
  g7u3: { game: 'builder', title: 'Arma la molécula', targets: ['H2O', 'O2', 'CO2', 'NH3', 'CH4', 'HCl'], palette: ['H', 'C', 'N', 'O', 'Cl'] },

  g8u1: { game: 'balancer', title: 'Balanceo relámpago', from: ['g8u1l2', 'g8u1l3'], extraRx: [
    { r: ['Na', 'Cl2'], p: ['NaCl'], c: [2, 1, 2] }, { r: ['H2O2'], p: ['H2O', 'O2'], c: [2, 2, 1] }, { r: ['Mg', 'O2'], p: ['MgO'], c: [2, 1, 2] }, { r: ['C3H8', 'O2'], p: ['CO2', 'H2O'], c: [1, 5, 3, 4] } ] },
  g8u2: { game: 'reactor', title: 'Controla el reactor de gas', mode: 'gas' },
  g8u3: { game: 'blitz', title: 'Contrarreloj: masa, mol y densidad', quizFrom: 'unit', extraItems: [
    { q: '¿Cuántas partículas hay en un mol?', o: ['6,02 × 10²³', '1.000', '6,02 × 10²', '100'], a: 0, e: 'Es el número de Avogadro.' },
    { q: 'Masa molar del CO₂ (C = 12, O = 16)', o: ['28 g/mol', '44 g/mol', '32 g/mol', '40 g/mol'], a: 1, e: '12 + 2 × 16 = 44 g/mol.' },
    { q: 'Un objeto de 20 g ocupa 10 cm³. Su densidad es…', o: ['0,5 g/cm³', '2 g/cm³', '200 g/cm³', '30 g/cm³'], a: 1, e: 'd = m ÷ V = 20 ÷ 10.' },
    { q: 'Si viajas a la Luna, tu masa…', o: ['Disminuye', 'Aumenta', 'Es la misma', 'Desaparece'], a: 2, e: 'Cambia el peso, no la masa.' },
    { q: '¿Qué flota en agua?', o: ['Hierro', 'Corcho', 'Oro', 'Piedra'], a: 1, e: 'El corcho (0,24 g/cm³) es menos denso que el agua.' } ] },

  g9u1: { game: 'blitz', title: 'Contrarreloj de soluciones', quizFrom: 'unit', extraItems: [
    { q: 'En agua con panela, el solvente es…', o: ['La panela', 'El agua', 'El vaso', 'El calor'], a: 1, e: 'El solvente es el que está en mayor cantidad.' },
    { q: '10 g de sal en 100 g de solución es…', o: ['1 % m/m', '10 % m/m', '100 % m/m', '0,1 % m/m'], a: 1, e: '(10 ÷ 100) × 100 = 10 %.' },
    { q: '2 mol de soluto en 1 L de solución es…', o: ['0,5 M', '1 M', '2 M', '4 M'], a: 2, e: 'M = moles ÷ litros.' },
    { q: 'Si agregas agua a una solución, su concentración…', o: ['Sube', 'Baja', 'No cambia', 'Se duplica'], a: 1, e: 'Los moles de soluto son los mismos en más volumen.' } ] },
  g9u2: { game: 'sorter', title: 'Atrapa ácidos y bases', bins: ['Ácido', 'Neutro', 'Base'], items: [
    ['Jugo de limón (pH 2)', 0], ['Vinagre (pH 3)', 0], ['Gaseosa (pH 3)', 0], ['Café (pH 5)', 0], ['Agua pura (pH 7)', 1], ['Sal disuelta en agua', 1],
    ['Leche de magnesia (pH 10)', 2], ['Jabón (pH 10)', 2], ['Blanqueador (pH 12,5)', 2], ['Bicarbonato (pH 8,3)', 2], ['Ácido del estómago (pH 1,5)', 0],
    ['Soda cáustica (NaOH)', 2], ['Ácido clorhídrico (HCl)', 0], ['Amoníaco (NH₃)', 2], ['Lluvia ácida (pH 4,5)', 0] ] },
  g9u3: { game: 'memory', title: 'Parejas del ambiente', pairs: [
    ['CO₂', 'Efecto invernadero'], ['SO₂ y NOₓ', 'Lluvia ácida'], ['PM2,5', 'Entra a los pulmones'], ['Ozono troposférico', 'Luz solar + gases de carros'],
    ['Pictograma de llama', 'Inflamable'], ['Pictograma de calavera', 'Tóxico'], ['Blanqueador + amoníaco', 'Gases tóxicos (cloraminas)'], ['Mano corroída', 'Corrosivo'] ] },

  g10u1: { game: 'hunter', title: 'Cazador de configuraciones', time: 90, clues: [
    { c: 'Mi configuración termina en 2p⁴', a: 'O' }, { c: 'Termino en 3s¹', a: 'Na' }, { c: 'Termino en 2p⁶ (gas noble)', a: 'Ne' }, { c: 'Termino en 3p⁵', a: 'Cl' },
    { c: 'Tengo 1s² y nada más', a: 'He' }, { c: 'Termino en 2p²', a: 'C' }, { c: 'Termino en 4s²', a: 'Ca' }, { c: 'Termino en 3p³', a: 'P' },
    { c: 'Termino en 2s¹', a: 'Li' }, { c: 'Termino en 3d⁶ 4s²', a: 'Fe' }, { c: 'Tengo 7 electrones de valencia y estoy en el periodo 2', a: 'F' }, { c: 'Termino en 2p³', a: 'N' },
    { c: 'Termino en 3s²', a: 'Mg' }, { c: 'Termino en 3p⁶', a: 'Ar' }, { c: 'Termino en 3p²', a: 'Si' }, { c: 'Termino en 1s¹', a: 'H' } ] },
  g10u2: { game: 'builder', title: 'Constructor de geometrías', targets: ['H2O', 'NH3', 'CH4', 'BF3', 'CO2', 'HCl', 'H2CO'], palette: ['H', 'B', 'C', 'N', 'O', 'F', 'Cl'] },
  g10u3: { game: 'memory', title: 'Parejas de nomenclatura', pairs: [
    ['CaO', 'Óxido de calcio'], ['CO₂', 'Dióxido de carbono'], ['Fe₂O₃', 'Óxido de hierro (III)'], ['Ca(OH)₂', 'Hidróxido de calcio'],
    ['H₂SO₄', 'Ácido sulfúrico'], ['HCl', 'Ácido clorhídrico'], ['NaCl', 'Cloruro de sodio'], ['CaCO₃', 'Carbonato de calcio'] ] },
  g10u4: { game: 'balancer', title: 'Balanceo de alto nivel', rx: [
    { r: ['Fe', 'O2'], p: ['Fe2O3'], c: [4, 3, 2] }, { r: ['C4H10', 'O2'], p: ['CO2', 'H2O'], c: [2, 13, 8, 10] }, { r: ['Al', 'HCl'], p: ['AlCl3', 'H2'], c: [2, 6, 2, 3] },
    { r: ['KClO3'], p: ['KCl', 'O2'], c: [2, 2, 3] }, { r: ['C2H5OH', 'O2'], p: ['CO2', 'H2O'], c: [1, 3, 2, 3] }, { r: ['Zn', 'HCl'], p: ['ZnCl2', 'H2'], c: [1, 2, 1, 1] },
    { r: ['H2SO4', 'NaOH'], p: ['Na2SO4', 'H2O'], c: [1, 2, 1, 2] }, { r: ['CaCO3'], p: ['CaO', 'CO2'], c: [1, 1, 1] } ] },

  g11u1: { game: 'reactor', title: 'Le Châtelier en acción', mode: 'equilibrium' },
  g11u2: { game: 'builder', title: 'Constructor de hidrocarburos', targets: ['CH4', 'C2H6', 'C2H4', 'C2H2', 'C3H8'], palette: ['C', 'H'] },
  g11u3: { game: 'sorter', title: 'Atrapa grupos funcionales', bins: ['Alcohol –OH', 'Carbonilo C=O', 'Ácido –COOH', 'Amina –NH₂'], items: [
    ['Etanol', 0], ['Metanol', 0], ['Propanona (acetona)', 1], ['Metanal (formaldehído)', 1], ['Ácido acético', 2], ['Ácido fórmico', 2],
    ['Metilamina', 3], ['2-propanol', 0], ['Etanal', 1], ['Ácido butanoico', 2], ['Etilamina', 3], ['Glicerina', 0], ['Butanona', 1] ] },
  g11u4: { game: 'memory', title: 'Parejas de la vida y la industria', pairs: [
    ['Glucosa', 'Carbohidrato'], ['Aceite de oliva', 'Lípido'], ['Enzima', 'Proteína'], ['ADN', 'Ácido nucleico'],
    ['Polietileno', 'Bolsas plásticas'], ['PET', 'Botellas'], ['Destilación fraccionada', 'Separa el petróleo'], ['Monóxido de carbono', 'Combustión incompleta'] ] },
};

/** Arma el spec final del juego de una unidad a partir del contenido de sus lecciones. */
export function resolveUnitGame(unit, lessonById) {
  const g = UNIT_GAMES[unit.id];
  if (!g) return null;
  const spec = { id: unit.id + 'r', ...g };
  if (g.game === 'sorter' && g.from) {
    const acts = g.from.map((id) => lessonById[id]?.act).filter(Boolean);
    spec.bins = spec.bins || acts[0].bins;
    spec.items = [...(g.items || []), ...acts.flatMap((a) => a.items), ...(g.extra || [])];
  }
  if (g.game === 'balancer' && g.from) {
    spec.rx = [...g.from.flatMap((id) => lessonById[id]?.act?.rx || []).map(({ r, p, c }) => ({ r, p, c })), ...(g.extraRx || [])];
  }
  if (g.game === 'blitz') {
    const fromUnit = g.quizFrom === 'unit' ? unit.lessons.flatMap((l) => l.quiz) : [];
    spec.items = [...fromUnit, ...(g.extraItems || [])];
  }
  return spec;
}
