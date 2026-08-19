import { useState } from 'react';
import { ArrowLeft, Crosshair, LocateFixed, MapPin, Navigation, ShieldCheck, ShieldX } from 'lucide-react';
import { haversineDistance } from '../lib/appStore.js';

const getPosition = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) { reject(new Error('Location is not supported by this browser.')); return; }
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy, capturedAt: new Date().toISOString() }),
    (error) => reject(new Error(error.code === 1 ? 'Location permission was denied.' : 'Could not get your location. Try again outdoors.')),
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
  );
});

export default function SafetyView({ settings, onSettingsChange, status, onStatusChange, onBack, notify }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const setCenter = async () => {
    setBusy(true); setError('');
    try {
      const center = await getPosition();
      onSettingsChange({ ...settings, safeZoneCenter: center, safeZoneEnabled: true });
      onStatusChange({ inside: true, distance: 0, current: center, checkedAt: new Date().toISOString() });
      notify('Safe-zone center saved on this device.', 'success');
    } catch (nextError) { setError(nextError.message); } finally { setBusy(false); }
  };

  const check = async () => {
    if (!settings.safeZoneCenter) { setError('Set the safe-zone center first.'); return; }
    setBusy(true); setError('');
    try {
      const current = await getPosition();
      const distance = haversineDistance(settings.safeZoneCenter, current);
      onStatusChange({ inside: distance <= settings.safeZoneRadius, distance, current, checkedAt: new Date().toISOString() });
    } catch (nextError) { setError(nextError.message); } finally { setBusy(false); }
  };

  return <div className="page-stack"><header className="page-header"><button type="button" className="icon-button" onClick={onBack} aria-label="Back to home"><ArrowLeft /></button><div><p className="eyebrow">Location safety</p><h1>Safe zone</h1></div><span /></header><div className={`zone-status ${status ? (status.inside ? 'inside' : 'outside') : ''}`}>{status ? (status.inside ? <ShieldCheck /> : <ShieldX />) : <MapPin />}<div><p>{status ? (status.inside ? 'You are inside the safe zone' : 'You are outside the safe zone') : 'No location check yet'}</p><strong>{status ? `${Math.round(status.distance)} metres from the saved center` : 'Set your current place as the center'}</strong>{status?.checkedAt && <span>Checked {new Date(status.checkedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>}</div></div><section className="settings-section"><div className="setting-row"><div><strong>Safe-zone radius</strong><span>Choose how far the safe area extends.</span></div><b>{settings.safeZoneRadius} m</b></div><input className="range" type="range" min="100" max="2000" step="50" value={settings.safeZoneRadius} onChange={(event) => onSettingsChange({ ...settings, safeZoneRadius: Number(event.target.value) })} aria-label="Safe-zone radius in metres" /><div className="button-stack"><button type="button" className="primary-button" onClick={check} disabled={busy || !settings.safeZoneCenter}><LocateFixed /> {busy ? 'Getting location…' : 'Check my location'}</button><button type="button" className="secondary-button" onClick={setCenter} disabled={busy}><Crosshair /> {settings.safeZoneCenter ? 'Replace center with current location' : 'Use current location as center'}</button></div>{error && <p className="form-error">{error}</p>}</section>{settings.safeZoneCenter && <section className="location-details"><Navigation /><div><strong>Saved center</strong><span>{settings.safeZoneCenter.latitude.toFixed(5)}, {settings.safeZoneCenter.longitude.toFixed(5)}</span><a href={`https://maps.google.com/?q=${settings.safeZoneCenter.latitude},${settings.safeZoneCenter.longitude}`} target="_blank" rel="noreferrer">Open in Maps ↗</a></div></section>}<div className="safety-note"><ShieldCheck /><p><strong>Important:</strong> browsers cannot reliably monitor location after this page is closed. A production safety service needs explicit consent, a secure backend, and native background location support.</p></div></div>;
}
