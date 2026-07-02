import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useApp, DEFAULT_CATEGORIES } from "../store";
import { resolveCat, DEFAULT_FRIDGE_NAME, RADIUS, SPACE } from "../theme";
import { FridgeBody, Shelf, Bin, WideDrawer, ItemRow } from "../components/Fridge";
import SwipeRow from "../components/SwipeRow";
import CategoryDrawer from "../components/CategoryDrawer";
import ItemDetail from "../components/ItemDetail";
import { daysLeft } from "../lib/expiry";

export default function FridgeScreen() {
  const { palette, settings, items, removeItem, updateItem, updateSettings } = useApp();
  const insets = useSafeAreaInsets();
  const [drawerKey, setDrawerKey] = useState(null);
  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const cats = settings.categories || DEFAULT_CATEGORIES;
  const visibleCats = cats.filter((c) => !c.hidden);
  const visibleKeySet = new Set(visibleCats.map((c) => c.key));
  // "other" bucket shows its own items + items from hidden/unknown categories
  const inCat = (key) =>
    key === "other"
      ? items.filter((i) => i.category === "other" || !visibleKeySet.has(i.category))
      : items.filter((i) => i.category === key);
  const rc = (key) => resolveCat(key, cats);

  const total = items.length;
  const expiring = items.filter((i) => {
    const d = i.exp ? Math.round((new Date(i.exp) - new Date()) / 86400000) : null;
    return d !== null && d <= settings.notifyDays;
  }).length;

  const soon = items
    .filter((i) => i.exp && daysLeft(i.exp) !== null && daysLeft(i.exp) <= 7)
    .sort((a, b) => daysLeft(a.exp) - daysLeft(b.exp))
    .slice(0, 3);

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
                : `${total} item${total === 1 ? "" : "s"}${expiring ? ` · ${expiring} need${expiring === 1 ? "s" : ""} attention` : ""}${settings.rescued > 0 ? ` · ${settings.rescued} rescued` : ""}`}
            </Text>
          </Pressable>
        )}
      </View>

      {soon.length > 0 && (
        <View style={s.soonWrap}>
          <Text style={[s.soonKicker, { color: palette.textSoft }]}>EAT ME FIRST</Text>
          {soon.map((it) => (
            <SwipeRow key={it.id} palette={palette} onRemove={() => removeItem(it.id)}>
              <ItemRow item={it} palette={palette} onOpenItem={(item) => setDetail(item)} />
            </SwipeRow>
          ))}
        </View>
      )}

      <View style={[s.cavityPad, { paddingBottom: insets.bottom + SPACE.md }]}>
        <FridgeBody palette={palette}>
          {visibleCats.slice(0, 2).length > 0 && (
            <Shelf palette={palette}>
              {visibleCats.slice(0, 2).map((cat) => (
                <Bin key={cat.key} category={rc(cat.key)} count={inCat(cat.key).length}
                     palette={palette} onPress={setDrawerKey} showUnit />
              ))}
            </Shelf>
          )}
          {visibleCats.slice(2, 5).length > 0 && (
            <Shelf palette={palette}>
              {visibleCats.slice(2, 5).map((cat) => (
                <Bin key={cat.key} category={rc(cat.key)} count={inCat(cat.key).length}
                     palette={palette} onPress={setDrawerKey} />
              ))}
            </Shelf>
          )}
          {visibleCats[5] && (
            <WideDrawer category={rc(visibleCats[5].key)} count={inCat(visibleCats[5].key).length}
                        palette={palette} onPress={setDrawerKey} />
          )}
          {visibleCats.slice(6).length > 0 && (
            <Shelf palette={palette}>
              {visibleCats.slice(6).map((cat) => (
                <Bin key={cat.key} category={rc(cat.key)} count={inCat(cat.key).length}
                     palette={palette} onPress={setDrawerKey} />
              ))}
            </Shelf>
          )}
        </FridgeBody>
      </View>

      <CategoryDrawer
        category={drawerKey ? rc(drawerKey) : null}
        items={drawerKey ? inCat(drawerKey) : []}
        palette={palette}
        onClose={() => setDrawerKey(null)}
        onOpenItem={(it) => { setDrawerKey(null); setDetail(it); }}
        onRemove={removeItem}
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
  soonWrap: { paddingHorizontal: SPACE.lg, marginBottom: SPACE.sm, gap: SPACE.xs },
  soonKicker: { fontSize: 11, fontWeight: "800", letterSpacing: 2, marginBottom: 2 },
  cavityPad: { flex: 1, paddingHorizontal: SPACE.md },
});
