/* Vehicle collection system - v18.68.
 *
 * A richer vehicle system modeled on the property module:
 * - a 100+ vehicle catalog (generic archetypes, each with an emoji icon) across road, marine, and aircraft classes
 *   (Economy / Standard / Sport / Luxury / Exotic / Classic / Off-Road / Electric / Marine / Aircraft),
 * - buy cash or finance (credit-gated auto loan, ~5yr term, down payment),
 * - yearly depreciation for most cars, APPRECIATION for classics,
 * - condition decay + paid repairs (condition drives value + the daily-driver bonus),
 * - own multiple vehicles (garage / marina / hangar); resale value (minus loans) counts in net worth,
 * - a SIGNATURE VEHICLE grants looks/happiness by tier + condition (tracked delta, reverses),
 * - sell / pay-down-loan / repair.
 *
 * Save-safe: the legacy single `state.car` is migrated once into the collection (then cleared so
 * net worth and yearly upkeep aren't double-counted). Old `car...V1867` globals remain exposed for the runtime
 * (carYearlyTickV1867, carEquityV1867, renderGarageV1867, carEnsureV1867).
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
  function applyPlayerDeltas(d) { try { if (d && typeof window.applyDeltas === "function") window.applyDeltas(d); } catch (e) {} }
  function saveRender() {
    try { if (typeof save === "function") save(); } catch (e) {}
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

  // Auto-loan rate by credit score.
  var LOAN_TIERS = [
    { min: 780, rate: 0.039, down: 0.10 }, { min: 740, rate: 0.049, down: 0.10 },
    { min: 700, rate: 0.061, down: 0.12 }, { min: 660, rate: 0.078, down: 0.15 },
    { min: 620, rate: 0.099, down: 0.20 }, { min: 300, rate: 0.135, down: 0.30 }
  ];
  function score() { return clamp(n(fin().creditScore, 650), 300, 850); }
  function loanTier() { var s = score(); for (var i = 0; i < LOAN_TIERS.length; i++) if (s >= LOAN_TIERS[i].min) return LOAN_TIERS[i]; return LOAN_TIERS[LOAN_TIERS.length - 1]; }

  var CLASSES = {
    economy:  { label: "Economy",  color: "#9aa6b2", icon: "🚗" },
    standard: { label: "Standard", color: "#7bc7a0", icon: "🚙" },
    sport:    { label: "Sport",    color: "#5b9bd5", icon: "🏎️" },
    luxury:   { label: "Luxury",   color: "#e8a838", icon: "🚘" },
    exotic:   { label: "Exotic",   color: "#c45cff", icon: "💎" },
    classic:  { label: "Classic",  color: "#d4af37", icon: "🏛️" },
    offroad:  { label: "Off-Road", color: "#e07b39", icon: "🛻" },
    electric: { label: "Electric", color: "#2bb3a3", icon: "⚡" }
  };
  CLASSES.marine = { label: "Marine", color: "#38a8d8", icon: "⛵" };
  CLASSES.aircraft = { label: "Aircraft", color: "#b7d7ff", icon: "✈️" };
  var CATEGORIES = {
    road: { label: "Garage", icon: "🚗", place: "garage", action: "Drive" },
    marine: { label: "Marina", icon: "🛥️", place: "marina", action: "Cruise" },
    air: { label: "Hangar", icon: "✈️", place: "hangar", action: "Fly" }
  };
  function categoryDef(id) { return CATEGORIES[id] || CATEGORIES.road; }
  // deprec: yearly value change (negative = depreciates, positive = appreciates for classics).
  // Generic archetypes (no real trademarks). Tuple: [tplId,name,icon,cls,price,upkeep,deprec,reqCredit,looks,happy,desc]
  var CAR_TEMPLATES = ([
    ["beater","High-Mileage Beater","🚗","economy",4000,700,-0.10,0,0,1,"It runs. Mostly."],
    ["used_hatch","Used Hatchback","🚗","economy",13000,1100,-0.12,540,1,2,"Cheap and sensible."],
    ["subcompact","Subcompact Runabout","🚗","economy",16000,1100,-0.13,560,1,2,"City-friendly and frugal."],
    ["econ_sedan","Budget Sedan","🚗","economy",21000,1300,-0.12,580,1,3,"No frills, no surprises."],
    ["compact_hatch","Compact Hatchback","🚗","economy",24000,1300,-0.12,590,2,3,"Practical little box."],
    ["used_minivan","Used Minivan","🚐","economy",17000,1500,-0.11,560,1,2,"The carpool special."],
    ["econ_wagon","Economy Wagon","🚗","economy",27000,1400,-0.11,600,2,3,"Estate space on a budget."],
    ["starter_coupe","Starter Coupe","🚗","economy",23000,1300,-0.13,590,2,3,"First taste of two doors."],
    ["base_pickup","Base Work Pickup","🛻","economy",25000,1600,-0.10,600,2,3,"Honest hauling."],
    ["taxi_sedan","Retired Taxi Sedan","🚖","economy",9000,1200,-0.13,520,0,1,"A million miles and counting."],
    ["kei_car","Tiny Kei Car","🚗","economy",14000,800,-0.12,550,1,2,"Adorably small."],
    ["used_crossover","Used Crossover","🚙","economy",22000,1400,-0.11,580,2,3,"The default upgrade."],
    ["commuter","Commuter Sedan","🚗","standard",28000,1500,-0.11,580,2,3,"The default car. Reliable."],
    ["family_suv","Family SUV","🚙","standard",46000,2200,-0.10,600,2,4,"Room for everyone."],
    ["midsize_sedan","Midsize Sedan","🚗","standard",34000,1700,-0.11,600,3,4,"Quietly competent."],
    ["crossover","Crossover SUV","🚙","standard",39000,2000,-0.10,610,3,4,"Tall and easy."],
    ["minivan","Family Minivan","🚐","standard",41000,2100,-0.10,600,2,4,"Sliding doors, sliding standards."],
    ["midsize_pickup","Midsize Pickup","🛻","standard",42000,2200,-0.10,620,3,4,"Weekend warrior."],
    ["full_pickup","Full-Size Pickup","🛻","standard",58000,2600,-0.10,640,3,5,"Tows anything."],
    ["touring_wagon","Touring Wagon","🚙","standard",44000,2000,-0.10,620,3,5,"The thinking driver's SUV."],
    ["hybrid_sedan","Hybrid Sedan","🚗","standard",36000,1500,-0.11,620,3,4,"Sips fuel, saves face."],
    ["three_row_suv","Three-Row SUV","🚙","standard",54000,2400,-0.10,640,3,5,"Seven seats of sensible."],
    ["sport_sedan_std","Sport Sedan","🚗","standard",47000,2100,-0.11,650,4,5,"Suit by day, fun by night."],
    ["coupe_std","Two-Door Coupe","🚗","standard",40000,1900,-0.12,630,4,5,"Style on a budget."],
    ["convertible_std","Soft-Top Convertible","🚗","standard",49000,2200,-0.12,650,4,6,"Sunshine machine."],
    ["premium_cuv","Premium Crossover","🚙","standard",52000,2300,-0.11,660,4,5,"Near-luxury, real-world price."],
    ["hot_hatch","Hot Hatch","🚗","sport",39000,2000,-0.12,620,3,6,"Small, loud, quick, fun."],
    ["sport_coupe","Sports Coupe","🏎️","sport",78000,3200,-0.14,660,5,8,"Looks fast standing still."],
    ["roadster_sport","Drop-Top Roadster","🏎️","sport",72000,3000,-0.13,660,5,8,"Wind, noise, grin."],
    ["muscle_modern","Modern Muscle V8","🏎️","sport",68000,3000,-0.13,650,5,8,"Tire-smoke on tap."],
    ["pony_car","American Pony Car","🏎️","sport",55000,2600,-0.13,640,5,7,"Loud and proud."],
    ["turbo_coupe","Tuner Turbo Coupe","🏎️","sport",62000,2800,-0.13,650,5,8,"Boost is a personality."],
    ["super_saloon","Super-Saloon","🚘","sport",95000,3600,-0.14,690,6,9,"A sleeper in a sharp suit."],
    ["track_hatch","Track-Spec Hatch","🚗","sport",52000,2400,-0.13,640,4,7,"Stripped and serious."],
    ["gt_sport","Grand Touring Coupe","🏎️","sport",120000,4200,-0.14,700,6,10,"Continent-crusher."],
    ["mid_engine","Mid-Engine Sports Car","🏎️","sport",145000,4800,-0.13,720,7,11,"Balance you can feel."],
    ["roadster_premium","Premium Roadster","🏎️","sport",98000,3800,-0.14,690,6,9,"Precision al fresco."],
    ["drift_coupe","Drift Coupe","🏎️","sport",45000,2400,-0.14,630,4,7,"Built to go sideways."],
    ["hot_wagon","Performance Wagon","🚙","sport",88000,3400,-0.13,680,5,8,"Fast and useful. Rare combo."],
    ["supercharged_muscle","Supercharged Muscle","🏎️","sport",105000,4000,-0.14,700,6,10,"Brutal and brilliant."],
    ["lux_sedan","Executive Sedan","🚘","luxury",96000,3800,-0.15,690,5,9,"Quiet money on wheels."],
    ["lux_suv","Luxury SUV","🚙","luxury",135000,4600,-0.14,700,6,10,"Big, plush, unmistakable."],
    ["grand_saloon","Grand Flagship Saloon","🚘","luxury",180000,5400,-0.15,720,7,11,"The boardroom on wheels."],
    ["lux_coupe","Luxury Coupe","🏎️","luxury",165000,5000,-0.15,710,7,11,"Effortless cool."],
    ["lux_convertible","Luxury Convertible","🏎️","luxury",175000,5200,-0.15,715,7,12,"Sun and status."],
    ["limousine","Chauffeur Limousine","🚘","luxury",220000,6500,-0.14,730,7,11,"You sit in the back."],
    ["ultra_suv","Ultra-Luxury SUV","🚙","luxury",330000,7800,-0.14,760,8,13,"A lounge that climbs mountains."],
    ["lux_sport_sedan","Sport Luxury Sedan","🚘","luxury",125000,4400,-0.15,710,6,10,"Velvet glove, iron fist."],
    ["lux_gt","Luxury Grand Tourer","🏎️","luxury",280000,7000,-0.14,750,8,13,"Old money, fast."],
    ["lux_wagon","Luxury Estate","🚙","luxury",120000,4400,-0.14,700,6,10,"Understated and excellent."],
    ["armored_sedan","Armored Executive Sedan","🚘","luxury",400000,9000,-0.14,770,7,11,"Discreetly bulletproof."],
    ["flagship_coupe","Flagship Coupe","🏎️","luxury",240000,6400,-0.15,740,8,12,"The brand's best face."],
    ["spa_suv","Wellness Luxury SUV","🚙","luxury",160000,5000,-0.14,720,7,11,"Massaging seats, naturally."],
    ["supercar","Italian Supercar","🏎️","exotic",340000,12000,-0.11,740,8,15,"A weekend statement piece."],
    ["hypercar","Limited Hypercar","💎","exotic",1900000,42000,-0.08,790,10,19,"Build slot required."],
    ["brit_super","British Supercar","🏎️","exotic",320000,11000,-0.11,740,8,15,"Composed and ferocious."],
    ["german_super","German Supercar","🏎️","exotic",300000,10500,-0.12,740,8,14,"Engineered to terrify."],
    ["track_hyper","Track-Only Hypercar","🏎️","exotic",2600000,55000,-0.07,800,10,20,"Not road legal. Worth it."],
    ["v12_gt","V12 Grand Tourer","🏎️","exotic",420000,13000,-0.11,760,9,16,"Twelve cylinders of theatre."],
    ["open_super","Open-Top Supercar","🏎️","exotic",380000,12500,-0.12,750,9,16,"Roofless and reckless."],
    ["boutique_super","Boutique Supercar","🏎️","exotic",600000,16000,-0.10,770,9,17,"Hand-built rarity."],
    ["flagship_super","Flagship Supercar","🏎️","exotic",500000,15000,-0.11,770,9,17,"The halo car."],
    ["carbon_track","Carbon Track Special","🏎️","exotic",850000,20000,-0.09,780,10,18,"Featherweight fury."],
    ["one_off_hyper","One-Off Hypercar","💎","exotic",4500000,80000,-0.06,820,10,20,"Built once. For you."],
    ["jdm_legend","JDM Legend","🏎️","exotic",280000,9000,-0.09,730,8,15,"Tuner-scene royalty."],
    ["muscle","Classic Muscle Car","🚗","classic",82000,3000,0.045,660,6,9,"Restored and appreciating."],
    ["roadster","Vintage Roadster","🏎️","classic",165000,4200,0.055,700,7,12,"Decades of cool."],
    ["gt_collector","Collector Grand Tourer","🏎️","classic",950000,16000,0.060,770,9,16,"Auction-house royalty."],
    ["prewar","Pre-War Classic","🚗","classic",240000,6000,0.050,720,7,12,"Rolling history."],
    ["classic_coupe","1960s Coupe","🚗","classic",90000,3200,0.045,670,6,10,"Chrome and character."],
    ["classic_convertible","Vintage Convertible","🏎️","classic",140000,4000,0.050,700,7,11,"Top-down nostalgia."],
    ["hot_rod","Custom Hot Rod","🔥","classic",70000,3400,0.035,650,6,9,"Loud, low, lovingly built."],
    ["classic_4x4","Vintage 4x4","🚙","classic",110000,3800,0.045,680,6,10,"Rugged and rising in value."],
    ["race_classic","Historic Race Car","🏁","classic",1200000,22000,0.065,780,9,16,"Track legend with papers."],
    ["classic_lux","Classic Luxury Saloon","🚘","classic",180000,4800,0.050,710,7,12,"Old-world grandeur."],
    ["barn_find","Barn-Find Project","🚗","classic",35000,2000,0.040,600,4,7,"Diamond under the dust."],
    ["micro_classic","Classic Micro Car","🚗","classic",55000,2400,0.045,640,5,8,"Tiny, charming, collectible."],
    ["muscle_rare","Rare Muscle Convertible","🏎️","classic",320000,7000,0.060,740,8,13,"Numbers-matching unicorn."],
    ["offroad_pickup","Off-Road Pickup","🛻","offroad",48000,2400,-0.09,620,3,5,"Mud is the point."],
    ["trail_suv","Trail SUV","🚙","offroad",56000,2600,-0.09,640,4,6,"Weekend explorer."],
    ["rock_crawler","Rock Crawler","🚙","offroad",72000,3000,-0.08,660,4,7,"Climbs the unclimbable."],
    ["overland_rig","Overland Rig","🚙","offroad",95000,3600,-0.08,680,5,8,"Home is where you park it."],
    ["desert_truck","Desert Race Truck","🛻","offroad",130000,4400,-0.08,700,6,9,"Built to fly over dunes."],
    ["utility_4x4","Utility 4x4","🛻","offroad",42000,2200,-0.10,620,3,5,"Boxy and bulletproof."],
    ["lifted_pickup","Lifted Pickup","🛻","offroad",68000,3000,-0.09,650,4,7,"Tall and proud."],
    ["expedition_suv","Expedition SUV","🚙","offroad",150000,4800,-0.08,710,6,9,"Cross a continent."],
    ["dune_buggy","Dune Buggy","🏜️",   "offroad",38000,2000,-0.10,600,3,6,"Pure sandy fun."],
    ["atv_side","Side-by-Side ATV","🛻","offroad",30000,1800,-0.10,580,2,5,"Trail toy."],
    ["heavy_hauler","Heavy-Duty Hauler","🛻","offroad",85000,3400,-0.09,660,4,6,"Work that won't quit."],
    ["city_ev","City EV Hatch","⚡","electric",30000,900,-0.14,600,3,4,"Silent and cheap to run."],
    ["ev_sedan","Electric Sedan","⚡","electric",48000,1100,-0.14,620,4,6,"Instant, quiet torque."],
    ["ev_suv","Electric SUV","⚡","electric",62000,1400,-0.13,640,4,7,"Family-hauler, plugged in."],
    ["ev_crossover","Electric Crossover","⚡","electric",45000,1100,-0.13,620,4,6,"The new normal."],
    ["ev_sport","Electric Sport Sedan","⚡","electric",75000,1600,-0.13,660,5,8,"Ludicrous in a straight line."],
    ["ev_pickup","Electric Pickup","⚡","electric",70000,1500,-0.12,650,4,7,"Powers your tools too."],
    ["ev_perf","Performance EV","⚡","electric",110000,2200,-0.13,700,6,10,"Warp-speed silence."],
    ["ev_lux","Luxury Electric Sedan","⚡","electric",105000,2000,-0.14,700,6,10,"The quiet flagship."],
    ["ev_hyper","Electric Hyper-Sedan","⚡","electric",230000,3600,-0.12,740,8,13,"Four doors, four-figure horsepower."],
    ["ev_roadster","Electric Roadster","⚡","electric",220000,3400,-0.12,740,8,13,"Open-top, zero emissions."],
    ["ev_van","Electric Van","⚡","electric",55000,1300,-0.13,630,3,5,"Deliveries, electrified."]
  ]).map(function (a) { return { tplId: a[0], name: a[1], icon: a[2], cls: a[3], price: a[4], upkeep: a[5], deprec: a[6], reqCredit: a[7], looks: a[8], happy: a[9], desc: a[10], category: a[11] || "road" }; });
  CAR_TEMPLATES = CAR_TEMPLATES.concat(([
    ["fishing_boat","Fishing Boat","🎣","marine",45000,4200,-0.08,620,2,5,"Weekend water and quiet mornings.","marine"],
    ["pontoon","Family Pontoon","🛥️","marine",65000,5200,-0.09,640,3,6,"Lazy lake days, big smiles.","marine"],
    ["speedboat","Performance Speedboat","🚤","marine",180000,16000,-0.10,700,6,11,"Fast water, loud dock talk.","marine"],
    ["sailing_yacht","Sailing Yacht","⛵","marine",420000,32000,-0.06,740,7,13,"Grace, wind, and a marina bill.","marine"],
    ["motor_yacht","Motor Yacht","🛥️","marine",1800000,140000,-0.05,790,10,20,"A floating status symbol.","marine"],
    ["superyacht","Superyacht","🛳️","marine",35000000,1800000,-0.03,825,14,30,"Crewed, enormous, impossible to ignore.","marine"],
    ["ultralight","Ultralight Aircraft","🛩️","aircraft",95000,12000,-0.08,680,4,8,"Tiny cockpit, huge freedom.","air"],
    ["single_prop","Single-Engine Plane","🛩️","aircraft",420000,38000,-0.07,720,6,12,"Your first private runway habit.","air"],
    ["turboprop","Executive Turboprop","✈️","aircraft",2400000,210000,-0.06,780,9,18,"Efficient business travel.","air"],
    ["helicopter","Private Helicopter","🚁","aircraft",3600000,320000,-0.07,800,10,20,"Skip traffic entirely.","air"],
    ["light_jet","Light Private Jet","✈️","aircraft",8500000,720000,-0.05,815,12,24,"Boardroom to runway.","air"],
    ["long_range_jet","Long-Range Private Jet","🛫","aircraft",48000000,2800000,-0.04,835,15,34,"International wealth, on demand.","air"]
  ]).map(function (a) { return { tplId: a[0], name: a[1], icon: a[2], cls: a[3], price: a[4], upkeep: a[5], deprec: a[6], reqCredit: a[7], looks: a[8], happy: a[9], desc: a[10], category: a[11] || "road" }; }));
  function template(tplId) { for (var i = 0; i < CAR_TEMPLATES.length; i++) if (CAR_TEMPLATES[i].tplId === tplId) return CAR_TEMPLATES[i]; return null; }
  function classDef(id) { return CLASSES[id] || CLASSES.standard; }

  function defaultGarage() {
    return { version: 1867, nextId: 1, migrated: { legacyCar: false }, garage: [], dailyUid: null, dailyBonus: { looks: 0, happy: 0 }, lastYear: {} };
  }
  function ensureCars() {
    var f = fin();
    if (!f.carsV1867 || typeof f.carsV1867 !== "object") f.carsV1867 = defaultGarage();
    var g = f.carsV1867;
    g.version = 1867;
    g.nextId = Math.max(1, round(g.nextId || 1));
    g.migrated = g.migrated || {};
    g.garage = Array.isArray(g.garage) ? g.garage : [];
    g.dailyBonus = g.dailyBonus || { looks: 0, happy: 0 };
    if (!g.migrated.legacyCar) migrateLegacyCar(g);
    g.garage = g.garage.map(normalizeCar).filter(Boolean);
    return g;
  }
  window.carEnsureV1867 = ensureCars;
  function newUid(g) { return "car67_" + (g.nextId++); }

  function normalizeCar(c) {
    if (!c) return null;
    var g = fin().carsV1867 || { nextId: 1 };
    c.uid = c.uid || newUid(g);
    c.tplId = c.tplId || "commuter";
    c.name = c.name || "Car";
    c.cls = c.cls || (template(c.tplId) ? template(c.tplId).cls : "standard");
    c.category = c.category || (template(c.tplId) ? template(c.tplId).category : "road");
    c.icon = c.icon || (template(c.tplId) ? template(c.tplId).icon : (CLASSES[c.cls] ? CLASSES[c.cls].icon : "🚗"));
    c.buyPrice = Math.max(0, round(c.buyPrice || c.price || c.value || 0));
    c.value = Math.max(0, round(c.value == null ? c.buyPrice : c.value));
    c.loan = Math.max(0, round(c.loan || 0));
    c.loanRate = c.loan > 0 ? n(c.loanRate, 0.06) : 0;
    c.loanTermLeft = Math.max(0, round(c.loanTermLeft || (c.loan > 0 ? 5 : 0)));
    c.deprec = n(c.deprec, template(c.tplId) ? template(c.tplId).deprec : -0.11);
    c.upkeep = Math.max(0, round(c.upkeep || (template(c.tplId) ? template(c.tplId).upkeep : 1500)));
    c.condition = clamp(c.condition == null ? 90 : c.condition, 0, 100);
    c.looks = n(c.looks, template(c.tplId) ? template(c.tplId).looks : 1);
    c.happy = n(c.happy, template(c.tplId) ? template(c.tplId).happy : 2);
    c.purchaseAge = c.purchaseAge == null ? age() : round(c.purchaseAge);
    return c;
  }

  function migrateLegacyCar(g) {
    var s = S();
    var legacyId = s.car;
    if (legacyId && typeof cars !== "undefined") {
      var lc = null;
      try { lc = cars.find(function (x) { return x.id === legacyId; }); } catch (e) {}
      if (lc && lc.price) {
        g.garage.push(normalizeCar({
          uid: newUid(g), tplId: "commuter", name: lc.name || "Car", cls: lc.price > 60000 ? "luxury" : lc.price > 20000 ? "standard" : "economy",
          buyPrice: n(lc.price), value: round(n(lc.price) * 0.85), loan: 0, deprec: -0.11, category: "road",
          upkeep: n(lc.annualCost, 1500), condition: 82, looks: 0, happy: 0, purchaseAge: age()
        }));
        g.dailyUid = g.garage[g.garage.length - 1].uid;
      }
      s.car = null; // legacy car now lives in the garage; clear so net worth / upkeep don't double-count
    }
    g.migrated.legacyCar = true;
  }

  function byUid(uid) { return ensureCars().garage.find(function (c) { return String(c.uid) === String(uid); }) || null; }
  function conditionLabel(c) { c = clamp(c, 0, 100); return c >= 90 ? "Pristine" : c >= 72 ? "Great" : c >= 55 ? "Good" : c >= 35 ? "Worn" : c >= 15 ? "Rough" : "Junker"; }
  function valueFactor(cond) { return clamp(0.45 + cond / 145, 0.45, 1.0); } // condition's effect on resale (caps at full value)

  function garageStats() {
    var g = ensureCars();
    var stats = { count: g.garage.length, value: 0, debt: 0, equity: 0, upkeep: 0 };
    g.garage.forEach(function (c) {
      c = normalizeCar(c);
      stats.value += round(c.value * valueFactor(c.condition));
      stats.debt += n(c.loan);
      stats.upkeep += round(c.upkeep * (1 + Math.max(0, 70 - c.condition) / 120));
    });
    stats.value = round(stats.value); stats.debt = round(stats.debt); stats.equity = round(stats.value - stats.debt);
    return stats;
  }
  window.carGarageStatsV1867 = garageStats;
  window.carEquityV1867 = function () { return garageStats().equity; };
  window.carValueV1867 = function () { return garageStats().value; };

  // Signature-vehicle looks/happiness, applied as a tracked delta (reverses when you change/sell it).
  function dailyLifestyle(c) {
    if (!c) return { looks: 0, happy: 0 };
    var f = clamp(0.5 + c.condition / 150, 0.5, 1.05);
    return { looks: Math.round(n(c.looks) * f), happy: Math.round(n(c.happy) * f) };
  }
  function applyDailyBonus(looks, happy) {
    var g = ensureCars();
    var prev = g.dailyBonus || { looks: 0, happy: 0 };
    var dl = round(looks) - n(prev.looks), dh = round(happy) - n(prev.happy);
    if (dl || dh) applyPlayerDeltas({ looks: dl, happiness: dh });
    g.dailyBonus = { looks: round(looks), happy: round(happy) };
  }
  function dailyCar() { var g = ensureCars(); return g.dailyUid ? byUid(g.dailyUid) : null; }
  function refreshDailyBonus() { var c = dailyCar(); var ls = c ? dailyLifestyle(c) : { looks: 0, happy: 0 }; applyDailyBonus(ls.looks, ls.happy); }
  window.carDailyV1867 = dailyCar;

  window.carBuyV1867 = function (tplId, mode) {
    var g = ensureCars();
    var t = template(tplId); if (!t) return toast("That model isn't available.");
    mode = mode === "finance" ? "finance" : "cash";
    var tier = loanTier();
    var price = round(t.price);
    var down = mode === "cash" ? price : round(price * tier.down);
    if (mode === "finance" && score() < t.reqCredit) return toast("Credit too low to finance this. Need " + t.reqCredit + "+.");
    if (cash() < down) return toast("Need " + compact(down) + (mode === "cash" ? " cash." : " down."));
    S().money = round(cash() - down);
    var loan = mode === "cash" ? 0 : Math.max(0, price - down);
    var c = normalizeCar({
      uid: newUid(g), tplId: t.tplId, name: t.name, cls: t.cls, category: t.category, buyPrice: price,
      value: price, loan: loan, loanRate: loan ? tier.rate : 0, loanTermLeft: loan ? 5 : 0,
      deprec: t.deprec, upkeep: t.upkeep, condition: 96, looks: t.looks, happy: t.happy, purchaseAge: age()
    });
    g.garage.push(c);
    if (!g.dailyUid) { g.dailyUid = c.uid; refreshDailyBonus(); }
    var f = fin(); f.creditScore = clamp(score() + (mode === "cash" ? 1 : -3), 300, 850);
    logEvent("Bought a " + t.name + " for " + compact(price) + (loan ? " (" + compact(down) + " down, " + compact(loan) + " financed)." : " in cash."), { money: -down });
    toast("Added the " + t.name + " to your vehicle collection.");
    saveRender();
  };
  window.carSetDailyV1867 = function (uid) {
    var g = ensureCars(); var c = byUid(uid); if (!c) return toast("Vehicle not found.");
    g.dailyUid = c.uid; refreshDailyBonus();
    logEvent(c.name + " is now your signature vehicle.", {});
    toast(c.name + " is now your signature vehicle.");
    saveRender();
  };
  window.carRepairV1867 = function (uid) {
    var c = byUid(uid); if (!c) return toast("Vehicle not found.");
    if (c.condition >= 96) return toast("It's already in great shape.");
    var cost = Math.max(400, round(c.value * (0.04 + (90 - c.condition) / 600)));
    if (cash() < cost) return toast("A full service costs " + compact(cost) + ".");
    S().money = round(cash() - cost);
    c.condition = clamp(c.condition + 22 + Math.random() * 10, 0, 100);
    if (dailyCar() && dailyCar().uid === c.uid) refreshDailyBonus();
    logEvent("Serviced the " + c.name + " for " + compact(cost) + ".", { money: -cost });
    saveRender();
  };
  window.carPayLoanV1867 = function (uid, amount) {
    var c = byUid(uid); if (!c || n(c.loan) <= 0) return toast("No loan on that vehicle.");
    var pay = amount === "max" ? Math.min(round(cash()), round(c.loan)) : Math.min(round(c.loan), Math.max(0, round(amount)));
    if (pay <= 0) return toast("Nothing to pay.");
    if (cash() < pay) return toast("Not enough cash.");
    S().money = round(cash() - pay);
    c.loan = Math.max(0, round(c.loan - pay));
    if (c.loan <= 0) { c.loanRate = 0; c.loanTermLeft = 0; }
    logEvent("Paid " + compact(pay) + " toward the " + c.name + " loan.", { money: -pay });
    saveRender();
  };
  window.carSellV1867 = function (uid) {
    var g = ensureCars(); var c = byUid(uid); if (!c) return toast("Vehicle not found.");
    var resale = round(c.value * valueFactor(c.condition) * 0.95);
    var net = round(resale - n(c.loan));
    var idx = g.garage.indexOf(c); if (idx >= 0) g.garage.splice(idx, 1);
    if (g.dailyUid === c.uid) { g.dailyUid = g.garage.length ? g.garage[0].uid : null; refreshDailyBonus(); }
    S().money = round(cash() + net);
    logEvent("Sold the " + c.name + " for " + compact(resale) + (c.loan ? " (loan " + compact(c.loan) + " settled)" : "") + ". Net " + compact(net) + ".", { money: net });
    toast("Sold the " + c.name + ".");
    saveRender();
  };

  window.carYearlyTickV1867 = function () {
    var g = ensureCars();
    if (!g.garage.length) return;
    var s = S(); var totalUpkeep = 0, totalLoan = 0;
    g.garage.forEach(function (c) {
      c = normalizeCar(c);
      var noise = (Math.random() - 0.5) * 0.03;
      c.value = Math.max(200, round(c.value * (1 + n(c.deprec) + noise)));
      c.condition = clamp(c.condition - (3 + Math.random() * 5), 0, 100);
      var upkeep = round(c.upkeep * (1 + Math.max(0, 70 - c.condition) / 120));
      totalUpkeep += upkeep;
      if (n(c.loan) > 0) {
        var rate = n(c.loanRate);
        var term = Math.max(1, n(c.loanTermLeft, 5));
        var pay = rate > 0 ? Math.min(round(c.loan * rate / (1 - Math.pow(1 + rate, -term))), round(c.loan + c.loan * rate)) : round(c.loan / term);
        var interest = round(c.loan * rate);
        c.loan = Math.max(0, round(c.loan - Math.max(0, pay - interest)));
        c.loanTermLeft = Math.max(0, n(c.loanTermLeft) - 1);
        if (c.loan <= 0) { c.loanRate = 0; c.loanTermLeft = 0; }
        totalLoan += pay;
      }
    });
    s.money = round(cash() - totalUpkeep - totalLoan);
    refreshDailyBonus();
    g.lastYear = { upkeep: totalUpkeep, loan: totalLoan };
    if (totalUpkeep + totalLoan > 0) logEvent("Vehicles: upkeep " + compact(totalUpkeep) + (totalLoan ? ", loans " + compact(totalLoan) : "") + ".", { money: -(totalUpkeep + totalLoan) });
  };

  // ---------- UI ----------
  function styleBlock() {
    return `<style>
      .car1867{display:flex;flex-direction:column;gap:12px}
      .car1867 *{box-sizing:border-box}
      .car1867 .c-band{border:1px solid var(--border);background:rgba(255,255,255,.035);border-radius:8px;padding:12px}
      .car1867 .c-kick{font-family:var(--mono,monospace);font-size:10px;letter-spacing:1.4px;text-transform:uppercase;color:var(--muted)}
      .car1867 .c-title{font-weight:800;font-size:16px;line-height:1.15}
      .car1867 .c-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
      .car1867 .c-stat{border:1px solid var(--border);border-radius:8px;padding:10px;background:rgba(0,0,0,.16);min-width:0}
      .car1867 .c-stat b{display:block;font-size:15px;color:var(--accent)} .car1867 .c-stat span{display:block;font-size:11px;color:var(--muted)}
      .car1867 .c-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:8px}
      .car1867 .c-card{border:1px solid var(--border);border-radius:8px;padding:10px;background:rgba(0,0,0,.14);min-width:0}
      .car1867 .c-cls{font-family:var(--mono,monospace);font-size:10px;letter-spacing:.4px;text-transform:uppercase;border:1px solid var(--border);border-radius:999px;padding:2px 7px;font-weight:700;white-space:nowrap}
      .car1867 .c-tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}
      .car1867 .c-tag{font-family:var(--mono,monospace);font-size:10px;border:1px solid var(--border);border-radius:999px;padding:3px 7px;color:var(--muted)}
      .car1867 .c-bar{height:7px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden;margin-top:6px}
      .car1867 .c-bar i{display:block;height:100%;background:var(--good)}
      .car1867 .c-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
      .car1867 .c-actions button{border:1px solid var(--border);background:rgba(255,255,255,.055);color:var(--text);border-radius:999px;padding:7px 10px;font-size:12px;cursor:pointer}
      .car1867 .c-actions button:disabled{opacity:.45;cursor:not-allowed}
      .car1867 .c-actions button.on{border-color:var(--accent);background:rgba(232,168,56,.14);color:var(--accent);font-weight:700}
      .car1867 .good{color:var(--good)} .car1867 .bad{color:var(--bad)} .car1867 .warn{color:var(--accent)}
      @media(max-width:760px){.car1867 .c-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.car1867 .c-list{grid-template-columns:1fr}}
    </style>`;
  }
  function garageCard(c, g) {
    c = normalizeCar(c);
    var cd = classDef(c.cls);
    var cat = categoryDef(c.category);
    var resale = round(c.value * valueFactor(c.condition));
    var isDaily = g.dailyUid === c.uid;
    var apprec = n(c.deprec) >= 0;
    return `<div class="c-card" style="border-left:3px solid ${cd.color}">
      <div style="display:flex;justify-content:space-between;gap:8px">
        <div><div class="c-title">${c.icon || "🚗"} ${esc(c.name)}</div><div style="font-size:12px;color:var(--muted);display:flex;align-items:center;gap:6px;flex-wrap:wrap"><span class="c-cls" style="border-color:${cd.color};color:${cd.color}">${cd.icon || ""} ${esc(cd.label)}</span><span class="c-cls">${cat.icon} ${esc(cat.label)}</span>${isDaily ? "Signature vehicle" : "In the " + cat.place}</div></div>
        <div style="text-align:right"><b style="color:var(--accent)">${compact(resale - n(c.loan))}</b><div style="font-size:11px;color:var(--muted)">equity</div></div>
      </div>
      <div class="c-grid" style="grid-template-columns:repeat(3,minmax(0,1fr));margin-top:8px">
        <div class="c-stat"><span>Value</span><b>${compact(resale)}</b></div>
        <div class="c-stat"><span>Loan</span><b class="${c.loan ? "warn" : "good"}">${compact(c.loan)}</b></div>
        <div class="c-stat"><span>${apprec ? "Appreciates" : "Depreciates"}</span><b class="${apprec ? "good" : "bad"}">${(n(c.deprec) * 100).toFixed(1)}%/yr</b></div>
      </div>
      <div class="c-bar"><i style="width:${clamp(c.condition, 0, 100)}%;background:${c.condition >= 72 ? "var(--good)" : c.condition >= 35 ? "var(--accent)" : "var(--bad)"}"></i></div>
      <div class="c-tags"><span class="c-tag">Condition ${round(c.condition)}/100 ${esc(conditionLabel(c.condition))}</span><span class="c-tag">Upkeep ${compact(c.upkeep)}/yr</span>${isDaily ? `<span class="c-tag" style="border-color:var(--good);color:var(--good)">Signature +${dailyLifestyle(c).happy} happy, +${dailyLifestyle(c).looks} looks</span>` : ""}</div>
      <div class="c-actions">
        <button class="${isDaily ? "on" : ""}" onclick="carSetDailyV1867('${js(c.uid)}')">${isDaily ? "Signature ✓" : "Set signature"}</button>
        <button onclick="carRepairV1867('${js(c.uid)}')" ${c.condition >= 96 ? "disabled" : ""}>Service</button>
        <button onclick="carPayLoanV1867('${js(c.uid)}',10000)" ${c.loan ? "" : "disabled"}>Pay $10K</button>
        <button onclick="carPayLoanV1867('${js(c.uid)}','max')" ${c.loan ? "" : "disabled"}>Pay off</button>
        <button onclick="carSellV1867('${js(c.uid)}')">Sell</button>
      </div>
    </div>`;
  }
  function marketCard(t) {
    var cd = classDef(t.cls);
    var cat = categoryDef(t.category);
    var tier = loanTier();
    var down = round(t.price * tier.down);
    var canCash = cash() >= t.price, canFin = score() >= t.reqCredit && cash() >= down;
    var apprec = n(t.deprec) >= 0;
    return `<div class="c-card" style="border-left:3px solid ${cd.color}">
      <div style="display:flex;justify-content:space-between;gap:8px">
        <div><div class="c-title">${t.icon || "🚗"} ${esc(t.name)}</div><div style="font-size:12px;color:var(--muted);display:flex;align-items:center;gap:6px;flex-wrap:wrap"><span class="c-cls" style="border-color:${cd.color};color:${cd.color}">${cd.icon || ""} ${esc(cd.label)}</span><span class="c-cls">${cat.icon} ${esc(cat.label)}</span>${esc(t.desc)}</div></div>
        <div style="text-align:right"><b style="color:var(--accent)">${compact(t.price)}</b></div>
      </div>
      <div class="c-tags"><span class="c-tag">+${t.happy} happy</span><span class="c-tag">+${t.looks} looks</span><span class="c-tag ${apprec ? "good" : ""}">${apprec ? "+" : ""}${(t.deprec * 100).toFixed(1)}%/yr</span><span class="c-tag">Upkeep ${compact(t.upkeep)}/yr</span>${t.reqCredit ? `<span class="c-tag">Finance credit ${t.reqCredit}</span>` : ""}</div>
      <div class="c-actions">
        <button onclick="carBuyV1867('${js(t.tplId)}','finance')" ${canFin ? "" : "disabled"}>Finance &middot; ${compact(down)} down</button>
        <button onclick="carBuyV1867('${js(t.tplId)}','cash')" ${canCash ? "" : "disabled"}>Cash &middot; ${compact(t.price)}</button>
      </div>
    </div>`;
  }
  function renderGarageCore() {
    var g = ensureCars();
    var stats = garageStats();
    var daily = dailyCar();
    var catCounts = { road: 0, marine: 0, air: 0 };
    g.garage.forEach(function (c) { c = normalizeCar(c); catCounts[c.category] = n(catCounts[c.category]) + 1; });
    var byClass = {};
    CAR_TEMPLATES.forEach(function (t) { (byClass[t.cls] = byClass[t.cls] || []).push(t); });
    var market = Object.keys(CLASSES).filter(function (k) { return byClass[k]; }).map(function (k) {
      return `<div><div class="c-kick" style="color:${classDef(k).color};font-size:12px;border-left:3px solid ${classDef(k).color};padding-left:8px">${classDef(k).icon || ""} ${esc(classDef(k).label)} &middot; ${byClass[k].length} models</div><div class="c-list" style="margin-top:6px">${byClass[k].map(marketCard).join("")}</div></div>`;
    }).join("");
    var garageHtml = g.garage.length
      ? `<div><div class="c-kick">Your vehicle collection</div><div class="c-list" style="margin-top:6px">${g.garage.map(function (c) { return garageCard(c, g); }).join("")}</div></div>`
      : `<div class="c-band"><div class="c-title">No vehicles yet.</div><div style="font-size:12px;color:var(--muted);margin-top:4px">Buy one below - cash or financed. Pick a signature vehicle for a looks and happiness boost.</div></div>`;
    return `<section class="panel car1867">${styleBlock()}
      <div class="section-label">Vehicles</div>
      <div class="c-grid">
        <div class="c-stat"><span>Collection value</span><b>${compact(stats.value)}</b></div>
        <div class="c-stat"><span>Vehicle loans</span><b class="${stats.debt ? "warn" : "good"}">${compact(stats.debt)}</b></div>
        <div class="c-stat"><span>Equity</span><b>${compact(stats.equity)}</b></div>
        <div class="c-stat"><span>Signature vehicle</span><b style="font-size:13px">${daily ? esc(daily.name) : "None"}</b></div>
      </div>
      <div class="c-tags"><span class="c-tag">🚗 Garage ${catCounts.road || 0}</span><span class="c-tag">🛥️ Marina ${catCounts.marine || 0}</span><span class="c-tag">✈️ Hangar ${catCounts.air || 0}</span></div>
      ${garageHtml}
      <div><div class="c-kick">Vehicle market</div></div>
      ${market}
    </section>`;
  }
  window.renderGarageV1867 = function () { return renderGarageCore(); };
})();
