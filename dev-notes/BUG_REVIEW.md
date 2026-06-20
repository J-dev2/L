# Bug Review — ledger18_modular_v18_35

## ✅ Fixes applied (2026-06-19)

| Bug | File | Change |
|---|---|---|
| P1 choose() drops fn-effect deltas | runtime `choose()` | `deltas = outcome.deltas \|\| outcome` (accepts bare or wrapped) |
| P1 trust business missing from net worth | finance-ledger.js:126,545 | add `sourceLedger.trustOwnedBusiness` to family-trust value |
| P2 license_test double roll | runtime `license_test` event | roll once, set flag + return deltas together |
| P2 stacked yearly deltas overwrite | runtime (all 3 copies) | new `mergeAddDeltas()` sums instead of `Object.assign` |
| P2 accountant `[object Object]` | finance-ledger.js:540 | read `.name`/`.id` when accountant is an object |
| P2 credit display ≠ enforced | money-banking.js `creditLimit()` | mirror core `useCreditCard()` table (display now truthful) |
| P2/P3 sandbox mult inflates costs | runtime `applyDeltas()` | multiply positive money only |
| P3 sport actions double-log | education-career.js `logSport()` | use `addLog` only (addToast already logs) |

**Deliberately NOT changed:**
- *more-command.js trust-business* — it already counts live trust businesses via `trustBusinessStake()`,
  and carried businesses re-materialize as live objects ([tax-legal.js:771]), so adding
  `sourceLedger.trustOwnedBusiness` there would **double-count**. finance-ledger has no business row,
  so the same add is correct there.
- *familyAction('try') guard* — the live People module (people-family.js v18.42) already caps baby
  attempts at 2/year via `useCount` (line 836); the core function is dead/overridden.

All 4 edited files pass `node --check`. Source only — `dist/` not rebuilt.

---



Line-by-line review of the editable source (`pages/`, `state/`, `styles/`, `themes/`, `build/`).
`dist/` (generated) and `base code.devtools` (legacy "Verdant" monolith) treated as reference.

Severity: **P1** = breaks gameplay / data loss, **P2** = wrong behavior, **P3** = minor/cosmetic/dead code.

---

## pages/runtime/00-core-app-runtime.js

### P1 — Function-style event choices silently apply NO effects
`choose(i)` (line ~2265) reads `outcome.deltas` when a choice's effect is a function:
```js
if (typeof rawDeltas === "function") {
  const outcome = rawDeltas(state) || {};
  deltas = outcome.deltas || {};   // <-- bug: choice fns return a BARE deltas object
  log = outcome.log || rawLog;
}
```
But every function-style choice in the `events` array returns a **bare deltas object** (or `null`),
e.g. `s => chance(.5) ? { happiness: 12 } : { happiness: -8 }`. So `outcome.deltas` is `undefined`
and `deltas` becomes `{}` → nothing is applied. The flavor text still logs, hiding the failure.
Affected core events (≈16): first_crush, tryout_team, cheating_offer, license_test,
investment_pitch, affair_temptation, side_hustle, lawsuit, lottery_ticket, diy_haircut,
crypto_pitch, gym_membership, driving_lessons, tax_audit, moved_for_work, (any other fn-choice).
Confirmed live: choice buttons call `choose(i)` (lines 3715/3758/3779), `choose` is not overridden
by any patch, and patches only *wrap* `ageUp` (core `maybeEvent` still fires the core events).
**Fix:** `deltas = outcome.deltas || outcome;` (back-compatible with the `{deltas,log}` shape).

### P2 — license_test rolls pass/fail twice independently
Event `license_test` (line ~843): the effect function rolls `chance(...)` for the stat reward,
and the separate `after` callback rolls `chance(...)` AGAIN to grant `hasLicense`. The two rolls
disagree, so you can get the "passed" rewards without a license, or "failed" penalty yet get one.
(Compounded by the P1 bug, which currently drops the reward deltas entirely.)
**Fix:** roll once, store the result, use it for both the deltas and the flag.

