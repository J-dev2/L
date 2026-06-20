(function () {
  var out = { pass: {}, fail: [], notes: [] };
  function ok(name, cond, detail) { out.pass[name] = !!cond; if (!cond) out.fail.push(name + (detail ? (": " + detail) : "")); }
  try {
    if (typeof window.newGame === "function") window.newGame({});
    if (typeof ensureStateShape === "function") ensureStateShape();
    var S = state;
    var E = window.EntrepreneurV1861;
    ok("new_entrepreneur_loaded", !!E && typeof window.renderEntrepreneurHubV1861 === "function");
    ok("old_business_hub_loaded", typeof window.renderBusinessHubV1840 === "function");

    S.age = 30; S.stats = S.stats || {}; S.stats.smarts = 80; S.stats.karma = 60; S.money = 500000;
    if (!S.finance) S.finance = {};
    var catId = (typeof entrepreneurshipCatalog !== "undefined" && entrepreneurshipCatalog[0]) ? entrepreneurshipCatalog[0].id : null;
    out.notes.push("catId=" + catId);

    // ===== ROUTE SEPARATION =====
    var bizHtml = "", entHtml = "";
    try { bizHtml = window.renderHubContent("business"); } catch (e) { out.notes.push("biz render err " + e); }
    try { entHtml = window.renderHubContent("entrepreneurship"); } catch (e) { out.notes.push("ent render err " + e); }
    ok("business_route_is_old_hub", typeof bizHtml === "string" && bizHtml.indexOf("v1840-business-shell") >= 0, "len=" + (bizHtml ? bizHtml.length : 0));
    ok("business_route_not_new_hub", typeof bizHtml === "string" && bizHtml.indexOf("biz1861-shell") < 0);
    ok("entrepreneurship_route_is_new_hub", typeof entHtml === "string" && entHtml.indexOf("biz1861-shell") >= 0, "len=" + (entHtml ? entHtml.length : 0));
    ok("routes_are_different", bizHtml !== entHtml);

    // ===== OLD BUSINESS COMPANIES STAY IN BUSINESS, EARN, NOT MIGRATED =====
    S.finance.bizV1860 = undefined;
    S.finance.businesses = [{ id: catId, name: "LegacyCo", value: 200000, reputation: 60, years: 4, lastIncome: 0 }];
    S.finance.startupV1856 = undefined;
    window.renderEntrepreneurHubV1861(); // triggers initBiz -> migration logic
    var legacyObj = S.finance.businesses[0];
    ok("old_business_not_migrated", !(legacyObj && legacyObj._migratedToBizV1861));
    var B = S.finance.bizV1860;
    ok("old_business_absent_from_new_portfolio", !B || !(B.businesses || []).some(function (b) { return b.name === "LegacyCo"; }));
    S.actionsTaken = {}; S.age += 1;
    try { window.resolveLifeAndFinanceYear(); } catch (e) { out.notes.push("biz tick err " + e); }
    var legacyIncome = Math.round(S.finance.lastBusinessIncome || 0);
    ok("old_business_still_earns_income", legacyIncome > 0, "lastBusinessIncome=" + legacyIncome);

    // ===== OLD FOUNDER STARTUP MIGRATES INTO ENTREPRENEURSHIP (continuity) =====
    S.finance.bizV1860 = undefined;
    S.finance.businesses = [];
    S.finance.startupV1856 = { co: { name: "FounderCo", type: "saas", stage: "growth", productStage: "launched", revenue: 500000, valuation: 4000000, cash: 200000, equity: 80, productDev: 320, productQuality: 60 }, history: [], founderRep: 30 };
    window.renderEntrepreneurHubV1861();
    var B2 = S.finance.bizV1860;
    var migStartup = B2 && (B2.businesses || []).find(function (b) { return b.sourceSystemV1861 === "startupV1856"; });
    ok("founder_startup_migrated", !!migStartup);
    ok("founder_startup_stage_mapped", !!(migStartup && migStartup.stage === "growth"), migStartup ? migStartup.stage : "none");
    ok("founder_startup_flagged_in_old", !!(S.finance.startupV1856 && S.finance.startupV1856._migratedToBizV1861));
    var yBefore = migStartup ? (migStartup.yearsOld || 0) : 0;
    S.actionsTaken = {}; S.age += 1;
    try { window.resolveLifeAndFinanceYear(); } catch (e) { out.notes.push("startup tick err " + e); }
    var yAfter = migStartup ? (migStartup.yearsOld || 0) : 0;
    ok("startup_ticked_by_new_engine", yAfter > yBefore, "yearsOld " + yBefore + "->" + yAfter);
    ok("startup_still_flagged_no_double_tick", !!(S.finance.startupV1856.co && S.finance.startupV1856._migratedToBizV1861));

    // ===== DUPLICATE REPAIR (unchanged) =====
    var dup = B2 && (B2.businesses || [])[0];
    if (dup) {
      var c1 = JSON.parse(JSON.stringify(dup)); c1.uid = dup.uid + "_d1";
      var c2 = JSON.parse(JSON.stringify(dup)); c2.uid = dup.uid + "_d2";
      B2.businesses.push(c1, c2); B2.activeBizId = c1.uid;
    }
    var rep0 = window.oldBusinessCheckV1861();
    ok("duplicates_detected", rep0.duplicates >= 2, "duplicates=" + rep0.duplicates);
    var rep1 = window.repairDuplicateBusinessesV1861();
    ok("duplicates_repaired", rep1.duplicates === 0, "after=" + rep1.duplicates);
    ok("active_points_to_survivor", B2.activeBizId === null || (B2.businesses || []).some(function (b) { return b.uid === B2.activeBizId; }));

    // ===== OLD BUSINESS CHECK DOES NOT NAG ABOUT BUSINESS COMPANIES =====
    S.finance.bizV1860 = undefined;
    S.finance.startupV1856 = undefined;
    S.finance.businesses = [{ id: catId, name: "BizOnlyCo", value: 100000, reputation: 50, years: 1 }];
    window.renderEntrepreneurHubV1861();
    var rep2 = window.oldBusinessCheckV1861();
    ok("old_check_ignores_business_companies", rep2.oldCount === 0, "oldCount=" + rep2.oldCount);

    // ===== FULL FOUNDING WIZARD STILL WORKS IN ENTREPRENEURSHIP =====
    S.finance.bizV1860 = undefined; S.finance.businesses = []; S.finance.startupV1856 = undefined;
    S.money = 500000; S.age = 30;
    var typeKey = (E && E.BIZ_TYPES) ? Object.keys(E.BIZ_TYPES)[0] : null;
    var modelKey = (E && E.BIZ_TYPES && typeKey) ? E.BIZ_TYPES[typeKey].models[0] : "saas";
    try {
      window.startEntrepreneurV1861();
      window.bizWizardPickTypeV1861(typeKey);
      window.bizWizardPickModelV1861(modelKey);
      window.bizWizardPickNameV1861("SmokeCo");
      window.bizWizardPickCoFounderV1861("tech");
      window.bizWizardPickCapitalV1861("bootstrap");
      window.bizWizardPickFocusV1861("build");
    } catch (e) { out.notes.push("wizard err " + e); }
    var B3 = S.finance.bizV1860;
    var founded = B3 && (B3.businesses || []).find(function (b) { return b.name === "SmokeCo"; });
    ok("wizard_founded_company", !!founded);
    var threw = false;
    for (var y = 0; y < 5; y++) { S.actionsTaken = {}; S.age += 1; try { window.resolveLifeAndFinanceYear(); } catch (e) { threw = true; out.notes.push("ageup err " + e); } }
    ok("ageup_no_throw", !threw);

    out.summary = { total: Object.keys(out.pass).length, passed: Object.keys(out.pass).filter(function (k) { return out.pass[k]; }).length, failed: out.fail.length };
  } catch (e) {
    out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0, 5).join(" || ") : "");
  }
  return out;
})();
