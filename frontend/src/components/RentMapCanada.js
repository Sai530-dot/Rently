import React, { useState, useRef, useEffect } from 'react';

const RentMapCanada = ({ onBack, userPreferences }) => {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [hoveredNeighborhood, setHoveredNeighborhood] = useState(null);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProvince, setFilterProvince] = useState('All');
  const mapRef = useRef(null);

  // Fetch data from API
  useEffect(() => {
    fetchRentData();
  }, []);

  const fetchRentData = async () => {
    setLoading(true);
    console.log('🔄 Fetching rent data from backend...');
    
    try {
      const url = `http://localhost:5000/api/rent-map?bedrooms=1`;
      console.log('📡 API URL:', url);
      
      const response = await fetch(url);
      console.log('📥 Response status:', response.status);
      
      const data = await response.json();
      console.log('📊 API Response:', data);
      
      if (data.success && data.data) {
        // Convert lat/lon to map coordinates
        const enrichedData = data.data.map(item => ({
          ...item,
          name: item.neighborhood,
          x: lonToX(item.lon),
          y: latToY(item.lat)
        }));
        console.log(`✅ Successfully loaded ${enrichedData.length} neighborhoods`);
        console.log('Sample neighborhood:', enrichedData[0]);
        setNeighborhoods(enrichedData);
      } else {
        console.error('❌ API returned no data or success=false');
        setNeighborhoods([]);
      }
    } catch (error) {
      console.error('❌ Error fetching rent data:', error);
      console.error('Error details:', error.message);
      // Don't show alert, just log the error
      setNeighborhoods([]);
    } finally {
      setLoading(false);
      console.log('🏁 Fetch complete. Loading state:', false);
    }
  };

  // Convert longitude to X coordinate (Canada spans roughly -141° to -52°)
  const lonToX = (lon) => {
    const minLon = -141;
    const maxLon = -52;
    const normalized = ((lon - minLon) / (maxLon - minLon));
    return Math.max(5, Math.min(95, normalized * 100)); // Keep within bounds
  };

  // Convert latitude to Y coordinate (Canada spans roughly 42° to 70°)
  const latToY = (lat) => {
    const minLat = 42;
    const maxLat = 70;
    const normalized = ((lat - minLat) / (maxLat - minLat));
    // Invert Y because map coordinates go top to bottom
    return Math.max(5, Math.min(95, 100 - (normalized * 100))); // Keep within bounds
  };

  const provinces = ['All', 'ON', 'BC', 'QC', 'AB', 'MB', 'SK', 'NS', 'NL'];
  
  const filteredNeighborhoods = filterProvince === 'All' 
    ? neighborhoods 
    : neighborhoods.filter(n => n.province === filterProvince);

  const getRentColor = (rent) => {
    if (rent < 1400) return '#51cf66';
    if (rent < 1800) return '#ffd93d';
    if (rent < 2200) return '#ff922b';
    return '#ff6b6b';
  };

  const getMarkerSize = (rent) => {
    if (rent < 1400) return 35;
    if (rent < 1800) return 40;
    if (rent < 2200) return 45;
    return 50;
  };

  const handleNeighborhoodClick = (neighborhood) => {
    setSelectedNeighborhood(neighborhood);
  };

  const displayNeighborhood = hoveredNeighborhood || selectedNeighborhood;

  // Calculate statistics
  const stats = {
    total: filteredNeighborhoods.length,
    avgRent: Math.round(filteredNeighborhoods.reduce((sum, n) => sum + n.avgRent, 0) / filteredNeighborhoods.length),
    minRent: Math.min(...filteredNeighborhoods.map(n => n.avgRent)),
    maxRent: Math.max(...filteredNeighborhoods.map(n => n.avgRent))
  };

  return (
    <div className="rent-map-canada">
      <div className="map-header">
        <h2>🇨🇦 Rently Canada Rent Map</h2>
        <p>Explore average rent prices across {stats.total} neighborhoods in Canada</p>
      </div>

      <div className="map-controls">
        <div className="province-filter">
          <label>Filter by Province:</label>
          <div className="province-buttons">
            {provinces.map(prov => (
              <button
                key={prov}
                className={`prov-btn ${filterProvince === prov ? 'active' : ''}`}
                onClick={() => setFilterProvince(prov)}
              >
                {prov}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-label">Neighborhoods</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Avg Rent</span>
          <span className="stat-value">${stats.avgRent}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Lowest</span>
          <span className="stat-value">${stats.minRent}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Highest</span>
          <span className="stat-value">${stats.maxRent}</span>
        </div>
      </div>

      <div className="map-instructions">
        <p>💡 <strong>Tip:</strong> Scroll horizontally and vertically to explore the entire Canada map. Click markers for details!</p>
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
            <p>Loading Canada-wide rent data...</p>
          </div>
        )}
        {!loading && neighborhoods.length === 0 && (
          <div className="map-error">
            <h3>⚠️ Unable to Load Data</h3>
            <p>Cannot connect to backend server.</p>
            <p>Please ensure the backend is running on <code>http://localhost:5000</code></p>
            <button onClick={fetchRentData} className="retry-btn">Retry</button>
          </div>
        )}
        <div className="canada-map">
          {/* Canada outline SVG */}
          <svg className="canada-outline" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path 
              d="M 10,30 Q 15,25 25,28 L 35,25 L 45,30 L 55,28 L 70,35 L 80,40 L 85,50 L 80,60 L 70,65 L 60,68 L 50,70 L 40,68 L 30,65 L 20,60 L 15,50 L 10,40 Z" 
              fill="none" 
              stroke="#9b59b6" 
              strokeWidth="0.5"
              opacity="0.3"
            />
          </svg>

          {/* Neighborhood markers */}
          {filteredNeighborhoods.map(neighborhood => {
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
                title={`${neighborhood.city} - ${neighborhood.name}: $${neighborhood.avgRent}`}
              >
                <span className="marker-price-label">${Math.round(neighborhood.avgRent/100)}k</span>
                <div className="marker-tooltip">
                  <strong>{neighborhood.city}</strong><br/>
                  {neighborhood.name}<br/>
                  ${neighborhood.avgRent}/mo
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {displayNeighborhood && (
        <div className="neighborhood-details">
          <div className="details-header">
            <div>
              <h3>{displayNeighborhood.name}</h3>
              <span className="details-location">{displayNeighborhood.city}, {displayNeighborhood.province}</span>
            </div>
            <button className="close-btn" onClick={() => setSelectedNeighborhood(null)}>✕</button>
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
              <span className="detail-label">Market Trend</span>
              <span className="detail-value trend" style={{color: displayNeighborhood.trend === 'increasing' ? '#ff922b' : '#51cf66'}}>
                {displayNeighborhood.trend === 'increasing' ? '📈 Rising' : '📊 Stable'}
              </span>
            </div>
            <div className="detail-box">
              <span className="detail-label">6-Month Prediction</span>
              <span className="detail-value">${displayNeighborhood.prediction}/mo</span>
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
        .rent-map-canada {
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

        .map-controls {
          background: white;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .province-filter label {
          display: block;
          margin-bottom: 10px;
          font-weight: 600;
          color: #333;
        }

        .province-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .prov-btn {
          padding: 8px 16px;
          background: white;
          border: 2px solid #ddd;
          border-radius: 20px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .prov-btn:hover {
          border-color: #fd5068;
        }

        .prov-btn.active {
          background: linear-gradient(45deg, #fd5068, #ff6b9d);
          color: white;
          border-color: transparent;
        }

        .stats-bar {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .stat-item {
          background: white;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .stat-label {
          display: block;
          font-size: 0.85rem;
          color: #666;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: #fd5068;
        }

        .map-instructions {
          background: linear-gradient(45deg, #fd5068, #ff6b9d);
          color: white;
          padding: 15px 20px;
          border-radius: 12px;
          margin-bottom: 20px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .map-instructions p {
          margin: 0;
          font-size: 1rem;
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
          overflow-x: scroll;
          overflow-y: scroll;
          height: 700px;
          margin-bottom: 20px;
          position: relative;
          -webkit-overflow-scrolling: touch;
        }

        .map-container::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }

        .map-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .map-container::-webkit-scrollbar-thumb {
          background: #fd5068;
          border-radius: 10px;
        }

        .map-container::-webkit-scrollbar-thumb:hover {
          background: #ff6b9d;
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

        .map-error {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          z-index: 100;
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          max-width: 400px;
        }

        .map-error h3 {
          margin: 0 0 15px 0;
          color: #ff6b6b;
        }

        .map-error p {
          margin: 10px 0;
          color: #666;
        }

        .map-error code {
          background: #f0f0f0;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
        }

        .retry-btn {
          margin-top: 20px;
          padding: 12px 30px;
          background: linear-gradient(45deg, #fd5068, #ff6b9d);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.3s ease;
        }

        .retry-btn:hover {
          transform: translateY(-2px);
        }

        .canada-map {
          position: relative;
          width: 2000px;
          height: 1200px;
          min-width: 2000px;
          min-height: 1200px;
          background: linear-gradient(180deg, #e8f5e9 0%, #c8e6c9 30%, #a5d6a7 60%, #81c784 100%);
          border: 2px solid #fd5068;
          border-radius: 8px;
          margin: 10px;
        }

        .canada-outline {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
          opacity: 0.2;
        }

        .neighborhood-marker {
          position: absolute;
          border-radius: 50%;
          cursor: pointer;
          transform: translate(-50%, -50%);
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 0.7rem;
          border: 2px solid white;
        }

        .marker-price-label {
          font-size: 0.75rem;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
          pointer-events: none;
          font-weight: 800;
        }

        .neighborhood-marker:hover {
          transform: translate(-50%, -50%) scale(1.3);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
          z-index: 10;
        }

        .neighborhood-marker.selected {
          transform: translate(-50%, -50%) scale(1.4);
          box-shadow: 0 8px 24px rgba(155, 89, 182, 0.5);
          z-index: 11;
          border: 3px solid white;
        }

        .marker-tooltip {
          display: none;
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 10px 15px;
          border-radius: 8px;
          white-space: nowrap;
          font-size: 0.85rem;
          margin-bottom: 10px;
          pointer-events: none;
        }

        .neighborhood-marker:hover .marker-tooltip {
          display: block;
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
          align-items: flex-start;
          margin-bottom: 25px;
          padding-bottom: 20px;
          border-bottom: 2px solid #f0f0f0;
        }

        .details-header h3 {
          margin: 0 0 5px 0;
          font-size: 1.8rem;
          color: #333;
        }

        .details-location {
          color: #666;
          font-size: 1rem;
        }

        .close-btn {
          background: #f0f0f0;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1.2rem;
          transition: all 0.3s ease;
        }

        .close-btn:hover {
          background: #ff6b6b;
          color: white;
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
          background: linear-gradient(45deg, #fd5068, #ff6b9d);
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
            height: 500px;
          }

          .details-grid {
            grid-template-columns: 1fr 1fr;
          }

          .province-buttons {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default RentMapCanada;
