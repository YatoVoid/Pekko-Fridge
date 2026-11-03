// Stand-in for OCR when ML Kit is not available (Expo Go).

const LABELS = [
  "Hokkaido Butter\nMFG 2026/06/01\n賞味期限 2026/08/15",
  "CHEDDAR CHEESE\nLOT 4471\nEXP 03/12/26",
  "Fresh Whole Milk\nBEST BEFORE 12/07/2026",
  "Pekko Yogurt\n製造 2026.06.20\n消費期限 2026.07.05",
  "Sliced Ham\nUSE BY 15 JUL 2026",
  "Tomato Passata\nBBD 2027/01/30",
  "Spinach Leaves\nPACKED 28 JUN 2026\nUSE BY 04 JUL 2026",
];

export function readFrame() {
  return LABELS[Math.floor(Math.random() * LABELS.length)];
}
