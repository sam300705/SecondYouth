import { useState } from 'react';
import { ArrowRight, HeartHandshake, ShieldCheck, Sparkles } from 'lucide-react';
import { isValidPhone, makeId, normalizePhone } from '../lib/appStore.js';

export default function OnboardingView({ onComplete }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', phone: '', contactName: '', contactPhone: '', relation: '' });
  const [errors, setErrors] = useState({});

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const next = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Please enter the name the app should use.';
    if (!isValidPhone(form.phone)) nextErrors.phone = 'Enter a valid phone number.';
    setErrors(nextErrors);
    if (!Object.keys(nextErrors).length) setStep(1);
  };

  const finish = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.contactName.trim()) nextErrors.contactName = 'Enter a contact name.';
    if (!isValidPhone(form.contactPhone)) nextErrors.contactPhone = 'Enter a valid emergency number.';
    if (!form.relation.trim()) nextErrors.relation = 'Enter the relationship.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onComplete({
      profile: { name: form.name.trim(), phone: normalizePhone(form.phone), createdAt: new Date().toISOString() },
      contact: {
        id: makeId('contact'),
        name: form.contactName.trim(),
        phone: normalizePhone(form.contactPhone),
        relation: form.relation.trim(),
        primary: true,
      },
    });
  };

  return (
    <div className="auth-shell">
      <main className="auth-card" aria-labelledby="onboarding-title">
        <div className="brand-lockup"><div className="brand-icon"><Sparkles /></div><div><strong>SecondYouth</strong><span>Care that feels simple</span></div></div>
        <div className="step-dots" aria-label={`Step ${step + 1} of 2`}><span className="active" /><span className={step === 1 ? 'active' : ''} /></div>
        {step === 0 ? (
          <section>
            <p className="eyebrow">Welcome</p>
            <h1 id="onboarding-title">Let’s make this app yours.</h1>
            <p className="lead">Your details stay on this device. They help personalize medicine reminders and emergency actions.</p>
            <label className="field"><span>Your name</span><input autoFocus autoComplete="name" value={form.name} onChange={update('name')} placeholder="Example: Asha" />{errors.name && <small>{errors.name}</small>}</label>
            <label className="field"><span>Your phone number</span><input type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={update('phone')} placeholder="+91 98765 43210" />{errors.phone && <small>{errors.phone}</small>}</label>
            <button type="button" className="primary-button" onClick={next}>Continue <ArrowRight /></button>
          </section>
        ) : (
          <form onSubmit={finish}>
            <p className="eyebrow">Safety contact</p>
            <h1 id="onboarding-title">Who should we call first?</h1>
            <p className="lead">This becomes the primary contact shown during SOS actions. You can add more people later.</p>
            <label className="field"><span>Contact name</span><input autoFocus autoComplete="name" value={form.contactName} onChange={update('contactName')} placeholder="Example: Rahul" />{errors.contactName && <small>{errors.contactName}</small>}</label>
            <label className="field"><span>Phone number</span><input type="tel" inputMode="tel" autoComplete="tel" value={form.contactPhone} onChange={update('contactPhone')} placeholder="+91 98765 43210" />{errors.contactPhone && <small>{errors.contactPhone}</small>}</label>
            <label className="field"><span>Relationship</span><input value={form.relation} onChange={update('relation')} placeholder="Example: Son" />{errors.relation && <small>{errors.relation}</small>}</label>
            <div className="button-row"><button type="button" className="secondary-button" onClick={() => setStep(0)}>Back</button><button type="submit" className="primary-button">Finish setup <ShieldCheck /></button></div>
          </form>
        )}
        <div className="privacy-note"><HeartHandshake aria-hidden="true" /><span>Offline-first demo: profile and care data are saved only in this browser.</span></div>
      </main>
    </div>
  );
}

