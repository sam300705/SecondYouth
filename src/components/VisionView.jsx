import { useState } from 'react';
import { Eye, X, ScanLine, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function VisionView({ onNavigate }) {
  const [scenario, setScenario] = useState('medicine');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);

  const scenarios = {
    medicine: { text: 'This is Atorvastatin. Expiry: Dec 2026. Safe to take.', type: 'safe' },
    bill: { text: 'Electricity Bill. Amount: ₹450. Due: Tomorrow.', type: 'info' },
    cleaner: { text: 'DANGER! Toilet Cleaner. TOXIC. DO NOT INGEST.', type: 'danger' },
  };

  const handleIdentify = () => {
    setIsScanning(true);
    setResult(null);
    setTimeout(() => {
      const scenarioResult = scenarios[scenario];
      setResult(scenarioResult);
      setIsScanning(false);
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(scenarioResult.text));
    }, 2000);
  };

  const renderResult = () => {
    if (!result) return null;

    let styles = {
        base: 'bg-indigo-900/80 border-indigo-400',
        icon: <Eye className="w-16 h-16 mx-auto mb-4 text-indigo-300" />
    };
    if (result.type === 'danger') {
        styles = { base: 'bg-red-900/80 border-red-400', icon: <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-300" /> };
    }
    if (result.type === 'safe') {
        styles = { base: 'bg-emerald-900/80 border-emerald-400', icon: <Eye className="w-16 h-16 mx-auto mb-4 text-emerald-300" /> };
    }

    return (
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-20">
        <div className={`text-white text-center rounded-3xl p-8 border ${styles.base}`}>
          {styles.icon}
          <p className="text-3xl font-bold tracking-tight">{result.text}</p>
          <button
            onClick={() => setResult(null)}
            className="mt-8 bg-white/10 hover:bg-white/20 border border-white/20 px-10 py-3 rounded-full text-lg font-semibold active:scale-95 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900 text-white flex flex-col items-center justify-center font-sans">
      <div className="absolute top-6 left-6 z-10">
        <button onClick={() => onNavigate('home')} className="flex items-center gap-3 text-white/80 hover:text-white bg-white/10 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-lg active:scale-95 transition-all">
          <ArrowLeft className="w-8 h-8" />
          <span className="font-bold text-lg tracking-tight">Back to Home</span>
        </button>
      </div>

      <div className="absolute top-6 right-6 z-10">
        <select
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-4 text-base font-semibold"
        >
          <option value="medicine">Scan Medicine</option>
          <option value="bill">Scan Bill</option>
          <option value="cleaner">Scan Household Object</option>
        </select>
      </div>

      <div className="w-full max-w-2xl h-[500px] bg-black/50 rounded-3xl border-4 border-white/10 flex items-center justify-center overflow-hidden relative shadow-2xl">
        <p className="text-white/40 text-2xl tracking-tight">CAMERA FEED</p>
        {isScanning && (
          <>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="absolute top-0 left-0 w-full h-1.5 bg-cyan-400 animate-scan-line" style={{ boxShadow: '0 0 20px 2px #22d3ee' }} />
            <p className="z-10 text-3xl font-bold tracking-tight text-white/90">IDENTIFYING...</p>
          </>
        )}
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={handleIdentify}
          disabled={isScanning}
          className="w-48 h-24 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl flex items-center justify-center shadow-lg active:scale-95 transition-all group"
        >
          <div className="flex flex-col items-center justify-center">
            <Eye className="w-10 h-10 text-white/90 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-white font-bold tracking-tight text-center text-sm leading-tight">
              IDENTIFY
            </span>
          </div>
        </button>
      </div>

      {renderResult()}
    </div>
  );
}