---

### P2 — Stacked yearly effects overwrite instead of summing
`resolveLifeAndFinanceYear` (line ~4283) builds the yearly stat change with:
```js
deltas = Object.assign(deltas, focus.yearly || {});
deltas = Object.assign(deltas, lifestyle.deltas || {});
deltas = Object.assign(deltas, budget.deltas || {});
```
`Object.assign` *overwrites* shared keys, so when focus/lifestyle/budget all touch the same stat
(happiness, stress, discipline are common), only the LAST source's value applies — the others are
silently dropped. E.g. focus `happiness:2` + lifestyle `happiness:4` → net +4, not +6.
**Fix:** sum into the accumulator (e.g. `addInto(deltas, src)` that does `deltas[k]=(deltas[k]||0)+v`).

### P3 — familyAction('try') has no per-year guard
`familyAction` (line ~2830) gates nothing for `try`; with no cost, the player can re-click "Baby"
repeatedly in one year, re-rolling pregnancy odds until it succeeds (odds become meaningless).
Add an `actionsTaken.tryBaby` guard like the other yearly actions.

## Minor / notes

- play-boot.js:5 — `Number.isFinite(n)` check is dead (the `|| 0` already coerced NaN to 0).
- play-boot.js:22-24 — multiple boot params: `sandbox` silently wins over `new`/`slot`.
- runtime is heavily layered: later "upgrade packs" REDEFINE `renderMoney`, `renderLifeHub`,
  `getSuggestedActions`, `ageUp`, etc. via wrapping (last-defined wins). Watch for stale earlier
  definitions that are dead code.
- getSuggestedActions:3089 uses global `state.clubs` instead of the `s` param (equivalent since
  `s===state`, but inconsistent).

### P3 — Credit limit shown ≠ credit limit enforced
The cash-flow IIFE's `creditLimitEstimate` (line ~5136) has a 780+ tier returning $35K, but
`useCreditCard` (line ~4250) caps at $25K (no 780 tier). The Money UI advertises up to $35K of
available credit that the action will refuse to extend. Make both use one shared limit table.

## pages/systems (active modules)

### P1 — Trust-owned business value disappears from net worth (found by Codex, confirmed)
Carried trust-owned business value is stored as `sourceLedger.trustOwnedBusiness`
([tax-legal.js:745]) but the accounting/display only reads `trust.corpus`:
- [finance-ledger.js:126] `familyTrust` asset row = `f.familyTrustV1839.corpus` only.
- [finance-ledger.js:544] `trustTotal` = corpus + child trusts + estate trustCash + enterprise
  dividends — never `trustOwnedBusiness`.
- [more-command.js:360] same omission.
Net effect: switching to an heir / continuing the legacy appears to "lose" the family firm + trust
money because the carried business value is never re-counted. **Fix:** add `trustOwnedBusiness` to
the family-trust value everywhere `corpus` is read.

### P2 — Finance shows accountant as `[object Object]` (found by Codex, confirmed)
Legal/Money store the accountant as an object (`f.accountant = Object.assign({}, plan)`), but
[finance-ledger.js:540] does `String(f.accountant || f.accountantPlan || "none")` → `"[object Object]"`.
**Fix:** read `f.accountant.name` (or `.id`), not `String(f.accountant)`.


### P3 — Sandbox `moneyMultiplier` also multiplies COSTS, not just inflows
Core `applyDeltas` does `state.money += Math.round(v * state.sandbox.moneyMultiplier)` for the
`money` key — applied to negative deltas too. The sandbox UI documents the multiplier as
"Multiplies all money **inflows**." Modules that route spending through `applyDeltas({money:-cost})`
(hustles.js `spendCash`, startup-founder.js `spendCash`, shopping-mall.js) therefore charge
`cost × multiplier` in sandbox mode. Sandbox-only, but inconsistent with the core (which deducts
costs directly, bypassing the multiplier) and with the stated intent.
**Fix:** only multiply positive money deltas, or have `spendCash` mutate `state.money` directly.

