import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, MessageSquareText, Mic, Phone, Settings, ShieldAlert, ShieldCheck, X } from 'lucide-react';
import AssistantPanel from './components/AssistantPanel.jsx';
import ContactsView from './components/ContactsView.jsx';
import WorkspaceNav from './components/WorkspaceNav.jsx';
import HomeView from './components/HomeView.jsx';
import LegacyView from './components/LegacyView.jsx';
import LoginView from './components/LoginView.jsx';
import CareView from './components/CareView.jsx';
import CaregiverView from './components/CaregiverView.jsx';
import { useCareCheckins } from './lib/useCareCheckins.js';
import { clearCheckins } from './lib/checkinDb.js';
import { captureCareInvite, sharingKey } from './lib/careClient.js';
import MedicineList from './components/MedicineList.jsx';
import OnboardingView from './components/OnboardingView.jsx';
import SafetyView from './components/SafetyView.jsx';
import SettingsView from './components/SettingsView.jsx';
import Toast from './components/Toast.jsx';
import VisionView from './components/VisionView.jsx';
import {
  defaultState,
  emergencyMessage,
  isMedicineTakenToday,
  todayKey,
  loadState,
  makeId,
  resetState,
  saveState,
} from './lib/appStore.js';
import { clearMemories } from './lib/audioDb.js';
import './App.css';
import './Design.css';

const routes = new Set(['home', 'medicines', 'contacts', 'safety', 'vision', 'legacy', 'settings', 'care', 'caregiver']);
const getHashRoute = () => {
  const hash = window.location.hash.replace('#/', '').replace('#', '');
  if (hash.startsWith('caregiver/')) return 'caregiver';
  return routes.has(hash) ? hash : 'home';
};

