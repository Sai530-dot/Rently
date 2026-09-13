import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
export default function Dashboard({ userProfile, onNavigate }) {
  const landlord = userProfile.user_type === 'landlord';
  const [counts, setCounts] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      const [properties, saved, conversations] = await Promise.all([api.getProperties(landlord), api.getSavedProperties(), api.getConversations()]);
      setCounts({ listings: properties.properties.length, saved: saved.properties.length, unread: conversations.conversations.reduce((sum, c) => sum + c.unread, 0) });
    } catch (err) { setError(err.message); }
  }, [landlord]);
  useEffect(() => { load(); }, [load]);
  return <main className="workspace">
    <header className="page-heading"><div><p className="eyebrow">MAKE ROOM FOR WHAT'S NEXT</p><h1>Welcome, {userProfile.firstName}</h1><p>{landlord ? 'Your rental properties and tenant conversations, all in one place.' : 'Find a place to call home, and people to share it with.'}</p></div><button onClick={() => onNavigate('settings')}>Edit profile</button></header>
    {error && <p role="alert" className="notice error">{error} <button onClick={load}>Retry</button></p>}
    {!userProfile.preferences.completed && <p className="notice">Complete your profile to start finding roommates. <button onClick={() => onNavigate('settings')}>Complete profile</button></p>}
    <div className="summary-grid">
      <button className="panel metric" onClick={() => onNavigate(landlord ? 'my-properties' : 'browse-properties')}><strong>{counts?.listings ?? '—'}</strong><span>{landlord ? 'Your listings' : 'Available listings'}</span></button>
      <button className="panel metric" onClick={() => onNavigate('saved-properties')}><strong>{counts?.saved ?? '—'}</strong><span>Saved properties</span></button>
      <button className="panel metric" onClick={() => onNavigate('messages')}><strong>{counts?.unread ?? '—'}</strong><span>Unread messages</span></button>
    </div>
    <section className="hero-panel"><p className="eyebrow">{landlord ? 'READY FOR YOUR NEXT TENANT?' : 'YOUR NEXT CHAPTER STARTS HERE'}</p><h2>{landlord ? 'Give your property a new beginning.' : 'A better place. The right people.'}</h2><p>{landlord ? 'Create a listing, keep it up to date, and respond to enquiries.' : 'Explore rentals across Canada and connect with students in your city.'}</p><button className="primary" onClick={() => onNavigate(landlord ? 'my-properties' : 'browse-properties')}>{landlord ? 'Manage properties' : 'Explore properties'} →</button></section>
    <div className="summary-grid">
      {!landlord && <button className="panel feature-card" onClick={() => onNavigate('roommate-matching')}><h2>Find roommates</h2><p>Discover students with compatible preferences in {userProfile.preferences.city || 'your city'}.</p></button>}
      <button className="panel feature-card" onClick={() => onNavigate('rent-map')}><h2>Explore the map</h2><p>Browse rentals by location and compare asking rents.</p></button>
      <button className="panel feature-card" onClick={() => onNavigate('messages')}><h2>Keep in touch</h2><p>Continue conversations with roommates and landlords.</p></button>
    </div>
  </main>;
}
