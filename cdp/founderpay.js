(function () {
  var out = { pass: {}, fail: [], notes: [] };
  function ok(name, cond, detail) { out.pass[name] = !!cond; if (!cond) out.fail.push(name + (detail ? (": " + detail) : "")); }
  function num(x) { return Number.isFinite(Number(x)) ? Number(x) : 0; }
  function setup(opts) {
    opts = opts || {};
    window.newGame({}); if (typeof ensureStateShape === "function") ensureStateShape();
    var S = state; S.age = 35; S.stats = S.stats || {}; S.money = 0; S.savings = 0;
    if (!S.finance) S.finance = {};
    S.finance.bizV1860 = undefined;
    var E = window.EntrepreneurV1861; var B = E.initBiz();
    var biz = E.newBizObj("PayCo", "saas", "saas", opts.cash != null ? opts.cash : 3000000);
    biz.cashInBusiness = opts.cash != null ? opts.cash : 3000000;
    biz.productStage = "live"; biz.stage = "growth"; biz.active = true;
    biz.customers = opts.customers != null ? opts.customers : 2000; // saas: mrr = cust*100 -> gross = *12
    biz.grossMargin = 0.60; biz.productQuality = 70; biz.nps = 30;
    biz._mktgBudget = opts.mktg != null ? opts.mktg : 2000000; // push net profit negative
    if (opts.rate != null) biz.founderSalaryRate = opts.rate;
    B.businesses = [biz]; B.activeBizId = biz.uid; B.active = true; B._migrationCheckedV1861 = true;
    return { S: S, B: B, biz: biz, E: E };
  }
  try {
    var E = window.EntrepreneurV1861; ok("entrepreneur_loaded", !!E);
    ok("has_distribution_fn", typeof window.bizTakeDistributionV1862 === "function");
    ok("has_salary_rate_fn", typeof window.bizSetSalaryRateV1862 === "function");

    // ===== A) salary paid even when net profit is NEGATIVE (reinvesting / high fixed cost) =====
    // A huge fixed payroll forces a net loss, but the company has plenty of cash, so you
    // should still draw a living salary.
    var a = setup({ cash: 100000000, customers: 500, mktg: 0 });
    a.biz.stage = "mature"; // limit organic growth so revenue stays modest
    a.biz.employees = [{ id: "big", name: "Exec", roleId: "cfo", salary: 50000000, performance: 70, yearsAtCompany: 1, leaveRisk: 0.05 }];
    a.biz.headcount = 1;
    var moneyBefore = num(a.S.money);
    a.S.age += 1; a.S.actionsTaken = {};
    window.runEntrepreneurYearV1861();
    var biz = a.S.finance.bizV1860.businesses[0];
    ok("net_profit_negative", num(biz.annualProfit) < 0, "profit=" + num(biz.annualProfit));
    var got = num(a.S.money) - moneyBefore;
    ok("salary_paid_when_unprofitable", got > 0, "playerGot=" + got);
    ok("salary_recorded", num(biz._founderSalaryPaid) > 0, "salaryPaid=" + num(biz._founderSalaryPaid));
    var expectedTake = num(biz._founderSalaryPaid) + Math.max(0, Math.round(num(biz.annualProfit) * 0.4));
    ok("take_is_salary_plus_payout", Math.abs(got - expectedTake) <= 2, "got=" + got + " exp=" + expectedTake);
    ok("salary_is_taxable", num(a.S.finance.lastEntrepreneurIncome) >= num(biz._founderSalaryPaid) - 1, "lastInc=" + num(a.S.finance.lastEntrepreneurIncome));
    ok("salary_target_floor_or_5pct", Math.abs(num(biz._founderSalaryPaid) - Math.max(40000, Math.round(num(biz.annualRevenue) * 0.05))) <= 1, "sal=" + num(biz._founderSalaryPaid) + " rev=" + num(biz.annualRevenue));

    // ===== B) salary never drives company cash negative by itself =====
    var b = setup({ cash: 5000, customers: 0, mktg: 0 }); // no revenue, tiny cash
    b.S.age += 1; b.S.actionsTaken = {};
    var cashBefore = num(b.S.finance.bizV1860.businesses[0].cashInBusiness);
    window.runEntrepreneurYearV1861();
    var bizB = b.S.finance.bizV1860.businesses[0];
    // low revenue -> salary target is the floor (40k); salary is bounded by it and by
    // what the company can fund, and never drives company cash below zero.
    ok("lowcash_salary_bounded", num(bizB._founderSalaryPaid) <= 40000, "sal=" + num(bizB._founderSalaryPaid));
    ok("lowcash_no_negative_from_salary", num(bizB.cashInBusiness) >= -1, "cash=" + num(bizB.cashInBusiness));

    // ===== C) manual distribution: yearly, 15% of cash, taxable, cooldown =====
    var c = setup({ cash: 1000000, customers: 100, mktg: 0 });
    var biz3 = c.S.finance.bizV1860.businesses[0];
    biz3.burnRate = 10000;
    var pMoney = num(c.S.money), pCash = num(biz3.cashInBusiness);
    window.bizTakeDistributionV1862();
    var expected = Math.round(pCash * 0.15);
    ok("dist_player_gained", num(c.S.money) - pMoney === expected, "gain=" + (num(c.S.money) - pMoney) + " exp=" + expected);
    ok("dist_cash_reduced", num(biz3.cashInBusiness) === pCash - expected, "cash=" + num(biz3.cashInBusiness));
    ok("dist_pending_set", num(c.S.finance.pendingFounderDrawV1862) === expected, "pending=" + num(c.S.finance.pendingFounderDrawV1862));
    ok("dist_runway_recomputed", num(biz3.runway) > 0);
    var moneyAfter1 = num(c.S.money);
    window.bizTakeDistributionV1862(); // same year -> blocked
    ok("dist_cooldown_blocks", num(c.S.money) === moneyAfter1, "money=" + num(c.S.money));

    // pending distribution is folded into next tick's taxable income (no double count)
    c.S.age += 1; c.S.actionsTaken = {};
    window.runEntrepreneurYearV1861();
    ok("dist_pending_cleared", num(c.S.finance.pendingFounderDrawV1862) === 0, "pending=" + num(c.S.finance.pendingFounderDrawV1862));
    ok("dist_taxed_next_tick", num(c.S.finance.lastEntrepreneurIncome) >= expected, "lastInc=" + num(c.S.finance.lastEntrepreneurIncome));
    // new year -> distribution available again
    var pMoney2 = num(c.S.money);
    window.bizTakeDistributionV1862();
    ok("dist_available_next_year", num(c.S.money) > pMoney2, "money=" + num(c.S.money));

    // ===== D) salary-rate setter clamps to 3%-10% =====
    var d = setup({});
    window.bizSetSalaryRateV1862(0.99);
    ok("rate_clamp_high", num(d.S.finance.bizV1860.businesses[0].founderSalaryRate) === 0.10, "rate=" + num(d.S.finance.bizV1860.businesses[0].founderSalaryRate));
    window.bizSetSalaryRateV1862(0.001);
    ok("rate_clamp_low", num(d.S.finance.bizV1860.businesses[0].founderSalaryRate) === 0.03, "rate=" + num(d.S.finance.bizV1860.businesses[0].founderSalaryRate));

    // ===== E) UI: founder pay card renders in funding panel =====
    setup({});
    window.bizSetPanelV1862("funding");
    var html = window.renderEntrepreneurHubV1861();
    ok("ui_founder_pay_card", html.indexOf("Founder pay") >= 0);
    ok("ui_rate_buttons", /bizSetSalaryRateV1862\(/.test(html));
    ok("ui_distribution_button", /bizTakeDistributionV1862\(\)/.test(html) && html.indexOf("Take distribution") >= 0);

    out.summary = { total: Object.keys(out.pass).length, passed: Object.keys(out.pass).filter(function (k) { return out.pass[k]; }).length, failed: out.fail.length };
  } catch (e) { out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0, 6).join(" || ") : ""); }
  return out;
})();
