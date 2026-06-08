import { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";

import type { RobotExpression } from "../types/robotEvents";

type RobotMouthProps = {
  expression: RobotExpression;
  is_speaking: boolean;
  mouth_open_level?: number;
};

export function RobotMouth({
  expression,
  is_speaking,
  mouth_open_level,
}: RobotMouthProps) {
  const animatedOpenLevel = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;

    const clearAnimationTimeout = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    if (!is_speaking) {
      clearAnimationTimeout();
      animatedOpenLevel.stopAnimation();
      animatedOpenLevel.setValue(0);
      return clearAnimationTimeout;
    }

    const animate = () => {
      const nextLevel =
        typeof mouth_open_level === "number"
          ? clampMouthOpenLevel(mouth_open_level)
          : 0.25 + Math.random() * 0.75;

      Animated.timing(animatedOpenLevel, {
        toValue: nextLevel,
        duration: 80 + Math.floor(Math.random() * 90),
        useNativeDriver: false,
      }).start(() => {
        if (!active) {
          return;
        }

        timeoutRef.current = setTimeout(animate, 35 + Math.floor(Math.random() * 70));
      });
    };

    animate();

    return () => {
      active = false;
      clearAnimationTimeout();
      animatedOpenLevel.stopAnimation();
    };
  }, [animatedOpenLevel, is_speaking, mouth_open_level]);

  const mouthStyle = mouthStyleByExpression[expression];
  const speakingHeight = animatedOpenLevel.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 54],
  });

  return (
    <Animated.View
      style={[
        styles.mouth,
        {
          backgroundColor: mouthStyle.backgroundColor,
          borderRadius: is_speaking ? 18 : mouthStyle.borderRadius,
          height: is_speaking ? speakingHeight : mouthStyle.height,
          width: is_speaking ? Math.max(mouthStyle.width, 82) : mouthStyle.width,
        },
      ]}
    />
  );
}

function clampMouthOpenLevel(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

const mouthStyleByExpression: Record<
  RobotExpression,
  {
    width: number;
    height: number;
    borderRadius: number;
    backgroundColor: string;
  }
> = {
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
