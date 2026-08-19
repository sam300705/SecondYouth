import test from 'node:test';
import assert from 'node:assert/strict';
import {
  emergencyMessage,
  getNextMedicine,
  haversineDistance,
  isValidPhone,
  normalizePhone,
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
