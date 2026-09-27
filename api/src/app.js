import express from 'express';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { randomInt } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { applyResult, addDay } from './game.js';

const LESSON_LIST = JSON.parse(readFileSync(new URL('./lessons.json', import.meta.url)));
const LESSONS = new Set(LESSON_LIST.map((l) => l.id));
// Unidad de cada lección, reto o juego (ej. g8u1l2j1 → g8u1) y unidades de cada grado.
const UNIT_OF = new Map(LESSON_LIST.map((l) => [l.id, `g${l.grade}u${l.unit}`]));
const UNITS_BY_GRADE = new Map();
for (const l of LESSON_LIST) {
  const u = `g${l.grade}u${l.unit}`;
  if (!UNITS_BY_GRADE.has(l.grade)) UNITS_BY_GRADE.set(l.grade, []);
  if (!UNITS_BY_GRADE.get(l.grade).includes(u)) UNITS_BY_GRADE.get(l.grade).push(u);
}
// Orden dentro de cada módulo: una lección se abre cuando el estudiante terminó "Aprende" de la anterior
// (g8u1l3 pide g8u1l2); el reto de la unidad pide "Aprende" de todas sus lecciones.
const lessonOfId = (id) => id.replace(/j\d+$/, '');
const prevLesson = (id) => { const m = id.match(/^(g\d+u\d+l)(\d+)$/); return m && Number(m[2]) > 1 ? m[1] + (Number(m[2]) - 1) : null; };
const LESSONS_OF_UNIT = new Map();
for (const l of LESSON_LIST.filter((x) => /l\d+$/.test(x.id))) { const u = `g${l.grade}u${l.unit}`; if (!LESSONS_OF_UNIT.has(u)) LESSONS_OF_UNIT.set(u, []); LESSONS_OF_UNIT.get(u).push(l.id); }
function orderBlock(id, rows) {
  const learned = (x) => rows.some((r) => r.lessonId === x && r.learn);
  if (/r$/.test(id)) return (LESSONS_OF_UNIT.get(id.slice(0, -1)) || []).every(learned) ? null : 'Termina "Aprende" de todas las lecciones del módulo para abrir el reto.';
  const p = prevLesson(lessonOfId(id));
  return p && !learned(p) ? 'Primero termina "Aprende" de la lección anterior.' : null;
}
const COOKIE = 'ql_session';
const MAX_AGE = 30 * 24 * 3600;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const bad = (res, status, error) => res.status(status).json({ error });
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const nameKey = (n) => n.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
// Secciones con intentos limitables por el docente: quiz de la lección, minijuegos de "Juega" y reto de la unidad.
const LIMIT_KINDS = ['quiz', 'game', 'reto'];
const kindOf = (id) => (/r$/.test(id) ? 'reto' : /j\d+$/.test(id) ? 'game' : 'quiz');
const cleanLimits = (l) => Object.fromEntries(LIMIT_KINDS.map((k) => [k, Number.isInteger(l?.[k]) && l[k] >= 0 && l[k] <= 20 ? l[k] : 0]));
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

// Límite simple de intentos por IP para los inicios de sesión.
function limiter(max, windowMs) {
  const hits = new Map();
  return (req, res, next) => {
    const key = req.ip || 'x';
    const now = Date.now();
    const h = hits.get(key);
    if (!h || h.reset < now) hits.set(key, { n: 1, reset: now + windowMs });
    else if (++h.n > max) return bad(res, 429, 'Demasiados intentos. Espera un minuto.');
    if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
    next();
  };
}

/** Crea o actualiza la cuenta fija de docente (la contraseña se toma siempre de las variables de entorno). */
export async function ensureTeacher(store, { email, password, name }) {
  email = String(email || '').trim().toLowerCase();
  if (!email || !password) return null;
  if (password.length < 8) console.warn('AVISO: ADMIN_PASSWORD tiene menos de 8 caracteres; usa una más larga.');
  const t = await store.findTeacherByEmail(email);
  if (!t) return store.createTeacher({ name: name || 'Docente', email, passHash: await bcrypt.hash(password, 10) });
  if (!(await bcrypt.compare(password, t.passHash))) await store.setTeacherPass(t.id, await bcrypt.hash(password, 10));
  return t;
}

