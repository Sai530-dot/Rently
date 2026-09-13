import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
export default function RoommateMatching({ userProfile, onBack, onNavigate, onContact }) {
  const [data, setData] = useState({ matches: [], liked: [], passes: 0 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = async () => {
    setError('');
    try { setData(await api.matchRoommates()); } catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  useEffect(() => { if (userProfile.user_type === 'student') load(); else setLoading(false); }, [userProfile.user_type]);
  const act = async action => {
    setBusy(true); setError('');
    try { await action(); await load(); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const contact = async id => { setBusy(true); try { await onContact(id); } catch (err) { setError(err.message); } finally { setBusy(false); } };
  const current = data.matches[0];
  return <main className="workspace">
    <header className="page-heading"><div><p className="eyebrow">GOOD PEOPLE, SHARED SPACE</p><h1>Find your roommates</h1><p>Students in {userProfile.preferences.city || 'your city'}, ranked by your saved preferences.</p></div><button onClick={onBack}>Dashboard</button></header>
    {error && <p className="notice error" role="alert">{error} <button onClick={load}>Retry</button> <button onClick={() => onNavigate('settings')}>Edit preferences</button></p>}
    {userProfile.user_type !== 'student' ? <p className="notice">Roommate matching is available to student accounts.</p> : loading ? <p role="status">Finding roommates…</p> : <>
      <div className="roommate-layout">
        <section className="panel roommate-card">
          {current ? <><div className="avatar-large">{current.image ? <img src={current.image} alt={current.name} onError={e => { e.currentTarget.style.display = 'none'; }} /> : current.name[0]}</div><p className="tag">{current.match_score}% preference compatibility</p><h2>{current.name}</h2><p>{current.city}{current.major ? ' · ' + current.major : ''}</p><p className="rental-price">${current.rent_ask} / month</p><p>{current.cleanliness.replaceAll('_', ' ')} · {current.sleep_schedule.replaceAll('_', ' ')}</p><p>{current.bio || 'This student has not added a bio yet.'}</p><div className="action-row">{current.interests.map(i => <span className="tag" key={i}>{i}</span>)}</div><div className="action-row"><button disabled={busy} onClick={() => act(() => api.decideRoommate(current.id, false))}>Pass</button><button className="primary" disabled={busy} onClick={() => act(() => api.decideRoommate(current.id, true))}>Like profile</button></div><small>{data.matches.length} profiles remaining</small></> :
            <div className="empty-state"><h2>You're all caught up</h2><p>New students will appear here when they complete profiles in your city.</p><button onClick={() => onNavigate('settings')}>Update preferences</button>{data.passes > 0 && <button disabled={busy} onClick={() => act(api.resetPasses)}>Review passed profiles</button>}</div>}
        </section>
        <section className="panel"><h2>Liked profiles</h2><p className="muted">A mutual match means you both liked each other.</p>{!data.liked.length && <p>No liked profiles yet.</p>}{data.liked.map(p => <article className="connection-row" key={p.id}><div><h3>{p.name}</h3><p>{p.mutual ? 'Mutual match' : 'Liked by you'} · ${p.rent_ask}/mo</p></div><button disabled={busy} onClick={() => contact(p.id)}>Message</button></article>)}</section>
      </div>
    </>}
  </main>;
}
