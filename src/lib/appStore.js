export const STORAGE_KEY = 'secondyouth.state.v1';
export const STORAGE_VERSION = 1;

export const defaultState = {
  schemaVersion: STORAGE_VERSION,
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
const cloneDefaultState = () => structuredClone(defaultState);

function normalizeState(parsed) {
  if (!parsed || typeof parsed !== 'object') return cloneDefaultState();
  return {
    ...cloneDefaultState(),
    ...parsed,
    schemaVersion: STORAGE_VERSION,
    profile: parsed.profile ?? null,
    medicines: Array.isArray(parsed.medicines) ? parsed.medicines : [],
    contacts: Array.isArray(parsed.contacts) ? parsed.contacts : [],
    settings: { ...defaultState.settings, ...(parsed.settings ?? {}) },
    sosHistory: Array.isArray(parsed.sosHistory) ? parsed.sosHistory : [],
    session: { locked: true },
  };
}

export function loadState() {
  if (!storageAvailable()) return cloneDefaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return normalizeState(raw ? JSON.parse(raw) : null);
  } catch {
    return cloneDefaultState();
  }
}

export function saveState(state) {
  if (!storageAvailable()) return false;
  try {
    const persisted = normalizeState({ ...state, session: { locked: true } });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    return true;
  } catch {
    return false;
  }
}

export function resetState() {
  if (!storageAvailable()) return false;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
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

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isText = (value) => typeof value === 'string';
const isName = (value) => isText(value) && Boolean(value.trim());
const isPhone = (value) => isText(value) && /^\+?\d{7,15}$/.test(value);
const isLocation = (value) => isRecord(value)
  && Number.isFinite(value.latitude) && Math.abs(value.latitude) <= 90
  && Number.isFinite(value.longitude) && Math.abs(value.longitude) <= 180;
const isRecordList = (items, validate) => Array.isArray(items)
  && items.every((item) => isRecord(item) && isName(item.id) && validate(item))
  && new Set(items.map((item) => item.id)).size === items.length;

export function parseBackup(text) {
  const backup = JSON.parse(text);
  const validProfile = isRecord(backup?.profile) && isName(backup.profile.name)
    && (backup.profile.phone === '' || isPhone(backup.profile.phone));
  const validMedicines = isRecordList(backup?.medicines, (item) => isName(item.name)
    && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(item.time)
    && ['dose', 'instructions', 'color', 'shape'].every((key) => isText(item[key]))
    && typeof item.active === 'boolean'
    && (item.lastTakenDate === null || /^\d{4}-\d{2}-\d{2}$/.test(item.lastTakenDate)));
  const validContacts = isRecordList(backup?.contacts, (item) => isName(item.name)
    && isName(item.relation) && isPhone(item.phone) && typeof item.primary === 'boolean');
  const validHistory = isRecordList(backup?.sosHistory, (item) => isText(item.createdAt)
    && Number.isFinite(Date.parse(item.createdAt)) && (item.location === null || isLocation(item.location)));
  const settings = backup?.settings;
  const validSettings = isRecord(settings)
    && Object.keys(defaultState.settings).filter((key) => typeof defaultState.settings[key] === 'boolean')
      .every((key) => typeof settings[key] === 'boolean')
    && Number.isInteger(settings.safeZoneRadius) && settings.safeZoneRadius >= 100 && settings.safeZoneRadius <= 2000
    && (settings.safeZoneCenter === null || isLocation(settings.safeZoneCenter));

  if (backup?.schemaVersion !== STORAGE_VERSION || !validProfile || !validMedicines || !validContacts || !validHistory || !validSettings) {
    throw new Error('Invalid SecondYouth backup');
  }
  const { profile, medicines, contacts, sosHistory } = backup;
  return normalizeState({ profile, medicines, contacts, settings, sosHistory });
}
