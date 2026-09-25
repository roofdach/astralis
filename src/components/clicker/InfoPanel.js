"use client";

import { useState } from "react";
import { ACHIEVEMENTS, BUILDINGS, UPGRADES, UPGRADE_MAP } from "@/lib/cookie-clicker/data";
import {
  ACHIEVEMENT_BONUS,
  clearSave,
  decodeSave,
  encodeSave,
  getBaseCps,
  getClickPower,
  getCps,
  getModifiers,
  saveGame,
  totalBuildings,
} from "@/lib/cookie-clicker/game";
import { describe, formatDuration, formatNumber } from "@/lib/cookie-clicker/format";

const TABS = [
  { id: "stats", label: "Stats" },
  { id: "achievements", label: "Achievements" },
  { id: "options", label: "Options" },
];

const buttonClass =
  "rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-semibold transition-colors hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-50";
const dangerButtonClass =
  "rounded-lg border border-[var(--cc-bad)] px-3 py-2 text-sm font-semibold text-[var(--cc-bad)] transition-colors hover:bg-[var(--cc-bad)] hover:text-white";

// In-page confirmation (window.confirm is blocked in some embedded viewers).
function ConfirmBox({ message, confirmLabel, onConfirm, onCancel }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-[var(--cc-bad)] p-3">
      <p>{message}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onConfirm} className={dangerButtonClass}>
          {confirmLabel}
        </button>
        <button type="button" onClick={onCancel} className={buttonClass}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function Stats({ state }) {
  const mods = getModifiers(state);
  const baseCps = getBaseCps(state, mods);
  const cps = getCps(state, mods);
  const rows = [
    ["Cookies in bank", formatNumber(state.cookies)],
    ["Cookies baked (all time)", formatNumber(state.totalBaked)],
    ["Cookies per second", cps !== baseCps ? `${formatNumber(cps, 1)} (base ${formatNumber(baseCps, 1)})` : formatNumber(cps, 1)],
    ["Cookies per click", formatNumber(getClickPower(state, mods), 1)],
    ["Big cookie clicks", formatNumber(state.clicks)],
    ["Hand-made cookies", formatNumber(state.handmade)],
    ["Buildings owned", formatNumber(totalBuildings(state))],
    ["Upgrades purchased", `${state.upgrades.length} / ${UPGRADES.length}`],
    ["Achievements", `${state.achievements.length} / ${ACHIEVEMENTS.length}`],
    ["Golden cookies clicked", formatNumber(state.goldenClicks)],
    ["Time played", formatDuration(state.timePlayed)],
  ];
  const owned = state.upgrades.map((id) => UPGRADE_MAP[id]);

  return (
    <div className="flex flex-col gap-5">
      <dl className="divide-y divide-[var(--border)] text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 py-2">
            <dt className="text-[var(--muted-foreground)]">{label}</dt>
            <dd className="text-right font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <div>
        <h3 className="mb-2 text-sm font-bold">Buildings</h3>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
          {BUILDINGS.map((b) => (
            <li key={b.id} className="flex justify-between gap-2">
              <span className="truncate text-[var(--muted-foreground)]">
                {b.icon} {b.name}
              </span>
              <span className="font-semibold tabular-nums">{state.buildings[b.id]}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-bold">Purchased upgrades</h3>
        {owned.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">None yet.</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {owned.map((u) => (
              <li
                key={u.id}
                title={`${u.name}: ${u.desc}`}
                className="flex size-9 items-center justify-center rounded-md bg-[var(--muted)] text-lg"
              >
                <span aria-hidden="true">{u.icon}</span>
                <span className="sr-only">{u.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Achievements({ state }) {
  const unlocked = new Set(state.achievements);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[var(--muted-foreground)]">
        {unlocked.size} / {ACHIEVEMENTS.length} unlocked. Each one boosts cookie production by{" "}
        {ACHIEVEMENT_BONUS * 100}% (currently +{formatNumber(unlocked.size * ACHIEVEMENT_BONUS * 100)}%).
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {ACHIEVEMENTS.map((a) => {
          const done = unlocked.has(a.id);
          return (
            <li
              key={a.id}
              className={`flex items-start gap-2 rounded-lg border p-2 text-sm ${
                done ? "border-[var(--cc-gold)]" : "border-[var(--border)] opacity-55"
              }`}
            >
              <span aria-hidden="true">{done ? "🏆" : "🔒"}</span>
              <span className="min-w-0">
                <span className="block font-semibold">
                  {a.name}
                  <span className="sr-only">{done ? " (unlocked)" : " (locked)"}</span>
                </span>
                <span className="block text-xs text-[var(--muted-foreground)]">{describe(a)}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Options({ state, dispatch }) {
  const [exported, setExported] = useState("");
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const [pending, setPending] = useState(null); // "import" | "wipe" | null

  const toast = (title, text) => dispatch({ type: "TOAST", toast: { kind: "info", title, text } });

  const handleSave = () => {
    if (saveGame(state)) toast("Game saved");
    else toast("Could not save", "Your browser is blocking local storage.");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exported);
      toast("Save copied to clipboard");
    } catch {
      toast("Could not copy", "Select the text and copy it manually.");
    }
  };

  const handleImport = () => {
    if (!decodeSave(importText)) {
      setImportError("That isn't a valid save code. Paste the whole code from Export save.");
      return;
    }
    setPending("import");
  };

  const confirmImport = () => {
    const loaded = decodeSave(importText);
    setPending(null);
    if (!loaded) return;
    dispatch({ type: "LOAD", state: loaded });
    saveGame(loaded);
    setImportText("");
    setImportError("");
    toast("Save imported");
  };

  const confirmReset = () => {
    setPending(null);
    clearSave();
    dispatch({ type: "RESET" });
    setExported("");
    toast("Progress wiped", "A fresh start. Happy baking!");
  };

  return (
    <div className="flex flex-col gap-6 text-sm">
      <section className="flex flex-col gap-2">
        <h3 className="font-bold">Saving</h3>
        <p className="text-[var(--muted-foreground)]">
          Progress is saved in this browser automatically every 30 seconds and whenever you leave the page.
        </p>
        <div>
          <button type="button" onClick={handleSave} className={buttonClass}>
            Save now
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold">Export save</h3>
        <p className="text-[var(--muted-foreground)]">Back up your progress or move it to another browser.</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setExported(encodeSave(state))} className={buttonClass}>
            Generate save code
          </button>
          <button type="button" onClick={handleCopy} disabled={!exported} className={buttonClass}>
            Copy
          </button>
        </div>
        {exported && (
          <textarea
            readOnly
            value={exported}
            aria-label="Save code"
            onFocus={(e) => e.target.select()}
            className="h-24 w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--background)] p-2 font-mono text-xs break-all"
          />
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold">Import save</h3>
        <textarea
          value={importText}
          onChange={(e) => {
            setImportText(e.target.value);
            setImportError("");
            if (pending === "import") setPending(null);
          }}
          placeholder="Paste a save code here"
          aria-label="Save code to import"
          className="h-24 w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--background)] p-2 font-mono text-xs break-all"
        />
        {importError && <p className="text-[var(--cc-bad)]">{importError}</p>}
        {pending === "import" ? (
          <ConfirmBox
            message="Importing replaces your current progress."
            confirmLabel="Replace progress"
            onConfirm={confirmImport}
            onCancel={() => setPending(null)}
          />
        ) : (
          <div>
            <button type="button" onClick={handleImport} disabled={!importText.trim()} className={buttonClass}>
              Import
            </button>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-bold">Danger zone</h3>
        {pending === "wipe" ? (
          <ConfirmBox
            message="This deletes all your cookies, buildings, upgrades and achievements. It can't be undone."
            confirmLabel="Wipe everything"
            onConfirm={confirmReset}
            onCancel={() => setPending(null)}
          />
        ) : (
          <div>
            <button type="button" onClick={() => setPending("wipe")} className={dangerButtonClass}>
              Wipe save
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default function InfoPanel({ state, dispatch }) {
  const [tab, setTab] = useState("stats");

  return (
    <div>
      <div role="tablist" aria-label="Game information" className="mb-4 flex gap-1 rounded-lg bg-[var(--muted)] p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`cc-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`cc-panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
              tab === t.id
                ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`cc-panel-${tab}`} aria-labelledby={`cc-tab-${tab}`}>
        {tab === "stats" && <Stats state={state} />}
        {tab === "achievements" && <Achievements state={state} />}
        {tab === "options" && <Options state={state} dispatch={dispatch} />}
      </div>
    </div>
  );
}
