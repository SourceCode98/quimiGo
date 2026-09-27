// Punto de entrada para la versión publicada como página única (sin Next.js).
import { mountWidget, M, EL, parseF } from './widgets.js';
import { mountScene, stateAt } from './scenes/index.js';
import { mountGame, GAME_INFO } from './games/index.js';
import { LESSON_SCENES } from '../content/scenes.js';
import { UNIT_GAMES, resolveUnitGame } from '../content/games.js';
window.QLW = { mount: mountWidget, M, EL, parseF };
window.QLS = { mount: mountScene, stateAt, specs: LESSON_SCENES };
window.QLG = { mount: mountGame, info: GAME_INFO, units: UNIT_GAMES, resolve: resolveUnitGame };
