import React, { useState, useRef, useEffect } from 'react';

const RENT_DATA = [
  { city: 'Toronto', neighborhood: 'Downtown', avgRent: 2200, bedrooms: 1, province: 'ON', lat: 43.6532, lon: -79.3832, sqft: 550 },
  { city: 'Toronto', neighborhood: 'North York', avgRent: 1800, bedrooms: 1, province: 'ON', lat: 43.7615, lon: -79.4111, sqft: 600 },
  { city: 'Toronto', neighborhood: 'Scarborough', avgRent: 1600, bedrooms: 1, province: 'ON', lat: 43.7731, lon: -79.2578, sqft: 650 },
  { city: 'Toronto', neighborhood: 'Etobicoke', avgRent: 1700, bedrooms: 1, province: 'ON', lat: 43.6205, lon: -79.5132, sqft: 620 },
  { city: 'Toronto', neighborhood: 'Yorkville', avgRent: 2500, bedrooms: 1, province: 'ON', lat: 43.6710, lon: -79.3910, sqft: 500 },
  { city: 'Toronto', neighborhood: 'The Annex', avgRent: 2100, bedrooms: 1, province: 'ON', lat: 43.6690, lon: -79.4030, sqft: 580 },
  { city: 'Vancouver', neighborhood: 'Downtown', avgRent: 2400, bedrooms: 1, province: 'BC', lat: 49.2827, lon: -123.1207, sqft: 520 },
  { city: 'Vancouver', neighborhood: 'Burnaby', avgRent: 1900, bedrooms: 1, province: 'BC', lat: 49.2488, lon: -122.9805, sqft: 600 },
  { city: 'Vancouver', neighborhood: 'Surrey', avgRent: 1700, bedrooms: 1, province: 'BC', lat: 49.1913, lon: -122.8490, sqft: 650 },
  { city: 'Vancouver', neighborhood: 'Kitsilano', avgRent: 2200, bedrooms: 1, province: 'BC', lat: 49.2688, lon: -123.1697, sqft: 550 },
  { city: 'Montreal', neighborhood: 'Downtown', avgRent: 1500, bedrooms: 1, province: 'QC', lat: 45.5017, lon: -73.5673, sqft: 600 },
  { city: 'Montreal', neighborhood: 'Plateau', avgRent: 1400, bedrooms: 1, province: 'QC', lat: 45.5200, lon: -73.5800, sqft: 620 },
  { city: 'Montreal', neighborhood: 'Verdun', avgRent: 1200, bedrooms: 1, province: 'QC', lat: 45.4583, lon: -73.5678, sqft: 650 },
  { city: 'Montreal', neighborhood: 'Mile End', avgRent: 1450, bedrooms: 1, province: 'QC', lat: 45.5230, lon: -73.6000, sqft: 590 },
  { city: 'Calgary', neighborhood: 'Downtown', avgRent: 1600, bedrooms: 1, province: 'AB', lat: 51.0447, lon: -114.0719, sqft: 580 },
  { city: 'Calgary', neighborhood: 'Beltline', avgRent: 1500, bedrooms: 1, province: 'AB', lat: 51.0370, lon: -114.0719, sqft: 600 },
  { city: 'Ottawa', neighborhood: 'Downtown', avgRent: 1700, bedrooms: 1, province: 'ON', lat: 45.4215, lon: -75.6972, sqft: 570 },
  { city: 'Ottawa', neighborhood: 'Kanata', avgRent: 1400, bedrooms: 1, province: 'ON', lat: 45.3000, lon: -75.9000, sqft: 640 },
];

