// Fridge "edit mode" — a uniform 2-column grid of draggable, wiggling category
// tiles (the iOS home-screen-edit rendering of settings.categories). Reorder by
// drag, tap a tile to rename inline, tap the corner badge to hide (built-ins) or
// delete (custom folders), tap the dashed "+" tile to add. Data is committed to
// the store on every change, so it is always persisted — see FridgeScreen.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TextInput, Animated, PanResponder, Keyboard, Dimensions, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { resolveCat, catColors, RADIUS, SPACE } from "../theme";
import { CategoryIcon } from "./FoodIcons";
import { PlusIcon, CloseIcon, EyeIcon, EyeOffIcon } from "./icons";

const GAP = 12;
const COLS = 2;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

export default function EditGrid({
  cats, palette, width, height, defaultKeys, editing, canAdd,
  renamingKey, renameDraft, setRenameDraft,
  onStartRename, onCommitRename, onReorder, onBadge, onAdd,
}) {
  const tileW = (width - GAP) / COLS;
  const count = cats.length + (canAdd ? 1 : 0); // +1 for the "add" tile
  const rows = Math.max(1, Math.ceil(count / COLS));
  const tileH = clamp(Math.floor((height - (rows - 1) * GAP) / rows), 62, 92);

  const xy = useMemo(
    () => (i) => ({ x: (i % COLS) * (tileW + GAP), y: Math.floor(i / COLS) * (tileH + GAP) }),
    [tileW, tileH],
  );

  // Live order (keys) — diverges from committed `cats` only during a drag.
  const [order, setOrder] = useState(cats.map((c) => c.key));
  const orderRef = useRef(order);
  orderRef.current = order;
  const [dragKey, setDragKey] = useState(null);
  const dragRef = useRef(null);
  dragRef.current = dragKey;

  // Resync when the committed list changes (add / delete) and we're not dragging.
  useEffect(() => {
    if (!dragRef.current) setOrder(cats.map((c) => c.key));
  }, [cats]);

  // Keyboard avoidance: the grid is absolutely positioned (no ScrollView), so when
  // renaming a lower tile the keyboard covers it. Lift the whole grid just enough
  // to clear the keyboard for the tile being renamed.
  const rootRef = useRef(null);
  const lift = useRef(new Animated.Value(0)).current;
  const renamingKeyRef = useRef(renamingKey);
  renamingKeyRef.current = renamingKey;

  useEffect(() => {
    const onShow = (e) => {
      if (!renamingKeyRef.current) return;
      const kbTop = Dimensions.get("window").height - e.endCoordinates.height;
      requestAnimationFrame(() => {
        rootRef.current?.measureInWindow((_x, y) => {
          const slot = orderRef.current.indexOf(renamingKeyRef.current);
          if (slot < 0) return;
          const tileBottom = y + xy(slot).y + tileH; // measure is pre-transform (base) Y
          const overlap = tileBottom - kbTop + 20;
          Animated.timing(lift, { toValue: overlap > 0 ? -overlap : 0, duration: 220, useNativeDriver: true }).start();
        });
      });
    };
    const onHide = () => Animated.timing(lift, { toValue: 0, duration: 180, useNativeDriver: true }).start();
    const s1 = Keyboard.addListener("keyboardDidShow", onShow);
    const s2 = Keyboard.addListener("keyboardDidHide", onHide);
    return () => { s1.remove(); s2.remove(); };
  }, [tileW, tileH]); // eslint-disable-line react-hooks/exhaustive-deps

  const moveTo = (key, toIdx) => {
    setOrder((prev) => {
      const from = prev.indexOf(key);
      if (from < 0 || toIdx < 0 || toIdx === from) return prev;
      const next = [...prev];
      next.splice(from, 1);
      next.splice(toIdx, 0, key);
      return next;
    });
  };
  const commit = () => {
    const byKey = new Map(cats.map((c) => [c.key, c]));
    onReorder(orderRef.current.map((k) => byKey.get(k)).filter(Boolean));
  };

  return (
    <Animated.View ref={rootRef} style={{ width, height, transform: [{ translateY: lift }] }}>
      {cats.map((cat, ci) => (
        <Tile
          key={cat.key}
          cat={cat}
          palette={palette}
          tileW={tileW}
          tileH={tileH}
          slotIndex={order.indexOf(cat.key) < 0 ? ci : order.indexOf(cat.key)}
          rows={rows}
          realCount={cats.length}
          editing={editing}
          isDragging={dragKey === cat.key}
          isRenaming={renamingKey === cat.key}
          hasBadge={cat.key !== "other"}
          isCustom={!defaultKeys.has(cat.key)}
          xy={xy}
          renameDraft={renameDraft}
          setRenameDraft={setRenameDraft}
          onCommitRename={onCommitRename}
          onStartRename={onStartRename}
          onBadge={onBadge}
          setDragKey={setDragKey}
          moveTo={moveTo}
          commit={commit}
        />
      ))}
      {canAdd && (
        <AddTile
          palette={palette}
          tileW={tileW}
          tileH={tileH}
          pos={xy(cats.length)}
          onAdd={onAdd}
        />
      )}
    </Animated.View>
  );
}

