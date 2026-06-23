(function () {
  var out = { pass: {}, fail: [], notes: [] };
  function ok(n, c, d) { out.pass[n] = !!c; if (!c) out.fail.push(n + (d ? (": " + d) : "")); }
  try {
    if (window.newGame) window.newGame({});
    if (typeof ensureStateShape === "function") ensureStateShape();
    if (typeof ensureLegacyShape === "function") ensureLegacyShape();
    state.age = 50; state.money = 50000000;
    state.finance = state.finance || {};
    state.finance.trustFunds = state.finance.trustFunds || {};
    state.finance.familyTrustV1839 = { created: true, plan: "dynasty", protection: .72, corpus: 5000000, history: [] };
    state.relationships = state.relationships || {};
    state.relationships.kid1 = { role: "Child", name: "Heir", alive: true };

    // Fake an open hub overlay on a NON-owning hub ("people"), and capture re-render target.
    document.body.insertAdjacentHTML("beforeend", '<div class="hub-overlay hub-people" data-hub-id="people"><div class="v16-hub-body"></div></div>');
    var captured = [];
    var realRHP = window.renderHubInPlaceV16;
    window.renderHubInPlaceV16 = function (hubId) { captured.push(hubId); return null; };

    // Family-trust grant from the "people" hub should re-render "people", not jump to "law".
    captured.length = 0;
    if (typeof window.grantChildFromFamilyTrustV1839 === "function") window.grantChildFromFamilyTrustV1839("kid1", 10000);
    out.notes.push("grant->" + JSON.stringify(captured));
    ok("grant_stays_on_current_hub", captured.length > 0 && captured.indexOf("people") >= 0 && captured.indexOf("law") < 0, JSON.stringify(captured));

    // Business-trust action from the "people" hub should re-render "people", not jump to "business".
    state.finance.businesses = state.finance.businesses || [];
    state.finance.businesses.push({ id: "nightclub", baseId: "nightclub", name: "Blue Hour", category: "Nightlife & Events", value: 2000000, retainedEarnings: 300000, reputation: 80, stage: "breakout", years: 8 });
    state.finance.businessOfficeV1840 = { focusId: "nightclub" };
    captured.length = 0;
    if (typeof window.setBusinessTrustPercentV1840 === "function") window.setBusinessTrustPercentV1840("nightclub", 25);
    out.notes.push("biztrust->" + JSON.stringify(captured));
    ok("biztrust_stays_on_current_hub", captured.length > 0 && captured.indexOf("people") >= 0 && captured.indexOf("business") < 0, JSON.stringify(captured));

    // restore
    window.renderHubInPlaceV16 = realRHP;
    var ov = document.querySelector('.hub-overlay[data-hub-id="people"]'); if (ov) ov.remove();

    out.summary = { total: Object.keys(out.pass).length, passed: Object.keys(out.pass).filter(function (k) { return out.pass[k]; }).length, failed: out.fail.length };
  } catch (e) { out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0, 6).join(" || ") : ""); }
  return out;
})();
