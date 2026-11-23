import { useRef, useState } from 'react';
import { Bot, MessageSquareText, Send, X } from 'lucide-react';
import { localAssistant } from '../lib/localAssistant.js';
import { getNextMedicine } from '../lib/appStore.js';

export default function AssistantPanel({ medicines, route }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 0, role: 'assistant', text: 'I can help you navigate SecondYouth. I do not diagnose or change medicine plans.' },
  ]);
  const nextId = useRef(1);

  const submit = (event) => {
    event.preventDefault();
    const text = message.trim();
    if (!text) return;
    const upcoming = getNextMedicine(medicines)?.medicine;
    const reply = localAssistant(text, { currentScreen: route, medicines: upcoming ? [upcoming] : [] });
    const id = nextId.current;
    nextId.current += 2;
    setMessage('');
    setMessages((current) => [...current, { id, role: 'user', text }, { id: id + 1, role: 'assistant', text: reply }].slice(-8));
  };

  return <>
    <button type="button" className="assistant-launcher" onClick={() => setOpen(true)} aria-label="Open SecondYouth assistant" aria-expanded={open}><MessageSquareText /><span>Ask SecondYouth</span></button>
    {open && <div className="modal-backdrop assistant-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section className="modal-card assistant-card" role="dialog" aria-modal="true" aria-labelledby="assistant-title">
        <header className="assistant-header"><div><p className="eyebrow">Guided help</p><h2 id="assistant-title"><Bot /> SecondYouth assistant</h2></div><button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="Close assistant"><X /></button></header>
        <p className="assistant-disclaimer">Runs on this device. Verify medicine labels and use emergency services for immediate danger.</p>
        <div className="assistant-messages" role="log" aria-live="polite">{messages.map((item) => <p key={item.id} className={`assistant-message ${item.role}`}>{item.text}</p>)}</div>
        <form className="assistant-form" onSubmit={submit}><label className="sr-only" htmlFor="assistant-input">Ask a question</label><input id="assistant-input" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask about medicines or settings" maxLength={1200} /><button type="submit" className="primary-button" disabled={!message.trim()} aria-label="Send question"><Send /></button></form>
      </section>
    </div>}
  </>;
}
