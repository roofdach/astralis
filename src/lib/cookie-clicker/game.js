// Pure game engine. Every function here is deterministic: anything random
// (golden cookie timing/placement/effects) is passed in on the action, so the
// reducer stays pure and safe to run twice under React strict mode.

import { ACHIEVEMENTS, ACHIEVEMENT_MAP, BUILDINGS, BUILDING_MAP, UPGRADE_MAP } from "./data.js";
import { formatNumber } from "./format.js";

export const SAVE_KEY = "astralis-cookie-clicker";
export const SAVE_VERSION = 1;

export const PRICE_GROWTH = 1.15;
export const SELL_REFUND = 0.25;
export const ACHIEVEMENT_BONUS = 0.01; // +1% CpS per achievement

export const GOLDEN_MIN_DELAY = 120; // seconds
export const GOLDEN_MAX_DELAY = 360;
export const GOLDEN_LIFETIME = 13;

export const BUFFS = {
  frenzy: { name: "Frenzy", multiplier: 7, duration: 77, desc: "Cookie production x7" },
  clickFrenzy: { name: "Click frenzy", multiplier: 777, duration: 13, desc: "Clicking power x777" },
};

const MAX_TOASTS = 4;

export function createInitialState() {
  return {
    version: SAVE_VERSION,
    cookies: 0,
    totalBaked: 0,
    handmade: 0,
    clicks: 0,
    goldenClicks: 0,
    timePlayed: 0,
    buildings: Object.fromEntries(BUILDINGS.map((b) => [b.id, 0])),
    upgrades: [],
    achievements: [],
    buffs: [],
    golden: null,
    goldenTimer: goldenDelay({ upgrades: [] }, 0.5),
    toasts: [],
    nextToastId: 1,
  };
}

// ---------------------------------------------------------------------------
// Derived values
// ---------------------------------------------------------------------------

export function getModifiers(state) {
  const mods = {
    buildingDoublings: {},
    cursorDoublings: 0,
    fingersAdd: 0,
    fingersMult: 1,
    mousePercent: 0,
    flavorPercent: 0,
    goldenFreq: 0,
    buffLength: 0,
  };
  for (const id of state.upgrades) {
    const u = UPGRADE_MAP[id];
    if (!u) continue;
    switch (u.kind) {
      case "building":
        mods.buildingDoublings[u.building] = (mods.buildingDoublings[u.building] ?? 0) + 1;
        break;
      case "cursorDouble":
        mods.cursorDoublings += 1;
        break;
      case "fingersAdd":
        mods.fingersAdd += u.amount;
        break;
      case "fingersMult":
        mods.fingersMult *= u.factor;
        break;
      case "mouse":
        mods.mousePercent += u.percent;
        break;
      case "flavor":
        mods.flavorPercent += u.percent;
        break;
      case "goldenFreq":
        mods.goldenFreq += 1;
        break;
      case "buffLength":
        mods.buffLength += 1;
        break;
    }
  }
  return mods;
}

export function totalBuildings(state) {
  return BUILDINGS.reduce((sum, b) => sum + state.buildings[b.id], 0);
}

// Bonus from Thousand fingers & co: added per non-cursor building.
function fingersBonus(state, mods) {
  return mods.fingersAdd * mods.fingersMult * (totalBuildings(state) - state.buildings.cursor);
}

export function globalMultiplier(state, mods = getModifiers(state)) {
  return (1 + mods.flavorPercent / 100) * (1 + ACHIEVEMENT_BONUS * state.achievements.length);
}

// CpS of a single building of this type, including all multipliers except buffs.
export function buildingUnitCps(state, buildingId, mods = getModifiers(state)) {
  const b = BUILDING_MAP[buildingId];
  let unit;
  if (buildingId === "cursor") {
    unit = b.baseCps * 2 ** mods.cursorDoublings + fingersBonus(state, mods);
  } else {
    unit = b.baseCps * 2 ** (mods.buildingDoublings[buildingId] ?? 0);
  }
  return unit * globalMultiplier(state, mods);
}

