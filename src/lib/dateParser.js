// Local date-parsing engine (v2). Pure JS, node-testable.
// Handles the messy reality of food labels: numeric dates in any region order,
// written-out months, month/year-only "best before", keywords on a separate
// line from the date, and multiple dates (manufacture + expiry).

const MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

// Keyword groups (case-insensitive). Japanese included (Kawaii/JP-first).
const EXP_WORDS = /(exp(?:iry|ires|iration)?|\bbbd?\b|\bbbe\b|best\s*before(?:\s*end)?|use\s*by|sell\s*by|consume\s*by|valid\s*(?:until|to)|\bed\b|expir)|賞味期限|消費期限/i;
const MFG_WORDS = /(mfg|mfd|prod(?:uced)?|packed|\bpkd\b|manufactured?|made(?:\s*on)?)|製造|加工/i;

function fullYear(y) {
  const n = Number(y);
  return n >= 100 ? n : 2000 + n; // 2-digit year → 2000s
}
function daysInMonth(y, m) {
  return new Date(y, m, 0).getDate();
}
function mk(y, m, d) {
  if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return dt;
}
function monthFrom(word) {
  return MONTHS[word.slice(0, 3).toLowerCase()];
}

// Resolve which of two small numbers is the month vs day. Returns [month, day].
function monthDay(x, y, region) {
  if (x > 12 && y <= 12) return [y, x]; // x can only be a day
  if (y > 12 && x <= 12) return [x, y]; // y can only be a day
  if (x > 12 && y > 12) return null;    // impossible
  return region === "MDY" ? [x, y] : [y, x]; // both ≤12: region decides
}

// Numeric d/m/y in any order, resolved by region + "a part >12 must be the day".
function resolveNumeric(a, b, c, region) {
  if (a.length === 4) {                          // YYYY ? ?
    const md = monthDay(Number(b), Number(c), "MDY"); // YMD → month then day
    return md ? mk(Number(a), md[0], md[1]) : null;
  }
  if (c.length === 4) {                           // ? ? YYYY
    const md = monthDay(Number(a), Number(b), region);
    return md ? mk(fullYear(c), md[0], md[1]) : null;
  }
  if (region === "YMD") {                          // YY MM DD
    const md = monthDay(Number(b), Number(c), "MDY");
    return md ? mk(fullYear(a), md[0], md[1]) : null;
  }
  const md = monthDay(Number(a), Number(b), region); // year is last
  return md ? mk(fullYear(c), md[0], md[1]) : null;
}

// Extract every date in a line. my=true marks month/year-only (→ end of month).
function extractDates(line, region) {
  const out = [];
  let m;
  const push = (t, my) => { if (t) out.push({ t, my: !!my }); };

  const reNum = /(\d{1,4})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/g;
  while ((m = reNum.exec(line))) push(resolveNumeric(m[1], m[2], m[3], region));

  // Year-first with loose separators (handles OCR turning "/" into a space, e.g.
  // "2024/01 28"). Year leads, so it's unambiguous and safe.
  const reYMD = /(\d{4})[\/.\-\s]+(\d{1,2})[\/.\-\s]+(\d{1,2})(?!\d)/g;
  while ((m = reYMD.exec(line))) {
    const md = monthDay(Number(m[2]), Number(m[3]), "MDY"); // YMD → month then day
    if (md) push(mk(Number(m[1]), md[0], md[1]));
  }

  const reDMon = /(\d{1,2})(?:st|nd|rd|th)?[\s.\-]*([A-Za-z]{3,9})\.?[\s,.\-]*(\d{2,4})/g;
  while ((m = reDMon.exec(line))) { const mo = monthFrom(m[2]); if (mo) push(mk(fullYear(m[3]), mo, Number(m[1]))); }

  const reMonD = /([A-Za-z]{3,9})\.?[\s,.\-]*(\d{1,2})(?:st|nd|rd|th)?[\s,.\-]+(\d{2,4})/g;
  while ((m = reMonD.exec(line))) { const mo = monthFrom(m[1]); if (mo) push(mk(fullYear(m[3]), mo, Number(m[2]))); }

  const reMY = /(?<![\d\/.\-])(\d{1,2})[\/.\-](\d{4})(?![\d\/.\-])/g;
  while ((m = reMY.exec(line))) { const mo = Number(m[1]); if (mo >= 1 && mo <= 12) push(mk(Number(m[2]), mo, daysInMonth(Number(m[2]), mo)), true); }

  const reYM = /(?<![\d\/.\-])(\d{4})[\/.\-](\d{1,2})(?![\d\/.\-])/g;
  while ((m = reYM.exec(line))) { const mo = Number(m[2]); if (mo >= 1 && mo <= 12) push(mk(Number(m[1]), mo, daysInMonth(Number(m[1]), mo)), true); }

  const reMonYr = /([A-Za-z]{3,9})\.?[\s,.\-]*(\d{2,4})/g;
  while ((m = reMonYr.exec(line))) { const mo = monthFrom(m[1]); if (mo) { const y = fullYear(m[2]); push(mk(y, mo, daysInMonth(y, mo)), true); } }

  // Drop month/year-only dates when an exact date in the same month already exists.
  const exact = out.filter((o) => !o.my);
  const kept = out.filter((o) => !o.my || !exact.some((e) => e.t.getFullYear() === o.t.getFullYear() && e.t.getMonth() === o.t.getMonth()));
  const seen = new Set();
  return kept.filter((o) => { const k = o.t.getTime(); if (seen.has(k)) return false; seen.add(k); return true; });
}

