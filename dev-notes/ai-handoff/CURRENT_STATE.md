# Ledger Current State

This summarizes the reliable current project state for AI agents.

## Repo State

Ledger is currently organized as a modular v18.35 static browser game.

Main source entrypoints:

- `index.html`
- `play.html`

Main source folders:

- `pages/`
- `state/`
- `styles/`
- `themes/`
- `build/`

Generated output:

- `dist/`

## Reliable Recent Notes

Most useful current notes:

- `dev-notes/ENTREPRENEURSHIP_REBUILD.md`
- `dev-notes/CREDIT_REDESIGN_PLAN.md`
- `dev-notes/GAME_STUDIO_SKILLS.md`
- `AI_DEV_README.md`
- `dev-notes/ai-handoff/`

## Session Summary Status

`dev-notes/SESSION_SUMMARY.md` is the running log; latest checkpoint is on top.
Checkpoints 2–14 (2026-06-20) are current and reflect shipped source. The old
Checkpoint 1 (bottom) is historical — e.g. it says scroll-nav Part E was not done,
but that work is implemented. Trust the newest checkpoint and verify against source.

2026-06-29 update: the latest reliable Family Office checkpoint is **Checkpoint 56** in
`dev-notes/SESSION_SUMMARY.md`. Family Office is complete for the current request: holdings popup,
per-company founder titling, top-of-Trust operator placement, salary/fee negotiation, $1B operator
compensation cap, and succession carry are verified by `cdp/family-office.js` 23/23 plus trust regressions.

2026-06-29 update: **Checkpoint 57** completed the mobile Money height and emoji/platform compatibility follow-ups.
Money now uses dynamic viewport sizing plus safe-area-aware internal scrolling, and `platform-compat.js` provides
iOS/Android/desktop detection with symbol fallback for unreliable emoji rendering. Verified by `cdp/money-mobile.js`
10/10, `cdp/platform-compat.js` 8/8, and `cdp/flicker.js` 18/18 after rebuild.

2026-06-29 update: **Checkpoint 58** paid down the Life rebuild verification debt. `pages/systems/life-command.js`,
`pages/systems/life-wellbeing.js`, `pages/systems/life-rebuild.js`, and `cdp/life.js` passed syntax checks; the
bundle rebuilt; `cdp/life.js` passed 19/19. No Life behavior changes were needed.

2026-06-29 update: **Checkpoint 59** paid down CP49 trust/death verification and older Entrepreneurship/core smoke
debt. Trust/death probes are green (`death` 20/20, `networth-genetics` 9/9, `trust` 18/18, `estate-trust` 4/4,
`trust-nav` 2/2, `wayback` 11/11). Entrepreneurship/core probes are green (`separation` 20/20, `features` 17/17,
`ipo` 17/17, `dashboard` 32/32, `founderpay` 24/24, `stock` 30/30, `entrepreneur-legal` 11/11). No gameplay source
changes were needed; only stale probe expectations in `cdp/ipo.js` and `cdp/stock.js` were updated.

2026-06-29 update: **Checkpoint 60** paid down Property/Vehicles verification debt. `pages/systems/property-estate.js`,
`pages/systems/car-collection.js`, `cdp/property.js`, and `cdp/cars.js` passed syntax checks; the bundle rebuilt;
`cdp/property.js` passed 78/78 and `cdp/cars.js` passed 23/23. No gameplay source changes were needed.

2026-06-29 update: **Checkpoint 61** corrected patch cleanup state. `pages/patches/` is empty, `play.html` has no
active `pages/patches` script tags, and `docs/build-report.json` has no patch script entries. Added
`cdp/no-patches.js` as a future browser guard and updated `dev-notes/PATCH_AUDIT.md`. The browser guard itself was
not run because the app rejected starting a temporary headless Edge session due usage limits; static checks passed.

2026-06-29 update: **Checkpoint 62** finished the no-patches browser guard and CP26 property fold-in follow-up.
`cdp/no-patches.js` passed 2/2 in a browser. Legacy rental purchases now create current Real Estate portfolio
entries instead of new `state.rentals` entries, and `renderHome()` no longer computes/exposes the old rental catalog
UI. `cdp/property.js` now covers that compatibility path and passed 80/80 after rebuild.

2026-06-29 update: **Checkpoint 63** re-verified backlog items 3 and 4. Trust Envelop / Family Office holdings are
green (`trust-holdings` 12/12 and `family-office` 23/23), including titled property, titled founder-company holdings,
net-worth neutrality, protected-assets increase, and succession carry. Entrepreneurship Legal / tax attorney is green
(`entrepreneur-legal` 11/11), including the Legal tab, counsel fees, reduced effective corporate tax rate, and yearly
tax savings.

