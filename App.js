import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Animated, PanResponder, useWindowDimensions, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { useFonts } from "expo-font";
import { AppProvider, useApp } from "./src/store";
import { SPACE } from "./src/theme";
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
  overlayRef.current = overlayOpen;

  const goTo = (i) => {
    const t = Math.max(0, Math.min(TABS.length - 1, i));
    if (t !== tabRef.current) Haptics.selectionAsync().catch(() => {});
    tabRef.current = t;
    setTab(t);
    Animated.spring(tx, { toValue: -t * W, useNativeDriver: true, bounciness: 0, speed: 18 }).start();
  };

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
        <FridgeIcon color={palette.text} size={56} active />
        <ActivityIndicator color={palette.textSoft} />
      </View>
    );
  }

  const onScan = tab === 1;

  return (
    <View style={{ flex: 1, backgroundColor: onScan ? palette.surface : palette.bg }}>
      <StatusBar style={onScan || palette.mode === "dark" ? "light" : "dark"} />

      <View style={styles.pagerClip} {...pan.panHandlers}>
        <Animated.View style={[styles.pager, { width: W * TABS.length, transform: [{ translateX: tx }] }]}>
          <View style={{ width: W }}><FridgeScreen active={tab === 0} /></View>
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
          const color = on ? palette.text : palette.textSoft;
          return (
            <Pressable
              key={key}
              style={styles.tab}
              onPress={() => goTo(i)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
            >
              <View style={[styles.tabMark, { backgroundColor: on ? palette.text : "transparent" }]} />
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
  const [fontsLoaded] = useFonts({ "Kalam-Bold": require("./assets/fonts/Kalam-Bold.ttf") });
  if (!fontsLoaded) return null;
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
  tabbar: { flexDirection: "row", borderTopWidth: 1 },
  tab: { flex: 1, alignItems: "center", gap: 3, paddingBottom: 4, minHeight: 56 },
  tabMark: { width: 28, height: 3, marginBottom: SPACE.xs },
  tabLabel: { fontSize: 12, fontWeight: "700" },
});
