# Entrepreneurship Rebuild - Execution Note

Ported Verdant-style entrepreneur system for the modular game. **Status: Phases 0–H done**
(scaffold → wizard → yearly engine → hub render → legacy retirement → Business/Entrepreneurship
separation → depth → IPO/public-company + grants + scale graph). All phases verified by
headless-Chrome smoke tests (see Test suite). Last updated 2026-06-19.

> **Scope correction (2026-06-19):** Business and Entrepreneurship are deliberately
> SEPARATE pages and never share companies. The new ported system owns only the
> **Entrepreneurship** route; the **Business** route keeps the old hub
> (`business-entities.js` `renderBusinessHubV1840` — owned companies, entities,
> trust, family enterprise). Only the old single-startup founder system
> (`startupV1856.co`) carries into Entrepreneurship; the old Business companies
> (`finance.businesses[]`) stay in Business and run independently. See
> "Separation" section below.

## Phase Plan

- [x] Phase 0 - dev-note + hide broken Founder Capital panel.
- [x] Phase A - `entrepreneur.js` scaffold: catalogs, founder state, business-object factory, and state shim.
- [x] Phase B - 6-step creation wizard in the Business hub.
- [x] Phase C - yearly engine: sales, HR, financials, death, stage-up, events, exits, actions, and self-funding.
- [x] Phase D - render panel adapted to the modular hub + CSS; Entrepreneurship route uses the ported entrepreneur hub.
- [x] Phase E - founder-startup migration/check, net-worth wiring, legacy stage mapping, legacy hook gating (no double-tick), and duplicate-repair tooling. Old systems stay loaded as data-level shims; their yearly/income hooks skip migrated firms.
- [x] Phase F - **separated Business from Entrepreneurship** (see Separation section): new hub no longer hijacks the Business route, and old Business companies are no longer imported into the new system.
- [x] Phase G - **Entrepreneurship depth** (see Depth section): expanded revenue models (incl. new types), richer wizard with descriptions, custom Bootstrap amount, and interactive graphs in the active-company panel.
- [x] Phase H - **IPO / public company + grants + scale graph** (see IPO section): IPO now lists the company as a tradable ticker you keep a stake in (stay CEO, invest in yourself, portfolio-coupled), industry grants, and a Scale graph.

## Done So Far

Phase 0:

- Note written.
- Old misleading Founder Capital surface is no longer the primary Business route.

Phase A:

- `pages/systems/entrepreneur.js` exists.
- Ported Verdant data: 17 industries in `BIZ_TYPES`, 6 revenue models in `BIZ_MODEL_INFO` (expanded to 12 in Phase G).
- Business factory `_newBizObj` includes lifecycle, product, financials, team, funding, market, and exit fields.
- Founder state lives at `state.finance.bizV1860`.
- Modular state shim replaces the old `G.*` assumptions.
- Wired in `play.html`.

Phase B:

- 6-step founding wizard works:
  - Industry
  - Revenue model
  - Name
  - Co-founder
  - Capital
  - Year-1 focus
- `_createBiz` and `_launchBiz` create the company in the new entrepreneur store.

Phase C:

- `runEntrepreneurYearV1861` runs during yearly finance resolution.
- Active businesses process product development, sales, HR, financials, stage-ups, random events, death, acquisition offers, exits, and founder payouts.
- Actions exist for hire/fire, marketing budget, dev allocation, raising funding, franchising, exits, second businesses, and self-funding.

Phase D:

- `renderEntrepreneurHubV1861` now owns the Business/Entrepreneurship hub route.
- The hub shows founder summary, portfolio switching, active company metrics, capital controls, marketing controls, dev focus, funding rounds, hiring, exits, and founder history.
- CSS is injected by `entrepreneur.js` under `ledger-entrepreneur-v1861-style`.

## What To Test Now (current, post Phase H)

> Use the rebuilt Ledger (`dist/...play_built.html`), not Verdant. Business and
> Entrepreneurship are now SEPARATE pages.

1. Open **Entrepreneurship** (not Business) and click `Found a Business`.
2. Walk the 6-step wizard — confirm step 1 (industry) and step 2 (revenue model) show
   descriptions, step 2 offers multiple models, and the capital step has a custom
   Bootstrap field.
3. Confirm the company appears active with metrics + the graph panels (Growth, Scale,
   Budget, Hiring, Marketing).
4. Age up and confirm revenue/product/cash/valuation/customers move and graphs fill in.
5. Try self-funding, marketing budget, dev focus, hiring, a funding round; watch for grant
   log lines (greentech/social enterprise hit more often).
