// Bottom sheet in a transparent Modal — a true overlay that never resizes the
// screen behind it. Smooth slide in/out; swipe down from anywhere to dismiss.
import React, { useEffect, useRef, useState } from "react";
import { Modal, Animated, Easing, Pressable, PanResponder, StyleSheet, View, Dimensions } from "react-native";
import { RADIUS, SPACE } from "../theme";
import { useApp } from "../store";

const SCREEN_H = Dimensions.get("window").height;

export default function SwipeSheet({ visible, onClose, palette, children, header = null, scrollable = false }) {
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

  const downward = (g) => g.dy > 5 && g.dy > Math.abs(g.dx) + 2;
  // grabOnStart: claim on touch-down (move-based responder negotiation is flaky
  // inside a Modal on the New Architecture; the handle has no tappable children).
  const makePan = (grabOnStart) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => grabOnStart,
      onStartShouldSetPanResponderCapture: () => grabOnStart,
      onMoveShouldSetPanResponder: (_e, g) => downward(g),
      onMoveShouldSetPanResponderCapture: (_e, g) => downward(g),
      onPanResponderMove: (_e, g) => { if (g.dy > 0) ty.setValue(g.dy); },
      onPanResponderRelease: (_e, g) => {
        if (g.dy > 80 || g.vy > 0.5) onClose?.();
        else Animated.spring(ty, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 18 }).start();
      },
      onPanResponderTerminationRequest: () => false,
    });
  const panSheet = useRef(makePan(false)).current; // empty background of non-scroll sheets
  const panHandle = useRef(makePan(true)).current;  // grabber + header (always)

  const opacity = ty.interpolate({ inputRange: [0, SCREEN_H], outputRange: [1, 0], extrapolate: "clamp" });

  return (
    <Modal visible={render} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[s.backdrop, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          {...(scrollable ? {} : panSheet.panHandlers)}
          style={[s.sheet, { backgroundColor: palette.surface, transform: [{ translateY: ty }] }]}
        >
          {/* grabber + header is always a drag-to-close handle (its own responder) */}
          <View {...panHandle.panHandlers} style={s.handle}>
            <View style={[s.grabber, { backgroundColor: palette.line }]} />
            {header}
          </View>
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
  handle: { paddingTop: 12, paddingBottom: SPACE.md },
  grabber: { width: 52, height: 6, borderRadius: 3, alignSelf: "center", marginBottom: SPACE.sm },
});
