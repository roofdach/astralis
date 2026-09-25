"use client";

import { useEffect, useReducer, useRef } from "react";
import BigCookie from "./BigCookie";
import GoldenCookie from "./GoldenCookie";
import InfoPanel from "./InfoPanel";
import Store from "./Store";
import Toasts from "./Toasts";
import {
  BUFFS,
  createInitialState,
  gameReducer,
  getClickPower,
  getCps,
  getModifiers,
  loadGame,
  saveGame,
} from "@/lib/cookie-clicker/game";
import { formatNumber } from "@/lib/cookie-clicker/format";

const TICK_MS = 50;
const AUTOSAVE_MS = 30000;

const panelClass =
  "rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-[var(--card-foreground)] shadow-md sm:p-6";

function useGameLoop(dispatch) {
  useEffect(() => {
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      dispatch({ type: "TICK", dt, rand: [Math.random(), Math.random(), Math.random()] });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [dispatch]);
}

function useAutosave(state) {
  const latest = useRef(state);

  useEffect(() => {
    latest.current = state;
  }, [state]);

  useEffect(() => {
    const save = () => saveGame(latest.current);
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") save();
    };
    const id = setInterval(save, AUTOSAVE_MS);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", save);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", save);
      save();
    };
  }, []);
}

function useCookieTitle(cookies) {
  const label = formatNumber(cookies);

  useEffect(() => {
    const original = document.title;
    return () => {
      document.title = original;
    };
  }, []);

  useEffect(() => {
    document.title = `${label} cookie${label === "1" ? "" : "s"} · Cookie Clicker`;
  }, [label]);
}

export default function CookieGame() {
  // Rendered client-only (see ClickerLoader), so reading localStorage here is safe.
  const [state, dispatch] = useReducer(gameReducer, null, () => loadGame() ?? createInitialState());

  useGameLoop(dispatch);
  useAutosave(state);
  useCookieTitle(state.cookies);

  const mods = getModifiers(state);
  const cps = getCps(state, mods);
  const clickPower = getClickPower(state, mods);
  // "1.234 million" -> big "1.234" with "million cookies" underneath.
  const [bankNumber, bankSuffix] = formatNumber(state.cookies).split(" ");

  return (
    <>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 pb-12 pt-6 lg:grid-cols-3">
        <section className={`${panelClass} order-1 overflow-hidden lg:sticky lg:top-20 lg:self-start`} aria-label="Bakery">
          <div className="mb-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Astralis Bakery</p>
            <p className="mt-1 break-all text-4xl font-black tabular-nums text-[var(--foreground)] sm:text-5xl">
              {bankNumber}
            </p>
            <p className="text-sm font-semibold text-[var(--muted-foreground)]">
              {bankSuffix ? `${bankSuffix} cookies` : bankNumber === "1" ? "cookie" : "cookies"}
            </p>
            <p className="mt-2 text-sm tabular-nums">
              per second: <span className="font-bold">{formatNumber(cps, 1)}</span>
            </p>
          </div>

          <BigCookie clickPower={clickPower} onClick={() => dispatch({ type: "CLICK" })} />

          <p className="mt-6 text-center text-xs text-[var(--muted-foreground)]">
            {formatNumber(clickPower, 1)} cookie{clickPower === 1 ? "" : "s"} per click
          </p>

          {state.buffs.length > 0 && (
            <ul className="mt-4 flex flex-col gap-2">
              {state.buffs.map((buff) => (
                <li key={buff.type} className="rounded-lg border border-[var(--cc-gold)] p-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="font-bold">✨ {BUFFS[buff.type].name}</span>
                    <span className="tabular-nums text-[var(--muted-foreground)]">{Math.ceil(buff.timeLeft)}s</span>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)]">{BUFFS[buff.type].desc}</p>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--muted)]">
                    <div
                      className="h-full rounded-full bg-[var(--cc-gold)]"
                      style={{ width: `${(buff.timeLeft / buff.duration) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`${panelClass} order-3 lg:order-2`} aria-label="Stats, achievements and options">
          <InfoPanel state={state} dispatch={dispatch} />
        </section>

        <section className={`${panelClass} order-2 lg:order-3`} aria-label="Store">
          <Store state={state} dispatch={dispatch} />
        </section>
      </div>

      {state.golden && (
        <GoldenCookie
          golden={state.golden}
          onClick={() => dispatch({ type: "CLICK_GOLDEN", effectRand: Math.random(), delayRand: Math.random() })}
        />
      )}

      <Toasts toasts={state.toasts} dispatch={dispatch} />
    </>
  );
}
