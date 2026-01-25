import React, { useState } from 'react';
import { User, Lock } from 'lucide-react';

const LoginScreen = ({ onLogin }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (phoneNumber && password) {
      onLogin(phoneNumber);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-slate-700">
      <div className="w-full max-w-sm p-8 space-y-8 bg-white/10 backdrop-blur-md rounded-2xl shadow-lg">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white">SecondYouth</h1>
        </div>

        <div className="space-y-6">
          <div className="relative">
            <User className="absolute w-6 h-6 text-gray-400 left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="tel"
              placeholder="Phone Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full py-3 pl-12 pr-4 text-lg text-white bg-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="relative">
            <Lock className="absolute w-6 h-6 text-gray-400 left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="password"
placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full py-3 pl-12 pr-4 text-lg text-white bg-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <button
          onClick={handleLogin}
          className="w-full py-4 text-lg font-bold text-white rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;
