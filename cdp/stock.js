(function () {
  var out = { pass: {}, fail: [], notes: [] };
  function ok(name, cond, detail) { out.pass[name] = !!cond; if (!cond) out.fail.push(name + (detail ? (": " + detail) : "")); }
  function num(x) { return Number.isFinite(Number(x)) ? Number(x) : 0; }
  function setupPublic(ownShares, totalShares, price) {
    window.newGame({}); if (typeof ensureStateShape === "function") ensureStateShape();
    var S = state; S.age = 45; S.stats = S.stats || {}; S.money = 0; if (!S.finance) S.finance = {};
    S.finance.bizV1860 = undefined;
    var E = window.EntrepreneurV1861; var B = E.initBiz();
    var biz = E.newBizObj("PubCo", "saas", "saas", 1000000);
    biz.productStage = "live"; biz.stage = "scale"; biz.active = true; biz.annualRevenue = 20000000; biz.valuation = totalShares * price;
    biz.public = true; biz.shareTicker = "PUB"; biz.shares = totalShares; biz._ipoPrice = price; biz.floatPct = Math.round((1 - ownShares / totalShares) * 100);
    var m = E.shim ? null : null;
    var store = (function () { S.finance.stocksV18 = { holdings: [], prices: {}, history: {} }; return S.finance.stocksV18; })();
    store.prices.PUB = price; store.history.PUB = [price];
    store.holdings.push({ id: "PUB", shares: ownShares, avgCost: price, invested: ownShares * price, _entrepreneurV1861: true });
    B.businesses = [biz]; B.activeBizId = biz.uid; B.active = true; B._migrationCheckedV1861 = true;
    return { S: S, biz: biz, store: store };
  }
  try {
    var E = window.EntrepreneurV1861;
    // ===== CSS: green/red metric color aliases exist (profit turns green) =====
    var css = (document.getElementById("ledger-entrepreneur-v1861-style") || {}).textContent || "";
    ok("css_green_metric", css.indexOf(".biz1861-metric.green b") >= 0);
    ok("css_red_metric", css.indexOf(".biz1861-metric.red b") >= 0);
    ok("css_donut", css.indexOf(".biz1862-donut") >= 0);

    // ===== donut renders in the dedicated Budget panel =====
    setupPublic(600000, 1000000, 20);
    state.finance.bizV1860.businesses[0]._mktgBudget = 250000; state.finance.bizV1860.businesses[0].headcount = 4;
    window.bizSetPanelV1862("budget");
    var prod = window.renderEntrepreneurHubV1861();
    ok("budget_donut_renders", prod.indexOf("biz1862-donut") >= 0 && prod.indexOf("Where the money goes") >= 0);

    // ===== public desk shows share counts + real float =====
    window.bizSetPanelV1862("public");
    var pub = window.renderEntrepreneurHubV1861();
    ok("shows_share_counts", pub.indexOf(" sh") >= 0 && pub.indexOf("Public float") >= 0);
    ok("shows_your_shares", /of .* sh/.test(pub));

    // ===== profit metric uses green when positive, red when negative =====
    var biz = state.finance.bizV1860.businesses[0];
    biz.annualProfit = 5000000; window.bizSetPanelV1862("overview");
    var ov1 = window.renderEntrepreneurHubV1861();
    ok("profit_green_when_positive", /class="biz1861-metric green"[^>]*>(\s|.)*?Profit/.test(ov1) || ov1.indexOf('biz1861-metric green') >= 0);
    biz.annualProfit = -3000000;
    var ov2 = window.renderEntrepreneurHubV1861();
    ok("profit_red_when_negative", ov2.indexOf('biz1861-metric bad') >= 0);

    // ===== BUG: buy back the whole float -> company goes private (delists) =====
    var s1 = setupPublic(600000, 1000000, 20); // own 60%, 400k public, price 20 -> buyout 8M
    s1.S.money = 50000000;
    window.bizBuyOwnStockV1861("max"); // should buy up to the 400k float, reach 100%, delist
    var b1 = s1.S.finance.bizV1860.businesses[0];
    ok("buyback_delists", b1.public === false, "public=" + b1.public);
    ok("buyback_ticker_removed", !s1.store.prices.PUB, "priceStill=" + s1.store.prices.PUB);
    ok("buyback_bounded_no_overspend", s1.S.money >= 50000000 - 8000000 - 5, "spent=" + (50000000 - s1.S.money));

    // ===== Take Private action buys out remaining float and delists =====
    var s2 = setupPublic(950000, 1000000, 10); // own 95%, 50k public, buyout 500k
    s2.S.money = 5000000;
    var moneyBefore = num(s2.S.money);
    window.bizTakePrivateV1862();
    var b2 = s2.S.finance.bizV1860.businesses[0];
    ok("takeprivate_delists", b2.public === false, "public=" + b2.public);
    ok("takeprivate_cost_paid", moneyBefore - num(s2.S.money) === 500000, "cost=" + (moneyBefore - num(s2.S.money)));
    ok("takeprivate_ticker_removed", !s2.store.prices.PUB);

    // ===== float metric reflects buyback (partial) =====
    var s3 = setupPublic(600000, 1000000, 20); s3.S.money = 4000000; // buy 200k more -> own 80%
    window.bizBuyOwnStockV1861(4000000); // 4M/20 = 200k shares
    var b3 = s3.S.finance.bizV1860.businesses[0];
    ok("partial_buyback_float_updates", b3.floatPct === 20 && b3.public === true, "float=" + b3.floatPct + " public=" + b3.public);

    // ===== STOCK SPLIT: price/count change, value + ownership% + float% unchanged =====
    var s4 = setupPublic(600000, 1000000, 20); // own 60%, float 40%, price 20
    var b4 = s4.S.finance.bizV1860.businesses[0];
    var ownBefore = E.shim ? null : null;
    var valBefore = 600000 * 20; var ownPctBefore = 60, floatBefore = b4.floatPct;
    window.bizSplitStockV1862(2); // 2:1 split -> shares x2, price /2
    var h4 = s4.store.holdings.find(function (x) { return x.id === "PUB"; });
    var priceAfter = s4.store.prices.PUB;
    var ownPctAfter = (num(h4.shares) / num(b4.shares)) * 100;
    ok("split_shares_doubled", num(b4.shares) === 2000000 && num(h4.shares) === 1200000, "tot=" + b4.shares + " you=" + h4.shares);
    ok("split_price_halved", Math.abs(priceAfter - 10) < 0.5, "price=" + priceAfter);
    ok("split_value_unchanged", Math.abs(num(h4.shares) * priceAfter - valBefore) < valBefore * 0.05, "val=" + (h4.shares * priceAfter));
    ok("split_ownership_unchanged", Math.abs(ownPctAfter - ownPctBefore) < 0.5, "own=" + ownPctAfter);
    ok("split_float_unchanged", b4.floatPct === floatBefore, "float=" + b4.floatPct);
    window.bizSplitStockV1862(0.5); // reverse 1:2 -> back to ~1M shares, price ~20
    ok("reverse_split_shares", Math.abs(num(b4.shares) - 1000000) < 2, "tot=" + b4.shares);
    ok("reverse_split_price", Math.abs(num(s4.store.prices.PUB) - 20) < 1, "price=" + s4.store.prices.PUB);

    // ===== DIVIDENDS: 10% of profit to shareholders, founder gets ownership share, capped =====
    var s5 = setupPublic(800000, 1000000, 20); // own 80%
    var b5 = s5.S.finance.bizV1860.businesses[0];
    b5.dividendRateV1862 = 0.10; b5.cashInBusiness = 50000000; b5.customers = 60000; b5._mktgBudget = 100000; b5.productQuality = 85; b5.nps = 45;
    var moneyBeforeDiv = num(s5.S.money);
    s5.S.age += 1; s5.S.actionsTaken = {};
    window.runEntrepreneurYearV1861();
    var b5b = s5.S.finance.bizV1860.businesses[0];
    ok("dividend_paid", num(b5b._lastDividendV1862) > 0, "pool=" + num(b5b._lastDividendV1862));
    ok("dividend_is_10pct_profit", Math.abs(num(b5b._lastDividendV1862) - Math.round(num(b5b.annualProfit) * 0.10)) <= Math.max(2, num(b5b.annualProfit) * 0.01) || num(b5b.cashInBusiness) <= 0, "pool=" + num(b5b._lastDividendV1862) + " profit=" + num(b5b.annualProfit));
    ok("dividend_founder_share", num(b5b._lastFounderDivV1862) > 0 && num(b5b._lastFounderDivV1862) < num(b5b._lastDividendV1862), "fdiv=" + num(b5b._lastFounderDivV1862) + " pool=" + num(b5b._lastDividendV1862));
    ok("dividend_taxable", num(s5.S.finance.lastEntrepreneurIncome) >= num(b5b._lastFounderDivV1862), "lastInc=" + num(s5.S.finance.lastEntrepreneurIncome));

    // dividend never makes company cash negative
    var s6 = setupPublic(800000, 1000000, 20); var b6 = s6.S.finance.bizV1860.businesses[0];
    b6.dividendRateV1862 = 0.10; b6.cashInBusiness = 1000; b6.customers = 50000; b6._mktgBudget = 0; b6.productQuality = 85; b6.nps = 45;
    s6.S.age += 1; s6.S.actionsTaken = {};
    window.runEntrepreneurYearV1861();
    ok("dividend_never_negative_cash", num(s6.S.finance.bizV1860.businesses[0].cashInBusiness) >= 0, "cash=" + num(s6.S.finance.bizV1860.businesses[0].cashInBusiness));

    // off by default for existing flows (rate 0 -> no dividend)
    var s7 = setupPublic(800000, 1000000, 20); var b7 = s7.S.finance.bizV1860.businesses[0];
    b7.dividendRateV1862 = 0; b7.cashInBusiness = 50000000; b7.customers = 60000; b7.productQuality = 85;
    s7.S.age += 1; s7.S.actionsTaken = {};
    window.runEntrepreneurYearV1861();
    ok("dividend_off_pays_nothing", num(s7.S.finance.bizV1860.businesses[0]._lastDividendV1862) === 0);

    // ===== UI: split + dividend controls render on public desk =====
    setupPublic(600000, 1000000, 20);
    window.bizSetPanelV1862("public");
    var pubUI = window.renderEntrepreneurHubV1861();
    ok("ui_split_controls", pubUI.indexOf("Split stock") >= 0 && /bizSplitStockV1862\(/.test(pubUI));
    ok("ui_dividend_controls", pubUI.indexOf("Dividend policy") >= 0 && /bizSetDividendRateV1862\(/.test(pubUI));

    out.summary = { total: Object.keys(out.pass).length, passed: Object.keys(out.pass).filter(function (k) { return out.pass[k]; }).length, failed: out.fail.length };
  } catch (e) { out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0, 6).join(" || ") : ""); }
  return out;
})();