export function createApp({ store, secret, secureCookies = false, allowSignup = false }) {
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET debe tener al menos 32 caracteres');
  const key = new TextEncoder().encode(secret);
  const app = express();
  app.set('trust proxy', true);
  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));
  app.use(cookieParser());

  async function startSession(res, payload) {
    const token = await new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime(`${MAX_AGE}s`).sign(key);
    res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: secureCookies, maxAge: MAX_AGE * 1000, path: '/' });
  }
  async function session(req) {
    const t = req.cookies?.[COOKIE];
    if (!t) return null;
    try { return (await jwtVerify(t, key)).payload; } catch { return null; }
  }
  const need = (role) => async (req, res, next) => {
    const s = await session(req);
    if (!s || s.role !== role) return bad(res, 401, 'Inicia sesión para continuar.');
    req.session = s;
    next();
  };
  const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
  const loginLimit = limiter(10, 60_000);
  // Un salón entero suele salir a internet por la misma IP, así que los estudiantes tienen más margen.
  const joinLimit = limiter(60, 60_000);

  app.get('/api/health', wrap(async (_req, res) => { await store.ping(); res.json({ ok: true, db: store.kind }); }));

  /* ---------- docentes ---------- */
  app.post('/api/teacher/register', loginLimit, wrap(async (req, res) => {
    // Por ahora el registro está cerrado: solo existe la cuenta fija de ADMIN_EMAIL (ver server.js).
    if (!allowSignup) return bad(res, 403, 'El registro de docentes está cerrado.');
    const name = str(req.body?.name, 100), email = str(req.body?.email, 254).toLowerCase(), password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad(res, 400, 'Escribe tu nombre y un correo válido.');
    if (password.length < 8 || password.length > 128) return bad(res, 400, 'La contraseña debe tener entre 8 y 128 caracteres.');
    let t;
    try { t = await store.createTeacher({ name, email, passHash: await bcrypt.hash(password, 10) }); }
    catch (e) { if (e.code === 'DUPLICATE') return bad(res, 409, 'Ese correo ya tiene una cuenta. Inicia sesión.'); throw e; }
    await startSession(res, { sub: t.id, role: 'teacher' });
    res.status(201).json({ user: { role: 'teacher', id: t.id, name: t.name } });
  }));

  app.post('/api/teacher/login', loginLimit, wrap(async (req, res) => {
    const email = str(req.body?.email, 254).toLowerCase(), password = typeof req.body?.password === 'string' ? req.body.password : '';
    const t = email && (await store.findTeacherByEmail(email));
    if (!t || !(await bcrypt.compare(password, t.passHash))) return bad(res, 401, 'Correo o contraseña incorrectos.');
    await startSession(res, { sub: t.id, role: 'teacher' });
    res.json({ user: { role: 'teacher', id: t.id, name: t.name } });
  }));

  /* ---------- estudiantes: entran con el código del curso, su nombre y un PIN ---------- */
  app.post('/api/student/join', joinLimit, wrap(async (req, res) => {
    const code = str(req.body?.code, 8).toUpperCase(), name = str(req.body?.name, 60), pin = str(req.body?.pin, 8);
    if (!code || !name) return bad(res, 400, 'Escribe el código del curso y tu nombre.');
    if (!/^\d{4}$/.test(pin)) return bad(res, 400, 'El PIN debe tener 4 números.');
    const c = await store.findClassByCode(code);
    if (!c) return bad(res, 404, 'No existe un curso con ese código. Pídeselo a tu profe.');
    const k = nameKey(name);
    // mode "login": estudiante que vuelve (nunca crea); "new": primera vez (nunca entra a una cuenta existente).
    const mode = req.body?.mode;
    let s = await store.findStudent(c.id, k);
    if (mode === 'login' && !s) return bad(res, 404, `No encontramos a "${name}" en el curso ${c.name}. Escribe tu nombre igual que la primera vez, o elige "Es mi primera vez".`);
    if (mode === 'new' && s) return bad(res, 409, `"${s.name}" ya está inscrito en ${c.name}. Elige "Ya estoy inscrito" y usa tu PIN.`);
    if (s) {
      if (!(await bcrypt.compare(pin, s.pinHash))) return bad(res, 401, 'Ese nombre ya existe en el curso y el PIN no coincide. Si olvidaste tu PIN, pídele a tu profe que lo cambie.');
    } else {
      try { s = await store.createStudent({ classId: c.id, name, nameKey: k, pinHash: await bcrypt.hash(pin, 10) }); }
      catch (e) { if (e.code === 'DUPLICATE') return bad(res, 409, 'Ese nombre ya existe. Intenta de nuevo.'); throw e; }
    }
    await startSession(res, { sub: s.id, role: 'student', cls: c.id });
    res.json({ user: { role: 'student', id: s.id, name: s.name, className: c.name, grade: c.grade, units: c.units || [], limits: cleanLimits(c.limits) } });
  }));

  app.post('/api/logout', (_req, res) => { res.clearCookie(COOKIE, { path: '/' }); res.json({ ok: true }); });

  app.get('/api/me', wrap(async (req, res) => {
    const s = await session(req);
    if (!s) return res.json({ user: null });
    if (s.role === 'teacher') {
      const t = await store.getTeacher(s.sub);
      return res.json({ user: t ? { role: 'teacher', id: t.id, name: t.name } : null });
    }
    const st = await store.getStudent(s.sub);
    if (!st) return res.json({ user: null });
    const c = await store.getClass(st.classId);
    const rows = await store.getProgress(st.id);
    res.json({
      user: { role: 'student', id: st.id, name: st.name, className: c?.name, grade: c?.grade, units: c?.units || [], limits: cleanLimits(c?.limits) },
      xp: st.xp, days: st.days,
      progress: Object.fromEntries(rows.map((r) => [r.lessonId, { stars: r.stars, act: r.act, learn: !!r.learn, attempts: r.attempts || 0 }])),
    });
  }));

  app.post('/api/progress', need('student'), wrap(async (req, res) => {
    const lessonId = str(req.body?.lessonId, 20);
    if (!LESSONS.has(lessonId)) return bad(res, 400, 'Lección desconocida.');
    const act = req.body?.act === true;
    // "learn" marca que terminó todos los pasos de Aprende (solo lecciones, no da XP).
    const learn = req.body?.learn === true && /l\d+$/.test(lessonId);
    const stars = Number.isInteger(req.body?.stars) && req.body.stars >= 0 && req.body.stars <= 3 ? req.body.stars : undefined;
    if (!act && !learn && stars === undefined) return bad(res, 400, 'Nada que guardar.');
    const st = await store.getStudent(req.session.sub);
    if (!st) return bad(res, 401, 'Tu cuenta ya no existe.');
    // El docente decide qué módulos (unidades) están abiertos para su curso.
    const c = await store.getClass(st.classId);
    if (!c?.units?.includes(UNIT_OF.get(lessonId))) return bad(res, 403, 'Tu profe aún no habilita este módulo.');
    const rows = await store.getProgress(st.id);
    const blocked = orderBlock(lessonId, rows);
    if (blocked) return bad(res, 403, blocked);
    const prev = rows.find((r) => r.lessonId === lessonId);
    // Cada envío con estrellas es un intento; 0 = sin límite.
    const limit = cleanLimits(c.limits)[kindOf(lessonId)];
    if (stars !== undefined && limit && (prev?.attempts || 0) >= limit) return bad(res, 403, `Ya usaste tus ${limit} ${limit === 1 ? 'intento' : 'intentos'}.`);
    const { next, gained } = applyResult(prev, { act, stars, learn });
    await store.saveProgress(st.id, { lessonId, stars: next.stars ?? null, act: next.act, learn: !!next.learn, attempts: next.attempts || 0 });
    const xp = await store.addXp(st.id, gained, addDay(st.days, today()));
    res.json({ xp, gained, record: { stars: next.stars ?? null, act: next.act, learn: !!next.learn, attempts: next.attempts || 0 } });
  }));

  /* ---------- cursos del docente ---------- */
  async function ownClass(req, res) {
    const c = await store.getClass(String(req.params.id));
    if (!c || c.teacherId !== req.session.sub) { bad(res, 404, 'Curso no encontrado.'); return null; }
    return c;
  }

  app.get('/api/classes', need('teacher'), wrap(async (req, res) => res.json({ classes: await store.listClasses(req.session.sub) })));

  app.post('/api/classes', need('teacher'), wrap(async (req, res) => {
    const name = str(req.body?.name, 100), grade = Number(req.body?.grade);
    if (!name || !Number.isInteger(grade) || grade < 6 || grade > 11) return bad(res, 400, 'Escribe un nombre y elige un grado entre 6 y 11.');
    for (let i = 0; i < 5; i++) {
      const code = Array.from({ length: 6 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');
      try { return res.status(201).json({ class: await store.createClass({ teacherId: req.session.sub, name, grade, code }) }); }
      catch (e) { if (e.code !== 'DUPLICATE') throw e; }
    }
    bad(res, 500, 'No se pudo generar un código. Intenta otra vez.');
  }));

  app.get('/api/classes/:id', need('teacher'), wrap(async (req, res) => {
    const c = await ownClass(req, res); if (!c) return;
    res.json({ class: { ...c, limits: cleanLimits(c.limits) }, students: await store.listStudentsWithProgress(c.id) });
  }));

  app.put('/api/classes/:id/units', need('teacher'), wrap(async (req, res) => {
    const c = await ownClass(req, res); if (!c) return;
    const valid = UNITS_BY_GRADE.get(c.grade) || [];
    const units = Array.isArray(req.body?.units) ? [...new Set(req.body.units.filter((u) => valid.includes(u)))] : null;
    if (!units) return bad(res, 400, 'Envía la lista de módulos.');
    await store.setClassUnits(c.id, units);
    res.json({ units });
  }));

  app.put('/api/classes/:id/limits', need('teacher'), wrap(async (req, res) => {
    const c = await ownClass(req, res); if (!c) return;
    const limits = cleanLimits(req.body?.limits);
    await store.setClassLimits(c.id, limits);
    res.json({ limits });
  }));

  app.post('/api/classes/:id/students/:sid/pin', need('teacher'), wrap(async (req, res) => {
    const c = await ownClass(req, res); if (!c) return;
    const pin = str(req.body?.pin, 8);
    if (!/^\d{4}$/.test(pin)) return bad(res, 400, 'El PIN debe tener 4 números.');
    const s = await store.getStudent(String(req.params.sid));
    if (!s || s.classId !== c.id) return bad(res, 404, 'Estudiante no encontrado.');
    await store.setStudentPin(s.id, await bcrypt.hash(pin, 10));
    res.json({ ok: true });
  }));

  app.delete('/api/classes/:id/students/:sid', need('teacher'), wrap(async (req, res) => {
    const c = await ownClass(req, res); if (!c) return;
    const s = await store.getStudent(String(req.params.sid));
    if (!s || s.classId !== c.id) return bad(res, 404, 'Estudiante no encontrado.');
    await store.deleteStudent(s.id);
    res.json({ ok: true });
  }));

  app.use('/api', (_req, res) => bad(res, 404, 'Ruta no encontrada.'));
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err?.type === 'entity.parse.failed') return bad(res, 400, 'JSON inválido.');
    console.error(err);
    bad(res, 500, 'Error del servidor. Intenta de nuevo.');
  });
  return app;
}
