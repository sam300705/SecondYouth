import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Home, MapPin, MessageSquareText, Mic, Phone, Pill, Settings, ShieldCheck, X } from 'lucide-react';
import ContactsView from './components/ContactsView.jsx';
import HomeView from './components/HomeView.jsx';
import LegacyView from './components/LegacyView.jsx';
import LoginView from './components/LoginView.jsx';
import MedicineList from './components/MedicineList.jsx';
import OnboardingView from './components/OnboardingView.jsx';
import SafetyView from './components/SafetyView.jsx';
import SettingsView from './components/SettingsView.jsx';
import Toast from './components/Toast.jsx';
import VisionView from './components/VisionView.jsx';
import {
  defaultState,
  emergencyMessage,
  loadState,
  makeId,
  resetState,
  saveState,
} from './lib/appStore.js';
import { clearMemories } from './lib/audioDb.js';
import './App.css';

const routes = new Set(['home', 'medicines', 'contacts', 'safety', 'vision', 'legacy', 'settings']);
const getHashRoute = () => {
  const hash = window.location.hash.replace('#/', '').replace('#', '');
  return routes.has(hash) ? hash : 'home';
};

export default function App() {
  const [state, setState] = useState(loadState);
  const [route, setRoute] = useState(getHashRoute);
  const [toast, setToast] = useState(null);
  const [safeZoneStatus, setSafeZoneStatus] = useState(null);
  const [sos, setSos] = useState({ active: false, countdown: 5, completed: false, location: null });
  const recognitionRef = useRef(null);
  const notifiedRef = useRef(new Set());
  const locationRequestedRef = useRef(false);

  const notify = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToast({ id, message, type });
    window.setTimeout(() => setToast((current) => current?.id === id ? null : current), 3500);
  }, []);

  const navigate = useCallback((nextRoute) => {
    const safeRoute = routes.has(nextRoute) ? nextRoute : 'home';
    setRoute(safeRoute);
    window.location.hash = `/${safeRoute}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const startSos = useCallback(() => {
    locationRequestedRef.current = false;
    setSos({ active: true, countdown: 5, completed: false, location: null });
  }, []);

  useEffect(() => {
    const listener = () => setRoute(getHashRoute());
    window.addEventListener('hashchange', listener);
    return () => window.removeEventListener('hashchange', listener);
  }, []);

  useEffect(() => { saveState(state); }, [state]);

  useEffect(() => {
    document.documentElement.classList.toggle('large-text', state.settings.largeText);
    document.documentElement.classList.toggle('high-contrast', state.settings.highContrast);
  }, [state.settings.largeText, state.settings.highContrast]);

  useEffect(() => {
    if (!('Notification' in window) || !state.settings.notificationsEnabled || Notification.permission !== 'granted') return undefined;
    const check = () => {
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const date = now.toISOString().slice(0, 10);
      state.medicines.filter((medicine) => medicine.time === time).forEach((medicine) => {
        const key = `${date}:${medicine.id}:${time}`;
        if (notifiedRef.current.has(key)) return;
        notifiedRef.current.add(key);
        new Notification(`Time for ${medicine.name}`, { body: medicine.instructions || medicine.dose || 'Open SecondYouth to mark it taken.', icon: '/icon.svg', tag: key });
      });
    };
    check();
    const interval = window.setInterval(check, 30000);
    return () => window.clearInterval(interval);
  }, [state.medicines, state.settings.notificationsEnabled]);

  useEffect(() => {
    if (!state.settings.voiceEnabled || state.session.locked) return undefined;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return undefined;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      if (transcript.includes('home')) navigate('home');
      else if (transcript.includes('medicine')) navigate('medicines');
      else if (transcript.includes('family') || transcript.includes('contact')) navigate('contacts');
      else if (transcript.includes('safe') || transcript.includes('location')) navigate('safety');
      else if (transcript.includes('settings')) navigate('settings');
      else if (transcript.includes('help') || transcript.includes('sos')) startSos();
      else notify(`I heard “${transcript}”. Try saying home, medicines, family, safe zone, settings, or help.`, 'info');
    };
    recognition.onerror = () => notify('Voice control could not hear you. Try again.', 'error');
    recognitionRef.current = recognition;
    return () => { recognition.abort(); recognitionRef.current = null; };
  }, [navigate, notify, startSos, state.session.locked, state.settings.voiceEnabled]);

  useEffect(() => {
    if (!sos.active) return undefined;
    if (!sos.location && !locationRequestedRef.current && navigator.geolocation) {
      locationRequestedRef.current = true;
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => setSos((current) => current.active ? { ...current, location: { latitude: coords.latitude, longitude: coords.longitude } } : current),
        () => {},
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 30000 },
      );
    }
    if (sos.countdown > 0) {
      const timer = window.setTimeout(() => setSos((current) => ({ ...current, countdown: current.countdown - 1 })), 1000);
      return () => window.clearTimeout(timer);
    }
    const finishTimer = window.setTimeout(() => {
      const incident = { id: makeId('sos'), createdAt: new Date().toISOString(), location: sos.location };
      setState((current) => ({ ...current, sosHistory: [incident, ...current.sosHistory].slice(0, 20) }));
      setSos((current) => ({ ...current, active: false, completed: true }));
    }, 0);
    return () => window.clearTimeout(finishTimer);
  }, [sos.active, sos.countdown, sos.location]);

  const updateMedicines = useCallback((medicines) => setState((current) => ({ ...current, medicines })), []);
  const updateContacts = useCallback((contacts) => setState((current) => ({ ...current, contacts })), []);
  const updateSettings = useCallback((settings) => setState((current) => ({ ...current, settings })), []);
  const updateProfile = useCallback((profile) => setState((current) => ({ ...current, profile })), []);
  const unlock = useCallback(() => setState((current) => ({ ...current, session: { locked: false } })), []);

  const completeOnboarding = ({ profile, contact }) => {
    setState({ ...defaultState, profile, contacts: [contact], session: { locked: false } });
    navigate('home');
    notify('Your private device profile is ready.', 'success');
  };

  const resetDevice = async () => {
    resetState();
    try { await clearMemories(); } catch { /* IndexedDB may be unavailable or already empty. */ }
    setState({ ...defaultState });
    window.location.hash = '';
    notify('Device profile erased.', 'info');
  };

  const primaryContact = useMemo(() => state.contacts.find((contact) => contact.primary) ?? state.contacts[0] ?? null, [state.contacts]);
  const sosMessage = emergencyMessage(state.profile, sos.location);
  const currentView = route === 'medicines' ? <MedicineList medicines={state.medicines} onChange={updateMedicines} onBack={() => navigate('home')} notify={notify} />
    : route === 'contacts' ? <ContactsView contacts={state.contacts} onChange={updateContacts} onBack={() => navigate('home')} notify={notify} />
      : route === 'safety' ? <SafetyView settings={state.settings} onSettingsChange={updateSettings} status={safeZoneStatus} onStatusChange={setSafeZoneStatus} onBack={() => navigate('home')} notify={notify} />
        : route === 'vision' ? <VisionView onBack={() => navigate('home')} notify={notify} />
          : route === 'legacy' ? <LegacyView onBack={() => navigate('home')} notify={notify} />
            : route === 'settings' ? <SettingsView profile={state.profile} settings={state.settings} onProfileChange={updateProfile} onSettingsChange={updateSettings} onLock={() => setState((current) => ({ ...current, session: { locked: true } }))} onReset={resetDevice} onBack={() => navigate('home')} notify={notify} state={state} />
              : <HomeView profile={state.profile} medicines={state.medicines} contacts={state.contacts} safeZoneStatus={safeZoneStatus} onNavigate={navigate} onSos={startSos} />;

  if (!state.profile) return <><OnboardingView onComplete={completeOnboarding} /><Toast toast={toast} onClose={() => setToast(null)} /></>;
  if (state.session.locked) return <><LoginView profile={state.profile} onLogin={unlock} onReset={() => window.confirm('Erase SecondYouth data from this browser?') && resetDevice()} /><Toast toast={toast} onClose={() => setToast(null)} /></>;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#view">Skip to current screen</a>
      <main id="view" className="app-view">{currentView}</main>
      {!['vision', 'legacy'].includes(route) && <nav className="bottom-nav" aria-label="Primary navigation"><button type="button" className={route === 'home' ? 'active' : ''} onClick={() => navigate('home')}><Home /><span>Home</span></button><button type="button" className={route === 'medicines' ? 'active' : ''} onClick={() => navigate('medicines')}><Pill /><span>Medicine</span></button><button type="button" className={route === 'safety' ? 'active' : ''} onClick={() => navigate('safety')}><MapPin /><span>Safety</span></button><button type="button" className={route === 'settings' ? 'active' : ''} onClick={() => navigate('settings')}><Settings /><span>Settings</span></button></nav>}
      {state.settings.voiceEnabled && (window.SpeechRecognition || window.webkitSpeechRecognition) && <button type="button" className="voice-button" onClick={() => { try { recognitionRef.current?.start(); notify('Listening…', 'info'); } catch { notify('Voice control is already listening.', 'info'); } }} aria-label="Start voice control"><Mic /></button>}
      {sos.active && <div className="sos-overlay" role="alertdialog" aria-modal="true" aria-labelledby="sos-title"><AlertTriangle /><p className="eyebrow">Emergency countdown</p><h2 id="sos-title">Preparing help actions</h2><strong>{sos.countdown}</strong><p>We are getting your location. Cancel if this was accidental.</p><button type="button" className="cancel-sos" onClick={() => setSos({ active: false, countdown: 5, completed: false, location: null })}><X /> Cancel SOS</button></div>}
      {sos.completed && <div className="modal-backdrop"><section className="modal-card emergency-card" role="alertdialog" aria-modal="true"><div className="emergency-success"><ShieldCheck /><h2>Emergency actions are ready</h2><p>{primaryContact ? `${primaryContact.name} is your primary contact.` : 'Add a trusted contact to enable calling and messaging.'}</p></div>{primaryContact && <div className="button-stack"><a className="primary-button" href={`tel:${primaryContact.phone}`}><Phone /> Call {primaryContact.name}</a><a className="secondary-button" href={`sms:${primaryContact.phone}?body=${encodeURIComponent(sosMessage)}`}><MessageSquareText /> Send emergency message</a></div>}<p className="safety-disclaimer">SecondYouth does not silently contact emergency services. Your phone opens the call or message, and you confirm it.</p><button type="button" className="text-button" onClick={() => setSos({ active: false, countdown: 5, completed: false, location: null })}>Close</button></section></div>}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
