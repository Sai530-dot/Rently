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

  const fallbackProfile = (() => {
    try {
      return JSON.parse(localStorage.getItem('rently_user_profile') || 'null');
    } catch (e) {
      return null;
    }
  })();
  const effectiveUserId = userProfile?.id || userProfile?.email || fallbackProfile?.id || fallbackProfile?.email;

  const storageKey = (key) => `rently_${key}_user_${effectiveUserId || 'anon'}`;

  useEffect(() => {
    const matchesKey = `rently_matches_user_${userProfile?.id || 'anon'}`;
    const passesKey = `rently_passes_user_${userProfile?.id || 'anon'}`;
    const savedMatches = JSON.parse(localStorage.getItem(matchesKey) || '[]');
    const savedPasses = JSON.parse(localStorage.getItem(passesKey) || '[]');
    setMatches(savedMatches);
    setPasses(savedPasses);
    setCurrentIndex(savedMatches.length + savedPasses.length);
  }, [userProfile?.id]);

  const fetchMatches = useCallback(async () => {
    if (!effectiveUserId) {
      setError('Missing user ID. Please sign in again.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const resp = await api.matchRoommates({ user_id: effectiveUserId });
      if (!resp.success) {
        throw new Error(resp.message || 'Failed to load matches');
      }
      setProfiles(resp.matches || []);
    } catch (err) {
      console.error('Load matches error:', err);
      setError(err.message || 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

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
        // also create conversation entry for Messages
        const convKey = storageKey('conversations');
        const existingConvs = JSON.parse(localStorage.getItem(convKey) || '[]');
        if (!existingConvs.find(c => c.id === currentProfile.id)) {
          const conversation = {
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
          localStorage.setItem(convKey, JSON.stringify([conversation, ...existingConvs]));
        }
      } else {
        const newPasses = [...passes, currentProfile];
        setPasses(newPasses);
        persistState(matches, newPasses);
      }
      setCurrentIndex(currentIndex + 1);
      setSwipeDirection(null);
    }, 280);
  };

  const handleMessage = (profile) => {
    const newConv = {
      id: profile.id,
      name: profile.name,
            avatar: profile.avatar || profile.image || '👤',
      major: profile.major || 'Student',
      matchScore: profile.match_score || 90,
      lastMessage: 'Matched via Roommate Finder',
      timestamp: 'Just now',
      unread: 0,
      online: true
    };

    const convKey = storageKey('conversations');
    const existingConvs = JSON.parse(localStorage.getItem(convKey) || '[]');
    if (!existingConvs.find(c => c.id === newConv.id)) {
      existingConvs.unshift(newConv);
      localStorage.setItem(convKey, JSON.stringify(existingConvs));
    }

    onNavigate('messages');
  };

  if (loading) {
    return (
      <div className="roommate-matching yugioh-page">
        <div className="matching-header">
          <button className="back-btn" onClick={onBack}>← Back</button>
          <h2>Find Your Roommate</h2>
        </div>
        <p>Loading matches...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="roommate-matching yugioh-page">
        <div className="matching-header">
          <button className="back-btn" onClick={onBack}>← Back</button>
          <h2>Find Your Roommate</h2>
        </div>
        <p style={{ color: 'red' }}>{error}</p>
        <button className="primary-btn" onClick={fetchMatches}>Retry</button>
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="matching-complete">
        <div className="complete-content">
          <h2>👍 All caught up!</h2>
          <div className="match-summary">
            <div className="summary-card">
              <div className="summary-icon">✅</div>
              <h3>{matches.length} Matches</h3>
            </div>
            <div className="summary-card">
              <div className="summary-icon">👋</div>
              <h3>{passes.length} Passes</h3>
            </div>
          </div>
          
          <div className="matches-list">
            <h3>Your Matches</h3>
            {matches.map(match => {
              const loc = (() => {
                const parseLocString = (locStr) => {
                  try { return JSON.parse(locStr.replace(/'/g, '"')); } catch { return null; }
                };
                let locObj = match.city || match.location;
                if (!locObj) return '';
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
              })();

              return (
                <div key={match.id} className="match-item">
                  <span className="match-avatar">{match.image || '👤'}</span>
                  <div className="match-info">
                    <h4>{match.name}</h4>
                    {loc && <p>{loc}</p>}
                    <p>Budget: ${match.rent_ask || match.budget_max || '—'}/mo</p>
                  </div>
                  <button className="message-btn" onClick={() => handleMessage(match)}>Message</button>
                </div>
              );
            })}
          </div>
          <button className="primary-btn" onClick={onBack}>Back to Dashboard</button>
        </div>
        <style>{`
          .matching-complete { padding: 40px; text-align: center; max-width: 600px; margin: 0 auto; }
          .match-summary { display: flex; gap: 20px; justify-content: center; margin: 30px 0; }
          .summary-card { background: white; padding: 20px; border-radius: 12px; width: 150px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .summary-icon { font-size: 2rem; display: block; margin-bottom: 10px; }
          .matches-list { text-align: left; background: white; padding: 20px; border-radius: 12px; margin-bottom: 30px; }
          .match-item { display: flex; align-items: center; gap: 15px; padding: 10px 0; border-bottom: 1px solid #eee; }
          .match-avatar { font-size: 2rem; }
          .match-info { flex: 1; }
          .message-btn { background: #9b59b6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
          .primary-btn { background: #333; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 1rem; }
        `}</style>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];
  const budgetDisplay = currentProfile.rent_ask || currentProfile.budget_max || '—';
  const locationDisplay = (() => {
    const parseLocString = (locStr) => {
      try {
        // Convert Python-style single-quoted dict to JSON and parse
        return JSON.parse(locStr.replace(/'/g, '"'));
      } catch (e) {
        return null;
      }
    };

    let loc = currentProfile.city || currentProfile.location;
    if (!loc) return '';

    if (typeof loc === 'string') {
      // If it's already a short string without dict fields, just return
      if (!loc.includes('address_line1')) return loc;
      const parsed = parseLocString(loc);
      if (parsed) loc = parsed;
      else return loc;
    }

    if (loc.address_line1 && loc.address_line2) return `${loc.address_line1}, ${loc.address_line2}`;
    if (loc.address_line1 && loc.city) return `${loc.address_line1}, ${loc.city}`;
    if (loc.formatted) return loc.formatted;
    if (loc.city) return loc.city;
    return '';
  })();
  const avatar = currentProfile.image || '👤';

  return (
    <div className="roommate-matching yugioh-page">
      <div className="matching-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h2>Find Your Roommate</h2>
      </div>

      <div className="card-container">
        <div className={`yugioh-card ${swipeDirection ? `swipe-${swipeDirection}` : ''}`}>
          <div className="card-frame">
            <div className="card-title">
              <span>{currentProfile.name || 'Unknown'}</span>
              {currentProfile.match_score && <span className="match-badge">{currentProfile.match_score}% match</span>}
            </div>

            <div className="card-illustration">
              <div
                className="card-portrait"
                style={{
                  backgroundImage: avatar.startsWith('http') ? `url(${avatar})` : undefined,
                }}
              >
                {!avatar.startsWith('http') && <div className="avatar-fallback">{avatar}</div>}
              </div>
              <div className="portrait-fade" />
            </div>

            <div className="card-body">
              {locationDisplay && <div className="card-field"><strong>Location:</strong> {locationDisplay}</div>}
              <div className="card-field"><strong>Budget ask:</strong> ${budgetDisplay}/mo</div>
              <div className="card-field"><strong>Cleanliness:</strong> {currentProfile.cleanliness || '—'}</div>
              <div className="card-field"><strong>Sleep:</strong> {currentProfile.sleep_schedule || '—'}</div>
              {(currentProfile.interests || []).length > 0 && (
                <div className="card-field">
                  <strong>Interests:</strong> {(currentProfile.interests || []).slice(0, 4).join(', ')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="action-buttons-container">
        <button className="action-btn pass-btn" onClick={() => handleSwipe('left')}>👎</button>
        <button className="action-btn like-btn" onClick={() => handleSwipe('right')}>❤️</button>
      </div>

      <style>{`
        .yugioh-page {
          max-width: 520px;
          margin: 0 auto;
          padding: 20px;
        }
        .matching-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .card-container { perspective: 1000px; }
        .yugioh-card { transition: transform 0.3s, opacity 0.3s; }
        .yugioh-card.swipe-left { transform: translateX(-200px) rotate(-8deg); opacity: 0; }
        .yugioh-card.swipe-right { transform: translateX(200px) rotate(8deg); opacity: 0; }

        .card-frame {
          background: linear-gradient(180deg, #1b9380 0%, #0f7a69 100%);
          border: 4px solid #c3a262;
          border-radius: 18px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.18);
          overflow: hidden;
        }
        .card-title {
          background: linear-gradient(90deg, rgba(255,255,255,0.28), rgba(255,255,255,0.06));
          padding: 10px 14px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: #1d1b19;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid rgba(0,0,0,0.08);
        }
        .match-badge {
          background: #fbc02d;
          color: #4a3500;
          padding: 4px 8px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
        }
        .card-illustration {
          position: relative;
          height: 220px;
          background: radial-gradient(circle at 50% 30%, rgba(255,255,255,0.4), rgba(0,0,0,0.05));
        }
        .card-portrait {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 64px;
        }
        .avatar-fallback {
          width: 120px;
          height: 120px;
          border-radius: 12px;
          background: linear-gradient(135deg, #7c3aed, #22d3ee);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 48px;
          box-shadow: 0 10px 20px rgba(0,0,0,0.15);
        }
        .portrait-fade {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 80px;
          background: linear-gradient(180deg, rgba(255,255,255,0) 0%, #f5efe3 100%);
        }
        .card-body {
          background: #f5efe3;
          padding: 16px 14px 18px;
          border-top: 2px solid rgba(0,0,0,0.1);
          font-family: "Times New Roman", serif;
          color: #2f2a25;
        }
        .card-field { margin-bottom: 8px; font-size: 14px; }
        .card-field strong { margin-right: 6px; }

        .action-buttons-container { display: flex; justify-content: center; gap: 30px; margin-top: 24px; }
        .action-btn { width: 70px; height: 70px; border-radius: 50%; border: none; font-size: 2rem; cursor: pointer; transition: transform 0.2s; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .action-btn:hover { transform: scale(1.1); }
        .pass-btn { background: white; color: #ff6b6b; }
        .like-btn { background: linear-gradient(45deg, #fd5068, #ff6b9d); color: white; }
      `}</style>
    </div>
  );
};

export default RoommateMatching;
