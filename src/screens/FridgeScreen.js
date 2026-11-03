import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, Animated, Alert, Easing, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useApp, DEFAULT_CATEGORIES } from "../store";
import { resolveCat, CATEGORY_SKINS, DEFAULT_FRIDGE_NAME, RADIUS, SPACE, HAND } from "../theme";
import { FridgeBody, Shelf, Bin, WideDrawer } from "../components/Fridge";
import { EditIcon, CheckIcon } from "../components/icons";
import CategoryDrawer from "../components/CategoryDrawer";
import ItemDetail from "../components/ItemDetail";
import EditGrid from "../components/EditGrid";
import SoonStrip from "../components/SoonStrip";
import { daysLeft } from "../lib/expiry";

const DEFAULT_KEYS = new Set(DEFAULT_CATEGORIES.map((c) => c.key));
const MAX_FOLDERS = 9;

export default function FridgeScreen({ active = true }) {
  const { palette, settings, items, removeItem, updateItem, updateSettings, addOverlay, removeOverlay } = useApp();
  const insets = useSafeAreaInsets();
  const [drawerKey, setDrawerKey] = useState(null);
  // Look the open item up by id so edits show in the open sheet.
  const [detailId, setDetailId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [naming, setNaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  const [showGrid, setShowGrid] = useState(false);
  const [gridArea, setGridArea] = useState(null);
  const [renamingKey, setRenamingKey] = useState(null);
  const [renameDraft, setRenameDraft] = useState("");
  const editA = useRef(new Animated.Value(0)).current;

  const cats = settings.categories || DEFAULT_CATEGORIES;
  const visibleCats = cats.filter((c) => !c.hidden);
  const visibleKeySet = new Set(visibleCats.map((c) => c.key));
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

  const soonItems = React.useMemo(
    () => items
      .filter((i) => i.exp && daysLeft(i.exp) !== null && daysLeft(i.exp) <= 7)
      .sort((a, b) => daysLeft(a.exp) - daysLeft(b.exp)),
    [items],
  );

  const detail = detailId ? items.find((i) => i.id === detailId) || null : null;

  const commitName = () => {
    updateSettings({ fridgeName: nameDraft.trim() || DEFAULT_FRIDGE_NAME });
    setNaming(false);
  };

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
    addOverlay();
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

  const exitEditRef = useRef(exitEdit); exitEditRef.current = exitEdit;

  useEffect(() => {
    if (!active) exitEditRef.current();
  }, [active]);

  // Never leak the overlay counter; it would freeze page swipes.
  useEffect(() => () => { if (editingRef.current) removeOverlay(); }, [removeOverlay]);

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
    const names = new Set(catsRef.current.map((c) => c.label));
    let label = "New folder";
    for (let n = 2; names.has(label); n++) label = `New folder ${n}`;
    const key = String(Date.now());
    updateSettings({ categories: [...catsRef.current, { key, label, skinId: skin.key, icon: "other", hidden: false }] });
    setRenameDraft(label);
    setRenamingKey(key);
  };

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
  // Fade the fridge out before the tiles fade in, or its shadows show through.
  const bodyStyle = {
    opacity: editA.interpolate({ inputRange: [0, 0.5], outputRange: [1, 0], extrapolate: "clamp" }),
  };
  const gridStyle = {
    opacity: editA.interpolate({ inputRange: [0.3, 1], outputRange: [0, 1], extrapolate: "clamp" }),
    transform: [{ scale: editA.interpolate({ inputRange: [0, 1], outputRange: [1.03, 1] }) }],
  };
  const btnBorder = editA.interpolate({ inputRange: [0, 1], outputRange: [palette.line, palette.text] });

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: SPACE.xl + 8 }}>
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
            <CheckIcon color={palette.text} size={20} active />
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
            style={[s.pill, s.pillInput, { borderColor: palette.text, color: palette.text }]}
          />
        ) : (
          <Pressable
            onPress={() => {
              if (editingRef.current) return;
              Haptics.selectionAsync().catch(() => {});
              setNameDraft(settings.fridgeName);
              setNaming(true);
            }}
            style={s.pill}
            accessibilityRole="button"
            accessibilityHint="Rename your fridge"
          >
            <Text style={[s.pillName, { color: palette.text }]}>{settings.fridgeName}</Text>
            <Text style={[s.pillSub, { color: palette.textSoft }]}>
              {editing
                ? "Drag notes to reorder. Tap a name to rename it."
                : total === 0
                ? "Nothing in here yet"
                : [
                    `${total} item${total === 1 ? "" : "s"}`,
                    expiring ? `${expiring} expiring soon` : null,
                    settings.rescued > 0 ? `${settings.rescued} used in time` : null,
                  ].filter(Boolean).join(", ")}
            </Text>
          </Pressable>
        )}
      </View>

      <SoonStrip items={soonItems} palette={palette} editA={editA} editing={editing} onOpenItem={(it) => setDetailId(it.id)} />

      {items.length === 0 && !editing && (
        <View style={s.emptyHint}>
          <Text style={[s.emptyHintText, { color: palette.textSoft }]}>
            Scan a date label to add your first item.
          </Text>
        </View>
      )}

      <View style={[s.cavityPad, { paddingBottom: insets.bottom + SPACE.md }]}>
        <View style={[s.stage, { backgroundColor: palette.bg }]} onLayout={(e) => setGridArea(e.nativeEvent.layout)}>
          <Animated.View style={[StyleSheet.absoluteFill, bodyStyle]} pointerEvents={editing ? "none" : "auto"}>
            <FridgeBody palette={palette}>
              {visibleCats.slice(0, 2).length > 0 && (
                <Shelf palette={palette}>
                  {visibleCats.slice(0, 2).map((cat) => (
                    <Bin key={cat.key} category={rc(cat.key)} count={inCat(cat.key).length}
                         palette={palette} onPress={setDrawerKey} onLongPress={enterEdit} />
                  ))}
                </Shelf>
              )}
              {visibleCats.slice(2, 5).length > 0 && (
                <Shelf palette={palette}>
                  {visibleCats.slice(2, 5).map((cat) => (
                    <Bin key={cat.key} category={rc(cat.key)} count={inCat(cat.key).length}
                         palette={palette} onPress={setDrawerKey} onLongPress={enterEdit} />
                  ))}
                </Shelf>
              )}
              {visibleCats[5] && (
                <WideDrawer category={rc(visibleCats[5].key)} count={inCat(visibleCats[5].key).length}
                            palette={palette} onPress={setDrawerKey} onLongPress={enterEdit} />
              )}
              {visibleCats.slice(6).length > 0 && (
                <Shelf palette={palette}>
                  {visibleCats.slice(6).map((cat) => (
                    <Bin key={cat.key} category={rc(cat.key)} count={inCat(cat.key).length}
                         palette={palette} onPress={setDrawerKey} onLongPress={enterEdit} />
                  ))}
                </Shelf>
              )}
            </FridgeBody>
          </Animated.View>

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
        onOpenItem={(it) => { setDrawerKey(null); setDetailId(it.id); }}
        onRemove={removeItem}
      />

      <ItemDetail
        item={detail}
        palette={palette}
        region={settings.region}
        onUpdate={updateItem}
        onRemove={removeItem}
        onClose={() => setDetailId(null)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  editBtn: {
    position: "absolute", right: SPACE.lg, top: SPACE.xl + 14, zIndex: 5,
    width: 44, height: 44, borderRadius: RADIUS.md, borderWidth: 1.5,
  },
  editBtnHit: { flex: 1, alignItems: "center", justifyContent: "center" },
  iconStack: { position: "absolute", alignItems: "center", justifyContent: "center" },
  top: { paddingHorizontal: SPACE.lg, paddingRight: SPACE.lg + 56, marginBottom: SPACE.md },
  pill: { alignSelf: "flex-start" },
  pillInput: { minWidth: 220, fontFamily: HAND, fontSize: 32, borderBottomWidth: 2, paddingVertical: 0 },
  pillName: { fontFamily: HAND, fontSize: 34, lineHeight: 42 },
  pillSub: { fontSize: 13.5, fontWeight: "600" },
  cavityPad: { flex: 1, paddingHorizontal: SPACE.md },
  stage: { flex: 1 },
  emptyHint: { marginHorizontal: SPACE.lg, marginBottom: SPACE.sm },
  emptyHintText: { fontSize: 14, fontWeight: "600" },
});
