import { useEffect, useState } from 'react';
import { careIdentity, careRequest, sharingKey, signInForCare } from '../lib/careClient.js';

const formatted = (value) => new Date(value).toLocaleString();

export default function CareView({ onBack }) {
  const [identity, setIdentity] = useState(null);
  const [grants, setGrants] = useState([]);
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [scope, setScope] = useState(() => localStorage.getItem(sharingKey));

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const account = await careIdentity();
        const result = account ? await careRequest('grants', { token: account.token }) : null;
        if (mounted) {
          setIdentity(account);
          setGrants(result?.grants || []);
          setError(sessionStorage.getItem('secondyouth.care.signInError') || '');
          sessionStorage.removeItem('secondyouth.care.signInError');
        }
      } catch (problem) {
        if (mounted) setError(problem.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  async function changeGrant(id) {
    setBusy(true);
    setError('');
    try {
      const account = await careIdentity();
      if (account?.scope !== identity.scope) throw new Error('Sign in again to manage invitations.');
      if (id) {
        await careRequest('grants/' + id, { method: 'DELETE', token: account.token });
        setGrants((current) => current.filter((grant) => grant.id !== id));
        setLink('');
      } else {
        const { token, ...grant } = await careRequest('grants', { method: 'POST', token: account.token });
        setGrants((current) => [grant, ...current]);
        const url = new URL(location.pathname, location.origin);
        url.hash = '/caregiver/' + token;
        setLink(url.href);
      }
    } catch (problem) {
      setError(problem.message);
    } finally {
      setBusy(false);
    }
  }

  function changeSharing() {
    if (scope) {
      localStorage.removeItem(sharingKey);
      setScope(null);
    } else {
      localStorage.setItem(sharingKey, identity.scope);
      setScope(identity.scope);
    }
  }

  return <div className="page-stack">
    <button type="button" className="text-button" onClick={onBack}>Back</button>
    <h1>Care sharing</h1>
    <p>Share recorded medicine check-ins with a caregiver you choose. Your contact details, location, and recordings stay private.</p>
    {error && <p role="alert" className="form-error">{error}</p>}
    {loading ? <p role="status">Connecting…</p> : <>
      {!identity && <button type="button" className="primary-button" onClick={() => signInForCare().catch((problem) => setError(problem.message))}>Sign in</button>}
      {(identity || scope) && <section className="settings-section">
        <h2>Check-in sync</h2>
        <p>{scope ? 'Check-ins recorded while sharing is enabled can sync when you reconnect.' : 'New check-ins are kept on this device.'}</p>
        <button type="button" className="secondary-button" onClick={changeSharing}>{scope ? 'Pause sync' : 'Enable check-in sync'}</button>
      </section>}
      {identity && <section className="settings-section">
        <h2>Caregiver invitations</h2>
        {identity.demo && <p>Demo mode. Anyone with the invitation link can view the shared timeline.</p>}
        <button type="button" className="primary-button" onClick={() => changeGrant()} disabled={busy || scope !== identity.scope}>Create caregiver invitation</button>
        {link && <label className="field">Invitation link<input readOnly value={link} onFocus={(event) => event.target.select()} /></label>}
        <p>Invitations expire after seven days. Revoke an invitation to end access sooner.</p>
        {grants.map((grant) => <div className="setting-row" key={grant.id}>
          <span>{grant.claimed ? 'Accepted' : 'Invitation'} · Expires {formatted(grant.expiresAt)}</span>
          <button type="button" className="secondary-button" disabled={busy} onClick={() => changeGrant(grant.id)}>Revoke access</button>
        </div>)}
      </section>}
    </>}
  </div>;
}
