/* Finance / net worth ledger system. */
(function () {
  if (window.__ledgerFinanceLedgerSystemLoaded) return;
  window.__ledgerFinanceLedgerSystemLoaded = true;

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch];
    });
  }

  function n(value, fallback) {
    var num = Number(value);
    return Number.isFinite(num) ? num : (fallback || 0);
  }

  function round(value) {
    return Math.round(n(value));
  }

  function safeState() {
    try { return state || window.state || {}; } catch (e) { return window.state || {}; }
  }

  function moneyText(value) {
    try { if (typeof money === "function") return money(round(value)); } catch (e) {}
    return "$" + round(value).toLocaleString();
  }

  function compactMoney(value) {
    var abs = Math.abs(n(value));
    var sign = n(value) < 0 ? "-" : "";
    if (abs >= 1000000000000) return sign + "$" + (abs / 1000000000000).toFixed(abs >= 10000000000000 ? 1 : 2).replace(/\.0+$/, "") + "T";
    if (abs >= 1000000000) return sign + "$" + (abs / 1000000000).toFixed(abs >= 10000000000 ? 1 : 2).replace(/\.0+$/, "") + "B";
    if (abs >= 1000000) return sign + "$" + (abs / 1000000).toFixed(abs >= 10000000 ? 1 : 2).replace(/\.0+$/, "") + "M";
    if (abs >= 1000) return sign + "$" + (abs / 1000).toFixed(abs >= 10000 ? 1 : 2).replace(/\.0+$/, "") + "K";
    return moneyText(value);
  }

  function signedMoney(value) {
    value = round(value);
    return (value >= 0 ? "+" : "-") + compactMoney(Math.abs(value));
  }

  function pct(value) {
    value = n(value);
    if (!Number.isFinite(value)) value = 0;
    return (value >= 0 ? "+" : "") + (value * 100).toFixed(Math.abs(value) >= .1 ? 1 : 2) + "%";
  }

  function cls(value, zeroGood) {
    value = n(value);
    if (value > 0) return "good";
    if (value < 0) return "bad";
    return zeroGood ? "good" : "gold";
  }

  function ensureFinance() {
    var s = safeState();
    if (!s.finance || typeof s.finance !== "object" || Array.isArray(s.finance)) s.finance = {};
    var f = s.finance;
    if (!f.debts || typeof f.debts !== "object" || Array.isArray(f.debts)) f.debts = {};
    if (!f.incomeSources || typeof f.incomeSources !== "object" || Array.isArray(f.incomeSources)) f.incomeSources = {};
    if (!f.externalManager || typeof f.externalManager !== "object" || Array.isArray(f.externalManager)) f.externalManager = { id: null, capital: 0, lastReturn: 0, lastFee: 0 };
    if (!f.personalFirm || typeof f.personalFirm !== "object" || Array.isArray(f.personalFirm)) f.personalFirm = { hired: false, staff: { advisor: 1, analyst: 1, risk: 1, tax: 1 } };
    if (!f.personalFirm.staff || typeof f.personalFirm.staff !== "object") f.personalFirm.staff = { advisor: 1, analyst: 1, risk: 1, tax: 1 };
    if (!Array.isArray(f.cashFlowHistoryV1824)) f.cashFlowHistoryV1824 = Array.isArray(f.cashFlowHistoryV1836) ? f.cashFlowHistoryV1836 : [];
    return s;
  }

  function bizV1860Value(s) {
    var f = (s || {}).finance || {};
    if (typeof window.bizV1860PortfolioValue === "function") {
      try { return Math.max(0, round(window.bizV1860PortfolioValue())); } catch (e) {}
    }
    var B = f.bizV1860 || {};
    return (Array.isArray(B.businesses) ? B.businesses : []).reduce(function (sum, b) {
      if (!b || b.active === false || b.dead) return sum;
      return sum + Math.max(0, n(b.valuation || b.value)) + Math.max(0, n(b.cashInBusiness || b.companyCash));
    }, 0);
  }

  function legacyBusinessValue(s) {
    var list = Array.isArray((s.finance || {}).businesses) ? s.finance.businesses : [];
    return list.reduce(function (sum, b) {
      // Skip entrepreneur-port companies: migrated firms and the active-founder bridge are
      // counted once via bizV1860Value, so including them here would double-count.
      if (!b || b._migratedToBizV1861 || b.founderActiveV1860) return sum;
      return sum + Math.max(0, n(b && b.value)) + Math.max(0, n(b && b.retainedEarnings));
    }, 0);
  }

  // Personal firm / fund capital — mirror legacyNetWorth so the big "financial company" fund
  // shows here too (the ledger previously only counted personalFirm.cash and missed it).
  function firmCapitalV1862(f) {
    f = f || {};
    var firm = f.personalFirm || f.personalFund || {};
    return Math.max(0, n(f.managedPortfolio)) +
      Math.max(0, n(f.personalFirmCash) || n(f.firmCashV1828) || n(f.firmCash)) +
      Math.max(0, n(firm.cash) || n(firm.managed) || n(firm.capital) || n(firm.balance) || n(firm.account));
  }

  function homeValue() {
    var s = safeState();
    try {
      var h = (typeof homes !== "undefined" ? homes : []).find(function (item) { return item && item.id === s.home; });
      return Math.max(0, round(h && (h.price || h.value)));
    } catch (e) { return 0; }
  }

  function rentalValue() {
    var s = safeState();
    var total = 0;
    try {
      (Array.isArray(s.rentals) ? s.rentals : []).forEach(function (id) {
        var r = (typeof rentals !== "undefined" ? rentals : []).find(function (item) { return item && item.id === id; });
        total += Math.max(0, round(r && (r.price || r.value)));
      });
    } catch (e) {}
    return total;
  }

  function carValue() {
    var s = safeState();
    try {
      var c = (typeof cars !== "undefined" ? cars : []).find(function (item) { return item && item.id === s.car; });
      return Math.max(0, round(c && (c.price || c.value)));
    } catch (e) { return 0; }
  }

  function stockValue() {
    var s = safeState();
    try { if (typeof stockValue18 === "function") return Math.max(0, round(stockValue18())); } catch (e) {}
    var m = (s.finance || {}).stocksV18 || {};
    if (!Array.isArray(m.holdings)) return Math.max(0, round((s.finance || {}).stockValue));
    return Math.max(0, round(m.holdings.reduce(function (sum, h) {
      var price = 0;
      if (m.prices && m.prices[h.id] != null) price = n(m.prices[h.id]);
      else if (m.prices && m.prices[h.symbol] != null) price = n(m.prices[h.symbol]);
      else price = n(h.price || h.currentPrice || h.avgCost);
      return sum + n(h.shares) * price;
    }, 0)));
  }

  function realEstateStats() {
    try {
      if (typeof window.reEnsureV1863 === "function") window.reEnsureV1863();
      else if (typeof window.reEnsureV1862 === "function") window.reEnsureV1862();
    } catch (e) {}
    var stats = null;
    try {
      if (typeof window.rePortfolioStatsV1863 === "function") stats = window.rePortfolioStatsV1863();
      else if (typeof window.rePortfolioStatsV1862 === "function") stats = window.rePortfolioStatsV1862();
    } catch (e2) {}
    stats = stats || {};
    var value = Math.max(0, n(stats.value));
    var debt = Math.max(0, n(stats.debt));
    var equity = Number.isFinite(Number(stats.equity)) ? n(stats.equity) : value - debt;
    return {
      value: Math.max(0, round(value)),
      debt: Math.max(0, round(debt)),
      equity: round(equity),
      annualCashFlow: round(n(stats.annualCashFlow))
    };
  }

  function assetRows() {
    var s = ensureFinance();
    var f = s.finance || {};
    var re = realEstateStats();
    var reEquity = re.value; // Keep the existing row slot, but pair it with the mortgage debt row below.
    var investedStocks = stockValue();
    var childTrusts = Object.keys(f.trustFunds || {}).reduce(function (sum, key) { return sum + Math.max(0, n(f.trustFunds[key])); }, 0);
    return [
      { id: "checking", label: "Checking cash", value: Math.max(0, n(s.money)), raw: n(s.money), note: n(s.money) < 0 ? "Overdrawn cash is counted under debts." : "Spendable cash right now." },
      { id: "savings", label: "Cash savings", value: Math.max(0, n(s.savings)), note: "Reserve account." },
      { id: "super", label: "Super Saver / ISA", value: Math.max(0, n(f.superSaver)), note: "Higher-yield reserve." },
      { id: "brokerageCash", label: "Brokerage cash", value: Math.max(0, n(f.brokerage) + n(f.brokerageCash)), note: "Uninvested cash in Stocks." },
      { id: "stocks", label: "Real stocks", value: investedStocks, note: "Market value of current holdings." },
      { id: "firm", label: "Personal firm capital", value: firmCapitalV1862(f), note: "Own fund office / managed account." },
      { id: "manager", label: "Outside manager capital", value: Math.max(0, n(f.externalManager && f.externalManager.capital) + n(f.managerFirmsV1829 && f.managerFirmsV1829.capital)), note: "Professionally managed capital." },
      { id: "business", label: "Operating businesses", value: Math.max(0, legacyBusinessValue(s) + bizV1860Value(s)), note: "Companies you own and run, including migrated entrepreneur-port firms." },
      { id: "ventureLoans", label: "Owner loans to ventures", value: Math.max(0, (typeof window.ventureOwnerLoanTotalV1860 === "function" ? n(window.ventureOwnerLoanTotalV1860()) : 0)), note: "Cash you lent your own companies; repaid yearly with interest." },
      { id: "familyTrust", label: "Family trust", value: Math.max(0, n(f.familyTrustV1839 && f.familyTrustV1839.corpus)), note: "Protected trust corpus managed in Legal." },
      { id: "childTrusts", label: "Child trusts", value: Math.max(0, childTrusts), note: "Heir accounts funded through Legal." },
      { id: "retirement", label: "Retirement", value: Math.max(0, n(s.ira) + n(s.retirement401k)), note: "IRA, 401(k), and pension money." },
      { id: "property", label: "Property equity", value: Math.max(0, homeValue() + rentalValue() + reEquity), note: "Primary residence plus Real Estate portfolio value; portfolio mortgages are listed under debts." },
      { id: "collection", label: "Vehicles / collection", value: Math.max(0, carValue() + n(f.collectionValue) + n(f.shoppingCollectionV1854)), note: "Owned vehicles, luxury items, and art." },
      { id: "family", label: "Family support", value: Math.max(0, n((s.parentFinances || {}).liquid)), note: "Accessible family support when modeled." }
    ].map(function (row) { row.value = Math.max(0, round(row.value)); return row; });
  }

  function debtRows() {
    var s = ensureFinance();
    var f = s.finance || {};
    var re = realEstateStats();
    return [
      { id: "negativeChecking", label: "Negative checking", value: Math.max(0, -n(s.money)), note: "Cash account below zero.", key: "money", stateKey: true },
      { id: "education", label: "Education debt", value: Math.max(0, n(s.debt)), note: "School loans and tuition balances.", key: "debt", stateKey: true },
      { id: "creditCardDebt", label: "Credit card balance", value: Math.max(0, n(f.creditCardDebt)), note: "Unsecured borrowing.", key: "creditCardDebt" },
      { id: "assetBackedLoan", label: "Secured borrowing", value: Math.max(0, n(f.assetBackedLoan)), note: "Loans backed by savings or investments.", key: "assetBackedLoan" },
      { id: "propertyMortgage", label: "Property mortgage debt", value: Math.max(0, re.debt), note: "Mortgages attached to Real Estate portfolio properties." },
      { id: "personalLine", label: "Personal line of credit", value: Math.max(0, n((f.personalLineV1860 || {}).balance)), note: "Score-gated revolving line. Manage in Money." },
      { id: "taxDebt", label: "Tax debt", value: Math.max(0, n(f.taxDebt || f.debts.taxDebt || s.taxDebt)), note: "Unpaid taxes. Full tools live in Legal.", key: "taxDebt", syncTax: true },
      { id: "medicalDebt", label: "Medical debt", value: Math.max(0, n(f.medicalDebt || s.medicalDebt)), note: "Uncovered care.", key: "medicalDebt" },
      { id: "personalDebt", label: "Personal debt", value: Math.max(0, n(f.personalDebt)), note: "Other personal obligations.", key: "personalDebt" }
    ].map(function (row) { row.value = Math.max(0, round(row.value)); return row; });
  }

  function totals() {
    var assets = assetRows();
    var debts = debtRows();
    var totalAssets = assets.reduce(function (sum, row) { return sum + Math.max(0, row.value); }, 0);
    var totalDebts = debts.reduce(function (sum, row) { return sum + Math.max(0, row.value); }, 0);
    return { assets: assets, debts: debts, totalAssets: totalAssets, totalDebts: totalDebts, netWorth: totalAssets - totalDebts };
  }
  try { window.financeLedgerTotalsV1836 = totals; } catch (e) {}

  function rawCashFlow() {
    var cf = {};
    try { if (typeof cashFlowV6 === "function") cf = cashFlowV6() || {}; } catch (e) {}
    try { if ((!cf || !Object.keys(cf).length || cf.inflow == null) && typeof computeAnnualCashFlowV6 === "function") cf = computeAnnualCashFlowV6() || cf || {}; } catch (e2) {}
    return cf || {};
  }

  function taxValue(cf) {
    if (cf && typeof cf.tax === "object") return Math.max(0, round(cf.tax.finalTax || cf.tax.total || cf.tax.due));
    return Math.max(0, round((cf && (cf.tax || cf.taxes)) || (safeState().finance || {}).lastYearTaxes));
  }

  function investmentCashIncome() {
    var f = (ensureFinance().finance || {});
    var src = f.incomeSources || {};
    var stocks = f.stocksV18 || {};
    return Math.max(0, round(
      n(src.dividends) +
      n(src.stockDividends) +
      n(stocks.lastDividends) +
      n(f.lastDividendIncome) +
      n(src.realizedGains) +
      n(src.managerDistributionsV1829) +
      n(src.claimedDistributionsV1829) +
      n(src.firmDistribution) +
      n(f.lastFirmDistribution) +
      n(src.fundCarryV1825) +
      n((f.fundTrackV189 || {}).lastFees)
    ));
  }

  function investmentPaperReturn() {
    var f = (ensureFinance().finance || {});
    return round(
      n(f.lastInvestmentReturn) +
      n(f.personalFirm && f.personalFirm.lastReturn) +
      n(f.externalManager && f.externalManager.lastReturn) +
      n((f.fundTrackV189 || {}).lastReturn)
    );
  }

  function financeFlow() {
    var s = ensureFinance();
    var f = s.finance || {};
    var cf = rawCashFlow();
    var salary = s.job ? Math.max(0, round(s.job.salary)) : 0;
    var allowance = n(s.age) >= 5 && n(s.age) <= 17 ? Math.max(0, round(s.allowance)) : 0;
    var business = Math.max(0, round(cf.businessIncome || f.lastEntrepreneurIncome || f.lastBusinessIncome || (f.incomeSources || {}).businessIncome));
    var rental = 0;
    try {
      (Array.isArray(s.rentals) ? s.rentals : []).forEach(function (id) {
        var r = (typeof rentals !== "undefined" ? rentals : []).find(function (item) { return item && item.id === id; });
        rental += Math.max(0, round(n(r && r.rent) - n(r && r.upkeep)));
      });
    } catch (e) {}
    var reFlow = n(f.lastRealEstateCashFlowV1863 || f.lastRealEstateCashFlowV1862);
    try {
      if (!reFlow && typeof window.rePortfolioStatsV1863 === "function") {
        reFlow = n(window.rePortfolioStatsV1863().annualCashFlow);
      } else if (!reFlow && typeof window.rePortfolioStatsV1862 === "function") {
        reFlow = n(window.rePortfolioStatsV1862().annualCashFlow);
      }
    } catch (e2) {}
    var investCash = investmentCashIncome();
    var paper = investmentPaperReturn();
    var interest = Math.max(0, round(cf.savingsInterest || f.lastSavingsInterest));
    var income = [
      { label: "Job salary", value: salary, note: s.job ? s.job.title || "Current job" : "No current job." },
      { label: "Allowance / support", value: allowance, note: "Family support while young." },
      { label: "Business income", value: business, note: "Companies, NIL, side deals, and owner income." },
      { label: "Investment cash", value: investCash, note: "Dividends, distributions, realized gains, and fund fees." },
      { label: "Investment growth", value: paper, note: paper >= 0 ? "Paper or account growth inside assets." : "Market or managed-account drawdown." },
      { label: "Legacy rental net", value: rental, note: "Old rental records before migration." },
      { label: "Real estate cash flow", value: reFlow, note: "Portfolio rent minus upkeep and mortgages." },
      { label: "Interest / yield", value: interest, note: "Savings and Super Saver yield." }
    ].map(function (row) { row.value = round(row.value); return row; });
    var taxes = taxValue(cf);
    var expenses = [
      { label: "Taxes", value: taxes, note: "Income, investment, state/country, and true-up taxes." },
      { label: "Lifestyle", value: Math.max(0, round(cf.lifestyleCost || cf.living)), note: "Normal yearly spending." },
      { label: "Housing", value: Math.max(0, round(cf.housingCost)), note: "Rent, mortgage, or home costs." },
      { label: "Vehicles / transport", value: Math.max(0, round(cf.carCost)), note: "Vehicle and transit costs." },
      { label: "Insurance", value: Math.max(0, round(cf.insuranceCost || f.lastInsuranceCost)), note: "Health and other premiums." },
      { label: "Debt interest", value: Math.max(0, round(cf.debtInterest)), note: "Interest on loans and credit." },
      { label: "Transfers to assets", value: Math.max(0, round(cf.transfers || cf.autoSave || 0)), note: "Savings and investing moves, not true losses." }
    ];
    var cashInflow = Math.max(0, round(cf.inflow)) || income.reduce(function (sum, row) {
      return sum + Math.max(0, row.label === "Investment growth" ? 0 : row.value);
    }, 0);
    var outflow = Math.max(0, round(cf.outflow)) || expenses.reduce(function (sum, row) { return sum + Math.max(0, row.value); }, 0);
    var checkingChange = Number.isFinite(Number(cf.checkingChange)) && Number(cf.checkingChange) !== 0
      ? round(cf.checkingChange)
      : round(cashInflow - outflow);
    var totalIncome = income.reduce(function (sum, row) { return sum + Math.max(0, row.value); }, 0);
    return {
      raw: cf,
      income: income,
      expenses: expenses.map(function (row) { row.value = round(row.value); return row; }),
      cashInflow: cashInflow,
      totalIncome: totalIncome,
      outflow: outflow,
      checkingChange: checkingChange,
      investmentCash: investCash,
      investmentPaper: paper,
      taxes: taxes
    };
  }

  function historyPoints(currentNet) {
    var s = ensureFinance();
    var f = s.finance || {};
    var points = [];
    function add(item) {
      if (!item || typeof item !== "object") return;
      var age = item.age != null ? round(item.age) : (item.year != null ? round(item.year) : null);
      var net = item.netWorthAfter != null ? round(item.netWorthAfter) : (item.netWorth != null ? round(item.netWorth) : null);
      if (net == null || !Number.isFinite(net)) return;
      points.push({
        age: age == null ? "now" : age,
        netWorth: net,
        income: Math.max(0, round(item.income || item.inflow)),
        expenses: Math.max(0, round(item.expenses || item.outflow)),
        taxes: Math.max(0, round(item.taxes || item.tax)),
        change: item.netWorthChange != null ? round(item.netWorthChange) : null
      });
    }
    (Array.isArray(f.financialHistory) ? f.financialHistory : []).forEach(add);
    (Array.isArray(f.netWorthHistory) ? f.netWorthHistory : []).forEach(add);
    (Array.isArray(f.cashFlowHistoryV1824) ? f.cashFlowHistoryV1824 : []).forEach(add);
    if (f.lastFinancialSnapshot) add(f.lastFinancialSnapshot);
    var byAge = {};
    points.forEach(function (point) { byAge[String(point.age)] = point; });
    points = Object.keys(byAge).map(function (key) { return byAge[key]; }).sort(function (a, b) {
      if (a.age === "now") return 1;
      if (b.age === "now") return -1;
      return n(a.age) - n(b.age);
    });
    if (!points.length || points[points.length - 1].netWorth !== round(currentNet)) {
      points.push({ age: round(s.age || 0), netWorth: round(currentNet), income: 0, expenses: 0, taxes: 0, change: null });
    }
    points = points.slice(-8);
    for (var i = 0; i < points.length; i++) {
      if (points[i].change == null) {
        points[i].change = i > 0 ? points[i].netWorth - points[i - 1].netWorth : 0;
      }
    }
    return points;
  }

  function netMovement(points, net) {
    points = Array.isArray(points) ? points : [];
    if (points.length >= 2) {
      var latest = points[points.length - 1];
      var prev = points[points.length - 2];
      var change = latest.netWorth - prev.netWorth;
      var base = Math.max(1, Math.abs(prev.netWorth));
      return { change: change, pct: change / base, base: prev.netWorth };
    }
    var f = (ensureFinance().finance || {});
    var snap = f.lastFinancialSnapshot || (Array.isArray(f.financialHistory) ? f.financialHistory[0] : null) || {};
    var snapChange = round(snap.netWorthChange);
    if (snapChange) {
      var before = snap.netWorthBefore != null ? round(snap.netWorthBefore) : Math.max(1, round(net - snapChange));
      return { change: snapChange, pct: snapChange / Math.max(1, Math.abs(before)), base: before };
    }
    return { change: 0, pct: 0, base: round(net) };
  }

  function liquidBuckets(includeChecking) {
    var s = ensureFinance();
    var f = s.finance || {};
    var buckets = [];
    if (includeChecking !== false) buckets.push({ id: "checking", label: "Checking", obj: s, key: "money", value: Math.max(0, round(s.money)) });
    buckets.push({ id: "savings", label: "Savings", obj: s, key: "savings", value: Math.max(0, round(s.savings)) });
    buckets.push({ id: "super", label: "Super Saver", obj: f, key: "superSaver", value: Math.max(0, round(f.superSaver)) });
    buckets.push({ id: "brokerage", label: "Brokerage cash", obj: f, key: "brokerage", value: Math.max(0, round(f.brokerage)) });
    buckets.push({ id: "brokerageCash", label: "Brokerage cash", obj: f, key: "brokerageCash", value: Math.max(0, round(f.brokerageCash)) });
    buckets.push({ id: "firm", label: "Personal firm", obj: f, key: "managedPortfolio", value: Math.max(0, round(f.managedPortfolio)) });
    buckets.push({ id: "manager", label: "Outside manager", obj: f.externalManager || {}, key: "capital", value: Math.max(0, round(f.externalManager && f.externalManager.capital)) });
    return buckets.filter(function (bucket) { return bucket.obj && bucket.key && bucket.value > 0; });
  }

  function totalLiquid(includeChecking) {
    return liquidBuckets(includeChecking).reduce(function (sum, bucket) { return sum + bucket.value; }, 0);
  }

  function pullLiquid(amount, includeChecking) {
    amount = Math.max(0, round(amount));
    var remaining = amount;
    var used = [];
    liquidBuckets(includeChecking).forEach(function (bucket) {
      if (remaining <= 0) return;
      var have = Math.max(0, round(bucket.obj[bucket.key]));
      var take = Math.min(have, remaining);
      if (take <= 0) return;
      bucket.obj[bucket.key] = have - take;
      remaining -= take;
      used.push({ label: bucket.label, amount: take });
    });
    return { paid: amount - remaining, remaining: remaining, used: used };
  }

  function usedText(used) {
    used = Array.isArray(used) ? used : [];
    return used.map(function (item) { return item.label + " " + moneyText(item.amount); }).join(", ") || "no liquid assets";
  }

  function saveRenderFinance() {
    try { if (typeof save === "function") save(); } catch (e) {}
    try {
      if (typeof window.renderHubInPlaceV16 === "function") return window.renderHubInPlaceV16("finance");
    } catch (e2) {}
    try { if (typeof render === "function") render(); } catch (e3) {}
  }

  function logFinance(message, deltas) {
    try { if (typeof addLog === "function") return addLog(message, deltas || {}); } catch (e) {}
    try { if (typeof addToast === "function") return addToast(message); } catch (e2) {}
  }

  function toastFinance(message) {
    try { if (typeof addToast === "function") return addToast(message); } catch (e) {}
    return logFinance(message);
  }

  function setDebtValue(row, value) {
    var s = ensureFinance();
    var f = s.finance || {};
    value = Math.max(0, round(value));
    if (row.id === "negativeChecking") {
      s.money = value > 0 ? -value : Math.max(0, n(s.money));
      return;
    }
    if (row.id === "personalLine") {
      if (!f.personalLineV1860 || typeof f.personalLineV1860 !== "object") f.personalLineV1860 = { balance: 0, rate: .12 };
      f.personalLineV1860.balance = value;
      return;
    }
    if (row.stateKey) s[row.key] = value;
    else f[row.key] = value;
    if (row.syncTax) {
      f.taxDebt = value;
      f.debts.taxDebt = value;
      s.taxDebt = value;
      if (s.tax && typeof s.tax === "object") s.tax.taxDebt = value;
    }
    if (row.id === "medicalDebt") s.medicalDebt = value;
  }

  function findDebtRow(kind) {
    kind = String(kind || "");
    return debtRows().find(function (row) { return row.id === kind || row.key === kind; }) || null;
  }

  window.payFinanceDebtV1836 = function (kind, amount) {
    var row = findDebtRow(kind);
    if (!row || row.value <= 0) return toastFinance("No debt balance found for that line.");
    var requested = amount === "max" ? row.value : Math.max(0, round(amount));
    requested = Math.min(row.value, requested);
    if (!requested) return toastFinance("Enter a real payoff amount.");
    var pull = pullLiquid(requested, true);
    if (!pull.paid) return toastFinance("No liquid assets available for payoff.");
    setDebtValue(row, row.value - pull.paid);
    if (row.syncTax) {
      var f = ensureFinance().finance || {};
      f.taxLegalRisk = Math.max(0, round(f.taxLegalRisk) - Math.ceil(pull.paid / 10000));
    }
    logFinance("Paid " + moneyText(pull.paid) + " toward " + row.label + " from " + usedText(pull.used) + ".", {});
    saveRenderFinance();
  };

  window.payFinanceCustomDebtV1836 = function (kind, inputId) {
    var value = "";
    try {
      var el = document.getElementById(inputId);
      value = el ? String(el.value || "").replace(/[^0-9.]/g, "") : "";
      if (el) el.value = "";
    } catch (e) {}
    return window.payFinanceDebtV1836(kind, value);
  };

  window.raiseFinanceCashV1836 = function (amount) {
    var available = totalLiquid(false);
    var requested = amount === "max" ? available : Math.min(available, Math.max(0, round(amount)));
    if (!requested) return toastFinance("No non-checking liquid assets available.");
    var pull = pullLiquid(requested, false);
    var s = ensureFinance();
    s.money = round(n(s.money) + pull.paid);
    logFinance("Raised " + moneyText(pull.paid) + " into checking from " + usedText(pull.used) + ".", { money: pull.paid });
    saveRenderFinance();
  };

  function action(label, actionCode, kind, disabled) {
    return '<button class="money-btn ' + esc(kind || "") + '" onclick="event.preventDefault();event.stopPropagation();' + esc(actionCode) + '" ' + (disabled ? "disabled" : "") + '>' + esc(label) + '</button>';
  }

  function openAction(label, hub) {
    return action(label, "(window.setTabV16 || window.setTab || setTab)('" + esc(hub) + "')", "blue", false);
  }

  function metric(label, value, note, className, barPct, barKind) {
    var bar = barPct != null ? '<div class="bar"><div class="fill ' + esc(barKind || "") + '" style="width:' + Math.max(0, Math.min(100, barPct)) + '%"></div></div>' : "";
    return '<div class="v1836-metric ' + esc(className || "") + '"><span>' + esc(label) + '</span><b>' + esc(value) + '</b><em>' + esc(note || "") + '</em>' + bar + '</div>';
  }

  function lineRows(rows, mode) {
    return (rows || []).filter(function (row) { return row.value || mode === "asset"; }).map(function (row) {
      var className = mode === "debt" || mode === "expense" ? (row.value ? "bad" : "good") : cls(row.value, true);
      var amount = mode === "debt" || mode === "expense" ? compactMoney(row.value) : signedMoney(row.value);
      return '<div class="v1836-line ' + esc(className) + '"><div><b>' + esc(row.label) + '</b><span>' + esc(row.note || "") + '</span></div><strong>' + esc(amount) + '</strong></div>';
    }).join("") || '<div class="v1836-empty">No lines yet. Age up once and this ledger will start filling in.</div>';
  }

  function directionPanel(parts, flow, movement) {
    var narrative = "Net worth and checking are telling the same story.";
    if (movement.change > 0 && flow.checkingChange < 0) narrative = "Asset-heavy year: net worth is up even though checking moved down.";
    if (movement.change < 0 && flow.checkingChange > 0) narrative = "Cash improved, but asset values or debts pulled net worth down.";
    if (movement.change > 0 && flow.checkingChange >= 0) narrative = "Clean year: both net worth and checking moved up.";
    if (movement.change < 0 && flow.checkingChange <= 0) narrative = "Pressure year: cash and net worth both moved down.";
    var debtLoadPct = parts.totalAssets ? Math.round(parts.totalDebts / Math.max(1, parts.totalAssets) * 100) : 0;
    return '<section class="panel v1836-direction"><div class="section-label">🚦 Direction lights</div><div class="v1836-direction-grid">' +
      metric("Net worth move", signedMoney(movement.change), pct(movement.pct) + " from saved history.", cls(movement.change, true)) +
      metric("Checking move", signedMoney(flow.checkingChange), "Spendable cash, after expenses and transfers.", cls(flow.checkingChange, true)) +
      metric("Investment growth", signedMoney(flow.investmentPaper), "Account value movement, not always spendable.", cls(flow.investmentPaper, true)) +
      metric("Debt load", debtLoadPct + "%", compactMoney(parts.totalDebts) + " against assets.", parts.totalDebts ? "bad" : "good", debtLoadPct, debtLoadPct >= 50 ? "low" : "high") +
      '</div><p>' + esc(narrative) + '</p></section>';
  }

  function hero(parts, flow, movement) {
    var positive = movement.change >= 0;
    return '<section class="v1836-hero"><div><div class="money-kicker">Whole-life finance tracker</div><h2>Net Worth Ledger</h2><p>Assets, debts, income, expenses, taxes, and history in one readable finance tab. Money handles banking; Stocks handles investing controls; Legal handles tax/legal coverage.</p><div class="v1836-chip-row"><span class="' + (positive ? "good" : "bad") + '">Net ' + signedMoney(movement.change) + '</span><span>Income ' + compactMoney(flow.totalIncome) + '</span><span>Expenses ' + compactMoney(flow.outflow) + '</span><span>Liquid ' + compactMoney(totalLiquid(true)) + '</span></div></div><strong class="' + (parts.netWorth >= 0 ? "good" : "bad") + '">' + compactMoney(parts.netWorth) + '<span>net worth</span></strong></section>';
  }

  function debtPayoffPanel(parts) {
    var liquid = totalLiquid(true);
    var cards = parts.debts.filter(function (row) { return row.value > 0; }).map(function (row) {
      var id = "v1836-debt-" + row.id;
      return '<div class="v1836-debt-card"><div><span>' + esc(row.label) + '</span><b>' + compactMoney(row.value) + '</b><em>' + esc(row.note) + '</em></div><div class="v1836-debt-actions">' +
        action("Pay $1K", "payFinanceDebtV1836('" + esc(row.id) + "',1000)", "red", liquid <= 0 || row.value < 1000) +
        action("Pay $10K", "payFinanceDebtV1836('" + esc(row.id) + "',10000)", "red", liquid <= 0 || row.value < 10000) +
        action("Pay $1M", "payFinanceDebtV1836('" + esc(row.id) + "',1000000)", "red", liquid <= 0 || row.value < 1000000) +
        action("Pay Max", "payFinanceDebtV1836('" + esc(row.id) + "','max')", "red", liquid <= 0) +
        '</div><div class="v1836-custom"><input id="' + esc(id) + '" inputmode="numeric" placeholder="Custom payoff $"><button class="money-btn red" onclick="event.preventDefault();event.stopPropagation();payFinanceCustomDebtV1836(\'' + esc(row.id) + '\',\'' + esc(id) + '\')" ' + (liquid <= 0 ? "disabled" : "") + '>Pay</button></div></div>';
    }).join("");
    if (!cards) cards = '<div class="v1836-empty good">No active debt lines. Nice and clean.</div>';
    return '<section class="panel v1836-debt-payoff"><div class="section-label">📉 Debt payoff</div><div class="v1836-panel-head"><div><b>Pay from liquid assets</b><span>Checking, savings, Super Saver, brokerage cash, personal firm capital, and outside-manager capital can help clear debt.</span></div><em>' + compactMoney(liquid) + ' liquid</em></div><div class="v1836-debt-grid">' + cards + '</div></section>';
  }

  function liquidityPanel() {
    var checking = n(ensureFinance().money);
    var nonChecking = totalLiquid(false);
    var checkingSharePct = Math.round(checking / Math.max(1, checking + nonChecking) * 100);
    return '<section class="panel v1836-liquidity"><div class="section-label">💧 Liquidity</div><div class="v1836-split-row"><div>' +
      metric("Checking", compactMoney(checking), "Spendable account.", cls(checking, true), checkingSharePct, checkingSharePct < 15 ? "low" : "high") +
      metric("Non-checking liquid", compactMoney(nonChecking), "Can be raised into checking.", nonChecking ? "good" : "gold") +
      '</div><div class="v1836-action-stack">' +
      action("Raise $10K Cash", "raiseFinanceCashV1836(10000)", "green", nonChecking < 10000) +
      action("Raise $1M Cash", "raiseFinanceCashV1836(1000000)", "green", nonChecking < 1000000) +
      action("Raise Max Cash", "raiseFinanceCashV1836('max')", "green", nonChecking <= 0) +
      '</div></div></section>';
  }

  function trendChart(points) {
    var values = points.map(function (point) { return point.netWorth; });
    var min = Math.min.apply(null, values.concat([0]));
    var max = Math.max.apply(null, values.concat([1]));
    var span = Math.max(1, max - min);
    return '<div class="v1836-trend">' + points.map(function (point) {
      var height = 16 + Math.round((point.netWorth - min) / span * 78);
      return '<div class="v1836-bar-wrap"><i class="' + cls(point.change, true) + '" style="height:' + height + '%"></i><b>' + esc(String(point.age)) + '</b><span>' + esc(compactMoney(point.netWorth)) + '</span></div>';
    }).join("") + '</div>';
  }

  function donut(parts) {
    var buckets = [
      { label: "Cash", value: Math.max(0, n(safeState().money) + n(safeState().savings) + n((safeState().finance || {}).superSaver)), color: "#b9dc8a" },
      { label: "Invested", value: parts.assets.filter(function (row) { return ["brokerageCash", "stocks", "firm", "manager"].indexOf(row.id) >= 0; }).reduce(function (sum, row) { return sum + row.value; }, 0), color: "#7ea0ac" },
      { label: "Retirement", value: parts.assets.find(function (row) { return row.id === "retirement"; }).value, color: "#f0ca7b" },
      { label: "Property", value: parts.assets.find(function (row) { return row.id === "property"; }).value, color: "#e9927d" },
      { label: "Other", value: parts.assets.filter(function (row) { return ["collection", "family", "familyTrust", "childTrusts", "business", "ventureLoans"].indexOf(row.id) >= 0; }).reduce(function (sum, row) { return sum + row.value; }, 0), color: "#c9a3d6" }
    ];
    var total = Math.max(1, parts.totalAssets);
    var start = 0;
    var stops = buckets.map(function (bucket) {
      var end = start + Math.max(0, bucket.value) / total * 100;
      var out = bucket.color + " " + start.toFixed(2) + "% " + end.toFixed(2) + "%";
      start = end;
      return out;
    }).join(",");
    if (start <= 0) stops = "#3a3329 0% 100%";
    return '<div class="v1836-donut" style="background:conic-gradient(' + esc(stops) + ')"><div><b>' + compactMoney(parts.totalAssets) + '</b><span>assets</span></div></div><div class="v1836-legend">' + buckets.map(function (bucket) {
      return '<span><i style="background:' + esc(bucket.color) + '"></i>' + esc(bucket.label) + ' ' + compactMoney(bucket.value) + '</span>';
    }).join("") + '</div>';
  }

  function shortcuts(parts) {
    var f = ensureFinance().finance || {};
    var accObj = f.accountant || f.accountantPlan;
    var accountant = String((accObj && typeof accObj === "object") ? (accObj.name || accObj.label || accObj.id || "none") : (accObj || "none")).replace(/_/g, " ");
    var risk = Math.max(0, round(f.taxLegalRisk));
    var invested = parts.assets.filter(function (row) { return ["brokerageCash", "stocks", "firm", "manager"].indexOf(row.id) >= 0; }).reduce(function (sum, row) { return sum + row.value; }, 0);
    var childTrusts = Object.keys(f.trustFunds || {}).reduce(function (sum, key) { return sum + Math.max(0, n(f.trustFunds[key])); }, 0);
    var trustTotal = n((f.familyTrustV1839 || {}).corpus) + childTrusts + n(((safeState().estateV1831 || {}).assets || {}).trustCash) + n((f.familyEnterpriseV1833 || {}).totalTrustDividends);
    return '<section class="panel v1836-shortcuts"><div class="section-label">🧭 Where controls live</div><div class="v1836-shortcut-grid">' +
      '<div><span>Banking controls</span><b>Money</b><em>Checking, savings, budget, credit, insurance.</em>' + openAction("Open Money", "money") + '</div>' +
      '<div><span>Investment controls</span><b>' + compactMoney(invested) + '</b><em>Investments, outside managers, personal firm, fund track.</em>' + openAction("Open Investments", "brokerage") + '</div>' +
      '<div><span>Legal / accountant</span><b>' + esc(accountant === "none" ? "No accountant" : accountant) + '</b><em>Tax debt ' + compactMoney(f.taxDebt || 0) + ', risk ' + risk + '/100.</em>' + openAction("Open Legal", "law") + '</div>' +
      '<div><span>Family trust</span><b>' + compactMoney(trustTotal) + '</b><em>Trust corpus and child trusts stay in Legal.</em>' + openAction("Open Legal", "law") + '</div>' +
      '</div></section>';
  }

  function renderFinanceLedger() {
    var parts = totals();
    var flow = financeFlow();
    var points = historyPoints(parts.netWorth);
    var movement = netMovement(points, parts.netWorth);
    return '<div class="v1836-finance-shell">' +
      hero(parts, flow, movement) +
      '<section class="v1836-kpi-row">' +
      metric("Total assets", compactMoney(parts.totalAssets), "Everything owned or invested.", "good") +
      metric("Total debts", compactMoney(parts.totalDebts), "All visible liabilities.", parts.totalDebts ? "bad" : "good") +
      metric("Cash received", compactMoney(flow.cashInflow), "Spendable income before outflow.", flow.cashInflow ? "good" : "gold") +
      metric("Cash outflow", compactMoney(flow.outflow), "Expenses, taxes, interest, transfers.", flow.outflow ? "bad" : "good") +
      metric("Credit score", String(round((safeState().finance || {}).creditScore || 650)), "Borrowing health.", round((safeState().finance || {}).creditScore || 650) >= 700 ? "good" : "gold") +
      '</section>' +
      directionPanel(parts, flow, movement) +
      '<div class="v1836-main-grid"><section class="panel"><div class="section-label">💰 Assets</div>' + lineRows(parts.assets, "asset") + '</section><section class="panel"><div class="section-label">📉 Debts</div>' + lineRows(parts.debts, "debt") + '</section><section class="panel"><div class="section-label">💵 Income sources</div>' + lineRows(flow.income, "income") + '</section><section class="panel"><div class="section-label">🧾 Expenses</div>' + lineRows(flow.expenses, "expense") + '</section></div>' +
      liquidityPanel() +
      debtPayoffPanel(parts) +
      '<div class="v1836-chart-grid"><section class="panel"><div class="section-label">📈 Net worth trend</div>' + trendChart(points) + '<div class="v1836-note">Latest: income ' + compactMoney(flow.totalIncome) + ', expenses ' + compactMoney(flow.outflow) + ', taxes ' + compactMoney(flow.taxes) + '.</div></section><section class="panel"><div class="section-label">🥧 Asset mix</div>' + donut(parts) + '</section></div>' +
      shortcuts(parts) +
      '</div>';
  }

  var previousRenderHubContent = window.renderHubContent || (typeof renderHubContent === "function" ? renderHubContent : null);
  if (previousRenderHubContent && !window.__ledgerFinanceRenderV1836Wrapped) {
    window.__ledgerFinanceRenderV1836Wrapped = true;
    window.renderHubContent = function (hubId) {
      if (hubId === "finance" || hubId === "networth" || hubId === "network") {
        try { ensureFinance(); return renderFinanceLedger(); }
        catch (e) {
          return '<div class="v1836-finance-shell"><section class="panel v1836-recovered"><div class="section-label">🔧 Finance recovered</div><b>Net Worth Ledger hit a recoverable error.</b><p>' + esc(e && (e.message || e)) + '</p></section></div>';
        }
      }
      return previousRenderHubContent.apply(this, arguments);
    };
    try { renderHubContent = window.renderHubContent; } catch (e2) {}
  }

  if (typeof document !== "undefined" && document.createElement && document.head) {
    var style = document.createElement("style");
    style.textContent = [
      ".hub-overlay.hub-finance .hub-sheet-finance{width:min(100vw,980px)!important;max-width:980px!important;height:100vh!important;max-height:100vh!important;border-radius:0!important;margin:0 auto!important;overflow-x:hidden!important;background:radial-gradient(circle at 76% 3%,rgba(126,160,172,.13),transparent 28%),linear-gradient(180deg,#15110d 0%,#0f0c09 62%,#0b0907 100%)!important}",
      ".hub-overlay.hub-finance .hub-head{position:sticky!important;top:0!important;z-index:8!important;background:linear-gradient(180deg,rgba(18,14,10,1),rgba(18,14,10,.92))!important;box-shadow:0 1px 0 rgba(255,255,255,.05)}",
      ".hub-overlay.hub-finance .v16-hub-body,.hub-overlay.hub-finance .v11-hub-body,.hub-overlay.hub-finance [data-hub-body='finance']{overflow-x:hidden!important}",
      ".v1836-finance-shell{display:grid;gap:14px;padding:4px 0 90px;min-width:0;color:#f6ead8}.v1836-finance-shell *{box-sizing:border-box}.v1836-finance-shell .panel{min-width:0;overflow:hidden;border:1px solid rgba(216,173,109,.22);border-radius:12px;background:linear-gradient(135deg,rgba(36,30,23,.96),rgba(23,19,15,.96));padding:14px}.v1836-finance-shell .section-label{color:#d8b16e;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;margin-bottom:10px}",
      ".v1836-hero{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;border:1px solid rgba(126,160,172,.46);border-radius:16px;background:linear-gradient(135deg,rgba(21,42,46,.94),rgba(42,34,23,.95));padding:18px;min-width:0}.v1836-hero h2{margin:4px 0 7px;color:#fff3df;font-size:34px;line-height:1}.v1836-hero p{max-width:660px;margin:0;color:#d6c5aa;font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.5}.v1836-hero strong{display:block;text-align:right;color:#b9dc8a;font-size:34px;line-height:1;white-space:nowrap}.v1836-hero strong.bad{color:#e9927d}.v1836-hero strong span{display:block;margin-top:5px;color:#d8b16e;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase}.v1836-chip-row{display:flex;flex-wrap:wrap;gap:7px;margin-top:13px}.v1836-chip-row span{border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(255,255,255,.05);padding:6px 9px;color:#d6c5aa;font-family:'JetBrains Mono',monospace;font-size:10px}.v1836-chip-row span.good{color:#b9dc8a;border-color:rgba(185,220,138,.38)}.v1836-chip-row span.bad{color:#e9927d;border-color:rgba(233,146,125,.42)}",
      ".v1836-kpi-row,.v1836-direction-grid{display:flex;gap:9px;overflow-x:auto;overflow-y:hidden;padding-bottom:10px;scrollbar-color:rgba(216,177,110,.75) rgba(255,255,255,.05);scrollbar-width:thin}.v1836-kpi-row .v1836-metric,.v1836-direction-grid .v1836-metric{flex:0 0 168px}.v1836-metric{border:1px solid rgba(255,255,255,.11);border-radius:12px;background:rgba(255,255,255,.045);padding:11px;min-height:98px;min-width:0}.v1836-metric span{display:block;color:#d8b16e;font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase}.v1836-metric b{display:block;color:#fff3df;font-size:20px;line-height:1.1;margin-top:6px;overflow-wrap:anywhere}.v1836-metric em{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.4;font-style:normal;margin-top:6px}.v1836-metric.good b,.v1836-line.good strong{color:#b9dc8a}.v1836-metric.bad b,.v1836-line.bad strong{color:#e9927d}.v1836-metric.gold b{color:#f0ca7b}.v1836-direction{border-color:rgba(126,160,172,.36)!important;background:linear-gradient(135deg,rgba(21,39,42,.94),rgba(32,27,21,.96))!important}.v1836-direction p{margin:0;color:#e8d7ba;font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.45}",
      ".v1836-main-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.v1836-line{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:start;border-top:1px solid rgba(255,255,255,.08);padding:10px 0;min-width:0}.v1836-line:first-of-type{border-top:0}.v1836-line b{display:block;color:#fff3df;font-size:15px;line-height:1.15;overflow-wrap:anywhere}.v1836-line span{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.42;margin-top:3px}.v1836-line strong{font-family:'JetBrains Mono',monospace;font-size:15px;white-space:nowrap}.v1836-empty{border:1px dashed rgba(255,255,255,.14);border-radius:12px;padding:12px;color:#c9bda7;font-family:'JetBrains Mono',monospace;font-size:11px}.v1836-empty.good{color:#b9dc8a;border-color:rgba(185,220,138,.35)}",
      ".v1836-split-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:start}.v1836-split-row>div:first-child{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.v1836-action-stack,.v1836-debt-actions{display:flex;flex-wrap:wrap;gap:8px}.v1836-action-stack{justify-content:flex-end}.v1836-action-stack .money-btn,.v1836-debt-actions .money-btn{white-space:normal!important;min-width:88px}.v1836-liquidity{border-color:rgba(185,220,138,.34)!important;background:linear-gradient(135deg,rgba(24,42,28,.94),rgba(32,27,21,.96))!important}",
      ".v1836-debt-payoff{border-color:rgba(233,146,125,.34)!important;background:linear-gradient(135deg,rgba(48,28,23,.94),rgba(31,25,20,.96))!important}.v1836-panel-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:10px}.v1836-panel-head b{display:block;color:#fff3df;font-size:18px}.v1836-panel-head span,.v1836-panel-head em{display:block;color:#c9bda7;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.45;font-style:normal}.v1836-panel-head em{color:#f0ca7b;white-space:nowrap}.v1836-debt-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(245px,1fr));gap:10px}.v1836-debt-card{border:1px solid rgba(255,255,255,.11);border-radius:12px;background:rgba(255,255,255,.045);padding:12px;min-width:0}.v1836-debt-card span{display:block;color:#d8b16e;font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase}.v1836-debt-card b{display:block;color:#e9927d;font-size:24px;margin-top:5px}.v1836-debt-card em{display:block;color:#c9bda7;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.4;font-style:normal;margin:4px 0 10px}.v1836-custom{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px;margin-top:8px}.v1836-custom input{min-width:0;border:1px solid rgba(216,173,109,.32);border-radius:8px;background:#100d0a;color:#f6ead8;padding:10px;font-family:'JetBrains Mono',monospace;font-size:11px}",
      ".v1836-chart-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(280px,.95fr);gap:12px}.v1836-trend{height:190px;border:1px solid rgba(255,255,255,.09);border-radius:12px;background:rgba(0,0,0,.20);padding:12px 12px 34px;display:flex;align-items:end;gap:8px;overflow-x:auto}.v1836-bar-wrap{flex:1 0 54px;height:100%;display:flex;align-items:end;position:relative}.v1836-bar-wrap i{display:block;width:100%;min-height:8px;border-radius:8px 8px 2px 2px;background:linear-gradient(180deg,#f0ca7b,#80602a)}.v1836-bar-wrap i.good{background:linear-gradient(180deg,#b9dc8a,#4f6c3d)}.v1836-bar-wrap i.bad{background:linear-gradient(180deg,#e9927d,#73362d)}.v1836-bar-wrap b{position:absolute;bottom:-21px;left:0;right:0;text-align:center;color:#d8b16e;font-family:'JetBrains Mono',monospace;font-size:9px}.v1836-bar-wrap span{position:absolute;bottom:-34px;left:0;right:0;text-align:center;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:8px}.v1836-note{margin-top:9px;color:#c9bda7;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.45}",
      ".v1836-donut{width:min(230px,72vw);aspect-ratio:1;margin:4px auto 12px;border-radius:50%;display:grid;place-items:center}.v1836-donut>div{width:44%;aspect-ratio:1;border-radius:50%;background:#100d0a;display:grid;place-items:center;text-align:center;padding:10px}.v1836-donut b{color:#fff3df;font-size:20px;line-height:1}.v1836-donut span{color:#d8b16e;font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase}.v1836-legend{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.v1836-legend span{display:flex;align-items:center;gap:7px;color:#d6c5aa;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.3}.v1836-legend i{width:9px;height:9px;border-radius:50%;flex:0 0 auto}",
      ".v1836-shortcuts{border-color:rgba(126,160,172,.34)!important;background:linear-gradient(135deg,rgba(21,39,42,.90),rgba(31,25,20,.96))!important}.v1836-shortcut-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px}.v1836-shortcut-grid>div{border:1px solid rgba(255,255,255,.11);border-radius:12px;background:rgba(255,255,255,.045);padding:11px;min-width:0}.v1836-shortcut-grid span{display:block;color:#d8b16e;font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase}.v1836-shortcut-grid b{display:block;color:#fff3df;font-size:17px;margin-top:5px;overflow-wrap:anywhere}.v1836-shortcut-grid em{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.4;font-style:normal;margin:4px 0 10px}.v1836-shortcut-grid .money-btn{width:100%}",
      ".v1836-kpi-row::-webkit-scrollbar,.v1836-direction-grid::-webkit-scrollbar,.v1836-trend::-webkit-scrollbar{height:10px}.v1836-kpi-row::-webkit-scrollbar-thumb,.v1836-direction-grid::-webkit-scrollbar-thumb,.v1836-trend::-webkit-scrollbar-thumb{background:rgba(216,177,110,.72);border-radius:999px}.v1836-kpi-row::-webkit-scrollbar-track,.v1836-direction-grid::-webkit-scrollbar-track,.v1836-trend::-webkit-scrollbar-track{background:rgba(255,255,255,.05);border-radius:999px}",
      "@media(max-width:760px){.v1836-hero,.v1836-panel-head,.v1836-split-row{display:block}.v1836-hero strong{text-align:left;margin-top:14px}.v1836-main-grid,.v1836-chart-grid{grid-template-columns:1fr}.v1836-split-row>div:first-child{grid-template-columns:1fr}.v1836-action-stack{justify-content:flex-start;margin-top:10px}.v1836-custom{grid-template-columns:1fr}.v1836-kpi-row .v1836-metric,.v1836-direction-grid .v1836-metric{flex-basis:152px}.v1836-hero h2{font-size:28px}}"
    ].join("\n");
    document.head.appendChild(style);
  }

  if (window.registerLedgerSystem) {
    window.registerLedgerSystem({
      id: "finance-ledger",
      file: "pages/systems/finance-ledger.js",
      status: "active",
      globals: ["renderFinanceHub1818", "recordCashFlow1824", "financeParts1818", "payFinanceDebtV1836", "raiseFinanceCashV1836"],
      notes: "Finance is now a clean Net Worth Ledger: assets, debts, income, expenses, direction lights, charts, liquidity, and compact links to Money, Investments, and Legal."
    });
  }
})();
