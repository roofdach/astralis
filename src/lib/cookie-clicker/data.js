// Static game content: buildings, upgrades and achievements.
// Numbers follow the original Cookie Clicker where it makes sense.

export const BUILDINGS = [
  { id: "cursor", name: "Cursor", icon: "👆", baseCost: 15, baseCps: 0.1, desc: "Autoclicks once every 10 seconds." },
  { id: "grandma", name: "Grandma", icon: "👵", baseCost: 100, baseCps: 1, desc: "A nice grandma to bake more cookies." },
  { id: "farm", name: "Farm", icon: "🌾", baseCost: 1100, baseCps: 8, desc: "Grows cookie plants from cookie seeds." },
  { id: "mine", name: "Mine", icon: "⛏️", baseCost: 12000, baseCps: 47, desc: "Mines out cookie dough and chocolate chips." },
  { id: "factory", name: "Factory", icon: "🏭", baseCost: 130000, baseCps: 260, desc: "Produces large quantities of cookies." },
  { id: "bank", name: "Bank", icon: "🏦", baseCost: 1.4e6, baseCps: 1400, desc: "Generates cookies from interest." },
  { id: "temple", name: "Temple", icon: "🛕", baseCost: 2e7, baseCps: 7800, desc: "Full of precious, ancient chocolate." },
  { id: "wizard", name: "Wizard tower", icon: "🧙", baseCost: 3.3e8, baseCps: 44000, desc: "Summons cookies with magic spells." },
  { id: "shipment", name: "Shipment", icon: "🚀", baseCost: 5.1e9, baseCps: 260000, desc: "Brings in fresh cookies from the cookie planet." },
  { id: "alchemy", name: "Alchemy lab", icon: "⚗️", baseCost: 7.5e10, baseCps: 1.6e6, desc: "Turns gold into cookies!" },
  { id: "portal", name: "Portal", icon: "🌀", baseCost: 1e12, baseCps: 1e7, desc: "Opens a door to the Cookieverse." },
  { id: "timemachine", name: "Time machine", icon: "⏳", baseCost: 1.4e13, baseCps: 6.5e7, desc: "Brings cookies from the past, before they were even eaten." },
];

export const BUILDING_MAP = Object.fromEntries(BUILDINGS.map((b) => [b.id, b]));

// Every building except the cursor gets five "twice as efficient" upgrades,
// unlocked by owning 1 / 5 / 25 / 50 / 100 of it.
const TIER_REQUIREMENTS = [1, 5, 25, 50, 100];
const TIER_COST_MULTIPLIERS = [10, 50, 500, 50000, 5000000];

const BUILDING_UPGRADE_NAMES = {
  grandma: ["Forwards from grandma", "Steel-plated rolling pins", "Lubricated dentures", "Prune juice", "Double-thick glasses"],
  farm: ["Cheap hoes", "Fertilizer", "Cookie trees", "Genetically-modified cookies", "Gingerbread scarecrows"],
  mine: ["Sugar gas", "Megadrill", "Ultradrill", "Ultimadrill", "H-bomb mining"],
  factory: ["Sturdier conveyor belts", "Overclocked ovens", "Assembly robots", "Radium reactors", "Recombobulators"],
  bank: ["Taller tellers", "Scissor-resistant credit cards", "Acid-proof vaults", "Chocolate coins", "Exponential interest rates"],
  temple: ["Golden idols", "Sacred cookie jars", "Delicious blessing", "Sun festival", "Enlarged pantheon"],
  wizard: ["Pointier hats", "Beardlier beards", "Ancient grimoires", "Kitchen curses", "School of sorcery"],
  shipment: ["Vanilla nebulae", "Wormholes", "Frequent flyer", "Warp drive", "Chocolate monoliths"],
  alchemy: ["Antimony", "Essence of dough", "True chocolate", "Ambrosia", "Aqua crustulae"],
  portal: ["Ancient tablet", "Insane oatling workers", "Soul bond", "Sanity dance", "Brane transplant"],
  timemachine: ["Flux capacitors", "Time paradox resolver", "Quantum conundrum", "Causality enforcer", "Yestermorrow comparators"],
};

const owns = (state, buildingId, amount) => state.buildings[buildingId] >= amount;
const hasUpgrade = (state, upgradeId) => state.upgrades.includes(upgradeId);

