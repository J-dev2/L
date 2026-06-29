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
    ok("investments_has_base_live_market", /Live Market|Stop Live/.test(invHtml) && typeof window.toggleLiveMarketV18 === "function" && typeof window.liveMarketTickV18 === "function", "len=" + invHtml.length);
    ok("investments_has_funding_controls", /Fund \$10K/.test(invHtml) && /Fund Max/.test(invHtml) && /data-stock18-live-panel/.test(invHtml), "len=" + invHtml.length);
    ok("investments_live_defaults_on", /Stop Live/.test(invHtml) && /Live market running/.test(invHtml), "len=" + invHtml.length);
    ok("investments_has_candles_and_buy_max", /v18-candle-chart/.test(invHtml) && /data-stock18-chart/.test(invHtml) && /Buy Max/.test(invHtml), "len=" + invHtml.length);
    if (typeof window.stopLiveMarketV18 === "function") window.stopLiveMarketV18();
    var moneyBeforeFund = num(state.money);
    state.finance.brokerage = 0;
    window.fundStockCashV18(10000);
    ok("investment_funding_moves_checking_to_investment_cash", num(state.money) === moneyBeforeFund - 10000 && num(state.finance.brokerage) === 10000 && state.finance.brokerageOpened === true, "money=" + num(state.money) + " brokerage=" + num(state.finance.brokerage));

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
    ok("entrepreneur_trading_tab_removed", !/Day-trading desk/.test(tradingHtml) && !/biz1874-trade-card/.test(tradingHtml) && !/>Trading<\/button>/.test(tradingHtml));

    if (typeof window.ensureStateShape === "function") window.ensureStateShape();
    state.finance = state.finance || {};
    state.finance.brokerageOpened = true;
    state.finance.brokerage = 10000;
    state.finance.stocksV18 = { holdings: [], prices: { AAPL: 195 }, history: { AAPL: [195] } };
    window.buyStockV18("AAPL", 1000);
    var h = state.finance.stocksV18.holdings.find(function (x) { return x.id === "AAPL"; });
    var stockSharesBefore = num(h && h.shares);
    document.body.insertAdjacentHTML("beforeend", '<div class="hub-overlay hub-brokerage">' + window.renderHubContent("brokerage") + '</div>');
    var stockValueBeforeLive = num(window.investmentSnapshotV1838 && window.investmentSnapshotV1838().stocks);
    var priceBeforeLive = num(state.finance.stocksV18.prices.AAPL);
    var randomBefore = Math.random;
    Math.random = function () { return 0.99; };
    state.finance.stocksV18.liveV18 = { enabled: true, ticks: 0 };
    try { window.liveMarketTickV18(); } finally { Math.random = randomBefore; }
    var priceAfterLive = num(state.finance.stocksV18.prices.AAPL);
    var stockValueAfterLive = num(window.investmentSnapshotV1838 && window.investmentSnapshotV1838().stocks);
    ok("live_ticker_moves_real_stock_price", priceAfterLive !== priceBeforeLive && (state.finance.stocksV18.history.AAPL || []).length > 1, "price " + priceBeforeLive + " -> " + priceAfterLive);
    ok("live_ticker_moves_owned_stock_value", stockValueAfterLive !== stockValueBeforeLive, "value " + stockValueBeforeLive + " -> " + stockValueAfterLive);
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
      livePriceAAPL: num(state.finance && state.finance.stocksV18 && state.finance.stocksV18.prices && state.finance.stocksV18.prices.AAPL),
      brokerageCash: num(state.finance && state.finance.brokerage),
      founderCashAfterSell: num(state.money)
    };
    out.summary = { total: Object.keys(out.pass).length, passed: Object.keys(out.pass).filter(function (k) { return out.pass[k]; }).length, failed: out.fail.length };
  } catch (e) {
    out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0, 8).join(" || ") : "");
  }
  return out;
})();
