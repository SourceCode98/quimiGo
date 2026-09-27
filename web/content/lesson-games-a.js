// Juegos de la sección "Juega" de cada lección (grados 6° a 8°). Dos por lección.
export const LESSON_GAMES_A = {
  /* ===================== GRADO 6° ===================== */

  // ¿Qué es la materia?
  g6u1l1: [
    { game: 'catcher', title: 'Atrapa la materia', rule: 'Atrapa solo lo que es materia (tiene masa y ocupa espacio)', time: 45, lives: 3,
      good: ['Una piedra', 'El humo de la leña', 'Un grano de café', 'Tu cuerpo', 'Una gota de lluvia', 'El helio de un globo', 'Un lápiz', 'Un cubo de hielo', 'Un bloque de panela', 'La arena de la playa'],
      bad: ['Luz de una linterna', 'Sonido de un pito', 'Calor de una fogata', 'Rayo láser', 'Luz de la luna', 'Música del parlante', 'Calor de una plancha', 'Eco en una cueva', 'Luz de un bombillo'] },
    { game: 'memory', title: 'Parejas de masa y volumen', pairs: [
      ['Materia', 'Tiene masa y volumen'], ['Energía', 'No tiene masa'], ['Balanza', 'Mide la masa'], ['Probeta', 'Mide el volumen'],
      ['1 mL', '1 cm³'], ['1 kg', '1.000 g'], ['1 L', '1.000 mL'], ['Luz y sonido', 'Formas de energía'] ] },
  ],

  // Propiedades de la materia y densidad
  g6u1l2: [
    { game: 'sorter', title: '¿Flota o se hunde?', bins: ['Flota en agua', 'Se hunde en agua'], time: 60, items: [
      ['Corcho (0,24 g/cm³)', 0], ['Balso (0,15 g/cm³)', 0], ['Hielo (0,92 g/cm³)', 0], ['Aceite (0,92 g/cm³)', 0], ['Gasolina (0,74 g/cm³)', 0], ['Pino (0,5 g/cm³)', 0], ['Icopor (0,03 g/cm³)', 0],
      ['Aluminio (2,7 g/cm³)', 1], ['Hierro (7,87 g/cm³)', 1], ['Oro (19,3 g/cm³)', 1], ['Vidrio (2,5 g/cm³)', 1], ['Cobre (8,96 g/cm³)', 1], ['Miel (1,4 g/cm³)', 1], ['Plomo (11,3 g/cm³)', 1] ] },
    { game: 'blitz', title: 'Contrarreloj de la densidad', time: 60, lives: 3, items: [
      { q: 'Una piedra de 30 g ocupa 10 cm³. Su densidad es…', o: ['3 g/cm³', '300 g/cm³', '0,3 g/cm³', '40 g/cm³'], a: 0, e: 'd = m ÷ V = 30 ÷ 10 = 3 g/cm³.' },
      { q: 'Si partes un bloque de hierro por la mitad, su densidad…', o: ['Se reduce a la mitad', 'Se duplica', 'Sigue igual', 'Queda en cero'], a: 2, e: 'Masa y volumen bajan a la mitad juntos: el cociente no cambia.' },
      { q: '¿Cuál es una propiedad general de la materia?', o: ['Punto de ebullición', 'Olor', 'Densidad', 'Masa'], a: 3, e: 'Toda la materia tiene masa; no sirve para distinguir sustancias.' },
      { q: 'La densidad del agua es cercana a…', o: ['10 g/cm³', '1 g/cm³', '0,1 g/cm³', '100 g/cm³'], a: 1, e: 'Por eso se compara todo con 1 g/cm³ para saber si flota.' },
      { q: '¿Qué masa tienen 10 cm³ de aluminio (2,7 g/cm³)?', o: ['2,7 g', '12,7 g', '27 g', '270 g'], a: 2, e: 'm = d × V = 2,7 × 10 = 27 g.' },
      { q: 'Un material de 0,8 g/cm³ puesto en agua…', o: ['Flota', 'Se hunde', 'Se disuelve siempre', 'Queda a medio camino'], a: 0, e: '0,8 es menor que 1 g/cm³: flota.' },
      { q: '¿Qué propiedad sirve para identificar una sustancia?', o: ['Volumen', 'Punto de fusión', 'Peso', 'Masa'], a: 1, e: 'Es una propiedad específica: cada sustancia tiene la suya.' },
      { q: 'Un tronco enorme de balso y un clavo pequeño en el río. ¿Cuál flota?', o: ['El clavo', 'Los dos', 'El tronco', 'Ninguno'], a: 2, e: 'Importa el material, no el tamaño: el balso es menos denso que el agua.' },
      { q: 'Un cuerpo tiene 5 g y ocupa 5 cm³. Comparado con el agua…', o: ['Es menos denso', 'Tiene la misma densidad', 'Es 5 veces más denso', 'Es 25 veces más denso'], a: 1, e: '5 ÷ 5 = 1 g/cm³, igual que el agua.' },
      { q: '¿Qué volumen ocupan 78,7 g de hierro (7,87 g/cm³)?', o: ['1 cm³', '7,87 cm³', '100 cm³', '10 cm³'], a: 3, e: 'V = m ÷ d = 78,7 ÷ 7,87 = 10 cm³.' } ] },
  ],

  // Estados de la materia
  g6u1l3: [
    { game: 'word', title: 'Adivina el cambio de estado', lives: 6, words: [
      { w: 'FUSIÓN', h: 'Paso de sólido a líquido, como el hielo que se derrite.' },
      { w: 'VAPORIZACIÓN', h: 'Paso de líquido a gas cuando calientas el agua.' },
      { w: 'CONDENSACIÓN', h: 'Paso de gas a líquido, como las gotas en la tapa de la olla.' },
      { w: 'SOLIDIFICACIÓN', h: 'Paso de líquido a sólido, como el agua en el congelador.' },
      { w: 'PARTÍCULAS', h: 'Piezas diminutas de la materia que se mueven más rápido al calentarlas.' },
      { w: 'PRESIÓN', h: 'En Bogotá es menor que en Cartagena, por eso el agua hierve antes.' },
      { w: 'EBULLICIÓN', h: 'Su punto en Bogotá es de unos 92 °C para el agua.' } ] },
    { game: 'order', title: 'Ordena los estados', time: 90, rounds: [
      { prompt: 'Ordena de menor a mayor separación entre partículas', items: ['Sólido', 'Líquido', 'Gas'] },
      { prompt: 'Ordena de menor a mayor rapidez de las partículas del agua', items: ['Hielo a −10 °C', 'Agua a 20 °C', 'Agua a 80 °C', 'Vapor a 120 °C'] },
      { prompt: 'Ordena lo que pasa al calentar un cubo de hielo en la estufa', items: ['Hielo sólido', 'Fusión: se derrite', 'El agua líquida se calienta', 'Vaporización: hierve', 'Vapor de agua'] },
      { prompt: 'Ordena lo que pasa al enfriar el vapor de la olla hasta el congelador', items: ['Vapor de agua', 'Condensación: gotas en la tapa', 'Agua líquida', 'Solidificación: se congela', 'Hielo'] },
      { prompt: 'Ordena de MAYOR a menor temperatura de ebullición del agua', items: ['Cartagena (0 m)', 'Medellín (1.500 m)', 'Bogotá (2.600 m)', 'Cumbre del Nevado del Ruiz (5.300 m)'] } ] },
  ],

  // Sustancias puras: elementos y compuestos
  g6u2l1: [
    { game: 'builder', title: 'Arma elementos y compuestos', targets: ['H2', 'N2', 'O3', 'Cl2', 'H2O', 'CO2', 'CO', 'H2O2'], palette: ['H', 'C', 'N', 'O', 'Cl'] },
    { game: 'truefalse', title: '¿Mito o verdad de las sustancias?', time: 60, lives: 3, items: [
      { s: 'El O₂ es un compuesto porque tiene dos átomos.', a: false, e: 'Tiene dos átomos, pero del mismo tipo: es un elemento.' },
      { s: 'El agua (H₂O) es un compuesto.', a: true, e: 'Hidrógeno y oxígeno unidos químicamente en proporción fija.' },
      { s: 'Un compuesto tiene las mismas propiedades que sus elementos.', a: false, e: 'El sodio y el cloro son peligrosos; juntos forman la sal de cocina.' },
      { s: 'Todos los elementos aparecen en la tabla periódica.', a: true, e: 'La tabla periódica es la lista de los elementos.' },
      { s: 'El oro que se extrae en Antioquia es un elemento.', a: true, e: 'Está formado por un solo tipo de átomo: Au.' },
      { s: 'La sal de cocina (NaCl) es un elemento.', a: false, e: 'Tiene sodio y cloro: es un compuesto.' },
      { s: 'En un compuesto los elementos están en proporción fija.', a: true, e: 'El agua siempre tiene 2 átomos de H por cada átomo de O.' },
      { s: 'El CO₂ tiene tres elementos distintos.', a: false, e: 'Tiene tres átomos, pero solo dos elementos: carbono y oxígeno.' },
      { s: 'Una sustancia pura tiene composición fija.', a: true, e: 'Por eso siempre tiene las mismas propiedades.' },
      { s: 'El hierro (Fe) es un compuesto porque es un metal.', a: false, e: 'Tiene un solo tipo de átomo: es un elemento.' },
      { s: 'El ozono (O₃) está formado por un solo elemento.', a: true, e: 'Tiene tres átomos, todos de oxígeno.' },
      { s: 'H₂O y H₂O₂ son la misma sustancia.', a: false, e: 'Cambia la proporción: H₂O₂ es agua oxigenada, otra sustancia.' } ] },
  ],

  // Mezclas homogéneas y heterogéneas
  g6u2l2: [
    { game: 'sorter', title: '¿Una fase o varias?', bins: ['Homogénea', 'Heterogénea'], time: 60, items: [
      ['Agua con azúcar', 0], ['Suero oral', 0], ['Alcohol antiséptico', 0], ['Agua de mar filtrada', 0], ['Tinto colado', 0], ['Gasolina', 0], ['Refresco en polvo disuelto', 0],
      ['Arroz con fríjoles', 1], ['Cereal con leche', 1], ['Bandeja paisa', 1], ['Granito', 1], ['Salpicón de frutas', 1], ['Tierra del jardín', 1], ['Aceite y vinagre', 1], ['Agua con arena', 1] ] },
    { game: 'truefalse', title: '¿Mito o verdad de las mezclas?', time: 60, lives: 3, items: [
      { s: 'En una mezcla, las sustancias cambian químicamente.', a: false, e: 'Cada sustancia conserva sus propiedades.' },
      { s: 'El agua de panela bien disuelta es una mezcla homogénea.', a: true, e: 'No se distinguen sus componentes: una sola fase.' },
      { s: 'Una mezcla homogénea también se llama solución.', a: true, e: 'Como el agua con sal disuelta.' },
      { s: 'En una mezcla la proporción de los componentes siempre es la misma.', a: false, e: 'Puedes echar más o menos panela: la proporción varía.' },
      { s: 'El sancocho es una mezcla homogénea.', a: false, e: 'Se ven la papa, la yuca y el caldo: es heterogénea.' },
      { s: 'El aire limpio es una mezcla homogénea.', a: true, e: 'Nitrógeno, oxígeno y otros gases en una sola fase.' },
      { s: 'Si un líquido es transparente, es una sustancia pura.', a: false, e: 'El agua con sal es transparente y es una mezcla.' },
      { s: 'En el agua con aceite se distinguen dos fases.', a: true, e: 'El aceite queda encima del agua.' },
      { s: 'Las mezclas se pueden separar por métodos físicos.', a: true, e: 'Porque sus componentes no cambiaron químicamente.' },
      { s: 'Si a simple vista ves una sola fase, la mezcla es heterogénea.', a: false, e: 'Una sola fase visible indica mezcla homogénea.' },
      { s: 'El agua con arena se vuelve homogénea si la revuelves muy rápido.', a: false, e: 'Al dejarla quieta la arena se asienta: se ven dos fases.' } ] },
  ],

  // Métodos de separación de mezclas
  g6u2l3: [
    { game: 'memory', title: 'Parejas de la separación', pairs: [
      ['Filtración', 'Tinto en el colador de tela'], ['Decantación', 'Agua y aceite en reposo'], ['Evaporación', 'Sal en las charcas al sol'],
      ['Destilación', 'Separar alcohol y agua'], ['Imantación', 'Limaduras de hierro y arena'], ['Tamizado', 'Harina con grumos'] ] },
    { game: 'order', title: 'Paso a paso: separa la mezcla', time: 90, rounds: [
      { prompt: 'Ordena los pasos para separar arena, sal y limaduras de hierro', items: ['Pasar un imán', 'Agregar agua y revolver', 'Filtrar para retener la arena', 'Evaporar el agua para obtener la sal'] },
      { prompt: 'Ordena los pasos de la destilación de alcohol y agua', items: ['Calentar la mezcla', 'Hierve primero el alcohol', 'El vapor pasa por el tubo frío', 'El vapor se condensa', 'Se recoge el alcohol en otro recipiente'] },
      { prompt: 'Ordena cómo se obtiene la sal en Manaure', items: ['Se llenan charcas con agua de mar', 'El sol calienta el agua', 'El agua se evapora', 'La sal queda en el fondo', 'Se recoge la sal'] },
      { prompt: 'Ordena la decantación de agua y aceite con un embudo', items: ['Echar la mezcla en el embudo', 'Esperar a que se formen dos capas', 'Abrir la llave y dejar salir el agua', 'Cerrar la llave cuando llegue el aceite'] } ] },
  ],

  // Cambio físico y cambio químico
  g6u3l1: [
    { game: 'catcher', title: 'Cazador de cambios químicos', rule: 'Atrapa solo los cambios químicos', time: 45, lives: 3,
      good: ['Quemar papel', 'Oxidar un clavo', 'Fermentar chicha', 'Encender un fósforo', 'Pudrirse una fruta', 'Cocinar un huevo', 'Agriarse la leche', 'Madurar un mango', 'Leudar el pan'],
      bad: ['Derretir hielo', 'Romper un papel', 'Disolver azúcar', 'Doblar una hoja', 'Cortar madera', 'Congelar jugo', 'Moler café', 'Evaporar agua', 'Derretir una vela'] },
    { game: 'word', title: 'Palabras del cambio', lives: 6, words: [
      { w: 'QUÍMICO', h: 'Tipo de cambio en el que se forman sustancias nuevas.' },
      { w: 'FÍSICO', h: 'Tipo de cambio en el que la sustancia sigue siendo la misma.' },
      { w: 'OXIDACIÓN', h: 'Cambio que sufre una reja de hierro con el aire y la humedad.' },
      { w: 'FERMENTACIÓN', h: 'Cambio que convierte los azúcares del maíz en alcohol y gas en la chicha.' },
      { w: 'COMBUSTIÓN', h: 'Nombre del cambio químico de quemar leña o papel.' },
      { w: 'IRREVERSIBLE', h: 'Así son muchos cambios químicos: no se pueden deshacer fácilmente.' } ] },
  ],

  // La química en la cocina
  g6u3l2: [
    { game: 'blitz', title: 'Contrarreloj en la cocina', time: 60, lives: 3, items: [
      { q: '¿Por qué la arepa se pone dorada en el budare?', o: ['Se ensucia con el budare', 'Reaccionan azúcares y proteínas (Maillard)', 'Se evapora el maíz', 'Se derrite la harina'], a: 1, e: 'La reacción de Maillard forma sustancias nuevas de color y sabor.' },
      { q: 'Derretir mantequilla en la sartén es un cambio…', o: ['Químico', 'Nuclear', 'Físico', 'Biológico'], a: 2, e: 'Solo cambia de estado: sigue siendo mantequilla.' },
      { q: 'La levadura hace crecer la masa del pan porque produce…', o: ['Oxígeno', 'Dióxido de carbono (CO₂)', 'Hidrógeno', 'Sal'], a: 1, e: 'La levadura fermenta azúcares y libera CO₂, que infla la masa.' },
      { q: 'Rallar queso es un cambio…', o: ['Físico: sigue siendo queso', 'Químico: se forma otra sustancia', 'Químico: cambia de forma', 'Nuclear'], a: 0, e: 'Solo cambia el tamaño de los pedazos.' },
      { q: 'Cuando la leche se corta…', o: ['Solo cambia de temperatura', 'Es un cambio físico', 'Se evapora', 'Se forman sustancias nuevas: cambio químico'], a: 3, e: 'Aparecen grumos y olor agrio: sustancias nuevas.' },
      { q: '¿Cuál de estos procesos del café es químico?', o: ['Moler el café', 'Tostar el café', 'Enfriar el tinto', 'Disolver azúcar en el tinto'], a: 1, e: 'Al tostarlo cambian el color, el olor y el sabor: se forman sustancias nuevas.' },
      { q: '¿Qué pista muestra que el bicarbonato con limón reacciona?', o: ['El vaso se mueve', 'Salen burbujas de gas', 'Se ve más líquido', 'No pasa nada'], a: 1, e: 'Las burbujas son CO₂, un gas nuevo.' },
      { q: 'Hacer hielo en la nevera es un cambio…', o: ['Químico', 'Irreversible', 'Nuclear', 'Físico'], a: 3, e: 'El hielo sigue siendo agua (H₂O).' },
      { q: 'El buñuelo se infla al freírse. Una causa es que…', o: ['El aceite lo empuja desde adentro', 'El gas y el vapor de la masa se expanden con el calor', 'La masa se congela', 'La masa pierde toda su agua'], a: 1, e: 'Los gases se expanden al calentarse y la masa crece.' },
      { q: 'Si se quema el arroz en el fondo de la olla…', o: ['Es un cambio físico', 'Solo cambia de color', 'Se forma carbón: cambio químico', 'Se derrite'], a: 2, e: 'El pegado negro es una sustancia nueva que no vuelve a ser arroz.' } ] },
    { game: 'truefalse', title: '¿Mito o verdad en la cocina?', time: 60, lives: 3, items: [
      { s: 'Disolver panela en agua es un cambio químico.', a: false, e: 'La panela sigue ahí; puedes recuperarla evaporando el agua.' },
      { s: 'Dorar la arepa forma sustancias nuevas de color y sabor.', a: true, e: 'Es la reacción de Maillard.' },
      { s: 'El bicarbonato con vinagre libera oxígeno.', a: false, e: 'Libera dióxido de carbono (CO₂).' },
      { s: 'Derretir mantequilla es un cambio físico.', a: true, e: 'Solo pasa de sólido a líquido.' },
      { s: 'La reacción de Maillard ocurre entre azúcares y proteínas.', a: true, e: 'Por eso se doran la arepa, el pan y la carne.' },
      { s: 'Si un alimento cambia de estado, siempre hubo un cambio químico.', a: false, e: 'Derretir o congelar son cambios físicos.' },
      { s: 'El azúcar disuelta en el tinto se puede recuperar evaporando el agua.', a: true, e: 'Disolver es un cambio físico.' },
      { s: 'Cocinar es solo calentar: en la cocina no hay química.', a: false, e: 'Dorar, fermentar y leudar son cambios químicos.' },
      { s: 'Un huevo frito vuelve a estar crudo si lo enfrías.', a: false, e: 'Freírlo formó sustancias nuevas: no se revierte.' },
      { s: 'Tostar pan es un cambio químico.', a: true, e: 'Cambian el color y el sabor: sustancias nuevas.' },
      { s: 'El vapor de la sopa es una sustancia nueva.', a: false, e: 'El vapor sigue siendo agua (H₂O).' },
      { s: 'Leudar la masa con levadura es un cambio químico.', a: true, e: 'La levadura transforma azúcares en CO₂ y otras sustancias.' } ] },
  ],

  /* ===================== GRADO 7° ===================== */

  // Historia de los modelos atómicos
  g7u1l1: [
    { game: 'word', title: 'Adivina el científico', lives: 6, words: [
      { w: 'DALTON', h: 'En 1808 propuso átomos como esferas macizas e indivisibles.' },
      { w: 'THOMSON', h: 'Descubrió el electrón y propuso el modelo del pudín con pasas.' },
      { w: 'RUTHERFORD', h: 'Disparó partículas alfa contra una lámina de oro.' },
      { w: 'BOHR', h: 'En 1913 ubicó a los electrones en niveles de energía.' },
      { w: 'NÚCLEO', h: 'Parte pequeña y positiva del átomo, hallada con la lámina de oro.' },
      { w: 'ORBITAL', h: 'Región de probabilidad donde es posible encontrar un electrón.' },
      { w: 'ELECTRÓN', h: 'Partícula negativa descubierta en 1897.' } ] },
    { game: 'truefalse', title: '¿Mito o verdad del átomo?', time: 60, lives: 3, items: [
      { s: 'Dalton pensaba que el átomo se podía dividir en partes más pequeñas.', a: false, e: 'Para Dalton el átomo era una esfera maciza e indivisible.' },
      { s: 'Thomson descubrió el electrón.', a: true, e: 'Fue en 1897; por eso su modelo tiene electrones incrustados.' },
      { s: 'En el experimento de Rutherford casi todas las partículas alfa atravesaron la lámina de oro.', a: true, e: 'Por eso concluyó que el átomo es casi vacío.' },
      { s: 'Rutherford concluyó que el átomo es macizo y sin espacios vacíos.', a: false, e: 'Concluyó lo contrario: casi todo es vacío, con un núcleo pequeño.' },
      { s: 'El núcleo del átomo tiene carga positiva.', a: true, e: 'Por eso repelía a las partículas alfa, que también son positivas.' },
      { s: 'Bohr propuso que los electrones están en niveles de energía.', a: true, e: 'Así explicó los colores de luz del hidrógeno.' },
      { s: 'El modelo actual dice que el electrón sigue una órbita exacta, como un planeta.', a: false, e: 'Habla de orbitales: regiones de probabilidad.' },
      { s: 'Un modelo se reemplaza cuando un experimento muestra algo que no puede explicar.', a: true, e: 'Así avanza la ciencia.' },
      { s: 'El modelo de Bohr es más antiguo que el de Thomson.', a: false, e: 'Thomson es de 1897 y Bohr de 1913.' },
      { s: 'Los modelos atómicos antiguos no sirvieron para nada.', a: false, e: 'Cada modelo fue la base para construir el siguiente.' },
      { s: 'Algunas partículas alfa rebotaron al acercarse al núcleo positivo.', a: true, e: 'Cargas iguales se repelen: así se descubrió el núcleo.' } ] },
  ],

  // Protones, neutrones y electrones
  g7u1l2: [
    { game: 'blitz', title: 'Contrarreloj de partículas', time: 60, lives: 3, items: [
      { q: 'Un átomo tiene 6 protones y 8 neutrones. Su número de masa es…', o: ['6', '8', '14', '2'], a: 2, e: 'A = 6 + 8 = 14: es el carbono-14.' },
      { q: 'Todo átomo con 17 protones es de…', o: ['Oxígeno', 'Cloro', 'Azufre', 'Argón'], a: 1, e: 'Z = 17 corresponde al cloro.' },
      { q: '¿Cuántos neutrones tiene el aluminio-27 (Z = 13)?', o: ['13', '27', '40', '14'], a: 3, e: 'Neutrones = A − Z = 27 − 13 = 14.' },
      { q: 'Un átomo de litio pierde 1 electrón. Queda con carga…', o: ['Positiva (Li⁺)', 'Negativa (Li⁻)', 'Neutra', 'Se vuelve helio'], a: 0, e: 'Quedan más protones que electrones.' },
      { q: 'Un átomo de cloro gana 1 electrón. Se convierte en…', o: ['Un isótopo', 'Un ion positivo', 'Un ion negativo (Cl⁻)', 'Argón'], a: 2, e: 'Tiene un electrón más que protones.' },
      { q: 'El carbono-12 y el carbono-14 se diferencian en el número de…', o: ['Protones', 'Neutrones', 'Electrones del átomo neutro', 'Elementos'], a: 1, e: 'Son isótopos: mismo Z, distinto número de neutrones.' },
      { q: '¿Qué partícula tiene carga negativa?', o: ['Protón', 'Neutrón', 'Núcleo', 'Electrón'], a: 3, e: 'El electrón está fuera del núcleo y es negativo.' },
      { q: '¿Dónde están los protones y los neutrones?', o: ['En el núcleo', 'En los niveles de energía', 'Fuera del átomo', 'Entre los electrones'], a: 0, e: 'Forman el núcleo, pequeño y denso.' },
      { q: 'El ion Na⁺ (Z = 11) tiene… electrones', o: ['11', '12', '10', '23'], a: 2, e: 'Perdió 1 electrón: 11 − 1 = 10.' },
      { q: '¿Cuál partícula es mucho más liviana que las otras?', o: ['Protón', 'Electrón', 'Neutrón', 'Todas pesan igual'], a: 1, e: 'El electrón es unas 1.800 veces más liviano que el protón.' },
      { q: 'El oxígeno-18 (Z = 8) tiene… neutrones', o: ['8', '18', '10', '26'], a: 2, e: '18 − 8 = 10 neutrones.' } ] },
    { game: 'sorter', title: '¿Protón, neutrón o electrón?', bins: ['Protón', 'Neutrón', 'Electrón'], time: 60, items: [
      ['Carga positiva', 0], ['Sin carga', 1], ['Carga negativa', 2], ['Define el elemento', 0], ['Cambia en los isótopos', 1],
      ['Se gana o se pierde en los iones', 2], ['Está fuera del núcleo', 2], ['Su número es Z', 0], ['El más liviano', 2],
      ['Se calcula con A − Z', 1], ['Lo descubrió Thomson', 2], ['Hay 6 en todo átomo de carbono', 0], ['El carbono-14 tiene 8', 1] ] },
  ],

  // Grupos y periodos
  g7u2l1: [
    { game: 'hunter', title: 'Cazador de grupos y periodos', time: 90, clues: [
      { c: 'El gas noble del periodo 1', a: 'He' }, { c: 'El metal alcalino del periodo 4', a: 'K' }, { c: 'El halógeno del periodo 2', a: 'F' },
      { c: 'El gas noble del periodo 3', a: 'Ar' }, { c: 'Periodo 2, grupo 14', a: 'C' }, { c: 'Periodo 3, grupo 16', a: 'S' },
      { c: 'Periodo 4, grupo 8', a: 'Fe' }, { c: 'El halógeno del periodo 4', a: 'Br' }, { c: 'El metal alcalino del periodo 2', a: 'Li' },
      { c: 'Periodo 4, grupo 11: el metal de los cables', a: 'Cu' }, { c: 'Periodo 2, grupo 15', a: 'N' }, { c: 'El gas noble del periodo 4', a: 'Kr' },
      { c: 'Periodo 3, grupo 2', a: 'Mg' }, { c: 'Periodo 4, grupo 9: vecino del níquel', a: 'Co' } ] },
    { game: 'memory', title: 'Parejas de la tabla', pairs: [
      ['Grupo 1', 'Metales alcalinos'], ['Grupo 17', 'Halógenos'], ['Grupo 18', 'Gases nobles'], ['Periodo', 'Fila de la tabla'],
      ['Grupo', 'Columna de la tabla'], ['Mendeléyev', 'Ordenó la tabla en 1869'], ['Número del periodo', 'Niveles de energía'], ['Mismos electrones externos', 'Propiedades parecidas'] ] },
  ],

  // Metales, no metales y metaloides
  g7u2l2: [
    { game: 'catcher', title: 'Atrapa los metales', rule: 'Atrapa solo los metales', time: 45, lives: 3,
      good: ['Fe', 'Cu', 'Na', 'Al', 'Mg', 'K', 'Ca', 'Zn', 'Ni', 'Li', 'Ti'],
      bad: ['O', 'N', 'S', 'Cl', 'C', 'P', 'F', 'Ne', 'Si', 'B', 'Br', 'He'] },
    { game: 'truefalse', title: '¿Mito o verdad de los metales?', time: 60, lives: 3, items: [
      { s: 'Los metales conducen bien la electricidad.', a: true, e: 'Por eso los cables son de cobre.' },
      { s: 'Los no metales tienden a perder electrones.', a: false, e: 'Tienden a ganarlos; los metales los pierden.' },
      { s: 'El silicio es un metaloide usado en chips y paneles solares.', a: true, e: 'Es un semiconductor.' },
      { s: 'Todos los no metales son gases.', a: false, e: 'El azufre y el carbono son sólidos, y el bromo es líquido.' },
      { s: 'Los metales están a la izquierda y en el centro de la tabla.', a: true, e: 'Los no metales quedan arriba a la derecha.' },
      { s: 'El carbón que exporta Colombia está hecho sobre todo de un no metal.', a: true, e: 'Su principal componente es el carbono.' },
      { s: 'Los metales se pueden estirar en hilos.', a: true, e: 'Así se fabrican los alambres de cobre.' },
      { s: 'El oxígeno es un metal.', a: false, e: 'Es un no metal gaseoso.' },
      { s: 'Los metaloides están en la “escalera” de la tabla.', a: true, e: 'Separan a los metales de los no metales.' },
      { s: 'Todos los metales son sólidos a temperatura ambiente.', a: false, e: 'El mercurio es un metal líquido.' },
      { s: 'El hidrógeno es un metal alcalino porque está en el grupo 1.', a: false, e: 'Está arriba del grupo 1, pero es un no metal.' } ] },
  ],

  // Propiedades periódicas
  g7u2l3: [
    { game: 'order', title: 'Ordena por tamaño y atracción', time: 90, rounds: [
      { prompt: 'Ordena de menor a mayor radio atómico (periodo 3)', items: ['Cloro (Cl)', 'Azufre (S)', 'Fósforo (P)', 'Magnesio (Mg)', 'Sodio (Na)'] },
      { prompt: 'Ordena de menor a mayor radio atómico (grupo 1)', items: ['Hidrógeno (H)', 'Litio (Li)', 'Sodio (Na)', 'Potasio (K)'] },
      { prompt: 'Ordena de menor a mayor electronegatividad (periodo 2)', items: ['Litio (Li)', 'Carbono (C)', 'Nitrógeno (N)', 'Oxígeno (O)', 'Flúor (F)'] },
      { prompt: 'Ordena de menor a mayor electronegatividad (grupo 17)', items: ['Bromo (Br)', 'Cloro (Cl)', 'Flúor (F)'] },
      { prompt: 'Ordena de menor a mayor electronegatividad', items: ['Potasio (K)', 'Sodio (Na)', 'Magnesio (Mg)', 'Azufre (S)', 'Oxígeno (O)'] } ] },
    { game: 'hunter', title: 'Caza los extremos', time: 90, clues: [
      { c: 'El más electronegativo del periodo 3', a: 'Cl' }, { c: 'El átomo más grande del periodo 2', a: 'Li' }, { c: 'El átomo más grande del periodo 3', a: 'Na' },
      { c: 'El más electronegativo del grupo 1', a: 'H' }, { c: 'El halógeno más grande (hasta Z = 36)', a: 'Br' }, { c: 'El más electronegativo del grupo 16', a: 'O' },
      { c: 'El menos electronegativo del periodo 4', a: 'K' }, { c: 'El halógeno más pequeño', a: 'F' }, { c: 'El más electronegativo del grupo 15', a: 'N' },
      { c: 'El átomo más grande del grupo 2 (hasta Z = 36)', a: 'Ca' }, { c: 'El más electronegativo del grupo 14', a: 'C' }, { c: 'El átomo más pequeño del grupo 2', a: 'Be' } ] },
  ],

  // Moléculas y fórmulas químicas
  g7u3l1: [
    { game: 'builder', title: 'Sigue la receta: arma la fórmula', targets: ['N2', 'O3', 'CO', 'H2O2', 'SO2', 'C2H5OH', 'CH3COOH', 'C3H8'], palette: ['H', 'C', 'N', 'O', 'S'] },
    { game: 'blitz', title: 'Cuenta átomos contrarreloj', time: 60, lives: 3, items: [
      { q: '¿Cuántos átomos tiene una molécula de C₂H₅OH (alcohol)?', o: ['9', '8', '3', '6'], a: 0, e: '2 C + 6 H + 1 O = 9 átomos.' },
      { q: '¿Cuántos átomos de oxígeno hay en H₂SO₄?', o: ['1', '2', '7', '4'], a: 3, e: 'El subíndice 4 va con el oxígeno.' },
      { q: '¿Cuántos elementos distintos hay en C₆H₁₂O₆ (glucosa)?', o: ['6', '3', '24', '12'], a: 1, e: 'Carbono, hidrógeno y oxígeno.' },
      { q: 'En una molécula de O₃ (ozono) hay…', o: ['3 elementos', '1 átomo', '3 átomos de oxígeno', '3 moléculas'], a: 2, e: 'Un solo elemento, tres átomos.' },
      { q: '¿Qué fórmula tiene 2 átomos de hidrógeno y 2 de oxígeno?', o: ['H₂O', 'H₂O₂', 'HO', 'H₄O'], a: 1, e: 'H₂O₂ es el agua oxigenada.' },
      { q: '¿Qué fórmula tiene 1 átomo de carbono y 1 de oxígeno?', o: ['CO₂', 'C₂O', 'CO', 'CaO'], a: 2, e: 'CO es el monóxido de carbono.' },
      { q: '¿Cuántos átomos tiene una molécula de NH₃?', o: ['3', '4', '2', '1'], a: 1, e: '1 nitrógeno + 3 hidrógenos = 4.' },
      { q: '¿Cuántos hidrógenos hay en CH₃COOH (ácido del vinagre)?', o: ['3', '2', '8', '4'], a: 3, e: '3 en CH₃ y 1 en COOH = 4.' },
      { q: 'Si un símbolo no lleva subíndice, hay…', o: ['1 átomo', '0 átomos', '2 átomos', 'No se sabe'], a: 0, e: 'El 1 no se escribe.' },
      { q: '¿Cuál es una molécula de un solo elemento?', o: ['H₂O', 'CO₂', 'NH₃', 'N₂'], a: 3, e: 'N₂ tiene dos átomos, ambos de nitrógeno.' } ] },
  ],

  // Fuerzas entre partículas
  g7u3l2: [
    { game: 'catcher', title: 'Atrapa los gases', rule: 'Atrapa solo lo que es gas a 25 °C', time: 45, lives: 3,
      good: ['O2', 'N2', 'CO2', 'He', 'CH4', 'Ne', 'Cl2', 'H2', 'NH3', 'Ar'],
      bad: ['Agua (H₂O)', 'Fe', 'Cu', 'S', 'Sal (NaCl)', 'Azúcar', 'Alcohol', 'Br', 'Aceite'] },
    { game: 'order', title: 'Fuerzas contra movimiento', time: 90, rounds: [
      { prompt: 'Ordena de fuerzas de atracción más débiles a más fuertes (a 25 °C)', items: ['Oxígeno (gas)', 'Agua (líquido)', 'Hierro (sólido)'] },
      { prompt: 'Ordena de menor a mayor punto de ebullición', items: ['Oxígeno', 'Alcohol', 'Agua'] },
      { prompt: 'Ordena de menor a mayor rapidez de las partículas', items: ['Agua a 5 °C', 'Agua a 40 °C', 'Agua a 90 °C'] },
      { prompt: 'Ordena lo que pasa al enfriar vapor de agua', items: ['Partículas rápidas y separadas', 'El movimiento se hace más lento', 'Las atracciones las juntan: líquido', 'Quedan fijas y vibrando: hielo'] } ] },
  ],

  /* ===================== GRADO 8° ===================== */

  // ¿Cómo sé que hubo una reacción?
  g8u1l1: [
    { game: 'catcher', title: '¿Reacción o trampa?', rule: 'Atrapa solo las reacciones químicas (¡ojo con las trampas!)', time: 45, lives: 3,
      good: ['Cobre verdoso', 'Pastilla burbujeante', 'Gas que arde', 'Leche agriada', 'Hierro oxidado', 'Pan tostado', 'Vela que arde', 'Huevo cocido', 'Fruta podrida', 'Vino que se avinagra'],
      bad: ['Agua hirviendo', 'Vela que se derrite', 'Bombillo encendido', 'Gaseosa destapada', 'Vapor en el espejo', 'Azúcar disuelta', 'Vidrio roto', 'Hielo derretido', 'Olla caliente'] },
    { game: 'word', title: 'Palabras de la reacción', lives: 6, words: [
      { w: 'REACTIVOS', h: 'Sustancias que hay al comienzo de una reacción.' },
      { w: 'PRODUCTOS', h: 'Sustancias nuevas que se forman en una reacción.' },
      { w: 'PRECIPITADO', h: 'Sólido que aparece al mezclar dos líquidos y es evidencia de reacción.' },
      { w: 'EFERVESCENCIA', h: 'Burbujeo de gas, como el de una pastilla en agua.' },
      { w: 'OXIDACIÓN', h: 'Reacción del hierro o del cobre con el aire que cambia su color.' },
      { w: 'EVIDENCIA', h: 'Pista observable, como un cambio de color, que sugiere una reacción.' } ] },
  ],

  // Ecuaciones y conservación de la masa
  g8u1l2: [
    { game: 'blitz', title: 'Contrarreloj de Lavoisier', time: 60, lives: 3, items: [
      { q: 'Si 4 g de hidrógeno reaccionan con 32 g de oxígeno, se forman… de agua', o: ['28 g', '36 g', '8 g', '128 g'], a: 1, e: 'Conservación de la masa: 4 + 32 = 36 g.' },
      { q: '¿Quién demostró la conservación de la masa?', o: ['Dalton', 'Bohr', 'Lavoisier', 'Mendeléyev'], a: 2, e: 'Lavoisier pesó reacciones en recipientes cerrados.' },
      { q: 'En CH₄ + 2 O₂ → CO₂ + 2 H₂O, ¿cuántos oxígenos hay en los productos?', o: ['2', '3', '6', '4'], a: 3, e: '2 en CO₂ + 2 en 2 H₂O = 4.' },
      { q: 'En una ecuación química, los productos se escriben…', o: ['A la derecha de la flecha', 'A la izquierda de la flecha', 'Encima de la flecha', 'No se escriben'], a: 0, e: 'Reactivos → productos.' },
      { q: 'Quemas 100 g de leña en un fogón y quedan 5 g de ceniza. ¿Qué pasó con el resto?', o: ['Se destruyó', 'Se fue como gases (CO₂ y vapor de agua)', 'Se volvió nada', 'Nunca existió'], a: 1, e: 'La masa no desaparece: salió como gases al aire.' },
      { q: '¿Cuántos átomos de oxígeno hay en 3 CO₂?', o: ['2', '3', '5', '6'], a: 3, e: '3 moléculas × 2 oxígenos = 6.' },
      { q: 'Un clavo se oxida dentro de un frasco cerrado. La masa total del frasco…', o: ['Aumenta', 'Disminuye', 'Se mantiene igual', 'Se vuelve cero'], a: 2, e: 'Nada entra ni sale: la masa total se conserva.' },
      { q: 'El 2 pequeño de H₂O se llama…', o: ['Coeficiente', 'Subíndice', 'Producto', 'Carga'], a: 1, e: 'El subíndice cuenta átomos dentro de la molécula.' },
      { q: 'En una reacción química, los átomos…', o: ['Se crean', 'Se destruyen', 'Cambian de elemento', 'Se reorganizan'], a: 3, e: 'Solo cambian de pareja.' },
      { q: '12 g de carbono forman 44 g de CO₂. ¿Cuánto oxígeno reaccionó?', o: ['12 g', '32 g', '44 g', '56 g'], a: 1, e: '44 − 12 = 32 g de oxígeno.' } ] },
    { game: 'memory', title: 'Parejas de la ecuación', pairs: [
      ['Reactivos', 'Lado izquierdo de la flecha'], ['Productos', 'Lado derecho de la flecha'], ['Lavoisier', 'Conservación de la masa'],
      ['Coeficiente', 'Número delante de la fórmula'], ['Subíndice', 'Número pequeño abajo'], ['→', 'Se transforma en'],
      ['CH₄', 'Metano del gas natural'], ['2 H₂O', 'Dos moléculas de agua'] ] },
  ],

  // Balanceo por tanteo
  g8u1l3: [
    { game: 'balancer', title: 'Balanceo al tanteo', time: 120, rx: [
      { r: ['H2', 'Cl2'], p: ['HCl'], c: [1, 1, 2] },
      { r: ['Cu', 'O2'], p: ['CuO'], c: [2, 1, 2] },
      { r: ['Al', 'O2'], p: ['Al2O3'], c: [4, 3, 2] },
      { r: ['Na', 'H2O'], p: ['NaOH', 'H2'], c: [2, 2, 2, 1] },
      { r: ['Fe', 'Cl2'], p: ['FeCl3'], c: [2, 3, 2] },
      { r: ['SO2', 'O2'], p: ['SO3'], c: [2, 1, 2] },
      { r: ['C2H4', 'O2'], p: ['CO2', 'H2O'], c: [1, 3, 2, 2] },
      { r: ['Ca(OH)2', 'HCl'], p: ['CaCl2', 'H2O'], c: [1, 2, 1, 2] } ] },
    { game: 'truefalse', title: '¿Mito o verdad del balanceo?', time: 60, lives: 3, items: [
      { s: 'Para balancear, puedo cambiar H₂O por H₂O₂.', a: false, e: 'Cambiar subíndices cambia la sustancia: H₂O₂ es agua oxigenada.' },
      { s: 'En el tanteo conviene dejar el oxígeno para el final.', a: true, e: 'Orden: metales, no metales, hidrógeno y oxígeno.' },
      { s: 'Los coeficientes se escriben delante de las fórmulas.', a: true, e: 'Como el 2 en 2 H₂O.' },
      { s: '4 H₂ + 2 O₂ → 4 H₂O usa los enteros más pequeños posibles.', a: false, e: 'Está balanceada, pero se simplifica a 2, 1, 2.' },
      { s: 'Si una fórmula no lleva coeficiente, se entiende que es 1.', a: true, e: 'El 1 no se escribe.' },
      { s: 'Una ecuación balanceada tiene el mismo número de moléculas a cada lado.', a: false, e: 'Tiene los mismos átomos: 2 H₂ + O₂ → 2 H₂O tiene 3 moléculas a la izquierda y 2 a la derecha.' },
      { s: 'En 2 Fe₂O₃ hay 4 átomos de hierro.', a: true, e: '2 × 2 = 4.' },
      { s: 'El método de tanteo empieza por los metales.', a: true, e: 'Luego no metales, hidrógeno y oxígeno.' },
      { s: 'H₂ + O₂ → H₂O ya está balanceada.', a: false, e: 'Hay 2 oxígenos a la izquierda y 1 a la derecha.' },
      { s: 'En 3 O₂ hay 6 átomos de oxígeno.', a: true, e: '3 × 2 = 6.' },
      { s: 'Una ecuación sin balancear no cumple la conservación de la masa.', a: true, e: 'Parecería que se crean o destruyen átomos.' } ] },
  ],

  // Teoría cinética de los gases
  g8u2l1: [
    { game: 'word', title: 'Palabras del gas', lives: 6, words: [
      { w: 'PRESIÓN', h: 'Efecto de los choques de las partículas contra las paredes.' },
      { w: 'TEMPERATURA', h: 'Mide la energía de movimiento de las partículas.' },
      { w: 'KELVIN', h: 'Escala de temperatura en la que 0 °C equivale a 273.' },
      { w: 'CHOQUES', h: 'Lo que hacen las partículas contra las paredes del recipiente.' },
      { w: 'PARTÍCULAS', h: 'Forman el gas: están muy separadas y se mueven en línea recta.' },
      { w: 'VOLUMEN', h: 'Espacio del recipiente; si se reduce, la presión sube.' } ] },
    { game: 'memory', title: 'Parejas Celsius–Kelvin', pairs: [
      ['0 °C', '273 K'], ['25 °C', '298 K'], ['100 °C', '373 K'], ['−273 °C', '0 K'],
      ['27 °C', '300 K'], ['37 °C (cuerpo humano)', '310 K'], ['92 °C (hierve en Bogotá)', '365 K'], ['−100 °C', '173 K'] ] },
  ],

  // Leyes de Boyle, Charles y Gay-Lussac
  g8u2l2: [
    { game: 'reactor', title: 'Controla la presión del cilindro', mode: 'gas' },
    { game: 'sorter', title: '¿Boyle, Charles o Gay-Lussac?', bins: ['Boyle', 'Charles', 'Gay-Lussac'], time: 60, items: [
      ['Jeringa tapada que aprietas', 0], ['Burbuja de buzo que crece al subir', 0], ['P × V = constante', 0], ['Temperatura constante', 0], ['Papas infladas al llegar a Bogotá', 0],
      ['Globo que crece al sol', 1], ['V ÷ T = constante', 1], ['Presión constante', 1], ['Globo que se encoge en la nevera', 1],
      ['Aerosol en un carro al sol', 2], ['Olla a presión al fuego', 2], ['Llanta caliente tras un viaje', 2], ['P ÷ T = constante', 2], ['Volumen constante', 2] ] },
  ],

  // La ecuación del gas ideal
  g8u2l3: [
    { game: 'blitz', title: 'Contrarreloj PV = nRT', time: 60, lives: 3, items: [
      { q: '¿Cuánto vale R en atm·L/(mol·K)?', o: ['8,31', '0,082', '273', '6,02'], a: 1, e: 'R = 0,082 atm·L/(mol·K).' },
      { q: '1 mol de gas a 273 K y 1 atm ocupa aproximadamente…', o: ['1 L', '273 L', '22,4 L', '0,082 L'], a: 2, e: 'V = 1 × 0,082 × 273 ÷ 1 ≈ 22,4 L.' },
      { q: '2 mol de gas a 300 K en 10 L. La presión es…', o: ['4,92 atm', '49,2 atm', '0,49 atm', '2,46 atm'], a: 0, e: 'P = 2 × 0,082 × 300 ÷ 10 = 4,92 atm.' },
      { q: 'Si duplicas n con P y T constantes, V…', o: ['Se reduce a la mitad', 'No cambia', 'Se cuadruplica', 'Se duplica'], a: 3, e: 'V es proporcional a n.' },
      { q: 'Si duplicas T (en K) con V y n constantes, P…', o: ['Baja a la mitad', 'Se duplica', 'No cambia', 'Se vuelve cero'], a: 1, e: 'P es proporcional a T.' },
      { q: 'Un gas ideal supone que sus partículas…', o: ['Se atraen mucho', 'Son muy grandes', 'No ocupan volumen y no se atraen', 'Están quietas'], a: 2, e: 'Es una simplificación del modelo.' },
      { q: '1 mol de gas a 300 K y 0,74 atm (Bogotá) ocupa…', o: ['24,6 L', '33,2 L', '18,2 L', '66,5 L'], a: 1, e: 'V = 1 × 0,082 × 300 ÷ 0,74 ≈ 33,2 L.' },
      { q: 'A igual temperatura, el mismo gas ocupa en Bogotá (0,74 atm) un volumen… que en Cartagena (1 atm)', o: ['Mayor', 'Menor', 'Igual', 'Nulo'], a: 0, e: 'A menor presión, mayor volumen.' },
      { q: '0,5 mol de gas en 12,3 L a 300 K. La presión es…', o: ['0,5 atm', '2 atm', '12,3 atm', '1 atm'], a: 3, e: 'P = 0,5 × 0,082 × 300 ÷ 12,3 = 1 atm.' },
      { q: 'Un gas real se aleja más del ideal cuando…', o: ['La presión es alta y la temperatura baja', 'La presión es baja y la temperatura alta', 'El recipiente es grande', 'Hay poco gas'], a: 0, e: 'Las partículas quedan cerca y lentas: se atraen.' } ] },
    { game: 'truefalse', title: '¿Mito o verdad del gas ideal?', time: 60, lives: 3, items: [
      { s: 'PV = nRT combina las leyes de Boyle, Charles y Gay-Lussac.', a: true, e: 'Es una sola ecuación con las cuatro variables.' },
      { s: 'En PV = nRT la temperatura se puede usar en °C.', a: false, e: 'Siempre en kelvin.' },
      { s: 'En un gas ideal las partículas se atraen fuertemente.', a: false, e: 'El modelo ideal supone que no se atraen.' },
      { s: 'Los gases reales se parecen al ideal a presión baja y temperatura alta.', a: true, e: 'Las partículas están lejos y rápidas.' },
      { s: 'Si metes más gas en un recipiente rígido a igual temperatura, la presión sube.', a: true, e: 'Más partículas, más choques contra las paredes.' },
      { s: 'El valor de R cambia según el gas que uses.', a: false, e: 'R es la misma constante para todos los gases ideales.' },
      { s: 'A igual P y T, un mol de H₂ y un mol de CO₂ ocupan casi el mismo volumen.', a: true, e: 'PV = nRT no depende de qué gas sea.' },
      { s: 'El vapor de agua a punto de condensarse se comporta como gas ideal.', a: false, e: 'Cerca de condensarse, las atracciones importan mucho.' },
      { s: 'Si P y n no cambian, al subir T el volumen baja.', a: false, e: 'Sube: V es proporcional a T.' },
      { s: 'En PV = nRT, n se mide en moles.', a: true, e: 'Es la cantidad de sustancia.' },
      { s: 'A igual temperatura, la misma cantidad de gas ocupa más volumen en Bogotá que en Cartagena.', a: true, e: 'En Bogotá la presión es menor (0,74 atm).' } ] },
  ],

  // Masa, peso y el mol
  g8u3l1: [
    { game: 'sorter', title: '¿Masa o peso?', bins: ['Masa', 'Peso'], time: 60, items: [
      ['Se mide en kilogramos', 0], ['Se mide en newtons', 1], ['Cambia en la Luna', 1], ['Es igual en la Luna', 0], ['Cantidad de materia', 0],
      ['Fuerza de la gravedad', 1], ['Es una fuerza', 1], ['Depende del planeta', 1], ['Es mayor en Júpiter', 1], ['No cambia en el espacio', 0],
      ['Una persona de 70 kg', 0], ['686 N en la Tierra', 1] ] },
    { game: 'order', title: 'Ordena moles y masas', time: 90, rounds: [
      { prompt: 'Ordena de menor a mayor masa molar (H = 1, C = 12, O = 16)', items: ['H₂', 'CH₄', 'H₂O', 'O₂', 'CO₂'] },
      { prompt: 'Ordena de menor a mayor número de partículas', items: ['Una docena de huevos', 'Un millón de granos de arroz', 'Medio mol de agua', 'Un mol de agua'] },
      { prompt: 'Ordena los pasos para contar las moléculas de una muestra de agua', items: ['Pesar la muestra en gramos', 'Calcular la masa molar (18 g/mol)', 'Dividir la masa entre la masa molar', 'Multiplicar los moles por 6,02 × 10²³'] },
      { prompt: 'Ordena de menor a mayor número de moles (H = 1, C = 12, O = 16)', items: ['9 g de H₂O', '16 g de CH₄', '88 g de CO₂', '54 g de H₂O'] },
      { prompt: 'Ordena de menor a mayor el peso de una persona de 50 kg', items: ['En la Luna', 'En Marte', 'En la Tierra', 'En Júpiter'] } ] },
  ],

  // Densidad de materiales
  g8u3l2: [
    { game: 'catcher', title: 'Atrapa lo que se hunde', rule: 'Atrapa solo lo que se hunde en agua', time: 45, lives: 3,
      good: ['Oro', 'Hierro', 'Plomo', 'Cobre', 'Piedra', 'Arena', 'Vidrio', 'Plata', 'Aluminio'],
      bad: ['Corcho', 'Icopor', 'Hielo', 'Aceite', 'Madera de pino', 'Balso', 'Cera de vela', 'Gasolina', 'Burbuja de aire'] },
    { game: 'order', title: 'La escalera de la densidad', time: 90, rounds: [
      { prompt: 'Ordena de menor a mayor densidad', items: ['Aire', 'Aceite', 'Agua', 'Aluminio', 'Hierro', 'Oro'] },
      { prompt: 'Ordena de arriba abajo lo que queda en un vaso con miel, agua, aceite y un corcho', items: ['Corcho', 'Aceite', 'Agua', 'Miel'] },
      { prompt: 'Ordena de menor a mayor masa (todos los bloques miden 10 cm³)', items: ['Madera de pino', 'Agua', 'Aluminio', 'Hierro', 'Oro'] },
      { prompt: 'Ordena los pasos para hallar la densidad de una piedra', items: ['Pesar la piedra en la balanza', 'Leer el volumen de agua en la probeta', 'Sumergir la piedra y leer el nuevo volumen', 'Restar los volúmenes', 'Calcular d = m ÷ V'] },
      { prompt: 'Ordena cómo separan el oro con la batea en el Chocó', items: ['Echar arena con oro en la batea', 'Agregar agua', 'Girar la batea', 'La arena liviana sale con el agua', 'El oro queda en el fondo'] } ] },
  ],
};
