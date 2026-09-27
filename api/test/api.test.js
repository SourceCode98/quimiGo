import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { createMemoryStore } from '../src/store-memory.js';
import { createPostgresStore } from '../src/store-postgres.js';

// Con TEST_DATABASE_URL (una base de datos vacía de pruebas) el mismo flujo corre también contra PostgreSQL.
const PG = process.env.TEST_DATABASE_URL;
let store;

async function boot() {
  const app = createApp({ store, secret: 'x'.repeat(40) });
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

for (const kind of PG ? ['memory', 'postgres'] : ['memory']) {
describe(kind, () => {
before(async () => { store = kind === 'postgres' ? await createPostgresStore({ connectionString: PG }) : createMemoryStore(); });
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

    let r = await s('POST', '/api/progress', { lessonId: 'g10u1l1', act: true });
    assert.equal(r.body.gained, 20);
    r = await s('POST', '/api/progress', { lessonId: 'g10u1l1', stars: 2 });
    assert.equal(r.body.gained, 20);
    r = await s('POST', '/api/progress', { lessonId: 'g10u1l1', stars: 1, act: true });
    assert.equal(r.body.gained, 0);
    r = await s('POST', '/api/progress', { lessonId: 'g10u1l1', stars: 3 });
    assert.deepEqual([r.body.gained, r.body.xp], [10, 50]);
    assert.equal((await s('POST', '/api/progress', { lessonId: 'falsa', stars: 3 })).status, 400);

    const me = (await s('GET', '/api/me')).body;
    assert.equal(me.xp, 50);
    assert.deepEqual(me.progress.g10u1l1, { stars: 3, act: true });
    assert.equal(me.days.length, 1);

    // Mismo nombre con otro PIN no entra; con el PIN correcto sí.
    const s2 = client();
    assert.equal((await s2('POST', '/api/student/join', { code: cls.code, name: 'ana', pin: '9999' })).status, 401);
    assert.equal((await s2('POST', '/api/student/join', { code: cls.code, name: 'ANA', pin: '1234' })).status, 200);

    const detail = (await t('GET', `/api/classes/${cls.id}`)).body;
    assert.equal(detail.students.length, 1);
    assert.equal(detail.students[0].xp, 50);
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
});
}