// Upgrade kinds understood by the engine (see getModifiers in game.js):
//   building     - doubles the output of `building`
//   cursorDouble - doubles cursor output and click power
//   fingersAdd   - each cursor and each click gains `amount` per non-cursor building owned
//   fingersMult  - multiplies the fingersAdd bonus by `factor`
//   mouse        - clicks gain `percent`% of your CpS
//   flavor       - global CpS +`percent`%
//   goldenFreq   - golden cookies appear twice as often and stay twice as long
//   buffLength   - golden cookie effects last twice as long
const cursorUpgrades = [
  { id: "reinforced-index-finger", name: "Reinforced index finger", kind: "cursorDouble", cost: 100, desc: "The mouse and cursors are twice as efficient.", unlocked: (s) => owns(s, "cursor", 1) },
  { id: "carpal-tunnel-cream", name: "Carpal tunnel prevention cream", kind: "cursorDouble", cost: 500, desc: "The mouse and cursors are twice as efficient.", unlocked: (s) => owns(s, "cursor", 1) },
  { id: "ambidextrous", name: "Ambidextrous", kind: "cursorDouble", cost: 10000, desc: "The mouse and cursors are twice as efficient.", unlocked: (s) => owns(s, "cursor", 10) },
  { id: "thousand-fingers", name: "Thousand fingers", kind: "fingersAdd", amount: 0.1, cost: 100000, desc: "The mouse and cursors gain +0.1 cookies for each non-cursor building owned.", unlocked: (s) => owns(s, "cursor", 25) },
  { id: "million-fingers", name: "Million fingers", kind: "fingersMult", factor: 5, cost: 1e7, desc: "Multiplies the gain from Thousand fingers by 5.", unlocked: (s) => owns(s, "cursor", 50) && hasUpgrade(s, "thousand-fingers") },
  { id: "billion-fingers", name: "Billion fingers", kind: "fingersMult", factor: 10, cost: 1e8, desc: "Multiplies the gain from Thousand fingers by 10.", unlocked: (s) => owns(s, "cursor", 100) && hasUpgrade(s, "million-fingers") },
].map((u) => ({ ...u, icon: "👆" }));

const buildingUpgrades = BUILDINGS.filter((b) => b.id !== "cursor").flatMap((b) =>
  BUILDING_UPGRADE_NAMES[b.id].map((name, tier) => ({
    id: `${b.id}-${tier + 1}`,
    name,
    icon: b.icon,
    kind: "building",
    building: b.id,
    cost: b.baseCost * TIER_COST_MULTIPLIERS[tier],
    desc: `${b.name}s are twice as efficient.`,
    unlocked: (s) => owns(s, b.id, TIER_REQUIREMENTS[tier]),
  }))
);

const mouseUpgrades = [
  { id: "plastic-mouse", name: "Plastic mouse", cost: 50000, handmade: 1000 },
  { id: "iron-mouse", name: "Iron mouse", cost: 5e6, handmade: 1e5 },
  { id: "titanium-mouse", name: "Titanium mouse", cost: 5e8, handmade: 1e7 },
  { id: "adamantium-mouse", name: "Adamantium mouse", cost: 5e10, handmade: 1e9 },
].map(({ handmade, ...u }) => ({
  ...u,
  icon: "🖱️",
  kind: "mouse",
  percent: 1,
  desc: "Clicking gains +1% of your CpS.",
  unlocked: (s) => s.handmade >= handmade,
}));

const flavorUpgrades = [
  { id: "plain-cookies", name: "Plain cookies", cost: 1e6, percent: 1 },
  { id: "sugar-cookies", name: "Sugar cookies", cost: 5e6, percent: 1 },
  { id: "oatmeal-raisin-cookies", name: "Oatmeal raisin cookies", cost: 1e7, percent: 1 },
  { id: "peanut-butter-cookies", name: "Peanut butter cookies", cost: 5e7, percent: 2 },
  { id: "coconut-cookies", name: "Coconut cookies", cost: 1e8, percent: 2 },
  { id: "white-chocolate-cookies", name: "White chocolate cookies", cost: 5e8, percent: 2 },
  { id: "macadamia-nut-cookies", name: "Macadamia nut cookies", cost: 1e9, percent: 2 },
  { id: "double-chip-cookies", name: "Double-chip cookies", cost: 5e9, percent: 2 },
  { id: "white-chocolate-macadamia-cookies", name: "White chocolate macadamia nut cookies", cost: 1e10, percent: 2 },
  { id: "all-chocolate-cookies", name: "All-chocolate cookies", cost: 5e10, percent: 2 },
].map((u) => ({
  ...u,
  icon: "🍪",
  kind: "flavor",
  desc: `Cookie production multiplier +${u.percent}%.`,
  unlocked: (s) => s.totalBaked >= u.cost / 2,
}));

const goldenUpgrades = [
  { id: "lucky-day", name: "Lucky day", kind: "goldenFreq", cost: 777777777, goldenClicks: 7, desc: "Golden cookies appear twice as often and stay twice as long." },
  { id: "serendipity", name: "Serendipity", kind: "goldenFreq", cost: 77777777777, goldenClicks: 27, desc: "Golden cookies appear twice as often and stay twice as long." },
  { id: "get-lucky", name: "Get lucky", kind: "buffLength", cost: 77777777777777, goldenClicks: 77, desc: "Golden cookie effects last twice as long." },
].map(({ goldenClicks, ...u }) => ({
  ...u,
  icon: "✨",
  unlocked: (s) => s.goldenClicks >= goldenClicks,
}));

