/* LEDGER PATCH v18.28: firm-level tax separation + interview options */
(function () {
  if (window.__ledgerV1828Loaded) return;
  window.__ledgerV1828Loaded = true;

  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (ch) {
      return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[ch];
    });
  }
  function num(v, fallback) {
    var n = Number(v);
    return Number.isFinite(n) ? n : (fallback || 0);
  }
  function clamp(v, min, max) {
    min = min == null ? 0 : min;
    max = max == null ? 100 : max;
    return Math.max(min, Math.min(max, num(v)));
  }
  function moneyFmt(v) {
    try { if (typeof money === "function") return money(Math.round(num(v))); } catch(e) {}
    var n = Math.round(num(v));
    var sign = n < 0 ? "-" : "";
    n = Math.abs(n);
    if (n >= 1e12) return sign + "$" + (n / 1e12).toFixed(1).replace(/\.0$/, "") + "T";
    if (n >= 1e9) return sign + "$" + (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
    if (n >= 1e6) return sign + "$" + (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1e4) return sign + "$" + Math.round(n / 1000) + "K";
    return sign + "$" + n.toLocaleString();
  }
  function pct(v) { return (num(v) * 100).toFixed(1).replace(/\.0$/, "") + "%"; }
  function signed(v) { v = Math.round(num(v)); return (v >= 0 ? "+" : "-") + moneyFmt(Math.abs(v)); }
  function toast(msg) {
    try { if (typeof addToast === "function") return addToast(msg); } catch(e) {}
    try { if (typeof addLog === "function") return addLog(msg); } catch(e) {}
  }
  function log(msg, deltas) {
    try { if (typeof addLog === "function") return addLog(msg, deltas || {}); } catch(e) {}
  }
  function saveRender() {
    try { if (typeof save === "function") save(); } catch(e) {}
    try { if (typeof render === "function") render(); } catch(e) {}
  }
  function ensure() {
    try { if (typeof window.__ledgerEnsureStateSync18261 === "function") window.__ledgerEnsureStateSync18261(); } catch(e) {}
    try { if (typeof ensureStateShape === "function") ensureStateShape(); } catch(e) {}
    if (typeof state === "undefined" && window.state) { try { state = window.state; } catch(e) {} }
    if (!window.state && typeof state !== "undefined") window.state = state;
    if (!window.state) window.state = {};
    try { if (typeof state === "undefined" || !state) state = window.state; } catch(e) {}
    var s = window.state;
    s.stats = s.stats || {};
    s.flags = s.flags || {};
    s.actionsTaken = s.actionsTaken || {};
    s.inventory = Array.isArray(s.inventory) ? s.inventory : [];
    s.finance = s.finance || {};
    s.finance.debts = s.finance.debts || {};
    s.finance.incomeSources = s.finance.incomeSources || {};
    s.finance.personalFirm = s.finance.personalFirm || { hired:false, staff:{ advisor:1, analyst:1, risk:1, tax:1 } };
    s.finance.personalFirm.staff = s.finance.personalFirm.staff || { advisor:1, analyst:1, risk:1, tax:1 };
    s.finance.taxPolicyV1828 = s.finance.taxPolicyV1828 || {};
    s.finance.taxPolicyV1828.processed = s.finance.taxPolicyV1828.processed || {};
    s.finance.firmTaxEventsV1828 = Array.isArray(s.finance.firmTaxEventsV1828) ? s.finance.firmTaxEventsV1828 : [];
    s.careerV1827 = s.careerV1827 || {};
    s.careerV1827.applications = Array.isArray(s.careerV1827.applications) ? s.careerV1827.applications : [];
    s.careerV1827.offers = Array.isArray(s.careerV1827.offers) ? s.careerV1827.offers : [];
    s.careerV1827.history = Array.isArray(s.careerV1827.history) ? s.careerV1827.history : [];
    s.careerV1828 = s.careerV1828 || {};
    s.careerV1828.interviewHistory = Array.isArray(s.careerV1828.interviewHistory) ? s.careerV1828.interviewHistory : [];
    return s;
  }

  var TAX_PROFILES = [
    { id:"us", name:"United States", personal:.22, invest:.15, entity:.21, regions:[["pa","Pennsylvania",.0307],["de","Delaware",.038],["ny","New York",.062],["ca","California",.085],["tx","Texas",0],["fl","Florida",0],["wa","Washington",0],["il","Illinois",.0495],["ma","Massachusetts",.05],["co","Colorado",.044]] },
    { id:"canada", name:"Canada", personal:.26, invest:.18, entity:.15, regions:[["on","Ontario",.08],["bc","British Columbia",.075],["ab","Alberta",.045]] },
    { id:"uk", name:"United Kingdom", personal:.28, invest:.20, entity:.19, regions:[["eng","England",0],["sct","Scotland",.025]] },
    { id:"germany", name:"Germany", personal:.32, invest:.22, entity:.16, regions:[["berlin","Berlin",0],["bavaria","Bavaria",.01]] },
    { id:"france", name:"France", personal:.31, invest:.22, entity:.25, regions:[["idf","Île-de-France",.015],["south","South",0]] },
    { id:"singapore", name:"Singapore", personal:.14, invest:.05, entity:.17, regions:[["central","Central",0]] },
    { id:"uae", name:"United Arab Emirates", personal:.02, invest:0, entity:.09, regions:[["dubai","Dubai",0],["abudhabi","Abu Dhabi",0]] },
    { id:"thailand", name:"Thailand", personal:.16, invest:.08, entity:.20, regions:[["bangkok","Bangkok",0],["phuket","Phuket",.005],["chiangmai","Chiang Mai",-.01]] },
    { id:"vietnam", name:"Vietnam", personal:.17, invest:.08, entity:.20, regions:[["hcmc","Ho Chi Minh City",0],["danang","Da Nang",-.008],["hanoi","Hanoi",0]] }
  ];
  function profile(id) { return TAX_PROFILES.find(function (p) { return p.id === id; }) || TAX_PROFILES[0]; }
  function region(p, id) { return (p.regions || []).find(function (r) { return r[0] === id; }) || (p.regions || [])[0] || ["default", "Default", 0]; }
  function marginalRate(taxable) {
    taxable = Math.max(0, num(taxable));
    if (taxable >= 1000000) return .32;
    if (taxable >= 250000) return .26;
    if (taxable >= 100000) return .21;
    if (taxable >= 25000) return .16;
    if (taxable > 0) return .10;
    return 0;
  }
  function accountantFactor() {
    var f = ensure().finance || {};
    var raw = String(f.accountant || f.accountantPlan || "none").toLowerCase();
    if (/elite|tax_law|wealth|family|global/.test(raw)) return { label:"Elite tax counsel", reduction:.20, audit:-14 };
    if (/cpa|advisor|pro/.test(raw)) return { label:"CPA Advisor", reduction:.12, audit:-8 };
    if (/local|preparer|basic/.test(raw)) return { label:"Local tax preparer", reduction:.06, audit:-4 };
    return { label:"No accountant", reduction:0, audit:4 };
  }
  function attorneyFactor() {
    var f = ensure().finance || {};
    var raw = String(f.attorney || f.attorneyPlan || f.legalPlan || "none").toLowerCase();
    if (/elite|tax_law|wealth|global|firm/.test(raw)) return { label:"Tax attorney exemption", reduction:.18, audit:-12 };
    if (/attorney|lawyer|legal|counsel|business/.test(raw)) return { label:"Business attorney review", reduction:.10, audit:-7 };
    return { label:"No attorney exemption", reduction:0, audit:0 };
  }
  function entityRate() {
    var s = ensure();
    var p = profile((s.finance || {}).taxCountry || "us");
    return Math.max(.01, num(p.entity, .21));
  }
  function isEntityBusinessActive() {
    var f = ensure().finance || {};
    var pf = f.personalFirm || {};
    var business = Math.max(0, num(f.lastEntrepreneurIncome || f.lastBusinessIncome));
    return !!(pf.hired || num(f.managedPortfolio) > 0 || num(pf.lastReturn) > 0 || business >= 500000);
  }
  function currentBusinessProfit() {
    var f = ensure().finance || {};
    var pf = f.personalFirm || {};
    var business = Math.max(0, num(f.lastEntrepreneurIncome || f.lastBusinessIncome));
    var firmReturn = Math.max(0, num(pf.lastReturn));
    var explicit = Math.max(0, num(f.lastPersonalFirmProfit || f.firmProfitV1828));
    return isEntityBusinessActive() ? Math.max(explicit, business, firmReturn) : 0;
  }
  function passThroughBusinessIncome() {
    var f = ensure().finance || {};
    var business = Math.max(0, num(f.lastEntrepreneurIncome || f.lastBusinessIncome));
    return isEntityBusinessActive() ? 0 : business;
  }
  function cashDistributions() {
    var f = ensure().finance || {};
    var src = f.incomeSources || {};
    return Math.max(0, num(f.lastFirmDistribution) + num(src.firmDistribution) + num(src.fundCarryV1825));
  }
  function realizedInvestmentIncome() {
    var f = ensure().finance || {};
    var src = f.incomeSources || {};
    var stocks = f.stocksV18 || {};
    return Math.max(0, num(src.dividends) + num(src.realizedGains) + num(stocks.lastDividends) + num(f.lastDividendIncome));
  }
  function personalTaxableModel() {
    var s = ensure();
    var salary = Math.max(0, num(s.job && s.job.salary));
    var passThrough = passThroughBusinessIncome();
    var distributions = cashDistributions();
    var invest = realizedInvestmentIncome();
    return { salary:salary, passThrough:passThrough, distributions:distributions, investment:invest, taxable:salary + passThrough + distributions + invest };
  }
  function firmAssetsAvailable() {
    var f = ensure().finance || {};
    return Math.max(0, num(f.managedPortfolio) + num((f.personalFirm || {}).cash) + num(f.businessCash) + num(f.firmCashV1828));
  }
  function pullFirmAssets(amount) {
    var s = ensure();
    var f = s.finance || {};
    var remaining = Math.max(0, Math.round(num(amount)));
    var used = [];
    function take(obj, key, label) {
      if (!remaining || !obj) return;
      var val = Math.max(0, Math.round(num(obj[key])));
      var amt = Math.min(val, remaining);
      if (amt > 0) {
        obj[key] = Math.max(0, val - amt);
        remaining -= amt;
        used.push(label + " " + moneyFmt(amt));
      }
    }
    take(f, "firmCashV1828", "firm cash");
    take(f.personalFirm || {}, "cash", "firm reserve");
    take(f, "businessCash", "business cash");
    take(f, "managedPortfolio", "managed portfolio");
    return { paid:Math.round(num(amount) - remaining), remaining:remaining, used:used };
  }
  function firmEntityTaxFor(profit) {
    var acct = accountantFactor();
    var atty = attorneyFactor();
    var exemption = Math.min(.45, acct.reduction + atty.reduction);
    var raw = Math.round(Math.max(0, num(profit)) * entityRate());
    return { raw:raw, exemption:exemption, savings:Math.round(raw * exemption), tax:Math.max(0, Math.round(raw * (1 - exemption))), accountant:acct, attorney:atty };
  }
  function setPersonalTaxDebt(value) {
    var s = ensure();
    var v = Math.max(0, Math.round(num(value)));
    s.finance.taxDebt = v;
    s.finance.debts = s.finance.debts || {};
    s.finance.debts.taxDebt = v;
    s.taxDebt = v;
    if (s.tax && typeof s.tax === "object") s.tax.taxDebt = v;
  }
  function reclassifyRecord(record, index, silent) {
    var s = ensure();
    var f = s.finance || {};
    if (!record || !num(record.business)) return false;
    if (!isEntityBusinessActive()) return false;
    var key = [record.age, index, Math.round(num(record.business)), Math.round(num(record.tax)), Math.round(num(record.investment))].join(":");
    if (f.taxPolicyV1828.processed[key]) return false;
    var oldTax = Math.max(0, Math.round(num(record.tax)));
    var personalBase = Math.max(0, num(record.investment));
    var reduction = Math.min(.35, Math.max(0, accountantFactor().reduction));
    var correctedPersonal = Math.round(personalBase * marginalRate(personalBase) * (1 - reduction));
    var overPersonal = Math.max(0, oldTax - correctedPersonal);
    var debtBefore = Math.max(0, num(f.taxDebt || (f.debts || {}).taxDebt || s.taxDebt));
    var unpaid = Math.max(0, num(record.unpaid));
    var paid = Math.max(0, num(record.paid));
    var debtReduction = Math.min(debtBefore, unpaid || overPersonal, overPersonal);
    if (debtReduction > 0) setPersonalTaxDebt(debtBefore - debtReduction);
    var refund = Math.min(paid, Math.max(0, overPersonal - debtReduction));
    if (refund > 0) s.money = Math.round(num(s.money) + refund);

    var entity = firmEntityTaxFor(record.business);
    var pull = pullFirmAssets(entity.tax);
    var unpaidEntity = Math.max(0, entity.tax - pull.paid);
    f.businessEntityTaxDebtV1828 = Math.max(0, Math.round(num(f.businessEntityTaxDebtV1828) + unpaidEntity));
    f.lastFirmEntityTaxV1828 = entity.tax;
    f.lastPersonalTaxableV1828 = correctedPersonal;
    f.taxPolicyV1828.processed[key] = true;
    f.firmTaxEventsV1828.unshift({ age:s.age || record.age || 0, firmProfit:Math.round(num(record.business)), oldPersonalTax:oldTax, correctedPersonalTax:correctedPersonal, personalRefund:refund, personalDebtReduced:debtReduction, entityTax:entity.tax, entityPaid:pull.paid, entityDebt:unpaidEntity, sources:pull.used, accountant:entity.accountant.label, attorney:entity.attorney.label });
    f.firmTaxEventsV1828 = f.firmTaxEventsV1828.slice(0, 12);
    if (!silent) {
      log("Reclassified firm profit taxes: personal bill reduced by " + moneyFmt(refund + debtReduction) + "; firm/entity tax handled separately.", { money:refund, taxDebt:-debtReduction });
    }
    return true;
  }
  function reconcileFirmTax(silent) {
    var s = ensure();
    var f = s.finance || {};
    var arr = Array.isArray(f.taxTrueUpsV1824) ? f.taxTrueUpsV1824 : [];
    var changed = false;
    arr.forEach(function (rec, idx) {
      try { if (reclassifyRecord(rec, idx, silent)) changed = true; } catch(e) { try { console.warn("v18.28 firm tax reclass failed", e); } catch(ignore) {} }
    });
    return changed;
  }
  window.reconcileFirmTaxV1828 = function () {
    var changed = reconcileFirmTax(false);
    if (!changed) toast("No unreconciled firm-profit tax found. Future years will separate firm and personal tax automatically.");
    saveRender();
  };
  window.payFirmEntityTaxV1828 = function (rawAmount) {
    var s = ensure();
    var f = s.finance || {};
    var debt = Math.max(0, Math.round(num(f.businessEntityTaxDebtV1828)));
    if (!debt) return toast("No firm/entity tax debt due.");
    var amount = rawAmount === "max" ? debt : Math.max(0, Math.round(num(rawAmount)));
    amount = Math.min(amount, debt);
    var pull = pullFirmAssets(amount);
    if (!pull.paid) return toast("No firm assets available. Distribute nothing personally until the firm has cash.");
    f.businessEntityTaxDebtV1828 = Math.max(0, debt - pull.paid);
    log("Firm paid " + moneyFmt(pull.paid) + " entity tax from " + (pull.used.join(", ") || "firm assets") + ".", {});
    saveRender();
  };
  window.applyFirmExemptionV1828 = function () {
    var s = ensure();
    var f = s.finance || {};
    var debt = Math.max(0, Math.round(num(f.businessEntityTaxDebtV1828)));
    if (!debt) return toast("No firm/entity tax debt to reduce.");
    var acct = accountantFactor();
    var atty = attorneyFactor();
    var reduction = Math.min(.35, acct.reduction + atty.reduction);
    if (!reduction) return toast("Hire an accountant or business/tax attorney first.");
    var saved = Math.round(debt * reduction);
    f.businessEntityTaxDebtV1828 = Math.max(0, debt - saved);
    f.firmTaxEventsV1828.unshift({ age:s.age || 0, firmProfit:0, exemptionOnly:true, entityTax:0, entityPaid:0, entityDebt:f.businessEntityTaxDebtV1828, savings:saved, accountant:acct.label, attorney:atty.label });
    log("Legal/accounting exemption reduced firm/entity tax by " + moneyFmt(saved) + ".", { taxDebt:-saved });
    saveRender();
  };

  var prevResolve = window.resolveLifeAndFinanceYear || (typeof resolveLifeAndFinanceYear === "function" ? resolveLifeAndFinanceYear : null);
  if (prevResolve && !window.__ledgerResolve1828Wrapped) {
    window.__ledgerResolve1828Wrapped = true;
    window.resolveLifeAndFinanceYear = function () {
      var out = prevResolve.apply(this, arguments);
      try { reconcileFirmTax(false); } catch(e) { try { console.warn("v18.28 firm tax yearly failed", e); } catch(ignore) {} }
      return out;
    };
    try { resolveLifeAndFinanceYear = window.resolveLifeAndFinanceYear; } catch(e) {}
  }

  function taxOffice1828() {
    var s = ensure();
    reconcileFirmTax(true);
    var f = s.finance || {};
    var p = profile(f.taxCountry || "us");
    var r = region(p, f.taxRegion || (p.regions[0] && p.regions[0][0]));
    var personal = personalTaxableModel();
    var firmProfit = currentBusinessProfit();
    var entity = firmEntityTaxFor(firmProfit);
    var personalRate = p.personal + num(r[2]);
    var personalTax = Math.round((personal.salary + personal.passThrough + personal.distributions) * personalRate + personal.investment * p.invest);
    var personalDebt = Math.max(0, num(f.taxDebt || (f.debts || {}).taxDebt || s.taxDebt));
    var entityDebt = Math.max(0, num(f.businessEntityTaxDebtV1828));
    var lastEvent = (f.firmTaxEventsV1828 || [])[0];
    return `<section class="money-section v1828-tax-office">
      <div class="money-section-title">Tax Office <span>personal vs firm/entity</span></div>
      <div class="v1828-note">Firm profit is not personal income until it is distributed, paid as salary/bonus, or treated as pass-through income. The player is taxed personally on salary, dividends, realized gains, and distributions. The firm pays entity tax from firm assets.</div>
      <div class="v1828-grid four">
        <div class="v1828-card gold"><span>Where you live</span><b>${esc(p.name)} / ${esc(r[1])}</b><em>Personal income model: ${pct(personalRate)} wages + ${pct(p.invest)} realized investment.</em></div>
        <div class="v1828-card ${personal.taxable ? "bad" : "good"}"><span>Personal taxable</span><b>${moneyFmt(personal.taxable)}</b><em>Salary ${moneyFmt(personal.salary)} · distributions ${moneyFmt(personal.distributions)} · investment ${moneyFmt(personal.investment)}.</em></div>
        <div class="v1828-card ${firmProfit ? "good" : "gold"}"><span>Firm profit</span><b>${moneyFmt(firmProfit)}</b><em>Held inside the business/firm, not personally taxed until distribution.</em></div>
        <div class="v1828-card ${entityDebt ? "bad" : "good"}"><span>Separate firm tax debt</span><b>${moneyFmt(entityDebt)}</b><em>Paid by firm assets, not checking.</em></div>
      </div>
      <div class="v1828-split">
        <div><b>Personal tax estimate</b><span>${moneyFmt(personalTax)} projected from personal taxable events. Current personal tax debt: ${moneyFmt(personalDebt)}.</span></div>
        <div><b>Firm/entity tax estimate</b><span>${pct(entityRate())} entity rate, ${pct(entity.exemption)} exemption help → ${moneyFmt(entity.tax)} estimated on current firm profit.</span></div>
        <div><b>Lawyer/accountant effect</b><span>${esc(entity.accountant.label)} + ${esc(entity.attorney.label)}. These reduce entity exposure and audit/legal risk.</span></div>
        <div><b>Last correction</b><span>${lastEvent ? `Reclassified ${moneyFmt(lastEvent.firmProfit || 0)} firm profit; personal relief ${moneyFmt((lastEvent.personalRefund || 0) + (lastEvent.personalDebtReduced || 0))}.` : "No firm-tax correction recorded yet."}</span></div>
      </div>
      <div class="v1828-actions"><button class="money-btn gold" onclick="event.preventDefault();event.stopPropagation();reconcileFirmTaxV1828()">Reclassify Current Tax Bill</button><button class="money-btn green" onclick="event.preventDefault();event.stopPropagation();applyFirmExemptionV1828()" ${entityDebt ? "" : "disabled"}>Use Legal Exemption</button><button class="money-btn red" onclick="event.preventDefault();event.stopPropagation();payFirmEntityTaxV1828('max')" ${entityDebt ? "" : "disabled"}>Firm Pay Max</button></div>
    </section>`;
  }
  function firmTaxLedger1828() {
    var s = ensure();
    reconcileFirmTax(true);
    var f = s.finance || {};
    var personal = personalTaxableModel();
    var firmProfit = currentBusinessProfit();
    var entity = firmEntityTaxFor(firmProfit);
    var entityDebt = Math.max(0, num(f.businessEntityTaxDebtV1828));
    return `<section class="money-section v1828-firm-tax-ledger">
      <div class="money-section-title">Firm Tax Ledger <span>no more personal over-taxing</span></div>
      <div class="v1828-grid four"><div class="v1828-card good"><span>Firm profit</span><b>${moneyFmt(firmProfit)}</b><em>Company money.</em></div><div class="v1828-card gold"><span>Distributed to you</span><b>${moneyFmt(personal.distributions)}</b><em>This becomes personal taxable cash.</em></div><div class="v1828-card bad"><span>Entity tax estimate</span><b>${moneyFmt(entity.tax)}</b><em>Paid by firm assets.</em></div><div class="v1828-card ${entityDebt ? "bad" : "good"}"><span>Entity debt</span><b>${moneyFmt(entityDebt)}</b><em>Separate from personal tax debt.</em></div></div>
      <div class="v1828-actions"><button class="money-btn gold" onclick="event.preventDefault();event.stopPropagation();reconcileFirmTaxV1828()">Fix/Reclassify</button><button class="money-btn red" onclick="event.preventDefault();event.stopPropagation();payFirmEntityTaxV1828(1000000)" ${entityDebt ? "" : "disabled"}>Firm Pay $1M</button><button class="money-btn red" onclick="event.preventDefault();event.stopPropagation();payFirmEntityTaxV1828('max')" ${entityDebt ? "" : "disabled"}>Firm Pay Max</button></div>
    </section>`;
  }

  var DEGREE_JOB_MAP = {
    business:["analyst","marketing","office","finance_manager"], finance:["analyst","finance_manager","wealth_advisor","quant_finance"], cs:["software","cybersecurity","quant_finance"], nursing:["nurse"], education:["teacher"], law:["attorney","paralegal"], medical:["doctor"], biology:["labtech","nurse","doctor"], criminaljustice:["paralegal"], psychology:["counselor"]
  };
  var EXTRA_JOBS = [
    { id:"finance_manager", title:"Finance Manager", salary:118000, minAge:24, degrees:["business","finance"], desc:"Corporate budgets, forecasts, and executive reporting." },
    { id:"wealth_advisor", title:"Wealth Advisor", salary:98000, minAge:23, degrees:["finance","business"], desc:"Client portfolios and long-term financial planning." },
    { id:"cybersecurity", title:"Cybersecurity Analyst", salary:104000, minAge:22, degrees:["cs"], desc:"Protect systems, investigate threats, and harden networks." },
    { id:"attorney", title:"Associate Attorney", salary:105000, minAge:25, degrees:["law"], desc:"Legal career path with casework, clients, and high pressure." },
    { id:"doctor", title:"Resident Physician", salary:72000, minAge:26, degrees:["medical"], desc:"Medical career path with long training and high ceiling." },
    { id:"quant_finance", title:"Quant Finance Analyst", salary:145000, minAge:23, degrees:["finance","cs"], desc:"Math, markets, models, and high interview standards." }
  ];
  function degreeIds() {
    var s = ensure();
    var ids = [];
    if (s.major) ids.push(String(s.major).toLowerCase());
    Object.keys(s.flags || {}).forEach(function (key) {
      if (key.indexOf("degree_") === 0 && s.flags[key]) ids.push(key.replace("degree_", ""));
    });
    try { (s.educationV1825.degrees || []).forEach(function (d) { if (d && d.id && (d.completed || d.yearsDone >= d.years)) ids.push(String(d.id).toLowerCase()); }); } catch(e) {}
    return Array.from(new Set(ids.map(function (x) { return x === "computer science" ? "cs" : x; })));
  }
  function allJobs() {
    var jobs = [];
    try { if (typeof careerCatalog !== "undefined" && Array.isArray(careerCatalog)) jobs = jobs.concat(careerCatalog); } catch(e) {}
    try { if (Array.isArray(window.careerCatalog)) jobs = jobs.concat(window.careerCatalog); } catch(e) {}
    EXTRA_JOBS.forEach(function (j) { if (!jobs.some(function (x) { return x.id === j.id; })) jobs.push(j); });
    return jobs;
  }
  function jobById(id) { return allJobs().find(function (j) { return j.id === id; }) || null; }
  function requiredDegrees(job) {
    var out = [];
    Object.keys(DEGREE_JOB_MAP).forEach(function (deg) { if ((DEGREE_JOB_MAP[deg] || []).indexOf(job.id) >= 0) out.push(deg); });
    if (Array.isArray(job.degrees)) out = out.concat(job.degrees);
    return Array.from(new Set(out));
  }
  function qualifies(job) {
    var s = ensure();
    if (!job) return false;
    if (num(s.age) < num(job.minAge)) return false;
    var reqDeg = requiredDegrees(job);
    var ids = degreeIds();
    if (reqDeg.length && !reqDeg.some(function (d) { return ids.indexOf(d) >= 0; })) return false;
    if (!reqDeg.length && job.req) { try { return !!job.req(s); } catch(e) { return false; } }
    return true;
  }
  function missing(job) {
    var bits = [];
    if (num(ensure().age) < num(job.minAge)) bits.push("Age " + num(job.minAge) + "+");
    var reqDeg = requiredDegrees(job);
    var ids = degreeIds();
    if (reqDeg.length && !reqDeg.some(function (d) { return ids.indexOf(d) >= 0; })) bits.push("Degree: " + reqDeg.map(function (d) { return d === "cs" ? "Computer Science" : d.charAt(0).toUpperCase() + d.slice(1); }).join(" / "));
    if (!bits.length && job.req) bits.push("Career-specific requirement");
    return bits.join(" · ") || "Qualified";
  }
  function activeApp(jobId) {
    return (ensure().careerV1827.applications || []).find(function (a) { return a.jobId === jobId && !a.closed; });
  }
  function activeOffer(jobId) {
    return (ensure().careerV1827.offers || []).find(function (o) { return o.jobId === jobId && !o.closed; });
  }
  function fitScore(job) {
    var s = ensure();
    var stats = s.stats || {};
    var smarts = num(stats.smarts || s.smarts || s.iq / 2, 50);
    var confidence = num(stats.confidence || s.confidence, 50);
    var discipline = num(stats.discipline || s.discipline, 50);
    var charisma = num(stats.charisma || stats.social || s.charisma || s.social, confidence);
    var degreeFit = qualifies(job) ? 25 : 0;
    var stressPenalty = Math.max(0, num(s.stress || stats.stress) - 55) / 2;
    var healthPenalty = Math.max(0, 50 - num(s.health || stats.health, 70)) / 3;
    return Math.round(clamp(20 + degreeFit + smarts*.15 + confidence*.17 + discipline*.12 + charisma*.14 - stressPenalty - healthPenalty, 0, 100));
  }
  window.applyToJobV1828 = function (jobId) {
    var s = ensure();
    var job = jobById(jobId);
    if (!job) return toast("Job not found.");
    if (!qualifies(job)) return toast("Missing: " + missing(job));
    if (s.job && s.job.jobId === job.id) return toast("You already have that job.");
    if (activeOffer(job.id)) return toast("You already have an offer waiting.");
    if (activeApp(job.id)) return toast("Application is already active. Prep or start the interview.");
    var app = { id:"app28-" + Date.now(), jobId:job.id, title:job.title, salary:job.salary, stage:"applied", rounds:0, score:fitScore(job), prep:{ research:0, resume:0, practice:0, network:0, mock:0, rest:0 }, prepPoints:0, referral:false, createdAge:s.age || 0, closed:false };
    s.careerV1827.applications.unshift(app);
    s.careerV1827.applications = s.careerV1827.applications.slice(0, 14);
    log("Applied for " + job.title + ". Choose prep actions before the interview.", { confidence:1, stress:1 });
    saveRender();
  };
  function applyDelta(deltas) { try { if (typeof applyDeltas === "function") applyDeltas(deltas); } catch(e) {} }
  window.prepApplicationV1828 = function (jobId, type) {
    var s = ensure();
    var app = activeApp(jobId);
    if (!app) return toast("Apply first, then prep.");
    app.prep = app.prep || { research:0, resume:0, practice:0, network:0, mock:0, rest:0 };
    var rules = {
      research:{ label:"researched the company", cost:0, points:7, max:3, deltas:{ smarts:1, discipline:1, stress:1 } },
      resume:{ label:"updated résumé/portfolio", cost:150, points:8, max:2, deltas:{ confidence:2, discipline:1 } },
      practice:{ label:"practiced STAR interview answers", cost:0, points:8, max:4, deltas:{ confidence:2, stress:-1 } },
      network:{ label:"asked for a referral", cost:100, points:10, max:2, deltas:{ popularity:1, confidence:1, stress:1 } },
      mock:{ label:"did a mock interview", cost:300, points:13, max:2, deltas:{ confidence:3, discipline:2, stress:-1 } },
      rest:{ label:"rested before the interview", cost:0, points:4, max:2, deltas:{ stress:-4, energy:3, mentalHealth:2 } }
    };
    var rule = rules[type];
    if (!rule) return toast("Unknown prep action.");
    if (num(app.prep[type]) >= rule.max) return toast("That prep option is maxed for this application.");
    if (rule.cost && num(s.money) < rule.cost) return toast("Need " + moneyFmt(rule.cost) + " for that prep.");
    if (rule.cost) s.money = Math.round(num(s.money) - rule.cost);
    app.prep[type] = num(app.prep[type]) + 1;
    app.prepPoints = num(app.prepPoints) + rule.points;
    if (type === "network" && Math.random() < .35 + Math.min(.25, num(app.prep.network) * .1)) app.referral = true;
    log("Interview prep: you " + rule.label + " for " + app.title + ".", Object.assign({}, rule.deltas, rule.cost ? { money:-rule.cost } : {}));
    applyDelta(rule.deltas);
    saveRender();
  };
  window.startInterviewV1828 = function (jobId) {
    var app = activeApp(jobId);
    if (!app) return toast("Apply before interviewing.");
    app.stage = "question";
    app.question = ["Tell us about a time you solved a hard problem.", "Why do you want this role?", "How would you handle a stressful day on the job?", "What makes you ready for this work?"][Math.floor(Math.random()*4)];
    log("Interview started for " + app.title + ". Choose how to answer.", { stress:1 });
    saveRender();
  };
  function answerBonus(type, app) {
    var s = ensure();
    var st = s.stats || {};
    if (type === "experience") return num(st.discipline || s.discipline, 50) * .16 + num(app.prep && app.prep.resume) * 5;
    if (type === "technical") return num(st.smarts || s.smarts || s.iq/2, 50) * .18 + num(app.prep && app.prep.research) * 5;
    if (type === "people") return num(st.charisma || st.confidence || s.confidence, 50) * .18 + (app.referral ? 10 : 0);
    if (type === "questions") return num(st.confidence || s.confidence, 50) * .12 + num(app.prep && app.prep.research) * 6 + num(app.prep && app.prep.practice) * 3;
    return 0;
  }
  window.answerInterviewV1828 = function (jobId, type) {
    var s = ensure();
    var app = activeApp(jobId);
    var job = jobById(jobId) || { id:jobId, title:app && app.title, salary:app && app.salary };
    if (!app) return toast("No active interview found.");
    if (app.stage !== "question") return toast("Start the interview first.");
    var threshold = num(job.salary || app.salary) >= 180000 ? 82 : num(job.salary || app.salary) >= 95000 ? 70 : 58;
    var prep = Math.min(28, num(app.prepPoints) * .55);
    var score = Math.round(num(app.score || fitScore(job), 50) + prep + answerBonus(type, app) + (Math.random()*18 - 8) + num(app.rounds)*4);
    app.rounds = num(app.rounds) + 1;
    app.lastAnswer = type;
    app.lastInterviewScore = score;
    if (score >= threshold + 14) {
      app.closed = true; app.stage = "offer";
      var strongSalary = Math.round(num(job.salary || app.salary) * (1.08 + Math.random() * .10));
      s.careerV1827.offers.unshift({ jobId:job.id, title:job.title || app.title, salary:strongSalary, baseSalary:job.salary || app.salary, strength:"strong", createdAge:s.age || 0, closed:false });
      log("Excellent interview: " + (job.title || app.title) + " offered " + moneyFmt(strongSalary) + "/yr.", { confidence:4, stress:-2 });
      applyDelta({ confidence:4, stress:-2 });
    } else if (score >= threshold) {
      app.closed = true; app.stage = "offer";
      var salary = Math.round(num(job.salary || app.salary) * (.96 + Math.random() * .10));
      s.careerV1827.offers.unshift({ jobId:job.id, title:job.title || app.title, salary:salary, baseSalary:job.salary || app.salary, strength:"standard", createdAge:s.age || 0, closed:false });
      log("Interview passed: " + (job.title || app.title) + " made an offer for " + moneyFmt(salary) + "/yr.", { confidence:2, stress:-1 });
      applyDelta({ confidence:2, stress:-1 });
    } else if (score >= threshold - 12 && app.rounds < 2) {
      app.stage = "second_interview";
      app.question = "Second interview: explain why you are the safest hire.";
      log("You reached a second interview for " + app.title + ". Prep again or answer the next round.", { stress:2 });
      applyDelta({ stress:2 });
    } else {
      app.closed = true; app.stage = "rejected";
      s.careerV1827.history.unshift({ jobId:job.id, title:job.title || app.title, outcome:"Rejected", score:score, age:s.age || 0 });
      log("Interview result: " + app.title + " passed this time. Use prep actions and try again.", { confidence:-1, stress:2 });
      applyDelta({ confidence:-1, stress:2 });
    }
    s.careerV1828.interviewHistory.unshift({ age:s.age || 0, title:app.title, answer:type, score:score, threshold:threshold, outcome:app.stage });
    s.careerV1828.interviewHistory = s.careerV1828.interviewHistory.slice(0, 10);
    saveRender();
  };
  window.interviewForJobV1827 = window.startInterviewV1828;
  window.applyToJobV1827 = window.applyToJobV1828;
  try { interviewForJobV1827 = window.interviewForJobV1827; applyToJobV1827 = window.applyToJobV1827; } catch(e) {}
  window.acceptJobOfferV1828 = function (jobId) {
    var s = ensure();
    var offer = activeOffer(jobId);
    var job = jobById(jobId) || { id:jobId, title:offer && offer.title, salary:offer && offer.salary };
    if (!offer) return toast("No offer waiting for that job.");
    offer.closed = true; offer.accepted = true;
    s.careerV1827.applications.forEach(function (a) { if (a.jobId === jobId) a.closed = true; });
    s.job = { jobId:job.id, title:job.title || offer.title, salary:Math.round(num(offer.salary || job.salary)), performance:50, stress:0, tier:0 };
    s.careerV1827.history.unshift({ jobId:job.id, title:job.title || offer.title, outcome:"Accepted", salary:offer.salary, age:s.age || 0 });
    log("Accepted the " + (job.title || offer.title) + " offer.", { happiness:4, stress:3, confidence:2 });
    applyDelta({ happiness:4, stress:3, confidence:2 });
    saveRender();
  };
  window.acceptJobOfferV1827 = window.acceptJobOfferV1828;
  try { acceptJobOfferV1827 = window.acceptJobOfferV1827; } catch(e) {}

  function prepButtons(app) {
    var rows = [
      ["research", "Research", "Free"], ["resume", "Résumé", "$150"], ["practice", "Practice", "Free"], ["network", "Referral", "$100"], ["mock", "Mock", "$300"], ["rest", "Rest", "Free"]
    ];
    return rows.map(function (r) {
      var count = num(app.prep && app.prep[r[0]]);
      return `<button class="money-btn" onclick="event.preventDefault();event.stopPropagation();prepApplicationV1828('${esc(app.jobId)}','${r[0]}')">${r[1]} <small>${count}</small></button>`;
    }).join("");
  }
  function answerButtons(app) {
    if (app.stage !== "question" && app.stage !== "second_interview") return `<button class="money-btn gold" onclick="event.preventDefault();event.stopPropagation();startInterviewV1828('${esc(app.jobId)}')">Start Interview</button>`;
    return `<div class="v1828-question"><b>${esc(app.question || "Interview question")}</b><span>Pick your answer style. Prep actions improve the score.</span></div><div class="v1828-actions"><button class="money-btn green" onclick="event.preventDefault();event.stopPropagation();answerInterviewV1828('${esc(app.jobId)}','experience')">Use Experience</button><button class="money-btn blue" onclick="event.preventDefault();event.stopPropagation();answerInterviewV1828('${esc(app.jobId)}','technical')">Show Technical Skill</button><button class="money-btn gold" onclick="event.preventDefault();event.stopPropagation();answerInterviewV1828('${esc(app.jobId)}','people')">Connect With Panel</button><button class="money-btn" onclick="event.preventDefault();event.stopPropagation();answerInterviewV1828('${esc(app.jobId)}','questions')">Ask Smart Questions</button></div>`;
  }
  function renderCareer1828() {
    var s = ensure();
    var jobs = allJobs().slice().sort(function (a,b) { return num(a.minAge) - num(b.minAge) || num(b.salary) - num(a.salary); }).slice(0, 24);
    var active = (s.careerV1827.applications || []).filter(function (a) { return !a.closed; });
    var offers = (s.careerV1827.offers || []).filter(function (o) { return !o.closed; });
    var pipeline = "";
    if (offers.length) pipeline += offers.map(function (o) { return `<div class="v1828-pipeline-card offer"><div><b>${esc(o.title)}</b><span>${esc(o.strength || "standard")} offer · ${moneyFmt(o.salary)}/yr</span></div><div class="v1828-actions"><button class="money-btn green" onclick="event.preventDefault();event.stopPropagation();acceptJobOfferV1828('${esc(o.jobId)}')">Accept</button><button class="money-btn" onclick="event.preventDefault();event.stopPropagation();declineJobOfferV1827 && declineJobOfferV1827('${esc(o.jobId)}')">Decline</button></div></div>`; }).join("");
    if (active.length) pipeline += active.map(function (a) { a.prep = a.prep || {}; return `<div class="v1828-pipeline-card"><div class="v1828-pipeline-top"><div><b>${esc(a.title)}</b><span>${esc(a.stage === "second_interview" ? "Second interview" : a.stage === "question" ? "Interview question" : "Application active")} · fit ${Math.round(num(a.score))}/100 · prep ${Math.round(num(a.prepPoints))}</span></div><strong>${a.referral ? "Referral" : "No referral"}</strong></div><div class="v1828-prep-row">${prepButtons(a)}</div>${answerButtons(a)}</div>`; }).join("");
    if (!pipeline) pipeline = `<div class="v1828-note small">No active applications. Qualified jobs below now require: apply → prep → interview answers → offer → accept.</div>`;
    var jobCards = jobs.map(function (job) {
      var q = qualifies(job);
      var app = activeApp(job.id);
      var offer = activeOffer(job.id);
      var current = s.job && s.job.jobId === job.id;
      var action = current ? `<button class="money-btn" disabled>Current</button>` : offer ? `<button class="money-btn green" onclick="event.preventDefault();event.stopPropagation();acceptJobOfferV1828('${esc(job.id)}')">Accept Offer</button>` : app ? `<button class="money-btn gold" onclick="event.preventDefault();event.stopPropagation();startInterviewV1828('${esc(job.id)}')">Interview</button>` : q ? `<button class="money-btn blue" onclick="event.preventDefault();event.stopPropagation();applyToJobV1828('${esc(job.id)}')">Apply</button>` : `<button class="money-btn" disabled>Locked</button>`;
      var cls = current ? "current" : offer ? "offer" : app ? "interview" : q ? "qualified" : "locked";
      return `<div class="v1828-job-card ${cls}"><div class="v1828-job-head"><b>${esc(job.title || job.name || job.id)}</b><span>${current ? "Current" : offer ? "Offer" : app ? "Interviewing" : q ? "Qualified" : "Locked"}</span></div><p>${esc(job.desc || "Career path.")}</p><div class="v1828-pill-row"><span>${moneyFmt(job.salary || 0)}/yr base</span><span>Age ${num(job.minAge) || 16}+</span><span>${q ? "Fit " + fitScore(job) + "/100" : missing(job)}</span></div>${action}</div>`;
    }).join("");
    return `<section class="panel v1828-career-system"><div class="section-label">Career Applications + Interviews</div><div class="v1828-career-hero"><div><b>Jobs now have real hiring steps.</b><span>Degrees make you qualified, but you still apply, prepare, answer interview questions, and accept offers.</span></div></div><div class="v1828-pill-row"><span>Degrees: ${esc(degreeIds().join(", ") || "none")}</span><span>Applications: ${active.length}</span><span>Offers: ${offers.length}</span></div><div class="v1828-pipeline">${pipeline}</div><div class="v1828-job-grid">${jobCards}</div></section>`;
  }

  function removeSections(html, markers) {
    var out = String(html || "");
    markers.forEach(function (marker) {
      var idx = out.indexOf(marker);
      var guard = 0;
      while (idx >= 0 && guard++ < 30) {
        var start = out.lastIndexOf("<section", idx);
        if (start < 0) start = out.lastIndexOf("<div", idx);
        var secEnd = out.indexOf("</section>", idx);
        var divEnd = out.indexOf("</div>", idx);
        var end = secEnd >= 0 ? secEnd + 10 : (divEnd >= 0 ? divEnd + 6 : -1);
        if (start < 0 || end < 0 || end <= start) break;
        out = out.slice(0, start) + out.slice(end);
        idx = out.indexOf(marker);
      }
    });
    return out;
  }
  function insertAfterFirstSection(html, chunk) {
    var end = String(html || "").indexOf("</section>");
    return end >= 0 ? html.slice(0, end + 10) + chunk + html.slice(end + 10) : chunk + html;
  }

  var prevRender = window.renderHubContent || (typeof renderHubContent === "function" ? renderHubContent : null);
  if (prevRender && !window.__ledgerRender1828Wrapped) {
    window.__ledgerRender1828Wrapped = true;
    window.renderHubContent = function (hubId) {
      ensure();
      var html = "";
      try { html = prevRender.apply(this, arguments) || ""; } catch(e) { html = ""; }
      html = removeSections(html, ["v1824-business-tax", "v1827-tax-office", "v1828-tax-office", "v1828-firm-tax-ledger", "v1827-career-interviews", "v1824-career-reqs", "v1828-career-system"]);
      if (hubId === "law" || hubId === "legal") return taxOffice1828() + html;
      if (hubId === "money" || hubId === "finance") return insertAfterFirstSection(html, firmTaxLedger1828());
      if (hubId === "career") return renderCareer1828() + html;
      return html;
    };
    try { renderHubContent = window.renderHubContent; } catch(e) {}
  }

  function injectStyles() {
    if (document.getElementById("ledger-v1828-style")) return;
    var style = document.createElement("style");
    style.id = "ledger-v1828-style";
    style.textContent = [
      ".v1828-tax-office,.v1828-firm-tax-ledger,.v1828-career-system{border-color:rgba(126,160,172,.46)!important;background:linear-gradient(135deg,rgba(18,35,37,.96),rgba(29,25,20,.98))!important;overflow:hidden!important}",
      ".v1828-tax-office{border-color:rgba(216,173,109,.5)!important;background:linear-gradient(135deg,rgba(48,37,20,.97),rgba(24,21,18,.98))!important}.v1828-firm-tax-ledger{border-color:rgba(143,175,108,.45)!important}.v1828-career-system{border-color:rgba(126,160,172,.52)!important}",
      ".v1828-note{font-family:'JetBrains Mono',monospace;color:#cdbb9c;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.09);border-radius:12px;padding:10px 12px;font-size:10px;line-height:1.55;margin:9px 0}.v1828-note.small{color:#aa9a82}",
      ".v1828-grid{display:grid;gap:8px;margin:10px 0}.v1828-grid.four{grid-template-columns:repeat(4,minmax(0,1fr))}.v1828-card,.v1828-split>div,.v1828-pipeline-card,.v1828-job-card,.v1828-question{border:1px solid rgba(255,255,255,.10);border-radius:12px;background:rgba(255,255,255,.045);padding:11px;min-width:0}.v1828-card span,.v1828-card em,.v1828-split span,.v1828-pipeline-card span,.v1828-job-card p,.v1828-question span{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.45;margin-top:4px;font-style:normal}.v1828-card span{text-transform:uppercase;letter-spacing:.12em;font-size:9px}.v1828-card b,.v1828-split b,.v1828-pipeline-card b,.v1828-job-card b,.v1828-question b{display:block;color:#fff3df;font-size:15px;overflow-wrap:anywhere}.v1828-card b{font-family:'JetBrains Mono',monospace;font-size:18px;margin-top:5px}.v1828-card.good b,.v1828-pipeline-card.offer b{color:#b9dc8a}.v1828-card.bad b{color:#e9927d}.v1828-card.gold b{color:#d8ad6d}",
      ".v1828-split{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:9px 0}.v1828-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.v1828-actions .money-btn,.v1828-prep-row .money-btn{font-size:9px;padding:8px 10px}.v1828-prep-row{display:flex;gap:6px;flex-wrap:wrap;margin:9px 0}.v1828-prep-row small{opacity:.7;margin-left:3px}",
      ".v1828-career-hero{border:1px solid rgba(126,160,172,.25);border-radius:14px;background:linear-gradient(135deg,rgba(126,160,172,.12),rgba(201,155,85,.07));padding:14px;margin:8px 0 10px}.v1828-career-hero b{display:block;font-size:18px}.v1828-career-hero span{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.5;margin-top:5px}.v1828-pill-row{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}.v1828-pill-row span{font-family:'JetBrains Mono',monospace;font-size:9px;border:1px solid rgba(255,255,255,.10);border-radius:999px;padding:4px 8px;color:#d8ad6d;background:rgba(255,255,255,.04)}",
      ".v1828-pipeline{display:grid;gap:8px;margin:10px 0}.v1828-pipeline-top,.v1828-job-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.v1828-pipeline-top strong,.v1828-job-head span{font-family:'JetBrains Mono',monospace;color:#d8ad6d;font-size:9px;text-transform:uppercase;letter-spacing:.08em}.v1828-job-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.v1828-job-card.locked{opacity:.58}.v1828-job-card.qualified{border-color:rgba(126,160,172,.45)}.v1828-job-card.offer{border-color:rgba(143,175,108,.55)}.v1828-job-card.current{border-color:rgba(216,173,109,.65)}.v1828-job-card .money-btn{margin-top:8px;width:100%}",
      "@media(max-width:820px){.v1828-grid.four,.v1828-split,.v1828-job-grid{grid-template-columns:1fr 1fr}}@media(max-width:520px){.v1828-grid.four,.v1828-split,.v1828-job-grid{grid-template-columns:1fr}.v1828-actions .money-btn,.v1828-prep-row .money-btn{width:100%}}"
    ].join("\n");
    document.head.appendChild(style);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", injectStyles); else injectStyles();
})();

