// Real on-device OCR via ML Kit — only present in a dev/standalone build.
// In Expo Go the native module is missing, so we degrade gracefully to null
// and the scanner falls back to the local simulator. Same JS, both worlds.
let TextRecognition = null;
try {
  // eslint-disable-next-line global-require
  TextRecognition = require("@react-native-ml-kit/text-recognition").default;
} catch {
  TextRecognition = null;
}

export const ocrAvailable = !!TextRecognition;

// ML Kit ships one on-device recognizer per script family (all bundled here).
// Every non-Latin recognizer also reads Latin, so running them all and keeping
// the richest result reads the text in the right script whatever the language.
const SCRIPTS = ["Latin", "Chinese", "Japanese", "Korean", "Devanagari"];

async function recognizeWith(uri, script) {
  try {
    const result = await TextRecognition.recognize(uri, script);
    return result?.text || null;
  } catch {
    return null;
  }
}

// Latin-only, fast — used by the date scanner (printed dates are numeric).
export async function recognizeText(uri) {
  if (!TextRecognition || !uri) return null;
  return recognizeWith(uri, "Latin");
}

// Multi-script — used when reading a product name off a photo, so non-Latin
// names (Japanese, Chinese, Korean, Hindi) come through in the correct script.
// Runs the recognizers in parallel and keeps the one with the most characters.
export async function recognizeBest(uri) {
  if (!TextRecognition || !uri) return null;
  const results = await Promise.all(SCRIPTS.map((s) => recognizeWith(uri, s)));
  let best = null;
  let bestScore = -1;
  for (const t of results) {
    if (!t) continue;
    const score = t.replace(/\s+/g, "").length; // most actual (non-space) characters wins
    if (score > bestScore) { bestScore = score; best = t; }
  }
  return best;
}
