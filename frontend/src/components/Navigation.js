import React from 'react';

const Navigation = ({ userProfile, currentView, onNavigate, onLogout }) => {
  const isLoggedIn = userProfile !== null;
  const isDashboardView = currentView === 'dashboard' || 
                          currentView === 'roommate-matching' || 
                          currentView === 'rent-map' || 
                          currentView === 'offer-evaluator' || 
                          currentView === 'messages' || 
                          currentView === 'saved-properties' ||
                          currentView === 'browse-properties';

  if (!isLoggedIn) return null;
  if (!isDashboardView) return null;

  return (
    <nav className="main-nav">
      <div className="nav-container">
        <div className="nav-brand" onClick={() => onNavigate('dashboard')}>
          <h1>Rently</h1>
          <span className="tagline">Find Your Perfect Match</span>
        </div>

        <div className="nav-links">
          <button 
            className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => onNavigate('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`nav-link ${currentView === 'browse-properties' ? 'active' : ''}`}
            onClick={() => onNavigate('browse-properties')}
          >
            Properties
          </button>
          <button 
            className={`nav-link ${currentView === 'roommate-matching' ? 'active' : ''}`}
            onClick={() => onNavigate('roommate-matching')}
          >
            Roommates
          </button>
          <button 
            className={`nav-link ${currentView === 'rent-map' ? 'active' : ''}`}
            onClick={() => onNavigate('rent-map')}
          >
            Map
          </button>
          <button 
            className={`nav-link ${currentView === 'offer-evaluator' ? 'active' : ''}`}
            onClick={() => onNavigate('offer-evaluator')}
          >
            Evaluate
          </button>
          <button 
            className={`nav-link ${currentView === 'messages' ? 'active' : ''}`}
            onClick={() => onNavigate('messages')}
          >
            Messages
          </button>
          <button 
            className={`nav-link ${currentView === 'saved-properties' ? 'active' : ''}`}
            onClick={() => onNavigate('saved-properties')}
          >
            Saved
          </button>
        </div>

        <div className="nav-user">
          <span className="user-greeting">Hi, {userProfile?.firstName}!</span>
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <style>{`
        .main-nav {
          background: linear-gradient(135deg, #fd5068 0%, #ff6b9d 50%, #ff8a80 100%);
          box-shadow: 0 4px 20px rgba(253, 80, 104, 0.25);
          position: sticky;
          top: 0;
          z-index: 1000;
          backdrop-filter: blur(10px);
        }

        .nav-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 15px 30px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 30px;
        }

        .nav-brand {
          display: flex;
          align-items: baseline;
          gap: 10px;
          cursor: pointer;
          transition: opacity 0.3s ease;
        }

        .nav-brand:hover {
          opacity: 0.9;
        }

        .nav-brand h1 {
          margin: 0;
          color: white;
          font-size: 1.8rem;
          font-weight: 700;
        }

        .tagline {
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.85rem;
          font-weight: 500;
        }

        .nav-links {
          display: flex;
          gap: 5px;
          flex: 1;
          justify-content: center;
        }

        .nav-link {
          background: transparent;
          border: none;
          color: white;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .nav-link:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .nav-link.active {
          background: rgba(255, 255, 255, 0.25);
        }

        .nav-user {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .user-greeting {
          color: white;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .logout-btn {
          padding: 8px 20px;
          background: rgba(255, 255, 255, 0.2);
          border: 2px solid white;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .logout-btn:hover {
          background: white;
          color: #fd5068;
        }

        @media (max-width: 1024px) {
          .nav-container {
            flex-wrap: wrap;
            padding: 15px 20px;
          }

          .nav-links {
            order: 3;
            width: 100%;
            justify-content: flex-start;
            overflow-x: auto;
            padding-top: 10px;
          }

          .nav-link {
            font-size: 0.85rem;
            padding: 8px 12px;
          }

          .tagline {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .nav-brand h1 {
            font-size: 1.5rem;
          }

          .user-greeting {
            display: none;
          }

          .nav-links {
            gap: 3px;
          }

          .nav-link {
            font-size: 0.8rem;
            padding: 6px 10px;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navigation;
