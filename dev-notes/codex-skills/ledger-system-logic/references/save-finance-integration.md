# Ledger Save and Finance Integration

Use this reference when a feature touches persistence, money, assets, debts, net
worth, inheritance, businesses, stocks, taxes, or trusts.

## Table of Contents

1. Save Compatibility
2. Lazy State
3. Versioned Feature Keys
4. Money Buckets
5. Net Worth Rules
6. Debt Rules
7. Business Rules
8. Stock Rules
9. Trust and Inheritance Rules
10. Tax and Legal Rules
11. Migration Safety
12. Testing Checklist

## 1. Save Compatibility

Assume saves are old, partial, and weird.

Any new code should survive:

- missing `state.finance`,
- missing arrays,
- missing nested objects,
- invalid numeric fields,
- old migrated records,
- duplicate businesses,
- inactive feature state,
- undefined optional systems.

Never require players to restart unless the user explicitly accepts a breaking
change.

## 2. Lazy State

Use lazy state creation.

Pattern:

```js
function ensureCrimeState() {
  var f = state.finance || (state.finance = {});
  if (!f.crimeV1862 || typeof f.crimeV1862 !== "object" || Array.isArray(f.crimeV1862)) {
    f.crimeV1862 = {};
  }
  var c = f.crimeV1862;
  if (!Array.isArray(c.history)) c.history = [];
  if (!Array.isArray(c.crew)) c.crew = [];
  c.heat = safeNum(c.heat, 0);
  return c;
}
```

Adapt helper names to local style.

Do not overwrite existing user progress.

## 3. Versioned Feature Keys

Use versioned keys for major new systems.

Benefits:

- avoids collisions,
- makes migration clear,
- lets old systems coexist temporarily,
- helps future agents identify ownership.

Examples:

- `startupV1856`
- `bizV1860`
- `crimeV1862`
- `boxingV1862`

Do not obsess over exact version number, but follow local convention.

## 4. Money Buckets

Common buckets:

- personal cash,
- checking/savings,
- business cash,
- trust corpus,
- company valuation,
- stock holdings,
- debt,
- dirty money,
- estate value,
- family office holdings.

Rules:

- Spendable cash can pay normal costs.
- Business cash should not automatically be personal cash.
- Valuation is not cash.
- Dirty money may need laundering before normal use.
- Debt lowers net worth but may create cash.
- Trust assets may not be directly spendable.

## 5. Net Worth Rules

Before adding net worth:

1. Identify ownership.
2. Identify liquidity.
3. Identify whether another row already counts it.
4. Identify whether value should be full enterprise value or player stake.
5. Identify whether debt offsets it.

Examples:

- A private company may count by player-owned valuation.
- A public founder company should count by player stake/shares.
- Trust business value should not be double-counted if it rematerializes as a
  live business.
- Dirty money may count differently than clean assets, depending on design.

Document the decision in code comments or dev notes if non-obvious.

## 6. Debt Rules

Debt should have:

- balance,
- rate if interest-bearing,
- owner,
- payment path,
- default consequence,
- finance ledger row if meaningful.

Debt examples:

- credit card,
- personal line,
- secured loan,
- business loan,
- estate debt,
- legal debt,
- crime debt to a lender.

Do not store debt as a negative asset unless local code already expects that.

## 7. Business Rules

Business systems are sensitive.

Current split:

- Business hub owns managed companies/entities/trust/family enterprise.
- Entrepreneurship owns founder journey/founder companies/IPO/self-stock.

Avoid:

- migrating Business companies into Entrepreneurship accidentally,
- double-ticking company income,
- counting public company enterprise value and stock holding at the same time,
- hiding company cash as personal cash.

When adding a new feature that creates businesses, decide which system owns
them.

## 8. Stock Rules

Stocks can affect:

- holdings,
- prices,
- history,
- net worth,
- public company display,
- buy/sell logic.

If a feature creates a custom ticker:

- ensure the portfolio can display it,
- ensure buy/sell path exists or explain where trading lives,
- ensure price history updates,
- ensure net worth counts it once,
- ensure missing catalog data does not crash.

## 9. Trust and Inheritance Rules

Trust/inheritance systems can carry value across generations.

Be careful with:

- corpus,
- child trusts,
- trust businesses,
- estate transfers,
- heir continuation,
- family fund,
- legacy carry.

When value is carried to an heir, check whether it is:

- direct cash,
- trust corpus,
- live business object,
- source ledger note,
- asset row.

Do not count both carried source value and rematerialized live object unless the
design explicitly requires it.

## 10. Tax and Legal Rules

Tax/legal systems should make risk understandable.

Features may touch:

- attorneys,
- accountants,
- tax debt,
- legal defense,
- audit risk,
- scandal,
- residence,
- family office tax planning.

If a feature creates illegal or gray money, decide:

- whether taxes apply,
- whether legal defense helps,
- whether audit risk rises,
- whether accountant quality matters.

## 11. Migration Safety

Migration checklist:

- Detect old state.
- Create new state lazily.
- Copy only meaningful values.
- Preserve original if uncertain.
- Mark migrated records if old tick paths remain.
- Gate old tick paths.
- Add repair function for duplicates.
- Make migration idempotent.
- Test running migration twice.

Do not write migrations that assume perfect old data.

## 12. Testing Checklist

For save/finance changes, test:

- empty fresh save,
- old save missing feature object,
- save with partial nested object,
- action spends cash correctly,
- action refuses when cash is insufficient,
- yearly interest/income applies once,
- net worth changes once,
- debt row updates,
- asset row updates,
- rebuild includes source changes.

If browser testing is available, also check:

- no console errors,
- relevant hub renders,
- finance ledger renders,
- More summary renders,
- save/reload preserves state.
