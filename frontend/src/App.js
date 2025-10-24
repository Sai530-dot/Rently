import React, { useState } from 'react';
import './App.css';
import UserTypeSelection from './components/UserTypeSelection';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
import ProfileSetup from './components/ProfileSetup';


function App() {
  
  const [currentView, setCurrentView] = useState('selection');
  const [userType, setUserType] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

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
    setCurrentView('login'); // or wherever you want to go after profile setup
  };

  const handleBackFromProfileSetup = () => {
    setCurrentView('signup');
  };

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
            onShowLogin={handleBackToLogin}
            onShowProfileSetup={handleShowProfileSetup}
          />
        );
      case 'profile-setup':
        return (
          <ProfileSetup
            userType={userType}
            onContinue={handleProfileSetupComplete}
            onBack={handleBackFromProfileSetup}
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