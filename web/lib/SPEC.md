# Escenas de "Aprende" y minijuegos: contrato

Proyecto: QuimicaLearn, plataforma de química para colegios de Colombia (grados 6° a 11°). Todo el texto visible va en **español de Colombia**, con tildes correctas. Público: estudiantes de 11 a 17 años; se proyecta en video beam y se usa en celulares de gama baja.

## Reglas comunes

- JavaScript puro (ES2019), módulos ES. Nada de React aquí. Sin dependencias nuevas salvo `three` (ya instalado, v0.180).
- Importa utilidades de `../widgets.js`: `THREE, esc, fmt, shuffle, reduce, EL, ELZ, CAT, PT, GROUP, parseF, fH, molarOf, M, nid, canvasStage, loop, three, buildMol`.
  - `three(stageEl, onDrag)` crea renderer, cámara, luces, rotación con arrastre y zoom, y devuelve `o = {R, scene, cam, root, rot, zoom, auto, tick, clear(), label(obj, texto), dispose()}`. `o.tick = dt => {...}` se llama cada cuadro. Todo lo que agregues va en `o.root`. Devuelve `null` si no hay WebGL: en ese caso muestra un texto alterno (la clase `.nogl` ya existe).
  - `buildMol(o, M[clave], mostrarParesLibres)` dibuja una molécula de la biblioteca `M` (claves: H2 O2 N2 HCl H2O CO2 NH3 BF3 CH4 NaCl C2H6 C3H8 C2H4 C2H2 C6H6 CH3OH C2H5OH H2CO C3H6O CH3COOH CH3NH2). Formato: `{n, f, g, ang, pol, a:[[símbolo,x,y,z]...], b:[[i,j,orden]...], lp:[[i,x,y,z]...]}`. Puedes agregar moléculas nuevas registrándolas en `M` (es un objeto mutable) desde tu archivo.
  - `EL['Na']` = `{z, sym, name, cat, en, rad, m, css, hex, r3}` para Z 1 a 36. `canvasStage(parent, altura)` crea un lienzo 2D con `{st, ctx, W, H, off()}`. `loop(fn(dt))` devuelve la función para detenerlo. `reduce` = el usuario prefiere menos movimiento (anima menos o nada).
- CSS: usa las clases que ya existen en `web/app/globals.css` (`.stage`, `.lab`, `.hint`, `.nogl`, `.btn`, `.btn.ghost`, `.chip`, `.pill`, `.row`, `.w`, `.fb ok|no|info`, `.mono`, `.legend`, `.dot`, `.readout`, `.bar`, `.stepper`, variables `--accent --gold --ok --bad --ink --muted --line --surface --surface2 --bg`). Si necesitas estilos nuevos, escríbelos en tu propio archivo `web/styles/<tu-grupo>.css` (no edites globals.css; otras personas trabajan en paralelo), con prefijo propio (`.sc-…` escenas, `.gm-…` juegos). Deben verse bien en modo claro y oscuro (usa las variables). El fondo del `.stage` es oscuro siempre.
- Móvil: ancho mínimo 360 px, sin scroll horizontal, objetivos táctiles de al menos 40 px. Todo lo táctil debe funcionar también con mouse y teclado cuando sea razonable.
- Limpieza: `dispose()` detiene animaciones, quita listeners de `window`/`document` y libera three (`o.dispose()`).
- Rendimiento: menos de ~300 mallas por escena; reutiliza geometrías y materiales; `SphereGeometry(r, 20, 14)` basta.
- Calidad visual: esto es lo que va a ver un rector en una entrevista de trabajo. Colores de elementos de `EL[x].css/hex`, movimiento suave (interpolación entre estados, no saltos), etiquetas cortas con `o.label`. Nada de texto largo dentro de la escena: la explicación la pone el anfitrión debajo.

## Escenas (`web/lib/scenes/<tipo>.js`)

`export default function (el) { ...; return { set(state, prev), dispose() } }`

`el` es un div vacío. Crea dentro un `div.stage.sc-stage` (alto 340 px, 280 px en pantallas < 560 px) y, si hace falta, una fila de leyenda o controles debajo. `set(state, prev)` se llama al montar (prev = null) y cada vez que el estudiante cambia de paso; debe **animar la transición** de prev a state. Campos desconocidos se ignoran. Todos los campos son opcionales salvo `type`; usa valores por defecto razonables.

