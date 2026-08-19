import { useEffect, useState } from 'react';
import { Fingerprint, LockKeyhole, ShieldCheck } from 'lucide-react';

export default function LoginView({ profile, onLogin, onReset }) {
  const [isScanning, setIsScanning] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isScanning) return undefined;
    const timeout = window.setTimeout(() => { setSeconds(0); onLogin(); }, 1100);
    const tick = window.setInterval(() => setSeconds((value) => value + 1), 350);
    return () => { window.clearTimeout(timeout); window.clearInterval(tick); };
  }, [isScanning, onLogin]);

  return (
    <div className="auth-shell">
      <main className="auth-card login-card" aria-labelledby="login-title">
        <div className="brand-lockup"><div className="brand-icon"><ShieldCheck /></div><div><strong>SecondYouth</strong><span>Private device access</span></div></div>
        <section className="login-copy"><p className="eyebrow">Welcome back</p><h1 id="login-title">Hello, {profile.name}.</h1><p className="lead">Unlock your care dashboard on this device.</p></section>
        <button type="button" className={`biometric-button ${isScanning ? 'is-scanning' : ''}`} onClick={() => setIsScanning(true)} disabled={isScanning}>
          <span className="scan-orbit"><Fingerprint aria-hidden="true" /><i /></span>
          <strong>{isScanning ? 'Checking this device…' : 'Tap to unlock'}</strong>
          <span>{isScanning ? `Verification step ${Math.min(seconds + 1, 3)} of 3` : 'Local demo access'}</span>
        </button>
        <div className="demo-note"><LockKeyhole aria-hidden="true" /><span>This client-only demo cannot provide production authentication. A deployed health product should use verified passkeys and a secure backend.</span></div>
        <button type="button" className="text-button danger-text" onClick={onReset}>Reset this device</button>
      </main>
    </div>
  );
}
