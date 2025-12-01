import React, { useState, useEffect } from 'react';
import realListings from '../data/real_listings.json';
import craigslistData from '../data/craigslist_listings.json';
import kijijiData from '../data/kijiji_listings.json';

const ALL_LISTINGS = [...craigslistData, ...kijijiData];

const SAMPLE_PROPERTIES = [
  {
    id: 1,
    title: 'Modern 1BR Near Campus',
    address: '123 College St, Toronto, ON',
    rent: 1650,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 550,
    image: '🏢',
    available: 'Available Now',
    utilities: 'Included',
    parking: true,
    laundry: 'In-unit',
    petFriendly: false,
    furnished: false,
    distance: '0.5 km to campus',
    amenities: ['WiFi', 'Gym', 'Storage'],
    landlord: 'Property Management Co.',
    description: 'Bright and modern 1-bedroom apartment close to campus. Perfect for students!'
  },
  {
    id: 2,
    title: 'Cozy Studio Downtown',
    address: '456 Queen St W, Toronto, ON',
    rent: 1400,
    bedrooms: 0,
    bathrooms: 1,
    sqft: 400,
    image: '🏠',
    available: 'Dec 1, 2024',
    utilities: 'Not Included',
    parking: false,
    laundry: 'In-building',
    petFriendly: true,
    furnished: true,
    distance: '1.2 km to campus',
    amenities: ['WiFi', 'Balcony'],
    landlord: 'John Smith',
    description: 'Fully furnished studio in the heart of downtown. Great for students who want city life!'
  },
  {
    id: 3,
    title: 'Spacious 2BR Apartment',
    address: '789 Bloor St, Toronto, ON',
    rent: 2200,
    bedrooms: 2,
    bathrooms: 1,
    sqft: 850,
    image: '🏘️',
    available: 'Available Now',
    utilities: 'Included',
    parking: true,
    laundry: 'In-unit',
    petFriendly: true,
    furnished: false,
    distance: '0.8 km to campus',
    amenities: ['WiFi', 'Gym', 'Pool', 'Storage', 'Balcony'],
    landlord: 'Urban Living Properties',
    description: 'Perfect for sharing! Spacious 2-bedroom with all amenities. Great for roommates!'
  },
  {
    id: 4,
    title: 'Affordable 1BR Basement',
    address: '321 Spadina Ave, Toronto, ON',
    rent: 1200,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 500,
    image: '🏡',
    available: 'Jan 1, 2025',
    utilities: 'Not Included',
    parking: true,
    laundry: 'Shared',
    petFriendly: false,
    furnished: false,
    distance: '1.5 km to campus',
    amenities: ['WiFi', 'Storage'],
    landlord: 'Private Owner',
    description: 'Budget-friendly basement apartment. Quiet neighborhood, perfect for studying.'
  },
  {
    id: 5,
    title: 'Luxury 1BR Condo',
    address: '555 Bay St, Toronto, ON',
    rent: 2400,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 650,
    image: '🏙️',
    available: 'Available Now',
    utilities: 'Included',
    parking: true,
    laundry: 'In-unit',
    petFriendly: true,
    furnished: true,
    distance: '2.0 km to campus',
    amenities: ['WiFi', 'Gym', 'Pool', 'Concierge', 'Rooftop Terrace'],
    landlord: 'Luxury Condos Inc.',
    description: 'High-end condo with stunning city views. All amenities included!'
  },
  {
    id: 6,
    title: 'Student-Friendly 2BR',
    address: '888 Harbord St, Toronto, ON',
    rent: 1900,
    bedrooms: 2,
    bathrooms: 1,
    sqft: 750,
    image: '🏘️',
    available: 'Available Now',
    utilities: 'Not Included',
    parking: false,
    laundry: 'In-building',
    petFriendly: false,
    furnished: false,
    distance: '0.3 km to campus',
    amenities: ['WiFi', 'Study Room'],
    landlord: 'Student Housing Co.',
    description: 'Perfect for students! Super close to campus. Ideal for 2 roommates.'
  }
];

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

  // Extract user's preferred location
  const userCity = userPreferences?.location?.city || 
                   userPreferences?.location?.formatted?.split(',')[0] || 
                   'Toronto';

  // Fetch properties from API
  useEffect(() => {
    fetchProperties();
    loadSavedProperties();
  }, []);

  // Load saved properties from localStorage
  const loadSavedProperties = () => {
    const saved = JSON.parse(localStorage.getItem('rently_saved_properties') || '[]');
    const savedIds = saved.map(p => p.id);
    setSavedProperties(savedIds);
    console.log(`📂 Loaded ${savedIds.length} saved properties from localStorage`);
  };

 const fetchProperties = () => {
    setLoading(true);
    setError(null);
    console.log('🔄 Fetching properties...');
    
    // Using .then().catch() avoids the try/catch syntax error completely
    fetch('http://localhost:5000/api/properties')
      .then(response => {
        console.log('📡 Response status:', response.status);
        return response.json();
      })
      .then(data => {
        console.log('📊 API Response:', data);
        if (data.success && data.properties) {
          console.log(`✅ Loaded ${data.properties.length} properties from Server`);
          setProperties(data.properties);
          setLoading(false);
        } else {
          throw new Error('No properties found on server');
        }
      })
      .catch(err => {
        // This block runs if server is down
        console.error('❌ Connection failed, switching to fallback.');
        
      if (ALL_LISTINGS && ALL_LISTINGS.length > 0) {
        console.log(`📂 Server down. Using ${ALL_LISTINGS.length} total scraped listings.`);
        setProperties(ALL_LISTINGS);
        setError(null);
      } else {
        console.log('⚠️ No scraped data found, using samples');
        setProperties(SAMPLE_PROPERTIES);
      }
        setLoading(false);
      });
  };

  const handleSaveProperty = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return;

    // Get existing saved properties from localStorage
    const existingSaved = JSON.parse(localStorage.getItem('rently_saved_properties') || '[]');
    
    if (savedProperties.includes(propertyId)) {
      // Remove from saved
      const updatedSaved = savedProperties.filter(id => id !== propertyId);
      setSavedProperties(updatedSaved);
      
      // Remove from localStorage
      const updatedLocalStorage = existingSaved.filter(p => p.id !== propertyId);
      localStorage.setItem('rently_saved_properties', JSON.stringify(updatedLocalStorage));
      
      console.log('🗑️ Property removed from saved:', property.title);
    } else {
      // Add to saved
      setSavedProperties([...savedProperties, propertyId]);
      
      // Add to localStorage with full property data
      const propertyToSave = {
        ...property,
        savedAt: new Date().toISOString()
      };
      existingSaved.push(propertyToSave);
      localStorage.setItem('rently_saved_properties', JSON.stringify(existingSaved));
      
      console.log('💾 Property saved:', property.title);
    }
  };

  const handleContactLandlord = (property) => {
    setContactProperty(property);
    setShowContactModal(true);
    // Pre-fill message only
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
    
    // Create new conversation for Messages inbox
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

    // Save to localStorage for Messages component
    const existingConversations = JSON.parse(localStorage.getItem('rently_conversations') || '[]');
    const existingMessages = JSON.parse(localStorage.getItem('rently_messages') || '{}');

    existingConversations.unshift(newConversation);
    existingMessages[newConversation.id] = [newMessage];

    localStorage.setItem('rently_conversations', JSON.stringify(existingConversations));
    localStorage.setItem('rently_messages', JSON.stringify(existingMessages));

    console.log('📧 Message sent to landlord:', {
      property: contactProperty.title,
      landlord: contactProperty.landlord,
      message: contactForm.message,
      moveInDate: contactForm.moveInDate
    });

    // Show success message
    alert(`✅ Message sent to ${contactProperty.landlord}!\n\nYour conversation has been added to your Messages inbox.`);
    
    // Close modal and reset form
    setShowContactModal(false);
    setContactProperty(null);
    setContactForm({
      message: '',
      moveInDate: ''
    });
  };

  const filteredProperties = properties
    .filter(prop => {
      // Filter by bedrooms
      if (filterBedrooms !== 'all' && prop.bedrooms !== parseInt(filterBedrooms)) {
        return false;
      }
      // Filter by rent
      if (prop.rent > filterMaxRent) {
        return false;
      }
      // Filter by location
      if (filterLocation !== 'all') {
        if (filterLocation === 'preferred') {
          // Show properties in user's preferred city
          if (!prop.address.toLowerCase().includes(userCity.toLowerCase())) {
            return false;
          }
        } else if (filterLocation === 'nearby') {
          // Show properties within 2km
          const distance = parseFloat(prop.distance);
          if (distance > 2.0) {
            return false;
          }
        }
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rent-low':
          return a.rent - b.rent;
        case 'rent-high':
          return b.rent - a.rent;
        case 'size-large':
          return b.sqft - a.sqft;
        case 'distance':
          return parseFloat(a.distance) - parseFloat(b.distance);
        default:
          return 0;
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

      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}

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
        <div className="properties-grid">
          {filteredProperties.map(property => (
          <div key={property.id} className="property-card">
            <div 
              className="property-image" 
              style={{
                // If it's a URL, set as background image. If emoji, use gradient.
                backgroundImage: property.image.startsWith('http') 
                  ? `url(${property.image})` 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {/* Only show the emoji span if it IS NOT a URL */}
              {!property.image.startsWith('http') && (
                <span className="property-icon">{property.image}</span>
              )}

              <button
                className={`save-btn ${savedProperties.includes(property.id) ? 'saved' : ''}`}
                onClick={() => handleSaveProperty(property.id)}
              >
                {savedProperties.includes(property.id) ? '❤️' : '🤍'}
              </button>
              
              <span className="available-badge">{property.available}</span>
            </div>

            <div className="property-details">
              <div className="property-header">
                <h3>{property.title}</h3>
                <div className="property-rent">${property.rent}/mo</div>
              </div>

              <div className="property-address">📍 {property.address}</div>
              <div className="property-distance">🚶 {property.distance}</div>

              <div className="property-specs">
                <span>🛏️ {property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} BR`}</span>
                <span>🚿 {property.bathrooms} BA</span>
                <span>📐 {property.sqft} sqft</span>
                <span>💰 ${(property.rent / property.sqft).toFixed(2)}/sqft</span>
              </div>

              <div className="property-features">
                {property.utilities === 'Included' && <span className="feature">✅ Utilities</span>}
                {property.parking && <span className="feature">🚗 Parking</span>}
                {property.laundry === 'In-unit' && <span className="feature">🧺 Laundry</span>}
                {property.petFriendly && <span className="feature">🐾 Pet OK</span>}
                {property.furnished && <span className="feature">🛋️ Furnished</span>}
              </div>

              {property.aiAnalysis && property.aiAnalysis.highlights && property.aiAnalysis.highlights.length > 0 && (
                <div className="ai-highlights">
                  <div className="ai-highlights-header">
                    <span className="ai-icon-small">🤖</span>
                    <span>AI Detected:</span>
                  </div>
                  <div className="ai-highlights-list">
                    {property.aiAnalysis.highlights.slice(0, 3).map((highlight, idx) => (
                      <span key={idx} className="ai-highlight-tag">✨ {highlight}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="property-actions">
                <button
                  className="view-details-btn"
                  onClick={() => setSelectedProperty(property)}
                >
                  View Details
                </button>
                <button 
                  className="contact-btn"
                  onClick={() => handleContactLandlord(property)}
                >
                  Contact Landlord
                </button>
              </div>
            </div>
          </div>
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
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 25px;
        }

        .property-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .property-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
        }

        .property-image {
          position: relative;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 60px 20px;
          text-align: center;
        }

        .property-icon {
          font-size: 4rem;
        }

        .save-btn {
          position: absolute;
          top: 15px;
          right: 15px;
          background: white;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          font-size: 1.5rem;
          cursor: pointer;
          transition: transform 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .save-btn:hover {
          transform: scale(1.1);
        }

        .save-btn.saved {
          animation: heartbeat 0.3s ease;
        }

        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        .available-badge {
          position: absolute;
          top: 15px;
          left: 15px;
          background: #51cf66;
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .ai-quality-badge {
          position: absolute;
          bottom: 15px;
          left: 15px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 8px 12px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          animation: fadeIn 0.5s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ai-icon {
          font-size: 1.2rem;
        }

        .ai-score {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .ai-label {
          font-size: 0.7rem;
          opacity: 0.9;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .property-details {
          padding: 20px;
        }

        .property-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
        }

        .property-header h3 {
          margin: 0;
          font-size: 1.3rem;
          color: #333;
          flex: 1;
        }

        .property-rent {
          font-size: 1.5rem;
          font-weight: 700;
          color: #fd5068;
          white-space: nowrap;
          margin-left: 10px;
        }

        .property-address,
        .property-distance {
          margin: 5px 0;
          color: #666;
          font-size: 0.95rem;
        }

        .property-specs {
          display: flex;
          gap: 15px;
          margin: 15px 0;
          padding: 15px 0;
          border-top: 1px solid #f0f0f0;
          border-bottom: 1px solid #f0f0f0;
          flex-wrap: wrap;
        }

        .property-specs span {
          font-size: 0.9rem;
          color: #666;
          font-weight: 500;
        }

        .property-features {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 15px 0;
        }

        .feature {
          padding: 6px 12px;
          background: #f0f0f0;
          border-radius: 15px;
          font-size: 0.85rem;
          font-weight: 500;
          color: #666;
        }

        .ai-highlights {
          margin-top: 15px;
          padding: 12px;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
          border-radius: 8px;
          border: 1px solid rgba(102, 126, 234, 0.2);
        }

        .ai-highlights-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #667eea;
          margin-bottom: 8px;
        }

        .ai-icon-small {
          font-size: 1rem;
        }

        .ai-highlights-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .ai-highlight-tag {
          background: white;
          color: #667eea;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          border: 1px solid rgba(102, 126, 234, 0.3);
        }

        .property-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 15px;
        }

        .view-details-btn,
        .contact-btn {
          padding: 12px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .view-details-btn {
          background: linear-gradient(45deg, #fd5068, #ff6b9d);
          color: white;
        }

        .view-details-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(253, 80, 104, 0.3);
        }

        .contact-btn {
          background: white;
          border: 2px solid #fd5068;
          color: #fd5068;
        }

        .contact-btn:hover {
          background: #fd5068;
          color: white;
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
            grid-template-columns: 1fr;
          }

          .filters-section {
            grid-template-columns: 1fr;
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
