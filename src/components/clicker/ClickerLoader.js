"use client";

import dynamic from "next/dynamic";

// The game reads its save from localStorage on the first render, so it is
// rendered on the client only (no server HTML to mismatch against).
const CookieGame = dynamic(() => import("./CookieGame"), {
  ssr: false,
  loading: () => (
    <p className="pt-24 text-center text-sm text-[var(--muted-foreground)]">Preheating the oven…</p>
  ),
});

export default function ClickerLoader() {
  return <CookieGame />;
}
