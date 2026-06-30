// Small shared kawaii primitives.
import React from "react";
import { Text, View, Pressable, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { RADIUS, SPACE } from "../theme";
import { expiryBadge } from "../lib/expiry";

export function ExpiryBadge({ exp, palette }) {
  const { label, tone } = expiryBadge(exp);
  const c = palette.badge[tone] || palette.badge.neutral;
  return (
    <View style={[s.badge, { backgroundColor: c.bg }]}>
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
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        onPress?.();
      }}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: palette.accent, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={[s.btnText, { color: palette.accentInk }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  badge: { alignSelf: "flex-start", borderRadius: RADIUS.pill, paddingHorizontal: 11, paddingVertical: 5 },
  badgeText: { fontSize: 12.5, fontWeight: "700", letterSpacing: 0.2 },
  bubble: {
    minWidth: 24, height: 24, borderRadius: RADIUS.pill, paddingHorizontal: 7,
    alignItems: "center", justifyContent: "center",
  },
  bubbleText: { fontSize: 13, fontWeight: "800" },
  btn: {
    borderRadius: RADIUS.lg, paddingVertical: 17, paddingHorizontal: 28, alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  btnText: { fontSize: 17, fontWeight: "800", letterSpacing: 0.3 },
});
