import { test } from "node:test";
import assert from "node:assert/strict";
import { ACHIEVEMENTS, BUILDINGS, UPGRADES } from "../src/lib/cookie-clicker/data.js";
import { describe, formatDuration, formatNumber } from "../src/lib/cookie-clicker/format.js";
import {
  GOLDEN_MAX_DELAY,
  GOLDEN_MIN_DELAY,
  buildingPrice,
  buildingUnitCps,
  bulkPrice,
  createInitialState,
  decodeSave,
  encodeSave,
  gameReducer,
  getAvailableUpgrades,
  getBaseCps,
  getBuff,
  getClickPower,
  getCps,
  globalMultiplier,
  goldenDelay,
  isUpgradeAvailable,
  sanitizeState,
  sellValue,
  serializeState,
} from "../src/lib/cookie-clicker/game.js";

const run = (state, ...actions) => actions.reduce(gameReducer, state);
const close = (actual, expected, message) =>
  assert.ok(Math.abs(actual - expected) < 1e-9 * Math.max(1, Math.abs(expected)), message ?? `${actual} != ${expected}`);
const withBuildings = (counts, extra = {}) => {
  const base = createInitialState();
  return { ...base, ...extra, buildings: { ...base.buildings, ...counts } };
};
const CLICK = { type: "CLICK" };
const tick = (dt, rand = [0.5, 0.5, 0.5]) => ({ type: "TICK", dt, rand });
const withoutToasts = (state) => {
  const copy = { ...state };
  delete copy.toasts;
  delete copy.nextToastId;
  return copy;
};

test("content ids are unique and every entry is complete", () => {
  for (const list of [BUILDINGS, UPGRADES, ACHIEVEMENTS]) {
    assert.equal(new Set(list.map((x) => x.id)).size, list.length);
  }
  for (const u of UPGRADES) {
    assert.ok(u.cost > 0 && u.name && u.desc && u.icon && typeof u.unlocked === "function", u.id);
  }
  for (const a of ACHIEVEMENTS) {
    assert.ok(a.name && typeof a.check === "function", a.id);
    assert.ok(!describe(a).includes("{amount}"), a.id);
  }
});

test("clicking the big cookie bakes one cookie per click", () => {
  const s = run(createInitialState(), CLICK, CLICK, CLICK);
  assert.equal(s.cookies, 3);
  assert.equal(s.totalBaked, 3);
  assert.equal(s.handmade, 3);
  assert.equal(s.clicks, 3);
  assert.ok(s.achievements.includes("click-1") && s.achievements.includes("baked-1"));
});

test("building prices grow by 15% and bulk prices add up", () => {
  assert.equal(buildingPrice("cursor", 0), 15);
  assert.equal(buildingPrice("cursor", 1), 18); // ceil(17.25)
  assert.equal(bulkPrice("cursor", 0, 2), 33);
  let expected = 0;
  for (let i = 0; i < 10; i++) expected += buildingPrice("cursor", 5 + i);
  assert.equal(bulkPrice("cursor", 5, 10), expected);
  assert.equal(sellValue("cursor", 1, 1), 3);
  assert.equal(sellValue("cursor", 2, 100), 4 + 3, "sells only what is owned");
  assert.equal(sellValue("cursor", 0, 1), 0);
});

test("buying and selling buildings", () => {
  let s = { ...createInitialState(), cookies: 20 };
  s = gameReducer(s, { type: "BUY_BUILDING", id: "cursor", amount: 1 });
  assert.equal(s.buildings.cursor, 1);
  assert.equal(s.cookies, 5);
  assert.equal(gameReducer(s, { type: "BUY_BUILDING", id: "cursor", amount: 1 }), s, "unaffordable is a no-op");
  assert.equal(gameReducer(s, { type: "BUY_BUILDING", id: "nope", amount: 1 }), s);
  assert.equal(gameReducer(s, { type: "BUY_BUILDING", id: "cursor", amount: 0 }), s);
  s = gameReducer(s, { type: "SELL_BUILDING", id: "cursor", amount: 10 });
  assert.equal(s.buildings.cursor, 0);
  assert.equal(s.cookies, 8);
  assert.equal(gameReducer(s, { type: "SELL_BUILDING", id: "cursor", amount: 1 }), s);
});

test("buildings produce cookies over time", () => {
  let s = withBuildings({ cursor: 10, grandma: 2 });
  close(getCps(s), 3);
  s = gameReducer(s, tick(10));
  close(s.cookies, 30);
  close(s.timePlayed, 10);
  assert.equal(gameReducer(s, tick(0)), s);
  assert.equal(gameReducer(s, tick(-1)), s);
});

