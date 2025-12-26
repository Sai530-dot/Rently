import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import realListings from '../data/real_listings.json';
import craigslistData from '../data/craigslist_listings.json';
import kijijiData from '../data/kijiji_listings.json';

const ALL_LISTINGS = [...craigslistData, ...kijijiData];



const BrowseProperties = ({ onBack, userPreferences }) => {
  const [properties, setProperties] = useState(realListings.length > 0 ? realListings : []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [filterBedrooms, setFilterBedrooms] = useState('all');
  const [filterMaxRent, setFilterMaxRent] = useState(userPreferences?.budget || 3000);
  const [filterLocation, setFilterLocation] = useState('all');
  const [sortBy, setSortBy] = useState('rent-low');
  const [savedProperties, setSavedProperties] = useState([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactProperty, setContactProperty] = useState(null);
  const [contactForm, setContactForm] = useState({
    message: '',
    moveInDate: ''
  });

  const userCity = userPreferences?.location?.city || 
                   userPreferences?.location?.formatted?.split(',')[0] || 
                   'Toronto';

  useEffect(() => {
    fetchProperties();
    loadSavedProperties();
  }, []);

  const loadSavedProperties = () => {
    const saved = JSON.parse(localStorage.getItem('rently_saved_properties') || '[]');
    const savedIds = saved.map(p => p.id);
    setSavedProperties(savedIds);
  };

 const fetchProperties = () => {
    setLoading(true);
    setError(null);
    
    fetch(`${API_BASE_URL}/properties`)
      .then(response => response.json())
      .then(data => {
        if (data.success && data.properties) {
          setProperties(data.properties);
          setLoading(false);
        } else {
          throw new Error('No properties found on server');
        }
      })
      .catch(err => {
        if (ALL_LISTINGS && ALL_LISTINGS.length > 0) {
          setProperties(ALL_LISTINGS);
          setError(null);
        } else {
          setProperties([]);
        }
        setLoading(false);
      });
  };

  const handleSaveProperty = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return;

    const existingSaved = JSON.parse(localStorage.getItem('rently_saved_properties') || '[]');
    
    if (savedProperties.includes(propertyId)) {
      const updatedSaved = savedProperties.filter(id => id !== propertyId);
      setSavedProperties(updatedSaved);
      const updatedLocalStorage = existingSaved.filter(p => p.id !== propertyId);
      localStorage.setItem('rently_saved_properties', JSON.stringify(updatedLocalStorage));
    } else {
      setSavedProperties([...savedProperties, propertyId]);
      const propertyToSave = { ...property, savedAt: new Date().toISOString() };
      existingSaved.push(propertyToSave);
      localStorage.setItem('rently_saved_properties', JSON.stringify(existingSaved));
    }
  };

  const handleContactLandlord = (property) => {
    setContactProperty(property);
    setShowContactModal(true);
    setContactForm({
      message: `Hi, I'm interested in your property at ${property.address}. I would like to schedule a viewing.`,
      moveInDate: ''
    });
  };

  const handleContactFormChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitContact = async (e) => {
    e.preventDefault();
    
    const newConversation = {
      id: Date.now(),
      name: contactProperty.landlord,
      avatar: '🏠',
      lastMessage: contactForm.message.substring(0, 50) + '...',
      timestamp: 'Just now',
      unread: 0,
      online: false,
      propertyAddress: contactProperty.address,
      propertyRent: contactProperty.rent
    };

    const newMessage = {
      id: Date.now(),
      text: contactForm.message,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      moveInDate: contactForm.moveInDate || null
    };

    const existingConversations = JSON.parse(localStorage.getItem('rently_conversations') || '[]');
    const existingMessages = JSON.parse(localStorage.getItem('rently_messages') || '{}');

    existingConversations.unshift(newConversation);
    existingMessages[newConversation.id] = [newMessage];

    localStorage.setItem('rently_conversations', JSON.stringify(existingConversations));
    localStorage.setItem('rently_messages', JSON.stringify(existingMessages));

    alert(`✅ Message sent to ${contactProperty.landlord}!\n\nYour conversation has been added to your Messages inbox.`);
    
    setShowContactModal(false);
    setContactProperty(null);
    setContactForm({ message: '', moveInDate: '' });
  };

  const normalizeCity = (address = '') => {
    if (!address) return 'Other';
    const knownCities = ['saskatoon', 'toronto', 'calgary', 'edmonton', 'regina', 'winnipeg', 'vancouver', 'montreal'];
    const tokens = String(address)
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    for (const t of tokens) {
      const lower = t.toLowerCase();
      const match = knownCities.find((c) => lower.includes(c));
      if (match) return match.charAt(0).toUpperCase() + match.slice(1);
    }

    const cleaned = tokens.filter((t) => !/^(on|sk|ab|bc|mb|qc|ns|nb|nl|yt|nt|nu|canada|ontario)$/i.test(t));
    if (cleaned.length > 0) return cleaned[cleaned.length - 1];
    return 'Other';
  };

  const getImageUrl = (imageField, images = []) => {
    const fromImages = Array.isArray(images)
      ? images.find((u) => typeof u === 'string' && u.startsWith('http'))
      : null;
    if (fromImages) return fromImages;
    if (Array.isArray(imageField)) {
      const url = imageField.find((u) => typeof u === 'string' && u.startsWith('http'));
      return url || imageField.find((u) => typeof u === 'string') || null;
    }
    return imageField || null;
  };

  const filteredProperties = properties
    .filter(prop => {
      if (filterBedrooms !== 'all' && prop.bedrooms !== parseInt(filterBedrooms)) return false;
      if (prop.rent > filterMaxRent) return false;
      if (filterLocation !== 'all') {
        if (filterLocation === 'preferred') {
          if (!prop.address.toLowerCase().includes(userCity.toLowerCase())) return false;
        } else if (filterLocation === 'nearby') {
          const distance = parseFloat(prop.distance);
          if (distance > 2.0) return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rent-low': return a.rent - b.rent;
        case 'rent-high': return b.rent - a.rent;
        case 'size-large': return b.sqft - a.sqft;
        case 'distance': return parseFloat(a.distance) - parseFloat(b.distance);
        default: return 0;
      }
    });

  return (
    <div className="browse-properties">
      <div className="properties-header">
        <button className="back-btn" onClick={onBack}>← Back to Dashboard</button>
        <h1>🏠 Browse Properties</h1>
        <p>Find your perfect rental home</p>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label>📍 Location:</label>
          <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)}>
            <option value="all">All Locations</option>
            <option value="preferred">My Preferred City ({userCity})</option>
            <option value="nearby">Within 2km of Campus</option>
          </select>
        </div>

        <div className="filter-group">
          <label>🛏️ Bedrooms:</label>
          <select value={filterBedrooms} onChange={(e) => setFilterBedrooms(e.target.value)}>
            <option value="all">All</option>
            <option value="0">Studio</option>
            <option value="1">1 Bedroom</option>
            <option value="2">2 Bedrooms</option>
            <option value="3">3+ Bedrooms</option>
          </select>
        </div>

        <div className="filter-group">
          <label>💰 Max Rent: ${filterMaxRent}</label>
          <input
            type="range"
            min="800"
            max="3000"
            step="100"
            value={filterMaxRent}
            onChange={(e) => setFilterMaxRent(parseInt(e.target.value))}
          />
          <div className="budget-hint">
            {userPreferences?.budget && (
              <span>Your budget: ${userPreferences.budget}/month</span>
            )}
          </div>
        </div>

        <div className="filter-group">
          <label>📊 Sort By:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="rent-low">Price: Low to High</option>
            <option value="rent-high">Price: High to Low</option>
            <option value="size-large">Size: Largest First</option>
            <option value="distance">Distance to Campus</option>
          </select>
        </div>
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      <div className="properties-stats">
        <span>Showing {filteredProperties.length} properties</span>
        <span>{savedProperties.length} saved</span>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading properties...</p>
        </div>
      ) : (
        <div className="city-sections">
          {Object.entries(
            filteredProperties.reduce((acc, prop) => {
              const city = normalizeCity(prop.address);
              if (!acc[city]) acc[city] = [];
              acc[city].push(prop);
              return acc;
            }, {})
          )
            .sort(([a], [b]) => {
              const al = a.toLowerCase();
              const bl = b.toLowerCase();
              if (al === 'saskatoon' && bl !== 'saskatoon') return -1;
              if (bl === 'saskatoon' && al !== 'saskatoon') return 1;
              return a.localeCompare(b);
            })
            .map(([city, list]) => (
              <section key={city} className="city-section">
                <div className="city-header">
                  {city.toLowerCase() === 'saskatoon' ? 'Popular homes in Saskatoon' : `Homes in ${city}`}
                </div>
                <div className="properties-grid">
                  {list.map((property) => {
                    const imageUrl = getImageUrl(property.image, property.images);
                    const hasImage = typeof imageUrl === 'string' && imageUrl.startsWith('http');
                    return (
                      <div
                        key={property.id}
                        className="property-card"
                        onClick={() => { handleCardClick(property); setSelectedProperty(property); }}
                        role="button"
                        tabIndex={0}
                      >
                        <div
                          className="property-image"
                          style={{
                            backgroundImage: hasImage
                              ? `url(${imageUrl})`
                              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        >
                          {!hasImage && (
                            <span className="property-icon">??</span>
                          )}

                          <button
                        className={`save-btn ${savedProperties.includes(property.id) ? 'saved' : ''}`}
                        onClick={(e) => { e.stopPropagation(); handleSaveProperty(property.id); }}
                      >
                            {savedProperties.includes(property.id) ? 'Saved' : '+'}
                      </button>
                          <span className="available-badge">{property.available || 'Now'}</span>
                        </div>

                        <div className="property-details">
                          <div className="property-header">
                            <h3>{property.title}</h3>
                          </div>

                          {property.available && (
                            <div className="property-subline">{property.available}</div>
                          )}
                          <div className="property-address">{property.address}</div>
                          <div className="property-price">${property.rent}/mo</div>
                          {property.distance && <div className="property-distance">{property.distance}</div>}
                          <div className="property-actions desktop-only">
                            <button
                              className="view-details-btn"
                              onClick={(e) => { e.stopPropagation(); setSelectedProperty(property); }}
                            >
                              View Details
                            </button>
                            <button
                              className="contact-btn"
                              onClick={(e) => { e.stopPropagation(); handleContactLandlord(property); }}
                            >
                              Contact Landlord
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
        </div>
      )}
      {selectedProperty && (
        <div className="modal-overlay" onClick={() => setSelectedProperty(null)}>
          <div className="modal-content property-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedProperty(null)}>✕</button>
            
            <div className="modal-header">
              <div>
                <h2>{selectedProperty.title}</h2>
                <p className="modal-address">📍 {selectedProperty.address}</p>
              </div>
              <div className="modal-rent">${selectedProperty.rent}/month</div>
            </div>

            <div className="modal-body">
              <div className="modal-section">
                <h3>Property Details</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Bedrooms:</span>
                    <span className="detail-value">{selectedProperty.bedrooms === 0 ? 'Studio' : selectedProperty.bedrooms}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Bathrooms:</span>
                    <span className="detail-value">{selectedProperty.bathrooms}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Square Feet:</span>
                    <span className="detail-value">{selectedProperty.sqft} sqft</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Price/sqft:</span>
                    <span className="detail-value">${(selectedProperty.rent / selectedProperty.sqft).toFixed(2)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Available:</span>
                    <span className="detail-value">{selectedProperty.available}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Distance:</span>
                    <span className="detail-value">{selectedProperty.distance}</span>
                  </div>
                </div>
              </div>

              <div className="modal-section">
                <h3>Description</h3>
                <p>{selectedProperty.description}</p>
              </div>

              <div className="modal-section">
                <h3>Features & Amenities</h3>
                <div className="features-grid">
                  <div className="feature-item">
                    <span>Utilities:</span>
                    <strong>{selectedProperty.utilities}</strong>
                  </div>
                  <div className="feature-item">
                    <span>Parking:</span>
                    <strong>{selectedProperty.parking ? 'Yes' : 'No'}</strong>
                  </div>
                  <div className="feature-item">
                    <span>Laundry:</span>
                    <strong>{selectedProperty.laundry}</strong>
                  </div>
                  <div className="feature-item">
                    <span>Pet Friendly:</span>
                    <strong>{selectedProperty.petFriendly ? 'Yes' : 'No'}</strong>
                  </div>
                  <div className="feature-item">
                    <span>Furnished:</span>
                    <strong>{selectedProperty.furnished ? 'Yes' : 'No'}</strong>
                  </div>
                  <div className="feature-item">
                    <span>Landlord:</span>
                    <strong>{selectedProperty.landlord}</strong>
                  </div>
                </div>
              </div>

              <div className="modal-section">
                <h3>Additional Amenities</h3>
                <div className="amenities-list">
                  {selectedProperty.amenities.map((amenity, index) => (
                    <span key={index} className="amenity-tag">✓ {amenity}</span>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="save-property-btn"
                  onClick={() => handleSaveProperty(selectedProperty.id)}
                >
                  {savedProperties.includes(selectedProperty.id) ? '❤️ Saved' : '🤍 Save Property'}
                </button>
                <button 
                  className="contact-landlord-btn"
                  onClick={() => {
                    setSelectedProperty(null);
                    handleContactLandlord(selectedProperty);
                  }}
                >
                  📧 Contact Landlord
                </button>
                <button className="schedule-viewing-btn">📅 Schedule Viewing</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showContactModal && contactProperty && (
        <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
          <div className="modal-content contact-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowContactModal(false)}>✕</button>
            
            <div className="contact-modal-header">
              <h2>📧 Contact Landlord</h2>
              <div className="contact-property-info">
                <h3>{contactProperty.title}</h3>
                <p>📍 {contactProperty.address}</p>
                <p>👤 Landlord: {contactProperty.landlord}</p>
              </div>
            </div>

            <form onSubmit={handleSubmitContact} className="contact-form">
              <div className="form-group">
                <label>Preferred Move-In Date (Optional)</label>
                <input
                  type="date"
                  name="moveInDate"
                  value={contactForm.moveInDate}
                  onChange={handleContactFormChange}
                />
              </div>

              <div className="form-group">
                <label>Your Message *</label>
                <textarea
                  name="message"
                  value={contactForm.message}
                  onChange={handleContactFormChange}
                  placeholder="Tell the landlord about yourself and why you're interested..."
                  rows="8"
                  required
                />
                <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '8px', display: 'block' }}>
                  💡 Your contact information will be automatically included with this message
                </small>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowContactModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  📧 Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .browse-properties {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
        }

        .properties-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .back-btn {
          display: inline-block;
          margin-bottom: 20px;
          padding: 10px 20px;
          background: white;
          border: 2px solid #fd5068;
          color: #fd5068;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .back-btn:hover {
          background: #fd5068;
          color: white;
        }

        .properties-header h1 {
          margin: 0 0 10px 0;
          font-size: 2.5rem;
          background: linear-gradient(45deg, #fd5068, #ff6b9d);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .properties-header p {
          margin: 0;
          color: #666;
          font-size: 1.1rem;
        }

        .filters-section {
          background: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-group label {
          font-weight: 600;
          color: #333;
          font-size: 0.95rem;
        }

        .filter-group select,
        .filter-group input[type="range"] {
          padding: 10px;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
        }

        .filter-group select:focus {
          outline: none;
          border-color: #fd5068;
        }

        .filter-group input[type="range"] {
          padding: 0;
        }

        .budget-hint {
          margin-top: 8px;
          font-size: 0.85rem;
          color: #fd5068;
          font-weight: 600;
        }

        .error-banner {
          background: #fff3cd;
          border: 2px solid #ffc107;
          color: #856404;
          padding: 15px 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          text-align: center;
          font-weight: 600;
        }

        .loading-state {
          text-align: center;
          padding: 80px 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f0f0f0;
          border-top: 4px solid #fd5068;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .properties-stats {
          display: flex;
          justify-content: space-between;
          padding: 15px 20px;
          background: #f8f9fa;
          border-radius: 8px;
          margin-bottom: 20px;
          font-weight: 600;
          color: #666;
        }

        .properties-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 18px;
          padding: 0 12px 18px;
        }

        .property-card {
          background: #fff;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(0,0,0,0.05);
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }

        .property-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
        }

        .property-image {
          position: relative;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 52px 16px;
          text-align: center;
          min-height: 170px;
        }

        .property-image::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.25) 100%);
          pointer-events: none;
        }

        .property-icon {
          font-size: 3.6rem;
          position: relative;
          z-index: 1;
        }

        .save-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(255,255,255,0.95);
          border: 1px solid rgba(0,0,0,0.08);
          width: 38px;
          height: 38px;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 700;
          color: #111827;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.16);
          z-index: 2;
        }

        .save-btn:hover {
          transform: scale(1.1);
        }

        .save-btn.saved {
          animation: heartbeat 0.3s ease;
        }

        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }

        .available-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(0,0,0,0.7);
          color: white;
          padding: 6px 11px;
          border-radius: 16px;
          font-size: 0.82rem;
          font-weight: 600;
          z-index: 2;
        }

        .property-details {
          padding: 16px;
        }

        .property-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
          gap: 8px;
        }

        .property-header h3 {
          margin: 0;
          font-size: 1rem;
          color: #111827;
          flex: 1;
          line-height: 1.3;
        }

        .property-address,
        .property-distance {
          margin: 2px 0;
          color: #4b5563;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .property-subline {
          margin: 2px 0 4px 0;
          color: #6b7280;
          font-size: 0.85rem;
        }

        .property-price {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 6px 0;
        }

        .property-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 12px;
        }

        .city-sections {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .city-section {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .city-header {
          font-size: 1.05rem;
          font-weight: 700;
          color: #111827;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .city-header::after {
          content: '›';
          font-size: 1rem;
          color: #6b7280;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
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
          top: 15px;
          right: 15px;
          background: #f0f0f0;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          font-size: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 10;
        }

        .close-modal:hover {
          background: #fd5068;
          color: white;
        }

        .modal-header {
          padding: 30px;
          background: linear-gradient(45deg, #fd5068, #ff6b9d);
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .modal-header h2 {
          margin: 0 0 10px 0;
          font-size: 1.8rem;
        }

        .modal-address {
          margin: 0;
          opacity: 0.9;
        }

        .modal-rent {
          font-size: 2rem;
          font-weight: 700;
        }

        .modal-body {
          padding: 30px;
        }

        .modal-section {
          margin-bottom: 30px;
        }

        .modal-section h3 {
          margin: 0 0 15px 0;
          font-size: 1.3rem;
          color: #333;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .detail-label {
          color: #666;
          font-weight: 500;
        }

        .detail-value {
          font-weight: 600;
          color: #333;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }

        .feature-item {
          display: flex;
          justify-content: space-between;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .feature-item span {
          color: #666;
        }

        .feature-item strong {
          color: #333;
        }

        .amenities-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .amenity-tag {
          padding: 8px 15px;
          background: #e6f7ff;
          color: #1890ff;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .modal-actions {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-top: 30px;
        }

        .save-property-btn,
        .contact-landlord-btn,
        .schedule-viewing-btn {
          padding: 15px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .save-property-btn {
          background: linear-gradient(45deg, #fd5068, #ff6b9d);
          color: white;
        }

        .contact-landlord-btn {
          background: #1890ff;
          color: white;
        }

        .schedule-viewing-btn {
          background: #51cf66;
          color: white;
        }

        .save-property-btn:hover,
        .contact-landlord-btn:hover,
        .schedule-viewing-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .contact-modal {
          max-width: 600px;
        }

        .contact-modal-header {
          padding: 30px;
          background: linear-gradient(45deg, #fd5068, #ff6b9d);
          color: white;
        }

        .contact-modal-header h2 {
          margin: 0 0 20px 0;
          font-size: 1.8rem;
        }

        .contact-property-info {
          background: rgba(255, 255, 255, 0.1);
          padding: 15px;
          border-radius: 8px;
          margin-top: 15px;
        }

        .contact-property-info h3 {
          margin: 0 0 8px 0;
          font-size: 1.2rem;
        }

        .contact-property-info p {
          margin: 5px 0;
          opacity: 0.9;
        }

        .contact-form {
          padding: 30px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          font-family: inherit;
          transition: border-color 0.3s;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #fd5068;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 120px;
        }

        .form-actions {
          display: flex;
          gap: 15px;
          justify-content: flex-end;
          margin-top: 30px;
        }

        .cancel-btn,
        .submit-btn {
          padding: 12px 30px;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .cancel-btn {
          background: #f0f0f0;
          color: #666;
        }

        .cancel-btn:hover {
          background: #e0e0e0;
        }

        .submit-btn {
          background: linear-gradient(45deg, #fd5068, #ff6b9d);
          color: white;
        }

        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(253, 80, 104, 0.3);
        }

        @media (max-width: 768px) {
          .properties-grid {
            display: flex;
            overflow-x: auto;
            gap: 12px;
            padding: 0 10px 16px;
            scroll-snap-type: x mandatory;
          }

          .property-card {
            border-radius: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            overflow: hidden;
            background: #fff;
            border: 1px solid rgba(0,0,0,0.04);
            min-height: 230px;
            display: flex;
            flex-direction: column;
            min-width: 240px;
            max-width: 260px;
            flex: 0 0 auto;
            scroll-snap-align: start;
          }

          .property-image {
            min-height: 120px;
            max-height: 140px;
            padding: 14px 10px;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
          }

          .property-details {
            padding: 10px 10px 12px;
            flex: 1;
          }

          .property-header {
            gap: 6px;
            margin-bottom: 4px;
          }
          .property-header h3 { font-size: 0.9rem; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
          .property-rent { font-size: 0.9rem; }
          .property-address { font-size: 0.78rem; line-height: 1.2; }
          .property-distance { font-size: 0.75rem; line-height: 1.2; }
          .available-badge { padding: 5px 9px; font-size: 0.72rem; border-radius: 16px; }
          .save-btn { width: 32px; height: 32px; font-size: 1.05rem; }
          .property-icon { font-size: 2.4rem; }
          .property-actions { display: none; }
          .desktop-only { display: none; }

          .filters-section {
            grid-template-columns: 1fr;
            padding: 16px;
            gap: 12px;
          }

          .detail-grid,
          .features-grid {
            grid-template-columns: 1fr;
          }

          .modal-actions {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }

          .cancel-btn,
          .submit-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default BrowseProperties;
