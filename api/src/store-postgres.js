// Almacenamiento en PostgreSQL (Render Postgres, Neon, Supabase…). Crea las tablas al arrancar si no existen.
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const iso = (d) => (d instanceof Date ? d.toISOString() : d);

export async function createPostgresStore({ connectionString }) {
  if (!connectionString) throw new Error('Falta DATABASE_URL');
  // Render usa SSL fuera de su red interna; en local (localhost) no.
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(connectionString) || !/\./.test(new URL(connectionString).hostname);
  const pool = new pg.Pool({ connectionString, max: 8, ssl: local ? false : { rejectUnauthorized: false } });

  await pool.query(await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8'));

  const q = (sql, params = []) => pool.query(sql, params);
  const one = async (sql, params) => (await q(sql, params)).rows[0] || null;
  const dup = (err) => { if (err.code === '23505') { const e = new Error('duplicate'); e.code = 'DUPLICATE'; throw e; } throw err; };

  const teacher = (r) => r && { id: r.id, name: r.name, email: r.email, passHash: r.pass_hash, createdAt: iso(r.created_at) };
  const klass = (r) => r && { id: r.id, teacherId: r.teacher_id, name: r.name, grade: r.grade, code: r.code, createdAt: iso(r.created_at), studentCount: r.student_count };
  const student = (r) => r && { id: r.id, classId: r.class_id, name: r.name, nameKey: r.name_key, pinHash: r.pin_hash, xp: r.xp, days: r.days || [], lastActive: iso(r.last_active) };
  const prog = (r) => ({ lessonId: r.lesson_id, stars: r.stars, act: r.act_done, attempts: r.attempts, updatedAt: iso(r.updated_at) });

  return {
    kind: 'postgres',
    async ping() { await q('SELECT 1'); return true; },
    close: () => pool.end(),

    async createTeacher({ name, email, passHash }) {
      const id = randomUUID();
      try { await q('INSERT INTO ql_teachers (id, name, email, pass_hash) VALUES ($1, $2, $3, $4)', [id, name, email, passHash]); }
      catch (e) { dup(e); }
      return { id, name, email, passHash };
    },
    async findTeacherByEmail(email) { return teacher(await one('SELECT * FROM ql_teachers WHERE email = $1', [email])); },
    async getTeacher(id) { return teacher(await one('SELECT * FROM ql_teachers WHERE id = $1', [id])); },

    async createClass({ teacherId, name, grade, code }) {
      const id = randomUUID();
      try { await q('INSERT INTO ql_classes (id, teacher_id, name, grade, code) VALUES ($1, $2, $3, $4, $5)', [id, teacherId, name, grade, code]); }
      catch (e) { dup(e); }
      return { id, teacherId, name, grade, code };
    },
    async listClasses(teacherId) {
      const r = await q(`SELECT c.*, (SELECT COUNT(*)::int FROM ql_students s WHERE s.class_id = c.id) AS student_count
                         FROM ql_classes c WHERE c.teacher_id = $1 ORDER BY c.created_at DESC`, [teacherId]);
      return r.rows.map(klass);
    },
    async getClass(id) { return klass(await one('SELECT * FROM ql_classes WHERE id = $1', [id])); },
    async findClassByCode(code) { return klass(await one('SELECT * FROM ql_classes WHERE code = $1', [code])); },

    async findStudent(classId, nameKey) { return student(await one('SELECT * FROM ql_students WHERE class_id = $1 AND name_key = $2', [classId, nameKey])); },
    async createStudent({ classId, name, nameKey, pinHash }) {
      const id = randomUUID();
      try { await q('INSERT INTO ql_students (id, class_id, name, name_key, pin_hash) VALUES ($1, $2, $3, $4, $5)', [id, classId, name, nameKey, pinHash]); }
      catch (e) { dup(e); }
      return { id, classId, name, nameKey, pinHash, xp: 0, days: [] };
    },
    async getStudent(id) { return student(await one('SELECT * FROM ql_students WHERE id = $1', [id])); },
    async setStudentPin(id, pinHash) { await q('UPDATE ql_students SET pin_hash = $2 WHERE id = $1', [id, pinHash]); },
    async deleteStudent(id) { await q('DELETE FROM ql_students WHERE id = $1', [id]); },

    async getProgress(studentId) {
      return (await q('SELECT * FROM ql_progress WHERE student_id = $1', [studentId])).rows.map(prog);
    },
    async saveProgress(studentId, { lessonId, stars, act, attempts }) {
      await q(`INSERT INTO ql_progress (student_id, lesson_id, stars, act_done, attempts) VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (student_id, lesson_id) DO UPDATE SET stars = $3, act_done = $4, attempts = $5, updated_at = now()`,
        [studentId, lessonId, stars, !!act, attempts]);
    },
    async addXp(studentId, amount, days) {
      const r = await one('UPDATE ql_students SET xp = xp + $2, days = $3, last_active = now() WHERE id = $1 RETURNING xp', [studentId, amount, JSON.stringify(days)]);
      return r?.xp ?? 0;
    },
    async listStudentsWithProgress(classId) {
      const s = await q('SELECT * FROM ql_students WHERE class_id = $1 ORDER BY name', [classId]);
      const p = await q('SELECT p.* FROM ql_progress p JOIN ql_students s ON s.id = p.student_id WHERE s.class_id = $1', [classId]);
      const byStudent = new Map();
      for (const r of p.rows) { if (!byStudent.has(r.student_id)) byStudent.set(r.student_id, []); byStudent.get(r.student_id).push(prog(r)); }
      return s.rows.map(student).map((st) => ({ id: st.id, name: st.name, xp: st.xp, lastActive: st.lastActive, progress: byStudent.get(st.id) || [] }));
    },
  };
}
