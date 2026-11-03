// Faint grey inkjet dates read badly. Stretch the contrast, bring the size to what ML
// Kit likes, and blur a little so dot-matrix dots join into strokes.
import { Skia, TileMode, ImageFormat } from "@shopify/react-native-skia";
import * as FileSystem from "expo-file-system";

const TARGET_W = 1600;
const MAX_UPSCALE = 2;
const BLUR_SIGMA = 0.7;
const MAX_STRETCH = 6;

function autoLevels(img) {
  const FALLBACK = { scale: 2.8, bias: -1.5 };
  try {
    const w = 96;
    const h = Math.max(1, Math.round((img.height() / img.width()) * 96));
    const s = Skia.Surface.MakeOffscreen(w, h);
    if (!s) return FALLBACK;
    s.getCanvas().drawImageRect(img, Skia.XYWHRect(0, 0, img.width(), img.height()), Skia.XYWHRect(0, 0, w, h), Skia.Paint());
    const px = s.makeImageSnapshot().readPixels();
    if (!px || px.length < 16) return FALLBACK;
    const M = px instanceof Float32Array ? 1 : 255;
    const lums = [];
    for (let i = 0; i < px.length; i += 4) {
      lums.push((0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / M);
    }
    lums.sort((a, b) => a - b);
    const p5 = lums[(lums.length * 0.05) | 0];
    const p95 = lums[(lums.length * 0.95) | 0];
    const range = Math.max(1 / MAX_STRETCH, p95 - p5);
    const scale = Math.min(MAX_STRETCH, 1 / range);
    return { scale, bias: -p5 * scale };
  } catch {
    return FALLBACK;
  }
}

export async function enhanceForOcr(uri) {
  try {
    const data = await Skia.Data.fromURI(uri);
    const img = Skia.Image.MakeImageFromEncoded(data);
    if (!img) return uri;
    const w = img.width();
    const h = img.height();
    let outW = w > TARGET_W ? TARGET_W : Math.min(TARGET_W, w * MAX_UPSCALE);
    outW = Math.round(outW);
    const outH = Math.max(1, Math.round(h * (outW / w)));

    const surface = Skia.Surface.MakeOffscreen(outW, outH);
    if (!surface) return uri;

    const { scale: C, bias: B } = autoLevels(img);
    const MATRIX = [
      0.299 * C, 0.587 * C, 0.114 * C, 0, B,
      0.299 * C, 0.587 * C, 0.114 * C, 0, B,
      0.299 * C, 0.587 * C, 0.114 * C, 0, B,
      0, 0, 0, 1, 0,
    ];
    const paint = Skia.Paint();
    paint.setImageFilter(
      Skia.ImageFilter.MakeColorFilter(
        Skia.ColorFilter.MakeMatrix(MATRIX),
        Skia.ImageFilter.MakeBlur(BLUR_SIGMA, BLUR_SIGMA, TileMode.Clamp, null),
      ),
    );
    surface.getCanvas().drawImageRect(img, Skia.XYWHRect(0, 0, w, h), Skia.XYWHRect(0, 0, outW, outH), paint);

    const snap = surface.makeImageSnapshot();
    const b64 = snap.encodeToBase64(ImageFormat.JPEG, 90);
    const path = `${FileSystem.cacheDirectory}pekko-ocr-${Date.now()}.jpg`;
    await FileSystem.writeAsStringAsync(path, b64, { encoding: FileSystem.EncodingType.Base64 });
    return path;
  } catch {
    return uri;
  }
}
