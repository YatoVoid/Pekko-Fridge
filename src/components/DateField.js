import React, { useState } from "react";
import { View, Pressable, Text, Platform, StyleSheet } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
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

export default function DateField({ value, onChange, palette, region, style, textStyle }) {
  const [show, setShow] = useState(false);
  const current = value ? new Date(value) : new Date();

  const bump = ({ unit, n }) => {
    Haptics.selectionAsync().catch(() => {});
    const base = value ? new Date(value) : new Date();
    base.setHours(12, 0, 0, 0);
    if (unit === "d") base.setDate(base.getDate() + n);
    if (unit === "m") base.setMonth(base.getMonth() + n);
    if (unit === "y") base.setFullYear(base.getFullYear() + n);
    onChange(base);
  };

  return (
    <>
      <Pressable
        onPress={() => { Haptics.selectionAsync().catch(() => {}); setShow(true); }}
        style={({ pressed }) => [s.field, { backgroundColor: palette.surface, borderColor: palette.line, opacity: pressed ? 0.7 : 1 }, style]}
        accessibilityRole="button"
        accessibilityLabel={value ? `Expiry date ${formatDate(value, region)}. Change` : "Set expiry date"}
      >
        <Text style={[s.text, { color: value ? palette.text : palette.textSoft }, textStyle]}>
          {value ? formatDate(value, region) : "Set date"}
        </Text>
        <Text style={[s.edit, { color: palette.textSoft }]}>Change</Text>
      </Pressable>

      <View style={s.quickRow}>
        {QUICK.map((q) => (
          <Pressable
            key={q.label}
            onPress={() => bump(q)}
            style={({ pressed }) => [s.quick, { backgroundColor: palette.surface, borderColor: palette.line, opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[s.quickText, { color: palette.text }]}>{q.label}</Text>
          </Pressable>
        ))}
      </View>

      {show && (
        <DateTimePicker
          value={current}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "calendar"}
          onChange={(e, sel) => {
            setShow(false);
            if (e.type === "set" && sel) onChange(sel);
          }}
        />
      )}
    </>
  );
}

const s = StyleSheet.create({
  field: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACE.md, paddingVertical: 12,
  },
  text: { fontSize: 20, fontWeight: "800" },
  edit: { fontSize: 13.5, fontWeight: "700", textDecorationLine: "underline" },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACE.xs, marginTop: SPACE.sm },
  quick: { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 9, minWidth: 48, alignItems: "center" },
  quickText: { fontSize: 13.5, fontWeight: "700" },
});
