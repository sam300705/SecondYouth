import test from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultState,
  emergencyMessage,
  getNextMedicine,
  haversineDistance,
  isValidPhone,
  loadState,
  normalizePhone,
  parseBackup,
  saveState,
  STORAGE_KEY,
  todayKey,
} from './appStore.js';

test('normalizes and validates international phone numbers', () => {
  assert.equal(normalizePhone('+91 82525-81619'), '+918252581619');
  assert.equal(isValidPhone('+91 82525-81619'), true);
  assert.equal(isValidPhone('123'), false);
});

test('calculates a near-zero distance for matching coordinates', () => {
  const point = { latitude: 28.4744, longitude: 77.5040 };
  assert.equal(haversineDistance(point, point), 0);
});

test('selects the nearest upcoming untaken medicine', () => {
  const now = new Date(2026, 7, 20, 8, 0, 0);
  const medicines = [
    { id: 'late', name: 'Night dose', time: '20:00' },
    { id: 'soon', name: 'Morning dose', time: '09:00' },
  ];
  assert.equal(getNextMedicine(medicines, now).medicine.id, 'soon');
});

test('formats local date keys without UTC shifts', () => {
  assert.equal(todayKey(new Date(2026, 7, 20, 23, 30)), '2026-08-20');
});

test('adds map coordinates to emergency messages when available', () => {
  const message = emergencyMessage({ name: 'Asha' }, { latitude: 28.4, longitude: 77.5 });
  assert.match(message, /Asha needs help/);
  assert.match(message, /maps\.google\.com/);
});

test('persists a versioned state payload and always reloads locked', () => {
  const previousWindow = globalThis.window;
  let stored = null;
  globalThis.window = { localStorage: { getItem: () => stored, setItem: (_key, value) => { stored = value; }, removeItem: () => { stored = null; } } };
  saveState({ profile: { name: 'Test' }, session: { locked: false } });
  const loaded = loadState();
  assert.equal(JSON.parse(stored).schemaVersion, 1);
  assert.equal(loaded.profile.name, 'Test');
  assert.equal(loaded.session.locked, true);
  assert.match(STORAGE_KEY, /^secondyouth\.state\.v1$/);
  globalThis.window = previousWindow;
});

test('recovers from malformed local state', () => {
  const previousWindow = globalThis.window;
  globalThis.window = { localStorage: { getItem: () => '{not-json', setItem: () => {}, removeItem: () => {} } };
  assert.equal(loadState().profile, null);
  assert.deepEqual(loadState().medicines, []);
  globalThis.window = previousWindow;
});

test('restores exported care data with a locked persisted session', () => {
  const backup = {
    ...defaultState,
    profile: { name: 'Asha', phone: '+918252581619' },
    session: { locked: false },
    medicines: [{ id: 'test', name: 'Example', dose: '', time: '09:00', instructions: '', color: 'blue', shape: 'round', active: true, lastTakenDate: null }],
  };
  const restored = parseBackup(JSON.stringify(backup));
  assert.deepEqual(restored.medicines, backup.medicines);
  assert.deepEqual(restored.profile, backup.profile);
  assert.equal(restored.session.locked, true);
  assert.throws(() => parseBackup(JSON.stringify({ ...backup, medicines: [...backup.medicines, ...backup.medicines] })), /Invalid SecondYouth backup/);
  assert.throws(() => parseBackup(JSON.stringify({ ...backup, contacts: [null] })), /Invalid SecondYouth backup/);
});
