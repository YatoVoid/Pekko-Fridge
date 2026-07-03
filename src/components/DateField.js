// Pure-JS date control (no native picker). Quick relative chips (+7d ... +1y)
// make far-future expiries one tap; tapping the field opens inline Day/Month/Year
// number boxes (ordered by region) for an exact date. No native module, so it
// can never fail to load on a device.
import React, { useState } from "react";
import { View, Pressable, Text, TextInput, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { RADIUS, SPACE } from "../theme";
import { formatDate } from "../lib/expiry";

const QUICK = [
  { label: "+7d", unit: "d", n: 7 },
  { label: "+1m", unit: "m", n: 1 },
  { label: "+3m", unit: "m", n: 3 },
  { label: "+6m", unit: "m", n: 6 },
  { label: "+1y", unit: "y", n: 1 },
];

const daysInMonth = (y, m) => new Date(y, m, 0).getDate(); // m is 1-based

export default function DateField({ value, onChange, palette, region = "DMY", style, textStyle }) {
  const [open, setOpen] = useState(false);
  const [d, setD] = useState("");
  const [m, setM] = useState("");
  const [y, setY] = useState("");

  const syncFrom = (dt) => { setD(String(dt.getDate())); setM(String(dt.getMonth() + 1)); setY(String(dt.getFullYear())); };

  const bump = ({ unit, n }) => {
    Haptics.selectionAsync().catch(() => {});
    const dt = value ? new Date(value) : new Date();
    dt.setHours(12, 0, 0, 0);
    if (unit === "d") dt.setDate(dt.getDate() + n);
    if (unit === "m") dt.setMonth(dt.getMonth() + n);
    if (unit === "y") dt.setFullYear(dt.getFullYear() + n);
    onChange(dt);
    if (open) syncFrom(dt);
  };

  const openEditor = () => {
    Haptics.selectionAsync().catch(() => {});
    syncFrom(value ? new Date(value) : new Date());
    setOpen(true);
  };

  // Build a valid date from whatever's typed so far; commit only when all three parse.
  const commit = (dv, mv, yv) => {
    const dd = parseInt(dv, 10);
    const mm = parseInt(mv, 10);
    const yy0 = parseInt(yv, 10);
    if (!dd || !mm || !yy0) return;
    const yy = yy0 < 100 ? 2000 + yy0 : yy0;
    const mClamp = Math.max(1, Math.min(12, mm));
    const dClamp = Math.max(1, Math.min(daysInMonth(yy, mClamp), dd));
    onChange(new Date(yy, mClamp - 1, dClamp, 12, 0, 0, 0));
  };
  const onD = (t) => { const v = t.replace(/[^0-9]/g, "").slice(0, 2); setD(v); commit(v, m, y); };
  const onM = (t) => { const v = t.replace(/[^0-9]/g, "").slice(0, 2); setM(v); commit(d, v, y); };
  const onY = (t) => { const v = t.replace(/[^0-9]/g, "").slice(0, 4); setY(v); commit(d, m, v); };

  const box = (key) => {
    const cfg = {
      d: { val: d, on: onD, ph: "DD", w: 52 },
      m: { val: m, on: onM, ph: "MM", w: 52 },
      y: { val: y, on: onY, ph: "YYYY", w: 74 },
    }[key];
    return (
      <TextInput
        key={key}
        value={cfg.val}
        onChangeText={cfg.on}
        keyboardType="number-pad"
        placeholder={cfg.ph}
        placeholderTextColor={palette.textSoft}
        maxLength={key === "y" ? 4 : 2}
        style={[s.box, { width: cfg.w, color: palette.text, borderColor: palette.line, backgroundColor: palette.surfaceAlt }]}
      />
    );
  };
  const order = region === "YMD" ? ["y", "m", "d"] : region === "MDY" ? ["m", "d", "y"] : ["d", "m", "y"];

  return (
    <>
      <Pressable
        onPress={openEditor}
        style={({ pressed }) => [s.field, { backgroundColor: palette.surfaceAlt, borderColor: palette.line, opacity: pressed ? 0.7 : 1 }, style]}
      >
        <Text style={[s.text, { color: value ? palette.text : palette.textSoft }, textStyle]}>
          {value ? formatDate(value, region) : "Set date"}
        </Text>
        <Text style={[s.edit, { color: palette.accent }]}>{open ? "Done" : "Edit"}</Text>
      </Pressable>

      {open && (
        <View style={s.editor}>
          {order.map((k) => box(k))}
          <Pressable onPress={() => setOpen(false)} style={[s.done, { backgroundColor: palette.accent }]}>
            <Text style={[s.doneText, { color: palette.accentInk }]}>Done</Text>
          </Pressable>
        </View>
      )}

      <View style={s.quickRow}>
        {QUICK.map((q) => (
          <Pressable
            key={q.label}
            onPress={() => bump(q)}
            style={({ pressed }) => [s.quick, { backgroundColor: palette.surface, borderColor: palette.line, opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[s.quickText, { color: palette.accent }]}>{q.label}</Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}

const s = StyleSheet.create({
  field: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACE.md, paddingVertical: 12,
  },
  text: { fontSize: 20, fontWeight: "900", letterSpacing: 0.4 },
  edit: { fontSize: 13, fontWeight: "800" },
  editor: { flexDirection: "row", alignItems: "center", gap: SPACE.sm, marginTop: SPACE.sm },
  box: { borderWidth: 1, borderRadius: RADIUS.sm, paddingHorizontal: SPACE.sm, paddingVertical: 10, fontSize: 18, fontWeight: "800", textAlign: "center" },
  done: { marginLeft: "auto", borderRadius: RADIUS.md, paddingHorizontal: SPACE.md, paddingVertical: 10 },
  doneText: { fontSize: 14, fontWeight: "800" },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACE.xs, marginTop: SPACE.sm },
  quick: { borderWidth: 1, borderRadius: RADIUS.pill, paddingHorizontal: 12, paddingVertical: 7 },
  quickText: { fontSize: 13, fontWeight: "800" },
});
