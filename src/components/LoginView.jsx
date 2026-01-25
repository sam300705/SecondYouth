import React, { useState } from 'react';
import { Fingerprint } from 'lucide-react';

const LoginView = ({ onLogin }) => {
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

        {/* Biometric-Only Login Button */}
        <div className="pt-6 pb-2">
            <button
            onClick={handleFaceIdLogin}
            disabled={isScanning}
            className="w-full h-64 flex flex-col items-center justify-center p-6 rounded-2xl bg-white/20 hover:bg-white/30 active:scale-95 transition-all duration-300 relative overflow-hidden"
            >
            {isScanning ? (
                <>
                <div className="relative w-24 h-24 flex items-center justify-center mb-4">
                    <Fingerprint className="w-24 h-24 text-white/50" />
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-cyan-400 animate-scan-line" style={{ boxShadow: '0 0 15px #22d3ee' }}/>
                </div>
                <span className="text-2xl font-bold text-white/90">Verifying...</span>
                </>
            ) : (
                <>
                <Fingerprint className="w-24 h-24 text-white mb-4" />
                <span className="text-3xl font-bold text-white">
                    Tap to Login
                </span>
                <span className="text-base font-medium text-white/70 mt-1">
                    Secure Face ID Verification
                </span>
                </>
            )}
            </button>
        </div>
        
      </div>
    </div>
  );
};

export default LoginView;