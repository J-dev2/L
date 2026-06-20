# Session Summary — running dev notes

> Single running doc, rewritten at each ~5-prompt checkpoint. Latest state on top.
> Purpose: "where did we leave off" at a glance.

---

## Session 2026-06-20 — index of everything shipped

All work this session is in `pages/systems/entrepreneur.js`, `pages/systems/tax-legal.js`,
`pages/runtime/00-core-app-runtime.js`, and the new `pages/systems/dev-tools.js`. CDP probes
were added/updated as needed and `dist/` rebuilt. Checkpoints below have full detail.

- **Entrepreneurship Dashboard 2.0** — tabbed active-company panel (Overview/Product/Growth/
  Team/Funding/Public Market/Exit); founding routes to Entrepreneurship; market-signal. [CP2]
- **Team panel redesign** — status strip + recruit role-cards + premium roster. [CP3]
- **Continue-after-death** — death screen always offers Continue; no-child → generated
  relative successor with reduced inheritance. [CP3]
- **Founder income** — auto salary (max 5%/$40k, capped, taxable) + 40% profit distribution
  + manual yearly 15% distribution. Founders can finally live off a company. [CP4]
- **Dashboard color passes** — per-section accents, gradient metric cards, color-coded control
  cards, glowing eyebrow dots; profit metric green/red fix. [CP5, CP6, CP7]
- **Profit-plateau economy fix** — market expansion + brand reach + soft saturation (no more
  hard customer cap); gross cap ordering fixed + raised to $5B. Profit grows continuously. [CP6]
- **Budget allocation donut** (`donutSVG`); **share counts** on the public desk. [CP7]
- **Stock/public-company** — bounded buyback + dynamic float + auto take-private/delist + Take
  Private action; **stock split / reverse split**; **yearly dividends** (cash-capped). [CP7, CP8]
- **Hidden Dev Tools** (`?dev=1` + password `password`) — money/age/stats, entrepreneur helpers,
  old-business migration (relocated out of player hub), save tools. [CP9]
- **Family trust in net worth** — `legacyNetWorth` now counts trust corpus/funds/estate cash
  (no double-count in succession). [CP10]
- **Estate tax vs trust** — death haircut now scales with trust quality (no trust 45% → dynasty
  ~82% → family office ~90%). **Wayback "Undo Death"** button always on the death screen. [CP11]
- **Business portfolio/risk polish** — portfolio synergy/diversification bonuses are real yearly
  mechanics; focused Business risk now shows named sector line items. [CP13]
- **Business multi-location/franchise/rival share** — sector-specific sites, site controls,
  yearly location income/risk, compete-for-share, and rival acquisition. [CP14]

Test probes moved to the **`cdp/`** folder (dropped the `.cdp-` dot prefix), run via
`cdp/driver.js` — see `cdp/README.md`. New probes: `dashboard` 32, `death` 20, `founderpay` 24,
`stock` 30, `devtools` 17, `trust` 18, `wayback` 11, `business-locations` 22 (plus existing `features` 17, `ipo` 17,
`separation` 20). New file: `pages/systems/dev-tools.js`.

Still open / backlog: **day-trading desk**; **shared chart module** (recommend own SVG `charts.js`;
uPlot if a heavy interactive chart is wanted); general "work on the graphs" polish; the
lawyer-hub wayback quirk (could not reproduce — needs exact repro).

---

## Checkpoint 14 - 2026-06-20  (LATEST)

