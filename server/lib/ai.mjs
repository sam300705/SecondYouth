import { localAssistant } from '../../src/lib/localAssistant.js';

const MAX_MESSAGE_LENGTH = 1200;
const MAX_CONTEXT_ITEMS = 12;

const redact = (value) => String(value ?? '')
  .replace(/\b\+?[0-9][0-9 ()-]{6,}[0-9]\b/g, '[redacted phone]')
  .replace(/https?:\/\/[^\s]+/gi, '[redacted link]');

export function buildAssistantContext({ profile, medicines = [], route = 'home' } = {}) {
  return {
    displayName: profile?.name ? redact(profile.name).slice(0, 80) : 'the user',
    currentScreen: String(route).slice(0, 40),
    medicines: (Array.isArray(medicines) ? medicines : []).slice(0, MAX_CONTEXT_ITEMS).filter((item) => item && typeof item === 'object').map((medicine) => ({
      name: redact(medicine.name).slice(0, 100),
      time: String(medicine.time || '').slice(0, 5),
      instructions: redact(medicine.instructions || medicine.dose || '').slice(0, 160),
      active: medicine.active !== false,
    })),
  };
}

export function createAiGateway({ provider = 'disabled', apiKey = '', baseUrl = 'https://api.openai.com/v1', model = 'gpt-4o-mini', fetchImpl = globalThis.fetch } = {}) {
  async function complete(message, context) {
    const safeMessage = redact(typeof message === 'string' ? message : '').trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!safeMessage) return { ok: false, code: 'empty_message', message: 'Please enter a question.' };
    if (provider === 'openai' && apiKey && typeof fetchImpl === 'function') {
      try {
        const response = await fetchImpl(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
          method: 'POST',
          signal: AbortSignal.timeout(8_000),
          headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
          body: JSON.stringify({
            model,
            temperature: 0.2,
            max_tokens: 220,
            messages: [
              { role: 'system', content: 'You are a calm, concise navigation assistant for SecondYouth. Do not diagnose, change medicine plans, or claim to contact emergency services. Encourage confirmation and direct users to emergency services for immediate danger.' },
              { role: 'user', content: JSON.stringify({ message: safeMessage, context }) },
            ],
          }),
        });
        if (response.ok) {
          const payload = await response.json();
          const text = payload?.choices?.[0]?.message?.content?.trim();
          if (text) return { ok: true, text: redact(text).slice(0, 2000), provider: 'openai' };
        }
      } catch { /* Retain on-device guidance when the provider is unreachable. */ }
    }
    return { ok: true, text: localAssistant(safeMessage, context), provider: 'local' };
  }
  return { complete };
}
