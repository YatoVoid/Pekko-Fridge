import React, { useState } from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { RADIUS, SPACE, HAND, catColors } from "../theme";
import { ExpiryBadge } from "./ui";
import { CategoryIcon, FoodPlaceholder } from "./FoodIcons";

export function photosOf(item) {
  if (item.photos?.length) return item.photos;
  return item.photo ? [item.photo] : [];
}

// Notes are never stuck on perfectly straight. The tilt comes from the key so
// a note keeps the same angle between visits.
function tiltOf(key) {
  let h = 0;
  for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return ((Math.abs(h) % 5) - 2) * 0.6;
}

export function Magnet({ color, size = 18 }) {
  return (
    <View style={[s.magnet, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <View style={[s.magnetShine, { width: size * 0.32, height: size * 0.32, borderRadius: size }]} />
    </View>
  );
}

export function FridgeBody({ children }) {
  return <View style={s.door}>{children}</View>;
}

export function Shelf({ children, flex = 1 }) {
  return <View style={[s.row, { flex }]}>{children}</View>;
}

function Note({ category, palette, onPress, onLongPress, style, children }) {
  const c = catColors(category, palette.mode);
  const [h, setH] = useState(0);
  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync().catch(() => {}); onPress(category.key); }}
      onLongPress={onLongPress}
      delayLongPress={350}
      accessibilityRole="button"
      accessibilityLabel={`${category.label} folder`}
      style={({ pressed }) => [style, { transform: [{ rotate: `${tiltOf(category.key)}deg` }, { translateY: pressed ? 2 : 0 }] }]}
    >
      <View
        style={[s.note, { backgroundColor: c.tint, borderColor: palette.line }]}
        onLayout={(e) => setH(e.nativeEvent.layout.height)}
      >
        {children(c, h > 0 && h < 118)}
      </View>
      <View style={s.magnetSlot} pointerEvents="none"><Magnet color={c.accent} /></View>
    </Pressable>
  );
}

const countText = (n) => (n === 0 ? "empty" : `${n} item${n === 1 ? "" : "s"}`);

export function Bin({ category, count, onPress, onLongPress, palette }) {
  return (
    <Note category={category} palette={palette} onPress={onPress} onLongPress={onLongPress} style={s.binWrap}>
      {(c, short) => (
        <View style={s.binBody}>
          {!short && <CategoryIcon catKey={category.icon || category.key} size={40} />}
          <Text
            style={[s.binLabel, { color: c.ink }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {category.label}
          </Text>
          <Text style={[s.count, { color: palette.textSoft }]}>{countText(count)}</Text>
        </View>
      )}
    </Note>
  );
}

export function WideDrawer({ category, count, onPress, onLongPress, palette }) {
  return (
    <Note category={category} palette={palette} onPress={onPress} onLongPress={onLongPress} style={{ flex: 1 }}>
      {(c, short) => (
        <View style={s.wideBody}>
          <CategoryIcon catKey={category.icon || category.key} size={short ? 36 : 58} />
          <View style={{ marginLeft: SPACE.md, flex: 1 }}>
            <Text style={[s.wideLabel, { color: c.ink }]} numberOfLines={1}>{category.label}</Text>
            <Text style={[s.count, { color: palette.textSoft }]}>{countText(count)}</Text>
          </View>
        </View>
      )}
    </Note>
  );
}

export function ItemRow({ item, palette, onOpenItem }) {
  const photos = photosOf(item);
  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync().catch(() => {}); onOpenItem?.(item); }}
      style={[s.item, { backgroundColor: palette.surface, borderColor: palette.line }]}
      accessibilityRole="button"
    >
      {photos[0] ? (
        <Image source={{ uri: photos[0] }} style={s.thumb} />
      ) : (
        <View style={[s.thumb, s.thumbEmpty, { backgroundColor: palette.surfaceAlt }]}>
          <FoodPlaceholder color={palette.textSoft} size={26} />
        </View>
      )}
      <View style={s.itemMid}>
        <Text numberOfLines={1} style={[s.itemName, { color: palette.text }]}>{item.name}</Text>
        {photos.length > 1 && (
          <Text style={[s.photoCount, { color: palette.textSoft }]}>{photos.length} photos</Text>
        )}
      </View>
      <ExpiryBadge exp={item.exp} palette={palette} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  door: { flex: 1, paddingHorizontal: SPACE.xs, paddingTop: SPACE.md, paddingBottom: SPACE.xs, gap: SPACE.lg },
  row: { flexDirection: "row", gap: SPACE.md },
  binWrap: { flex: 1 },
  note: {
    flex: 1, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderRadius: 2, padding: SPACE.sm, paddingTop: SPACE.md + 2,
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  magnetSlot: { position: "absolute", top: -7, left: 0, right: 0, alignItems: "center" },
  magnet: {
    borderWidth: 1, borderColor: "rgba(0,0,0,0.25)",
    shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 1.5, shadowOffset: { width: 0, height: 1.5 }, elevation: 3,
  },
  magnetShine: { position: "absolute", top: "18%", left: "22%", backgroundColor: "rgba(255,255,255,0.55)" },
  binBody: { flex: 1, justifyContent: "flex-end" },
  binLabel: { fontFamily: HAND, fontSize: 21, lineHeight: 26, marginTop: 4 },
  count: { fontSize: 12.5, fontWeight: "600" },
  wideBody: { flex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: SPACE.sm },
  wideLabel: { fontFamily: HAND, fontSize: 28, lineHeight: 34 },
  item: { flexDirection: "row", alignItems: "center", gap: SPACE.md, padding: SPACE.sm, borderRadius: RADIUS.md, borderWidth: 1 },
  thumb: { width: 46, height: 46, borderRadius: RADIUS.sm },
  thumbEmpty: { alignItems: "center", justifyContent: "center" },
  itemMid: { flex: 1 },
  itemName: { fontFamily: HAND, fontSize: 20, lineHeight: 26 },
  photoCount: { fontSize: 12, fontWeight: "600" },
});
