import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, Animated, Alert, Easing, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useApp, DEFAULT_CATEGORIES } from "../store";
import { resolveCat, CATEGORY_SKINS, DEFAULT_FRIDGE_NAME, RADIUS, SPACE } from "../theme";
import { FridgeBody, Shelf, Bin, WideDrawer, ItemRow } from "../components/Fridge";
import { EditIcon, CheckIcon } from "../components/icons";
import SwipeRow from "../components/SwipeRow";
import CategoryDrawer from "../components/CategoryDrawer";
import ItemDetail from "../components/ItemDetail";
import EditGrid from "../components/EditGrid";
import { daysLeft } from "../lib/expiry";

const DEFAULT_KEYS = new Set(DEFAULT_CATEGORIES.map((c) => c.key));
const MAX_FOLDERS = 9; // total folders (built-in + custom) a user may keep

export default function FridgeScreen({ active = true }) {
  const { palette, settings, items, removeItem, updateItem, updateSettings, addOverlay, removeOverlay } = useApp();
  const insets = useSafeAreaInsets();
  const [drawerKey, setDrawerKey] = useState(null);
  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(false);
  const [naming, setNaming] = useState(false); // fridge-name inline edit
  const [nameDraft, setNameDraft] = useState("");

  // Edit-mode (folders) state.
  const [showGrid, setShowGrid] = useState(false);
  const [gridArea, setGridArea] = useState(null); // { width, height }
  const [renamingKey, setRenamingKey] = useState(null);
  const [renameDraft, setRenameDraft] = useState("");
  const editA = useRef(new Animated.Value(0)).current;

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

  // ── Fridge-name rename (unchanged) ─────────────────────────────────────────
  const commitName = () => {
    updateSettings({ fridgeName: nameDraft.trim() || DEFAULT_FRIDGE_NAME });
    setNaming(false);
  };

  // ── Edit-mode plumbing ─────────────────────────────────────────────────────
  // Refs so the "exit on navigate away / unmount" effects never read stale state.
  const editingRef = useRef(false); editingRef.current = editing;
  const renamingKeyRef = useRef(renamingKey); renamingKeyRef.current = renamingKey;
  const renameDraftRef = useRef(renameDraft); renameDraftRef.current = renameDraft;
  const catsRef = useRef(cats); catsRef.current = cats;

  const commitRename = useCallback(() => {
    const key = renamingKeyRef.current;
    if (!key) return;
    const label = renameDraftRef.current.trim();
    if (label) {
      updateSettings({ categories: catsRef.current.map((c) => (c.key === key ? { ...c, label } : c)) });
    }
    setRenamingKey(null);
  }, [updateSettings]);

  const enterEdit = () => {
    if (editingRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setNaming(false);
    setShowGrid(true);
    setEditing(true);
    addOverlay(); // freezes the App-level horizontal page swipe
    Animated.timing(editA, { toValue: 1, duration: 320, easing: Easing.inOut(Easing.quad), useNativeDriver: true }).start();
  };

  const exitEdit = useCallback(() => {
    if (!editingRef.current) return;
    editingRef.current = false;
    commitRename();
    setEditing(false);
    removeOverlay();
    Haptics.selectionAsync().catch(() => {});
    Animated.timing(editA, { toValue: 0, duration: 300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }).start(({ finished }) => {
      if (finished) setShowGrid(false);
    });
  }, [commitRename, removeOverlay, editA]);

  // Latest exitEdit for the effects below (avoids stale closures).
  const exitEditRef = useRef(exitEdit); exitEditRef.current = exitEdit;

  // User navigated to another tab while editing → auto-save (already persisted) and exit.
  useEffect(() => {
    if (!active) exitEditRef.current();
  }, [active]);

  // Unmount safety net — never leak the overlay counter (would freeze page swipe).
  useEffect(() => () => { if (editingRef.current) removeOverlay(); }, [removeOverlay]);

  // ── Folder operations (all persist immediately via updateSettings) ─────────
  const reorder = (nextCats) => updateSettings({ categories: nextCats });
  const startRename = (cat) => { setRenameDraft(cat.label); setRenamingKey(cat.key); };
  const toggleHidden = (key) => {
    Haptics.selectionAsync().catch(() => {});
    updateSettings({ categories: catsRef.current.map((c) => (c.key === key ? { ...c, hidden: !c.hidden } : c)) });
  };
  const deleteFolder = (key) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    if (renamingKeyRef.current === key) setRenamingKey(null);
    updateSettings({ categories: catsRef.current.filter((c) => c.key !== key) });
  };
  const onBadge = (cat) => {
    if (!DEFAULT_KEYS.has(cat.key)) {
      const n = inCat(cat.key).length;
      if (n > 0) {
        Alert.alert("Delete folder?", `${n} item${n === 1 ? "" : "s"} will move to Other.`, [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => deleteFolder(cat.key) },
        ]);
      } else {
        deleteFolder(cat.key);
      }
    } else {
      toggleHidden(cat.key);
    }
  };
  const addFolder = () => {
    if (catsRef.current.length >= MAX_FOLDERS) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const used = new Set(catsRef.current.map((c) => c.skinId));
    const skin = CATEGORY_SKINS.find((sk) => !used.has(sk.key)) || CATEGORY_SKINS[catsRef.current.length % CATEGORY_SKINS.length];
    const key = String(Date.now());
    updateSettings({ categories: [...catsRef.current, { key, label: "New folder", skinId: skin.key, icon: "other", hidden: false }] });
    setRenameDraft("New folder");
    setRenamingKey(key);
  };

  // ── Morph interpolations ───────────────────────────────────────────────────
  const pencilStyle = {
    opacity: editA.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
    transform: [
      { rotate: editA.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "90deg"] }) },
      { scale: editA.interpolate({ inputRange: [0, 1], outputRange: [1, 0.6] }) },
    ],
  };
  const checkStyle = {
    opacity: editA,
    transform: [
      { rotate: editA.interpolate({ inputRange: [0, 1], outputRange: ["-90deg", "0deg"] }) },
      { scale: editA.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
    ],
  };
  // The edit layer is OPAQUE (its own bg) and simply fades in over the static
  // fridge — a clean single fade, no cross-dissolve gray. A subtle scale gives depth.
  const gridStyle = {
    opacity: editA,
    backgroundColor: palette.bg,
    transform: [{ scale: editA.interpolate({ inputRange: [0, 1], outputRange: [1.03, 1] }) }],
  };
  const soonStyle = { opacity: editA.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) };
  const btnBorder = editA.interpolate({ inputRange: [0, 1], outputRange: [palette.line, palette.accent] });

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: SPACE.xl + 12 }}>
      <Animated.View style={[s.editBtn, { backgroundColor: palette.surface, borderColor: btnBorder }]}>
        <Pressable
          onPress={() => (editingRef.current ? exitEdit() : enterEdit())}
          style={s.editBtnHit}
          hitSlop={10}
          accessibilityLabel={editing ? "Done editing folders" : "Edit fridge folders"}
        >
          <Animated.View style={[s.iconStack, pencilStyle]}>
            <EditIcon color={palette.textSoft} size={19} />
          </Animated.View>
          <Animated.View style={[s.iconStack, checkStyle]}>
            <CheckIcon color={palette.accent} size={20} active />
          </Animated.View>
        </Pressable>
      </Animated.View>

      <View style={s.top}>
        {naming ? (
          <TextInput
            value={nameDraft}
            onChangeText={setNameDraft}
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
            onPress={() => {
              if (editingRef.current) return; // name locked while editing folders
              Haptics.selectionAsync().catch(() => {});
              setNameDraft(settings.fridgeName);
              setNaming(true);
            }}
            style={[s.pill, { backgroundColor: palette.surface, borderColor: palette.line }]}
          >
            <Text style={[s.pillName, { color: palette.text }]}>{settings.fridgeName}</Text>
            <Text style={[s.pillSub, { color: palette.textSoft }]}>
              {editing
                ? "Drag to reorder · tap to rename"
                : total === 0
                ? "Empty for now · tap to rename"
                : `${total} item${total === 1 ? "" : "s"}${expiring ? ` · ${expiring} need${expiring === 1 ? "s" : ""} attention` : ""}${settings.rescued > 0 ? ` · ${settings.rescued} rescued` : ""}`}
            </Text>
          </Pressable>
        )}
      </View>

      {soon.length > 0 && !showGrid && (
        <Animated.View style={[s.soonWrap, soonStyle]} pointerEvents={editing ? "none" : "auto"}>
          <Text style={[s.soonKicker, { color: palette.textSoft }]}>EAT ME FIRST</Text>
          {soon.map((it) => (
            <SwipeRow key={it.id} palette={palette} onRemove={() => removeItem(it.id)}>
              <ItemRow item={it} palette={palette} onOpenItem={(item) => setDetail(item)} />
            </SwipeRow>
          ))}
        </Animated.View>
      )}

      <View style={[s.cavityPad, { paddingBottom: insets.bottom + SPACE.md }]}>
        <View style={s.stage} onLayout={(e) => setGridArea(e.nativeEvent.layout)}>
          <View style={StyleSheet.absoluteFill} pointerEvents={editing ? "none" : "auto"}>
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

          {showGrid && gridArea && (
            <Animated.View style={[StyleSheet.absoluteFill, gridStyle]} pointerEvents={editing ? "auto" : "none"}>
              <EditGrid
                cats={cats}
                palette={palette}
                width={gridArea.width}
                height={gridArea.height}
                defaultKeys={DEFAULT_KEYS}
                editing={editing}
                canAdd={cats.length < MAX_FOLDERS}
                renamingKey={renamingKey}
                renameDraft={renameDraft}
                setRenameDraft={setRenameDraft}
                onStartRename={startRename}
                onCommitRename={commitRename}
                onReorder={reorder}
                onBadge={onBadge}
                onAdd={addFolder}
              />
            </Animated.View>
          )}
        </View>
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
  editBtn: {
    // Vertically centered on the "My Fridge" pill (pill top = paddingTop SPACE.xl+12,
    // pill ≈73 tall → center ≈+36; button is 40 tall so top = paddingTop + 16).
    position: "absolute", right: SPACE.lg, top: SPACE.xl + 28, zIndex: 5,
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  editBtnHit: { flex: 1, alignItems: "center", justifyContent: "center" },
  iconStack: { position: "absolute", alignItems: "center", justifyContent: "center" },
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
  stage: { flex: 1 },
});
