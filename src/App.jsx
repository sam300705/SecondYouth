import { useState, useEffect, useRef } from 'react';
import { Settings, Sun, Moon, MapPin, Pill, Phone, AlertTriangle, Mic, X, User, Eye, BookHeart } from 'lucide-react';
import MedicineList from './components/MedicineList';
import SettingsView from './components/SettingsView';
import VisionView from './components/VisionView';
import LegacyView from './components/LegacyView';

export default function App() {
  // Global App State
  const [currentView, setCurrentView] = useState('home'); // 'home', 'medicines', 'settings'
  const [dementiaMode, setDementiaMode] = useState(false);
  const [inSafeZone, setInSafeZone] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
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
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };
  const greeting = getGreeting();

  // Dark Mode Class Application
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // SOS Countdown Logic
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

  // Voice Recognition Setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setVoiceToast('Listening... Say "Help" or "Medicine"');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setVoiceToast(null);
      };

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toUpperCase();
        console.log("Voice Command:", transcript);

        if (transcript.includes('HELP') || transcript.includes('BACHAO')) {
           triggerSos();
        } else if (transcript.includes('MEDICINE') || transcript.includes('DAWAI')) {
           setCurrentView('medicines');
        } else if (transcript.includes('HOME') || transcript.includes('GHAR')) {
           setCurrentView('home');
           setShowFamily(false);
        } else if (transcript.includes('SETTINGS')) {
           setCurrentView('settings');
        } else {
           setVoiceToast(`Did not understand: "${transcript}"`);
           setTimeout(() => setVoiceToast(null), 2000);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech Recognition Error", event.error);
        setIsListening(false);
        setVoiceToast('Error listening. Try again.');
        setTimeout(() => setVoiceToast(null), 2000);
      };

    } else {
      console.warn("Web Speech API not supported in this browser.");
    }
  }, []);

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      alert("Voice control not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const triggerSos = () => {
    setSosActive(true);
    setSosCountdown(5);
    setSosSuccess(false);
  };

  const cancelSos = () => {
    setSosActive(false);
    setSosCountdown(5);
  };

  const handleCall = (name) => {
    setCallingToast(`Calling ${name}...`);
    setTimeout(() => {
        setCallingToast(null);
        setShowFamily(false);
    }, 3000);
  };

  // Helper for rendering empty family list
  const renderFamilyList = () => {
    if (contacts.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-xl text-stone-500 dark:text-gray-400 mb-4">No family members added.</p>
                <button 
                    onClick={() => { setShowFamily(false); setCurrentView('settings'); }}
                    className="text-blue-600 dark:text-blue-400 font-bold underline text-lg"
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
                    className="flex flex-col items-center justify-center p-6 gap-3 rounded-2xl bg-white/50 dark:bg-slate-700/50 border border-stone-200 dark:border-slate-600 shadow-sm hover:shadow-md hover:border-purple-300 dark:hover:border-purple-500 hover:scale-105 transition-all active:scale-95"
                >
                    <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                        <User className="w-10 h-10" />
                    </div>
                    <span className="text-xl font-bold text-stone-700 dark:text-gray-200">{contact.name}</span>
                    <span className="text-sm text-stone-500 dark:text-gray-400 font-medium">{contact.role}</span>
                </button>
            ))}
        </div>
    );
  };


  return (
    <div className={`min-h-screen font-sans selection:bg-purple-200 relative pb-32 transition-colors duration-700
        ${isDarkMode 
            ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 text-gray-100' // Deep Midnight
            : 'bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 text-stone-900' // Warm Dawn
        }
    `}>
      
      {/* SOS Overlay */}
      {sosActive && (
        <div className="fixed inset-0 z-[100] bg-red-600 flex flex-col items-center justify-center p-8 animate-fade-in text-white text-center">
            <AlertTriangle className="w-32 h-32 mb-8 animate-pulse" strokeWidth={2} />
            <h2 className="text-5xl font-bold mb-4">EMERGENCY ALERT</h2>
            <p className="text-2xl opacity-90 mb-12">Notifying contacts in...</p>
            <div className="text-[10rem] font-bold leading-none mb-12">{sosCountdown}</div>
            <button 
                onClick={cancelSos}
                className="bg-white text-red-600 px-12 py-6 rounded-full text-3xl font-bold shadow-2xl hover:scale-105 transition-transform"
            >
                CANCEL
            </button>
        </div>
      )}

      {/* SOS Success Screen */}
      {sosSuccess && (
        <div className="fixed inset-0 z-[100] bg-emerald-600 flex flex-col items-center justify-center p-8 animate-fade-in text-white text-center">
            <div className="bg-white/20 p-8 rounded-full mb-8 backdrop-blur-md">
                <Phone className="w-32 h-32 text-white" strokeWidth={2} />
            </div>
            <h2 className="text-4xl font-bold mb-4">Help is on the way!</h2>
            <p className="text-2xl opacity-90 mb-12">Emergency contacts have been notified.</p>
            <button 
                onClick={() => setSosSuccess(false)}
                className="bg-white text-emerald-600 px-12 py-6 rounded-full text-2xl font-bold shadow-2xl hover:scale-105 transition-transform"
            >
                Close
            </button>
        </div>
      )}

      {/* Family Speed Dial Modal */}
      {showFamily && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className={`backdrop-blur-xl border rounded-3xl shadow-2xl p-6 w-full max-w-lg relative transition-colors duration-500
                ${isDarkMode 
                    ? 'bg-slate-800/90 border-slate-600' 
                    : 'bg-white/90 border-white/50'
                }
            `}>
                <button 
                    onClick={() => setShowFamily(false)}
                    className={`absolute top-4 right-4 p-2 rounded-full transition-colors
                        ${isDarkMode 
                            ? 'bg-slate-700 hover:bg-slate-600 text-gray-300' 
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-500'
                        }
                    `}
                >
                    <X className="w-8 h-8" />
                </button>
                
                <h2 className={`text-3xl font-bold mb-8 px-2 ${isDarkMode ? 'text-white' : 'text-stone-800'}`}>Quick Dial</h2>
                
                {renderFamilyList()}
            </div>
        </div>
      )}

      {/* Calling Toast */}
      {callingToast && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[60] bg-stone-800 dark:bg-slate-700 text-white px-8 py-4 rounded-full shadow-2xl animate-bounce-in flex items-center gap-4">
              <Phone className="w-6 h-6 animate-ping" />
              <span className="text-xl font-bold">{callingToast}</span>
          </div>
      )}

      {/* Header */}
      {currentView === 'home' && (
        <header className="px-6 pt-8 pb-4">
          {/* Top Row: Brand & Toggles */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-extrabold text-indigo-600 tracking-tight">SecondYouth</h1>
            <div className="flex gap-3">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white transition-all">
                {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
              </button>
              <button onClick={() => setCurrentView('settings')} className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white transition-all">
                <Settings size={24} />
              </button>
            </div>
          </div>
        {/* Bottom Row: Greeting (FORCED DARK TEXT IN LIGHT MODE) */}
        <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                {greeting}, {userName}
            </h2>
            <p className="text-lg font-bold text-slate-700 dark:text-slate-400">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
        </div>
      </header>
      )}

      {/* Main Content */}
      <main className="p-6 md:p-8 max-w-lg mx-auto flex flex-col gap-8">
        
        {currentView === 'medicines' ? (
          <MedicineList 
            medicines={medicines} 
            toggleMedicine={toggleMedicine} 
            onBack={() => setCurrentView('home')} 
            onNavigate={setCurrentView}
          />
        ) : currentView === 'settings' ? (
          <SettingsView 
            onBack={() => setCurrentView('home')}
            onAddContact={addContact}
            onAddMedicine={addMedicine}
            darkMode={isDarkMode}
            toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
            dementiaMode={dementiaMode}
            toggleDementiaMode={() => setDementiaMode(!dementiaMode)}
            onUpdateUser={setUserName}
          />
        ) : currentView === 'vision' ? (
          <VisionView onNavigate={setCurrentView} />
        ) : currentView === 'legacy' ? (
          <LegacyView onNavigate={setCurrentView} />
        ) : (
          /* HOME VIEW */
          <>
            {/* SOS Button */}
            <button 
                onClick={triggerSos}
                className={`h-40 w-full rounded-[2rem] flex items-center justify-center px-8 gap-6 shadow-xl shadow-red-500/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 group bg-gradient-to-r from-red-500 via-red-600 to-rose-600 animate-pulse`}
               >
                <div className={`p-5 rounded-2xl`}>
                  <AlertTriangle className={`w-20 h-20 text-white`} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col items-start">
                    <span className={`text-5xl font-bold text-white`}>SOS Alert</span>
                    <span className={`font-medium text-2xl text-white/80`}>Emergency Help</span>
                </div>
              </button>

            {/* Primary Grid */}
            <div className="grid grid-cols-2 gap-6">
              {/* Medicine Button */}
              <button 
                onClick={() => setCurrentView('medicines')}
                className={`h-40 w-full rounded-[2rem] flex flex-col items-center justify-center p-6 gap-3 shadow-xl shadow-slate-200/50 transition-all duration-300 hover:scale-[1.02] active:scale-95 group bg-gradient-to-br from-emerald-400 to-green-600`}
              >
                <div className={`p-4 rounded-full`}>
                  <Pill className={`w-12 h-12 text-white`} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col items-center">
                    <span className={`text-2xl font-bold text-white`}>Medicine</span>
                </div>
              </button>

              {/* Family Button */}
              <button 
                onClick={() => setShowFamily(true)}
                className={`h-40 w-full rounded-[2rem] flex flex-col items-center justify-center p-6 gap-3 shadow-xl shadow-slate-200/50 transition-all duration-300 hover:scale-[1.02] active:scale-95 group bg-gradient-to-br from-blue-400 to-indigo-600`}
              >
                <div className={`p-4 rounded-full`}>
                  <Phone className={`w-12 h-12 text-white`} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col items-center">
                    <span className={`text-2xl font-bold text-white`}>Family</span>
                </div>
              </button>
            </div>

            {/* Secondary Grid */}
            <div className="grid grid-cols-2 gap-6">
              {/* Third Eye Button */}
              <button 
                onClick={() => setCurrentView('vision')}
                className={`h-40 w-full rounded-[2rem] flex flex-col items-center justify-center p-6 gap-3 shadow-xl shadow-slate-200/50 transition-all duration-300 hover:scale-[1.02] active:scale-95 group bg-gradient-to-br from-amber-400 to-orange-500`}
              >
                <div className={`p-4 rounded-full`}>
                  <Eye className={`w-12 h-12 text-white`} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col items-center">
                    <span className={`text-2xl font-bold text-white`}>Third Eye</span>
                </div>
              </button>

              {/* Legacy Vault Button */}
              <button 
                onClick={() => setCurrentView('legacy')}
                className={`h-40 w-full rounded-[2rem] flex flex-col items-center justify-center p-6 gap-3 shadow-xl shadow-slate-200/50 transition-all duration-300 hover:scale-[1.02] active:scale-95 group bg-gradient-to-br from-pink-500 to-rose-500`}
              >
                <div className={`p-4 rounded-full`}>
                  <BookHeart className={`w-12 h-12 text-white`} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col items-center">
                    <span className={`text-2xl font-bold text-white`}>Legacy Vault</span>
                </div>
              </button>
            </div>

            {/* Safe Zone Card (Conditional) */}
            {dementiaMode && (
              <section 
                className={`rounded-[2rem] p-8 shadow-xl transition-all duration-500 bg-slate-900/90 text-white backdrop-blur-md`}
              >
                <div className="flex items-center gap-6 mb-4">
                  <div className={`p-3 rounded-2xl`}>
                    <MapPin className={`w-12 h-12 ${inSafeZone ? 'text-emerald-400' : 'text-red-400'}`} strokeWidth={3} />
                  </div>
                  <h2 className={`text-3xl font-bold tracking-tight text-white`}>
                    {inSafeZone ? 'Safe Zone' : 'ALERT!'}
                  </h2>
                </div>
                <p className={`text-2xl font-medium leading-relaxed text-gray-300`}>
                  {inSafeZone ? 'You are currently in the safe zone.' : 'You have left the designated safe zone!'}
                </p>
                
                <button 
                  onClick={() => setInSafeZone(!inSafeZone)} 
                  className={`mt-6 text-base font-semibold underline text-gray-500 hover:text-gray-300`}
                >
                  (Tap to Simulate {inSafeZone ? 'Breach' : 'Safety'})
                </button>
              </section>
            )}
          </>
        )}
      </main>

      {/* Voice Assistant FAB */}
      <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-4">
        {voiceToast && (
            <div className="bg-stone-900/90 backdrop-blur text-white px-6 py-3 rounded-2xl shadow-xl animate-bounce-in text-lg font-medium">
                {voiceToast}
            </div>
        )}
        
        <button
            onClick={handleMicClick}
            className={`
                w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300
                ${isListening 
                    ? 'bg-purple-600 scale-110 animate-pulse ring-8 ring-purple-300/50' 
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-110 hover:shadow-purple-500/50'
                }
            `}
            aria-label="Voice Assistant"
        >
            <Mic className="w-10 h-10 text-white" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