2026-06-29 update: **Checkpoint 64** shipped the Life page polish and Entrepreneurship backlog. Life activity popups
for Body & Mind, Fun, and Side Money now use card-style layouts; luxury/experience pricing and Status thresholds were
tuned upward. CP64 also added the shared chart module (`pages/systems/charts.js`) used by Stocks and
Entrepreneurship, and CDP coverage for the existing hiring/interview flow plus the likely regular-stock and
founder-own-share sell paths. Verified by `cdp/life.js` 22/22,
`cdp/entrepreneur-backlog.js` 13/13, `cdp/stock.js` 30/30, `cdp/dashboard.js` 32/32, and `cdp/no-patches.js` 2/2.

2026-06-29 correction: **Checkpoint 65** moved the live-trading player surface out of Entrepreneurship and into
Investments. The Investments live tape now ticks real `state.finance.stocksV18.prices` every second while the hub is
open, so actual owned stock values move with the tape. Entrepreneurship no longer shows a Trading tab. A death safety
wrapper now forces the In Memoriam screen if age-up leaves the character dead while stale hub markup or a decorated
death panel would otherwise freeze the screen. Verified by `cdp/entrepreneur-backlog.js` 13/13, `cdp/death.js` 22/22,
`cdp/stock.js` 30/30, `cdp/dashboard.js` 32/32, and `cdp/no-patches.js` 2/2.

2026-06-29 correction: **Checkpoint 66** hardened the Investments live-button crash path. Live market mode is now
owned by the base v18 stock runtime in `pages/runtime/00-core-app-runtime.js` (`toggleLiveMarketV18`,
`liveMarketTickV18`, `stopLiveMarketV18`) and uses the same `stocksV18` price/history/value path as normal stock
buy/sell. `pages/systems/stocks-investing.js` no longer carries the duplicate wrapper ticker; it only decorates the
Investments route and input/readout UX. Syntax checks and rebuild passed, and an in-app browser smoke test opened
Investments, started live mode, bought `$1K` AAPL while ticks were running, and stopped live mode with no console
errors. Standalone CDP launch was unavailable after this cleanup, so rerun the focused CDP probes when CDP is available.

2026-06-29 correction: **Checkpoint 67** fixed the user-facing Investments flow when a save has `Investment Cash $0`.
The Real Stocks desk now has `Fund $10K`, `Fund $100K`, and `Fund Max` controls that move checking cash into
Investment Cash through `fundStockCashV18`, plus a visible live status strip under the action buttons. `play.html`
cache stamps were bumped to `20260629-livefund1`. Syntax checks and rebuild passed, and in-app browser smoke verified
funding, buying `$1K` AAPL, starting live ticks, visible tick status, and stopping live mode with no console errors.

2026-06-29 correction: **Checkpoint 68** made Real Stocks live by default and closer to a day-trading board. The
stock runtime now stores OHLC candle history under `state.finance.stocksV18.candles`, renders candlestick mini charts
and pattern labels per stock, and adds `Buy Max` so all current Investment Cash can go into one stock. Live ticks now
model momentum, pullback/rebound pressure, random breakouts/selloffs, and larger Bitcoin/speculative-stock spikes.
`play.html` cache stamps are `20260629-livecandle1`. At that checkpoint, Full Investments 2.0 was still backlog:
rebuild around an Asset Summary and separated Live Trading, manager, personal firm, and fund-economics sections.

2026-06-30 update: **Checkpoint 69** shipped the Investments 2.0 stock engine as a Ledger-native module in
`pages/systems/stocks-engine.js`, loaded by `play.html` after the existing Investments wrapper. The old
`state.finance.stocksV18` save home remains in place, old holdings/prices/history migrate safely, live mode defaults
on with a single timer, fresh saves seed OHLC candles, amount-based buy/sell plus Buy Max and explicit Buy Checking
are active, and personal firm/fund state is preserved in a separate Personal Firm tab. Verification is green:
`cdp/investments-stock-engine.js` 21/21, `cdp/entrepreneur-backlog.js` 17/17, `cdp/stock.js` 30/30, and
`cdp/dashboard.js` 32/32 after rebuild.

2026-06-30 follow-up: **Checkpoint 70** addressed the reported Investments open-freeze path. `stocks-engine.js` now
uses a fast shape-ready path so helper calls do not rerun the full 51-stock migration loop, and the live market timer
is deferred until the Investments hub renders instead of starting on page load. `play.html` now loads
`stocks-engine.js?v=20260630-investments2b`; system map and hub metadata now point at `pages/systems/stocks-engine.js`
and use the visible `Investments` label. Syntax checks and rebuild passed. Final browser/CDP replay is pending because
the environment usage limit blocked the rerun.

