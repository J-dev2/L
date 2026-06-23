(function () {
  var out = { pass: {}, fail: [], notes: [] };
  function ok(n, c, d) { out.pass[n] = !!c; if (!c) out.fail.push(n + (d ? (": " + d) : "")); }
  function panelText() {
    try { window.renderDeath(); } catch (e) {}
    var el = document.querySelector(".v1831-death-panel");
    return el ? el.textContent : "";
  }
  try {
    if (window.newGame) window.newGame({});
    if (typeof ensureStateShape === "function") ensureStateShape();
    if (typeof ensureLegacyShape === "function") ensureLegacyShape();
    state.age = 72; state.cause = "a quiet final night"; state.alive = false;
    state.money = 60000000000; state.savings = 0;
    // one child heir
    state.relationships = state.relationships || {};
    state.relationships.kid1 = { role: "Child", name: "Heir", alive: true };
    state.finance = state.finance || {};

    // --- Case A: NO trust at all ---
    state.finance.familyTrustV1839 = { created: false };
    if (state.estateV1831) { state.estateV1831.trustType = "none"; state.estateV1831.assets = state.estateV1831.assets || {}; }
    var noTrust = panelText();
    ok("notrust_says_no_trust", /No Trust/i.test(noTrust), noTrust.slice(0, 120));

    // --- Case B: Legal Dynasty Family Trust with billions in corpus ---
    state.finance.familyTrustV1839 = { created: true, plan: "dynasty", protection: .72, corpus: 14200000000 };
    var withTrust = panelText();
    out.notes.push(withTrust.replace(/\s+/g, " ").slice(0, 240));
    ok("trust_plan_not_no_trust", !/Plan\s*No Trust/i.test(withTrust) && /Trust/i.test(withTrust));
    ok("trust_shows_protected_billions", /Protected\s*\$1[0-9](\.[0-9])?B/i.test(withTrust) || withTrust.indexOf("14.2B") >= 0, withTrust.slice(0, 160));

    // --- Case C: no named trust, but assets ARE protected (e.g. estate trust cash) → not "No Trust" ---
    state.finance.familyTrustV1839 = { created: false };
    if (state.estateV1831) {
      state.estateV1831.trustType = "none";
      state.estateV1831.assets = state.estateV1831.assets || {};
      state.estateV1831.assets.trustCash = 15600000000;
    }
    var protectedNoName = panelText();
    ok("protected_not_called_no_trust", !/Plan\s*No Trust/i.test(protectedNoName), protectedNoName.slice(0, 140));

    out.summary = { total: Object.keys(out.pass).length, passed: Object.keys(out.pass).filter(function (k) { return out.pass[k]; }).length, failed: out.fail.length };
  } catch (e) { out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0, 6).join(" || ") : ""); }
  return out;
})();
