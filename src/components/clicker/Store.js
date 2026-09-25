"use client";

import { useState } from "react";
import { BUILDINGS } from "@/lib/cookie-clicker/data";
import {
  buildingUnitCps,
  bulkPrice,
  getAvailableUpgrades,
  getModifiers,
  sellValue,
} from "@/lib/cookie-clicker/game";
import { formatNumber } from "@/lib/cookie-clicker/format";

const AMOUNTS = [1, 10, 100];

function SegmentButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-md px-2.5 py-1 text-xs font-bold transition-colors ${
        active
          ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
          : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
      }`}
    >
      {children}
    </button>
  );
}

// A building is shown once it's affordable-ish, owned, or the previous one is owned.
// The first building that isn't shown yet appears as a "???" teaser.
function visibleBuildings(state) {
  const shown = [];
  for (const [i, b] of BUILDINGS.entries()) {
    const visible =
      i === 0 || state.buildings[b.id] > 0 || state.buildings[BUILDINGS[i - 1].id] > 0 || state.totalBaked >= b.baseCost;
    if (!visible) return { shown, teaser: b };
    shown.push(b);
  }
  return { shown, teaser: null };
}

export default function Store({ state, dispatch }) {
  const [mode, setMode] = useState("buy");
  const [amount, setAmount] = useState(1);

  const mods = getModifiers(state);
  const upgrades = getAvailableUpgrades(state);
  const { shown, teaser } = visibleBuildings(state);

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="cc-upgrades-heading">
        <h2 id="cc-upgrades-heading" className="mb-3 text-lg font-bold">
          Upgrades
        </h2>
        {upgrades.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">No upgrades available yet. Keep baking!</p>
        ) : (
          <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto pr-1">
            {upgrades.map((u) => {
              const affordable = state.cookies >= u.cost;
              return (
                <li key={u.id}>
                  <button
                    type="button"
                    disabled={!affordable}
                    onClick={() => dispatch({ type: "BUY_UPGRADE", id: u.id })}
                    className="flex w-full items-center gap-3 rounded-lg border border-[var(--border)] px-3 py-2 text-left transition-colors enabled:hover:border-[var(--cc-accent)] enabled:hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[var(--muted)] text-xl" aria-hidden="true">
                      {u.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{u.name}</span>
                      <span className="block text-xs text-[var(--muted-foreground)]">{u.desc}</span>
                    </span>
                    <span className={`shrink-0 text-sm font-bold tabular-nums ${affordable ? "text-[var(--cc-good)]" : "text-[var(--cc-bad)]"}`}>
                      {formatNumber(u.cost)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="cc-buildings-heading">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 id="cc-buildings-heading" className="text-lg font-bold">
            Buildings
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-[var(--border)] p-0.5" role="group" aria-label="Buy or sell">
              <SegmentButton active={mode === "buy"} onClick={() => setMode("buy")}>
                Buy
              </SegmentButton>
              <SegmentButton active={mode === "sell"} onClick={() => setMode("sell")}>
                Sell
              </SegmentButton>
            </div>
            <div className="flex rounded-lg border border-[var(--border)] p-0.5" role="group" aria-label="Amount">
              {AMOUNTS.map((n) => (
                <SegmentButton key={n} active={amount === n} onClick={() => setAmount(n)}>
                  {n}
                </SegmentButton>
              ))}
            </div>
          </div>
        </div>

        <ul className="flex flex-col gap-2">
          {shown.map((b) => {
            const owned = state.buildings[b.id];
            const unitCps = buildingUnitCps(state, b.id, mods);
            const selling = mode === "sell";
            const price = selling ? sellValue(b.id, owned, amount) : bulkPrice(b.id, owned, amount);
            const enabled = selling ? owned > 0 : state.cookies >= price;
            const priceColor = selling ? "text-[var(--cc-accent)]" : enabled ? "text-[var(--cc-good)]" : "text-[var(--cc-bad)]";
            const action = selling
              ? `Sell ${Math.min(amount, owned)} ${b.name} for ${formatNumber(price)} cookies`
              : `Buy ${amount} ${b.name} for ${formatNumber(price)} cookies`;

            return (
              <li key={b.id}>
                <button
                  type="button"
                  disabled={!enabled}
                  title={b.desc}
                  aria-label={`${action}. Owned: ${owned}.`}
                  onClick={() => dispatch({ type: selling ? "SELL_BUILDING" : "BUY_BUILDING", id: b.id, amount })}
                  className="flex w-full items-center gap-3 rounded-lg border border-[var(--border)] px-3 py-2 text-left transition-colors enabled:hover:border-[var(--cc-accent)] enabled:hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[var(--muted)] text-2xl" aria-hidden="true">
                    {b.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{b.name}</span>
                    <span className={`block text-sm font-bold tabular-nums ${priceColor}`}>
                      {selling ? "+" : ""}
                      {formatNumber(price)} 🍪
                    </span>
                    <span className="block text-xs text-[var(--muted-foreground)]">
                      {owned > 0
                        ? `${formatNumber(unitCps, 1)}/s each · ${formatNumber(unitCps * owned, 1)}/s total`
                        : b.desc}
                    </span>
                  </span>
                  <span className="shrink-0 text-3xl font-black tabular-nums text-[var(--muted-foreground)]">{owned}</span>
                </button>
              </li>
            );
          })}
          {teaser && (
            <li>
              <div className="flex w-full items-center gap-3 rounded-lg border border-dashed border-[var(--border)] px-3 py-2 opacity-60">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[var(--muted)] text-2xl" aria-hidden="true">
                  ❔
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">???</span>
                  <span className="block text-sm font-bold tabular-nums text-[var(--cc-bad)]">
                    {formatNumber(bulkPrice(teaser.id, 0, 1))} 🍪
                  </span>
                </span>
              </div>
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
