import { useState, useEffect, useRef } from 'react';
import { Settings, Sun, Moon, MapPin, Pill, Phone, AlertTriangle, Mic, X, User, Heart, Stethoscope, Users, Eye, BookHeart } from 'lucide-react';
import MedicineList from './components/MedicineList';
import SettingsView from './components/SettingsView';
import VisionView from './components/VisionView';
import LegacyView from './components/LegacyView';

export default function App() {
  // Global App State
  const [currentView, setCurrentView] = useState('home'); // 'home', 'medicines', 'settings'
  const [dementiaMode, setDementiaMode] = useState(false);
  const [inSafeZone, setInSafeZone] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
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

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
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

  // Dark Mode Class Application
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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
        ${darkMode 
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
                ${darkMode 
                    ? 'bg-slate-800/90 border-slate-600' 
                    : 'bg-white/90 border-white/50'
                }
            `}>
                <button 
                    onClick={() => setShowFamily(false)}
                    className={`absolute top-4 right-4 p-2 rounded-full transition-colors
                        ${darkMode 
                            ? 'bg-slate-700 hover:bg-slate-600 text-gray-300' 
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-500'
                        }
                    `}
                >
                    <X className="w-8 h-8" />
                </button>
                
                <h2 className={`text-3xl font-bold mb-8 px-2 ${darkMode ? 'text-white' : 'text-stone-800'}`}>Quick Dial</h2>
                
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
        <header className={`p-6 backdrop-blur-md shadow-sm sticky top-0 z-10 border-b transition-colors duration-500
            ${darkMode 
                ? 'bg-slate-900/80 border-slate-700' 
                : 'bg-white/80 border-white/50'
            }
        `}>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-extrabold text-indigo-600">
                    SecondYouth
                </h1>
                <div className="flex items-center gap-6 relative">
                    {/* Theme Toggle Button */}
                    <button
                        onClick={toggleDarkMode}
                        className={`p-2 rounded-2xl transition-all active:scale-95 duration-300
                            ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-amber-100/50'}
                        `}
                        aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {darkMode ? (
                            <Sun className="w-10 h-10 text-amber-400 animate-in spin-in-90 duration-500" strokeWidth={2.5} />
                        ) : (
                            <Moon className="w-10 h-10 text-blue-600 animate-in spin-in-90 duration-500" strokeWidth={2.5} />
                        )}
                    </button>
                    
                    <button 
                        onClick={() => setCurrentView('settings')}
                        className={`p-2 rounded-2xl transition-all active:scale-95
                            ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-white/50'}
                        `}
                        aria-label="Settings"
                    >
                        <Settings className={`w-10 h-10 ${darkMode ? 'text-gray-300' : 'text-stone-600'}`} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
            <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                    {getGreeting()}, {userName}
                </h2>
                <p className="text-lg font-bold text-slate-700">
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
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
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
                className={`h-40 w-full backdrop-blur-md border rounded-3xl flex items-center justify-center px-8 gap-6 shadow-xl hover:scale-105 transition-all duration-300 group
                    ${darkMode 
                        ? 'bg-red-900/20 border-red-900 hover:bg-red-900/40 hover:shadow-red-900/50' 
                        : 'bg-red-50/90 border-red-100 hover:shadow-red-200'
                    }
                `}
               >
                <div className={`p-5 rounded-2xl transition-colors
                    ${darkMode 
                        ? 'bg-red-900/50 group-hover:bg-red-800' 
                        : 'bg-red-200 group-hover:bg-red-300'
                    }
                `}>
                  <AlertTriangle className={`w-20 h-20 ${darkMode ? 'text-red-400' : 'text-red-700'}`} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col items-start">
                    <span className={`text-5xl font-bold ${darkMode ? 'text-red-200' : 'text-red-900'}`}>SOS Alert</span>
                    <span className={`font-medium text-2xl ${darkMode ? 'text-red-400' : 'text-red-700/80'}`}>Emergency Help</span>
                </div>
              </button>

            {/* Primary Grid */}
            <div className="grid grid-cols-2 gap-6">
              {/* Medicine Button */}
              <button 
                onClick={() => setCurrentView('medicines')}
                className={`h-40 w-full backdrop-blur-md border rounded-3xl flex flex-col items-center justify-center p-6 gap-3 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group
                    ${darkMode 
                        ? 'bg-slate-800/80 border-slate-700 hover:border-emerald-500/50' 
                        : 'bg-white/90 border-white/50'
                    }
                `}
              >
                <div className={`p-4 rounded-full transition-colors
                    ${darkMode 
                        ? 'bg-emerald-900/30 group-hover:bg-emerald-800/50' 
                        : 'bg-emerald-100 group-hover:bg-emerald-200'
                    }
                `}>
                  <Pill className={`w-12 h-12 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col items-center">
                    <span className={`text-2xl font-bold transition-colors ${
                        darkMode 
                        ? 'text-gray-100 group-hover:text-emerald-300' 
                        : 'text-stone-800 group-hover:text-emerald-800'
                    }`}>Medicine</span>
                </div>
              </button>

              {/* Family Button */}
              <button 
                onClick={() => setShowFamily(true)}
                className={`h-40 w-full backdrop-blur-md border rounded-3xl flex flex-col items-center justify-center p-6 gap-3 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group
                    ${darkMode 
                        ? 'bg-slate-800/80 border-slate-700 hover:border-blue-500/50' 
                        : 'bg-white/90 border-white/50'
                    }
                `}
              >
                <div className={`p-4 rounded-full transition-colors
                    ${darkMode 
                        ? 'bg-blue-900/30 group-hover:bg-blue-800/50' 
                        : 'bg-blue-100 group-hover:bg-blue-200'
                    }
                `}>
                  <Phone className={`w-12 h-12 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col items-center">
                    <span className={`text-2xl font-bold transition-colors ${
                        darkMode 
                        ? 'text-gray-100 group-hover:text-blue-300' 
                        : 'text-stone-800 group-hover:text-blue-800'
                    }`}>Family</span>
                </div>
              </button>
            </div>

            {/* Secondary Grid */}
            <div className="grid grid-cols-2 gap-6">
              {/* Third Eye Button */}
              <button 
                onClick={() => setCurrentView('vision')}
                className={`h-40 w-full backdrop-blur-md border rounded-3xl flex flex-col items-center justify-center p-6 gap-3 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group
                    ${darkMode 
                        ? 'bg-slate-800/80 border-slate-700 hover:border-yellow-500/50' 
                        : 'bg-white/90 border-white/50'
                    }
                `}
              >
                <div className={`p-4 rounded-full transition-colors
                    ${darkMode 
                        ? 'bg-yellow-900/30 group-hover:bg-yellow-800/50' 
                        : 'bg-yellow-100 group-hover:bg-yellow-200'
                    }
                `}>
                  <Eye className={`w-12 h-12 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col items-center">
                    <span className={`text-2xl font-bold transition-colors ${
                        darkMode 
                        ? 'text-gray-100 group-hover:text-yellow-300' 
                        : 'text-stone-800 group-hover:text-yellow-800'
                    }`}>Third Eye</span>
                </div>
              </button>

              {/* Legacy Vault Button */}
              <button 
                onClick={() => setCurrentView('legacy')}
                className={`h-40 w-full backdrop-blur-md border rounded-3xl flex flex-col items-center justify-center p-6 gap-3 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group
                    ${darkMode 
                        ? 'bg-slate-800/80 border-slate-700 hover:border-rose-500/50' 
                        : 'bg-white/90 border-white/50'
                    }
                `}
              >
                <div className={`p-4 rounded-full transition-colors
                    ${darkMode 
                        ? 'bg-rose-900/30 group-hover:bg-rose-800/50' 
                        : 'bg-rose-100 group-hover:bg-rose-200'
                    }
                `}>
                  <BookHeart className={`w-12 h-12 ${darkMode ? 'text-rose-400' : 'text-rose-600'}`} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col items-center">
                    <span className={`text-2xl font-bold transition-colors ${
                        darkMode 
                        ? 'text-gray-100 group-hover:text-rose-300' 
                        : 'text-stone-800 group-hover:text-rose-800'
                    }`}>Legacy Vault</span>
                </div>
              </button>
            </div>

            {/* Safe Zone Card (Conditional) */}
            {dementiaMode && (
              <section 
                className={`rounded-3xl p-8 border shadow-xl backdrop-blur-md transition-all duration-500
                    ${inSafeZone 
                        ? (darkMode 
                            ? 'bg-slate-800/80 border-emerald-700' 
                            : 'bg-white/80 border-emerald-200'
                          )
                        : (darkMode
                            ? 'bg-red-900/60 border-red-700 animate-pulse'
                            : 'bg-red-50/90 border-red-300 animate-pulse'
                          )
                    }
                `}
              >
                <div className="flex items-center gap-6 mb-4">
                  <div className={`p-3 rounded-2xl ${
                      inSafeZone 
                      ? (darkMode ? 'bg-emerald-900/50' : 'bg-emerald-100') 
                      : (darkMode ? 'bg-red-900/50' : 'bg-red-100')
                    }`}>
                    <MapPin className={`w-12 h-12 ${
                        inSafeZone 
                        ? (darkMode ? 'text-emerald-400' : 'text-emerald-600') 
                        : (darkMode ? 'text-red-400' : 'text-red-600')
                    }`} strokeWidth={3} />
                  </div>
                  <h2 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-stone-800'}`}>
                    {inSafeZone ? 'Safe Zone' : 'ALERT!'}
                  </h2>
                </div>
                <p className={`text-2xl font-medium leading-relaxed ${darkMode ? 'text-gray-300' : 'text-stone-700'}`}>
                  {inSafeZone ? 'You are currently in the safe zone.' : 'You have left the designated safe zone!'}
                </p>
                
                <button 
                  onClick={() => setInSafeZone(!inSafeZone)} 
                  className={`mt-6 text-base font-semibold underline ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-stone-400 hover:text-stone-600'}`}
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