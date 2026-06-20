/* ============================================================================
 * startup-founder.js  (v18.58 — Entrepreneurship: deep startup founder sim)
 * ----------------------------------------------------------------------------
 * Modeled on the Verdant entrepreneur deep-dive. The journey is the reward:
 *   - Found via a wizard: type → revenue model → name → co-founder (equity) →
 *     starting capital (bootstrap / angel / loan) → initial dev focus.
 *   - PRODUCT DEVELOPMENT takes years: concept → mvp → beta → live → v2. No real
 *     revenue until you ship ("live"); you burn cash for years getting there.
 *   - Funding: equity rounds (dilution), venture debt (repay+interest), an
 *     ownership loan you can later buy back, revenue-based financing, and grants.
 *   - Per-type employees with visible effects; a real cap table.
 *   - Company profit stays IN the company (runway), not your pocket — you get
 *     rich at EXIT (IPO / acquisition), or by graduating it into a real Business.
 *   - Failure is real: run out of runway with no funding left → bankrupt.
 *
 * Company cash (co.cash) is separate from your personal cash. Personal cash only
 * moves on: founding seed, taking a dividend, and exit payouts.
 *
 * Self-contained: state on state.finance.startupV1856, own "entrepreneurship"
 * hub, one guarded yearly tick, own bulletproof choice/wizard popup. Loads after
 * business-entities.js so it claims the entrepreneurship hub ids.
 * ========================================================================== */
