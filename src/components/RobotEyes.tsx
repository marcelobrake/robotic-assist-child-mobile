import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

import type { RobotExpression } from "../types/robotEvents";

type RobotEyesProps = {
  expression: RobotExpression;
};

export function RobotEyes({ expression }: RobotEyesProps) {
  const blinkScale = useRef(new Animated.Value(1)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;

    const blink = () => {
      Animated.sequence([
        Animated.timing(blinkScale, {
          toValue: 0.08,
          duration: 85,
          useNativeDriver: true,
        }),
        Animated.timing(blinkScale, {
          toValue: 1,
          duration: 115,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (!active) {
          return;
        }
        const nextBlinkMs = 1700 + Math.floor(Math.random() * 3600);
        timeoutRef.current = setTimeout(blink, nextBlinkMs);
      });
    };

    timeoutRef.current = setTimeout(blink, 900 + Math.floor(Math.random() * 1800));

    return () => {
      active = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      blinkScale.stopAnimation();
    };
  }, [blinkScale]);

  const eyeStyle = eyeStyleByExpression[expression];

  return (
    <View style={styles.row}>
      <Animated.View style={[styles.eye, eyeStyle, { transform: [{ scaleY: blinkScale }] }]} />
      <Animated.View
        style={[
          styles.eye,
          eyeStyle,
          expression === "confused" ? styles.confusedEye : null,
          { transform: [{ scaleY: blinkScale }] },
        ]}
      />
    </View>
  );
}

const eyeStyleByExpression: Record<RobotExpression, object> = {
  idle: { backgroundColor: "#8ff5ff" },
  listening: { backgroundColor: "#b7ecff" },
  thinking: { backgroundColor: "#f3d779" },
  speaking: { backgroundColor: "#73e6a2" },
  happy: { backgroundColor: "#7be08a", borderRadius: 26 },
  surprised: { backgroundColor: "#ffa75d", height: 66 },
  confused: { backgroundColor: "#c9a5ff" },
  error: { backgroundColor: "#ff7d7d" },
};

const styles = StyleSheet.create({
  row: {
    width: "68%",
    minHeight: 74,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eye: {
    width: 72,
    height: 58,
    borderRadius: 22,
  },
  confusedEye: {
    height: 42,
    transform: [{ rotate: "8deg" }],
  },
});
