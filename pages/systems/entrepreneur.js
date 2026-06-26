/* ============================================================================
 * entrepreneur.js  (v18.61) — ported Verdant entrepreneur system
 * ----------------------------------------------------------------------------
 * Faithful port of the base-code (Verdant) entrepreneur system into the modular
 * game, behind a thin shim that maps Verdant globals (G.*) and helpers onto the
 * modular `state` / render / money conventions. Replaces the fragmented
 * startup-founder + business-entities + core-venture systems (retired in a later
 * phase). PHASES A-D = catalogs/state shim, founding wizard, yearly engine,
 * action handlers, and Business/Entrepreneurship hub renderer.
 *
 * Source: base code.devtools ~119217–121800.
 * ========================================================================== */
(function () {
  "use strict";
  if (window.__ledgerEntrepreneurV1861Loaded) return;
  window.__ledgerEntrepreneurV1861Loaded = true;

  // ---------------------------------------------- shim (G.* → modular state) --
  function S() { try { if (typeof state !== "undefined" && state) return state; } catch (e) {} return window.state || {}; }
  function num(v, d) { var x = Number(v); return Number.isFinite(x) ? x : (d || 0); }
  function round(v) { return Math.round(num(v)); }
  function clampN(v, a, b) { return Math.max(a, Math.min(b, num(v))); }
  function rnd(a, b) { try { if (typeof window.rand === "function") return window.rand(a, b); } catch (e) {} a = Math.ceil(num(a)); b = Math.floor(num(b)); return Math.floor(Math.random() * (b - a + 1)) + a; }
  function pickOne(arr) { return (Array.isArray(arr) && arr.length) ? arr[Math.floor(Math.random() * arr.length)] : undefined; }
  function age() { return num(S().age); }
  function smarts() { var s = S(); return num(s.stats && s.stats.smarts, 50); }
  function karma() { var s = S(); return num(s.stats && s.stats.karma, 50); }
  function fame() { return num(S().fame); }
  function wealth() { return num(S().money); }              // personal cash
  function fin() { var s = S(); if (!s.finance || typeof s.finance !== "object") s.finance = {}; return s.finance; }
  function moneyText(v) { try { if (typeof window.money === "function") return window.money(round(v)); } catch (e) {} return "$" + round(v).toLocaleString(); }
  // Per-share price: always show cents so small moves (e.g. a $2.03 share) are visible, not rounded to whole dollars.
  function priceTextV1862(v) { v = num(v); return (v < 0 ? "-$" : "$") + Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function currencySymbol() { return "$"; }

  // ------------------------------------------------- catalogs (ported data) --
  var BIZ_TYPES = {
    saas:     { name:'Tech SaaS',         emoji:'💻', color:'var(--blue)',   desc:'Recurring software revenue. High margins. Churn is your enemy.', models:['saas'], skills:['vision','execution'], marginMin:0.75, marginMax:0.85, marketSizeM:500, churnBase:0.08, investorAppeal:'vc' },
    ecom:     { name:'E-commerce',        emoji:'🛒', color:'var(--amber)',  desc:'Direct-to-consumer products. CAC vs LTV is everything.', models:['d2c'], skills:['execution','salescraft'], marginMin:0.35, marginMax:0.55, marketSizeM:50, churnBase:0.25, investorAppeal:'angel' },
    agency:   { name:'Consulting/Agency', emoji:'🤝', color:'var(--green)',  desc:'Sell your time and expertise. Utilisation is the metric.', models:['retainer'], skills:['salescraft','networking'], marginMin:0.55, marginMax:0.70, marketSizeM:20, churnBase:0.15, investorAppeal:'angel' },
    mktplace: { name:'Marketplace',       emoji:'🏪', color:'var(--purple)', desc:'Connect buyers and sellers. Network effects compound.', models:['marketplace'], skills:['vision','execution'], marginMin:0.70, marginMax:0.80, marketSizeM:200, churnBase:0.12, investorAppeal:'vc' },
    food:     { name:'Food & Bev',        emoji:'🍽️', color:'var(--red)',    desc:'Restaurants, brands, and hospitality. Location is everything.', models:['d2c'], skills:['execution','salescraft'], marginMin:0.60, marginMax:0.72, marketSizeM:30, churnBase:0.20, investorAppeal:'angel' },
    health:   { name:'Health & Wellness', emoji:'🏥', color:'var(--green)',  desc:'Healthcare and wellness. Regulatory events change the game.', models:['saas','d2c'], skills:['salescraft','vision'], marginMin:0.65, marginMax:0.75, marketSizeM:80, churnBase:0.10, investorAppeal:'vc' },
    proptech: { name:'PropTech',          emoji:'🏠', color:'var(--amber)',  desc:'Property technology. Ties into your real estate portfolio.', models:['licensing','saas'], skills:['finance','networking'], marginMin:0.70, marginMax:0.85, marketSizeM:100, churnBase:0.06, investorAppeal:'pe' },
    retail:   { name:'Retail Brand',      emoji:'🏬', color:'var(--pink)',   desc:'Consumer brand. Brand score drives premium pricing power.', models:['d2c'], skills:['salescraft','execution'], marginMin:0.50, marginMax:0.65, marketSizeM:50, churnBase:0.22, investorAppeal:'pe' },
    media:    { name:'Media/Content',     emoji:'📺', color:'var(--blue)',   desc:'Content and media. Your social fame directly boosts reach.', models:['marketplace'], skills:['vision','salescraft'], marginMin:0.60, marginMax:0.75, marketSizeM:100, churnBase:0.18, investorAppeal:'vc' },
    edtech:   { name:'EdTech',            emoji:'📚', color:'var(--green)',  desc:'Education technology. Cohort completion is the key metric.', models:['saas','d2c'], skills:['vision','salescraft'], marginMin:0.65, marginMax:0.80, marketSizeM:150, churnBase:0.12, investorAppeal:'vc' },
    fintech:  { name:'FinTech',           emoji:'💳', color:'var(--blue)',   desc:'Financial technology. Regulatory events will test you.', models:['saas'], skills:['vision','finance'], marginMin:0.70, marginMax:0.90, marketSizeM:500, churnBase:0.06, investorAppeal:'vc' },
    gaming:   { name:'Gaming Studio',     emoji:'🎮', color:'var(--purple)', desc:'Game development. Syncs with your indie dev experience.', models:['unit_sales','d2c'], skills:['vision','execution'], marginMin:0.60, marginMax:0.75, marketSizeM:200, churnBase:0.30, investorAppeal:'vc' },
    manufact: { name:'Manufacturing',     emoji:'🏭', color:'var(--amber)',  desc:'Physical goods. Supply chain events are your risk.', models:['unit_sales'], skills:['execution','finance'], marginMin:0.25, marginMax:0.45, marketSizeM:100, churnBase:0.15, investorAppeal:'pe' },
    logistics:{ name:'Logistics',         emoji:'🚚', color:'var(--amber)',  desc:'Delivery and logistics. Route efficiency drives margin.', models:['unit_sales'], skills:['execution','finance'], marginMin:0.15, marginMax:0.30, marketSizeM:200, churnBase:0.12, investorAppeal:'pe' },
    deeptech: { name:'AI / Deep Tech',    emoji:'🤖', color:'var(--blue)',   desc:'IP-heavy technology. Licensing income once proven.', models:['licensing','saas'], skills:['vision','execution'], marginMin:0.80, marginMax:0.95, marketSizeM:1000, churnBase:0.04, investorAppeal:'vc' },
    greentech:{ name:'Sustainability',    emoji:'🌱', color:'var(--green)',  desc:'Green tech. ESG score unlocks government grants.', models:['licensing','d2c'], skills:['vision','networking'], marginMin:0.55, marginMax:0.70, marketSizeM:50, churnBase:0.08, investorAppeal:'angel' },
    social_e: { name:'Social Enterprise', emoji:'🤲', color:'var(--green)',  desc:'Mission-driven. High karma = better staff and grants.', models:['d2c','retainer'], skills:['networking','salescraft'], marginMin:0.30, marginMax:0.50, marketSizeM:10, churnBase:0.10, investorAppeal:'angel' },
  };

  // v18.69 — industry server/cloud upkeep as a fraction of revenue (compute-heavy fields pay most).
  var INFRA_RATE_V1869 = {
    deeptech: 0.045, gaming: 0.030, media: 0.025, saas: 0.022, fintech: 0.020,
    mktplace: 0.018, edtech: 0.015, health: 0.015, proptech: 0.012, greentech: 0.012,
    logistics: 0.010, ecom: 0.010, social_e: 0.008, retail: 0.008, food: 0.006,
    manufact: 0.006, agency: 0.004
  };
  // v18.69 — what each industry "ships" and which lever it pulls when live.
  var FEATURE_TYPE_V1869 = {
    saas: { noun: "integration", kind: "digital" }, deeptech: { noun: "model upgrade", kind: "digital" },
    fintech: { noun: "feature", kind: "digital" }, edtech: { noun: "course module", kind: "digital" },
    proptech: { noun: "feature", kind: "digital" }, media: { noun: "original show", kind: "digital" },
    mktplace: { noun: "marketplace feature", kind: "digital" }, health: { noun: "care feature", kind: "digital" },
    ecom: { noun: "product line", kind: "product" }, retail: { noun: "collection", kind: "product" },
    food: { noun: "menu launch", kind: "product" }, manufact: { noun: "product line", kind: "product" },
    logistics: { noun: "route service", kind: "product" }, gaming: { noun: "game update", kind: "product" },
    agency: { noun: "service offering", kind: "service" }, greentech: { noun: "green initiative", kind: "service" },
    social_e: { noun: "community program", kind: "service" }
  };

  var BIZ_MODEL_INFO = {
    saas:       { name:'SaaS / Subscription', emoji:'🔄', desc:'Monthly recurring revenue. Predictable. Churn kills you slowly.', kpis:['MRR','Churn%','NRR'] },
    d2c:        { name:'Direct-to-Consumer',  emoji:'🛒', desc:'Sell products or services directly. CAC/LTV ratio is survival.', kpis:['CAC','LTV','Conv%'] },
    retainer:   { name:'Retainer / B2B',      emoji:'🤝', desc:'Recurring contracts. Utilisation rate determines profitability.', kpis:['Clients','Util%','Concentration'] },
    marketplace:{ name:'Marketplace/Platform',emoji:'🏪', desc:'Take a cut of transactions. GMV grows with network effects.', kpis:['GMV','TakeRate','Supply'] },
    licensing:  { name:'Licensing / IP',      emoji:'📜', desc:'Pure passive income once IP is developed. No marginal cost.', kpis:['Licensees','RenewalRate','IPDepth'] },
    unit_sales: { name:'Unit Sales',          emoji:'📦', desc:'Sell physical or one-off digital units. Margins vary widely.', kpis:['Units','GrossMargin%','Inventory'] },
    // ----- expanded model types (more ways to make money) -----
    freemium:   { name:'Freemium',            emoji:'🎁', desc:'Free tier hooks a huge audience; a small % upgrade to paid. Needs scale.', kpis:['Signups','Conv%','ARPU'] },
    ads:        { name:'Ads / Sponsorship',   emoji:'📢', desc:'Free for users — you sell their attention. Revenue scales with audience, not price.', kpis:['Audience','RPM','FillRate'] },
    usage:      { name:'Usage-Based',          emoji:'⚡', desc:'Charge for what customers actually use. Revenue grows as they grow.', kpis:['ActiveUsers','UsagePerUser','UnitPrice'] },
    transaction:{ name:'Transaction Fee',      emoji:'💳', desc:'Take a small cut of every payment you process. Volume is everything.', kpis:['TPV','TakeRate','Volume'] },
    franchise:  { name:'Franchise',            emoji:'🏬', desc:'License your brand to operators for fees plus a royalty on their sales.', kpis:['Units','RoyaltyRate','UnitRev'] },
    affiliate:  { name:'Affiliate / Referral', emoji:'🔗', desc:'Earn commission sending customers to others. Cheap to run, thin margins.', kpis:['Clicks','Conv%','Commission'] },
  };

  // Revenue models offered per industry (step 2 of the wizard). Mix of fitting
  // classic + expanded models so each industry has real, distinct choices.
  var BIZ_MODELS_BY_TYPE = {
    saas:     ['saas','freemium','usage','marketplace'],
    ecom:     ['d2c','marketplace','affiliate','unit_sales'],
    agency:   ['retainer','usage','affiliate'],
    mktplace: ['marketplace','transaction','ads','affiliate'],
    food:     ['d2c','franchise','unit_sales'],
    health:   ['saas','d2c','freemium','retainer'],
    proptech: ['saas','licensing','transaction','retainer'],
    retail:   ['d2c','franchise','unit_sales','affiliate'],
    media:    ['ads','saas','freemium','affiliate'],
    edtech:   ['saas','d2c','freemium','licensing'],
    fintech:  ['saas','transaction','usage','freemium'],
    gaming:   ['unit_sales','freemium','ads','usage'],
    manufact: ['unit_sales','d2c','licensing'],
    logistics:['usage','transaction','unit_sales','retainer'],
    deeptech: ['licensing','saas','usage'],
    greentech:['licensing','d2c','usage','unit_sales'],
    social_e: ['d2c','retainer','franchise','affiliate'],
  };
  function modelsForType(typeId) {
    var list = BIZ_MODELS_BY_TYPE[typeId] || (BIZ_TYPES[typeId] && BIZ_TYPES[typeId].models) || ['saas'];
    return list.filter(function (m) { return !!BIZ_MODEL_INFO[m]; });
  }

  // ---------------------------------------- competitors / business / state ---
  function _genCompetitors(type) {
    var names = {
      saas:['Salesforce','HubSpot','Zendesk'], ecom:['Amazon','ASOS','Shopify'],
      agency:['McKinsey','Deloitte','WPP'], mktplace:['eBay','Etsy','TaskRabbit'],
      food:['Pret A Manger','Nandos','Greggs'], health:['Headspace','Hims','Noom'],
      proptech:['Rightmove','Zoopla','Purplebricks'], retail:['Next','ASOS','Primark'],
      media:['BuzzFeed','Vice','Condé Nast'], edtech:['Coursera','Udemy','Duolingo'],
      fintech:['Monzo','Revolut','Starling'], gaming:['Indie Studios','EA','Ubisoft'],
      manufact:['Generic Corp','BigManu','Foxconn'], logistics:['DHL','Hermes','Yodel'],
      deeptech:['DeepMind','OpenAI','Palantir'], greentech:['Vestas','Orsted','Climeworks'],
      social_e:['Local Charity','Community CIC','GoodCo'],
    };
    var pool = names[type] || ['Competitor A','Competitor B','Competitor C'];
    return pool.slice(0, 2).map(function (nm) { return { name: nm, strength: rnd(40, 80), marketShare: rnd(10, 30) }; });
  }
  // v18.69 — names for fresh rivals that emerge over time / after you acquire someone.
  var NEW_RIVAL_NAMES_V1869 = ['Nova', 'Vertex', 'Apex', 'Quantum', 'Pinnacle', 'Catalyst', 'Horizon', 'Summit', 'Forge', 'Beacon', 'Pulse', 'Zenith', 'Atlas', 'Cobalt', 'Onyx', 'Vanguard', 'Helix', 'Orbit'];
  // Keep the competitive field alive: rivals drift, and new ones enter open market share (esp. after acquisitions).
  function _bizCompetitorDynamicsV1869(biz) {
    if (!Array.isArray(biz.competitors)) biz.competitors = [];
    var comps = biz.competitors;
    comps.forEach(function (c) {
      c.marketShare = Math.max(2, Math.min(45, Math.round(num(c.marketShare) + rnd(-2, 3))));
      c.strength = Math.max(20, Math.min(95, Math.round(num(c.strength) + rnd(-3, 3))));
    });
    var claimed = num(biz.marketShare) + comps.reduce(function (s, c) { return s + num(c.marketShare); }, 0);
    var unclaimed = Math.max(0, 100 - claimed);
    if (comps.length < 3 && unclaimed > 10 && Math.random() < 0.28) {
      var used = {}; comps.forEach(function (c) { used[c.name] = 1; });
      var suffixes = [' Labs', ' Inc', ' Co', ' Group', ' AI', ' Systems'];
      var name = "", guard = 0;
      do { name = NEW_RIVAL_NAMES_V1869[Math.floor(Math.random() * NEW_RIVAL_NAMES_V1869.length)] + suffixes[Math.floor(Math.random() * suffixes.length)]; } while (used[name] && guard++ < 8);
      var share = Math.max(6, Math.min(Math.round(unclaimed * 0.55), rnd(8, 22)));
      comps.push({ name: name, strength: rnd(45, 80), marketShare: share });
      try { log("🏴 A new competitor, " + name + ", entered " + biz.name + "'s market with ~" + share + "% share."); } catch (e) {}
    }
  }

  function _newBizObj(name, type, model, startCash) {
    var t = BIZ_TYPES[type] || BIZ_TYPES.saas;
    var uid = 'biz_' + Date.now() + '_' + rnd(100, 999);
    var gm = t.marginMin + Math.random() * (t.marginMax - t.marginMin);
    return {
      uid: uid, name: name, type: type, model: model,
      stage: 'idea', // idea → pre-revenue → early → growth → scale → mature → exit
      founded: age(), yearsOld: 0, active: true, dead: false,
      productName: name, productStage: 'concept',
      productQuality: 20 + rnd(0, 15), productDev: 0, nps: rnd(-10, 20), techDebt: 0,
      annualRevenue: 0, annualCosts: 0, annualProfit: 0,
      grossMargin: gm, burnRate: 0, runway: 999, cashInBusiness: num(startCash),
      lifetimeRevenue: 0, revenueHistory: [],
      customers: 0, churnRate: t.churnBase, cac: 0, ltv: 0, waitlist: rnd(0, 50), mrr: 0,
      _mktgBudget: 0, _avgOrderValue: 200, _avgContractValue: 50000,
      _avgTransactionValue: 50, _avgSellingPrice: 200,
      _devAlloc: { features: 40, bugfix: 20, ux: 20, custdev: 20 },
      employees: [], headcount: 0, culture: 60, productivity: 70, coFounders: [],
      equity: 100, // founder's %
      valuation: 0, totalRaised: 0, fundingRounds: [], investors: [], boardSeats: 0,
      marketShare: 0, marketSize: t.marketSizeM * 1000000,
      competitors: _genCompetitors(type), competitivePos: 50,
      brand: 20, pr: 50, crisisActive: false, crisisType: null,
      exitReady: false, acquisitionOffer: null, ipoReady: false,
      franchiseActive: false, franchiseUnits: 0,
      milestones: [], lastEventAge: -99, pivotHistory: [],
    };
  }

  function initBiz() {
    var f = fin();
    if (!f.bizV1860 || typeof f.bizV1860 !== "object" || Array.isArray(f.bizV1860)) {
      f.bizV1860 = {
      active: false, _paused: false, yearsAsFounder: 0,
      lifetimeRevenue: 0, lifetimeProfit: 0,
      exitHistory: [], totalExits: 0,
      businesses: [], activeBizId: null,
      skills: { vision: 1, execution: 1, salescraft: 1, leadership: 1, finance: 1, networking: 1 },
      founderReputation: 30, pressFeatures: [], speakingFees: 0, advisorRoles: [],
      };
    }
    if (!Array.isArray(f.bizV1860.businesses)) f.bizV1860.businesses = [];
    if (!f.bizV1860.skills || typeof f.bizV1860.skills !== "object") f.bizV1860.skills = { vision: 1, execution: 1, salescraft: 1, leadership: 1, finance: 1, networking: 1 };
    migrateOldBusinessesV1861(f.bizV1860);
    return f.bizV1860;
  }

  function bizValueV1861(b) {
    return Math.max(0, round(num(b && (b.valuation || b.value || b.marketValue || b.companyValue)) + num(b && (b.cashInBusiness || b.retainedEarnings || b.companyCash || b.cash))));
  }

  function sourceKeyV1861(prefix, id) {
    return prefix + ":" + String(id || "").replace(/\s+/g, "_").slice(0, 80);
  }

  function typeFromLegacyV1861(b) {
    var text = String((b && (b.baseId || b.id || b.category || b.sector || b.name)) || "").toLowerCase();
    if (/food|restaurant|bakery|coffee|bar|brewery|catering/.test(text)) return "food";
    if (/game|media|podcast|content|studio|label|creative/.test(text)) return "media";
    if (/shop|retail|store|ecom|brand|commerce|boutique|jewelry|sneaker/.test(text)) return "ecom";
    if (/health|wellness|clinic|fitness/.test(text)) return "health";
    if (/property|real estate|apartment|storage|re/.test(text)) return "proptech";
    if (/finance|fund|wealth|accounting|insurance|vc|hedge/.test(text)) return "fintech";
    if (/ai|cloud|cyber|software|tech|startup|saas|dev/.test(text)) return "saas";
    if (/logistics|delivery|shipping/.test(text)) return "logistics";
    if (/manufact|factory|industrial/.test(text)) return "manufact";
    return "agency";
  }

  // Convert every legacy stage vocabulary (venture spine, startup-founder, core
  // catalog) into the new entrepreneur spine: idea → pre-revenue → early →
  // growth → scale → mature → exit.
  var LEGACY_STAGE_MAP_V1861 = {
    idea: "idea", concept: "idea",
    "pre-revenue": "pre-revenue", prerevenue: "pre-revenue", "pre-seed": "pre-revenue", preseed: "pre-revenue",
    startup: "early", building: "early", launched: "early", seed: "early", "early": "early",
    growing: "growth", growth: "growth",
    established: "scale", breakout: "scale", scale: "scale",
    mature: "mature", declining: "mature",
    exited: "exit", exit: "exit", dead: "exit", acquired: "exit", sold: "exit"
  };
  function stageFromLegacyV1861(b) {
    var stage = String((b && (b.stageV1860 || b.stage)) || "").toLowerCase().trim();
    return LEGACY_STAGE_MAP_V1861[stage] || "early";
  }

  function migrateLegacyBusinessV1861(b, B, prefix) {
    if (!b || b._migratedToBizV1861) return null;
    var key = sourceKeyV1861(prefix, b.id || b.uid || b.name);
    if ((B.businesses || []).some(function (x) { return x && x.sourceKeyV1861 === key; })) {
      b._migratedToBizV1861 = key;
      return null;
    }
    var type = typeFromLegacyV1861(b);
    var model = type === "saas" || type === "fintech" || type === "edtech" ? "saas" : type === "media" ? "marketplace" : type === "agency" ? "retainer" : "d2c";
    var val = bizValueV1861(b);
    var migrated = _newBizObj(b.name || b.id || "Migrated Business", type, model, Math.max(0, num(b.retainedEarnings || b.companyCash || b.cash)));
    migrated.uid = key;
    migrated.sourceKeyV1861 = key;
    migrated.sourceSystemV1861 = prefix;
    migrated.legacyIdV1861 = b.id || b.uid || "";
    migrated.stage = stageFromLegacyV1861(b);
    migrated.productStage = "live";
    migrated.productDev = Math.max(300, num(migrated.productDev));
    migrated.productQuality = Math.max(35, Math.min(95, num(b.reputation, 45) + 15));
    migrated.valuation = Math.max(val, num(b.value || b.valuation));
    migrated.cashInBusiness = Math.max(0, num(b.retainedEarnings || b.companyCash || b.cash));
    migrated.annualRevenue = Math.max(0, num(b.lastRevenue || b.annualRevenue));
    migrated.annualProfit = num(b.lastIncome || b.annualProfit || 0);
    migrated.yearsOld = Math.max(0, round(num(b.years || b.yearsOld)));
    migrated.brand = Math.max(20, Math.min(95, num(b.reputation, 35)));
    migrated.customers = Math.max(1, round(num(b.customers || b.clients || b.locations || 1) * 12));
    migrated.active = b.active !== false && b.dead !== true;
    migrated.dead = b.dead === true;
    migrated._migratedFromLegacy = true;
    B.businesses.push(migrated);
    b._migratedToBizV1861 = key;
    return migrated;
  }

  function migrateOldBusinessesV1861(B) {
    var f = fin();
    if (!B || B._migrationCheckedV1861) return B;
    B.businesses = Array.isArray(B.businesses) ? B.businesses : [];
    var count = 0;
    // NOTE: the old Business system (finance.businesses[]) is intentionally NOT
    // migrated — Business and Entrepreneurship are separate and never share
    // companies. Only the old single-startup founder system (startupV1856.co),
    // which Entrepreneurship now replaces, carries forward into bizV1860.
    var sf = f.startupV1856 || {};
    if (sf.co && typeof sf.co === "object") {
      var co = sf.co;
      var key = sourceKeyV1861("startupV1856", co.name || co.type);
      if (!B.businesses.some(function (x) { return x.sourceKeyV1861 === key; })) {
        var active = _newBizObj(co.name || "Startup", typeFromLegacyV1861({ id: co.type || "saas" }), "saas", num(co.cash));
        active.uid = key;
        active.sourceKeyV1861 = key;
        active.sourceSystemV1861 = "startupV1856";
        active.stage = stageFromLegacyV1861({ stage: co.stage });
        active.productStage = co.productStage === "launched" || co.revenue > 0 ? "live" : "mvp";
        active.productDev = Math.max(0, num(co.productDev));
        active.productQuality = Math.max(20, num(co.productQuality));
        active.valuation = Math.max(0, num(co.valuation));
        active.cashInBusiness = Math.max(0, num(co.cash));
        active.annualRevenue = Math.max(0, num(co.revenue));
        active.equity = Math.max(1, Math.min(100, num(co.equity, 100)));
        active.active = true;
        active._migratedFromLegacy = true;
        B.businesses.push(active);
        sf._migratedToBizV1861 = key;
        count += 1;
      }
    }
    B._migrationCheckedV1861 = true;
    B._lastMigrationCountV1861 = count;
    if (!B.activeBizId) {
      var first = B.businesses.find(function (b) { return b && b.active && !b.dead; });
      if (first) B.activeBizId = first.uid;
    }
    B.active = B.businesses.some(function (b) { return b && b.active && !b.dead; });
    return B;
  }

  // Signature used to spot duplicate companies after migration: a migrated firm
  // is keyed by its source; everything else falls back to name + type.
  function bizSignatureV1861(b) {
    if (!b) return "";
    if (b.sourceKeyV1861) return "src:" + b.sourceKeyV1861;
    return "nt:" + String(b.name || "").toLowerCase().replace(/\s+/g, " ").trim() + "|" + String(b.typeId || b.type || "").toLowerCase();
  }

  // Count duplicate companies (entries beyond the first in each signature group).
  function duplicateBusinessesV1861(B) {
    B = B || initBiz();
    var seen = {}, dupes = 0;
    (B.businesses || []).forEach(function (b) {
      var sig = bizSignatureV1861(b);
      if (!sig) return;
      if (seen[sig]) dupes += 1; else seen[sig] = true;
    });
    return dupes;
  }

  // Repair tooling: collapse duplicate companies created by re-running migration
  // or by overlapping legacy sources. Keeps the strongest copy per signature
  // (active/not-dead first, then highest total value) and drops the rest,
  // re-pointing the active selection if it was removed.
  function repairDuplicateBusinessesV1861(B) {
    B = B || initBiz();
    var list = Array.isArray(B.businesses) ? B.businesses : [];
    var groups = {};
    list.forEach(function (b) {
      var sig = bizSignatureV1861(b);
      if (!sig) return;
      (groups[sig] = groups[sig] || []).push(b);
    });
    var keep = [], removed = 0, removedUids = {};
    Object.keys(groups).forEach(function (sig) {
      var g = groups[sig];
      if (g.length === 1) { keep.push(g[0]); return; }
      g.sort(function (a, b) {
        var aLive = (a.active !== false && !a.dead) ? 1 : 0;
        var bLive = (b.active !== false && !b.dead) ? 1 : 0;
        if (aLive !== bLive) return bLive - aLive;
        return bizValueV1861(b) - bizValueV1861(a);
      });
      keep.push(g[0]);
      for (var i = 1; i < g.length; i++) { removed += 1; if (g[i] && g[i].uid) removedUids[g[i].uid] = true; }
    });
    // Preserve original order for the survivors.
    var order = {}; list.forEach(function (b, i) { order[bizSignatureV1861(b)] = order[bizSignatureV1861(b)] == null ? i : order[bizSignatureV1861(b)]; });
    keep.sort(function (a, b) { return (order[bizSignatureV1861(a)] || 0) - (order[bizSignatureV1861(b)] || 0); });
    B.businesses = keep;
    if (B.activeBizId && removedUids[B.activeBizId]) {
      var first = keep.find(function (b) { return b && b.active !== false && !b.dead; }) || keep[0] || null;
      B.activeBizId = first ? first.uid : null;
    }
    B.active = keep.some(function (b) { return b && b.active !== false && !b.dead; });
    return removed;
  }

  function oldBusinessCheckV1861() {
    var f = fin();
    var B = initBiz();
    // Only the old founder startup (startupV1856.co) carries into Entrepreneurship;
    // the old Business system (finance.businesses[]) stays in Business and is not
    // counted here.
    var oldCount = (f.startupV1856 && f.startupV1856.co && !f.startupV1856._migratedToBizV1861) ? 1 : 0;
    var migrated = (B.businesses || []).filter(function (b) { return b && b._migratedFromLegacy; }).length;
    var duplicates = duplicateBusinessesV1861(B);
    return { oldCount: oldCount, migrated: migrated, duplicates: duplicates, newCount: (B.businesses || []).length, ok: (oldCount === 0 || migrated > 0) && duplicates === 0 };
  }

  window.migrateOldBusinessesV1861 = function () { var B = initBiz(); B._migrationCheckedV1861 = false; migrateOldBusinessesV1861(B); saveGame(); rerender(); return oldBusinessCheckV1861(); };
  window.repairDuplicateBusinessesV1861 = function () {
    var B = initBiz();
    var removed = repairDuplicateBusinessesV1861(B);
    if (removed > 0) { toast("Merged " + removed + " duplicate " + (removed === 1 ? "company" : "companies") + "."); saveGame(); rerender(); }
    else toast("No duplicate companies found.");
    return oldBusinessCheckV1861();
  };
  window.oldBusinessCheckV1861 = oldBusinessCheckV1861;
  // Value of your bizV1860 holdings for net-worth/finance summaries. Private
  // companies count their full enterprise value; PUBLIC companies count only the
  // player's tradable stake (shares x live price) so it can't double-count with
  // the stock holding and moves with the share price.
  window.bizV1860StakeValueV1861 = function (b) {
    if (!b || b.active === false || b.dead) return 0;
    if (b.public && b.shareTicker) {
      var m = (fin().stocksV18) || {}; var h = (m.holdings || []).find(function (x) { return x.id === b.shareTicker; });
      var price = num((m.prices || {})[b.shareTicker]) || num(b._ipoPrice);
      return Math.max(0, round((h ? num(h.shares) : 0) * price));
    }
    return bizValueV1861(b);
  };
  window.bizV1860PortfolioValue = function () {
    var B = initBiz();
    return (B.businesses || []).reduce(function (sum, b) { return sum + window.bizV1860StakeValueV1861(b); }, 0);
  };

  function getActiveBiz() {
    var B = fin().bizV1860;
    if (!B) return null;
    if (B.activeBizId) {
      var b = (B.businesses || []).find(function (x) { return x.uid === B.activeBizId; });
      if (b && b.active) return b;
    }
    return (B.businesses || []).find(function (b) { return b.active; }) || null;
  }

  // ----------------------------------------------- creation wizard (Phase B) --
  function toast(msg) { try { if (typeof window.addToast === "function") return window.addToast(msg); } catch (e) {} try { if (typeof window.addLog === "function") window.addLog(msg, {}); } catch (e2) {} }
  function log(msg, d) { try { if (typeof window.addLog === "function") window.addLog(msg, d || {}); } catch (e) {} }
  function rerender() { try { if (typeof window.render === "function") window.render(); } catch (e) {} }
  function saveGame() { try { if (typeof window.save === "function") window.save(); } catch (e) {} }
  function fmt(v) { return moneyText(v); }
  function escH(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" })[c]; }); }
  function wiz() { var B = initBiz(); return (B._wizard && typeof B._wizard === "object") ? B._wizard : null; }
  function setWiz(w) { initBiz()._wizard = w; }
  function canFound() { return age() >= 18 && smarts() >= 55 && wealth() >= 5000; }

  window.startEntrepreneurV1861 = function () {
    if (!canFound()) { toast("Need Age 18+, Smarts 55+, " + currencySymbol() + "5,000+ to found a business."); return; }
    initBiz();
    setWiz({ step: 1, typeId: null, model: null, name: null, coFounders: [], equityTaken: 0, startCash: 0 });
    rerender();
  };
  window.bizWizardCancelV1861 = function () { setWiz(null); rerender(); };
  window.bizWizardBackV1861 = function () { var w = wiz(); if (!w) return; w.step = Math.max(1, num(w.step) - 1); setWiz(w); rerender(); };
  window.bizWizardPickTypeV1861 = function (id) { var w = wiz(); if (!w) return; w.typeId = id; w.step = 2; setWiz(w); rerender(); };
  window.bizWizardPickModelV1861 = function (m) { var w = wiz(); if (!w) return; w.model = m; w.step = 3; setWiz(w); rerender(); };
  window.bizWizardPickNameV1861 = function (nm) { var w = wiz(); if (!w) return; w.name = nm; w.step = 4; setWiz(w); rerender(); };
  window.bizWizardCustomNameV1861 = function () { var w = wiz(); if (!w) return; var nm = ""; try { nm = window.prompt("Name your business:") || ""; } catch (e) {} nm = String(nm).trim(); if (!nm) return; w.name = nm; w.step = 4; setWiz(w); rerender(); };
  window.bizWizardPickCoFounderV1861 = function (kind) {
    var w = wiz(); if (!w) return;
    if (kind === "tech") w.coFounders = [{ name: pickOne(['Alex Chen','Sam Rivera','Jordan Lee','Taylor Kim']), equity: 30, role: 'CTO', loyalty: rnd(60, 90) }];
    else if (kind === "biz") w.coFounders = [{ name: pickOne(['Morgan Blake','Casey Hart','Drew Ellis','Avery Stone']), equity: 25, role: 'COO', loyalty: rnd(60, 90) }];
    else w.coFounders = [];
    w.equityTaken = w.coFounders.reduce(function (s, c) { return s + c.equity; }, 0);
    w.step = 5; setWiz(w); rerender();
  };
  window.bizWizardPickCapitalV1861 = function (kind) {
    var w = wiz(); if (!w) return; var s = S();
    if (kind === "bootstrap") {
      if (wealth() < 5000) { toast("Need at least " + currencySymbol() + "5,000."); return; }
      var amt = Math.min(wealth(), 25000); s.money = round(wealth() - amt); w.startCash = amt; w._capital = "bootstrap";
    } else if (kind === "angel") {
      var B = initBiz(); B.skills.networking = Math.min(10, num(B.skills.networking, 1) + 1);
      w.equityTaken = num(w.equityTaken) + 10; w.startCash = 50000; w._capital = "angel";
    } else if (kind === "loan") {
      var B2 = initBiz(); B2._loanBalance = num(B2._loanBalance) + 75000; B2._loanMonthly = Math.round(75000 / 60);
      w.startCash = 75000; w._capital = "loan";
    }
    w.step = 6; setWiz(w); rerender();
  };
  // Custom bootstrap amount: invest as much of your own cash as you want.
  window.bizWizardCustomBootstrapV1861 = function (inputId) {
    var w = wiz(); if (!w) return;
    var el = typeof document !== "undefined" ? document.getElementById(inputId) : null;
    var amt = round(el ? String(el.value || "").replace(/[^0-9.]/g, "") : 0);
    if (!amt || amt < 1000) { toast("Enter at least " + currencySymbol() + "1,000 to bootstrap."); return; }
    amt = Math.min(amt, Math.max(0, round(wealth())));
    if (amt <= 0) { toast("Not enough personal cash."); return; }
    setMoney(wealth() - amt);
    w.startCash = amt; w._capital = "bootstrap";
    if (el) el.value = "";
    w.step = 6; setWiz(w); rerender();
  };
  window.bizWizardPickFocusV1861 = function (kind) {
    var w = wiz(); if (!w) return;
    var biz = _createBiz(w.typeId, w.model, w.name || "New Venture", w.coFounders, num(w.equityTaken), num(w.startCash));
    if (kind === "build") { biz._devAlloc = { features: 60, bugfix: 10, ux: 20, custdev: 10 }; biz.productDev += 20; }
    else if (kind === "customers") { biz._devAlloc = { features: 20, bugfix: 10, ux: 20, custdev: 50 }; biz.waitlist += rnd(20, 80); biz.nps += rnd(5, 15); }
    else if (kind === "revenue") { biz._devAlloc = { features: 30, bugfix: 10, ux: 10, custdev: 50 }; biz.customers = rnd(1, 5); biz.stage = "pre-revenue"; }
    _launchBiz(biz);
  };

  function _createBiz(typeId, model, bizName, coFounders, equityTaken, startCash) {
    var biz = _newBizObj(bizName, typeId, model, startCash);
    biz.coFounders = coFounders || [];
    biz.equity = 100 - num(equityTaken);
    return biz;
  }
  function _launchBiz(biz) {
    var B = initBiz();
    B.businesses.push(biz);
    B.activeBizId = biz.uid;
    B.active = true;
    setWiz(null);
    try { if (typeof window.awardMilestone === "function") window.awardMilestone("founder_first", "Founder", "You founded a company.", 40); } catch (e) {}
    log("🏢 " + biz.name + " is founded. " + (biz.coFounders.length ? "With co-founder " + biz.coFounders[0].name + " (" + biz.coFounders[0].equity + "% equity)." : "Solo founder.") + " Cash: " + fmt(biz.cashInBusiness) + ".", { confidence: 3 });
    try { if (typeof window.applyDeltas === "function") window.applyDeltas({ confidence: 3, stress: 2 }); } catch (e2) {}
    saveGame();
    try { if (typeof window.setTab === "function") window.setTab("entrepreneurship"); else rerender(); } catch (e3) { rerender(); }
  }

  function btnH(label, handler) { return '<button class="icon-btn" onclick="event.preventDefault();event.stopPropagation();' + handler + '">' + escH(label) + '</button>'; }
  // Rich option card for the wizard: title + description + small sub-line.
  function wizOpt(title, desc, sub, handler) {
    return '<button class="biz1861-wizopt" onclick="event.preventDefault();event.stopPropagation();' + handler + '">' +
      '<b>' + title + '</b>' +
      (desc ? '<span>' + desc + '</span>' : '') +
      (sub ? '<em>' + sub + '</em>' : '') + '</button>';
  }
  function renderWizardV1861() {
    var w = wiz();
    if (!w) {
      if (!canFound() && !getActiveBiz()) return "";
      if (getActiveBiz()) return "";
      return '<section class="panel"><div class="section-label">🏢 Entrepreneurship</div><div class="row"><div><div class="row-title">Found a business</div><div class="row-sub">Build a company from idea to exit. Requires Age 18+, Smarts 55+, ' + currencySymbol() + '5,000+.</div></div><div class="mini-actions">' + btnH("Found a Business", "startEntrepreneurV1861()") + '</div></div></section>';
    }
    var head = '<section class="panel"><div class="section-label">🏢 Found Your Business — Step ' + num(w.step) + '/6</div>';
    var foot = '<div class="mini-actions" style="margin-top:10px">' + (num(w.step) > 1 ? btnH("← Back", "bizWizardBackV1861()") : "") + btnH("Cancel", "bizWizardCancelV1861()") + '</div></section>';
    var body = "";
    if (w.step === 1) {
      body = '<div class="row-sub">Choose your industry — it shapes your revenue models, margins, and competitive landscape.</div><div class="biz1861-wizgrid">';
      Object.keys(BIZ_TYPES).forEach(function (id) {
        var t = BIZ_TYPES[id];
        var sub = "Margin " + Math.round(t.marginMin * 100) + "–" + Math.round(t.marginMax * 100) + "% · Market " + (t.marketSizeM >= 1000 ? (t.marketSizeM / 1000) + "B" : t.marketSizeM + "M");
        body += wizOpt(escH(t.emoji + " " + t.name), escH(t.desc || ""), escH(sub), "bizWizardPickTypeV1861('" + id + "')");
      });
      body += '</div>';
    } else if (w.step === 2) {
      var t2 = BIZ_TYPES[w.typeId] || {};
      body = '<div class="row-sub">' + escH(t2.name) + " — pick how you make money. Each model changes your revenue mechanics and key metrics.</div><div class=\"biz1861-wizgrid\">";
      modelsForType(w.typeId).forEach(function (m) {
        var info = BIZ_MODEL_INFO[m] || { emoji: "", name: m, desc: "", kpis: [] };
        var sub = (info.kpis && info.kpis.length) ? "Track: " + info.kpis.join(" · ") : "";
        body += wizOpt(escH(info.emoji + " " + info.name), escH(info.desc || ""), escH(sub), "bizWizardPickModelV1861('" + m + "')");
      });
      body += '</div>';
    } else if (w.step === 3) {
      var sugg = (BIZ_TYPES[w.typeId] ? (BIZ_NAME_SUGGESTIONS[w.typeId] || []) : []).slice(0, 5);
      body = '<div class="row-sub">Name your business.</div><div class="mini-actions" style="flex-wrap:wrap;gap:6px;margin-top:8px">';
      sugg.forEach(function (nm) { body += btnH('"' + nm + '"', "bizWizardPickNameV1861('" + escH(nm).replace(/'/g, "\\'") + "')"); });
      body += btnH("✏️ Custom name", "bizWizardCustomNameV1861()");
      body += '</div>';
    } else if (w.step === 4) {
      body = '<div class="row-sub">Building "' + escH(w.name) + '" — bring on a co-founder? They take equity but make the company stronger.</div><div class="biz1861-wizgrid">' +
        wizOpt("🚀 Go solo", "Keep 100% of the equity. Every decision and all the work is yours.", "Equity kept: 100%", "bizWizardPickCoFounderV1861('solo')") +
        wizOpt("🤝 Technical CTO", "Faster product development and less tech debt. Strong for product-heavy plays.", "Costs 30% equity", "bizWizardPickCoFounderV1861('tech')") +
        wizOpt("💼 Business COO", "Better sales, operations and fundraising. Strong for go-to-market plays.", "Costs 25% equity", "bizWizardPickCoFounderV1861('biz')") + '</div>';
    } else if (w.step === 5) {
      var bootMax = Math.max(0, round(wealth()));
      var capId = "biz1861-boot-" + escH(String(w.step));
      body = '<div class="row-sub">Starting capital for "' + escH(w.name) + '". Your cash: ' + moneyText(bootMax) + '.</div><div class="biz1861-wizgrid">' +
        wizOpt("💵 Bootstrap " + escH(fmt(Math.min(bootMax, 25000))), "Fund it yourself — you keep full ownership and take on no debt. Set a custom amount below.", "No equity lost · no debt", "bizWizardPickCapitalV1861('bootstrap')") +
        wizOpt("👼 Angel " + escH(fmt(50000)), "Outside cash up front, but you give an investor 10% of the company.", "−10% equity", "bizWizardPickCapitalV1861('angel')") +
        wizOpt("🏦 Loan " + escH(fmt(75000)), "Debt you must repay with interest over time. Keep all your equity.", "+" + escH(fmt(75000)) + " debt", "bizWizardPickCapitalV1861('loan')") + '</div>' +
        '<div class="biz1861-custom" style="margin-top:10px"><input id="' + capId + '" inputmode="numeric" placeholder="Custom bootstrap amount (up to ' + escH(fmt(bootMax)) + ')">' + actionBtn("Bootstrap This Amount", "bizWizardCustomBootstrapV1861('" + capId + "')", "green", bootMax < 1000) + '</div>';
    } else if (w.step === 6) {
      body = '<div class="row-sub">Year 1 focus for "' + escH(w.name) + '". This sets your starting playbook (you can change it later).</div><div class="biz1861-wizgrid">' +
        wizOpt("🏗️ Build product first", "Pour effort into the product. Fastest path from concept to launch.", "Dev-heavy", "bizWizardPickFocusV1861('build')") +
        wizOpt("👥 Find customers first", "Chase early users and a waitlist. Better product-market fit and NPS.", "Customer-led", "bizWizardPickFocusV1861('customers')") +
        wizOpt("💰 Revenue first", "Start charging early. Cash sooner, but the product matures slower.", "Revenue-led", "bizWizardPickFocusV1861('revenue')") + '</div>';
    }
    return head + body + foot;
  }
  window.renderBizWizardV1861 = renderWizardV1861;

  var BIZ_NAME_SUGGESTIONS = {
    saas:['NexaCloud','Stackr','Loopify','Velostack','Synqly'], ecom:['Crisp & Co','Vaultly','Dripp','Nomad Goods','Cura'],
    agency:['Edge Advisory','Spur Strategy','Apex Consulting','Forge Agency','Vertex'], mktplace:['Traide','Swapify','Nexus Market','Circulate','Brokr'],
    food:['The Good Plate','Ember Kitchen','Bloom Eats','Root & Co','Salt & Oak'], health:['Vitalis','Mindful Co','Pulse Health','Zenith Wellness','Fora'],
    proptech:['Brickly','Landvault','Propel','Estately','Groundwork'], retail:['Craft & Thread','Nomadic Goods','Slate & Stone','Pure Goods','Forma'],
    media:['Signal Media','Pulse Studios','Vox Digital','Bright Frame','Crisp Content'], edtech:['Learnly','Skola','Meridian Ed','Synapse Learn','Edgewise'],
    fintech:['Clearr','Vault Finance','Parity','Moneta','Finflow'], gaming:['Idle Forge','Apex Games','Polygon Studio','Epoch Games','Vortex Play'],
    manufact:['Crafted Works','Forge Manufacturing','Alloy Co','Prodex','Fabricia'], logistics:['Swiftly','Relay Logistics','Zipline','Conduit','Parcelwave'],
    deeptech:['Axiom AI','Frontier Labs','Quantum Works','Nexus Intelligence','Apex Systems'], greentech:['Verdant Energy','Clearsky Tech','Ecovolt','Solara','Grovetech'],
    social_e:['CommonGood','Rise Community','Brighter Works','Accord CIC','Vela Trust'],
  };

  // ------------------------------------------------------ hub render (Phase D) --
  function activeBusinesses() {
    var B = initBiz();
    return (B.businesses || []).filter(function (b) { return b && b.active && !b.dead; });
  }
  function allBusinesses() {
    var B = initBiz();
    return (B.businesses || []).filter(function (b) { return b && !b._migratedHidden; });
  }
  function stageLabel(stage) {
    return String(stage || "idea").replace(/-/g, " ").replace(/\b\w/g, function (m) { return m.toUpperCase(); });
  }
  function pct(v) { return Math.round(num(v) * 100) + "%"; }
  function metric(label, value, note, kind) {
    return '<div class="biz1861-metric ' + escH(kind || "") + '"><span>' + escH(label) + '</span><b>' + escH(value) + '</b><em>' + escH(note || "") + '</em></div>';
  }
  function actionBtn(label, handler, kind, disabled) {
    return '<button class="money-btn ' + escH(kind || "") + '" onclick="event.preventDefault();event.stopPropagation();' + handler + '"' + (disabled ? " disabled" : "") + '>' + escH(label) + '</button>';
  }

  // ---------------------------------------------------- charts (interactive) --
  function compactSharesV1862(n) {
    n = Math.round(num(n));
    if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
    return String(n);
  }
  function compactMoneyV1861(v) {
    v = num(v); var sign = v < 0 ? "-" : ""; var a = Math.abs(v);
    if (a >= 1e12) return sign + "$" + (a / 1e12).toFixed(a >= 1e13 ? 0 : 1) + "T";
    if (a >= 1e9) return sign + "$" + (a / 1e9).toFixed(a >= 1e10 ? 0 : 1) + "B";
    if (a >= 1e6) return sign + "$" + (a / 1e6).toFixed(a >= 1e7 ? 0 : 1) + "M";
    if (a >= 1e3) return sign + "$" + (a / 1e3).toFixed(a >= 1e4 ? 0 : 1) + "K";
    return sign + "$" + Math.round(a);
  }
  // Inline-SVG area/line sparkline from a numeric series (own min/max scale).
  function sparkSVG(values, color) {
    var v = (values || []).map(function (x) { return num(x); });
    if (v.length < 2) return '<div class="biz1861-spark-empty">Age the company up to chart this.</div>';
    var W = 240, H = 46, pad = 3;
    var mn = Math.min.apply(null, v), mx = Math.max.apply(null, v), rng = (mx - mn) || Math.abs(mx) || 1;
    var step = (W - pad * 2) / (v.length - 1);
    var pts = v.map(function (val, i) { return [pad + i * step, H - pad - ((val - mn) / rng) * (H - pad * 2)]; });
    var line = pts.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
    var area = "M" + pts[0][0].toFixed(1) + " " + (H - pad) + " " + pts.map(function (p) { return "L" + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ") + " L" + pts[pts.length - 1][0].toFixed(1) + " " + (H - pad) + " Z";
    return '<svg class="biz1861-spark" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="' + area + '" fill="' + color + '" opacity="0.16"/>' +
      '<path d="' + line + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  }
  // A trend card: title + latest value + delta arrow + sparkline.
  function trendCard(title, series, color, fmtFn) {
    var v = (series || []).map(function (x) { return num(x); });
    var last = v.length ? v[v.length - 1] : 0;
    var prev = v.length > 1 ? v[v.length - 2] : last;
    var delta = last - prev;
    var arrow = delta > 0 ? "▲" : delta < 0 ? "▼" : "—";
    var dCls = delta > 0 ? "good" : delta < 0 ? "bad" : "";
    var f = fmtFn || compactMoneyV1861;
    return '<div class="biz1861-trend"><div class="biz1861-trend-head"><span>' + escH(title) + '</span><b>' + escH(f(last)) + '</b><i class="' + dCls + '">' + arrow + " " + escH(f(Math.abs(delta))) + '</i></div>' + sparkSVG(v, color) + '</div>';
  }
  // Horizontal stacked bar from [{label,value,color}] segments + a legend.
  function segBar(segments) {
    var segs = (segments || []).filter(function (s) { return num(s.value) > 0; });
    var total = segs.reduce(function (s, x) { return s + num(x.value); }, 0);
    if (total <= 0) return '<div class="biz1861-spark-empty">Nothing allocated yet.</div>';
    var bar = '<div class="biz1861-segbar">' + segs.map(function (s) {
      var pc = (num(s.value) / total) * 100;
      return '<span class="biz1861-seg" style="width:' + pc.toFixed(1) + '%;background:' + s.color + '" title="' + escH(s.label) + '"></span>';
    }).join("") + '</div>';
    var legend = '<div class="biz1861-legend">' + segs.map(function (s) {
      return '<span><i style="background:' + s.color + '"></i>' + escH(s.label) + ' <b>' + Math.round((num(s.value) / total) * 100) + '%</b> <em>' + escH(compactMoneyV1861(s.value)) + '</em></span>';
    }).join("") + '</div>';
    return bar + legend;
  }
  // Donut/pie chart for a spend/allocation breakdown (SVG ring + legend).
  function donutSVG(segments, centerLabel) {
    var segs = (segments || []).filter(function (s) { return num(s.value) > 0; });
    var total = segs.reduce(function (s, x) { return s + num(x.value); }, 0);
    if (total <= 0) return '<div class="biz1861-spark-empty">Nothing allocated yet.</div>';
    var R = 42, C = 2 * Math.PI * R, cx = 60, cy = 60, sw = 17, off = 0;
    var rings = segs.map(function (s) {
      var len = (num(s.value) / total) * C;
      var ring = '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="' + s.color + '" stroke-width="' + sw + '" stroke-dasharray="' + len.toFixed(2) + ' ' + (C - len).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 ' + cx + ' ' + cy + ')"></circle>';
      off += len;
      return ring;
    }).join("");
    var svg = '<svg class="biz1862-donut" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="rgba(0,0,0,.28)" stroke-width="' + sw + '"></circle>' + rings +
      '<text x="' + cx + '" y="' + (cy - 1) + '" text-anchor="middle" fill="#fff3df" font-family="Fraunces,Georgia,serif" font-size="15">' + escH(compactMoneyV1861(total)) + '</text>' +
      '<text x="' + cx + '" y="' + (cy + 13) + '" text-anchor="middle" fill="#b9a98e" font-family="JetBrains Mono,monospace" font-size="7" letter-spacing="1.5">' + escH(centerLabel || "TOTAL") + '</text></svg>';
    var legend = '<div class="biz1861-legend">' + segs.map(function (s) {
      return '<span><i style="background:' + s.color + '"></i>' + escH(s.label) + ' <b>' + Math.round((num(s.value) / total) * 100) + '%</b> <em>' + escH(compactMoneyV1861(s.value)) + '</em></span>';
    }).join("") + '</div>';
    return '<div class="biz1862-donut-wrap">' + svg + legend + '</div>';
  }
  var BIZ_CHART_COLORS = { rev: "#9fd07d", profit: "#7ea0ac", val: "#d8b16e", staff: "#7ea0ac", mktg: "#e0a35f", tools: "#9b8cc2", cofounder: "#cf6f6f", features: "#7ea0ac", bugfix: "#cf6f6f", ux: "#9b8cc2", custdev: "#9fd07d" };

  // ---- candlestick charts (shared by Entrepreneurship + Stocks hub) ----
  // Deterministic PRNG so synthesized candles are stable across re-renders.
  function _seedRandV1862(seed) {
    var h = 2166136261 >>> 0;
    seed = String(seed);
    for (var i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return function () { h += 0x6D2B79F5; var t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  // Build monthly OHLC candles from a series of yearly closing prices. Each
  // year-over-year move is walked across `perYear` ticks with deterministic wiggle.
  function monthlyCandlesV1862(closes, id, perYear) {
    perYear = perYear || 12;
    var v = (closes || []).map(function (x) { return num(x); }).filter(function (x) { return x > 0; });
    var out = [];
    if (!v.length) return out;
    if (v.length === 1) {
      var p = v[0], r0 = _seedRandV1862(id + ":seed"), prev0 = p;
      for (var k = 0; k < perYear; k++) { var o0 = prev0, c0 = Math.max(0.01, p * (1 + (r0() - 0.5) * 0.05)); out.push({ o: o0, h: Math.max(o0, c0) * (1 + r0() * 0.02), l: Math.min(o0, c0) * (1 - r0() * 0.02), c: c0 }); prev0 = c0; }
      return out;
    }
    for (var y = 1; y < v.length; y++) {
      var startP = v[y - 1], endP = v[y];
      var rnd = _seedRandV1862(id + ":" + y);
      var vol = Math.max(0.025, Math.abs(endP - startP) / (startP || 1) * 0.5 + 0.03);
      var prev = startP;
      for (var mo = 0; mo < perYear; mo++) {
        var t = (mo + 1) / perYear;
        var target = startP + (endP - startP) * t;
        var open = prev;
        var close = Math.max(0.01, target * (1 + (rnd() - 0.5) * vol));
        var hi = Math.max(open, close) * (1 + rnd() * vol * 0.6);
        var lo = Math.min(open, close) * (1 - rnd() * vol * 0.6);
        out.push({ o: open, h: hi, l: lo, c: close });
        prev = close;
      }
    }
    return out;
  }
  function candleChartSVGV1862(candles, opts) {
    opts = opts || {};
    var maxN = opts.max || 48;
    if (candles.length > maxN) candles = candles.slice(candles.length - maxN);
    if (candles.length < 2) return '<div class="biz1861-spark-empty">Not enough price history yet.</div>';
    var W = opts.w || 320, H = opts.h || 90, pad = 4;
    var mn = Infinity, mx = -Infinity;
    candles.forEach(function (c) { if (c.l < mn) mn = c.l; if (c.h > mx) mx = c.h; });
    var rng = (mx - mn) || Math.abs(mx) || 1;
    var n = candles.length, slot = (W - pad * 2) / n, cw = Math.max(1.2, Math.min(slot * 0.66, 9));
    function yv(v) { return H - pad - ((v - mn) / rng) * (H - pad * 2); }
    var bars = candles.map(function (c, i) {
      var x = pad + i * slot + slot / 2, up = c.c >= c.o, col = up ? "#3fae5f" : "#d65b5b";
      var yo = yv(c.o), yc = yv(c.c), top = Math.min(yo, yc), bh = Math.max(0.8, Math.abs(yc - yo));
      return '<line x1="' + x.toFixed(1) + '" y1="' + yv(c.h).toFixed(1) + '" x2="' + x.toFixed(1) + '" y2="' + yv(c.l).toFixed(1) + '" stroke="' + col + '" stroke-width="1"/>' +
        '<rect x="' + (x - cw / 2).toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + cw.toFixed(1) + '" height="' + bh.toFixed(1) + '" fill="' + col + '"/>';
    }).join("");
    var period = Math.min(opts.ma || 8, n);
    var maPts = [];
    for (var i = period - 1; i < n; i++) { var sum = 0; for (var j = i - period + 1; j <= i; j++) sum += candles[j].c; maPts.push([pad + i * slot + slot / 2, yv(sum / period)]); }
    var maLine = maPts.length > 1 ? '<path d="' + maPts.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ") + '" fill="none" stroke="#cdbfa6" stroke-width="1.5" opacity="0.85"/>' : "";
    return '<svg class="biz1862-candles" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">' + bars + maLine + '</svg>';
  }
  // Public entry: candlestick chart straight from an array of yearly closing prices.
  window.candleChartFromClosesV1862 = function (closes, id, opts) {
    try { return candleChartSVGV1862(monthlyCandlesV1862(closes, id || "x", 12), opts || {}); } catch (e) { return ""; }
  };

  function renderBizGraphsV1861(biz, mode) {
    if (!biz) return "";
    var C = BIZ_CHART_COLORS;
    var hist = Array.isArray(biz.revenueHistory) ? biz.revenueHistory : [];

    // ---- 1. Growth trends ----
    var revSeries = hist.map(function (h) { return num(h.revenue); });
    var profitSeries = hist.map(function (h) { return num(h.profit); });
    var valSeries = hist.map(function (h) { return num(h.valuation); });
    var growth = '<div class="biz1861-graph"><div class="section-label">📈 Growth trends</div><div class="biz1861-trend-grid">' +
      trendCard("Revenue", revSeries, C.rev) +
      trendCard("Profit", profitSeries, C.profit) +
      trendCard("Valuation", valSeries, C.val) +
      '</div></div>';

    // ---- 2. Budget allocation (where the money goes) ----
    var staffCosts = (biz.employees || []).reduce(function (s, e) { return s + num(e.salary); }, 0);
    var coFounderCosts = (biz.coFounders || []).length * 60000;
    var mktgCosts = num(biz._mktgBudget);
    var toolsCosts = num(biz.headcount) * 2400;
    var spendBar = donutSVG([
      { label: "Staff payroll", value: staffCosts, color: C.staff },
      { label: "Marketing", value: mktgCosts, color: C.mktg },
      { label: "Co-founders", value: coFounderCosts, color: C.cofounder },
      { label: "Tools / overhead", value: toolsCosts, color: C.tools },
    ], "SPEND/YR");
    var alloc = biz._devAlloc || { features: 40, bugfix: 20, ux: 20, custdev: 20 };
    var devBar = segBar([
      { label: "Features", value: alloc.features, color: C.features },
      { label: "Bug fixes", value: alloc.bugfix, color: C.bugfix },
      { label: "UX / polish", value: alloc.ux, color: C.ux },
      { label: "Customer dev", value: alloc.custdev, color: C.custdev },
    ]);
    var budget = '<div class="biz1861-graph"><div class="section-label">💸 Budget allocation</div>' +
      '<div class="biz1861-sublabel">Annual spend — ' + moneyText(staffCosts + coFounderCosts + mktgCosts + toolsCosts) + ' total</div>' + spendBar +
      '<div class="biz1861-sublabel" style="margin-top:10px">Dev focus — where your build effort goes</div>' + devBar +
      '</div>';

    // ---- 3. Hiring impact ----
    var payroll = staffCosts;
    var rev = Math.max(0, num(biz.annualRevenue));
    var payrollBar = segBar([
      { label: "Payroll", value: payroll, color: C.staff },
      { label: "Revenue kept", value: Math.max(0, rev - payroll), color: C.rev },
    ]);
    var boosts = {};
    (biz.employees || []).forEach(function (e) {
      var role = BIZ_ROLES[e.roleId] || {};
      var key = role.skill || "general";
      boosts[key] = (boosts[key] || 0) + 1;
    });
    var boostRows = Object.keys(boosts).length
      ? '<div class="biz1861-legend">' + Object.keys(boosts).map(function (k) { return '<span><i style="background:' + C.profit + '"></i>' + escH(k.charAt(0).toUpperCase() + k.slice(1)) + ' <b>×' + boosts[k] + '</b></span>'; }).join("") + '</div>'
      : '<div class="biz1861-spark-empty">No hires yet — your team boosts show here.</div>';
    var hiring = '<div class="biz1861-graph"><div class="section-label">👥 Hiring impact</div>' +
      '<div class="biz1861-sublabel">Headcount ' + (num(biz.headcount)) + ' · payroll ' + moneyText(payroll) + '/yr · productivity ' + round(biz.productivity || 0) + '%</div>' +
      payrollBar +
      '<div class="biz1861-sublabel" style="margin-top:10px">What your team strengthens</div>' + boostRows +
      '</div>';

    // ---- 4. Marketing ROI ----
    var lastCust = hist.length ? num(hist[hist.length - 1].customers) : num(biz.customers);
    var prevCust = hist.length > 1 ? num(hist[hist.length - 2].customers) : 0;
    var gained = Math.max(0, lastCust - prevCust);
    var perDollar = mktgCosts > 0 ? rev / mktgCosts : 0;
    var custSeries = hist.map(function (h) { return num(h.customers); });
    var roiKind = perDollar >= 3 ? "good" : perDollar >= 1 ? "" : "bad";
    var marketing = '<div class="biz1861-graph"><div class="section-label">📣 Marketing ROI</div>' +
      '<div class="biz1861-roi-grid">' +
      '<div class="biz1861-roi"><span>Budget</span><b>' + moneyText(mktgCosts) + '</b><em>per year</em></div>' +
      '<div class="biz1861-roi"><span>Customers added</span><b>' + round(gained) + '</b><em>last year</em></div>' +
      '<div class="biz1861-roi ' + roiKind + '"><span>Revenue per $1</span><b>' + (mktgCosts > 0 ? "$" + perDollar.toFixed(2) : "—") + '</b><em>marketing spend</em></div>' +
      '</div>' +
      '<div class="biz1861-sublabel" style="margin-top:8px">Customers over time</div>' + sparkSVG(custSeries, C.mktg) +
      (mktgCosts === 0 ? '<div class="biz1861-spark-empty">Set a marketing budget below to start acquiring customers faster.</div>' : '') +
      '</div>';

    // ---- 5. Scale (how well the company scales) ----
    var marketSize = Math.max(1, num(biz.marketSize));
    var custScale = hist.map(function (h) { return num(h.customers); });
    var revPerEmp = hist.map(function (h) { return num(h.revenue) / Math.max(1, num(h.headcount) + 1); });
    var shareSeries = hist.map(function (h) { return h.marketShare != null ? num(h.marketShare) : (num(h.revenue) / marketSize) * 100; });
    var multSeries = hist.map(function (h) { return num(h.revenue) > 0 ? num(h.valuation) / num(h.revenue) : 0; });
    var fmtNum = function (v) { return round(v).toLocaleString(); };
    var fmtPct = function (v) { return (num(v)).toFixed(num(v) < 10 ? 2 : 1) + "%"; };
    var fmtMult = function (v) { return (num(v)).toFixed(1) + "x"; };
    var scale = '<div class="biz1861-graph"><div class="section-label">🚀 Scale</div><div class="biz1861-trend-grid">' +
      trendCard("Customer growth", custScale, C.rev, fmtNum) +
      trendCard("Revenue / employee", revPerEmp, C.val, compactMoneyV1861) +
      trendCard("Market share", shareSeries, C.profit, fmtPct) +
      trendCard("Valuation multiple", multSeries, C.mktg, fmtMult) +
      '</div></div>';

    var parts = [growth, scale, budget, hiring, marketing];
    if (mode === "overview") parts = [growth, scale];
    else if (mode === "product") parts = [];
    else if (mode === "growth") parts = [scale, marketing];
    else if (mode === "team") parts = [hiring];
    else if (mode === "funding") parts = [budget];
    return '<div class="biz1861-graphs">' + parts.join("") + '</div>';
  }

  function setActiveBiz(id) {
    var B = initBiz();
    var biz = (B.businesses || []).find(function (b) { return String(b.uid) === String(id); });
    if (!biz || !biz.active || biz.dead) return toast("That business is not active.");
    B.activeBizId = biz.uid;
    saveGame();
    rerender();
  }
  window.bizSetActiveV1861 = setActiveBiz;
  var DASHBOARD_PANELS_V1862 = ["overview", "product", "growth", "team", "funding", "budget", "public", "exit"];
  function dashboardPanelV1862(biz) {
    var B = initBiz();
    var p = String(B.activePanelV1862 || "overview").toLowerCase();
    if (p === "public" && (!biz || !biz.public)) p = "overview";
    if (DASHBOARD_PANELS_V1862.indexOf(p) < 0) p = "overview";
    B.activePanelV1862 = p;
    return p;
  }
  window.bizSetPanelV1862 = function (panel) {
    var B = initBiz();
    var p = String(panel || "overview").toLowerCase();
    if (DASHBOARD_PANELS_V1862.indexOf(p) < 0) p = "overview";
    B.activePanelV1862 = p;
    saveGame();
    rerender();
  };
  window.bizSelfFundCustomV1861 = function (inputId) {
    var el = typeof document !== "undefined" ? document.getElementById(inputId) : null;
    var amt = el ? String(el.value || "").replace(/[^0-9.]/g, "") : "0";
    if (el) el.value = "";
    return window.bizSelfFundV1861(round(amt));
  };
  window.bizSetMktgBudgetCustomV1861 = function (inputId) {
    var el = typeof document !== "undefined" ? document.getElementById(inputId) : null;
    var amt = el ? String(el.value || "").replace(/[^0-9.]/g, "") : "0";
    if (el) el.value = "";
    return window.bizSetMktgBudgetV1861(round(amt));
  };

  function renderFounderStatsV1861(B, active) {
    var portfolioValue = allBusinesses().reduce(function (sum, b) { return sum + Math.max(0, round(num(b.valuation) || num(b.cashInBusiness))); }, 0);
    return '<section class="panel biz1861-hero"><div><div class="section-label">Founder command</div><h2>Entrepreneurship</h2><p>Build companies from idea to exit. Entrepreneurship is your founder journey; Business stays separate for managed companies, entities, trust, and family enterprise.</p></div><div class="biz1861-hero-stat"><b>' + moneyText(portfolioValue) + '</b><span>portfolio value</span></div><div class="biz1861-metric-grid">' +
      metric("Active companies", String(active.length), "Run up to 3 at once.", active.length ? "good" : "gold") +
      metric("Founder rep", String(Math.round(num(B.founderReputation, 30))), "Raised by exits, growth, press, and strong profits.", "blue") +
      metric("Lifetime profit", moneyText(B.lifetimeProfit || 0), "Founder distributions and exits.", "green") +
      metric("Last founder income", moneyText(fin().lastEntrepreneurIncome || 0), "Flows into yearly taxes downstream.", (fin().lastEntrepreneurIncome || 0) >= 0 ? "green" : "bad") +
      '</div></section>';
  }

  function renderBusinessSwitcherV1861(active) {
    if (!active.length) return "";
    return '<section class="panel biz1861-switcher"><div class="section-label">Portfolio</div><div class="biz1861-switch-grid">' + active.map(function (b) {
      var selected = getActiveBiz() && String(getActiveBiz().uid) === String(b.uid);
      return '<button class="biz1861-switch ' + (selected ? "selected" : "") + '" onclick="event.preventDefault();event.stopPropagation();bizSetActiveV1861(\'' + escH(b.uid) + '\')"><b>' + escH(b.name) + '</b><span>' + escH(stageLabel(b.stage)) + ' / ' + moneyText(b.valuation || b.cashInBusiness || 0) + '</span></button>';
    }).join("") + '</div></section>';
  }

  function bizNextMilestoneV1862(biz) {
    if (!biz) return "Found a company to start your founder track.";
    if (biz.productStage !== "live" && biz.productStage !== "v2") return "Finish product development and launch before growth becomes real.";
    if (num(biz.runway, 999) < 6 && num(biz.cashInBusiness) > 0) return "Runway is under 6 months: inject capital, raise, or reduce burn.";
    if (!biz.public && (num(biz.annualRevenue) < 10000000 || num(biz.yearsOld) < 5)) return "IPO path: reach $10M+ revenue and 5+ years trading.";
    if (!biz.public) return "IPO-ready: choose a float percentage or keep scaling privately.";
    if (biz.controlLost) return "Public company: buy back above 10% ownership to regain CEO control.";
    return "Public company: keep growing fundamentals while managing your listed stake.";
  }
  function renderDashboardTabsV1862(active, biz) {
    var panels = [
      ["overview", "Overview"],
      ["product", "Product"],
      ["growth", "Growth"],
      ["team", "Team"],
      ["funding", "Funding"],
      ["budget", "Budget"],
      ["public", "Public Market"],
      ["exit", "Exit"]
    ];
    return '<div class="biz1862-tabs">' + panels.map(function (p) {
      var id = p[0], disabled = id === "public" && (!biz || !biz.public);
      return '<button class="biz1862-tab ' + (active === id ? "selected" : "") + '" onclick="event.preventDefault();event.stopPropagation();bizSetPanelV1862(\'' + id + '\')"' + (disabled ? " disabled" : "") + '>' + escH(p[1]) + '</button>';
    }).join("") + '</div>';
  }
  function renderBizCommandHeaderV1862(biz, panel) {
    var t = BIZ_TYPES[biz.type] || {};
    var model = BIZ_MODEL_INFO[biz.model] || {};
    var runwayKind = num(biz.runway, 999) < 6 ? "bad" : num(biz.runway, 999) < 12 ? "gold" : "good";
    return '<div class="biz1862-command"><div class="biz1861-active-head"><div><div class="section-label">' + escH(t.emoji || "") + ' Founder command</div><h3>' + escH(biz.name) + '</h3><p>' + escH(t.name || "Business") + ' / ' + escH(model.name || biz.model || "Model") + ' / ' + escH(stageLabel(biz.stage)) + '</p></div><strong>' + moneyText(biz.valuation || 0) + '<span>valuation</span></strong></div>' +
      '<div class="biz1861-metric-grid">' +
      metric("Revenue", moneyText(biz.annualRevenue || 0), "Last year revenue.", (biz.annualRevenue || 0) > 0 ? "green" : "gold") +
      metric("Profit", moneyText(biz.annualProfit || 0), "After salary, costs & tax. You draw " + Math.round(clampN(num(biz.founderDistRateV1869, 0.4), 0, 0.9) * 100) + "% of profit (set in Funding).", (biz.annualProfit || 0) >= 0 ? "green" : "bad") +
      metric("Cash", moneyText(biz.cashInBusiness || 0), "Business cash and runway fuel.", runwayKind) +
      metric("Runway", (num(biz.runway, 999) >= 999 ? "Infinite" : Math.max(0, round(biz.runway)) + " mo"), "Below 6 months is dangerous.", runwayKind) +
      metric("Product", escH(stageLabel(biz.productStage)), "Dev " + round(biz.productDev || 0) + " / Quality " + round(biz.productQuality || 0), "blue") +
      metric("Customers", String(round(biz.customers || 0)), "NPS " + round(biz.nps || 0) + " / Churn " + pct(biz.churnRate || 0), "gold") +
      '</div><div class="biz1862-next"><span>Next milestone</span><b>' + escH(bizNextMilestoneV1862(biz)) + '</b></div>' +
      renderDashboardTabsV1862(panel, biz) + '</div>';
  }
  function renderDevFocusControlsV1862(biz) {
    return '<div class="biz1862-ctl ctl-blue"><b>Dev focus</b><span>Features / Bugs / UX / Customer dev</span><div class="biz1861-actions">' + actionBtn("Ship Fast", "bizSetDevAllocV1861(60,10,20,10)", "blue", false) + actionBtn("Quality", "bizSetDevAllocV1861(30,35,30,5)", "blue", false) + actionBtn("Customer-Led", "bizSetDevAllocV1861(20,10,20,50)", "blue", false) + '</div></div>';
  }
  function renderMarketingControlsV1862(biz) {
    var mktgId = "biz1861-mktg-" + escH(biz.uid);
    return '<div class="biz1862-ctl ctl-green"><b>Marketing</b><span>Current budget: ' + moneyText(biz._mktgBudget || 0) + '/yr</span><div class="biz1861-actions">' + actionBtn("$10K", "bizSetMktgBudgetV1861(10000)", "", false) + actionBtn("$50K", "bizSetMktgBudgetV1861(50000)", "", false) + actionBtn("$250K", "bizSetMktgBudgetV1861(250000)", "", false) + '</div><div class="biz1861-custom"><input id="' + mktgId + '" placeholder="Custom budget" inputmode="numeric">' + actionBtn("Set", "bizSetMktgBudgetCustomV1861('" + mktgId + "')", "blue", false) + '</div></div>';
  }
  function renderCapitalControlsV1862(biz) {
    var inputId = "biz1861-self-" + escH(biz.uid);
    return '<div class="biz1862-ctl ctl-gold"><b>Capital</b><span>Your cash: ' + moneyText(wealth()) + '</span><div class="biz1861-actions">' + actionBtn("Inject $10K", "bizSelfFundV1861(10000)", "green", wealth() < 10000) + actionBtn("Inject $100K", "bizSelfFundV1861(100000)", "green", wealth() < 100000) + actionBtn("Inject Max", "bizSelfFundV1861('max')", "gold", wealth() <= 0) + '</div><div class="biz1861-custom"><input id="' + inputId + '" placeholder="Custom funding" inputmode="numeric">' + actionBtn("Inject", "bizSelfFundCustomV1861('" + inputId + "')", "green", wealth() <= 0) + '</div></div>';
  }
  function renderFundingControlsV1862(biz) {
    var canRaiseSeed = num(biz.annualRevenue) > 0 || biz.productStage !== "concept";
    return '<div class="biz1862-ctl ctl-violet"><b>Funding rounds</b><span>Raise equity if the company is ready.</span><div class="biz1861-actions">' + actionBtn("Pre-Seed", "bizRaiseFundingV1861('preseed')", "gold", false) + actionBtn("Seed", "bizRaiseFundingV1861('seed')", "gold", !canRaiseSeed) + actionBtn("Series A", "bizRaiseFundingV1861('seriesA')", "gold", num(biz.annualRevenue) < 500000) + '</div></div>';
  }
  function renderFounderPayControlsV1862(biz) {
    var rate = clampN(num(biz.founderSalaryRate, FOUNDER_SALARY_RATE_DEFAULT), FOUNDER_SALARY_RATE_MIN, FOUNDER_SALARY_RATE_MAX);
    var floor = Math.max(0, num(biz.founderSalaryFloor, FOUNDER_SALARY_FLOOR_DEFAULT));
    var estSalary = Math.max(floor, Math.round(num(biz.annualRevenue) * rate));
    var lastPaid = num(biz._founderSalaryPaid);
    var cash = num(biz.cashInBusiness);
    var distAmt = Math.max(0, Math.round(cash * DISTRIBUTION_RATE_V1862));
    var distReady = age() > num(biz._lastDistributionAge, -9999);
    var canDist = biz.active && !biz.dead && cash > 0 && distReady;
    var distRate = clampN(num(biz.founderDistRateV1869, 0.4), 0, 0.9);
    function rb(p) { return actionBtn(Math.round(p * 100) + "%", "bizSetSalaryRateV1862(" + p + ")", Math.abs(rate - p) < 0.001 ? "gold" : "", false); }
    function db(p) { return actionBtn(Math.round(p * 100) + "%", "bizSetDistRateV1869(" + p + ")", Math.abs(distRate - p) < 0.001 ? "gold" : "", false); }
    return '<div class="biz1862-ctl ctl-green"><b>Founder pay</b><span>Salary (your wage): ' + moneyText(lastPaid) + ' last drawn · target ~' + moneyText(estSalary) + '/yr (' + Math.round(rate * 100) + '% of revenue, min ' + moneyText(floor) + ')</span>' +
      '<div class="biz1861-actions">' + rb(0.03) + rb(0.05) + rb(0.08) + rb(0.10) + '</div>' +
      '<span style="margin-top:8px">Profit distribution: ' + Math.round(distRate * 100) + '% of each year\'s profit is paid to you as the owner; the rest stays in the company.</span>' +
      '<div class="biz1861-actions">' + db(0) + db(0.2) + db(0.4) + db(0.6) + db(0.8) + '</div>' +
      '<div class="biz1861-actions">' + actionBtn("Take distribution", "bizTakeDistributionV1862()", "green", !canDist) + '</div>' +
      '<span style="margin-top:6px">' + escH(distReady ? ("Pull " + moneyText(distAmt) + " (" + Math.round(DISTRIBUTION_RATE_V1862 * 100) + "% of company cash) now") : "Distribution available again next year") + '</span></div>';
  }
  function renderFundingHistoryV1862(biz) {
    var rounds = (biz.fundingRounds || []).slice(-5).reverse();
    var grants = (biz.grantHistory || []).slice(-4).reverse();
    var roundRows = rounds.length ? rounds.map(function (r) { return '<div class="biz1862-minirow"><b>' + escH(String(r.round || "round").replace(/_/g, " ")) + '</b><span>' + moneyText(r.amount || 0) + ' / ' + round(r.dilution || 0) + '% dilution / age ' + round(r.age || 0) + '</span></div>'; }).join("") : '<div class="biz1861-spark-empty">No funding rounds yet.</div>';
    var grantRows = grants.length ? grants.map(function (g) { return '<div class="biz1862-minirow"><b>Grant</b><span>' + moneyText(g.amount || 0) + ' / age ' + round(g.age || 0) + '</span></div>'; }).join("") : '<div class="biz1861-spark-empty">Grant wins will appear here.</div>';
    return '<div class="biz1862-split"><div><div class="section-label">Funding history</div>' + roundRows + '</div><div><div class="section-label">Grants</div>' + grantRows + '</div></div>';
  }
  function renderOverviewPanelV1862(biz) {
    var hist = Array.isArray(biz.revenueHistory) ? biz.revenueHistory : [];
    var last = hist.length ? hist[hist.length - 1] : null;
    var recent = last ? "Latest year: " + moneyText(last.revenue || 0) + " revenue, " + moneyText(last.profit || 0) + " profit, " + round(last.customers || 0) + " customers." : "Age up after launch to build a performance record.";
    return '<div class="biz1862-panel"><div class="biz1862-callout"><span>Current read</span><b>' + escH(recent) + '</b></div>' + bizStageLadderV1869(biz) + renderBizGraphsV1861(biz, "overview") + '</div>';
  }
  // Quick "where is this company on the journey" tracker for the Overview tab.
  function bizStageLadderV1869(biz) {
    // Derive the ladder from the SAME company stage shown in the header, so they always agree.
    var idx, prog;
    if (biz.public) { idx = 4; prog = 100; }
    else if (biz.stage === 'mature') { idx = 3; prog = 100; }
    else if (biz.stage === 'scale') { idx = 3; prog = Math.min(99, Math.round((num(biz.annualRevenue) / 2000000) * 100)); }
    else if (biz.stage === 'growth') { idx = 2; prog = Math.min(99, Math.round((num(biz.annualRevenue) / 500000) * 100)); }
    else if (biz.stage === 'early') { idx = 1; prog = Math.min(99, Math.round((num(biz.annualRevenue) / 50000) * 100)); }
    else if (biz.stage === 'pre-revenue') { idx = 1; prog = Math.min(60, Math.round(num(biz.productDev))); }
    else { idx = 0; prog = Math.min(95, Math.round(num(biz.productDev))); }
    var stages = [
      { label: "Idea", icon: "💡" },
      { label: "Early / Seed", icon: "🌱" },
      { label: "Growth", icon: "📈" },
      { label: "Late / Mature", icon: "🏛" },
      { label: "Public", icon: "🔔" }
    ];
    var steps = stages.map(function (s, i) {
      var done = i < idx, cur = i === idx;
      var col = cur ? "#e9c77d" : done ? "#9ccf9c" : "rgba(255,255,255,.30)";
      var bg = cur ? "rgba(216,173,109,.16)" : "transparent";
      return '<div style="flex:1;min-width:0;text-align:center;padding:7px 2px;border-radius:9px;background:' + bg + '">' +
        '<div style="font-size:16px;line-height:1.1;opacity:' + (done || cur ? 1 : 0.4) + '">' + s.icon + '</div>' +
        '<div style="font-size:8px;font-weight:800;letter-spacing:.03em;text-transform:uppercase;color:' + col + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escH(s.label) + '</div></div>';
    }).join('<div style="align-self:center;flex:0 0 8px;height:2px;background:rgba(255,255,255,.16)"></div>');
    return '<div class="biz1861-graph"><div class="section-label">🧭 Investment stage</div>' +
      '<div style="display:flex;align-items:stretch;gap:2px">' + steps + '</div>' +
      '<div style="height:7px;border-radius:999px;background:rgba(255,255,255,.1);overflow:hidden;margin-top:9px"><div style="height:100%;width:' + prog + '%;background:linear-gradient(90deg,#d8ad6d,#9ccf9c)"></div></div>' +
      '<div class="biz1861-sublabel" style="margin-top:6px">' + (biz.public ? "Public company — trading on the open market." : ("Company stage: " + escH(stageLabel(biz.stage)) + " · " + prog + "% toward the next milestone")) + '</div>' +
      '<div class="biz1862-next" style="margin-top:8px"><span>Next milestone</span><b>' + escH(bizNextMilestoneV1862(biz)) + '</b></div></div>';
  }
  function _pushProdLogV1869(biz, text) {
    if (!Array.isArray(biz._prodLogV1869)) biz._prodLogV1869 = [];
    biz._prodLogV1869.push({ age: age(), text: text });
    if (biz._prodLogV1869.length > 12) biz._prodLogV1869.shift();
  }
  function productRoadmapV1869(biz) {
    var order = ["concept", "mvp", "beta", "live", "v2"];
    var labels = { concept: "Concept", mvp: "MVP", beta: "Beta", live: "Live", v2: "v2 / Scale" };
    var icons = { concept: "💭", mvp: "🧱", beta: "🧪", live: "🚀", v2: "🏆" };
    // A scaled/mature company shows a "v2 / Scale" product immediately, even before the next yearly tick formally advances it.
    var ps = biz.productStage;
    if (ps === "live" && (biz.stage === "scale" || biz.stage === "mature")) ps = "v2";
    var cur = (ps === "v2+" || ps === "v2") ? "v2" : (ps || "concept");
    var idx = order.indexOf(cur); if (idx < 0) idx = 0;
    var liveP = idx >= 3;
    var steps = order.map(function (k, i) {
      var done = i < idx, c = i === idx;
      var col = c ? "#e9c77d" : done ? "#9ccf9c" : "rgba(255,255,255,.30)";
      var bg = c ? "rgba(216,173,109,.16)" : "transparent";
      return '<div style="flex:1;min-width:0;text-align:center;padding:7px 2px;border-radius:9px;background:' + bg + '">' +
        '<div style="font-size:16px;line-height:1.1;opacity:' + (done || c ? 1 : 0.4) + '">' + icons[k] + '</div>' +
        '<div style="font-size:8px;font-weight:800;letter-spacing:.03em;text-transform:uppercase;color:' + col + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escH(labels[k]) + '</div></div>';
    }).join('<div style="align-self:center;flex:0 0 8px;height:2px;background:rgba(255,255,255,.16)"></div>');
    return '<div class="biz1861-graph"><div class="section-label">🗺️ Product roadmap</div>' +
      '<div style="display:flex;align-items:stretch;gap:2px">' + steps + '</div>' +
      '<div class="biz1861-sublabel" style="margin-top:6px">' + escH(biz.productName || "Your product") + ' — ' + (liveP ? ("shipped · " + escH(labels[cur]) + " · quality " + Math.round(num(biz.productQuality)) + "/100") : ("in " + escH(labels[cur]) + " · keep building to launch (dev " + Math.round(num(biz.productDev)) + ")")) + '</div></div>';
  }
  function bizCompetitorPriceV1869(biz, c) {
    var share = Math.max(1, num(c.marketShare));
    var marketVal = Math.max(num(biz.annualRevenue) * 4, num(biz.marketSize) * 0.3, 1000000);
    return Math.max(250000, Math.round(marketVal * (share / 100) * (0.7 + num(c.strength) / 200)));
  }
  function productCompetitorsV1869(biz) {
    var comps = (biz.competitors || []).slice(0, 3);
    if (!comps.length) return "";
    function bar(val, color) {
      var w = Math.max(2, Math.min(100, num(val)));
      return '<div style="height:6px;border-radius:999px;background:rgba(255,255,255,.1);overflow:hidden;margin:3px 0"><div style="height:100%;width:' + w + '%;background:' + color + '"></div></div>';
    }
    var youQ = Math.round(num(biz.productQuality));
    var youRow = '<div class="biz1862-minirow" style="display:block"><b>You — ' + escH(biz.productName || biz.name) + '</b>' + bar(youQ, "linear-gradient(90deg,#d8ad6d,#9ccf9c)") + '<span style="font-size:9px;opacity:.85">Quality ' + youQ + ' · market share ' + num(biz.marketShare).toFixed(1) + '%</span></div>';
    var cash = num(biz.cashInBusiness);
    var compRows = comps.map(function (c, i) {
      var price = bizCompetitorPriceV1869(biz, c);
      return '<div class="biz1862-minirow" style="display:block">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:6px"><b>' + escH(c.name) + '</b>' + actionBtn("Acquire " + compactMoneyV1861(price), "bizAcquireCompetitorV1869(" + i + ")", "gold", cash < price) + '</div>' +
        bar(num(c.strength), "rgba(201,155,85,.6)") +
        '<span style="font-size:9px;opacity:.7">Strength ' + Math.round(num(c.strength)) + ' · market share ' + Math.round(num(c.marketShare)) + '% · buy with company cash</span></div>';
    }).join("");
    return '<div class="biz1861-graph"><div class="section-label">⚔️ Competitive landscape</div>' + youRow + compRows + '</div>';
  }
  function productActivityLogV1869(biz) {
    var arr = (biz._prodLogV1869 || []).slice(-4).reverse();
    if (!arr.length) return '<div class="biz1861-graph"><div class="section-label">📋 Product activity</div><div class="biz1861-spark-empty">Ship features, fix tech debt, or polish — your moves log here.</div></div>';
    var rows = arr.map(function (e) { return '<div class="biz1862-minirow"><b>Age ' + round(e.age) + '</b><span>' + escH(e.text) + '</span></div>'; }).join("");
    return '<div class="biz1861-graph"><div class="section-label">📋 Product activity</div>' + rows + '</div>';
  }
  function renderProductPanelV1862(biz) {
    var liveP = biz.productStage === "live" || biz.productStage === "v2" || biz.productStage === "v2+";
    var q = round(num(biz.productQuality));
    var dev = round(num(biz.productDev));
    var ms = num(biz.marketShare);
    var td = round(num(biz.techDebt));
    var npsV = round(num(biz.nps));
    var churn = num(biz.churnRate);
    var qKind = q >= 70 ? "good" : q >= 45 ? "gold" : "bad";
    var tdKind = td <= 20 ? "good" : td <= 50 ? "gold" : "bad";
    var ft = FEATURE_TYPE_V1869[biz.type] || { noun: "feature" };
    var shipCost = Math.max(10000, Math.round(num(biz.annualRevenue) * 0.04)) || 25000;
    var fixCost = Math.max(8000, Math.round(num(biz.annualRevenue) * 0.03)) || 20000;
    var polishCost = Math.max(8000, Math.round(num(biz.annualRevenue) * 0.03)) || 20000;
    var cash = num(biz.cashInBusiness);
    var tiles = '<div class="biz1861-metric-grid">' +
      metric("Product quality", q + "/100", liveP ? "Retention & word of mouth." : "Raise it before launch.", qKind) +
      metric("Development", liveP ? "Shipped ✓" : (dev + " pts"), liveP ? "Live — grow it through features now." : "Build progress — keep going to launch.", "blue") +
      metric("Market share", ms.toFixed(1) + "%", "Of your industry's market.", ms > 0 ? "green" : "gold") +
      metric("Tech debt", td + "/100", td > 50 ? "Slowing you down — clean it up." : "Under control.", tdKind) +
      metric("NPS", String(npsV), "Customer love → organic growth.", npsV >= 30 ? "good" : npsV >= 0 ? "gold" : "bad") +
      metric("Churn", pct(churn), "Customers lost per year.", churn <= 0.1 ? "good" : churn <= 0.2 ? "gold" : "bad") +
      '</div>';
    var actions = '<div class="biz1861-control-grid">' +
      renderDevFocusControlsV1862(biz) +
      '<div class="biz1862-ctl ctl-violet"><b>Ship a ' + escH(ft.noun) + '</b><span>' + (liveP ? "A hit grows market share; a flop can lose it — odds scale with quality." : "Pushes development forward; a rushed build can add bugs.") + ' Costs ' + moneyText(shipCost) + '.</span><div class="biz1861-actions">' + actionBtn(liveP ? ("Ship " + ft.noun) : "Build feature", "bizShipFeatureV1869()", "violet", cash < shipCost) + '</div></div>' +
      '<div class="biz1862-ctl ctl-blue"><b>Cleanup sprint</b><span>Pay down tech debt and lift quality. Costs ' + moneyText(fixCost) + '.</span><div class="biz1861-actions">' + actionBtn("Fix tech debt", "bizFixTechDebtV1869()", "blue", cash < fixCost || td <= 0) + '</div></div>' +
      '<div class="biz1862-ctl ctl-green"><b>Polish & support</b><span>Raise NPS and cut churn. Costs ' + moneyText(polishCost) + '.</span><div class="biz1861-actions">' + actionBtn("Polish", "bizPolishV1869()", "green", cash < polishCost) + '</div></div>' +
      '</div>';
    var devAlloc = biz._devAlloc || { features: 40, bugfix: 20, ux: 20, custdev: 20 };
    var devBar = '<div class="biz1861-graph"><div class="section-label">🔧 Where your build effort goes</div><div class="biz1861-sublabel">Set by your Dev focus above — this is what each year of building spends time and money on.</div>' + segBar([
      { label: "Features", value: devAlloc.features, color: BIZ_CHART_COLORS.features },
      { label: "Bug fixes", value: devAlloc.bugfix, color: BIZ_CHART_COLORS.bugfix },
      { label: "UX / polish", value: devAlloc.ux, color: BIZ_CHART_COLORS.ux },
      { label: "Customer dev", value: devAlloc.custdev, color: BIZ_CHART_COLORS.custdev }
    ]) + '</div>';
    return '<div class="biz1862-panel">' + productRoadmapV1869(biz) + tiles + actions + devBar + productCompetitorsV1869(biz) + productActivityLogV1869(biz) + '</div>';
  }
  function renderGrowthPanelV1862(biz) {
    return '<div class="biz1862-panel"><div class="biz1861-control-grid">' + renderMarketingControlsV1862(biz) + '</div>' + renderBizGraphsV1861(biz, "growth") + '</div>';
  }
  // Budget tab: a dedicated, dynamic breakdown of where the company's money goes + people economics.
  function renderBudgetPanelV1862(biz) {
    var C = BIZ_CHART_COLORS;
    var emps = biz.employees || [];
    var rev = Math.max(0, num(biz.annualRevenue));
    var staffCosts = emps.reduce(function (s, e) { return s + num(e.salary); }, 0);
    var coFounderCosts = (biz.coFounders || []).length * 60000;
    var mktgCosts = num(biz._mktgBudget);
    var infraRate = INFRA_RATE_V1869[biz.type] != null ? INFRA_RATE_V1869[biz.type] : 0.01;
    var serverCost = Math.round(rev * infraRate);
    var officeCost = Math.round(num(biz.headcount) * 12000);
    var toolsCosts = Math.round(num(biz.headcount) * 2400 + rev * 0.005);
    var founderPay = num(biz._founderSalaryPaid);
    var corpTax = num(biz._corpTaxV1869);
    var gm = clampN(num(biz.grossMargin, 0.6), 0.05, 0.98);
    var cogs = Math.round(rev * (1 - gm));                 // cost of goods / delivering the product (the gross-margin cost)
    var grossProfit = rev - cogs;
    var operating = staffCosts + coFounderCosts + mktgCosts + toolsCosts + serverCost + officeCost;
    var total = cogs + operating + founderPay + corpTax;   // EVERYTHING between revenue and net profit
    var netProfit = num(biz.annualProfit);
    var distRate = clampN(num(biz.founderDistRateV1869, 0.4), 0, 0.9);
    var distribution = Math.max(0, Math.round(netProfit * distRate)); // what YOU pull out as the owner
    var retained = netProfit - distribution;
    var head = num(biz.headcount);
    var avgSalary = emps.length ? Math.round(staffCosts / emps.length) : 0;
    var revPerHead = head > 0 ? Math.round(rev / head) : 0;
    var costPerHead = head > 0 ? Math.round(total / head) : 0;
    var payrollPct = rev > 0 ? Math.round((staffCosts + coFounderCosts) / rev * 100) : 0;
    var burnKind = netProfit >= 0 ? "good" : "bad";
    var typeName = (BIZ_TYPES[biz.type] || {}).name || "your industry";
    var donut = total > 0 ? donutSVG([
      { label: "Cost of goods", value: cogs, color: C.bugfix },
      { label: "Payroll", value: staffCosts, color: C.staff },
      { label: "Founder salary", value: founderPay, color: C.profit },
      { label: "Servers / cloud", value: serverCost, color: C.val },
      { label: "Office / real estate", value: officeCost, color: C.cofounder },
      { label: "Marketing", value: mktgCosts, color: C.mktg },
      { label: "Software & tools", value: toolsCosts, color: C.tools },
      { label: "Corporate tax", value: corpTax, color: C.custdev }
    ], "COSTS/YR") : '<div class="biz1861-spark-empty">No costs yet — hire, set marketing, or draw founder pay to see the breakdown.</div>';
    function wrow(label, val, note, kind) {
      var isTotal = kind === "total", isSub = kind === "sub";
      var valColor = isSub ? "#e8a08f" : (isTotal ? "#ffe7b3" : "#dbe9d4");
      var bg = isTotal ? "rgba(216,173,109,.12)" : "rgba(255,255,255,.025)";
      var bd = isTotal ? "1px solid rgba(216,173,109,.40)" : "1px solid rgba(255,255,255,.06)";
      return '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 13px;border-radius:10px;background:' + bg + ';border:' + bd + ';margin-bottom:6px">' +
        '<div style="min-width:0"><div style="font-size:14px;font-weight:' + (isTotal ? 800 : 600) + ';color:' + (isTotal ? "#fff7e9" : "#ece1cd") + '">' + escH(label) + '</div>' + (note ? '<div style="font-size:11px;color:rgba(255,255,255,.55);margin-top:2px">' + escH(note) + '</div>' : '') + '</div>' +
        '<div style="font-size:' + (isTotal ? 18 : 15) + 'px;font-weight:800;color:' + valColor + ';white-space:nowrap">' + (isSub ? "−" : "") + moneyText(val) + '</div></div>';
    }
    var waterfall = '<div class="biz1861-graph"><div class="section-label">📊 Revenue → your pocket</div>' +
      '<div class="biz1861-sublabel" style="margin-bottom:8px">Read top to bottom: start with what you billed, subtract each cost (red), and the highlighted rows are the running totals.</div>' +
      wrow("Revenue", rev, "everything the company billed this year", "rev") +
      wrow("Cost of goods", cogs, Math.round((1 - gm) * 100) + "% of revenue spent making & delivering it", "sub") +
      wrow("Gross profit", grossProfit, "what's left after delivery — a " + Math.round(gm * 100) + "% margin", "total") +
      wrow("Operating costs", operating, "payroll, servers, office, marketing, tools", "sub") +
      wrow("Your salary", founderPay, "your wage, paid out of the company", "sub") +
      wrow("Corporate tax", corpTax, "21% tax on the profit", "sub") +
      wrow("Net profit", netProfit, "the company's actual profit this year", "total") +
      wrow("Your profit distribution", distribution, Math.round(distRate * 100) + "% of profit paid to YOU — change it in Funding", "sub") +
      wrow("Kept in the company", retained, "reinvested to grow the business", "total") +
      '</div>';
    return '<div class="biz1862-panel">' +
      '<div class="biz1862-callout"><span>The full picture</span><b>' + moneyText(rev) + ' revenue − ' + moneyText(total) + ' total costs = ' + moneyText(netProfit) + ' net profit. You take ' + moneyText(distribution) + '; ' + moneyText(retained) + ' stays in the company.</b></div>' +
      '<div class="biz1861-metric-grid">' +
      metric("Total costs", moneyText(total) + "/yr", "Goods + operating + salary + tax.", burnKind) +
      metric("Cost of goods", moneyText(cogs) + "/yr", Math.round((1 - gm) * 100) + "% of revenue to deliver.", "gold") +
      metric("Payroll", moneyText(staffCosts + coFounderCosts) + "/yr", emps.length + " staff + " + (biz.coFounders || []).length + " co-founders.", "gold") +
      metric("Servers / cloud", moneyText(serverCost) + "/yr", "Compute & hosting for " + escH(typeName) + ".", "blue") +
      metric("Office / real estate", moneyText(officeCost) + "/yr", "~$12K per head in space.", "blue") +
      metric("Marketing", moneyText(mktgCosts) + "/yr", "Set this in the Growth tab.", "blue") +
      metric("Software & tools", moneyText(toolsCosts) + "/yr", "Per-head seats + 0.5% of revenue.", "blue") +
      metric("Founder salary", moneyText(founderPay) + "/yr", "Your wage from the company.", "green") +
      metric("Corporate tax", moneyText(corpTax) + "/yr", "21% of taxable profit.", "gold") +
      metric("Profit distribution", moneyText(distribution) + "/yr", Math.round(distRate * 100) + "% of profit you pull out.", "green") +
      '</div>' +
      '<div class="biz1861-graph"><div class="section-label">🥧 Where the money goes</div>' + donut + '</div>' +
      waterfall +
      '<div class="biz1862-callout" style="margin-top:4px"><span>Adjust spend</span><b>Marketing is your main discretionary budget; profit distribution is set in Funding. The rest scale with revenue & headcount.</b></div>' +
      '<div class="biz1861-control-grid">' + renderMarketingControlsV1862(biz) + '</div>' +
      '<div class="biz1861-graph"><div class="section-label">👥 People economics</div><div class="biz1862-split"><div>' +
      '<div class="biz1862-minirow"><b>Headcount</b><span>' + head + '</span></div>' +
      '<div class="biz1862-minirow"><b>Avg salary</b><span>' + moneyText(avgSalary) + '/yr</span></div>' +
      '<div class="biz1862-minirow"><b>Payroll % of revenue</b><span>' + payrollPct + '%</span></div></div><div>' +
      '<div class="biz1862-minirow"><b>Revenue / employee</b><span>' + moneyText(revPerHead) + '</span></div>' +
      '<div class="biz1862-minirow"><b>Cost / employee</b><span>' + moneyText(costPerHead) + '</span></div>' +
      '<div class="biz1862-minirow"><b>Cash runway</b><span>' + (num(biz.runway, 999) >= 999 ? "Infinite" : Math.max(0, round(biz.runway)) + " mo") + '</span></div>' +
      '</div></div></div></div>';
  }
  function perfKindV1862(p) { return p >= 70 ? "good" : p >= 45 ? "gold" : "bad"; }
  function initialsV1862(name) {
    var parts = String(name || "?").trim().split(/\s+/);
    return ((parts[0] || " ").charAt(0) + ((parts[1] || "").charAt(0) || "")).toUpperCase() || "?";
  }
  function renderTeamSummaryV1862(biz) {
    var emps = biz.employees || [];
    var coCount = (biz.coFounders || []).length;
    var head = num(biz.headcount, emps.length + coCount);
    var payroll = emps.reduce(function (s, e) { return s + num(e.salary); }, 0);
    var avgPerf = emps.length ? Math.round(emps.reduce(function (s, e) { return s + num(e.performance); }, 0) / emps.length) : 0;
    var prod = round(biz.productivity || 0);
    var culture = round(biz.culture || 0);
    return '<div class="biz1861-metric-grid">' +
      metric("Headcount", String(head), coCount ? (coCount + " co-founder" + (coCount > 1 ? "s" : "") + " + " + emps.length + " staff") : (emps.length + " on payroll"), head > 0 ? "blue" : "gold") +
      metric("Payroll", moneyText(payroll) + "/yr", "Salaries across the team.", payroll > 0 ? "gold" : "good") +
      metric("Productivity", prod + "%", "From culture, performance, and your stress.", prod >= 60 ? "good" : prod >= 40 ? "gold" : "bad") +
      metric("Culture", culture + "%", "Drifts with leadership and attrition.", culture >= 60 ? "good" : culture >= 40 ? "gold" : "bad") +
      (emps.length ? metric("Avg performance", String(avgPerf), "Mean across staff.", perfKindV1862(avgPerf)) : "") +
      '</div>';
  }
  function renderRecruitRailV1862(biz) {
    if (biz._hiringRoleV1868 && BIZ_ROLES[biz._hiringRoleV1868]) return renderHiringV1868(biz, biz._hiringRoleV1868);
    var cash = num(biz.cashInBusiness);
    var cards = Object.keys(BIZ_ROLES).slice(0, 8).map(function (id) {
      var r = BIZ_ROLES[id];
      var disabled = cash < r.salMin * 0.5;
      var boost = r.skill ? (r.skill.charAt(0).toUpperCase() + r.skill.slice(1)) : "Operations";
      return '<div class="biz1862-role' + (disabled ? " off" : "") + '">' +
        '<div class="biz1862-role-head"><span class="biz1862-role-emoji">' + escH(r.emoji || "") + '</span><b>' + escH(r.title) + '</b></div>' +
        '<span class="biz1862-role-boost">Boosts ' + escH(boost) + '</span>' +
        '<div class="biz1862-role-foot"><em>' + compactMoneyV1861(r.salMin) + '–' + compactMoneyV1861(r.salMax) + '</em>' + actionBtn("Interview", "bizOpenHiringV1868('" + id + "')", "green", disabled) + '</div>' +
        '</div>';
    }).join("");
    return '<div class="biz1862-subsection"><div class="section-label">Recruit — interview for a role</div><div class="biz1862-recruit">' + cards + '</div></div>';
  }
  // --- Interview + hire (v18.68): each role surfaces distinct candidates you interview, then hire ---
  var HIRE_TRAITS_V1868 = [
    { id: "tenx",    label: "10x Performer",        emoji: "🚀", perf: [80, 98], culture: [40, 70], risk: 0.20, salMult: [1.30, 1.70], blurb: "Brilliant output, and knows their worth." },
    { id: "culture", label: "Culture Champion",     emoji: "🤝", perf: [55, 78], culture: [80, 98], risk: 0.05, salMult: [0.90, 1.10], blurb: "Lifts the whole team, low drama." },
    { id: "rising",  label: "Rising Star",          emoji: "⭐", perf: [45, 68], culture: [60, 85], risk: 0.10, salMult: [0.70, 0.95], blurb: "Hungry, cheap, lots of upside." },
    { id: "merc",    label: "Mercenary",            emoji: "💸", perf: [75, 95], culture: [25, 50], risk: 0.32, salMult: [1.40, 1.90], blurb: "Great results, will leave for more." },
    { id: "steady",  label: "Steady Hand",          emoji: "🧱", perf: [55, 72], culture: [60, 80], risk: 0.06, salMult: [0.95, 1.15], blurb: "Reliable, no surprises." },
    { id: "rough",   label: "Diamond in the Rough", emoji: "💎", perf: [40, 92], culture: [45, 82], risk: 0.14, salMult: [0.55, 0.85], blurb: "Unpolished — could be a steal or a dud. Interview to find out." }
  ];
  function traitById1868(id) { for (var i = 0; i < HIRE_TRAITS_V1868.length; i++) if (HIRE_TRAITS_V1868[i].id === id) return HIRE_TRAITS_V1868[i]; return HIRE_TRAITS_V1868[4]; }
  function makeCandidateV1868(role, roleId, idx, stageMulti) {
    var t = HIRE_TRAITS_V1868[Math.floor(Math.random() * HIRE_TRAITS_V1868.length)];
    var perf = clamp01(Math.round(t.perf[0] + Math.random() * (t.perf[1] - t.perf[0])));
    var culture = clamp01(Math.round(t.culture[0] + Math.random() * (t.culture[1] - t.culture[0])));
    var salMult = t.salMult[0] + Math.random() * (t.salMult[1] - t.salMult[0]);
    var salary = Math.round((role.salMin + Math.random() * (role.salMax - role.salMin)) * salMult * stageMulti);
    return {
      id: "c_" + roleId + "_" + idx + "_" + age() + "_" + Math.floor(Math.random() * 100000),
      name: pickOne(['Jamie', 'Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Drew', 'Noa', 'Sage', 'Quinn', 'Reese']) + ' ' + pickOne(['Smith', 'Jones', 'Lee', 'Park', 'Chen', 'Brown', 'Davis', 'Wilson', 'Frost', 'Vance', 'Ortiz', 'Khan']),
      traitId: t.id, performance: perf, cultureFit: culture, leaveRisk: t.risk, salaryAsk: salary,
      revealed: { skill: false, refs: false }
    };
  }
  function ensureCandidatesV1868(biz, roleId) {
    if (!biz._candidatesV1868 || typeof biz._candidatesV1868 !== "object") biz._candidatesV1868 = {};
    var pool = biz._candidatesV1868[roleId];
    if (pool && pool.year === age() && Array.isArray(pool.list) && pool.list.length) return pool;
    var role = BIZ_ROLES[roleId]; if (!role) return null;
    var stageMulti = ({ idea: 0.80, 'pre-revenue': 0.85, early: 0.90, growth: 1.0, scale: 1.15, mature: 1.20 })[biz.stage] || 1.0;
    var count = 2 + Math.floor(Math.random() * 2); // 2-3 candidates
    var list = [];
    for (var i = 0; i < count; i++) list.push(makeCandidateV1868(role, roleId, i, stageMulti));
    biz._candidatesV1868[roleId] = { year: age(), list: list };
    return biz._candidatesV1868[roleId];
  }
  function renderHiringV1868(biz, roleId) {
    var role = BIZ_ROLES[roleId];
    var pool = ensureCandidatesV1868(biz, roleId);
    if (!role || !pool || !pool.list.length) {
      return '<div class="biz1862-subsection"><div class="section-label">Candidates</div><div class="biz1861-spark-empty">No candidates right now — check back next year.</div><div style="margin-top:8px">' + actionBtn("Back to roles", "bizCloseHiringV1868()", "blue", false) + '</div></div>';
    }
    var cash = num(biz.cashInBusiness);
    var cards = pool.list.map(function (c) {
      var t = traitById1868(c.traitId);
      var skillTxt = c.revealed.skill ? ('<b class="' + (c.performance >= 75 ? "good" : c.performance >= 55 ? "warn" : "bad") + '">' + c.performance + '/100</b>') : '<i style="opacity:.7">interview to reveal</i>';
      var refsTxt = c.revealed.refs ? ('Culture <b>' + c.cultureFit + '</b> · flight risk <b class="' + (c.leaveRisk >= 0.2 ? "bad" : "good") + '">' + Math.round(c.leaveRisk * 100) + '%</b>') : '<i style="opacity:.7">check references to reveal</i>';
      var canHire = cash >= c.salaryAsk * 0.5;
      return '<div class="biz1862-role">' +
        '<div class="biz1862-role-head"><span class="biz1862-role-emoji">' + escH(t.emoji) + '</span><b>' + escH(c.name) + '</b></div>' +
        '<span class="biz1862-role-boost">' + escH(t.label) + ' — ' + escH(t.blurb) + '</span>' +
        '<div style="font-size:12px;margin:6px 0;line-height:1.5">Skill: ' + skillTxt + '<br>' + refsTxt + '</div>' +
        '<div class="biz1862-role-foot"><em>asks ' + compactMoneyV1861(c.salaryAsk) + '/yr</em></div>' +
        '<div class="biz1862-role-foot" style="flex-wrap:wrap;gap:4px;margin-top:4px">' +
          actionBtn("Interview $1K", "bizInterviewCandidateV1868('" + roleId + "','" + c.id + "','skill')", "blue", c.revealed.skill || cash < 1000) +
          actionBtn("Refs $2.5K", "bizInterviewCandidateV1868('" + roleId + "','" + c.id + "','refs')", "blue", c.revealed.refs || cash < 2500) +
          actionBtn("Hire", "bizHireCandidateV1868('" + roleId + "','" + c.id + "')", "green", !canHire) +
          actionBtn("Pass", "bizRejectCandidateV1868('" + roleId + "','" + c.id + "')", "red", false) +
        '</div></div>';
    }).join("");
    return '<div class="biz1862-subsection"><div class="section-label">' + escH(role.emoji || "") + ' Interviewing — ' + escH(role.title) + '</div><div class="biz1862-recruit">' + cards + '</div><div style="margin-top:8px">' + actionBtn("Back to roles", "bizCloseHiringV1868()", "blue", false) + '</div></div>';
  }
  function renderRosterV1862(biz) {
    var emps = biz.employees || [];
    var cofs = (biz.coFounders || []).map(function (c) {
      return '<div class="biz1862-emp founder"><div class="biz1862-emp-top"><span class="biz1862-emp-avatar gold">' + escH(initialsV1862(c.name)) + '</span>' +
        '<div class="biz1862-emp-id"><b>' + escH(c.name) + '</b><span>Co-founder · ' + round(c.equity) + '% equity</span></div></div>' +
        '<div class="biz1862-perf"><div class="biz1862-perf-bar gold" style="width:100%"></div></div>' +
        '<div class="biz1862-emp-foot"><span>Founding team</span><em>equity</em></div></div>';
    }).join("");
    if (!emps.length && !cofs) return '<div class="biz1862-subsection"><div class="section-label">Roster</div><div class="biz1861-spark-empty">No team yet. Hire your first role above — co-founders count separately.</div></div>';
    var staff = emps.slice(0, 12).map(function (e) {
      var role = BIZ_ROLES[e.roleId] || {};
      var perf = round(e.performance);
      var pk = perfKindV1862(perf);
      var tenure = num(e.yearsAtCompany);
      var risk = num(e.leaveRisk) >= 0.18;
      var leavePct = Math.round(num(e.leaveRisk) * 100);
      var trained = (e.trainV1868 && e.trainV1868.year === age()) ? num(e.trainV1868.count) : 0;
      var retained = (e.retainV1868 && e.retainV1868.year === age()) ? num(e.retainV1868.count) : 0;
      return '<div class="biz1862-emp">' +
        '<div class="biz1862-emp-top"><span class="biz1862-emp-avatar">' + escH(initialsV1862(e.name)) + '</span>' +
        '<div class="biz1862-emp-id"><b>' + escH(e.name) + '</b><span>' + escH(role.emoji || "") + ' ' + escH(role.title || e.roleId) + '</span></div>' +
        actionBtn("Fire", "bizFireV1861('" + escH(e.id) + "')", "red", false) + '</div>' +
        '<div class="biz1862-perf"><div class="biz1862-perf-bar ' + pk + '" style="width:' + Math.max(4, Math.min(100, perf)) + '%"></div></div>' +
        '<div class="biz1862-emp-foot"><span>Perf ' + perf + ' · ' + (tenure ? tenure + "y" : "new") + ' · <span class="' + (risk ? "warn" : "good") + '">' + leavePct + '% leave risk</span></span><em>' + moneyText(e.salary) + '/yr</em></div>' +
        '<div class="biz1862-role-foot" style="flex-wrap:wrap;gap:4px;margin-top:6px">' +
          actionBtn("Train " + trained + "/3", "bizTrainEmployeeV1868('" + escH(e.id) + "')", "blue", trained >= 3) +
          actionBtn("Give raise", "bizRetainEmployeeV1868('" + escH(e.id) + "','raise')", "gold", retained >= 2) +
          actionBtn("Recognize", "bizRetainEmployeeV1868('" + escH(e.id) + "','perk')", "green", retained >= 2) +
        '</div>' +
        '</div>';
    }).join("");
    return '<div class="biz1862-subsection"><div class="section-label">Roster</div><div class="biz1862-roster">' + cofs + staff + '</div></div>';
  }
  function renderTeamPanelV1862(biz) {
    return '<div class="biz1862-panel">' +
      renderTeamSummaryV1862(biz) +
      renderRecruitRailV1862(biz) +
      renderRosterV1862(biz) +
      renderBizGraphsV1861(biz, "team") +
      '</div>';
  }
  function renderFundingPanelV1862(biz) {
    return '<div class="biz1862-panel"><div class="biz1861-control-grid">' + renderFounderPayControlsV1862(biz) + renderCapitalControlsV1862(biz) + renderFundingControlsV1862(biz) + '</div>' + renderFundingHistoryV1862(biz) + renderBizGraphsV1861(biz, "funding") + '</div>';
  }
  function renderActivePanelBodyV1862(biz, panel) {
    if (panel === "product") return renderProductPanelV1862(biz);
    if (panel === "growth") return renderGrowthPanelV1862(biz);
    if (panel === "team") return renderTeamPanelV1862(biz);
    if (panel === "funding") return renderFundingPanelV1862(biz);
    if (panel === "budget") return renderBudgetPanelV1862(biz);
    if (panel === "public") return '<div class="biz1862-panel">' + renderPublicDeskV1861(biz) + '</div>';
    if (panel === "exit") return '<div class="biz1862-panel">' + renderExitDeskV1861(biz) + '</div>';
    return renderOverviewPanelV1862(biz);
  }
  function renderActiveBusinessV1861(biz) {
    if (!biz) return '<section class="panel biz1861-empty"><div class="section-label">Build</div><div class="row"><div><div class="row-title">No active business yet</div><div class="row-sub">Use the founding wizard to create your first company.</div></div><div class="mini-actions">' + actionBtn("Found a Business", "startEntrepreneurV1861()", "green", !canFound()) + '</div></div></section>';
    var panel = dashboardPanelV1862(biz);
    return '<section class="panel biz1861-active biz1862-accent-' + escH(panel) + '">' + renderBizCommandHeaderV1862(biz, panel) + renderActivePanelBodyV1862(biz, panel) + '</section>';
  }

  function renderPublicDeskV1861(biz) {
    if (!biz || !biz.public) return "";
    var price = bizSharePriceV1861(biz);
    var h = bizShareHoldingV1861(biz);
    var shares = h ? num(h.shares) : 0;
    var stakeVal = shares * price;
    var ownPct = bizOwnershipPctV1861(biz);
    var totalShares = num(biz.shares);
    var publicShares = Math.max(0, totalShares - shares);
    var publicFloatPct = totalShares > 0 ? clampN((publicShares / totalShares) * 100, 0, 100) : 0;
    var buyoutCost = Math.round(publicShares * price);
    var hist = (fin().stocksV18 && fin().stocksV18.history && fin().stocksV18.history[biz.shareTicker]) || [price];
    var ipo = num(biz._ipoPrice, price);
    var sinceIpo = ipo > 0 ? ((price - ipo) / ipo) * 100 : 0;
    var lastMove = num(biz.lastPriceMoveV1862);
    var market = num(biz.lastMarketFactorV1862);
    var marketLabel = market > 0.025 ? "Market tailwind" : market < -0.025 ? "Market headwind" : "Flat market";
    var moveLabel = (lastMove > 0 ? "+" : "") + (lastMove * 100).toFixed(1) + "% last update";
    var marketKind = market > 0.025 ? "good" : market < -0.025 ? "bad" : "blue";
    var buyId = "biz1861-buyown-" + escH(biz.uid);
    var sellId = "biz1861-sellown-" + escH(biz.uid);
    return '<div class="biz1861-public"><div class="section-label">📡 Public company — ' + escH(biz.shareTicker) + (biz.controlLost ? ' <span class="biz1861-ctrl-lost">control lost</span>' : ' <span class="biz1861-ctrl-ok">you are CEO</span>') + '</div>' +
      '<div class="biz1861-metric-grid">' +
      metric("Share price", priceTextV1862(price), (sinceIpo >= 0 ? "▲ +" : "▼ ") + Math.round(sinceIpo) + "% since IPO at " + priceTextV1862(ipo), sinceIpo >= 0 ? "good" : "bad") +
      metric("Your stake", moneyText(stakeVal), Math.round(ownPct) + "% · " + compactSharesV1862(shares) + " of " + compactSharesV1862(totalShares) + " sh · counts in net worth", ownPct >= 25 ? "green" : ownPct >= 10 ? "gold" : "bad") +
      metric("Public float", Math.round(publicFloatPct) + "%", compactSharesV1862(publicShares) + " sh trade as " + escH(biz.shareTicker) + " in your Stocks portfolio", "blue") +
      metric("Market signal", marketLabel, moveLabel + " / beta " + (market * 100).toFixed(1) + "%", marketKind) +
      '</div>' + sparkSVG(hist, sinceIpo >= 0 ? BIZ_CHART_COLORS.rev : "#e9927d") +
      '<div class="biz1861-control-grid" style="margin-top:10px">' +
      '<div><b>Invest in yourself</b><span>Buy ' + escH(biz.shareTicker) + ' with personal cash (' + moneyText(wealth()) + ')</span><div class="biz1861-actions">' + actionBtn("Buy $10K", "bizBuyOwnStockV1861(10000)", "green", wealth() < 10000) + actionBtn("Buy $100K", "bizBuyOwnStockV1861(100000)", "green", wealth() < 100000) + actionBtn("Buy Max", "bizBuyOwnStockV1861('max')", "gold", wealth() <= 0) + '</div><div class="biz1861-custom"><input id="' + buyId + '" placeholder="Custom buy" inputmode="numeric">' + actionBtn("Buy", "bizBuyOwnStockCustomV1861('" + buyId + "')", "green", wealth() <= 0) + '</div></div>' +
      '<div><b>Sell shares</b><span>Cash out part of your stake</span><div class="biz1861-actions">' + actionBtn("Sell $10K", "bizSellOwnStockV1861(10000)", "", stakeVal < 10000) + actionBtn("Sell $100K", "bizSellOwnStockV1861(100000)", "", stakeVal < 100000) + actionBtn("Sell All", "bizSellOwnStockV1861('max')", "red", stakeVal <= 0) + '</div><div class="biz1861-custom"><input id="' + sellId + '" placeholder="Custom sell" inputmode="numeric">' + actionBtn("Sell", "bizSellOwnStockCustomV1861('" + sellId + "')", "", stakeVal <= 0) + '</div></div>' +
      (function () {
        var divRate = clampN(num(biz.dividendRateV1862), 0, 0.10);
        function dvb(r) { return actionBtn(r === 0 ? "Off" : Math.round(r * 100) + "%", "bizSetDividendRateV1862(" + r + ")", Math.abs(divRate - r) < 0.001 ? "gold" : "", false); }
        return '<div class="biz1862-ctl ctl-green"><b>Dividend policy</b><span>Return a share of yearly profit to holders. Last paid: ' + moneyText(num(biz._lastDividendV1862)) + ' (' + moneyText(num(biz._lastFounderDivV1862)) + ' to you). Capped to cash — never bankrupts the company.</span><div class="biz1861-actions">' + dvb(0) + dvb(0.05) + dvb(0.10) + '</div></div>';
      })() +
      '<div class="biz1862-ctl ctl-blue"><b>Split stock</b><span>Reprice shares without changing value, your ' + Math.round(ownPct) + '% stake, or the ' + Math.round(publicFloatPct) + '% float. Price now ' + moneyText(price) + ' · ' + compactSharesV1862(totalShares) + ' shares.</span><div class="biz1861-actions">' + actionBtn("2:1 Split", "bizSplitStockV1862(2)", "", false) + actionBtn("10:1 Split", "bizSplitStockV1862(10)", "", false) + actionBtn("1:2 Reverse", "bizSplitStockV1862(0.5)", "", false) + '</div></div>' +
      (ownPct >= 90 && publicShares > 0 ? '<div class="biz1862-ctl ctl-gold"><b>Take private</b><span>Buy out the remaining ' + compactSharesV1862(publicShares) + ' public shares (~' + moneyText(buyoutCost) + ') and delist ' + escH(biz.shareTicker) + '.</span><div class="biz1861-actions">' + actionBtn("Take Private", "bizTakePrivateV1862()", "gold", wealth() < buyoutCost) + '</div></div>' : '') +
      '</div>' +
      (ownPct < 25 && ownPct > 0 ? '<div class="biz1861-sublabel" style="color:#e0a35f">Hold ≥25% to keep a strong grip on the board. Below 10% you lose CEO control.</div>' : '') +
      '</div>';
  }

  function renderExitDeskV1861(biz) {
    var offer = biz.acquisitionOffer;
    var ipoReady = num(biz.annualRevenue) >= 10000000 && num(biz.yearsOld) >= 5;
    var floatId = "biz1861-float-" + escH(biz.uid);
    var goPublic = biz.public ? "" :
      '<div class="biz1861-ipo-row"><b>Go Public (IPO)</b><span>' + (ipoReady ? "Float part of the company on the market — keep your stake, stay CEO, and trade " + escH((biz.name || "").slice(0, 4).toUpperCase()) + " shares." : "Requires $10M+ revenue and 5+ years.") + '</span>' +
      '<div class="biz1861-actions">' + actionBtn("IPO — Float 40%", "bizGoPublicV1861(40)", "green", !ipoReady) + actionBtn("Float 25%", "bizGoPublicV1861(25)", "", !ipoReady) + actionBtn("Float 60%", "bizGoPublicV1861(60)", "", !ipoReady) + '</div>' +
      (ipoReady ? '<div class="biz1861-custom"><input id="' + floatId + '" placeholder="Custom float % (5-90)" inputmode="numeric">' + actionBtn("IPO This %", "bizGoPublicCustomV1861('" + floatId + "')", "green", false) + '</div>' : '') +
      '</div>';
    return '<div class="biz1861-exit"><div class="section-label">Exit desk</div>' +
      (offer && !biz.public ? '<div class="biz1861-offer"><b>Acquisition offer: ' + moneyText(offer.offerPrice) + '</b><span>Your share ' + moneyText(offer.founderProceeds) + ' at ' + round(offer.revMult) + 'x revenue.</span><div class="biz1861-actions">' + actionBtn("Accept Offer", "bizAcceptAcquisitionV1861()", "green", false) + actionBtn("Decline", "bizDeclineAcquisitionV1861()", "red", false) + '</div></div>' : '') +
      goPublic +
      '<div class="biz1861-actions">' +
      actionBtn("Wind Down", "bizExitActionV1861('wind_down')", "red", false) +
      (biz.public ? "" : actionBtn("Trade Sale", "bizExitActionV1861('trade_sale')", "gold", num(biz.annualRevenue) <= 0)) +
      (biz.public ? "" : actionBtn("MBO", "bizExitActionV1861('mbo')", "gold", num(biz.annualRevenue) <= 0)) +
      '</div></div>';
  }

  function renderHistoryV1861() {
    var B = initBiz();
    var rows = (B.exitHistory || []).slice(-6).reverse().map(function (x) {
      return '<div class="biz1861-history-row"><b>' + escH(x.name) + '</b><span>' + escH(String(x.exitType || "exit").replace(/_/g, " ")) + ' / ' + moneyText(x.salePrice || 0) + ' / age ' + round(x.age) + '</span></div>';
    }).join("");
    return rows ? '<section class="panel biz1861-history"><div class="section-label">Founder track record</div>' + rows + '</section>' : "";
  }

  function renderEntrepreneurHubV1861() {
    var B = initBiz();
    var active = activeBusinesses();
    var wizard = renderWizardV1861();
    // Old-business migration/repair tooling moved to the hidden Dev Tools (?dev=1); migration
    // still runs automatically via initBiz(), and the data fn oldBusinessCheckV1861 stays exported.
    var html = '<div class="biz1861-shell">' + renderFounderStatsV1861(B, active) + wizard + renderBusinessSwitcherV1861(active) + renderActiveBusinessV1861(getActiveBiz()) + renderHistoryV1861();
    if (active.length && active.length < 3) html += '<section class="panel biz1861-new"><div class="row"><div><div class="row-title">Start another company</div><div class="row-sub">Multiple companies split attention and raise stress, but can build a portfolio.</div></div><div class="mini-actions">' + actionBtn("Found Another", "bizStartSecondV1861()", "green", false) + '</div></div></section>';
    return html + '</div>';
  }
  window.renderEntrepreneurHubV1861 = renderEntrepreneurHubV1861;

  // Route ONLY the Entrepreneurship/founder hub to the ported system. The old
  // Business hub (business-entities.js renderBusinessHubV1840) keeps the Business
  // route and runs independently — the two sides are deliberately separate, and
  // never share companies. (Business = owned companies / entities / trust /
  // family enterprise; Entrepreneurship = the ported founder journey.)
  var prevRHC1861 = window.renderHubContent || (typeof renderHubContent === "function" ? renderHubContent : null);
  if (typeof prevRHC1861 === "function" && !prevRHC1861.__entrepreneurV1861) {
    var wrappedRHC1861 = function (hubId) {
      try {
        var id = String(hubId || "").toLowerCase();
        if (id === "entrepreneurship" || id === "founder" || id === "startup") return renderEntrepreneurHubV1861();
      } catch (e) {}
      return prevRHC1861.apply(this, arguments) || "";
    };
    wrappedRHC1861.__entrepreneurV1861 = true;
    window.renderHubContent = wrappedRHC1861;
    try { renderHubContent = wrappedRHC1861; } catch (e6) {}
  }

  // ------------------------------------------------ yearly engine (Phase C) --
  var BIZ_ROLES = {
    tech_lead:  { title:'CTO / Tech Lead',       emoji:'💻',  salMin:80000, salMax:140000, skill:'execution',  desc:'Speeds dev, cuts tech debt, enables more hires.' },
    sales_lead: { title:'Head of Sales',          emoji:'📞',  salMin:55000, salMax:100000, skill:'salescraft', desc:'Multiplies conversion, manages sales team.' },
    mktg_mgr:   { title:'Marketing Manager',      emoji:'📣',  salMin:45000, salMax:80000,  skill:'vision',     desc:'Cuts CAC, builds brand, manages content.' },
    ops_mgr:    { title:'Operations Manager',     emoji:'⚙️',  salMin:50000, salMax:85000,  skill:'execution',  desc:'Reduces burn rate, improves logistics, scales ops.' },
    cfo:        { title:'CFO / Finance Director', emoji:'💰',  salMin:90000, salMax:160000, skill:'finance',    desc:'Unlocks debt financing, improves investor relations.' },
    hr_mgr:     { title:'HR Manager',             emoji:'👥',  salMin:45000, salMax:75000,  skill:'leadership', desc:'Cuts attrition, boosts culture, speeds hiring.' },
    dev_jr:     { title:'Junior Developer',       emoji:'👨‍💻', salMin:30000, salMax:50000,  skill:'execution',  desc:'Basic dev help. High turnover risk.' },
    dev_sr:     { title:'Senior Developer',       emoji:'🧑‍💻', salMin:55000, salMax:90000,  skill:'execution',  desc:'Strong dev output, reduces tech debt, mentors.' },
    acct_mgr:   { title:'Account Manager',        emoji:'🤝',  salMin:35000, salMax:60000,  skill:'salescraft', desc:'Cuts churn, improves NRR, handles client success.' },
    analyst:    { title:'Data Analyst',           emoji:'📊',  salMin:40000, salMax:65000,  skill:'vision',     desc:'Improves decisions, unlocks conversion analytics.' },
    support:    { title:'Customer Support',       emoji:'🎧',  salMin:25000, salMax:40000,  skill:null,         desc:'Cuts churn, improves NPS, essential at scale.' },
    bdr:        { title:'Business Dev Rep',       emoji:'📋',  salMin:30000, salMax:55000,  skill:'salescraft', desc:'Generates leads, feeds the sales pipeline.' },
    pm:         { title:'Product Manager',        emoji:'🗺️',  salMin:55000, salMax:95000,  skill:'vision',     desc:'Coordinates dev, reduces scope creep.' },
  };
  var FUNDING_ROUNDS = {
    preseed: { label:'Pre-Seed', emoji:'🌱', minRaise:25000,    maxRaise:200000,  dilMin:0.05, dilMax:0.15, revMultiple:0,  req:'Idea + passionate founder' },
    seed:    { label:'Seed',     emoji:'🌿', minRaise:200000,   maxRaise:2000000, dilMin:0.15, dilMax:0.25, revMultiple:8,  req:'MVP or early traction' },
    seriesA: { label:'Series A', emoji:'🌳', minRaise:2000000,  maxRaise:10000000,dilMin:0.20, dilMax:0.30, revMultiple:12, req:'Revenue + growth' },
    seriesB: { label:'Series B', emoji:'🏢', minRaise:10000000, maxRaise:30000000,dilMin:0.15, dilMax:0.25, revMultiple:18, req:'Proven unit economics' },
    seriesC: { label:'Series C+',emoji:'🏦', minRaise:30000000, maxRaise:1e8,     dilMin:0.10, dilMax:0.20, revMultiple:25, req:'Path to profitability' },
  };
  window.EntrepreneurV1861_BIZ_ROLES = BIZ_ROLES;
  window.EntrepreneurV1861_FUNDING_ROUNDS = FUNDING_ROUNDS;

  // Founder pay model (v18.62): a founder draws a living salary from the company
  // (a real operating cost, capped to what the company can fund) plus the existing
  // profit distribution, and can pull a yearly one-time distribution from cash.
  var FOUNDER_SALARY_RATE_DEFAULT = 0.05;   // share of revenue, adjustable 3%–10%
  var FOUNDER_SALARY_FLOOR_DEFAULT = 40000; // minimum livable draw when affordable
  var FOUNDER_SALARY_RATE_MIN = 0.03, FOUNDER_SALARY_RATE_MAX = 0.10;
  var DISTRIBUTION_RATE_V1862 = 0.15;       // yearly one-time chunk of company cash

  function clamp01(v) { return clampN(v, 0, 100); }
  function setMoney(v) { S().money = round(v); }
  function addMoney(v) { S().money = round(wealth() + num(v)); }
  function bump(key, delta) { try { if (typeof window.applyDeltas === "function") window.applyDeltas((function () { var o = {}; o[key] = delta; return o; })()); } catch (e) {} }

  function runEntrepreneurYearV1861() {
    var B = fin().bizV1860;
    if (!B || !B.active) return;
    B.yearsAsFounder = num(B.yearsAsFounder) + 1;
    // Seed this year's taxable founder income with any manual distributions taken
    // since the last tick, then clear the pending bucket. Salary + profit share add
    // on top below, so each draw is taxed exactly once.
    fin().lastEntrepreneurIncome = round(num(fin().pendingFounderDrawV1862));
    fin().pendingFounderDrawV1862 = 0;
    var g = 0.3;
    B.skills.vision     = Math.min(10, num(B.skills.vision, 1)     + g * 0.8);
    B.skills.execution  = Math.min(10, num(B.skills.execution, 1)  + g * 0.7);
    B.skills.salescraft = Math.min(10, num(B.skills.salescraft, 1) + g * 0.6);
    B.skills.leadership = Math.min(10, num(B.skills.leadership, 1) + g * 0.5);
    B.skills.finance    = Math.min(10, num(B.skills.finance, 1)    + g * 0.4);
    B.skills.networking = Math.min(10, num(B.skills.networking, 1) + g * 0.5);
    var activeCount = (B.businesses || []).filter(function (b) { return b.active && !b.dead; }).length;
    (B.businesses || []).forEach(function (biz) {
      if (!biz.active || biz.dead) return;
      var attentionMult = activeCount >= 3 ? 0.55 : activeCount === 2 ? 0.70 : 1.0;
      _processSingleBizYear(biz, attentionMult);
    });
    if (activeCount >= 2) bump("stress", (activeCount - 1) * 15);
    if (num(B._loanBalance) > 0 && num(B._loanMonthly) > 0) {
      var annual = num(B._loanMonthly) * 12;
      setMoney(Math.max(0, wealth() - annual));
      B._loanBalance = Math.max(0, num(B._loanBalance) - annual);
      if (B._loanBalance === 0) log("🏦 Business loan fully repaid.");
    }
  }

  function _processSingleBizYear(biz, attentionMult) {
    var B = fin().bizV1860;
    var t = BIZ_TYPES[biz.type];
    if (!t) return;
    biz.yearsOld = num(biz.yearsOld) + 1;
    if (biz.productStage !== 'live' && biz.productStage !== 'v2+') {
      var execBonus = 0.8 + (num(B.skills.execution, 1) / 10) * 0.4;
      var alloc = biz._devAlloc || { features: 40, bugfix: 20, ux: 20, custdev: 20 };
      biz.productDev = num(biz.productDev) + Math.round(alloc.features * 0.8 * execBonus * attentionMult);
      biz.techDebt = Math.min(100, num(biz.techDebt) + alloc.features * 0.2);
      biz.productQuality = clamp01(num(biz.productQuality) + alloc.ux * 0.4 + alloc.bugfix * 0.5 - biz.techDebt * 0.1);
      biz.nps = clampN(num(biz.nps) + alloc.custdev * 0.5, -100, 100);
      var th = { concept: 80, mvp: 180, beta: 300 };
      if (biz.productStage === 'concept' && biz.productDev >= th.concept) { biz.productStage = 'mvp'; biz.stage = 'pre-revenue'; log("🛠️ " + biz.name + ": MVP reached. Time to find your first customers."); }
      else if (biz.productStage === 'mvp' && biz.productDev >= th.mvp) { biz.productStage = 'beta'; log("🧪 " + biz.name + ": Beta version ready."); }
      else if (biz.productStage === 'beta' && biz.productDev >= th.beta) { _bizProductLaunch(biz); return; }
    } else {
      var alloc2 = biz._devAlloc || { features: 40, bugfix: 20, ux: 20, custdev: 20 };
      biz.techDebt = Math.max(0, num(biz.techDebt) - alloc2.bugfix * 0.6 + alloc2.features * 0.15);
      biz.productQuality = clamp01(num(biz.productQuality) + alloc2.ux * 0.3 - biz.techDebt * 0.05 + alloc2.bugfix * 0.2);
      biz.nps = clampN(num(biz.nps) + alloc2.custdev * 0.3 - num(biz.churnRate) * 10 + (num(biz.productQuality) - 50) * 0.1, -100, 100);
    }
    if (biz.productStage !== 'live' && biz.productStage !== 'v2+') {
      var devCost = rnd(2000, 8000);
      var buildStaff = (biz.employees || []).reduce(function (s, e) { return s + num(e.salary); }, 0);
      biz.cashInBusiness = num(biz.cashInBusiness) - devCost - buildStaff;
      biz.annualCosts = devCost + (biz.coFounders || []).length * 40000 + buildStaff;
      biz.annualRevenue = 0;
      biz.annualProfit = -biz.annualCosts;
      biz.burnRate = biz.annualCosts / 12;
      biz.runway = biz.cashInBusiness > 0 && biz.burnRate > 0 ? Math.round(biz.cashInBusiness / biz.burnRate) : (biz.cashInBusiness > 0 ? 999 : 0);
      log("🔨 " + biz.name + " — building " + biz.productStage + ". Dev progress: " + biz.productDev + ". Cash: " + moneyText(biz.cashInBusiness) + ".");
      _checkBizDeath(biz);
      return;
    }
    _runBizSalesEngine(biz, attentionMult);
    _runBizHREngine(biz);
    _runBizFinancialEngine(biz);
    _bizYearlyGrantsV1861(biz);
    if (biz.public) _bizUpdateSharePriceV1861(biz);
    if (Math.random() < 0.35 && age() - num(biz.lastEventAge, -99) >= 2) { _fireBizEvent(biz); biz.lastEventAge = age(); }
    _checkBizStageUp(biz);
    if (!biz.public && ['scale', 'mature'].indexOf(biz.stage) >= 0 && num(biz.valuation) >= 5000000 && !biz.acquisitionOffer && Math.random() < 0.15) _generateAcquisitionOffer(biz);
  }

  // ----------------------------------------- grants + public-company (IPO) ---
  // Non-dilutive grants. Every industry is eligible; green/sustainability and
  // social enterprise get a higher chance and larger awards.
  function _bizYearlyGrantsV1861(biz) {
    if (!biz || biz.dead || biz.active === false) return;
    var mission = (biz.type === 'greentech' || biz.type === 'social_e');
    var chance = mission ? 0.22 : 0.08;
    var stageBoost = ({ idea: 0.5, 'pre-revenue': 0.7, early: 1, growth: 1.1, scale: 1.2, mature: 0.9 })[biz.stage] || 1;
    if (Math.random() > chance * stageBoost) return;
    var base = ({ idea: 15000, 'pre-revenue': 30000, early: 75000, growth: 200000, scale: 500000, mature: 300000 })[biz.stage] || 50000;
    var amt = Math.round(base * (mission ? (1.5 + Math.random()) : (0.6 + Math.random())));
    biz.cashInBusiness = num(biz.cashInBusiness) + amt;
    biz.runway = biz.burnRate > 0 ? Math.round(biz.cashInBusiness / biz.burnRate) : 999;
    if (!Array.isArray(biz.grantHistory)) biz.grantHistory = [];
    biz.grantHistory.push({ age: age(), amount: amt });
    var kind = biz.type === 'greentech' ? "green / ESG" : biz.type === 'social_e' ? "social impact" : "innovation";
    log("🏛️ " + biz.name + " won a " + kind + " grant: " + moneyText(amt) + " (non-dilutive cash).", {});
  }

  function ensureStocksV18Store() {
    var f = fin();
    if (!f.stocksV18 || typeof f.stocksV18 !== "object") f.stocksV18 = { holdings: [], prices: {}, history: {} };
    if (!Array.isArray(f.stocksV18.holdings)) f.stocksV18.holdings = [];
    if (!f.stocksV18.prices || typeof f.stocksV18.prices !== "object") f.stocksV18.prices = {};
    if (!f.stocksV18.history || typeof f.stocksV18.history !== "object") f.stocksV18.history = {};
    return f.stocksV18;
  }
  function bizShareHoldingV1861(biz) {
    if (!biz || !biz.shareTicker) return null;
    var m = fin().stocksV18; if (!m || !Array.isArray(m.holdings)) return null;
    return m.holdings.find(function (h) { return h.id === biz.shareTicker; }) || null;
  }
  function bizSharePriceV1861(biz) {
    if (!biz || !biz.shareTicker) return 0;
    var m = fin().stocksV18 || {}; var p = m.prices || {};
    return num(p[biz.shareTicker]) || num(biz._ipoPrice) || 0;
  }
  function bizOwnershipPctV1861(biz) {
    if (!biz || !num(biz.shares)) return 0;
    var h = bizShareHoldingV1861(biz);
    return h ? clampN((num(h.shares) / num(biz.shares)) * 100, 0, 100) : 0;
  }
  function makeTickerV1861(name, taken) {
    var base = String(name || "CO").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) || "CO";
    var t = base, i = 1;
    while (taken[t]) { t = base.slice(0, 3) + i; i++; }
    return t;
  }
  // Market sentiment from the rest of the stock market (excludes player tickers),
  // so a public company also rises/falls with the broader market.
  function _marketFactorV1861() {
    try {
      var m = fin().stocksV18 || {}; var hist = m.history || {};
      var mine = ((fin().bizV1860 && fin().bizV1860.businesses) || []).map(function (x) { return x.shareTicker; });
      var ids = Object.keys(hist).filter(function (id) { return mine.indexOf(id) < 0; });
      var sum = 0, cnt = 0;
      ids.forEach(function (id) { var h = hist[id]; if (h && h.length >= 2) { var a = h[h.length - 2], b = h[h.length - 1]; if (a) { sum += (b - a) / a; cnt++; } } });
      return cnt ? clampN(sum / cnt, -0.4, 0.4) : (Math.random() - 0.45) * 0.1;
    } catch (e) { return 0; }
  }
  function _bizUpdateSharePriceV1861(biz) {
    if (!biz.shareTicker || !num(biz.shares)) return;
    var m = ensureStocksV18Store();
    var fair = Math.max(0.01, num(biz.valuation) / num(biz.shares));
    var prev = num(m.prices[biz.shareTicker]) || fair;
    var marketFactor = _marketFactorV1861();
    var noise = (Math.random() - 0.5) * 0.12;
    var next = fair * (1 + 0.6 * marketFactor + noise);
    next = Math.max(0.01, Math.round((prev * 0.3 + next * 0.7) * 100) / 100);
    m.prices[biz.shareTicker] = next;
    if (!Array.isArray(m.history[biz.shareTicker])) m.history[biz.shareTicker] = [prev];
    m.history[biz.shareTicker] = m.history[biz.shareTicker].concat([next]).slice(-20);
    biz.lastMarketFactorV1862 = marketFactor;
    biz.lastPriceMoveV1862 = prev > 0 ? (next - prev) / prev : 0;
  }
  function _bizFullyExitPublic(biz) {
    biz.active = false; biz.exitType = 'ipo_exit'; biz.exitAge = age();
    var B = fin().bizV1860; if (B) { if (!Array.isArray(B.exitHistory)) B.exitHistory = []; B.exitHistory.push({ bizId: biz.uid, name: biz.name, exitType: 'ipo_exit', salePrice: 0, age: age() }); B.totalExits = num(B.totalExits) + 1; }
    log("🏁 You sold your entire stake in " + biz.name + ". Fully exited.");
  }
  // Take the company private: remove the public ticker from the market; your shares
  // become private equity again (still counted via the company valuation in net worth).
  function _bizTakePrivateV1862(biz) {
    var ticker = biz.shareTicker;
    var m = ensureStocksV18Store();
    if (ticker) { delete m.prices[ticker]; delete m.history[ticker]; m.holdings = m.holdings.filter(function (h) { return h.id !== ticker; }); }
    biz.public = false; biz.controlLost = false; biz.floatPct = 0; biz.equity = 100;
    biz._wasPublicV1862 = true; biz.shareTicker = "";
    log("🔒 " + biz.name + (ticker ? " (" + ticker + ")" : "") + " was taken private and delisted. You own 100% again.");
  }

  function _runBizSalesEngine(biz, attentionMult) {
    var B = fin().bizV1860;
    var sales = num(B.skills.salescraft, 1);
    var mktg = num(biz._mktgBudget);
    var qualityMult = 0.5 + (num(biz.productQuality) / 100) * 1.0;
    var npsBonus = biz.nps > 40 ? 1.2 : biz.nps < -10 ? 0.7 : 1.0;
    var stageGrowth = ({ 'pre-revenue': 0.02, early: 0.08, growth: 0.18, scale: 0.30, mature: 0.10 })[biz.stage] || 0.05;
    var organicRate = (stageGrowth + (sales / 10) * 0.05 + (mktg / 100000) * 0.08) * qualityMult * npsBonus * attentionMult;
    var newCustomers = Math.max(biz.customers === 0 ? rnd(1, 5) : 0, Math.floor(num(biz.customers) * organicRate + (mktg / (num(biz.cac) || 500))));
    var typeDef = BIZ_TYPES[biz.type];
    var baseM = typeDef ? typeDef.marketSizeM : 100;
    // The market expands over time (~4%/yr) and a strong brand reaches more of it, so a
    // great company keeps growing — and growing profit — instead of freezing forever at a
    // hard customer cap (the old `marketSizeM * 100` froze profit once saturated).
    biz._marketExpansionV1862 = num(biz._marketExpansionV1862, 1) * 1.04;
    var brandReach = 0.8 + (num(biz.brand, 30) / 100) * 1.6; // brand 0→0.8x, 100→2.4x
    var custCap = Math.round(baseM * 120 * brandReach * biz._marketExpansionV1862);
    // Soft saturation: capture at most ~half the remaining headroom each year (diminishing
    // returns) so growth tapers smoothly toward the cap rather than stopping dead.
    var room = Math.max(0, custCap - num(biz.customers));
    newCustomers = Math.min(Math.max(0, newCustomers), Math.ceil(room * 0.5) + 1);
    biz.customers = Math.min(custCap, num(biz.customers) + newCustomers);
    if (typeDef) biz.marketSize = Math.max(num(biz.marketSize), baseM * 1000000 * biz._marketExpansionV1862);
    var churnMult = biz.nps < 0 ? 1.4 : biz.nps > 50 ? 0.7 : 1.0;
    var churned = Math.floor(num(biz.customers) * num(biz.churnRate) * churnMult);
    biz.customers = Math.max(0, biz.customers - churned);
    biz.cac = newCustomers > 0 ? (Math.round(mktg / newCustomers) || rnd(50, 500)) : biz.cac;
    if (biz.type === 'media' && fame() > 0) biz.customers += Math.floor(fame() * 0.5);
  }

  function _runBizHREngine(biz) {
    var B = fin().bizV1860;
    var leavers = 0;
    biz.employees = (biz.employees || []).filter(function (emp) {
      emp.yearsAtCompany = num(emp.yearsAtCompany) + 1;
      var cultureDrift = emp.cultureFit >= 70 ? 2 : emp.cultureFit <= 30 ? -4 : 0;
      biz.culture = clamp01(num(biz.culture) + cultureDrift * 0.1);
      var leaveProb = num(emp.leaveRisk) * (1 - num(B.skills.leadership, 1) / 20) * (biz.culture < 50 ? 1.4 : 0.8);
      if (Math.random() < leaveProb) { leavers++; log("😔 " + emp.name + " left " + biz.name + "."); biz.annualCosts = Math.max(0, num(biz.annualCosts) - num(emp.salary)); return false; }
      return true;
    });
    biz.headcount = biz.employees.length + (biz.coFounders || []).length;
    var avgPerf = biz.employees.length > 0 ? biz.employees.reduce(function (s, e) { return s + num(e.performance); }, 0) / biz.employees.length : 70;
    var stress = num((S().stats || {}).stress);
    biz.productivity = clamp01(num(biz.culture) * 0.4 + avgPerf * 0.4 + (100 - stress) * 0.2);
    if (leavers === 0) biz.culture = clamp01(num(biz.culture) + num(B.skills.leadership, 1) * 0.3);
  }

  function _runBizFinancialEngine(biz) {
    var B = fin().bizV1860;
    var gm = num(biz.grossMargin, 0.60);
    var gross = 0;
    if (biz.model === 'saas') { biz.mrr = num(biz.customers) * num(biz._avgOrderValue, 100); gross = biz.mrr * 12; }
    else if (biz.model === 'd2c') { gross = num(biz.customers) * num(biz._avgOrderValue, 200) * 4; }
    else if (biz.model === 'retainer') { gross = num(biz.customers) * num(biz._avgContractValue, 50000); }
    else if (biz.model === 'marketplace') { gross = (num(biz.customers) * num(biz._avgTransactionValue, 100) * 52) * 0.12; }
    else if (biz.model === 'licensing') { gross = num(biz.customers) * num(biz._avgContractValue, 20000); }
    else if (biz.model === 'freemium') { biz.mrr = num(biz.customers) * num(biz._freeConv, 0.06) * num(biz._avgOrderValue, 100); gross = biz.mrr * 12; }
    else if (biz.model === 'ads') { gross = num(biz.customers) * num(biz._avgAdRpu, 30) * (0.7 + num(biz.brand, 30) / 200); }
    else if (biz.model === 'usage') { gross = num(biz.customers) * num(biz._avgOrderValue, 100) * (4 + Math.max(0, num(biz.nps)) / 25); }
    else if (biz.model === 'transaction') { gross = num(biz.customers) * num(biz._avgTransactionValue, 50) * 24 * num(biz._takeRate, 0.04); }
    else if (biz.model === 'franchise') { gross = num(biz.customers) * num(biz._avgOrderValue, 200) * 6; }
    else if (biz.model === 'affiliate') { gross = num(biz.customers) * num(biz._avgOrderValue, 200) * num(biz._commission, 0.12); }
    else { gross = num(biz.customers) * num(biz._avgSellingPrice, 200); }
    if (biz.franchiseActive && num(biz.franchiseUnits) > 0) gross += num(biz.franchiseUnits) * gross * 0.35 * 0.065;
    // Cap revenue BEFORE computing gross profit so revenue and profit stay consistent
    // (profit can never exceed revenue). This is a high $1T safety net, NOT a balance wall:
    // a dominant company can scale into the hundreds of billions, and the sales engine's
    // soft saturation is what keeps real year-over-year growth sane.
    gross = Math.min(gross, 1e12);
    var grossProfit = gross * gm;
    var staffCosts = (biz.employees || []).reduce(function (s, e) { return s + num(e.salary); }, 0);
    var coFounderCosts = (biz.coFounders || []).length * 60000;
    var mktgCosts = num(biz._mktgBudget);
    // v18.69 — richer, industry-specific operating costs that actually bite into profit.
    var infraRate = INFRA_RATE_V1869[biz.type] != null ? INFRA_RATE_V1869[biz.type] : 0.01;
    var serverCost = Math.round(gross * infraRate);                        // cloud / server upkeep, by industry
    var officeCost = Math.round(num(biz.headcount) * 12000);               // office / real estate per head
    var toolsCosts = Math.round(num(biz.headcount) * 2400 + gross * 0.005); // software/tools: per-head + 0.5% of revenue
    var operatingCosts = staffCosts + coFounderCosts + mktgCosts + toolsCosts + serverCost + officeCost;
    // Founder salary: pay yourself a living wage from the company so founding can be
    // your livelihood before it turns a net profit. It is a real cost (lowers profit)
    // and is capped at what the company can actually fund this year, so it never drives
    // company cash negative by itself.
    var salRate = clampN(num(biz.founderSalaryRate, FOUNDER_SALARY_RATE_DEFAULT), FOUNDER_SALARY_RATE_MIN, FOUNDER_SALARY_RATE_MAX);
    var salFloor = Math.max(0, num(biz.founderSalaryFloor, FOUNDER_SALARY_FLOOR_DEFAULT));
    var salaryTarget = Math.max(salFloor, Math.round(gross * salRate));
    var fundableForSalary = Math.max(0, num(biz.cashInBusiness) + grossProfit - operatingCosts);
    var founderSalary = Math.max(0, Math.min(salaryTarget, Math.round(fundableForSalary)));
    // v18.69 — corporate tax is a real line: 21% on profit after costs + your salary.
    var preTaxProfit = grossProfit - operatingCosts - founderSalary;
    var corpTax = Math.max(0, Math.round(preTaxProfit * 0.21));
    var totalCosts = operatingCosts + founderSalary + corpTax;
    biz.annualRevenue = gross;
    biz.annualCosts = totalCosts;
    biz.annualProfit = preTaxProfit - corpTax; // after costs, your salary, AND tax
    biz.lifetimeRevenue = num(biz.lifetimeRevenue) + gross;
    biz._founderSalaryPaid = founderSalary;
    biz._serverCostV1869 = serverCost;
    biz._officeCostV1869 = officeCost;
    biz._toolsCostV1869 = toolsCosts;
    biz._corpTaxV1869 = corpTax;
    // v18.69 — market share grows toward your revenue's organic share, but acquisitions / earned gains
    // PERSIST: the yearly recompute only pulls share UP toward the organic floor, never erodes what you
    // bought or won. Rivals then re-enter the open share over time (dynamic field).
    var organicShare = Math.min(100, (gross / Math.max(1, num(biz.marketSize))) * 100);
    if (organicShare > num(biz.marketShare)) biz.marketShare = clampN(num(biz.marketShare) + (organicShare - num(biz.marketShare)) * 0.4, 0, 100);
    _bizCompetitorDynamicsV1869(biz);
    var founderPayout = Math.max(0, Math.round(biz.annualProfit * clampN(num(biz.founderDistRateV1869, 0.4), 0, 0.9)));
    var retainedProfit = biz.annualProfit - founderPayout;
    biz.cashInBusiness = num(biz.cashInBusiness) + retainedProfit;
    biz.burnRate = totalCosts / 12;
    biz.runway = biz.burnRate > 0 ? Math.round(biz.cashInBusiness / biz.burnRate) : 999;
    var BASE_MULT = ({ 'pre-revenue': 1.5, early: 4, growth: 8, scale: 14, mature: 10 })[biz.stage] || 4;
    var profitFactor = biz.annualProfit > 0 ? 1.3 : biz.annualProfit < -gross * 0.3 ? 0.6 : 0.9;
    var brandFactor = 1 + num(biz.brand, 30) / 200;
    var revMult = BASE_MULT * profitFactor * brandFactor;
    // No hard valuation ceiling: valuation scales with revenue x multiple + cash, so a
    // company that keeps earning keeps getting more valuable (was clamped to $10B, which
    // froze growth past ~$10B even while revenue and profit climbed).
    biz.valuation = Math.max(0, gross * revMult + biz.cashInBusiness * 0.5);
    biz.brand = clamp01(num(biz.brand) + (biz.nps > 30 ? 2 : biz.nps < 0 ? -1 : 0.5) + (biz.annualProfit > 0 ? 1 : 0));
    B.founderReputation = clamp01(num(B.founderReputation, 30) + (biz.annualProfit > 50000 ? 2 : biz.annualProfit > 0 ? 1 : -1) + num(B.yearsAsFounder) * 0.1);
    if (!Array.isArray(biz.revenueHistory)) biz.revenueHistory = [];
    biz.revenueHistory.push({ age: age(), revenue: gross, profit: biz.annualProfit, valuation: biz.valuation, customers: num(biz.customers), mktg: num(biz._mktgBudget), costs: totalCosts, headcount: num(biz.headcount), marketShare: biz.marketShare });
    if (biz.revenueHistory.length > 30) biz.revenueHistory.shift();
    B.lifetimeRevenue = num(B.lifetimeRevenue) + gross;
    biz._yearWithdrawn = 0;
    var founderTake = founderSalary + founderPayout; // living salary + profit distribution
    if (founderTake > 0) {
      biz._yearWithdrawn = founderTake;
      addMoney(founderTake);
      B.lifetimeProfit = num(B.lifetimeProfit) + founderTake;
      fin().lastEntrepreneurIncome = round(num(fin().lastEntrepreneurIncome) + founderTake); // taxed by v18.24 true-up
    }
    // Dividends: a public company can return a % of POSITIVE profit to shareholders. The
    // pool is capped to available cash so a dividend can never push the company into the red.
    // You receive your ownership share (taxable); the public float's share leaves the company.
    biz._lastDividendV1862 = 0; biz._lastFounderDivV1862 = 0;
    if (biz.public && num(biz.dividendRateV1862) > 0 && biz.annualProfit > 0) {
      var pool = Math.min(Math.round(biz.annualProfit * clampN(num(biz.dividendRateV1862), 0, 0.10)), Math.max(0, Math.round(num(biz.cashInBusiness))));
      if (pool > 0) {
        biz.cashInBusiness = num(biz.cashInBusiness) - pool;
        var founderDiv = Math.round(pool * clampN(bizOwnershipPctV1861(biz) / 100, 0, 1));
        biz._lastDividendV1862 = pool; biz._lastFounderDivV1862 = founderDiv;
        if (founderDiv > 0) {
          addMoney(founderDiv);
          B.lifetimeProfit = num(B.lifetimeProfit) + founderDiv;
          fin().lastEntrepreneurIncome = round(num(fin().lastEntrepreneurIncome) + founderDiv);
        }
        log("💵 " + biz.name + " paid a " + Math.round(num(biz.dividendRateV1862) * 100) + "% dividend — " + moneyText(pool) + " to shareholders (" + moneyText(founderDiv) + " to you).", founderDiv > 0 ? { money: founderDiv } : {});
      }
    }
    var emoji = BIZ_TYPES[biz.type] ? BIZ_TYPES[biz.type].emoji : '🏢';
    var takeNote = founderTake > 0 ? (". You took " + moneyText(founderTake) + " — salary " + moneyText(founderSalary) + (founderPayout > 0 ? " + profit share " + moneyText(founderPayout) : "")) : "";
    log(emoji + " " + biz.name + " — Revenue " + moneyText(gross) + ", Profit " + moneyText(biz.annualProfit) + ", Cash " + moneyText(biz.cashInBusiness) + ", Customers " + biz.customers + ", Stage " + String(biz.stage).toUpperCase() + takeNote + ".", founderTake > 0 ? { money: founderTake } : {});
    if (biz.runway < 6 && biz.runway > 0 && biz.cashInBusiness > 0) log("🚨 " + biz.name + ": only " + biz.runway + " months runway. Inject capital, raise, or cut costs.");
    _checkBizDeath(biz);
  }

  function _checkBizDeath(biz) {
    if (biz.cashInBusiness <= 0 && biz.runway <= 0) {
      biz.active = false; biz.dead = true;
      log("💀 " + biz.name + " ran out of cash and closed. The experience stays with you.");
      bump("stress", 30); bump("happiness", -20);
      var B = fin().bizV1860; if (B) B.founderReputation = clamp01(num(B.founderReputation, 30) - 10);
      if (B && !B.businesses.some(function (b) { return b.active; })) { B.active = false; log("All businesses closed. Back to square one — but wiser."); }
    }
  }

  function _checkBizStageUp(biz) {
    // Keep the product roadmap cohesive with the company stage: once you scale/mature, your product
    // graduates from "Live" to a scaled "v2" (so a big mature company isn't stuck showing "Live").
    if (biz.productStage === 'live' && (biz.stage === 'scale' || biz.stage === 'mature')) {
      biz.productStage = 'v2';
      log("🏆 " + biz.name + "'s product matured into a scaled v2.");
    }
    var th = { 'pre-revenue': { minRevenue: 1, minCustomers: 1 }, early: { minRevenue: 50000, minCustomers: 10 }, growth: { minRevenue: 500000, minCustomers: 100 }, scale: { minRevenue: 2000000, minCustomers: 500 }, mature: { minRevenue: 10000000, minCustomers: 2000 } };
    var next = { 'pre-revenue': 'early', early: 'growth', growth: 'scale', scale: 'mature' };
    var req = th[biz.stage];
    if (!req || !next[biz.stage]) return;
    if (biz.annualRevenue >= req.minRevenue && biz.customers >= req.minCustomers) {
      var prev = biz.stage; biz.stage = next[biz.stage];
      log("🚀 " + biz.name + " graduated " + String(prev).toUpperCase() + " → " + String(biz.stage).toUpperCase() + "! Valuation " + moneyText(biz.valuation) + ".");
      bump("happiness", 15);
      var B = fin().bizV1860; if (B) B.founderReputation = clamp01(num(B.founderReputation, 30) + 8);
    }
  }

  function _bizProductLaunch(biz) {
    biz.productStage = 'live'; biz.stage = 'early';
    biz.customers = Math.max(num(biz.customers), num(biz.waitlist) > 0 ? Math.floor(num(biz.waitlist) * 0.3) : rnd(5, 20));
    log("🚀 " + biz.name + " — product launched! First " + biz.customers + " customers.");
    bump("happiness", 20);
    var B = fin().bizV1860; if (B) B.founderReputation = clamp01(num(B.founderReputation, 30) + 5);
    _runBizFinancialEngine(biz);
  }

  function _fireBizEvent(biz) {
    var B = fin().bizV1860;
    var events = [
      { prob: 0.15, fire: function () { var v = rnd(10000, 100000); biz.customers = num(biz.customers) + 1; biz.cashInBusiness = num(biz.cashInBusiness) + v; log("📋 " + biz.name + ": major contract — " + pickOne(['Government','Enterprise deal','Media company','Large NGO']) + " for " + moneyText(v) + "."); } },
      { prob: 0.12, fire: function () { biz.brand = clamp01(num(biz.brand) + 15); B.founderReputation = clamp01(num(B.founderReputation, 30) + 10); biz.waitlist = num(biz.waitlist) + rnd(50, 300); log("📰 " + biz.name + " featured in " + pickOne(['TechCrunch','BBC News','The Times','Bloomberg']) + ". Brand surge."); } },
      { prob: 0.10, fire: function () { var emp = (biz.employees || []).find(function (e) { return e.performance > 70; }); if (emp) { log("⭐ " + emp.name + " promoted at " + biz.name + ". Culture improved."); biz.culture = clamp01(num(biz.culture) + 8); } } },
      { prob: 0.10, fire: function () { var c = rnd(5000, 30000); biz.cashInBusiness = Math.max(0, num(biz.cashInBusiness) - c); log("⚖️ Legal dispute at " + biz.name + ". Cost " + moneyText(c) + "."); bump("stress", 10); } },
      { prob: 0.08, fire: function () { var b = rnd(5, 20); biz.churnRate = Math.max(0.02, num(biz.churnRate) - 0.02); biz.nps = clampN(num(biz.nps) + b, -100, 100); log("⭐ " + biz.name + ": product breakthrough. NPS +" + b + "."); } },
      { prob: 0.08, fire: function () { var lost = Math.floor(num(biz.customers) * 0.1); biz.customers = Math.max(0, biz.customers - lost); log("🦈 Competitor undercut " + biz.name + ". Lost " + lost + " customers."); biz.competitivePos = clamp01(num(biz.competitivePos) - 10); } },
      { prob: 0.07, fire: function () { B.skills.networking = Math.min(10, num(B.skills.networking, 1) + 0.5); var nc = rnd(5, 20); biz.customers = num(biz.customers) + nc; log("🤝 " + biz.name + ": referral wave — " + nc + " new customers."); } },
      { prob: 0.06, fire: function () { if ((biz.employees || []).length > 0) { log("😤 Key employee dispute at " + biz.name + ". Culture hit."); biz.culture = clamp01(num(biz.culture) - 15); } } },
      { prob: 0.05, fire: function () { var gn = rnd(20000, 80000); biz.cashInBusiness = num(biz.cashInBusiness) + gn; log("🏆 " + biz.name + " won a business award. " + moneyText(gn) + " prize + PR boost."); biz.brand = clamp01(num(biz.brand) + 10); } },
      { prob: 0.05, fire: function () { var c = rnd(10000, 50000); biz.cashInBusiness = Math.max(0, num(biz.cashInBusiness) - c); log("🔒 Data breach at " + biz.name + ". Cost " + moneyText(c) + "."); biz.pr = clamp01(num(biz.pr) - 20); } },
    ];
    var roll = Math.random(), cum = 0;
    for (var i = 0; i < events.length; i++) { cum += events[i].prob; if (roll < cum) { events[i].fire(); return; } }
  }

  function _generateAcquisitionOffer(biz) {
    var revMult = rnd(4, 12);
    var offerPrice = Math.round(num(biz.annualRevenue) * revMult);
    var founderProceeds = Math.round(offerPrice * (num(biz.equity) / 100));
    biz.acquisitionOffer = { offerPrice: offerPrice, founderProceeds: founderProceeds, revMult: revMult, offeredAge: age() };
    log("💼 Acquisition offer for " + biz.name + ": " + moneyText(offerPrice) + " (" + revMult + "× revenue). Your share " + moneyText(founderProceeds) + ". Accept it in the Business hub.");
  }

  function _bizWindDown(biz) {
    var assets = Math.max(0, num(biz.cashInBusiness) * 0.6);
    if (assets > 0) { var cgt = Math.round(Math.max(0, assets - 3000) * 0.10); addMoney(assets - cgt); }
    biz.active = false; biz.exitType = 'wind_down'; biz.exitAge = age();
    var B = fin().bizV1860; if (B) { if (!Array.isArray(B.exitHistory)) B.exitHistory = []; B.exitHistory.push({ bizId: biz.uid, name: biz.name, exitType: 'wind_down', salePrice: assets, age: age() }); B.totalExits = num(B.totalExits) + 1; }
    bump("stress", -20);
    log("📉 " + biz.name + " wound down. Recovered " + moneyText(assets) + " from remaining assets.");
  }

  function _bizExecuteExit(biz, exitType, proceeds) {
    var gain = Math.max(0, proceeds - 1000000);
    var tax = Math.round(gain * 0.10);
    var net = proceeds - tax;
    addMoney(net);
    biz.active = false; biz.exitType = exitType; biz.exitAge = age();
    var B = fin().bizV1860; if (B) { if (!Array.isArray(B.exitHistory)) B.exitHistory = []; B.exitHistory.push({ bizId: biz.uid, name: biz.name, exitType: exitType, salePrice: net, age: age() }); B.totalExits = num(B.totalExits) + 1; }
    bump("happiness", 30);
    if (B) B.founderReputation = clamp01(num(B.founderReputation, 30) + (exitType === 'ipo' ? 20 : 10));
    log("🎉 EXIT: " + biz.name + " — " + String(exitType).replace('_', ' ').toUpperCase() + ". Proceeds " + moneyText(net) + " (after " + moneyText(tax) + " tax). Life-changing.", { money: net });
    try { if (typeof window.awardMilestone === "function") window.awardMilestone("founder_exit", "Exit", "You exited a company.", 80); } catch (e) {}
    saveGame();
  }

  // ---- actions ----
  window.bizHireV1861 = function (roleId) {
    var biz = getActiveBiz(); if (!biz) return; var role = BIZ_ROLES[roleId]; if (!role) return;
    var stageMulti = ({ idea: 0.80, 'pre-revenue': 0.85, early: 0.90, growth: 1.0, scale: 1.15, mature: 1.20 })[biz.stage] || 1.0;
    var salary = Math.round((role.salMin + Math.random() * (role.salMax - role.salMin)) * stageMulti);
    if (num(biz.cashInBusiness) < salary * 0.5) { toast("Not enough cash in the business to hire."); return; }
    var leadership = num(fin().bizV1860.skills.leadership, 1);
    var cultureFit = clamp01(50 + leadership * 3 + rnd(-20, 20));
    biz.employees.push({ id: roleId + '_' + Date.now(), roleId: roleId, name: pickOne(['Jamie','Alex','Sam','Jordan','Taylor','Morgan','Casey','Riley','Avery','Drew']) + ' ' + pickOne(['Smith','Jones','Lee','Park','Chen','Brown','Davis','Wilson']), salary: salary, cultureFit: cultureFit, performance: clamp01(50 + rnd(-15, 30)), hiredAge: age(), yearsAtCompany: 0, leaveRisk: cultureFit < 50 ? 0.25 : 0.08, isProblem: cultureFit < 30 });
    biz.headcount = num(biz.headcount) + 1; biz.annualCosts = num(biz.annualCosts) + salary;
    log("👤 Hired " + role.title + " at " + biz.name + " for " + moneyText(salary) + "/yr.");
    rerender();
  };
  // Interview + hire flow (v18.68): open a role's candidate pool, screen them, then hire one.
  window.bizOpenHiringV1868 = function (roleId) {
    var biz = getActiveBiz(); if (!biz || !BIZ_ROLES[roleId]) return;
    biz._hiringRoleV1868 = roleId;
    ensureCandidatesV1868(biz, roleId);
    rerender();
  };
  window.bizCloseHiringV1868 = function () { var biz = getActiveBiz(); if (!biz) return; biz._hiringRoleV1868 = null; rerender(); };
  window.bizInterviewCandidateV1868 = function (roleId, candId, type) {
    var biz = getActiveBiz(); if (!biz) return;
    var pool = biz._candidatesV1868 && biz._candidatesV1868[roleId]; if (!pool) return;
    var c = (pool.list || []).find(function (x) { return x.id === candId; }); if (!c) return;
    var fee = type === "refs" ? 2500 : 1000;
    if (c.revealed[type === "refs" ? "refs" : "skill"]) return;
    if (num(biz.cashInBusiness) < fee) { toast("Not enough cash in the business for that check."); return; }
    biz.cashInBusiness = num(biz.cashInBusiness) - fee;
    if (type === "refs") c.revealed.refs = true; else c.revealed.skill = true;
    log("🔎 " + (type === "refs" ? "Reference check" : "Interview") + " on " + c.name + " (" + moneyText(fee) + ").");
    rerender();
  };
  window.bizHireCandidateV1868 = function (roleId, candId) {
    var biz = getActiveBiz(); if (!biz) return; var role = BIZ_ROLES[roleId]; if (!role) return;
    var pool = biz._candidatesV1868 && biz._candidatesV1868[roleId]; if (!pool) return;
    var c = (pool.list || []).find(function (x) { return x.id === candId; }); if (!c) return;
    if (num(biz.cashInBusiness) < c.salaryAsk * 0.5) { toast("Not enough cash in the business to hire."); return; }
    biz.employees.push({ id: roleId + '_' + Date.now(), roleId: roleId, name: c.name, salary: c.salaryAsk, cultureFit: c.cultureFit, performance: c.performance, hiredAge: age(), yearsAtCompany: 0, leaveRisk: c.leaveRisk, isProblem: c.cultureFit < 30, traitV1868: c.traitId });
    biz.headcount = num(biz.headcount) + 1; biz.annualCosts = num(biz.annualCosts) + c.salaryAsk;
    if (biz._candidatesV1868) biz._candidatesV1868[roleId] = null; // pool consumed
    biz._hiringRoleV1868 = null;
    log("👤 Hired " + c.name + " as " + role.title + " at " + biz.name + " for " + moneyText(c.salaryAsk) + "/yr.");
    rerender();
  };
  window.bizRejectCandidateV1868 = function (roleId, candId) {
    var biz = getActiveBiz(); if (!biz) return;
    var pool = biz._candidatesV1868 && biz._candidatesV1868[roleId]; if (!pool) return;
    pool.list = (pool.list || []).filter(function (x) { return x.id !== candId; });
    if (!pool.list.length) { biz._candidatesV1868[roleId] = null; biz._hiringRoleV1868 = null; }
    rerender();
  };
  // Train an employee up to 3x/year (raises performance); retention actions drop flight risk toward ~1%.
  window.bizTrainEmployeeV1868 = function (empId) {
    var biz = getActiveBiz(); if (!biz) return;
    var e = (biz.employees || []).find(function (x) { return x.id === empId; }); if (!e) return;
    if (!e.trainV1868 || e.trainV1868.year !== age()) e.trainV1868 = { year: age(), count: 0 };
    if (e.trainV1868.count >= 3) { toast(e.name + " has already trained 3 times this year."); return; }
    var cost = Math.max(2000, Math.round(num(e.salary) * 0.08));
    if (num(biz.cashInBusiness) < cost) { toast("Not enough cash to fund training."); return; }
    biz.cashInBusiness = num(biz.cashInBusiness) - cost;
    e.trainV1868.count++;
    e.performance = clamp01(num(e.performance) + 2);
    log("📈 Trained " + e.name + " (" + e.trainV1868.count + "/3 this year) for " + moneyText(cost) + " — skill +2%.");
    rerender();
  };
  window.bizRetainEmployeeV1868 = function (empId, mode) {
    var biz = getActiveBiz(); if (!biz) return;
    var e = (biz.employees || []).find(function (x) { return x.id === empId; }); if (!e) return;
    if (!e.retainV1868 || e.retainV1868.year !== age()) e.retainV1868 = { year: age(), count: 0 };
    if (e.retainV1868.count >= 2) { toast(e.name + " has already had 2 raises/recognitions this year — they'll renew next year."); return; }
    if (mode === "raise") {
      var bump = Math.max(3000, Math.round(num(e.salary) * 0.15));
      if (num(biz.cashInBusiness) < bump) { toast("Not enough cash for a raise."); return; }
      e.salary = num(e.salary) + bump;
      biz.annualCosts = num(biz.annualCosts) + bump;
      e.leaveRisk = Math.max(0.01, num(e.leaveRisk) - 0.10);
      e.cultureFit = clamp01(num(e.cultureFit) + 5);
      log("💸 Gave " + e.name + " a " + moneyText(bump) + " raise — they're less likely to leave.");
    } else {
      var cost = Math.max(3000, Math.round(num(e.salary) * 0.05));
      if (num(biz.cashInBusiness) < cost) { toast("Not enough cash for that."); return; }
      biz.cashInBusiness = num(biz.cashInBusiness) - cost;
      e.leaveRisk = Math.max(0.01, num(e.leaveRisk) - 0.07);
      e.cultureFit = clamp01(num(e.cultureFit) + 8);
      biz.culture = clamp01(num(biz.culture) + 2);
      log("🎉 Recognized " + e.name + " — they feel valued. Flight risk drops, culture up.");
    }
    e.retainV1868.count++;
    rerender();
  };
  // Ship a feature: when live it swings market share (good vs buggy); in development it moves dev/quality.
  window.bizShipFeatureV1869 = function () {
    var biz = getActiveBiz(); if (!biz) return;
    var ft = FEATURE_TYPE_V1869[biz.type] || { noun: "feature", kind: "digital" };
    var cap = ft.noun.charAt(0).toUpperCase() + ft.noun.slice(1);
    var shipCost = Math.max(10000, Math.round(num(biz.annualRevenue) * 0.04)) || 25000;
    if (num(biz.cashInBusiness) < shipCost) { toast("Not enough company cash to ship a " + ft.noun + "."); return; }
    biz.cashInBusiness = num(biz.cashInBusiness) - shipCost;
    var liveP = biz.productStage === "live" || biz.productStage === "v2";
    if (!liveP) {
      biz.productDev = clamp01(num(biz.productDev) + 8 + Math.random() * 6);
      var qd = (Math.random() < 0.7) ? (2 + Math.random() * 4) : -(2 + Math.random() * 3);
      biz.productQuality = clamp01(num(biz.productQuality) + qd);
      log("🧪 Built a new " + ft.noun + " — dev " + Math.round(num(biz.productDev)) + "/100, quality " + (qd >= 0 ? "+" : "") + Math.round(qd) + ".");
      toast(qd >= 0 ? ("New " + ft.noun + " in the build — dev progress up.") : ("Shipped a " + ft.noun + ", but it added some bugs."));
      _pushProdLogV1869(biz, "🛠️ Built a " + ft.noun + " (in development).");
      rerender(); return;
    }
    var q = num(biz.productQuality);
    var landed = Math.random() < (0.35 + q / 200);
    if (landed) {
      var gain = (ft.kind === "product" ? 0.5 : ft.kind === "service" ? 0.3 : 0.6) + Math.random() * (ft.kind === "product" ? 2.0 : 1.4);
      biz.marketShare = Math.min(100, num(biz.marketShare) + gain);
      biz.nps = clamp01(num(biz.nps) + 2);
      if (ft.kind === "product") { biz.customers = Math.round(num(biz.customers) * (1.03 + Math.random() * 0.05)); biz.productQuality = clamp01(q + 1); }
      else if (ft.kind === "service") { biz.brand = clamp01(num(biz.brand) + 3); }
      else { biz.productQuality = clamp01(q + 1 + Math.random() * 2); biz.churnRate = Math.max(0, num(biz.churnRate) - 0.005); }
      log("🚀 New " + ft.noun + " landed at " + biz.name + "! Market share +" + gain.toFixed(1) + " pts.");
      toast(cap + " landed — market share +" + gain.toFixed(1) + " pts!");
      _pushProdLogV1869(biz, "🚀 " + cap + " landed — market share +" + gain.toFixed(1) + " pts.");
    } else {
      var loss = 0.3 + Math.random() * 1.2;
      biz.marketShare = Math.max(0, num(biz.marketShare) - loss);
      biz.productQuality = clamp01(q - (1 + Math.random() * 3));
      biz.churnRate = Math.min(1, num(biz.churnRate) + 0.01);
      if (ft.kind === "product") biz.customers = Math.round(num(biz.customers) * 0.98);
      log("🐛 The new " + ft.noun + " flopped — a rough launch cost " + loss.toFixed(1) + " pts of market share.");
      toast(cap + " flopped — market share -" + loss.toFixed(1) + " pts.");
      _pushProdLogV1869(biz, "🐛 " + cap + " flopped — market share -" + loss.toFixed(1) + " pts.");
    }
    rerender();
  };
  window.bizFixTechDebtV1869 = function () {
    var biz = getActiveBiz(); if (!biz) return;
    if (num(biz.techDebt) <= 0) { toast("Tech debt is already clean."); return; }
    var cost = Math.max(8000, Math.round(num(biz.annualRevenue) * 0.03)) || 20000;
    if (num(biz.cashInBusiness) < cost) { toast("Not enough cash for a cleanup sprint."); return; }
    biz.cashInBusiness = num(biz.cashInBusiness) - cost;
    var reduce = 12 + Math.random() * 10;
    biz.techDebt = Math.max(0, num(biz.techDebt) - reduce);
    biz.productQuality = clamp01(num(biz.productQuality) + 3 + Math.random() * 3);
    _pushProdLogV1869(biz, "🧹 Cleanup sprint — tech debt -" + Math.round(reduce) + ", quality up.");
    log("🧹 Cleanup sprint at " + biz.name + " — tech debt down, quality up.");
    toast("Tech debt reduced, quality up.");
    rerender();
  };
  window.bizPolishV1869 = function () {
    var biz = getActiveBiz(); if (!biz) return;
    var cost = Math.max(8000, Math.round(num(biz.annualRevenue) * 0.03)) || 20000;
    if (num(biz.cashInBusiness) < cost) { toast("Not enough cash to invest in polish."); return; }
    biz.cashInBusiness = num(biz.cashInBusiness) - cost;
    biz.nps = Math.min(100, num(biz.nps) + 4 + Math.random() * 4);
    biz.churnRate = Math.max(0, num(biz.churnRate) - 0.01);
    biz.productQuality = clamp01(num(biz.productQuality) + 1 + Math.random() * 2);
    _pushProdLogV1869(biz, "✨ Polish & support — NPS up, churn down.");
    log("✨ " + biz.name + " invested in polish & support — NPS up, churn down.");
    toast("NPS up, churn down.");
    rerender();
  };
  window.bizAcquireCompetitorV1869 = function (idx) {
    var biz = getActiveBiz(); if (!biz) return;
    var comps = biz.competitors || [];
    var c = comps[idx]; if (!c) return;
    var price = bizCompetitorPriceV1869(biz, c);
    if (num(biz.cashInBusiness) < price) { toast("Need " + compactMoneyV1861(price) + " in company cash to acquire " + c.name + "."); return; }
    biz.cashInBusiness = num(biz.cashInBusiness) - price;
    var shareGain = num(c.marketShare) * 0.6;
    biz.marketShare = Math.min(100, num(biz.marketShare) + shareGain);
    biz.customers = Math.round(num(biz.customers) * (1 + num(c.marketShare) / 150));
    biz.brand = clamp01(num(biz.brand) + 4);
    biz.competitivePos = Math.min(100, num(biz.competitivePos, 50) + 8);
    biz.competitors = comps.filter(function (x, i) { return i !== idx; });
    _pushProdLogV1869(biz, "🤝 Acquired rival " + c.name + " — market share +" + shareGain.toFixed(1) + " pts.");
    log("🤝 " + biz.name + " acquired competitor " + c.name + " for " + compactMoneyV1861(price) + ". Market share and customers grew.");
    toast("Acquired " + c.name + "!");
    rerender();
  };
  window.bizFireV1861 = function (empId) {
    var biz = getActiveBiz(); if (!biz) return; var idx = (biz.employees || []).findIndex(function (e) { return e.id === empId; }); if (idx < 0) return;
    var emp = biz.employees[idx]; var severance = Math.round(num(emp.salary) * 0.1);
    if (wealth() < severance) { toast("Need funds for severance."); return; }
    setMoney(wealth() - severance); biz.employees.splice(idx, 1); biz.headcount = Math.max(0, num(biz.headcount, 1) - 1); biz.annualCosts = Math.max(0, num(biz.annualCosts) - num(emp.salary)); biz.culture = clamp01(num(biz.culture) - 8);
    log("👋 Fired " + emp.name + " from " + biz.name + ". Severance " + moneyText(severance) + "."); rerender();
  };
  window.bizSetMktgBudgetV1861 = function (amount) { var biz = getActiveBiz(); if (!biz) return; biz._mktgBudget = Math.max(0, round(amount)); log("📣 " + biz.name + ": marketing budget " + moneyText(biz._mktgBudget) + "/yr."); rerender(); };
  window.bizSetDevAllocV1861 = function (features, bugfix, ux, custdev) { var biz = getActiveBiz(); if (!biz) return; var total = features + bugfix + ux + custdev; if (Math.abs(total - 100) > 2) { toast("Allocations must sum to 100."); return; } biz._devAlloc = { features: features, bugfix: bugfix, ux: ux, custdev: custdev }; log("⚙️ " + biz.name + ": dev allocation updated."); rerender(); };
  window.bizRaiseFundingV1861 = function (roundType) {
    var biz = getActiveBiz(); if (!biz) return; var B = fin().bizV1860; var round = FUNDING_ROUNDS[roundType]; if (!round) return;
    var successChance = Math.min(0.90, 0.20 + (num(B.skills.finance, 1) / 10) * 0.25 + (num(B.skills.networking, 1) / 10) * 0.20 + (num(B.founderReputation, 30) / 100) * 0.25 + (biz.annualRevenue > 0 ? 0.15 : 0));
    var amount = round.minRaise + Math.random() * (round.maxRaise - round.minRaise);
    var preMoney = biz.annualRevenue > 0 ? biz.annualRevenue * round.revMultiple : amount * 3;
    var postMoney = preMoney + amount; var newEquityTaken = Math.round((amount / postMoney) * 100);
    if (Math.random() < successChance) {
      biz.cashInBusiness = num(biz.cashInBusiness) + amount; biz.totalRaised = num(biz.totalRaised) + amount; biz.equity = Math.max(5, num(biz.equity) - newEquityTaken); biz.valuation = postMoney;
      biz.fundingRounds.push({ round: roundType, amount: amount, valuation: postMoney, dilution: newEquityTaken, age: age() });
      log("💰 " + biz.name + " raised " + moneyText(amount) + " " + round.label + ". Valuation " + moneyText(postMoney) + ". You own " + biz.equity + "%.", {});
      B.founderReputation = clamp01(num(B.founderReputation, 30) + 8);
    } else { log("❌ " + round.label + " fundraise rejected for " + biz.name + "."); bump("stress", 8); }
    rerender();
  };
  window.bizStartFranchiseV1861 = function () {
    var biz = getActiveBiz(); if (!biz) return;
    if (['food', 'health', 'retail', 'agency'].indexOf(biz.type) < 0) { toast("Franchise not available for this business type."); return; }
    if (num(biz.brand) < 70) { toast("Need Brand 70+ to franchise."); return; }
    if (biz.stage !== 'mature' && biz.stage !== 'scale') { toast("Reach Scale or Mature first."); return; }
    biz.franchiseActive = true; biz.franchiseUnits = 1; log("🏪 " + biz.name + " launches franchise model."); rerender();
  };
  window.bizExitActionV1861 = function (exitType) {
    var biz = getActiveBiz(); if (!biz) return;
    if (exitType === 'wind_down') { _bizWindDown(biz); rerender(); return; }
    if (exitType === 'ipo') { window.bizGoPublicV1861(40); return; } // IPO now means "go public", not a terminal exit
    var revMult = ({ trade_sale: 6, mbo: 3 })[exitType] || 5;
    var proceeds = Math.round(num(biz.annualRevenue) * revMult * (num(biz.equity) / 100));
    proceeds = Math.min(proceeds, ({ trade_sale: 2000000000, mbo: 500000000 })[exitType] || 2000000000);
    _bizExecuteExit(biz, exitType, proceeds); rerender();
  };

  // ---- IPO / go public: keep a stake, stay CEO, list as a tradable ticker ----
  window.bizGoPublicV1861 = function (floatPct) {
    var biz = getActiveBiz(); if (!biz) return;
    if (biz.public) { toast(biz.name + " is already public."); return; }
    if (num(biz.annualRevenue) < 10000000 || num(biz.yearsOld) < 5) { toast("IPO needs $10M+ revenue and 5+ years trading."); return; }
    floatPct = clampN(num(floatPct, 40), 5, 90);
    var m = ensureStocksV18Store();
    var ipoPrice = 20;
    biz.shares = Math.max(1000000, Math.round(num(biz.valuation) / ipoPrice));
    var founderShares = Math.round(num(biz.shares) * (num(biz.equity, 100) / 100));
    var floatShares = Math.round(founderShares * (floatPct / 100));
    var retained = Math.max(0, founderShares - floatShares);
    var gross = Math.round(floatShares * ipoPrice);
    var tax = Math.round(Math.max(0, gross - 1000000) * 0.10);
    var net = gross - tax;
    var ticker = makeTickerV1861(biz.name, m.prices);
    biz.public = true; biz.shareTicker = ticker; biz._ipoPrice = ipoPrice; biz._ipoAge = age(); biz.floatPct = floatPct; biz.stage = 'scale'; biz.acquisitionOffer = null;
    m.prices[ticker] = ipoPrice;
    m.history[ticker] = [ipoPrice];
    m.holdings = m.holdings.filter(function (h) { return h.id !== ticker; });
    if (retained > 0) m.holdings.push({ id: ticker, shares: retained, avgCost: ipoPrice, invested: Math.round(retained * ipoPrice), _entrepreneurV1861: true });
    addMoney(net);
    var B = fin().bizV1860; if (B) B.founderReputation = clampN(num(B.founderReputation, 30) + 18, 0, 100);
    log("🔔 IPO! " + biz.name + " (" + ticker + ") went public at " + priceTextV1862(ipoPrice) + "/share — floated " + Math.round(floatPct) + "%. You received " + moneyText(net) + (tax > 0 ? " (after " + moneyText(tax) + " tax)" : "") + " and kept " + Math.round(bizOwnershipPctV1861(biz)) + "% as " + ticker + " stock.", { money: net });
    try { if (typeof window.awardMilestone === "function") window.awardMilestone("founder_ipo", "IPO", "You took a company public.", 90); } catch (e) {}
    saveGame(); rerender();
  };
  window.bizGoPublicCustomV1861 = function (inputId) {
    var el = typeof document !== "undefined" ? document.getElementById(inputId) : null;
    var pct = el ? round(String(el.value || "").replace(/[^0-9.]/g, "")) : 40;
    if (el) el.value = "";
    window.bizGoPublicV1861(pct || 40);
  };
  window.bizBuyOwnStockV1861 = function (amount) {
    var biz = getActiveBiz(); if (!biz || !biz.public) { toast("No public company."); return; }
    var price = bizSharePriceV1861(biz); if (price <= 0) { toast("No share price yet."); return; }
    var amt = amount === "max" ? Math.max(0, round(wealth())) : Math.min(Math.max(0, round(wealth())), Math.max(0, round(amount)));
    if (!amt) { toast("Not enough personal cash."); return; }
    var m = ensureStocksV18Store();
    var h = bizShareHoldingV1861(biz);
    if (!h) { h = { id: biz.shareTicker, shares: 0, avgCost: price, invested: 0, _entrepreneurV1861: true }; m.holdings.push(h); }
    // You can only buy back what actually trades publicly (the float) — not phantom shares.
    var maxBuyable = Math.max(0, num(biz.shares) - num(h.shares));
    if (maxBuyable <= 0) { toast("You already hold every share."); return; }
    var shares = Math.min(amt / price, maxBuyable);
    var spent = Math.round(shares * price);
    if (spent <= 0) { toast("Not enough to buy a share."); return; }
    var oldCost = num(h.shares) * num(h.avgCost, price);
    h.shares = num(h.shares) + shares;
    h.avgCost = (oldCost + spent) / h.shares;
    h.invested = num(h.invested) + spent;
    setMoney(wealth() - spent);
    var ownNow = num(bizOwnershipPctV1861(biz));
    if (ownNow >= 10) biz.controlLost = false;
    biz.floatPct = Math.max(0, Math.round(100 - ownNow)); // public float shrinks as you buy back
    log("📈 Bought " + moneyText(spent) + " of your own stock (" + biz.shareTicker + " @ " + priceTextV1862(price) + "). You now own " + Math.round(ownNow) + "%.", { money: -spent });
    if (ownNow >= 99.5) _bizTakePrivateV1862(biz); // repurchased the whole float → delist
    saveGame(); rerender();
  };
  // Take the company private by buying out the remaining public float in one move.
  window.bizTakePrivateV1862 = function () {
    var biz = getActiveBiz(); if (!biz || !biz.public) { toast("No public company."); return; }
    var price = bizSharePriceV1861(biz); if (price <= 0) { toast("No share price yet."); return; }
    var h = bizShareHoldingV1861(biz); var yourShares = h ? num(h.shares) : 0;
    var publicShares = Math.max(0, num(biz.shares) - yourShares);
    if (publicShares <= 0) { _bizTakePrivateV1862(biz); saveGame(); rerender(); return; }
    var cost = Math.round(publicShares * price);
    if (wealth() < cost) { toast("Need " + moneyText(cost) + " to buy out the public float."); return; }
    setMoney(wealth() - cost);
    _bizTakePrivateV1862(biz);
    log("🏛️ You bought out " + compactSharesV1862(publicShares) + " public shares for " + moneyText(cost) + " and took " + biz.name + " private.", { money: -cost });
    bump("confidence", 2);
    saveGame(); rerender();
  };
  // Stock split / reverse split: changes share count and price WITHOUT changing total value,
  // your ownership %, or the public float %. factor>1 splits (cheaper shares so anyone can
  // buy in); factor<1 is a reverse split (fewer, pricier shares).
  window.bizSplitStockV1862 = function (factor) {
    var biz = getActiveBiz(); if (!biz || !biz.public) { toast("Only a public company's stock can be split."); return; }
    factor = num(factor);
    if (!(factor > 0) || factor === 1) return;
    var m = ensureStocksV18Store(); var t = biz.shareTicker;
    var price = bizSharePriceV1861(biz); if (price <= 0) { toast("No share price yet."); return; }
    var newPrice = price / factor;
    if (newPrice < 0.05) { toast("That split would push the share price below $0.05."); return; }
    if (newPrice > 5000000) { toast("That reverse split would push the share price too high."); return; }
    biz.shares = Math.max(1, Math.round(num(biz.shares) * factor));
    if (num(biz._ipoPrice)) biz._ipoPrice = num(biz._ipoPrice) / factor;
    m.prices[t] = Math.max(0.01, Math.round(newPrice * 100) / 100);
    if (Array.isArray(m.history[t])) m.history[t] = m.history[t].map(function (p) { return Math.max(0.01, Math.round((num(p) / factor) * 100) / 100); });
    var h = bizShareHoldingV1861(biz);
    if (h) { h.shares = num(h.shares) * factor; if (num(h.avgCost)) h.avgCost = num(h.avgCost) / factor; }
    var label = factor > 1 ? (Math.round(factor) + "-for-1 split — cheaper shares, anyone can buy a slice") : ("1-for-" + Math.round(1 / factor) + " reverse split — fewer, pricier shares");
    log("🪓 " + biz.name + " (" + t + ") did a " + label + ". Your " + Math.round(bizOwnershipPctV1861(biz)) + "% stake and the " + Math.round(num(biz.floatPct)) + "% float are unchanged.");
    saveGame(); rerender();
  };
  // Dividend policy for a public company (share of yearly profit returned to shareholders).
  window.bizSetDividendRateV1862 = function (rate) {
    var biz = getActiveBiz(); if (!biz || !biz.public) { toast("Only public companies pay dividends."); return; }
    biz.dividendRateV1862 = clampN(num(rate), 0, 0.10);
    log("💵 " + biz.name + " set its dividend to " + Math.round(biz.dividendRateV1862 * 100) + "% of yearly profit.");
    saveGame(); rerender();
  };
  window.bizBuyOwnStockCustomV1861 = function (inputId) {
    var el = typeof document !== "undefined" ? document.getElementById(inputId) : null;
    var amt = el ? round(String(el.value || "").replace(/[^0-9.]/g, "")) : 0; if (el) el.value = "";
    window.bizBuyOwnStockV1861(amt);
  };
  window.bizSellOwnStockV1861 = function (amount) {
    var biz = getActiveBiz(); if (!biz || !biz.public) { toast("No public company."); return; }
    var price = bizSharePriceV1861(biz); if (price <= 0) return;
    var h = bizShareHoldingV1861(biz); if (!h || h.shares <= 0) { toast("You hold no shares."); return; }
    var value = num(h.shares) * price;
    var amt = amount === "max" ? value : Math.min(value, Math.max(0, round(amount)));
    if (!amt) { toast("Enter an amount to sell."); return; }
    var shares = Math.min(num(h.shares), amt / price);
    var proceeds = Math.round(shares * price);
    h.shares = num(h.shares) - shares;
    addMoney(proceeds);
    if (h.shares < 0.000001) { var m = ensureStocksV18Store(); m.holdings = m.holdings.filter(function (x) { return x !== h; }); }
    log("📉 Sold " + moneyText(proceeds) + " of " + biz.shareTicker + " (@ " + priceTextV1862(price) + "). You now own " + Math.round(bizOwnershipPctV1861(biz)) + "%.", { money: proceeds });
    var own = bizOwnershipPctV1861(biz);
    if (own <= 0) _bizFullyExitPublic(biz);
    else if (own < 10 && !biz.controlLost) { biz.controlLost = true; log("⚠️ Your stake in " + biz.name + " fell below 10% — you've lost CEO control of the board."); }
    saveGame(); rerender();
  };
  window.bizSellOwnStockCustomV1861 = function (inputId) {
    var el = typeof document !== "undefined" ? document.getElementById(inputId) : null;
    var amt = el ? round(String(el.value || "").replace(/[^0-9.]/g, "")) : 0; if (el) el.value = "";
    window.bizSellOwnStockV1861(amt);
  };
  window.bizAcceptAcquisitionV1861 = function () { var biz = getActiveBiz(); if (!biz || !biz.acquisitionOffer) return; _bizExecuteExit(biz, 'trade_sale', num(biz.acquisitionOffer.founderProceeds)); rerender(); };
  window.bizDeclineAcquisitionV1861 = function () { var biz = getActiveBiz(); if (!biz) return; biz.acquisitionOffer = null; log("Rejected acquisition offer for " + biz.name + "."); rerender(); };
  window.bizStartSecondV1861 = function () {
    var B = fin().bizV1860; if (!B) return; var active = (B.businesses || []).filter(function (b) { return b.active; });
    if (active.length >= 3) { toast("Maximum 3 businesses at once."); return; }
    if (active.length >= 1 && smarts() < 65) { toast("Need Smarts 65+ to run multiple businesses."); return; }
    if (active.length >= 2 && (smarts() < 80 || num(B.skills.leadership, 1) < 7)) { toast("Need Smarts 80+ and Leadership 7+ for a third business."); return; }
    setWiz({ step: 1, typeId: null, model: null, name: null, coFounders: [], equityTaken: 0, startCash: 0 }); rerender();
  };
  // Self-funding: inject personal cash into the active business (equity — you own it).
  window.bizSelfFundV1861 = function (amount) {
    var biz = getActiveBiz(); if (!biz) { toast("No active business to fund."); return; }
    var amt = amount === "max" ? Math.max(0, round(wealth())) : Math.min(Math.max(0, round(wealth())), Math.max(0, round(amount)));
    if (!amt) { toast("No cash available to invest."); return; }
    setMoney(wealth() - amt); biz.cashInBusiness = num(biz.cashInBusiness) + amt; biz.injectedCapital = num(biz.injectedCapital) + amt;
    biz.runway = biz.burnRate > 0 ? Math.round(biz.cashInBusiness / biz.burnRate) : 999;
    log("💸 Injected " + moneyText(amt) + " of your own cash into " + biz.name + ".", { money: -amt }); bump("confidence", 1); saveGame(); rerender();
  };

  // Founder pay: adjust your auto-salary rate (share of revenue, 3%–10%).
  window.bizSetSalaryRateV1862 = function (rate) {
    var biz = getActiveBiz(); if (!biz) return;
    biz.founderSalaryRate = clampN(num(rate, FOUNDER_SALARY_RATE_DEFAULT), FOUNDER_SALARY_RATE_MIN, FOUNDER_SALARY_RATE_MAX);
    log("🧾 " + biz.name + ": founder salary set to " + Math.round(biz.founderSalaryRate * 100) + "% of revenue (min " + moneyText(num(biz.founderSalaryFloor, FOUNDER_SALARY_FLOOR_DEFAULT)) + ").");
    saveGame(); rerender();
  };
  window.bizSetDistRateV1869 = function (rate) {
    var biz = getActiveBiz(); if (!biz) return;
    biz.founderDistRateV1869 = clampN(num(rate), 0, 0.9);
    log("💵 " + biz.name + ": profit distribution set to " + Math.round(biz.founderDistRateV1869 * 100) + "% of profit (rest reinvested in the company).");
    saveGame(); rerender();
  };

  // Take a one-time distribution from company cash (once per year).
  window.bizTakeDistributionV1862 = function () {
    var biz = getActiveBiz(); if (!biz) { toast("No active business."); return; }
    if (!biz.active || biz.dead) { toast("This company is no longer active."); return; }
    if (age() <= num(biz._lastDistributionAge, -9999)) { toast("You already took a distribution this year."); return; }
    var cash = num(biz.cashInBusiness);
    if (cash <= 0) { toast("No company cash to distribute."); return; }
    var amt = Math.max(0, Math.round(cash * DISTRIBUTION_RATE_V1862));
    if (amt <= 0) { toast("Company cash is too low to distribute."); return; }
    biz.cashInBusiness = cash - amt;
    biz._lastDistributionAge = age();
    addMoney(amt);
    var B = initBiz();
    B.lifetimeProfit = num(B.lifetimeProfit) + amt;
    // Defer tax to the next yearly tick (folded into taxable founder income there);
    // reflect immediately in the UI's "Last founder income" until then.
    fin().pendingFounderDrawV1862 = round(num(fin().pendingFounderDrawV1862) + amt);
    fin().lastEntrepreneurIncome = round(num(fin().lastEntrepreneurIncome) + amt);
    if (num(biz.burnRate) > 0) biz.runway = Math.round(biz.cashInBusiness / num(biz.burnRate));
    log("💸 You took a " + moneyText(amt) + " distribution from " + biz.name + " (" + Math.round(DISTRIBUTION_RATE_V1862 * 100) + "% of company cash).", { money: amt });
    bump("happiness", 2);
    saveGame(); rerender();
  };

  // Hook the yearly engine into the age-up chain (run BEFORE prev so founder income is
  // taxed by the downstream v18.24 true-up). New businesses live in bizV1860.businesses,
  // separate from the legacy state.finance.businesses[], so the old core loop can't double-tick.
  var prevResolve1861 = window.resolveLifeAndFinanceYear || (typeof resolveLifeAndFinanceYear === "function" ? resolveLifeAndFinanceYear : null);
  if (prevResolve1861 && !window.__ledgerEntrepreneurResolveV1861) {
    window.__ledgerEntrepreneurResolveV1861 = true;
    window.resolveLifeAndFinanceYear = function () {
      try { runEntrepreneurYearV1861(); } catch (e) { try { console.warn("entrepreneur year failed", e); } catch (ig) {} }
      return prevResolve1861.apply(this, arguments);
    };
    try { resolveLifeAndFinanceYear = window.resolveLifeAndFinanceYear; } catch (e7) {}
  }
  window.runEntrepreneurYearV1861 = runEntrepreneurYearV1861;

  try {
    if (typeof document !== "undefined" && document.head && !document.getElementById("ledger-entrepreneur-v1861-style")) {
      var st = document.createElement("style");
      st.id = "ledger-entrepreneur-v1861-style";
      st.textContent = [
        ".biz1861-shell{display:grid;gap:12px;padding:2px 0 96px;color:#f6ead8;min-width:0}",
        ".biz1861-shell *{box-sizing:border-box}.biz1861-shell .panel{min-width:0;overflow:hidden;border:1px solid rgba(216,173,109,.22);border-radius:12px;background:linear-gradient(135deg,rgba(31,27,21,.96),rgba(18,16,13,.97));padding:14px}",
        ".biz1861-hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:start}.biz1861-hero h2,.biz1861-active h3{margin:0;color:#fff3df}.biz1861-hero p,.biz1861-active p{margin:5px 0 0;color:#b9a98e;line-height:1.4}",
        ".biz1861-hero-stat,.biz1861-active-head strong{border:1px solid rgba(255,255,255,.12);border-radius:10px;background:rgba(255,255,255,.05);padding:10px 12px;text-align:right;color:#fff3df}.biz1861-hero-stat b,.biz1861-active-head strong{display:block;font-size:20px}.biz1861-hero-stat span,.biz1861-active-head strong span{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;margin-top:3px}",
        ".biz1861-metric-grid{grid-column:1/-1;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:9px;margin-top:4px}.biz1861-metric{border:1px solid rgba(255,255,255,.10);border-radius:10px;background:rgba(255,255,255,.045);padding:10px;min-width:0}.biz1861-metric span{display:block;color:#d8b16e;font-family:'JetBrains Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:.12em}.biz1861-metric b{display:block;color:#fff3df;font-size:17px;margin-top:5px;overflow-wrap:anywhere}.biz1861-metric em{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;font-style:normal;line-height:1.4;margin-top:4px}.biz1861-metric.good b,.biz1861-metric.green b{color:#9fd07d}.biz1861-metric.bad b,.biz1861-metric.red b{color:#e9927d}.biz1861-metric.gold b{color:#d8b16e}.biz1861-metric.blue b{color:#7ea0ac}",
        ".biz1861-switch-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px}.biz1861-switch{border:1px solid rgba(255,255,255,.12);border-radius:10px;background:rgba(255,255,255,.045);color:#f6ead8;text-align:left;padding:10px;cursor:pointer}.biz1861-switch.selected{border-color:rgba(159,208,125,.55);background:rgba(159,208,125,.10)}.biz1861-switch b,.biz1861-switch span{display:block}.biz1861-switch span{color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;margin-top:4px}",
        ".biz1861-active-head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:start}.biz1861-control-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-top:12px}.biz1861-control-grid>div,.biz1861-hiring,.biz1861-exit{border:1px solid rgba(255,255,255,.10);border-radius:10px;background:rgba(255,255,255,.04);padding:11px;min-width:0}.biz1861-control-grid b{display:block;color:#fff3df}.biz1861-control-grid span{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;margin-top:3px}",
        ".biz1861-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px}.biz1861-custom{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px;margin-top:8px}.biz1861-custom input{min-width:0;border:1px solid rgba(216,173,109,.32);border-radius:8px;background:#100d0a;color:#f6ead8;padding:9px;font-family:'JetBrains Mono',monospace;font-size:11px}",
        ".biz1861-hiring,.biz1861-exit{margin-top:12px}.biz1861-staff-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px;margin-top:10px}.biz1861-staff,.biz1861-offer,.biz1861-history-row{border:1px solid rgba(255,255,255,.10);border-radius:10px;background:rgba(255,255,255,.04);padding:9px;min-width:0}.biz1861-staff b,.biz1861-history-row b,.biz1861-offer b{display:block;color:#fff3df}.biz1861-staff span,.biz1861-history-row span,.biz1861-offer span{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.35;margin-top:4px}",
        // wizard option cards
        ".biz1861-wizgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;margin-top:10px}.biz1861-wizopt{display:block;text-align:left;border:1px solid rgba(216,173,109,.22);border-radius:11px;background:rgba(255,255,255,.04);color:#f6ead8;padding:11px 12px;cursor:pointer;min-width:0;transition:border-color .12s,background .12s}.biz1861-wizopt:hover{border-color:rgba(159,208,125,.5);background:rgba(159,208,125,.08)}.biz1861-wizopt b{display:block;color:#fff3df;font-size:14px}.biz1861-wizopt span{display:block;color:#c8b89c;font-size:11px;line-height:1.4;margin-top:4px}.biz1861-wizopt em{display:block;color:#d8b16e;font-family:'JetBrains Mono',monospace;font-size:9px;font-style:normal;letter-spacing:.04em;margin-top:6px}",
        // charts
        ".biz1861-graphs{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px;margin-top:12px}.biz1861-graph{border:1px solid rgba(255,255,255,.10);border-radius:10px;background:rgba(255,255,255,.035);padding:11px;min-width:0}.biz1861-sublabel{color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;margin:6px 0 6px}",
        ".biz1861-trend-grid{display:grid;grid-template-columns:1fr;gap:8px;margin-top:6px}.biz1861-trend{border:1px solid rgba(255,255,255,.08);border-radius:8px;background:rgba(0,0,0,.18);padding:8px}.biz1861-trend-head{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}.biz1861-trend-head span{color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:.1em;flex:1;min-width:60px}.biz1861-trend-head b{color:#fff3df;font-size:15px}.biz1861-trend-head i{font-family:'JetBrains Mono',monospace;font-size:10px;font-style:normal;color:#b9a98e}.biz1861-trend-head i.good{color:#9fd07d}.biz1861-trend-head i.bad{color:#e9927d}",
        ".biz1861-spark{display:block;width:100%;height:46px;margin-top:6px}.biz1861-spark-empty{color:#8c7f6a;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.4;margin-top:6px}",
        ".biz1862-donut-wrap{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:6px}.biz1862-donut{width:120px;height:120px;flex:none}.biz1862-donut-wrap .biz1861-legend{flex:1;min-width:140px;margin-top:0;gap:7px 14px}",
        ".biz1861-segbar{display:flex;height:18px;border-radius:6px;overflow:hidden;background:rgba(0,0,0,.25);margin-top:4px}.biz1861-seg{display:block;height:100%}.biz1861-legend{display:flex;flex-wrap:wrap;gap:8px 14px;margin-top:8px}.biz1861-legend span{display:flex;align-items:center;gap:5px;color:#c8b89c;font-family:'JetBrains Mono',monospace;font-size:10px}.biz1861-legend i{width:9px;height:9px;border-radius:2px;display:inline-block;flex:none}.biz1861-legend b{color:#fff3df}.biz1861-legend em{color:#8c7f6a;font-style:normal}",
        ".biz1861-roi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:6px}.biz1861-roi{border:1px solid rgba(255,255,255,.08);border-radius:8px;background:rgba(0,0,0,.18);padding:8px;text-align:center}.biz1861-roi span{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:.06em}.biz1861-roi b{display:block;color:#fff3df;font-size:16px;margin-top:4px}.biz1861-roi em{display:block;color:#8c7f6a;font-family:'JetBrains Mono',monospace;font-size:9px;font-style:normal;margin-top:2px}.biz1861-roi.good b{color:#9fd07d}.biz1861-roi.bad b{color:#e9927d}",
        // public company desk
        ".biz1861-public{margin-top:12px;border:1px solid rgba(126,160,172,.3);border-radius:11px;background:linear-gradient(135deg,rgba(126,160,172,.08),rgba(0,0,0,.12));padding:12px}.biz1861-ctrl-ok{color:#9fd07d;font-family:'JetBrains Mono',monospace;font-size:9px;border:1px solid rgba(159,208,125,.4);border-radius:5px;padding:1px 5px;margin-left:6px}.biz1861-ctrl-lost{color:#e9927d;font-family:'JetBrains Mono',monospace;font-size:9px;border:1px solid rgba(233,146,125,.4);border-radius:5px;padding:1px 5px;margin-left:6px}.biz1861-ipo-row{border:1px solid rgba(159,208,125,.25);border-radius:10px;background:rgba(159,208,125,.05);padding:11px;margin-bottom:9px}.biz1861-ipo-row b{display:block;color:#fff3df}.biz1861-ipo-row span{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;margin-top:3px;line-height:1.4}",
        // dashboard 2.0 — tabbed founder command
        ".biz1862-command{display:block;min-width:0}.biz1862-tabs{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}.biz1862-tab{border:1px solid rgba(255,255,255,.12);border-radius:8px;background:rgba(255,255,255,.04);color:#c8b89c;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.04em;padding:7px 11px;cursor:pointer;transition:border-color .12s,background .12s,color .12s}.biz1862-tab:hover:not(:disabled){border-color:rgba(216,173,109,.45);color:#f6ead8}.biz1862-tab.selected{border-color:rgba(216,173,109,.6);background:rgba(216,173,109,.12);color:#fff3df}.biz1862-tab:disabled{opacity:.4;cursor:not-allowed}",
        ".biz1862-next{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px;margin-top:12px;border:1px solid rgba(216,173,109,.25);border-radius:10px;background:rgba(216,173,109,.06);padding:10px 12px}.biz1862-next span{color:#d8b16e;font-family:'JetBrains Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:.12em;flex:none}.biz1862-next b{color:#fff3df;font-size:13px;line-height:1.4;font-weight:500}",
        ".biz1862-panel{display:grid;gap:12px;margin-top:14px;padding-top:14px;border-top:1px solid rgba(216,173,109,.18);min-width:0}.biz1862-callout{border:1px solid rgba(126,160,172,.28);border-radius:10px;background:linear-gradient(135deg,rgba(126,160,172,.08),rgba(0,0,0,.12));padding:11px 12px}.biz1862-callout span{display:block;color:#7ea0ac;font-family:'JetBrains Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:.12em}.biz1862-callout b{display:block;color:#fff3df;font-size:14px;line-height:1.45;margin-top:5px;font-weight:500}",
        ".biz1862-split{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}.biz1862-split>div{border:1px solid rgba(255,255,255,.10);border-radius:10px;background:rgba(255,255,255,.035);padding:11px;min-width:0}.biz1862-minirow{border:1px solid rgba(255,255,255,.08);border-radius:8px;background:rgba(0,0,0,.18);padding:8px;margin-top:6px}.biz1862-minirow b{display:block;color:#fff3df;font-size:12px}.biz1862-minirow span{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.35;margin-top:3px}.biz1862-candles{display:block;width:100%;height:120px;margin-top:6px}",
        // dashboard 2.0 — team panel (recruit rail + roster)
        ".biz1862-subsection{margin-top:4px}.biz1862-recruit{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px;margin-top:8px}.biz1862-role{display:flex;flex-direction:column;gap:6px;border:1px solid rgba(255,255,255,.10);border-radius:10px;background:rgba(255,255,255,.04);padding:10px;min-width:0}.biz1862-role.off{opacity:.55}.biz1862-role-head{display:flex;align-items:center;gap:7px;min-width:0}.biz1862-role-emoji{font-size:15px;flex:none}.biz1862-role-head b{color:#fff3df;font-size:12.5px;line-height:1.25;overflow-wrap:anywhere}.biz1862-role-boost{color:#7ea0ac;font-family:'JetBrains Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:.08em}.biz1862-role-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto}.biz1862-role-foot em{color:#d8b16e;font-family:'JetBrains Mono',monospace;font-size:11px;font-style:normal}",
        ".biz1862-roster{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:8px;margin-top:8px}.biz1862-emp{display:flex;flex-direction:column;gap:8px;border:1px solid rgba(255,255,255,.10);border-radius:10px;background:rgba(255,255,255,.04);padding:11px;min-width:0}.biz1862-emp.founder{border-color:rgba(216,173,109,.35);background:rgba(216,173,109,.06)}.biz1862-emp-top{display:flex;align-items:center;gap:9px;min-width:0}.biz1862-emp-avatar{flex:none;width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:rgba(126,160,172,.16);border:1px solid rgba(126,160,172,.4);color:#cfe0e6;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700}.biz1862-emp-avatar.gold{background:rgba(216,173,109,.16);border-color:rgba(216,173,109,.45);color:#e9cf9c}.biz1862-emp-id{min-width:0;flex:1}.biz1862-emp-id b{display:block;color:#fff3df;font-family:'Fraunces',Georgia,serif;font-size:15px;line-height:1.15;overflow-wrap:anywhere}.biz1862-emp-id span{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;margin-top:3px;overflow-wrap:anywhere}.biz1862-emp .money-btn{flex:none;padding:4px 9px;font-size:10px}",
        ".biz1862-perf{height:6px;border-radius:99px;background:rgba(0,0,0,.3);overflow:hidden}.biz1862-perf-bar{height:100%;border-radius:99px;background:#7ea0ac}.biz1862-perf-bar.good{background:#9fd07d}.biz1862-perf-bar.gold{background:#d8b16e}.biz1862-perf-bar.bad{background:#e9927d}.biz1862-emp-foot{display:flex;align-items:center;justify-content:space-between;gap:8px}.biz1862-emp-foot span{color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;min-width:0;overflow-wrap:anywhere}.biz1862-emp-foot i.warn{color:#e9927d;font-style:normal}.biz1862-emp-foot em{color:#d8b16e;font-family:'JetBrains Mono',monospace;font-size:11px;font-style:normal;flex:none}",
        // dashboard 2.0 — color pass: semantic per-section accents + gradient pop
        ".biz1861-active{--acc:216,173,109}.biz1862-accent-overview{--acc:216,173,109}.biz1862-accent-product{--acc:126,160,172}.biz1862-accent-growth{--acc:159,208,125}.biz1862-accent-team{--acc:195,155,211}.biz1862-accent-funding{--acc:216,173,109}.biz1862-accent-public{--acc:120,170,185}.biz1862-accent-exit{--acc:233,146,125}",
        // semantic gradient tint on metric cards so status strips read in color, not grey
        ".biz1861-metric.good,.biz1861-metric.green{background:linear-gradient(135deg,rgba(159,208,125,.16),rgba(255,255,255,.025));border-color:rgba(159,208,125,.32)}.biz1861-metric.bad,.biz1861-metric.red{background:linear-gradient(135deg,rgba(233,146,125,.16),rgba(255,255,255,.025));border-color:rgba(233,146,125,.32)}.biz1861-metric.gold{background:linear-gradient(135deg,rgba(216,173,109,.16),rgba(255,255,255,.025));border-color:rgba(216,173,109,.32)}.biz1861-metric.blue{background:linear-gradient(135deg,rgba(126,160,172,.16),rgba(255,255,255,.025));border-color:rgba(126,160,172,.32)}",
        // section accent: panel wash, valuation badge, tabs, next-milestone, section labels
        ".biz1861-active .biz1862-panel{border-top-color:rgba(var(--acc),.45);background:linear-gradient(180deg,rgba(var(--acc),.06),rgba(0,0,0,0) 150px)}.biz1861-active-head strong{background:linear-gradient(135deg,rgba(var(--acc),.18),rgba(255,255,255,.03));border-color:rgba(var(--acc),.4)}.biz1861-active-head strong b,.biz1861-active-head strong{color:#fff3df}.biz1861-active .biz1862-tab.selected{border-color:rgba(var(--acc),.65);background:linear-gradient(135deg,rgba(var(--acc),.22),rgba(var(--acc),.05));color:#fff3df;box-shadow:0 0 0 1px rgba(var(--acc),.15)}.biz1861-active .biz1862-tab:hover:not(:disabled){border-color:rgba(var(--acc),.5)}.biz1861-active .biz1862-next{border-color:rgba(var(--acc),.38);background:linear-gradient(135deg,rgba(var(--acc),.14),rgba(0,0,0,.10))}.biz1861-active .biz1862-next span{color:rgb(var(--acc))}.biz1861-active .biz1862-subsection>.section-label,.biz1861-active .biz1862-panel>.section-label{color:rgb(var(--acc))}",
        // gradient meters + colorful accents on cards
        ".biz1862-perf-bar{background:linear-gradient(90deg,rgba(126,160,172,.55),#7ea0ac)}.biz1862-perf-bar.good{background:linear-gradient(90deg,#7cbf57,#a8db86)}.biz1862-perf-bar.gold{background:linear-gradient(90deg,#c4953f,#e2bd74)}.biz1862-perf-bar.bad{background:linear-gradient(90deg,#d46a52,#ef9a86)}.biz1862-role{background:linear-gradient(150deg,rgba(126,160,172,.07),rgba(255,255,255,.03))}.biz1862-role:hover{border-color:rgba(126,160,172,.4)}.biz1861-hero-stat{background:linear-gradient(135deg,rgba(216,173,109,.18),rgba(255,255,255,.03));border-color:rgba(216,173,109,.38)}.biz1861-hero-stat b{color:#f0d6a0}.biz1861-trend-head b{color:#fff3df}",
        // color-coded control cards (per-card gradient + tinted title) so panels read in color
        ".biz1861-control-grid b{font-size:13.5px}.biz1862-ctl{position:relative}.biz1862-ctl::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;border-radius:10px 0 0 10px}.ctl-green{background:linear-gradient(150deg,rgba(159,208,125,.13),rgba(255,255,255,.02))!important;border-color:rgba(159,208,125,.30)!important}.ctl-green::before{background:#9fd07d}.ctl-green>b{color:#bfe0a2}.ctl-gold{background:linear-gradient(150deg,rgba(216,173,109,.14),rgba(255,255,255,.02))!important;border-color:rgba(216,173,109,.32)!important}.ctl-gold::before{background:#d8b16e}.ctl-gold>b{color:#e9cf9c}.ctl-blue{background:linear-gradient(150deg,rgba(126,160,172,.14),rgba(255,255,255,.02))!important;border-color:rgba(126,160,172,.32)!important}.ctl-blue::before{background:#7ea0ac}.ctl-blue>b{color:#a8c4cd}.ctl-violet{background:linear-gradient(150deg,rgba(195,155,211,.14),rgba(255,255,255,.02))!important;border-color:rgba(195,155,211,.32)!important}.ctl-violet::before{background:#c39bd3}.ctl-violet>b{color:#d8bfe3}.biz1862-ctl>b,.biz1862-ctl>span,.biz1862-ctl>div{padding-left:8px}",
        // richer split / graph / minirow cards + colored eyebrow dots in the active panel
        ".biz1862-split>div,.biz1861-graph{background:linear-gradient(160deg,rgba(255,255,255,.055),rgba(0,0,0,.10))}.biz1862-minirow{background:linear-gradient(150deg,rgba(216,173,109,.07),rgba(0,0,0,.18))}.biz1861-active .biz1862-subsection>.section-label,.biz1861-active .biz1862-split>div>.section-label{display:flex;align-items:center;gap:6px}.biz1861-active .biz1862-subsection>.section-label::before,.biz1861-active .biz1862-split>div>.section-label::before{content:'';width:7px;height:7px;border-radius:50%;background:rgb(var(--acc));box-shadow:0 0 6px rgba(var(--acc),.6);flex:none}.biz1861-active .biz1862-split>div>.section-label{color:rgb(var(--acc))}",
        "@media(max-width:640px){.biz1861-hero,.biz1861-active-head{grid-template-columns:1fr}.biz1861-hero-stat,.biz1861-active-head strong{text-align:left}.biz1861-control-grid{grid-template-columns:1fr}.biz1861-wizgrid,.biz1861-graphs{grid-template-columns:1fr}.biz1862-split{grid-template-columns:1fr}.biz1862-recruit,.biz1862-roster{grid-template-columns:1fr}}"
      ].join("\n");
      document.head.appendChild(st);
    }
  } catch (e8) {}

  // ----------------------------------------------------------- exports -------
  // Exposed for later phases (wizard, yearly engine, render) to build on.
  window.EntrepreneurV1861 = {
    BIZ_TYPES: BIZ_TYPES,
    BIZ_MODEL_INFO: BIZ_MODEL_INFO,
    initBiz: initBiz,
    getActiveBiz: getActiveBiz,
    newBizObj: _newBizObj,
    genCompetitors: _genCompetitors,
    shim: { S: S, num: num, round: round, clampN: clampN, rnd: rnd, pick: pickOne, age: age, smarts: smarts, karma: karma, fame: fame, wealth: wealth, fin: fin, moneyText: moneyText, currencySymbol: currencySymbol }
  };

  if (window.registerLedgerSystem) {
    window.registerLedgerSystem({
      id: "entrepreneur",
      file: "pages/systems/entrepreneur.js",
      status: "active-port",
      globals: ["EntrepreneurV1861", "renderEntrepreneurHubV1861", "runEntrepreneurYearV1861", "migrateOldBusinessesV1861", "repairDuplicateBusinessesV1861", "oldBusinessCheckV1861"],
      notes: "Phases A-E complete: ported Verdant catalogs + business factory + founder state, 6-step wizard, yearly engine, modular hub render owns the Business route, and legacy retirement — old businesses migrate into bizV1860 with full legacy stage mapping, legacy yearly/income hooks are gated against migrated firms (no double-tick), and duplicate-company repair tooling is available from the Old Business Check card."
    });
  }
})();