export const UPGRADES = [...cursorUpgrades, ...mouseUpgrades, ...buildingUpgrades, ...flavorUpgrades, ...goldenUpgrades];

export const UPGRADE_MAP = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));

// Achievements. `check(state, ctx)` receives ctx = { cps, buildingCount }.
const bakedAchievements = [
  [1, "Wake and bake"],
  [1e3, "Making some dough"],
  [1e5, "So baked right now"],
  [1e6, "Fledgling bakery"],
  [1e8, "Affluent bakery"],
  [1e9, "World-famous bakery"],
  [1e11, "Cosmic bakery"],
  [1e12, "Galactic bakery"],
  [1e14, "Universal bakery"],
  [1e15, "Timeless bakery"],
].map(([amount, name], i) => ({
  id: `baked-${i + 1}`,
  name,
  amount,
  desc: `Bake {amount} cookie${amount === 1 ? "" : "s"} in total.`,
  check: (s) => s.totalBaked >= amount,
}));

const cpsAchievements = [
  [1, "Casual baking"],
  [10, "Hardcore baking"],
  [100, "Steady tasty stream"],
  [1e3, "Cookie monster"],
  [1e4, "Mass producer"],
  [1e5, "Cookie vortex"],
  [1e6, "Cookie pulsar"],
  [1e7, "Cookie quasar"],
  [1e8, "Oh hey, you're still here"],
].map(([amount, name], i) => ({
  id: `cps-${i + 1}`,
  name,
  amount,
  desc: `Bake {amount} cookie${amount === 1 ? "" : "s"} per second.`,
  check: (s, ctx) => ctx.cps >= amount,
}));

const clickAchievements = [
  { id: "click-1", name: "Click", desc: "Click the big cookie once.", check: (s) => s.clicks >= 1 },
  { id: "click-2", name: "Double-click", desc: "Click the big cookie 100 times.", check: (s) => s.clicks >= 100 },
  { id: "click-3", name: "Mouse wheel", desc: "Click the big cookie 1,000 times.", check: (s) => s.clicks >= 1000 },
  ...[
    [1e3, "Clicktastic"],
    [1e5, "Clickathlon"],
    [1e7, "Clickolympics"],
    [1e9, "Clickorama"],
  ].map(([amount, name], i) => ({
    id: `handmade-${i + 1}`,
    name,
    amount,
    desc: "Make {amount} cookies from clicking.",
    check: (s) => s.handmade >= amount,
  })),
];

const buildingAchievements = BUILDINGS.flatMap((b) =>
  [
    [1, `First ${b.name.toLowerCase()}`],
    [50, `${b.name} enthusiast`],
    [100, `${b.name} tycoon`],
  ].map(([amount, name], i) => ({
    id: `${b.id}-owned-${i + 1}`,
    name,
    amount,
    desc: `Have {amount} ${amount === 1 ? b.name.toLowerCase() : `${b.name.toLowerCase()}s`}.`,
    check: (s) => s.buildings[b.id] >= amount,
  }))
);

const miscAchievements = [
  { id: "builder", name: "Builder", amount: 100, desc: "Own {amount} buildings.", check: (s, ctx) => ctx.buildingCount >= 100 },
  { id: "architect", name: "Architect", amount: 500, desc: "Own {amount} buildings.", check: (s, ctx) => ctx.buildingCount >= 500 },
  { id: "engineer", name: "Engineer", amount: 1000, desc: "Own {amount} buildings.", check: (s, ctx) => ctx.buildingCount >= 1000 },
  { id: "enhancer", name: "Enhancer", amount: 20, desc: "Purchase {amount} upgrades.", check: (s) => s.upgrades.length >= 20 },
  { id: "augmenter", name: "Augmenter", amount: 50, desc: "Purchase {amount} upgrades.", check: (s) => s.upgrades.length >= 50 },
  { id: "golden-1", name: "Golden cookie", desc: "Click a golden cookie.", check: (s) => s.goldenClicks >= 1 },
  { id: "golden-2", name: "Lucky cookie", amount: 7, desc: "Click {amount} golden cookies.", check: (s) => s.goldenClicks >= 7 },
  { id: "golden-3", name: "A stroke of luck", amount: 27, desc: "Click {amount} golden cookies.", check: (s) => s.goldenClicks >= 27 },
  { id: "golden-4", name: "Fortune", amount: 77, desc: "Click {amount} golden cookies.", check: (s) => s.goldenClicks >= 77 },
];

export const ACHIEVEMENTS = [
  ...bakedAchievements,
  ...cpsAchievements,
  ...clickAchievements,
  ...buildingAchievements,
  ...miscAchievements,
];

export const ACHIEVEMENT_MAP = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
