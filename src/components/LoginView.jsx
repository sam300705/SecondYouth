import React, { useState } from 'react';
import { User, Lock, Fingerprint, UserPlus } from 'lucide-react';

const LoginView = ({ onLogin, onNavigate }) => {
  const [isScanning, setIsScanning] = useState(false);

  const handleFaceIdLogin = () => {
    setIsScanning(true);
    setTimeout(() => {
      onLogin();
    }, 2000);
  };

  return (
    <div className="flex items-center justify-center h-screen w-full">
      <div className="w-full max-w-md p-8 space-y-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            SecondYouth
          </h1>
          <p className="text-lg text-white/70">
            Secure Access Portal
          </p>
        </div>

        {/* Face ID Button */}
        <button
          onClick={handleFaceIdLogin}
          disabled={isScanning}
          className="w-full h-32 flex flex-col items-center justify-center p-6 rounded-2xl bg-white/20 hover:bg-white/30 active:scale-95 transition-all duration-300 relative overflow-hidden"
        >
          {isScanning ? (
            <>
              <div className="relative w-16 h-16 flex items-center justify-center mb-2">
                <User className="w-14 h-14 text-white/50" />
                <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400 animate-scan-line" style={{ boxShadow: '0 0 10px #22d3ee' }}/>
              </div>
              <span className="text-lg font-bold text-white/90">Scanning...</span>
            </>
          ) : (
            <>
              <Fingerprint className="w-14 h-14 text-white mb-2" />
              <span className="text-xl font-bold text-white">
                Scan Face ID
              </span>
            </>
          )}
        </button>
        
        <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/20"></div></div>
            <div className="relative px-2 bg-slate-800/50 rounded-full"><span className="text-sm text-white/50">OR</span></div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <User className="absolute w-5 h-5 text-white/50 left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Username"
              className="w-full py-3 pl-12 pr-4 text-base text-white bg-black/20 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-white/50"
            />
          </div>
          <div className="relative">
            <Lock className="absolute w-5 h-5 text-white/50 left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="password"
              placeholder="Password"
              className="w-full py-3 pl-12 pr-4 text-base text-white bg-black/20 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-white/50"
            />
          </div>
        </div>

        <button
          onClick={onLogin}
          className="w-full py-4 text-xl font-bold text-white rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-glow-indigo transition-shadow focus:outline-none active:scale-95"
        >
          Login with Password
        </button>

        {/* --- NEW REGISTRATION BUTTON --- */}
        <div className="text-center border-t border-white/20 pt-6">
            <button
                onClick={() => alert("Redirecting to Sign Up page...")} // Placeholder for onNavigate('signup')
                className="w-full py-4 text-xl font-bold text-purple-300 rounded-xl bg-purple-900/50 hover:bg-purple-900/80 transition-all active:scale-95 border border-purple-600"
            >
                <div className="flex items-center justify-center gap-3">
                    <UserPlus className="w-6 h-6" />
                    <span>New User? Create Account</span>
                </div>
            </button>
        </div>
      </div>
    </div>
  );
};

export default LoginView;

