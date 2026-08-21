const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function askAssistant({ message, context, signal } = {}) {
  try {
    const response = await fetch(`${API_BASE}/api/v1/assistant`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message, context }),
      signal,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) return { ok: false, message: payload?.error?.message || 'The assistant is temporarily unavailable.' };
    return payload;
  } catch (error) {
    if (error.name === 'AbortError') return { ok: false, cancelled: true };
    return { ok: false, offline: true, message: 'The assistant needs a connection. You can continue using the offline dashboard.' };
  }
}
