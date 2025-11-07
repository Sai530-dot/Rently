import React, { useState } from 'react';

const SleepSchedule = ({ onNext, userPreferences, setUserPreferences }) => {
  const [sleepTime, setSleepTime] = useState(userPreferences.sleepSchedule || '');
  const [inputType, setInputType] = useState('dropdown'); // 'dropdown' or 'time'

  const handleContinue = () => {
    if (sleepTime) {
      setUserPreferences({ ...userPreferences, sleepSchedule: sleepTime });
      onNext();
    }
  };

  const sleepOptions = [
    { value: 'before-10pm', label: 'Before 10:00 PM' },
    { value: '10pm-11pm', label: '10:00 PM - 11:00 PM' },
    { value: '11pm-12am', label: '11:00 PM - 12:00 AM' },
    { value: '12am-1am', label: '12:00 AM - 1:00 AM' },
    { value: '1am-2am', label: '1:00 AM - 2:00 AM' },
    { value: 'after-2am', label: 'After 2:00 AM' }
  ];

  const getDisplayValue = () => {
    if (inputType === 'time') {
      return sleepTime || '22:00'; // Default to 10:00 PM
    }
    return sleepTime || '';
  };

  return (
    <div className="preferences-content">
      <div className="logo">
        <h1>Reelty</h1>
        <p>Find Your Perfect Roommate</p>
      </div>

      <div className="preferences-form">
        <div className="form-group">
          <label>What time do you usually go to bed?</label>
          
          {/* Toggle between time picker and dropdown */}
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            marginBottom: '15px',
            justifyContent: 'center'
          }}>
            <button
              type="button"
              onClick={() => setInputType('time')}
              style={{
                padding: '8px 16px',
                border: `2px solid ${inputType === 'time' ? 'var(--tinder-red)' : 'var(--border-gray)'}`,
                borderRadius: '8px',
                background: inputType === 'time' ? 'var(--white)' : 'var(--light-gray)',
                color: inputType === 'time' ? 'var(--tinder-red)' : 'var(--text-gray)',
                cursor: 'pointer',
                fontWeight: inputType === 'time' ? 600 : 400,
                transition: 'all 0.3s ease'
              }}
            >
              Time Picker
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

          {inputType === 'time' ? (
            <div style={{ textAlign: 'center' }}>
              <input
                type="time"
                value={getDisplayValue()}
                onChange={(e) => setSleepTime(e.target.value)}
                className="form-select"
                style={{ fontSize: '1.2rem', padding: '20px', textAlign: 'center' }}
              />
              <div style={{ 
                marginTop: '15px', 
                fontSize: '0.9rem', 
                color: 'var(--text-gray)' 
              }}>
                Choose your bedtime
              </div>
            </div>
          ) : (
            <select
              value={sleepTime}
              onChange={(e) => setSleepTime(e.target.value)}
              className="form-select"
            >
              <option value="">Select your bedtime...</option>
              {sleepOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          onClick={handleContinue}
          disabled={!sleepTime}
          className="continue-button"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default SleepSchedule;

