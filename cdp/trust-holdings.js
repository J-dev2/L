(function () {
  var out = { pass: {}, fail: [], notes: [], info: {} };
  function ok(name, cond, detail) { out.pass[name] = !!cond; if (!cond) out.fail.push(name + (detail ? ": " + detail : "")); }
  function num(v) { return Number.isFinite(Number(v)) ? Number(v) : 0; }
  function round(v) { return Math.round(num(v)); }
  function net() {
    try { if (typeof window.legacyNetWorth === "function") return round(window.legacyNetWorth()); } catch (e) {}
    return round(state && state.money);
  }
  function reset() {
    try { localStorage.removeItem("ledger_v1847_pre_succession_latest"); } catch (e) {}
    try { window.__ledgerPreSuccessionSourceV1847 = null; } catch (e2) {}
    if (typeof window.newGame === "function") window.newGame({ sandboxMode: true });
    if (typeof window.ensureStateShape === "function") window.ensureStateShape();
    state.age = 58;
    state.alive = true;
    state.money = 30000000;
    state.savings = 0;
    state.debt = 0;
    state.relationships = { heir: { name: "Morgan Hale", role: "Child", alive: true, bond: 90, trust: 90, age: 30, gender: "female", iqV1862: 124 } };
    state.legacy = state.legacy || {};
    state.legacy.familyName = "Hale";
    state.finance = state.finance || {};
    state.finance.businesses = [];
    state.finance.brokerage = 0;
    state.finance.brokerageCash = 0;
    state.finance.reV1863 = {
      version: 1863,
      nextId: 2,
      migrated: {},
      market: { listings: [], urgencyListings: [] },
      portfolio: [{ uid: "re63_test_1", name: "Legacy Tower", type: "apartment", buyPrice: 5000000, currentValue: 6000000, mortgageLeft: 1000000, strategy: "rent" }],
      lastYear: { equity: 5000000, value: 6000000, debt: 1000000 }
    };
    state.finance.bizV1860 = {
      active: true,
      yearsAsFounder: 8,
      businesses: [{ uid: "founder_test_1", name: "Hale Systems", type: "saas", model: "saas", active: true, dead: false, stage: "scale", valuation: 9000000, cashInBusiness: 1000000 }],
      activeBizId: "founder_test_1",
      skills: { vision: 5, execution: 5, salescraft: 5, leadership: 5, finance: 5, networking: 5 }
    };
    if (typeof window.ensureLegalState === "function") window.ensureLegalState();
  }

  try {
    reset();
    ok("has_trust_holding_actions",
      typeof window.createFamilyTrustV1839 === "function" &&
      typeof window.titlePropertyToTrustV1868 === "function" &&
      typeof window.titleEntrepreneurshipToTrustV1868 === "function" &&
      typeof window.legalProtectedAssetsV1839 === "function" &&
      typeof window.trustHeldPropertyValueV1868 === "function" &&
      typeof window.trustHeldEntrepreneurshipValueV1868 === "function" &&
      typeof window.continueAsHeirV1846 === "function");

    window.createFamilyTrustV1839("dynasty");
    var beforeNet = net();
    var beforeProtected = num(window.legalProtectedAssetsV1839());
    var propertyExpected = 5000000;
    var founderExpected = 10000000;

    window.titlePropertyToTrustV1868(true);
    window.titleEntrepreneurshipToTrustV1868(true);
    var afterNet = net();
    var heldProperty = num(window.trustHeldPropertyValueV1868());
    var heldFounder = num(window.trustHeldEntrepreneurshipValueV1868());
    var afterProtected = num(window.legalProtectedAssetsV1839());

    ok("property_value_titled", Math.abs(heldProperty - propertyExpected) <= 1, "held=" + heldProperty);
    ok("founder_value_titled", Math.abs(heldFounder - founderExpected) <= 1, "held=" + heldFounder);
    ok("titling_does_not_change_networth", Math.abs(afterNet - beforeNet) <= 1, "before=" + beforeNet + " after=" + afterNet);
    ok("protected_assets_include_holdings", afterProtected >= beforeProtected + propertyExpected + founderExpected - 1, "before=" + beforeProtected + " after=" + afterProtected);

    var cashBeforeDeath = num(state.money);
    state.alive = false;
    state.cause = "trust-holdings-probe";
    window.continueAsHeirV1846();

    var re = (state.finance && state.finance.reV1863) || {};
    var biz = ((state.finance && state.finance.bizV1860) || {}).businesses || [];
    var ledger = ((state.finance && state.finance.familyTrustV1839) || {}).sourceLedger || {};
    ok("property_portfolio_carried", Array.isArray(re.portfolio) && re.portfolio.length === 1 && round(num(re.portfolio[0].currentValue) - num(re.portfolio[0].mortgageLeft)) === propertyExpected, "portfolio=" + JSON.stringify(re.portfolio || []));
    ok("founder_portfolio_carried", Array.isArray(biz) && biz.length === 1 && round(num(biz[0].valuation) + num(biz[0].cashInBusiness)) === founderExpected, "biz=" + JSON.stringify(biz || []));
    ok("legacy_records_property_carry", num(state.legacy && state.legacy.lastTrustPropertyCarry) >= propertyExpected - 1, "legacy=" + JSON.stringify(state.legacy || {}));
    ok("legacy_records_founder_carry", num(state.legacy && state.legacy.lastTrustEntrepreneurshipCarry) >= founderExpected - 1, "legacy=" + JSON.stringify(state.legacy || {}));
    ok("ledger_records_property", num(ledger.trustHeldProperty) >= propertyExpected - 1, "ledger=" + JSON.stringify(ledger));
    ok("ledger_records_founder", num(ledger.trustHeldEntrepreneurship) >= founderExpected - 1, "ledger=" + JSON.stringify(ledger));
    ok("cash_inheritance_excludes_titled_holdings", num(state.legacy && state.legacy.lastInheritance) <= cashBeforeDeath + 1, "cashBefore=" + cashBeforeDeath + " inherited=" + num(state.legacy && state.legacy.lastInheritance));

    out.info = {
      beforeNet: beforeNet,
      afterNet: afterNet,
      protectedBefore: beforeProtected,
      protectedAfter: afterProtected,
      heldProperty: heldProperty,
      heldFounder: heldFounder,
      cashBeforeDeath: cashBeforeDeath,
      cashInheritance: num(state.legacy && state.legacy.lastInheritance)
    };
    out.summary = { total: Object.keys(out.pass).length, passed: Object.keys(out.pass).filter(function (k) { return out.pass[k]; }).length, failed: out.fail.length };
  } catch (e) {
    out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0, 8).join(" || ") : "");
  }
  return out;
})();