(function () {
  "use strict";
  if (window.__ledgerStartupV1856Loaded) return;
  window.__ledgerStartupV1856Loaded = true;

  // ----------------------------------------------------------------- helpers --
  function S() { try { if (typeof state !== "undefined" && state) return state; } catch (e) {} return window.state || {}; }
  function age() { return Number(S().age) || 0; }
  function clampN(v, a, b) { v = Number(v); if (!Number.isFinite(v)) v = 0; return Math.max(a, Math.min(b, v)); }
  function round(v) { return Math.round(Number(v) || 0); }
  function rnd(a, b) { try { if (typeof window.rand === "function") return window.rand(a, b); } catch (e) {} return a + Math.floor(Math.random() * (b - a + 1)); }
  function chance(p) { try { if (typeof window.chance === "function") return window.chance(p); } catch (e) {} return Math.random() < p; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }
  function fin() { var s = S(); if (!s.finance || typeof s.finance !== "object") s.finance = {}; return s.finance; }
  function moneyText(v) { try { if (typeof window.fmtMoney === "function") return window.fmtMoney(round(v)); if (typeof window.money === "function") return window.money(round(v)); } catch (e) {} return "$" + round(v).toLocaleString(); }
  function compact(v) {
    v = round(v); var a = Math.abs(v), sgn = v < 0 ? "-" : "";
    if (a >= 1e12) return sgn + "$" + (a / 1e12).toFixed(a >= 1e13 ? 1 : 2).replace(/\.0+$/, "") + "T";
    if (a >= 1e9) return sgn + "$" + (a / 1e9).toFixed(a >= 1e10 ? 1 : 2).replace(/\.0+$/, "") + "B";
    if (a >= 1e6) return sgn + "$" + (a / 1e6).toFixed(a >= 1e7 ? 1 : 2).replace(/\.0+$/, "") + "M";
    if (a >= 1e3) return sgn + "$" + (a / 1e3).toFixed(a >= 1e4 ? 1 : 2).replace(/\.0+$/, "") + "K";
    return moneyText(v);
  }
  function pct(v) { return (Math.round(v * 1000) / 10) + "%"; }
  function logLine(t, d) { try { if (typeof window.addLog === "function") window.addLog(t, d || {}); } catch (e) {} }
  function applyDeltas(d) { try { if (d && Object.keys(d).length && typeof window.applyDeltas === "function") window.applyDeltas(d); } catch (e) {} }
  function rerender() { try { if (typeof window.render === "function") window.render(); } catch (e) {} }
  function saveGame() { try { if (typeof window.save === "function") window.save(); } catch (e) {} }
  function toast(m) { try { if (typeof window.addToast === "function") window.addToast(m); } catch (e) {} return false; }
  function statVal(k) { try { var s = S(); if (s.stats && Number.isFinite(s.stats[k])) return s.stats[k]; } catch (e) {} return 50; }
  function gainCash(a) { applyDeltas({ money: round(a) }); }
  function spendCash(a) { applyDeltas({ money: -round(a) }); }
  function cash() { return Math.max(0, round(S().money)); }
  function actionsTaken() { var s = S(); if (!s.actionsTaken || typeof s.actionsTaken !== "object") s.actionsTaken = {}; return s.actionsTaken; }
  function usedYear(key) { return !!actionsTaken()[key]; }
  function markUsed(key) { actionsTaken()[key] = true; }

  // ---------------------------------------------------------------- catalogs --
  // revMultiple: valuation = annual revenue × this (× stage × growth). rpu = $/user/yr.
  // devDiff: dev-time multiplier (higher = longer to build). burn = base annual burn.
  var TYPES = {
    saas:      { name: "B2B SaaS",        icon: "💻", scaleStat: "smarts",     revMultiple: 12, margin: 0.80, rpu: 1400, burn: 220000, churn: 0.10, growth: 0.18, market: 80000000000,  risk: 0.9, devDiff: 1.0, roles: ["cto", "seng", "sales", "cs", "growth"],   blurb: "Recurring software. Fat margins, churn is the enemy, huge multiples." },
    ai:        { name: "AI / Deep-Tech",  icon: "🤖", scaleStat: "smarts",     revMultiple: 16, margin: 0.76, rpu: 2600, burn: 420000, churn: 0.07, growth: 0.22, market: 120000000000, risk: 1.3, devDiff: 1.7, roles: ["cto", "research", "seng", "sales", "cfo"], blurb: "Frontier tech. Long build, insane burn — the biggest exits live here." },
    fintech:   { name: "FinTech",         icon: "💳", scaleStat: "smarts",     revMultiple: 10, margin: 0.62, rpu: 380,  burn: 320000, churn: 0.06, growth: 0.16, market: 90000000000,  risk: 1.1, devDiff: 1.3, roles: ["cto", "seng", "compliance", "sales", "cfo"], blurb: "Money apps. Heavy regulation, sticky users, massive markets." },
    marketplace:{name: "Marketplace",     icon: "🏪", scaleStat: "vision",     revMultiple: 9,  margin: 0.70, rpu: 110,  burn: 260000, churn: 0.12, growth: 0.20, market: 70000000000,  risk: 1.0, devDiff: 1.1, roles: ["cto", "ops", "growth", "trust", "sales"],  blurb: "Two-sided platform. Network effects compound — once they ignite." },
    consumer:  { name: "Consumer App",    icon: "📱", scaleStat: "creativity", revMultiple: 8,  margin: 0.68, rpu: 22,   burn: 200000, churn: 0.22, growth: 0.28, market: 60000000000,  risk: 1.1, devDiff: 0.8, roles: ["cto", "design", "growth", "seng", "cs"],   blurb: "Viral or dead. Explosive growth, brutal churn, ad-driven." },
    ecom:      { name: "E-comm Brand",    icon: "🛒", scaleStat: "creativity", revMultiple: 4,  margin: 0.42, rpu: 160,  burn: 150000, churn: 0.25, growth: 0.15, market: 40000000000,  risk: 0.8, devDiff: 0.7, roles: ["ops", "growth", "design", "sales", "cs"],   blurb: "Direct-to-consumer products. Lower multiple, real revenue early." },
    biotech:   { name: "Biotech",         icon: "🧬", scaleStat: "smarts",     revMultiple: 14, margin: 0.84, rpu: 0,    burn: 600000, churn: 0.03, growth: 0.12, market: 100000000000,risk: 1.6, devDiff: 2.4, roles: ["research", "clinical", "regulatory", "cfo"], blurb: "Long, cash-hungry, binary. A breakthrough is worth a fortune." },
    hardtech:  { name: "Hardware",        icon: "🔩", scaleStat: "smarts",     revMultiple: 6,  margin: 0.33, rpu: 700,  burn: 380000, churn: 0.08, growth: 0.13, market: 50000000000,  risk: 1.2, devDiff: 1.9, roles: ["cto", "hardware", "ops", "sales", "cfo"],  blurb: "Physical products. Capital-intensive, slow, defensible." },
    gaming:    { name: "Gaming Studio",   icon: "🎮", scaleStat: "creativity", revMultiple: 7,  margin: 0.66, rpu: 40,   burn: 240000, churn: 0.30, growth: 0.24, market: 55000000000,  risk: 1.2, devDiff: 1.4, roles: ["director", "artist", "seng", "liveops", "growth"], blurb: "Hit-driven. One smash title changes everything." },
    creator:   { name: "Creator Tools",   icon: "🎨", scaleStat: "creativity", revMultiple: 9,  margin: 0.74, rpu: 180,  burn: 180000, churn: 0.15, growth: 0.18, market: 45000000000,  risk: 0.9, devDiff: 0.9, roles: ["cto", "design", "growth", "cs", "sales"],   blurb: "Software for creators. Passionate users, viral loops." },
    health:    { name: "HealthTech",      icon: "🩺", scaleStat: "smarts",     revMultiple: 10, margin: 0.60, rpu: 460,  burn: 360000, churn: 0.05, growth: 0.14, market: 95000000000,  risk: 1.2, devDiff: 1.5, roles: ["cto", "clinical", "regulatory", "sales", "cfo"], blurb: "Healthcare software. Regulated, sticky, enormous market." },
    climate:   { name: "ClimateTech",     icon: "🌱", scaleStat: "vision",     revMultiple: 8,  margin: 0.52, rpu: 900,  burn: 400000, churn: 0.06, growth: 0.13, market: 85000000000,  risk: 1.1, devDiff: 1.7, roles: ["cto", "hardware", "research", "sales", "cfo"], blurb: "Energy & sustainability. Grants help; long build, big mission." }
  };
  var TYPE_ORDER = ["saas", "ai", "fintech", "marketplace", "consumer", "ecom", "biotech", "hardtech", "gaming", "creator", "health", "climate"];

  // Revenue models (chosen at founding) — flavor + a small KPI tilt.
  var MODELS = {
    subscription: { name: "Subscription", icon: "🔄", churnMod: -0.02, blurb: "Predictable MRR. Churn is the whole game." },
    transaction:  { name: "Transactional", icon: "💱", growthMod: 0.03, blurb: "Take a cut of each transaction. Scales with volume." },
    ads:          { name: "Ad-Supported",  icon: "📺", rpuMod: 0.6, growthMod: 0.05, blurb: "Free to users, monetize attention. Needs scale." },
    enterprise:   { name: "Enterprise",    icon: "🏢", rpuMod: 2.5, growthMod: -0.03, blurb: "Big contracts, long cycles, sticky revenue." },
    marketplace_m:{ name: "Marketplace Fee", icon: "🤝", growthMod: 0.02, blurb: "Connect buyers & sellers, take a fee." }
  };

  // Employee roles. bucket = capability it raises. Each shows its effect + salary.
  var ROLES = {
    cto:        { title: "CTO",            icon: "🧑‍💻", bucket: "eng",     sal: 200000, effect: "+dev speed, +product quality" },
    seng:       { title: "Senior Engineer",icon: "👩‍💻", bucket: "eng",     sal: 150000, effect: "+dev speed, −tech debt" },
    research:   { title: "Lead Scientist", icon: "🔬", bucket: "research",sal: 220000, effect: "+dev speed (deep-tech)" },
    clinical:   { title: "Clinical Lead",  icon: "🩻", bucket: "research",sal: 210000, effect: "unlocks trials, +dev" },
    regulatory: { title: "Regulatory Head",icon: "📋", bucket: "ops",     sal: 180000, effect: "−risk, smooths launch" },
    compliance: { title: "Compliance Lead",icon: "⚖️", bucket: "ops",     sal: 180000, effect: "−risk (fintech)" },
    hardware:   { title: "Hardware Lead",  icon: "🔧", bucket: "eng",     sal: 190000, effect: "+dev speed (hardware)" },
    director:   { title: "Game Director",  icon: "🎬", bucket: "eng",     sal: 190000, effect: "+dev speed, +quality" },
    artist:     { title: "Art Director",   icon: "🖌️", bucket: "design",  sal: 140000, effect: "+quality, +retention" },
    design:     { title: "Head of Design", icon: "🎨", bucket: "design",  sal: 150000, effect: "+quality, −churn" },
    sales:      { title: "Head of Sales",  icon: "📞", bucket: "sales",   sal: 170000, effect: "+conversion, +revenue" },
    cs:         { title: "Customer Success",icon: "🎧", bucket: "cs",     sal: 110000, effect: "−churn, +NPS" },
    growth:     { title: "Growth Lead",    icon: "📈", bucket: "growth",  sal: 160000, effect: "+user growth" },
    ops:        { title: "COO",            icon: "⚙️", bucket: "ops",     sal: 190000, effect: "−burn, +scale" },
    trust:      { title: "Trust & Safety", icon: "🛡️", bucket: "ops",     sal: 150000, effect: "−risk (marketplace)" },
    liveops:    { title: "Live-Ops Lead",  icon: "🕹️", bucket: "growth",  sal: 150000, effect: "−churn, +revenue (gaming)" },
    cfo:        { title: "CFO",            icon: "💰", bucket: "finance", sal: 210000, effect: "better raises, −burn" }
  };

  // Funding rounds: gate (min annual revenue to qualify), raise range, dilution.
  var ROUNDS = [
    { id: "preseed", label: "Pre-Seed", icon: "🌱", gateRev: 0,        raise: [200000, 800000],     dilution: [0.08, 0.15], who: "Angels & FFF" },
    { id: "seed",    label: "Seed",     icon: "🌿", gateRev: 0,        raise: [1000000, 3500000],   dilution: [0.12, 0.22], who: "Seed funds" },
    { id: "seriesA", label: "Series A", icon: "🌳", gateRev: 1500000,  raise: [6000000, 18000000],  dilution: [0.18, 0.27], who: "VCs" },
    { id: "seriesB", label: "Series B", icon: "🏢", gateRev: 10000000, raise: [25000000, 70000000], dilution: [0.12, 0.20], who: "Growth VCs" },
    { id: "seriesC", label: "Series C+",icon: "🏦", gateRev: 50000000, raise: [90000000, 300000000],dilution: [0.08, 0.15], who: "Late-stage / PE" }
  ];
  function nextRound(co) { return ROUNDS[co.rounds.length] || null; }

  // Product/maturity stages.
  var PRODUCT_STAGES = ["concept", "mvp", "beta", "live", "v2"];
  var PS_LABEL = { concept: "Concept", mvp: "MVP", beta: "Beta", live: "Live", v2: "Scaling (v2)" };
  var DEV_THRESH = { mvp: 90, beta: 210, live: 340 }; // productDev points (× devDiff) to reach each
  var BIZ_STAGE_LABEL = { building: "Building", launched: "Launched", growth: "Growth", scale: "Scale", exited: "Exited", dead: "Failed" };
  var STAGE_MULT = { building: 0.20, launched: 0.55, growth: 1.15, scale: 1.5, exited: 1, dead: 0 };

  var NAME_A = ["Nova", "Quant", "Hyper", "Vertex", "Lumen", "Cobalt", "Aether", "Pulse", "Forge", "Nimbus", "Onyx", "Strata", "Vela", "Zenith", "Apex", "Cinder", "Echo", "Halcyon", "Orbit", "Flux"];
  var NAME_B = ["Labs", "AI", "Works", "Stack", "Logic", "Grid", "Loop", "Base", "Core", "Flow", "Wave", "Mind", "Byte", "Cloud", "Sync", "Forge", "Scale", "Path", "Sphere", "Engine"];
  function genNames(n) { var out = [], seen = {}; var guard = 0; while (out.length < (n || 4) && guard++ < 60) { var nm = pick(NAME_A) + pick(NAME_B); if (!seen[nm]) { seen[nm] = 1; out.push(nm); } } return out; }

  // --------------------------------------------------------------- state -----
  function ensure() {
    var f = fin();
    if (!f.startupV1856 || typeof f.startupV1856 !== "object" || Array.isArray(f.startupV1856)) {
      f.startupV1856 = { co: null, history: [], founderRep: 20, lifetimeExit: 0, fullTime: false, totalExits: 0 };
    }
    var sf = f.startupV1856;
    if (!Array.isArray(sf.history)) sf.history = [];
    if (!Number.isFinite(sf.founderRep)) sf.founderRep = 20;
    if (!Number.isFinite(sf.lifetimeExit)) sf.lifetimeExit = 0;
    if (!Number.isFinite(sf.totalExits)) sf.totalExits = 0;
    if (typeof sf.fullTime === "undefined") sf.fullTime = false;
    if (sf.co) normalizeCo(sf.co);
    return sf;
  }
  function normalizeCo(co) {
    co.team = co.team || { eng: 0, sales: 0, ops: 0, growth: 0, finance: 0, research: 0, design: 0, cs: 0 };
    ["eng", "sales", "ops", "growth", "finance", "research", "design", "cs"].forEach(function (k) { if (!Number.isFinite(co.team[k])) co.team[k] = 0; });
    co.devAlloc = co.devAlloc || { features: 50, bugfix: 20, ux: 20, custdev: 10 };
    if (!Array.isArray(co.rounds)) co.rounds = [];
    if (!Array.isArray(co.coFounders)) co.coFounders = [];
    if (!Array.isArray(co.debt)) co.debt = [];
    if (!Array.isArray(co.hires)) co.hires = [];
    if (!Array.isArray(co.hist)) co.hist = [];
    if (typeof co.rbf === "undefined") co.rbf = null;
    ["cash", "revenue", "users", "productDev", "productQuality", "techDebt", "valuation", "equity", "soldStake", "growth", "churn", "totalRaised", "momentum", "age"].forEach(function (k) { if (!Number.isFinite(co[k])) co[k] = 0; });
    if (!co.productStage) co.productStage = "concept";
    if (!co.stage) co.stage = "building";
  }
  function co() { return ensure().co; }
  function typeOf(c) { return TYPES[c && c.type] || TYPES.saas; }
  function modelOf(c) { return MODELS[c && c.model] || MODELS.subscription; }
  function isLive(c) { return c.productStage === "live" || c.productStage === "v2"; }

  // --------------------------------------------------------- derived metrics --
  function statBonus(c) { return clampN((statVal(typeOf(c).scaleStat) - 50) / 120, -0.4, 0.42); }
  function repBonus() { return clampN((ensure().founderRep - 20) / 170, 0, 0.38); }
  function engCapacity(c) { return c.team.eng + c.team.research * (typeOf(c).devDiff > 1.4 ? 1 : 0.5); }
  function teamSalaries(c) { var s = 0; (c.hires || []).forEach(function (h) { var r = ROLES[h]; if (r) s += r.sal; }); return s; }
  function annualBurn(c) {
    var base = typeOf(c).burn * STAGE_MULT[c.stage];
    var coFounderCost = (c.coFounders || []).length * 50000;
    return Math.round((base + teamSalaries(c) + coFounderCost) * (1 - c.team.ops * 0.04));
  }
  function debtPayment(c) { return (c.debt || []).reduce(function (s, d) { return s + (d.yearsLeft > 0 ? (d.annual || 0) : 0); }, 0); }
  function userCap(c) { var t = typeOf(c); return t.rpu > 0 ? Math.max(2000, Math.round((t.market / t.rpu) * 0.20)) : 200000; }
  function computeValuation(c) {
    if (c.stage === "dead") return 0;
    var t = typeOf(c);
    if (c.revenue > 0) {
      var growthBonus = 1 + clampN(c.growth, 0, 1.5) * 0.7;
      var v = c.revenue * t.revMultiple * STAGE_MULT[c.stage] * growthBonus;
      return Math.round(Math.min(v, t.market * 3));
    }
    return Math.round(c.totalRaised * 1.4 + c.productDev * 8000 + c.productQuality * 6000 + 40000);
  }
  function yourStakeValue(c) { return Math.round(c.valuation * (c.equity / 100)); }
  function runwayYears(c) {
    var net = annualBurn(c) + debtPayment(c) - Math.round(c.revenue * typeOf(c).margin);
    if (net <= 0) return Infinity;
    return c.cash / net;
  }
  function isFounder() { return !!ensure().fullTime; }

  // --------------------------------------------------- founding wizard (popup) --
  window.startFoundingV1856 = function () {
    if (co()) return toast("You're already running a startup.");
    if (age() < 16) return toast("Founding unlocks at 16.");
    wizardType();
  };
  function wizardType() {
    queuePopup({
      type: "neutral", icon: "🚀", title: "Found a Startup", body: "Choose your arena. This sets your market, margins, dev difficulty, and the team you'll need.",
      choices: TYPE_ORDER.map(function (id) {
        var t = TYPES[id];
        return { text: t.icon + " " + t.name, hint: "×" + t.revMultiple + " mult · " + Math.round(t.margin * 100) + "% margin · build " + (t.devDiff >= 1.6 ? "very long" : t.devDiff >= 1.2 ? "long" : "fast"), apply: function () { wizardModel(id); } };
      })
    });
  }
  function wizardModel(typeId) {
    var t = TYPES[typeId];
    queuePopup({
      type: "neutral", icon: t.icon, title: t.name + " — Revenue Model", body: "How will it make money?",
      choices: Object.keys(MODELS).map(function (m) {
        var mm = MODELS[m];
        return { text: mm.icon + " " + mm.name, hint: mm.blurb, apply: function () { wizardName(typeId, m); } };
      })
    });
  }
  function wizardName(typeId, model) {
    var names = genNames(4);
    var choices = names.map(function (nm) { return { text: '"' + nm + '"', apply: function () { wizardCoFounder(typeId, model, nm); } }; });
    queuePopup({ type: "neutral", icon: "✏️", title: "Name Your Company", body: "Pick a brand. You can rename it later.", choices: choices });
  }
  function wizardCoFounder(typeId, model, name) {
    queuePopup({
      type: "neutral", icon: "👥", title: "Co-Founder?", body: "Go solo for all the equity, or split it for a head start. Co-founders take equity but boost the company.",
      choices: [
        { text: "🚀 Solo — keep 100% equity", hint: "All the pressure, all the upside", apply: function () { wizardCapital(typeId, model, name, []); } },
        { text: "🤝 Technical co-founder (−30% equity)", hint: "Big head start on product/dev", apply: function () { wizardCapital(typeId, model, name, [{ name: pick(["Alex Chen", "Sam Rivera", "Jordan Lee", "Taylor Kim"]), equity: 30, role: "CTO", bucket: "eng" }]); } },
        { text: "💼 Business co-founder (−25% equity)", hint: "Strong on sales & ops", apply: function () { wizardCapital(typeId, model, name, [{ name: pick(["Morgan Blake", "Casey Hart", "Drew Ellis", "Avery Stone"]), equity: 25, role: "COO", bucket: "ops" }]); } }
      ]
    });
  }
  function wizardCapital(typeId, model, name, coFounders) {
    var t = TYPES[typeId];
    var boot = Math.min(cash(), 25000);
    queuePopup({
      type: "neutral", icon: "💰", title: "Starting Capital", body: "How do you fund year one? You'll burn cash for years before any revenue.",
      choices: [
        { text: "💵 Bootstrap — up to " + compact(boot) + " of your own", hint: "100% yours, tight runway", apply: function () { var amt = Math.min(cash(), 25000); if (amt > 0) spendCash(amt); wizardFocus(typeId, model, name, coFounders, 0, amt); } },
        { text: "👼 Angel — " + compact(60000) + " for 10% equity", hint: "Mentors + a runway cushion", apply: function () { wizardFocus(typeId, model, name, coFounders, 10, 60000); } },
        { text: "🏦 Small-business loan — " + compact(90000) + ", repaid over 5 yrs", hint: "Keep equity, owe the bank", apply: function () { wizardFocus(typeId, model, name, coFounders, 0, 90000, { principal: 90000 }); } }
      ]
    });
  }
  function wizardFocus(typeId, model, name, coFounders, extraDilution, startCash, loan) {
    queuePopup({
      type: "neutral", icon: "🎯", title: "Initial Focus", body: "What do you tackle first?",
      choices: [
        { text: "🏗️ Build product fast — ship the MVP", hint: "Heavy on features", apply: function () { doFound(typeId, model, name, coFounders, extraDilution, startCash, loan, { features: 65, bugfix: 10, ux: 15, custdev: 10 }); } },
        { text: "👥 Talk to customers first — validate", hint: "Heavy on customer dev", apply: function () { doFound(typeId, model, name, coFounders, extraDilution, startCash, loan, { features: 35, bugfix: 10, ux: 15, custdev: 40 }); } },
        { text: "✨ Polish & quality — build something loved", hint: "Heavy on UX/quality", apply: function () { doFound(typeId, model, name, coFounders, extraDilution, startCash, loan, { features: 40, bugfix: 25, ux: 30, custdev: 5 }); } }
      ]
    });
  }
  function doFound(typeId, model, name, coFounders, extraDilution, startCash, loan, devAlloc) {
    var sf = ensure();
    var t = TYPES[typeId];
    var coFounderEquity = (coFounders || []).reduce(function (s, c) { return s + c.equity; }, 0);
    var c = {
      type: typeId, model: model, name: name, stage: "building", productStage: "concept", age: 0,
      cash: round(startCash), revenue: 0, users: 0, productDev: rnd(0, 12), productQuality: rnd(15, 28), techDebt: rnd(0, 8),
      growth: 0, churn: t.churn, valuation: 0, equity: clampN(100 - coFounderEquity - extraDilution, 1, 100), soldStake: 0,
      coFounders: coFounders || [], rounds: [], totalRaised: 0, debt: [], rbf: null,
      team: { eng: coFounders.some(function (x) { return x.bucket === "eng"; }) ? 1 : 0, sales: 0, ops: coFounders.some(function (x) { return x.bucket === "ops"; }) ? 1 : 0, growth: 0, finance: 0, research: 0, design: 0, cs: 0 },
      hires: [], devAlloc: devAlloc, momentum: 0.4, hist: []
    };
    if (loan && loan.principal) c.debt.push({ principal: loan.principal, rate: 0.08, yearsLeft: 5, annual: Math.round(loan.principal * 1.08 / 5) });
    if (extraDilution > 0) sf.founderRep = sf.founderRep; // angel mentorship handled implicitly
    c.valuation = computeValuation(c);
    sf.co = c;
    try { if (typeof window.ensureActiveStartupBridgeV1860 === "function") window.ensureActiveStartupBridgeV1860(c); } catch (e) {}
    applyDeltas({ confidence: 3, stress: 4 });
    logLine("🚀 You founded " + name + ", a " + t.name + " startup. Now build it.", { money: startCash && !loan ? 0 : 0, confidence: 3, stress: 4 });
    toast("🚀 Founded " + name);
    saveGame(); rerender();
  }

  window.renameStartupV1856 = function (inputId) {
    var c = co(); if (!c) return;
    var el = document.getElementById(inputId);
    var v = el && el.value ? String(el.value).slice(0, 28).trim() : "";
    if (!v) return toast("Enter a name.");
    c.name = v; saveGame(); rerender();
  };
  window.shutdownStartupV1856 = function () {
    var sf = ensure(); if (!sf.co) return;
    var name = sf.co.name;
    try { if (typeof window.retireActiveStartupBridgeV1860 === "function") window.retireActiveStartupBridgeV1860(sf.co); } catch (e) {}
    sf.history.unshift({ name: name, type: sf.co.type, outcome: "shutdown", value: 0, age: age() });
    sf.co = null;
    applyDeltas({ stress: 2 });
    logLine("🪦 You shut down " + name + ".", { stress: 2 });
    saveGame(); rerender();
  };

  // --------------------------------------------------------------- actions ---
  function actKey(a) { return "startup_" + a; }
  function spendCo(c, amount) { c.cash = round(c.cash - amount); } // spends company cash

  window.setDevFocusV1856 = function (focus) {
    var c = co(); if (!c) return;
    var presets = {
      features: { features: 65, bugfix: 10, ux: 15, custdev: 10 },
      quality:  { features: 35, bugfix: 30, ux: 30, custdev: 5 },
      customers:{ features: 35, bugfix: 10, ux: 15, custdev: 40 },
      balanced: { features: 45, bugfix: 20, ux: 20, custdev: 15 }
    };
    if (presets[focus]) { c.devAlloc = presets[focus]; saveGame(); rerender(); }
  };

  // Push the build (once/year): a focused sprint that accelerates dev progress.
  window.buildSprintV1856 = function () {
    var c = co(); if (!c) return; if (isLive(c)) return toast("Already shipped — invest in R&D instead.");
    if (usedYear(actKey("build"))) return toast("Already sprinted this year.");
    markUsed(actKey("build"));
    var cost = Math.min(c.cash, Math.round(typeOf(c).burn * 0.1));
    if (cost > 0) spendCo(c, cost);
    var gain = Math.round(24 + engCapacity(c) * 10 + statBonus(c) * 16 + rnd(0, 8));
    c.productDev += gain;
    c.momentum = clampN(c.momentum + 0.15, 0, 1.4);
    applyDeltas({ stress: 2 });
    logLine("🛠️ " + c.name + ": build sprint — dev progress now " + round(c.productDev) + ".", { stress: 2 });
    saveGame(); rerender();
  };

  // After launch: R&D raises the quality ceiling (gates revenue/churn).
  window.investRDV1856 = function () {
    var c = co(); if (!c) return; if (!isLive(c)) return toast("Ship the product first.");
    if (usedYear(actKey("rd"))) return toast("Already invested in R&D this year.");
    var cost = Math.max(20000, Math.round((c.revenue || typeOf(c).burn) * 0.15));
    if (c.cash < cost) return toast("R&D needs " + compact(cost) + " of company cash.");
    markUsed(actKey("rd")); spendCo(c, cost);
    c.productQuality = clampN(c.productQuality + 6 + engCapacity(c) * 2, 0, 100);
    c.techDebt = clampN(c.techDebt - 8, 0, 100);
    c.churn = clampN(c.churn - 0.008, 0.02, 0.5);
    c.productDev += 30;
    if (c.productStage === "live" && c.productDev >= (DEV_THRESH.live + 200) * devFactor(c)) { c.productStage = "v2"; logLine("✨ " + c.name + " shipped v2 — a major leap.", {}); }
    logLine("🔬 " + c.name + ": R&D push — quality " + round(c.productQuality) + "/100.", { money: 0 });
    saveGame(); rerender();
  };

  window.growthPushV1856 = function () {
    var c = co(); if (!c) return; if (!isLive(c)) return toast("No users to grow until you launch.");
    if (usedYear(actKey("growth"))) return toast("Already ran a growth push this year.");
    var cost = Math.max(15000, Math.round((c.revenue || typeOf(c).burn) * 0.2));
    if (c.cash < cost) return toast("A growth push costs " + compact(cost) + " of company cash.");
    markUsed(actKey("growth")); spendCo(c, cost);
    var cap = userCap(c), headroom = clampN(1 - c.users / cap, 0.05, 1);
    var gained = Math.round(Math.max(200, c.users) * (0.35 + statBonus(c) + c.team.growth * 0.1 + c.productQuality / 300) * headroom) + rnd(50, 300);
    c.users = clampN(c.users + gained, 0, cap);
    c.momentum = clampN(c.momentum + 0.25, 0, 1.5);
    logLine("📣 " + c.name + ": growth push — users " + compact(c.users) + ".", {});
    saveGame(); rerender();
  };

  window.hireRoleV1856 = function (roleId) {
    var c = co(); if (!c) return;
    var r = ROLES[roleId]; if (!r) return;
    if ((c.hires || []).indexOf(roleId) >= 0) return toast("You already have a " + r.title + ".");
    var signing = Math.round(r.sal * 0.4);
    if (c.cash < signing) return toast("Hiring a " + r.title + " needs " + compact(signing) + " (company cash).");
    spendCo(c, signing);
    c.hires.push(roleId);
    c.team[r.bucket] = (c.team[r.bucket] || 0) + 1;
    c.momentum = clampN(c.momentum + 0.08, 0, 1.5);
    logLine("🧑‍💼 " + c.name + " hired a " + r.title + " (" + compact(signing) + " + " + compact(r.sal) + "/yr burn).", {});
    toast("🧑‍💼 Hired " + r.title);
    saveGame(); rerender();
  };

  // -------------------------------------------------------------- funding ----
  window.raiseEquityV1856 = function () {
    var c = co(); if (!c) return;
    var rd = nextRound(c);
    if (!rd) return toast("You've raised every round.");
    if (c.revenue < rd.gateRev) return toast(rd.label + " needs ~" + compact(rd.gateRev) + " revenue.");
    var amount = round(rd.raise[0] + Math.random() * (rd.raise[1] - rd.raise[0]) * (0.8 + repBonus() + clampN(c.growth, 0, 1) * 0.4));
    var dil = clampN(rd.dilution[0] + Math.random() * (rd.dilution[1] - rd.dilution[0]) - (c.team.finance ? 0.03 : 0) - repBonus() * 0.04, 0.05, 0.32);
    c.equity = clampN(c.equity * (1 - dil), 1, 100);
    c.cash += amount; c.totalRaised += amount;
    c.rounds.push({ id: rd.id, amount: amount, dilution: dil, age: age() });
    c.momentum = clampN(c.momentum + 0.2, 0, 1.6); c.valuation = computeValuation(c);
    applyDeltas({ confidence: 2 });
    logLine("💸 " + c.name + " raised a " + rd.label + ": " + compact(amount) + " for " + pct(dil) + " (you own " + Math.round(c.equity) + "%).", { confidence: 2 });
    toast("💸 " + rd.label + ": +" + compact(amount));
    saveGame(); rerender();
  };
  window.takeLoanV1856 = function () {
    var c = co(); if (!c) return;
    var max = Math.round((c.valuation || typeOf(c).burn * 2) * 0.15 + 50000);
    var amt = clampN(Math.round(max * (0.5 + Math.random() * 0.5)), 30000, 8000000);
    var rate = clampN(0.09 + typeOf(c).risk * 0.02 - repBonus() * 0.03, 0.05, 0.18);
    c.cash += amt;
    c.debt.push({ principal: amt, rate: rate, yearsLeft: 5, annual: Math.round(amt * (1 + rate) / 5) });
    logLine("🏦 " + c.name + " took a " + compact(amt) + " loan at " + pct(rate) + " (repaid over 5 yrs).", {});
    toast("🏦 Loan: +" + compact(amt));
    saveGame(); rerender();
  };
  window.sellStakeV1856 = function () {
    var c = co(); if (!c) return;
    if (c.valuation <= 0) return toast("Need a valuation first — get to revenue.");
    var sell = 10; // sell 10%
    if (c.equity <= sell + 1) return toast("Not enough equity to sell.");
    var proceeds = Math.round(c.valuation * (sell / 100) * 0.9); // slight discount on a quick sale
    c.equity = clampN(c.equity - sell, 1, 100);
    c.soldStake = clampN(c.soldStake + sell, 0, 90);
    c.cash += proceeds;
    logLine("🧾 " + c.name + ": sold 10% for " + compact(proceeds) + " (buy it back later when you're worth more).", {});
    toast("🧾 Sold 10%: +" + compact(proceeds));
    saveGame(); rerender();
  };
  window.buybackStakeV1856 = function () {
    var c = co(); if (!c) return;
    if (c.soldStake <= 0) return toast("You haven't sold any stake.");
    var buy = Math.min(10, c.soldStake);
    var costEach = c.valuation * (buy / 100) * 1.15; // premium to reclaim
    var cost = Math.round(costEach);
    if (c.cash < cost) return toast("Buyback costs " + compact(cost) + " of company cash.");
    spendCo(c, cost);
    c.soldStake = clampN(c.soldStake - buy, 0, 90);
    c.equity = clampN(c.equity + buy, 1, 100);
    logLine("🔁 " + c.name + ": bought back " + buy + "% for " + compact(cost) + " — back to " + Math.round(c.equity) + "%.", {});
    toast("🔁 Bought back " + buy + "%");
    saveGame(); rerender();
  };
  window.takeRBFV1856 = function () {
    var c = co(); if (!c) return; if (!isLive(c) || c.revenue < 100000) return toast("Revenue-based financing needs real revenue.");
    if (c.rbf && c.rbf.owed > 0) return toast("You already have an active RBF advance.");
    var adv = Math.round(c.revenue * (0.3 + Math.random() * 0.4));
    c.cash += adv; c.rbf = { owed: Math.round(adv * 1.4), share: 0.12 };
    logLine("💧 " + c.name + ": took a " + compact(adv) + " revenue advance (repay 1.4× from 12% of revenue).", {});
    toast("💧 RBF: +" + compact(adv));
    saveGame(); rerender();
  };
  window.takeGrantV1856 = function () {
    var c = co(); if (!c) return;
    if (usedYear(actKey("grant"))) return toast("Already applied for a grant this year.");
    markUsed(actKey("grant"));
    if (chance(0.5 + repBonus() + (typeOf(c).scaleStat === "vision" ? 0.15 : 0))) {
      var g = rnd(20000, 120000);
      c.cash += g;
      logLine("🎓 " + c.name + " won a " + compact(g) + " grant/accelerator (no equity).", {});
      toast("🎓 Grant: +" + compact(g));
    } else { logLine("🎓 " + c.name + ": grant application rejected this round.", {}); toast("Grant rejected."); }
    saveGame(); rerender();
  };
  window.takeDividendV1856 = function () {
    var c = co(); if (!c) return;
    var profit = Math.round(c.revenue * typeOf(c).margin) - annualBurn(c) - debtPayment(c);
    if (profit <= 0 || c.cash < 100000) return toast("Only profitable, cash-rich companies can pay a dividend.");
    if (usedYear(actKey("div"))) return toast("Already took a dividend this year.");
    markUsed(actKey("div"));
    var draw = Math.round(Math.min(c.cash * 0.3, profit * 0.5) * (c.equity / 100));
    if (draw <= 0) return toast("Nothing to draw yet.");
    spendCo(c, Math.round(draw / (c.equity / 100)));
    gainCash(draw);
    logLine("💵 " + c.name + ": you took a " + compact(draw) + " founder dividend.", { money: draw });
    toast("💵 Dividend: +" + compact(draw));
    saveGame(); rerender();
  };

  // ----------------------------------------------------------------- exits ---
  function recordExit(c, kind, value) {
    var sf = ensure();
    try { if (typeof window.retireActiveStartupBridgeV1860 === "function") window.retireActiveStartupBridgeV1860(c); } catch (e) {}
    sf.history.unshift({ name: c.name, type: c.type, outcome: kind, value: round(value), age: age() });
    sf.history = sf.history.slice(0, 25);
    sf.lifetimeExit = round(sf.lifetimeExit + Math.max(0, value));
    sf.totalExits += 1;
    sf.founderRep = clampN(sf.founderRep + (value >= 1e9 ? 40 : value >= 1e8 ? 25 : value >= 1e7 ? 14 : 6), 0, 200);
    sf.co = null;
  }
  window.ipoStartupV1856 = function () {
    var c = co(); if (!c) return;
    if (c.stage !== "scale") return toast("Reach Scale stage to IPO.");
    var payout = Math.round(yourStakeValue(c) * (0.85 + Math.random() * 0.4));
    gainCash(payout);
    applyDeltas({ fame: c.valuation >= 1e9 ? 4 : 2, confidence: 4, happiness: 6 });
    logLine("🔔 " + c.name + " IPO'd at " + compact(c.valuation) + " — your stake cashed out for " + compact(payout) + "." + (c.valuation >= 1e9 ? " 🦄" : ""), { money: payout, fame: 2, confidence: 4 });
    toast("🔔 IPO! +" + compact(payout));
    recordExit(c, "ipo", payout);
    saveGame(); rerender();
  };
  window.acceptAcquisitionV1856 = function () {
    var c = co(); if (!c) return;
    if (c.stage !== "scale" && c.stage !== "growth") return toast("Acquisition offers come at Growth or Scale.");
    var offer = Math.round(yourStakeValue(c) * (1.0 + Math.random() * 0.6));
    gainCash(offer);
    applyDeltas({ fame: offer >= 1e9 ? 3 : 1, confidence: 3, happiness: 5 });
    logLine("🤝 " + c.name + " was acquired — you walked away with " + compact(offer) + ".", { money: offer, confidence: 3 });
    toast("🤝 Acquired! +" + compact(offer));
    recordExit(c, "acquisition", offer);
    saveGame(); rerender();
  };

  // Graduate into the Business hub — a calibrated managed company (Part F).
  window.graduateStartupV1856 = function () {
    var c = co(); if (!c) return;
    if (c.stage !== "scale" && c.stage !== "growth") return toast("Companies graduate at Growth or Scale.");
    var s = S();
    var stake = Math.max(50000, Math.round(c.valuation * (c.equity / 100)));
    try {
      var uid = "startup_" + c.type + "_" + age() + "_" + rnd(1000, 9999);
      // yearly income calibrated to the company's real profit on YOUR stake
      var yourProfit = Math.max(20000, Math.round((c.revenue * typeOf(c).margin) * (c.equity / 100)));
      var catEntry = {
        id: uid, baseId: "startup_" + c.type, name: c.name, category: "Tech & Startups",
        startup: stake, yearlyMin: Math.round(yourProfit * 0.45), yearlyMax: Math.round(yourProfit * 1.5),
        failureRisk: 0.09, scaleStat: typeOf(c).scaleStat, minAge: 16,
        desc: c.name + " — graduated from your founder days into a managed company."
      };
      var cat = (typeof entrepreneurshipCatalog !== "undefined" && Array.isArray(entrepreneurshipCatalog)) ? entrepreneurshipCatalog : (Array.isArray(window.entrepreneurshipCatalog) ? window.entrepreneurshipCatalog : null);
      if (cat && !cat.some(function (x) { return x.id === uid; })) cat.push(catEntry);
      if (!s.finance) s.finance = {};
      if (!Array.isArray(s.finance.businesses)) s.finance.businesses = [];
      var biz = {
        id: uid, baseId: "startup_" + c.type, name: c.name, category: "Tech & Startups", sector: "Tech & Startups",
        value: stake, years: 0, reputation: clampN(Math.round(45 + c.productQuality / 4), 12, 96), lastIncome: 0,
        failureRisk: 0.09, stage: "growing", retainedEarnings: Math.max(0, round(c.cash * 0.5)),
        graduatedFromStartupV1856: true, stageV1860: c.stage === "scale" ? "established" : "growing"
      };
      s.finance.businesses.push(biz);
      try { if (typeof window.retireActiveStartupBridgeV1860 === "function") window.retireActiveStartupBridgeV1860(c, biz); } catch (e2) {}
      // initialise the Tech sector meter so the Business loop's sector mechanic treats it right
      try { if (typeof window.ensureSectorMeterV1851 === "function") window.ensureSectorMeterV1851(biz); } catch (e) {}
      try { if (typeof window.ensureBusinessV1840 === "function") window.ensureBusinessV1840(biz); } catch (e) {}
    } catch (e) {}
    applyDeltas({ confidence: 3, fame: 1 });
    logLine("🏢 " + c.name + " graduated into a real company (worth ~" + compact(stake) + ") — it now runs in your Business hub.", { confidence: 3, fame: 1 });
    toast("🏢 " + c.name + " is now a managed company!");
    recordExit(c, "graduated", stake);
    saveGame(); rerender();
  };

  // -------------------------------------------------------- full-time career --
  window.goFullTimeFounderV1856 = function () {
    var sf = ensure(), s = S();
    if (age() < 18) return toast("Going full-time unlocks at 18.");
    if (!sf.co) return toast("Found a startup first.");
    if (sf.fullTime) return toast("You're already full-time.");
    sf.fullTime = true;
    try { s.job = { jobId: "founder_v1856", title: "Startup Founder", salary: 0, performance: 65, stress: 0, tier: 0, isFounderV1856: true }; } catch (e) {}
    if (sf.co) sf.co.momentum = clampN(sf.co.momentum + 0.2, 0, 1.6);
    applyDeltas({ confidence: 4, stress: 6 });
    logLine("💼 You went all-in as a full-time Startup Founder. No salary — the company is everything now.", { confidence: 4, stress: 6 });
    toast("💼 Full-time Founder!");
    saveGame(); rerender();
  };
  window.stepBackFounderV1856 = function () {
    var sf = ensure(), s = S();
    if (!sf.fullTime) return toast("You're not full-time.");
    sf.fullTime = false;
    try { if (s.job && s.job.isFounderV1856) s.job = null; } catch (e) {}
    applyDeltas({ stress: -2 });
    logLine("💼 You stepped back from full-time founding.", { stress: -2 });
    saveGame(); rerender();
  };

  // ----------------------------------------------------------- yearly engine --
  // devFactor: difficulty as a COMPRESSED, single linear term (0.94..1.52 across
  // devDiff 0.7..2.4). It scales the dev thresholds only — accrual is NOT divided
  // by it — so dev time is linear in difficulty (not quadratic) and lands in the
  // 2-5 year window for every type when actively built.
  function devFactor(c) { return 0.7 + typeOf(c).devDiff * 0.32; }
  function advanceProduct(c) {
    if (isLive(c)) return;
    var t = typeOf(c);
    var df = devFactor(c);
    // passive dev from the focus allocation + engineering capacity
    var execBonus = 0.7 + statBonus(c) * 0.6 + c.team.eng * 0.18 + c.team.research * (t.devDiff > 1.4 ? 0.18 : 0.08);
    c.productDev += Math.round((c.devAlloc.features * 0.75 + 10) * execBonus);
    c.techDebt = clampN(c.techDebt + c.devAlloc.features * 0.05 - c.devAlloc.bugfix * 0.08, 0, 100);
    c.productQuality = clampN(c.productQuality + c.devAlloc.ux * 0.12 + c.devAlloc.bugfix * 0.10 - c.techDebt * 0.04, 0, 100);
    c.churn = clampN(t.churn - c.devAlloc.custdev * 0.0015, 0.02, 0.5);
    var dt = DEV_THRESH;
    if (c.productStage === "concept" && c.productDev >= dt.mvp * df) { c.productStage = "mvp"; logLine("🛠️ " + c.name + ": MVP reached. First users next.", {}); }
    else if (c.productStage === "mvp" && c.productDev >= dt.beta * df) { c.productStage = "beta"; logLine("🧪 " + c.name + ": Beta is live with early users.", {}); }
    else if (c.productStage === "beta" && c.productDev >= dt.live * df) {
      c.productStage = "live"; c.stage = "launched";
      // Seed a launch user base so first-year revenue is a real fraction of burn
      // (~0.6× burn), not a few thousand dollars — otherwise low-rpu types can't
      // out-grow the launch burn jump and instantly die. Biotech (rpu 0) keeps a flat seed.
      var seed = t.rpu > 0 ? clampN(Math.round((t.burn * 0.6) / (t.rpu * 0.5)), 80, Math.round(userCap(c) * 0.5)) : rnd(120, 500);
      c.users = Math.max(c.users, seed);
      logLine("🚀 " + c.name + " SHIPPED. Revenue starts now.", { confidence: 2 });
    }
  }
  function advanceStage(c) {
    if (!isLive(c)) { c.stage = "building"; return; }
    var s = c.stage;
    if (c.revenue >= 6000000 && c.growth > 0.05) c.stage = "scale" === s ? "scale" : (c.valuation >= 300000000 || c.revenue >= 40000000 ? "scale" : "growth");
    else if (c.revenue >= 500000) c.stage = (c.stage === "scale" ? "scale" : "growth");
    else c.stage = (c.stage === "building" ? "launched" : c.stage);
    if (c.valuation >= 300000000 || c.revenue >= 40000000) c.stage = "scale";
    else if (c.revenue >= 5000000) c.stage = "growth";
    else if (isLive(c)) c.stage = c.stage === "building" ? "launched" : (c.revenue >= 500000 ? "growth" : "launched");
  }
  function tickYear() {
    try {
      var sf = ensure(); if (!sf.co) return;
      if (sf._migratedToBizV1861 || sf.co._migratedToBizV1861) return; // owned by entrepreneur port (bizV1860)
      var c = sf.co; var t = typeOf(c), mm = modelOf(c);
      if (c._lastTickAge === S().age) return;
      c._lastTickAge = S().age;
      c.age = (c.age || 0) + 1;

      // ── product / users / revenue ──
      if (!isLive(c)) {
        advanceProduct(c);
        c.revenue = 0; c.growth = 0;
      } else {
        var stageGrowth = { launched: 0.13, growth: 0.22, scale: 0.14 }[c.stage] || 0.13;
        var qualityMult = 0.5 + (c.productQuality / 100);
        // churn drag softened 20% so high-churn types (consumer/gaming/ecom) can still net-grow toward scale.
        var g = (stageGrowth + (mm.growthMod || 0)) * (0.6 + c.momentum * 0.5) * qualityMult * (1 + statBonus(c) + repBonus() + c.team.growth * 0.1) - clampN((c.churn + (mm.churnMod || 0)) * 0.8, 0.015, 0.5);
        c.growth = g;
        var cap = userCap(c), headroom = clampN(1 - c.users / cap, 0, 1);
        c.users = clampN(Math.round(Math.max(40, c.users) * (1 + Math.max(-0.3, g) * headroom)), 0, cap);
        var rpu = t.rpu * (1 + (mm.rpuMod || 0));
        if (t.rpu > 0) c.revenue = Math.round(c.users * rpu * (0.4 + c.productQuality / 180) * (1 + c.team.sales * 0.15));
        else c.revenue = Math.round((c.revenue || 0) * (1 + g) + (c.stage === "scale" ? c.productQuality * 180000 : c.productQuality * 40000));
        advanceProduct(c); // ongoing dev/quality drift handled in R&D; keep churn fresh
      }

      // ── company cash: revenue margin − burn − debt − RBF ──
      var grossProfit = Math.round(c.revenue * t.margin);
      var burn = annualBurn(c);
      var debtPay = debtPayment(c);
      var rbfPay = 0;
      if (c.rbf && c.rbf.owed > 0) { rbfPay = Math.min(c.rbf.owed, Math.round(c.revenue * c.rbf.share)); c.rbf.owed -= rbfPay; if (c.rbf.owed <= 0) { c.rbf = null; logLine("💧 " + c.name + ": revenue advance fully repaid.", {}); } }
      (c.debt || []).forEach(function (d) { if (d.yearsLeft > 0) { d.yearsLeft -= 1; if (d.yearsLeft === 0) logLine("🏦 " + c.name + ": a loan is fully repaid.", {}); } });
      c.cash = round(c.cash + grossProfit - burn - debtPay - rbfPay);
      c.momentum = clampN(c.momentum - 0.13, 0, 1.6);
      c.valuation = computeValuation(c);
      advanceStage(c);

      maybeStartupEvent(c);

      // ── bankruptcy ──
      if (c.cash < 0) {
        logLine("💀 " + c.name + " ran out of runway and shut down.", { stress: 10, confidence: -3 });
        applyDeltas({ stress: 10, confidence: -3 });
        toast("💀 " + c.name + " went bankrupt.");
        sf.founderRep = clampN(sf.founderRep - 4, 0, 200);
        sf.history.unshift({ name: c.name, type: c.type, outcome: "bankrupt", value: 0, age: age() });
        sf.co = null; saveGame(); return;
      }
      var rw = runwayYears(c);
      if (rw !== Infinity && rw < 1.6) logLine("⏳ " + c.name + ": runway ~" + (rw * 12).toFixed(0) + " months. Raise or cut burn.", {});
      c.hist.push(Math.round(c.valuation)); if (c.hist.length > 14) c.hist.shift();
    } catch (e) {}
  }
  var prevResolve = window.resolveLifeAndFinanceYear || (typeof resolveLifeAndFinanceYear === "function" ? resolveLifeAndFinanceYear : null);
  if (prevResolve && !window.__ledgerStartupResolveWrapped) {
    window.__ledgerStartupResolveWrapped = true;
    window.resolveLifeAndFinanceYear = function () { var out = prevResolve.apply(this, arguments); tickYear(); return out; };
    try { resolveLifeAndFinanceYear = window.resolveLifeAndFinanceYear; } catch (e) {}
  }

  // -------------------------------------------------------------- events -----
  function fee(c, frac, floor) { return Math.max(floor || 1000, Math.round((c.valuation || c.totalRaised || c.cash || 100000) * frac)); }
  var EVENTS = [
    function (c) { return { type: "bad", icon: "🧑‍🤝‍🧑", title: "Co-Founder Conflict", body: "A co-founder wants out and is threatening to take talent.", choices: [
      { text: "Buy them out (" + compact(fee(c, 0.04, 20000)) + " company cash)", apply: function () { spendCo(c, fee(c, 0.04, 20000)); c.equity = clampN(c.equity + 8, 1, 100); c.coFounders = (c.coFounders || []).slice(0, -1); logLine("🧑‍🤝‍🧑 " + c.name + ": bought out a co-founder — more equity.", {}); } },
      { text: "Let them walk", apply: function () { c.productQuality = clampN(c.productQuality - 10, 0, 100); c.momentum = clampN(c.momentum - 0.3, 0, 1.6); applyDeltas({ stress: 5 }); logLine("🧑‍🤝‍🧑 " + c.name + ": a co-founder left.", { stress: 5 }); } }
    ] }; },
    function (c) { return { type: "major", icon: "🚀", title: "Viral Moment", body: "Something you shipped is catching fire.", choices: [
      { text: "Spend to ride it (" + compact(fee(c, 0.05, 25000)) + ")", apply: function () { spendCo(c, fee(c, 0.05, 25000)); if (isLive(c)) c.users = Math.round(c.users * (1.4 + Math.random())); c.momentum = clampN(c.momentum + 0.5, 0, 1.8); logLine("🚀 " + c.name + ": rode the wave.", {}); } },
      { text: "Stay disciplined", apply: function () { c.momentum = clampN(c.momentum + 0.2, 0, 1.6); logLine("🚀 " + c.name + ": grew off the moment.", {}); } }
    ] }; },
    function (c) { return { type: "bad", icon: "📉", title: "Funding Winter", body: "The market froze. Raising just got hard.", choices: [
      { text: "Cut burn hard", apply: function () { c.hires = (c.hires || []).slice(0, Math.max(0, c.hires.length - 1)); c.momentum = clampN(c.momentum - 0.1, 0, 1.6); applyDeltas({ stress: 3 }); logLine("📉 " + c.name + ": slashed burn to survive.", { stress: 3 }); } },
      { text: "Take a down round", apply: function () { c.equity = clampN(c.equity * 0.85, 1, 100); c.cash += fee(c, 0.12, 50000); logLine("📉 " + c.name + ": raised a painful down round.", {}); } }
    ] }; },
    function (c) { return { type: "bad", icon: "🔓", title: "Security Incident", body: "A vulnerability exposed user data.", choices: [
      { text: "Disclose + fix (" + compact(fee(c, 0.03, 15000)) + ")", apply: function () { spendCo(c, fee(c, 0.03, 15000)); logLine("🔓 " + c.name + ": handled it transparently.", {}); } },
      { text: "Hush it up", apply: function () { if (chance(0.5)) logLine("🔓 " + c.name + ": no one noticed.", {}); else { c.churn = clampN(c.churn + 0.06, 0, 0.6); applyDeltas({ stress: 5 }); logLine("📰 " + c.name + ": the cover-up leaked.", { stress: 5 }); } } }
    ] }; }
  ];
  function maybeStartupEvent(c) {
    if (c.stage === "building" && c.productStage === "concept") return;
    if (!chance(0.28 * typeOf(c).risk)) return;
    var cfg = pick(EVENTS)(c); cfg.co = c; queuePopup(cfg);
  }

  // --------------------------------------------------- bulletproof popup -----
  var _queue = [], _showing = false, _flushPending = false;
  function queuePopup(cfg) { _queue.push(cfg); scheduleFlush(); }
  function scheduleFlush() { if (_flushPending) return; _flushPending = true; setTimeout(function () { _flushPending = false; flushPopups(); }, 50); }
  function flushPopups() {
    if (_showing) { try { if (!document.getElementById("startup-ev-overlay")) _showing = false; } catch (e) {} if (_showing) return; }
    if (!_queue.length) return; _showing = true;
    try { renderPopup(_queue.shift()); } catch (e) { _showing = false; try { var o = document.getElementById("startup-ev-overlay"); if (o) o.remove(); } catch (e2) {} }
  }
  var C_MAP = { good: "var(--good,#9fd07d)", bad: "var(--bad,#e58b76)", neutral: "var(--blue,#85c1cf)", major: "var(--accent,#f0ca7b)" };
  var BG_MAP = { good: "rgba(143,175,108,0.10)", bad: "rgba(204,118,97,0.10)", neutral: "rgba(126,160,172,0.10)", major: "rgba(201,155,85,0.13)" };
  function renderPopup(cfg) {
    var old = document.getElementById("startup-ev-overlay"); if (old) old.remove();
    var col = C_MAP[cfg.type] || C_MAP.neutral, bg = BG_MAP[cfg.type] || BG_MAP.neutral;
    var overlay = document.createElement("div");
    overlay.id = "startup-ev-overlay";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.66);z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:20px;font-family:inherit;";
    var choices = cfg.choices || [];
    var btnHTML = choices.length
      ? choices.map(function (c, i) { var hint = c.hint ? '<div style="font-size:11px;color:var(--faint,#718071);margin-top:3px;">' + esc(c.hint) + '</div>' : ""; return '<button data-i="' + i + '" class="su-ev-choice" style="display:block;width:100%;text-align:left;padding:11px 14px;margin-bottom:8px;background:var(--card,#241f19);border:1px solid var(--line,#3a3128);border-radius:9px;color:var(--ink,#f3efe4);cursor:pointer;font-size:13px;line-height:1.4;"><span style="font-weight:600">' + esc(c.text) + "</span>" + hint + "</button>"; }).join("")
      : '<button data-i="-1" class="su-ev-choice" style="display:block;width:100%;padding:12px;background:' + col + ';border:none;border-radius:9px;color:#14110d;cursor:pointer;font-weight:700;font-size:14px;">Continue →</button>';
    overlay.innerHTML =
      '<div role="dialog" aria-modal="true" style="position:relative;max-width:460px;width:100%;background:var(--bg,#14110d);border:1px solid ' + col + '66;border-radius:14px;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,0.55);max-height:88vh;overflow-y:auto;">' +
        '<button class="su-ev-x" aria-label="Close" style="position:absolute;top:8px;right:10px;width:30px;height:30px;border:none;border-radius:8px;background:rgba(0,0,0,0.28);color:#f3efe4;font-size:18px;cursor:pointer;z-index:2;">×</button>' +
        '<div style="padding:20px 22px 16px;background:' + bg + ";border-bottom:1px solid " + col + '33;">' +
          '<div style="font-size:32px;line-height:1;margin-bottom:10px;">' + esc(cfg.icon || "📌") + "</div>" +
          '<div style="font-family:Georgia,serif;font-size:18px;font-weight:700;color:' + col + ';margin-bottom:8px;padding-right:28px;">' + esc(cfg.title || "Event") + "</div>" +
          '<div style="font-size:13px;color:var(--dim,#aa9a82);line-height:1.6;">' + esc(cfg.body || "") + "</div>" +
        "</div><div style=\"padding:16px 22px 18px;\">" + btnHTML + "</div></div>";
    function close(applyFn) {
      try { document.removeEventListener("keydown", onKey, true); } catch (e) {}
      try { overlay.remove(); } catch (e) {}
      _showing = false;
      try { if (typeof applyFn === "function") applyFn(); } catch (e) {}
      try { rerender(); } catch (e) {}
      try { saveGame(); } catch (e) {}
      flushPopups();
    }
    function onKey(e) { if (e.key === "Escape" || e.keyCode === 27) { e.preventDefault(); close(null); } }
    try { document.addEventListener("keydown", onKey, true); } catch (e) {}
    overlay.querySelectorAll(".su-ev-choice").forEach(function (btn) {
      btn.addEventListener("click", function () { var i = parseInt(btn.getAttribute("data-i"), 10); close(function () { if (choices.length && i >= 0 && choices[i] && typeof choices[i].apply === "function") choices[i].apply(); }); });
    });
    var x = overlay.querySelector(".su-ev-x"); if (x) x.addEventListener("click", function () { close(null); });
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(null); });
    (document.body || document.documentElement).appendChild(overlay);
  }

  // ----------------------------------------------------------------- render --
  function btn(label, onclick, kind, disabled) { return '<button class="money-btn ' + esc(kind || "") + '" onclick="event.preventDefault();event.stopPropagation();' + onclick + '" ' + (disabled ? "disabled" : "") + '>' + esc(label) + '</button>'; }
  function spark(values) { var SP = "▁▂▃▄▅▆▇█"; var v = (values || []).filter(function (x) { return Number.isFinite(x); }); if (v.length < 2) return ""; var mn = Math.min.apply(null, v), mx = Math.max.apply(null, v), sp = mx - mn || 1; return '<span class="su-spark">' + v.map(function (x) { return SP[Math.min(7, Math.floor(((x - mn) / sp) * 7.999))]; }).join("") + "</span>"; }
  function rail(inner) { try { if (typeof window.scrollRailV1857 === "function") return window.scrollRailV1857(inner); } catch (e) {} return '<div class="su-rail">' + inner + "</div>"; }

  function foundView() {
    var cards = TYPE_ORDER.map(function (id) {
      var t = TYPES[id];
      var devLabel = t.devDiff >= 1.6 ? "very long" : t.devDiff >= 1.2 ? "long" : t.devDiff >= 0.9 ? "medium" : "fast";
      var roleList = t.roles.map(function (r) { return ROLES[r] ? ROLES[r].title : r; }).slice(0, 4).join(", ");
      return '<div class="su-type"><div class="su-type-ic">' + t.icon + '</div><div class="su-type-body"><b>' + esc(t.name) + '</b>' +
        '<div class="su-type-meta">×' + t.revMultiple + ' valuation · ' + Math.round(t.margin * 100) + '% margin · scales with ' + esc(t.scaleStat) + '</div>' +
        '<div class="su-type-meta">Build time: ' + devLabel + ' · market ' + compact(t.market) + ' · risk ' + (t.risk >= 1.3 ? "high" : t.risk >= 1.05 ? "med" : "low") + '</div>' +
        '<div class="su-type-blurb">' + esc(t.blurb) + '</div>' +
        '<div class="su-type-roles">Key team: ' + esc(roleList) + '</div></div></div>';
    }).join("");
    return '<section class="su-section"><div class="su-section-head">🚀 Found a Startup <span>compare, then found</span></div>' +
      '<div class="su-note">Founding kicks off a guided wizard (type → revenue model → name → co-founder → capital → focus). Then you build for years before revenue — manage runway, raise funding, and exit big.</div>' +
      '<div style="margin-bottom:12px">' + btn("🚀 Start Founding", "startFoundingV1856()", "gold", age() < 16) + (age() < 16 ? ' <span class="su-note" style="display:inline">Unlocks at 16.</span>' : "") + '</div>' +
      '<div class="su-type-grid">' + cards + '</div></section>';
  }

  function metricTile(label, value, sub, cls) { return '<div class="su-metric ' + esc(cls || "") + '"><span>' + esc(label) + '</span><b>' + value + '</b>' + (sub ? '<em>' + sub + '</em>' : "") + '</div>'; }

  function dashboard(c) {
    var t = typeOf(c);
    var rw = runwayYears(c);
    var rwLabel = rw === Infinity ? "Profitable" : (rw * 12).toFixed(0) + " mo";
    var psIdx = PRODUCT_STAGES.indexOf(c.productStage);
    var psBar = PRODUCT_STAGES.map(function (st, i) { return '<span class="su-stage ' + (i <= psIdx ? "done" : "") + (i === psIdx ? " now" : "") + '">' + PS_LABEL[st] + "</span>"; }).join('<i class="su-stage-sep"></i>');
    var burn = annualBurn(c), debtPay = debtPayment(c);
    var building = !isLive(c);

    var head = '<section class="su-co-hero"><div class="su-co-top"><div class="su-co-ic">' + t.icon + '</div><div class="su-co-id"><input id="su-rename" class="su-co-name" value="' + esc(c.name) + '" onchange="event.stopPropagation();renameStartupV1856(\'su-rename\')"><div class="su-co-sub">' + esc(t.name) + ' · ' + esc(modelOf(c).name) + ' · ' + BIZ_STAGE_LABEL[c.stage] + ' · you own ' + Math.round(c.equity) + '%' + (c.soldStake > 0 ? ' (' + Math.round(c.soldStake) + '% sold)' : '') + '</div></div>' +
      '<div class="su-co-val"><b>' + compact(c.valuation) + '</b><em>valuation' + (c.valuation >= 1e9 ? " 🦄" : "") + '</em></div></div>' +
      '<div class="su-stages">' + psBar + '</div></section>';

    var metrics = '<section class="su-section"><div class="su-section-head">📊 Metrics</div><div class="su-metric-grid">' +
      metricTile("Company cash", compact(c.cash), "runway " + rwLabel, rw !== Infinity && rw < 1.6 ? "bad" : "good") +
      metricTile(building ? "Dev progress" : "Revenue", building ? round(c.productDev) + " pts" : compact(c.revenue) + "/yr", building ? PS_LABEL[c.productStage] : "growth " + pct(c.growth), building ? "" : (c.growth >= 0 ? "good" : "bad")) +
      metricTile(building ? "Quality" : "Users", building ? round(c.productQuality) + "/100" : compact(c.users), building ? "tech debt " + round(c.techDebt) : "churn " + pct(c.churn), "") +
      metricTile("Annual burn", compact(burn + debtPay) + "/yr", debtPay ? "incl " + compact(debtPay) + " debt" : "salaries + ops", "bad") +
      metricTile("Your stake", compact(yourStakeValue(c)), Math.round(c.equity) + "% equity", "gold") +
      metricTile("Founder rep", Math.round(ensure().founderRep) + "", ensure().totalExits + " exits", "") +
      '</div><div class="su-valhist">Valuation ' + spark(c.hist) + '</div></section>';

    // build vs operate actions
    var ops;
    if (building) {
      var focusBtns = [["features", "Features"], ["quality", "Quality"], ["customers", "Customers"], ["balanced", "Balanced"]].map(function (f) {
        var active = JSON.stringify(c.devAlloc) === JSON.stringify({ features: 65, bugfix: 10, ux: 15, custdev: 10 }) && f[0] === "features";
        return '<button class="money-btn ' + (sameFocus(c, f[0]) ? "gold" : "") + '" onclick="event.preventDefault();event.stopPropagation();setDevFocusV1856(\'' + f[0] + '\')">' + esc(f[1]) + '</button>';
      }).join("");
      ops = '<section class="su-section"><div class="su-section-head">🏗️ Build the Product <span>' + PS_LABEL[c.productStage] + ' → ship at Live</span></div>' +
        '<div class="su-note">Set your dev focus, then sprint each year. No revenue until you ship.</div>' +
        '<div class="su-sub-label">Dev focus</div>' + rail(focusBtns) +
        '<div class="su-sub-label">Actions</div>' + rail(btn("🛠️ Build Sprint", "buildSprintV1856()", "blue", usedYear(actKey("build")))) + '</section>';
    } else {
      ops = '<section class="su-section"><div class="su-section-head">🎯 Run the Company <span>one of each per year</span></div>' +
        rail(btn("📣 Growth Push", "growthPushV1856()", "green", usedYear(actKey("growth"))) +
          btn("🔬 Invest in R&D", "investRDV1856()", "blue", usedYear(actKey("rd"))) +
          btn("💵 Take Dividend", "takeDividendV1856()", "gold", usedYear(actKey("div")))) + '</section>';
    }

    // funding panel
    var rd = nextRound(c), canRaise = rd && c.revenue >= rd.gateRev;
    var funding = '<section class="su-section"><div class="su-section-head">💰 Funding <span>cash fuels the runway</span></div>' +
      rail(
        (rd ? btn(rd.icon + " " + rd.label + (canRaise ? "" : " (needs " + compact(rd.gateRev) + ")"), "raiseEquityV1856()", "gold", !canRaise) : btn("All rounds raised", "", "", true)) +
        btn("🏦 Take a Loan", "takeLoanV1856()", "blue", false) +
        btn("🧾 Sell 10% Stake", "sellStakeV1856()", "", c.valuation <= 0) +
        (c.soldStake > 0 ? btn("🔁 Buy Back 10%", "buybackStakeV1856()", "green", false) : "") +
        btn("💧 Revenue Advance", "takeRBFV1856()", "", !isLive(c)) +
        btn("🎓 Apply for Grant", "takeGrantV1856()", "", usedYear(actKey("grant")))
      ) +
      '<div class="su-note" style="margin-top:8px">Equity: you own ' + Math.round(c.equity) + '%' + (c.coFounders.length ? ' · co-founders ' + c.coFounders.reduce(function (s, x) { return s + x.equity; }, 0) + '%' : '') + (c.debt.length ? ' · debt ' + compact((c.debt || []).reduce(function (s, d) { return s + (d.yearsLeft > 0 ? d.principal : 0); }, 0)) : '') + (c.rbf && c.rbf.owed ? ' · RBF owed ' + compact(c.rbf.owed) : '') + '</div></section>';

    // team
    var typeRoles = t.roles.concat(["growth", "ops", "cfo"]).filter(function (v, i, a) { return a.indexOf(v) === i; });
    var team = '<section class="su-section"><div class="su-section-head">🧑‍💼 Team <span>per-role effects + salary</span></div>' +
      rail(typeRoles.map(function (rid) {
        var r = ROLES[rid]; if (!r) return "";
        var have = (c.hires || []).indexOf(rid) >= 0 || c.coFounders.some(function (cf) { return cf.bucket === r.bucket && (rid === "cto" || rid === "ops"); });
        if (have) return '<span class="su-hire owned">' + r.icon + " " + esc(r.title) + "</span>";
        return '<button class="money-btn" title="' + esc(r.effect) + '" onclick="event.preventDefault();event.stopPropagation();hireRoleV1856(\'' + rid + '\')" ' + (c.cash < r.sal * 0.4 ? "disabled" : "") + '>' + r.icon + " " + esc(r.title) + ' · ' + compact(r.sal * 0.4) + '</button>';
      }).join("")) +
      '<div class="su-note" style="margin-top:8px">Hired roles add ongoing salary to burn. Each does what its label says.</div></section>';

    var exits = "";
    if (c.stage === "scale" || c.stage === "growth") {
      exits = '<section class="su-section exit"><div class="su-section-head">🏁 Exit <span>cash out or graduate</span></div><div class="su-note">Your stake is worth ' + compact(yourStakeValue(c)) + '.</div>' +
        rail((c.stage === "scale" ? btn("🔔 IPO · ~" + compact(yourStakeValue(c)), "ipoStartupV1856()", "gold", false) : "") +
          btn("🤝 Accept Acquisition", "acceptAcquisitionV1856()", "green", false) +
          btn("🏢 Graduate to Business", "graduateStartupV1856()", "blue", false)) + '</section>';
    }
    var founder = '<section class="su-section"><div class="su-section-head">⚙️ Founder</div>' +
      rail(btn(isFounder() ? "💼 Full-Time (on)" : "💼 Go Full-Time", isFounder() ? "stepBackFounderV1856()" : "goFullTimeFounderV1856()", isFounder() ? "gold" : "", false) +
        btn("🪦 Shut Down", "shutdownStartupV1856()", "red", false)) + '</section>';

    return head + metrics + ops + funding + team + exits + founder;
  }
  function sameFocus(c, focus) {
    var presets = { features: { features: 65, bugfix: 10, ux: 15, custdev: 10 }, quality: { features: 35, bugfix: 30, ux: 30, custdev: 5 }, customers: { features: 35, bugfix: 10, ux: 15, custdev: 40 }, balanced: { features: 45, bugfix: 20, ux: 20, custdev: 15 } };
    return JSON.stringify(c.devAlloc) === JSON.stringify(presets[focus]);
  }

  function historyView() {
    var sf = ensure(); if (!sf.history.length) return "";
    var rows = sf.history.slice(0, 8).map(function (h) {
      var icon = h.outcome === "ipo" ? "🔔" : h.outcome === "acquisition" ? "🤝" : h.outcome === "graduated" ? "🏢" : h.outcome === "bankrupt" ? "💀" : "🪦";
      var word = h.outcome === "ipo" ? "IPO" : h.outcome === "acquisition" ? "Acquired" : h.outcome === "graduated" ? "Graduated" : h.outcome === "bankrupt" ? "Bankrupt" : "Shut down";
      return '<div class="su-hist-row"><span>' + icon + " " + esc(h.name) + '</span><span class="' + (h.value > 0 ? "good" : "bad") + '">' + word + (h.value > 0 ? " · " + compact(h.value) : "") + ' <em>age ' + esc(h.age) + '</em></span></div>';
    }).join("");
    return '<section class="su-section"><div class="su-section-head">📜 Founder Track Record <span>' + sf.totalExits + ' exits · ' + compact(sf.lifetimeExit) + ' lifetime</span></div>' + rows + '</section>';
  }

  function renderStartupHub() {
    var sf = ensure(); var c = sf.co;
    var hero = '<section class="su-hero"><div><div class="su-kicker">💼 Entrepreneurship</div><h2>Found a Company</h2><p>Build a startup the real way: years of development before a dollar of revenue, funding rounds and loans to survive, a team to hire, and a billion-dollar exit if you make it. Or run out of runway and start again.</p>' +
      '<div class="su-chips"><span class="gold">Your cash ' + compact(cash()) + '</span><span>' + (sf.fullTime ? "Full-time founder" : "Side founder") + '</span><span>Founder rep ' + Math.round(sf.founderRep) + '</span><span>Exits ' + sf.totalExits + '</span><span>Lifetime ' + compact(sf.lifetimeExit) + '</span></div></div>' +
      '<strong>' + compact(c ? yourStakeValue(c) : sf.lifetimeExit) + '<span>' + (c ? "your stake" : "lifetime exits") + '</span></strong></section>';
    var body = c ? dashboard(c) : foundView();
    return '<div class="su-shell">' + hero + body + historyView() + '</div>';
  }
  window.renderStartupHubV1856 = renderStartupHub;
  window.renderHustlesHubV1855 = renderStartupHub;

  // ------------------------------------------------------------- hub wiring --
  function isStartupHub(id) { return id === "entrepreneurship" || id === "entrepreneur" || id === "founder" || id === "startup" || id === "hustles" || id === "hustle" || id === "sidehustle"; }
  var previousRenderHubContent = window.renderHubContent || (typeof renderHubContent === "function" ? renderHubContent : null);
  window.renderHubContent = function (hubId) { var id = String(hubId || "").toLowerCase(); if (isStartupHub(id)) return renderStartupHub(); return previousRenderHubContent ? previousRenderHubContent.apply(this, arguments) : ""; };
  try { renderHubContent = window.renderHubContent; } catch (e) {}
  var previousRenderHubOverlay = window.renderHubOverlay || (typeof renderHubOverlay === "function" ? renderHubOverlay : null);
  if (typeof previousRenderHubOverlay === "function") {
    window.renderHubOverlay = function (hubId) { var html = previousRenderHubOverlay.apply(this, arguments); var id = String(hubId || "").toLowerCase(); if (isStartupHub(id)) html = String(html).replace(/<h2>[^<]*<\/h2>/, "<h2>Entrepreneurship</h2>"); return html; };
    try { renderHubOverlay = window.renderHubOverlay; } catch (e) {}
  }

  // ------------------------------------------------------------------ styles --
  try {
    if (typeof document !== "undefined" && document.head && !document.getElementById("ledger-startup-v1856-style")) {
      var st = document.createElement("style");
      st.id = "ledger-startup-v1856-style";
      st.textContent = [
        ".su-shell{display:grid;gap:15px;padding:4px 0 96px;color:var(--ink,#f3efe4);min-width:0}.su-shell *{box-sizing:border-box}",
        ".su-hero{position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:end;border:1px solid rgba(126,160,172,.36);border-radius:18px;background:radial-gradient(circle at 10% 0,rgba(126,160,172,.2),transparent 42%),linear-gradient(135deg,rgba(22,32,38,.96),rgba(19,17,13,.98));padding:20px;overflow:hidden;box-shadow:0 18px 48px rgba(0,0,0,.3)}",
        ".su-kicker{font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.24em;color:var(--blue,#85c1cf);font-size:9px;font-weight:800}",
        ".su-hero h2{margin:6px 0 7px;font-family:Georgia,serif;font-style:italic;font-weight:700;font-size:36px;line-height:.95;color:var(--ink,#fff3df)}.su-hero p{margin:0;max-width:780px;color:var(--dim,#cdbf9f);font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.6}",
        ".su-hero strong{display:grid;place-items:center;min-width:150px;min-height:90px;border:1px solid rgba(126,160,172,.4);border-radius:14px;background:rgba(0,0,0,.28);color:var(--blue,#9fc8d3);font-family:Georgia,serif;font-size:22px;text-align:center}.su-hero strong span{display:block;font-family:'JetBrains Mono',monospace;font-size:8px;text-transform:uppercase;letter-spacing:.13em;color:var(--faint,#9a8c74);margin-top:6px}",
        ".su-chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:13px}.su-chips span{border:1px solid rgba(255,255,255,.13);border-radius:999px;background:rgba(255,255,255,.05);padding:6px 10px;color:var(--dim,#cdbf9f);font-family:'JetBrains Mono',monospace;font-size:10px}.su-chips .gold{color:var(--accent,#f0ca7b);border-color:rgba(201,155,85,.4)}",
        ".su-section{border:1px solid var(--line,#3a3128);border-radius:16px;background:linear-gradient(135deg,rgba(34,30,23,.9),rgba(20,17,13,.96));padding:16px}.su-section.exit{border-color:rgba(201,155,85,.45)}.su-section-head{font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.14em;color:var(--accent,#d8b16e);font-size:11px;margin-bottom:12px;display:flex;justify-content:space-between;gap:8px;align-items:baseline}.su-section-head span{color:var(--faint,#9a8c74);font-size:9px}",
        ".su-note{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--dim,#cdbf9f);line-height:1.5;margin-bottom:10px}.su-sub-label{font-family:'JetBrains Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:.12em;color:var(--faint,#9a8c74);margin:10px 0 6px}",
        ".su-rail{display:flex;gap:8px;flex-wrap:wrap}",
        ".su-type-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:12px}.su-type{display:flex;gap:12px;border:1px solid rgba(255,255,255,.1);border-radius:13px;background:rgba(255,255,255,.04);padding:13px;transition:border-color .15s}.su-type:hover{border-color:rgba(201,155,85,.45)}.su-type-ic{flex:0 0 auto;width:46px;height:46px;display:grid;place-items:center;font-size:24px;border-radius:11px;background:rgba(0,0,0,.22)}.su-type-body{min-width:0}.su-type-body b{font-family:Georgia,serif;font-size:16px;color:var(--ink,#fff3df)}.su-type-meta{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--accent,#d8b16e);margin:3px 0}.su-type-blurb{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--dim,#cdbf9f);line-height:1.45;margin:4px 0}.su-type-roles{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--faint,#9a8c74)}",
        ".su-co-hero{border:1px solid rgba(201,155,85,.4);border-radius:16px;background:radial-gradient(circle at 90% 0,rgba(201,155,85,.16),transparent 40%),linear-gradient(135deg,rgba(38,32,24,.95),rgba(20,17,13,.97));padding:16px}.su-co-top{display:flex;gap:12px;align-items:center}.su-co-ic{width:52px;height:52px;display:grid;place-items:center;font-size:27px;border-radius:12px;background:rgba(0,0,0,.24)}.su-co-id{flex:1;min-width:0}.su-co-name{background:transparent;border:none;border-bottom:1px dashed rgba(255,255,255,.18);color:var(--ink,#fff3df);font-family:Georgia,serif;font-size:21px;width:100%;padding:2px 0}.su-co-name:focus{outline:none;border-bottom-color:var(--accent,#f0ca7b)}.su-co-sub{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--dim,#cdbf9f);margin-top:3px}.su-co-val{text-align:right}.su-co-val b{display:block;font-family:Georgia,serif;font-size:22px;color:var(--accent,#f0ca7b)}.su-co-val em{font-style:normal;font-family:'JetBrains Mono',monospace;font-size:8px;text-transform:uppercase;letter-spacing:.1em;color:var(--faint,#9a8c74)}",
        ".su-stages{display:flex;align-items:center;gap:6px;margin-top:13px;flex-wrap:wrap}.su-stage{font-family:'JetBrains Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:var(--faint,#9a8c74)}.su-stage.done{color:var(--good,#9fd07d)}.su-stage.now{color:var(--accent,#f0ca7b);font-weight:800}.su-stage-sep{width:14px;height:1px;background:rgba(255,255,255,.18)}",
        ".su-metric-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,150px),1fr));gap:9px}.su-metric{border:1px solid rgba(255,255,255,.1);border-radius:11px;background:rgba(255,255,255,.04);padding:11px}.su-metric span{display:block;font-family:'JetBrains Mono',monospace;font-size:8px;text-transform:uppercase;letter-spacing:.1em;color:var(--faint,#9a8c74)}.su-metric b{display:block;font-family:Georgia,serif;font-size:19px;color:var(--ink,#fff3df);margin-top:4px}.su-metric em{display:block;font-style:normal;font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--dim,#cdbf9f);margin-top:3px}.su-metric.good b{color:var(--good,#9fd07d)}.su-metric.bad b{color:var(--bad,#e58b76)}.su-metric.gold b{color:var(--accent,#f0ca7b)}",
        ".su-valhist{margin-top:10px;font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--dim,#cdbf9f)}.su-spark{letter-spacing:-1px;color:var(--accent,#f0ca7b);font-size:13px}",
        ".su-hire{font-family:'JetBrains Mono',monospace;font-size:11px;border:1px solid rgba(159,208,125,.45);border-radius:999px;background:rgba(159,208,125,.1);color:var(--good,#9fd07d);padding:7px 12px;white-space:nowrap}",
        ".su-hist-row{display:flex;justify-content:space-between;gap:10px;border-top:1px solid rgba(255,255,255,.07);padding:8px 0;font-family:'JetBrains Mono',monospace;font-size:11px}.su-hist-row:first-of-type{border-top:0}.su-hist-row .good{color:var(--good,#9fd07d)}.su-hist-row .bad{color:var(--bad,#e58b76)}.su-hist-row em{font-style:normal;color:var(--faint,#9a8c74)}",
        "@media(max-width:720px){.su-hero{grid-template-columns:1fr;padding:16px}.su-hero h2{font-size:28px}.su-hero strong{place-items:start;min-width:0;padding:12px}.su-co-top{flex-wrap:wrap}.su-co-val{text-align:left}}"
      ].join("\n");
      document.head.appendChild(st);
    }
  } catch (e) {}
})();
