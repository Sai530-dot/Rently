import React from 'react';

const Dashboard = ({ userProfile, userPreferences, onLogout, onUpdatePreferences, onNavigate }) => {
  const firstName = userProfile?.firstName || 'Student';

  const features = [
    {
      icon: '🏠',
      title: 'Find Roommates',
      description: 'Swipe through potential roommates based on your preferences',
      action: 'Browse Matches',
      color: '#fd5068',
      view: 'roommate-matching'
    },
    {
      icon: '🏘️',
      title: 'Browse Properties',
      description: 'Search and filter available rental listings',
      action: 'View Properties',
      color: '#ff6b9d',
      view: 'browse-properties'
    },
    {
      icon: '🗺️',
      title: 'Explore Rent Map',
      description: 'View rental prices across different neighborhoods',
      action: 'View Map',
      color: '#ff8a80',
      view: 'rent-map'
    },
    {
      icon: '📊',
      title: 'Evaluate Offers',
      description: 'Get AI-powered insights on rental offers',
      action: 'Evaluate Now',
      color: '#fd5068',
      view: 'offer-evaluator'
    },
    {
      icon: '💬',
      title: 'Messages',
      description: 'Chat with potential roommates and landlords',
      action: 'View Messages',
      color: '#ff6b9d',
      view: 'messages'
    },
    {
      icon: '⭐',
      title: 'Saved Properties',
      description: 'View your favorite listings and roommate matches',
      action: 'View Saved',
      color: '#ff8a80',
      view: 'saved-properties'
    }
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {firstName}! 👋</h1>
          <p>Here's your personalized dashboard</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Budget</h3>
            <p>${userPreferences?.budget || 'Not set'}/month</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📍</div>
          <div className="stat-content">
            <h3>Location</h3>
            <p>{userPreferences?.location?.city || userPreferences?.location?.formatted || 'Not set'}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">😴</div>
          <div className="stat-content">
            <h3>Sleep Schedule</h3>
            <p>{userPreferences?.sleepSchedule || 'Not set'}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Roommates</h3>
            <p>{userPreferences?.numRoommates || 0} preferred</p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="features-grid">
        {features.map((feature, index) => (
          <div 
            key={index} 
            className="feature-card"
            style={{ borderTop: `4px solid ${feature.color}` }}
          >
            <div className="feature-icon" style={{ color: feature.color }}>
              {feature.icon}
            </div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
            <button 
              className="feature-action-btn"
              style={{ backgroundColor: feature.color }}
              onClick={() => {
                if (feature.view === 'settings') {
                  onUpdatePreferences();
                } else {
                  onNavigate(feature.view);
                }
              }}
            >
              {feature.action}
            </button>
          </div>
        ))}
      </div>

      <style>{`
        .dashboard-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .dashboard-header {
          margin-bottom: 30px;
          padding: 30px;
          background: linear-gradient(45deg, #fd5068, #ff6b9d);
          border-radius: 16px;
          color: white;
          text-align: center;
        }

        .welcome-section h1 {
          margin: 0 0 5px 0;
          font-size: 2rem;
          font-weight: 700;
        }

        .welcome-section p {
          margin: 0;
          opacity: 0.9;
          font-size: 1rem;
        }

        .logout-button {
          padding: 12px 24px;
          background: rgba(255, 255, 255, 0.2);
          border: 2px solid white;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .logout-button:hover {
          background: white;
          color: #667eea;
        }

        .quick-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        .stat-icon {
          font-size: 2.5rem;
        }

        .stat-content h3 {
          margin: 0 0 5px 0;
          font-size: 0.9rem;
          color: #666;
          font-weight: 600;
        }

        .stat-content p {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 700;
          color: #333;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-top: 30px;
        }

        .feature-card {
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          text-align: center;
        }

        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .feature-icon {
          font-size: 3.5rem;
          margin-bottom: 15px;
        }

        .feature-card h3 {
          margin: 0 0 10px 0;
          font-size: 1.3rem;
          font-weight: 700;
          color: #333;
        }

        .feature-card p {
          margin: 0 0 20px 0;
          color: #666;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .feature-action-btn {
          width: 100%;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: opacity 0.3s ease, transform 0.2s ease;
        }

        .feature-action-btn:hover {
          opacity: 0.9;
          transform: scale(1.02);
        }

        .feature-action-btn:active {
          transform: scale(0.98);
        }

        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            gap: 15px;
            text-align: center;
          }

          .welcome-section h1 {
            font-size: 1.5rem;
          }

          .quick-stats {
            grid-template-columns: 1fr;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
