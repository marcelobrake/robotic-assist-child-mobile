import {
  Image,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

export type LowerPanelContent =
  | { mode: "empty" }
  | { mode: "text"; text: string }
  | { mode: "loading_image" }
  | { mode: "image"; imageUrl: string }
  | { mode: "error"; message: string };

type LowerPanelProps = {
  content: LowerPanelContent;
  healthLabel: string;
  healthStatus: "checking" | "online" | "offline";
  inputText: string;
  isSending: boolean;
  isVoiceBusy: boolean;
  isVoiceRecording: boolean;
  isListenerModeEnabled: boolean;
  interactionState: string;
  onChangeInput: (value: string) => void;
  onInputBlur: () => void;
  onInputFocus: () => void;
  onImageError?: () => void;
  onRefreshHealth: () => void;
  onSend: () => void;
  onToggleListenerMode: (value: boolean) => void;
  onVoicePress: () => void;
  showHealthLabel: boolean;
};

export function LowerPanel({
  content,
  healthLabel,
  healthStatus,
  inputText,
  isSending,
  isVoiceBusy,
  isVoiceRecording,
  isListenerModeEnabled,
  interactionState,
  onChangeInput,
  onInputBlur,
  onInputFocus,
  onImageError,
  onRefreshHealth,
  onSend,
  onToggleListenerMode,
  onVoicePress,
  showHealthLabel,
}: LowerPanelProps) {
  const canSend = inputText.trim().length > 0 && !isSending;
  const voiceButtonLabel = isVoiceRecording ? "Parar" : "Falar";

  return (
    <View style={styles.panel}>
      <View style={styles.statusRow}>
        <Pressable
          accessibilityLabel={healthLabel}
          accessibilityRole="button"
          onPress={onRefreshHealth}
          style={styles.statusButton}
        >
          <View style={[styles.statusDot, statusDotStyle[healthStatus]]} />
          {showHealthLabel ? <Text style={styles.statusText}>{healthLabel}</Text> : null}
        </Pressable>
        <Text style={styles.expressionText}>{interactionState}</Text>
      </View>

      <View
        style={[
          styles.contentBox,
          content.mode === "image" ? styles.imageContentBox : null,
        ]}
      >
        {renderContent(content, onImageError)}
      </View>

      <View style={styles.voiceControlsRow}>
        <View style={styles.listenerModeControl}>
          <Text style={styles.listenerModeText}>Modo ouvinte</Text>
          <Switch
            accessibilityLabel="Modo ouvinte"
            onValueChange={onToggleListenerMode}
            thumbColor={isListenerModeEnabled ? "#30d158" : "#d9f6ff"}
            trackColor={{ false: "#24475a", true: "#1f7f42" }}
            value={isListenerModeEnabled}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={isVoiceBusy && !isVoiceRecording}
          onPress={onVoicePress}
          style={({ pressed }) => [
            styles.voiceButton,
            isVoiceRecording ? styles.voiceButtonRecording : null,
            isVoiceBusy && !isVoiceRecording ? styles.voiceButtonDisabled : null,
            pressed ? styles.voiceButtonPressed : null,
          ]}
        >
          <Text style={styles.voiceButtonText}>{voiceButtonLabel}</Text>
        </Pressable>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          accessibilityLabel="Mensagem para o Cubinho"
          autoCapitalize="sentences"
          editable={!isSending && !isVoiceBusy}
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

function renderContent(content: LowerPanelContent, onImageError?: () => void) {
  switch (content.mode) {
    case "empty":
      return null;
    case "loading_image":
      return (
        <View style={styles.loadingImageBox}>
          <View style={styles.loaderGrid} accessibilityLabel="Montando a imagem">
            <View style={[styles.loaderTile, styles.loaderTilePrimary]} />
            <View style={[styles.loaderTile, styles.loaderTileMuted]} />
            <View style={[styles.loaderTile, styles.loaderTileMuted]} />
            <View style={[styles.loaderTile, styles.loaderTilePrimary]} />
          </View>
          <Text style={styles.loadingImageText}>Montando a imagem...</Text>
        </View>
      );
    case "image":
      return (
        <Image
          accessibilityLabel="Imagem gerada pelo Cubinho"
          onError={onImageError}
          resizeMode="cover"
          source={{ uri: content.imageUrl }}
          style={styles.generatedImage}
        />
      );
    case "error":
      return <Text style={styles.errorText}>{content.message}</Text>;
    case "text":
    default:
      return <Text style={styles.assistantText}>{content.text}</Text>;
  }
}

const statusDotStyle = {
  checking: { backgroundColor: "#f6c945" },
  online: { backgroundColor: "#30d158" },
  offline: { backgroundColor: "#ff453a" },
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
    width: 14,
    height: 14,
    borderRadius: 7,
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
  contentBox: {
    minHeight: 96,
    borderRadius: 8,
    backgroundColor: "#06151f",
    justifyContent: "center",
    padding: 14,
  },
  imageContentBox: {
    minHeight: 190,
    padding: 8,
  },
  assistantText: {
    color: "#f5fbff",
    fontSize: 18,
    lineHeight: 25,
  },
  loadingImageBox: {
    minHeight: 118,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loaderGrid: {
    width: 58,
    height: 58,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  loaderTile: {
    width: 26,
    height: 26,
    borderRadius: 6,
  },
  loaderTilePrimary: {
    backgroundColor: "#73e6a2",
  },
  loaderTileMuted: {
    backgroundColor: "#24475a",
  },
  loadingImageText: {
    color: "#d9f6ff",
    fontSize: 16,
    fontWeight: "600",
  },
  generatedImage: {
    width: "100%",
    height: 176,
    borderRadius: 8,
    backgroundColor: "#102838",
  },
  errorText: {
    color: "#ffd4d4",
    fontSize: 17,
    lineHeight: 24,
  },
  voiceControlsRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  listenerModeControl: {
    flex: 1,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#24475a",
    backgroundColor: "#06151f",
    paddingHorizontal: 12,
  },
  listenerModeText: {
    color: "#d9f6ff",
    fontSize: 15,
    fontWeight: "600",
  },
  voiceButton: {
    width: 82,
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: "#8bd8ff",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceButtonRecording: {
    backgroundColor: "#ff453a",
  },
  voiceButtonDisabled: {
    backgroundColor: "#315263",
  },
  voiceButtonPressed: {
    opacity: 0.82,
  },
  voiceButtonText: {
    color: "#06151f",
    fontSize: 15,
    fontWeight: "700",
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