test("upgrades apply their effects", () => {
  let s = withBuildings({ cursor: 100, grandma: 10, farm: 5 }, { cookies: 1e12 });
  s = gameReducer(s, { type: "BUY_UPGRADE", id: "grandma-1" });
  assert.ok(s.upgrades.includes("grandma-1"));
  close(buildingUnitCps(s, "grandma") / globalMultiplier(s), 2);
  assert.equal(gameReducer(s, { type: "BUY_UPGRADE", id: "grandma-1" }), s, "can't buy twice");
  assert.equal(gameReducer(s, { type: "BUY_UPGRADE", id: "grandma-3" }), s, "needs 25 grandmas");

  assert.ok(!isUpgradeAvailable(s, "million-fingers"), "needs Thousand fingers first");
  s = run(
    s,
    { type: "BUY_UPGRADE", id: "reinforced-index-finger" },
    { type: "BUY_UPGRADE", id: "carpal-tunnel-cream" },
    { type: "BUY_UPGRADE", id: "thousand-fingers" }
  );
  assert.ok(isUpgradeAvailable(s, "million-fingers"));
  // Cursor: 0.1 * 2 * 2 + 0.1 per non-cursor building (15) = 1.9
  close(buildingUnitCps(s, "cursor") / globalMultiplier(s), 1.9);
  // Click: 1 * 2 * 2 + 1.5 = 5.5
  close(getClickPower(s), 5.5);
  s = gameReducer(s, { type: "BUY_UPGRADE", id: "million-fingers" });
  close(getClickPower(s), 4 + 7.5);

  s = gameReducer({ ...s, handmade: 1000 }, { type: "BUY_UPGRADE", id: "plastic-mouse" });
  close(getClickPower(s), 11.5 + 0.01 * getCps(s));

  s = gameReducer({ ...s, totalBaked: 1e6 }, tick(0.001));
  const withFlavor = { ...s, upgrades: [...s.upgrades, "plain-cookies"] };
  close(getCps(withFlavor) / getCps(s), 1.01);
});

test("available upgrades are sorted by cost and exclude owned ones", () => {
  let s = withBuildings({ cursor: 1 }, { cookies: 1e6 });
  assert.deepEqual(getAvailableUpgrades(s).map((u) => u.id), ["reinforced-index-finger", "carpal-tunnel-cream"]);
  s = gameReducer(s, { type: "BUY_UPGRADE", id: "reinforced-index-finger" });
  assert.deepEqual(getAvailableUpgrades(s).map((u) => u.id), ["carpal-tunnel-cream"]);
});

test("golden cookies spawn, expire and grant effects", () => {
  let s = createInitialState();
  assert.ok(s.goldenTimer >= GOLDEN_MIN_DELAY && s.goldenTimer <= GOLDEN_MAX_DELAY);
  s = gameReducer(s, tick(s.goldenTimer + 1, [0.5, 0.25, 0.75]));
  assert.deepEqual(s.golden, { x: 0.25, y: 0.75, timeLeft: 13, duration: 13 });
  s = gameReducer(s, tick(5));
  assert.equal(s.golden.timeLeft, 8);
  const expired = gameReducer(s, tick(8, [0, 0, 0]));
  assert.equal(expired.golden, null);
  assert.equal(expired.goldenTimer, GOLDEN_MIN_DELAY);

  // Settle achievements first so the only ones earned below come from the golden cookie.
  const rich = gameReducer({ ...s, cookies: 1000, buildings: { ...s.buildings, grandma: 1 } }, tick(1e-6));

  const lucky = gameReducer(rich, { type: "CLICK_GOLDEN", effectRand: 0.9, delayRand: 1 });
  assert.equal(lucky.golden, null);
  assert.equal(lucky.goldenClicks, 1);
  assert.equal(lucky.goldenTimer, GOLDEN_MAX_DELAY);
  close(lucky.cookies, rich.cookies + Math.min(rich.cookies * 0.15, getCps(rich) * 900) + 13);
  assert.ok(lucky.toasts.some((t) => t.title === "Lucky!"));
  assert.ok(lucky.achievements.includes("golden-1"));
  assert.equal(gameReducer(lucky, { type: "CLICK_GOLDEN", effectRand: 0.9, delayRand: 1 }), lucky, "nothing to click");

  let frenzy = gameReducer(rich, { type: "CLICK_GOLDEN", effectRand: 0.3, delayRand: 0 });
  assert.equal(getBuff(frenzy, "frenzy").timeLeft, 77);
  const baseCps = getBaseCps(frenzy);
  close(getCps(frenzy), 7 * baseCps);
  // Only the part of a tick during which Frenzy is active is boosted.
  frenzy = { ...frenzy, buffs: [{ type: "frenzy", timeLeft: 2, duration: 77 }], goldenTimer: 1e9 };
  const before = frenzy.cookies;
  frenzy = gameReducer(frenzy, tick(10));
  close(frenzy.cookies - before, baseCps * (2 * 7 + 8));
  assert.equal(frenzy.buffs.length, 0);

  let clickFrenzy = gameReducer(rich, { type: "CLICK_GOLDEN", effectRand: 0.05, delayRand: 0 });
  assert.equal(getClickPower(clickFrenzy), 777);
  // Getting the same buff again refreshes it instead of stacking.
  clickFrenzy = {
    ...clickFrenzy,
    golden: { x: 0, y: 0, timeLeft: 5, duration: 13 },
    buffs: [{ type: "clickFrenzy", timeLeft: 1, duration: 13 }],
  };
  clickFrenzy = gameReducer(clickFrenzy, { type: "CLICK_GOLDEN", effectRand: 0.05, delayRand: 0 });
  assert.equal(clickFrenzy.buffs.length, 1);
  assert.equal(clickFrenzy.buffs[0].timeLeft, 13);
});

