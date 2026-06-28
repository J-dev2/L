(function () {
  var out = { pass: {}, fail: [], notes: [], info: {} };
  function ok(name, cond, detail) { out.pass[name] = !!cond; if (!cond) out.fail.push(name + (detail ? ": " + detail : "")); }
  function num(v) { return Number.isFinite(Number(v)) ? Number(v) : 0; }
  function round(v) { return Math.round(num(v)); }
  function trust() { return ((state && state.finance) || {}).familyTrustV1839 || {}; }
  function operatorComp(gross, salary, feeRate, cap) {
    gross = Math.max(0, round(gross));
    cap = cap || 1000000000;
    var paidSalary = Math.min(gross, cap, round(salary));
    var fee = Math.min(Math.max(0, gross - paidSalary), Math.max(0, cap - paidSalary), round(gross * feeRate));
    return { salary: paidSalary, fee: fee, comp: paidSalary + fee, net: Math.max(0, gross - paidSalary - fee) };
  }
  function net() {
    try { if (typeof window.legacyNetWorth === "function") return round(window.legacyNetWorth()); } catch (e) {}
    try { if (typeof window.financeNetWorth === "function") return round(window.financeNetWorth()); } catch (e2) {}
    return round(state && state.money);
  }
  function renderTrust() {
    try {
      if (typeof window.setTabV16 === "function") window.setTabV16("trust");
      else { window.tab = "trust"; if (typeof window.render === "function") window.render(); }
    } catch (e) { out.notes.push("renderTrust threw " + e); }
  }
  function setup() {
    try { localStorage.removeItem("ledger_v1847_pre_succession_latest"); } catch (e) {}
    try { window.__ledgerPreSuccessionSourceV1847 = null; } catch (e2) {}
    if (typeof window.newGame === "function") window.newGame({ sandboxMode: true });
    if (typeof window.ensureStateShape === "function") window.ensureStateShape();
    state.age = 58;
    state.alive = true;
    state.money = 50000000;
    state.savings = 0;
    state.debt = 0;
    state.relationships = {
      heir: { name: "Avery Vale", role: "Child", alive: true, bond: 90, trust: 90, age: 28, gender: "female", iqV1862: 122 }
    };
    state.legacy = state.legacy || {};
    state.legacy.familyName = "Vale";
    state.finance = state.finance || {};
    state.finance.businesses = [];
    state.finance.brokerage = 0;
    state.finance.brokerageCash = 0;
    state.finance.bizV1860 = {
      active: true,
      yearsAsFounder: 6,
      businesses: [
        { uid: "founder_alpha", name: "Alpha Labs", type: "saas", model: "saas", active: true, dead: false, stage: "scale", valuation: 12000000, cashInBusiness: 3000000 },
        { uid: "founder_beta", sourceKeyV1861: "legacy:beta", name: "Beta Works", type: "fintech", model: "saas", active: true, dead: false, stage: "growth", valuation: 5000000, cashInBusiness: 1000000 }
      ],
      activeBizId: "founder_alpha",
      skills: { vision: 5, execution: 5, salescraft: 5, leadership: 5, finance: 5, networking: 5 }
    };
    if (typeof window.ensureLegalState === "function") window.ensureLegalState();
    window.createFamilyTrustV1839("dynasty");
  }

  try {
    setup();
    ok("has_family_office_functions",
      typeof window.openFamilyOfficeV1872 === "function" &&
      typeof window.hireOperatorV1872 === "function" &&
      typeof window.titleEntrepreneurshipCompanyV1872 === "function" &&
      typeof window.trustHeldEntrepreneurshipValueV1868 === "function");

    renderTrust();
    var launcherCount = document.querySelectorAll('[data-fo72-panel="launcher"]').length;
    var opCount = document.querySelectorAll('[data-fo72-panel="operator"]').length;
    var founderCount = document.querySelectorAll('[data-fo72-panel="founder"]').length;
    var looseCount = document.querySelectorAll('#app > section[data-fo72-panel], #app > .fo72-trust-desks').length;
    var founderHtml = (document.querySelector('[data-fo72-panel="founder"]') || {}).innerHTML || "";
    ok("trust_ui_has_one_family_office_launcher", launcherCount === 1, "launcherCount=" + launcherCount);
    ok("trust_ui_has_one_operator_desk", opCount === 1, "opCount=" + opCount);
    ok("trust_ui_has_one_founder_picker", founderCount === 1, "founderCount=" + founderCount);
    ok("no_loose_family_office_panels_after_overlay", looseCount === 0, "looseCount=" + looseCount);
    ok("founder_picker_uses_real_uid", founderHtml.indexOf("founder_alpha") >= 0 && founderHtml.indexOf("'undefined'") < 0, "html=" + founderHtml.slice(0, 220));

    var beforeNet = net();
    window.titleEntrepreneurshipCompanyV1872("founder_alpha", true);
    var afterNet = net();
    var ent = ((trust().holdingsV1868 || {}).entrepreneurship || {});
    var map = ent.companiesV1872 || {};
    var held = num(window.trustHeldEntrepreneurshipValueV1868());
    ok("per_company_map_uses_uid", map.founder_alpha === true && !map.undefined, "map=" + JSON.stringify(map));
    ok("per_company_value_only_selected", held === 15000000, "held=" + held);
    ok("per_company_titling_networth_neutral", Math.abs(afterNet - beforeNet) <= 1, "before=" + beforeNet + " after=" + afterNet);

    renderTrust();
    founderHtml = (document.querySelector('[data-fo72-panel="founder"]') || {}).innerHTML || "";
    ok("rerender_keeps_single_operator_desk", document.querySelectorAll('[data-fo72-panel="operator"]').length === 1);
    ok("rerender_keeps_valid_founder_button", founderHtml.indexOf("founder_alpha") >= 0 && founderHtml.indexOf("'undefined'") < 0, "html=" + founderHtml.slice(0, 220));

    window.openFamilyOfficeV1872();
    var pop = document.getElementById("fo72-pop");
    var popBody = document.getElementById("fo72-body");
    ok("holdings_popup_opens", !!(pop && pop.style.display === "flex" && popBody && popBody.textContent.indexOf("Titled entrepreneurship") >= 0));
    if (typeof window.closeFamilyOfficeV1872 === "function") window.closeFamilyOfficeV1872();

    var moneyBeforeHire = num(state.money);
    window.hireOperatorV1872("associate");
    var op = trust().operatorV1872 || {};
    ok("operator_hired", op.hired === true && op.tier === "associate", "op=" + JSON.stringify(op));
    ok("operator_hire_cost_charged", num(state.money) === moneyBeforeHire - 50000, "money=" + num(state.money));
    ok("operator_has_negotiable_comp", num(op.salary) === 150000 && Math.abs(num(op.feeRate) - 0.15) < 0.001 && num(op.compCap) === 1000000000, "op=" + JSON.stringify(op));
    window.setOperatorCompPresetV1872("lower_salary");
    op = trust().operatorV1872 || {};
    ok("operator_comp_preset_changes_salary_and_fee", num(op.salary) === 75000 && Math.abs(num(op.feeRate) - 0.18) < 0.001, "op=" + JSON.stringify(op));
    var corpusBefore = num(trust().corpus);
    state.age += 1;
    if (typeof window.resolveLifeAndFinanceYear === "function") window.resolveLifeAndFinanceYear();
    var heldAfterFirstYear = num(window.trustHeldEntrepreneurshipValueV1868());
    var expectedGross = round(heldAfterFirstYear * 0.025);
    var expectedComp = operatorComp(expectedGross, 75000, 0.18);
    var expectedFee = expectedComp.fee;
    var expectedNet = expectedComp.net;
    var corpusAfter = num(trust().corpus);
    var opAfterFirst = trust().operatorV1872 || {};
    ok("operator_records_expected_return", num(opAfterFirst.lastReturn) === expectedNet && num(opAfterFirst.lastSalary) === expectedComp.salary && num(opAfterFirst.lastFee) === expectedFee && num(opAfterFirst.lastComp) === expectedComp.comp, "op=" + JSON.stringify(opAfterFirst) + " expectedNet=" + expectedNet + " expectedFee=" + expectedFee);
    ok("operator_adds_to_corpus", corpusAfter > corpusBefore, "before=" + corpusBefore + " after=" + corpusAfter);
    var totalGrownAfterFirst = num(opAfterFirst.totalGrown);
    if (typeof window.resolveLifeAndFinanceYear === "function") window.resolveLifeAndFinanceYear();
    ok("operator_runs_once_per_age", num((trust().operatorV1872 || {}).totalGrown) === totalGrownAfterFirst, "afterSecond=" + num((trust().operatorV1872 || {}).totalGrown) + " afterFirst=" + totalGrownAfterFirst);

    state.money += 10000000;
    window.hireOperatorV1872("chief");
    op = trust().operatorV1872 || {};
    op.salary = 2000000000;
    op.feeRate = 1;
    state.finance.bizV1860.businesses[0].valuation = 50000000000;
    state.age += 1;
    if (typeof window.resolveLifeAndFinanceYear === "function") window.resolveLifeAndFinanceYear();
    op = trust().operatorV1872 || {};
    ok("operator_compensation_cap_is_one_billion", num(op.lastComp) <= 1000000000 && num(op.lastSalary) <= 1000000000, "op=" + JSON.stringify(op));

    var heldAtDeath = num(window.trustHeldEntrepreneurshipValueV1868());
    state.alive = false;
    state.cause = "family-office-probe";
    window.continueAsHeirV1846();
    var carried = (((state.finance || {}).bizV1860 || {}).businesses) || [];
    ok("succession_carries_only_selected_founder_company", carried.length === 1 && carried[0].uid === "founder_alpha", "carried=" + JSON.stringify(carried));
    ok("legacy_records_selected_founder_value", Math.abs(num(state.legacy && state.legacy.lastTrustEntrepreneurshipCarry) - heldAtDeath) <= 1, "heldAtDeath=" + heldAtDeath + " legacy=" + JSON.stringify(state.legacy || {}));
    ok("operator_state_survives_trust_carry", !!(((state.finance || {}).familyTrustV1839 || {}).operatorV1872 || {}).hired);

    out.info = {
      held: held,
      beforeNet: beforeNet,
      afterNet: afterNet,
      expectedOperatorNet: expectedNet,
      carriedCount: carried.length
    };
    out.summary = { total: Object.keys(out.pass).length, passed: Object.keys(out.pass).filter(function (k) { return out.pass[k]; }).length, failed: out.fail.length };
  } catch (e) {
    out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0, 8).join(" || ") : "");
  }
  return out;
})();
