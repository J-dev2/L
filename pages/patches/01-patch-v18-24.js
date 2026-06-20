/* LEDGER PATCH v18.24: solution-notebook pass — liquid tax payoff, cash-flow command, credit depth, job/business requirements */
(function () {
  if (window.__ledgerV1824Loaded) return;
  window.__ledgerV1824Loaded = true;

  function esc1824(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (ch) {
      return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[ch];
    });
  }
  function num1824(v, fallback) {
    var n = Number(v);
    return Number.isFinite(n) ? n : (fallback || 0);
  }
  function money1824(v) {
    try { if (typeof money === "function") return money(Math.round(num1824(v))); } catch(e) {}
    v = Math.round(num1824(v));
    var sign = v < 0 ? "-" : "";
    v = Math.abs(v);
    if (v >= 1e15) return sign + "$" + (v / 1e15).toFixed(1).replace(/\.0$/, "") + "Q";
    if (v >= 1e12) return sign + "$" + (v / 1e12).toFixed(1).replace(/\.0$/, "") + "T";
    if (v >= 1e9) return sign + "$" + (v / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
    if (v >= 1e6) return sign + "$" + (v / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (v >= 10000) return sign + "$" + Math.round(v / 1000) + "K";
    return sign + "$" + v.toLocaleString();
  }
  function signed1824(v) {
    v = Math.round(num1824(v));
    return (v >= 0 ? "+" : "-") + money1824(Math.abs(v));
  }
  function pct1824(v) {
    return (num1824(v) * 100).toFixed(1).replace(".0", "") + "%";
  }
  function toast1824(msg) {
    try { if (typeof addToast === "function") return addToast(msg); } catch(e) {}
    try { if (typeof addLog === "function") return addLog(msg); } catch(e) {}
  }
  function log1824(msg, deltas) {
    try { if (typeof addLog === "function") return addLog(msg, deltas || {}); } catch(e) {}
  }
  function saveRender1824() {
    try { if (typeof save === "function") save(); } catch(e) {}
    try { if (typeof render === "function") render(); } catch(e) {}
  }
  function ensure1824() {
    try { if (typeof ensureStateShape === "function") ensureStateShape(); } catch(e) {}
    if (!window.state) return false;
    state.finance = state.finance || {};
    state.stats = state.stats || {};
    state.flags = state.flags || {};
    state.actionsTaken = state.actionsTaken || {};
    state.finance.debts = state.finance.debts || {};
    state.finance.incomeSources = state.finance.incomeSources || {};
    state.finance.externalManager = state.finance.externalManager || { id:null, capital:0, lastReturn:0, lastFee:0 };
    state.finance.personalFirm = state.finance.personalFirm || { hired:false, staff:{ advisor:1, analyst:1, risk:1, tax:1 } };
    state.finance.personalFirm.staff = state.finance.personalFirm.staff || { advisor:1, analyst:1, risk:1, tax:1 };
    if (!Array.isArray(state.finance.cashFlowHistoryV1824)) state.finance.cashFlowHistoryV1824 = [];
    if (!Array.isArray(state.finance.taxTrueUpsV1824)) state.finance.taxTrueUpsV1824 = [];
    if (state.finance.creditScore == null) state.finance.creditScore = Math.max(520, Math.min(820, 650 + Math.round((num1824(state.stats.discipline, 50) - 50) * 1.2)));
    state.finance.creditCardDebt = Math.max(0, Math.round(num1824(state.finance.creditCardDebt)));
    state.finance.taxDebt = Math.max(0, Math.round(num1824(state.finance.taxDebt || state.finance.debts.taxDebt || state.taxDebt)));
    state.finance.debts.taxDebt = state.finance.taxDebt;
    return true;
  }
  function stockValue1824() {
    var m = (state.finance || {}).stocksV18 || {};
    if (!Array.isArray(m.holdings)) return 0;
    return Math.round(m.holdings.reduce(function (sum, h) {
      var price = m.prices && m.prices[h.id] != null ? num1824(m.prices[h.id]) : num1824(h.avgCost);
      return sum + num1824(h.shares) * price;
    }, 0));
  }
  function liquidBuckets1824(includeChecking) {
    ensure1824();
    var f = state.finance || {};
    var buckets = [];
    if (includeChecking !== false) buckets.push({ id:"checking", label:"Checking", obj:state, key:"money", value:Math.max(0, num1824(state.money)), liquid:true });
    buckets.push({ id:"savings", label:"Savings", obj:state, key:"savings", value:Math.max(0, num1824(state.savings)), liquid:true });
    buckets.push({ id:"super", label:"Super Saver", obj:f, key:"superSaver", value:Math.max(0, num1824(f.superSaver)), liquid:true });
    buckets.push({ id:"brokerage", label:"Brokerage Cash", obj:f, key:"brokerage", value:Math.max(0, num1824(f.brokerage)), liquid:true });
    buckets.push({ id:"managed", label:"Personal Firm", obj:f, key:"managedPortfolio", value:Math.max(0, num1824(f.managedPortfolio)), liquid:true });
    buckets.push({ id:"external", label:"Outside Manager", obj:f.externalManager, key:"capital", value:Math.max(0, num1824(f.externalManager && f.externalManager.capital)), liquid:true });
    return buckets;
  }
  function totalLiquid1824(includeChecking) {
    return liquidBuckets1824(includeChecking).reduce(function (sum, b) { return sum + Math.max(0, Math.round(num1824(b.value))); }, 0);
  }
  function totalAssets1824() {
    ensure1824();
    var homeVal = 0, rentalVal = 0, carVal = 0;
    try { var h = (typeof homes !== "undefined" ? homes : []).find(function (x) { return x.id === state.home; }); homeVal = num1824(h && (h.price || h.value)); } catch(e) {}
    try { (Array.isArray(state.rentals) ? state.rentals : []).forEach(function (id) { var r = (typeof rentals !== "undefined" ? rentals : []).find(function (x) { return x.id === id; }); rentalVal += num1824(r && (r.price || r.value)); }); } catch(e) {}
    try { var c = (typeof cars !== "undefined" ? cars : []).find(function (x) { return x.id === state.car; }); carVal = num1824(c && (c.price || c.value)); } catch(e) {}
    var f = state.finance || {};
    return Math.round(totalLiquid1824(true) + stockValue1824() + Math.max(0, num1824(state.ira)) + Math.max(0, num1824(state.retirement401k)) + Math.max(0, homeVal + rentalVal + carVal));
  }
  function totalDebts1824() {
    ensure1824();
    var f = state.finance || {};
    return Math.round(Math.max(0, num1824(state.debt)) + Math.max(0, num1824(f.creditCardDebt)) + Math.max(0, num1824(f.assetBackedLoan)) + Math.max(0, num1824(f.taxDebt)) + Math.max(0, num1824(f.medicalDebt || state.medicalDebt)) + Math.max(0, num1824(f.personalDebt)));
  }
  function netWorth1824() {
    try { if (typeof financeNetWorth === "function") return Math.round(num1824(financeNetWorth())); } catch(e) {}
    return totalAssets1824() - totalDebts1824();
  }
  function pullFromBuckets1824(amount, options) {
    ensure1824();
    amount = Math.max(0, Math.round(num1824(amount)));
    options = options || {};
    var remaining = amount;
    var used = [];
    liquidBuckets1824(options.includeChecking !== false).forEach(function (b) {
      if (remaining <= 0 || !b.obj || !b.key) return;
      var have = Math.max(0, Math.round(num1824(b.obj[b.key])));
      var take = Math.min(have, remaining);
      if (take <= 0) return;
      b.obj[b.key] = Math.max(0, have - take);
      remaining -= take;
      used.push({ label:b.label, amount:take });
    });
    return { requested:amount, paid:amount - remaining, remaining:remaining, used:used };
  }
  function sourceText1824(used) {
    used = Array.isArray(used) ? used : [];
    if (!used.length) return "no assets";
    return used.map(function (u) { return u.label + " " + money1824(u.amount); }).join(", ");
  }
  function setTaxDebt1824(value) {
    ensure1824();
    value = Math.max(0, Math.round(num1824(value)));
    state.finance.taxDebt = value;
    state.finance.debts.taxDebt = value;
    state.taxDebt = value;
    if (state.tax && typeof state.tax === "object") state.tax.taxDebt = value;
  }
  window.payTaxDebtV1824 = function (amount) {
    ensure1824();
    var debt = Math.max(0, num1824(state.finance.taxDebt));
    if (!debt) return toast1824("No tax debt to pay.");
    var requested = amount === "max" || amount === Infinity ? debt : Math.round(num1824(amount));
    requested = Math.min(debt, Math.max(0, requested));
    if (!requested) return toast1824("Enter a tax payoff amount.");
    var pull = pullFromBuckets1824(requested, { includeChecking:true });
    if (!pull.paid) return toast1824("No liquid assets available for tax payoff.");
    setTaxDebt1824(debt - pull.paid);
    state.finance.taxLegalRisk = Math.max(0, Math.round(num1824(state.finance.taxLegalRisk)) - Math.ceil(pull.paid / 10000));
    log1824("Paid " + money1824(pull.paid) + " toward tax debt from " + sourceText1824(pull.used) + ".", { taxDebt:-pull.paid });
    saveRender1824();
  };
  window.payCustomTaxDebtV1824 = function (inputId) {
    var el = document.getElementById(inputId);
    var val = el ? String(el.value || "").replace(/[^0-9.]/g, "") : "";
    if (el) el.value = "";
    return window.payTaxDebtV1824(val);
  };
  window.raiseCashFromAssetsV1824 = function (amount) {
    ensure1824();
    var available = totalLiquid1824(false);
    var requested = amount === "max" || amount === Infinity ? available : Math.round(num1824(amount));
    requested = Math.max(0, Math.min(requested, available));
    if (!requested) return toast1824("No non-checking liquid assets available.");
    var pull = pullFromBuckets1824(requested, { includeChecking:false });
    state.money = Math.round(num1824(state.money) + pull.paid);
    log1824("Raised " + money1824(pull.paid) + " into checking from " + sourceText1824(pull.used) + ".", { money:pull.paid });
    saveRender1824();
  };
  window.payDebtWithAssetsV1824 = function (kind, amount) {
    ensure1824();
    var key = kind === "education" ? "debt" : kind;
    var current = key === "debt" ? Math.max(0, num1824(state.debt)) : Math.max(0, num1824(state.finance[key]));
    if (!current) return toast1824("No " + kind + " debt to pay.");
    var requested = amount === "max" ? current : Math.round(num1824(amount));
    var pull = pullFromBuckets1824(Math.min(current, requested), { includeChecking:true });
    if (!pull.paid) return toast1824("No liquid assets available for payoff.");
    if (key === "debt") state.debt = Math.max(0, current - pull.paid);
    else state.finance[key] = Math.max(0, current - pull.paid);
    log1824("Paid " + money1824(pull.paid) + " toward " + kind + " debt from " + sourceText1824(pull.used) + ".", {});
    saveRender1824();
  };
  function taxAccountantFactor1824() {
    var raw = String((state.finance || {}).accountant || (state.finance || {}).accountantPlan || "none").toLowerCase();
    if (/elite|tax_law|wealth|family|global/.test(raw)) return { label:"Elite tax counsel", reduction:.16, audit:-12 };
    if (/cpa|advisor|pro/.test(raw)) return { label:"CPA Advisor", reduction:.10, audit:-8 };
    if (/local|preparer|basic/.test(raw)) return { label:"Local tax preparer", reduction:.055, audit:-4 };
    return { label:"No accountant", reduction:0, audit:4 };
  }
  function currentTaxTrueUpBase1824() {
    ensure1824();
    var f = state.finance || {};
    var m = f.stocksV18 || {};
    var realizedTotal = Math.max(0, num1824(m.realizedGain));
    var realizedDelta = Math.max(0, realizedTotal - Math.max(0, num1824(f.realizedGainTaxedV1824)));
    var business = Math.max(0, num1824(f.lastEntrepreneurIncome || f.lastBusinessIncome));
    var dividends = Math.max(0, num1824(m.lastDividends));
    var firmDistribution = Math.max(0, num1824(f.lastFirmDistribution));
    var fundFees = Math.max(0, num1824((f.fundTrackV189 || {}).lastFees));
    var outsideFees = Math.max(0, num1824((f.externalManager || {}).lastFee));
    var investment = Math.max(0, dividends + realizedDelta + firmDistribution + fundFees - outsideFees);
    return { business:business, dividends:dividends, realizedGain:realizedDelta, firmDistribution:firmDistribution, fundFees:fundFees, outsideFees:outsideFees, investment:investment, taxable:business + investment, realizedTotal:realizedTotal };
  }
  function taxRateFor1824(taxable) {
    taxable = Math.max(0, num1824(taxable));
    if (taxable >= 1000000) return .32;
    if (taxable >= 250000) return .26;
    if (taxable >= 100000) return .21;
    if (taxable >= 25000) return .16;
    if (taxable > 0) return .10;
    return 0;
  }
  function applyBusinessInvestmentTaxTrueUp1824() {
    ensure1824();
    var age = Math.round(num1824(state.age));
    if (state.finance.lastTaxTrueUpAgeV1824 === age) return;
    var base = currentTaxTrueUpBase1824();
    if (base.taxable <= 0) {
      state.finance.lastTaxTrueUpAgeV1824 = age;
      state.finance.realizedGainTaxedV1824 = base.realizedTotal;
      return;
    }
    var helper = taxAccountantFactor1824();
    var rawTax = Math.round(base.taxable * taxRateFor1824(base.taxable));
    var tax = Math.max(0, Math.round(rawTax * (1 - helper.reduction)));
    if (!tax) return;
    var paidNow = Math.min(Math.max(0, num1824(state.money)), tax);
    if (paidNow > 0) state.money = Math.round(num1824(state.money) - paidNow);
    var unpaid = tax - paidNow;
    if (unpaid > 0) setTaxDebt1824(num1824(state.finance.taxDebt) + unpaid);
    state.finance.lastYearTaxes = Math.round(num1824(state.finance.lastYearTaxes) + tax);
    state.finance.lastBusinessInvestmentTaxV1824 = tax;
    state.finance.lastTaxTrueUpAgeV1824 = age;
    state.finance.realizedGainTaxedV1824 = base.realizedTotal;
    state.finance.taxLegalRisk = Math.max(0, Math.min(100, Math.round(num1824(state.finance.taxLegalRisk) + (unpaid ? 7 : 1) + helper.audit)));
    state.finance.taxTrueUpsV1824.push({ age:age, taxable:base.taxable, tax:tax, paid:paidNow, unpaid:unpaid, business:base.business, investment:base.investment, accountant:helper.label });
    state.finance.taxTrueUpsV1824 = state.finance.taxTrueUpsV1824.slice(-12);
    log1824("Business/investment tax true-up: " + money1824(base.taxable) + " taxable, " + money1824(tax) + " due after " + helper.label + "." + (unpaid ? " Unpaid balance became tax debt." : " Paid from checking."), { money:-paidNow, taxDebt:unpaid });
  }
  function recordCashFlow1824() {
    ensure1824();
    var age = Math.round(num1824(state.age));
    var cf = cashFlowSnapshot1824();
    var arr = state.finance.cashFlowHistoryV1824 || [];
    if (arr.length && arr[arr.length - 1].age === age) arr[arr.length - 1] = cf;
    else arr.push(cf);
    state.finance.cashFlowHistoryV1824 = arr.slice(-20);
  }
  function cashFlowSnapshot1824() {
    ensure1824();
    var cf = {};
    try { if (typeof cashFlowV6 === "function") cf = cashFlowV6() || {}; } catch(e) {}
    try { if ((!cf || !Object.keys(cf).length) && typeof computeAnnualCashFlowV6 === "function") cf = computeAnnualCashFlowV6() || {}; } catch(e) {}
    var base = currentTaxTrueUpBase1824();
    var salary = state.job ? Math.round(num1824(state.job.salary)) : 0;
    var allowance = (state.age >= 5 && state.age <= 17) ? Math.round(num1824(state.allowance)) : 0;
    var business = Math.round(num1824(cf.businessIncome || state.finance.lastEntrepreneurIncome || state.finance.lastBusinessIncome));
    var investmentCash = Math.round(base.investment);
    var rental = 0;
    try { (Array.isArray(state.rentals) ? state.rentals : []).forEach(function (id) { var r = (typeof rentals !== "undefined" ? rentals : []).find(function (x) { return x.id === id; }); if (r) rental += Math.round(num1824(r.rent) - num1824(r.upkeep)); }); } catch(e) {}
    var taxes = Math.round(num1824((typeof cf.tax === "object" ? cf.tax.finalTax : cf.tax) || cf.taxes || state.finance.lastYearTaxes));
    var living = Math.round(num1824(cf.lifestyleCost || cf.living || cf.outflow));
    var insurance = Math.round(num1824(cf.insuranceCost || state.finance.lastInsuranceCost));
    var debtInterest = Math.round(num1824(cf.debtInterest));
    var inflow = Math.round(num1824(cf.inflow) || (salary + allowance + Math.max(0, business) + Math.max(0, investmentCash) + Math.max(0, rental)));
    var outflow = Math.round(num1824(cf.outflow) || (taxes + living + insurance + debtInterest));
    var change = Math.round(num1824(cf.checkingChange || state.finance.lastCashFlow || (inflow - outflow)));
    return { age:Math.round(num1824(state.age)), inflow:inflow, outflow:outflow, checkingChange:change, salary:salary, allowance:allowance, business:business, investmentCash:investmentCash, rental:rental, taxes:taxes, living:living, insurance:insurance, debtInterest:debtInterest, netWorth:netWorth1824() };
  }
  var prevResolve1824 = window.resolveLifeAndFinanceYear || (typeof resolveLifeAndFinanceYear === "function" ? resolveLifeAndFinanceYear : null);
  if (prevResolve1824 && !window.__ledgerResolve1824Wrapped) {
    window.__ledgerResolve1824Wrapped = true;
    window.resolveLifeAndFinanceYear = function () {
      var out = prevResolve1824.apply(this, arguments);
      try { applyBusinessInvestmentTaxTrueUp1824(); recordCashFlow1824(); } catch(e) { try { console.warn("v18.24 yearly tax/cashflow failed", e); } catch(ignore) {} }
      return out;
    };
    try { resolveLifeAndFinanceYear = window.resolveLifeAndFinanceYear; } catch(e) {}
  }
  function scoreBand1824(score) {
    score = Math.round(num1824(score, 650));
    if (score >= 800) return { label:"Elite", cls:"good" };
    if (score >= 740) return { label:"Excellent", cls:"good" };
    if (score >= 680) return { label:"Good", cls:"gold" };
    if (score >= 620) return { label:"Fair", cls:"gold" };
    if (score >= 560) return { label:"Weak", cls:"bad" };
    return { label:"Very risky", cls:"bad" };
  }
  function creditLimit1824() {
    ensure1824();
    var score = Math.round(num1824(state.finance.creditScore, 650));
    var reserve = totalLiquid1824(true);
    if (typeof window.ledgerCreditLimit === "function") return window.ledgerCreditLimit(score, reserve);
    var base = score >= 800 ? 50000 : score >= 740 ? 30000 : score >= 680 ? 15000 : score >= 620 ? 6000 : score >= 560 ? 2000 : 500;
    if (reserve >= 100000) base *= 1.5;
    if (reserve >= 1000000) base *= 2;
    return Math.round(base);
  }
  window.useCreditLineV1824 = function (amount) {
    ensure1824();
    if (num1824(state.age) < 18) return toast1824("Credit unlocks at 18.");
    var limit = creditLimit1824();
    var debt = Math.max(0, num1824(state.finance.creditCardDebt));
    var room = Math.max(0, limit - debt);
    var amt = amount === "max" ? room : Math.min(room, Math.round(num1824(amount)));
    if (!amt) return toast1824("No credit room available. Pay down the balance or improve score.");
    state.finance.creditCardDebt = debt + amt;
    state.money = Math.round(num1824(state.money) + amt);
    state.finance.creditScore = Math.max(300, Math.round(num1824(state.finance.creditScore, 650) - Math.ceil(amt / 1200)));
    log1824("Used credit line for " + money1824(amt) + ". Cash increased, card balance increased, score pressure rose.", { money:amt, creditCardDebt:amt });
    saveRender1824();
  };
  window.payCreditLineV1824 = function (amount) {
    ensure1824();
    var debt = Math.max(0, num1824(state.finance.creditCardDebt));
    if (!debt) return toast1824("No credit card balance to pay.");
    var amt = amount === "max" ? debt : Math.round(num1824(amount));
    var pull = pullFromBuckets1824(Math.min(debt, amt), { includeChecking:true });
    if (!pull.paid) return toast1824("No liquid assets available for card payoff.");
    state.finance.creditCardDebt = Math.max(0, debt - pull.paid);
    state.finance.creditScore = Math.min(850, Math.round(num1824(state.finance.creditScore, 650) + Math.ceil(pull.paid / 900)));
    log1824("Paid " + money1824(pull.paid) + " toward the credit line from " + sourceText1824(pull.used) + ".", { creditCardDebt:-pull.paid });
    saveRender1824();
  };
  window.reviewCreditV1824 = function () {
    ensure1824();
    var key = "creditReviewV1824_" + state.age;
    if (state.actionsTaken[key]) return toast1824("Credit already reviewed this year.");
    var limit = creditLimit1824();
    var util = limit ? num1824(state.finance.creditCardDebt) / limit : 0;
    var gain = util <= .05 ? 10 : util <= .15 ? 7 : util <= .30 ? 3 : util <= .60 ? -5 : -14;
    if (totalLiquid1824(true) > 10000) gain += 2;
    if (num1824(state.finance.taxDebt) > 0) gain -= 2;
    state.finance.creditScore = Math.max(300, Math.min(850, Math.round(num1824(state.finance.creditScore, 650) + gain)));
    state.actionsTaken[key] = true;
    log1824("Credit review: utilization " + Math.round(util * 100) + "%, score changed " + (gain >= 0 ? "+" : "") + gain + ".", {});
    saveRender1824();
  };
  function btn1824(label, cls, action, disabled) {
    return '<button class="money-btn ' + esc1824(cls || "") + '" onclick="event.preventDefault();event.stopPropagation();' + esc1824(action) + '" ' + (disabled ? "disabled" : "") + '>' + esc1824(label) + '</button>';
  }

  function debtPayoffDesk1824() {
    ensure1824();
    var f = state.finance || {};
    var lines = [
      { id:"education", label:"Education Debt", key:"debt", value:Math.max(0, num1824(state.debt)), note:"School loans / tuition balances" },
      { id:"medicalDebt", label:"Medical Debt", key:"medicalDebt", value:Math.max(0, num1824(f.medicalDebt || state.medicalDebt)), note:"Uncovered hospital bills" },
      { id:"assetBackedLoan", label:"Secured Loan", key:"assetBackedLoan", value:Math.max(0, num1824(f.assetBackedLoan)), note:"Borrowing against assets" }
    ];
    var total = lines.reduce(function (sum, x) { return sum + x.value; }, 0);
    if (!total) return '<section class="money-section v1824-debt-payoff"><div class="money-section-title">Debt Payoff Board <span>clear</span></div><div class="row"><div><div class="row-title">No education, medical, or secured payoff needed.</div><div class="row-sub">Credit and tax still have their own live controls when balances exist.</div></div></div></section>';
    var cards = lines.map(function (x) {
      return '<div class="v1824-debt-card ' + (x.value ? "bad" : "good") + '"><div><b>' + esc1824(x.label) + '</b><span>' + esc1824(x.note) + '</span><strong>' + money1824(x.value) + '</strong></div><div class="v1824-action-row small">' + btn1824("Pay $1K", "red", "payDebtWithAssetsV1824('" + esc1824(x.id) + "',1000)", x.value <= 0 || totalLiquid1824(true) <= 0) + btn1824("Pay Max", "red", "payDebtWithAssetsV1824('" + esc1824(x.id) + "','max')", x.value <= 0 || totalLiquid1824(true) <= 0) + '</div></div>';
    }).join("");
    return '<section class="money-section v1824-debt-payoff"><div class="money-section-title">Debt Payoff Board <span>assets allowed</span></div><div class="row-sub">Payments can pull from checking, savings, Super Saver, brokerage cash, outside manager capital, or personal firm capital.</div><div class="v1824-debt-grid">' + cards + '</div></section>';
  }

  function liquidityTaxDesk1824(mode) {
    ensure1824();
    var debt = Math.max(0, num1824(state.finance.taxDebt));
    var checking = Math.max(0, num1824(state.money));
    var nonChecking = totalLiquid1824(false);
    var allLiquid = totalLiquid1824(true);
    var canPay = debt > 0 && allLiquid > 0;
    var id = "v1824-tax-custom-" + (mode || "money");
    var lines = liquidBuckets1824(true).map(function (b) { return '<span>' + esc1824(b.label) + ' ' + money1824(b.value) + '</span>'; }).join("");
    return '<section class="money-section v1824-tax-liquidity"><div class="money-section-title">Tax Payoff + Liquidity <span>pays from assets</span></div><div class="v1824-tile-grid"><div class="' + (debt ? "bad" : "good") + '"><span>Tax debt</span><b>' + money1824(debt) + '</b><em>Directly payable now.</em></div><div class="' + (checking ? "good" : "gold") + '"><span>Checking</span><b>' + money1824(checking) + '</b><em>Spendable cash.</em></div><div class="good"><span>Total liquid</span><b>' + money1824(allLiquid) + '</b><em>Checking + savings + brokerage + firm.</em></div><div class="gold"><span>Non-checking</span><b>' + money1824(nonChecking) + '</b><em>Can be raised into checking.</em></div></div><div class="v1824-pill-row">' + lines + '</div><div class="v1824-action-row">' + btn1824("Pay $10K", "red", "payTaxDebtV1824(10000)", !canPay || Math.min(debt, allLiquid) < 10000) + btn1824("Pay $1M", "red", "payTaxDebtV1824(1000000)", !canPay || Math.min(debt, allLiquid) < 1000000) + btn1824("Pay Max", "red", "payTaxDebtV1824('max')", !canPay) + btn1824("Raise $10K", "green", "raiseCashFromAssetsV1824(10000)", nonChecking < 10000) + btn1824("Raise Max Cash", "green", "raiseCashFromAssetsV1824('max')", nonChecking <= 0) + '</div><div class="v1824-custom-row"><input id="' + esc1824(id) + '" inputmode="numeric" placeholder="Custom tax payoff $"><button class="money-btn red" onclick="event.preventDefault();event.stopPropagation();payCustomTaxDebtV1824(\'' + esc1824(id) + '\')" ' + (!canPay ? "disabled" : "") + '>Pay Custom</button></div></section>';
  }
  function cashFlowCommand1824() {
    ensure1824();
    var cf = cashFlowSnapshot1824();
    var history = (state.finance.cashFlowHistoryV1824 || []).slice(-8);
    var max = Math.max(1, history.reduce(function (m, x) { return Math.max(m, Math.abs(num1824(x.checkingChange))); }, Math.abs(cf.checkingChange)));
    var bars = (history.length ? history : [cf]).map(function (x) {
      var h = Math.max(7, Math.round(Math.abs(num1824(x.checkingChange)) / max * 100));
      var cls = num1824(x.checkingChange) >= 0 ? "good" : "bad";
      return '<div class="v1824-flow-bar"><i class="' + cls + '" style="height:' + h + '%"></i><span>' + esc1824(x.age) + '</span></div>';
    }).join("");
    var rows = [
      ["Salary", cf.salary, "Job income"],
      ["Business", cf.business, "Companies / NIL"],
      ["Investment cash", cf.investmentCash, "Dividends, gains, firm/fund"],
      ["Taxes", -Math.abs(cf.taxes), "Income + true-up"],
      ["Living", -Math.abs(cf.living), "Lifestyle / home / car"],
      ["Insurance/debt", -Math.abs(cf.insurance + cf.debtInterest), "Premiums and interest"]
    ].map(function (r) {
      var cls = r[1] >= 0 ? "good" : "bad";
      return '<div class="v1824-mini-line"><div><b>' + esc1824(r[0]) + '</b><span>' + esc1824(r[2]) + '</span></div><strong class="' + cls + '">' + signed1824(r[1]) + '</strong></div>';
    }).join("");
    return '<section class="money-section v1824-cashflow-command"><div class="money-section-title">Cash Flow Command <span>green/red movement</span></div><div class="v1824-tile-grid"><div class="good"><span>Inflow</span><b>' + money1824(cf.inflow) + '</b><em>Money entering this year.</em></div><div class="bad"><span>Outflow</span><b>' + money1824(cf.outflow) + '</b><em>Bills, taxes, debt, living.</em></div><div class="' + (cf.checkingChange >= 0 ? "good" : "bad") + '"><span>Checking change</span><b>' + signed1824(cf.checkingChange) + '</b><em>What actually hits cash.</em></div><div class="gold"><span>Net worth</span><b>' + money1824(cf.netWorth) + '</b><em>Assets minus debts.</em></div></div><div class="v1824-flow-chart">' + bars + '</div><div class="v1824-mini-lines">' + rows + '</div></section>';
  }
  function creditDesk1824() {
    ensure1824();
    var score = Math.round(num1824(state.finance.creditScore, 650));
    var band = scoreBand1824(score);
    var debt = Math.max(0, num1824(state.finance.creditCardDebt));
    var limit = creditLimit1824();
    var util = limit ? debt / limit : 0;
    return '<section class="money-section v1824-credit-desk"><div class="money-section-title">Credit Score + Borrowing <span>' + esc1824(band.label) + '</span></div><div class="v1824-tile-grid"><div class="' + band.cls + '"><span>Score</span><b>' + score + '</b><em>' + esc1824(band.label) + '</em></div><div class="gold"><span>Credit limit</span><b>' + money1824(limit) + '</b><em>Based on score and reserves.</em></div><div class="' + (util <= .3 ? "good" : "bad") + '"><span>Utilization</span><b>' + Math.round(util * 100) + '%</b><em>Lower is better.</em></div><div class="' + (debt ? "bad" : "good") + '"><span>Balance</span><b>' + money1824(debt) + '</b><em>Can be paid from assets.</em></div></div><div class="v1824-action-row">' + btn1824("Use $500", "blue", "useCreditLineV1824(500)", state.age < 18 || limit - debt < 500) + btn1824("Use $2K", "blue", "useCreditLineV1824(2000)", state.age < 18 || limit - debt < 2000) + btn1824("Pay $500", "red", "payCreditLineV1824(500)", debt <= 0 || totalLiquid1824(true) < 1) + btn1824("Pay Max", "red", "payCreditLineV1824('max')", debt <= 0 || totalLiquid1824(true) < 1) + btn1824("Review Score", "green", "reviewCreditV1824()", !!state.actionsTaken["creditReviewV1824_" + state.age]) + '</div></section>';
  }
  function businessTaxDesk1824() {
    ensure1824();
    var base = currentTaxTrueUpBase1824();
    var helper = taxAccountantFactor1824();
    var projected = Math.round(base.taxable * taxRateFor1824(base.taxable) * (1 - helper.reduction));
    return '<section class="money-section v1824-business-tax"><div class="money-section-title">Business + Investment Tax Desk <span>automatic true-up</span></div><div class="v1824-tile-grid"><div class="' + (base.business ? "good" : "gold") + '"><span>Business income</span><b>' + money1824(base.business) + '</b><em>Company and entrepreneur income.</em></div><div class="' + (base.investment ? "good" : "gold") + '"><span>Investment taxable</span><b>' + money1824(base.investment) + '</b><em>Dividends, gains, firm/fund cash.</em></div><div class="bad"><span>Projected true-up</span><b>' + money1824(projected) + '</b><em>' + esc1824(helper.label) + ' applied.</em></div><div class="' + (state.finance.taxDebt ? "bad" : "good") + '"><span>Tax debt</span><b>' + money1824(state.finance.taxDebt) + '</b><em>Pay from the liquidity desk.</em></div></div><div class="v1824-action-row">' + btn1824("Open Law", "blue", "setTabV16 ? setTabV16('law') : setTab('law')", false) + (typeof distributeFirmGainsV1822 === "function" ? btn1824("Distribute Firm Gains", "green", "distributeFirmGainsV1822()", false) : "") + '</div></section>';
  }
  function careerRequirementDesk1824() {
    ensure1824();
    var jobs = [];
    try { jobs = (typeof careerCatalog !== "undefined" && Array.isArray(careerCatalog)) ? careerCatalog : (Array.isArray(window.careerCatalog) ? window.careerCatalog : []); } catch(e) { jobs = []; }
    if (!jobs.length) return "";
    var ordered = jobs.slice().sort(function (a, b) { return (num1824(a.minAge) - num1824(b.minAge)) || (num1824(b.salary) - num1824(a.salary)); }).slice(0, 18);
    var cards = ordered.map(function (job) {
      var unlocked = false;
      try { unlocked = num1824(state.age) >= num1824(job.minAge) && (!job.req || job.req(state)); } catch(e) { unlocked = false; }
      var major = state.major ? "Major: " + state.major : (state.education || "No degree yet");
      var statHint = [];
      if (num1824(state.stats.smarts) < 70) statHint.push("Smarts");
      if (num1824(state.stats.discipline) < 65) statHint.push("Discipline");
      if (num1824(state.stats.confidence) < 60) statHint.push("Confidence");
      var req = "Age " + (job.minAge || 0) + "+ · " + (job.desc || "Build education, stats, or items to qualify.");
      return '<div class="v1824-req-card ' + (unlocked ? "unlocked" : "locked") + '"><div class="v1824-req-head"><b>' + esc1824(job.title || job.name || job.id) + '</b><span>' + (unlocked ? "Unlocked" : "Locked") + '</span></div><p>' + esc1824(req) + '</p><div class="v1824-pill-row"><span>Start ' + money1824(job.salary || 0) + '/yr</span><span>' + esc1824(major) + '</span>' + (!unlocked && statHint.length ? '<span>Build ' + esc1824(statHint.join(" / ")) + '</span>' : '') + '</div></div>';
    }).join("");
    return '<section class="panel v1824-career-reqs"><div class="section-label">Career Unlock Board</div><div class="row"><div><div class="row-title">Requirement boxes are expanded.</div><div class="row-sub">Locked jobs now show age, path, pay, and the likely stats to build before you qualify.</div></div></div><div class="v1824-req-grid">' + cards + '</div></section>';
  }
  function businessRequirementDesk1824() {
    ensure1824();
    var list = [];
    try { if (typeof entrepreneurshipCatalog !== "undefined" && Array.isArray(entrepreneurshipCatalog)) list = list.concat(entrepreneurshipCatalog); } catch(e) {}
    try { if (typeof acquisitions !== "undefined" && Array.isArray(acquisitions)) list = list.concat(acquisitions); } catch(e) {}
    if (!list.length) return "";
    var cash = totalLiquid1824(true);
    var businesses = (state.finance.businesses || []);
    var seen = {};
    var cards = list.filter(function (v) { if (seen[v.id]) return false; seen[v.id] = true; return true; }).slice(0, 18).map(function (v) {
      var price = Math.round(num1824(v.startup || v.buy));
      var minAge = Math.round(num1824(v.minAge, 18));
      var owned = businesses.some(function (b) { return b.id === v.id || b.baseId === v.id; });
      var ok = num1824(state.age) >= minAge && cash >= price && !owned;
      var missing = [];
      if (num1824(state.age) < minAge) missing.push("Age " + minAge + "+");
      if (cash < price) missing.push(money1824(price - cash) + " more liquid");
      if (owned) missing.push("Already owned");
      if (v.scaleStat) missing.push(String(v.scaleStat).toUpperCase() + " scales profit");
      return '<div class="v1824-req-card ' + (ok ? "unlocked" : "locked") + '"><div class="v1824-req-head"><b>' + esc1824(v.name || v.id) + '</b><span>' + (ok ? "Ready" : "Need") + '</span></div><p>' + esc1824(v.desc || "Business path.") + '</p><div class="v1824-pill-row"><span>Cost ' + money1824(price) + '</span><span>Age ' + minAge + '+</span><span>' + esc1824(missing.join(" · ") || "Launchable now") + '</span></div></div>';
    }).join("");
    return '<section class="money-section v1824-business-reqs"><div class="money-section-title">Business Requirement Board <span>unlock clarity</span></div><div class="v1824-req-grid">' + cards + '</div></section>';
  }
  function removeSections1824(html) {
    html = String(html || "");
    ["v1824-tax-liquidity", "v1824-cashflow-command", "v1824-credit-desk", "v1824-business-tax", "v1824-business-reqs", "v1824-career-reqs", "v1824-debt-payoff", "v1823-tax-payoff", "v1822-education-debt"].forEach(function (cls) {
      var idx = html.indexOf(cls);
      while (idx >= 0) {
        var start = html.lastIndexOf("<section", idx);
        var end = html.indexOf("</section>", idx);
        if (start < 0 || end < 0) break;
        html = html.slice(0, start) + html.slice(end + 10);
        idx = html.indexOf(cls);
      }
    });
    return html;
  }
  function insertAfterFirstSection1824(html, chunk) {
    html = String(html || "");
    var end = html.indexOf("</section>");
    return end >= 0 ? html.slice(0, end + 10) + chunk + html.slice(end + 10) : chunk + html;
  }
  var prevRenderHubContent1824 = window.renderHubContent || (typeof renderHubContent === "function" ? renderHubContent : null);
  if (prevRenderHubContent1824) {
    window.renderHubContent = function (hubId) {
      ensure1824();
      var html = "";
      try { html = prevRenderHubContent1824.apply(this, arguments) || ""; }
      catch(e) { html = '<section class="panel"><div class="section-label">Recovered render</div><div class="row-sub">' + esc1824(e && (e.message || e)) + '</div></section>'; }
      html = removeSections1824(html);
      if (hubId === "money") {
        html = insertAfterFirstSection1824(html, cashFlowCommand1824() + liquidityTaxDesk1824("money") + debtPayoffDesk1824() + creditDesk1824());
      }
      if (hubId === "finance" || hubId === "networth" || hubId === "network") {
        html = insertAfterFirstSection1824(html, cashFlowCommand1824() + businessTaxDesk1824() + liquidityTaxDesk1824("finance") + debtPayoffDesk1824() + creditDesk1824());
      }
      if (hubId === "law" || hubId === "legal") {
        html = insertAfterFirstSection1824(html, liquidityTaxDesk1824("law") + businessTaxDesk1824());
      }
      if (hubId === "brokerage") {
        html += liquidityTaxDesk1824("brokerage") + businessTaxDesk1824();
      }
      if (hubId === "business") {
        html = insertAfterFirstSection1824(html, businessTaxDesk1824() + businessRequirementDesk1824());
      }
      if (hubId === "career") {
        html += careerRequirementDesk1824();
      }
      return html;
    };
    try { renderHubContent = window.renderHubContent; } catch(e) {}
  }
  var style = document.createElement("style");
  style.textContent = [
    ".v1824-tax-liquidity,.v1824-cashflow-command,.v1824-credit-desk,.v1824-business-tax,.v1824-business-reqs,.v1824-debt-payoff{border-color:rgba(126,160,172,.42)!important;background:linear-gradient(135deg,rgba(21,36,40,.96),rgba(34,29,22,.97))!important;overflow:hidden!important}.v1824-tax-liquidity{border-color:rgba(233,146,125,.48)!important;background:linear-gradient(135deg,rgba(49,28,24,.98),rgba(28,24,19,.98))!important}.v1824-credit-desk{border-color:rgba(201,155,85,.46)!important;background:linear-gradient(135deg,rgba(48,38,22,.98),rgba(29,25,20,.98))!important}.v1824-business-tax{border-color:rgba(185,220,138,.42)!important;background:linear-gradient(135deg,rgba(24,42,28,.96),rgba(31,27,21,.97))!important}",
    ".v1824-tile-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:8px}.v1824-tile-grid>div{min-width:0;border:1px solid rgba(255,255,255,.10);border-radius:11px;background:rgba(255,255,255,.045);padding:10px}.v1824-tile-grid span{display:block;font-family:'JetBrains Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:.12em;color:#b9a98e}.v1824-tile-grid b{display:block;font-family:'JetBrains Mono',monospace;font-size:18px;line-height:1.1;color:#fff3df;margin-top:5px;overflow-wrap:anywhere}.v1824-tile-grid em{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:9px;line-height:1.35;margin-top:5px;font-style:normal}.v1824-tile-grid .good b{color:#b9dc8a}.v1824-tile-grid .bad b{color:#e9927d}.v1824-tile-grid .gold b{color:#f0ca7b}",
    ".v1824-action-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}.v1824-action-row .money-btn{min-width:92px;white-space:normal!important}.v1824-custom-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;margin-top:9px}.v1824-custom-row input{min-width:0;border:1px solid rgba(216,173,109,.32);border-radius:8px;background:#100d0a;color:#f6ead8;padding:10px;font-family:'JetBrains Mono',monospace;font-size:11px}.v1824-pill-row{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}.v1824-pill-row span{border:1px solid rgba(255,255,255,.10);border-radius:999px;padding:5px 8px;color:#d6c5aa;font-family:'JetBrains Mono',monospace;font-size:9px;line-height:1.2}",
    ".v1824-flow-chart{height:96px;display:flex;align-items:end;gap:7px;border:1px solid rgba(255,255,255,.08);border-radius:12px;background:rgba(0,0,0,.18);padding:10px 10px 22px;margin-top:10px}.v1824-flow-bar{flex:1;min-width:18px;height:100%;position:relative;display:flex;align-items:end}.v1824-flow-bar i{display:block;width:100%;min-height:8px;border-radius:7px 7px 2px 2px;background:linear-gradient(180deg,#f0ca7b,#80602a)}.v1824-flow-bar i.good{background:linear-gradient(180deg,#b9dc8a,#4f6c3d)}.v1824-flow-bar i.bad{background:linear-gradient(180deg,#e9927d,#73362d)}.v1824-flow-bar span{position:absolute;bottom:-18px;left:50%;transform:translateX(-50%);font-family:'JetBrains Mono',monospace;font-size:8px;color:#b9a98e}.v1824-mini-lines{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 12px;margin-top:10px}.v1824-mini-line{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;border-top:1px solid rgba(255,255,255,.08);padding:8px 0}.v1824-mini-line b{display:block;color:#fff3df;font-size:13px}.v1824-mini-line span{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:9px}.v1824-mini-line strong{font-family:'JetBrains Mono',monospace;white-space:nowrap}.v1824-mini-line strong.good{color:#b9dc8a}.v1824-mini-line strong.bad{color:#e9927d}",
    ".v1824-debt-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:9px;margin-top:10px}.v1824-debt-card{border:1px solid rgba(255,255,255,.10);border-radius:12px;background:rgba(255,255,255,.045);padding:11px}.v1824-debt-card b{display:block;color:#fff3df;font-size:14px}.v1824-debt-card span{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.4;margin-top:3px}.v1824-debt-card strong{display:block;color:#e9927d;font-family:'JetBrains Mono',monospace;font-size:18px;margin-top:6px}.v1824-action-row.small .money-btn{font-size:9px!important;min-width:78px!important}.v1824-req-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:9px;margin-top:10px}.v1824-req-card{border:1px solid rgba(255,255,255,.10);border-radius:12px;background:rgba(255,255,255,.045);padding:11px;min-width:0}.v1824-req-card.locked{border-color:rgba(233,146,125,.34)}.v1824-req-card.unlocked{border-color:rgba(185,220,138,.42)}.v1824-req-head{display:flex;justify-content:space-between;gap:8px}.v1824-req-head b{display:block;color:#fff3df;font-size:14px}.v1824-req-head span{font-family:'JetBrains Mono',monospace;font-size:9px;color:#f0ca7b;text-transform:uppercase;letter-spacing:.12em}.v1824-req-card.unlocked .v1824-req-head span{color:#b9dc8a}.v1824-req-card p{color:#d6c5aa;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.45;margin:7px 0 2px}.v1824-career-reqs{border-color:rgba(126,160,172,.38)!important;background:linear-gradient(135deg,rgba(22,38,42,.96),rgba(34,28,22,.96))!important}",
    "@media(max-width:820px){.v1824-tile-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.v1824-mini-lines{grid-template-columns:1fr}}@media(max-width:520px){.v1824-tile-grid{grid-template-columns:1fr}.v1824-custom-row{grid-template-columns:1fr}.v1824-action-row .money-btn{flex:1 1 44%}.v1824-req-grid{grid-template-columns:1fr}}"
  ].join("\n");
  document.head.appendChild(style);
})();

