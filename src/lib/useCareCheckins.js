import { useCallback, useEffect, useMemo, useState } from 'react';
import { todayKey } from './appStore.js';
import { careIdentity, careRequest, sharingKey } from './careClient.js';
import { acknowledgeCheckin, appendCheckin, listCheckins } from './checkinDb.js';

export function useCareCheckins(enabled) {
  const [events, setEvents] = useState(null);
  const [syncProblem, setSyncProblem] = useState('');
  const refresh = useCallback(async () => {
    const rows = await listCheckins();
    setEvents((current) => current?.length === rows.length && current.every((event, index) => event.order === rows[index].order && event.acknowledged === rows[index].acknowledged) ? current : rows);
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    let stopped = false;
    let running = false;
    async function sync() {
      if (running || stopped) return;
      running = true;
      try {
        const pendingScope = localStorage.getItem(sharingKey);
        const pending = (await listCheckins()).filter((event) => event.scope && event.scope === pendingScope && !event.acknowledged);
        if (!stopped && pending.length && navigator.onLine) {
          const identity = await careIdentity();
          if (identity?.scope !== pendingScope) throw new Error('Sign in with the account that enabled sharing to finish sync.');
          for (const { order, scope, acknowledged: _acknowledged, ...event } of pending) {
            if (stopped || localStorage.getItem(sharingKey) !== scope) break;
            const result = await careRequest('checkins', { method: 'POST', token: identity.token, body: event });
            if (result.id !== event.id) throw new Error('Sync acknowledgement was invalid.');
            if (!stopped) await acknowledgeCheckin({ ...event, order, scope });
          }
        }
        if (!stopped) setSyncProblem('');
      } catch (error) {
        if (!stopped) setSyncProblem(error.message || 'Check-in storage or sync is unavailable.');
      } finally {
        running = false;
        if (!stopped) await refresh().catch(() => {});
      }
    }
    sync();
    window.addEventListener('online', sync);
    const timer = window.setInterval(sync, 4000);
    return () => {
      stopped = true;
      window.removeEventListener('online', sync);
      window.clearInterval(timer);
    };
  }, [enabled, refresh]);

  async function record(medicine, taken) {
    const event = {
      id: crypto.randomUUID(),
      medicineId: medicine.id,
      name: medicine.name.slice(0, 160),
      date: todayKey(),
      time: medicine.time,
      taken,
      recordedAt: new Date().toISOString(),
      scope: localStorage.getItem(sharingKey),
      acknowledged: false,
    };
    const order = await appendCheckin(event);
    setEvents((current) => {
      if (current?.some((item) => item.order === order)) return current;
      return [...(current || []), { ...event, order }].sort((a, b) => a.order - b.order);
    });
  }

  const today = todayKey();
  const latest = useMemo(() => {
    const result = new Map();
    for (const event of events || []) {
      if (event.date === today) result.set(event.medicineId, event);
    }
    return result;
  }, [events, today]);
  return { ready: events !== null, latest, record, syncProblem, refresh };
}