2026-06-30 second follow-up: **Checkpoint 71** fixed the remaining Investments freeze path. `stocks-engine.js` now has
a safe fallback render with `Reset View`, caps the saved Live Trading tab to 18 visible cards by default, starts the live
timer only after the real Investments overlay is inserted, and stops ticks when the overlay closes. `play.html` now loads
`stocks-engine.js?v=20260630-investments2c`, and `PAGES.md` points Investments at `pages/systems/stocks-engine.js`.
Verification is green: `cdp/investments-stock-engine.js` 26/26, `cdp/entrepreneur-backlog.js` 17/17, `cdp/stock.js`
30/30, and `cdp/dashboard.js` 32/32 after rebuild.

2026-06-30 stabilization: **Checkpoint 75** addressed the later Edge/base-game crash report where the game could
freeze after page load, picking a life, or normal life actions even before opening Investments. `stocks-engine.js`
no longer calls `ensureShape()` at script load; age-up processing is gated by real personal Investments activity; live
ticks check whether the Investments overlay is open before touching stock state; and founder IPO holdings marked by
Entrepreneurship are preserved for public-company controls but excluded from personal Investments value/sell-all/net-worth
sync. Current cache stamp: `stocks-engine.js?v=20260630-investments21e`. Syntax checks and rebuild passed; Edge CDP
verification is still blocked because Edge did not expose the requested remote-debugging port in this environment.

Property-specific context from **Checkpoint 29 (2026-06-22)**: `pages/systems/property-estate.js` is now **v18.66**.
CP27 added property class/prestige tiers (Economy→Prestige, net-worth-gated); CP28 fixed the Flip-plan
button (real flip project) and added **tenant screening / background checks**; CP29 added **tenant
relationships + romance** (visit tenants to build a relationship that renews their lease, gifts/encounter
events, flirt→ask-out romance with abstract adult-gated intimacy); CP30 made **living in an owned property
grant a real lifestyle bonus** (happiness/looks by class+condition, no legacy double-charge); CP31 added
**tenant personalities + flavor lines + story moments** (6 personas, now mechanically distinct via
`PERSONA_BIAS`). CP32 added a **NEW car & garage system** (`pages/systems/car-collection.js`, v18.67):
buy cash/finance, depreciation/appreciation (classics gain), condition + repairs, a garage with resale
equity in net worth, and a daily-driver looks/happiness bonus; it replaces the old single-car UI and
migrates the legacy `state.car` once. CP33 grew the catalog to **100 cars (emoji icons) across 8
colour-coded classes** (added Off-Road + Electric), added **tenant persona emojis**, **class-coloured
card accents** across both systems, and a **tenant Evict** action (`reEvictTenantV1866`). The property system is well ahead of the older
notes (CP26 says v18.62; source was already v18.63 before CP27) — **verify source, not the notes**. CP27–CP32
`dist` rebuild and CDP debt is now paid down by CP62: `cdp/property.js` 80/80 and `cdp/cars.js` 23/23. CP26 #4
(fold the legacy
`homes`/`rentals` catalogs into the property system) is shipped for rentals: legacy rental buys now enter
`finance.reV1863.portfolio`, `state.rentals` stays empty, and the old rental catalog UI path is hidden. CP34 split
**Vehicles into its own hub/page** (out of Real Estate) and renamed the leftover **"Home" hub label to
"Real Estate"** across the active nav/title sources (15/14/11 patches + runtime + More menu). Future
backlog (logged, not built): **Entrepreneurship team hiring** — interview + hire role-based staff
(mirror the tenant-screening pattern) in `pages/systems/entrepreneur.js`.

## Entrepreneurship

The Entrepreneurship rebuild is the latest major feature work.

Current reliable shape:

- Entrepreneurship is separate from Business.
- Entrepreneurship owns founder/startup style companies.
- Business owns managed companies, entities, trust, and family enterprise.
- Entrepreneurship includes deeper founder systems, graphs, IPO/public-company
  behavior, grants, and stock coupling.

### Shipped this session (2026-06-20) — all in `pages/systems/entrepreneur.js`
(except the death/legacy fix). Verified by the CDP probes listed in TESTING_AND_BUILD.md;
full detail per checkpoint in `dev-notes/SESSION_SUMMARY.md` (checkpoints 2–14).

- **Dashboard 2.0 (done)**: tabbed active-company panel — Overview / Product / Growth /
  Team / Funding / Public Market / Exit (`activePanelV1862`, `bizSetPanelV1862`). Public
  Market tab gated until public.
- **Founding routes to Entrepreneurship (done)**; the "owns the Business hub" copy is gone.
- **Team panel redesign**: status strip + recruit role-cards (show salary + skill boosted)
  + premium roster (avatars, perf meters, flight-risk).
- **Color pass**: per-section accent via `--acc` CSS var + `biz1862-accent-<panel>` class;
  gradient-tinted metric cards; color-coded control cards (Founder pay/Capital/Funding/etc.);
  budget allocation is now a `donutSVG()` pie. Metric kinds `green`/`red` are now styled
  (profit shows green when positive, red when negative).