### P3 — education-career.js `logSport` double-logs
`logSport(msg, deltas)` (line ~577) calls `addLog(msg, deltas)` AND then `addToast(msg)`, and core
`addToast` itself calls `addLog(msg)` + save + render. So every school-sport action writes the same
line to the life log twice (and triggers an extra render). Use one or the other.

### P3 — Credit limit defined in 4+ inconsistent tables (reinforced)
Confirmed live in money-banking.js `creditLimit()` (780→$50K, 720→$25K, 680→$12K, 620→$5K) — yet its
"Use credit" button delegates to core `useCreditCard` (760→$25K…), and v18.24 has `creditLimit1824`
(800→$50K w/ reserve multipliers), and the cash-flow IIFE has `creditLimitEstimate` (780→$35K).
Four different schemes; displayed limit ≠ enforced limit depending on which path runs.

## Files reviewed clean (no discrete bugs found)

- `index.html`, `play.html`, `pages/landing/landing-page.js`, `pages/systems/play-boot.js`
- `pages/systems/save-recovery.js` (active boot guard — solid, well-defended)
- `pages/systems/00-system-map.js`, `state/state-map.js`, `pages/systems/sandbox-startup.js` (stub)
- `pages/systems/people-family.js` (v18.42 — `apply()` correctly strips `money` before delegating,
  so the "deduct directly + log money" pattern does NOT double-charge)
- `pages/systems/stocks-investing.js` (v18.38 — cosmetic relabel/UX layer, not the trade engine)
- `pages/systems/money-banking.js` (v18.37 — display layer; clean aside from the shared credit-table issue)
- `pages/systems/business-events.js` (v18.52 — choice popups use direct `apply(b)` fns; no `choose()`-style bug.
  Minor: events are dismissable via ✕/backdrop/Escape without choosing — intentional anti-soft-lock, mild exploit)
- `pages/systems/startup-founder.js` (founder mini-game economy: funding/dilution/loans/dividends/exits all sound)
- `pages/systems/scroll-nav.js`, `pages/hubs/00-hub-registry.js` (well-engineered, defensive)
- `build/build-ledger18.js` (clean Node bundler — naive HTML inliner would break only if a source file
  contained a literal `</script>`/`</style>`; none do today)

## Coverage / method

Deep line-by-line: `00-core-app-runtime.js` lines 1–~5135 (core game logic); all boot/landing/infra
files; people-family, money-banking, stocks-investing, business-events, startup-founder, scroll-nav
modules; build script; hub registry; patches 01–02.
Logic/economy scan (read mutation + yearly-resolve fns, skim HTML): tax-legal, finance-ledger,
business-entities, business-sectors, business-challenges, hustles, shopping-mall, education-career.
Confirmed: divisions guarded with `Math.max(1,…)`; the `resolveLifeAndFinanceYear` decorator chain
is properly nested; money helpers route through the global `applyDeltas` without double-charging.
Sampled (not exhaustive line-by-line): runtime IIFE UI packs (~5135–17201), patches 03–16.
Treated as reference (generated/legacy, not re-read): `dist/*`, `base code.devtools`.

Not exhaustively line-read (large display layers, same defensive style — low remaining yield):
the bulk render code of life-command, more-command, scroll-stability, education-career,
business-*/tax-legal/finance-ledger; individual hubs/*; styles/* + themes/* CSS.

### Coverage note (runtime IIFE block)
Runtime lines ~5135–17201 are a stack of self-contained IIFE UI "upgrade packs" (V3/V13/V14/V16…)
that repeatedly redefine `renderMoney`, hub overlays, sector/stock views, scroll handling, etc.
These are HTML-heavy with display math wrapped in try/catch; sampled several, low discrete-bug
density. Not read exhaustively line-by-line — flagged the credit-limit mismatch; the live gameplay
bugs above (choose / license / stacked-deltas) are the substantive runtime findings.
