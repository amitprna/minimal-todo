import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import AuthScreen from './AuthScreen';

/**
 * Renders children when a user is signed in, shows a "Loading…" state
 * while Amplify restores the session, or allows guest usage.
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [isGuest, setIsGuest] = useState(false);

  // Show beforeunload warning if guest has data (handled in App via window.onbeforeunload)
  useEffect(() => {
    if (isGuest) {
      const handler = (e: BeforeUnloadEvent) => {
        const hasData = localStorage.getItem('japandi-tasks');
        const tasks = hasData ? JSON.parse(hasData) : [];
        if (tasks.length > 0) {
          e.preventDefault();
          e.returnValue = 'You have unsaved tasks. Sign in to keep your data!';
        }
      };
      window.addEventListener('beforeunload', handler);
      return () => window.removeEventListener('beforeunload', handler);
    }
  }, [isGuest]);

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
        letterSpacing: '0.08em',
        gap: '0.75rem',
      }}>
        <span className="loading-dot-anim" />
        Loading…
      </div>
    );
  }

  if (!user && !isGuest) {
    return <AuthScreen onContinueAsGuest={() => setIsGuest(true)} />;
  }

  return <>{children}</>;
}