### 3D grupo A
- **particles**: caja de vidrio 3D con partículas en movimiento.
  `{phase:'solid'|'liquid'|'gas', temp:0..1 (rapidez), vol:0.35..1 (altura del émbolo; <1 muestra un émbolo que baja), species:[{f:'H2O'|'O2'|'He'|'Na'|…, n:12, label?:'Agua'}], layout:'mixed'|'layers'|'dissolve', dissolve:0..1, lid:true|false, empty:false, pressure:false}`
  - `f` que exista en `M` → mini molécula 3D (escala pequeña) girando; si es un símbolo de `EL` → esfera de ese color.
  - solid: red ordenada que vibra; liquid: partículas juntas en el fondo que se deslizan; gas: rebotan en toda la caja. Transición animada al cambiar de fase.
  - `layers`: cada especie en su franja (mezcla heterogénea, ej. agua y aceite). `mixed`: todas revueltas. `dissolve`: la primera especie (soluto) empieza como un cristal en el fondo y se reparte según `dissolve` (0 = cristal, 1 = disuelta del todo).
  - `pressure:true`: destellos pequeños donde las partículas chocan con las paredes y un medidor (texto) de choques por segundo.
  - `empty:true`: caja vacía (para "la luz y el sonido no son materia").
- **atom**: átomo 3D.
  `{Z:6, N:6, E:6, model:'dalton'|'thomson'|'rutherford'|'bohr'|'cloud', focus:null|'nucleus'|'valence'|'shells', fission:false, show:true (panel con p⁺ n⁰ e⁻ y símbolo)}`
  - bohr: núcleo con protones (rojo) y neutrones (gris) agrupados, capas 2-8-8-18 como anillos con electrones orbitando. dalton: esfera maciza. thomson: esfera rosada con electrones incrustados. rutherford: núcleo diminuto y electrones en órbitas elípticas al azar, con rayos alfa que atraviesan y alguno rebota. cloud: nube de puntos (orbital) alrededor del núcleo.
  - focus: resalta esa parte (brillo) y atenúa el resto. `valence` resalta la última capa.
  - Si E ≠ Z muestra la carga del ion (ej. Na⁺, Cl⁻). Si cambias N, es un isótopo: muestra "Carbono-14".
  - `fission:true`: un neutrón llega, el núcleo grande se deforma y se parte en dos más pequeños liberando 2-3 neutrones y un destello; en bucle.
- **orbital**: formas de orbitales 3D.
  `{show:['1s','2s','2p'], Z:null|8, hund:false}`
  - s = esfera translúcida, p = tres pares de lóbulos (px, py, pz) en colores distintos, d = forma de trébol (basta con 2 de los 5). Con `Z`, además un diagrama de cajas (HTML debajo del stage) lleno con flechas ↑↓ según Aufbau; `hund:true` anima el llenado caja por caja mostrando que primero van desapareados.
- **column**: probeta 3D con capas de líquidos y objetos que flotan o se hunden.
  `{layers:[{n:'Miel', d:1.42, c:'#C98A1B'}...], objs:[{n:'Corcho', d:0.24, c:'#B08050'}...], drop:true}`
  - Capas ordenadas por densidad (la más densa abajo). Cada objeto cae (si `drop`) y se detiene en la capa cuya densidad supera la suya. Etiquetas con nombre y densidad (g/cm³, coma decimal).

### 3D grupo B
- **mol**: molécula 3D (usa `buildMol`).
  `{mol:'H2O', lp:false, pair:null|'CO2', dipole:false, highlight:null|'OH'|'COOH'|'CO'|'NH2'|'C=C'|'C#C'}`
  - `pair`: dos moléculas lado a lado para comparar. `dipole`: flecha de dipolo y nubes δ+ δ−. `highlight`: resalta el grupo funcional (halo) y atenúa lo demás.
  - Agrega a `M` las que falten: C4H10 (butano), iC4H10 (isobutano), NaOH (par iónico), HCOOH, CH3COOC2H5 (acetato de etilo), CH3CHO (etanal), C6H12O6 (glucosa en anillo, aproximada), O3, SO2, NO2, H2SO4, CaO (par iónico), C8H18 no hace falta.
- **lattice**: estructura de enlace.
  `{kind:'ionic'|'metal'|'covalent'|'transfer'|'hbond'}`
  - ionic: red NaCl 3×3×3 con Na⁺ pequeño y Cl⁻ grande. metal: iones positivos en red con "mar de electrones" (puntos que se mueven libres). covalent: red de diamante o grafito. transfer: un Na y un Cl separados; el electrón de valencia del Na viaja al Cl y quedan Na⁺ y Cl⁻ que se atraen (en bucle con pausa). hbond: varias moléculas de agua con líneas punteadas de puente de hidrógeno.
