# Pekko Fridge

Pekko Fridge is a cute, private expiry date tracker for your food. Everything runs on your phone. There is no internet connection, no account, and no data collection, and the app is free.

Point the camera at a product's date label. Pekko reads the date on your device, works out how many days are left, and saves the item into your fridge so you always know what to eat first.

## What it does

Scan dates with the camera. A crop guide shows what will be read, then Pekko reads the printed date on device and calculates the days remaining. Setting a date by hand is quick too — one tap adds a week, a month, or a year, so far-off dates don't mean endless scrolling.

Keep photos of each item. You can attach pictures of the label or the product so you remember exactly what it is. The photos stay on your phone.

Organise your fridge into folders. Start with Dairy, Cheese, Meat, Soup, Vegetables, and Other — each with its own drawn icon — then make them yours: add your own folders, rename them, drag to reorder, or hide the ones you don't use, all straight from the fridge screen.

See what matters at a glance. Every item shows how many days are left, its expiry date, and when it was added, with a soft colour that shifts as the date gets closer. An "eat me first" strip surfaces whatever is closest to spoiling.

Get a gentle reminder. Turn on notifications and Pekko nudges you before food is about to spoil — right from the reminder you can tap "Mark eaten" or "Snooze 2 days" without opening the app.

Make it yours. Rename your fridge, switch between light, dark, and system themes, and choose the date format that matches your region.

## Privacy

Everything happens locally. The camera is only used to read expiry dates, and images never leave the device. No cloud, no tracking, no sign up.

## Support

Pekko is made by one person, in my own time, and given away for free with no ads, no tracking, and no paywall. If it saves you a little food or money, you can leave a tip. Every coffee genuinely helps me keep it updated and add new features.

<a href="https://buymeacoffee.com/walilambere" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy me a coffee" height="60"></a>

## How it works

Pekko is a fully offline app — there is no server and no network code. Everything lives on the device.

- **Scan pipeline.** The camera captures a cropped photo of the date label → Skia sharpens it (grayscale + high contrast) → Google ML Kit reads the text **on-device** → a pure-JavaScript date engine parses it (numeric dates in any regional order, written-out months, `EXP` / `BBD` / `use by` keywords including Japanese, and telling manufacture dates apart from expiry) → you confirm the result and save.
- **State.** A single React Context store holds your settings and items and writes to on-device storage on every change, so nothing is ever lost — even if the app is killed mid-edit.
- **UI.** A custom horizontal swipe pager (Fridge · Scan · Settings), a skeuomorphic fridge whose folders can be dragged, renamed, added, or hidden in an iOS-style edit mode, and hand-drawn SVG icons throughout (no emoji).
- **Reminders.** Local notifications fire before food expires, with "Mark eaten" and "Snooze 2 days" actions.

## Tech stack

| Layer | Technology |
|---|---|
| Language | JavaScript (React 19, JSX) |
| Framework | React Native 0.85 · Expo SDK 56 (New Architecture) |
| On-device OCR | `@react-native-ml-kit/text-recognition` (Google ML Kit) |
| Image preprocessing | `@shopify/react-native-skia` (GPU grayscale + contrast) |
| Camera | `expo-camera` |
| Date parsing | Custom pure-JavaScript engine (Node unit tests) |
| Local storage | `@react-native-async-storage/async-storage` (no cloud) |
| Notifications | `expo-notifications` (scheduled locally) |
| Graphics & UI | `react-native-svg`, `expo-linear-gradient`, `expo-haptics`, `react-native-safe-area-context` |
| Build & release | EAS Build → Android App Bundle (`.aab`) → Google Play |

No backend, no analytics, no third-party network calls.

## Project structure

```
App.js                  Navigation shell — swipe pager + bottom tab bar
src/
  store.js              Single source of truth (settings + items), persisted locally
  theme.js              Colors, spacing, category "skins"
  screens/
    FridgeScreen.js     The fridge + in-place folder edit mode
    ScannerScreen.js    Camera + scan flow
    SettingsScreen.js   Theme, reminders, date format
  components/           Fridge pieces, edit grid, sheets, date field, icons
  lib/
    ocr.js              ML Kit wrapper (graceful fallback when unavailable)
    enhance.js          Skia image preprocessing for OCR
    dateParser.js       Pure-JS date engine (tested)
    expiry.js           Countdown + badge tone helpers
```

## Status

Version 1.2.1, built with Expo and React Native for Android.
