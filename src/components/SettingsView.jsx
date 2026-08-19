import { useState } from 'react';
import { ArrowLeft, Bell, Download, LogOut, RotateCcw, Save, ShieldCheck, TextCursorInput, Volume2 } from 'lucide-react';
import { normalizePhone } from '../lib/appStore.js';

export default function SettingsView({ profile, settings, onProfileChange, onSettingsChange, onLock, onReset, onBack, notify, state }) {
  const [form, setForm] = useState({ name: profile.name, phone: profile.phone });

  const saveProfile = (event) => {
    event.preventDefault();
    if (!form.name.trim()) { notify('Name cannot be empty.', 'error'); return; }
    onProfileChange({ ...profile, name: form.name.trim(), phone: normalizePhone(form.phone) });
    notify('Profile updated.', 'success');
  };

  const requestNotifications = async () => {
    if (!('Notification' in window)) { notify('Notifications are not supported in this browser.', 'error'); return; }
    const permission = await Notification.requestPermission();
    onSettingsChange({ ...settings, notificationsEnabled: permission === 'granted' });
    notify(permission === 'granted' ? 'Notifications enabled.' : 'Notification permission was not granted.', permission === 'granted' ? 'success' : 'info');
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'secondyouth-backup.json'; anchor.click(); URL.revokeObjectURL(url);
    notify('Device data exported.', 'success');
  };

  return <div className="page-stack"><header className="page-header"><button type="button" className="icon-button" onClick={onBack} aria-label="Back to home"><ArrowLeft /></button><div><p className="eyebrow">Preferences</p><h1>Settings</h1></div><span /></header><form className="settings-section" onSubmit={saveProfile}><div className="settings-title"><div className="settings-icon"><TextCursorInput /></div><div><h2>Profile</h2><p>Used for greetings and emergency messages.</p></div></div><label className="field"><span>Name</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label className="field"><span>Your phone</span><input type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label><button type="submit" className="secondary-button"><Save /> Save profile</button></form><section className="settings-section"><div className="settings-title"><div className="settings-icon"><ShieldCheck /></div><div><h2>Accessibility</h2><p>Adjust the interface for comfortable daily use.</p></div></div><label className="switch-row"><span><TextCursorInput /><b>Large text</b><small>Increase key labels and controls.</small></span><input type="checkbox" checked={settings.largeText} onChange={(event) => onSettingsChange({ ...settings, largeText: event.target.checked })} /></label><label className="switch-row"><span><ShieldCheck /><b>High contrast</b><small>Strengthen borders and text contrast.</small></span><input type="checkbox" checked={settings.highContrast} onChange={(event) => onSettingsChange({ ...settings, highContrast: event.target.checked })} /></label><label className="switch-row"><span><Volume2 /><b>Voice controls</b><small>Allow navigation using supported speech recognition.</small></span><input type="checkbox" checked={settings.voiceEnabled} onChange={(event) => onSettingsChange({ ...settings, voiceEnabled: event.target.checked })} /></label></section><section className="settings-section"><div className="settings-title"><div className="settings-icon"><Bell /></div><div><h2>Device features</h2><p>Permissions stay under browser control.</p></div></div><button type="button" className="secondary-button" onClick={requestNotifications}><Bell /> {settings.notificationsEnabled ? 'Notifications enabled' : 'Enable notifications'}</button><button type="button" className="secondary-button" onClick={exportData}><Download /> Export device data</button></section><section className="settings-section danger-section"><button type="button" className="secondary-button" onClick={onLock}><LogOut /> Lock dashboard</button><button type="button" className="danger-button" onClick={() => window.confirm('Erase the profile, medicines, contacts, settings, SOS history, and audio memories from this browser?') && onReset()}><RotateCcw /> Erase device data</button></section></div>;
}
