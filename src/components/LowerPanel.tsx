import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { RobotExpression } from "../types/robotEvents";

type LowerPanelProps = {
  assistantText: string;
  expression: RobotExpression;
  healthLabel: string;
  healthStatus: "checking" | "online" | "offline";
  inputText: string;
  isSending: boolean;
  onChangeInput: (value: string) => void;
  onInputBlur: () => void;
  onInputFocus: () => void;
  onRefreshHealth: () => void;
  onSend: () => void;
};

export function LowerPanel({
  assistantText,
  expression,
  healthLabel,
  healthStatus,
  inputText,
  isSending,
  onChangeInput,
  onInputBlur,
  onInputFocus,
  onRefreshHealth,
  onSend,
}: LowerPanelProps) {
  const canSend = inputText.trim().length > 0 && !isSending;

  return (
    <View style={styles.panel}>
      <View style={styles.statusRow}>
        <Pressable
          accessibilityRole="button"
          onPress={onRefreshHealth}
          style={styles.statusButton}
        >
          <View style={[styles.statusDot, statusDotStyle[healthStatus]]} />
          <Text style={styles.statusText}>{healthLabel}</Text>
        </Pressable>
        <Text style={styles.expressionText}>{expression}</Text>
      </View>

      <View style={styles.messageBox}>
        <Text style={styles.assistantText}>{assistantText}</Text>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          accessibilityLabel="Mensagem para o Cubinho"
          autoCapitalize="sentences"
          editable={!isSending}
          onBlur={onInputBlur}
          onChangeText={onChangeInput}
          onFocus={onInputFocus}
          onSubmitEditing={onSend}
          placeholder="Fale com o Cubinho"
          placeholderTextColor="#7d96a6"
          returnKeyType="send"
          style={styles.input}
          value={inputText}
        />
        <Pressable
          accessibilityRole="button"
          disabled={!canSend}
          onPress={onSend}
          style={({ pressed }) => [
            styles.sendButton,
            !canSend ? styles.sendButtonDisabled : null,
            pressed && canSend ? styles.sendButtonPressed : null,
          ]}
        >
          <Text style={styles.sendButtonText}>{isSending ? "..." : "Enviar"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const statusDotStyle = {
  checking: { backgroundColor: "#f3d779" },
  online: { backgroundColor: "#73e6a2" },
  offline: { backgroundColor: "#ff7d7d" },
};

const styles = StyleSheet.create({
  panel: {
    minHeight: 252,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: "#0d2230",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    gap: 14,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  statusButton: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    color: "#d9f6ff",
    fontSize: 14,
    fontWeight: "600",
  },
  expressionText: {
    color: "#9db5c4",
    fontSize: 13,
  },
  messageBox: {
    minHeight: 78,
    borderRadius: 8,
    backgroundColor: "#06151f",
    justifyContent: "center",
    padding: 14,
  },
  assistantText: {
    color: "#f5fbff",
    fontSize: 18,
    lineHeight: 25,
  },
  inputRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
  },
  input: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#24475a",
    backgroundColor: "#06151f",
    color: "#ffffff",
    fontSize: 16,
    paddingHorizontal: 14,
  },
  sendButton: {
    width: 96,
    borderRadius: 8,
    backgroundColor: "#73e6a2",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#315263",
  },
  sendButtonPressed: {
    opacity: 0.82,
  },
  sendButtonText: {
    color: "#06151f",
    fontSize: 16,
    fontWeight: "700",
  },
});
