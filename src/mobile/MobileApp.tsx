import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { LowerPanel, type LowerPanelContent } from "../components/LowerPanel";
import { RobotFace } from "../components/RobotFace";
import { checkHealth, sendTextInteraction } from "../services/apiClient";
import { audioPlayerService } from "../services/audioPlayerService";
import { audioRecorderService } from "../services/audioRecorderService";
import { sendAudioInteraction } from "../services/interactionAudioService";
import { voiceActivityService, type VoiceActivityEvent } from "../services/voiceActivityService";
import type { RobotExpression, TextInteractionResponse } from "../types/robotEvents";

const SESSION_ID = "session_mobile_local";
const DEVICE_ID = "mobile_local";
const DEFAULT_API_PING_INTERVAL_SECONDS = 5;
const HEALTH_LABEL_VISIBLE_MS = 5000;
const SILENCE_TIMEOUT_MS = 1000;
const MAX_RECORDING_MS = 15000;
const MIN_RECORDING_MS = 500;
const LISTEN_RESUME_DELAY_MS = 700;
const IMAGE_REQUEST_KEYWORDS = [
  "desenhe",
  "desenha",
  "desenhar",
  "foto",
  "imagem",
  "ilustracao",
  "ilustre",
  "pinte",
];

type HealthStatus = "checking" | "online" | "offline";
type MobileInteractionState =
  | "idle"
  | "listening_manual"
  | "listener_on_idle"
  | "listener_on_hearing"
  | "thinking"
  | "speaking"
  | "error";

function getApiPingIntervalMs(): number {
  const configuredInterval = Number(process.env.EXPO_PUBLIC_API_PING_INTERVAL_SECONDS);
  const intervalSeconds =
    Number.isFinite(configuredInterval) && configuredInterval > 0
      ? configuredInterval
      : DEFAULT_API_PING_INTERVAL_SECONDS;

  return intervalSeconds * 1000;
}

function shouldShowImageLoadingPlaceholder(text: string): boolean {
  const normalizedText = text
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return IMAGE_REQUEST_KEYWORDS.some((keyword) => normalizedText.includes(keyword));
}

