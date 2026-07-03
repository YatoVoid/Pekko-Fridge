// "Eat me first" section: a fixed-height, horizontally paged carousel of items
// close to expiring. One card per page (so the fridge below never resizes with
// count), a count badge, page dots, and a one-time swipe hint. Animates its own
// height in/out when the set goes empty <-> non-empty (smoothly pushing the
// fridge down), and fades (never unmounts) during edit mode via the parent's
// editA value.
import React, { useEffect, useRef, useState } from "react";
import { View, Text, Animated, ScrollView, Easing, Dimensions, StyleSheet } from "react-native";
import { useApp } from "../store";
import { ItemRow } from "./Fridge";
import { RADIUS, SPACE } from "../theme";

const HEADER_H = 22;
const CARD_H = 68;
const DOTS_H = 14;
const GAP = 6;
const STRIP_H = HEADER_H + GAP + CARD_H + GAP + DOTS_H + SPACE.sm; // constant, count-independent
const MAX_PAGES = 10;
const DEFAULT_W = Dimensions.get("window").width - 2 * SPACE.lg;

export default function SoonStrip({ items, palette, editA, editing, onOpenItem }) {
  const { addOverlay, removeOverlay } = useApp();
  const hasItems = items.length > 0;
  const pages = items.slice(0, MAX_PAGES);

  const presence = useRef(new Animated.Value(hasItems ? 1 : 0)).current; // JS-driven (height)
  const nudge = useRef(new Animated.Value(0)).current; // native-driven (hint translateX)
  const scrollRef = useRef(null);
  const [pageW, setPageW] = useState(DEFAULT_W);
  const [activeIdx, setActiveIdx] = useState(0);
  const activeIdxRef = useRef(0);
  const dragRef = useRef(false);
  const hintDone = useRef(false);

  // Animate the section's height (and content opacity/translate) in/out.
  useEffect(() => {
    Animated.timing(presence, {
      toValue: hasItems ? 1 : 0,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // height can't use the native driver
    }).start();
  }, [hasItems, presence]);

  // If the list shrinks past the current page, snap back to the first.
  useEffect(() => {
    if (pages.length > 0 && activeIdxRef.current >= pages.length) {
      activeIdxRef.current = 0;
      setActiveIdx(0);
      scrollRef.current?.scrollTo({ x: 0, animated: false });
    }
  }, [pages.length]);

  // One-time nudge so users learn the carousel scrolls (only when >1 page).
  useEffect(() => {
    if (hintDone.current || pages.length < 2) return;
    hintDone.current = true;
    Animated.sequence([
      Animated.delay(600),
      Animated.timing(nudge, { toValue: -14, duration: 170, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(nudge, { toValue: 0, bounciness: 7, speed: 14, useNativeDriver: true }),
    ]).start();
  }, [pages.length >= 2]); // eslint-disable-line react-hooks/exhaustive-deps

  // Never leak the overlay counter (would freeze the page pager).
  useEffect(() => () => { if (dragRef.current) removeOverlay(); }, [removeOverlay]);

  const onBegin = () => { if (!dragRef.current) { dragRef.current = true; addOverlay(); } };
  const release = () => { if (dragRef.current) { dragRef.current = false; removeOverlay(); } };
  const onScroll = (e) => {
    const i = Math.min(pages.length - 1, Math.max(0, Math.round(e.nativeEvent.contentOffset.x / pageW)));
    if (i !== activeIdxRef.current) { activeIdxRef.current = i; setActiveIdx(i); }
  };

  const presenceH = presence.interpolate({ inputRange: [0, 1], outputRange: [0, STRIP_H] });
  const contentTranslate = presence.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });
  const editFade = editA ? editA.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) : 1;

  return (
    <Animated.View style={{ height: presenceH, overflow: "hidden", paddingHorizontal: SPACE.lg }}>
      {/* edit-mode fade — native-driven opacity from parent, kept on its own node */}
      <Animated.View pointerEvents={editing ? "none" : "auto"} style={{ flex: 1, opacity: editFade }}>
        {/* presence — JS-driven opacity + translateY */}
        <Animated.View style={{ flex: 1, opacity: presence, transform: [{ translateY: contentTranslate }] }}>
          <View style={st.header}>
            <Text style={[st.kicker, { color: palette.textSoft }]}>EAT ME FIRST</Text>
            <View style={[st.badge, { backgroundColor: palette.badge.warn.bg }]}>
              <Text style={[st.badgeText, { color: palette.badge.warn.fg }]}>{items.length}</Text>
            </View>
          </View>

          {/* hint nudge — native-driven translateX, its own node */}
          <Animated.View style={{ transform: [{ translateX: nudge }] }}>
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              disableIntervalMomentum
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onLayout={(e) => setPageW(e.nativeEvent.layout.width)}
              onScroll={onScroll}
              onScrollBeginDrag={onBegin}
              onScrollEndDrag={release}
              onMomentumScrollEnd={release}
            >
              {pages.map((it) => (
                <View key={it.id} style={{ width: pageW, height: CARD_H, justifyContent: "center" }}>
                  <ItemRow item={it} palette={palette} onOpenItem={onOpenItem} />
                </View>
              ))}
            </ScrollView>
          </Animated.View>

          <View style={st.dots}>
            {pages.length > 1 && pages.map((_, i) => (
              <View key={i} style={[st.dot, { backgroundColor: i === activeIdx ? palette.accent : palette.line }]} />
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  header: { height: HEADER_H, flexDirection: "row", alignItems: "center", marginBottom: GAP },
  kicker: { fontSize: 11, fontWeight: "800", letterSpacing: 2 },
  badge: { marginLeft: 8, height: 16, minWidth: 16, paddingHorizontal: 6, borderRadius: RADIUS.pill, alignItems: "center", justifyContent: "center" },
  badgeText: { fontSize: 10.5, fontWeight: "800" },
  dots: { height: DOTS_H, marginTop: GAP, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
