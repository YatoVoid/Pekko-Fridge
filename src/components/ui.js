import React from "react";
import { Text, View, Pressable, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { RADIUS } from "../theme";
import { expiryBadge } from "../lib/expiry";

// Days left, ringed in the colour of how urgent it is, like a date circled on a note.
export function ExpiryBadge({ exp, palette }) {
  const { label, tone } = expiryBadge(exp);
  const c = palette.badge[tone] || palette.badge.neutral;
  const loud = tone === "bad" || tone === "warn";
  return (
    <View style={[s.badge, { borderColor: c.fg, borderWidth: loud ? 2 : 1.25 }]}>
      <Text style={[s.badgeText, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

export function Bubble({ count, palette }) {
  if (!count) return null;
  return (
    <View style={[s.bubble, { backgroundColor: palette.bubble }]}>
      <Text style={[s.bubbleText, { color: palette.accentInk }]}>{count}</Text>
    </View>
  );
}

export function PrimaryButton({ label, onPress, palette, disabled }) {
  return (
    <Pressable
      disabled={disabled}
      accessibilityRole="button"
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        onPress?.();
      }}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: palette.text, opacity: disabled ? 0.45 : 1, transform: [{ translateY: pressed ? 1 : 0 }] },
      ]}
    >
      <Text style={[s.btnText, { color: palette.surface }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  badge: { alignSelf: "center", borderRadius: RADIUS.pill, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12.5, fontWeight: "700" },
  bubble: {
    minWidth: 22, height: 22, borderRadius: RADIUS.pill, paddingHorizontal: 6,
    alignItems: "center", justifyContent: "center",
  },
  bubbleText: { fontSize: 12.5, fontWeight: "800" },
  btn: { borderRadius: RADIUS.md, paddingVertical: 16, paddingHorizontal: 24, alignItems: "center", justifyContent: "center" },
  btnText: { fontSize: 17, fontWeight: "700" },
});
