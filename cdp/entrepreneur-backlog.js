(function () {
  var out = { pass: {}, fail: [], notes: [], info: {} };
  function ok(name, cond, detail) { out.pass[name] = !!cond; if (!cond) out.fail.push(name + (detail ? ": " + detail : "")); }
  function num(v) { return Number.isFinite(Number(v)) ? Number(v) : 0; }
  function reset() {
    if (typeof window.newGame === "function") window.newGame({ sandboxMode: true });
    if (typeof window.ensureStateShape === "function") window.ensureStateShape();
    state.age = 35;
    state.money = 2000000;
    state.finance = state.finance || {};
    state.stats = state.stats || {};
    state.stats.smarts = 90;
    state.stats.confidence = 80;
    var E = window.EntrepreneurV1861;
    if (!E || typeof E.initBiz !== "function") return null;
    var B = E.initBiz();
    B.active = true;
    B.businesses = [];
    B.dayTradingV1874 = null;
    var biz = E.newBizObj("Backlog Labs", "saas", "saas", 2000000);
    biz.uid = "backlog_biz";
    biz.stage = "scale";
    biz.productStage = "live";
    biz.active = true;
    biz.dead = false;
    biz.cashInBusiness = 1000000;
    biz.annualRevenue = 8000000;
    biz.annualProfit = 2000000;
    biz.customers = 50000;
    B.businesses.push(biz);
    B.activeBizId = biz.uid;
    return biz;
  }
  function setupPublic(ownShares, totalShares, price) {
    var biz = reset();
    biz.public = true;
    biz.shareTicker = "PUB";
    biz.shares = totalShares;
    biz._ipoPrice = price;
    biz.valuation = totalShares * price;
    biz.floatPct = Math.round((1 - ownShares / totalShares) * 100);
    state.finance.stocksV18 = { holdings: [], prices: {}, history: {} };
    state.finance.stocksV18.prices.PUB = price;
    state.finance.stocksV18.history.PUB = [price];
    state.finance.stocksV18.holdings.push({ id: "PUB", shares: ownShares, avgCost: price, invested: ownShares * price, _entrepreneurV1861: true });
    return biz;
  }

  try {
    var biz = reset();
    ok("has_shared_chart_module", !!window.LedgerChartsV1874 && typeof window.LedgerChartsV1874.sparkSVG === "function" && typeof window.LedgerChartsV1874.donutSVG === "function" && typeof window.LedgerChartsV1874.candleFromClosesSVG === "function");

    var spark = window.LedgerChartsV1874.sparkSVG([1, 2, 3], { className: "test-spark" });
    var donut = window.LedgerChartsV1874.donutSVG([{ label: "A", value: 2 }, { label: "B", value: 1 }], { centerLabel: "MIX" });
    var candle = window.LedgerChartsV1874.candleFromClosesSVG([10, 11, 9, 14], "TST");
    ok("shared_charts_render_svg", /<svg/.test(spark) && /<svg/.test(donut) && /<svg/.test(candle), "spark=" + spark.slice(0, 40));

    state.finance.brokerageOpened = true;
    state.finance.brokerage = 5000;
    var invHtml = typeof window.renderHubContent === "function" ? window.renderHubContent("brokerage") : "";
    ok("investments_uses_shared_donut_tile", /v1838-chart-tile/.test(invHtml) && /v1838-donut-wrap/.test(invHtml), "len=" + invHtml.length);

    window.bizSetPanelV1862("team");
    var teamHtml = window.renderEntrepreneurHubV1861();
    ok("team_hiring_ui_present", /Interview/.test(teamHtml) && /bizOpenHiringV1868/.test(teamHtml));
    var cashBeforeInterview = num(biz.cashInBusiness);
    window.bizOpenHiringV1868("tech_lead");
    var pool = biz._candidatesV1868 && biz._candidatesV1868.tech_lead;
    var cand = pool && pool.list && pool.list[0];
    ok("candidate_pool_created", !!cand && pool.list.length >= 2, "pool=" + (pool && pool.list && pool.list.length));
    window.bizInterviewCandidateV1868("tech_lead", cand && cand.id, "skill");
    ok("interview_reveals_skill_and_costs_cash", !!cand && cand.revealed.skill === true && num(biz.cashInBusiness) === cashBeforeInterview - 1000, "cash=" + num(biz.cashInBusiness));
    var employeesBefore = (biz.employees || []).length;
    window.bizHireCandidateV1868("tech_lead", cand && cand.id);
    ok("candidate_hires_to_roster", (biz.employees || []).length === employeesBefore + 1 && (biz.employees || [])[employeesBefore].roleId === "tech_lead");

    window.bizSetPanelV1862("trading");
    var tradingHtml = window.renderEntrepreneurHubV1861();
    ok("day_trading_ui_present", /Day-trading desk/.test(tradingHtml) && /biz1874-trade-card/.test(tradingHtml) && /bizDayTradeBuyV1874/.test(tradingHtml));
    var moneyBeforeBuy = num(state.money);
    window.bizDayTradeBuyV1874("LGR", 1000);
    var T = window.EntrepreneurV1861.tradeStateV1874();
    var pos = (T.positions || []).find(function (p) { return p.id === "LGR"; });
    ok("day_trade_buy_uses_personal_cash", !!pos && num(state.money) === moneyBeforeBuy - 1000, "money=" + num(state.money));
    var histBefore = (T.history.LGR || []).length;
    window.bizDayTradeTapeV1874();
    T = window.EntrepreneurV1861.tradeStateV1874();
    ok("day_trade_tape_moves_watchlist", (T.history.LGR || []).length >= histBefore && num(T.tradesThisYear) >= 2, "hist=" + (T.history.LGR || []).length + " trades=" + T.tradesThisYear);
    var moneyBeforeSell = num(state.money);
    window.bizDayTradeSellV1874("LGR", "all");
    T = window.EntrepreneurV1861.tradeStateV1874();
    ok("day_trade_sell_returns_cash", !(T.positions || []).some(function (p) { return p.id === "LGR"; }) && num(state.money) > moneyBeforeSell, "money=" + num(state.money));

    if (typeof window.ensureStateShape === "function") window.ensureStateShape();
    state.finance = state.finance || {};
    state.finance.brokerageOpened = true;
    state.finance.brokerage = 10000;
    state.finance.stocksV18 = { holdings: [], prices: { AAPL: 195 }, history: { AAPL: [195] } };
    window.buyStockV18("AAPL", 1000);
    var h = state.finance.stocksV18.holdings.find(function (x) { return x.id === "AAPL"; });
    var stockSharesBefore = num(h && h.shares);
    var brokerageBeforeSell = num(state.finance.brokerage);
    var input = document.createElement("input");
    input.id = "stock-sell-custom-test";
    input.value = "500";
    document.body.appendChild(input);
    window.sellCustomStockV18("AAPL", input.id);
    var hAfter = state.finance.stocksV18.holdings.find(function (x) { return x.id === "AAPL"; });
    ok("regular_stock_custom_sell_returns_brokerage_cash", num(state.finance.brokerage) > brokerageBeforeSell && (!hAfter || num(hAfter.shares) < stockSharesBefore), "brokerage=" + num(state.finance.brokerage));

    var pubBiz = setupPublic(600000, 1000000, 20);
    state.money = 0;
    var founderInput = document.createElement("input");
    founderInput.id = "own-share-sell-custom-test";
    founderInput.value = "10000";
    document.body.appendChild(founderInput);
    var founderHolding = state.finance.stocksV18.holdings.find(function (x) { return x.id === "PUB"; });
    var founderSharesBefore = num(founderHolding && founderHolding.shares);
    window.bizSellOwnStockCustomV1861(founderInput.id);
    var founderSharesAfter = num((state.finance.stocksV18.holdings.find(function (x) { return x.id === "PUB"; }) || {}).shares);
    ok("entrepreneur_own_share_custom_sell_returns_checking_cash", num(state.money) === 10000 && founderSharesAfter < founderSharesBefore && pubBiz.public === true, "money=" + num(state.money) + " shares=" + founderSharesAfter);

    out.info = {
      employeeCount: (biz.employees || []).length,
      tradesThisYear: num(T.tradesThisYear),
      brokerageCash: num(state.finance && state.finance.brokerage),
      founderCashAfterSell: num(state.money)
    };
    out.summary = { total: Object.keys(out.pass).length, passed: Object.keys(out.pass).filter(function (k) { return out.pass[k]; }).length, failed: out.fail.length };
  } catch (e) {
    out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0, 8).join(" || ") : "");
  }
  return out;
})();
