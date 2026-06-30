import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { AppProvider, useApp } from "./src/store";
import { RADIUS, SPACE } from "./src/theme";
import { FridgeIcon, CameraIcon, GearIcon } from "./src/components/icons";
import FridgeScreen from "./src/screens/FridgeScreen";
import ScannerScreen from "./src/screens/ScannerScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

const TABS = [
  { key: "fridge", label: "Fridge", Icon: FridgeIcon },
  { key: "scan", label: "Scan", Icon: CameraIcon },
  { key: "settings", label: "Settings", Icon: GearIcon },
];

function Shell() {
  const { ready, palette } = useApp();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState("fridge");

  if (!ready) {
    return (
      <View style={[styles.boot, { backgroundColor: palette.bg }]}>
        <FridgeIcon color={palette.accent} size={56} active />
        <ActivityIndicator color={palette.accent} />
      </View>
    );
  }

  const onScan = tab === "scan";

  return (
    <View style={{ flex: 1, backgroundColor: onScan ? "#000" : palette.bg }}>
      <StatusBar style={onScan || palette.mode === "dark" ? "light" : "dark"} />

      <View style={{ flex: 1 }}>
        {tab === "fridge" && <FridgeScreen />}
        {tab === "scan" && <ScannerScreen active />}
        {tab === "settings" && <SettingsScreen />}
      </View>

      <View
        style={[
          styles.tabbar,
          { backgroundColor: palette.surface, borderColor: palette.line, paddingBottom: Math.max(insets.bottom, SPACE.sm) },
        ]}
      >
        {TABS.map(({ key, label, Icon }) => {
          const on = key === tab;
          const color = on ? palette.accent : palette.textSoft;
          return (
            <Pressable
              key={key}
              style={styles.tab}
              onPress={() => { Haptics.selectionAsync().catch(() => {}); setTab(key); }}
            >
              <Icon color={color} active={on} />
              <Text style={[styles.tabLabel, { color }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Shell />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: "center", justifyContent: "center", gap: SPACE.md },
  tabbar: {
    flexDirection: "row",
    borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg, borderTopWidth: 1,
    paddingTop: SPACE.sm,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: -4 },
  },
  tab: { flex: 1, alignItems: "center", gap: 3, paddingVertical: 4 },
  tabLabel: { fontSize: 11.5, fontWeight: "700", letterSpacing: 0.3 },
});
