import React, { useState, useEffect, useRef, useMemo } from 'react';
import PropertyMap from './PropertyMap'; 
import { api } from '../services/api';

// --- NEW PREMIUM PLACEHOLDER ---
const PropertyPlaceholder = () => (
  <div className="card-placeholder">
    {/* Soft Gradient Background is handled in CSS below */}
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
      {/* Duotone Style: One part opaque, one part transparent */}
      <path d="M3 9.5L12 3L21 9.5" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19 10V19C19 20.1046 18.1046 21 17 21H7C5.89543 21 5 20.1046 5 19V10" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path opacity="0.4" d="M9 21V15C9 14.4477 9.44772 14 10 14H14C14.5523 14 15 14.4477 15 15V21" fill="#94a3b8"/>
    </svg>
  </div>
);

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
    image: item.image 
  };
};

const CanadaRentMap = ({ onBack }) => {
  const [listings, setListings] = useState([]);
  const [filterProvince, setFilterProvince] = useState('All');
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const cardRefs = useRef({}); 

  useEffect(() => {
    let mounted = true;
    api.getProperties().then(({ properties }) => {
      if (mounted) setListings((properties || []).map(normalizeListing));
    }).catch(() => {
      if (mounted) setListings([]);
    });
    return () => { mounted = false; };
  }, []);

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

  const handleMarkerClick = (id) => {
    setSelectedPropertyId(id);
    const card = cardRefs.current[id];
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('flash-active');
      setTimeout(() => card.classList.remove('flash-active'), 1000);
    }
  };

  const provinces = ['All', 'ON', 'BC', 'SK'];

  return (
    <div className="rent-map-wrapper">
      
      <div className="map-layer">
        <PropertyMap 
          properties={filteredData} 
          selectedPropertyId={selectedPropertyId}
          onMarkerClick={handleMarkerClick}
          onMapClick={() => setSelectedPropertyId(null)}
        />
      </div>

      <div className="floating-sidebar">
        <div className="sidebar-header">
          <div className="header-row">
            <button className="icon-btn back-btn" onClick={onBack}>←</button>
            <div className="search-bar">
        
               <input 
                 type="text" 
                 placeholder="Search city..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
          </div>

          <div className="filter-pills">
            {provinces.map(prov => (
              <button
                key={prov}
                className={`pill ${filterProvince === prov ? 'active' : ''}`}
                onClick={() => setFilterProvince(prov)}
              >
                {prov}
              </button>
            ))}
          </div>
          
          <div className="results-count">
            Showing {filteredData.length} properties
          </div>
        </div>

        <div className="listings-container">
          {filteredData.map(property => {
             const hasImage = property.image && property.image.startsWith('http');
             return (
              <div 
                key={property.id}
                ref={el => cardRefs.current[property.id] = el}
                className={`listing-card ${selectedPropertyId === property.id ? 'active-card' : ''}`}
                onClick={() => setSelectedPropertyId(property.id)}
              >
                <div className="card-img-wrapper">
                  {hasImage ? (
                    <img src={property.image} alt="Property" className="card-img" />
                  ) : (
                    <PropertyPlaceholder />
                  )}
                  <div className="price-tag">${property.rent}</div>
                </div>

                <div className="card-info">
                  <h3>{property.title}</h3>
                  <p className="location">{property.city}, {property.province}</p>
                  <div className="meta-row">
                      <span>🛏 {property.bedrooms} Bd</span>
                      {property.sqft && <span>📏 {property.sqft} ft²</span>}
                  </div>
                </div>
              </div>
            );
          })}
          {filteredData.length === 0 && <div className="empty-msg">No results found in this area.</div>}
        </div>
      </div>

      <style>{`
        .rent-map-wrapper {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          overflow: hidden;
          font-family: 'Inter', -apple-system, sans-serif;
          background: #f0f0f0;
        }
        .map-layer {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          z-index: 1; 
        }
        .floating-sidebar {
          position: absolute;
          top: 20px; 
          left: 100px; 
          bottom: 20px;
          width: 380px;
          background: rgba(255, 255, 255, 0.90);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          z-index: 10;
          display: flex;
          flex-direction: column;
          border: 1px solid rgba(255,255,255,0.4);
          overflow: hidden;
        }
        .sidebar-header {
          padding: 20px;
          background: rgba(255,255,255,0.5);
          border-bottom: 1px solid rgba(0,0,0,0.05);
          flex-shrink: 0;
        }
        .header-row { display: flex; gap: 12px; margin-bottom: 16px; }
        .icon-btn {
          width: 40px; height: 40px; border-radius: 50%; border: none;
          background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          cursor: pointer; font-size: 1.2rem; display: flex; align-items: center; justify-content: center;
          transition: transform 0.2s;
        }
        .icon-btn:hover { transform: scale(1.05); }
        .search-bar { flex: 1; position: relative;  }
        .search-bar input {
          width: 100%; height: 40px; padding: 0 15px 0 40px;
          border-radius: 20px; border: none;
          background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          font-size: 0.95rem; outline: none;
        }
        .search-icon { position: absolute; left: 12px; top: 10px; opacity: 0.5; }
        .filter-pills { display: flex; gap: 8px; margin-bottom: 10px; }
        .pill {
          padding: 6px 16px; border-radius: 20px; border: none;
          background: white; color: #555; font-weight: 600; cursor: pointer;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
          transition: all 0.2s;
        }
        .pill:hover { background: #f0f0f0; }
        .pill.active { background: #222; color: white; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
        .results-count { font-size: 0.8rem; color: #888; font-weight: 600; margin-left: 4px; }
        .listings-container {
          flex: 1; overflow-y: auto; padding: 15px;
          scrollbar-width: thin;
        }
        .listings-container::-webkit-scrollbar { width: 6px; }
        .listings-container::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }
        .listing-card {
          display: flex; gap: 12px;
          background: white;
          border-radius: 16px;
          padding: 10px;
          margin-bottom: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }
        .listing-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.08);
        }
        .listing-card.active-card {
          border: 2px solid #222;
          background: #fafafa;
        }
        .flash-active { animation: flash 0.6s ease; }
        @keyframes flash { 0% { background: #ffeb3b; } 100% { background: #fafafa; } }
        .card-img-wrapper {
          width: 100px; height: 90px;
          border-radius: 12px;
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
          background: #f5f5f5;
        }
        .card-img { width: 100%; height: 100%; object-fit: cover; }
        /* Professional Placeholder Style */
/* Professional Placeholder Style */
        .card-placeholder {
          width: 100%; height: 100%; 
          display: flex; align-items: center; justify-content: center;
          /* Subtle premium gradient instead of flat grey */
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
        }
        .price-tag {
          position: absolute; bottom: 6px; left: 6px;
          background: rgba(0,0,0,0.8); color: white;
          font-size: 0.75rem; font-weight: 700;
          padding: 3px 8px; border-radius: 8px;
        }
        .card-info {
          flex: 1; display: flex; flex-direction: column; justify-content: center;
          min-width: 0;
        }
        .card-info h3 {
          margin: 0 0 4px 0; font-size: 0.95rem; color: #222; line-height: 1.3;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .location { margin: 0 0 8px 0; font-size: 0.8rem; color: #888; }
        .meta-row { 
          display: flex; gap: 12px; font-size: 0.75rem; color: #555; font-weight: 600; 
          background: #f4f4f4; padding: 4px 10px; border-radius: 8px; align-self: flex-start;
        }
        .empty-msg { text-align: center; color: #999; margin-top: 40px; }
        @media (max-width: 700px) {
          .floating-sidebar {
            top: auto; left: 0; right: 0; bottom: 0;
            width: 100%; height: 50vh;
            border-radius: 24px 24px 0 0;
          }
        }
      `}</style>
    </div>
  );
};

export default CanadaRentMap;
