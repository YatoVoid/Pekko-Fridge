import React, { useEffect, useRef, useState } from "react";
import { Modal, Animated, Easing, Pressable, PanResponder, StyleSheet, View, Dimensions, KeyboardAvoidingView } from "react-native";
import { RADIUS, SPACE } from "../theme";
import { useApp } from "../store";

const SCREEN_H = Dimensions.get("window").height;

export default function SwipeSheet({ visible, onClose, palette, children, header = null, scrollable = false }) {
  const { addOverlay, removeOverlay } = useApp();
  const ty = useRef(new Animated.Value(SCREEN_H)).current;
  const [render, setRender] = useState(visible);

  useEffect(() => {
    if (!visible) return undefined;
    addOverlay();
    return () => removeOverlay();
  }, [visible, addOverlay, removeOverlay]);

  useEffect(() => {
    if (visible) {
      setRender(true);
      ty.setValue(SCREEN_H);
      const id = requestAnimationFrame(() => {
        Animated.timing(ty, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      });
      return () => cancelAnimationFrame(id);
    }
    Animated.timing(ty, { toValue: SCREEN_H, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true })
      .start(({ finished }) => { if (finished) setRender(false); });
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const downward = (g) => g.dy > 5 && g.dy > Math.abs(g.dx) + 2;
  // Move-based responder negotiation is unreliable inside a Modal on the New
  // Architecture, so the handle claims on touch-down.
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
  const panSheet = useRef(makePan(false)).current;
  const panHandle = useRef(makePan(true)).current;

  const opacity = ty.interpolate({ inputRange: [0, SCREEN_H], outputRange: [1, 0], extrapolate: "clamp" });

  return (
    <Modal visible={render} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[s.backdrop, { opacity }]}>
        {/* adjustResize does nothing inside a translucent Modal, so the KeyboardAvoidingView lifts the sheet. */}
        <KeyboardAvoidingView behavior="padding" style={s.kav}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <Animated.View
            {...(scrollable ? {} : panSheet.panHandlers)}
            style={[s.sheet, { backgroundColor: palette.surface, transform: [{ translateY: ty }] }]}
          >
            <View {...panHandle.panHandlers} style={s.handle}>
              <View style={[s.grabber, { backgroundColor: palette.line }]} />
              {header}
            </View>
            {children}
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  kav: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg,
    paddingHorizontal: SPACE.lg, paddingTop: SPACE.md, paddingBottom: SPACE.xl,
  },
  handle: { paddingTop: 12, paddingBottom: SPACE.md },
  grabber: { width: 44, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: SPACE.sm },
});
