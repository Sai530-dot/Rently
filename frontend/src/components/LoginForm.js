import React, { useState } from 'react';
import { api } from '../services/api';

export default function LoginForm({ userType = 'student', onBack, onShowSignup, onLoginSuccess, resetParts }) {
  const [form, setForm] = useState({ email: '', password: '', confirm: '', remember: false });
  const [forgot, setForgot] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const change = e => setForm({ ...form, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const submit = async e => {
    e.preventDefault(); setError(''); setNotice(''); setBusy(true);
    try {
      if (resetParts) {
        if (form.password !== form.confirm) throw new Error('Passwords do not match.');
        const data = await api.confirmPassword({ uid: resetParts[0], token: resetParts[1], password: form.password });
        setNotice(data.message);
      } else if (forgot) {
        const data = await api.resetPassword({ email: form.email }); setNotice(data.message);
      } else {
        const { user } = await api.login({ ...form, user_type: userType });
        onLoginSuccess(user);
      }
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <div className="login-form-container">
    <div className="welcome-text"><h2>{resetParts ? 'Choose a new password' : forgot ? 'Reset your password' : 'Welcome back, ' + userType}</h2><p>{forgot ? 'Enter your account email to receive a reset link.' : 'Find your next place with Reelty.'}</p></div>
    <form className="login-form" onSubmit={submit}>
      {error && <p className="notice error" role="alert">{error}</p>}
      {notice && <p className="notice" role="status">{notice}</p>}
      {!resetParts && <div className="form-group"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={change} required /></div>}
      {!forgot && <div className="form-group"><label htmlFor="password">{resetParts ? 'New password' : 'Password'}</label><input id="password" name="password" type="password" autoComplete={resetParts ? 'new-password' : 'current-password'} minLength={resetParts ? 8 : undefined} maxLength={128} value={form.password} onChange={change} required /></div>}
      {resetParts && <div className="form-group"><label htmlFor="confirm">Confirm password</label><input id="confirm" name="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={change} required /></div>}
      {!forgot && !resetParts && <div className="form-options"><label><input name="remember" type="checkbox" checked={form.remember} onChange={change} /> Remember me</label><button type="button" className="text-button" onClick={() => { setForgot(true); setError(''); }}>Forgot password?</button></div>}
      <button className="login-button" disabled={busy}>{busy ? 'Please wait…' : resetParts ? 'Update password' : forgot ? 'Send reset link' : 'Sign in'}</button>
    </form>
    <div className="back-button-container"><button className="back-button" onClick={() => { if (forgot) { setForgot(false); setNotice(''); setError(''); } else onBack(); }}>← Back</button></div>
    {!forgot && !resetParts && <p className="signup-link">New to Reelty? <button className="text-button" onClick={onShowSignup}>Create an account</button></p>}
  </div>;
}
