/* LEDGER PATCH v18.27: Tax Office separation, Education degrees, Career interviews */
(function () {
  if (window.__ledgerV1827Loaded) return;
  window.__ledgerV1827Loaded = true;

  function esc1827(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (ch) {
      return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[ch];
    });
  }
  function num1827(v, fallback) {
    var n = Number(v);
    return Number.isFinite(n) ? n : (fallback || 0);
  }
  function clamp1827(v, min, max) {
    min = min == null ? 0 : min;
    max = max == null ? 100 : max;
    return Math.max(min, Math.min(max, num1827(v)));
  }
  function money1827(v) {
    try { if (typeof money === "function") return money(Math.round(num1827(v))); } catch(e) {}
    v = Math.round(num1827(v));
    var sign = v < 0 ? "-" : "";
    v = Math.abs(v);
    if (v >= 1e12) return sign + "$" + (v / 1e12).toFixed(1).replace(/\.0$/, "") + "T";
    if (v >= 1e9) return sign + "$" + (v / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
    if (v >= 1e6) return sign + "$" + (v / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (v >= 1e4) return sign + "$" + Math.round(v / 1000) + "K";
    return sign + "$" + v.toLocaleString();
  }
  function pct1827(v) {
    return (num1827(v) * 100).toFixed(1).replace(/\.0$/, "") + "%";
  }
  function signed1827(v) {
    v = Math.round(num1827(v));
    return (v >= 0 ? "+" : "-") + money1827(Math.abs(v));
  }
  function toast1827(msg) {
    try { if (typeof addToast === "function") return addToast(msg); } catch(e) {}
    try { if (typeof addLog === "function") return addLog(msg); } catch(e) {}
  }
  function log1827(msg, deltas) {
    try { if (typeof addLog === "function") return addLog(msg, deltas || {}); } catch(e) {}
  }
  function saveRender1827() {
    try { if (typeof save === "function") save(); } catch(e) {}
    try { if (typeof render === "function") render(); } catch(e) {}
  }
  function ensure1827() {
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
    s.finance.incomeSources = s.finance.incomeSources || {};
    s.finance.debts = s.finance.debts || {};
    s.finance.taxCountry = s.finance.taxCountry || "us";
    s.finance.taxRegion = s.finance.taxRegion || "pa";
    s.educationV1825 = s.educationV1825 || {};
    s.educationV1825.degrees = Array.isArray(s.educationV1825.degrees) ? s.educationV1825.degrees : [];
    s.educationV1827 = s.educationV1827 || {};
    s.careerV1827 = s.careerV1827 || {};
    s.careerV1827.applications = Array.isArray(s.careerV1827.applications) ? s.careerV1827.applications : [];
    s.careerV1827.offers = Array.isArray(s.careerV1827.offers) ? s.careerV1827.offers : [];
    s.careerV1827.history = Array.isArray(s.careerV1827.history) ? s.careerV1827.history : [];
    s.careerV1827.interviewPrep = Math.max(0, Math.round(num1827(s.careerV1827.interviewPrep)));
    s.careerV1827.lastActionId = s.careerV1827.lastActionId || 0;
    seedCurrentDegree1827(s);
    return s;
  }

  var TAX_PROFILES1827 = [
    { id:"us", name:"United States", base:.22, invest:.15, business:.05, move:3500, regions:[
      ["pa","Pennsylvania",.0307,"Flat state income tax; sales tax still affects spending."],
      ["de","Delaware",.038, "No sales tax model; moderate income tax."],
      ["ny","New York",.062,"High state/city pressure with stronger career market flavor."],
      ["ca","California",.085,"High tax, high opportunity, higher costs."],
      ["tx","Texas",0,"No state income tax; sales/property pressure in the background."],
      ["fl","Florida",0,"No state income tax, retirement-friendly model."],
      ["wa","Washington",0,"No wage income tax model; higher sales pressure."],
      ["il","Illinois",.0495,"Flat tax state model."],
      ["ma","Massachusetts",.05,"High education and professional market."],
      ["co","Colorado",.044,"Moderate flat income tax model."]
    ], note:"Federal income tax is the main layer. State residence changes the second layer." },
    { id:"canada", name:"Canada", base:.26, invest:.18, business:.07, move:9000, regions:[["on","Ontario",.08,"Large professional market."],["bc","British Columbia",.075,"High cost coastal market."],["ab","Alberta",.045,"Lower provincial pressure."]], note:"Income and provincial taxes are modeled together at a higher baseline." },
    { id:"uk", name:"United Kingdom", base:.28, invest:.20, business:.065, move:10000, regions:[["eng","England",0,"Baseline UK profile."],["sct","Scotland",.025,"Slightly higher progressive pressure model."]], note:"Higher income tax profile; healthcare costs are less central." },
    { id:"germany", name:"Germany", base:.32, invest:.22, business:.08, move:10500, regions:[["berlin","Berlin",0,"Urban professional market."],["bavaria","Bavaria",.01,"Higher earnings, slightly higher pressure."]], note:"High tax/high services model." },
    { id:"france", name:"France", base:.31, invest:.22, business:.08, move:10500, regions:[["idf","Île-de-France",.015,"Paris region."],["south","South",0,"Lower pressure lifestyle model."]], note:"High services and higher income tax pressure." },
    { id:"singapore", name:"Singapore", base:.14, invest:.05, business:.035, move:13000, regions:[["central","Central",0,"Low tax, high cost finance hub."]], note:"Low tax, high opportunity, high relocation cost." },
    { id:"uae", name:"United Arab Emirates", base:.02, invest:0, business:.025, move:15000, regions:[["dubai","Dubai",0,"Near-zero income tax, luxury cost pressure."],["abudhabi","Abu Dhabi",0,"Near-zero income tax, stable expat model."]], note:"Very low tax model; moving and lifestyle costs matter." },
    { id:"thailand", name:"Thailand", base:.16, invest:.08, business:.04, move:8500, regions:[["bangkok","Bangkok",0,"Urban cost and opportunity."],["phuket","Phuket",.005,"Island lifestyle cost pressure."],["chiangmai","Chiang Mai",-.01,"Lower-cost lifestyle model."]], note:"Moderate tax model with lower cost assumptions." },
    { id:"vietnam", name:"Vietnam", base:.17, invest:.08, business:.04, move:8000, regions:[["hcmc","Ho Chi Minh City",0,"Large business market."],["danang","Da Nang",-.008,"Coastal lower-cost model."],["hanoi","Hanoi",0,"Government and professional hub."]], note:"Moderate tax model with lower cost assumptions." }
  ];
  function profile1827(id) {
    return TAX_PROFILES1827.find(function (p) { return p.id === id; }) || TAX_PROFILES1827[0];
  }
  function region1827(countryId, regionId) {
    var p = profile1827(countryId);
    return (p.regions || []).find(function (r) { return r[0] === regionId; }) || (p.regions || [])[0] || ["default", "Default", 0, "Default region."];
  }
  function grossIncome1827() {
    var f = (state && state.finance) || {};
    var src = f.incomeSources || {};
    return Math.max(0, Math.round(
      num1827(state && state.job && state.job.salary) +
      Math.max(0, num1827(f.lastEntrepreneurIncome || f.lastBusinessIncome)) +
      Math.max(0, num1827(src.firmDistribution || src.fundCarryV1825 || src.dividends || src.realizedGains)) +
      Math.max(0, num1827(f.lastInvestmentCashIncome || f.lastDividendIncome))
    ));
  }
  function projectedTax1827(countryId, regionId, income) {
    var p = profile1827(countryId || (state.finance && state.finance.taxCountry));
    var r = region1827(p.id, regionId || (state.finance && state.finance.taxRegion));
    income = Math.max(0, Math.round(num1827(income, grossIncome1827())));
    var businessIncome = Math.max(0, num1827(state.finance && (state.finance.lastEntrepreneurIncome || state.finance.lastBusinessIncome)));
    var investmentIncome = Math.max(0, num1827(state.finance && state.finance.incomeSources && (state.finance.incomeSources.dividends || state.finance.incomeSources.realizedGains || state.finance.incomeSources.fundCarryV1825)));
    var wageTax = Math.round(income * (num1827(p.base) + num1827(r[2])));
    var bizTax = Math.round(businessIncome * num1827(p.business));
    var invTax = Math.round(investmentIncome * num1827(p.invest));
    var accountantReduction = state.finance && state.finance.accountant && state.finance.accountant.reduction ? num1827(state.finance.accountant.reduction) : 0;
    var gross = Math.max(0, wageTax + bizTax + invTax);
    var savings = Math.round(gross * Math.min(.35, Math.max(0, accountantReduction)));
    return { profile:p, region:r, income:income, wageTax:wageTax, businessTax:bizTax, investmentTax:invTax, savings:savings, total:Math.max(0, gross - savings), rate:income ? Math.max(0, (gross - savings) / income) : 0 };
  }

  var DEGREE_OPTIONS1827 = [
    { id:"business", name:"Business Degree", years:4, desc:"Management, operations, marketing, finance, and entrepreneurship.", jobs:["analyst","marketing","office","finance_manager"] },
    { id:"finance", name:"Finance Degree", years:4, desc:"Investing, banking, planning, and wealth management.", jobs:["analyst","finance_manager","wealth_advisor"] },
    { id:"cs", name:"Computer Science Degree", years:4, desc:"Software, data systems, cybersecurity, and technical leadership.", jobs:["software","cybersecurity","quant_finance"] },
    { id:"nursing", name:"Nursing Degree", years:4, desc:"Clinical care path that unlocks Registered Nurse and nursing ladder roles.", jobs:["nurse"] },
    { id:"education", name:"Education Degree", years:4, desc:"Teaching, school leadership, and education administration.", jobs:["teacher"] },
    { id:"law", name:"Law Degree", years:3, desc:"Legal practice path for attorney and high-level legal careers.", jobs:["attorney","paralegal"] },
    { id:"medical", name:"Medical Degree", years:6, desc:"Long, expensive healthcare path for physician careers.", jobs:["physician","labtech","nurse"] },
    { id:"biology", name:"Biology Degree", years:4, desc:"Lab, medicine, healthcare, and science careers.", jobs:["labtech","nurse","physician"] },
    { id:"criminaljustice", name:"Criminal Justice Degree", years:4, desc:"Courts, investigation, paralegal, public safety, and legal operations.", jobs:["paralegal","attorney"] },
    { id:"psych", name:"Psychology Degree", years:4, desc:"Counseling, people systems, leadership, and human services.", jobs:["counselor","wealth_advisor"] }
  ];
  var DEGREE_SCHOOLS1827 = [
    { id:"community", name:"Community College Path", cost:6500, quality:.70, note:"Cheapest route; slower networking." },
    { id:"state", name:"State University", cost:14500, quality:.86, note:"Balanced cost and job placement." },
    { id:"private", name:"Private College", cost:33000, quality:1.03, note:"More expensive, better networking." },
    { id:"elite", name:"Elite University", cost:62000, quality:1.18, note:"High cost, strongest prestige and interview boost." }
  ];
  function degreeOption1827(id) { return DEGREE_OPTIONS1827.find(function (d) { return d.id === id; }) || DEGREE_OPTIONS1827[0]; }
  function degreeSchool1827(id) { return DEGREE_SCHOOLS1827.find(function (s) { return s.id === id; }) || DEGREE_SCHOOLS1827[1]; }
  function seedCurrentDegree1827(s) {
    if (!s || !s.educationV1825) return;
    var list = s.educationV1825.degrees;
    if (!Array.isArray(list)) list = s.educationV1825.degrees = [];
    if ((s.flags && s.flags.hasDegree) || s.education === "College") {
      var id = s.major || "general";
      if (id && !list.some(function (d) { return d.majorId === id; })) {
        var opt = degreeOption1827(id);
        list.push({ majorId:id, majorName:opt && opt.id === id ? opt.name : String(id).charAt(0).toUpperCase() + String(id).slice(1), schoolId:s.college || "completed", schoolName:"Completed College", level:"Bachelor's", completedAge:s.age || 0, seededV1827:true });
      }
    }
  }
  function degreeIds1827() {
    var s = ensure1827();
    var ids = [];
    (s.educationV1825.degrees || []).forEach(function (d) { if (d && d.majorId && ids.indexOf(d.majorId) < 0) ids.push(d.majorId); });
    if (s.major && ((s.flags && s.flags.hasDegree) || s.education === "College") && ids.indexOf(s.major) < 0) ids.push(s.major);
    Object.keys(s.flags || {}).forEach(function (k) {
      if (k.indexOf("degree_") === 0) {
        var id = k.replace("degree_", "");
        if (ids.indexOf(id) < 0) ids.push(id);
      }
    });
    return ids;
  }
  function hasDegree1827(id) { return degreeIds1827().indexOf(id) >= 0; }
  function degreeNames1827(ids) {
    ids = ids || degreeIds1827();
    if (!ids.length) return "No completed degree on file";
    return ids.map(function (id) { return (degreeOption1827(id) || {}).name || id; }).join(" · ");
  }
  window.startDegreeV1827 = function (majorId, schoolId) {
    var s = ensure1827();
    if (num1827(s.age) < 18 && !(s.flags && s.flags.earlyCollege)) return toast1827("Additional degrees unlock at 18 or early college.");
    if (s.educationV1825.activeDegree) return toast1827("Finish or pause the active degree first.");
    var major = degreeOption1827(majorId);
    var school = degreeSchool1827(schoolId || (document.getElementById("v1827-degree-school") || {}).value || "state");
    if (hasDegree1827(major.id)) return toast1827("You already completed that degree path.");
    var cost = Math.round(num1827(school.cost));
    if (num1827(s.money) < cost) return toast1827("First year needs " + money1827(cost) + ".");
    s.money = Math.round(num1827(s.money) - cost);
    s.educationV1825.activeDegree = { majorId:major.id, majorName:major.name, schoolId:school.id, schoolName:school.name, annualCost:cost, yearsCompleted:0, targetYears:major.years || 4, startedAge:s.age || 0, quality:school.quality || .85, sourceV1827:true };
    s.educationV1827.lastStarted = major.id;
    try { if (typeof applyDeltas === "function") applyDeltas({ smarts:2, discipline:1, stress:2 }); } catch(e) {}
    log1827("Started " + major.name + " through " + school.name + ".", { money:-cost, smarts:2, discipline:1, stress:2 });
    saveRender1827();
  };
  window.pauseDegreeV1827 = function () {
    var s = ensure1827();
    if (!s.educationV1825.activeDegree) return toast1827("No active degree to pause.");
    s.educationV1825.pausedDegree = s.educationV1825.activeDegree;
    s.educationV1825.activeDegree = null;
    log1827("Paused the active degree path.");
    saveRender1827();
  };
  window.resumeDegreeV1827 = function () {
    var s = ensure1827();
    if (s.educationV1825.activeDegree) return toast1827("A degree is already active.");
    if (!s.educationV1825.pausedDegree) return toast1827("No paused degree saved.");
    s.educationV1825.activeDegree = s.educationV1825.pausedDegree;
    s.educationV1825.pausedDegree = null;
    log1827("Resumed " + s.educationV1825.activeDegree.majorName + ".");
    saveRender1827();
  };

  function getCatalog1827() {
    try { if (Array.isArray(careerCatalog)) return careerCatalog; } catch(e) {}
    return Array.isArray(window.careerCatalog) ? window.careerCatalog : [];
  }
  function ensureSupplementalJobs1827() {
    var jobs = getCatalog1827();
    if (!jobs || !jobs.push) return jobs || [];
    if (jobs.__v1827Supplemental) return jobs;
    function has(id) { return jobs.some(function (j) { return j.id === id; }); }
    var add = [
      { id:"attorney", title:"Associate Attorney", salary:105000, minAge:25, req:function (s) { return s.major === "law" || (s.flags && s.flags.degree_law); }, desc:"Law degree path with interviews, casework, and a legal ladder.", ladder:[{title:"Associate Attorney",salary:105000,minPerf:0},{title:"Senior Associate",salary:155000,minPerf:58},{title:"Partner Track Attorney",salary:230000,minPerf:72},{title:"Partner",salary:390000,minPerf:86}] },
      { id:"physician", title:"Resident Physician", salary:78000, minAge:26, req:function (s) { return s.major === "medical" || (s.flags && s.flags.degree_medical); }, desc:"Medical degree path. Low early pay, high long-term ceiling.", ladder:[{title:"Resident Physician",salary:78000,minPerf:0},{title:"Attending Physician",salary:235000,minPerf:58},{title:"Specialist",salary:360000,minPerf:74},{title:"Department Chief",salary:520000,minPerf:88}] },
      { id:"finance_manager", title:"Financial Analyst", salary:78000, minAge:22, req:function (s) { return ["finance","business","cs"].indexOf(s.major) >= 0 || (s.flags && (s.flags.degree_finance || s.flags.degree_business)); }, desc:"Finance degree or business path into analyst and management roles.", ladder:[{title:"Financial Analyst",salary:78000,minPerf:0},{title:"Senior Analyst",salary:108000,minPerf:55},{title:"Finance Manager",salary:148000,minPerf:70},{title:"Finance Director",salary:225000,minPerf:84}] },
      { id:"cybersecurity", title:"Cybersecurity Analyst", salary:92000, minAge:22, req:function (s) { return s.major === "cs" || (s.flags && s.flags.degree_cs) || (s.inventory || []).indexOf("laptop") >= 0; }, desc:"Computer science or strong self-taught technical path.", ladder:[{title:"Cybersecurity Analyst",salary:92000,minPerf:0},{title:"Security Engineer",salary:135000,minPerf:58},{title:"Security Architect",salary:190000,minPerf:76},{title:"Security Director",salary:285000,minPerf:88}] },
      { id:"wealth_advisor", title:"Wealth Advisor", salary:72000, minAge:21, req:function (s) { return ["finance","business","psych"].indexOf(s.major) >= 0 || num1827(s.stats && s.stats.confidence) >= 68; }, desc:"People skills plus money knowledge; pairs with finance and business degrees.", ladder:[{title:"Wealth Advisor",salary:72000,minPerf:0},{title:"Senior Advisor",salary:115000,minPerf:56},{title:"Private Client Advisor",salary:180000,minPerf:76},{title:"Regional Director",salary:300000,minPerf:88}] }
    ];
    add.forEach(function (job) { if (!has(job.id)) jobs.push(job); });
    jobs.__v1827Supplemental = true;
    return jobs;
  }
  function qualifiesBase1827(job) {
    if (!job) return false;
    if (num1827(state.age) < num1827(job.minAge)) return false;
    try { if (typeof job.req === "function" && job.req(state)) return true; } catch(e) {}
    return false;
  }
  function qualifiesWithDegrees1827(job) {
    if (!job) return false;
    var s = ensure1827();
    if (num1827(s.age) < num1827(job.minAge)) return false;
    if (qualifiesBase1827(job)) return true;
    var ids = degreeIds1827();
    var old = s.major;
    for (var i = 0; i < ids.length; i++) {
      try {
        s.major = ids[i];
        if (typeof job.req === "function" && job.req(s)) return true;
      } catch(e) {}
      finally { s.major = old; }
    }
    s.major = old;
    return false;
  }
  function missingForJob1827(job) {
    var bits = [];
    if (num1827(state.age) < num1827(job.minAge)) bits.push("Age " + job.minAge + "+");
    if (!qualifiesWithDegrees1827(job)) {
      var degreeHints = DEGREE_OPTIONS1827.filter(function (d) { return (d.jobs || []).indexOf(job.id) >= 0; }).map(function (d) { return d.name.replace(" Degree", ""); });
      if (degreeHints.length) bits.push("Degree: " + degreeHints.slice(0, 3).join(" / "));
      else bits.push("Specific education, certificate, item, car, or stat requirement");
    }
    return bits.join(" · ") || "Qualified";
  }
  function applicationFor1827(jobId) {
    var s = ensure1827();
    return (s.careerV1827.applications || []).find(function (a) { return a.jobId === jobId && !a.closed; });
  }
  function offerFor1827(jobId) {
    var s = ensure1827();
    return (s.careerV1827.offers || []).find(function (o) { return o.jobId === jobId && !o.closed; });
  }
  function fitScore1827(job) {
    ensure1827();
    var ids = degreeIds1827();
    var degreeFit = qualifiesWithDegrees1827(job) ? 25 : 0;
    var mapped = DEGREE_OPTIONS1827.some(function (d) { return ids.indexOf(d.id) >= 0 && (d.jobs || []).indexOf(job.id) >= 0; });
    if (mapped) degreeFit += 12;
    var stats = state.stats || {};
    var smarts = num1827(stats.smarts || state.smarts || state.iq / 2, 50);
    var confidence = num1827(stats.confidence || state.confidence, 50);
    var discipline = num1827(stats.discipline || state.discipline, 50);
    var charisma = num1827(stats.charisma || stats.social || state.charisma || state.social, confidence);
    var stressPenalty = Math.max(0, (num1827(state.stress || stats.stress) - 55) / 2);
    var healthPenalty = Math.max(0, 50 - num1827(state.health || stats.health, 70)) / 3;
    var legalPenalty = Math.max(0, num1827(state.finance && state.finance.taxLegalRisk) - 60) / 3;
    var prep = Math.min(14, num1827(state.careerV1827.interviewPrep) * 2);
    var score = 20 + degreeFit + smarts * .15 + confidence * .16 + discipline * .12 + charisma * .12 + prep - stressPenalty - healthPenalty - legalPenalty;
    return Math.round(clamp1827(score, 0, 100));
  }
  window.applyToJobV1827 = function (jobId) {
    var s = ensure1827();
    var jobs = ensureSupplementalJobs1827();
    var job = jobs.find(function (j) { return j.id === jobId; });
    if (!job) return toast1827("Job not found.");
    if (!qualifiesWithDegrees1827(job)) return toast1827("Missing: " + missingForJob1827(job));
    if (s.job && s.job.jobId === job.id) return toast1827("You already have that job.");
    if (offerFor1827(job.id)) return toast1827("You already have an offer waiting.");
    var app = applicationFor1827(job.id);
    if (app) return toast1827("Application is already active. Take the interview.");
    var id = "app-" + Date.now() + "-" + (++s.careerV1827.lastActionId);
    s.careerV1827.applications.unshift({ id:id, jobId:job.id, title:job.title, salary:job.salary, stage:"applied", rounds:0, score:fitScore1827(job), createdAge:s.age || 0, closed:false });
    s.careerV1827.applications = s.careerV1827.applications.slice(0, 12);
    log1827("Applied for " + job.title + ". Next step: interview.", { confidence:1, stress:1 });
    try { if (typeof applyDeltas === "function") applyDeltas({ confidence:1, stress:1 }); } catch(e) {}
    saveRender1827();
  };
  window.prepareInterviewV1827 = function () {
    var s = ensure1827();
    var cost = 250 + Math.round(num1827(s.careerV1827.interviewPrep) * 150);
    if (num1827(s.money) < cost) return toast1827("Interview prep needs " + money1827(cost) + ".");
    s.money = Math.round(num1827(s.money) - cost);
    s.careerV1827.interviewPrep = Math.min(7, num1827(s.careerV1827.interviewPrep) + 1);
    log1827("You practiced interview answers and cleaned up your résumé.", { money:-cost, confidence:2, discipline:1, stress:-1 });
    try { if (typeof applyDeltas === "function") applyDeltas({ confidence:2, discipline:1, stress:-1 }); } catch(e) {}
    saveRender1827();
  };
  window.interviewForJobV1827 = function (jobId) {
    var s = ensure1827();
    var jobs = ensureSupplementalJobs1827();
    var job = jobs.find(function (j) { return j.id === jobId; });
    var app = applicationFor1827(jobId);
    if (!job || !app) return toast1827("Apply before interviewing.");
    if (!qualifiesWithDegrees1827(job)) return toast1827("You no longer meet the minimum requirements.");
    var base = fitScore1827(job);
    var roll = Math.round(base + (Math.random() * 22 - 10) + num1827(app.rounds) * 4);
    var threshold = job.salary >= 180000 ? 78 : job.salary >= 95000 ? 68 : 56;
    app.rounds = num1827(app.rounds) + 1;
    app.score = roll;
    if (roll >= threshold + 12) {
      app.closed = true; app.stage = "offer";
      var strongSalary = Math.round(num1827(job.salary) * (1.08 + Math.random() * .08));
      s.careerV1827.offers.unshift({ jobId:job.id, title:job.title, salary:strongSalary, baseSalary:job.salary, strength:"strong", createdAge:s.age || 0, closed:false });
      log1827("Strong interview: " + job.title + " offered " + money1827(strongSalary) + "/yr.", { confidence:4, stress:-1 });
      try { if (typeof applyDeltas === "function") applyDeltas({ confidence:4, stress:-1 }); } catch(e) {}
    } else if (roll >= threshold) {
      app.closed = true; app.stage = "offer";
      var salary = Math.round(num1827(job.salary) * (.96 + Math.random() * .08));
      s.careerV1827.offers.unshift({ jobId:job.id, title:job.title, salary:salary, baseSalary:job.salary, strength:"standard", createdAge:s.age || 0, closed:false });
      log1827("Interview passed: " + job.title + " made an offer for " + money1827(salary) + "/yr.", { confidence:2, stress:-1 });
      try { if (typeof applyDeltas === "function") applyDeltas({ confidence:2, stress:-1 }); } catch(e) {}
    } else if (roll >= threshold - 10 && app.rounds < 2) {
      app.stage = "second_interview";
      log1827("The " + job.title + " interview led to a second interview. Prep can help.", { stress:2 });
      try { if (typeof applyDeltas === "function") applyDeltas({ stress:2 }); } catch(e) {}
    } else {
      app.closed = true; app.stage = "rejected";
      s.careerV1827.history.unshift({ jobId:job.id, title:job.title, outcome:"Rejected", score:roll, age:s.age || 0 });
      log1827("Interview result: " + job.title + " passed this time. Build stats or prep and try again later.", { confidence:-1, stress:2 });
      try { if (typeof applyDeltas === "function") applyDeltas({ confidence:-1, stress:2 }); } catch(e) {}
    }
    s.careerV1827.offers = s.careerV1827.offers.slice(0, 8);
    saveRender1827();
  };
  function startJobDirect1827(job, salary) {
    state.job = { jobId:job.id, title:job.title, salary:Math.round(num1827(salary || job.salary)), performance:50, stress:0, tier:0 };
    log1827("Accepted the " + job.title + " offer.", { happiness:4, stress:3, confidence:2 });
    try { if (typeof applyDeltas === "function") applyDeltas({ happiness:4, stress:3, confidence:2 }); } catch(e) {}
  }
  window.acceptJobOfferV1827 = function (jobId) {
    var s = ensure1827();
    var jobs = ensureSupplementalJobs1827();
    var job = jobs.find(function (j) { return j.id === jobId; });
    var offer = offerFor1827(jobId);
    if (!job || !offer) return toast1827("No offer waiting for that job.");
    offer.closed = true;
    offer.accepted = true;
    s.careerV1827.applications.forEach(function (a) { if (a.jobId === jobId) a.closed = true; });
    s.careerV1827.history.unshift({ jobId:job.id, title:job.title, outcome:"Accepted", salary:offer.salary, age:s.age || 0 });
    startJobDirect1827(job, offer.salary);
    saveRender1827();
  };
  window.declineJobOfferV1827 = function (jobId) {
    var s = ensure1827();
    var offer = offerFor1827(jobId);
    if (!offer) return toast1827("No offer waiting.");
    offer.closed = true; offer.declined = true;
    s.careerV1827.history.unshift({ jobId:jobId, title:offer.title, outcome:"Declined", salary:offer.salary, age:s.age || 0 });
    log1827("Declined the " + offer.title + " offer.");
    saveRender1827();
  };

  var previousTakeCareer1827 = window.takeCareer || (typeof takeCareer === "function" ? takeCareer : null);
  window.takeCareer = function (jobId) {
    ensure1827();
    var offer = offerFor1827(jobId);
    if (offer) return window.acceptJobOfferV1827(jobId);
    return window.applyToJobV1827(jobId);
  };
  try { takeCareer = window.takeCareer; } catch(e) {}

  window.setTaxResidenceV1827 = function (countryId, regionId) {
    var s = ensure1827();
    var p = profile1827(countryId || s.finance.taxCountry);
    var r = region1827(p.id, regionId || (p.regions[0] && p.regions[0][0]));
    var currentKey = (s.finance.taxCountry || "us") + ":" + (s.finance.taxRegion || "");
    var nextKey = p.id + ":" + r[0];
    var international = p.id !== (s.finance.taxCountry || "us");
    var cost = nextKey === currentKey ? 0 : Math.round(num1827(p.move) + (international ? 5000 : 1200));
    if (cost && num1827(s.money) < cost) return toast1827("Moving needs " + money1827(cost) + " cash.");
    if (cost) s.money = Math.round(num1827(s.money) - cost);
    s.finance.taxCountry = p.id;
    s.finance.taxRegion = r[0];
    s.finance.taxDashboard = p.name + " / " + r[1];
    s.finance.relocationHistoryV1827 = Array.isArray(s.finance.relocationHistoryV1827) ? s.finance.relocationHistoryV1827 : [];
    s.finance.relocationHistoryV1827.unshift({ age:s.age || 0, country:p.id, region:r[0], cost:cost, note:r[3] });
    s.finance.relocationHistoryV1827 = s.finance.relocationHistoryV1827.slice(0, 10);
    log1827("Moved residence to " + p.name + " / " + r[1] + (cost ? " for " + money1827(cost) : "") + ".", { money:-cost, stress:international ? 5 : 2 });
    try { if (typeof applyDeltas === "function") applyDeltas({ stress:international ? 5 : 2 }); } catch(e) {}
    saveRender1827();
  };
  window.updateTaxRegionSelectV1827 = function (countryId, selectId) {
    var el = document.getElementById(selectId || "v1827-move-region");
    if (!el) return;
    var p = profile1827(countryId || "us");
    el.innerHTML = (p.regions || []).map(function (r) { return '<option value="' + esc1827(r[0]) + '">' + esc1827(r[1]) + (r[2] ? " · " + pct1827(r[2]) : " · no extra") + '</option>'; }).join("");
  };

  function taxOfficeReport1827() {
    ensure1827();
    var current = projectedTax1827(state.finance.taxCountry, state.finance.taxRegion, grossIncome1827());
    var f = state.finance || {};
    var location = current.profile.name + " / " + current.region[1];
    return '<section class="money-section v1827-tax-office"><div class="money-section-title">Tax Office <span>read-only residence report</span></div>' +
      '<div class="v1827-note">This office explains the tax rules where the player currently lives. Moving belongs under <b>More → Move to Another Country</b>.</div>' +
      '<div class="v1827-tax-cards"><div><span>Current residence</span><b>' + esc1827(location) + '</b><em>' + esc1827(current.region[3] || current.profile.note) + '</em></div><div><span>Taxable income model</span><b>' + money1827(current.income) + '</b><em>Job + business + realized investment income.</em></div><div><span>Estimated tax</span><b class="' + (current.total ? "bad" : "good") + '">' + money1827(current.total) + '</b><em>Effective rate about ' + pct1827(current.rate) + '.</em></div><div><span>Tax debt</span><b class="' + (num1827(f.taxDebt || f.debts.taxDebt) ? "bad" : "good") + '">' + money1827(f.taxDebt || f.debts.taxDebt || 0) + '</b><em>Handled by payoff/legal systems, not relocation.</em></div></div>' +
      '<div class="v1827-breakdown"><div><b>Income tax</b><span>' + pct1827(current.profile.base + current.region[2]) + ' on modeled income → ' + money1827(current.wageTax) + '</span></div><div><b>Investment tax</b><span>' + pct1827(current.profile.invest) + ' on realized investment/dividend income → ' + money1827(current.investmentTax) + '</span></div><div><b>Business tax layer</b><span>' + pct1827(current.profile.business) + ' on business/fund income → ' + money1827(current.businessTax) + '</span></div><div><b>Accountant effect</b><span>Estimated savings → ' + money1827(current.savings) + '</span></div></div>' +
      '<div class="v1827-pill-row"><span>' + esc1827(current.profile.note) + '</span><span>Region: ' + esc1827(current.region[3] || "standard") + '</span><span>Business income: ' + money1827(Math.max(0, num1827(f.lastEntrepreneurIncome || f.lastBusinessIncome))) + '</span></div></section>';
  }
  function moveResidenceDesk1827() {
    ensure1827();
    var income = grossIncome1827();
    var current = projectedTax1827(state.finance.taxCountry, state.finance.taxRegion, income);
    var countryOptions = TAX_PROFILES1827.map(function (p) { return '<option value="' + esc1827(p.id) + '" ' + (p.id === current.profile.id ? "selected" : "") + '>' + esc1827(p.name) + '</option>'; }).join("");
    var regionOptions = (current.profile.regions || []).map(function (r) { return '<option value="' + esc1827(r[0]) + '" ' + (r[0] === current.region[0] ? "selected" : "") + '>' + esc1827(r[1]) + (r[2] ? " · " + pct1827(r[2]) : " · no extra") + '</option>'; }).join("");
    var cards = TAX_PROFILES1827.map(function (p) {
      var r = region1827(p.id, p.regions && p.regions[0] && p.regions[0][0]);
      var model = projectedTax1827(p.id, r[0], income);
      var diff = current.total - model.total;
      var moveCost = Math.round(num1827(p.move) + (p.id === current.profile.id ? 1200 : 5000));
      return '<div class="v1827-move-card ' + (p.id === current.profile.id ? "selected" : "") + '"><b>' + esc1827(p.name) + '</b><span>' + esc1827(p.note) + '</span><strong class="' + (diff > 0 ? "good" : diff < 0 ? "bad" : "") + '">' + (diff ? signed1827(diff) + ' tax difference' : 'Current baseline') + '</strong><em>Projected tax ' + money1827(model.total) + ' · move estimate ' + money1827(moveCost) + '</em></div>';
    }).join("");
    var history = (state.finance.relocationHistoryV1827 || state.finance.relocationHistoryV1826 || []).slice(0, 4).map(function (h) {
      var p = profile1827(h.country); var r = region1827(p.id, h.region);
      return '<div class="v1827-history-row"><b>Age ' + esc1827(h.age) + '</b><span>' + esc1827(p.name + ' / ' + r[1]) + ' · cost ' + money1827(h.cost || 0) + '</span></div>';
    }).join("") || '<div class="v1827-note small">No relocation history yet.</div>';
    return '<section class="money-section v1827-move-residence"><div class="money-section-title">Move to Another Country <span>More hub relocation</span></div><div class="v1827-note">This is the only place that changes where the player lives for tax purposes.</div><div class="v1827-controls"><select id="v1827-move-country" onchange="updateTaxRegionSelectV1827(this.value,\'v1827-move-region\')">' + countryOptions + '</select><select id="v1827-move-region">' + regionOptions + '</select><button class="money-btn gold" onclick="event.preventDefault();event.stopPropagation();setTaxResidenceV1827(document.getElementById(\'v1827-move-country\').value,document.getElementById(\'v1827-move-region\').value)" ' + (num1827(state.age) < 18 ? "disabled" : "") + '>Move Residence</button></div><div class="v1827-move-grid">' + cards + '</div><div class="v1827-subtitle">Relocation history</div>' + history + '</section>';
  }
  function educationDegreeCenter1827() {
    ensure1827();
    var active = state.educationV1825.activeDegree;
    var paused = state.educationV1825.pausedDegree;
    var ids = degreeIds1827();
    var schoolOptions = DEGREE_SCHOOLS1827.map(function (s) { return '<option value="' + esc1827(s.id) + '">' + esc1827(s.name) + ' · ' + money1827(s.cost) + '/yr</option>'; }).join("");
    var activeHtml = active ? '<div class="v1827-degree-active"><div><b>' + esc1827(active.majorName) + '</b><span>' + esc1827(active.schoolName) + ' · ' + Math.round((num1827(active.yearsCompleted) / Math.max(1, num1827(active.targetYears, 4))) * 100) + '% complete · ' + money1827(active.annualCost) + '/yr</span></div><button class="money-btn" onclick="pauseDegreeV1827()">Pause</button></div>' : (paused ? '<div class="v1827-degree-active"><div><b>Paused: ' + esc1827(paused.majorName) + '</b><span>Resume when ready. Only one degree can be active at a time.</span></div><button class="money-btn green" onclick="resumeDegreeV1827()">Resume</button></div>' : '<div class="v1827-note">No active extra degree. Pick a new degree here; jobs unlock in Career after the degree is earned.</div>');
    var cards = DEGREE_OPTIONS1827.map(function (d) {
      var owned = hasDegree1827(d.id);
      var busy = !!state.educationV1825.activeDegree;
      return '<div class="v1827-degree-card ' + (owned ? "owned" : "") + '"><b>' + esc1827(d.name) + '</b><p>' + esc1827(d.desc) + '</p><div class="v1827-pill-row"><span>' + esc1827(d.years || 4) + ' years</span><span>Unlocks: ' + esc1827((d.jobs || []).slice(0, 3).join(' / ')) + '</span></div><button class="money-btn ' + (owned ? "" : "green") + '" onclick="event.preventDefault();event.stopPropagation();startDegreeV1827(\'' + esc1827(d.id) + '\',document.getElementById(\'v1827-degree-school\').value)" ' + (owned || busy ? "disabled" : "") + '>' + (owned ? "Completed" : busy ? "Finish Active Degree" : "Start Degree") + '</button></div>';
    }).join("");
    return '<section class="panel v1827-degree-center"><div class="section-label">Education: Multiple Degrees</div>' + activeHtml + '<div class="v1827-degree-top"><div><b>Degrees on file</b><span>' + esc1827(degreeNames1827(ids)) + '</span></div><select id="v1827-degree-school">' + schoolOptions + '</select></div><div class="v1827-degree-grid">' + cards + '</div></section>';
  }
  function careerInterviewDesk1827() {
    ensure1827();
    var jobs = ensureSupplementalJobs1827();
    var activeApps = state.careerV1827.applications.filter(function (a) { return !a.closed; });
    var activeOffers = state.careerV1827.offers.filter(function (o) { return !o.closed; });
    var pipeline = '';
    if (!activeApps.length && !activeOffers.length) pipeline = '<div class="v1827-note small">No active applications. Qualified jobs below now require an application and interview before hiring.</div>';
    pipeline += activeOffers.map(function (o) { return '<div class="v1827-pipeline-card offer"><div><b>Offer: ' + esc1827(o.title) + '</b><span>' + money1827(o.salary) + '/yr · ' + esc1827(o.strength || "standard") + ' offer</span></div><div class="v1827-actions"><button class="money-btn green" onclick="acceptJobOfferV1827(\'' + esc1827(o.jobId) + '\')">Accept</button><button class="money-btn red" onclick="declineJobOfferV1827(\'' + esc1827(o.jobId) + '\')">Decline</button></div></div>'; }).join("");
    pipeline += activeApps.map(function (a) { return '<div class="v1827-pipeline-card"><div><b>' + esc1827(a.title) + '</b><span>' + esc1827(a.stage === "second_interview" ? "Second interview" : "Application submitted") + ' · fit ' + esc1827(a.score || 0) + '/100 · round ' + esc1827(a.rounds || 0) + '</span></div><div class="v1827-actions"><button class="money-btn gold" onclick="interviewForJobV1827(\'' + esc1827(a.jobId) + '\')">Interview</button></div></div>'; }).join("");
    var list = jobs.slice().sort(function (a, b) { return num1827(a.minAge) - num1827(b.minAge) || num1827(b.salary) - num1827(a.salary); }).slice(0, 24);
    var cards = list.map(function (job) {
      var current = state.job && state.job.jobId === job.id;
      var offer = offerFor1827(job.id);
      var app = applicationFor1827(job.id);
      var qualifies = qualifiesWithDegrees1827(job);
      var cls = current ? "current" : offer ? "offer" : app ? "applied" : qualifies ? "qualified" : "locked";
      var action = current ? '<button class="money-btn" disabled>Current</button>' : offer ? '<button class="money-btn green" onclick="acceptJobOfferV1827(\'' + esc1827(job.id) + '\')">Accept Offer</button>' : app ? '<button class="money-btn gold" onclick="interviewForJobV1827(\'' + esc1827(job.id) + '\')">Interview</button>' : qualifies ? '<button class="money-btn blue" onclick="applyToJobV1827(\'' + esc1827(job.id) + '\')">Apply</button>' : '<button class="money-btn" disabled>Locked</button>';
      return '<div class="v1827-job-card ' + cls + '"><div class="v1827-job-head"><b>' + esc1827(job.title) + '</b><span>' + (current ? 'Current' : offer ? 'Offer' : app ? 'Interviewing' : qualifies ? 'Qualified' : 'Locked') + '</span></div><p>' + esc1827(job.desc || 'Career path.') + '</p><div class="v1827-pill-row"><span>' + money1827(job.salary) + '/yr base</span><span>Age ' + esc1827(job.minAge || 16) + '+</span><span>Fit ' + (qualifies ? fitScore1827(job) + '/100' : '—') + '</span></div><em>' + esc1827(qualifies ? 'Next: apply, interview, then accept an offer.' : missingForJob1827(job)) + '</em>' + action + '</div>';
    }).join("");
    return '<section class="panel v1827-career-interviews"><div class="section-label">Career Applications + Interviews</div><div class="v1827-career-hero"><div><b>Jobs now have a hiring process.</b><span>Degree unlocks make jobs eligible, then you apply, interview, and accept offers. No more instant click-to-job from a degree card.</span></div><button class="money-btn" onclick="prepareInterviewV1827()">Prep Interview</button></div><div class="v1827-pill-row"><span>Degrees: ' + esc1827(degreeNames1827()) + '</span><span>Prep level ' + Math.round(num1827(state.careerV1827.interviewPrep)) + '</span></div><div class="v1827-pipeline">' + pipeline + '</div><div class="v1827-job-grid">' + cards + '</div></section>';
  }

  function removeSections1827(html, classes) {
    html = String(html || "");
    classes.forEach(function (cls) {
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
  function insertAfterFirst1827(html, chunk) {
    html = String(html || "");
    var end = html.indexOf("</section>");
    return end >= 0 ? html.slice(0, end + 10) + chunk + html.slice(end + 10) : chunk + html;
  }
  var prevRenderHubContent1827 = window.renderHubContent || (typeof renderHubContent === "function" ? renderHubContent : null);
  if (prevRenderHubContent1827 && !window.__ledgerRenderHub1827Wrapped) {
    window.__ledgerRenderHub1827Wrapped = true;
    window.renderHubContent = function (hubId) {
      ensure1827();
      ensureSupplementalJobs1827();
      var html = "";
      try { html = prevRenderHubContent1827.apply(this, arguments) || ""; }
      catch(e) { html = '<section class="panel"><div class="section-label">Recovered Render</div><div class="row-sub">' + esc1827(e && (e.message || e)) + '</div></section>'; }
      html = removeSections1827(html, ["v1826-relocation", "v1827-tax-office", "v1827-move-residence", "v1827-degree-center", "v1827-career-interviews", "v1825-degree-desk", "v1825-career-degree"]);
      if (hubId === "law" || hubId === "legal") html = taxOfficeReport1827() + html;
      if (hubId === "more") html = moveResidenceDesk1827() + html;
      if (hubId === "school" || hubId === "education") html = insertAfterFirst1827(html, educationDegreeCenter1827());
      if (hubId === "career") html = insertAfterFirst1827(html, careerInterviewDesk1827());
      return html;
    };
    try { renderHubContent = window.renderHubContent; } catch(e) {}
  }

  var style = document.createElement("style");
  style.textContent = [
    ".v1827-tax-office,.v1827-move-residence,.v1827-career-interviews,.v1827-degree-center{border-color:rgba(126,160,172,.42)!important;background:linear-gradient(135deg,rgba(22,38,42,.96),rgba(34,29,22,.97))!important;overflow:hidden!important}.v1827-tax-office{border-color:rgba(216,173,109,.45)!important;background:linear-gradient(135deg,rgba(49,38,22,.96),rgba(27,23,18,.98))!important}.v1827-move-residence{border-color:rgba(126,160,172,.52)!important}.v1827-degree-center{border-color:rgba(201,155,85,.46)!important}.v1827-career-interviews{border-color:rgba(143,175,108,.44)!important;background:linear-gradient(135deg,rgba(22,43,30,.96),rgba(29,25,20,.98))!important}",
    ".v1827-note{border:1px dashed rgba(255,255,255,.13);border-radius:12px;background:rgba(0,0,0,.16);color:#d6c5aa;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.55;padding:10px;margin:8px 0}.v1827-note.small{margin:0}.v1827-note b{color:#f0ca7b}.v1827-subtitle{font-family:'JetBrains Mono',monospace;color:#f0ca7b;text-transform:uppercase;letter-spacing:.14em;font-size:10px;margin:13px 0 8px}",
    ".v1827-tax-cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:9px}.v1827-tax-cards>div,.v1827-breakdown>div,.v1827-move-card,.v1827-degree-card,.v1827-degree-active,.v1827-pipeline-card,.v1827-job-card,.v1827-degree-top,.v1827-history-row{border:1px solid rgba(255,255,255,.10);border-radius:12px;background:rgba(255,255,255,.045);padding:11px;min-width:0}.v1827-tax-cards span,.v1827-tax-cards em,.v1827-move-card span,.v1827-move-card em,.v1827-degree-card p,.v1827-degree-active span,.v1827-degree-top span,.v1827-pipeline-card span,.v1827-job-card p,.v1827-job-card em,.v1827-history-row span{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.45;margin-top:4px;font-style:normal}.v1827-tax-cards span{font-size:9px;text-transform:uppercase;letter-spacing:.12em}.v1827-tax-cards b,.v1827-move-card b,.v1827-degree-card b,.v1827-degree-active b,.v1827-degree-top b,.v1827-pipeline-card b,.v1827-job-card b,.v1827-history-row b{display:block;color:#fff3df;font-size:15px;overflow-wrap:anywhere}.v1827-tax-cards b{font-family:'JetBrains Mono',monospace;font-size:18px;margin-top:5px}.v1827-tax-cards .good,.v1827-move-card .good{color:#b9dc8a}.v1827-tax-cards .bad,.v1827-move-card .bad{color:#e9927d}",
    ".v1827-breakdown{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:9px}.v1827-breakdown b{display:block;color:#f0ca7b}.v1827-breakdown span{display:block;color:#d6c5aa;font-family:'JetBrains Mono',monospace;font-size:10px;margin-top:3px}.v1827-pill-row{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}.v1827-pill-row span{border:1px solid rgba(255,255,255,.10);border-radius:999px;background:rgba(255,255,255,.045);padding:5px 8px;color:#d6c5aa;font-family:'JetBrains Mono',monospace;font-size:9px;line-height:1.2}",
    ".v1827-controls{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto;gap:8px;margin:10px 0}.v1827-controls select,.v1827-degree-top select{min-width:0;border:1px solid rgba(216,173,109,.32);border-radius:8px;background:#100d0a;color:#f6ead8;padding:10px;font-family:'JetBrains Mono',monospace;font-size:11px}.v1827-move-grid,.v1827-degree-grid,.v1827-job-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(225px,1fr));gap:9px;margin-top:10px}.v1827-move-card.selected,.v1827-degree-card.owned{border-color:rgba(185,220,138,.44);background:rgba(90,120,60,.16)}.v1827-move-card strong{display:block;font-family:'JetBrains Mono',monospace;margin-top:6px;color:#fff3df}",
    ".v1827-degree-top{display:grid;grid-template-columns:minmax(0,1fr) minmax(180px,260px);gap:10px;align-items:center;margin-top:9px}.v1827-degree-active{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center}.v1827-degree-card .money-btn,.v1827-job-card .money-btn{margin-top:9px}.v1827-career-hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:start}.v1827-career-hero b{display:block;color:#fff3df;font-size:16px}.v1827-career-hero span{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.45;margin-top:4px}.v1827-pipeline{display:grid;gap:8px;margin-top:10px}.v1827-pipeline-card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center}.v1827-pipeline-card.offer{border-color:rgba(185,220,138,.44);background:rgba(90,120,60,.15)}.v1827-actions{display:flex;flex-wrap:wrap;gap:7px}.v1827-job-head{display:flex;justify-content:space-between;gap:8px}.v1827-job-head span{font-family:'JetBrains Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:.12em;color:#f0ca7b}.v1827-job-card.locked{border-color:rgba(233,146,125,.28);opacity:.88}.v1827-job-card.qualified{border-color:rgba(126,160,172,.45)}.v1827-job-card.offer,.v1827-job-card.current{border-color:rgba(185,220,138,.48);background:rgba(90,120,60,.15)}.v1827-job-card.applied{border-color:rgba(240,202,123,.42)}",
    "@media(max-width:820px){.v1827-tax-cards{grid-template-columns:repeat(2,minmax(0,1fr))}.v1827-breakdown,.v1827-controls,.v1827-degree-top,.v1827-career-hero,.v1827-pipeline-card{grid-template-columns:1fr}}@media(max-width:520px){.v1827-tax-cards,.v1827-move-grid,.v1827-degree-grid,.v1827-job-grid{grid-template-columns:1fr}.v1827-actions .money-btn,.v1827-controls .money-btn{width:100%}}"
  ].join("\n");
  document.head.appendChild(style);
})();

