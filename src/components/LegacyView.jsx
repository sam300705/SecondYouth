import { useState, useRef, useEffect } from 'react';
import { BookHeart, Mic, X, Play, Square, MoveLeft } from 'lucide-react';

const questions = [
  'What was your first job like?',
  'How did you meet your spouse?',
  'What is your favorite memory from childhood?',
  'What is the most important lesson you have learned in life?',
];

export default function LegacyView({ onBack, onNavigate }) {
  const [question, setQuestion] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  useEffect(() => {
    setQuestion(questions[Math.floor(Math.random() * questions.length)]);
  }, []);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    mediaRecorder.current.ondataavailable = (event) => {
      audioChunks.current.push(event.data);
    };
    mediaRecorder.current.onstop = () => {
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      setRecordings((prev) => [...prev, { url: audioUrl, date: new Date() }]);
      audioChunks.current = [];
    };
    mediaRecorder.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder.current.stop();
    setIsRecording(false);
  };

  const renderRecordings = () => {
    if (recordings.length === 0) {
      return <p className="text-center text-gray-400">No memories saved yet.</p>;
    }

    return recordings.map((rec, index) => (
      <div key={index} className="bg-white/10 p-4 rounded-lg flex items-center justify-between">
        <p className="font-semibold">Memory #{index + 1} - {rec.date.toLocaleDateString()}</p>
        <audio controls src={rec.url} />
      </div>
    ));
  };

  return (
    <div className="fixed inset-0 bg-gray-800 text-white flex flex-col items-center justify-center font-sans p-4">
      <div className="absolute top-4 left-4 z-10">
        <button onClick={() => onNavigate('home')} className="flex items-center gap-2 text-gray-300 hover:text-white bg-black/20 p-3 rounded-lg">
          <MoveLeft className="w-8 h-8" />
          <span className="font-bold text-lg">Back to Home</span>
        </button>
      </div>

      <div className="w-full max-w-md text-center">
        <div className="bg-yellow-200/20 p-6 rounded-lg mb-8 border border-yellow-200/30">
          <p className="text-xl font-semibold text-yellow-200">Question of the Day:</p>
          <p className="text-2xl mt-2 text-white">{question}</p>
        </div>

        <div className="flex flex-col items-center">
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className="w-40 h-40 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg transform active:scale-95 transition-transform"
          >
            <Mic className="w-20 h-20 text-white" />
          </button>
          {isRecording && (
            <div className="mt-4 flex items-center justify-center space-x-1 h-10">
              <div className="w-2 h-4 bg-yellow-400 rounded-full waveform-bar"></div>
              <div className="w-2 h-8 bg-yellow-400 rounded-full waveform-bar"></div>
              <div className="w-2 h-10 bg-yellow-400 rounded-full waveform-bar"></div>
              <div className="w-2 h-8 bg-yellow-400 rounded-full waveform-bar"></div>
              <div className="w-2 h-4 bg-yellow-400 rounded-full waveform-bar"></div>
            </div>
          )}
        </div>

        <div className="mt-8 w-full">
          <h2 className="text-2xl font-bold mb-4 text-left">Saved Memories</h2>
          <div className="space-y-4">
            {renderRecordings()}
          </div>
        </div>
      </div>
    </div>
  );
}
