# Outstanding work / TODO — handoff for a fresh session
> Single consolidated list of everything still open, written so a new chat can start cold.
> Detail for finished work lives in `SESSION_SUMMARY.md` (checkpoints, latest on top).
> Last updated 2026-06-29.

---

## 0. VERIFICATION DEBT (do this first in a fresh session)

**2026-06-29 update:** Family Office / trust-envelop verification is no longer part of this debt. Checkpoint 56
finished the current Family Office request and verified `cdp/family-office.js` 23/23, `cdp/trust.js` 18/18, and
`cdp/trust-holdings.js` 12/12 after rebuilding. Checkpoint 57 finished the mobile Money height and platform emoji
fallback follow-ups, with `cdp/money-mobile.js` 10/10, `cdp/platform-compat.js` 8/8, and `cdp/flicker.js` 18/18.
The Life rebuild probe exists and is green (`cdp/life.js` 19/19 after rebuild). Remaining verification debt below
is for older non-Family-Office modules.
**Checkpoint 59 (2026-06-29):** CP49 trust/death and older Entrepreneurship/core verification are now green on the
current build. Passed: `cdp/death.js` 20/20, `cdp/networth-genetics.js` 9/9, `cdp/trust.js` 18/18,
`cdp/estate-trust.js` 4/4, `cdp/trust-nav.js` 2/2, `cdp/wayback.js` 11/11, `cdp/separation.js` 20/20,
`cdp/features.js` 17/17, `cdp/ipo.js` 17/17, `cdp/dashboard.js` 32/32, `cdp/founderpay.js` 24/24,
`cdp/stock.js` 30/30, and `cdp/entrepreneur-legal.js` 11/11 after syntax checks and rebuild.
**Checkpoint 60 (2026-06-29):** Property/Vehicles verification is now green on the current build. Passed:
`cdp/property.js` 78/78 and `cdp/cars.js` 23/23 after syntax checks and rebuild.
**Checkpoint 61 (2026-06-29):** Patch cleanup audit is current. `pages/patches/` is empty, `play.html` has no active
`pages/patches` script tags, and `docs/build-report.json` has no patch script entries. Added `cdp/no-patches.js` as
a future browser guard.
**Checkpoint 62 (2026-06-29):** The no-patches browser guard and CP26 property fold-in are now green. Passed:
`cdp/no-patches.js` 2/2 and `cdp/property.js` 80/80 after `node --check` and rebuild. The legacy `buyRental`
compatibility path now writes to the current Real Estate portfolio instead of `state.rentals`, and the Home/Real Estate
page no longer computes or exposes the old rental catalog UI.
**Checkpoint 64 (2026-06-29):** Life polish and the requested Entrepreneurship backlog are now green. Passed:
`cdp/life.js` 22/22, `cdp/entrepreneur-backlog.js` 13/13, `cdp/stock.js` 30/30, `cdp/dashboard.js` 32/32, and
`cdp/no-patches.js` 2/2 after syntax checks and rebuild. The exact "Sell button doesn't sell" screen/button was
not provided, but the likely regular-stock custom sell and public-founder own-share custom sell paths are now covered.
**Checkpoint 65 (2026-06-29):** Corrected the CP64 live-trading placement. Live trading now lives in Investments and
ticks real `state.finance.stocksV18.prices` every second while the hub is open; Entrepreneurship no longer shows a
Trading tab. Also added a death safety wrapper and open-hub death regression. Passed `cdp/entrepreneur-backlog.js`
13/13, `cdp/death.js` 22/22, `cdp/stock.js` 30/30, `cdp/dashboard.js` 32/32, and `cdp/no-patches.js` 2/2.
**Checkpoint 66 (2026-06-29):** Hardened the Investments live-button crash path by moving live market ownership into
the base v18 stock runtime and deleting the duplicate wrapper live ticker from `pages/systems/stocks-investing.js`.
Syntax checks and rebuild passed. In-app browser smoke opened Investments, started live mode, bought `$1K` AAPL while
prices ticked, and stopped live mode with no console errors. Standalone CDP did not expose a debug port after this
cleanup, so rerun `cdp/entrepreneur-backlog.js`, `cdp/stock.js`, `cdp/death.js`, and `cdp/no-patches.js` when CDP is
available.
**Checkpoint 67 (2026-06-29):** Fixed the visible Investments flow for saves with `Investment Cash $0`. Real Stocks
now has `Fund $10K`, `Fund $100K`, and `Fund Max` buttons that move checking cash into Investment Cash, plus a clear
live status strip under the action row. `play.html` runtime/Investments cache stamps were bumped to
`20260629-livefund1`. Syntax checks and rebuild passed; in-app browser smoke verified funding, buying `$1K` AAPL,
starting live ticks, visible status, and stopping live mode.
**Checkpoint 68 (2026-06-29):** Real Stocks now defaults live mode on, renders candlestick mini charts and pattern
labels per stock, and includes `Buy Max` so a player can put all current Investment Cash into one stock. Cache stamps
were bumped to `20260629-livecandle1`; syntax checks and rebuild passed; in-app browser smoke verified live default
on, 15 candle charts, 15 `Buy Max` buttons, and AAPL `Buy Max` while ticks continued.
Historical note only: the sandbox/Node warning below was from an older session and is retired by CP62. Current
status: the old verification-debt checklist is paid down; start new sessions from fresh user repros or the backlog.
The sandbox/Node was **down the entire last session**, so NONE of the recent JS was `node --check`'d or
rebuilt into `dist/`. The game runs live from `play.html` (source), but the built files are stale.
**Retired historical checklist (do not treat as current):**
2026-06-29 note: Life rebuild verification is paid down. `pages/systems/life-wellbeing.js`,
`pages/systems/life-rebuild.js`, `pages/systems/life-command.js`, and `cdp/life.js` passed `node --check`; the
bundle rebuilt; `cdp/life.js` passed 19/19.
1. `node --check` every file touched recently:
   - `pages/systems/entrepreneur.js`  (huge changes — see §A)
   - `pages/runtime/00-core-app-runtime.js`  (cents formatter `priceText18` + `stockCard18`)
   - `pages/systems/life-wellbeing.js`  (NEW module)
   - `pages/systems/life-rebuild.js`  (NEW module — heavily extended through CP49; cache-stamp now `liferebuild12`)
   - `pages/systems/tax-legal.js`  (CP49 — trust protection fix in `protectedAssets()`)
   - `pages/systems/finance-ledger.js`  (CP49 — Finance trust-tile display match)
   - `cdp/no-patches.js`  (retired patch-script guard)
   - `styles/ledger-ui.css`  (nav-dock + budget button grid — CSS, no node check)
