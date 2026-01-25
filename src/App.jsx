import { useState, useEffect, useRef } from 'react';
import { Settings, Sun, Moon, MapPin, Pill, Phone, AlertTriangle, Mic, X, User, Eye, BookHeart } from 'lucide-react';
import MedicineList from './components/MedicineList';
import SettingsView from './components/SettingsView';
import VisionView from './components/VisionView';
import LegacyView from './components/LegacyView';
import LoginView from './components/LoginView';
import SignUpView from './components/SignUpView';

export default function App() {
  // --- NEW: App Access State ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Global App State
  const [currentView, setCurrentView] = useState('login'); // 'login', 'signup', 'home', etc.
  const [dementiaMode, setDementiaMode] = useState(false);
  const [inSafeZone, setInSafeZone] = useState(true);
  const [userName, setUserName] = useState('Dadaji');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Dynamic Data State
  const [medicines, setMedicines] = useState([]);
  const [contacts, setContacts] = useState([]);

  // Voice Accessibility State
  const [isListening, setIsListening] = useState(false);
  const [voiceToast, setVoiceToast] = useState(null);
  const recognitionRef = useRef(null);

  // SOS Feature State
  const [sosActive, setSosActive] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(5);
  const [sosSuccess, setSosSuccess] = useState(false);

  // Family Speed Dial State
  const [showFamily, setShowFamily] = useState(false);
  const [callingToast, setCallingToast] = useState(null);

  // --- ACTIONS ---
  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentView('home');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView('login');
  };

  const addMedicine = (newMed) => {
    setMedicines([...medicines, newMed]);
  };

  const toggleMedicine = (index) => {
    const newMedicines = [...medicines];
    newMedicines[index].isTaken = !newMedicines[index].isTaken;
    setMedicines(newMedicines);
  };

  const addContact = (newContact) => {
    setContacts([...contacts, newContact]);
  };

  // --- EFFECTS ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };
  const greeting = getGreeting();

  useEffect(() => {
    document.documentElement.classList.add('dark'); // Force dark mode for this design
  }, []);

  useEffect(() => {
    let timer;
    if (sosActive && sosCountdown > 0) {
      timer = setTimeout(() => setSosCountdown((prev) => prev - 1), 1000);
    } else if (sosActive && sosCountdown === 0) {
      setSosActive(false);
      setSosSuccess(true);
    }
    return () => clearTimeout(timer);
  }, [sosActive, sosCountdown]);

  // Voice Recognition Setup (Logic preserved)
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onstart = () => { setIsListening(true); setVoiceToast('Listening...'); };
      recognitionRef.current.onend = () => { setIsListening(false); setVoiceToast(null); };
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toUpperCase();
        if (transcript.includes('HELP')) triggerSos();
        else if (transcript.includes('MEDICINE')) setCurrentView('medicines');
        else if (transcript.includes('HOME')) { setCurrentView('home'); setShowFamily(false); }
        else if (transcript.includes('SETTINGS')) setCurrentView('settings');
        else { setVoiceToast(`Unknown: "${transcript}"`); setTimeout(() => setVoiceToast(null), 2000); }
      };
      recognitionRef.current.onerror = (event) => {
        console.error("Speech Recognition Error", event.error);
        setIsListening(false);
        setVoiceToast('Voice Error. Try again.');
        setTimeout(() => setVoiceToast(null), 2000);
      };
    } else {
      console.warn("Web Speech API not supported.");
    }
  }, []);

  const handleMicClick = () => {
    if (!recognitionRef.current) { alert("Voice control not supported."); return; }
    if (isListening) recognitionRef.current.stop();
    else recognitionRef.current.start();
  };

  const triggerSos = () => { setSosActive(true); setSosCountdown(5); setSosSuccess(false); };
  const cancelSos = () => { setSosActive(false); setSosCountdown(5); };
  const handleCall = (name) => { setCallingToast(`Calling ${name}...`); setTimeout(() => { setCallingToast(null); setShowFamily(false); }, 3000); };
  
  // --- Futuristic UI Renderers ---

  const renderFamilyList = () => {
    if (contacts.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-xl text-white/70 mb-4">No family members added.</p>
                <button 
                    onClick={() => { setShowFamily(false); setCurrentView('settings'); }}
                    className="text-indigo-400 font-bold underline text-lg"
                >
                    Go to Settings to Add
                </button>
            </div>
        )
    }
    return (
        <div className="grid grid-cols-2 gap-4">
            {contacts.map((contact, index) => (
                <button
                    key={index}
                    onClick={() => handleCall(contact.name)}
                    className="flex flex-col items-center justify-center p-6 gap-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg hover:shadow-indigo-500/40 active:scale-95 transition-all"
                >
                    <div className="p-4 rounded-full bg-indigo-900/50">
                        <User className="w-10 h-10 text-indigo-300" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">{contact.name}</span>
                    <span className="text-sm text-white/60 font-medium">{contact.role}</span>
                </button>
            ))}
        </div>
    );
  };

  // Main App Render
  if (!isLoggedIn) {
    if (currentView === 'signup') {
        return (
            <div className="min-h-screen font-sans bg-[length:200%_200%] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black animate-background-pan">
                <SignUpView onBack={() => setCurrentView('login')} onAddContact={addContact} onAddMedicine={addMedicine} onUpdateUser={setUserName} />
            </div>
        )
    }
    return (
      <div className="min-h-screen font-sans bg-[length:200%_200%] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black animate-background-pan">
        <LoginView onLogin={handleLogin} onNavigate={setCurrentView} />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-white bg-[length:200%_200%] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black animate-background-pan relative pb-32">
      
      {/* --- Overlays & Modals (Upgraded Style) --- */}
      {sosActive && (
        <div className="fixed inset-0 z-[100] bg-red-900/50 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-white text-center">
            <AlertTriangle className="w-32 h-32 mb-8 text-red-400 animate-heartbeat" strokeWidth={2.5} />
            <h2 className="text-5xl font-bold tracking-tight mb-4">EMERGENCY ALERT</h2>
            <p className="text-2xl opacity-80 mb-12">Notifying family and services...</p>
            <div className="text-[10rem] font-bold leading-none mb-12">{sosCountdown}</div>
            <button onClick={cancelSos} className="bg-white/90 text-red-600 px-12 py-6 rounded-full text-3xl font-bold shadow-2xl hover:scale-105 active:scale-100 transition-transform">
                CANCEL
            </button>
        </div>
      )}

      {sosSuccess && (
        <div className="fixed inset-0 z-[100] bg-emerald-900/50 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-white text-center">
            <div className="bg-white/10 p-8 rounded-full mb-8 backdrop-blur-md border border-white/20">
                <Phone className="w-32 h-32 text-emerald-400" strokeWidth={2.5} />
            </div>
            <h2 className="text-4xl font-bold tracking-tight mb-4">Help is on the way!</h2>
            <p className="text-2xl opacity-80 mb-12">Emergency contacts have been notified.</p>
            <button onClick={() => setSosSuccess(false)} className="bg-white/90 text-emerald-800 px-12 py-6 rounded-full text-2xl font-bold shadow-2xl hover:scale-105 active:scale-100 transition-transform">
                All Clear
            </button>
        </div>
      )}

      {showFamily && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-3xl p-6 relative bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                <button onClick={() => setShowFamily(false)} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                    <X className="w-8 h-8" />
                </button>
                <h2 className="text-3xl font-bold tracking-tight mb-8">Quick Dial</h2>
                {renderFamilyList()}
            </div>
        </div>
      )}

      {callingToast && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[60] px-8 py-4 rounded-full shadow-2xl flex items-center gap-4 bg-white/10 backdrop-blur-xl border border-white/20">
              <Phone className="w-6 h-6 text-indigo-400 animate-ping" />
              <span className="text-xl font-bold">{callingToast}</span>
          </div>
      )}

      {/* --- Main UI --- */}
      {currentView === 'home' && (
        <header className="px-6 pt-8 pb-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-extrabold text-indigo-400 tracking-tight">SecondYouth</h1>
            <div className="flex gap-3">
              <button onClick={() => setCurrentView('settings')} className="p-3 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl transition-all">
                <Settings size={24} />
              </button>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{greeting}, {userName}</h2>
            <p className="text-lg font-bold text-white/60">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </header>
      )}

      <main className="p-6 md:p-8 max-w-lg mx-auto flex flex-col gap-6">
        
        {currentView === 'medicines' ? <MedicineList medicines={medicines} toggleMedicine={toggleMedicine} onBack={() => setCurrentView('home')} onNavigate={setCurrentView} />
        : currentView === 'settings' ? <SettingsView onBack={() => setCurrentView('home')} onAddContact={addContact} onAddMedicine={addMedicine} onUpdateUser={setUserName} onLogout={handleLogout} />
        : currentView === 'vision' ? <VisionView onNavigate={setCurrentView} />
        : currentView === 'legacy' ? <LegacyView onNavigate={setCurrentView} />
        : ( /* HOME VIEW */
          <>
            <button onClick={triggerSos} className="h-40 w-full rounded-[2rem] flex items-center justify-center px-8 gap-6 shadow-2xl shadow-red-500/30 transition-all duration-300 active:scale-95 bg-gradient-to-r from-red-600 to-rose-600 animate-heartbeat">
                <AlertTriangle className="w-20 h-20 text-white" strokeWidth={2.5} />
                <div className="flex flex-col items-start">
                    <span className="text-5xl font-bold tracking-tight">SOS</span>
                    <span className="font-medium text-2xl text-white/80">Emergency Alert</span>
                </div>
            </button>

            <div className="grid grid-cols-2 gap-6">
              <button onClick={() => setCurrentView('medicines')} className="h-40 w-full rounded-[2rem] flex flex-col items-center justify-center p-6 gap-3 shadow-xl hover:shadow-lg hover:shadow-emerald-500/40 active:scale-95 transition-all bg-gradient-to-br from-emerald-500 to-green-600">
                  <Pill className="w-12 h-12" strokeWidth={2.5} />
                  <span className="text-2xl font-bold tracking-tight">Medicine</span>
              </button>

              <button onClick={() => setShowFamily(true)} className="h-40 w-full rounded-[2rem] flex flex-col items-center justify-center p-6 gap-3 shadow-xl hover:shadow-lg hover:shadow-indigo-500/40 active:scale-95 transition-all bg-gradient-to-br from-blue-500 to-indigo-600">
                  <Phone className="w-12 h-12" strokeWidth={2.5} />
                  <span className="text-2xl font-bold tracking-tight">Family</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <button onClick={() => setCurrentView('vision')} className="h-40 w-full rounded-[2rem] flex flex-col items-center justify-center p-6 gap-3 shadow-xl hover:shadow-lg hover:shadow-amber-500/40 active:scale-95 transition-all bg-gradient-to-br from-amber-400 to-orange-500">
                  <Eye className="w-12 h-12" strokeWidth={2.5} />
                  <span className="text-2xl font-bold tracking-tight">Third Eye</span>
              </button>

              <button onClick={() => setCurrentView('legacy')} className="h-40 w-full rounded-[2rem] flex flex-col items-center justify-center p-6 gap-3 shadow-xl hover:shadow-lg hover:shadow-pink-500/40 active:scale-95 transition-all bg-gradient-to-br from-pink-500 to-rose-500">
                  <BookHeart className="w-12 h-12" strokeWidth={2.5} />
                  <span className="text-2xl font-bold tracking-tight">Legacy Vault</span>
              </button>
            </div>

            {dementiaMode && (
              <section className="rounded-[2rem] p-8 shadow-2xl bg-white/10 backdrop-blur-xl border border-white/20">
                <div className="flex items-center gap-6 mb-4">
                  <MapPin className={`w-12 h-12 ${inSafeZone ? 'text-emerald-400' : 'text-red-400'}`} strokeWidth={3} />
                  <h2 className="text-3xl font-bold tracking-tight">{inSafeZone ? 'In Safe Zone' : 'Zone Breach!'}</h2>
                </div>
                <p className="text-xl font-medium leading-relaxed text-white/70">
                  {inSafeZone ? 'Everything is secure.' : 'You have left the designated safe area!'}
                </p>
                <button onClick={() => setInSafeZone(!inSafeZone)} className="mt-6 text-base font-semibold underline text-white/50 hover:text-white">
                  (Simulate {inSafeZone ? 'Breach' : 'Return'})
                </button>
              </section>
            )}
          </>
        )}
      </main>

      <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-4">
        {voiceToast && (
            <div className="bg-black/80 backdrop-blur text-white px-6 py-3 rounded-2xl shadow-xl text-lg font-medium">
                {voiceToast}
            </div>
        )}
        <button
            onClick={handleMicClick}
            className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 active:scale-95
                ${isListening 
                    ? 'bg-purple-600 scale-110 animate-pulse ring-8 ring-purple-400/50' 
                    : 'bg-gradient-to-r from-purple-600 to-indigo-700 hover:scale-110 hover:shadow-lg hover:shadow-purple-500/40'
                }
            `}
            aria-label="Voice Assistant"
        >
            <div className={`${isListening ? '' : 'animate-ping-slow'}`}/>
            <Mic className="w-10 h-10 text-white" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}