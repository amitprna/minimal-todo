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

  // Signed in → exit guest mode automatically
  useEffect(() => { if (user) setIsGuest(false); }, [user]);

  // Warn before close if guest has tasks
  useEffect(() => {
    if (!isGuest) return;
    const handler = (e: BeforeUnloadEvent) => {
      const tasks = JSON.parse(localStorage.getItem('japandi-tasks') || '[]');
      if (tasks.length > 0) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isGuest]);

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg-main)',
        color: 'var(--text-muted)', fontSize: '0.95rem', letterSpacing: '0.08em', gap: '0.75rem',
      }}>
        <span className="loading-dot-anim" />
        Loading…
      </div>
    );
  }

  if (!user && !isGuest) {
    return <AuthScreen onContinueAsGuest={() => setIsGuest(true)} />;
  }

  // Pass setIsGuest(false) down so App can show the auth screen from anywhere
  return (
    <>
      {isGuest && !user ? (
        // Wrap children in a context-like approach — pass onSignIn via a hidden global
        (() => {
          (window as any).__requestSignIn = () => setIsGuest(false);
          return children;
        })()
      ) : (
        (() => { delete (window as any).__requestSignIn; return children; })()
      )}
    </>
  );
}
