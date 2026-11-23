import { LockKeyhole, ShieldCheck } from 'lucide-react';

export default function LoginView({ profile, onLogin, onReset }) {
  return (
    <div className="auth-shell">
      <main className="auth-card login-card" aria-labelledby="login-title">
        <div className="brand-lockup"><div className="brand-icon"><ShieldCheck /></div><div><strong>SecondYouth</strong><span>On-device dashboard</span></div></div>
        <section className="login-copy"><p className="eyebrow">Welcome back</p><h1 id="login-title">Hello, {profile.name}.</h1><p className="lead">Continue to your care dashboard on this device.</p></section>
        <button type="button" className="biometric-button" onClick={onLogin}>
          <span className="scan-orbit"><LockKeyhole aria-hidden="true" /></span>
          <strong>Open dashboard</strong>
        </button>
        <div className="demo-note"><LockKeyhole aria-hidden="true" /><span>Anyone with access to this browser can open the dashboard. Use your device lock to protect your data.</span></div>
        <button type="button" className="text-button danger-text" onClick={onReset}>Reset this device</button>
      </main>
    </div>
  );
}
