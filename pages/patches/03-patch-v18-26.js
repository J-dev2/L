/* LEDGER PATCH v18.26: legal clarity, health insurance effects, relocation, wayback browser, save repair, sandbox calm */
(function () {
  if (window.__ledgerV1826Loaded) return;
  window.__ledgerV1826Loaded = true;

  function esc1826(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (ch) {
      return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[ch];
    });
  }
  function num1826(v, fallback) {
    var n = Number(v);
    return Number.isFinite(n) ? n : (fallback || 0);
  }
  function clamp1826(v, min, max) {
    min = min == null ? 0 : min;
    max = max == null ? 100 : max;
    return Math.max(min, Math.min(max, num1826(v)));
  }
  function money1826(v) {
    try { if (typeof money === "function") return money(Math.round(num1826(v))); } catch(e) {}
    v = Math.round(num1826(v));
    var sign = v < 0 ? "-" : "";
    v = Math.abs(v);
    if (v >= 1e15) return sign + "$" + (v / 1e15).toFixed(1).replace(/\.0$/, "") + "Q";
    if (v >= 1e12) return sign + "$" + (v / 1e12).toFixed(1).replace(/\.0$/, "") + "T";
    if (v >= 1e9) return sign + "$" + (v / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
    if (v >= 1e6) return sign + "$" + (v / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (v >= 10000) return sign + "$" + Math.round(v / 1000) + "K";
    return sign + "$" + v.toLocaleString();
  }
  function signed1826(v) {
    v = Math.round(num1826(v));
    return (v >= 0 ? "+" : "-") + money1826(Math.abs(v));
  }
  function pct1826(v) { return (num1826(v) * 100).toFixed(1).replace(".0", "") + "%"; }
  function toast1826(msg) {
    try { if (typeof addToast === "function") return addToast(msg); } catch(e) {}
    try { if (typeof addLog === "function") return addLog(msg); } catch(e) {}
  }
  function log1826(msg, deltas) {
    try { if (typeof addLog === "function") return addLog(msg, deltas || {}); } catch(e) {}
  }
  function saveOnly1826() { try { if (typeof save === "function") save(); } catch(e) {} }
  function saveRender1826() { saveOnly1826(); try { if (typeof render === "function") render(); } catch(e) {} }
  function deepCopy1826(obj) {
    try { if (typeof structuredClone === "function") return structuredClone(obj); } catch(e) {}
    try { return JSON.parse(JSON.stringify(obj)); } catch(e) { return null; }
  }

  var TAX_PROFILES1826 = [
    { id:"us", name:"United States", dash:"Federal + state", brackets:[[0,.10],[45000,.16],[90000,.22],[180000,.28],[400000,.35]], moveCost:4500, regions:[["pa","Pennsylvania",.0307],["de","Delaware",.055],["hi","Hawaii",.082],["nj","New Jersey",.064],["ny","New York",.065],["ca","California",.093],["ga","Georgia",.052],["tx","Texas",0],["fl","Florida",0],["nv","Nevada",0]] },
    { id:"canada", name:"Canada", dash:"Federal + province", brackets:[[0,.15],[55000,.21],[110000,.27],[180000,.33]], moveCost:9000, regions:[["on","Ontario",.0915],["bc","British Columbia",.077],["ab","Alberta",.10],["qc","Quebec",.15]] },
    { id:"uk", name:"United Kingdom", dash:"UK tax", brackets:[[0,.12],[50000,.20],[125000,.40],[300000,.45]], moveCost:10000, regions:[["eng","England/Wales",0],["sct","Scotland",.025],["ni","Northern Ireland",0]] },
    { id:"germany", name:"Germany", dash:"Social-tax", brackets:[[0,.18],[45000,.28],[90000,.36],[180000,.42]], moveCost:12000, regions:[["standard","Standard region",0]] },
    { id:"france", name:"France", dash:"Public-service", brackets:[[0,.14],[45000,.24],[90000,.34],[180000,.41]], moveCost:12000, regions:[["standard","Standard region",0]] },
    { id:"singapore", name:"Singapore", dash:"Low-tax", brackets:[[0,.04],[45000,.07],[90000,.12],[180000,.18],[400000,.22]], moveCost:15000, regions:[["standard","Standard region",0]] },
    { id:"uae", name:"UAE", dash:"0% personal income", brackets:[[0,0]], moveCost:18000, regions:[["standard","Standard region",0]] },
    { id:"thailand", name:"Thailand", dash:"Expat progressive", brackets:[[0,.05],[25000,.10],[75000,.20],[160000,.30],[300000,.35]], moveCost:11000, regions:[["bkk","Bangkok",.01],["phuket","Phuket",.008],["standard","Standard region",0]] },
    { id:"vietnam", name:"Vietnam", dash:"Regional progressive", brackets:[[0,.05],[25000,.10],[60000,.20],[140000,.30],[300000,.35]], moveCost:9500, regions:[["danang","Da Nang",.006],["hcmc","Ho Chi Minh City",.01],["hanoi","Hanoi",.01],["standard","Standard region",0]] }
  ];
  var ACCOUNTANTS1826 = [
    { id:"none", name:"No Accountant", cost:0, reduction:0, feePct:0, audit:-0, desc:"No tax planning. Cheapest now, riskiest when income gets complicated." },
    { id:"local", name:"Local Tax Preparer", cost:500, reduction:.05, feePct:.12, audit:8, desc:"Basic filing help. Good for normal wages and small side income." },
    { id:"cpa", name:"CPA Advisor", cost:5000, reduction:.075, feePct:.06, audit:18, desc:"Better bookkeeping, deductions, and audit prevention." },
    { id:"elite", name:"Elite Tax Counsel", cost:50000, reduction:.10, feePct:.03, audit:30, desc:"High-net-worth planning for businesses, investments, and relocation." }
  ];
  var ATTORNEYS1826 = [
    { id:"none", name:"No Attorney", cost:0, protection:0, settlement:.00, desc:"No dedicated legal coverage." },
    { id:"basic", name:"Legal Retainer", cost:2500, protection:12, settlement:.15, desc:"Document review, demand letters, and first response help." },
    { id:"family", name:"Family Attorney", cost:15000, protection:24, settlement:.30, desc:"Ongoing protection for contracts, lawsuits, custody, and estates." },
    { id:"elite", name:"Elite Legal Team", cost:90000, protection:42, settlement:.48, desc:"Wealth, business, tax defense, and litigation strategy." }
  ];
  var HEALTH_PLANS1826 = [
    { id:"none", name:"No Insurance", coverage:0, premium:0, deductible:0, desc:"No premium, but every emergency hits cash or debt." },
    { id:"basic50", name:"Basic 50% Plan", coverage:.50, premium:1200, deductible:1200, desc:"Starter coverage. Cuts many surprise bills roughly in half after deductible." },
    { id:"premium90", name:"Premium 90% Plan", coverage:.90, premium:6000, deductible:500, desc:"Strong plan. Most emergency bills are handled." },
    { id:"elite100", name:"Elite 100% Plan", coverage:1.00, premium:18000, deductible:0, desc:"Expensive but nearly eliminates medical debt risk." }
  ];

  function profile1826(id) { return TAX_PROFILES1826.find(function (x) { return x.id === id; }) || TAX_PROFILES1826[0]; }
  function region1826(countryId, regionId) {
    var p = profile1826(countryId);
    return (p.regions || []).find(function (r) { return r[0] === regionId; }) || (p.regions || [["standard","Standard region",0]])[0];
  }
  function progressive1826(income, brackets) {
    income = Math.max(0, Math.round(num1826(income)));
    var total = 0;
    var rows = (brackets || [[0,0]]).slice().sort(function (a,b) { return a[0] - b[0]; });
    for (var i = 0; i < rows.length; i++) {
      var start = rows[i][0], rate = rows[i][1], end = i + 1 < rows.length ? rows[i + 1][0] : Infinity;
      if (income > start) total += (Math.min(income, end) - start) * rate;
    }
    return Math.round(total);
  }
  function optionById1826(list, id) { return list.find(function (x) { return x.id === id; }) || list[0]; }
  function normalizedAccountant1826() {
    var f = state.finance || {};
    var raw = f.accountant;
    if (typeof raw === "string") raw = { id: raw };
    var id = raw && raw.id ? raw.id : "none";
    var base = optionById1826(ACCOUNTANTS1826, id);
    return Object.assign({}, base, raw || {});
  }
  function normalizedAttorney1826() {
    var f = state.finance || {};
    var raw = f.attorney;
    if (typeof raw === "string") raw = { id: raw };
    var id = raw && raw.id ? raw.id : "none";
    var base = optionById1826(ATTORNEYS1826, id);
    return Object.assign({}, base, raw || {});
  }
  function healthPlan1826() {
    var f = state.finance || {};
    var raw = f.insurance;
    var id = raw === true ? "basic50" : raw === false || raw == null ? "none" : (typeof raw === "object" ? raw.id : String(raw));
    return optionById1826(HEALTH_PLANS1826, id || "none");
  }
  function taxableIncome1826() {
    if (!window.state) return 0;
    var f = state.finance || {};
    var salary = state.job ? num1826(state.job.salary) : 0;
    var business = Math.max(0, num1826(f.lastBusinessIncome || f.lastEntrepreneurIncome || f.incomeSources?.business));
    var investment = Math.max(0, num1826(f.incomeSources?.dividends) + num1826(f.incomeSources?.realizedGains) + num1826(f.incomeSources?.firmDistribution) + num1826(f.lastFirmDistribution) + num1826(f.fundTrackV189?.lastFees));
    return Math.max(0, Math.round(salary + business + investment));
  }
  function projectedTax1826(countryId, regionId, income) {
    var p = profile1826(countryId || state.finance.taxCountry || "us");
    var r = region1826(p.id, regionId || state.finance.taxRegion || (p.regions[0] && p.regions[0][0]));
    var acc = normalizedAccountant1826();
    var base = progressive1826(income, p.brackets);
    var regional = Math.round(Math.max(0, income) * num1826(r[2]));
    var gross = base + regional;
    var savings = Math.round(gross * clamp1826(acc.reduction, 0, .2));
    var fee = Math.round(savings * clamp1826(acc.feePct, 0, .2));
    return { country:p, region:r, base:base, regional:regional, gross:gross, savings:savings, fee:fee, finalTax:Math.max(0, gross - savings + fee), effective:income ? Math.max(0, gross - savings + fee) / income : 0 };
  }
  function legalRisk1826() {
    if (!window.state) return 0;
    var f = state.finance || {};
    var acc = normalizedAccountant1826();
    var atty = normalizedAttorney1826();
    var risk = num1826(f.taxLegalRisk) + Math.min(35, Math.max(0, num1826(f.taxDebt) / 5000)) + Math.min(20, Math.max(0, num1826(f.creditCardDebt) / 12000));
    if (taxableIncome1826() > 150000 && acc.id === "none") risk += 12;
    risk -= num1826(acc.audit) + num1826(atty.protection);
    return Math.round(clamp1826(risk, 0, 100));
  }
  function caseStatus1826(c) { return c.closed ? "Closed" : (c.severity >= 70 ? "Critical" : c.severity >= 40 ? "Active" : "Watch"); }

  function ensure1826() {
    try { if (typeof ensureStateShape === "function") ensureStateShape(); } catch(e) {}
    if (!window.state) return false;
    state.finance = state.finance || {};
    state.stats = state.stats || {};
    state.flags = state.flags || {};
    state.actionsTaken = state.actionsTaken || {};
    state.sandbox = state.sandbox || {};
    state.finance.taxCountry = state.finance.taxCountry || "us";
    state.finance.taxRegion = state.finance.taxRegion || region1826(state.finance.taxCountry)[0];
    state.finance.taxDebt = Math.max(0, Math.round(num1826(state.finance.taxDebt || state.finance.debts?.taxDebt || state.taxDebt)));
    state.finance.taxLegalRisk = Math.max(0, Math.round(num1826(state.finance.taxLegalRisk)));
    state.finance.accountant = normalizedAccountant1826();
    state.finance.attorney = normalizedAttorney1826();
    state.finance.insurance = healthPlan1826().id;
    state.finance.medicalDebt = Math.max(0, Math.round(num1826(state.finance.medicalDebt || state.medicalDebt)));
    if (!Array.isArray(state.finance.legalCasesV1826)) state.finance.legalCasesV1826 = [];
    if (!Array.isArray(state.finance.healthClaimsV1826)) state.finance.healthClaimsV1826 = [];
    if (!Array.isArray(state.finance.relocationHistoryV1826)) state.finance.relocationHistoryV1826 = [];
    if (!Array.isArray(state.timeSnapshotsV1814)) state.timeSnapshotsV1814 = [];
    if (!state.saveHealthV1826) state.saveHealthV1826 = { backups:0, repairs:0, lastBackupAt:0 };
    if (state.sandbox.noStress || state.sandbox.stressFreeLife) state.stats.stress = 0;
    return true;
  }

  function ensureOpenCases1826() {
    ensure1826();
    var cases = state.finance.legalCasesV1826;
    var openTax = cases.some(function (c) { return !c.closed && c.type === "tax"; });
    if (state.finance.taxDebt > 0 && !openTax) {
      cases.unshift({ id:"tax-" + Date.now(), age:state.age || 0, type:"tax", title:"Tax Balance Notice", severity:clamp1826(25 + state.finance.taxDebt / 2500, 25, 95), exposure:Math.round(state.finance.taxDebt * 1.25), note:"Unpaid taxes can create penalties, audits, and stress.", closed:false });
    }
    var risk = legalRisk1826();
    var openAudit = cases.some(function (c) { return !c.closed && c.type === "audit"; });
    if (risk >= 55 && !openAudit) {
      cases.unshift({ id:"audit-" + Date.now(), age:state.age || 0, type:"audit", title:"Audit / Lawsuit Risk", severity:risk, exposure:Math.round(Math.max(5000, taxableIncome1826() * .08)), note:"Your income, debt, or lack of coverage is creating legal pressure.", closed:false });
    }
    state.finance.legalCasesV1826 = cases.slice(0, 10);
  }

  window.hireAccountantV1826 = function (planId) {
    if (!ensure1826()) return;
    var plan = optionById1826(ACCOUNTANTS1826, planId);
    if (plan.id !== "none" && num1826(state.money) < plan.cost) return toast1826(plan.name + " needs " + money1826(plan.cost) + " cash.");
    if (plan.id !== "none") state.money = Math.round(num1826(state.money) - plan.cost);
    state.finance.accountant = Object.assign({}, plan, { hiredAge:state.age || 0, retainerPaid:num1826(state.finance.accountant?.retainerPaid) + plan.cost });
    state.finance.taxLegalRisk = Math.max(0, Math.round(num1826(state.finance.taxLegalRisk) - plan.audit));
    log1826(plan.id === "none" ? "Ended accountant coverage." : "Hired " + plan.name + " for tax planning and audit prevention.", { money: -plan.cost, stress: plan.id === "none" ? 2 : -2 });
    try { if (typeof applyDeltas === "function") applyDeltas({ stress: plan.id === "none" ? 2 : -2 }); } catch(e) {}
    saveRender1826();
  };
  window.hireAttorneyV1826 = function (planId) {
    if (!ensure1826()) return;
    var plan = optionById1826(ATTORNEYS1826, planId);
    if (plan.id !== "none" && num1826(state.money) < plan.cost) return toast1826(plan.name + " needs " + money1826(plan.cost) + " cash.");
    if (plan.id !== "none") state.money = Math.round(num1826(state.money) - plan.cost);
    state.finance.attorney = Object.assign({}, plan, { hiredAge:state.age || 0, retainerPaid:num1826(state.finance.attorney?.retainerPaid) + plan.cost });
    state.finance.taxLegalRisk = Math.max(0, Math.round(num1826(state.finance.taxLegalRisk) - plan.protection));
    log1826(plan.id === "none" ? "Ended attorney coverage." : "Hired " + plan.name + " for legal protection.", { money:-plan.cost, stress:plan.id === "none" ? 2 : -3 });
    try { if (typeof applyDeltas === "function") applyDeltas({ stress: plan.id === "none" ? 2 : -3 }); } catch(e) {}
    saveRender1826();
  };
  window.legalCaseActionV1826 = function (caseId, action) {
    if (!ensure1826()) return;
    ensureOpenCases1826();
    var c = state.finance.legalCasesV1826.find(function (x) { return x.id === caseId; });
    if (!c || c.closed) return toast1826("That legal issue is already closed.");
    var acc = normalizedAccountant1826();
    var atty = normalizedAttorney1826();
    var exposure = Math.max(0, Math.round(num1826(c.exposure)));
    if (action === "consult") {
      var consult = Math.max(150, Math.round(exposure * .025 * (1 - num1826(atty.settlement))));
      if (num1826(state.money) < consult) return toast1826("Consult needs " + money1826(consult) + ".");
      state.money -= consult;
      c.severity = clamp1826(num1826(c.severity) - 18 - Math.round(num1826(acc.audit) / 2), 0, 100);
      state.finance.taxLegalRisk = Math.max(0, Math.round(num1826(state.finance.taxLegalRisk) - 10));
      log1826("Legal consult completed for " + money1826(consult) + ". The issue is clearer and risk dropped.", { money:-consult, stress:-3 });
      try { if (typeof applyDeltas === "function") applyDeltas({ stress:-3 }); } catch(e) {}
    } else if (action === "settle") {
      var discount = Math.min(.65, num1826(atty.settlement) + num1826(acc.reduction));
      var settlement = Math.max(250, Math.round(exposure * (1 - discount)));
      if (num1826(state.money) < settlement) return toast1826("Settlement needs " + money1826(settlement) + " cash.");
      state.money -= settlement;
      if (c.type === "tax") state.finance.taxDebt = Math.max(0, Math.round(num1826(state.finance.taxDebt) - exposure));
      c.closed = true;
      c.closedAge = state.age || 0;
      c.outcome = "Settled for " + money1826(settlement);
      state.finance.taxLegalRisk = Math.max(0, Math.round(num1826(state.finance.taxLegalRisk) - 26));
      log1826("Settled " + c.title + " for " + money1826(settlement) + ".", { money:-settlement, stress:-6 });
      try { if (typeof applyDeltas === "function") applyDeltas({ stress:-6 }); } catch(e) {}
    } else if (action === "defend") {
      var defense = Math.max(500, Math.round(exposure * (.09 - Math.min(.06, num1826(atty.settlement) / 5))));
      if (num1826(state.money) < defense) return toast1826("Defense needs " + money1826(defense) + " cash.");
      state.money -= defense;
      var win = (num1826(atty.protection) + num1826(acc.audit) + num1826(state.stats?.smarts) / 4 + num1826(state.stats?.discipline) / 5) >= (35 + num1826(c.severity) / 2);
      if (win) {
        c.closed = true; c.closedAge = state.age || 0; c.outcome = "Defended successfully";
        if (c.type === "tax") state.finance.taxDebt = Math.max(0, Math.round(num1826(state.finance.taxDebt) * .35));
        state.finance.taxLegalRisk = Math.max(0, Math.round(num1826(state.finance.taxLegalRisk) - 32));
        log1826("Your legal team defended " + c.title + ". Exposure dropped sharply.", { money:-defense, stress:-4, confidence:2 });
        try { if (typeof applyDeltas === "function") applyDeltas({ stress:-4, confidence:2 }); } catch(e) {}
      } else {
        c.severity = clamp1826(num1826(c.severity) + 8, 0, 100);
        var penalty = Math.round(exposure * .18);
        state.finance.taxDebt += c.type === "tax" ? penalty : 0;
        state.finance.taxLegalRisk = Math.min(100, Math.round(num1826(state.finance.taxLegalRisk) + 12));
        log1826("The defense did not fully work. Pressure increased and costs continue.", { money:-defense, stress:5 });
        try { if (typeof applyDeltas === "function") applyDeltas({ stress:5 }); } catch(e) {}
      }
    }
    state.finance.legalCasesV1826 = state.finance.legalCasesV1826.slice(0, 10);
    saveRender1826();
  };

  window.setTaxResidenceV1826 = function (countryId, regionId) {
    if (!ensure1826()) return;
    var p = profile1826(countryId || "us");
    var r = region1826(p.id, regionId || (p.regions[0] && p.regions[0][0]));
    var currentKey = (state.finance.taxCountry || "us") + ":" + (state.finance.taxRegion || "");
    var nextKey = p.id + ":" + r[0];
    var international = p.id !== (state.finance.taxCountry || "us");
    var cost = nextKey === currentKey ? 0 : Math.round((p.moveCost || 5000) + (international ? 6000 : 1500));
    if (cost && num1826(state.money) < cost) return toast1826("Relocation needs " + money1826(cost) + " cash.");
    if (cost) state.money -= cost;
    state.finance.taxCountry = p.id;
    state.finance.taxRegion = r[0];
    state.finance.taxDashboard = p.dash;
    state.finance.relocationHistoryV1826.unshift({ age:state.age || 0, country:p.id, region:r[0], cost:cost });
    state.finance.relocationHistoryV1826 = state.finance.relocationHistoryV1826.slice(0, 8);
    var stress = international ? 5 : 2;
    log1826("Moved tax residence to " + p.name + " / " + r[1] + (cost ? " for " + money1826(cost) : "") + ".", { money:-cost, stress:stress });
    try { if (typeof applyDeltas === "function") applyDeltas({ stress:stress }); } catch(e) {}
    saveRender1826();
  };
  window.updateTaxRegionSelectV1826 = function (countryId, selectId) {
    var el = document.getElementById(selectId || "v1826-tax-region");
    if (!el) return;
    var p = profile1826(countryId || "us");
    el.innerHTML = (p.regions || []).map(function (r) { return '<option value="' + esc1826(r[0]) + '">' + esc1826(r[1]) + (r[2] ? " · +" + pct1826(r[2]) : " · no extra") + '</option>'; }).join("");
  };

  window.setHealthPlanV1826 = function (planId) {
    if (!ensure1826()) return;
    if (num1826(state.age) < 18) return toast1826("Health plans unlock at 18.");
    var plan = optionById1826(HEALTH_PLANS1826, planId);
    if (plan.id !== "none" && num1826(state.money) < plan.premium) return toast1826(plan.name + " first premium needs " + money1826(plan.premium) + ".");
    if (plan.id !== "none") state.money -= plan.premium;
    state.finance.insurance = plan.id;
    state.finance.lastInsuranceCost = (num1826(state.finance.lastInsuranceCost) + plan.premium);
    log1826(plan.id === "none" ? "Dropped health insurance." : "Enrolled in " + plan.name + ".", { money:-plan.premium, stress:plan.coverage >= .9 ? -5 : plan.id === "none" ? 4 : -2 });
    try { if (typeof applyDeltas === "function") applyDeltas({ stress:plan.coverage >= .9 ? -5 : plan.id === "none" ? 4 : -2 }); } catch(e) {}
    saveRender1826();
  };
  function medicalOop1826(gross) {
    var plan = healthPlan1826();
    var covered = Math.round(Math.max(0, gross - plan.deductible) * plan.coverage);
    return { plan:plan, gross:gross, covered:covered, oop:Math.max(0, gross - covered) };
  }

  window.createWaybackCheckpointV1826 = function (label) {
    if (!ensure1826()) return;
    var snap = deepCopy1826(state);
    if (!snap) return toast1826("Could not create checkpoint.");
    delete snap.pending;
    delete snap.activeModal;
    delete snap.timeSnapshotsV1814;
    state.timeSnapshotsV1814.push({ id:Date.now(), age:state.age || 0, at:Date.now(), label:label || "Manual checkpoint", netWorth:typeof legacyNetWorth === "function" ? legacyNetWorth(state) : 0, state:snap });
    state.timeSnapshotsV1814 = state.timeSnapshotsV1814.slice(-14);
    log1826("Saved Wayback checkpoint at age " + (state.age || 0) + ".");
    saveRender1826();
  };
  window.restoreWaybackIndexV1826 = function (idx) {
    if (!ensure1826()) return;
    idx = Math.round(num1826(idx));
    var snaps = state.timeSnapshotsV1814 || [];
    var item = snaps[idx];
    if (!item || !item.state) return toast1826("That checkpoint is not readable.");
    var next = deepCopy1826(item.state);
    if (!next) return toast1826("Could not restore checkpoint.");
    next.timeSnapshotsV1814 = snaps.slice(0, idx).concat(snaps.slice(idx + 1));
    try { state = next; window.state = next; } catch(e) { window.state = next; }
    try { if (typeof ensureStateShape === "function") ensureStateShape(); } catch(e) {}
    saveOnly1826();
    toast1826("Restored checkpoint from age " + (next.age || "?") + ".");
    try { if (typeof render === "function") render(); } catch(e) {}
  };
  window.deleteWaybackIndexV1826 = function (idx) {
    if (!ensure1826()) return;
    idx = Math.round(num1826(idx));
    if (!state.timeSnapshotsV1814[idx]) return;
    state.timeSnapshotsV1814.splice(idx, 1);
    saveRender1826();
  };

  var backupPrefix1826 = "ledger-v1826-backup-slot-";
  window.backupCurrentSaveV1826 = function () {
    if (!ensure1826()) return;
    var idx = typeof activeSlot !== "undefined" ? activeSlot : 1;
    var copy = deepCopy1826(state);
    if (!copy) return toast1826("Could not create backup.");
    try {
      localStorage.setItem(backupPrefix1826 + idx, JSON.stringify({ at:Date.now(), state:copy }));
      state.saveHealthV1826.backups = num1826(state.saveHealthV1826.backups) + 1;
      state.saveHealthV1826.lastBackupAt = Date.now();
      saveOnly1826();
      toast1826("Backup written for slot " + idx + ".");
    } catch(e) { toast1826("Backup failed: " + (e.message || e)); }
  };
  window.repairSaveSlotV1826 = function (idx) {
    idx = Math.max(1, Math.min(5, Math.round(num1826(idx, typeof activeSlot !== "undefined" ? activeSlot : 1))));
    var raw = null, parsed = null;
    try { raw = localStorage.getItem(typeof slotKey === "function" ? slotKey(idx) : "ledger-life-slot-" + idx); } catch(e) {}
    if (raw) { try { parsed = JSON.parse(raw); } catch(e) {} }
    if (parsed && parsed.stats && Array.isArray(parsed.log)) return toast1826("Slot " + idx + " is readable. No repair needed.");
    var backup = null;
    try { backup = JSON.parse(localStorage.getItem(backupPrefix1826 + idx) || "null"); } catch(e) {}
    if (!backup || !backup.state) return toast1826("No readable backup found for slot " + idx + ".");
    try {
      localStorage.setItem(typeof slotKey === "function" ? slotKey(idx) : "ledger-life-slot-" + idx, JSON.stringify(backup.state));
      if (idx === (typeof activeSlot !== "undefined" ? activeSlot : 1)) { state = backup.state; window.state = backup.state; }
      if (window.state) { ensure1826(); state.saveHealthV1826.repairs = num1826(state.saveHealthV1826.repairs) + 1; }
      toast1826("Repaired slot " + idx + " from the last backup.");
      try { if (typeof render === "function") render(); } catch(e) {}
    } catch(e) { toast1826("Repair failed: " + (e.message || e)); }
  };

  window.activateStressFreeV1826 = function () {
    if (!ensure1826()) return;
    if (!state.sandboxMode) return toast1826("Stress-free mode is sandbox-only.");
    state.sandbox.noStress = true;
    state.sandbox.stressFreeLife = true;
    state.stats.stress = 0;
    log1826("Sandbox stress-free life mode activated. Stress gains will be blocked.", { stress:-10 });
    saveRender1826();
  };
  window.deactivateStressFreeV1826 = function () {
    if (!ensure1826()) return;
    state.sandbox.noStress = false;
    state.sandbox.stressFreeLife = false;
    log1826("Sandbox stress-free life mode turned off.");
    saveRender1826();
  };

  var prevApplyDeltas1826 = window.applyDeltas || (typeof applyDeltas === "function" ? applyDeltas : null);
  if (prevApplyDeltas1826 && !window.__ledgerApplyDeltas1826Wrapped) {
    window.__ledgerApplyDeltas1826Wrapped = true;
    window.applyDeltas = function (deltas) {
      if (window.state && state.sandbox && (state.sandbox.noStress || state.sandbox.stressFreeLife)) {
        deltas = Object.assign({}, deltas || {});
        if (num1826(deltas.stress) > 0) deltas.stress = 0;
      }
      var result = prevApplyDeltas1826.apply(this, arguments.length ? [deltas] : arguments);
      try { if (window.state && state.sandbox && (state.sandbox.noStress || state.sandbox.stressFreeLife)) state.stats.stress = 0; } catch(e) {}
      return result;
    };
    try { applyDeltas = window.applyDeltas; } catch(e) {}
  }

  var prevHospital1826 = window.goHospital || (typeof goHospital === "function" ? goHospital : null);
  window.goHospital = function () {
    if (!ensure1826()) return prevHospital1826 ? prevHospital1826.apply(this, arguments) : null;
    if (!state.flags.needsHospital) return toast1826("You do not need emergency care right now.");
    var gross = state.stats && state.stats.health <= 10 ? 12500 : state.stats && state.stats.stress >= 90 ? 7200 : 4200;
    var bill = medicalOop1826(gross);
    var paid = Math.min(Math.max(0, Math.round(num1826(state.money))), bill.oop);
    var unpaid = Math.max(0, bill.oop - paid);
    state.money = Math.round(num1826(state.money) - paid);
    state.finance.medicalDebt = Math.round(num1826(state.finance.medicalDebt) + unpaid);
    state.medicalDebt = state.finance.medicalDebt;
    state.flags.needsHospital = false;
    state.finance.healthClaimsV1826.unshift({ age:state.age || 0, gross:gross, covered:bill.covered, oop:bill.oop, paid:paid, debt:unpaid, plan:bill.plan.id });
    state.finance.healthClaimsV1826 = state.finance.healthClaimsV1826.slice(0, 8);
    try { if (typeof applyDeltas === "function") applyDeltas({ health:32, stress:-18, mentalHealth:6 }); } catch(e) {}
    log1826("Hospital care cost " + money1826(gross) + ". " + bill.plan.name + " covered " + money1826(bill.covered) + ", leaving " + money1826(bill.oop) + " out-of-pocket.", { money:-paid, medicalDebt:unpaid, health:32, stress:-18 });
    saveRender1826();
  };
  try { goHospital = window.goHospital; } catch(e) {}

  var prevResolveYear1826 = window.resolveLifeAndFinanceYear || (typeof resolveLifeAndFinanceYear === "function" ? resolveLifeAndFinanceYear : null);
  if (prevResolveYear1826 && !window.__ledgerResolveYear1826Wrapped) {
    window.__ledgerResolveYear1826Wrapped = true;
    window.resolveLifeAndFinanceYear = function () {
      var result = prevResolveYear1826.apply(this, arguments);
      try {
        if (!ensure1826() || !state.alive) return result;
        if (state.sandbox && (state.sandbox.noStress || state.sandbox.stressFreeLife)) state.stats.stress = 0;
        var plan = healthPlan1826();
        if (state.age >= 18 && plan.id !== "none" && state.finance.lastPremiumAgeV1826 !== state.age) {
          state.finance.lastPremiumAgeV1826 = state.age;
          if (num1826(state.money) >= plan.premium) {
            state.money -= plan.premium;
            state.finance.lastInsuranceCost = num1826(state.finance.lastInsuranceCost) + plan.premium;
            log1826(plan.name + " premium paid: " + money1826(plan.premium) + ".", { money:-plan.premium });
          } else {
            state.finance.insurance = "none";
            state.finance.medicalDebt += Math.max(0, Math.round(plan.premium - Math.max(0, num1826(state.money))));
            state.money = Math.min(0, num1826(state.money));
            log1826("Could not afford " + plan.name + ". Coverage lapsed and unpaid premium pressure became medical debt.", { stress:5 });
            try { if (typeof applyDeltas === "function") applyDeltas({ stress:5 }); } catch(e) {}
          }
        }
        ensureOpenCases1826();
        var risk = legalRisk1826();
        if (risk >= 70 && state.actionsTaken["legalWarningV1826_" + state.age] !== true) {
          state.actionsTaken["legalWarningV1826_" + state.age] = true;
          log1826("Legal pressure is high. Open the Law Office before penalties snowball.", { stress:3 });
          try { if (typeof applyDeltas === "function") applyDeltas({ stress:3 }); } catch(e) {}
        }
        saveOnly1826();
      } catch(e) {}
      return result;
    };
    try { resolveLifeAndFinanceYear = window.resolveLifeAndFinanceYear; } catch(e) {}
  }

  var prevSave1826 = window.save || (typeof save === "function" ? save : null);
  if (prevSave1826 && !window.__ledgerSave1826Wrapped) {
    window.__ledgerSave1826Wrapped = true;
    window.save = function () {
      try {
        if (window.state) {
          ensure1826();
          var idx = typeof activeSlot !== "undefined" ? activeSlot : 1;
          var copy = deepCopy1826(state);
          if (copy) localStorage.setItem(backupPrefix1826 + idx, JSON.stringify({ at:Date.now(), state:copy }));
          state.saveHealthV1826.backups = num1826(state.saveHealthV1826.backups) + 1;
          state.saveHealthV1826.lastBackupAt = Date.now();
        }
      } catch(e) {}
      try { return prevSave1826.apply(this, arguments); }
      catch(e) { toast1826("Save failed: " + (e.message || e)); }
    };
    try { save = window.save; } catch(e) {}
  }
  var prevLoadSlot1826 = window.loadFromSlot || (typeof loadFromSlot === "function" ? loadFromSlot : null);
  if (prevLoadSlot1826 && !window.__ledgerLoadSlot1826Wrapped) {
    window.__ledgerLoadSlot1826Wrapped = true;
    window.loadFromSlot = function (idx) {
      var ok = false;
      try { ok = prevLoadSlot1826.apply(this, arguments); } catch(e) { ok = false; }
      if (ok) return true;
      var backup = null;
      try { backup = JSON.parse(localStorage.getItem(backupPrefix1826 + idx) || "null"); } catch(e) {}
      if (backup && backup.state) {
        try {
          state = backup.state; window.state = backup.state; activeSlot = idx;
          ensure1826(); saveOnly1826();
          toast1826("Loaded slot " + idx + " from v18.26 backup.");
          return true;
        } catch(e) {}
      }
      return false;
    };
    try { loadFromSlot = window.loadFromSlot; } catch(e) {}
  }

  function button1826(label, cls, action, disabled) {
    return '<button class="money-btn ' + esc1826(cls || "") + '" onclick="event.preventDefault();event.stopPropagation();' + esc1826(action) + '" ' + (disabled ? "disabled" : "") + '>' + esc1826(label) + '</button>';
  }
  function legalCommandDesk1826() {
    ensure1826(); ensureOpenCases1826();
    var acc = normalizedAccountant1826();
    var atty = normalizedAttorney1826();
    var risk = legalRisk1826();
    var tax = projectedTax1826(state.finance.taxCountry, state.finance.taxRegion, taxableIncome1826());
    var cases = (state.finance.legalCasesV1826 || []).filter(function (c) { return !c.closed; });
    var caseRows = cases.length ? cases.map(function (c) {
      return '<div class="v1826-case-card ' + (c.severity >= 60 ? "bad" : c.severity >= 35 ? "gold" : "good") + '"><div class="v1826-case-head"><b>' + esc1826(c.title) + '</b><span>' + esc1826(caseStatus1826(c)) + '</span></div><p>' + esc1826(c.note || "Open legal issue.") + '</p><div class="v1826-pill-row"><span>Exposure ' + money1826(c.exposure) + '</span><span>Severity ' + Math.round(num1826(c.severity)) + '/100</span></div><div class="v1826-button-grid mini">' + button1826("Consult", "blue", "legalCaseActionV1826('" + esc1826(c.id) + "','consult')", false) + button1826("Defend", "gold", "legalCaseActionV1826('" + esc1826(c.id) + "','defend')", false) + button1826("Settle", "red", "legalCaseActionV1826('" + esc1826(c.id) + "','settle')", false) + '</div></div>';
    }).join("") : '<div class="v1826-empty">No open legal cases. Coverage still lowers future risk.</div>';
    var accountantCards = ACCOUNTANTS1826.map(function (p) {
      var picked = acc.id === p.id;
      var disabled = p.id !== "none" && num1826(state.money) < p.cost;
      return '<button class="v1826-plan ' + (picked ? "selected" : "") + '" onclick="event.preventDefault();event.stopPropagation();hireAccountantV1826(\'' + p.id + '\')" ' + (disabled ? "disabled" : "") + '><b>' + esc1826(p.name) + '</b><span>' + esc1826(p.desc) + '</span><em>Cost ' + money1826(p.cost) + ' · tax save ' + pct1826(p.reduction) + ' · risk -' + p.audit + '</em></button>';
    }).join("");
    var attorneyCards = ATTORNEYS1826.map(function (p) {
      var picked = atty.id === p.id;
      var disabled = p.id !== "none" && num1826(state.money) < p.cost;
      return '<button class="v1826-plan ' + (picked ? "selected" : "") + '" onclick="event.preventDefault();event.stopPropagation();hireAttorneyV1826(\'' + p.id + '\')" ' + (disabled ? "disabled" : "") + '><b>' + esc1826(p.name) + '</b><span>' + esc1826(p.desc) + '</span><em>Cost ' + money1826(p.cost) + ' · protection -' + p.protection + ' · settlement help ' + pct1826(p.settlement) + '</em></button>';
    }).join("");
    return '<section class="money-section v1826-legal-command"><div class="money-section-title">Legal Command Center <span>canonical coverage hub</span></div><div class="v1826-score-line"><div><span>Legal risk</span><b class="' + (risk >= 60 ? "bad" : risk ? "gold" : "good") + '">' + risk + '/100</b><em>Accountant + attorney coverage now live here, not split across Money.</em></div><div><span>Projected tax</span><b>' + money1826(tax.finalTax) + '</b><em>' + esc1826(tax.country.name) + ' / ' + esc1826(tax.region[1]) + '</em></div><div><span>Tax debt</span><b class="' + (state.finance.taxDebt ? "bad" : "good") + '">' + money1826(state.finance.taxDebt) + '</b><em>Pay or settle before penalties.</em></div></div><div class="v1826-plan-grid"><div><div class="v1826-subtitle">Accountants</div>' + accountantCards + '</div><div><div class="v1826-subtitle">Attorneys</div>' + attorneyCards + '</div></div><div class="v1826-subtitle with-space">Open Cases</div><div class="v1826-case-grid">' + caseRows + '</div></section>';
  }
  function taxRelocationDesk1826() {
    ensure1826();
    var income = taxableIncome1826();
    var current = projectedTax1826(state.finance.taxCountry, state.finance.taxRegion, income);
    var selector = '<div class="v1826-relocate-controls"><select id="v1826-tax-country" onchange="updateTaxRegionSelectV1826(this.value,\'v1826-tax-region\')">' + TAX_PROFILES1826.map(function (p) { return '<option value="' + esc1826(p.id) + '" ' + (p.id === current.country.id ? "selected" : "") + '>' + esc1826(p.name) + '</option>'; }).join("") + '</select><select id="v1826-tax-region">' + (current.country.regions || []).map(function (r) { return '<option value="' + esc1826(r[0]) + '" ' + (r[0] === current.region[0] ? "selected" : "") + '>' + esc1826(r[1]) + (r[2] ? " · +" + pct1826(r[2]) : " · no extra") + '</option>'; }).join("") + '</select>' + button1826("Move Residence", "gold", "setTaxResidenceV1826(document.getElementById('v1826-tax-country').value,document.getElementById('v1826-tax-region').value)", num1826(state.age) < 18) + '</div>';
    var cards = TAX_PROFILES1826.map(function (p) {
      var r = region1826(p.id, p.regions && p.regions[0] && p.regions[0][0]);
      var model = projectedTax1826(p.id, r[0], income);
      var diff = current.finalTax - model.finalTax;
      return '<div class="v1826-tax-option ' + (p.id === current.country.id ? "selected" : "") + '"><b>' + esc1826(p.name) + '</b><span>' + esc1826(p.dash) + '</span><strong class="' + (diff > 0 ? "good" : diff < 0 ? "bad" : "") + '">' + (diff ? signed1826(diff) + ' vs current' : 'Current-like') + '</strong><em>Projected tax ' + money1826(model.finalTax) + ' · move cost about ' + money1826((p.moveCost || 5000) + (p.id === current.country.id ? 1500 : 6000)) + '</em></div>';
    }).join("");
    return '<section class="money-section v1826-relocation"><div class="money-section-title">Tax Residency + Move Desk <span>country/state model</span></div><div class="v1826-empty">Compare places before moving. Moving costs cash and can add stress, but it affects future tax pressure.</div>' + selector + '<div class="v1826-tax-grid">' + cards + '</div></section>';
  }
  function healthInsuranceDesk1826() {
    ensure1826();
    var plan = healthPlan1826();
    var last = (state.finance.healthClaimsV1826 || [])[0];
    var cards = HEALTH_PLANS1826.map(function (p) {
      var picked = p.id === plan.id;
      var disabled = state.age < 18 || (p.id !== "none" && num1826(state.money) < p.premium);
      return '<button class="v1826-health-card ' + (picked ? "selected" : "") + '" onclick="event.preventDefault();event.stopPropagation();setHealthPlanV1826(\'' + p.id + '\')" ' + (disabled ? "disabled" : "") + '><div class="v1826-case-head"><b>' + esc1826(p.name) + '</b>' + (picked ? '<span>Current</span>' : '') + '</div><p>' + esc1826(p.desc) + '</p><div class="v1826-pill-row"><span>' + Math.round(p.coverage * 100) + '% coverage</span><span>Premium ' + money1826(p.premium) + '/yr</span><span>Deductible ' + money1826(p.deductible) + '</span></div></button>';
    }).join("");
    var sample = medicalOop1826(7200);
    return '<section class="money-section v1826-health-insurance"><div class="money-section-title">Health Insurance Effects <span>' + esc1826(plan.name) + '</span></div><div class="v1826-score-line"><div><span>Plan</span><b>' + esc1826(plan.name) + '</b><em>Premiums bill yearly after age 18.</em></div><div><span>$7.2K emergency</span><b>' + money1826(sample.oop) + '</b><em>Out of pocket after deductible/coverage.</em></div><div><span>Medical debt</span><b class="' + (state.finance.medicalDebt ? "bad" : "good") + '">' + money1826(state.finance.medicalDebt) + '</b><em>' + (last ? 'Last claim covered ' + money1826(last.covered) : 'No recent claim') + '</em></div></div><div class="v1826-health-grid">' + cards + '</div></section>';
  }
  function waybackBrowser1826() {
    ensure1826();
    var snaps = (state.timeSnapshotsV1814 || []).slice();
    var rows = snaps.length ? snaps.map(function (s, idx) {
      return '<div class="v1826-wayback-row"><div><b>' + esc1826(s.label || 'Checkpoint') + '</b><span>Age ' + esc1826(s.age == null ? '?' : s.age) + ' · ' + esc1826(s.at ? new Date(s.at).toLocaleString() : 'saved') + (s.netWorth ? ' · net ' + money1826(s.netWorth) : '') + '</span></div><div class="v1826-row-actions">' + button1826("Restore", "gold", "restoreWaybackIndexV1826(" + idx + ")", false) + button1826("Delete", "red", "deleteWaybackIndexV1826(" + idx + ")", false) + '</div></div>';
    }).join("") : '<div class="v1826-empty">No checkpoints yet. Save one before risky decisions or age-up.</div>';
    return '<section class="money-section v1826-wayback"><div class="money-section-title">Wayback Browser <span>' + snaps.length + ' saved</span></div><div class="v1826-button-grid">' + button1826("Save Checkpoint", "green", "createWaybackCheckpointV1826('Manual checkpoint')", false) + (typeof activeSlot !== "undefined" ? button1826("Backup Slot " + activeSlot, "blue", "backupCurrentSaveV1826()", false) : "") + '</div><div class="v1826-wayback-list">' + rows + '</div></section>';
  }
  function saveHealthDesk1826() {
    ensure1826();
    var idx = typeof activeSlot !== "undefined" ? activeSlot : 1;
    var h = state.saveHealthV1826 || {};
    return '<section class="money-section v1826-save-health"><div class="money-section-title">Save Health + Repair <span>slot ' + idx + '</span></div><div class="v1826-score-line"><div><span>Auto backups</span><b>' + Math.round(num1826(h.backups)) + '</b><em>Written beside the normal save.</em></div><div><span>Repairs</span><b>' + Math.round(num1826(h.repairs)) + '</b><em>Recovered from backup.</em></div><div><span>Last backup</span><b>' + (h.lastBackupAt ? new Date(h.lastBackupAt).toLocaleTimeString() : 'None') + '</b><em>Local browser backup.</em></div></div><div class="v1826-button-grid">' + button1826("Backup Now", "green", "backupCurrentSaveV1826()", false) + button1826("Repair Current Slot", "gold", "repairSaveSlotV1826(" + idx + ")", false) + '</div></section>';
  }
  function sandboxCalmDesk1826() {
    ensure1826();
    var on = !!(state.sandbox && (state.sandbox.noStress || state.sandbox.stressFreeLife));
    return '<section class="money-section v1826-sandbox-calm"><div class="money-section-title">Sandbox Stress-Free Life <span>' + (on ? 'ON' : 'OFF') + '</span></div><div class="money-row"><div><div class="money-row-title">' + (state.sandboxMode ? (on ? 'Stress gains blocked' : 'Sandbox calm available') : 'Sandbox-only mode') + '</div><div class="money-row-sub">This is a test/dev switch for lives where you want to inspect systems without stress spirals, hospital collapse, or action penalties taking over.</div></div><div class="bank-actions-row">' + button1826(on ? "Turn Off" : "Activate", on ? "red" : "green", on ? "deactivateStressFreeV1826()" : "activateStressFreeV1826()", !state.sandboxMode) + '</div></div></section>';
  }
  function moneyLegalShortcut1826() {
    ensure1826();
    var risk = legalRisk1826();
    return '<section class="money-section v1826-money-legal-shortcut"><div class="money-section-title">Legal / Accountant Shortcut <span>single home</span></div><div class="money-row"><div><div class="money-row-title">Use Law Office for coverage decisions</div><div class="money-row-sub">Money shows the warning, but hiring accountants, attorneys, settlements, and audit defense now live in one canonical Legal hub. Current risk: ' + risk + '/100.</div></div><button class="money-btn blue" onclick="event.preventDefault();event.stopPropagation();setTabV16 ? setTabV16(\'law\') : setTab(\'law\')">Open Legal</button></div></section>';
  }

  function remove1826(html) {
    html = String(html || "");
    ["v1826-legal-command", "v1826-relocation", "v1826-health-insurance", "v1826-wayback", "v1826-save-health", "v1826-sandbox-calm", "v1826-money-legal-shortcut"].forEach(function (cls) {
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
  function insertTop1826(html, chunk) {
    html = String(html || "");
    var end = html.indexOf("</section>");
    return end >= 0 ? html.slice(0, end + 10) + chunk + html.slice(end + 10) : chunk + html;
  }
  var prevRenderHub1826 = window.renderHubContent || (typeof renderHubContent === "function" ? renderHubContent : null);
  if (prevRenderHub1826 && !window.__ledgerRenderHub1826Wrapped) {
    window.__ledgerRenderHub1826Wrapped = true;
    window.renderHubContent = function (hubId) {
      ensure1826();
      var html = "";
      try { html = prevRenderHub1826.apply(this, arguments) || ""; }
      catch(e) { html = '<section class="panel"><div class="section-label">Recovered Render</div><div class="row-sub">' + esc1826(e && (e.message || e)) + '</div></section>'; }
      html = remove1826(html);
      if (hubId === "law" || hubId === "legal") html = legalCommandDesk1826() + taxRelocationDesk1826() + healthInsuranceDesk1826() + html;
      if (hubId === "money" || hubId === "finance") html = insertTop1826(html, moneyLegalShortcut1826());
      if (hubId === "health") html = healthInsuranceDesk1826() + html;
      if (hubId === "more") html = waybackBrowser1826() + saveHealthDesk1826() + sandboxCalmDesk1826() + html;
      if (hubId === "lifehub") html = waybackBrowser1826() + html;
      return html;
    };
    try { renderHubContent = window.renderHubContent; } catch(e) {}
  }
  var prevRenderLifeHub1826 = window.renderLifeHub || (typeof renderLifeHub === "function" ? renderLifeHub : null);
  if (prevRenderLifeHub1826 && !window.__ledgerRenderLifeHub1826Wrapped) {
    window.__ledgerRenderLifeHub1826Wrapped = true;
    window.renderLifeHub = function () {
      var html = "";
      try { html = prevRenderLifeHub1826.apply(this, arguments) || ""; } catch(e) { html = ""; }
      html = remove1826(html);
      return waybackBrowser1826() + html;
    };
    try { renderLifeHub = window.renderLifeHub; } catch(e) {}
  }

  var style = document.createElement("style");
  style.textContent = [
    ".v1826-legal-command,.v1826-relocation,.v1826-health-insurance,.v1826-wayback,.v1826-save-health,.v1826-sandbox-calm,.v1826-money-legal-shortcut{border-color:rgba(126,160,172,.42)!important;background:linear-gradient(135deg,rgba(22,38,42,.96),rgba(34,29,22,.97))!important;overflow:hidden!important}.v1826-legal-command{border-color:rgba(216,173,109,.44)!important;background:linear-gradient(135deg,rgba(49,38,22,.97),rgba(25,22,18,.98))!important}.v1826-health-insurance{border-color:rgba(143,175,108,.44)!important;background:linear-gradient(135deg,rgba(22,44,31,.96),rgba(29,25,20,.98))!important}.v1826-relocation{border-color:rgba(126,160,172,.48)!important}.v1826-wayback,.v1826-save-health{border-color:rgba(146,130,220,.38)!important;background:linear-gradient(135deg,rgba(33,29,54,.96),rgba(29,25,20,.98))!important}",
    ".v1826-score-line{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:9px 0}.v1826-score-line>div{border:1px solid rgba(255,255,255,.10);border-radius:12px;background:rgba(255,255,255,.045);padding:11px;min-width:0}.v1826-score-line span{display:block;font-family:'JetBrains Mono',monospace;color:#b9a98e;text-transform:uppercase;letter-spacing:.12em;font-size:9px}.v1826-score-line b{display:block;color:#fff3df;font-family:'JetBrains Mono',monospace;font-size:19px;line-height:1.1;margin-top:5px;overflow-wrap:anywhere}.v1826-score-line em{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:9px;line-height:1.35;margin-top:5px;font-style:normal}.v1826-score-line .good{color:#b9dc8a}.v1826-score-line .bad{color:#e9927d}.v1826-score-line .gold{color:#f0ca7b}",
    ".v1826-plan-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:10px}.v1826-subtitle{font-family:'JetBrains Mono',monospace;color:#f0ca7b;text-transform:uppercase;letter-spacing:.14em;font-size:10px;margin:2px 0 8px}.v1826-subtitle.with-space{margin-top:14px}.v1826-plan,.v1826-health-card{display:block;width:100%;text-align:left;border:1px solid rgba(255,255,255,.10);border-radius:12px;background:rgba(255,255,255,.045);color:#d6c5aa;padding:11px;margin-bottom:8px;cursor:pointer}.v1826-plan:hover,.v1826-plan.selected,.v1826-health-card:hover,.v1826-health-card.selected{border-color:rgba(216,173,109,.62);background:rgba(216,173,109,.10)}.v1826-plan:disabled,.v1826-health-card:disabled{opacity:.42;cursor:not-allowed}.v1826-plan b,.v1826-health-card b{display:block;color:#fff3df;font-family:Fraunces,Georgia,serif;font-size:16px}.v1826-plan span,.v1826-plan em,.v1826-health-card p{display:block;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.4;margin-top:4px;color:#b9a98e}.v1826-plan em{color:#f0ca7b;font-style:normal}",
    ".v1826-case-grid,.v1826-health-grid,.v1826-tax-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:9px;margin-top:9px}.v1826-case-card,.v1826-tax-option{border:1px solid rgba(255,255,255,.10);border-radius:12px;background:rgba(255,255,255,.045);padding:11px;min-width:0}.v1826-case-card.bad{border-color:rgba(233,146,125,.42)}.v1826-case-card.gold{border-color:rgba(240,202,123,.36)}.v1826-case-card.good{border-color:rgba(185,220,138,.36)}.v1826-case-head{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}.v1826-case-head b,.v1826-tax-option b{display:block;color:#fff3df;font-size:15px}.v1826-case-head span{font-family:'JetBrains Mono',monospace;font-size:9px;color:#f0ca7b;text-transform:uppercase;letter-spacing:.12em}.v1826-case-card p{color:#d6c5aa;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.45;margin:7px 0 2px}.v1826-pill-row{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.v1826-pill-row span{border:1px solid rgba(255,255,255,.10);border-radius:999px;padding:5px 8px;color:#d6c5aa;font-family:'JetBrains Mono',monospace;font-size:9px;line-height:1.2}",
    ".v1826-button-grid,.v1826-button-grid.mini,.v1826-row-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.v1826-button-grid .money-btn,.v1826-row-actions .money-btn{min-width:86px;white-space:normal!important}.v1826-button-grid.mini .money-btn{min-width:74px;font-size:9px!important;padding:7px 8px!important}.v1826-empty{border:1px dashed rgba(255,255,255,.12);border-radius:12px;padding:11px;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.45;background:rgba(0,0,0,.12);margin:8px 0}.v1826-relocate-controls{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto;gap:8px;margin:10px 0}.v1826-relocate-controls select{min-width:0;border:1px solid rgba(216,173,109,.32);border-radius:8px;background:#100d0a;color:#f6ead8;padding:10px;font-family:'JetBrains Mono',monospace;font-size:11px}.v1826-tax-option.selected{border-color:rgba(216,173,109,.62);background:rgba(216,173,109,.10)}.v1826-tax-option span,.v1826-tax-option em{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.4;margin-top:4px}.v1826-tax-option strong{display:block;color:#fff3df;font-family:'JetBrains Mono',monospace;margin-top:6px}.v1826-tax-option strong.good{color:#b9dc8a}.v1826-tax-option strong.bad{color:#e9927d}",
    ".v1826-wayback-list{display:grid;gap:8px;margin-top:10px}.v1826-wayback-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;border:1px solid rgba(255,255,255,.10);border-radius:12px;background:rgba(255,255,255,.045);padding:10px}.v1826-wayback-row b{display:block;color:#fff3df}.v1826-wayback-row span{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.4;margin-top:3px}.v1826-sandbox-calm{border-color:rgba(185,220,138,.38)!important;background:linear-gradient(135deg,rgba(24,42,28,.96),rgba(29,25,20,.98))!important}",
    "@media(max-width:760px){.v1826-score-line,.v1826-plan-grid,.v1826-relocate-controls,.v1826-wayback-row{grid-template-columns:1fr}.v1826-case-grid,.v1826-health-grid,.v1826-tax-grid{grid-template-columns:1fr}.v1826-row-actions .money-btn,.v1826-button-grid .money-btn{flex:1 1 42%}}"
  ].join("\n");
  document.head.appendChild(style);
})();


/* HOTFIX v18.26.1 inserted */
/* LEDGER PATCH v18.26.1: state/window sync + undefined.length crash guard */
(function () {
  if (window.__ledgerV18261StateHotfix) return;
  window.__ledgerV18261StateHotfix = true;

  function msg18261(e) { return String(e && (e.message || e) || "Unknown error"); }
  function toast18261(text) {
    try { if (typeof addToast === "function") return addToast(text); } catch(e) {}
    try { if (typeof addLog === "function") return addLog(text); } catch(e) {}
    try { console.warn(text); } catch(e) {}
  }
  function getState18261() {
    var s = null;
    try { if (typeof state !== "undefined" && state && typeof state === "object") s = state; } catch(e) {}
    try { if (!s && window.state && typeof window.state === "object") s = window.state; } catch(e) {}
    if (s) {
      try { window.state = s; } catch(e) {}
    }
    return s;
  }
  function safeObj18261(obj, key) {
    if (!obj[key] || typeof obj[key] !== "object" || Array.isArray(obj[key])) obj[key] = {};
    return obj[key];
  }
  function safeArr18261(obj, key) {
    if (!Array.isArray(obj[key])) obj[key] = [];
    return obj[key];
  }
  function syncState18261() {
    var s = getState18261();
    if (!s) return null;

    safeObj18261(s, "stats");
    safeObj18261(s, "flags");
    safeObj18261(s, "actionsTaken");
    safeObj18261(s, "sandbox");
    safeObj18261(s, "finance");
    safeObj18261(s.finance, "debts");
    safeObj18261(s.finance, "incomeSources");
    safeObj18261(s.finance, "externalManager");
    safeObj18261(s.finance, "personalFirm");
    safeObj18261(s.finance.personalFirm, "staff");
    safeObj18261(s.finance, "fundTrackV189");
    safeObj18261(s, "peopleV1825");
    safeObj18261(s.peopleV1825, "actionCounts");
    safeObj18261(s.peopleV1825, "dateCounts");
    safeObj18261(s.peopleV1825, "findDateCounts");
    safeObj18261(s.peopleV1825, "childActivityCounts");
    safeObj18261(s, "familyV1825");
    safeObj18261(s, "educationV1825");

    if (!s.relationships || typeof s.relationships !== "object" || Array.isArray(s.relationships)) s.relationships = {};
    if (!s.school || typeof s.school !== "object" || Array.isArray(s.school)) s.school = { grade:75, level:"None", clubs:[] };
    if (!Array.isArray(s.school.clubs)) s.school.clubs = [];
    if (!s.school.subjectGrades || typeof s.school.subjectGrades !== "object" || Array.isArray(s.school.subjectGrades)) s.school.subjectGrades = {};
    if (!s.activityHabits || typeof s.activityHabits !== "object" || Array.isArray(s.activityHabits)) s.activityHabits = { lastYear:{}, currentYear:{}, streaks:{} };
    safeObj18261(s.activityHabits, "lastYear");
    safeObj18261(s.activityHabits, "currentYear");
    safeObj18261(s.activityHabits, "streaks");

    ["log", "inventory", "assets", "rentals", "clubs", "achievements", "timeSnapshotsV1814"].forEach(function (k) { safeArr18261(s, k); });
    ["cashFlowHistoryV1824", "taxTrueUpsV1824", "fundInvestorLedgerV1825", "legalCasesV1826", "healthClaimsV1826", "relocationHistoryV1826"].forEach(function (k) { safeArr18261(s.finance, k); });
    if (!Array.isArray(s.educationV1825.degrees)) s.educationV1825.degrees = [];
    if (s.peopleV1825.yearlySocialEnergy == null) s.peopleV1825.yearlySocialEnergy = 12;
    if (!s.familyV1825.childcarePlan) s.familyV1825.childcarePlan = "family";
    if (!s.saveHealthV1826 || typeof s.saveHealthV1826 !== "object" || Array.isArray(s.saveHealthV1826)) s.saveHealthV1826 = { backups:0, repairs:0, lastBackupAt:0 };

    s.money = Number.isFinite(Number(s.money)) ? Number(s.money) : 0;
    s.savings = Number.isFinite(Number(s.savings)) ? Number(s.savings) : 0;
    s.debt = Math.max(0, Number.isFinite(Number(s.debt)) ? Number(s.debt) : 0);
    s.finance.taxDebt = Math.max(0, Number.isFinite(Number(s.finance.taxDebt)) ? Number(s.finance.taxDebt) : 0);
    s.finance.medicalDebt = Math.max(0, Number.isFinite(Number(s.finance.medicalDebt || s.medicalDebt)) ? Number(s.finance.medicalDebt || s.medicalDebt) : 0);
    s.medicalDebt = s.finance.medicalDebt;
    try { window.state = s; } catch(e) {}
    return s;
  }

  window.syncLedgerStateV18261 = syncState18261;

  function fallbackHub18261(hubId, error) {
    var escaped = msg18261(error).replace(/[&<>"]/g, function (ch) { return ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[ch]; });
    return '<section class="panel v18261-recovered"><div class="section-label">Recovered Hub</div><div class="row-sub">The ' + String(hubId || 'current') + ' hub hit a state-shape issue and was protected instead of crashing.</div><div class="row-sub">' + escaped + '</div></section>';
  }

  function wrapFunction18261(name, fallback) {
    var old = null;
    try { old = window[name]; } catch(e) {}
    if (typeof old !== "function" || old.__ledgerV18261Wrapped) return;
    var wrapped = function () {
      syncState18261();
      try {
        return old.apply(this, arguments);
      } catch (e) {
        syncState18261();
        try {
          return old.apply(this, arguments);
        } catch (second) {
          if (fallback) return fallback.apply(this, [second].concat([].slice.call(arguments)));
          toast18261("Recovered from Ledger state error in " + name + ": " + msg18261(second));
          try { if (typeof render === "function") render(); } catch(renderError) {}
          return null;
        }
      }
    };
    wrapped.__ledgerV18261Wrapped = true;
    window[name] = wrapped;
    try { eval(name + " = window[name]"); } catch(e) {}
  }

  wrapFunction18261("renderHubContent", function (e, hubId) { return fallbackHub18261(hubId, e); });
  wrapFunction18261("renderLifeHub", function (e) { return fallbackHub18261("life", e); });
  [
    "render", "ageUp", "resolveLifeAndFinanceYear", "goHospital", "save", "loadFromSlot",
    "payTaxDebtV1824", "payCustomTaxDebtV1824", "raiseCashFromAssetsV1824", "payDebtWithAssetsV1824", "useCreditLineV1824", "payCreditLineV1824", "reviewCreditV1824",
    "relationAction", "dateAction", "findDate", "takeCareer", "setChildcarePlanV1825", "childActivityV1825", "startDegreeV1825", "pauseDegreeV1825", "setFundPayoutPolicyV1825", "applyFundInvestorShareV1825",
    "hireAccountantV1826", "hireAttorneyV1826", "legalCaseActionV1826", "setTaxResidenceV1826", "setHealthPlanV1826", "createWaybackCheckpointV1826", "restoreWaybackIndexV1826", "deleteWaybackIndexV1826", "backupCurrentSaveV1826", "repairSaveSlotV1826", "activateStressFreeV1826", "deactivateStressFreeV1826", "updateTaxRegionSelectV1826"
  ].forEach(function (name) { wrapFunction18261(name); });

  try {
    document.addEventListener("click", function () { syncState18261(); }, true);
    document.addEventListener("input", function () { syncState18261(); }, true);
  } catch(e) {}
  try {
    window.addEventListener("error", function (event) {
      var m = msg18261(event && event.error || event && event.message);
      if (/undefined.*length|reading ['\"]length['\"]|Cannot read properties of undefined/i.test(m)) {
        syncState18261();
        toast18261("Ledger recovered a missing-list state issue. Try the action again if the panel did not refresh.");
      }
    });
  } catch(e) {}

  syncState18261();
})();

