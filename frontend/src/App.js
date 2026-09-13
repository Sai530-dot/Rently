import React, { useState, useEffect } from 'react';
import './App.css';
import './workspace.css';
import UserTypeSelection from './components/UserTypeSelection';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
import Dashboard from './components/Dashboard';
import RoommateMatching from './components/RoommateMatching';
import CanadaRentMap from './components/CanadaRentMap';
import OfferEvaluator from './components/OfferEvaluator';
import Messages from './components/Messages';
import BrowseProperties from './components/BrowseProperties';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import SettingsPage from './components/SettingsPage';
import { api } from './services/api';

const publicViews = ['selection', 'login', 'signup', 'signup-selection'];
const appViews = ['dashboard', 'browse-properties', 'my-properties', 'roommate-matching', 'messages', 'saved-properties', 'rent-map', 'offer-evaluator', 'settings'];
const readView = () => window.location.hash.slice(1) || 'selection';
function App() {
  const [view, setView] = useState(readView);
  const [userType, setUserType] = useState(() => sessionStorage.getItem('reelty_account_type') || 'student');
  const [user, setUser] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('rently_theme') === 'dark'; } catch { return false; }
  });
  const navigate = (next) => { window.location.hash = next; setView(next); };
  const restore = async () => {
    setError('');
    try { const data = await api.session(); setUser(data.user); setLoaded(true); }
    catch (err) { setError(err.message); }
  };
  useEffect(() => {
    restore();
    const hashChange = () => setView(readView());
    const expired = () => { setUser(null); setConversationId(null); window.location.hash = 'login'; };
    window.addEventListener('hashchange', hashChange);
    window.addEventListener('session-expired', expired);
    return () => { window.removeEventListener('hashchange', hashChange); window.removeEventListener('session-expired', expired); };
  }, []);
  useEffect(() => {
    document.body.classList.toggle('dark-mode', dark);
    try { localStorage.setItem('rently_theme', dark ? 'dark' : 'light'); } catch {}
  }, [dark]);
  const resetting = view.startsWith('reset-password/');
  useEffect(() => {
    if (!loaded || resetting) return;
    if (!user && !publicViews.includes(view)) navigate('selection');
    else if (user && (!appViews.includes(view) || publicViews.includes(view))) navigate(user.preferences.completed ? 'dashboard' : 'settings');
  }, [loaded, user, view, resetting]);
  const authenticated = (nextUser) => { setUser(nextUser); setConversationId(null); navigate(nextUser.preferences.completed ? 'dashboard' : 'settings'); };
  const logout = async () => {
    try { await api.logout(); setUser(null); setConversationId(null); navigate('selection'); }
    catch (err) { setError(err.message); }
  };
  const selectType = (type, destination) => {
    const value = type.replace('-signup', '');
    setUserType(value); sessionStorage.setItem('reelty_account_type', value); navigate(destination);
  };
  const openConversation = async (recipientId) => {
    const { conversation } = await api.startConversation(recipientId);
    setConversationId(conversation.id); navigate('messages');
    return conversation;
  };
  if (!loaded) return <main className="workspace"><h1>Reelty</h1>{error ? <><p role="alert">{error}</p><button onClick={restore}>Retry connection</button></> : <p role="status">Loading your account…</p>}</main>;
  const inApp = user && !resetting && appViews.includes(view);
  const back = () => navigate('dashboard');
  let page;
  if (resetting) page = <LoginForm resetParts={view.split('/').slice(1)} userType={userType} onBack={() => navigate('login')} onLoginSuccess={authenticated} />;
  else if (!inApp) {
    if (view === 'login') page = <LoginForm userType={userType} onBack={() => navigate('selection')} onShowSignup={() => navigate('signup-selection')} onLoginSuccess={authenticated} />;
    else if (view === 'signup') page = <SignupForm userType={userType + '-signup'} onBack={() => navigate('signup-selection')} onShowLogin={() => navigate('login')} onSignupSuccess={authenticated} />;
    else page = <UserTypeSelection mode={view === 'signup-selection' ? 'signup' : 'login'} onBack={() => navigate('selection')} onShowSignup={() => navigate('signup-selection')} onUserTypeSelect={type => selectType(type, view === 'signup-selection' ? 'signup' : 'login')} />;
  } else {
    switch (view) {
      case 'browse-properties': case 'my-properties': case 'saved-properties':
        page = <BrowseProperties key={view} mode={view} userProfile={user} userPreferences={user.preferences} onBack={back} onNavigate={navigate} onContact={openConversation} />; break;
      case 'roommate-matching': page = <RoommateMatching userProfile={user} onBack={back} onNavigate={navigate} onContact={openConversation} />; break;
      case 'messages': page = <Messages userProfile={user} initialConversationId={conversationId} onBack={back} />; break;
      case 'settings': page = <SettingsPage userProfile={user} onBack={back} onSave={updated => { setUser(updated); }} />; break;
      case 'rent-map': page = <CanadaRentMap onBack={back} />; break;
      case 'offer-evaluator': page = <OfferEvaluator onBack={back} />; break;
      default: page = <Dashboard userProfile={user} onNavigate={navigate} />;
    }
  }
  return <div className={'app-container ' + (dark ? 'dark-mode ' : '') + (inApp ? 'has-rail' : '')}>
    {inApp && <Navigation userProfile={user} currentView={view} onNavigate={navigate} onLogout={logout} onToggleAppearance={() => setDark(!dark)} appearance={dark ? 'dark' : 'light'} />}
    <div className={inApp ? 'main-content' : 'auth-container'}>
      {error && <div className="notice error" role="alert">{error}<button onClick={() => setError('')}>Dismiss</button></div>}
      {page}{inApp && view !== 'rent-map' && <Footer onNavigate={navigate} />}
    </div>
  </div>;
}
export default App;
