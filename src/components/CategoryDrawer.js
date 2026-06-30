// Slide-up drawer for one category: lists its items; tap an item for full detail.
import React from "react";
import { View, Text, ScrollView, StyleSheet, Dimensions } from "react-native";
import { RADIUS, SPACE, catColors } from "../theme";

const LIST_MAX = Math.round(Dimensions.get("window").height * 0.5); // grow, then scroll
import { CategoryIcon } from "./FoodIcons";
import { ItemRow } from "./Fridge";
import SwipeSheet from "./SwipeSheet";
import SwipeRow from "./SwipeRow";

export default function CategoryDrawer({ category, items = [], palette, onClose, onOpenItem, onRemove }) {
  return (
    <SwipeSheet visible={!!category} onClose={onClose} palette={palette}>
      {category && (
        <>
          <View style={s.head}>
            <View style={[s.iconChip, { backgroundColor: catColors(category, palette.mode).tint }]}>
              <CategoryIcon catKey={category.key} size={30} />
            </View>
            <View>
              <Text style={[s.title, { color: palette.text }]}>{category.label}</Text>
              <Text style={[s.sub, { color: palette.textSoft }]}>
                {items.length} item{items.length === 1 ? "" : "s"} inside
              </Text>
            </View>
          </View>

          <ScrollView style={{ maxHeight: LIST_MAX }} contentContainerStyle={{ gap: SPACE.sm }} showsVerticalScrollIndicator={true}>
            {items.length === 0 ? (
              <Text style={[s.empty, { color: palette.textSoft }]}>This drawer is empty — scan something tasty.</Text>
            ) : (
              items.map((it) => (
                <SwipeRow key={it.id} palette={palette} onRemove={() => onRemove?.(it.id)}>
                  <ItemRow item={it} palette={palette} onOpenItem={onOpenItem} />
                </SwipeRow>
              ))
            )}
          </ScrollView>
        </>
      )}
    </SwipeSheet>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: SPACE.md, marginBottom: SPACE.md },
  iconChip: { width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "900", lineHeight: 26 },
  sub: { fontSize: 13, fontWeight: "700", marginTop: 2 },
  empty: { fontSize: 14, paddingVertical: SPACE.xl, textAlign: "center", fontStyle: "italic" },
});
