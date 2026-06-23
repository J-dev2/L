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

Latest is **Checkpoint 29 (2026-06-22)**: `pages/systems/property-estate.js` is now **v18.66**.
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
`dist` rebuild and the CDP probes were NOT run (node/headless-Chrome sandbox out of disk space) — run
`node build/build-ledger18.js` (now also bundles `car-collection.js` — note the new `<script>` in play.html),
then `cdp/property.js` (~73 checks) and `cdp/cars.js` (~22 checks). CP26 #4 (fully fold the legacy
`homes`/`rentals` catalogs into the property system) is the main remaining property item. CP34 split
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
- **Day-trading desk**: live/short-term trading of select stocks (the natural home for a
  real candlestick chart). Needs a design pass.
- **Shared chart module**: extract our SVG charts into a reusable `charts.js` (recommended)
  used by Stocks + Entrepreneurship; uPlot (MIT) only if a heavy interactive chart is wanted.
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
