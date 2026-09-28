import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  GoogleAuthProvider,
  GithubAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

type AppUser = {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  provider: 'email' | 'google' | 'github';
};

type AuthContextValue = {
  user: AppUser | null;
  loading: boolean;
  isAdmin: boolean;
  signInGoogle: () => Promise<void>;
  signInGithub: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function adminEmails(): string[] {
  return (import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((email: string) => email.trim().toLowerCase())
    .filter(Boolean);
}

function providerName(user: User): AppUser['provider'] {
  const id = user.providerData[0]?.providerId;
  if (id === 'google.com') return 'google';
  if (id === 'github.com') return 'github';
  return 'email';
}

function mapUser(user: User): AppUser {
  return {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'Usuário',
    photoURL: user.photoURL,
    provider: providerName(user),
  };
}

async function ensureProfile(user: User) {
  await setDoc(
    doc(db, 'usuarios', user.uid),
    {
      uid: user.uid,
      nome: user.displayName || user.email?.split('@')[0] || '',
      email: user.email || '',
      fotoURL: user.photoURL || null,
      ultimoLoginEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    },
    { merge: true },
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          setUser(null);
          return;
        }
        await ensureProfile(firebaseUser);
        setUser(mapUser(firebaseUser));
      } catch (error) {
        console.error('[FirebaseAuth] Falha ao carregar perfil:', error);
        setUser(firebaseUser ? mapUser(firebaseUser) : null);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const persistAfterAuth = async (firebaseUser: User) => {
    await ensureProfile(firebaseUser);
    setUser(mapUser(firebaseUser));
  };

  const value = useMemo<AuthContextValue>(() => {
    const isAdmin = Boolean(user?.email && adminEmails().includes(user.email.toLowerCase()));

    return {
      user,
      loading,
      isAdmin,

      signInGoogle: async () => {
        const result = await signInWithPopup(auth, new GoogleAuthProvider());
        await persistAfterAuth(result.user);
      },

      signInGithub: async () => {
        const result = await signInWithPopup(auth, new GithubAuthProvider());
        await persistAfterAuth(result.user);
      },

      signInEmail: async (email, password) => {
        const normalized = email.trim();
        if (!normalized || password.length < 6) {
          throw new Error('Informe um e-mail válido e uma senha com pelo menos 6 caracteres.');
        }

        try {
          const result = await signInWithEmailAndPassword(auth, normalized, password);
          await persistAfterAuth(result.user);
        } catch (error: any) {
          if (error?.code === 'auth/user-not-found') {
            const result = await createUserWithEmailAndPassword(auth, normalized, password);
            if (!result.user.displayName) {
              await updateProfile(result.user, {
                displayName: normalized.split('@')[0],
              });
            }
            await persistAfterAuth(result.user);
            return;
          }
          throw error;
        }
      },

      logout: async () => {
        await signOut(auth);
        setUser(null);
      },
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth precisa estar dentro de AuthProvider');
  return value;
}
