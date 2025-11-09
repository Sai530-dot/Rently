import React, { useState } from 'react';

const SAMPLE_PROFILES = [
  {
    id: 1,
    name: 'Sarah Johnson',
    age: 22,
    major: 'Computer Science',
    year: '3rd Year',
    budget: '$800-$1200',
    sleepSchedule: 'Night Owl',
    cleanliness: 'Very Clean',
    interests: ['Gaming', 'Coding', 'Movies'],
    bio: 'CS major looking for a chill roommate who respects quiet study time but also enjoys movie nights!',
    image: '👩‍💻'
  },
  {
    id: 2,
    name: 'Mike Chen',
    age: 21,
    major: 'Business',
    year: '2nd Year',
    budget: '$700-$1000',
    sleepSchedule: 'Early Bird',
    cleanliness: 'Moderate',
    interests: ['Gym', 'Cooking', 'Hiking'],
    bio: 'Business student who loves staying active. Looking for someone who enjoys cooking together and outdoor activities.',
    image: '👨‍💼'
  },
  {
    id: 3,
    name: 'Emma Davis',
    age: 23,
    major: 'Psychology',
    year: '4th Year',
    budget: '$900-$1300',
    sleepSchedule: 'Flexible',
    cleanliness: 'Very Clean',
    interests: ['Reading', 'Yoga', 'Coffee'],
    bio: 'Psychology major in final year. Love quiet evenings with a good book and weekend brunches!',
    image: '👩‍🎓'
  },
  {
    id: 4,
    name: 'Alex Kumar',
    age: 20,
    major: 'Engineering',
    year: '2nd Year',
    budget: '$750-$1100',
    sleepSchedule: 'Night Owl',
    cleanliness: 'Clean',
    interests: ['Music', 'Tech', 'Photography'],
    bio: 'Engineering student and music enthusiast. Looking for a roommate who appreciates good vibes and tech talks.',
    image: '👨‍🔧'
  },
  {
    id: 5,
    name: 'Jessica Lee',
    age: 22,
    major: 'Arts',
    year: '3rd Year',
    budget: '$800-$1200',
    sleepSchedule: 'Early Bird',
    cleanliness: 'Very Clean',
    interests: ['Art', 'Travel', 'Photography'],
    bio: 'Art student who loves creativity and exploring new places. Seeking a tidy and adventurous roommate!',
    image: '👩‍🎨'
  }
];

