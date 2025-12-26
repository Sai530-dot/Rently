import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import realListings from '../data/real_listings.json';
import craigslistData from '../data/craigslist_listings.json';
import kijijiData from '../data/kijiji_listings.json';

const SCRAPED_LISTINGS = [...craigslistData, ...kijijiData];

const Dashboard = ({ userProfile, userPreferences, onNavigate, appearance = 'light', onToggleAppearance }) => {
  const firstName = userProfile?.firstName || 'Student';
  const [matches, setMatches] = useState([]);
  const [allListings, setAllListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [avgRent, setAvgRent] = useState(0);
  
  const [profileForm, setProfileForm] = useState({
    avatar: userProfile?.avatar || '',
  });
  const isDarkMode = appearance === 'dark';

  const effectiveUserId = userProfile?.id || userProfile?.email || 'anon';
  const storedPrefs = (() => {
    try {
      const namespaced = localStorage.getItem(`rently_user_preferences_${effectiveUserId}`);
      const legacy = localStorage.getItem('rently_user_preferences');
      return JSON.parse(namespaced || legacy || 'null');
    } catch {
      return null;
    }
  })();
  const storedProfileForm = (() => {
    try {
      return JSON.parse(localStorage.getItem(`rently_profile_form_${effectiveUserId}`) || 'null');
    } catch {
      return null;
    }
  })();
  const resolvedBudget = userPreferences?.budget ?? storedPrefs?.budget ?? storedProfileForm?.budget ?? '';

  const getBudgetCap = () => {
    const budget = parseInt(resolvedBudget, 10);
    return Number.isFinite(budget) ? budget + 200 : 1700;
  };

  const getPrice = (item) => {
    const value = item.price ?? item.rent;
    const numeric = typeof value === 'string' ? parseInt(value.replace(/[^\d]/g, ''), 10) : value;
    return Number.isFinite(numeric) ? numeric : 0;
  };

  const getTagList = (item) => {
    if (Array.isArray(item.tags) && item.tags.length) return item.tags;
    if (Array.isArray(item.amenities) && item.amenities.length) return item.amenities;
    if (item.distance) return [item.distance];
    return [];
  };

  const getListingLocation = (item) => item.address || item.location || 'See details';
  const isImageUrl = (src) => typeof src === 'string' && src.startsWith('http');

  const shortLocation = (loc) => {
    const parseLocString = (locStr) => {
      try { return JSON.parse(locStr.replace(/'/g, '"')); } catch { return null; }
    };
    if (!loc) return '';
    let locObj = loc;
    if (typeof locObj === 'string') {
      if (!locObj.includes('address_line1')) return locObj;
      const parsed = parseLocString(locObj);
      if (parsed) locObj = parsed; else return locObj;
    }
    if (locObj.address_line1 && locObj.address_line2) return `${locObj.address_line1}, ${locObj.address_line2}`;
    if (locObj.address_line1 && locObj.city) return `${locObj.address_line1}, ${locObj.city}`;
    if (locObj.formatted) return locObj.formatted;
    if (locObj.city) return locObj.city;
    return '';
  };

  // Load saved matches once
  useEffect(() => {
    const namespacedKey = `rently_matches_user_${effectiveUserId}`;
    const savedMatches = JSON.parse(localStorage.getItem(namespacedKey) || localStorage.getItem('rently_matches') || '[]');
    setMatches(savedMatches.slice(0, 3));
  }, [effectiveUserId]);

  // Load saved profile avatar/bio from localStorage
  useEffect(() => {
    const savedProfile = (() => {
      try { return JSON.parse(localStorage.getItem(`rently_profile_form_${effectiveUserId}`) || 'null'); } catch { return null; }
    })();
    if (savedProfile?.avatar && !profileForm.avatar) {
      setProfileForm((prev) => ({ ...prev, avatar: savedProfile.avatar, bio: savedProfile.bio }));
    }
  }, [effectiveUserId, profileForm.avatar]);

  // Fetch property inventory for the dashboard
  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/properties`);
        const data = await response.json();
        if (data.success && data.properties) {
          setAllListings(data.properties);
          return;
        }
      } catch (error) {
        console.error('Dashboard property fetch failed, using local data.', error);
      }

      const fallbackListings = SCRAPED_LISTINGS.length > 0 ? SCRAPED_LISTINGS : realListings;
      setAllListings(fallbackListings);
    };

    fetchListings();
  }, []);

  // Filter listings based on budget preference
  useEffect(() => {
    if (allListings.length === 0) {
      setFilteredListings([]);
      setAvgRent(0);
      return;
    }

    const budgetCap = getBudgetCap();
    const relevantListings = allListings.filter((item) => {
      const price = getPrice(item);
      return price > 0 && price <= budgetCap;
    });

    const sortedListings = [...relevantListings].sort((a, b) => getPrice(a) - getPrice(b));

    if (sortedListings.length > 0) {
      const total = sortedListings.reduce((sum, item) => sum + getPrice(item), 0);
      setAvgRent(Math.round(total / sortedListings.length));
    } else {
      setAvgRent(0);
    }

    setFilteredListings(sortedListings.slice(0, 5)); 
  }, [allListings, userPreferences]);

  const convKey = `rently_conversations_user_${effectiveUserId}`;

  // Enable drag-to-swipe for horizontal tracks on mobile
  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth > 768) return undefined;

    const tracks = document.querySelectorAll('.stats-grid, .listing-grid, .match-stack');
    const cleanups = [];

    tracks.forEach((el) => {
      if (!el) return;
      let isDown = false;
      let startX = 0;
      let scrollLeft = 0;

      const start = (evt) => {
        isDown = true;
        startX = (evt.touches ? evt.touches[0].pageX : evt.pageX) || 0;
        scrollLeft = el.scrollLeft;
        el.style.cursor = 'grabbing';
      };

      const move = (evt) => {
        if (!isDown) return;
        const x = (evt.touches ? evt.touches[0].pageX : evt.pageX) || 0;
        el.scrollLeft = scrollLeft - (x - startX);
        if (evt.cancelable) evt.preventDefault();
      };

      const end = () => {
        isDown = false;
        el.style.cursor = 'grab';
      };

      el.addEventListener('mousedown', start);
      el.addEventListener('touchstart', start, { passive: true });
      el.addEventListener('mousemove', move);
      el.addEventListener('touchmove', move, { passive: false });
      el.addEventListener('mouseleave', end);
      el.addEventListener('mouseup', end);
      el.addEventListener('touchend', end);

      cleanups.push(() => {
        el.removeEventListener('mousedown', start);
        el.removeEventListener('touchstart', start);
        el.removeEventListener('mousemove', move);
        el.removeEventListener('touchmove', move);
        el.removeEventListener('mouseleave', end);
        el.removeEventListener('mouseup', end);
        el.removeEventListener('touchend', end);
      });
    });

    return () => cleanups.forEach((fn) => fn && fn());
  }, []);

  const handleConnect = (matchProfile) => {
    const existingConvs = JSON.parse(localStorage.getItem(convKey) || '[]');
    let conversation = existingConvs.find(c => c.id === matchProfile.id);

    if (!conversation) {
      conversation = {
        id: matchProfile.id,
        name: matchProfile.name,
        avatar: matchProfile.avatar || matchProfile.image || 'user',
        major: matchProfile.major || 'Student',
        matchScore: matchProfile.match_score || 95,
        lastMessage: 'Matched via Dashboard!',
        timestamp: 'Just now',
        unread: 0,
        online: true
      };
      localStorage.setItem(convKey, JSON.stringify([conversation, ...existingConvs]));
    }

    onNavigate('messages');
  };

  return (
    <div className={`dashboard-wrapper ${isDarkMode ? 'dark' : 'light'}`}>
      <main className="main-feed">
        {/* --- DASHBOARD HEADER (Centered on Mobile) --- */}
        <header className="feed-header">
          <div>
            <h1>Dashboard</h1>
            <div className="date-display">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </header>

        {/* --- STATS GRID (Horizontal Scroll & Centered Text on Mobile) --- */}
        <div className="stats-grid">
          <div className="glass-card stat-card">
            <div className="stat-label">Your Budget</div>
            <div className="stat-val">
              {resolvedBudget ? `$${resolvedBudget}` : 'Not Set'}
            </div>
            <div className="progress-bg">
              <div 
                className="progress-fill" 
                style={{width: `${Math.min(((parseInt(resolvedBudget, 10) || 0) / 3000) * 100, 100)}%`}}
              ></div>
            </div>
          </div>
          
          <div className="glass-card stat-card">
            <div className="stat-label">Your Matches</div>
            <div className="stat-val">{matches.length}</div>
            <div className="avatar-group">
              {matches.slice(0, 3).map((m, i) => (
                <span key={i} className="mini-avatar">{m.image || 'user'}</span>
              ))}
              {matches.length === 0 && <span className="no-matches-text">Start matching!</span>}
            </div>
          </div>

          <div className="glass-card stat-card">
            <div className="stat-label">Avg Market Rent</div>
            <div className="stat-val">${avgRent || 1100}</div>
            <div className="trend-up">
              {userPreferences?.budget && avgRent > userPreferences.budget 
                ? <span style={{color: '#EF4444'}}>Market is High</span>
                : <span>Good Buying Power</span>
              }
            </div>
          </div>
        </div>

        {/* --- LISTINGS (Horizontal Scroll & Centered Text on Mobile) --- */}
        <section className="section-block">
          <div className="section-header">
            <h3>{`Homes under $${getBudgetCap()}`}</h3>
            <button 
              className="link-btn" 
              onClick={() => onNavigate('browse-properties')}
            >
              See All
            </button>
          </div>
          
          <div className="listing-grid">
            {filteredListings.length > 0 ? (
              filteredListings.map(item => {
                const tags = getTagList(item);
                const price = getPrice(item);
                const hasImageUrl = isImageUrl(item.image);

                return (
                  <div key={item.id} className="glass-card listing-card">
                    <div 
                      className="card-image-area"
                      style={{
                        backgroundImage: hasImageUrl ? `url(${item.image})` : undefined,
                        backgroundSize: hasImageUrl ? 'cover' : undefined,
                        backgroundPosition: 'center'
                      }}
                    >
                      {!hasImageUrl && (
                        <span className="card-emoji">{item.image || 'Home'}</span>
                      )}
                    </div>
                    <div className="card-content">
                      <h4>{item.title}</h4>
                      <div className="location-line">{getListingLocation(item)}</div>
                      <div className="price-tag">
                        {price ? `$${price.toLocaleString()}/mo` : 'Price on request'}
                      </div>
                      <div className="tag-row">
                        {tags.length > 0 ? (
                          tags.slice(0, 3).map(t => <span key={t} className="tag-pill">{t}</span>)
                        ) : (
                          <span className="tag-pill muted">New</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-placeholder">
                <p>No listings found in this budget range.</p>
                <button className="text-btn" onClick={() => onNavigate('browse-properties')}>Browse All</button>
              </div>
            )}
          </div>
        </section>

        {/* --- MATCHES (Horizontal Scroll & Centered Text on Mobile) --- */}
        <section className="section-block">
          <div className="section-header">
            <h3>Recent Matches</h3>
            <button 
              className="link-btn" 
              onClick={() => onNavigate('roommate-matching')}
            >
              Find More
            </button>
          </div>

          <div className="match-stack">
            {matches.length > 0 ? (
              matches.map(match => (
                <div key={match.id} className="glass-card match-row">
                  <div className="match-avatar">{match.avatar || match.image || 'user'}</div>
                  <div className="match-details">
                    <h4>{match.name}</h4>
                    <p>{shortLocation(match.city || match.location)}</p>
                    <p className="muted-line">Budget: ${match.rent_ask || match.budget_max || match.budget || '—'}/mo</p>
                  </div>
                  <button 
                    className="primary-btn"
                    onClick={() => handleConnect(match)}
                  >
                    Connect
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-matches">
                <p>No matches yet! Go swipe on some profiles.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <style>{`
        .dashboard-wrapper {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          font-family: 'Inter', sans-serif;
          background-color: #F3F4F6; 
        }

        .main-feed {
          padding: 30px 40px;
          overflow-y: auto;
          flex: 1; 
        }
        .feed-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }
        .feed-header h1 { margin: 0; font-size: 2rem; color: #111827; letter-spacing: -0.5px; }
        .date-display { color: #6B7280; font-size: 0.95rem; margin-top: 5px; font-weight: 500; }

        .glass-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.03);
          border: 1px solid rgba(255,255,255,0.6);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .glass-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.06); }

        /* --- Default Desktop Grid --- */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }
        .stat-card { padding: 20px; display: flex; flex-direction: column; justify-content: space-between; height: 140px; }
        .stat-label { color: #6B7280; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .stat-val { font-size: 2rem; font-weight: 700; color: #111827; margin: 10px 0; }
        .progress-bg { width: 100%; height: 6px; background: #E5E7EB; border-radius: 10px; overflow: hidden; }
        .progress-fill { height: 100%; background: #3B82F6; border-radius: 10px; transition: width 0.5s ease; }
        .avatar-group { display: flex; padding-left: 8px; align-items: center; }
        .mini-avatar { width: 28px; height: 28px; background: #E0E7FF; border-radius: 50%; border: 2px solid white; margin-left: -8px; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; }
        .no-matches-text { font-size: 0.8rem; color: #9CA3AF; margin-left: 5px; }
        .trend-up { font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 4px; }

        .section-block { margin-bottom: 40px; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .section-header h3 { margin: 0; font-size: 1.2rem; color: #374151; }
        .link-btn { background: none; border: none; color: #3B82F6; font-weight: 600; cursor: pointer; }

        .listing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; }
        .listing-card { overflow: hidden; display: flex; flex-direction: column; }
        .card-image-area { height: 140px; background: #E2E8F0; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; position: relative; }
        .card-emoji { font-size: 2rem; color: #1F2937; }
        .card-content { padding: 16px; display: flex; flex-direction: column; gap: 6px; }
        .card-content h4 { margin: 0; color: #1F2937; font-size: 1rem; }
        .location-line { color: #6B7280; font-size: 0.9rem; }
        .price-tag { color: #3B82F6; font-weight: 700; font-size: 1.1rem; margin: 4px 0; }
        .tag-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .tag-pill { background: #F3F4F6; color: #4B5563; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 500; }
        .tag-pill.muted { background: #E5E7EB; color: #9CA3AF; }
        .empty-placeholder { grid-column: 1 / -1; text-align: center; padding: 40px; background: white; border-radius: 16px; color: #6B7280; }
        .text-btn { background: none; border: none; color: #3B82F6; text-decoration: underline; cursor: pointer; margin-top: 10px; }

        .match-stack { display: flex; flex-direction: column; gap: 15px; }
        .match-row { display: flex; align-items: center; padding: 16px 24px; gap: 15px; }
        .match-avatar { width: 42px; height: 42px; background: #FECACA; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
        .match-details { flex: 1; }
        .match-details h4 { margin: 0; font-size: 1rem; color: #1F2937; }
        .match-details p { margin: 4px 0 0 0; color: #6B7280; font-size: 0.85rem; }
        .muted-line { color: #9CA3AF; margin-top: 2px; font-size: 0.82rem; }
        .primary-btn { background: #111827; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 500; cursor: pointer; transition: opacity 0.2s; }
        .primary-btn:hover { opacity: 0.9; }
        .empty-matches { text-align: center; padding: 30px; color: #9CA3AF; font-style: italic; background: white; border-radius: 12px; }

        /* Dark Mode */
        .dashboard-wrapper.dark {
          background-color: #0f172a;
          color: #e5e7eb;
        }
        .dashboard-wrapper.dark h1,
        .dashboard-wrapper.dark h3,
        .dashboard-wrapper.dark h4,
        .dashboard-wrapper.dark h5,
        .dashboard-wrapper.dark .stat-val,
        .dashboard-wrapper.dark .price-tag { color: #e5e7eb; }
        .dashboard-wrapper.dark .date-display,
        .dashboard-wrapper.dark .stat-label,
        .dashboard-wrapper.dark .location-line,
        .dashboard-wrapper.dark .muted-line,
        .dashboard-wrapper.dark .no-matches-text,
        .dashboard-wrapper.dark .trend-up span { color: #cbd5e1; }
        .dashboard-wrapper.dark .glass-card,
        .dashboard-wrapper.dark .empty-placeholder,
        .dashboard-wrapper.dark .listing-card,
        .dashboard-wrapper.dark .match-row,
        .dashboard-wrapper.dark .stat-card {
          background: #111827;
          border-color: rgba(255,255,255,0.08);
          box-shadow: 0 10px 30px rgba(0,0,0,0.35);
        }
        .dashboard-wrapper.dark .progress-bg { background: rgba(255,255,255,0.08); }
        .dashboard-wrapper.dark .tag-pill { background: #1f2937; color: #d1d5db; }
        .dashboard-wrapper.dark .tag-pill.muted { background: #374151; color: #e5e7eb; }
        .dashboard-wrapper.dark .primary-btn { background: #2563eb; }
        .dashboard-wrapper.dark .link-btn { color: #60a5fa; }

        /* =========================================================
           MOBILE OPTIMIZATIONS (Scrollable Sideways + Centered)
        ========================================================== */
        @media (max-width: 768px) {
           .dashboard-wrapper {
             padding-bottom: 90px; /* Space for Bottom Nav */
             align-items: center;  /* Keep layout centered like Pinterest mobile */
           }
           .main-feed { 
             padding: 14px; 
             max-width: 520px; 
             width: 100%;
             margin: 0 auto; 
             text-align: center; /* CENTER ALIGNMENT FOR CONTAINER */
           }
           /* CENTER THE HEADER */
           .feed-header { 
             flex-direction: column; 
             align-items: center; 
             justify-content: center;
             gap: 6px; 
             text-align: center; 
             margin-bottom: 22px;
           }
           .feed-header h1 { font-size: 1.35rem; }
           .date-display { font-size: 0.85rem; }

           /* Global text sizing tweaks */
           .stat-label,
           .trend-up,
           .link-btn,
           .location-line,
           .muted-line,
           .no-matches-text,
           .text-btn { font-size: 0.82rem; }
           .stat-val { font-size: 1.6rem; }
           .section-header h3 { font-size: 1.05rem; }
           .card-content h4,
           .match-details h4 { font-size: 0.98rem; }
           .price-tag { font-size: 1rem; }
           .primary-btn { padding: 10px 16px; font-size: 0.95rem; }
           .tag-pill { font-size: 0.7rem; }

           /* SECTION HEADERS */
           .section-header {
             display: flex;
             justify-content: space-between;
             align-items: center;
             padding: 0 5px; /* Slight padding to align with scrolled content */
           }
           
           /* --- 1. HORIZONTAL STATS --- */
           .stats-grid {
             display: flex;
             overflow-x: auto;
             scroll-snap-type: x mandatory;
             scroll-behavior: smooth;
             gap: 15px;
             margin: 0 0 26px 0;
             padding: 0 18px 10px 18px; /* Padding for scroll end & scrollbar space */
             justify-content: flex-start;
             scroll-padding-left: 18px; /* ensure first card is fully visible */
             cursor: grab;
           }
           .stat-card {
             min-width: 210px; 
             scroll-snap-align: center; /* Snap to center */
             text-align: center; /* Center text inside card */
             align-items: center;
             padding: 18px;
           }
           .avatar-group { justify-content: center; padding-left: 0; }
           .mini-avatar { margin: 0 -4px; }
           .trend-up { justify-content: center; }

           /* --- 2. HORIZONTAL LISTINGS --- */
           .listing-grid {
             display: flex;
             overflow-x: auto;
             scroll-snap-type: x mandatory;
             scroll-behavior: smooth;
             gap: 15px;
             margin: 0 0 26px 0;
             padding: 0 18px 10px 18px;
             justify-content: flex-start;
             scroll-padding-left: 18px; /* ensure first card is fully visible */
             cursor: grab;
           }
           .listing-card {
             min-width: 230px;
             scroll-snap-align: center;
             text-align: center; /* Center text */
           }
           .card-content { align-items: center; padding: 12px; }
           .tag-row { justify-content: center; }

           /* --- 3. HORIZONTAL MATCHES --- */
           .match-stack {
             display: flex;
             flex-direction: row; 
             overflow-x: auto;
             scroll-snap-type: x mandatory;
             scroll-behavior: smooth;
             gap: 15px;
             margin: 0 0 26px 0;
             padding: 0 18px 10px 18px;
             justify-content: flex-start;
             scroll-padding-left: 18px; /* ensure first card is fully visible */
             cursor: grab;
           }
           .match-row {
             min-width: 210px;
             flex-direction: column; 
             align-items: center;
             text-align: center;
             padding: 16px;
             scroll-snap-align: center;
           }
           .match-avatar {
             width: 54px;
             height: 54px;
             font-size: 1.35rem;
             margin-bottom: 10px;
           }
           .match-details {
             margin-bottom: 15px;
             width: 100%;
           }
           .match-details h4 { margin-bottom: 4px; }
           .primary-btn { width: 100%; }

           /* Hide scrollbars */
           .stats-grid::-webkit-scrollbar,
           .listing-grid::-webkit-scrollbar,
           .match-stack::-webkit-scrollbar {
             display: none;
           }

           /* Touch swipe helper */
           .stats-grid,
           .listing-grid,
           .match-stack {
             touch-action: pan-y;
             -webkit-overflow-scrolling: touch;
           }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
