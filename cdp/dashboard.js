(function () {
  var out = { pass: {}, fail: [], notes: [] };
  function ok(name, cond, detail) { out.pass[name] = !!cond; if (!cond) out.fail.push(name + (detail ? (": " + detail) : "")); }
  function num(x) { return Number.isFinite(Number(x)) ? Number(x) : 0; }
  try {
    if (typeof window.newGame === "function") window.newGame({});
    if (typeof ensureStateShape === "function") ensureStateShape();
    var S = state;
    var E = window.EntrepreneurV1861;
    ok("entrepreneur_loaded", !!E);
    S.age = 35; S.stats = S.stats || {}; S.stats.smarts = 80; S.stats.karma = 60; S.money = 5000000;
    if (!S.finance) S.finance = {};

    // ===== set up one live, growing company =====
    S.finance.bizV1860 = undefined;
    var B = E.initBiz();
    var biz = E.newBizObj("DashCo", "saas", "saas", 500000);
    biz.productStage = "live"; biz.stage = "growth"; biz.customers = 12000;
    biz.productQuality = 78; biz.nps = 40; biz.brand = 60; biz.active = true;
    biz.annualRevenue = 4000000; biz.annualProfit = 600000; biz.valuation = 30000000;
    B.businesses = [biz]; B.activeBizId = biz.uid; B.active = true; B._migrationCheckedV1861 = true;

    // build a little history
    for (var y = 0; y < 4; y++) { S.actionsTaken = {}; S.age += 1; try { window.resolveLifeAndFinanceYear(); } catch (e) { out.notes.push("ageup err " + e); } }

    // ===== CSS injected with biz1862 rules =====
    var styleEl = document.getElementById("ledger-entrepreneur-v1861-style");
    var css = styleEl ? styleEl.textContent : "";
    ok("css_injected", !!styleEl);
    var cssClasses = ["biz1862-tabs", "biz1862-tab", "biz1862-command", "biz1862-next", "biz1862-panel", "biz1862-callout", "biz1862-split", "biz1862-minirow", "biz1862-candles", "biz1862-recruit", "biz1862-role", "biz1862-roster", "biz1862-emp", "biz1862-perf"];
    var missingCss = cssClasses.filter(function (c) { return css.indexOf("." + c) < 0; });
    ok("css_has_biz1862_rules", missingCss.length === 0, "missing=" + missingCss.join(","));
    ok("css_tab_selected_state", css.indexOf(".biz1862-tab.selected") >= 0);

    // ===== tabs render in the active panel =====
    var panel = window.renderEntrepreneurHubV1861();
    ok("dashboard_tabs_render", panel.indexOf("biz1862-tabs") >= 0 && panel.indexOf("biz1862-tab") >= 0);
    ok("dashboard_command_header", panel.indexOf("biz1862-command") >= 0 && panel.indexOf("Founder command") >= 0);
    ok("dashboard_next_milestone", panel.indexOf("biz1862-next") >= 0 && panel.indexOf("Next milestone") >= 0);
    var tabHandlers = (panel.match(/bizSetPanelV1862/g) || []).length;
    ok("dashboard_tab_buttons", tabHandlers >= 6, "handlers=" + tabHandlers);

    // ===== switching panels changes what renders =====
    function panelHas(name, needle) {
      window.bizSetPanelV1862(name);
      var html = window.renderEntrepreneurHubV1861();
      var activeP = E.initBiz().activePanelV1862;
      ok("panel_" + name + "_active", activeP === name, "active=" + activeP);
      ok("panel_" + name + "_content", html.indexOf(needle) >= 0, "needle=" + needle);
      return html;
    }
    panelHas("overview", "Current read");
    panelHas("product", "Dev focus");
    panelHas("growth", "Marketing");
    // seed a hire so the roster + perf meter render (deterministic)
    biz.employees = biz.employees || [];
    biz.employees.push({ id: "emp_probe_1", name: "Pat Probe", roleId: "dev_sr", salary: 90000, performance: 72, yearsAtCompany: 2, leaveRisk: 0.05, cultureFit: 60 });
    biz.headcount = (biz.employees.length) + ((biz.coFounders || []).length);
    var teamHtml = panelHas("team", "biz1862-roster");
    ok("team_recruit_rail", teamHtml.indexOf("Recruit") >= 0 && teamHtml.indexOf("biz1862-role") >= 0 && teamHtml.indexOf("Boosts") >= 0);
    ok("team_perf_meter", teamHtml.indexOf("biz1862-perf-bar") >= 0);
    var fundingHtml = panelHas("funding", "Funding rounds");
    ok("funding_history_card", fundingHtml.indexOf("Funding history") >= 0 && fundingHtml.indexOf("biz1862-split") >= 0);

    // ===== public market tab gated until public =====
    // tab button is disabled while private, and render falls back to overview
    var privTabHtml = window.renderEntrepreneurHubV1861();
    ok("public_tab_disabled_when_private", /bizSetPanelV1862\('public'\)[^>]*disabled/.test(privTabHtml), "no disabled public tab");
    window.bizSetPanelV1862("public"); // request it anyway
    var gatedHtml = window.renderEntrepreneurHubV1861();
    var effPanel = E.initBiz().activePanelV1862; // dashboardPanelV1862 corrects it during render
    ok("public_gated_when_private", effPanel === "overview" && gatedHtml.indexOf("Current read") >= 0, "effPanel=" + effPanel);

    // take it public
    biz.public = true; biz.shareTicker = "DASH"; biz.shares = 1000000; biz.floatPct = 20;
    biz._ipoPrice = 30; biz.valuation = 40000000;
    if (typeof window.ensureStocksV18Store === "function") {
      // prime a couple price updates so lastPriceMoveV1862 / lastMarketFactorV1862 populate
    }
    S.actionsTaken = {}; S.age += 1; try { window.resolveLifeAndFinanceYear(); } catch (e) { out.notes.push("public ageup err " + e); }
    var livePub = (S.finance.bizV1860.businesses || [])[0];
    ok("market_factor_stored", typeof livePub.lastMarketFactorV1862 === "number", "val=" + (livePub && livePub.lastMarketFactorV1862));
    ok("price_move_stored", typeof livePub.lastPriceMoveV1862 === "number", "val=" + (livePub && livePub.lastPriceMoveV1862));

    window.bizSetPanelV1862("public");
    var pubActive = E.initBiz().activePanelV1862;
    ok("public_open_when_public", pubActive === "public", "active=" + pubActive);
    var pubHtml = window.renderEntrepreneurHubV1861();
    ok("public_market_signal", pubHtml.indexOf("Market signal") >= 0 && (pubHtml.indexOf("Market tailwind") >= 0 || pubHtml.indexOf("Market headwind") >= 0 || pubHtml.indexOf("Flat market") >= 0));

    // ===== exit tab renders =====
    panelHas("exit", "biz1862-panel");

    // ===== hero copy no longer claims Entrepreneurship owns Business =====
    var heroHtml = window.renderEntrepreneurHubV1861();
    ok("hero_copy_no_owns_business", heroHtml.indexOf("owns the Business hub") < 0);
    ok("hero_copy_states_separation", heroHtml.indexOf("Business stays separate") >= 0);

    // ===== founding routes to entrepreneurship (not business) =====
    S.finance.bizV1860 = undefined; S.finance.startupV1856 = undefined;
    S.money = 5000000; S.age = 30;
    var routedTo = null; var realSetTab = window.setTab;
    window.setTab = function (id) { routedTo = id; }; // spy
    try {
      window.startEntrepreneurV1861();
      window.bizWizardPickTypeV1861("saas");
      window.bizWizardPickModelV1861("saas");
      window.bizWizardPickNameV1861("RouteCo");
      window.bizWizardPickCoFounderV1861("solo");
      window.bizWizardPickCapitalV1861("bootstrap");
      window.bizWizardPickFocusV1861("build");
    } catch (e) { out.notes.push("found flow err " + e); }
    window.setTab = realSetTab;
    ok("founds_to_entrepreneurship", routedTo === "entrepreneurship", "routedTo=" + routedTo);

    out.summary = { total: Object.keys(out.pass).length, passed: Object.keys(out.pass).filter(function (k) { return out.pass[k]; }).length, failed: out.fail.length };
  } catch (e) {
    out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0, 6).join(" || ") : "");
  }
  return out;
})();
