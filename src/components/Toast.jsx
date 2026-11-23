import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react';

const icons = {
  success: CheckCircle2,
  error: CircleAlert,
  info: Info,
};

export default function Toast({ toast, onClose }) {
  if (!toast) return null;
  const Icon = icons[toast.type] ?? Info;
  return (
    <div className="toast-viewport" role="status" aria-live="polite">
      <div className={`toast toast-${toast.type ?? 'info'}`}>
        <Icon aria-hidden="true" />
        <span>{toast.message}</span>
        <button type="button" onClick={onClose} aria-label="Dismiss message"><X /></button>
      </div>
    </div>
  );
}

