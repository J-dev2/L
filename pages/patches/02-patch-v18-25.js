/* LEDGER PATCH v18.25: people rhythm, family depth, multiple degrees, fund investor economics */
(function () {
  if (window.__ledgerV1825Loaded) return;
  window.__ledgerV1825Loaded = true;

  function esc1825(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (ch) {
      return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[ch];
    });
  }
  function num1825(v, fallback) {
    var n = Number(v);
    return Number.isFinite(n) ? n : (fallback || 0);
  }
  function clamp1825(v, min, max) {
    min = min == null ? 0 : min;
    max = max == null ? 100 : max;
    v = num1825(v);
    return Math.max(min, Math.min(max, v));
  }
  function cap1825(s) {
    s = String(s || "");
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }
  function money1825(v) {
    try { if (typeof money === "function") return money(Math.round(num1825(v))); } catch(e) {}
    v = Math.round(num1825(v));
    var sign = v < 0 ? "-" : "";
    v = Math.abs(v);
    if (v >= 1e12) return sign + "$" + (v / 1e12).toFixed(1).replace(/\.0$/, "") + "T";
    if (v >= 1e9) return sign + "$" + (v / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
    if (v >= 1e6) return sign + "$" + (v / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (v >= 1e4) return sign + "$" + Math.round(v / 1000) + "K";
    return sign + "$" + v.toLocaleString();
  }
  function signedMoney1825(v) {
    v = Math.round(num1825(v));
    return (v >= 0 ? "+" : "-") + money1825(Math.abs(v));
  }
  function pct1825(v) {
    return (num1825(v) * 100).toFixed(1).replace(/\.0$/, "") + "%";
  }
  function toast1825(msg) {
    try { if (typeof addToast === "function") return addToast(msg); } catch(e) {}
    try { if (typeof addLog === "function") return addLog(msg); } catch(e) {}
  }
  function log1825(msg, deltas) {
    try { if (typeof addLog === "function") return addLog(msg, deltas || {}); } catch(e) {}
  }
  function saveRender1825() {
    try { if (typeof save === "function") save(); } catch(e) {}
    try { if (typeof render === "function") render(); } catch(e) {}
  }
  function ensure1825() {
    try { if (typeof ensureStateShape === "function") ensureStateShape(); } catch(e) {}
    if (!window.state) return false;
    state.stats = state.stats || {};
    state.flags = state.flags || {};
    state.actionsTaken = state.actionsTaken || {};
    state.relationships = state.relationships || {};
    state.finance = state.finance || {};
    state.finance.incomeSources = state.finance.incomeSources || {};
    state.finance.fundTrackV189 = state.finance.fundTrackV189 || { active:false, outsideCapital:0, risk:"balanced", reputation:0, lastReturn:0, lastFees:0, years:0 };
    state.peopleV1825 = state.peopleV1825 || { actionCounts:{}, dateCounts:{}, findDateCounts:{}, childActivityCounts:{}, yearlySocialEnergy:12 };
    state.familyV1825 = state.familyV1825 || { childcarePlan:"family", lastChildcareCost:0, childFocus:"balanced" };
    state.educationV1825 = state.educationV1825 || { degrees:[], activeDegree:null, lastDegreeProgressAge:null };
    state.finance.fundInvestorLedgerV1825 = Array.isArray(state.finance.fundInvestorLedgerV1825) ? state.finance.fundInvestorLedgerV1825 : [];
    seedExistingDegree1825();
    ensureChildrenProfiles1825();
    return true;
  }
  function rand1825(min, max) {
    try { if (typeof rand === "function") return rand(min, max); } catch(e) {}
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function chance1825(p) {
    try { if (typeof chance === "function") return chance(p); } catch(e) {}
    return Math.random() < p;
  }
  function applyDeltas1825(deltas) {
    deltas = deltas || {};
    try { if (typeof applyDeltas === "function") return applyDeltas(deltas); } catch(e) {}
    Object.keys(deltas).forEach(function (k) {
      if (k === "money") state.money = Math.round(num1825(state.money) + num1825(deltas[k]));
      else if (state.stats && k in state.stats) state.stats[k] = clamp1825(num1825(state.stats[k]) + num1825(deltas[k]));
      else state[k] = num1825(state[k]) + num1825(deltas[k]);
    });
  }
  function currentAgeKey1825() { return String(Math.round(num1825(state && state.age))); }
  function countBucket1825(kind, key) {
    ensure1825();
    var age = currentAgeKey1825();
    state.peopleV1825[kind] = state.peopleV1825[kind] || {};
    state.peopleV1825[kind][age] = state.peopleV1825[kind][age] || {};
    if (state.peopleV1825[kind][age][key] == null) state.peopleV1825[kind][age][key] = 0;
    return state.peopleV1825[kind][age];
  }
  function getCount1825(kind, key) { return countBucket1825(kind, key)[key] || 0; }
  function incCount1825(kind, key) {
    var bucket = countBucket1825(kind, key);
    bucket[key] = (bucket[key] || 0) + 1;
    return bucket[key];
  }
  function socialEnergyUsed1825() {
    ensure1825();
    var age = currentAgeKey1825();
    var total = 0;
    ["actionCounts", "dateCounts", "findDateCounts", "childActivityCounts"].forEach(function (kind) {
      var bucket = state.peopleV1825[kind] && state.peopleV1825[kind][age] || {};
      Object.keys(bucket).forEach(function (k) { total += Math.max(0, num1825(bucket[k])); });
    });
    return total;
  }
  function socialEnergyLeft1825() {
    ensure1825();
    return Math.max(0, Math.round(num1825(state.peopleV1825.yearlySocialEnergy, 12) - socialEnergyUsed1825()));
  }
  function spendSocialEnergy1825() {
    if (socialEnergyLeft1825() <= 0) {
      toast1825("Social energy is used up for this year. Age up or focus on major life choices.");
      return false;
    }
    return true;
  }

  var repeatRelation1825 = {
    talk:{ max:6, bond:5, trust:3, deltas:{ happiness:2 }, label:"Talk" },
    gift:{ max:3, bond:8, trust:1, deltas:{ money:-120 }, label:"Gift" },
    apologize:{ max:4, bond:4, trust:7, deltas:{ stress:-2 }, label:"Apologize" },
    argue:{ max:3, bond:-7, trust:-4, deltas:{ stress:5, confidence:2 }, label:"Argue" },
    bigGift:{ max:2, bond:14, trust:2, deltas:{ money:-400, happiness:1 }, label:"Big gift" },
    allowance:{ max:4, bond:6, trust:1, deltas:{ money:-200 }, label:"Allowance" },
    punish:{ max:4, bond:-6, trust:-2, deltas:{ discipline:2, stress:2 }, label:"Punish" }
  };
  var prevRelationAction1825 = window.relationAction || (typeof relationAction === "function" ? relationAction : null);
  window.relationAction = function (key, action) {
    ensure1825();
    var spec = repeatRelation1825[action];
    if (!spec) return prevRelationAction1825 ? prevRelationAction1825.apply(this, arguments) : undefined;
    var r = state.relationships && state.relationships[key];
    if (!r || !r.alive) return;
    var countKey = key + "_" + action;
    if (getCount1825("actionCounts", countKey) >= spec.max) return toast1825(spec.label + " is at its yearly rhythm limit for " + r.name + ".");
    if (!spendSocialEnergy1825()) return;
    var deltas = Object.assign({}, spec.deltas || {});
    if (deltas.money && num1825(state.money) + deltas.money < 0) return toast1825("Not enough money.");
    r.bond = clamp1825(num1825(r.bond, 50) + spec.bond + ((state.sandbox && state.sandbox.easyRelationships) ? 4 : 0));
    r.trust = clamp1825(num1825(r.trust, 50) + spec.trust);
    applyDeltas1825(deltas);
    incCount1825("actionCounts", countKey);
    delete state.actionsTaken[countKey];
    log1825(spec.label + " with " + r.name + " (" + getCount1825("actionCounts", countKey) + "/" + spec.max + " this year).", deltas);
    saveRender1825();
  };
  try { relationAction = window.relationAction; } catch(e) {}

  function makeCrush1825(method) {
    try { if (typeof generateCrush === "function") return generateCrush(state, method); } catch(e) {}
    var first = ["Jordan","Taylor","Casey","Morgan","Riley","Avery","Cameron","Drew"][rand1825(0,7)];
    var last = ["Parker","Reed","Brooks","Hayes","Bennett","Carter"][rand1825(0,5)];
    return { name:first + " " + last, role:"Crush", vibe:method, bond:rand1825(25,45), trust:rand1825(30,50), looks:rand1825(30,90), smarts:rand1825(30,90), alive:true, age:num1825(state.age) + rand1825(-3,4) };
  }
  var prevFindDate1825 = window.findDate || (typeof findDate === "function" ? findDate : null);
  window.findDate = function (method) {
    ensure1825();
    if (num1825(state.age) < 16) return toast1825("Dating unlocks at 16.");
    if (state.relationships.partner || state.married) return toast1825("You're not single.");
    if (method === "bar" && num1825(state.age) < 21) return toast1825("Bars are 21+.");
    var key = "findDate_" + method;
    var max = method === "bar" ? 2 : 3;
    if (getCount1825("findDateCounts", key) >= max) return toast1825("You've pushed that dating lane enough this year.");
    if (!spendSocialEnergy1825()) return;
    var vibe = method === "app" ? "Match from app" : method === "bar" ? "Met out socially" : "Set up by a friend";
    var crush = makeCrush1825(vibe);
    state.relationships["crush_" + Date.now().toString(36) + "_" + Math.floor(Math.random()*999)] = crush;
    incCount1825("findDateCounts", key);
    delete state.actionsTaken.findDate;
    log1825("You met " + crush.name + ". " + vibe + " (" + getCount1825("findDateCounts", key) + "/" + max + " tries this year).", { confidence:1, happiness:1 });
    saveRender1825();
  };
  try { findDate = window.findDate; } catch(e) {}

  var prevDateAction1825 = window.dateAction || (typeof dateAction === "function" ? dateAction : null);
  window.dateAction = function (key, action) {
    ensure1825();
    if (action === "ghost" || action === "official") return prevDateAction1825 ? prevDateAction1825.apply(this, arguments) : undefined;
    var crush = state.relationships && state.relationships[key];
    if (!crush || crush.role !== "Crush") return;
    var specs = {
      dinner:{ max:4, cost:60, bond:[5,12], trustDiv:2, deltas:{ happiness:4 }, label:"dinner date" },
      trip:{ max:2, cost:800, bond:[15,25], trustDiv:2, deltas:{ happiness:10, stress:-3 }, label:"weekend trip" }
    };
    var spec = specs[action];
    if (!spec) return prevDateAction1825 ? prevDateAction1825.apply(this, arguments) : undefined;
    var countKey = key + "_" + action;
    if (getCount1825("dateCounts", countKey) >= spec.max) return toast1825("That date type is maxed with " + crush.name + " this year.");
    if (!spendSocialEnergy1825()) return;
    if (num1825(state.money) < spec.cost) return toast1825("Not enough money.");
    var gain = rand1825(spec.bond[0], spec.bond[1]);
    state.money = Math.round(num1825(state.money) - spec.cost);
    crush.bond = clamp1825(num1825(crush.bond, 40) + gain);
    crush.trust = clamp1825(num1825(crush.trust, 40) + Math.floor(gain / spec.trustDiv));
    var deltas = Object.assign({}, spec.deltas, { money:-spec.cost });
    applyDeltas1825(spec.deltas);
    incCount1825("dateCounts", countKey);
    delete state.actionsTaken["date_" + key + "_" + action];
    log1825("Took " + crush.name + " on a " + spec.label + ". Bond +" + gain + " (" + getCount1825("dateCounts", countKey) + "/" + spec.max + " this year).", deltas);
    saveRender1825();
  };
  try { dateAction = window.dateAction; } catch(e) {}

  var childcarePlans1825 = {
    family:{ name:"Family Help", cost:2500, bond:2, trust:1, child:{ happiness:2 }, note:"Low cost, strong family bonds, less academic push." },
    standard:{ name:"Standard Childcare", cost:9000, bond:1, trust:1, child:{ smarts:1, happiness:1 }, note:"Reliable care and normal development support." },
    private:{ name:"Private Enrichment", cost:18000, bond:1, trust:2, child:{ smarts:3, confidence:2, stress:1 }, note:"Expensive enrichment with stronger school readiness." },
    nanny:{ name:"Nanny + Activities", cost:32000, bond:3, trust:2, child:{ smarts:2, confidence:3, happiness:2 }, note:"High-touch support with major lifestyle cost." }
  };
  function children1825() {
    ensure1825();
    return Object.entries(state.relationships || {}).filter(function (pair) { return pair[1] && pair[1].role === "Child" && pair[1].alive !== false; });
  }
  function ensureChildrenProfiles1825() {
    if (!window.state || !state.relationships) return;
    Object.keys(state.relationships).forEach(function (k) {
      var r = state.relationships[k];
      if (!r || r.role !== "Child") return;
      r.developmentV1825 = r.developmentV1825 || {
        smarts: Math.round((num1825(state.stats && state.stats.smarts, 50) + rand1825(35, 75)) / 2),
        confidence: Math.round((num1825(state.stats && state.stats.confidence, 50) + rand1825(35, 75)) / 2),
        health: Math.round((num1825(state.stats && state.stats.health, 70) + rand1825(45, 85)) / 2),
        happiness: Math.round((num1825(r.bond, 70) + num1825(r.trust, 60)) / 2)
      };
    });
  }
  function charge1825(amount, label) {
    ensure1825();
    amount = Math.max(0, Math.round(num1825(amount)));
    if (!amount) return { paid:0, debt:0 };
    var paid = Math.min(Math.max(0, num1825(state.money)), amount);
    state.money = Math.round(num1825(state.money) - paid);
    var debt = amount - paid;
    if (debt > 0) {
      state.debt = Math.max(0, Math.round(num1825(state.debt) + debt));
      if (state.finance) state.finance.familyDebtV1825 = Math.max(0, Math.round(num1825(state.finance.familyDebtV1825) + debt));
    }
    if (label) log1825(label + " cost " + money1825(amount) + (debt ? "; " + money1825(debt) + " became debt." : "."), { money:-paid, debt:debt });
    return { paid:paid, debt:debt };
  }
  window.setChildcarePlanV1825 = function (plan) {
    ensure1825();
    if (!childcarePlans1825[plan]) plan = "family";
    state.familyV1825.childcarePlan = plan;
    log1825("Childcare plan set to " + childcarePlans1825[plan].name + ".");
    saveRender1825();
  };
  window.childActivityV1825 = function (childKey, activity) {
    ensure1825();
    var child = state.relationships && state.relationships[childKey];
    if (!child || child.role !== "Child") return;
    var specs = {
      read:{ label:"Read together", cost:30, bond:4, trust:2, child:{ smarts:2, happiness:1 }, deltas:{ happiness:2, stress:-1 } },
      sports:{ label:"Sports practice", cost:120, bond:3, trust:1, child:{ health:3, confidence:2 }, deltas:{ health:1, happiness:2 } },
      tutor:{ label:"Tutor", cost:500, bond:1, trust:2, child:{ smarts:5, confidence:1, stress:1 }, deltas:{ discipline:1, stress:1 } },
      familyDay:{ label:"Family day", cost:180, bond:7, trust:3, child:{ happiness:4, confidence:1 }, deltas:{ happiness:5, stress:-3 } }
    };
    var spec = specs[activity];
    if (!spec) return;
    var key = childKey + "_" + activity;
    if (getCount1825("childActivityCounts", key) >= 3) return toast1825(spec.label + " is maxed for " + child.name + " this year.");
    if (!spendSocialEnergy1825()) return;
    if (num1825(state.money) < spec.cost) return toast1825("Not enough money.");
    state.money = Math.round(num1825(state.money) - spec.cost);
    child.bond = clamp1825(num1825(child.bond, 70) + spec.bond);
    child.trust = clamp1825(num1825(child.trust, 60) + spec.trust);
    child.developmentV1825 = child.developmentV1825 || {};
    Object.keys(spec.child || {}).forEach(function (k) { child.developmentV1825[k] = clamp1825(num1825(child.developmentV1825[k], 50) + spec.child[k]); });
    applyDeltas1825(spec.deltas || {});
    incCount1825("childActivityCounts", key);
    var deltas = Object.assign({}, spec.deltas || {}, { money:-spec.cost });
    log1825(spec.label + " with " + child.name + " (" + getCount1825("childActivityCounts", key) + "/3 this year).", deltas);
    saveRender1825();
  };
  function applyChildcareYear1825() {
    ensure1825();
    var kids = children1825();
    if (!kids.length) return;
    var age = Math.round(num1825(state.age));
    if (state.familyV1825.lastChildcareAge === age) return;
    state.familyV1825.lastChildcareAge = age;
    var plan = childcarePlans1825[state.familyV1825.childcarePlan] || childcarePlans1825.family;
    var total = plan.cost * kids.length;
    state.familyV1825.lastChildcareCost = total;
    if (total) charge1825(total, plan.name + " for " + kids.length + " child" + (kids.length === 1 ? "" : "ren"));
    kids.forEach(function (pair) {
      var r = pair[1];
      r.bond = clamp1825(num1825(r.bond, 70) + plan.bond + rand1825(-1, 2));
      r.trust = clamp1825(num1825(r.trust, 60) + plan.trust + rand1825(-1, 2));
      r.developmentV1825 = r.developmentV1825 || {};
      Object.keys(plan.child || {}).forEach(function (k) { r.developmentV1825[k] = clamp1825(num1825(r.developmentV1825[k], 50) + plan.child[k] + rand1825(0, 1)); });
      r.developmentV1825.happiness = clamp1825(num1825(r.developmentV1825.happiness, 60) + Math.round((num1825(r.bond) - 55) / 18));
    });
    log1825("Family year: " + plan.name + " shaped your children's development.", { stress:kids.length > 2 ? 2 : 0 });
  }

  function degreeMajors1825() {
    try { if (Array.isArray(collegeMajors)) return collegeMajors; } catch(e) {}
    return [
      { id:"business", name:"Business", desc:"Management and money.", jobs:["Marketing Associate","Office Manager"] },
      { id:"cs", name:"Computer Science", desc:"Software and systems.", jobs:["Software Developer"] },
      { id:"nursing", name:"Nursing", desc:"Healthcare.", jobs:["Nurse"] },
      { id:"criminaljustice", name:"Criminal Justice", desc:"Courts and investigation.", jobs:["Paralegal"] }
    ];
  }
  function degreeSchools1825() {
    try { if (Array.isArray(collegeSchools)) return collegeSchools; } catch(e) {}
    return [{ id:"state", name:"State School", tier:"State University", cost:14000, quality:.85 }];
  }
  function seedExistingDegree1825() {
    if (!window.state || !state.educationV1825) return;
    var degrees = state.educationV1825.degrees;
    if (!Array.isArray(degrees)) degrees = state.educationV1825.degrees = [];
    if ((state.flags && state.flags.hasDegree) || state.education === "College") {
      var majorId = state.major || "general";
      if (!degrees.some(function (d) { return d.majorId === majorId; })) {
        var major = degreeMajors1825().find(function (m) { return m.id === majorId; });
        degrees.push({ majorId:majorId, majorName:(major && major.name) || cap1825(majorId), schoolId:state.college || "completed", schoolName:"Completed College", level:"Bachelor's", completedAge:num1825(state.age), seeded:true });
      }
    }
  }
  function hasDegreeMajor1825(majorId) {
    ensure1825();
    return (state.educationV1825.degrees || []).some(function (d) { return d.majorId === majorId; }) || state.major === majorId;
  }
  function bestSchool1825(schoolId) {
    var schools = degreeSchools1825();
    return schools.find(function (s) { return s.id === schoolId; }) || schools.find(function (s) { return s.id === "state"; }) || schools[0];
  }
  function bestMajor1825(majorId) {
    var majors = degreeMajors1825();
    return majors.find(function (m) { return m.id === majorId; }) || majors[0];
  }
  window.startDegreeV1825 = function (majorId, schoolId) {
    ensure1825();
    if (num1825(state.age) < 18 && !(state.flags && state.flags.earlyCollege)) return toast1825("Additional degrees unlock at 18 or early college.");
    if (state.educationV1825.activeDegree) return toast1825("Finish or pause the active degree first.");
    var major = bestMajor1825(majorId);
    var school = bestSchool1825(schoolId || state.college || "state");
    if (!major || !school) return toast1825("Degree option unavailable.");
    if (hasDegreeMajor1825(major.id)) return toast1825("You already have this degree path.");
    var cost = Math.round(num1825(school.cost, 14000));
    state.educationV1825.activeDegree = { majorId:major.id, majorName:major.name, schoolId:school.id, schoolName:school.name, annualCost:cost, yearsCompleted:0, targetYears:4, startedAge:num1825(state.age), quality:num1825(school.quality, .85) };
    charge1825(cost, "First year of " + major.name + " at " + school.name);
    applyDeltas1825({ smarts:2, stress:2, discipline:1 });
    log1825("Started a " + major.name + " degree at " + school.name + ".");
    saveRender1825();
  };
  window.pauseDegreeV1825 = function () {
    ensure1825();
    if (!state.educationV1825.activeDegree) return toast1825("No active degree to pause.");
    state.educationV1825.pausedDegree = state.educationV1825.activeDegree;
    state.educationV1825.activeDegree = null;
    log1825("Paused the active degree path. You can restart a degree later.");
    saveRender1825();
  };
  function applyDegreeYear1825() {
    ensure1825();
    var active = state.educationV1825.activeDegree;
    if (!active) return;
    var age = Math.round(num1825(state.age));
    if (state.educationV1825.lastDegreeProgressAge === age) return;
    state.educationV1825.lastDegreeProgressAge = age;
    charge1825(num1825(active.annualCost), active.majorName + " degree tuition");
    var iq = num1825(state.iq || (state.stats && state.stats.iq), 100);
    var gpa = 2.6;
    try { if (typeof calcGPA === "function") gpa = calcGPA(); } catch(e) {}
    var progress = iq >= 170 && gpa >= 3.2 ? 2 : iq >= 140 && gpa >= 3.0 ? 1.5 : 1;
    active.yearsCompleted = Math.min(active.targetYears, num1825(active.yearsCompleted) + progress);
    applyDeltas1825({ smarts:2, discipline:1, stress:2 });
    if (active.yearsCompleted >= active.targetYears) {
      state.educationV1825.degrees.push({ majorId:active.majorId, majorName:active.majorName, schoolId:active.schoolId, schoolName:active.schoolName, level:"Bachelor's", completedAge:age, quality:active.quality });
      state.flags.hasDegree = true;
      state.flags["degree_" + active.majorId] = true;
      state.major = active.majorId;
      state.education = "College";
      state.educationV1825.activeDegree = null;
      log1825("Completed a " + active.majorName + " degree. New career doors opened.", { smarts:5, confidence:6, stress:-3 });
      applyDeltas1825({ smarts:5, confidence:6, stress:-3 });
    } else {
      log1825("Degree progress: " + active.majorName + " is " + Math.round((active.yearsCompleted / active.targetYears) * 100) + "% complete.");
    }
  }
  function jobUnlockedByDegrees1825(job) {
    ensure1825();
    if (!job) return false;
    if (typeof job.req === "function") {
      try { if (job.req(state)) return true; } catch(e) {}
    }
    var degrees = (state.educationV1825 && state.educationV1825.degrees) || [];
    for (var i = 0; i < degrees.length; i++) {
      var oldMajor = state.major;
      try {
        state.major = degrees[i].majorId;
        if (typeof job.req === "function" && job.req(state)) return true;
      } catch(e) {}
      finally { state.major = oldMajor; }
    }
    return false;
  }
  var prevTakeCareer1825 = window.takeCareer || (typeof takeCareer === "function" ? takeCareer : null);
  window.takeCareer = function (jobId) {
    ensure1825();
    var job = null;
    try { job = (careerCatalog || []).find(function (j) { return j.id === jobId; }); } catch(e) {}
    if (job && num1825(state.age) >= num1825(job.minAge) && jobUnlockedByDegrees1825(job)) {
      state.job = { jobId:job.id, title:job.title, salary:job.salary, performance:50, stress:0, tier:0 };
      applyDeltas1825({ happiness:4, stress:3, confidence:1 });
      log1825("You started working as a " + job.title + " using your education background.", { happiness:4, stress:3, confidence:1 });
      saveRender1825();
      return;
    }
    return prevTakeCareer1825 ? prevTakeCareer1825.apply(this, arguments) : undefined;
  };
  try { takeCareer = window.takeCareer; } catch(e) {}

  function fundPolicy1825() {
    ensure1825();
    var p = state.finance.fundPayoutPolicyV1825 || "balanced";
    var map = { growth:{ label:"Growth", dividend:.08, carry:.035 }, balanced:{ label:"Balanced", dividend:.15, carry:.05 }, income:{ label:"Income", dividend:.25, carry:.065 } };
    return map[p] || map.balanced;
  }
  window.setFundPayoutPolicyV1825 = function (policy) {
    ensure1825();
    if (!["growth","balanced","income"].includes(policy)) policy = "balanced";
    state.finance.fundPayoutPolicyV1825 = policy;
    log1825("Fund payout policy set to " + fundPolicy1825().label + ".");
    saveRender1825();
  };
  window.applyFundInvestorShareV1825 = function (manual) {
    ensure1825();
    var fund = state.finance.fundTrackV189;
    if (!fund || !fund.active) {
      if (manual) toast1825("Launch a client fund first.");
      return;
    }
    var yearKey = String(fund.years || state.age || 0);
    if (fund.lastInvestorShareYearV1825 === yearKey && !manual) return;
    if (fund.lastInvestorShareYearV1825 === yearKey && manual) return toast1825("Investor share already processed for this fund year.");
    var positive = Math.max(0, Math.round(num1825(fund.lastReturn)));
    var policy = fundPolicy1825();
    var dividend = Math.min(Math.max(0, num1825(fund.outsideCapital)), Math.round(positive * policy.dividend));
    var carry = positive > 0 ? Math.round(positive * policy.carry + Math.max(0, num1825(fund.outsideCapital)) * .002) : 0;
    if (dividend > 0) fund.outsideCapital = Math.max(0, Math.round(num1825(fund.outsideCapital) - dividend));
    if (carry > 0) state.money = Math.round(num1825(state.money) + carry);
    fund.lastInvestorDividendV1825 = dividend;
    fund.lastCarryV1825 = carry;
    fund.lastInvestorShareYearV1825 = yearKey;
    state.finance.lastFundCarryV1825 = carry;
    state.finance.incomeSources.fundCarryV1825 = carry;
    state.finance.fundInvestorLedgerV1825.push({ age:num1825(state.age), fundYear:num1825(fund.years), policy:policy.label, positiveReturn:positive, investorDividend:dividend, carry:carry, outsideCapital:num1825(fund.outsideCapital) });
    state.finance.fundInvestorLedgerV1825 = state.finance.fundInvestorLedgerV1825.slice(-12);
    if (dividend || carry || manual) log1825("Fund investor economics: " + money1825(dividend) + " paid to investors, " + money1825(carry) + " carry to checking.", { money:carry });
    if (manual) saveRender1825();
  };

  var prevAgeUp1825 = window.ageUp || (typeof ageUp === "function" ? ageUp : null);
  if (prevAgeUp1825 && !window.__ledgerAgeUp1825Wrapped) {
    window.__ledgerAgeUp1825Wrapped = true;
    window.ageUp = function () {
      var beforeAge = state && state.age;
      var out = prevAgeUp1825.apply(this, arguments);
      try {
        if (state && state.age !== beforeAge && state.alive !== false) {
          applyChildcareYear1825();
          applyDegreeYear1825();
          window.applyFundInvestorShareV1825(false);
          saveRender1825();
        }
      } catch(e) { try { console.warn("v18.25 annual systems failed", e); } catch(ignore) {} }
      return out;
    };
    try { ageUp = window.ageUp; } catch(e) {}
  }

  function relationUsageText1825() {
    var left = socialEnergyLeft1825();
    var total = Math.round(num1825(state.peopleV1825.yearlySocialEnergy, 12));
    return left + " / " + total + " actions left";
  }
  function peopleRhythmPanel1825() {
    ensure1825();
    var used = socialEnergyUsed1825();
    var total = Math.round(num1825(state.peopleV1825.yearlySocialEnergy, 12));
    var pct = total ? Math.min(100, Math.round((used / total) * 100)) : 0;
    return '<section class="panel v1825-people-rhythm"><div class="section-label">People Rhythm</div><div class="v1825-hero-line"><div><b>Relationships are no longer one-click-per-year.</b><span>Small actions can repeat several times until social energy runs out. Money asks and major commitments still stay limited.</span></div><strong>' + esc1825(relationUsageText1825()) + '</strong></div><div class="v1825-meter"><i style="width:' + pct + '%"></i></div><div class="v1825-pill-row"><span>Talk 6x/person</span><span>Gift 3x/person</span><span>Dates repeat</span><span>Child activities 3x/type</span></div></section>';
  }
  function familyCommandPanel1825() {
    ensure1825();
    var kids = children1825();
    if (!kids.length) return '';
    var planId = state.familyV1825.childcarePlan || "family";
    var plan = childcarePlans1825[planId] || childcarePlans1825.family;
    var planButtons = Object.keys(childcarePlans1825).map(function (id) {
      var p = childcarePlans1825[id];
      return '<button class="money-btn ' + (id === planId ? 'green' : '') + '" onclick="setChildcarePlanV1825(\'' + esc1825(id) + '\')">' + esc1825(p.name) + ' · ' + money1825(p.cost) + '/kid</button>';
    }).join('');
    var childRows = kids.map(function (pair) {
      var k = pair[0], child = pair[1], d = child.developmentV1825 || {};
      return '<div class="v1825-child-card"><div class="v1825-child-top"><div><b>' + esc1825(child.name) + '</b><span>Age ' + esc1825(child.age == null ? 0 : child.age) + ' · Bond ' + Math.round(num1825(child.bond)) + ' · Trust ' + Math.round(num1825(child.trust)) + '</span></div><strong>' + Math.round(num1825(d.happiness, 60)) + ' mood</strong></div><div class="v1825-pill-row"><span>Smarts ' + Math.round(num1825(d.smarts, 50)) + '</span><span>Confidence ' + Math.round(num1825(d.confidence, 50)) + '</span><span>Health ' + Math.round(num1825(d.health, 60)) + '</span></div><div class="v1825-button-grid"><button onclick="childActivityV1825(\'' + esc1825(k) + '\',\'read\')">Read</button><button onclick="childActivityV1825(\'' + esc1825(k) + '\',\'sports\')">Sports</button><button onclick="childActivityV1825(\'' + esc1825(k) + '\',\'tutor\')">Tutor</button><button onclick="childActivityV1825(\'' + esc1825(k) + '\',\'familyDay\')">Family Day</button></div></div>';
    }).join('');
    return '<section class="panel v1825-family-command"><div class="section-label">Family Command</div><div class="v1825-hero-line"><div><b>' + kids.length + ' child' + (kids.length === 1 ? '' : 'ren') + ' at home</b><span>' + esc1825(plan.note) + '</span></div><strong>' + esc1825(plan.name) + '</strong></div><div class="v1825-action-row">' + planButtons + '</div><div class="v1825-child-grid">' + childRows + '</div></section>';
  }
  function degreeDesk1825() {
    ensure1825();
    var degrees = state.educationV1825.degrees || [];
    var active = state.educationV1825.activeDegree;
    var school = bestSchool1825(state.college || "state");
    var activeHtml = active ? '<div class="v1825-degree-active"><b>' + esc1825(active.majorName) + '</b><span>' + esc1825(active.schoolName) + ' · ' + Math.round((num1825(active.yearsCompleted) / num1825(active.targetYears, 4)) * 100) + '% complete · ' + money1825(active.annualCost) + '/yr</span><button class="money-btn" onclick="pauseDegreeV1825()">Pause</button></div>' : '<div class="row-sub">No active additional degree. Start one to unlock more career requirements without replacing the whole education system.</div>';
    var degreeChips = degrees.length ? degrees.map(function (d) { return '<span>' + esc1825(d.majorName) + ' · age ' + esc1825(d.completedAge || '?') + '</span>'; }).join('') : '<span>No completed degree recorded yet</span>';
    var cards = degreeMajors1825().slice(0, 10).map(function (m) {
      var owned = hasDegreeMajor1825(m.id);
      return '<div class="v1825-degree-card ' + (owned ? 'owned' : '') + '"><b>' + esc1825(m.name) + '</b><p>' + esc1825(m.desc || 'Degree path.') + '</p><div class="v1825-pill-row"><span>' + money1825(school && school.cost || 14000) + '/yr</span><span>' + esc1825((m.jobs || []).slice(0,2).join(' / ') || 'Career unlocks') + '</span></div><button class="money-btn green" onclick="startDegreeV1825(\'' + esc1825(m.id) + '\',\'' + esc1825(school && school.id || 'state') + '\')" ' + (owned || !!active ? 'disabled' : '') + '>' + (owned ? 'Completed' : active ? 'Busy' : 'Start') + '</button></div>';
    }).join('');
    return '<section class="panel v1825-degree-desk"><div class="section-label">Multiple Degrees</div>' + activeHtml + '<div class="v1825-pill-row degree-list">' + degreeChips + '</div><div class="v1825-degree-grid">' + cards + '</div></section>';
  }
  function fundEconomicsPanel1825() {
    ensure1825();
    var fund = state.finance.fundTrackV189 || {};
    var policy = fundPolicy1825();
    if (!fund.active && !fund.outsideCapital) {
      return '<section class="money-section v1825-fund-econ"><div class="money-section-title">Fund Investor Economics <span>locked</span></div><div class="row-sub">Launch the fund track first. Once active, this desk separates investor dividends from your carry and management/performance fees.</div></section>';
    }
    var ledger = state.finance.fundInvestorLedgerV1825 || [];
    var rows = ledger.slice(-4).reverse().map(function (x) {
      return '<div class="v1825-ledger-row"><span>Age ' + esc1825(x.age) + ' · ' + esc1825(x.policy) + '</span><b>Investor ' + money1825(x.investorDividend) + '</b><strong>Carry ' + money1825(x.carry) + '</strong></div>';
    }).join('') || '<div class="row-sub">No investor distribution has been processed yet.</div>';
    return '<section class="money-section v1825-fund-econ"><div class="money-section-title">Fund Investor Economics <span>' + esc1825(policy.label) + '</span></div><div class="v1825-fund-grid"><div><span>Outside capital</span><b>' + money1825(fund.outsideCapital || 0) + '</b></div><div><span>Last return</span><b class="' + (num1825(fund.lastReturn) >= 0 ? 'good' : 'bad') + '">' + signedMoney1825(fund.lastReturn || 0) + '</b></div><div><span>Investor dividend</span><b>' + money1825(fund.lastInvestorDividendV1825 || 0) + '</b></div><div><span>Your carry</span><b class="good">' + money1825(fund.lastCarryV1825 || 0) + '</b></div></div><div class="v1825-action-row"><button class="money-btn ' + (state.finance.fundPayoutPolicyV1825 === 'growth' ? 'green' : '') + '" onclick="setFundPayoutPolicyV1825(\'growth\')">Growth</button><button class="money-btn ' + ((!state.finance.fundPayoutPolicyV1825 || state.finance.fundPayoutPolicyV1825 === 'balanced') ? 'green' : '') + '" onclick="setFundPayoutPolicyV1825(\'balanced\')">Balanced</button><button class="money-btn ' + (state.finance.fundPayoutPolicyV1825 === 'income' ? 'green' : '') + '" onclick="setFundPayoutPolicyV1825(\'income\')">Income</button><button class="money-btn gold" onclick="applyFundInvestorShareV1825(true)" ' + (!fund.active ? 'disabled' : '') + '>Run Distribution</button></div><div class="v1825-ledger-mini">' + rows + '</div></section>';
  }
  function careerDegreePanel1825() {
    ensure1825();
    var jobs = [];
    try { jobs = Array.isArray(careerCatalog) ? careerCatalog : []; } catch(e) {}
    if (!jobs.length) return '';
    var degrees = (state.educationV1825.degrees || []).map(function (d) { return d.majorName; }).join(', ') || 'No completed degrees';
    var unlocked = jobs.filter(jobUnlockedByDegrees1825).slice(0, 10);
    return '<section class="panel v1825-career-degree"><div class="section-label">Career Unlocks From Degrees</div><div class="row-sub">Degrees on file: ' + esc1825(degrees) + '</div><div class="v1825-pill-row">' + (unlocked.length ? unlocked.map(function (j) { return '<span>' + esc1825(j.title) + ' · ' + money1825(j.salary) + '</span>'; }).join('') : '<span>No degree-based job unlocks yet</span>') + '</div></section>';
  }
  function cleanPeopleHtml1825(html) {
    html = String(html || "");
    // Old buttons disabled after one use. v18.25 action functions enforce repeat limits, so remove stale one-use locks.
    html = html.replace(/(<button[^>]+onclick="relationAction\('[^']+','(?:talk|gift|bigGift|apologize|argue|allowance|punish)'\)"[^>]*?)\sdisabled(="")?/g, "$1");
    html = html.replace(/(<button[^>]+onclick="dateAction\('[^']+','(?:dinner|trip)'\)"[^>]*?)\sdisabled(="")?/g, "$1");
    html = html.replace(/(<button[^>]+onclick="findDate\('(?:app|bar|friends)'\)"[^>]*?)\sdisabled(="")?/g, "$1");
    return html;
  }
  function removeExisting1825(html) {
    html = String(html || "");
    ["v1825-people-rhythm","v1825-family-command","v1825-degree-desk","v1825-fund-econ","v1825-career-degree"].forEach(function (cls) {
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
  function afterFirstSection1825(html, insert) {
    html = String(html || "");
    var end = html.indexOf("</section>");
    return end >= 0 ? html.slice(0, end + 10) + insert + html.slice(end + 10) : insert + html;
  }
  var prevRenderHubContent1825 = window.renderHubContent || (typeof renderHubContent === "function" ? renderHubContent : null);
  if (prevRenderHubContent1825 && !window.__ledgerRenderHub1825Wrapped) {
    window.__ledgerRenderHub1825Wrapped = true;
    window.renderHubContent = function (hubId) {
      ensure1825();
      var html = "";
      try { html = prevRenderHubContent1825.apply(this, arguments) || ""; }
      catch(e) { html = '<section class="panel"><div class="section-label">Recovered hub</div><div class="row-sub">' + esc1825(e && (e.message || e)) + '</div></section>'; }
      html = removeExisting1825(html);
      if (hubId === "people") {
        html = cleanPeopleHtml1825(html);
        html = peopleRhythmPanel1825() + familyCommandPanel1825() + html;
      }
      if (hubId === "school" || hubId === "education") html = afterFirstSection1825(html, degreeDesk1825());
      if (hubId === "career") html = afterFirstSection1825(html, careerDegreePanel1825() + degreeDesk1825());
      if (hubId === "business" || hubId === "brokerage" || hubId === "finance" || hubId === "money") html = afterFirstSection1825(html, fundEconomicsPanel1825());
      return html;
    };
    try { renderHubContent = window.renderHubContent; } catch(e) {}
  }
  var style = document.createElement("style");
  style.textContent = [
    ".v1825-people-rhythm,.v1825-family-command,.v1825-degree-desk,.v1825-career-degree{border-color:rgba(126,160,172,.40)!important;background:linear-gradient(135deg,rgba(21,36,40,.96),rgba(34,29,22,.96))!important}.v1825-family-command{border-color:rgba(185,220,138,.38)!important}.v1825-degree-desk{border-color:rgba(201,155,85,.42)!important}.v1825-fund-econ{border-color:rgba(240,202,123,.44)!important;background:linear-gradient(135deg,rgba(48,38,22,.98),rgba(24,42,45,.95))!important}",
    ".v1825-hero-line{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:start}.v1825-hero-line b{display:block;color:#fff3df;font-size:15px}.v1825-hero-line span{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.45;margin-top:3px}.v1825-hero-line strong{font-family:'JetBrains Mono',monospace;color:#f0ca7b;font-size:12px;white-space:nowrap}.v1825-meter{height:7px;background:rgba(0,0,0,.26);border-radius:999px;overflow:hidden;margin-top:10px}.v1825-meter i{display:block;height:100%;background:linear-gradient(90deg,#b9dc8a,#f0ca7b,#e9927d);border-radius:inherit}",
    ".v1825-pill-row{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}.v1825-pill-row span{border:1px solid rgba(255,255,255,.10);border-radius:999px;padding:5px 8px;color:#d6c5aa;font-family:'JetBrains Mono',monospace;font-size:9px;line-height:1.2;background:rgba(255,255,255,.045)}.v1825-action-row{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}.v1825-action-row .money-btn{white-space:normal!important;min-width:95px}",
    ".v1825-child-grid,.v1825-degree-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:9px;margin-top:10px}.v1825-child-card,.v1825-degree-card,.v1825-degree-active{border:1px solid rgba(255,255,255,.10);border-radius:12px;background:rgba(255,255,255,.045);padding:11px;min-width:0}.v1825-child-top{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}.v1825-child-card b,.v1825-degree-card b,.v1825-degree-active b{display:block;color:#fff3df;font-size:14px}.v1825-child-card span,.v1825-degree-card p,.v1825-degree-active span{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.45;margin-top:3px}.v1825-child-card strong{font-family:'JetBrains Mono',monospace;color:#b9dc8a;font-size:12px}.v1825-button-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:9px}.v1825-button-grid button{border:1px solid rgba(216,173,109,.30);background:rgba(0,0,0,.18);color:#f6ead8;border-radius:8px;padding:8px;font-family:'JetBrains Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:.07em}",
    ".v1825-degree-card.owned{border-color:rgba(185,220,138,.40);background:rgba(65,91,48,.18)}.v1825-degree-card .money-btn,.v1825-degree-active .money-btn{margin-top:9px}.v1825-fund-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:8px}.v1825-fund-grid>div{border:1px solid rgba(255,255,255,.10);border-radius:11px;background:rgba(255,255,255,.045);padding:10px}.v1825-fund-grid span{display:block;font-family:'JetBrains Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:.12em;color:#b9a98e}.v1825-fund-grid b{display:block;font-family:'JetBrains Mono',monospace;font-size:17px;color:#fff3df;margin-top:5px;overflow-wrap:anywhere}.v1825-fund-grid b.good{color:#b9dc8a}.v1825-fund-grid b.bad{color:#e9927d}",
    ".v1825-ledger-mini{display:grid;gap:7px;margin-top:10px}.v1825-ledger-row{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px;border-top:1px solid rgba(255,255,255,.08);padding-top:8px}.v1825-ledger-row span{color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:9px}.v1825-ledger-row b,.v1825-ledger-row strong{font-family:'JetBrains Mono',monospace;font-size:10px;color:#f0ca7b}.v1825-ledger-row strong{color:#b9dc8a}",
    "@media(max-width:760px){.v1825-hero-line,.v1825-child-top{grid-template-columns:1fr}.v1825-fund-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.v1825-ledger-row{grid-template-columns:1fr}.v1825-hero-line strong{white-space:normal}.v1825-child-grid,.v1825-degree-grid{grid-template-columns:1fr}}@media(max-width:480px){.v1825-fund-grid{grid-template-columns:1fr}.v1825-button-grid{grid-template-columns:1fr}}"
  ].join("\n");
  document.head.appendChild(style);
})();

