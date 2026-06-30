// Skeuomorphic open-fridge pieces (per FridgeUiRedesignSpec).
import React from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { RADIUS, SPACE, catColors } from "../theme";
import { ExpiryBadge } from "./ui";
import { CategoryIcon, FoodPlaceholder } from "./FoodIcons";

const pillBg = (mode) => (mode === "dark" ? "rgba(0,0,0,0.28)" : "rgba(255,255,255,0.85)");

export function photosOf(item) {
  if (item.photos?.length) return item.photos;
  return item.photo ? [item.photo] : [];
}

// The fridge cavity: a soft inset interior holding shelves.
export function FridgeBody({ children, palette }) {
  return (
    <LinearGradient
      colors={[palette.bgLo, palette.surfaceAlt]}
      style={[s.cavity, { borderColor: palette.line }]}
    >
      {children}
    </LinearGradient>
  );
}

// A glass shelf — translucent rail with a top highlight.
export function Shelf({ children, flex = 1, palette }) {
  return (
    <LinearGradient
      colors={
        palette.mode === "dark"
          ? ["rgba(255,255,255,0.06)", "rgba(255,255,255,0.015)"]
          : ["rgba(255,255,255,0.55)", "rgba(210,200,185,0.16)"]
      }
      style={[s.shelf, { flex }]}
    >
      {children}
    </LinearGradient>
  );
}

function press({ pressed }) {
  return [{ transform: [{ scale: pressed ? 0.96 : 1 }] }];
}

// A drawer bin sitting on a shelf.
export function Bin({ category, count, onPress, palette, showUnit }) {
  const c = catColors(category, palette.mode);
  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync().catch(() => {}); onPress(category.key); }}
      style={({ pressed }) => [s.binWrap, ...press({ pressed })]}
    >
      <LinearGradient colors={[c.tint, c.tintLo]} style={[s.bin, { shadowColor: c.accent }]}>
        <View style={[s.countPill, { backgroundColor: pillBg(palette.mode) }]}>
          <Text style={[s.countText, { color: c.ink }]}>{showUnit ? `${count} item${count === 1 ? "" : "s"}` : count}</Text>
        </View>
        <CategoryIcon catKey={category.key} size={46} />
        <Text style={[s.binLabel, { color: c.ink }]}>{category.label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

// Wide crisper drawer (Vegetables).
export function WideDrawer({ category, count, onPress, palette }) {
  const c = catColors(category, palette.mode);
  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync().catch(() => {}); onPress(category.key); }}
      style={({ pressed }) => [{ flex: 1.55 }, ...press({ pressed })]}
    >
      <LinearGradient colors={[c.tint, c.tintLo]} style={[s.crisper, { shadowColor: c.accent }]}>
        <View style={[s.crisperHandle, { backgroundColor: palette.mode === "dark" ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.7)" }]} />
        <View style={[s.countPill, { backgroundColor: pillBg(palette.mode) }]}>
          <Text style={[s.countText, { color: c.ink }]}>{count} item{count === 1 ? "" : "s"}</Text>
        </View>
        <CategoryIcon catKey={category.key} size={66} />
        <View style={{ marginLeft: SPACE.md }}>
          <Text style={[s.crisperTitle, { color: c.ink }]}>{category.label}</Text>
          <Text style={[s.crisperSub, { color: c.accent }]}>Crisper drawer · tap to open</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export function ItemRow({ item, palette, onOpenItem }) {
  const photos = photosOf(item);
  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync().catch(() => {}); onOpenItem?.(item); }}
      style={[s.item, { backgroundColor: palette.surface, borderColor: palette.line }]}
    >
      {photos[0] ? (
        <Image source={{ uri: photos[0] }} style={s.thumb} />
      ) : (
        <View style={[s.thumb, s.thumbEmpty, { backgroundColor: palette.surfaceAlt }]}>
          <FoodPlaceholder color={palette.textSoft} size={28} />
        </View>
      )}
      <View style={s.itemMid}>
        <Text numberOfLines={1} style={[s.itemName, { color: palette.text }]}>{item.name}</Text>
        <ExpiryBadge exp={item.exp} palette={palette} />
      </View>
      {photos.length > 1 && (
        <View style={[s.countTag, { backgroundColor: palette.surfaceAlt }]}>
          <Text style={[s.countTagText, { color: palette.textSoft }]}>{photos.length}</Text>
        </View>
      )}
      <Text style={[s.chev, { color: palette.textSoft }]}>›</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  cavity: {
    flex: 1, borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACE.sm + 2, gap: SPACE.sm + 2,
  },
  shelf: { borderRadius: RADIUS.md + 2, padding: SPACE.sm + 2, flexDirection: "row", gap: SPACE.sm + 2 },
  binWrap: { flex: 1 },
  bin: {
    flex: 1, borderRadius: RADIUS.md, padding: SPACE.md, justifyContent: "space-between",
    shadowOpacity: 0.5, shadowRadius: 9, shadowOffset: { width: 0, height: 5 }, elevation: 3, minHeight: 92,
  },
  countPill: {
    position: "absolute", top: 8, right: 8, backgroundColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: 9, paddingVertical: 3, borderRadius: RADIUS.pill,
  },
  countText: { fontSize: 11, fontWeight: "800" },
  binLabel: { fontSize: 17, fontWeight: "800", marginTop: SPACE.sm, letterSpacing: 0.2 },
  crisper: {
    flex: 1, borderRadius: RADIUS.md + 2, paddingHorizontal: SPACE.lg, flexDirection: "row", alignItems: "center",
    shadowOpacity: 0.5, shadowRadius: 9, shadowOffset: { width: 0, height: 5 }, elevation: 3,
  },
  crisperHandle: { position: "absolute", top: 6, left: "50%", marginLeft: -23, width: 46, height: 5, borderRadius: 4 },
  crisperTitle: { fontSize: 22, fontWeight: "800" },
  crisperSub: { fontSize: 12.5, fontWeight: "700", marginTop: 2 },
  item: { flexDirection: "row", alignItems: "center", gap: SPACE.md, padding: SPACE.sm, borderRadius: RADIUS.md, borderWidth: 1 },
  thumb: { width: 46, height: 46, borderRadius: RADIUS.sm },
  thumbEmpty: { alignItems: "center", justifyContent: "center" },
  itemMid: { flex: 1, gap: 6 },
  itemName: { fontSize: 15.5, fontWeight: "700" },
  countTag: { borderRadius: RADIUS.pill, paddingHorizontal: 7, paddingVertical: 2 },
  countTagText: { fontSize: 11, fontWeight: "800" },
  chev: { fontSize: 18, fontWeight: "700", width: 14, textAlign: "center" },
});
