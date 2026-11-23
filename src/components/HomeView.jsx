import { createElement } from 'react';
import { ArrowRight, BookHeart, CalendarDays, ChevronRight, Eye, HeartHandshake, MapPin, Pill, ShieldAlert, UsersRound } from 'lucide-react';
import { formatMedicineTime, getNextMedicine, isMedicineTakenToday, todayKey } from '../lib/appStore.js';
import portrait from '../assets/care-portrait.webp';

const tools = [
  { route: 'contacts', title: 'Family', tone: 'blue', Icon: UsersRound },
  { route: 'vision', title: 'Safety scanner', description: 'Camera-assisted demo', tone: 'amber', Icon: Eye },
  { route: 'legacy', title: 'Legacy vault', description: 'Record memories', tone: 'rose', Icon: BookHeart },
  { route: 'care', title: 'Care sharing', description: 'Manage caregiver access', tone: 'green', Icon: HeartHandshake },
];

export default function HomeView({ profile, medicines, contacts, safeZoneStatus, onNavigate, onSos }) {
  const now = new Date();
  const activeMedicines = medicines.filter((medicine) => medicine.active !== false);
  const next = getNextMedicine(activeMedicines, now);
  const taken = activeMedicines.filter((medicine) => isMedicineTakenToday(medicine, now)).length;
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const date = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const remaining = activeMedicines.length - taken;
  let scheduleText = 'Add a medicine to start your daily care plan.';
  if (activeMedicines.length) {
    scheduleText = remaining === 0 ? 'You’ve checked in for every medicine today.'
      : `${remaining} medicine check-in${remaining === 1 ? '' : 's'} remaining today.`;
  }

  return (
    <div className="home-dashboard">
      <header className="dashboard-hero">
        <div className="hero-copy">
          <p className="hero-date"><CalendarDays size={17} /> {date}</p>
          <h1>{greeting}, <span>{profile.name}.</span></h1>
          <p className="hero-summary">{scheduleText}</p>
          <button type="button" className="primary-button" onClick={() => onNavigate('medicines')}>
            Open schedule <ArrowRight size={19} />
          </button>
        </div>
        <img className="dashboard-portrait" src={portrait} alt="" width="1100" height="733" />
      </header>

      <div className="dashboard-summary">
        <section className="today-card dashboard-plan" aria-labelledby="today-title">
          <div className="section-title">
            <h2 id="today-title">Today’s care plan</h2>
            <span>{taken} of {activeMedicines.length} taken</span>
          </div>
          <progress className="dashboard-progress" value={taken} max={activeMedicines.length || 1} aria-label="Medicines taken today" />
          {next ? (
            <button type="button" className="next-medicine" onClick={() => onNavigate('medicines')}>
              <span className="medicine-dot"><Pill size={23} /></span>
              <span>
                <small>{todayKey(next.scheduled) === todayKey(now) ? 'Next medicine' : 'Next medicine tomorrow'}</small>
                <strong>{next.medicine.name}</strong>
                <em>{formatMedicineTime(next.medicine.time)}</em>
              </span>
              <ChevronRight className="card-arrow" size={20} />
            </button>
          ) : (
            <button type="button" className="next-medicine" onClick={() => onNavigate('medicines')}>
              <span className="medicine-dot"><Pill size={23} /></span>
              <span>
                <strong>{activeMedicines.length ? 'All done for today' : 'Add your first medicine'}</strong>
                <small>{activeMedicines.length ? 'Review your schedule' : 'Set a daily time for your check-in'}</small>
              </span>
              <ChevronRight className="card-arrow" size={20} />
            </button>
          )}
        </section>

        <section className="dashboard-safety" aria-label="Safety and emergency">
          <button type="button" className="dashboard-sos" onClick={onSos}>
            <span className="tool-icon"><ShieldAlert size={23} /></span>
            <span><strong>Emergency SOS</strong><small>Prepare a call or message</small></span>
            <ChevronRight className="card-arrow" size={20} />
          </button>
          <button type="button" className={`safety-strip ${safeZoneStatus?.inside === false ? 'danger' : ''}`} onClick={() => onNavigate('safety')}>
            <span className="tool-icon"><MapPin size={23} /></span>
            <span>
              <strong>{safeZoneStatus ? (safeZoneStatus.inside ? 'Inside your safe zone' : 'Outside your safe zone') : 'Safe zone'}</strong>
              <small>{safeZoneStatus ? `${Math.round(safeZoneStatus.distance)} m from the center` : 'Set or check your location'}</small>
            </span>
            <ChevronRight className="card-arrow" size={20} />
          </button>
        </section>
      </div>

      <section aria-labelledby="tools-title">
        <h2 id="tools-title">Care tools</h2>
        <div className="dashboard-tools">
          {tools.map(({ route, title, description, tone, Icon }) => (
            <button type="button" className={`dashboard-tool tone-${tone}`} onClick={() => onNavigate(route)} key={route}>
              <span className="tool-icon">{createElement(Icon, { size: 23 })}</span>
              <ChevronRight className="card-arrow" size={19} />
              <strong>{title}</strong>
              <small>{description || `${contacts.length} trusted ${contacts.length === 1 ? 'contact' : 'contacts'}`}</small>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