- **reaction**: los átomos se reorganizan de reactivos a productos.
  `{r:[[1,'CH4'],[2,'O2']], p:[[1,'CO2'],[2,'H2O']], mode:'loop'|'collide'|'reversible', count:true, speed:1, temp:0.5}`
  - Coloca las moléculas de reactivos a la izquierda; se acercan, los enlaces se rompen (se desvanecen), cada átomo viaja a su posición en una molécula de producto a la derecha y aparecen los nuevos enlaces. Los átomos se conservan uno a uno (misma esfera, mismo color): esa es la idea pedagógica. Pausa y repite.
  - `count:true`: debajo, conteo de átomos por elemento "Antes | Después" que coincide.
  - `collide`: muchas moléculas pequeñas moviéndose; solo los choques con suficiente energía (depende de `temp`) producen reacción; contador de choques efectivos.
  - `reversible`: va y vuelve (equilibrio) con productos y reactivos coexistiendo.
  - Si la ecuación no está balanceada, muestra en rojo qué elemento sobra o falta en vez de animar.
- **chain**: macromoléculas.
  `{kind:'polyethylene'|'starch'|'protein'|'dna'|'lipid'|'pvc', grow:true, n:12}`
  - polyethylene: monómeros de eteno que se unen uno a uno formando una cadena en zigzag. starch: anillos de glucosa (hexágonos) encadenados. protein: cuentas de colores (aminoácidos) que se pliegan en hélice. dna: doble hélice girando con pares de bases de 4 colores. lipid: triglicérido (glicerol + 3 colas en zigzag).

### 2D (canvas o SVG)
- **ptable**: tabla periódica Z 1-36 (usa `PT`, `CAT`, `EL`).
  `{hl:'none'|'groups'|'periods'|'cats'|'metals'|'radius'|'en'|'valence', groups:[1,17], periods:[3], els:['Na','Cl'], arrow:true}`
  - `cats`: colores por categoría con leyenda. `metals`: metales / no metales / metaloides y la "escalera". `radius`/`en`: mapa de calor más una flecha grande que indica hacia dónde aumenta. `groups`/`periods`: resalta esas columnas o filas y atenúa el resto. `els`: pulsa esas casillas. Tocar una casilla muestra un recuadro con nombre, Z, masa y categoría.
- **lab**: ilustraciones animadas de laboratorio y de la vida diaria (SVG con animación). `{kind: ...}`:
  `filtration` (embudo, papel filtro, arena queda arriba, agua cae gota a gota), `decantation` (agua y aceite en embudo de decantación, se abre la llave), `evaporation` (agua salada en cápsula sobre mechero, se evapora y quedan cristales), `distillation` (balón, termómetro, refrigerante, gotas al otro lado), `magnet` (imán separa limaduras de hierro de arena), `sieve` (tamizado), `greenhouse` (Tierra, Sol, rayos que entran y el calor que rebota en una capa de CO₂), `smog` (ciudad tipo Bogotá con carros, humo y partículas PM2,5 que llegan a unos pulmones), `pictograms` (los pictogramas SGA en rombos rojos: inflamable, corrosivo, tóxico, irritante, peligro ambiental, comburente; tocar uno muestra qué significa), `refinery` (torre de destilación fraccionada con fracciones: gas, gasolina, queroseno, diésel, lubricantes, asfalto, y temperaturas), `kitchen` (arepa dorándose, olla con vapor, bicarbonato + vinagre burbujeando: marca con etiqueta "físico" o "químico"), `evidence` (4 viñetas animadas de evidencias de reacción: cambio de color, gas, precipitado, luz y calor), `scale` (balanza de platillos: reactivos en un plato, productos en el otro, queda nivelada: Lavoisier), `indicator` (tubos de ensayo con extracto de repollo morado de rojo a verde-amarillo según pH), `antacid` (estómago con exceso de ácido y antiácido que lo neutraliza), `fermentation` (levadura, azúcar, burbujas de CO₂ y etanol), `plastic` (línea de tiempo de degradación: papel 1 mes, bolsa 150 años, botella 450 años).
  `step:0..n` opcional para variantes dentro de la misma ilustración (ej. resaltar un pictograma).
- **graph**: gráficas animadas con ejes rotulados.
  `{kind:'heating'|'boyle'|'charles'|'gaylussac'|'solubility'|'rate'|'equilibrium'|'energy'|'decay'|'phscale'|'dilution', mark:null|número, curves:['KNO3','NaCl']}`
  - heating: curva de calentamiento del agua (−20 °C a 120 °C) con mesetas de fusión (0 °C) y ebullición (100 °C; opcional la de Bogotá ≈ 92 °C con `mark:92`), una bolita recorre la curva. boyle: P vs V hipérbola; charles: V vs T recta; gaylussac: P vs T recta. solubility: curvas de solubilidad (g/100 g agua) de KNO₃, NaCl y azúcar vs T. rate: concentración vs tiempo de reactivo y producto. equilibrium: concentraciones que se aplanan en equilibrio; con `mark` muestra una perturbación. energy: diagrama de energía con energía de activación (con y sin catalizador). decay: vida media (C-14, 5730 años). phscale: escala 0-14 con objetos cotidianos (jugo de limón 2, gaseosa 3, café 5, leche 6,5, agua 7, sangre 7,4, bicarbonato 8,3, jabón 10, blanqueador 12,5, destapador 14) y marcador en `mark`. dilution: dos vasos, al agregar agua la misma cantidad de partículas ocupa más volumen.

