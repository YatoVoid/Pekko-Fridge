// Preprocess a cropped photo for OCR: grayscale + strong contrast so low-contrast
// (gray / colored) dates become crisp black-on-white, which ML Kit reads far better.
// Falls back to the original image on any failure.
import { Skia } from "@shopify/react-native-skia";
import * as FileSystem from "expo-file-system";

const C = 1.85; // contrast factor
const B = 0.5 - 0.5 * C; // bias to keep mid-grey centered
const MATRIX = [
  0.299 * C, 0.587 * C, 0.114 * C, 0, B,
  0.299 * C, 0.587 * C, 0.114 * C, 0, B,
  0.299 * C, 0.587 * C, 0.114 * C, 0, B,
  0, 0, 0, 1, 0,
];

export async function enhanceForOcr(uri) {
  try {
    const data = await Skia.Data.fromURI(uri);
    const img = Skia.Image.MakeImageFromEncoded(data);
    if (!img) return uri;
    const w = img.width();
    const h = img.height();
    const surface = Skia.Surface.MakeOffscreen(w, h);
    if (!surface) return uri;
    const canvas = surface.getCanvas();
    const paint = Skia.Paint();
    paint.setColorFilter(Skia.ColorFilter.MakeMatrix(MATRIX));
    canvas.drawImageRect(img, Skia.XYWHRect(0, 0, w, h), Skia.XYWHRect(0, 0, w, h), paint);
    const snap = surface.makeImageSnapshot();
    const b64 = snap.encodeToBase64(); // PNG
    const path = `${FileSystem.cacheDirectory}pekko-ocr-${Date.now()}.png`;
    await FileSystem.writeAsStringAsync(path, b64, { encoding: FileSystem.EncodingType.Base64 });
    return path;
  } catch {
    return uri;
  }
}
