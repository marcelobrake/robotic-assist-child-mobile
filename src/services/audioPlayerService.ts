import { createAudioPlayer, setAudioModeAsync } from "expo-audio";

const PLAYBACK_RATE = 1.1;

export type AudioPlaybackState = "playing" | "stopped" | "error";

type AudioPlaybackStateListener = (state: AudioPlaybackState) => void;
type AudioPlayer = ReturnType<typeof createAudioPlayer>;
type AudioSubscription = {
  remove: () => void;
};

let currentPlayer: AudioPlayer | null = null;
let currentSubscription: AudioSubscription | null = null;
let currentState: AudioPlaybackState = "stopped";
let audioModeConfigured = false;

const listeners = new Set<AudioPlaybackStateListener>();

function setPlaybackState(nextState: AudioPlaybackState) {
  if (currentState === nextState) {
    return;
  }

  currentState = nextState;
  listeners.forEach((listener) => listener(currentState));
}

async function ensureAudioMode() {
  if (audioModeConfigured) {
    return;
  }

  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
  });
  audioModeConfigured = true;
}

function releaseCurrentPlayer() {
  if (currentSubscription) {
    currentSubscription.remove();
    currentSubscription = null;
  }

  if (currentPlayer) {
    currentPlayer.pause();
    currentPlayer.remove();
    currentPlayer = null;
  }
}

export const audioPlayerService = {
  getState(): AudioPlaybackState {
    return currentState;
  },

  subscribe(listener: AudioPlaybackStateListener): () => void {
    listeners.add(listener);
    listener(currentState);

    return () => {
      listeners.delete(listener);
    };
  },

  async playRemoteUrl(audioUrl: string): Promise<void> {
    releaseCurrentPlayer();
    setPlaybackState("stopped");

    if (!audioUrl) {
      setPlaybackState("error");
      throw new Error("Audio URL is required");
    }

    try {
      await ensureAudioMode();

      const player = createAudioPlayer(audioUrl, {
        updateInterval: 120,
      });

      currentPlayer = player;
      player.shouldCorrectPitch = true;
      player.setPlaybackRate(PLAYBACK_RATE, "high");
      currentSubscription = player.addListener("playbackStatusUpdate", (status) => {
        if (status.error) {
          console.warn("Audio playback failed:", status.error);
          releaseCurrentPlayer();
          setPlaybackState("error");
          return;
        }

        if (status.didJustFinish) {
          releaseCurrentPlayer();
          setPlaybackState("stopped");
          return;
        }

        if (status.playing) {
          setPlaybackState("playing");
        }
      });

      player.play();
      setPlaybackState("playing");
    } catch (error) {
      releaseCurrentPlayer();
      console.warn("Audio playback failed:", error);
      setPlaybackState("error");
      throw error;
    }
  },

  stop(): void {
    releaseCurrentPlayer();
    setPlaybackState("stopped");
  },
};
