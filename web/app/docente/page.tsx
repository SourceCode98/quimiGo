'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useQL } from '@/components/Providers';
import { gc } from '@/components/ui';
import { GRADES } from '@/content';
import { api } from '@/lib/api';

type Klass = { id: string; name: string; grade: number; code: string; studentCount: number };

export default function Docente() {
  const { user, ready } = useQL();
  const [classes, setClasses] = useState<Klass[] | null>(null);
  const [form, setForm] = useState({ name: '', grade: 10 });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setClasses((await api<{ classes: Klass[] }>('/classes')).classes); } catch (e) { setErr((e as Error).message); }
  }, []);
  useEffect(() => { if (user?.role === 'teacher') load(); }, [user, load]);

  if (!ready) return <p className="muted">Cargando…</p>;
  if (user?.role !== 'teacher') return (
    <div className="card"><h2>Esta sección es para docentes</h2><p>Inicia sesión con tu cuenta de docente para crear cursos y ver el avance de tus estudiantes.</p><div><Link className="btn" href="/entrar">Entrar</Link></div></div>
  );

  return (
    <>
      <section className="hero">
        <span className="mono">Panel docente</span>
        <h1>Mis cursos</h1>
        <p>Crea un curso y comparte su código. Cada estudiante entra con el código, su nombre y un PIN, y aquí ves su avance lección por lección.</p>
      </section>
      <form className="card" onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setErr('');
        try { await api('/classes', { body: form }); setForm({ ...form, name: '' }); await load(); } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
      }}>
        <h2>Crear un curso</h2>
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <div className="field" style={{ flex: '1 1 220px' }}><label htmlFor="cname">Nombre del curso</label>
            <input id="cname" required maxLength={100} placeholder="Ej. 10A Química 2026" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="field" style={{ flex: '0 1 200px' }}><label htmlFor="cgrade">Grado</label>
            <select id="cgrade" value={form.grade} onChange={(e) => setForm({ ...form, grade: Number(e.target.value) })}>
              {GRADES.map((g) => <option key={g.n} value={g.n}>{g.n}° · {g.title}</option>)}
            </select></div>
          <button className="btn" disabled={busy}>Crear curso</button>
        </div>
        {err && <div className="fb no">{err}</div>}
      </form>
      {classes === null ? <p className="muted">Cargando cursos…</p> : classes.length === 0 ? <p className="muted">Aún no tienes cursos.</p> : (
        <section className="classes">
          {classes.map((c) => (
            <Link key={c.id} href={`/docente/clase/${c.id}`} className="ccard" style={gc('g' + c.grade)}>
              <span className="mono">Grado {c.grade}° · {c.studentCount} estudiante{c.studentCount === 1 ? '' : 's'}</span>
              <h3>{c.name}</h3>
              <span>Código: <b className="mono" style={{ fontSize: '1rem', color: 'var(--accent)' }}>{c.code}</b></span>
            </Link>
          ))}
        </section>
      )}
    </>
  );
}
