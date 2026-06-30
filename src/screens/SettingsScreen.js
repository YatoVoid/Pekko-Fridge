import React from "react";
import { View, Text, Switch, Pressable, ScrollView, TextInput, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useApp } from "../store";
import { RADIUS, SPACE } from "../theme";

function Segmented({ options, value, onChange, palette }) {
  return (
    <View style={[s.seg, { backgroundColor: palette.surfaceAlt }]}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => { Haptics.selectionAsync().catch(() => {}); onChange(o.value); }}
            style={[s.segItem, on && { backgroundColor: palette.accent }]}
          >
            <Text style={[s.segText, { color: on ? palette.accentInk : palette.textSoft }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Card({ title, subtitle, palette, children }) {
  return (
    <View style={[s.card, { backgroundColor: palette.surface, borderColor: palette.line }]}>
      <Text style={[s.cardTitle, { color: palette.text }]}>{title}</Text>
      {subtitle ? <Text style={[s.cardSub, { color: palette.textSoft }]}>{subtitle}</Text> : null}
      <View style={{ height: SPACE.md }} />
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const { palette, settings, updateSettings } = useApp();
  const insets = useSafeAreaInsets();
  const d = settings.notifyDays;

  return (
    <ScrollView
      style={{ backgroundColor: palette.bg }}
      contentContainerStyle={[s.content, { paddingBottom: 120 + insets.bottom }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[s.kicker, { color: palette.textSoft }]}>SETTINGS</Text>
      <Text style={[s.h1, { color: palette.text }]}>Make it yours</Text>
      <View style={{ height: SPACE.lg }} />

      <Card title="Fridge name" subtitle="What should we call your fridge?" palette={palette}>
        <TextInput
          value={settings.fridgeName}
          onChangeText={(t) => updateSettings({ fridgeName: t })}
          placeholder="My Fridge"
          placeholderTextColor={palette.textSoft}
          maxLength={28}
          style={[s.input, { color: palette.text, backgroundColor: palette.surfaceAlt, borderColor: palette.line }]}
        />
      </Card>

      <Card title="Appearance" subtitle="Cream daylight or soft ink night." palette={palette}>
        <Segmented
          palette={palette}
          value={settings.theme}
          onChange={(v) => updateSettings({ theme: v })}
          options={[{ label: "Light", value: "light" }, { label: "Dark", value: "dark" }, { label: "System", value: "system" }]}
        />
      </Card>

      <Card title="Date format" subtitle="How labels and dates are read." palette={palette}>
        <Segmented
          palette={palette}
          value={settings.region}
          onChange={(v) => updateSettings({ region: v })}
          options={[{ label: "MM/DD/YYYY", value: "MDY" }, { label: "DD/MM/YYYY", value: "DMY" }, { label: "YYYY/MM/DD", value: "YMD" }]}
        />
      </Card>

      <Card title="Reminders" subtitle="A gentle nudge before food spoils." palette={palette}>
        <View style={s.row}>
          <Text style={[s.rowLabel, { color: palette.text }]}>Push reminders</Text>
          <Switch
            value={settings.notify}
            onValueChange={(v) => { Haptics.selectionAsync().catch(() => {}); updateSettings({ notify: v }); }}
            trackColor={{ true: palette.accent, false: palette.line }}
            thumbColor="#fff"
          />
        </View>

        {settings.notify && (
          <>
            <View style={{ height: SPACE.md }} />
            <Text style={[s.rowLabel, { color: palette.text }]}>Remind me {d} day{d === 1 ? "" : "s"} before</Text>
            <View style={{ height: SPACE.sm }} />
            <View style={s.stepper}>
              <Step palette={palette} label="–" onPress={() => updateSettings({ notifyDays: Math.max(1, d - 1) })} />
              <Text style={[s.stepVal, { color: palette.text }]}>{d}</Text>
              <Step palette={palette} label="+" onPress={() => updateSettings({ notifyDays: Math.min(14, d + 1) })} />
            </View>
          </>
        )}
      </Card>

      <Card title="Auto-cleanup" subtitle="Tidy the fridge by removing old expired items." palette={palette}>
        <Text style={[s.rowLabel, { color: palette.text }]}>
          Remove {settings.autoRemoveDays} day{settings.autoRemoveDays === 1 ? "" : "s"} after expiry
        </Text>
        <View style={{ height: SPACE.sm }} />
        <View style={s.stepper}>
          <Step palette={palette} label="–" onPress={() => updateSettings({ autoRemoveDays: Math.max(1, settings.autoRemoveDays - 1) })} />
          <Text style={[s.stepVal, { color: palette.text }]}>{settings.autoRemoveDays}</Text>
          <Step palette={palette} label="+" onPress={() => updateSettings({ autoRemoveDays: Math.min(30, settings.autoRemoveDays + 1) })} />
        </View>
      </Card>

      <Text style={[s.footer, { color: palette.textSoft }]}>
        Pekko runs 100% on this phone. No accounts, no cloud, no tracking.
      </Text>
    </ScrollView>
  );
}

function Step({ label, onPress, palette }) {
  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); onPress(); }}
      style={[s.step, { backgroundColor: palette.surfaceAlt }]}
    >
      <Text style={[s.stepText, { color: palette.text }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  content: { padding: SPACE.lg, paddingTop: SPACE.xl + 12, paddingBottom: 120, gap: SPACE.md },
  kicker: { fontSize: 12, fontWeight: "800", letterSpacing: 2 },
  h1: { fontSize: 30, fontWeight: "900", marginTop: 4 },
  card: { borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACE.lg },
  cardTitle: { fontSize: 18, fontWeight: "800" },
  cardSub: { fontSize: 13.5, marginTop: 3 },
  input: { borderRadius: RADIUS.md, borderWidth: 1, paddingHorizontal: SPACE.md, paddingVertical: 13, fontSize: 16 },
  seg: { flexDirection: "row", borderRadius: RADIUS.pill, padding: 4, gap: 4 },
  segItem: { flex: 1, paddingVertical: 11, borderRadius: RADIUS.pill, alignItems: "center" },
  segText: { fontSize: 13, fontWeight: "800" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowLabel: { fontSize: 15.5, fontWeight: "700" },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SPACE.lg },
  step: { width: 52, height: 52, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
  stepText: { fontSize: 26, fontWeight: "800" },
  stepVal: { fontSize: 30, fontWeight: "900", minWidth: 40, textAlign: "center" },
  footer: { fontSize: 13, textAlign: "center", marginTop: SPACE.md, lineHeight: 20 },
});
