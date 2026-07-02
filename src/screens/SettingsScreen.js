import React, { useEffect, useRef, useState } from "react";
import { View, Text, Switch, Pressable, ScrollView, TextInput, StyleSheet, Linking, PanResponder } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useApp, DEFAULT_CATEGORIES } from "../store";
import { CATEGORY_SKINS, RADIUS, SPACE } from "../theme";
import { CategoryIcon } from "../components/FoodIcons";

function Segmented({ options, value, onChange, palette }) {
  return (
    <View style={[s.seg, { backgroundColor: palette.surfaceAlt }]}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => { Haptics.selectionAsync().catch(() => {}); onChange(o.value); }}
            style={[s.segItem, on && { backgroundColor: palette.accent }]}
          >
            <Text style={[s.segText, { color: on ? palette.accentInk : palette.textSoft }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Card({ title, subtitle, palette, children }) {
  return (
    <View style={[s.card, { backgroundColor: palette.surface, borderColor: palette.line }]}>
      <Text style={[s.cardTitle, { color: palette.text }]}>{title}</Text>
      {subtitle ? <Text style={[s.cardSub, { color: palette.textSoft }]}>{subtitle}</Text> : null}
      <View style={{ height: SPACE.md }} />
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const { palette, settings, updateSettings, nav } = useApp();
  const insets = useSafeAreaInsets();
  const d = settings.notifyDays;

  const scrollRef = useRef(null);
  const foldersY = useRef(0);
  const [pulse, setPulse] = useState(false);

  // When another screen asks to focus the Folders section, scroll to it and pulse.
  useEffect(() => {
    if (nav?.focus !== "folders") return;
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, foldersY.current - 12), animated: true });
      setPulse(true);
      setTimeout(() => setPulse(false), 1400);
    }, 80);
    return () => clearTimeout(t);
  }, [nav]);

  return (
    <ScrollView
      ref={scrollRef}
      style={{ backgroundColor: palette.bg }}
      contentContainerStyle={[s.content, { paddingBottom: 120 + insets.bottom }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[s.kicker, { color: palette.textSoft }]}>SETTINGS</Text>
      <Text style={[s.h1, { color: palette.text }]}>Make it yours</Text>
      <View style={{ height: SPACE.lg }} />

      <Card title="Fridge name" subtitle="What should we call your fridge?" palette={palette}>
        <TextInput
          value={settings.fridgeName}
          onChangeText={(t) => updateSettings({ fridgeName: t })}
          placeholder="My Fridge"
          placeholderTextColor={palette.textSoft}
          maxLength={28}
          style={[s.input, { color: palette.text, backgroundColor: palette.surfaceAlt, borderColor: palette.line }]}
        />
      </Card>

      <Card title="Appearance" subtitle="Cream daylight or soft ink night." palette={palette}>
        <Segmented
          palette={palette}
          value={settings.theme}
          onChange={(v) => updateSettings({ theme: v })}
          options={[{ label: "Light", value: "light" }, { label: "Dark", value: "dark" }, { label: "System", value: "system" }]}
        />
      </Card>

      <Card title="Date format" subtitle="How labels and dates are read." palette={palette}>
        <Segmented
          palette={palette}
          value={settings.region}
          onChange={(v) => updateSettings({ region: v })}
          options={[{ label: "MM/DD/YYYY", value: "MDY" }, { label: "DD/MM/YYYY", value: "DMY" }, { label: "YYYY/MM/DD", value: "YMD" }]}
        />
      </Card>

      <Card title="Reminders" subtitle="A gentle nudge before food spoils." palette={palette}>
        <View style={s.row}>
          <Text style={[s.rowLabel, { color: palette.text }]}>Push reminders</Text>
          <Switch
            value={settings.notify}
            onValueChange={(v) => { Haptics.selectionAsync().catch(() => {}); updateSettings({ notify: v }); }}
            trackColor={{ true: palette.accent, false: palette.line }}
            thumbColor="#fff"
          />
        </View>

        {settings.notify && (
          <>
            <View style={{ height: SPACE.md }} />
            <Text style={[s.rowLabel, { color: palette.text }]}>Remind me {d} day{d === 1 ? "" : "s"} before</Text>
            <View style={{ height: SPACE.sm }} />
            <View style={s.stepper}>
              <Step palette={palette} label="–" onPress={() => updateSettings({ notifyDays: Math.max(1, d - 1) })} />
              <Text style={[s.stepVal, { color: palette.text }]}>{d}</Text>
              <Step palette={palette} label="+" onPress={() => updateSettings({ notifyDays: Math.min(14, d + 1) })} />
            </View>
          </>
        )}
      </Card>

      <Card title="Auto-cleanup" subtitle="Tidy the fridge by removing old expired items." palette={palette}>
        <Text style={[s.rowLabel, { color: palette.text }]}>
          Remove {settings.autoRemoveDays} day{settings.autoRemoveDays === 1 ? "" : "s"} after expiry
        </Text>
        <View style={{ height: SPACE.sm }} />
        <View style={s.stepper}>
          <Step palette={palette} label="–" onPress={() => updateSettings({ autoRemoveDays: Math.max(1, settings.autoRemoveDays - 1) })} />
          <Text style={[s.stepVal, { color: palette.text }]}>{settings.autoRemoveDays}</Text>
          <Step palette={palette} label="+" onPress={() => updateSettings({ autoRemoveDays: Math.min(30, settings.autoRemoveDays + 1) })} />
        </View>
      </Card>

      <View onLayout={(e) => { foldersY.current = e.nativeEvent.layout.y; }}>
        <FoldersCard palette={palette} settings={settings} updateSettings={updateSettings} highlight={pulse} />
      </View>

      <Text style={[s.footer, { color: palette.textSoft }]}>
        Pekko runs 100% on this phone. No accounts, no cloud, no tracking.
      </Text>

      {(settings.rescued > 0) && (
        <Text style={[s.footer, { color: palette.textSoft }]}>
          You've rescued {settings.rescued} item{settings.rescued === 1 ? "" : "s"} so far.
        </Text>
      )}

      <Pressable
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          Linking.openURL("https://buymeacoffee.com/walilambere").catch(() => {});
        }}
        style={s.tip}
      >
        <Text style={[s.tipText, { color: palette.textSoft }]}>
          Made by one person. If Pekko helps you, you can{" "}
          <Text style={s.tipLink}>buy me a coffee</Text>.
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function Step({ label, onPress, palette }) {
  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); onPress(); }}
      style={[s.step, { backgroundColor: palette.surfaceAlt }]}
    >
      <Text style={[s.stepText, { color: palette.text }]}>{label}</Text>
    </Pressable>
  );
}