- **Founder income** (was the big gap — founders earned $0 pre-profit):
  - Auto founder **salary** = `max(5% revenue, $40k)`, rate 3–10% (`bizSetSalaryRateV1862`),
    a real cost, capped to what the company can fund, taxable.
  - 40%-of-profit distribution still applies on top.
  - Manual yearly **distribution** (`bizTakeDistributionV1862`, 15% of cash, deferred-taxed
    via `fin().pendingFounderDrawV1862`).
- **Profit-plateau economy fix**: `_runBizSalesEngine` now uses market expansion (~4%/yr) +
  brand reach + soft saturation instead of a hard `marketSizeM*100` cap; `_runBizFinancialEngine`
  caps gross BEFORE gross profit and the ceiling is $5B (profit can no longer exceed revenue).
- **Stock / public-company**: share counts shown (`compactSharesV1862`); buyback bounded to
  the real float, `floatPct` dynamic, auto take-private at ~100% + explicit Take Private
  (`_bizTakePrivateV1862`); **stock split / reverse split** (`bizSplitStockV1862`, keeps value/
  ownership/float); **yearly dividends** (`bizSetDividendRateV1862`, Off/5/10% of profit,
  cash-capped, founder gets ownership share, taxable).
- **Continue-after-death (done, core runtime + tax-legal.js)**: death screen always offers
  Continue; with no living child, `continueAsHeirV1846` generates a relative successor
  (`generatedSuccessorV1862`) with reduced inheritance.
- **Hidden Dev Tools (`pages/systems/dev-tools.js`)**: inert unless play.html has `?dev=1`,
  then a password gate (pw = `password`) reveals a floating 🛠 panel with money/age/stats,
  entrepreneur helpers, old-business migration, and save tools. Also `window.devTools("password")`.
  The Old Business check was moved here (out of the player hub); migration still auto-runs in
  `initBiz()`. Keep dev-only utilities here so the playable build stays clean.

### Open backlog (requested, not yet built)
- **Investments 2.0 redesign**: CP68 shipped the bridge version (live default-on Real Stocks,
  mini candlesticks, pattern labels, and `Buy Max`). Still needed: a proper Investments redesign
  with first-screen Asset Summary, separated Live Trading / managers / personal firm / fund
  economics areas, and a larger chart/ticker experience.
- General "work on the graphs" polish.
- "Sell button doesn't sell" report: Sell All works in `cdp/stock.js`; needs the exact
  screen/button from the user to reproduce.

## Business

Business has shipped uniqueness upgrades:

- 100 businesses across 10 sectors,
- unique signature actions,
- sector meters,
- market events,
- rivals,
- business challenge/event layers,
- named per-sector risk line items,
- portfolio synergy / diversification bonuses,
- sector-specific multi-location/franchise expansion,
- rival market-share competition and acquisition.

Do not collapse Business into Entrepreneurship.

### Business uniqueness roadmap status

Current 2026-06-20 update: roadmap #6, #7, and #10 are now shipped. Named per-category
risk line items render in the focused-company risk panel via `businessRiskBreakdownV1856()`,
portfolio synergy/diversification bonuses affect the yearly business loop via
`businessPortfolioEffectsV1856()`, and the real multi-location/franchise/rival-share layer
uses `locationsV1857`, `marketV1857`, and `applyBusinessLocationsYearV1857()`.

`BUSINESS_UNIQUENESS_ROADMAP.md` is kept for full historical context. Treat it as a shipped
roadmap now; future Business work should be tuning, balancing, and UI polish unless the user
asks for a new expansion.

## Credit and Finance

Credit redesign is marked complete:

- unified credit-card limit helper,
- score-tiered secured-loan APR,
- personal line of credit,
- operating businesses in finance/net worth.

Finance is sensitive. For any money/net-worth change, read:

- `dev-notes/codex-skills/ledger-system-logic/references/save-finance-integration.md`

## UX Direction

The preferred visual direction is premium Ledger style:

- dark warm panels,
- serif headings,
- tiny uppercase labels,
- gold values,
- compact action chips,
- useful charts and status cards,
- refined but readable density.

For UX work, read:

- `dev-notes/codex-skills/ledger-feature-ux/references/premium-ledger-style.md`

## AI Handoff Additions

This handoff system now exists to orient future agents:

- `dev-notes/ai-handoff/START_HERE.md`
- `dev-notes/ai-handoff/PROJECT_CONTEXT.md`
- `dev-notes/ai-handoff/SKILL_INDEX.md`
- `dev-notes/ai-handoff/CURRENT_STATE.md`
- `dev-notes/ai-handoff/FEATURE_WORKFLOW.md`
- `dev-notes/ai-handoff/TESTING_AND_BUILD.md`

The root `AI_DEV_README.md` remains the easy top-level entry.
