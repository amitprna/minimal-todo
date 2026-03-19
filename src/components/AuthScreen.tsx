import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import './AuthScreen.css';

type Screen = 'signin' | 'signup' | 'confirm';

export default function AuthScreen() {
  const { signIn, signUp, confirmCode, error } = useAuth();
  const [screen, setScreen] = useState<Screen>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const displayError = localError || error;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setLoading(true);
    try {
      await signIn(email, password);
    } catch {
      // error shown via auth context
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (password.length < 8) { setLocalError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      const next = await signUp(email, password);
      if (next === 'CONFIRM_SIGN_UP') setScreen('confirm');
    } catch {
      // error shown via auth context
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setLoading(true);
    try {
      await confirmCode(email, code);
      // After confirming, sign in automatically
      await signIn(email, password);
    } catch {
      // error shown via auth context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-dot" />
          <span className="auth-logo-text">Moments</span>
        </div>

        {screen === 'signin' && (
          <>
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Sign in to your moments</p>
            <form onSubmit={handleSignIn} className="auth-form">
              <input className="auth-input" type="email" placeholder="Email" value={email}
                onChange={e => setEmail(e.target.value)} required autoFocus />
              <input className="auth-input" type="password" placeholder="Password" value={password}
                onChange={e => setPassword(e.target.value)} required />
              {displayError && <p className="auth-error">{displayError}</p>}
              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
            <p className="auth-switch">
              No account? <button className="auth-link" onClick={() => setScreen('signup')}>Sign up</button>
            </p>
          </>
        )}

        {screen === 'signup' && (
          <>
            <h1 className="auth-title">Create account</h1>
            <p className="auth-subtitle">Start tracking your moments</p>
            <form onSubmit={handleSignUp} className="auth-form">
              <input className="auth-input" type="email" placeholder="Email" value={email}
                onChange={e => setEmail(e.target.value)} required autoFocus />
              <input className="auth-input" type="password" placeholder="Password (min. 8 chars)" value={password}
                onChange={e => setPassword(e.target.value)} required />
              {displayError && <p className="auth-error">{displayError}</p>}
              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? 'Creating account…' : 'Sign up'}
              </button>
            </form>
            <p className="auth-switch">
              Have an account? <button className="auth-link" onClick={() => setScreen('signin')}>Sign in</button>
            </p>
          </>
        )}

        {screen === 'confirm' && (
          <>
            <h1 className="auth-title">Check your email</h1>
            <p className="auth-subtitle">We sent a verification code to {email}</p>
            <form onSubmit={handleConfirm} className="auth-form">
              <input className="auth-input" type="text" placeholder="6-digit code" value={code}
                onChange={e => setCode(e.target.value)} required autoFocus maxLength={6} />
              {displayError && <p className="auth-error">{displayError}</p>}
              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? 'Verifying…' : 'Confirm'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