test("golden cookie upgrades change frequency and durations", () => {
  const s = { ...createInitialState(), upgrades: ["lucky-day", "serendipity", "get-lucky"] };
  assert.equal(goldenDelay(s, 0), GOLDEN_MIN_DELAY / 4);
  const spawned = gameReducer({ ...s, goldenTimer: 0.01 }, tick(1, [0, 0, 0]));
  assert.equal(spawned.golden.duration, 52);
  const frenzy = gameReducer(spawned, { type: "CLICK_GOLDEN", effectRand: 0.3, delayRand: 0 });
  assert.equal(getBuff(frenzy, "frenzy").duration, 154);
});

test("achievements boost production by 1% each", () => {
  const s = gameReducer(withBuildings({ grandma: 1 }), tick(0.1));
  assert.ok(s.achievements.includes("cps-1") && s.achievements.includes("grandma-owned-1"));
  close(globalMultiplier(s), 1 + 0.01 * s.achievements.length);
});

test("achievements unlocked together share one toast", () => {
  const one = gameReducer(createInitialState(), CLICK);
  assert.deepEqual(one.toasts.map((t) => [t.title, t.text]), [["2 achievements unlocked", "Wake and bake, Click"]]);
  assert.equal(gameReducer(one, CLICK).toasts.length, 1, "no new achievement, no new toast");

  const many = gameReducer(createInitialState(), { type: "LOAD", state: sanitizeState({ totalBaked: 1e15 }) });
  assert.deepEqual(many.toasts.map((t) => [t.title, t.text]), [
    ["10 achievements unlocked", "Wake and bake, Making some dough, So baked right now and 7 more"],
  ]);

  const single = gameReducer({ ...createInitialState(), achievements: ["baked-1"] }, CLICK);
  assert.deepEqual(single.toasts.map((t) => [t.title, t.text]), [["Achievement unlocked", "Click"]]);
});

test("toasts are capped and can be dismissed", () => {
  let s = createInitialState();
  for (let i = 0; i < 10; i++) s = gameReducer(s, { type: "TOAST", toast: { kind: "info", title: `t${i}` } });
  assert.equal(s.toasts.length, 4);
  assert.equal(s.toasts.at(-1).title, "t9");
  const { id } = s.toasts[0];
  s = gameReducer(s, { type: "DISMISS_TOAST", id });
  assert.equal(s.toasts.length, 3);
  assert.ok(!s.toasts.some((t) => t.id === id));
});

test("saves round-trip through JSON and export codes", () => {
  const s = gameReducer(
    withBuildings(
      { farm: 3 },
      {
        cookies: 123.5,
        totalBaked: 500,
        handmade: 10,
        clicks: 10,
        upgrades: ["farm-1"],
        buffs: [{ type: "frenzy", timeLeft: 5, duration: 77 }],
        golden: { x: 0.1, y: 0.2, timeLeft: 3, duration: 13 },
        goldenTimer: 0,
      }
    ),
    tick(0.001)
  );
  const json = serializeState(s);
  assert.ok(!json.includes("toasts") && !json.includes("nextToastId"));
  const loaded = sanitizeState(JSON.parse(json));
  assert.deepEqual(withoutToasts(loaded), withoutToasts(s));
  assert.deepEqual(decodeSave(encodeSave(s)), loaded);

  const back = gameReducer(createInitialState(), { type: "LOAD", state: loaded });
  assert.equal(back.buildings.farm, 3);
  const reset = gameReducer(back, { type: "RESET" });
  assert.equal(reset.cookies, 0);
  assert.equal(reset.buildings.farm, 0);
});

