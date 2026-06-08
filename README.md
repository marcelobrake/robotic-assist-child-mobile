# robotic-assist-child-mobile

Mobile MVP for Robotic Assist Child.

This app is a thin Expo React Native client. It renders the robot face, checks the backend API Gateway health endpoint, sends text or recorded-audio interactions to the server, displays the assistant response, plays backend-provided audio when available, and shows a backend-provided image URL when available.

The backend owns prompts, safety, memory, model providers, authentication, and orchestration. The mobile app does not call OpenRouter, ElevenLabs, databases, or prompt files directly.

## Environment

Default local values:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
EXPO_PUBLIC_API_PING_INTERVAL_SECONDS=5
EXPO_PUBLIC_WS_BASE_URL=ws://localhost:8080
```

Copy `.env.example` to `.env` only when you need to override these defaults.
`EXPO_PUBLIC_API_PING_INTERVAL_SECONDS` controls the automatic health ping interval. When it is missing or invalid, the app uses 5 seconds.

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
curl http://localhost:8080/v1/health/ready
npm run typecheck
```

Manual E2E voice flow:

1. Open the app with Expo.
2. Confirm the health indicator shows API online.
3. Type a short message.
4. Tap Enviar.
5. Confirm the assistant response appears, the returned audio plays, and the mouth animates while playback is active.
6. Confirm the mouth stops animating when playback finishes.
7. Tap `Falar`, allow microphone permission, speak, then pause for about 1 second.
8. Confirm the app sends `POST /v1/interactions/audio` with `generate_audio=true` and `listener_mode=false`.
9. Confirm the audio response plays and the mouth animates while playback is active.
10. Enable `Modo ouvinte`.
11. Confirm the app records/listens, sends speech turns with `listener_mode=true`, ignores `status=ignored`, pauses capture while Cubinho speaks, and resumes listening after playback.
12. Type an image request, such as `desenhe um foguete colorido`.
13. Confirm the lower panel shows `Montando a imagem...` while waiting.
14. Confirm that, when `/v1/interactions/text` returns `image.image_url`, the lower panel displays that image.
15. Confirm that, when `image` is `null` and `assistant_text` is present, the lower panel displays the text response.
16. Stop and restart the API Gateway, confirming the status dot changes color after the next ping interval.
17. Tap the status dot and confirm the text status appears after the connection attempt, then disappears after 5 seconds.

Recommended server setup for a local E2E smoke test:

```bash
cd ../robotic-assist-child-server
TTS_ENABLED=true TTS_PROVIDER=fake STT_ENABLED=false docker compose up --build
```

For real microphone transcription, enable a backend STT provider in the server
environment. The mobile app still sends audio only to the API Gateway.

## Current limitations

- No local STT, wake word, streaming continuous audio, or WebRTC in the mobile app.
- Speech transcription happens only in the backend through `/v1/interactions/audio`.
- Voice activity detection uses `expo-audio` recording metering when the platform exposes it. If metering is unavailable, the app falls back to manual `Falar`/`Parar` recording and disables automatic listener capture.
- No viseme or real amplitude analysis for mouth movement.
- No direct ElevenLabs integration.
- No direct OpenRouter integration.
- No direct OpenAI integration.
- Audio is played from the backend-provided URL only and is not stored permanently by the app.
- Recorded audio is uploaded to the API Gateway and is not stored permanently by the app.
- No local image generation.
- No image gallery, upload, editing, or advanced cache.
- No authentication UI.
- No memory or database access.
- WebSocket URL is configured for future phases, but no live WebSocket flow is implemented in this MVP.
