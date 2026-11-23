export function localAssistant(message, context) {
  const normalized = message.toLowerCase();
  if (normalized.includes('medicine') || normalized.includes('dose')) {
    const next = context.medicines.find((medicine) => medicine.active);
    return next
      ? `I can help with your medicine screen. Your next active medicine entry is ${next.name}${next.time ? ` at ${next.time}` : ''}. Please confirm the label and instructions yourself.`
      : 'Open Medicine to review your schedule or add an entry.';
  }
  if (normalized.includes('sos') || normalized.includes('help') || normalized.includes('emergency')) {
    return 'For immediate danger, use your phone’s emergency services. SecondYouth can prepare a call or message to a trusted contact, but it does not contact emergency services silently.';
  }
  if (normalized.includes('setting') || normalized.includes('access')) {
    return 'You can adjust large text, high contrast, voice controls, notifications, and device data export from Settings.';
  }
  if (normalized.includes('safety') || normalized.includes('location')) {
    return 'Open Safety to save a safe-zone center and check your current location while SecondYouth is open.';
  }
  return `I can help you navigate SecondYouth. You are currently on the ${context.currentScreen} screen. Try asking about medicines, settings, safety, or SOS actions.`;
}
