// Almacenamiento en memoria para desarrollo y pruebas. Se borra al reiniciar el proceso.
import { randomUUID } from 'node:crypto';

export function createMemoryStore() {
  const teachers = new Map();
  const classes = new Map();
  const students = new Map();
  const progress = new Map(); // studentId -> Map(lessonId -> row)

  const now = () => new Date().toISOString();

  return {
    kind: 'memory',
    async ping() { return true; },

    async createTeacher({ name, email, passHash }) {
      for (const t of teachers.values()) if (t.email === email) { const e = new Error('duplicate'); e.code = 'DUPLICATE'; throw e; }
      const t = { id: randomUUID(), name, email, passHash, createdAt: now() };
      teachers.set(t.id, t);
      return t;
    },
    async findTeacherByEmail(email) { for (const t of teachers.values()) if (t.email === email) return t; return null; },
    async setTeacherPass(id, passHash) { const t = teachers.get(id); if (t) t.passHash = passHash; },
    async getTeacher(id) { return teachers.get(id) || null; },

    async createClass({ teacherId, name, grade, code }) {
      for (const c of classes.values()) if (c.code === code) { const e = new Error('duplicate'); e.code = 'DUPLICATE'; throw e; }
      const c = { id: randomUUID(), teacherId, name, grade, code, units: [], limits: {}, createdAt: now() };
      classes.set(c.id, c);
      return c;
    },
    async listClasses(teacherId) {
      return [...classes.values()].filter((c) => c.teacherId === teacherId)
        .map((c) => ({ ...c, studentCount: [...students.values()].filter((s) => s.classId === c.id).length }));
    },
    async getClass(id) { return classes.get(id) || null; },
    async setClassUnits(id, units) { const c = classes.get(id); if (c) c.units = units; },
    async setClassLimits(id, limits) { const c = classes.get(id); if (c) c.limits = limits; },
    async findClassByCode(code) { for (const c of classes.values()) if (c.code === code) return c; return null; },

    async findStudent(classId, nameKey) { for (const s of students.values()) if (s.classId === classId && s.nameKey === nameKey) return s; return null; },
    async findStudentByUsername(username) { for (const s of students.values()) if (s.username === username) return s; return null; },
    async setStudentUsername(id, username) {
      for (const s of students.values()) if (s.username === username && s.id !== id) { const e = new Error('duplicate'); e.code = 'DUPLICATE'; throw e; }
      const s = students.get(id); if (s) s.username = username;
    },
    async createStudent({ classId, name, nameKey, username, pinHash }) {
      for (const x of students.values()) if (x.username === username) { const e = new Error('duplicate'); e.code = 'DUPLICATE'; throw e; }
      const s = { id: randomUUID(), classId, name, nameKey, username, pinHash, xp: 0, days: [], lastActive: now(), createdAt: now() };
      students.set(s.id, s);
      return s;
    },
    async getStudent(id) { return students.get(id) || null; },
    async setStudentPin(id, pinHash) { const s = students.get(id); if (s) s.pinHash = pinHash; },
    async deleteStudent(id) { students.delete(id); progress.delete(id); },

    async getProgress(studentId) { return [...(progress.get(studentId)?.values() || [])]; },
    async saveProgress(studentId, row) {
      if (!progress.has(studentId)) progress.set(studentId, new Map());
      progress.get(studentId).set(row.lessonId, { ...row, updatedAt: now() });
    },
    async addXp(studentId, amount, days) {
      const s = students.get(studentId);
      if (!s) return 0;
      s.xp += amount; s.days = days; s.lastActive = now();
      return s.xp;
    },
    async listStudentsWithProgress(classId) {
      return [...students.values()].filter((s) => s.classId === classId)
        .map((s) => ({ id: s.id, name: s.name, username: s.username || null, xp: s.xp, lastActive: s.lastActive, progress: [...(progress.get(s.id)?.values() || [])] }));
    },
  };
}
