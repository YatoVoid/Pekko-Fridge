// Post-scan sheet: shows parsed dates, photos, name + category, saves to fridge.
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Image, StyleSheet } from "react-native";
import { RADIUS, SPACE, resolveCat, catColors } from "../theme";
import { useApp, DEFAULT_CATEGORIES } from "../store";
import { PrimaryButton } from "./ui";
import { CategoryIcon } from "./FoodIcons";
import { formatDate as fmt } from "../lib/expiry";
import { takePhoto, pickFromLibrary } from "../lib/photos";
import SwipeSheet from "./SwipeSheet";
import DateField from "./DateField";

// Generate plausible alternative dates by toggling a single 6↔8 digit in the
// day / month / year — the digit pair dot-matrix OCR most often confuses.
function swap68(date) {
  if (!date) return [];
  const dt = new Date(date);
  if (Number.isNaN(dt.getTime())) return [];
  const y = dt.getFullYear(), m = dt.getMonth() + 1, d = dt.getDate();
  const now = Date.now();
  const MIN = now - 3 * 365 * 864e5;
  const MAX = now + 8 * 365 * 864e5;
  const toggles = (n) => {
    const s = String(n);
    const out = [];
    for (let i = 0; i < s.length; i++) {
      if (s[i] === "6" || s[i] === "8") out.push(Number(s.slice(0, i) + (s[i] === "6" ? "8" : "6") + s.slice(i + 1)));
    }
    return out;
  };
  const seen = new Set();
  const res = [];
  const tryDate = (yy, mm, dd) => {
    const nd = new Date(yy, mm - 1, dd);
    if (nd.getFullYear() === yy && nd.getMonth() === mm - 1 && nd.getDate() === dd
      && nd.getTime() >= MIN && nd.getTime() <= MAX && !seen.has(nd.getTime())) {
      seen.add(nd.getTime());
      res.push(nd);
    }
  };
  toggles(d).forEach((dd) => tryDate(y, m, dd));
  toggles(m).forEach((mm) => tryDate(y, mm, d));
  toggles(y).forEach((yy) => tryDate(yy, m, d));
  return res;
}

