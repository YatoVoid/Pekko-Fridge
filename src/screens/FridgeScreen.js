import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useApp } from "../store";
import { catOf, DEFAULT_FRIDGE_NAME, RADIUS, SPACE } from "../theme";
import { FridgeBody, Shelf, Bin, WideDrawer } from "../components/Fridge";
import CategoryDrawer from "../components/CategoryDrawer";
import ItemDetail from "../components/ItemDetail";

export default function FridgeScreen() {
  const { palette, settings, items, removeItem, updateItem, updateSettings } = useApp();
  const insets = useSafeAreaInsets();
  const [drawerKey, setDrawerKey] = useState(null);
  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const inCat = (key) => items.filter((i) => i.category === key);
  const total = items.length;
  const expiring = items.filter((i) => {
    const d = i.exp ? Math.round((new Date(i.exp) - new Date()) / 86400000) : null;
    return d !== null && d <= settings.notifyDays;
  }).length;

  const commitName = () => {
    updateSettings({ fridgeName: draft.trim() || DEFAULT_FRIDGE_NAME });
    setEditing(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: SPACE.xl + 12 }}>
      <View style={s.top}>
        {editing ? (
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onBlur={commitName}
            onSubmitEditing={commitName}
            autoFocus
            maxLength={28}
            placeholder={DEFAULT_FRIDGE_NAME}
            placeholderTextColor={palette.textSoft}
            style={[s.pill, s.pillInput, { backgroundColor: palette.surface, borderColor: palette.accent, color: palette.text }]}
          />
        ) : (
          <Pressable
            onPress={() => { Haptics.selectionAsync().catch(() => {}); setDraft(settings.fridgeName); setEditing(true); }}
            style={[s.pill, { backgroundColor: palette.surface, borderColor: palette.line }]}
          >
            <Text style={[s.pillName, { color: palette.text }]}>{settings.fridgeName}</Text>
            <Text style={[s.pillSub, { color: palette.textSoft }]}>
              {total === 0
                ? "Empty for now · tap to rename"
                : `${total} item${total === 1 ? "" : "s"}${expiring ? ` · ${expiring} need${expiring === 1 ? "s" : ""} attention` : ""}`}
            </Text>
          </Pressable>
        )}
      </View>

      <View style={[s.cavityPad, { paddingBottom: insets.bottom + SPACE.md }]}>
        <FridgeBody palette={palette}>
          <Shelf palette={palette}>
            <Bin category={catOf("dairy")} count={inCat("dairy").length} palette={palette} onPress={setDrawerKey} showUnit />
            <Bin category={catOf("other")} count={inCat("other").length} palette={palette} onPress={setDrawerKey} showUnit />
          </Shelf>

          <Shelf palette={palette}>
            <Bin category={catOf("cheese")} count={inCat("cheese").length} palette={palette} onPress={setDrawerKey} />
            <Bin category={catOf("meat")} count={inCat("meat").length} palette={palette} onPress={setDrawerKey} />
            <Bin category={catOf("soup")} count={inCat("soup").length} palette={palette} onPress={setDrawerKey} />
          </Shelf>

          <WideDrawer category={catOf("veg")} count={inCat("veg").length} palette={palette} onPress={setDrawerKey} />
        </FridgeBody>
      </View>

      <CategoryDrawer
        category={drawerKey ? catOf(drawerKey) : null}
        items={drawerKey ? inCat(drawerKey) : []}
        palette={palette}
        onClose={() => setDrawerKey(null)}
        onOpenItem={(it) => { setDrawerKey(null); setDetail(it); }}
      />

      <ItemDetail
        item={detail}
        palette={palette}
        region={settings.region}
        onUpdate={updateItem}
        onRemove={removeItem}
        onClose={() => setDetail(null)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  top: { paddingHorizontal: SPACE.lg, marginBottom: SPACE.md },
  pill: {
    alignSelf: "center", borderRadius: RADIUS.pill, borderWidth: 1,
    paddingHorizontal: SPACE.lg + 6, paddingVertical: SPACE.sm + 2, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 },
  },
  pillInput: { minWidth: 230, textAlign: "center", fontSize: 22, fontWeight: "900" },
  pillName: { fontSize: 24, fontWeight: "900", letterSpacing: 0.3 },
  pillSub: { fontSize: 13, fontWeight: "600", marginTop: 2 },
  cavityPad: { flex: 1, paddingHorizontal: SPACE.md },
});
