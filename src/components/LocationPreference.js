import React, { useState, useEffect, useRef } from 'react';

const LocationPreference = ({ onNext, userPreferences, setUserPreferences }) => {
  const [inputValue, setInputValue] = useState(userPreferences.location?.formatted || '');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(userPreferences.location || null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const apiKey = process.env.REACT_APP_GEOAPIFY_API_KEY;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputValue.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(inputValue)}&apiKey=${apiKey}&limit=5`
        );
        const data = await response.json();

        if (data.features && data.features.length > 0) {
          setSuggestions(data.features);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [inputValue, apiKey]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setSelectedLocation(null);
  };

  const handleSuggestionClick = (suggestion) => {
    const location = {
      formatted: suggestion.properties.formatted,
      address_line1: suggestion.properties.address_line1,
      address_line2: suggestion.properties.address_line2,
      city: suggestion.properties.city,
      state: suggestion.properties.state,
      country: suggestion.properties.country,
      lat: suggestion.geometry.coordinates[1],
      lon: suggestion.geometry.coordinates[0],
      place_id: suggestion.properties.place_id
    };
    
    setSelectedLocation(location);
    setInputValue(suggestion.properties.formatted);
    setShowSuggestions(false);
  };

  const handleContinue = () => {
    if (selectedLocation) {
      setUserPreferences({ ...userPreferences, location: selectedLocation });
      onNext();
    }
  };

  return (
    <div className="preferences-content">
      <div className="logo">
        <h1>Reelty</h1>
        <p>Find Your Perfect Roommate</p>
      </div>

      <div className="preferences-form">
        <div className="form-group" style={{ position: 'relative' }}>
          <label>Where would you like to live?</label>
          
          <div style={{ position: 'relative' }}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => inputValue.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Enter an address or city..."
              className="form-select"
              style={{ 
                paddingRight: isLoading ? '45px' : '20px',
                width: '100%'
              }}
            />
            {isLoading && (
              <div style={{
                position: 'absolute',
                right: '15px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '20px',
                height: '20px',
                border: '2px solid var(--border-gray)',
                borderTop: '2px solid var(--tinder-red)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            )}
          </div>

          {/* Autocomplete Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div 
              ref={suggestionsRef}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '5px',
                backgroundColor: 'var(--white)',
                border: '2px solid var(--border-gray)',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                zIndex: 1000,
                maxHeight: '300px',
                overflowY: 'auto'
              }}
            >
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.properties.place_id || index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  style={{
                    padding: '15px 20px',
                    cursor: 'pointer',
                    borderBottom: index < suggestions.length - 1 ? '1px solid var(--border-gray)' : 'none',
                    transition: 'background-color 0.2s ease',
                    backgroundColor: 'var(--white)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'var(--light-gray)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'var(--white)';
                  }}
                >
                  <div style={{
                    fontWeight: 600,
                    color: 'var(--dark-gray)',
                    marginBottom: '4px',
                    fontSize: '0.95rem'
                  }}>
                    {suggestion.properties.address_line1 || suggestion.properties.formatted}
                  </div>
                  {suggestion.properties.address_line2 && (
                    <div style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-gray)'
                    }}>
                      {suggestion.properties.address_line2}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Map Preview */}
          {selectedLocation && (
            <div style={{ 
              marginTop: '20px',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '2px solid var(--border-gray)',
              backgroundColor: 'var(--light-gray)'
            }}>
              <div style={{
                padding: '15px',
                backgroundColor: 'var(--light-gray)',
                borderBottom: '2px solid var(--border-gray)',
                fontWeight: 600,
                color: 'var(--dark-gray)',
                fontSize: '0.9rem'
              }}>
                📍 Location Preview
              </div>
              <iframe
                width="100%"
                height="250"
                style={{ border: 0, display: 'block' }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedLocation.lon - 0.01},${selectedLocation.lat - 0.01},${selectedLocation.lon + 0.01},${selectedLocation.lat + 0.01}&layer=mapnik&marker=${selectedLocation.lat},${selectedLocation.lon}`}
                title="Location preview"
              />
              <div style={{
                padding: '10px 15px',
                fontSize: '0.8rem',
                color: 'var(--text-gray)',
                backgroundColor: 'var(--light-gray)'
              }}>
                {selectedLocation.formatted}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleContinue}
          disabled={!selectedLocation}
          className="continue-button"
        >
          Continue
        </button>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: translateY(-50%) rotate(0deg); }
          100% { transform: translateY(-50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LocationPreference;

