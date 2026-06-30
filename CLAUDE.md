# Pekko Fridge — project instructions

## Always: version bump reminder

After completing any round of updates/changes to this app, **ask the user whether
to bump the app version number before they build or publish.** Do not bump it
silently — ask first, then apply if they say yes.

- The human-facing version lives in `app.json` → `expo.version` (semver, e.g. `1.0.0`).
- The Android `versionCode` is auto-incremented by EAS (remote versioning in
  `eas.json`), so that one is handled automatically — the reminder is about the
  semver `version`.
- Typical cue: right before suggesting `eas build` / a commit for release.

## UI rule: no emojis, ever

The UI uses **custom line-art / drawn SVG icons only** (`src/components/FoodIcons.js`,
`src/components/icons.js`) — never emoji glyphs. Applies to every surface (categories,
placeholders, boot, permission screens, notification text). Add an icon, don't reach for emoji.

## Gotcha: bottom-sheet drag-to-close (don't regress this)

`SwipeSheet` is a transparent `Modal`. On the **New Architecture**, `PanResponder`'s
**move-based** responder negotiation is unreliable inside a Modal (taps work, drags don't
fire). The working pattern:
- The **grabber + header handle** uses `onStartShouldSetPanResponder: () => true`
  (grab on touch-down). It has no tappable children, so this is safe and reliable.
- Scrollable sheets (CategoryDrawer) attach the pan to the **handle only**, so the list
  still scrolls; non-scroll sheets also put a move-based pan on the sheet background.
- Don't attach the same PanResponder instance to two nested views — it cancels itself out.
This is confirmed working; if a sheet stops closing on swipe, this is why.

## Quick project facts

- Expo SDK 56 / RN 0.85 / React 19, **New-Architecture only** (`newArchEnabled` is not a
  valid app.json field). Runs via a dev build: `npx expo start --dev-client`.
- **Repo lives at `C:\Pekko`** (moved off the long OneDrive path so native C++ libs —
  Skia, etc. — can compile; CMake has a 250-char object-path limit). Do NOT move it back.
- **Local build pipeline** (no EAS needed, no quota): JDK 17 + Android SDK installed.
  `cd C:\Pekko\android; .\gradlew.bat app:assembleDebug` → `adb install -r` the APK from
  `android/app/build/outputs/apk/debug/`. Set `JAVA_HOME` to the Microsoft JDK 17 and
  `ANDROID_HOME` to `%LOCALAPPDATA%\Android\Sdk` first. Only rebuild when native deps change.
- Scanner: **expo-camera** (steady-aim capture). OCR = `@react-native-ml-kit/text-recognition`
  on the cropped photo, with **Skia grayscale+contrast preprocessing** (`src/lib/enhance.js`)
  for low-contrast dates. True silent background OCR (VisionCamera) is NOT used — it failed
  on this stack; revisit only if needed.
- EAS builds also configured: `eas build --profile development|preview|production` (AAB).
- Date engine `src/lib/dateParser.js` is pure JS with tests (`npm test`).