2. Rebuild the bundle: `node build/build-ledger18.js`  (regenerates `dist/` from current source).
3. Run the remaining CDP probes (`cdp/driver.js` + `cdp/*.js`) to smoke-test older debt. `cdp/no-patches.js` is
   present with static checks clean but still needs a browser run when CDP is available. `cdp/life.js`,
   `cdp/death.js`, `cdp/networth-genetics.js`, the main Entrepreneurship/core probes, `cdp/property.js`, and
   `cdp/cars.js` are present and green; remaining debt should move to fresh user repros or lower-priority cleanup.
Cache-stamps currently in `play.html` (bump again after any further edit): `entrepreneur.js?v=…-bizdeck13`,
`00-core-app-runtime.js?v=…-cents`, `life-wellbeing.js?v=…-wb3`, `ledger-ui.css?v=…-navdock5`,
`life-rebuild.js?v=…-liferebuild12`, `tax-legal.js?v=…-trustprotect1`, `finance-ledger.js?v=…-trustprotect1`.
Note: the 4 `dist/*.html` files got the nav-dock CSS patched in by hand but are otherwise STALE (missing all the
entrepreneurship + wellbeing work). A clean rebuild fixes that.
Mobile Money height note from user (2026-06-28, corrected) - SHIPPED CP57: The Money page used the wrong mobile
height and could extend under browser chrome/bottom UI. Fixed in `pages/systems/money-banking.js` with dynamic
viewport height, safe-area-aware bottom padding, and internal Money-body scrolling. Verified by `cdp/money-mobile.js`
10/10 after rebuild.
Emoji/platform QA note from user (2026-06-28) - SHIPPED CP57: Added `pages/systems/platform-compat.js` to detect
iOS/Android/desktop, check emoji rendering, and swap key emoji icons to readable symbol text when needed. Verified by
`cdp/platform-compat.js` 8/8 after rebuild.

