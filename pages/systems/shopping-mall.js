/* ============================================================================
 * shopping-mall.js  (v18.54 — The Mall: a real money sink)
 * ----------------------------------------------------------------------------
 * A place to actually spend the fortunes the business/finance systems create.
 * Two halves:
 *   1. LUXURY CATALOG — fashion, watches, jewelry, cars, boats, jets, vacation
 *      property, experiences, and trophy assets, priced from a few thousand up
 *      into the billions. Buying spends cash and gives happiness/looks/status;
 *      most items only resell for a fraction (the rest is gone — a true sink),
 *      and the big toys carry annual upkeep that keeps draining wealth.
 *   2. ART MARKET — buy artworks whose market value drifts every year. Hold and
 *      sell as a speculative store of value (the one part that can pay you back).
 *
 * Self-contained: own state on state.finance.shoppingV1854, own hub. Surfaces
 * collection value into net worth via finance-ledger's collection asset row
 * (state.finance.shoppingCollectionV1854). One guarded yearly hook for upkeep +
 * art drift. Opened with setTab('shopping').
 * ========================================================================== */
(function () {
  "use strict";
  if (window.__ledgerShoppingV1854Loaded) return;
  window.__ledgerShoppingV1854Loaded = true;

  // ---------------------------------------------------------------- helpers --
  function S() { try { if (typeof state !== "undefined" && state) return state; } catch (e) {} return window.state || {}; }
  function clampN(v, a, b) { v = Number(v); if (!Number.isFinite(v)) v = 0; return Math.max(a, Math.min(b, v)); }
  function round(v) { return Math.round(Number(v) || 0); }
  function rnd(a, b) { try { if (typeof window.rand === "function") return window.rand(a, b); } catch (e) {} return a + Math.floor(Math.random() * (b - a + 1)); }
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
  function logLine(t, d) { try { if (typeof window.addLog === "function") window.addLog(t, d || {}); } catch (e) {} }
  function applyDeltas(d) { try { if (d && Object.keys(d).length && typeof window.applyDeltas === "function") window.applyDeltas(d); } catch (e) {} }
  function rerender() { try { if (typeof window.render === "function") window.render(); } catch (e) {} }
  function saveGame() { try { if (typeof window.save === "function") window.save(); } catch (e) {} }
  function toast(m) { try { if (typeof window.addToast === "function") window.addToast(m); } catch (e) {} return false; }

  function ensure() {
    var f = fin();
    if (!f.shoppingV1854 || typeof f.shoppingV1854 !== "object" || Array.isArray(f.shoppingV1854)) {
      f.shoppingV1854 = { owned: {}, art: [], artMarket: {}, spentTotal: 0 };
    }
    var sh = f.shoppingV1854;
    if (!sh.owned || typeof sh.owned !== "object") sh.owned = {};
    if (!Array.isArray(sh.art)) sh.art = [];
    if (!Number.isFinite(sh.spentTotal)) sh.spentTotal = 0;
    if (!sh.artFilter) sh.artFilter = "rare";
    // Owned-art records are self-contained {id,name,rarity,base,trend,vol,value,
    // buy,hist,since}. Migrate any old-shape records (pre-v2) so they still work.
    sh.art.forEach(function (rec) {
      if (!rec) return;
      if (!rec.rarity) rec.rarity = "rare";
      if (!rec.name) rec.name = (OLD_ART_NAMES[rec.id] || "Salvaged Work");
      if (!Number.isFinite(rec.value)) rec.value = Number.isFinite(rec.buy) ? rec.buy : 250000;
      if (!Number.isFinite(rec.base)) rec.base = rec.value;
      if (!Number.isFinite(rec.buy)) rec.buy = rec.value;
      var rd = RARITY[rec.rarity] || RARITY.rare;
      if (!Number.isFinite(rec.trend)) rec.trend = rd.trend;
      if (!Number.isFinite(rec.vol)) rec.vol = rd.vol;
      if (!Array.isArray(rec.hist) || !rec.hist.length) rec.hist = [Math.round(rec.value * 0.96), rec.value];
      if (!Number.isFinite(rec.since)) rec.since = round(S().age || 0);
    });
    return sh;
  }
  var OLD_ART_NAMES = { street_print: "Limited Street-Art Print", emerging_canvas: "Emerging Artist Canvas", modern_sculpture: "Modern Sculpture", blue_chip: "Blue-Chip Contemporary", pop_icon: "Pop-Art Icon", old_master: "Old Master Painting", impressionist: "Impressionist Masterpiece", trophy_painting: "Record-Setting Trophy Painting" };

  // ----------------------------------------------------------- luxury catalog
  // resale = fraction of price recoverable on sale; upkeep = annual % of price.
  // happiness/looks/confidence apply once on purchase; fame for trophy pieces.
  var CATS = {
    electronics:{ name: "Electronics & Tech", icon: "💻", resale: 0.20, upkeep: 0.00, blurb: "Phones, laptops, gadgets — everyday upgrades." },
    fashion:    { name: "Fashion & Style",   icon: "👗", resale: 0.15, upkeep: 0.00, blurb: "Outfits, designer pieces, full wardrobes." },
    watches:    { name: "Watches & Jewelry", icon: "⌚", resale: 0.62, upkeep: 0.00, blurb: "Timepieces and stones that hold value." },
    cars:       { name: "Vehicles",          icon: "🚗", resale: 0.50, upkeep: 0.02, blurb: "From a used runabout to a vintage Ferrari." },
    boats:      { name: "Boats & Yachts",    icon: "🛥️", resale: 0.45, upkeep: 0.05, blurb: "Weekend boats up to megayachts." },
    air:        { name: "Aircraft",          icon: "✈️", resale: 0.50, upkeep: 0.06, blurb: "Private jets and beyond." },
    property:   { name: "Property",          icon: "🏝️", resale: 0.78, upkeep: 0.02, blurb: "Villas, chalets, and private islands." },
    experiences:{ name: "Experiences",       icon: "🎉", resale: 0.00, upkeep: 0.00, blurb: "Trips and parties — money well spent." },
    trophy:     { name: "Trophy Assets",     icon: "🏆", resale: 0.70, upkeep: 0.03, blurb: "Sports teams, a spaceport, the absurd." }
  };
  // display order for the category bar / home grid (art appended separately)
  var CAT_ORDER = ["electronics", "fashion", "watches", "cars", "boats", "air", "property", "experiences", "trophy"];

  var LUX = [
    // electronics & everyday tech (affordable entry point for any budget)
    { id: "headphones", cat: "electronics", name: "Noise-Cancelling Headphones", price: 400, happiness: 1 },
    { id: "smartwatch", cat: "electronics", name: "Smartwatch", price: 600, happiness: 1, looks: 1 },
    { id: "vr_headset", cat: "electronics", name: "VR Headset", price: 700, happiness: 2 },
    { id: "tablet", cat: "electronics", name: "Tablet", price: 1000, happiness: 1 },
    { id: "smartphone", cat: "electronics", name: "Flagship Smartphone", price: 1300, happiness: 2 },
    { id: "espresso", cat: "electronics", name: "Espresso Machine", price: 1500, happiness: 2 },
    { id: "drone", cat: "electronics", name: "Camera Drone", price: 1600, happiness: 2 },
    { id: "laptop", cat: "electronics", name: "Laptop", price: 2200, happiness: 2 },
    { id: "ebike", cat: "electronics", name: "Electric Bike", price: 2600, happiness: 3, stress: -2 },
    { id: "camera", cat: "electronics", name: "Mirrorless Camera Kit", price: 3000, happiness: 2 },
    { id: "gaming_pc", cat: "electronics", name: "Gaming PC", price: 3800, happiness: 4 },
    { id: "smart_home", cat: "electronics", name: "Smart-Home Setup", price: 6500, happiness: 2, stress: -2 },
    { id: "home_theater", cat: "electronics", name: "Home Theater System", price: 9500, happiness: 4 },
    { id: "workstation", cat: "electronics", name: "Pro Workstation Rig", price: 14000, happiness: 3, confidence: 1 },
    // fashion (cheap entry, low resale = pure flex sink)
    { id: "designer_outfit", cat: "fashion", name: "Designer Outfit", price: 5000, looks: 3, happiness: 2 },
    { id: "designer_wardrobe", cat: "fashion", name: "Full Designer Wardrobe", price: 60000, looks: 6, happiness: 4, confidence: 2 },
    { id: "haute_couture", cat: "fashion", name: "Haute Couture Collection", price: 350000, looks: 10, happiness: 6, confidence: 3 },
    { id: "fashion_line", cat: "fashion", name: "Your Own Fashion Capsule", price: 3000000, looks: 12, happiness: 8, fame: 1 },
    // watches & jewelry (hold value)
    { id: "lux_watch", cat: "watches", name: "Luxury Watch", price: 28000, looks: 3, confidence: 2 },
    { id: "grand_complication", cat: "watches", name: "Grand Complication", price: 650000, looks: 5, confidence: 3 },
    { id: "diamond_set", cat: "watches", name: "Diamond Jewelry Set", price: 2500000, looks: 8, happiness: 5 },
    { id: "crown_gem", cat: "watches", name: "Famous Crown Jewel", price: 60000000, looks: 12, happiness: 8, fame: 2 },
    // vehicles — everyday to exotic
    { id: "used_car", cat: "cars", name: "Used Car", price: 6000, happiness: 2 },
    { id: "motorcycle", cat: "cars", name: "Motorcycle", price: 16000, happiness: 3, looks: 2 },
    { id: "family_sedan", cat: "cars", name: "Family Sedan", price: 34000, happiness: 3, looks: 1 },
    { id: "pickup_truck", cat: "cars", name: "Pickup Truck", price: 48000, happiness: 3 },
    { id: "electric_suv", cat: "cars", name: "Electric SUV", price: 68000, happiness: 4, looks: 2 },
    { id: "sports_car", cat: "cars", name: "Sports Car", price: 250000, looks: 5, happiness: 5 },
    { id: "hypercar", cat: "cars", name: "Hypercar", price: 3500000, looks: 9, happiness: 8, confidence: 3 },
    { id: "vintage_ferrari", cat: "cars", name: "Vintage Ferrari (Collector)", price: 45000000, looks: 10, happiness: 9, fame: 1 },
    // boats
    { id: "yacht", cat: "boats", name: "Yacht", price: 6000000, happiness: 9, looks: 4 },
    { id: "superyacht", cat: "boats", name: "Superyacht", price: 90000000, happiness: 14, looks: 6, fame: 1 },
    { id: "megayacht", cat: "boats", name: "Megayacht", price: 650000000, happiness: 18, looks: 8, fame: 2 },
    // aircraft
    { id: "private_jet", cat: "air", name: "Private Jet", price: 45000000, happiness: 12, confidence: 4, fame: 1 },
    { id: "longrange_jet", cat: "air", name: "Long-Range Business Jet", price: 95000000, happiness: 15, confidence: 5, fame: 1 },
    { id: "private_airliner", cat: "air", name: "Custom Private Airliner", price: 450000000, happiness: 18, confidence: 6, fame: 2 },
    // vacation property
    { id: "beach_villa", cat: "property", name: "Beach Villa", price: 9000000, happiness: 12, stress: -6 },
    { id: "ski_chalet", cat: "property", name: "Ski Chalet", price: 28000000, happiness: 13, stress: -7 },
    { id: "private_island", cat: "property", name: "Private Island", price: 280000000, happiness: 20, stress: -12, fame: 2 },
    { id: "private_archipelago", cat: "property", name: "Private Archipelago", price: 1500000000, happiness: 25, stress: -15, fame: 3 },
    // experiences (consumed — resale 0, repeatable)
    { id: "world_tour", cat: "experiences", name: "Around-the-World Trip", price: 400000, happiness: 12, stress: -10, repeatable: true, buyLabel: "Book" },
    { id: "blowout_party", cat: "experiences", name: "Legendary Blowout Party", price: 1500000, happiness: 10, fame: 1, repeatable: true, buyLabel: "Throw" },
    { id: "space_trip", cat: "experiences", name: "Trip to Space", price: 55000000, happiness: 25, fame: 2, confidence: 5, repeatable: true, buyLabel: "Go" },
    // trophy assets (status + some hold value)
    { id: "sports_team_stake", cat: "trophy", name: "Minority Sports Team Stake", price: 400000000, fame: 3, happiness: 12, confidence: 4 },
    { id: "sports_franchise", cat: "trophy", name: "Own a Sports Franchise", price: 4000000000, fame: 5, happiness: 18, confidence: 6 },
    { id: "spaceport", cat: "trophy", name: "Private Spaceport", price: 1200000000, fame: 4, happiness: 15, confidence: 5 }
  ];
  function luxById(id) { for (var i = 0; i < LUX.length; i++) if (LUX[i].id === id) return LUX[i]; return null; }
  function resaleOf(item) { var c = CATS[item.cat] || {}; return Number.isFinite(item.resale) ? item.resale : (c.resale || 0); }
  function upkeepOf(item) { var c = CATS[item.cat] || {}; return Number.isFinite(item.upkeep) ? item.upkeep : (c.upkeep || 0); }

  // ------------------------------------------------------------- art catalog
  // 200 unique procedurally-generated pieces across 5 rarities. Generated
  // deterministically so each id always maps to the same name/rarity. Owned
  // pieces copy their data into self-contained records (see ensure migration).
  var RARITY = {
    common:    { id: "common",    label: "Common",     cls: "common",    color: "#a89a82", min: 2000,     max: 45000,     trend: 0.020, vol: 0.10 },
    uncommon:  { id: "uncommon",  label: "Uncommon",   cls: "uncommon",  color: "#86c2cf", min: 45000,    max: 280000,    trend: 0.030, vol: 0.15 },
    rare:      { id: "rare",      label: "Rare",       cls: "rare",      color: "#9fd07d", min: 280000,   max: 3200000,   trend: 0.045, vol: 0.19 },
    ultrarare: { id: "ultrarare", label: "Ultra Rare", cls: "ultrarare", color: "#c9a3ff", min: 3200000,  max: 65000000,  trend: 0.060, vol: 0.25 },
    superrare: { id: "superrare", label: "Legendary",  cls: "superrare", color: "#f0ca7b", min: 65000000, max: 650000000, trend: 0.072, vol: 0.30 }
  };
  var RARITY_ORDER = ["common", "uncommon", "rare", "ultrarare", "superrare"];
  var RARITY_COUNTS = { common: 90, uncommon: 20, rare: 30, ultrarare: 50, superrare: 10 }; // = 200

  // deterministic PRNG so generation is stable across sessions
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function pickR(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

  var ADJ = ["Quiet", "Crimson", "Golden", "Faded", "Silent", "Wandering", "Eternal", "Velvet", "Northern", "Hidden", "Burning", "Frozen", "Distant", "Gilded", "Restless", "Sacred", "Forgotten", "Luminous", "Fractured", "Pale", "Wild", "Sunken", "Drifting", "Echoing", "Marble", "Obsidian", "Scarlet", "Azure", "Ivory", "Amber", "Twilight", "Hollow", "Radiant", "Weeping", "Crowned", "Whispering", "Shattered", "Verdant", "Cobalt", "Dusk"];
  var SUBJ = ["Harbor", "Meadow", "Cathedral", "Orchard", "Tempest", "Reverie", "Horizon", "Lovers", "Procession", "Garden", "Requiem", "Carnival", "Mirror", "Threshold", "Bouquet", "Coastline", "Nocturne", "Pilgrim", "Apparition", "Cascade", "Idol", "Labyrinth", "Solstice", "Mirage", "Pavilion", "Voyage", "Effigy", "Aurora", "Sanctuary", "Monolith", "Empress", "Wanderer", "Cathedral", "Vineyard", "Madonna", "Oracle", "Tide", "Coronation", "Banquet", "Eclipse"];
  var FORM = ["Study", "Composition", "Fragment", "Portrait", "Landscape", "Sketch", "Etching", "Tableau", "Nocturne", "Triptych"];
  var FIRST = ["Émile", "Hélène", "Viktor", "Saoirse", "Tobias", "Mira", "Caspar", "Lucia", "Anton", "Yara", "Felix", "Noor", "Ezra", "Cosima", "Rafael", "Ingrid", "Dimitri", "Beatrix", "Søren", "Anouk", "Matthias", "Liora", "Ansel", "Greta"];
  var LAST = ["Vance", "Moreau", "Ashcombe", "Devereux", "Holt", "Castellan", "Whitlock", "Bauer", "Okonkwo", "Renard", "Stahl", "Lindqvist", "Marchetti", "Volkov", "Halloran", "Beaumont", "Cardoso", "Nyström", "Adeyemi", "Sato", "Engdahl", "Ferreira", "Kowalski", "Albrecht"];
  var GRAND = ["The Coronation", "The Last Garden", "The Drowned Empress", "Saturn's Mirror", "The Burning Cathedral", "Procession of Saints", "The Golden Apparition", "Requiem in Blue", "The Eternal Banquet", "The Fall of Icarus", "The Crowned Oracle", "The Midnight Voyage"];

  function genName(rarity, rng, n) {
    if (rarity === "superrare") return GRAND[n % GRAND.length] + (n >= GRAND.length ? " II" : "");
    if (rarity === "ultrarare") return pickR(rng, FIRST) + " " + pickR(rng, LAST) + ", " + pickR(rng, SUBJ) + " No. " + (1 + Math.floor(rng() * 40));
    if (rarity === "rare") return pickR(rng, LAST) + " — " + pickR(rng, ADJ) + " " + pickR(rng, SUBJ);
    if (rarity === "uncommon") return pickR(rng, ADJ) + " " + pickR(rng, SUBJ) + " (" + pickR(rng, FORM) + ")";
    return pickR(rng, ADJ) + " " + pickR(rng, SUBJ); // common
  }
  var RARITY_SEED = { common: 1000, uncommon: 2000, rare: 3000, ultrarare: 4000, superrare: 5000 };
  var ART_CATALOG = [];
  (function buildCatalog() {
    RARITY_ORDER.forEach(function (rar) {
      var used = {};
      for (var i = 0; i < RARITY_COUNTS[rar]; i++) {
        var rng = mulberry32(RARITY_SEED[rar] + i * 97);
        var name = genName(rar, rng, i), guard = 0;
        while (used[name] && guard++ < 12) name = genName(rar, rng, i) + " " + String.fromCharCode(65 + (guard % 26));
        used[name] = 1;
        ART_CATALOG.push({ id: "art_" + rar.charAt(0) + i, name: name, rarity: rar });
      }
    });
  })();
  function catalogById(id) { for (var i = 0; i < ART_CATALOG.length; i++) if (ART_CATALOG[i].id === id) return ART_CATALOG[i]; return null; }

  // Gacha-style discovery tiers: pay, roll a rarity by weights, get a random
  // undiscovered piece of that rarity. A money sink with a collecting payoff.
  var ROLLS = [
    { id: "flea",    name: "Flea Market Find",        icon: "🪙", cost: 12000,     w: { common: 90, uncommon: 9, rare: 0.9, ultrarare: 0.1, superrare: 0 } },
    { id: "gallery", name: "Gallery Opening",         icon: "🖼️", cost: 130000,    w: { common: 52, uncommon: 35, rare: 12, ultrarare: 0.9, superrare: 0.1 } },
    { id: "auction", name: "Auction House",           icon: "🔨", cost: 1500000,   w: { common: 12, uncommon: 35, rare: 41, ultrarare: 11, superrare: 1 } },
    { id: "evening", name: "Evening Sale",            icon: "🥂", cost: 30000000,  w: { common: 0, uncommon: 7, rare: 43, ultrarare: 45, superrare: 5 } },
    { id: "private", name: "Private Masterpiece Sale", icon: "💎", cost: 200000000, w: { common: 0, uncommon: 0, rare: 24, ultrarare: 60, superrare: 16 } }
  ];
  function rollById(id) { for (var i = 0; i < ROLLS.length; i++) if (ROLLS[i].id === id) return ROLLS[i]; return null; }

  function ownedIds() { var sh = ensure(); var m = {}; sh.art.forEach(function (r) { if (r && r.id) m[r.id] = 1; }); return m; }
  function genValue(rarity) { var rd = RARITY[rarity] || RARITY.common; return Math.round(rd.min * Math.pow(rd.max / rd.min, Math.random())); }
  // Deterministic listed price per catalog piece (stable across renders) so the
  // browse market can show consistent prices. Buying directly = pay full price
  // for the certainty of picking exactly the piece you want (vs. a cheaper roll).
  function hashId(id) { var h = 2166136261; for (var i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function catalogPrice(piece) { var rd = RARITY[piece.rarity] || RARITY.common; var f = (hashId(piece.id) % 1000) / 1000; return Math.round(rd.min * Math.pow(rd.max / rd.min, f)); }

  window.setArtFilterV1854 = function (r) { var sh = ensure(); sh.artFilter = r; saveGame(); rerender(); };
  window.buyArtDirectV1854 = function (pieceId) {
    var sh = ensure();
    var piece = catalogById(pieceId);
    if (!piece) return toast("Artwork not found.");
    if (ownedIds()[pieceId]) return toast("You already own that piece.");
    var price = catalogPrice(piece);
    if (cash() < price) return toast(piece.name + " is listed at " + compact(price) + ".");
    spend(price);
    var rd = RARITY[piece.rarity];
    sh.art.push({ id: piece.id, name: piece.name, rarity: piece.rarity, base: price, value: price, buy: price, trend: rd.trend, vol: rd.vol, hist: [Math.round(price * 0.98), price], since: round(S().age || 0) });
    recomputeCollection();
    logLine("🖼️ You bought “" + piece.name + "” (" + rd.label + ") for " + compact(price) + ".", { money: -price });
    toast("🖼️ Bought “" + piece.name + "”");
    saveGame(); rerender();
  };

  // ------------------------------------------------------- collection value --
  // Resale value of durable luxury items + current art value → net worth.
  function recomputeCollection() {
    var sh = ensure();
    var lux = 0;
    Object.keys(sh.owned).forEach(function (id) {
      if (!sh.owned[id]) return;
      var item = luxById(id); if (!item) return;
      lux += (item.price || 0) * resaleOf(item);
    });
    var art = sh.art.reduce(function (sum, r) { return sum + (Number(r && r.value) || 0); }, 0);
    fin().shoppingCollectionV1854 = round(lux + art);
    return fin().shoppingCollectionV1854;
  }
  window.shoppingCollectionValueV1854 = recomputeCollection;

  function cash() { return Math.max(0, round(S().money)); }
  function spend(amount) {
    var s = S();
    s.money = round((s.money || 0) - amount);
    var sh = ensure(); sh.spentTotal = round(sh.spentTotal + amount);
  }

  // ------------------------------------------------------------- buy / sell --
  window.buyLuxuryV1854 = function (itemId) {
    var sh = ensure();
    var item = luxById(itemId);
    if (!item) return toast("Item not found.");
    if (!item.repeatable && sh.owned[itemId]) return toast("You already own the " + item.name + ".");
    if (cash() < item.price) return toast(item.name + " costs " + compact(item.price) + ".");
    spend(item.price);
    var deltas = {};
    ["happiness", "looks", "confidence", "fame", "stress"].forEach(function (k) { if (item[k]) deltas[k] = item[k]; });
    applyDeltas(deltas);
    if (!item.repeatable) sh.owned[itemId] = true;
    recomputeCollection();
    var verb = item.cat === "experiences" ? "splurged on" : "acquired";
    logLine("🛍️ You " + verb + " " + (CATS[item.cat] ? CATS[item.cat].icon + " " : "") + item.name + " for " + compact(item.price) + ".", { money: -item.price, happiness: item.happiness || 0 });
    toast("✨ " + (item.cat === "experiences" ? "Enjoyed" : "Acquired") + ": " + item.name);
    saveGame(); rerender();
  };

  window.sellLuxuryV1854 = function (itemId) {
    var sh = ensure();
    var item = luxById(itemId);
    if (!item || !sh.owned[itemId]) return toast("You don't own that.");
    var back = round((item.price || 0) * resaleOf(item));
    delete sh.owned[itemId];
    var s = S(); s.money = round((s.money || 0) + back);
    recomputeCollection();
    logLine("💸 You sold your " + item.name + " for " + compact(back) + ".", { money: back });
    saveGame(); rerender();
  };

  // weighted rarity pick from a roll tier's odds
  function rollRarity(weights) {
    var total = 0; RARITY_ORDER.forEach(function (r) { total += (weights[r] || 0); });
    var x = Math.random() * total;
    for (var i = 0; i < RARITY_ORDER.length; i++) { var r = RARITY_ORDER[i]; x -= (weights[r] || 0); if (x <= 0) return r; }
    return "common";
  }
  function pickUndiscovered(rarity) {
    var own = ownedIds();
    var pool = ART_CATALOG.filter(function (p) { return p.rarity === rarity && !own[p.id]; });
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  }

  // The gacha: pay, roll a rarity, discover a random unowned piece of it (with a
  // fallback search if that rarity is exhausted).
  window.rollArtV1854 = function (tierId) {
    var sh = ensure();
    var tier = rollById(tierId);
    if (!tier) return toast("Unknown auction.");
    if (cash() < tier.cost) return toast(tier.name + " costs " + compact(tier.cost) + ".");
    // resolve a rarity that still has undiscovered pieces (try rolled, then others)
    var rarity = rollRarity(tier.w);
    var piece = pickUndiscovered(rarity);
    if (!piece) {
      var order = [rarity].concat(RARITY_ORDER.slice().reverse());
      for (var i = 0; i < order.length && !piece; i++) { rarity = order[i]; piece = pickUndiscovered(rarity); }
    }
    if (!piece) return toast("You've discovered every piece in existence. Bravo.");
    spend(tier.cost);
    var rd = RARITY[rarity];
    var value = genValue(rarity);
    sh.art.push({ id: piece.id, name: piece.name, rarity: rarity, base: value, value: value, buy: round(tier.cost), trend: rd.trend, vol: rd.vol, hist: [Math.round(value * 0.97), value], since: round(S().age || 0) });
    recomputeCollection();
    logLine("🖼️ " + rd.label + " find — “" + piece.name + "”, valued at " + compact(value) + " (paid " + compact(tier.cost) + ").", { money: -tier.cost });
    var bang = rarity === "superrare" ? "🌟 LEGENDARY! " : rarity === "ultrarare" ? "💜 ULTRA RARE! " : rarity === "rare" ? "💚 RARE! " : "✨ ";
    toast(bang + "“" + piece.name + "” — worth " + compact(value));
    saveGame(); rerender();
  };

  window.sellArtV1854 = function (ownedIndex) {
    var sh = ensure();
    ownedIndex = Number(ownedIndex);
    var rec = sh.art[ownedIndex];
    if (!rec) return toast("Artwork not found.");
    var val = Number(rec.value) || 0;
    var fee = Math.round(val * 0.06); // auction-house cut
    var net = Math.max(0, val - fee);
    sh.art.splice(ownedIndex, 1);
    var s = S(); s.money = round((s.money || 0) + net);
    recomputeCollection();
    var gain = net - (rec.buy || 0);
    logLine("🖼️ You sold “" + rec.name + "” for " + compact(net) + " (" + (gain >= 0 ? "+" : "") + compact(gain) + " vs. paid).", { money: net });
    saveGame(); rerender();
  };

  // ------------------------------------------------------------- yearly tick --
  // Art market drifts; durable luxury items charge upkeep. Guarded + idempotent
  // per year so it can't double-charge or throw into the year resolution.
  function tickYear() {
    try {
      var s = S(); var sh = ensure();
      if (sh._lastTickAge === s.age) return;
      sh._lastTickAge = s.age;
      // each owned piece's market value drifts (rarer = stronger trend + swings)
      sh.art.forEach(function (rec) {
        if (!rec) return;
        var move = (Number(rec.trend) || 0.03) + (Math.random() * 2 - 1) * (Number(rec.vol) || 0.15);
        rec.value = Math.max(Math.round((Number(rec.base) || rec.value || 0) * 0.25), Math.round((Number(rec.value) || 0) * (1 + move)));
        if (!Array.isArray(rec.hist)) rec.hist = [];
        rec.hist.push(rec.value);
        if (rec.hist.length > 12) rec.hist.shift();
      });
      // upkeep on durable owned items
      var upkeep = 0;
      Object.keys(sh.owned).forEach(function (id) {
        if (!sh.owned[id]) return;
        var item = luxById(id); if (!item) return;
        upkeep += (item.price || 0) * upkeepOf(item);
      });
      upkeep = round(upkeep);
      if (upkeep > 0) {
        s.money = round((s.money || 0) - upkeep);
        logLine("🧾 Upkeep on your luxury collection cost " + compact(upkeep) + " this year.", { money: -upkeep });
      }
      recomputeCollection();
    } catch (e) {}
  }
  var prevResolve = window.resolveLifeAndFinanceYear || (typeof resolveLifeAndFinanceYear === "function" ? resolveLifeAndFinanceYear : null);
  if (prevResolve && !window.__ledgerShoppingResolveWrapped) {
    window.__ledgerShoppingResolveWrapped = true;
    window.resolveLifeAndFinanceYear = function () {
      var out = prevResolve.apply(this, arguments);
      tickYear();
      return out;
    };
    try { resolveLifeAndFinanceYear = window.resolveLifeAndFinanceYear; } catch (e) {}
  }

  // ----------------------------------------------------------------- render --
  function btn(label, onclick, kind, disabled) {
    return '<button class="money-btn ' + esc(kind || "") + '" onclick="event.preventDefault();event.stopPropagation();' + onclick + '" ' + (disabled ? "disabled" : "") + '>' + esc(label) + '</button>';
  }
  // Unicode sparkline for art price history — gallery-grade flourish, no images.
  var SPARK = "▁▂▃▄▅▆▇█";
  function sparkline(values) {
    var v = (values || []).filter(function (x) { return Number.isFinite(x); });
    if (v.length < 2) return "";
    var min = Math.min.apply(null, v), max = Math.max.apply(null, v), span = max - min || 1;
    return '<span class="shop-spark">' + v.map(function (x) {
      return SPARK[Math.min(7, Math.floor(((x - min) / span) * 7.999))];
    }).join("") + '</span>';
  }
  // Rarity tiers give the catalog a premium hierarchy (badge + accent).
  function tierOf(price) {
    if (price >= 500000000) return { label: "Iconic", cls: "iconic" };
    if (price >= 25000000) return { label: "Exceptional", cls: "exceptional" };
    if (price >= 1000000) return { label: "Rare", cls: "rare" };
    if (price >= 100000) return { label: "Fine", cls: "fine" };
    return { label: "Premium", cls: "premium" };
  }
  function luxCard(item) {
    var sh = ensure();
    var owned = !!sh.owned[item.id] && !item.repeatable;
    var c = CATS[item.cat] || {};
    var tier = tierOf(item.price);
    var perks = [];
    ["happiness", "looks", "confidence", "fame"].forEach(function (k) { if (item[k]) perks.push((k === "fame" ? "Fame" : k[0].toUpperCase() + k.slice(1)) + " +" + item[k]); });
    if (item.stress) perks.push("Stress " + item.stress);
    var sub = item.repeatable ? "Repeatable — buy as often as you like" : (resaleOf(item) > 0 ? "One-time · resells ~" + Math.round(resaleOf(item) * 100) + "%" : "One-time · no resale value");
    var up = upkeepOf(item) > 0 ? " · upkeep " + compact(item.price * upkeepOf(item)) + "/yr" : "";
    var buyVerb = item.repeatable ? (item.buyLabel || "Book") : "Buy";
    var action = owned
      ? btn("Sell · " + compact(item.price * resaleOf(item)), "sellLuxuryV1854('" + esc(item.id) + "')", "blue", false)
      : btn(buyVerb + " · " + compact(item.price), "buyLuxuryV1854('" + esc(item.id) + "')", "gold", cash() < item.price);
    return '<div class="shop-card tier-' + tier.cls + (owned ? " owned" : "") + '">' +
      '<div class="shop-frame">' + (c.icon || "🛍️") + (owned ? '<span class="shop-seal">✓</span>' : '') + '</div>' +
      '<div class="shop-body">' +
        '<div class="shop-badge">' + esc(tier.label) + (item.repeatable ? " · Repeatable" : " · One-time") + '</div>' +
        '<div class="shop-name">' + esc(item.name) + '</div>' +
        '<div class="shop-meta">' + esc(perks.join(" · ") || "Pure flex") + '</div>' +
        '<div class="shop-sub">' + esc(sub + up) + '</div>' +
        '<div class="shop-actions"><span class="shop-price">' + (owned ? "OWNED" : compact(item.price)) + '</span>' + action + '</div>' +
      '</div></div>';
  }
  function rarePill(rar) { var rd = RARITY[rar] || RARITY.common; return '<span class="rar-pill rar-' + rd.cls + '">' + esc(rd.label) + '</span>'; }
  // A discovery/auction tier card — the gacha entry point.
  function rollCard(tier) {
    // headline the best two rarities this tier can yield
    var odds = RARITY_ORDER.filter(function (r) { return (tier.w[r] || 0) > 0; }).slice(-2).reverse()
      .map(function (r) { return RARITY[r].label; }).join(" / ");
    return '<div class="shop-card roll">' +
      '<div class="shop-frame roll">' + tier.icon + '</div>' +
      '<div class="shop-body">' +
        '<div class="shop-badge">Best odds: ' + esc(odds) + '</div>' +
        '<div class="shop-name">' + esc(tier.name) + '</div>' +
        '<div class="shop-meta">Discover a random undiscovered work.</div>' +
        '<div class="shop-actions"><span class="shop-price">' + compact(tier.cost) + '</span>' + btn("Acquire", "rollArtV1854('" + esc(tier.id) + "')", "gold", cash() < tier.cost) + '</div>' +
      '</div></div>';
  }
  function collectionProgress() {
    var own = ownedIds();
    var counts = { common: 0, uncommon: 0, rare: 0, ultrarare: 0, superrare: 0 };
    ART_CATALOG.forEach(function (p) { if (own[p.id]) counts[p.rarity]++; });
    var total = ART_CATALOG.length;
    var have = RARITY_ORDER.reduce(function (s, r) { return s + counts[r]; }, 0);
    var cells = RARITY_ORDER.map(function (r) {
      return '<div class="rar-cell rar-' + RARITY[r].cls + '"><b>' + counts[r] + '<small>/' + RARITY_COUNTS[r] + '</small></b><span>' + RARITY[r].label + '</span></div>';
    }).join("");
    return '<section class="shop-section"><div class="shop-section-head">📜 Collection Progress <span>' + have + ' / ' + total + ' discovered</span></div><div class="rar-grid">' + cells + '</div></section>';
  }
  function ownedCollectionSection() {
    var sh = ensure();
    var ids = Object.keys(sh.owned).filter(function (k) { return sh.owned[k]; });
    if (!ids.length) return "";
    var cards = ids.map(function (id) { var it = luxById(id); return it ? luxCard(it) : ""; }).join("");
    return '<section class="shop-section showcase"><div class="shop-section-head">💎 Your Collection <span>' + ids.length + ' piece' + (ids.length === 1 ? "" : "s") + '</span></div><div class="shop-grid">' + cards + '</div></section>';
  }
  function ownedArtRows() {
    var sh = ensure();
    if (!sh.art.length) return '<div class="shop-empty">Your walls are bare. Visit an auction above to discover your first piece.</div>';
    // rarest first so the showpieces lead
    var order = { superrare: 0, ultrarare: 1, rare: 2, uncommon: 3, common: 4 };
    var rows = sh.art.map(function (rec, i) { return { rec: rec, i: i }; })
      .sort(function (a, b) { return (order[a.rec.rarity] || 9) - (order[b.rec.rarity] || 9) || (b.rec.value || 0) - (a.rec.value || 0); });
    return rows.map(function (row) {
      var rec = row.rec, i = row.i;
      var val = Number(rec.value) || 0;
      var gain = val - (rec.buy || 0);
      return '<div class="shop-owned-row rar-edge-' + (RARITY[rec.rarity] || RARITY.common).cls + '"><div class="shop-owned-frame">🖼️</div><div class="shop-owned-info"><b>' + esc(rec.name) + '</b> ' + rarePill(rec.rarity) +
        '<span>Acquired age ' + esc(rec.since) + ' · paid ' + compact(rec.buy) + ' · now ' + compact(val) + ' <em class="' + (gain >= 0 ? "good" : "bad") + '">(' + (gain >= 0 ? "+" : "") + compact(gain) + ')</em> ' + sparkline(rec.hist) + '</span></div>' +
        btn("Sell · " + compact(val * 0.94), "sellArtV1854(" + i + ")", "blue", false) + '</div>';
    }).join("");
  }

  // ----------------------------------------------------------- category nav --
  function currentView() { var sh = ensure(); return sh.view || "home"; }
  window.shopViewV1854 = function (id) { var sh = ensure(); sh.view = String(id || "home"); saveGame(); rerender(); };

  function categoryBar() {
    var view = currentView();
    function chip(id, icon, label) {
      return '<button class="shop-tab ' + (view === id ? "active" : "") + '" onclick="event.preventDefault();event.stopPropagation();shopViewV1854(\'' + esc(id) + '\')">' + icon + ' ' + esc(label) + '</button>';
    }
    var chips = [chip("home", "🏬", "All")];
    CAT_ORDER.forEach(function (cid) { chips.push(chip(cid, CATS[cid].icon, CATS[cid].name)); });
    chips.push(chip("art", "🖼️", "Art"));
    return '<div class="shop-tabs">' + chips.join("") + '</div>';
  }
  function priceRange(items) {
    var ps = items.map(function (i) { return i.price; });
    return compact(Math.min.apply(null, ps)) + " – " + compact(Math.max.apply(null, ps));
  }
  function homeView() {
    var sh = ensure();
    var tiles = CAT_ORDER.map(function (cid) {
      var c = CATS[cid], items = LUX.filter(function (x) { return x.cat === cid; });
      var ownedN = items.filter(function (it) { return sh.owned[it.id]; }).length;
      return '<button class="shop-cat-tile" onclick="event.preventDefault();event.stopPropagation();shopViewV1854(\'' + cid + '\')"><div class="shop-cat-icon">' + c.icon + '</div><div class="shop-cat-info"><b>' + esc(c.name) + '</b><em>' + esc(c.blurb) + '</em><span>' + items.length + ' items · ' + priceRange(items) + (ownedN ? ' · ' + ownedN + ' owned' : '') + '</span></div></button>';
    });
    var own = ownedIds(), artHave = ART_CATALOG.filter(function (p) { return own[p.id]; }).length;
    tiles.push('<button class="shop-cat-tile art" onclick="event.preventDefault();event.stopPropagation();shopViewV1854(\'art\')"><div class="shop-cat-icon">🖼️</div><div class="shop-cat-info"><b>Art Collection</b><em>Discover &amp; trade 200 collectible works.</em><span>' + artHave + ' / ' + ART_CATALOG.length + ' discovered · ' + sh.art.length + ' owned</span></div></button>');
    return '<section class="shop-section"><div class="shop-section-head">🏬 Departments</div><div class="shop-cat-grid">' + tiles.join("") + '</div></section>' + ownedCollectionSection();
  }
  function luxCategoryView(cid) {
    var c = CATS[cid], items = LUX.filter(function (x) { return x.cat === cid; });
    if (!items.length) return homeView();
    return '<section class="shop-section"><div class="shop-section-head">' + c.icon + ' ' + esc(c.name) + ' <span>' + esc(c.blurb) + '</span></div><div class="shop-grid">' + items.map(luxCard).join("") + '</div></section>';
  }
  function artRail(inner) { try { if (typeof window.scrollRailV1857 === "function") return window.scrollRailV1857(inner); } catch (e) {} return '<div class="shop-mkt-rail">' + inner + '</div>'; }
  function artMarketCard(piece) {
    var own = ownedIds()[piece.id];
    var price = catalogPrice(piece);
    return '<div class="shop-mkt-card tier-' + (RARITY[piece.rarity] || RARITY.common).cls + (own ? " owned" : "") + '">' +
      '<div class="shop-mkt-frame">🖼️</div>' +
      '<div class="shop-mkt-name">' + esc(piece.name) + '</div>' +
      '<div>' + rarePill(piece.rarity) + '</div>' +
      '<div class="shop-mkt-foot">' + (own ? '<span class="shop-owned-tag">OWNED</span>' : '<span class="shop-price">' + compact(price) + '</span>' + btn("Buy", "buyArtDirectV1854('" + esc(piece.id) + "')", "gold", cash() < price)) + '</div>' +
      '</div>';
  }
  function artMarketView() {
    var sh = ensure();
    var filter = sh.artFilter || "rare";
    var chips = ["all"].concat(RARITY_ORDER).map(function (r) {
      var label = r === "all" ? "All" : RARITY[r].label;
      return '<button class="shop-mkt-chip ' + (filter === r ? "active rar-" + (RARITY[r] ? RARITY[r].cls : "") : "") + '" onclick="event.preventDefault();event.stopPropagation();setArtFilterV1854(\'' + r + '\')">' + esc(label) + '</button>';
    }).join("");
    var pool = ART_CATALOG.filter(function (p) { return filter === "all" || p.rarity === filter; });
    // undiscovered first so there's always something to buy; cap "All" for perf
    var own = ownedIds();
    pool.sort(function (a, b) { return (own[a.id] ? 1 : 0) - (own[b.id] ? 1 : 0); });
    var shown = pool.slice(0, filter === "all" ? 60 : 120);
    var cards = shown.map(artMarketCard).join("");
    return '<section class="shop-section gallery"><div class="shop-section-head">🛒 Art Market <span>browse &amp; buy any piece</span></div>' +
      '<div class="shop-mkt-chips">' + chips + '</div>' + artRail(cards) +
      '<div class="shop-sub" style="margin-top:8px">Buy exactly the piece you want at its listed price — or take a cheaper gamble in Discover above.</div></section>';
  }
  function artView() {
    var sh = ensure();
    return collectionProgress() +
      '<section class="shop-section gallery"><div class="shop-section-head">🔍 Discover Art <span>cheaper · random surprise</span></div><div class="shop-grid">' + ROLLS.map(rollCard).join("") + '</div></section>' +
      artMarketView() +
      '<section class="shop-section gallery"><div class="shop-section-head">🖼️ Your Gallery <span>' + sh.art.length + ' work' + (sh.art.length === 1 ? "" : "s") + '</span></div>' + ownedArtRows() + '</section>';
  }

  function renderShoppingHub() {
    ensure();
    recomputeCollection();
    var sh = ensure();
    var view = currentView();
    var ownedCount = Object.keys(sh.owned).filter(function (k) { return sh.owned[k]; }).length + sh.art.length;
    var collection = fin().shoppingCollectionV1854 || 0;
    var hero = '<section class="shop-hero"><div><div class="shop-kicker">🏬 The Mall</div><h2>Shopping</h2><p>From a new phone to a private island — and a 200-piece art collection to chase. Browse a department below.</p>' +
      '<div class="shop-chips"><span class="gold">Cash ' + compact(cash()) + '</span><span>Collection ' + compact(collection) + '</span><span>Owned ' + ownedCount + '</span><span>Lifetime spent ' + compact(sh.spentTotal) + '</span></div></div>' +
      '<strong>' + compact(collection) + '<span>collection value</span></strong></section>';

    var body = view === "art" ? artView() : (CATS[view] ? luxCategoryView(view) : homeView());
    return '<div class="shop-shell">' + hero + categoryBar() + body + '</div>';
  }
  window.renderShoppingHubV1854 = renderShoppingHub;

  var previousRenderHubContent = window.renderHubContent || (typeof renderHubContent === "function" ? renderHubContent : null);
  window.renderHubContent = function (hubId) {
    var id = String(hubId || "").toLowerCase();
    if (id === "shopping" || id === "mall" || id === "shop") return renderShoppingHub();
    return previousRenderHubContent ? previousRenderHubContent.apply(this, arguments) : "";
  };
  try { renderHubContent = window.renderHubContent; } catch (e) {}

  // Title the overlay header.
  var previousRenderHubOverlay = window.renderHubOverlay || (typeof renderHubOverlay === "function" ? renderHubOverlay : null);
  if (typeof previousRenderHubOverlay === "function") {
    window.renderHubOverlay = function (hubId) {
      var html = previousRenderHubOverlay.apply(this, arguments);
      var id = String(hubId || "").toLowerCase();
      if (id === "shopping" || id === "mall" || id === "shop") html = String(html).replace(/<h2>[^<]*<\/h2>/, "<h2>Shopping</h2>");
      return html;
    };
    try { renderHubOverlay = window.renderHubOverlay; } catch (e) {}
  }

  // ------------------------------------------------------------------ styles --
  try {
    if (typeof document !== "undefined" && document.head && !document.getElementById("ledger-shopping-v1854-style")) {
      var st = document.createElement("style");
      st.id = "ledger-shopping-v1854-style";
      st.textContent = [
        ".shop-shell{display:grid;gap:16px;padding:4px 0 96px;color:var(--ink,#f3efe4);min-width:0}.shop-shell *{box-sizing:border-box}",
        ".shop-hero{position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:end;border:1px solid rgba(201,155,85,.34);border-radius:18px;background:radial-gradient(circle at 10% 0,rgba(201,155,85,.22),transparent 40%),radial-gradient(circle at 92% 110%,rgba(201,155,85,.12),transparent 38%),linear-gradient(135deg,rgba(40,33,24,.97),rgba(20,17,13,.98));padding:22px;overflow:hidden;box-shadow:0 20px 54px rgba(0,0,0,.32)}",
        ".shop-kicker{font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.28em;color:var(--accent,#d0a85f);font-size:9px;font-weight:800}",
        ".shop-hero h2{margin:7px 0 7px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:700;font-size:40px;line-height:.95;color:var(--ink,#fff3df)}.shop-hero p{margin:0;max-width:760px;color:var(--dim,#cdbf9f);font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.6}",
        ".shop-hero strong{display:grid;place-items:center;min-width:150px;min-height:92px;border:1px solid rgba(201,155,85,.4);border-radius:14px;background:rgba(0,0,0,.28);color:var(--accent,#f0ca7b);font-family:Georgia,serif;font-size:26px}.shop-hero strong span{display:block;font-family:'JetBrains Mono',monospace;font-size:8px;text-transform:uppercase;letter-spacing:.16em;color:var(--faint,#b9a98e);margin-top:6px}",
        ".shop-chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:14px}.shop-chips span{border:1px solid rgba(255,255,255,.13);border-radius:999px;background:rgba(255,255,255,.05);padding:6px 11px;color:var(--dim,#cdbf9f);font-family:'JetBrains Mono',monospace;font-size:10px}.shop-chips .gold{color:var(--accent,#f0ca7b);border-color:rgba(201,155,85,.45)}",
        ".shop-section{border:1px solid var(--line,#3a3128);border-radius:16px;background:linear-gradient(135deg,rgba(34,30,23,.9),rgba(20,17,13,.96));padding:16px}.shop-section.gallery{border-color:rgba(201,155,85,.3);background:linear-gradient(135deg,rgba(38,32,24,.94),rgba(20,17,13,.97))}.shop-section.showcase{border-color:rgba(143,175,108,.34)}",
        ".shop-section-head{font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.16em;color:var(--accent,#d8b16e);font-size:11px;margin-bottom:13px;display:flex;justify-content:space-between;gap:8px;align-items:baseline}.shop-section-head span{color:var(--faint,#9a8c74);font-size:9px;letter-spacing:.1em}",
        ".shop-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,228px),1fr));gap:12px}",
        ".shop-card{position:relative;border:1px solid rgba(255,255,255,.1);border-radius:14px;background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02));display:flex;flex-direction:column;overflow:hidden;min-width:0;transition:transform .16s ease,border-color .16s ease,box-shadow .16s ease}",
        ".shop-card:hover{transform:translateY(-3px);border-color:rgba(201,155,85,.5);box-shadow:0 14px 30px rgba(0,0,0,.34)}",
        ".shop-frame{position:relative;height:88px;display:grid;place-items:center;font-size:42px;background:radial-gradient(circle at 50% 38%,rgba(201,155,85,.14),transparent 62%),rgba(0,0,0,.18);border-bottom:1px solid rgba(255,255,255,.08)}",
        ".shop-frame.art{background:radial-gradient(circle at 50% 40%,rgba(201,155,85,.16),transparent 60%),rgba(0,0,0,.26);box-shadow:inset 0 0 0 6px rgba(0,0,0,.22),inset 0 0 0 7px rgba(201,155,85,.18)}",
        ".shop-seal{position:absolute;top:7px;right:9px;width:20px;height:20px;display:grid;place-items:center;border-radius:50%;background:var(--good,#9fd07d);color:#14110d;font-size:11px;font-weight:800}",
        ".shop-body{padding:12px;display:flex;flex-direction:column;gap:5px;flex:1}",
        ".shop-badge{font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:.16em;text-transform:uppercase;color:var(--faint,#9a8c74)}",
        ".shop-name{font-family:Georgia,'Times New Roman',serif;font-size:15.5px;line-height:1.18;color:var(--ink,#fff3df)}",
        ".shop-meta{color:var(--dim,#cdbf9f);font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.45}.shop-meta b{font-weight:700}.shop-meta .good,.shop-owned-info .good{color:var(--good,#9fd07d)}.shop-meta .bad,.shop-owned-info .bad{color:var(--bad,#e58b76)}",
        ".shop-sub{color:var(--faint,#9a8c74);font-family:'JetBrains Mono',monospace;font-size:9px;line-height:1.4}",
        ".shop-spark{font-family:'JetBrains Mono',monospace;letter-spacing:-1px;color:var(--accent,#f0ca7b);font-size:12px}",
        ".shop-actions{margin-top:auto;display:flex;justify-content:space-between;align-items:center;gap:8px;padding-top:8px}.shop-price{font-family:'JetBrains Mono',monospace;color:var(--accent,#f0ca7b);font-size:12.5px;white-space:nowrap}",
        ".shop-card.owned .shop-frame{background:radial-gradient(circle at 50% 38%,rgba(143,175,108,.2),transparent 62%),rgba(0,0,0,.18)}.shop-card.owned .shop-price{color:var(--good,#9fd07d)}",
        ".shop-card.tier-rare .shop-badge{color:var(--blue,#85c1cf)}",
        ".shop-card.tier-exceptional{border-color:rgba(201,155,85,.4)}.shop-card.tier-exceptional .shop-badge{color:var(--accent,#f0ca7b)}",
        ".shop-card.tier-iconic{border-color:rgba(201,155,85,.62);box-shadow:inset 0 0 0 1px rgba(201,155,85,.22)}.shop-card.tier-iconic .shop-frame{background:radial-gradient(circle at 50% 36%,rgba(201,155,85,.28),transparent 60%),rgba(0,0,0,.2)}.shop-card.tier-iconic .shop-badge{color:#f3d98b;font-weight:800}.shop-card.tier-iconic:hover{box-shadow:inset 0 0 0 1px rgba(201,155,85,.3),0 14px 34px rgba(0,0,0,.4)}",
        ".shop-owned-row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:11px;align-items:center;border-top:1px solid rgba(255,255,255,.08);padding:10px 0}.shop-owned-row:first-of-type{border-top:0}",
        ".shop-owned-frame{width:48px;height:48px;display:grid;place-items:center;border-radius:9px;background:rgba(0,0,0,.26);box-shadow:inset 0 0 0 4px rgba(0,0,0,.22),inset 0 0 0 5px rgba(201,155,85,.18);font-size:22px}",
        ".shop-owned-info b{color:var(--ink,#fff3df);font-family:Georgia,serif;font-size:14px}.shop-owned-info span{display:block;color:var(--dim,#cdbf9f);font-family:'JetBrains Mono',monospace;font-size:10px;margin-top:3px;line-height:1.5}.shop-owned-info em{font-style:normal}",
        ".shop-empty{border:1px dashed rgba(255,255,255,.14);border-radius:10px;padding:13px;color:var(--faint,#9a8c74);font-family:'JetBrains Mono',monospace;font-size:11px}",
        ".shop-mkt-chips{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px}.shop-mkt-chip{font-family:'JetBrains Mono',monospace;font-size:10px;border:1px solid var(--line,#3a3128);border-radius:999px;background:rgba(255,255,255,.04);color:var(--dim,#cdbf9f);padding:6px 11px;cursor:pointer;white-space:nowrap}.shop-mkt-chip:hover{border-color:rgba(201,155,85,.4)}.shop-mkt-chip.active{border-color:rgba(201,155,85,.6);background:rgba(201,155,85,.12);color:var(--accent,#f0ca7b)}",
        ".shop-mkt-rail{display:flex;gap:10px;overflow-x:auto;padding:2px 2px 9px}",
        ".shop-mkt-card{flex:0 0 178px;width:178px;border:1px solid rgba(255,255,255,.1);border-radius:12px;background:rgba(255,255,255,.04);padding:11px;display:flex;flex-direction:column;gap:7px}.shop-mkt-card.owned{border-color:rgba(143,175,108,.45);background:rgba(143,175,108,.07)}.shop-mkt-card.tier-superrare{border-color:rgba(240,202,123,.5);box-shadow:inset 0 0 0 1px rgba(240,202,123,.18)}.shop-mkt-card.tier-ultrarare{border-color:rgba(201,163,255,.4)}",
        ".shop-mkt-frame{height:62px;display:grid;place-items:center;font-size:30px;border-radius:9px;background:radial-gradient(circle at 50% 40%,rgba(201,155,85,.14),transparent 60%),rgba(0,0,0,.26);box-shadow:inset 0 0 0 4px rgba(0,0,0,.22),inset 0 0 0 5px rgba(201,155,85,.16)}",
        ".shop-mkt-name{font-family:Georgia,serif;font-size:13px;color:var(--ink,#fff3df);line-height:1.2;min-height:31px}.shop-mkt-foot{margin-top:auto;display:flex;justify-content:space-between;align-items:center;gap:6px}",
        ".shop-tabs{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 8px;scrollbar-width:thin}.shop-tab{flex:0 0 auto;border:1px solid var(--line,#3a3128);border-radius:999px;background:rgba(255,255,255,.04);color:var(--dim,#cdbf9f);font-family:'JetBrains Mono',monospace;font-size:11px;padding:8px 13px;cursor:pointer;white-space:nowrap;transition:all .14s}.shop-tab:hover{border-color:rgba(201,155,85,.4);color:var(--ink,#fff3df)}.shop-tab.active{border-color:rgba(201,155,85,.7);background:rgba(201,155,85,.12);color:var(--accent,#f0ca7b)}",
        ".shop-cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr));gap:12px}.shop-cat-tile{display:flex;gap:13px;align-items:center;text-align:left;border:1px solid rgba(255,255,255,.1);border-radius:14px;background:linear-gradient(135deg,rgba(255,255,255,.05),rgba(255,255,255,.02));padding:14px;cursor:pointer;transition:transform .16s ease,border-color .16s ease}.shop-cat-tile:hover{transform:translateY(-3px);border-color:rgba(201,155,85,.5)}.shop-cat-tile.art{border-color:rgba(201,155,85,.34);background:linear-gradient(135deg,rgba(40,33,24,.7),rgba(20,17,13,.92))}",
        ".shop-cat-icon{flex:0 0 auto;width:52px;height:52px;display:grid;place-items:center;font-size:28px;border-radius:12px;background:radial-gradient(circle at 50% 38%,rgba(201,155,85,.16),transparent 62%),rgba(0,0,0,.2)}.shop-cat-info{min-width:0}.shop-cat-info b{display:block;font-family:Georgia,serif;font-size:16px;color:var(--ink,#fff3df)}.shop-cat-info em{display:block;font-style:normal;color:var(--dim,#cdbf9f);font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.4;margin:3px 0}.shop-cat-info span{display:block;color:var(--faint,#9a8c74);font-family:'JetBrains Mono',monospace;font-size:9px}",
        ".shop-frame.roll{font-size:38px;background:radial-gradient(circle at 50% 40%,rgba(201,155,85,.16),transparent 60%),rgba(0,0,0,.22)}.shop-card.roll:hover{border-color:rgba(201,155,85,.5)}",
        ".rar-pill{display:inline-block;vertical-align:middle;font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;padding:2px 7px;border-radius:999px;border:1px solid currentColor}",
        ".rar-common{color:#bcae95}.rar-uncommon{color:#86c2cf}.rar-rare{color:#9fd07d}.rar-ultrarare{color:#c9a3ff}.rar-superrare{color:#f0ca7b;text-shadow:0 0 10px rgba(240,202,123,.5)}",
        ".rar-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px}.rar-cell{border:1px solid rgba(255,255,255,.1);border-radius:11px;background:rgba(0,0,0,.2);padding:11px;text-align:center}.rar-cell b{display:block;color:var(--ink,#fff3df);font-size:19px;font-family:Georgia,serif}.rar-cell b small{font-size:11px;color:var(--faint,#9a8c74)}.rar-cell span{display:block;font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:.1em;text-transform:uppercase;margin-top:4px}.rar-cell.rar-common{border-color:rgba(188,174,149,.3)}.rar-cell.rar-uncommon{border-color:rgba(134,194,207,.4);box-shadow:inset 0 -2px 0 rgba(134,194,207,.35)}.rar-cell.rar-rare{border-color:rgba(159,208,125,.4);box-shadow:inset 0 -2px 0 rgba(159,208,125,.4)}.rar-cell.rar-ultrarare{border-color:rgba(201,163,255,.45);box-shadow:inset 0 -2px 0 rgba(201,163,255,.5)}.rar-cell.rar-superrare{border-color:rgba(240,202,123,.55);box-shadow:inset 0 -2px 0 rgba(240,202,123,.6),0 0 18px rgba(240,202,123,.12)}.rar-cell.rar-common span{color:#bcae95}.rar-cell.rar-uncommon span{color:#86c2cf}.rar-cell.rar-rare span{color:#9fd07d}.rar-cell.rar-ultrarare span{color:#c9a3ff}.rar-cell.rar-superrare span{color:#f0ca7b}",
        ".shop-owned-row{border-left:3px solid transparent;padding-left:9px}.shop-owned-row.rar-edge-common{border-left-color:#897c66}.shop-owned-row.rar-edge-uncommon{border-left-color:#86c2cf}.shop-owned-row.rar-edge-rare{border-left-color:#9fd07d}.shop-owned-row.rar-edge-ultrarare{border-left-color:#c9a3ff}.shop-owned-row.rar-edge-superrare{border-left-color:#f0ca7b;box-shadow:inset 14px 0 26px -18px rgba(240,202,123,.6)}",
        "@media(max-width:720px){.rar-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}",
        "@media(max-width:720px){.shop-hero{grid-template-columns:1fr;padding:18px}.shop-hero h2{font-size:32px}.shop-hero strong{place-items:start;min-width:0;padding:12px}.shop-owned-row{grid-template-columns:auto minmax(0,1fr)}.shop-owned-row .money-btn{grid-column:2}}"
      ].join("\n");
      document.head.appendChild(st);
    }
  } catch (e) {}
})();
