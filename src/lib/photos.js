// Thin wrappers over expo-image-picker. Return a local uri or null.
import * as ImagePicker from "expo-image-picker";

const OPTS = { quality: 0.4, allowsEditing: false };

export async function takePhoto() {
  try {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return null;
    const res = await ImagePicker.launchCameraAsync(OPTS);
    return res.canceled ? null : res.assets?.[0]?.uri || null;
  } catch {
    return null;
  }
}

export async function pickFromLibrary() {
  try {
    const res = await ImagePicker.launchImageLibraryAsync(OPTS);
    return res.canceled ? null : res.assets?.[0]?.uri || null;
  } catch {
    return null;
  }
}
