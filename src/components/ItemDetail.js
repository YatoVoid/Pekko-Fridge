// Full info for one item: photos + editable name & expiry + remove.
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Image, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { RADIUS, SPACE, resolveCat, catColors } from "../theme";
import { useApp } from "../store";
import { CategoryIcon } from "./FoodIcons";
import { ExpiryBadge } from "./ui";
import { formatDate } from "../lib/expiry";
import { takePhoto, pickFromLibrary } from "../lib/photos";
import { photosOf } from "./Fridge";
import SwipeSheet from "./SwipeSheet";
import DateField from "./DateField";

export default function ItemDetail({ item, palette, region, onClose, onUpdate, onRemove }) {
  const { settings } = useApp();
  const [editingName, setEditingName] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setEditingName(false);
    setDraft(item?.name || "");
  }, [item?.id]);

  if (!item) return <SwipeSheet visible={false} onClose={onClose} palette={palette}><View /></SwipeSheet>;

  const photos = photosOf(item);
  const cat = resolveCat(item.category, settings.categories);
  const cc = catColors(cat, palette.mode);

  const addPhoto = async (fromLibrary) => {
    const uri = await (fromLibrary ? pickFromLibrary() : takePhoto());
    if (uri) onUpdate(item.id, { photos: [...photos, uri] });
  };
  const removePhoto = (i) => onUpdate(item.id, { photos: photos.filter((_, j) => j !== i) });
  const commitName = () => {
    onUpdate(item.id, { name: draft.trim() || item.name });
    setEditingName(false);
  };

  return (
    <SwipeSheet visible={!!item} onClose={onClose} palette={palette}>
      <View style={s.head}>
        <View style={[s.chip, { backgroundColor: cc.tint }]}>
          <CategoryIcon catKey={cat.icon || cat.key} size={20} />
          <Text style={[s.chipText, { color: cc.ink }]}>{cat.label}</Text>
        </View>
        <ExpiryBadge exp={item.exp} palette={palette} />
      </View>

      {editingName ? (
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onBlur={commitName}
          onSubmitEditing={commitName}
          autoFocus
          maxLength={40}
          style={[s.nameInput, { color: palette.text, borderColor: palette.accent, backgroundColor: palette.surfaceAlt }]}
        />
      ) : (
        <Pressable onPress={() => { Haptics.selectionAsync().catch(() => {}); setDraft(item.name); setEditingName(true); }}>
          <Text style={[s.name, { color: palette.text }]}>{item.name} <Text style={[s.editHint, { color: palette.accent }]}>Edit</Text></Text>
        </Pressable>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.gallery}>
        {photos.map((uri, i) => (
          <Pressable key={i} onLongPress={() => removePhoto(i)} style={s.shotWrap}>
            <Image source={{ uri }} style={s.shot} />
          </Pressable>
        ))}
        <Pressable onPress={() => addPhoto(false)} onLongPress={() => addPhoto(true)} style={[s.addShot, { borderColor: palette.line }]}>
          <Text style={[s.addPlus, { color: palette.textSoft }]}>＋</Text>
          <Text style={[s.addLabel, { color: palette.textSoft }]}>Add photo</Text>
        </Pressable>
      </ScrollView>
      {photos.length > 0 && (
        <Text style={[s.hint, { color: palette.textSoft }]}>Hold a photo to remove it · hold ＋ to pick from library</Text>
      )}

      <Text style={[s.fieldLabel, { color: palette.textSoft }]}>Expires</Text>
      <DateField value={item.exp} onChange={(d) => onUpdate(item.id, { exp: d })} palette={palette} region={region} />

      <View style={[s.facts, { backgroundColor: palette.surfaceAlt }]}>
        {item.mfg ? <Fact label="Made" value={formatDate(item.mfg, region)} palette={palette} /> : null}
        <Fact label="Added" value={formatDate(item.createdAt, region)} palette={palette} />
      </View>

      <Pressable
        onPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          onRemove(item.id);
          onClose();
        }}
        style={({ pressed }) => [s.remove, { borderColor: palette.badge.bad.fg, opacity: pressed ? 0.6 : 1 }]}
      >
        <Text style={[s.removeText, { color: palette.badge.bad.fg }]}>Remove from fridge</Text>
      </Pressable>
    </SwipeSheet>
  );
}

function Fact({ label, value, palette }) {
  return (
    <View style={s.factRow}>
      <Text style={[s.factLabel, { color: palette.textSoft }]}>{label}</Text>
      <Text style={[s.factVal, { color: palette.text }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: SPACE.sm },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: RADIUS.pill, paddingHorizontal: 12, paddingVertical: 7 },
  chipText: { fontSize: 13.5, fontWeight: "800" },
  name: { fontSize: 26, fontWeight: "900", marginBottom: SPACE.md },
  editHint: { fontSize: 14, fontWeight: "800" },
  nameInput: { fontSize: 24, fontWeight: "900", borderWidth: 1.5, borderRadius: RADIUS.md, paddingHorizontal: SPACE.md, paddingVertical: 10, marginBottom: SPACE.md },
  gallery: { gap: SPACE.sm, paddingVertical: 2 },
  shotWrap: { borderRadius: RADIUS.md, overflow: "hidden" },
  shot: { width: 200, height: 200, borderRadius: RADIUS.md },
  addShot: { width: 200, height: 200, borderRadius: RADIUS.md, borderWidth: 1.5, borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 4 },
  addPlus: { fontSize: 30, fontWeight: "700" },
  addLabel: { fontSize: 13, fontWeight: "700" },
  hint: { fontSize: 11.5, marginTop: 6 },
  fieldLabel: { fontSize: 12, fontWeight: "800", letterSpacing: 1, marginTop: SPACE.md, marginBottom: 6 },
  facts: { borderRadius: RADIUS.md, padding: SPACE.md, gap: SPACE.sm, marginTop: SPACE.md },
  factRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  factLabel: { fontSize: 13, fontWeight: "700" },
  factVal: { fontSize: 15, fontWeight: "600" },
  remove: { marginTop: SPACE.lg, borderWidth: 1.5, borderRadius: RADIUS.lg, paddingVertical: 15, alignItems: "center" },
  removeText: { fontSize: 15.5, fontWeight: "800" },
});
