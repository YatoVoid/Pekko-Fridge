// Local date-parsing engine. Pure JS, no native deps, node-testable.
// This is the REAL part of the "vision" pipeline: given text read off a label
// (from OCR or, in Expo Go, the simulator), pull out manufacture vs expiry dates.
// Swapping in real ML Kit later means feeding its text here unchanged.

const MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

// Keyword groups. Japanese included because the brief is Kawaii/JP-first.
const EXP_WORDS = /\b(exp|bbd|bb|best\s*before|use\s*by|sell\s*by|expires?)\b|賞味期限|消費期限/i;
const MFG_WORDS = /\b(mfg|mfd|prod|packed|pkd|manufactured?)\b|製造|加工/i;

// ponytail: three numeric layouts + one textual-month layout covers real labels.
// Add more only when a real label fails — don't pre-build a date library.
const RE_NUMERIC = /(\d{1,4})[\/\.\-](\d{1,2})[\/\.\-](\d{1,4})/g;
const RE_TEXT_MONTH = /(\d{1,2})\s*([A-Za-z]{3,})\.?\s*(\d{2,4})/g;
const RE_MONTH_TEXT = /([A-Za-z]{3,})\.?\s*(\d{1,2}),?\s*(\d{2,4})/g;

function fullYear(y) {
  const n = Number(y);
  if (n >= 1000) return n;
  // 2-digit year: assume 2000s (food doesn't expire in 1998).
  return 2000 + n;
}

function validDate(y, m, d) {
  if (!y || !m || !d) return null;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, m - 1, d);
  // reject overflow (e.g. Feb 30 → Mar 2)
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return dt;
}

// Resolve an ambiguous numeric triple using the user's region preference.
// region: "MDY" (US), "DMY" (EU/Intl), "YMD" (JP)
function resolveNumeric(a, b, c, region) {
  const A = Number(a), B = Number(b), C = Number(c);
  // If one part is clearly a 4-digit year, trust it regardless of region.
  if (a.length === 4) return validDate(A, B, C);           // YYYY/MM/DD
  if (c.length === 4) {
    if (region === "MDY") return validDate(fullYear(C), A, B); // MM/DD/YYYY
    return validDate(fullYear(C), B, A);                       // DD/MM/YYYY
  }
  // All 2-digit → lean on region order.
  if (region === "YMD") return validDate(fullYear(A), B, C);
  if (region === "MDY") return validDate(fullYear(C), A, B);
  return validDate(fullYear(C), B, A); // DMY default
}

function findDates(segment, region) {
  const out = [];
  let m;
  RE_NUMERIC.lastIndex = 0;
  while ((m = RE_NUMERIC.exec(segment))) {
    const d = resolveNumeric(m[1], m[2], m[3], region);
    if (d) out.push(d);
  }
  RE_TEXT_MONTH.lastIndex = 0;
  while ((m = RE_TEXT_MONTH.exec(segment))) {
    const mo = MONTHS[m[2].slice(0, 3).toLowerCase()];
    const d = validDate(fullYear(m[3]), mo, Number(m[1]));
    if (d) out.push(d);
  }
  RE_MONTH_TEXT.lastIndex = 0;
  while ((m = RE_MONTH_TEXT.exec(segment))) {
    const mo = MONTHS[m[1].slice(0, 3).toLowerCase()];
    const d = validDate(fullYear(m[3]), mo, Number(m[2]));
    if (d) out.push(d);
  }
  return out;
}

// Main entry. Returns { exp, mfg, guessName } — any field may be null.
function parseLabel(rawText, region = "DMY") {
  if (!rawText || typeof rawText !== "string") return { exp: null, mfg: null, guessName: null };

  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let exp = null;
  let mfg = null;
  const loose = [];

  for (const line of lines) {
    const dates = findDates(line, region);
    if (!dates.length) continue;
    if (EXP_WORDS.test(line)) exp = exp || dates[0];
    else if (MFG_WORDS.test(line)) mfg = mfg || dates[0];
    else loose.push(...dates);
  }

  // No labelled expiry? Take the latest unlabelled date — expiry is the future one.
  if (!exp && loose.length) {
    loose.sort((a, b) => b - a);
    exp = loose[0];
    if (!mfg && loose.length > 1) mfg = loose[loose.length - 1];
  }

  // Cheap name guess: first line that has letters but no digits (likely product name).
  const guessName = lines.find((l) => /[A-Za-z぀-ヿ一-龯]/.test(l) && !/\d/.test(l)) || null;

  return { exp, mfg, guessName };
}

module.exports = { parseLabel, resolveNumeric, validDate };