const RoommateMatching = ({ onBack, userPreferences }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState([]);
  const [passes, setPasses] = useState([]);
  const [swipeDirection, setSwipeDirection] = useState(null);

  const currentProfile = SAMPLE_PROFILES[currentIndex];

  const handleSwipe = (direction) => {
    if (!currentProfile) return;

    setSwipeDirection(direction);
    
    setTimeout(() => {
      if (direction === 'right') {
        setMatches([...matches, currentProfile]);
      } else {
        setPasses([...passes, currentProfile]);
      }
      
      setCurrentIndex(currentIndex + 1);
      setSwipeDirection(null);
    }, 300);
  };

  const handleUndo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSwipeDirection(null);
      
      // Remove from matches or passes
      const lastProfile = SAMPLE_PROFILES[currentIndex - 1];
      setMatches(matches.filter(m => m.id !== lastProfile.id));
      setPasses(passes.filter(p => p.id !== lastProfile.id));
    }
  };

  if (currentIndex >= SAMPLE_PROFILES.length) {
    return (
      <div className="matching-complete">
        <div className="complete-content">
          <h2>🎉 You've reviewed all profiles!</h2>
          <div className="match-summary">
            <div className="summary-card">
              <div className="summary-icon">💚</div>
              <h3>{matches.length} Matches</h3>
              <p>People you liked</p>
            </div>
            <div className="summary-card">
              <div className="summary-icon">💔</div>
              <h3>{passes.length} Passes</h3>
              <p>People you passed on</p>
            </div>
          </div>
          
          {matches.length > 0 && (
            <div className="matches-list">
              <h3>Your Matches</h3>
              {matches.map(match => (
                <div key={match.id} className="match-item">
                  <span className="match-avatar">{match.image}</span>
                  <div className="match-info">
                    <h4>{match.name}</h4>
                    <p>{match.major} • {match.year}</p>
                  </div>
                  <button className="message-btn">Message</button>
                </div>
              ))}
            </div>
          )}
          
          <div className="action-buttons">
            <button className="secondary-btn" onClick={() => setCurrentIndex(0)}>
              Review Again
            </button>
            <button className="primary-btn" onClick={onBack}>
              Back to Dashboard
            </button>
          </div>
        </div>

        <style>{`
          .matching-complete {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 80vh;
            padding: 20px;
          }

          .complete-content {
            max-width: 600px;
            width: 100%;
            text-align: center;
          }

          .complete-content h2 {
            font-size: 2rem;
            margin-bottom: 30px;
            color: #333;
          }

          .match-summary {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 40px;
          }

          .summary-card {
            background: white;
            padding: 30px;
            border-radius: 16px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }

          .summary-icon {
            font-size: 3rem;
            margin-bottom: 10px;
          }

          .summary-card h3 {
            font-size: 2rem;
            margin: 10px 0 5px 0;
            color: #333;
          }

          .summary-card p {
            color: #666;
            margin: 0;
          }

          .matches-list {
            background: white;
            padding: 20px;
            border-radius: 16px;
            margin-bottom: 30px;
            text-align: left;
          }

          .matches-list h3 {
            margin: 0 0 20px 0;
            font-size: 1.3rem;
          }

          .match-item {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 15px;
            border-bottom: 1px solid #eee;
          }

          .match-item:last-child {
            border-bottom: none;
          }

          .match-avatar {
            font-size: 2.5rem;
          }

          .match-info {
            flex: 1;
          }

          .match-info h4 {
            margin: 0 0 5px 0;
            font-size: 1.1rem;
          }

          .match-info p {
            margin: 0;
            color: #666;
            font-size: 0.9rem;
          }

          .message-btn {
            padding: 8px 20px;
            background: #9b59b6;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          }

          .message-btn:hover {
            background: #8e44ad;
          }

          .action-buttons {
            display: flex;
            gap: 15px;
            justify-content: center;
          }

          .secondary-btn, .primary-btn {
            padding: 12px 30px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            font-size: 1rem;
          }

          .secondary-btn {
            background: white;
            border: 2px solid #9b59b6;
            color: #9b59b6;
          }

          .secondary-btn:hover {
            background: #f8f4fb;
          }

          .primary-btn {
            background: #9b59b6;
            border: none;
            color: white;
          }

          .primary-btn:hover {
            background: #8e44ad;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="roommate-matching">
      <div className="matching-header">
        <h2>Find Your Roommate</h2>
        <div className="progress">{currentIndex + 1} / {SAMPLE_PROFILES.length}</div>
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

          <div className="profile-details">
            <div className="detail-item">
              <span className="detail-icon">💰</span>
              <div>
                <strong>Budget</strong>
                <p>{currentProfile.budget}</p>
              </div>
            </div>
            <div className="detail-item">
              <span className="detail-icon">😴</span>
              <div>
                <strong>Sleep Schedule</strong>
                <p>{currentProfile.sleepSchedule}</p>
              </div>
            </div>
            <div className="detail-item">
              <span className="detail-icon">✨</span>
              <div>
                <strong>Cleanliness</strong>
                <p>{currentProfile.cleanliness}</p>
              </div>
            </div>
          </div>

          <div className="profile-bio">
            <h4>About</h4>
            <p>{currentProfile.bio}</p>
          </div>

          <div className="profile-interests">
            <h4>Interests</h4>
            <div className="interests-tags">
              {currentProfile.interests.map((interest, idx) => (
                <span key={idx} className="interest-tag">{interest}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="action-buttons-container">
        <button 
          className="action-btn pass-btn" 
          onClick={() => handleSwipe('left')}
          disabled={swipeDirection !== null}
        >
          <span className="btn-icon">✕</span>
          <span className="btn-text">Pass</span>
        </button>
        
        <button 
          className="action-btn undo-btn" 
          onClick={handleUndo}
          disabled={currentIndex === 0 || swipeDirection !== null}
        >
          <span className="btn-icon">↺</span>
          <span className="btn-text">Undo</span>
        </button>
        
        <button 
          className="action-btn like-btn" 
          onClick={() => handleSwipe('right')}
          disabled={swipeDirection !== null}
        >
          <span className="btn-icon">♥</span>
          <span className="btn-text">Like</span>
        </button>
      </div>

      <style>{`
        .roommate-matching {
          max-width: 500px;
          margin: 0 auto;
          padding: 20px;
        }

        .matching-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .matching-header h2 {
          margin: 0;
          font-size: 1.5rem;
        }

        .back-btn {
          padding: 8px 16px;
          background: white;
          border: 2px solid #ddd;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }

        .back-btn:hover {
          background: #f5f5f5;
        }

        .progress {
          font-weight: 600;
          color: #666;
        }

        .card-container {
          perspective: 1000px;
          margin-bottom: 30px;
        }

        .profile-card {
          background: white;
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          transition: transform 0.3s ease, opacity 0.3s ease;
        }

        .profile-card.swipe-left {
          transform: translateX(-150%) rotate(-20deg);
          opacity: 0;
        }

        .profile-card.swipe-right {
          transform: translateX(150%) rotate(20deg);
          opacity: 0;
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 25px;
          padding-bottom: 20px;
          border-bottom: 2px solid #f0f0f0;
        }

        .profile-avatar {
          font-size: 4rem;
        }

        .profile-basic h3 {
          margin: 0 0 5px 0;
          font-size: 1.5rem;
        }

        .profile-basic p {
          margin: 0;
          color: #666;
        }

        .profile-details {
          display: grid;
          gap: 15px;
          margin-bottom: 25px;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 12px;
        }

        .detail-icon {
          font-size: 1.8rem;
        }

        .detail-item strong {
          display: block;
          margin-bottom: 3px;
          font-size: 0.9rem;
          color: #666;
        }

        .detail-item p {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: #333;
        }

        .profile-bio, .profile-interests {
          margin-bottom: 20px;
        }

        .profile-bio h4, .profile-interests h4 {
          margin: 0 0 10px 0;
          font-size: 1.1rem;
          color: #333;
        }

        .profile-bio p {
          margin: 0;
          line-height: 1.6;
          color: #555;
        }

        .interests-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .interest-tag {
          padding: 8px 16px;
          background: linear-gradient(45deg, #fd5068, #ff6b9d);
          color: white;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .action-buttons-container {
          display: flex;
          justify-content: center;
          gap: 20px;
        }

        .action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 20px;
          border: none;
          border-radius: 50%;
          width: 80px;
          height: 80px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 600;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-btn:not(:disabled):hover {
          transform: scale(1.1);
        }

        .pass-btn {
          background: #ff6b6b;
          color: white;
        }

        .pass-btn:not(:disabled):hover {
          background: #ff5252;
        }

        .undo-btn {
          background: #ffd93d;
          color: #333;
          width: 60px;
          height: 60px;
        }

        .like-btn {
          background: #51cf66;
          color: white;
        }

        .like-btn:not(:disabled):hover {
          background: #40c057;
        }

        .btn-icon {
          font-size: 2rem;
        }

        .btn-text {
          font-size: 0.8rem;
        }

        @media (max-width: 600px) {
          .roommate-matching {
            padding: 10px;
          }

          .profile-card {
            padding: 20px;
          }

          .action-btn {
            width: 70px;
            height: 70px;
          }

          .undo-btn {
            width: 50px;
            height: 50px;
          }
        }
      `}</style>
    </div>
  );
};

export default RoommateMatching;
