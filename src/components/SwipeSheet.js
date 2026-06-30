// Bottom sheet in a transparent Modal — a true overlay that never resizes the
// screen behind it. Smooth slide in/out; swipe down from anywhere to dismiss.
import React, { useEffect, useRef, useState } from "react";
import { Modal, Animated, Easing, Pressable, PanResponder, StyleSheet, View, Dimensions } from "react-native";
import { RADIUS, SPACE } from "../theme";
import { useApp } from "../store";

const SCREEN_H = Dimensions.get("window").height;

export default function SwipeSheet({ visible, onClose, palette, children }) {
  const { addOverlay, removeOverlay } = useApp();
  const ty = useRef(new Animated.Value(SCREEN_H)).current;
  const [render, setRender] = useState(visible);

  // freeze the page-swipe pager while this sheet is open
  useEffect(() => {
    if (!visible) return undefined;
    addOverlay();
    return () => removeOverlay();
  }, [visible, addOverlay, removeOverlay]);

  useEffect(() => {
    if (visible) {
      setRender(true);
      ty.setValue(SCREEN_H);
      // wait one frame so the Modal is mounted before animating (no "teleport")
      const id = requestAnimationFrame(() => {
        Animated.timing(ty, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      });
      return () => cancelAnimationFrame(id);
    }
    Animated.timing(ty, { toValue: SCREEN_H, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true })
      .start(({ finished }) => { if (finished) setRender(false); });
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => g.dy > 8 && g.dy > Math.abs(g.dx),
      onPanResponderMove: (_e, g) => { if (g.dy > 0) ty.setValue(g.dy); },
      onPanResponderRelease: (_e, g) => {
        if (g.dy > 120 || g.vy > 0.8) onClose?.();
        else Animated.timing(ty, { toValue: 0, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      },
    })
  ).current;

  const opacity = ty.interpolate({ inputRange: [0, SCREEN_H], outputRange: [1, 0], extrapolate: "clamp" });

  return (
    <Modal visible={render} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[s.backdrop, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          {...pan.panHandlers}
          style={[s.sheet, { backgroundColor: palette.surface, transform: [{ translateY: ty }] }]}
        >
          <View style={[s.grabber, { backgroundColor: palette.line }]} />
          {children}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    borderTopLeftRadius: RADIUS.lg + 6, borderTopRightRadius: RADIUS.lg + 6,
    paddingHorizontal: SPACE.lg, paddingTop: SPACE.md, paddingBottom: SPACE.xl,
  },
  grabber: { width: 44, height: 5, borderRadius: 3, alignSelf: "center", marginBottom: SPACE.md },
});
