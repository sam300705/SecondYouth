export const STORAGE_KEY = 'secondyouth:v2';

export const defaultState = {
  profile: null,
  medicines: [],
  contacts: [],
  settings: {
    largeText: true,
    highContrast: false,
    voiceEnabled: true,
    notificationsEnabled: false,
    safeZoneEnabled: false,
    safeZoneRadius: 250,
    safeZoneCenter: null,
  },
  sosHistory: [],
  session: { locked: true },
};

const storageAvailable = () => typeof window !== 'undefined' && 'localStorage' in window;

export function loadState() {
  if (!storageAvailable()) return defaultState;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    if (!parsed || typeof parsed !== 'object') return defaultState;
    return {
      ...defaultState,
      ...parsed,
      profile: parsed.profile ?? null,
      medicines: Array.isArray(parsed.medicines) ? parsed.medicines : [],
      contacts: Array.isArray(parsed.contacts) ? parsed.contacts : [],
      settings: { ...defaultState.settings, ...(parsed.settings ?? {}) },
      sosHistory: Array.isArray(parsed.sosHistory) ? parsed.sosHistory : [],
      session: { locked: true },
    };
  } catch {
    return defaultState;
  }
}

export function saveState(state) {
  if (!storageAvailable()) return;
  const persisted = { ...state, session: { locked: true } };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
}

export function resetState() {
  if (storageAvailable()) window.localStorage.removeItem(STORAGE_KEY);
}

export function makeId(prefix = 'item') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function normalizePhone(phone = '') {
  return phone.trim().replace(/[^+\d]/g, '');
}

export function isValidPhone(phone = '') {
  return /^\+?[0-9]{7,15}$/.test(normalizePhone(phone));
}

export function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isMedicineTakenToday(medicine, date = new Date()) {
  return medicine.lastTakenDate === todayKey(date);
}

export function formatMedicineTime(time = '') {
  if (!/^\d{2}:\d{2}$/.test(time)) return time;
  const [hours, minutes] = time.split(':').map(Number);
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(
    new Date(2000, 0, 1, hours, minutes),
  );
}

export function getNextMedicine(medicines = [], now = new Date()) {
  if (!medicines.length) return null;
  const candidates = medicines
    .filter((medicine) => medicine.active !== false && !isMedicineTakenToday(medicine, now))
    .map((medicine) => {
      const [hours, minutes] = medicine.time.split(':').map(Number);
      const scheduled = new Date(now);
      scheduled.setHours(hours, minutes, 0, 0);
      if (scheduled < now) scheduled.setDate(scheduled.getDate() + 1);
      return { medicine, scheduled };
    })
    .sort((a, b) => a.scheduled - b.scheduled);
  return candidates[0] ?? null;
}

export function haversineDistance(a, b) {
  if (!a || !b) return Number.POSITIVE_INFINITY;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadius = 6371000;
  const latDistance = toRadians(b.latitude - a.latitude);
  const lngDistance = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const value = Math.sin(latDistance / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(lngDistance / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(value));
}

export function emergencyMessage(profile, location) {
  const who = profile?.name ? `${profile.name} needs help.` : 'I need help.';
  if (!location) return `${who} Please call me as soon as possible.`;
  const map = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
  return `${who} My current location: ${map}`;
}

