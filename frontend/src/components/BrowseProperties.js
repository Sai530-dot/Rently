import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE_URL } from '../config';
import realListings from '../data/real_listings.json';
import craigslistData from '../data/craigslist_listings.json';
import kijijiData from '../data/kijiji_listings.json';

const ALL_LISTINGS = [...craigslistData, ...kijijiData, ...realListings];

// --- ICONS ---
// Using strokes that match standard slate/grey palettes for a professional look
const iconStroke = "#64748b"; 

const Icons = {
  PriceIcon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 18V6"></path></svg>,
  TypeIcon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="9" y1="22" x2="9" y2="22.01"></line><line x1="15" y1="22" x2="15" y2="22.01"></line><line x1="12" y1="22" x2="12" y2="22.01"></line><rect x="8" y="6" width="8" height="12" rx="1"></rect></svg>,
  LocationIcon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
  RoomsIcon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v8"></path></svg>,
  Bed: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4v16"></path><path d="M2 8h18a2 2 0 0 1 2 2v10"></path><path d="M2 17h20"></path><path d="M6 8v9"></path></svg>,
  Bath: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-1.5C3.5 2 2 3.5 2 5.5A2.5 2.5 0 0 0 4.5 8h.5"></path><path d="M21 16.5A2.5 2.5 0 0 1 18.5 19h-13a2.5 2.5 0 0 1-2.5-2.5V12h18v4.5z"></path><path d="M10 12v-2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><path d="M21 12v3"></path></svg>,
  Sqft: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"></path><path d="M7 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"></path><path d="M17 22a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"></path></svg>,
  Pin: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
  // NEW: A cleaner, more professional architectural placeholder
  Placeholder: () => (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
      <path d="M2 10h20" strokeOpacity="0.2"></path>
    </svg>
  )
};

