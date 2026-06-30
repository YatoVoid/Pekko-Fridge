// Run: npm test   (plain node, no framework)
const assert = require("assert");
const { parseLabel } = require("../src/lib/dateParser");

function eq(d, y, m, day, msg) {
  assert.ok(d, msg + " (got null)");
  assert.strictEqual(d.getFullYear(), y, msg + " year");
  assert.strictEqual(d.getMonth() + 1, m, msg + " month");
  assert.strictEqual(d.getDate(), day, msg + " day");
}

let r = parseLabel("ペッコ牛乳\n賞味期限 2026/07/15\n製造 2026/07/01", "YMD");
eq(r.exp, 2026, 7, 15, "JP exp");
eq(r.mfg, 2026, 7, 1, "JP mfg");

r = parseLabel("CHEDDAR CHEESE\nEXP 03/12/26", "MDY");
eq(r.exp, 2026, 3, 12, "US exp");

r = parseLabel("BEST BEFORE 03/12/2026", "DMY");
eq(r.exp, 2026, 12, 3, "EU exp");

r = parseLabel("USE BY 15 JUL 2026", "DMY");
eq(r.exp, 2026, 7, 15, "text-month exp");

// part >12 forces day, overriding region (US label read with DMY pref)
r = parseLabel("EXP 12/25/2026", "DMY");
eq(r.exp, 2026, 12, 25, "day>12 disambiguation");

// month/year-only best-before → last day of month
r = parseLabel("BBD 07/2026", "DMY");
eq(r.exp, 2026, 7, 31, "month-year only → end of month");

// written month + year only
r = parseLabel("Best Before End AUG 2026", "DMY");
eq(r.exp, 2026, 8, 31, "worded month-year");

// keyword on its own line, date on the next
r = parseLabel("USE BY\n09/08/2026", "DMY");
eq(r.exp, 2026, 8, 9, "cross-line keyword");

// multiple dates, labelled: expiry chosen correctly, both surfaced as candidates
r = parseLabel("Yogurt\nMFG 01/06/2026\nEXP 01/09/2026", "DMY");
eq(r.exp, 2026, 9, 1, "labelled exp among many");
eq(r.mfg, 2026, 6, 1, "labelled mfg among many");
assert.ok(r.candidates.length >= 2, "candidates surfaced");

// no keywords → latest is expiry, earliest is mfg
r = parseLabel("milk\n01/01/2026\n01/06/2026", "DMY");
eq(r.exp, 2026, 6, 1, "unlabelled exp = latest");
eq(r.mfg, 2026, 1, 1, "unlabelled mfg = earliest");

// worded date with no keyword, on its own → becomes the expiry
r = parseLabel("2 July 2027", "MDY");
eq(r.exp, 2027, 7, 2, "worded date saved as expiry");

// region says MDY but 20 can't be a month → auto-corrected to day
r = parseLabel("20/5/27", "MDY");
eq(r.exp, 2027, 5, 20, "auto-correct impossible month");

// OCR turned the slash into a space — still parse the full day, not month-end
r = parseLabel("EXP 2024/01 28", "DMY");
eq(r.exp, 2024, 1, 28, "year-first with space separator");

// a stray month-only token must not beat the full date in the same month
r = parseLabel("BB 2024/01\n2024/01/28", "DMY");
eq(r.exp, 2024, 1, 28, "full date beats month-only same month");

// invalid date rejected, not crashed
r = parseLabel("EXP 30/02/2026", "DMY");
assert.strictEqual(r.exp, null, "Feb 30 rejected");

// garbage in → safe out
assert.deepStrictEqual(parseLabel(null), { exp: null, mfg: null, candidates: [], guessName: null });

r = parseLabel("Hokkaido Butter\nEXP 2026/08/01", "YMD");
assert.strictEqual(r.guessName, "Hokkaido Butter", "name guess");

console.log("✓ all dateParser tests passed");
