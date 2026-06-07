import { StyleSheet, View } from "react-native";

import type { RobotExpression } from "../types/robotEvents";

type RobotMouthProps = {
  expression: RobotExpression;
};

export function RobotMouth({ expression }: RobotMouthProps) {
  const mouthStyle = mouthStyleByExpression[expression];
  return <View style={[styles.mouth, mouthStyle]} />;
}

const mouthStyleByExpression: Record<RobotExpression, object> = {
  idle: { width: 82, height: 12, borderRadius: 8, backgroundColor: "#8ff5ff" },
  listening: { width: 64, height: 16, borderRadius: 8, backgroundColor: "#b7ecff" },
  thinking: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#f3d779" },
  speaking: { width: 82, height: 42, borderRadius: 18, backgroundColor: "#73e6a2" },
  happy: { width: 96, height: 28, borderRadius: 22, backgroundColor: "#7be08a" },
  surprised: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#ffa75d" },
  confused: { width: 58, height: 14, borderRadius: 8, backgroundColor: "#c9a5ff" },
  error: { width: 76, height: 12, borderRadius: 8, backgroundColor: "#ff7d7d" },
};

const styles = StyleSheet.create({
  mouth: {
    opacity: 0.95,
  },
});
