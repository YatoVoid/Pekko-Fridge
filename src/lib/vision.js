// Local vision SIMULATION (Expo Go has no ML Kit / Apple Vision).
// readFrame() returns a realistic raw label string for the date engine.
// The morphing box is a native-driver animation in ScannerScreen, not driven here.
// Real OCR later = replace readFrame() with one ML Kit call. Nothing else changes.

// A small bank of plausible back-of-label texts in mixed regions/formats.
const LABELS = [
  "Hokkaido Butter\nMFG 2026/06/01\n賞味期限 2026/08/15",
  "CHEDDAR CHEESE\nLOT 4471\nEXP 03/12/26",
  "Fresh Whole Milk\nBEST BEFORE 12/07/2026",
  "Pekko Yogurt\n製造 2026.06.20\n消費期限 2026.07.05",
  "Sliced Ham\nUSE BY 15 JUL 2026",
  "Tomato Passata\nBBD 2027/01/30",
  "Spinach Leaves\nPACKED 28 JUN 2026\nUSE BY 04 JUL 2026",
];

// "Read" the locked frame. region only affects how the engine *interprets*
// the string; the string itself is what the camera "saw".
export function readFrame() {
  return LABELS[Math.floor(Math.random() * LABELS.length)];
}
