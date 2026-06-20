/* LEDGER PATCH v18.33: family trust + business enterprise gameplay */
(function () {
  if (window.__ledgerPatch1833FamilyEnterprise) return;
  window.__ledgerPatch1833FamilyEnterprise = true;
  var PATCH_ID = "v18.33";

  function n(value, fallback) {
    var x = Number(value);
    return Number.isFinite(x) ? x : (fallback || 0);
  }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, n(value))); }
  function round(value) { return Math.round(n(value)); }
  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>'"]/g, function (c) {
      return { "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" }[c];
    });
  }
  function money(value) {
    var x = n(value);
    var neg = x < 0;
    x = Math.abs(x);
    var out;
    if (x >= 1e12) out = "$" + (x / 1e12).toFixed(1) + "T";
    else if (x >= 1e9) out = "$" + (x / 1e9).toFixed(1) + "B";
    else if (x >= 1e6) out = "$" + (x / 1e6).toFixed(1) + "M";
    else if (x >= 1e3) out = "$" + Math.round(x / 1e3) + "K";
    else out = "$" + Math.round(x).toLocaleString();
    return neg ? "-" + out : out;
  }
  function pct(value) { return Math.round(n(value) * 100) + "%"; }
  function rootState() {
    try { if (typeof window.migrateLedgerStateV1832 === "function") window.migrateLedgerStateV1832(); } catch (e) {}
    try { if ((typeof state === "undefined" || !state) && window.state) state = window.state; } catch (e) {}
    try { if (typeof state !== "undefined" && state) { window.state = state; return state; } } catch (e) {}
    if (window.state) return window.state;
    return {};
  }
  function toast(msg) {
    try { if (typeof window.toast === "function") return window.toast(msg); } catch (e) {}
    try { if (typeof toast === "function") return toast(msg); } catch (e2) {}
    try { console.log(msg); } catch (e3) {}
  }
  function historyLog(msg, delta) {
    try { if (typeof window.addHistory === "function") return window.addHistory(msg, delta || {}); } catch (e) {}
    try { if (typeof addHistory === "function") return addHistory(msg, delta || {}); } catch (e2) {}
    var s = rootState();
    if (!Array.isArray(s.history)) s.history = [];
    s.history.unshift({ age:n(s.age), text:msg, delta:delta || {} });
    s.history = s.history.slice(0, 80);
  }
  function renderNow() {
    try { if (typeof window.save === "function") window.save(); } catch (e) {}
    try { if (typeof window.render === "function") return window.render(); } catch (e2) {}
    try { if (typeof render === "function") return render(); } catch (e3) {}
  }
  function safeId(value) { return String(value == null ? "" : value).replace(/[^a-zA-Z0-9_-]/g, "_"); }

  var GOVERNANCE = {
    informal: { name:"Informal", cost:0, harmony:0, readiness:0, desc:"Family talks happen casually. Cheap, but weak for large estates or multiple heirs." },
    council: { name:"Family Council", cost:12000, harmony:10, readiness:4, desc:"Yearly family meetings, expectations, and shared decisions." },
    constitution: { name:"Family Constitution", cost:45000, harmony:16, readiness:8, desc:"Written rules for business voting, heirs, dividends, roles, and disputes." },
    advisory: { name:"Advisory Board", cost:120000, harmony:12, readiness:18, desc:"Outside advisors help heirs run the family enterprise professionally." },
    familyoffice: { name:"Family Office Governance", cost:300000, harmony:22, readiness:22, desc:"Full rich-family structure for taxes, trusts, businesses, investing, and succession." }
  };
  var MISSIONS = {
    dynasty: "Build a multi-generation business dynasty",
    education: "Fund education and career launches for heirs",
    income: "Create steady family income",
    charity: "Build a public legacy and charity arm",
    independence: "Protect heirs without making them dependent"
  };
  var DIVIDEND_POLICIES = {
    reinvest: { name:"Reinvest", rate:.01, desc:"Most company cash stays in the business. Trust receives small owner income." },
    balanced: { name:"Balanced", rate:.04, desc:"Moderate trust dividends while leaving growth capital inside the business." },
    income: { name:"Family Income", rate:.08, desc:"Larger trust distributions. Good for heirs, slower business compounding." },
    none: { name:"No automatic dividend", rate:0, desc:"Manual distributions only." }
  };
  var TRAINING = {
    shadow: { name:"Founder Shadowing", cost:5000, readiness:6, continuity:5, desc:"Heir learns the business by following the founder." },
    school: { name:"Business School / Certificate", cost:25000, readiness:14, continuity:8, desc:"Formal training improves successor competence." },
    executive: { name:"Executive Rotation", cost:90000, readiness:24, continuity:18, desc:"Heir runs departments and learns real operating decisions." },
    governance: { name:"Governance Bootcamp", cost:35000, readiness:10, continuity:16, desc:"Teaches board behavior, voting, distributions, and fiduciary duties." }
  };

  function ensure() {
    var s = rootState();
    if (!s.finance || typeof s.finance !== "object") s.finance = {};
    if (!Array.isArray(s.finance.businesses)) s.finance.businesses = [];
    if (!s.finance.incomeSources || typeof s.finance.incomeSources !== "object") s.finance.incomeSources = {};
    if (!s.finance.debts || typeof s.finance.debts !== "object") s.finance.debts = {};
    if (!s.estateV1831 || typeof s.estateV1831 !== "object") s.estateV1831 = {};
    var e = s.estateV1831;
    if (!e.trustType) e.trustType = "none";
    if (e.hasWill == null) e.hasWill = false;
    if (!e.assets || typeof e.assets !== "object") e.assets = {};
    e.assets.trustCash = Math.max(0, round(e.assets.trustCash));
    e.assets.businessPercent = clamp(e.assets.businessPercent, 0, 1);
    if (!e.businessHoldingsV1833 || typeof e.businessHoldingsV1833 !== "object") e.businessHoldingsV1833 = {};
    if (!e.familyEnterpriseV1833 || typeof e.familyEnterpriseV1833 !== "object") e.familyEnterpriseV1833 = {};
    var fe = e.familyEnterpriseV1833;
    if (!fe.governance) fe.governance = "informal";
    if (!fe.mission) fe.mission = "dynasty";
    if (!fe.successorDefault) fe.successorDefault = "professional";
    fe.harmony = clamp(fe.harmony == null ? 50 : fe.harmony, 0, 100);
    fe.readiness = clamp(fe.readiness == null ? 0 : fe.readiness, 0, 100);
    fe.disputes = Math.max(0, round(fe.disputes));
    fe.councilMeetings = Math.max(0, round(fe.councilMeetings));
    fe.familyScore = Math.max(0, round(fe.familyScore));
    fe.totalTrustDividends = Math.max(0, round(fe.totalTrustDividends));
    fe.totalTrustLoans = Math.max(0, round(fe.totalTrustLoans));
    fe.totalHeirTraining = Math.max(0, round(fe.totalHeirTraining));
    if (!Array.isArray(fe.history)) fe.history = [];
    s.finance.businesses.forEach(function (b) { ensureBusiness(b); });
    return s;
  }
  function ensureBusiness(b) {
    if (!b || typeof b !== "object") return b;
    if (!b.id) b.id = b.name || ("business_" + Math.random().toString(36).slice(2));
    if (!b.name) b.name = String(b.id);
    if (b.value == null) b.value = 0;
    if (b.retainedEarnings == null) b.retainedEarnings = Math.max(0, n(b.businessCash));
    if (b.entityTaxDebt == null) b.entityTaxDebt = 0;
    if (!b.familyV1833 || typeof b.familyV1833 !== "object") b.familyV1833 = {};
    var f = b.familyV1833;
    f.trustPercent = clamp(f.trustPercent == null ? 0 : f.trustPercent, 0, 1);
    if (!f.successor) f.successor = "none";
    f.readiness = clamp(f.readiness == null ? 0 : f.readiness, 0, 100);
    f.continuity = clamp(f.continuity == null ? 0 : f.continuity, 0, 100);
    f.board = !!f.board;
    if (!f.dividendPolicy) f.dividendPolicy = "balanced";
    f.trustLoan = Math.max(0, round(f.trustLoan));
    f.trainingSpend = Math.max(0, round(f.trainingSpend));
    f.totalTrustDividends = Math.max(0, round(f.totalTrustDividends));
    if (!Array.isArray(f.history)) f.history = [];
    return b;
  }
  function businesses() { return ensure().finance.businesses || []; }
  function businessById(id) {
    return businesses().find(function (b) { return String(b.id) === String(id); }) || null;
  }
  function childrenList(s) {
    s = s || ensure();
    var out = [];
    try {
      Object.keys(s.relationships || {}).forEach(function (key) {
        var r = s.relationships[key];
        if (r && /child|son|daughter/i.test(String(r.role || r.type || ""))) out.push({ id:key, name:r.name || key, role:"Child" });
        if (r && /spouse|partner|wife|husband/i.test(String(r.role || r.type || ""))) out.push({ id:key, name:r.name || key, role:"Spouse" });
      });
    } catch (e) {}
    if (Array.isArray(s.children)) {
      s.children.forEach(function (c, idx) {
        if (typeof c === "string") out.push({ id:"child_" + idx, name:c, role:"Child" });
        else if (c) out.push({ id:c.id || c.name || ("child_" + idx), name:c.name || c.id || ("Child " + (idx + 1)), role:"Child" });
      });
    }
    var seen = {};
    return out.filter(function (x) { var k = String(x.name || x.id); if (seen[k]) return false; seen[k] = true; return true; });
  }
  function successorOptions(s) {
    var opts = childrenList(s).map(function (x) { return { id:String(x.id), name:x.name + " (" + x.role + ")" }; });
    opts.unshift({ id:"professional", name:"Professional CEO / Trustee" });
    opts.unshift({ id:"none", name:"No named successor" });
    return opts;
  }
  function trustActive(s) { s = s || ensure(); return s.estateV1831 && s.estateV1831.trustType && s.estateV1831.trustType !== "none"; }
  function businessValue(b) { return Math.max(0, round(n(b && b.value) + n(b && b.retainedEarnings))); }
  function totalBusinessValue() { return businesses().reduce(function (sum, b) { return sum + businessValue(b); }, 0); }
  function trustBusinessValue() { return businesses().reduce(function (sum, b) { ensureBusiness(b); return sum + businessValue(b) * n(b.familyV1833.trustPercent); }, 0); }
  function totalCompanyCash() { return businesses().reduce(function (sum, b) { return sum + Math.max(0, n(b.retainedEarnings)); }, 0); }
  function averageReadiness() {
    var list = businesses().filter(function (b) { return n(b.familyV1833 && b.familyV1833.trustPercent) > 0 || (b.familyV1833 && b.familyV1833.successor !== "none"); });
    if (!list.length) return 0;
    return Math.round(list.reduce(function (sum, b) { return sum + n(b.familyV1833.readiness) + n(b.familyV1833.continuity) * .35; }, 0) / list.length);
  }
  function enterpriseScore() {
    var s = ensure(), e = s.estateV1831, fe = e.familyEnterpriseV1833;
    var score = 0;
    var trustVal = trustBusinessValue();
    var totalVal = Math.max(1, totalBusinessValue());
    score += trustActive(s) ? 18 : 0;
    score += e.hasWill ? 8 : 0;
    score += clamp(trustVal / totalVal, 0, 1) * 22;
    score += clamp(fe.harmony, 0, 100) * .16;
    score += clamp(fe.readiness + averageReadiness(), 0, 130) * .18;
    score += (GOVERNANCE[fe.governance] && fe.governance !== "informal") ? 12 : 0;
    score += e.familyOffice ? 12 : 0;
    score += businesses().some(function (b) { return b.familyV1833 && b.familyV1833.board; }) ? 8 : 0;
    score -= Math.min(18, n(fe.disputes) * 3);
    fe.familyScore = Math.round(clamp(score, 0, 100));
    return fe.familyScore;
  }
  function payChecking(amount, label) {
    var s = ensure();
    amount = Math.max(0, round(amount));
    if (n(s.money) < amount) { toast("Need " + money(amount) + " in checking for " + label + "."); return false; }
    s.money = Math.max(0, round(n(s.money) - amount));
    return true;
  }
  function payBusinessOrChecking(b, amount, label) {
    var s = ensure();
    amount = Math.max(0, round(amount));
    var fromBiz = Math.min(amount, Math.max(0, n(b.retainedEarnings)));
    var remaining = amount - fromBiz;
    if (remaining > n(s.money)) return toast("Need " + money(amount) + " from company cash/checking for " + label + "."), false;
    b.retainedEarnings = Math.max(0, round(n(b.retainedEarnings) - fromBiz));
    s.money = Math.max(0, round(n(s.money) - remaining));
    return true;
  }
  function addFEHistory(text, amount) {
    var s = ensure(), fe = s.estateV1831.familyEnterpriseV1833;
    fe.history.unshift({ age:n(s.age), text:text, amount:round(amount), at:Date.now() });
    fe.history = fe.history.slice(0, 20);
  }
  function amountFrom(raw, max, inputId) {
    max = Math.max(0, n(max));
    if (raw === "all") return round(max);
    if (raw === "half") return round(max / 2);
    if (raw === "quarter") return round(max / 4);
    if (raw === "custom") {
      var el = document.getElementById(inputId);
      var v = el ? Number(String(el.value || "").replace(/[^0-9.]/g, "")) : 0;
      return Math.max(0, Math.min(round(v), max));
    }
    return Math.max(0, Math.min(round(raw), max));
  }

  window.setFamilyGovernanceV1833 = function (mode) {
    var s = ensure(), e = s.estateV1831, fe = e.familyEnterpriseV1833;
    var g = GOVERNANCE[mode] || GOVERNANCE.informal;
    if (fe.governance === mode) return toast("Family governance already uses " + g.name + ".");
    if (mode !== "informal" && !trustActive(s)) return toast("Create a trust first so governance has something to control.");
    var cost = g.cost;
    if (mode === "familyoffice" && e.familyOffice) cost = Math.round(cost * .25);
    if (!payChecking(cost, g.name)) return;
    fe.governance = mode;
    fe.harmony = clamp(n(fe.harmony) + g.harmony, 0, 100);
    fe.readiness = clamp(n(fe.readiness) + g.readiness, 0, 100);
    if (mode === "familyoffice") e.familyOffice = true;
    addFEHistory("Set governance: " + g.name, cost);
    historyLog("The family enterprise adopted " + g.name + ".", { money:-cost, stress:-2 });
    renderNow();
  };
  window.setFamilyMissionV1833 = function (mission) {
    var s = ensure(), fe = s.estateV1831.familyEnterpriseV1833;
    fe.mission = MISSIONS[mission] ? mission : "dynasty";
    fe.harmony = clamp(n(fe.harmony) + 2, 0, 100);
    addFEHistory("Updated family mission", 0);
    renderNow();
  };
  window.holdFamilyCouncilV1833 = function (topic) {
    var s = ensure(), fe = s.estateV1831.familyEnterpriseV1833;
    var cost = s.estateV1831.familyOffice ? 7500 : 15000;
    if (!payChecking(cost, "family council")) return;
    var readiness = 5, harmony = 7, disputes = 1;
    if (topic === "succession") readiness = 12;
    if (topic === "conflict") { harmony = 13; disputes = 3; }
    if (topic === "education") readiness = 9;
    if (topic === "charity") harmony = 9;
    fe.councilMeetings += 1;
    fe.readiness = clamp(n(fe.readiness) + readiness, 0, 100);
    fe.harmony = clamp(n(fe.harmony) + harmony, 0, 100);
    fe.disputes = Math.max(0, round(n(fe.disputes) - disputes));
    addFEHistory("Family council: " + topic, cost);
    historyLog("Held a family council about " + topic + ".", { money:-cost, stress:-2, confidence:1 });
    renderNow();
  };
  window.setBusinessTrustPercentV1833 = function (businessId, rawPct) {
    var s = ensure(), e = s.estateV1831;
    var b = businessById(businessId);
    if (!b) return toast("Business not found.");
    if (!trustActive(s)) return toast("Create a family trust before titling business shares into it.");
    ensureBusiness(b);
    var target = clamp(n(rawPct) / 100, 0, 1);
    var old = n(b.familyV1833.trustPercent);
    var increase = Math.max(0, target - old);
    var legalCost = increase > 0 ? Math.min(250000, Math.max(1200, round(businessValue(b) * increase * .006))) : 0;
    if (legalCost && !payChecking(legalCost, "business trust titling")) return;
    b.familyV1833.trustPercent = target;
    e.businessHoldingsV1833[String(b.id)] = { name:b.name, percent:target, value:round(businessValue(b) * target), updatedAge:n(s.age) };
    if (target >= .51 && e.clauses) e.clauses.businessSuccession = true;
    b.familyV1833.continuity = clamp(n(b.familyV1833.continuity) + (target >= .51 ? 10 : target > old ? 4 : 0), 0, 100);
    addFEHistory("Titled " + Math.round(target * 100) + "% of " + b.name + " to trust", legalCost);
    historyLog("Moved " + Math.round(target * 100) + "% of " + b.name + " into the family trust plan.", { money:-legalCost });
    renderNow();
  };
  window.appointBusinessSuccessorV1833 = function (businessId, successorId) {
    var s = ensure(), b = businessById(businessId);
    if (!b) return toast("Business not found.");
    ensureBusiness(b);
    if (!payChecking(2500, "successor paperwork")) return;
    b.familyV1833.successor = String(successorId || "professional");
    b.familyV1833.continuity = clamp(n(b.familyV1833.continuity) + 8, 0, 100);
    s.estateV1831.familyEnterpriseV1833.readiness = clamp(n(s.estateV1831.familyEnterpriseV1833.readiness) + 3, 0, 100);
    addFEHistory("Named successor for " + b.name, 2500);
    historyLog("Named a successor for " + b.name + ".", { money:-2500, stress:-1 });
    renderNow();
  };
  window.trainBusinessSuccessorV1833 = function (businessId, mode) {
    var s = ensure(), b = businessById(businessId), t = TRAINING[mode] || TRAINING.shadow;
    if (!b) return toast("Business not found.");
    ensureBusiness(b);
    if (b.familyV1833.successor === "none") return toast("Name a successor before training them.");
    if (!payBusinessOrChecking(b, t.cost, t.name)) return;
    b.familyV1833.readiness = clamp(n(b.familyV1833.readiness) + t.readiness, 0, 100);
    b.familyV1833.continuity = clamp(n(b.familyV1833.continuity) + t.continuity, 0, 100);
    b.familyV1833.trainingSpend += t.cost;
    s.estateV1831.familyEnterpriseV1833.totalHeirTraining += t.cost;
    s.estateV1831.familyEnterpriseV1833.readiness = clamp(n(s.estateV1831.familyEnterpriseV1833.readiness) + Math.round(t.readiness / 2), 0, 100);
    b.familyV1833.history.unshift({ age:n(s.age), action:"Training: " + t.name, cost:t.cost });
    b.familyV1833.history = b.familyV1833.history.slice(0, 10);
    addFEHistory("Trained successor at " + b.name, t.cost);
    historyLog("Invested in successor training for " + b.name + ".", { money:-t.cost, confidence:1 });
    renderNow();
  };
  window.toggleFamilyBusinessBoardV1833 = function (businessId) {
    var b = businessById(businessId);
    if (!b) return toast("Business not found.");
    ensureBusiness(b);
    if (b.familyV1833.board) return toast("Family board is already active for " + b.name + ".");
    if (!payBusinessOrChecking(b, 50000, "family business board")) return;
    b.familyV1833.board = true;
    b.familyV1833.continuity = clamp(n(b.familyV1833.continuity) + 18, 0, 100);
    b.familyV1833.readiness = clamp(n(b.familyV1833.readiness) + 8, 0, 100);
    addFEHistory("Created board for " + b.name, 50000);
    historyLog("Created a family business board for " + b.name + ".", { money:-50000, confidence:2 });
    renderNow();
  };
  window.setBusinessDividendPolicyV1833 = function (businessId, policy) {
    var b = businessById(businessId);
    if (!b) return toast("Business not found.");
    ensureBusiness(b);
    b.familyV1833.dividendPolicy = DIVIDEND_POLICIES[policy] ? policy : "balanced";
    b.familyV1833.history.unshift({ age:n(ensure().age), action:"Dividend policy: " + DIVIDEND_POLICIES[b.familyV1833.dividendPolicy].name, cost:0 });
    b.familyV1833.history = b.familyV1833.history.slice(0, 10);
    renderNow();
  };
  window.payBusinessDividendToTrustV1833 = function (businessId, rawAmount) {
    var s = ensure(), e = s.estateV1831, fe = e.familyEnterpriseV1833;
    var b = businessById(businessId);
    if (!b) return toast("Business not found.");
    ensureBusiness(b);
    if (!trustActive(s)) return toast("Create a trust first.");
    var trustPct = n(b.familyV1833.trustPercent);
    if (!trustPct) return toast("Title some of this business into the trust first.");
    var inputId = "v1833-div-" + safeId(b.id);
    var max = Math.max(0, round(n(b.retainedEarnings) * trustPct));
    var amount = amountFrom(rawAmount, max, inputId);
    if (!amount) return toast("No distributable trust dividend available.");
    b.retainedEarnings = Math.max(0, round(n(b.retainedEarnings) - amount));
    e.assets.trustCash = Math.max(0, round(n(e.assets.trustCash) + amount));
    b.familyV1833.totalTrustDividends += amount;
    fe.totalTrustDividends += amount;
    s.finance.incomeSources.trustBusinessDividendsV1833 = round(n(s.finance.incomeSources.trustBusinessDividendsV1833) + amount);
    addFEHistory("Trust dividend from " + b.name, amount);
    historyLog(b.name + " paid " + money(amount) + " to the family trust. It was not personal income.", { confidence:1 });
    renderNow();
  };
  window.trustLoanToBusinessV1833 = function (businessId, rawAmount) {
    var s = ensure(), e = s.estateV1831, fe = e.familyEnterpriseV1833;
    var b = businessById(businessId);
    if (!b) return toast("Business not found.");
    ensureBusiness(b);
    if (!trustActive(s)) return toast("Create a trust first.");
    var inputId = "v1833-loan-" + safeId(b.id);
    var amount = amountFrom(rawAmount, n(e.assets.trustCash), inputId);
    if (!amount) return toast("No trust cash available to invest or lend.");
    e.assets.trustCash = Math.max(0, round(n(e.assets.trustCash) - amount));
    b.retainedEarnings = Math.max(0, round(n(b.retainedEarnings) + amount));
    b.value = Math.max(0, round(n(b.value) + amount * .25));
    b.familyV1833.trustLoan += amount;
    b.familyV1833.continuity = clamp(n(b.familyV1833.continuity) + 4, 0, 100);
    fe.totalTrustLoans += amount;
    addFEHistory("Trust financed " + b.name, amount);
    historyLog("The trust financed " + b.name + " with " + money(amount) + ".", { confidence:1 });
    renderNow();
  };
  window.repayTrustLoanV1833 = function (businessId, rawAmount) {
    var s = ensure(), e = s.estateV1831;
    var b = businessById(businessId);
    if (!b) return toast("Business not found.");
    ensureBusiness(b);
    var inputId = "v1833-repay-" + safeId(b.id);
    var max = Math.min(n(b.familyV1833.trustLoan), n(b.retainedEarnings));
    var amount = amountFrom(rawAmount, max, inputId);
    if (!amount) return toast("No repayable trust loan amount available.");
    b.retainedEarnings = Math.max(0, round(n(b.retainedEarnings) - amount));
    b.familyV1833.trustLoan = Math.max(0, round(n(b.familyV1833.trustLoan) - amount));
    e.assets.trustCash = Math.max(0, round(n(e.assets.trustCash) + amount));
    addFEHistory("Business repaid trust loan", amount);
    renderNow();
  };
  window.yearlyFamilyEnterpriseV1833 = function (silent) {
    var s = ensure(), e = s.estateV1831, fe = e.familyEnterpriseV1833;
    var ageKey = String(n(s.age));
    if (fe.lastProcessedAge === ageKey) return false;
    fe.lastProcessedAge = ageKey;
    var autoDiv = 0;
    businesses().forEach(function (b) {
      ensureBusiness(b);
      var pctTrust = n(b.familyV1833.trustPercent);
      if (!pctTrust) return;
      var pol = DIVIDEND_POLICIES[b.familyV1833.dividendPolicy] || DIVIDEND_POLICIES.balanced;
      var dividend = Math.max(0, round(n(b.retainedEarnings) * pctTrust * n(pol.rate)));
      if (dividend) {
        b.retainedEarnings = Math.max(0, round(n(b.retainedEarnings) - dividend));
        e.assets.trustCash = Math.max(0, round(n(e.assets.trustCash) + dividend));
        b.familyV1833.totalTrustDividends += dividend;
        autoDiv += dividend;
      }
      if (b.familyV1833.board) b.familyV1833.continuity = clamp(n(b.familyV1833.continuity) + 2, 0, 100);
      if (b.familyV1833.successor !== "none") b.familyV1833.readiness = clamp(n(b.familyV1833.readiness) + 1, 0, 100);
      var continuityBoost = clamp(n(b.familyV1833.continuity) / 100, 0, 1) * .006;
      if (continuityBoost) b.value = Math.max(0, round(n(b.value) * (1 + continuityBoost)));
    });
    if (autoDiv) {
      fe.totalTrustDividends += autoDiv;
      s.finance.incomeSources.trustBusinessDividendsV1833 = round(n(s.finance.incomeSources.trustBusinessDividendsV1833) + autoDiv);
      addFEHistory("Automatic trust business dividends", autoDiv);
      if (!silent) historyLog("Family businesses sent " + money(autoDiv) + " to the trust under dividend policies.", {});
    }
    if (fe.governance === "informal" && trustBusinessValue() > 500000) {
      fe.disputes += 1;
      fe.harmony = clamp(n(fe.harmony) - 2, 0, 100);
    } else if (fe.governance !== "informal") {
      fe.harmony = clamp(n(fe.harmony) + 1, 0, 100);
      fe.readiness = clamp(n(fe.readiness) + 1, 0, 100);
    }
    enterpriseScore();
    return true;
  };

  function metric(label, value, klass, sub) {
    return '<div class="v1833-metric ' + esc(klass || "") + '"><span>' + esc(label) + '</span><b>' + esc(value) + '</b>' + (sub ? '<em>' + esc(sub) + '</em>' : '') + '</div>';
  }
  function button(label, klass, action, disabled) {
    return '<button class="money-btn ' + esc(klass || "") + '" onclick="event.preventDefault();event.stopPropagation();' + action + '" ' + (disabled ? 'disabled' : '') + '>' + esc(label) + '</button>';
  }
  function selectHtml(value, options, onchange) {
    return '<select onchange="event.preventDefault();event.stopPropagation();' + onchange + '(this.value)">' + options.map(function (o) {
      return '<option value="' + esc(o.id) + '" ' + (String(value) === String(o.id) ? 'selected' : '') + '>' + esc(o.name) + '</option>';
    }).join("") + '</select>';
  }

  function successorSelectHtml(b, value, options) {
    var id = String(b && b.id);
    return '<select onchange="event.preventDefault();event.stopPropagation();appointBusinessSuccessorV1833(\'' + esc(id) + '\',this.value)">' + options.map(function (o) {
      return '<option value="' + esc(o.id) + '" ' + (String(value) === String(o.id) ? 'selected' : '') + '>' + esc(o.name) + '</option>';
    }).join("") + '</select>';
  }

  function governanceOptionsHtml(fe) {
    return Object.keys(GOVERNANCE).map(function (id) {
      var g = GOVERNANCE[id], active = fe.governance === id;
      return '<button class="v1833-option ' + (active ? 'active' : '') + '" onclick="event.preventDefault();event.stopPropagation();setFamilyGovernanceV1833(\'' + esc(id) + '\')" ' + (active ? 'disabled' : '') + '><b>' + esc(g.name) + '</b><span>' + money(g.cost) + ' · ' + esc(g.desc) + '</span></button>';
    }).join("");
  }
  function businessEnterpriseCard(b, s) {
    ensureBusiness(b);
    var f = b.familyV1833;
    var sid = safeId(b.id);
    var successorList = successorOptions(s);
    var pol = DIVIDEND_POLICIES[f.dividendPolicy] || DIVIDEND_POLICIES.balanced;
    var trustPct = n(f.trustPercent);
    var trustVal = businessValue(b) * trustPct;
    var distributable = Math.max(0, round(n(b.retainedEarnings) * trustPct));
    var trainingButtons = Object.keys(TRAINING).map(function (id) {
      var t = TRAINING[id];
      return button(t.name, "", "trainBusinessSuccessorV1833('" + esc(b.id) + "','" + esc(id) + "')", f.successor === "none");
    }).join("");
    var policyButtons = Object.keys(DIVIDEND_POLICIES).map(function (id) {
      return button(DIVIDEND_POLICIES[id].name, f.dividendPolicy === id ? "gold" : "", "setBusinessDividendPolicyV1833('" + esc(b.id) + "','" + esc(id) + "')", false);
    }).join("");
    return '<div class="v1833-business-card"><div class="v1833-card-head"><div><b>' + esc(b.name) + '</b><span>' + esc(b.entityType || "business") + ' · ' + esc(pol.name) + '</span></div><strong>' + Math.round(trustPct * 100) + '% in trust</strong></div>' +
      '<div class="v1833-grid four">' + metric("Value", money(businessValue(b)), "gold", "Company + cash") + metric("Company cash", money(n(b.retainedEarnings)), "good", "Not personal") + metric("Trust stake", money(trustVal), trustPct ? "good" : "bad", "Business succession") + metric("Readiness", Math.round(n(f.readiness)) + "/100", n(f.readiness) >= 50 ? "good" : "", "Successor prep") + metric("Continuity", Math.round(n(f.continuity)) + "/100", n(f.continuity) >= 50 ? "good" : "", f.board ? "Board active" : "No board") + metric("Trust loan", money(n(f.trustLoan)), n(f.trustLoan) ? "blue" : "", "Trust financed") + metric("Distributable", money(distributable), distributable ? "good" : "", "Based on trust stake") + metric("Entity tax", money(n(b.entityTaxDebt)), n(b.entityTaxDebt) ? "bad" : "good", "Company debt") + '</div>' +
      '<div class="v1833-subtitle">Title business into family trust</div><div class="v1833-actions">' + button("25% Trust", "", "setBusinessTrustPercentV1833('" + esc(b.id) + "',25)", !trustActive(s)) + button("51% Control", "gold", "setBusinessTrustPercentV1833('" + esc(b.id) + "',51)", !trustActive(s)) + button("100% Dynasty", "green", "setBusinessTrustPercentV1833('" + esc(b.id) + "',100)", !trustActive(s)) + button("Remove", "red", "setBusinessTrustPercentV1833('" + esc(b.id) + "',0)", false) + '</div>' +
      '<div class="v1833-controls"><label><span>Successor</span>' + successorSelectHtml(b, f.successor, successorList) + '</label></div>' +
      '<div class="v1833-subtitle">Train successor</div><div class="v1833-actions small">' + trainingButtons + '</div>' +
      '<div class="v1833-subtitle">Dividend policy</div><div class="v1833-actions small">' + policyButtons + '</div><div class="v1833-note small"><b>Policy:</b> ' + esc(pol.desc) + '</div>' +
      '<div class="v1833-custom-row"><input id="v1833-div-' + esc(sid) + '" type="number" min="0" placeholder="Trust dividend amount" /><button class="money-btn green" onclick="event.preventDefault();event.stopPropagation();payBusinessDividendToTrustV1833(\'' + esc(b.id) + '\',\'custom\')">Pay to Trust</button><button class="money-btn green" onclick="event.preventDefault();event.stopPropagation();payBusinessDividendToTrustV1833(\'' + esc(b.id) + '\',\'all\')">Pay Max</button></div>' +
      '<div class="v1833-custom-row"><input id="v1833-loan-' + esc(sid) + '" type="number" min="0" placeholder="Trust loan/investment" /><button class="money-btn blue" onclick="event.preventDefault();event.stopPropagation();trustLoanToBusinessV1833(\'' + esc(b.id) + '\',\'custom\')">Trust → Business</button><input id="v1833-repay-' + esc(sid) + '" type="number" min="0" placeholder="Repay trust" /><button class="money-btn" onclick="event.preventDefault();event.stopPropagation();repayTrustLoanV1833(\'' + esc(b.id) + '\',\'custom\')">Repay Trust</button></div>' +
      '<div class="v1833-actions">' + button("Create Family Board", "blue", "toggleFamilyBusinessBoardV1833('" + esc(b.id) + "')", !!f.board) + '</div>' +
    '</div>';
  }
  function renderFamilyEnterpriseCommand() {
    var s = ensure(), e = s.estateV1831, fe = e.familyEnterpriseV1833;
    var score = enterpriseScore();
    var list = businesses();
    var g = GOVERNANCE[fe.governance] || GOVERNANCE.informal;
    var recent = fe.history.slice(0, 5).map(function (h) { return '<div class="v1833-history-row"><span>Age ' + esc(h.age) + '</span><b>' + esc(h.text) + '</b><em>' + (h.amount ? money(h.amount) : '—') + '</em></div>'; }).join("");
    return '<section class="money-section v1833-family-enterprise"><div class="money-section-title">Family Enterprise / Business Trust <span>make the trust fun</span></div>' +
      '<div class="v1833-hero"><div><div class="v1833-kicker">Trust + business gameplay</div><h3>' + esc(MISSIONS[fe.mission] || MISSIONS.dynasty) + '</h3><p>Move business interests into the family trust, train heirs, set governance, pay dividends to the trust, and build continuity so the business survives the founder.</p></div><div class="v1833-score"><b>' + score + '</b><span>dynasty score</span></div></div>' +
      '<div class="v1833-grid four">' + metric("Trust cash", money(n(e.assets.trustCash)), "good", "Estate money") + metric("Business stake", money(trustBusinessValue()), trustBusinessValue() ? "good" : "bad", "Titled to trust") + metric("Governance", g.name, fe.governance === "informal" ? "bad" : "gold", "Family rules") + metric("Heir readiness", averageReadiness() + "/100", averageReadiness() >= 50 ? "good" : "", "Across businesses") + metric("Harmony", Math.round(n(fe.harmony)) + "/100", n(fe.harmony) >= 60 ? "good" : "", "Family risk") + metric("Disputes", String(n(fe.disputes)), n(fe.disputes) ? "bad" : "good", "Lower is better") + metric("Trust dividends", money(n(fe.totalTrustDividends)), "green", "Not personal income") + metric("Trust loans", money(n(fe.totalTrustLoans)), "blue", "Trust financed companies") + '</div>' +
      '<div class="v1833-controls"><label><span>Family Mission</span>' + selectHtml(fe.mission, Object.keys(MISSIONS).map(function (id) { return { id:id, name:MISSIONS[id] }; }), "setFamilyMissionV1833") + '</label></div>' +
      '<div class="v1833-subtitle">Family governance</div><div class="v1833-option-grid">' + governanceOptionsHtml(fe) + '</div>' +
      '<div class="v1833-subtitle">Family council actions</div><div class="v1833-actions">' + button("Succession Meeting", "gold", "holdFamilyCouncilV1833('succession')", !trustActive(s)) + button("Conflict Mediation", "red", "holdFamilyCouncilV1833('conflict')", !trustActive(s)) + button("Heir Education", "blue", "holdFamilyCouncilV1833('education')", !trustActive(s)) + button("Charity Legacy", "green", "holdFamilyCouncilV1833('charity')", !trustActive(s)) + '</div>' +
      (list.length ? '<div class="v1833-subtitle">Family businesses</div><div class="v1833-business-list">' + list.map(function (b) { return businessEnterpriseCard(b, s); }).join("") + '</div>' : '<div class="v1833-note bad">No businesses owned yet. Start or buy a business first, then use this desk to title it into the family trust and train successors.</div>') +
      (recent ? '<div class="v1833-subtitle">Family enterprise ledger</div><div class="v1833-history">' + recent + '</div>' : '') +
    '</section>';
  }
  function renderTrustStrategyPanel() {
    var s = ensure(), e = s.estateV1831, fe = e.familyEnterpriseV1833;
    return '<section class="money-section v1833-trust-strategy"><div class="money-section-title">Trust Strategy: Business Succession <span>legal + family office</span></div>' +
      '<div class="v1833-note"><b>Design rule:</b> personal tax applies when money is paid to you. Business dividends paid to the trust stay in the estate/trust lane and should not hit checking as personal income.</div>' +
      '<div class="v1833-grid four">' + metric("Plan", e.trustType === "none" ? "No trust" : e.trustType, e.trustType === "none" ? "bad" : "good", e.hasWill ? "Will active" : "No will") + metric("Business succession", e.clauses && e.clauses.businessSuccession ? "Active" : "Missing", e.clauses && e.clauses.businessSuccession ? "good" : "bad", "Estate clause") + metric("Family office", e.familyOffice ? "Active" : "Not hired", e.familyOffice ? "good" : "", "Advanced wealth desk") + metric("Dynasty score", enterpriseScore() + "/100", enterpriseScore() >= 60 ? "good" : "gold", "Trust + heirs + businesses") + '</div>' +
      '<div class="v1833-actions">' + button("Open Business Trust Desk", "blue", "setTabV16 ? setTabV16('business') : setTab('business')", false) + button("Run Estate Dry Run", "gold", "runEstateDryRunV1832 ? runEstateDryRunV1832() : null", false) + '</div></section>';
  }
  function renderEnterpriseSummary() {
    var s = ensure(), e = s.estateV1831;
    return '<section class="money-section v1833-enterprise-summary"><div class="money-section-title">Family Business Snapshot <span>trust ownership</span></div><div class="v1833-grid four">' + metric("Family score", enterpriseScore() + "/100", enterpriseScore() >= 60 ? "good" : "gold", "Succession health") + metric("Trust business value", money(trustBusinessValue()), trustBusinessValue() ? "good" : "", "Protected business stake") + metric("Trust cash", money(n(e.assets.trustCash)), "green", "Estate money") + metric("Company cash", money(totalCompanyCash()), "gold", "Business money") + '</div></section>';
  }
  function scrub(html) {
    var out = String(html || "");
    ["v1833-family-enterprise", "v1833-trust-strategy", "v1833-enterprise-summary"].forEach(function (marker) {
      var idx = out.indexOf(marker), guard = 0;
      while (idx >= 0 && guard++ < 20) {
        var start = out.lastIndexOf("<section", idx);
        var end = out.indexOf("</section>", idx);
        if (start < 0 || end < 0) break;
        out = out.slice(0, start) + out.slice(end + 10);
        idx = out.indexOf(marker);
      }
    });
    return out;
  }

  var previousRenderHubContent = window.renderHubContent || (typeof renderHubContent === "function" ? renderHubContent : null);
  if (previousRenderHubContent && !window.__ledgerRender1833Wrapped) {
    window.__ledgerRender1833Wrapped = true;
    window.renderHubContent = function (hubId) {
      ensure();
      var html = "";
      try { html = previousRenderHubContent.apply(this, arguments) || ""; } catch (e) { html = '<section class="panel"><div class="row-title">Recovered hub</div><div class="row-sub">' + esc(e.message || e) + '</div></section>'; }
      html = scrub(html);
      if (hubId === "business") return renderFamilyEnterpriseCommand() + html;
      if (hubId === "law" || hubId === "legal") return renderTrustStrategyPanel() + html;
      if (hubId === "more") return renderEnterpriseSummary() + html;
      if (hubId === "money" || hubId === "finance") return renderEnterpriseSummary() + html;
      return html;
    };
    try { renderHubContent = window.renderHubContent; } catch (e) {}
  }

  var previousAgeUp = window.ageUp || (typeof ageUp === "function" ? ageUp : null);
  if (typeof previousAgeUp === "function" && !previousAgeUp.__ledger1833Wrapped) {
    var ageFn = function () {
      ensure();
      var result = previousAgeUp.apply(this, arguments);
      try { yearlyFamilyEnterpriseV1833(false); } catch (e) { try { console.warn("v18.33 yearly family enterprise failed", e); } catch(ignore) {} }
      return result;
    };
    ageFn.__ledger1833Wrapped = true;
    window.ageUp = ageFn;
    try { ageUp = window.ageUp; } catch (e) {}
  }

  var previousEstateDryRun = window.estateDryRunV1832;
  if (typeof previousEstateDryRun === "function" && !previousEstateDryRun.__ledger1833Wrapped) {
    var dryFn = function (s) {
      s = s || ensure();
      var x = previousEstateDryRun.apply(this, arguments) || {};
      var score = enterpriseScore();
      var bizProtected = trustBusinessValue();
      x.protectedValue = round(n(x.protectedValue) + bizProtected * .15);
      x.netTransfer = round(n(x.netTransfer) + bizProtected * clamp(score / 100, 0, .20));
      if (!Array.isArray(x.issues)) x.issues = [];
      if (businesses().length && !bizProtected) x.issues.push("Business not titled to trust");
      if (businesses().length && averageReadiness() < 35) x.issues.push("Low successor readiness");
      x.familyEnterpriseScoreV1833 = score;
      x.trustBusinessValueV1833 = bizProtected;
      return x;
    };
    dryFn.__ledger1833Wrapped = true;
    window.estateDryRunV1832 = dryFn;
  }

  var previousRenderDeath = window.renderDeath || (typeof renderDeath === "function" ? renderDeath : null);
  if (typeof previousRenderDeath === "function" && !previousRenderDeath.__ledger1833Wrapped) {
    var deathFn = function () {
      var html = "";
      try { html = previousRenderDeath.apply(this, arguments) || ""; } catch (e) { html = ""; }
      var s = ensure();
      var panel = '<section class="v1833-death-panel"><div class="v1833-death-title">Family Enterprise Settlement</div><div class="legacy"><div><span class="mono">Business in Trust</span><b>' + money(trustBusinessValue()) + '</b></div><div><span class="mono">Successor Readiness</span><b>' + averageReadiness() + '/100</b></div><div><span class="mono">Family Score</span><b>' + enterpriseScore() + '/100</b></div><div><span class="mono">Trust Cash</span><b>' + money(n(s.estateV1831.assets.trustCash)) + '</b></div></div><div class="cause">Business succession now considers trust ownership, named successors, family governance, and heir training.</div></section>';
      return String(html).replace('</div></div>', panel + '</div></div>');
    };
    deathFn.__ledger1833Wrapped = true;
    window.renderDeath = deathFn;
    try { renderDeath = window.renderDeath; } catch (e) {}
  }

  function injectStyles() {
    if (document.getElementById("ledger-v1833-style")) return;
    var style = document.createElement("style");
    style.id = "ledger-v1833-style";
    style.textContent = [
      ".v1833-family-enterprise,.v1833-trust-strategy,.v1833-enterprise-summary{border-color:rgba(143,175,108,.55)!important;background:linear-gradient(135deg,rgba(21,45,31,.97),rgba(29,25,20,.98))!important;overflow:hidden!important}.v1833-family-enterprise{border-color:rgba(216,173,109,.58)!important;background:linear-gradient(135deg,rgba(58,42,17,.97),rgba(22,31,26,.98))!important}.v1833-trust-strategy{border-color:rgba(126,160,172,.52)!important;background:linear-gradient(135deg,rgba(18,38,45,.97),rgba(29,25,20,.98))!important}",
      ".v1833-hero{display:flex;justify-content:space-between;gap:14px;align-items:stretch;border:1px solid rgba(255,255,255,.10);background:linear-gradient(135deg,rgba(216,173,109,.16),rgba(143,175,108,.09));border-radius:16px;padding:14px;margin:10px 0}.v1833-kicker{font-family:'JetBrains Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:.14em;color:#d8ad6d;margin-bottom:5px}.v1833-hero h3{margin:0 0 6px;font-size:20px}.v1833-hero p{margin:0;color:#cbbda5;font-size:13px;line-height:1.45}.v1833-score{min-width:92px;border:1px solid rgba(216,173,109,.25);border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.16)}.v1833-score b{font-family:'JetBrains Mono',monospace;font-size:30px;color:#d8ad6d}.v1833-score span{font-family:'JetBrains Mono',monospace;font-size:9px;color:#aa9a82;text-transform:uppercase;letter-spacing:.1em}",
      ".v1833-grid{display:grid;gap:8px;margin:10px 0}.v1833-grid.four{grid-template-columns:repeat(4,minmax(0,1fr))}.v1833-metric{border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.045);border-radius:12px;padding:10px;min-width:0}.v1833-metric span{display:block;font-family:'JetBrains Mono',monospace;font-size:9px;color:#aa9a82;text-transform:uppercase;letter-spacing:.08em}.v1833-metric b{display:block;font-family:'JetBrains Mono',monospace;font-size:15px;color:#f2e7d6;margin-top:4px;overflow-wrap:anywhere}.v1833-metric em{display:block;font-family:'JetBrains Mono',monospace;font-size:9px;line-height:1.35;color:#8e806c;font-style:normal;margin-top:4px}.v1833-metric.good b,.v1833-metric.green b{color:#8faf6c}.v1833-metric.bad b{color:#cc7661}.v1833-metric.gold b{color:#d8ad6d}.v1833-metric.blue b{color:#7ea0ac}",
      ".v1833-note{font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.55;color:#b9a98e;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.04);border-radius:10px;padding:10px;margin:8px 0}.v1833-note b{color:#d8ad6d}.v1833-note.bad{border-color:rgba(204,118,97,.38)}.v1833-note.small{font-size:9px}.v1833-subtitle{font-family:'JetBrains Mono',monospace;color:#d8ad6d;font-size:10px;text-transform:uppercase;letter-spacing:.13em;margin:14px 0 7px}.v1833-actions{display:flex;gap:7px;flex-wrap:wrap;margin:8px 0}.v1833-actions .money-btn{flex:1 1 120px}.v1833-actions.small .money-btn{font-size:9px!important;padding:7px!important;white-space:normal!important}",
      ".v1833-option-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.v1833-option{width:100%;text-align:left;border:1px solid rgba(255,255,255,.11);background:rgba(255,255,255,.045);color:#f2e7d6;border-radius:12px;padding:11px;cursor:pointer}.v1833-option.active{border-color:#d8ad6d;background:rgba(216,173,109,.12)}.v1833-option b{display:block;font-size:14px}.v1833-option span{display:block;font-family:'JetBrains Mono',monospace;color:#aa9a82;font-size:9px;line-height:1.4;margin-top:4px}.v1833-controls{display:grid;grid-template-columns:1fr;gap:8px;margin:9px 0}.v1833-controls label{display:grid;gap:6px}.v1833-controls span{font-family:'JetBrains Mono',monospace;color:#aa9a82;font-size:9px;text-transform:uppercase;letter-spacing:.1em}.v1833-controls select{width:100%}",
      ".v1833-business-list{display:grid;gap:10px}.v1833-business-card{border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.16);border-radius:14px;padding:12px}.v1833-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:8px}.v1833-card-head b{display:block;color:#fff3df;font-size:17px}.v1833-card-head span{display:block;font-family:'JetBrains Mono',monospace;font-size:10px;color:#aa9a82;margin-top:3px}.v1833-card-head strong{font-family:'JetBrains Mono',monospace;font-size:11px;color:#8faf6c;border:1px solid rgba(143,175,108,.28);border-radius:999px;padding:4px 8px;background:rgba(143,175,108,.08);white-space:nowrap}.v1833-custom-row{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:7px;margin:8px 0}.v1833-custom-row input{min-width:0}.v1833-history{border:1px solid rgba(255,255,255,.09);border-radius:12px;overflow:hidden}.v1833-history-row{display:grid;grid-template-columns:64px 1fr auto;gap:8px;padding:8px 10px;border-bottom:1px solid rgba(255,255,255,.07);font-family:'JetBrains Mono',monospace;font-size:9px}.v1833-history-row:last-child{border-bottom:0}.v1833-history-row span{color:#aa9a82}.v1833-history-row b{color:#f2e7d6}.v1833-history-row em{font-style:normal;color:#d8ad6d}.v1833-death-panel{margin:14px 0;padding:14px;border:1px solid rgba(143,175,108,.45);background:rgba(20,42,27,.36);border-radius:10px}.v1833-death-title{font-family:'JetBrains Mono',monospace;color:#8faf6c;text-transform:uppercase;letter-spacing:.14em;font-size:10px;margin-bottom:8px}",
      "@media(max-width:760px){.v1833-grid.four{grid-template-columns:repeat(2,minmax(0,1fr))}.v1833-option-grid{grid-template-columns:1fr}.v1833-hero{flex-direction:column}.v1833-score{min-height:82px}.v1833-custom-row{grid-template-columns:1fr}.v1833-actions .money-btn{flex-basis:45%}}@media(max-width:430px){.v1833-grid.four{grid-template-columns:1fr}.v1833-actions .money-btn{flex-basis:100%}.v1833-card-head{flex-direction:column}.v1833-card-head strong{white-space:normal}.v1833-history-row{grid-template-columns:1fr}}"
    ].join("\n");
    document.head.appendChild(style);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { injectStyles(); ensure(); });
  else { injectStyles(); ensure(); }
})();

