(function () {
  var out = { pass: {}, fail: [], notes: [] };
  function ok(n, c, d) { out.pass[n] = !!c; if (!c) out.fail.push(n + (d ? (": " + d) : "")); }
  function overlay() { return document.getElementById("biz-manage-overlay"); }
  try {
    if (window.newGame) window.newGame({});
    if (typeof ensureStateShape === "function") ensureStateShape();
    state.age = 46; state.money = 3000000;
    state.finance = state.finance || {}; state.finance.businesses = [];
    state.finance.businesses.push({ id: "nightclub", baseId: "nightclub", name: "Blue Hour", category: "Nightlife & Events", value: 1500000, retainedEarnings: 600000, reputation: 85, stage: "breakout", years: 8, assets: { location: 3, equipment: 2, staff: 1 }, ops: {} });
    state.finance.businessOfficeV1840 = { focusId: "nightclub" };

    ok("globals", typeof window.openBizModalV1862 === "function" && typeof window.closeBizModalV1862 === "function" && typeof window.buildBizModalV1862 === "function");

    // per-company kinds build non-empty content
    ["capital", "cash", "taxes", "structure", "team", "assets", "network"].forEach(function (k) {
      var b = window.buildBizModalV1862("nightclub", k);
      ok("build_" + k, b && b.html && b.html.length > 30, "len=" + (b && b.html && b.html.length));
    });
    // global kinds (no focused company needed)
    ["new", "family"].forEach(function (k) {
      var b = window.buildBizModalV1862("", k);
      ok("build_global_" + k, b && b.html && b.html.length > 30, "len=" + (b && b.html && b.html.length));
    });

    // open creates an overlay with the card
    ok("no_overlay_initially", !overlay());
    window.openBizModalV1862("nightclub", "team");
    ok("overlay_created", !!overlay());
    ok("overlay_has_card", overlay().innerHTML.indexOf("biz-manage-card") >= 0 && overlay().innerHTML.indexOf("Operations team") >= 0);

    // an action inside (hire ops) mutates state; modal refresh keeps it open + updated
    var hadManager = !!(state.finance.businesses[0].ops && state.finance.businesses[0].ops.manager);
    if (typeof window.hireBusinessOpsV1830 === "function") window.hireBusinessOpsV1830("nightclub", "manager");
    ok("ops_hired", !!state.finance.businesses[0].ops.manager, "was " + hadManager);
    ok("overlay_still_open_after_action", !!overlay());
    // simulate the hub re-render that follows an action, then confirm the modal reflects it
    window.renderBusinessHubV1840();
    ok("overlay_persists_through_render", !!overlay() && overlay().innerHTML.indexOf("biz-manage-card") >= 0);

    // switch kind
    window.openBizModalV1862("nightclub", "network");
    ok("switch_kind", overlay().innerHTML.indexOf("Network + market share") >= 0);

    // global popups: family + new business open without a focused company and survive a re-render
    window.openBizModalV1862("", "family");
    ok("family_popup", !!overlay() && overlay().innerHTML.indexOf("Family") >= 0);
    window.renderBusinessHubV1840();
    ok("family_persists_render", !!overlay() && overlay().innerHTML.indexOf("Family") >= 0);
    window.openBizModalV1862("", "new");
    ok("new_popup", !!overlay() && overlay().innerHTML.indexOf("New business") >= 0);
    ok("new_start_closes_focuses", typeof window.startVentureV1862 === "function" && typeof window.buyCompanyV1862 === "function" && overlay().innerHTML.indexOf("startVentureV1862") >= 0);
    // acquisition market: at least 3 companies for sale in the Buy tab
    if (window.setNewBizModeV1862) window.setNewBizModeV1862("buy");
    window.openBizModalV1862("", "new");
    var buyCards = (overlay().innerHTML.match(/buyCompanyV1862/g) || []).length;
    ok("acq_market_min_3", buyCards >= 3, "cards=" + buyCards);
    if (window.setNewBizModeV1862) window.setNewBizModeV1862("scratch");

    // close removes it
    window.closeBizModalV1862();
    ok("closed", !overlay());

    out.summary = { total: Object.keys(out.pass).length, passed: Object.keys(out.pass).filter(function (k) { return out.pass[k]; }).length, failed: out.fail.length };
  } catch (e) { out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0, 6).join(" || ") : ""); }
  return out;
})();
