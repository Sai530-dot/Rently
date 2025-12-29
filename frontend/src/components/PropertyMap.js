import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css'; 

const GEOAPIFY_KEY = process.env.REACT_APP_GEOAPIFY_API_KEY;

// 1. CHANGE THIS: We switch to 'osm-bright' to get the color data back
// (We will tame the colors with CSS below)
const MAP_STYLE = `https://maps.geoapify.com/v1/styles/osm-bright/style.json?apiKey=${GEOAPIFY_KEY}`;

const CITY_SAFE_ZONES = {
  'Toronto': { lat: 43.7000, lon: -79.4000, spreadLat: 0.06, spreadLon: 0.10 },
  'Vancouver': { lat: 49.2500, lon: -123.1000, spreadLat: 0.04, spreadLon: 0.06 },
  'Montreal': { lat: 45.5200, lon: -73.5800, spreadLat: 0.06, spreadLon: 0.06 },
  'Saskatoon': { lat: 52.1332, lon: -106.6700, spreadLat: 0.05, spreadLon: 0.05 },
  'Default': { lat: 43.6532, lon: -79.3832, spreadLat: 0.05, spreadLon: 0.05 }
};

const PropertyMap = ({ properties, selectedPropertyId, onMarkerClick, onMapClick }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef({}); 
  const activePopupRef = useRef(null); 
  const [geocodedProperties, setGeocodedProperties] = useState([]);

  // --- 1. Coordinate Processing ---
  useEffect(() => {
    const processCoordinates = () => {
      const occupiedSpots = new Set();
      const tasks = properties.map((p) => {
        let lat, lon;
        if (p.lat && p.lon) {
            lat = parseFloat(p.lat);
            lon = parseFloat(p.lon);
        } else {
            const text = (p.address + " " + (p.province || '')).toLowerCase();
            let cityKey = 'Default';
            if (text.includes('toronto') || text.includes('on')) cityKey = 'Toronto';
            else if (text.includes('vancouver') || text.includes('bc')) cityKey = 'Vancouver';
            else if (text.includes('montreal') || text.includes('qc')) cityKey = 'Montreal';
            else if (text.includes('saskatoon') || text.includes('sk')) cityKey = 'Saskatoon';
            
            const zone = CITY_SAFE_ZONES[cityKey];
            const seed = (p.address || p.title).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            
            const pseudoRandom1 = Math.sin(seed) * 10000 - Math.floor(Math.sin(seed) * 10000);
            const pseudoRandom2 = Math.cos(seed) * 10000 - Math.floor(Math.cos(seed) * 10000);
            
            lat = zone.lat + (pseudoRandom1 - 0.5) * zone.spreadLat;
            lon = zone.lon + (pseudoRandom2 - 0.5) * zone.spreadLon;
        }

        let posKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
        let attempts = 0;
        while (occupiedSpots.has(posKey) && attempts < 10) {
            lat += (Math.random() - 0.5) * 0.0005; 
            lon += (Math.random() - 0.5) * 0.0005;
            posKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
            attempts++;
        }
        occupiedSpots.add(posKey);
        return { ...p, lat, lon };
      });
      setGeocodedProperties(tasks);
    };
    processCoordinates();
  }, [properties]);

  // --- 2. Initialize 3D Map ---
  useEffect(() => {
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [-79.4000, 43.7000], 
      zoom: 14, 
      pitch: 55, 
      bearing: -10, 
      antialias: true
    });

    map.current.addControl(new maplibregl.NavigationControl({
        visualizePitch: true,
        showCompass: true,
        showZoom: true
    }), 'top-right');

    map.current.on('load', () => {
      const layers = map.current.getStyle().layers;
      let labelLayerId;
      for (let i = 0; i < layers.length; i++) {
        if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
          labelLayerId = layers[i].id;
          break;
        }
      }

      if (!map.current.getLayer('3d-buildings')) {
        map.current.addLayer(
          {
            'id': '3d-buildings',
            'source': 'osm',
            'source-layer': 'building',
            'filter': ['==', 'extrude', 'true'],
            'type': 'fill-extrusion',
            'minzoom': 13,
            'paint': {
              'fill-extrusion-color': '#d1d5db', 
              'fill-extrusion-height': ['get', 'render_height'],
              'fill-extrusion-base': ['get', 'render_min_height'],
              'fill-extrusion-opacity': 0.7
            }
          },
          labelLayerId
        );
      }
    });

    map.current.on('click', (e) => {
      if (e.originalEvent.target.closest('.price-marker')) return;
      if (onMapClick) onMapClick();
    });

  }, []);

  // --- 3. Sync Markers ---
  useEffect(() => {
    if (!map.current) return;

    Object.keys(markersRef.current).forEach((id) => {
      if (!geocodedProperties.find(p => p.id === id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    if (activePopupRef.current) {
      activePopupRef.current.remove();
      activePopupRef.current = null;
    }

    const getPriceColor = (price) => {
      if (price < 1600) return '#059669'; 
      if (price < 2400) return '#3b82f6'; 
      return '#7c3aed';                   
    };

    geocodedProperties.forEach((prop) => {
      const isSelected = selectedPropertyId === prop.id;
      const baseColor = getPriceColor(prop.rent);

      if (markersRef.current[prop.id]) {
        const markerInst = markersRef.current[prop.id];
        const el = markerInst.getElement();
        el.style.zIndex = isSelected ? '1000' : '10';
        const innerDiv = el.querySelector('div');
        if (innerDiv) {
            innerDiv.style.backgroundColor = isSelected ? '#0f172a' : baseColor;
            innerDiv.style.color = 'white'; 
            innerDiv.style.border = isSelected ? 'none' : '2px solid white';
            innerDiv.style.transform = isSelected ? 'scale(1.2)' : 'scale(1)';
            innerDiv.style.boxShadow = isSelected 
                ? '0 10px 15px -3px rgba(0, 0, 0, 0.3)' 
                : '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        }
      } else {
        const el = document.createElement('div');
        el.className = 'price-marker';
        
        el.innerHTML = `
          <div style="
            background-color: ${baseColor};
            color: white;
            padding: 6px 10px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 13px;
            border: 2px solid white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          ">
            $${prop.rent}
          </div>
        `;

        el.addEventListener('click', (e) => {
          e.stopPropagation(); 
          onMarkerClick(prop.id);
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([prop.lon, prop.lat])
          .addTo(map.current);

        markersRef.current[prop.id] = marker;
      }

      if (isSelected) {
        const popupHTML = `
          <div style="width: 200px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="
              height: 120px; 
              background-image: url('${prop.image && prop.image.startsWith('http') ? prop.image : ''}'); 
              background-size: cover; 
              background-position: center;
              border-radius: 8px; 
              margin-bottom: 8px; 
              background-color: #eee;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              ${!prop.image || !prop.image.startsWith('http') ? '<span style="font-size:24px;">🏠</span>' : ''}
            </div>
            <h4 style="margin: 0 0 4px 0; font-size: 14px; color: #333; line-height:1.2;">${prop.title}</h4>
            <p style="margin: 0; font-size: 12px; color: #666;">${prop.bedrooms} Bed • <strong>$${prop.rent}</strong></p>
          </div>
        `;

        const popup = new maplibregl.Popup({ 
            offset: 20, 
            closeButton: false, 
            closeOnClick: false,
            className: 'pro-popup'
        })
          .setLngLat([prop.lon, prop.lat])
          .setHTML(popupHTML)
          .addTo(map.current);
        
        activePopupRef.current = popup;
      }
    });

  }, [geocodedProperties, selectedPropertyId]);

  // --- 4. Fly To Logic (Same as before) ---
  useEffect(() => {
    if (!map.current || !selectedPropertyId) return;
    const target = geocodedProperties.find(p => p.id === selectedPropertyId);
    if (target) {
      map.current.flyTo({
        center: [target.lon, target.lat],
        zoom: 16,
        pitch: 55, 
        speed: 1.5,
        essential: true
      });
    } else if (geocodedProperties.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        let hasValidCoords = false;
        geocodedProperties.forEach(p => {
            if(!isNaN(p.lon) && !isNaN(p.lat)) {
                bounds.extend([p.lon, p.lat]);
                hasValidCoords = true;
            }
        });
        if (hasValidCoords && !bounds.isEmpty()) {
            map.current.fitBounds(bounds, { padding: 80, maxZoom: 14 });
        }
    }
  }, [selectedPropertyId, geocodedProperties]);

  return (
    <>
      <style>{`
        /* 2. THE SECRET SAUCE: Map Filter */
        /* This targets the map tiles ONLY and desaturates them */
        .maplibregl-canvas {
          filter: saturate(0.2) contrast(1.1); 
        }

        /* Override default MapLibre Popup Styles */
        .maplibregl-popup-content {
          padding: 12px;
          border-radius: 16px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          border: none;
        }
        .maplibregl-popup-tip {
          border-top-color: white !important;
        }
      `}</style>
      <div ref={mapContainer} style={{ height: '100%', width: '100%', background: '#f1f5f9', overflow: 'hidden' }} />
    </>
  );
};

export default PropertyMap;