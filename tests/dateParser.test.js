// Run: npm test   (plain node, no framework — ponytail)
const assert = require("assert");
const { parseLabel } = require("../src/lib/dateParser");

function eq(d, y, m, day, msg) {
  assert.ok(d, msg + " (got null)");
  assert.strictEqual(d.getFullYear(), y, msg + " year");
  assert.strictEqual(d.getMonth() + 1, m, msg + " month");
  assert.strictEqual(d.getDate(), day, msg + " day");
}

// Japanese YYYY/MM/DD with expiry keyword
let r = parseLabel("ペッコ牛乳\n賞味期限 2026/07/15\n製造 2026/07/01", "YMD");
eq(r.exp, 2026, 7, 15, "JP exp");
eq(r.mfg, 2026, 7, 1, "JP mfg");

// US ambiguous MM/DD/YY with EXP label
r = parseLabel("CHEDDAR CHEESE\nEXP 03/12/26", "MDY");
eq(r.exp, 2026, 3, 12, "US exp");

// EU ambiguous DD/MM/YYYY → same digits, different meaning
r = parseLabel("BEST BEFORE 03/12/2026", "DMY");
eq(r.exp, 2026, 12, 3, "EU exp");

// Textual month
r = parseLabel("USE BY 15 JUL 2026", "DMY");
eq(r.exp, 2026, 7, 15, "text-month exp");

// No keywords → pick the latest date as expiry, earliest as mfg
r = parseLabel("milk\n01/01/2026\n01/06/2026", "DMY");
eq(r.exp, 2026, 6, 1, "unlabelled exp = latest");

// Invalid date is rejected, not crashed
r = parseLabel("EXP 30/02/2026", "DMY");
assert.strictEqual(r.exp, null, "Feb 30 rejected");

// Garbage in → safe out
assert.deepStrictEqual(parseLabel(null), { exp: null, mfg: null, guessName: null });

// Name guess
r = parseLabel("Hokkaido Butter\nEXP 2026/08/01", "YMD");
assert.strictEqual(r.guessName, "Hokkaido Butter", "name guess");

console.log("✓ all dateParser tests passed");
