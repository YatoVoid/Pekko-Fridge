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

// Returns the raw recognized text for an image uri, or null if unavailable/failed.
export async function recognizeText(uri) {
  if (!TextRecognition || !uri) return null;
  try {
    const result = await TextRecognition.recognize(uri);
    return result?.text || null;
  } catch {
    return null;
  }
}
