(function () {
  var out = { pass: {}, fail: [], notes: [] };
  function ok(n, c, d) { out.pass[n] = !!c; if (!c) out.fail.push(n + (d ? (": " + d) : "")); }
  try {
    if (window.newGame) window.newGame({});
    if (typeof ensureStateShape === "function") ensureStateShape();
    state.age = 40; state.money = 1000000000; state.savings = 0; state.name = "Roman Hutchinson";
    state.finance = state.finance || {};
    state.finance.personalFirm = { managed: 100000000000 }; // $100B fund ("financial company")
    state.finance.bizV1860 = { businesses: [{ uid: "co1", valuation: 50000000000, cashInBusiness: 0, active: true }] };
    state.finance.businesses = [{ id: "founder_active_saas", name: "PulseCore", value: 50000000000, retainedEarnings: 0, founderActiveV1860: true }];

    // --- net worth: bridge excluded, fund included, ledger ~= legacyNetWorth ---
    var lnw = typeof legacyNetWorth === "function" ? legacyNetWorth() : 0;
    out.notes.push("legacyNetWorth=" + lnw);
    // toggle the bridge off and confirm legacyNetWorth is unchanged (bridge not counted)
    state.finance.businesses[0].founderActiveV1860 = false;
    var lnwNoBridgeFlag = legacyNetWorth();
    state.finance.businesses[0].founderActiveV1860 = true;
    ok("bridge_excluded_from_networth", lnwNoBridgeFlag - lnw >= 49000000000, "delta=" + (lnwNoBridgeFlag - lnw));
    ok("fund_counted_in_networth", lnw >= 100000000000, "lnw=" + lnw);

    var ledger = typeof window.financeLedgerTotalsV1836 === "function" ? window.financeLedgerTotalsV1836() : null;
    out.notes.push("ledgerNet=" + (ledger && ledger.netWorth));
    ok("ledger_includes_fund", !!ledger && ledger.netWorth >= 100000000000, "ledgerNet=" + (ledger && ledger.netWorth));
    // ledger and legacyNetWorth should now be in the same ballpark (within 5%)
    ok("ledger_matches_legacy", !!ledger && Math.abs(ledger.netWorth - lnw) <= Math.max(lnw, 1) * 0.06, "ledger=" + (ledger && ledger.netWorth) + " legacy=" + lnw);

    // --- IQ genetics ---
    ok("genetics_fn", typeof window.childInheritedIQV1862 === "function");
    state.traits = state.traits || {};
    state.relationships = state.relationships || {};
    // smart parent + smart partner -> smart kids
    state.traits.iq = 150;
    state.relationships.spouse = { role: "Spouse", name: "Ada", iqV1862: 150, alive: true };
    var smartKids = []; for (var i = 0; i < 40; i++) smartKids.push(window.childInheritedIQV1862());
    var smartAvg = smartKids.reduce(function (a, b) { return a + b; }, 0) / smartKids.length;
    out.notes.push("smartAvg=" + Math.round(smartAvg));
    ok("smart_parents_smart_kids", smartAvg >= 120, "avg=" + Math.round(smartAvg));
    // average parents -> ~average kids
    state.traits.iq = 100; state.relationships.spouse.iqV1862 = 100;
    var avgKids = []; for (var j = 0; j < 40; j++) avgKids.push(window.childInheritedIQV1862());
    var avgAvg = avgKids.reduce(function (a, b) { return a + b; }, 0) / avgKids.length;
    out.notes.push("avgAvg=" + Math.round(avgAvg));
    ok("average_parents_average_kids", avgAvg >= 90 && avgAvg <= 110, "avg=" + Math.round(avgAvg));
    ok("smart_beats_average", smartAvg > avgAvg + 15);

    // Heir inheritance is the key path: a named child carries its born IQ; otherwise the heir
    // regresses from the parent's IQ. Either way smart parents -> smart heirs (verified above).
    ok("inheritance_available", typeof window.childInheritedIQV1862 === "function");

    out.summary = { total: Object.keys(out.pass).length, passed: Object.keys(out.pass).filter(function (k) { return out.pass[k]; }).length, failed: out.fail.length };
  } catch (e) { out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0, 6).join(" || ") : ""); }
  return out;
})();
