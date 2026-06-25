import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import api, { errorMessage } from '../api';
import type { CurrentUser } from '../types';

interface AuthContextValue {
  token: string | null;
  user: CurrentUser | null;
  /** Nombre que el usuario ingresó al registrarse (no viene del backend). */
  displayName: string | null;
  isAuthenticated: boolean;
  login: (token: string, displayName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(() =>
    localStorage.getItem('displayName')
  );
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

  async function login(newToken: string, name?: string) {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    if (name) {
      localStorage.setItem('displayName', name);
      setDisplayName(name);
    }
  }

  function doLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('displayName');
    setToken(null);
    setUser(null);
    setDisplayName(null);
  }

  const value: AuthContextValue = {
    token,
    user,
    displayName,
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
