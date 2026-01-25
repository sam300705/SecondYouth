import { Pill, Check, ArrowLeft, Clock } from 'lucide-react';

export default function MedicineList({ medicines, toggleMedicine, onBack, onNavigate }) {
  
  const renderPillIcon = (med) => {
    let colorClass = 'bg-slate-500';
    if (med.color === 'red') colorClass = 'bg-red-500';
    if (med.color === 'blue') colorClass = 'bg-blue-500';
    if (med.color === 'white') colorClass = 'bg-white';
    if (med.color === 'yellow') colorClass = 'bg-yellow-400';

    if (med.shape === 'Capsule') {
      return <div className={`w-14 h-8 rounded-full ${colorClass} shadow-inner`} />;
    } else {
      return <div className={`w-10 h-10 rounded-full ${colorClass} shadow-inner`} />;
    }
  };

  if (medicines.length === 0) {
    return (
        <div className="flex flex-col gap-8 w-full text-center items-center justify-center py-20 bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl">
            <Pill className="w-24 h-24 text-white/20" strokeWidth={1.5} />
            <h2 className="text-3xl font-bold tracking-tight text-white">No medicines scheduled.</h2>
            <button 
                onClick={() => onNavigate('settings')}
                className="h-20 w-full max-w-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl flex items-center justify-center gap-4 active:scale-95 transition-all shadow-lg hover:shadow-indigo-500/50 text-xl font-bold"
            >
                Add Medicines in Settings
            </button>
        </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      <button 
        onClick={onBack}
        className="h-20 w-full rounded-3xl flex items-center justify-center gap-4 transition-all shadow-xl mb-4 bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 active:scale-95"
      >
        <ArrowLeft className="w-10 h-10 text-white/80" strokeWidth={2.5} />
        <span className="text-2xl font-bold tracking-tight text-white">Back to Home</span>
      </button>

      <h2 className="text-4xl font-bold tracking-tight text-white px-2 mb-2">My Medicines</h2>

      <div className="flex flex-col gap-6">
        {medicines.map((med, index) => (
          <div 
            key={index}
            className={`relative rounded-3xl p-6 transition-all duration-300 shadow-2xl bg-white/5 backdrop-blur-xl border ${med.isTaken ? 'border-emerald-500/50' : 'border-white/20'}`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-5 flex-1">
                <div className={`p-4 rounded-2xl flex items-center justify-center w-24 h-24 bg-black/20`}>
                   {med.isTaken ? (
                       <Pill className="w-12 h-12 text-emerald-400" />
                   ) : (
                       renderPillIcon(med)
                   )}
                </div>
                
                <div className="flex flex-col">
                  <span className={`text-3xl font-bold tracking-tight ${med.isTaken ? 'text-emerald-400/80 line-through decoration-4' : 'text-white'}`}>
                    {med.name}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-6 h-6 text-white/50" />
                    <span className="text-xl font-medium text-white/70">
                      {med.time}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => toggleMedicine(index)}
                className={`h-20 w-20 rounded-2xl border-2 flex items-center justify-center transition-all active:scale-90 shadow-lg ${med.isTaken ? 'bg-emerald-500 border-emerald-400' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}
                aria-label={`Mark ${med.name} as ${med.isTaken ? 'not taken' : 'taken'}`}
              >
                {med.isTaken && <Check className="w-12 h-12 text-white" strokeWidth={4} />}
              </button>
            </div>

            {med.isTaken && (
              <div className="absolute top-3 right-28 px-4 py-1 bg-emerald-500/20 rounded-full backdrop-blur-sm border border-emerald-500/30">
                <span className="text-sm font-bold text-emerald-300 tracking-wider">TAKEN</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}