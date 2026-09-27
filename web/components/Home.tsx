'use client';
import Link from 'next/link';
import { GRADES, LESSON_BY_ID } from '@/content';
import { isDone } from '@/lib/game';
import { useQL } from './Providers';
import { gc } from './ui';

export function Home() {
  const { user, state, ready } = useQL();
  const last = state.last ? LESSON_BY_ID[state.last] : null;
  const display = user?.name || '';
  const myGrade = user?.role === 'student' ? user.grade : undefined;
  // Estudiante: solo su grado. Docente: todos. Sin cuenta: ninguno (solo la portada para entrar).
  const grades = user?.role === 'teacher' ? GRADES : myGrade ? GRADES.filter((g) => g.n === myGrade) : [];

  return (
    <>
      <section className="hero">
        <span className="mono">Química para colegio · Grados 6° a 11° · Alineado a Estándares y DBA del MEN</span>
        <h1>{display ? `Hola, ${display}. ` : ''}¿Qué vamos a descubrir hoy?</h1>
        <p>Cada lección tiene cuatro momentos: aprende la idea en 3D, practícala, juega dos minijuegos y demuestra lo que sabes. Ganas XP, subes de nivel y desbloqueas insignias.</p>
      </section>

      {ready && !user && (
        <section className="entry-cards">
          <div className="entry">
            <span className="mono">Soy estudiante</span>
            <h3>Tengo un código de curso</h3>
            <p>Si ya entraste antes, usa tu nombre y tu PIN. Si es tu primera vez, escribe el código que te dio tu profe.</p>
            <div className="row"><Link className="btn" href="/entrar#volver">Ya estoy inscrito</Link><Link className="btn ghost" href="/entrar#estudiante">Primera vez</Link></div>
          </div>
          <Link className="entry" href="/entrar#docente">
            <span className="mono">Soy docente</span>
            <h3>Crea tus cursos</h3>
            <p>Abre los módulos a tu ritmo, fija los intentos y mira el avance de cada estudiante.</p>
            <span className="btn ghost">Entrar como docente</span>
          </Link>
        </section>
      )}
      {user?.role === 'student' && (
        <div className="notice">Estás en el curso <b>{user.className}</b>. Tu avance se guarda en tu cuenta y tu profe lo puede ver. {user.units?.length ? <>Tienes <b>{user.units.length} {user.units.length === 1 ? 'módulo abierto' : 'módulos abiertos'}</b> en {user.grade}°.</> : <>Tu profe aún no ha abierto ningún módulo; mientras tanto puedes jugar en <Link href="/juegos">Juegos</Link>.</>}</div>
      )}
      {user?.role === 'teacher' && (
        <div className="notice row" style={{ justifyContent: 'space-between' }}>
          <span>Hola, profe. Aquí ves las lecciones como tus estudiantes. Activa “Guías docentes” para ver el plan del periodo y la guía de cada lección.</span>
          <Link className="btn" href="/docente">Ir a mis cursos</Link>
        </div>
      )}

      {user && last && (
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
      <footer>QuimicaLearn. {user?.role === 'student' ? 'Tu progreso se guarda en tu cuenta. ' : ''}Basado en los Estándares Básicos de Competencias en Ciencias Naturales (MEN, 2004) y los DBA de Ciencias Naturales (MEN, 2016).</footer>
    </>
  );
}
