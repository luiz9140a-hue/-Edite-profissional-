import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type LocalUser = {
  uid: string;
  email: string;
  displayName: string;
  provider: 'email' | 'google-local' | 'github-local';
};

type AuthContextValue = {
  user: LocalUser | null;
  loading: boolean;
  isAdmin: boolean;
  signInGoogle: () => Promise<void>;
  signInGithub: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const STORAGE_KEY = 'engrenagem-local-user';
const AuthContext = createContext<AuthContextValue | null>(null);

function adminEmails(): string[] {
  return (import.meta.env.VITE_ADMIN_EMAILS || import.meta.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email: string) => email.trim().toLowerCase())
    .filter(Boolean);
}

function makeUser(email: string, provider: LocalUser['provider'], displayName?: string): LocalUser {
  const normalized = email.trim().toLowerCase();
  return {
    uid: `local-${btoa(normalized).replace(/[^a-z0-9]/gi, '').slice(0, 24)}`,
    email: normalized,
    displayName: displayName || normalized.split('@')[0] || 'Usuário',
    provider
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setUser(JSON.parse(saved) as LocalUser);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const persist = (nextUser: LocalUser) => {
    setUser(nextUser);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
  };

  const isAdmin = Boolean(user?.email && adminEmails().includes(user.email.toLowerCase()));
  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    isAdmin,
    signInGoogle: async () => persist(makeUser('google.local@engrenagem.ai', 'google-local', 'Usuário Google')),
    signInGithub: async () => persist(makeUser('github.local@engrenagem.ai', 'github-local', 'Usuário GitHub')),
    signInEmail: async (email, password) => {
      if (!email.trim() || password.length < 6) throw new Error('Informe um e-mail e uma senha com pelo menos 6 caracteres.');
      persist(makeUser(email, 'email'));
    },
    logout: async () => {
      setUser(null);
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }), [user, loading, isAdmin]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth precisa estar dentro de AuthProvider');
  return value;
}
