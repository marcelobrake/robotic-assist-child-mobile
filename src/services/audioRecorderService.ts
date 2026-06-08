import {
  AudioModule,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  type AudioRecorder,
  type RecorderState,
  type RecordingOptions,
} from "expo-audio";
import { createRecordingOptions } from "expo-audio/build/utils/options";
import { Platform } from "react-native";

const RECORDING_OPTIONS: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
  numberOfChannels: 1,
};
const RECORDED_AUDIO_CONTENT_TYPE = Platform.OS === "web" ? "audio/webm" : "audio/m4a";
const RECORDED_AUDIO_EXTENSION = Platform.OS === "web" ? "webm" : "m4a";

export type AudioRecordingResult = {
  content_type: string;
  duration_ms: number;
  file_extension: string;
  uri: string;
};

let currentRecorder: AudioRecorder | null = null;

async function configureForRecording() {
  await setAudioModeAsync({
    allowsRecording: true,
    playsInSilentMode: true,
    shouldPlayInBackground: false,
  });
}

async function configureAfterRecording() {
  await setAudioModeAsync({
    allowsRecording: false,
    playsInSilentMode: true,
    shouldPlayInBackground: false,
  });
}

export const audioRecorderService = {
  async requestMicrophonePermission(): Promise<boolean> {
    const permission = await requestRecordingPermissionsAsync();
    return permission.granted;
  },

  async startRecording(): Promise<void> {
    await this.release();
    const hasPermission = await this.requestMicrophonePermission();
    if (!hasPermission) {
      throw new Error("Microphone permission denied");
    }

    await configureForRecording();

    const platformOptions = createRecordingOptions(RECORDING_OPTIONS);
    const recorder = new AudioModule.AudioRecorder(platformOptions);
    await recorder.prepareToRecordAsync(RECORDING_OPTIONS);
    recorder.record();
    currentRecorder = recorder;
  },

  getStatus(): RecorderState | null {
    if (!currentRecorder) {
      return null;
    }

    return currentRecorder.getStatus();
  },

  async stopRecording(): Promise<AudioRecordingResult | null> {
    if (!currentRecorder) {
      return null;
    }

    const recorder = currentRecorder;
    const statusBeforeStop = recorder.getStatus();

    try {
      await recorder.stop();
      const uri = recorder.uri ?? recorder.getStatus().url;
      if (!uri) {
        return null;
      }

      return {
        content_type: RECORDED_AUDIO_CONTENT_TYPE,
        duration_ms: statusBeforeStop.durationMillis,
        file_extension: RECORDED_AUDIO_EXTENSION,
        uri,
      };
    } finally {
      currentRecorder = null;
      await configureAfterRecording();
    }
  },

  async release(): Promise<void> {
    if (!currentRecorder) {
      return;
    }

    try {
      if (currentRecorder.isRecording) {
        await currentRecorder.stop();
      }
    } finally {
      currentRecorder = null;
      await configureAfterRecording();
    }
  },
};
