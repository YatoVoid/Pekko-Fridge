// Round-trip test: mk(2026,9,16) serialized as ISO string and re-parsed stays Sept 16.
// Run standalone: node tests/expiry.test.js
// Under specific TZs: cross-env TZ=America/New_York node tests/expiry.test.js
//                     cross-env TZ=Asia/Tokyo     node tests/expiry.test.js
//
// Conclusion: if these tests pass in all TZs, the off-by-one is OCR-side (6 misread
// as 7) or a correction-chip tap — NOT a serialization bug. Do NOT change the date
// logic unless these tests actually fail.
const assert = require("assert");
const { mk } = require("../src/lib/dateParser");

// Inline formatDate + daysLeft (mirrors expiry.js, avoiding ESM import in plain node).
const DAY = 86400000;
function formatDate(d, region) {
  region = region || "DMY";
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt)) return "—";
  const Y = dt.getFullYear();
  const M = String(dt.getMonth() + 1).padStart(2, "0");
  const D = String(dt.getDate()).padStart(2, "0");
  if (region === "YMD") return Y + "/" + M + "/" + D;
  if (region === "MDY") return M + "/" + D + "/" + Y;
  return D + "/" + M + "/" + Y;
}
function daysLeft(expISO) {
  if (!expISO) return null;
  const exp = new Date(expISO);
  if (isNaN(exp)) return null;
  const today = new Date();
  const a = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const b = Date.UTC(exp.getFullYear(), exp.getMonth(), exp.getDate());
  return Math.round((b - a) / DAY);
}

// 1. mk creates the correct local date.
const sep16 = mk(2026, 9, 16);
assert.ok(sep16, "mk(2026,9,16) returns a Date");
assert.strictEqual(sep16.getFullYear(), 2026, "mk year");
assert.strictEqual(sep16.getMonth(), 8,    "mk month (0-based = 8 for September)");
assert.strictEqual(sep16.getDate(), 16,    "mk day");

// 2. JSON round-trip (as store.js does: JSON.stringify items array → JSON.parse → new Date).
const iso = JSON.stringify(sep16);           // produces "\"2026-09-16T...Z\""
const reloaded = new Date(JSON.parse(iso));
assert.strictEqual(reloaded.getFullYear(), 2026, "round-trip year");
assert.strictEqual(reloaded.getMonth(), 8,       "round-trip month 0-based");
assert.strictEqual(reloaded.getDate(), 16,       "round-trip day — fails if TZ shifts date");
assert.strictEqual(formatDate(reloaded, "DMY"), "16/09/2026", "formatDate round-trip DMY");
assert.strictEqual(formatDate(reloaded, "MDY"), "09/16/2026", "formatDate round-trip MDY");
assert.strictEqual(formatDate(reloaded, "YMD"), "2026/09/16", "formatDate round-trip YMD");

// 3. daysLeft uses Date.UTC projection → TZ-safe.
const d = daysLeft(reloaded);
assert.ok(typeof d === "number", "daysLeft returns a number");

// 4. Month-end round-trip (boundary most likely to shift under western TZs).
const jan31 = mk(2027, 1, 31);
assert.ok(jan31, "mk(2027,1,31) returns a Date");
const iso2 = JSON.stringify(jan31);
const rel2 = new Date(JSON.parse(iso2));
assert.strictEqual(rel2.getDate(), 31, "Jan 31 round-trip day");
assert.strictEqual(rel2.getMonth(), 0, "Jan 31 round-trip month index");
assert.strictEqual(formatDate(rel2, "YMD"), "2027/01/31", "Jan 31 formatDate YMD");

// 5. First-of-month round-trip (most likely to cross midnight westwards).
const jan1 = mk(2027, 1, 1);
assert.ok(jan1, "mk(2027,1,1) returns a Date");
const iso3 = JSON.stringify(jan1);
const rel3 = new Date(JSON.parse(iso3));
assert.strictEqual(rel3.getDate(), 1,  "Jan 1 round-trip day");
assert.strictEqual(rel3.getMonth(), 0, "Jan 1 round-trip month index");

console.log(
  "✓ expiry round-trip tests passed  TZ=" + (process.env.TZ || "(system default)")
);
