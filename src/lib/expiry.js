// Turns an expiry date into a human countdown + a tone for the badge color.
const DAY = 86400000;

export function formatDate(d, region = "DMY") {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt)) return "—";
  const Y = dt.getFullYear();
  const M = String(dt.getMonth() + 1).padStart(2, "0");
  const D = String(dt.getDate()).padStart(2, "0");
  if (region === "YMD") return `${Y}/${M}/${D}`;
  if (region === "MDY") return `${M}/${D}/${Y}`;
  return `${D}/${M}/${Y}`;
}

export function daysLeft(expISO) {
  if (!expISO) return null;
  const exp = new Date(expISO);
  if (isNaN(exp)) return null;
  const today = new Date();
  const a = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const b = Date.UTC(exp.getFullYear(), exp.getMonth(), exp.getDate());
  return Math.round((b - a) / DAY);
}

// tone keys map to theme.badge.* colors
export function expiryBadge(expISO) {
  const d = daysLeft(expISO);
  if (d === null) return { label: "No date", tone: "neutral" };
  if (d < 0) {
    const n = Math.abs(d);
    return { label: `Expired ${n} day${n === 1 ? "" : "s"} ago`, tone: "bad" };
  }
  if (d === 0) return { label: "Expires today", tone: "warn" };
  if (d <= 3) return { label: `${d} day${d === 1 ? "" : "s"} left`, tone: "warn" };
  if (d <= 7) return { label: `${d} days left`, tone: "soon" };
  return { label: `${d} days left`, tone: "good" };
}
