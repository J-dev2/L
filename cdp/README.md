# CDP test probes

Headless-browser smoke tests for the game, driven via the Chrome DevTools Protocol.
These are **dev tooling only** — they are not part of the game build (the bundler
only pulls scripts referenced in `play.html` / `index.html`).

## How to run

1. Start headless Chrome with a remote-debugging port and a temp profile:

   ```bash
   chrome --headless=new --disable-gpu --remote-debugging-port=9350 \
     --user-data-dir=/tmp/ledger-cdp --no-first-run --no-default-browser-check about:blank
   ```

2. Run a probe through the driver (it navigates to the game and evaluates the probe):

   ```bash
   node cdp/driver.js 9350 "file:///d:/code/L/play.html?sandbox=1&from=landing" cdp/<probe>.js
   ```

   Each probe prints JSON `{ pass, fail, summary, __consoleErrors }`.
   For the dev-tools probe, add `&dev=1` to the URL.

3. Kill Chrome and delete the temp profile when done (reuse ONE `--user-data-dir`;
   creating a fresh temp profile per run will fill the disk).

`driver.js` takes the probe path as an argument, so probes have no internal path coupling.

## Probes

| File | Area | Checks |
|------|------|--------|
| `startup-crash.js` | Startup/render diagnostics for sandbox, new-life, existing-slot, and old-save paths | variable |
| `seed-bloated-save.js` | Seeds slot 5 with oversized history arrays before running `startup-crash.js` | helper |
| `separation.js` | Entrepreneurship vs Business route + data separation | 20 |
| `features.js`   | Business models make revenue, wizard, graphs across tabs | 17 |
| `ipo.js`        | IPO / public company / grants / scale graph | 17 |
| `dashboard.js`  | Dashboard 2.0 tabs/panels, public gating, market signal | 32 |
| `life.js`       | Life rebuild route, card popups, sinks, yearly status perk, overflow smoke | 22 |
| `death.js`      | Death screen + continue-as-heir incl. no-child successor and open-hub death | 22 |
| `founderpay.js` | Founder salary + manual distribution + tax | 24 |
| `stock.js`      | Share counts, buyback de-list, splits, dividends | 30 |
| `entrepreneur-backlog.js` | Life/Entrepreneur backlog smoke: shared charts, Investments live trading/funding, candles, hiring, sell paths | 17 |
| `investments-stock-engine.js` | Investments 2.1 stock engine: condensed Stocks desk, live/annual mode switch, live P/L strip, annual-only positions, stop-loss controls, risk/news market brief, liquidity/available float, capped live volume, sort/filter controls, short/cover flow, route open, mobile padding, personal firm preservation | 45 |
| `trust.js`      | Family trust create/fund, net worth, succession carry, death haircut | 18 |
| `trust-holdings.js` | Trust Envelop titles Property + Entrepreneurship holdings, carries them without duplicate cash | 12 |
| `family-office.js` | Family Office popup/operator/per-company founder titling + selected-company succession | 23 |
| `entrepreneur-legal.js` | Entrepreneurship Legal tab + tax attorney rate/fee math | 11 |
| `business-age21.js` | Business opportunity age gates above 21 are capped at 21 in UI/actions | 8 |
| `wayback.js`    | Checkpoint create/restore + death-screen "Undo Death" | 11 |
| `devtools.js`   | Hidden dev-tools gate/unlock + panel tools (run with `&dev=1`) | 17 |
| `business-locations.js` | Business #10 locations/franchises/rival share | 25 |
| `business-income.js` | Old/drifted-catalog business still earns + company cash reserve sweep | 7 |
| `money-mobile.js` | Money hub mobile viewport/safe-area scroll contract | 10 |
| `platform-compat.js` | iOS/Android/desktop detection + emoji-to-symbol fallback | 8 |
| `no-patches.js` | Confirms retired `pages/patches` scripts are not runtime-loaded | 2 |
| `estate-trust.js` | Death settlement honors the Legal family trust (plan/protected/tax) | 4 |
| `trust-nav.js` | Trust/business actions re-render the current hub (no hub jump) | 2 |
| `networth-genetics.js` | Net worth consistent across hubs (fund counted, bridge once) + child IQ inheritance | 9 |
| `heir-age.js` | Continue-as-heir starts at the child's age (not 0) + UI size buttons drive CSS vars | 6 |
| `property.js` | Real-estate: mortgage/cash buy, appreciation, paydown, renovate, sell, equity, migration, legacy rental fold-in, tenants, residence, flipping | 80 |
| `cars.js` | Vehicles: cash/finance buy, garage equity, repairs, loans, daily driver, marine/aircraft, migration | 23 |
| `business-tabs.js` | Mini-tabs (Overview/Trends/Capital/Network), New Business btn, entrepreneur-bridge hidden | 16 |
| `business-modals.js` | Popups: per-company + global (family/new) + rotating acquisition market (≥3) | 23 |
| `pacing.js`, `fundgrad.js` | Older startup-founder pacing/grant probes | — |

Keep these green after entrepreneurship/stock/finance/legal changes. When the intended
contract changes, update the probe (don't delete checks).
