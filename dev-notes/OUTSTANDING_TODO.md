# Outstanding work / TODO — handoff for a fresh session

> Single consolidated list of everything still open, written so a new chat can start cold.
> Detail for finished work lives in `SESSION_SUMMARY.md` (checkpoints, latest on top).
> Last updated 2026-06-28.

---

## 0. VERIFICATION DEBT (do this first in a fresh session)

The sandbox/Node was **down the entire last session**, so NONE of the recent JS was `node --check`'d or
rebuilt into `dist/`. The game runs live from `play.html` (source), but the built files are stale.

**Do first:**
1. `node --check` every file touched recently:
   - `pages/systems/entrepreneur.js`  (huge changes — see §A)
   - `pages/runtime/00-core-app-runtime.js`  (cents formatter `priceText18` + `stockCard18`)
   - `pages/systems/life-wellbeing.js`  (NEW module)
   - `pages/systems/life-rebuild.js`  (NEW module — heavily extended through CP49; cache-stamp now `liferebuild12`)
   - `pages/systems/tax-legal.js`  (CP49 — trust protection fix in `protectedAssets()`)
   - `pages/systems/finance-ledger.js`  (CP49 — Finance trust-tile display match)
   - `pages/patches/15-patch-v18-33-6.js`  (reverted a mobile nav rule)
   - `styles/ledger-ui.css`  (nav-dock + budget button grid — CSS, no node check)
2. Rebuild the bundle: `node build/build-ledger18.js`  (regenerates `dist/` from current source).
3. Run the CDP probes (`cdp/driver.js` + `cdp/*.js`) to smoke-test — add a new `cdp/life.js` for the Life page, and
   run `cdp/death.js` / `cdp/trust.js` / `cdp/networth-genetics.js` for the CP49 trust fix (assert net worth is
   UNCHANGED on titling, heir keeps the titled-business value across death).

Cache-stamps currently in `play.html` (bump again after any further edit): `entrepreneur.js?v=…-bizdeck13`,
`00-core-app-runtime.js?v=…-cents`, `life-wellbeing.js?v=…-wb3`, `ledger-ui.css?v=…-navdock5`,
`life-rebuild.js?v=…-liferebuild12`, `tax-legal.js?v=…-trustprotect1`, `finance-ledger.js?v=…-trustprotect1`.

Note: the 4 `dist/*.html` files got the nav-dock CSS patched in by hand but are otherwise STALE (missing all the
entrepreneurship + wellbeing work). A clean rebuild fixes that.

Mobile QA note from user (2026-06-28): On the GitHub-hosted/mobile build, the Finance page is the only checked hub
that appears to use the wrong vertical height. Its content can extend down under the browser chrome/bottom area,
making the page hard to play; Money and the other checked pages did not show the same issue. Hosted site may be one
or two versions behind current source, so verify against latest `play.html`/rebuilt `dist` first. Likely affected
file: `pages/systems/finance-ledger.js` (and possibly hub-sheet/mobile CSS if the issue reproduces).

---

## 1. BIG: Rebuild the Life page (top to bottom) — ✅ SHIPPED (CP48), verification pending

Done in `pages/systems/life-rebuild.js` (v18.71), wired into `play.html` after `life-wellbeing.js`. Full detail
in `SESSION_SUMMARY.md` **Checkpoint 48**. Popup-driven Life hub + luxury/experiences/status money-sinks, all
reusing the existing action openers. **Still owed:** in-browser QA + `node --check` + `dist` rebuild + a
`cdp/life.js` probe (sandbox was down — see §0). Original spec kept below for reference.

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

**Update CP49 (2026-06-27):** root cause found + fix applied (untested). The titled business was left OUT of the
estate-tax shield (`protectedAssets()` / `legalProtectedValue` omitted `trustBusinessCarryValueV1846`), so it got
taxed + probated on death every succession. Fixed in `tax-legal.js protectedAssets()` (+ a Finance-page display
match in `finance-ledger.js`). Both are display + death-tax-calc only, capped at gross (no net-worth change, no
phantom cash). **Still owed:** verify on the tested side (`cdp/death.js`, `cdp/trust.js`, `cdp/networth-genetics.js`)
— title a business to trust, assert net worth unchanged + protection up, die, confirm heir keeps the value and it
persists next year. Full detail in `SESSION_SUMMARY.md` CP49.

**Also check (related paths, NOT changed in CP49 — verify on the tested side):**
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

## 3. Trust envelop: title Property + Entrepreneurship portfolios into the trust  (task #22 — NOW UNBLOCKED, verify #2 first)

Full design in `dev-notes/TRUST_ENVELOP_PLAN.md`. Mark property + entrepreneurship portfolios as
trust-protected WITHOUT re-adding them to net worth (avoid double-count). **#2's protection fix shipped in CP49**,
so this is no longer hard-blocked — but verify #2 on the tested side (net worth unchanged on titling, heir keeps
value across death) BEFORE pouring property + venture value in, so it's built on a foundation that holds value.
Mirror the business-titling pattern (`setBusinessTrustPercentV1840`); extend `protectedAssets()` (which now
already includes titled businesses), the death settlement, and `applyLegacyCarryV1846` — never the net-worth total.

---

## 4. Entrepreneurship: Legal tab + tax attorney  (task #36 — FUTURE)

Add a **Legal** tab to the entrepreneurship hub with a **tax-attorney** hire that legally lowers the company's
**corporate tax** (deductions / structuring). Corporate tax is now a real 21% line in the budget engine
(`entrepreneur.js`, see §A), so the attorney would reduce the effective rate.

**Entrepreneurship backlog (from CP14 / CURRENT_STATE — requested, not yet built):**
- **Day-trading desk** — live/short-term trading of select stocks (the natural home for a real candlestick chart).
- **Team hiring** — interview + hire role-based staff (mirror the tenant-screening pattern) in `entrepreneur.js`.
- **Shared chart module** — extract the SVG charts into a reusable `charts.js` used by Stocks + Entrepreneurship.
- **"Sell button doesn't sell" repro** — Sell All works in `cdp/stock.js`; needs the exact screen/button from the
  user to reproduce.

---

## 5. dist rebuild + property CDP probe  (task #6 — was blocked by sandbox)

Covered by §0. Run the property probe (`cdp/property.js`) after rebuild.

---

## 6. Property: fold legacy `homes` / `rentals` into the property system  (CP26 #4)

`pages/systems/property-estate.js` is the real property system, but the legacy `homes` / `rentals` catalogs in
the runtime still exist in parallel. Fully fold them into the property system so there's one source of truth — no
duplicate living-situation / rental UIs, no double-counted equity.

---

## 7. Life-page leftovers (from the CP48–49 session)

- **Card-ify the activity popups** — Body & Mind / Fun / Side Money popups still use plain `.row` lists; give them
  the same horizontal `.life71-lux-card` treatment as Luxury / Experiences so all the Life popups match.
- **More economy / balance tuning** — luxury/experience pricing + Status thresholds (`statusLabel` /
  `statusYearlyPerk` in `life-rebuild.js`) are a first pass; tune if it feels off in play.

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
