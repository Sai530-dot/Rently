import React, { useState } from 'react';
import './App.css';
import BudgetPreference from './components/BudgetPreference';
import LocationPreference from './components/LocationPreference';
import SleepSchedule from './components/SleepSchedule';

function App() {
  const [currentPage, setCurrentPage] = useState(1);
  const [userPreferences, setUserPreferences] = useState({
    budget: null,
    location: null,
    sleepSchedule: null,
    numRoommates: null
  });

  const handleNext = () => {
    setCurrentPage(prev => prev + 1);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 1:
        return (
          <BudgetPreference
            onNext={handleNext}
            userPreferences={userPreferences}
            setUserPreferences={setUserPreferences}
          />
        );
      case 2:
        return (
          <LocationPreference
            onNext={handleNext}
            userPreferences={userPreferences}
            setUserPreferences={setUserPreferences}
          />
        );
      case 3:
        return (
          <SleepSchedule
            onNext={handleNext}
            userPreferences={userPreferences}
            setUserPreferences={setUserPreferences}
          />
        );
      default:
        return (
          <div className="preferences-content">
            <div className="logo">
              <h1>Reelty</h1>
              <p>Thank you!</p>
            </div>
            <div style={{ marginTop: '40px', fontSize: '1.1rem', color: 'var(--text-gray)' }}>
              <p>Your preferences have been saved:</p>
              <pre style={{ 
                marginTop: '20px', 
                textAlign: 'left',
                background: 'var(--light-gray)',
                padding: '20px',
                borderRadius: '12px',
                fontSize: '0.9rem'
              }}>
                {JSON.stringify(userPreferences, null, 2)}
              </pre>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="container">
      {renderPage()}
    </div>
  );
}

export default App;
