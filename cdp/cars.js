(function () {
  var out = { pass: {}, fail: [], notes: [] };
  function ok(name, cond, detail) { out.pass[name] = !!cond; if (!cond) out.fail.push(name + (detail ? ": " + detail : "")); }
  function num(v) { return Number(v) || 0; }
  function reset() {
    if (window.newGame) window.newGame({ sandboxMode: true });
    if (typeof ensureStateShape === "function") ensureStateShape();
    state.age = 30;
    state.money = 60000000;
    state.finance = state.finance || {};
    state.finance.creditScore = 760;
    state.car = null;
    state.finance.carsV1867 = null;
    window.carEnsureV1867();
  }

  try {
    reset();
    ok("globals_v1867", typeof window.carBuyV1867 === "function" && typeof window.carYearlyTickV1867 === "function" && typeof window.renderGarageV1867 === "function" && typeof window.carEquityV1867 === "function");

    // Cash buy.
    var cash0 = state.money;
    window.carBuyV1867("commuter", "cash");
    var g = state.finance.carsV1867;
    var c0 = g.garage[0];
    ok("cash_buy_adds_car", !!c0 && c0.tplId === "commuter" && c0.loan === 0, c0 && c0.tplId);
    ok("cash_buy_spends_full_price", (cash0 - state.money) >= 27000, "spent=" + (cash0 - state.money));
    ok("first_car_is_daily", g.dailyUid === c0.uid);
    ok("daily_grants_lifestyle", num(g.dailyBonus.happy) > 0, JSON.stringify(g.dailyBonus));

    // Finance buy.
    var cash1 = state.money;
    window.carBuyV1867("lux_sedan", "finance");
    var c1 = g.garage[g.garage.length - 1];
    ok("finance_buy_creates_loan", !!c1 && c1.loan > 0 && c1.loanRate > 0, c1 && JSON.stringify({ loan: c1.loan, rate: c1.loanRate }));
    ok("finance_only_down_spent", (cash1 - state.money) > 0 && (cash1 - state.money) < c1.buyPrice, "spent=" + (cash1 - state.money));

    // Boats and aircraft now live in the same Vehicles collection.
    window.carBuyV1867("speedboat", "cash");
    var boat = g.garage[g.garage.length - 1];
    ok("boat_buy_adds_marine_vehicle", boat && boat.category === "marine" && boat.cls === "marine", JSON.stringify(boat && { tplId: boat.tplId, category: boat.category, cls: boat.cls }));
    window.carBuyV1867("single_prop", "cash");
    var plane = g.garage[g.garage.length - 1];
    ok("aircraft_buy_adds_hangar_vehicle", plane && plane.category === "air" && plane.cls === "aircraft", JSON.stringify(plane && { tplId: plane.tplId, category: plane.category, cls: plane.cls }));

    // Classic appreciates, normal depreciates, condition decays, loan amortizes.
    window.carBuyV1867("muscle", "cash");
    var classic = g.garage.find(function (c) { return c.tplId === "muscle"; });
    var classicVal0 = classic.value, commuterVal0 = c0.value, luxLoan0 = c1.loan;
    window.carYearlyTickV1867();
    ok("classic_appreciates", classic.value > classicVal0, classicVal0 + " -> " + classic.value);
    ok("normal_depreciates", c0.value < commuterVal0, commuterVal0 + " -> " + c0.value);
    ok("condition_decays", c0.condition < 96, "cond=" + c0.condition);
    ok("loan_amortizes", c1.loan < luxLoan0, luxLoan0 + " -> " + c1.loan);

    // Repair.
    c0.condition = 50; var cond0 = c0.condition, cashR = state.money;
    window.carRepairV1867(c0.uid);
    ok("repair_restores_and_costs", c0.condition > cond0 && state.money < cashR, cond0 + " -> " + c0.condition);

    // Pay loan.
    var loan0 = c1.loan;
    window.carPayLoanV1867(c1.uid, 20000);
    ok("pay_loan_reduces", c1.loan < loan0, loan0 + " -> " + c1.loan);

    // Net worth includes garage equity once (equity already nets the loan).
    var stats = window.carGarageStatsV1867();
    ok("equity_is_value_minus_loans", stats.equity === stats.value - stats.debt, JSON.stringify(stats));
    ok("networth_includes_car_equity", window.carEquityV1867() === stats.equity && legacyNetWorth() >= stats.equity);

    // Daily switch.
    window.carSetDailyV1867(classic.uid);
    ok("set_daily_switches", state.finance.carsV1867.dailyUid === classic.uid);

    // Sell.
    var count0 = g.garage.length, cashS = state.money;
    window.carSellV1867(c0.uid);
    ok("sell_removes_and_pays", g.garage.length === count0 - 1 && state.money > cashS);

    // Render.
    var html = window.renderGarageV1867();
    ok("render_vehicle_collection_and_market", /Vehicles/.test(html) && /Vehicle market/.test(html) && /Signature vehicle/.test(html), html.slice(0, 160));
    ok("vehicle_collection_has_marine_and_aircraft", /Marine/.test(html) && /Aircraft/.test(html) && /Marina/.test(html) && /Hangar/.test(html), html.slice(0, 260));
    ok("vehicle_market_has_all_10_classes", /Economy/.test(html) && /Standard/.test(html) && /Sport/.test(html) && /Luxury/.test(html) && /Exotic/.test(html) && /Classic/.test(html) && /Off-Road/.test(html) && /Electric/.test(html) && /Marine/.test(html) && /Aircraft/.test(html));

    // Migration of the legacy single car.
    state.finance.carsV1867 = null;
    state.car = "luxury";
    window.carEnsureV1867();
    ok("legacy_car_migrates_and_clears", state.finance.carsV1867.garage.length >= 1 && state.car == null, "garage=" + state.finance.carsV1867.garage.length + " car=" + state.car);

    out.summary = {
      total: Object.keys(out.pass).length,
      passed: Object.keys(out.pass).filter(function (k) { return out.pass[k]; }).length,
      failed: out.fail.length
    };
  } catch (e) {
    out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0, 8).join(" || ") : "");
  }
  return out;
})();
