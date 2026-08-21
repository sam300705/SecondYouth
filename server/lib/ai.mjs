const MAX_MESSAGE_LENGTH = 1200;
const MAX_CONTEXT_ITEMS = 12;

const redact = (value) => String(value ?? '')
  .replace(/\b\+?[0-9][0-9 ()-]{6,}[0-9]\b/g, '[redacted phone]')
  .replace(/https?:\/\/[^\s]+/gi, '[redacted link]');

export function buildAssistantContext({ profile, medicines = [], route = 'home' } = {}) {
  return {
    displayName: profile?.name ? redact(profile.name).slice(0, 80) : 'the user',
    currentScreen: String(route).slice(0, 40),
    medicines: medicines.slice(0, MAX_CONTEXT_ITEMS).map((medicine) => ({
      name: redact(medicine.name).slice(0, 100),
      time: String(medicine.time || '').slice(0, 5),
      instructions: redact(medicine.instructions || medicine.dose || '').slice(0, 160),
      active: medicine.active !== false,
    })),
  };
}

function localAssistant(message, context) {
  const normalized = message.toLowerCase();
  if (normalized.includes('medicine') || normalized.includes('dose')) {
    const next = context.medicines.find((medicine) => medicine.active);
    return next
      ? `I can help with your medicine screen. Your next active medicine entry is ${next.name}${next.time ? ` at ${next.time}` : ''}. Please confirm the label and instructions yourself.`
      : 'There are no active medicines in the current offline data. You can add one from the Medicine screen.';
  }
  if (normalized.includes('sos') || normalized.includes('help') || normalized.includes('emergency')) {
    return 'For immediate danger, use your phone’s emergency services. SecondYouth can prepare a call or message to a trusted contact, but it does not contact emergency services silently.';
  }
  if (normalized.includes('setting') || normalized.includes('access')) {
    return 'You can adjust large text, high contrast, voice controls, notifications, and device data export from Settings.';
  }
  return `I can help you navigate SecondYouth. You are currently on the ${context.currentScreen} screen. Try asking about medicines, settings, safety, or SOS actions.`;
}

export function createAiGateway({ provider = 'disabled', apiKey = '', baseUrl = 'https://api.openai.com/v1', model = 'gpt-4o-mini', fetchImpl = globalThis.fetch } = {}) {
  async function complete(message, context) {
    const safeMessage = redact(message).trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!safeMessage) return { ok: false, code: 'empty_message', message: 'Please enter a question.' };
    if (provider === 'openai' && apiKey && typeof fetchImpl === 'function') {
      const response = await fetchImpl(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
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
    }
    return { ok: true, text: localAssistant(safeMessage, context), provider: 'local' };
  }
  return { complete };
}