const RentMap = ({ onBack, userPreferences }) => {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [hoveredNeighborhood, setHoveredNeighborhood] = useState(null);
  const scrollContainerRef = useRef(null);

  const cities = ['All', ...new Set(RENT_DATA.map(d => d.city))];

  const filteredData = RENT_DATA
    .filter(item => selectedCity === 'All' || item.city === selectedCity)
    .filter(item => item.bedrooms === parseInt(bedroomFilter))
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.avgRent - b.avgRent;
      if (sortBy === 'price-high') return b.avgRent - a.avgRent;
      return a.neighborhood.localeCompare(b.neighborhood);
    });

  const getRentColor = (rent) => {
    if (rent < 1400) return '#51cf66';
    if (rent < 1800) return '#ffd93d';
    if (rent < 2200) return '#ff922b';
    return '#ff6b6b';
  };

  const getAffordabilityLabel = (rent) => {
    if (rent < 1400) return 'Affordable';
    if (rent < 1800) return 'Moderate';
    if (rent < 2200) return 'Expensive';
    return 'Very Expensive';
  };

  return (
    <div className="rent-map-container">
      <div className="rent-map-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h2>Explore Rent Prices</h2>
      </div>

      <div className="filters-container">
        <div className="filter-group">
          <label>City</label>
          <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Bedrooms</label>
          <select value={bedroomFilter} onChange={(e) => setBedroomFilter(e.target.value)}>
            <option value="1">1 Bedroom</option>
            <option value="2">2 Bedrooms</option>
            <option value="3">3 Bedrooms</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Sort By</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name">Neighborhood A-Z</option>
          </select>
        </div>
      </div>

      <div className="stats-overview">
        <div className="stat-box">
          <h3>{filteredData.length}</h3>
          <p>Neighborhoods</p>
        </div>
        <div className="stat-box">
          <h3>${Math.min(...filteredData.map(d => d.avgRent))}</h3>
          <p>Lowest Rent</p>
        </div>
        <div className="stat-box">
          <h3>${Math.max(...filteredData.map(d => d.avgRent))}</h3>
          <p>Highest Rent</p>
        </div>
        <div className="stat-box">
          <h3>${Math.round(filteredData.reduce((sum, d) => sum + d.avgRent, 0) / filteredData.length)}</h3>
          <p>Average Rent</p>
        </div>
      </div>

      <div className="rent-legend">
        <h4>Price Range</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-color" style={{background: '#51cf66'}}></span>
            <span>Under $1,400</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{background: '#ffd93d'}}></span>
            <span>$1,400 - $1,800</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{background: '#ff922b'}}></span>
            <span>$1,800 - $2,200</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{background: '#ff6b6b'}}></span>
            <span>Over $2,200</span>
          </div>
        </div>
      </div>

      <div className="neighborhoods-grid">
        {filteredData.map((item, index) => (
          <div 
            key={index} 
            className="neighborhood-card"
            style={{ borderLeft: `5px solid ${getRentColor(item.avgRent)}` }}
          >
            <div className="neighborhood-header">
              <div>
                <h3>{item.neighborhood}</h3>
                <p className="city-name">{item.city}, {item.province}</p>
              </div>
              <div className="affordability-badge" style={{ background: getRentColor(item.avgRent) }}>
                {getAffordabilityLabel(item.avgRent)}
              </div>
            </div>
            
            <div className="rent-price">
              <span className="price-label">Average Rent</span>
              <span className="price-value">${item.avgRent}/mo</span>
            </div>

            <div className="neighborhood-details">
              <div className="detail">
                <span className="detail-icon">🛏️</span>
                <span>{item.bedrooms} Bedroom</span>
              </div>
              <div className="detail">
                <span className="detail-icon">📍</span>
                <span>{item.province}</span>
              </div>
            </div>

            <button className="view-details-btn">View Details</button>
          </div>
        ))}
      </div>

      {filteredData.length === 0 && (
        <div className="no-results">
          <h3>No neighborhoods found</h3>
          <p>Try adjusting your filters</p>
        </div>
      )}

      <style>{`
        .rent-map-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .rent-map-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 30px;
        }

        .rent-map-header h2 {
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

        .filters-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
          background: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .filter-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
          font-size: 0.9rem;
        }

        .filter-group select {
          width: 100%;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: border-color 0.3s ease;
        }

        .filter-group select:focus {
          outline: none;
          border-color: #9b59b6;
        }

        .stats-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-box {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 25px;
          border-radius: 12px;
          text-align: center;
        }

        .stat-box h3 {
          margin: 0 0 5px 0;
          font-size: 2rem;
        }

        .stat-box p {
          margin: 0;
          opacity: 0.9;
          font-size: 0.9rem;
        }

        .rent-legend {
          background: white;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 30px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .rent-legend h4 {
          margin: 0 0 15px 0;
          font-size: 1.1rem;
        }

        .legend-items {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .legend-color {
          width: 30px;
          height: 20px;
          border-radius: 4px;
        }

        .neighborhoods-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .neighborhood-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .neighborhood-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }

        .neighborhood-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
        }

        .neighborhood-card h3 {
          margin: 0 0 5px 0;
          font-size: 1.3rem;
          color: #333;
        }

        .city-name {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
        }

        .affordability-badge {
          padding: 6px 12px;
          border-radius: 20px;
          color: white;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .rent-price {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
          margin-bottom: 15px;
        }

        .price-label {
          color: #666;
          font-size: 0.9rem;
        }

        .price-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #333;
        }

        .neighborhood-details {
          display: flex;
          gap: 15px;
          margin-bottom: 15px;
        }

        .detail {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #666;
          font-size: 0.9rem;
        }

        .detail-icon {
          font-size: 1.2rem;
        }

        .view-details-btn {
          width: 100%;
          padding: 12px;
          background: #9b59b6;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .view-details-btn:hover {
          background: #8e44ad;
        }

        .no-results {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 12px;
        }

        .no-results h3 {
          margin: 0 0 10px 0;
          font-size: 1.5rem;
          color: #333;
        }

        .no-results p {
          margin: 0;
          color: #666;
        }

        @media (max-width: 768px) {
          .rent-map-header h2 {
            font-size: 1.5rem;
          }

          .filters-container {
            grid-template-columns: 1fr;
          }

          .stats-overview {
            grid-template-columns: repeat(2, 1fr);
          }

          .neighborhoods-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default RentMap;
