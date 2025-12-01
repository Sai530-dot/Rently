import React, { useState, useEffect } from 'react';
import './App.css';
import UserTypeSelection from './components/UserTypeSelection';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
import ProfileSetup from './components/ProfileSetup';
import BudgetPreference from './components/BudgetPreference';
import LocationPreference from './components/LocationPreference';
import SleepSchedule from './components/SleepSchedule';
import Dashboard from './components/Dashboard';
import RoommateMatching from './components/RoommateMatching';
import CanadaRentMap from './components/CanadaRentMap';
import OfferEvaluator from './components/OfferEvaluator';
import Messages from './components/Messages';
import SavedProperties from './components/SavedProperties';
import BrowseProperties from './components/BrowseProperties';
import Navigation from './components/Navigation';
import Footer from './components/Footer';

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

  // Load user data
  useEffect(() => {
    const savedProfile = localStorage.getItem('rently_user_profile');
    const savedPreferences = localStorage.getItem('rently_user_preferences');
    
    if (savedProfile) setUserProfile(JSON.parse(savedProfile));
    if (savedPreferences) setUserPreferences(JSON.parse(savedPreferences));
  }, []);

  // Save user data
  useEffect(() => {
    if (userProfile) {
      localStorage.setItem('rently_user_profile', JSON.stringify(userProfile));
    }
  }, [userProfile]);

  const handleLoginSuccess = (userData) => {
    setUserProfile(userData);
    const savedPreferences = localStorage.getItem('rently_user_preferences');
    if (savedPreferences) {
      setCurrentView('dashboard');
    } else {
      setCurrentView('profile-setup');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('rently_user_profile');
    setUserProfile(null);
    setCurrentView('selection');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'selection':
        return <UserTypeSelection onUserTypeSelect={(type) => { setUserType(type); setCurrentView('login'); }} onShowSignup={() => setCurrentView('signup-selection')} />;
      case 'login':
        return <LoginForm userType={userType} onBack={() => setCurrentView('selection')} onLoginSuccess={handleLoginSuccess} onShowSignup={() => setCurrentView('signup-selection')} />;
      case 'signup-selection':
        return <UserTypeSelection onUserTypeSelect={(type) => { setUserType(type); setCurrentView('signup'); }} onBack={() => setCurrentView('selection')} mode="signup" />;
      case 'signup':
        return <SignupForm userType={userType} onBack={() => setCurrentView('signup-selection')} onShowLogin={() => setCurrentView('login')} onShowProfileSetup={() => setCurrentView('profile-setup')} />;
      case 'profile-setup':
        return <ProfileSetup userType={userType} onContinue={(name) => { setUserProfile({ ...userProfile, firstName: name }); setCurrentView('budget-preference'); }} />;
      case 'budget-preference':
        return <BudgetPreference userPreferences={userPreferences} setUserPreferences={setUserPreferences} onNext={() => setCurrentView('location-preference')} />;
      case 'location-preference':
        return <LocationPreference userPreferences={userPreferences} setUserPreferences={setUserPreferences} onNext={() => setCurrentView('sleep-schedule')} onBack={() => setCurrentView('budget-preference')} />;
      case 'sleep-schedule':
        return <SleepSchedule userPreferences={userPreferences} setUserPreferences={setUserPreferences} onNext={() => { localStorage.setItem('rently_user_preferences', JSON.stringify(userPreferences)); setCurrentView('dashboard'); }} onBack={() => setCurrentView('location-preference')} />;
      
      // MAIN APP VIEWS
      case 'dashboard':
        return <Dashboard userProfile={userProfile} userPreferences={userPreferences} onNavigate={setCurrentView} />;
      case 'browse-properties':
        return <BrowseProperties onBack={() => setCurrentView('dashboard')} userPreferences={userPreferences} onNavigate={setCurrentView} />;
      case 'roommate-matching':
        return <RoommateMatching onBack={() => setCurrentView('dashboard')} userPreferences={userPreferences} onNavigate={setCurrentView} />;
      case 'messages':
        return <Messages onBack={() => setCurrentView('dashboard')} />;
      case 'saved-properties':
        return <SavedProperties onBack={() => setCurrentView('dashboard')} onNavigate={setCurrentView} />;
      case 'rent-map':
        return <CanadaRentMap onBack={() => setCurrentView('dashboard')} />;
      case 'offer-evaluator':
        return <OfferEvaluator onBack={() => setCurrentView('dashboard')} />;
      default:
        return <Dashboard userProfile={userProfile} userPreferences={userPreferences} onNavigate={setCurrentView} />;
    }
  };

  const isAuthView = ['selection', 'login', 'signup', 'signup-selection', 'profile-setup', 'budget-preference', 'location-preference', 'sleep-schedule'].includes(currentView);

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : ''}`}>
      {!isAuthView && <Navigation userProfile={userProfile} currentView={currentView} onNavigate={setCurrentView} onLogout={handleLogout} />}
      <div className={isAuthView ? 'auth-container' : 'main-content'}>
        {renderCurrentView()}
        {!isAuthView && <Footer />}
      </div>
    </div>
  );
}

export default App;