// Kawaii skeuomorphic tokens — warm cream fridge interior, soft pastel bins.
// Colors lifted from FridgeUiRedesignSpec/My Fridge.dc.html.

// Each category has a light (bright pastel) and dark (deep muted) skin so the
// bins sit naturally on either fridge interior.
export const CATEGORIES = [
  { key: "cheese", label: "Cheese", tint: "#FBF1D4", tintLo: "#F6E7B8", accent: "#F2D680", ink: "#7A6520",
    dark: { tint: "#473B1F", tintLo: "#372D15", accent: "#E8CF86", ink: "#EAD79A" } },
  { key: "meat", label: "Meat", tint: "#F8E4E5", tintLo: "#F1CFD2", accent: "#EFB4BC", ink: "#99535E",
    dark: { tint: "#4A2E33", tintLo: "#392329", accent: "#F0B4BD", ink: "#F2C2CB" } },
  { key: "dairy", label: "Dairy", tint: "#EAF2FA", tintLo: "#DCE9F6", accent: "#A7C7E6", ink: "#45525F",
    dark: { tint: "#293A4C", tintLo: "#1F2C3A", accent: "#A7C7E6", ink: "#BBD6EF" } },
  { key: "veg", label: "Vegetables", tint: "#ECF4E4", tintLo: "#DCEBCF", accent: "#97BE7E", ink: "#5E7C42",
    dark: { tint: "#314227", tintLo: "#26331E", accent: "#A7CF88", ink: "#BDDAA0" } },
  { key: "soup", label: "Soup", tint: "#F7ECDB", tintLo: "#EFDCC2", accent: "#D8BD98", ink: "#8A6C3C",
    dark: { tint: "#46391F", tintLo: "#372C18", accent: "#D8BD98", ink: "#E4C9A0" } },
  { key: "other", label: "Other", tint: "#F3ECE1", tintLo: "#E9DECF", accent: "#D9C3A0", ink: "#5D5345",
    dark: { tint: "#3E362B", tintLo: "#312B22", accent: "#D9C3A0", ink: "#DDC9AB" } },
];

// Extra skin swatches for user-created categories (appended to the pool).
const EXTRA_SKINS = [
  { key: "lavender", tint: "#F0EAFF", tintLo: "#E4D9FF", accent: "#B89FE0", ink: "#5B4480",
    dark: { tint: "#3A2E58", tintLo: "#2E2445", accent: "#C3A8F0", ink: "#D8C8FF" } },
  { key: "peach", tint: "#FFF0E8", tintLo: "#FFE3D0", accent: "#FFBE9B", ink: "#9C5833",
    dark: { tint: "#503020", tintLo: "#3E2418", accent: "#FFBE9B", ink: "#FFD5B8" } },
  { key: "mint", tint: "#E8FFF4", tintLo: "#D0FDE8", accent: "#80D4AE", ink: "#2E6B4A",
    dark: { tint: "#1C4532", tintLo: "#142E22", accent: "#8ADFB8", ink: "#A8F0D0" } },
];

// Full pool of color skins (built-in + extras) used by resolveCat.
export const CATEGORY_SKINS = [...CATEGORIES, ...EXTRA_SKINS];

// Resolve a category's bin colors for the active theme.
export function catColors(cat, mode) {
  return mode === "dark" && cat.dark
    ? cat.dark
    : { tint: cat.tint, tintLo: cat.tintLo, accent: cat.accent, ink: cat.ink };
}

// Dynamic catOf: merges settings.categories entry with CATEGORY_SKINS.
// Returns an object compatible with Bin/WideDrawer (key, label, icon, tint, tintLo, accent, ink, dark).
// Falls back to static catOf(key) if settingsCategories is not provided or key is not found.
export function resolveCat(key, settingsCategories) {
  const entry = settingsCategories?.find((c) => c.key === key);
  if (entry) {
    const skinId = entry.skinId || key;
    const skin = CATEGORY_SKINS.find((s) => s.key === skinId) || CATEGORIES[5];
    return {
      key: entry.key,
      label: entry.label,
      icon: entry.icon || entry.key,
      tint: skin.tint, tintLo: skin.tintLo, accent: skin.accent, ink: skin.ink, dark: skin.dark,
    };
  }
  return catOf(key);
}

export const DEFAULT_FRIDGE_NAME = "My Fridge";

export const RADIUS = { sm: 14, md: 20, lg: 28, pill: 999 };
export const SPACE = { xs: 6, sm: 10, md: 16, lg: 24, xl: 36 };

const badge = {
  good: { bg: "#DDEBD8", fg: "#3F6B45" },
  soon: { bg: "#E6EAD2", fg: "#5C6B36" },
  warn: { bg: "#FBE6CF", fg: "#9C5B22" },
  bad: { bg: "#F6D9D5", fg: "#A24B43" },
  neutral: { bg: "#ECE7E0", fg: "#7C746B" },
};

export const LIGHT = {
  mode: "light",
  bg: "#FBF6EE",          // warm cream interior
  bgLo: "#F5EEE2",
  surface: "#FFFFFF",
  surfaceAlt: "#FBF5EC",
  text: "#463C34",        // warm ink
  textSoft: "#B3A89C",
  line: "#EFE7DD",
  accent: "#D88B8B",      // dusty sakura
  accentInk: "#FFFFFF",
  bubble: "#F4CFC9",
  badge,
};

export const DARK = {
  mode: "dark",
  bg: "#211D1A",
  bgLo: "#1A1715",
  surface: "#2B2723",
  surfaceAlt: "#332E29",
  text: "#EDE6DC",
  textSoft: "#A89E92",
  line: "#3A342E",
  accent: "#D88B8B",
  accentInk: "#241F1C",
  bubble: "#5A4B49",
  badge: {
    good: { bg: "#33402F", fg: "#BFD7B3" },
    soon: { bg: "#3C402C", fg: "#D2DCA8" },
    warn: { bg: "#46361F", fg: "#F0C089" },
    bad: { bg: "#46302C", fg: "#F0ADA4" },
    neutral: { bg: "#3A342E", fg: "#A89E92" },
  },
};

export function catOf(key) {
  return CATEGORIES.find((c) => c.key === key) || CATEGORIES[5];
}
