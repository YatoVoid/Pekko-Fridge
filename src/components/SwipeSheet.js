// Bottom sheet you can swipe down from ANY point (not just the grabber).
// Sits above the tab bar + Android nav buttons via safe-area insets.
import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, PanResponder, StyleSheet, View } from "react-native";
import { RADIUS, SPACE } from "../theme";

// The sheet renders inside the screen region, which already sits above the
// tab bar + Android nav buttons (the tab bar is in normal layout flow).
export default function SwipeSheet({ visible, onClose, palette, children }) {
  const ty = useRef(new Animated.Value(800)).current;
  const [h, setH] = useState(800);

  useEffect(() => {
    Animated.spring(ty, {
      toValue: visible ? 0 : h,
      useNativeDriver: true,
      bounciness: 4,
      speed: 14,
    }).start();
  }, [visible, h]);

  const close = () => {
    Animated.timing(ty, { toValue: h, duration: 180, useNativeDriver: true }).start(() => onClose?.());
  };

  const pan = useRef(
    PanResponder.create({
      // Only hijack a clear downward drag, so inner horizontal scrolls still work.
      onMoveShouldSetPanResponder: (_e, g) => g.dy > 8 && g.dy > Math.abs(g.dx),
      onPanResponderMove: (_e, g) => { if (g.dy > 0) ty.setValue(g.dy); },
      onPanResponderRelease: (_e, g) => {
        if (g.dy > 110 || g.vy > 0.8) close();
        else Animated.spring(ty, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
      },
    })
  ).current;

  const opacity = ty.interpolate({ inputRange: [0, h], outputRange: [1, 0], extrapolate: "clamp" });

  return (
    <Animated.View pointerEvents={visible ? "auto" : "none"} style={[s.backdrop, { opacity }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      <Animated.View
        {...pan.panHandlers}
        onLayout={(e) => setH(e.nativeEvent.layout.height || 800)}
        style={[
          s.sheet,
          {
            backgroundColor: palette.surface,
            paddingBottom: SPACE.xl,
            transform: [{ translateY: ty }],
          },
        ]}
      >
        <View style={[s.grabber, { backgroundColor: palette.line }]} />
        {children}
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    borderTopLeftRadius: RADIUS.lg + 6, borderTopRightRadius: RADIUS.lg + 6,
    paddingHorizontal: SPACE.lg, paddingTop: SPACE.md,
  },
  grabber: { width: 44, height: 5, borderRadius: 3, alignSelf: "center", marginBottom: SPACE.md },
});