function Tile({
  cat, palette, tileW, tileH, slotIndex, rows, realCount, editing, isDragging, isRenaming,
  hasBadge, isCustom, xy, renameDraft, setRenameDraft, onCommitRename, onStartRename,
  onBadge, setDragKey, moveTo, commit,
}) {
  const rc = resolveCat(cat.key, [cat]);
  const c = catColors(rc, palette.mode);

  const pos = useRef(new Animated.ValueXY(xy(slotIndex))).current;
  const scale = useRef(new Animated.Value(1)).current;
  const wig = useRef(new Animated.Value(0)).current;

  // Refs so the PanResponder (created once) always reads fresh values.
  const slotRef = useRef(slotIndex); slotRef.current = slotIndex;
  const rowsRef = useRef(rows); rowsRef.current = rows;
  const realRef = useRef(realCount); realRef.current = realCount;
  const dimsRef = useRef({ tileW, tileH }); dimsRef.current = { tileW, tileH };
  const xyRef = useRef(xy); xyRef.current = xy;
  const renamingRef = useRef(isRenaming); renamingRef.current = isRenaming;
  const draggingRef = useRef(false);
  const dragActiveRef = useRef(false);
  const grant = useRef({ x: 0, y: 0, t: 0 });
  const start = useRef({ x: 0, y: 0 });
  const badgeRef = useRef(hasBadge); badgeRef.current = hasBadge;
  const moveToRef = useRef(moveTo); moveToRef.current = moveTo;
  const commitRef = useRef(commit); commitRef.current = commit;
  const onBadgeRef = useRef(onBadge); onBadgeRef.current = onBadge;
  const onRenameRef = useRef(onStartRename); onRenameRef.current = onStartRename;
  const setDragRef = useRef(setDragKey); setDragRef.current = setDragKey;

  // Slide to the assigned slot whenever order changes (unless this tile is dragging).
  useEffect(() => {
    if (draggingRef.current) return;
    Animated.spring(pos, { toValue: xy(slotIndex), useNativeDriver: true, friction: 8, tension: 80 }).start();
  }, [slotIndex, tileW, tileH]); // eslint-disable-line react-hooks/exhaustive-deps

  // Wiggle loop — staggered per slot. Runs ONLY in edit mode (stops the instant
  // edit mode ends, so tiles fade out static instead of flickering during the
  // transition); also paused while dragging or renaming.
  useEffect(() => {
    if (!editing || isDragging || isRenaming) { wig.stopAnimation(() => wig.setValue(0)); return; }
    let loop;
    const t = setTimeout(() => {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(wig, { toValue: 1, duration: 130, useNativeDriver: true }),
          Animated.timing(wig, { toValue: -1, duration: 130, useNativeDriver: true }),
          Animated.timing(wig, { toValue: 0, duration: 130, useNativeDriver: true }),
        ]),
      );
      loop.start();
    }, (slotIndex % 4) * 60);
    return () => { clearTimeout(t); loop && loop.stop(); };
  }, [editing, isDragging, isRenaming]); // eslint-disable-line react-hooks/exhaustive-deps

  const pan = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => !renamingRef.current,
      onMoveShouldSetPanResponder: (_e, g) => !renamingRef.current && (Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3),
      onPanResponderGrant: (e) => {
        grant.current = { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY, t: Date.now() };
        start.current = xyRef.current(slotRef.current);
        draggingRef.current = true;
        setDragRef.current(null); // will set on first real move to avoid flicker on taps
        pos.stopAnimation();
      },
      onPanResponderMove: (e, g) => {
        if (!draggingRef.current) return;
        const s = start.current;
        pos.setValue({ x: s.x + g.dx, y: s.y + g.dy });
        if (Math.abs(g.dx) + Math.abs(g.dy) > 6) {
          if (dragActiveRef.current !== true) {
            dragActiveRef.current = true;
            setDragRef.current(cat.key);
            Animated.spring(scale, { toValue: 1.08, useNativeDriver: true, friction: 7 }).start();
            Haptics.selectionAsync().catch(() => {});
          }
          const { tileW: tw, tileH: th } = dimsRef.current;
          const col = clamp(Math.round((s.x + g.dx) / (tw + GAP)), 0, COLS - 1);
          const row = clamp(Math.round((s.y + g.dy) / (th + GAP)), 0, rowsRef.current - 1);
          const idx = Math.min(row * COLS + col, realRef.current - 1);
          if (idx !== slotRef.current) { moveToRef.current(cat.key, idx); Haptics.selectionAsync().catch(() => {}); }
        }
      },
      onPanResponderRelease: (_e, g) => {
        const gr = grant.current;
        const moved = Math.abs(g.dx) + Math.abs(g.dy);
        const tap = moved < 8 && Date.now() - gr.t < 320 && !dragActiveRef.current;
        draggingRef.current = false;
        dragActiveRef.current = false;
        setDragRef.current(null);
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
        if (tap) {
          const { tileW: tw } = dimsRef.current;
          // Generous invisible hit zone around the corner badge (bigger than the
          // 28pt circle) so a slightly-off tap still lands on hide/delete.
          if (badgeRef.current && gr.x > tw - 58 && gr.y < 54) onBadgeRef.current(cat);
          else onRenameRef.current(cat);
          Animated.spring(pos, { toValue: xyRef.current(slotRef.current), useNativeDriver: true, friction: 8, tension: 80 }).start();
        } else {
          commitRef.current();
          Animated.spring(pos, { toValue: xyRef.current(slotRef.current), useNativeDriver: true, friction: 8, tension: 80 }).start();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
      },
      onPanResponderTerminate: () => {
        draggingRef.current = false;
        dragActiveRef.current = false;
        setDragRef.current(null);
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
        Animated.spring(pos, { toValue: xyRef.current(slotRef.current), useNativeDriver: true, friction: 8, tension: 80 }).start();
      },
    }),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Memoized so re-renders (e.g. toggling hide/show) don't hand the transform a
  // fresh interpolation node, which would re-attach and visibly stutter the wiggle.
  const rotate = useMemo(() => wig.interpolate({ inputRange: [-1, 1], outputRange: ["-1.7deg", "1.7deg"] }), []); // eslint-disable-line react-hooks/exhaustive-deps
  const dimmed = cat.hidden ? 0.42 : 1;
  // Scale contents to the tile height so short (cramped) tiles never overflow.
  const icWrap = Math.max(28, Math.min(42, tileH - 24));
  const glyph = Math.round(icWrap * 0.62);
  const lines = tileH < 74 ? 1 : 2;
  const fontSize = tileH < 74 ? 14.5 : 15.5;

  return (
    <Animated.View
      {...pan.panHandlers}
      style={[
        t.tile,
        {
          position: "absolute", width: tileW, height: tileH,
          backgroundColor: palette.surface, borderColor: c.accent,
          zIndex: isDragging ? 20 : 1,
          // Resting tiles are flat (border gives definition); only the lifted tile
          // casts a shadow — avoids dark shadow artifacts during the fade transition.
          shadowColor: "#000", shadowOpacity: isDragging ? 0.18 : 0,
          shadowRadius: isDragging ? 14 : 0, shadowOffset: { width: 0, height: isDragging ? 8 : 0 },
          elevation: isDragging ? 8 : 0,
          transform: [{ translateX: pos.x }, { translateY: pos.y }, { rotate }, { scale }],
        },
      ]}
    >
      <View style={[t.inner, { opacity: dimmed }]}>
        <View style={[t.iconWrap, { width: icWrap, height: icWrap, backgroundColor: c.tint }]}>
          <CategoryIcon catKey={cat.icon || cat.key} size={glyph} />
        </View>
        {isRenaming ? (
          <TextInput
            value={renameDraft}
            onChangeText={setRenameDraft}
            onBlur={onCommitRename}
            onSubmitEditing={onCommitRename}
            autoFocus
            selectTextOnFocus
            maxLength={18}
            returnKeyType="done"
            placeholder="Name"
            placeholderTextColor={palette.textSoft}
            style={[t.input, { color: palette.text, borderColor: c.accent, backgroundColor: palette.surfaceAlt, fontSize }]}
          />
        ) : (
          <Text numberOfLines={lines} style={[t.label, { color: palette.text, fontSize }]}>{cat.label}</Text>
        )}
      </View>

      {hasBadge && !isRenaming && (
        <View style={[t.badge, { backgroundColor: palette.surface, borderColor: palette.line }]} pointerEvents="none">
          {isCustom ? (
            <CloseIcon color={palette.badge.bad.fg} size={16} />
          ) : cat.hidden ? (
            <EyeOffIcon color={palette.textSoft} size={16} />
          ) : (
            <EyeIcon color={palette.textSoft} size={16} />
          )}
        </View>
      )}
    </Animated.View>
  );
}

