import React, { useEffect, useRef, useState } from 'react';

// Safe Zones from before...
const CITY_SAFE_ZONES = {
  'Toronto': { lat: 43.7000, lon: -79.4000, spreadLat: 0.06, spreadLon: 0.10 },
  'Vancouver': { lat: 49.2500, lon: -123.1000, spreadLat: 0.04, spreadLon: 0.06 },
  'Montreal': { lat: 45.5200, lon: -73.5800, spreadLat: 0.06, spreadLon: 0.06 },
  'Saskatoon': { lat: 52.1332, lon: -106.6700, spreadLat: 0.05, spreadLon: 0.05 },
  'Default': { lat: 43.6532, lon: -79.3832, spreadLat: 0.05, spreadLon: 0.05 }
};

const PropertyMap = ({ properties, selectedPropertyId, onMarkerClick, onMapClick }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [geocodedProperties, setGeocodedProperties] = useState([]);

  // Load Leaflet (Same as before)
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initMap;
      document.body.appendChild(script);
    } else {
      initMap();
    }
  }, []);

  // Geocoding Logic (Same as before)
  useEffect(() => {
    const geocodeData = async () => {
      const cache = JSON.parse(localStorage.getItem('rently_geo_cache') || '{}');
      const tasks = properties.map(async (p) => {
        if (p.lat && p.lon) return p;
        const addressKey = p.address || p.title;
        if (cache[addressKey]) return { ...p, ...cache[addressKey] };

        // Fallback Logic
        const text = (p.address + " " + (p.province || '')).toLowerCase();
        let cityKey = 'Default';
        if (text.includes('toronto') || text.includes('on')) cityKey = 'Toronto';
        else if (text.includes('vancouver') || text.includes('bc')) cityKey = 'Vancouver';
        else if (text.includes('montreal') || text.includes('qc')) cityKey = 'Montreal';
        else if (text.includes('saskatoon') || text.includes('sk')) cityKey = 'Saskatoon';
        
        const zone = CITY_SAFE_ZONES[cityKey];
        const seed = addressKey.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const pseudoRandom1 = Math.sin(seed) * 10000 - Math.floor(Math.sin(seed) * 10000);
        const pseudoRandom2 = Math.cos(seed) * 10000 - Math.floor(Math.cos(seed) * 10000);

        return { 
          ...p, 
          lat: zone.lat + (pseudoRandom1 - 0.5) * zone.spreadLat, 
          lon: zone.lon + (pseudoRandom2 - 0.5) * zone.spreadLon 
        };
      });
      const results = await Promise.all(tasks);
      setGeocodedProperties(results.filter(p => p.lat && p.lon));
    };
    geocodeData();
  }, [properties]);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;
    updateMarkers();
  }, [geocodedProperties, selectedPropertyId]);

  const initMap = () => {
    if (mapInstanceRef.current) return;
    const map = window.L.map(mapRef.current, {
      center: [43.70, -79.40],
      zoom: 12,
      zoomControl: false
    });

    window.L.control.zoom({ position: 'topleft' }).addTo(map);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // CLICK HANDLER: Deselect when clicking map background
    map.on('click', (e) => {
      if (onMapClick) onMapClick();
    });

    mapInstanceRef.current = map;
    updateMarkers();
  };

  const updateMarkers = () => {
    const map = mapInstanceRef.current;
    const L = window.L;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const bounds = [];

    geocodedProperties.forEach(prop => {
      const isSelected = selectedPropertyId === prop.id;
      
      const iconHtml = `
        <div style="
          background-color: ${isSelected ? '#333' : '#fd5068'};
          color: white;
          padding: 6px 10px;
          border-radius: 12px;
          font-weight: bold;
          font-size: 14px;
          border: 2px solid white;
          box-shadow: 0 3px 8px rgba(0,0,0,0.3);
          white-space: nowrap;
          transform: translate(-50%, -50%);
          z-index: ${isSelected ? 1000 : 100};
          cursor: pointer;
          transition: all 0.2s;
        ">
          $${prop.rent}
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-price-marker',
        iconSize: [60, 30],
        iconAnchor: [30, 15] 
      });

      const marker = L.marker([prop.lat, prop.lon], { icon: customIcon })
        .addTo(map)
        .on('click', (e) => {
          L.DomEvent.stopPropagation(e); // Prevent map click from firing
          onMarkerClick(prop.id);
          marker.openPopup();
        });

      const popupContent = `
        <div style="width: 220px;">
          <div style="height: 140px; background-image: url('${prop.image.startsWith('http') ? prop.image : ''}'); background-size: cover; border-radius: 8px; margin-bottom: 10px; background-color: #eee;">
            ${!prop.image.startsWith('http') ? '<div style="display:flex;height:100%;align-items:center;justify-content:center;font-size:30px;">' + prop.image + '</div>' : ''}
          </div>
          <h4 style="margin:0 0 5px 0;">${prop.title}</h4>
          <p style="margin:0;color:#666;">${prop.bedrooms} Bed • $${prop.rent}</p>
        </div>
      `;
      
      marker.bindPopup(popupContent, { offset: [0, -20] });
      markersRef.current.push(marker);
      bounds.push([prop.lat, prop.lon]);
      
      if (isSelected) setTimeout(() => marker.openPopup(), 100);
    });

    // Smart Fitting:
    // If NO property is selected, fit bounds to show all markers
    if (!selectedPropertyId && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } 
    // If a property IS selected, pan to it (handled by click) but don't force bounds
  };

  return <div ref={mapRef} style={{ height: '100%', width: '100%', background: '#e5e3df' }} />;
};

export default PropertyMap;