6. Grow to $10M+ revenue and 5+ years, then **IPO** (pick a float %). Confirm: you keep a
   stake + stay CEO, the ticker shows in the **Stocks** portfolio, share price moves on
   age-up, and buying/selling your own stock moves cash + net worth.
7. Open **Business** separately and confirm it still shows the OLD hub (entities, trust,
   family enterprise) with its own companies running independently.

## Phase E - Done

- Old `startupV1856.co` and `finance.businesses[]` saves migrate/check into `finance.bizV1860.businesses`.
- Business hub shows an `Old Business Check` card when legacy business data exists.
- `bizV1860` company value is included in legacy net worth, Finance, and More summaries.
- **Decision: keep old modules loaded as data-level shims, fully gate their money paths.** The render route is already owned by the new hub; every legacy yearly/income path now skips firms flagged `_migratedToBizV1861`, so a migrated company is ticked only by the new engine (no double income/value).
  - Gated: core income loop + 3 income estimators (`00-core-app-runtime.js`), `repayOwnerLoans` + `applyDecline` (`venture-lifecycle.js`), `tickYear` (`startup-founder.js`). Net worth already excluded migrated firms.
- **Stage mapping:** `stageFromLegacyV1861` now uses `LEGACY_STAGE_MAP_V1861`, a full table covering the venture spine (idea/startup/growing/established/mature/declining/exited), startup-founder vocab (building/launched/growth/scale/dead), and core catalog names → the new spine (idea → pre-revenue → early → growth → scale → mature → exit).
- **Duplicate repair:** `repairDuplicateBusinessesV1861()` collapses duplicate companies by signature (source key, else name+type), keeping the strongest copy (active/not-dead, then highest value) and re-pointing the active selection. `oldBusinessCheckV1861()` reports a `duplicates` count; the Old Business Check card surfaces a `Merge N Duplicates` button when any exist. Verified idempotent.

## Separation (Phase F)

Business and Entrepreneurship were ending up identical because the ported hub had
hijacked **both** routes. They are now split:

- **Route ownership** (`entrepreneur.js` `renderHubContent` wrapper): the wrapper now
  intercepts only `entrepreneurship` / `founder` / `startup` → `renderEntrepreneurHubV1861`.
  `business` / `biz` / `company` fall through to the old chain →
  `business-entities.js` `renderBusinessHubV1840`.
- **No shared data** (`migrateOldBusinessesV1861`): the `finance.businesses[]` import
  was removed. Only `startupV1856.co` (the old single-startup founder system, which the
  new Entrepreneurship replaces) migrates into `bizV1860`. Old Business companies stay in
  `finance.businesses[]`, owned by the old Business hub, and tick normally.
- **Gates are now no-ops for Business:** the Phase E `_migratedToBizV1861` gates in the
  core income loop / estimators / `venture-lifecycle.js` stay in place but never fire for
  `finance.businesses[]` (those are never flagged now), so old Business income/decline/
  loans resume normally. The `startup-founder.js` gate still fires (startup still migrates),
  preventing a double-tick of the migrated startup.
- **Old Business Check** (`oldBusinessCheckV1861`) now only counts the founder startup, so
  it no longer nags about Business companies that are intentionally not migrated.

## Depth (Phase G)

Player feedback: Entrepreneurship felt thin — step 2 often showed a single revenue
model, capital was capped, and the active company was all raw numbers. Addressed:

- **More revenue models** (`BIZ_MODEL_INFO` + `BIZ_MODELS_BY_TYPE` + `modelsForType`):
  added `freemium`, `ads`, `usage`, `transaction`, `franchise`, `affiliate` on top of
  the original 6, and mapped each industry to 3-5 fitting models. Each new model has a
  real revenue branch in `_runBizFinancialEngine` (anchored within the existing
  per-customer economics so balance stays sane). Step 2 reads `modelsForType()`.
- **Richer wizard** (`wizOpt` card + `.biz1861-wizgrid`/`.biz1861-wizopt`): industry,
  model, co-founder, capital, and focus steps now render title + description + a small
  stat line (industry margins/market; model KPIs; equity/debt cost) instead of bare
  buttons.
- **Custom Bootstrap** (`bizWizardCustomBootstrapV1861`): the capital step has a
  type-your-own-amount field (capped at personal cash) alongside the presets, so you can
  invest more than the old fixed $25K.
