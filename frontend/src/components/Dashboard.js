import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PropertyImage } from './BrowseProperties';
import { api } from '../services/api';

const money = value => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(Number(value) || 0);
const iconPaths = {
  listings: 'M4 5h16v14H4z M4 9h16',
  saved: 'M12 20l-7-7a4 4 0 0 1 5.7-5.6L12 8.7l1.3-1.3A4 4 0 0 1 19 13z',
  messages: 'M4 6h16v10H7l-3 3z',
  map: 'M6 3l5 2 7-2v16l-7 2-5-2V3Zm5 2v16',
  evaluate: 'M6 4h12M9 8h6M8 12h8M10 16h4',
  roommates: 'M8 13a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm8 0a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM3 19.5c0-2.2 2.7-3.5 5-3.5s5 1.3 5 3.5M11 19.5c0-2.2 2.7-3.5 5-3.5s5 1.3 5 3.5',
};

function DashboardIcon({ name }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={iconPaths[name]} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function DashboardPropertyCard({ property, onNavigate }) {
  const bedrooms = property.bedrooms == null ? 'Beds unconfirmed' : property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} bed${property.bedrooms === 1 ? '' : 's'}`;
  return <button className="dashboard-property-card" onClick={() => onNavigate('browse-properties')} aria-label={`Browse properties including ${property.title}`}>
    <PropertyImage property={property} />
    <span className="dashboard-property-copy">
      <strong>{money(property.rent)} <small>/ month</small></strong>
      <span>{property.city || 'Location unavailable'}</span>
      <small>{bedrooms} &middot; {property.property_type || 'Type unconfirmed'}</small>
    </span>
  </button>;
}

function RoommatePreview({ match, onNavigate }) {
  const initial = (match.name || '?').trim().charAt(0).toUpperCase() || '?';
  return <button className="dashboard-roommate" onClick={() => onNavigate('roommate-matching')}>
    <span className="dashboard-avatar">{match.image ? <img src={match.image} alt="" onError={event => { event.currentTarget.hidden = true; }} /> : initial}</span>
    <span><strong>{match.name || 'Student profile'}</strong><small>{[match.city, match.major].filter(Boolean).join(' / ') || 'Profile details available'}</small></span>
  </button>;
}

function DashboardStat({ icon, value, label, onClick }) {
  return <button className="panel dashboard-stat" onClick={onClick}>
    <span className="dashboard-icon-box"><DashboardIcon name={icon} /></span>
    <strong>{value}</strong>
    <span>{label}</span>
    <small>Browse &rarr;</small>
  </button>;
}

function DashboardTool({ icon, title, description, onClick }) {
  return <button className="panel dashboard-tool" onClick={onClick}>
    <span className="dashboard-icon-box"><DashboardIcon name={icon} /></span>
    <span><h3>{title}</h3><p>{description}</p></span>
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
    return [...data.properties].sort((first, second) => relevance(second) - relevance(first)).slice(0, 4);
  }, [data.properties, userProfile.preferences]);

  if (landlord) return <main className="workspace">
    <header className="page-heading"><div><p className="eyebrow">MAKE ROOM FOR WHAT'S NEXT</p><h1>Welcome, {userProfile.firstName}</h1><p>Your rental properties and tenant conversations, all in one place.</p></div><button onClick={() => onNavigate('settings')}>Edit profile</button></header>
    {error && <p role="alert" className="notice error">{error} <button onClick={load}>Retry</button></p>}
    <div className="summary-grid">
      <button className="panel metric" onClick={() => onNavigate('my-properties')}><strong>{data.listings ?? '—'}</strong><span>Your listings</span></button>
      <button className="panel metric" onClick={() => onNavigate('saved-properties')}><strong>{data.saved ?? '—'}</strong><span>Saved properties</span></button>
      <button className="panel metric" onClick={() => onNavigate('messages')}><strong>{data.unread ?? '—'}</strong><span>Unread messages</span></button>
    </div>
    <section className="hero-panel"><p className="eyebrow">READY FOR YOUR NEXT TENANT?</p><h2>Give your property a new beginning.</h2><p>Create a listing, keep it up to date, and respond to enquiries.</p><button className="primary" onClick={() => onNavigate('my-properties')}>Manage properties &rarr;</button></section>
    <div className="summary-grid">
      <button className="panel feature-card" onClick={() => onNavigate('rent-map')}><h2>Explore the map</h2><p>Browse rentals by location and compare asking rents.</p></button>
      <button className="panel feature-card" onClick={() => onNavigate('messages')}><h2>Keep in touch</h2><p>Continue conversations with roommates and landlords.</p></button>
    </div>
  </main>;

  return <main className="workspace dashboard-workspace">
    <header className="dashboard-heading"><div><h1>Welcome, {userProfile.firstName}</h1><p>Find your next place and the right people to share it with.</p></div></header>
    {error && <p role="alert" className="notice error">{error} <button onClick={load}>Retry</button></p>}
    {!userProfile.preferences?.completed && <section className="dashboard-profile-prompt"><div><strong>Complete your profile</strong><p>Share your preferences to improve your roommate matches.</p></div><button onClick={() => onNavigate('settings')}>Complete profile &rarr;</button></section>}

    <section className="dashboard-stat-grid" aria-label="Your activity">
      <DashboardStat icon="listings" value={data.listings ?? '—'} label="Listings" onClick={() => onNavigate('browse-properties')} />
      <DashboardStat icon="saved" value={data.saved ?? '—'} label="Saved homes" onClick={() => onNavigate('saved-properties')} />
      <DashboardStat icon="messages" value={data.unread ?? '—'} label="Messages" onClick={() => onNavigate('messages')} />
    </section>

    <section className="dashboard-section dashboard-recommendations">
      <div className="dashboard-section-heading"><div><h2>Recommended for you</h2><p>Listings that best fit your saved location and budget preferences.</p></div><button onClick={() => onNavigate('browse-properties')}>View all &rarr;</button></div>
      {recommendations.length ? <div className="dashboard-property-grid">{recommendations.map(property => <DashboardPropertyCard key={property.id} property={property} onNavigate={onNavigate} />)}</div> : <div className="panel dashboard-empty"><p>There are no available listings to recommend yet.</p><button onClick={() => onNavigate('browse-properties')}>Browse properties</button></div>}
    </section>

    <section className="dashboard-section">
      <div className="dashboard-section-heading"><div><h2>Your tools</h2><p>Explore places, compare rent, and meet potential roommates.</p></div></div>
      <div className="dashboard-tools-grid">
        <DashboardTool icon="map" title="Explore map" description="Browse rentals by location." onClick={() => onNavigate('rent-map')} />
        <DashboardTool icon="evaluate" title="Evaluate offer" description="See how a rent offer compares." onClick={() => onNavigate('offer-evaluator')} />
        <DashboardTool icon="roommates" title="Find roommates" description="Discover compatible students." onClick={() => onNavigate('roommate-matching')} />
      </div>
    </section>

    <section className="dashboard-section">
      <div className="dashboard-section-heading"><div><h2>Roommate matches</h2><p>Students available through your saved matching preferences.</p></div><button onClick={() => onNavigate('roommate-matching')}>View all &rarr;</button></div>
      {data.matches.length ? <div className="dashboard-roommate-grid">{data.matches.slice(0, 3).map(match => <RoommatePreview key={match.id} match={match} onNavigate={onNavigate} />)}</div> : <div className="panel dashboard-empty dashboard-empty-inline"><p>No roommate matches are available yet.</p><button onClick={() => onNavigate('roommate-matching')}>Update preferences</button></div>}
    </section>
  </main>;
}
