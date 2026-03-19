import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import './AuthScreen.css';

type Screen = 'signin' | 'signup' | 'confirm' | 'req_reset' | 'confirm_reset';

export default function AuthScreen() {
  const { signIn, signUp, confirmCode, reqPasswordReset, confirmPasswordReset, error } = useAuth();
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

  const handleReqReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setLoading(true);
    try {
      await reqPasswordReset(email);
      setScreen('confirm_reset');
    } catch {
      // error shown via auth context
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (password.length < 8) { setLocalError('New password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await confirmPasswordReset(email, code, password);
      // Auto sign in with new password
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
          <span className="auth-logo-text">Minimal-ToDo</span>
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
              <button className="auth-link text-sm" onClick={() => setScreen('req_reset')}>Forgot password?</button>
            </p>
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

        {screen === 'req_reset' && (
          <>
            <h1 className="auth-title">Reset password</h1>
            <p className="auth-subtitle">Enter your email to receive a code</p>
            <form onSubmit={handleReqReset} className="auth-form">
              <input className="auth-input" type="email" placeholder="Email" value={email}
                onChange={e => setEmail(e.target.value)} required autoFocus />
              {displayError && <p className="auth-error">{displayError}</p>}
              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? 'Sending link…' : 'Send code'}
              </button>
            </form>
            <p className="auth-switch">
              Remember your password? <button className="auth-link" onClick={() => setScreen('signin')}>Sign in</button>
            </p>
          </>
        )}

        {screen === 'confirm_reset' && (
          <>
            <h1 className="auth-title">New password</h1>
            <p className="auth-subtitle">Enter the code sent to {email}</p>
            <form onSubmit={handleConfirmReset} className="auth-form">
              <input className="auth-input" type="text" placeholder="6-digit code" value={code}
                onChange={e => setCode(e.target.value)} required autoFocus maxLength={6} />
              <input className="auth-input" type="password" placeholder="New password" value={password}
                onChange={e => setPassword(e.target.value)} required />
              {displayError && <p className="auth-error">{displayError}</p>}
              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? 'Resetting…' : 'Reset password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
