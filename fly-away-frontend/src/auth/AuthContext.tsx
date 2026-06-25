import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import api, { errorMessage } from '../api';
import type { CurrentUser } from '../types';

interface AuthContextValue {
  token: string | null;
  user: CurrentUser | null;
  isAuthenticated: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<CurrentUser | null>(null);
  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    let cancelled = false;
    api
      .get<CurrentUser>('/users/current')
      .then((res) => {
        if (!cancelled) setUser(res.data);
      })
      .catch((err) => {
        console.warn('No se pudo cargar el usuario actual:', errorMessage(err));
        if (!cancelled) doLogout();
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function login(newToken: string) {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  }

  function doLogout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  const value: AuthContextValue = {
    token,
    user,
    isAuthenticated: !!token,
    login,
    logout: doLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
