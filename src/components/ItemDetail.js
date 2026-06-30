// Full info for one item: every saved photo + dates + remove. Opens on item tap.
import React from "react";
import { View, Text, Pressable, ScrollView, Image, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { RADIUS, SPACE, catOf, catColors } from "../theme";
import { CategoryIcon } from "./FoodIcons";
import { ExpiryBadge } from "./ui";
import { formatDate } from "../lib/expiry";
import { takePhoto, pickFromLibrary } from "../lib/photos";
import { photosOf } from "./Fridge";
import SwipeSheet from "./SwipeSheet";

export default function ItemDetail({ item, palette, region, onClose, onUpdate, onRemove }) {
  if (!item) return <SwipeSheet visible={false} onClose={onClose} palette={palette}><View /></SwipeSheet>;

  const photos = photosOf(item);
  const cat = catOf(item.category);
  const cc = catColors(cat, palette.mode);

  const addPhoto = async (fromLibrary) => {
    const uri = await (fromLibrary ? pickFromLibrary() : takePhoto());
    if (uri) onUpdate(item.id, { photos: [...photos, uri] });
  };

  const removePhoto = (i) => onUpdate(item.id, { photos: photos.filter((_, j) => j !== i) });

  return (
    <SwipeSheet visible={!!item} onClose={onClose} palette={palette}>
      <View style={s.head}>
        <View style={[s.chip, { backgroundColor: cc.tint }]}>
          <CategoryIcon catKey={cat.key} size={20} />
          <Text style={[s.chipText, { color: cc.ink }]}>{cat.label}</Text>
        </View>
        <ExpiryBadge exp={item.exp} palette={palette} />
      </View>

      <Text style={[s.name, { color: palette.text }]}>{item.name}</Text>

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

      <View style={[s.facts, { backgroundColor: palette.surfaceAlt }]}>
        <Fact label="Expires" value={formatDate(item.exp, region)} palette={palette} strong />
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

function Fact({ label, value, palette, strong }) {
  return (
    <View style={s.factRow}>
      <Text style={[s.factLabel, { color: palette.textSoft }]}>{label}</Text>
      <Text style={[strong ? s.factStrong : s.factVal, { color: palette.text }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: SPACE.sm },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: RADIUS.pill, paddingHorizontal: 12, paddingVertical: 7 },
  chipText: { fontSize: 13.5, fontWeight: "800", color: "#4A433B" },
  name: { fontSize: 26, fontWeight: "900", marginBottom: SPACE.md },
  gallery: { gap: SPACE.sm, paddingVertical: 2 },
  shotWrap: { borderRadius: RADIUS.md, overflow: "hidden" },
  shot: { width: 200, height: 200, borderRadius: RADIUS.md },
  addShot: { width: 200, height: 200, borderRadius: RADIUS.md, borderWidth: 1.5, borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 4 },
  addPlus: { fontSize: 30, fontWeight: "700" },
  addLabel: { fontSize: 13, fontWeight: "700" },
  hint: { fontSize: 11.5, marginTop: 6 },
  facts: { borderRadius: RADIUS.md, padding: SPACE.md, gap: SPACE.sm, marginTop: SPACE.md },
  factRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  factLabel: { fontSize: 13, fontWeight: "700" },
  factVal: { fontSize: 15, fontWeight: "600" },
  factStrong: { fontSize: 20, fontWeight: "900", letterSpacing: 0.4 },
  remove: { marginTop: SPACE.lg, borderWidth: 1.5, borderRadius: RADIUS.lg, paddingVertical: 15, alignItems: "center" },
  removeText: { fontSize: 15.5, fontWeight: "800" },
});
