'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LESSON_BY_ID } from '@/content';
import { BADGES, levelOf } from '@/lib/game';
import { useQL } from './Providers';

// allowed = false apaga la clase aunque esté guardada (ej. las guías docentes solo con sesión de docente).
function useToggle(cls: string, key: string, allowed = true) {
  const [on, setOn] = useState(false);
  useEffect(() => { try { setOn(localStorage.getItem(key) === '1'); } catch { /* */ } }, [key]);
  useEffect(() => { document.body.classList.toggle(cls, on && allowed); window.dispatchEvent(new Event('resize')); }, [cls, on, allowed]);
  return [on, () => setOn((v) => { try { localStorage.setItem(key, v ? '0' : '1'); } catch { /* */ } return !v; })] as const;
}

function Crumbs() {
  const p = usePathname();
  const parts: { href?: string; label: string }[] = [];
  const g = p.match(/^\/grado\/(\d+)/);
  const l = p.match(/^\/leccion\/([\w]+)/);
  if (g) parts.push({ label: `${g[1]}°` });
  else if (l && LESSON_BY_ID[l[1]]) {
    const ls = LESSON_BY_ID[l[1]];
    parts.push({ href: `/grado/${ls.grade.n}`, label: `${ls.grade.n}°` }, { label: ls.title });
  } else if (p.startsWith('/docente/clase')) parts.push({ href: '/docente', label: 'Mis cursos' }, { label: 'Curso' });
  else if (p.startsWith('/docente')) parts.push({ label: 'Mis cursos' });
  else if (p.startsWith('/entrar')) parts.push({ label: 'Entrar' });
  else if (p.startsWith('/juegos')) parts.push({ label: 'Juegos' });
  else if (p.startsWith('/reto/')) { const n = p.match(/^\/reto\/g(\d+)/); parts.push({ href: '/juegos', label: 'Juegos' }, ...(n ? [{ href: `/grado/${n[1]}`, label: `${n[1]}°` }] : []), { label: 'Reto' }); }
  return (
    <nav className="crumbs" aria-label="Ubicación">
      {parts.map((x, i) => (
        <span key={i} className="row" style={{ gap: 6 }}>
          <span>/</span>{x.href ? <Link href={x.href}>{x.label}</Link> : <span>{x.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function TopBar() {
  const { user, state, badges, logout, ready } = useQL();
  const router = useRouter();
  const [big, toggleBig] = useToggle('big', 'ql-p-big');
  const isTeacher = user?.role === 'teacher';
  const [teacher, toggleTeacher] = useToggle('docente', 'ql-p-docente', isTeacher);
  const [open, setOpen] = useState(false);
  const lv = levelOf(state.xp);
  return (
    <>
      <div className="top">
        <div className="top-in">
          <Link className="brand" href="/">Quimica<span>Learn</span></Link>
          <Crumbs />
          <div className="hud">
            {user && <Link className="pill" href="/juegos" style={{ textDecoration: 'none' }}>Juegos</Link>}
            {user?.role === 'student' && (
              <>
                <div className="lvl">
                  <div className="lvl-row"><span>Nivel {lv.n} · {lv.name}</span><b>{state.xp} XP</b></div>
                  <div className="bar"><i style={{ width: lv.pct + '%' }} /></div>
                </div>
                <button className="pill" onClick={() => setOpen(true)}>Insignias <b>{badges.size}/{BADGES.length}</b></button>
              </>
            )}
            <button className="pill" aria-pressed={big} onClick={toggleBig}>Texto grande</button>
            {isTeacher && <button className="pill" aria-pressed={teacher} onClick={toggleTeacher}>Guías docentes</button>}
            {ready && (user ? (
              <span className="who">
                {user.role === 'teacher' ? <Link className="pill" href="/docente">Mis cursos</Link> : <span className="muted">{user.name}</span>}
                <button className="pill" onClick={async () => { await logout(); router.push('/'); }}>Salir</button>
              </span>
            ) : <><Link className="pill" href="/entrar" style={{ textDecoration: 'none' }}>Entrar</Link><Link className="pill" href="/entrar#docente" style={{ textDecoration: 'none' }}>Soy docente</Link></>)}
          </div>
        </div>
      </div>
      {open && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="panel" role="dialog" aria-label="Insignias">
            <div className="row" style={{ justifyContent: 'space-between' }}><h2>Tus insignias</h2><button className="btn ghost" onClick={() => setOpen(false)}>Cerrar</button></div>
            <div className="bgrid">
              {BADGES.map((b) => (
                <div key={b.id} className={'bdg' + (badges.has(b.id) ? ' on' : '')}><span className="ic">{b.ic}</span><b>{b.t}</b><span>{b.d}</span></div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

