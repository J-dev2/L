(function () {
  var out = { pass: {}, fail: [], notes: [] };
  function ok(name, cond, detail) { out.pass[name] = !!cond; if (!cond) out.fail.push(name + (detail ? (": " + detail) : "")); }
  function num(x) { return Number.isFinite(Number(x)) ? Number(x) : 0; }
  try {
    if (typeof window.newGame === "function") window.newGame({});
    if (typeof ensureStateShape === "function") ensureStateShape();
    var S = state;
    var E = window.EntrepreneurV1861;
    S.age = 30; S.stats = S.stats || {}; S.stats.smarts = 85; S.stats.karma = 70; S.money = 1000000;
    if (!S.finance) S.finance = {};

    // ---- found a company and grow it to IPO-ready via direct setup ----
    S.finance.bizV1860 = undefined;
    var B = E.initBiz();
    var biz = E.newBizObj("Velostack", "saas", "saas", 500000);
    biz.productStage = "live"; biz.stage = "scale"; biz.customers = 40000; biz.productQuality = 80;
    biz.nps = 45; biz.brand = 65; biz.active = true; biz.equity = 100;
    biz.annualRevenue = 30000000; biz.valuation = 200000000; biz.yearsOld = 7;
    B.businesses = [biz]; B.activeBizId = biz.uid; B.active = true; B._migrationCheckedV1861 = true;

    var nwBefore = (typeof financeNetWorth === "function") ? financeNetWorth() : (typeof legacyNetWorth === "function" ? legacyNetWorth() : 0);
    var moneyBefore = S.money;

    // ===== IPO: go public, float 40% =====
    window.bizGoPublicV1861(40);
    var pub = E.getActiveBiz();
    ok("company_is_public", !!(pub && pub.public), "public=" + (pub && pub.public));
    ok("has_ticker", !!(pub && pub.shareTicker), "ticker=" + (pub && pub.shareTicker));
    var m = S.finance.stocksV18 || {};
    ok("ticker_priced", num((m.prices || {})[pub.shareTicker]) > 0, "price=" + (m.prices || {})[pub.shareTicker]);
    var holding = (m.holdings || []).find(function (h) { return h.id === pub.shareTicker; });
    ok("holding_created", !!holding && num(holding.shares) > 0, "shares=" + (holding ? holding.shares : "none"));
    ok("founder_got_ipo_cash", num(S.money) > num(moneyBefore), "money " + moneyBefore + "->" + S.money);
    var ownPct = window.EntrepreneurV1861 && (function () { var h = holding; return h ? (num(h.shares) / num(pub.shares)) * 100 : 0; })();
    ok("kept_majority_stake", ownPct > 50, "own%=" + Math.round(ownPct));

    // ===== holding shows in stocks portfolio (holdingRows18 tolerates custom ticker) =====
    var stockHubHtml = typeof window.renderBrokerageHubV11 === "function" ? window.renderBrokerageHubV11() : "";
    ok("ticker_in_stock_portfolio", stockHubHtml.indexOf(pub.shareTicker) >= 0, "len=" + stockHubHtml.length);

    // ===== net worth reflects the stake; price move changes net worth =====
    var nwAfterIpo = (typeof financeNetWorth === "function") ? financeNetWorth() : legacyNetWorth();
    var priceBefore = num(m.prices[pub.shareTicker]);
    // simulate a big price jump and confirm net worth rises
    m.prices[pub.shareTicker] = priceBefore * 2;
    var nwHigh = (typeof financeNetWorth === "function") ? financeNetWorth() : legacyNetWorth();
    m.prices[pub.shareTicker] = priceBefore * 0.25;
    var nwLow = (typeof financeNetWorth === "function") ? financeNetWorth() : legacyNetWorth();
    m.prices[pub.shareTicker] = priceBefore; // restore
    ok("networth_tracks_share_price", nwHigh > nwAfterIpo && nwLow < nwAfterIpo, "ipo=" + Math.round(nwAfterIpo) + " high=" + Math.round(nwHigh) + " low=" + Math.round(nwLow));

    // ===== invest in yourself: buy more of your own stock =====
    var sharesBefore = num(holding.shares);
    var cashBefore = S.money;
    window.bizBuyOwnStockV1861(100000);
    var holding2 = (S.finance.stocksV18.holdings || []).find(function (h) { return h.id === pub.shareTicker; });
    ok("buy_own_stock_adds_shares", num(holding2.shares) > sharesBefore, "shares " + sharesBefore + "->" + (holding2 ? holding2.shares : "none"));
    ok("buy_own_stock_spends_cash", num(S.money) < cashBefore, "money " + cashBefore + "->" + S.money);

    // ===== sell shares =====
    var cashB4Sell = S.money;
    window.bizSellOwnStockV1861(50000);
    ok("sell_own_stock_returns_cash", num(S.money) > cashB4Sell, "money " + cashB4Sell + "->" + S.money);

    // ===== yearly price update + grants run without error; price moves =====
    var priceB4Year = num(S.finance.stocksV18.prices[pub.shareTicker]);
    var threw = false, grantSeen = false;
    // green company to test grants more reliably
    S.finance.bizV1860_unused = null;
    for (var y = 0; y < 6; y++) {
      S.actionsTaken = {}; S.age += 1;
      try { window.runEntrepreneurYearV1861(); } catch (e) { threw = true; out.notes.push("year err " + e); }
      if ((pub.grantHistory || []).length) grantSeen = true;
    }
    ok("yearly_runs_clean_when_public", !threw);
    ok("share_price_history_grows", (S.finance.stocksV18.history[pub.shareTicker] || []).length > 1, "histlen=" + (S.finance.stocksV18.history[pub.shareTicker] || []).length);

    // ===== grants: green company gets grants over time =====
    S.finance.bizV1860 = undefined;
    var Bg = E.initBiz();
    var green = E.newBizObj("Ecovolt", "greentech", "licensing", 300000);
    green.productStage = "live"; green.stage = "growth"; green.customers = 5000; green.active = true; green.annualRevenue = 2000000; green.valuation = 8000000;
    Bg.businesses = [green]; Bg.activeBizId = green.uid; Bg.active = true; Bg._migrationCheckedV1861 = true;
    var grantTotal = 0;
    for (var g = 0; g < 12; g++) { S.actionsTaken = {}; S.age += 1; try { window.runEntrepreneurYearV1861(); } catch (e) {} }
    grantTotal = (green.grantHistory || []).reduce(function (s, x) { return s + num(x.amount); }, 0);
    ok("green_company_gets_grants", (green.grantHistory || []).length > 0, "grants=" + (green.grantHistory || []).length + " total=" + grantTotal);

    // ===== scale graph + public desk render =====
    S.finance.bizV1860 = B; B.activeBizId = pub.uid; // back to the public company
    var panel = window.renderEntrepreneurHubV1861();
    ok("scale_graph_renders", panel.indexOf("🚀 Scale") >= 0 && panel.indexOf("Revenue / employee") >= 0);
    ok("public_desk_renders", panel.indexOf("Public company") >= 0 && panel.indexOf("Invest in yourself") >= 0);
    ok("panel_no_throw", panel.length > 800);

    out.summary = { total: Object.keys(out.pass).length, passed: Object.keys(out.pass).filter(function (k) { return out.pass[k]; }).length, failed: out.fail.length };
  } catch (e) {
    out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0, 6).join(" || ") : "");
  }
  return out;
})();