export function getBuff(state, type) {
  return state.buffs.find((buff) => buff.type === type) ?? null;
}

// CpS without temporary buffs.
export function getBaseCps(state, mods = getModifiers(state)) {
  return BUILDINGS.reduce((sum, b) => sum + state.buildings[b.id] * buildingUnitCps(state, b.id, mods), 0);
}

// CpS including an active Frenzy.
export function getCps(state, mods = getModifiers(state)) {
  const frenzy = getBuff(state, "frenzy");
  return getBaseCps(state, mods) * (frenzy ? BUFFS.frenzy.multiplier : 1);
}

export function getClickPower(state, mods = getModifiers(state)) {
  const base = 2 ** mods.cursorDoublings + fingersBonus(state, mods) + (mods.mousePercent / 100) * getCps(state, mods);
  return base * (getBuff(state, "clickFrenzy") ? BUFFS.clickFrenzy.multiplier : 1);
}

export function buildingPrice(buildingId, owned) {
  return Math.ceil(BUILDING_MAP[buildingId].baseCost * PRICE_GROWTH ** owned);
}

export function bulkPrice(buildingId, owned, amount) {
  let total = 0;
  for (let i = 0; i < amount; i++) total += buildingPrice(buildingId, owned + i);
  return total;
}

// Refund for selling up to `amount` buildings (never more than are owned).
export function sellValue(buildingId, owned, amount) {
  let total = 0;
  const count = Math.min(amount, owned);
  for (let i = 1; i <= count; i++) total += Math.floor(buildingPrice(buildingId, owned - i) * SELL_REFUND);
  return total;
}

export function isUpgradeAvailable(state, upgradeId) {
  const u = UPGRADE_MAP[upgradeId];
  return Boolean(u) && !state.upgrades.includes(upgradeId) && u.unlocked(state);
}

export function getAvailableUpgrades(state) {
  return Object.values(UPGRADE_MAP)
    .filter((u) => isUpgradeAvailable(state, u.id))
    .sort((a, b) => a.cost - b.cost);
}

export function goldenDelay(state, rand) {
  const mods = getModifiers(state);
  const delay = GOLDEN_MIN_DELAY + rand * (GOLDEN_MAX_DELAY - GOLDEN_MIN_DELAY);
  return delay / 2 ** mods.goldenFreq;
}

function goldenLifetime(state) {
  return GOLDEN_LIFETIME * 2 ** getModifiers(state).goldenFreq;
}

