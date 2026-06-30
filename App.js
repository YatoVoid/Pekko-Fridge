import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Animated, PanResponder, useWindowDimensions, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { AppProvider, useApp } from "./src/store";
import { RADIUS, SPACE } from "./src/theme";
import { FridgeIcon, CameraIcon, GearIcon } from "./src/components/icons";
import Onboarding from "./src/components/Onboarding";
import FridgeScreen from "./src/screens/FridgeScreen";
import ScannerScreen from "./src/screens/ScannerScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

const TABS = [
  { key: "fridge", label: "Fridge", Icon: FridgeIcon },
  { key: "scan", label: "Scan", Icon: CameraIcon },
  { key: "settings", label: "Settings", Icon: GearIcon },
];

function Shell() {
  const { ready, palette, settings, overlayOpen } = useApp();
  const insets = useSafeAreaInsets();
  const { width: W } = useWindowDimensions();
  const [tab, setTab] = useState(0);

  const tx = useRef(new Animated.Value(0)).current;
  const tabRef = useRef(0);
  const startRef = useRef(0);
  const overlayRef = useRef(false);
  overlayRef.current = overlayOpen; // read by the PanResponder (avoids stale closure)

  const goTo = (i) => {
    const t = Math.max(0, Math.min(TABS.length - 1, i));
    if (t !== tabRef.current) Haptics.selectionAsync().catch(() => {});
    tabRef.current = t;
    setTab(t);
    Animated.spring(tx, { toValue: -t * W, useNativeDriver: true, bounciness: 0, speed: 18 }).start();
  };

  // keep aligned if width changes (rotation)
  useEffect(() => { tx.setValue(-tabRef.current * W); }, [W]); // eslint-disable-line react-hooks/exhaustive-deps

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => !overlayRef.current && Math.abs(g.dx) > 24 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderGrant: () => { startRef.current = -tabRef.current * W; },
      onPanResponderMove: (_e, g) => {
        const nx = Math.max(-(TABS.length - 1) * W, Math.min(0, startRef.current + g.dx));
        tx.setValue(nx);
      },
      onPanResponderRelease: (_e, g) => {
        let target = tabRef.current;
        if (g.dx < -W * 0.22 || g.vx < -0.5) target = tabRef.current + 1;
        else if (g.dx > W * 0.22 || g.vx > 0.5) target = tabRef.current - 1;
        goTo(target);
      },
    })
  ).current;

  if (ready && !settings.onboarded) return <Onboarding />;

  if (!ready) {
    return (
      <View style={[styles.boot, { backgroundColor: palette.bg }]}>
        <FridgeIcon color={palette.accent} size={56} active />
        <ActivityIndicator color={palette.accent} />
      </View>
    );
  }

  const onScan = tab === 1;

  return (
    <View style={{ flex: 1, backgroundColor: onScan ? palette.surface : palette.bg }}>
      <StatusBar style={onScan || palette.mode === "dark" ? "light" : "dark"} />

      <View style={styles.pagerClip} {...pan.panHandlers}>
        <Animated.View style={[styles.pager, { width: W * TABS.length, transform: [{ translateX: tx }] }]}>
          <View style={{ width: W }}><FridgeScreen /></View>
          <View style={{ width: W }}><ScannerScreen active={tab === 1} /></View>
          <View style={{ width: W }}><SettingsScreen /></View>
        </Animated.View>
      </View>

      <View
        style={[
          styles.tabbar,
          { backgroundColor: palette.surface, borderColor: palette.line, paddingBottom: Math.max(insets.bottom, SPACE.sm) },
        ]}
      >
        {TABS.map(({ key, label, Icon }, i) => {
          const on = i === tab;
          const color = on ? palette.accent : palette.textSoft;
          return (
            <Pressable key={key} style={styles.tab} onPress={() => goTo(i)}>
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
  pagerClip: { flex: 1, overflow: "hidden" },
  pager: { flex: 1, flexDirection: "row" },
  tabbar: {
    flexDirection: "row",
    borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg, borderTopWidth: 1,
    paddingTop: SPACE.sm,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: -4 },
  },
  tab: { flex: 1, alignItems: "center", gap: 3, paddingVertical: 4 },
  tabLabel: { fontSize: 11.5, fontWeight: "700", letterSpacing: 0.3 },
});