---

## 1. BIG: Rebuild the Life page (top to bottom) — ✅ SHIPPED + VERIFIED (CP48/CP50, re-run 2026-06-29)

2026-06-29 verification update: this is now verified. `cdp/life.js` covers route rendering, popups, Decompress,
luxury/experience pure sinks, yearly status perk, and overflow smoke. Re-run result: 19/19 after `node --check`
and rebuild.
Done in `pages/systems/life-rebuild.js` (v18.71), wired into `play.html` after `life-wellbeing.js`. Full detail
in `SESSION_SUMMARY.md` **Checkpoint 48**. Popup-driven Life hub + luxury/experiences/status money-sinks, all
reusing the existing action openers. Verification is complete for the current Life rebuild. Original spec kept below
for reference.
Full spec in `SESSION_SUMMARY.md` **Checkpoint 47**. Summary:
- Clean, **popup-driven** Life page (save screen space, more dynamic). Compact status header
  (Health/Stress/Mental/Energy/Happiness/Money) + a tidy grid of popup-category buttons that **reuse the
  existing action openers** in the runtime (`renderActivity()` ~L3751, `doActivity()` ~L2684, "Body & Mind"
  ~L3579, Healthcare/Self-Care/Exercise submenus) — do NOT rewrite the actions.
- **Stress relief stays cheap + one-click + repeatable** (small fixed cost, not a money sink). Put real
  **money-sinks in OTHER life areas** (luxury / status / experiences) — for mid-tier+ players stress is
  trivially affordable, so "where do I spend?" must become the interesting decision.
