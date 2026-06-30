// Single source of truth: settings + fridge items, persisted to AsyncStorage.
// One provider, hook accessors — no prop lists threaded through screens.
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { LIGHT, DARK } from "./theme";

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
  binOrder: ["cheese", "dairy", "meat", "packaged", "veg", "other"],
  onboarded: false,
};

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

  useEffect(() => {
    (async () => {
      const [s, it] = await Promise.all([
        load(KEY_SETTINGS, DEFAULT_SETTINGS),
        load(KEY_ITEMS, []),
      ]);
      const merged = { ...DEFAULT_SETTINGS, ...s };
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
          title: "Rescue your food",
          body: `${item.name} expires in ${settings.notifyDays} day${settings.notifyDays === 1 ? "" : "s"}.`,
        },
        // SDK 56 wants a typed trigger, not a bare Date.
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
      });
    } catch {
      return null;
    }
  }, [settings.notify, settings.notifyDays]);

  const addItem = useCallback(async (item) => {
    const full = { id: String(Date.now()), createdAt: Date.now(), photos: [], ...item };
    full.notifId = await scheduleReminder(full);
    setItems((prev) => [full, ...prev]);
  }, [scheduleReminder]);

  const updateItem = useCallback((id, patch) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, []);

  const removeItem = useCallback((id) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target?.notifId) Notifications.cancelScheduledNotificationAsync(target.notifId).catch(() => {});
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  return (
    <Ctx.Provider value={{ ready, palette, settings, updateSettings, items, addItem, updateItem, removeItem, overlayOpen: overlays > 0, addOverlay, removeOverlay }}>
      {children}
    </Ctx.Provider>
  );
}
