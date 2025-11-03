import React, { useState } from 'react';

const BudgetPreference = ({ onNext, userPreferences, setUserPreferences }) => {
  const [budget, setBudget] = useState(userPreferences.budget || 1500);
  const [inputType, setInputType] = useState('slider'); // 'slider' or 'dropdown'

  const handleContinue = () => {
    setUserPreferences({ ...userPreferences, budget });
    onNext();
  };

  const budgetOptions = [
    { value: 500, label: '$500/month' },
    { value: 1000, label: '$1,000/month' },
    { value: 1500, label: '$1,500/month' },
    { value: 2000, label: '$2,000/month' },
    { value: 2500, label: '$2,500/month' },
    { value: 3000, label: '$3,000/month' },
    { value: 3500, label: '$3,500/month' },
    { value: 4000, label: '$4,000+/month' }
  ];

  return (
    <div className="preferences-content">
      <div className="logo">
        <h1>Reelty</h1>
        <p>Find Your Perfect Roommate</p>
      </div>

      <div className="preferences-form">
        <div className="form-group">
          <label>What's your monthly budget for rent?</label>
          
          {/* Toggle between slider and dropdown */}
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            marginBottom: '15px',
            justifyContent: 'center'
          }}>
            <button
              type="button"
              onClick={() => setInputType('slider')}
              style={{
                padding: '8px 16px',
                border: `2px solid ${inputType === 'slider' ? 'var(--tinder-red)' : 'var(--border-gray)'}`,
                borderRadius: '8px',
                background: inputType === 'slider' ? 'var(--white)' : 'var(--light-gray)',
                color: inputType === 'slider' ? 'var(--tinder-red)' : 'var(--text-gray)',
                cursor: 'pointer',
                fontWeight: inputType === 'slider' ? 600 : 400,
                transition: 'all 0.3s ease'
              }}
            >
              Slider
            </button>
            <button
              type="button"
              onClick={() => setInputType('dropdown')}
              style={{
                padding: '8px 16px',
                border: `2px solid ${inputType === 'dropdown' ? 'var(--tinder-red)' : 'var(--border-gray)'}`,
                borderRadius: '8px',
                background: inputType === 'dropdown' ? 'var(--white)' : 'var(--light-gray)',
                color: inputType === 'dropdown' ? 'var(--tinder-red)' : 'var(--text-gray)',
                cursor: 'pointer',
                fontWeight: inputType === 'dropdown' ? 600 : 400,
                transition: 'all 0.3s ease'
              }}
            >
              Dropdown
            </button>
          </div>

          {inputType === 'slider' ? (
            <div className="budget-slider-container">
              <div className="budget-value">${budget.toLocaleString()}</div>
              <div className="budget-label">per month</div>
              <input
                type="range"
                min="500"
                max="4000"
                step="100"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="budget-slider"
              />
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontSize: '0.8rem',
                color: 'var(--text-gray)',
                marginTop: '5px'
              }}>
                <span>$500</span>
                <span>$4,000+</span>
              </div>
            </div>
          ) : (
            <select
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="form-select"
            >
              {budgetOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          onClick={handleContinue}
          className="continue-button"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default BudgetPreference;

