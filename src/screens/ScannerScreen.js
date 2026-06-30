import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, Pressable, Animated, Easing, StyleSheet, Platform } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Accelerometer } from "expo-sensors";
import Svg, { Circle } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { useApp } from "../store";
import { RADIUS, SPACE } from "../theme";
import { PrimaryButton } from "../components/ui";
import { CameraIcon } from "../components/icons";
import SaveSheet from "../components/SaveSheet";
import { readFrame } from "../lib/vision";
import { recognizeText } from "../lib/ocr";
import { parseLabel } from "../lib/dateParser";

const STEADY_MS = 1200;
// ponytail: accelerometer delta (g) that counts as "still". Tune per device —
// phones with noisier IMUs may need a touch more. Real motion blows past this.
const STEADY_DELTA = 0.05;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const R = 30;
const CIRC = 2 * Math.PI * R;

function Ring({ progress, color }) {
  const offset = progress.interpolate({ inputRange: [0, 1], outputRange: [CIRC, 0], extrapolate: "clamp" });
  return (
    <Svg width={76} height={76} style={{ transform: [{ rotate: "-90deg" }] }}>
      <Circle cx={38} cy={38} r={R} stroke="rgba(255,255,255,0.25)" strokeWidth={5} fill="none" />
      <AnimatedCircle
        cx={38} cy={38} r={R} stroke={color} strokeWidth={5} fill="none"
        strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={offset}
      />
    </Svg>
  );
}

