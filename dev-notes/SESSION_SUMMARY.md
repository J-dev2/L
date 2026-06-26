# Session Summary — running dev notes

> Single running doc, rewritten at each ~5-prompt checkpoint. Latest state on top.
> Purpose: "where did we leave off" at a glance.

---

## Checkpoint 43 - 2026-06-26 (Claude)

### Team: train + retention (culture) — `entrepreneur.js`
Per user: every roster employee now has action buttons (not just high-risk ones):
- **Train N/3** — up to 3×/game-year, costs ~8% of salary, raises performance ~5–9, nudges leave-risk down.
  Counter auto-resets each year (`e.trainV1868 = {year, count}` keyed on `age()`).
- **Give raise** — +15% salary, leave-risk −0.10, culture-fit +5.
- **Recognize** — perk/appreciation, costs ~5% salary, leave-risk −0.07, culture-fit +8, company culture +2.
  Shown for ALL employees now (user wants it as a company-wide "people feel appreciated" lever).
- Roster card shows live **leave-risk %** (warn colour ≥18%, good colour below). Stacking raise/recognize
  drives risk toward the ~1% floor (`Math.max(0.01, …)`), so nobody you invest in quits.
- New globals: `bizTrainEmployeeV1868`, `bizRetainEmployeeV1868(id, 'raise'|'perk')`. Helpers verified in scope
  (`age` L25, `actionBtn` L562 — bakes in preventDefault/stopPropagation, `clamp01` L1245).

### Nav bar floats mid-screen → docked to bottom — `styles/ledger-ui.css`
Root cause: `.hub-overlay.v16-hub` centered the sheet (`align-items:center`, L4155) while the sheet height is
adaptive (`--ledger-hub-height`). When the sheet is shorter than the viewport (or the height var is unset and
it collapses to content), the whole sheet — including its bottom-pinned nav strip — floats mid-screen, and
shifts as you navigate. The v16 nav is already `flex:0 0 auto` at the sheet bottom (L4228); the sheet is a flex
column — the bug was purely the vertical centering.
Fix: `.hub-overlay.v16-hub { align-items: flex-end; padding: 7px 7px 0 }` — docks the sheet (and its nav) to
the bottom on **every** screen size, desktop included. This restores the ORIGINAL base behaviour (base
`.hub-overlay` L783 was already `align-items:flex-end` bottom-sheet style; the v16 redesign broke it). Keeps
width/height controls working; stops the position jumping. Reverted the earlier mobile-only `position:fixed`
nav rule from `15-patch-v18-33-6.js` (no longer needed).

**User runs SOURCE (`play.html` / root `index.html`), NOT `dist/`.** Confirmed: the dist builds lack the CP42
interview/hire UI ("INTERVIEW FOR A ROLE" absent) yet the user sees it → they load the source modules. The nav
fix didn't appear for them because the browser cached `ledger-ui.css`. Mitigations applied:
- Version-stamped the stylesheet links in `play.html` + root `index.html` (`?v=20260626-navdock`) so a normal
  reload pulls fresh CSS (no manual hard-refresh needed).
- Also applied the same `align-items:flex-end` nav-dock fix into all 4 stale `dist/*.html` builds (index,
  built, play_built, landing_built) at L4163 so any build copy is consistent — though those builds are old
  (pre-CP42) and aren't what the user actually plays.
- Specificity verified: `.hub-overlay.v16-hub` (0,2,0,!important) beats `themes/ledger-dark.css`'s
  `.hub-overlay{align-items:stretch!important}` (0,1,0), so the dock wins regardless of file order.
- **CORRECTION (next round, via user-pasted DOM):** the More/standard hubs render with
  `.hub-overlay.v11-tabbed-hub` + a plain `v11-hub-tab-strip` nav (no v18335/v18336 modifier; `setTabV16`
  handlers) — NOT `v16-hub`. So the v16-only fix missed them. Docked the two remaining centered overlay
  variants too: `.hub-overlay.v11-tabbed-hub` (L3363) and `.hub-overlay.v9-scroll-stable-hub` (L2827) → both
  `align-items: flex-end`. Map: v16-hub = business/law/money/entrepreneurship; v11-tabbed-hub =
  More/life/people/career/finance; v8-adaptive already `stretch` (ok); v5/v7-fixed-hub are dead (superseded).
  Bumped CSS cache-stamp `navdock`→`navdock2`. (dist builds left as-is — user runs source; rebuild will sync.)

Changed: `pages/systems/entrepreneur.js`, `styles/ledger-ui.css`, `pages/patches/15-patch-v18-33-6.js`,
`play.html`, `index.html`, and the 4 `dist/*.html` (nav rule only).
**Tests NOT run (sandbox: no disk).** DO NEXT (Codex/tested): `node --check` the two JS files, rebuild dist
(regenerates the builds with ALL current source incl. train/retention), eyeball the hub nav docked at the
bottom on desktop + phone.

---

## Checkpoint 42 - 2026-06-22 (Claude)

### Entrepreneurship: interview + hire (role-based team) — `entrepreneur.js`
Per user (#17): replaced the one-click "Hire" on the Team panel with a dynamic interview flow.
- The recruit rail's role cards now show **Interview** (not Hire). Clicking opens that role's **candidate
  pool** (2–3 candidates, stable within a game year, stored on `biz._candidatesV1868`).
- Each candidate has a **trait** (`HIRE_TRAITS_V1868`: 10x Performer 🚀 / Culture Champion 🤝 / Rising Star ⭐ /
  Mercenary 💸 / Steady Hand 🧱 / Diamond in the Rough 💎) that sets performance / culture / flight-risk /
  salary-ask ranges. Skill + references are **hidden until you pay to check**: Interview $1K reveals the
  performance score, Refs $2.5K reveals culture + flight risk. Then **Hire** or **Pass**.
- Hired candidates become real employees carrying the candidate's performance/cultureFit/leaveRisk (feeds the
  existing yearly attrition/culture mechanics), so WHO you pick matters, not just the role.
- New globals: `bizOpenHiringV1868` / `bizCloseHiringV1868` / `bizInterviewCandidateV1868` /
  `bizHireCandidateV1868` / `bizRejectCandidateV1868`. Old `bizHireV1861` kept for back-compat.

Changed file: `pages/systems/entrepreneur.js` only. Save-safe (candidate/hiring state lazy on `biz`; existing
saves unaffected). **Tests NOT run here (sandbox down).** DO NEXT (Codex/tested): rebuild + entrepreneurship
probes; confirm the interview-reveal + hire wiring.

---

## Checkpoint 41 - 2026-06-22 (Claude)

### Trust "money looks lost" — SAFE visibility fix (titled wealth now shown)
User: "go fix that bug" — the trust shows empty when they actually hold ~$500B, and they keep hitting Repair
Carry. Read the carry code (`trustCarryValueV1846`, `trustBusinessCarryValueV1846`, `applyLegacyCarryV1846`,
`continueAsHeirV1846`). **Root of the "seems like no money" symptom**: when you title a business to the trust
(`familyV1833.trustPercent`), that value is **protected by** the trust but stays counted as the business — the
trust panel only displayed `corpus` (the funded cash sleeve), so huge titled wealth looked like "nothing in
the trust".
- **Fix (DISPLAY-ONLY, zero carry/net-worth math change, no data-loss risk)**: `familyFundDesk` now shows
  **Under trust (total)** = `corpus + trustBusinessCarryValueV1846(state)` (titled businesses) + child trusts +
  estate trust cash, plus a **Titled businesses** breakdown line. The player now sees their full protected
  wealth without pressing Repair Carry.
