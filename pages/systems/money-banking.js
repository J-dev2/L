/* Money / banking command center. */
(function () {
  if (window.__ledgerMoneyBankingSystemV1837Loaded) return;
  window.__ledgerMoneyBankingSystemV1837Loaded = true;

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
    try { if (typeof state !== "undefined" && state) return state; } catch (e) {}
    if (!window.state) window.state = {};
    return window.state;
  }

  function ensureMoneyState() {
    try { if (typeof ensureStateShape === "function") ensureStateShape(); } catch (e) {}
    var s = safeState();
    if (!s.finance || typeof s.finance !== "object" || Array.isArray(s.finance)) s.finance = {};
    if (!s.stats || typeof s.stats !== "object" || Array.isArray(s.stats)) s.stats = {};
    if (!s.actionsTaken || typeof s.actionsTaken !== "object" || Array.isArray(s.actionsTaken)) s.actionsTaken = {};
    if (s.money == null) s.money = 0;
    if (s.savings == null) s.savings = 0;
    if (s.debt == null) s.debt = 0;
    var f = s.finance;
    if (f.superSaver == null) f.superSaver = 0;
    if (f.superSaverRate == null) f.superSaverRate = .038;
    if (f.creditScore == null) f.creditScore = 650;
    if (f.creditCardDebt == null) f.creditCardDebt = 0;
    if (f.assetBackedLoan == null) f.assetBackedLoan = 0;
    if (f.assetBackedLoanRate == null) f.assetBackedLoanRate = .052;
    if (f.taxDebt == null) f.taxDebt = n((f.debts || {}).taxDebt);
    if (f.taxLegalRisk == null) f.taxLegalRisk = 0;
    if (!f.insurance) f.insurance = "none";
    if (!f.budget) f.budget = "balanced";
    if (!f.accountant || typeof f.accountant !== "object") f.accountant = { id: "none", name: "No Accountant", upfront: 0, feePct: 0, reduction: 0, desc: "Handle taxes alone." };
    if (!f.debts || typeof f.debts !== "object" || Array.isArray(f.debts)) f.debts = {};
    if (!f.personalLineV1860 || typeof f.personalLineV1860 !== "object" || Array.isArray(f.personalLineV1860)) f.personalLineV1860 = { balance: 0, rate: .12 };
    return s;
  }

  function moneyText(value) {
    try { if (typeof money === "function") return money(round(value)); } catch (e) {}
    return "$" + round(value).toLocaleString();
  }

  function compactMoney(value) {
    value = round(value);
    var abs = Math.abs(value);
    var sign = value < 0 ? "-" : "";
    if (abs >= 1000000000000) return sign + "$" + (abs / 1000000000000).toFixed(abs >= 10000000000000 ? 1 : 2).replace(/\.0+$/, "") + "T";
    if (abs >= 1000000000) return sign + "$" + (abs / 1000000000).toFixed(abs >= 10000000000 ? 1 : 2).replace(/\.0+$/, "") + "B";
    if (abs >= 1000000) return sign + "$" + (abs / 1000000).toFixed(abs >= 10000000 ? 1 : 2).replace(/\.0+$/, "") + "M";
    if (abs >= 1000) return sign + "$" + (abs / 1000).toFixed(abs >= 10000 ? 1 : 2).replace(/\.0+$/, "") + "K";
    return moneyText(value);
  }

  function signedMoney(value) {
    value = round(value);
    return (value > 0 ? "+" : value < 0 ? "-" : "") + compactMoney(Math.abs(value));
  }

  function pct(value) {
    return (n(value) * 100).toFixed(Math.abs(n(value)) >= .1 ? 1 : 2) + "%";
  }

  function cls(value, zeroGood) {
    value = n(value);
    if (value > 0) return "good";
    if (value < 0) return "bad";
    return zeroGood ? "good" : "gold";
  }

  function runSaveRender() {
    try { if (typeof save === "function") save(); } catch (e) {}
    try {
      if (typeof window.renderHubInPlaceV16 === "function") return window.renderHubInPlaceV16("money");
    } catch (e2) {}
    try { if (typeof render === "function") render(); } catch (e3) {}
  }

  function toast(message) {
    try { if (typeof addToast === "function") return addToast(message); } catch (e) {}
  }

  function log(message, deltas) {
    try { if (typeof addLog === "function") return addLog(message, deltas || {}); } catch (e) {}
    toast(message);
  }

  function readInputAmount(inputId, max) {
    var el = typeof document !== "undefined" ? document.getElementById(inputId) : null;
    var raw = String(el && el.value || "").replace(/[^0-9.]/g, "");
    var amount = Math.max(0, round(raw));
    if (max != null) amount = Math.min(amount, Math.max(0, round(max)));
    if (el) el.value = "";
    return amount;
  }

  function accountSpec(id) {
    var s = ensureMoneyState();
    var f = s.finance || {};
    var specs = {
      checking: { label: "Checking", obj: s, key: "money", value: n(s.money) },
      savings: { label: "Savings", obj: s, key: "savings", value: n(s.savings) },
      super: { label: "Super Saver", obj: f, key: "superSaver", value: n(f.superSaver) }
    };
    return specs[id] || null;
  }

  function moveMoney(fromId, toId, amount, label) {
    var from = accountSpec(fromId);
    var to = accountSpec(toId);
    amount = amount === "all" && from ? n(from.obj[from.key]) : round(amount);
    if (!from || !to || fromId === toId) return toast("Pick two different money accounts.");
    amount = Math.max(0, Math.min(amount, Math.max(0, n(from.obj[from.key]))));
    if (!amount) return toast("No cash available for that move.");
    from.obj[from.key] = round(n(from.obj[from.key]) - amount);
    to.obj[to.key] = round(n(to.obj[to.key]) + amount);
    log((label || "Moved") + " " + moneyText(amount) + " from " + from.label + " to " + to.label + ".", { money: fromId === "checking" ? -amount : (toId === "checking" ? amount : 0) });
    runSaveRender();
  }

  window.moveMoneyV1837 = function (fromId, toId, amount) {
    moveMoney(fromId, toId, amount);
  };

  window.moveMoneyPctV1837 = function (fromId, toId, pctValue) {
    var from = accountSpec(fromId);
    if (!from) return toast("Account not found.");
    moveMoney(fromId, toId, Math.max(0, n(from.obj[from.key])) * n(pctValue), "Moved");
  };

  window.moveMoneyCustomV1837 = function (fromId, toId, inputId) {
    var from = accountSpec(fromId);
    var amount = readInputAmount(inputId, from ? Math.max(0, n(from.obj[from.key])) : 0);
    moveMoney(fromId, toId, amount, "Moved custom");
  };

  window.setBudgetStyleV1837 = function (id) {
    ensureMoneyState();
    try {
      if (typeof setBudgetStyle === "function") return setBudgetStyle(id);
      if (typeof window.setBudgetStyle === "function") return window.setBudgetStyle(id);
    } catch (e) {}
    var plans = budgetPlans();
    if (!plans.some(function (plan) { return plan.id === id; })) return toast("Budget style not found.");
    safeState().finance.budget = id;
    log("Budget style changed to " + (plans.find(function (plan) { return plan.id === id; }) || {}).name + ".");
    runSaveRender();
  };

  window.openMoneyHubV1837 = function (hubId) {
    hubId = hubId || "finance";
    try { if (typeof setTabV16 === "function") return setTabV16(hubId); } catch (e) {}
    try { if (typeof window.setTabV16 === "function") return window.setTabV16(hubId); } catch (e2) {}
    try { if (typeof setTab === "function") return setTab(hubId); } catch (e3) {}
    try { if (typeof window.setTab === "function") return window.setTab(hubId); } catch (e4) {}
  };

  window.payCreditCardV1837 = function (amount) {
    ensureMoneyState();
    try {
      if (typeof payCreditCard === "function") return payCreditCard(amount);
      if (typeof window.payCreditCard === "function") return window.payCreditCard(amount);
    } catch (e) {}
    var s = safeState();
    var f = s.finance;
    var max = Math.min(Math.max(0, n(s.money)), Math.max(0, n(f.creditCardDebt)));
    var pay = amount === "all" || amount === "max" ? max : Math.min(max, round(amount));
    if (!pay) return toast("No credit balance can be paid right now.");
    s.money -= pay;
    f.creditCardDebt -= pay;
    f.creditScore = Math.min(850, round(n(f.creditScore, 650) + Math.ceil(pay / 800)));
    log("Paid " + moneyText(pay) + " toward credit balance.", { money: -pay });
    runSaveRender();
  };

  window.useCreditCardV1837 = function (amount) {
    ensureMoneyState();
    try {
      if (typeof useCreditCard === "function") return useCreditCard(amount, "banking command center");
      if (typeof window.useCreditCard === "function") return window.useCreditCard(amount, "banking command center");
    } catch (e) {}
    var s = safeState();
    var f = s.finance;
    if (n(s.age) < 18) return toast("Credit cards unlock at 18.");
    var limit = creditLimit();
    var room = Math.max(0, limit - n(f.creditCardDebt));
    var borrow = Math.min(room, Math.max(0, round(amount)));
    if (!borrow) return toast("No credit room available.");
    f.creditCardDebt += borrow;
    s.money += borrow;
    f.creditScore = Math.max(300, round(n(f.creditScore, 650) - Math.ceil(borrow / 1200)));
    log("Used " + moneyText(borrow) + " of credit line for cash flexibility.", { money: borrow });
    runSaveRender();
  };

  // --- Personal Line of Credit (score-gated high-limit lending) ---
  function personalLineLimit() {
    var f = ensureMoneyState().finance || {};
    var score = round(n(f.creditScore, 650));
    if (score >= 840) return 1500000;
    if (score >= 800) return 750000;
    if (score >= 760) return 200000;
    if (score >= 720) return 50000;
    return 0;
  }
  function personalLineRate() {
    var f = ensureMoneyState().finance || {};
    var score = round(n(f.creditScore, 650));
    return score >= 800 ? .07 : score >= 760 ? .09 : score >= 720 ? .12 : .16;
  }
  window.drawPersonalLineV1860 = function (amount) {
    ensureMoneyState();
    var s = safeState();
    var f = s.finance;
    if (n(s.age) < 18) return toast("A personal line of credit unlocks at 18.");
    var limit = personalLineLimit();
    if (limit <= 0) return toast("A personal line of credit unlocks at a 720+ credit score.");
    var line = f.personalLineV1860;
    var room = Math.max(0, limit - n(line.balance));
    var amt = amount === "max" ? room : Math.min(room, Math.max(0, round(amount)));
    if (!amt) return toast("No personal-line room available. Pay it down or raise your score.");
    line.balance = round(n(line.balance) + amt);
    line.rate = personalLineRate();
    s.money = round(n(s.money) + amt);
    f.creditScore = Math.max(300, round(n(f.creditScore, 650) - Math.ceil(amt / 50000)));
    log("Drew " + moneyText(amt) + " from your personal line of credit.", { money: amt });
    runSaveRender();
  };
  window.payPersonalLineV1860 = function (amount) {
    ensureMoneyState();
    var s = safeState();
    var f = s.finance;
    var line = f.personalLineV1860;
    var debt = Math.max(0, n(line.balance));
    if (!debt) return toast("No personal-line balance to pay.");
    var max = Math.min(Math.max(0, n(s.money)), debt);
    var amt = (amount === "all" || amount === "max") ? max : Math.min(max, round(amount));
    if (!amt) return toast("No cash available to pay the personal line.");
    s.money = round(n(s.money) - amt);
    line.balance = Math.max(0, round(debt - amt));
    f.creditScore = Math.min(850, round(n(f.creditScore, 650) + Math.ceil(amt / 40000)));
    log("Paid " + moneyText(amt) + " toward your personal line of credit.", { money: -amt });
    runSaveRender();
  };

  window.openSecuredCardV1837 = function () {
    try {
      if (typeof openSecuredCreditCardV1814 === "function") return openSecuredCreditCardV1814(500);
      if (typeof window.openSecuredCreditCardV1814 === "function") return window.openSecuredCreditCardV1814(500);
    } catch (e) {}
    toast("Secured card tools are not available on this save yet.");
  };

  window.reviewCreditV1837 = function () {
    try {
      if (typeof requestCreditReviewV1811 === "function") return requestCreditReviewV1811();
      if (typeof window.requestCreditReviewV1811 === "function") return window.requestCreditReviewV1811();
    } catch (e) {}
    toast("Keep utilization low and age up with paid balances to improve credit.");
  };

  window.borrowSecuredPctV1837 = function (pctValue) {
    try {
      if (typeof borrowSecuredPct === "function") return borrowSecuredPct(pctValue);
      if (typeof window.borrowSecuredPct === "function") return window.borrowSecuredPct(pctValue);
    } catch (e) {}
    var room = securedRoom();
    try {
      if (typeof borrowAgainstWealth === "function") return borrowAgainstWealth(Math.round(room * n(pctValue)));
      if (typeof window.borrowAgainstWealth === "function") return window.borrowAgainstWealth(Math.round(room * n(pctValue)));
    } catch (e2) {}
    toast("Secured borrowing is not available yet.");
  };

  window.borrowSecuredMaxV1837 = function () {
    try {
      if (typeof borrowAgainstWealth === "function") return borrowAgainstWealth("max");
      if (typeof window.borrowAgainstWealth === "function") return window.borrowAgainstWealth("max");
    } catch (e) {}
    toast("Secured borrowing is not available yet.");
  };

  window.repaySecuredLoanV1837 = function (amount) {
    try {
      if (typeof repayWealthLoan === "function") return repayWealthLoan(amount);
      if (typeof window.repayWealthLoan === "function") return window.repayWealthLoan(amount);
    } catch (e) {}
    toast("Secured loan repayment is not available yet.");
  };

  window.selectInsuranceV1837 = function (planId) {
    ensureMoneyState();
    try {
      if (typeof setHealthInsurance === "function") return setHealthInsurance(planId);
      if (typeof window.setHealthInsurance === "function") return window.setHealthInsurance(planId);
    } catch (e) {}
    var s = safeState();
    var plan = insurancePlans().find(function (item) { return item.id === planId; }) || insurancePlans()[0];
    var premium = n(s.age) >= 18 ? round(plan.premium) : 0;
    if (plan.id !== "none" && premium > 0 && n(s.money) < premium) return toast(plan.name + " needs first premium " + moneyText(premium) + ".");
    s.money -= premium;
    s.finance.insurance = plan.id;
    s.finance.lastInsurancePlanName = plan.name;
    log("Health insurance changed to " + plan.name + ".", { money: -premium });
    runSaveRender();
  };

  window.hireAccountantV1837 = function (planId) {
    ensureMoneyState();
    try {
      if (typeof hireAccountant === "function") return hireAccountant(planId);
      if (typeof window.hireAccountant === "function") return window.hireAccountant(planId);
    } catch (e) {}
    var s = safeState();
    var plan = accountantPlans().find(function (item) { return item.id === planId; }) || accountantPlans()[0];
    if (plan.id !== "none" && n(s.money) < plan.upfront) return toast(plan.name + " costs " + moneyText(plan.upfront) + " upfront.");
    s.money -= round(plan.upfront || 0);
    s.finance.accountant = Object.assign({}, plan);
    s.finance.taxLegalRisk = Math.max(0, round(n(s.finance.taxLegalRisk) - (plan.reduction ? 8 : 0)));
    log("Accountant changed to " + plan.name + ".", { money: -round(plan.upfront || 0) });
    runSaveRender();
  };

  function taxDebtValue() {
    var s = ensureMoneyState();
    var f = s.finance || {};
    return Math.max(0, round(f.taxDebt != null ? f.taxDebt : ((f.debts || {}).taxDebt != null ? f.debts.taxDebt : (s.taxDebt || 0))));
  }

  function syncTaxDebt(value) {
    var s = ensureMoneyState();
    var f = s.finance || {};
    value = Math.max(0, round(value));
    f.taxDebt = value;
    if (!f.debts || typeof f.debts !== "object" || Array.isArray(f.debts)) f.debts = {};
    f.debts.taxDebt = value;
    s.taxDebt = value;
    if (!s.tax || typeof s.tax !== "object" || Array.isArray(s.tax)) s.tax = {};
    s.tax.taxDebt = value;
    return value;
  }

  function accountantActive(accountant) {
    accountant = accountant || currentAccountantPlan();
    return !!(accountant && accountant.id && accountant.id !== "none");
  }

  window.accountantPayTaxesV1837 = function (manual) {
    var s = ensureMoneyState();
    var f = s.finance || {};
    var acc = currentAccountantPlan();
    if (!accountantActive(acc)) {
      if (manual !== false) toast("Hire an accountant first. They can file and pay tax balances for you.");
      return false;
    }
    var before = taxDebtValue();
    var cash = Math.max(0, round(s.money));
    var paid = Math.min(cash, before);
    if (paid > 0) s.money -= paid;
    var after = syncTaxDebt(before - paid);
    f.lastAccountantFiledAgeV1837 = round(s.age);
    f.lastAccountantTaxPaymentV1837 = paid;
    f.lastAccountantTaxBalanceBeforeV1837 = before;
    f.lastAccountantTaxBalanceAfterV1837 = after;
    if (before <= 0) {
      f.lastAccountantFileStatusV1837 = acc.name + " filed clean taxes. No balance due.";
      if (manual !== false) log(acc.name + " filed your taxes. No tax balance was due.");
    } else if (after <= 0) {
      f.taxLegalRisk = Math.max(0, round(n(f.taxLegalRisk) - 12));
      f.lastAccountantFileStatusV1837 = acc.name + " filed and paid " + compactMoney(paid) + " from checking.";
      log(acc.name + " filed your taxes and paid " + moneyText(paid) + " from checking.", { money: -paid });
    } else {
      f.taxLegalRisk = Math.max(0, round(n(f.taxLegalRisk) - 4));
      f.lastAccountantFileStatusV1837 = acc.name + " filed, paid " + compactMoney(paid) + ", " + compactMoney(after) + " still due.";
      log(acc.name + " filed your taxes and paid " + moneyText(paid) + ". " + moneyText(after) + " remains due.", { money: -paid, stress: 2 });
    }
    if (manual !== false) runSaveRender();
    else {
      try { if (typeof save === "function") save(); } catch (e) {}
    }
    return true;
  };

  window.negotiateAccountantFeeV1837 = function (targetPct, cost) {
    var s = ensureMoneyState();
    var f = s.finance || {};
    var acc = currentAccountantPlan();
    targetPct = n(targetPct);
    cost = round(cost);
    if (!accountantActive(acc)) return toast("Hire an accountant first, then negotiate the fee.");
    if (n(acc.feePct) <= targetPct) return toast("Your accountant fee is already that low or better.");
    if (n(s.money) < cost) return toast("Negotiating that fee needs " + moneyText(cost) + " in checking.");
    s.money -= cost;
    acc.feePct = targetPct;
    acc.retainerPaid = round(n(acc.retainerPaid) + cost);
    if (cost >= 250000) acc.reduction = Math.max(n(acc.reduction), .10);
    else if (cost >= 25000) acc.reduction = Math.max(n(acc.reduction), .085);
    f.accountant = acc;
    f.taxLegalRisk = Math.max(0, round(n(f.taxLegalRisk) - (cost >= 25000 ? 8 : 3)));
    f.lastAccountantNegotiationV1837 = "Cut fee to " + pct(targetPct) + " for " + compactMoney(cost) + ".";
    log("Negotiated " + acc.name + " down to " + pct(targetPct) + " of savings for " + moneyText(cost) + ".", { money: -cost });
    runSaveRender();
  };

  function stockValue() {
    var s = ensureMoneyState();
    try { if (typeof stockValue18 === "function") return Math.max(0, round(stockValue18())); } catch (e) {}
    var m = s.finance.stocksV18 || {};
    if (!Array.isArray(m.holdings)) return Math.max(0, round(s.finance.stockValue));
    return Math.max(0, round(m.holdings.reduce(function (sum, h) {
      var price = n(m.prices && (m.prices[h.id] != null ? m.prices[h.id] : m.prices[h.symbol]));
      if (!price) price = n(h.price || h.currentPrice || h.avgCost);
      return sum + n(h.shares) * price;
    }, 0)));
  }

  function investedValue() {
    var f = ensureMoneyState().finance || {};
    return Math.max(0, round(n(f.brokerage) + n(f.brokerageCash) + stockValue() + n(f.managedPortfolio) + n(f.personalFirm && f.personalFirm.cash) + n(f.firmCashV1828) + n(f.externalManager && f.externalManager.capital) + n(f.managerFirmsV1829 && f.managerFirmsV1829.capital)));
  }

  function totalDebts() {
    var s = ensureMoneyState();
    var f = s.finance || {};
    return Math.max(0, round(Math.max(0, -n(s.money)) + n(s.debt) + n(f.creditCardDebt) + n(f.assetBackedLoan) + n(f.taxDebt || f.debts.taxDebt) + n(f.medicalDebt) + n(f.personalDebt) + n((f.personalLineV1860 || {}).balance)));
  }

  function netWorthFallback() {
    var s = ensureMoneyState();
    var f = s.finance || {};
    try { if (typeof financeNetWorth === "function") return round(financeNetWorth(s)); } catch (e) {}
    return round(n(s.money) + n(s.savings) + n(f.superSaver) + investedValue() + n(s.ira) + n(s.retirement401k) - totalDebts());
  }

  function cashFlow() {
    var cf = {};
    try { if (typeof cashFlowV6 === "function") cf = cashFlowV6() || {}; } catch (e) {}
    try { if ((!cf || !Object.keys(cf).length) && typeof computeAnnualCashFlowV6 === "function") cf = computeAnnualCashFlowV6() || {}; } catch (e2) {}
    try { if ((!cf || !Object.keys(cf).length) && typeof cashFlowModel === "function") cf = cashFlowModel() || {}; } catch (e3) {}
    var s = ensureMoneyState();
    var f = s.finance || {};
    var income = Math.max(0, round(cf.inflow || cf.salary || (s.job && s.job.salary) || f.yearIncome || f.lastYearIncome));
    var outflow = Math.max(0, round(cf.outflow || f.yearExpenses || f.lastYearExpenses));
    var tax = Math.max(0, round((cf.tax && (cf.tax.finalTax || cf.tax.total || cf.tax.due)) || cf.taxes || cf.tax || f.lastYearTaxes || f.lastYearTaxAdjustment));
    var transfers = Math.max(0, round(cf.transfers || cf.autoSave || f.lastTransfers));
    var checkingChange = Number.isFinite(Number(cf.checkingChange)) && Number(cf.checkingChange) !== 0 ? round(cf.checkingChange) : round(income - outflow - transfers);
    return { raw: cf || {}, income: income, outflow: outflow, tax: tax, transfers: transfers, checkingChange: checkingChange };
  }

  function budgetPlans() {
    try {
      if (typeof budgetCatalog !== "undefined" && Array.isArray(budgetCatalog)) return budgetCatalog;
    } catch (e) {}
    return [
      { id: "survival", name: "Survival Budget", desc: "Bare minimum spending. Helps cash, hurts happiness.", autoSave: .02, autoInvest: 0 },
      { id: "balanced", name: "Balanced Budget", desc: "Normal spending with a little saving and investing.", autoSave: .05, autoInvest: .02 },
      { id: "aggressive", name: "Aggressive Saver", desc: "Push more yearly cash into reserves.", autoSave: .15, autoInvest: .03 },
      { id: "investor", name: "Investor Mode", desc: "Prioritize auto-investing through Investments.", autoSave: .04, autoInvest: .12 },
      { id: "spender", name: "Big Spender", desc: "More fun now, weaker future cash flow.", autoSave: 0, autoInvest: 0 }
    ];
  }

  function currentBudget() {
    var id = ensureMoneyState().finance.budget || "balanced";
    return budgetPlans().find(function (item) { return item.id === id; }) || budgetPlans()[1];
  }

  function insurancePlans() {
    try {
      if (typeof wealthHealthInsurancePlans !== "undefined" && Array.isArray(wealthHealthInsurancePlans)) return wealthHealthInsurancePlans;
    } catch (e) {}
    return [
      { id: "none", name: "No Insurance", coverage: 0, premium: 0, deductible: 0, desc: "You pay the full bill. Cheap now, brutal during emergencies." },
      { id: "basic50", name: "Basic 50% Plan", coverage: .5, premium: 1200, deductible: 1200, desc: "Affordable starter coverage for small emergencies." },
      { id: "premium90", name: "Premium 90% Plan", coverage: .9, premium: 6000, deductible: 500, desc: "Most hospital bills are handled." },
      { id: "elite100", name: "Elite 100% Plan", coverage: 1, premium: 18000, deductible: 0, desc: "Full protection if you can afford it." }
    ];
  }

  function currentInsurance() {
    try {
      if (typeof selectedHealthInsurancePlan === "function") return selectedHealthInsurancePlan();
      if (typeof window.selectedHealthInsurancePlan === "function") return window.selectedHealthInsurancePlan();
    } catch (e) {}
    var id = ensureMoneyState().finance.insurance;
    return insurancePlans().find(function (plan) { return plan.id === id || (id === true && plan.id === "basic50"); }) || insurancePlans()[0];
  }

  function accountantPlans() {
    return [
      { id: "none", name: "No Accountant", upfront: 0, feePct: 0, reduction: 0, desc: "You file alone. No fee, no tax savings, weak audit help." },
      { id: "local", name: "Local Tax Preparer", upfront: 500, feePct: .12, reduction: .05, desc: "Good for normal jobs and simple side income." },
      { id: "cpa", name: "CPA Advisor", upfront: 5000, feePct: .06, reduction: .075, desc: "Better planning for investments and high income." },
      { id: "elite", name: "Elite Tax Counsel", upfront: 50000, feePct: .03, reduction: .10, desc: "Serious wealth and business tax planning." }
    ];
  }

  function currentAccountantPlan() {
    var acc = ensureMoneyState().finance.accountant || {};
    if (acc.id) return Object.assign({}, accountantPlans().find(function (plan) { return plan.id === acc.id; }) || {}, acc);
    if (typeof acc === "string") return accountantPlans().find(function (plan) { return plan.id === acc; }) || accountantPlans()[0];
    return accountantPlans()[0];
  }

  function accountantNegotiationOptions() {
    return [
      { target: .06, cost: 5000, label: "Cut to 6%" },
      { target: .03, cost: 25000, label: "Cut to 3%" },
      { target: .001, cost: 250000, label: "0.1% deal" }
    ];
  }

  function creditLimit() {
    var f = ensureMoneyState().finance || {};
    var score = round(n(f.creditScore, 650));
    // Single source of truth: the core ledgerCreditLimit() also enforces the card,
    // so the displayed limit always matches what the "Use credit" button will extend.
    if (typeof window.ledgerCreditLimit === "function") return window.ledgerCreditLimit(score);
    if (score >= 760) return 25000;
    if (score >= 700) return 12000;
    if (score >= 620) return 5000;
    return 1500;
  }

  function creditBand(score) {
    score = round(score);
    if (score >= 760) return { label: "Excellent", cls: "good" };
    if (score >= 700) return { label: "Strong", cls: "good" };
    if (score >= 640) return { label: "Building", cls: "gold" };
    if (score >= 580) return { label: "Fragile", cls: "bad" };
    return { label: "Damaged", cls: "bad" };
  }

  function securedRoom() {
    var s = ensureMoneyState();
    var f = s.finance || {};
    try { if (typeof securedBorrowingLimitV6 === "function") return Math.max(0, round(securedBorrowingLimitV6())); } catch (e) {}
    try { if (typeof availableCollateral === "function") return Math.max(0, round(availableCollateral())); } catch (e2) {}
    var reserve = Math.max(0, n(s.savings) + n(f.superSaver));
    var invested = Math.max(0, n(f.brokerage) + stockValue());
    return Math.max(0, round(reserve * 1.7 + invested * .45 - n(f.assetBackedLoan)));
  }

  function residenceSummary(flow) {
    var s = ensureMoneyState();
    var f = s.finance || {};
    var country = "United States";
    var region = "Pennsylvania";
    var sales = 0;
    var regionRate = 0;
    try {
      if (typeof currentResidenceV6 === "function") {
        var res = currentResidenceV6() || {};
        country = res.country || country;
        region = res.name || res.region || region;
        sales = n(res.sales);
        regionRate = n(res.income || res.rate);
      } else if (typeof countryV6 === "function") {
        var c = countryV6(f.taxCountry || "us") || {};
        var r = typeof regionV6 === "function" ? regionV6(c.id, f.taxRegion) || {} : {};
        country = c.name || country;
        region = r.name || r[1] || region;
        sales = n(r.sales || r[3]);
        regionRate = n(r.income || r[2]);
      }
    } catch (e) {}
    if (f.taxRegionName) region = f.taxRegionName;
    if (f.taxCountryName) country = f.taxCountryName;
    var effective = flow && flow.income ? n(flow.tax) / Math.max(1, n(flow.income)) : 0;
    return { country: country, region: region, sales: sales, regionRate: regionRate, effective: effective };
  }

  function metric(label, value, note, kind) {
    return '<div class="v1837-money-metric ' + esc(kind || "") + '"><span>' + esc(label) + '</span><b>' + esc(value) + '</b><em>' + esc(note || "") + '</em></div>';
  }

  function action(label, handler, kind, disabled) {
    return '<button class="money-btn ' + esc(kind || "") + '" onclick="event.preventDefault();event.stopPropagation();' + handler + '" ' + (disabled ? "disabled" : "") + '>' + esc(label) + '</button>';
  }

  function customMove(id, fromId, toId, label, disabled) {
    return '<div class="v1837-money-custom"><input id="' + esc(id) + '" inputmode="numeric" placeholder="' + esc(label) + '"><button class="money-btn green" onclick="event.preventDefault();event.stopPropagation();moveMoneyCustomV1837(\'' + esc(fromId) + '\',\'' + esc(toId) + '\',\'' + esc(id) + '\')" ' + (disabled ? "disabled" : "") + '>Move</button></div>';
  }

  function renderHero(parts) {
    var s = ensureMoneyState();
    return '<section class="v1837-money-hero"><div><div class="section-label">🏦 Banking command center</div><h2>Money</h2><p>Checking, reserves, budget, credit, insurance, taxes, and accountant coverage stay here. Finance owns the full net-worth ledger; Investments owns stocks and funds.</p><div class="v1837-money-chip-row">' +
      '<span class="' + (n(s.money) >= 0 ? "gold" : "bad") + '">Checking ' + esc(compactMoney(s.money)) + '</span>' +
      '<span class="good">Reserve ' + esc(compactMoney(parts.reserve)) + '</span>' +
      '<span class="' + cls(parts.flow.checkingChange, true) + '">Cash direction ' + esc(signedMoney(parts.flow.checkingChange)) + '</span>' +
      '<span class="' + (parts.plan.coverage >= .9 ? "good" : parts.plan.coverage ? "gold" : "bad") + '">Health ' + Math.round(n(parts.plan.coverage) * 100) + '%</span>' +
      '<span class="' + (parts.debt ? "bad" : "good") + '">Debt watch ' + esc(compactMoney(parts.debt)) + '</span>' +
      '</div></div><strong>' + esc(compactMoney(parts.netWorth)) + '<span>net worth</span></strong></section>';
  }

  function renderPulse(parts) {
    var score = round(parts.f.creditScore || 650);
    var band = creditBand(score);
    var utilization = Math.round(Math.max(0, n(parts.f.creditCardDebt)) / Math.max(1, creditLimit()) * 100);
    var monthlyBurn = Math.max(1000, Math.round((Math.max(parts.flow.outflow, parts.flow.tax) || 12000) / 12));
    var runway = parts.reserve > 0 ? Math.min(999, Math.floor(parts.reserve / monthlyBurn)) : 0;
    return '<section class="panel v1837-money-pulse"><div class="section-label">💓 Live money pulse</div><div class="v1837-money-kpis">' +
      metric("Runway", runway + " mo", "Reserves after monthly bills and tax pressure.", runway >= 6 ? "good" : runway >= 2 ? "gold" : "bad") +
      metric("Credit", score + " " + band.label, "Utilization " + utilization + "%, unsecured balance " + compactMoney(parts.f.creditCardDebt) + ".", band.cls) +
      metric("Protection", Math.round(n(parts.plan.coverage) * 100) + "%", (parts.plan.name || "No Insurance") + ", premium " + compactMoney(parts.plan.premium || 0) + "/yr.", parts.plan.coverage >= .9 ? "good" : parts.plan.coverage ? "gold" : "bad") +
      metric("Invested", compactMoney(parts.invested), "Investments, managed capital, firm money.", parts.invested ? "blue" : "gold") +
      metric("Budget", parts.budget.name || "Budget", "Auto-save " + Math.round(n(parts.budget.autoSave) * 100) + "%, auto-invest " + Math.round(n(parts.budget.autoInvest) * 100) + "%.", n(parts.budget.autoInvest) > .05 ? "blue" : "gold") +
      metric("Tax map", compactMoney(parts.flow.tax), parts.residence.region + " effective " + pct(parts.residence.effective) + ".", parts.flow.tax ? "bad" : "good") +
      '</div></section>';
  }

  function renderChecking(parts) {
    var cash = n(parts.s.money);
    return '<section class="panel v1837-checking"><div class="v1837-panel-head"><div><div class="section-label">💵 Spendable cash</div><h3>Checking Account</h3><p>Bills, school, debt payoff, insurance premiums, taxes, and transfers pull from here first.</p></div><strong class="' + (cash >= 0 ? "gold" : "bad") + '">' + esc(compactMoney(cash)) + '</strong></div><div class="v1837-money-kpis compact">' +
      metric("Annual direction", signedMoney(parts.flow.checkingChange), "Projected checking change from income, costs, taxes, and transfers.", cls(parts.flow.checkingChange, true)) +
      metric("Cash in", compactMoney(parts.flow.income), "Salary, allowance, business income, and cash income.", "good") +
      metric("Cash out", compactMoney(parts.flow.outflow + parts.flow.tax), "Bills, taxes, insurance, interest, and normal costs.", parts.flow.outflow || parts.flow.tax ? "bad" : "good") +
      '</div></section>';
  }

  function renderAccounts(parts) {
    var s = parts.s;
    var f = parts.f;
    var rate = n(f.superSaverRate, .038);
    try { if (typeof superSaverRateForYear === "function") rate = n(superSaverRateForYear(), rate); } catch (e) {}
    return '<section class="panel v1837-bank"><div class="section-label">🏦 Bank planning</div><div class="v1837-account-grid">' +
      accountCard("Savings", compactMoney(s.savings), "Safe reserve. Lower yield, fast access, helps borrowing power.", [
        action("Add 25%", "moveMoneyPctV1837('checking','savings',.25)", "green", n(s.money) <= 0),
        action("Add 50%", "moveMoneyPctV1837('checking','savings',.5)", "green", n(s.money) <= 0),
        action("Take 25%", "moveMoneyPctV1837('savings','checking',.25)", "", n(s.savings) <= 0),
        action("Take All", "moveMoneyV1837('savings','checking','all')", "", n(s.savings) <= 0)
      ], customMove("v1837-save-custom", "checking", "savings", "Custom save $", n(s.money) <= 0) + customMove("v1837-save-take-custom", "savings", "checking", "Custom withdrawal $", n(s.savings) <= 0)) +
      accountCard("Super Saver", compactMoney(f.superSaver), "Higher-yield reserve. Current APY about " + pct(rate) + ".", [
        action("Add 25%", "moveMoneyPctV1837('checking','super',.25)", "green", n(s.money) <= 0),
        action("Add 50%", "moveMoneyPctV1837('checking','super',.5)", "green", n(s.money) <= 0),
        action("Take 25%", "moveMoneyPctV1837('super','checking',.25)", "", n(f.superSaver) <= 0),
        action("Take All", "moveMoneyV1837('super','checking','all')", "", n(f.superSaver) <= 0)
      ], customMove("v1837-super-custom", "checking", "super", "Custom super save $", n(s.money) <= 0) + customMove("v1837-super-take-custom", "super", "checking", "Custom super withdrawal $", n(f.superSaver) <= 0), "featured") +
      '</div></section>';
  }

  function accountCard(title, value, note, actions, customHtml, extraClass) {
    return '<div class="v1837-account ' + esc(extraClass || "") + '"><div><span>' + esc(title) + '</span><b>' + esc(value) + '</b><em>' + esc(note) + '</em></div><div class="v1837-action-row">' + actions.join("") + '</div>' + (customHtml || "") + '</div>';
  }

  function renderBudget(parts) {
    var active = parts.budget.id || "balanced";
    return '<section class="panel v1837-budget"><div class="section-label">📊 Budget style</div><div class="v1837-budget-row">' + budgetPlans().map(function (plan) {
      return '<button class="v1837-plan ' + (active === plan.id ? "selected" : "") + '" onclick="event.preventDefault();event.stopPropagation();setBudgetStyleV1837(\'' + esc(plan.id) + '\')"><b>' + esc(plan.name) + '</b><span>' + esc(plan.desc || "") + '</span><em>Save ' + Math.round(n(plan.autoSave) * 100) + "% · Invest " + Math.round(n(plan.autoInvest) * 100) + '%</em></button>';
    }).join("") + '</div></section>';
  }

  function renderCredit(parts) {
    var score = round(parts.f.creditScore || 650);
    var band = creditBand(score);
    var card = parts.f.securedCreditCardV1814 || {};
    var debt = Math.max(0, round(parts.f.creditCardDebt));
    var limit = creditLimit();
    var util = Math.round(debt / Math.max(1, limit) * 100);
    var scoreKind = score >= 670 ? "high" : score < 580 ? "low" : "";
    var utilKind = util >= 70 ? "low" : util < 30 ? "high" : "";
    return '<section class="panel v1837-credit"><div class="v1837-panel-head"><div><div class="section-label">💳 Credit builder</div><h3>' + score + ' ' + esc(band.label) + '</h3><p>Low utilization, autopay, secured-card deposits, and aging up with low debt should move the score upward.</p><div class="bar"><div class="fill ' + scoreKind + '" style="width:' + Math.round(score / 850 * 100) + '%"></div></div></div><strong class="' + band.cls + '">' + util + '%<span>utilization</span><div class="bar"><div class="fill ' + utilKind + '" style="width:' + Math.min(100, util) + '%"></div></div></strong></div><div class="v1837-money-kpis compact">' +
      metric("Card balance", compactMoney(debt), "Unsecured balance. Limit " + compactMoney(limit) + ".", debt ? "bad" : "good") +
      metric("Secured card", card.opened ? "Open" : "Not open", "Deposit " + compactMoney(card.deposit || 0) + ", limit " + compactMoney(card.limit || 0) + ".", card.opened ? "good" : "gold") +
      metric("Secured loans", compactMoney(parts.f.assetBackedLoan), "APR about " + pct(parts.f.assetBackedLoanRate || .052) + ".", parts.f.assetBackedLoan ? "bad" : "good") +
      '</div><div class="v1837-action-row">' +
      action("Use $500", "useCreditCardV1837(500)", "blue", n(parts.s.age) < 18) +
      action("Pay $500", "payCreditCardV1837(500)", "red", n(parts.s.money) < 500 || debt <= 0) +
      action("Pay Max", "payCreditCardV1837('all')", "red", n(parts.s.money) <= 0 || debt <= 0) +
      action("Open Secured Card", "openSecuredCardV1837()", "green", card.opened || n(parts.s.money) < 500 || n(parts.s.age) < 18) +
      action("Review Score", "reviewCreditV1837()", "blue", false) +
      '</div></section>';
  }

  function renderPersonalLine(parts) {
    var f = parts.f;
    var score = round(n(f.creditScore, 650));
    var limit = personalLineLimit();
    var line = f.personalLineV1860 || { balance: 0, rate: .12 };
    var bal = Math.max(0, round(line.balance));
    if (limit <= 0) {
      return '<section class="panel v1837-personal-line"><div class="section-label">💼 Personal Line of Credit</div><div class="v1837-money-kpis compact">' +
        metric("Status", "Locked", "Unlocks at a 720 credit score. Yours: " + score + ".", "bad") +
        metric("Why it matters", "Big lump-sum cash", "A score-gated line far larger than a credit card.", "gold") +
        '</div></section>';
    }
    var room = Math.max(0, limit - bal);
    var rate = n(line.rate, personalLineRate());
    return '<section class="panel v1837-personal-line"><div class="section-label">💼 Personal Line of Credit</div><div class="v1837-money-kpis compact">' +
      metric("Available", compactMoney(room), "Limit " + compactMoney(limit) + " at " + score + " score.", room ? "good" : "gold") +
      metric("Balance", compactMoney(bal), "APR about " + pct(rate) + ", accrues yearly.", bal ? "bad" : "good") +
      '</div><div class="v1837-action-row">' +
      action("Draw $25K", "drawPersonalLineV1860(25000)", "blue", n(parts.s.age) < 18 || room < 25000) +
      action("Draw Max", "drawPersonalLineV1860('max')", "blue", n(parts.s.age) < 18 || room <= 0) +
      action("Pay $25K", "payPersonalLineV1860(25000)", "red", n(parts.s.money) < 25000 || bal <= 0) +
      action("Pay Max", "payPersonalLineV1860('max')", "red", n(parts.s.money) <= 0 || bal <= 0) +
      '</div></section>';
  }

  function renderBorrowing(parts) {
    var room = securedRoom();
    var tranches = Array.isArray(parts.f.securedLoanTranchesV1813) ? parts.f.securedLoanTranchesV1813.filter(function (t) { return n(t.balance || t.amount) > 0; }) : [];
    return '<section class="panel v1837-borrowing"><div class="section-label">🔒 Secured borrowing</div><div class="v1837-money-kpis compact">' +
      metric("Borrowing room", compactMoney(room), "Reserve-backed loan room. Second active loan is reduced by 25%.", room ? "blue" : "gold") +
      metric("Active loans", tranches.length + "/2", "Two secured loan tranches maximum.", tranches.length >= 2 ? "bad" : tranches.length ? "gold" : "good") +
      metric("Loan balance", compactMoney(parts.f.assetBackedLoan), "Current APR about " + pct(parts.f.assetBackedLoanRate || .052) + ".", parts.f.assetBackedLoan ? "bad" : "good") +
      '</div><div class="v1837-action-row">' +
      action("Borrow 25%", "borrowSecuredPctV1837(.25)", "blue", n(parts.s.age) < 18 || room <= 0 || tranches.length >= 2) +
      action("Borrow Max", "borrowSecuredMaxV1837()", "blue", n(parts.s.age) < 18 || room <= 0 || tranches.length >= 2) +
      action("Repay $5K", "repaySecuredLoanV1837(5000)", "red", n(parts.s.money) < 5000 || n(parts.f.assetBackedLoan) <= 0) +
      action("Repay Max", "repaySecuredLoanV1837('all')", "red", n(parts.s.money) <= 0 || n(parts.f.assetBackedLoan) <= 0) +
      '</div></section>';
  }

  function renderInsurance(parts) {
    var current = parts.plan;
    var adult = n(parts.s.age) >= 18;
    var coveragePct = Math.round(n(current.coverage) * 100);
    var coverageKind = coveragePct >= 65 ? "high" : coveragePct < 35 ? "low" : "";
    return '<section class="panel v1837-insurance"><div class="section-label">🛡️ Health insurance</div><div class="v1837-insurance-current"><div><b>' + esc(current.name || "No Insurance") + '</b><span>' + coveragePct + '% coverage, premium ' + compactMoney(current.premium || 0) + '/yr, deductible ' + compactMoney(current.deductible || 0) + (adult ? "." : ". Family/custodial coverage before adulthood.") + '</span><div class="bar"><div class="fill ' + coverageKind + '" style="width:' + coveragePct + '%"></div></div></div><strong>' + coveragePct + '%</strong></div><div class="v1837-insurance-row">' + insurancePlans().map(function (plan) {
      var selected = current.id === plan.id;
      var premium = adult ? round(plan.premium || 0) : 0;
      var disabled = plan.id !== "none" && !selected && premium > 0 && n(parts.s.money) < premium;
      return '<button class="v1837-insurance-card ' + (selected ? "selected" : "") + '" title="' + esc((plan.desc || "") + " Premium " + compactMoney(plan.premium || 0) + ".") + '" onclick="event.preventDefault();event.stopPropagation();selectInsuranceV1837(\'' + esc(plan.id) + '\')" ' + (disabled ? "disabled" : "") + '><b>' + esc(plan.name) + '</b><span>' + esc(plan.desc || "") + '</span><em>' + Math.round(n(plan.coverage) * 100) + '% · ' + compactMoney(plan.premium || 0) + '/yr</em></button>';
    }).join("") + '</div></section>';
  }

  function renderTaxAccountant(parts) {
    var acc = parts.accountant;
    var active = accountantActive(acc);
    var taxDue = taxDebtValue();
    var grossTax = parts.flow.tax ? Math.round(parts.flow.tax / Math.max(.01, 1 - n(acc.reduction))) : 0;
    var saved = Math.max(0, round(grossTax * n(acc.reduction)));
    var fee = Math.max(0, round(saved * n(acc.feePct)));
    var status = parts.f.lastAccountantFileStatusV1837 || (active ? "Auto-file is ready on age-up." : "Hire an accountant to auto-file and pay taxes.");
    var negotiations = accountantNegotiationOptions();
    return '<section class="panel v1837-tax-accountant"><div class="section-label">🌍 Tax residency + accountant</div><div class="v1837-tax-grid">' +
      metric("Residence", parts.residence.country + " / " + parts.residence.region, "Sales/VAT " + pct(parts.residence.sales) + ", regional income " + pct(parts.residence.regionRate) + ".", "blue") +
      metric("Projected tax", compactMoney(parts.flow.tax), "Effective rate " + pct(parts.residence.effective) + ".", parts.flow.tax ? "bad" : "good") +
      metric("Accountant", acc.name || "No Accountant", "Saved " + compactMoney(saved) + ", fee " + compactMoney(fee) + ".", saved ? "good" : "gold") +
      metric("Tax autopay", taxDue > 0 ? compactMoney(taxDue) : "Clear", status, taxDue > 0 ? "bad" : (active ? "good" : "gold")) +
      '</div><div class="v1837-accountant-row">' + accountantPlans().map(function (plan) {
        var selected = (acc.id || "none") === plan.id;
        var disabled = plan.id !== "none" && !selected && n(parts.s.money) < n(plan.upfront);
        return '<button class="v1837-accountant-card ' + (selected ? "selected" : "") + '" onclick="event.preventDefault();event.stopPropagation();hireAccountantV1837(\'' + esc(plan.id) + '\')" ' + (disabled ? "disabled" : "") + '><b>' + esc(plan.name) + '</b><span>' + esc(plan.desc || "") + '</span><em>Upfront ' + compactMoney(plan.upfront) + ' · save ' + pct(plan.reduction) + ' · cut ' + pct(plan.feePct) + '</em></button>';
      }).join("") + '</div><div class="v1837-action-row">' +
      action("File / Pay Taxes", "accountantPayTaxesV1837(true)", "red", !active) +
      negotiations.map(function (option) {
        return action(option.label + " - " + compactMoney(option.cost), "negotiateAccountantFeeV1837(" + option.target + "," + option.cost + ")", "blue", !active || n(acc.feePct) <= option.target || n(parts.s.money) < option.cost);
      }).join("") +
      action("Open Legal", "openMoneyHubV1837('law')", "blue", false) +
      action("Open Finance", "openMoneyHubV1837('finance')", "blue", false) +
      '</div></section>';
  }

  function renderShortcuts(parts) {
    return '<section class="panel v1837-shortcuts"><div class="section-label">🧭 Where deeper controls live</div><div class="v1837-shortcut-grid">' +
      shortcut("Finance", "Net Worth Ledger", "Assets, debts, income sources, expenses, charts.", compactMoney(parts.netWorth), "finance") +
      shortcut("Investments", "Investment Desk", "Stocks, outside managers, personal firm, fund track.", compactMoney(parts.invested), "brokerage") +
      shortcut("Legal", "Law Office", "Tax debt, audit risk, accountant coverage.", compactMoney(parts.f.taxDebt || 0), "law") +
      shortcut("More", "Life systems", "Trusts, legacy tools, extra menus.", "Open", "more") +
      '</div></section>';
  }

  function shortcut(label, title, note, value, hub) {
    return '<button class="v1837-shortcut" onclick="event.preventDefault();event.stopPropagation();openMoneyHubV1837(\'' + esc(hub) + '\')"><span>' + esc(label) + '</span><b>' + esc(title) + '</b><em>' + esc(note) + '</em><strong>' + esc(value) + '</strong></button>';
  }

  function renderMoneyBanking() {
    var s = ensureMoneyState();
    var f = s.finance || {};
    var flow = cashFlow();
    var parts = {
      s: s,
      f: f,
      flow: flow,
      reserve: Math.max(0, round(n(s.savings) + n(f.superSaver))),
      invested: investedValue(),
      debt: totalDebts(),
      netWorth: netWorthFallback(),
      budget: currentBudget(),
      plan: currentInsurance(),
      accountant: currentAccountantPlan(),
      residence: residenceSummary(flow)
    };
    return '<div class="v1837-money-shell">' +
      renderHero(parts) +
      renderPulse(parts) +
      renderChecking(parts) +
      '<div class="v1837-money-grid">' +
      '<div class="v1837-money-col">' +
      renderAccounts(parts) +
      renderCredit(parts) +
      renderPersonalLine(parts) +
      renderBorrowing(parts) +
      '</div><div class="v1837-money-col">' +
      renderBudget(parts) +
      renderInsurance(parts) +
      renderTaxAccountant(parts) +
      renderShortcuts(parts) +
      '</div></div></div>';
  }

  var previousRenderMoney = window.renderMoney || (typeof renderMoney === "function" ? renderMoney : null);
  window.renderMoney = function () {
    try { return renderMoneyBanking(); }
    catch (e) {
      var s = ensureMoneyState();
      return '<div class="v1837-money-shell"><section class="v1837-money-hero"><div><div class="section-label">🔧 Money recovered</div><h2>Money</h2><p>The banking desk hit a recoverable error, so the major routes remain reachable.</p><div class="v1837-money-chip-row"><span>Checking ' + esc(compactMoney(s.money)) + '</span><span>Savings ' + esc(compactMoney(s.savings)) + '</span></div></div><strong>' + esc(compactMoney(netWorthFallback())) + '<span>net worth</span></strong></section><section class="panel"><div class="section-label">🩹 Safe fallback</div><p class="v1837-note">' + esc(e && (e.message || e)) + '</p><div class="v1837-action-row">' + action("Open Finance", "openMoneyHubV1837('finance')", "blue", false) + action("Open Investments", "openMoneyHubV1837('brokerage')", "blue", false) + '</div></section></div>';
    }
  };
  try { renderMoney = window.renderMoney; } catch (e2) {}

  var previousRenderHubContent = window.renderHubContent || (typeof renderHubContent === "function" ? renderHubContent : null);
  if (previousRenderHubContent && !window.__ledgerMoneyRenderV1837Wrapped) {
    window.__ledgerMoneyRenderV1837Wrapped = true;
    window.renderHubContent = function (hubId) {
      if (hubId === "money") return window.renderMoney();
      return previousRenderHubContent.apply(this, arguments);
    };
    try { renderHubContent = window.renderHubContent; } catch (e3) {}
  }

  var previousResolveLifeAndFinanceYear = window.resolveLifeAndFinanceYear || (typeof resolveLifeAndFinanceYear === "function" ? resolveLifeAndFinanceYear : null);
  if (previousResolveLifeAndFinanceYear && !window.__ledgerAccountantAutopayV1837Wrapped) {
    window.__ledgerAccountantAutopayV1837Wrapped = true;
    window.resolveLifeAndFinanceYear = function () {
      var result = previousResolveLifeAndFinanceYear.apply(this, arguments);
      try {
        var s = ensureMoneyState();
        if (n(s.age) >= 18 && accountantActive(currentAccountantPlan()) && n(s.finance.lastAccountantFiledAgeV1837) !== n(s.age)) {
          window.accountantPayTaxesV1837(false);
        }
      } catch (e4) {}
      try {
        var st = ensureMoneyState();
        var line = st.finance.personalLineV1860;
        if (line && n(line.balance) > 0 && n(st.age) >= 18 && n(st.finance.lastPersonalLineInterestAgeV1860) !== n(st.age)) {
          st.finance.lastPersonalLineInterestAgeV1860 = n(st.age);
          var interest = Math.max(10, round(n(line.balance) * n(line.rate, .12)));
          line.balance = round(n(line.balance) + interest);
          log("Personal line of credit accrued " + moneyText(interest) + " interest.", {});
        }
      } catch (e6) {}
      return result;
    };
    try { resolveLifeAndFinanceYear = window.resolveLifeAndFinanceYear; } catch (e5) {}
  }

  if (typeof document !== "undefined" && document.createElement && document.head) {
    var style = document.createElement("style");
    style.textContent = [
      ".hub-overlay.hub-money{height:100dvh!important;max-height:100dvh!important;align-items:stretch!important;overflow:hidden!important;padding:0!important}",
      ".hub-overlay.hub-money .hub-sheet-money{width:min(100vw,980px)!important;max-width:980px!important;height:100dvh!important;max-height:100dvh!important;min-height:0!important;display:flex!important;flex-direction:column!important;border-radius:0!important;margin:0 auto!important;overflow:hidden!important;background:radial-gradient(circle at 15% 0%,rgba(185,220,138,.10),transparent 24%),radial-gradient(circle at 88% 10%,rgba(126,160,172,.13),transparent 26%),linear-gradient(180deg,#15110d 0%,#0f0c09 70%,#0b0907 100%)!important}",
      ".hub-overlay.hub-money .hub-head{position:sticky!important;top:0!important;z-index:8!important;background:linear-gradient(180deg,rgba(18,14,10,1),rgba(18,14,10,.92))!important;box-shadow:0 1px 0 rgba(255,255,255,.05)}",
      ".hub-overlay.hub-money .v16-hub-body,.hub-overlay.hub-money .v11-hub-body,.hub-overlay.hub-money [data-hub-body='money']{flex:1 1 auto!important;min-height:0!important;overflow-x:hidden!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior:contain!important;padding-bottom:calc(132px + env(safe-area-inset-bottom,0px))!important}",
      ".v1837-money-shell{display:grid;gap:14px;padding:4px 0 calc(150px + env(safe-area-inset-bottom,0px));min-width:0;color:#f6ead8}.v1837-money-shell *{box-sizing:border-box}.v1837-money-shell .panel{min-width:0;overflow:hidden;border:1px solid rgba(216,173,109,.22);border-radius:12px;background:linear-gradient(135deg,rgba(36,30,23,.96),rgba(23,19,15,.96));padding:14px}.v1837-money-shell .section-label{color:#d8b16e;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;margin-bottom:9px}.v1837-note{margin:0;color:#d6c5aa;font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.5}",
      ".v1837-money-hero{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;border:1px solid rgba(185,220,138,.42);border-radius:16px;background:linear-gradient(135deg,rgba(26,51,34,.92),rgba(42,34,23,.95) 52%,rgba(24,39,45,.90));padding:18px;min-width:0;overflow:hidden}.v1837-money-hero h2{margin:2px 0 7px;color:#fff3df;font-size:32px;line-height:1}.v1837-money-hero p{max-width:680px;margin:0;color:#d6c5aa;font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.5}.v1837-money-hero strong{display:block;text-align:right;color:#b9dc8a;font-size:32px;line-height:1;white-space:nowrap}.v1837-money-hero strong span{display:block;margin-top:5px;color:#d8b16e;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase}.v1837-money-chip-row{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}.v1837-money-chip-row span{border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(255,255,255,.05);padding:6px 9px;color:#d6c5aa;font-family:'JetBrains Mono',monospace;font-size:10px}.v1837-money-chip-row span.good{color:#b9dc8a;border-color:rgba(185,220,138,.38)}.v1837-money-chip-row span.bad{color:#e9927d;border-color:rgba(233,146,125,.42)}.v1837-money-chip-row span.gold{color:#f0ca7b;border-color:rgba(240,202,123,.36)}",
      ".v1837-money-kpis{display:flex;gap:9px;overflow-x:auto;overflow-y:hidden;padding-bottom:10px;scrollbar-color:rgba(216,177,110,.75) rgba(255,255,255,.05);scrollbar-width:thin}.v1837-money-kpis.compact .v1837-money-metric{flex-basis:165px}.v1837-money-metric{flex:0 0 164px;border:1px solid rgba(255,255,255,.11);border-radius:12px;background:rgba(255,255,255,.045);padding:11px;min-height:95px;min-width:0}.v1837-money-metric span,.v1837-account span,.v1837-shortcut span,.v1837-tax-grid span{display:block;color:#d8b16e;font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase}.v1837-money-metric b,.v1837-account b,.v1837-shortcut b{display:block;color:#fff3df;font-size:18px;line-height:1.1;margin-top:5px;overflow-wrap:anywhere}.v1837-money-metric em,.v1837-account em,.v1837-shortcut em{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.4;font-style:normal;margin-top:6px}.v1837-money-metric.good b,.v1837-panel-head strong.good{color:#b9dc8a}.v1837-money-metric.bad b,.v1837-panel-head strong.bad{color:#e9927d}.v1837-money-metric.gold b,.v1837-panel-head strong.gold{color:#f0ca7b}.v1837-money-metric.blue b,.v1837-panel-head strong.blue{color:#9cc7d4}",
      ".v1837-money-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,.95fr);gap:12px;align-items:start}.v1837-money-col{display:grid;gap:12px;min-width:0}.v1837-panel-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:10px}.v1837-panel-head h3{margin:0 0 6px;color:#fff3df;font-size:22px;line-height:1.08}.v1837-panel-head p{margin:0;color:#d6c5aa;font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.45}.v1837-panel-head strong{font-family:'JetBrains Mono',monospace;font-size:27px;text-align:right;white-space:nowrap}.v1837-panel-head strong span{display:block;color:#d8b16e;font-size:9px;letter-spacing:.15em;text-transform:uppercase}",
      ".v1837-bank{border-color:rgba(185,220,138,.30)!important}.v1837-account-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.v1837-account{border:1px solid rgba(255,255,255,.11);border-radius:12px;background:rgba(255,255,255,.045);padding:12px;min-width:0}.v1837-account.featured{border-color:rgba(185,220,138,.34);background:linear-gradient(135deg,rgba(34,52,31,.72),rgba(26,22,17,.96))}.v1837-action-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.v1837-action-row .money-btn{white-space:normal!important;min-width:78px}.v1837-money-custom{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px;margin-top:8px}.v1837-money-custom input{min-width:0;border:1px solid rgba(216,173,109,.32);border-radius:8px;background:#100d0a;color:#f6ead8;padding:10px;font-family:'JetBrains Mono',monospace;font-size:11px}",
      ".v1837-checking{border-color:rgba(240,202,123,.30)!important;background:linear-gradient(135deg,rgba(58,42,22,.92),rgba(24,21,17,.96))!important}.v1837-credit{border-color:rgba(126,160,172,.34)!important;background:linear-gradient(135deg,rgba(21,39,42,.94),rgba(31,25,20,.96))!important}.v1837-borrowing{border-color:rgba(126,160,172,.26)!important}.v1837-insurance{border-color:rgba(126,160,172,.32)!important;background:linear-gradient(135deg,rgba(24,38,43,.92),rgba(25,21,17,.96))!important}.v1837-tax-accountant{border-color:rgba(240,202,123,.30)!important}.v1837-shortcuts{border-color:rgba(126,160,172,.34)!important;background:linear-gradient(135deg,rgba(21,39,42,.90),rgba(31,25,20,.96))!important}",
      ".v1837-budget-row,.v1837-insurance-row,.v1837-accountant-row{display:flex;gap:9px;overflow-x:auto;overflow-y:hidden;padding-bottom:10px;scrollbar-color:rgba(216,177,110,.75) rgba(255,255,255,.05);scrollbar-width:thin}.v1837-plan,.v1837-insurance-card,.v1837-accountant-card{flex:0 0 210px;border:1px solid rgba(255,255,255,.11);border-radius:12px;background:rgba(255,255,255,.045);color:#f6ead8;text-align:left;padding:12px;min-height:126px}.v1837-plan.selected,.v1837-insurance-card.selected,.v1837-accountant-card.selected{border-color:rgba(240,202,123,.58);box-shadow:inset 0 0 0 1px rgba(240,202,123,.14);background:linear-gradient(135deg,rgba(65,48,26,.75),rgba(25,21,17,.96))}.v1837-plan:disabled,.v1837-insurance-card:disabled,.v1837-accountant-card:disabled{opacity:.45}.v1837-plan b,.v1837-insurance-card b,.v1837-accountant-card b{display:block;color:#fff3df;font-size:16px;line-height:1.1}.v1837-plan span,.v1837-insurance-card span,.v1837-accountant-card span{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.4;margin-top:6px}.v1837-plan em,.v1837-insurance-card em,.v1837-accountant-card em{display:block;color:#d8b16e;font-family:'JetBrains Mono',monospace;font-size:9px;line-height:1.35;font-style:normal;margin-top:8px}",
      ".v1837-insurance-current{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;border:1px solid rgba(126,160,172,.26);border-radius:12px;padding:12px;margin-bottom:10px;background:rgba(126,160,172,.08)}.v1837-insurance-current b{display:block;color:#fff3df;font-size:18px}.v1837-insurance-current span{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.45;margin-top:4px}.v1837-insurance-current strong{font-family:'JetBrains Mono',monospace;color:#b9dc8a;font-size:25px;white-space:nowrap}",
      ".v1837-tax-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:9px;margin-bottom:10px}.v1837-tax-grid .v1837-money-metric{flex:auto}.v1837-shortcut-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}.v1837-shortcut{border:1px solid rgba(255,255,255,.11);border-radius:12px;background:rgba(255,255,255,.045);color:#f6ead8;text-align:left;padding:12px;min-width:0}.v1837-shortcut strong{display:block;margin-top:10px;color:#b9dc8a;font-family:'JetBrains Mono',monospace;font-size:16px;overflow-wrap:anywhere}",
      ".v1837-money-kpis::-webkit-scrollbar,.v1837-budget-row::-webkit-scrollbar,.v1837-insurance-row::-webkit-scrollbar,.v1837-accountant-row::-webkit-scrollbar{height:10px}.v1837-money-kpis::-webkit-scrollbar-thumb,.v1837-budget-row::-webkit-scrollbar-thumb,.v1837-insurance-row::-webkit-scrollbar-thumb,.v1837-accountant-row::-webkit-scrollbar-thumb{background:rgba(216,177,110,.72);border-radius:999px}.v1837-money-kpis::-webkit-scrollbar-track,.v1837-budget-row::-webkit-scrollbar-track,.v1837-insurance-row::-webkit-scrollbar-track,.v1837-accountant-row::-webkit-scrollbar-track{background:rgba(255,255,255,.05);border-radius:999px}",
      "@media(max-width:820px){.v1837-money-grid,.v1837-account-grid,.v1837-tax-grid{grid-template-columns:1fr}.v1837-money-hero,.v1837-panel-head{display:block}.v1837-money-hero strong,.v1837-panel-head strong{text-align:left;margin-top:12px}.v1837-money-custom{grid-template-columns:1fr}.v1837-plan,.v1837-insurance-card,.v1837-accountant-card{flex-basis:185px}.v1837-money-hero h2{font-size:28px}}"
    ].join("\n");
    document.head.appendChild(style);
  }

  if (window.registerLedgerSystem) {
    window.registerLedgerSystem({
      id: "money-banking",
      file: "pages/systems/money-banking.js",
      status: "active",
      globals: ["renderMoney", "moveMoneyV1837", "moveMoneyPctV1837", "moveMoneyCustomV1837", "setBudgetStyleV1837", "accountantPayTaxesV1837", "negotiateAccountantFeeV1837"],
      notes: "Money is now a clean banking command center: checking, savings, Super Saver, budget, credit, secured borrowing, insurance, accountant tax autopay/fee negotiation, and compact routes to Finance and Investments."
    });
  }
})();
