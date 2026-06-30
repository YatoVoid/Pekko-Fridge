# 🎌 Pekko Fridge — Cute, Local-First Expiry Date Scanner 

A privacy-focused, minimalistic, "Japanese cute" (Kawaii) expiration date tracker that runs 100% locally on your phone. No internet required, no cloud data harvesting, and completely free. 

Scan any product's back label, and the app instantly auto-crops, runs local OCR to read the dates, and calculates exactly how many days remain before it spoils. Save your groceries into categorized, beautifully illustrated folder tabs (Cheese, Meat, Dairy) inside your virtual "Fridge" and set custom notifications before they go bad.

## ✨ Features
* 📸 **Smart-Crop Camera:** Visual UI feedback that morphs to show users exactly where the label is being cropped before automatically snapping.
* 🧠 **100% Local OCR & Processing:** Ultra-fast on-device date scanning that runs completely offline with zero latency.
* 🍱 **Kawaii Minimalist UI:** A clean aesthetic inspired by Japanese organization, featuring cute custom food category icons.
* ⚙️ **Localization Settings:** Quickly toggle between region-specific time units and calendar formats (American, European, etc.) and system themes.
* 🔔 **Smart Fridge Reminders:** Set custom advance notice alerts to rescue your food before it hits its expiration date.

## 🛠️ Tech Stack (Targeting Cross-Platform iOS & Android)
* **Framework:** React Native / Expo (or Flutter) for shared cross-platform codebase.
* **On-Device Vision:** Google ML Kit (Android) & Apple Vision Framework (iOS) via native bridges for zero-latency, local OCR.
* **Database:** WatermelonDB or SQLite for fast, local-first data persistence.