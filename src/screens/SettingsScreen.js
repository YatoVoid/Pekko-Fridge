import React from "react";
import { View, Text, Switch, Pressable, ScrollView, TextInput, StyleSheet, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useApp } from "../store";
import { RADIUS, SPACE } from "../theme";

function Segmented({ options, value, onChange, palette }) {
  return (
    <View style={[s.seg, { borderColor: palette.text }]} accessibilityRole="radiogroup">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => { Haptics.selectionAsync().catch(() => {}); onChange(o.value); }}
            style={[s.segItem, on && { backgroundColor: palette.text }]}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
          >
            <Text style={[s.segText, { color: on ? palette.surface : palette.text }]} numberOfLines={1} adjustsFontSizeToFit>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Card({ title, subtitle, palette, children }) {
  return (
    <View style={[s.card, { borderColor: palette.line }]}>
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
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[s.h1, { color: palette.text }]}>Settings</Text>

      <Card title="Fridge name" palette={palette}>
        <TextInput
          value={settings.fridgeName}
          onChangeText={(t) => updateSettings({ fridgeName: t })}
          placeholder="My Fridge"
          placeholderTextColor={palette.textSoft}
          maxLength={28}
          style={[s.input, { color: palette.text, backgroundColor: palette.surface, borderColor: palette.line }]}
          accessibilityLabel="Fridge name"
        />
      </Card>

      <Card title="Appearance" palette={palette}>
        <Segmented
          palette={palette}
          value={settings.theme}
          onChange={(v) => updateSettings({ theme: v })}
          options={[{ label: "Light", value: "light" }, { label: "Dark", value: "dark" }, { label: "System", value: "system" }]}
        />
      </Card>

      <Card title="Date format" subtitle="Used to read labels and to show dates." palette={palette}>
        <Segmented
          palette={palette}
          value={settings.region}
          onChange={(v) => updateSettings({ region: v })}
          options={[{ label: "MM/DD/YYYY", value: "MDY" }, { label: "DD/MM/YYYY", value: "DMY" }, { label: "YYYY/MM/DD", value: "YMD" }]}
        />
      </Card>

      <Card title="Reminders" subtitle="A notification at 9 in the morning, before an item expires." palette={palette}>
        <View style={s.row}>
          <Text style={[s.rowLabel, { color: palette.text }]}>Push reminders</Text>
          <Switch
            value={settings.notify}
            onValueChange={(v) => { Haptics.selectionAsync().catch(() => {}); updateSettings({ notify: v }); }}
            trackColor={{ true: palette.text, false: palette.line }}
            accessibilityLabel="Push reminders"
            thumbColor="#fff"
          />
        </View>

        {settings.notify && (
          <>
            <View style={{ height: SPACE.md }} />
            <Text style={[s.rowLabel, { color: palette.text }]}>Remind me {d} day{d === 1 ? "" : "s"} before</Text>
            <View style={{ height: SPACE.sm }} />
            <View style={s.stepper}>
              <Step palette={palette} label="-" onPress={() => updateSettings({ notifyDays: Math.max(1, d - 1) })} />
              <Text style={[s.stepVal, { color: palette.text }]}>{d}</Text>
              <Step palette={palette} label="+" onPress={() => updateSettings({ notifyDays: Math.min(14, d + 1) })} />
            </View>
          </>
        )}
      </Card>

      <Card title="Auto-cleanup" subtitle="Expired items are taken off the fridge after this many days." palette={palette}>
        <Text style={[s.rowLabel, { color: palette.text }]}>
          Remove {settings.autoRemoveDays} day{settings.autoRemoveDays === 1 ? "" : "s"} after expiry
        </Text>
        <View style={{ height: SPACE.sm }} />
        <View style={s.stepper}>
          <Step palette={palette} label="-" onPress={() => updateSettings({ autoRemoveDays: Math.max(1, settings.autoRemoveDays - 1) })} />
          <Text style={[s.stepVal, { color: palette.text }]}>{settings.autoRemoveDays}</Text>
          <Step palette={palette} label="+" onPress={() => updateSettings({ autoRemoveDays: Math.min(30, settings.autoRemoveDays + 1) })} />
        </View>
      </Card>

      <Text style={[s.footer, { color: palette.textSoft }]}>
        To rename, reorder, add or hide folders, tap the pencil on the fridge screen.
      </Text>

      <Text style={[s.footer, { color: palette.textSoft }]}>
        Pekko runs entirely on this phone. No account, no cloud, no tracking.
      </Text>

      {(settings.rescued > 0) && (
        <Text style={[s.footer, { color: palette.textSoft }]}>
          You've used {settings.rescued} item{settings.rescued === 1 ? "" : "s"} before they expired.
        </Text>
      )}

      <Pressable
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          Linking.openURL("https://buymeacoffee.com/walilambere").catch(() => {});
        }}
        style={s.tip}
      >
        <Text style={[s.tipText, { color: palette.textSoft }]}>
          Made by one person. If Pekko helps you, you can{" "}
          <Text style={s.tipLink}>buy me a coffee</Text>.
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function Step({ label, onPress, palette }) {
  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); onPress(); }}
      style={[s.step, { borderColor: palette.text }]}
      accessibilityRole="button"
      accessibilityLabel={label === "+" ? "More days" : "Fewer days"}
    >
      <Text style={[s.stepText, { color: palette.text }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  content: { padding: SPACE.lg, paddingTop: SPACE.xl + 8, paddingBottom: 120 },
  h1: { fontSize: 30, fontWeight: "800", marginBottom: SPACE.sm },
  card: { borderTopWidth: 1, paddingVertical: SPACE.lg },
  cardTitle: { fontSize: 17, fontWeight: "800" },
  cardSub: { fontSize: 14, marginTop: 3, lineHeight: 19 },
  input: { borderRadius: RADIUS.md, borderWidth: 1.5, paddingHorizontal: SPACE.md, paddingVertical: 13, fontSize: 16 },
  seg: { flexDirection: "row", borderRadius: RADIUS.md, borderWidth: 1.5, overflow: "hidden" },
  segItem: { flex: 1, paddingVertical: 12, paddingHorizontal: 4, alignItems: "center" },
  segText: { fontSize: 13.5, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowLabel: { fontSize: 15.5, fontWeight: "700" },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "flex-start", gap: SPACE.lg },
  step: { width: 48, height: 48, borderRadius: RADIUS.md, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  stepText: { fontSize: 24, fontWeight: "700" },
  stepVal: { fontSize: 26, fontWeight: "800", minWidth: 40, textAlign: "center" },
  footer: { fontSize: 13.5, marginTop: SPACE.md, lineHeight: 20 },
  tip: { marginTop: SPACE.sm, paddingVertical: SPACE.sm },
  tipText: { fontSize: 13.5, lineHeight: 20 },
  tipLink: { fontWeight: "800", textDecorationLine: "underline" },
});
