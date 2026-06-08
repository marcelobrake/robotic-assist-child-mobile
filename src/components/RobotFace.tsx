import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import type { RobotExpression } from "../types/robotEvents";
import { RobotEyes } from "./RobotEyes";
import { RobotMouth } from "./RobotMouth";
import { randomThinkingColor } from "./robotPalette";

type RobotFaceProps = {
  expression: RobotExpression;
  is_speaking?: boolean;
  mouth_open_level?: number;
};

export function RobotFace({
  expression,
  is_speaking = false,
  mouth_open_level,
}: RobotFaceProps) {
  const isThinking = expression === "thinking";
  const [thinkingBorder, setThinkingBorder] = useState<string | null>(null);

  useEffect(() => {
    if (!isThinking) {
      setThinkingBorder(null);
      return;
    }

    setThinkingBorder(randomThinkingColor());
    const intervalId = setInterval(() => {
      setThinkingBorder(randomThinkingColor());
    }, 160);

    return () => clearInterval(intervalId);
  }, [isThinking]);

  return (
    <View
      style={[
        styles.shell,
        shellStyleByExpression[expression],
        thinkingBorder ? { borderColor: thinkingBorder } : null,
      ]}
    >
      <View style={styles.screen}>
        <RobotEyes expression={expression} />
        <RobotMouth
          expression={expression}
          is_speaking={is_speaking}
          mouth_open_level={mouth_open_level}
        />
      </View>
    </View>
  );
}

const shellStyleByExpression: Record<RobotExpression, object> = {
  idle: { borderColor: "#5ec6c8" },
  listening: { borderColor: "#8bd8ff" },
  thinking: { borderColor: "#f3d779" },
  speaking: { borderColor: "#73e6a2" },
  happy: { borderColor: "#7be08a" },
  surprised: { borderColor: "#ffa75d" },
  confused: { borderColor: "#c9a5ff" },
  error: { borderColor: "#ff7d7d" },
};

const styles = StyleSheet.create({
  shell: {
    width: "88%",
    maxWidth: 380,
    aspectRatio: 1,
    borderRadius: 34,
    borderWidth: 5,
    backgroundColor: "#102838",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#73e6ff",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 24,
    elevation: 10,
  },
  screen: {
    width: "82%",
    aspectRatio: 1,
    borderRadius: 28,
    backgroundColor: "#061018",
    alignItems: "center",
    justifyContent: "center",
    gap: 34,
  },
});
