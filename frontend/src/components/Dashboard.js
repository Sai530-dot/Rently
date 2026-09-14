import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PropertyImage } from './BrowseProperties';
import { api } from '../services/api';

const money = value => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(Number(value) || 0);

function DashboardPropertyCard({ property, onNavigate }) {
  const bedrooms = property.bedrooms == null ? 'Beds unconfirmed' : property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} bed${property.bedrooms === 1 ? '' : 's'}`;
  return <article className="dashboard-property-card">
    <button className="dashboard-property-image" onClick={() => onNavigate('browse-properties')} aria-label={`Browse properties including ${property.title}`}><PropertyImage property={property} /></button>
    <button className="dashboard-property-copy" onClick={() => onNavigate('browse-properties')}>
      <strong>{money(property.rent)} <small>/ month</small></strong>
      <span>{property.city || 'Location unavailable'}</span>
      <small>{bedrooms} · {property.property_type || 'Type unconfirmed'}</small>
    </button>
  </article>;
}

function RoommatePreview({ match, onNavigate }) {
  const initial = (match.name || '?').trim().charAt(0).toUpperCase() || '?';
  return <button className="dashboard-roommate" onClick={() => onNavigate('roommate-matching')}>
    <span className="dashboard-avatar">{match.image ? <img src={match.image} alt="" onError={event => { event.currentTarget.hidden = true; }} /> : initial}</span>
    <span><strong>{match.name || 'Student profile'}</strong><small>{[match.city, match.major].filter(Boolean).join(' · ') || 'Profile details available'}</small></span>
  </button>;
}

export default function Dashboard({ userProfile, onNavigate }) {
  const landlord = userProfile.user_type === 'landlord';
  const [data, setData] = useState({ listings: null, saved: null, unread: null, properties: [], matches: [] });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    const requests = [api.getProperties(landlord), api.getSavedProperties(), api.getConversations()];
    if (!landlord) requests.push(api.matchRoommates());
    const [propertiesResult, savedResult, conversationsResult, matchesResult] = await Promise.allSettled(requests);
    const properties = propertiesResult.status === 'fulfilled' ? propertiesResult.value.properties || [] : [];
    const saved = savedResult.status === 'fulfilled' ? savedResult.value.properties || [] : [];
    const conversations = conversationsResult.status === 'fulfilled' ? conversationsResult.value.conversations || [] : [];
    const matches = matchesResult?.status === 'fulfilled' ? matchesResult.value.matches || [] : [];
    setData({
      listings: propertiesResult.status === 'fulfilled' ? properties.length : null,
      saved: savedResult.status === 'fulfilled' ? saved.length : null,
      unread: conversationsResult.status === 'fulfilled' ? conversations.reduce((sum, conversation) => sum + (Number(conversation.unread) || 0), 0) : null,
      properties,
      matches,
    });
    const failed = [propertiesResult, savedResult, conversationsResult].find(result => result.status === 'rejected');
    if (failed) setError(failed.reason?.message || 'Some dashboard information could not be loaded.');
  }, [landlord]);

  useEffect(() => { load(); }, [load]);

  const recommendations = useMemo(() => {
    const city = String(userProfile.preferences?.city || '').trim().toLowerCase();
    const budget = Number(userProfile.preferences?.budget || 0);
    const relevance = property => {
      let score = 0;
      if (city && String(property.city || '').trim().toLowerCase() === city) score += 2;
      if (budget > 0 && Number(property.rent) <= budget) score += 1;
      return score;
    };
    return [...data.properties].sort((first, second) => relevance(second) - relevance(first)).slice(0, 3);
  }, [data.properties, userProfile.preferences]);

  if (landlord) return <main className="workspace">
    <header className="page-heading"><div><p className="eyebrow">MAKE ROOM FOR WHAT'S NEXT</p><h1>Welcome, {userProfile.firstName}</h1><p>Your rental properties and tenant conversations, all in one place.</p></div><button onClick={() => onNavigate('settings')}>Edit profile</button></header>
    {error && <p role="alert" className="notice error">{error} <button onClick={load}>Retry</button></p>}
    <div className="summary-grid">
      <button className="panel metric" onClick={() => onNavigate('my-properties')}><strong>{data.listings ?? '—'}</strong><span>Your listings</span></button>
      <button className="panel metric" onClick={() => onNavigate('saved-properties')}><strong>{data.saved ?? '—'}</strong><span>Saved properties</span></button>
      <button className="panel metric" onClick={() => onNavigate('messages')}><strong>{data.unread ?? '—'}</strong><span>Unread messages</span></button>
    </div>
    <section className="hero-panel"><p className="eyebrow">READY FOR YOUR NEXT TENANT?</p><h2>Give your property a new beginning.</h2><p>Create a listing, keep it up to date, and respond to enquiries.</p><button className="primary" onClick={() => onNavigate('my-properties')}>Manage properties →</button></section>
    <div className="summary-grid">
      <button className="panel feature-card" onClick={() => onNavigate('rent-map')}><h2>Explore the map</h2><p>Browse rentals by location and compare asking rents.</p></button>
      <button className="panel feature-card" onClick={() => onNavigate('messages')}><h2>Keep in touch</h2><p>Continue conversations with roommates and landlords.</p></button>
    </div>
  </main>;

  return <main className="workspace dashboard-workspace">
    <header className="dashboard-heading"><div><h1>Welcome, {userProfile.firstName}</h1><p>Find your next place and the right people to share it with.</p></div></header>
    {error && <p role="alert" className="notice error">{error} <button onClick={load}>Retry</button></p>}
    {!userProfile.preferences?.completed && <section className="dashboard-profile-prompt"><div><strong>Complete your profile</strong><p>Share your preferences to improve your roommate matches.</p></div><button onClick={() => onNavigate('settings')}>Complete profile →</button></section>}

    <section className="dashboard-stat-grid" aria-label="Your activity">
      <button className="panel dashboard-stat" onClick={() => onNavigate('browse-properties')}><strong>{data.listings ?? '—'}</strong><span>Listings</span></button>
      <button className="panel dashboard-stat" onClick={() => onNavigate('saved-properties')}><strong>{data.saved ?? '—'}</strong><span>Saved homes</span></button>
      <button className="panel dashboard-stat" onClick={() => onNavigate('messages')}><strong>{data.unread ?? '—'}</strong><span>Messages</span></button>
    </section>

    <section className="dashboard-section">
      <div className="dashboard-section-heading"><div><h2>Recommended for you</h2><p>Listings that best fit your saved location and budget preferences.</p></div><button onClick={() => onNavigate('browse-properties')}>View all →</button></div>
      {recommendations.length ? <div className="dashboard-property-grid">{recommendations.map(property => <DashboardPropertyCard key={property.id} property={property} onNavigate={onNavigate} />)}</div> : <div className="panel dashboard-empty"><p>There are no available listings to recommend yet.</p><button onClick={() => onNavigate('browse-properties')}>Browse properties</button></div>}
    </section>

    <section className="dashboard-section">
      <div className="dashboard-section-heading"><div><h2>Your tools</h2><p>Explore places, compare rent, and meet potential roommates.</p></div></div>
      <div className="dashboard-tools-grid">
        <button className="panel dashboard-tool" onClick={() => onNavigate('rent-map')}><h3>Explore map</h3><p>Browse rentals by location.</p></button>
        <button className="panel dashboard-tool" onClick={() => onNavigate('offer-evaluator')}><h3>Evaluate offer</h3><p>See how a rent offer compares.</p></button>
        <button className="panel dashboard-tool" onClick={() => onNavigate('roommate-matching')}><h3>Find roommates</h3><p>Discover compatible students.</p></button>
      </div>
    </section>

    <section className="dashboard-section">
      <div className="dashboard-section-heading"><div><h2>Roommate matches</h2><p>Students available through your saved matching preferences.</p></div><button onClick={() => onNavigate('roommate-matching')}>View all →</button></div>
      {data.matches.length ? <div className="dashboard-roommate-grid">{data.matches.slice(0, 3).map(match => <RoommatePreview key={match.id} match={match} onNavigate={onNavigate} />)}</div> : <div className="panel dashboard-empty dashboard-empty-inline"><p>No roommate matches are available yet.</p><button onClick={() => onNavigate('roommate-matching')}>Update preferences</button></div>}
    </section>
  </main>;
}
