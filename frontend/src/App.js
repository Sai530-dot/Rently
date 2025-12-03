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
import { api } from './services/api';
import SettingsPage from './components/SettingsPage';

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

  const getPreferencesKey = (profile) => `rently_user_preferences_${profile?.id || profile?.email || 'anon'}`;

  const loadPreferencesFor = (profile) => {
    const namespaced = localStorage.getItem(getPreferencesKey(profile));
    if (namespaced) return JSON.parse(namespaced);
    const legacy = localStorage.getItem('rently_user_preferences');
    return legacy ? JSON.parse(legacy) : null;
  };

  const savePreferencesFor = (profile, prefs) => {
    localStorage.setItem(getPreferencesKey(profile), JSON.stringify(prefs));
    // keep legacy key for backward compatibility
    localStorage.setItem('rently_user_preferences', JSON.stringify(prefs));
  };

  const persistPreferencesToBackend = async (profile, prefs) => {
    if (!profile) return;
    const userId = profile.id || profile.email;
    if (!userId) return;
    try {
      await api.savePreferences({
        user_id: userId,
        budget: prefs?.budget,
        rentAsk: prefs?.budget,
        cleanliness: prefs?.cleanliness || 'moderate',
        sleepSchedule: prefs?.sleepSchedule || 'flexible',
        interests: prefs?.interests || [],
        city: prefs?.location || '',
        major: prefs?.major || ''
      });
    } catch (err) {
      console.error('Failed to save preferences to backend', err);
    }
  };

  // Load user data
  useEffect(() => {
    const savedProfile = localStorage.getItem('rently_user_profile');
    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      // Ensure id is present; fall back to email if missing
      const normalizedProfile = parsedProfile?.id ? parsedProfile : { ...parsedProfile, id: parsedProfile?.email };
      setUserProfile(normalizedProfile);
      const prefs = loadPreferencesFor(normalizedProfile);
      if (prefs) setUserPreferences(prefs);
    } else {
      const legacyPrefs = loadPreferencesFor(null);
      if (legacyPrefs) setUserPreferences(legacyPrefs);
    }
  }, []);

  // Save user data
  useEffect(() => {
    if (userProfile) {
      localStorage.setItem('rently_user_profile', JSON.stringify(userProfile));
    }
  }, [userProfile]);

  const clearUserLocalData = () => {
    localStorage.removeItem('rently_matches');
    localStorage.removeItem('rently_passes');
    localStorage.removeItem('rently_saved_properties');
    localStorage.removeItem('rently_conversations');
    // keep preferences; they are namespaced per user
  };

  const handleLoginSuccess = (userData) => {
    clearUserLocalData(); // clear non-namespaced data from prior user
    const normalizedUser = userData?.id ? userData : { ...userData, id: userData?.email };
    setUserProfile(normalizedUser);
    const prefs = loadPreferencesFor(normalizedUser);
    if (prefs) {
      setUserPreferences(prefs);
      persistPreferencesToBackend(normalizedUser, prefs);
    } else {
      const emptyPrefs = {
        budget: null,
        location: null,
        sleepSchedule: null,
        numRoommates: null
      };
      setUserPreferences(emptyPrefs);
    }
    setCurrentView('dashboard'); // go straight to account after sign-in
  };

  const handleLogout = () => {
    clearUserLocalData();
    localStorage.removeItem('rently_user_profile');
    setUserProfile(null);
    setCurrentView('selection');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'selection':
        return <UserTypeSelection mode="login" onUserTypeSelect={(type) => { setUserType(type); setCurrentView('login'); }} onShowSignup={() => setCurrentView('signup-selection')} />;
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
        return <SleepSchedule
          userPreferences={userPreferences}
          setUserPreferences={setUserPreferences}
          onNext={async (prefs) => {
            const nextPrefs = prefs || userPreferences;
            setUserPreferences(nextPrefs);
            savePreferencesFor(userProfile, nextPrefs);
            // Persist to backend so roommate matching works
            await persistPreferencesToBackend(userProfile, nextPrefs);
            setCurrentView('dashboard');
          }}
          onBack={() => setCurrentView('location-preference')}
        />;
      
      // MAIN APP VIEWS
      case 'dashboard':
        return <Dashboard userProfile={userProfile} userPreferences={userPreferences} onNavigate={setCurrentView} />;
      case 'browse-properties':
        return <BrowseProperties onBack={() => setCurrentView('dashboard')} userPreferences={userPreferences} onNavigate={setCurrentView} />;
      case 'roommate-matching':
        return <RoommateMatching onBack={() => setCurrentView('dashboard')} userProfile={userProfile} userPreferences={userPreferences} onNavigate={setCurrentView} />;
      case 'messages':
        return <Messages onBack={() => setCurrentView('dashboard')} />;
      case 'saved-properties':
        return <SavedProperties onBack={() => setCurrentView('dashboard')} onNavigate={setCurrentView} />;
      case 'rent-map':
        return <CanadaRentMap onBack={() => setCurrentView('dashboard')} />;
      case 'offer-evaluator':
        return <OfferEvaluator onBack={() => setCurrentView('dashboard')} />;
      case 'settings':
        return <SettingsPage
          userProfile={userProfile}
          onBack={() => setCurrentView('dashboard')}
          onSavePrefs={(prefs) => {
            setUserPreferences(prefs);
            localStorage.setItem(`rently_user_preferences_${userProfile?.id || userProfile?.email || 'anon'}`, JSON.stringify(prefs));
          }}
        />;
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
