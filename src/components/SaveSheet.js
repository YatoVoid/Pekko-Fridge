// Post-scan sheet: shows parsed dates, photos, name + category, saves to fridge.
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Image, StyleSheet } from "react-native";
import { CATEGORIES, RADIUS, SPACE, catColors } from "../theme";
import { PrimaryButton } from "./ui";
import { CategoryIcon } from "./FoodIcons";
import { formatDate as fmt } from "../lib/expiry";
import { takePhoto, pickFromLibrary } from "../lib/photos";
import SwipeSheet from "./SwipeSheet";
import DateField from "./DateField";

export default function SaveSheet({ visible, result, palette, region, onSave, onClose }) {
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

  // other dates we spotted on the label, so the user can correct a wrong guess
  const candidates = (result?.candidates || []).filter(
    (d) => !exp || new Date(d).getTime() !== new Date(exp).getTime()
  );

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
        {CATEGORIES.map((c) => {
          const on = c.key === cat;
          const cc = catColors(c, palette.mode);
          return (
            <Pressable
              key={c.key}
              onPress={() => setCat(c.key)}
              style={[s.cat, { backgroundColor: on ? cc.tint : palette.surfaceAlt, borderColor: on ? palette.accent : "transparent" }]}
            >
              <CategoryIcon catKey={c.key} size={18} />
              <Text style={[s.catLabel, { color: on ? cc.ink : palette.text }]}>{c.label}</Text>
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
