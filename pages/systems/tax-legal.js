/* Tax / legal system: Law Office, coverage, trusts, and protected family capital. */
(function () {
  if (window.__ledgerTaxLegalSystemV1839Loaded) return;
  window.__ledgerTaxLegalSystemV1839Loaded = true;

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

  function stateNow() {
    try { if (typeof state !== "undefined" && state) return state; } catch (e) {}
    return window.state || {};
  }

  function financeNow() {
    var s = stateNow();
    if (!s.finance || typeof s.finance !== "object" || Array.isArray(s.finance)) s.finance = {};
    return s.finance;
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

  function pct(value) {
    value = n(value);
    return (value * 100).toFixed(Math.abs(value) >= .1 ? 1 : 2).replace(/\.0+$/, "") + "%";
  }

  function signedMoney(value) {
    value = round(value);
    return (value >= 0 ? "+" : "-") + compactMoney(Math.abs(value));
  }

  function toast(message) {
    try { if (typeof addToast === "function") return addToast(message); } catch (e) {}
    try { if (typeof addLog === "function") return addLog(message, {}); } catch (e2) {}
  }

  function log(message, deltas) {
    try { if (typeof addLog === "function") return addLog(message, deltas || {}); } catch (e) {}
    return toast(message);
  }

  function saveRender() {
    try { if (typeof save === "function") save(); } catch (e) {}
    try {
      if (typeof window.renderHubInPlaceV16 === "function") return window.renderHubInPlaceV16("law");
    } catch (e2) {}
    try { if (typeof render === "function") render(); } catch (e3) {}
  }

  function readAmount(id, max) {
    var raw = "";
    try {
      var el = document.getElementById(id);
      raw = el ? String(el.value || "") : "";
    } catch (e) {}
    var value = round(raw.replace(/[^0-9.]/g, ""));
    max = Math.max(0, round(max));
    if (!value) return 0;
    return Math.max(0, Math.min(value, max));
  }

  function accountantPlans() {
    return [
      { id: "none", name: "No Accountant", cost: 0, reduction: 0, feePct: 0, audit: 0, desc: "You file alone. Free, but no filing defense or savings." },
      { id: "bookkeeper", name: "Bookkeeper", cost: 250, reduction: .05, feePct: .12, audit: 4, desc: "Basic records, normal deductions, and small tax savings." },
      { id: "local_tax", name: "Local Tax Preparer", cost: 650, reduction: .055, feePct: .10, audit: 7, desc: "Handles jobs, state taxes, and small side income." },
      { id: "cpa", name: "CPA Advisor", cost: 5000, reduction: .075, feePct: .06, audit: 12, desc: "Better planning for investments, businesses, and audits." },
      { id: "elite", name: "Elite Tax Counsel", cost: 50000, reduction: .10, feePct: .035, audit: 20, desc: "High-net-worth planning, audit defense, and entity tax strategy." },
      { id: "family_office_tax", name: "Family Office Tax", cost: 250000, reduction: .13, feePct: .02, audit: 26, desc: "Trust, fund, business, and family-office tax coordination." }
    ];
  }

  function attorneyPlans() {
    return [
      { id: "none", name: "No Attorney", cost: 0, risk: 0, trust: 0, desc: "No dedicated legal help." },
      { id: "local", name: "Local Attorney", cost: 2500, risk: 8, trust: 2, desc: "Basic contracts, letters, and ordinary disputes." },
      { id: "business", name: "Business Counsel", cost: 15000, risk: 16, trust: 6, desc: "Companies, investors, employment issues, and contracts." },
      { id: "wealth", name: "Wealth + Trust Counsel", cost: 60000, risk: 22, trust: 12, desc: "Estate documents, trusts, asset protection, and tax coordination." },
      { id: "elite", name: "Elite Legal Team", cost: 150000, risk: 32, trust: 18, desc: "Audit defense, lawsuits, business protection, and wealth structures." },
      { id: "family_office", name: "Family Office Counsel", cost: 750000, risk: 42, trust: 28, desc: "Full counsel for trusts, funds, family governance, and complex estates." }
    ];
  }

  function trustPlans() {
    return [
      { id: "starter", name: "Revocable Starter Trust", cost: 2500, protection: .18, feeRate: .0015, taxDrag: .01, desc: "Simple estate continuity. Easy to use, lighter protection." },
      { id: "asset", name: "Asset Protection Trust", cost: 25000, protection: .42, feeRate: .0035, taxDrag: .008, desc: "Protects more family capital from lawsuits and messy claims." },
      { id: "dynasty", name: "Dynasty Family Trust", cost: 250000, protection: .68, feeRate: .005, taxDrag: .006, desc: "Long-game legacy structure for heirs and protected assets." },
      { id: "family_office", name: "Family Office Trust", cost: 1000000, protection: .82, feeRate: .0075, taxDrag: .004, desc: "High-control trust with family fund governance and better planning." }
    ];
  }

  function byId(list, id) {
    return list.find(function (item) { return item.id === id; }) || list[0];
  }

  function currentAccountant() {
    var acc = financeNow().accountant || {};
    var id = typeof acc === "string" ? acc : (acc.id || "none");
    return Object.assign({}, byId(accountantPlans(), id), typeof acc === "object" ? acc : {});
  }

  function currentAttorney() {
    var atty = financeNow().attorney || {};
    var id = typeof atty === "string" ? atty : (atty.id || "none");
    return Object.assign({}, byId(attorneyPlans(), id), typeof atty === "object" ? atty : {});
  }

  function ensureLegalState() {
    var s = stateNow();
    if (!s.stats || typeof s.stats !== "object") s.stats = {};
    if (!s.relationships || typeof s.relationships !== "object") s.relationships = {};
    var f = financeNow();
    if (!f.debts || typeof f.debts !== "object" || Array.isArray(f.debts)) f.debts = {};
    if (!f.externalManager || typeof f.externalManager !== "object" || Array.isArray(f.externalManager)) f.externalManager = { id: null, capital: 0, lastReturn: 0, lastFee: 0 };
    if (!f.managerFirmsV1829 || typeof f.managerFirmsV1829 !== "object" || Array.isArray(f.managerFirmsV1829)) f.managerFirmsV1829 = { capital: 0 };
    if (!f.trustFunds || typeof f.trustFunds !== "object" || Array.isArray(f.trustFunds)) f.trustFunds = {};
    if (!f.familyTrustV1839 || typeof f.familyTrustV1839 !== "object" || Array.isArray(f.familyTrustV1839)) {
      f.familyTrustV1839 = {
        created: false,
        plan: "starter",
        corpus: 0,
        sourceLedger: {},
        trustee: "self",
        beneficiaries: [],
        familyFund: { active: false, capital: 0, risk: "balanced", lastReturn: 0, lastFee: 0, years: 0 },
        history: []
      };
    }
    var trust = f.familyTrustV1839;
    if (!trust.sourceLedger || typeof trust.sourceLedger !== "object") trust.sourceLedger = {};
    if (!trust.familyFund || typeof trust.familyFund !== "object") trust.familyFund = { active: false, capital: 0, risk: "balanced", lastReturn: 0, lastFee: 0, years: 0 };
    if (!Array.isArray(trust.history)) trust.history = [];
    if (!Array.isArray(trust.beneficiaries)) trust.beneficiaries = [];
    if (f.taxDebt == null) f.taxDebt = Math.max(0, n(f.debts.taxDebt || s.taxDebt));
    f.debts.taxDebt = Math.max(0, round(f.taxDebt));
    s.taxDebt = Math.max(0, round(f.taxDebt));
    if (f.taxLegalRisk == null) f.taxLegalRisk = 0;
    return s;
  }

  function taxDebt() {
    var s = ensureLegalState();
    var f = s.finance;
    return Math.max(0, round(f.taxDebt != null ? f.taxDebt : (f.debts || {}).taxDebt || s.taxDebt));
  }

  function setTaxDebt(value) {
    var s = ensureLegalState();
    value = Math.max(0, round(value));
    s.finance.taxDebt = value;
    s.finance.debts.taxDebt = value;
    s.taxDebt = value;
    if (s.tax && typeof s.tax === "object") s.tax.taxDebt = value;
  }

  function trustPlan() {
    var trust = financeNow().familyTrustV1839 || {};
    return byId(trustPlans(), trust.plan || "starter");
  }

  function childTrustTotal() {
    var funds = financeNow().trustFunds || {};
    return Object.keys(funds).reduce(function (sum, key) {
      return sum + Math.max(0, round(funds[key]));
    }, 0);
  }

  function protectedAssets() {
    var f = financeNow();
    var trust = f.familyTrustV1839 || {};
    return Math.max(0, round(n(trust.corpus) + childTrustTotal()));
  }

  function legalRisk() {
    var f = financeNow();
    var acc = currentAccountant();
    var atty = currentAttorney();
    var trust = f.familyTrustV1839 || {};
    var plan = trustPlan();
    var base = Math.max(0, n(f.taxLegalRisk) + (taxDebt() > 0 ? Math.min(40, taxDebt() / 250000) : 0));
    var help = n(acc.audit) + n(atty.risk) + (trust.created ? Math.round(plan.protection * 24) : 0);
    return Math.max(0, Math.min(100, round(base - help)));
  }

  function sourceBalances() {
    var s = ensureLegalState();
    var f = s.finance || {};
    return {
      checking: Math.max(0, round(s.money)),
      brokerage: Math.max(0, round(n(f.brokerage) + n(f.brokerageCash))),
      personalFirm: Math.max(0, round(n(f.managedPortfolio) + n(f.personalFirm && f.personalFirm.cash) + n(f.firmCashV1828))),
      outsideManager: Math.max(0, round(n(f.externalManager && f.externalManager.capital) + n(f.managerFirmsV1829 && f.managerFirmsV1829.capital)))
    };
  }

  function takeSource(source, amount) {
    var s = ensureLegalState();
    var f = s.finance || {};
    amount = Math.max(0, round(amount));
    var remaining = amount;
    function pull(obj, key) {
      if (!obj || !key || remaining <= 0) return 0;
      var have = Math.max(0, round(obj[key]));
      var take = Math.min(have, remaining);
      if (take > 0) {
        obj[key] = have - take;
        remaining -= take;
      }
      return take;
    }
    if (source === "checking") pull(s, "money");
    if (source === "brokerage") {
      pull(f, "brokerage");
      pull(f, "brokerageCash");
    }
    if (source === "personalFirm") {
      pull(f, "managedPortfolio");
      if (f.personalFirm) pull(f.personalFirm, "cash");
      pull(f, "firmCashV1828");
    }
    if (source === "outsideManager") {
      if (f.externalManager) pull(f.externalManager, "capital");
      if (f.managerFirmsV1829) pull(f.managerFirmsV1829, "capital");
    }
    return amount - remaining;
  }

  function sourceName(source) {
    return ({
      checking: "checking",
      brokerage: "investment cash",
      personalFirm: "personal firm",
      outsideManager: "outside manager"
    })[source] || source;
  }

  function amountFromMode(mode, inputId, max) {
    max = Math.max(0, round(max));
    if (mode === "max") return max;
    if (mode === "quarter") return Math.round(max * .25);
    if (mode === "half") return Math.round(max * .5);
    if (mode === "custom") return readAmount(inputId, max);
    return Math.min(max, Math.max(0, round(mode)));
  }

  function riskSpec() {
    var trust = financeNow().familyTrustV1839 || {};
    var risk = (trust.familyFund || {}).risk || "balanced";
    return {
      conservative: { rate: .04, vol: .015, label: "Conservative" },
      balanced: { rate: .07, vol: .045, label: "Balanced" },
      growth: { rate: .105, vol: .09, label: "Growth" }
    }[risk] || { rate: .07, vol: .045, label: "Balanced" };
  }

  window.hireAccountantV1839 = function (id) {
    var s = ensureLegalState();
    var plan = byId(accountantPlans(), id || "none");
    if (plan.cost > Math.max(0, n(s.money))) return toast(plan.name + " needs " + compactMoney(plan.cost) + " in checking.");
    s.money = round(n(s.money) - plan.cost);
    s.finance.accountant = { id: plan.id, name: plan.name, upfront: plan.cost, reduction: plan.reduction, feePct: plan.feePct, audit: plan.audit, desc: plan.desc, autoFile: plan.id !== "none" };
    s.finance.taxLegalRisk = Math.max(0, round(n(s.finance.taxLegalRisk) - plan.audit));
    log("Hired " + plan.name + " for tax filing and planning.", { money: -plan.cost });
    saveRender();
  };

  window.hireAttorneyV1839 = function (id) {
    var s = ensureLegalState();
    var plan = byId(attorneyPlans(), id || "none");
    if (plan.cost > Math.max(0, n(s.money))) return toast(plan.name + " needs " + compactMoney(plan.cost) + " in checking.");
    s.money = round(n(s.money) - plan.cost);
    s.finance.attorney = { id: plan.id, name: plan.name, cost: plan.cost, riskReduction: plan.risk, trustHelp: plan.trust, desc: plan.desc };
    s.finance.taxLegalRisk = Math.max(0, round(n(s.finance.taxLegalRisk) - plan.risk));
    log("Hired " + plan.name + " for legal coverage.", { money: -plan.cost });
    saveRender();
  };

  window.payTaxDebtV1839 = function (amount) {
    var s = ensureLegalState();
    var debt = taxDebt();
    var cash = Math.max(0, round(s.money));
    if (!debt) return toast("No tax debt to pay.");
    if (!cash) return toast("Checking has no spendable cash for tax payoff.");
    var paid = amount === "max" ? Math.min(cash, debt) : Math.min(cash, debt, Math.max(0, round(amount)));
    if (!paid) return toast("Choose a tax payoff amount.");
    s.money = round(n(s.money) - paid);
    setTaxDebt(debt - paid);
    s.finance.taxLegalRisk = Math.max(0, round(n(s.finance.taxLegalRisk) - Math.max(1, paid / Math.max(1, debt) * 30)));
    log("Paid " + compactMoney(paid) + " toward tax debt.", { money: -paid, taxDebt: -paid });
    saveRender();
  };

  window.payCustomTaxDebtV1839 = function (id) {
    var max = Math.min(Math.max(0, round(stateNow().money)), taxDebt());
    var amount = readAmount(id || "v1839-tax-custom", max);
    if (!amount) return toast("Enter a custom tax payoff amount.");
    window.payTaxDebtV1839(amount);
  };

  window.fileTaxesLegalV1839 = function () {
    ensureLegalState();
    var acc = currentAccountant();
    if (!acc.id || acc.id === "none") return toast("Hire an accountant before using automatic filing.");
    if (typeof window.accountantPayTaxesV1837 === "function") {
      try {
        window.accountantPayTaxesV1837(true);
        return;
      } catch (e) {}
    }
    window.payTaxDebtV1839("max");
  };

  window.createFamilyTrustV1839 = function (planId) {
    var s = ensureLegalState();
    var plan = byId(trustPlans(), planId || "starter");
    var trust = s.finance.familyTrustV1839;
    var current = trust.created ? trustPlan() : { cost: 0, protection: 0 };
    var upgradeCost = trust.created ? Math.max(0, plan.cost - current.cost) : plan.cost;
    if (upgradeCost > Math.max(0, n(s.money))) return toast(plan.name + " needs " + compactMoney(upgradeCost) + " in checking.");
    s.money = round(n(s.money) - upgradeCost);
    trust.created = true;
    trust.plan = plan.id;
    trust.createdAge = trust.createdAge == null ? round(s.age) : trust.createdAge;
    trust.protection = plan.protection;
    trust.annualFeeRate = plan.feeRate;
    trust.taxDrag = plan.taxDrag;
    trust.trustee = plan.id === "family_office" ? "family office counsel" : "self";
    trust.history.unshift({ age: round(s.age), event: (current.cost ? "Upgraded" : "Created") + " " + plan.name, amount: -upgradeCost });
    trust.history = trust.history.slice(0, 8);
    log((current.cost ? "Upgraded" : "Created") + " the family trust: " + plan.name + ".", { money: -upgradeCost });
    saveRender();
  };

  window.fundFamilyTrustV1839 = function (source, mode, inputId) {
    var s = ensureLegalState();
    var trust = s.finance.familyTrustV1839;
    if (!trust.created) return toast("Create a family trust first.");
    var balances = sourceBalances();
    var max = Math.max(0, balances[source] || 0);
    var amount = amountFromMode(mode, inputId, max);
    if (!amount) return toast("No " + sourceName(source) + " available for the trust.");
    var moved = takeSource(source, amount);
    if (!moved) return toast("No " + sourceName(source) + " moved.");
    trust.corpus = Math.max(0, round(n(trust.corpus) + moved));
    trust.sourceLedger[source] = Math.max(0, round(n(trust.sourceLedger[source]) + moved));
    trust.history.unshift({ age: round(s.age), event: "Funded from " + sourceName(source), amount: moved });
    trust.history = trust.history.slice(0, 8);
    log("Moved " + compactMoney(moved) + " from " + sourceName(source) + " into the family trust.", { money: source === "checking" ? -moved : 0 });
    saveRender();
  };

  window.addPersonalFirmToFamilyTrustV1839 = function (mode, inputId) {
    return window.fundFamilyTrustV1839("personalFirm", mode || "max", inputId || "v1839-trust-custom-personalFirm");
  };

  window.distributeFamilyTrustV1839 = function (mode, inputId) {
    var s = ensureLegalState();
    var trust = s.finance.familyTrustV1839;
    if (!trust.created || !n(trust.corpus)) return toast("No family trust corpus available.");
    var liquidLimit = Math.max(0, round(n(trust.corpus) * (trust.plan === "starter" ? .5 : .1)));
    var amount = amountFromMode(mode, inputId, liquidLimit);
    if (!amount) return toast("Choose a trust distribution amount.");
    trust.corpus = Math.max(0, round(n(trust.corpus) - amount));
    if (trust.familyFund) trust.familyFund.capital = Math.min(round(n(trust.familyFund.capital)), trust.corpus);
    s.money = round(n(s.money) + amount);
    trust.history.unshift({ age: round(s.age), event: "Distributed to checking", amount: -amount });
    trust.history = trust.history.slice(0, 8);
    log("Distributed " + compactMoney(amount) + " from the family trust to checking.", { money: amount });
    saveRender();
  };

  window.allocateFamilyFundV1839 = function (mode, inputId) {
    var s = ensureLegalState();
    var trust = s.finance.familyTrustV1839;
    if (!trust.created) return toast("Create a family trust first.");
    if (!n(trust.corpus)) return toast("Fund the trust before starting a family fund.");
    var fund = trust.familyFund;
    var room = Math.max(0, round(n(trust.corpus) - n(fund.capital)));
    var amount = amountFromMode(mode, inputId, room);
    if (!amount && !fund.active) amount = Math.min(room, 250000);
    if (!amount) return toast("No unallocated trust corpus is available.");
    fund.active = true;
    fund.capital = Math.min(round(n(trust.corpus)), round(n(fund.capital) + amount));
    fund.startedAge = fund.startedAge == null ? round(s.age) : fund.startedAge;
    trust.history.unshift({ age: round(s.age), event: "Allocated to family fund", amount: amount });
    trust.history = trust.history.slice(0, 8);
    log("Allocated " + compactMoney(amount) + " of trust corpus to the family fund sleeve.", {});
    saveRender();
  };

  window.setFamilyFundRiskV1839 = function (risk) {
    var trust = ensureLegalState().finance.familyTrustV1839;
    trust.familyFund.risk = ["conservative", "balanced", "growth"].indexOf(risk) >= 0 ? risk : "balanced";
    log("Family fund mandate set to " + riskSpec().label + ".", {});
    saveRender();
  };

  window.resolveFamilyTrustYearV1839 = function (manual) {
    var s = ensureLegalState();
    var trust = s.finance.familyTrustV1839;
    if (!trust.created || !round(trust.corpus)) return manual ? toast("No family trust corpus to resolve.") : null;
    if (!manual && trust.lastResolvedAge === round(s.age)) return null;
    var plan = trustPlan();
    var fund = trust.familyFund || {};
    var spec = riskSpec();
    var baseCapital = Math.max(0, round(fund.active ? fund.capital : trust.corpus));
    var random = (typeof Math.random === "function" ? Math.random() : .55) - .45;
    var grossRate = fund.active ? spec.rate + random * spec.vol : .035;
    var gross = round(baseCapital * grossRate);
    var fee = Math.max(0, round(trust.corpus * n(plan.feeRate)));
    var taxDrag = Math.max(0, round(Math.max(0, gross) * n(plan.taxDrag)));
    var net = gross - fee - taxDrag;
    trust.corpus = Math.max(0, round(n(trust.corpus) + net));
    if (fund.active) {
      fund.capital = Math.max(0, Math.min(round(n(fund.capital) + net), trust.corpus));
      fund.lastReturn = net;
      fund.lastFee = fee + taxDrag;
      fund.years = round(n(fund.years) + 1);
    }
    trust.lastReturn = net;
    trust.lastFee = fee + taxDrag;
    trust.lastResolvedAge = round(s.age);
    trust.history.unshift({ age: round(s.age), event: "Annual trust return", amount: net });
    trust.history = trust.history.slice(0, 8);
    log("Family trust annual result: " + signedMoney(net) + " after fees and tax drag.", {});
    if (manual) saveRender();
    return net;
  };

  window.grantChildFromFamilyTrustV1839 = function (childKey, amount) {
    var s = ensureLegalState();
    var child = s.relationships && s.relationships[childKey];
    if (!child || child.role !== "Child") return toast("Child trust not found.");
    var trust = s.finance.familyTrustV1839;
    if (!trust.created || !round(trust.corpus)) return toast("No family trust corpus available.");
    var grant = amount === "max" ? Math.min(round(trust.corpus), 50000) : Math.min(round(trust.corpus), Math.max(0, round(amount)));
    if (!grant) return toast("Choose a grant amount.");
    trust.corpus = Math.max(0, round(trust.corpus - grant));
    s.finance.trustFunds[childKey] = Math.max(0, round(n(s.finance.trustFunds[childKey]) + grant));
    trust.history.unshift({ age: round(s.age), event: "Granted to " + child.name, amount: -grant });
    trust.history = trust.history.slice(0, 8);
    log("Granted " + compactMoney(grant) + " from the family trust to " + child.name + "'s child trust.", {});
    saveRender();
  };

  window.handleLegalMatterV1839 = function (kind) {
    var s = ensureLegalState();
    var atty = currentAttorney();
    var specs = {
      audit: { cost: 5000, risk: 10, label: "audit defense" },
      contracts: { cost: 2500, risk: 5, label: "contract review" },
      dispute: { cost: 25000, risk: 16, label: "legal dispute" }
    };
    var spec = specs[kind] || specs.contracts;
    var discount = atty.id && atty.id !== "none" ? .45 : 1;
    var cost = Math.round(spec.cost * discount);
    if (cost > Math.max(0, n(s.money))) return toast("The " + spec.label + " needs " + compactMoney(cost) + " in checking.");
    s.money = round(n(s.money) - cost);
    s.finance.taxLegalRisk = Math.max(0, round(n(s.finance.taxLegalRisk) - spec.risk - n(atty.risk) * .25));
    log("Handled " + spec.label + " with legal coverage.", { money: -cost });
    saveRender();
  };

  function button(label, action, kind, disabled) {
    return '<button class="money-btn ' + esc(kind || "") + '" onclick="event.preventDefault();event.stopPropagation();' + action + '" ' + (disabled ? "disabled" : "") + '>' + esc(label) + '</button>';
  }

  function metric(label, value, note, kind) {
    return '<div class="v1839-metric ' + esc(kind || "") + '"><span>' + esc(label) + '</span><b>' + esc(value) + '</b><em>' + esc(note || "") + '</em></div>';
  }

  function customRow(id, max, actionCode, label, kind, disabled) {
    return '<div class="v1839-custom-row"><input id="' + esc(id) + '" inputmode="numeric" placeholder="$ custom"><span>Max ' + esc(compactMoney(max)) + '</span>' + button(label || "Move", actionCode, kind || "green", disabled || max <= 0) + '</div>';
  }

  function hero() {
    var f = financeNow();
    var trust = f.familyTrustV1839 || {};
    var plan = trustPlan();
    var risk = legalRisk();
    return '<section class="v1839-hero"><div><div class="section-label">⚖️ Legal command center</div><h2>Law Office</h2><p>Tax debt, accountants, attorneys, lawsuits, and contracts. Trusts &amp; succession have their own Family Trust page (linked below).</p><div class="v1839-chip-row"><span class="' + (risk <= 20 ? "good" : risk >= 55 ? "bad" : "gold") + '">Risk ' + risk + '/100</span><span>Protected ' + compactMoney(protectedAssets()) + '</span><span>Trust ' + esc(trust.created ? plan.name : "not created") + '</span><span>Tax debt ' + compactMoney(taxDebt()) + '</span></div></div><strong class="' + (risk <= 20 ? "good" : risk >= 55 ? "bad" : "gold") + '">' + risk + '<span>risk / 100</span></strong></section>';
  }

  function counters() {
    var acc = currentAccountant();
    var atty = currentAttorney();
    var trust = financeNow().familyTrustV1839 || {};
    var plan = trustPlan();
    return '<section class="panel v1839-counters"><div class="section-label">📊 Legal counters</div><div class="v1839-metric-grid">' +
      metric("Tax debt", compactMoney(taxDebt()), "Unpaid tax balance.", taxDebt() ? "bad" : "good") +
      metric("Accountant", acc.id === "none" ? "No coverage" : acc.name, "Auto-file " + (acc.id === "none" ? "off" : "on") + ", save " + pct(acc.reduction || 0) + ".", acc.id === "none" ? "bad" : "good") +
      metric("Attorney", atty.id === "none" ? "No coverage" : atty.name, "Risk help " + round(atty.risk || atty.riskReduction || 0) + ".", atty.id === "none" ? "gold" : "good") +
      metric("Family trust", compactMoney(trust.corpus || 0), (trust.created ? pct(plan.protection) + " protection profile." : "Create one before moving assets."), trust.created ? "good" : "gold") +
      metric("Child trusts", compactMoney(childTrustTotal()), "Heir-specific trust balances.", childTrustTotal() ? "good" : "gold") +
      metric("Family fund", compactMoney((trust.familyFund || {}).capital || 0), (trust.familyFund || {}).active ? riskSpec().label + " mandate." : "Inactive trust sleeve.", (trust.familyFund || {}).active ? "good" : "gold") +
      '</div></section>';
  }

  function taxDesk() {
    var debt = taxDebt();
    var cash = Math.max(0, round(stateNow().money));
    return '<section class="panel v1839-tax-desk"><div class="v1839-panel-head"><div><div class="section-label">💸 Tax payoff</div><h3>Tax balance desk</h3><p>Payments come from checking. Accountants can file and pay automatically when hired.</p></div><strong class="' + (debt ? "bad" : "good") + '">' + compactMoney(debt) + '<span>tax debt</span></strong></div><div class="v1839-action-row">' +
      button("Pay $10K", "payTaxDebtV1839(10000)", "red", !debt || cash < 10000) +
      button("Pay $100K", "payTaxDebtV1839(100000)", "red", !debt || cash < 100000) +
      button("Pay $1M", "payTaxDebtV1839(1000000)", "red", !debt || cash < 1000000) +
      button("Pay Max", "payTaxDebtV1839('max')", "red", !debt || !cash) +
      button("Accountant File / Pay", "fileTaxesLegalV1839()", "blue", currentAccountant().id === "none") +
      '</div>' + customRow("v1839-tax-custom", Math.min(cash, debt), "payCustomTaxDebtV1839('v1839-tax-custom')", "Pay Custom", "red", !debt || !cash) + '</section>';
  }

  function coverageDesk() {
    var acc = currentAccountant();
    var atty = currentAttorney();
    var cash = Math.max(0, round(stateNow().money));
    var accCards = accountantPlans().map(function (plan) {
      var selected = acc.id === plan.id;
      return '<button class="v1839-coverage-card ' + (selected ? "selected" : "") + '" onclick="event.preventDefault();event.stopPropagation();hireAccountantV1839(\'' + esc(plan.id) + '\')" ' + (cash < plan.cost ? "disabled" : "") + '><span>Accountant</span><b>' + esc(plan.name) + '</b><em>' + esc(plan.desc) + '</em><strong>Cost ' + compactMoney(plan.cost) + ' / save ' + pct(plan.reduction) + '</strong></button>';
    }).join("");
    var attyCards = attorneyPlans().map(function (plan) {
      var selected = atty.id === plan.id;
      return '<button class="v1839-coverage-card ' + (selected ? "selected" : "") + '" onclick="event.preventDefault();event.stopPropagation();hireAttorneyV1839(\'' + esc(plan.id) + '\')" ' + (cash < plan.cost ? "disabled" : "") + '><span>Attorney</span><b>' + esc(plan.name) + '</b><em>' + esc(plan.desc) + '</em><strong>Cost ' + compactMoney(plan.cost) + ' / risk help ' + round(plan.risk) + '</strong></button>';
    }).join("");
    return '<section class="panel v1839-coverage"><div class="v1839-panel-head"><div><div class="section-label">🛡️ Coverage deck</div><h3>Accountants + attorneys</h3><p>Accountants file and reduce tax drag. Attorneys handle cases, contracts, lawsuits, and trust protection.</p></div></div><div class="v1839-rail">' + accCards + '</div><div class="v1839-rail">' + attyCards + '</div></section>';
  }

  function trustPlanDesk() {
    var s = stateNow();
    var trust = financeNow().familyTrustV1839 || {};
    var current = trust.created ? trustPlan() : { id: "none", cost: 0 };
    var cards = trustPlans().map(function (plan) {
      var selected = trust.created && current.id === plan.id;
      var upgradeCost = trust.created ? Math.max(0, plan.cost - current.cost) : plan.cost;
      return '<button class="v1839-trust-plan ' + (selected ? "selected" : "") + '" onclick="event.preventDefault();event.stopPropagation();createFamilyTrustV1839(\'' + esc(plan.id) + '\')" ' + (upgradeCost > Math.max(0, n(s.money)) ? "disabled" : "") + '><span>' + (selected ? "Current" : trust.created ? "Upgrade" : "Create") + '</span><b>' + esc(plan.name) + '</b><em>' + esc(plan.desc) + '</em><strong>' + compactMoney(upgradeCost) + ' now / protection ' + pct(plan.protection) + '</strong></button>';
    }).join("");
    return '<section class="panel v1839-trust-plans"><div class="v1839-panel-head"><div><div class="section-label">🏛️ Step 1: Set up your trust</div><h3>Family trust setup</h3><p>Pick the legal shell before moving serious capital. Stronger plans cost more but protect more and reduce trust tax drag.</p></div></div><div class="v1839-rail">' + cards + '</div></section>';
  }

  function trustFundingDesk() {
    var s = ensureLegalState();
    var trust = s.finance.familyTrustV1839;
    var balances = sourceBalances();
    var sources = [
      { id: "checking", title: "Checking", note: "Spendable cash into the trust." },
      { id: "brokerage", title: "Investment cash", note: "Uninvested brokerage cash into trust custody." },
      { id: "personalFirm", title: "Personal firm capital", note: "Move your own firm/fund capital under family trust protection." },
      { id: "outsideManager", title: "Outside manager capital", note: "Move externally managed capital into the family trust." }
    ];
    var cards = sources.map(function (src) {
      var max = balances[src.id] || 0;
      return '<div class="v1839-source-card"><span>' + esc(src.title) + '</span><b>' + compactMoney(max) + '</b><em>' + esc(src.note) + '</em><div class="v1839-mini-actions">' +
        button("Add 25%", "fundFamilyTrustV1839('" + esc(src.id) + "','quarter')", "green", !trust.created || max <= 0) +
        button("Add Max", "fundFamilyTrustV1839('" + esc(src.id) + "','max')", "gold", !trust.created || max <= 0) +
        '</div>' + customRow("v1839-trust-custom-" + src.id, max, "fundFamilyTrustV1839('" + esc(src.id) + "','custom','v1839-trust-custom-" + esc(src.id) + "')", "Add Custom", "green", !trust.created || max <= 0) + '</div>';
    }).join("");
    var trustMax = Math.max(0, round(n(trust.corpus) * (trust.plan === "starter" ? .5 : .1)));
    return '<section class="panel v1839-trust-funding"><div class="v1839-panel-head"><div><div class="section-label">💰 Step 2: Fund it</div><h3>Move assets into protection</h3><p>Use this to put personal firm capital, investment cash, outside managed money, or checking into the family trust.</p></div><strong>' + compactMoney(trust.corpus || 0) + '<span>corpus</span></strong></div><div class="v1839-source-grid">' + cards + '</div><div class="v1839-distribution-box"><div><b>Trust distribution room</b><span>Starter trusts are more flexible. Stronger trusts keep more capital protected.</span></div>' + customRow("v1839-trust-distribute", trustMax, "distributeFamilyTrustV1839('custom','v1839-trust-distribute')", "Distribute", "blue", !trust.created || trustMax <= 0) + button("Distribute Max", "distributeFamilyTrustV1839('max')", "blue", !trust.created || trustMax <= 0) + '</div></section>';
  }

  function familyFundDesk() {
    var trust = financeNow().familyTrustV1839 || {};
    var fund = trust.familyFund || {};
    var room = Math.max(0, round(n(trust.corpus) - n(fund.capital)));
    var spec = riskSpec();
    return '<section class="panel v1839-family-fund"><div class="v1839-panel-head"><div><div class="section-label">📈 Step 2: Grow it</div><h3>Trust investment sleeve</h3><p>The family fund invests trust capital without removing it from the protected family structure.</p></div><strong class="' + ((fund.lastReturn || 0) >= 0 ? "good" : "bad") + '">' + signedMoney(fund.lastReturn || 0) + '<span>last return</span></strong></div><div class="v1839-metric-grid compact">' +
      metric("Allocated", compactMoney(fund.capital || 0), "Trust corpus assigned to active management.", fund.active ? "good" : "gold") +
      metric("Room", compactMoney(room), "Unallocated trust corpus.", room ? "gold" : "good") +
      metric("Mandate", spec.label, "Expected " + pct(spec.rate) + " before volatility.", "gold") +
      metric("Years", String(round(fund.years || 0)), "Family fund operating history.", "good") +
      '</div><div class="v1839-action-row">' +
      button(fund.active ? "Fund Active" : "Start Family Fund", "allocateFamilyFundV1839(250000)", "green", !trust.created || !round(trust.corpus) || (fund.active && room <= 0)) +
      button("Allocate 25%", "allocateFamilyFundV1839('quarter')", "green", !trust.created || room <= 0) +
      button("Allocate Max", "allocateFamilyFundV1839('max')", "gold", !trust.created || room <= 0) +
      button("Conservative", "setFamilyFundRiskV1839('conservative')", fund.risk === "conservative" ? "blue" : "", !fund.active) +
      button("Balanced", "setFamilyFundRiskV1839('balanced')", fund.risk === "balanced" ? "blue" : "", !fund.active) +
      button("Growth", "setFamilyFundRiskV1839('growth')", fund.risk === "growth" ? "blue" : "", !fund.active) +
      button("Sim Trust Year", "resolveFamilyTrustYearV1839(true)", "blue", !trust.created || !round(trust.corpus)) +
      '</div>' + customRow("v1839-family-fund-custom", room, "allocateFamilyFundV1839('custom','v1839-family-fund-custom')", "Allocate Custom", "green", !trust.created || room <= 0) + '</section>';
  }

  function childTrustDesk() {
    var s = ensureLegalState();
    var trust = s.finance.familyTrustV1839;
    var kids = Object.keys(s.relationships || {}).filter(function (key) {
      var rel = s.relationships[key];
      return rel && rel.role === "Child";
    });
    if (!kids.length) {
      return '<section class="panel v1839-child-trusts"><div class="section-label">👶 Child trusts</div><div class="v1839-empty">No children yet. Heir trust accounts will appear here when you have children.</div></section>';
    }
    var cards = kids.map(function (key) {
      var child = s.relationships[key] || {};
      var bal = Math.max(0, round(s.finance.trustFunds[key]));
      return '<div class="v1839-child-card"><span>' + esc(child.name || key) + '</span><b>' + compactMoney(bal) + '</b><em>Age ' + esc(child.age == null ? 0 : child.age) + '. Bond ' + esc(child.bond || 0) + ', trust ' + esc(child.trust || 0) + '.</em><div class="v1839-mini-actions">' +
        button("Grant $10K", "grantChildFromFamilyTrustV1839('" + esc(key) + "',10000)", "green", !trust.created || n(trust.corpus) < 10000) +
        button("Grant $50K", "grantChildFromFamilyTrustV1839('" + esc(key) + "','max')", "gold", !trust.created || n(trust.corpus) <= 0) +
        '</div></div>';
    }).join("");
    return '<section class="panel v1839-child-trusts"><div class="v1839-panel-head"><div><div class="section-label">👶 Child trusts</div><h3>Heir accounts</h3><p>Move family trust money into child-specific trusts when you want funds earmarked for heirs.</p></div><strong>' + compactMoney(childTrustTotal()) + '<span>child trusts</span></strong></div><div class="v1839-rail">' + cards + '</div></section>';
  }

  function legalActionsDesk() {
    return '<section class="panel v1839-actions"><div class="v1839-panel-head"><div><div class="section-label">📋 Legal actions</div><h3>Cases + contracts</h3><p>Attorneys make legal work cheaper and more effective.</p></div></div><div class="v1839-action-row">' +
      button("Audit Defense", "handleLegalMatterV1839('audit')", "red", false) +
      button("Review Contracts", "handleLegalMatterV1839('contracts')", "blue", false) +
      button("Settle Dispute", "handleLegalMatterV1839('dispute')", "red", false) +
      button("Open Money", "(window.setTabV16||window.setTab||setTab)('money')", "blue", false) +
      button("Open Finance", "(window.setTabV16||window.setTab||setTab)('finance')", "blue", false) +
      '</div></section>';
  }

  function trustHistory() {
    var rows = ((financeNow().familyTrustV1839 || {}).history || []).slice(0, 6);
    if (!rows.length) return "";
    return '<section class="panel v1839-history"><div class="section-label">📜 Trust history</div>' + rows.map(function (row) {
      var icon = n(row.amount) > 0 ? "✅" : n(row.amount) < 0 ? "📉" : "📝";
      return '<div class="v1839-history-row"><span>Age ' + esc(row.age == null ? "?" : row.age) + '</span><b class="' + (n(row.amount) >= 0 ? "good" : "bad") + '">' + esc(signedMoney(row.amount || 0)) + '</b><em>' + icon + ' ' + esc(row.event || "Trust event") + '</em></div>';
    }).join("") + '</section>';
  }

  function cloneV1846(value) {
    try { return JSON.parse(JSON.stringify(value || null)); } catch (e) { return value; }
  }

  function businessValueV1846(b) {
    b = b || {};
    return Math.max(0, round(n(b.value) + n(b.retainedEarnings)));
  }

  function businessCarryValueV1846(sourceState) {
    var businesses = (((sourceState || {}).finance || {}).businesses) || [];
    if (!Array.isArray(businesses)) return 0;
    return businesses.reduce(function (sum, b) { return sum + businessValueV1846(b); }, 0);
  }

  function trustBusinessCarryValueV1846(sourceState) {
    var businesses = (((sourceState || {}).finance || {}).businesses) || [];
    if (!Array.isArray(businesses)) return 0;
    return businesses.reduce(function (sum, b) {
      var fam = (b && b.familyV1833) || {};
      return sum + businessValueV1846(b) * Math.max(0, Math.min(1, n(fam.trustPercent)));
    }, 0);
  }

  function childTrustCarryV1846(sourceState, heirKey, includeHeir) {
    var funds = ((((sourceState || {}).finance || {}).trustFunds) || {});
    return Object.keys(funds).reduce(function (sum, key) {
      if (!includeHeir && String(key) === String(heirKey)) return sum;
      return sum + Math.max(0, round(funds[key]));
    }, 0);
  }

  function trustCarryValueV1846(sourceState, heirKey) {
    var f = ((sourceState || {}).finance || {});
    var trust = f.familyTrustV1839 || {};
    var estate = (sourceState || {}).estateV1831 || {};
    return Math.max(0, round(n(trust.corpus) + n((estate.assets || {}).trustCash) + childTrustCarryV1846(sourceState, heirKey, true)));
  }

  function investmentOfficeCarryValueV1849(sourceState) {
    var f = ((sourceState || {}).finance || {});
    var firm = f.personalFirm || f.personalFund || {};
    return Math.max(0, round(
      n(f.managedPortfolio) +
      n(f.externalManager && f.externalManager.capital) +
      n(f.managerFirmsV1829 && f.managerFirmsV1829.capital) +
      n(f.personalFirmCash) +
      n(f.firmCashV1828) +
      n(f.firmCash) +
      n(firm.cash) +
      n(firm.managed) +
      n(firm.capital) +
      n(firm.balance) +
      n(firm.account)
    ));
  }

  function hasProtectedFamilyStructureV1849(sourceState) {
    var s = sourceState || {};
    var f = s.finance || {};
    var trust = f.familyTrustV1839 || f.familyTrust || {};
    var estate = s.estateV1831 || {};
    return !!(
      trust.created || trust.active || trust.plan || n(trust.corpus) ||
      n((estate.assets || {}).trustCash) ||
      estate.hasWill || estate.trustType ||
      trustBusinessCarryValueV1846(s) > 0 ||
      childTrustCarryV1846(s, "", true) > 0
    );
  }

  function personalInheritanceCashV1846(sourceState, heirKey, inheritanceRate) {
    var s = sourceState || {};
    var f = s.finance || {};
    var personalAssets =
      n(s.money) + n(s.savings) + n(s.ira) + n(s.retirement401k) +
      n(f.brokerage) + n(f.brokerageCash) + investmentOfficeCarryValueV1849(sourceState);
    var personalDebts =
      n(s.debt) + n(f.taxDebt) + n(f.creditCardDebt) +
      n(f.debts && f.debts.medical) + n(f.debts && f.debts.education) + n(f.debts && f.debts.secured);
    var legacyEstate = 0;
    try { if (typeof legacyNetWorth === "function") legacyEstate = Math.max(0, round(legacyNetWorth(s))); } catch (e) {}
    var base = Math.max(0, Math.max(legacyEstate, personalAssets - personalDebts));
    var heirTrust = Math.max(0, round((((f.trustFunds || {})[heirKey]) || 0)));
    var rate = inheritanceRate == null ? .45 : Math.max(0, Math.min(.45, n(inheritanceRate)));
    return Math.max(0, round(base * rate) + heirTrust);
  }

  function normalizeInheritedBusinessV1846(b, heirKey, generation) {
    b = cloneV1846(b) || {};
    if (!b.familyV1833 || typeof b.familyV1833 !== "object") b.familyV1833 = {};
    if (String(b.familyV1833.successor) === String(heirKey)) b.familyV1833.successor = "self";
    b.familyV1833.inheritedGeneration = generation;
    b.familyV1833.lastSuccessionAge = 0;
    b.inherited = true;
    return b;
  }

  function applyLegacyCarryV1846(sourceState, heirKey) {
    var s = ensureLegalState();
    var old = sourceState || {};
    var oldF = old.finance || {};
    var oldTrust = oldF.familyTrustV1839 || {};
    var oldEstate = old.estateV1831 || {};
    var oldBusinesses = Array.isArray(oldF.businesses) ? oldF.businesses : [];
    var heirTrust = Math.max(0, round(((oldF.trustFunds || {})[heirKey]) || 0));
    var otherChildTrusts = childTrustCarryV1846(old, heirKey, false);
    var generation = ((s.legacy || {}).generation || 1);
    var carriedTrust = trustCarryValueV1846(old, heirKey);
    var carriedBusiness = businessCarryValueV1846(old);
    var carriedTrustBusiness = trustBusinessCarryValueV1846(old);
    var carriedInvestmentOffice = investmentOfficeCarryValueV1849(old);
    var protectedOffice = hasProtectedFamilyStructureV1849(old) ? carriedInvestmentOffice : 0;
    var hasBusinessStructure = oldBusinesses.length || carriedBusiness || carriedTrustBusiness;

    if (oldTrust.created || n(oldTrust.corpus) || heirTrust || otherChildTrusts || n((oldEstate.assets || {}).trustCash) || hasBusinessStructure || protectedOffice) {
      var nextTrust = cloneV1846(oldTrust) || {};
      if (!nextTrust.created) {
        nextTrust.created = true;
        nextTrust.plan = nextTrust.plan || "starter";
        nextTrust.protection = nextTrust.protection || .18;
        nextTrust.annualFeeRate = nextTrust.annualFeeRate || .0015;
        nextTrust.taxDrag = nextTrust.taxDrag || .01;
      }
      if (!nextTrust.sourceLedger || typeof nextTrust.sourceLedger !== "object") nextTrust.sourceLedger = {};
      if (!Array.isArray(nextTrust.history)) nextTrust.history = [];
      if (!nextTrust.familyFund || typeof nextTrust.familyFund !== "object") nextTrust.familyFund = { active: false, capital: 0, risk: "balanced", lastReturn: 0, lastFee: 0, years: 0 };
      nextTrust.corpus = Math.max(0, round(n(nextTrust.corpus) + otherChildTrusts + protectedOffice));
      nextTrust.sourceLedger.inheritedTrust = Math.max(0, round(n(nextTrust.sourceLedger.inheritedTrust) + carriedTrust));
      if (heirTrust) nextTrust.sourceLedger.heirTrustDistributed = Math.max(0, round(n(nextTrust.sourceLedger.heirTrustDistributed) + heirTrust));
      if (otherChildTrusts) nextTrust.sourceLedger.remainingChildTrusts = Math.max(0, round(n(nextTrust.sourceLedger.remainingChildTrusts) + otherChildTrusts));
      if (carriedTrustBusiness) nextTrust.sourceLedger.trustOwnedBusiness = Math.max(0, round(n(nextTrust.sourceLedger.trustOwnedBusiness) + carriedTrustBusiness));
      if (protectedOffice) nextTrust.sourceLedger.investmentOffice = Math.max(0, round(n(nextTrust.sourceLedger.investmentOffice) + protectedOffice));
      nextTrust.history.unshift({ age: 0, event: "Carried into generation " + generation, amount: carriedTrust });
      if (carriedTrustBusiness) nextTrust.history.unshift({ age: 0, event: "Trust-owned business stake carried into generation " + generation, amount: carriedTrustBusiness });
      if (protectedOffice) nextTrust.history.unshift({ age: 0, event: "Investment office capital carried into generation " + generation, amount: protectedOffice });
      nextTrust.history = nextTrust.history.slice(0, 10);
      s.finance.familyTrustV1839 = nextTrust;
      s.finance.trustFunds = {};
    }

    if ((oldEstate && Object.keys(oldEstate).length) || hasBusinessStructure) {
      s.estateV1831 = cloneV1846(oldEstate) || {};
      if (!s.estateV1831.assets || typeof s.estateV1831.assets !== "object") s.estateV1831.assets = {};
      s.estateV1831.assets.trustCash = Math.max(0, round(n(s.estateV1831.assets.trustCash)));
      if (!s.estateV1831.businessHoldingsV1833 || typeof s.estateV1831.businessHoldingsV1833 !== "object") s.estateV1831.businessHoldingsV1833 = {};
      if (!s.estateV1831.familyEnterpriseV1833 || typeof s.estateV1831.familyEnterpriseV1833 !== "object") s.estateV1831.familyEnterpriseV1833 = {};
      var fe = s.estateV1831.familyEnterpriseV1833;
      if (!Array.isArray(fe.history)) fe.history = [];
      fe.history.unshift({ age: 0, event: "Succession carried family enterprise into generation " + generation, amount: carriedBusiness });
      fe.history = fe.history.slice(0, 8);
      fe.lastSuccessionGeneration = generation;
      fe.lastTrustBusinessCarry = carriedTrustBusiness;
      if (s.finance.familyTrustV1839 && s.finance.familyTrustV1839.created) {
        s.estateV1831.hasWill = true;
        s.estateV1831.trustType = s.finance.familyTrustV1839.plan || s.estateV1831.trustType || "family_trust";
      }
    }

    if (oldBusinesses.length) {
      s.finance.businesses = oldBusinesses.map(function (b) {
        var inherited = normalizeInheritedBusinessV1846(b, heirKey, generation);
        var pct = Math.max(0, Math.min(1, n(inherited.familyV1833 && inherited.familyV1833.trustPercent)));
        if (pct && s.estateV1831 && s.estateV1831.businessHoldingsV1833) {
          s.estateV1831.businessHoldingsV1833[String(inherited.id)] = {
            name: inherited.name || inherited.id,
            percent: pct,
            value: round(businessValueV1846(inherited) * pct),
            updatedAge: 0,
            inherited: true
          };
        }
        return inherited;
      });
      if (!s.finance.businessOfficeV1840 || typeof s.finance.businessOfficeV1840 !== "object") s.finance.businessOfficeV1840 = {};
      if (!s.finance.businessOfficeV1840.focusId && s.finance.businesses[0]) s.finance.businessOfficeV1840.focusId = s.finance.businesses[0].id;
      if (!s.finance.entrepreneurshipV1841 || typeof s.finance.entrepreneurshipV1841 !== "object") s.finance.entrepreneurshipV1841 = cloneV1846(oldF.entrepreneurshipV1841 || { path: "undecided" });
      if (!s.finance.businessTaxV1830 || typeof s.finance.businessTaxV1830 !== "object") s.finance.businessTaxV1830 = cloneV1846(oldF.businessTaxV1830 || { history: [], processedAges: {} });
    }

    if (!s.legacy || typeof s.legacy !== "object") s.legacy = {};
    s.legacy.lastTrustCarry = carriedTrust;
    s.legacy.lastBusinessCarry = carriedBusiness;
    s.legacy.lastTrustBusinessCarry = carriedTrustBusiness;
    s.legacy.lastInvestmentOfficeCarry = carriedInvestmentOffice;
    s.legacy.lastProtectedInvestmentOfficeCarry = protectedOffice;
    s.legacy.lastHeirTrustCash = heirTrust;
    s.legacy.successionBridgeV1846 = true;
    return { trust: carriedTrust, business: carriedBusiness, trustBusiness: carriedTrustBusiness, investmentOffice: carriedInvestmentOffice, protectedInvestmentOffice: protectedOffice, heirTrust: heirTrust };
  }

  function selectedHeirEntryV1846(old) {
    var relationships = (old || {}).relationships || {};
    var entries = Object.keys(relationships).map(function (key) { return [key, relationships[key]]; }).filter(function (pair) {
      return pair[1] && pair[1].role === "Child" && pair[1].alive !== false;
    });
    if (!entries.length) return null;
    var selected = (old.legacy || {}).successorKey;
    if (selected) {
      var picked = entries.find(function (pair) { return String(pair[0]) === String(selected); });
      if (picked) return picked;
    }
    return entries[0];
  }

  function storePreSuccessionBackupV1847(old, heirKey) {
    var payload = { at: Date.now(), slot: 1, heirKey: heirKey || "", source: old };
    try { payload.slot = typeof activeSlot !== "undefined" ? activeSlot : Number(localStorage.getItem("ledger-active-slot") || 1); } catch (e) {}
    try { window.__ledgerPreSuccessionSourceV1847 = payload; } catch (e2) {}
    try { localStorage.setItem("ledger_v1847_pre_succession_latest", JSON.stringify(payload)); } catch (e3) {}
    try { localStorage.setItem("ledger_v1847_pre_succession_slot_" + payload.slot, JSON.stringify(payload)); } catch (e4) {}
  }

  function continueAsHeirV1846() {
    var old = cloneV1846(stateNow());
    if (!old) return;
    var heirEntry = selectedHeirEntryV1846(old);
    if (!heirEntry) return toast("No living child is available to continue the family line.");
    var heirKey = heirEntry[0];
    var heir = heirEntry[1] || {};
    var cashInheritance = personalInheritanceCashV1846(old, heirKey, old.alive === false ? .45 : .18);
    var oldScore = 0;
    try { if (typeof ledgerLegacyScore === "function") oldScore = round(ledgerLegacyScore(old)); } catch (e) {}
    var oldLegacy = old.legacy || {};
    var familyName = oldLegacy.familyName || (old.name || "").split(" ").pop() || "Legacy";
    var gender = (heir.gender || heir.sex || "").toLowerCase();
    if (["male", "female", "man", "woman"].indexOf(gender) < 0) gender = "male";
    if (gender === "man") gender = "male";
    if (gender === "woman") gender = "female";
    var nextName = heir.name || (typeof randomName === "function" ? randomName(gender).replace(/ \w+$/, " " + familyName) : "Heir " + familyName);
    if (typeof newGame !== "function") return toast("New life system is not ready.");
    storePreSuccessionBackupV1847(old, heirKey);
    var previousLives = (oldLegacy.previousLivesV1816 || []).slice(0, 8);
    previousLives.unshift({ name: old.name, age: old.age, netWorth: carriedPreviewNetV1847(old), score: oldScore, alive: old.alive !== false });
    newGame({
      name: nextName,
      gender: gender,
      background: old.background || "middle",
      city: old.city || (typeof pick === "function" && typeof cities !== "undefined" ? pick(cities) : ""),
      startingMoney: cashInheritance,
      sandbox: old.sandbox || {},
      sandboxMode: !!old.sandboxMode
    });
    ensureLegalState();
    try { if (typeof ensureLegacyShape === "function") ensureLegacyShape(); } catch (e2) {}
    if (!stateNow().legacy || typeof stateNow().legacy !== "object") stateNow().legacy = {};
    stateNow().legacy.generation = (oldLegacy.generation || 1) + 1;
    stateNow().legacy.familyName = familyName;
    stateNow().legacy.cumulativeScore = (oldLegacy.cumulativeScore || 0) + oldScore;
    stateNow().legacy.inheritedFrom = old.name;
    stateNow().legacy.lastInheritance = cashInheritance;
    stateNow().legacy.previousLivesV1816 = previousLives;
    stateNow().legacy.milestones = [];
    var carried = applyLegacyCarryV1846(old, heirKey);
    log("You carry the " + familyName + " line forward with " + compactMoney(cashInheritance) + " cash, " + compactMoney(carried.trust) + " protected trust cash, " + compactMoney(carried.business) + " family business value, and " + compactMoney(carried.protectedInvestmentOffice || 0) + " protected investment office capital.", { money: 0 });
    try { if (typeof save === "function") save(); } catch (e3) {}
    try { if (typeof render === "function") render(); } catch (e4) {}
    try { if (typeof milestoneToast === "function") milestoneToast("Legacy Continued", nextName + " begins generation " + stateNow().legacy.generation + "."); } catch (e5) {}
  }

  function carriedPreviewNetV1847(s) {
    try { if (typeof legacyNetWorth === "function") return round(legacyNetWorth(s)); } catch (e) {}
    var f = (s || {}).finance || {};
    return round(n((s || {}).money) + n((s || {}).savings) + businessCarryValueV1846(s) + trustCarryValueV1846(s, "") + investmentOfficeCarryValueV1849(s) + n(f.brokerage) - n((s || {}).debt));
  }

  function sourceScoreV1847(candidate) {
    var source = candidate && (candidate.source || candidate.state || candidate);
    if (!source || typeof source !== "object") return -1;
    return businessCarryValueV1846(source) + trustCarryValueV1846(source, "") + trustBusinessCarryValueV1846(source) + investmentOfficeCarryValueV1849(source);
  }

  function readJsonV1847(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function repairSourcesV1847() {
    var out = [];
    try { if (window.__ledgerPreSuccessionSourceV1847) out.push(window.__ledgerPreSuccessionSourceV1847); } catch (e) {}
    try {
      var slot = typeof activeSlot !== "undefined" ? activeSlot : Number(localStorage.getItem("ledger-active-slot") || 1);
      var slotBackup = readJsonV1847("ledger_v1847_pre_succession_slot_" + slot);
      if (slotBackup) out.push(slotBackup);
    } catch (e2) {}
    var latest = readJsonV1847("ledger_v1847_pre_succession_latest");
    if (latest) out.push(latest);
    var blocked = readJsonV1847("ledger_v1835_blocked_startup_state");
    if (blocked && blocked.state) out.push({ source: blocked.state });
    try {
      for (var i = 1; i <= 5; i += 1) {
        var saved = readJsonV1847("ledger-life-slot-" + i);
        if (saved && saved.state) saved = saved.state;
        if (saved && saved !== stateNow()) out.push({ source: saved });
        var snaps = saved && Array.isArray(saved.timeSnapshotsV1814) ? saved.timeSnapshotsV1814 : [];
        snaps.forEach(function (snap) { if (snap && snap.state) out.push({ source: snap.state }); });
      }
    } catch (e3) {}
    return out.filter(function (candidate) { return sourceScoreV1847(candidate) > 0; });
  }

  function heirKeyForRepairV1847(source, current) {
    var sourceState = source || {};
    var name = String((current || {}).name || "");
    var selected = ((sourceState.legacy || {}).successorKey || "");
    var relationships = sourceState.relationships || {};
    if (selected && relationships[selected]) return selected;
    var match = Object.keys(relationships).find(function (key) {
      var r = relationships[key] || {};
      return r.role === "Child" && r.alive !== false && r.name && name && String(r.name).split(" ")[0] === name.split(" ")[0];
    });
    return match || Object.keys(relationships).find(function (key) {
      var r = relationships[key] || {};
      return r.role === "Child" && r.alive !== false;
    }) || "";
  }

  function bestRepairSourceV1847() {
    var current = stateNow();
    var inheritedFrom = String((current.legacy || {}).inheritedFrom || "");
    var familyName = String((current.legacy || {}).familyName || "");
    return repairSourcesV1847().sort(function (a, b) {
      function rank(candidate) {
        var source = candidate.source || candidate.state || candidate;
        var sameName = inheritedFrom && source.name === inheritedFrom ? 1e15 : 0;
        var sameFamily = familyName && ((source.legacy || {}).familyName === familyName || String(source.name || "").indexOf(familyName) >= 0) ? 1e14 : 0;
        return sameName + sameFamily + sourceScoreV1847(candidate);
      }
      return rank(b) - rank(a);
    })[0] || null;
  }

  window.repairLegacyCarryV1847 = function () {
    var current = ensureLegalState();
    var existing = businessCarryValueV1846(current) + trustCarryValueV1846(current, "") + trustBusinessCarryValueV1846(current);
    var candidate = bestRepairSourceV1847();
    if (!candidate) return toast("No recoverable pre-succession trust source was found. Use a Wayback checkpoint or an older slot if one exists.");
    var source = candidate.source || candidate.state || candidate;
    if (sourceScoreV1847(candidate) <= existing) return toast("Current legacy carry is already as large as the best recoverable source.");
    var heirKey = candidate.heirKey || heirKeyForRepairV1847(source, current);
    var carried = applyLegacyCarryV1846(source, heirKey);
    log("Recovered missing legacy carry: " + compactMoney(carried.trust) + " trust cash and " + compactMoney(carried.business) + " family business value.", {});
    try { if (typeof save === "function") save(); } catch (e) {}
    try { if (typeof render === "function") render(); } catch (e2) {}
  };

  function localBusinessValue(b) {
    return n(b.value) + n(b.retainedEarnings);
  }

  function localChildrenOptions() {
    var s = stateNow();
    var out = [{ id: "none", name: "No named successor" }, { id: "professional", name: "Professional CEO / Trustee" }];
    Object.keys(s.relationships || {}).forEach(function (key) {
      var r = s.relationships[key];
      if (r && r.role === "Child" && r.alive !== false) out.push({ id: key, name: (r.name || key) + " (child)" });
    });
    return out;
  }

  function businessTitlingDesk() {
    var s = ensureLegalState();
    var trust = s.finance.familyTrustV1839 || {};
    var businesses = Array.isArray(s.finance.businesses) ? s.finance.businesses : [];
    if (!businesses.length) {
      return '<section class="panel v1846-titling-desk"><div class="v1839-panel-head"><div><div class="section-label">🏢 Step 3: Title your businesses</div><h3>Move ownership into the protected trust</h3></div></div><div class="v1839-empty">No businesses yet. Start one in the Business Office, then come back here to title shares to the trust.</div></section>';
    }
    var options = localChildrenOptions();
    var cards = businesses.map(function (b) {
      var fam = b.familyV1833 || {};
      var trustPct = Math.max(0, Math.min(1, n(fam.trustPercent)));
      var value = localBusinessValue(b);
      var selectId = "v1846-titling-" + esc(String(b.id));
      var selectOptions = options.map(function (opt) {
        return '<option value="' + esc(opt.id) + '" ' + (String(fam.successor) === String(opt.id) ? "selected" : "") + '>' + esc(opt.name) + '</option>';
      }).join("");
      var chosen = options.filter(function (opt) { return String(opt.id) === String(fam.successor); })[0];
      var pctButtons = [25, 51, 100].map(function (target) {
        var increase = Math.max(0, target / 100 - trustPct);
        var cost = increase > 0 ? Math.min(250000, Math.max(1200, round(value * increase * .006))) : 0;
        var active = Math.round(trustPct * 100) === target;
        return button(target + "% (" + compactMoney(cost) + ")", "setBusinessTrustPercentV1840('" + esc(b.id) + "'," + target + ")", active ? "blue" : "", active || !trust.created || typeof window.setBusinessTrustPercentV1840 !== "function");
      }).join("");
      return '<div class="v1839-child-card"><span>' + esc(b.name || b.id) + '</span><b>' + Math.round(trustPct * 100) + '% in trust</b><em>Value ' + compactMoney(value) + '. Successor: ' + esc(chosen ? chosen.name : "None") + '.</em><div class="v1839-mini-actions">' + pctButtons + '</div><div class="v1839-mini-actions"><select id="' + selectId + '" class="v1840-select">' + selectOptions + '</select>' + button("Set Successor", "appointBusinessSuccessorFromSelectV1840('" + esc(b.id) + "','" + selectId + "')", "gold", typeof window.appointBusinessSuccessorFromSelectV1840 !== "function") + '</div></div>';
    }).join("");
    return '<section class="panel v1846-titling-desk"><div class="v1839-panel-head"><div><div class="section-label">🏢 Step 3: Title your businesses</div><h3>Move ownership into the protected trust</h3><p>Titling shares costs a legal fee but moves that share of the business out of the personal estate and into trust protection. Training and council tools stay in the full Business Office.</p></div></div><div class="v1839-rail">' + cards + '</div><div class="v1839-action-row">' + button("Open full Business Office", "(window.setTabV16||window.setTab||setTab)('business')", "blue", false) + '</div></section>';
  }

  function successorDesk() {
    var s = stateNow();
    var current = (s.legacy || {}).successorKey;
    var kids = [];
    Object.keys(s.relationships || {}).forEach(function (key) {
      var r = s.relationships[key];
      if (r && r.role === "Child" && r.alive !== false) kids.push({ id: key, name: r.name || key, age: r.age });
    });
    var rows = kids.length ? kids.map(function (kid) {
      var active = String(current) === String(kid.id);
      return button((active ? "★ " : "") + kid.name + (kid.age == null ? "" : " (age " + kid.age + ")"), "setSuccessorV1814('" + esc(kid.id) + "')", active ? "gold" : "", active || typeof window.setSuccessorV1814 !== "function");
    }).join("") : '<span class="money-chip">No living children yet</span>';
    return '<section class="panel v1846-successor-desk"><div class="v1839-panel-head"><div><div class="section-label">👑 Step 4: Choose your successor</div><h3>Who continues the line</h3><p>This is the child who takes over when you continue the legacy. Train and equip them through each business\'s family enterprise desk in the Business Office.</p></div></div><div class="v1839-action-row">' + rows + '</div></section>';
  }

  function successionDeskV1846() {
    var s = ensureLegalState();
    var carriedTrust = n((s.legacy || {}).lastTrustCarry);
    var carriedBusiness = n((s.legacy || {}).lastBusinessCarry);
    var carriedOffice = n((s.legacy || {}).lastInvestmentOfficeCarry);
    var protectedOffice = n((s.legacy || {}).lastProtectedInvestmentOfficeCarry);
    var trust = s.finance.familyTrustV1839 || {};
    var businesses = Array.isArray(s.finance.businesses) ? s.finance.businesses.length : 0;
    var hasChild = Object.keys(s.relationships || {}).some(function (key) {
      var r = s.relationships[key];
      return r && r.role === "Child" && r.alive !== false;
    });
    return '<section class="panel v1846-succession-desk"><div class="v1839-panel-head"><div><div class="section-label">🌳 Step 5: Continue the legacy</div><h3>Heirs keep protected family assets</h3><p>Continuing as a child now preserves the legal trust, family fund, child-trust cash, and trust-owned businesses instead of collapsing the family structure into a small cash payout.</p></div><strong class="' + (carriedTrust || carriedBusiness ? "good" : "gold") + '">' + compactMoney(carriedTrust + carriedBusiness) + '<span>last carry</span></strong></div><div class="v1839-metric-grid compact">' +
      metric("Trust status", trust.created ? "Protected" : "Open", trust.created ? "Corpus " + compactMoney(trust.corpus || 0) : "Create or fund a trust before succession.", trust.created ? "good" : "gold") +
      metric("Family businesses", String(businesses), businesses ? "Business desk keeps inherited companies." : "No businesses carried yet.", businesses ? "good" : "gold") +
      metric("Investment office", compactMoney(carriedOffice), protectedOffice ? compactMoney(protectedOffice) + " moved into the family trust pool." : "Without a trust, office capital is personal estate value.", protectedOffice ? "green" : "gold") +
      metric("Last cash inheritance", compactMoney((s.legacy || {}).lastInheritance || 0), "Spendable cash from the personal estate.", "blue") +
      metric("Last heir trust cash", compactMoney((s.legacy || {}).lastHeirTrustCash || 0), "Child-specific trust cash became starting cash.", "green") +
      '</div><div class="v1839-action-row">' +
      button("🌳 Continue the Legacy Now", "continueAsHeirV1846()", "gold", !hasChild || typeof window.continueAsHeirV1846 !== "function") +
      button("Open Business", "(window.setTabV16||window.setTab||setTab)('business')", "blue", false) +
      button("Repair Missing Carry", "repairLegacyCarryV1847()", "red", false) +
      '</div></section>';
  }

  // v18.53: Trust + succession split into their own page. Legal keeps tax,
  // accountants, attorneys, lawsuits and contracts; the family office (trust,
  // child trusts, business titling, family fund, successor) lives on its own
  // "trust" hub, reachable from Legal and from More.
  function legalCounters() {
    var acc = currentAccountant();
    var atty = currentAttorney();
    var risk = legalRisk();
    return '<section class="panel v1839-counters"><div class="section-label">📊 Legal counters</div><div class="v1839-metric-grid">' +
      metric("Tax debt", compactMoney(taxDebt()), "Unpaid tax balance.", taxDebt() ? "bad" : "good") +
      metric("Accountant", acc.id === "none" ? "No coverage" : acc.name, "Auto-file " + (acc.id === "none" ? "off" : "on") + ", save " + pct(acc.reduction || 0) + ".", acc.id === "none" ? "bad" : "good") +
      metric("Attorney", atty.id === "none" ? "No coverage" : atty.name, "Risk help " + round(atty.risk || atty.riskReduction || 0) + ".", atty.id === "none" ? "gold" : "good") +
      metric("Legal risk", risk + "/100", "Lawsuit / audit exposure.", risk <= 20 ? "good" : risk >= 55 ? "bad" : "gold") +
      '</div></section>';
  }

  function trustCounters() {
    var trust = financeNow().familyTrustV1839 || {};
    var plan = trustPlan();
    return '<section class="panel v1839-counters"><div class="section-label">📊 Trust counters</div><div class="v1839-metric-grid">' +
      metric("Family trust", compactMoney(trust.corpus || 0), (trust.created ? pct(plan.protection) + " protection profile." : "Create one before moving assets."), trust.created ? "good" : "gold") +
      metric("Protected assets", compactMoney(protectedAssets()), "Sheltered from lawsuits and risk.", protectedAssets() ? "good" : "gold") +
      metric("Child trusts", compactMoney(childTrustTotal()), "Heir-specific trust balances.", childTrustTotal() ? "good" : "gold") +
      metric("Family fund", compactMoney((trust.familyFund || {}).capital || 0), (trust.familyFund || {}).active ? riskSpec().label + " mandate." : "Inactive trust sleeve.", (trust.familyFund || {}).active ? "good" : "gold") +
      '</div></section>';
  }

  function trustHero() {
    var trust = financeNow().familyTrustV1839 || {};
    var plan = trustPlan();
    return '<section class="v1839-hero"><div><div class="section-label">🏛️ Family office</div><h2>Family Trust</h2><p>Create and fund the trust, title your businesses into it, run the family fund, set up child trusts, and name a successor to carry the legacy.</p><div class="v1839-chip-row"><span class="' + (trust.created ? "good" : "gold") + '">Trust ' + esc(trust.created ? plan.name : "not created") + '</span><span>Corpus ' + compactMoney(trust.corpus || 0) + '</span><span>Protected ' + compactMoney(protectedAssets()) + '</span></div></div><strong class="' + (trust.created ? "good" : "gold") + '">' + compactMoney(trust.corpus || 0) + '<span>trust corpus</span></strong></section>';
  }

  function trustLinkCardV1853() {
    var trust = financeNow().familyTrustV1839 || {};
    return '<section class="panel" style="border-color:rgba(126,160,172,.42)!important;cursor:pointer" onclick="event.preventDefault();event.stopPropagation();setTab(\'trust\')"><div class="v1839-panel-head"><div><div class="section-label">🏛️ Family office</div><h3>Family Trust &amp; Succession →</h3><p>Trusts, child trusts, business titling, the family fund, and successor planning have their own page now.</p></div><strong class="' + (trust.created ? "good" : "gold") + '">' + compactMoney(trust.corpus || 0) + '<span>trust corpus</span></strong></div><div class="v1839-action-row"><button class="money-btn blue" onclick="event.preventDefault();event.stopPropagation();setTab(\'trust\')">Open Family Trust →</button></div></section>';
  }

  function legalBackLinkV1853() {
    return '<div class="v1839-action-row" style="margin:0 0 2px"><button class="money-btn" onclick="event.preventDefault();event.stopPropagation();setTab(\'law\')">← Back to Legal</button></div>';
  }

  function renderTrustHub() {
    ensureLegalState();
    return '<div class="v1839-legal-shell">' +
      legalBackLinkV1853() +
      trustHero() +
      trustCounters() +
      '<div class="v1846-journey-banner">🗺️ Family Office &amp; Succession - five steps, one place: set up the trust, fund it, title your businesses, pick a successor, then continue the legacy.</div>' +
      trustPlanDesk() +
      trustFundingDesk() +
      familyFundDesk() +
      childTrustDesk() +
      businessTitlingDesk() +
      successorDesk() +
      successionDeskV1846() +
      trustHistory() +
      '</div>';
  }

  function renderLegalHub() {
    ensureLegalState();
    return '<div class="v1839-legal-shell">' +
      hero() +
      legalCounters() +
      '<div class="v1839-main-grid">' + taxDesk() + coverageDesk() + '</div>' +
      legalActionsDesk() +
      trustLinkCardV1853() +
      '</div>';
  }

  var previousResolve = window.resolveLifeAndFinanceYear || (typeof resolveLifeAndFinanceYear === "function" ? resolveLifeAndFinanceYear : null);
  if (previousResolve && !window.__ledgerTaxLegalResolveV1839Wrapped) {
    window.__ledgerTaxLegalResolveV1839Wrapped = true;
    window.resolveLifeAndFinanceYear = function () {
      var out = previousResolve.apply(this, arguments);
      try { window.resolveFamilyTrustYearV1839(false); } catch (e) {}
      return out;
    };
    try { resolveLifeAndFinanceYear = window.resolveLifeAndFinanceYear; } catch (e) {}
  }

  var previousRenderHubContent = window.renderHubContent || (typeof renderHubContent === "function" ? renderHubContent : null);
  window.renderLegalHubV1839 = renderLegalHub;
  window.renderTrustHubV1853 = renderTrustHub;
  window.legalProtectedAssetsV1839 = protectedAssets;
  window.continueAsHeirV1846 = continueAsHeirV1846;
  window.continueAsHeir = continueAsHeirV1846;
  try { continueAsHeir = continueAsHeirV1846; } catch (e0) {}
  window.renderHubContent = function (hubId) {
    var id = String(hubId || "").toLowerCase();
    if (id === "law" || id === "legal" || id === "taxlaw") return renderLegalHub();
    if (id === "trust" || id === "trusts" || id === "familytrust") return renderTrustHub();
    return previousRenderHubContent ? previousRenderHubContent.apply(this, arguments) : "";
  };
  try { renderHubContent = window.renderHubContent; } catch (e) {}

  if (typeof document !== "undefined" && document.createElement && document.head) {
    var style = document.createElement("style");
    style.textContent = [
      ".hub-overlay.hub-law .hub-head{position:sticky!important;top:0!important;z-index:8!important;background:linear-gradient(180deg,rgba(18,14,10,1),rgba(18,14,10,.92))!important;box-shadow:0 1px 0 rgba(255,255,255,.05)}",
      ".v1839-legal-shell{display:grid;gap:14px;padding:4px 0 94px;color:#f6ead8;min-width:0}.v1839-legal-shell *{box-sizing:border-box}.v1839-legal-shell .panel{min-width:0;overflow:hidden;border:1px solid rgba(216,173,109,.22);border-radius:12px;background:linear-gradient(135deg,rgba(36,30,23,.96),rgba(23,19,15,.96));padding:14px}.v1839-legal-shell .section-label{font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.16em;color:#d8b16e;font-size:10px;margin-bottom:9px}",
      ".v1839-hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:end;border:1px solid rgba(126,160,172,.46);border-radius:16px;background:radial-gradient(circle at 12% 10%,rgba(126,160,172,.22),transparent 30%),radial-gradient(circle at 80% 0,rgba(233,146,125,.18),transparent 28%),linear-gradient(135deg,rgba(24,39,42,.98),rgba(43,30,24,.98));padding:18px;box-shadow:0 22px 58px rgba(0,0,0,.28)}.v1839-hero h2{font-size:38px;margin:0 0 6px;letter-spacing:0}.v1839-hero p{margin:0;color:#d9c8aa;font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.55}.v1839-hero strong{font-size:54px;color:#f0ca7b;text-align:right}.v1839-hero strong span{display:block;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.15em;font-size:9px;color:#bba988}.v1839-hero strong.good{color:#b9dc8a}.v1839-hero strong.bad{color:#e9927d}",
      ".v1839-chip-row{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}.v1839-chip-row span{border:1px solid rgba(255,255,255,.13);border-radius:999px;background:rgba(255,255,255,.045);padding:6px 9px;color:#d8b16e;font-family:'JetBrains Mono',monospace;font-size:10px}.v1839-chip-row .good{color:#b9dc8a;border-color:rgba(185,220,138,.36)}.v1839-chip-row .bad{color:#e9927d;border-color:rgba(233,146,125,.40)}",
      ".v1839-main-grid{display:grid;grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr);gap:14px}.v1839-panel-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:12px}.v1839-panel-head h3{font-size:24px;margin:0 0 4px;letter-spacing:0}.v1839-panel-head p,.v1839-panel-head span{font-family:'JetBrains Mono',monospace;color:#b9a98e;font-size:10px;line-height:1.45;margin:0}.v1839-panel-head strong{color:#f0ca7b;font-size:28px;text-align:right}.v1839-panel-head strong.good{color:#b9dc8a}.v1839-panel-head strong.bad{color:#e9927d}.v1839-panel-head strong span{display:block;text-transform:uppercase;letter-spacing:.14em;font-size:8px;margin-top:3px}",
      ".v1839-metric-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.v1839-metric-grid.compact{grid-template-columns:repeat(4,minmax(0,1fr))}.v1839-metric{border:1px solid rgba(255,255,255,.11);border-radius:12px;background:rgba(255,255,255,.045);padding:11px;min-width:0}.v1839-metric span{display:block;color:#aa9a82;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.11em;font-size:9px}.v1839-metric b{display:block;color:#fff3df;font-size:20px;margin-top:5px;overflow-wrap:anywhere}.v1839-metric em{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-style:normal;font-size:10px;line-height:1.4;margin-top:5px}.v1839-metric.good b,.v1839-history-row b.good{color:#b9dc8a}.v1839-metric.bad b,.v1839-history-row b.bad{color:#e9927d}.v1839-metric.gold b{color:#f0ca7b}",
      ".v1839-action-row,.v1839-mini-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.v1839-action-row{overflow-x:auto;flex-wrap:nowrap;padding-bottom:8px}.v1839-action-row .money-btn{flex:0 0 auto}.v1839-custom-row{display:grid;grid-template-columns:minmax(130px,1fr) minmax(94px,auto) auto;gap:8px;align-items:center;margin-top:10px}.v1839-custom-row input{min-width:0}.v1839-custom-row span{border:1px solid rgba(126,160,172,.35);border-radius:10px;background:rgba(126,160,172,.10);color:#dcecf0;font-family:'JetBrains Mono',monospace;font-size:9px;line-height:1.25;padding:9px;white-space:normal;overflow-wrap:anywhere}",
      ".v1839-rail{display:flex;gap:10px;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x proximity;padding:2px 2px 10px;margin-top:8px}.v1839-coverage-card,.v1839-trust-plan,.v1839-child-card{flex:0 0 235px;scroll-snap-align:start;border:1px solid rgba(255,255,255,.11);border-radius:12px;background:rgba(255,255,255,.045);color:#f6ead8;text-align:left;padding:12px;min-height:150px}.v1839-coverage-card.selected,.v1839-trust-plan.selected{border-color:rgba(240,202,123,.64);background:linear-gradient(135deg,rgba(65,48,26,.82),rgba(25,21,17,.96))}.v1839-coverage-card:disabled,.v1839-trust-plan:disabled{opacity:.45}.v1839-coverage-card span,.v1839-trust-plan span,.v1839-child-card span,.v1839-source-card span{display:block;color:#d8b16e;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.12em;font-size:9px}.v1839-coverage-card b,.v1839-trust-plan b,.v1839-child-card b,.v1839-source-card b{display:block;color:#fff3df;font-size:17px;line-height:1.1;margin-top:5px}.v1839-coverage-card em,.v1839-trust-plan em,.v1839-child-card em,.v1839-source-card em{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.4;font-style:normal;margin-top:7px}.v1839-coverage-card strong,.v1839-trust-plan strong{display:block;color:#f0ca7b;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.35;margin-top:8px}",
      ".v1839-source-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.v1839-source-card{border:1px solid rgba(255,255,255,.11);border-radius:12px;background:rgba(255,255,255,.045);padding:12px;min-width:0}.v1839-distribution-box{display:grid;grid-template-columns:minmax(0,1fr) minmax(260px,420px) auto;gap:10px;align-items:center;border:1px solid rgba(126,160,172,.26);border-radius:12px;background:rgba(126,160,172,.08);padding:12px;margin-top:12px}.v1839-distribution-box b{display:block;color:#fff3df}.v1839-distribution-box span{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.4}",
      ".v1839-family-fund{border-color:rgba(126,160,172,.38)!important;background:linear-gradient(135deg,rgba(21,39,42,.96),rgba(34,29,22,.96))!important}.v1839-trust-funding{border-color:rgba(185,220,138,.28)!important}.v1839-tax-desk{border-color:rgba(233,146,125,.34)!important}.v1839-coverage{border-color:rgba(126,160,172,.32)!important}.v1839-child-trusts{border-color:rgba(240,202,123,.30)!important}.v1839-empty{border:1px dashed rgba(255,255,255,.12);border-radius:12px;padding:14px;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.5}",
      ".v1846-succession-desk{border-color:rgba(185,220,138,.36)!important;background:linear-gradient(135deg,rgba(17,38,26,.96),rgba(34,27,21,.96))!important}",
      ".v1846-journey-banner{border:1px solid rgba(216,173,109,.30);border-radius:12px;background:linear-gradient(135deg,rgba(216,173,109,.12),rgba(126,160,172,.08));padding:12px 14px;color:#f0ca7b;font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.5}",
      ".v1839-history-row{display:grid;grid-template-columns:auto auto minmax(0,1fr);gap:10px;align-items:center;border-top:1px solid rgba(255,255,255,.08);padding:9px 0}.v1839-history-row:first-of-type{border-top:0}.v1839-history-row span,.v1839-history-row em{font-family:'JetBrains Mono',monospace;color:#b9a98e;font-size:10px;font-style:normal}.v1839-history-row b{color:#f0ca7b}",
      ".v1839-rail::-webkit-scrollbar,.v1839-action-row::-webkit-scrollbar{height:10px}.v1839-rail::-webkit-scrollbar-thumb,.v1839-action-row::-webkit-scrollbar-thumb{background:rgba(216,177,110,.72);border-radius:999px}.v1839-rail::-webkit-scrollbar-track,.v1839-action-row::-webkit-scrollbar-track{background:rgba(255,255,255,.05);border-radius:999px}",
      "@media(max-width:980px){.v1839-main-grid,.v1839-source-grid,.v1839-distribution-box{grid-template-columns:1fr}.v1839-metric-grid,.v1839-metric-grid.compact{display:flex;overflow-x:auto;padding-bottom:9px}.v1839-metric{flex:0 0 190px}.v1839-hero{grid-template-columns:1fr}.v1839-hero strong{text-align:left}.v1839-custom-row{grid-template-columns:1fr}.v1839-coverage-card,.v1839-trust-plan,.v1839-child-card{flex-basis:78vw}}"
    ].join("\n");
    document.head.appendChild(style);
  }

  if (window.registerLedgerSystem) {
    window.registerLedgerSystem({
      id: "tax-legal",
      file: "pages/systems/tax-legal.js",
      status: "active",
      globals: [
        "renderLegalHubV1839",
        "payTaxDebtV1839",
        "hireAccountantV1839",
        "hireAttorneyV1839",
        "createFamilyTrustV1839",
        "fundFamilyTrustV1839",
        "addPersonalFirmToFamilyTrustV1839",
        "allocateFamilyFundV1839",
        "legalProtectedAssetsV1839"
      ],
      notes: "Legal is now the Law Office system: tax payoff, accountant/attorney coverage, family trust setup, personal-firm funding into trust, child trust grants, and a family fund sleeve."
    });
  }
})();
