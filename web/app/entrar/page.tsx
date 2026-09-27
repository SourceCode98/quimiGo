'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { useQL } from '@/components/Providers';
import { api } from '@/lib/api';

const SAVED = 'ql-estudiante';

function useSubmit() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const run = (fn: () => Promise<void>) => async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { await fn(); } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };
  return { busy, err, run };
}

export default function Entrar() {
  const { refresh } = useQL();
  const router = useRouter();
  const st = useSubmit(), tc = useSubmit();
  const [s, setS] = useState({ code: '', name: '', username: '', pin: '' });
  // "login": ya tengo usuario (usuario y PIN); "new": primera vez (código del curso, nombre, usuario nuevo y PIN).
  const [mode, setMode] = useState<'login' | 'new'>('login');
  // En este dispositivo se recuerda el usuario para que al volver solo pida el PIN.
  useEffect(() => {
    try {
      if (location.hash === '#estudiante') { setMode('new'); return; }
      const saved = JSON.parse(localStorage.getItem(SAVED) || 'null');
      if (saved?.username) setS((x) => ({ ...x, username: saved.username }));
    } catch { /* sin almacenamiento */ }
  }, []);
  const [t, setT] = useState({ email: '', password: '' });

  return (
    <>
      <section className="hero">
        <span className="mono">Cuentas</span>
        <h1>Entrar a QuimicaLearn</h1>
        <p>Los estudiantes entran con su usuario y PIN; la primera vez se inscriben con el código que les da su profe. Los docentes crean sus cursos y ven el avance de cada estudiante.</p>
      </section>
      <div className="auth">
        <form id="estudiante" className="card form" onSubmit={st.run(async () => {
          const r = await api<{ user: { username: string } }>(mode === 'login' ? '/student/login' : '/student/join',
            { body: mode === 'login' ? { username: s.username, pin: s.pin } : s });
          try { localStorage.setItem(SAVED, JSON.stringify({ username: r.user.username })); } catch { /* sin almacenamiento */ }
          await refresh(); router.push('/');
        })}>
          <h2>Soy estudiante</h2>
          <div className="seg" role="group" aria-label="¿Ya tienes usuario?">
            <button type="button" aria-pressed={mode === 'login'} onClick={() => setMode('login')}>Ya tengo usuario</button>
            <button type="button" aria-pressed={mode === 'new'} onClick={() => setMode('new')}>Es mi primera vez</button>
          </div>
          {mode === 'new' && <>
            <div className="field"><label htmlFor="code">Código del curso</label>
              <input id="code" className="code" required maxLength={6} autoComplete="off" value={s.code} onChange={(e) => setS({ ...s, code: e.target.value.toUpperCase() })} placeholder="ABC123" />
              <small>Te lo da tu profe. Solo se pide esta vez.</small></div>
            <div className="field"><label htmlFor="sname">Tu nombre y apellido</label>
              <input id="sname" required maxLength={60} autoComplete="name" value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} />
              <small>Así te verá tu profe en el panel.</small></div>
          </>}
          <div className="field"><label htmlFor="uname">{mode === 'new' ? 'Inventa tu usuario' : 'Tu usuario'}</label>
            <input id="uname" required minLength={3} maxLength={20} autoComplete="username" autoCapitalize="none" spellCheck={false} value={s.username}
              onChange={(e) => setS({ ...s, username: e.target.value.toLowerCase().replace(/\s/g, '') })} placeholder={mode === 'new' ? 'ej. cometa27' : ''} />
            {mode === 'new' && <small>Distinto a tu nombre: de 3 a 20 letras o números, sin espacios. Lo usarás para entrar siempre.</small>}</div>
          <div className="field"><label htmlFor="pin">{mode === 'new' ? 'Inventa un PIN de 4 números' : 'Tu PIN de 4 números'}</label>
            <input id="pin" required inputMode="numeric" pattern="\d{4}" maxLength={4} autoComplete={mode === 'new' ? 'new-password' : 'current-password'} value={s.pin} onChange={(e) => setS({ ...s, pin: e.target.value.replace(/\D/g, '') })} />
            <small>{mode === 'new' ? 'Guárdalo junto con tu usuario.' : 'Si olvidaste tu PIN, tu profe lo puede cambiar y ver tu usuario.'}</small></div>
          {st.err && <div className="fb no">{st.err}</div>}
          <button className="btn" disabled={st.busy}>{st.busy ? 'Entrando…' : mode === 'login' ? 'Entrar' : 'Inscribirme al curso'}</button>
        </form>

        <form id="docente" className="card form" onSubmit={tc.run(async () => {
          await api('/teacher/login', { body: { email: t.email, password: t.password } });
          await refresh(); router.push('/docente');
        })}>
          <h2>Soy docente</h2>
          <div className="field"><label htmlFor="email">Correo</label>
            <input id="email" type="email" required autoComplete="email" value={t.email} onChange={(e) => setT({ ...t, email: e.target.value })} /></div>
          <div className="field"><label htmlFor="pw">Contraseña</label>
            <input id="pw" type="password" required autoComplete="current-password" value={t.password} onChange={(e) => setT({ ...t, password: e.target.value })} /></div>
          {tc.err && <div className="fb no">{tc.err}</div>}
          <button className="btn" disabled={tc.busy}>{tc.busy ? 'Un momento…' : 'Entrar'}</button>
        </form>
      </div>
    </>
  );
}