- **Interactive graphs** (`renderBizGraphsV1861` + helpers `sparkSVG`, `trendCard`,
  `segBar`; inserted after the metric grid in the active panel):
  1. Growth trends — revenue / profit / valuation sparklines with latest value + delta.
  2. Budget allocation — stacked bars for annual spend (staff/marketing/co-founders/tools)
     and dev focus (features/bugfix/ux/custdev).
  3. Hiring impact — headcount, payroll vs revenue bar, and what the team strengthens.
  4. Marketing ROI — budget, customers added last year, revenue per $1, customers-over-time.
  All charts are inline SVG / CSS (no libs). `revenueHistory` now also records
  `valuation/customers/mktg/costs/headcount` per year to feed them.

## IPO / public company + grants + scale (Phase H)

Player wanted Verdant-level depth: a real IPO (keep a stake, stay CEO, trade your own
shares, portfolio coupling), industry grants, and more "how am I scaling" graphs.

- **IPO = go public, not a terminal exit** (`bizGoPublicV1861`): choose a float % (presets
  25/40/60 + custom 5-90). The company stays active and keeps operating. It lists as a
  **real ticker** in `state.finance.stocksV18` (`prices`/`history`/`holdings`), priced at
  AED 20/share with `shares = valuation / 20`. You sell the floated slice of your stake for
  cash (light CGT) and keep the rest as a holding. Decision was **"full ticker in the Stocks
  hub"** — the synthetic holding shows in the Stocks portfolio automatically because
  `holdingRows18()` tolerates ids not in `STOCKS18`.
- **Stay CEO / lose control**: ownership = your shares ÷ total shares. Below 10% you lose CEO
  control (`controlLost`); selling to 0 fully exits. Buying back above 10% restores it.
- **Invest in yourself** (`bizBuyOwnStockV1861` / `bizSellOwnStockV1861` + custom): buy/sell
  your own ticker with personal cash, at the live price, from the Entrepreneurship hub.
- **Yearly price** (`_bizUpdateSharePriceV1861`): price tracks fundamentals
  (`valuation / shares`) blended with a **market beta** (`_marketFactorV1861`, the average
  move of the real `STOCKS18` that year) + noise, smoothed 30/70. So the company rises/falls
  with both its own performance and the broader market — and because the stake is in net
  worth, your wealth moves with it.
- **Net-worth coupling, no double-count**: public companies are valued in net worth by the
  player's **stake** (shares × live price), not enterprise value — in `legacyNetWorth`
  (core runtime), `bizV1860PortfolioValue` / `bizV1860StakeValueV1861`, and (via that)
  finance-ledger. The stock holding itself isn't separately added to `legacyNetWorth`
  (those stock fields are never written), so there's exactly one count.
- **Grants** (`_bizYearlyGrantsV1861`): every industry is eligible; greentech & social
  enterprise get a higher chance (22% vs 8%) and larger awards. Non-dilutive cash into the
  company, scaled by stage; recorded in `grantHistory`.
- **Scale graph** (5th chart): customer growth, revenue/employee, market share (rev ÷ TAM),
  and valuation multiple (val ÷ rev) — sparkline trend cards from `revenueHistory`.

Note: native Stocks-hub Buy/Sell buttons don't act on the player's ticker (it's not in
`STOCKS18`); trading your own company is done from the Entrepreneurship hub. The position
still shows in the Stocks portfolio and net worth.

## Possible Future Polish (not blocking)

- Optionally retire the legacy Business render functions entirely once confident no save relies on them.
- Repair tooling currently drops extra copies; could instead merge cash/customers if that proves desirable.
- `migrateLegacyBusinessV1861` is now unused (kept in case the import is ever re-enabled); remove if it stays dead.
- **Stocks-hub native Buy/Sell don't trade the player's own ticker** (it's not in `STOCKS18`) —
  trading is via the Entrepreneurship hub. Could deep-integrate so the Stocks-hub buttons act
  on it too (would require teaching the core stock engine about player tickers).
- A **visible market index / cycle effect** on the player's stock (the beta is applied but not surfaced).
- A **sectioned/tabbed dashboard layout** like Verdant's (Financials / Team / Product / Growth /
  Funding / Skills / Exit chips) instead of one long active-company panel.

## Test suite (repo root, driven by `.cdp-driver.js`)

Launch headless Chrome with `--remote-debugging-port=PORT`, then:
`node .cdp-driver.js PORT "file:///.../dist/Ledger_18_dynamic_stocks_v18_35_play_built.html" "<test>.js"`

