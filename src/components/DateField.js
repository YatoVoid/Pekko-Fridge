// Tap-to-edit date control backed by the native picker (calendar on Android,
// wheel on iOS) — familiar and accessible for any age.
import React, { useState } from "react";
import { Pressable, Text, Platform, StyleSheet } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { RADIUS, SPACE } from "../theme";
import { formatDate } from "../lib/expiry";

export default function DateField({ value, onChange, palette, region, style, textStyle }) {
  const [show, setShow] = useState(false);
  const current = value ? new Date(value) : new Date();

  return (
    <>
      <Pressable
        onPress={() => { Haptics.selectionAsync().catch(() => {}); setShow(true); }}
        style={({ pressed }) => [s.field, { backgroundColor: palette.surfaceAlt, borderColor: palette.line, opacity: pressed ? 0.7 : 1 }, style]}
      >
        <Text style={[s.text, { color: value ? palette.text : palette.textSoft }, textStyle]}>
          {value ? formatDate(value, region) : "Set date"}
        </Text>
        <Text style={[s.edit, { color: palette.accent }]}>Edit</Text>
      </Pressable>

      {show && (
        <DateTimePicker
          value={current}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
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
  text: { fontSize: 20, fontWeight: "900", letterSpacing: 0.4 },
  edit: { fontSize: 13, fontWeight: "800" },
});
