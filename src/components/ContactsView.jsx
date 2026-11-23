import { useState } from 'react';
import { ArrowLeft, MessageSquareText, Pencil, Phone, Plus, Star, Trash2, UserRound, X } from 'lucide-react';
import { isValidPhone, makeId, normalizePhone } from '../lib/appStore.js';

const emptyForm = { name: '', phone: '', relation: '' };

export default function ContactsView({ contacts, onChange, onBack, notify }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const openForm = (contact = null) => {
    setEditingId(contact?.id ?? null);
    setForm(contact ? { name: contact.name, phone: contact.phone, relation: contact.relation } : emptyForm);
    setError('');
    setShowForm(true);
  };

  const save = (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.relation.trim() || !isValidPhone(form.phone)) { setError('Enter a name, relationship, and valid phone number.'); return; }
    const values = { name: form.name.trim(), relation: form.relation.trim(), phone: normalizePhone(form.phone) };
    if (editingId) {
      onChange(contacts.map((contact) => contact.id === editingId ? { ...contact, ...values } : contact));
    } else {
      onChange([...contacts, { ...values, id: makeId('contact'), primary: contacts.length === 0 }]);
    }
    setShowForm(false);
    notify(editingId ? 'Family contact updated.' : 'Family contact saved.', 'success');
  };

  const makePrimary = (id) => onChange(contacts.map((contact) => ({ ...contact, primary: contact.id === id })));
  const remove = (contact) => {
    if (!window.confirm(`Remove ${contact.name} from trusted contacts?`)) return;
    const remaining = contacts.filter((item) => item.id !== contact.id);
    if (contact.primary && remaining.length) remaining[0] = { ...remaining[0], primary: true };
    onChange(remaining); notify('Contact removed.', 'info');
  };

  return <div className="page-stack"><header className="page-header"><button type="button" className="icon-button" onClick={onBack} aria-label="Back to home"><ArrowLeft /></button><div><p className="eyebrow">Trusted circle</p><h1>Family</h1></div><button type="button" className="icon-button primary-icon" onClick={() => openForm()} aria-label="Add contact"><Plus /></button></header><p className="page-intro">Calls and messages open your phone’s own apps. SecondYouth never sends anything without your action.</p>{!contacts.length ? <div className="empty-state"><div><UserRound /></div><h2>No contacts yet</h2><p>Add someone you trust so emergency actions are ready.</p><button type="button" className="primary-button" onClick={() => openForm()}><Plus /> Add contact</button></div> : <div className="contact-list">{contacts.map((contact) => <article className="contact-card" key={contact.id}><div className="avatar">{contact.name.slice(0, 1).toUpperCase()}</div><div className="contact-copy"><div><h2>{contact.name}</h2>{contact.primary && <span><Star /> Primary</span>}</div><p>{contact.relation} · {contact.phone}</p></div><div className="contact-actions"><a href={`tel:${contact.phone}`} aria-label={`Call ${contact.name}`}><Phone /></a><a href={`sms:${contact.phone}`} aria-label={`Message ${contact.name}`}><MessageSquareText /></a><button type="button" onClick={() => makePrimary(contact.id)} disabled={contact.primary} aria-label={`Make ${contact.name} primary`}><Star /></button><button type="button" onClick={() => openForm(contact)} aria-label={`Edit ${contact.name}`}><Pencil /></button><button type="button" onClick={() => remove(contact)} aria-label={`Remove ${contact.name}`}><Trash2 /></button></div></article>)}</div>}{showForm && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowForm(false)}><form className="modal-card" onSubmit={save}><div className="modal-head"><div><p className="eyebrow">New trusted person</p><h2>{editingId ? 'Edit family contact' : 'Add family contact'}</h2></div><button type="button" className="icon-button" onClick={() => setShowForm(false)} aria-label="Close form"><X /></button></div><label className="field"><span>Name</span><input autoFocus value={form.name} onChange={update('name')} placeholder="Example: Rahul" /></label><label className="field"><span>Phone number</span><input type="tel" inputMode="tel" value={form.phone} onChange={update('phone')} placeholder="+91 98765 43210" /></label><label className="field"><span>Relationship</span><input value={form.relation} onChange={update('relation')} placeholder="Example: Son" /></label>{error && <p className="form-error">{error}</p>}<button type="submit" className="primary-button">Save contact</button></form></div>}</div>;
}