- `.cdp-separation.js` — Business/Entrepreneurship route + data separation (20 checks).
- `.cdp-features.js` — Phase G depth: new models, richer wizard, custom Bootstrap, graphs (17 checks).
- `.cdp-ipo.js` — Phase H: IPO/public company, buy-self, price→net-worth coupling, grants, scale graph (17 checks).
- (`.cdp-pacing.js` / `.cdp-fundgrad.js` are older startup-founder pacing probes.)
- Retired: `.cdp-phaseE.js` (asserted the pre-separation migration; superseded by `.cdp-separation.js`).

## Verification

- Run `node --check` on touched JS each phase.
- Rebuild `dist/` after source changes.
- Browser smoke test in-game after Phase D and again after Phase E.

### Phase E verification (run 2026-06-19)

- `node --check` clean on all four touched files; `dist/` rebuilt.
- Headless-Chrome CDP smoke test (`.cdp-phaseE.js`, driven via `.cdp-driver.js`): **18/18 checks pass, 0 console errors.** Covers:
  - Double-tick gate: legacy income loop produces income pre-migration, then reports `lastBusinessIncome === 0` for the migrated firm while the new engine ticks the migrated copy (`yearsOld` advances).
  - Stage mapping: all 9 legacy stages migrate to the expected new spine value.
  - Duplicate repair: forced dups detected, merged to 0, active selection re-pointed to a survivor, idempotent on rerun.
  - Hub render returns HTML with the Old Business Check card.
  - Full founding wizard (type→model→name→cofounder→capital→focus) creates an active company; 6 age-ups run without throwing.
- The Phase E verification originally used `.cdp-phaseE.js`; after Phase F that test asserted
  the now-removed `finance.businesses[]` migration, so it was retired. `.cdp-separation.js`
  supersedes it (covers founder-startup migration, stage mapping, dedup, render).

### Phase F verification (run 2026-06-19)

- `node --check` clean on `entrepreneur.js`; `dist/` rebuilt.
- Headless-Chrome CDP smoke test (`.cdp-separation.js`): **20/20 checks pass, 0 console errors.** Covers:
  - `renderHubContent("business")` returns the OLD hub (`v1840-business-shell`), not the new hub; `renderHubContent("entrepreneurship")` returns the NEW hub (`biz1861-shell`); the two differ.
  - Old Business companies are not migrated/flagged, stay out of `bizV1860`, and still earn income on age-up.
  - The old founder startup still migrates into Entrepreneurship with correct stage mapping, ticks via the new engine, and does not double-tick.
  - Duplicate repair still works; Old Business Check no longer counts Business companies; full founding wizard + age-ups still run clean.

### Phase G verification (run 2026-06-19)

- `node --check` clean; `dist/` rebuilt.
- Headless-Chrome CDP smoke test (`.cdp-features.js`): **17/17 checks pass, 0 console errors.** Covers:
  - New models (`freemium/ads/usage/transaction/franchise/affiliate`) registered with name+desc; all 12 models produce revenue through the real yearly engine.
  - Wizard step 2 renders 3+ models with descriptions + KPI lines (`biz1861-wizopt`, `Track:`).
  - Custom Bootstrap: sets `startCash`, advances the step, spends the right personal cash, funds the company.
  - All four graphs render in the active panel (Growth trends + sparklines, Budget allocation + segbar, Hiring impact, Marketing ROI + roi cards).
- Regression: `.cdp-separation.js` still **20/20**.
- Test files in repo root: `.cdp-separation.js` (routes + data separation), `.cdp-features.js` (Phase G depth), driven by `.cdp-driver.js`.

### Phase H verification (run 2026-06-19)

- `node --check` clean on `entrepreneur.js` + `00-core-app-runtime.js`; `dist/` rebuilt.
- Headless-Chrome CDP smoke test (`.cdp-ipo.js`): **17/17 checks pass, 0 console errors.** Covers:
  - IPO makes the company public with a priced ticker + holding; founder receives cash; keeps majority.
  - The ticker shows in the Stocks-hub portfolio (`renderBrokerageHubV11`).
  - Net worth rises when the share price doubles and falls when it crashes (portfolio coupling).
  - Buy-your-own-stock adds shares + spends cash; selling returns cash.
  - Yearly engine runs clean while public; share-price history grows.
  - Green company accrues grants over time.
  - Scale graph + public-company desk render.
- Regression: `.cdp-separation.js` **20/20**, `.cdp-features.js` **17/17**, all 0 console errors.
