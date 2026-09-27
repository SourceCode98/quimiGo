// Minijuegos ("Reto de la unidad" y Arcade).
// Contrato de cada juego: export default (el, spec, finish) => dispose
//   finish({ score, stars, detail }) se llama una vez al terminar una partida (stars 0-3).
import blitz from './blitz.js';
import memory from './memory.js';
import builder from './builder.js';
import hunter from './hunter.js';
import sorter from './sorter.js';
import balancer from './balancer.js';
import reactor from './reactor.js';
import catcher from './catcher.js';
import word from './word.js';
import truefalse from './truefalse.js';
import order from './order.js';

export const GAMES = { blitz, memory, builder, hunter, sorter, balancer, reactor, catcher, word, truefalse, order };
export const GAME_INFO = {
  blitz: { name: 'Contrarreloj', ic: '⏱' },
  memory: { name: 'Parejas', ic: '▦' },
  builder: { name: 'Constructor 3D', ic: '⚛' },
  hunter: { name: 'Cazador de elementos', ic: '⌖' },
  sorter: { name: 'Atrapa y clasifica', ic: '⇣' },
  balancer: { name: 'Balanceo relámpago', ic: '⚖' },
  reactor: { name: 'Controla el reactor', ic: '◎' },
  catcher: { name: 'Atrapa partículas', ic: '⚗' },
  word: { name: 'Palabra secreta', ic: '✎' },
  truefalse: { name: '¿Mito o verdad?', ic: '⇄' },
  order: { name: 'Ordena la secuencia', ic: '⇅' },
};

export function mountGame(el, spec, finish) {
  const g = GAMES[spec.game];
  if (!g) { el.textContent = 'Juego no disponible'; return () => {}; }
  let done = false;
  const d = g(el, spec, (r) => { if (!done) { done = true; } finish(r); });
  return typeof d === 'function' ? d : () => {};
}
