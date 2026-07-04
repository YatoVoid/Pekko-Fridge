// Single source of truth: settings + fridge items, persisted to AsyncStorage.
// One provider, hook accessors — no prop lists threaded through screens.
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useColorScheme, Alert, Platform, Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { LIGHT, DARK } from "./theme";
import { daysLeft } from "./lib/expiry";

// Default ordered category list. Order = grid display order.
// Top shelf: slots 0-1 (showUnit). Middle shelf: slots 2-4. WideDrawer: slot 5.
export const DEFAULT_CATEGORIES = [
  { key: "dairy",  label: "Dairy",      skinId: "dairy",  icon: "dairy",  hidden: false },
  { key: "other",  label: "Other",      skinId: "other",  icon: "other",  hidden: false },
  { key: "cheese", label: "Cheese",     skinId: "cheese", icon: "cheese", hidden: false },
  { key: "meat",   label: "Meat",       skinId: "meat",   icon: "meat",   hidden: false },
  { key: "soup",   label: "Soup",       skinId: "soup",   icon: "soup",   hidden: false },
  { key: "veg",    label: "Vegetables", skinId: "veg",    icon: "veg",    hidden: false },
];

const KEY_ITEMS = "pekko.items.v1";
const KEY_SETTINGS = "pekko.settings.v1";

import { DEFAULT_FRIDGE_NAME } from "./theme";

const DEFAULT_SETTINGS = {
  theme: "light",      // "light" | "dark" | "system" — bright by default
  region: "DMY",       // "MDY" | "DMY" | "YMD"
  notify: true,
  notifyDays: 2,
  autoRemoveDays: 7, // delete items this many days after they expire
  fridgeName: DEFAULT_FRIDGE_NAME,
  rescued: 0,          // count of items removed before/on expiry date
  categories: DEFAULT_CATEGORIES, // ordered list — replaces retired binOrder
  onboarded: false,
  batteryPromptShown: false, // one-time "exclude from battery optimization" nudge (Android)
};