test("invalid save codes are rejected", () => {
  for (const code of ["", "not base64!!", btoa("[1,2]"), btoa("null"), btoa("{oops")]) {
    assert.equal(decodeSave(code), null, code);
  }
});

test("untrusted save data is sanitized", () => {
  const s = sanitizeState({
    cookies: -5,
    totalBaked: "x",
    clicks: 2.7,
    buildings: { cursor: "3", grandma: 4.9, bogus: 9, farm: Infinity },
    upgrades: ["farm-1", "farm-1", "nope", 7],
    achievements: ["click-1", "zzz"],
    buffs: [
      { type: "evil", timeLeft: 5, duration: 5 },
      { type: "frenzy", timeLeft: "5", duration: 5 },
      { type: "frenzy", timeLeft: 100, duration: 50 },
      { type: "frenzy", timeLeft: 1, duration: 50 },
    ],
    golden: { x: 5, y: -1, timeLeft: 3, duration: 13 },
    goldenTimer: NaN,
  });
  assert.equal(s.cookies, 0);
  assert.equal(s.totalBaked, 0);
  assert.equal(s.clicks, 2);
  assert.deepEqual(s.buildings, { ...createInitialState().buildings, grandma: 4 });
  assert.deepEqual(s.upgrades, ["farm-1"]);
  assert.deepEqual(s.achievements, ["click-1"]);
  assert.deepEqual(s.buffs, [{ type: "frenzy", duration: 50, timeLeft: 50 }]);
  assert.deepEqual(s.golden, { x: 1, y: 0, duration: 13, timeLeft: 3 });
  assert.equal(s.goldenTimer, 0);
  assert.equal(sanitizeState({ goldenTimer: NaN }).goldenTimer, createInitialState().goldenTimer);
  assert.equal(sanitizeState(null), null);
  assert.equal(sanitizeState([]), null);
});

test("formatNumber", () => {
  assert.equal(formatNumber(0), "0");
  assert.equal(formatNumber(12.9), "12");
  assert.equal(formatNumber(999999.99), "999,999");
  assert.equal(formatNumber(1e6), "1.000 million");
  assert.equal(formatNumber(1234567), "1.234 million");
  assert.equal(formatNumber(999999999.9), "999.999 million");
  assert.equal(formatNumber(1e9), "1.000 billion");
  assert.equal(formatNumber(1e15), "1.000 quadrillion");
  assert.equal(formatNumber(7e19), "70.000 quintillion");
  assert.equal(formatNumber(1e36), "1.000e36");
  assert.equal(formatNumber(0.1, 1), "0.1");
  assert.equal(formatNumber(1.1 * 3, 1), "3.3");
  assert.equal(formatNumber(12.56, 1), "12.5");
  assert.equal(formatNumber(3, 1), "3");
  assert.equal(formatNumber(1500.7, 1), "1,500");
  assert.equal(formatNumber(NaN), "0");
  for (let exponent = 6; exponent < 36; exponent++) {
    for (const mantissa of [1, 1.5, 9.999999]) {
      assert.match(formatNumber(mantissa * 10 ** exponent), /^\d{1,3}\.\d{3} [a-z]+$/);
    }
  }
});

test("formatDuration", () => {
  assert.equal(formatDuration(0), "0s");
  assert.equal(formatDuration(120), "2m");
  assert.equal(formatDuration(3661), "1h 1m 1s");
  assert.equal(formatDuration(90061), "1d 1h 1m 1s");
});

test("a long simulated game stays consistent", () => {
  let seed = 1;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let s = createInitialState();
  for (let second = 0; second < 20000; second++) {
    s = gameReducer(s, tick(1, [random(), random(), random()]));
    for (let i = 0; i < 5; i++) s = gameReducer(s, CLICK);
    if (s.golden) s = gameReducer(s, { type: "CLICK_GOLDEN", effectRand: random(), delayRand: random() });
    for (const u of getAvailableUpgrades(s)) s = gameReducer(s, { type: "BUY_UPGRADE", id: u.id });
    for (const b of [...BUILDINGS].reverse()) s = gameReducer(s, { type: "BUY_BUILDING", id: b.id, amount: 1 });
    assert.ok(Number.isFinite(s.cookies) && s.cookies >= 0);
  }
  assert.ok(s.totalBaked >= s.cookies);
  assert.ok(s.goldenClicks > 0);
  assert.ok(s.upgrades.length > 20);
  assert.ok(getCps(s) > 1e6);
});
