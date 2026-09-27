// Almacenamiento en MongoDB (MongoDB Atlas, plan gratuito M0). Crea los índices al arrancar si no existen.
import { MongoClient } from 'mongodb';
import { randomUUID } from 'node:crypto';

const iso = (d) => (d instanceof Date ? d.toISOString() : d);

export async function createMongoStore({ uri, dbName = 'quimicalearn' }) {
  if (!uri) throw new Error('Falta MONGODB_URI');
  const client = new MongoClient(uri, { maxPoolSize: 8 });
  await client.connect();
  const db = client.db(dbName);
  const teachers = db.collection('teachers');
  const classes = db.collection('classes');
  const students = db.collection('students');
  const progress = db.collection('progress');

  await Promise.all([
    teachers.createIndex({ email: 1 }, { unique: true }),
    classes.createIndex({ code: 1 }, { unique: true }),
    classes.createIndex({ teacherId: 1 }),
    students.createIndex({ classId: 1, nameKey: 1 }, { unique: true }),
    progress.createIndex({ studentId: 1, lessonId: 1 }, { unique: true }),
  ]);

  const dup = (err) => { if (err.code === 11000) { const e = new Error('duplicate'); e.code = 'DUPLICATE'; throw e; } throw err; };

  const teacher = (r) => r && { id: r._id, name: r.name, email: r.email, passHash: r.passHash, createdAt: iso(r.createdAt) };
  const klass = (r) => r && { id: r._id, teacherId: r.teacherId, name: r.name, grade: r.grade, code: r.code, units: r.units || [], limits: r.limits || {}, createdAt: iso(r.createdAt) };
  const student = (r) => r && { id: r._id, classId: r.classId, name: r.name, nameKey: r.nameKey, pinHash: r.pinHash, xp: r.xp, days: r.days || [], lastActive: iso(r.lastActive) };
  const prog = (r) => ({ lessonId: r.lessonId, stars: r.stars, act: r.act, learn: !!r.learn, attempts: r.attempts, updatedAt: iso(r.updatedAt) });

  return {
    kind: 'mongodb',
    async ping() { await db.command({ ping: 1 }); return true; },
    close: () => client.close(),

    async createTeacher({ name, email, passHash }) {
      const doc = { _id: randomUUID(), name, email, passHash, createdAt: new Date() };
      try { await teachers.insertOne(doc); } catch (e) { dup(e); }
      return teacher(doc);
    },
    async findTeacherByEmail(email) { return teacher(await teachers.findOne({ email })); },
    async setTeacherPass(id, passHash) { await teachers.updateOne({ _id: id }, { $set: { passHash } }); },
    async getTeacher(id) { return teacher(await teachers.findOne({ _id: id })); },

    async createClass({ teacherId, name, grade, code }) {
      const doc = { _id: randomUUID(), teacherId, name, grade, code, units: [], limits: {}, createdAt: new Date() };
      try { await classes.insertOne(doc); } catch (e) { dup(e); }
      return klass(doc);
    },
    async listClasses(teacherId) {
      const rows = await classes.find({ teacherId }).sort({ createdAt: -1 }).toArray();
      const counts = await students.aggregate([
        { $match: { classId: { $in: rows.map((r) => r._id) } } },
        { $group: { _id: '$classId', n: { $sum: 1 } } },
      ]).toArray();
      const byClass = new Map(counts.map((c) => [c._id, c.n]));
      return rows.map((r) => ({ ...klass(r), studentCount: byClass.get(r._id) || 0 }));
    },
    async getClass(id) { return klass(await classes.findOne({ _id: id })); },
    async findClassByCode(code) { return klass(await classes.findOne({ code })); },
    async setClassUnits(id, units) { await classes.updateOne({ _id: id }, { $set: { units } }); },
    async setClassLimits(id, limits) { await classes.updateOne({ _id: id }, { $set: { limits } }); },

    async findStudent(classId, nameKey) { return student(await students.findOne({ classId, nameKey })); },
    async createStudent({ classId, name, nameKey, pinHash }) {
      const doc = { _id: randomUUID(), classId, name, nameKey, pinHash, xp: 0, days: [], lastActive: new Date(), createdAt: new Date() };
      try { await students.insertOne(doc); } catch (e) { dup(e); }
      return student(doc);
    },
    async getStudent(id) { return student(await students.findOne({ _id: id })); },
    async setStudentPin(id, pinHash) { await students.updateOne({ _id: id }, { $set: { pinHash } }); },
    async deleteStudent(id) {
      await students.deleteOne({ _id: id });
      await progress.deleteMany({ studentId: id });
    },

    async getProgress(studentId) { return (await progress.find({ studentId }).toArray()).map(prog); },
    async saveProgress(studentId, { lessonId, stars, act, learn, attempts }) {
      await progress.updateOne(
        { studentId, lessonId },
        { $set: { stars, act: !!act, learn: !!learn, attempts, updatedAt: new Date() } },
        { upsert: true },
      );
    },
    async addXp(studentId, amount, days) {
      const r = await students.findOneAndUpdate(
        { _id: studentId },
        { $inc: { xp: amount }, $set: { days, lastActive: new Date() } },
        { returnDocument: 'after' },
      );
      return r?.xp ?? 0;
    },
    async listStudentsWithProgress(classId) {
      const rows = await students.find({ classId }).sort({ name: 1 }).toArray();
      const p = await progress.find({ studentId: { $in: rows.map((r) => r._id) } }).toArray();
      const byStudent = new Map();
      for (const r of p) { if (!byStudent.has(r.studentId)) byStudent.set(r.studentId, []); byStudent.get(r.studentId).push(prog(r)); }
      return rows.map(student).map((st) => ({ id: st.id, name: st.name, xp: st.xp, lastActive: st.lastActive, progress: byStudent.get(st.id) || [] }));
    },
  };
}
