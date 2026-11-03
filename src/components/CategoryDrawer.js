import React from "react";
import { View, Text, ScrollView, StyleSheet, Dimensions } from "react-native";
import { SPACE, HAND, catColors } from "../theme";

const LIST_MAX = Math.round(Dimensions.get("window").height * 0.5);
import { CategoryIcon } from "./FoodIcons";
import { ItemRow, Magnet } from "./Fridge";
import SwipeSheet from "./SwipeSheet";
import SwipeRow from "./SwipeRow";

export default function CategoryDrawer({ category, items = [], palette, onClose, onOpenItem, onRemove }) {
  const header = category ? (
    <View style={s.head}>
      <View style={s.iconChip}>
        <CategoryIcon catKey={category.icon || category.key} size={34} />
        <View style={s.magnetPin}><Magnet color={catColors(category, palette.mode).accent} size={14} /></View>
      </View>
      <View>
        <Text style={[s.title, { color: palette.text }]}>{category.label}</Text>
        <Text style={[s.sub, { color: palette.textSoft }]}>
          {items.length === 0 ? "Empty" : `${items.length} item${items.length === 1 ? "" : "s"}. Swipe one left to remove it.`}
        </Text>
      </View>
    </View>
  ) : null;

  return (
    <SwipeSheet visible={!!category} onClose={onClose} palette={palette} scrollable header={header}>
      {category && (
        <ScrollView style={{ maxHeight: LIST_MAX }} contentContainerStyle={{ gap: SPACE.sm }} showsVerticalScrollIndicator={true}>
          {items.length === 0 ? (
            <Text style={[s.empty, { color: palette.textSoft }]}>Nothing here yet. Scan a product to add one.</Text>
          ) : (
            items.map((it) => (
              <SwipeRow key={it.id} palette={palette} onRemove={() => onRemove?.(it.id)}>
                <ItemRow item={it} palette={palette} onOpenItem={onOpenItem} />
              </SwipeRow>
            ))
          )}
        </ScrollView>
      )}
    </SwipeSheet>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: SPACE.md, marginBottom: SPACE.md },
  iconChip: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  magnetPin: { position: "absolute", top: -4, right: -2 },
  title: { fontFamily: HAND, fontSize: 30, lineHeight: 36 },
  sub: { fontSize: 13, fontWeight: "600" },
  empty: { fontSize: 14, paddingVertical: SPACE.xl, textAlign: "center" },
});
