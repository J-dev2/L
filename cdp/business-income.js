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

    state.age = 61;
    state.money = 500000;
    state.finance.businesses = [];
    state.finance.businessCashV1874 = { processedAges: {}, history: [] };
    state.finance.incomeSources = state.finance.incomeSources || {};
    state.finance.incomeSources.businessDistributionsV1830 = 500000;
    state.finance.lastFirmDistribution = 500000;
    state.finance.businessTaxV1830 = state.finance.businessTaxV1830 || { processedAges: {}, history: [] };
    state.finance.businessTaxV1830.distributions = 500000;
    var small = {
      id: "sub_million_cash_test",
      baseId: "sub_million_cash_test",
      name: "Sub Million Cash Test",
      category: "Services",
      value: 700000,
      retainedEarnings: 0,
      entityType: "soleprop",
      reputation: 84,
      stage: "established",
      years: 7,
      lastIncome: 500000,
      historyV1830: [{ age: 61, action: "Pass-through year", income: 500000, retained: 0 }]
    };
    state.finance.businesses.push(small);
    var checkingBeforeReserve = state.money;
    var reserveChanged = typeof window.reconcileBusinessCashV1874 === "function" && window.reconcileBusinessCashV1874(true);
    out.notes.push("reserveChanged=" + !!reserveChanged);
    out.notes.push("small.retainedEarnings=" + small.retainedEarnings);
    out.notes.push("checkingAfterReserve=" + state.money);

    ok("reserve_reconcile_global", typeof window.reconcileBusinessCashV1874 === "function");
    ok("sub_million_profit_retained", Number(small.retainedEarnings) >= 300000, "retained=" + small.retainedEarnings);
    ok("reserve_moves_from_checking", Number(state.money) <= checkingBeforeReserve - 300000, "before=" + checkingBeforeReserve + " after=" + state.money);
    ok("reserve_sweep_recorded", !!small._lastReserveSweepAmountV1874 && !!state.finance.businessCashV1874.history.length);
    ok("owner_distribution_trimmed", Number(state.finance.incomeSources.businessDistributionsV1830) < 500000, "dist=" + state.finance.incomeSources.businessDistributionsV1830);

    out.summary = { total: Object.keys(out.pass).length, passed: Object.keys(out.pass).filter(function (k) { return out.pass[k]; }).length, failed: out.fail.length };
  } catch (e) { out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0, 6).join(" || ") : ""); }
  return out;
})();
