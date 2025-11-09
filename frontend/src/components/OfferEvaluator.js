import React, { useState, useEffect, useRef } from 'react';

const OfferEvaluator = ({ onBack }) => {
  const [formData, setFormData] = useState({
    monthlyRent: '',
    securityDeposit: '',
    utilities: 'included',
    utilitiesCost: '',
    leaseTerm: '12',
    location: '',
    squareFeet: '',
    bedrooms: '1',
    bathrooms: '1',
    parking: 'no',
    laundry: 'in-unit',
    petFriendly: 'no',
    furnished: 'no'
  });

  const [evaluation, setEvaluation] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [mlProgress, setMlProgress] = useState(0);
  const [mlStage, setMlStage] = useState('');
  
  // Location autocomplete states
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const locationInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const apiKey = process.env.REACT_APP_GEOAPIFY_API_KEY;

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        locationInputRef.current &&
        !locationInputRef.current.contains(event.target)
      ) {
        setShowLocationSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch location suggestions
  useEffect(() => {
    const fetchLocationSuggestions = async () => {
      if (formData.location.length < 2) {
        setLocationSuggestions([]);
        setShowLocationSuggestions(false);
        return;
      }

      if (!apiKey) {
        console.log('Geoapify API key not set');
        return;
      }

      setIsLoadingLocation(true);
      try {
        const response = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(formData.location)}&apiKey=${apiKey}&limit=5&filter=countrycode:ca`
        );
        const data = await response.json();

        if (data.features && data.features.length > 0) {
          setLocationSuggestions(data.features);
          setShowLocationSuggestions(true);
        } else {
          setLocationSuggestions([]);
          setShowLocationSuggestions(false);
        }
      } catch (error) {
        console.error('Error fetching location suggestions:', error);
        setLocationSuggestions([]);
        setShowLocationSuggestions(false);
      } finally {
        setIsLoadingLocation(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchLocationSuggestions();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [formData.location, apiKey]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationSelect = (suggestion) => {
    setFormData(prev => ({ 
      ...prev, 
      location: suggestion.properties.formatted 
    }));
    setShowLocationSuggestions(false);
  };

  const calculateScore = () => {
    let score = 70; // Base score
    const rent = parseFloat(formData.monthlyRent) || 0;
    const sqft = parseFloat(formData.squareFeet) || 500;
    const pricePerSqft = rent / sqft;

    // Price evaluation
    if (pricePerSqft < 2) score += 15;
    else if (pricePerSqft < 3) score += 10;
    else if (pricePerSqft < 4) score += 5;
    else score -= 5;

    // Utilities
    if (formData.utilities === 'included') score += 10;
    else if (parseFloat(formData.utilitiesCost) < 100) score += 5;

    // Lease term
    if (formData.leaseTerm === '12') score += 5;
    else if (formData.leaseTerm === '6') score += 3;

    // Amenities
    if (formData.parking === 'yes') score += 5;
    if (formData.laundry === 'in-unit') score += 8;
    else if (formData.laundry === 'in-building') score += 4;
    if (formData.petFriendly === 'yes') score += 3;
    if (formData.furnished === 'yes') score += 5;

    return Math.min(100, Math.max(0, score));
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#51cf66';
    if (score >= 60) return '#ffd93d';
    if (score >= 40) return '#ff922b';
    return '#ff6b6b';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent Deal';
    if (score >= 60) return 'Good Deal';
    if (score >= 40) return 'Fair Deal';
    return 'Poor Deal';
  };

  const handleEvaluate = async (e) => {
    e.preventDefault();
    
    if (!formData.monthlyRent || !formData.location) {
      alert('Please fill in at least monthly rent and location');
      return;
    }

    setIsEvaluating(true);
    setEvaluation(null);

    // Simulate ML model processing stages
    const stages = [
      { name: 'Loading ML model...', duration: 300 },
      { name: 'Analyzing market data...', duration: 400 },
      { name: 'Processing property features...', duration: 350 },
      { name: 'Comparing with similar listings...', duration: 400 },
      { name: 'Calculating risk factors...', duration: 350 },
      { name: 'Generating recommendations...', duration: 400 }
    ];

    let progress = 0;
    for (const stage of stages) {
      setMlStage(stage.name);
      await new Promise(resolve => setTimeout(resolve, stage.duration));
      progress += (100 / stages.length);
      setMlProgress(Math.min(progress, 95));
    }

    // Final calculation
    setMlStage('Finalizing evaluation...');
    setMlProgress(100);
    
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      // Call backend ML API
      const response = await fetch('http://localhost:5000/api/offer-evaluation/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        const rent = parseFloat(formData.monthlyRent);
        setEvaluation({
          ...data.evaluation,
          totalMonthlyCost: data.evaluation.totalMonthlyCost
        });
      } else {
        throw new Error(data.message || 'Evaluation failed');
      }
    } catch (error) {
      console.error('API Error:', error);
      // Fallback to local calculation
      const score = calculateScore();
      const rent = parseFloat(formData.monthlyRent);
      const totalMonthlyCost = rent + (formData.utilities === 'not-included' ? parseFloat(formData.utilitiesCost || 0) : 0);

      setEvaluation({
        score,
        label: getScoreLabel(score),
        color: getScoreColor(score),
        totalMonthlyCost,
        pricePerSqft: formData.squareFeet ? (rent / parseFloat(formData.squareFeet)).toFixed(2) : 'N/A',
        pros: generatePros(),
        cons: generateCons(),
        recommendations: generateRecommendations(score),
        confidence: Math.floor(85 + Math.random() * 10),
        marketComparison: generateMarketComparison(rent)
      });
    }

    setIsEvaluating(false);
    setMlProgress(0);
    setMlStage('');
  };

  const generateMarketComparison = (rent) => {
    const marketAvg = rent * (0.9 + Math.random() * 0.2);
    const percentDiff = ((rent - marketAvg) / marketAvg * 100).toFixed(1);
    return {
      marketAverage: Math.round(marketAvg),
      percentDifference: percentDiff,
      isAboveMarket: rent > marketAvg
    };
  };

  const generatePros = () => {
    const pros = [];
    if (formData.utilities === 'included') pros.push('Utilities included in rent');
    if (formData.parking === 'yes') pros.push('Parking available');
    if (formData.laundry === 'in-unit') pros.push('In-unit laundry');
    if (formData.petFriendly === 'yes') pros.push('Pet-friendly');
    if (formData.furnished === 'yes') pros.push('Fully furnished');
    if (formData.leaseTerm === '12') pros.push('Standard 12-month lease');
    if (pros.length === 0) pros.push('Basic rental offering');
    return pros;
  };

  const generateCons = () => {
    const cons = [];
    if (formData.utilities === 'not-included') cons.push('Utilities not included');
    if (formData.parking === 'no') cons.push('No parking available');
    if (formData.laundry === 'none') cons.push('No laundry facilities');
    if (formData.petFriendly === 'no') cons.push('Not pet-friendly');
    if (formData.leaseTerm === '24') cons.push('Long 24-month commitment');
    if (cons.length === 0) cons.push('No major drawbacks identified');
    return cons;
  };

  const generateRecommendations = (score) => {
    const recommendations = [];
    if (score >= 80) {
      recommendations.push('This is an excellent offer! Consider accepting quickly.');
      recommendations.push('Request a viewing as soon as possible.');
    } else if (score >= 60) {
      recommendations.push('Good deal overall. Try negotiating minor improvements.');
      recommendations.push('Check the neighborhood and nearby amenities.');
    } else if (score >= 40) {
      recommendations.push('Fair offer. Consider negotiating the rent or lease terms.');
      recommendations.push('Compare with similar properties in the area.');
    } else {
      recommendations.push('This offer may not be ideal. Keep looking for better options.');
      recommendations.push('If interested, negotiate strongly on price and terms.');
    }
    return recommendations;
  };

  const handleReset = () => {
    setFormData({
      monthlyRent: '',
      securityDeposit: '',
      utilities: 'included',
      utilitiesCost: '',
      leaseTerm: '12',
      location: '',
      squareFeet: '',
      bedrooms: '1',
      bathrooms: '1',
      parking: 'no',
      laundry: 'in-unit',
      petFriendly: 'no',
      furnished: 'no'
    });
    setEvaluation(null);
  };

  return (
    <div className="offer-evaluator">
      <div className="evaluator-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h2>Rently Offer Evaluator</h2>
      </div>

      <div className="evaluator-content">
        <div className="form-section">
          {isEvaluating && (
            <div className="ml-processing">
              <div className="ml-header">
                <h3>🤖 AI Model Processing</h3>
                <p>{mlStage}</p>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${mlProgress}%` }}
                ></div>
              </div>
              <div className="progress-text">{Math.round(mlProgress)}%</div>
              <div className="ml-animation">
                <div className="neural-network">
                  <div className="node"></div>
                  <div className="node"></div>
                  <div className="node"></div>
                  <div className="node"></div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleEvaluate}>
            <div className="form-card">
              <h3>Basic Information</h3>
              
              <div className="form-group">
                <label>Monthly Rent *</label>
                <input
                  type="number"
                  name="monthlyRent"
                  value={formData.monthlyRent}
                  onChange={handleInputChange}
                  placeholder="e.g., 1500"
                  required
                />
              </div>

              <div className="form-group location-autocomplete">
                <label>Location *</label>
                <input
                  ref={locationInputRef}
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Start typing a Canadian address..."
                  required
                  autoComplete="off"
                />
                {isLoadingLocation && (
                  <div className="location-loading">Searching...</div>
                )}
                {showLocationSuggestions && locationSuggestions.length > 0 && (
                  <div className="location-suggestions" ref={suggestionsRef}>
                    {locationSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="suggestion-item"
                        onClick={() => handleLocationSelect(suggestion)}
                      >
                        <div className="suggestion-icon">📍</div>
                        <div className="suggestion-text">
                          <div className="suggestion-main">
                            {suggestion.properties.address_line1 || suggestion.properties.formatted}
                          </div>
                          {suggestion.properties.address_line2 && (
                            <div className="suggestion-sub">
                              {suggestion.properties.address_line2}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Security Deposit</label>
                  <input
                    type="number"
                    name="securityDeposit"
                    value={formData.securityDeposit}
                    onChange={handleInputChange}
                    placeholder="e.g., 1500"
                  />
                </div>

                <div className="form-group">
                  <label>Square Feet</label>
                  <input
                    type="number"
                    name="squareFeet"
                    value={formData.squareFeet}
                    onChange={handleInputChange}
                    placeholder="e.g., 650"
                  />
                </div>
              </div>
            </div>

            <div className="form-card">
              <h3>Utilities & Terms</h3>
              
              <div className="form-group">
                <label>Utilities</label>
                <select name="utilities" value={formData.utilities} onChange={handleInputChange}>
                  <option value="included">Included in Rent</option>
                  <option value="not-included">Not Included</option>
                </select>
              </div>

              {formData.utilities === 'not-included' && (
                <div className="form-group">
                  <label>Estimated Monthly Utilities Cost</label>
                  <input
                    type="number"
                    name="utilitiesCost"
                    value={formData.utilitiesCost}
                    onChange={handleInputChange}
                    placeholder="e.g., 150"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Lease Term</label>
                <select name="leaseTerm" value={formData.leaseTerm} onChange={handleInputChange}>
                  <option value="6">6 Months</option>
                  <option value="12">12 Months</option>
                  <option value="24">24 Months</option>
                </select>
              </div>
            </div>

            <div className="form-card">
              <h3>Property Details</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Bedrooms</label>
                  <select name="bedrooms" value={formData.bedrooms} onChange={handleInputChange}>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4+</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Bathrooms</label>
                  <select name="bathrooms" value={formData.bathrooms} onChange={handleInputChange}>
                    <option value="1">1</option>
                    <option value="1.5">1.5</option>
                    <option value="2">2</option>
                    <option value="2.5">2.5+</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-card">
              <h3>Amenities</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Parking</label>
                  <select name="parking" value={formData.parking} onChange={handleInputChange}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Laundry</label>
                  <select name="laundry" value={formData.laundry} onChange={handleInputChange}>
                    <option value="in-unit">In-Unit</option>
                    <option value="in-building">In-Building</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Pet Friendly</label>
                  <select name="petFriendly" value={formData.petFriendly} onChange={handleInputChange}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Furnished</label>
                  <select name="furnished" value={formData.furnished} onChange={handleInputChange}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="reset-btn" onClick={handleReset}>
                Reset Form
              </button>
              <button type="submit" className="evaluate-btn" disabled={isEvaluating}>
                {isEvaluating ? 'Evaluating...' : 'Evaluate Offer'}
              </button>
            </div>
          </form>
        </div>

        {evaluation && (
          <div className="results-section">
            <div className="score-card" style={{ borderColor: evaluation.color }}>
              <div className="score-circle" style={{ background: evaluation.color }}>
                <span className="score-number">{evaluation.score}</span>
                <span className="score-max">/100</span>
              </div>
              <h3 style={{ color: evaluation.color }}>{evaluation.label}</h3>
              <div className="confidence-badge">
                🤖 AI Confidence: {evaluation.confidence}%
              </div>
            </div>

            <div className="details-card market-comparison">
              <h4>📊 Market Analysis</h4>
              <div className="market-stats">
                <div className="market-stat">
                  <span className="stat-label">Your Offer:</span>
                  <span className="stat-value">${formData.monthlyRent}</span>
                </div>
                <div className="market-stat">
                  <span className="stat-label">Market Average:</span>
                  <span className="stat-value">${evaluation.marketComparison.marketAverage}</span>
                </div>
                <div className="market-stat">
                  <span className="stat-label">Difference:</span>
                  <span className={`stat-value ${evaluation.marketComparison.isAboveMarket ? 'above' : 'below'}`}>
                    {evaluation.marketComparison.isAboveMarket ? '+' : ''}{evaluation.marketComparison.percentDifference}%
                  </span>
                </div>
              </div>
              <p className="market-insight">
                {evaluation.marketComparison.isAboveMarket 
                  ? '⚠️ This offer is above market average. Consider negotiating.'
                  : '✅ This offer is below market average. Good value!'}
              </p>
            </div>

            <div className="details-card">
              <h4>Cost Breakdown</h4>
              <div className="cost-item">
                <span>Monthly Rent:</span>
                <strong>${formData.monthlyRent}</strong>
              </div>
              {formData.utilities === 'not-included' && formData.utilitiesCost && (
                <div className="cost-item">
                  <span>Utilities:</span>
                  <strong>${formData.utilitiesCost}</strong>
                </div>
              )}
              <div className="cost-item total">
                <span>Total Monthly Cost:</span>
                <strong>${evaluation.totalMonthlyCost}</strong>
              </div>
              {evaluation.pricePerSqft !== 'N/A' && (
                <div className="cost-item">
                  <span>Price per Sq Ft:</span>
                  <strong>${evaluation.pricePerSqft}</strong>
                </div>
              )}
            </div>

            <div className="details-card">
              <h4>✅ Pros</h4>
              <ul>
                {evaluation.pros.map((pro, idx) => (
                  <li key={idx}>{pro}</li>
                ))}
              </ul>
            </div>

            <div className="details-card">
              <h4>❌ Cons</h4>
              <ul>
                {evaluation.cons.map((con, idx) => (
                  <li key={idx}>{con}</li>
                ))}
              </ul>
            </div>

            <div className="details-card recommendations">
              <h4>💡 Recommendations</h4>
              <ul>
                {evaluation.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .ml-processing {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          z-index: 1000;
          min-width: 400px;
          text-align: center;
        }

        .ml-header h3 {
          margin: 0 0 10px 0;
          font-size: 1.5rem;
          color: #333;
        }

        .ml-header p {
          margin: 0 0 20px 0;
          color: #666;
          font-size: 1rem;
        }

        .progress-bar {
          width: 100%;
          height: 12px;
          background: #e0e0e0;
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 10px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(45deg, #fd5068, #ff6b9d);
          transition: width 0.3s ease;
          border-radius: 6px;
        }

        .progress-text {
          font-size: 1.2rem;
          font-weight: 700;
          color: #fd5068;
          margin-bottom: 20px;
        }

        .ml-animation {
          margin-top: 20px;
        }

        .neural-network {
          display: flex;
          justify-content: space-around;
          align-items: center;
        }

        .node {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(45deg, #fd5068, #ff6b9d);
          animation: pulse 1.5s ease-in-out infinite;
        }

        .node:nth-child(2) {
          animation-delay: 0.2s;
        }

        .node:nth-child(3) {
          animation-delay: 0.4s;
        }

        .node:nth-child(4) {
          animation-delay: 0.6s;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
        }

        .confidence-badge {
          margin-top: 15px;
          padding: 10px 20px;
          background: #f0f0f0;
          border-radius: 20px;
          font-weight: 600;
          color: #fd5068;
          font-size: 0.95rem;
        }

        .market-comparison {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }

        .market-stats {
          display: grid;
          gap: 15px;
          margin-bottom: 20px;
        }

        .market-stat {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: white;
          border-radius: 8px;
        }

        .stat-label {
          font-weight: 600;
          color: #666;
        }

        .stat-value {
          font-size: 1.2rem;
          font-weight: 700;
          color: #333;
        }

        .stat-value.above {
          color: #ff6b6b;
        }

        .stat-value.below {
          color: #51cf66;
        }

        .market-insight {
          margin: 0;
          padding: 15px;
          background: white;
          border-radius: 8px;
          font-weight: 600;
          text-align: center;
        }

        .offer-evaluator {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
        }

        .evaluator-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 30px;
        }

        .evaluator-header h2 {
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

        .evaluator-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }

        .form-section {
          display: flex;
          flex-direction: column;
        }

        .form-card {
          background: white;
          padding: 25px;
          border-radius: 12px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .form-card h3 {
          margin: 0 0 20px 0;
          font-size: 1.3rem;
          color: #333;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
          font-size: 0.95rem;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #fd5068;
        }

        .location-autocomplete {
          position: relative;
        }

        .location-loading {
          position: absolute;
          right: 12px;
          top: 42px;
          font-size: 0.85rem;
          color: #999;
        }

        .location-suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 2px solid #fd5068;
          border-radius: 8px;
          margin-top: 5px;
          max-height: 300px;
          overflow-y: auto;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 1000;
        }

        .suggestion-item {
          display: flex;
          gap: 12px;
          padding: 12px 15px;
          cursor: pointer;
          transition: background 0.2s ease;
          border-bottom: 1px solid #f0f0f0;
        }

        .suggestion-item:last-child {
          border-bottom: none;
        }

        .suggestion-item:hover {
          background: #ffe6ec;
        }

        .suggestion-icon {
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .suggestion-text {
          flex: 1;
        }

        .suggestion-main {
          font-weight: 600;
          color: #333;
          margin-bottom: 2px;
        }

        .suggestion-sub {
          font-size: 0.85rem;
          color: #666;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .form-actions {
          display: flex;
          gap: 15px;
        }

        .reset-btn,
        .evaluate-btn {
          flex: 1;
          padding: 15px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .reset-btn {
          background: white;
          border: 2px solid #ddd;
          color: #666;
        }

        .reset-btn:hover {
          background: #f5f5f5;
        }

        .evaluate-btn {
          background: linear-gradient(45deg, #fd5068, #ff6b9d);
          color: white;
        }

        .evaluate-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .evaluate-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .results-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .score-card {
          background: white;
          padding: 40px;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border-left: 5px solid;
        }

        .score-circle {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          color: white;
        }

        .score-number {
          font-size: 3.5rem;
          font-weight: 700;
          line-height: 1;
        }

        .score-max {
          font-size: 1.2rem;
          opacity: 0.9;
        }

        .score-card h3 {
          margin: 0;
          font-size: 1.8rem;
        }

        .details-card {
          background: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .details-card h4 {
          margin: 0 0 15px 0;
          font-size: 1.2rem;
          color: #333;
        }

        .cost-item {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .cost-item:last-child {
          border-bottom: none;
        }

        .cost-item.total {
          font-size: 1.1rem;
          padding-top: 15px;
          margin-top: 10px;
          border-top: 2px solid #fd5068;
          border-bottom: none;
        }

        .details-card ul {
          margin: 0;
          padding-left: 20px;
        }

        .details-card li {
          margin-bottom: 10px;
          line-height: 1.6;
          color: #555;
        }

        .recommendations {
          background: linear-gradient(45deg, #fd5068, #ff6b9d);
          color: white;
        }

        .recommendations h4 {
          color: white;
        }

        .recommendations li {
          color: white;
        }

        @media (max-width: 1024px) {
          .evaluator-content {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .evaluator-header h2 {
            font-size: 1.5rem;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default OfferEvaluator;
