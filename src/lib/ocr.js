// ML Kit is missing in Expo Go. The scanner then falls back to the simulator in
// vision.js.
let TextRecognition = null;
try {
  // eslint-disable-next-line global-require
  TextRecognition = require("@react-native-ml-kit/text-recognition").default;
} catch {
  TextRecognition = null;
}

export const ocrAvailable = !!TextRecognition;

// Every non-Latin recognizer also reads Latin, so the richest result across all of them
// is in the right script.
const SCRIPTS = ["Latin", "Chinese", "Japanese", "Korean", "Devanagari"];

async function recognizeWith(uri, script) {
  try {
    return (await TextRecognition.recognize(uri, script)) || null;
  } catch {
    return null;
  }
}

export async function recognizeText(uri) {
  if (!TextRecognition || !uri) return null;
  const r = await recognizeWith(uri, "Latin");
  return r?.text || null;
}

export async function recognizeBest(uri) {
  if (!TextRecognition || !uri) return null;
  const results = await Promise.all(SCRIPTS.map((s) => recognizeWith(uri, s)));
  let best = null;
  let bestScore = -1;
  for (const r of results) {
    const score = (r?.text || "").replace(/\s+/g, "").length;
    if (score > bestScore) { bestScore = score; best = r; }
  }
  return best;
}
