(async function () {
  var out = { pass: {}, fail: [], notes: [], info: {} };
  function ok(name, cond, detail) { out.pass[name] = !!cond; if (!cond) out.fail.push(name + (detail ? ": " + detail : "")); }
  function num(v) { return Number.isFinite(Number(v)) ? Number(v) : 0; }
  function reset() {
    if (typeof window.newGame === "function") window.newGame({ sandboxMode: true });
    if (typeof window.ensureStateShape === "function") window.ensureStateShape();
    state.age = 35;
    state.money = 1000000;
    state.savings = 0;
    state.finance = state.finance || {};
    state.finance.superSaver = 0;
    state.finance.brokerage = 0;
    state.finance.managedPortfolio = 0;
    state.finance.personalFirm = { hired: true, staff: { advisor: 3, analyst: 4, risk: 2, tax: 5 }, cash: 12345, lastReturn: 7777, lastFee: 321 };
    state.finance.fundTrackV189 = { active: true, outsideCapital: 5000000, risk: "balanced", reputation: 22, lastReturn: 100000, lastFees: 25000, years: 1 };
    state.finance.stocksV18 = {
      holdings: [{ id: "AAPL", shares: 2, avgCost: 150, invested: 300 }],
      prices: { AAPL: 200 },
      history: { AAPL: [150, 175, 200] },
      candles: {},
      liveV18: { enabled: true, ticks: 0, trends: {} }
    };
    if (typeof window.ensureStockEngineV2 === "function") window.ensureStockEngineV2(state);
  }
  try {
    reset();
    ok("engine_exports_present", typeof window.ensureStockEngineV2 === "function" && typeof window.getStockUniverse === "function" && typeof window.tickLiveStockMarket === "function");
    ok("expanded_universe_loaded", window.getStockUniverse().length >= 45, "count=" + window.getStockUniverse().length);
    ok("old_holding_preserved", state.finance.stocksV18.holdings.some(function (h) { return h.id === "AAPL" && num(h.shares) === 2; }));
    ok("personal_firm_preserved", state.finance.personalFirm.hired === true && num(state.finance.personalFirm.cash) === 12345 && num(state.finance.managedPortfolio) === 0);
    ok("live_defaults_on", state.finance.stocksV18.liveV18 && state.finance.stocksV18.liveV18.enabled === true);
    ok("live_timer_deferred_before_hub_open", !window.__ledgerStockEngineV20Timer);

    var html = window.renderHubContent("brokerage");
    ok("live_timer_stays_deferred_for_string_render", !window.__ledgerStockEngineV20Timer);
    ok("renders_investments_2_shell", /v20-investments-hub/.test(html) && /Investments<\/h2>/.test(html), "len=" + html.length);
    ok("renders_asset_summary_and_tabs", /ASSET SUMMARY/.test(html) && /Stocks/.test(html) && /Risk/.test(html) && /Personal Firm/.test(html) && /Funds/.test(html));
    ok("overview_condenses_old_preview_cards", !/data-v20-stock-card/.test(html) && /Trades, Alerts, News/.test(html));
    ok("renders_shared_allocation_tile", /v1838-chart-tile/.test(html) && /v1838-donut-wrap/.test(html));
    var routeOpened = (function () {
      var err = "";
      try {
        if (typeof window.setTabV16 === "function") window.setTabV16("brokerage");
        else if (typeof window.setTab === "function") window.setTab("brokerage");
      } catch (e) {
        err = String(e && (e.message || e));
      }
      var app = document.getElementById("app");
      return !err && app && /hub-brokerage/.test(app.innerHTML) && /v20-investments-hub/.test(app.innerHTML);
    })();
    await new Promise(function (resolve) { setTimeout(resolve, 25); });
    ok("open_investments_route_does_not_crash", routeOpened);
    ok("live_timer_starts_after_route_open", routeOpened && !!window.__ledgerStockEngineV20Timer);
    ok("mobile_bottom_safe_area_padding", (function () {
      var style = document.getElementById("ledger-stocks-engine-v20-style");
      var css = style ? style.textContent : "";
      return /hub-overlay\.hub-brokerage/.test(css) && /safe-area-inset-bottom/.test(css) && /v20-investments-hub/.test(css);
    })());
    ok("firm_tab_preserves_existing_values", (function () {
      window.setStockTabV20("firm");
      var firmHtml = window.renderHubContent("brokerage");
      return /Existing Ledger Firm/.test(firmHtml) &&
        /Personal Firm/.test(firmHtml) &&
        /Advisor/.test(firmHtml) &&
        state.finance.personalFirm.hired === true &&
        num(state.finance.personalFirm.cash) === 12345;
    })());
    ok("saved_live_tab_opens_focus_desk", (function () {
      reset();
      state.finance.stocksV18.activeTabV20 = "live";
      if (typeof window.setTabV16 === "function") window.setTabV16("brokerage");
      var cards = document.querySelectorAll("[data-v20-stock-card]").length;
      var tickers = document.querySelectorAll("[data-v20-ticker-id]").length;
      var focus = document.querySelector("[data-v20-focus-desk]");
      var chart = document.querySelector("[data-v20-focus-chart] svg");
      return !!focus && !!chart && cards === 0 && tickers >= 10 && tickers <= 28 && /Trading Desk/.test(document.getElementById("app").innerHTML);
    })());
    ok("stocks_tab_has_condensed_controls", (function () {
      window.setStockTabV20("stocks");
      var app = document.getElementById("app");
      return !!document.querySelector(".v20-picker-controls") &&
        !!document.querySelector(".v20-return-switch") &&
        /Live Return/.test(app.innerHTML) &&
        /Protection/.test(app.innerHTML);
    })());
    ok("select_stock_switches_focus", (function () {
      window.selectStockV20("NVDA");
      var focus = document.querySelector("[data-v20-focus-desk]");
      return state.finance.stocksV18.selectedStockV20 === "NVDA" && focus && focus.getAttribute("data-v20-focus-id") === "NVDA";
    })());
    ok("annual_returns_tab_uses_focus_screen", (function () {
      window.setStockTabV20("annual");
      var annual = document.querySelector("[data-v20-focus-desk]");
      return !!annual && state.finance.stocksV18.activeTabV20 === "stocks" && state.finance.stocksV18.activeStocksModeV21 === "annual" && /Annual Range/.test(document.getElementById("app").innerHTML) && /Run Market Year/.test(document.getElementById("app").innerHTML);
    })());

    reset();
    window.fundInvestmentCash(100000);
    ok("funding_moves_checking_to_investment_cash", num(state.money) === 900000 && num(state.finance.brokerage) === 100000);
    var cashBeforeBuy = num(state.finance.brokerage);
    window.buyStockV18("AAPL", 50000);
    var h = state.finance.stocksV18.holdings.find(function (x) { return x.id === "AAPL"; });
    ok("buy_amount_uses_investment_cash", !!h && num(h.shares) > 2 && num(state.finance.brokerage) === cashBeforeBuy - 50000, "shares=" + num(h && h.shares) + " cash=" + num(state.finance.brokerage));
    var meta = state.finance.stocksV18.livePositionsV21.AAPL;
    ok("live_position_meta_tracks_entry", !!meta && num(meta.entryValue) > 0 && num(meta.entryPrice) > 0);
    window.setStopLossV21("AAPL", "trailing", 10);
    ok("stop_loss_rule_sets_without_crash", !!state.finance.stocksV18.stopLossRulesV21.AAPL && state.finance.stocksV18.marketAlertsV21.length >= 1);
    var valueBeforeSell = typeof window.stockValue18 === "function" ? num(window.stockValue18()) : 0;
    var cashBeforeSell = num(state.finance.brokerage);
    window.sellStockV18("AAPL", 10000);
    ok("sell_amount_returns_investment_cash", num(state.finance.brokerage) > cashBeforeSell && (typeof window.stockValue18 === "function" ? num(window.stockValue18()) : 0) < valueBeforeSell);

    var cashBeforeAnnual = num(state.finance.brokerage);
    window.buyAnnualStockV21("VOO", 25000);
    var annual = (state.finance.stocksV18.annualPositionsV21 || []).find(function (x) { return x.id === "VOO"; });
    ok("annual_buy_uses_investment_cash", !!annual && num(annual.shares) > 0 && num(state.finance.brokerage) === cashBeforeAnnual - 25000);
    var annualMarkBefore = num(annual.markPrice);
    window.liveMarketTickV18();
    ok("annual_position_ignores_live_tick", num(annual.markPrice) === annualMarkBefore);
    window.processStockMarketYearV20();
    ok("annual_position_updates_on_market_year", num(annual.markPrice) !== annualMarkBefore || num(annual.lastAnnualReturn) !== 0);
    var cashBeforeAnnualSell = num(state.finance.brokerage);
    window.sellAnnualStockV21("VOO", "all");
    ok("annual_sell_returns_cash", !(state.finance.stocksV18.annualPositionsV21 || []).some(function (x) { return x.id === "VOO"; }) && num(state.finance.brokerage) > cashBeforeAnnualSell);

    var cashBeforeShort = num(state.finance.brokerage);
    window.shortStockV20("TSLA", 20000);
    var shortPos = (state.finance.stocksV18.shortPositions || []).find(function (x) { return x.id === "TSLA"; });
    ok("short_uses_cash_collateral", !!shortPos && num(shortPos.shares) > 0 && num(state.finance.brokerage) === cashBeforeShort - 20000 && num(window.getPortfolioSummary().shortExposure) > 0);
    window.coverStockV20("TSLA", "all");
    ok("cover_returns_or_settles_collateral", !(state.finance.stocksV18.shortPositions || []).some(function (x) { return x.id === "TSLA"; }) && num(state.finance.brokerage) >= 0 && state.finance.stocksV18.tradeHistory.some(function (x) { return x.side === "cover"; }));

    reset();
    state.money = 200000;
    var checkingBefore = num(state.money);
    window.buyStockFromCheckingV20("MSFT", 50000);
    ok("buy_from_checking_is_explicit", num(state.money) === checkingBefore - 50000 && state.finance.stocksV18.holdings.some(function (x) { return x.id === "MSFT"; }));

    reset();
    if (typeof window.setTabV16 === "function") window.setTabV16("brokerage");
    var priceBefore = num(state.finance.stocksV18.prices.AAPL);
    var randomBefore = Math.random;
    Math.random = function () { return 0.99; };
    try { window.liveMarketTickV18(); } finally { Math.random = randomBefore; }
    var priceAfter = num(state.finance.stocksV18.prices.AAPL);
    ok("live_tick_moves_prices", priceAfter !== priceBefore && (state.finance.stocksV18.history.AAPL || []).length > 3, priceBefore + " -> " + priceAfter);
    ok("live_tick_adds_candles", (state.finance.stocksV18.candles.AAPL || []).length > 0);
    ok("portfolio_summary_matches_stock_value", num(window.getPortfolioSummary().stockValue) === num(window.stockValue18()));

    reset();
    window.toggleStockWatchV20("NVDA");
    ok("watchlist_toggle_adds_symbol", state.finance.stocksV18.watchlist.indexOf("NVDA") >= 0);
    window.generateEarningsV20();
    window.generateSectorNewsV20();
    window.generateAnalystRatingV20();
    ok("events_populate_tapes", state.finance.stocksV18.earnings.length >= 1 && state.finance.stocksV18.news.length >= 2);

    reset();
    var activeBefore = state.finance.stocksV18.accounts.active;
    window.setStockAccountV20("margin");
    ok("margin_account_locked_no_debt", state.finance.stocksV18.accounts.active === activeBefore && num(state.finance.stocksV18.accounts.marginDebt) === 0);

    out.info = {
      universe: window.getStockUniverse().length,
      stockValue: num(window.stockValue18 && window.stockValue18()),
      tradeHistory: (state.finance.stocksV18.tradeHistory || []).length,
      activeAccount: state.finance.stocksV18.accounts.active
    };
    out.summary = { total: Object.keys(out.pass).length, passed: Object.keys(out.pass).filter(function (k) { return out.pass[k]; }).length, failed: out.fail.length };
  } catch (e) {
    out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0, 8).join(" || ") : "");
  } finally {
    try { if (typeof window.stopLiveMarketV18 === "function") window.stopLiveMarketV18(); } catch (ignore) {}
  }
  return out;
})();
