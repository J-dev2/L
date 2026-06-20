# Credit redesign + business net worth — execution note

Persistent copy of the approved plan (`~/.claude/plans/plan-it-out-and-flickering-flask.md`)
so work can resume after a disconnect. Update the **Progress** checklist as items land.

## Goal (user-approved)
Make credit score powerful. Decisions: top-tier card limit **up to ~$2M+** (scaled by score
AND reserves); **score-tiered secured-loan APR**; **new Personal Line of Credit** product;
**operating businesses counted in net worth**.

## Progress — ALL COMPLETE (2026-06-19)
- [x] Step 0 — this dev-note
- [x] A — unified `ledgerCreditLimit()` (core ~4259) routed into all 4 sites: `useCreditCard`,
      `creditLimitEstimate`, patch `creditLimit1824`, money-banking `creditLimit()`
- [x] B — score-tiered secured-loan APR (`updateSecuredLoanRate` ~7072) + wider `creditFactor`
- [x] C — Personal Line of Credit: state init, `personalLineLimit/Rate`, `drawPersonalLineV1860`/
      `payPersonalLineV1860`, `renderPersonalLine` (in Money grid), yearly interest in the
      `resolveLifeAndFinanceYear` wrapper, `totalDebts` + finance-ledger debt row (id "personalLine",
      `setDebtValue` special-case so its object isn't clobbered)
- [x] D — finance-ledger "Operating businesses" asset row (id "business", in donut "Other");
      reverted the earlier `trustOwnedBusiness` adds (heir carry re-materializes businesses live
      via tax-legal `applyLegacyCarryV1846`:771, so the businesses row covers them — no double-count)
- [x] Verify — all 4 edited files pass `node --check`; wiring grep clean

Edited: 00-core-app-runtime.js, patches/01-patch-v18-24.js, systems/money-banking.js,
systems/finance-ledger.js. Source only — `dist/` NOT rebuilt. Next: in-game test (see Verify).

## A. One score+reserve credit-card limit (single source of truth)
Add `window.ledgerCreditLimit()` in core runtime near `availableCollateral` (~4680).
`limit = baseByScore(score) * reserveMultiplier`, cap ~$3M. reserves = `savings + finance.superSaver`.
- baseByScore (tunable): 850→700K, 800→400K, 760→140K, 720→70K, 680→30K, 650→15K, 620→6K, 580→2.5K, else 1K.
- reserveMultiplier = `1 + min(2.5, reserves/400000)`.
Route through it (each keeps an inline fallback if `window.ledgerCreditLimit` missing):
- enforce: innermost `useCreditCard` (~4256)
- display: `creditLimitEstimate` (~5146), `creditLimit1824` (patches/01 ~286), money-banking `creditLimit()`

## B. Score-tiered secured-loan APR
Edit `updateSecuredLoanRate` (~7072): base rate by score (≥760→~2%, 700–759→~3.5%, 640–699→~5.5%,
<640→~9%), keep the existing "reserves ≥ 2× loan" shave. Optionally widen `securedBorrowingLimit`
`creditFactor` (~7068). Field stays `state.finance.assetBackedLoanRate`.

## C. Personal Line of Credit (money-banking.js)
- State: `state.finance.personalLineV1860 = {balance, rate}` init in `ensureMoneyState`.
- Limit fn by score (720→50K, 760→200K, 800→750K, 850→1.5M); unlock ≥720.
- Handlers: `drawPersonalLineV1860(amount)`, `payPersonalLineV1860(amount)` (mirror useCreditCardV1837/payCreditCardV1837).
- Render section in `renderMoneyBanking()` (locked hint <720).
- Yearly interest via existing `resolveLifeAndFinanceYear` wrapper (~759).
- Debt: add to `totalDebts()` (~385) and finance-ledger `debtRows()` (~138).

## D. Businesses in net worth + reconcile trust fix
- Add "Operating businesses" asset row in finance-ledger `assetRows()` (~127):
  `sum(s.finance.businesses[].value)` (consistent with core `advancedFinanceNetWorth` ~4661).
- Revert the earlier-session `trustOwnedBusiness` adds in finance-ledger (familyTrust row ~126
  and `trustTotal` ~545) back to corpus-only — inherited businesses re-materialize live
  (tax-legal.js:771), so the new row covers them; keeping both double-counts.
- VERIFY first: `continueAsHeirV1846`/`repairLegacyCarryV1847` always re-materialize businesses
  live. If a path stores only `sourceLedger.trustOwnedBusiness` with no live object, keep a
  guarded add for just that residual.

## Verify
`node --check` each edited file. In-game (open index.html → Money hub): high score+reserves →
~$2M limit and the Use-credit button honors it; secured-loan APR differs by score; Personal Line
locked <720, works ≥760, shows as debt; Finance ledger shows an Operating businesses row; heir
flow counts the family firm exactly once.
