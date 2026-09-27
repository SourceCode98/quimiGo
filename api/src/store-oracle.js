// Almacenamiento en Oracle Autonomous Database (capa Always Free) con node-oracledb en modo Thin.
// El modo Thin no necesita Oracle Instant Client: se conecta por TLS con la cadena de conexión de la consola.
import oracledb from 'oracledb';
import { randomUUID } from 'node:crypto';

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.fetchAsString = [oracledb.CLOB];

const iso = (d) => (d instanceof Date ? d.toISOString() : d);

export async function createOracleStore({ user, password, connectString }) {
  if (!user || !password || !connectString) throw new Error('Faltan ORACLE_USER, ORACLE_PASSWORD u ORACLE_CONNECT_STRING');
  const pool = await oracledb.createPool({ user, password, connectString, poolMin: 1, poolMax: 8, poolIncrement: 1 });

  async function q(sql, binds = {}, opts = {}) {
    const conn = await pool.getConnection();
    try { return await conn.execute(sql, binds, { autoCommit: true, ...opts }); }
    finally { await conn.close(); }
  }
  const one = async (sql, binds) => (await q(sql, binds)).rows?.[0] || null;
  const dup = (err) => { if (err.errorNum === 1) { const e = new Error('duplicate'); e.code = 'DUPLICATE'; throw e; } throw err; };

  const teacher = (r) => r && { id: r.ID, name: r.NAME, email: r.EMAIL, passHash: r.PASS_HASH, createdAt: iso(r.CREATED_AT) };
  const klass = (r) => r && { id: r.ID, teacherId: r.TEACHER_ID, name: r.NAME, grade: r.GRADE, code: r.CODE, createdAt: iso(r.CREATED_AT), studentCount: r.STUDENT_COUNT };
  const student = (r) => r && { id: r.ID, classId: r.CLASS_ID, name: r.NAME, nameKey: r.NAME_KEY, pinHash: r.PIN_HASH, xp: r.XP, days: JSON.parse(r.DAYS || '[]'), lastActive: iso(r.LAST_ACTIVE) };
  const prog = (r) => ({ lessonId: r.LESSON_ID, stars: r.STARS, act: r.ACT_DONE === 1, attempts: r.ATTEMPTS, updatedAt: iso(r.UPDATED_AT) });

  return {
    kind: 'oracle',
    async ping() { await q('SELECT 1 FROM dual'); return true; },
    close: () => pool.close(10),

    async createTeacher({ name, email, passHash }) {
      const id = randomUUID();
      try { await q('INSERT INTO ql_teachers (id, name, email, pass_hash) VALUES (:id, :name, :email, :passHash)', { id, name, email, passHash }); }
      catch (e) { dup(e); }
      return { id, name, email, passHash };
    },
    async findTeacherByEmail(email) { return teacher(await one('SELECT * FROM ql_teachers WHERE email = :email', { email })); },
    async getTeacher(id) { return teacher(await one('SELECT * FROM ql_teachers WHERE id = :id', { id })); },

    async createClass({ teacherId, name, grade, code }) {
      const id = randomUUID();
      try { await q('INSERT INTO ql_classes (id, teacher_id, name, grade, code) VALUES (:id, :teacherId, :name, :grade, :code)', { id, teacherId, name, grade, code }); }
      catch (e) { dup(e); }
      return { id, teacherId, name, grade, code };
    },
    async listClasses(teacherId) {
      const r = await q(`SELECT c.*, (SELECT COUNT(*) FROM ql_students s WHERE s.class_id = c.id) AS student_count
                         FROM ql_classes c WHERE c.teacher_id = :teacherId ORDER BY c.created_at DESC`, { teacherId });
      return r.rows.map(klass);
    },
    async getClass(id) { return klass(await one('SELECT * FROM ql_classes WHERE id = :id', { id })); },
    async findClassByCode(code) { return klass(await one('SELECT * FROM ql_classes WHERE code = :code', { code })); },

    async findStudent(classId, nameKey) { return student(await one('SELECT * FROM ql_students WHERE class_id = :classId AND name_key = :nameKey', { classId, nameKey })); },
    async createStudent({ classId, name, nameKey, pinHash }) {
      const id = randomUUID();
      try { await q('INSERT INTO ql_students (id, class_id, name, name_key, pin_hash) VALUES (:id, :classId, :name, :nameKey, :pinHash)', { id, classId, name, nameKey, pinHash }); }
      catch (e) { dup(e); }
      return { id, classId, name, nameKey, pinHash, xp: 0, days: [] };
    },
    async getStudent(id) { return student(await one('SELECT * FROM ql_students WHERE id = :id', { id })); },
    async setStudentPin(id, pinHash) { await q('UPDATE ql_students SET pin_hash = :pinHash WHERE id = :id', { id, pinHash }); },
    async deleteStudent(id) { await q('DELETE FROM ql_students WHERE id = :id', { id }); },

    async getProgress(studentId) {
      const r = await q('SELECT * FROM ql_progress WHERE student_id = :studentId', { studentId });
      return r.rows.map(prog);
    },
    async saveProgress(studentId, { lessonId, stars, act, attempts }) {
      await q(`MERGE INTO ql_progress p
               USING (SELECT :studentId AS student_id, :lessonId AS lesson_id FROM dual) s
               ON (p.student_id = s.student_id AND p.lesson_id = s.lesson_id)
               WHEN MATCHED THEN UPDATE SET stars = :stars, act_done = :act, attempts = :attempts, updated_at = SYSTIMESTAMP
               WHEN NOT MATCHED THEN INSERT (student_id, lesson_id, stars, act_done, attempts) VALUES (:studentId, :lessonId, :stars, :act, :attempts)`,
        { studentId, lessonId, stars, act: act ? 1 : 0, attempts });
    },
    async addXp(studentId, amount, days) {
      await q('UPDATE ql_students SET xp = xp + :amount, days = :days, last_active = SYSTIMESTAMP WHERE id = :studentId', { studentId, amount, days: JSON.stringify(days) });
      return (await one('SELECT xp FROM ql_students WHERE id = :studentId', { studentId }))?.XP ?? 0;
    },
    async listStudentsWithProgress(classId) {
      const s = await q('SELECT * FROM ql_students WHERE class_id = :classId ORDER BY name', { classId });
      const p = await q(`SELECT p.* FROM ql_progress p JOIN ql_students s ON s.id = p.student_id WHERE s.class_id = :classId`, { classId });
      const byStudent = new Map();
      for (const r of p.rows) { if (!byStudent.has(r.STUDENT_ID)) byStudent.set(r.STUDENT_ID, []); byStudent.get(r.STUDENT_ID).push(prog(r)); }
      return s.rows.map(student).map((st) => ({ id: st.id, name: st.name, xp: st.xp, lastActive: st.lastActive, progress: byStudent.get(st.id) || [] }));
    },
  };
}