### Business multi-location, franchise, and rival market share
- **Location state (#10 shipped)**: businesses now initialize `locationsV1857` safely on old saves,
  with distinct site records (`id`, `name`, `model`, `archetype`, `tier`, `quality`, `staff`,
  `demand`, `status`, `years`, `lastIncome`) and a matching `marketV1857` record for share,
  rival share/strength, yearly action gates, and acquired-rival count.
- **Sector-specific expansion**: nightlife, media, food, retail, trades, tech, finance, real estate,
  health, logistics, and generic fallback businesses each use their own location archetypes and
  competition copy. Owned sites, franchise/partner sites, and acquired rival sites have different
  income/risk profiles.
- **Focused-company desk**: added a "Network + market share" panel with open-site count, network
  health, location income, named rival, open/upgrade/support/close controls, yearly
  compete-for-share, and late-game acquire-rival actions.
- **Yearly sim + risk**: location income is added in the Business yearly loop; sprawl, franchise
  controls, and rival pressure/market share are visible line items in the risk breakdown.
- **Probe**: added `cdp/business-locations.js` covering old-save initialization, locked open gates,
  sector archetype rendering, location actions, yearly compete gating, acquisition, yearly
  income/risk tick, and UI surface checks.
- Tests: `node --check` clean for `business-entities.js`, `00-core-app-runtime.js`, and
  `cdp/business-locations.js`; dist rebuilt. Browser execution of the new CDP probe was not
  completed in this sandbox (Chrome/Edge not on PATH; in-app browser fallback failed to launch).

---

## Checkpoint 13 - 2026-06-20

### Business portfolio synergy + named risk line items
- **Portfolio synergy/diversification (#7 shipped)**: added `businessPortfolioEffectsV1856()` in
  `pages/systems/business-entities.js`. Owning 2+ companies in the same sector gives a small yearly
  franchise income/reputation lift; owning 3+ sectors gives a diversification risk cut. The core
  yearly business loop in `pages/runtime/00-core-app-runtime.js` applies those effects and stores
  `lastPortfolioEffectsV1856` for auditability.
- **Named risk line items (#6 shipped)**: `riskFor()` now routes through a risk breakdown helper.
  The focused Business panel shows base pressure, reputation cushion, ops/asset mitigation, named
  sector pressure (licensing/noise, regulatory, IP/security, inventory, vacancy, clinical, capacity/
  safety), diversification, and franchise effects.
- **UI surfaced**: Business hero/KPI/rail cards show the active portfolio edge; the focused-company
  desk has a compact risk panel.
- **Next after this checkpoint**: #10 real multi-location/franchise expansion was still future
  work here; it shipped later in CP14.
- Tests: `node --check` clean for `business-entities.js` and `00-core-app-runtime.js`; dist rebuilt.

---

## Checkpoint 12 - 2026-06-20

### Tidied CDP test files into a `cdp/` folder
The headless-browser test probes were loose `.cdp-*.js` dotfiles cluttering the repo root.
- Moved all 13 into **`cdp/`** and dropped the `.cdp-` prefix: `cdp/driver.js`,
  `cdp/separation.js`, `cdp/features.js`, `cdp/ipo.js`, `cdp/dashboard.js`, `cdp/death.js`,
  `cdp/founderpay.js`, `cdp/stock.js`, `cdp/trust.js`, `cdp/wayback.js`, `cdp/devtools.js`,
  plus older `cdp/pacing.js`, `cdp/fundgrad.js`.
- New invocation: `node cdp/driver.js <port> "file:///d:/code/L/play.html?sandbox=1&from=landing" cdp/<name>.js`.
  The driver takes the probe path as an argument, so nothing was hardcoded — verified probes
  still run (separation 20/20, trust 18/18).
- Added **`cdp/README.md`** (run steps + table of all probes/check counts). Updated path
  references in `TESTING_AND_BUILD.md`, `CURRENT_STATE.md`, and this summary's index.
- No game-build impact — these are dev-only and never bundled (the build only pulls scripts
  from `play.html`/`index.html`).
- Older historical logs (`ENTREPRENEURSHIP_REBUILD.md`, `GAME_STUDIO_SKILLS.md`) still use the
  old `.cdp-` names — left as dated history.

---

## Checkpoint 11 — 2026-06-20

### Estate tax vs trust + Wayback-on-death
- **Estate/death "tax" too high despite a dynasty trust**: the inheritance rate was hard-capped
  at 45% in `personalInheritanceCashV1846` (`tax-legal.js`) regardless of trust quality, so you
  always lost ~55% of the non-trust estate on death. Now a strong trust/estate plan sharply
  reduces the haircut: `rate = baseRate + (1-baseRate)*trustProt`, where `trustProt` =
  max(`familyTrustV1839.protection`, estateV1831 trustType protection), capped 0.85.
  No trust → keep 45%; **dynasty → ~82%; family office → ~90%.** (Trust corpus still carries 100%
  separately.) Verified: `.cdp-trust.js` haircut test — no-trust keep 0.45 vs dynasty keep 0.82.
- **Wayback on death** (the real complaint: "when you die the wayback machine does not pop up"):
  the death screen showed no rewind option. Added an **"↺ Wayback — Undo Death"** button to
  `renderDeath` that **always shows** (gated only on the restore fn existing) and calls
  `waybackLifeSlotV18333()` (fallback `rewindOneYearV1814`) to restore the latest checkpoint
  (alive). The age-up wrapper auto-creates a pre-age-up checkpoint each year and `die()` saves,
  so the slot has a usable restore point. New probe `.cdp-wayback.js` (11/11): manual
  checkpoint+restore reverts age/money, age-up auto-checkpoints, death screen always shows the
  button, slot-restore undoes death.
- Restore paths themselves (`restoreWaybackIndexV18333`, `waybackLifeSlotV18333`) verified working
  in-place (no reload); the panel renders in More + Life hubs.
- NOTE: drive ageUp-to-death inside a CDP probe sparingly — forcing `health=-1` in a loop or
  natural death at 102 hung/crashed headless Chrome and (via many mktemp profiles) filled the temp
  disk. Use ONE reused `--user-data-dir` and clean it up; the manual alive=false setup is safer.
- All suites green (death 20, wayback 11, trust 18, separation 20, founderpay 24, stock 30,
  dashboard 32, features 17, ipo 17; devtools inert without ?dev=1). dist rebuilt.

---

## Checkpoint 10 — 2026-06-20

### Fixed: family trust not counted in net worth
Diagnosed via `.cdp-trust.js`: create/fund/distribute, year tick, and succession-carry all
worked — but `legacyNetWorth()` (the headline net worth: life hub, death screen, achievements,
succession) did **not** include the family trust, while `finance-ledger.js` did. So funding a
dynasty trust drained checking and the trust money vanished from net worth ("trust not working").
- `legacyNetWorth()` (`pages/runtime/00-core-app-runtime.js`) now adds `trustAssets` =
  `familyTrustV1839.corpus + Σ trustFunds + estateV1831.assets.trustCash` (mirrors finance-ledger).
- To avoid a new double-count, `personalInheritanceCashV1846` (`tax-legal.js`) subtracts
  `trustCarryValueV1846(s, heirKey)` from its `legacyEstate` term — the trust carries to the heir
  separately via `applyLegacyCarryV1846`, so it must not also be paid out as inheritance cash.
- New probe `.cdp-trust.js` (15/15): dynasty trust create/fund, legal hub render, **trust in net
  worth**, survives a year, carries to heir. All suites green (trust/death/separation/founderpay/
  stock/dashboard/features/ipo); dist rebuilt.

---

## Checkpoint 9 — 2026-06-20

### Hidden Dev Tools panel (`pages/systems/dev-tools.js`, new)
- Inert unless play.html is opened with **`?dev=1`** — then a small password gate appears
  (bottom-right); correct password reveals a floating 🛠 Dev Tools panel. Password = `password`
  (constant `DEV_PASSWORD` in dev-tools.js — obfuscation, not real security). Also unlockable via
  `window.devTools("password")` in the console (only defined when `?dev=1`, so the playable build
  has no backdoor).
- Tools: **Money/Age/Stats** (give $100K/$1M/$1B, set age, max stats, age up ×1/×5),
  **Entrepreneurship** (spawn company, make IPO-ready, grow ×1/×5 founder years),
  **Old Business migration** (recheck/migrate, merge duplicates), **Save** (force/export/import/wipe).
  Calls existing globals; each action wrapped in try/catch; panel is a fixed overlay + fab.
- **Relocated** the Old Business check OUT of the player Entrepreneurship hub into Dev Tools
  (migration still auto-runs via `initBiz()`); removed the now-dead `renderOldBusinessCheckV1861`.
  Data fn `oldBusinessCheckV1861` stays exported.
- Wired into `play.html` (loads last). New probe `.cdp-devtools.js` (17/17): gate locked→unlock,
  wrong pw rejected, panel opens, money/spawn/IPO tools work, player hub no longer shows the card.
- All suites green (devtools 17, dashboard 32, stock 30, founderpay 24, features 17, ipo 17*,
  death 20, separation 20). *ipo `green_company_gets_grants` is a pre-existing flaky/random check
  (passes on rerun; grants are probabilistic). dist rebuilt; dev-tools confirmed in play bundle.

---

## Checkpoint 7 — 2026-06-20

### Stock/IPO fixes + profit color + budget donut (entrepreneur.js)
- **Profit color bug**: metric kind `"green"`/`"red"` had no CSS (only `.good/.bad/.gold/.blue`
  were styled), so positive profit never turned green. Added `.green`/`.red` aliases to the
  value-color and gradient-tint rules. Profit is green when positive, red when negative.
- **Budget allocation → donut**: new `donutSVG()` helper (SVG ring + center total + legend);
  the spend breakdown now renders as a color-coded donut (dev-focus stays a segment bar).
- **Share counts**: public desk now shows your shares / total shares and the real public
  float in share counts (new `compactSharesV1862`).
- **Buyback de-list bug** (IPO 5% float, buy it back, still public): buyback is now bounded
  to the actual float (no phantom shares), `floatPct` updates dynamically as you repurchase,
  and at ~100% ownership the company **auto-takes-private/delists** (`_bizTakePrivateV1862`).
  Added an explicit **Take Private** action (buy out remaining float + delist) shown at ≥90%.
- New probe `.cdp-stock.js` (15/15). All suites green (stock/dashboard/founderpay/features/ipo/death/separation); dist rebuilt.

### (done in Checkpoint 8)
- Dividends + stock splits — implemented.
- Clarify the "sell button doesn't sell" report (Sell All works in tests; may be a UI/labeling confusion).
- Still open from before: day-trading desk, shared chart module.

---

## Checkpoint 8 — 2026-06-20

### Stock splits + yearly dividends (entrepreneur.js)
- **Stock split / reverse split** `bizSplitStockV1862(factor)`: factor>1 splits (shares ×, price ÷
  — cheaper shares so anyone can buy a slice, Robinhood-style), factor<1 reverse-splits.
  Scales total shares, your holding, market price + history, avgCost, _ipoPrice together so
  **total value, your ownership %, and the public float % are all unchanged** (the user's key
  point: "still 5% out there, just split up"). Guards keep price in [$0.05, $5M].
  UI: 2:1 / 10:1 / 1:2 buttons on the public desk.
- **Yearly dividends** `biz.dividendRateV1862` (Off/5%/10%, opt-in, default 0): public companies
  return that % of POSITIVE annual profit to shareholders, **capped to available cash so it can
  never bankrupt the company**. You receive your ownership share (taxable, on top of founder
  pay); the public float's share leaves company cash. UI: dividend policy buttons on public desk.
- Probe `.cdp-stock.js` now 30/30 (splits keep value/ownership/float; dividends 10%-of-profit,
  founder share, taxable, cash-capped, off-by-default). All suites green; dist rebuilt.

### Still open
- "Sell doesn't sell" — Sell All works in tests; need the exact screen/button to repro.
- Day-trading desk; shared chart module; general "work on the graphs" polish.

---

## Checkpoint 6 — 2026-06-20

### Fixed: profit froze despite good margins (entrepreneur.js economy bug)
Measured via sim: a healthy SaaS hit the customer cap (`marketSizeM * 100` = 50k) by ~yr5
and **profit flatlined at ~$88M for 20 years**. Two root bugs fixed in the engine:
- `_runBizSalesEngine`: replaced the hard cap with **market expansion (~4%/yr) + brand
  reach (brand 0→0.8x, 100→2.4x) + soft saturation** (capture ≤ half remaining headroom/yr).
  Strong companies keep growing instead of freezing. `biz._marketSize` now tracks expansion
  for the market-share chart.
- `_runBizFinancialEngine`: the $500M `gross` cap was applied **after** grossProfit was
  computed, so profit kept compounding off uncapped gross (profit > revenue!). Moved the cap
  before grossProfit and raised it to **$5B** so revenue/profit stay consistent and a great
  company can scale into the billions.
- Re-sim: profit now climbs continuously ($2M→$586M over 25 yrs) at a steady ~74% margin,
  profit ≤ revenue. All regressions green (features/ipo/founderpay/dashboard/death/separation).

### Stronger dashboard color pass (CSS + small markup)
Money-hub-level richness on the Funding controls: each control card is color-coded with its
own gradient + tinted title + left accent strip — Founder pay green, Capital gold, Funding
rounds violet, Dev focus blue, Marketing green. Split/graph/minirow cards get gradient
backgrounds; body section labels get a glowing accent dot. Verified by screenshot.

### Backlog (unchanged)
- Day-trading mini-game (scope pending). Shared chart module (our own SVG recommended; uPlot if heavy stock chart).

---

## Checkpoint 5 — 2026-06-20

### Dashboard color pass (entrepreneur.js, CSS-only + 1 markup hook)
Feedback: dashboard looked too monochrome / "no pop." Added a semantic color layer
that stays within the premium palette (no random neon):
- Per-section accent via CSS var `--acc`, set by a `biz1862-accent-<panel>` class on the
  active `<section>`: overview/funding gold, product/public blue, growth green, team violet,
  exit red. Drives panel top-border wash, valuation badge, selected tab gradient,
  next-milestone bar, and section labels.
- Metric cards (`.biz1861-metric.good/.bad/.gold/.blue`) now have semantic gradient tints
  + colored borders, so status strips read in color instead of grey.
- Gradient-filled perf meters, subtly tinted recruit/role + hero stat cards.
- Verified with 2x screenshots (overview = gold, team = violet) — looks colorful + cohesive.
- Probes unchanged structurally: dashboard 32, founderpay 24, features 17, ipo 17 — all green; dist rebuilt.

### Backlog (user requested, not started)
- **Day-trading mini-game**: live/yearly trading of select stocks, buy whole shares,
  short-term trading loop. Bigger feature — needs its own scope/design pass.
- **Shared chart module** (carried from Checkpoint 4): research done — recommend our own
  shared SVG `charts.js`; uPlot (MIT, ~50KB) only if a heavy interactive stock chart is wanted.

---

## Checkpoint 4 — 2026-06-20

### Fixed: founders had no income to live on (entrepreneur.js)
Profit was distributed 40% to the player, but only when net-profitable — early/growth
companies run at a loss for years, so founders earned $0 while full-time (job salary 0).
Added a founder-pay model (design choices: "auto salary, set rate" + "yearly distribution"):
- **Auto founder salary** in `_runBizFinancialEngine`: `max(5% of revenue, $40k floor)`,
  rate adjustable 3–10% via `bizSetSalaryRateV1862`. It is a real operating cost (lowers
  profit), capped to `cash + grossProfit - operatingCosts` so it never drives company cash
  negative by itself, and is paid to the player as taxable income.
- **40%-of-profit distribution** still applies on top (now on profit *after* salary).
  Player take each year = salary + profit share (`founderTake`).
- **Manual yearly distribution** `bizTakeDistributionV1862`: pull 15% of company cash once
  per game year (gated by `biz._lastDistributionAge`). Deferred-taxed via
  `fin().pendingFounderDrawV1862`, which the next tick folds into `lastEntrepreneurIncome`
  (tick seeds from pending instead of resetting to 0 → taxed exactly once, no double count).
- UI: "Founder pay" card in the Funding panel (rate presets 3/5/8/10%, salary readout,
  Take-distribution button with cooldown copy). Profit metric note updated.
- New probe `.cdp-founderpay.js` (24/24): salary paid when unprofitable, cap never makes
  cash negative, take = salary+payout, taxable, distribution 15%/cooldown/deferred-tax,
  rate clamp, UI renders.

### Still open (user asked, not yet done)
- **Shared/own graph system** for stocks + entrepreneurship (reusable chart module).
  Current charts live only in `entrepreneur.js` (`renderBizGraphsV1861`, `sparkSVG`,
  `candleChartSVGV1862`). Next step: extract to `pages/systems/charts.js` shared API.

### Tests: founderpay 24, death 20, dashboard 32, features 17, ipo 17, separation 20 — green; dist rebuilt.

---

## Checkpoint 3 — 2026-06-20

### Fixed: "can't continue life after death" + Team panel UX redesign
**Continue-after-death bug.** Diagnosed via `.cdp-death.js`: the death screen and
`continueAsHeir` worked, but the "Continue" button was gated on having a child, and
`continueAsHeirV1846` (the live override in `pages/systems/tax-legal.js`) hard-returned
with a toast when no living child existed → players with no heir could only fully reset.
Fix (design choice = "generated successor"):
- `continueAsHeirV1846` now creates a relative successor (`generatedSuccessorV1862`) when
  there's no living child, with reduced inheritance (dead: .25 vs .45 direct; living: .10
  vs .18). Family business / trust / investment-office carry still apply.
- `renderDeath` (`pages/runtime/00-core-app-runtime.js`) always shows the Continue button
  (label "Continue the Family Line" when no child, "Continue the Legacy" otherwise).
- New regression probe `.cdp-death.js` (20/20) covers death with and without a child,
  and that continuation yields a living next generation keeping the family name.

**Team panel (Dashboard 2.0) UX redesign** — see earlier this session: status strip +
recruit role-cards + premium roster (avatars, perf meters, gold salaries, flight-risk).

### Still open (user mentioned, not yet actioned)
- Wants a reusable/"installable" graph system; likes current Scale/Growth graphs.
- "Make sure stock is good" — unspecified; needs clarification.

### Tests: death 20, dashboard 32, features 17, ipo 17, separation 20 — all green; dist rebuilt.

---

## Checkpoint 2 — 2026-06-20

### Done this round: Entrepreneurship Dashboard 2.0 (finished Codex's blocked work)
Picked up a partially-edited `pages/systems/entrepreneur.js` and completed it:
- **Founding route** now goes to `entrepreneurship`, not `business` (`_launchBiz`).
- **Tabbed active-company dashboard**: Overview / Product / Growth / Team / Funding /
  Public Market / Exit, driven by `activePanelV1862` + `bizSetPanelV1862(panel)`.
  Public Market tab is disabled while private and falls back to Overview at render
  (`dashboardPanelV1862`).
- **Hero copy** no longer claims Entrepreneurship owns Business (states the split).
- **Public market signal**: `_bizUpdateSharePriceV1861` now stores
  `lastMarketFactorV1862` / `lastPriceMoveV1862`; Public desk shows a Market signal metric.
- **CSS**: added all `biz1862-*` rules (tabs, command, next-milestone, panel, callout,
  split, minirow, candles) + mobile rules to the injected style block.

### Tests (all green via headless Chrome + `.cdp-driver.js`, port 9333)
- New `.cdp-dashboard.js`: 30/30.
- `.cdp-features.js` (17) and `.cdp-ipo.js` (17) updated for the tabbed layout
  (graphs/public desk now live behind their tabs) — both 17/17.
- `.cdp-separation.js`: 20/20 (unchanged).
- `node --check` clean; `build/build-ledger18.js` rebuilt both bundles.

### Notes / leftovers
- `PAGES.md` still lists `pages/systems/startup-founder.js` for Entrepreneurship; the
  live module is `entrepreneur.js` (loads last in `play.html`, wins). Both still load.
- Build writes to `outputs/ledger18_modular_v18_35/dist/`.

---

## Checkpoint 1 — 2026-06-18

### Current task
Startup mini-game **re-audit + retune** + **scroll buttons (Part E)**, per approved
plan `C:\Users\jgodj\.claude\plans\agile-stargazing-sifakis.md`.

### Where things stand (where I left off)
The big "Startup Mini-Game Depth Upgrade" (Parts A–D, F) **already shipped** —
`pages/systems/startup-founder.js` is **v18.58**, a Verdant-modeled deep founder sim:
- Founding wizard (type → model → name → co-founder/equity → capital → dev focus).
- Product lifecycle `concept→mvp→beta→live→v2`, **no revenue until live**.
- Slowed pacing (momentum decay, saturation cap), company-cash burn/debt/RBF
  accounting, real bankruptcy, founder full-time = salary 0.
- 4 funding instruments + cap table (equity rounds, venture debt, sell/buyback
  stake, RBF, grants).
- Per-type roles with effects + salaries.
- `graduateStartupV1856` calibrates an `entrepreneurshipCatalog` entry and inits the
  Tech sector meter (`ensureSectorMeterV1851`).

**Not done:** Part E — `pages/systems/scroll-nav.js` (v18.57) still has 82% jump,
CSS `scroll-behavior:smooth` (auto-scroll glitch), visible scrollbar, no hold-to-scroll.
`scroll-stability.js` is NOT the culprit (only restores vertical `.hub-body`) → leave it.

### Plan for this round (user chose: re-audit + retune everything)
1. ⏳ This doc (dev-notes running summary).
2. ☐ Node smoke harness → found all 12 types, tick 60+ yrs, log pacing/cash/valuation.
3. ☐ Retune pacing to targets: 2–5 dev yrs, 8–15 yrs to big exit, no single-year
   founder windfall, bankruptcy reachable, no NaN.
4. ☐ Audit/retune funding (dilution, loan repay/default, sell+buyback, RBF, grants);
   assert `equity + soldStake + investors ≤ 100`.
5. ☐ Audit/retune per-type roles (effect + burn).
6. ☐ Graduation smoke (graduate → business loop → sensible income + sector meter).
7. ☐ Part E scroll-nav.js (hide bar, gentle tap ~0.58, hold-to-scroll, no CSS smooth).
8. ☐ Verify: node --check, build, CDP scroll check, cleanup scratch.
9. ☐ PAGES.md refresh + dev-notes mention.

### Key files
- `pages/systems/startup-founder.js` — retune target (Part 1).
- `pages/systems/scroll-nav.js` — Part E.
- `pages/systems/scroll-stability.js` — leave untouched (not the glitch).
- Reference only: `base code.devtools` (Verdant ~L119226+); `00-core-app-runtime.js`
  business loop ~L6238-6266; `business-sectors.js` `ensureSectorMeterV1851`.

### Open decisions / notes
- Verification uses Node smoke harness (shim `window`/`state`) and/or the CDP-in-Chrome
  driver pattern used earlier this session. Clean up all scratch + temp Chrome profile after.