- Build as a NEW module that wraps `renderHubContent` (load AFTER `life-command.js` so it's outermost) and
  RETURNS a fresh layout for ids `lifehub`/`life`/`stack`/`life-stack`.
- `pages/systems/life-wellbeing.js` already has the backend (yearly stress rebalance via
  `applyWellbeingYearV1870`) + a reusable `renderWellbeingPanelV1870()` (its always-on injection is disabled).
  Reuse/fold these into the rebuild.

---

## 2. Trust: Repair-Carry "never recovers" / balance persistence  (task #20 — ROOT CAUSE FOUND + FIX SHIPPED, VERIFY)

**2026-06-29 update:** The trust regressions tied to the current Family Office path are now green:
`cdp/trust.js` 18/18, `cdp/trust-holdings.js` 12/12, and `cdp/family-office.js` 23/23. Keep this section as
historical context for the original repair/carry bug and only reopen it if the user can reproduce a fresh
repair/carry failure on the current build.
**Update CP49 (2026-06-27):** root cause found + fix applied (untested). The titled business was left OUT of the
estate-tax shield (`protectedAssets()` / `legalProtectedValue` omitted `trustBusinessCarryValueV1846`), so it got
taxed + probated on death every succession. Fixed in `tax-legal.js protectedAssets()` (+ a Finance-page display
match in `finance-ledger.js`). Both are display + death-tax-calc only, capped at gross (no net-worth change, no
phantom cash). **Verified 2026-06-29:** `cdp/death.js`, `cdp/trust.js`, `cdp/networth-genetics.js`,
`cdp/estate-trust.js`, and `cdp/trust-nav.js` are green on the current build. Full detail in `SESSION_SUMMARY.md`
CP49 and CP59.
**Also check (related paths, NOT changed in CP49 — keep as future audit notes, not current blockers):**
- `personalInheritanceCashV1846` (the continue-as-heir CASH path) uses a protection % (`trustProt`), not
  `protectedAssets()` — confirm it handles the titled business consistently so there isn't a second leak there.
- `08-patch-v18-31.js estateSettlement` still computes `businessTrustValue` (~L204) but never uses it now that
  protection flows through `protectedAssets()` — dead var; remove or route through it for clarity.
- Re-verify `repairLegacyCarryV1847` after the fix — with the leak closed it should now correctly report
  "already as large as the best recoverable source" instead of perpetually finding a bigger backup.
User has ~$500B titled into the family trust (business is 100% in trust for tax benefit). The bug: repair/carry
balance appears lost / "never recovers" across years/succession. Treated as HIGH-RISK (do not blind-fix — could
wipe/duplicate the trust). Visibility was improved (CP41: "Under trust (total)" display). The deeper persistence
fix needs a tested environment. Key code in `pages/systems/tax-legal.js`: `trustCarryValueV1846`,
`applyLegacyCarryV1846` (~L769), `continueAsHeirV1846` (~L896, calls applyLegacyCarry ~L973),
`repairLegacyCarryV1847` (~L1051), `resolveFamilyTrustYearV1839`.

---

## 3. Trust envelop: title Property + Entrepreneurship portfolios into the trust  (task #22 - SHIPPED + VERIFIED CP63)

**2026-06-29 update:** Re-verified in CP63. The current Family Office/trust-envelop path is implemented and verified
for titled property, per-company founder-company titling, net-worth-neutral protection, succession carry, operator carry, and operator
salary/fee negotiation. Passed `cdp/trust-holdings.js` 12/12 and `cdp/family-office.js` 23/23. Keep future work here
only for new trust asset categories or fresh repro bugs.
Historical design is in `dev-notes/TRUST_ENVELOP_PLAN.md`. The shipped version follows the no-double-count rule:
property and entrepreneurship holdings are trust-protected WITHOUT re-adding them to net worth.
CP63 verifies net worth unchanged on titling, protected assets increasing, and heir carry across death.

---

## 4. Entrepreneurship: Legal tab + tax attorney  (task #36 - SHIPPED + VERIFIED CP63)

Implemented in `pages/systems/entrepreneur.js` and re-verified 2026-06-29. The Legal tab lets a founder company
retain tax counsel, pays upfront and annual legal fees from company cash, lowers the effective corporate tax rate,
and records yearly tax savings. Passed `cdp/entrepreneur-legal.js` 11/11 in CP63.

**Entrepreneurship backlog (from CP14 / CURRENT_STATE) - SHIPPED + VERIFIED CP64, corrected CP65:**
- **Live/day-trading desk** - corrected home is Investments, not Entrepreneurship. The Investments live tape now
  ticks real stock prices and owned stock values while the hub is open.
- **Team hiring** - existing interview + hire role-based staff flow confirmed and covered.
- **Shared chart module** - added `pages/systems/charts.js`; used by Stocks + Entrepreneurship.
- **"Sell button doesn't sell" repro** - exact screen/button still unknown, but regular-stock custom sell and
  public-founder own-share custom sell now have CDP coverage in `cdp/entrepreneur-backlog.js`.

**Investments 2.0 redesign - BACKLOG (requested 2026-06-29):**
- Rework Investments around a first-screen Asset Summary instead of the current long stacked page.
- Split sections into clearer areas: Live Trading / Real Stocks, Investment Cash transfers, Outside Managers, Personal Firm, Fund Investor Economics, and history.
- Expand the live stock experience beyond CP68 mini candles: larger chart view, ticker tape, stronger candle pattern readouts, clearer risk/position sizing, and better mobile scanning.
- Keep CP68 behavior as the current bridge: live defaults on, cards show candle charts/patterns, and `Buy Max` can put all Investment Cash into a single stock.

---

## 5. dist rebuild + property/vehicles CDP probe  (task #6 — VERIFIED CP60)

Verified 2026-06-29. `node build/build-ledger18.js` succeeded, `cdp/property.js` passed 78/78, and `cdp/cars.js`
passed 23/23 after syntax checks. Keep this section only as historical context; new work belongs in fresh repros or
the CP26 legacy fold-in item below.

---

## 6. Property: fold legacy `homes` / `rentals` into the property system  (CP26 #4 - SHIPPED + VERIFIED CP62)

Verified 2026-06-29. The legacy catalogs remain only for save compatibility / migration, but rental purchases now
land in `finance.reV1863.portfolio` and leave `state.rentals` empty. `renderHome()` no longer computes or exposes
the old rental catalog UI. `cdp/property.js` covers the compatibility path and passed 80/80 after rebuild.

---

## 7. Life-page leftovers (from the CP48-49 session) - SHIPPED + VERIFIED CP64

- **Card-ify the activity popups** - Body & Mind / Fun / Side Money now use `.life71-lux-card` activity cards.
- **More economy / balance tuning** - luxury/experience pricing and Status thresholds were tuned upward.
- Verified by `cdp/life.js` 22/22 after syntax checks and rebuild.

---

## P. PARKED IDEAS (captured, NOT scheduled — don't build without the user re-greenlighting)

### Outside-capital venture / fund firm — "a better version of the Personal Firm"

User's early idea (was never written down — capturing it here so it isn't lost). Today the **Personal Firm**
investment office (`state.finance.personalFirm` / managed capital + trainable Advisor/Analyst/Risk staff, grows
~Super Saver APY + staff edge, screenshot ~$11.1B managed @ 7.7%) only compounds **your own** money. The idea:
let it run on **outside capital** — i.e. a real fund / venture firm:
- raise money from outside investors / LPs,
- deploy it into investments (ventures, stocks, deals),
- earn **management + performance fees** on other people's capital (the real-world fund model),
- effectively an expanded, "better version" of the current Personal Firm.
**Status: PARKED by the user (2026-06-27).** Rationale (theirs): it's a large build that depends on several
systems that aren't developed yet, so it's "not worth the risk right now." Revisit only when those foundations
exist and the user explicitly asks. Natural home: extend `personalFirm` (stocks-investing.js) rather than a new
parallel system; would also tie into Entrepreneurship (raising) and the Family Office (titling the fund to trust).

