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
import { recognizeText, ocrAvailable } from "../lib/ocr";
import { cropToRect, boxToPhotoRect } from "../lib/crop";
import { parseLabel } from "../lib/dateParser";

const STEADY_MS = 900;     // hold-still time before an OCR attempt
const STEADY_DELTA = 0.06; // accelerometer "still" threshold (g) — lenient for shaky hands
const MOTION_DELTA = 0.13; // movement that re-arms auto-capture (a fresh aim)
const COOLDOWN_MS = 1500;  // min gap between auto attempts

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const R = 34;
const CIRC = 2 * Math.PI * R;

function Ring({ progress, color }) {
  const offset = progress.interpolate({ inputRange: [0, 1], outputRange: [CIRC, 0], extrapolate: "clamp" });
  return (
    <Svg width={84} height={84} style={{ transform: [{ rotate: "-90deg" }] }}>
      <Circle cx={42} cy={42} r={R} stroke="rgba(255,255,255,0.25)" strokeWidth={5} fill="none" />
      <AnimatedCircle cx={42} cy={42} r={R} stroke={color} strokeWidth={5} fill="none" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={offset} />
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
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [dbg, setDbg] = useState("");

  const camRef = useRef(null);
  const progress = useRef(new Animated.Value(0)).current;
  const wander = useRef(new Animated.Value(0)).current;
  const snug = useRef(new Animated.Value(1)).current;
  const fillRef = useRef(null);
  const prevRef = useRef(null);
  const fillingRef = useRef(false);
  const busyRef = useRef(false);
  const cooldownRef = useRef(0);
  const unsteadyRef = useRef(0);
  const lockRef = useRef(false);
  const armedRef = useRef(true); // only auto-capture after a fresh aim (move → settle)

  const resume = useCallback(() => {
    lockRef.current = false;
    busyRef.current = false;
    cooldownRef.current = 0;
    armedRef.current = true;
    setSheet(false);
    setResult(null);
    setNotice("");
    setLocked(false);
  }, []);

  const flash = useCallback((msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 1600);
  }, []);

  const attempt = useCallback(async (force = false) => {
    if (lockRef.current || busyRef.current) return;
    busyRef.current = true;
    armedRef.current = false; // used this aim; needs fresh motion to auto-fire again
    fillingRef.current = false;
    fillRef.current?.stop();
    let photo = null, ocrUri = null;
    try {
      const pic = await camRef.current?.takePictureAsync({ quality: 1 });
      photo = pic?.uri || null;
      // a bit looser than the visible box so a date next to other text isn't clipped
      const rect = boxToPhotoRect(pic?.width, pic?.height, size.w, size.h, 0.9, 0.46);
      ocrUri = rect && photo ? await cropToRect(photo, rect) : photo;
    } catch { /* ignore */ }

    let text = ocrAvailable ? await recognizeText(ocrUri || photo) : readFrame();
    let parsed = parseLabel(text || "", settings.region);
    // fallback: if the tight crop found no date, try the whole frame
    if (ocrAvailable && !parsed.exp && photo && ocrUri !== photo) {
      const full = await recognizeText(photo);
      const fullParsed = parseLabel(full || "", settings.region);
      if (fullParsed.exp) { text = full; parsed = fullParsed; }
    }
    if (ocrAvailable) setDbg(text ? text.replace(/\s+/g, " ").slice(0, 80) : "(no text)");

    if (!parsed.exp && !force) {
      busyRef.current = false;
      cooldownRef.current = Date.now() + COOLDOWN_MS;
      progress.setValue(0);
      setPhase("search");
      flash(ocrAvailable ? "No date found — move closer, then hold steady" : "Scanning…");
      return;
    }

    lockRef.current = true;
    setLocked(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setResult({ ...parsed, photo });
    setSheet(true);
  }, [settings.region, progress, flash, size.w, size.h]);

  const cancelFill = useCallback(() => {
    fillingRef.current = false;
    fillRef.current?.stop();
    setPhase("search");
    Animated.timing(progress, { toValue: 0, duration: 200, useNativeDriver: false }).start();
    Animated.spring(snug, { toValue: 1, useNativeDriver: true, bounciness: 6 }).start();
  }, [progress, snug]);

  const startFill = useCallback(() => {
    fillingRef.current = true;
    setPhase("steady");
    progress.setValue(0);
    Animated.spring(snug, { toValue: 0.86, useNativeDriver: true, bounciness: 8 }).start();
    fillRef.current = Animated.timing(progress, { toValue: 1, duration: STEADY_MS, useNativeDriver: false });
    fillRef.current.start(({ finished }) => { if (finished) attempt(false); });
  }, [progress, snug, attempt]);

  useEffect(() => {
    if (!(active && perm?.granted) || sheet || locked) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(wander, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(wander, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, perm?.granted, sheet, locked, wander]);

  useEffect(() => {
    if (!(active && perm?.granted) || sheet || locked) return;
    prevRef.current = null;
    unsteadyRef.current = 0;
    fillingRef.current = false;
    busyRef.current = false;
    progress.setValue(0);
    setPhase("search");
    Accelerometer.setUpdateInterval(80);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const prev = prevRef.current;
      prevRef.current = { x, y, z };
      if (!prev) return;
      const delta = Math.abs(x - prev.x) + Math.abs(y - prev.y) + Math.abs(z - prev.z);
      if (delta > MOTION_DELTA) armedRef.current = true;
      if (delta < STEADY_DELTA) {
        unsteadyRef.current = 0;
        if (armedRef.current && !fillingRef.current && !busyRef.current && Date.now() >= cooldownRef.current) startFill();
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
        <View style={{ width: "82%" }}>
          <PrimaryButton label="Allow camera" palette={palette} onPress={requestPerm} />
        </View>
      </View>
    );
  }

  const ringColor = phase === "steady" ? "#9BE7B8" : "#FFFFFF";
  const hud = notice || (locked ? "Captured" : phase === "steady" ? "Reading…" : "Point at the date label");
  const driftX = wander.interpolate({ inputRange: [0, 1], outputRange: [-12, 12] });
  const driftY = wander.interpolate({ inputRange: [0, 1], outputRange: [8, -8] });

  return (
    <View
      style={st.root}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setSize((sz) => (sz.w === width && sz.h === height ? sz : { w: width, h: height }));
      }}
    >
      {active && !locked && size.h > 0 ? (
        <CameraView ref={camRef} style={{ width: size.w, height: size.h }} facing="back" autofocus="on" />
      ) : (
        <View style={st.camera} />
      )}

      <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, width: size.w, height: size.h, alignItems: "center", justifyContent: "center" }}>
        <Animated.View style={[st.frame, { borderColor: ringColor, transform: [{ translateX: driftX }, { translateY: driftY }, { scale: snug }] }]}>
          {["tl", "tr", "bl", "br"].map((k) => (
            <View key={k} style={[st.corner, st[k], { borderColor: ringColor }]} />
          ))}
          <View style={st.ring}><Ring progress={progress} color={ringColor} /></View>
        </Animated.View>
      </View>

      <View pointerEvents="none" style={st.hud}>
        <Text style={st.hudText}>{hud}</Text>
      </View>

      {!!dbg && (
        <View pointerEvents="none" style={st.dbg}>
          <Text style={st.dbgText} numberOfLines={3}>OCR: {dbg}</Text>
        </View>
      )}

      {!locked && (
        <View style={st.controls}>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}); attempt(true); }}
            style={({ pressed }) => [st.shutter, { opacity: pressed ? 0.7 : 1 }]}
          >
            <View style={st.shutterInner} />
          </Pressable>
          <Text style={st.shutterHint}>Tap to capture — or aim and hold steady over the date</Text>
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

