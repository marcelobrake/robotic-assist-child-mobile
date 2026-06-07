# robotic-assist-child-mobile

Mobile MVP for Robotic Assist Child.

This app is a thin Expo React Native client. It renders the robot face, checks the backend API Gateway health endpoint, sends text interactions to the server, and displays the assistant response.

The backend owns prompts, safety, memory, model providers, authentication, and orchestration. The mobile app does not call OpenRouter, ElevenLabs, databases, or prompt files directly.

## Environment

Default local values:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
EXPO_PUBLIC_WS_BASE_URL=ws://localhost:8080
```

Copy `.env.example` to `.env` only when you need to override these defaults.

## Install

```bash
npm install
```

## Run

```bash
npx expo start
```

If running on a physical phone, `localhost` points to the phone itself. Set `EXPO_PUBLIC_API_BASE_URL` to the notebook LAN IP, for example:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.0.10:8080
EXPO_PUBLIC_WS_BASE_URL=ws://192.168.0.10:8080
```

## Validate

With the server stack running:

```bash
curl http://localhost:8080/v1/health/live
npm run typecheck
```

Manual flow:

1. Open the app with Expo.
2. Confirm the health indicator shows API online.
3. Type a short message.
4. Tap Enviar.
5. Confirm the assistant response appears and the robot expression changes.

## Current limitations

- No audio capture or playback.
- No ElevenLabs integration.
- No OpenRouter integration.
- No authentication UI.
- No memory or database access.
- WebSocket URL is configured for future phases, but no live WebSocket flow is implemented in this MVP.
