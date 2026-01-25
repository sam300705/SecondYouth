import { useState, useRef, useEffect } from 'react';
import { BookHeart, Mic, ArrowLeft } from 'lucide-react';

const questions = [
  'What was your first job like?',
  'How did you meet your spouse?',
  'What is your favorite memory from childhood?',
  'What is the most important lesson you have learned in life?',
  'Describe a place you loved visiting as a child.',
  'What achievement are you most proud of?',
];

export default function LegacyView({ onNavigate }) {
  const [question, setQuestion] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  useEffect(() => {
    setQuestion(questions[Math.floor(Math.random() * questions.length)]);
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.ondataavailable = (event) => audioChunks.current.push(event.data);
      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordings((prev) => [...prev, { url: audioUrl, date: new Date(), question: question }]);
        audioChunks.current = [];
      };
      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
      alert("Could not start recording. Please ensure microphone permissions are enabled.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      mediaRecorder.current.stop();
    }
    setIsRecording(false);
  };

  const renderRecordings = () => {
    if (recordings.length === 0) {
      return <p className="text-center text-white/50">No memories recorded yet. Press and hold the button to record.</p>;
    }
    return recordings.map((rec, index) => (
      <div key={index} className="bg-black/20 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/10">
        <div className='flex-1'>
            <p className="font-semibold text-white/70 text-sm">"{rec.question}"</p>
            <p className="font-bold text-white text-lg">Memory #{index + 1} - {rec.date.toLocaleDateString()}</p>
        </div>
        <audio controls src={rec.url} className='w-full sm:w-auto'/>
      </div>
    ));
  };

  return (
    <div className="fixed inset-0 bg-slate-900 text-white flex flex-col items-center font-sans p-4 sm:p-6 justify-center">
      <div className="absolute top-6 left-6 z-10">
        <button onClick={() => onNavigate('home')} className="flex items-center gap-3 text-white/80 hover:text-white bg-white/10 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-lg active:scale-95 transition-all">
          <ArrowLeft className="w-8 h-8" />
          <span className="font-bold text-lg tracking-tight">Back to Home</span>
        </button>
      </div>

      <div className="w-full max-w-2xl text-center flex flex-col gap-8">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl p-8 rounded-3xl">
          <p className="text-xl font-semibold text-pink-300 tracking-tight">Question of the Day:</p>
          <p className="text-3xl mt-2 font-bold text-white">{question}</p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className={`w-40 h-40 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 active:scale-95
              ${isRecording 
                ? 'bg-red-500 animate-pulse ring-8 ring-red-400/50' 
                : 'bg-gradient-to-br from-pink-500 to-rose-500 hover:shadow-lg hover:shadow-pink-500/40'
              }
            `}
            aria-label="Record Memory"
          >
            <Mic className="w-20 h-20 text-white" />
          </button>
          <p className={`text-lg font-semibold transition-opacity ${isRecording ? 'opacity-100' : 'opacity-70'}`}>
            {isRecording ? 'Recording...' : 'Press and Hold to Record'}
          </p>
        </div>

        <div className="mt-4 w-full bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl p-6 rounded-3xl">
          <h2 className="text-2xl font-bold mb-4 text-left tracking-tight">My Legacy Vault</h2>
          <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
            {renderRecordings()}
          </div>
        </div>
      </div>
    </div>
  );
}
