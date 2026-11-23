import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, BookHeart, Mic, Play, Square, Trash2 } from 'lucide-react';
import { deleteMemory, listMemories, saveMemory } from '../lib/audioDb.js';
import { makeId } from '../lib/appStore.js';

const questions = [
  'What was your first job like?',
  'How did you meet someone important to you?',
  'What is your favorite childhood memory?',
  'What lesson would you pass to the next generation?',
  'Describe a place you loved visiting.',
  'What achievement are you most proud of?',
];

export default function LegacyView({ onBack, notify }) {
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const mounted = useRef(false);
  const busyRef = useRef(false);
  const timerRef = useRef(null);
  const durationRef = useRef(0);
  const [questionIndex, setQuestionIndex] = useState(() => new Date().getDate() % questions.length);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [duration, setDuration] = useState(0);
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try { setMemories(await listMemories()); } catch (error) { notify(error.message, 'error'); } finally { setLoading(false); }
  }, [notify]);
  useEffect(() => {
    mounted.current = true;
    refresh();
    return () => {
      mounted.current = false;
      window.clearInterval(timerRef.current);
      const recorder = recorderRef.current;
      if (recorder?.state === 'recording') {
        recorder.onstop = null;
        recorder.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [refresh]);

  const start = async () => {
    if (busyRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia || !('MediaRecorder' in window)) { notify('Audio recording is not supported in this browser.', 'error'); return; }
    busyRef.current = true;
    setBusy(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      const chunks = [];
      recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        const memory = { id: makeId('memory'), question: questions[questionIndex], createdAt: new Date().toISOString(), duration: durationRef.current, blob };
        stream.getTracks().forEach((track) => track.stop());
        try {
          if (!blob.size) throw new Error('No audio was captured.');
          await saveMemory(memory);
          notify('Memory saved privately on this device.', 'success');
          if (mounted.current) await refresh();
        } catch (error) {
          notify(error.message, 'error');
        } finally {
          busyRef.current = false;
          if (mounted.current) setBusy(false);
        }
      };
      recorder.start(); durationRef.current = 0; setDuration(0); setRecording(true);
      timerRef.current = window.setInterval(() => { durationRef.current += 1; setDuration(durationRef.current); }, 1000);
    } catch {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      busyRef.current = false;
      if (mounted.current) {
        setBusy(false);
        notify('Could not start recording. Check microphone access and try again.', 'error');
      }
    }
  };

  const stop = () => {
    if (!recording) return;
    window.clearInterval(timerRef.current);
    recorderRef.current?.stop();
    setRecording(false);
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this recorded memory from the device?')) return;
    try {
      await deleteMemory(id);
      await refresh();
      notify('Memory deleted.', 'info');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  return <div className="page-stack"><header className="page-header"><button type="button" className="icon-button" onClick={onBack} aria-label="Back to home"><ArrowLeft /></button><div><p className="eyebrow">Private audio journal</p><h1>Legacy vault</h1></div><span /></header><section className="question-card"><BookHeart /><p>Today’s memory prompt</p><h2>{questions[questionIndex]}</h2><button type="button" className="text-button" onClick={() => setQuestionIndex((questionIndex + 1) % questions.length)}>Show another question</button></section><section className="record-section"><button type="button" className={`record-button ${recording ? 'recording' : ''}`} onClick={recording ? stop : start} disabled={busy && !recording} aria-label={recording ? 'Stop recording' : 'Start recording'}>{recording ? <Square /> : <Mic />}</button><div><strong>{recording ? `Recording · ${duration}s` : 'Tap to start recording'}</strong><span>{recording ? 'Tap again when your story is complete.' : 'Your audio stays in this browser using offline storage.'}</span></div></section><section><div className="section-title"><div><p className="eyebrow">Saved privately</p><h2>My memories</h2></div><span>{memories.length}</span></div>{loading ? <p className="muted">Loading memories…</p> : !memories.length ? <div className="empty-state compact"><div><BookHeart /></div><h2>No recordings yet</h2><p>Your first story will appear here.</p></div> : <div className="memory-list">{memories.map((memory) => <MemoryAudio key={memory.id} memory={memory} onDelete={remove} />)}</div>}</section></div>;
}

function MemoryAudio({ memory, onDelete }) {
  const audio = useRef(null);
  useEffect(() => {
    const element = audio.current;
    const url = URL.createObjectURL(memory.blob);
    element.src = url;
    return () => URL.revokeObjectURL(url);
  }, [memory.blob]);
  return <article className="memory-card"><div className="memory-icon"><Play /></div><div><strong>{memory.question}</strong><span>{new Date(memory.createdAt).toLocaleDateString()} · {memory.duration ?? 0}s</span><audio controls ref={audio} preload="metadata" /></div><button type="button" onClick={() => onDelete(memory.id)} aria-label="Delete memory"><Trash2 /></button></article>;
}
