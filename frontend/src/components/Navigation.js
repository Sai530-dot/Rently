import React, { useState, useEffect, useRef } from 'react';

const Icon = ({ path, size = 22, className }) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.8" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d={path} />
  </svg>
);

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: 'M3 11.5 12 3l9 8.5V21H3z' },
  { key: 'browse-properties', label: 'Properties', icon: 'M4 5h16v14H4z M4 9h16' },
  { key: 'roommate-matching', label: 'Roommates', icon: 'M8 13a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm8 0a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM3 19.5c0-2.2 2.7-3.5 5-3.5s5 1.3 5 3.5M11 19.5c0-2.2 2.7-3.5 5-3.5s5 1.3 5 3.5' },
  { key: 'rent-map', label: 'Rent Map', icon: 'M6 3l5 2 7-2v16l-7 2-5-2V3Zm5 2v16' },
  { key: 'my-properties', label: 'My properties', icon: 'M3 10l9-7 9 7M5 9v12h14V9M9 21v-8h6v8' },
  { key: 'offer-evaluator', label: 'Evaluate', icon: 'M6 4h12M9 8h6M8 12h8M10 16h4' },
  { key: 'messages', label: 'Messages', icon: 'M4 6h16v10H7l-3 3z' },
  { key: 'saved-properties', label: 'Saved', icon: 'M12 20l-7-7a4 4 0 0 1 5.7-5.6L12 8.7l1.3-1.3A4 4 0 0 1 19 13z' },
  { key: 'settings', label: 'Settings', icon: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.332.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.217.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.581-.495.644-.869l.214-1.28Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z' },
  { key: 'theme-toggle', label: 'Appearance', icon: 'M12 3v18M6 7a6 6 0 0 0 0 10m6-12a6 6 0 1 1 0 12' },
];

