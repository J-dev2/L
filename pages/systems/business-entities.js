/* Business entities system: focused company command center, entity cash, and family enterprise trust controls. */
(function () {
  if (window.__ledgerBusinessEntitiesV1840Loaded) return;
  window.__ledgerBusinessEntitiesV1840Loaded = true;

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

  function businessMinAgeV1872(v) {
    var raw = n(v && v.minAge, 21);
    return raw > 21 ? 21 : Math.max(0, round(raw || 21));
  }

  function normalizeBusinessAgeGatesV1872(list) {
    if (!Array.isArray(list)) return list || [];
    list.forEach(function (v) {
      if (v && n(v.minAge, 0) > 21) v.minAge = 21;
    });
    return list;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, n(value)));
  }

  function pct(value) {
    return (n(value) * 100).toFixed(Math.abs(n(value)) >= .1 ? 1 : 0).replace(/\.0$/, "") + "%";
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

  function saveRender(hubId) {
    try { if (typeof save === "function") save(); } catch (e) {}
    try {
      if (typeof window.renderHubInPlaceV16 === "function") {
        // Stay on the hub the player is actually viewing (business trust controls also appear in the
        // Legal/Money hubs); only fall back to "business" when no hub overlay is open.
        var cur = hubId || "business", pos = null;
        try {
          var ov = document.querySelector(".hub-overlay");
          if (ov && ov.dataset && ov.dataset.hubId) cur = ov.dataset.hubId;
          var bd = ov && ov.querySelector(".v16-hub-body");
          if (bd) pos = { hubId: cur, top: bd.scrollTop, left: bd.scrollLeft };
        } catch (e0) {}
        return window.renderHubInPlaceV16(cur, pos);
      }
    } catch (e2) {}
    try { if (typeof render === "function") render(); } catch (e3) {}
  }

  function safeId(value) {
    return String(value == null ? "" : value).replace(/[^a-zA-Z0-9_-]/g, "_");
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

  function amountFromMode(mode, max, inputId) {
    max = Math.max(0, round(max));
    if (mode === "all" || mode === "max") return max;
    if (mode === "half") return Math.round(max * .5);
    if (mode === "quarter") return Math.round(max * .25);
    if (mode === "custom") return readAmount(inputId, max);
    return Math.max(0, Math.min(max, round(mode)));
  }

  var STRUCTURES = {
    soleprop: { name: "Sole Prop", cost: 0, minValue: 0, retain: 0, shield: 0, entityRate: 0, compliance: 0, desc: "Fast and simple. Little protection, most profit behaves personally." },
    partnership: { name: "Partnership", cost: 900, minValue: 5000, retain: .1, shield: .1, entityRate: .02, compliance: 650, desc: "Shared ownership with light company reserves and light protection." },
    llc: { name: "LLC", cost: 1200, minValue: 10000, retain: .65, shield: .35, entityRate: .07, compliance: 1200, desc: "Default serious business shell. Company cash can stay inside the firm." },
    scorp: { name: "S-Corp", cost: 3500, minValue: 50000, retain: .52, shield: .45, entityRate: .05, compliance: 3000, desc: "Owner salary plus distributions. Good for profitable services." },
    ccorp: { name: "C-Corp", cost: 8500, minValue: 150000, retain: .88, shield: .65, entityRate: .21, compliance: 8000, desc: "Company pays corporate tax first; owner is taxed on payouts." },
    holding: { name: "Holding Co.", cost: 25000, minValue: 1000000, retain: .94, shield: .8, entityRate: .14, compliance: 18000, desc: "Advanced holding structure for large assets, subsidiaries, and succession." }
  };

  var OPS = {
    manager: { name: "Operator", cost: 65000, note: "Less owner dependence and less failure pressure." },
    bookkeeper: { name: "Bookkeeper", cost: 18000, note: "Cleaner books and lower entity tax leakage." },
    sales: { name: "Sales Lead", cost: 42000, note: "Better growth and breakout chance." },
    counsel: { name: "Business Counsel", cost: 30000, note: "Contracts, lawsuits, and protection." },
    insurance: { name: "Insurance", cost: 12000, note: "Limits bad-year damage." }
  };

  var GOVERNANCE = {
    informal: { name: "Informal", cost: 0, harmony: 0, readiness: 0, desc: "Cheap, weak rules." },
    council: { name: "Family Council", cost: 12000, harmony: 10, readiness: 4, desc: "Yearly meetings and shared decisions." },
    constitution: { name: "Family Constitution", cost: 45000, harmony: 16, readiness: 8, desc: "Written voting, roles, dividends, and dispute rules." },
    advisory: { name: "Advisory Board", cost: 120000, harmony: 12, readiness: 18, desc: "Outside advisors professionalize the family enterprise." },
    familyoffice: { name: "Family Office", cost: 300000, harmony: 22, readiness: 22, desc: "Full structure for trusts, taxes, business, and succession." }
  };

  var MISSIONS = {
    dynasty: "Build a multi-generation business dynasty",
    education: "Fund education and career launches for heirs",
    income: "Create steady family income",
    charity: "Build a public legacy and charity arm",
    independence: "Protect heirs without making them dependent"
  };

  var DIVIDENDS = {
    none: { name: "Manual", rate: 0 },
    reinvest: { name: "Reinvest", rate: .01 },
    balanced: { name: "Balanced", rate: .04 },
    income: { name: "Family Income", rate: .08 }
  };

  var TRAINING = {
    shadow: { name: "Shadowing", cost: 5000, readiness: 6, continuity: 5 },
    school: { name: "Business School", cost: 25000, readiness: 14, continuity: 8 },
    executive: { name: "Executive Rotation", cost: 90000, readiness: 24, continuity: 18 },
    governance: { name: "Governance Bootcamp", cost: 35000, readiness: 10, continuity: 16 }
  };

  // Tangible per-business upgrades. Costs scale off the venture's own startup cost so a lawncare
  // stand and a nightclub each have a proportionate upgrade path instead of one flat price list.
  var ASSET_SLOTS = {
    location: {
      icon: "🏪",
      label: "Location",
      tiers: [
        { name: "No Storefront", desc: "Working out of nowhere in particular.", incomeBonus: 0, riskCut: 0 },
        { name: "Leased Spot", desc: "A real address customers can find.", costMult: .15, costMin: 300, incomeBonus: .04, riskCut: 0 },
        { name: "Owned Location", desc: "No landlord, more reputation, steadier traffic.", costMult: .45, costMin: 1500, incomeBonus: .09, riskCut: .02 },
        { name: "Flagship Location", desc: "A destination spot people plan trips around.", costMult: 1.1, costMin: 5000, incomeBonus: .15, riskCut: .04 }
      ]
    },
    equipment: {
      icon: "🛠️",
      label: "Equipment",
      tiers: [
        { name: "Basic Tools", desc: "Whatever was cheapest to start with.", incomeBonus: 0, repBonus: 0 },
        { name: "Pro Equipment", desc: "Faster, more reliable output.", costMult: .12, costMin: 250, incomeBonus: .05, repBonus: 0 },
        { name: "Automated Systems", desc: "Less owner time per dollar earned.", costMult: .35, costMin: 1200, incomeBonus: .10, repBonus: .03 }
      ]
    },
    staff: {
      icon: "👥",
      label: "Staff",
      tiers: [
        { name: "Solo", desc: "Just you.", incomeBonus: 0, riskCut: 0 },
        { name: "Small Crew", desc: "A couple of reliable hires.", costMult: .20, costMin: 400, incomeBonus: .06, riskCut: .03 },
        { name: "Full Team", desc: "Real coverage, real consistency.", costMult: .55, costMin: 2000, incomeBonus: .12, riskCut: .06 }
      ]
    }
  };

  // v18.36: cosmetic sector overlay on asset tier names. Same slots, same math —
  // a nightclub's top Equipment reads "State-of-the-Art Sound System" instead of
  // "Automated Systems," a SaaS company's Staff reads "Engineering Team." Indexed
  // [sectorId][slotKey][tierIndex]; any gap falls back to the generic tier name.
  var SECTOR_TIER_NAMES = {
    food:       { location: ["Home Kitchen", "Leased Storefront", "Owned Restaurant", "Flagship Restaurant"], equipment: ["Hand-Me-Down Gear", "Commercial Kitchen", "Pro Kitchen Line"], staff: ["Just You", "Line Cooks", "Full Brigade"] },
    nightlife:  { location: ["Pop-Up Nights", "Leased Venue", "Owned Club", "Destination Venue"], equipment: ["Borrowed Speakers", "Pro Sound Rig", "State-of-the-Art Sound System"], staff: ["Solo Promoter", "Door & Bar Crew", "Full Floor Team"] },
    retail:     { location: ["Online Only", "Mall Kiosk", "Owned Storefront", "Flagship Store"], equipment: ["Basic POS", "Inventory System", "Automated Fulfillment"], staff: ["Solo", "Sales Floor", "Full Retail Team"] },
    trades:     { location: ["Out of the Truck", "Leased Yard", "Owned Depot", "Regional Depot"], equipment: ["Basic Tools", "Pro Equipment", "Heavy Machinery"], staff: ["Solo", "Small Crew", "Full Crew"] },
    media:      { location: ["Bedroom Setup", "Leased Office", "Owned Studio", "Flagship Studio"], equipment: ["Starter Kit", "Pro Gear", "Full Production Suite"], staff: ["Solo Creator", "Small Team", "Full Production Team"] },
    tech:       { location: ["Garage", "Co-Working Desk", "Leased Office", "HQ Campus"], equipment: ["Laptop & Coffee", "Cloud Stack", "Automated Infrastructure"], staff: ["Solo Founder", "Small Team", "Engineering Team"] },
    finance:    { location: ["Home Office", "Leased Suite", "Owned Office", "Tower Floor"], equipment: ["Spreadsheets", "Trading Terminal", "Quant Platform"], staff: ["Solo", "Small Desk", "Full Desk"] },
    realestate: { location: ["Phone & Laptop", "Leased Office", "Owned Office", "Flagship Office"], equipment: ["Basic Tools", "Property Software", "Full Asset Platform"], staff: ["Solo", "Small Team", "Full Brokerage"] },
    health:     { location: ["Rented Room", "Leased Suite", "Owned Clinic", "Flagship Clinic"], equipment: ["Basic Equipment", "Clinical Gear", "Advanced Diagnostics"], staff: ["Solo Practitioner", "Small Practice", "Full Medical Team"] },
    logistics:  { location: ["One Van", "Leased Yard", "Owned Depot", "Regional Hub"], equipment: ["Basic Fleet", "Tracked Fleet", "Automated Fleet"], staff: ["Solo Driver", "Small Crew", "Full Operations Team"] }
  };

  function sectorIdForBusiness(b) {
    if (!b) return null;
    try {
      var nm = (window.SECTOR_OF && window.SECTOR_OF[b.id]) || b.sector || b.category;
      if (window.LEDGER_SECTORS && nm) {
        var s = window.LEDGER_SECTORS.find(function (x) { return x.name === nm || x.id === nm; });
        if (s) return s.id;
      }
    } catch (e) {}
    return null;
  }
  window.sectorIdForBusinessV1851 = sectorIdForBusiness;

  var SECTOR_RISK_LINES = {
    food: { label: "Health inspection risk", up: "Low ratings raise closure and inspection pressure.", down: "Strong ratings reduce health inspection pressure." },
    nightlife: { label: "Licensing / noise risk", up: "Permits, noise, door incidents, and late nights raise pressure.", down: "Clean operations make licensing and noise problems less likely." },
    retail: { label: "Inventory risk", up: "Thin or bloated inventory creates shrink, missed sales, and cash drag.", down: "Balanced inventory keeps retail pressure lower." },
    trades: { label: "Licensing / worksite risk", up: "Idle crews or overloaded jobs raise quality and compliance pressure.", down: "A healthy backlog keeps crews steady and lower risk." },
    media: { label: "Audience volatility risk", up: "Small or slipping audiences make revenue fragile.", down: "A large audience gives the business a stronger cushion." },
    tech: { label: "IP / security risk", up: "Weak recurring revenue leaves more room for churn, security, and product pressure.", down: "Sticky recurring revenue lowers product and security pressure." },
    finance: { label: "Regulatory risk", up: "A thin book or bad performance draws compliance and client pressure.", down: "A healthier book lowers regulatory and client pressure." },
    realestate: { label: "Vacancy / permitting risk", up: "Vacancies and property churn raise carrying-cost pressure.", down: "Strong occupancy makes the property base safer." },
    health: { label: "Clinical / staffing risk", up: "Empty rooms or overload create quality, staffing, and regulatory pressure.", down: "A healthy patient load keeps clinical pressure controlled." },
    logistics: { label: "Capacity / safety risk", up: "Idle or overloaded capacity raises contract and safety pressure.", down: "Good capacity use lowers contract and safety pressure." }
  };

  var LOCATION_ARCHETYPES_V1857 = {
    food: {
      label: "Food network", verb: "Service push", compete: "Launch a chef collab",
      acquire: "Acquire restaurant rival", locations: ["Restaurant", "Ghost kitchen", "Catering hub", "Taproom"]
    },
    nightlife: {
      label: "Nightlife circuit", verb: "Crowd war", compete: "Book a rival-crushing headliner",
      acquire: "Acquire venue rival", locations: ["Bar", "Lounge", "Club room", "Live venue", "Event hall"]
    },
    retail: {
      label: "Retail footprint", verb: "Promo fight", compete: "Run a market-share promo",
      acquire: "Acquire retail rival", locations: ["Storefront", "Outlet", "Fulfillment room", "Flagship shop"]
    },
    trades: {
      label: "Service territory", verb: "Bid war", compete: "Outbid the local competitor",
      acquire: "Acquire service rival", locations: ["Service yard", "Truck route", "Depot", "Regional crew"]
    },
    media: {
      label: "Entertainment slate", verb: "Talent grab", compete: "Sign talent away from a rival",
      acquire: "Acquire studio rival", locations: ["Studio", "Production stage", "Creator house", "Label office"]
    },
    tech: {
      label: "Product network", verb: "Feature race", compete: "Ship a competitor-killer feature",
      acquire: "Acquire product rival", locations: ["Product pod", "Support office", "Data unit", "Cloud unit"]
    },
    finance: {
      label: "Client book", verb: "Mandate chase", compete: "Win a whale client",
      acquire: "Acquire advisory rival", locations: ["Advisory office", "Fund desk", "Client office"]
    },
    realestate: {
      label: "Property cluster", verb: "Territory grab", compete: "Win a leasing mandate",
      acquire: "Acquire property rival", locations: ["Leasing office", "Property cluster", "Development site"]
    },
    health: {
      label: "Care network", verb: "Referral race", compete: "Win a referral contract",
      acquire: "Acquire clinic rival", locations: ["Clinic", "Treatment room", "Patient center"]
    },
    logistics: {
      label: "Route network", verb: "Contract war", compete: "Undercut a freight contract",
      acquire: "Acquire logistics rival", locations: ["Warehouse", "Fleet yard", "Distribution hub", "Trade lane"]
    },
    generic: {
      label: "Location network", verb: "Market push", compete: "Compete for market share",
      acquire: "Acquire rival", locations: ["Branch", "Office", "Regional site", "Flagship site"]
    }
  };

  function randInt(min, max) {
    min = round(min); max = round(max);
    try { if (typeof window.rand === "function") return window.rand(min, max); } catch (e) {}
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  function chanceLocal(prob) {
    try { if (typeof window.chance === "function") return window.chance(prob); } catch (e) {}
    return Math.random() < prob;
  }

  function locationProfileV1857(b) {
    return LOCATION_ARCHETYPES_V1857[sectorIdForBusiness(b)] || LOCATION_ARCHETYPES_V1857.generic;
  }

  function rivalNameV1857(b) {
    if (b && b.rivalNameV1852) return b.rivalNameV1852;
    var sid = sectorIdForBusiness(b) || "generic";
    var pool = {
      food: ["Sunrise Diner", "The Copper Fork", "Two Birds Cafe"],
      nightlife: ["Velvet Room", "Pulse", "After Hours"],
      retail: ["MarketMile", "Trendline", "Goods & Co."],
      trades: ["Apex Services", "Reliable & Sons", "TrueBuild"],
      media: ["Signal Studios", "Echo House", "Frame 9"],
      tech: ["Cloudpeak", "Forge Labs", "Brightloop"],
      finance: ["Sterling Partners", "Oakline", "Meridian Advisory"],
      realestate: ["Keystone Holdings", "Summit Property", "Lakeshore Realty"],
      health: ["Cedar Health", "NovaCare", "Wellspring"],
      logistics: ["SwiftHaul", "Velocity Freight", "Ironline Logistics"],
      generic: ["Apex Co.", "Northgate", "Vantage Group"]
    }[sid] || ["Apex Co.", "Northgate", "Vantage Group"];
    b.rivalNameV1852 = pool[randInt(0, pool.length - 1)];
    return b.rivalNameV1852;
  }

  function locationOpenCountV1857(b) {
    var loc = b && b.locationsV1857;
    var sites = loc && Array.isArray(loc.sites) ? loc.sites : [];
    return sites.filter(function (site) { return site && site.status !== "closed"; }).length;
  }

  function nextLocationArchetypeV1857(b) {
    var profile = locationProfileV1857(b);
    var list = profile.locations || LOCATION_ARCHETYPES_V1857.generic.locations;
    var count = Math.max(0, locationOpenCountV1857(b) - 1);
    return list[count % list.length];
  }

  function makeLocationSiteV1857(b, opts) {
    opts = opts || {};
    var profile = locationProfileV1857(b);
    var archetype = opts.archetype || nextLocationArchetypeV1857(b);
    var model = opts.model || "owned";
    var id = opts.id || ("loc_" + (Date.now ? Date.now() : randInt(10000, 99999)) + "_" + randInt(100, 999));
    var title = opts.name || (model === "franchise" ? archetype + " partner" : archetype);
    return {
      id: String(id),
      name: title,
      model: model,
      archetype: archetype,
      tier: clamp(opts.tier == null ? 1 : opts.tier, 1, 3),
      quality: clamp(opts.quality == null ? 58 : opts.quality, 0, 100),
      staff: clamp(opts.staff == null ? 55 : opts.staff, 0, 100),
      demand: clamp(opts.demand == null ? 55 : opts.demand, 0, 100),
      status: opts.status || "open",
      years: Math.max(0, round(opts.years || 0)),
      openedAge: opts.openedAge == null ? round(n(stateNow().age)) : round(opts.openedAge),
      lastIncome: round(opts.lastIncome || 0),
      note: opts.note || profile.label
    };
  }

  function ensureLocationsV1857(b) {
    if (!b || typeof b !== "object") return null;
    var loc = b.locationsV1857;
    var legacyCount = Math.max(1, round(n(b.locations, 1)));
    if (!loc || typeof loc !== "object" || !Array.isArray(loc.sites)) {
      loc = b.locationsV1857 = { version: 1857, nextId: 1, sites: [], history: [] };
      var hqTier = clamp(Math.max(1, n(b.assets && b.assets.location, 0) || 1), 1, 3);
      loc.sites.push(makeLocationSiteV1857(b, {
        id: "hq",
        name: "Headquarters",
        archetype: locationProfileV1857(b).locations[0],
        tier: hqTier,
        quality: clamp(55 + n(b.reputation) * .25 + hqTier * 5, 35, 92),
        staff: clamp(50 + n(b.assets && b.assets.staff) * 12, 35, 88),
        demand: clamp(50 + n(b.reputation) * .25, 35, 90),
        years: n(b.years)
      }));
      for (var i = 1; i < legacyCount; i++) {
        loc.sites.push(makeLocationSiteV1857(b, {
          id: "legacy_" + i,
          name: nextLocationArchetypeV1857(b),
          archetype: nextLocationArchetypeV1857(b),
          tier: 1,
          quality: 52,
          staff: 50,
          demand: 52,
          years: Math.max(0, n(b.years) - i)
        }));
      }
    }
    loc.version = 1857;
    loc.nextId = Math.max(1, round(loc.nextId));
    if (!Array.isArray(loc.history)) loc.history = [];
    loc.sites = loc.sites.filter(Boolean).map(function (site, index) {
      site.id = site.id || (index === 0 ? "hq" : "loc_" + (++loc.nextId));
      site.name = String(site.name || site.archetype || (index === 0 ? "Headquarters" : "Location")).slice(0, 48);
      site.model = site.model === "franchise" ? "franchise" : "owned";
      site.archetype = site.archetype || nextLocationArchetypeV1857(b);
      site.tier = clamp(site.tier == null ? 1 : site.tier, 1, 3);
      site.quality = clamp(site.quality == null ? 55 : site.quality, 0, 100);
      site.staff = clamp(site.staff == null ? 55 : site.staff, 0, 100);
      site.demand = clamp(site.demand == null ? 55 : site.demand, 0, 100);
      site.status = site.status === "closed" ? "closed" : "open";
      site.years = Math.max(0, round(site.years));
      site.openedAge = round(site.openedAge == null ? n(stateNow().age) : site.openedAge);
      site.lastIncome = round(site.lastIncome);
      return site;
    });
    if (!loc.sites.length) loc.sites.push(makeLocationSiteV1857(b, { id: "hq", name: "Headquarters" }));
    var market = b.marketV1857;
    if (!market || typeof market !== "object") {
      var share = clamp(8 + n(b.reputation) * .22 + locationOpenCountV1857(b) * 2, 4, 42);
      market = b.marketV1857 = { version: 1857, share: round(share), rivalShare: round(clamp(32 - share * .25, 12, 45)), rivalStrength: 55, lastCompeteAge: -1, lastAcquireAge: -1, acquiredRivals: 0 };
    }
    market.version = 1857;
    market.share = clamp(market.share == null ? 12 : market.share, 3, 85);
    market.rivalShare = clamp(market.rivalShare == null ? 30 : market.rivalShare, 5, 70);
    market.rivalStrength = clamp(market.rivalStrength == null ? 55 : market.rivalStrength, 10, 95);
    market.lastCompeteAge = round(market.lastCompeteAge == null ? -1 : market.lastCompeteAge);
    market.lastAcquireAge = round(market.lastAcquireAge == null ? -1 : market.lastAcquireAge);
    market.acquiredRivals = Math.max(0, round(market.acquiredRivals));
    b.locations = locationOpenCountV1857(b);
    return loc;
  }
  window.businessLocationsV1857 = ensureLocationsV1857;

  function locationSummaryV1857(b) {
    ensureLocationsV1857(b);
    var loc = b.locationsV1857 || { sites: [] };
    var sites = (loc.sites || []).filter(function (site) { return site && site.status !== "closed"; });
    var extra = sites.filter(function (site) { return site.id !== "hq"; });
    var avg = function (key) {
      if (!sites.length) return 0;
      return round(sites.reduce(function (sum, site) { return sum + n(site[key]); }, 0) / sites.length);
    };
    var owned = sites.filter(function (site) { return site.model !== "franchise"; }).length;
    var franchise = sites.filter(function (site) { return site.model === "franchise"; }).length;
    var market = b.marketV1857 || {};
    var staffCapacity = 1 + n(b.assets && b.assets.staff) * 1.25 + (b.ops && b.ops.manager ? 1.2 : 0) + (b.ops && b.ops.bookkeeper ? .5 : 0);
    var sprawl = Math.max(0, (owned + franchise * .45) - staffCapacity);
    var franchiseCut = franchise ? Math.min(.025, franchise * .006) : 0;
    var sprawlRisk = Math.min(.09, sprawl * .018);
    var rivalPressure = clamp((n(market.rivalShare) - n(market.share)) / 800 + n(market.rivalStrength) / 3000, 0, .08);
    return {
      openSites: sites.length,
      extraSites: extra.length,
      ownedSites: owned,
      franchiseSites: franchise,
      avgQuality: avg("quality"),
      avgStaff: avg("staff"),
      avgDemand: avg("demand"),
      lastIncome: round((b.lastLocationEffectsV1857 || {}).income || 0),
      sprawlRisk: sprawlRisk,
      franchiseCut: franchiseCut,
      rivalPressure: rivalPressure,
      share: n(market.share),
      rivalShare: n(market.rivalShare),
      rivalStrength: n(market.rivalStrength),
      rivalName: rivalNameV1857(b)
    };
  }
  window.businessLocationSummaryV1857 = locationSummaryV1857;

  function sectorRiskEffect(b) {
    var sid = sectorIdForBusiness(b);
    var effect = n(b && b.sectorRiskCutV1851);
    try {
      var mech = window.SECTOR_MECHANICS && (window.SECTOR_MECHANICS[(window.SECTOR_OF && b && b.id && window.SECTOR_OF[b.id]) || b.category] || null);
      if (!mech && window.LEDGER_SECTORS && sid) {
        var def = window.LEDGER_SECTORS.find(function (x) { return x.id === sid; });
        mech = def && window.SECTOR_MECHANICS && window.SECTOR_MECHANICS[def.name];
      }
      if (mech && typeof mech.risk === "function") {
        var meter = b && b.sectorMeterV1851 == null ? mech.init : b.sectorMeterV1851;
        effect = mech.risk(clamp(n(meter), 0, 100)) || 0;
      }
    } catch (e) {}
    return { id: sid, effect: effect, meta: SECTOR_RISK_LINES[sid] || null };
  }

  function portfolioEffectsFor(b) {
    var list = businesses().filter(function (item) { return item && !item._migratedToBizV1861; });
    var sid = sectorIdForBusiness(b);
    var sectorCounts = {};
    list.forEach(function (item) {
      var id = sectorIdForBusiness(item) || String(item.category || "Business");
      sectorCounts[id] = (sectorCounts[id] || 0) + 1;
    });
    var same = sid ? n(sectorCounts[sid]) : 0;
    var sectors = Object.keys(sectorCounts).filter(function (key) { return sectorCounts[key] > 0; }).length;
    var incomeBonus = same >= 2 ? Math.min(.09, .03 * (same - 1)) : 0;
    var repBonus = same >= 2 ? Math.min(3, same - 1) : 0;
    var riskCut = sectors >= 3 ? Math.min(.05, .01 * (sectors - 2)) : 0;
    return {
      sameSectorCount: same,
      sectorCount: sectors,
      incomeBonus: incomeBonus,
      repBonus: repBonus,
      riskCut: riskCut,
      summary: same >= 2 ? "Franchise +" + Math.round(incomeBonus * 100) + "% income, +" + repBonus + " rep/yr" : sectors >= 3 ? "Diversified -" + Math.round(riskCut * 100) + "% risk" : "No portfolio bonus yet"
    };
  }
  window.businessPortfolioEffectsV1856 = portfolioEffectsFor;

  // Returns a sector-flavored tier name if one exists, else the generic name.
  function tierLabel(b, slotKey, tierIndex, fallback) {
    try {
      var sid = sectorIdForBusiness(b);
      var names = sid && SECTOR_TIER_NAMES[sid] && SECTOR_TIER_NAMES[sid][slotKey];
      if (names && names[tierIndex]) return names[tierIndex];
    } catch (e) {}
    return fallback;
  }

  // One unique, flavorful action per venture type. costMult/costMin scale off that venture's own startup
  // cost (same idiom as ASSET_SLOTS), rep/valueMult apply immediately, payoutMult pays a randomized cash bonus.
  var VENTURE_ACTIONS = {
    lawncare: { label: "Door-to-Door Flyers", icon: "📋", costMult: .3, costMin: 50, rep: 4, result: "Flyered the neighborhood for new lawns." },
    resale: { label: "Flash Sale", icon: "🏷️", costMult: .2, costMin: 50, rep: 3, payoutMult: .08, result: "Ran a flash sale and moved old inventory." },
    content: { label: "Collab Video", icon: "🎬", costMult: .5, costMin: 50, rep: 6, result: "Collabed with another creator for a reach boost." },
    tutoringbiz: { label: "Referral Bonus", icon: "🌟", costMult: .4, costMin: 30, rep: 5, result: "Offered a referral bonus and picked up new students." },
    contracting: { label: "Bid a Big Job", icon: "🏗️", costMult: .15, costMin: 500, rep: 5, payoutMult: .05, result: "Won a bigger contracting job." },
    startup: { label: "Pitch Investors", icon: "💼", costMult: .1, costMin: 1000, rep: 8, valueMult: 1.06, result: "Pitched investors and raised the company's profile." },
    foodtruck: { label: "Food Festival", icon: "🎪", costMult: .15, costMin: 800, rep: 6, payoutMult: .06, result: "Booked a slot at a local food festival." },
    eventsecurity: { label: "Land a Venue Contract", icon: "🤝", costMult: .1, costMin: 1000, rep: 7, valueMult: 1.04, result: "Signed an ongoing contract with a venue." },
    printshop: { label: "Local Business Expo", icon: "🖨️", costMult: .12, costMin: 600, rep: 5, payoutMult: .05, result: "Set up a booth at the business expo." },
    sportsbar: { label: "Playoff Watch Party", icon: "🏈", costMult: .1, costMin: 1500, rep: 8, payoutMult: .07, result: "Hosted a packed playoff watch party." },
    nightclub: { label: "Book a Headliner DJ", icon: "🎧", costMult: .08, costMin: 3000, rep: 10, payoutMult: .08, result: "Booked a headliner DJ for a sellout night." },
    mediaagency: { label: "Land a Brand Deal", icon: "📰", costMult: .1, costMin: 2000, rep: 8, valueMult: 1.05, result: "Landed a major brand deal." },
    aircraftcharter: { label: "Court a Corporate Client", icon: "✈️", costMult: .05, costMin: 5000, rep: 6, valueMult: 1.05, result: "Courted a corporate client for repeat charters." },
    aircraftservices: { label: "Win a Fleet Contract", icon: "🛠️", costMult: .04, costMin: 8000, rep: 7, valueMult: 1.06, result: "Won a maintenance contract for a small fleet." },
    cornerbar: { label: "Trivia Night Launch", icon: "🍻", costMult: .1, costMin: 600, rep: 5, payoutMult: .05, result: "Launched a weekly trivia night. Regulars love it." },
    carwashchain: { label: "Loyalty Card Push", icon: "🚗", costMult: .08, costMin: 1000, rep: 6, payoutMult: .05, result: "Rolled out a loyalty card program." },
    vendingroute: { label: "Add New Machines", icon: "🥤", costMult: .25, costMin: 500, rep: 4, valueMult: 1.05, result: "Added new machines to the route." },
    logisticsfleet: { label: "Win a Retail Contract", icon: "🚐", costMult: .06, costMin: 4000, rep: 7, valueMult: 1.05, result: "Won a steady retail delivery contract." },
    recordlabel: { label: "Sign a Rising Artist", icon: "🎵", costMult: .08, costMin: 2000, rep: 8, valueMult: 1.07, result: "Signed a rising artist with buzz." },
    realestateholdco: { label: "Close a Flip", icon: "🏘️", costMult: .04, costMin: 5000, rep: 6, payoutMult: .06, result: "Closed a profitable flip." },
    aircraftleasing: { label: "Lease to an Airline", icon: "🛩️", costMult: .02, costMin: 20000, rep: 6, valueMult: 1.05, result: "Signed a long-term lease with a regional airline." },
    saascompany: { label: "Ship a Major Feature", icon: "💻", costMult: .06, costMin: 5000, rep: 8, valueMult: 1.08, result: "Shipped a major feature. Signups spiked." },
    consultingfirm: { label: "Land a Fortune 500 Client", icon: "📊", costMult: .08, costMin: 3000, rep: 9, valueMult: 1.06, result: "Landed a marquee enterprise client." },
    privateequity: { label: "Close a Buyout", icon: "💰", costMult: .03, costMin: 15000, rep: 7, valueMult: 1.07, result: "Closed a leveraged buyout." },
    luxuryrealty: { label: "Sell a Trophy Property", icon: "🏰", costMult: .03, costMin: 8000, rep: 8, payoutMult: .06, result: "Sold a trophy property to a high-net-worth buyer." },
    talentagency: { label: "Sign a Breakout Star", icon: "🌟", costMult: .06, costMin: 4000, rep: 9, valueMult: 1.07, result: "Signed a breakout star client." },
    ecommercebrand: { label: "Go Viral on Social", icon: "📦", costMult: .07, costMin: 3000, rep: 7, payoutMult: .07, result: "A product went viral overnight." },
    medicalpractice: { label: "Add a Specialist", icon: "🩺", costMult: .05, costMin: 6000, rep: 6, valueMult: 1.05, result: "Brought on a specialist, expanding services." },
    filmstudio: { label: "Land a Distribution Deal", icon: "🎥", costMult: .03, costMin: 10000, rep: 9, valueMult: 1.08, result: "Landed a major distribution deal." },
    hedgefund: { label: "Beat the Market", icon: "📈", costMult: .02, costMin: 20000, rep: 8, payoutMult: .08, result: "Posted returns that beat the market." },
    hospitalitygroup: { label: "Host a Gala", icon: "🥂", costMult: .04, costMin: 8000, rep: 8, payoutMult: .06, result: "Hosted a gala that put the property on the map." }
  };

  // v18.36: extra result lines so running the same signature action year after
  // year doesn't print identical log text. Merged onto VENTURE_ACTIONS as a
  // `results` array; pickActionResult() rotates through them.
  var ACTION_RESULT_VARIANTS = {
    lawncare: ["Flyered the neighborhood for new lawns.", "Knocked doors all weekend and booked three new yards.", "Word of mouth from a tidy cul-de-sac brought in calls."],
    resale: ["Ran a flash sale and moved old inventory.", "A weekend markdown cleared the back room.", "Bundled slow movers and they finally sold."],
    content: ["Collabed with another creator for a reach boost.", "A cross-post sent the numbers up overnight.", "A guest feature pulled in a new audience."],
    contracting: ["Won a bigger contracting job.", "Underbid a rival on a commercial build and won.", "A referral landed a steady multi-phase project."],
    startup: ["Pitched investors and raised the company's profile.", "A demo day pitch got people talking.", "An angel intro turned into a warm term sheet."],
    foodtruck: ["Booked a slot at a local food festival.", "Parked outside a sold-out concert and crushed it.", "A festival feature put a line at the window."],
    nightclub: ["Booked a headliner DJ for a sellout night.", "A big-name guest set packed the floor.", "The DJ drew a line around the block."],
    saascompany: ["Shipped a major feature. Signups spiked.", "A launch hit the front page of a tech forum.", "An integration unlocked a wave of new accounts."],
    consultingfirm: ["Landed a marquee enterprise client.", "Won a competitive RFP against the big firms.", "A Fortune 500 logo signed a retainer."],
    ecommercebrand: ["A product went viral overnight.", "An influencer unboxing sold out the SKU.", "A trend caught and orders flooded in."],
    nightclubgroup: ["Hosted a packed playoff watch party.", "A themed night became the talk of the city."],
    hedgefund: ["Posted returns that beat the market.", "A contrarian bet paid off big this quarter.", "Outperformed the index and LPs took notice."],
    foodtruckfleet: ["Booked the whole fleet for a festival weekend.", "Catered a corporate campus all week."]
  };
  Object.keys(ACTION_RESULT_VARIANTS).forEach(function (id) {
    if (VENTURE_ACTIONS[id]) VENTURE_ACTIONS[id].results = ACTION_RESULT_VARIANTS[id];
  });
  function pickActionResult(action) {
    if (action && Array.isArray(action.results) && action.results.length) {
      return action.results[Math.floor(Math.random() * action.results.length)];
    }
    return (action && action.result) || "Made a move to grow the business.";
  }

  var FOUNDER_PATHS = {
    undecided: {
      name: "Undecided Founder",
      tag: "Explore first",
      desc: "Keep the door open while you test companies, jobs, investing, and family plans.",
      bonus: "No pressure bonus yet."
    },
    builder: {
      name: "Company Builder",
      tag: "Start from scratch",
      desc: "Create one serious operating company, train a team, and grow it into your main story.",
      bonus: "Better launch focus and stronger operations progress."
    },
    acquirer: {
      name: "Acquisition Operator",
      tag: "Buy and improve",
      desc: "Use savings, loans, and deal skill to buy existing companies and professionalize them.",
      bonus: "Acquisition requirements and entity planning matter more."
    },
    investor: {
      name: "Founder Investor",
      tag: "Capital allocator",
      desc: "Build wealth through personal firm, outside managers, and minority business stakes.",
      bonus: "Pairs with Investments and family trust planning."
    },
    family: {
      name: "Family Enterprise",
      tag: "Dynasty path",
      desc: "Turn companies into trust-owned assets with successor training and governance.",
      bonus: "Trust, Legal, and heir readiness become the long game."
    }
  };

  function businessCatalog() {
    try { if (typeof entrepreneurshipCatalog !== "undefined" && Array.isArray(entrepreneurshipCatalog)) return normalizeBusinessAgeGatesV1872(entrepreneurshipCatalog); } catch (e) {}
    try { if (Array.isArray(window.entrepreneurshipCatalog)) return normalizeBusinessAgeGatesV1872(window.entrepreneurshipCatalog); } catch (e2) {}
    return [];
  }

  function acquisitionCatalog() {
    try { if (typeof V6_EXTRA_COMPANIES !== "undefined" && Array.isArray(V6_EXTRA_COMPANIES)) return normalizeBusinessAgeGatesV1872(V6_EXTRA_COMPANIES); } catch (e) {}
    try { if (Array.isArray(window.V6_EXTRA_COMPANIES)) return normalizeBusinessAgeGatesV1872(window.V6_EXTRA_COMPANIES); } catch (e2) {}
    return [];
  }

  function catalogFor(id, business) {
    var lookup = String((business && business.baseId) || id);
    return businessCatalog().concat(acquisitionCatalog()).find(function (v) { return String(v.id) === lookup || String(v.id) === String(id); }) || {};
  }

  function ensureBusiness(b) {
    if (!b || typeof b !== "object") return b;
    var v = catalogFor(b.id, b);
    if (!b.id) b.id = "business_" + Math.random().toString(36).slice(2);
    if (!b.name) b.name = v.name || String(b.id);
    if (!b.category) b.category = v.category || "Business";
    if (b.value == null) b.value = 0;
    if (b.years == null) b.years = 0;
    if (b.reputation == null) b.reputation = 10;
    if (b.lastIncome == null) b.lastIncome = 0;
    if (!b.stage) b.stage = "startup";
    if (!b.entityType) b.entityType = n(b.value) >= 150000 ? "llc" : "soleprop";
    if (b.retainedEarnings == null) b.retainedEarnings = Math.max(0, n(b.businessCash));
    if (b.entityTaxDebt == null) b.entityTaxDebt = 0;
    if (b.complianceDue == null) b.complianceDue = 0;
    if (!b.ops || typeof b.ops !== "object") b.ops = {};
    if (!Array.isArray(b.historyV1830)) b.historyV1830 = [];
    if (!b.familyV1833 || typeof b.familyV1833 !== "object") b.familyV1833 = {};
    var fam = b.familyV1833;
    fam.trustPercent = clamp(fam.trustPercent == null ? 0 : fam.trustPercent, 0, 1);
    if (!fam.successor) fam.successor = "none";
    fam.readiness = clamp(fam.readiness == null ? 0 : fam.readiness, 0, 100);
    fam.continuity = clamp(fam.continuity == null ? 0 : fam.continuity, 0, 100);
    fam.board = !!fam.board;
    if (!fam.dividendPolicy) fam.dividendPolicy = "balanced";
    fam.trustLoan = Math.max(0, round(fam.trustLoan));
    fam.trainingSpend = Math.max(0, round(fam.trainingSpend));
    fam.totalTrustDividends = Math.max(0, round(fam.totalTrustDividends));
    if (!Array.isArray(fam.history)) fam.history = [];
    if (!b.assets || typeof b.assets !== "object") b.assets = {};
    if (b.assets.location == null) b.assets.location = 0;
    if (b.assets.equipment == null) b.assets.equipment = 0;
    if (b.assets.staff == null) b.assets.staff = 0;
    if (!Array.isArray(b.assetHistoryV1850)) b.assetHistoryV1850 = [];
    if (!Array.isArray(b.eventHistoryV1850)) b.eventHistoryV1850 = [];
    ensureLocationsV1857(b);
    try { if (typeof window.ensureSectorMeterV1851 === "function") window.ensureSectorMeterV1851(b); } catch (e) {}
    return b;
  }

  function ensureBusinessState() {
    try { if (typeof ensureStateShape === "function") ensureStateShape(); } catch (e) {}
    var s = stateNow();
    if (!window.state && s) window.state = s;
    if (!s.stats || typeof s.stats !== "object") s.stats = {};
    if (!s.actionsTaken || typeof s.actionsTaken !== "object") s.actionsTaken = {};
    var f = financeNow();
    if (!Array.isArray(f.businesses)) f.businesses = [];
    if (!f.incomeSources || typeof f.incomeSources !== "object") f.incomeSources = {};
    if (!f.businessOfficeV1840 || typeof f.businessOfficeV1840 !== "object") f.businessOfficeV1840 = {};
    if (!f.entrepreneurshipV1841 || typeof f.entrepreneurshipV1841 !== "object") f.entrepreneurshipV1841 = {};
    var founder = f.entrepreneurshipV1841;
    if (!FOUNDER_PATHS[founder.path]) founder.path = "undecided";
    founder.years = Math.max(0, round(founder.years));
    founder.thesis = String(founder.thesis || "");
    founder.focus = String(founder.focus || "");
    founder.ambition = clamp(founder.ambition == null ? 50 : founder.ambition, 0, 100);
    if (!f.businessTaxV1830 || typeof f.businessTaxV1830 !== "object") f.businessTaxV1830 = { history: [], processedAges: {} };
    if (!Array.isArray(f.businessTaxV1830.history)) f.businessTaxV1830.history = [];
    if (!s.estateV1831 || typeof s.estateV1831 !== "object") s.estateV1831 = {};
    var e = s.estateV1831;
    if (!e.assets || typeof e.assets !== "object") e.assets = {};
    e.assets.trustCash = Math.max(0, round(e.assets.trustCash));
    if (!e.clauses || typeof e.clauses !== "object") e.clauses = {};
    if (!e.familyEnterpriseV1833 || typeof e.familyEnterpriseV1833 !== "object") e.familyEnterpriseV1833 = {};
    var fe = e.familyEnterpriseV1833;
    if (!fe.governance) fe.governance = "informal";
    if (!fe.mission) fe.mission = "dynasty";
    fe.harmony = clamp(fe.harmony == null ? 50 : fe.harmony, 0, 100);
    fe.readiness = clamp(fe.readiness == null ? 0 : fe.readiness, 0, 100);
    fe.disputes = Math.max(0, round(fe.disputes));
    fe.totalTrustDividends = Math.max(0, round(fe.totalTrustDividends));
    fe.totalTrustLoans = Math.max(0, round(fe.totalTrustLoans));
    fe.totalHeirTraining = Math.max(0, round(fe.totalHeirTraining));
    if (!Array.isArray(fe.history)) fe.history = [];
    if (f.familyTrustV1839 && f.familyTrustV1839.created && (!e.trustType || e.trustType === "none")) {
      e.trustType = f.familyTrustV1839.plan || "family_trust";
      e.hasWill = true;
    }
    f.businesses.forEach(ensureBusiness);
    if (!f.businessOfficeV1840.focusId && f.businesses[0]) f.businessOfficeV1840.focusId = f.businesses[0].id;
    if (f.businessOfficeV1840.focusId && !businessById(f.businessOfficeV1840.focusId)) {
      f.businessOfficeV1840.focusId = f.businesses[0] ? f.businesses[0].id : "";
    }
    return s;
  }

  function businesses() {
    return ensureBusinessState().finance.businesses || [];
  }

  function businessById(id) {
    return (stateNow().finance && stateNow().finance.businesses || []).find(function (b) { return String(b.id) === String(id); }) || null;
  }

  // Companies the Business hub should actually manage. The active Entrepreneurship startup is
  // mirrored into finance.businesses (founderActiveV1860 / _migratedToBizV1861) so net worth counts
  // it — but its income is run by the Entrepreneurship module, so it would show a misleading $0 here.
  // Hide those from the Business hub; they live in Entrepreneurship.
  function isEntrepreneurPortV1862(b) { return !!(b && (b.founderActiveV1860 || b._migratedToBizV1861)); }
  function businessesVisibleV1862() {
    return businesses().filter(function (b) { return b && !isEntrepreneurPortV1862(b); });
  }

  function hashV1862(str, seed) {
    var h = (seed | 0) || 0;
    str = String(str);
    for (var i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) | 0; }
    return h >>> 0;
  }
  // Rotating acquisition market: always >=3 companies for sale, growing to 10 with age, varied
  // sectors, refreshed each year (seeded by age so it's stable within a year). Drawn from the
  // V6 acquisition list plus the launch catalog (buyCompany/bizBlueprint resolve either).
  function acquisitionMarketV1862() {
    var s = ensureBusinessState();
    var age = n(s.age, 18);
    var seed = Math.floor(age);
    var owned = businesses();
    var pool = [];
    (acquisitionCatalog() || []).forEach(function (v) { if (v && v.id) pool.push(v); });
    (businessCatalog() || []).forEach(function (v) {
      if (!v || !v.id || String(v.id).indexOf("acq_") === 0) return;
      pool.push({ id: v.id, name: v.name, category: v.category, minAge: businessMinAgeV1872(v), startup: v.startup, buy: n(v.buy) || Math.round(n(v.startup) * 2.2), desc: v.desc, failureRisk: v.failureRisk });
    });
    var seen = {}, uniq = [];
    pool.forEach(function (v) {
      var id = String(v.id);
      if (seen[id]) return; seen[id] = 1;
      if (owned.some(function (b) { return String(b.baseId || b.id) === id; })) return;
      uniq.push(v);
    });
    uniq.sort(function (a, b) { return hashV1862(a.id, seed) - hashV1862(b.id, seed); });
    var count = Math.max(3, Math.min(10, 3 + Math.floor((age - 18) / 5)));
    var picked = [], cats = {};
    uniq.forEach(function (v) { if (picked.length >= count) return; var c = v.category || "Business"; if (!cats[c]) { cats[c] = 1; picked.push(v); } });
    uniq.forEach(function (v) { if (picked.length >= count) return; if (picked.indexOf(v) < 0) picked.push(v); });
    return picked;
  }

  function businessValue(b) {
    ensureBusiness(b);
    return Math.max(0, round(n(b.value) + n(b.retainedEarnings)));
  }

  function totalBusinessValue() {
    return businesses().reduce(function (sum, b) { return sum + businessValue(b); }, 0);
  }

  function totalCompanyCash() {
    return businesses().reduce(function (sum, b) { return sum + Math.max(0, n(b.retainedEarnings)); }, 0);
  }

  function totalEntityDebt() {
    return businesses().reduce(function (sum, b) { return sum + Math.max(0, n(b.entityTaxDebt)); }, 0);
  }

  function totalCompliance() {
    return businesses().reduce(function (sum, b) { return sum + Math.max(0, n(b.complianceDue)); }, 0);
  }

  function trustBusinessValue() {
    return businesses().reduce(function (sum, b) {
      ensureBusiness(b);
      return sum + businessValue(b) * n(b.familyV1833.trustPercent);
    }, 0);
  }

  function trustCash() {
    var s = ensureBusinessState();
    return Math.max(0, n((s.estateV1831.assets || {}).trustCash) + n((s.finance.familyTrustV1839 || {}).corpus));
  }

  function legalTrustActive() {
    var s = ensureBusinessState();
    return !!((s.finance.familyTrustV1839 && s.finance.familyTrustV1839.created) || (s.estateV1831.trustType && s.estateV1831.trustType !== "none"));
  }

  function addTrustCash(amount, eventName) {
    var s = ensureBusinessState();
    amount = Math.max(0, round(amount));
    if (!amount) return;
    if (s.finance.familyTrustV1839 && s.finance.familyTrustV1839.created) {
      var trust = s.finance.familyTrustV1839;
      trust.corpus = Math.max(0, round(n(trust.corpus) + amount));
      if (!trust.sourceLedger || typeof trust.sourceLedger !== "object") trust.sourceLedger = {};
      trust.sourceLedger.business = Math.max(0, round(n(trust.sourceLedger.business) + amount));
      if (!Array.isArray(trust.history)) trust.history = [];
      trust.history.unshift({ age: round(s.age), event: eventName || "Business trust cash", amount: amount });
      trust.history = trust.history.slice(0, 8);
    } else {
      s.estateV1831.assets.trustCash = Math.max(0, round(n(s.estateV1831.assets.trustCash) + amount));
    }
  }

  function takeTrustCash(amount) {
    var s = ensureBusinessState();
    amount = Math.max(0, round(amount));
    var remaining = amount;
    var estateCash = Math.max(0, n(s.estateV1831.assets.trustCash));
    var fromEstate = Math.min(estateCash, remaining);
    s.estateV1831.assets.trustCash = Math.max(0, round(estateCash - fromEstate));
    remaining -= fromEstate;
    var trust = s.finance.familyTrustV1839 || {};
    if (remaining > 0 && trust.created) {
      var fromLegal = Math.min(Math.max(0, n(trust.corpus)), remaining);
      trust.corpus = Math.max(0, round(n(trust.corpus) - fromLegal));
      remaining -= fromLegal;
    }
    return amount - remaining;
  }

  function enterpriseScore() {
    var s = ensureBusinessState();
    var fe = s.estateV1831.familyEnterpriseV1833;
    var total = Math.max(1, totalBusinessValue());
    var score = 0;
    score += legalTrustActive() ? 18 : 0;
    score += s.estateV1831.hasWill ? 8 : 0;
    score += clamp(trustBusinessValue() / total, 0, 1) * 22;
    score += clamp(fe.harmony, 0, 100) * .16;
    score += clamp(fe.readiness + averageReadiness(), 0, 130) * .18;
    score += fe.governance && fe.governance !== "informal" ? 12 : 0;
    score += businesses().some(function (b) { return b.familyV1833 && b.familyV1833.board; }) ? 8 : 0;
    score -= Math.min(18, n(fe.disputes) * 3);
    fe.familyScore = Math.round(clamp(score, 0, 100));
    return fe.familyScore;
  }

  function averageReadiness() {
    var list = businesses().filter(function (b) {
      return n(b.familyV1833 && b.familyV1833.trustPercent) > 0 || (b.familyV1833 && b.familyV1833.successor !== "none");
    });
    if (!list.length) return 0;
    return Math.round(list.reduce(function (sum, b) {
      return sum + n(b.familyV1833.readiness) + n(b.familyV1833.continuity) * .35;
    }, 0) / list.length);
  }

  function focusBusiness() {
    var s = ensureBusinessState();
    var b = businessById(s.finance.businessOfficeV1840.focusId);
    if (b && !isEntrepreneurPortV1862(b)) return b;
    return businessesVisibleV1862()[0] || null;
  }

  function actionButton(label, action, kind, disabled) {
    return '<button class="money-btn ' + esc(kind || "") + '" onclick="event.preventDefault();event.stopPropagation();' + action + '" ' + (disabled ? "disabled" : "") + '>' + esc(label) + '</button>';
  }

  function customRow(id, max, action, label, kind, disabled) {
    return '<div class="v1840-custom-row"><input id="' + esc(id) + '" inputmode="numeric" placeholder="$ custom"><span>Max ' + esc(compactMoney(max)) + '</span>' + actionButton(label || "Move", action, kind || "green", disabled || max <= 0) + '</div>';
  }

  window.setBusinessFocusV1840 = function (businessId) {
    var s = ensureBusinessState();
    if (!businessById(businessId)) return toast("Business not found.");
    s.finance.businessOfficeV1840.focusId = String(businessId);
    saveRender();
  };

  window.renameBusinessV1840 = function (businessId, inputId) {
    var b = businessById(businessId);
    if (!b) return toast("Business not found.");
    var value = "";
    try {
      var el = document.getElementById(inputId || ("v1840-rename-" + safeId(businessId)));
      value = el ? String(el.value || "").trim() : "";
    } catch (e) {}
    if (!value) return toast("Type a business name first.");
    b.name = value.slice(0, 42);
    log("Renamed business to " + b.name + ".", {});
    saveRender();
  };

  window.setBusinessTrustPercentV1840 = function (businessId, rawPct) {
    var s = ensureBusinessState();
    var b = businessById(businessId);
    if (!b) return toast("Business not found.");
    if (!legalTrustActive()) return toast("Create a family trust in Legal first.");
    ensureBusiness(b);
    var target = clamp(n(rawPct) / 100, 0, 1);
    var old = n(b.familyV1833.trustPercent);
    var increase = Math.max(0, target - old);
    var legalCost = increase > 0 ? Math.min(250000, Math.max(1200, round(businessValue(b) * increase * .006))) : 0;
    if (legalCost > Math.max(0, n(s.money))) return toast("Business trust titling needs " + compactMoney(legalCost) + " in checking.");
    s.money = Math.max(0, round(n(s.money) - legalCost));
    b.familyV1833.trustPercent = target;
    if (!s.estateV1831.businessHoldingsV1833 || typeof s.estateV1831.businessHoldingsV1833 !== "object") s.estateV1831.businessHoldingsV1833 = {};
    s.estateV1831.businessHoldingsV1833[String(b.id)] = { name: b.name, percent: target, value: round(businessValue(b) * target), updatedAge: n(s.age) };
    if (target >= .51) s.estateV1831.clauses.businessSuccession = true;
    b.familyV1833.continuity = clamp(n(b.familyV1833.continuity) + (target >= .51 ? 10 : target > old ? 4 : 0), 0, 100);
    addEnterpriseHistory("Titled " + Math.round(target * 100) + "% of " + b.name + " to trust", -legalCost);
    log("Moved " + Math.round(target * 100) + "% of " + b.name + " into the family trust plan.", { money: -legalCost });
    saveRender();
  };

  window.payBusinessDividendToTrustV1840 = function (businessId, mode) {
    var s = ensureBusinessState();
    var b = businessById(businessId);
    if (!b) return toast("Business not found.");
    if (!legalTrustActive()) return toast("Create a family trust in Legal first.");
    ensureBusiness(b);
    var trustPct = n(b.familyV1833.trustPercent);
    if (!trustPct) return toast("Title some of this business into the trust first.");
    var inputId = "v1840-div-" + safeId(b.id);
    var max = Math.max(0, round(n(b.retainedEarnings) * trustPct));
    var amount = amountFromMode(mode, max, inputId);
    if (!amount) return toast("No distributable trust dividend available.");
    b.retainedEarnings = Math.max(0, round(n(b.retainedEarnings) - amount));
    b.familyV1833.totalTrustDividends = Math.max(0, round(n(b.familyV1833.totalTrustDividends) + amount));
    s.estateV1831.familyEnterpriseV1833.totalTrustDividends = Math.max(0, round(n(s.estateV1831.familyEnterpriseV1833.totalTrustDividends) + amount));
    s.finance.incomeSources.trustBusinessDividendsV1833 = Math.max(0, round(n(s.finance.incomeSources.trustBusinessDividendsV1833) + amount));
    addTrustCash(amount, "Trust dividend from " + b.name);
    addEnterpriseHistory("Trust dividend from " + b.name, amount);
    log(b.name + " paid " + compactMoney(amount) + " to the family trust. It was not personal checking income.", {});
    saveRender();
  };

  window.trustLoanToBusinessV1840 = function (businessId, mode) {
    var s = ensureBusinessState();
    var b = businessById(businessId);
    if (!b) return toast("Business not found.");
    if (!legalTrustActive()) return toast("Create a family trust in Legal first.");
    var inputId = "v1840-loan-" + safeId(b.id);
    var amount = amountFromMode(mode, trustCash(), inputId);
    if (!amount) return toast("No trust cash available to invest or lend.");
    var moved = takeTrustCash(amount);
    if (!moved) return toast("No trust cash moved.");
    b.retainedEarnings = Math.max(0, round(n(b.retainedEarnings) + moved));
    b.value = Math.max(0, round(n(b.value) + moved * .25));
    b.familyV1833.trustLoan = Math.max(0, round(n(b.familyV1833.trustLoan) + moved));
    b.familyV1833.continuity = clamp(n(b.familyV1833.continuity) + 4, 0, 100);
    s.estateV1831.familyEnterpriseV1833.totalTrustLoans = Math.max(0, round(n(s.estateV1831.familyEnterpriseV1833.totalTrustLoans) + moved));
    addEnterpriseHistory("Trust financed " + b.name, moved);
    log("The family trust financed " + b.name + " with " + compactMoney(moved) + ".", {});
    saveRender();
  };

  window.repayTrustLoanV1840 = function (businessId, mode) {
    var b = businessById(businessId);
    if (!b) return toast("Business not found.");
    ensureBusiness(b);
    var inputId = "v1840-repay-" + safeId(b.id);
    var max = Math.min(Math.max(0, n(b.familyV1833.trustLoan)), Math.max(0, n(b.retainedEarnings)));
    var amount = amountFromMode(mode, max, inputId);
    if (!amount) return toast("No repayable trust loan amount available.");
    b.retainedEarnings = Math.max(0, round(n(b.retainedEarnings) - amount));
    b.familyV1833.trustLoan = Math.max(0, round(n(b.familyV1833.trustLoan) - amount));
    addTrustCash(amount, b.name + " repaid trust loan");
    addEnterpriseHistory(b.name + " repaid trust loan", amount);
    saveRender();
  };

  window.setFamilyGovernanceV1840 = function (mode) {
    var s = ensureBusinessState();
    var fe = s.estateV1831.familyEnterpriseV1833;
    var g = GOVERNANCE[mode] || GOVERNANCE.informal;
    if (fe.governance === mode) return toast("Family governance already uses " + g.name + ".");
    if (mode !== "informal" && !legalTrustActive()) return toast("Create a family trust in Legal first.");
    var cost = g.cost;
    if (mode === "familyoffice" && s.estateV1831.familyOffice) cost = Math.round(cost * .25);
    if (cost > Math.max(0, n(s.money))) return toast(g.name + " needs " + compactMoney(cost) + " in checking.");
    s.money = Math.max(0, round(n(s.money) - cost));
    fe.governance = mode;
    fe.harmony = clamp(n(fe.harmony) + g.harmony, 0, 100);
    fe.readiness = clamp(n(fe.readiness) + g.readiness, 0, 100);
    if (mode === "familyoffice") s.estateV1831.familyOffice = true;
    addEnterpriseHistory("Set governance: " + g.name, -cost);
    log("The family enterprise adopted " + g.name + ".", { money: -cost, stress: -2 });
    saveRender();
  };

  window.setFamilyMissionV1840 = function (mission) {
    var s = ensureBusinessState();
    s.estateV1831.familyEnterpriseV1833.mission = MISSIONS[mission] ? mission : "dynasty";
    s.estateV1831.familyEnterpriseV1833.harmony = clamp(n(s.estateV1831.familyEnterpriseV1833.harmony) + 2, 0, 100);
    addEnterpriseHistory("Updated family mission", 0);
    saveRender();
  };

  window.holdFamilyCouncilV1840 = function (topic) {
    var s = ensureBusinessState();
    if (!legalTrustActive()) return toast("Create a family trust in Legal first.");
    var fe = s.estateV1831.familyEnterpriseV1833;
    var cost = s.estateV1831.familyOffice ? 7500 : 15000;
    if (cost > Math.max(0, n(s.money))) return toast("Family council needs " + compactMoney(cost) + " in checking.");
    s.money = Math.max(0, round(n(s.money) - cost));
    var readiness = topic === "succession" ? 12 : topic === "education" ? 9 : 5;
    var harmony = topic === "conflict" ? 13 : topic === "charity" ? 9 : 7;
    var disputes = topic === "conflict" ? 3 : 1;
    fe.councilMeetings = Math.max(0, round(n(fe.councilMeetings) + 1));
    fe.readiness = clamp(n(fe.readiness) + readiness, 0, 100);
    fe.harmony = clamp(n(fe.harmony) + harmony, 0, 100);
    fe.disputes = Math.max(0, round(n(fe.disputes) - disputes));
    addEnterpriseHistory("Family council: " + topic, -cost);
    log("Held a family council about " + topic + ".", { money: -cost, stress: -2, confidence: 1 });
    saveRender();
  };

  window.trainBusinessSuccessorV1840 = function (businessId, mode) {
    var s = ensureBusinessState();
    var b = businessById(businessId);
    var t = TRAINING[mode] || TRAINING.shadow;
    if (!b) return toast("Business not found.");
    ensureBusiness(b);
    if (b.familyV1833.successor === "none") return toast("Name a successor before training them.");
    var fromBiz = Math.min(t.cost, Math.max(0, n(b.retainedEarnings)));
    var remaining = t.cost - fromBiz;
    if (remaining > Math.max(0, n(s.money))) return toast(t.name + " needs " + compactMoney(t.cost) + " from company cash/checking.");
    b.retainedEarnings = Math.max(0, round(n(b.retainedEarnings) - fromBiz));
    s.money = Math.max(0, round(n(s.money) - remaining));
    b.familyV1833.readiness = clamp(n(b.familyV1833.readiness) + t.readiness, 0, 100);
    b.familyV1833.continuity = clamp(n(b.familyV1833.continuity) + t.continuity, 0, 100);
    b.familyV1833.trainingSpend = Math.max(0, round(n(b.familyV1833.trainingSpend) + t.cost));
    s.estateV1831.familyEnterpriseV1833.totalHeirTraining = Math.max(0, round(n(s.estateV1831.familyEnterpriseV1833.totalHeirTraining) + t.cost));
    s.estateV1831.familyEnterpriseV1833.readiness = clamp(n(s.estateV1831.familyEnterpriseV1833.readiness) + Math.round(t.readiness / 2), 0, 100);
    addEnterpriseHistory("Trained successor at " + b.name, -t.cost);
    log("Invested in successor training for " + b.name + ".", { money: -remaining, confidence: 1 });
    saveRender();
  };

  window.appointBusinessSuccessorV1840 = function (businessId, successorId) {
    var s = ensureBusinessState();
    var b = businessById(businessId);
    if (!b) return toast("Business not found.");
    ensureBusiness(b);
    successorId = String(successorId || "professional");
    var cost = successorId === "none" ? 0 : 2500;
    if (cost > Math.max(0, n(s.money))) return toast("Successor paperwork needs " + compactMoney(cost) + " in checking.");
    s.money = Math.max(0, round(n(s.money) - cost));
    b.familyV1833.successor = successorId;
    if (successorId !== "none") {
      b.familyV1833.continuity = clamp(n(b.familyV1833.continuity) + 8, 0, 100);
      s.estateV1831.familyEnterpriseV1833.readiness = clamp(n(s.estateV1831.familyEnterpriseV1833.readiness) + 3, 0, 100);
      addEnterpriseHistory("Named successor for " + b.name, -cost);
      log("Named a successor for " + b.name + ".", { money: -cost, stress: -1 });
    } else {
      addEnterpriseHistory("Cleared successor for " + b.name, 0);
      toast("Successor cleared for " + b.name + ".");
    }
    saveRender();
  };

  window.appointBusinessSuccessorFromSelectV1840 = function (businessId, selectId) {
    var value = "professional";
    try {
      var el = document.getElementById(selectId);
      if (el && el.value) value = el.value;
    } catch (e) {}
    return window.appointBusinessSuccessorV1840(businessId, value);
  };

  window.toggleFamilyBusinessBoardV1840 = function (businessId) {
    var s = ensureBusinessState();
    var b = businessById(businessId);
    if (!b) return toast("Business not found.");
    if (b.familyV1833.board) return toast("Family board is already active for " + b.name + ".");
    var cost = 50000;
    var fromBiz = Math.min(cost, Math.max(0, n(b.retainedEarnings)));
    var remaining = cost - fromBiz;
    if (remaining > Math.max(0, n(s.money))) return toast("Family board needs " + compactMoney(cost) + " from company cash/checking.");
    b.retainedEarnings = Math.max(0, round(n(b.retainedEarnings) - fromBiz));
    s.money = Math.max(0, round(n(s.money) - remaining));
    b.familyV1833.board = true;
    b.familyV1833.continuity = clamp(n(b.familyV1833.continuity) + 18, 0, 100);
    b.familyV1833.readiness = clamp(n(b.familyV1833.readiness) + 8, 0, 100);
    addEnterpriseHistory("Created board for " + b.name, -cost);
    log("Created a family business board for " + b.name + ".", { money: -remaining, confidence: 2 });
    saveRender();
  };

  window.setBusinessDividendPolicyV1840 = function (businessId, policy) {
    var b = businessById(businessId);
    if (!b) return toast("Business not found.");
    b.familyV1833.dividendPolicy = DIVIDENDS[policy] ? policy : "balanced";
    addEnterpriseHistory("Dividend policy: " + b.name + " / " + DIVIDENDS[b.familyV1833.dividendPolicy].name, 0);
    saveRender();
  };

  function assetTierCost(slotKey, tierIndex, v) {
    var slot = ASSET_SLOTS[slotKey];
    var tier = slot && slot.tiers[tierIndex];
    if (!tier || !tier.costMult) return 0;
    return Math.max(n(tier.costMin), Math.round(n(v && v.startup) * tier.costMult));
  }

  function businessAssetTotals(b) {
    ensureBusiness(b);
    var income = 0, riskCut = 0, repBonus = 0;
    Object.keys(ASSET_SLOTS).forEach(function (slotKey) {
      var slot = ASSET_SLOTS[slotKey];
      var tierIndex = Math.min(n(b.assets[slotKey]), slot.tiers.length - 1);
      var tier = slot.tiers[tierIndex];
      if (!tier) return;
      income += n(tier.incomeBonus);
      riskCut += n(tier.riskCut);
      repBonus += n(tier.repBonus);
    });
    return { income: Math.max(0, Math.min(.30, income)), riskCut: Math.max(0, Math.min(.10, riskCut)), repBonus: repBonus };
  }

  function businessAssetIncomeBonus(b) {
    return businessAssetTotals(b).income;
  }

  function businessAssetRiskCut(b) {
    return businessAssetTotals(b).riskCut;
  }

  window.upgradeBusinessAssetV1850 = function (businessId, slotKey) {
    var s = ensureBusinessState();
    var b = businessById(businessId);
    if (!b) return toast("Business not found.");
    ensureBusiness(b);
    var slot = ASSET_SLOTS[slotKey];
    if (!slot) return toast("Unknown asset slot.");
    var currentTier = n(b.assets[slotKey]);
    var nextIndex = currentTier + 1;
    var tier = slot.tiers[nextIndex];
    if (!tier) return toast(slot.label + " is already at its top tier for " + b.name + ".");
    var v = catalogFor(b.id, b);
    var cost = assetTierCost(slotKey, nextIndex, v);
    var fromBiz = Math.min(cost, Math.max(0, n(b.retainedEarnings)));
    var remaining = cost - fromBiz;
    var tierName = tierLabel(b, slotKey, nextIndex, tier.name);
    if (remaining > Math.max(0, n(s.money))) return toast(tierName + " needs " + compactMoney(cost) + " from company cash/checking.");
    b.retainedEarnings = Math.max(0, round(n(b.retainedEarnings) - fromBiz));
    s.money = Math.max(0, round(n(s.money) - remaining));
    b.assets[slotKey] = nextIndex;
    b.assetHistoryV1850.unshift({ age: round(n(s.age)), icon: slot.icon, event: "Upgraded " + slot.label + " to " + tierName, cost: cost });
    b.assetHistoryV1850 = b.assetHistoryV1850.slice(0, 15);
    log(slot.icon + " " + b.name + " upgraded " + slot.label.toLowerCase() + " to " + tierName + ".", { money: -remaining, confidence: 1 });
    saveRender();
  };

  function ventureSignatureAction(b) {
    if (VENTURE_ACTIONS[b.id]) return VENTURE_ACTIONS[b.id];
    try { if (window.SECTOR_VENTURE_ACTIONS && window.SECTOR_VENTURE_ACTIONS[b.id]) return window.SECTOR_VENTURE_ACTIONS[b.id]; } catch (e) {}
    return null;
  }

  window.runVentureSignatureActionV1850 = function (businessId) {
    var s = ensureBusinessState();
    var b = businessById(businessId);
    if (!b) return toast("Business not found.");
    ensureBusiness(b);
    var action = ventureSignatureAction(b);
    if (!action) return toast("No signature action for this business yet.");
    var key = "venture_signature_" + b.id;
    if (s.actionsTaken && s.actionsTaken[key]) return toast("Already done this year.");
    var v = catalogFor(b.id, b);
    var cost = Math.max(n(action.costMin), Math.round(n(v.startup) * n(action.costMult)));
    var fromBiz = Math.min(cost, Math.max(0, n(b.retainedEarnings)));
    var remaining = cost - fromBiz;
    if (remaining > Math.max(0, n(s.money))) return toast(action.label + " needs " + compactMoney(cost) + " from company cash/checking.");
    b.retainedEarnings = Math.max(0, round(n(b.retainedEarnings) - fromBiz));
    s.money = Math.max(0, round(n(s.money) - remaining));
    s.actionsTaken = s.actionsTaken || {};
    s.actionsTaken[key] = true;
    if (action.rep) b.reputation = clamp(n(b.reputation) + action.rep, 0, 100);
    if (action.valueMult) b.value = Math.max(0, Math.round(n(b.value) * action.valueMult));
    if (action.payoutMult) {
      var payout = Math.round(n(b.value) * action.payoutMult * (.6 + Math.random() * .8));
      b.retainedEarnings = Math.max(0, round(n(b.retainedEarnings) + payout));
    }
    try { if (typeof window.bumpSectorMeterV1851 === "function") window.bumpSectorMeterV1851(b, 10); } catch (e) {}
    log(action.icon + " " + b.name + ": " + pickActionResult(action), { money: -remaining, confidence: 1 });
    saveRender();
  };

  // v18.36: stage-gated second signature action. Unlocks once a business grows
  // past the startup stage, giving long-lived ventures a bigger, costlier move
  // instead of repeating the same one action forever. Keyed by sector with a
  // generic "scale up" fallback.
  var SECOND_ACTIONS = {
    food:       { label: "Open a Second Location", icon: "🍽️", costMult: .9, costMin: 6000, rep: 9, valueMult: 1.14, results: ["Opened a second location across town.", "A new outpost doubled your reach."] },
    nightlife:  { label: "Launch a Flagship Night", icon: "🎆", costMult: .7, costMin: 5000, rep: 10, payoutMult: .12, results: ["Launched a recurring flagship night that sells out.", "A signature event became a citywide draw."] },
    retail:     { label: "Launch a Product Line", icon: "🏷️", costMult: .8, costMin: 5000, rep: 8, valueMult: 1.12, results: ["Launched an own-brand product line.", "A private-label range became your bestseller."] },
    trades:     { label: "Buy a Truck Fleet", icon: "🚛", costMult: .8, costMin: 6000, rep: 8, valueMult: 1.13, results: ["Bought a truck fleet and tripled job capacity.", "Fleet expansion let you take on far bigger contracts."] },
    media:      { label: "Build a Studio", icon: "🏛️", costMult: .9, costMin: 8000, rep: 10, valueMult: 1.15, results: ["Built a real studio and leveled up production.", "A dedicated studio attracted bigger projects."] },
    tech:       { label: "Acquire a Competitor", icon: "🤝", costMult: 1.0, costMin: 10000, rep: 9, valueMult: 1.18, results: ["Acquired a smaller competitor and their userbase.", "An acqui-hire folded a rival team into yours."] },
    finance:    { label: "Open a New Fund", icon: "🏦", costMult: .8, costMin: 15000, rep: 9, payoutMult: .1, results: ["Spun up a new fund and raised fresh capital.", "A second strategy pulled in a wave of allocations."] },
    realestate: { label: "Break Ground on Development", icon: "🏗️", costMult: 1.0, costMin: 12000, rep: 9, valueMult: 1.16, results: ["Broke ground on a ground-up development.", "A development project reshaped the portfolio."] },
    health:     { label: "Open a Second Clinic", icon: "🏥", costMult: .9, costMin: 9000, rep: 9, valueMult: 1.14, results: ["Opened a second clinic in a new neighborhood.", "A new location expanded patient capacity."] },
    logistics:  { label: "Add a Distribution Hub", icon: "🏭", costMult: .9, costMin: 10000, rep: 8, valueMult: 1.15, results: ["Added a regional distribution hub.", "A new hub unlocked next-day coverage."] }
  };
  var SECOND_ACTION_GENERIC = { label: "Scale the Business", icon: "🚀", costMult: .8, costMin: 5000, rep: 8, valueMult: 1.12, results: ["Pushed a major expansion and leveled up.", "A big reinvestment pushed the business to a new tier."] };

  function ventureSecondAction(b) {
    if (!b || b.stage === "startup" || !b.stage) return null; // gated behind growth
    var sid = null;
    try { if (typeof window.sectorIdForBusinessV1851 === "function") sid = window.sectorIdForBusinessV1851(b); } catch (e) {}
    if (!sid) {
      try {
        var nm = (window.SECTOR_OF && window.SECTOR_OF[b.id]) || b.sector || b.category;
        if (window.LEDGER_SECTORS && nm) {
          var s = window.LEDGER_SECTORS.find(function (x) { return x.name === nm || x.id === nm; });
          if (s) sid = s.id;
        }
      } catch (e) {}
    }
    return (sid && SECOND_ACTIONS[sid]) || SECOND_ACTION_GENERIC;
  }

  window.runVentureSecondActionV1852 = function (businessId) {
    var s = ensureBusinessState();
    var b = businessById(businessId);
    if (!b) return toast("Business not found.");
    ensureBusiness(b);
    var action = ventureSecondAction(b);
    if (!action) return toast("This business needs to reach Growing stage first.");
    var key = "venture_second_" + b.id;
    if (s.actionsTaken && s.actionsTaken[key]) return toast("Already done this year.");
    var v = catalogFor(b.id, b);
    var cost = Math.max(n(action.costMin), Math.round(n(v.startup) * n(action.costMult)));
    var fromBiz = Math.min(cost, Math.max(0, n(b.retainedEarnings)));
    var remaining = cost - fromBiz;
    if (remaining > Math.max(0, n(s.money))) return toast(action.label + " needs " + compactMoney(cost) + " from company cash/checking.");
    b.retainedEarnings = Math.max(0, round(n(b.retainedEarnings) - fromBiz));
    s.money = Math.max(0, round(n(s.money) - remaining));
    s.actionsTaken = s.actionsTaken || {};
    s.actionsTaken[key] = true;
    if (action.rep) b.reputation = clamp(n(b.reputation) + action.rep, 0, 100);
    if (action.valueMult) b.value = Math.max(0, Math.round(n(b.value) * action.valueMult));
    if (action.payoutMult) {
      var payout = Math.round(n(b.value) * action.payoutMult * (.6 + Math.random() * .8));
      b.retainedEarnings = Math.max(0, round(n(b.retainedEarnings) + payout));
    }
    try { if (typeof window.bumpSectorMeterV1851 === "function") window.bumpSectorMeterV1851(b, 14); } catch (e) {}
    log(action.icon + " " + b.name + ": " + pickActionResult(action), { money: -remaining, confidence: 2 });
    saveRender();
  };

  // Dedicated per-sector action: the "thing you do to run this kind of business."
  window.runSectorActionV1851 = function (businessId) {
    var s = ensureBusinessState();
    var b = businessById(businessId);
    if (!b) return toast("Business not found.");
    ensureBusiness(b);
    var mech = (typeof window.sectorMechanicFor === "function") ? window.sectorMechanicFor(b) : null;
    if (!mech) return toast("No sector action for this business.");
    var key = "sector_action_" + b.id;
    if (s.actionsTaken && s.actionsTaken[key]) return toast("Already done this year.");
    var v = catalogFor(b.id, b);
    var cost = Math.max(n(mech.actionCostMin), Math.round(n(v.startup) * n(mech.actionCostMult)));
    var fromBiz = Math.min(cost, Math.max(0, n(b.retainedEarnings)));
    var remaining = cost - fromBiz;
    if (remaining > Math.max(0, n(s.money))) return toast(mech.actionLabel + " needs " + compactMoney(cost) + " from company cash/checking.");
    b.retainedEarnings = Math.max(0, round(n(b.retainedEarnings) - fromBiz));
    s.money = Math.max(0, round(n(s.money) - remaining));
    s.actionsTaken = s.actionsTaken || {};
    s.actionsTaken[key] = true;
    if (typeof window.bumpSectorMeterV1851 === "function") window.bumpSectorMeterV1851(b);
    var info = (typeof window.sectorMeterInfoV1851 === "function") ? window.sectorMeterInfoV1851(b) : null;
    log((mech.actionIcon || "🔧") + " " + b.name + ": " + mech.actionLabel + "." + (info ? " " + mech.label + " now " + round(info.value) + "/100." : ""), { money: -remaining });
    saveRender();
  };

  function spendBusinessCostV1857(b, cost) {
    var s = ensureBusinessState();
    cost = Math.max(0, round(cost));
    var fromBiz = Math.min(cost, Math.max(0, n(b.retainedEarnings)));
    var remaining = cost - fromBiz;
    if (remaining > Math.max(0, n(s.money))) return null;
    b.retainedEarnings = Math.max(0, round(n(b.retainedEarnings) - fromBiz));
    s.money = Math.max(0, round(n(s.money) - remaining));
    return { total: cost, fromBusiness: fromBiz, fromPersonal: remaining };
  }

  // v18.74: entity setup is a company expense when company cash exists.
  window.setBusinessEntityV1830 = function (businessId, entityType) {
    var s = ensureBusinessState();
    var b = businessById(businessId);
    if (!b) return toast("Business not found.");
    ensureBusiness(b);
    var st = STRUCTURES[entityType];
    if (!st) return toast("Entity type not found.");
    if (b.entityType === entityType) return toast(b.name + " is already a " + st.name + ".");
    if (n(b.value) < st.minValue) return toast(st.name + " needs " + compactMoney(st.minValue) + " business value.");
    var paid = spendBusinessCostV1857(b, st.cost);
    if (!paid) return toast("Setup cost is " + compactMoney(st.cost) + " from company cash/checking.");
    var old = (STRUCTURES[b.entityType] || STRUCTURES.soleprop).name;
    b.entityType = entityType;
    b.historyV1830.unshift({
      age: round(n(s.age)),
      action: "Entity changed",
      from: old,
      to: st.name,
      amount: st.cost,
      paidFromCompany: paid.fromBusiness,
      paidFromChecking: paid.fromPersonal
    });
    b.historyV1830 = b.historyV1830.slice(0, 18);
    log("Set " + b.name + " as " + st.name + ".", { money: -paid.fromPersonal });
    saveRender();
  };

  function locationCostBaseV1857(b) {
    var v = catalogFor(b.id, b);
    return Math.max(20000, n(v.startup, 25000));
  }

  function openLocationCostV1857(b, model) {
    ensureLocationsV1857(b);
    var branch = Math.max(0, locationOpenCountV1857(b) - 1);
    var owned = Math.max(20000, Math.round(locationCostBaseV1857(b) * (.65 + branch * .2)));
    return model === "franchise" ? Math.round(owned * .4) : owned;
  }

  function upgradeLocationCostV1857(b, site) {
    return Math.max(8000, Math.round(locationCostBaseV1857(b) * (.22 + n(site && site.tier) * .12) * (site && site.model === "franchise" ? .55 : 1)));
  }

  function supportLocationCostV1857(b, site) {
    return Math.max(2500, Math.round(locationCostBaseV1857(b) * (site && site.model === "franchise" ? .045 : .08)));
  }

  function competeCostV1857(b) {
    return Math.max(5000, Math.round(locationCostBaseV1857(b) * .18));
  }

  function acquireRivalCostV1857(b) {
    ensureLocationsV1857(b);
    var v = catalogFor(b.id, b);
    var market = b.marketV1857 || {};
    return Math.max(150000, Math.round(n(v.startup, 50000) * 2), Math.round(Math.max(n(b.value), n(v.startup)) * (.45 + n(market.rivalShare) / 100)));
  }

  function locationByIdV1857(b, locationId) {
    ensureLocationsV1857(b);
    return (b.locationsV1857.sites || []).find(function (site) { return String(site.id) === String(locationId); }) || null;
  }

  function addLocationHistoryV1857(b, text, amount) {
    ensureLocationsV1857(b);
    b.locationsV1857.history.unshift({ age: round(n(stateNow().age)), text: text, amount: round(amount || 0) });
    b.locationsV1857.history = b.locationsV1857.history.slice(0, 12);
  }

  function canOpenLocationV1857(b, model) {
    ensureBusiness(b);
    var open = locationOpenCountV1857(b);
    var cost = openLocationCostV1857(b, model);
    var available = n(b.retainedEarnings) + n(stateNow().money);
    var locationTier = n(b.assets && b.assets.location);
    if (locationTier < 2) return { ok: false, cost: cost, reason: "Needs Owned Location asset." };
    if (n(b.reputation) < 70) return { ok: false, cost: cost, reason: "Needs reputation 70+." };
    if ((b.stage || "startup") === "startup") return { ok: false, cost: cost, reason: "Needs Growing stage or better." };
    if (model === "franchise" && (open < 2 || n(b.reputation) < 72)) return { ok: false, cost: cost, reason: "Franchise partners unlock at 2+ sites and reputation 72+." };
    if (available < cost) return { ok: false, cost: cost, reason: "Needs " + compactMoney(cost) + " available." };
    return { ok: true, cost: cost, reason: "Ready." };
  }

  window.openBusinessLocationV1857 = function (businessId, model) {
    var b = businessById(businessId);
    if (!b) return toast("Business not found.");
    ensureBusiness(b);
    model = model === "franchise" ? "franchise" : "owned";
    var gate = canOpenLocationV1857(b, model);
    if (!gate.ok) return toast(gate.reason);
    var paid = spendBusinessCostV1857(b, gate.cost);
    if (!paid) return toast("Not enough cash to open this location.");
    var loc = ensureLocationsV1857(b);
    var archetype = nextLocationArchetypeV1857(b);
    var site = makeLocationSiteV1857(b, {
      id: "loc_" + (++loc.nextId),
      name: archetype + (model === "franchise" ? " partner" : ""),
      archetype: archetype,
      model: model,
      tier: 1,
      quality: model === "franchise" ? 62 : 58,
      staff: model === "franchise" ? 66 : 54,
      demand: clamp(50 + n(b.marketV1857 && b.marketV1857.share) * .25, 42, 76)
    });
    loc.sites.push(site);
    b.value = Math.max(0, round(n(b.value) + gate.cost * (model === "franchise" ? .35 : .65)));
    b.reputation = clamp(n(b.reputation) + (model === "franchise" ? 2 : 3), 0, 100);
    b.locations = locationOpenCountV1857(b);
    addLocationHistoryV1857(b, "Opened " + site.name + " as a " + (model === "franchise" ? "franchise partner" : "company-owned site") + ".", -paid.total);
    log("Opened " + site.name + " for " + b.name + ".", { money: -paid.fromPersonal, confidence: 1 });
    saveRender();
  };

  window.upgradeBusinessLocationV1857 = function (businessId, locationId) {
    var b = businessById(businessId);
    if (!b) return toast("Business not found.");
    ensureBusiness(b);
    var site = locationByIdV1857(b, locationId);
    if (!site || site.status === "closed") return toast("Location not found.");
    if (n(site.tier) >= 3) return toast(site.name + " is already at top tier.");
    var cost = upgradeLocationCostV1857(b, site);
    var paid = spendBusinessCostV1857(b, cost);
    if (!paid) return toast("Need " + compactMoney(cost) + " to upgrade this site.");
    site.tier = clamp(n(site.tier) + 1, 1, 3);
    site.quality = clamp(n(site.quality) + 12, 0, 100);
    site.staff = clamp(n(site.staff) + 7, 0, 100);
    site.demand = clamp(n(site.demand) + 6, 0, 100);
    b.value = Math.max(0, round(n(b.value) + cost * .7));
    addLocationHistoryV1857(b, "Upgraded " + site.name + " to tier " + site.tier + ".", -paid.total);
    log("Upgraded " + site.name + " for " + b.name + ".", { money: -paid.fromPersonal });
    saveRender();
  };

  window.supportBusinessLocationV1857 = function (businessId, locationId, mode) {
    var b = businessById(businessId);
    if (!b) return toast("Business not found.");
    ensureBusiness(b);
    var site = locationByIdV1857(b, locationId);
    if (!site || site.status === "closed") return toast("Location not found.");
    mode = /staff|demand|quality/.test(String(mode)) ? String(mode) : "quality";
    var cost = supportLocationCostV1857(b, site);
    var paid = spendBusinessCostV1857(b, cost);
    if (!paid) return toast("Need " + compactMoney(cost) + " to support this site.");
    var label = "systems tune-up";
    if (mode === "staff") { site.staff = clamp(n(site.staff) + 14, 0, 100); site.quality = clamp(n(site.quality) + 4, 0, 100); label = "staff training"; }
    else if (mode === "demand") { site.demand = clamp(n(site.demand) + 15, 0, 100); b.marketV1857.share = clamp(n(b.marketV1857.share) + 1.2, 3, 85); label = "local campaign"; }
    else { site.quality = clamp(n(site.quality) + 14, 0, 100); site.staff = clamp(n(site.staff) + 3, 0, 100); }
    addLocationHistoryV1857(b, "Ran " + label + " at " + site.name + ".", -paid.total);
    log(label + " improved " + site.name + ".", { money: -paid.fromPersonal });
    saveRender();
  };

  window.closeBusinessLocationV1857 = function (businessId, locationId) {
    var b = businessById(businessId);
    if (!b) return toast("Business not found.");
    ensureBusiness(b);
    var site = locationByIdV1857(b, locationId);
    if (!site || site.status === "closed") return toast("Location not found.");
    if (String(site.id) === "hq") return toast("Headquarters cannot be closed.");
    site.status = "closed";
    site.lastIncome = 0;
    b.locations = locationOpenCountV1857(b);
    b.reputation = clamp(n(b.reputation) - (n(site.demand) > 60 ? 2 : 0), 0, 100);
    addLocationHistoryV1857(b, "Closed " + site.name + " to reduce sprawl.", 0);
    log("Closed " + site.name + " and tightened the network.", {});
    saveRender();
  };

  window.competeBusinessMarketShareV1857 = function (businessId) {
    var b = businessById(businessId);
    if (!b) return toast("Business not found.");
    ensureBusiness(b);
    var market = b.marketV1857;
    var ageNow = round(n(stateNow().age));
    if (round(market.lastCompeteAge) === ageNow) return toast("Already competed for share this year.");
    var cost = competeCostV1857(b);
    var paid = spendBusinessCostV1857(b, cost);
    if (!paid) return toast("Need " + compactMoney(cost) + " to compete for market share.");
    var summary = locationSummaryV1857(b);
    var profile = locationProfileV1857(b);
    var rival = rivalNameV1857(b);
    var chanceWin = clamp(.34 + n(b.reputation) / 260 + n(summary.avgDemand) / 360 + (n(market.share) - n(market.rivalShare)) / 260 - n(market.rivalStrength) / 500, .18, .82);
    market.lastCompeteAge = ageNow;
    if (chanceLocal(chanceWin)) {
      var gain = randInt(3, 7);
      market.share = clamp(n(market.share) + gain, 3, 85);
      market.rivalShare = clamp(n(market.rivalShare) - Math.max(1, gain - 1), 5, 70);
      market.rivalStrength = clamp(n(market.rivalStrength) - randInt(2, 5), 10, 95);
      b.reputation = clamp(n(b.reputation) + 4, 0, 100);
      b.value = Math.max(0, round(n(b.value) * 1.03));
      (b.locationsV1857.sites || []).forEach(function (site) { if (site.status !== "closed") site.demand = clamp(n(site.demand) + 5, 0, 100); });
      addLocationHistoryV1857(b, profile.compete + ": gained " + gain + " pts of share from " + rival + ".", -paid.total);
      log(profile.compete + ". Market share up to " + round(market.share) + "%.", { money: -paid.fromPersonal, confidence: 1 });
    } else {
      market.share = clamp(n(market.share) + 1, 3, 85);
      market.rivalStrength = clamp(n(market.rivalStrength) + randInt(1, 4), 10, 95);
      b.reputation = clamp(n(b.reputation) - 1, 0, 100);
      addLocationHistoryV1857(b, profile.compete + " stalled against " + rival + ".", -paid.total);
      log("The push made noise, but " + rival + " held the line.", { money: -paid.fromPersonal });
    }
    saveRender();
  };

  function canAcquireRivalV1857(b) {
    ensureBusiness(b);
    var cost = acquireRivalCostV1857(b);
    var v = catalogFor(b.id, b);
    var available = n(b.retainedEarnings) + n(stateNow().money);
    var open = locationOpenCountV1857(b);
    if (round(n(b.marketV1857 && b.marketV1857.lastAcquireAge)) === round(n(stateNow().age))) return { ok: false, cost: cost, reason: "Already acquired a rival this year." };
    if (n(b.reputation) < 85) return { ok: false, cost: cost, reason: "Needs reputation 85+." };
    if (open < 3 && n(b.value) < n(v.startup, 50000) * 8) return { ok: false, cost: cost, reason: "Needs 3+ sites or major company value." };
    if (available < cost) return { ok: false, cost: cost, reason: "Needs " + compactMoney(cost) + " available." };
    return { ok: true, cost: cost, reason: "Ready." };
  }

  window.acquireBusinessRivalV1857 = function (businessId) {
    var b = businessById(businessId);
    if (!b) return toast("Business not found.");
    ensureBusiness(b);
    var gate = canAcquireRivalV1857(b);
    if (!gate.ok) return toast(gate.reason);
    var rival = rivalNameV1857(b);
    var paid = spendBusinessCostV1857(b, gate.cost);
    if (!paid) return toast("Not enough cash to acquire the rival.");
    var loc = ensureLocationsV1857(b);
    var profile = locationProfileV1857(b);
    var site = makeLocationSiteV1857(b, {
      id: "acq_" + (++loc.nextId),
      name: rival + " " + (profile.locations[1] || "site"),
      archetype: profile.locations[1] || nextLocationArchetypeV1857(b),
      model: "owned",
      tier: 2,
      quality: 63,
      staff: 60,
      demand: 66
    });
    loc.sites.push(site);
    var market = b.marketV1857;
    var shareGain = Math.min(18, Math.max(7, round(n(market.rivalShare) * .45)));
    market.share = clamp(n(market.share) + shareGain, 3, 85);
    market.rivalShare = clamp(18 + randInt(0, 9), 5, 70);
    market.rivalStrength = clamp(42 + randInt(0, 16), 10, 95);
    market.lastAcquireAge = round(n(stateNow().age));
    market.acquiredRivals = Math.max(0, round(market.acquiredRivals)) + 1;
    b.value = Math.max(0, round(n(b.value) + gate.cost * .55));
    b.reputation = clamp(n(b.reputation) + 6, 0, 100);
    b.rivalNameV1852 = "";
    b.locations = locationOpenCountV1857(b);
    addLocationHistoryV1857(b, "Acquired " + rival + " and absorbed " + site.archetype + ".", -paid.total);
    log("Acquired " + rival + ". Market share jumped to " + round(market.share) + "%.", { money: -paid.fromPersonal, confidence: 2 });
    saveRender();
  };

  window.applyBusinessLocationsYearV1857 = function (b, v, operatingIncome, deltas) {
    ensureBusiness(b);
    var loc = ensureLocationsV1857(b);
    var summary = locationSummaryV1857(b);
    var market = b.marketV1857;
    var income = 0;
    var closed = 0;
    var sprawl = Math.max(0, summary.sprawlRisk * 55);
    (loc.sites || []).forEach(function (site) {
      if (!site || site.status === "closed") return;
      site.years = Math.max(0, round(n(site.years) + 1));
      if (site.id === "hq") {
        site.demand = clamp(n(site.demand) + (n(market.share) - n(market.rivalShare)) / 60 + randInt(-1, 1), 0, 100);
        return;
      }
      var modelMult = site.model === "franchise" ? .42 : 1;
      var base = Math.max(2000, n(v && v.startup, locationCostBaseV1857(b)) * (.08 + n(site.tier) * .045));
      var health = clamp((n(site.quality) * .38 + n(site.staff) * .28 + n(site.demand) * .34) / 62, .35, 1.8);
      var marketMult = clamp(.76 + n(market.share) / 95, .72, 1.55);
      var ageMult = 1 + Math.min(6, n(site.years)) * .025;
      var roll = .86 + Math.random() * .28;
      var siteIncome = round(base * health * marketMult * ageMult * modelMult * roll);
      income += siteIncome;
      site.lastIncome = siteIncome;
      var strain = sprawl * (site.model === "franchise" ? .45 : 1);
      site.quality = clamp(n(site.quality) + randInt(-2, 2) - strain, 0, 100);
      site.staff = clamp(n(site.staff) + randInt(-2, 2) - strain * .8, 0, 100);
      site.demand = clamp(n(site.demand) + (n(market.share) - n(market.rivalShare)) / 80 + randInt(-2, 3), 0, 100);
      if ((n(site.quality) < 24 || n(site.demand) < 22) && chanceLocal(.1 + summary.sprawlRisk)) {
        site.status = "closed";
        site.lastIncome = 0;
        closed++;
        b.reputation = clamp(n(b.reputation) - 3, 0, 100);
        b.value = Math.max(0, round(n(b.value) * .985));
        addLocationHistoryV1857(b, site.name + " closed after quality and demand collapsed.", 0);
      }
    });
    var demandDrift = ((summary.avgDemand || 50) - 55) / 85;
    market.share = clamp(n(market.share) + demandDrift + summary.extraSites * .12 - n(market.rivalStrength) / 650 + (Math.random() * 1.3 - .55), 3, 85);
    market.rivalShare = clamp(n(market.rivalShare) + (n(market.rivalStrength) - 50) / 170 - demandDrift * .5 + (Math.random() * 1.2 - .55), 5, 70);
    market.rivalStrength = clamp(n(market.rivalStrength) + (n(market.rivalShare) > n(market.share) ? 1 : -1) + randInt(-1, 1), 10, 95);
    var effects = {
      income: round(income),
      riskAdd: summary.sprawlRisk + summary.rivalPressure,
      franchiseCut: summary.franchiseCut,
      closed: closed,
      openSites: locationOpenCountV1857(b),
      share: round(market.share),
      rivalShare: round(market.rivalShare)
    };
    b.locations = effects.openSites;
    b.lastLocationEffectsV1857 = effects;
    return effects;
  };

  function businessCashRetentionRateV1874(b, income) {
    ensureBusiness(b);
    var st = STRUCTURES[b.entityType] || STRUCTURES.soleprop;
    var rate = Math.max(0, n(st.retain));
    if (b.entityType === "soleprop") rate = Math.max(rate, .55);
    else if (b.entityType === "partnership") rate = Math.max(rate, .45);
    else rate = Math.max(rate, .35);
    if (n(b.value) < 1000000) rate = Math.max(rate, .60);
    var reserveTarget = Math.max(25000, Math.min(1500000, n(b.value) * .18 + Math.max(0, income) * .5));
    if (n(b.retainedEarnings) < reserveTarget) rate = Math.max(rate, .68);
    if (b.ops && b.ops.bookkeeper) rate += .03;
    if (b.ops && b.ops.manager) rate += .02;
    return clamp(rate, .25, .94);
  }

  function retainedAlreadyRecordedV1874(b, age) {
    var rows = Array.isArray(b.historyV1830) ? b.historyV1830 : [];
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i] || {};
      if (round(n(row.age)) !== round(n(age))) continue;
      if (row.action === "Entity year" || row.action === "Pass-through year") return Math.max(0, round(n(row.retained)));
    }
    return 0;
  }

  function reducePersonalDistributionV1874(f, amount) {
    amount = Math.max(0, round(amount));
    if (!amount || !f) return;
    var src = f.incomeSources || (f.incomeSources = {});
    var current = Math.max(0, round(n(src.businessDistributionsV1830)));
    var cut = Math.min(current, amount);
    if (cut) src.businessDistributionsV1830 = current - cut;
    var firm = Math.max(0, round(n(f.lastFirmDistribution)));
    f.lastFirmDistribution = Math.max(0, firm - cut);
    if (f.businessTaxV1830 && f.businessTaxV1830.distributions != null) {
      f.businessTaxV1830.distributions = Math.max(0, round(n(f.businessTaxV1830.distributions) - cut));
    }
  }

  function reconcileBusinessCashV1874(silent) {
    var s = ensureBusinessState();
    var f = s.finance || {};
    if (!f.businessCashV1874 || typeof f.businessCashV1874 !== "object") f.businessCashV1874 = { processedAges: {}, history: [] };
    var ledger = f.businessCashV1874;
    if (!ledger.processedAges || typeof ledger.processedAges !== "object") ledger.processedAges = {};
    if (!Array.isArray(ledger.history)) ledger.history = [];
    var age = round(n(s.age));
    var ageKey = String(age);
    if (ledger.processedAges[ageKey]) return false;
    var total = 0;
    var movedCount = 0;
    var touched = 0;
    businesses().forEach(function (b) {
      if (!b || isEntrepreneurPortV1862(b)) return;
      ensureBusiness(b);
      var income = round(n(b.lastIncome));
      if (income <= 0) return;
      touched++;
      var already = retainedAlreadyRecordedV1874(b, age);
      var target = Math.min(income, Math.max(0, round(income * businessCashRetentionRateV1874(b, income))));
      var extra = Math.max(0, target - already);
      if (!extra) return;
      var availableChecking = Math.max(0, round(n(s.money)));
      var moved = Math.min(extra, availableChecking);
      if (!moved) return;
      s.money = Math.max(0, round(n(s.money) - moved));
      b.retainedEarnings = Math.max(0, round(n(b.retainedEarnings) + moved));
      b._lastReserveSweepAgeV1874 = age;
      b._lastReserveSweepAmountV1874 = moved;
      if (!Array.isArray(b.historyV1830)) b.historyV1830 = [];
      b.historyV1830.unshift({
        age: age,
        action: "Company reserve sweep",
        amount: moved,
        income: income,
        targetRetained: target,
        alreadyRetained: already
      });
      b.historyV1830 = b.historyV1830.slice(0, 18);
      reducePersonalDistributionV1874(f, moved);
      total += moved;
      movedCount++;
    });
    if (!touched) return false;
    ledger.processedAges[ageKey] = true;
    ledger.lastReserveSweep = total;
    ledger.lastReserveAge = age;
    if (total) {
      ledger.history.unshift({ age: age, amount: total, businesses: movedCount, at: Date.now ? Date.now() : 0 });
      ledger.history = ledger.history.slice(0, 16);
      if (!silent) log("Company cash reserve kept " + compactMoney(total) + " inside operating businesses.", { money: -total });
    }
    return !!total;
  }
  window.businessCashRetentionRateV1874 = businessCashRetentionRateV1874;
  window.reconcileBusinessCashV1874 = reconcileBusinessCashV1874;

  var previousResolveV1874 = window.resolveLifeAndFinanceYear || (typeof resolveLifeAndFinanceYear === "function" ? resolveLifeAndFinanceYear : null);
  if (previousResolveV1874 && !window.__ledgerBusinessCashV1874Wrapped) {
    window.__ledgerBusinessCashV1874Wrapped = true;
    window.resolveLifeAndFinanceYear = function () {
      var out = previousResolveV1874.apply(this, arguments);
      try { reconcileBusinessCashV1874(false); } catch (e) { try { console.warn("v18.74 business cash reserve failed", e); } catch (ignore) {} }
      return out;
    };
    try { resolveLifeAndFinanceYear = window.resolveLifeAndFinanceYear; } catch (e) {}
  }

  window.setEntrepreneurshipPathV1841 = function (path) {
    var s = ensureBusinessState();
    var f = s.finance;
    path = FOUNDER_PATHS[path] ? path : "undecided";
    f.entrepreneurshipV1841.path = path;
    f.entrepreneurshipV1841.years = Math.max(0, round(f.entrepreneurshipV1841.years));
    f.entrepreneurshipV1841.lastChangedAge = round(s.age);
    if (path !== "undecided") {
      s.stats.confidence = clamp(n(s.stats.confidence) + 1, 0, 200);
      toast("Entrepreneurship path set: " + FOUNDER_PATHS[path].name + ".");
    }
    saveRender("entrepreneurship");
  };

  function addEnterpriseHistory(text, amount) {
    var s = ensureBusinessState();
    var fe = s.estateV1831.familyEnterpriseV1833;
    fe.history.unshift({ age: round(s.age), text: text, amount: round(amount), at: Date.now ? Date.now() : 0 });
    fe.history = fe.history.slice(0, 20);
  }

  function childrenOptions() {
    var s = ensureBusinessState();
    var out = [{ id: "none", name: "No named successor" }, { id: "professional", name: "Professional CEO / Trustee" }];
    Object.keys(s.relationships || {}).forEach(function (key) {
      var r = s.relationships[key];
      if (!r) return;
      var role = String(r.role || r.type || "").toLowerCase();
      if (/child|son|daughter|spouse|partner|wife|husband/.test(role)) out.push({ id: key, name: (r.name || key) + " (" + (r.role || "family") + ")" });
    });
    (Array.isArray(s.children) ? s.children : []).forEach(function (kid, index) {
      if (!kid) return;
      var id = kid.id || ("child_" + index);
      if (out.some(function (item) { return String(item.id) === String(id); })) return;
      out.push({ id: id, name: (kid.name || ("Child " + (index + 1))) + " (child)" });
    });
    return out;
  }

  function structureName(id) {
    return (STRUCTURES[id] || STRUCTURES.soleprop).name;
  }

  function riskFor(b) {
    return businessRiskBreakdown(b).risk;
  }

  function businessRiskBreakdown(b) {
    ensureBusiness(b);
    var v = catalogFor(b.id, b);
    var base = n(b.failureRisk, n(v.failureRisk, .14));
    var repCut = n(b.reputation) / 500;
    var ops = [
      { key: "manager", label: "Operator", cut: b.ops && b.ops.manager ? .04 : 0 },
      { key: "counsel", label: "Business counsel", cut: b.ops && b.ops.counsel ? .04 : 0 },
      { key: "insurance", label: "Insurance", cut: b.ops && b.ops.insurance ? .03 : 0 }
    ];
    var assetCut = businessAssetRiskCut(b);
    var sector = sectorRiskEffect(b);
    var portfolio = portfolioEffectsFor(b);
    var location = locationSummaryV1857(b);
    var opsCut = ops.reduce(function (sum, item) { return sum + n(item.cut); }, 0);
    var risk = clamp(base - repCut - opsCut - assetCut - n(sector.effect) - n(portfolio.riskCut) + n(location.sprawlRisk) + n(location.rivalPressure) - n(location.franchiseCut), .02, .7);
    return { risk: risk, base: base, reputationCut: repCut, ops: ops, assetCut: assetCut, sector: sector, portfolio: portfolio, location: location };
  }
  window.businessRiskBreakdownV1856 = businessRiskBreakdown;

  function riskLine(label, value, note, kind) {
    var sign = value > 0 ? "-" : value < 0 ? "+" : "";
    var shown = sign + Math.abs(Math.round(value * 100)) + "%";
    return '<div class="v1856-risk-line ' + esc(kind || "") + '"><span>' + esc(label) + '</span><b>' + esc(shown) + '</b><em>' + esc(note || "") + '</em></div>';
  }

  function riskPanel(b) {
    var rb = businessRiskBreakdown(b);
    var sector = rb.sector || {};
    var sectorMeta = sector.meta;
    var sectorKind = n(sector.effect) >= 0 ? "good" : "bad";
    var lines = [
      riskLine("Base pressure", -rb.base, "Baseline failure pressure for this venture type.", "bad"),
      riskLine("Reputation cushion", rb.reputationCut, "Reputation lowers yearly failure pressure.", "good")
    ];
    rb.ops.forEach(function (item) {
      if (item.cut) lines.push(riskLine(item.label, item.cut, "Operations support lowers pressure.", "good"));
    });
    if (rb.assetCut) lines.push(riskLine("Asset stability", rb.assetCut, "Better location, equipment, and staff lower pressure.", "good"));
    if (sectorMeta) lines.push(riskLine(sectorMeta.label, n(sector.effect), n(sector.effect) >= 0 ? sectorMeta.down : sectorMeta.up, sectorKind));
    if (rb.portfolio.riskCut) lines.push(riskLine("Diversification", rb.portfolio.riskCut, rb.portfolio.sectorCount + " sectors owned lowers portfolio-wide pressure.", "good"));
    if (rb.portfolio.incomeBonus) lines.push('<div class="v1856-risk-line gold"><span>Franchise effect</span><b>+' + Math.round(rb.portfolio.incomeBonus * 100) + '% income</b><em>' + esc(rb.portfolio.sameSectorCount + " companies in this sector boost yearly income and reputation.") + '</em></div>');
    if (rb.location && rb.location.sprawlRisk) lines.push(riskLine("Location sprawl", -rb.location.sprawlRisk, rb.location.openSites + " open sites strain staff, systems, and quality.", "bad"));
    if (rb.location && rb.location.franchiseCut) lines.push(riskLine("Franchise controls", rb.location.franchiseCut, rb.location.franchiseSites + " partner sites lower owned-operator pressure.", "good"));
    if (rb.location && rb.location.rivalPressure) lines.push(riskLine("Rival pressure / market share", -rb.location.rivalPressure, rb.location.rivalName + " controls " + round(rb.location.rivalShare) + "% vs your " + round(rb.location.share) + "%.", "bad"));
    return '<div class="v1856-risk-panel"><div class="v1856-risk-head"><span>Risk line items</span><b class="' + (rb.risk >= .24 ? "bad" : rb.risk <= .08 ? "good" : "gold") + '">' + pct(rb.risk) + '</b></div>' + lines.join("") + '</div>';
  }

  var STAGE_ICONS = { startup: "🌱", growing: "📈", breakout: "🚀" };
  var CATEGORY_ICONS = {
    // v18.35 clean sectors (10)
    "Food & Drink": "🍔", "Nightlife & Events": "🌙", "Retail & Commerce": "🛍️", "Trades & Services": "🔧",
    "Media & Entertainment": "🎬", "Tech & Startups": "💻", "Finance & Professional": "💼",
    "Real Estate & Property": "🏢", "Health & Wellness": "🩺", "Logistics & Industrial": "🚚",
    // legacy category labels kept for back-compat with old saves
    "Services": "🔧", "Hospitality": "🍔", "Nightlife": "🍺", "Aviation": "✈️", "Print + Media": "🖨️",
    "Media": "📰", "Local Services": "🏘️", "Logistics": "🚐", "Holdings": "🏦", "Business": "💼", "Venture": "🚀",
    "Tech": "💻", "Consulting": "📊", "Finance": "💰", "Real Estate": "🏰", "Entertainment": "🎬", "Retail": "📦", "Healthcare": "🩺"
  };

  function sectorSort(list) {
    try {
      var ord = window.SECTOR_ORDER;
      if (ord && ord.length) {
        list.sort(function (a, b) {
          var ia = ord.indexOf(a); var ib = ord.indexOf(b);
          if (ia < 0) ia = 999; if (ib < 0) ib = 999;
          return ia - ib;
        });
      }
    } catch (e) {}
    return list;
  }

  function stageIcon(stage) {
    return STAGE_ICONS[stage] || STAGE_ICONS.startup;
  }

  function categoryIcon(category) {
    return CATEGORY_ICONS[category] || "🏪";
  }

  function reputationBar(value) {
    var pctValue = Math.max(0, Math.min(100, Math.round(n(value))));
    var kind = pctValue >= 65 ? "high" : pctValue < 35 ? "low" : "";
    return '<div class="bar"><div class="fill ' + kind + '" style="width:' + pctValue + '%"></div></div>';
  }

  function meterBar(value, barClass) {
    var pctValue = Math.max(0, Math.min(100, Math.round(n(value))));
    return '<div class="bar"><div class="fill ' + esc(barClass || "") + '" style="width:' + pctValue + '%"></div></div>';
  }

  // The sector's signature running meter (Health Rating / Buzz / MRR / AUM / ...).
  function sectorMeterRow(b) {
    var info = null;
    try { if (typeof window.sectorMeterInfoV1851 === "function") info = window.sectorMeterInfoV1851(b); } catch (e) {}
    if (!info) return "";
    var used = !!(stateNow().actionsTaken || {})["sector_action_" + b.id];
    var multClass = info.kind === "good" ? "good" : info.kind === "bad" ? "bad" : "gold";
    return '<div class="row v1851-sector-meter"><div style="flex:1">' +
      '<div class="row-title">' + esc(info.icon) + ' ' + esc(info.label) + ': ' + round(info.value) + '/100 ' +
      '<span class="' + multClass + '" style="font-size:11px;font-weight:600">· ' + esc(info.multLabel) + '</span></div>' +
      '<div class="row-sub">' + meterBar(info.value, info.barClass) + '</div>' +
      '<div class="row-sub">' + esc(info.note) + '</div>' +
      '<div class="v1840-action-strip" style="margin-top:8px">' +
      actionButton(info.actionIcon + " " + info.actionLabel + " (" + compactMoney(info.actionCost) + ")", "runSectorActionV1851('" + esc(b.id) + "')", "blue", used || typeof window.runSectorActionV1851 !== "function") +
      '</div></div></div>';
  }

  function metric(label, value, note, kind) {
    return '<div class="v1840-metric ' + esc(kind || "") + '"><span>' + esc(label) + '</span><b>' + esc(value) + '</b><em>' + esc(note || "") + '</em></div>';
  }

  function hero() {
    var s = ensureBusinessState();
    var list = businesses();
    var last = n(s.finance.lastEntrepreneurIncome || s.finance.lastBusinessIncome);
    var score = enterpriseScore();
    var p = list[0] ? portfolioEffectsFor(list[0]) : { summary: "No portfolio bonus yet" };
    return '<section class="v1840-hero"><div><div class="section-label">💼 Business command center</div><h2>Business Office</h2><p>Companies, entity cash, owner payouts, business taxes, acquisitions, family enterprise, trust ownership, and succession live in one cleaner desk.</p><div class="v1840-chip-row">' +
      '<span>' + list.length + ' businesses</span><span class="' + (last >= 0 ? "good" : "bad") + '">Last income ' + signedMoney(last) + '</span><span>Company cash ' + compactMoney(totalCompanyCash()) + '</span><span>' + esc(p.summary) + '</span><span class="' + (legalTrustActive() ? "good" : "gold") + '">' + (legalTrustActive() ? "Trust active" : "No trust") + '</span><span>Dynasty ' + score + '/100</span>' +
      '</div></div><strong>' + compactMoney(totalBusinessValue()) + '<span>business value</span></strong></section>';
  }

  function kpis() {
    var list = businesses();
    var p = list[0] ? portfolioEffectsFor(list[0]) : { summary: "Own businesses to unlock.", sectorCount: 0 };
    return '<section class="v1840-kpi-row">' +
      metric("💰 Company value", compactMoney(totalBusinessValue()), "Business value plus company cash.", "gold") +
      metric("🏦 Company cash", compactMoney(totalCompanyCash()), "Money inside companies, not personal checking.", "good") +
      metric("⚠️ Entity tax debt", compactMoney(totalEntityDebt()), "Taxes owed by companies.", totalEntityDebt() ? "bad" : "good") +
      metric("📋 Compliance due", compactMoney(totalCompliance()), "Admin/legal bills paid from company cash.", totalCompliance() ? "gold" : "good") +
      metric("🏛️ Trust stake", compactMoney(trustBusinessValue()), "Business ownership titled to family trust.", trustBusinessValue() ? "good" : "gold") +
      metric("Portfolio edge", list.length ? p.summary : "None yet", "Same-sector holdings franchise; 3+ sectors diversify risk.", list.length > 1 ? "good" : "gold") +
      '</section>';
  }

  function founderMode() {
    var s = ensureBusinessState();
    var hasBiz = businesses().length > 0;
    return '<section class="panel v1840-founder-mode"><div class="section-label">🧭 Founder mode</div><div class="v1840-mode-grid">' +
      '<div class="' + (!s.finance.businessCareer ? "active " : "") + 'v1840-mode-card"><span>Side entrepreneur</span><b>Keep career income</b><em>Lower upside, lower pressure. Useful while building the first company.</em>' + actionButton("Use Side Path", "leaveEntrepreneurFullTime()", "", !s.finance.businessCareer || typeof window.leaveEntrepreneurFullTime !== "function") + '</div>' +
      '<div class="' + (s.finance.businessCareer ? "active " : "") + 'v1840-mode-card"><span>Full-time founder</span><b>Business becomes career</b><em>Higher business upside and stress. Better when portfolio has traction.</em>' + actionButton("Go Full-Time", "goEntrepreneurFullTime()", "gold", s.age < 18 || s.finance.businessCareer || !hasBiz || typeof window.goEntrepreneurFullTime !== "function") + '</div>' +
      '</div></section>';
  }

  function businessRail() {
    var list = businessesVisibleV1862();
    if (!list.length) {
      return '<section class="panel v1840-business-rail"><div class="section-label">🏢 Owned companies</div><div class="v1840-empty">No business yet. Use the launch or acquisition rail below when you meet the requirements.</div></section>';
    }
    var focus = focusBusiness();
    var cards = list.map(function (b) {
      ensureBusiness(b);
      var risk = riskFor(b);
      var pf = portfolioEffectsFor(b);
      var selected = focus && String(focus.id) === String(b.id);
      return '<button class="v1840-company-card ' + (selected ? "selected" : "") + '" onclick="event.preventDefault();event.stopPropagation();setBusinessFocusV1840(\'' + esc(b.id) + '\')">' +
        '<span>' + categoryIcon(b.category) + ' ' + esc(b.category || "Business") + '</span><b>' + esc(b.name) + '</b><em>' + stageIcon(b.stage) + ' ' + esc(structureName(b.entityType)) + ' / ' + esc(b.stage || "startup") + ' / ' + round(b.years) + ' yrs</em>' +
        reputationBar(b.reputation) +
        '<div class="v1840-company-stats"><i>' + compactMoney(businessValue(b)) + '</i><i>' + compactMoney(b.retainedEarnings) + ' cash</i><i class="' + (risk >= .24 ? "bad" : risk <= .08 ? "good" : "gold") + '">' + pct(risk) + ' risk</i><i class="' + (pf.incomeBonus || pf.riskCut ? "good" : "gold") + '">' + esc(pf.summary) + '</i></div>' +
        '</button>';
    }).join("");
    return '<section class="panel v1840-business-rail"><div class="v1840-panel-head"><div><div class="section-label">🏢 Owned companies</div><h3>Portfolio rail</h3></div><span>Click a company to focus details below.</span></div><div class="v1840-rail">' + cards + '</div></section>';
  }

  function assetRows(b) {
    return Object.keys(ASSET_SLOTS).map(function (slotKey) {
      var slot = ASSET_SLOTS[slotKey];
      var tierIndex = Math.min(n(b.assets[slotKey]), slot.tiers.length - 1);
      var current = slot.tiers[tierIndex];
      var next = slot.tiers[tierIndex + 1];
      var v = catalogFor(b.id, b);
      var currentName = tierLabel(b, slotKey, tierIndex, current.name);
      if (!next) {
        return '<div class="row"><div><div class="row-title">' + slot.icon + ' ' + esc(slot.label) + ': ' + esc(currentName) + ' (max)</div><div class="row-sub">' + esc(current.desc) + '</div></div><button class="icon-btn" disabled>Maxed</button></div>';
      }
      var nextName = tierLabel(b, slotKey, tierIndex + 1, next.name);
      var cost = assetTierCost(slotKey, tierIndex + 1, v);
      var afford = n(b.retainedEarnings) + n(stateNow().money) >= cost;
      return '<div class="row"><div><div class="row-title">' + slot.icon + ' ' + esc(slot.label) + ': ' + esc(currentName) + '</div><div class="row-sub">Next: ' + esc(nextName) + ' - ' + esc(next.desc) + ' - +' + Math.round(n(next.incomeBonus) * 100) + '% income' + (next.riskCut ? ', -' + Math.round(n(next.riskCut) * 100) + '% risk' : '') + (next.repBonus ? ', faster reputation' : '') + '</div></div><button class="icon-btn" onclick="event.preventDefault();event.stopPropagation();upgradeBusinessAssetV1850(\'' + esc(b.id) + '\',\'' + slotKey + '\')" ' + (afford && typeof window.upgradeBusinessAssetV1850 === "function" ? "" : "disabled") + '>' + compactMoney(cost) + '</button></div>';
    }).join("");
  }

  function assetHistoryFeed(b) {
    var rows = (b.assetHistoryV1850 || []).slice(0, 5);
    if (!rows.length) return '<div class="v1840-note">No asset upgrades yet.</div>';
    return rows.map(function (h) {
      return '<div class="row"><div><div class="row-title">' + esc(h.icon || "🏗️") + ' ' + esc(h.event || "Asset upgrade") + '</div><div class="row-sub">Age ' + esc(h.age == null ? "?" : h.age) + ' - ' + compactMoney(h.cost || 0) + '</div></div></div>';
    }).join("");
  }

  function eventHistoryFeed(b) {
    var rows = (b.eventHistoryV1850 || []).slice(0, 5);
    if (!rows.length) return '<div class="v1840-note">No market events yet. They happen occasionally as the business ages.</div>';
    return rows.map(function (h) {
      return '<div class="row"><div><div class="row-title">' + esc(h.icon || "📰") + ' ' + esc(h.event || "Market event") + '</div><div class="row-sub">Age ' + esc(h.age == null ? "?" : h.age) + '</div></div></div>';
    }).join("");
  }

  function locationsPanelV1857(b) {
    ensureBusiness(b);
    var loc = ensureLocationsV1857(b);
    var summary = locationSummaryV1857(b);
    var profile = locationProfileV1857(b);
    var market = b.marketV1857 || {};
    var ageNow = round(n(stateNow().age));
    var ownedGate = canOpenLocationV1857(b, "owned");
    var franchiseGate = canOpenLocationV1857(b, "franchise");
    var acquireGate = canAcquireRivalV1857(b);
    var nextType = nextLocationArchetypeV1857(b);
    var competeUsed = round(market.lastCompeteAge) === ageNow;
    var siteCards = (loc.sites || []).map(function (site) {
      var closed = site.status === "closed";
      var upgradeCost = upgradeLocationCostV1857(b, site);
      var supportCost = supportLocationCostV1857(b, site);
      return '<div class="v1857-site-card ' + (closed ? "closed" : "") + '">' +
        '<span>' + esc(site.model === "franchise" ? "Franchise partner" : "Company-owned") + '</span>' +
        '<b>' + esc(site.name) + '</b>' +
        '<em>' + esc(site.archetype) + ' / Tier ' + round(site.tier) + ' / ' + round(site.years) + ' yrs' + (closed ? ' / Closed' : '') + '</em>' +
        '<div class="v1857-site-stats"><i>Quality ' + round(site.quality) + '</i><i>Staff ' + round(site.staff) + '</i><i>Demand ' + round(site.demand) + '</i><i>' + compactMoney(site.lastIncome) + '/yr</i></div>' +
        '<div class="v1840-action-strip">' +
        actionButton("Upgrade " + compactMoney(upgradeCost), "upgradeBusinessLocationV1857('" + esc(b.id) + "','" + esc(site.id) + "')", "gold", closed || n(site.tier) >= 3) +
        actionButton("Systems " + compactMoney(supportCost), "supportBusinessLocationV1857('" + esc(b.id) + "','" + esc(site.id) + "','quality')", "blue", closed) +
        actionButton("Staff", "supportBusinessLocationV1857('" + esc(b.id) + "','" + esc(site.id) + "','staff')", "", closed) +
        actionButton("Demand", "supportBusinessLocationV1857('" + esc(b.id) + "','" + esc(site.id) + "','demand')", "green", closed) +
        actionButton("Close", "closeBusinessLocationV1857('" + esc(b.id) + "','" + esc(site.id) + "')", "red", closed || String(site.id) === "hq") +
        '</div></div>';
    }).join("");
    var historyRows = (loc.history || []).slice(0, 4).map(function (h) {
      return '<div class="v1857-history-row"><span>Age ' + esc(h.age) + '</span><b>' + esc(h.text) + '</b><em>' + (n(h.amount) ? signedMoney(h.amount) : "") + '</em></div>';
    }).join("") || '<div class="v1840-note">No location moves yet.</div>';
    return '<div class="v1857-location-panel">' +
      '<div class="v1840-panel-head"><div><div class="section-label">Network + market share</div><h3>' + esc(profile.label) + '</h3><p>Open sector-specific sites, sign franchise partners, fight ' + esc(summary.rivalName) + ', or acquire the rival outright.</p></div><strong>' + round(summary.share) + '%<span>market share</span></strong></div>' +
      '<div class="v1840-metric-grid">' +
      metric("Open sites", String(summary.openSites), summary.ownedSites + " owned / " + summary.franchiseSites + " franchise.", summary.openSites >= 3 ? "good" : "gold") +
      metric("Location income", signedMoney(summary.lastIncome), "Added by extra sites last year. HQ is the base business.", n(summary.lastIncome) >= 0 ? "good" : "bad") +
      metric("Network health", round((summary.avgQuality + summary.avgStaff + summary.avgDemand) / 3) + "/100", "Quality " + summary.avgQuality + ", staff " + summary.avgStaff + ", demand " + summary.avgDemand + ".", summary.avgQuality >= 60 && summary.avgStaff >= 60 ? "good" : "gold") +
      metric("Rival", summary.rivalName, round(summary.rivalShare) + "% share / strength " + round(summary.rivalStrength) + ".", summary.rivalShare > summary.share ? "bad" : "gold") +
      '</div>' +
      '<div class="v1857-market-actions"><div><span>Next site</span><b>' + esc(nextType) + '</b><em>' + (ownedGate.ok ? "Owned site ready." : ownedGate.reason) + '</em></div><div class="v1840-action-strip">' +
      actionButton("Open Owned " + compactMoney(ownedGate.cost), "openBusinessLocationV1857('" + esc(b.id) + "','owned')", "gold", !ownedGate.ok) +
      actionButton("Sign Franchise " + compactMoney(franchiseGate.cost), "openBusinessLocationV1857('" + esc(b.id) + "','franchise')", "green", !franchiseGate.ok) +
      actionButton(profile.compete + " " + compactMoney(competeCostV1857(b)), "competeBusinessMarketShareV1857('" + esc(b.id) + "')", "blue", competeUsed) +
      actionButton(profile.acquire + " " + compactMoney(acquireGate.cost), "acquireBusinessRivalV1857('" + esc(b.id) + "')", "red", !acquireGate.ok) +
      '</div></div>' +
      '<div class="v1857-site-grid">' + siteCards + '</div>' +
      '<div class="v1857-location-history"><div class="section-label">Location history</div>' + historyRows + '</div>' +
      '</div>';
  }

  // ---- Focused company: pick one from the rail, then page its own mini-tabs --------------
  // Overview (at-a-glance + actions + popups), Capital (all money), Network (sites/market share).
  var COMPANY_TABS_V1862 = [["overview", "Overview"], ["trends", "Trends"], ["capital", "Capital"], ["network", "Network"]];
  function companyTabV1862() {
    var office = businessOfficeV1862();
    var t = String(office.companyTabV1862 || "overview").toLowerCase();
    if (!COMPANY_TABS_V1862.some(function (x) { return x[0] === t; })) t = "overview";
    office.companyTabV1862 = t;
    return t;
  }
  window.setCompanyTabV1862 = function (tab) {
    var office = businessOfficeV1862();
    var t = String(tab || "overview").toLowerCase();
    if (!COMPANY_TABS_V1862.some(function (x) { return x[0] === t; })) t = "overview";
    office.companyTabV1862 = t;
    saveRender("business");
  };

  function companyOverviewBodyV1862(b) {
    var eid = esc(b.id);
    var signatureAction = ventureSignatureAction(b);
    var signatureUsed = !!(stateNow().actionsTaken || {})["venture_signature_" + b.id];
    var secondAction = ventureSecondAction(b);
    var secondUsed = !!(stateNow().actionsTaken || {})["venture_second_" + b.id];
    var riskNow = riskFor(b);
    var riskKind = riskNow >= .24 ? "bad" : riskNow <= .08 ? "good" : "gold";
    var repKind = b.reputation >= 65 ? "good" : b.reputation < 35 ? "bad" : "gold";
    return '<div class="v1840-metric-grid">' +
      metric("Company cash", compactMoney(b.retainedEarnings), "Inside the business.", "good") +
      metric("Last income", signedMoney(b.lastIncome), n(b.lastEnterpriseYieldV1851) > 0 ? "Ops + " + compactMoney(b.lastEnterpriseYieldV1851) + " yield." : "Last year's result.", n(b.lastIncome) >= 0 ? "good" : "bad") +
      metric("Auto dividend / yr", compactMoney(b.lastDividend), n(b.lastDividend) > 0 ? "Paid to checking yearly." : "Reach Growing stage to unlock.", n(b.lastDividend) > 0 ? "good" : "gold") +
      metric("⭐ Reputation", round(b.reputation) + "/100", "Lowers risk; speeds growth.", repKind) +
      '</div>' +
      '<details class="v1840-disc v1840-risk-disc"><summary><span>⚠️ Failure risk</span><b class="' + riskKind + '">' + pct(riskNow) + '</b><i>breakdown</i></summary>' + riskPanel(b) + '</details>' +
      sectorMeterRow(b) +
      (typeof window.renderBizChallengesPanelV1853 === "function" ? window.renderBizChallengesPanelV1853(b) : "") +
      '<div class="v1840-action-strip v1840-primary-actions">' +
      actionButton("Work", "workVenture('" + eid + "')", "blue", typeof window.workVenture !== "function" || (stateNow().actionsTaken || {})["venture_" + b.id]) +
      actionButton("Market", "bizAction('" + eid + "','market')", "blue", typeof window.bizAction !== "function" || (stateNow().actionsTaken || {})["biz_" + b.id + "_market"]) +
      actionButton("Upgrade", "bizAction('" + eid + "','equipment')", "gold", typeof window.bizAction !== "function" || (stateNow().actionsTaken || {})["biz_" + b.id + "_equipment"]) +
      (signatureAction ? actionButton(signatureAction.icon + " " + signatureAction.label, "runVentureSignatureActionV1850('" + eid + "')", "gold", signatureUsed || typeof window.runVentureSignatureActionV1850 !== "function") : "") +
      (secondAction ? actionButton(secondAction.icon + " " + secondAction.label, "runVentureSecondActionV1852('" + eid + "')", "green", secondUsed || typeof window.runVentureSecondActionV1852 !== "function") : "") +
      actionButton("Sell", "sellVenture('" + eid + "')", "red", typeof window.sellVenture !== "function") +
      '</div>' +
      '<div class="section-label v1840-manage-label">⚙️ Manage</div>' +
      '<div class="v1840-manage-grid">' +
      manageBtn("🏗️ Structure", b.id, "structure") +
      manageBtn("👥 Team", b.id, "team") +
      manageBtn("🛠️ Assets", b.id, "assets") +
      manageBtn("👨‍👩‍👧 Family", b.id, "family") +
      '</div>';
  }

  // Capital sub-tab: all money in one place (founder capital, company cash, taxes) inline.
  function companyCapitalBodyV1862(b) {
    return '<div class="section-label">💰 Founder capital</div>' + bizCapitalBodyV1862(b) +
      '<div class="section-label" style="margin-top:14px">💵 Company cash</div>' + bizCashBodyV1862(b) +
      '<div class="section-label" style="margin-top:14px">🧾 Taxes &amp; compliance</div>' + bizTaxesBodyV1862(b);
  }

  // Tiny inline SVG sparkline (area + line). vals = array of numbers, oldest→newest.
  function sparkSVGV1862(vals, color) {
    vals = (vals || []).map(function (x) { return n(x); });
    if (vals.length < 2) return '<div class="v1840-note">Not enough history yet — play a few more years.</div>';
    var w = 100, h = 34, min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    var span = max - min || 1;
    var pts = vals.map(function (v, i) {
      var x = (i / (vals.length - 1)) * w;
      var y = h - ((v - min) / span) * (h - 4) - 2;
      return x.toFixed(1) + "," + y.toFixed(1);
    });
    var line = pts.join(" ");
    var area = "0," + h + " " + line + " " + w + "," + h;
    color = color || "#8faf6c";
    return '<svg class="v1840-spark" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none">' +
      '<polygon points="' + area + '" fill="' + color + '" opacity="0.14"/>' +
      '<polyline points="' + line + '" fill="none" stroke="' + color + '" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>';
  }

  function trendCardV1862(label, vals, latestText, color) {
    return '<div class="v1840-trend-card"><div class="v1840-trend-head"><span>' + esc(label) + '</span><b>' + esc(latestText) + '</b></div>' + sparkSVGV1862(vals, color) + '</div>';
  }

  // Trends sub-tab: value / income / reputation graphs from the yearly history (historyV1862).
  function companyTrendsBodyV1862(b) {
    var hist = Array.isArray(b.historyV1862) ? b.historyV1862 : [];
    if (hist.length < 2) {
      return '<div class="v1840-empty">📈 No trend history yet for <b>' + esc(b.name) + '</b>. Age up a few years and value, income, and reputation will chart here.</div>';
    }
    var values = hist.map(function (h) { return n(h.value); });
    var incomes = hist.map(function (h) { return n(h.income); });
    var reps = hist.map(function (h) { return n(h.rep); });
    var lastV = values[values.length - 1], firstV = values[0];
    var growth = firstV > 0 ? Math.round(((lastV - firstV) / firstV) * 100) : 0;
    return '<div class="v1840-note">Last ' + hist.length + ' years · company value ' + (growth >= 0 ? "▲ +" : "▼ ") + Math.abs(growth) + '% over the tracked period.</div>' +
      '<div class="v1840-trend-grid">' +
      trendCardV1862("Company value", values, compactMoney(lastV), "#f0ca7b") +
      trendCardV1862("Yearly income", incomes, signedMoney(incomes[incomes.length - 1]), incomes[incomes.length - 1] >= 0 ? "#8faf6c" : "#e9927d") +
      trendCardV1862("Reputation", reps, round(reps[reps.length - 1]) + "/100", "#7ea0ac") +
      '</div>';
  }

  function focusDesk() {
    var b = focusBusiness();
    if (!b) return '<div class="v1840-empty">No company selected yet. Pick one above, or use <b>+ New Business</b> below to start or buy one.</div>';
    ensureBusiness(b);
    var st = STRUCTURES[b.entityType] || STRUCTURES.soleprop;
    var tab = companyTabV1862();
    var tabBar = '<div class="biz1862-tabs v1840-company-tabs">' + COMPANY_TABS_V1862.map(function (p) {
      return '<button class="biz1862-tab ' + (tab === p[0] ? "selected" : "") + '" onclick="event.preventDefault();event.stopPropagation();setCompanyTabV1862(\'' + p[0] + '\')">' + esc(p[1]) + '</button>';
    }).join("") + '</div>';
    var body = tab === "capital" ? companyCapitalBodyV1862(b) : tab === "network" ? locationsPanelV1857(b) : tab === "trends" ? companyTrendsBodyV1862(b) : companyOverviewBodyV1862(b);
    return '<section class="panel v1840-focus-desk"><div class="v1840-panel-head"><div><div class="section-label">🎯 Focused company</div><h3>' + stageIcon(b.stage) + ' ' + esc(b.name) + '</h3><p>' + esc(st.desc) + '</p></div><strong>' + compactMoney(businessValue(b)) + '<span>' + esc(structureName(b.entityType)) + '</span></strong></div>' +
      tabBar +
      '<div class="v1840-company-body">' + body + '</div>' +
      '</section>';
  }

  function manageBtn(label, bizId, kind) {
    return '<button class="v1840-manage-btn" onclick="event.preventDefault();event.stopPropagation();openBizModalV1862(\'' + esc(bizId) + '\',\'' + esc(kind) + '\')">' + label + '</button>';
  }

  function newBusinessButtonV1862() {
    return '<div class="v1840-newbiz-row"><button class="v1840-newbiz-btn" onclick="event.preventDefault();event.stopPropagation();openBizModalV1862(\'\',\'new\')">＋ New Business</button></div>';
  }

  // Start/buy from the New Business popup, then CLOSE it and drop the player onto the new
  // company focused — instead of leaving them staring at the catalog with no feedback.
  function focusNewestV1862(beforeIds, preferredId) {
    var list = businesses();
    var fresh = list.filter(function (b) { return beforeIds.indexOf(String(b.id)) < 0; });
    var nb = (preferredId && businessById(preferredId)) || fresh[fresh.length - 1] || list[list.length - 1];
    if (nb) {
      var office = businessOfficeV1862();
      office.focusId = nb.id;
      office.companyTabV1862 = "overview";
    }
    return nb;
  }
  window.startVentureV1862 = function (id) {
    var before = businesses().map(function (b) { return String(b.id); });
    businessCatalog();
    if (typeof window.startVenture === "function") window.startVenture(id);
    if (businesses().length > before.length) { focusNewestV1862(before, id); window.closeBizModalV1862(); saveRender("business"); }
  };
  window.buyCompanyV1862 = function (id) {
    var before = businesses().map(function (b) { return String(b.id); });
    businessCatalog();
    acquisitionCatalog();
    if (typeof window.buyCompany === "function") window.buyCompany(id);
    if (businesses().length > before.length) { focusNewestV1862(before, null); window.closeBizModalV1862(); saveRender("business"); }
  };

  // ---- New Business popup: clean vertical grid (NO horizontal rails / double-scroll),
  //      a scratch/buy toggle, search + category filter. Click a card to start/buy.
  window.setNewBizModeV1862 = function (mode) {
    window.__ledgerNewBizModeV1862 = mode === "buy" ? "buy" : "scratch";
    saveRender("business");
  };
  function newVentureCardV1862(v, owned, s) {
    var exists = owned.some(function (b) { return String(b.id) === String(v.id); });
    var missing = [];
    var minAge = businessMinAgeV1872(v);
    if (n(s.age) < minAge) missing.push("Age " + minAge + "+");
    if (n(s.money) < n(v.startup)) missing.push(compactMoney(v.startup) + " cash");
    if (exists) missing.push("Owned");
    var ready = !missing.length;
    var risk = n(v.failureRisk, .12);
    var riskTag = risk >= .30 ? '<i class="bad">High risk</i>' : risk >= .18 ? '<i class="gold">Medium risk</i>' : '<i class="good">Low risk</i>';
    var hay = esc(String((v.name || "") + " " + (v.desc || "") + " " + (v.category || "")).toLowerCase());
    return '<button class="v1840-launch-card ' + (ready ? "ready" : "") + '" data-launch-card="1" data-group="' + esc(v.category || "Business") + '" data-search="' + hay + '" onclick="event.preventDefault();event.stopPropagation();startVentureV1862(\'' + esc(v.id) + '\')" ' + (!ready || typeof window.startVenture !== "function" ? "disabled" : "") + '><span>' + categoryIcon(v.category) + ' ' + esc(v.category || "Business") + '</span><b>' + esc(v.name || v.id) + '</b><em>' + esc(v.desc || "Business path.") + '</em><div class="v1840-company-stats">' + riskTag + '</div><strong>' + (ready ? "Start " + compactMoney(v.startup) : missing.join(" / ")) + '</strong></button>';
  }
  function bizNewBusinessBodyV1862() {
    var s = ensureBusinessState();
    var filter = launchFilterState();
    var owned = businesses();
    var mode = String(window.__ledgerNewBizModeV1862 || "scratch");
    var toggle = '<div class="biz1862-tabs v1840-company-tabs">' +
      '<button class="biz1862-tab ' + (mode === "scratch" ? "selected" : "") + '" onclick="event.preventDefault();event.stopPropagation();setNewBizModeV1862(\'scratch\')">🚀 Start from scratch</button>' +
      '<button class="biz1862-tab ' + (mode === "buy" ? "selected" : "") + '" onclick="event.preventDefault();event.stopPropagation();setNewBizModeV1862(\'buy\')">🤝 Buy existing</button>' +
      '</div>';
    if (mode === "buy") {
      var acq = acquisitionMarketV1862();
      var acards = acq.map(function (v) {
        var price = n(v.buy || n(v.startup) * 2 || 50000);
        var missing = [];
        var minAge = businessMinAgeV1872(v);
        if (n(s.age) < minAge) missing.push("Age " + minAge + "+");
        if (n(s.money) < price) missing.push(compactMoney(price) + " cash");
        var ready = !missing.length;
        return '<button class="v1840-launch-card ' + (ready ? "ready" : "") + '" onclick="event.preventDefault();event.stopPropagation();buyCompanyV1862(\'' + esc(v.id) + '\')" ' + (!ready || typeof window.buyCompany !== "function" ? "disabled" : "") + '><span>' + categoryIcon(v.category) + ' ' + esc(v.category || "Acquisition") + '</span><b>' + esc(v.name || v.id) + '</b><em>' + esc(v.desc || "Buy an existing company.") + '</em><strong>' + (ready ? "Buy ~" + compactMoney(price) : missing.join(" / ")) + '</strong></button>';
      }).join("");
      return toggle + '<div class="v1840-newbiz-grid">' + (acards || '<div class="v1840-empty">No companies for sale right now.</div>') + '</div>';
    }
    var fullCatalog = businessCatalog().filter(function (v) { return v && v.id && String(v.id).indexOf("acq_") !== 0; });
    if (!fullCatalog.length) return toggle + '<div class="v1840-empty">No ventures available yet.</div>';
    var catMinCost = {};
    fullCatalog.forEach(function (v) { var c = v.category || "Business"; var sc = n(v.startup); if (catMinCost[c] == null || sc < catMinCost[c]) catMinCost[c] = sc; });
    var byCheap = function (a, b) { return n(catMinCost[a]) - n(catMinCost[b]); };
    var categories = Object.keys(catMinCost).sort(byCheap);
    var catOptions = '<option value="all"' + (filter.category === "all" ? " selected" : "") + '>All categories</option>' + categories.map(function (c) { return '<option value="' + esc(c) + '"' + (filter.category === c ? " selected" : "") + '>' + esc(categoryIcon(c)) + ' ' + esc(c) + '</option>'; }).join("");
    var controls = '<div class="v1840-launch-controls"><input type="text" placeholder="🔍 Search ventures..." value="' + esc(filter.search) + '" oninput="setLaunchSearchV1850(this.value)"><select onchange="setLaunchFilterV1850(\'category\', this.value)">' + catOptions + '</select></div>';
    var shown = filter.category === "all" ? fullCatalog : fullCatalog.filter(function (v) { return (v.category || "Business") === filter.category; });
    var groups = {}, order = [];
    shown.forEach(function (v) { var c = v.category || "Business"; if (!groups[c]) { groups[c] = []; order.push(c); } groups[c].push(v); });
    order.sort(byCheap);
    var sections = order.map(function (c) {
      groups[c].sort(function (a, b) { return n(a.startup) - n(b.startup); });
      return '<div class="v1840-launch-group" data-launch-group="' + esc(c) + '"><div class="v1840-launch-group-label">' + categoryIcon(c) + ' ' + esc(c) + '</div><div class="v1840-newbiz-grid">' + groups[c].map(function (v) { return newVentureCardV1862(v, owned, s); }).join("") + '</div></div>';
    }).join("");
    return toggle + controls + (sections || '<div class="v1840-empty">No ventures match that search.</div>');
  }

  // ---- management popup bodies (lifted from the old inline focus desk) -------
  function bizCashBodyV1862(b) {
    ensureBusiness(b);
    var id = safeId(b.id);
    var eid = esc(b.id);
    var distMax = Math.max(0, round(b.retainedEarnings));
    return '<div class="v1851-cash-explain"><b>' + compactMoney(b.retainedEarnings) + '</b> is held inside the company &mdash; this is <b>not</b> your personal checking. Profitable years now reserve operating cash first; use distributions or salary when you want owner take-home. (Taxes &amp; compliance are paid in the <b>Taxes</b> popup.)</div>' +
      '<div class="v1840-cash-grid">' +
      '<div class="v1851-cash-group"><span class="v1851-cash-label">🧍 Take it out &rarr; checking</span>' +
      '<div class="v1840-action-strip">' +
      actionButton("Distribute All", "distributeBusinessCashV1830('" + eid + "','all')", "green", !distMax || typeof window.distributeBusinessCashV1830 !== "function") +
      actionButton("Pay $25K Salary", "payOwnerSalaryV1830('" + eid + "',25000)", "blue", !distMax || typeof window.payOwnerSalaryV1830 !== "function") +
      '</div>' +
      customRow("v1830-dist-" + id, distMax, "distributeBusinessCashV1830('" + eid + "','custom')", "Distribute", "green", typeof window.distributeBusinessCashV1830 !== "function") +
      '</div>' +
      '<div class="v1851-cash-group"><span class="v1851-cash-label">📈 Reinvest &rarr; grows value</span>' +
      '<div class="v1840-action-strip">' +
      actionButton("Reinvest Half", "reinvestBusinessCashV1830('" + eid + "','half')", "gold", !distMax || typeof window.reinvestBusinessCashV1830 !== "function") +
      '</div>' +
      customRow("v1830-reinvest-" + id, distMax, "reinvestBusinessCashV1830('" + eid + "','custom')", "Reinvest", "gold", typeof window.reinvestBusinessCashV1830 !== "function") +
      '</div>' +
      '</div>' +
      '<div class="v1840-rename-row"><input id="v1840-rename-' + esc(id) + '" placeholder="Rename company"><button class="money-btn" onclick="event.preventDefault();event.stopPropagation();renameBusinessV1840(\'' + eid + '\',\'v1840-rename-' + esc(id) + '\')">Rename</button></div>';
  }

  // 💰 Founder capital — invest (equity) / lend (owner loan) into THIS company.
  // Replaces the old global "Founder Capital" list that ignored tabs and duplicated the rail.
  function bizCapitalBodyV1862(b) {
    ensureBusiness(b);
    var eid = esc(b.id);
    var cid = "v1862-cap-" + safeId(b.id);
    var money = Math.max(0, round(stateNow().money));
    return '<div class="v1851-cash-explain">Put your own money in. <b>Invest</b> adds equity (raises value + reputation, no repayment). <b>Lend</b> is an owner loan the business repays yearly with interest. Your checking: <b>' + compactMoney(money) + '</b>.</div>' +
      '<div class="v1840-action-strip">' +
      actionButton("Invest $10K", "injectVentureCapitalV1860('" + eid + "',10000)", "green", money < 10000 || typeof window.injectVentureCapitalV1860 !== "function") +
      actionButton("Invest $100K", "injectVentureCapitalV1860('" + eid + "',100000)", "green", money < 100000 || typeof window.injectVentureCapitalV1860 !== "function") +
      actionButton("Lend $25K", "lendVentureCapitalV1860('" + eid + "',25000)", "blue", money < 25000 || typeof window.lendVentureCapitalV1860 !== "function") +
      actionButton("Lend $250K", "lendVentureCapitalV1860('" + eid + "',250000)", "blue", money < 250000 || typeof window.lendVentureCapitalV1860 !== "function") +
      '</div>' +
      '<div class="v1840-custom-row"><input id="' + cid + '" inputmode="numeric" placeholder="Custom $">' +
      actionButton("Invest", "injectVentureCustomV1860('" + eid + "','" + cid + "')", "green", typeof window.injectVentureCustomV1860 !== "function") +
      actionButton("Lend", "lendVentureCustomV1860('" + eid + "','" + cid + "')", "blue", typeof window.lendVentureCustomV1860 !== "function") +
      '</div>';
  }

  // 🧾 Company taxes & admin obligations (paid from company cash).
  function bizTaxesBodyV1862(b) {
    ensureBusiness(b);
    var eid = esc(b.id);
    var distMax = Math.max(0, round(b.retainedEarnings));
    var entityDebt = Math.max(0, round(b.entityTaxDebt));
    var compliance = Math.max(0, round(b.complianceDue));
    return '<div class="v1851-cash-explain">Company taxes &amp; admin bills are paid from <b>company cash</b> (' + compactMoney(b.retainedEarnings) + '). Entity tax owed: <b>' + compactMoney(entityDebt) + '</b> &middot; Compliance due: <b>' + compactMoney(compliance) + '</b>.</div>' +
      '<div class="v1840-action-strip">' +
      actionButton(entityDebt ? "Pay Tax " + compactMoney(entityDebt) : "No tax due", "payBusinessEntityTaxV1830('" + eid + "','all')", "red", !entityDebt || !distMax || typeof window.payBusinessEntityTaxV1830 !== "function") +
      actionButton(compliance ? "Pay Compliance " + compactMoney(compliance) : "No compliance due", "payBusinessComplianceV1830('" + eid + "')", "gold", !compliance || !distMax || typeof window.payBusinessComplianceV1830 !== "function") +
      '</div>';
  }

  function bizStructureBodyV1862(b) {
    ensureBusiness(b);
    var entityOptions = Object.keys(STRUCTURES).map(function (key) {
      var option = STRUCTURES[key];
      var locked = n(b.value) < option.minValue;
      var active = b.entityType === key;
      return '<button class="v1840-option ' + (active ? "active" : "") + '" onclick="event.preventDefault();event.stopPropagation();setBusinessEntityV1830(\'' + esc(b.id) + '\',\'' + esc(key) + '\')" ' + (active || locked || typeof window.setBusinessEntityV1830 !== "function" ? "disabled" : "") + '><span>' + esc(option.name) + '</span><b>' + compactMoney(option.cost) + '</b><em>' + (locked ? "Needs " + compactMoney(option.minValue) + " value" : esc(option.desc)) + '</em></button>';
    }).join("");
    return '<div class="v1840-option-rail">' + entityOptions + '</div>';
  }

  function bizTeamBodyV1862(b) {
    ensureBusiness(b);
    var opsBudget = Math.max(0, round(b.retainedEarnings)) + Math.max(0, round(stateNow().money));
    var ops = Object.keys(OPS).map(function (key) {
      var op = OPS[key];
      var active = b.ops && b.ops[key];
      return '<button class="v1840-option ' + (active ? "active" : "") + '" onclick="event.preventDefault();event.stopPropagation();hireBusinessOpsV1830(\'' + esc(b.id) + '\',\'' + esc(key) + '\')" ' + (active || opsBudget < op.cost || typeof window.hireBusinessOpsV1830 !== "function" ? "disabled" : "") + '><span>' + esc(op.name) + '</span><b>' + compactMoney(op.cost) + '</b><em>' + esc(op.note) + '</em></button>';
    }).join("");
    return '<div class="v1840-option-rail">' + ops + '</div>';
  }

  function bizAssetsBodyV1862(b) {
    ensureBusiness(b);
    return '<div class="v1840-asset-rows">' + assetRows(b) + '</div>';
  }

  var BIZ_MODAL_META_V1862 = {
    capital: { icon: "💰", title: "Founder capital" },
    cash: { icon: "💵", title: "Company cash" },
    taxes: { icon: "🧾", title: "Company taxes" },
    structure: { icon: "🏗️", title: "Entity structure" },
    team: { icon: "👥", title: "Operations team" },
    assets: { icon: "🛠️", title: "Assets" },
    network: { icon: "🌐", title: "Network + market share" },
    family: { icon: "👨‍👩‍👧", title: "Family & succession" },
    "new": { icon: "🚀", title: "New business" }
  };
  // Kinds that aren't tied to one focused company (open from a global button).
  var GLOBAL_MODAL_KINDS_V1862 = { family: 1, "new": 1 };

  function buildBizModalV1862(bizId, kind) {
    var meta = BIZ_MODAL_META_V1862[kind] || { icon: "⚙️", title: "Manage" };
    // Global popups don't need a focused company.
    if (kind === "new") return { icon: meta.icon, title: meta.title, html: safeSection("newBusiness", bizNewBusinessBodyV1862), biz: null };
    if (kind === "family") return { icon: meta.icon, title: meta.title, html: safeSection("familyEnterpriseDesk", familyEnterpriseDesk) + safeSection("historyDesk", historyDesk), biz: null };
    var b = businessById(bizId);
    if (!b) return { icon: meta.icon, title: meta.title, html: '<div class="v1840-empty">Company not found.</div>', biz: null };
    ensureBusiness(b);
    var html = "";
    if (kind === "capital") html = bizCapitalBodyV1862(b);
    else if (kind === "cash") html = bizCashBodyV1862(b);
    else if (kind === "taxes") html = bizTaxesBodyV1862(b);
    else if (kind === "structure") html = bizStructureBodyV1862(b);
    else if (kind === "team") html = bizTeamBodyV1862(b);
    else if (kind === "assets") html = bizAssetsBodyV1862(b);
    else if (kind === "network") html = locationsPanelV1857(b);
    else html = '<div class="v1840-empty">Nothing to manage here.</div>';
    return { icon: meta.icon, title: meta.title, html: html, biz: b };
  }
  window.buildBizModalV1862 = buildBizModalV1862;

  // ---- management popup overlay (Verdant style; reuses renderPopup's look) ----
  var _bizModalV1862 = null; // { bizId, kind } or null
  function bizModalInnerV1862() {
    if (!_bizModalV1862) return "";
    var built = buildBizModalV1862(_bizModalV1862.bizId, _bizModalV1862.kind);
    return '<div class="biz-manage-card" role="dialog" aria-modal="true">' +
      '<button class="biz-manage-x" aria-label="Close" onclick="event.preventDefault();event.stopPropagation();closeBizModalV1862()">×</button>' +
      '<div class="biz-manage-head"><span>' + esc((built.biz && built.biz.name) || "Business office") + '</span><h3>' + esc(built.icon) + ' ' + esc(built.title) + '</h3></div>' +
      '<div class="biz-manage-body">' + built.html + '</div>' +
      '</div>';
  }
  window.openBizModalV1862 = function (bizId, kind) {
    if (typeof document === "undefined" || !document.createElement) return;
    _bizModalV1862 = { bizId: bizId, kind: kind };
    var overlay = document.getElementById("biz-manage-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "biz-manage-overlay";
      overlay.addEventListener("click", function (e) { if (e.target === overlay) window.closeBizModalV1862(); });
      (document.body || document.documentElement).appendChild(overlay);
      if (!window.__bizModalKeyV1862) {
        window.__bizModalKeyV1862 = function (e) {
          if ((e.key === "Escape" || e.keyCode === 27) && document.getElementById("biz-manage-overlay")) { e.preventDefault(); window.closeBizModalV1862(); }
        };
        document.addEventListener("keydown", window.__bizModalKeyV1862, true);
      }
    }
    overlay.innerHTML = bizModalInnerV1862();
  };
  window.closeBizModalV1862 = function () {
    _bizModalV1862 = null;
    var overlay = typeof document !== "undefined" && document.getElementById ? document.getElementById("biz-manage-overlay") : null;
    if (overlay) overlay.remove();
  };
  // Called at the end of the hub render: management actions re-render the hub, so rebuild the
  // open popup's body in place with fresh values instead of leaving stale numbers.
  function refreshBizModalV1862() {
    if (!_bizModalV1862 || typeof document === "undefined" || !document.getElementById) return;
    var overlay = document.getElementById("biz-manage-overlay");
    if (!overlay) { _bizModalV1862 = null; return; }
    // Per-company popups close if their company is gone; global popups (new/family) always refresh.
    if (!GLOBAL_MODAL_KINDS_V1862[_bizModalV1862.kind] && !businessById(_bizModalV1862.bizId)) { window.closeBizModalV1862(); return; }
    overlay.innerHTML = bizModalInnerV1862();
  }

  function familyEnterpriseDesk() {
    var s = ensureBusinessState();
    var e = s.estateV1831;
    var fe = e.familyEnterpriseV1833;
    var b = focusBusiness();
    var g = GOVERNANCE[fe.governance] || GOVERNANCE.informal;
    var missionOptions = Object.keys(MISSIONS).map(function (key) {
      return '<option value="' + esc(key) + '" ' + (fe.mission === key ? "selected" : "") + '>' + esc(MISSIONS[key]) + '</option>';
    }).join("");
    var governanceCards = Object.keys(GOVERNANCE).map(function (key) {
      var option = GOVERNANCE[key];
      var active = fe.governance === key;
      return '<button class="v1840-option ' + (active ? "active" : "") + '" onclick="event.preventDefault();event.stopPropagation();setFamilyGovernanceV1840(\'' + esc(key) + '\')" ' + (active ? "disabled" : "") + '><span>' + esc(option.name) + '</span><b>' + compactMoney(option.cost) + '</b><em>' + esc(option.desc) + '</em></button>';
    }).join("");
    var focusedTrust = b ? focusedTrustControls(b) : '<div class="v1840-empty">Own a business to title shares into the trust and train successors.</div>';
    return '<section class="panel v1840-family-enterprise"><div class="v1840-panel-head"><div><div class="section-label">👨‍👩‍👧 Family enterprise</div><h3>Trust + succession desk</h3><p>Business trust work uses Legal trust status, then keeps company-level control here.</p></div><strong>' + enterpriseScore() + '<span>dynasty score</span></strong></div>' +
      '<div class="v1840-metric-grid">' +
      metric("Trust liquidity", compactMoney(trustCash()), "Family trust corpus plus estate trust cash.", legalTrustActive() ? "good" : "gold") +
      metric("Business stake", compactMoney(trustBusinessValue()), "Company value titled to the trust.", trustBusinessValue() ? "good" : "gold") +
      metric("Governance", g.name, "Harmony " + round(fe.harmony) + "/100, disputes " + round(fe.disputes) + ".", fe.governance === "informal" ? "gold" : "good") +
      metric("Heir readiness", averageReadiness() + "/100", "Successor training and continuity.", averageReadiness() >= 50 ? "good" : "gold") +
      '</div>' +
      '<div class="v1840-two-col"><div><div class="section-label">🎯 Mission</div><select class="v1840-select" onchange="event.preventDefault();event.stopPropagation();setFamilyMissionV1840(this.value)">' + missionOptions + '</select><div class="v1840-action-strip">' +
      actionButton("Succession Meeting", "holdFamilyCouncilV1840('succession')", "gold", !legalTrustActive()) +
      actionButton("Conflict Mediation", "holdFamilyCouncilV1840('conflict')", "red", !legalTrustActive()) +
      actionButton("Heir Education", "holdFamilyCouncilV1840('education')", "blue", !legalTrustActive()) +
      '</div></div><div><div class="section-label">🏛️ Governance rail</div><div class="v1840-option-rail">' + governanceCards + '</div></div></div>' +
      focusedTrust +
      '</section>';
  }

  function focusedTrustControls(b) {
    ensureBusiness(b);
    var id = safeId(b.id);
    var fam = b.familyV1833;
    var trustPct = n(fam.trustPercent);
    var distributable = Math.max(0, round(n(b.retainedEarnings) * trustPct));
    var loanMax = trustCash();
    var repayMax = Math.min(Math.max(0, n(fam.trustLoan)), Math.max(0, n(b.retainedEarnings)));
    var selectId = "v1840-successor-" + id;
    var successors = childrenOptions().map(function (item) {
      return '<option value="' + esc(item.id) + '" ' + (String(fam.successor) === String(item.id) ? "selected" : "") + '>' + esc(item.name) + '</option>';
    }).join("");
    var chosen = childrenOptions().find(function (item) { return String(item.id) === String(fam.successor); }) || childrenOptions()[0];
    var policyButtons = Object.keys(DIVIDENDS).map(function (key) {
      return actionButton(DIVIDENDS[key].name, "setBusinessDividendPolicyV1840('" + esc(b.id) + "','" + esc(key) + "')", fam.dividendPolicy === key ? "gold" : "", false);
    }).join("");
    var trainingButtons = Object.keys(TRAINING).map(function (key) {
      return actionButton(TRAINING[key].name, "trainBusinessSuccessorV1840('" + esc(b.id) + "','" + esc(key) + "')", "", fam.successor === "none");
    }).join("");
    return '<div class="v1840-focused-trust"><div class="section-label">🤝 Focused trust controls</div><div class="v1840-trust-head"><b>' + esc(b.name) + '</b><span>' + Math.round(trustPct * 100) + '% in trust / readiness ' + round(fam.readiness) + '/100 / continuity ' + round(fam.continuity) + '/100</span></div>' +
      '<div class="v1840-action-strip">' +
      actionButton("25% Trust", "setBusinessTrustPercentV1840('" + esc(b.id) + "',25)", "", !legalTrustActive()) +
      actionButton("51% Control", "setBusinessTrustPercentV1840('" + esc(b.id) + "',51)", "gold", !legalTrustActive()) +
      actionButton("100% Dynasty", "setBusinessTrustPercentV1840('" + esc(b.id) + "',100)", "green", !legalTrustActive()) +
      actionButton("Remove Trust Stake", "setBusinessTrustPercentV1840('" + esc(b.id) + "',0)", "red", false) +
      actionButton("Create Board", "toggleFamilyBusinessBoardV1840('" + esc(b.id) + "')", "blue", !!fam.board) +
      '</div>' +
      '<div class="v1840-two-col"><div><div class="section-label">👑 Successor</div><div class="v1840-selected-line">Current: <b>' + esc(chosen ? chosen.name : "No named successor") + '</b></div><select id="' + esc(selectId) + '" class="v1840-select">' + successors + '</select><div class="v1840-action-strip">' + actionButton("Set Successor", "appointBusinessSuccessorFromSelectV1840('" + esc(b.id) + "','" + esc(selectId) + "')", "blue", false) + trainingButtons + '</div></div>' +
      '<div><div class="section-label">💵 Dividend policy</div><div class="v1840-action-strip">' + policyButtons + '</div>' + customRow("v1840-div-" + id, distributable, "payBusinessDividendToTrustV1840('" + esc(b.id) + "','custom')", "Pay Dividend", "green", !legalTrustActive() || !trustPct || !distributable) + actionButton("Pay Max Dividend", "payBusinessDividendToTrustV1840('" + esc(b.id) + "','all')", "green", !legalTrustActive() || !trustPct || !distributable) + '</div></div>' +
      '<div class="v1840-two-col"><div><div class="section-label">💰 Trust finances company</div>' + customRow("v1840-loan-" + id, loanMax, "trustLoanToBusinessV1840('" + esc(b.id) + "','custom')", "Trust To Business", "blue", !legalTrustActive() || !loanMax) + actionButton("Use 25% Trust Cash", "trustLoanToBusinessV1840('" + esc(b.id) + "','quarter')", "blue", !legalTrustActive() || !loanMax) + '</div>' +
      '<div><div class="section-label">💳 Repay trust loan</div>' + customRow("v1840-repay-" + id, repayMax, "repayTrustLoanV1840('" + esc(b.id) + "','custom')", "Repay Trust", "", !repayMax) + actionButton("Repay Max", "repayTrustLoanV1840('" + esc(b.id) + "','all')", "", !repayMax) + '</div></div>' +
      '</div>';
  }

  function historyDesk() {
    var rows = (ensureBusinessState().estateV1831.familyEnterpriseV1833.history || []).slice(0, 5);
    if (!rows.length) return "";
    return '<div class="v1840-history"><div class="section-label">📜 Enterprise ledger</div>' + rows.map(function (row) {
      var icon = n(row.amount) > 0 ? "✅" : n(row.amount) < 0 ? "📉" : "📝";
      return '<div><span>Age ' + esc(row.age == null ? "?" : row.age) + '</span><b>' + icon + ' ' + esc(row.text || "Business event") + '</b><em class="' + (n(row.amount) >= 0 ? "good" : "bad") + '">' + signedMoney(row.amount || 0) + '</em></div>';
    }).join("") + '</div>';
  }

  function launchFilterState() {
    var existing = window.__ledgerLaunchFilterV1850 || {};
    var filter = { category: existing.category || "all", search: existing.search || "" };
    window.__ledgerLaunchFilterV1850 = filter;
    return filter;
  }

  window.setLaunchFilterV1850 = function (key, value) {
    var filter = launchFilterState();
    filter[key] = value;
    if (typeof window.renderHubInPlaceV16 === "function") window.renderHubInPlaceV16("business");
    else if (typeof render === "function") render();
  };

  window.setLaunchSearchV1850 = function (value) {
    var filter = launchFilterState();
    filter.search = String(value || "");
    window.filterLaunchCardsDomV1850();
  };

  window.filterLaunchCardsDomV1850 = function () {
    if (typeof document === "undefined" || !document.querySelectorAll) return;
    var filter = launchFilterState();
    var search = String(filter.search || "").toLowerCase().trim();
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-launch-card='1']"));
    var visibleGroups = {};
    cards.forEach(function (card) {
      var hay = String((card.dataset && card.dataset.search) || "").toLowerCase();
      var show = !search || hay.indexOf(search) >= 0;
      card.style.display = show ? "" : "none";
      if (show && card.dataset && card.dataset.group) visibleGroups[card.dataset.group] = true;
    });
    var groups = Array.prototype.slice.call(document.querySelectorAll("[data-launch-group]"));
    groups.forEach(function (group) {
      group.style.display = !search || visibleGroups[group.dataset.launchGroup] ? "" : "none";
    });
  };

  function launchRail() {
    var s = ensureBusinessState();
    var owned = businesses();
    var filter = launchFilterState();
    var fullCatalog = businessCatalog().filter(function (v) {
      return v && v.id && String(v.id).indexOf("acq_") !== 0;
    });
    // Sort everything cheapest-first: sectors by their cheapest venture, and the
    // ventures inside each sector by startup cost — so the easy, low-cost ways in
    // are at the top and the big-money, high-potential plays sit at the bottom.
    var catMinCost = {};
    fullCatalog.forEach(function (v) {
      var cat = v.category || "Business";
      var sc = n(v.startup);
      if (catMinCost[cat] == null || sc < catMinCost[cat]) catMinCost[cat] = sc;
    });
    var byCheapestSector = function (a, b) { return n(catMinCost[a]) - n(catMinCost[b]); };
    var categories = Object.keys(catMinCost).sort(byCheapestSector);
    var catalog = filter.category === "all" ? fullCatalog : fullCatalog.filter(function (v) { return (v.category || "Business") === filter.category; });
    if (!fullCatalog.length) return "";
    var catOptions = '<option value="all"' + (filter.category === "all" ? " selected" : "") + '>All categories</option>' + categories.map(function (cat) {
      return '<option value="' + esc(cat) + '"' + (filter.category === cat ? " selected" : "") + '>' + esc(categoryIcon(cat)) + ' ' + esc(cat) + '</option>';
    }).join("");
    var groups = {};
    var order = [];
    catalog.forEach(function (v) {
      var cat = v.category || "Business";
      if (!groups[cat]) { groups[cat] = []; order.push(cat); }
      groups[cat].push(v);
    });
    order.sort(byCheapestSector);
    var sections = order.map(function (cat) {
      groups[cat].sort(function (a, b) { return n(a.startup) - n(b.startup); });
      var cards = groups[cat].map(function (v) {
        var exists = owned.some(function (b) { return String(b.id) === String(v.id); });
        var missing = [];
        var minAge = businessMinAgeV1872(v);
        if (n(s.age) < minAge) missing.push("Age " + minAge + "+");
        if (n(s.money) < n(v.startup)) missing.push(compactMoney(v.startup) + " cash");
        if (exists) missing.push("Owned");
        var ready = !missing.length;
        var risk = n(v.failureRisk, .12);
        var riskTag = risk >= .30 ? '<i class="bad">High risk</i>' : risk >= .18 ? '<i class="gold">Medium risk</i>' : '<i class="good">Low risk</i>';
        var searchHay = esc(String((v.name || "") + " " + (v.desc || "") + " " + (v.category || "")).toLowerCase());
        return '<button class="v1840-launch-card ' + (ready ? "ready" : "") + '" data-launch-card="1" data-group="' + esc(cat) + '" data-search="' + searchHay + '" onclick="event.preventDefault();event.stopPropagation();startVentureV1862(\'' + esc(v.id) + '\')" ' + (!ready || typeof window.startVenture !== "function" ? "disabled" : "") + '><span>' + categoryIcon(v.category) + ' ' + esc(v.category || "Business") + '</span><b>' + esc(v.name || v.id) + '</b><em>' + esc(v.desc || "Business path.") + '</em><div class="v1840-company-stats">' + riskTag + '</div><strong>' + (ready ? "Start " + compactMoney(v.startup) : missing.join(" / ")) + '</strong></button>';
      }).join("");
      return '<div class="v1840-launch-group" data-launch-group="' + esc(cat) + '"><div class="v1840-launch-group-label">' + categoryIcon(cat) + ' ' + esc(cat) + '</div><div class="v1840-rail">' + cards + '</div></div>';
    }).join("");
    if (!sections) sections = '<div class="v1840-empty">No ventures match that category.</div>';
    return '<section class="panel v1840-launch-board"><div class="v1840-panel-head"><div><div class="section-label">🚀 Launch board</div><h3>Start from scratch</h3></div><span>' + fullCatalog.length + ' ventures - cheapest first, big-money plays at the bottom.</span></div>' +
      '<div class="v1840-launch-controls"><input type="text" placeholder="🔍 Search ventures..." value="' + esc(filter.search) + '" oninput="setLaunchSearchV1850(this.value)"><select onchange="setLaunchFilterV1850(\'category\', this.value)">' + catOptions + '</select></div>' +
      sections + '</section>';
  }

  function acquisitionRail() {
    var s = ensureBusinessState();
    var catalog = acquisitionMarketV1862();
    if (!catalog.length) return "";
    var cards = catalog.map(function (v) {
      var price = n(v.buy || n(v.startup) * 2 || 50000);
      var missing = [];
      var minAge = businessMinAgeV1872(v);
      if (n(s.age) < minAge) missing.push("Age " + minAge + "+");
      if (n(s.money) < price) missing.push(compactMoney(price) + " cash");
      var ready = !missing.length;
      return '<button class="v1840-launch-card acquisition ' + (ready ? "ready" : "") + '" onclick="event.preventDefault();event.stopPropagation();buyCompanyV1862(\'' + esc(v.id) + '\')" ' + (!ready || typeof window.buyCompany !== "function" ? "disabled" : "") + '><span>' + categoryIcon(v.category) + ' ' + esc(v.category || "Acquisition") + '</span><b>' + esc(v.name || v.id) + '</b><em>' + esc(v.desc || "Buy an existing company.") + '</em><strong>' + (ready ? "Buy around " + compactMoney(price) : missing.join(" / ")) + '</strong></button>';
    }).join("");
    return '<section class="panel v1840-launch-board"><div class="v1840-panel-head"><div><div class="section-label">🤝 Acquisition market</div><h3>Buy existing companies</h3></div><span>Purchases create one focused company card.</span></div><div class="v1840-rail">' + cards + '</div></section>';
  }

  function openHubCode(hub) {
    hub = esc(hub);
    return "(window.setTabV16 || window.setTab || setTab)('" + hub + "')";
  }

  function entrepreneurshipShortcut() {
    var s = ensureBusinessState();
    var founder = s.finance.entrepreneurshipV1841;
    var path = FOUNDER_PATHS[founder.path] || FOUNDER_PATHS.undecided;
    return '<section class="panel v1841-business-shortcut"><div class="v1840-panel-head"><div><div class="section-label">🧭 Entrepreneurship path</div><h3>' + esc(path.name) + '</h3><p>Founder identity, full-time choice, thesis, and long-game direction now live in their own hub. This Business office stays focused on owned companies.</p></div><strong>' + esc(path.tag) + '<span>active path</span></strong></div><div class="v1840-action-strip">' + actionButton("Open Entrepreneurship", openHubCode("entrepreneurship"), "blue", false) + actionButton("Open Legal Trust", openHubCode("law"), "", false) + '</div></section>';
  }

  function pathCard(key, founder) {
    var path = FOUNDER_PATHS[key] || FOUNDER_PATHS.undecided;
    var active = founder.path === key;
    return '<button class="v1841-path-card ' + (active ? "active" : "") + '" onclick="event.preventDefault();event.stopPropagation();setEntrepreneurshipPathV1841(\'' + esc(key) + '\')">' +
      '<span>' + esc(path.tag) + '</span><b>' + esc(path.name) + '</b><em>' + esc(path.desc) + '</em><i>' + esc(path.bonus) + '</i></button>';
  }

  function entrepreneurshipPathDeck() {
    var s = ensureBusinessState();
    var founder = s.finance.entrepreneurshipV1841;
    return '<section class="panel v1841-path-deck"><div class="v1840-panel-head"><div><div class="section-label">🧭 Choose founder lane</div><h3>Lifelong entrepreneurship path</h3><p>This is the identity layer. Business remains the operating-company desk.</p></div><span>Change anytime, but the game remembers the lane.</span></div><div class="v1841-path-grid">' +
      Object.keys(FOUNDER_PATHS).map(function (key) { return pathCard(key, founder); }).join("") +
      '</div></section>';
  }

  function entrepreneurshipStatus() {
    var s = ensureBusinessState();
    var founder = s.finance.entrepreneurshipV1841;
    var path = FOUNDER_PATHS[founder.path] || FOUNDER_PATHS.undecided;
    var list = businesses();
    var fullTime = !!s.finance.businessCareer;
    return '<section class="panel v1841-founder-status"><div class="v1840-panel-head"><div><div class="section-label">📊 Founder status</div><h3>' + esc(path.name) + '</h3><p>' + esc(path.desc) + '</p></div><strong>' + compactMoney(totalBusinessValue()) + '<span>owned value</span></strong></div>' +
      '<div class="v1840-metric-grid">' +
      metric("Founder mode", fullTime ? "Full-time" : "Side path", fullTime ? "Business is your career." : "Career income stays active.", fullTime ? "good" : "gold") +
      metric("Owned companies", String(list.length), "Business Office controls the companies.", list.length ? "good" : "gold") +
      metric("Company cash", compactMoney(totalCompanyCash()), "Retained earnings across companies.", "good") +
      metric("Family trust", legalTrustActive() ? "Active" : "Not set", legalTrustActive() ? "Trust controls can protect businesses." : "Create one in Legal when ready.", legalTrustActive() ? "good" : "gold") +
      '</div>' + founderMode() + '<div class="v1840-action-strip">' + actionButton("Open Business Office", openHubCode("business"), "gold", false) + actionButton("Open Investments", openHubCode("brokerage"), "blue", false) + actionButton("Open Legal", openHubCode("law"), "", false) + '</div></section>';
  }

  function entrepreneurshipRequirementDeck() {
    var s = ensureBusinessState();
    var launch = businessCatalog().slice(0, 12);
    var acquisition = acquisitionCatalog().slice(0, 8);
    var rows = launch.concat(acquisition).map(function (v) {
      var price = n(v.buy || v.startup || 0);
      var missing = [];
      var minAge = businessMinAgeV1872(v);
      if (n(s.age) < minAge) missing.push("Age " + minAge + "+");
      if (price && n(s.money) < price) missing.push(compactMoney(price) + " cash");
      if (!missing.length) missing.push("Ready");
      return '<div class="v1841-requirement"><span>' + esc(v.category || "Business") + '</span><b>' + esc(v.name || v.id) + '</b><em>' + esc(v.desc || "Business path.") + '</em><i class="' + (missing[0] === "Ready" ? "good" : "gold") + '">' + esc(missing.join(" / ")) + '</i></div>';
    }).join("");
    return '<section class="panel v1841-requirements"><div class="v1840-panel-head"><div><div class="section-label">🔓 What unlocks next</div><h3>Founder opportunity board</h3></div><span>Requirements stay visible before you spend.</span></div><div class="v1841-requirement-grid">' + (rows || '<div class="v1840-empty">No business catalog loaded yet.</div>') + '</div></section>';
  }

  function renderEntrepreneurshipHub() {
    try { ensureBusinessState(); } catch (e) {}
    return '<div class="v1840-business-shell v1841-entrepreneurship-shell">' +
      '<section class="v1840-hero v1841-entrepreneur-hero"><div><div class="section-label">Founder path</div><h2>Entrepreneurship</h2><p>Pick the lifelong direction first. Use Business for the actual companies, cash, entity structure, and acquisitions.</p><div class="v1840-chip-row"><span>' + businesses().length + ' companies</span><span>Business value ' + compactMoney(totalBusinessValue()) + '</span><span class="' + (legalTrustActive() ? "good" : "gold") + '">' + (legalTrustActive() ? "Trust active" : "No trust") + '</span><span>Founder score ' + enterpriseScore() + '/100</span></div></div><strong>' + esc((FOUNDER_PATHS[financeNow().entrepreneurshipV1841.path] || FOUNDER_PATHS.undecided).tag) + '<span>current lane</span></strong></section>' +
      entrepreneurshipStatus() +
      entrepreneurshipPathDeck() +
      entrepreneurshipRequirementDeck() +
      '</div>';
  }

  // Each section is isolated: if one throws (e.g. odd state right after an
  // action), it degrades to an empty string instead of taking down the whole
  // business hub render — which previously left the screen frozen/unclickable.
  function safeSection(name, fn) {
    try { return fn(); }
    catch (e) {
      try { if (window.console && console.error) console.error("[business hub] section '" + name + "' failed:", e); } catch (e2) {}
      return "";
    }
  }
  // The "what happened" tab: enterprise ledger + the focused company's market events & asset log.
  function ledgerTab() {
    var b = focusBusiness();
    var out = safeSection("historyDesk", historyDesk);
    if (b) {
      ensureBusiness(b);
      out += '<section class="panel"><div class="section-label">📰 ' + esc(b.name) + ' — recent market events</div>' + eventHistoryFeed(b) +
        '<div class="section-label" style="margin-top:12px">📜 Asset history</div>' + assetHistoryFeed(b) + '</section>';
    }
    if (!out) return '<div class="v1840-empty">No history yet. Run your companies a few years and events will show up here.</div>';
    return out;
  }

  function businessOfficeV1862() {
    var f = ensureBusinessState().finance;
    if (!f.businessOfficeV1840 || typeof f.businessOfficeV1840 !== "object") f.businessOfficeV1840 = {};
    return f.businessOfficeV1840;
  }
  // Back-compat: old top-tab calls map onto the focused-company sub-tabs / popups.
  window.setBusinessTabV1862 = function (tab) {
    var t = String(tab || "").toLowerCase();
    if (t === "capital" || t === "network" || t === "overview") return window.setCompanyTabV1862(t);
    if (t === "new" || t === "grow") return window.openBizModalV1862("", "new");
    if (t === "family") return window.openBizModalV1862("", "family");
    saveRender("business");
  };

  // Company-centric, no top tabs: portfolio snapshot + your companies (click to focus) +
  // the focused company with its own mini-tabs + a "New Business" button at the bottom.
  // Family and New Business are popups; everything detailed lives in the company's popups.
  function renderBusinessHub() {
    try { ensureBusinessState(); } catch (e) {}
    var html = '<div class="v1840-business-shell">' +
      safeSection("hero", hero) +
      safeSection("kpis", kpis) +
      safeSection("businessRail", businessRail) +
      safeSection("focusDesk", focusDesk) +
      newBusinessButtonV1862() +
      safeSection("founderMode", founderMode) +
      safeSection("entrepreneurshipShortcut", entrepreneurshipShortcut) +
      '</div>';
    // Keep an open management popup in sync with the freshly-rendered state.
    try { refreshBizModalV1862(); } catch (e) {}
    return html;
  }

  var previousRenderHubContent = window.renderHubContent || (typeof renderHubContent === "function" ? renderHubContent : null);
  window.renderBusinessHubV1840 = renderBusinessHub;
  window.renderEntrepreneurshipHubV1841 = renderEntrepreneurshipHub;
  try { businessCatalog(); acquisitionCatalog(); } catch (e) {}
  window.businessEnterpriseScoreV1840 = enterpriseScore;
  window.businessTrustValueV1840 = trustBusinessValue;
  window.businessAssetIncomeBonus = businessAssetIncomeBonus;
  window.businessAssetRiskCut = businessAssetRiskCut;
  window.businessAssetTotalsV1850 = businessAssetTotals;
  window.renderHubContent = function (hubId) {
    var id = String(hubId || "").toLowerCase();
    if (id === "business" || id === "biz" || id === "company") return renderBusinessHub();
    if (id === "entrepreneurship" || id === "founder" || id === "startup") return renderEntrepreneurshipHub();
    return previousRenderHubContent ? previousRenderHubContent.apply(this, arguments) : "";
  };
  try { renderHubContent = window.renderHubContent; } catch (e) {}

  if (typeof document !== "undefined" && document.createElement && document.head) {
    var style = document.createElement("style");
    style.textContent = [
      ".hub-overlay.hub-business .hub-head,.hub-overlay.hub-entrepreneurship .hub-head{position:sticky!important;top:0!important;z-index:8!important;background:linear-gradient(180deg,rgba(18,14,10,1),rgba(18,14,10,.92))!important;box-shadow:0 1px 0 rgba(255,255,255,.05)}",
      ".v1840-business-shell{display:grid;gap:16px;padding:4px 0 96px;color:#f6ead8;min-width:0}.v1840-business-shell *{box-sizing:border-box}.v1840-business-shell .panel{min-width:0;overflow:hidden;border:1px solid rgba(216,173,109,.22);border-radius:12px;background:linear-gradient(135deg,rgba(34,30,23,.96),rgba(22,19,15,.96));padding:14px}.v1840-business-shell .section-label{font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.16em;color:#d8b16e;font-size:10px;margin-bottom:9px}",
      ".v1840-zone{position:relative;display:grid;gap:12px;padding:14px 14px 16px 18px;border:1px solid rgba(255,255,255,.07);border-radius:16px;background:linear-gradient(135deg,rgba(28,24,18,.45),rgba(17,15,11,.45))}.v1840-zone::before{content:'';position:absolute;left:0;top:12px;bottom:12px;width:4px;border-radius:999px;background:var(--zacc,#d8b16e);box-shadow:0 0 14px var(--zacc,#d8b16e)}.v1840-zone[data-accent=gold]{--zacc:#f0ca7b}.v1840-zone[data-accent=blue]{--zacc:#7ea0ac}.v1840-zone[data-accent=green]{--zacc:#8faf6c}.v1840-zone[data-accent=violet]{--zacc:#b49bd8}.v1840-zone-head{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}.v1840-zone-label{font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.2em;color:var(--zacc,#d8b16e);font-size:12px;font-weight:600}.v1840-zone-head em{font-family:'JetBrains Mono',monospace;font-style:normal;color:#9a8c75;font-size:10px}.v1840-zone>.panel,.v1840-zone>section{margin:0!important}.v1840-zone .v1840-focus-desk,.v1840-zone .v1840-family-enterprise{margin-top:0}",
      ".v1840-focus-desk{display:grid;gap:11px}.v1840-focus-desk>.v1840-panel-head{margin-bottom:2px}.v1840-primary-actions{margin:0}.v1840-disc{border:1px solid rgba(255,255,255,.10);border-radius:12px;background:rgba(255,255,255,.03);overflow:hidden}.v1840-disc>summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:10px;padding:11px 13px}.v1840-disc>summary::-webkit-details-marker{display:none}.v1840-disc>summary::after{content:'\\25B8';margin-left:auto;color:#9a8c75;font-size:12px;transition:transform .15s}.v1840-disc[open]>summary::after{transform:rotate(90deg)}.v1840-disc>summary span{font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.14em;color:#d8b16e;font-size:11px}.v1840-disc>summary b{font-size:17px;color:#f0ca7b}.v1840-disc>summary b.good{color:#b9dc8a}.v1840-disc>summary b.bad{color:#e9927d}.v1840-disc>summary i{font-style:normal;color:#9a8c75;font-family:'JetBrains Mono',monospace;font-size:10px}.v1840-disc[open]>summary{border-bottom:1px solid rgba(255,255,255,.07)}.v1840-risk-disc .v1856-risk-panel{margin:0;border:none;background:transparent;padding:11px 13px}.v1840-manage-body{padding:12px 13px;display:grid;gap:13px}.v1840-cash-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px}.v1840-manage-body .v1840-rename-row{margin-top:0}",
      ".v1840-tabs{margin:2px 0 2px}.v1840-tabpanel{position:relative;display:grid;gap:14px;padding:14px 2px 2px}.v1840-tabpanel::before{content:'';position:absolute;left:0;right:0;top:0;height:2px;border-radius:999px;background:var(--zacc,#d8b16e);opacity:.7;box-shadow:0 0 12px var(--zacc,#d8b16e)}.v1840-tabpanel[data-accent=gold]{--zacc:#f0ca7b}.v1840-tabpanel[data-accent=blue]{--zacc:#7ea0ac}.v1840-tabpanel[data-accent=green]{--zacc:#8faf6c}.v1840-tabpanel[data-accent=violet]{--zacc:#b49bd8}",
      ".v1840-manage-label{margin-top:4px!important}.v1840-manage-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px}.v1840-manage-btn{border:1px solid rgba(216,173,109,.30);border-radius:11px;background:linear-gradient(135deg,rgba(216,173,109,.10),rgba(255,255,255,.03));color:#f6ead8;font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.03em;padding:13px 10px;cursor:pointer;transition:border-color .12s,background .12s,transform .08s}.v1840-manage-btn:hover{border-color:rgba(240,202,123,.6);background:linear-gradient(135deg,rgba(216,173,109,.18),rgba(255,255,255,.05))}.v1840-manage-btn:active{transform:translateY(1px)}",
      ".v1840-newbiz-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px;margin-top:8px}.v1840-newbiz-grid .v1840-launch-card{flex:initial;min-height:0;scroll-snap-align:none}.biz-manage-body .v1840-launch-group{margin-top:6px}.biz-manage-body .v1840-launch-controls{position:sticky;top:0;z-index:2;background:linear-gradient(180deg,rgba(22,19,15,.98),rgba(22,19,15,.9));padding:4px 0 8px}",
      ".v1840-trend-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-top:4px}.v1840-trend-card{border:1px solid rgba(255,255,255,.10);border-radius:12px;background:rgba(255,255,255,.04);padding:12px}.v1840-trend-head{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:8px}.v1840-trend-head span{font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.12em;color:#aa9a82;font-size:9px}.v1840-trend-head b{color:#fff3df;font-size:16px}.v1840-spark{width:100%;height:46px;display:block}",
      ".v1840-company-tabs{margin:10px 0 4px}.v1840-company-body{display:grid;gap:11px}.v1840-newbiz-row{display:flex;justify-content:center;margin:4px 0 2px}.v1840-newbiz-btn{width:100%;border:1px dashed rgba(143,175,108,.5);border-radius:12px;background:linear-gradient(135deg,rgba(143,175,108,.12),rgba(255,255,255,.03));color:#cfe3b4;font-family:'JetBrains Mono',monospace;font-size:13px;letter-spacing:.06em;padding:14px;cursor:pointer;transition:border-color .12s,background .12s}.v1840-newbiz-btn:hover{border-color:rgba(143,175,108,.85);background:linear-gradient(135deg,rgba(143,175,108,.2),rgba(255,255,255,.05))}",
      "#biz-manage-overlay{position:fixed;inset:0;background:rgba(0,0,0,.66);z-index:2147482000;display:flex;align-items:center;justify-content:center;padding:18px;animation:bizMgFade .16s ease}@keyframes bizMgFade{0%{opacity:0;transform:scale(.98)}100%{opacity:1;transform:scale(1)}}.biz-manage-card{position:relative;max-width:780px;width:100%;max-height:88vh;overflow:auto;background:linear-gradient(135deg,rgba(30,26,20,.99),rgba(18,16,12,.99));border:1px solid rgba(216,173,109,.4);border-radius:16px;box-shadow:0 28px 70px rgba(0,0,0,.6);color:#f6ead8}.biz-manage-x{position:absolute;top:10px;right:12px;z-index:3;width:32px;height:32px;border:none;border-radius:9px;background:rgba(0,0,0,.32);color:#f3efe4;font-size:19px;line-height:1;cursor:pointer}.biz-manage-x:hover{background:rgba(0,0,0,.5)}.biz-manage-head{padding:18px 20px 14px;border-bottom:1px solid rgba(216,173,109,.22);background:linear-gradient(135deg,rgba(216,173,109,.10),transparent)}.biz-manage-head span{display:block;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.16em;color:#d8b16e;font-size:9px;margin-bottom:5px}.biz-manage-head h3{margin:0;font-size:22px;padding-right:30px}.biz-manage-body{padding:16px 18px 20px;display:grid;gap:12px}.biz-manage-body .v1857-location-panel,.biz-manage-body .v1856-risk-panel{margin:0}",
      ".v1840-hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:end;border:1px solid rgba(143,175,108,.46);border-radius:16px;background:radial-gradient(circle at 12% 10%,rgba(143,175,108,.22),transparent 30%),radial-gradient(circle at 82% 0,rgba(216,173,109,.18),transparent 28%),linear-gradient(135deg,rgba(24,42,29,.98),rgba(43,31,21,.98));padding:18px;box-shadow:0 22px 58px rgba(0,0,0,.28)}.v1840-hero h2{font-size:38px;margin:0 0 6px;letter-spacing:0}.v1840-hero p{margin:0;color:#d9c8aa;font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.55}.v1840-hero strong{font-size:40px;color:#f0ca7b;text-align:right}.v1840-hero strong span{display:block;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.15em;font-size:9px;color:#bba988}",
      ".v1840-chip-row,.v1840-action-strip{display:flex;gap:7px;flex-wrap:wrap}.v1840-chip-row{margin-top:12px}.v1840-chip-row span{border:1px solid rgba(255,255,255,.13);border-radius:999px;background:rgba(255,255,255,.045);padding:6px 9px;color:#d8b16e;font-family:'JetBrains Mono',monospace;font-size:10px}.v1840-chip-row .good{color:#b9dc8a;border-color:rgba(185,220,138,.36)}.v1840-chip-row .bad{color:#e9927d;border-color:rgba(233,146,125,.40)}",
      ".v1840-kpi-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:9px}.v1840-metric{border:1px solid rgba(255,255,255,.11);border-radius:12px;background:rgba(255,255,255,.045);padding:11px;min-width:0}.v1840-metric span{display:block;color:#aa9a82;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.11em;font-size:9px}.v1840-metric b{display:block;color:#fff3df;font-size:20px;margin-top:5px;overflow-wrap:anywhere}.v1840-metric em{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-style:normal;font-size:10px;line-height:1.4;margin-top:5px}.v1840-metric.good b,.v1840-history em.good{color:#b9dc8a}.v1840-metric.bad b,.v1840-history em.bad{color:#e9927d}.v1840-metric.gold b{color:#f0ca7b}",
      ".v1840-main-grid{display:grid;grid-template-columns:1fr;gap:14px;align-items:start}.v1840-panel-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:12px}.v1840-panel-head h3{font-size:23px;margin:0 0 4px}.v1840-panel-head p,.v1840-panel-head span{font-family:'JetBrains Mono',monospace;color:#b9a98e;font-size:10px;line-height:1.45;margin:0}.v1840-panel-head strong{color:#f0ca7b;font-size:32px;text-align:right}.v1840-panel-head strong span{display:block;text-transform:uppercase;letter-spacing:.14em;font-family:'JetBrains Mono',monospace;font-size:8px;color:#b9a98e}",
      ".v1840-mode-grid,.v1840-two-col{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.v1840-mode-card{border:1px solid rgba(255,255,255,.11);border-radius:12px;background:rgba(255,255,255,.045);padding:12px;min-width:0}.v1840-mode-card.active{border-color:rgba(240,202,123,.58);background:rgba(216,173,109,.09)}.v1840-mode-card span,.v1840-option span,.v1840-company-card span,.v1840-launch-card span,.v1841-path-card span,.v1841-requirement span{display:block;color:#d8b16e;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.12em;font-size:9px}.v1840-mode-card b,.v1840-option b,.v1840-company-card b,.v1840-launch-card b,.v1841-path-card b,.v1841-requirement b{display:block;color:#fff3df;font-size:17px;line-height:1.1;margin-top:5px}.v1840-mode-card em,.v1840-option em,.v1840-company-card em,.v1840-launch-card em,.v1841-path-card em,.v1841-requirement em{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.4;font-style:normal;margin-top:7px}",
      ".v1840-rail{display:flex;gap:10px;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x proximity;padding:2px 2px 10px;margin-top:8px}.v1840-option-rail,.v1841-path-grid,.v1841-requirement-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin-top:8px}.v1840-company-card,.v1840-launch-card{flex:0 0 250px;scroll-snap-align:start;border:1px solid rgba(255,255,255,.11);border-radius:12px;background:rgba(255,255,255,.045);color:#f6ead8;text-align:left;padding:12px;min-height:142px}.v1840-option,.v1841-path-card,.v1841-requirement{min-width:0;border:1px solid rgba(255,255,255,.11);border-radius:12px;background:rgba(255,255,255,.045);color:#f6ead8;text-align:left;padding:12px;min-height:132px}.v1841-path-card i,.v1841-requirement i{display:block;margin-top:9px;color:#f0ca7b;font:10px 'JetBrains Mono',monospace;font-style:normal}.v1841-requirement i.good{color:#b9dc8a}.v1840-company-card.selected,.v1840-launch-card.ready,.v1840-option.active,.v1841-path-card.active{border-color:rgba(240,202,123,.64);background:linear-gradient(135deg,rgba(65,48,26,.82),rgba(25,21,17,.96))}.v1840-company-card:disabled,.v1840-launch-card:disabled,.v1840-option:disabled{opacity:.52}.v1840-company-stats{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.v1840-company-stats i{border:1px solid rgba(255,255,255,.10);border-radius:999px;padding:4px 7px;font-style:normal;color:#f0ca7b;font-family:'JetBrains Mono',monospace;font-size:9px}.v1840-company-stats i.good{color:#b9dc8a}.v1840-company-stats i.bad{color:#e9927d}",
      ".v1840-focus-desk,.v1840-family-enterprise{margin-top:14px}.v1840-metric-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin:10px 0}.v1840-action-strip{margin:10px 0;overflow:visible;flex-wrap:wrap;padding-bottom:0}.v1840-action-strip .money-btn{flex:0 0 auto}.v1840-note,.v1840-selected-line{border:1px solid rgba(255,255,255,.09);border-radius:10px;background:rgba(255,255,255,.035);padding:10px;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.45;margin:8px 0 0}.v1840-selected-line b{color:#f0ca7b}",
      ".v1840-custom-row,.v1840-rename-row{display:grid;grid-template-columns:minmax(120px,1fr) minmax(94px,auto) auto;gap:8px;align-items:center;margin-top:9px}.v1840-rename-row{grid-template-columns:minmax(0,1fr) auto}.v1840-custom-row input,.v1840-rename-row input,.v1840-select{min-width:0;width:100%;border:1px solid rgba(216,173,109,.45);background:rgba(0,0,0,.36);color:#f6ead8;border-radius:9px;padding:10px;font:12px 'JetBrains Mono',monospace}.v1840-custom-row span{border:1px solid rgba(126,160,172,.35);border-radius:10px;background:rgba(126,160,172,.10);color:#dcecf0;font-family:'JetBrains Mono',monospace;font-size:9px;line-height:1.25;padding:9px;overflow-wrap:anywhere}",
      ".v1840-family-enterprise{border-color:rgba(143,175,108,.38)!important;background:linear-gradient(135deg,rgba(22,40,28,.96),rgba(34,29,22,.96))!important}.v1840-focused-trust{border:1px solid rgba(143,175,108,.26);border-radius:12px;background:rgba(143,175,108,.07);padding:12px;margin-top:12px}.v1840-trust-head{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid rgba(255,255,255,.08);padding-bottom:9px;margin-bottom:9px}.v1840-trust-head b{color:#fff3df;font-size:17px}.v1840-trust-head span{font-family:'JetBrains Mono',monospace;color:#b9a98e;font-size:10px;text-align:right}",
      ".v1840-history{border:1px solid rgba(255,255,255,.10);border-radius:12px;overflow:hidden;margin-top:12px}.v1840-history .section-label{padding:10px 10px 0}.v1840-history div:not(.section-label){display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:8px;border-top:1px solid rgba(255,255,255,.07);padding:8px 10px;align-items:center}.v1840-history span,.v1840-history b,.v1840-history em{font-family:'JetBrains Mono',monospace;font-size:9px;font-style:normal}.v1840-history span{color:#aa9a82}.v1840-history b{color:#f6ead8}.v1840-history em{color:#f0ca7b}.v1840-empty{border:1px dashed rgba(255,255,255,.14);border-radius:12px;padding:14px;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.5}",
      ".v1840-rail::-webkit-scrollbar{height:10px}.v1840-rail::-webkit-scrollbar-thumb{background:rgba(216,177,110,.72);border-radius:999px}.v1840-rail::-webkit-scrollbar-track{background:rgba(255,255,255,.05);border-radius:999px}",
      ".v1840-launch-group{margin-top:12px}.v1840-launch-group-label{font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.12em;color:#d8b16e;font-size:10px;margin-bottom:8px}",
      ".v1840-launch-controls{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}.v1840-launch-controls input{flex:1 1 220px;min-width:0;border:1px solid rgba(216,173,109,.45);background:rgba(0,0,0,.36);color:#f6ead8;border-radius:9px;padding:10px;font:12px 'JetBrains Mono',monospace}.v1840-launch-controls select{flex:0 0 auto;border:1px solid rgba(216,173,109,.45);background:rgba(0,0,0,.36);color:#f6ead8;border-radius:9px;padding:10px;font:12px 'JetBrains Mono',monospace}",
      ".v1851-sector-meter{border:1px solid rgba(126,160,172,.30)!important;border-radius:12px;background:rgba(126,160,172,.07);padding:11px}.v1851-sector-meter .row-title{color:#dcecf0;font-size:13px}.v1851-sector-meter .good{color:#b9dc8a}.v1851-sector-meter .bad{color:#e9927d}.v1851-sector-meter .gold{color:#f0ca7b}",
      ".v1856-risk-panel{border:1px solid rgba(233,146,125,.28);border-radius:12px;background:linear-gradient(135deg,rgba(95,45,35,.18),rgba(255,255,255,.025));padding:11px;margin:10px 0}.v1856-risk-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:7px}.v1856-risk-head span{font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.12em;color:#d8b16e;font-size:9px}.v1856-risk-head b{font-size:20px;color:#f0ca7b}.v1856-risk-head b.good{color:#b9dc8a}.v1856-risk-head b.bad{color:#e9927d}.v1856-risk-line{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px;border-top:1px solid rgba(255,255,255,.07);padding:7px 0 0;margin-top:7px}.v1856-risk-line span{color:#f6ead8;font:10px 'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.08em}.v1856-risk-line b{color:#f0ca7b;font:12px 'JetBrains Mono',monospace}.v1856-risk-line.good b{color:#b9dc8a}.v1856-risk-line.bad b{color:#e9927d}.v1856-risk-line em{grid-column:1/-1;color:#b9a98e;font:10px 'JetBrains Mono',monospace;font-style:normal;line-height:1.35}",
      ".v1857-location-panel{border:1px solid rgba(126,160,172,.28);border-radius:12px;background:linear-gradient(135deg,rgba(27,42,48,.34),rgba(255,255,255,.025));padding:12px;margin:10px 0}.v1857-market-actions{display:grid;grid-template-columns:minmax(180px,.55fr) minmax(0,1fr);gap:10px;align-items:center;border:1px solid rgba(255,255,255,.09);border-radius:10px;background:rgba(255,255,255,.035);padding:10px;margin:10px 0}.v1857-market-actions span,.v1857-site-card span{display:block;color:#d8b16e;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.12em;font-size:9px}.v1857-market-actions b,.v1857-site-card b{display:block;color:#fff3df;font-size:16px;margin-top:4px}.v1857-market-actions em,.v1857-site-card em{display:block;color:#b9a98e;font:10px 'JetBrains Mono',monospace;font-style:normal;line-height:1.4;margin-top:5px}.v1857-site-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:9px;margin-top:10px}.v1857-site-card{border:1px solid rgba(255,255,255,.11);border-radius:12px;background:rgba(255,255,255,.04);padding:11px;min-width:0}.v1857-site-card.closed{opacity:.62}.v1857-site-stats{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.v1857-site-stats i{border:1px solid rgba(255,255,255,.10);border-radius:999px;padding:4px 7px;color:#dcecf0;font:9px 'JetBrains Mono',monospace;font-style:normal}.v1857-location-history{margin-top:10px}.v1857-history-row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:8px;border-top:1px solid rgba(255,255,255,.07);padding:8px 0}.v1857-history-row span,.v1857-history-row b,.v1857-history-row em{font:9px 'JetBrains Mono',monospace;font-style:normal}.v1857-history-row span{color:#aa9a82}.v1857-history-row b{color:#f6ead8}.v1857-history-row em{color:#f0ca7b}",
      ".v1851-cash-explain{border:1px solid rgba(240,202,123,.30);border-radius:10px;background:rgba(240,202,123,.06);padding:10px;margin:0 0 10px;color:#e9d9bb;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.5}.v1851-cash-explain b{color:#f0ca7b}",
      ".v1851-cash-group{border:1px solid rgba(255,255,255,.09);border-radius:10px;background:rgba(255,255,255,.025);padding:9px;margin-top:8px}.v1851-cash-group>.v1851-cash-label{display:block;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.1em;font-size:9px;color:#d8b16e;margin-bottom:6px}.v1851-cash-group .v1840-action-strip{margin:0}",
      "@media(max-width:1060px){.v1840-main-grid,.v1840-mode-grid,.v1840-two-col{grid-template-columns:1fr}.v1840-kpi-row,.v1840-metric-grid{display:flex;overflow-x:auto;padding-bottom:9px}.v1840-metric{flex:0 0 190px}.v1840-hero{grid-template-columns:1fr}.v1840-hero strong{text-align:left}.v1840-company-card,.v1840-launch-card{flex-basis:78vw}.v1840-custom-row{grid-template-columns:1fr}.v1840-trust-head{display:block}.v1840-trust-head span{text-align:left;display:block;margin-top:4px}}"
    ].join("\n");
    document.head.appendChild(style);
  }

  if (window.registerLedgerSystem) {
    window.registerLedgerSystem({
      id: "business-entities",
      file: "pages/systems/business-entities.js",
      status: "active",
      globals: [
        "renderBusinessHubV1840",
        "setBusinessFocusV1840",
        "renameBusinessV1840",
        "setBusinessTrustPercentV1840",
        "payBusinessDividendToTrustV1840",
        "trustLoanToBusinessV1840",
        "repayTrustLoanV1840",
        "reconcileBusinessCashV1874",
        "businessEnterpriseScoreV1840"
      ],
      notes: "Business is now a focused command center: portfolio rail, one selected company desk, entity cash/tax controls, family enterprise governance, trust ownership, dividends, trust loans, successor training, acquisitions, and launch rails."
    });
  }
})();
