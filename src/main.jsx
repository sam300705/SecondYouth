import '@fontsource-variable/dm-sans/wght.css';
import '@fontsource-variable/newsreader/wght.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { captureCareInvite, completeCareSignIn } from './lib/careClient.js';
import './index.css';

completeCareSignIn().finally(() => {
  captureCareInvite();
  createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
});

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
