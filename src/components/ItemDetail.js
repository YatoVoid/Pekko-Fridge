import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Image, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { RADIUS, SPACE, HAND, resolveCat, catColors } from "../theme";
import { useApp } from "../store";
import { CategoryIcon } from "./FoodIcons";
import { ExpiryBadge } from "./ui";
import { formatDate } from "../lib/expiry";
import { takePhoto, pickFromLibrary } from "../lib/photos";
import { photosOf, Magnet } from "./Fridge";
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
        <View style={s.chip}>
          <Magnet color={cc.accent} size={14} />
          <CategoryIcon catKey={cat.icon || cat.key} size={20} />
          <Text style={[s.chipText, { color: palette.text }]}>{cat.label}</Text>
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
          style={[s.nameInput, { color: palette.text, borderColor: palette.text }]}
        />
      ) : (
        <Pressable
          onPress={() => { Haptics.selectionAsync().catch(() => {}); setDraft(item.name); setEditingName(true); }}
          accessibilityRole="button"
          accessibilityHint="Rename this item"
          style={s.nameRow}
        >
          <Text style={[s.name, { color: palette.text }]}>{item.name}</Text>
          <Text style={[s.editHint, { color: palette.textSoft }]}>Rename</Text>
        </Pressable>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.gallery}>
        {photos.map((uri, i) => (
          <Pressable key={i} onLongPress={() => removePhoto(i)} style={s.shotWrap}>
            <Image source={{ uri }} style={s.shot} />
          </Pressable>
        ))}
        <Pressable onPress={() => addPhoto(false)} onLongPress={() => addPhoto(true)} style={[s.addShot, { borderColor: palette.line }]}>
          <Text style={[s.addPlus, { color: palette.textSoft }]}>+</Text>
          <Text style={[s.addLabel, { color: palette.textSoft }]}>Add photo</Text>
        </Pressable>
      </ScrollView>
      {photos.length > 0 && (
        <Text style={[s.hint, { color: palette.textSoft }]}>Hold a photo to remove it. Hold + to pick one from your library.</Text>
      )}

      <Text style={[s.fieldLabel, { color: palette.textSoft }]}>Expires</Text>
      <DateField value={item.exp} onChange={(d) => onUpdate(item.id, { exp: d })} palette={palette} region={region} />

      <View style={[s.facts, { borderColor: palette.line }]}>
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
  chip: { flexDirection: "row", alignItems: "center", gap: 6 },
  chipText: { fontSize: 14, fontWeight: "700" },
  nameRow: { flexDirection: "row", alignItems: "baseline", gap: SPACE.sm, marginBottom: SPACE.md, flexWrap: "wrap" },
  name: { fontFamily: HAND, fontSize: 34, lineHeight: 42 },
  editHint: { fontSize: 13.5, fontWeight: "700", textDecorationLine: "underline" },
  nameInput: { fontFamily: HAND, fontSize: 30, borderBottomWidth: 2, paddingVertical: 2, marginBottom: SPACE.md },
  gallery: { gap: SPACE.sm, paddingVertical: 2 },
  shotWrap: { borderRadius: RADIUS.md, overflow: "hidden" },
  shot: { width: 200, height: 200, borderRadius: RADIUS.md },
  addShot: { width: 200, height: 200, borderRadius: RADIUS.md, borderWidth: 1.5, borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 4 },
  addPlus: { fontSize: 30, fontWeight: "700" },
  addLabel: { fontSize: 13, fontWeight: "700" },
  hint: { fontSize: 11.5, marginTop: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "700", marginTop: SPACE.md, marginBottom: 6 },
  facts: { borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: SPACE.sm + 2, gap: SPACE.sm, marginTop: SPACE.md },
  factRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  factLabel: { fontSize: 13, fontWeight: "700" },
  factVal: { fontSize: 15, fontWeight: "600" },
  remove: { marginTop: SPACE.lg, borderWidth: 1.5, borderRadius: RADIUS.md, paddingVertical: 15, alignItems: "center" },
  removeText: { fontSize: 15.5, fontWeight: "800" },
});
