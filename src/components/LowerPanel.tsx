import { Image, Pressable, StyleSheet, Text, View } from "react-native";

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
  isVoiceBusy: boolean;
  isVoiceRecording: boolean;
  interactionState: string;
  onImageError?: () => void;
  onOpenHistory: () => void;
  onRefreshHealth: () => void;
  onToggleContent: () => void;
  onVoicePress: () => void;
  showContent: boolean;
  showHealthLabel: boolean;
};

export function LowerPanel({
  content,
  healthLabel,
  healthStatus,
  isVoiceBusy,
  isVoiceRecording,
  interactionState,
  onImageError,
  onOpenHistory,
  onRefreshHealth,
  onToggleContent,
  onVoicePress,
  showContent,
  showHealthLabel,
}: LowerPanelProps) {
  const isVoiceDisabled = isVoiceBusy && !isVoiceRecording;
  const voiceAccessibilityLabel = isVoiceRecording
    ? "Parar gravação"
    : "Falar com o Cubinho";

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
        <View style={styles.statusRight}>
          <Text style={styles.expressionText}>{interactionState}</Text>
          <Pressable
            accessibilityLabel={
              showContent ? "Ocultar respostas e imagens" : "Mostrar respostas e imagens"
            }
            accessibilityRole="button"
            onPress={onToggleContent}
            style={({ pressed }) => [styles.toggleButton, pressed ? styles.toggleButtonPressed : null]}
          >
            <Text style={styles.toggleText}>{showContent ? "Ocultar" : "Mostrar"}</Text>
          </Pressable>
        </View>
      </View>

      {showContent ? (
        <Pressable
          accessibilityHint="Toque para ver as últimas interações desta sessão"
          accessibilityRole="button"
          onPress={onOpenHistory}
          style={({ pressed }) => [
            styles.contentBox,
            content.mode === "image" ? styles.imageContentBox : null,
            pressed ? styles.contentBoxPressed : null,
          ]}
        >
          {renderContent(content, onImageError)}
        </Pressable>
      ) : null}

      <View style={styles.voiceArea}>
        <Pressable
          accessibilityLabel={voiceAccessibilityLabel}
          accessibilityRole="button"
          disabled={isVoiceDisabled}
          onPress={onVoicePress}
          style={({ pressed }) => [
            styles.voiceButton,
            isVoiceRecording ? styles.voiceButtonRecording : null,
            isVoiceDisabled ? styles.voiceButtonDisabled : null,
            pressed ? styles.voiceButtonPressed : null,
          ]}
        >
          {isVoiceRecording ? <RecordingGlyph /> : <MicGlyph />}
        </Pressable>
      </View>
    </View>
  );
}

function MicGlyph() {
  return (
    <View accessibilityElementsHidden style={micStyles.container}>
      <View style={micStyles.body} />
      <View style={micStyles.cradle} />
      <View style={micStyles.neck} />
      <View style={micStyles.base} />
    </View>
  );
}

function RecordingGlyph() {
  return <View accessibilityElementsHidden style={micStyles.recordingSquare} />;
}

function renderContent(content: LowerPanelContent, onImageError?: () => void) {
  switch (content.mode) {
    case "empty":
      return <Text style={styles.placeholderText}>Toque aqui para ver a conversa.</Text>;
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
    gap: 18,
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
  statusRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  expressionText: {
    color: "#9db5c4",
    fontSize: 13,
  },
  toggleButton: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#1b3b4d",
    alignItems: "center",
    justifyContent: "center",
  },
  toggleButtonPressed: {
    opacity: 0.82,
  },
  toggleText: {
    color: "#d9f6ff",
    fontSize: 13,
    fontWeight: "700",
  },
  contentBox: {
    minHeight: 96,
    borderRadius: 8,
    backgroundColor: "#06151f",
    justifyContent: "center",
    padding: 14,
  },
  contentBoxPressed: {
    opacity: 0.85,
  },
  imageContentBox: {
    minHeight: 190,
    padding: 8,
  },
  placeholderText: {
    color: "#7d96a6",
    fontSize: 16,
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
  voiceArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 4,
  },
  voiceButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#8bd8ff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
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
});

const micStyles = StyleSheet.create({
  container: {
    width: 40,
    height: 56,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  body: {
    width: 18,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#06151f",
  },
  cradle: {
    width: 30,
    height: 15,
    borderWidth: 3,
    borderTopWidth: 0,
    borderColor: "#06151f",
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    marginTop: -8,
  },
  neck: {
    width: 3,
    height: 7,
    backgroundColor: "#06151f",
  },
  base: {
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#06151f",
  },
  recordingSquare: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: "#ffffff",
  },
});
