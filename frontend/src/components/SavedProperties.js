import React, { useState, useEffect } from 'react';

const SAMPLE_SAVED = [
  {
    id: 1,
    type: 'property',
    title: 'Modern Downtown Apartment',
    location: 'Downtown Toronto, ON',
    price: 2200,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 650,
    image: '🏢',
    saved: '2 days ago',
    features: ['Parking', 'Laundry', 'Gym']
  },
  {
    id: 2,
    type: 'property',
    title: 'Cozy North York Condo',
    location: 'North York, ON',
    price: 1800,
    bedrooms: 2,
    bathrooms: 1,
    sqft: 800,
    image: '🏠',
    saved: '5 days ago',
    features: ['Parking', 'Balcony', 'Pet-Friendly']
  },
  {
    id: 3,
    type: 'roommate',
    name: 'Sarah Johnson',
    age: 22,
    major: 'Computer Science',
    budget: '$800-$1200',
    avatar: '👩‍💻',
    saved: '1 week ago',
    matchScore: 92
  },
  {
    id: 4,
    type: 'property',
    title: 'Spacious Scarborough Unit',
    location: 'Scarborough, ON',
    price: 1600,
    bedrooms: 2,
    bathrooms: 1.5,
    sqft: 900,
    image: '🏘️',
    saved: '1 week ago',
    features: ['Parking', 'Storage', 'Utilities Included']
  },
  {
    id: 5,
    type: 'roommate',
    name: 'Emma Davis',
    age: 23,
    major: 'Psychology',
    budget: '$900-$1300',
    avatar: '👩‍🎓',
    saved: '2 weeks ago',
    matchScore: 88
  }
];

