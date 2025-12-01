import React, { useEffect, useMemo, useRef, useState } from 'react';
import realListings from '../data/real_listings.json';
import craigslistData from '../data/craigslist_listings.json';
import kijijiData from '../data/kijiji_listings.json';

const FALLBACK_LISTINGS = [...craigslistData, ...kijijiData, ...realListings];
const API_ENDPOINT = 'http://localhost:5000/api/properties';
const GEOAPIFY_KEY = process.env.REACT_APP_GEOAPIFY_API_KEY;

const deriveCity = (address = '') => address.split(',')[0]?.trim() || 'Unknown';
const deriveProvince = (address = '') => {
  const parts = address.split(',').map((p) => p.trim());
  const last = parts[parts.length - 1] || '';
  const match = last.match(/([A-Za-z]{2})$/);
  return match ? match[1].toUpperCase() : '';
};

const normalizeProperty = (item, idx) => {
  const address = item.address || item.location || item.city || item.title || '';
  return {
    id: item.id || idx,
    title: item.title || item.neighborhood || deriveCity(address) || 'Listing',
    address,
    city: item.city || deriveCity(address),
    province: item.province || deriveProvince(address),
    bedrooms: item.bedrooms || 1,
    sqft: item.sqft || item.size || null,
    rent: item.rent || item.avgRent || item.price || 0,
    lat: item.lat,
    lon: item.lon,
  };
};

