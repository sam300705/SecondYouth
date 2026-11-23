import { useMemo, useState } from 'react';
import { ArrowLeft, Check, Clock, Pencil, Pill, Plus, Trash2, X } from 'lucide-react';
import { formatMedicineTime, isMedicineTakenToday, makeId } from '../lib/appStore.js';

const emptyForm = { name: '', dose: '', time: '08:00', instructions: '', color: 'blue', shape: 'round' };

export default function MedicineList({ medicines, care, onChange, onBack, notify }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [recording, setRecording] = useState(null);

  const sorted = useMemo(() => [...medicines].sort((a, b) => a.time.localeCompare(b.time)), [medicines]);
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const openNew = () => { setEditingId(null); setForm(emptyForm); setError(''); setShowForm(true); };
  const openEdit = (medicine) => { setEditingId(medicine.id); setForm({ ...emptyForm, ...medicine }); setError(''); setShowForm(true); };
  const close = () => { setShowForm(false); setEditingId(null); setError(''); };

  const save = (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.time) { setError('Medicine name and time are required.'); return; }
    if (editingId) {
      onChange(medicines.map((medicine) => medicine.id === editingId ? { ...medicine, ...form, name: form.name.trim() } : medicine));
      notify('Medicine updated.', 'success');
    } else {
      onChange([...medicines, { ...form, id: makeId('medicine'), name: form.name.trim(), active: true, createdAt: new Date().toISOString(), lastTakenDate: null }]);
      notify('Medicine added to the daily schedule.', 'success');
    }
    close();
  };

  const toggleTaken = async (medicine) => {
    setRecording(medicine.id);
    try {
      await care.record(medicine, !isMedicineTakenToday(medicine));
    } catch {
      notify('Could not save this check-in on this device.', 'error');
    } finally {
      setRecording(null);
    }
  };

  const remove = (medicine) => {
    if (!window.confirm(`Remove ${medicine.name} from the schedule?`)) return;
    onChange(medicines.filter((item) => item.id !== medicine.id));
    notify('Medicine removed.', 'info');
  };

  return (
    <div className="page-stack">
      <header className="page-header"><button type="button" className="icon-button" onClick={onBack} aria-label="Back to home"><ArrowLeft /></button><div><p className="eyebrow">Daily schedule</p><h1>Medicines</h1></div><button type="button" className="icon-button primary-icon" onClick={openNew} aria-label="Add medicine"><Plus /></button></header>
      <div className="progress-card"><div><strong>{medicines.filter((medicine) => isMedicineTakenToday(medicine)).length} of {medicines.length}</strong><span>medicines taken today</span></div><div className="progress-track"><i style={{ width: `${medicines.length ? (medicines.filter((medicine) => isMedicineTakenToday(medicine)).length / medicines.length) * 100 : 0}%` }} /></div></div>
      {care.syncProblem && <p role="status">{care.syncProblem}</p>}
      {!sorted.length ? <div className="empty-state"><div><Pill /></div><h2>No medicines yet</h2><p>Add the medicines you take each day. This demo stores your schedule on this device.</p><button type="button" className="primary-button" onClick={openNew}><Plus /> Add medicine</button></div> : (
        <div className="list-stack">{sorted.map((medicine) => {
          const taken = isMedicineTakenToday(medicine);
          const checkin = care.latest.get(medicine.id);
          return <article className={`medicine-card ${taken ? 'is-taken' : ''}`} key={medicine.id}><button type="button" className={`take-button color-${medicine.color}`} onClick={() => toggleTaken(medicine)} disabled={!care.ready || recording !== null} aria-label={`${taken ? 'Mark as not taken' : 'Mark as taken'}: ${medicine.name}`}>{taken ? <Check /> : <Pill />}</button><div className="medicine-copy"><span>{formatMedicineTime(medicine.time)}</span><h2>{medicine.name}</h2><p>{[medicine.dose, medicine.instructions].filter(Boolean).join(' · ') || 'Daily medicine'}</p></div><div className="card-actions"><button type="button" onClick={() => openEdit(medicine)} aria-label={`Edit ${medicine.name}`}><Pencil /></button><button type="button" onClick={() => remove(medicine)} aria-label={`Delete ${medicine.name}`}><Trash2 /></button></div>{taken && <em>TAKEN TODAY</em>}{checkin && <small>{checkin.acknowledged ? 'Synced' : checkin.scope ? 'Saved on this device · Awaiting sync' : 'Saved on this device'}</small>}</article>;
        })}</div>
      )}

      {showForm && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && close()}><form className="modal-card" onSubmit={save} aria-labelledby="medicine-form-title"><div className="modal-head"><div><p className="eyebrow">{editingId ? 'Edit schedule' : 'New schedule'}</p><h2 id="medicine-form-title">{editingId ? 'Update medicine' : 'Add medicine'}</h2></div><button type="button" className="icon-button" onClick={close} aria-label="Close form"><X /></button></div><label className="field"><span>Medicine name *</span><input autoFocus value={form.name} onChange={update('name')} placeholder="Example: Metformin" /></label><div className="form-grid"><label className="field"><span>Dose</span><input value={form.dose} onChange={update('dose')} placeholder="500 mg" /></label><label className="field"><span>Time *</span><input type="time" value={form.time} onChange={update('time')} /></label></div><label className="field"><span>Instructions</span><input value={form.instructions} onChange={update('instructions')} placeholder="After breakfast" /></label><div className="form-grid"><label className="field"><span>Shape</span><select value={form.shape} onChange={update('shape')}><option value="round">Round</option><option value="capsule">Capsule</option><option value="tablet">Tablet</option></select></label><label className="field"><span>Color</span><select value={form.color} onChange={update('color')}><option value="blue">Blue</option><option value="green">Green</option><option value="red">Red</option><option value="yellow">Yellow</option><option value="white">White</option></select></label></div>{error && <p className="form-error">{error}</p>}<button type="submit" className="primary-button">{editingId ? 'Save changes' : 'Add to schedule'}</button></form></div>}
    </div>
  );
}
