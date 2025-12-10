import React, { useState, useEffect, useRef } from 'react';
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

const AUTH_VIEWS = ['selection', 'login', 'signup', 'signup-selection', 'profile-setup', 'budget-preference', 'location-preference', 'sleep-schedule'];
const APP_VIEWS = ['dashboard', 'browse-properties', 'roommate-matching', 'messages', 'saved-properties', 'rent-map', 'offer-evaluator', 'settings'];

const getInitialView = () => {
  try {
    return localStorage.getItem('rently_current_view') || 'selection';
  } catch {
    return 'selection';
  }
};

function App() {
  const [currentView, setCurrentView] = useState(getInitialView);
  const [userType, setUserType] = useState(null);
  const getInitialTheme = () => {
    if (typeof window === 'undefined') return false;
    try {
      const stored = localStorage.getItem('rently_theme');
      if (stored) return stored === 'dark';
    } catch (err) {
      // ignore read errors
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  const [darkMode, setDarkMode] = useState(getInitialTheme);
  const [userProfile, setUserProfile] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);
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
    setUserLoaded(true);
  }, []);

  // Save user data
  useEffect(() => {
    if (userProfile) {
      localStorage.setItem('rently_user_profile', JSON.stringify(userProfile));
    }
  }, [userProfile]);

  useEffect(() => {
    try {
      localStorage.setItem('rently_theme', darkMode ? 'dark' : 'light');
    } catch (err) {
      // ignore write errors
    }
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  const handleToggleAppearance = () => setDarkMode((prev) => !prev);

  const navFromPop = useRef(false);

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
    handleNavigate('selection');
  };

  // Restore initial history state
  useEffect(() => {
    window.history.replaceState({ view: currentView }, '', `#${currentView}`);
  }, []);

  // Sync view to localStorage + history
  useEffect(() => {
    try { localStorage.setItem('rently_current_view', currentView); } catch {}
    if (navFromPop.current) {
      navFromPop.current = false;
      return;
    }
    window.history.pushState({ view: currentView }, '', `#${currentView}`);
  }, [currentView]);

  // Handle back/forward
  useEffect(() => {
    const onPop = (e) => {
      const nextView = e.state?.view;
      if (!nextView) return;
      navFromPop.current = true;
      setCurrentView(nextView);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // If logged out but view is protected, send to selection
  useEffect(() => {
    if (!userLoaded) return;
    const authView = AUTH_VIEWS.includes(currentView);
    if (!userProfile && !authView) {
      navFromPop.current = true;
      setCurrentView('selection');
      window.history.replaceState({ view: 'selection' }, '', '#selection');
    }
  }, [userProfile, currentView, userLoaded]);

  const handleNavigate = (view) => {
    setCurrentView(view);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'selection':
        return <UserTypeSelection mode="login" onUserTypeSelect={(type) => { setUserType(type); handleNavigate('login'); }} onShowSignup={() => handleNavigate('signup-selection')} />;
      case 'login':
        return <LoginForm userType={userType} onBack={() => handleNavigate('selection')} onLoginSuccess={handleLoginSuccess} onShowSignup={() => handleNavigate('signup-selection')} />;
      case 'signup-selection':
        return <UserTypeSelection onUserTypeSelect={(type) => { setUserType(type); handleNavigate('signup'); }} onBack={() => handleNavigate('selection')} mode="signup" />;
      case 'signup':
        return <SignupForm userType={userType} onBack={() => handleNavigate('signup-selection')} onShowLogin={() => handleNavigate('login')} onShowProfileSetup={() => handleNavigate('profile-setup')} />;
      case 'profile-setup':
        return <ProfileSetup userType={userType} onContinue={(name) => { setUserProfile({ ...userProfile, firstName: name }); handleNavigate('budget-preference'); }} />;
      case 'budget-preference':
        return <BudgetPreference userPreferences={userPreferences} setUserPreferences={setUserPreferences} onNext={() => handleNavigate('location-preference')} />;
      case 'location-preference':
        return <LocationPreference userPreferences={userPreferences} setUserPreferences={setUserPreferences} onNext={() => handleNavigate('sleep-schedule')} onBack={() => handleNavigate('budget-preference')} />;
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
            handleNavigate('dashboard');
          }}
          onBack={() => handleNavigate('location-preference')}
        />;
      
      // MAIN APP VIEWS
      case 'dashboard':
        return (
          <Dashboard
            userProfile={userProfile}
            userPreferences={userPreferences}
            onNavigate={handleNavigate}
            appearance={darkMode ? 'dark' : 'light'}
            onToggleAppearance={handleToggleAppearance}
          />
        );
      case 'browse-properties':
        return <BrowseProperties onBack={() => handleNavigate('dashboard')} userPreferences={userPreferences} onNavigate={handleNavigate} />;
      case 'roommate-matching':
        return <RoommateMatching onBack={() => handleNavigate('dashboard')} userProfile={userProfile} userPreferences={userPreferences} onNavigate={handleNavigate} />;
      case 'messages':
        return <Messages onBack={() => handleNavigate('dashboard')} />;
      case 'saved-properties':
        return <SavedProperties onBack={() => handleNavigate('dashboard')} onNavigate={handleNavigate} />;
      case 'rent-map':
        return <CanadaRentMap onBack={() => handleNavigate('dashboard')} />;
      case 'offer-evaluator':
        return <OfferEvaluator onBack={() => handleNavigate('dashboard')} />;
      case 'settings':
        return <SettingsPage
          userProfile={userProfile}
          onBack={() => handleNavigate('dashboard')}
          onSavePrefs={(prefs) => {
            setUserPreferences(prefs);
            localStorage.setItem(`rently_user_preferences_${userProfile?.id || userProfile?.email || 'anon'}`, JSON.stringify(prefs));
          }}
        />;
      default:
        return (
          <Dashboard
            userProfile={userProfile}
            userPreferences={userPreferences}
            onNavigate={handleNavigate}
            appearance={darkMode ? 'dark' : 'light'}
            onToggleAppearance={handleToggleAppearance}
          />
        );
    }
  };

  const isAuthView = AUTH_VIEWS.includes(currentView);

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : ''} ${!isAuthView ? 'has-rail' : ''}`}>
      {!isAuthView && (
        <Navigation
          userProfile={userProfile}
          currentView={currentView}
          onNavigate={setCurrentView}
          onLogout={handleLogout}
          onToggleAppearance={handleToggleAppearance}
          appearance={darkMode ? 'dark' : 'light'}
        />
      )}
      <div className={isAuthView ? 'auth-container' : 'main-content'}>
        {renderCurrentView()}
        {!isAuthView && <Footer />}
      </div>
    </div>
  );
}

export default App;
