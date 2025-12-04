import React, { useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE_URL } from '../config';
import realListings from '../data/real_listings.json';
import craigslistData from '../data/craigslist_listings.json';
import kijijiData from '../data/kijiji_listings.json';

const FALLBACK_LISTINGS = [...craigslistData, ...kijijiData, ...realListings];
const API_ENDPOINT = `${API_BASE_URL}/properties`;
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
    neighborhood: item.neighborhood || item.title || deriveCity(address) || 'Listing',
    city: item.city || deriveCity(address),
    province: item.province || deriveProvince(address),
    bedrooms: item.bedrooms || 1,
    sqft: item.sqft || item.size || null,
    avgRent: item.avgRent || item.rent || item.price || 0,
    address,
    lat: item.lat,
    lon: item.lon,
  };
};

const RentMapCanada = ({ onBack }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterProvince, setFilterProvince] = useState('All');
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
      console.error('RentMapCanada: backend fetch failed, using fallback.', err);
      setError('Cannot connect to backend server. Showing cached listings.');
    }

    if (!source.length) source = FALLBACK_LISTINGS;

    const normalized = source.map(normalizeProperty);
    const hydrated = await geocodeProperties(normalized);
    const withCoords = hydrated.filter((p) => p.lat && p.lon);
    setProperties(withCoords);
    setLoading(false);
  };

  const geocodeProperties = async (list) => {
    const tasks = list.slice(0, 150).map(async (item) => {
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

  const provinces = useMemo(() => {
    const unique = Array.from(new Set(properties.map((p) => p.province).filter(Boolean)));
    return ['All', ...unique];
  }, [properties]);

  const filteredData = useMemo(
    () => (filterProvince === 'All' ? properties : properties.filter((p) => p.province === filterProvince)),
    [properties, filterProvince]
  );

  const stats = useMemo(() => {
    if (!filteredData.length) return { total: 0, avg: 0, min: 0, max: 0 };
    const rents = filteredData.map((p) => p.avgRent || 0).filter(Boolean);
    const total = rents.length;
    const sum = rents.reduce((acc, val) => acc + val, 0);
    return {
      total: filteredData.length,
      avg: Math.round(sum / total),
      min: Math.min(...rents),
      max: Math.max(...rents),
    };
  }, [filteredData]);

  // Initialize map once data is ready
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
        center: [56.1304, -106.3468],
        zoom: 4,
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
      const marker = L.circleMarker([item.lat, item.lon], {
        radius: 10,
        fillColor: '#7c3aed',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      }).addTo(map);

      marker.bindPopup(
        `<div style="font-family: Arial; min-width: 180px;">
          <strong>${item.title}</strong>
          <div style="color:#555;">${item.address || item.city}</div>
          <div style="margin-top:6px; font-weight:bold;">$${item.avgRent || 'N/A'}/mo</div>
          <div style="color:#777;">${item.bedrooms} BR ${item.sqft ? '· ' + item.sqft + ' sqft' : ''}</div>
        </div>`
      );

      markersRef.current.push(marker);
      bounds.push([item.lat, item.lon]);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  };

  const getRentColor = (rent) => {
    if (rent < 1400) return '#51cf66';
    if (rent < 1800) return '#ffd93d';
    if (rent < 2200) return '#ff922b';
    return '#ff6b6b';
  };

  return (
    <div className="canada-rent-map">
      <div className="map-header">
        <button className="back-btn" onClick={onBack}>
          ◀ Back to Dashboard
        </button>
        <div>
          <h1>Canada Rent Map (Geoapify)</h1>
          <p>Live property points using Geoapify tiles and geocoding</p>
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-label">Properties</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Avg Rent</span>
          <span className="stat-value">${stats.avg}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Lowest</span>
          <span className="stat-value">${stats.min}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Highest</span>
          <span className="stat-value">${stats.max}</span>
        </div>
      </div>

      <div className="filter-section">
        <h3>Filter by Province:</h3>
        <div className="province-buttons">
          {provinces.map((prov) => (
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

      <div className="map-card">
        {loading && (
          <div className="map-loading">
            <div className="spinner" />
            <p>Loading properties and geocoding addresses...</p>
          </div>
        )}
        {!loading && error && <div className="map-error">{error}</div>}
        <div className="leaflet-map" ref={mapRef} />
      </div>

      <div className="properties-grid">
        {filteredData.map((item) => (
          <div key={item.id} className="property-card" style={{ borderLeftColor: getRentColor(item.avgRent) }}>
            <div className="property-top">
              <div>
                <h3>{item.title}</h3>
                <p className="address">
                  {item.city}, {item.province}
                </p>
              </div>
              <div className="rent">${item.avgRent}/mo</div>
            </div>
            <p className="address">{item.address || 'Address unavailable'}</p>
            <div className="meta">
              <span>{item.bedrooms} BR</span>
              {item.sqft && <span>{item.sqft} sqft</span>}
            </div>
          </div>
        ))}

        {!loading && filteredData.length === 0 && (
          <div className="empty-state">
            <h3>No properties for this province</h3>
            <p>Try another filter.</p>
          </div>
        )}
      </div>

      <style>{`
        .canada-rent-map { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .map-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
        .map-header h1 { margin: 0; font-size: 1.8rem; }
        .map-header p { margin: 4px 0 0 0; color: #6B7280; }
        .back-btn { padding: 10px 16px; background: white; border: 2px solid #e5e7eb; border-radius: 8px; cursor: pointer; font-weight: 600; }
        .back-btn:hover { background: #f3f4f6; }
        .stats-bar { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 16px; }
        .stat-item { background: #111827; color: white; padding: 12px; border-radius: 10px; }
        .stat-label { display: block; font-size: 0.85rem; opacity: 0.7; }
        .stat-value { font-size: 1.4rem; font-weight: 700; }
        .filter-section { margin-bottom: 16px; }
        .province-buttons { display: flex; flex-wrap: wrap; gap: 8px; }
        .prov-btn { padding: 10px 12px; border-radius: 8px; border: 1px solid #e5e7eb; background: white; cursor: pointer; }
        .prov-btn.active { background: #7c3aed; color: white; border-color: #7c3aed; }
        .map-card { position: relative; background: white; border-radius: 12px; padding: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom: 18px; min-height: 380px; }
        .leaflet-map { width: 100%; height: 380px; border-radius: 10px; }
        .map-loading, .map-error { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 10px; background: rgba(255,255,255,0.9); z-index: 5; }
        .spinner { width: 48px; height: 48px; border: 4px solid #e5e7eb; border-top-color: #7c3aed; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .properties-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; }
        .property-card { background: white; border-radius: 12px; padding: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border-left: 5px solid #e5e7eb; }
        .property-top { display: flex; justify-content: space-between; gap: 8px; }
        .property-card h3 { margin: 0; font-size: 1rem; }
        .address { margin: 4px 0; color: #6B7280; }
        .rent { font-weight: 700; color: #7c3aed; }
        .meta { display: flex; gap: 10px; color: #4B5563; font-size: 0.9rem; }
        .empty-state { text-align: center; padding: 30px; background: #f9fafb; border-radius: 12px; grid-column: 1 / -1; }
        @media (max-width: 768px) { .leaflet-map { height: 300px; } }
      `}</style>
    </div>
  );
};

export default RentMapCanada;
