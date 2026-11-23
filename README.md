# SecondYouth

SecondYouth is an accessible, offline-first senior-assistance product demo. It brings medicine schedules, trusted contacts, emergency actions, location checks, a camera-based safety demonstration, and private audio memories into one simple interface.

**Live site:** [vridhcare.in](https://vridhcare.in) · [Vercel deployment](https://second-youth.vercel.app/)

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
- Accessibility preferences, browser notifications, JSON backup and restore, deep links, and offline caching

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

- React 19 and Vite 8
- React Router dependency retained for future server-backed routing
- Lucide React icons
- Browser APIs: Geolocation, MediaDevices, MediaRecorder, Speech Recognition, Speech Synthesis, Notifications, IndexedDB, and Service Workers

## Run locally

```bash
npm ci
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

## Production-shaped platform foundations

The repository now includes an opt-in Node API foundation under `server/`. It provides health and readiness probes, structured JSON errors, request IDs, secure response headers, bounded rate limiting, signed short-lived access tokens, refresh-token rotation with reuse detection, and a server-side assistant endpoint. In development, the API can run without credentials and provides a deterministic local assistant fallback; in production, set `SECONDYOUTH_JWT_SECRET` to a random value of at least 32 characters and keep `REQUIRE_AUTH=true`.

```bash
npm run api
# API health: http://localhost:8787/healthz
```

The dashboard assistant runs on the device, including offline. It does not send questions or medicine data to the API. Separate API integrations can use `/api/v1/assistant` with server-issued authentication in production. To enable the optional provider for those integrations, configure `AI_PROVIDER=openai`, `OPENAI_API_KEY`, and optionally `OPENAI_MODEL` and `OPENAI_BASE_URL`.

The first deployment slice is intentionally a **modular monolith**, not premature microservices. `server/` contains the API boundary and security primitives; `src/` remains the offline-first product UI; `infra/docker/` contains the production image and local compose file; `infra/k8s/api.yaml` is a portable Kubernetes starting point; and `.github/workflows/ci.yml` runs the quality gate and container build on pushes and pull requests.

## Verification

The complete local quality gate is:

```bash
npm run check
```

It runs ESLint, the existing domain tests, server security/API tests, and the production Vite build. The API process is also smoke-tested through `/healthz`. Docker and Kubernetes artifacts are included for deployment environments that provide those runtimes; if Docker is not installed locally, GitHub Actions performs the container build.

## Build and serve the device-local app

Run `npm run build`, then `npm run api` to serve the built dashboard and API from port 8787. For a production-mode launch, set `NODE_ENV=production` and inject `SECONDYOUTH_JWT_SECRET` through your deployment secret store. The Docker image includes both the dashboard and API. Terminate HTTPS at the deployment edge so browsers can use service workers, geolocation, camera, and microphone features.

The first successful online load installs the versioned offline shell. The service worker caches the dashboard and its static assets. API responses stay out of the service-worker cache. Reminders depend on browser permissions and run while the app is open.

Use **Export device data** in Settings and restore from the welcome screen or Settings. A restore replaces care data after confirmation. The JSON contains personal information and should be stored with care. Audio memories remain in browser storage.

## Final-year project

SecondYouth includes offline medicine check-ins, PostgreSQL sync, and revocable caregiver access. The project guide covers the two-browser demonstration, managed sign-in, and an evaluation protocol. [Final-year project guide](docs/final-year-project.md)

## Production prerequisites

Before onboarding real users, verify these release gates on the target deployment:

| Capability | Release evidence |
| --- | --- |
| Identity and caregiver access | Managed sign-in and account recovery work end to end. Verify that caregiver access is limited to explicitly delegated profiles and can be revoked. |
| Data durability | Use encrypted transactional storage and encrypted object storage for synced recordings. Verify access logging, export, deletion, conflict handling, and restore from backup. |
| Reminders and emergency actions | Test delivery, retries, and duplicate handling with the selected providers. Verify call and message handoff on supported phones. Background location requires a separately tested native workflow. |
| Camera and assistive use | Sample recognition is a demonstration. Any real medicine identification workflow requires human confirmation and clinical validation before release. |
| Accessibility and operations | Test supported devices with screen readers, keyboard-only navigation, and zoom. Verify TLS, production monitoring, incident response, and privacy and medical-safety review. | The current offline demo remains the safe default when those services are not configured.
