import { useState } from 'react';
import { ArrowLeft, UserPlus, Phone, Shield } from 'lucide-react';

export default function SignUpView({ onBack }) {
  // State for forms
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = () => {
    if (fullName && phone && emergencyContact && password) {
      alert('Account Created! Please login.');
      onBack();
    } else {
      alert('Please fill all fields.');
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
        <h2 className="text-4xl font-bold tracking-tight">Create Account</h2>
      </div>

      {/* SignUp Form */}
      <section className={sectionClasses}>
        <div className="flex items-center gap-3 mb-2">
            <UserPlus className="w-8 h-8 text-indigo-400" />
            <h3 className="text-2xl font-bold tracking-tight">Your Details</h3>
        </div>
        <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClasses} />
        <input type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClasses} />
        <input type="tel" placeholder="Emergency Contact Number" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} className={inputClasses} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClasses} />
        
        <button onClick={handleSignUp} className={`${buttonClasses} mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-purple-500/50`}>
          Create Account
        </button>
      </section>
    </div>
  );
}