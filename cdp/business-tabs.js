(function () {
  var out = { pass: {}, fail: [], notes: [] };
  function ok(n, c, d) { out.pass[n] = !!c; if (!c) out.fail.push(n + (d ? (": " + d) : "")); }
  function hub() { return window.renderBusinessHubV1840 ? window.renderBusinessHubV1840() : ""; }
  try {
    if (window.newGame) window.newGame({});
    if (typeof ensureStateShape === "function") ensureStateShape();
    state.age = 44; state.money = 5000000;
    state.finance = state.finance || {}; state.finance.businesses = [];

    // No companies yet: hub still renders, focus desk prompts, New Business button present.
    var h0 = hub();
    ok("no_top_tabs", (h0.match(/v1840-company-tabs/g) || []).length === 0 && h0.indexOf("New Business") >= 0);
    ok("newbiz_button", h0.indexOf("v1840-newbiz-btn") >= 0);
    ok("focus_empty_prompt", h0.indexOf("No company selected") >= 0);

    // Add companies.
    state.finance.businesses.push({ id: "nightclub", baseId: "nightclub", name: "Blue Hour", category: "Nightlife & Events", value: 1500000, retainedEarnings: 300000, reputation: 85, stage: "breakout", years: 8, assets: { location: 3, equipment: 2, staff: 2 }, ops: { manager: true } });
    state.finance.businesses.push({ id: "coffeehouse", baseId: "coffeehouse", name: "Daybreak", category: "Food & Drink", value: 540000, retainedEarnings: 90000, reputation: 74, stage: "growing", years: 4, assets: { location: 2, staff: 1, equipment: 1 } });
    state.finance.businessOfficeV1840.focusId = "nightclub";

    var h1 = hub();
    ok("rail_lists_companies", h1.indexOf("Blue Hour") >= 0 && h1.indexOf("Daybreak") >= 0);
    ok("focus_shows_company", h1.indexOf("Focused company") >= 0);
    ok("company_minitabs", ["Overview", "Trends", "Capital", "Network"].every(function (t) { return h1.indexOf(">" + t + "<") >= 0; }));

    // default company sub-tab = overview, with manage popups (incl. Family)
    ok("overview_default", state.finance.businessOfficeV1840.companyTabV1862 === "overview" || h1.indexOf("Failure risk") >= 0);
    ok("overview_manage_btns", h1.indexOf("Structure") >= 0 && h1.indexOf("Team") >= 0 && h1.indexOf("Family") >= 0);

    // switch sub-tabs
    window.setCompanyTabV1862("capital");
    var hCap = hub();
    ok("capital_subtab", hCap.indexOf("Founder capital") >= 0 && hCap.indexOf("Company cash") >= 0 && hCap.indexOf("Taxes") >= 0);
    window.setCompanyTabV1862("network");
    var hNet = hub();
    ok("network_subtab", hNet.indexOf("Network + market share") >= 0);
    // trends sub-tab: empty prompt with no history, charts once history exists
    window.setCompanyTabV1862("trends");
    ok("trends_empty_prompt", hub().indexOf("No trend history") >= 0);
    state.finance.businesses[0].historyV1862 = [{ age: 40, value: 1e6, income: 2e5, rep: 70 }, { age: 41, value: 1.4e6, income: 3e5, rep: 76 }, { age: 42, value: 1.9e6, income: 4e5, rep: 82 }];
    var hTr = hub();
    ok("trends_charts", hTr.indexOf("v1840-spark") >= 0 && hTr.indexOf("Company value") >= 0 && hTr.indexOf("Yearly income") >= 0);
    window.setCompanyTabV1862("bogus");
    ok("bad_subtab_falls_back", state.finance.businessOfficeV1840.companyTabV1862 === "overview");

    // switch focused company via rail focus
    if (window.setBusinessFocusV1840) window.setBusinessFocusV1840("coffeehouse");
    ok("focus_switch", state.finance.businessOfficeV1840.focusId === "coffeehouse");

    // Entrepreneur-port bridge company should be HIDDEN from the Business hub (shows $0 otherwise).
    state.finance.businesses.push({ id: "founder_active_saas", name: "PulseCore", category: "Tech & Startups", value: 8e10, retainedEarnings: 7.6e10, reputation: 100, stage: "breakout", years: 23, founderActiveV1860: true });
    state.finance.businessOfficeV1840.focusId = "founder_active_saas";
    var hBridge = hub();
    ok("bridge_hidden_from_hub", hBridge.indexOf("PulseCore") < 0);
    ok("focus_skips_bridge", hBridge.indexOf("Blue Hour") >= 0 || hBridge.indexOf("Daybreak") >= 0);

    out.summary = { total: Object.keys(out.pass).length, passed: Object.keys(out.pass).filter(function (k) { return out.pass[k]; }).length, failed: out.fail.length };
  } catch (e) { out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0, 6).join(" || ") : ""); }
  return out;
})();