export function MobileApp() {
  const [expression, setExpression] = useState<RobotExpression>("idle");
  const [interactionState, setInteractionState] = useState<MobileInteractionState>("idle");
  const [lowerPanelContent, setLowerPanelContent] = useState<LowerPanelContent>({
    mode: "text",
    text: "Oi! Eu sou o Cubinho. Pode falar comigo.",
  });
  const [inputText, setInputText] = useState("");
  const [healthStatus, setHealthStatus] = useState<HealthStatus>("checking");
  const [showHealthLabel, setShowHealthLabel] = useState(false);
  const [isAudioSpeaking, setIsAudioSpeaking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVoiceBusy, setIsVoiceBusy] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isListenerModeEnabled, setIsListenerModeEnabled] = useState(false);

  const activeRecordingListenerModeRef = useRef(false);
  const audioBaseExpressionRef = useRef<RobotExpression>("idle");
  const finishingRecordingRef = useRef(false);
  const healthLabelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAudioSpeakingRef = useRef(false);
  const isListenerModeEnabledRef = useRef(false);
  const isVoiceBusyRef = useRef(false);
  const isVoiceRecordingRef = useRef(false);
  const listenerResumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingListenerResumeAfterPlaybackRef = useRef(false);
  const shouldRestoreAudioExpressionRef = useRef(false);
  const speechDetectedRef = useRef(false);
  const apiPingIntervalMs = useMemo(() => getApiPingIntervalMs(), []);

  const healthLabel = useMemo(() => {
    if (healthStatus === "online") {
      return "API online";
    }
    if (healthStatus === "offline") {
      return "API offline";
    }
    return "Verificando API";
  }, [healthStatus]);

  const setVoiceBusyState = useCallback((value: boolean) => {
    isVoiceBusyRef.current = value;
    setIsVoiceBusy(value);
  }, []);

  const setVoiceRecordingState = useCallback((value: boolean) => {
    isVoiceRecordingRef.current = value;
    setIsVoiceRecording(value);
  }, []);

  const setListenerModeState = useCallback((value: boolean) => {
    isListenerModeEnabledRef.current = value;
    setIsListenerModeEnabled(value);
  }, []);

  const clearListenerResumeTimer = useCallback(() => {
    if (listenerResumeTimeoutRef.current) {
      clearTimeout(listenerResumeTimeoutRef.current);
      listenerResumeTimeoutRef.current = null;
    }
  }, []);

  const refreshHealth = useCallback(async (): Promise<boolean> => {
    setHealthStatus("checking");
    const isHealthy = await checkHealth();
    setHealthStatus(isHealthy ? "online" : "offline");
    return isHealthy;
  }, []);

  useEffect(() => {
    void refreshHealth();

    const intervalId = setInterval(() => {
      void refreshHealth();
    }, apiPingIntervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [apiPingIntervalMs, refreshHealth]);

  const showTemporaryHealthLabel = useCallback(() => {
    if (healthLabelTimeoutRef.current) {
      clearTimeout(healthLabelTimeoutRef.current);
    }

    setShowHealthLabel(true);
    healthLabelTimeoutRef.current = setTimeout(() => {
      setShowHealthLabel(false);
      healthLabelTimeoutRef.current = null;
    }, HEALTH_LABEL_VISIBLE_MS);
  }, []);

  const scheduleListenerResumeRef = useRef<() => void>(() => undefined);
  const startVoiceRecordingRef = useRef<(listenerMode: boolean) => Promise<void>>(async () => {
    return;
  });
  const finishVoiceRecordingRef = useRef<
    (reason: "manual" | "silence" | "max_duration", shouldSend?: boolean) => Promise<void>
  >(async () => {
    return;
  });

  const displayInteractionResponse = useCallback(
    (response: TextInteractionResponse, resumeListenerAfterResponse: boolean) => {
      if (response.image?.image_url) {
        setLowerPanelContent({ mode: "image", imageUrl: response.image.image_url });
      } else if (response.assistant_text.trim()) {
        setLowerPanelContent({ mode: "text", text: response.assistant_text });
      } else {
        setLowerPanelContent({ mode: "empty" });
      }

      audioBaseExpressionRef.current = response.expression;
      shouldRestoreAudioExpressionRef.current = false;
      setExpression(response.expression);
      setInteractionState("idle");
      setHealthStatus("online");

      if (response.audio?.audio_url) {
        pendingListenerResumeAfterPlaybackRef.current = resumeListenerAfterResponse;
        shouldRestoreAudioExpressionRef.current = true;
        void audioPlayerService.playRemoteUrl(response.audio.audio_url).catch(() => {
          setIsAudioSpeaking(false);
          isAudioSpeakingRef.current = false;
          if (resumeListenerAfterResponse) {
            scheduleListenerResumeRef.current();
          }
        });
        return;
      }

      if (resumeListenerAfterResponse) {
        scheduleListenerResumeRef.current();
      }
    },
    []
  );

  const discardOrResumeListener = useCallback(() => {
    setVoiceBusyState(false);
    setVoiceRecordingState(false);

    if (isListenerModeEnabledRef.current) {
      scheduleListenerResumeRef.current();
    } else {
      setInteractionState("idle");
      setExpression("idle");
    }
  }, [setVoiceBusyState, setVoiceRecordingState]);

  const handleVoiceActivityEvent = useCallback(
    (event: VoiceActivityEvent) => {
      if (event.type === "speech_start") {
        speechDetectedRef.current = true;
        if (activeRecordingListenerModeRef.current) {
          setInteractionState("listener_on_hearing");
        }
        return;
      }

      if (event.type === "silence") {
        void finishVoiceRecordingRef.current("silence", true);
        return;
      }

      if (event.type === "max_duration") {
        const shouldSend =
          !activeRecordingListenerModeRef.current || speechDetectedRef.current;
        void finishVoiceRecordingRef.current("max_duration", shouldSend);
        return;
      }

      if (event.type === "metering_unavailable") {
        console.warn("Voice metering is unavailable; manual stop fallback is active.");
        if (activeRecordingListenerModeRef.current) {
          void finishVoiceRecordingRef.current("manual", false);
          setListenerModeState(false);
          setLowerPanelContent({
            mode: "text",
            text: "Modo ouvinte automático indisponível neste dispositivo. Use Falar.",
          });
        }
      }
    },
    [setListenerModeState]
  );

  const startVoiceRecording = useCallback(
    async (listenerMode: boolean) => {
      if (isVoiceBusyRef.current || isAudioSpeakingRef.current) {
        return;
      }

      clearListenerResumeTimer();
      audioPlayerService.stop();
      activeRecordingListenerModeRef.current = listenerMode;
      speechDetectedRef.current = false;
      setVoiceBusyState(true);
      setVoiceRecordingState(true);
      setExpression("listening");
      setInteractionState(listenerMode ? "listener_on_idle" : "listening_manual");

      try {
        await audioRecorderService.startRecording();
        voiceActivityService.start({
          getDurationMs: () => audioRecorderService.getStatus()?.durationMillis ?? 0,
          getMetering: () => audioRecorderService.getStatus()?.metering,
          max_recording_ms: MAX_RECORDING_MS,
          min_recording_ms: MIN_RECORDING_MS,
          onEvent: handleVoiceActivityEvent,
          silence_timeout_ms: SILENCE_TIMEOUT_MS,
        });
      } catch (error) {
        console.warn("Voice recording failed:", error);
        voiceActivityService.stop();
        await audioRecorderService.release();
        setVoiceBusyState(false);
        setVoiceRecordingState(false);
        setExpression("error");
        setInteractionState("error");
        setLowerPanelContent({
          mode: "error",
          message: "Não consegui acessar o microfone.",
        });
      }
    },
    [
      clearListenerResumeTimer,
      handleVoiceActivityEvent,
      setVoiceBusyState,
      setVoiceRecordingState,
    ]
  );

  const scheduleListenerResume = useCallback(() => {
    clearListenerResumeTimer();

    if (!isListenerModeEnabledRef.current || isAudioSpeakingRef.current) {
      return;
    }

    listenerResumeTimeoutRef.current = setTimeout(() => {
      listenerResumeTimeoutRef.current = null;
      if (
        isListenerModeEnabledRef.current &&
        !isAudioSpeakingRef.current &&
        !isVoiceBusyRef.current
      ) {
        void startVoiceRecordingRef.current(true);
      }
    }, LISTEN_RESUME_DELAY_MS);
  }, [clearListenerResumeTimer]);

  const finishVoiceRecording = useCallback(
    async (
      reason: "manual" | "silence" | "max_duration",
      shouldSend = true
    ): Promise<void> => {
      if (finishingRecordingRef.current) {
        return;
      }

      finishingRecordingRef.current = true;
      voiceActivityService.stop();
      setVoiceRecordingState(false);

      const listenerMode = activeRecordingListenerModeRef.current;

      try {
        const result = await audioRecorderService.stopRecording();
        if (
          !shouldSend ||
          !result?.uri ||
          (result.duration_ms < MIN_RECORDING_MS && reason !== "manual")
        ) {
          discardOrResumeListener();
          return;
        }

        setInteractionState("thinking");
        setExpression("thinking");

        const response = await sendAudioInteraction({
          audio_content_type: result.content_type,
          audio_file_extension: result.file_extension,
          audio_uri: result.uri,
          client_type: "mobile",
          generate_audio: true,
          listener_mode: listenerMode,
          metadata: {
            device_id: DEVICE_ID,
            locale: "pt-BR",
          },
          session_id: SESSION_ID,
        });

        if (response.status === "ignored") {
          console.info("Listener mode audio ignored by backend.");
          setLowerPanelContent({ mode: "empty" });
          discardOrResumeListener();
          return;
        }

        setVoiceBusyState(false);
        displayInteractionResponse(response, listenerMode && isListenerModeEnabledRef.current);
      } catch (error) {
        console.warn("Audio interaction failed:", error);
        setVoiceBusyState(false);
        setVoiceRecordingState(false);
        if (listenerMode) {
          setListenerModeState(false);
        }
        setExpression("error");
        setInteractionState("idle");
        setLowerPanelContent({
          mode: "error",
          message: "Não consegui enviar o áudio agora.",
        });
      } finally {
        finishingRecordingRef.current = false;
      }
    },
    [
      discardOrResumeListener,
      displayInteractionResponse,
      setListenerModeState,
      setVoiceBusyState,
      setVoiceRecordingState,
    ]
  );

  useEffect(() => {
    scheduleListenerResumeRef.current = scheduleListenerResume;
    startVoiceRecordingRef.current = startVoiceRecording;
    finishVoiceRecordingRef.current = finishVoiceRecording;
  }, [finishVoiceRecording, scheduleListenerResume, startVoiceRecording]);

  useEffect(() => {
    return () => {
      clearListenerResumeTimer();
      voiceActivityService.stop();
      void audioRecorderService.release();

      if (healthLabelTimeoutRef.current) {
        clearTimeout(healthLabelTimeoutRef.current);
      }
    };
  }, [clearListenerResumeTimer]);

  useEffect(() => {
    const unsubscribe = audioPlayerService.subscribe((audioState) => {
      if (audioState === "playing") {
        isAudioSpeakingRef.current = true;
        setIsAudioSpeaking(true);
        setExpression("speaking");
        setInteractionState("speaking");
        return;
      }

      isAudioSpeakingRef.current = false;
      setIsAudioSpeaking(false);
      if (shouldRestoreAudioExpressionRef.current) {
        setExpression(audioBaseExpressionRef.current);
        shouldRestoreAudioExpressionRef.current = false;
      }

      if (pendingListenerResumeAfterPlaybackRef.current) {
        pendingListenerResumeAfterPlaybackRef.current = false;
        scheduleListenerResumeRef.current();
      } else if (!isVoiceBusyRef.current) {
        setInteractionState("idle");
      }
    });

    return () => {
      unsubscribe();
      audioPlayerService.stop();
    };
  }, []);

  const handleRefreshHealthPress = useCallback(async () => {
    setShowHealthLabel(false);
    await refreshHealth();
    showTemporaryHealthLabel();
  }, [refreshHealth, showTemporaryHealthLabel]);

  const stopListenerCapture = useCallback(async () => {
    clearListenerResumeTimer();
    voiceActivityService.stop();
    await audioRecorderService.release();
    setVoiceBusyState(false);
    setVoiceRecordingState(false);
    setInteractionState("idle");
    setExpression("idle");
  }, [clearListenerResumeTimer, setVoiceBusyState, setVoiceRecordingState]);

  const handleToggleListenerMode = useCallback(
    (value: boolean) => {
      setListenerModeState(value);

      if (value) {
        if (!isVoiceBusyRef.current && !isAudioSpeakingRef.current) {
          void startVoiceRecordingRef.current(true);
        }
        return;
      }

      void stopListenerCapture();
    },
    [setListenerModeState, stopListenerCapture]
  );

  const handleVoicePress = useCallback(() => {
    if (isVoiceRecordingRef.current) {
      void finishVoiceRecordingRef.current("manual", true);
      return;
    }

    void startVoiceRecording(false);
  }, [startVoiceRecording]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending || isVoiceBusyRef.current) {
      return;
    }

    clearListenerResumeTimer();
    if (isVoiceRecordingRef.current) {
      await stopListenerCapture();
    }

    setIsSending(true);
    shouldRestoreAudioExpressionRef.current = false;
    pendingListenerResumeAfterPlaybackRef.current = false;
    audioPlayerService.stop();
    isAudioSpeakingRef.current = false;
    setIsAudioSpeaking(false);
    setExpression("thinking");
    setInteractionState("thinking");
    setLowerPanelContent(
      shouldShowImageLoadingPlaceholder(text) ? { mode: "loading_image" } : { mode: "empty" }
    );
    setInputText("");

    try {
      const response = await sendTextInteraction({
        text,
        session_id: SESSION_ID,
        client_type: "mobile",
        generate_audio: true,
        metadata: {
          device_id: DEVICE_ID,
          locale: "pt-BR",
        },
      });
      displayInteractionResponse(response, isListenerModeEnabledRef.current);
    } catch {
      setLowerPanelContent({
        mode: "error",
        message: "Não consegui falar com o servidor agora.",
      });
      setExpression("error");
      setInteractionState("error");
      setHealthStatus("offline");
    } finally {
      setIsSending(false);
    }
  }, [
    clearListenerResumeTimer,
    displayInteractionResponse,
    inputText,
    isSending,
    stopListenerCapture,
  ]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar hidden />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
        >
          <View style={styles.faceArea}>
            <RobotFace expression={expression} is_speaking={isAudioSpeaking} />
          </View>
          <LowerPanel
            content={lowerPanelContent}
            healthLabel={healthLabel}
            healthStatus={healthStatus}
            inputText={inputText}
            interactionState={interactionState}
            isListenerModeEnabled={isListenerModeEnabled}
            isSending={isSending}
            isVoiceBusy={isVoiceBusy || isAudioSpeaking}
            isVoiceRecording={isVoiceRecording}
            onChangeInput={setInputText}
            onImageError={() => {
              setLowerPanelContent({
                mode: "error",
                message: "Não consegui carregar a imagem recebida.",
              });
              setExpression("error");
              setInteractionState("error");
            }}
            onRefreshHealth={handleRefreshHealthPress}
            onSend={handleSend}
            onToggleListenerMode={handleToggleListenerMode}
            onVoicePress={handleVoicePress}
            showHealthLabel={showHealthLabel}
            onInputFocus={() => setExpression("listening")}
            onInputBlur={() => {
              if (!isSending && expression === "listening") {
                setExpression("idle");
              }
            }}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#06151f",
  },
  keyboardView: {
    flex: 1,
  },
  faceArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
});