---

## A. What the last session shipped (so a fresh session knows current state)

All in `pages/systems/entrepreneur.js` unless noted. Details in `SESSION_SUMMARY.md` CP43–47.
- **Team:** Train (3×/yr, +2% skill), Give-raise + Recognize retention (capped 2/yr), live leave-risk %, tidy
  button grid.
- **Budget tab (NEW):** full revenue→profit→payout **waterfall** + pie chart, per-industry expenses (servers/
  cloud by `INFRA_RATE_V1869`, office $12K/head, scaling tools, **21% corporate tax**), cost-of-goods line.
- **Product tab overhaul:** roadmap (concept→mvp→beta→live→**v2/Scale**), 6 health tiles, competitive
  landscape with **acquire-competitor** (company cash) + **dynamic rivals** that re-enter open share,
  Ship-a-feature (category-specific via `FEATURE_TYPE_V1869`), Cleanup sprint, Polish, activity log.
- **Market share = ONE consistent number** (revenue/marketSize, grows-only so acquisitions persist; stored in
  history; Scale chart reads it).
- **Founder pay:** profit-distribution % now adjustable in Funding (`bizSetDistRateV1869`, default 40%).
- **Stage cohesion:** product roadmap reaches v2/Scale at scale/mature; Overview ladder derives from `biz.stage`.
- **Stocks show cents** (`priceText18` in runtime + `priceTextV1862` in entrepreneur.js).
- **Life:** `life-wellbeing.js` backend stress rebalance (panel disabled pending the §1 rebuild).
- **Nav/CSS** (`styles/ledger-ui.css`): hub docked to bottom on all sizes (v16-hub/v11-tabbed/v9 sheets
  100dvh + flex-end), nav buttons centered, budget button grid.
- **GitHub prep:** scrubbed all personal paths (`jgodj`, `C:\Users\…`) from 8 docs → portable `node`; added
  `.gitignore`.

---

