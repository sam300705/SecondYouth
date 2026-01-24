import { useState } from 'react';
import { ArrowLeft, Moon, Sun, UserPlus, Plus, Pill, Circle, Shield } from 'lucide-react';

export default function SettingsView({ onBack, onAddContact, onAddMedicine, darkMode, toggleDarkMode, dementiaMode, toggleDementiaMode, onUpdateUser }) {
  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRelation, setContactRelation] = useState('');
  const [profileName, setProfileName] = useState('');

  // Medicine Form State
  const [medName, setMedName] = useState('');
  const [medTime, setMedTime] = useState('');
  const [medShape, setMedShape] = useState('Round'); // 'Round' or 'Capsule'
  const [medColor, setMedColor] = useState('red'); // 'red', 'blue', 'white', 'yellow'

  const handleSaveContact = () => {
    if (contactName && contactPhone && contactRelation) {
      onAddContact({ name: contactName, phone: contactPhone, role: contactRelation });
      setContactName('');
      setContactPhone('');
      setContactRelation('');
      alert('Contact Saved!');
    }
  };

  const handleSaveMedicine = () => {
    if (medName && medTime) {
      onAddMedicine({ 
        name: medName, 
        time: medTime, 
        shape: medShape, 
        color: medColor, 
        isTaken: false 
      });
      setMedName('');
      setMedTime('');
      alert('Medicine Added!');
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full animate-fade-in pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-4 bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-8 h-8 text-stone-600 dark:text-stone-300" strokeWidth={3} />
        </button>
        <h2 className="text-4xl font-bold text-stone-800 dark:text-white">Settings</h2>
      </div>

      {/* Profile Settings */}
      <section className="bg-white dark:bg-stone-800 p-6 rounded-3xl shadow-sm border border-stone-200 dark:border-stone-700 flex flex-col gap-4">
        <div className="flex items-center gap-3 mb-2">
            <UserPlus className="w-8 h-8 text-purple-500" />
            <h3 className="text-2xl font-bold text-stone-800 dark:text-white">Profile Settings</h3>
        </div>
        
        <input 
          type="text" 
          placeholder="Enter Name" 
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
          className="w-full p-4 rounded-xl text-xl border-2 border-stone-200 dark:border-stone-600 bg-transparent dark:text-white focus:border-purple-500 outline-none"
        />
        
        <button 
          onClick={() => {
            onUpdateUser(profileName);
            alert('Profile Saved!');
          }}
          className="mt-2 w-full bg-purple-600 text-white p-4 rounded-2xl text-xl font-bold active:scale-95 transition-transform shadow-lg"
        >
          Save Profile
        </button>
      </section>

      {/* Dark Mode Toggle */}
      <section className="bg-white dark:bg-stone-800 p-6 rounded-3xl shadow-sm border border-stone-200 dark:border-stone-700 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-stone-100 dark:bg-stone-700 rounded-full">
            {darkMode ? <Moon className="w-8 h-8 text-indigo-400" /> : <Sun className="w-8 h-8 text-amber-500" />}
          </div>
          <span className="text-2xl font-bold text-stone-800 dark:text-white">Dark Mode</span>
        </div>
        
        <button 
          onClick={toggleDarkMode}
          className={`w-24 h-12 rounded-full p-1 transition-colors duration-300 ${darkMode ? 'bg-indigo-600' : 'bg-stone-300'}`}
        >
          <div className={`w-10 h-10 bg-white rounded-full shadow-md transform transition-transform duration-300 ${darkMode ? 'translate-x-12' : 'translate-x-0'}`} />
        </button>
      </section>

      {/* Safety Settings */}
      <section className="bg-white dark:bg-stone-800 p-6 rounded-3xl shadow-sm border border-stone-200 dark:border-stone-700 flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-full">
                    <Shield className="w-8 h-8 text-red-500" />
                </div>
                <div className="flex flex-col">
                    <span className="text-2xl font-bold text-stone-800 dark:text-white">Enable Dementia Geofencing</span>
                </div>
            </div>
            
            <button 
                onClick={toggleDementiaMode}
                className={`w-24 h-12 rounded-full p-1 transition-colors duration-300 ${dementiaMode ? 'bg-red-500' : 'bg-stone-300'}`}
            >
                <div className={`w-10 h-10 bg-white rounded-full shadow-md transform transition-transform duration-300 ${dementiaMode ? 'translate-x-12' : 'translate-x-0'}`} />
            </button>
        </div>
        <p className="text-base text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-900/50 p-3 rounded-xl">
            Turn this ON to monitor user location and set Safe Zones.
        </p>
      </section>

      {/* Add Contact Form */}
      <section className="bg-white dark:bg-stone-800 p-6 rounded-3xl shadow-sm border border-stone-200 dark:border-stone-700 flex flex-col gap-4">
        <div className="flex items-center gap-3 mb-2">
            <UserPlus className="w-8 h-8 text-blue-500" />
            <h3 className="text-2xl font-bold text-stone-800 dark:text-white">Add Family</h3>
        </div>
        
        <input 
          type="text" 
          placeholder="Name (e.g., Son)" 
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          className="w-full p-4 rounded-xl text-xl border-2 border-stone-200 dark:border-stone-600 bg-transparent dark:text-white focus:border-blue-500 outline-none"
        />
        <input 
          type="tel" 
          placeholder="Phone Number" 
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          className="w-full p-4 rounded-xl text-xl border-2 border-stone-200 dark:border-stone-600 bg-transparent dark:text-white focus:border-blue-500 outline-none"
        />
        <input 
          type="text" 
          placeholder="Relation (e.g., Primary)" 
          value={contactRelation}
          onChange={(e) => setContactRelation(e.target.value)}
          className="w-full p-4 rounded-xl text-xl border-2 border-stone-200 dark:border-stone-600 bg-transparent dark:text-white focus:border-blue-500 outline-none"
        />
        
        <button 
          onClick={handleSaveContact}
          className="mt-2 w-full bg-blue-600 text-white p-4 rounded-2xl text-xl font-bold active:scale-95 transition-transform shadow-lg"
        >
          Save Contact
        </button>
      </section>

      {/* Add Medicine Form */}
      <section className="bg-white dark:bg-stone-800 p-6 rounded-3xl shadow-sm border border-stone-200 dark:border-stone-700 flex flex-col gap-4">
        <div className="flex items-center gap-3 mb-2">
            <Pill className="w-8 h-8 text-emerald-500" />
            <h3 className="text-2xl font-bold text-stone-800 dark:text-white">Add Medicine</h3>
        </div>

        <input 
          type="text" 
          placeholder="Pill Name" 
          value={medName}
          onChange={(e) => setMedName(e.target.value)}
          className="w-full p-4 rounded-xl text-xl border-2 border-stone-200 dark:border-stone-600 bg-transparent dark:text-white focus:border-emerald-500 outline-none"
        />
        <input 
          type="time" 
          value={medTime}
          onChange={(e) => setMedTime(e.target.value)}
          className="w-full p-4 rounded-xl text-xl border-2 border-stone-200 dark:border-stone-600 bg-transparent dark:text-white focus:border-emerald-500 outline-none"
        />

        {/* Shape Selector */}
        <div className="flex gap-4 my-2">
            <button 
                onClick={() => setMedShape('Round')}
                className={`flex-1 p-4 rounded-2xl border-4 flex flex-col items-center gap-2 transition-all ${medShape === 'Round' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' : 'border-stone-200 dark:border-stone-600'}`}
            >
                <div className="w-10 h-10 rounded-full bg-stone-400"></div>
                <span className="font-bold text-stone-600 dark:text-stone-300">Round</span>
            </button>
            <button 
                onClick={() => setMedShape('Capsule')}
                className={`flex-1 p-4 rounded-2xl border-4 flex flex-col items-center gap-2 transition-all ${medShape === 'Capsule' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' : 'border-stone-200 dark:border-stone-600'}`}
            >
                <div className="w-12 h-8 rounded-full bg-stone-400"></div>
                <span className="font-bold text-stone-600 dark:text-stone-300">Capsule</span>
            </button>
        </div>

        {/* Color Selector */}
        <div className="flex justify-between gap-2 my-2 bg-stone-100 dark:bg-stone-900 p-4 rounded-2xl">
            {['red', 'blue', 'white', 'yellow'].map((color) => (
                <button
                    key={color}
                    onClick={() => setMedColor(color)}
                    className={`w-14 h-14 rounded-full border-4 shadow-sm transition-transform ${medColor === color ? 'scale-110 border-stone-800 dark:border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select ${color} color`}
                />
            ))}
        </div>

        <button 
          onClick={handleSaveMedicine}
          className="mt-2 w-full bg-emerald-600 text-white p-4 rounded-2xl text-xl font-bold active:scale-95 transition-transform shadow-lg"
        >
          Add Pill
        </button>
      </section>
    </div>
  );
}