function buffDuration(state, type) {
  return BUFFS[type].duration * 2 ** getModifiers(state).buffLength;
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function pushToast(state, toast) {
  const toasts = [...state.toasts, { ...toast, id: state.nextToastId }].slice(-MAX_TOASTS);
  return { ...state, toasts, nextToastId: state.nextToastId + 1 };
}

function earn(state, amount) {
  return { ...state, cookies: state.cookies + amount, totalBaked: state.totalBaked + amount };
}

function addBuff(state, type) {
  const duration = buffDuration(state, type);
  const others = state.buffs.filter((buff) => buff.type !== type);
  return { ...state, buffs: [...others, { type, timeLeft: duration, duration }] };
}

function tick(state, dt, rand) {
  const baseCps = getBaseCps(state);
  const frenzy = getBuff(state, "frenzy");
  // Only the part of this tick during which Frenzy was active gets the boost.
  const frenzyTime = frenzy ? Math.min(dt, frenzy.timeLeft) : 0;
  const produced = baseCps * (frenzyTime * BUFFS.frenzy.multiplier + (dt - frenzyTime));

  // `earn` returns a fresh object, so filling in the remaining fields is safe.
  const next = earn(state, produced);
  next.timePlayed = state.timePlayed + dt;
  next.buffs = state.buffs
    .map((buff) => ({ ...buff, timeLeft: buff.timeLeft - dt }))
    .filter((buff) => buff.timeLeft > 0);

  if (state.golden) {
    const timeLeft = state.golden.timeLeft - dt;
    if (timeLeft > 0) {
      next.golden = { ...state.golden, timeLeft };
    } else {
      next.golden = null;
      next.goldenTimer = goldenDelay(state, rand[0]);
    }
  } else {
    const timer = state.goldenTimer - dt;
    if (timer > 0) {
      next.goldenTimer = timer;
    } else {
      const lifetime = goldenLifetime(state);
      next.golden = { x: rand[1], y: rand[2], timeLeft: lifetime, duration: lifetime };
      next.goldenTimer = 0;
    }
  }
  return next;
}

function clickGolden(state, effectRand, delayRand) {
  if (!state.golden) return state;
  let next = {
    ...state,
    golden: null,
    goldenClicks: state.goldenClicks + 1,
    goldenTimer: goldenDelay(state, delayRand),
  };

  if (effectRand < 0.1) {
    next = addBuff(next, "clickFrenzy");
    return pushToast(next, { kind: "golden", title: "Click frenzy!", text: `Clicking power x777 for ${Math.round(buffDuration(state, "clickFrenzy"))} seconds.` });
  }
  if (effectRand < 0.55) {
    next = addBuff(next, "frenzy");
    return pushToast(next, { kind: "golden", title: "Frenzy!", text: `Cookie production x7 for ${Math.round(buffDuration(state, "frenzy"))} seconds.` });
  }
  const gain = Math.min(state.cookies * 0.15, getCps(state) * 900) + 13;
  next = earn(next, gain);
  return pushToast(next, { kind: "golden", title: "Lucky!", text: `+${formatNumber(gain)} cookies.` });
}

function buyBuilding(state, id, amount) {
  if (!BUILDING_MAP[id] || !(amount >= 1)) return state;
  const owned = state.buildings[id];
  const price = bulkPrice(id, owned, amount);
  if (state.cookies < price) return state;
  return {
    ...state,
    cookies: state.cookies - price,
    buildings: { ...state.buildings, [id]: owned + amount },
  };
}

function sellBuilding(state, id, amount) {
  if (!BUILDING_MAP[id] || !(amount >= 1)) return state;
  const owned = state.buildings[id];
  const count = Math.min(amount, owned);
  if (count <= 0) return state;
  return {
    ...state,
    cookies: state.cookies + sellValue(id, owned, count),
    buildings: { ...state.buildings, [id]: owned - count },
  };
}

function buyUpgrade(state, id) {
  if (!isUpgradeAvailable(state, id)) return state;
  const { cost } = UPGRADE_MAP[id];
  if (state.cookies < cost) return state;
  return { ...state, cookies: state.cookies - cost, upgrades: [...state.upgrades, id] };
}

function checkAchievements(state) {
  const ctx = { cps: getCps(state), buildingCount: totalBuildings(state) };
  const earned = ACHIEVEMENTS.filter((a) => !state.achievements.includes(a.id) && a.check(state, ctx));
  if (earned.length === 0) return state;
  const next = { ...state, achievements: [...state.achievements, ...earned.map((a) => a.id)] };
  // Several achievements can unlock at once (e.g. after importing a save): one toast for all of them.
  const names = earned.map((a) => a.name);
  const text = names.length > 4 ? `${names.slice(0, 3).join(", ")} and ${names.length - 3} more` : names.join(", ");
  const title = earned.length === 1 ? "Achievement unlocked" : `${earned.length} achievements unlocked`;
  return pushToast(next, { kind: "achievement", title, text });
}

function applyAction(state, action) {
  switch (action.type) {
    case "CLICK": {
      const power = getClickPower(state);
      const next = earn(state, power);
      return { ...next, handmade: state.handmade + power, clicks: state.clicks + 1 };
    }
    case "TICK":
      return action.dt > 0 ? tick(state, action.dt, action.rand) : state;
    case "CLICK_GOLDEN":
      return clickGolden(state, action.effectRand, action.delayRand);
    case "BUY_BUILDING":
      return buyBuilding(state, action.id, action.amount);
    case "SELL_BUILDING":
      return sellBuilding(state, action.id, action.amount);
    case "BUY_UPGRADE":
      return buyUpgrade(state, action.id);
    case "TOAST":
      return pushToast(state, action.toast);
    case "DISMISS_TOAST":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
    case "LOAD":
      return { ...action.state, toasts: state.toasts, nextToastId: state.nextToastId };
    case "RESET":
      return { ...createInitialState(), toasts: state.toasts, nextToastId: state.nextToastId };
    default:
      return state;
  }
}

export function gameReducer(state, action) {
  const next = applyAction(state, action);
  return next === state ? state : checkAchievements(next);
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

const isPositive = (value) => Number.isFinite(value) && value > 0;
const toCount = (value) => (isPositive(value) ? Math.floor(value) : 0);
const toAmount = (value, fallback = 0) => (Number.isFinite(value) && value >= 0 ? value : fallback);
const toFraction = (value) => (Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.5);

function uniqueKnown(list, map) {
  return Array.isArray(list) ? [...new Set(list.filter((id) => typeof id === "string" && Object.hasOwn(map, id)))] : [];
}

// Turns untrusted data (localStorage / an imported save) into a valid state,
// or null if it doesn't look like a save at all.
export function sanitizeState(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const base = createInitialState();
  const rawBuildings = raw.buildings && typeof raw.buildings === "object" ? raw.buildings : {};

  const golden =
    raw.golden && typeof raw.golden === "object" && isPositive(raw.golden.timeLeft) && isPositive(raw.golden.duration)
      ? {
          x: toFraction(raw.golden.x),
          y: toFraction(raw.golden.y),
          duration: toAmount(raw.golden.duration),
          timeLeft: Math.min(toAmount(raw.golden.timeLeft), toAmount(raw.golden.duration)),
        }
      : null;

  const buffs = Array.isArray(raw.buffs)
    ? raw.buffs
        .filter((buff) => buff && Object.hasOwn(BUFFS, buff.type) && isPositive(buff.timeLeft) && isPositive(buff.duration))
        .map((buff) => ({ type: buff.type, duration: toAmount(buff.duration), timeLeft: Math.min(toAmount(buff.timeLeft), toAmount(buff.duration)) }))
        .filter((buff, i, all) => all.findIndex((other) => other.type === buff.type) === i)
    : [];

  const upgrades = uniqueKnown(raw.upgrades, UPGRADE_MAP);
  const cookies = toAmount(raw.cookies);
  const handmade = toAmount(raw.handmade);

  return {
    ...base,
    cookies,
    totalBaked: Math.max(toAmount(raw.totalBaked), cookies, handmade),
    handmade,
    clicks: toCount(raw.clicks),
    goldenClicks: toCount(raw.goldenClicks),
    timePlayed: toAmount(raw.timePlayed),
    buildings: Object.fromEntries(BUILDINGS.map((b) => [b.id, toCount(rawBuildings[b.id])])),
    upgrades,
    achievements: uniqueKnown(raw.achievements, ACHIEVEMENT_MAP),
    buffs,
    golden,
    goldenTimer: golden ? 0 : toAmount(raw.goldenTimer, goldenDelay({ upgrades }, 0.5)),
  };
}

export function serializeState(state) {
  const saved = { ...state };
  delete saved.toasts;
  delete saved.nextToastId;
  return JSON.stringify(saved);
}

// Save strings for export/import are base64-encoded JSON.
export function encodeSave(state) {
  const bytes = new TextEncoder().encode(serializeState(state));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function decodeSave(text) {
  try {
    const binary = atob(text.trim());
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return sanitizeState(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

export function loadGame() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    return raw ? sanitizeState(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveGame(state) {
  try {
    window.localStorage.setItem(SAVE_KEY, serializeState(state));
    return true;
  } catch {
    return false;
  }
}

export function clearSave() {
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    // Storage unavailable: nothing to clear.
  }
}