// ── Folders card ─────────────────────────────────────────────────────────────

const ROW_H = 56; // fixed height lets PanResponder compute integer offsets

function FolderRow({ cat, index, catsRef, palette, updateSettings, canDelete, onToggleHidden, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(cat.label);
  // Stable refs so PanResponder closure never goes stale.
  const indexRef = useRef(index);
  indexRef.current = index;

  const pan = useRef(
    PanResponder.create({
      // Grab-on-touch (per CLAUDE.md): handle has no tappable children.
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      },
      onPanResponderRelease: (_e, g) => {
        const i = indexRef.current;
        const cats = catsRef.current;
        const offset = Math.round(g.dy / ROW_H);
        if (offset === 0) return;
        const newIdx = Math.max(0, Math.min(cats.length - 1, i + offset));
        if (newIdx !== i) {
          const newCats = [...cats];
          const [moved] = newCats.splice(i, 1);
          newCats.splice(newIdx, 0, moved);
          updateSettings({ categories: newCats });
        }
      },
      onPanResponderTerminate: () => {},
    })
  ).current;

  const commitRename = () => {
    onRename(draft.trim() || cat.label);
    setEditing(false);
  };
  const canHide = cat.key !== "other"; // "Other" is always visible (catches orphaned items)

  return (
    <View style={[fr.row, { borderColor: palette.line, height: ROW_H }]}>
      {/* Drag handle — grab-on-touch */}
      <View {...pan.panHandlers} style={fr.handle}>
        <Text style={[fr.handleIcon, { color: palette.textSoft }]}>⠿</Text>
      </View>

      {editing ? (
        <View style={fr.editRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onBlur={commitRename}
            onSubmitEditing={commitRename}
            maxLength={24}
            style={[fr.renameInput, { color: palette.text, borderColor: palette.accent, backgroundColor: palette.surfaceAlt }]}
          />
          {canDelete && (
            <Pressable onPress={onDelete} hitSlop={6} style={fr.delBtn}>
              <Text style={[fr.delText, { color: palette.badge.bad.fg }]}>Delete</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <Pressable style={fr.labelArea} onPress={() => { setDraft(cat.label); setEditing(true); }}>
          <CategoryIcon catKey={cat.icon || cat.key} size={18} />
          <Text style={[fr.rowLabel, { color: cat.hidden ? palette.textSoft : palette.text }]}>{cat.label}</Text>
          <Text style={[fr.editHint, { color: palette.accent }]}>Edit</Text>
        </Pressable>
      )}

      {!editing && (canHide ? (
        <Switch
          value={!cat.hidden}
          onValueChange={onToggleHidden}
          trackColor={{ true: palette.accent, false: palette.line }}
          thumbColor="#fff"
        />
      ) : (
        <View style={{ width: 51 }} />
      ))}
    </View>
  );
}

const DEFAULT_KEYS = new Set(DEFAULT_CATEGORIES.map((c) => c.key));

function FoldersCard({ palette, settings, updateSettings, highlight }) {
  const cats = settings.categories || DEFAULT_CATEGORIES;
  const [addingFolder, setAddingFolder] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newSkinId, setNewSkinId] = useState("other");

  // Stable ref used by FolderRow PanResponder closures.
  const catsRef = useRef(cats);
  catsRef.current = cats;

  const toggleHidden = (key) => {
    updateSettings({ categories: catsRef.current.map((c) => c.key === key ? { ...c, hidden: !c.hidden } : c) });
  };
  const rename = (key, label) => {
    updateSettings({ categories: catsRef.current.map((c) => c.key === key ? { ...c, label } : c) });
  };
  // Delete a user-created folder. Built-in folders can only be hidden, not deleted.
  // Any items still in it fall back to "Other" automatically (see FridgeScreen inCat).
  const deleteFolder = (key) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    updateSettings({ categories: catsRef.current.filter((c) => c.key !== key) });
  };
  const addFolder = () => {
    if (!newLabel.trim()) return;
    Haptics.selectionAsync().catch(() => {});
    const newCat = { key: String(Date.now()), label: newLabel.trim(), skinId: newSkinId, icon: "other", hidden: false };
    updateSettings({ categories: [...catsRef.current, newCat] });
    setNewLabel("");
    setNewSkinId("other");
    setAddingFolder(false);
  };

  return (
    <View style={[s.card, { backgroundColor: palette.surface, borderColor: highlight ? palette.accent : palette.line }]}>
      <Text style={[s.cardTitle, { color: palette.text }]}>Folders</Text>
      <Text style={[s.cardSub, { color: palette.textSoft }]}>Reorder, rename, hide, or add food bins. Drag ⠿ to move.</Text>
      <View style={{ height: SPACE.md }} />

      {cats.map((cat, index) => (
        <FolderRow
          key={cat.key}
          cat={cat}
          index={index}
          catsRef={catsRef}
          palette={palette}
          updateSettings={updateSettings}
          canDelete={!DEFAULT_KEYS.has(cat.key)}
          onToggleHidden={() => toggleHidden(cat.key)}
          onRename={(label) => rename(cat.key, label)}
          onDelete={() => deleteFolder(cat.key)}
        />
      ))}

      {addingFolder ? (
        <View style={[fr.addForm, { borderColor: palette.line }]}>
          <TextInput
            value={newLabel}
            onChangeText={setNewLabel}
            placeholder="Folder name"
            placeholderTextColor={palette.textSoft}
            autoFocus
            maxLength={24}
            onSubmitEditing={addFolder}
            style={[fr.addInput, { color: palette.text, backgroundColor: palette.surfaceAlt, borderColor: palette.line }]}
          />
          <View style={fr.skinRow}>
            {CATEGORY_SKINS.map((sk) => {
              const on = sk.key === newSkinId;
              return (
                <Pressable key={sk.key} onPress={() => setNewSkinId(sk.key)}
                  style={[fr.skinDot, { backgroundColor: sk.tint, borderWidth: on ? 2 : 0, borderColor: palette.accent }]} />
              );
            })}
          </View>
          <View style={fr.addButtons}>
            <Pressable onPress={() => { setAddingFolder(false); setNewLabel(""); }}
              style={[fr.addCancelBtn, { borderColor: palette.line }]}>
              <Text style={[fr.addCancelText, { color: palette.textSoft }]}>Cancel</Text>
            </Pressable>
            <Pressable onPress={addFolder} disabled={!newLabel.trim()}
              style={[fr.addSaveBtn, { backgroundColor: palette.accent, opacity: newLabel.trim() ? 1 : 0.45 }]}>
              <Text style={[fr.addSaveText, { color: palette.accentInk }]}>Add</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable onPress={() => setAddingFolder(true)} style={[fr.addBtn, { borderColor: palette.line }]}>
          <Text style={[fr.addBtnText, { color: palette.textSoft }]}>+ Add folder</Text>
        </Pressable>
      )}
    </View>
  );
}

const fr = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1, gap: SPACE.sm },
  handle: { width: 36, alignItems: "center", justifyContent: "center" },
  handleIcon: { fontSize: 22, lineHeight: 28 },
  labelArea: { flex: 1, flexDirection: "row", alignItems: "center", gap: SPACE.sm, paddingVertical: SPACE.xs },
  rowLabel: { fontSize: 15.5, fontWeight: "700", flex: 1 },
  editHint: { fontSize: 12, fontWeight: "700" },
  editRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: SPACE.sm },
  renameInput: { flex: 1, borderWidth: 1.5, borderRadius: RADIUS.sm, paddingHorizontal: SPACE.sm, paddingVertical: 8, fontSize: 15.5, fontWeight: "700" },
  delBtn: { paddingHorizontal: SPACE.xs, paddingVertical: 6 },
  delText: { fontSize: 13, fontWeight: "800" },
  addBtn: { marginTop: SPACE.md, borderWidth: 1, borderStyle: "dashed", borderRadius: RADIUS.md, paddingVertical: 12, alignItems: "center" },
  addBtnText: { fontSize: 14, fontWeight: "700" },
  addForm: { marginTop: SPACE.md, borderWidth: 1, borderRadius: RADIUS.md, padding: SPACE.md, gap: SPACE.sm },
  addInput: { borderWidth: 1, borderRadius: RADIUS.sm, paddingHorizontal: SPACE.md, paddingVertical: 10, fontSize: 16 },
  skinRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACE.sm },
  skinDot: { width: 28, height: 28, borderRadius: 14 },
  addButtons: { flexDirection: "row", gap: SPACE.sm, justifyContent: "flex-end" },
  addCancelBtn: { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACE.md, paddingVertical: 9 },
  addCancelText: { fontSize: 14, fontWeight: "700" },
  addSaveBtn: { borderRadius: RADIUS.md, paddingHorizontal: SPACE.md, paddingVertical: 9 },
  addSaveText: { fontSize: 14, fontWeight: "800" },
});

// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  content: { padding: SPACE.lg, paddingTop: SPACE.xl + 12, paddingBottom: 120, gap: SPACE.md },
  kicker: { fontSize: 12, fontWeight: "800", letterSpacing: 2 },
  h1: { fontSize: 30, fontWeight: "900", marginTop: 4 },
  card: { borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACE.lg },
  cardTitle: { fontSize: 18, fontWeight: "800" },
  cardSub: { fontSize: 13.5, marginTop: 3 },
  input: { borderRadius: RADIUS.md, borderWidth: 1, paddingHorizontal: SPACE.md, paddingVertical: 13, fontSize: 16 },
  seg: { flexDirection: "row", borderRadius: RADIUS.pill, padding: 4, gap: 4 },
  segItem: { flex: 1, paddingVertical: 11, borderRadius: RADIUS.pill, alignItems: "center" },
  segText: { fontSize: 13, fontWeight: "800" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowLabel: { fontSize: 15.5, fontWeight: "700" },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SPACE.lg },
  step: { width: 52, height: 52, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
  stepText: { fontSize: 26, fontWeight: "800" },
  stepVal: { fontSize: 30, fontWeight: "900", minWidth: 40, textAlign: "center" },
  footer: { fontSize: 13, textAlign: "center", marginTop: SPACE.md, lineHeight: 20 },
  tip: { marginTop: SPACE.sm, paddingVertical: SPACE.sm },
  tipText: { fontSize: 12.5, textAlign: "center", lineHeight: 18, opacity: 0.9 },
  tipLink: { fontWeight: "800", textDecorationLine: "underline" },
});
