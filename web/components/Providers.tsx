'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { applyResult, BADGES, earnedBadges, levelOf, todayBogota, type Lessons, type Rec } from '@/lib/game';

export type User =
  | { role: 'teacher'; id: string; name: string }
  | { role: 'student'; id: string; name: string; className?: string; grade?: number; units?: string[] };

type Local = { name: string; xp: number; lessons: Lessons; days: string[]; grades: string[]; last: string | null };
const EMPTY: Local = { name: '', xp: 0, lessons: {}, days: [], grades: [], last: null };
const GUEST_KEY = 'ql-plataforma';
const read = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? { ...d, ...JSON.parse(v) } : d; } catch { return d; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };

type Ctx = {
  ready: boolean;
  user: User | null;
  /** true cuando el progreso se guarda en el servidor (estudiante con sesión). */
  synced: boolean;
  state: Local;
  badges: Set<string>;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  setGuestName: (n: string) => void;
  visit: (lessonId: string, gradeId: string) => void;
  record: (lessonId: string, input: { act?: boolean; stars?: number }) => Promise<void>;
  toast: (msg: string) => void;
  /** Un estudiante solo abre los módulos (unidades) que su docente habilitó; docentes e invitados, todos. */
  canOpen: (unitId: string) => boolean;
};

const C = createContext<Ctx | null>(null);
export const useQL = () => {
  const c = useContext(C);
  if (!c) throw new Error('useQL fuera de <Providers>');
  return c;
};

export function Providers({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<Local>(EMPTY);
  const [msg, setMsg] = useState('');
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const synced = user?.role === 'student';
  const extraKey = synced ? `ql-extra-${user.id}` : GUEST_KEY;

  const toast = useCallback((m: string) => {
    setMsg(m); setShow(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setShow(false), 2600);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const me = await api<{ user: User | null; xp?: number; days?: string[]; progress?: Lessons }>('/me');
      setUser(me.user);
      if (me.user?.role === 'student') {
        const extra = read(`ql-extra-${me.user.id}`, { grades: [] as string[], last: null as string | null });
        setState({ name: me.user.name, xp: me.xp || 0, lessons: me.progress || {}, days: me.days || [], grades: extra.grades, last: extra.last });
      } else setState(read(GUEST_KEY, EMPTY));
    } catch {
      // Sin servidor la plataforma sigue funcionando en modo invitado.
      setUser(null);
      setState(read(GUEST_KEY, EMPTY));
    }
    setReady(true);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const persist = useCallback((s: Local) => {
    if (synced) write(extraKey, { grades: s.grades, last: s.last });
    else write(GUEST_KEY, s);
  }, [synced, extraKey]);

  const badges = useMemo(() => earnedBadges(state), [state]);
  const announce = useCallback((before: Local, after: Local, gained: number, why: string) => {
    const lb = levelOf(before.xp), la = levelOf(after.xp);
    if (la.n > lb.n) toast(`¡Subiste a nivel ${la.n}: ${la.name}!`);
    else if (gained) toast(`+${gained} XP · ${why}`);
    const b0 = earnedBadges(before), b1 = earnedBadges(after);
    const fresh = BADGES.filter((b) => b1.has(b.id) && !b0.has(b.id));
    if (fresh.length) setTimeout(() => toast('Nueva insignia: ' + fresh.map((b) => b.t).join(', ')), gained ? 1400 : 0);
  }, [toast]);

  const visit = useCallback((lessonId: string, gradeId: string) => {
    setState((s) => {
      const next = { ...s, last: lessonId, grades: s.grades.includes(gradeId) ? s.grades : [...s.grades, gradeId], days: synced || s.days.includes(todayBogota()) ? s.days : [...s.days, todayBogota()] };
      persist(next);
      if (!s.grades.includes(gradeId) || next.days.length !== s.days.length) announce(s, next, 0, '');
      return next;
    });
  }, [persist, announce, synced]);

  const record = useCallback(async (lessonId: string, input: { act?: boolean; stars?: number }) => {
    const why = input.act ? 'Actividad completada' : `${input.stars} de 3 correctas`;
    if (synced) {
      try {
        const r = await api<{ xp: number; gained: number; record: Rec }>('/progress', { body: { lessonId, ...input } });
        setState((s) => {
          const today = todayBogota();
          const next = { ...s, xp: r.xp, lessons: { ...s.lessons, [lessonId]: r.record }, days: s.days.includes(today) ? s.days : [...s.days, today] };
          announce(s, next, r.gained, why);
          if (!r.gained && input.stars !== undefined && s.lessons[lessonId]?.stars == null) toast('Lección registrada');
          return next;
        });
      } catch (e) {
        toast((e as Error).message + ' Tu avance no se guardó.');
      }
      return;
    }
    setState((s) => {
      const { next: rec, gained } = applyResult(s.lessons[lessonId], input);
      const next = { ...s, xp: s.xp + gained, lessons: { ...s.lessons, [lessonId]: rec } };
      persist(next);
      announce(s, next, gained, why);
      if (!gained && input.stars !== undefined && s.lessons[lessonId]?.stars == null) toast('Lección registrada');
      return next;
    });
  }, [synced, persist, announce, toast]);

  const setGuestName = useCallback((name: string) => setState((s) => { const n = { ...s, name }; persist(n); return n; }), [persist]);

  const logout = useCallback(async () => {
    try { await api('/logout', { method: 'POST' }); } catch { /* se limpia igual */ }
    setUser(null);
    setState(read(GUEST_KEY, EMPTY));
  }, []);

  const canOpen = useCallback((unitId: string) => user?.role !== 'student' || !!user.units?.includes(unitId), [user]);

  const value = useMemo<Ctx>(() => ({ ready, user, synced, state, badges, refresh, logout, setGuestName, visit, record, toast, canOpen }),
    [ready, user, synced, state, badges, refresh, logout, setGuestName, visit, record, toast, canOpen]);

  return (
    <C.Provider value={value}>
      {children}
      <div className={'toast' + (show ? ' show' : '')} role="status">{msg}</div>
    </C.Provider>
  );
}
