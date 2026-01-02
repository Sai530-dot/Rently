import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const RoommateMatching = ({ onBack, onNavigate, userProfile }) => {
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState([]);
  const [passes, setPasses] = useState([]);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- STYLES ---
  const mainStyles = `
    .matching-page {
      max-width: 480px;
      margin: 0 auto;
      padding: 20px;
      /* Flex 1 ensures it expands to fill space, pushing footer down */
      flex: 1;
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    .matching-header { 
      display: flex; 
      align-items: center; 
      gap: 15px;
      margin-bottom: 20px; 
    }
    
    .matching-header h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0;
    }

    /* --- SWIPE CARD STYLES --- */
    .card-container { 
      perspective: 1000px; 
      flex: 1; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      position: relative;
      min-height: 500px;
    }

    .profile-card { 
      width: 100%;
      height: 600px;
      max-height: 70vh;
      background: #fff;
      border-radius: 20px;
      position: relative;
      box-shadow: 0 15px 35px rgba(0,0,0,0.1);
      overflow: hidden;
      transition: transform 0.3s ease, opacity 0.3s ease;
      transform-origin: 50% 100%;
    }

    .profile-card.swipe-left { transform: translateX(-200px) rotate(-10deg); opacity: 0; }
    .profile-card.swipe-right { transform: translateX(200px) rotate(10deg); opacity: 0; }

    .card-image { width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; z-index: 1; }
    .card-image-fallback { width: 100%; height: 100%; background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%); display: flex; align-items: center; justify-content: center; font-size: 80px; color: rgba(255,255,255,0.5); }
    .card-overlay { position: absolute; bottom: 0; left: 0; right: 0; height: 65%; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0) 100%); z-index: 2; pointer-events: none; }
    .card-content { position: absolute; bottom: 0; left: 0; width: 100%; padding: 24px; z-index: 3; color: white; box-sizing: border-box; }
    
    .user-main-info { display: flex; align-items: baseline; gap: 10px; margin-bottom: 8px; }
    .user-name { font-size: 32px; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
    .match-badge { background: #10b981; color: white; font-size: 12px; font-weight: 700; padding: 4px 8px; border-radius: 20px; text-transform: uppercase; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
    .user-location { font-size: 16px; opacity: 0.9; margin-bottom: 16px; display: flex; align-items: center; gap: 6px; }
    
    .tags-container { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
    .tag-pill { background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.3); padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; color: #fff; display: flex; align-items: center; gap: 6px; }
    .bio-section { font-size: 14px; line-height: 1.5; color: rgba(255, 255, 255, 0.85); border-top: 1px solid rgba(255,255,255,0.2); padding-top: 12px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

    .action-buttons-container { display: flex; justify-content: center; gap: 25px; margin-top: 24px; }
    .action-btn { width: 65px; height: 65px; border-radius: 50%; border: none; font-size: 28px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 10px 20px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; }
    .action-btn:hover { transform: scale(1.1) translateY(-2px); }
    .pass-btn { background: #fff; color: #ff5864; border: 1px solid #eee; }
    .like-btn { background: linear-gradient(45deg, #fd297b, #ff655b); color: white; box-shadow: 0 10px 25px rgba(253, 41, 123, 0.4); }

    /* --- COMPLETED VIEW STYLES --- */
    .completed-container { 
      flex: 1; 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      justify-content: center; 
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
    }
    
    .completed-icon {
      font-size: 3rem;
      margin-bottom: 20px;
      animation: bounce 1s infinite alternate;
    }

    .stats-row {
      display: flex;
      gap: 15px;
      width: 100%;
      margin-bottom: 30px;
    }

    .stat-card {
      flex: 1;
      background: white;
      padding: 20px;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      text-align: center;
      border: 1px solid #f0f0f0;
    }

    .stat-number { font-size: 24px; font-weight: 800; color: #333; display: block; }
    .stat-label { font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }

    .matches-panel {
      width: 100%;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      padding: 24px;
      margin-bottom: 30px;
    }

    .panel-title { font-size: 18px; font-weight: 700; margin-bottom: 20px; color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; }

    .match-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #f9f9f9;
    }
    .match-row:last-child { border-bottom: none; }

    .match-left { display: flex; align-items: center; gap: 12px; }
    .match-avatar-small { width: 45px; height: 45px; border-radius: 50%; object-fit: cover; background: #eee; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    .match-details h4 { margin: 0; font-size: 15px; color: #333; }
    .match-details p { margin: 2px 0 0; font-size: 12px; color: #888; }
    
    .message-btn-small {
      background: linear-gradient(45deg, #10b981, #059669);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .message-btn-small:hover { transform: scale(1.05); }

    .back-btn { background: #f5f5f5; border: none; padding: 10px 16px; border-radius: 30px; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: background 0.2s; }
    .back-btn:hover { background: #e0e0e0; }
    .primary-btn { background: #333; color: white; border: none; padding: 14px 28px; border-radius: 12px; cursor: pointer; font-size: 1rem; font-weight: 600; width: 100%; }

    @keyframes bounce { 0% { transform: translateY(0); } 100% { transform: translateY(-10px); } }
  `;

  const fallbackProfile = (() => {
    try { return JSON.parse(localStorage.getItem('rently_user_profile') || 'null'); } catch { return null; }
  })();
  const effectiveUserId = userProfile?.id || userProfile?.email || fallbackProfile?.id || fallbackProfile?.email;
  const storageKey = (key) => `rently_${key}_user_${effectiveUserId || 'anon'}`;

  useEffect(() => {
    const matchesKey = `rently_matches_user_${userProfile?.id || 'anon'}`;
    const passesKey = `rently_passes_user_${userProfile?.id || 'anon'}`;
    setMatches(JSON.parse(localStorage.getItem(matchesKey) || '[]'));
    setPasses(JSON.parse(localStorage.getItem(passesKey) || '[]'));
  }, [userProfile?.id]);

  const fetchMatches = useCallback(async () => {
    if (!effectiveUserId) { setError('Missing user ID.'); setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const resp = await api.matchRoommates({ user_id: effectiveUserId });
      if (!resp.success) throw new Error(resp.message || 'Failed');
      setProfiles(resp.matches || []);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }, [effectiveUserId]);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  useEffect(() => {
    // Sync current index based on history length to avoid re-showing cards
    if (!loading && profiles.length > 0) {
       const doneCount = matches.length + passes.length;
       if (doneCount > currentIndex) setCurrentIndex(doneCount);
    }
  }, [loading, matches.length, passes.length, profiles.length]);


  const persistState = (newMatches, newPasses) => {
    localStorage.setItem(storageKey('matches'), JSON.stringify(newMatches));
    localStorage.setItem(storageKey('passes'), JSON.stringify(newPasses));
  };

  const handleSwipe = (direction) => {
    const currentProfile = profiles[currentIndex];
    if (!currentProfile) return;

    setSwipeDirection(direction);
    setTimeout(() => {
      if (direction === 'right') {
        const newMatches = [...matches, currentProfile];
        setMatches(newMatches);
        persistState(newMatches, passes);
        
        // Add to conversations if not exists
        const convKey = storageKey('conversations');
        const existingConvs = JSON.parse(localStorage.getItem(convKey) || '[]');
        if (!existingConvs.find(c => c.id === currentProfile.id)) {
           const newConv = {
            id: currentProfile.id,
            name: currentProfile.name,
            avatar: currentProfile.image || '👤',
            major: currentProfile.major || 'Student',
            matchScore: currentProfile.match_score || 90,
            lastMessage: 'You matched!',
            timestamp: 'Just now',
            unread: 0,
            online: true,
           };
           localStorage.setItem(convKey, JSON.stringify([newConv, ...existingConvs]));
        }
      } else {
        const newPasses = [...passes, currentProfile];
        setPasses(newPasses);
        persistState(matches, newPasses);
      }
      setCurrentIndex(prev => prev + 1);
      setSwipeDirection(null);
    }, 280);
  };

  const handleMessage = (profile) => {
    // Ensure conversation exists before navigating
    const convKey = storageKey('conversations');
    const existingConvs = JSON.parse(localStorage.getItem(convKey) || '[]');
    if (!existingConvs.find(c => c.id === profile.id)) {
      const newConv = {
        id: profile.id,
        name: profile.name,
        avatar: profile.image || '👤',
        major: profile.major || 'Student',
        matchScore: profile.match_score || 90,
        lastMessage: 'Matched via Roommate Finder',
        timestamp: 'Just now',
        unread: 0,
        online: true
      };
      existingConvs.unshift(newConv);
      localStorage.setItem(convKey, JSON.stringify(existingConvs));
    }
    onNavigate('messages');
  };

  const formatLocation = (loc) => {
    if (!loc) return '';
    try {
        if (typeof loc === 'string') {
            const parsed = JSON.parse(loc.replace(/'/g, '"'));
            loc = parsed;
        }
        if (loc.city) return loc.city;
        if (loc.address_line1) return loc.address_line1;
        return '';
    } catch { return typeof loc === 'string' ? loc : ''; }
  };

  if (loading) return <div className="matching-page"><p>Loading profiles...</p><style>{mainStyles}</style></div>;
  if (error) return <div className="matching-page"><p style={{color:'red'}}>{error}</p><button className="primary-btn" onClick={fetchMatches}>Retry</button><style>{mainStyles}</style></div>;

  // --- COMPLETED VIEW ---
  if (currentIndex >= profiles.length) {
    return (
      <div className="matching-page">
        <div className="matching-header">
           <button className="back-btn" onClick={onBack}>← Back</button>
        </div>
        
        <div className="completed-container">
          <div className="completed-icon">🎉</div>
          <h2 style={{fontSize: '24px', fontWeight: '800', marginBottom: '10px'}}>You're all caught up!</h2>
          <p style={{color: '#666', marginBottom: '30px'}}>You've seen all the available profiles in your area.</p>

          <div className="stats-row">
            <div className="stat-card">
              <span className="stat-number" style={{color: '#10b981'}}>{matches.length}</span>
              <span className="stat-label">Matches</span>
            </div>
            <div className="stat-card">
              <span className="stat-number" style={{color: '#ff5864'}}>{passes.length}</span>
              <span className="stat-label">Passes</span>
            </div>
          </div>

          <div className="matches-panel">
            <div className="panel-title">Your New Connections</div>
            {matches.length === 0 ? (
              <p style={{textAlign:'center', color:'#999', fontStyle:'italic', padding:'20px'}}>No matches yet. Keep looking!</p>
            ) : (
              matches.map(match => (
                <div key={match.id} className="match-row">
                  <div className="match-left">
                    {match.image ? (
                        <img src={match.image} alt={match.name} className="match-avatar-small" />
                    ) : (
                        <div className="match-avatar-small">{match.name ? match.name[0] : 'U'}</div>
                    )}
                    <div className="match-details">
                      <h4>{match.name}</h4>
                      <p>${match.rent_ask || match.budget_max || '—'}/mo</p>
                    </div>
                  </div>
                  <button className="message-btn-small" onClick={() => handleMessage(match)}>Message</button>
                </div>
              ))
            )}
          </div>
          
          <button className="primary-btn" onClick={onBack}>Back to Dashboard</button>
        </div>
        <style>{mainStyles}</style>
      </div>
    );
  }

  // --- ACTIVE SWIPE CARD ---
  const currentProfile = profiles[currentIndex];
  const budget = currentProfile.rent_ask || currentProfile.budget_max || '—';
  const location = formatLocation(currentProfile.city || currentProfile.location);
  const bio = currentProfile.bio || currentProfile.description || "I'm a tidy student looking for a quiet place to study and relax. I enjoy cooking on weekends.";

  return (
    <div className="matching-page">
      <div className="matching-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h2>Find Your Roommate</h2>
      </div>

      <div className="card-container">
        <div className={`profile-card ${swipeDirection ? `swipe-${swipeDirection}` : ''}`}>
          {currentProfile.image ? (
             <img src={currentProfile.image} alt={currentProfile.name} className="card-image" />
          ) : (
             <div className="card-image-fallback">{currentProfile.name ? currentProfile.name[0] : '👤'}</div>
          )}
          <div className="card-overlay"></div>
          <div className="card-content">
            <div className="user-main-info">
              <span className="user-name">{currentProfile.name}</span>
              {currentProfile.match_score && <span className="match-badge">{currentProfile.match_score}% Match</span>}
            </div>
            {location && <div className="user-location"><span>📍</span> {location}</div>}
            
            <div className="tags-container">
               <div className="tag-pill"><span>💰</span> ${budget}/mo</div>
               <div className="tag-pill"><span>🧹</span> {currentProfile.cleanliness || 'Moderate'}</div>
               <div className="tag-pill"><span>🌙</span> {currentProfile.sleep_schedule || 'Flexible'}</div>
            </div>
            <div className="bio-section">"{bio}"</div>
          </div>
        </div>
      </div>

      <div className="action-buttons-container">
        <button className="action-btn pass-btn" onClick={() => handleSwipe('left')}>✕</button>
        <button className="action-btn like-btn" onClick={() => handleSwipe('right')}>❤️</button>
      </div>
      <style>{mainStyles}</style>
    </div>
  );
};

export default RoommateMatching;