const RentMap = ({ onBack }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCity, setSelectedCity] = useState('All');
  const [bedroomFilter, setBedroomFilter] = useState('all');
  const [sortBy, setSortBy] = useState('price-low');
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const geocodeCacheRef = useRef({});

  useEffect(() => {
    const cached = localStorage.getItem('rently_geocode_cache');
    if (cached) {
      try {
        geocodeCacheRef.current = JSON.parse(cached);
      } catch {
        geocodeCacheRef.current = {};
      }
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);

    let source = [];
    try {
      const response = await fetch(API_ENDPOINT);
      const data = await response.json();
      source = data?.properties || data?.data || [];
    } catch (err) {
      console.error('RentMap: backend fetch failed, using fallback.', err);
      setError('Cannot connect to backend server. Showing cached listings.');
    }

    if (!source.length) {
      source = FALLBACK_LISTINGS;
    }

    const normalized = source.map(normalizeProperty);
    const hydrated = await geocodeProperties(normalized);
    const withCoords = hydrated.filter((p) => p.lat && p.lon);
    setProperties(withCoords);
    setLoading(false);
  };

  const geocodeProperties = async (list) => {
    const tasks = list.slice(0, 100).map(async (item) => {
      if (item.lat && item.lon) return item;

      const query = item.address || `${item.city || ''} ${item.province || ''}`.trim();
      if (!query || !GEOAPIFY_KEY) return item;

      if (geocodeCacheRef.current[query]) {
        return { ...item, ...geocodeCacheRef.current[query] };
      }

      try {
        const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(query)}&limit=1&apiKey=${GEOAPIFY_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        const feature = data?.features?.[0];
        if (feature?.geometry?.coordinates) {
          const coords = {
            lon: feature.geometry.coordinates[0],
            lat: feature.geometry.coordinates[1],
          };
          geocodeCacheRef.current[query] = coords;
          localStorage.setItem('rently_geocode_cache', JSON.stringify(geocodeCacheRef.current));
          return { ...item, ...coords };
        }
      } catch (err) {
        console.error('Geocoding failed for', query, err);
      }

      return item;
    });

    return Promise.all(tasks);
  };

  const cities = useMemo(() => {
    const unique = Array.from(new Set(properties.map((p) => p.city).filter(Boolean)));
    return ['All', ...unique];
  }, [properties]);

  const filteredData = useMemo(() => {
    const byCity = properties.filter((p) => selectedCity === 'All' || p.city === selectedCity);
    const byBeds =
      bedroomFilter === 'all' ? byCity : byCity.filter((p) => p.bedrooms === parseInt(bedroomFilter, 10));

    const sorted = [...byBeds].sort((a, b) => {
      const priceA = a.rent || 0;
      const priceB = b.rent || 0;
      if (sortBy === 'price-low') return priceA - priceB;
      if (sortBy === 'price-high') return priceB - priceA;
      return (a.city || '').localeCompare(b.city || '');
    });
    return sorted;
  }, [properties, selectedCity, bedroomFilter, sortBy]);

  const stats = useMemo(() => {
    if (!filteredData.length) {
      return { total: 0, min: 0, max: 0, avg: 0 };
    }
    const rents = filteredData.map((p) => p.rent || 0).filter(Boolean);
    const total = rents.length;
    const sum = rents.reduce((acc, val) => acc + val, 0);
    return {
      total: filteredData.length,
      min: Math.min(...rents),
      max: Math.max(...rents),
      avg: Math.round(sum / total),
    };
  }, [filteredData]);

  // Initialize Leaflet map once data is ready
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || loading) return;

    const ensureLeaflet = () =>
      new Promise((resolve) => {
        if (window.L) {
          resolve(window.L);
          return;
        }
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => resolve(window.L);
        document.body.appendChild(script);
      });

    ensureLeaflet().then((L) => {
      if (!L || mapInstanceRef.current) return;
      const map = L.map(mapRef.current, {
        center: [43.65107, -79.347015],
        zoom: 5,
        minZoom: 3,
        maxZoom: 18,
      });

      const tileUrl = GEOAPIFY_KEY
        ? `https://maps.geoapify.com/v1/tile/positron/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_KEY}`
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      const attribution = GEOAPIFY_KEY
        ? 'Map data © OpenStreetMap contributors, Imagery © Geoapify'
        : 'Map data © OpenStreetMap contributors';

      L.tileLayer(tileUrl, { attribution, maxZoom: 20 }).addTo(map);
      mapInstanceRef.current = map;
      updateMarkers(L, map);
    });
  }, [loading]);

  // Update markers when filters or data change
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;
    updateMarkers(window.L, mapInstanceRef.current);
  }, [filteredData]);

  const updateMarkers = (L, map) => {
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const bounds = [];

    filteredData.forEach((item) => {
      if (!item.lat || !item.lon) return;
      const marker = L.marker([item.lat, item.lon]).addTo(map);
      marker.bindPopup(
        `<div style="font-family: Arial; min-width: 180px;">
          <strong>${item.title}</strong>
          <div style="color:#555;">${item.address || item.city}</div>
          <div style="margin-top:6px; font-weight:bold;">$${item.rent || 'N/A'}/mo</div>
        </div>`
      );
      marker.on('click', () => setSelectedNeighborhood(item));
      markersRef.current.push(marker);
      bounds.push([item.lat, item.lon]);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  };

  const getRentColor = (rent) => {
    if (rent < 1400) return '#51cf66';
    if (rent < 1800) return '#ffd93d';
    if (rent < 2200) return '#ff922b';
    return '#ff6b6b';
  };

  return (
    <div className="rent-map-container">
      <div className="rent-map-header">
        <button className="back-btn" onClick={onBack}>
          ◀ Back
        </button>
        <div>
          <h2>Rent Map</h2>
          <p>Live Geoapify map with properties from your feed</p>
        </div>
      </div>

      <div className="filters-container">
        <div className="filter-group">
          <label>City</label>
          <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Bedrooms</label>
          <select value={bedroomFilter} onChange={(e) => setBedroomFilter(e.target.value)}>
            <option value="all">Any</option>
            <option value="0">Studio</option>
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
            <option value="name">City A-Z</option>
          </select>
        </div>
      </div>

      <div className="stats-overview">
        <div className="stat-box">
          <h3>{stats.total}</h3>
          <p>Properties</p>
        </div>
        <div className="stat-box">
          <h3>${stats.min}</h3>
          <p>Lowest Rent</p>
        </div>
        <div className="stat-box">
          <h3>${stats.max}</h3>
          <p>Highest Rent</p>
        </div>
        <div className="stat-box">
          <h3>${stats.avg}</h3>
          <p>Average Rent</p>
        </div>
      </div>

      <div className="map-card">
        {loading && (
          <div className="map-loading">
            <div className="loading-spinner" />
            <p>Loading properties and geocoding addresses...</p>
          </div>
        )}
        {!loading && error && <div className="map-error">{error}</div>}
        <div className="leaflet-map" ref={mapRef} />
      </div>

      <div className="properties-grid">
        {filteredData.map((item) => (
          <div key={item.id} className="property-card" style={{ borderLeftColor: getRentColor(item.rent) }}>
            <div className="property-card-header">
              <h3>{item.title}</h3>
              <div className="rent">${item.rent}/mo</div>
            </div>
            <p className="address">{item.address || item.city}</p>
            <div className="meta">
              <span>{item.bedrooms} BR</span>
              {item.province && <span>{item.province}</span>}
              {item.sqft && <span>{item.sqft} sqft</span>}
            </div>
          </div>
        ))}

        {!loading && filteredData.length === 0 && (
          <div className="empty-state">
            <h3>No properties match this filter</h3>
            <p>Try switching city or bedrooms.</p>
          </div>
        )}
      </div>

      <style>{`
        .rent-map-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        .rent-map-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }
        .rent-map-header h2 { margin: 0; }
        .rent-map-header p { margin: 4px 0 0 0; color: #6B7280; }
        .back-btn {
          padding: 10px 16px;
          background: white;
          border: 2px solid #ddd;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }
        .back-btn:hover { background: #f5f5f5; }
        .filters-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
          background: white;
          padding: 16px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .filter-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 600;
          color: #374151;
        }
        .filter-group select {
          width: 100%;
          padding: 10px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
        }
        .stats-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }
        .stat-box {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px;
          border-radius: 12px;
          text-align: center;
        }
        .stat-box h3 { margin: 0; }
        .stat-box p { margin: 4px 0 0 0; opacity: 0.9; }
        .map-card {
          background: white;
          border-radius: 12px;
          padding: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          margin-bottom: 20px;
          position: relative;
          min-height: 360px;
        }
        .leaflet-map {
          width: 100%;
          height: 360px;
          border-radius: 10px;
        }
        .map-loading, .map-error {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 10px;
          background: rgba(255,255,255,0.9);
          z-index: 5;
        }
        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #e5e7eb;
          border-top-color: #7c3aed;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .properties-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
        }
        .property-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          border-left: 5px solid #e5e7eb;
        }
        .property-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .property-card h3 { margin: 0; font-size: 1rem; }
        .rent { font-weight: 700; color: #7c3aed; }
        .address { margin: 6px 0; color: #6B7280; }
        .meta { display: flex; gap: 10px; color: #4B5563; font-size: 0.9rem; }
        .empty-state { text-align: center; padding: 30px; background: #f9fafb; border-radius: 12px; }
        @media (max-width: 768px) {
          .leaflet-map { height: 280px; }
        }
      `}</style>
    </div>
  );
};

export default RentMap;