function AddTile({ palette, tileW, tileH, pos, onAdd }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pan = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, friction: 7 }).start(),
      onPanResponderRelease: (_e, g) => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
        if (Math.abs(g.dx) + Math.abs(g.dy) < 10) onAdd();
      },
      onPanResponderTerminate: () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }).start(),
    }),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );
  return (
    <Animated.View
      {...pan.panHandlers}
      style={[
        t.tile, t.addTile,
        {
          position: "absolute", width: tileW, height: tileH,
          left: pos.x, top: pos.y, borderColor: palette.line,
          transform: [{ scale }],
        },
      ]}
    >
      <PlusIcon color={palette.textSoft} size={24} />
      <Text style={[t.addLabel, { color: palette.textSoft }]}>Add folder</Text>
    </Animated.View>
  );
}

const t = StyleSheet.create({
  tile: {
    borderRadius: RADIUS.md, borderWidth: 1.5,
    paddingHorizontal: SPACE.sm + 2, paddingVertical: SPACE.sm,
    flexDirection: "row", alignItems: "center", gap: SPACE.sm,
  },
  inner: { flex: 1, flexDirection: "row", alignItems: "center", gap: SPACE.sm, overflow: "hidden" },
  iconWrap: { borderRadius: RADIUS.sm, alignItems: "center", justifyContent: "center" },
  label: { flex: 1, fontWeight: "800", letterSpacing: 0.2 },
  input: { flex: 1, borderWidth: 1.5, borderRadius: RADIUS.sm, paddingHorizontal: SPACE.sm, paddingVertical: 6, fontWeight: "800" },
  badge: {
    position: "absolute", top: -8, right: -8, width: 28, height: 28, borderRadius: 14, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  addTile: { borderStyle: "dashed", justifyContent: "center", gap: SPACE.xs },
  addLabel: { fontSize: 14, fontWeight: "800" },
});
