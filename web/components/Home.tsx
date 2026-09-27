'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { GRADES, LESSON_BY_ID } from '@/content';
import { isDone } from '@/lib/game';
import { useQL } from './Providers';
import { gc } from './ui';

export function Home() {
  const { user, state, setGuestName, ready } = useQL();
  const [name, setName] = useState('');
  useEffect(() => setName(state.name), [state.name]);
  const last = state.last ? LESSON_BY_ID[state.last] : null;
  const display = user?.name || state.name;
  const myGrade = user?.role === 'student' ? user.grade : undefined;
  const grades = myGrade ? [...GRADES].sort((a, b) => (b.n === myGrade ? 1 : 0) - (a.n === myGrade ? 1 : 0)) : GRADES;

  return (
    <>
      <section className="hero">
        <span className="mono">Química para colegio · Grados 6° a 11° · Alineado a Estándares y DBA del MEN</span>
        <h1>{display ? `Hola, ${display}. ` : ''}¿Qué vamos a descubrir hoy?</h1>
        <p>Cada lección tiene tres momentos: aprende la idea, practícala en una actividad interactiva y demuestra lo que sabes. Ganas XP, subes de nivel y desbloqueas insignias.</p>
        {ready && !user && (
          <div className="namebox">
            <label htmlFor="nameIn" className="mono">Tu nombre</label>
            <input id="nameIn" maxLength={30} autoComplete="off" placeholder="Escribe tu nombre" value={name}
              onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') setGuestName(name.trim()); }} />
            <button className="btn ghost" onClick={() => setGuestName(name.trim())}>Guardar</button>
          </div>
        )}
      </section>

      {ready && !user && (
        <div className="notice row" style={{ justifyContent: 'space-between' }}>
          <span>¿Tu profe te dio un código de curso? Entra con él para que tu avance quede guardado y tu profe lo vea.</span>
          <Link className="btn" href="/entrar">Entrar con código</Link>
        </div>
      )}
      {user?.role === 'student' && (
        <div className="notice">Estás en el curso <b>{user.className}</b>. Tu avance se guarda en tu cuenta y tu profe lo puede ver.</div>
      )}
      {user?.role === 'teacher' && (
        <div className="notice row" style={{ justifyContent: 'space-between' }}>
          <span>Hola, profe. Aquí ves las lecciones como tus estudiantes. Activa “Modo docente” para ver guías y planes.</span>
          <Link className="btn" href="/docente">Ir a mis cursos</Link>
        </div>
      )}

      {last && (
        <div className="resume">
          <div><span className="mono">Continúa donde ibas</span><h3>{last.grade.n}° · {last.title}</h3></div>
          <Link className="btn" href={`/leccion/${last.id}`}>Continuar</Link>
        </div>
      )}

      <section className="grades">
        {grades.map((g) => {
          const ls = g.units.flatMap((u) => u.lessons);
          const d = ls.filter((l) => isDone(state.lessons, l.id)).length;
          return (
            <Link key={g.id} className="gcard" href={`/grado/${g.n}`} style={gc(g.id)}>
              <div className="gnum"><small>{g.n < 10 ? 'Básica' : 'Media'}</small><b>{g.n}°</b></div>
              <h3>{g.title}{g.n === myGrade ? ' · tu grado' : ''}</h3>
              <p>{g.desc}</p>
              <div className="gprog"><div className="bar"><i style={{ width: (d / ls.length) * 100 + '%' }} /></div>{d}/{ls.length}</div>
            </Link>
          );
        })}
      </section>
      <footer>QuimicaLearn. {user?.role === 'student' ? 'Tu progreso se guarda en tu cuenta.' : 'Sin cuenta, el progreso se guarda en este navegador.'} Basado en los Estándares Básicos de Competencias en Ciencias Naturales (MEN, 2004) y los DBA de Ciencias Naturales (MEN, 2016).</footer>
    </>
  );
}
