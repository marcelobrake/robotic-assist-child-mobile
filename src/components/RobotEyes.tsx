import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";

import type { RobotExpression } from "../types/robotEvents";
import { randomThinkingColor } from "./robotPalette";

type RobotEyesProps = {
  expression: RobotExpression;
};

export function RobotEyes({ expression }: RobotEyesProps) {
  const leftBlink = useRef(new Animated.Value(1)).current;
  const rightBlink = useRef(new Animated.Value(1)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [thinkingColor, setThinkingColor] = useState<string | null>(null);

  const isThinking = expression === "thinking";

  useEffect(() => {
    let active = true;

    const clearTimer = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const winkEye = (value: Animated.Value, onDone: () => void) => {
      Animated.sequence([
        Animated.timing(value, { toValue: 0.08, duration: 70, useNativeDriver: true }),
        Animated.timing(value, { toValue: 1, duration: 90, useNativeDriver: true }),
      ]).start(() => {
        if (active) {
          onDone();
        }
      });
    };

    if (isThinking) {
      let useLeft = true;

      const winkLoop = () => {
        const target = useLeft ? leftBlink : rightBlink;
        useLeft = !useLeft;
        winkEye(target, () => {
          timeoutRef.current = setTimeout(winkLoop, 110 + Math.floor(Math.random() * 130));
        });
      };

      winkLoop();

      return () => {
        active = false;
        clearTimer();
        leftBlink.stopAnimation();
        leftBlink.setValue(1);
        rightBlink.stopAnimation();
        rightBlink.setValue(1);
      };
    }

    const blink = () => {
      Animated.sequence([
        Animated.timing(leftBlink, { toValue: 0.08, duration: 85, useNativeDriver: true }),
        Animated.timing(leftBlink, { toValue: 1, duration: 115, useNativeDriver: true }),
      ]).start(() => {
        if (!active) {
          return;
        }
        const nextBlinkMs = 1700 + Math.floor(Math.random() * 3600);
        timeoutRef.current = setTimeout(blink, nextBlinkMs);
      });
    };

    rightBlink.setValue(1);
    timeoutRef.current = setTimeout(blink, 900 + Math.floor(Math.random() * 1800));

    return () => {
      active = false;
      clearTimer();
      leftBlink.stopAnimation();
      rightBlink.stopAnimation();
    };
  }, [isThinking, leftBlink, rightBlink]);

  useEffect(() => {
    if (!isThinking) {
      setThinkingColor(null);
      return;
    }

    setThinkingColor(randomThinkingColor());
    const intervalId = setInterval(() => {
      setThinkingColor(randomThinkingColor());
    }, 180);

    return () => clearInterval(intervalId);
  }, [isThinking]);

  const eyeStyle = eyeStyleByExpression[expression];
  const colorOverride = thinkingColor ? { backgroundColor: thinkingColor } : null;

  return (
    <View style={styles.row}>
      <Animated.View
        style={[styles.eye, eyeStyle, colorOverride, { transform: [{ scaleY: leftBlink }] }]}
      />
      <Animated.View
        style={[
          styles.eye,
          eyeStyle,
          expression === "confused" ? styles.confusedEye : null,
          colorOverride,
          { transform: [{ scaleY: isThinking ? rightBlink : leftBlink }] },
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
