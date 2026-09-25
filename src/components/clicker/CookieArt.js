"use client";

import { useId } from "react";

const CHIPS = [
  [70, 62, 11],
  [122, 55, 9],
  [140, 100, 12],
  [95, 105, 10],
  [60, 125, 12],
  [112, 145, 11],
  [150, 140, 8],
  [80, 160, 7],
  [45, 90, 7],
  [100, 78, 6],
];

const CRUMBS = [
  [85, 85, 2.5],
  [130, 80, 2],
  [120, 120, 2.5],
  [70, 100, 2],
  [140, 160, 2],
  [95, 135, 2],
];

const PALETTES = {
  plain: { light: "#f6cf87", mid: "#dc9d45", dark: "#a8681f", edge: "#8a5317", chipLight: "#7a4a24", chipDark: "#3b1f0c", crumb: "#b8782c" },
  golden: { light: "#fff6c2", mid: "#f5c542", dark: "#c08a12", edge: "#9a6d06", chipLight: "#e0a91f", chipDark: "#8a5f00", crumb: "#d99f1c" },
};

export default function CookieArt({ golden = false, className }) {
  // useId output can contain characters that break url(#...) references.
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const p = golden ? PALETTES.golden : PALETTES.plain;

  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-dough`} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor={p.light} />
          <stop offset="65%" stopColor={p.mid} />
          <stop offset="100%" stopColor={p.dark} />
        </radialGradient>
        <radialGradient id={`${id}-chip`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor={p.chipLight} />
          <stop offset="100%" stopColor={p.chipDark} />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="92" fill={`url(#${id}-dough)`} stroke={p.edge} strokeWidth="4" />
      <circle cx="100" cy="100" r="80" fill="none" stroke={p.edge} strokeOpacity="0.2" strokeWidth="6" />
      {CHIPS.map(([cx, cy, r], i) => (
        <ellipse
          key={i}
          cx={cx}
          cy={cy}
          rx={r}
          ry={r * 0.8}
          transform={`rotate(${(i * 37) % 180} ${cx} ${cy})`}
          fill={`url(#${id}-chip)`}
        />
      ))}
      {CRUMBS.map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={p.crumb} />
      ))}
    </svg>
  );
}
