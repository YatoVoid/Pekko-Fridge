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

## Quick project facts

- Expo (SDK 56 / RN 0.85 / React 19), runs via dev build (`npx expo start --dev-client`).
  Real OCR (ml-kit) only works in a dev/standalone build, not Expo Go.
- Builds: `eas build --profile development` (test APK) / `preview` (standalone APK) /
  `production` (AAB for Play Store).
- See the memory folder notes for stack details and the no-emoji UI rule.
