import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
export default function SignupForm({ userType, onBack, onShowLogin, onSignupSuccess }) {
  const student = userType === 'student-signup';
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', university: '', phone: '', company: '' });
  const [universities, setUniversities] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { api.getUniversities().then(data => setUniversities(data.universities)).catch(() => {}); }, []);
  const change = e => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = async e => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      if (form.password !== form.confirm) throw new Error('Passwords do not match.');
      const data = await (student ? api.studentSignup(form) : api.landlordSignup(form));
      onSignupSuccess(data.user);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <div className="login-form-container">
    <div className="welcome-text"><h2>Create {student ? 'student' : 'landlord'} account</h2><p>{student ? 'Find a home and people to share it with.' : 'Publish rentals and connect with tenants.'}</p></div>
    <form className="login-form" onSubmit={submit}>
      {error && <p className="notice error" role="alert">{error}</p>}
      <div className="form-group"><label htmlFor="name">Full name</label><input id="name" name="name" value={form.name} maxLength={150} autoComplete="name" onChange={change} required /></div>
      <div className="form-group"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" maxLength={254} autoComplete="email" value={form.email} onChange={change} required /></div>
      {student ? <div className="form-group"><label htmlFor="university">University / school</label><input id="university" name="university" list="universities" maxLength={255} value={form.university} onChange={change} required /><datalist id="universities">{universities.map(u => <option key={u.name} value={u.name} />)}</datalist></div> :
        <><div className="form-group"><label htmlFor="phone">Phone number</label><input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={20} value={form.phone} onChange={change} required /></div><div className="form-group"><label htmlFor="company">Company (optional)</label><input id="company" name="company" maxLength={255} value={form.company} onChange={change} /></div></>}
      <div className="form-group"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} value={form.password} onChange={change} required /><small>Use at least 8 characters. Avoid common passwords and personal details.</small></div>
      <div className="form-group"><label htmlFor="confirm">Confirm password</label><input id="confirm" name="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={change} required /></div>
      <button className="login-button" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
    </form>
    <button className="back-button" onClick={onBack}>← Back</button>
    <p className="signup-link">Already have an account? <button className="text-button" onClick={onShowLogin}>Sign in</button></p>
  </div>;
}
