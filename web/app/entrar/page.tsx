'use client';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useQL } from '@/components/Providers';
import { api } from '@/lib/api';

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
  const [s, setS] = useState({ code: '', name: '', pin: '' });
  const [t, setT] = useState({ email: '', password: '' });

  return (
    <>
      <section className="hero">
        <span className="mono">Cuentas</span>
        <h1>Entrar a QuimicaLearn</h1>
        <p>Los estudiantes entran con el código que les da su profe. Los docentes crean sus cursos y ven el avance de cada estudiante.</p>
      </section>
      <div className="auth">
        <form className="card form" onSubmit={st.run(async () => {
          await api('/student/join', { body: s });
          await refresh(); router.push('/');
        })}>
          <h2>Soy estudiante</h2>
          <div className="field"><label htmlFor="code">Código del curso</label>
            <input id="code" className="code" required maxLength={6} autoComplete="off" value={s.code} onChange={(e) => setS({ ...s, code: e.target.value.toUpperCase() })} placeholder="ABC123" /></div>
          <div className="field"><label htmlFor="sname">Tu nombre y apellido</label>
            <input id="sname" required maxLength={60} autoComplete="name" value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} /></div>
          <div className="field"><label htmlFor="pin">PIN de 4 números</label>
            <input id="pin" required inputMode="numeric" pattern="\d{4}" maxLength={4} autoComplete="off" value={s.pin} onChange={(e) => setS({ ...s, pin: e.target.value.replace(/\D/g, '') })} />
            <small>La primera vez lo inventas tú. Después lo usas para volver a entrar.</small></div>
          {st.err && <div className="fb no">{st.err}</div>}
          <button className="btn" disabled={st.busy}>{st.busy ? 'Entrando…' : 'Entrar al curso'}</button>
        </form>

        <form className="card form" onSubmit={tc.run(async () => {
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