const Navigation = ({ userProfile, currentView, onNavigate, onLogout, onToggleAppearance, appearance }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [hideMobileNav, setHideMobileNav] = useState(false);
  const lastScroll = useRef(0);
  
  const isLoggedIn = userProfile !== null;
  const effectiveUserId = userProfile?.id || userProfile?.email || 'anon';
  const storedAvatar = (() => {
    try {
      const raw = localStorage.getItem(`rently_profile_form_${effectiveUserId}`);
      if (raw) return JSON.parse(raw)?.avatar || '';
    } catch (e) { /* ignore */ }
    return '';
  })();

  const avatarLetter = (userProfile?.firstName || 'User')[0]?.toUpperCase();
  const avatarUrl = userProfile?.avatar || storedAvatar;
  const firstName = userProfile?.firstName || 'Student';

  const handleProfileMenuToggle = () => {
    setShowProfileMenu((prev) => !prev);
  };

  const handleAppearanceToggle = () => {
    if (onToggleAppearance) onToggleAppearance();
    setShowProfileMenu(false);
  };

  // Hide bottom nav on scroll down (mobile)
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onScroll = () => {
      const y = window.scrollY || 0;
      const goingDown = y > lastScroll.current + 5;
      const goingUp = y < lastScroll.current - 5;
      if (goingDown) setHideMobileNav(true);
      if (goingUp) setHideMobileNav(false);
      lastScroll.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const mobileNavKeys = ['dashboard', 'browse-properties', userProfile?.user_type === 'landlord' ? 'my-properties' : 'roommate-matching', 'messages'];
  const mobileNavItems = navItems.filter(item => mobileNavKeys.includes(item.key));

  // Hide when logged out; show on all views for logged-in users
  if (!isLoggedIn) return null;

  return (
    <nav className="main-nav-wrapper">
      
      {/* DESKTOP NAV GROUP - Hidden completely on mobile */}
      <div className="desktop-nav-group">
        <div className="nav-rail">
          {navItems.filter(item => item.key !== 'my-properties' || userProfile?.user_type === 'landlord').filter(item => item.key !== 'roommate-matching' || userProfile?.user_type === 'student').map(item => {
            if (item.key === 'theme-toggle') {
              return (
                <button
                  key={item.key}
                  className="rail-btn"
                  onClick={() => { if (onToggleAppearance) onToggleAppearance(); }}
                  title={item.label}
                >
                  <Icon path={item.icon} />
                  <span className="sr-only">{item.label}</span>
                </button>
              );
            }
            return (
              <button
                key={item.key}
                className={`rail-btn ${currentView === item.key ? 'active' : ''}`}
                onClick={() => onNavigate(item.key)}
                title={item.label}
              >
                <Icon path={item.icon} />
                <span className="sr-only">{item.label}</span>
              </button>
            );
          })}
          <div className="rail-spacer" />
          <button className="rail-btn danger" onClick={onLogout} title="Logout">
            <Icon path="M10 4h4v4h-4z M5 12h9M5 12l3-3m-3 3 3 3" />
            <span className="sr-only">Logout</span>
          </button>
        </div>
      </div>

      {/* MOBILE BOTTOM NAV - Only on Mobile */}
      <div className={`mobile-bottom-nav ${hideMobileNav ? 'hidden' : ''}`}>
        {mobileNavItems.map(item => (
          <button 
            key={item.key} 
            className={`mobile-nav-btn ${currentView === item.key ? 'active' : ''}`}
            onClick={() => onNavigate(item.key)}
          >
            <Icon path={item.icon} size={24} />
          </button>
        ))}

        <div className="mobile-profile-container">
          <button 
            className="mobile-nav-btn profile-btn"
            onClick={handleProfileMenuToggle}
          >
             <div className="mobile-avatar-circle">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" />
              ) : avatarLetter}
            </div>
          </button>

          {showProfileMenu && (
             <div className="profile-menu light mobile-menu-popup">
                <div className="menu-header-info">
                  <div className="menu-name">{firstName}</div>
                  <div className="menu-role">{userProfile?.user_type === 'landlord' ? 'Landlord' : 'Student'}</div>
                </div>
                <div className="menu-divider" />
                <div className="menu-item" onClick={() => { onNavigate('settings'); setShowProfileMenu(false); }}>Settings</div>
                <div className="menu-item" onClick={handleAppearanceToggle}>Switch appearance</div>
                <div className="menu-item" onClick={onLogout} style={{color: '#ef4444'}}>Logout</div>
             </div>
          )}
        </div>
      </div>

      <style>{`
        .main-nav-wrapper {
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        /* --- DESKTOP STYLES --- */
        .top-navbar {
          height: 60px;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          color: #0f172a;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          width: 100%;
          box-sizing: border-box;
          border-bottom: 1px solid #e5e7eb;
        }

        .nav-rail {
          position: fixed;
          top: 170px; 
          left: 10px;
          width: 54px;
          border-radius: 18px;
          background: rgba(255,255,255,0.96);
          box-shadow: 0 18px 38px rgba(0,0,0,0.18);
          padding: 14px 8px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 900;
        }

        .mobile-bottom-nav { display: none; }

        /* --- SHARED STYLES --- */
        .nav-brand { display: flex; align-items: baseline; gap: 12px; cursor: pointer; color: inherit; }
        .nav-brand:hover { opacity: 0.9; }
        .brand-name { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.5px; }
        .brand-tagline { font-size: 0.85rem; opacity: 0.9; font-weight: 500; }
        .user-profile-snippet { display: flex; align-items: center; gap: 12px; cursor: pointer; position: relative; padding: 4px 8px; border-radius: 8px; transition: background 0.2s; }
        .user-profile-snippet:hover { background: rgba(255,255,255,0.15); }
        .greeting-text { font-weight: 600; font-size: 0.95rem; }
        .user-avatar-circle { width: 36px; height: 36px; background: rgba(255,255,255,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: white; border: 2px solid rgba(255,255,255,0.8); overflow: hidden; }

        .profile-menu { 
          position: absolute; 
          background: white; 
          color: #0f172a; 
          border-radius: 12px; 
          box-shadow: 0 10px 40px rgba(0,0,0,0.12); 
          padding: 8px 0; 
          z-index: 1050; 
          border: 1px solid rgba(0,0,0,0.08);
          animation: fadeIn 0.15s ease-out;
          width: 220px; 
        }

        .desktop-menu { right: 0; top: 55px; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .menu-header-info { padding: 12px 16px 8px 16px; }
        .menu-name { font-weight: 700; font-size: 0.95rem; color: #111827; }
        .menu-role { font-size: 0.8rem; color: #6B7280; }
        .menu-item { padding: 10px 16px; cursor: pointer; display: flex; align-items: center; font-size: 0.9rem; font-weight: 500; color: #374151; transition: background 0.1s; }
        .menu-item:hover { background: #F3F4F6; color: #fd5068; }
        .menu-divider { height: 1px; background: #E5E7EB; margin: 6px 0; }

        .rail-btn { width: 38px; height: 38px; border-radius: 12px; border: none; background: transparent; color: #0f172a; display: grid; place-items: center; cursor: pointer; transition: all 0.2s ease; }
        .rail-btn:hover { background: rgba(0,0,0,0.06); color: #111827; }
        .rail-btn.active { background: #111827; color: white; box-shadow: 0 6px 16px rgba(0,0,0,0.2); }
        .rail-btn.danger { color: #ef4444; }
        .rail-btn.danger:hover { background: rgba(239,68,68,0.1); }
        .rail-spacer { flex: 1; }
        .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }

        .dark-mode .nav-rail { background: #0f172a; box-shadow: 0 18px 38px rgba(0,0,0,0.35); }
        .dark-mode .rail-btn { color: #e5e7eb; }
        .dark-mode .rail-btn.active { background: #2563eb; }

        /* =========================================================
           MOBILE STYLES (Max-width 768px)
        ========================================================== */
        @media (max-width: 768px) {
          /* AGGRESSIVE HIDE of desktop elements to prevent spacing issues */
          .desktop-nav-group { display: none !important; }

          .mobile-bottom-nav {
            display: flex;
            align-items: center;
            justify-content: space-around;
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: 90%;
            max-width: 380px;
            height: 60px;
            background: rgba(255, 255, 255, 0.65);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            border-radius: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
            z-index: 2000;
            padding: 0 10px;
            box-sizing: border-box;
            border: 1px solid rgba(255,255,255,0.7);
            outline: 1px solid rgba(0,0,0,0.04);
            transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease;
            will-change: transform, opacity;
          }

          .mobile-bottom-nav.hidden {
            transform: translate(-50%, 90px);
            opacity: 0;
            pointer-events: none;
          }

          .mobile-nav-btn {
            background: none;
            border: none;
            width: 45px;
            height: 45px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #94a3b8;
            transition: all 0.2s;
          }

          .mobile-nav-btn.active {
            color: #fd5068;
            background: #fff0f3;
          }

          .mobile-profile-container { position: relative; }

          .mobile-avatar-circle {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            overflow: hidden;
            background: #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            color: #64748b;
            border: 2px solid transparent;
          }
          
          .mobile-nav-btn.profile-btn:hover .mobile-avatar-circle {
            border-color: #fd5068;
          }

          .mobile-avatar-circle img { width: 100%; height: 100%; object-fit: cover; }

          .mobile-menu-popup {
            bottom: 70px;
            right: -10px;
            top: auto;
            transform-origin: bottom right;
            animation: popUp 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }

          @keyframes popUp {
            from { opacity: 0; transform: scale(0.9) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        }
      `}</style>
    </nav>
  );
};

export default Navigation;