const BrowseProperties = ({ onBack, userPreferences }) => {
  const [properties, setProperties] = useState(realListings.length > 0 ? realListings : []);
  const [loading, setLoading] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  
  // Filters
  const [priceRange, setPriceRange] = useState([500, 5000]); 
  const [selectedTypes, setSelectedTypes] = useState(['Apartment']);
  const [selectedLocations, setSelectedLocations] = useState(['Saskatoon']);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [sortBy, setSortBy] = useState('rent-low');
  
  // Modals & User Data
  const [savedProperties, setSavedProperties] = useState([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactProperty, setContactProperty] = useState(null);
  const [contactForm, setContactForm] = useState({ message: '', moveInDate: '' });

  const userCity = userPreferences?.location?.city || 'Toronto';

  useEffect(() => {
    fetchProperties();
    loadSavedProperties();
    if (userPreferences?.location?.city) {
      setSelectedLocations([userPreferences.location.city]);
    }
  }, []);

  const loadSavedProperties = () => {
    const saved = JSON.parse(localStorage.getItem('rently_saved_properties') || '[]');
    setSavedProperties(saved.map(p => p.id));
  };

  const fetchProperties = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/properties`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.properties) setProperties(data.properties);
      })
      .catch(() => setProperties(ALL_LISTINGS))
      .finally(() => setLoading(false));
  };

  // --- Handlers ---
  const handleTypeChange = (type) => {
    if (selectedTypes.includes(type)) setSelectedTypes(selectedTypes.filter(t => t !== type));
    else setSelectedTypes([...selectedTypes, type]);
  };

  const handleLocationChange = (loc) => {
    if (selectedLocations.includes(loc)) setSelectedLocations(selectedLocations.filter(l => l !== loc));
    else setSelectedLocations([...selectedLocations, loc]);
  };

  const handleRoomToggle = (num) => {
    if (selectedRooms.includes(num)) setSelectedRooms(selectedRooms.filter(n => n !== num));
    else setSelectedRooms([...selectedRooms, num]);
  };

  const handleClearAll = () => {
    setPriceRange([0, 10000]);
    setSelectedTypes([]);
    setSelectedLocations([]);
    setSelectedRooms([]);
  };

  // --- Derived Filtering ---
  const filteredProperties = useMemo(() => {
    return properties.filter(prop => {
      if (prop.rent < priceRange[0] || prop.rent > priceRange[1]) return false;
      
      if (selectedLocations.length > 0) {
        const matchesLoc = selectedLocations.some(locStr => 
          prop.address.toLowerCase().includes(locStr.split(',')[0].toLowerCase().trim()) ||
          (prop.city && prop.city.toLowerCase() === locStr.split(',')[0].toLowerCase().trim())
        );
        if (!matchesLoc) return false;
      }

      if (selectedRooms.length > 0) {
        if (!selectedRooms.includes(prop.bedrooms)) return false;
      }

      if (selectedTypes.length > 0) {
        const pType = prop.title.toLowerCase().includes('house') ? 'Single Family House' : 
                      prop.title.toLowerCase().includes('condo') ? 'Condominium' : 'Apartment';
        if (!selectedTypes.includes(pType)) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'rent-low') return a.rent - b.rent;
      if (sortBy === 'rent-high') return b.rent - a.rent;
      return 0;
    });
  }, [properties, priceRange, selectedLocations, selectedRooms, selectedTypes, sortBy]);

  const getImageUrl = (imageField) => {
    if (typeof imageField === 'string' && imageField.startsWith('http')) return imageField;
    if (Array.isArray(imageField)) return imageField.find(u => u.startsWith('http')) || null;
    return null;
  };

  const handleSaveProperty = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return;
    const existingSaved = JSON.parse(localStorage.getItem('rently_saved_properties') || '[]');
    if (savedProperties.includes(propertyId)) {
      const updatedSaved = savedProperties.filter(id => id !== propertyId);
      setSavedProperties(updatedSaved);
      localStorage.setItem('rently_saved_properties', JSON.stringify(existingSaved.filter(p => p.id !== propertyId)));
    } else {
      setSavedProperties([...savedProperties, propertyId]);
      existingSaved.push({ ...property, savedAt: new Date().toISOString() });
      localStorage.setItem('rently_saved_properties', JSON.stringify(existingSaved));
    }
  };

  const handleContactLandlord = (property) => {
    setContactProperty(property);
    setShowContactModal(true);
    setContactForm({ message: `Hi, I'm interested in ${property.title}.`, moveInDate: '' });
  };

  const handleSubmitContact = (e) => {
    e.preventDefault();
    alert(`✅ Message sent to landlord for ${contactProperty.address}!\nDate Requested: ${contactForm.moveInDate || 'Not specified'}`);
    setShowContactModal(false);
    setContactForm({ message: '', moveInDate: '' });
  };

  return (
    <div className="browse-layout">
      
      {/* --- SIDEBAR FILTER --- */}
      <div className="sidebar-filter">
        <div className="sidebar-header">
           <h3>Filters</h3>
           <button className="clear-btn" onClick={handleClearAll}>Clear All</button>
        </div>

        {/* 1. PRICE */}
        <div className="filter-section">
          <div className="section-title"><div className="icon-wrap"><Icons.PriceIcon /></div> Price Range</div>
          <div className="price-inputs">
             <div className="dual-slider-container">
                <div className="slider-track-bg"></div>
                <div 
                  className="slider-track-fill" 
                  style={{ 
                    left: `${(priceRange[0] / 10000) * 100}%`, 
                    width: `${((priceRange[1] - priceRange[0]) / 10000) * 100}%` 
                  }}
                ></div>
                <input 
                  type="range" min="0" max="10000" step="100"
                  value={priceRange[0]}
                  onChange={e => { const val = Math.min(Number(e.target.value), priceRange[1] - 100); setPriceRange([val, priceRange[1]]); }}
                  className="thumb thumb-left"
                />
                <input 
                  type="range" min="0" max="10000" step="100"
                  value={priceRange[1]}
                  onChange={e => { const val = Math.max(Number(e.target.value), priceRange[0] + 100); setPriceRange([priceRange[0], val]); }}
                  className="thumb thumb-right"
                />
             </div>
             <div className="price-labels">
               <span className="price-badge">${priceRange[0].toLocaleString()}</span>
               <span className="price-badge">${priceRange[1].toLocaleString()}</span>
             </div>
          </div>
        </div>

        {/* 2. TYPE */}
        <div className="filter-section">
          <div className="section-title"><div className="icon-wrap"><Icons.TypeIcon /></div> Property Type</div>
          <div className="checkbox-group">
            {['Single Family House', 'Apartment', 'Condominium'].map(type => (
              <label key={type} className="custom-checkbox">
                <input type="checkbox" checked={selectedTypes.includes(type)} onChange={() => handleTypeChange(type)} />
                <span className="checkmark"></span> {type}
              </label>
            ))}
          </div>
        </div>

        {/* 3. LOCATION */}
        <div className="filter-section">
          <div className="section-title"><div className="icon-wrap"><Icons.LocationIcon /></div> Location</div>
          <div className="checkbox-group">
            {['Toronto, ON', 'Vancouver, BC', 'Saskatoon, SK', 'Ottawa, ON'].map(loc => (
              <label key={loc} className="custom-checkbox">
                <input type="checkbox" checked={selectedLocations.includes(loc.split(',')[0])} onChange={() => handleLocationChange(loc.split(',')[0])} />
                <span className="checkmark"></span> {loc}
              </label>
            ))}
          </div>
        </div>

        {/* 4. ROOMS */}
        <div className="filter-section">
          <div className="section-title"><div className="icon-wrap"><Icons.RoomsIcon /></div> Bedrooms</div>
          <div className="room-pills">
             {[1, 2, 3, 4].map(num => (
               <button key={num} className={`room-pill ${selectedRooms.includes(num) ? 'active' : ''}`} onClick={() => handleRoomToggle(num)}>
                 {num}+
               </button>
             ))}
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="main-content-area">
        <div className="top-header-clean">
           <div className="header-content">
             <button className="dash-back-btn" onClick={onBack}>← Dashboard</button>
             <div className="hero-title">
                <h1>Browse Properties</h1>
             </div>
             <p className="hero-subtitle">Explore available rentals in your area.</p>
           </div>
        </div>

        <div className="results-bar">
          <span className="count-text"><strong>{filteredProperties.length}</strong> homes available</span>
          <div className="sort-box">
             <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="rent-low">Price: Low to High</option>
                <option value="rent-high">Price: High to Low</option>
             </select>
          </div>
        </div>

        <div className="pro-grid">
          {filteredProperties.map(property => {
             const imageUrl = getImageUrl(property.image);
             const isSaved = savedProperties.includes(property.id);
             return (
              <div key={property.id} className="ref-card" onClick={() => setSelectedProperty(property)}>
                <div className="ref-img-box">
                   {imageUrl ? <img src={imageUrl} alt={property.title} className="ref-img" /> : <div className="ref-placeholder"><Icons.Placeholder /></div>}
                   <div className="ref-loc-badge"><Icons.Pin /> {property.city || 'Canada'}</div>
                   <button className={`ref-save-btn ${isSaved ? 'saved' : ''}`} onClick={(e) => { e.stopPropagation(); handleSaveProperty(property.id); }}>{isSaved ? '♥' : '+'}</button>
                </div>
                <div className="ref-content">
                  <div className="ref-header">
                    <h3 className="ref-title">{property.title}</h3>
                    <span className="ref-price">${property.rent.toLocaleString()}</span>
                  </div>
                  <div className="ref-divider"></div>
                  <div className="ref-specs">
                    <div className="ref-spec"><Icons.Bed /> {property.bedrooms} Bd</div>
                    <div className="ref-spec"><Icons.Bath /> {property.bathrooms || 1} Ba</div>
                    <div className="ref-spec"><Icons.Sqft /> {property.sqft || '--'} sqft</div>
                  </div>
                </div>
              </div>
             );
          })}
        </div>
      </div>

      {/* --- DETAILS MODAL --- */}
      {selectedProperty && (
        <div className="modal-overlay" onClick={() => setSelectedProperty(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
             <button className="close-x" onClick={() => setSelectedProperty(null)}>✕</button>
             <div className="modal-inner-grid">
                <div className="modal-left">
                   <div className="modal-image-large">
                      {getImageUrl(selectedProperty.image) ? <img src={getImageUrl(selectedProperty.image)} alt="" /> : <div className="modal-ph-large"><Icons.Placeholder /></div>}
                   </div>
                </div>
                <div className="modal-right">
                   <div className="modal-chip">Available</div>
                   <h2>{selectedProperty.title}</h2>
                   <p className="modal-addr">📍 {selectedProperty.address}</p>
                   <h1 className="modal-price">${selectedProperty.rent.toLocaleString()}<span className="mo">/mo</span></h1>
                   <div className="modal-info-row">
                      <div className="info-block"><span className="label">Bedrooms</span><span className="val">{selectedProperty.bedrooms}</span></div>
                      <div className="info-block"><span className="label">Bathrooms</span><span className="val">{selectedProperty.bathrooms || 1}</span></div>
                      <div className="info-block"><span className="label">Sq Ft</span><span className="val">{selectedProperty.sqft || 'N/A'}</span></div>
                   </div>
                   <div className="modal-desc">
                     <h4>About this home</h4>
                     <p>{selectedProperty.description || "A lovely property featuring modern amenities and close proximity to local transit. Contact the landlord for more details or to arrange a viewing."}</p>
                   </div>
                   <div className="modal-buttons">
                      <button className="btn-save" onClick={() => handleSaveProperty(selectedProperty.id)}>{savedProperties.includes(selectedProperty.id) ? 'Saved ♥' : 'Save'}</button>
                      <button className="btn-contact" onClick={() => handleContactLandlord(selectedProperty)}>Contact Landlord</button>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* --- CONTACT MODAL --- */}
      {showContactModal && (
        <div className="modal-overlay contact-overlay" onClick={() => setShowContactModal(false)}>
           <div className="contact-box" onClick={e => e.stopPropagation()}>
              <div className="contact-header">
                 <h3>Contact Landlord</h3>
                 <button className="close-x-white" onClick={() => setShowContactModal(false)}>✕</button>
              </div>
              <div className="contact-body">
                 <div className="mini-prop">
                    <strong>{contactProperty?.title}</strong>
                    <div style={{fontSize:'0.9rem', color:'#666'}}>{contactProperty?.address}</div>
                 </div>
                 
                 <label className="form-label">Preferred Move-In Date</label>
                 <input 
                   type="date" 
                   className="contact-input"
                   value={contactForm.moveInDate}
                   onChange={(e) => setContactForm({...contactForm, moveInDate: e.target.value})}
                 />
                 
                 <label className="form-label">Message</label>
                 <textarea rows="4" className="contact-input" value={contactForm.message} onChange={(e) => setContactForm({...contactForm, message: e.target.value})} />
                 <button className="btn-send" onClick={handleSubmitContact}>Send Message</button>
              </div>
           </div>
        </div>
      )}

      <style>{`
        :root {
          --primary: #0f172a;
          --secondary: #64748b;
          --accent: #fd5068;
          --bg-light: #f8fafc;
          --border-light: #e2e8f0;
        }
        .browse-layout { display: flex; background: var(--bg-light); min-height: 100vh; font-family: 'Inter', -apple-system, sans-serif; padding-top: 60px; color: var(--primary); }
        
        /* --- SIDEBAR --- */
        .sidebar-filter { width: 300px; background: white; border-right: 1px solid var(--border-light); padding: 24px; display: flex; flex-direction: column; gap: 24px; height: calc(100vh - 60px); position: sticky; top: 60px; overflow-y: auto; flex-shrink: 0; }
        .sidebar-header { display: flex; justify-content: space-between; align-items: center; }
        .sidebar-header h3 { margin: 0; font-size: 1.125rem; font-weight: 700; }
        .clear-btn { background: none; border: none; color: var(--secondary); font-weight: 600; cursor: pointer; font-size: 0.875rem; transition: color 0.2s; }
        .clear-btn:hover { color: var(--primary); }
        .filter-section { display: flex; flex-direction: column; gap: 12px; border-bottom: 1px solid var(--border-light); padding-bottom: 24px; }
        .filter-section:last-child { border-bottom: none; }
        .section-title { font-weight: 600; font-size: 0.9375rem; display: flex; align-items: center; gap: 8px; color: var(--primary); }
        .icon-wrap { color: var(--secondary); display: flex; }

        /* CONTROLS */
        .checkbox-group { display: flex; flex-direction: column; gap: 10px; }
        .custom-checkbox { display: flex; align-items: center; gap: 10px; cursor: pointer; color: var(--secondary); font-size: 0.9375rem; user-select: none; }
        .custom-checkbox input { position: absolute; opacity: 0; cursor: pointer; height: 0; width: 0; }
        .checkmark { height: 18px; width: 18px; background-color: #fff; border: 2px solid var(--border-light); border-radius: 4px; position: relative; transition: all 0.2s; }
        .custom-checkbox:hover input ~ .checkmark { border-color: var(--secondary); }
        .custom-checkbox input:checked ~ .checkmark { background-color: var(--primary); border-color: var(--primary); }
        .custom-checkbox input:checked ~ .checkmark:after { content: ""; position: absolute; display: block; left: 5px; top: 1px; width: 4px; height: 9px; border: solid white; border-width: 0 2px 2px 0; transform: rotate(45deg); }
        
        .room-pills { display: flex; flex-wrap: wrap; gap: 8px; }
        .room-pill { padding: 8px 16px; border-radius: 6px; border: 1px solid var(--border-light); background: white; color: var(--secondary); font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .room-pill:hover { border-color: var(--secondary); background: var(--bg-light); }
        .room-pill.active { background: var(--primary); color: white; border-color: var(--primary); }

        /* SLIDER */
        .dual-slider-container { position: relative; width: 100%; height: 20px; margin: 15px 0; }
        .slider-track-bg { position: absolute; top: 50%; transform: translateY(-50%); width: 100%; height: 4px; background: var(--border-light); border-radius: 2px; }
        .slider-track-fill { position: absolute; top: 50%; transform: translateY(-50%); height: 4px; background: var(--primary); z-index: 1; pointer-events: none; }
        .thumb { position: absolute; top: 0; left: 0; width: 100%; height: 100%; -webkit-appearance: none; background: none; pointer-events: none; margin: 0; z-index: 2; }
        .thumb::-webkit-slider-thumb { -webkit-appearance: none; pointer-events: auto; position: relative; width: 18px; height: 18px; border-radius: 50%; background: white; border: 2px solid var(--primary); cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.1); z-index: 3; transition: transform 0.1s; }
        .thumb::-webkit-slider-thumb:hover { transform: scale(1.1); }
        .thumb::-moz-range-thumb { pointer-events: auto; width: 18px; height: 18px; border-radius: 50%; background: white; border: 2px solid var(--primary); cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.1); z-index: 3; }
        .price-labels { display: flex; justify-content: space-between; margin-top: 8px; }
        .price-badge { font-size: 0.875rem; color: var(--primary); font-weight: 700; }

        /* MAIN AREA */
        .main-content-area { flex: 1; padding: 0; display: flex; flex-direction: column; overflow-y: auto; }
        .top-header-clean { background: white; padding: 32px 40px; border-bottom: 1px solid var(--border-light); }
        .header-content { max-width: 1200px; margin: 0 auto; }
        .dash-back-btn { display: inline-flex; align-items: center; padding: 6px 12px; background: var(--bg-light); color: var(--secondary); border-radius: 6px; border: none; cursor: pointer; font-weight: 600; font-size: 0.875rem; margin-bottom: 16px; transition: all 0.2s; }
        .dash-back-btn:hover { background: var(--border-light); color: var(--primary); }
        .hero-title h1 { font-size: 2rem; color: var(--primary); font-weight: 800; margin: 0 0 8px 0; letter-spacing: -0.02em; }
        .hero-subtitle { color: var(--secondary); font-size: 1.125rem; margin: 0; }
        
        .results-bar { padding: 20px 40px; display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; width: 100%; }
        .count-text { font-size: 0.9375rem; color: var(--secondary); }
        .count-text strong { color: var(--primary); }
        .sort-box select { padding: 8px 12px; border: 1px solid var(--border-light); border-radius: 6px; color: var(--primary); font-size: 0.9375rem; cursor: pointer; background: white; }

        /* PRO CARDS (POLISHED) */
        .pro-grid { padding: 0 40px 40px 40px; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; max-width: 1200px; margin: 0 auto; width: 100%; }
        .ref-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid var(--border-light); cursor: pointer; transition: all 0.2s ease; display: flex; flex-direction: column; }
        .ref-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.1); border-color: #cbd5e1; }
        .ref-img-box { height: 180px; position: relative; background: #f1f5f9; }
        .ref-img { width: 100%; height: 100%; object-fit: cover; }
        
        /* NEW PREMIUM PLACEHOLDER STYLE */
        .ref-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); }
        
        .ref-loc-badge { position: absolute; bottom: 10px; left: 10px; background: rgba(255,255,255,0.95); padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; color: var(--primary); display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); backdrop-filter: blur(4px); }
        .ref-save-btn { position: absolute; top: 10px; right: 10px; width: 32px; height: 32px; background: white; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: var(--secondary); box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.2s; }
        .ref-save-btn:hover { transform: scale(1.05); color: var(--primary); }
        .ref-save-btn.saved { color: var(--accent); }

        .ref-content { padding: 16px; flex: 1; display: flex; flex-direction: column; }
        .ref-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
        .ref-title { margin: 0; font-size: 1rem; font-weight: 700; max-width: 65%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--primary); line-height: 1.4; }
        .ref-price { font-size: 1.125rem; font-weight: 800; color: var(--primary); }
        .ref-divider { height: 1px; background: var(--border-light); margin-bottom: 12px; margin-top: auto; }
        .ref-specs { display: flex; gap: 16px; color: var(--secondary); font-size: 0.875rem; font-weight: 500; }
        .ref-spec { display: flex; align-items: center; gap: 6px; }

        /* MODALS */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 2000; display: flex; align-items: center; justify-content: center; }
        .contact-overlay { z-index: 3000; } 
        .modal-box { width: 900px; max-width: 90%; background: white; border-radius: 16px; position: relative; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
        .close-x { position: absolute; top: 20px; right: 20px; z-index: 10; background: white; border: 1px solid var(--border-light); width: 36px; height: 36px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--primary); transition: all 0.2s; }
        .close-x:hover { background: var(--bg-light); }
        .modal-inner-grid { display: grid; grid-template-columns: 55% 45%; }
        .modal-left { background: #f1f5f9; height: 550px; position: relative; }
        .modal-image-large { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #f1f5f9; }
        .modal-image-large img { width: 100%; height: 100%; object-fit: cover; }
        .modal-ph-large { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); }
        .modal-right { padding: 40px; display: flex; flex-direction: column; height: 550px; overflow-y: auto; }
        .modal-chip { display: inline-block; background: #dcfce7; color: #166534; padding: 6px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; margin-bottom: 16px; align-self: flex-start; letter-spacing: 0.05em; text-transform: uppercase; }
        .modal-right h2 { margin: 0 0 8px 0; font-size: 1.75rem; color: var(--primary); font-weight: 800; letter-spacing: -0.02em; }
        .modal-addr { color: var(--secondary); margin: 0 0 24px 0; font-size: 1rem; }
        .modal-price { font-size: 2.25rem; color: var(--primary); margin: 0 0 32px 0; font-weight: 800; }
        .mo { font-size: 1.125rem; color: var(--secondary); font-weight: 500; }
        .modal-info-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 32px; }
        .info-block { background: var(--bg-light); padding: 16px; border-radius: 12px; text-align: center; border: 1px solid var(--border-light); }
        .info-block .label { display: block; font-size: 0.75rem; color: var(--secondary); text-transform: uppercase; margin-bottom: 8px; font-weight: 600; letter-spacing: 0.05em; }
        .info-block .val { font-size: 1.25rem; font-weight: 700; color: var(--primary); }
        .modal-desc h4 { font-size: 1rem; font-weight: 700; margin-bottom: 12px; color: var(--primary); }
        .modal-desc p { color: var(--secondary); line-height: 1.6; }
        .modal-buttons { margin-top: auto; display: flex; gap: 16px; padding-top: 24px; }
        .btn-save { flex: 1; padding: 14px; border: 1px solid var(--border-light); background: white; border-radius: 8px; font-weight: 600; cursor: pointer; color: var(--primary); transition: all 0.2s; }
        .btn-save:hover { background: var(--bg-light); border-color: #cbd5e1; }
        .btn-contact { flex: 1; padding: 14px; border: none; background: var(--primary); color: white; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
        .btn-contact:hover { background: #1e293b; }

        /* CONTACT MODAL */
        .contact-box { width: 480px; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
        .contact-header { background: var(--primary); padding: 24px; color: white; display: flex; justify-content: space-between; align-items: center; }
        .contact-header h3 { margin: 0; font-weight: 700; font-size: 1.25rem; }
        .close-x-white { background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; opacity: 0.8; transition: opacity 0.2s; }
        .close-x-white:hover { opacity: 1; }
        .contact-body { padding: 32px; }
        .mini-prop { background: var(--bg-light); padding: 16px; border-radius: 8px; margin-bottom: 24px; border: 1px solid var(--border-light); display: flex; flex-direction: column; gap: 4px; }
        .mini-prop strong { color: var(--primary); }
        .form-label { display: block; font-size: 0.875rem; font-weight: 600; color: var(--primary); margin-bottom: 8px; }
        .contact-input { width: 100%; padding: 12px 16px; border: 1px solid var(--border-light); border-radius: 8px; margin-bottom: 24px; font-family: inherit; color: var(--primary); background: white; transition: border-color 0.2s; }
        .contact-input:focus { outline: none; border-color: var(--secondary); }
        .btn-send { width: 100%; padding: 14px; background: var(--accent); color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; transition: background 0.2s; }
        .btn-send:hover { background: #e11d48; }

        @media (max-width: 1024px) {
           .browse-layout { flex-direction: column; }
           .sidebar-filter { width: 100%; height: auto; position: relative; top: 0; padding: 24px; border-right: none; border-bottom: 1px solid var(--border-light); }
           .modal-inner-grid { grid-template-columns: 1fr; }
           .modal-left { height: 250px; }
           .modal-right { height: auto; max-height: 60vh; }
           .pro-grid, .results-bar, .header-content { padding-left: 24px; padding-right: 24px; }
        }
      `}</style>
    </div>
  );
};

export default BrowseProperties;