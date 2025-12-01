import React, { useState, useEffect } from 'react';

const SAMPLE_PROFILES = [
  { id: 101, name: 'Sarah Johnson', age: 22, major: 'Computer Science', year: '3rd Year', budget: '$800-$1200', sleepSchedule: 'Night Owl', cleanliness: 'Very Clean', interests: ['Gaming', 'Coding', 'Movies'], bio: 'CS major looking for a chill roommate!', image: '👩‍💻' },
  { id: 102, name: 'Mike Chen', age: 21, major: 'Business', year: '2nd Year', budget: '$700-$1000', sleepSchedule: 'Early Bird', cleanliness: 'Moderate', interests: ['Gym', 'Cooking', 'Hiking'], bio: 'Business student who loves staying active.', image: '👨‍💼' },
  { id: 103, name: 'Emma Davis', age: 23, major: 'Psychology', year: '4th Year', budget: '$900-$1300', sleepSchedule: 'Flexible', cleanliness: 'Very Clean', interests: ['Reading', 'Yoga', 'Coffee'], bio: 'Psychology major in final year.', image: '👩‍🎓' },
];

const RoommateMatching = ({ onBack, onNavigate }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState([]);
  const [passes, setPasses] = useState([]);
  const [swipeDirection, setSwipeDirection] = useState(null);

  // Load previous progress
  useEffect(() => {
    localStorage.removeItem('rently_matches');
    localStorage.removeItem('rently_passes');
    
    // 2. Set initial state to empty
    setMatches([]);
    setPasses([]);
    setCurrentIndex(0);
  }, []);

  const handleSwipe = (direction) => {
    const currentProfile = SAMPLE_PROFILES[currentIndex];
    if (!currentProfile) return;

    setSwipeDirection(direction);
    setTimeout(() => {
      if (direction === 'right') {
        const newMatches = [...matches, currentProfile];
        setMatches(newMatches);
        localStorage.setItem('rently_matches', JSON.stringify(newMatches));
        
        // Also save to "Saved Properties" as a roommate
        const savedItems = JSON.parse(localStorage.getItem('rently_saved_properties') || '[]');
        if (!savedItems.find(i => i.id === currentProfile.id)) {
            savedItems.push({ ...currentProfile, type: 'roommate', savedAt: new Date().toISOString() });
            localStorage.setItem('rently_saved_properties', JSON.stringify(savedItems));
        }
      } else {
        const newPasses = [...passes, currentProfile];
        setPasses(newPasses);
        localStorage.setItem('rently_passes', JSON.stringify(newPasses));
      }
      setCurrentIndex(currentIndex + 1);
      setSwipeDirection(null);
    }, 300);
  };

  const handleMessage = (profile) => {
    // 1. Create conversation object
    const newConv = {
      id: profile.id,
      name: profile.name,
      avatar: profile.image,
      major: profile.major,
      matchScore: 90, // Mock score
      lastMessage: 'Matched via Roommate Finder',
      timestamp: 'Just now',
      unread: 0,
      online: true
    };

    // 2. Save to localStorage
    const existingConvs = JSON.parse(localStorage.getItem('rently_conversations') || '[]');
    if (!existingConvs.find(c => c.id === newConv.id)) {
      existingConvs.unshift(newConv);
      localStorage.setItem('rently_conversations', JSON.stringify(existingConvs));
    }

    // 3. Navigate
    onNavigate('messages');
  };

  if (currentIndex >= SAMPLE_PROFILES.length) {
    return (
      <div className="matching-complete">
        <div className="complete-content">
          <h2>🎉 All caught up!</h2>
          <div className="match-summary">
            <div className="summary-card">
              <div className="summary-icon">💚</div>
              <h3>{matches.length} Matches</h3>
            </div>
            <div className="summary-card">
              <div className="summary-icon">💔</div>
              <h3>{passes.length} Passes</h3>
            </div>
          </div>
          
          <div className="matches-list">
            <h3>Your Matches</h3>
            {matches.map(match => (
              <div key={match.id} className="match-item">
                <span className="match-avatar">{match.image}</span>
                <div className="match-info">
                  <h4>{match.name}</h4>
                  <p>{match.major}</p>
                </div>
                <button className="message-btn" onClick={() => handleMessage(match)}>Message</button>
              </div>
            ))}
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

  const currentProfile = SAMPLE_PROFILES[currentIndex];

  return (
    <div className="roommate-matching">
      <div className="matching-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h2>Find Your Roommate</h2>
      </div>

      <div className="card-container">
        <div className={`profile-card ${swipeDirection ? `swipe-${swipeDirection}` : ''}`}>
          <div className="profile-header">
            <div className="profile-avatar">{currentProfile.image}</div>
            <div className="profile-basic">
              <h3>{currentProfile.name}, {currentProfile.age}</h3>
              <p>{currentProfile.major} • {currentProfile.year}</p>
            </div>
          </div>
          <div className="profile-bio">
            <p>{currentProfile.bio}</p>
            <div className="interests-tags">
              {currentProfile.interests.map((tag, i) => <span key={i} className="tag">{tag}</span>)}
            </div>
          </div>
        </div>
      </div>

      <div className="action-buttons-container">
        <button className="action-btn pass-btn" onClick={() => handleSwipe('left')}>✕</button>
        <button className="action-btn like-btn" onClick={() => handleSwipe('right')}>♥</button>
      </div>

      <style>{`
        .roommate-matching { max-width: 500px; margin: 0 auto; padding: 20px; }
        .matching-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .card-container { perspective: 1000px; height: 450px; }
        .profile-card { background: white; border-radius: 20px; padding: 30px; height: 100%; box-shadow: 0 10px 30px rgba(0,0,0,0.1); transition: transform 0.3s; }
        .profile-card.swipe-left { transform: translateX(-200px) rotate(-20deg); opacity: 0; }
        .profile-card.swipe-right { transform: translateX(200px) rotate(20deg); opacity: 0; }
        .profile-avatar { font-size: 5rem; text-align: center; margin-bottom: 20px; }
        .profile-basic { text-align: center; margin-bottom: 20px; }
        .tag { display: inline-block; background: #eee; padding: 5px 10px; border-radius: 15px; margin: 5px; font-size: 0.85rem; }
        .action-buttons-container { display: flex; justify-content: center; gap: 30px; margin-top: 30px; }
        .action-btn { width: 70px; height: 70px; border-radius: 50%; border: none; font-size: 2rem; cursor: pointer; transition: transform 0.2s; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .action-btn:hover { transform: scale(1.1); }
        .pass-btn { background: white; color: #ff6b6b; }
        .like-btn { background: linear-gradient(45deg, #fd5068, #ff6b9d); color: white; }
      `}</style>
    </div>
  );
};

export default RoommateMatching;