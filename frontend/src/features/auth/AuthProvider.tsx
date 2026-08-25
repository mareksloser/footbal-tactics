import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react';
import { api } from '@/api';
import { readSession, writeSession } from '@/api/session';
import type { Session } from '@/api/types';

interface AuthContextValue {
  session: Session | null;
  isEditor: boolean;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readSession());

  const login = useCallback(async (password: string) => {
    const next = await api.login(password);
    writeSession(next);
    setSession(next);
  }, []);

  const logout = useCallback(async () => {
    await api.logout().catch(() => undefined);
    writeSession(null);
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ session, isEditor: session !== null, login, logout }),
    [session, login, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const value = use(AuthContext);
  if (!value) throw new Error('useAuth musí být uvnitř AuthProvider');
  return value;
}
