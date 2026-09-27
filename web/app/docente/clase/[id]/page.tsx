'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useQL } from '@/components/Providers';
import { gc } from '@/components/ui';
import { GRADES } from '@/content';
import { UNIT_GAMES } from '@/content/games';
import { api } from '@/lib/api';
import { levelOf } from '@/lib/game';

type Row = { lessonId: string; stars: number | null; act: boolean };
type Student = { id: string; name: string; xp: number; lastActive: string; progress: Row[] };
type Klass = { id: string; name: string; grade: number; code: string; units?: string[] };

const when = (iso: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', timeZone: 'America/Bogota' });
};

export default function Clase() {
  const { id } = useParams<{ id: string }>();
  const { user, ready, toast } = useQL();
  const [data, setData] = useState<{ class: Klass; students: Student[] } | null>(null);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { setData(await api(`/classes/${id}`)); } catch (e) { setErr((e as Error).message); }
  }, [id]);
  useEffect(() => { if (user?.role === 'teacher') load(); }, [user, load]);

  if (!ready) return <p className="muted">Cargando…</p>;
  if (user?.role !== 'teacher') return <div className="card"><p>Inicia sesión como docente para ver este curso.</p><div><Link className="btn" href="/entrar">Entrar</Link></div></div>;
  if (err) return <div className="fb no">{err}</div>;
  if (!data) return <p className="muted">Cargando curso…</p>;

  const c = data.class;
  const grade = GRADES.find((g) => g.n === c.grade)!;
  const cut = (t: string) => (t.length > 34 ? t.slice(0, 33) + '…' : t);
  const lessons = grade.units.flatMap((u, ui) => [
    ...u.lessons.map((l, li) => ({ id: l.id, title: l.title, label: `${ui + 1}.${li + 1} ${cut(l.title)}` })),
    ...(UNIT_GAMES[u.id] ? [{ id: u.id + 'r', title: 'Reto: ' + UNIT_GAMES[u.id].title, label: `${ui + 1}.★ Reto` }] : []),
  ]);
  const map = (s: Student) => Object.fromEntries(s.progress.map((p) => [p.lessonId, p]));
  const students = [...data.students].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const maps = students.map(map);
  const doneCount = (m: Record<string, Row>) => lessons.filter((l) => m[l.id]?.stars != null).length;
  const avgDone = students.length ? maps.reduce((a, m) => a + doneCount(m), 0) / students.length : 0;
  const allStars = maps.flatMap((m) => lessons.map((l) => m[l.id]?.stars).filter((x): x is number => x != null));
  const avgStars = allStars.length ? allStars.reduce((a, b) => a + b, 0) / allStars.length : 0;
  const weekAgo = Date.now() - 7 * 864e5;
  const active = students.filter((s) => s.lastActive && new Date(s.lastActive).getTime() > weekAgo).length;

  const units = c.units || [];
  const saveUnits = async (next: string[]) => {
    setSaving(true);
    try {
      const r = await api<{ units: string[] }>(`/classes/${c.id}/units`, { method: 'PUT', body: { units: next } });
      setData((d) => d && { ...d, class: { ...d.class, units: r.units } });
    } catch (e) { toast((e as Error).message); }
    setSaving(false);
  };
  const toggleUnit = (u: string) => saveUnits(units.includes(u) ? units.filter((x) => x !== u) : [...units, u]);

  const resetPin = async (s: Student) => {
    const pin = window.prompt(`Nuevo PIN de 4 números para ${s.name}:`);
    if (pin === null) return;
    try { await api(`/classes/${c.id}/students/${s.id}/pin`, { body: { pin } }); toast(`PIN de ${s.name} actualizado`); } catch (e) { toast((e as Error).message); }
  };
  const remove = async (s: Student) => {
    if (!window.confirm(`¿Eliminar a ${s.name} y todo su avance? No se puede deshacer.`)) return;
    try { await api(`/classes/${c.id}/students/${s.id}`, { method: 'DELETE' }); await load(); } catch (e) { toast((e as Error).message); }
  };

  return (
    <>
      <section className="chead" style={gc(grade.id)}>
        <span className="mono">Grado {c.grade}° · {grade.title}</span>
        <h1>{c.name}</h1>
        <div className="row"><span>Código para tus estudiantes:</span><span className="bigcode">{c.code}</span>
          <button className="btn ghost sm" onClick={() => { navigator.clipboard?.writeText(c.code); toast('Código copiado'); }}>Copiar</button>
          <button className="btn ghost sm" onClick={load}>Actualizar</button></div>
        <p className="muted">Pídeles que entren a la plataforma, toquen “Entrar” y escriban este código, su nombre y un PIN de 4 números.</p>
      </section>

      <section className="block modules" aria-busy={saving}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div><h2>Módulos del curso</h2><span className="mono">Tus estudiantes solo ven los módulos que habilites · {units.length} de {grade.units.length} abiertos</span></div>
          <div className="row">
            <button className="btn ghost sm" disabled={saving || units.length === grade.units.length} onClick={() => saveUnits(grade.units.map((u) => u.id))}>Habilitar todos</button>
            <button className="btn ghost sm" disabled={saving || units.length === 0} onClick={() => saveUnits([])}>Bloquear todos</button>
          </div>
        </div>
        <div className="mod-list">
          {grade.units.map((u, ui) => {
            const on = units.includes(u.id);
            return (
              <button key={u.id} className={'mod' + (on ? ' on' : '')} role="switch" aria-checked={on} disabled={saving} onClick={() => toggleUnit(u.id)}>
                <span className="sw" aria-hidden><i /></span>
                <span><b>{ui + 1}. {u.title}</b><small>{u.lessons.length} lecciones{UNIT_GAMES[u.id] ? ' y un reto' : ''} · {on ? 'Abierto' : 'Bloqueado'}</small></span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="stats">
        <div><b>{students.length}</b><span>estudiantes</span></div>
        <div><b>{active}</b><span>activos en los últimos 7 días</span></div>
        <div><b>{avgDone.toFixed(1)}/{lessons.length}</b><span>lecciones completadas en promedio</span></div>
        <div><b>{avgStars.toFixed(1)} ★</b><span>estrellas promedio por quiz</span></div>
      </section>

      {students.length === 0 ? <p className="muted">Todavía no ha entrado ningún estudiante con este código.</p> : (
        <div className="grid-wrap">
          <table>
            <thead><tr>
              <th>Estudiante</th><th>XP</th><th>Última vez</th>
              {lessons.map((l) => <th key={l.id} className="l" title={l.title}>{l.label}</th>)}
              <th></th>
            </tr></thead>
            <tbody>{students.map((s, i) => (
              <tr key={s.id}>
                <td className="name">{s.name}<br /><small className="muted">Nivel {levelOf(s.xp).n}</small></td>
                <td>{s.xp}</td><td>{when(s.lastActive)}</td>
                {lessons.map((l) => {
                  const p = maps[i][l.id];
                  const st = p?.stars;
                  return <td key={l.id} className={'s ' + (st == null ? 'none' : 's' + st)} title={`${l.title}: ${st == null ? 'sin quiz' : st + ' estrellas'}${p?.act ? ', actividad hecha' : ''}`}>{st == null ? (p?.act ? '·' : '–') : st + '★'}</td>;
                })}
                <td style={{ whiteSpace: 'nowrap' }}><button className="btn ghost sm" onClick={() => resetPin(s)}>Cambiar PIN</button> <button className="btn danger sm" onClick={() => remove(s)}>Eliminar</button></td>
              </tr>
            ))}</tbody>
            <tfoot><tr>
              <td className="name">Promedio</td><td></td><td></td>
              {lessons.map((l) => {
                const xs = maps.map((m) => m[l.id]?.stars).filter((x): x is number => x != null);
                return <td key={l.id} className="s">{xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : '–'}</td>;
              })}
              <td></td>
            </tr></tfoot>
          </table>
        </div>
      )}
      <p className="muted" style={{ fontSize: '.85rem' }}>Cada celda muestra las estrellas del quiz (0 a 3). Un punto (·) indica que hizo la actividad pero aún no el quiz.</p>
    </>
  );
}
