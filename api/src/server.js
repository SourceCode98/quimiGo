import { createApp, ensureTeacher } from './app.js';
import { createMemoryStore } from './store-memory.js';
import { createMongoStore } from './store-mongo.js';

const env = process.env;
// Sin MONGODB_URI se usa la memoria (sirve para probar; los datos se borran al reiniciar).
const useMemory = env.DB_DRIVER === 'memory' || !env.MONGODB_URI;
if (useMemory && env.NODE_ENV === 'production') console.warn('AVISO: la API está usando memoria. Configura MONGODB_URI para guardar los datos de verdad.');
const store = useMemory ? createMemoryStore() : await createMongoStore({ uri: env.MONGODB_URI });

const secret = env.SESSION_SECRET || (useMemory && env.NODE_ENV !== 'production' ? 'solo-para-desarrollo-local-no-usar-en-produccion' : '');
// Cuenta fija de docente: se crea (o se le actualiza la contraseña) cada vez que arranca la API.
const admin = await ensureTeacher(store, { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD, name: env.ADMIN_NAME });
if (admin) console.log(`Cuenta de docente lista: ${admin.email}`);
else console.warn('AVISO: falta ADMIN_EMAIL o ADMIN_PASSWORD; nadie podrá entrar como docente.');
const app = createApp({ store, secret, secureCookies: env.NODE_ENV === 'production', allowSignup: env.ALLOW_TEACHER_SIGNUP === 'true' });
const port = Number(env.PORT || 4000);
const host = env.HOST || '0.0.0.0';
const server = app.listen(port, host, () => console.log(`API de QuimicaLearn en http://${host}:${port} (base de datos: ${store.kind})`));

for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => server.close(async () => { await store.close?.(); process.exit(0); }));
