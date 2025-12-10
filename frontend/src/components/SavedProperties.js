import React, { useState, useEffect } from 'react';

const SavedProperties = ({ onBack, onNavigate }) => {
  const [savedItems, setSavedItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('rently_saved_properties') || '[]');
    setSavedItems(saved);
  }, []);

  const handleRemove = (id) => {
    const newItems = savedItems.filter(item => item.id !== id);
    setSavedItems(newItems);
    localStorage.setItem('rently_saved_properties', JSON.stringify(newItems));
    
    // If we removed the item currently open in the modal, close the modal
    if (selectedItem && selectedItem.id === id) {
      setSelectedItem(null);
    }
  };

  const handleMessage = (item) => {
    const newConv = {
      id: item.id,
      name: item.type === 'roommate' ? item.name : `Landlord: ${item.title}`,
      avatar: item.image || '🏠',
      lastMessage: item.type === 'roommate' ? 'Hi, I saw your profile!' : 'I am interested in this property.',
      timestamp: 'Just now',
      unread: 0,
      propertyAddress: item.address,
      propertyRent: item.rent
    };

    const existingConvs = JSON.parse(localStorage.getItem('rently_conversations') || '[]');
    if (!existingConvs.find(c => c.id === newConv.id)) {
      existingConvs.unshift(newConv);
      localStorage.setItem('rently_conversations', JSON.stringify(existingConvs));
    }
    onNavigate('messages');
  };

  const renderCardImage = (item) => {
    const isUrl = typeof item.image === 'string' && item.image.startsWith('http');
    return (
      <div
        className="card-img"
        style={isUrl ? { backgroundImage: `url(${item.image})` } : {}}
      >
        {!isUrl && (item.image || '🏠')}
      </div>
    );
  };

  return (
    <div className="saved-container">
      <div className="saved-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h2>Saved Items</h2>
      </div>

      {savedItems.length === 0 ? (
        <div className="empty-state">
          <h3>No saved items yet</h3>
          <p>Go browse properties or roommates to save them here!</p>
        </div>
      ) : (
        <div className="saved-grid">
          {savedItems.map((item, index) => (
            <div key={index} className="saved-card">
              {renderCardImage(item)}
              <div className="card-info">
                <div className="card-top">
                    <h3>{item.title || item.name}</h3>
                    <button className="remove-btn" onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(item.id);
                    }}>✕</button>
                </div>
                <p>{item.address || item.bio || item.location}</p>
                <p className="price">{item.rent ? `$${item.rent}/mo` : item.budget}</p>
                <div className="card-actions">
                    <button className="msg-btn" onClick={() => handleMessage(item)}>Message</button>
                    {item.type !== 'roommate' && (
                        <button className="view-btn" onClick={() => setSelectedItem(item)}>View Details</button>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- DETAILED MODAL (Matching BrowseProperties.js) --- */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content property-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedItem(null)}>✕</button>
            
            <div className="modal-header">
              <div>
                <h2>{selectedItem.title}</h2>
                <p className="modal-address">📍 {selectedItem.address}</p>
              </div>
              <div className="modal-rent">${selectedItem.rent}/month</div>
            </div>

            <div className="modal-body">
              <div className="modal-section">
                <h3>Property Details</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Bedrooms:</span>
                    <span className="detail-value">{selectedItem.bedrooms === 0 ? 'Studio' : selectedItem.bedrooms}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Bathrooms:</span>
                    <span className="detail-value">{selectedItem.bathrooms}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Square Feet:</span>
                    <span className="detail-value">{selectedItem.sqft} sqft</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Price/sqft:</span>
                    <span className="detail-value">
                        {selectedItem.rent && selectedItem.sqft ? `$${(selectedItem.rent / selectedItem.sqft).toFixed(2)}` : 'N/A'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Available:</span>
                    <span className="detail-value">{selectedItem.available || 'Ask Landlord'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Distance:</span>
                    <span className="detail-value">{selectedItem.distance || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="modal-section">
                <h3>Description</h3>
                <p>{selectedItem.description || "No description provided."}</p>
              </div>

              <div className="modal-section">
                <h3>Features & Amenities</h3>
                <div className="features-grid">
                  <div className="feature-item">
                    <span>Utilities:</span>
                    <strong>{selectedItem.utilities || 'Unknown'}</strong>
                  </div>
                  <div className="feature-item">
                    <span>Parking:</span>
                    <strong>{selectedItem.parking ? 'Yes' : 'No'}</strong>
                  </div>
                  <div className="feature-item">
                    <span>Laundry:</span>
                    <strong>{selectedItem.laundry || 'Unknown'}</strong>
                  </div>
                  <div className="feature-item">
                    <span>Pet Friendly:</span>
                    <strong>{selectedItem.petFriendly ? 'Yes' : 'No'}</strong>
                  </div>
                  <div className="feature-item">
                    <span>Furnished:</span>
                    <strong>{selectedItem.furnished ? 'Yes' : 'No'}</strong>
                  </div>
                  <div className="feature-item">
                    <span>Landlord:</span>
                    <strong>{selectedItem.landlord || 'Private Owner'}</strong>
                  </div>
                </div>
              </div>

              {selectedItem.amenities && (
                <div className="modal-section">
                    <h3>Additional Amenities</h3>
                    <div className="amenities-list">
                    {selectedItem.amenities.map((amenity, index) => (
                        <span key={index} className="amenity-tag">✓ {amenity}</span>
                    ))}
                    </div>
                </div>
              )}

              <div className="modal-actions">
                <button
                  className="remove-btn-large"
                  onClick={() => handleRemove(selectedItem.id)}
                >
                  💔 Remove from Saved
                </button>
                <button 
                  className="contact-landlord-btn"
                  onClick={() => handleMessage(selectedItem)}
                >
                  📧 Contact Landlord
                </button>
                <button className="schedule-viewing-btn">📅 Schedule Viewing</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .saved-container { 
          max-width: 1000px; 
          margin: 0 auto; 
          padding: 20px; 
          /* Added min-height to push footer down */
          min-height: 80vh;
        }
        .saved-header { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; }
        .back-btn { padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer; }
        
        .saved-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .saved-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); display: flex; flex-direction: column; }
        .card-img { height: 150px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 4rem; background-size: cover; background-position: center; }
        .card-info { padding: 15px; flex: 1; display: flex; flex-direction: column; }
        .card-top { display: flex; justify-content: space-between; align-items: start; }
        .card-top h3 { margin: 0 0 5px 0; font-size: 1.1rem; }
        .remove-btn { background: none; border: none; color: #999; cursor: pointer; font-size: 1.2rem; }
        .remove-btn:hover { color: #ff6b6b; }
        .price { color: #fd5068; font-weight: 700; margin: 10px 0; }
        .card-actions { margin-top: auto; display: flex; gap: 10px; }
        .msg-btn, .view-btn { flex: 1; padding: 8px; border-radius: 6px; border: none; cursor: pointer; font-weight: 600; }
        .msg-btn { background: #333; color: white; }
        .view-btn { background: #f0f0f0; color: #333; }
        .empty-state { text-align: center; padding: 50px; color: #666; }

        /* --- MODAL STYLES (MATCHING BROWSE PROPERTIES) --- */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 20px;
        }

        .property-modal {
          background: white;
          border-radius: 16px;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
        }

        .close-modal {
          position: absolute;
          top: 15px; right: 15px;
          background: #f0f0f0; border: none;
          width: 36px; height: 36px;
          border-radius: 50%; font-size: 1.5rem;
          cursor: pointer; transition: all 0.3s ease; z-index: 10;
        }

        .close-modal:hover { background: #fd5068; color: white; }

        .modal-header {
          padding: 30px;
          background: linear-gradient(45deg, #fd5068, #ff6b9d);
          color: white;
          display: flex; justify-content: space-between; align-items: flex-start;
        }

        .modal-header h2 { margin: 0 0 10px 0; font-size: 1.8rem; }
        .modal-address { margin: 0; opacity: 0.9; }
        .modal-rent { font-size: 2rem; font-weight: 700; }

        .modal-body { padding: 30px; }
        .modal-section { margin-bottom: 30px; }
        .modal-section h3 { margin: 0 0 15px 0; font-size: 1.3rem; color: #333; }

        .detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
        .detail-item { display: flex; justify-content: space-between; padding: 12px; background: #f8f9fa; border-radius: 8px; }
        .detail-label { color: #666; font-weight: 500; }
        .detail-value { font-weight: 600; color: #333; }

        .features-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
        .feature-item { display: flex; justify-content: space-between; padding: 12px; background: #f8f9fa; border-radius: 8px; }
        .feature-item span { color: #666; }
        .feature-item strong { color: #333; }

        .amenities-list { display: flex; flex-wrap: wrap; gap: 10px; }
        .amenity-tag { padding: 8px 15px; background: #e6f7ff; color: #1890ff; border-radius: 20px; font-size: 0.9rem; font-weight: 500; }

        .modal-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 30px; }

        .remove-btn-large, .contact-landlord-btn, .schedule-viewing-btn {
          padding: 15px; border: none; border-radius: 8px;
          font-weight: 600; font-size: 1rem; cursor: pointer; transition: all 0.3s ease;
        }

        .remove-btn-large { background: #f0f0f0; color: #ff6b6b; }
        .remove-btn-large:hover { background: #e0e0e0; }

        .contact-landlord-btn { background: #1890ff; color: white; }
        .schedule-viewing-btn { background: #51cf66; color: white; }
        .contact-landlord-btn:hover, .schedule-viewing-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }

        @media (max-width: 768px) {
          .detail-grid, .features-grid, .modal-actions { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default SavedProperties;