import React, { useState, useEffect, useRef, useMemo } from 'react';
import PropertyMap from './PropertyMap'; 
// import Footer from './Footer'; 
import realListings from '../data/real_listings.json';
import craigslistData from '../data/craigslist_listings.json';
import kijijiData from '../data/kijiji_listings.json';

const ALL_LISTINGS = [...craigslistData, ...kijijiData, ...realListings];

// Normalize Data
const normalizeListing = (item) => {
  const address = item.address || item.location || '';
  let province = item.province;
  if (!province) {
    if (address.includes(', ON') || address.includes('Ontario')) province = 'ON';
    else if (address.includes(', BC') || address.includes('British Columbia')) province = 'BC';
    else if (address.includes(', SK') || address.includes('Saskatchewan')) province = 'SK';
    else province = 'Other';
  }
  let city = item.city;
  if (!city) {
      const parts = address.split(',');
      city = parts[0] ? parts[0].trim() : 'Unknown';
  }
  return {
    ...item,
    id: item.id || Math.random().toString(36).substr(2, 9),
    province: province,
    city: city,
    rent: item.rent || item.avgRent || item.price || 0,
    image: item.image || '🏠'
  };
};

const CanadaRentMap = ({ onBack }) => {
  const [listings, setListings] = useState([]);
  const [filterProvince, setFilterProvince] = useState('All');
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const cardRefs = useRef({}); 
  const searchWrapperRef = useRef(null);

  useEffect(() => {
    const normalized = ALL_LISTINGS.map(normalizeListing);
    setListings(normalized);
  }, []);

  // Close Autocomplete on Click Outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter Data
  const filteredData = useMemo(() => {
    let data = listings;
    if (filterProvince !== 'All') data = data.filter(item => item.province === filterProvince);
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      data = data.filter(item => 
        (item.city && item.city.toLowerCase().includes(lowerTerm)) ||
        (item.address && item.address.toLowerCase().includes(lowerTerm))
      );
    }
    return data;
  }, [listings, filterProvince, searchTerm]);

  // Suggestions
  const locationOptions = useMemo(() => {
    const locs = new Set();
    listings.forEach(l => { if (l.city && l.province) locs.add(`${l.city}, ${l.province}`); });
    return Array.from(locs).sort();
  }, [listings]);

  const suggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    return locationOptions.filter(loc => loc.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, locationOptions]);

  const handleSearchSelect = (loc) => {
    setSearchTerm(loc);
    setShowSuggestions(false);
    const parts = loc.split(',');
    const prov = parts[1] ? parts[1].trim() : '';
    if (['ON', 'BC', 'SK'].includes(prov)) setFilterProvince(prov);
    else setFilterProvince('All');
  };

  const handleMarkerClick = (id) => {
    setSelectedPropertyId(id);
    const card = cardRefs.current[id];
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('highlight-flash');
      setTimeout(() => card.classList.remove('highlight-flash'), 1000);
    }
  };

  // NEW: Reset logic when clicking map background or "Reset View" button
  const handleResetView = () => {
    setSelectedPropertyId(null);
  };

  const provinces = ['All', 'ON', 'BC', 'SK'];

  return (
    <div className="canada-rent-map-wrapper">
      <div className="canada-rent-map-container">
        {/* --- Header Section (Fixed Top) --- */}
        <div className="map-header">
          <div className="header-top">
            <button className="back-btn" onClick={onBack}>← Back</button>
            <h1>🇨🇦 Canada Rent Map</h1>
            
            <div className="search-container" ref={searchWrapperRef}>
              <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input 
                  type="text" 
                  placeholder="Search city..." 
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  className="search-input"
                />
                {searchTerm && <button className="clear-search" onClick={() => setSearchTerm('')}>✕</button>}
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <div className="autocomplete-dropdown">
                  {suggestions.map((loc, idx) => (
                    <div key={idx} className="autocomplete-item" onClick={() => handleSearchSelect(loc)}>📍 {loc}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="controls-row">
            <div className="province-filters">
              {provinces.map(prov => (
                <button
                  key={prov}
                  className={`filter-btn ${filterProvince === prov ? 'active' : ''}`}
                  onClick={() => { setFilterProvince(prov); setSearchTerm(''); setSelectedPropertyId(null); }}
                >
                  {prov}
                </button>
              ))}
            </div>
            <div className="stats-bar">
               <span className="value">{filteredData.length}</span> <span className="label">Listings</span>
            </div>
          </div>
        </div>

        {/* --- Main Content --- */}
        <div className="main-content">
          <div className="list-pane">
            <div className="list-content">
              {filteredData.length === 0 ? (
                <div className="empty-state"><h3>No matches</h3></div>
              ) : (
                <div className="listings-list">
                  {filteredData.map(property => (
                    <div 
                      key={property.id}
                      ref={el => cardRefs.current[property.id] = el}
                      className={`listing-card-horizontal ${selectedPropertyId === property.id ? 'selected' : ''}`}
                      onClick={() => setSelectedPropertyId(property.id)}
                    >
                      <div className="card-image-wrapper">
                        {property.image.startsWith('http') ? <img src={property.image} alt="" /> : <div className="emoji-placeholder">{property.image}</div>}
                        <span className="price-badge-small">${property.rent}</span>
                      </div>
                      <div className="card-details">
                        <div className="card-top"><h3>{property.title}</h3><span className="rent-highlight">${property.rent}</span></div>
                        <p className="address-text">{property.address}</p>
                        <div className="specs-row"><span>🛏 {property.bedrooms} Bd</span><span>📍 {property.province}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Footer Placeholder */}
            <div className="list-footer-wrapper"><div style={{padding:'20px',textAlign:'center',color:'#ccc'}}>Rently © 2025</div></div>
          </div>

          <div className="map-pane">
            <PropertyMap 
              properties={filteredData} 
              selectedPropertyId={selectedPropertyId}
              onMarkerClick={handleMarkerClick}
              onMapClick={handleResetView} // Handles background click
            />
            
            {/* NEW: Floating Reset Button */}
            {selectedPropertyId && (
              <button className="reset-view-btn" onClick={handleResetView}>
                ✕ Clear Selection
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        /* --- CORE LAYOUT --- */
        .canada-rent-map-wrapper {
          position: fixed; top: 60px; left: 0; right: 0; bottom: 0;
          background: #fff; z-index: 50; display: flex; flex-direction: column;
        }
        .canada-rent-map-container { display: flex; flex-direction: column; height: 100%; }

        /* --- HEADER (Kept visible) --- */
        .map-header {
          background: white; padding: 12px 20px; border-bottom: 1px solid #e0e0e0;
          z-index: 20; box-shadow: 0 2px 4px rgba(0,0,0,0.05); flex-shrink: 0;
        }
        .header-top { display: flex; align-items: center; gap: 20px; margin-bottom: 12px; }
        .header-top h1 { margin: 0; font-size: 1.4rem; white-space: nowrap; }
        .back-btn { padding: 6px 12px; border: 1px solid #ddd; background: #f9f9f9; border-radius: 6px; cursor: pointer; font-weight: 600; }
        .search-container { position: relative; flex: 1; max-width: 400px; }
        .search-input { width: 100%; padding: 8px 35px; border: 1px solid #ddd; border-radius: 20px; background: #f9f9f9; }
        .search-icon { position: absolute; left: 12px; top: 8px; color: #999; }
        .clear-search { position: absolute; right: 12px; top: 8px; border: none; background: none; cursor: pointer; color: #999; }
        .autocomplete-dropdown { position: absolute; top: 110%; left: 0; right: 0; background: white; border: 1px solid #eee; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-height: 200px; overflow-y: auto; z-index: 1000; }
        .autocomplete-item { padding: 10px 15px; cursor: pointer; border-bottom: 1px solid #f5f5f5; }
        .autocomplete-item:hover { background: #f0f7ff; color: #fd5068; }
        
        .controls-row { display: flex; justify-content: space-between; align-items: center; }
        .province-filters { display: flex; gap: 8px; }
        .filter-btn { padding: 6px 14px; border-radius: 20px; border: 1px solid #eee; background: #f5f5f5; cursor: pointer; }
        .filter-btn.active { background: #333; color: white; border-color: #333; }
        .stats-bar { font-size: 0.85rem; color: #666; background: #f9f9f9; padding: 4px 12px; border-radius: 12px; font-weight: bold; }

        /* --- MAIN CONTENT --- */
        .main-content { display: flex; flex: 1; overflow: hidden; flex-direction: row; }
        
        /* List Side */
        .list-pane { width: 420px; height: 100%; overflow-y: auto; border-right: 1px solid #e0e0e0; background: #fff; display: flex; flex-direction: column; flex-shrink: 0; }
        .list-content { flex: 1; padding: 15px; }
        .listings-list { display: flex; flex-direction: column; gap: 12px; }
        .list-footer-wrapper { margin-top: auto; background: #f9f9f9; }

        /* Card Styles */
        .listing-card-horizontal { display: flex; background: white; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; cursor: pointer; height: 110px; transition: all 0.2s; }
        .listing-card-horizontal:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-color: #ccc; }
        .listing-card-horizontal.selected { border: 2px solid #fd5068; background: #fffafa; }
        .highlight-flash { animation: flash 1s ease; }
        @keyframes flash { 0% { background-color: rgba(253, 80, 104, 0.2); } 100% { background-color: white; } }
        
        .card-image-wrapper { width: 130px; min-width: 130px; position: relative; background: #eee; }
        .card-image-wrapper img { width: 100%; height: 100%; object-fit: cover; }
        .emoji-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 2rem; background: #f0f0f0; }
        .price-badge-small { position: absolute; bottom: 6px; left: 6px; background: rgba(0,0,0,0.75); color: white; font-size: 0.75rem; font-weight: bold; padding: 2px 6px; border-radius: 4px; }
        .card-details { padding: 10px 12px; flex: 1; display: flex; flex-direction: column; justify-content: center; }
        .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
        .card-top h3 { margin: 0; font-size: 0.95rem; color: #333; line-height: 1.2; max-height: 2.4em; overflow: hidden; }
        .rent-highlight { color: #fd5068; font-weight: 700; font-size: 1rem; margin-left: 8px; }
        .address-text { font-size: 0.8rem; color: #666; margin: 0 0 8px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .specs-row { display: flex; gap: 10px; font-size: 0.75rem; color: #888; margin-top: auto; }

        /* Map Side */
        .map-pane { flex: 1; height: 100%; position: relative; }
        
        /* Floating Reset Button */
        .reset-view-btn {
          position: absolute; top: 20px; left: 50%; transform: translateX(-50%);
          background: white; color: #333; border: none; padding: 10px 20px;
          border-radius: 25px; font-weight: 600; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          cursor: pointer; z-index: 1000; display: flex; align-items: center; gap: 8px;
          transition: transform 0.2s;
        }
        .reset-view-btn:hover { transform: translateX(-50%) scale(1.05); }

        @media (max-width: 900px) {
          .canada-rent-map-wrapper { position: relative; top: 0; height: auto; }
          .main-content { flex-direction: column; }
          .map-pane { height: 45vh; order: 1; }
          .list-pane { width: 100%; height: auto; order: 2; border-right: none; border-top: 1px solid #ddd; }
          .list-footer-wrapper { display: none; }
          .search-container { max-width: 100%; width: 100%; order: 3; margin-top: 10px; }
          .header-top { flex-wrap: wrap; }
        }
      `}</style>
    </div>
  );
};

export default CanadaRentMap;