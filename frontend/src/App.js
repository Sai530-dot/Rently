import React, { useState } from 'react';
import './App.css';
import UserTypeSelection from './components/UserTypeSelection';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
import ProfileSetup from './components/ProfileSetup';
import BudgetPreference from './components/BudgetPreference';
import LocationPreference from './components/LocationPreference';
import SleepSchedule from './components/SleepSchedule';


function App() {
  
  const [currentView, setCurrentView] = useState('selection');
  const [userType, setUserType] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [userPreferences, setUserPreferences] = useState({
    budget: null,
    location: null,
    sleepSchedule: null,
    numRoommates: null
  });

  const handleUserTypeSelect = (type) => {
    setUserType(type);
    setCurrentView('login');
  };

  const handleShowSignup = () => {
    setCurrentView('signup-selection');
  };

  const handleSignupTypeSelect = (type) => {
    setUserType(type);
    setCurrentView('signup');
  };

  const handleBackToSelection = () => {
    setCurrentView('selection');
    setUserType(null);
  };

  const handleBackToLogin = () => {
    setCurrentView('login');
  };

  const handleBackToSignupSelection = () => {
    setCurrentView('signup-selection');
    setUserType(null);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleShowProfileSetup = () => {
    setCurrentView('profile-setup');
  };

  const handleProfileSetupComplete = (firstName) => {
    setUserProfile({ firstName });
    setCurrentView('budget-preference'); // or wherever you want to go after profile setup
  };

  const handleBackFromProfileSetup = () => {
    setCurrentView('signup');
  };


  const handleBudgetPreferenceSetup = () => {
    setCurrentView('budget-preference');
  }

  const handleBackFromBudgetPreference = () => {
    setCurrentView('profile-setup');
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'selection':
        return (
          <UserTypeSelection
            onUserTypeSelect={handleUserTypeSelect}
            onShowSignup={handleShowSignup}
            mode="login"
          />
        );
      case 'login':
        return (
          <LoginForm
            userType={userType}
            onBack={handleBackToSelection}
            onShowSignup={handleShowSignup}
          />
        );
      case 'signup-selection':
        return (
          <UserTypeSelection
            onUserTypeSelect={handleSignupTypeSelect}
            onBack={handleBackToSelection}
            mode="signup"
          />
        );
      case 'signup':
        return (
          <SignupForm
            userType={userType}
            onBack={handleBackToSignupSelection}
            onShowProfileSetup={handleShowProfileSetup}
            onShowLogin={handleBackToLogin} 
          />
        );
      case 'profile-setup':
        return (
          <ProfileSetup
            userType={userType}
            onContinue={handleProfileSetupComplete}
            onBack={handleBackFromProfileSetup}
            onShowBudgetPreference={handleBudgetPreferenceSetup}
          />
        );

    case 'budget-preference':
      return (
        <BudgetPreference
          onNext={() => setCurrentView('location-preference')}
          onBack={() => setCurrentView('profile-setup')}
          userPreferences={userPreferences}
          setUserPreferences={setUserPreferences}
        />
      );
    
    case 'location-preference':
      return (
        <LocationPreference
          onNext={() => setCurrentView('sleep-schedule')}
          onBack={() => setCurrentView('budget-preference')}
          userPreferences={userPreferences}
          setUserPreferences={setUserPreferences}
        />
      );
    case 'sleep-schedule':
      return (
        <SleepSchedule
          onNext={() => {
            // After completing all preferences, go to main app
            console.log('All preferences completed:', userPreferences);
            setCurrentView('selection'); // Change this to your main app view
          }}
          onBack={() => setCurrentView('location-preference')}
          userPreferences={userPreferences}
          setUserPreferences={setUserPreferences}
        />
      );

      default:
        return (
          <UserTypeSelection
            onUserTypeSelect={handleUserTypeSelect}
            onShowSignup={handleShowSignup}
            mode="login"
          />
        );
    }
  };

  return (
    <div className={`container ${darkMode ? 'dark-mode' : ''}`}>
      {/* Dark mode toggle */}
      <button className="dark-mode-toggle" onClick={toggleDarkMode}>
        {darkMode ? '☀️' : '🌙'}
      </button>
      
      {/* Decorative elements */}
      <div className="decoration top-right">
        <div className="wave wave-1"></div>
        <div className="wave wave-2"></div>
        <div className="wave wave-3"></div>
      </div>

      <div className="decoration bottom-left">
        <div className="wave wave-1"></div>
        <div className="wave wave-2"></div>
        <div className="wave wave-3"></div>
      </div>

      {/* Main content */}
      <div className="login-content">
        <div className="logo">
          <h1>Reelty</h1>
          <p>Your Property Journey Starts Here</p>
        </div>

        {renderCurrentView()}
      </div>
    </div>
  );
}

export default App;