import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export type InteractionHistoryItem = {
  id: string;
  question: string;
  answer: string;
  imageUrl?: string;
};

type InteractionHistoryProps = {
  items: InteractionHistoryItem[];
  onClose: () => void;
  visible: boolean;
};

export function InteractionHistory({ items, onClose, visible }: InteractionHistoryProps) {
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Conversa desta sessão</Text>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed ? styles.pressed : null]}
            >
              <Text style={styles.closeText}>Fechar</Text>
            </Pressable>
          </View>

          {items.length === 0 ? (
            <Text style={styles.emptyText}>Ainda não conversamos nesta sessão.</Text>
          ) : (
            <ScrollView contentContainerStyle={styles.list}>
              {items.map((item) => (
                <View key={item.id} style={styles.item}>
                  {item.question.trim() ? (
                    <View style={[styles.bubble, styles.questionBubble]}>
                      <Text style={styles.roleLabel}>Você</Text>
                      <Text style={styles.bubbleText}>{item.question}</Text>
                    </View>
                  ) : null}
                  {item.answer.trim() ? (
                    <View style={[styles.bubble, styles.answerBubble]}>
                      <Text style={styles.roleLabel}>Cubinho</Text>
                      <Text style={styles.bubbleText}>{item.answer}</Text>
                    </View>
                  ) : null}
                  {item.imageUrl ? (
                    <Image
                      accessibilityLabel="Imagem gerada pelo Cubinho"
                      resizeMode="cover"
                      source={{ uri: item.imageUrl }}
                      style={styles.image}
                    />
                  ) : null}
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(3, 11, 17, 0.72)",
  },
  sheet: {
    maxHeight: "82%",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: "#0d2230",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#f5fbff",
    fontSize: 18,
    fontWeight: "700",
  },
  closeButton: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#1b3b4d",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: "#d9f6ff",
    fontSize: 14,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.82,
  },
  emptyText: {
    color: "#9db5c4",
    fontSize: 16,
    paddingVertical: 18,
  },
  list: {
    gap: 18,
    paddingBottom: 8,
  },
  item: {
    gap: 8,
  },
  bubble: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  questionBubble: {
    backgroundColor: "#123247",
    alignSelf: "flex-end",
    maxWidth: "88%",
  },
  answerBubble: {
    backgroundColor: "#06151f",
    alignSelf: "flex-start",
    maxWidth: "88%",
  },
  roleLabel: {
    color: "#7fb6cf",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bubbleText: {
    color: "#f5fbff",
    fontSize: 16,
    lineHeight: 22,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    backgroundColor: "#102838",
  },
});
