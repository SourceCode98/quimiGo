import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp, ensureTeacher } from '../src/app.js';
import { createMemoryStore } from '../src/store-memory.js';
import { createMongoStore } from '../src/store-mongo.js';

// Con TEST_MONGODB_URI (una base de datos vacía de pruebas) el mismo flujo corre también contra MongoDB.
const MONGO = process.env.TEST_MONGODB_URI;
let store;

async function boot() {
  const app = createApp({ store, secret: 'x'.repeat(40), allowSignup: true });
  const server = await new Promise((r) => { const s = app.listen(0, () => r(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const client = () => {
    let cookie = '';
    return async (method, path, body) => {
      const res = await fetch(base + path, { method, headers: { 'content-type': 'application/json', cookie }, body: body && JSON.stringify(body) });
      const set = res.headers.get('set-cookie'); if (set) cookie = set.split(';')[0];
      return { status: res.status, body: await res.json() };
    };
  };
  return { server, client };
}

for (const kind of MONGO ? ['memory', 'mongodb'] : ['memory']) {
describe(kind, () => {
before(async () => { store = kind === 'mongodb' ? await createMongoStore({ uri: MONGO, dbName: 'ql_test_' + Date.now() }) : createMemoryStore(); });
after(async () => { await store.close?.(); });

test('flujo completo docente y estudiante', async () => {
  const { server, client } = await boot();
  try {
    const t = client();
    assert.equal((await t('POST', '/api/teacher/register', { name: 'Profe', email: 'p@x.co', password: 'corta' })).status, 400);
    assert.equal((await t('POST', '/api/teacher/register', { name: 'Profe', email: 'P@x.co', password: 'secreta123' })).status, 201);
    assert.equal((await t('POST', '/api/teacher/register', { name: 'Otro', email: 'p@x.co', password: 'secreta123' })).status, 409);
    const cls = (await t('POST', '/api/classes', { name: '10A', grade: 10 })).body.class;
    assert.match(cls.code, /^[A-Z2-9]{6}$/);

    const s = client();
    assert.equal((await s('POST', '/api/student/join', { code: 'NOPE00', name: 'Ana', pin: '1234' })).status, 404);
    assert.equal((await s('POST', '/api/student/join', { code: cls.code.toLowerCase(), name: 'Ána ', pin: '1234' })).status, 200);
    assert.equal((await s('POST', '/api/classes', { name: 'x', grade: 7 })).status, 401);

    // Hasta que el docente habilite el módulo, el estudiante no puede registrar avance.
    assert.equal((await s('POST', '/api/progress', { lessonId: 'g10u1l1', act: true })).status, 403);
    assert.equal((await s('PUT', `/api/classes/${cls.id}/units`, { units: ['g10u1'] })).status, 401);
    const en = await t('PUT', `/api/classes/${cls.id}/units`, { units: ['g10u1', 'g8u1', 'g10u1', 'falsa'] });
    assert.deepEqual(en.body.units, ['g10u1']);
    assert.deepEqual((await s('GET', '/api/me')).body.user.units, ['g10u1']);
    assert.equal((await s('POST', '/api/progress', { lessonId: 'g10u2l1', act: true })).status, 403);

    // Intentos: el docente limita el quiz a 2; la actividad (Practica) no cuenta.
    assert.deepEqual((await t('PUT', `/api/classes/${cls.id}/limits`, { limits: { quiz: 2, game: 'x', reto: 50 } })).body.limits, { quiz: 2, game: 0, reto: 0 });
    assert.deepEqual((await s('GET', '/api/me')).body.user.limits, { quiz: 2, game: 0, reto: 0 });
    let r = await s('POST', '/api/progress', { lessonId: 'g10u1l1', act: true });
    assert.equal(r.body.gained, 20);
    // Juegos de la lección (sección "Juega") y reto de la unidad.
    assert.equal((await s('POST', '/api/progress', { lessonId: 'g10u1l1j1', stars: 2 })).body.gained, 20);
    // Orden: la lección 2 y sus juegos piden "Aprende" de la 1; el reto pide "Aprende" de todo el módulo.
    assert.equal((await s('POST', '/api/progress', { lessonId: 'g10u1l2', act: true })).status, 403);
    assert.equal((await s('POST', '/api/progress', { lessonId: 'g10u1l2j1', stars: 1 })).status, 403);
    assert.equal((await s('POST', '/api/progress', { lessonId: 'g10u1r', stars: 1 })).status, 403);
    assert.equal((await s('POST', '/api/progress', { lessonId: 'g10u1l2', learn: true })).status, 403);
    for (const id of ['g10u1l1', 'g10u1l2', 'g10u1l3']) {
      r = await s('POST', '/api/progress', { lessonId: id, learn: true });
      assert.deepEqual([r.status, r.body.gained, r.body.record.learn], [200, 0, true]);
    }
    assert.equal((await s('POST', '/api/progress', { lessonId: 'g10u1l1j1', learn: true })).status, 400);
    assert.equal((await s('POST', '/api/progress', { lessonId: 'g10u1r', stars: 1 })).body.gained, 10);
    r = await s('POST', '/api/progress', { lessonId: 'g10u1l1', stars: 2 });
    assert.equal(r.body.gained, 20);
    r = await s('POST', '/api/progress', { lessonId: 'g10u1l1', stars: 1, act: true });
    assert.equal(r.body.gained, 0);
    assert.equal((await s('POST', '/api/progress', { lessonId: 'g10u1l1', stars: 3 })).status, 403);
    assert.equal((await t('PUT', `/api/classes/${cls.id}/limits`, { limits: { quiz: 0 } })).status, 200);
    r = await s('POST', '/api/progress', { lessonId: 'g10u1l1', stars: 3 });
    assert.deepEqual([r.body.gained, r.body.xp, r.body.record.attempts], [10, 80, 3]);
    assert.equal((await s('POST', '/api/progress', { lessonId: 'falsa', stars: 3 })).status, 400);

    const me = (await s('GET', '/api/me')).body;
    assert.equal(me.xp, 80);
    assert.deepEqual(me.progress.g10u1l1, { stars: 3, act: true, learn: true, attempts: 3 });
    assert.equal(me.days.length, 1);

    // Mismo nombre con otro PIN no entra; con el PIN correcto sí.
    const s2 = client();
    assert.equal((await s2('POST', '/api/student/join', { code: cls.code, name: 'ana', pin: '9999' })).status, 401);
    // Modos explícitos: volver a entrar nunca crea cuentas y "primera vez" no entra a una existente.
    assert.equal((await s2('POST', '/api/student/join', { code: cls.code, name: 'Anita', pin: '1234', mode: 'login' })).status, 404);
    assert.equal((await s2('POST', '/api/student/join', { code: cls.code, name: 'Ana', pin: '1234', mode: 'new' })).status, 409);
    assert.equal((await s2('POST', '/api/student/join', { code: cls.code, name: 'ana ', pin: '1234', mode: 'login' })).status, 200);
    assert.equal((await s2('POST', '/api/student/join', { code: cls.code, name: 'ANA', pin: '1234' })).status, 200);

    const detail = (await t('GET', `/api/classes/${cls.id}`)).body;
    assert.equal(detail.students.length, 1);
    assert.equal(detail.students[0].xp, 80);
    assert.deepEqual(detail.class.units, ['g10u1']);
    const sid = detail.students[0].id;
    assert.equal((await t('POST', `/api/classes/${cls.id}/students/${sid}/pin`, { pin: '5555' })).status, 200);
    assert.equal((await s2('POST', '/api/student/join', { code: cls.code, name: 'ana', pin: '5555' })).status, 200);

    // Otro docente no ve el curso ajeno.
    const t2 = client();
    await t2('POST', '/api/teacher/register', { name: 'B', email: 'b@x.co', password: 'secreta123' });
    assert.equal((await t2('GET', `/api/classes/${cls.id}`)).status, 404);

    assert.equal((await t('DELETE', `/api/classes/${cls.id}/students/${sid}`)).status, 200);
    assert.equal((await s('GET', '/api/me')).body.user, null);
    assert.equal((await t('POST', '/api/logout')).status, 200);
    assert.equal((await t('GET', '/api/me')).body.user, null);
    assert.equal((await t('GET', '/api/health')).body.ok, true);
  } finally { server.close(); }
});

test('cuenta fija de docente y registro cerrado', async () => {
  await ensureTeacher(store, { email: 'Diego@X.co', password: 'clave-fija-1', name: 'Diego' });
  await ensureTeacher(store, { email: 'diego@x.co', password: 'clave-nueva-2' });
  const app = createApp({ store, secret: 'x'.repeat(40) });
  const server = await new Promise((r) => { const s = app.listen(0, () => r(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (path, body) => fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.status);
  try {
    assert.equal(await post('/api/teacher/register', { name: 'X', email: 'x@y.co', password: 'secreta123' }), 403);
    assert.equal(await post('/api/teacher/login', { email: 'diego@x.co', password: 'clave-fija-1' }), 401);
    assert.equal(await post('/api/teacher/login', { email: 'diego@x.co', password: 'clave-nueva-2' }), 200);
  } finally { server.close(); }
});
});
}
