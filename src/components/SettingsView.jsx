import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, UserPlus, Pill, Shield, LogOut } from 'lucide-react';

export default function SettingsView({ onBack, onAddContact, onAddMedicine, dementiaMode, toggleDementiaMode, onUpdateUser, onLogout, highlightMedicine }) {
  // State for forms
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRelation, setContactRelation] = useState('');
  const [profileName, setProfileName] = useState('');
  const [medName, setMedName] = useState('');
  const [medTime, setMedTime] = useState('');
  const [medShape, setMedShape] = useState('Round');
  const [medColor, setMedColor] = useState('red');

  const medicineSectionRef = useRef(null);

  useEffect(() => {
    if (highlightMedicine && medicineSectionRef.current) {
      medicineSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Optional: Flash the section to draw attention
      medicineSectionRef.current.classList.add('ring-4', 'ring-emerald-500', 'transition-all', 'duration-300');
      setTimeout(() => {
        if (medicineSectionRef.current) {
            medicineSectionRef.current.classList.remove('ring-4', 'ring-emerald-500');
        }
      }, 2000);
    }
  }, [highlightMedicine]);

  const handleSaveContact = () => {
    if (contactName && contactPhone && contactRelation) {
      onAddContact({ name: contactName, phone: contactPhone, role: contactRelation });
      setContactName(''); setContactPhone(''); setContactRelation('');
      alert('Contact Saved!');
    }
  };

  const handleSaveMedicine = () => {
    if (medName && medTime) {
      onAddMedicine({ name: medName, time: medTime, shape: medShape, color: medColor, isTaken: false });
      setMedName(''); setMedTime('');
      alert('Medicine Added!');
    }
  };
  
  const handleSaveProfile = () => {
    if (profileName) {
      onUpdateUser(profileName);
      alert('Profile Saved!');
    }
  };

  // Glassmorphism classes for sections
  const sectionClasses = "bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl p-6 rounded-3xl flex flex-col gap-4";
  const inputClasses = "w-full p-4 rounded-xl text-lg bg-black/20 border border-white/10 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/50 outline-none placeholder:text-white/40";
  const buttonClasses = "w-full p-4 rounded-2xl text-xl font-bold active:scale-95 transition-all shadow-lg";

  return (
    <div className="flex flex-col gap-8 w-full max-w-lg mx-auto py-10 px-4">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-4 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg active:scale-95 transition-all">
          <ArrowLeft className="w-8 h-8" strokeWidth={3} />
        </button>
        <h2 className="text-4xl font-bold tracking-tight">Settings</h2>
      </div>

      {/* Profile Settings */}
      <section className={sectionClasses}>
        <div className="flex items-center gap-3 mb-2">
            <UserPlus className="w-8 h-8 text-indigo-400" />
            <h3 className="text-2xl font-bold tracking-tight">Profile</h3>
        </div>
        <input type="text" placeholder="Enter Your Name" value={profileName} onChange={(e) => setProfileName(e.target.value)} className={inputClasses} />
        <button onClick={handleSaveProfile} className={`${buttonClasses} bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-indigo-500/50`}>
          Save Profile
        </button>
      </section>

      {/* Safety Settings */}
      <section className={sectionClasses}>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-red-900/40 rounded-full">
                    <Shield className="w-8 h-8 text-red-400" />
                </div>
                <span className="text-2xl font-bold tracking-tight">Geofencing</span>
            </div>
            <button onClick={toggleDementiaMode} className={`w-24 h-12 rounded-full p-1 transition-colors duration-300 ${dementiaMode ? 'bg-red-500' : 'bg-slate-700'}`}>
                <div className={`w-10 h-10 bg-white rounded-full shadow-md transform transition-transform duration-300 ${dementiaMode ? 'translate-x-12' : 'translate-x-0'}`} />
            </button>
        </div>
        <p className="text-base text-white/60 bg-black/20 p-3 rounded-xl">
            Monitors location and sends alerts if you leave a designated Safe Zone.
        </p>
      </section>

      {/* Add Contact Form */}
      <section className={sectionClasses}>
        <div className="flex items-center gap-3 mb-2">
            <UserPlus className="w-8 h-8 text-blue-400" />
            <h3 className="text-2xl font-bold tracking-tight">Add Family Contact</h3>
        </div>
        <input type="text" placeholder="Name (e.g., Son)" value={contactName} onChange={(e) => setContactName(e.target.value)} className={inputClasses} />
        <input type="tel" placeholder="Phone Number" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className={inputClasses} />
        <input type="text" placeholder="Relation (e.g., Primary)" value={contactRelation} onChange={(e) => setContactRelation(e.target.value)} className={inputClasses} />
        <button onClick={handleSaveContact} className={`${buttonClasses} bg-gradient-to-r from-blue-600 to-sky-500 hover:shadow-blue-500/50`}>
          Save Contact
        </button>
      </section>

      {/* Add Medicine Form */}
      <section ref={medicineSectionRef} className={sectionClasses}>
        <div className="flex items-center gap-3 mb-2">
            <Pill className="w-8 h-8 text-emerald-400" />
            <h3 className="text-2xl font-bold tracking-tight">Add Medicine</h3>
        </div>
        <input type="text" placeholder="Pill Name (e.g., Aspirin)" value={medName} onChange={(e) => setMedName(e.target.value)} className={inputClasses} />
        <input type="time" value={medTime} onChange={(e) => setMedTime(e.target.value)} className={`${inputClasses} text-white/70`} />
        
        <div className="flex gap-4 my-2">
            <button onClick={() => setMedShape('Round')} className={`flex-1 p-4 rounded-2xl border-4 flex flex-col items-center gap-2 transition-all ${medShape === 'Round' ? 'border-emerald-400 bg-black/30' : 'border-white/20 bg-black/10'}`}>
                <div className="w-10 h-10 rounded-full bg-slate-400"></div>
                <span className="font-bold text-white/80">Round</span>
            </button>
            <button onClick={() => setMedShape('Capsule')} className={`flex-1 p-4 rounded-2xl border-4 flex flex-col items-center gap-2 transition-all ${medShape === 'Capsule' ? 'border-emerald-400 bg-black/30' : 'border-white/20 bg-black/10'}`}>
                <div className="w-12 h-8 rounded-full bg-slate-400"></div>
                <span className="font-bold text-white/80">Capsule</span>
            </button>
        </div>

        <div className="flex justify-between gap-2 my-2 bg-black/20 p-4 rounded-2xl">
            {['red', 'blue', 'white', 'yellow'].map((color) => (
                <button key={color} onClick={() => setMedColor(color)} className={`w-14 h-14 rounded-full border-4 shadow-inner transition-transform ${medColor === color ? 'scale-110 border-white' : 'border-transparent'}`} style={{ backgroundColor: color }} aria-label={`Select ${color} color`} />
            ))}
        </div>

        <button onClick={handleSaveMedicine} className={`${buttonClasses} bg-gradient-to-r from-emerald-600 to-green-500 hover:shadow-emerald-500/50`}>
          Add Pill
        </button>
      </section>

      {/* Log Out Button */}
      <section className={sectionClasses}>
        <button onClick={onLogout} className={`${buttonClasses} bg-red-900/50 text-red-300 border-2 border-red-500/80 hover:bg-red-900/80 hover:text-white`}>
          <div className='flex items-center justify-center gap-3'>
            <LogOut />
            Log Out
          </div>
        </button>
      </section>
    </div>
  );
}