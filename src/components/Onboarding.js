import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useApp } from "../store";
import { RADIUS, SPACE, HAND } from "../theme";
import { FridgeIcon } from "./icons";
import { PrimaryButton } from "./ui";

const FORMATS = [
  { value: "MDY", label: "MM / DD / YYYY", eg: "12/31/2026" },
  { value: "DMY", label: "DD / MM / YYYY", eg: "31/12/2026" },
  { value: "YMD", label: "YYYY / MM / DD", eg: "2026/12/31" },
];

function Stepper({ value, set, min, max, unit, palette }) {
  return (
    <View style={[s.stepper, { backgroundColor: palette.surface, borderColor: palette.line }]}>
      <Pressable
        onPress={() => { Haptics.selectionAsync().catch(() => {}); set(Math.max(min, value - 1)); }}
        style={[s.step, { borderColor: palette.text }]}
        accessibilityRole="button"
        accessibilityLabel="Fewer days"
      >
        <Text style={[s.stepSign, { color: palette.text }]}>-</Text>
      </Pressable>
      <View style={s.stepMid}>
        <Text style={[s.stepNum, { color: palette.text }]}>{value}</Text>
        <Text style={[s.stepUnit, { color: palette.textSoft }]}>{unit(value)}</Text>
      </View>
      <Pressable
        onPress={() => { Haptics.selectionAsync().catch(() => {}); set(Math.min(max, value + 1)); }}
        style={[s.step, { borderColor: palette.text }]}
        accessibilityRole="button"
        accessibilityLabel="More days"
      >
        <Text style={[s.stepSign, { color: palette.text }]}>+</Text>
      </Pressable>
    </View>
  );
}

export default function Onboarding() {
  const { palette, settings, updateSettings } = useApp();
  const insets = useSafeAreaInsets();
  const [region, setRegion] = useState(settings.region || "DMY");
  const [days, setDays] = useState(settings.notifyDays || 2);
  const [autoDel, setAutoDel] = useState(settings.autoRemoveDays || 7);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={[s.content, { paddingTop: insets.top + SPACE.xl, paddingBottom: insets.bottom + SPACE.lg }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.header}>
        <FridgeIcon color={palette.text} size={48} active />
        <Text style={[s.title, { color: palette.text }]}>Pekko Fridge</Text>
        <Text style={[s.sub, { color: palette.textSoft }]}>Three questions so dates are read the right way. You can change them later in Settings.</Text>
      </View>

      <Text style={[s.q, { color: palette.text }]}>How are dates written where you are?</Text>
      <View style={{ gap: SPACE.sm }}>
        {FORMATS.map((f) => {
          const on = f.value === region;
          return (
            <Pressable
              key={f.value}
              onPress={() => { Haptics.selectionAsync().catch(() => {}); setRegion(f.value); }}
              style={[s.opt, { backgroundColor: on ? palette.text : palette.surface, borderColor: on ? palette.text : palette.line }]}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
            >
              <Text style={[s.optLabel, { color: on ? palette.surface : palette.text }]}>{f.label}</Text>
              <Text style={[s.optEg, { color: on ? palette.surface : palette.textSoft }]}>{f.eg}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[s.q, { color: palette.text, marginTop: SPACE.lg }]}>Remind me before items expire</Text>
      <Stepper value={days} set={setDays} min={1} max={14} palette={palette} unit={(v) => `${v} day${v === 1 ? "" : "s"} before`} />

      <Text style={[s.q, { color: palette.text, marginTop: SPACE.lg }]}>Auto-remove expired items after</Text>
      <Stepper value={autoDel} set={setAutoDel} min={1} max={30} palette={palette} unit={(v) => `${v} day${v === 1 ? "" : "s"} past expiry`} />

      <View style={{ height: SPACE.xl }} />
      <PrimaryButton
        label="Open my fridge"
        palette={palette}
        onPress={() => updateSettings({ region, notifyDays: days, autoRemoveDays: autoDel, onboarded: true })}
      />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: SPACE.lg },
  header: { gap: SPACE.sm, marginBottom: SPACE.xl },
  title: { fontFamily: HAND, fontSize: 38, lineHeight: 46, marginTop: SPACE.sm },
  sub: { fontSize: 15, lineHeight: 21 },
  q: { fontSize: 16, fontWeight: "800", marginBottom: SPACE.sm },
  opt: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1.5, borderRadius: RADIUS.md, paddingHorizontal: SPACE.lg, paddingVertical: SPACE.md },
  optLabel: { fontSize: 16, fontWeight: "700" },
  optEg: { fontSize: 13, fontWeight: "600" },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: RADIUS.md, padding: SPACE.sm },
  step: { width: 52, height: 52, borderRadius: RADIUS.md, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  stepSign: { fontSize: 26, fontWeight: "800" },
  stepMid: { alignItems: "center" },
  stepNum: { fontSize: 28, fontWeight: "800" },
  stepUnit: { fontSize: 12.5, fontWeight: "700" },
});