export default function SaveSheet({ visible, result, palette, region, onSave, onClose }) {
  const { settings } = useApp();
  const folderCats = (settings.categories || DEFAULT_CATEGORIES).filter((c) => !c.hidden);
  const [name, setName] = useState("");
  const [cat, setCat] = useState("other");
  const [photos, setPhotos] = useState([]);
  const [exp, setExp] = useState(null); // chosen expiry (editable via candidate chips)

  useEffect(() => {
    if (visible) {
      setName(result?.guessName || "");
      setCat("other");
      setPhotos(result?.photo ? [result.photo] : []);
      setExp(result?.exp || null);
    }
  }, [visible, result]);

  const addPhoto = async (fromLibrary) => {
    const uri = await (fromLibrary ? pickFromLibrary() : takePhoto());
    if (uri) setPhotos((p) => [...p, uri]);
  };

  // Correction chips: other dates spotted on the label, plus 6↔8 variants of the
  // chosen date (dot-matrix OCR often confuses 6 and 8).
  const candidates = React.useMemo(() => {
    const out = new Map();
    const add = (d) => {
      if (!d) return;
      const t = new Date(d).getTime();
      if (!Number.isNaN(t) && (!exp || t !== new Date(exp).getTime())) out.set(t, new Date(t));
    };
    (result?.candidates || []).forEach(add);
    swap68(exp).forEach(add);
    return [...out.values()].sort((a, b) => a - b);
  }, [result, exp]);

  return (
    <SwipeSheet visible={visible} onClose={onClose} palette={palette}>
      <Text style={[s.title, { color: palette.text }]}>Got it</Text>

      <Text style={[s.field, { color: palette.textSoft }]}>Expires</Text>
      <DateField value={exp} onChange={setExp} palette={palette} region={region} />
      {result?.mfg ? (
        <Text style={[s.madeNote, { color: palette.textSoft }]}>Made {fmt(result.mfg, region)}</Text>
      ) : null}

      {candidates.length > 0 && (
        <>
          <Text style={[s.field, { color: palette.textSoft }]}>Wrong date? Tap the right one</Text>
          <View style={s.cands}>
            {candidates.map((d, i) => (
              <Pressable key={i} onPress={() => setExp(d)} style={[s.cand, { backgroundColor: palette.surfaceAlt, borderColor: palette.line }]}>
                <Text style={[s.candText, { color: palette.text }]}>{fmt(d, region)}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <Text style={[s.field, { color: palette.textSoft }]}>Photos</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.strip}>
        {photos.map((uri, i) => (
          <View key={i} style={s.photoWrap}>
            <Image source={{ uri }} style={s.photo} />
            <Pressable onPress={() => setPhotos((p) => p.filter((_, j) => j !== i))} style={[s.del, { backgroundColor: palette.surface }]}>
              <Text style={[s.delX, { color: palette.text }]}>×</Text>
            </Pressable>
          </View>
        ))}
        <Pressable onPress={() => addPhoto(false)} onLongPress={() => addPhoto(true)} style={[s.addTile, { borderColor: palette.line }]}>
          <Text style={[s.addPlus, { color: palette.textSoft }]}>＋</Text>
          <Text style={[s.addLabel, { color: palette.textSoft }]}>Add</Text>
        </Pressable>
      </ScrollView>
      <Text style={[s.hint, { color: palette.textSoft }]}>Tap to take a photo · hold to pick from library</Text>

      <Text style={[s.field, { color: palette.textSoft }]}>Name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="What is it?"
        placeholderTextColor={palette.textSoft}
        style={[s.input, { color: palette.text, backgroundColor: palette.surfaceAlt, borderColor: palette.line }]}
      />

      <Text style={[s.field, { color: palette.textSoft }]}>Folder</Text>
      <View style={s.cats}>
        {folderCats.map((c) => {
          const on = c.key === cat;
          const rc = resolveCat(c.key, settings.categories);
          const cc = catColors(rc, palette.mode);
          return (
            <Pressable
              key={c.key}
              onPress={() => setCat(c.key)}
              style={[s.cat, { backgroundColor: on ? cc.tint : palette.surfaceAlt, borderColor: on ? palette.accent : "transparent" }]}
            >
              <CategoryIcon catKey={rc.icon || c.key} size={18} />
              <Text style={[s.catLabel, { color: on ? cc.ink : palette.text }]}>{rc.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ height: SPACE.lg }} />
      <PrimaryButton
        label="Save to Fridge"
        palette={palette}
        disabled={!name.trim()}
        onPress={() => onSave({ name: name.trim(), category: cat, exp, mfg: result?.mfg || null, photos })}
      />
    </SwipeSheet>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "900", marginBottom: SPACE.md },
  dates: { borderRadius: RADIUS.md, padding: SPACE.md, gap: 6, marginBottom: SPACE.md },
  dateRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  dateLabel: { fontSize: 13, fontWeight: "700" },
  dateBig: { fontSize: 22, fontWeight: "900", letterSpacing: 0.5 },
  dateSmall: { fontSize: 15, fontWeight: "600" },
  madeNote: { fontSize: 13, fontWeight: "600", marginTop: 6 },
  cands: { flexDirection: "row", flexWrap: "wrap", gap: SPACE.sm, marginBottom: SPACE.sm, marginTop: 6 },
  cand: { borderWidth: 1, borderRadius: RADIUS.pill, paddingHorizontal: 14, paddingVertical: 9 },
  candText: { fontSize: 14, fontWeight: "700" },
  field: { fontSize: 12, fontWeight: "800", letterSpacing: 1, marginBottom: 6, marginTop: 4 },
  strip: { gap: SPACE.sm, paddingVertical: 2 },
  photoWrap: { position: "relative" },
  photo: { width: 76, height: 76, borderRadius: RADIUS.md },
  del: { position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 3 },
  delX: { fontSize: 16, fontWeight: "800", lineHeight: 18 },
  addTile: { width: 76, height: 76, borderRadius: RADIUS.md, borderWidth: 1.5, borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  addPlus: { fontSize: 22, fontWeight: "700" },
  addLabel: { fontSize: 11, fontWeight: "700" },
  hint: { fontSize: 11.5, marginTop: 6, marginBottom: SPACE.sm },
  input: { borderRadius: RADIUS.md, borderWidth: 1, paddingHorizontal: SPACE.md, paddingVertical: 13, fontSize: 16, marginBottom: SPACE.md },
  cats: { flexDirection: "row", flexWrap: "wrap", gap: SPACE.sm },
  cat: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 2, borderRadius: RADIUS.pill, paddingHorizontal: 13, paddingVertical: 9 },
  catLabel: { fontSize: 13.5, fontWeight: "700" },
});
