import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, getToken, setToken } from './api.ts';

export type AuthUser = { id: string; email: string; name: string };

type AuthSession = { token: string; user: AuthUser };

type AuthValue = {
  user: AuthUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthValue>({
  user: null,
  ready: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  const applySession = (session: AuthSession) => {
    setToken(session.token);
    setUser(session.user);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setReady(true);
      return;
    }
    api
      .me()
      .then((json) => setUser(json as AuthUser))
      .catch(() => logout())
      .finally(() => setReady(true));

    const onLogout = () => setUser(null);
    window.addEventListener('auth-logout', onLogout);
    return () => window.removeEventListener('auth-logout', onLogout);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        login: async (email, password) => {
          const session = (await api.login({ email, password })) as AuthSession;
          applySession(session);
        },
        register: async (email, password, name) => {
          const session = (await api.register({ email, password, name })) as AuthSession;
          applySession(session);
        },
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
