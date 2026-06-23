/* Real-estate investment system - v18.68.
 *
 * v18.68 moves listing details and sale pricing into pop-up menus, trims the yearly
 * market to 20 curated listings, guarantees a small rare/epic mix, and adds flip/sale
 * quote math (buy price, fair sale price, asking price, buyer odds, estimated net).
 *
 * v18.67 adds TENANT PERSONALITIES + STORY MOMENTS: each tenant has a persona (Artist,
 * Professional, Social One, Homebody, Charmer, Striver) that flavors what they say when you
 * talk/flirt/hang out, and a pool of yearly story moments (dinner invite, thoughtful gift,
 * rent grace, house party, jealous ex, weekend away, meeting their friends) that fire instead
 * of plain stat nudges. See PERSONAS / STORY_EVENTS / tenantLine / rollTenantStory.
 *
 * v18.66 adds TENANT RELATIONSHIPS: visit a tenant (popup) to build a relationship +
 * chemistry via talk/meal/gift/flirt/date; a strong relationship renews their lease (they
 * stay longer) and occasionally sends a gift / you run into them, with slow yearly decay so
 * you maintain it. Flirt + ask-out -> romantic (gated on relationship & chemistry); intimacy
 * is abstract/fade-to-black and adult-gated, matching Ledger's existing dating system.
 *
 * v18.66 also makes LIVING IN an owned property grant a real lifestyle bonus (happiness/looks
 * by class + condition, applied as a tracked delta via residenceBonusV1866 so it can't be farmed
 * and reverses on move-out/sell, refreshed yearly); while you live in an owned property the legacy
 * home stops charging upkeep (rePrimaryResidenceV1866 guard in 00-core-app-runtime.js).
 *
 * Verdant-inspired rebuild for Ledger's Property hub:
 * - credit-tier mortgage rates and down payments,
 * - yearly finite market with trend, inflation, off-market/auction urgency deals,
 * - buy cash or mortgage, then choose rent / flip / live strategy,
 * - FLIP is a real project (v18.65): active-state feedback + toast, a flip status strip
 *   (gain-since-flip / net-if-sold), and a small sale premium on a renovated flip,
 * - TENANT SCREENING (v18.65): vacant rentals surface 1-3 applicants in a scrollable popup
 *   (reOpenApplicantsV1865 -> renderApplicantsOverlay); run up to three
 *   paid checks (credit score / criminal background / income+references) to reveal each
 *   attribute, then Accept or Reject. Accepting a bad tenant (or skipping screening, since
 *   auto-placed tenants carry hidden criminal risk) can miss rent and damage the property
 *   (condition + value) in the yearly tick,
 * - tenants, vacancies, rent tuning, condition decay, renovations, sale state,
 * - property CLASS/PRESTIGE tiers (economy -> standard -> premium -> luxury -> prestige):
 *   higher classes gate by net worth (+ existing credit gate), carry a rent/appreciation
 *   premium baked into the listing at generation (so the yearly money path is never
 *   double-scaled), draw better tenants, and award portfolio "prestige" (a status score,
 *   NOT net worth - so no double counting),
 * - Finance integration via gross value, mortgage debt, equity, and yearly cash flow.
 *
 * Save compatibility: legacy state.rentals and finance.reV1862 are imported once into
 * finance.reV1863, while the old v18.62 globals remain as aliases for runtime callers.
 * Properties without a stored class derive one from value (classForValue) so old saves
 * and migrated holdings get a class label + prestige without changing their economics.
 */
