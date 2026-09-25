"use client";

import CookieArt from "./CookieArt";

export default function GoldenCookie({ golden, onClick }) {
  // Fade out over the last two seconds.
  const opacity = Math.min(1, golden.timeLeft / 2);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Golden cookie! Click it for a bonus"
      className="fixed z-40 size-20 touch-manipulation rounded-full focus-visible:outline-4 focus-visible:outline-[var(--cc-gold)]"
      style={{
        left: `calc(${golden.x} * (100% - 96px) + 8px)`,
        top: `calc(80px + ${golden.y} * (100% - 176px))`,
        opacity,
      }}
    >
      <CookieArt golden className="cc-golden size-full" />
    </button>
  );
}