function parseLabel(rawText, region = "DMY") {
  const empty = { exp: null, mfg: null, candidates: [], guessName: null };
  if (!rawText || typeof rawText !== "string") return empty;

  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const now = Date.now();
  const MIN = now - 3 * 365 * 864e5;
  const MAX = now + 8 * 365 * 864e5;
  const plausible = (d) => d && d.getTime() >= MIN && d.getTime() <= MAX;

  const all = [];
  let carryKw = null; // a keyword on a line with no date applies to the next line
  for (const line of lines) {
    const lineKw = EXP_WORDS.test(line) ? "exp" : MFG_WORDS.test(line) ? "mfg" : null;
    const ds = extractDates(line, region).filter((o) => plausible(o.t));
    if (ds.length === 0) { if (lineKw) carryKw = lineKw; continue; }
    const kw = lineKw || carryKw;
    carryKw = null;
    for (const o of ds) all.push({ t: o.t, kw, my: o.my });
  }

  // Globally drop month/year-only guesses when a full date in the same month
  // exists (e.g. "2024/01/28" beats a stray "2024/01" → Jan 31).
  const exact = all.filter((o) => !o.my);
  const usable = all.filter(
    (o) => !o.my || !exact.some((e) => e.t.getFullYear() === o.t.getFullYear() && e.t.getMonth() === o.t.getMonth())
  );

  // unique by time (an exp-labelled hit wins over an unlabelled duplicate)
  const map = new Map();
  for (const o of usable) { const k = o.t.getTime(); if (!map.has(k) || o.kw === "exp") map.set(k, o); }
  const cands = [...map.values()].sort((a, b) => b.t - a.t); // future-most first

  let exp = null, mfg = null;
  const expHits = cands.filter((c) => c.kw === "exp");
  const mfgHits = cands.filter((c) => c.kw === "mfg");
  if (expHits.length) exp = expHits[0].t;                       // latest labelled expiry
  if (mfgHits.length) mfg = mfgHits[mfgHits.length - 1].t;      // earliest labelled make date
  if (!exp) {
    const pool = cands.filter((c) => !(mfg && c.t.getTime() === mfg.getTime()));
    if (pool.length) exp = pool[0].t;                          // future-most remaining
  }
  if (!mfg && cands.length > 1) {
    const earliest = cands[cands.length - 1].t;
    if (!exp || earliest.getTime() !== exp.getTime()) mfg = earliest;
  }

  const guessName = lines.find(
    (l) => /[A-Za-z぀-ヿ一-龯]/.test(l) && !/\d/.test(l) && !EXP_WORDS.test(l) && !MFG_WORDS.test(l)
  ) || null;

  return { exp, mfg, candidates: cands.map((c) => c.t), guessName };
}

module.exports = { parseLabel, resolveNumeric, mk };
