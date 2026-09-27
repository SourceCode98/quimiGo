import { createApp } from './app.js';
import { createMemoryStore } from './store-memory.js';
import { createPostgresStore } from './store-postgres.js';

const env = process.env;
// Sin DATABASE_URL se usa la memoria (sirve para probar; los datos se borran al reiniciar).
const useMemory = env.DB_DRIVER === 'memory' || !env.DATABASE_URL;
if (useMemory && env.NODE_ENV === 'production') console.warn('AVISO: la API está usando memoria. Configura DATABASE_URL para guardar los datos de verdad.');
const store = useMemory ? createMemoryStore() : await createPostgresStore({ connectionString: env.DATABASE_URL });

const secret = env.SESSION_SECRET || (useMemory && env.NODE_ENV !== 'production' ? 'solo-para-desarrollo-local-no-usar-en-produccion' : '');
const app = createApp({ store, secret, secureCookies: env.NODE_ENV === 'production' });
const port = Number(env.PORT || 4000);
const host = env.HOST || '0.0.0.0';
const server = app.listen(port, host, () => console.log(`API de QuimicaLearn en http://${host}:${port} (base de datos: ${store.kind})`));

for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => server.close(async () => { await store.close?.(); process.exit(0); }));