// Notification action category: adds "Mark used" / "Snooze 2 days" buttons to each reminder.
const REMINDER_CATEGORY = "pekko-reminder";

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function load(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }) {
  const system = useColorScheme();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);
  const [overlays, setOverlays] = useState(0); // open sheets/modals (freezes page swipe)
  const addOverlay = useCallback(() => setOverlays((n) => n + 1), []);
  const removeOverlay = useCallback(() => setOverlays((n) => Math.max(0, n - 1)), []);

  // Latest state/handlers for the notification-response listener (registered once).
  const settingsRef = useRef(settings); settingsRef.current = settings;
  const itemsRef = useRef(items); itemsRef.current = items;
  const removeItemRef = useRef(null);
  const snoozeItemRef = useRef(null);

  // Register the reminder action buttons once.
  useEffect(() => {
    Notifications.setNotificationCategoryAsync(REMINDER_CATEGORY, [
      { identifier: "used", buttonTitle: "Mark used", options: { opensAppToForeground: true } },
      { identifier: "snooze", buttonTitle: "Snooze 2 days", options: { opensAppToForeground: true } },
    ]).catch(() => {});
  }, []);

  // Handle taps on a reminder's action buttons.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
      const action = resp.actionIdentifier;
      const itemId = resp.notification?.request?.content?.data?.itemId;
      if (!itemId) return;
      if (action === "used") removeItemRef.current?.(itemId);
      else if (action === "snooze") snoozeItemRef.current?.(itemId);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    (async () => {
      const [s, it] = await Promise.all([
        load(KEY_SETTINGS, DEFAULT_SETTINGS),
        load(KEY_ITEMS, []),
      ]);
      const merged = { ...DEFAULT_SETTINGS, ...s };
      // Migrate: ensure categories array (upgrade from versions using binOrder).
      if (!Array.isArray(merged.categories)) merged.categories = DEFAULT_CATEGORIES;
      delete merged.binOrder; // retired in favour of categories order
      setSettings(merged);
      // migrate retired "packaged" category → "other"
      const migrated = (Array.isArray(it) ? it : []).map((i) =>
        i.category === "packaged" ? { ...i, category: "other" } : i
      );
      // auto-remove items that expired more than autoRemoveDays ago
      const cutoff = Date.now() - (merged.autoRemoveDays ?? 7) * 86400000;
      const kept = migrated.filter((i) => !(i.exp && new Date(i.exp).getTime() < cutoff));
      setItems(kept);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY_SETTINGS, JSON.stringify(settings)).catch(() => {});
  }, [settings, ready]);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY_ITEMS, JSON.stringify(items)).catch(() => {});
  }, [items, ready]);

  const palette =
    settings.theme === "light" ? LIGHT :
    settings.theme === "dark" ? DARK :
    system === "dark" ? DARK : LIGHT;

  const updateSettings = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), []);

  const scheduleReminder = useCallback(async (item) => {
    if (!settings.notify || !item.exp) return null;
    try {
      const { status } = await Notifications.getPermissionsAsync();
      let ok = status === "granted";
      if (!ok) ok = (await Notifications.requestPermissionsAsync()).status === "granted";
      if (!ok) return null;
      const when = new Date(item.exp);
      when.setDate(when.getDate() - settings.notifyDays);
      when.setHours(9, 0, 0, 0);
      if (when <= new Date()) return null; // already too late to warn
      return await Notifications.scheduleNotificationAsync({
        content: {
          title: "Expiring soon",
          body: `${item.name} expires in ${settings.notifyDays} day${settings.notifyDays === 1 ? "" : "s"}.`,
          categoryIdentifier: REMINDER_CATEGORY, // adds Mark used / Snooze buttons
          data: { itemId: item.id },
        },
        // SDK 56 wants a typed trigger, not a bare Date.
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
      });
    } catch {
      return null;
    }
  }, [settings.notify, settings.notifyDays]);

  // One-time nudge (Android only) to exclude Pekko from battery optimization, so
  // aggressive OEM battery managers don't silently kill scheduled reminders.
  const maybeBatteryPrompt = useCallback(() => {
    if (Platform.OS !== "android" || settingsRef.current.batteryPromptShown) return;
    setSettings((s) => ({ ...s, batteryPromptShown: true }));
    Alert.alert(
      "Keep reminders on time",
      "Some phones pause background apps and can delay or drop reminders. For alerts that always arrive, allow Pekko to run without battery restrictions.",
      [
        { text: "Not now", style: "cancel" },
        { text: "Open settings", onPress: () => Linking.openSettings().catch(() => {}) },
      ],
    );
  }, []);

  const addItem = useCallback(async (item) => {
    const full = { id: String(Date.now()), createdAt: Date.now(), photos: [], ...item };
    full.notifId = await scheduleReminder(full);
    setItems((prev) => [full, ...prev]);
    if (full.notifId) maybeBatteryPrompt(); // first real reminder → nudge once
  }, [scheduleReminder, maybeBatteryPrompt]);

  // Snooze: reschedule this item's reminder for ~2 days from now.
  const snoozeItem = useCallback(async (id) => {
    const item = itemsRef.current.find((i) => i.id === id);
    if (!item) return;
    if (item.notifId) Notifications.cancelScheduledNotificationAsync(item.notifId).catch(() => {});
    const when = new Date();
    when.setDate(when.getDate() + 2);
    when.setHours(9, 0, 0, 0);
    let notifId = null;
    try {
      notifId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Expiring soon",
          body: `${item.name}: reminder snoozed.`,
          categoryIdentifier: REMINDER_CATEGORY,
          data: { itemId: id },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
      });
    } catch {}
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, notifId } : i)));
  }, []);
  snoozeItemRef.current = snoozeItem;

  const updateItem = useCallback((id, patch) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, []);

  const removeItem = useCallback((id) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target?.notifId) Notifications.cancelScheduledNotificationAsync(target.notifId).catch(() => {});
      const d = target?.exp ? daysLeft(target.exp) : null;
      if (d !== null && d >= 0) setSettings((s) => ({ ...s, rescued: (s.rescued || 0) + 1 }));
      return prev.filter((i) => i.id !== id);
    });
  }, []);
  removeItemRef.current = removeItem;

  return (
    <Ctx.Provider value={{ ready, palette, settings, updateSettings, items, addItem, updateItem, removeItem, overlayOpen: overlays > 0, addOverlay, removeOverlay }}>
      {children}
    </Ctx.Provider>
  );
}
