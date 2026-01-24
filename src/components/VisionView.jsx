import { useState, useEffect } from 'react';
import { Eye, X, ScanLine, AlertTriangle, MoveLeft } from 'lucide-react';

export default function VisionView({ onNavigate }) {
  const [scenario, setScenario] = useState('medicine');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);

  const scenarios = {
    medicine: {
      text: 'This is Atorvastatin. Expiry Date: Dec 2026. Safe to take.',
      type: 'safe',
    },
    bill: {
      text: 'Electricity Bill. Amount: ₹450. Due Date: Tomorrow.',
      type: 'info',
    },
    cleaner: {
      text: 'DANGER! This is Toilet Cleaner. Toxic. Do not use on skin.',
      type: 'danger',
    },
  };

  const handleIdentify = () => {
    setIsScanning(true);
    setResult(null);

    setTimeout(() => {
      const scenarioResult = scenarios[scenario];
      setResult(scenarioResult);
      setIsScanning(false);
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(scenarioResult.text));
    }, 3000);
  };

  const renderResult = () => {
    if (!result) return null;

    let bgColor = 'bg-blue-500';
    if (result.type === 'danger') bgColor = 'bg-red-600';
    if (result.type === 'safe') bgColor = 'bg-green-600';

    return (
      <div className={`absolute inset-0 bg-black/50 flex items-center justify-center p-8 z-20`}>
        <div className={`text-white text-center rounded-2xl p-8 ${bgColor}`}>
          {result.type === 'danger' && <AlertTriangle className="w-16 h-16 mx-auto mb-4" />}
          <p className="text-2xl font-bold">{result.text}</p>
          <button
            onClick={() => setResult(null)}
            className="mt-6 bg-white/20 px-8 py-3 rounded-full text-lg font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-800 text-white flex flex-col items-center justify-center font-sans">
      <div className="absolute top-4 left-4 z-10">
        <button onClick={() => onNavigate('home')} className="flex items-center gap-2 text-gray-300 hover:text-white bg-black/20 p-3 rounded-lg">
          <MoveLeft className="w-8 h-8" />
          <span className="font-bold text-lg">Back to Home</span>
        </button>
      </div>

      <div className="absolute top-4 right-4 z-10">
        <select
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm"
        >
          <option value="medicine">Medicine Bottle</option>
          <option value="bill">Electricity Bill</option>
          <option value="cleaner">Shampoo vs Cleaner</option>
        </select>
      </div>

      <div className="w-full max-w-md h-96 bg-black rounded-lg border-4 border-gray-600 flex items-center justify-center overflow-hidden relative">
        <p className="text-gray-400">Camera Feed Placeholder</p>
        {isScanning && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="w-full h-full relative">
              <ScanLine className="absolute top-0 left-0 w-full h-12 text-blue-400 animate-scan" />
            </div>
            <p className="text-2xl font-bold">Scanning...</p>
          </div>
        )}
      </div>

      <div className="mt-8">
        <button
          onClick={handleIdentify}
          disabled={isScanning}
          className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg transform active:scale-95 transition-transform"
        >
          <span className="text-black font-bold text-center text-sm leading-tight">IDENTIFY OBJECT</span>
        </button>
      </div>

      {renderResult()}
    </div>
  );
}

// Add this CSS to your App.css or index.css for the scanning animation
/*
@keyframes scan {
  0% { transform: translateY(0); }
  100% { transform: translateY(calc(100% - 3rem)); }
}

.animate-scan {
  animation: scan 3s linear infinite;
}
*/
