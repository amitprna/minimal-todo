import { useState, useEffect, createContext, useContext } from 'react';
import {
  signIn,
  signUp,
  signOut,
  confirmSignUp,
  getCurrentUser,
  type AuthUser,
} from 'aws-amplify/auth';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<'CONFIRM_SIGN_UP' | 'DONE'>;
  confirmCode: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    setError(null);
    try {
      await signIn({ username: email, password });
      const u = await getCurrentUser();
      setUser(u);
    } catch (e: unknown) {
      setError((e as Error).message);
      throw e;
    }
  };

  const handleSignUp = async (email: string, password: string): Promise<'CONFIRM_SIGN_UP' | 'DONE'> => {
    setError(null);
    try {
      const result = await signUp({ username: email, password });
      if (result.nextStep.signUpStep === 'CONFIRM_SIGN_UP') return 'CONFIRM_SIGN_UP';
      return 'DONE';
    } catch (e: unknown) {
      setError((e as Error).message);
      throw e;
    }
  };

  const handleConfirm = async (email: string, code: string) => {
    setError(null);
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
    } catch (e: unknown) {
      setError((e as Error).message);
      throw e;
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      signIn: handleSignIn,
      signUp: handleSignUp,
      confirmCode: handleConfirm,
      signOut: handleSignOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
