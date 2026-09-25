"use client";

import { useRef, useState } from "react";
import CookieArt from "./CookieArt";
import { formatNumber } from "@/lib/cookie-clicker/format";

const MAX_PARTICLES = 25;

export default function BigCookie({ clickPower, onClick }) {
  const [particles, setParticles] = useState([]);
  const nextId = useRef(0);

  const handleClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    // Keyboard activation reports detail === 0 and no useful coordinates.
    const fromPointer = event.detail > 0;
    const particle = {
      id: nextId.current++,
      x: fromPointer ? event.clientX - rect.left : rect.width / 2,
      y: fromPointer ? event.clientY - rect.top : rect.height / 2,
      text: `+${formatNumber(clickPower, 1)}`,
    };
    setParticles((current) => [...current.slice(-(MAX_PARTICLES - 1)), particle]);
    onClick();
  };

  const removeParticle = (id) => setParticles((current) => current.filter((p) => p.id !== id));

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[18rem] select-none">
      <div className="cc-rays pointer-events-none absolute -inset-10 rounded-full" />
      <button
        type="button"
        onClick={handleClick}
        aria-label={`Click the big cookie for ${formatNumber(clickPower, 1)} cookies`}
        className="relative block size-full touch-manipulation rounded-full transition-transform duration-100 hover:scale-[1.03] active:scale-95 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[var(--cc-accent)]"
      >
        <CookieArt className="size-full drop-shadow-xl" />
      </button>
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {particles.map((p) => (
          <span
            key={p.id}
            onAnimationEnd={() => removeParticle(p.id)}
            className="cc-float absolute whitespace-nowrap text-lg font-black text-[var(--foreground)] [text-shadow:0_1px_3px_var(--background)]"
            style={{ left: p.x, top: p.y }}
          >
            {p.text}
          </span>
        ))}
      </div>
    </div>
  );
}
