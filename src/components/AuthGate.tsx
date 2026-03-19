import { useAuth } from '../hooks/useAuth';
import AuthScreen from './AuthScreen';

/**
 * Renders children only when a user is signed in.
 * Shows a loading state while Amplify restores the session.
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-main)',
        color: 'var(--text-muted)',
        fontSize: '0.95rem',
        letterSpacing: '0.05em',
      }}>
        Loading…
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  return <>{children}</>;
}
