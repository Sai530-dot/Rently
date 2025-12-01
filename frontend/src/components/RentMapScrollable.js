import React, { useState, useRef, useEffect } from 'react';
import realListings from './data/real_listings.json';

// Position mapping for visualization
const POSITION_MAP = {
  'Downtown': { x: 45, y: 30 },
  'North York': { x: 48, y: 15 },
  'Scarborough': { x: 65, y: 25 },
  'Etobicoke': { x: 25, y: 35 },
  'Yorkville': { x: 47, y: 28 },
  'The Annex': { x: 42, y: 27 },
  'Mississauga': { x: 15, y: 40 },
  'Brampton': { x: 20, y: 10 },
  'Burnaby': { x: 65, y: 48 },
  'Surrey': { x: 75, y: 55 },
  'Kitsilano': { x: 42, y: 52 },
  'Richmond': { x: 55, y: 60 },
  'Plateau': { x: 55, y: 32 },
  'Verdun': { x: 45, y: 42 },
  'Mile End': { x: 52, y: 30 },
  'Westmount': { x: 42, y: 38 },
};

const RentMapScrollable = ({ onBack, userPreferences }) => {
  const [selectedCity, setSelectedCity] = useState('Toronto');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [hoveredNeighborhood, setHoveredNeighborhood] = useState(null);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  // Fetch data from API
  useEffect(() => {
    fetchRentData();
  }, [selectedCity]);

  const fetchRentData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/rent-map?city=${selectedCity}&bedrooms=1`);
      const data = await response.json();
      
      if (data.success) {
        // Add position data for visualization
        const enrichedData = data.data.map(item => ({
          ...item,
          name: item.neighborhood,
          x: POSITION_MAP[item.neighborhood]?.x || 50,
          y: POSITION_MAP[item.neighborhood]?.y || 50
        }));
        setNeighborhoods(enrichedData);
      }
    } catch (error) {
      console.error('Error fetching rent data:', error);
      // Fallback to empty array
      setNeighborhoods([]);
    } finally {
      setLoading(false);
    }
  };

  const cities = ['Toronto', 'Vancouver', 'Montreal'];
  const cityNeighborhoods = neighborhoods;

  const getRentColor = (rent) => {
    if (rent < 1400) return '#51cf66';
    if (rent < 1800) return '#ffd93d';
    if (rent < 2200) return '#ff922b';
    return '#ff6b6b';
  };

  const getMarkerSize = (rent) => {
    if (rent < 1400) return 30;
    if (rent < 1800) return 35;
    if (rent < 2200) return 40;
    return 45;
  };

  const handleNeighborhoodClick = (neighborhood) => {
    setSelectedNeighborhood(neighborhood);
  };

  const displayNeighborhood = hoveredNeighborhood || selectedNeighborhood;

  return (
    <div className="rent-map-scrollable">
      <div className="map-header">
        <h2>🗺️ Interactive Rent Map</h2>
        <p>Explore rental prices across {selectedCity}</p>
      </div>

      <div className="city-selector">
        {cities.map(city => (
          <button
            key={city}
            className={`city-btn ${selectedCity === city ? 'active' : ''}`}
            onClick={() => {
              setSelectedCity(city);
              setSelectedNeighborhood(null);
            }}
          >
            {city}
          </button>
        ))}
      </div>

      <div className="map-legend">
        <h4>Price Range (1BR)</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-dot" style={{background: '#51cf66'}}></span>
            <span>Under $1,400</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{background: '#ffd93d'}}></span>
            <span>$1,400 - $1,800</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{background: '#ff922b'}}></span>
            <span>$1,800 - $2,200</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{background: '#ff6b6b'}}></span>
            <span>Over $2,200</span>
          </div>
        </div>
      </div>

      <div className="map-container" ref={mapRef}>
        {loading && (
          <div className="map-loading">
            <div className="loading-spinner"></div>
            <p>Loading {selectedCity} neighborhoods...</p>
          </div>
        )}
        <div className="map-canvas">
          {/* Background grid */}
          <svg className="map-grid" width="100%" height="100%">
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e0e0e0" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Neighborhood markers */}
          {cityNeighborhoods.map(neighborhood => {
            const size = getMarkerSize(neighborhood.avgRent);
            const isSelected = selectedNeighborhood?.id === neighborhood.id;
            const isHovered = hoveredNeighborhood?.id === neighborhood.id;
            
            return (
              <div
                key={neighborhood.id}
                className={`neighborhood-marker ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                style={{
                  left: `${neighborhood.x}%`,
                  top: `${neighborhood.y}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  background: getRentColor(neighborhood.avgRent),
                }}
                onClick={() => handleNeighborhoodClick(neighborhood)}
                onMouseEnter={() => setHoveredNeighborhood(neighborhood)}
                onMouseLeave={() => setHoveredNeighborhood(null)}
              >
                <div className="marker-label">{neighborhood.name}</div>
                <div className="marker-price">${neighborhood.avgRent}</div>
              </div>
            );
          })}
        </div>
      </div>

      {displayNeighborhood && (
        <div className="neighborhood-details">
          <div className="details-header">
            <h3>{displayNeighborhood.name}</h3>
            <span className="details-city">{displayNeighborhood.city}</span>
          </div>
          
          <div className="details-grid">
            <div className="detail-box">
              <span className="detail-label">Average Rent</span>
              <span className="detail-value">${displayNeighborhood.avgRent}/mo</span>
            </div>
            <div className="detail-box">
              <span className="detail-label">Average Size</span>
              <span className="detail-value">{displayNeighborhood.sqft} sqft</span>
            </div>
            <div className="detail-box">
              <span className="detail-label">Price per sqft</span>
              <span className="detail-value">${(displayNeighborhood.avgRent / displayNeighborhood.sqft).toFixed(2)}</span>
            </div>
            <div className="detail-box">
              <span className="detail-label">Affordability</span>
              <span className="detail-value" style={{color: getRentColor(displayNeighborhood.avgRent)}}>
                {displayNeighborhood.avgRent < 1400 ? 'Excellent' : 
                 displayNeighborhood.avgRent < 1800 ? 'Good' : 
                 displayNeighborhood.avgRent < 2200 ? 'Fair' : 'Premium'}
              </span>
            </div>
          </div>

          <button className="view-listings-btn">
            View Listings in {displayNeighborhood.name}
          </button>
        </div>
      )}

      <style>{`
        .rent-map-scrollable {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
        }

        .map-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .map-header h2 {
          margin: 0 0 10px 0;
          font-size: 2.2rem;
          color: #333;
        }

        .map-header p {
          margin: 0;
          color: #666;
          font-size: 1.1rem;
        }

        .city-selector {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }

        .city-btn {
          padding: 12px 30px;
          background: white;
          border: 2px solid #ddd;
          border-radius: 25px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1rem;
        }

        .city-btn:hover {
          border-color: #9b59b6;
          transform: translateY(-2px);
        }

        .city-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
        }

        .map-legend {
          background: white;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .map-legend h4 {
          margin: 0 0 15px 0;
          font-size: 1.1rem;
          color: #333;
        }

        .legend-items {
          display: flex;
          gap: 25px;
          flex-wrap: wrap;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .legend-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
        }

        .map-container {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          overflow: auto;
          height: 600px;
          margin-bottom: 20px;
          position: relative;
        }

        .map-loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          z-index: 100;
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f0f0f0;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 15px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .map-loading p {
          margin: 0;
          color: #666;
          font-weight: 600;
        }

        .map-canvas {
          position: relative;
          width: 1200px;
          height: 800px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }

        .map-grid {
          position: absolute;
          top: 0;
          left: 0;
          pointer-events: none;
        }

        .neighborhood-marker {
          position: absolute;
          border-radius: 50%;
          cursor: pointer;
          transform: translate(-50%, -50%);
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
        }

        .neighborhood-marker:hover {
          transform: translate(-50%, -50%) scale(1.2);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
          z-index: 10;
        }

        .neighborhood-marker.selected {
          transform: translate(-50%, -50%) scale(1.3);
          box-shadow: 0 8px 24px rgba(155, 89, 182, 0.5);
          z-index: 11;
          border: 3px solid white;
        }

        .marker-label {
          font-size: 0.7rem;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          white-space: nowrap;
        }

        .marker-price {
          font-size: 0.85rem;
          margin-top: 2px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .neighborhood-details {
          background: white;
          padding: 30px;
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .details-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          padding-bottom: 20px;
          border-bottom: 2px solid #f0f0f0;
        }

        .details-header h3 {
          margin: 0;
          font-size: 1.8rem;
          color: #333;
        }

        .details-city {
          padding: 6px 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 25px;
        }

        .detail-box {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
        }

        .detail-label {
          display: block;
          font-size: 0.85rem;
          color: #666;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .detail-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: #333;
        }

        .view-listings-btn {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1.1rem;
          cursor: pointer;
          transition: transform 0.3s ease;
        }

        .view-listings-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        @media (max-width: 768px) {
          .map-header h2 {
            font-size: 1.5rem;
          }

          .map-container {
            height: 400px;
          }

          .details-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default RentMapScrollable;
