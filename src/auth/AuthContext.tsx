import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  GithubAuthProvider,
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { auth } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signInGoogle: () => Promise<void>;
  signInGithub: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function adminEmails(): string[] {
  return (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map((email: string) => email.trim().toLowerCase()).filter(Boolean);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, nextUser => {
    setUser(nextUser);
    setLoading(false);
    if (nextUser) {
      void setDoc(doc(db, 'users', nextUser.uid), { uid: nextUser.uid, email: nextUser.email || null, displayName: nextUser.displayName || null, lastLoginAt: new Date().toISOString() }, { merge: true });
    }
  }), []);
  const isAdmin = Boolean(user?.email && adminEmails().includes(user.email.toLowerCase()));
  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    isAdmin,
    signInGoogle: async () => { await signInWithPopup(auth, new GoogleAuthProvider()); },
    signInGithub: async () => { await signInWithPopup(auth, new GithubAuthProvider()); },
    signInEmail: async (email, password) => { await signInWithEmailAndPassword(auth, email, password); },
    logout: async () => { await signOut(auth); }
  }), [user, loading, isAdmin]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth precisa estar dentro de AuthProvider');
  return value;
}