const C = 28;
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: SPACE.xl },
  permTitle: { fontSize: 24, fontWeight: "900" },
  permBody: { fontSize: 15, textAlign: "center", marginTop: SPACE.sm, lineHeight: 22 },
  frame: { width: "80%", height: "30%", borderWidth: 1.5, borderRadius: RADIUS.md, borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  ring: { opacity: 0.95 },
  corner: { position: "absolute", width: C, height: C },
  tl: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: RADIUS.md },
  tr: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: RADIUS.md },
  bl: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: RADIUS.md },
  br: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: RADIUS.md },
  hud: { position: "absolute", top: Platform.OS === "ios" ? 64 : 44, left: 0, right: 0, alignItems: "center" },
  hudText: { color: "#fff", fontSize: 17, fontWeight: "800", backgroundColor: "rgba(0,0,0,0.45)", paddingHorizontal: 18, paddingVertical: 10, borderRadius: RADIUS.pill, overflow: "hidden" },
  dbg: { position: "absolute", bottom: 210, left: 16, right: 16, alignItems: "center" },
  dbgText: { color: "#fff", fontSize: 12, fontWeight: "600", backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, overflow: "hidden", textAlign: "center" },
  controls: { position: "absolute", bottom: 44, left: 0, right: 0, alignItems: "center", gap: SPACE.md },
  shutter: { width: 88, height: 88, borderRadius: 999, borderWidth: 6, borderColor: "rgba(255,255,255,0.95)", alignItems: "center", justifyContent: "center" },
  shutterInner: { width: 68, height: 68, borderRadius: 999, backgroundColor: "#fff" },
  shutterHint: { color: "#fff", fontSize: 14.5, fontWeight: "700", paddingHorizontal: SPACE.lg, textAlign: "center" },
});
