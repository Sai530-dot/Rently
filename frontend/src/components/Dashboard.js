import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE_URL } from '../config';
import realListings from '../data/real_listings.json';
import craigslistData from '../data/craigslist_listings.json';
import kijijiData from '../data/kijiji_listings.json';

const SCRAPED_LISTINGS = [...craigslistData, ...kijijiData];

const Dashboard = ({ userProfile, userPreferences, onNavigate, onLogout, onToggleAppearance, appearance = 'light' }) => {
  // --- STATE & LOGIC ---
  const effectiveUserId = userProfile?.id || userProfile?.email || 'anon';
  const firstName = userProfile?.firstName || 'Student';
  const isDarkMode = appearance === 'dark';
  const [matches, setMatches] = useState([]);
  const [allListings, setAllListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [avgRent, setAvgRent] = useState(0);
  const [realMessages, setRealMessages] = useState([]);
  
  // Header dropdown state
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  // Header opacity on scroll
  const [headerOpacity, setHeaderOpacity] = useState(1);
  
  // Graph State
  const [hoveredData, setHoveredData] = useState(null);

  // Load Preferences
  const storedPrefs = (() => { try { const namespaced = localStorage.getItem(`rently_user_preferences_${effectiveUserId}`); const legacy = localStorage.getItem('rently_user_preferences'); return JSON.parse(namespaced || legacy || 'null'); } catch { return null; } })();
  const storedProfileForm = (() => { try { return JSON.parse(localStorage.getItem(`rently_profile_form_${effectiveUserId}`) || 'null'); } catch { return null; } })();
  const resolvedBudget = userPreferences?.budget ?? storedPrefs?.budget ?? storedProfileForm?.budget ?? '';

  const getBudgetCap = () => { const budget = parseInt(resolvedBudget, 10); return Number.isFinite(budget) ? budget + 200 : 1700; };
  const getPrice = (item) => { const value = item.price ?? item.rent; const numeric = typeof value === 'string' ? parseInt(value.replace(/[^\d]/g, ''), 10) : value; return Number.isFinite(numeric) ? numeric : 0; };
  const getListingLocation = (item) => item.address || item.location || 'See details';

  useEffect(() => {
    const namespacedKey = `rently_matches_user_${effectiveUserId}`;
    const savedMatches = JSON.parse(localStorage.getItem(namespacedKey) || localStorage.getItem('rently_matches') || '[]');
    setMatches(savedMatches);
  }, [effectiveUserId]);

  useEffect(() => {
    if (!matches || matches.length === 0) { setRealMessages([]); return; }
    const validMessages = matches.map((m, idx) => ({ id: m.id || idx, name: m.name || `Match ${idx + 1}`, text: 'Matched via Roommate Finder', time: 'Just now', avatar: m.image || m.avatar || '👤', online: idx === 0 }));
    setRealMessages(validMessages);
  }, [matches]);

  useEffect(() => {
    const fetchListings = async () => { try { const response = await fetch(`${API_BASE_URL}/properties`); const data = await response.json(); if (data.success && data.properties) { setAllListings(data.properties); return; } } catch (error) {} const fallbackListings = SCRAPED_LISTINGS.length > 0 ? SCRAPED_LISTINGS : realListings; setAllListings(fallbackListings); };
    fetchListings();
  }, []);

  useEffect(() => {
    if (allListings.length === 0) { setFilteredListings([]); setAvgRent(0); return; }
    const budgetCap = getBudgetCap();
    const relevantListings = allListings.filter((item) => { const price = getPrice(item); return price > 0 && price <= budgetCap; });
    const sortedListings = [...relevantListings].sort((a, b) => getPrice(a) - getPrice(b));
    if (sortedListings.length > 0) { const total = sortedListings.reduce((sum, item) => sum + getPrice(item), 0); setAvgRent(Math.round(total / sortedListings.length)); } else { setAvgRent(0); }
    setFilteredListings(sortedListings.slice(0, 6));
  }, [allListings, userPreferences]);

  const handleConnect = (matchProfile) => { onNavigate('messages'); };

  const handleProfileClick = (e) => {
    e.stopPropagation();
    setShowProfileMenu(!showProfileMenu);
  };

  const handleAppearanceToggle = () => {
    if (onToggleAppearance) onToggleAppearance();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showProfileMenu) return undefined;
    const closeMenu = (evt) => {
      const target = evt.target;
      if (target.closest && (target.closest('.ref-profile') || target.closest('.ref-profile-menu'))) {
        return;
      }
      setShowProfileMenu(false);
    };
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, [showProfileMenu]);

  // Fade header on scroll
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onScroll = () => {
      const y = window.scrollY || 0;
      const next = Math.max(0, Math.min(1, 1 - y / 300));
      setHeaderOpacity(next);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // --- CHART LOGIC ---
  const chartData = useMemo(() => {
    const base = avgRent || 1200;
    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, i) => {
      const variation = Math.sin(i) * 150; 
      return { label: month, value: Math.round(base + variation) };
    });
  }, [avgRent]);

  const activePoint = hoveredData || chartData[chartData.length - 1];
  const getCoord = (index, value) => {
    const x = (index / (chartData.length - 1)) * 440 + 30;
    const minVal = Math.min(...chartData.map(d => d.value)) - 200;
    const maxVal = Math.max(...chartData.map(d => d.value)) + 200;
    const range = maxVal - minVal;
    const y = 130 - ((value - minVal) / range) * 100;
    return { x, y };
  };
  const pathD = useMemo(() => {
    if (chartData.length === 0) return "";
    let d = `M ${getCoord(0, chartData[0].value).x} ${getCoord(0, chartData[0].value).y}`;
    for (let i = 0; i < chartData.length - 1; i++) {
      const p0 = getCoord(i, chartData[i].value);
      const p1 = getCoord(i + 1, chartData[i+1].value);
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp2x = p1.x - (p1.x - p0.x) / 2;
      d += ` C ${cp1x} ${p0.y}, ${cp2x} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  }, [chartData]);

  // --- ICONS ---
  const MoneyBagIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 1V3M12 21V23M17 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5Z" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 12C13.6569 12 15 10.6569 15 9C15 7.34315 13.6569 6 12 6C10.3431 6 9 7.34315 9 9C9 10.6569 10.3431 12 12 12Z" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 15C9 14.4477 9.44772 14 10 14H14C14.5523 14 15 14.4477 15 15V16C15 16.5523 14.5523 17 14 17H10C9.44772 17 9 16.5523 9 16V15Z" fill="#FCD34D" stroke="#D97706" strokeWidth="2"/>
    </svg>
  );

  const HeartIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="#F43F5E" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <div className={`dashboard-wrapper ${isDarkMode ? 'dark' : 'light'}`}>
      
      {/* --- DASHBOARD HEADER --- */}
      <header className="ref-header" style={{ opacity: headerOpacity, transition: 'opacity 0.35s ease' }}>
        <div className="ref-header-left">
          <h1 className="ref-title">Dashboard</h1>
        </div>

        <div className="ref-header-right">
          <button className="ref-icon-btn" aria-label="Notifications">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
               <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
             </svg>
             <span className="ref-dot"></span>
          </button>
          
          <button className="ref-icon-btn" aria-label="Messages">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
             </svg>
             <span className="ref-dot"></span>
          </button>

          <div className="ref-divider"></div>

          <div className="ref-profile" onClick={handleProfileClick}>
            <div className="ref-avatar">
              <img 
                 src={`https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}&background=random&color=fff&size=48`} 
                 alt="User" 
                 onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
              />
              <div className="fallback-avatar">{firstName[0]?.toUpperCase()}</div>
            </div>
            <div className="ref-user-info">
              <span className="ref-name">{firstName}</span>
              <span className="ref-role">Student</span>
            </div>

            {showProfileMenu && (
              <div className="profile-menu light desktop-menu ref-profile-menu" onClick={(e) => e.stopPropagation()}>
                <div className="menu-header-info">
                  <div className="menu-name">{firstName}</div>
                  <div className="menu-role">Student</div>
                </div>
                <div className="menu-divider" />

                <div className="menu-item" onClick={(e) => { e.stopPropagation(); onNavigate?.('settings'); setShowProfileMenu(false); }}>Settings</div>

                <div className="menu-item" onClick={(e) => { e.stopPropagation(); onToggleAppearance?.(); }}>Switch appearance ({appearance})</div>

                <div className="menu-item" onClick={(e) => { e.stopPropagation(); onNavigate?.('messages'); setShowProfileMenu(false); }}>Messages</div>

                <div className="menu-item" onClick={(e) => { e.stopPropagation(); onNavigate?.('roommate-matching'); setShowProfileMenu(false); }}>Roommates</div> 
                <div className="menu-item logout" onClick={(e) => { e.stopPropagation(); onLogout?.(); setShowProfileMenu(false); }}>Logout</div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <div className="content-body">
        
        {/* Left Column */}
        <div className="main-content">
          {/* Top Stats */}
          <div className="stats-grid">
            <div className="stats-column-left">
              {/* BUDGET */}
              <div className="stat-card purple">
                <div className="card-top">
                  <div className="icon-circle gold-bg"><MoneyBagIcon /></div>
                  <div className="dots">•••</div>
                </div>
                <div className="stat-value">{resolvedBudget ? `$${resolvedBudget}` : '$0'}</div>
                <div className="stat-label">
                  <span className="badge-pill">+0%</span>
                  <span className="sub-text">Monthly Budget</span>
                </div>
              </div>

              {/* MATCHES */}
              <div className="stat-card pink">
                <div className="card-top">
                  <div className="icon-circle pink-bg"><HeartIcon /></div>
                  <div className="dots">•••</div>
                </div>
                <div className="stat-value">{matches.length}</div>
                <div className="stat-label">
                  <span className="badge-pill pink">+New</span>
                  <span className="sub-text">Total Matches</span>
                </div>
              </div>
            </div>

            {/* CHART */}
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h3>Avg Market Rent</h3>
                  <div className="chart-legend">
                    <span className="dot black"></span> Market
                    <span className="dot gray"></span> Budget
                  </div>
                </div>
                <select className="pill-select"><option>Last 6 mo</option></select>
              </div>
              <div className="chart-area">
                 <svg viewBox="0 0 500 150" className="wave-svg" preserveAspectRatio="none">
                   <path d={pathD} fill="none" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
                   <g 
                     className="chart-tooltip" 
                     transform={`translate(${getCoord(chartData.indexOf(activePoint), activePoint.value).x}, ${getCoord(chartData.indexOf(activePoint), activePoint.value).y})`}
                   >
                     <circle r="6" fill="#1f2937" stroke="white" strokeWidth="2"/>
                     <g transform="translate(0, -40)">
                       <rect x="-35" y="-10" width="70" height="30" rx="8" fill="#1f2937" />
                       <text x="0" y="9" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">${activePoint.value}</text>
                       <path d="M-5,20 L5,20 L0,26 Z" fill="#1f2937" />
                     </g>
                   </g>
                   {chartData.map((d, i) => {
                     const { x } = getCoord(i, d.value);
                     return (
                       <rect key={i} x={x - 30} y="0" width="60" height="150" fill="transparent" 
                         onMouseEnter={() => setHoveredData(d)} onMouseLeave={() => setHoveredData(null)} style={{cursor: 'pointer'}}
                       />
                     );
                   })}
                 </svg>
              </div>
              <div className="chart-axis">
                 {chartData.map((d, i) => (<span key={i} className={activePoint.label === d.label ? 'active' : ''}>{d.label}</span>))}
              </div>
            </div>
          </div>

          {/* Listings */}
          <div className="listings-section">
            <div className="section-header">
              <div>
                <h2>Homes under ${getBudgetCap()}</h2>
                <p className="sub-header">You have {filteredListings.length} active listings found</p>
              </div>
              <div className="actions">
                <div className="search-wrap">
                  <input placeholder="Search any unit" />
                  <div className="search-icon-wrapper">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  </div>
                </div>
                <button className="filter-btn" onClick={() => onNavigate('browse-properties')}>Filters</button>
              </div>
            </div>

            <div className="listings-grid">
              {filteredListings.map(item => {
                 const price = getPrice(item);
                 return (
                  <div key={item.id} className="property-card">
                    <div className="prop-img" style={{ backgroundImage: `url(${item.image || ''})` }}>
                      {!item.image && <span className="emoji">🏠</span>}
                      <span className="status-badge">{item.available ? 'Vacant' : 'Active'}</span>
                    </div>
                    <div className="prop-info">
                      <h4>{item.title?.substring(0, 30) || 'Unknown'}...</h4>
                      <p className="prop-addr">{getListingLocation(item)}</p>
                      <div className="prop-meta">
                        <span>{item.bedrooms || 2} Beds</span><span className="dot">•</span>
                        <span>{item.bathrooms || 1} Baths</span><span className="dot">•</span>
                        <span>{price ? `$${price}` : 'TBD'}</span>
                      </div>
                    </div>
                  </div>
                 );
              })}
              {filteredListings.length === 0 && <div className="empty-state">No homes found in this budget.</div>}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="right-sidebar">
          <div className="sidebar-widget">
             <div className="widget-header"><h3>Building Condition</h3><span>•••</span></div>
             <div className="progress-group"><label>On repairment progress <span className="count">23</span></label><div className="bar-track"><div className="bar-fill black" style={{width: '70%'}}></div></div></div>
             <div className="progress-group"><label>Awaiting for repairment <span className="count">12</span></label><div className="bar-track"><div className="bar-fill gray" style={{width: '30%'}}></div></div></div>
             <div className="progress-group"><label>On request <span className="count">8</span></label><div className="bar-track"><div className="bar-fill gray" style={{width: '15%'}}></div></div></div>
             <button className="outline-btn">Maintenance Details</button>
          </div>

          <div className="sidebar-widget">
            <div className="widget-header"><h3>New Messages</h3></div>
            <div className="msg-tabs"><span className="msg-tab active">Matches {matches.length}</span><span className="msg-tab">Requests 0</span></div>
            <div className="msg-list">
              {realMessages.length > 0 ? realMessages.map((m) => (
                <div key={m.id} className="msg-row" onClick={() => handleConnect(matches.find(match => (match.id || match) === m.id))}>
                  <div className="msg-avatar">{m.avatar}</div>
                  <div className="msg-content"><div className="msg-name">{m.name}</div><div className="msg-text">{m.text}</div></div>
                  <div className="msg-time">{m.time}</div>
                </div>
              )) : (<div className="msg-empty">No messages yet.</div>)}
              {realMessages.length > 0 && <div className="list-end">You've reached the end of the list.</div>}
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        /* --- GLOBAL & RESET --- */
        .dashboard-wrapper {
          background: #fcfcfc;
          min-height: 100vh;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #1f2937;
          display: flex;
          flex-direction: column;
        }

        /* --- HEADER STYLES (MATCHING UI REFERENCE) --- */
        .ref-header {
          height: 84px;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          position: sticky; top: 0; z-index: 50;
        }

        .ref-header-left {
          display: flex;
          align-items: center;
          gap: 18px;
        }
        
        .ref-logo {
          display: flex; align-items: center; justify-content: center;
        }

        .ref-chevron {
          display: flex; align-items: center; color: #9ca3af;
        }

        .ref-title {
          font-size: 1.4rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .ref-header-right {
          display: flex;
          align-items: center;
          gap: 20px;
          position: relative;
        }
        
        .greeting-text { font-weight: 500; font-size: 0.95rem; color: #111827; }

        .ref-icon-btn {
          background: none;
          border: none;
          padding: 6px;
          cursor: pointer;
          position: relative;
          color: #4b5563;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }
        .ref-icon-btn:hover { color: #111827; }

        .ref-dot {
          position: absolute;
          top: 5px;
          right: 5px;
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          border: 1.5px solid white;
        }

        .ref-divider {
          width: 1px;
          height: 32px;
          background: #e5e7eb;
          margin: 0 4px;
        }

        .ref-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          position: relative;
        }

        .ref-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          overflow: hidden;
          background: #fcd34d;
          display: flex; align-items: center; justify-content: center;
        }
        .ref-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .fallback-avatar { font-weight: 700; color: #111827; display: none; }

        .ref-user-info {
          display: flex;
          flex-direction: column;
          line-height: 1.25;
          text-align: left;
        }

        .ref-name { font-size: 1rem; font-weight: 700; color: #111827; }
        .ref-role { font-size: 0.85rem; color: #9ca3af; }

        .profile-menu {
          position: absolute;
          top: 62px;
          right: 0;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 12px 30px rgba(0,0,0,0.12);
          width: 210px;
          padding: 10px 0;
          z-index: 25;
        }
        .menu-header-info { padding: 0 14px 8px 14px; }
        .menu-name { font-weight: 700; color: #111827; }
        .menu-role { font-size: 0.85rem; color: #6b7280; }
        .menu-divider { height: 1px; background: #e5e7eb; margin: 6px 0; }
        .menu-item { padding: 10px 14px; cursor: pointer; color: #374151; font-weight: 600; }
        .menu-item:hover { background: #f3f4f6; }
        .menu-item.logout { color: #ef4444; }

        .ref-profile-menu {
          position: absolute;
          top: 62px;
          right: 0;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 12px 30px rgba(0,0,0,0.12);
          width: 210px;
          padding: 10px 0;
          z-index: 25;
        }
        .menu-header-info { padding: 0 14px 8px 14px; }
        .menu-name { font-weight: 700; color: #111827; }
        .menu-role { font-size: 0.85rem; color: #6b7280; }
        .menu-divider { height: 1px; background: #e5e7eb; margin: 6px 0; }
        .menu-item { padding: 10px 14px; cursor: pointer; color: #374151; font-weight: 600; }
        .menu-item:hover { background: #f3f4f6; }
        .menu-item.logout { color: #ef4444; }
        
        /* --- DROPDOWN MENU STYLES --- */
        .header-dropdown {
          position: absolute;
          top: 60px; /* Offset below profile */
          right: 0;
          width: 240px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.12);
          border: 1px solid rgba(0,0,0,0.08);
          padding: 8px 0;
          z-index: 1000;
          animation: fadeIn 0.15s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dropdown-header { padding: 12px 16px 8px 16px; }
        .dd-name { font-weight: 700; font-size: 0.95rem; color: #111827; }
        .dd-role { font-size: 0.8rem; color: #6B7280; }
        
        .dropdown-divider { height: 1px; background: #E5E7EB; margin: 6px 0; }
        
        .dropdown-item {
          padding: 10px 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          font-size: 0.9rem;
          font-weight: 500;
          color: #374151;
          transition: background 0.1s;
        }
        .dropdown-item:hover { background: #F3F4F6; color: #fd5068; }
        .dropdown-item.danger { color: #ef4444; }
        .dropdown-item.danger:hover { background: #fee2e2; }

        /* --- MAIN CONTENT LAYOUT --- */
        .content-body {
          padding: 30px 40px;
          display: grid;
          grid-template-columns: 1fr 24%; /* Adjusted Sidebar Width */
          gap: 35px;
          flex-grow: 1;
        }

        .main-content { display: flex; flex-direction: column; gap: 35px; }
        
        /* Stats Grid */
        .stats-grid { display: grid; grid-template-columns: 28% 1fr; gap: 30px; }
        .stats-column-left { display: flex; flex-direction: column; gap: 30px; }

        /* Shared Card Styles */
        .stat-card, .chart-card, .sidebar-widget {
          background: white; border-radius: 24px; padding: 30px;
          border: 1px solid #f3f4f6; box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.03);
        }
        
        .stat-card.purple { background: #eef2ff; border: none; }
        .stat-card.pink { background: #fdf2f8; border: none; }
        
        .card-top { display: flex; justify-content: space-between; margin-bottom: 20px; color: #4b5563; }
        .icon-circle { 
          width: 48px; height: 48px; border-radius: 50%; 
          display: flex; align-items: center; justify-content: center; 
        }
        .gold-bg { background: #FEF3C7; }
        .pink-bg { background: #FFE4E6; }

        .stat-value { font-size: 2.8rem; font-weight: 800; margin-bottom: 10px; color: #111827; line-height: 1; }
        .stat-label { display: flex; align-items: center; gap: 10px; font-size: 1rem; color: #6b7280; }
        .badge-pill { background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 99px; font-weight: 700; font-size: 0.85rem; }
        .badge-pill.pink { background: #fce7f3; color: #9d174d; }

        /* Chart */
        .chart-card { display: flex; flex-direction: column; justify-content: space-between; min-height: 300px; }
        .chart-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; }
        .chart-header h3 { margin: 0; font-size: 1.3rem; font-weight: 700; }
        .chart-legend { margin-top: 8px; font-size: 0.9rem; color: #6b7280; display: flex; align-items: center; gap: 12px; }
        .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
        .dot.black { background: #111827; } .dot.gray { background: #d1d5db; }
        .pill-select { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 99px; padding: 8px 16px; font-size: 0.9rem; outline: none; cursor: pointer;}
        .chart-area { flex-grow: 1; position: relative; }
        .wave-svg { width: 100%; height: 100%; overflow: visible; }
        .chart-tooltip { transition: transform 0.3s ease-out; pointer-events: none; }
        .chart-axis { display: flex; justify-content: space-between; color: #9ca3af; font-size: 0.9rem; margin-top: 15px; border-top: 1px dashed #f3f4f6; padding-top: 15px; }

        /* Listings & Search */
        .section-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 25px; }
        .section-header h2 { font-size: 1.5rem; margin: 0; font-weight: 700; }
        .sub-header { color: #6b7280; font-size: 1rem; margin-top: 6px; }
        .actions { display: flex; gap: 16px; }
        .search-wrap { 
          background: white; border: 1px solid #e5e7eb; border-radius: 99px; 
          padding: 8px 12px 8px 24px; display: flex; align-items: center; justify-content: space-between;
          width: 320px; transition: border-color 0.2s;
        }
        .search-wrap:focus-within { border-color: #111827; }
        .search-wrap input { border: none; outline: none; width: 100%; font-size: 1rem; color: #374151; }
        .search-icon-wrapper { color: #9ca3af; display: flex; align-items: center; justify-content: center; padding-left: 8px; }
        .filter-btn { background: white; border: 1px solid #e5e7eb; border-radius: 99px; padding: 10px 20px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 1rem;}

        .listings-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 30px; }
        .property-card { background: white; border-radius: 20px; overflow: hidden; border: 1px solid #f3f4f6; cursor: pointer; transition: transform 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .property-card:hover { transform: translateY(-5px); box-shadow: 0 12px 24px rgba(0,0,0,0.06); }
        .prop-img { height: 200px; background-size: cover; background-position: center; background-color: #e5e7eb; position: relative; display: flex; align-items: center; justify-content: center; }
        .emoji { font-size: 4rem; }
        .status-badge { position: absolute; bottom: 12px; right: 12px; background: white; padding: 6px 14px; border-radius: 99px; font-size: 0.85rem; font-weight: 700; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .prop-info { padding: 20px; }
        .prop-info h4 { margin: 0 0 6px 0; font-size: 1.15rem; font-weight: 700; }
        .prop-addr { color: #6b7280; font-size: 0.95rem; margin-bottom: 16px; }
        .prop-meta { display: flex; gap: 10px; align-items: center; font-size: 0.95rem; font-weight: 600; color: #374151; }

        /* Sidebar */
        .right-sidebar { display: flex; flex-direction: column; gap: 30px; }
        .widget-header { display: flex; justify-content: space-between; margin-bottom: 25px; align-items: center; }
        .widget-header h3 { font-size: 1.3rem; margin: 0; font-weight: 700; }
        .progress-group { margin-bottom: 20px; }
        .progress-group label { display: flex; justify-content: space-between; font-size: 0.95rem; margin-bottom: 8px; font-weight: 600; color: #374151; }
        .bar-track { background: #f3f4f6; height: 8px; border-radius: 99px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 99px; }
        .bar-fill.black { background: #111827; } .bar-fill.gray { background: #9ca3af; }
        .outline-btn { width: 100%; border: 2px solid #e5e7eb; background: white; padding: 14px; border-radius: 14px; font-weight: 700; margin-top: 15px; cursor: pointer; font-size: 1rem; color: #374151; transition: all 0.2s; }
        .outline-btn:hover { border-color: #111827; color: #111827; background: #f9fafb; }

        .msg-tabs { background: #111827; padding: 5px; border-radius: 99px; display: inline-flex; margin-bottom: 25px; gap: 5px; width: 100%; }
        .msg-tab { padding: 10px 0; text-align: center; flex: 1; border-radius: 99px; font-size: 0.9rem; color: #9ca3af; cursor: pointer; transition: all 0.2s; }
        .msg-tab.active { background: #374151; color: white; font-weight: 700; }
        .msg-list { display: flex; flex-direction: column; gap: 20px; }
        .msg-row { display: grid; grid-template-columns: auto 1fr auto; gap: 15px; cursor: pointer; padding: 5px; border-radius: 12px; transition: background 0.2s; }
        .msg-row:hover { background: #f9fafb; }
        .msg-avatar { width: 48px; height: 48px; border-radius: 50%; background: #e5e7eb; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; }
        .msg-name { font-weight: 700; font-size: 1rem; margin-bottom: 4px; }
        .msg-text { font-size: 0.9rem; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px; }
        .msg-time { font-size: 0.8rem; color: #9ca3af; font-weight: 500; }
        .list-end { text-align: center; font-size: 0.85rem; color: #d1d5db; margin-top: 15px; }
        .msg-empty { color: #9ca3af; font-size: 1rem; text-align: center; padding: 30px; }

        @media (max-width: 1400px) { .stats-grid { grid-template-columns: 35% 1fr; } }
        @media (max-width: 1200px) {
          .content-body { grid-template-columns: 1fr; gap: 40px; }
          .right-sidebar { order: 3; }
          .stats-grid { grid-template-columns: 1fr 1fr; }
          .stats-column-left { flex-direction: column; }
        }
         @media (max-width: 900px) {
           .stats-grid { grid-template-columns: 1fr; }
           .stats-column-left { flex-direction: row; }
         }
      `}</style>
    </div>
  );
};

export default Dashboard;
