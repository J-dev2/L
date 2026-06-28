(function () {
  var out = { pass: {}, fail: [], notes: [], info: {} };
  function ok(name, cond, detail) { out.pass[name] = !!cond; if (!cond) out.fail.push(name + (detail ? ": " + detail : "")); }
  function num(v) { return Number.isFinite(Number(v)) ? Number(v) : 0; }
  function catalog() {
    var a = [];
    try { if (Array.isArray(window.entrepreneurshipCatalog)) a = a.concat(window.entrepreneurshipCatalog); } catch (e) {}
    try { if (typeof entrepreneurshipCatalog !== "undefined" && Array.isArray(entrepreneurshipCatalog)) a = a.concat(entrepreneurshipCatalog); } catch (e2) {}
    try { if (Array.isArray(window.V6_EXTRA_COMPANIES)) a = a.concat(window.V6_EXTRA_COMPANIES); } catch (e3) {}
    try { if (typeof V6_EXTRA_COMPANIES !== "undefined" && Array.isArray(V6_EXTRA_COMPANIES)) a = a.concat(V6_EXTRA_COMPANIES); } catch (e4) {}
    var seen = {}, outList = [];
    a.forEach(function (v) { if (v && v.id && !seen[v.id]) { seen[v.id] = 1; outList.push(v); } });
    return outList;
  }
  function reset(age) {
    if (typeof window.newGame === "function") window.newGame({ sandboxMode: true });
    if (typeof window.ensureStateShape === "function") window.ensureStateShape();
    state.age = age;
    state.money = 50000000;
    state.finance = state.finance || {};
    state.finance.businesses = [];
  }

  try {
    reset(21);
    ok("has_business_hub", typeof window.renderBusinessHubV1840 === "function" && typeof window.startVentureV1862 === "function" && typeof window.buyCompanyV1862 === "function");
    var html = window.renderBusinessHubV1840();
    var all = catalog();
    var over = all.filter(function (v) { return num(v.minAge) > 21; });
    ok("catalog_age_gates_capped", over.length === 0, over.slice(0, 6).map(function (v) { return v.id + ":" + v.minAge; }).join(", "));
    ok("render_has_no_age_over_21", !/Age (2[2-9]|[3-9][0-9])\+/.test(html), "found high age gate in rendered hub");

    var privateEquity = all.filter(function (v) { return v.id === "privateequity"; })[0];
    ok("private_equity_gate_is_21", !!privateEquity && num(privateEquity.minAge) <= 21, privateEquity ? String(privateEquity.minAge) : "missing");
    var beforeCount = (state.finance.businesses || []).length;
    window.startVentureV1862("privateequity");
    var afterStart = state.finance.businesses || [];
    ok("age21_can_start_old_28_venture", afterStart.length > beforeCount && afterStart.some(function (b) { return b && b.id === "privateequity"; }), JSON.stringify(afterStart));

    reset(21);
    window.renderBusinessHubV1840();
    var aircraft = catalog().filter(function (v) { return v.id === "aircraftleasing"; })[0];
    ok("aircraft_acquisition_gate_is_21", !!aircraft && num(aircraft.minAge) <= 21, aircraft ? String(aircraft.minAge) : "missing");
    var beforeBuy = (state.finance.businesses || []).length;
    window.buyCompanyV1862("aircraftleasing");
    var afterBuy = state.finance.businesses || [];
    ok("age21_can_buy_old_28_acquisition", afterBuy.length > beforeBuy && afterBuy.some(function (b) { return b && (b.baseId === "aircraftleasing" || b.id === "aircraftleasing"); }), JSON.stringify(afterBuy));

    reset(20);
    var html20 = typeof window.renderEntrepreneurshipHubV1841 === "function" ? window.renderEntrepreneurshipHubV1841() : window.renderBusinessHubV1840();
    ok("age20_still_sees_21_gate", /Age 21\+/.test(html20), "missing Age 21+ gate");

    out.info = {
      catalogCount: all.length,
      privateEquityAge: privateEquity && privateEquity.minAge,
      aircraftAge: aircraft && aircraft.minAge,
      age21BusinessCount: afterBuy.length
    };
    out.summary = { total: Object.keys(out.pass).length, passed: Object.keys(out.pass).filter(function (k) { return out.pass[k]; }).length, failed: out.fail.length };
  } catch (e) {
    out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0, 8).join(" || ") : "");
  }
  return out;
})();
