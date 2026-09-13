import React, { useState } from 'react';
import { api } from '../services/api';

export default function SettingsPage({ userProfile, onBack, onSave }) {
  const student = userProfile.user_type === 'student';
  const prefs = userProfile.preferences;
  const [form, setForm] = useState({ ...prefs, firstName: userProfile.firstName, interests: prefs.interests.join(', ') });
  const [passwords, setPasswords] = useState({ currentPassword: '', password: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const change = e => setForm({ ...form, [e.target.name]: e.target.value });
  const save = async e => {
    e.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const { user } = await api.savePreferences({ ...form, budget: Number(form.budget), numRoommates: Number(form.numRoommates), interests: form.interests.split(',').map(v => v.trim()).filter(Boolean), completed: true });
      onSave(user); setNotice('Your profile has been saved.');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const changePassword = async e => {
    e.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      if (passwords.password !== passwords.confirm) throw new Error('Passwords do not match.');
      const data = await api.changePassword(passwords); setNotice(data.message);
      setPasswords({ currentPassword: '', password: '', confirm: '' });
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <main className="workspace">
    <header className="page-heading"><div><p className="eyebrow">YOUR ACCOUNT</p><h1>{prefs.completed ? 'Profile & settings' : 'Complete your profile'}</h1><p>{student ? 'Help potential roommates get to know you.' : 'Manage your public profile and account.'}</p></div><button onClick={onBack}>Dashboard</button></header>
    {error && <p className="notice error" role="alert">{error}</p>}
    {notice && <p className="notice" role="status">{notice}</p>}
    <form className="panel form-grid" onSubmit={save}>
      <label>Display name<input name="firstName" value={form.firstName} maxLength={150} onChange={change} required /></label>
      <label>Email<input value={userProfile.email} readOnly /></label>
      <label className="wide">Profile photo URL (optional)<input name="avatar" type="url" value={form.avatar} maxLength={2000} onChange={change} placeholder="https://…" /></label>
      <label className="wide">About you<textarea name="bio" value={form.bio} maxLength={500} onChange={change} rows={3} /></label>
      {student && <>
        <label>Monthly budget (CAD)<input name="budget" type="number" min="1" max="100000" step="0.01" value={form.budget || ''} onChange={change} required /></label>
        <label>Preferred city<input name="city" maxLength={100} value={form.city} onChange={change} placeholder="Saskatoon" required /></label>
        <label>Cleanliness<select name="cleanliness" value={form.cleanliness} onChange={change}><option value="messy">Relaxed</option><option value="moderate">Moderate</option><option value="clean">Clean</option><option value="very_clean">Very clean</option></select></label>
        <label>Sleep schedule<select name="sleepSchedule" value={form.sleepSchedule} onChange={change}><option value="early_bird">Early bird</option><option value="flexible">Flexible</option><option value="night_owl">Night owl</option></select></label>
        <label>Number of roommates<input name="numRoommates" type="number" min="1" max="10" value={form.numRoommates} onChange={change} required /></label>
        <label>Major (optional)<input name="major" maxLength={100} value={form.major} onChange={change} /></label>
        <label className="wide">Interests, separated by commas<input name="interests" value={form.interests} onChange={change} placeholder="Cooking, hiking, music" /></label>
      </>}
      <div className="wide"><button className="primary" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button></div>
    </form>
    <form className="panel form-grid" onSubmit={changePassword}>
      <h2 className="wide">Change password</h2>
      {['currentPassword', 'password', 'confirm'].map((name, index) => <label key={name}>{['Current password', 'New password', 'Confirm new password'][index]}<input type="password" autoComplete={index ? 'new-password' : 'current-password'} minLength={index ? 8 : undefined} maxLength={128} value={passwords[name]} onChange={e => setPasswords({ ...passwords, [name]: e.target.value })} required /></label>)}
      <div className="wide"><button disabled={busy}>Update password</button></div>
    </form>
  </main>;
}
