// Fridge door: enamel background, paper notes held up by magnets. Each folder
// gets its own magnet colour; red is kept for whatever should be used first.

const PAPER = { tint: "#FFFDF8", tintLo: "#FBF6EC", ink: "#25221F" };
const PAPER_DARK = { tint: "#2E2B27", tintLo: "#2A2723", ink: "#EEEAE3" };

const note = (key, label, magnet, magnetDark) => ({
  key, label, ...PAPER, accent: magnet,
  dark: { ...PAPER_DARK, accent: magnetDark || magnet },
});

export const CATEGORIES = [
  note("cheese", "Cheese", "#D6A21E", "#E2B33A"),
  note("meat", "Meat", "#8A4566", "#B9789A"),
  note("dairy", "Dairy", "#3A6CA6", "#7BA3D4"),
  note("veg", "Vegetables", "#4C8A3C", "#7DB86C"),
  note("soup", "Soup", "#C8742A", "#E09A58"),
  note("other", "Other", "#6F6961", "#A39C92"),
];

const EXTRA_SKINS = [
  note("lavender", undefined, "#6E55A3", "#A08ACF"),
  note("peach", undefined, "#C9714F", "#E39A7D"),
  note("mint", undefined, "#2F8D72", "#62BFA2"),
];

export const CATEGORY_SKINS = [...CATEGORIES, ...EXTRA_SKINS];

export function catColors(cat, mode) {
  return mode === "dark" && cat.dark
    ? cat.dark
    : { tint: cat.tint, tintLo: cat.tintLo, accent: cat.accent, ink: cat.ink };
}

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

export const RADIUS = { sm: 3, md: 5, lg: 8, pill: 999 };
export const SPACE = { xs: 6, sm: 10, md: 16, lg: 24, xl: 36 };

// Marker hand for anything written on a note: item and folder names, the fridge name.
export const HAND = "Kalam-Bold";

const badge = {
  good: { bg: "transparent", fg: "#2F6B3A" },
  soon: { bg: "transparent", fg: "#5A6420" },
  warn: { bg: "transparent", fg: "#975512" },
  bad: { bg: "transparent", fg: "#B02E25" },
  neutral: { bg: "transparent", fg: "#6B645B" },
};

export const LIGHT = {
  mode: "light",
  bg: "#ECE9E2",
  bgLo: "#E2DED5",
  surface: "#FFFDF8",
  surfaceAlt: "#F3EFE6",
  text: "#25221F",
  textSoft: "#6B645B",
  line: "#D6D0C4",
  accent: "#C2352A",
  accentInk: "#FFFFFF",
  bubble: "#C2352A",
  badge,
};

export const DARK = {
  mode: "dark",
  bg: "#1C1B19",
  bgLo: "#171614",
  surface: "#2A2825",
  surfaceAlt: "#34312D",
  text: "#EEEAE3",
  textSoft: "#A69F95",
  line: "#423E38",
  accent: "#E0574B",
  accentInk: "#1C1B19",
  bubble: "#E0574B",
  badge: {
    good: { bg: "transparent", fg: "#9CCB8E" },
    soon: { bg: "transparent", fg: "#CBD38A" },
    warn: { bg: "transparent", fg: "#E8B074" },
    bad: { bg: "transparent", fg: "#F08A80" },
    neutral: { bg: "transparent", fg: "#A69F95" },
  },
};

export function catOf(key) {
  return CATEGORIES.find((c) => c.key === key) || CATEGORIES[5];
}
