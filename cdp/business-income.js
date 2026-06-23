(function () {
  var out = { pass: {}, fail: [], notes: [] };
  function ok(n, c, d) { out.pass[n] = !!c; if (!c) out.fail.push(n + (d ? (": " + d) : "")); }
  try {
    if (typeof window.newGame === "function") window.newGame({});
    if (typeof ensureStateShape === "function") ensureStateShape();
    state.age = 50; state.money = 1000000;
    state.stats = state.stats || {}; state.stats.discipline = 80; state.stats.popularity = 80;
    state.finance = state.finance || {}; state.finance.businesses = [];
    state.actionsTaken = {};

    // Orphan: established, valuable business whose id is NOT in the catalog (old-save drift).
    // Sentinel lastIncome so we can tell "recomputed" from "skipped/stale".
    var orphan = { id: "ghost_old_biz_xyz", baseId: "ghost_old_biz_xyz", name: "Old Profitable Co", category: "Food & Drink", value: 4000000, retainedEarnings: 200000, reputation: 90, stage: "established", stageV1860: "established", years: 18, lastIncome: -123456789, failureRisk: .1 };
    state.finance.businesses.push(orphan);

    var moneyBefore = state.money;
    window.resolveLifeAndFinanceYear();
    var moneyAfter = state.money;

    out.notes.push("orphan.lastIncome=" + orphan.lastIncome);
    out.notes.push("moneyDelta=" + (moneyAfter - moneyBefore));
    out.notes.push("synthFlag=" + !!orphan._synthV1862);

    ok("orphan_income_recomputed", orphan.lastIncome !== -123456789, "still sentinel = skipped");
    ok("orphan_makes_positive_income", Number(orphan.lastIncome) > 0, "lastIncome=" + orphan.lastIncome);

    out.summary = { total: Object.keys(out.pass).length, passed: Object.keys(out.pass).filter(function (k) { return out.pass[k]; }).length, failed: out.fail.length };
  } catch (e) { out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0, 6).join(" || ") : ""); }
  return out;
})();
