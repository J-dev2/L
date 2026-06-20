/* LEDGER PATCH v18.32: cleanup, canonical tax audit, stronger interviews, save migration, trust dry run */
(function () {
  if (window.__ledgerPatch1832CleanupStability) return;
  window.__ledgerPatch1832CleanupStability = true;

  var PATCH_ID = "v18.32";

  function rootState() {
    try { if (typeof state !== "undefined" && state && typeof state === "object") return state; } catch (e) {}
    try { if (window.state && typeof window.state === "object") return window.state; } catch (e) {}
    return null;
  }
  function assignState(s) {
    try { state = s; } catch (e) {}
    try { window.state = s; } catch (e) {}
    return s;
  }
  function n(value, fallback) {
    var num = Number(value);
    return Number.isFinite(num) ? num : (fallback == null ? 0 : fallback);
  }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, n(value))); }
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  function money(value) {
    var v = Math.round(n(value));
    var sign = v < 0 ? "-" : "";
    v = Math.abs(v);
    if (v >= 1e12) return sign + "$" + (v / 1e12).toFixed(1).replace(/\.0$/, "") + "T";
    if (v >= 1e9) return sign + "$" + (v / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
    if (v >= 1e6) return sign + "$" + (v / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (v >= 1e4) return sign + "$" + Math.round(v / 1000).toLocaleString() + "K";
    return sign + "$" + v.toLocaleString();
  }
  function pct(value) { return (n(value) * 100).toFixed(1).replace(/\.0$/, "") + "%"; }
  function toast(text) {
    try { if (typeof addToast === "function") return addToast(text); } catch (e) {}
    try { if (typeof addLog === "function") return addLog(text, {}); } catch (e) {}
    try { console.log(text); } catch (e) {}
  }
  function log(text, deltas) {
    try { if (typeof addLog === "function") return addLog(text, deltas || {}); } catch (e) {}
    var s = rootState();
    if (s) {
      if (!Array.isArray(s.log)) s.log = [];
      s.log.push({ age: n(s.age), text: text, deltas: deltas || {}, patch: PATCH_ID });
      if (s.log.length > 300) s.log = s.log.slice(-300);
    }
  }
  function saveRender() {
    try { if (typeof save === "function") save(); } catch (e) {}
    try { if (typeof render === "function") render(); } catch (e) {}
  }
  function obj(parent, key) {
    if (!parent[key] || typeof parent[key] !== "object" || Array.isArray(parent[key])) parent[key] = {};
    return parent[key];
  }
  function arr(parent, key) {
    if (!Array.isArray(parent[key])) parent[key] = [];
    return parent[key];
  }
  function ensureBusiness(b) {
    if (!b || typeof b !== "object") return b;
    if (!b.id) b.id = "business_" + Math.random().toString(36).slice(2, 8);
    if (!b.name) b.name = b.id;
    if (!b.entityType) b.entityType = n(b.value) >= 150000 ? "llc" : "soleprop";
    b.value = Math.max(0, Math.round(n(b.value)));
    b.lastIncome = Math.round(n(b.lastIncome));
    b.retainedEarnings = Math.max(0, Math.round(n(b.retainedEarnings || b.businessCash)));
    b.entityTaxDebt = Math.max(0, Math.round(n(b.entityTaxDebt)));
    b.complianceDue = Math.max(0, Math.round(n(b.complianceDue)));
    b.ops = obj(b, "ops");
    if (!Array.isArray(b.historyV1830)) b.historyV1830 = [];
    return b;
  }
  function migrateState() {
    var s = rootState();
    var hadState = !!s;
    if (!s) s = {};
    if (hadState) assignState(s);
    s.stats = obj(s, "stats");
    s.flags = obj(s, "flags");
    s.actionsTaken = obj(s, "actionsTaken");
    s.sandbox = obj(s, "sandbox");
    s.log = arr(s, "log");
    s.inventory = arr(s, "inventory");
    s.assets = arr(s, "assets");
    s.rentals = arr(s, "rentals");
    s.children = Array.isArray(s.children) ? s.children : [];
    if (!s.relationships || typeof s.relationships !== "object" || Array.isArray(s.relationships)) s.relationships = {};

    s.finance = obj(s, "finance");
    var f = s.finance;
    f.debts = obj(f, "debts");
    f.incomeSources = obj(f, "incomeSources");
    f.businesses = arr(f, "businesses");
    f.businesses.forEach(ensureBusiness);
    f.businessTaxV1830 = obj(f, "businessTaxV1830");
    f.businessTaxV1830.history = arr(f.businessTaxV1830, "history");
    f.businessTaxV1830.processedAges = obj(f.businessTaxV1830, "processedAges");
    f.externalManager = obj(f, "externalManager");
    f.personalFirm = obj(f, "personalFirm");
    f.personalFirm.staff = obj(f.personalFirm, "staff");
    f.taxCleanupV1832 = obj(f, "taxCleanupV1832");
    f.taxCleanupV1832.history = arr(f.taxCleanupV1832, "history");
    f.taxCleanupV1832.totalPersonalReclassed = Math.max(0, n(f.taxCleanupV1832.totalPersonalReclassed));
    f.taxCleanupV1832.totalBugWriteOff = Math.max(0, n(f.taxCleanupV1832.totalBugWriteOff));
    f.taxCanonicalV1832 = obj(f, "taxCanonicalV1832");
    f.taxDebt = Math.max(0, Math.round(n(f.taxDebt)));
    f.firmEntityTaxDebtV1828 = Math.max(0, Math.round(n(f.firmEntityTaxDebtV1828 || f.entityTaxDebtV1832)));
    f.entityTaxDebtV1832 = f.firmEntityTaxDebtV1828;

    s.educationV1825 = obj(s, "educationV1825");
    s.educationV1825.degrees = arr(s.educationV1825, "degrees");
    s.educationV1827 = obj(s, "educationV1827");
    s.careerV1827 = obj(s, "careerV1827");
    s.careerV1827.applications = arr(s.careerV1827, "applications");
    s.careerV1827.offers = arr(s.careerV1827, "offers");
    s.careerV1827.history = arr(s.careerV1827, "history");
    s.careerV1828 = obj(s, "careerV1828");
    s.careerV1828.interviewHistory = arr(s.careerV1828, "interviewHistory");
    s.careerV1832 = obj(s, "careerV1832");
    s.careerV1832.history = arr(s.careerV1832, "history");
    s.careerV1832.recruiterMessages = arr(s.careerV1832, "recruiterMessages");

    s.estateV1831 = obj(s, "estateV1831");
    var e = s.estateV1831;
    if (e.hasWill == null) e.hasWill = false;
    if (!e.trustType) e.trustType = "none";
    if (!e.trustee) e.trustee = "self";
    if (!e.beneficiaryMode) e.beneficiaryMode = "children_equal";
    if (e.distributionAge == null) e.distributionAge = 25;
    e.assets = obj(e, "assets");
    e.assets.trustCash = Math.max(0, Math.round(n(e.assets.trustCash)));
    e.assets.businessPercent = clamp(e.assets.businessPercent, 0, 1);
    e.assets.brokeragePercent = clamp(e.assets.brokeragePercent, 0, 1);
    e.assets.managerPercent = clamp(e.assets.managerPercent, 0, 1);
    e.clauses = obj(e, "clauses");
    e.history = arr(e, "history");
    e.dryRunsV1832 = arr(e, "dryRunsV1832");

    s.migrationV1832 = obj(s, "migrationV1832");
    s.migrationV1832.lastRun = Date.now();
    s.migrationV1832.version = PATCH_ID;
    s.migrationV1832.ok = true;

    if (s.money == null) s.money = 0;
    if (s.savings == null) s.savings = 0;
    s.money = Math.round(n(s.money));
    s.savings = Math.max(0, Math.round(n(s.savings)));
    return s;
  }
  window.migrateLedgerStateV1832 = migrateState;

  var TAX_PROFILES = {
    us: { name:"United States", personal:.22, invest:.15, entity:.21, regions:{ pa:["Pennsylvania",.0307], de:["Delaware",.038], ny:["New York",.062], ca:["California",.085], tx:["Texas",0], fl:["Florida",0], wa:["Washington",0], il:["Illinois",.0495], ma:["Massachusetts",.05], co:["Colorado",.044] } },
    canada: { name:"Canada", personal:.26, invest:.18, entity:.15, regions:{ on:["Ontario",.08], bc:["British Columbia",.075], ab:["Alberta",.045] } },
    uk: { name:"United Kingdom", personal:.28, invest:.20, entity:.19, regions:{ eng:["England",0], sct:["Scotland",.025] } },
    germany: { name:"Germany", personal:.32, invest:.22, entity:.16, regions:{ berlin:["Berlin",0], bavaria:["Bavaria",.01] } },
    france: { name:"France", personal:.31, invest:.22, entity:.25, regions:{ idf:["Île-de-France",.015], south:["South",0] } },
    singapore: { name:"Singapore", personal:.14, invest:.05, entity:.17, regions:{ central:["Central",0] } },
    uae: { name:"United Arab Emirates", personal:.02, invest:0, entity:.09, regions:{ dubai:["Dubai",0], abudhabi:["Abu Dhabi",0] } },
    thailand: { name:"Thailand", personal:.16, invest:.08, entity:.20, regions:{ bangkok:["Bangkok",0], phuket:["Phuket",.005], chiangmai:["Chiang Mai",-.01] } },
    vietnam: { name:"Vietnam", personal:.17, invest:.08, entity:.20, regions:{ hcmc:["Ho Chi Minh City",0], danang:["Da Nang",-.008], hanoi:["Hanoi",0] } }
  };
  function taxProfile(s) {
    var f = (s || migrateState()).finance || {};
    var country = f.taxCountry || (f.taxResidenceV1826 && f.taxResidenceV1826.country) || "us";
    var profile = TAX_PROFILES[country] || TAX_PROFILES.us;
    var regionId = f.taxRegion || (f.taxResidenceV1826 && f.taxResidenceV1826.region) || Object.keys(profile.regions || { pa:1 })[0];
    var reg = (profile.regions || {})[regionId] || (profile.regions || {}).pa || ["Default",0];
    return { countryId:country, countryName:profile.name, regionId:regionId, regionName:reg[0], personal:n(profile.personal), invest:n(profile.invest), entity:n(profile.entity), local:n(reg[1]) };
  }
  function advisorReduction(s) {
    var f = (s || migrateState()).finance || {};
    var raw = String([f.accountant, f.accountantPlan, f.attorney, f.attorneyPlan, f.legalPlan].join(" ")).toLowerCase();
    var reduction = 0;
    if (/elite|wealth|family|global|tax_law/.test(raw)) reduction += .24;
    else if (/cpa|advisor|pro|attorney|lawyer|business/.test(raw)) reduction += .14;
    else if (/local|basic|preparer/.test(raw)) reduction += .06;
    return clamp(reduction, 0, .34);
  }
  function completedDegreeIds(s) {
    s = s || migrateState();
    var ids = [];
    if (s.major) ids.push(String(s.major).toLowerCase());
    (s.educationV1825 && s.educationV1825.degrees || []).forEach(function (d) {
      if (!d) return;
      var done = d.status === "completed" || d.completed || d.yearsCompleted >= d.targetYears;
      if (done) ids.push(String(d.majorId || d.id || d.major || d.name || d.majorName || "").toLowerCase());
    });
    if (s.educationV1827 && Array.isArray(s.educationV1827.completedDegrees)) {
      s.educationV1827.completedDegrees.forEach(function (d) { ids.push(String(d.id || d.majorId || d).toLowerCase()); });
    }
    var seen = {};
    return ids.filter(function (id) { if (!id || seen[id]) return false; seen[id] = true; return true; });
  }
  function isPassThroughType(type) { return ["soleprop", "sole_prop", "sole-prop", "partnership"].indexOf(String(type || "").toLowerCase()) >= 0; }
  function computeTaxModel(s) {
    s = s || migrateState();
    var f = s.finance || {};
    var src = f.incomeSources || {};
    var profile = taxProfile(s);
    var reduction = advisorReduction(s);
    var salary = Math.max(0, n(s.job && s.job.salary));
    var ownerSalary = Math.max(0, n(src.ownerSalaryV1830));
    var distributions = Math.max(0, n(f.lastFirmDistribution) + n(src.firmDistribution) + n(src.fundCarryV1825) + n(src.businessDistributionsV1830));
    var investment = Math.max(0, n(src.dividends) + n(src.realizedGains) + n(src.managerDistributionsV1829) + n(src.claimedDistributionsV1829) + n((f.stocksV18 || {}).lastDividends) + n(f.lastDividendIncome));
    var passThrough = 0;
    var entityBusinessProfit = 0;
    (Array.isArray(f.businesses) ? f.businesses : []).forEach(function (b) {
      ensureBusiness(b);
      var income = Math.max(0, n(b.lastIncome));
      if (!income) return;
      if (isPassThroughType(b.entityType)) passThrough += income;
      else entityBusinessProfit += Math.max(income, n(b.retainedEarnings));
    });
    var firmProfit = Math.max(
      0,
      n(f.lastPersonalFirmProfit),
      n(f.firmProfitV1828),
      n(f.personalFirm && f.personalFirm.lastReturn),
      n(f.lastEntrepreneurIncome) && (f.personalFirm && f.personalFirm.hired ? n(f.lastEntrepreneurIncome) : 0),
      n(f.lastBusinessIncome) && (f.personalFirm && f.personalFirm.hired ? n(f.lastBusinessIncome) : 0)
    );
    var firmAssets = Math.max(0, n(f.managedPortfolio) + n(f.firmCashV1828) + n(f.businessCash) + n(f.personalFirm && f.personalFirm.cash));
    var taxablePersonal = salary + ownerSalary + distributions + investment + passThrough;
    var personalRate = clamp(profile.personal + profile.local + (taxablePersonal > 1000000 ? .06 : taxablePersonal > 250000 ? .03 : 0), 0, .55);
    var investRate = clamp(profile.invest + profile.local * .25, 0, .35);
    var personalDue = Math.round((salary + ownerSalary + distributions + passThrough) * personalRate + investment * investRate);
    var entityBase = Math.max(0, firmProfit + entityBusinessProfit);
    var entityRate = clamp(profile.entity * (1 - reduction), 0, .32);
    var entityDue = Math.round(entityBase * entityRate);
    var model = {
      residence: profile.countryName + " / " + profile.regionName,
      countryId: profile.countryId,
      regionId: profile.regionId,
      personalRate: personalRate,
      investRate: investRate,
      entityRate: entityRate,
      advisorReduction: reduction,
      salary: salary,
      ownerSalary: ownerSalary,
      distributions: distributions,
      investment: investment,
      passThrough: passThrough,
      personalTaxable: taxablePersonal,
      personalDue: personalDue,
      firmProfit: firmProfit,
      entityBusinessProfit: entityBusinessProfit,
      entityBase: entityBase,
      entityDue: entityDue,
      personalDebt: Math.max(0, n(f.taxDebt)),
      firmEntityDebt: Math.max(0, n(f.firmEntityTaxDebtV1828 || f.entityTaxDebtV1832)),
      firmAssets: firmAssets,
      degrees: completedDegreeIds(s)
    };
    f.taxCanonicalV1832 = model;
    return model;
  }
  window.computeTaxModelV1832 = computeTaxModel;

  function auditAndReclassifyTax(silent) {
    var s = migrateState();
    var f = s.finance || {};
    var m = computeTaxModel(s);
    var currentPersonalDebt = Math.max(0, n(f.taxDebt));
    var fairPersonalCap = Math.max(0, Math.round(m.personalDue * 1.10 + 1000));
    var excess = Math.max(0, currentPersonalDebt - fairPersonalCap);
    var strongFirmSignal = m.entityBase >= 100000 && m.distributions <= Math.max(1, m.entityBase * .25);
    var moved = 0;
    var writeOff = 0;
    if (excess > 0 && strongFirmSignal) {
      var fairEntityDebt = Math.max(0, Math.round(m.entityDue * 1.10));
      var currentEntityDebt = Math.max(0, n(f.firmEntityTaxDebtV1828 || f.entityTaxDebtV1832));
      moved = Math.min(excess, Math.max(0, fairEntityDebt - currentEntityDebt));
      writeOff = Math.max(0, excess - moved);
      f.taxDebt = Math.max(0, Math.round(currentPersonalDebt - moved - writeOff));
      f.firmEntityTaxDebtV1828 = currentEntityDebt + moved;
      f.entityTaxDebtV1832 = f.firmEntityTaxDebtV1828;
      f.taxCleanupV1832.totalPersonalReclassed += moved;
      f.taxCleanupV1832.totalBugWriteOff += writeOff;
      f.taxCleanupV1832.history.unshift({ age:n(s.age), personalBefore:currentPersonalDebt, personalAfter:f.taxDebt, moved:moved, writeOff:writeOff, firmProfit:m.entityBase, personalTaxable:m.personalTaxable, reason:"Personal tax exceeded canonical personal exposure while undistributed firm profit was high." });
      f.taxCleanupV1832.history = f.taxCleanupV1832.history.slice(0, 20);
      computeTaxModel(s);
      if (!silent) log("Tax audit: moved " + money(moved) + " off personal tax and wrote off " + money(writeOff) + " as old double-count/bug exposure.", { money:0, stress:-3 });
      return { moved:moved, writeOff:writeOff, changed:true };
    }
    if (!silent) toast("Tax audit found no obvious personal-firm double count right now.");
    f.taxCleanupV1832.history.unshift({ age:n(s.age), personalBefore:currentPersonalDebt, personalAfter:currentPersonalDebt, moved:0, writeOff:0, firmProfit:m.entityBase, personalTaxable:m.personalTaxable, reason:"No material overtax detected." });
    f.taxCleanupV1832.history = f.taxCleanupV1832.history.slice(0, 20);
    return { moved:0, writeOff:0, changed:false };
  }
  window.auditAndReclassifyTaxV1832 = function () { auditAndReclassifyTax(false); saveRender(); };

  function getCareerCatalog() {
    try { if (typeof careerCatalog !== "undefined" && Array.isArray(careerCatalog)) return careerCatalog; } catch (e) {}
    try { if (Array.isArray(window.careerCatalog)) return window.careerCatalog; } catch (e) {}
    return [
      { id:"retail", title:"Retail Associate", salary:28000, minAge:16, req:function(){return true;}, desc:"Entry-level customer service." },
      { id:"office", title:"Office Coordinator", salary:42000, minAge:18, req:function(s){return n(s.stats && s.stats.discipline) >= 30;}, desc:"Administrative career path." },
      { id:"registered_nurse", title:"Registered Nurse", salary:76000, minAge:22, degreeIds:["nursing","biology"], desc:"Healthcare career with stability and stress." },
      { id:"accountant", title:"Accountant", salary:72000, minAge:22, degreeIds:["business","finance","accounting"], desc:"Finance and tax career path." },
      { id:"software_engineer", title:"Software Engineer", salary:105000, minAge:22, degreeIds:["computer_science","cs","engineering"], desc:"Technical career path." },
      { id:"attorney", title:"Attorney", salary:120000, minAge:25, degreeIds:["law"], desc:"Legal career path." }
    ];
  }
  function normalizeDegree(id) {
    id = String(id || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    if (id === "computer_science_degree") id = "computer_science";
    if (id === "business_degree") id = "business";
    if (id === "nursing_degree") id = "nursing";
    if (id === "law_degree") id = "law";
    return id;
  }
  function cloneForDegree(s, degree) {
    var fake = Object.assign({}, s);
    fake.major = degree;
    fake.flags = Object.assign({}, s.flags || {});
    fake.educationV1825 = s.educationV1825;
    fake.finance = s.finance;
    fake.stats = s.stats;
    return fake;
  }
  function jobQualifies(job, s) {
    s = s || migrateState();
    if (!job) return false;
    if (n(s.age) < n(job.minAge)) return false;
    var reqOk = false;
    try { reqOk = typeof job.req === "function" ? !!job.req(s) : true; } catch (e) { reqOk = false; }
    if (reqOk) return true;
    var degrees = completedDegreeIds(s).map(normalizeDegree);
    var degreeReqs = (job.degreeIds || job.degrees || job.majors || []).map(normalizeDegree);
    if (degreeReqs.length && degreeReqs.some(function (id) { return degrees.indexOf(id) >= 0; })) return true;
    for (var i = 0; i < degrees.length; i++) {
      try { if (typeof job.req === "function" && job.req(cloneForDegree(s, degrees[i]))) return true; } catch (e2) {}
    }
    var title = String(job.title || job.name || "").toLowerCase();
    if (/nurse/.test(title) && degrees.indexOf("nursing") >= 0) return true;
    if (/attorney|lawyer|legal/.test(title) && degrees.indexOf("law") >= 0) return true;
    if (/software|engineer|developer|data/.test(title) && (degrees.indexOf("computer_science") >= 0 || degrees.indexOf("cs") >= 0)) return true;
    if (/account|finance|business|manager|analyst/.test(title) && (degrees.indexOf("business") >= 0 || degrees.indexOf("finance") >= 0 || degrees.indexOf("accounting") >= 0)) return true;
    return false;
  }
  function missingForJob(job, s) {
    s = s || migrateState();
    var parts = [];
    if (n(s.age) < n(job.minAge)) parts.push("Age " + n(job.minAge) + "+");
    if (!jobQualifies(job, s)) {
      var title = String(job.title || job.name || "job").toLowerCase();
      if (/nurse/.test(title)) parts.push("Nursing degree");
      else if (/attorney|lawyer|legal/.test(title)) parts.push("Law degree");
      else if (/software|engineer|developer|data/.test(title)) parts.push("Computer Science degree");
      else if (/account|finance|business|manager|analyst/.test(title)) parts.push("Business/Finance degree");
      else parts.push("More education/stats");
    }
    return parts.join(" · ") || "Ready";
  }
  function fitScore(job, s) {
    s = s || migrateState();
    var st = s.stats || {};
    var score = 42;
    if (jobQualifies(job, s)) score += 18;
    score += clamp(n(st.smarts), 0, 100) * .16;
    score += clamp(n(st.confidence), 0, 100) * .12;
    score += clamp(n(st.discipline), 0, 100) * .16;
    score += clamp(n(st.creativity), 0, 100) * .06;
    score -= clamp(n(st.stress), 0, 100) * .10;
    return Math.round(clamp(score, 5, 98));
  }
  function jobById(jobId) {
    var list = getCareerCatalog();
    return list.find(function (j) { return String(j.id || j.title) === String(jobId); }) || null;
  }
  function activeApplication(jobId) {
    var s = migrateState();
    return (s.careerV1827.applications || []).find(function (a) { return !a.closed && String(a.jobId) === String(jobId); }) || null;
  }
  function activeOffer(jobId) {
    var s = migrateState();
    return (s.careerV1827.offers || []).find(function (o) { return !o.closed && String(o.jobId) === String(jobId); }) || null;
  }
  window.applyToJobV1832 = function (jobId) {
    var s = migrateState();
    var job = jobById(jobId);
    if (!job) return toast("Job not found.");
    if (!jobQualifies(job, s)) return toast("Still locked: " + missingForJob(job, s));
    if (activeApplication(jobId)) return toast("Application already active. Use the interview options.");
    var app = { jobId:String(job.id || job.title), title:job.title || job.name || "Job", salary:Math.round(n(job.salary)), createdAge:n(s.age), stage:"prep", prepPoints:0, prep:{}, referral:false, followUps:0, score:fitScore(job, s), rounds:0, closed:false, patch:PATCH_ID };
    s.careerV1827.applications.unshift(app);
    s.careerV1832.history.unshift({ age:n(s.age), action:"Applied", jobId:app.jobId, title:app.title, fit:app.score });
    log("Applied for " + app.title + ". Prep before the interview for a better offer.", { confidence:1, stress:1 });
    saveRender();
  };
  window.prepInterviewV1832 = function (jobId, type) {
    var s = migrateState();
    var app = activeApplication(jobId);
    if (!app) return toast("Apply first.");
    app.prep = app.prep || {};
    var cost = { resume:150, network:100, mock:300, coach:800, cert:1200, rest:0, research:0, practice:0, followup:0 }[type] || 0;
    if (cost && n(s.money) < cost) return toast("Need " + money(cost) + " checking for that prep.");
    if (cost) s.money = Math.round(n(s.money) - cost);
    var gain = { research:6, resume:7, practice:6, network:9, mock:11, coach:14, cert:12, rest:4, followup:3 }[type] || 4;
    app.prep[type] = n(app.prep[type]) + 1;
    app.prepPoints = Math.min(55, n(app.prepPoints) + gain);
    if (type === "network") app.referral = true;
    if (type === "cert") app.microCredential = true;
    if (type === "rest" && s.stats) s.stats.stress = clamp(n(s.stats.stress) - 4, 0, 100);
    if (type === "followup") app.followUps = n(app.followUps) + 1;
    app.stage = app.stage === "prep" ? "prep" : app.stage;
    log("Interview prep: " + type + " for " + app.title + ".", { money:-cost, confidence:type === "rest" ? 0 : 1, stress:type === "rest" ? -4 : 0 });
    saveRender();
  };
  window.scheduleInterviewV1832 = function (jobId) {
    var app = activeApplication(jobId);
    if (!app) return toast("Apply first.");
    app.stage = "question";
    app.question = "Tell us why you are the best hire for this role.";
    log("Interview scheduled for " + app.title + ". Pick an answer strategy.", { stress:2 });
    saveRender();
  };
  window.answerInterviewV1832 = function (jobId, type) {
    var s = migrateState();
    var app = activeApplication(jobId);
    var job = jobById(jobId) || { title: app && app.title, salary: app && app.salary };
    if (!app) return toast("No active application.");
    if (app.stage !== "question" && app.stage !== "second") app.stage = "question";
    var st = s.stats || {};
    var bonus = { technical:n(st.smarts)*.13 + n(st.discipline)*.07, behavioral:n(st.confidence)*.12 + n(st.karma)*.05, leadership:n(st.confidence)*.10 + n(st.discipline)*.09, honest:n(st.karma)*.10 + n(st.confidence)*.05, questions:7 }[type] || 0;
    var score = Math.round(n(app.score) + n(app.prepPoints) + bonus + (app.referral ? 8 : 0) + (app.microCredential ? 5 : 0) + (Math.random()*16 - 6));
    var threshold = 72 + (n(job.salary) > 100000 ? 6 : 0) + (n(job.salary) > 180000 ? 8 : 0);
    app.rounds = n(app.rounds) + 1;
    app.lastInterviewScore = score;
    app.lastAnswer = type;
    if (score >= threshold + 16) {
      app.closed = true;
      app.stage = "offer";
      var strongSalary = Math.round(n(job.salary || app.salary) * (1.10 + Math.random() * .12));
      s.careerV1827.offers.unshift({ jobId:String(job.id || app.jobId), title:job.title || app.title, salary:strongSalary, baseSalary:n(job.salary || app.salary), strength:"strong", createdAge:n(s.age), closed:false, negotiated:false, patch:PATCH_ID });
      log("Strong interview: " + app.title + " sent a high offer.", { confidence:4, stress:-2 });
    } else if (score >= threshold) {
      app.closed = true;
      app.stage = "offer";
      var salary = Math.round(n(job.salary || app.salary) * (.98 + Math.random() * .08));
      s.careerV1827.offers.unshift({ jobId:String(job.id || app.jobId), title:job.title || app.title, salary:salary, baseSalary:n(job.salary || app.salary), strength:"standard", createdAge:n(s.age), closed:false, negotiated:false, patch:PATCH_ID });
      log("Interview passed: " + app.title + " made an offer.", { confidence:2, stress:-1 });
    } else if (score >= threshold - 12 && app.rounds < 2) {
      app.stage = "second";
      app.question = "Second round: prove you can handle the real pressure of this role.";
      log("Second interview requested for " + app.title + ". Prep and answer again.", { stress:2 });
    } else {
      app.closed = true;
      app.stage = "rejected";
      s.careerV1827.history.unshift({ jobId:app.jobId, title:app.title, outcome:"Rejected", score:score, age:n(s.age) });
      log("Interview rejected: " + app.title + ". The prep score and fit were not enough yet.", { confidence:-1, stress:2 });
    }
    s.careerV1828.interviewHistory.unshift({ age:n(s.age), title:app.title, answer:type, score:score, threshold:threshold, outcome:app.stage });
    s.careerV1828.interviewHistory = s.careerV1828.interviewHistory.slice(0, 20);
    saveRender();
  };
  window.negotiateOfferV1832 = function (jobId) {
    var s = migrateState();
    var offer = activeOffer(jobId);
    if (!offer) return toast("No active offer.");
    if (offer.negotiated) return toast("Already negotiated this offer.");
    var st = s.stats || {};
    var chance = 45 + n(st.confidence) * .25 + n(st.smarts) * .10 - n(st.stress) * .08;
    offer.negotiated = true;
    if (Math.random() * 100 < chance) {
      var bump = Math.round(n(offer.salary) * (.04 + Math.random() * .08));
      offer.salary += bump;
      offer.strength = "negotiated";
      log("Negotiated the offer up by " + money(bump) + ".", { confidence:2, stress:1 });
    } else {
      offer.salary = Math.round(n(offer.salary) * .98);
      log("Negotiation was awkward. The offer stayed about the same.", { confidence:-1, stress:2 });
    }
    saveRender();
  };
  window.declineJobOfferV1832 = function (jobId) {
    var offer = activeOffer(jobId);
    if (!offer) return toast("No active offer.");
    offer.closed = true;
    log("Declined the " + offer.title + " offer.", { stress:-1 });
    saveRender();
  };
  window.withdrawApplicationV1832 = function (jobId) {
    var app = activeApplication(jobId);
    if (!app) return toast("No active application.");
    app.closed = true;
    app.stage = "withdrawn";
    log("Withdrew the " + app.title + " application.", { stress:-1 });
    saveRender();
  };
  // Route old instant job buttons into the new application pipeline.
  var previousTakeCareer = window.takeCareer || (typeof takeCareer === "function" ? takeCareer : null);
  if (previousTakeCareer && !window.__ledgerTakeCareer1832Wrapped) {
    window.__ledgerTakeCareer1832Wrapped = true;
    window.forceTakeCareerV1832 = previousTakeCareer;
    window.takeCareer = function (jobId) { return window.applyToJobV1832(jobId); };
    try { takeCareer = window.takeCareer; } catch (e) {}
  }
  window.applyToJobV1827 = window.applyToJobV1832;
  window.applyToJobV1828 = window.applyToJobV1832;
  window.answerInterviewV1828 = window.answerInterviewV1832;
  window.declineJobOfferV1827 = window.declineJobOfferV1832;
  try { applyToJobV1827 = window.applyToJobV1832; applyToJobV1828 = window.applyToJobV1832; answerInterviewV1828 = window.answerInterviewV1832; declineJobOfferV1827 = window.declineJobOfferV1832; } catch (e) {}

  function businessValue(s) {
    return (s.finance && Array.isArray(s.finance.businesses) ? s.finance.businesses : []).reduce(function (sum, b) { ensureBusiness(b); return sum + n(b.value) + n(b.retainedEarnings); }, 0);
  }
  function brokerageValue(s) {
    var f = s.finance || {};
    return Math.max(0, n(f.brokerage) + n(f.stockValue) + n(f.managedPortfolio) + n(f.externalManager && f.externalManager.capital) + n(f.managerFirmsV1829 && f.managerFirmsV1829.capital));
  }
  function homeValue(s) {
    try { if (typeof homes !== "undefined" && Array.isArray(homes)) { var h = homes.find(function (x) { return x.id === s.home; }); return Math.max(0, n(h && h.price)); } } catch (e) {}
    return 0;
  }
  function rentalValue(s) {
    try { if (typeof rentals !== "undefined" && Array.isArray(rentals)) { return (s.rentals || []).reduce(function (sum, id) { var r = rentals.find(function (x) { return x.id === id; }); return sum + Math.max(0, n(r && r.price)); }, 0); } } catch (e) {}
    return 0;
  }
  function childrenList(s) {
    var relKids = [];
    try { relKids = Object.values(s.relationships || {}).filter(function (r) { return r && r.role === "Child"; }); } catch (e) {}
    var arrKids = Array.isArray(s.children) ? s.children.map(function (c) { return typeof c === "string" ? { name:c } : c; }).filter(Boolean) : [];
    var out = {}, list = relKids.concat(arrKids);
    list.forEach(function (k) { var name = k.name || k.id; if (name) out[name] = k; });
    return Object.values(out);
  }
  function spouseLike(s) {
    try { return Object.values(s.relationships || {}).find(function (r) { return r && /spouse|partner|wife|husband/i.test(String(r.role || r.type || r.name)); }); } catch (e) { return null; }
  }
  function estateDryRun(s) {
    s = s || migrateState();
    var e = s.estateV1831 || {};
    var assets = e.assets || {};
    var gross = Math.max(0, n(s.money) + n(s.savings) + n(s.finance && s.finance.superSaver) + brokerageValue(s) + businessValue(s) + homeValue(s) + rentalValue(s) + n(assets.trustCash));
    var debt = Math.max(0, n(s.debt) + n(s.finance && s.finance.creditCardDebt) + n(s.finance && s.finance.taxDebt) + n(s.finance && s.finance.medicalDebt));
    var protectedValue = Math.max(0, n(assets.trustCash) + (assets.home ? homeValue(s) : 0) + (assets.rentals ? rentalValue(s) : 0) + businessValue(s) * n(assets.businessPercent) + brokerageValue(s) * n(assets.brokeragePercent) + brokerageValue(s) * n(assets.managerPercent));
    var unprotected = Math.max(0, gross - protectedValue);
    var trustType = e.trustType || "none";
    var probateRate = trustType === "dynasty" ? .003 : trustType === "irrevocable" ? .006 : trustType === "revocable" ? .018 : .10;
    var protection = 0;
    if (e.hasWill) protection += 12;
    if (trustType === "revocable") protection += 25;
    if (trustType === "irrevocable") protection += 48;
    if (trustType === "dynasty") protection += 72;
    if (e.clauses && e.clauses.businessSuccession) protection += 8;
    if (e.clauses && e.clauses.guardianship) protection += 6;
    if (e.familyOffice) protection += 12;
    protection = Math.round(clamp(protection, 0, 100));
    var probateLoss = Math.round(unprotected * probateRate);
    var taxableEstate = Math.max(0, gross - debt - 13000000);
    var taxCut = trustType === "dynasty" ? .55 : trustType === "irrevocable" ? .32 : trustType === "revocable" ? .10 : 0;
    var estateTax = Math.round(taxableEstate * .40 * (1 - taxCut));
    var netTransfer = Math.max(0, gross - debt - probateLoss - estateTax);
    var kids = childrenList(s);
    var spouse = spouseLike(s);
    var heirCount = kids.length || (spouse ? 1 : 0) || 1;
    var issues = [];
    if (!e.hasWill) issues.push("No will");
    if (trustType === "none" && gross > 250000) issues.push("No trust for large estate");
    if (!kids.length && !spouse) issues.push("No clear family heir");
    if (businessValue(s) > 0 && !(e.clauses && e.clauses.businessSuccession)) issues.push("Business succession missing");
    if (kids.some(function (k) { return n(k.age) < 18; }) && !(e.clauses && e.clauses.guardianship)) issues.push("Minor guardianship missing");
    return { gross:gross, debt:debt, protectedValue:protectedValue, unprotected:unprotected, probateLoss:probateLoss, estateTax:estateTax, netTransfer:netTransfer, heirCount:heirCount, childShare:Math.round(netTransfer / heirCount), protection:protection, issues:issues };
  }
  window.estateDryRunV1832 = estateDryRun;
  window.runEstateDryRunV1832 = function () {
    var s = migrateState();
    var x = estateDryRun(s);
    s.estateV1831.dryRunsV1832.unshift({ age:n(s.age), at:Date.now(), gross:x.gross, netTransfer:x.netTransfer, protection:x.protection, issues:x.issues.slice() });
    s.estateV1831.dryRunsV1832 = s.estateV1831.dryRunsV1832.slice(0, 10);
    log("Estate dry run complete: " + money(x.netTransfer) + " projected to heirs, protection " + x.protection + "/100.", {});
    saveRender();
  };

  var previousContinueAsHeir = window.continueAsHeir || (typeof continueAsHeir === "function" ? continueAsHeir : null);
  if (previousContinueAsHeir && !window.__ledgerHeir1832Wrapped) {
    window.__ledgerHeir1832Wrapped = true;
    window.continueAsHeir = function () {
      var old = migrateState();
      if (!old || old.alive || childrenList(old).length) return previousContinueAsHeir.apply(this, arguments);
      var x = estateDryRun(old);
      if (x.netTransfer <= 0 || (!(old.estateV1831 || {}).hasWill && (old.estateV1831 || {}).trustType === "none")) return previousContinueAsHeir.apply(this, arguments);
      var familyName = (old.legacy && old.legacy.familyName) || String(old.name || "Legacy").split(" ").pop() || "Legacy";
      var nextName = spouseLike(old) ? (spouseLike(old).name || "Family Heir") : "Heir " + familyName;
      try {
        if (typeof newGame === "function") {
          newGame({ name: nextName, gender: "female", background: old.background || "middle", city: old.city, startingMoney: Math.round(x.netTransfer * .65), sandbox: old.sandbox || {}, sandboxMode: !!old.sandboxMode });
          var s = migrateState();
          s.legacy = obj(s, "legacy");
          s.legacy.generation = n(old.legacy && old.legacy.generation, 1) + 1;
          s.legacy.familyName = familyName;
          s.legacy.lastInheritance = Math.round(x.netTransfer * .65);
          s.legacy.lastEstatePlanV1832 = x;
          log("Legacy continued through estate plan with " + money(s.legacy.lastInheritance) + ".", {});
          saveRender();
          return;
        }
      } catch (e) { try { console.warn("v18.32 heir fallback failed", e); } catch(ignore) {} }
      return previousContinueAsHeir.apply(this, arguments);
    };
    try { continueAsHeir = window.continueAsHeir; } catch (e) {}
  }

  function saveStableBackup() {
    var s = migrateState();
    try {
      var data = JSON.stringify(s);
      localStorage.setItem("ledger_v1832_last_good_state", data);
      s.migrationV1832.lastBackupAt = Date.now();
      toast("Saved a v18.32 recovery backup.");
      return true;
    } catch (e) { toast("Backup failed: " + (e.message || e)); return false; }
  }
  window.saveStableBackupV1832 = saveStableBackup;
  window.restoreStableBackupV1832 = function () {
    try {
      var data = localStorage.getItem("ledger_v1832_last_good_state");
      if (!data) return toast("No v18.32 backup found.");
      assignState(JSON.parse(data));
      migrateState();
      log("Restored v18.32 recovery backup.", {});
      saveRender();
    } catch (e) { toast("Restore failed: " + (e.message || e)); }
  };
  window.toggleCompactModeV1832 = function () {
    var s = migrateState();
    s.uiV1832 = obj(s, "uiV1832");
    s.uiV1832.compactMode = !s.uiV1832.compactMode;
    applyCompactClass();
    saveRender();
  };
  function applyCompactClass() {
    try {
      var s = migrateState();
      document.body.classList.toggle("ledger-compact-v1832", !!(s.uiV1832 && s.uiV1832.compactMode));
    } catch (e) {}
  }

  function removeSectionByMarker(html, marker, limit) {
    var out = String(html || "");
    var idx = out.indexOf(marker), guard = 0;
    while (idx >= 0 && guard++ < (limit || 30)) {
      var start = out.lastIndexOf("<section", idx);
      if (start < 0) start = out.lastIndexOf("<div", idx);
      var endSection = out.indexOf("</section>", idx);
      var endDiv = out.indexOf("</div>", idx);
      var end = endSection >= 0 ? endSection + 10 : (endDiv >= 0 ? endDiv + 6 : -1);
      if (start < 0 || end < 0 || end <= start) break;
      out = out.slice(0, start) + out.slice(end);
      idx = out.indexOf(marker);
    }
    return out;
  }
  function scrubHtml(html) {
    var out = String(html || "");
    [
      "v1832-tax-office", "v1832-career-command", "v1832-cleanup-center", "v1832-estate-dryrun", "v1832-finance-separation", "v1832-education-link",
      "v1828-tax-office", "v1828-firm-tax-ledger", "v1828-career-system", "v1827-career-interviews", "v1824-career-reqs", "v1818-career-reqs"
    ].forEach(function (m) { out = removeSectionByMarker(out, m); });
    return out;
  }
  function dedupeDom() {
    try {
      [".v1831-estate-shortcut", ".v1830-business-summary", ".v1829-manager-summary", ".v1832-finance-separation", ".v1832-tax-office", ".v1832-career-command", ".v1832-cleanup-center", ".v1832-estate-dryrun"].forEach(function (sel) {
        var nodes = Array.prototype.slice.call(document.querySelectorAll(sel));
        nodes.slice(1).forEach(function (node) { node.remove(); });
      });
    } catch (e) {}
  }
  window.dedupeLedgerPanelsV1832 = function () { dedupeDom(); toast("Duplicate panel cleanup ran."); };

  function metric(label, value, tone, sub) {
    return '<div class="v1832-metric ' + (tone || "") + '"><span>' + esc(label) + '</span><b>' + esc(value) + '</b>' + (sub ? '<em>' + esc(sub) + '</em>' : '') + '</div>';
  }
  function renderTaxOffice() {
    var s = migrateState();
    var f = s.finance || {};
    var m = computeTaxModel(s);
    var cleanup = f.taxCleanupV1832 || {};
    var last = (cleanup.history || [])[0];
    var warning = (m.personalDebt > Math.max(m.personalDue * 1.5 + 1000, 50000) && m.entityBase > 100000 && m.distributions < m.entityBase * .25)
      ? '<div class="v1832-note bad"><b>Possible old double-tax detected.</b> The personal bill looks too high compared with actual distributions. Use Reclassify Tax Bill.</div>'
      : '<div class="v1832-note good"><b>Canonical model active.</b> Personal tax is based on money paid to the player. Firm/entity tax is separate.</div>';
    return '<section class="money-section v1832-tax-office"><div class="money-section-title">Tax Office Audit <span>read-only tax explanation</span></div>' + warning +
      '<div class="v1832-grid four">' +
      metric("Residence", m.residence, "gold", "Move controls live under More") +
      metric("Personal taxable", money(m.personalTaxable), m.personalTaxable ? "bad" : "good", "Salary, distributions, realized income") +
      metric("Personal tax debt", money(m.personalDebt), m.personalDebt ? "bad" : "good", "Estimated due " + money(m.personalDue)) +
      metric("Firm/entity tax", money(m.firmEntityDebt), m.firmEntityDebt ? "bad" : "good", "Firm due " + money(m.entityDue)) +
      metric("Firm profit held", money(m.entityBase), "good", "Not personal until paid out") +
      metric("Distributed to you", money(m.distributions + m.ownerSalary), m.distributions || m.ownerSalary ? "gold" : "", "This is personal taxable") +
      metric("Investment income", money(m.investment), m.investment ? "gold" : "", "Realized/dividends only") +
      metric("Advisor reduction", pct(m.advisorReduction), m.advisorReduction ? "good" : "", "Attorney/accountant planning") +
      '</div><div class="v1832-actions"><button class="money-btn gold" onclick="event.preventDefault();event.stopPropagation();auditAndReclassifyTaxV1832()">Reclassify Tax Bill</button><button class="money-btn" onclick="event.preventDefault();event.stopPropagation();setTabV16 ? setTabV16(\'more\') : setTab(\'more\')">Move Country/State</button></div>' +
      (last ? '<div class="v1832-note small">Last audit: moved ' + money(last.moved || 0) + ' to firm tax · old bug write-off ' + money(last.writeOff || 0) + ' · personal before ' + money(last.personalBefore || 0) + ' → after ' + money(last.personalAfter || 0) + '.</div>' : '') +
      '</section>';
  }
  function renderFinanceSeparation() {
    var s = migrateState();
    var f = s.finance || {};
    var trust = s.estateV1831 && s.estateV1831.assets ? n(s.estateV1831.assets.trustCash) : 0;
    var companyCash = (Array.isArray(f.businesses) ? f.businesses : []).reduce(function (sum, b) { ensureBusiness(b); return sum + n(b.retainedEarnings); }, 0) + n(f.firmCashV1828) + n(f.personalFirm && f.personalFirm.cash);
    var personalLiquid = Math.max(0, n(s.money) + n(s.savings) + n(f.superSaver));
    return '<section class="money-section v1832-finance-separation"><div class="money-section-title">Money Separation Audit <span>personal vs company vs trust</span></div><div class="v1832-grid four">' +
      metric("Personal liquid", money(personalLiquid), "gold", "Checking/savings/super saver") +
      metric("Company cash", money(companyCash), "good", "Business/firm money") +
      metric("Trust cash", money(trust), trust ? "good" : "", "Estate money, not daily spending") +
      metric("Personal tax", money(f.taxDebt), f.taxDebt ? "bad" : "good", "Not firm tax") +
      '</div></section>';
  }
  function prepButtons(app) {
    var rows = [
      ["research", "Research", "Free"], ["resume", "Résumé", "$150"], ["practice", "Practice", "Free"], ["network", "Referral", "$100"], ["mock", "Mock", "$300"], ["coach", "Coach", "$800"], ["cert", "Micro-cert", "$1.2K"], ["rest", "Rest", "Free"], ["followup", "Follow up", "Free"]
    ];
    return rows.map(function (r) { return '<button class="money-btn" onclick="event.preventDefault();event.stopPropagation();prepInterviewV1832(\'' + esc(app.jobId) + '\',\'' + r[0] + '\')">' + esc(r[1]) + ' <small>' + esc(r[2]) + '</small></button>'; }).join("");
  }
  function answerButtons(app) {
    if (app.stage === "prep") return '<button class="money-btn gold" onclick="event.preventDefault();event.stopPropagation();scheduleInterviewV1832(\'' + esc(app.jobId) + '\')">Schedule Interview</button>';
    return '<div class="v1832-question"><b>' + esc(app.question || "Interview question") + '</b><span>Pick a strategy. Prep, referrals, and stress affect the score.</span></div><div class="v1832-actions"><button class="money-btn green" onclick="event.preventDefault();event.stopPropagation();answerInterviewV1832(\'' + esc(app.jobId) + '\',\'technical\')">Technical Proof</button><button class="money-btn blue" onclick="event.preventDefault();event.stopPropagation();answerInterviewV1832(\'' + esc(app.jobId) + '\',\'behavioral\')">Behavioral Story</button><button class="money-btn gold" onclick="event.preventDefault();event.stopPropagation();answerInterviewV1832(\'' + esc(app.jobId) + '\',\'leadership\')">Leadership Example</button><button class="money-btn" onclick="event.preventDefault();event.stopPropagation();answerInterviewV1832(\'' + esc(app.jobId) + '\',\'honest\')">Honest Growth Answer</button></div>';
  }
  function renderCareerCommand() {
    var s = migrateState();
    var active = (s.careerV1827.applications || []).filter(function (a) { return !a.closed; });
    var offers = (s.careerV1827.offers || []).filter(function (o) { return !o.closed; });
    var jobs = getCareerCatalog().slice().sort(function (a, b) { return (jobQualifies(b, s) - jobQualifies(a, s)) || n(b.salary) - n(a.salary); }).slice(0, 18);
    var pipeline = "";
    if (offers.length) {
      pipeline += offers.map(function (o) { return '<div class="v1832-pipeline-card offer"><div><b>' + esc(o.title) + '</b><span>' + esc(o.strength || "standard") + ' offer · ' + money(o.salary) + '/yr' + (o.negotiated ? ' · negotiated' : '') + '</span></div><div class="v1832-actions"><button class="money-btn green" onclick="event.preventDefault();event.stopPropagation();acceptJobOfferV1828 ? acceptJobOfferV1828(\'' + esc(o.jobId) + '\') : acceptJobOfferV1827(\'' + esc(o.jobId) + '\')">Accept</button><button class="money-btn gold" onclick="event.preventDefault();event.stopPropagation();negotiateOfferV1832(\'' + esc(o.jobId) + '\')">Negotiate</button><button class="money-btn" onclick="event.preventDefault();event.stopPropagation();declineJobOfferV1832(\'' + esc(o.jobId) + '\')">Decline</button></div></div>'; }).join("");
    }
    if (active.length) {
      pipeline += active.map(function (a) { a.prep = a.prep || {}; return '<div class="v1832-pipeline-card"><div class="v1832-pipeline-top"><div><b>' + esc(a.title) + '</b><span>' + esc(a.stage === "second" ? "Second interview" : a.stage === "question" ? "Interview question" : "Prep stage") + ' · fit ' + Math.round(n(a.score)) + '/100 · prep ' + Math.round(n(a.prepPoints)) + '</span></div><strong>' + (a.referral ? 'Referral' : 'No referral') + '</strong></div><div class="v1832-prep-row">' + prepButtons(a) + '</div>' + answerButtons(a) + '<div class="v1832-actions"><button class="money-btn" onclick="event.preventDefault();event.stopPropagation();withdrawApplicationV1832(\'' + esc(a.jobId) + '\')">Withdraw</button></div></div>'; }).join("");
    }
    if (!pipeline) pipeline = '<div class="v1832-note small">No active applications. Qualified jobs below use: Apply → Prep → Interview → Offer → Negotiate/Accept.</div>';
    var cards = jobs.map(function (job) {
      var id = String(job.id || job.title);
      var q = jobQualifies(job, s);
      var app = activeApplication(id);
      var offer = activeOffer(id);
      var current = s.job && (s.job.jobId === id || s.job.title === job.title);
      var action = current ? '<button class="money-btn" disabled>Current Job</button>' : offer ? '<button class="money-btn green" onclick="event.preventDefault();event.stopPropagation();acceptJobOfferV1828 ? acceptJobOfferV1828(\'' + esc(id) + '\') : acceptJobOfferV1827(\'' + esc(id) + '\')">Accept Offer</button>' : app ? '<button class="money-btn gold" onclick="event.preventDefault();event.stopPropagation();scheduleInterviewV1832(\'' + esc(id) + '\')">Interview Options</button>' : q ? '<button class="money-btn blue" onclick="event.preventDefault();event.stopPropagation();applyToJobV1832(\'' + esc(id) + '\')">Apply</button>' : '<button class="money-btn" disabled>Locked</button>';
      return '<div class="v1832-job-card ' + (current ? 'current' : offer ? 'offer' : app ? 'active' : q ? 'qualified' : 'locked') + '"><div class="v1832-job-head"><b>' + esc(job.title || job.name || id) + '</b><span>' + (current ? 'Current' : offer ? 'Offer' : app ? 'Pipeline' : q ? 'Qualified' : 'Locked') + '</span></div><p>' + esc(job.desc || "Career path.") + '</p><div class="v1832-pill-row"><span>' + money(job.salary || 0) + '/yr</span><span>Age ' + (n(job.minAge) || 16) + '+</span><span>' + (q ? 'Fit ' + fitScore(job, s) + '/100' : missingForJob(job, s)) + '</span></div>' + action + '</div>';
    }).join("");
    return '<section class="panel v1832-career-command"><div class="section-label">Career Hiring System</div><div class="v1832-career-hero"><b>Jobs now require real hiring steps.</b><span>Degrees make a job available. Interviews decide whether you actually receive an offer.</span></div><div class="v1832-pill-row"><span>Degrees: ' + esc(completedDegreeIds(s).join(", ") || "none") + '</span><span>Applications: ' + active.length + '</span><span>Offers: ' + offers.length + '</span></div><div class="v1832-pipeline">' + pipeline + '</div><div class="v1832-job-grid">' + cards + '</div></section>';
  }
  function renderEducationLink() {
    var s = migrateState();
    var degrees = completedDegreeIds(s);
    var jobs = getCareerCatalog();
    var unlocked = jobs.filter(function (j) { return jobQualifies(j, s); }).length;
    return '<section class="money-section v1832-education-link"><div class="money-section-title">Degree → Job Link Audit <span>education feeds career</span></div><div class="v1832-grid four">' + metric("Completed degrees", String(degrees.length), "good", degrees.join(", ") || "None yet") + metric("Qualified jobs", String(unlocked), unlocked ? "good" : "bad", "Career cards become Apply buttons") + metric("Multiple degrees", "Education hub", "gold", "Not Career/Business") + metric("Hiring step", "Interview", "blue", "No instant job switch") + '</div></section>';
  }
  function renderEstateDryRun() {
    var s = migrateState();
    var x = estateDryRun(s);
    var issueText = x.issues.length ? x.issues.join(" · ") : "No major gaps found";
    return '<section class="money-section v1832-estate-dryrun"><div class="money-section-title">Estate Dry Run <span>death/legacy test without dying</span></div><div class="v1832-grid four">' + metric("Gross estate", money(x.gross), "gold", "All counted assets") + metric("Protected", money(x.protectedValue), x.protectedValue ? "good" : "", "Trust/title assets") + metric("Net transfer", money(x.netTransfer), "good", "After debt/leak/tax") + metric("Issues", String(x.issues.length), x.issues.length ? "bad" : "good", issueText) + '</div><div class="v1832-actions"><button class="money-btn gold" onclick="event.preventDefault();event.stopPropagation();runEstateDryRunV1832()">Run Dry Run</button></div></section>';
  }
  function renderCleanupCenter() {
    var s = migrateState();
    var compact = !!(s.uiV1832 && s.uiV1832.compactMode);
    var migration = s.migrationV1832 || {};
    return '<section class="money-section v1832-cleanup-center"><div class="money-section-title">v18.32 Cleanup / Stability Center <span>not a feature pile</span></div><div class="v1832-note">This pass audits patch stacking, save migration, duplicate cards, personal-vs-firm tax, job interviews, and estate dry-run behavior.</div><div class="v1832-grid four">' + metric("Migration", migration.ok ? "Healthy" : "Needs repair", migration.ok ? "good" : "bad", PATCH_ID) + metric("Compact UI", compact ? "On" : "Off", compact ? "good" : "", "Hide repeated summary clutter") + metric("Tax cleanup", money(s.finance.taxCleanupV1832.totalPersonalReclassed || 0), "gold", "Moved off personal debt") + metric("Bug write-off", money(s.finance.taxCleanupV1832.totalBugWriteOff || 0), "good", "Old double-count forgiven") + '</div><div class="v1832-actions"><button class="money-btn gold" onclick="event.preventDefault();event.stopPropagation();migrateLedgerStateV1832();dedupeLedgerPanelsV1832();auditAndReclassifyTaxV1832();runEstateDryRunV1832()">Run Full Cleanup</button><button class="money-btn" onclick="event.preventDefault();event.stopPropagation();toggleCompactModeV1832()">Toggle Compact UI</button><button class="money-btn blue" onclick="event.preventDefault();event.stopPropagation();saveStableBackupV1832()">Save Backup</button><button class="money-btn" onclick="event.preventDefault();event.stopPropagation();restoreStableBackupV1832()">Restore Backup</button></div></section>';
  }

  var previousRenderHubContent = window.renderHubContent || (typeof renderHubContent === "function" ? renderHubContent : null);
  if (previousRenderHubContent && !window.__ledgerRender1832Wrapped) {
    window.__ledgerRender1832Wrapped = true;
    window.renderHubContent = function (hubId) {
      migrateState();
      var html = "";
      try { html = previousRenderHubContent.apply(this, arguments) || ""; } catch (e) { html = '<section class="panel"><div class="row-title">Recovered hub</div><div class="row-sub">' + esc(e.message || e) + '</div></section>'; }
      html = scrubHtml(html);
      if (hubId === "career") return renderCareerCommand() + html;
      if (hubId === "school" || hubId === "education") return renderEducationLink() + html;
      if (hubId === "law" || hubId === "legal" || hubId === "tax") return renderTaxOffice() + renderEstateDryRun() + html;
      if (hubId === "more") return renderCleanupCenter() + renderEstateDryRun() + html;
      if (hubId === "money" || hubId === "finance") return renderFinanceSeparation() + renderTaxOffice() + html;
      return html;
    };
    try { renderHubContent = window.renderHubContent; } catch (e) {}
  }

  function wrap(name, after) {
    var old = window[name] || null;
    try { if (!old && typeof eval(name) === "function") old = eval(name); } catch (e) {}
    if (typeof old !== "function" || old.__ledger1832Wrapped) return;
    var fn = function () {
      if (rootState()) migrateState();
      var beforeDebt = n((rootState() || {}).finance && (rootState() || {}).finance.taxDebt);
      var result;
      try { result = old.apply(this, arguments); }
      finally {
        try { if (rootState()) { migrateState(); if (after) after(beforeDebt); } applyCompactClass(); setTimeout(dedupeDom, 0); } catch (e) { try { console.warn("v18.32 after hook failed", e); } catch(ignore) {} }
      }
      return result;
    };
    fn.__ledger1832Wrapped = true;
    window[name] = fn;
    try { eval(name + " = window[name]"); } catch (e) {}
  }
  wrap("render", function () { computeTaxModel(); });
  wrap("save", function () { computeTaxModel(); });
  wrap("loadFromSlot", function () { computeTaxModel(); auditAndReclassifyTax(true); });
  wrap("ageUp", function (beforeDebt) {
    var s = migrateState();
    var afterDebt = n(s.finance && s.finance.taxDebt);
    if (afterDebt > beforeDebt) auditAndReclassifyTax(true);
    computeTaxModel(s);
  });
  wrap("resolveLifeAndFinanceYear", function () { auditAndReclassifyTax(true); computeTaxModel(); });

  function injectStyles() {
    if (document.getElementById("ledger-v1832-style")) return;
    var style = document.createElement("style");
    style.id = "ledger-v1832-style";
    style.textContent = [
      ".v1832-tax-office,.v1832-career-command,.v1832-cleanup-center,.v1832-estate-dryrun,.v1832-finance-separation,.v1832-education-link{border-color:rgba(126,160,172,.52)!important;background:linear-gradient(135deg,rgba(18,35,37,.97),rgba(29,25,20,.98))!important;overflow:hidden!important}.v1832-tax-office{border-color:rgba(216,173,109,.55)!important;background:linear-gradient(135deg,rgba(49,38,20,.97),rgba(24,21,18,.98))!important}.v1832-cleanup-center{border-color:rgba(180,146,220,.48)!important;background:linear-gradient(135deg,rgba(36,28,54,.97),rgba(29,25,20,.98))!important}.v1832-estate-dryrun{border-color:rgba(143,175,108,.45)!important;background:linear-gradient(135deg,rgba(20,42,27,.96),rgba(29,25,20,.98))!important}.v1832-finance-separation{border-color:rgba(197,180,95,.45)!important}",
      ".v1832-grid{display:grid;gap:8px;margin:10px 0}.v1832-grid.four{grid-template-columns:repeat(4,minmax(0,1fr))}.v1832-metric{border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.045);border-radius:12px;padding:10px;min-width:0}.v1832-metric span{display:block;font-family:'JetBrains Mono',monospace;font-size:9px;color:#aa9a82;text-transform:uppercase;letter-spacing:.08em}.v1832-metric b{display:block;font-family:'JetBrains Mono',monospace;font-size:16px;color:#f2e7d6;margin-top:4px;overflow-wrap:anywhere}.v1832-metric em{display:block;font-family:'JetBrains Mono',monospace;font-size:9px;line-height:1.35;color:#8e806c;font-style:normal;margin-top:4px}.v1832-metric.good b{color:#8faf6c}.v1832-metric.bad b{color:#cc7661}.v1832-metric.gold b{color:#d8ad6d}.v1832-metric.blue b{color:#7ea0ac}",
      ".v1832-note{font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.55;color:#b9a98e;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.04);border-radius:10px;padding:10px;margin:8px 0}.v1832-note b{color:#d8ad6d}.v1832-note.good{border-color:rgba(143,175,108,.35)}.v1832-note.bad{border-color:rgba(204,118,97,.38)}.v1832-note.small{font-size:9px}.v1832-actions{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}.v1832-actions .money-btn{flex:1 1 120px}.v1832-pill-row{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}.v1832-pill-row span{font-family:'JetBrains Mono',monospace;font-size:9px;border:1px solid rgba(255,255,255,.10);border-radius:999px;padding:4px 8px;color:#d8ad6d;background:rgba(255,255,255,.04)}",
      ".v1832-career-hero{border:1px solid rgba(126,160,172,.25);border-radius:14px;background:linear-gradient(135deg,rgba(126,160,172,.12),rgba(201,155,85,.07));padding:14px;margin:8px 0 10px}.v1832-career-hero b{display:block;font-size:18px}.v1832-career-hero span{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.5;margin-top:5px}.v1832-pipeline{display:grid;gap:8px;margin:10px 0}.v1832-pipeline-card,.v1832-job-card,.v1832-question{border:1px solid rgba(255,255,255,.10);border-radius:12px;background:rgba(255,255,255,.045);padding:11px;min-width:0}.v1832-pipeline-card.offer,.v1832-job-card.offer{border-color:rgba(143,175,108,.55)}.v1832-pipeline-top,.v1832-job-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.v1832-pipeline-top b,.v1832-job-head b,.v1832-question b{display:block;color:#fff3df}.v1832-pipeline-card span,.v1832-job-card p,.v1832-question span{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.45;margin-top:4px}.v1832-pipeline-top strong,.v1832-job-head span{font-family:'JetBrains Mono',monospace;color:#d8ad6d;font-size:9px;text-transform:uppercase;letter-spacing:.08em}.v1832-prep-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:9px 0}.v1832-prep-row .money-btn{font-size:9px!important;padding:7px!important;white-space:normal!important}.v1832-job-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.v1832-job-card.locked{opacity:.58}.v1832-job-card.qualified{border-color:rgba(126,160,172,.45)}.v1832-job-card.current{border-color:rgba(216,173,109,.65)}.v1832-job-card .money-btn{margin-top:8px;width:100%}",
      ".ledger-compact-v1832 .v1831-estate-shortcut,.ledger-compact-v1832 .v1830-business-summary,.ledger-compact-v1832 .v1829-manager-summary,.ledger-compact-v1832 .v1832-finance-separation{display:none!important}.ledger-compact-v1832 .money-section{margin-bottom:8px!important}.ledger-compact-v1832 .v1832-grid.four{grid-template-columns:repeat(2,minmax(0,1fr))}",
      "@media(max-width:760px){.v1832-grid.four{grid-template-columns:repeat(2,minmax(0,1fr))}.v1832-job-grid{grid-template-columns:1fr}.v1832-prep-row{grid-template-columns:repeat(2,minmax(0,1fr))}.v1832-actions .money-btn{flex-basis:45%}}@media(max-width:430px){.v1832-grid.four{grid-template-columns:1fr}.v1832-prep-row{grid-template-columns:1fr}.v1832-actions .money-btn{flex-basis:100%}}"
    ].join("\n");
    document.head.appendChild(style);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { injectStyles(); migrateState(); applyCompactClass(); dedupeDom(); });
  else { injectStyles(); migrateState(); applyCompactClass(); setTimeout(dedupeDom, 0); }

  try { window.addEventListener("error", function (event) {
    var msg = String((event && event.error && event.error.message) || (event && event.message) || "");
    if (/undefined|null|length|map|forEach|Cannot read/i.test(msg)) {
      try { migrateState(); dedupeDom(); toast("v18.32 repaired missing state shape after an error. Try the action again."); } catch (e) {}
    }
  }); } catch (e) {}

  try { computeTaxModel(migrateState()); } catch (e) {}
})();

