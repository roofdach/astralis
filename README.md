# Astralis Cookie Clicker

A Cookie Clicker clone built with Next.js, React and Tailwind CSS.

## Features

- **The big cookie**: click it (or focus it and press Enter/Space) to bake cookies.
- **12 buildings**, from Cursor to Time machine. Prices grow by 15% per building owned, and you can buy or sell in batches of 1, 10 or 100. Selling refunds 25% of the price.
- **78 upgrades**: building multipliers, cursor and click boosts (Thousand fingers and its follow-ups), mouse upgrades that add a share of your CpS to each click, flavored cookies, and golden cookie upgrades.
- **Golden cookies** show up at random. Click one before it fades for:
  - _Lucky_: +15% of your bank, capped at 15 minutes of production.
  - _Frenzy_: x7 production for 77 seconds.
  - _Click frenzy_: x777 click power for 13 seconds.
- **71 achievements**. Each one adds +1% to cookie production.
- **Saving**: autosaves to `localStorage` every 30 seconds and whenever you leave the page. You can also export a save code, import one, or wipe your save.
- Light and dark themes, and a layout that works on phones.

## Development

```bash
npm install
npm run dev     # http://localhost:3000
npm run lint
npm run build
```

## Code layout

| Path | Contents |
| --- | --- |
| `src/lib/cookie-clicker/data.js` | Buildings, upgrades and achievements |
| `src/lib/cookie-clicker/game.js` | Pure game engine: reducer, CpS/price math, save sanitizing and serialization |
| `src/lib/cookie-clicker/format.js` | Number and duration formatting |
| `src/components/clicker/` | React UI: big cookie, store, stats/achievements/options, golden cookie, toasts |
| `src/app/` | Next.js root layout and page |

The engine is deterministic. Anything random, like golden cookie timing, position and effect, is passed in on the action, so the reducer stays pure.
