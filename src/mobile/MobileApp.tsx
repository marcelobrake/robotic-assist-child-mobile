import { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { LowerPanel } from "../components/LowerPanel";
import { RobotFace } from "../components/RobotFace";
import { checkHealth, sendTextInteraction } from "../services/apiClient";
import type { RobotExpression } from "../types/robotEvents";

const SESSION_ID = "session_mobile_local";
const DEVICE_ID = "mobile_local";

export function MobileApp() {
  const [expression, setExpression] = useState<RobotExpression>("idle");
  const [assistantText, setAssistantText] = useState(
    "Oi! Eu sou o Cubinho. Pode falar comigo."
  );
  const [inputText, setInputText] = useState("");
  const [healthStatus, setHealthStatus] = useState<"checking" | "online" | "offline">(
    "checking"
  );
  const [isSending, setIsSending] = useState(false);

  const healthLabel = useMemo(() => {
    if (healthStatus === "online") {
      return "API online";
    }
    if (healthStatus === "offline") {
      return "API offline";
    }
    return "Verificando API";
  }, [healthStatus]);

  const refreshHealth = useCallback(async () => {
    setHealthStatus("checking");
    const isHealthy = await checkHealth();
    setHealthStatus(isHealthy ? "online" : "offline");
  }, []);

  useEffect(() => {
    void refreshHealth();
  }, [refreshHealth]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending) {
      return;
    }

    setIsSending(true);
    setExpression("thinking");
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
      setAssistantText(response.assistant_text);
      setExpression(response.expression);
      setHealthStatus("online");
    } catch {
      setAssistantText("Não consegui falar com o servidor agora.");
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
            assistantText={assistantText}
            expression={expression}
            healthLabel={healthLabel}
            healthStatus={healthStatus}
            inputText={inputText}
            isSending={isSending}
            onChangeInput={setInputText}
            onRefreshHealth={refreshHealth}
            onSend={handleSend}
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
