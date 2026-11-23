import { useEffect, useState } from 'react';
import { careIdentity, careRequest, signInForCare } from '../lib/careClient.js';

export default function CaregiverView({ invite }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!invite) return undefined;
    let mounted = true;
    let reading = false;
    async function read() {
      if (reading) return;
      reading = true;
      try {
        const identity = await careIdentity();
        if (!mounted) return;
        if (!identity) {
          setNeedsSignIn(true);
          setData(null);
          return;
        }
        const payload = await careRequest('timeline', { method: 'POST', token: identity.token, invite });
        if (mounted) {
          setNeedsSignIn(false);
          setError('');
          setData({ ...payload, checkedAt: new Date() });
        }
      } catch (problem) {
        if (mounted) {
          setData(null);
          setError(problem.message);
        }
      } finally {
        reading = false;
      }
    }
    read();
    const timer = window.setInterval(read, 5000);
    window.addEventListener('online', read);
    return () => {
      mounted = false;
      window.clearInterval(timer);
      window.removeEventListener('online', read);
    };
  }, [invite, reload]);

  return <main className="app-shell caregiver-page"><div className="app-view page-stack">
    <h1>Caregiver timeline</h1>
    <a className="text-button" href="/#/home">Open device dashboard</a>
    <p>Check-ins are self-reported. A missing check-in leaves the dose status unknown.</p>
    {needsSignIn && <button type="button" className="primary-button" onClick={() => signInForCare().catch((problem) => setError(problem.message))}>Sign in as caregiver</button>}
    {error && <p role="alert" className="form-error">{error}</p>}
    {!invite && <p role="alert">Open the invitation sent by the person sharing their check-ins.</p>}
    {invite && !data && !error && !needsSignIn && <p role="status">Checking access…</p>}
    {invite && <button type="button" className="secondary-button" onClick={() => setReload((current) => current + 1)}>Refresh timeline</button>}
    {data && <>
      <p role="status">Last checked {data.checkedAt.toLocaleTimeString()}. {data.events.length > 0 && 'Latest received ' + new Date(data.events[0].syncedAt).toLocaleString() + '.'}</p>
      {data.events.length === 0 ? <p>No check-in received.</p> : <ul className="list-stack">
        {data.events.map((event) => <li key={event.id} className="settings-section">
          <strong>{event.name}</strong>
          <span>{event.date} · {event.time}</span>
          <span>{event.taken ? 'Marked taken' : 'Check-in undone'}</span>
          <small>Recorded {new Date(event.recordedAt).toLocaleString()}</small>
        </li>)}
      </ul>}
    </>}
  </div></main>;
}