## Minijuegos (`web/lib/games/<juego>.js`)

`export default function (el, spec, finish) { ...; return dispose }`

Cada juego muestra: pantalla de inicio (nombre, cómo se juega en una línea, botón "Jugar"), la partida con puntaje, tiempo o vidas visibles, y pantalla final con estrellas (★☆☆), puntaje, récord personal (localStorage `ql-best-<spec.id>`, en try/catch) y botones "Jugar otra vez". Al terminar cada partida llama `finish({score, stars, detail})` (stars 0 a 3 según umbrales razonables del juego o `spec.stars = [s1, s2, s3]`). Sonido no. Animaciones con CSS/transform. Feedback inmediato de acierto/error (color, vibración con `navigator.vibrate` si existe). Todo `spec` trae `id` (ej. `g8u1r`) y `title`.

- **blitz** (Contrarreloj): `{items:[{q, o:[...], a, e}], time:60, lives:3}` preguntas de opción múltiple al azar; 60 s; racha multiplica puntos (x2 con 3 seguidas, x3 con 6); error quita vida y muestra la explicación 1,5 s. Fin por tiempo, vidas o sin preguntas.
- **memory** (Parejas): `{pairs:[['NaCl','Sal de cocina'], ...]}` cartas volteables en cuadrícula (6 a 8 parejas), cuenta movimientos y tiempo; estrellas por movimientos.
- **builder** (Constructor 3D): `{targets:['H2O','CO2','NH3','CH4',...], palette:['H','C','N','O','Cl']}` Se pide una molécula por nombre y fórmula; el estudiante agrega o quita átomos de la paleta (botones grandes con el color del elemento). Los átomos agregados flotan sueltos en un stage 3D. Cuando la composición coincide con el objetivo, los átomos vuelan a su posición y se forma la molécula de `M` (animación) con celebración; siguiente objetivo. Tiempo total y errores cuentan para las estrellas. Botón "Pista" que muestra cuántos átomos de cada elemento van.
- **hunter** (Cazador de elementos): `{clues:[{c:'Soy el gas noble del periodo 3', a:'Ar'}...], time:90}` tabla periódica Z 1-36 táctil; aparece una pista y hay que tocar el elemento correcto; puntos por velocidad. Si `clues` no viene, genera pistas a partir de `EL` (grupo, periodo, categoría, símbolo↔nombre).
- **sorter** (Atrapa y clasifica): `{bins:['Ácido','Base','Neutro'], items:[['Jugo de limón',0], ...], time:60}` las tarjetas caen desde arriba de un área de juego; el estudiante toca el recipiente correcto (botones grandes abajo) mientras la tarjeta cae, o usa las teclas 1, 2, 3. La velocidad aumenta. 3 vidas.
- **balancer** (Balanceo relámpago): `{rx:[{r:['H2','O2'], p:['H2O'], c:[2,1,2]}...], time:120}` una ecuación a la vez con botones − / + por coeficiente y conteo de átomos en vivo (bolitas de color por átomo como en la actividad de balanceo); al quedar balanceada con los enteros mínimos pasa sola a la siguiente con animación. Puntos por ecuación y bonificación por tiempo.
- **reactor** (Controla el reactor): `{mode:'gas'|'equilibrium'}` gas: un gas en un cilindro 2D (canvas con partículas); cambian al azar la temperatura o el volumen y el estudiante debe mover los deslizadores (T, V) para mantener la presión en la franja verde durante 60 s (PV = nRT); puntaje = tiempo en la franja. equilibrium: N₂ + 3H₂ ⇌ 2NH₃ exotérmica; objetivo: llevar la producción de NH₃ por encima de una meta usando presión, temperatura y retiro de producto (Le Châtelier), con barras de concentración; 60 s.

## Cómo probar

Empaqueta y mira en el navegador (Chromium headless con Playwright ya disponible):

```bash
cd web
npx esbuild ruta/a/tu-prueba.js --bundle --format=iife --outfile=/tmp/…/prueba.js
NODE_PATH=$(npm root -g) node tu-script-playwright.js   # chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']})
```

Crea una página HTML de prueba que cargue `web/app/globals.css` (tokens y clases) y tu bundle, monte cada tipo con varios estados y toma capturas a 1280 px y 390 px, en claro y oscuro (`document.documentElement.dataset.theme='dark'`). Mira las capturas y corrige lo que se vea mal. Revisa que no haya errores en consola (`page.on('pageerror')`). Deja las pruebas fuera de `web/lib` (usa tu carpeta temporal).
