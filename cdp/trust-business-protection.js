(function () {
  var out = { pass: {}, fail: [], notes: [], info: {} };
  function ok(name, cond, detail) { out.pass[name] = !!cond; if (!cond) out.fail.push(name + (detail ? ": " + detail : "")); }
  function num(v) { return Number.isFinite(Number(v)) ? Number(v) : 0; }
  function round(v) { return Math.round(num(v)); }
  function bizValue(b) { return Math.max(0, round(num(b && b.value) + num(b && b.retainedEarnings))); }
  function net() {
    try { if (typeof window.legacyNetWorth === "function") return round(window.legacyNetWorth()); } catch (e) {}
    return round(state && state.money);
  }
  function clearRepairBackups() {
    try {
      localStorage.removeItem("ledger_v1847_pre_succession_latest");
      for (var i = 1; i <= 5; i += 1) localStorage.removeItem("ledger_v1847_pre_succession_slot_" + i);
    } catch (e) {}
    try { window.__ledgerPreSuccessionSourceV1847 = null; } catch (e2) {}
  }
  function reset() {
    clearRepairBackups();
    if (typeof window.newGame === "function") window.newGame({ sandboxMode: true });
    if (typeof window.ensureStateShape === "function") window.ensureStateShape();
    state.age = 62;
    state.alive = true;
    state.money = 10000000;
    state.savings = 0;
    state.debt = 0;
    state.relationships = {
      heir: { name: "Ari Vance", role: "Child", alive: true, bond: 90, trust: 90, age: 31, gender: "female", iqV1862: 122 }
    };
    state.legacy = state.legacy || {};
    state.legacy.familyName = "Vance";
    state.finance = state.finance || {};
    state.finance.brokerage = 0;
    state.finance.brokerageCash = 0;
    state.finance.businesses = [{
      id: "dynasty_holdco",
      name: "Dynasty HoldCo",
      category: "Holding Company",
      value: 500000000000,
      retainedEarnings: 0,
      reputation: 80,
      years: 18,
      stage: "mature",
      familyV1833: { trustPercent: 0, successor: "heir", readiness: 80, continuity: 90, board: true }
    }];
    if (typeof window.ensureLegalState === "function") window.ensureLegalState();
  }

  try {
    reset();

    ok("has_required_globals",
      typeof window.createFamilyTrustV1839 === "function" &&
      typeof window.setBusinessTrustPercentV1840 === "function" &&
      typeof window.businessTrustValueV1840 === "function" &&
      typeof window.legalProtectedAssetsV1839 === "function" &&
      typeof window.continueAsHeirV1846 === "function" &&
      typeof window.repairLegacyCarryV1847 === "function");

    var b0 = state.finance.businesses[0];
    var expectedBiz = bizValue(b0);
    ok("setup_large_business", expectedBiz === 500000000000, "business=" + expectedBiz);

    window.createFamilyTrustV1839("dynasty");
    ok("dynasty_trust_created", state.finance.familyTrustV1839 && state.finance.familyTrustV1839.created && state.finance.familyTrustV1839.plan === "dynasty");

    var beforeTitleNet = net();
    var beforeTitleCash = num(state.money);
    var beforeProtected = num(window.legalProtectedAssetsV1839());
    window.setBusinessTrustPercentV1840("dynasty_holdco", 100);
    var titleCost = beforeTitleCash - num(state.money);
    var afterTitleNet = net();
    var titledValue = num(window.businessTrustValueV1840());
    var afterProtected = num(window.legalProtectedAssetsV1839());

    ok("title_sets_100pct", Math.abs(num(state.finance.businesses[0].familyV1833.trustPercent) - 1) < 0.0001);
    ok("title_cost_is_only_networth_change", Math.abs(afterTitleNet - (beforeTitleNet - titleCost)) <= 1, "before=" + beforeTitleNet + " after=" + afterTitleNet + " cost=" + titleCost);
    ok("business_trust_value_matches_business", Math.abs(titledValue - expectedBiz) <= 1, "titled=" + titledValue + " expected=" + expectedBiz);
    ok("protected_assets_include_titled_business", afterProtected >= beforeProtected + expectedBiz - 1, "before=" + beforeProtected + " after=" + afterProtected + " business=" + expectedBiz);
    ok("protected_assets_do_not_exceed_networth", afterProtected <= afterTitleNet + 1, "protected=" + afterProtected + " net=" + afterTitleNet);

    var oldNet = afterTitleNet;
    var cashBeforeDeath = num(state.money);
    state.alive = false;
    state.cause = "verification";

    window.continueAsHeirV1846();
    var inheritedBiz = (state.finance.businesses || []).filter(function (b) { return b && b.id === "dynasty_holdco"; })[0];
    var inheritedValue = bizValue(inheritedBiz);
    var inheritedTrustPct = num(inheritedBiz && inheritedBiz.familyV1833 && inheritedBiz.familyV1833.trustPercent);
    var sourceLedger = (state.finance.familyTrustV1839 && state.finance.familyTrustV1839.sourceLedger) || {};

    ok("heir_alive_generation_two", state.alive === true && num(state.legacy && state.legacy.generation) >= 2, "alive=" + state.alive + " gen=" + (state.legacy && state.legacy.generation));
    ok("business_survives_succession", !!inheritedBiz && Math.abs(inheritedValue - expectedBiz) <= 1, "inherited=" + inheritedValue + " expected=" + expectedBiz);
    ok("trust_percent_survives_succession", Math.abs(inheritedTrustPct - 1) < 0.0001, "pct=" + inheritedTrustPct);
    ok("legacy_records_business_carry", num(state.legacy && state.legacy.lastBusinessCarry) >= expectedBiz - 1, "lastBusinessCarry=" + num(state.legacy && state.legacy.lastBusinessCarry));
    ok("legacy_records_trust_business_carry", num(state.legacy && state.legacy.lastTrustBusinessCarry) >= expectedBiz - 1, "lastTrustBusinessCarry=" + num(state.legacy && state.legacy.lastTrustBusinessCarry));
    ok("trust_source_ledger_records_titled_business", num(sourceLedger.trustOwnedBusiness) >= expectedBiz - 1, "sourceLedger=" + JSON.stringify(sourceLedger));
    ok("heir_networth_keeps_business_value", net() >= expectedBiz - 1, "oldNet=" + oldNet + " heirNet=" + net());
    ok("cash_inheritance_excludes_carried_business", num(state.legacy && state.legacy.lastInheritance) <= cashBeforeDeath + 1, "cashBeforeDeath=" + cashBeforeDeath + " inheritedCash=" + num(state.legacy && state.legacy.lastInheritance));

    var messages = [];
    var prevToast = window.addToast;
    window.addToast = function (message) { messages.push(String(message)); };
    try { addToast = window.addToast; } catch (eToast) {}
    var repairBeforeNet = net();
    var repairBeforeCount = (state.finance.businesses || []).length;
    window.repairLegacyCarryV1847();
    var repairAfterNet = net();
    var repairAfterCount = (state.finance.businesses || []).length;
    ok("repair_reports_already_carried", messages.some(function (m) { return /already as large/i.test(m); }), messages.join(" | "));
    ok("repair_does_not_duplicate_business", repairAfterCount === repairBeforeCount, "count " + repairBeforeCount + " -> " + repairAfterCount);
    ok("repair_does_not_change_networth", Math.abs(repairAfterNet - repairBeforeNet) <= 1, "net " + repairBeforeNet + " -> " + repairAfterNet);
    window.addToast = prevToast;
    try { addToast = prevToast; } catch (eToast2) {}

    out.info = {
      titleCost: titleCost,
      titledValue: titledValue,
      protectedBeforeTitle: beforeProtected,
      protectedAfterTitle: afterProtected,
      oldNetWorth: oldNet,
      heirNetWorth: net(),
      cashBeforeDeath: cashBeforeDeath,
      cashInheritance: num(state.legacy && state.legacy.lastInheritance),
      trustOwnedBusinessLedger: num(sourceLedger.trustOwnedBusiness)
    };
    out.summary = {
      total: Object.keys(out.pass).length,
      passed: Object.keys(out.pass).filter(function (k) { return out.pass[k]; }).length,
      failed: out.fail.length
    };
  } catch (e) {
    out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0, 8).join(" || ") : "");
  }
  return out;
})();