(function () {
  "use strict";

  function S() { return (typeof state !== "undefined" && state) ? state : (window.state || {}); }
  function fin() { var s = S(); s.finance = s.finance || {}; return s.finance; }
  function n(v, d) { v = Number(v); return Number.isFinite(v) ? v : (d || 0); }
  function round(v) { return Math.round(n(v)); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, n(v))); }
  function age() { return Math.floor(n(S().age)); }
  function cash() { return n(S().money); }
  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }
  function js(x) { return String(x == null ? "" : x).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n"); }
  function money(v) { try { return window.money ? window.money(round(v)) : "$" + round(v).toLocaleString(); } catch (e) { return "$" + round(v); } }
  function compact(v) {
    v = round(v); var sign = v < 0 ? "-" : ""; var a = Math.abs(v);
    if (a >= 1e9) return sign + "$" + (a / 1e9).toFixed(a >= 1e10 ? 0 : 1) + "B";
    if (a >= 1e6) return sign + "$" + (a / 1e6).toFixed(a >= 1e7 ? 0 : 1) + "M";
    if (a >= 1e3) return sign + "$" + (a / 1e3).toFixed(a >= 1e4 ? 0 : 1) + "K";
    return money(v);
  }
  function pct(v) { return (n(v) * 100).toFixed(1) + "%"; }
  function toast(t) { try { if (window.addToast) window.addToast(t); } catch (e) {} }
  function logEvent(t, d) { try { if (window.addLog) window.addLog(t, d || {}); } catch (e) {} }
  function saveRender() {
    try { if (typeof save === "function") save(); } catch (e) {}
    // Re-render the open hub IN PLACE and keep scroll position, so property/screening
    // buttons don't fling the player back to the top of the page (global render() resets scroll).
    try {
      if (typeof window.renderHubInPlaceV16 === "function") {
        var cur = "home", pos = null;
        try {
          var ov = document.querySelector(".hub-overlay");
          if (ov && ov.dataset && ov.dataset.hubId) cur = ov.dataset.hubId;
          var bd = ov && ov.querySelector(".v16-hub-body,.v11-hub-body,.hub-body");
          if (bd) pos = { hubId: cur, top: bd.scrollTop, left: bd.scrollLeft };
        } catch (e0) {}
        return window.renderHubInPlaceV16(cur, pos);
      }
    } catch (e2) {}
    try { if (typeof render === "function") render(); } catch (e3) {}
  }

  function hash(str, seed) {
    var h = (seed || 2166136261) >>> 0;
    str = String(str);
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a += 0x6D2B79F5;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function pick(arr, r) { return arr[Math.max(0, Math.min(arr.length - 1, Math.floor((r || Math.random()) * arr.length)))]; }

  var CREDIT_TIERS = [
    { min: 780, max: 850, label: "Excellent", rate: 0.035, downMod: -0.02, color: "#4caf82", desc: "Prime pricing and easier approvals." },
    { min: 740, max: 779, label: "Very Good", rate: 0.040, downMod: -0.01, color: "#5b9bd5", desc: "Strong approvals with clean rates." },
    { min: 700, max: 739, label: "Good", rate: 0.046, downMod: 0.00, color: "#7bc7a0", desc: "Mainstream mortgage terms." },
    { min: 660, max: 699, label: "Fair", rate: 0.052, downMod: 0.02, color: "#e8a838", desc: "Higher down payments on pricier deals." },
    { min: 620, max: 659, label: "Thin", rate: 0.058, downMod: 0.04, color: "#e87038", desc: "Approvals are possible, but expensive." },
    { min: 580, max: 619, label: "Poor", rate: 0.066, downMod: 0.06, color: "#d55", desc: "Small deals only unless you buy cash." },
    { min: 300, max: 579, label: "Damaged", rate: 0.085, downMod: 0.10, color: "#b44", desc: "Cash or major credit repair is usually needed." }
  ];
  function score() { return clamp(n(fin().creditScore, 650), 300, 850); }
  function creditTier() {
    var s = score();
    for (var i = 0; i < CREDIT_TIERS.length; i++) if (s >= CREDIT_TIERS[i].min && s <= CREDIT_TIERS[i].max) return CREDIT_TIERS[i];
    return CREDIT_TIERS[CREDIT_TIERS.length - 1];
  }

  // --- Property class / prestige tiers (v18.64) ---------------------------------
  // Each property belongs to a class. Higher classes are gated by net worth (and the
  // existing per-listing credit requirement), carry a rent/appreciation premium baked
  // into the LISTING at generation (so the yearly money path is never double-scaled),
  // and award portfolio "prestige" - a status score, NOT net worth.
  var PROPERTY_CLASSES = [
    { id: "economy",  label: "Economy",  rank: 1, color: "#9aa6b2", reqNetWorth: 0,        rentMult: 0.96, apprecBonus: -0.004, maintMult: 1.06, prestige: 4,   tenant: -0.06, desc: "Entry units. Easy to fill, thin margins." },
    { id: "standard", label: "Standard", rank: 2, color: "#7bc7a0", reqNetWorth: 0,        rentMult: 1.00, apprecBonus: 0.000,  maintMult: 1.00, prestige: 12,  tenant: 0.00,  desc: "Mainstream market. The portfolio backbone." },
    { id: "premium",  label: "Premium",  rank: 3, color: "#5b9bd5", reqNetWorth: 400000,   rentMult: 1.07, apprecBonus: 0.005,  maintMult: 1.02, prestige: 30,  tenant: 0.08,  desc: "Sought-after addresses. Better tenants, stronger growth." },
    { id: "luxury",   label: "Luxury",   rank: 4, color: "#e8a838", reqNetWorth: 3000000,  rentMult: 1.15, apprecBonus: 0.009,  maintMult: 0.99, prestige: 72,  tenant: 0.16,  desc: "Premium finish and postcode. Renters pay for the address." },
    { id: "prestige", label: "Prestige", rank: 5, color: "#d4af37", reqNetWorth: 20000000, rentMult: 1.24, apprecBonus: 0.013,  maintMult: 0.97, prestige: 175, tenant: 0.24,  desc: "Trophy assets. Rare, coveted, generational." }
  ];
  function classDef(id) {
    for (var i = 0; i < PROPERTY_CLASSES.length; i++) if (PROPERTY_CLASSES[i].id === id) return PROPERTY_CLASSES[i];
    return PROPERTY_CLASSES[1];
  }
  function classForValue(v) {
    v = n(v);
    if (v >= 4000000) return PROPERTY_CLASSES[4];
    if (v >= 1300000) return PROPERTY_CLASSES[3];
    if (v >= 450000) return PROPERTY_CLASSES[2];
    if (v >= 160000) return PROPERTY_CLASSES[1];
    return PROPERTY_CLASSES[0];
  }
  function classOf(p) {
    if (p && p.cls) return classDef(p.cls);
    return classForValue(p ? (p.currentValue || p.buyPrice || p.basePrice) : 0);
  }
  function netWorth() {
    try { if (typeof window.legacyNetWorth === "function") return n(window.legacyNetWorth()); } catch (e) {}
    try { if (typeof legacyNetWorth === "function") return n(legacyNetWorth()); } catch (e2) {}
    var st = portfolioStats();
    return cash() + n(st.equity);
  }
  function classAccessible(cd, nw) { return n(nw) >= n(cd.reqNetWorth); }
  function prestigeRank(t) {
    t = n(t);
    if (t >= 800) return { label: "Property Dynasty", color: "#d4af37" };
    if (t >= 320) return { label: "Real-Estate Magnate", color: "#e8a838" };
    if (t >= 120) return { label: "Landed Owner", color: "#5b9bd5" };
    if (t >= 30) return { label: "Landlord", color: "#7bc7a0" };
    if (t > 0) return { label: "First Rung", color: "#9aa6b2" };
    return { label: "No Holdings", color: "var(--muted)" };
  }
  var _nw = 0; // net worth memo set at the top of each render pass

  // --- Owned-property residence lifestyle (v18.66) ----------------------------
  // Living in an owned property now grants a real lifestyle benefit (happiness/looks by
  // class + condition), applied as a tracked delta so it can't be farmed and reverses when
  // you move out or sell. While you live in an owned property the legacy home stops charging
  // upkeep (see the rePrimaryResidenceV1866 guard in 00-core-app-runtime.js).
  function residenceLifestyle(p) {
    if (!p) return { happy: 0, looks: 0, label: "" };
    var cd = classOf(p);
    var happyByClass = { economy: 3, standard: 5, premium: 8, luxury: 12, prestige: 16 };
    var looksByClass = { economy: 0, standard: 1, premium: 2, luxury: 4, prestige: 6 };
    var condFactor = clamp(0.5 + n(p.condition) / 125, 0.5, 1.1);
    return { happy: Math.round((happyByClass[cd.id] != null ? happyByClass[cd.id] : 5) * condFactor), looks: Math.round((looksByClass[cd.id] || 0) * condFactor), label: cd.label };
  }
  function applyResidenceBonus(th, tl) {
    var f = fin();
    var prev = f.residenceBonusV1866 || { happy: 0, looks: 0 };
    var dHappy = round(th) - n(prev.happy), dLooks = round(tl) - n(prev.looks);
    if (dHappy || dLooks) { try { if (typeof window.applyDeltas === "function") window.applyDeltas({ happiness: dHappy, looks: dLooks }); } catch (e) {} }
    f.residenceBonusV1866 = { happy: round(th), looks: round(tl) };
  }
  window.rePrimaryResidenceV1866 = function () {
    var re = fin().reV1863; if (!re || !re.primaryUid) return null;
    return (re.portfolio || []).find(function (p) { return p.uid === re.primaryUid; }) || null;
  };
  window.reResidenceLifestyleV1866 = function () { return residenceLifestyle(window.rePrimaryResidenceV1866()); };
  function refreshResidenceBonus() {
    var pr = window.rePrimaryResidenceV1866();
    var ls = pr ? residenceLifestyle(pr) : { happy: 0, looks: 0 };
    applyResidenceBonus(ls.happy, ls.looks);
  }

  var TRENDS = {
    crash: { label: "Crash", price: 0.78, rent: 0.94, apprec: -0.045, color: "#d55", note: "Prices are wounded. Cash buyers can hunt." },
    bear: { label: "Bear", price: 0.90, rent: 0.98, apprec: -0.012, color: "#e87038", note: "Sellers are nervous and lending is tighter." },
    stable: { label: "Stable", price: 1.00, rent: 1.00, apprec: 0.000, color: "#8fa", note: "Normal inventory and normal mistakes." },
    bull: { label: "Bull", price: 1.12, rent: 1.04, apprec: 0.018, color: "#5b9bd5", note: "Good assets move fast." },
    boom: { label: "Boom", price: 1.26, rent: 1.08, apprec: 0.034, color: "#e8a838", note: "Everything feels expensive until next year." }
  };
  var TREND_ORDER = ["crash", "bear", "stable", "bull", "boom"];

  var PROPERTY_TEMPLATES = [
    { tplId: "micro_studio", cls: "economy", name: "Micro Studio", type: "apartment", neighborhood: "City Edge", basePrice: 82000, baseRent: 850, maint: 1700, apprecMean: 0.027, reqCredit: 545, downPct: 0.08, condition: [62, 88], desc: "Tiny entry asset. Low cost, easy tenant demand." },
    { tplId: "walkup_1br", cls: "economy", name: "1-Bed Walk-up", type: "apartment", neighborhood: "Northgate", basePrice: 138000, baseRent: 1250, maint: 2500, apprecMean: 0.032, reqCredit: 580, downPct: 0.10, condition: [66, 90], desc: "Third-floor walk-up with steady starter-renter appeal." },
    { tplId: "bungalow", cls: "standard", name: "2-Bed Bungalow", type: "house", neighborhood: "Suburbs", basePrice: 210000, baseRent: 1680, maint: 3600, apprecMean: 0.036, reqCredit: 600, downPct: 0.10, condition: [68, 92], desc: "Quiet street, one-story, popular with long tenants." },
    { tplId: "duplex", cls: "standard", name: "Duplex", type: "multi", neighborhood: "Northgate", basePrice: 260000, baseRent: 2450, maint: 5200, apprecMean: 0.035, reqCredit: 615, downPct: 0.12, condition: [66, 90], units: 2, desc: "Two rent checks under one roof." },
    { tplId: "terrace", cls: "premium", name: "Victorian Terrace", type: "house", neighborhood: "Heritage", basePrice: 430000, baseRent: 3300, maint: 7800, apprecMean: 0.047, reqCredit: 650, downPct: 0.15, condition: [54, 86], desc: "Period details. Renovation upside, bigger upkeep." },
    { tplId: "hmo_4bed", cls: "standard", name: "Licensed 4-Bed HMO", type: "multi", neighborhood: "Eastside", basePrice: 390000, baseRent: 4550, maint: 9600, apprecMean: 0.034, reqCredit: 650, downPct: 0.15, condition: [58, 84], units: 4, desc: "High yield, high tenant churn." },
    { tplId: "townhouse", cls: "premium", name: "Family Townhouse", type: "house", neighborhood: "Suburbs", basePrice: 515000, baseRent: 3800, maint: 7200, apprecMean: 0.042, reqCredit: 670, downPct: 0.16, condition: [70, 94], desc: "Lower yield, stronger appreciation and stability." },
    { tplId: "fourplex", cls: "premium", name: "Fourplex", type: "multi", neighborhood: "Eastside", basePrice: 760000, baseRent: 8200, maint: 17000, apprecMean: 0.038, reqCredit: 700, downPct: 0.20, condition: [60, 88], units: 4, desc: "Classic wealth-builder with four leases." },
    { tplId: "student_block", cls: "luxury", name: "Student Block", type: "multi", neighborhood: "University", basePrice: 1350000, baseRent: 16200, maint: 35000, apprecMean: 0.039, reqCredit: 725, downPct: 0.22, condition: [56, 84], units: 12, desc: "Great rent, loud tenants, constant repairs." },
    { tplId: "retail_strip", cls: "premium", name: "Retail Strip", type: "commercial", neighborhood: "Market Road", basePrice: 920000, baseRent: 9200, maint: 16000, apprecMean: 0.031, reqCredit: 710, downPct: 0.25, condition: [64, 90], desc: "Small shops on multi-year leases." },
    { tplId: "storage", cls: "standard", name: "Self-Storage Block", type: "commercial", neighborhood: "Industrial", basePrice: 470000, baseRent: 5200, maint: 6200, apprecMean: 0.028, reqCredit: 660, downPct: 0.22, condition: [72, 96], desc: "Boring units, reliable yield, low tenant drama." },
    { tplId: "parking", cls: "luxury", name: "Multi-Storey Car Park", type: "commercial", neighborhood: "Central", basePrice: 1450000, baseRent: 16000, maint: 21000, apprecMean: 0.030, reqCredit: 735, downPct: 0.28, condition: [68, 92], desc: "Daily cash flow, city-centre land value." },
    { tplId: "office_floor", cls: "luxury", name: "Office Floor", type: "commercial", neighborhood: "Financial District", basePrice: 2350000, baseRent: 25500, maint: 32000, apprecMean: 0.030, reqCredit: 750, downPct: 0.30, condition: [70, 94], desc: "Long leases, bigger vacancy swings." },
    { tplId: "warehouse", cls: "luxury", name: "Warehouse Park", type: "commercial", neighborhood: "Industrial", basePrice: 4200000, baseRent: 43000, maint: 54000, apprecMean: 0.033, reqCredit: 765, downPct: 0.32, condition: [66, 90], desc: "Logistics tenants and industrial land." },
    { tplId: "land_small", cls: "economy", name: "Buildable Lot", type: "land", neighborhood: "Outer Ring", basePrice: 155000, baseRent: 0, maint: 1400, apprecMean: 0.041, reqCredit: 610, downPct: 0.25, condition: [100, 100], desc: "No tenants yet. Planning upside and land appreciation." },
    { tplId: "farm_land", cls: "standard", name: "Farm Acreage", type: "land", neighborhood: "Countryside", basePrice: 540000, baseRent: 2600, maint: 8800, apprecMean: 0.044, reqCredit: 665, downPct: 0.28, condition: [90, 100], desc: "Low rent, slow burn, meaningful land value." },
    { tplId: "lux_condo", cls: "luxury", name: "Luxury Condo", type: "luxury", neighborhood: "Riverside", basePrice: 1850000, baseRent: 12200, maint: 36000, apprecMean: 0.050, reqCredit: 770, downPct: 0.30, condition: [78, 98], desc: "Prestige address. Renters pay for finish and view." },
    { tplId: "mansion_let", cls: "prestige", name: "Executive Mansion Let", type: "luxury", neighborhood: "Gated Hills", basePrice: 5200000, baseRent: 33000, maint: 92000, apprecMean: 0.047, reqCredit: 800, downPct: 0.35, condition: [78, 98], desc: "Rare tenant pool, huge value swings." },
    { tplId: "tower", cls: "prestige", name: "Downtown Tower", type: "commercial", neighborhood: "Financial District", basePrice: 88000000, baseRent: 590000, maint: 950000, apprecMean: 0.038, reqCredit: 825, downPct: 0.40, condition: [74, 96], desc: "Institutional-scale trophy asset." }
  ];
  var MARKET_LISTING_LIMIT = 20;
  var RARITIES = {
    common: { label: "Open deal", short: "Open deal", color: "var(--muted)", desc: "Normal inventory." },
    rare: { label: "Rare deal", short: "Rare deal", color: "#5b9bd5", desc: "Better or scarcer than the usual board." },
    epic: { label: "Epic deal", short: "Epic deal", color: "#d4af37", desc: "One standout opportunity this year." }
  };
  function rarityDef(id) { return RARITIES[id] || RARITIES.common; }
  function tagListingRarity(l, rarity) {
    var rd = rarityDef(rarity);
    l.rarity = rarity || "common";
    l.rarityLabel = rd.label;
    l.rarityColor = rd.color;
    return l;
  }
  function dealLabel(l) {
    if (l && l.urgencyType === "foreclosure") return "Auction deal";
    if (l && l.urgencyType === "offmarket") return "Off-market deal";
    return rarityDef(l && l.rarity).label;
  }

  var RENOVATIONS = [
    { id: "cosmetic", name: "Cosmetic Refresh", cost: 0.018, rent: 0.06, value: 0.035, cond: 10, time: 0, desc: "Paint, floors, fixtures." },
    { id: "kitchen", name: "Kitchen Renovation", cost: 0.045, rent: 0.10, value: 0.075, cond: 15, time: 0, desc: "The ROI classic." },
    { id: "bathroom", name: "Bathroom Remodel", cost: 0.030, rent: 0.07, value: 0.055, cond: 12, time: 0, desc: "Premium rent signal." },
    { id: "energy", name: "Solar and Efficiency", cost: 0.055, rent: 0.04, value: 0.070, cond: 8, time: 0, desc: "Lower utility friction and better value." },
    { id: "extension", name: "Extension / Extra Unit", cost: 0.120, rent: 0.18, value: 0.160, cond: 8, time: 1, desc: "One year project, big lift." },
    { id: "full_refurb", name: "Full Refurbishment", cost: 0.180, rent: 0.28, value: 0.260, cond: 38, time: 1, desc: "Gut and rebuild for serious upside." }
  ];

  function defaultRE() {
    return {
      version: 1863,
      nextId: 1,
      migrated: { legacyRentals: false, reV1862: false },
      market: { year: null, trend: "stable", trendYears: 0, listings: [], urgencyListings: [] },
      portfolio: [],
      primaryUid: null,
      focusListingId: null,
      pendingStrategyUid: null,
      renovationUid: null,
      saleUid: null,
      lastYear: { rent: 0, maintenance: 0, mortgage: 0, cashFlow: 0, equity: 0, value: 0, debt: 0, tenantIncome: 0 }
    };
  }

  function ensureRE() {
    var f = fin();
    if (!f.reV1863 || typeof f.reV1863 !== "object") f.reV1863 = defaultRE();
    var re = f.reV1863;
    re.version = 1863;
    re.nextId = Math.max(1, round(re.nextId || 1));
    re.migrated = re.migrated || {};
    re.market = re.market || { year: null, trend: "stable", trendYears: 0, listings: [], urgencyListings: [] };
    re.portfolio = Array.isArray(re.portfolio) ? re.portfolio : [];
    re.lastYear = re.lastYear || defaultRE().lastYear;
    if (!re.migrated.legacyRentals) migrateLegacyRentals(re);
    if (!re.migrated.reV1862) migrateReV1862(re);
    re.portfolio = re.portfolio.map(normalizeProp).filter(Boolean);
    var maxId = re.portfolio.reduce(function (m, p) {
      var parts = String(p.uid || "").match(/(\d+)$/);
      return Math.max(m, parts ? Number(parts[1]) : 0);
    }, 0);
    re.nextId = Math.max(re.nextId, maxId + 1);
    if (age() >= 18 && (!re.market.listings || !re.market.listings.length || re.market.year !== age())) refreshMarket(false);
    return re;
  }
  window.reEnsureV1863 = ensureRE;

  function newUid(re) { return "re63_" + (re.nextId++); }

  function conditionBand(c) {
    c = clamp(c, 0, 100);
    if (c >= 90) return { label: "Pristine", tone: "good", rent: 1.10, vacancy: 0.02, sale: 1.04, canRent: true };
    if (c >= 72) return { label: "Good", tone: "good", rent: 1.00, vacancy: 0.06, sale: 1.00, canRent: true };
    if (c >= 55) return { label: "Tired", tone: "warn", rent: 0.90, vacancy: 0.12, sale: 0.94, canRent: true };
    if (c >= 35) return { label: "Poor", tone: "bad", rent: 0.74, vacancy: 0.28, sale: 0.82, canRent: true };
    if (c >= 15) return { label: "Dilapidated", tone: "bad", rent: 0.35, vacancy: 0.55, sale: 0.68, canRent: false };
    return { label: "Condemned", tone: "bad", rent: 0, vacancy: 1, sale: 0.48, canRent: false };
  }

  function normalizeProp(p) {
    if (!p) return null;
    var re = fin().reV1863 || { nextId: 1 };
    p.uid = p.uid || newUid(re);
    p.tplId = p.tplId || p.id || "custom";
    p.name = p.name || "Property";
    p.type = p.type || "house";
    p.neighborhood = p.neighborhood || p.hood || "Legacy";
    p.buyPrice = Math.max(0, round(p.buyPrice || p.basePrice || p.price || p.value || p.currentValue));
    p.currentValue = Math.max(0, round(p.currentValue || p.value || p.buyPrice));
    p.basePrice = Math.max(0, round(p.basePrice || p.buyPrice || p.currentValue));
    p.cls = p.cls || classForValue(p.currentValue || p.buyPrice || p.basePrice).id;
    if (p.mortgage && p.mortgage.balance != null && !p.mortgageLeft) p.mortgageLeft = round(p.mortgage.balance);
    p.mortgageLeft = Math.max(0, round(p.mortgageLeft || 0));
    if (p.mortgage && p.mortgage.rate != null && !p.mortgageRate) p.mortgageRate = n(p.mortgage.rate);
    p.mortgageRate = p.mortgageLeft > 0 ? n(p.mortgageRate, 0.055) : 0;
    p.mortgageTermYears = Math.max(1, round(p.mortgageTermYears || p._mortgageTermYears || (p.mortgage && p.mortgage.termYears) || 25));
    p.mortgageYearsPaid = Math.max(0, round(p.mortgageYearsPaid || p._yearsSincePurchase || 0));
    p.purchaseAge = p.purchaseAge == null ? age() : round(p.purchaseAge);
    p.yearsOwned = Math.max(0, round(p.yearsOwned || (age() - p.purchaseAge)));
    p.monthlyRent = Math.max(0, round(p.monthlyRent || p.baseRent || (p.rent ? n(p.rent) / 12 : 0)));
    p.askingRent = Math.max(0, round(p.askingRent || p.customRent || p.monthlyRent));
    p.yearlyMaint = Math.max(0, round(p.yearlyMaint || p.maint || p.upkeep || p.currentValue * 0.012));
    p.apprecMean = n(p.apprecMean || p.apprec, 0.034);
    p.condition = clamp(p.condition == null ? 78 : p.condition, 0, 100);
    p.strategy = p.strategy || (p.rentedOut ? "rent" : "hold");
    p.rentedOut = p.strategy === "rent" ? !!p.rentedOut : false;
    p.tenant = p.rentedOut ? (p.tenant || null) : null;
    p.renovations = Array.isArray(p.renovations) ? p.renovations : [];
    p.history = Array.isArray(p.history) ? p.history.slice(-12) : [];
    p.forSale = !!p.forSale;
    p.askingPrice = p.askingPrice ? round(p.askingPrice) : null;
    p.leaseYearsRemaining = Math.max(0, round(p.leaseYearsRemaining || 0));
    syncAliases(p);
    return p;
  }

  function syncAliases(p) {
    p.value = p.currentValue;
    p.hood = p.neighborhood;
    p.baseRent = p.monthlyRent;
    p.maint = p.yearlyMaint;
    p.apprec = p.apprecMean;
    p.mortgage = p.mortgageLeft > 0 ? { balance: p.mortgageLeft, rate: p.mortgageRate, termYears: p.mortgageTermYears } : null;
  }

  function propertyFromTemplate(re, t, opts) {
    opts = opts || {};
    var cMin = (t.condition && t.condition[0]) || 62, cMax = (t.condition && t.condition[1]) || 90;
    var condition = opts.condition != null ? opts.condition : Math.round(cMin + Math.random() * (cMax - cMin));
    return normalizeProp({
      uid: newUid(re),
      tplId: t.tplId,
      cls: opts.cls || t.cls || classForValue(opts.value || opts.price || t.basePrice || t.price).id,
      name: t.name,
      type: t.type,
      neighborhood: t.neighborhood || t.hood,
      buyPrice: opts.price || t.basePrice || t.price,
      currentValue: opts.value || opts.price || t.basePrice || t.price,
      basePrice: t.basePrice || t.price,
      mortgageLeft: opts.mortgageLeft || 0,
      mortgageRate: opts.mortgageRate || 0,
      mortgageTermYears: opts.mortgageTermYears || 25,
      monthlyRent: opts.monthlyRent || t.baseRent || Math.round((t.rent || 0) / 12),
      askingRent: opts.askingRent || opts.monthlyRent || t.baseRent || Math.round((t.rent || 0) / 12),
      yearlyMaint: opts.yearlyMaint || t.maint || t.upkeep,
      apprecMean: opts.apprecMean || t.apprecMean || t.apprec,
      condition: condition,
      units: t.units || opts.units || 1,
      purchaseAge: age(),
      purchaseStyle: opts.purchaseStyle || "cash",
      strategy: opts.strategy || "hold",
      rentedOut: !!opts.rentedOut,
      tenant: opts.tenant || null,
      renovations: []
    });
  }

  function migrateLegacyRentals(re) {
    var s = S();
    var ids = Array.isArray(s.rentals) ? s.rentals.slice() : [];
    ids.forEach(function (id) {
      var old = [];
      try { old = (typeof rentals !== "undefined" ? rentals : []); } catch (e) {}
      var r = old.find(function (x) { return x && x.id === id; });
      if (!r) return;
      re.portfolio.push(propertyFromTemplate(re, {
        tplId: "legacy_" + r.id,
        name: r.name || "Legacy Rental",
        type: "house",
        neighborhood: r.tier || "Legacy",
        basePrice: n(r.price),
        baseRent: Math.max(0, Math.round(n(r.rent) / 12)),
        maint: n(r.upkeep),
        apprecMean: 0.032,
        condition: [74, 88]
      }, { price: n(r.price), value: n(r.price), strategy: "rent", rentedOut: true, purchaseStyle: "legacy" }));
    });
    if (ids.length) s.rentals = [];
    re.migrated.legacyRentals = true;
  }

  function migrateReV1862(re) {
    var old = fin().reV1862;
    var items = old && Array.isArray(old.portfolio) ? old.portfolio : [];
    items.forEach(function (p) {
      if (!p || re.portfolio.some(function (x) { return x.uid === p.uid || (x.name === p.name && x.buyPrice === (p.buyPrice || p.basePrice)); })) return;
      re.portfolio.push(normalizeProp({
        uid: p.uid || newUid(re),
        tplId: p.tplId || "v1862",
        name: p.name || "Imported Property",
        type: p.type || "house",
        neighborhood: p.neighborhood || p.hood || "Imported",
        buyPrice: p.buyPrice || p.basePrice || p.price || p.value,
        currentValue: p.currentValue || p.value || p.buyPrice || p.basePrice,
        basePrice: p.basePrice || p.buyPrice || p.value,
        mortgageLeft: p.mortgageLeft || (p.mortgage && p.mortgage.balance) || 0,
        mortgageRate: p.mortgageRate || (p.mortgage && p.mortgage.rate) || 0,
        mortgageTermYears: p.mortgageTermYears || (p.mortgage && p.mortgage.termYears) || 25,
        mortgageYearsPaid: p.mortgageYearsPaid || p._yearsSincePurchase || 0,
        monthlyRent: p.monthlyRent || p.baseRent || Math.round(n(p.rent) / 12),
        askingRent: p.askingRent || p.customRent || p.monthlyRent || p.baseRent,
        yearlyMaint: p.yearlyMaint || p.maint || p.upkeep,
        apprecMean: p.apprecMean || p.apprec,
        condition: p.condition == null ? 78 : p.condition,
        purchaseAge: p.purchaseAge == null ? age() : p.purchaseAge,
        purchaseStyle: p.purchaseStyle || (p.mortgage ? "mortgage" : "cash"),
        strategy: p.strategy || (p.rentedOut ? "rent" : "hold"),
        rentedOut: !!p.rentedOut,
        tenant: p.tenant || null,
        renovations: p.renovations || p.improvementsV || []
      }));
    });
    re.migrated.reV1862 = true;
  }

  function chooseTrend(prev, seed) {
    var r = rng(seed || age() * 9973)();
    var idx = Math.max(0, TREND_ORDER.indexOf(prev || "stable"));
    if (r < 0.10) idx -= 2;
    else if (r < 0.28) idx -= 1;
    else if (r > 0.90) idx += 2;
    else if (r > 0.70) idx += 1;
    return TREND_ORDER[clamp(idx, 0, TREND_ORDER.length - 1)];
  }

  function listingFromTemplate(t, seed, idx, trend, inflation, urgency) {
    var r = rng(seed + idx * 101 + hash(t.tplId));
    var trendDef = TRENDS[trend] || TRENDS.stable;
    var spread = 0.86 + r() * 0.32;
    var conditionRoll = Math.round((t.condition ? t.condition[0] : 62) + r() * ((t.condition ? t.condition[1] : 90) - (t.condition ? t.condition[0] : 62)));
    var marketPrice = Math.round(t.basePrice * inflation * trendDef.price * spread / 1000) * 1000;
    var discount = urgency === "foreclosure" ? (0.30 + r() * 0.13) : urgency === "offmarket" ? (0.12 + r() * 0.12) : 0;
    var price = Math.round(marketPrice * (1 - discount) / 1000) * 1000;
    var cd = classDef(t.cls) || classForValue(t.basePrice);
    var monthlyRent = Math.max(0, Math.round(t.baseRent * Math.pow(inflation, 0.55) * trendDef.rent * (0.92 + r() * 0.18) * cd.rentMult));
    return tagListingRarity({
      lid: (urgency ? urgency + "_" : "mkt_") + seed + "_" + idx + "_" + t.tplId,
      tplId: t.tplId,
      name: t.name + (urgency === "foreclosure" ? " Auction" : ""),
      type: t.type,
      neighborhood: t.neighborhood,
      listPrice: Math.max(1000, price),
      marketPrice: Math.max(1000, marketPrice),
      monthlyRent: monthlyRent,
      yearlyMaint: Math.max(500, Math.round(t.maint * Math.pow(inflation, 0.40) * (0.92 + r() * 0.25) * cd.maintMult)),
      apprecMean: n(t.apprecMean) + cd.apprecBonus,
      cls: cd.id,
      className: cd.label,
      classColor: cd.color,
      classPrestige: cd.prestige,
      reqNetWorth: urgency === "foreclosure" ? 0 : cd.reqNetWorth,
      reqCredit: urgency === "foreclosure" ? 0 : t.reqCredit,
      downPct: urgency === "foreclosure" ? 1.0 : clamp(t.downPct + creditTier().downMod, 0.06, 0.45),
      condition: urgency === "foreclosure" ? Math.round(34 + r() * 22) : conditionRoll,
      units: t.units || 1,
      desc: t.desc,
      urgencyType: urgency || null,
      expiresAge: age(),
      discountPct: Math.round(discount * 100),
      savedAmount: Math.max(0, marketPrice - price),
      cashOnly: urgency === "foreclosure",
      hot: !urgency && trend === "boom" && r() > 0.72,
      distressed: !urgency && trend !== "boom" && r() > 0.82
    }, urgency ? "rare" : "common");
  }

  function curatedMarketListings(seed, trend, inflation, rand) {
    var listings = [];
    var usedRare = {};
    function add(t, idx, rarity) {
      if (!t) return;
      var l = listingFromTemplate(t, seed, idx, trend, inflation, null);
      tagListingRarity(l, rarity);
      if (rarity === "rare") {
        l.hot = true;
        l.desc = l.desc + " Scarcer than normal this year.";
      } else if (rarity === "epic") {
        l.hot = true;
        l.desc = l.desc + " Signature opportunity for this market cycle.";
      }
      listings.push(l);
    }
    var epicPool = PROPERTY_TEMPLATES.filter(function (t) { return t.cls === "prestige" || t.cls === "luxury"; });
    add(pick(epicPool, rand()), 7001, "epic");
    var rarePool = PROPERTY_TEMPLATES.filter(function (t) { return t.cls === "premium" || t.cls === "luxury"; });
    for (var i = 0; i < 3; i++) {
      var tries = 0, t = null;
      do { t = pick(rarePool, rand()); tries++; } while (t && usedRare[t.tplId] && tries < 8);
      if (t) usedRare[t.tplId] = true;
      add(t, 7100 + i, "rare");
    }
    var pool = PROPERTY_TEMPLATES.slice().sort(function (a1, b1) { return hash(a1.tplId, seed) - hash(b1.tplId, seed); });
    var cursor = 0, roundNo = 0;
    while (listings.length < MARKET_LISTING_LIMIT && pool.length) {
      var base = pool[cursor % pool.length];
      add(base, 100 + listings.length * 7 + roundNo * 503, "common");
      cursor++;
      if (cursor % pool.length === 0) roundNo++;
    }
    return listings.sort(function (a1, b1) {
      if (a1.rarity === "epic" && b1.rarity !== "epic") return -1;
      if (b1.rarity === "epic" && a1.rarity !== "epic") return 1;
      if (a1.rarity === "rare" && b1.rarity === "common") return -1;
      if (b1.rarity === "rare" && a1.rarity === "common") return 1;
      return a1.listPrice - b1.listPrice;
    }).slice(0, MARKET_LISTING_LIMIT);
  }

  function refreshMarket(force) {
    var re = fin().reV1863 || ensureRE();
    var a = age();
    if (!force && re.market && re.market.year === a && Array.isArray(re.market.listings)) return re.market;
    if (a < 18) {
      re.market = { year: a, trend: "stable", trendYears: 0, listings: [], urgencyListings: [] };
      return re.market;
    }
    var seed = hash("re1863:" + a + ":" + n(S().legacy && S().legacy.generation, 1));
    var trend = chooseTrend(re.market && re.market.trend, seed);
    var trendYears = (re.market && re.market.trend === trend) ? n(re.market.trendYears) + 1 : 1;
    var inflation = Math.pow(1.027, Math.max(0, a - 18));
    var r = rng(seed);
    var listings = curatedMarketListings(seed, trend, inflation, r);
    var rentable = PROPERTY_TEMPLATES.filter(function (t) { return t.baseRent > 0 && t.type !== "land" && t.basePrice < 900000; });
    var urgencyListings = [];
    var off = pick(rentable, r());
    urgencyListings.push(listingFromTemplate(off, seed, 801, trend, inflation, "offmarket"));
    if (trend === "bear" || trend === "crash" || r() > 0.56) {
      var fore = pick(rentable.filter(function (t) { return t.basePrice < 600000; }), r());
      urgencyListings.push(listingFromTemplate(fore, seed, 901, trend, inflation, "foreclosure"));
    }
    re.market = { year: a, trend: trend, trendYears: trendYears, inflation: inflation, listings: listings, urgencyListings: urgencyListings };
    return re.market;
  }

  function allListings() {
    var m = ensureRE().market;
    return (m.urgencyListings || []).concat(m.listings || []);
  }
  function findListing(lid) { return allListings().find(function (l) { return String(l.lid) === String(lid); }) || null; }
  window.reMarketV1863 = function () { return ensureRE().market.listings || []; };
  window.reUrgencyMarketV1863 = function () { return ensureRE().market.urgencyListings || []; };

  function annualMortgagePayment(p) {
    var bal = n(p.mortgageLeft);
    if (bal <= 0) return 0;
    var remaining = Math.max(1, n(p.mortgageTermYears, 25) - n(p.mortgageYearsPaid));
    var rate = n(p.mortgageRate);
    if (rate <= 0) return Math.min(bal, round(bal / remaining));
    return Math.min(round(bal * rate / (1 - Math.pow(1 + rate, -remaining))), round(bal + bal * rate));
  }
  function processMortgage(p) {
    var bal = n(p.mortgageLeft);
    if (bal <= 0) return { paid: 0, principal: 0, interest: 0 };
    var interest = round(bal * n(p.mortgageRate));
    var paid = annualMortgagePayment(p);
    var principal = clamp(paid - interest, 0, bal);
    p.mortgageLeft = Math.max(0, round(bal - principal));
    p.mortgageYearsPaid = n(p.mortgageYearsPaid) + 1;
    if (p.mortgageLeft <= 0) p.mortgageRate = 0;
    syncAliases(p);
    return { paid: paid, principal: principal, interest: Math.max(0, paid - principal) };
  }

  function makeTenant(p) {
    var first = ["Maya", "Theo", "Nora", "Jay", "Sam", "Iris", "Miles", "Avery", "Noel", "Priya", "Elena", "Rowan"];
    var last = ["Chen", "Morgan", "Patel", "Rivera", "Brooks", "Cole", "Shaw", "Bennett", "Hayes", "Reed"];
    var cd = classOf(p);
    var crimRoll = Math.random() - cd.tenant; // better classes skew away from trouble
    var criminal = crimRoll > 0.92 ? "serious" : crimRoll > 0.75 ? "minor" : "none";
    var personaId = randomPersonaId();
    var pbias = PERSONA_BIAS[personaId] || { reliability: 0 };
    return {
      name: pick(first, Math.random()) + " " + pick(last, Math.random()),
      reliability: clamp(Math.round(62 + Math.random() * 34 + cd.tenant * 60 + (pbias.reliability || 0)), 30, 100),
      happiness: clamp(Math.round(50 + Math.random() * 42 + cd.tenant * 50), 0, 100),
      leaseYearsLeft: Math.max(1, Math.round(1 + Math.random() * 2 + (cd.rank >= 4 ? 1 : 0))),
      criminalV1865: criminal,
      screenedV1865: false,
      genderV1866: Math.random() < 0.5 ? "male" : "female",
      personaV1867: personaId
    };
  }

  // --- Tenant screening / background checks (v18.65) ---------------------------
  // When a rental is vacant you get applicants. Run up to three checks (each costs a
  // fee and reveals one attribute), then Accept or Reject. Good tenants pay reliably;
  // bad ones you take on can miss rent and damage the property (condition + value).
  var SCREEN_CHECKS = [
    { id: "credit", label: "Credit Check", fee: 150, reveals: "credit", desc: "Pull their credit score and payment history." },
    { id: "background", label: "Background Check", fee: 280, reveals: "background", desc: "Criminal record and prior-eviction search." },
    { id: "income", label: "Income & References", fee: 200, reveals: "income", desc: "Verify employment, income, and references." }
  ];
  var CRIMINAL = {
    none: { label: "Clean record", risk: 0, color: "var(--good)" },
    minor: { label: "Minor offenses", risk: 1, color: "var(--accent)" },
    serious: { label: "Serious record", risk: 2, color: "var(--bad)" }
  };
  var INCOME_BANDS = {
    high: { label: "Stable, high income", color: "var(--good)" },
    medium: { label: "Steady income", color: "var(--accent)" },
    low: { label: "Irregular income", color: "var(--bad)" }
  };
  function applicantSeed(p) { return hash("appl:" + p.uid + ":" + age() + ":" + n(S().legacy && S().legacy.generation, 1)); }
  function makeApplicant(p, idx, r) {
    var first = ["Maya", "Theo", "Nora", "Jay", "Sam", "Iris", "Miles", "Avery", "Noel", "Priya", "Elena", "Rowan", "Dane", "Cleo", "Otis", "Wren"];
    var last = ["Chen", "Morgan", "Patel", "Rivera", "Brooks", "Cole", "Shaw", "Bennett", "Hayes", "Reed", "Frost", "Vance", "Ortiz", "Knox"];
    var credit = Math.round(clamp(520 + r() * 320, 300, 850));
    var crimRoll = r();
    var criminal = crimRoll > 0.90 ? "serious" : crimRoll > 0.72 ? "minor" : "none";
    var incomeRoll = r();
    var income = incomeRoll > 0.62 ? "high" : incomeRoll > 0.28 ? "medium" : "low";
    var quality = clamp((credit - 300) / 550 * 0.5 + (income === "high" ? 0.3 : income === "medium" ? 0.18 : 0.04) + (criminal === "none" ? 0.2 : criminal === "minor" ? 0.08 : -0.05), 0, 1);
    return {
      id: "ap_" + p.uid + "_" + age() + "_" + idx,
      name: pick(first, r()) + " " + pick(last, r()),
      credit: credit,
      criminal: criminal,
      income: income,
      quality: quality,
      revealed: { credit: false, background: false, income: false },
      blurb: criminal === "serious" ? "Charming, but something feels off." : (income === "high" && criminal === "none") ? "Polished and professional." : "Seems ordinary enough."
    };
  }
  function ensureApplicants(p, force) {
    if (!p || p.strategy !== "rent" || p.tenant) { if (p) p.applicantsV1865 = null; return null; }
    if (!conditionBand(p.condition).canRent) { p.applicantsV1865 = null; return null; }
    var a = p.applicantsV1865;
    if (!force && a && a.year === age() && Array.isArray(a.list) && a.list.length) return a;
    var r = rng(applicantSeed(p));
    var count = 1 + Math.floor(r() * 3); // 1..3 applicants
    var list = [];
    for (var i = 0; i < count; i++) list.push(makeApplicant(p, i, r));
    p.applicantsV1865 = { year: age(), list: list };
    return p.applicantsV1865;
  }
  function findApplicant(p, appId) {
    var a = p && p.applicantsV1865;
    return (a && Array.isArray(a.list)) ? a.list.find(function (x) { return x.id === appId; }) : null;
  }
  window.reScreenApplicantV1865 = function (uid, appId, type) {
    var p = byUid(uid); if (!p) return toast("Property not found.");
    var ap = findApplicant(p, appId); if (!ap) return toast("Applicant no longer available.");
    var chk = SCREEN_CHECKS.find(function (c) { return c.id === type; }); if (!chk) return;
    if (ap.revealed[chk.reveals]) return toast("Already ran that check.");
    if (cash() < chk.fee) return toast(chk.label + " costs " + compact(chk.fee) + ".");
    S().money = round(cash() - chk.fee);
    ap.revealed[chk.reveals] = true;
    logEvent(chk.label + " on " + ap.name + " for " + p.name + " (" + compact(chk.fee) + ").", { money: -chk.fee });
    saveRender();
  };
  window.reAcceptApplicantV1865 = function (uid, appId) {
    var p = byUid(uid); if (!p) return toast("Property not found.");
    var ap = findApplicant(p, appId); if (!ap) return toast("Applicant no longer available.");
    var personaId = randomPersonaId();
    var pbias = PERSONA_BIAS[personaId] || { reliability: 0 };
    var reliability = clamp(Math.round(40 + ap.quality * 55 + (ap.credit - 575) / 12 + (pbias.reliability || 0)), 25, 100);
    p.tenant = {
      name: ap.name,
      reliability: reliability,
      happiness: Math.round(55 + ap.quality * 35),
      leaseYearsLeft: Math.max(1, Math.round(1 + ap.quality * 2)),
      criminalV1865: ap.criminal,
      qualityV1865: ap.quality,
      screenedV1865: !!(ap.revealed.credit || ap.revealed.background || ap.revealed.income),
      genderV1866: (hash(ap.name) % 2) ? "male" : "female",
      personaV1867: personaId
    };
    p.applicantsV1865 = null;
    ensureRE().applicantsUid = null; // close the screening popup once leased
    p.rentedOut = true;
    syncAliases(p);
    recordFinance(portfolioStats());
    toast("Leased " + p.name + " to " + ap.name + ".");
    logEvent("Leased " + p.name + " to " + ap.name + ".", {});
    saveRender();
  };
  window.reRejectApplicantV1865 = function (uid, appId) {
    var p = byUid(uid); if (!p) return;
    var a = p.applicantsV1865;
    if (a && Array.isArray(a.list)) a.list = a.list.filter(function (x) { return x.id !== appId; });
    if (a && (!a.list || !a.list.length)) { p.applicantsV1865 = null; ensureRE().applicantsUid = null; } // none left -> close popup, refresh next year
    saveRender();
  };
  window.reApplicantsV1865 = function (uid) { var p = byUid(uid); return p ? ensureApplicants(p) : null; };

  // --- Tenant relationships (v18.66) ------------------------------------------
  // Talk to / hang out with a tenant to build a relationship (keeps them longer, fewer
  // problems, the odd gift). Flirting builds chemistry; once relationship + chemistry are
  // high you can ask them out and become romantically involved (abstract / fade-to-black,
  // consistent with Ledger's existing dating system). Adults only.
  function applyPlayerHappy(h) { try { if (h && typeof window.applyDeltas === "function") window.applyDeltas({ happiness: h }); } catch (e) {} }
  function ensureTenantRel(t) {
    if (!t) return t;
    if (t.relV1866 == null) t.relV1866 = 18;
    if (t.chemV1866 == null) t.chemV1866 = 0;
    if (typeof t.romanticV1866 !== "boolean") t.romanticV1866 = false;
    if (t.genderV1866 !== "male" && t.genderV1866 !== "female") t.genderV1866 = Math.random() < 0.5 ? "male" : "female";
    if (!t.personaV1867) t.personaV1867 = randomPersonaId();
    if (!t.actsV1866 || t.actsV1866.year !== age()) t.actsV1866 = { year: age() };
    return t;
  }
  var TENANT_ACTS = [
    { id: "talk",  label: "Talk",            cost: 0,   limit: 6, rel: 3, chem: 0,  happy: 2, desc: "A normal check-in." },
    { id: "meal",  label: "Share a Meal",    cost: 60,  limit: 3, rel: 6, chem: 1,  happy: 3, desc: "Break bread together." },
    { id: "gift",  label: "Give a Gift",     cost: 200, limit: 3, rel: 9, chem: 1,  happy: 2, desc: "Thoughtful and appreciated." },
    { id: "flirt", label: "Flirt",           cost: 0,   limit: 4, rel: 1, chem: 7,  happy: 1, desc: "Test the waters." },
    { id: "date",  label: "Go on a Date",    cost: 150, limit: 3, rel: 7, chem: 8,  happy: 5, desc: "A real date.", needRomantic: true },
    { id: "night", label: "Spend the Night", cost: 0,   limit: 2, rel: 5, chem: 10, happy: 8, desc: "Stay close.", needRomantic: true, needRel: 60, needChem: 55, intimate: true }
  ];
  window.reTenantActV1866 = function (uid, actId) {
    var p = byUid(uid); if (!p || !p.tenant) return toast("No tenant to visit.");
    if (age() < 18) return toast("Not available.");
    var t = ensureTenantRel(p.tenant);
    var act = TENANT_ACTS.find(function (a) { return a.id === actId; }); if (!act) return;
    if (act.needRomantic && !t.romanticV1866) return toast("You're not seeing " + t.name + ".");
    if (act.needRel && t.relV1866 < act.needRel) return toast("Grow closer first.");
    if (act.needChem && t.chemV1866 < act.needChem) return toast("There isn't enough spark yet.");
    var used = n(t.actsV1866[actId]);
    if (used >= act.limit) return toast("Not again this year.");
    if (cash() < act.cost) return toast(act.label + " costs " + compact(act.cost) + ".");
    if (act.cost) S().money = round(cash() - act.cost);
    t.actsV1866[actId] = used + 1;
    t.relV1866 = clamp(t.relV1866 + act.rel, 0, 100);
    t.chemV1866 = clamp(t.chemV1866 + act.chem * personaBias(t).chem, 0, 100);
    t.happiness = clamp(n(t.happiness, 70) + Math.round(act.rel / 2), 0, 100);
    applyPlayerHappy(act.happy);
    var cat = actId === "talk" ? "talk" : actId === "flirt" ? "flirt" : actId === "night" ? "intimate" : "warm";
    var line = tenantLine(t, cat);
    toast(line);
    logEvent(line + " (" + p.name + ")", act.cost ? { money: -act.cost } : {});
    saveRender();
  };
  window.reEvictTenantV1866 = function (uid) {
    var p = byUid(uid); if (!p || !p.tenant) return toast("No tenant to evict.");
    var name = p.tenant.name;
    var wasRomantic = !!p.tenant.romanticV1866;
    p.tenant = null;
    p.applicantsV1865 = null; // fresh applicants next year
    ensureRE().tenantUid = null; // close the popup
    applyPlayerHappy(wasRomantic ? -4 : -1); // evictions are awkward
    logEvent("Evicted " + name + " from " + p.name + ".", {});
    toast("Evicted " + name + ".");
    saveRender();
  };
  window.reTenantRomanceV1866 = function (uid) {
    var p = byUid(uid); if (!p || !p.tenant) return toast("No tenant.");
    if (age() < 18) return toast("Not available.");
    var t = ensureTenantRel(p.tenant);
    if (t.romanticV1866) return toast("You're already together.");
    if (t.relV1866 < 45 || t.chemV1866 < 40) return toast(t.name + " isn't ready for that yet - keep building it.");
    var odds = clamp((t.relV1866 + t.chemV1866) / 220, 0.2, 0.95);
    if (Math.random() < odds) {
      t.romanticV1866 = true;
      t.relV1866 = clamp(t.relV1866 + 6, 0, 100);
      applyPlayerHappy(6);
      toast(t.name + " said yes - you're seeing each other now.");
      logEvent("You and " + t.name + " (your tenant at " + p.name + ") are now together.", {});
    } else {
      t.relV1866 = clamp(t.relV1866 - 5, 0, 100);
      toast(t.name + " turned you down. Give it time.");
    }
    saveRender();
  };

  // --- Tenant personalities + flavor + story moments (v18.67) ------------------
  // Each tenant has a persona that flavors what they say when you interact, and a pool of
  // story moments that fire occasionally instead of plain stat nudges. {name} -> tenant name.
  var PERSONAS = [
    { id: "artist", label: "The Artist", desc: "Creative and warm, a little flaky.", lines: {
      talk: ["{name} shows you sketches for a mural they want to paint in the stairwell.", "{name} is paint-flecked and mid-project, but happy to chat.", "{name} plays you a rough demo they recorded last night."],
      flirt: ["{name} says you have 'an interesting face to draw,' and holds your gaze.", "{name} tucks a pencil behind their ear and grins at you."],
      warm: ["{name} cooks something ambitious and only slightly burnt.", "{name} hands you a tiny painting as a thank-you."],
      intimate: ["The evening is all candlelight and half-finished canvases."] } },
    { id: "professional", label: "The Professional", desc: "Reliable, precise, a touch reserved.", lines: {
      talk: ["{name} gives you a crisp update: rent's early, no issues.", "{name} chats briefly between calls, polite and exact."],
      flirt: ["{name} loosens their tie and admits the small talk is their favorite part of the day.", "{name} laughs, surprised you noticed them noticing you."],
      warm: ["{name} books somewhere quiet and very nice, and insists on splitting it.", "{name} sends a thoughtful gift with a neatly typed note."],
      intimate: ["For once, {name} leaves the phone in the other room."] } },
    { id: "partier", label: "The Social One", desc: "Fun and loud; harder on the place.", lines: {
      talk: ["{name} recaps the weekend in vivid, exhausting detail.", "{name} invites you to 'a little thing' Friday - it will not be little."],
      flirt: ["{name} pulls you into a dance in the kitchen.", "{name} grins and says trouble looks good on you."],
      warm: ["{name} throws together a loud, fun dinner with too many people.", "{name} hands you a wrapped gift and a questionable cocktail."],
      intimate: ["The music's still going somewhere down the hall."] } },
    { id: "homebody", label: "The Homebody", desc: "Quiet, loyal, stays for years.", lines: {
      talk: ["{name} offers you tea and the good armchair.", "{name} updates you on the herb garden on the balcony."],
      flirt: ["{name} blushes and pretends to fuss with a blanket.", "{name} admits they'd been hoping you'd stop by."],
      warm: ["{name} makes a slow, comforting home-cooked meal.", "{name} knits you something soft and a little lopsided."],
      intimate: ["You both fall asleep to the rain on the windows."] } },
    { id: "charmer", label: "The Charmer", desc: "Effortless, flirtatious, hard to read.", lines: {
      talk: ["{name} makes you feel like the most interesting person in the building.", "{name} remembers a detail you'd forgotten you mentioned."],
      flirt: ["{name} holds your gaze a beat too long and lets it linger.", "{name} leans in and lowers their voice just for you."],
      warm: ["{name} plans a flawless evening that somehow feels effortless.", "{name} gives you something small that's clearly been chosen with care."],
      intimate: ["{name} makes the rest of the world go quiet."] } },
    { id: "striver", label: "The Striver", desc: "Ambitious and busy; always a new hustle.", lines: {
      talk: ["{name} talks shop - a new side hustle, always a new side hustle.", "{name} squeezes you in between two meetings, but means it."],
      flirt: ["{name} says you're the best part of an overbooked week.", "{name} cancels a call to keep talking to you."],
      warm: ["{name} takes you somewhere new they've been meaning to try.", "{name} gives you something useful and quietly generous."],
      intimate: ["{name} finally, actually closes the laptop."] } }
  ];
  function personaOf(t) {
    if (t && t.personaV1867) { for (var i = 0; i < PERSONAS.length; i++) if (PERSONAS[i].id === t.personaV1867) return PERSONAS[i]; }
    return PERSONAS[0];
  }
  function randomPersonaId() { return PERSONAS[Math.floor(Math.random() * PERSONAS.length)].id; }
  // Persona behavioral biases: reliability (pay), wear (property damage x), retention (lease-renew
  // odds +), chem (chemistry gain x). Personas now play differently, not just talk differently.
  var PERSONA_BIAS = {
    artist:       { reliability: -8, wear: 1.10, retention: 0.05, chem: 1.25 },
    professional: { reliability: 12, wear: 0.60, retention: 0.05, chem: 0.85 },
    partier:      { reliability: 2,  wear: 1.60, retention: -0.10, chem: 1.10 },
    homebody:     { reliability: 6,  wear: 0.60, retention: 0.25, chem: 1.00 },
    charmer:      { reliability: 0,  wear: 1.00, retention: 0.00, chem: 1.50 },
    striver:      { reliability: 10, wear: 0.70, retention: -0.12, chem: 0.80 }
  };
  function personaBias(t) { return PERSONA_BIAS[personaOf(t).id] || { reliability: 0, wear: 1, retention: 0, chem: 1 }; }
  var PERSONA_ICON = { artist: "🎨", professional: "💼", partier: "🎉", homebody: "🏡", charmer: "😏", striver: "📈" };
  function personaIcon(t) { return PERSONA_ICON[personaOf(t).id] || "🙂"; }
  function tenantGender(t) {
    t = ensureTenantRel(t);
    return t && t.genderV1866 === "male"
      ? { icon: "👨", label: "Male", pronouns: "he/him" }
      : { icon: "👩", label: "Female", pronouns: "she/her" };
  }
  function tenantBadge(t) {
    t = ensureTenantRel(t);
    var g = tenantGender(t);
    var pr = personaOf(t);
    return g.icon + " " + g.label + " · " + personaIcon(t) + " " + pr.label;
  }
  window.reTenantBadgeV1868 = function (uid) {
    var p = byUid(uid);
    return p && p.tenant ? tenantBadge(p.tenant) : "";
  };
  function tenantLine(t, category) {
    var pr = personaOf(t);
    var pool = (pr.lines && pr.lines[category]) || (pr.lines && pr.lines.talk) || ["{name} appreciates the visit."];
    var line = pool[Math.floor(Math.random() * pool.length)] || pool[0];
    return line.replace(/\{name\}/g, t.name);
  }
  var STORY_EVENTS = [
    { id: "dinner_invite", gate: function (t) { return t.relV1866 >= 35; }, text: function (t) { return t.name + " invites you up for dinner and you lose track of the evening."; }, apply: function (t) { t.relV1866 = clamp(t.relV1866 + 6, 0, 100); applyPlayerHappy(3); } },
    { id: "thoughtful_gift", gate: function (t) { return t.relV1866 >= 45; }, text: function (t) { return t.name + " leaves a thoughtful gift at your door."; }, apply: function (t) { var g = round(80 + Math.random() * 260); S().money = round(cash() + g); applyPlayerHappy(2); return g; } },
    { id: "coffee_run_in", gate: function (t) { return t.relV1866 >= 30; }, text: function (t) { return "You run into " + t.name + " across town and end up talking for an hour."; }, apply: function (t) { t.relV1866 = clamp(t.relV1866 + 3, 0, 100); applyPlayerHappy(2); } },
    { id: "rent_grace", gate: function (t) { return t.relV1866 >= 25; }, text: function (t) { return t.name + " hits a rough month and asks to push rent a couple weeks; you say it's fine."; }, apply: function (t) { t.relV1866 = clamp(t.relV1866 + 7, 0, 100); applyPlayerHappy(-1); } },
    { id: "house_party", gate: function (t) { return personaOf(t).id === "partier"; }, text: function (t) { return t.name + " throws a party the neighbors will be talking about for weeks."; }, apply: function (t, p) { p.condition = clamp(p.condition - 4, 0, 100); t.happiness = clamp(n(t.happiness, 70) + 6, 0, 100); } },
    { id: "jealous_ex", gate: function (t) { return t.romanticV1866; }, text: function (t) { return t.name + "'s ex turns up and makes a scene outside the building."; }, apply: function (t) { t.chemV1866 = clamp(t.chemV1866 - 4, 0, 100); applyPlayerHappy(-3); } },
    { id: "weekend_away", gate: function (t) { return t.romanticV1866 && t.chemV1866 >= 50; }, text: function (t) { return t.name + " surprises you with a weekend away."; }, apply: function (t) { t.chemV1866 = clamp(t.chemV1866 + 6, 0, 100); applyPlayerHappy(8); var c = Math.min(cash(), round(300 + Math.random() * 900)); S().money = round(cash() - c); return -c; } },
    { id: "meet_friends", gate: function (t) { return t.romanticV1866 && t.relV1866 >= 55; }, text: function (t) { return t.name + " introduces you to their friends - it goes well."; }, apply: function (t) { t.relV1866 = clamp(t.relV1866 + 6, 0, 100); applyPlayerHappy(4); } }
  ];
  function rollTenantStory(p) {
    var t = p.tenant; if (!t || t.relV1866 == null) return;
    var eligible = STORY_EVENTS.filter(function (e) { try { return e.gate(t, p); } catch (x) { return false; } });
    if (!eligible.length) return;
    var e = eligible[Math.floor(Math.random() * eligible.length)];
    var extra = null; try { extra = e.apply(t, p); } catch (x) {}
    var moneyDelta = (typeof extra === "number") ? extra : 0;
    logEvent(e.text(t) + " (" + p.name + ")", moneyDelta ? { money: moneyDelta } : {});
  }
  window.reTenantLineV1867 = function (uid, category) { var p = byUid(uid); return (p && p.tenant) ? tenantLine(ensureTenantRel(p.tenant), category || "talk") : ""; };
  window.reRollTenantStoryV1867 = function (uid) { var p = byUid(uid); if (p && p.tenant) rollTenantStory(p); };

  function processRent(p) {
    if (p.strategy !== "rent" || p.type === "land") return { rent: 0, vacant: false, tenant: false };
    p.rentedOut = true;
    var band = conditionBand(p.condition);
    if (!band.canRent) { p.tenant = null; return { rent: 0, vacant: true, tenant: false }; }
    var marketRent = Math.max(0, round(p.monthlyRent * band.rent));
    var asking = Math.max(0, round(p.askingRent || marketRent));
    var vacancy = clamp(band.vacancy + Math.max(0, asking - marketRent) / Math.max(1, marketRent) * 0.35, 0.02, 0.75);
    if (p.tenant && n(p.tenant.leaseYearsLeft) <= 0) {
      // A strong relationship makes the tenant renew instead of moving out.
      var rel0 = n(p.tenant.relV1866, 0);
      if (rel0 >= 50 && Math.random() < clamp(rel0 / 130 + personaBias(p.tenant).retention, 0, 0.95)) { p.tenant.leaseYearsLeft = 1 + Math.round(rel0 / 40); }
      else { p.tenant = Math.random() > vacancy ? makeTenant(p) : null; }
    } else if (!p.tenant) {
      p.tenant = Math.random() > vacancy ? makeTenant(p) : null;
    }
    if (!p.tenant) return { rent: 0, vacant: true, tenant: false };
    var reliability = clamp(n(p.tenant.reliability, 76) / 100, 0.35, 1);
    var miss = Math.random() > reliability;
    var collected = miss ? round(asking * 12 * 0.62) : round(asking * 12);
    p.tenant.happiness = clamp(n(p.tenant.happiness, 70) - Math.max(0, asking - marketRent) / Math.max(1, marketRent) * 16 - (p.condition < 55 ? 8 : 0), 0, 100);
    p.tenant.leaseYearsLeft = Math.max(0, n(p.tenant.leaseYearsLeft) - 1);
    if (p.tenant.happiness < 22 || Math.random() < 0.05 + (p.condition < 50 ? 0.12 : 0)) p.tenant.leaseYearsLeft = 0;
    return { rent: collected, vacant: false, tenant: true };
  }

  function propertyStats(p) {
    var debt = Math.max(0, round(p.mortgageLeft));
    var value = Math.max(0, round(p.currentValue));
    return { value: value, debt: debt, equity: round(value - debt), cashFlow: n(p.lastYear && p.lastYear.cashFlow) };
  }

  function portfolioStats() {
    var re = ensureRE();
    var stats = { count: re.portfolio.length, value: 0, debt: 0, equity: 0, annualRent: 0, annualMaint: 0, annualMortgage: 0, annualCashFlow: 0, tenantCount: 0, vacantCount: 0, prestige: 0 };
    re.portfolio.forEach(function (p) {
      p = normalizeProp(p);
      stats.value += n(p.currentValue);
      stats.prestige += classOf(p).prestige;
      stats.debt += n(p.mortgageLeft);
      var band = conditionBand(p.condition);
      var rent = p.strategy === "rent" && band.canRent ? round((p.askingRent || p.monthlyRent) * 12) : 0;
      stats.annualRent += rent;
      stats.annualMaint += round(p.yearlyMaint * (1 + Math.max(0, 70 - p.condition) / 160));
      stats.annualMortgage += annualMortgagePayment(p);
      if (p.tenant) stats.tenantCount++;
      if (p.strategy === "rent" && !p.tenant) stats.vacantCount++;
    });
    stats.value = round(stats.value);
    stats.debt = round(stats.debt);
    stats.equity = round(stats.value - stats.debt);
    stats.prestige = round(stats.prestige);
    stats.annualCashFlow = round(stats.annualRent - stats.annualMaint - stats.annualMortgage);
    return stats;
  }
  window.rePortfolioStatsV1863 = portfolioStats;
  window.rePrestigeV1863 = function () { return portfolioStats().prestige; };
  window.reEquityV1863 = function () { return portfolioStats().equity; };
  window.reValueV1863 = function () { return portfolioStats().value; };
  window.reMortgageDebtV1863 = function () { return portfolioStats().debt; };

  function recordFinance(stats) {
    var f = fin();
    f.lastRealEstateRentV1863 = round(stats.rent || stats.annualRent || 0);
    f.lastRealEstateMaintenanceV1863 = round(stats.maintenance || stats.annualMaint || 0);
    f.lastRealEstateMortgageV1863 = round(stats.mortgage || stats.annualMortgage || 0);
    f.lastRealEstateCashFlowV1863 = round(stats.cashFlow || stats.annualCashFlow || 0);
    f.lastRealEstateEquityV1863 = round(stats.equity || 0);
    f.lastRealEstateValueV1863 = round(stats.value || 0);
    f.lastRealEstateDebtV1863 = round(stats.debt || 0);
    f.lastRealEstateTenantIncomeV1863 = round(stats.tenantIncome || stats.rent || 0);
    // Compatibility for existing Finance rows and old probes.
    f.lastRealEstateRentV1862 = f.lastRealEstateRentV1863;
    f.lastRealEstateMaintenanceV1862 = f.lastRealEstateMaintenanceV1863;
    f.lastRealEstateMortgageV1862 = f.lastRealEstateMortgageV1863;
    f.lastRealEstateCashFlowV1862 = f.lastRealEstateCashFlowV1863;
    f.lastRealEstateEquityV1862 = f.lastRealEstateEquityV1863;
  }

  window.reYearlyTickV1863 = function () {
    var re = ensureRE();
    if (!re.portfolio.length) { refreshMarket(true); return; }
    var s = S();
    var trend = TRENDS[(re.market && re.market.trend) || "stable"] || TRENDS.stable;
    var totals = { rent: 0, maintenance: 0, mortgage: 0, cashFlow: 0, equity: 0, value: 0, debt: 0, tenantIncome: 0, sold: 0 };
    var soldProps = [];
    re.portfolio.slice().forEach(function (p) {
      p = normalizeProp(p);
      if (p.underRefurb) {
        p.underRefurb.yearsLeft = Math.max(0, n(p.underRefurb.yearsLeft) - 1);
        if (p.underRefurb.yearsLeft <= 0) {
          p.condition = clamp(p.condition + n(p.underRefurb.cond), 0, 100);
          p.currentValue = round(p.currentValue * (1 + n(p.underRefurb.value)));
          p.monthlyRent = round(p.monthlyRent * (1 + n(p.underRefurb.rent)));
          p.askingRent = Math.max(p.askingRent, p.monthlyRent);
          p.renovations.push(p.underRefurb.id);
          p.underRefurb = null;
        }
      }
      var noise = (Math.random() - 0.5) * 0.055;
      var appreciation = clamp(n(p.apprecMean) + n(trend.apprec) + noise, -0.18, 0.20);
      p.currentValue = Math.max(1000, round(p.currentValue * (1 + appreciation)));
      if (p.type !== "land") p.condition = clamp(p.condition - (2 + Math.random() * 6 + (p.strategy === "rent" ? 1.5 : 0)), 0, 100);
      else p.condition = clamp(p.condition - Math.random() * 1.2, 0, 100);
      // Property manager (hired): service condition, evict non-payers, and place a vetted tenant
      // BEFORE rent is processed, so a big portfolio runs hands-off.
      p._mgrServicedV1868 = 0;
      if (re.managerV1868 && re.managerV1868.hired && p.strategy === "rent" && p.type !== "land") {
        // Keep the unit in genuinely good shape: restore to ~90 (cost scales with how run-down it was),
        // so even a completely wrecked property gets fixed, not just nudged.
        if (p.condition < 85) { var c0mgr = p.condition; p.condition = clamp(Math.max(p.condition, 90), 0, 100); p._mgrServicedV1868 = round(n(p.currentValue) * (0.006 + Math.max(0, 90 - c0mgr) / 100 * 0.02)); }
        if (p.tenant && n(p.tenant.reliability, 70) < 55) p.tenant = null; // evict the non-payer
        if (!p.tenant && conditionBand(p.condition).canRent) {
          var mgrT = makeTenant(p);
          mgrT.reliability = clamp(n(mgrT.reliability) + 18, 45, 100); // manager vets for reliability
          mgrT.criminalV1865 = "none";
          p.tenant = mgrT;
        }
      }
      var rent = processRent(p);
      // Bad tenants can damage the unit (condition + value). Screening lets you avoid them.
      p._tenantDamageV1865 = null;
      if (p.tenant && p.strategy === "rent") {
        var crim = p.tenant.criminalV1865 || "none";
        var crisk = CRIMINAL[crim] ? CRIMINAL[crim].risk : 0;
        var rel = n(p.tenant.reliability, 70);
        var dmgChance = clamp((0.03 + crisk * 0.16 + Math.max(0, 60 - rel) / 320) * personaBias(p.tenant).wear, 0, 0.55);
        if (Math.random() < dmgChance) {
          var sev = crim === "serious" ? (6 + Math.random() * 12) : (3 + Math.random() * 6);
          p.condition = clamp(p.condition - sev, 0, 100);
          var valHit = round(p.currentValue * (crim === "serious" ? 0.02 + Math.random() * 0.03 : 0.008 + Math.random() * 0.015));
          p.currentValue = Math.max(1000, round(p.currentValue - valHit));
          p._tenantDamageV1865 = { sev: Math.round(sev), valHit: valHit };
          logEvent("Tenant trouble at " + p.name + ": " + (crim === "serious" ? "serious damage" : "wear and damage") + " (-" + Math.round(sev) + " condition, -" + compact(valHit) + " value).", {});
        }
      }
      // Tenant relationship: slow yearly drift (visit to maintain it); a good relationship
      // occasionally sends a gift or you run into them out and about.
      if (p.tenant && p.tenant.relV1866 != null) {
        p.tenant.relV1866 = clamp(n(p.tenant.relV1866) - 3, 0, 100);
        p.tenant.chemV1866 = clamp(n(p.tenant.chemV1866) - 2, 0, 100);
        if (p.tenant.relV1866 >= 25 && Math.random() < 0.30) rollTenantStory(p); // a story moment, not just a stat nudge
      }
      var maintenance = round(p.yearlyMaint * (1 + Math.max(0, 68 - p.condition) / 95)) + n(p._mgrServicedV1868);
      var mort = processMortgage(p);
      var net = round(rent.rent - maintenance - mort.paid);
      p.lastYear = { rent: rent.rent, maintenance: maintenance, mortgage: mort.paid, principal: mort.principal, cashFlow: net, appreciation: appreciation, condition: round(p.condition), vacant: !!rent.vacant };
      p.history.push(p.lastYear);
      p.history = p.history.slice(-12);
      p.yearsOwned += 1;
      totals.rent += rent.rent;
      totals.tenantIncome += rent.tenant ? rent.rent : 0;
      totals.maintenance += maintenance;
      totals.mortgage += mort.paid;
      totals.cashFlow += net;
      if (p.forSale && Math.random() < saleChance(p)) {
        var sale = sellPropertyInternal(p, "market");
        totals.cashFlow += sale.net;
        totals.sold += sale.net;
        soldProps.push(p.name);
      }
      syncAliases(p);
    });
    refreshResidenceBonus(); // keep the live-in lifestyle bonus current with condition/class
    var stats = portfolioStats();
    totals.value = stats.value; totals.debt = stats.debt; totals.equity = stats.equity;
    if (re.managerV1868 && re.managerV1868.hired && stats.value > 0) {
      var mgrFee = round(stats.value * 0.003); // ~0.3%/yr management fee
      totals.cashFlow -= mgrFee; totals.maintenance += mgrFee; totals.managerFee = mgrFee;
    }
    s.money = round(cash() + totals.cashFlow);
    re.lastYear = totals;
    recordFinance(totals);
    refreshMarket(true);
    var soldText = soldProps.length ? " Sold: " + soldProps.join(", ") + "." : "";
    logEvent("Real estate: rent " + compact(totals.rent) + ", maintenance " + compact(totals.maintenance) + ", mortgages " + compact(totals.mortgage) + ". Net " + compact(totals.cashFlow) + "." + soldText, { money: totals.cashFlow });
  };

  function buyListing(lid, mode) {
    var re = ensureRE();
    var l = findListing(lid);
    if (!l) {
      var template = PROPERTY_TEMPLATES.find(function (t) { return t.tplId === lid; });
      if (template) {
        var m = re.market || refreshMarket(false);
        l = listingFromTemplate(template, hash("manual:" + age() + ":" + lid), 777, m.trend || "stable", m.inflation || 1, null);
        l.lid = "manual_" + template.tplId + "_" + age();
        l.manualListing = true;
      }
    }
    if (!l) return toast("That listing is no longer available.");
    if (age() < 18) return toast("Property unlocks at 18.");
    var cd = classDef(l.cls) || classForValue(l.listPrice);
    var reqNW = l.reqNetWorth != null ? n(l.reqNetWorth) : cd.reqNetWorth;
    if (reqNW > 0 && netWorth() < reqNW) return toast(cd.label + "-class property needs " + compact(reqNW) + " net worth.");
    mode = mode === "cash" ? "cash" : "mortgage";
    var price = round(l.listPrice);
    var tier = creditTier();
    var downPct = mode === "cash" || l.cashOnly ? 1 : clamp(l.downPct + tier.downMod, 0.06, 0.50);
    var down = round(price * downPct);
    if (mode === "mortgage" && l.cashOnly) return toast("This auction is cash-only.");
    if (mode === "mortgage" && score() < l.reqCredit) return toast("Credit score too low. Need " + l.reqCredit + "+.");
    if (cash() < down) return toast("Need " + compact(down) + (mode === "cash" ? " cash." : " down."));
    S().money = round(cash() - down);
    var mortgageLeft = mode === "cash" ? 0 : Math.max(0, price - down);
    var p = normalizeProp({
      uid: newUid(re),
      tplId: l.tplId,
      cls: l.cls,
      name: l.name.replace(/\s+Auction$/, ""),
      type: l.type,
      neighborhood: l.neighborhood,
      buyPrice: price,
      basePrice: l.marketPrice,
      currentValue: price,
      mortgageLeft: mortgageLeft,
      mortgageRate: mortgageLeft ? tier.rate : 0,
      mortgageTermYears: 25,
      monthlyRent: l.monthlyRent,
      askingRent: l.monthlyRent,
      yearlyMaint: l.yearlyMaint,
      apprecMean: l.apprecMean,
      condition: l.condition,
      units: l.units,
      purchaseAge: age(),
      purchaseStyle: mode,
      strategy: "hold",
      rentedOut: false
    });
    re.portfolio.push(p);
    if (!l.manualListing) {
      var list = l.urgencyType ? re.market.urgencyListings : re.market.listings;
      var idx = list.findIndex(function (x) { return x.lid === lid; });
      if (idx >= 0) list.splice(idx, 1);
    }
    re.focusListingId = null;
    re.pendingStrategyUid = p.uid;
    var f = fin();
    f.creditScore = clamp(score() + (mode === "cash" ? 2 : -4), 300, 850);
    recordFinance(portfolioStats());
    logEvent("Bought " + p.name + " for " + compact(price) + (mortgageLeft ? " with " + compact(down) + " down and " + compact(mortgageLeft) + " mortgage." : " in cash."), { money: -down });
    saveRender();
  }
  window.reBuyV1863 = buyListing;

  function byUid(uid) { return ensureRE().portfolio.find(function (p) { return String(p.uid) === String(uid); }) || null; }

  window.reSetStrategyV1863 = function (uid, strategy) {
    var re = ensureRE();
    var p = byUid(uid); if (!p) return toast("Property not found.");
    strategy = strategy || "hold";
    var wasPrimary = re.primaryUid === p.uid;
    p.strategy = strategy;
    if (strategy === "rent") {
      p.rentedOut = true;
      p.askingRent = p.askingRent || p.monthlyRent;
      if (re.primaryUid === p.uid) re.primaryUid = null;
      if (!p.tenant) ensureApplicants(p, true); // surface applicants to screen instead of silently auto-placing
    } else {
      p.rentedOut = false;
      p.tenant = null;
      p.applicantsV1865 = null;
    }
    if (strategy === "flip") {
      if (!p.flipFromV1865) p.flipFromV1865 = round(p.currentValue);
      p.flipStartAgeV1865 = age();
    }
    if (strategy === "live") {
      re.portfolio.forEach(function (x) { if (x.uid !== p.uid && x.strategy === "live") x.strategy = "hold"; });
      re.primaryUid = p.uid;
      var ls = residenceLifestyle(p);
      applyResidenceBonus(ls.happy, ls.looks); // living here lifts happiness/looks
    } else if (wasPrimary) {
      re.primaryUid = null;
      applyResidenceBonus(0, 0); // moved out of your owned residence
    }
    re.pendingStrategyUid = null;
    syncAliases(p);
    recordFinance(portfolioStats());
    toast(strategy === "rent" ? p.name + " is now a rental - screen and place a tenant below."
      : strategy === "live" ? "You moved into " + p.name + " - it lifts your lifestyle (+" + residenceLifestyle(p).happy + " happiness)."
      : strategy === "flip" ? p.name + " is now a flip - renovate to add value, then list it for sale."
      : p.name + " is on hold.");
    logEvent("Property strategy: " + p.name + " is now " + strategy + ".", {});
    saveRender();
  };
  window.reToggleRentalV1863 = function (uid) {
    var p = byUid(uid); if (!p) return;
    window.reSetStrategyV1863(uid, p.strategy === "rent" ? "live" : "rent");
  };

  window.reAdjustRentV1863 = function (uid, mode) {
    var p = byUid(uid); if (!p) return toast("Property not found.");
    var base = Math.max(100, p.monthlyRent);
    if (mode === "market") p.askingRent = base;
    else p.askingRent = Math.max(100, round((p.askingRent || base) * (1 + n(mode))));
    logEvent("Adjusted asking rent on " + p.name + " to " + compact(p.askingRent) + "/mo.", {});
    saveRender();
  };

  function renovateCost(p, r) { return Math.max(4000, round(p.currentValue * n(r.cost))); }
  window.reOpenRenovationV1863 = function (uid) { ensureRE().renovationUid = uid; saveRender(); };
  window.reOpenApplicantsV1865 = function (uid) { var re = ensureRE(); re.applicantsUid = uid; var p = byUid(uid); if (p) ensureApplicants(p, false); saveRender(); };
  window.reOpenTenantV1866 = function (uid) { var re = ensureRE(); re.tenantUid = uid; var p = byUid(uid); if (p && p.tenant) ensureTenantRel(p.tenant); saveRender(); };
  window.reCloseOverlayV1863 = function () { var re = ensureRE(); re.renovationUid = null; re.pendingStrategyUid = null; re.applicantsUid = null; re.tenantUid = null; re.saleUid = null; saveRender(); };
  window.reRenovateV1863 = function (uid, rid) {
    var p = byUid(uid); if (!p) return toast("Property not found.");
    var r = RENOVATIONS.find(function (x) { return x.id === rid; }) || RENOVATIONS[0];
    if (p.renovations.indexOf(r.id) >= 0 || (p.underRefurb && p.underRefurb.id === r.id)) return toast("Already done on this property.");
    var cost = renovateCost(p, r);
    if (cash() < cost) return toast(r.name + " costs " + compact(cost) + ".");
    S().money = round(cash() - cost);
    if (r.time > 0) {
      p.underRefurb = { id: r.id, yearsLeft: r.time, rent: r.rent, value: r.value, cond: r.cond, cost: cost };
      logEvent("Started " + r.name + " on " + p.name + " for " + compact(cost) + ". It finishes next year.", { money: -cost });
    } else {
      p.currentValue = round(p.currentValue * (1 + r.value));
      p.monthlyRent = round(p.monthlyRent * (1 + r.rent));
      p.askingRent = Math.max(p.askingRent, p.monthlyRent);
      p.condition = clamp(p.condition + r.cond, 0, 100);
      p.renovations.push(r.id);
      logEvent(r.name + " completed on " + p.name + " for " + compact(cost) + ".", { money: -cost });
    }
    syncAliases(p);
    recordFinance(portfolioStats());
    saveRender();
  };

  // Repeatable, instant full restoration to perfect condition (the individual renovations are
  // one-time each, so a decayed property would otherwise have no way to recover its condition).
  function fullRestoreCost(p) {
    var deficit = Math.max(0, 100 - n(p.condition)) / 100; // 0 (pristine) .. 1 (wrecked)
    return Math.max(2000, round(n(p.currentValue) * (0.02 + deficit * 0.03))); // 2% .. 5% of value
  }
  window.reFullRestoreV1868 = function (uid) {
    var p = byUid(uid); if (!p) return toast("Property not found.");
    if (round(p.condition) >= 99) return toast(p.name + " is already in perfect condition.");
    var cost = fullRestoreCost(p);
    if (cash() < cost) return toast("A full restoration costs " + compact(cost) + ".");
    S().money = round(cash() - cost);
    p.condition = 100;
    p.currentValue = round(n(p.currentValue) * 1.01); // small refresh bump
    syncAliases(p);
    recordFinance(portfolioStats());
    logEvent("Full restoration on " + p.name + " for " + compact(cost) + " - back to perfect condition.", { money: -cost });
    toast(p.name + " restored to perfect condition.");
    saveRender();
  };

  // Property manager: pay ~0.3%/yr of portfolio value; the yearly tick then auto-services condition,
  // evicts non-paying tenants, and places vetted replacements so a large portfolio runs hands-off.
  window.reHireManagerV1868 = function () {
    var re = ensureRE();
    re.managerV1868 = re.managerV1868 || { hired: false };
    re.managerV1868.hired = !re.managerV1868.hired;
    toast(re.managerV1868.hired ? "Hired a property manager - they service condition and handle bad tenants for ~0.3%/yr of portfolio value." : "Let the property manager go.");
    logEvent(re.managerV1868.hired ? "Hired a property manager." : "Dismissed the property manager.", {});
    saveRender();
  };

  function saleFairPrice(p) {
    var band = conditionBand(p.condition);
    var fair = round(p.currentValue * band.sale);
    if (p.strategy === "flip" && p.renovations && p.renovations.length) fair = round(fair * (1 + Math.min(0.06, 0.02 * p.renovations.length)));
    return Math.max(1000, fair);
  }
  function saleChanceAtAsk(p, ask) {
    var fair = saleFairPrice(p);
    ask = Math.max(1000, n(ask, fair));
    var over = Math.max(0, (ask - fair) / fair);
    var under = Math.max(0, (fair - ask) / fair);
    var years = age() - n(p.saleListedAge, age());
    return clamp(0.70 + under * 0.32 - over * 1.05 + years * 0.10, 0.03, 0.88);
  }
  function saleQuote(p, ask) {
    p = normalizeProp(p);
    var fair = saleFairPrice(p);
    ask = Math.max(1000, round(ask == null ? (p.askingPrice || fair) : ask));
    var gross = round(Math.min(ask, fair * (ask > fair * 1.15 ? 1.16 : 1.08)));
    var costs = round(gross * 0.035);
    var payoff = round(p.mortgageLeft);
    var net = round(gross - costs - payoff);
    var over = (ask - fair) / fair;
    var tone = over > 0.25 ? "bad" : over > 0.10 ? "warn" : over < -0.08 ? "good" : "good";
    var label = over > 0.25 ? "Overpriced" : over > 0.10 ? "Ambitious" : over < -0.08 ? "Fast sale" : "Market";
    return { fair: fair, ask: ask, gross: gross, costs: costs, payoff: payoff, net: net, chance: saleChanceAtAsk(p, ask), label: label, tone: tone };
  }
  window.reSaleQuoteV1868 = function (uid, ask) { var p = byUid(uid); return p ? saleQuote(p, ask) : null; };
  window.reSetSaleAskV1868 = function (uid, ask) {
    var p = byUid(uid); if (!p) return toast("Property not found.");
    var q = saleQuote(p, ask);
    p.forSale = true;
    p.askingPrice = q.ask;
    if (p.saleListedAge == null) p.saleListedAge = age();
    logEvent(p.name + " asking price set to " + compact(p.askingPrice) + " (" + Math.round(q.chance * 100) + "% yearly buyer odds).", {});
    saveRender();
  };
  window.reApplySaleAskV1868 = function (uid) {
    var el = null;
    try { el = document.getElementById("re-sale-ask-" + String(uid).replace(/[^a-zA-Z0-9_-]/g, "_")); } catch (e) {}
    if (!el) return toast("Sale price input not found.");
    window.reSetSaleAskV1868(uid, n(el.value));
  };
  window.reListSaleV1863 = function (uid, pctOver) {
    var p = byUid(uid); if (!p) return toast("Property not found.");
    pctOver = pctOver == null ? 0 : n(pctOver);
    var fair = saleFairPrice(p);
    window.reSetSaleAskV1868(uid, round(fair * (1 + pctOver)));
  };
  window.reDelistSaleV1863 = function (uid) {
    var p = byUid(uid); if (!p) return;
    p.forSale = false; p.askingPrice = null;
    saveRender();
  };
  function saleChance(p) {
    return saleChanceAtAsk(p, p.askingPrice);
  }
  function sellPropertyInternal(p, reason) {
    var re = ensureRE();
    var fair = saleFairPrice(p);
    var q = saleQuote(p, p.askingPrice || fair);
    var gross = reason === "market" ? round(Math.min(q.ask * (0.97 + Math.random() * 0.035), fair * (q.ask > fair * 1.15 ? 1.16 : 1.08))) : round(fair * 0.96);
    var costs = round(gross * 0.035);
    var payoff = round(p.mortgageLeft);
    var net = round(gross - costs - payoff);
    var idx = re.portfolio.indexOf(p);
    if (idx >= 0) re.portfolio.splice(idx, 1);
    if (re.primaryUid === p.uid) { re.primaryUid = null; applyResidenceBonus(0, 0); } // sold your residence -> drop the lifestyle bonus
    return { gross: gross, costs: costs, payoff: payoff, net: net };
  }
  window.reSellV1863 = function (uid) {
    var p = byUid(uid); if (!p) return toast("Property not found.");
    var sale = sellPropertyInternal(p, "instant");
    S().money = round(cash() + sale.net);
    logEvent("Sold " + p.name + " for " + compact(sale.gross) + ". Net after costs and debt: " + compact(sale.net) + ".", { money: sale.net });
    recordFinance(portfolioStats());
    saveRender();
  };
  window.reOpenSaleV1868 = function (uid) { var re = ensureRE(); re.saleUid = uid; saveRender(); };

  window.rePayMortgageV1863 = function (uid, amount) {
    var p = byUid(uid); if (!p || n(p.mortgageLeft) <= 0) return toast("No mortgage on that property.");
    var pay = amount === "max" ? Math.min(round(cash()), round(p.mortgageLeft)) : Math.min(round(p.mortgageLeft), Math.max(0, round(amount)));
    if (pay <= 0) return toast("Nothing to pay.");
    if (cash() < pay) return toast("Not enough cash.");
    S().money = round(cash() - pay);
    p.mortgageLeft = Math.max(0, round(p.mortgageLeft - pay));
    if (p.mortgageLeft <= 0) p.mortgageRate = 0;
    syncAliases(p);
    logEvent("Paid " + compact(pay) + " toward " + p.name + "'s mortgage.", { money: -pay });
    recordFinance(portfolioStats());
    saveRender();
  };
  window.reRefinanceV1863 = function (uid) {
    var p = byUid(uid); if (!p || n(p.mortgageLeft) <= 0) return toast("No mortgage to refinance.");
    var rate = creditTier().rate;
    if (rate >= n(p.mortgageRate) - 0.002) return toast("Your current rate is already competitive.");
    var fee = round(p.mortgageLeft * 0.012);
    if (cash() < fee) return toast("Refinance fee is " + compact(fee) + ".");
    S().money = round(cash() - fee);
    p.mortgageRate = rate;
    syncAliases(p);
    logEvent("Refinanced " + p.name + " to " + pct(rate) + ". Fee " + compact(fee) + ".", { money: -fee });
    saveRender();
  };

  window.reOpenListingV1863 = function (lid) { ensureRE().focusListingId = lid; saveRender(); };
  window.reCloseListingV1863 = function () { ensureRE().focusListingId = null; saveRender(); };

  function styleBlock() {
    return `<style>
      .re1863{display:flex;flex-direction:column;gap:12px}
      .re1863 *{box-sizing:border-box}
      .re1863 .re-band{border:1px solid var(--border);background:rgba(255,255,255,.035);border-radius:8px;padding:12px}
      .re1863 .re-kicker{font-family:var(--mono,monospace);font-size:10px;letter-spacing:1.4px;text-transform:uppercase;color:var(--muted)}
      .re1863 .re-title{font-weight:800;font-size:17px;line-height:1.15}
      .re1863 .re-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
      .re1863 .re-stat{border:1px solid var(--border);border-radius:8px;padding:10px;background:rgba(0,0,0,.16);min-width:0}
      .re1863 .re-stat b{display:block;font-size:15px;color:var(--accent)}
      .re1863 .re-stat span{display:block;font-size:11px;color:var(--muted)}
      .re1863 .re-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:8px}
      .re1863 .re-card{border:1px solid var(--border);border-radius:8px;padding:10px;background:rgba(0,0,0,.14);min-width:0}
      .re1863 .re-card.hot{border-color:rgba(232,168,56,.45);background:rgba(232,168,56,.07)}
      .re1863 .re-card.urgent{border-color:rgba(76,175,130,.45);background:rgba(76,175,130,.08)}
      .re1863 .re-card.auction{border-color:rgba(220,70,70,.45);background:rgba(220,70,70,.07)}
      .re1863 .re-card.rare{border-color:rgba(91,155,213,.55);background:rgba(91,155,213,.07)}
      .re1863 .re-card.epic{border-color:rgba(212,175,55,.68);background:linear-gradient(145deg,rgba(212,175,55,.12),rgba(0,0,0,.14))}
      .re1863 .re-market-list{grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
      .re1863 .re-market-list .re-card{padding:12px}
      .re1863 .re-market-list .re-title{font-size:18px}
      .re1863 .re-market-brief{display:flex;justify-content:space-between;gap:12px;align-items:flex-end;flex-wrap:wrap}
      .re1863 .re-deal-badge{display:inline-flex;align-items:center;gap:4px;border:1px solid var(--border);border-radius:999px;padding:4px 8px;font-family:var(--mono,monospace);font-size:10px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;color:var(--muted);background:rgba(255,255,255,.045)}
      .re1863 .re-deal-badge.common{border-color:rgba(255,255,255,.16);color:var(--muted)}
      .re1863 .re-deal-badge.rare{border-color:rgba(91,155,213,.75);color:#74b9ff;background:rgba(91,155,213,.13)}
      .re1863 .re-deal-badge.epic{border-color:rgba(212,175,55,.85);color:#ffd36a;background:rgba(212,175,55,.15)}
      .re1863 .re-deal-badge.urgent{border-color:rgba(76,175,130,.75);color:var(--good);background:rgba(76,175,130,.13)}
      .re1863 .re-deal-badge.auction{border-color:rgba(220,70,70,.75);color:var(--bad);background:rgba(220,70,70,.13)}
      .re1863 .re-tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}
      .re1863 .re-tag{font-family:var(--mono,monospace);font-size:10px;border:1px solid var(--border);border-radius:999px;padding:3px 7px;color:var(--muted)}
      .re1863 .re-cls{font-family:var(--mono,monospace);font-size:10px;letter-spacing:.4px;text-transform:uppercase;border:1px solid var(--border);border-radius:999px;padding:2px 7px;white-space:nowrap;font-weight:700}
      .re1863 .re-cls.lk{opacity:.42}
      .re1863 .re-ladder{display:flex;gap:5px;flex-wrap:wrap;margin-top:9px}
      .re1863 .re-lock{font-size:11px;color:var(--bad);margin-top:7px;border-top:1px dashed rgba(220,70,70,.3);padding-top:6px}
      .re1863 .re-card.locked{opacity:.82}
      .re1863 .re-card.locked .re-title{color:var(--muted)}
      .re1863 .re-actions button.re-on{border-color:var(--accent);background:rgba(232,168,56,.14);color:var(--accent);font-weight:700}
      .re1863 .re-flip{border:1px solid rgba(232,168,56,.4);background:rgba(232,168,56,.06);border-radius:8px;padding:9px;margin-top:9px}
      .re1863 .re-appl{border:1px solid rgba(91,155,213,.4);background:rgba(91,155,213,.06);border-radius:8px;padding:9px;margin-top:9px;display:flex;flex-direction:column;gap:8px}
      .re1863 .re-appl-card{border:1px solid var(--border);border-radius:8px;padding:9px;background:rgba(0,0,0,.16)}
      .re1863 .re-appl-facts{display:flex;flex-wrap:wrap;gap:5px 14px;font-size:12px;color:var(--muted);margin-top:6px}
      .re1863 .re-appl-facts b{color:var(--text)}
      .re1863 .re-appl-hint{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;border:1px solid rgba(91,155,213,.4);background:rgba(91,155,213,.06);border-radius:8px;padding:9px;margin-top:9px;font-size:12px;color:var(--muted)}
      .re1863 .re-appl-hint b{color:var(--text)}
      .re1863 .good{color:var(--good)} .re1863 .bad{color:var(--bad)} .re1863 .warn{color:var(--accent)}
      .re1863 .re-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
      .re1863 .re-actions button,.re1863 .re-btn{border:1px solid var(--border);background:rgba(255,255,255,.055);color:var(--text);border-radius:999px;padding:7px 10px;font-size:12px;cursor:pointer}
      .re1863 .re-actions button:disabled,.re1863 .re-btn:disabled{opacity:.45;cursor:not-allowed}
      .re1863 .re-bar{height:7px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden;margin-top:5px}
      .re1863 .re-bar i{display:block;height:100%;background:var(--good)}
      .re1863 .re-detail{border:1px solid rgba(91,155,213,.45);background:rgba(91,155,213,.07);border-radius:8px;padding:12px}
      .re1863 .re-sale-input{width:100%;border:1px solid var(--border);background:rgba(0,0,0,.22);color:var(--text);border-radius:8px;padding:9px 10px;font-size:14px}
      .re1863-overlay{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:16px}
      .re1863-modal{width:min(560px,100%);max-height:88vh;overflow:auto;border:1px solid var(--border);background:var(--panel);border-radius:10px;padding:16px}
      @media(max-width:980px){.re1863 .re-market-list{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:760px){.re1863 .re-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.re1863 .re-list,.re1863 .re-market-list{grid-template-columns:1fr}}
    </style>`;
  }

  function renderCreditPanel(re, stats) {
    var tier = creditTier();
    var sc = score();
    return `<div class="re-band">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
        <div>
          <div class="re-kicker">Credit desk</div>
          <div class="re-title">Score ${sc} - ${esc(tier.label)}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:4px">${esc(tier.desc)} Mortgage rate ${pct(tier.rate)}.</div>
        </div>
        <div style="text-align:right">
          <div class="re-kicker">Portfolio equity</div>
          <div style="font-weight:800;color:var(--accent);font-size:18px">${compact(stats.equity)}</div>
        </div>
      </div>
      <div class="re-bar"><i style="width:${clamp((sc - 300) / 550 * 100, 0, 100)}%;background:${tier.color}"></i></div>
      <div class="re-tags">${CREDIT_TIERS.map(function (t) { return `<span class="re-tag" style="${sc >= t.min && sc <= t.max ? "border-color:" + t.color + ";color:" + t.color : ""}">${t.min}-${t.max} ${esc(t.label)}</span>`; }).join("")}</div>
    </div>`;
  }

  function renderSummary(re, stats) {
    var m = re.market || {};
    var trend = TRENDS[m.trend] || TRENDS.stable;
    var rank = prestigeRank(stats.prestige);
    var ladder = PROPERTY_CLASSES.map(function (cd) {
      var acc = classAccessible(cd, _nw);
      return `<span class="re-cls ${acc ? "" : "lk"}" style="border-color:${cd.color};color:${cd.color}" title="${acc ? "Unlocked" : "Unlocks at " + compact(cd.reqNetWorth) + " net worth"}">${esc(cd.label)}${acc ? "" : " &#128274;"}</span>`;
    }).join("");
    return `<div class="re-grid">
      <div class="re-stat"><span>Total value</span><b>${compact(stats.value)}</b></div>
      <div class="re-stat"><span>Mortgage debt</span><b class="${stats.debt ? "warn" : "good"}">${compact(stats.debt)}</b></div>
      <div class="re-stat"><span>Net annual cash</span><b class="${stats.annualCashFlow >= 0 ? "good" : "bad"}">${compact(stats.annualCashFlow)}</b></div>
      <div class="re-stat"><span>Market trend</span><b style="color:${trend.color}">${esc(trend.label)}</b></div>
    </div>
    <div class="re-band">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
        <div><div class="re-kicker">Estate prestige</div><div class="re-title" style="color:${rank.color}">${round(stats.prestige).toLocaleString()} &middot; ${esc(rank.label)}</div></div>
        <div style="text-align:right"><div class="re-kicker">Net worth</div><div style="font-weight:800;color:var(--accent)">${compact(_nw)}</div></div>
      </div>
      <div style="font-size:12px;color:var(--muted);margin-top:4px">Higher property classes unlock as your net worth grows and award more prestige.</div>
      <div class="re-ladder">${ladder}</div>
    </div>
    <div class="re-band" style="display:flex;justify-content:space-between;gap:12px;align-items:center">
      <div><div class="re-kicker">This year's market</div><div style="font-size:12px;color:var(--muted)">${esc(trend.note)} ${m.trendYears || 1} year streak. ${(m.listings || []).length} open listings.</div></div>
      <button class="re-btn" onclick="reRefreshMarketV1863()">Refresh view</button>
    </div>`;
  }

  window.reRefreshMarketV1863 = function () { refreshMarket(true); saveRender(); };

  function canBuy(l, mode) {
    var tier = creditTier();
    var price = round(l.listPrice);
    var downPct = mode === "cash" || l.cashOnly ? 1 : clamp(l.downPct + tier.downMod, 0.06, 0.50);
    var down = round(price * downPct);
    var cd = classDef(l.cls) || classForValue(l.listPrice);
    var reqNW = l.reqNetWorth != null ? n(l.reqNetWorth) : cd.reqNetWorth;
    var nwOk = !(reqNW > 0) || _nw >= reqNW;
    return { down: down, ok: cash() >= down && nwOk && (mode === "cash" || (!l.cashOnly && score() >= l.reqCredit)), rate: tier.rate, reqNW: reqNW, nwOk: nwOk, cd: cd };
  }

  function renderListingCard(l, urgent) {
    var cashBuy = canBuy(l, "cash"), mort = canBuy(l, "mortgage");
    var cd = mort.cd || classDef(l.cls);
    var rd = rarityDef(l.rarity);
    var cls = (l.cashOnly ? "auction" : (urgent ? "urgent" : (l.hot ? "hot" : ""))) + " " + (l.rarity || "common");
    var dealClass = l.cashOnly ? "auction" : (urgent ? "urgent" : (l.rarity || "common"));
    var locked = !mort.nwOk;
    return `<div class="re-card ${cls}${locked ? " locked" : ""}" style="border-left:3px solid ${cd.color}">
      <div style="display:flex;justify-content:space-between;gap:8px">
        <div><span class="re-deal-badge ${dealClass}">${esc(dealLabel(l))}</span><div class="re-title" style="margin-top:5px">${esc(l.name)}</div><div style="font-size:12px;color:var(--muted);display:flex;align-items:center;gap:6px;flex-wrap:wrap"><span class="re-cls" style="border-color:${cd.color};color:${cd.color}">${esc(cd.label)}</span>${esc(l.neighborhood)} - ${esc(l.type)}</div></div>
        <div style="text-align:right"><b style="color:var(--accent);font-size:18px">${compact(l.listPrice)}</b>${l.savedAmount ? `<div style="font-size:11px;color:var(--good)">${l.discountPct}% below market</div>` : ""}</div>
      </div>
      <div style="font-size:12px;color:var(--muted);margin-top:7px">${esc(l.desc)}</div>
      <div class="re-tags">
        <span class="re-tag" style="border-color:${rd.color};color:${rd.color}">${esc(rarityDef(l.rarity).desc)}</span>
        <span class="re-tag">${compact(l.monthlyRent)}/mo rent</span>
        <span class="re-tag">Down ${compact(mort.down)}</span>
        <span class="re-tag">Credit ${l.reqCredit || "cash"}</span>
        <span class="re-tag">Condition ${l.condition}/100</span>
      </div>
      ${locked ? `<div class="re-lock">Unlocks at ${compact(mort.reqNW)} net worth (${esc(cd.label)} class)</div>` : ""}
      <div class="re-actions">
        <button onclick="reOpenListingV1863('${js(l.lid)}')">Details</button>
        <button onclick="reBuyV1863('${js(l.lid)}','mortgage')" ${mort.ok ? "" : "disabled"}>Mortgage</button>
        <button onclick="reBuyV1863('${js(l.lid)}','cash')" ${cashBuy.ok ? "" : "disabled"}>Cash</button>
      </div>
    </div>`;
  }

  function renderDetail(re) {
    var l = findListing(re.focusListingId);
    if (!l) return "";
    var cashBuy = canBuy(l, "cash"), mort = canBuy(l, "mortgage");
    var band = conditionBand(l.condition);
    var cd = mort.cd || classDef(l.cls);
    var rd = rarityDef(l.rarity);
    var dealClass = l.cashOnly ? "auction" : (l.urgencyType ? "urgent" : (l.rarity || "common"));
    return `<div class="re1863-overlay" onclick="if(event.target===this)reCloseListingV1863()"><div class="re1863-modal">
      <div style="display:flex;justify-content:space-between;gap:10px">
        <div><span class="re-deal-badge ${dealClass}">${esc(dealLabel(l))}</span><div class="re-title" style="margin-top:6px">${esc(l.name)} <span class="re-cls" style="border-color:${cd.color};color:${cd.color};vertical-align:middle">${esc(cd.label)}</span></div></div>
        <button class="re-btn" onclick="reCloseListingV1863()">Close</button>
      </div>
      <div class="re-grid" style="margin-top:10px">
        <div class="re-stat"><span>Price</span><b>${compact(l.listPrice)}</b></div>
        <div class="re-stat"><span>Down payment</span><b>${compact(mort.down)}</b></div>
        <div class="re-stat"><span>Mortgage rate</span><b>${pct(mort.rate)}</b></div>
        <div class="re-stat"><span>Market rent</span><b>${compact(l.monthlyRent)}/mo</b></div>
      </div>
      <div class="re-tags"><span class="re-tag" style="border-color:${rd.color};color:${rd.color}">${esc(rd.desc)}</span><span class="re-tag">${esc(cd.label)} class</span><span class="re-tag">+${cd.prestige} prestige</span><span class="re-tag">Condition ${l.condition}/100 ${esc(band.label)}</span></div>
      <div style="font-size:12px;color:var(--muted);margin-top:9px">${esc(l.desc)} Annual maintenance about ${compact(l.yearlyMaint)}.${!mort.nwOk ? ` <span class="bad">Requires ${compact(mort.reqNW)} net worth.</span>` : ""}</div>
      <div class="re-actions">
        <button onclick="reBuyV1863('${js(l.lid)}','cash')" ${cashBuy.ok ? "" : "disabled"}>Buy cash - ${compact(l.listPrice)}</button>
        <button onclick="reBuyV1863('${js(l.lid)}','mortgage')" ${mort.ok ? "" : "disabled"}>Buy mortgage - ${compact(mort.down)} down</button>
      </div>
    </div></div>`;
  }

  function renderMarket(re) {
    var urgency = re.market.urgencyListings || [];
    var listings = re.market.listings || [];
    var rareCount = listings.filter(function (l) { return l.rarity === "rare"; }).length;
    var epicCount = listings.filter(function (l) { return l.rarity === "epic"; }).length;
    return `${urgency.length ? `<div><div class="re-kicker">Urgency deals - expire this year</div><div class="re-list re-market-list" style="margin-top:7px">${urgency.map(function (l) { return renderListingCard(l, true); }).join("")}</div></div>` : ""}
      <div><div class="re-band re-market-brief"><div><div class="re-kicker">Deal board</div><div class="re-title">${listings.length} property deals this year</div><div style="font-size:12px;color:var(--muted);margin-top:3px">This is the yearly market supply. Rare and epic tags mark the standout opportunities.</div></div><div class="re-tags" style="margin-top:0;justify-content:flex-end"><span class="re-deal-badge common">${listings.length - rareCount - epicCount} open deals</span><span class="re-deal-badge rare">${rareCount} rare deals</span><span class="re-deal-badge epic">${epicCount} epic deal${epicCount === 1 ? "" : "s"}</span></div></div><div class="re-list re-market-list" style="margin-top:7px">${listings.map(function (l) { return renderListingCard(l, false); }).join("") || `<div class="re-card">No open listings this year.</div>`}</div></div>
      ${renderDetail(re)}`;
  }

  function flipPanel(p) {
    if (p.strategy !== "flip") return "";
    var from = n(p.flipFromV1865 || p.buyPrice || p.currentValue);
    var gain = round(p.currentValue - from);
    var q = saleQuote(p, p.askingPrice || null);
    return `<div class="re-flip"><div class="re-kicker">Flip project</div>
      <div class="re-appl-facts">
        <span>Bought for <b>${compact(p.buyPrice)}</b></span>
        <span>Since flip <b class="${gain >= 0 ? "good" : "bad"}">${compact(gain)}</b></span>
        <span>Value <b>${compact(p.currentValue)}</b></span>
        <span>Market sale <b>${compact(q.fair)}</b></span>
        <span>Net at ask <b class="${q.net >= 0 ? "good" : "bad"}">${compact(q.net)}</b></span>
        <span>Buyer odds <b class="${q.tone}">${Math.round(q.chance * 100)}%</b></span>
      </div>
      <div style="font-size:11px;color:var(--muted);margin-top:4px">Renovate to raise value and condition, then set an asking price. Push too high and buyers stop biting.${p.renovations && p.renovations.length ? " Renovated flips sell at a small premium." : ""}</div>
      <div class="re-actions"><button onclick="reOpenSaleV1868('${js(p.uid)}')">${p.forSale ? "Manage listing" : "Set sale price"}</button></div>
    </div>`;
  }
  function applicantCardHtml(p, ap) {
    var crim = CRIMINAL[ap.criminal] || CRIMINAL.none;
    var inc = INCOME_BANDS[ap.income] || INCOME_BANDS.medium;
    return `<div class="re-appl-card">
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><div><b>${esc(ap.name)}</b><div style="font-size:11px;color:var(--muted)">${esc(ap.blurb)}</div></div></div>
      <div class="re-appl-facts">
        <span>Credit ${ap.revealed.credit ? `<b style="color:${ap.credit >= 680 ? "var(--good)" : ap.credit >= 600 ? "var(--accent)" : "var(--bad)"}">${ap.credit}</b>` : `<i style="color:var(--muted)">not run</i>`}</span>
        <span>Record ${ap.revealed.background ? `<b style="color:${crim.color}">${esc(crim.label)}</b>` : `<i style="color:var(--muted)">not run</i>`}</span>
        <span>Income ${ap.revealed.income ? `<b style="color:${inc.color}">${esc(inc.label)}</b>` : `<i style="color:var(--muted)">not run</i>`}</span>
      </div>
      <div class="re-actions">
        ${SCREEN_CHECKS.map(function (c) { return `<button onclick="reScreenApplicantV1865('${js(p.uid)}','${js(ap.id)}','${c.id}')" ${ap.revealed[c.reveals] || cash() < c.fee ? "disabled" : ""}>${esc(c.label.split(" ")[0])} ${compact(c.fee)}</button>`; }).join("")}
        <button class="re-on" onclick="reAcceptApplicantV1865('${js(p.uid)}','${js(ap.id)}')">Accept lease</button>
        <button onclick="reRejectApplicantV1865('${js(p.uid)}','${js(ap.id)}')">Reject</button>
      </div>
    </div>`;
  }
  function applicantsButton(p) {
    if (p.strategy !== "rent" || p.tenant) return "";
    if (!conditionBand(p.condition).canRent) return `<div class="re-appl-hint"><span class="bad">Too run-down to rent - renovate to attract tenants.</span></div>`;
    var a = ensureApplicants(p);
    var count = a && a.list ? a.list.length : 0;
    if (!count) return `<div class="re-appl-hint"><span>Vacant - no applicants right now, check back next year.</span></div>`;
    return `<div class="re-appl-hint"><span>Vacant &middot; <b>${count}</b> applicant${count > 1 ? "s" : ""} waiting</span><button class="re-btn" onclick="reOpenApplicantsV1865('${js(p.uid)}')">Screen tenants</button></div>`;
  }
  function renderApplicantsOverlay(re) {
    var p = byUid(re.applicantsUid);
    if (!p || p.strategy !== "rent" || p.tenant) return ""; // auto-closes once leased / strategy changed
    var a = ensureApplicants(p);
    var body = (a && a.list && a.list.length)
      ? a.list.map(function (ap) { return applicantCardHtml(p, ap); }).join("")
      : `<div style="font-size:12px;color:var(--muted)">No applicants right now - check back next year.</div>`;
    return `<div class="re1863-overlay"><div class="re1863-modal">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div><div class="re-kicker">Tenant screening</div><div class="re-title">Applicants for ${esc(p.name)}</div><div style="font-size:12px;color:var(--muted);margin-top:3px">Run checks to reveal an applicant, then accept or reject. A bad tenant can damage the property.</div></div><button class="re-btn" onclick="reCloseOverlayV1863()">Close</button></div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">${body}</div>
    </div></div>`;
  }
  function relMeter(label, v, color) {
    return `<div style="margin-top:6px"><div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted)"><span>${label}</span><span>${Math.round(v)}/100</span></div><div class="re-bar"><i style="width:${clamp(v, 0, 100)}%;background:${color}"></i></div></div>`;
  }
  function renderTenantOverlay(re) {
    var p = byUid(re.tenantUid);
    if (!p || !p.tenant) return "";
    var t = ensureTenantRel(p.tenant);
    var crim = CRIMINAL[t.criminalV1865] || null;
    var pr = personaOf(t);
    var tg = tenantGender(t);
    var canAskOut = !t.romanticV1866 && t.relV1866 >= 45 && t.chemV1866 >= 40;
    var actsHtml = TENANT_ACTS.map(function (a) {
      var used = n(t.actsV1866[a.id]);
      var locked = (a.needRomantic && !t.romanticV1866) || (a.needRel && t.relV1866 < a.needRel) || (a.needChem && t.chemV1866 < a.needChem) || used >= a.limit || cash() < a.cost;
      return `<button class="re-btn" style="border-radius:8px;text-align:left;padding:10px" onclick="reTenantActV1866('${js(p.uid)}','${a.id}')" ${locked ? "disabled" : ""}><b>${esc(a.label)}${a.cost ? " - " + compact(a.cost) : ""}</b><br><span style="color:var(--muted)">${esc(a.desc)} (${used}/${a.limit} this year)</span></button>`;
    }).join("");
    return `<div class="re1863-overlay"><div class="re1863-modal">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div><div class="re-kicker">Your tenant${t.romanticV1866 ? " &middot; together" : ""}</div><div class="re-title">${tg.icon} ${esc(t.name)}</div><div style="font-size:12px;color:var(--muted);margin-top:3px">${esc(p.name)} &middot; ${tg.icon} ${esc(tg.label)} (${tg.pronouns}) &middot; ${PERSONA_ICON[pr.id] || ""} ${esc(pr.label)} &middot; ${round(t.reliability)} reliability${crim && t.criminalV1865 !== "none" ? ` &middot; <span class="bad">${esc(crim.label)}</span>` : ""}</div></div><button class="re-btn" onclick="reCloseOverlayV1863()">Close</button></div>
      <div style="font-size:11px;color:var(--muted);margin-top:8px;font-style:italic">${tg.icon} ${PERSONA_ICON[pr.id] || ""} ${esc(pr.desc)}</div>
      ${relMeter("Relationship", t.relV1866, "var(--good)")}
      ${relMeter("Chemistry", t.chemV1866, "#e8a838")}
      ${canAskOut ? `<button class="re-btn re-on" style="margin-top:10px;width:100%;border-radius:8px;padding:10px" onclick="reTenantRomanceV1866('${js(p.uid)}')">Ask ${esc(t.name)} out</button>` : ""}
      <div style="display:grid;gap:8px;margin-top:12px">${actsHtml}</div>
      <button class="re-btn" style="margin-top:10px;width:100%;border-radius:8px;padding:8px;border-color:rgba(220,70,70,.45);color:var(--bad)" onclick="reEvictTenantV1866('${js(p.uid)}')">Evict ${esc(t.name)}</button>
    </div></div>`;
  }
  function saleInputId(uid) { return "re-sale-ask-" + String(uid).replace(/[^a-zA-Z0-9_-]/g, "_"); }
  function renderSaleOverlay(re) {
    var p = byUid(re.saleUid);
    if (!p) return "";
    var q = saleQuote(p, p.askingPrice || null);
    var id = saleInputId(p.uid);
    return `<div class="re1863-overlay" onclick="if(event.target===this)reCloseOverlayV1863()"><div class="re1863-modal">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div><div class="re-kicker">Sale manager</div><div class="re-title">${esc(p.name)}</div><div style="font-size:12px;color:var(--muted);margin-top:3px">Set the asking price. Higher asks can work, but every step above market cuts the yearly buyer odds.</div></div><button class="re-btn" onclick="reCloseOverlayV1863()">Close</button></div>
      <div class="re-grid" style="grid-template-columns:repeat(2,minmax(0,1fr));margin-top:12px">
        <div class="re-stat"><span>Bought for</span><b>${compact(p.buyPrice)}</b></div>
        <div class="re-stat"><span>Current value</span><b>${compact(p.currentValue)}</b></div>
        <div class="re-stat"><span>Fair market sale</span><b>${compact(q.fair)}</b></div>
        <div class="re-stat"><span>Mortgage payoff</span><b class="${p.mortgageLeft ? "warn" : "good"}">${compact(p.mortgageLeft)}</b></div>
        <div class="re-stat"><span>Buyer odds / year</span><b class="${q.tone}">${Math.round(q.chance * 100)}%</b></div>
        <div class="re-stat"><span>Estimated net</span><b class="${q.net >= 0 ? "good" : "bad"}">${compact(q.net)}</b></div>
      </div>
      <div style="margin-top:12px"><div class="re-kicker">Asking price</div><input id="${id}" class="re-sale-input" type="number" min="1000" step="1000" value="${q.ask}"></div>
      <div class="re-actions">
        <button onclick="reSetSaleAskV1868('${js(p.uid)}',${q.fair})">Market ${compact(q.fair)}</button>
        <button onclick="reSetSaleAskV1868('${js(p.uid)}',${round(q.fair * 0.95)})">Fast -5%</button>
        <button onclick="reSetSaleAskV1868('${js(p.uid)}',${round(q.fair * 1.05)})">Ask +5%</button>
        <button onclick="reSetSaleAskV1868('${js(p.uid)}',${round(q.fair * 1.12)})">Ask +12%</button>
        <button onclick="reSetSaleAskV1868('${js(p.uid)}',${round(q.fair * 1.25)})">Moonshot +25%</button>
        <button class="re-on" onclick="reApplySaleAskV1868('${js(p.uid)}')">Apply custom</button>
      </div>
      <div style="font-size:12px;color:var(--muted);margin-top:8px">Status: <b class="${q.tone}">${esc(q.label)}</b>${p.forSale ? " &middot; listed at " + compact(q.ask) : " &middot; not listed yet"}. The yearly Real Estate tick can sell listed properties automatically.</div>
      <div class="re-actions">
        ${p.forSale ? `<button onclick="reDelistSaleV1863('${js(p.uid)}')">Delist</button>` : `<button onclick="reSetSaleAskV1868('${js(p.uid)}',${q.ask})">List at ask</button>`}
        <button onclick="reSellV1863('${js(p.uid)}')">Instant sale now</button>
      </div>
    </div></div>`;
  }
  function renderPortfolioCard(p, re) {
    p = normalizeProp(p);
    var ps = propertyStats(p);
    var band = conditionBand(p.condition);
    var last = p.lastYear || {};
    var mort = n(p.mortgageLeft);
    var cd = classOf(p);
    var tenant = p.tenant ? `${esc(tenantBadge(p.tenant))} · ${esc(p.tenant.name)} (${round(p.tenant.reliability)} reliability)` : (p.strategy === "rent" ? "Vacant / seeking tenant" : "No tenant");
    return `<div class="re-card" style="border-left:3px solid ${cd.color}">
      <div style="display:flex;justify-content:space-between;gap:8px">
        <div><div class="re-title">${esc(p.name)}</div><div style="font-size:12px;color:var(--muted);display:flex;align-items:center;gap:6px;flex-wrap:wrap"><span class="re-cls" style="border-color:${cd.color};color:${cd.color}">${esc(cd.label)}</span>${esc(p.neighborhood)} - ${esc(p.type)} - ${esc(p.strategy)}</div></div>
        <div style="text-align:right"><b style="color:var(--accent)">${compact(ps.equity)}</b><div style="font-size:11px;color:var(--muted)">equity</div></div>
      </div>
      <div class="re-grid" style="grid-template-columns:repeat(3,minmax(0,1fr));margin-top:8px">
        <div class="re-stat"><span>Value</span><b>${compact(ps.value)}</b></div>
        <div class="re-stat"><span>Mortgage</span><b class="${mort ? "warn" : "good"}">${compact(mort)}</b></div>
        <div class="re-stat"><span>Rent</span><b>${compact(p.askingRent)}/mo</b></div>
      </div>
      <div style="margin-top:8px;font-size:12px;color:var(--muted)">Tenant: ${tenant}${p.tenant && p.tenant.criminalV1865 && p.tenant.criminalV1865 !== "none" ? ` <span class="bad">(${esc((CRIMINAL[p.tenant.criminalV1865] || {}).label || "flagged")})</span>` : ""}. Last year net <span class="${n(last.cashFlow) >= 0 ? "good" : "bad"}">${compact(last.cashFlow || 0)}</span>.</div>
      <div class="re-bar"><i style="width:${clamp(p.condition, 0, 100)}%;background:${band.tone === "good" ? "var(--good)" : band.tone === "warn" ? "var(--accent)" : "var(--bad)"}"></i></div>
      <div class="re-tags">
        <span class="re-tag">Condition ${round(p.condition)}/100 ${esc(band.label)}</span>
        <span class="re-tag" style="border-color:${cd.color};color:${cd.color}">+${cd.prestige} prestige</span>
        ${p._tenantDamageV1865 ? `<span class="re-tag" style="border-color:var(--bad);color:var(--bad)">Tenant damage -${compact(p._tenantDamageV1865.valHit)}</span>` : ""}
        ${p.forSale ? `<span class="re-tag">Listed ${compact(p.askingPrice)}</span>` : ""}
        ${p.underRefurb ? `<span class="re-tag">Refurb ${p.underRefurb.yearsLeft} yr</span>` : ""}
        ${re.primaryUid === p.uid ? `<span class="re-tag" style="border-color:var(--good);color:var(--good)">Primary residence &middot; +${residenceLifestyle(p).happy} happy</span>` : ""}
      </div>
      ${flipPanel(p)}
      ${applicantsButton(p)}
      <div class="re-actions">
        <button class="${p.strategy === "rent" ? "re-on" : ""}" onclick="reSetStrategyV1863('${js(p.uid)}','rent')">${p.strategy === "rent" ? "Renting &#10003;" : "Rent out"}</button>
        <button class="${p.strategy === "live" ? "re-on" : ""}" onclick="reSetStrategyV1863('${js(p.uid)}','live')">${p.strategy === "live" ? "Living here &#10003;" : "Move in"}</button>
        <button class="${p.strategy === "flip" ? "re-on" : ""}" onclick="reSetStrategyV1863('${js(p.uid)}','flip')">${p.strategy === "flip" ? "Flipping &#10003;" : "Flip plan"}</button>
        ${p.tenant ? `<button onclick="reOpenTenantV1866('${js(p.uid)}')">${esc(tenantBadge(p.tenant))} · Visit ${esc(String(p.tenant.name || "tenant").split(" ")[0])}</button>` : ""}
        <button onclick="reAdjustRentV1863('${js(p.uid)}',0.05)">Rent +5%</button>
        <button onclick="reAdjustRentV1863('${js(p.uid)}',-0.05)">Rent -5%</button>
        <button onclick="reOpenRenovationV1863('${js(p.uid)}')">Renovate</button>
        <button class="${round(p.condition) >= 99 ? "" : "re-on"}" onclick="reFullRestoreV1868('${js(p.uid)}')" ${round(p.condition) >= 99 || cash() < fullRestoreCost(p) ? "disabled" : ""}>✨ Quick reno ${compact(fullRestoreCost(p))}</button>
        <button onclick="rePayMortgageV1863('${js(p.uid)}',50000)" ${mort ? "" : "disabled"}>Pay $50K</button>
        <button onclick="reRefinanceV1863('${js(p.uid)}')" ${mort ? "" : "disabled"}>Refinance</button>
        <button onclick="reOpenSaleV1868('${js(p.uid)}')">${p.forSale ? "Manage sale" : "Sale price"}</button>
      </div>
    </div>`;
  }

  function renderPortfolio(re) {
    if (!re.portfolio.length) return `<div class="re-band"><div class="re-title">No properties yet.</div><div style="font-size:12px;color:var(--muted);margin-top:4px">Use the market above to buy cash or mortgage, then choose whether to rent, flip, or live in the property.</div></div>`;
    var mgrOn = !!(re.managerV1868 && re.managerV1868.hired);
    var feeEst = round(portfolioStats().value * 0.003);
    var mgrBand = `<div class="re-band" style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-top:7px">
      <div><div class="re-kicker">Property manager</div><div style="font-size:12px;color:var(--muted)">${mgrOn ? "Active &middot; services condition, evicts non-payers, and keeps units leased. Fee ~" + compact(feeEst) + "/yr (0.3% of value)." : "Hire a manager to run the portfolio hands-off: condition upkeep, evict non-payers, auto-lease vacancies. ~0.3%/yr of value."}</div></div>
      <button class="re-btn ${mgrOn ? "re-on" : ""}" onclick="reHireManagerV1868()">${mgrOn ? "Manager hired &#10003; (dismiss)" : "Hire manager"}</button>
    </div>`;
    return `<div><div class="re-kicker">Portfolio cards</div>${mgrBand}<div class="re-list" style="margin-top:7px">${re.portfolio.map(function (p) { return renderPortfolioCard(p, re); }).join("")}</div></div>`;
  }

  function renderStrategyOverlay(re) {
    var p = byUid(re.pendingStrategyUid);
    if (!p) return "";
    return `<div class="re1863-overlay"><div class="re1863-modal">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div><div class="re-kicker">Purchase strategy</div><div class="re-title">What is the plan for ${esc(p.name)}?</div></div><button class="re-btn" onclick="reCloseOverlayV1863()">Close</button></div>
      <div style="display:grid;gap:8px;margin-top:12px">
        <button class="re-btn" style="border-radius:8px;text-align:left;padding:12px" onclick="reSetStrategyV1863('${js(p.uid)}','rent')"><b>Rent it out</b><br><span style="color:var(--muted)">Tenant income, vacancy risk, rent controls.</span></button>
        <button class="re-btn" style="border-radius:8px;text-align:left;padding:12px" onclick="reSetStrategyV1863('${js(p.uid)}','flip')"><b>Flip it</b><br><span style="color:var(--muted)">Renovate, watch condition, sell when equity is attractive.</span></button>
        <button class="re-btn" style="border-radius:8px;text-align:left;padding:12px" onclick="reSetStrategyV1863('${js(p.uid)}','live')"><b>Live in it</b><br><span style="color:var(--muted)">Primary residence. No tenant income, but clear lifestyle split.</span></button>
      </div>
    </div></div>`;
  }

  function renderRenovationOverlay(re) {
    var p = byUid(re.renovationUid);
    if (!p) return "";
    return `<div class="re1863-overlay"><div class="re1863-modal">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div><div class="re-kicker">Renovation menu</div><div class="re-title">Renovate ${esc(p.name)}</div><div style="font-size:12px;color:var(--muted);margin-top:3px">Condition ${round(p.condition)}/100. Improvements raise value, rent, and condition.</div></div><button class="re-btn" onclick="reCloseOverlayV1863()">Close</button></div>
      <div style="display:grid;gap:8px;margin-top:12px">
        <button class="re-btn" style="border-radius:8px;text-align:left;padding:12px;border-color:var(--good);background:rgba(76,175,130,.10)" onclick="reFullRestoreV1868('${js(p.uid)}')" ${round(p.condition) >= 99 || cash() < fullRestoreCost(p) ? "disabled" : ""}><b>✨ Perfect Refurbish - ${compact(fullRestoreCost(p))}</b><br><span style="color:var(--muted)">Instantly restore to 100/100 condition. Repeatable, unlike the one-time upgrades below. Costs 2-5% of value.</span></button>
        ${RENOVATIONS.map(function (r) {
          var done = p.renovations.indexOf(r.id) >= 0 || (p.underRefurb && p.underRefurb.id === r.id);
          var cost = renovateCost(p, r);
          return `<button class="re-btn" style="border-radius:8px;text-align:left;padding:12px" onclick="reRenovateV1863('${js(p.uid)}','${js(r.id)}')" ${done || cash() < cost ? "disabled" : ""}><b>${esc(r.name)} - ${compact(cost)}</b><br><span style="color:var(--muted)">${esc(r.desc)} +${Math.round(r.value * 100)}% value, +${Math.round(r.rent * 100)}% rent, +${r.cond} condition${r.time ? ", " + r.time + " year" : ", instant"}.</span></button>`;
        }).join("")}
      </div>
    </div></div>`;
  }

  function renderRealEstateCore() {
    var re = ensureRE();
    var stats = portfolioStats();
    recordFinance(stats);
    _nw = netWorth();
    var body = re.portfolio.length ? (renderPortfolio(re) + renderMarket(re)) : (renderMarket(re) + renderPortfolio(re));
    return `<section class="panel re1863">${styleBlock()}
      <div class="section-label">Real Estate</div>
      ${renderCreditPanel(re, stats)}
      ${renderSummary(re, stats)}
      ${body}
      ${renderStrategyOverlay(re)}
      ${renderRenovationOverlay(re)}
      ${renderApplicantsOverlay(re)}
      ${renderTenantOverlay(re)}
      ${renderSaleOverlay(re)}
    </section>`;
  }

  window.renderRealEstateV1863 = function () {
    return renderRealEstateCore();
  };

  window.renderLivingSituationV1863 = function () {
    var re = ensureRE();
    var primary = re.primaryUid ? byUid(re.primaryUid) : null;
    var home = null;
    try { home = (typeof homes !== "undefined" ? homes : []).find(function (h) { return h.id === S().home; }); } catch (e) {}
    var ls = primary ? residenceLifestyle(primary) : null;
    return `<section class="panel re1863">${styleBlock()}
      <div class="section-label">Living Situation</div>
      <div class="re-band" style="display:flex;justify-content:space-between;gap:12px;align-items:center">
        <div><div class="re-title">${primary ? "Living in " + esc(primary.name) : esc(home && home.name || "Housing")}</div>
        <div style="font-size:12px;color:var(--muted)">${primary ? "Owned " + esc(ls.label) + " residence &middot; <span class=\"good\">+" + ls.happy + " happiness" + (ls.looks ? ", +" + ls.looks + " looks" : "") + "</span> while you live here. No separate rent - mortgage &amp; value sit in Real Estate." : "Pick a home below, or move into a property you own for a real lifestyle boost (no rent)."}</div></div>
        <button class="re-btn" onclick="openHomeModalV1863()">Choose Real Estate</button>
      </div>
    </section>`;
  };

  window.openHomeModalV1863 = function () {
    closeHomeModalV1863();
    var s = S();
    var homeRows = "";
    try {
      homeRows = (typeof homes !== "undefined" ? homes : []).map(function (h) {
        var owned = s.home === h.id;
        var locked = h.minAge && age() < h.minAge;
        var afford = cash() >= n(h.price);
        return `<button class="re-btn" style="border-radius:8px;text-align:left;padding:10px" onclick="buyHomeReV1863('${js(h.id)}')" ${owned || locked || !afford ? "disabled" : ""}><b>${esc(h.name)} ${owned ? "(current)" : ""}</b><br><span style="color:var(--muted)">${compact(h.price || 0)} buy - ${compact(h.annualCost || 0)}/yr upkeep - ${esc(h.effect || "")}</span></button>`;
      }).join("");
    } catch (e) {}
    var ownedProps = ensureRE().portfolio.map(function (p) {
      return `<button class="re-btn" style="border-radius:8px;text-align:left;padding:10px" onclick="reSetStrategyV1863('${js(p.uid)}','live');closeHomeModalV1863()"><b>${esc(p.name)}</b><br><span style="color:var(--muted)">Move in as primary residence. Equity ${compact(propertyStats(p).equity)}.</span></button>`;
    }).join("");
    document.body.insertAdjacentHTML("beforeend", `<div id="re1863-home-overlay" class="re1863-overlay">${styleBlock()}<div class="re1863-modal"><div style="display:flex;justify-content:space-between;gap:10px"><div><div class="re-kicker">Living Situation</div><div class="re-title">Choose Real Estate</div></div><button class="re-btn" onclick="closeHomeModalV1863()">Close</button></div><div style="display:grid;gap:8px;margin-top:12px">${homeRows}${ownedProps ? `<div class="re-kicker" style="margin-top:8px">Owned real estate residences</div>${ownedProps}` : ""}</div></div></div>`);
  };
  window.closeHomeModalV1863 = function () { document.getElementById("re1863-home-overlay")?.remove(); };
  window.buyHomeReV1863 = function (id) {
    var h = null;
    try { h = (typeof homes !== "undefined" ? homes : []).find(function (x) { return x.id === id; }); } catch (e) {}
    if (!h) return toast("Residence not found.");
    if (h.minAge && age() < h.minAge) return toast("Too young for that residence.");
    if (cash() < n(h.price)) return toast("Need " + compact(h.price) + ".");
    if (S().home !== id && n(h.price) > 0) S().money = round(cash() - n(h.price));
    S().home = id;
    closeHomeModalV1863();
    saveRender();
    openHomeModalV1863();
  };

  // Backward-compatible v18.62 API surface.
  window.reEnsureV1862 = ensureRE;
  window.rePortfolioStatsV1862 = portfolioStats;
  window.reEquityV1862 = window.reEquityV1863;
  window.reValueV1862 = window.reValueV1863;
  window.reMortgageDebtV1862 = window.reMortgageDebtV1863;
  window.reMarketV1862 = window.reMarketV1863;
  window.reYearlyTickV1862 = window.reYearlyTickV1863;
  window.renderRealEstateV1862 = window.renderRealEstateV1863;
  window.renderLivingSituationV1862 = window.renderLivingSituationV1863;
  window.openHomeModalV1862 = window.openHomeModalV1863;
  window.closeReModalV1862 = window.closeHomeModalV1863;
  window.buyHomeReV1862 = window.buyHomeReV1863;
  window.reBuyV1862 = window.reBuyV1863;
  window.reSellV1862 = window.reSellV1863;
  window.reRenovateV1862 = function (uid) { return window.reRenovateV1863(uid, "cosmetic"); };
  window.reImproveV1862 = window.reRenovateV1863;
  window.rePayMortgageV1862 = window.rePayMortgageV1863;
  window.openImproveModalV1862 = window.reOpenRenovationV1863;
})();
