import { useEffect, useRef, useState } from 'react';
import { Bot, MessageSquareText, Send, X } from 'lucide-react';
import { askAssistant } from '../lib/apiClient.js';

export default function AssistantPanel({ profile, medicines, route, notify }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([
    { id: 'welcome', role: 'assistant', text: 'I can help you navigate SecondYouth. I do not diagnose or change medicine plans.' },
  ]);
  const controllerRef = useRef(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const submit = async (event) => {
    event.preventDefault();
    const text = message.trim();
    if (!text || busy) return;
    setMessage('');
    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: 'user', text }]);
    setBusy(true);
    controllerRef.current?.abort();
    controllerRef.current = new AbortController();
    const result = await askAssistant({
      message: text,
      context: { profile, medicines, route },
      signal: controllerRef.current.signal,
    });
    setBusy(false);
    if (result.cancelled) return;
    if (!result.ok) {
      notify(result.message || 'Assistant unavailable.', 'info');
      setMessages((current) => [...current, { id: `error-${Date.now()}`, role: 'assistant', text: result.message || 'I am unavailable right now. You can continue using the dashboard.' }]);
      return;
    }
    setMessages((current) => [...current, { id: `assistant-${Date.now()}`, role: 'assistant', text: result.text }].slice(-8));
  };

  return <>
    <button type="button" className="assistant-launcher" onClick={() => setOpen(true)} aria-label="Open SecondYouth assistant" aria-expanded={open}><MessageSquareText /><span>Ask SecondYouth</span></button>
    {open && <div className="modal-backdrop assistant-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section className="modal-card assistant-card" role="dialog" aria-modal="true" aria-labelledby="assistant-title">
        <header className="assistant-header"><div><p className="eyebrow">Guided help</p><h2 id="assistant-title"><Bot /> SecondYouth assistant</h2></div><button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="Close assistant"><X /></button></header>
        <p className="assistant-disclaimer">Assistive navigation only. Verify medicine labels and use emergency services for immediate danger.</p>
        <div className="assistant-messages" aria-live="polite">{messages.map((item) => <p key={item.id} className={`assistant-message ${item.role}`}>{item.text}</p>)}{busy && <p className="assistant-message assistant">Thinking…</p>}</div>
        <form className="assistant-form" onSubmit={submit}><label className="sr-only" htmlFor="assistant-input">Ask a question</label><input id="assistant-input" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask about medicines or settings" maxLength={1200} disabled={busy} /><button type="submit" className="primary-button" disabled={busy || !message.trim()} aria-label="Send question"><Send /></button></form>
      </section>
    </div>}
  </>;
}
