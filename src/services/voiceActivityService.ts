export type VoiceActivityEvent =
  | { type: "speech_start" }
  | { type: "silence" }
  | { type: "max_duration" }
  | { type: "metering_unavailable" };

type VoiceActivityConfig = {
  getDurationMs: () => number;
  getMetering: () => number | undefined;
  max_recording_ms: number;
  min_recording_ms: number;
  onEvent: (event: VoiceActivityEvent) => void;
  silence_timeout_ms: number;
};

const METERING_POLL_MS = 100;
const METERING_UNAVAILABLE_MS = 900;
const SPEECH_THRESHOLD_DB = -46;
const SILENCE_THRESHOLD_DB = -54;

let intervalId: ReturnType<typeof setInterval> | null = null;
let silenceStartedAtMs: number | null = null;
let speechDetected = false;
let fallbackReported = false;
let startedAtMs = 0;

function stop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export const voiceActivityService = {
  start(config: VoiceActivityConfig): void {
    stop();
    silenceStartedAtMs = null;
    speechDetected = false;
    fallbackReported = false;
    startedAtMs = Date.now();

    intervalId = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - startedAtMs;
      const durationMs = config.getDurationMs();
      const metering = config.getMetering();

      if (
        metering === undefined &&
        !fallbackReported &&
        elapsedMs >= METERING_UNAVAILABLE_MS
      ) {
        fallbackReported = true;
        config.onEvent({ type: "metering_unavailable" });
      }

      if (durationMs >= config.max_recording_ms) {
        stop();
        config.onEvent({ type: "max_duration" });
        return;
      }

      if (metering === undefined) {
        return;
      }

      if (metering >= SPEECH_THRESHOLD_DB) {
        silenceStartedAtMs = null;
        if (!speechDetected) {
          speechDetected = true;
          config.onEvent({ type: "speech_start" });
        }
        return;
      }

      if (!speechDetected || durationMs < config.min_recording_ms) {
        return;
      }

      if (metering <= SILENCE_THRESHOLD_DB) {
        silenceStartedAtMs = silenceStartedAtMs ?? now;
        if (now - silenceStartedAtMs >= config.silence_timeout_ms) {
          stop();
          config.onEvent({ type: "silence" });
        }
      } else {
        silenceStartedAtMs = null;
      }
    }, METERING_POLL_MS);
  },

  stop,
};
