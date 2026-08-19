# SecondYouth

SecondYouth is an accessible, offline-first senior-assistance product demo. It brings medicine schedules, trusted contacts, emergency actions, location checks, a camera-based safety demonstration, and private audio memories into one simple interface.

**Live demo:** [second-youth.vercel.app](https://second-youth.vercel.app/)

## Product flows

- Two-step device onboarding with profile and primary emergency contact
- Local device lock screen with an explicit production-authentication disclaimer
- Persistent medicine schedule with add, edit, delete, daily completion, and next-dose calculation
- Trusted family contacts with primary-contact selection and real `tel:` / `sms:` actions
- SOS countdown that requests current location and prepares call/message actions
- Safe-zone setup and on-demand distance checks using browser geolocation
- Real camera preview with clearly labeled sample recognition scenarios
- Legacy Vault audio recording persisted in IndexedDB
- Voice navigation where the Web Speech API is supported
- Accessibility preferences, browser notifications, JSON export, deep links, and offline caching

## Privacy model

The deployed demo has no external database. Profile, medicine, contact, settings, and SOS-log data are saved in `localStorage`; audio memories are saved in IndexedDB. The app does not upload this information.

This architecture makes the demo fully usable without credentials, but it is not a production healthcare backend. A production release would require:

- verified passkeys or another server-validated authentication method;
- encrypted, consent-aware cloud sync and account recovery;
- a compliant notification and escalation service;
- native background location for geofencing;
- a clinically validated vision/OCR service with human confirmation;
- security, privacy, accessibility, and medical-safety review.

## Technology

- React 19 and Vite 5
- React Router dependency retained for future server-backed routing
- Lucide React icons
- Browser APIs: Geolocation, MediaDevices, MediaRecorder, Speech Recognition, Speech Synthesis, Notifications, IndexedDB, and Service Workers

## Run locally

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run check
```

This runs ESLint, Node unit tests, and a production Vite build.

## Repository structure

```text
src/
  components/      Product screens and reusable feedback UI
  lib/             Persistent state, safety calculations, and audio storage
  App.jsx          Routing, SOS, notifications, voice control, and state orchestration
public/
  manifest.webmanifest
  sw.js            Offline application shell
```

## Safety note

SecondYouth is a portfolio demonstration. It is not a medical device and must not be relied on as the only way to contact emergency services, identify medicine, or monitor a vulnerable person.
