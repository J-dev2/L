# Trust Envelope — "Family Office Holdings" plan

Goal (user request): let the **family trust hold everything** — title the **real-estate property
portfolio** and the **entrepreneurship portfolio** into the trust the same way businesses can already be
titled, so the trust becomes the protected holding vehicle / collection for all asset classes.

> Author: Claude (untested side — sandbox out of disk space). Implement + verify on the tested side (Codex)
> with the trust/death/net-worth CDP probes. This is a DESIGN doc, not shipped code.

---

## 0. HARD PREREQUISITE — fix the persistence bug first

Do **not** load property/venture value into the trust until the **Repair-Carry "never recovers" /
balance-loss bug is fixed** (SESSION_SUMMARY CP39, task #20). Symptom: the trust corpus/balance is lost
(shows empty when the player actually holds hundreds of billions titled in), and `repairLegacyCarryV1847`
restores it — implying the stored carry value drops below the recoverable source every year.

Reason: enveloping the property + entrepreneurship portfolios pours **far more value** into the trust. If
the trust still loses its balance, you multiply the data-loss. Fix the trust's value persistence first,
then build this on a foundation that actually holds its value.

Likely fix areas for #20 (verify in source): `trustCarryValueV1846`, `businessCarryValueV1846`,
`trustBusinessCarryValueV1846`, `applyLegacyCarryV1846`, and how the carry is *stored vs recomputed* across
the yearly tick / succession (`continueAsHeirV1846`). Ensure the carried value is persisted on the heir
state and not recomputed-to-zero.

---

## 1. The ONE critical rule — protect, do NOT re-add (no double count)

Property equity and entrepreneurship value are **already counted once** in net worth:

- Property: `window.reEquityV1862()` / `reEquityV1863()` → `reEquityNW` in `legacyNetWorth`
  (`pages/runtime/00-core-app-runtime.js`).
- Entrepreneurship/founder companies: `f.bizV1860.businesses` → `newBizValue` in `legacyNetWorth`.
- Trust corpus/funds: `trustAssets` in `legacyNetWorth`; `window.legalProtectedAssetsV1839()` in
  `tax-legal.js`.

**Titling an asset into the trust must be a PROTECTION + CARRY flag, never a net-worth addition.** The asset
keeps being counted exactly once via its own equity/value; the trust flag only changes:

1. **Protection** — titled value counts in `protectedAssets()` so it's shielded from estate tax on death
   (see `personalInheritanceCashV1846` / the death settlement in `08-patch-v18-31.js`).
2. **Carry** — titled value carries to the heir through the trust on succession (extend
   `applyLegacyCarryV1846`), instead of being taxed as a personal estate.
3. **Display** — a trust "Holdings" view lists the titled portfolios.

If you instead add titled property/venture value to the trust corpus, you will **double-count** it in net
worth (once as equity, once as corpus). This is the exact trap the AI handoff's `save-finance-integration.md`
warns about ("Do not count both carried source value and rematerialized live object").

Model to copy: **business titling already works this way** — `setBusinessTrustPercentV1840` /
`businessTrustPercentV1840`, surfaced through `legalProtectedAssetsV1839`. Extend that pattern; don't invent
a parallel one.

---

## 2. State (versioned, lazy, save-safe)

On `familyTrustV1839` add a holdings descriptor (lazy-init in the trust ensure block):

```js
trust.holdingsV1868 = trust.holdingsV1868 || {
  property: { titled: false, pct: 1 },        // share of property EQUITY titled to the trust (0..1)
  entrepreneurship: { titled: false, pct: 1 } // share of founder-company value titled to the trust
};
```

- `pct` allows partial titling (mirror the business % model). Start with a simple on/off (pct 1) if you
  want; keep the field for future granularity.
- Lazy-init + `n()`/guard reads so old saves are unaffected until the player titles something.

---

## 3. Helpers (in `tax-legal.js`, next to the business-titling helpers)

```js
function trustHeldPropertyValue() {
  var h = trust.holdingsV1868 && trust.holdingsV1868.property;
  if (!h || !h.titled) return 0;
  var eq = (typeof window.reEquityV1863 === "function") ? window.reEquityV1863()
         : (typeof window.reEquityV1862 === "function") ? window.reEquityV1862() : 0;
  return Math.max(0, Math.round(n(eq) * clamp(n(h.pct, 1), 0, 1)));
}
function trustHeldVentureValue() {
  var h = trust.holdingsV1868 && trust.holdingsV1868.entrepreneurship;
  if (!h || !h.titled) return 0;
  // Use the SAME founder-company valuation legacyNetWorth uses (f.bizV1860 active companies),
  // so the protected figure matches what's already counted. Read it from a shared accessor if one
  // exists; otherwise compute identically to newBizValue in legacyNetWorth.
  return Math.max(0, Math.round(n(window.entrepreneurshipNetValueV18xx && window.entrepreneurshipNetValueV18xx()) * clamp(n(h.pct,1),0,1)));
}
```

(If no shared `entrepreneurshipNetValueV18xx` accessor exists, add one in `entrepreneur.js` that returns the
exact same sum `legacyNetWorth` uses for `newBizValue`, and call it from both places so they can never
drift.)

---

## 4. Integration points (each is "mark protected", not "add value")

1. **`protectedAssets()` / `legalProtectedAssetsV1839()`** — add `trustHeldPropertyValue()` +
   `trustHeldVentureValue()` to the protected total. This shields them from estate tax and shows them as
   protected.
2. **Net worth (`legacyNetWorth`)** — **NO CHANGE to the total.** Property equity and venture value are
   already in `assets`. Do not add the titled value again. (Optional: if you ever move titled value OUT of
   the live equity rows and INTO the corpus, you must remove it from the live rows in the same change —
   but the simpler, safer design is leave-in-place + flag-as-protected.)
3. **Death settlement** (`personalInheritanceCashV1846`, `08-patch-v18-31.js` `estateSettlement`) — titled
   property/venture value is part of `protectedValue`, removed from the taxable estate (mirrors how the
   family-trust corpus already reduces `estateTaxBase`).
4. **Carry to heir** (`applyLegacyCarryV1846`) — carry the titled portfolios to the heir as protected trust
   holdings, not as taxed personal estate. Reuse `trustBusinessCarryValueV1846`'s pattern for the property
   and venture sleeves. **This must persist on the heir state (the #20 fix).**

---

## 5. UI (trust hub, `renderTrustHub` in `tax-legal.js`)

Add a "Holdings" desk near the business-titling desk:

- **Title property portfolio to trust** toggle → `window.titlePropertyToTrustV1868()` sets
  `holdings.property.titled`. Show "Protected: <equity>".
- **Title entrepreneurship to trust** toggle → `window.titleEntrepreneurshipToTrustV1868()`. Show
  "Protected: <venture value>".
- A combined "Family office holdings" summary: corpus + held property + held venture + held business =
  total protected, with the estate-tax shield it provides. Use emoji headers (🏛 trust, 🏠 property,
  🚀 ventures, 🏢 business) for the human touch the user asked for elsewhere.

Keep actions scroll-preserving (`renderHubInPlaceV16` pattern) and save after each toggle.

---

## 6. Save-safety + migration checklist

- Lazy-init `holdingsV1868`; guard every read (`trust.holdingsV1868 && ...`).
- No breaking change to existing saves (untitled = current behavior).
- Idempotent: titling twice = titled once.
- Versioned keys (`...V1868`).

## 7. Testing checklist (TESTED SIDE — this is why it can't ship from the untested side)

- Net worth is **identical** before/after titling (no double count). Assert
  `legacyNetWorth()` unchanged when you flip a title on, with a non-trivial property + venture portfolio.
- `legalProtectedAssetsV1839()` increases by exactly the titled equity/venture value.
- Death with titled portfolios: estate tax drops (protected), heir receives the holdings, **and the
  balance persists across the next year** (the #20 regression).
- Old save without `holdingsV1868` loads and behaves as before.
- Run `cdp/trust.js`, `cdp/estate-trust.js`, `cdp/death.js`, `cdp/networth-genetics.js`, plus a new
  `cdp/trust-holdings.js` covering the four assertions above.

---

## TL;DR for the implementer
Fix the trust balance-persistence bug (#20) first. Then add a `holdingsV1868` flag on `familyTrustV1839`,
make titled property equity + venture value count as **protected + carried** (extend `protectedAssets`,
the death settlement, and `applyLegacyCarryV1846`) **without adding them to net worth a second time**, mirror
the existing business-titling pattern, and verify net worth is unchanged on toggle. Then ship the trust
"Family office holdings" UI.