const SavedProperties = ({ onBack }) => {
  const [filter, setFilter] = useState('all');
  const [saved, setSaved] = useState([]);

  // Load saved properties from localStorage
  useEffect(() => {
    loadSavedItems();
  }, []);

  const loadSavedItems = () => {
    // Load saved properties
    const savedProperties = JSON.parse(localStorage.getItem('rently_saved_properties') || '[]');
    
    // Format properties to match the component structure
    const formattedProperties = savedProperties.map(prop => ({
      id: prop.id,
      type: 'property',
      title: prop.title,
      location: prop.address,
      price: prop.rent,
      bedrooms: prop.bedrooms,
      bathrooms: prop.bathrooms,
      sqft: prop.sqft,
      image: prop.image,
      saved: getTimeSince(prop.savedAt),
      features: [
        prop.parking && 'Parking',
        prop.laundry && 'Laundry',
        prop.utilities && 'Utilities Included',
        prop.petFriendly && 'Pet-Friendly',
        prop.furnished && 'Furnished'
      ].filter(Boolean),
      landlord: prop.landlord
    }));

    // Merge with sample roommates (keep sample data for roommates)
    const sampleRoommates = SAMPLE_SAVED.filter(item => item.type === 'roommate');
    setSaved([...formattedProperties, ...sampleRoommates]);
    
    console.log(`📂 Loaded ${formattedProperties.length} saved properties`);
  };

  const getTimeSince = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? 's' : ''} ago`;
  };

  const filteredItems = saved.filter(item => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  const handleRemove = (id) => {
    if (window.confirm('Remove this item from saved?')) {
      // Remove from state
      setSaved(saved.filter(item => item.id !== id));
      
      // Remove from localStorage
      const savedProperties = JSON.parse(localStorage.getItem('rently_saved_properties') || '[]');
      const updated = savedProperties.filter(p => p.id !== id);
      localStorage.setItem('rently_saved_properties', JSON.stringify(updated));
      
      console.log('🗑️ Removed property from saved');
    }
  };

  const propertiesCount = saved.filter(i => i.type === 'property').length;
  const roommatesCount = saved.filter(i => i.type === 'roommate').length;

  return (
    <div className="saved-container">
      <div className="saved-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h2>Saved Items</h2>
      </div>

      <div className="filter-tabs">
        <button 
          className={`tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({saved.length})
        </button>
        <button 
          className={`tab ${filter === 'property' ? 'active' : ''}`}
          onClick={() => setFilter('property')}
        >
          Properties ({propertiesCount})
        </button>
        <button 
          className={`tab ${filter === 'roommate' ? 'active' : ''}`}
          onClick={() => setFilter('roommate')}
        >
          Roommates ({roommatesCount})
        </button>
      </div>

      {filteredItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No saved items</h3>
          <p>Items you save will appear here</p>
        </div>
      ) : (
        <div className="saved-grid">
          {filteredItems.map(item => (
            item.type === 'property' ? (
              <div key={item.id} className="saved-card property-card">
                <div className="card-header">
                  <div className="property-image">{item.image}</div>
                  <button className="remove-btn" onClick={() => handleRemove(item.id)}>
                    ✕
                  </button>
                </div>
                
                <div className="card-content">
                  <h3>{item.title}</h3>
                  <p className="location">📍 {item.location}</p>
                  
                  <div className="price-tag">
                    ${item.price}/month
                  </div>

                  <div className="property-specs">
                    <span>🛏️ {item.bedrooms} bed</span>
                    <span>🚿 {item.bathrooms} bath</span>
                    <span>📐 {item.sqft} sqft</span>
                  </div>

                  <div className="features-list">
                    {item.features.map((feature, idx) => (
                      <span key={idx} className="feature-tag">{feature}</span>
                    ))}
                  </div>

                  <div className="card-footer">
                    <span className="saved-time">Saved {item.saved}</span>
                    <button className="view-btn">View Details</button>
                  </div>
                </div>
              </div>
            ) : (
              <div key={item.id} className="saved-card roommate-card">
                <div className="card-header">
                  <div className="match-score">{item.matchScore}% Match</div>
                  <button className="remove-btn" onClick={() => handleRemove(item.id)}>
                    ✕
                  </button>
                </div>

                <div className="roommate-info">
                  <div className="roommate-avatar">{item.avatar}</div>
                  <h3>{item.name}, {item.age}</h3>
                  <p className="major">{item.major}</p>
                  <p className="budget">💰 {item.budget}</p>
                </div>

                <div className="card-footer">
                  <span className="saved-time">Saved {item.saved}</span>
                  <button className="message-btn">Message</button>
                </div>
              </div>
            )
          ))}
        </div>
      )}

      <style>{`
        .saved-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .saved-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 30px;
        }

        .saved-header h2 {
          margin: 0;
          font-size: 2rem;
        }

        .back-btn {
          padding: 10px 20px;
          background: white;
          border: 2px solid #ddd;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .back-btn:hover {
          background: #f5f5f5;
          border-color: #9b59b6;
        }

        .filter-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 30px;
          background: white;
          padding: 10px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .tab {
          flex: 1;
          padding: 12px 24px;
          background: transparent;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          color: #666;
        }

        .tab:hover {
          background: #f5f5f5;
        }

        .tab.active {
          background: linear-gradient(45deg, #fd5068, #ff6b9d);
          color: white;
        }

        .empty-state {
          text-align: center;
          padding: 80px 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .empty-icon {
          font-size: 5rem;
          margin-bottom: 20px;
        }

        .empty-state h3 {
          margin: 0 0 10px 0;
          font-size: 1.8rem;
          color: #333;
        }

        .empty-state p {
          margin: 0;
          color: #666;
          font-size: 1.1rem;
        }

        .saved-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        .saved-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .saved-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }

        .card-header {
          position: relative;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .property-card .card-header {
          background: linear-gradient(45deg, #fd5068, #ff6b9d);
        }

        .property-image {
          font-size: 4rem;
        }

        .remove-btn {
          background: rgba(255, 255, 255, 0.9);
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .remove-btn:hover {
          background: #ff6b6b;
          color: white;
          transform: scale(1.1);
        }

        .card-content {
          padding: 20px;
        }

        .card-content h3 {
          margin: 0 0 10px 0;
          font-size: 1.3rem;
          color: #333;
        }

        .location {
          margin: 0 0 15px 0;
          color: #666;
          font-size: 0.95rem;
        }

        .price-tag {
          display: inline-block;
          padding: 8px 16px;
          background: #ffe6ec;
          color: #fd5068;
          border-radius: 8px;
          font-weight: 700;
          font-size: 1.2rem;
          margin-bottom: 15px;
        }

        .property-specs {
          display: flex;
          gap: 15px;
          margin-bottom: 15px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .property-specs span {
          font-size: 0.9rem;
          color: #666;
        }

        .features-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 15px;
        }

        .feature-tag {
          padding: 6px 12px;
          background: #e3f2fd;
          color: #1976d2;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 15px;
          border-top: 1px solid #f0f0f0;
        }

        .saved-time {
          font-size: 0.85rem;
          color: #999;
        }

        .view-btn, .message-btn {
          padding: 8px 20px;
          background: #fd5068;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .view-btn:hover, .message-btn:hover {
          background: #ff6b9d;
        }

        .roommate-card .card-header {
          background: white;
          border-bottom: 1px solid #f0f0f0;
        }

        .match-score {
          padding: 6px 12px;
          background: linear-gradient(135deg, #51cf66 0%, #40c057 100%);
          color: white;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.9rem;
        }

        .roommate-info {
          padding: 30px 20px;
          text-align: center;
        }

        .roommate-avatar {
          font-size: 5rem;
          margin-bottom: 15px;
        }

        .roommate-info h3 {
          margin: 0 0 8px 0;
          font-size: 1.4rem;
          color: #333;
        }

        .major {
          margin: 0 0 10px 0;
          color: #666;
          font-size: 1rem;
        }

        .budget {
          margin: 0;
          font-weight: 600;
          color: #fd5068;
          font-size: 1.1rem;
        }

        @media (max-width: 768px) {
          .saved-header h2 {
            font-size: 1.5rem;
          }

          .filter-tabs {
            flex-direction: column;
          }

          .saved-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default SavedProperties;
