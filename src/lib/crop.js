import * as ImageManipulator from "expo-image-manipulator";

export async function cropToRect(uri, rect) {
  try {
    if (typeof ImageManipulator.manipulate === "function") {
      const ctx = ImageManipulator.manipulate(uri);
      ctx.crop(rect);
      const ref = await ctx.renderAsync();
      const out = await ref.saveAsync({ compress: 1, format: ImageManipulator.SaveFormat?.JPEG ?? "jpeg" });
      return out.uri || uri;
    }
    if (typeof ImageManipulator.manipulateAsync === "function") {
      const out = await ImageManipulator.manipulateAsync(uri, [{ crop: rect }], { compress: 1 });
      return out.uri || uri;
    }
  } catch {
  }
  return uri;
}

// Maps the on-screen box to photo pixels, allowing for the preview's cover crop.
export function boxToPhotoRect(photoW, photoH, viewW, viewH, fracW = 0.8, fracH = 0.34) {
  if (!photoW || !photoH || !viewW || !viewH) return null;
  const f = Math.max(viewW / photoW, viewH / photoH);
  const offX = (photoW * f - viewW) / 2;
  const offY = (photoH * f - viewH) / 2;
  const boxL = viewW * (1 - fracW) / 2;
  const boxT = viewH * (1 - fracH) / 2;
  let originX = Math.round((boxL + offX) / f);
  let originY = Math.round((boxT + offY) / f);
  let width = Math.round((viewW * fracW) / f);
  let height = Math.round((viewH * fracH) / f);
  originX = Math.max(0, Math.min(originX, photoW - 1));
  originY = Math.max(0, Math.min(originY, photoH - 1));
  width = Math.max(1, Math.min(width, photoW - originX));
  height = Math.max(1, Math.min(height, photoH - originY));
  return { originX, originY, width, height };
}