export default function ScannerScreen({ active }) {
  const { palette, settings, addItem } = useApp();
  const [perm, requestPerm] = useCameraPermissions();
  const [locked, setLocked] = useState(false);
  const [phase, setPhase] = useState("search"); // search | steady
  const [result, setResult] = useState(null);
  const [sheet, setSheet] = useState(false);
  const [notice, setNotice] = useState("");

  const camRef = useRef(null);
  const progress = useRef(new Animated.Value(0)).current;
  const wander = useRef(new Animated.Value(0)).current; // focal drift while hunting
  const snug = useRef(new Animated.Value(1)).current;   // box tightens when locking on
  const fillRef = useRef(null);
  const prevRef = useRef(null);
  const fillingRef = useRef(false);
  const unsteadyRef = useRef(0);
  const lockRef = useRef(false);

  const resume = useCallback(() => {
    lockRef.current = false;
    setSheet(false);
    setResult(null);
    setLocked(false); // remounts camera + re-arms the steadiness effect
  }, []);

  const cancelFill = useCallback(() => {
    fillingRef.current = false;
    fillRef.current?.stop();
    setPhase("search");
    Animated.timing(progress, { toValue: 0, duration: 200, useNativeDriver: false }).start();
    Animated.spring(snug, { toValue: 1, useNativeDriver: true, bounciness: 6 }).start();
  }, [progress, snug]);

  const snap = useCallback(async () => {
    if (lockRef.current) return;       // exactly one snap per steady lock
    lockRef.current = true;
    fillingRef.current = false;
    fillRef.current?.stop();
    setLocked(true);                   // unmounts CameraView → feed pauses
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    let photo = null;
    try {
      const pic = await camRef.current?.takePictureAsync({ quality: 0.6, skipProcessing: true });
      photo = pic?.uri || null;
    } catch { /* preview-only is fine */ }
    // Real OCR on the captured photo when available (dev build); otherwise the
    // local simulator produces label text so Expo Go still demos end-to-end.
    const real = await recognizeText(photo);
    const text = real ?? readFrame();
    const parsed = parseLabel(text, settings.region);
    // With real OCR, a blank/unreadable frame yields no date — let the user retry
    // instead of saving an empty item. (Simulator always returns a date.)
    if (real && !parsed.exp) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      setNotice("Couldn't read a date — try again");
      setTimeout(() => setNotice(""), 2200);
      resume();
      return;
    }
    setResult({ ...parsed, photo });
    setSheet(true);
  }, [settings.region, progress, resume]);

  const startFill = useCallback(() => {
    fillingRef.current = true;
    setPhase("steady");
    progress.setValue(0);
    Animated.spring(snug, { toValue: 0.8, useNativeDriver: true, bounciness: 8 }).start(); // lock onto target
    fillRef.current = Animated.timing(progress, { toValue: 1, duration: STEADY_MS, useNativeDriver: false });
    fillRef.current.start(({ finished }) => { if (finished) snap(); });
  }, [progress, snap, snug]);

  // Gentle focal drift while hunting for the label — the box "looks around".
  useEffect(() => {
    if (!(active && perm?.granted) || sheet || locked) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(wander, { toValue: 1, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(wander, { toValue: 0, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, perm?.granted, sheet, locked, wander]);

  // Real steadiness gate: hold the phone still → ring fills → snap. Motion resets.
  useEffect(() => {
    if (!(active && perm?.granted) || sheet || locked) return;
    prevRef.current = null;
    unsteadyRef.current = 0;
    fillingRef.current = false;
    progress.setValue(0);
    setPhase("search");
    Accelerometer.setUpdateInterval(80);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const prev = prevRef.current;
      prevRef.current = { x, y, z };
      if (!prev) return;
      const delta = Math.abs(x - prev.x) + Math.abs(y - prev.y) + Math.abs(z - prev.z);
      if (delta < STEADY_DELTA) {
        unsteadyRef.current = 0;
        if (!fillingRef.current) startFill();
      } else {
        unsteadyRef.current += 1;
        if (unsteadyRef.current >= 2 && fillingRef.current) cancelFill();
      }
    });
    return () => { sub.remove(); fillRef.current?.stop(); };
  }, [active, perm?.granted, sheet, locked, startFill, cancelFill, progress]);

  if (!perm) return <View style={{ flex: 1, backgroundColor: "#000" }} />;

  if (!perm.granted) {
    return (
      <View style={[st.center, { backgroundColor: palette.bg }]}>
        <View style={{ marginBottom: SPACE.md }}><CameraIcon color={palette.accent} size={48} active /></View>
        <Text style={[st.permTitle, { color: palette.text }]}>Camera, please</Text>
        <Text style={[st.permBody, { color: palette.textSoft }]}>
          Pekko needs the camera to read expiry labels. Photos stay on your phone — always.
        </Text>
        <View style={{ height: SPACE.lg }} />
        <PrimaryButton label="Allow camera" palette={palette} onPress={requestPerm} />
      </View>
    );
  }

  const ringColor = phase === "steady" ? "#9BE7B8" : "#FFFFFF";
  const hud = notice || (locked ? "Captured" : phase === "steady" ? "Hold steady…" : "Point at the date label");
  const driftX = wander.interpolate({ inputRange: [0, 1], outputRange: [-14, 14] });
  const driftY = wander.interpolate({ inputRange: [0, 1], outputRange: [10, -10] });

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {active && !locked && <CameraView ref={camRef} style={StyleSheet.absoluteFill} />}

      <View pointerEvents="none" style={st.frameWrap}>
        <Animated.View
          style={[st.frame, { borderColor: ringColor, transform: [{ translateX: driftX }, { translateY: driftY }, { scale: snug }] }]}
        >
          {["tl", "tr", "bl", "br"].map((k) => (
            <View key={k} style={[st.corner, st[k], { borderColor: ringColor }]} />
          ))}
          <View style={st.ring}><Ring progress={progress} color={ringColor} /></View>
        </Animated.View>
      </View>

      <View pointerEvents="none" style={st.hud}>
        <Text style={st.hudText}>{hud}</Text>
      </View>

      {!locked && (
        <View style={st.controls}>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}); snap(); }}
            style={st.shutter}
          >
            <View style={st.shutterInner} />
          </Pressable>
          <Text style={st.shutterHint}>Hold still to auto-scan · tap to snap now</Text>
        </View>
      )}

      <SaveSheet
        visible={sheet}
        result={result}
        palette={palette}
        region={settings.region}
        onClose={resume}
        onSave={async (item) => {
          await addItem(item);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          resume();
        }}
      />
    </View>
  );
}

const C = 26;
const st = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: SPACE.xl },
  permTitle: { fontSize: 24, fontWeight: "900" },
  permBody: { fontSize: 15, textAlign: "center", marginTop: SPACE.sm, lineHeight: 22 },
  frameWrap: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  frame: { width: "80%", height: "34%", borderWidth: 1.5, borderRadius: RADIUS.md, borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  ring: { opacity: 0.95 },
  corner: { position: "absolute", width: C, height: C },
  tl: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: RADIUS.md },
  tr: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: RADIUS.md },
  bl: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: RADIUS.md },
  br: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: RADIUS.md },
  hud: { position: "absolute", top: Platform.OS === "ios" ? 64 : 40, left: 0, right: 0, alignItems: "center" },
  hudText: {
    color: "#fff", fontSize: 15, fontWeight: "700", backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.pill, overflow: "hidden",
  },
  controls: { position: "absolute", bottom: 40, left: 0, right: 0, alignItems: "center", gap: SPACE.sm },
  shutter: { width: 74, height: 74, borderRadius: 999, borderWidth: 5, borderColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center" },
  shutterInner: { width: 56, height: 56, borderRadius: 999, backgroundColor: "#fff" },
  shutterHint: { color: "rgba(255,255,255,0.85)", fontSize: 12.5, fontWeight: "600" },
});
