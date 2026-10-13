// "¿Lo captaste?": una mini pregunta a mitad de "Aprende" en cada lección.
// Aparece después del paso `at` (0 = primer paso) y pregunta solo por lo que ya se vio. No da estrellas:
// sirve para recordar activamente antes de seguir. o = opciones (2 o 3), a = índice de la correcta, e = por qué.
export type Check = { at: number; q: string; o: string[]; a: number; e: string };

const VF = ['Verdadero', 'Falso'];

export const CHECKS: Record<string, Check> = {
  /* 6° */
  g6u1l1: { at: 1, q: '¿Cuál de estas cosas NO es materia?', o: ['El aire', 'La luz de una linterna', 'Una piedra'], a: 1, e: 'La luz es energía: no tiene masa ni ocupa espacio. El aire sí es materia, aunque no lo veamos.' },
  g6u1l2: { at: 1, q: 'La masa y el volumen sirven para saber si una sustancia es agua o alcohol.', o: VF, a: 1, e: 'Son propiedades generales: todo las tiene. Para identificar se usan propiedades específicas, como la densidad o el punto de ebullición.' },
  g6u1l3: { at: 1, q: 'Si calientas un trozo de hielo, sus partículas…', o: ['Se mueven más rápido', 'Se quedan quietas', 'Se vuelven más grandes'], a: 0, e: 'El calor acelera las partículas; por eso el hielo se funde y pasa a líquido.' },
  g6u2l1: { at: 1, q: 'El hierro (Fe) tiene un solo tipo de átomo. Entonces es…', o: ['Un elemento', 'Un compuesto', 'Una mezcla'], a: 0, e: 'Un elemento está formado por un solo tipo de átomo y aparece en la tabla periódica.' },
  g6u2l2: { at: 1, q: 'El aire es una mezcla homogénea.', o: VF, a: 0, e: 'Sus gases (nitrógeno, oxígeno y otros) no se distinguen a simple vista.' },
  g6u2l3: { at: 1, q: 'Para sacar la sal del agua de mar, ¿qué método usas?', o: ['Filtración', 'Evaporación', 'Imantación'], a: 1, e: 'La sal está disuelta, así que el filtro no la detiene. Al evaporar el agua, la sal queda.' },
  g6u3l1: { at: 1, q: 'Disolver azúcar en agua es un cambio…', o: ['Físico', 'Químico'], a: 0, e: 'El azúcar sigue siendo azúcar; si evaporas el agua, la recuperas. No se formó una sustancia nueva.' },
  g6u3l2: { at: 1, q: 'El bicarbonato con limón hace burbujas de…', o: ['Oxígeno', 'Dióxido de carbono', 'Vapor de agua'], a: 1, e: 'Es una reacción química que libera CO₂, el mismo gas que hace crecer las masas.' },
  /* 7° */
  g7u1l1: { at: 1, q: 'En el experimento de Rutherford casi todas las partículas atravesaron la lámina. ¿Qué concluyó?', o: ['El átomo es macizo', 'El átomo es casi todo vacío', 'El átomo no tiene carga'], a: 1, e: 'Si casi todo pasó derecho, casi todo es espacio vacío; las pocas que rebotaron chocaron con un núcleo pequeño y positivo.' },
  g7u1l2: { at: 1, q: 'Un átomo tiene 6 protones. ¿Qué elemento es?', o: ['Carbono', 'Oxígeno', 'Depende de sus neutrones'], a: 0, e: 'El número de protones (Z) define el elemento: Z = 6 siempre es carbono.' },
  g7u2l1: { at: 1, q: 'Los elementos de una misma columna (grupo) se parecen porque…', o: ['Tienen la misma masa', 'Tienen los mismos electrones externos', 'Fueron descubiertos juntos'], a: 1, e: 'Los electrones externos deciden cómo reacciona un elemento, por eso el grupo comparte propiedades.' },
  g7u2l2: { at: 1, q: 'Un material brilla, conduce la electricidad y se puede estirar en hilos. Es un…', o: ['Metal', 'No metal'], a: 0, e: 'Brillo, conductividad y ductilidad son propiedades típicas de los metales, como el cobre de los cables.' },
  g7u2l3: { at: 1, q: '¿Qué átomo es más grande: el sodio (periodo 3) o el litio (periodo 2), del mismo grupo?', o: ['Sodio', 'Litio'], a: 0, e: 'El radio aumenta hacia abajo porque cada periodo agrega un nivel de energía.' },
  g7u3l1: { at: 1, q: '¿Cuántos átomos de oxígeno hay en CO₂?', o: ['1', '2', '3'], a: 1, e: 'El subíndice 2 va con el O. El carbono no tiene número, así que hay 1.' },
  g7u3l2: { at: 1, q: 'Al calentar una sustancia, el movimiento de las partículas termina venciendo a…', o: ['Las fuerzas de atracción', 'La masa', 'El volumen'], a: 0, e: 'Cuando el movimiento supera la atracción entre partículas, la sustancia cambia de estado.' },
  /* 8° */
  g8u1l1: { at: 1, q: 'Al mezclar dos líquidos aparece un sólido que cae al fondo. Ese sólido se llama…', o: ['Precipitado', 'Solvente', 'Reactivo'], a: 0, e: 'Un precipitado es un sólido nuevo que se forma en la reacción: una evidencia de cambio químico.' },
  g8u1l2: { at: 1, q: 'Quemas papel en un frasco bien cerrado. La masa total del frasco…', o: ['Disminuye', 'Aumenta', 'Queda igual'], a: 2, e: 'Ley de Lavoisier: en un sistema cerrado los átomos no se crean ni se destruyen, solo se reorganizan.' },
  g8u1l3: { at: 1, q: 'Para balancear H₂ + O₂ → H₂O puedes cambiar H₂O por H₂O₂.', o: VF, a: 1, e: 'Nunca se cambian subíndices: H₂O₂ es agua oxigenada, otra sustancia. Solo se cambian los coeficientes.' },
  g8u2l1: { at: 1, q: 'Si las partículas de un gas chocan más veces por segundo contra las paredes, la presión…', o: ['Sube', 'Baja', 'No cambia'], a: 0, e: 'La presión es el efecto de los choques: más choques, más presión.' },
  g8u2l2: { at: 1, q: 'A temperatura constante, aplastas un globo hasta la mitad de su volumen. La presión dentro…', o: ['Se duplica', 'Se reduce a la mitad', 'No cambia'], a: 0, e: 'Ley de Boyle: P × V se mantiene, así que si V se divide entre 2, P se multiplica por 2.' },
  g8u2l3: { at: 0, q: 'En PV = nRT, ¿qué representa la n?', o: ['La cantidad de gas en moles', 'El número de recipientes', 'La temperatura en °C'], a: 0, e: 'n son los moles de gas; la temperatura va en kelvin y es la T.' },
  g8u3l1: { at: 1, q: 'Un astronauta viaja a la Luna. ¿Qué cambia?', o: ['Su masa', 'Su peso', 'Las dos'], a: 1, e: 'La masa es la cantidad de materia y no cambia. El peso depende de la gravedad, que en la Luna es menor.' },
  g8u3l2: { at: 1, q: 'Un anillo pesa 38,6 g y ocupa 2 cm³. ¿Qué densidad tiene?', o: ['19,3 g/cm³', '77,2 g/cm³', '36,6 g/cm³'], a: 0, e: 'd = m ÷ V = 38,6 ÷ 2 = 19,3 g/cm³: la densidad del oro.' },
  /* 9° */
  g9u1l1: { at: 1, q: 'En un tinto, ¿cuál es el solvente?', o: ['El café', 'El agua', 'El azúcar'], a: 1, e: 'El solvente es el componente en mayor cantidad: el agua. El café y el azúcar son solutos.' },
  g9u1l2: { at: 1, q: '5 g de sal en 100 g de solución es…', o: ['5 % m/m', '20 % m/m', '0,5 % m/m'], a: 0, e: '(5 ÷ 100) × 100 = 5 %.' },
  g9u1l3: { at: 1, q: '2 mol de soluto disueltos en 2 L de solución forman una solución…', o: ['1 M', '2 M', '4 M'], a: 0, e: 'M = moles ÷ litros = 2 ÷ 2 = 1 M.' },
  g9u2l1: { at: 1, q: 'Según Brønsted-Lowry, una base es la que…', o: ['Dona un H⁺', 'Acepta un H⁺', 'Libera electrones'], a: 1, e: 'El ácido dona el protón (H⁺) y la base lo acepta, aunque no tenga OH⁻, como el amoníaco.' },
  g9u2l2: { at: 1, q: 'Un jugo de pH 3 comparado con uno de pH 4 es…', o: ['10 veces más ácido', '1 vez más ácido', '100 veces más ácido'], a: 0, e: 'Cada unidad de pH es un factor de 10.' },
  g9u2l3: { at: 1, q: 'En una neutralización, el H⁺ del ácido y el OH⁻ de la base forman…', o: ['Agua', 'Oxígeno', 'Sal'], a: 0, e: 'H⁺ + OH⁻ → H₂O. Los iones que sobran forman la sal.' },
  g9u3l1: { at: 1, q: 'La lluvia ácida se forma principalmente por…', o: ['Óxidos de azufre y nitrógeno', 'Oxígeno puro', 'Vapor de agua solo'], a: 0, e: 'Esos óxidos, liberados al quemar combustibles fósiles, reaccionan con el agua y forman ácidos.' },
  g9u3l2: { at: 1, q: 'Un frasco tiene el pictograma de una llama. Significa que es…', o: ['Inflamable', 'Corrosivo', 'Tóxico'], a: 0, e: 'La llama indica inflamable: debe estar lejos del fuego y de fuentes de calor.' },
  /* 10° */
  g10u1l1: { at: 1, q: 'Según el orden de llenado, ¿qué subnivel se llena justo después de 3p?', o: ['3d', '4s', '4p'], a: 1, e: 'Por la regla de las diagonales, 4s tiene menos energía que 3d: 1s 2s 2p 3s 3p 4s 3d…' },
  g10u1l2: { at: 1, q: 'El nitrógeno tiene 3 electrones en 2p. Según Hund, quedan…', o: ['Uno en cada orbital p', 'Dos juntos y uno solo', 'Los tres en un orbital'], a: 0, e: 'Primero ocupan orbitales vacíos, uno en cada uno, antes de aparearse. Además, un orbital admite máximo 2.' },
  g10u1l3: { at: 1, q: 'El carbono-14 tiene 6 protones y 8 neutrones. Es…', o: ['Otro elemento', 'Un isótopo del carbono', 'Un ion del carbono'], a: 1, e: 'Mismo número de protones (6), distinto número de neutrones: isótopo del mismo elemento.' },
  g10u2l1: { at: 1, q: 'En una estructura de Lewis, un par de electrones compartido entre dos átomos representa…', o: ['Un enlace', 'Un par libre', 'Un ion'], a: 0, e: 'Cada par compartido es un enlace; los pares que no se comparten son pares libres.' },
  g10u2l2: { at: 1, q: 'Dos átomos tienen ΔEN = 0,9. ¿Qué enlace forman?', o: ['Iónico', 'Covalente polar', 'Covalente apolar'], a: 1, e: 'Entre 0,4 y 1,7 los electrones se comparten de forma desigual: covalente polar.' },
  g10u2l3: { at: 1, q: 'El NH₃ tiene tres enlaces y un par libre. Su geometría es…', o: ['Tetraédrica', 'Piramidal', 'Lineal'], a: 1, e: 'El par libre empuja los enlaces hacia abajo: piramidal, de unos 107°.' },
  g10u3l1: { at: 1, q: 'El MgO se forma con un metal y oxígeno. Es un óxido…', o: ['Básico', 'Ácido'], a: 0, e: 'Metal + oxígeno → óxido básico. No metal + oxígeno → óxido ácido.' },
  g10u3l2: { at: 1, q: 'El H₂CO₃ tiene H, un no metal y O. Es un…', o: ['Hidróxido', 'Oxácido', 'Hidrácido'], a: 1, e: 'Los oxácidos tienen hidrógeno, un no metal y oxígeno. Los hidróxidos tienen el grupo OH con un metal.' },
  g10u3l3: { at: 1, q: 'Una sal que viene de un hidrácido termina en…', o: ['-uro', '-ato', '-ito'], a: 0, e: 'Las sales haloideas terminan en -uro, como el cloruro de sodio (NaCl).' },
  g10u4l1: { at: 1, q: 'En una reacción redox, la especie que pierde electrones se…', o: ['Oxida', 'Reduce'], a: 0, e: 'Oxidarse es perder electrones; reducirse es ganarlos.' },
  g10u4l2: { at: 1, q: '36 g de agua (masa molar 18 g/mol) son…', o: ['2 mol', '0,5 mol', '18 mol'], a: 0, e: 'moles = masa ÷ masa molar = 36 ÷ 18 = 2 mol.' },
  g10u4l3: { at: 1, q: 'En CH₄ + 2 O₂ → CO₂ + 2 H₂O, ¿cuántos moles de O₂ necesitas para 3 mol de CH₄?', o: ['3 mol', '6 mol', '2 mol'], a: 1, e: 'La proporción es 1 : 2, así que 3 mol de CH₄ necesitan 6 mol de O₂.' },
  /* 11° */
  g11u1l1: { at: 1, q: 'Un catalizador acelera una reacción porque…', o: ['Baja la energía de activación', 'Se consume en la reacción', 'Sube la temperatura'], a: 0, e: 'El catalizador ofrece un camino con menos energía de activación y no se consume.' },
  g11u1l2: { at: 1, q: 'Cuando una reacción llega al equilibrio, la reacción se detiene.', o: VF, a: 1, e: 'Sigue ocurriendo en ambos sentidos a la misma velocidad; por eso las concentraciones dejan de cambiar.' },
  g11u2l1: { at: 1, q: 'Un carbono con un doble enlace tiene hibridación…', o: ['sp³', 'sp²', 'sp'], a: 1, e: 'Doble enlace: sp², trigonal plano de 120°. Triple enlace: sp. Solo enlaces sencillos: sp³.' },
  g11u2l2: { at: 1, q: '¿Cuántos carbonos tiene el propeno?', o: ['2', '3', '4'], a: 1, e: 'Prop- indica 3 carbonos, y la terminación -eno indica un doble enlace.' },
  g11u2l3: { at: 1, q: 'El butano y el isobutano son isómeros de…', o: ['Cadena', 'Posición', 'Función'], a: 0, e: 'Ambos son C₄H₁₀: uno es lineal y el otro ramificado. Cambia la forma de la cadena.' },
  g11u3l1: { at: 1, q: 'Los alcoholes pequeños se disuelven en agua gracias a…', o: ['Los puentes de hidrógeno del –OH', 'Su color', 'Que son muy pesados'], a: 0, e: 'El grupo –OH forma puentes de hidrógeno con el agua.' },
  g11u3l2: { at: 0, q: 'En una cetona, el grupo C=O está…', o: ['Al final de la cadena', 'En medio de la cadena'], a: 1, e: 'En las cetonas el carbonilo está en medio (-ona); en los aldehídos está al final (-al).' },
  g11u3l3: { at: 1, q: 'Un ácido y un alcohol reaccionan y forman un éster y…', o: ['Agua', 'Oxígeno', 'Una amina'], a: 0, e: 'Ácido + alcohol → éster + agua. Los ésteres dan olor a las frutas.' },
  g11u4l1: { at: 1, q: 'Los aceites y las grasas son…', o: ['Lípidos', 'Proteínas', 'Carbohidratos'], a: 0, e: 'Los lípidos guardan energía y forman las membranas de las células.' },
  g11u4l2: { at: 1, q: 'El almidón y la celulosa son polímeros…', o: ['Naturales', 'Sintéticos'], a: 0, e: 'Los producen los seres vivos. El PET, el PVC y el nailon son sintéticos.' },
  g11u4l3: { at: 1, q: 'Si a una estufa de gas le falta oxígeno, produce…', o: ['Monóxido de carbono', 'Solo agua', 'Más oxígeno'], a: 0, e: 'La combustión incompleta produce CO, un gas muy tóxico. Por eso las cocinas deben estar ventiladas.' },
};
