import { createApp } from './app.js';
import { createMemoryStore } from './store-memory.js';
import { createOracleStore } from './store-oracle.js';

const env = process.env;
// Sin DB_DRIVER ni cadena de conexión se usa la memoria (sirve para probar; los datos se borran al reiniciar).
const useMemory = env.DB_DRIVER === 'memory' || (!env.DB_DRIVER && !env.ORACLE_CONNECT_STRING);
if (useMemory && env.NODE_ENV === 'production') console.warn('AVISO: la API está usando memoria. Configura ORACLE_CONNECT_STRING para guardar los datos de verdad.');
const store = useMemory
  ? createMemoryStore()
  : await createOracleStore({ user: env.ORACLE_USER, password: env.ORACLE_PASSWORD, connectString: env.ORACLE_CONNECT_STRING });

const secret = env.SESSION_SECRET || (useMemory && env.NODE_ENV !== 'production' ? 'solo-para-desarrollo-local-no-usar-en-produccion' : '');
const app = createApp({ store, secret, secureCookies: env.NODE_ENV === 'production' });
const port = Number(env.PORT || 4000);
// Render necesita 0.0.0.0; en la VM de Oracle se usa HOST=127.0.0.1 detrás de Caddy.
const host = env.HOST || '0.0.0.0';
const server = app.listen(port, host, () => console.log(`API de QuimicaLearn en http://${host}:${port} (base de datos: ${store.kind})`));

for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => server.close(async () => { await store.close?.(); process.exit(0); }));