- This addresses the PRIMARY complaint (visibility). The deeper Repair-Carry **persistence** question (whether
  corpus value actually resets across years/succession vs just titled-biz-not-shown) is unverified here and
  still flagged for the tested side — I did NOT touch `applyLegacyCarry`/`continueAsHeir` (can't test
  inheritance; that's where the real data-loss risk lives). See task #20.

Changed file: `pages/systems/tax-legal.js` (`familyFundDesk` display only). Tests NOT run here (sandbox down);
live in-game from source.

---

## Checkpoint 40 - 2026-06-22 (Claude)

### Real Estate: Perfect Refurbish + Property Manager (`property-estate.js`, on top of Codex's v18.68)
Per user.
- **Perfect Refurbish** (`reFullRestoreV1868`): the individual renovations are ONE-TIME each, so a decayed
  property had no way to recover its condition (user: "won't let me refurbish from details"). Added a
  **repeatable, instant** restore to 100/100 condition for **2–5% of value** (scaled by the condition
  deficit) + a small refresh value bump. Surfaced two ways: at the top of the renovation popup, AND as a
  one-click **✨ Quick reno $X** button directly on each portfolio card (no popup, no manager needed).
- **Property Manager** (`reHireManagerV1868`, state `re.managerV1868`): hire for **~0.3%/yr of portfolio
  value**; the yearly tick then, per rented property, **fully services condition** (when <85, restore to
  ~90 — even a wrecked unit gets fixed, not just nudged; cost scales with how run-down it was),
  **evicts non-paying / low-reliability tenants (<55) and places a vetted replacement** (reliability +18,
  clean record), and keeps units leased. Fee deducted from yearly RE cash flow. Toggle band above the
  portfolio cards.

### Requested next (FUTURE, sequenced): trust envelops everything
User wants the family trust to also hold the **property portfolio** and **entrepreneurship portfolio**
(like business titling), as a holdings/collection foundation. **Deliberately NOT built yet**: it's the same
trust/net-worth/carry area as the Repair-Carry persistence bug (task #20). Pouring property equity + venture
value into a trust that currently *loses* its balance would risk that data-loss on far more value, plus
net-worth double-count (these are already counted via reEquity/bizValue — titling must mark protected, not
re-add). Sequence: fix #20 on the tested side first, then build this with the trust/death probes (task #22,
blocked by #20).

Changed file: `pages/systems/property-estate.js` only. Save-safe (manager state is lazy + guarded; existing
saves are unaffected until you hire). **Tests NOT run here (sandbox down).** DO NEXT (Codex/tested): rebuild
+ `cdp/property.js`; confirm the manager fee/automation and Perfect Refurbish. Still open: the trust
Repair-Carry persistence bug (see CP39 / task #20).

---

## Checkpoint 39 - 2026-06-22 (Claude)

### Family trust: lifetime-earnings visibility (FIXED) + Repair-Carry glitch (DIAGNOSED, needs tested fix)
User: the family trust/fund "never recovers" — has to keep hitting Repair Carry to get money owed — and
can't see how much the trust/fund earned.
- **Visibility (FIXED, `tax-legal.js`)**: the annual trust/fund return DOES auto-apply each year
  (`resolveFamilyTrustYearV1839` is wired into `resolveLifeAndFinanceYear`), but `familyFundDesk` only showed
  *last* return. Added cumulative `trust.totalReturn`/`fund.totalReturn` accumulation + new **Trust corpus**
  and **Total earned** metrics so lifetime earnings are visible. Additive + save-safe (`n()`-guarded).
- **Repair-Carry glitch (NOT fixed — needs reproduction + testing)**: the legacy carry IS auto-applied on
  succession (`continueAsHeirV1846` -> `applyLegacyCarryV1846`, ~L973); `repairLegacyCarryV1847` only re-applies
  when the recoverable source exceeds the current carry. So "keep hitting repair, keep getting money" implies
  the stored carry keeps dropping below the source each year — a persistence/recompute issue in
  `trustCarryValueV1846`/the corpus, or a net-worth/accessibility gap. Sensitive inheritance money logic across
  death/heir flows; Claude-side sandbox can't build or run the trust/death probes, so NOT blind-fixed.
  **RECOMMEND**: fix + verify on the tested (Codex) side with the trust/death probes, or get the exact button
  + on-screen amount from the user to pinpoint.

Tests NOT run here (sandbox down). play.html loads source, so the visibility fix is live in-game.

---

## Checkpoint 38 - 2026-06-22 (Claude)

### Removed the entrepreneurship valuation wall (was hard-capped at $10B)
User report: a high-earning founder company stops gaining value around $10B even while revenue and profit
keep climbing. Cause — two hard caps in `_runBizFinancialEngine` (`pages/systems/entrepreneur.js`):
- **Valuation cap removed**: was `biz.valuation = Math.min(10000000000, gross*revMult + cash*0.5)`. Now
  `Math.max(0, gross*revMult + cashInBusiness*0.5)` with **no upper bound**, so valuation keeps scaling as
  the company earns more (`revMult` is the existing stage x profit x brand multiple, ~1.5–27x).
- **Revenue cap raised** $5B → **$1T** (`gross = Math.min(gross, 1e12)`) — a high safety net, not a balance
  wall; the sales engine's soft saturation still governs realistic year-over-year growth.
- **Added a trillion (T) tier** to `compactMoneyV1861` so $1T+ shows as "$1.2T" not "$1200B".

Changed file: `pages/systems/entrepreneur.js` only. **Tests NOT run** — the Claude-side sandbox is out of disk
space, so I could not `node build/build-ledger18.js` or run the entrepreneurship probes (dashboard/features/
ipo/founderpay/stock). **DO NEXT (Codex/local):** rebuild dist + run those probes to confirm valuation scales
and nothing NaNs. play.html loads source directly, so the fix is already live in-game.

---

## Checkpoint 37 - 2026-06-22

### Tenant emoji/personality badges + Vehicles expansion
Per user: make Real Estate tenant dashboards feel more human, then make Cars into the broader
Vehicles section before worrying about GitHub deployment.
- **Tenants now carry gender/persona badges**: generated tenants store male/female metadata, tenant
  overlays show emoji + gender + pronouns, portfolio cards show a compact gender/persona badge, and
  the visit button includes the same human-readable badge.
- **Vehicles now covers road / marine / aircraft** while keeping old `car*V1867` globals for save/CDP
  compatibility. The market gained boats, yachts, planes, helicopters, and jets.
- **Garage language broadened**: collection header, market, stats, and Finance rows now say Vehicles,
  with visible Garage / Marina / Hangar counts and "Signature vehicle" replacing the old daily-driver
  language.

Changed files: `pages/systems/property-estate.js`, `pages/systems/car-collection.js`,
`pages/systems/finance-ledger.js`, `pages/runtime/00-core-app-runtime.js`, `cdp/property.js`,
`cdp/cars.js`, `dev-notes/SESSION_SUMMARY.md`; rebuilt `dist/` / `docs/build-report.json`.

**Tests RUN:** `node --check pages/systems/property-estate.js`; `node --check pages/systems/car-collection.js`;
`node --check cdp/property.js`; `node --check cdp/cars.js`; `node --check pages/systems/finance-ledger.js`;
`node --check pages/runtime/00-core-app-runtime.js`; `cdp/property.js` 78/78; `cdp/cars.js` 23/23;
`node build/build-ledger18.js`.

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

## Checkpoint 36 - 2026-06-22

### Real Estate deal labels clarified
Per user screenshots: the rare/epic deal system existed in data, but the UI made it look like ordinary
property class text or a tiny "Market" stat. Fixed the visible language:
- Market section now reads as a **Deal board** with "N property deals this year" and visible counts for
  open / rare / epic deals.
- Cards now show a prominent top badge: **Open deal**, **Rare deal**, **Epic deal**, **Off-market deal**,
  or **Auction deal**. The small stat row now describes why the tier matters instead of showing a vague
  "Market" chip.
- Listing detail popup uses the same deal badge language so the modal matches the card.

Changed files: `pages/systems/property-estate.js`, `cdp/property.js`, `dev-notes/SESSION_SUMMARY.md`;
rebuilt `dist/` / `docs/build-report.json`.

**Tests RUN:** `node --check pages/systems/property-estate.js`; `node --check cdp/property.js`;
`cdp/property.js` 77/77; `node build/build-ledger18.js`.

---

## Checkpoint 35 - 2026-06-22

### Real Estate modal/detail + flip sale pricing pass (`property-estate.js` -> v18.68)
Per user: reduce visual clutter in Real Estate by using pop-up menus, shrink the market supply to 20,
make cards larger/readable, and make flip sales show real buy/sell math.
- **Listing details are now a popup**: `reOpenListingV1863` still works, but `renderDetail` now renders a
  `.re1863-overlay` modal instead of inserting another inline section under the market. Cash/mortgage
  buy buttons remain inside the popup.
- **Market supply is now curated to 20 listings** (`MARKET_LISTING_LIMIT = 20`): every yearly market gets
  a guaranteed rarity mix of at least **3 Rare** and **1 Epic** standard listings, with rarity tags visible
  on cards/details. Urgency/off-market listings still sit above the market as separate expiring specials.
- **Three-per-row market cards**: market grids use `re-market-list` with 3 desktop columns, larger cards,
  2 columns on medium screens, and 1 column on mobile.
- **Flip/sale math is visible**: flip cards show bought-for, current value, fair market sale, estimated net
  at ask, and yearly buyer odds. New sale manager popup (`reOpenSaleV1868`) lets you set market/fast/+5/+12/
  moonshot/custom asking prices. Overpricing reduces sale odds through `saleChanceAtAsk`; the yearly tick
  sells listed properties against the ask/market cap. `reSaleQuoteV1868` exposes fair/ask/net/chance for tests.
- **Compatibility kept**: old `reListSaleV1863(uid,pctOver)` now routes into the new ask-price machinery;
  existing buy/renovate/tenant/residence flows are unchanged.

Changed files: `pages/systems/property-estate.js`, `cdp/property.js`, `dev-notes/SESSION_SUMMARY.md`;
rebuilt `dist/` / `docs/build-report.json`.

**Tests RUN:** `node --check pages/systems/property-estate.js`; `node --check cdp/property.js`;
`cdp/property.js` 76/76; build rerun after source changes.

---

## Checkpoint 34 - 2026-06-22

### Real Estate naming + Vehicles split verified
Per user: cars should be their own **Vehicles** page/section, and the old player-facing **Home**
hub/copy should read as **Real Estate**.
- **Vehicles is separate**: `play.html` loads `pages/systems/car-collection.js`; the `vehicles`
  hub routes to `renderGarageV1867`; More routes `vehicle/cars/car/garage` aliases to `vehicles`.
  The legacy Car panel is no longer part of `renderHome()`.
- **Real Estate labels tightened**: hub maps/overlay titles use `home -> "Real Estate"` and
  `vehicles -> "Vehicles"` in the runtime and patch layers. Remaining living-situation buttons now
  say **Choose Real Estate**; portfolio primary-property tag says **Primary residence**; finance
  notes use Real Estate/residence wording instead of "Home equity" / "Home plus rentals".
- **Keep internal names**: route id `home`, functions like `renderHome`, and old compatibility globals
  are intentionally kept so saves and patch overlays do not break.
- **Current Real Estate feature state**: Verdant-style property rebuild is present with credit/mortgage,
  urgency listings, buy strategy, portfolio cards, condition/renovation, yearly cash flow, Finance
  debt/value rows, property class/prestige tiers, tenant screening, tenant relationships, personas,
  flirting/romance/intimacy gates, yearly story moments, persona icons, evict, and residence lifestyle.
- **Current Vehicles feature state**: 100 generic car models across 8 colour-coded classes, cash/finance
  purchase, daily driver lifestyle bonus, condition/repair, loan amortization/paydown, resale/equity,
  legacy migration, and net-worth integration.

Changed files in this cleanup pass: `pages/systems/property-estate.js`,
`pages/systems/finance-ledger.js`, `pages/runtime/00-core-app-runtime.js`,
`dev-notes/SESSION_SUMMARY.md`, plus rebuilt `dist/` / `docs/build-report.json`.

**Tests RUN:** `node --check` for property, cars, finance, runtime, patch 14, patch 15; `cdp/property.js`
71/71; `cdp/cars.js` 20/20; `node build/build-ledger18.js` succeeded after one transient Windows
file-open retry on the generated play bundle.

---

## Checkpoint 34 - 2026-06-22

### Vehicles is its own page (out of Real Estate) + "Home" renamed to "Real Estate" everywhere
Per user.
- **Vehicles is now a separate hub** (`id: "vehicles"`, 🚗), not a section inside the Real Estate hub.
  Wired: `renderHubContent` `case "vehicles" -> renderGarageV1867()`; the garage was **removed from
  `renderHome`** (Real Estate is now Living Situation + property portfolio only); `vehicles:"Vehicles"`
  added to the hub title maps (`titleForHub16` etc.); a **Vehicles route button** added to the More menu
  (directory + quick access) and `vehicles/cars/garage` aliases added to `routeHub`; the hub registered in
  the active nav source `15-patch-v18-33-6.js` (`hubMap18336` + `allHubs18336`) and `14-patch`/`11-patch`
  title/hub maps. Opening it flows 15-patch -> 14-patch -> runtime v16 overlay, using `titleForHub16` for
  the title and `renderHubContent` for the body (the garage).
- **"Home" -> "Real Estate"**: the leftover hub label said "Home" in the active nav/title sources even
  though CP26 renamed the title maps. Fixed in `15-patch` (`hubMap18336`), `14-patch` (`title18335` +
  `fullHubs18335`), `11-patch` (title map), the runtime `getVisibleHubs`/`allHubs186` (12816), and the
  More-menu route buttons (`more-command.js`). (Left "Home" where it means the residence/deed asset, e.g.
  the trust-title toggle in `08-patch`, and "tax home".)

Changed files: `pages/runtime/00-core-app-runtime.js` (vehicles dispatch + title maps + nav label, garage
out of renderHome), `pages/systems/more-command.js` (route buttons + aliases), `pages/patches/15-patch-v18-33-6.js`,
`14-patch-v18-33-5.js`, `11-patch-v18-33-2.js` (hub label/map). No new probe (nav/render wiring; the cars
probe already covers `renderGarageV1867`).

**Tests RUN: none (sandbox out of disk space all session).** Hand-reviewed the wiring chain.
**DO THIS NEXT:** `node build/build-ledger18.js`, then load play.html and confirm: a **Vehicles** page opens
from More and shows the garage; the Real Estate page no longer shows cars; the label reads "Real Estate"
everywhere.

### Future plans / backlog (requested, NOT yet built)
- **Entrepreneurship team hiring (interview + roles)** — per user (future, "not now"): on the
  Entrepreneurship team side, let the player **interview and hire different people for different roles**
  (candidates with varied skill/cost; pick who to bring on), each role doing something distinct to make the
  company more dynamic. Mirror the tenant-screening/persona pattern (candidates -> interview -> accept/reject)
  on top of the existing Team panel + recruit role-cards in `pages/systems/entrepreneur.js`. Tracked as a task.

---

## Checkpoint 33 - 2026-06-22

### Cars -> 100 + emojis + colour; tenant emojis + evict
Per user follow-ups (`pages/systems/car-collection.js` + `pages/systems/property-estate.js`).
- **Car catalog -> exactly 100 models** across **8 colour-coded classes** (added Off-Road 🛻 + Electric ⚡
  to the prior 6). **Generic archetypes only, NO real trademarks** ("Italian Supercar", "American Pony Car",
  "JDM Legend", etc.), each with an **emoji icon**. Stored as compact tuples mapped to objects. Kept the
  tplIds the probe uses (commuter/lux_sedan/muscle/supercar/hypercar/...). Class headers show icon + count.
- **More colour**: dealership grouped by class with a coloured left-accent header; every car AND property
  card now has a **class-coloured left border** (ties colour to class across both systems).
- **Tenant persona emojis** (`PERSONA_ICON`): 🎨 Artist / 💼 Professional / 🎉 Social One / 🏡 Homebody /
  😏 Charmer / 📈 Striver - in the visit popup header + desc and on the card's Visit button. (Emojis are
  placeholders; real icon art is a later pass, per the user.)
- **Evict a tenant** (`reEvictTenantV1866`): a quiet red button in the visit popup removes the current
  tenant (small happiness ding, bigger if you were dating); property goes vacant -> fresh applicants. This
  wasn't possible before.
- Fixed: resale `valueFactor` capped at 1.0 (was 1.05 - let pristine cars resell above value / inflate
  net worth at purchase).

Changed files: `car-collection.js` (100-car catalog, class colours/icons, valueFactor fix), `property-estate.js`
(persona icons, card colour accents, evict), `cdp/cars.js` (+1: 8-class render), `cdp/property.js` (+2:
persona-icon + evict). New global: `reEvictTenantV1866`.

**Tests RUN: none (sandbox out of disk space all session).** Hand-reviewed; the catalog is exactly 100
entries and closes cleanly. **DO THIS NEXT:** `node build/build-ledger18.js`, then `cdp/property.js` (~75)
and `cdp/cars.js` (~24). Risks: unran; 100-car price/stat balance is broad-strokes and untuned.

---

## Checkpoint 32 - 2026-06-22

### Car & garage system (NEW module `pages/systems/car-collection.js`, v18.67)
Per user. A property-style car system replacing the old single-car UI.
- **Catalog** (`CAR_TEMPLATES`): 6 classes (Economy/Standard/Sport/Luxury/Exotic/Classic), 13 models from
  beater -> hypercar + classics.
- **Buy cash or finance** (`carBuyV1867`): finance = credit-gated down payment + auto loan (`LOAN_TIERS`,
  ~5yr amortized).
- **Depreciation/appreciation**: most cars lose value yearly; classics gain (`deprec`; tick
  `carYearlyTickV1867`). **Condition** decays + paid **repairs** (`carRepairV1867`); condition drives resale
  value (`valueFactor`) and the daily bonus.
- **Garage**: own multiple; **resale value minus loans = equity** counts in net worth (`carEquityV1867`
  added to `legacyNetWorth`). Loans amortize yearly; **pay down/off** (`carPayLoanV1867`); **sell**
  (`carSellV1867`, settles the loan).
- **Daily driver** (`carSetDailyV1867`): grants looks + happiness by tier + condition as a **tracked delta**
  (`dailyBonus`, reverses on switch/sell), refreshed yearly.
- **UI** (`renderGarageV1867`): garage cards + class-grouped dealership; replaces the legacy Car section in
  `renderHome` (falls back if absent). Scroll-preserving `saveRender`.
- **Save-safe migration**: legacy `state.car` moved into the garage once and `state.car` cleared (legacy
  `carsValue` -> 0, no yearly double-upkeep). The runtime tick runs the car tick BEFORE the legacy car-cost line.

Changed/new files: NEW `pages/systems/car-collection.js`; `play.html` (include after property-estate);
`pages/runtime/00-core-app-runtime.js` (car yearly tick; garage replaces Car section in renderHome; car
equity + migration in legacyNetWorth); NEW `cdp/cars.js` (22 checks). New globals: `carBuyV1867`,
`carSellV1867`, `carRepairV1867`, `carPayLoanV1867`, `carSetDailyV1867`, `carYearlyTickV1867`,
`carEnsureV1867`, `carEquityV1867`, `carValueV1867`, `carGarageStatsV1867`, `carDailyV1867`, `renderGarageV1867`.

**Tests RUN: none (sandbox out of disk space all session).** Hand-reviewed. **DO THIS NEXT:**
`node build/build-ledger18.js` (now also bundles `car-collection.js` - confirm play.html's new <script>),
then BOTH probes: `cdp/property.js` (~73) and `cdp/cars.js` (~22). Risks: unran; car prices/depreciation/
upkeep untuned; legacy `cars`/`buyCar`/`sellCar` paths still exist for save-compat - the garage is the live UI.

---

## Checkpoint 31 - 2026-06-22

### Tenant personalities + flavor lines + story moments (`property-estate.js` -> v18.67)
Per user: tenant visits felt flat (just meters + stat nudges). Added character:
- **6 personas** (`PERSONAS`): The Artist / Professional / Social One / Homebody / Charmer / Striver, each
  with a desc + flavor lines for talk / flirt / warm (meal,gift,date) / intimate. Assigned on tenant
  creation (`makeTenant`, applicant accept) and lazily (`ensureTenantRel`).
- **Flavor lines**: `reTenantActV1866` now toasts/logs a persona + action-specific line (`tenantLine(t,
  category)`, {name}-substituted) instead of "Talk with X". Shown in the popup header (label + italic desc).
- **Story moments** (`STORY_EVENTS` + `rollTenantStory`): the yearly tenant event is now a narrative moment
  from a gated pool - dinner invite, thoughtful gift, coffee run-in, rent grace, house party (Social One),
  jealous ex (romantic), weekend away (romantic+chem), meeting their friends - each a one-line story + a
  modest effect (rel/chem/happiness/money/condition). Fires ~30%/yr for any engaged tenant (rel>=25).
  Replaces the old plain "dropped off a gift" nudge.

New globals: `reTenantLineV1867`, `reRollTenantStoryV1867` (test-facing). Changed files:
`pages/systems/property-estate.js`, `cdp/property.js` (+4 checks). 

**Persona mechanics now wired** (`PERSONA_BIAS`, same checkpoint): personas play differently, not just
talk differently - `reliability` (pay), `wear` (yearly damage x), `retention` (lease-renew odds +), `chem`
(chemistry gain x). Homebody renews readily + low wear; Social One pays but wears the place fast;
Professional/Striver reliable + low trouble; Charmer builds chemistry fast; Artist flaky but charming.
Applied in `makeTenant`/accept reliability, the damage roll, renewal odds, and chem gain.

**Tests RUN: none (sandbox out of disk space all session).** Hand-reviewed. **DO THIS NEXT:**
`node build/build-ledger18.js`, then the property probe (now ~73 checks). Risks: unran; story-event
frequency/effects + persona bias values untuned - playtest. Intimacy lines stay abstract.

---

## Checkpoint 30 - 2026-06-22

### Live-in lifestyle: living in an owned home finally does something (`property-estate.js` v18.66 + runtime)
Closes CP26 #1. "Move in" used to only set a label. Now:
- **Lifestyle bonus** by class + condition (`residenceLifestyle`): economy +3 .. prestige +16 happiness,
  +0..+6 looks, x0.5..1.1 by condition. Applied as a **tracked delta** (`fin().residenceBonusV1866` via
  `applyResidenceBonus` -> `window.applyDeltas`) so it can't be farmed by moving in/out and **reverses**
  on move-out/sell. `reSetStrategyV1863('live')` applies it; switching to any non-live strategy or selling
  the primary resets it to 0; `reYearlyTickV1863` refreshes yearly so it tracks condition/renovation.
- **No double charge**: `00-core-app-runtime.js` age-up skips the legacy home `annualCost` when
  `window.rePrimaryResidenceV1866()` returns a property (try-catch; defaults to charging if the helper is
  absent - save-safe). Net worth was already correct (legacy home price vs owned-property equity are
  separate assets; the residence counts once via reEquity).
- **UI**: Living Situation shows "Owned <class> residence - +N happiness, +N looks ... no separate rent";
  the portfolio card residence tag shows "Home - +N happy"; the move-in toast names the happiness gain.

New globals: `rePrimaryResidenceV1866`, `reResidenceLifestyleV1866`. Changed files:
`pages/systems/property-estate.js`, `pages/runtime/00-core-app-runtime.js` (legacy-home cost guard),
`cdp/property.js` (+6 checks). NOTE: legacy `homes` catalog left in place - fully folding it in is CP26 #4
(still open); this just makes the owned residence the one that grants lifestyle + suppresses legacy upkeep.

**Tests RUN: none (sandbox out of disk space all session - couldn't run node/build/probe).** Hand-reviewed.
**DO THIS NEXT:** `node build/build-ledger18.js`, then the property probe (now ~69 checks). Risks: unran;
the runtime guard touches the age-up money path (kept minimal + save-safe); residence happiness/looks
values are untuned - playtest.

---

## Checkpoint 29 - 2026-06-22

### Tenant relationships + romance (`property-estate.js` -> v18.66)
Per user: talk to / interact with tenants, build a relationship that keeps them longer, get gifts/random
encounters, and a flirt -> romance path (male/female tenants; intimacy if close enough).

- **Relationship + chemistry meters** per tenant (`relV1866` / `chemV1866`, lazy `ensureTenantRel`; plus
  `genderV1866`, `romanticV1866`, per-year limits `actsV1866`).
- **Interactions** (`reTenantActV1866`): Talk / Share a Meal / Give a Gift build relationship; Flirt builds
  chemistry; Go on a Date + Spend the Night gated on romantic (+ rel/chem for intimacy). Yearly limits +
  cost; player happiness nudged via `applyDeltas`.
- **Romance** (`reTenantRomanceV1866`): rel >=45 and chem >=40 -> "Ask out" -> romantic (odds scale with
  rel+chem). Intimacy ("Spend the Night") is **abstract/fade-to-black and adult-gated**, matching Ledger's
  existing dating system. Self-contained - does NOT touch the main partner/family system.
- **Retention:** in `processRent`, a tenant whose lease ends **renews instead of leaving** when relationship
  is high (>=50, odds ~rel/130), staying 1-3 more years - the "make them stay longer" ask.
- **Yearly drift + events** (`reYearlyTickV1863`): relationship decays ~3/yr, chemistry ~2/yr (visit to
  maintain - interpreted the user's "1% decrease every year" as this); rel >=55 has ~22%/yr to send a gift
  or run into you (+$50-290 + happiness).
- **UI:** card shows "Visit <first name>" when tenanted -> scrollable popup (`reOpenTenantV1866` ->
  `renderTenantOverlay`) with both meters, ask-out button, and the action list.

Changed files: `pages/systems/property-estate.js` (-> v18.66), `cdp/property.js` (+9 checks). New globals:
`reTenantActV1866` / `reTenantRomanceV1866` / `reOpenTenantV1866`.

**Tests RUN: none (sandbox still down).** Hand-reviewed. **DO THIS NEXT:** `node build/build-ledger18.js`,
then the property probe (now ~63 checks; was 52 after CP28). Risks: unran; a couple checks are probabilistic
(romance over 15 tries, renewal over 12 - both ~certain); romance balance (thresholds, decay, gift rate)
untuned - playtest. Keep the intimacy abstract. Next: optionally show relationship status on the card and
let tenant romance feed the main relationship system if wanted (currently self-contained).

---

## Checkpoint 28 - 2026-06-22

### Flip button fix + tenant screening / background checks (`property-estate.js` -> v18.65)
Two user-reported items.

**Flip button "isn't working".** `reSetStrategyV1863(uid,'flip')` already ran and set `strategy='flip'`,
but flip had no distinct mechanic and the card showed no active-strategy state, so it looked dead (unlike
Rent/Move-in which change visible UI). Fixes: immediate **toast** on every strategy change; **active state**
on the strategy buttons (Renting ✓ / Living here ✓ / Flipping ✓ + gold highlight); a **flip project strip**
(gain-since-flip / current value / net-if-sold-now + renovate-then-list guidance; state `flipFromV1865`);
and a renovated flip sells at a **small premium** (up to +6%) in `sellPropertyInternal`.

**Tenant screening / background checks (new feature, per user).** Vacant rentals now surface **1–3
applicants** instead of a silent auto-tenant. Each has hidden credit score / criminal record / income.
Run up to three **paid checks** to reveal each, then Accept or Reject:
- `reScreenApplicantV1865(uid,appId,type)` — Credit $150 / Background $280 / Income $200; reveals one
  attribute, charges the fee.
- `reAcceptApplicantV1865` places them as the tenant (reliability from quality+credit; carries
  `criminalV1865`/`qualityV1865`); `reRejectApplicantV1865` drops them.
- **Bad tenants damage the property:** a yearly roll in `reYearlyTickV1863` (chance scales with criminal
  severity + low reliability) cuts **condition and value** and logs "Tenant trouble"; shown as a card tag.
- Skipping screening is risky: auto-placed turnover tenants (`makeTenant`) now carry a hidden
  `criminalV1865` flag too. Applicants seeded by uid+age (stable within a year), lazy `ensureApplicants`.
  `reSetStrategyV1863('rent')` seeds applicants instead of auto-placing.
- **UI is a scrollable popup** (per user): the card shows a compact "Vacant &middot; N applicants &middot;
  [Screen tenants]" trigger (`applicantsButton`) that opens a modal (`reOpenApplicantsV1865` ->
  `renderApplicantsOverlay`, reusing the scrollable `.re1863-modal` shell); accepting/rejecting the last
  applicant closes it. Flip also got active-state buttons + a flip strip on the card.
- **Scroll-jump fix:** property/screening buttons used to fling you to the top of the page because the
  module's `saveRender()` called the global `render()` (full rebuild, scroll reset). It now re-renders the
  open hub **in place via `renderHubInPlaceV16(hubId, pos)`** and preserves `.v16-hub-body` scroll (same
  pattern as the CP23 business/tax-legal fix), falling back to `render()` only if that helper is absent.

Changed files: `pages/systems/property-estate.js` (-> v18.65), `cdp/property.js` (+11 checks). New globals:
`reScreenApplicantV1865` / `reAcceptApplicantV1865` / `reRejectApplicantV1865` / `reApplicantsV1865`
(global, called from property-hub onclicks - no play.html change needed).

**Tests RUN: none (sandbox still down - no node/headless-Chrome).** Source hand-reviewed. **DO THIS NEXT:**
`node build/build-ledger18.js`, then `node cdp/driver.js <port> "file:///d:/code/L/play.html?sandbox=1&from=landing" cdp/property.js`
(expect ~52 checks; was 41 after CP27). Risks: unran; `bad_tenant_can_damage_property` is probabilistic
(15 forced years -> ~certain); screening rebalances tenant placement - confirm passive rental income still
feels right and tune the auto-tenant criminal rate (economy ~14% serious) after a playtest. Next: optionally
surface applicants on lease turnover too (not just initial rent); CP26 #1 (real live-in lifestyle) still open.

---

## Checkpoint 27 - 2026-06-22

### Property prestige / class tiers (`pages/systems/property-estate.js` -> v18.64)
Shipped CP26 backlog item #2 ("property class levels"). **Heads-up for the next agent:** source was
already at **v18.63**, ahead of CP26's v18.62 notes — the trend-driven market (booms/crashes),
foreclosure/off-market urgency deals, tenants (vacancy/rent-miss/lease), 6 renovation types, the
`live` strategy + "move into an owned property" modal, and legacy `state.rentals` migration were all
ALREADY shipped (verify source, not these notes). This checkpoint adds the class/prestige layer.

- **5 classes** (`PROPERTY_CLASSES`): Economy → Standard → Premium → Luxury → Prestige. Each has a
  color, `reqNetWorth` gate (0 / 0 / 400K / 3M / 20M), `rentMult`, `apprecBonus`, `maintMult`,
  `prestige` points, and a `tenant` quality modifier. Every `PROPERTY_TEMPLATES` row tagged with `cls`.
- **Gating by wealth + credit**: `reBuyV1863` now also requires `netWorth()` ≥ the class `reqNetWorth`
  (on top of the existing per-listing credit gate). Foreclosure auctions **waive** the net-worth gate
  (kept as the bargain path). Locked listings render disabled with an "Unlocks at $X net worth" note;
  the summary shows a **class ladder** (🔒 on tiers you can't afford yet).
- **Scaling without touching the yearly money path**: class rent/appreciation/maintenance premiums are
  baked into the LISTING at generation (`listingFromTemplate`), so a bought property carries them in
  its own `monthlyRent`/`apprecMean`/`yearlyMaint` and the yearly tick is unchanged (no double-scale).
  Higher classes also draw better tenants (`makeTenant` reads class `tenant`).
- **Prestige is a status score, NOT net worth** (so no double count): `portfolioStats().prestige` sums
  each owned property's class prestige; `window.rePrestigeV1863()` exposes it; the Real Estate summary
  shows "Estate prestige <total> · <rank>" (No Holdings → First Rung → Landlord → Landed Owner →
  Real-Estate Magnate → Property Dynasty).
- **Save-safe**: every property gets a class — stored `cls` on new buys, else derived from value
  (`classForValue`) in `normalizeProp` — so old saves and migrated holdings get a class label + prestige
  with **no change to their economics**. Class carried through `propertyFromTemplate`, `buyListing`, migration.

Changed files: `pages/systems/property-estate.js` (header → v18.64), `cdp/property.js` (+11 tier checks:
listings carry class; luxury allowed / prestige blocked at ~12M net worth; prestige allowed when rich;
bought-property class; prestige accumulates; summary rank + class ladder + portfolio-card prestige render;
migrated property gets a class).

**Tests RUN: none yet.** The Linux sandbox that provides node + headless Chrome was down the entire
session ("Not enough disk space to set up the workspace"), so `node --check`, the CDP probe, and the
`dist` rebuild could not be executed from here. Source was syntax-reviewed by hand; template literals
and the new helpers were eyeballed.
**Tests NOT run — DO THIS NEXT (needs node):**
1. `node build/build-ledger18.js` — rebuild `dist/`. (`play.html` loads source directly, so the playable
   game already reflects the change; only the bundled `dist/` copies are stale.)
2. `node cdp/driver.js <port> "file:///d:/code/L/play.html?sandbox=1&from=landing" cdp/property.js` —
   expect ~41 checks green (was 30). Then re-run `cdp/networth-genetics.js` as a finance regression.

Remaining risks: the unran probe could surface a typo/tuning issue; class rent/apprec multipliers are
modest but stack on the templates' existing tier spread (intentional — worth a balance glance). The
net-worth gate reads `legacyNetWorth()` (confirmed global in `play.html`).
Next step after verify: optionally CP26 #1 (make living in an owned property grant real lifestyle/looks
— currently cosmetic) and #3 (hot neighborhoods + discrete tenant/market events).

---

## Checkpoint 26 - 2026-06-21

### Property rehaul — real-estate now builds real wealth (new `pages/systems/property-estate.js`)
Old property was a flat list (full-cash, fixed rent−upkeep, no appreciation → owning wasn't worth it).
Rebuilt as an investment system modeled on the Verdant base code (all 4 pillars the user picked):
- **Appreciation + equity**: each property appreciates yearly (mean rate ± market swing); net worth
  counts live **equity (value − mortgage)**, not a frozen price.
- **Mortgages / leverage**: buy with a **down payment + mortgage** at a **credit-gated rate**
  (`mortgageRate()`: 8.5%→3.5% by score); yearly amortized paydown; manual extra paydown.
- **Types + portfolio**: residential / multi-unit / commercial / land templates (studio→skyscraper);
  portfolio dashboard (value, debt, equity, cash flow, rent).
- **Condition + renovation**: condition decays yearly, drives rent multiplier + vacancy + can-rent;
  renovate to restore it and bump value.
- Yearly tick `reYearlyTickV1862()` hooked into `resolveLifeAndFinanceYear`. Legacy `state.rentals`
  **migrated once** into the portfolio (then cleared) so old holdings get appreciation too and aren't
  double-counted. `legacyNetWorth` + finance ledger now add `reEquityV1862()` (migrate-first to avoid
  double count). New hub `renderRealEstateV1862()` replaces the old rental sections in `renderHome`.
- Globals: `reBuyV1862` / `reSellV1862` / `reRenovateV1862` / `rePayMortgageV1862` / `reYearlyTickV1862`
  / `rePortfolioStatsV1862` / `reEquityV1862` / `reEnsureV1862` / `renderRealEstateV1862`. Wired into
  `play.html`.
- Verified `cdp/property.js` (19): mortgage buy spends only the down payment at a credit-gated rate,
  cash buy, appreciation, mortgage paydown, condition decay, renovate, paydown, sell, migration,
  net-worth equity, render. networth-genetics regression still 9/9. Screenshot confirms the hub. dist rebuilt.
- **Buy fix**: under-18 players saw clickable buy buttons that silently failed (`reBuyV1862` gates at
  18+). The Acquire board now disables buy buttons and shows **"Unlocks at 18"** when under 18 (adults
  buy fine — verified). Property unlocks at 18 by design.
- **Renamed Home → "Real Estate" everywhere** (all 11 hub title-maps + the active `titleForHub16` +
  tab label; hub id stays `home` internally).
- **Living Situation is now a popup** (`openHomeModalV1862` / `renderLivingSituationV1862`), same pattern
  as New Business: the Real Estate hub shows a compact "Where you live · [Choose Home]" row that opens a
  modal listing every home (buy/move, current marked ✓, stays open + refreshes after moving).
- **Limited rotating market** (`reMarketV1862` / `genMarket`): each year lists up to **30 one-of-a-kind
  properties** (price varies per listing); **buying removes that listing**; the market **refreshes next
  year** (seeded by age, stable within it). Buy board renders listings (by `lid`); `reBuyV1862` accepts a
  `lid` (or tplId fallback) and splices the bought listing out. Replaces the old infinite-supply board.
- **Per-property improvements** ("buy stuff for it"): `IMPROVEMENTS` (furnish / solar+efficiency /
  add-unit / premium reno / security) bought via `reImproveV1862(uid, impId)` — cost scales with value,
  applies rent/value/condition boosts, once each. A **🔧 Improve** button on each property opens an
  improvements popup (`openImproveModalV1862`, reuses the re-modal). `cdp/property.js` → **30**.
- Still open next-steps (unchanged): live-in any owned property, property class levels, neighborhood
  hot-markets + tenant/market events, fold legacy homes/rentals fully in. (Base code reference is the
  Verdant `bld_*` buildings/improvements + market model.)

### Property — next steps for the next AI (user's plan; "all this was in the Verdant file")
Foundations are in place (mortgages, appreciation, condition, portfolio, net-worth equity) in
`pages/systems/property-estate.js` (`TEMPLATES`, `reBuyV1862`, `reYearlyTickV1862`, `renderRealEstateV1862`,
etc.). Requested follow-ups, in rough priority:
1. **Live in any property** — let the player choose to *live in* a property they own (not just rent it
   out). Today the live-in residence is still the legacy `homes` list in `renderHome` (Living Situation);
   unify it so owned real estate can be the residence (happiness/looks from tier) and the legacy `homes`
   either feed into or are replaced by `TEMPLATES`.
2. **Property class levels** — give property types tiers/classes (e.g. economy → luxury → prestige) that
   gate by wealth/credit and scale rent/appreciation/prestige, per the Verdant model.
3. **More interactivity / events** — tenant events (trash a unit, miss rent, long-term lease), market
   booms/crashes, **hot neighborhoods** that appreciate faster (Verdant `hotNeighborhoods`), renovation
   project types (heritage restoration, add units) that boost value/rent.
4. **Fold the legacy `homes`/`rentals` catalogs fully into the new system** so there's one property
   system (the Living Situation + Real Estate Portfolio are currently two sections in `renderHome`).
Verdant reference: `base code.devtools` real-estate model (~L3630 credit→mortgage bands, ~L3660+ property
templates with type/neighborhood/apprec/downPct/reqCredit, ~L4395 condition bands, ~L4292 building/improvements).

---

## Checkpoint 24 - 2026-06-21

### Net worth mismatch (Life Command vs Finance) + IQ genetics
- **Net worth disagreed** between Life Command (`legacyNetWorth`, e.g. $362B) and the Finance ledger
  ($102.7B). Two causes: (1) the active-founder **bridge company** in `f.businesses` was counted in
  `legacyNetWorth` AND again via `newBizValue` (double count); (2) the ledger's "Personal firm capital"
  line only counted `personalFirm.cash`, missing a big **personal fund** (`firm.managed/capital`) that
  `legacyNetWorth` did count. Fixes: `legacyNetWorth` + ledger `legacyBusinessValue` now both **exclude
  founder-active/migrated bridge companies** (counted once via bizV1860); new `firmCapitalV1862()` makes
  the ledger's firm line mirror `legacyNetWorth`'s fund math. Probe confirms the two totals now match
  ($151B == $151B). Exposed `window.financeLedgerTotalsV1836`.
- **IQ genetics added**: children are born with an inherited IQ (`childInheritedIQV1862`): midparent of
  the player's IQ and the partner's IQ, regressed toward 100 with variation, stamped on the child
  (`addChild`). When continuing as heir (`continueAsHeirV1846`), the heir takes the child's born IQ
  (or, for a generated relative, regresses from the deceased's IQ) instead of a fresh random roll —
  so smart parents → smarter heirs. Probe: smart parents avg ~137 vs average parents ~100.
- Verified `cdp/networth-genetics.js` (9), trust-nav 2, estate-trust 4, trust 18, death 20. dist rebuilt.
### Follow-ups (both resolved CP25)
- **Dead "yellow button"** = the hub size toolbar (A-/A+/S/W/XL/H-/H+, top-right). Root cause: the
  buttons set CSS vars `--ledger-hub-width` / `--ledger-hub-height` / `--ledger-ui-scale` that **no CSS
  rule consumed** (0 references), so every size/width/text button did nothing (the yellow one is just
  the active preset). Fix: wired the vars into `.hub-overlay .hub-sheet` (max-width/width/max-height)
  and `.v16-hub-body` (`zoom`) in the core style block. Buttons now resize/scale the hub.
- **Continue-as-heir reset to age 0 / preschool**: `continueAsHeirV1846` always `newGame`'d a newborn.
  Taking over a living/named child (e.g. 23yo) now **starts the heir at that child's age** (BitLife-style)
  — sets `state.age`, birthYear, and for adults clears school (`education`/`collegeDecisionDone`/`inSchool`)
  so they aren't "23 in preschool". A generated relative steps in at 18, not 0. (`schoolStageKey` is
  age-derived so the school stage follows automatically.)
- Verified `cdp/heir-age.js` (6): heir age 23, edu "High School", inherited IQ 128, generation 2,
  width/scale CSS vars change. death 20, networth-genetics 9 green. dist rebuilt.

---

## Checkpoint 23 - 2026-06-21

### Fixed: trust actions jump you to a different hub
Acting on a trust control (grant to child, title a business to the trust, etc.) bounced the player to
another hub instead of staying on the current page. Cause: the per-module `saveRender` helpers
hardcoded their home hub — `tax-legal` → `renderHubInPlaceV16("law")`, `business-entities` →
`"business"` — and `renderHubInPlaceV16` *switches the open overlay to that hub*. Since trust controls
are surfaced in several hubs, acting from one yanked you to the module's hub.
- Fix: both `saveRender` helpers now re-render the **currently-open hub** (read from the
  `.hub-overlay` `data-hub-id`) and preserve scroll position; they only fall back to law/business when
  no hub overlay is open.
- Verified `cdp/trust-nav.js` (2): from a stubbed "people" hub, `grantChildFromFamilyTrustV1839` and
  `setBusinessTrustPercentV1840` both re-render "people" (not "law"/"business"). Regressions: estate-trust
  4, trust 18, business-tabs 16. dist rebuilt.

---

## Checkpoint 22 - 2026-06-21

### Death settlement now honors the Legal family trust ("had a trust but it said No Trust")
The death-screen **Family Trust Settlement** (`estateSettlement` in `pages/patches/08-patch-v18-31.js`)
only read the estate-plan trust (`estateV1831.trustType`) — a SEPARATE system from the **Legal hub
family trust (`familyTrustV1839`)**. A player who built a Dynasty Family Trust in Legal still saw
"Plan: No Trust" and got billions taxed (corpus was in `gross` via `legacyNetWorth` but never in
`protectedValue`).
- Fix: `estateSettlement` now also reads `familyTrustV1839` — its corpus (via
  `window.legalProtectedAssetsV1839()`) counts as **protected**, it cuts probate, and its `protection`
  maps to an estate-tax cut. Critically, **trust-protected assets are removed from the taxable estate**
  (`estateTaxBase = unprotected - exemption`, was `gross - exemption`). The death "Plan" label shows the
  real trust name (Dynasty Family Trust, etc.) instead of "No Trust".
- **"Still says No Trust" follow-up**: protection/tax were already correct, but the **Plan label** still
  read "No Trust". Root cause (found by exposing the settlement fn to a probe): the Legal family trust
  **syncs into `estateV1831.trustType` mid-function**, AFTER `t = TRUST_TYPES[trustType]` was captured at
  the top — so `planName` used the stale `t.name`. Fixed by recomputing the trust type fresh for the
  label (`curTrust`), plus broader detection (business trust / trust cash / any protected value) so it
  NEVER shows "No Trust" while assets are protected.
- Also hardened the test harness: `cdp/driver.js` now sets `Network.setCacheDisabled` so edited
  source always runs fresh (Chrome was caching file:// scripts across navigations).
- Verified `cdp/estate-trust.js` (**4/4**): no-trust says "No Trust"; $14.2B Dynasty trust → Plan
  "Dynasty Trust", Protected $14.2B, estate tax ~$5.1B (was ~$15B); protected-but-unnamed → "Family
  Trust" not "No Trust". Regressions: trust 18, death 20. dist rebuilt.
- Note: several trust/estate paths exist (estateV1831 plan, familyTrustV1839 Legal trust, tax-legal
  `personalInheritanceCashV1846`); the death settlement panel now reconciles them for protection + label.

---

## Checkpoint 21 - 2026-06-21

### Business fixes: $0-income mystery + rotating acquisition market
- **"Made a ton of money but shows $0 income"**: the company in question (e.g. PulseCore) is the active
  **Entrepreneurship startup bridged into `finance.businesses`** (`founderActiveV1860` / `_migratedToBizV1861`)
  so net worth counts it — but its income is run by the Entrepreneurship module, so the core business loop
  skips it (`skipCoreIncome`) and the Business hub showed a stale **$0**. Fix: `businessesVisibleV1862()` /
  `isEntrepreneurPortV1862()` **hide bridge companies from the Business hub** (rail + `focusBusiness` +
  the company you can focus); they're managed in Entrepreneurship (real income + graphs there).
- **Acquisition market** was a static list shown all at once. New `acquisitionMarketV1862()`: a **rotating
  market of 3→10 companies** (grows with age: `3 + floor((age-18)/5)`, capped 10), **varied sectors**,
  **refreshed each year** (seeded by age, stable within a year), drawn from the V6 list + the launch
  catalog (`buyCompany`/`bizBlueprint` resolve either). Used by `acquisitionRail` and the New Business
  Buy tab. Always ≥3 for sale.
- Probes: `business-tabs.js` → **16** (bridge hidden, focus skips bridge), `business-modals.js` → **23**
  (acquisition market ≥3). All green: business-tabs 16, business-modals 23, business-locations 23,
  business-income 2, separation 20, features 17, dashboard 32. dist rebuilt.

---

## Checkpoint 20 - 2026-06-21

### Business polish: wider popups, New Business redo, Trends graphs tab
- **Wider management popups**: `.biz-manage-card` max-width 560→**780px** (it looked too skinny with
  empty sides on desktop); New Business grid roomier (`minmax 210`).
- **New Business popup redone** (`bizNewBusinessBodyV1862`): the old version was a double-scroll wall
  (horizontal `.v1840-rail` rails inside the vertical modal). Now a **scratch/buy toggle** + sticky
  search + category dropdown + a single clean **vertical grid** (`.v1840-newbiz-grid`). Click a card →
  `startVentureV1862`/`buyCompanyV1862` create it, **close the popup, and focus the new company** on
  its Overview tab.
- **Trends sub-tab (graphs)**: focused-company mini-tabs are now **Overview / Trends / Capital /
  Network**. New `companyTrendsBodyV1862` + inline `sparkSVGV1862` draw **company value / yearly income
  / reputation** sparklines from a new per-company `historyV1862` array (pushed each year in the core
  income loop, capped 40; empty-state until a couple years pass).
- Probes: `business-tabs.js` → **14** (adds Trends empty-state + charts), `business-modals.js` 22,
  `business-locations.js` 23, `business-income.js` 2.
- Verified green: business-tabs 14, business-modals 22, business-locations 23, business-income 2,
  separation 20, features 17, dashboard 32, founderpay 24 (ipo's grants check is the known flake);
  screenshots confirm the wide New Business grid + Trends charts. dist rebuilt.

---

## Checkpoint 19 - 2026-06-21

### Business hub: drill-in model (top tabs removed → focused-company mini-tabs)
User wanted a clearer mental model: see your companies → click one → that focused company has its OWN
little tabs, with Family as a popup and New Business as a bottom button. Replaced the top-tab bar.
- **No top tabs.** `renderBusinessHub` is now flat: hero + portfolio KPIs + **company rail** (click to
  focus) + the **focused company** + `＋ New Business` button + founder mode + entrepreneurship link.
- **Focused company mini-tabs** (`COMPANY_TABS_V1862`, state `office.companyTabV1862`,
  `setCompanyTabV1862`): **Overview** (KPIs, risk, sector meter, challenges, primary actions, + manage
  popups Structure/Team/Assets/Family), **Capital** (founder capital + company cash + taxes inline),
  **Network** (locations/market share inline).
- **Family is now a popup** (global modal kind `family`), not a tab — opened from the Overview manage
  grid. **New Business is a global popup** (kind `new` = launch + acquire) from the bottom button.
  `buildBizModalV1862` + `refreshBizModalV1862` handle global (no-company) kinds via
  `GLOBAL_MODAL_KINDS_V1862`. Back-compat `setBusinessTabV1862` shim maps old ids to the new sub-tabs/popups.
- Probes: `business-tabs.js` (12, mini-tabs + New Business btn + focus switch), `business-modals.js`
  (21, adds family/new globals + persistence-through-render), `business-locations.js` (23, network is
  now a sub-tab).
- Verified green: business-tabs 12, business-modals 21, business-locations 23, business-income 2,
  separation 20, features 17, ipo 17, dashboard 32, founderpay 24, stock 30, trust 18; screenshot
  confirms the drill-in layout. dist rebuilt.
- **Follow-up fix (New Business flow)**: starting/buying from the New Business popup left the player
  staring at the catalog with no feedback. Added `startVentureV1862`/`buyCompanyV1862` wrappers
  (launch/acquisition cards now call these) that create the company, **focus it, switch to its
  Overview sub-tab, and close the popup**. business-modals probe → 22. dist rebuilt.
- **New Business popup redesigned** (it had a double-scrollbar wall — horizontal `.v1840-rail` rails
  inside the vertical-scrolling modal, half-hiding cards). New `bizNewBusinessBodyV1862()`:
  a **scratch/buy toggle**, sticky search + category dropdown, and a single clean **vertical grid**
  (`.v1840-newbiz-grid`, no horizontal rails / no double-scroll). The `new` modal kind uses it.
  Search still uses the focus-preserving DOM filter (`setLaunchSearchV1850`). dist rebuilt.
- **Still requested (next):** more tabs + graphs on the focused company to make it feel richer
  (reference: the Entrepreneurship dashboard's Product/Growth/Team/Funding tabs + charts).

---

## Checkpoint 18 - 2026-06-21

### Business hub made company-centric (CP17 tabs were confusing)
User found the 5-tab split (Overview/Company/Grow/Family/Ledger) unintuitive — you picked a company
in one tab but managed it in another, and a global "Founder Capital" list (from `venture-lifecycle.js`)
was bolted on below everything, duplicating the portfolio and ignoring tabs. Restructured around the
player's actual mental model: pick a company → manage it right there.
- **3 tabs now:** **Companies** (portfolio rail + the focused company's compact card + all its
  management popups, in ONE place) · **New Business** (launch + acquire, was "Grow") · **Family**
  (trust/succession + enterprise ledger). Old tab ids migrate (overview/company/ledger→companies,
  grow→new).
- **Founder Capital moved into a per-company `💰 Capital` popup** (`bizCapitalBodyV1862`, reuses
  `injectVentureCapitalV1860`/`lendVentureCapitalV1860`). `venture-lifecycle.js` no longer appends its
  global all-companies list on the Business hub (entrepreneurship hub unchanged).
- **Manage grid** on the company card is now `💰 Capital · 💵 Cash · 🧾 Taxes · 🏗️ Structure ·
  👥 Team · 🛠️ Assets · 🌐 Network`. Split the old cash popup: **Cash** = distribute/reinvest/salary/
  rename; new **Taxes** popup = entity tax + compliance.
- Probes updated: `business-tabs.js` (12, new 3-tab + id migration), `business-modals.js` (16, adds
  capital/taxes), `business-locations.js` (23, company tab → `companies`).
- Verified: business-tabs 12, business-modals 16, business-locations 23, business-income 2, plus
  separation 20 / features 17 / ipo 17 / dashboard 32 green; screenshot confirms the Companies tab +
  Capital popup. dist rebuilt.

---

## Checkpoint 17 - 2026-06-21

### Business hub rebuilt: tab system + Verdant-style management popups
Per approved plan `C:\Users\jgodj\.claude\plans\i-feel-like-you-re-sorted-hippo.md`. The hub was a
long scroll of patched-on panels; rebuilt around tabs + popups (all in `pages/systems/business-entities.js`).
- **5 tabs** (mirrors the Entrepreneurship dashboard, reuses its global `.biz1862-tab` CSS):
  **Overview** (KPIs + founder mode + company rail + entrepreneurship link), **Company** (focused
  company desk), **Grow** (launch + acquire, existing filter/search), **Family** (trust/governance),
  **Ledger** (enterprise history + the focused company's market events & asset log). State on
  `office.activeTabV1862`; `setBusinessTabV1862()`; Company/Ledger disabled with no business; bad/locked
  tab → overview fallback.
- **Company tab = compact card** (Verdant style): head + 4 KPIs (reputation folded in small) +
  one-line risk disclosure + sector meter + challenges + primary action strip + a **Manage grid**
  of buttons (`💵 Cash · 🏗️ Structure · 👥 Team · 🛠️ Assets · 🌐 Network`).
- **Management popups**: each Manage button calls `openBizModalV1862(bizId, kind)` → a centered modal
  built by `buildBizModalV1862` (bodies lifted from the old inline focus desk: cash/structure/team/
  assets, network = `locationsPanelV1857`). Reuses the look/close-paths of `business-events.js`
  `renderPopup` (✕/backdrop/Escape). Stays open across actions; `refreshBizModalV1862()` (called at the
  end of `renderBusinessHub`) rebuilds the body with fresh values after each action.
- History moved out of the family desk into the Ledger tab. CSS added for `.v1840-tabpanel` (accent
  strip), `.v1840-manage-grid`/`-btn`, and `#biz-manage-overlay`/`.biz-manage-*`.
- **Probes**: new `cdp/business-tabs.js` (14) + `cdp/business-modals.js` (14); `cdp/business-locations.js`
  updated for the tabbed layout (network checks now hit `buildBizModalV1862(id,'network')`) → 23.
- Verified: full suite green (business-tabs 14, business-modals 14, business-locations 23,
  business-income 2, separation 20, features 17, ipo 17, dashboard 32, death 20, founderpay 24,
  stock 30, trust 18, wayback 11, devtools 17); screenshots confirm the compact Company card + the
  Company-cash popup. dist rebuilt.

---

## Checkpoint 16 - 2026-06-21

### Fixed: established Business making $0 ("old super-profitable business earns nothing")
Root cause confirmed via repro probe: the yearly business loop in
`pages/runtime/00-core-app-runtime.js` did `const v = entrepreneurshipCatalog.find(...); if (!v) return;`
— any owned business whose catalog id had drifted (renamed/removed by the sector rework, or
created in a different business system) was **silently skipped**: no income added to money, value
never grew, and it displayed a stale "Last income" reading forever.
- Fix: when the catalog lookup misses, **synthesize a venture from the business's own data**
  (`startup` from value/4, `yearlyMin/Max` scaled from value, `scaleStat`/`failureRisk` fallbacks,
  `_synthV1862` flag) instead of `return`-ing. A valuable established company now keeps earning.
- Verified: `cdp/business-income.js` (new, 2 checks) — an orphan $4M established business went from
  $0 to ~$1.26M/yr income (+$660K to money). dist rebuilt.
- Note: a second, narrower zeroing path exists — `founderActiveV1860` stuck on → `skipCoreIncome`
  forces lastIncome=0 (by design for the active founder startup; only a bug if the flag isn't
  cleared after graduation). Left as-is pending a real repro.
### Business hub UX reorg + polish (user: "reorganize + polish")
The hub was a flat stack of 8 patched-on sections (hero/kpis/entrepreneurshipShortcut/businessRail/
focusDesk/launchRail/acquisitionRail/familyEnterpriseDesk) — read as unorganized/cluttered/dated.
- `renderBusinessHubV1840` (`business-entities.js`) now groups sections into **four labeled,
  accent-colored zones** via the new `zoneV1862()` helper: **Overview** (gold) = KPIs, **Your
  companies** (blue) = portfolio rail + focus desk, **Grow** (green) = launch + acquisition rails,
  **Family & governance** (violet) = trust/dividends/succession. Hero stays on top; the
  Entrepreneurship cross-link stays at the bottom.
- New CSS: `.v1840-zone` with a glowing per-zone accent strip + zone header (mirrors the
  Entrepreneurship dashboard's per-section accent system). Empty zones render nothing.
- Verified: 7/7 zone render checks, `cdp/business-locations.js` still 22/22, screenshot confirms
  the four accent strips and grouping. dist rebuilt.
### Focused-company desk condensed (user: "patches on patches, boring, empty space, rep too big")
The focus desk was 12 stacked sub-panels. Rebuilt `focusDesk()` in `business-entities.js` to read as
one tight panel:
- **Reputation** shrunk from a big bar+header to a small KPI in the 4-up metric row.
- **Failure risk** collapsed from the full verbose line-item panel to a **one-line disclosure**
  (`⚠️ Failure risk 29% ▸`) — breakdown still there, just behind a click (most players don't read it).
- **All heavy/occasional controls** (entity structure, ops team, assets, asset history, market
  events, company cash, rename) moved behind a single **`⚙️ Manage company`** disclosure.
- **Empty space fixed**: company-cash 3 groups now an auto-fit `.v1840-cash-grid`; the half-empty
  nameplate column removed — rename is a compact full-width row inside Manage.
- New CSS: `.v1840-disc` (styled `<details>` summary with rotating chevron + accent), `.v1840-cash-grid`.
  Default desk view = name + value, 4 KPIs, one-line risk, sector meter, network/market share,
  challenges, primary action buttons. Everything else one click away.
- Verified: 6/6 render checks, `cdp/business-locations.js` still 22/22 (network controls still in the
  HTML), screenshot confirms the condensed layout. dist rebuilt.
- Still open if wanted: the **Grow** zone is long (full ~100-venture launch catalog) — could
  collapse/paginate it; deeper polish of the family-enterprise desk (same sprawl pattern).

---

## Checkpoint 15 - 2026-06-21

### Finished + verified the Business multi-location work GS left half-done
GS (prior agent) implemented Business items #6/#7/#10 (CP13–CP14) and wrote `cdp/business-locations.js`
but ran out of tokens before it could launch a browser, so the probe was never run.
- Ran it in headless Chrome: started at 20/22, **now 22/22**. The two failures were *probe* bugs,
  not implementation bugs — fixed both in `cdp/business-locations.js` (see CP14 note).
- Re-ran the **whole suite green** and **rebuilt dist**. The Business location/franchise/rival
  feature and the synergy/risk-line work are now verified end-to-end.
- No game-code changes were needed; GS's implementation was sound.

---

## Checkpoint 14 - 2026-06-20

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
- Tests: **`cdp/business-locations.js` now runs green 22/22** in headless Chrome (CP15 finished
  this — GS could not launch a browser). Two assertions in the probe (not the implementation)
  were fixed: `open_owned_adds_site` compared a live `loc` reference to itself+1 (now snapshots the
  count before opening), and `franchise_adds_partner` only had 2 sites when the design gates
  franchises at 3+ (now opens a second owned site first). Full suite green (dashboard 32, death 20,
  founderpay 24, stock 30, trust 18, wayback 11, devtools 17, separation 20, features 17, ipo 16
  — ipo's `green_company_gets_grants` is the known probabilistic flake). dist rebuilt.

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
