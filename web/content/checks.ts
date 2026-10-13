// "¿Lo captaste?": una mini pregunta a mitad de "Aprende" en cada lección.
// Aparece después del paso `at` (0 = primer paso) y pregunta solo por lo que ya se vio. No da estrellas:
// sirve para recordar activamente antes de seguir. o = opciones (2 o 3), a = índice de la correcta, e = por qué.
export type Check = { at: number; q: string; o: string[]; a: number; e: string };

const VF = ['Verdadero', 'Falso'];

export const CHECKS: Record<string, Check> = {
  /* 6° */
  g6u1l1: { at: 3, q: '¿El aire es materia?', o: ['Sí: pesa algo y ocupa un lugar', 'No: porque no se ve'], a: 0, e: 'Aunque no lo veas, el aire pesa y ocupa lugar: por eso infla un balón y lo hace pesar un poquito más.' },
  g6u1l2: { at: 1, q: 'La masa sirve para saber si un líquido es agua o alcohol.', o: VF, a: 1, e: 'Todo tiene masa, así que no te dice qué sustancia es. Para eso sirven las propiedades específicas, como el olor o la densidad.' },
  g6u1l3: { at: 2, q: '¿En qué estado las partículas están juntas, pero se deslizan unas sobre otras?', o: ['Sólido', 'Líquido', 'Gas'], a: 1, e: 'En el líquido se deslizan, como la gente en un bus lleno. Por eso el agua toma la forma del vaso.' },
  g6u2l1: { at: 1, q: 'El hierro (Fe) tiene un solo tipo de átomo. Entonces es…', o: ['Un elemento', 'Un compuesto', 'Una mezcla'], a: 0, e: 'Un solo tipo de átomo es un elemento. Por eso el hierro está en la tabla periódica.' },
  g6u2l2: { at: 2, q: 'El aire es una mezcla homogénea.', o: VF, a: 0, e: 'Tiene varios gases, pero no los distingues a simple vista: todo se ve igual.' },
  g6u2l3: { at: 4, q: 'Para sacar la sal del agua de mar, ¿qué método usas?', o: ['Filtración', 'Evaporación', 'Imantación'], a: 1, e: 'La sal está disuelta y pasa por el filtro. Si el agua se evapora, la sal se queda.' },
  g6u3l1: { at: 1, q: 'Disolver azúcar en agua es un cambio…', o: ['Físico', 'Químico'], a: 0, e: 'El azúcar sigue siendo azúcar: si evaporas el agua, lo recuperas. No apareció nada nuevo.' },
  g6u3l2: { at: 1, q: 'Dorar la arepa en el budare es un cambio…', o: ['Físico', 'Químico'], a: 1, e: 'Cambian el color, el olor y el sabor: se formaron sustancias nuevas.' },
  /* 7° */
  g7u1l1: { at: 4, q: 'Casi todas las balitas de Rutherford atravesaron la lámina de oro. ¿Qué concluyó?', o: ['El átomo es macizo', 'El átomo es casi todo vacío', 'El átomo no tiene carga'], a: 1, e: 'Si casi todo pasó derecho, casi todo es espacio vacío; las pocas que rebotaron chocaron con un núcleo pequeño y positivo.' },
  g7u1l2: { at: 2, q: 'Un átomo tiene 6 protones. ¿Qué elemento es?', o: ['Carbono', 'Oxígeno', 'Depende de sus neutrones'], a: 0, e: 'El número de protones (Z) define el elemento: Z = 6 siempre es carbono.' },
  g7u2l1: { at: 3, q: 'Los elementos de una misma columna (grupo) se parecen porque…', o: ['Tienen la misma masa', 'Tienen los mismos electrones externos', 'Fueron descubiertos juntos'], a: 1, e: 'Los electrones externos (los del último piso) deciden cómo se comporta un elemento. Por eso la familia se parece.' },
  g7u2l2: { at: 1, q: 'Un material brilla, conduce la electricidad y se puede estirar en hilos. Es un…', o: ['Metal', 'No metal'], a: 0, e: 'Brillar, conducir y estirarse en hilos son propiedades de los metales, como el cobre de los cables.' },
  g7u2l3: { at: 2, q: '¿Qué átomo es más grande: el sodio (periodo 3) o el litio (periodo 2), del mismo grupo?', o: ['Sodio', 'Litio'], a: 0, e: 'Bajando por un grupo el átomo crece, porque cada fila agrega un piso de electrones.' },
  g7u3l1: { at: 2, q: '¿Cuántos átomos de oxígeno hay en CO₂?', o: ['1', '2', '3'], a: 1, e: 'El subíndice 2 va con el O. El carbono no tiene número, así que hay 1.' },
  g7u3l2: { at: 3, q: 'Al calentar una sustancia, el movimiento de las partículas termina venciendo a…', o: ['Las fuerzas de atracción', 'La masa', 'El volumen'], a: 0, e: 'Cuando el movimiento supera la atracción entre partículas, la sustancia cambia de estado.' },
  /* 8° */
  g8u1l1: { at: 4, q: 'Al mezclar dos líquidos aparece un sólido que cae al fondo. Ese sólido se llama…', o: ['Precipitado', 'Solvente', 'Reactivo'], a: 0, e: 'Un precipitado es un sólido nuevo que se forma en la reacción: una evidencia de cambio químico.' },
  g8u1l2: { at: 3, q: 'Quemas papel en un frasco bien cerrado. La masa total del frasco…', o: ['Disminuye', 'Aumenta', 'Queda igual'], a: 2, e: 'Como vio Lavoisier: el frasco está cerrado, nada entra ni sale. Los átomos solo cambian de pareja, así que la masa queda igual.' },
  g8u1l3: { at: 2, q: 'Para balancear H₂ + O₂ → H₂O puedes cambiar H₂O por H₂O₂.', o: VF, a: 1, e: 'Nunca se cambian subíndices: H₂O₂ es agua oxigenada, otra sustancia. Solo se cambian los coeficientes.' },
  g8u2l1: { at: 2, q: 'Si las partículas de un gas chocan más veces por segundo contra las paredes, la presión…', o: ['Sube', 'Baja', 'No cambia'], a: 0, e: 'La presión es el efecto de los choques: más choques, más presión.' },
  g8u2l2: { at: 1, q: 'A temperatura constante, aplastas un globo hasta la mitad de su volumen. La presión dentro…', o: ['Se duplica', 'Se reduce a la mitad', 'No cambia'], a: 0, e: 'Ley de Boyle: P × V se mantiene, así que si V se divide entre 2, P se multiplica por 2.' },
  g8u2l3: { at: 1, q: 'En PV = nRT, ¿qué representa la n?', o: ['La cantidad de gas en moles', 'El número de recipientes', 'La temperatura en °C'], a: 0, e: 'n es cuánto gas hay, contado en moles. La temperatura es la T y va en kelvin.' },
  g8u3l1: { at: 1, q: 'Un astronauta viaja a la Luna. ¿Qué cambia?', o: ['Su masa', 'Su peso', 'Las dos'], a: 1, e: 'La masa es la cantidad de materia y no cambia. El peso depende de la gravedad, que en la Luna es menor.' },
  g8u3l2: { at: 1, q: 'Un anillo tiene una masa de 38,6 g y ocupa 2 cm³. ¿Qué densidad tiene?', o: ['19,3 g/cm³', '77,2 g/cm³', '36,6 g/cm³'], a: 0, e: 'd = m ÷ V = 38,6 ÷ 2 = 19,3 g/cm³: la densidad del oro.' },
  /* 9° */
  g9u1l1: { at: 1, q: 'En un tinto, ¿cuál es el solvente?', o: ['El café', 'El agua', 'El azúcar'], a: 1, e: 'El solvente es el componente en mayor cantidad: el agua. El café y el azúcar son solutos.' },
  g9u1l2: { at: 2, q: '5 g de sal en 100 g de solución es…', o: ['5 % m/m', '20 % m/m', '0,5 % m/m'], a: 0, e: '(5 ÷ 100) × 100 = 5 %: hay 5 g de sal en cada 100 g de solución.' },
  g9u1l3: { at: 2, q: '2 mol de sal disueltos en 2 L de solución forman una solución…', o: ['1 M', '2 M', '4 M'], a: 0, e: 'M = moles ÷ litros = 2 ÷ 2 = 1 M: un mol en cada litro.' },
  g9u2l1: { at: 5, q: 'Según Brønsted-Lowry, una base es la que…', o: ['Pasa un H⁺', 'Recibe un H⁺', 'Suelta electrones'], a: 1, e: 'Como en un pase de fútbol: el ácido pasa el H⁺ y la base lo recibe, aunque no tenga OH⁻.' },
  g9u2l2: { at: 3, q: 'Un jugo de pH 3 comparado con uno de pH 4 es…', o: ['10 veces más ácido', '1 vez más ácido', '100 veces más ácido'], a: 0, e: 'Hay 1 punto de diferencia, y cada punto de pH vale × 10.' },
  g9u2l3: { at: 2, q: 'En una neutralización, el H⁺ del ácido y el OH⁻ de la base forman…', o: ['Agua', 'Oxígeno', 'Sal'], a: 0, e: 'H⁺ + OH⁻ → H₂O. Los iones que sobran forman la sal.' },
  g9u3l1: { at: 1, q: 'El CO₂ calienta el planeta porque…', o: ['Atrapa el calor, como una cobija', 'Tapa la luz del sol', 'Enfría las nubes'], a: 0, e: 'Deja entrar la luz del sol pero no deja salir el calor: eso es el efecto invernadero.' },
  g9u3l2: { at: 3, q: 'Un frasco tiene el pictograma de una llama. Significa que es…', o: ['Inflamable', 'Corrosivo', 'Tóxico'], a: 0, e: 'La llama indica inflamable: arde fácil. Debe estar lejos del fuego y del calor.' },
  /* 10° */
  g10u1l1: { at: 3, q: 'Un átomo tiene 4 electrones. ¿A qué apartamento va el cuarto?', o: ['1s', '2s', '2p'], a: 1, e: 'En 1s caben 2. Los otros 2 van al siguiente: 2s. Queda 1s² 2s².' },
  g10u1l2: { at: 3, q: 'El carbono tiene 2 electrones en el 2p, que tiene 3 orbitales vacíos. Según Hund, quedan…', o: ['Cada uno en un orbital distinto', 'Los dos juntos en el mismo orbital'], a: 0, e: 'Como en el bus: mientras haya orbitales vacíos, cada electrón ocupa uno solo. Se juntan solo cuando ya no hay vacíos.' },
  g10u1l3: { at: 1, q: 'El carbono-14 tiene 6 protones y 8 neutrones. Es…', o: ['Otro elemento', 'Un isótopo del carbono'], a: 1, e: 'Tiene 6 protones, así que sigue siendo carbono. Solo cambian los neutrones: es un isótopo.' },
  g10u2l1: { at: 4, q: 'En una estructura de Lewis, un par de electrones compartido entre dos átomos representa…', o: ['Un enlace', 'Un par libre', 'Un ion'], a: 0, e: 'Cada par compartido es un enlace; los pares que no se comparten son pares libres.' },
  g10u2l2: { at: 4, q: 'Dos átomos tienen ΔEN = 0,9. ¿Qué enlace forman?', o: ['Iónico', 'Covalente polar', 'Covalente apolar'], a: 1, e: '0,9 está entre 0,4 y 1,7: comparten los electrones, pero el más fuerte los acerca a su lado. Covalente polar.' },
  g10u2l3: { at: 5, q: 'Una molécula tiene 4 pares alrededor del átomo central: 3 enlaces y 1 par libre. Su geometría es…', o: ['Tetraédrica', 'Piramidal', 'Lineal'], a: 1, e: 'El par libre no se ve y empuja a los 3 enlaces hacia abajo, como un trípode: piramidal, como el NH₃.' },
  g10u3l1: { at: 3, q: 'El magnesio es un metal. El MgO es un óxido…', o: ['Básico', 'Ácido'], a: 0, e: 'Metal + oxígeno → óxido básico. No metal + oxígeno → óxido ácido.' },
  g10u3l2: { at: 4, q: 'El H₂CO₃ tiene H adelante, un no metal (C) y O. Es un…', o: ['Hidróxido', 'Oxácido', 'Hidrácido'], a: 1, e: 'H + no metal + O es un oxácido. Un hidróxido tendría un metal con OH.' },
  g10u3l3: { at: 2, q: 'Una sal que viene de un ácido sin oxígeno (hidrácido) termina en…', o: ['-uro', '-ato', '-ito'], a: 0, e: 'Es una sal haloidea: termina en -uro, como el cloruro de sodio (NaCl).' },
  g10u4l1: { at: 6, q: 'En una reacción redox, la especie que pierde electrones se…', o: ['Oxida', 'Reduce'], a: 0, e: 'Oxidarse es perder electrones; reducirse es ganarlos.' },
  g10u4l2: { at: 5, q: '36 g de agua (masa molar 18 g/mol) son…', o: ['2 mol', '0,5 mol', '18 mol'], a: 0, e: 'moles = masa ÷ masa molar = 36 ÷ 18 = 2 mol.' },
  g10u4l3: { at: 1, q: 'En CH₄ + 2 O₂ → CO₂ + 2 H₂O, ¿cuántos moles de O₂ necesitas para 3 mol de CH₄?', o: ['3 mol', '6 mol', '2 mol'], a: 1, e: 'La proporción es 1 : 2, así que 3 mol de CH₄ necesitan 6 mol de O₂.' },
  /* 11° */
  g11u1l1: { at: 2, q: 'La leche se daña más rápido fuera de la nevera porque, con más temperatura, las partículas…', o: ['Chocan más seguido y con más fuerza', 'Se quedan quietas', 'Se vuelven más grandes'], a: 0, e: 'El calor las mueve más rápido: hay más choques y más de ellos superan la energía de activación.' },
  g11u1l2: { at: 1, q: 'Cuando una reacción llega al equilibrio, la reacción se detiene.', o: VF, a: 1, e: 'Sigue ocurriendo en ambos sentidos a la misma velocidad; por eso las concentraciones dejan de cambiar.' },
  g11u2l1: { at: 4, q: 'Un carbono con un doble enlace tiene hibridación…', o: ['sp³', 'sp²', 'sp'], a: 1, e: 'Doble enlace: sp², trigonal plano de 120°. Triple enlace: sp. Solo enlaces sencillos: sp³.' },
  g11u2l2: { at: 3, q: '¿Cuántos carbonos tiene el propeno?', o: ['2', '3', '4'], a: 1, e: 'Prop- indica 3 carbonos, y la terminación -eno indica un doble enlace.' },
  g11u2l3: { at: 2, q: 'El butano y el isobutano son isómeros de…', o: ['Cadena', 'Posición', 'Función'], a: 0, e: 'Ambos son C₄H₁₀: uno es lineal y el otro ramificado. Cambia la forma de la cadena.' },
  g11u3l1: { at: 2, q: 'Los alcoholes pequeños se mezclan con el agua gracias a…', o: ['Los puentes de hidrógeno del –OH', 'Su color', 'Que son muy pesados'], a: 0, e: 'El –OH se parece al agua: el H de una molécula atrae al O de la otra.' },
  g11u3l2: { at: 2, q: 'En una cetona, el grupo C=O está…', o: ['Al final de la cadena', 'En medio de la cadena'], a: 1, e: 'En las cetonas el carbonilo está en medio (-ona); en los aldehídos está al final (-al).' },
  g11u3l3: { at: 1, q: 'Un ácido y un alcohol reaccionan y forman un éster y…', o: ['Agua', 'Oxígeno', 'Una amina'], a: 0, e: 'Ácido + alcohol → éster + agua. Los ésteres dan olor a las frutas.' },
  g11u4l1: { at: 2, q: 'Los aceites y las grasas son…', o: ['Lípidos', 'Proteínas', 'Carbohidratos'], a: 0, e: 'Los lípidos son la bodega de energía y forman la membrana de las células.' },
  g11u4l2: { at: 3, q: 'El almidón y la celulosa son polímeros…', o: ['Naturales', 'Sintéticos'], a: 0, e: 'Los fabrican los seres vivos: la papa y las plantas.' },
  g11u4l3: { at: 3, q: 'Si a una estufa de gas le falta oxígeno, produce…', o: ['Monóxido de carbono', 'Solo agua', 'Más oxígeno'], a: 0, e: 'La combustión incompleta produce CO, un gas muy tóxico. Por eso las cocinas deben estar ventiladas.' },
};
