const SUFFIXES = [
  "million",
  "billion",
  "trillion",
  "quadrillion",
  "quintillion",
  "sextillion",
  "septillion",
  "octillion",
  "nonillion",
  "decillion",
];

// Formats a cookie amount: "1,234", "12.5" (with decimals), "1.234 million".
export function formatNumber(value, decimals = 0) {
  if (Number.isNaN(value)) return "0";
  if (!Number.isFinite(value)) return value > 0 ? "Infinity" : "-Infinity";

  const sign = value < 0 ? "-" : "";
  const n = Math.abs(value);

  if (n < 1e6) {
    if (decimals > 0 && n < 1000) {
      const factor = 10 ** decimals;
      const floored = Math.floor(n * factor + 1e-9) / factor;
      return sign + floored.toLocaleString("en-US", { maximumFractionDigits: decimals });
    }
    return sign + Math.floor(n).toLocaleString("en-US");
  }

  let tier = Math.floor(Math.log10(n) / 3);
  let scaled = n / 10 ** (tier * 3);
  // Guard against floating point error in log10 near exact powers of 1000.
  if (scaled >= 1000) {
    tier += 1;
    scaled /= 1000;
  } else if (scaled < 1) {
    tier -= 1;
    scaled *= 1000;
  }

  const suffix = SUFFIXES[tier - 2];
  if (!suffix) return sign + n.toExponential(3).replace("e+", "e");

  // Floor rather than round so the displayed value never exceeds the real one
  // (and can't read "1000.000 million").
  const truncated = Math.floor(scaled * 1000 + 1e-9) / 1000;
  return `${sign}${truncated.toFixed(3)} ${suffix}`;
}

export function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (s || parts.length === 0) parts.push(`${s}s`);
  return parts.join(" ");
}

// Fills the "{amount}" placeholder used in achievement descriptions.
export function describe(entry) {
  return entry.amount === undefined ? entry.desc : entry.desc.replace("{amount}", formatNumber(entry.amount));
}
