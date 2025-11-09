import React, { useState, useEffect, useRef } from 'react';

const CanadaRentMap = ({ onBack }) => {
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [filterProvince, setFilterProvince] = useState('All');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    fetchRentData();
  }, []);

  const fetchRentData = async () => {
    setLoading(true);
    setError(null);
    console.log('🔄 Fetching rent data from API...');
    
    try {
      const response = await fetch('http://localhost:5000/api/rent-map?bedrooms=1');
      console.log('📡 Response status:', response.status);
      
      const data = await response.json();
      console.log('📊 API Response:', data);
      
      if (data.success && data.data) {
        console.log(`✅ Loaded ${data.data.length} neighborhoods`);
        setNeighborhoods(data.data);
      } else {
        setError('API returned no data');
      }
    } catch (error) {
      console.error('❌ Error fetching rent data:', error);
      setError('Cannot connect to backend server. Make sure it is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const provinces = ['All', 'ON', 'BC', 'QC', 'AB', 'MB', 'SK', 'NS', 'NL'];
  
  const filteredData = filterProvince === 'All' 
    ? neighborhoods 
    : neighborhoods.filter(n => n.province === filterProvince);

  const stats = {
    total: filteredData.length,
    avgRent: filteredData.length > 0 
      ? Math.round(filteredData.reduce((sum, n) => sum + n.avgRent, 0) / filteredData.length)
      : 0,
    minRent: filteredData.length > 0 ? Math.min(...filteredData.map(n => n.avgRent)) : 0,
    maxRent: filteredData.length > 0 ? Math.max(...filteredData.map(n => n.avgRent)) : 0
  };

  const getRentColor = (rent) => {
    if (rent < 1400) return '#51cf66';
    if (rent < 1800) return '#ffd93d';
    if (rent < 2200) return '#ff922b';
    return '#ff6b6b';
  };

  // Initialize Leaflet map when switching to map view
  useEffect(() => {
    if (viewMode === 'map' && mapContainerRef.current && !mapInstanceRef.current) {
      // Dynamically load Leaflet CSS and JS
      const loadLeaflet = async () => {
        // Load Leaflet CSS
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        // Load Leaflet JS
        if (!window.L) {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => initializeMap();
          document.body.appendChild(script);
        } else {
          initializeMap();
        }
      };

      const initializeMap = () => {
        if (!window.L || mapInstanceRef.current) return;

        // Initialize map centered on Canada
        const map = window.L.map(mapContainerRef.current, {
          center: [56.1304, -106.3468], // Center of Canada
          zoom: 4,
          minZoom: 3,
          maxZoom: 13
        });

        // Add OpenStreetMap tiles
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map);

        mapInstanceRef.current = map;
        updateMapMarkers();
      };

      loadLeaflet();
    }
  }, [viewMode]);

  // Update markers when data or filter changes
  useEffect(() => {
    if (mapInstanceRef.current && viewMode === 'map') {
      updateMapMarkers();
    }
  }, [filteredData, viewMode]);

  const updateMapMarkers = () => {
    if (!mapInstanceRef.current || !window.L) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for each neighborhood
    filteredData.forEach(neighborhood => {
      if (neighborhood.lat && neighborhood.lon) {
        const color = getRentColor(neighborhood.avgRent);
        const radius = 15 + (neighborhood.avgRent / 200);

        // Create circle marker
        const marker = window.L.circleMarker([neighborhood.lat, neighborhood.lon], {
          radius: radius,
          fillColor: color,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(mapInstanceRef.current);

        // Add popup
        marker.bindPopup(`
          <div style="font-family: Arial, sans-serif;">
            <h3 style="margin: 0 0 8px 0; color: #333;">${neighborhood.city}</h3>
            <p style="margin: 0 0 5px 0; color: #666;">${neighborhood.neighborhood}</p>
            <p style="margin: 0; font-size: 1.2rem; font-weight: bold; color: ${color};">
              $${neighborhood.avgRent}/mo
            </p>
            <p style="margin: 5px 0 0 0; color: #999; font-size: 0.9rem;">
              ${neighborhood.sqft} sqft • ${neighborhood.bedrooms} bed
            </p>
          </div>
        `);

        // Click handler
        marker.on('click', () => {
          setSelectedNeighborhood(neighborhood);
        });

        markersRef.current.push(marker);
      }
    });
  };

  return (
    <div className="canada-rent-map">
      <div className="map-header">
        <button className="back-btn" onClick={onBack}>← Back to Dashboard</button>
        <h1>🇨🇦 Canada Rent Map - ML Powered</h1>
        <p>Explore AI-predicted average rent prices across {stats.total} neighborhoods</p>
      </div>

      <div className="stats-overview">
        <div className="stat-box">
          <span className="stat-label">Total Neighborhoods</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Average Rent</span>
          <span className="stat-value">${stats.avgRent}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Lowest Rent</span>
          <span className="stat-value">${stats.minRent}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Highest Rent</span>
          <span className="stat-value">${stats.maxRent}</span>
        </div>
      </div>

      <div className="view-tabs">
        <button
          className={`tab-btn ${viewMode === 'list' ? 'active' : ''}`}
          onClick={() => setViewMode('list')}
        >
          📋 List View
        </button>
        <button
          className={`tab-btn ${viewMode === 'map' ? 'active' : ''}`}
          onClick={() => setViewMode('map')}
        >
          🗺️ Interactive Map
        </button>
      </div>

      <div className="filter-section">
        <h3>Filter by Province:</h3>
        <div className="province-filters">
          {provinces.map(prov => (
            <button
              key={prov}
              className={`filter-btn ${filterProvince === prov ? 'active' : ''}`}
              onClick={() => setFilterProvince(prov)}
            >
              {prov}
            </button>
          ))}
        </div>
      </div>

      <div className="legend">
        <h3>Price Legend (1 Bedroom):</h3>
        <div className="legend-items">
          <div className="legend-item">
            <div className="color-box" style={{background: '#51cf66'}}></div>
            <span>Under $1,400</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{background: '#ffd93d'}}></div>
            <span>$1,400 - $1,800</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{background: '#ff922b'}}></div>
            <span>$1,800 - $2,200</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{background: '#ff6b6b'}}></div>
            <span>Over $2,200</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading ML rent predictions...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <h3>⚠️ Unable to Load Data</h3>
          <p>{error}</p>
          <button className="retry-btn" onClick={fetchRentData}>
            🔄 Retry
          </button>
        </div>
      ) : neighborhoods.length === 0 ? (
        <div className="empty-state">
          <h3>No neighborhoods found</h3>
          <p>Try adjusting your filters</p>
        </div>
      ) : viewMode === 'map' ? (
        <div className="leaflet-map-wrapper">
          <div 
            ref={mapContainerRef}
            className="leaflet-map-container"
          />
          <div className="map-legend-overlay">
            <h4>Rent Prices</h4>
            <div className="legend-item">
              <div className="color-box" style={{background: '#51cf66'}}></div>
              <span>Under $1,400</span>
            </div>
            <div className="legend-item">
              <div className="color-box" style={{background: '#ffd93d'}}></div>
              <span>$1,400 - $1,800</span>
            </div>
            <div className="legend-item">
              <div className="color-box" style={{background: '#ff922b'}}></div>
              <span>$1,800 - $2,200</span>
            </div>
            <div className="legend-item">
              <div className="color-box" style={{background: '#ff6b6b'}}></div>
              <span>Over $2,200</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="scrollable-map-container">
          <div className="neighborhoods-grid">
            {filteredData.map(neighborhood => (
              <div
                key={neighborhood.id}
                className="neighborhood-card"
                style={{borderLeft: `4px solid ${getRentColor(neighborhood.avgRent)}`}}
                onClick={() => setSelectedNeighborhood(neighborhood)}
              >
                <div className="card-header">
                  <h3>{neighborhood.city}</h3>
                  <span className="province-badge">{neighborhood.province}</span>
                </div>
                <div className="card-body">
                  <p className="neighborhood-name">{neighborhood.neighborhood}</p>
                  <div className="rent-info">
                    <span className="rent-price" style={{color: getRentColor(neighborhood.avgRent)}}>
                      ${neighborhood.avgRent}/mo
                    </span>
                    <span className="sqft-info">{neighborhood.sqft} sqft</span>
                  </div>
                  <div className="ml-prediction">
                    <span className="ml-badge">🤖 ML Prediction</span>
                    <span className="trend-badge" style={{
                      background: neighborhood.trend === 'increasing' ? '#ffe6ec' : '#e6f7ff',
                      color: neighborhood.trend === 'increasing' ? '#fd5068' : '#1890ff'
                    }}>
                      {neighborhood.trend === 'increasing' ? '📈 Rising' : '📊 Stable'}
                    </span>
                  </div>
                  <div className="prediction-info">
                    <span>6-Month Forecast: ${neighborhood.prediction}/mo</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedNeighborhood && (
        <div className="modal-overlay" onClick={() => setSelectedNeighborhood(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedNeighborhood(null)}>✕</button>
            <h2>{selectedNeighborhood.city} - {selectedNeighborhood.neighborhood}</h2>
            <div className="modal-details">
              <div className="detail-row">
                <span>Province:</span>
                <strong>{selectedNeighborhood.province}</strong>
              </div>
              <div className="detail-row">
                <span>Current Avg Rent:</span>
                <strong style={{color: getRentColor(selectedNeighborhood.avgRent)}}>
                  ${selectedNeighborhood.avgRent}/month
                </strong>
              </div>
              <div className="detail-row">
                <span>Average Size:</span>
                <strong>{selectedNeighborhood.sqft} sqft</strong>
              </div>
              <div className="detail-row">
                <span>Price per sqft:</span>
                <strong>${(selectedNeighborhood.avgRent / selectedNeighborhood.sqft).toFixed(2)}</strong>
              </div>
              <div className="detail-row">
                <span>Market Trend:</span>
                <strong style={{color: selectedNeighborhood.trend === 'increasing' ? '#fd5068' : '#1890ff'}}>
                  {selectedNeighborhood.trend === 'increasing' ? '📈 Increasing' : '📊 Stable'}
                </strong>
              </div>
              <div className="detail-row">
                <span>ML 6-Month Prediction:</span>
                <strong>${selectedNeighborhood.prediction}/month</strong>
              </div>
              <div className="detail-row">
                <span>Predicted Change:</span>
                <strong style={{color: selectedNeighborhood.prediction > selectedNeighborhood.avgRent ? '#fd5068' : '#51cf66'}}>
                  {selectedNeighborhood.prediction > selectedNeighborhood.avgRent ? '+' : ''}
                  ${selectedNeighborhood.prediction - selectedNeighborhood.avgRent}
                  ({(((selectedNeighborhood.prediction - selectedNeighborhood.avgRent) / selectedNeighborhood.avgRent) * 100).toFixed(1)}%)
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .canada-rent-map {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
        }

        .map-header {
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

        .map-header h1 {
          margin: 0 0 10px 0;
          font-size: 2.5rem;
          background: linear-gradient(45deg, #fd5068, #ff6b9d);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .map-header p {
          margin: 0;
          color: #666;
          font-size: 1.1rem;
        }

        .stats-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-box {
          background: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .stat-label {
          display: block;
          font-size: 0.9rem;
          color: #666;
          margin-bottom: 10px;
          font-weight: 600;
        }

        .stat-value {
          display: block;
          font-size: 2rem;
          font-weight: 700;
          color: #fd5068;
        }

        .filter-section {
          background: white;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .filter-section h3 {
          margin: 0 0 15px 0;
          font-size: 1.1rem;
        }

        .province-filters {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 10px 20px;
          background: white;
          border: 2px solid #ddd;
          border-radius: 20px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .filter-btn:hover {
          border-color: #fd5068;
        }

        .filter-btn.active {
          background: linear-gradient(45deg, #fd5068, #ff6b9d);
          color: white;
          border-color: transparent;
        }

        .legend {
          background: white;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .legend h3 {
          margin: 0 0 15px 0;
          font-size: 1.1rem;
        }

        .legend-items {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .color-box {
          width: 24px;
          height: 24px;
          border-radius: 4px;
        }

        .loading-state, .error-state, .empty-state {
          text-align: center;
          padding: 80px 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .error-state h3 {
          color: #ff6b6b;
          margin-bottom: 15px;
        }

        .error-state p {
          color: #666;
          margin-bottom: 20px;
        }

        .retry-btn {
          padding: 12px 30px;
          background: linear-gradient(45deg, #fd5068, #ff6b9d);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 1rem;
          transition: transform 0.3s ease;
        }

        .retry-btn:hover {
          transform: translateY(-2px);
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

        .scrollable-map-container {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          max-height: 800px;
          overflow-y: auto;
        }

        .scrollable-map-container::-webkit-scrollbar {
          width: 10px;
        }

        .scrollable-map-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .scrollable-map-container::-webkit-scrollbar-thumb {
          background: #fd5068;
          border-radius: 10px;
        }

        .scrollable-map-container::-webkit-scrollbar-thumb:hover {
          background: #ff6b9d;
        }

        .neighborhoods-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .neighborhood-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .neighborhood-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .card-header h3 {
          margin: 0;
          font-size: 1.3rem;
          color: #333;
        }

        .province-badge {
          padding: 4px 12px;
          background: #f0f0f0;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #666;
        }

        .card-body {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .neighborhood-name {
          margin: 0;
          font-size: 1rem;
          color: #666;
          font-weight: 500;
        }

        .rent-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .rent-price {
          font-size: 1.8rem;
          font-weight: 700;
        }

        .sqft-info {
          color: #999;
          font-size: 0.9rem;
        }

        .ml-prediction {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .ml-badge {
          padding: 4px 10px;
          background: linear-gradient(45deg, #fd5068, #ff6b9d);
          color: white;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .trend-badge {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .prediction-info {
          padding: 10px;
          background: #f8f9fa;
          border-radius: 8px;
          font-size: 0.9rem;
          color: #666;
          font-weight: 500;
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

        .modal-content {
          background: white;
          border-radius: 16px;
          padding: 30px;
          max-width: 600px;
          width: 100%;
          position: relative;
          max-height: 90vh;
          overflow-y: auto;
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
        }

        .close-modal:hover {
          background: #fd5068;
          color: white;
        }

        .modal-content h2 {
          margin: 0 0 25px 0;
          font-size: 1.8rem;
          color: #333;
        }

        .modal-details {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .detail-row span {
          color: #666;
          font-weight: 500;
        }

        .detail-row strong {
          font-size: 1.1rem;
          color: #333;
        }

        .view-tabs {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin: 30px 0;
        }

        .tab-btn {
          padding: 12px 30px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          background: white;
          color: #666;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .tab-btn:hover {
          border-color: #fd5068;
          color: #fd5068;
        }

        .tab-btn.active {
          background: linear-gradient(45deg, #fd5068, #ff6b9d);
          color: white;
          border-color: #fd5068;
        }

        .leaflet-map-wrapper {
          position: relative;
          width: 100%;
          height: 600px;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .leaflet-map-container {
          width: 100%;
          height: 100%;
          z-index: 1;
        }

        .map-legend-overlay {
          position: absolute;
          top: 20px;
          right: 20px;
          background: white;
          padding: 15px 20px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 1000;
        }

        .map-legend-overlay h4 {
          margin: 0 0 12px 0;
          font-size: 1rem;
          color: #333;
        }

        .map-legend-overlay .legend-item {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .map-legend-overlay .legend-item:last-child {
          margin-bottom: 0;
        }

        .map-legend-overlay .color-box {
          width: 20px;
          height: 20px;
          border-radius: 4px;
        }

        .map-legend-overlay span {
          font-size: 0.85rem;
          color: #666;
        }

        @media (max-width: 768px) {
          .map-header h1 {
            font-size: 1.8rem;
          }

          .neighborhoods-grid {
            grid-template-columns: 1fr;
          }

          .stats-overview {
            grid-template-columns: repeat(2, 1fr);
          }

          .view-tabs {
            flex-direction: column;
            gap: 10px;
          }

          .tab-btn {
            width: 100%;
          }

          .leaflet-map-wrapper {
            height: 400px;
          }

          .map-legend-overlay {
            top: 10px;
            right: 10px;
            padding: 10px 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default CanadaRentMap;
