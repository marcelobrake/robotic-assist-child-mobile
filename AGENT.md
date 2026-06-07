# AGENT.md — Robotic Assist Child Mobile

## Repository purpose

This repository contains the mobile client for the Robotic Assist Child project.

The mobile app is a minimal client that uses a phone as:

- display;
- microphone;
- speaker;
- touch interface;
- animated robot face.

The backend server owns business logic, prompts, memory, authentication, model calls, safety rules and orchestration.

Do not put business logic in the mobile app.

---

## Current project state

The project has four repositories:

- `robotic-assist-child-prompts`
- `robotic-assist-child-server`
- `robotic-assist-child-mobile`
- `robotic-assist-child-rpi`

Work must be done on the `develop` branch unless explicitly instructed otherwise.

---

## Mandatory stack

Use the simplest viable mobile implementation.

Preferred stack:

```text
Expo React Native
TypeScript
```

All dependencies must use stable pinned versions.

Do not use dependency ranges.

Correct:

```json
{
  "dependencies": {
    "expo": "x.y.z",
    "react": "x.y.z",
    "react-native": "x.y.z"
  }
}
```

Incorrect:

```json
{
  "dependencies": {
    "expo": "^x.y.z",
    "react": "~x.y.z"
  }
}
```

Use one package manager consistently.

Prefer:

```text
npm + package-lock.json
```

Unless explicitly instructed otherwise.

---

## Client responsibility

The mobile app may:

- open in full screen;
- render robot eyes;
- render robot mouth;
- blink eyes randomly;
- show current robot state;
- show a lower panel for image/loading;
- call backend healthcheck;
- login or store a configured token;
- send text interaction to backend;
- connect to backend WebSocket;
- play audio in future phases;
- capture audio in future phases.

The mobile app must not:

- call OpenRouter directly;
- call ElevenLabs directly;
- access PostgreSQL;
- access MongoDB;
- access Redis;
- load prompt files;
- implement safety rules;
- implement memory logic;
- decide model behavior;
- store API provider keys.

---

## Backend access

The mobile app must call the API Gateway.

Default environment:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
EXPO_PUBLIC_WS_BASE_URL=ws://localhost:8080
```

Do not call the backend server directly unless explicitly configured for local development.

---

## Expected structure

```text
.
├── app.json
├── package.json
├── package-lock.json
├── README.md
├── .env.example
└── src/
    ├── app/
    ├── components/
    │   ├── RobotFace.tsx
    │   ├── RobotEyes.tsx
    │   ├── RobotMouth.tsx
    │   └── LowerPanel.tsx
    ├── services/
    │   ├── apiClient.ts
    │   └── websocketClient.ts
    └── types/
        └── robotEvents.ts
```

---

## Phase 1 features

Implement only:

- full screen app;
- simple animated robot face;
- eyes blinking randomly;
- simple mouth component;
- lower panel placeholder;
- backend healthcheck call;
- simple login/token configuration;
- send text to `/v1/interactions/text`;
- basic WebSocket connection to `/v1/ws/sessions/{session_id}`;
- display received state events.

Do not implement real audio capture unless explicitly requested.

Do not implement real audio playback unless explicitly requested.

Do not implement image generation UI beyond a placeholder unless explicitly requested.

---

## Robot visual behavior

Minimum states:

```text
idle
listening
thinking
speaking
happy
confused
error
```

Eyes:

- blink randomly;
- avoid fixed robotic rhythm;
- keep animation lightweight.

Mouth:

- closed when idle;
- simple movement placeholder when speaking;
- no complex audio analysis in Phase 1 unless requested.

Lower panel:

- reserved for future image generation;
- can show placeholder text or loading state.

---

## API contracts

Use snake_case payloads.

Text interaction request:

```json
{
  "session_id": "session_local",
  "client_type": "mobile",
  "input_text": "Olá, Cubinho!",
  "metadata": {
    "device_id": "mobile_local",
    "locale": "pt-BR"
  }
}
```

Text interaction response:

```json
{
  "interaction_id": "int_123",
  "session_id": "session_local",
  "status": "accepted",
  "assistant_text": "Olá! Que bom falar com você.",
  "expression": "happy",
  "intent": "chat",
  "created_at": "2026-06-07T20:00:00Z"
}
```

WebSocket event example:

```json
{
  "type": "state",
  "session_id": "session_local",
  "value": "thinking",
  "created_at": "2026-06-07T20:00:00Z"
}
```

---

## Authentication

Phase 1 may support:

- login form; or
- manually configured token; or
- simple development mode token.

Do not hardcode production credentials.

Do not store secrets in source code.

If storing tokens locally, use a safe mobile storage mechanism when available.

---

## Code quality

Use:

- TypeScript;
- explicit types;
- small components;
- isolated services;
- no business logic in UI components;
- environment-based configuration;
- simple error handling;
- readable state management.

Avoid heavy state management libraries unless necessary.

Do not add Redux, MobX, Zustand or similar unless explicitly requested.

---

## Tests and validation

Add basic validation/tests when feasible for:

- component rendering;
- API base URL configuration;
- API client;
- WebSocket client.

At minimum, provide manual test instructions in README.

---

## Change policy

Do not commit automatically.

Before finishing, report:

- files created;
- files modified;
- commands run;
- tests run;
- known limitations.

---

## Expected commands

Install:

```bash
npm install
```

Run:

```bash
npx expo start
```

Validate API health from app against:

```text
GET http://localhost:8080/v1/health/live
```

---

## Final reminder

The mobile app is only the face and device interface.

The backend is the brain.

Keep the mobile app simple, replaceable and low-risk.
