import { Pill, Check, ArrowLeft, Clock } from 'lucide-react';

export default function MedicineList({ medicines, toggleMedicine, onBack, onNavigate }) {
  
  // Helper to render the visual ID icon
  const renderPillIcon = (med) => {
    // Determine CSS class for color
    let colorClass = 'bg-stone-200';
    if (med.color === 'red') colorClass = 'bg-red-500';
    if (med.color === 'blue') colorClass = 'bg-blue-500';
    if (med.color === 'white') colorClass = 'bg-white border-2 border-stone-200';
    if (med.color === 'yellow') colorClass = 'bg-yellow-400';

    // Render shape
    if (med.shape === 'Capsule') {
      return <div className={`w-14 h-8 rounded-full ${colorClass} shadow-sm`} />;
    } else {
      // Default to Round
      return <div className={`w-10 h-10 rounded-full ${colorClass} shadow-sm`} />;
    }
  };

  if (medicines.length === 0) {
    return (
        <div className="flex flex-col gap-8 w-full animate-fade-in text-center items-center justify-center pt-20">
            <Pill className="w-24 h-24 text-stone-300 dark:text-stone-600" strokeWidth={2} />
            <h2 className="text-3xl font-bold text-stone-700 dark:text-white">No medicines added yet.</h2>
            <button 
                onClick={() => onNavigate('settings')}
                className="h-20 w-full max-w-sm bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center justify-center gap-4 active:scale-95 transition-all shadow-lg text-xl font-bold"
            >
                Go to Settings to Add Pills
            </button>
        </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in pb-10">
      {/* Huge Back Button */}
      <button 
        onClick={onBack}
        className="h-20 w-full bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 rounded-3xl flex items-center justify-center gap-4 active:bg-stone-100 dark:active:bg-stone-700 transition-colors shadow-sm mb-4"
      >
        <ArrowLeft className="w-10 h-10 text-stone-600 dark:text-stone-300" strokeWidth={3} />
        <span className="text-2xl font-bold text-stone-700 dark:text-stone-200">Back to Home</span>
      </button>

      <h2 className="text-4xl font-bold text-stone-800 dark:text-white px-2 mb-2">My Medicines</h2>

      <div className="flex flex-col gap-6">
        {medicines.map((med, index) => (
          <div 
            key={index}
            className={`
              relative rounded-3xl border-4 p-6 transition-all duration-300 shadow-sm
              ${med.isTaken 
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 dark:border-emerald-600' 
                : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700'
              }
            `}
          >
            <div className="flex items-center justify-between gap-4">
              {/* Icon & Details */}
              <div className="flex items-center gap-5 flex-1">
                {/* Visual ID Container */}
                <div className={`p-4 rounded-2xl flex items-center justify-center w-24 h-24 ${med.isTaken ? 'bg-emerald-200 dark:bg-emerald-800' : 'bg-stone-100 dark:bg-stone-900'}`}>
                   {med.isTaken ? (
                       <Pill className="w-12 h-12 text-emerald-800 dark:text-emerald-200" />
                   ) : (
                       renderPillIcon(med)
                   )}
                </div>
                
                <div className="flex flex-col">
                  <span className={`text-3xl font-bold ${med.isTaken ? 'text-emerald-900 dark:text-emerald-400 line-through decoration-4 decoration-emerald-500/50' : 'text-stone-800 dark:text-white'}`}>
                    {med.name}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-6 h-6 text-stone-500 dark:text-stone-400" />
                    <span className="text-xl font-medium text-stone-600 dark:text-stone-300">
                      {med.time}
                    </span>
                  </div>
                </div>
              </div>

              {/* Massive Check Button */}
              <button
                onClick={() => toggleMedicine(index)}
                className={`
                  h-20 w-20 rounded-2xl border-4 flex items-center justify-center transition-all active:scale-90
                  ${med.isTaken 
                    ? 'bg-emerald-500 border-emerald-600 shadow-inner' 
                    : 'bg-white dark:bg-stone-700 border-stone-300 dark:border-stone-600 shadow-md hover:border-stone-400'
                  }
                `}
                aria-label={`Mark ${med.name} as ${med.isTaken ? 'not taken' : 'taken'}`}
              >
                {med.isTaken && <Check className="w-12 h-12 text-white" strokeWidth={4} />}
              </button>
            </div>

            {/* Status Text Overlay */}
            {med.isTaken && (
              <div className="absolute top-2 right-24 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/50 rounded-full">
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300 tracking-wider">TAKEN</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}