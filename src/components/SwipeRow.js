// iOS-style swipe-left row: drag reveals a themed-red "Remove"; swipe far to
// delete, or tap Remove. Vertical scrolling still works (only claims left drags).
import React, { useRef } from "react";
import { Animated, PanResponder, Pressable, Text, View, StyleSheet, Dimensions } from "react-native";
import * as Haptics from "expo-haptics";
import { RADIUS } from "../theme";

const W = Dimensions.get("window").width;
const REVEAL = 96;

export default function SwipeRow({ children, onRemove, palette }) {
  const tx = useRef(new Animated.Value(0)).current;
  const openRef = useRef(false);
  const bad = palette.badge.bad;

  const snap = (to) => {
    openRef.current = to !== 0;
    Animated.spring(tx, { toValue: to, useNativeDriver: true, bounciness: 0, speed: 22 }).start();
  };
  const remove = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    Animated.timing(tx, { toValue: -W, duration: 200, useNativeDriver: true }).start(() => onRemove?.());
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => g.dx < -6 && Math.abs(g.dx) > Math.abs(g.dy) * 1.4,
      onPanResponderMove: (_e, g) => {
        const base = openRef.current ? -REVEAL : 0;
        tx.setValue(Math.min(0, base + g.dx));
      },
      onPanResponderRelease: (_e, g) => {
        const x = (openRef.current ? -REVEAL : 0) + g.dx;
        if (x < -W * 0.42 || g.vx < -1.2) remove();
        else if (x < -REVEAL / 2) snap(-REVEAL);
        else snap(0);
      },
    })
  ).current;

  return (
    <View style={[st.wrap, { backgroundColor: bad.bg }]}>
      <View style={st.behind}>
        <Pressable onPress={remove} style={st.btn}>
          <Text style={[st.txt, { color: bad.fg }]}>Remove</Text>
        </Pressable>
      </View>
      <Animated.View {...pan.panHandlers} style={{ transform: [{ translateX: tx }] }}>
        {children}
      </Animated.View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { borderRadius: RADIUS.md, overflow: "hidden" },
  behind: { ...StyleSheet.absoluteFillObject, flexDirection: "row", justifyContent: "flex-end", alignItems: "stretch" },
  btn: { justifyContent: "center", paddingHorizontal: 26 },
  txt: { fontSize: 15, fontWeight: "800" },
});