export default function App() {
  const [state, setState] = useState(loadState);
  const [route, setRoute] = useState(getHashRoute);
  const [invite, setInvite] = useState(captureCareInvite);
  const care = useCareCheckins(Boolean(state.profile && !state.session.locked && route !== 'caregiver'));
  const medicines = useMemo(() => state.medicines.map((medicine) => {
    const event = care.latest.get(medicine.id);
    return event ? { ...medicine, lastTakenDate: event.taken ? event.date : null } : medicine;
  }), [state.medicines, care.latest]);
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
    const listener = () => {
      setInvite(captureCareInvite());
      setRoute(getHashRoute());
    };
    window.addEventListener('hashchange', listener);
    return () => window.removeEventListener('hashchange', listener);
  }, []);

  useEffect(() => {
    if (!state.profile || saveState(state)) return undefined;
    const timer = window.setTimeout(() => notify('Device storage is unavailable. Changes may be lost when you leave.', 'error'), 0);
    return () => window.clearTimeout(timer);
  }, [notify, state]);

  useEffect(() => {
    document.documentElement.classList.toggle('large-text', state.settings.largeText);
    document.documentElement.classList.toggle('high-contrast', state.settings.highContrast);
  }, [state.settings.largeText, state.settings.highContrast]);

  useEffect(() => {
    if (!('Notification' in window) || !state.settings.notificationsEnabled || Notification.permission !== 'granted') return undefined;
    const check = () => {
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const date = todayKey(now);
      for (const key of notifiedRef.current) {
        if (!key.startsWith(date + ':')) notifiedRef.current.delete(key);
      }
      medicines.filter((medicine) => medicine.time === time && medicine.active !== false && !isMedicineTakenToday(medicine, now)).forEach((medicine) => {
        const key = `${date}:${medicine.id}:${time}`;
        if (notifiedRef.current.has(key)) return;
        notifiedRef.current.add(key);
        const options = { body: 'Open SecondYouth to review your schedule.', icon: '/icon.svg', tag: key };
        const registration = navigator.serviceWorker?.controller;
        if (registration) {
          navigator.serviceWorker.ready.then((worker) => worker.showNotification('Medicine reminder', options))
            .catch(() => notifiedRef.current.delete(key));
        } else {
          try { new Notification('Medicine reminder', options); } catch { notifiedRef.current.delete(key); }
        }
      });
    };
    check();
    const interval = window.setInterval(check, 30000);
    return () => window.clearInterval(interval);
  }, [medicines, state.settings.notificationsEnabled]);

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
    try {
      await clearMemories();
      await clearCheckins();
      localStorage.removeItem(sharingKey);
      localStorage.removeItem('secondyouth.care.demoKey');
      await care.refresh();
    } catch {
      notify('Device records could not be fully erased. Try again before clearing the profile.', 'error');
      return;
    }
    if (!resetState()) {
      notify('Audio cleanup finished, but the device profile could not be erased.', 'error');
      return;
    }
    setSafeZoneStatus(null);
    setSos({ active: false, countdown: 5, completed: false, location: null });
    setState({ ...defaultState });
    window.location.hash = '';
    notify('Device profile erased.', 'info');
  };

  const restoreDevice = (backup) => {
    if (!saveState(backup)) {
      notify('The backup could not be saved. Your current data was kept.', 'error');
      return;
    }
    setSafeZoneStatus(null);
    setState({ ...backup, session: { locked: false } });
    navigate('home');
    notify('Device backup restored.', 'success');
  };

  const primaryContact = useMemo(() => state.contacts.find((contact) => contact.primary) ?? state.contacts[0] ?? null, [state.contacts]);
  const sosMessage = emergencyMessage(state.profile, sos.location);
  if (route === 'caregiver') return <CaregiverView key={invite} invite={invite} />;

  const currentView = route === 'care' ? <CareView onBack={() => navigate('settings')} />
    : route === 'medicines' ? <MedicineList medicines={medicines} care={care} onChange={updateMedicines} onBack={() => navigate('home')} notify={notify} />
    : route === 'contacts' ? <ContactsView contacts={state.contacts} onChange={updateContacts} onBack={() => navigate('home')} notify={notify} />
      : route === 'safety' ? <SafetyView settings={state.settings} onSettingsChange={updateSettings} status={safeZoneStatus} onStatusChange={setSafeZoneStatus} onBack={() => navigate('home')} notify={notify} />
        : route === 'vision' ? <VisionView onBack={() => navigate('home')} notify={notify} />
          : route === 'legacy' ? <LegacyView onBack={() => navigate('home')} notify={notify} />
            : route === 'settings' ? <SettingsView profile={state.profile} settings={state.settings} onProfileChange={updateProfile} onSettingsChange={updateSettings} onLock={() => setState((current) => ({ ...current, session: { locked: true } }))} onReset={resetDevice} onCare={() => navigate('care')} onRestore={restoreDevice} onBack={() => navigate('home')} notify={notify} state={{ ...state, medicines }} />
              : <HomeView profile={state.profile} medicines={medicines} contacts={state.contacts} safeZoneStatus={safeZoneStatus} onNavigate={navigate} onSos={startSos} />;

  if (!state.profile) return <><OnboardingView onComplete={completeOnboarding} onRestore={restoreDevice} notify={notify} /><Toast toast={toast} onClose={() => setToast(null)} /></>;
  if (state.session.locked) return <><LoginView profile={state.profile} onLogin={unlock} onReset={() => window.confirm('Erase SecondYouth data from this browser?') && resetDevice()} /><Toast toast={toast} onClose={() => setToast(null)} /></>;

  return (
    <div className={`app-shell workspace-shell ${route === 'home' ? 'workspace-home' : ''}`}>
      <a className="skip-link" href="#view" onClick={(event) => { event.preventDefault(); document.getElementById('view')?.focus(); }}>Skip to current screen</a>
      <WorkspaceNav route={route} onNavigate={navigate} />
      <header className="workspace-topbar">
        <div className="topbar-brand"><img src="/icon.svg" alt="" width="32" height="32" /><strong>SecondYouth</strong></div>
        <span className="workspace-location">{route === 'home' ? 'Overview' : 'Your dashboard'}</span>
        <button className="topbar-sos" type="button" onClick={startSos} aria-label="Start emergency SOS">
          <ShieldAlert size={18} /><span>SOS</span>
        </button>
        <button className="profile-button" type="button" onClick={() => navigate('settings')} aria-label="Open profile settings">
          <Settings size={18} /><span>{state.profile.name}</span>
        </button>
      </header>
      <main id="view" className="app-view" tabIndex={-1}>{currentView}</main>
      <div className="workspace-utilities">
        {state.settings.voiceEnabled && (window.SpeechRecognition || window.webkitSpeechRecognition) && <button type="button" className="voice-button" onClick={() => { try { recognitionRef.current?.start(); notify('Listening…', 'info'); } catch { notify('Voice control is already listening.', 'info'); } }} aria-label="Start voice control"><Mic /></button>}
        <AssistantPanel medicines={medicines} route={route} />
      </div>
      {sos.active && <div className="sos-overlay" role="alertdialog" aria-modal="true" aria-labelledby="sos-title"><AlertTriangle /><p className="eyebrow">Emergency countdown</p><h2 id="sos-title">Preparing help actions</h2><strong>{sos.countdown}</strong><p>We are getting your location. Cancel if this was accidental.</p><button type="button" className="cancel-sos" onClick={() => setSos({ active: false, countdown: 5, completed: false, location: null })}><X /> Cancel SOS</button></div>}
      {sos.completed && <div className="modal-backdrop"><section className="modal-card emergency-card" role="alertdialog" aria-modal="true"><div className="emergency-success"><ShieldCheck /><h2>Emergency actions are ready</h2><p>{primaryContact ? `${primaryContact.name} is your primary contact.` : 'Add a trusted contact to enable calling and messaging.'}</p></div>{primaryContact && <div className="button-stack"><a className="primary-button" href={`tel:${primaryContact.phone}`}><Phone /> Call {primaryContact.name}</a><a className="secondary-button" href={`sms:${primaryContact.phone}?body=${encodeURIComponent(sosMessage)}`}><MessageSquareText /> Send emergency message</a></div>}<p className="safety-disclaimer">SecondYouth does not silently contact emergency services. Your phone opens the call or message, and you confirm it.</p><button type="button" className="text-button" onClick={() => setSos({ active: false, countdown: 5, completed: false, location: null })}>Close</button></section></div>}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
