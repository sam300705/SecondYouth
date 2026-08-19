import { BookHeart, Eye, MapPin, Phone, Pill, Settings, ShieldAlert } from 'lucide-react';
import { formatMedicineTime, getNextMedicine, isMedicineTakenToday } from '../lib/appStore.js';

export default function HomeView({ profile, medicines, contacts, safeZoneStatus, onNavigate, onSos }) {
  const now = new Date();
  const next = getNextMedicine(medicines, now);
  const taken = medicines.filter((medicine) => isMedicineTakenToday(medicine, now)).length;
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="page-stack">
      <header className="home-header">
        <div><p>{greeting}</p><h1>{profile.name}</h1><span>{now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span></div>
        <button type="button" className="icon-button" onClick={() => onNavigate('settings')} aria-label="Open settings"><Settings /></button>
      </header>

      <button type="button" className="sos-card" onClick={onSos}><span className="sos-icon"><ShieldAlert /></span><span><strong>SOS</strong><small>Press for emergency help</small></span></button>

      <section className="today-card" aria-labelledby="today-title">
        <div className="section-title"><div><p className="eyebrow">Today</p><h2 id="today-title">Your care plan</h2></div><span>{taken}/{medicines.length} taken</span></div>
        {next ? <button type="button" className="next-medicine" onClick={() => onNavigate('medicines')}><span className="medicine-dot"><Pill /></span><span><small>Next medicine</small><strong>{next.medicine.name}</strong><em>{formatMedicineTime(next.medicine.time)}</em></span></button> : <button type="button" className="empty-action" onClick={() => onNavigate('medicines')}><Pill /><span><strong>{medicines.length ? 'All done for today' : 'Add your first medicine'}</strong><small>{medicines.length ? 'Review your schedule' : 'Create a simple daily reminder'}</small></span></button>}
      </section>

      <section className="feature-grid" aria-label="Care tools">
        <button type="button" className="feature-card medicine-feature" onClick={() => onNavigate('medicines')}><Pill /><strong>Medicines</strong><span>Schedule and track</span></button>
        <button type="button" className="feature-card family-feature" onClick={() => onNavigate('contacts')}><Phone /><strong>Family</strong><span>{contacts.length} trusted {contacts.length === 1 ? 'contact' : 'contacts'}</span></button>
        <button type="button" className="feature-card vision-feature" onClick={() => onNavigate('vision')}><Eye /><strong>Safety scanner</strong><span>Camera-assisted demo</span></button>
        <button type="button" className="feature-card legacy-feature" onClick={() => onNavigate('legacy')}><BookHeart /><strong>Legacy vault</strong><span>Record memories</span></button>
      </section>

      <button type="button" className={`safety-strip ${safeZoneStatus?.inside === false ? 'danger' : ''}`} onClick={() => onNavigate('safety')}><MapPin /><span><strong>{safeZoneStatus ? (safeZoneStatus.inside ? 'Inside your safe zone' : 'Outside your safe zone') : 'Set up a safe zone'}</strong><small>{safeZoneStatus ? `${Math.round(safeZoneStatus.distance)} m from the center` : 'Use location while the app is open'}</small></span><b>Open</b></button>
    </div>
  );
}
