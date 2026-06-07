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
import type { RobotExpression } from "../types/robotEvents";

const SESSION_ID = "session_mobile_local";
const DEVICE_ID = "mobile_local";
const DEFAULT_API_PING_INTERVAL_SECONDS = 5;
const HEALTH_LABEL_VISIBLE_MS = 5000;
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
  const [lowerPanelContent, setLowerPanelContent] = useState<LowerPanelContent>({
    mode: "text",
    text: "Oi! Eu sou o Cubinho. Pode falar comigo.",
  });
  const [inputText, setInputText] = useState("");
  const [healthStatus, setHealthStatus] = useState<HealthStatus>("checking");
  const [showHealthLabel, setShowHealthLabel] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const healthLabelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  useEffect(() => {
    return () => {
      if (healthLabelTimeoutRef.current) {
        clearTimeout(healthLabelTimeoutRef.current);
      }
    };
  }, []);

  const handleRefreshHealthPress = useCallback(async () => {
    setShowHealthLabel(false);
    await refreshHealth();
    showTemporaryHealthLabel();
  }, [refreshHealth, showTemporaryHealthLabel]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending) {
      return;
    }

    setIsSending(true);
    setExpression("thinking");
    setLowerPanelContent(
      shouldShowImageLoadingPlaceholder(text) ? { mode: "loading_image" } : { mode: "empty" }
    );
    setInputText("");

    try {
      const response = await sendTextInteraction({
        text,
        session_id: SESSION_ID,
        client_type: "mobile",
        metadata: {
          device_id: DEVICE_ID,
          locale: "pt-BR",
        },
      });
      if (response.image?.image_url) {
        setLowerPanelContent({ mode: "image", imageUrl: response.image.image_url });
      } else if (response.assistant_text.trim()) {
        setLowerPanelContent({ mode: "text", text: response.assistant_text });
      } else {
        setLowerPanelContent({ mode: "empty" });
      }
      setExpression(response.expression);
      setHealthStatus("online");
    } catch {
      setLowerPanelContent({
        mode: "error",
        message: "Não consegui falar com o servidor agora.",
      });
      setExpression("error");
      setHealthStatus("offline");
    } finally {
      setIsSending(false);
    }
  }, [inputText, isSending]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar hidden />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
        >
          <View style={styles.faceArea}>
            <RobotFace expression={expression} />
          </View>
          <LowerPanel
            content={lowerPanelContent}
            expression={expression}
            healthLabel={healthLabel}
            healthStatus={healthStatus}
            inputText={inputText}
            isSending={isSending}
            onChangeInput={setInputText}
            onImageError={() => {
              setLowerPanelContent({
                mode: "error",
                message: "Não consegui carregar a imagem recebida.",
              });
              setExpression("error");
            }}
            onRefreshHealth={handleRefreshHealthPress}
            onSend={handleSend}
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
