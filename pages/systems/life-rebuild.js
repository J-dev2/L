/* ============================================================================
   LIFE — PAGE REBUILD  (v18.71)
   A clean, popup-driven Life hub that REPLACES the old stacked Life page.
   - Compact status header: Health / Stress / Mental / Energy / Happiness / Money
   - A tidy grid of category buttons that open POPUPS reusing the EXISTING openers
     (doActivity, renderWellbeingPanelV1870, setLifeFocus/Lifestyle/Goal, martial arts)
   - A cheap, one-click, repeatable de-stress (small fixed cost, NOT a money sink)
   - NEW money-sinks live in their own areas: Luxury goods, Experiences (+ a Status tier)
   - A small recent timeline

   STYLE: uses the project design system — theme tokens (var(--bg/--card/--line/--ink/
   --dim/--accent/--accent-2/--good/--bad/--money)) and the existing component classes
   (.panel, .section-label, .row/.row-title/.row-sub, .icon-btn, .lf-card/.lf-grid/.lf-pill,
   .school-menu-grid/.school-menu-card, .bar/.fill, .money-btn, .life-memory, .hub-close).
   Only a tiny dialog-shell + hero stylesheet is injected, and it uses the same tokens.

   Design rules honored:
   - Reuses the existing action handlers; it does NOT rewrite them.
   - Stress relief stays cheap + repeatable; the real spending decisions are Luxury / Experiences.
   - Luxury + experience spend are PURE SINKS — never added to net worth (no double-count).

   Integration: wraps renderHubContent (loaded AFTER life-command.js + life-wellbeing.js so it is
   the OUTERMOST wrap) and RETURNS a fresh layout for ids lifehub/life/stack/life-stack.
   The popup overlay is appended to <body> (a sibling of #app) so it survives the runtime's
   #app re-renders; a render() wrap refreshes the open popup in place after any reused action.
   ========================================================================== */
(function () {
  "use strict";
  if (window.__ledgerLifeRebuildV1871) return;
  window.__ledgerLifeRebuildV1871 = true;

  /* ----------------------------- tiny helpers ----------------------------- */
  function S() { return window.state || null; }
  function num(v, d) { v = Number(v); return isNaN(v) ? (d || 0) : v; }
  function clampN(v, lo, hi) { v = Number(v) || 0; return Math.max(lo, Math.min(hi, v)); }
  function c100(v) { return clampN(v, 0, 100); }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function age() { var s = S(); return s ? num(s.age) : 0; }
  function cash() { var s = S(); return s ? num(s.money) : 0; }
  function alive() { var s = S(); return !!(s && s.alive); }
  function pending() { var s = S(); return !!(s && s.pending); }
  function actions() { var s = S(); if (s && !s.actionsTaken) s.actionsTaken = {}; return s ? s.actionsTaken : {}; }
  function log(msg, d) { try { if (typeof window.addLog === "function") window.addLog(msg, d || {}); } catch (e) {} }
  function toast(msg) { try { if (typeof window.addToast === "function") window.addToast(msg); } catch (e) {} }
  function saveGame() { try { if (typeof window.save === "function") window.save(); } catch (e) {} }
  function rerender() { try { if (typeof window.render === "function") window.render(); } catch (e) {} }
  function applyStats(d) { try { if (typeof window.applyDeltas === "function") window.applyDeltas(d || {}); } catch (e) {} }
  function memory(text) { try { if (typeof window.addLifeMemory === "function") window.addLifeMemory(text); } catch (e) {} }
  function money(v) {
    v = Math.round(num(v));
    try { if (typeof window.money === "function") return window.money(v); } catch (e) {}
    var a = Math.abs(v), sign = v < 0 ? "-" : "";
    if (a >= 1e9) return sign + "$" + (a / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
    if (a >= 1e6) return sign + "$" + (a / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (a >= 1e4) return sign + "$" + Math.round(a / 1e3) + "K";
    return sign + "$" + a.toLocaleString();
  }
  function stats() {
    var s = S(); if (!s) return {};
    if (!s.stats || typeof s.stats !== "object") s.stats = {};
    var t = s.stats;
    if (t.stress == null) t.stress = 25;
    if (t.health == null) t.health = 80;
    if (t.mentalHealth == null) t.mentalHealth = 75;
    if (t.energy == null) t.energy = 70;
    if (t.happiness == null) t.happiness = 65;
    return t;
  }
  function stageName() {
    try { if (typeof window.lifeStage === "function") return window.lifeStage(); } catch (e) {}
    var a = age();
    if (a < 13) return "Child"; if (a < 18) return "Teen"; if (a < 30) return "Young Adult";
    if (a < 55) return "Adult"; if (a < 70) return "Mature Adult"; return "Elder";
  }
  function genderText() {
    var g = String((S() || {}).gender || "").toLowerCase();
    if (g === "male") return "♂ Male";
    if (g === "female") return "♀ Female";
    if (g === "nonbinary" || g === "non-binary" || g === "nb") return "⚧ Nonbinary";
    if (g) return g.charAt(0).toUpperCase() + g.slice(1);
    return "";
  }
  function netWorth() {
    try { if (typeof window.financeNetWorth === "function") return Math.round(num(window.financeNetWorth())); } catch (e) {}
    try { if (typeof window.legacyNetWorth === "function") return Math.round(num(window.legacyNetWorth())); } catch (e2) {}
    return cash();
  }

  /* ====================================================================
     MONEY SINKS — Luxury goods, Experiences, and a derived Status tier.
     These are intentionally PURE SINKS: spend is gone, status/joy remain.
     Nothing here is added to net worth (avoids the double-count traps the
     finance system warns about). Lifestyle (yearly) already lives in Focus.
     ==================================================================== */
  // tier weight = tier^2 -> 1 / 4 / 9 / 16 (drives the Status ladder)
  var LUX = [
    { id: "bag",       icon: "👜", name: "Designer bag",        tier: 1, cost: 12000,   deltas: { happiness: 4, looks: 3 },                 note: "A first taste of the good stuff." },
    { id: "wardrobe",  icon: "🧥", name: "Bespoke wardrobe",    tier: 2, cost: 65000,   deltas: { looks: 6, confidence: 4, happiness: 3 },   note: "Tailored, head to toe." },
    { id: "watch",     icon: "⌚", name: "Luxury watch",        tier: 2, cost: 35000,   deltas: { happiness: 5, looks: 2, confidence: 3 },   note: "Quiet, expensive timekeeping." },
    { id: "wine",      icon: "🍷", name: "Rare wine cellar",    tier: 2, cost: 125000,  deltas: { happiness: 6, confidence: 3 },             note: "Vintages older than you." },
    { id: "jewelry",   icon: "💎", name: "Fine jewelry",        tier: 3, cost: 240000,  deltas: { happiness: 7, looks: 6, confidence: 4 },   note: "It catches every light in the room." },
    { id: "art",       icon: "🎨", name: "Original artwork",    tier: 3, cost: 325000,  deltas: { happiness: 7, creativity: 5, confidence: 4 }, note: "A signed original on your wall." },
    { id: "instrument",icon: "🎻", name: "Antique instrument",  tier: 3, cost: 180000,  deltas: { creativity: 6, happiness: 5 },             note: "A voice that took centuries to find." },
    { id: "yacht",     icon: "🛥️", name: "Yacht membership",    tier: 3, cost: 650000,  deltas: { happiness: 10, confidence: 6 },            note: "Open water, on call." },
    { id: "diamond",   icon: "💍", name: "Statement diamond",   tier: 4, cost: 900000,  deltas: { happiness: 9, looks: 7, confidence: 6 },   note: "Flawless and frankly absurd." },
    { id: "chip",      icon: "🖼️", name: "Blue-chip art piece", tier: 4, cost: 2400000, deltas: { happiness: 12, confidence: 8, creativity: 5 }, note: "Museum-grade. People know the name." },
    { id: "heli",      icon: "🚁", name: "Private helicopter",  tier: 4, cost: 4800000, deltas: { happiness: 13, confidence: 10 },           note: "Traffic is now optional." },
    { id: "island",    icon: "🏝️", name: "Private island share",tier: 4, cost: 9000000, deltas: { happiness: 18, confidence: 12 },           note: "Your name on a dot in the ocean." },
    { id: "jet",       icon: "🛩️", name: "Private jet",         tier: 5, cost: 60000000,   deltas: { happiness: 15, confidence: 12 },             note: "The world shrinks to a few hours." },
    { id: "foundation",icon: "🏛️", name: "Named foundation",    tier: 5, cost: 200000000,  deltas: { happiness: 12, karma: 15, confidence: 8 },    note: "Your name on something that does good." },
    { id: "megayacht", icon: "🛥️", name: "Mega-yacht",          tier: 5, cost: 450000000,  deltas: { happiness: 18, confidence: 13, looks: 4 },    note: "A floating address with a helipad." },
    { id: "team",      icon: "🏟️", name: "Pro sports team",     tier: 5, cost: 1500000000, deltas: { happiness: 20, confidence: 15, popularity: 12 }, note: "Game day is personal now." }
  ];
  var EXP = [
    { id: "festival", icon: "🎟️", name: "VIP festival weekend",   cost: 18000,  deltas: { happiness: 8,  stress: -5, energy: -2 }, mem: "A blur of music, lights, and friends." },
    { id: "track",    icon: "🏎️", name: "Supercar track day",     cost: 30000,  deltas: { happiness: 9,  confidence: 3, stress: -3 }, mem: "You finally found out what 200mph feels like." },
    { id: "opera",    icon: "🎭", name: "A season at the opera",  cost: 45000,  deltas: { happiness: 7,  creativity: 3, stress: -4 }, mem: "A box seat and a year of grand nights out." },
    { id: "food",     icon: "🍽️", name: "Michelin food tour",     cost: 65000,  deltas: { happiness: 10, stress: -4 }, mem: "You ate your way across three continents." },
    { id: "safari",   icon: "🦁", name: "Luxury safari",          cost: 90000,  deltas: { happiness: 11, stress: -7, health: 2 }, mem: "Dawn over the savanna, lions in the grass." },
    { id: "everest",  icon: "🏔️", name: "Everest base-camp trek", cost: 120000, deltas: { happiness: 12, athleticism: 4, stress: -6 }, mem: "You stood where the air runs thin." },
    { id: "world",    icon: "🌍", name: "Around-the-world trip",   cost: 180000, deltas: { happiness: 18, stress: -12, energy: 4 }, mem: "Months on the move; you came back different." },
    { id: "space",    icon: "🚀", name: "Suborbital space flight", cost: 750000, deltas: { happiness: 25, confidence: 10, stress: -10 }, mem: "You saw the curve of the Earth with your own eyes." },
    { id: "gala",     icon: "🎗️", name: "Host a charity gala",     cost: 6500000,  deltas: { happiness: 12, karma: 8, popularity: 6 }, mem: "A glittering night that raised millions for a cause." },
    { id: "orbit",    icon: "🛰️", name: "A week on the space station", cost: 45000000, deltas: { happiness: 30, confidence: 15, stress: -15 }, mem: "You floated above the world for seven whole days." }
  ];
  function luxDef(id) { for (var i = 0; i < LUX.length; i++) if (LUX[i].id === id) return LUX[i]; return null; }
  function expDef(id) { for (var i = 0; i < EXP.length; i++) if (EXP[i].id === id) return EXP[i]; return null; }
  function lux() {
    var s = S(); if (!s) return { owned: [], lifetimeSpend: 0 };
    if (!s.luxuryV1871 || typeof s.luxuryV1871 !== "object") s.luxuryV1871 = { owned: [], lifetimeSpend: 0 };
    var L = s.luxuryV1871;
    if (!Array.isArray(L.owned)) L.owned = [];
    if (typeof L.lifetimeSpend !== "number") L.lifetimeSpend = 0;
    return L;
  }
  function ownsLux(id) { return lux().owned.indexOf(id) >= 0; }
  function statusScore() {
    var L = lux(), sc = 0;
    L.owned.forEach(function (id) { var d = luxDef(id); if (d) sc += d.tier * d.tier; });
    return sc;
  }
  function statusLabel() {
    var sc = statusScore();
    if (sc >= 100) return "Legendary";
    if (sc >= 60) return "Iconic";
    if (sc >= 32) return "Elite";
    if (sc >= 14) return "Affluent";
    if (sc >= 5) return "Comfortable";
    if (sc >= 1) return "Rising";
    return "Understated";
  }
  // Yearly Status perk — owning luxuries keeps paying off a little each year, scaled to the Status
  // ladder. Pure stat perk (no money), applied once per year and surfaced in the Luxury popup + log.
  function statusYearlyPerk() {
    var sc = statusScore();
    if (sc >= 100) return { label: "Legendary", deltas: { happiness: 4, popularity: 3, confidence: 3 } };
    if (sc >= 60) return { label: "Iconic", deltas: { happiness: 3, popularity: 2, confidence: 2 } };
    if (sc >= 32) return { label: "Elite", deltas: { happiness: 3, popularity: 2, confidence: 1 } };
    if (sc >= 14) return { label: "Affluent", deltas: { happiness: 2, popularity: 1, confidence: 1 } };
    if (sc >= 5)  return { label: "Comfortable", deltas: { happiness: 2, popularity: 1 } };
    if (sc >= 1)  return { label: "Rising", deltas: { happiness: 1 } };
    return null;
  }
  function applyStatusPerkYear() {
    var s = S(); if (!s || !s.alive) return;
    var L = lux();
    if (L._perkYr === age()) return; // once per year
    L._perkYr = age();
    var perk = statusYearlyPerk();
    if (!perk) return;
    applyStats(perk.deltas);
    var parts = Object.keys(perk.deltas).map(function (k) { return (perk.deltas[k] > 0 ? "+" : "") + perk.deltas[k] + " " + (k.charAt(0).toUpperCase() + k.slice(1)); }).join(", ");
    log("💎 Status (" + perk.label + ") — owning the good life kept your spirits up this year (" + parts + ").", perk.deltas);
  }

  window.buyLuxuryV1871 = function (id) {
    var d = luxDef(id); if (!d) return;
    if (!alive()) return;
    if (ownsLux(id)) { toast("You already own the " + d.name.toLowerCase() + "."); return; }
    if (cash() < d.cost) { toast(d.name + " costs " + money(d.cost) + "."); return; }
    S().money -= d.cost;
    var L = lux(); L.owned.push(id); L.lifetimeSpend = num(L.lifetimeSpend) + d.cost;
    applyStats(d.deltas);
    memory("Acquired " + d.name.toLowerCase() + " — a marker of where life had gotten to.");
    log("🛍️ You bought a " + d.name.toLowerCase() + " (" + money(d.cost) + ").", { money: -d.cost });
    toast("Acquired " + d.name + ".");
    saveGame(); rerender();
  };
  window.bookExperienceV1871 = function (id) {
    var d = expDef(id); if (!d) return;
    if (!alive()) return;
    var key = "exp_" + id;
    if (actions()[key]) { toast("You've already done that this year — age up to do it again."); return; }
    if (cash() < d.cost) { toast(d.name + " costs " + money(d.cost) + "."); return; }
    S().money -= d.cost;
    actions()[key] = true;
    applyStats(d.deltas);
    memory(d.mem);
    log(d.icon + " " + d.name + " (" + money(d.cost) + "). " + d.mem, { money: -d.cost });
    toast(d.name + " — worth every cent.");
    saveGame(); rerender();
  };

  // Cheap, one-click, repeatable de-stress. Small fixed cost (NOT a money sink).
  window.lifeDecompressV1871 = function () {
    if (!alive()) return;
    var cost = 25;
    if (cash() < cost) { toast("You can't even spare " + money(cost) + " right now."); return; }
    S().money -= cost;
    var t = stats();
    t.stress = c100(num(t.stress) - 6);
    t.happiness = c100(num(t.happiness) + 2);
    t.energy = c100(num(t.energy) + 1);
    log("😮‍💨 You stepped away and decompressed for a bit.", { money: -cost });
    saveGame(); rerender();
  };

  /* ----------------------------- shared UI bits (project classes) ----------------------------- */
  // Native activity row: matches renderHealth() exactly (.row / .row-title / .row-sub / .icon-btn).
  function row(icon, title, sub, btnLabel, disabled, onclick) {
    return '<div class="row"><div><div class="row-title">' + esc(icon || "•") + " " + esc(title) + '</div><div class="row-sub">' + sub + '</div></div>' +
      '<button class="icon-btn" ' + (disabled ? "disabled " : "") + 'onclick="event.preventDefault();event.stopPropagation();' + onclick + '">' + esc(btnLabel) + '</button></div>';
  }
  function routeChip(label, hub) {
    return '<button class="icon-btn" onclick="event.preventDefault();event.stopPropagation();lifeRouteV1871(\'' + esc(hub) + '\')">' + esc(label) + '</button>';
  }
  window.lifeRouteV1871 = function (hub) {
    var opener = window.setTabV16 || window.setTab || window.setTabV11;
    try { if (typeof opener === "function") return opener(hub); } catch (e) {}
    try { window.tab = hub; if (typeof window.render === "function") window.render(); } catch (e2) {}
  };
  function effectPills(deltas) {
    return Object.keys(deltas || {}).map(function (k) {
      var v = deltas[k];
      var good = k === "stress" ? v < 0 : v > 0; // for stress, going DOWN is good
      var label = k.charAt(0).toUpperCase() + k.slice(1);
      return '<span class="lf-pill ' + (good ? "good" : "bad") + '">' + esc(label) + " " + (v > 0 ? "+" : "") + v + '</span>';
    }).join("");
  }

  var WELLNESS_IDS = ["gym", "library", "meditate", "volunteer", "haircut", "doctor", "therapySession", "travel"];
  function activityRows(kind) {
    if (typeof activities === "undefined" || !Array.isArray(activities)) {
      return '<div class="row"><div><div class="row-title">Activities loading…</div><div class="row-sub">Open the Health hub if this stays empty.</div></div>' + routeChip("Health hub", "health") + '</div>';
    }
    var list = activities.filter(function (a) {
      if (kind === "earn") return !!a.earn;
      if (kind === "wellness") return !a.earn && WELLNESS_IDS.indexOf(a.id) >= 0;
      return !a.earn && WELLNESS_IDS.indexOf(a.id) < 0; // fun
    });
    if (!list.length) return '<div class="row"><div><div class="row-sub">Nothing here right now.</div></div></div>';
    return '<div class="life71-lux-grid life71-act-grid">' + list.map(function (a) {
      var done = !!actions()[a.id];
      var locked = age() < num(a.min);
      var cost = num(a.cost), earn = num(a.earn), net = earn - cost;
      var cantAfford = cash() < cost;
      var price = earn ? ((net >= 0 ? "+" : "") + money(net) + " net") : (cost ? money(cost) : "Free");
      var tone = earn ? "earn" : kind === "wellness" ? "mind" : "fun";
      var tag = locked ? "Age " + a.min + "+" : earn ? "Side income" : kind === "wellness" ? "Wellbeing" : "Recreation";
      return '<div class="life71-lux-card life71-act-card ' + tone + (done ? " owned" : "") + '">' +
        '<div class="life71-lux-ico">' + esc(a.icon || "") + '</div>' +
        '<div class="life71-lux-main">' +
          '<div class="life71-lux-nm">' + esc(a.name || "") + '</div>' +
          '<div class="life71-lux-desc">' + esc(a.effect || "") + '</div>' +
          '<div class="lf-pill-row">' + effectPills(a.deltas || {}) + '</div>' +
        '</div>' +
        '<div class="life71-lux-right">' +
          '<span class="life71-lux-badge">' + esc(tag) + '</span>' +
          '<button class="life71-lux-buy" ' + (done || locked || cantAfford ? "disabled " : "") + 'onclick="event.preventDefault();event.stopPropagation();doActivity(\'' + a.id + '\')">' + (done ? "Done" : locked ? "Age " + a.min : price) + '</button>' +
        '</div>' +
      '</div>';
    }).join("") + '</div>';
  }

  // On-page panels (brought back per request). Focus + Lifestyle are COLLAPSIBLE (default collapsed)
  // to keep the page compact; the header shows the current pick so the collapsed state stays useful.
  // collapseV1871 is a module var, so the open/closed choice survives the game's full re-renders.
  // They read the game's OWN catalogs (already enriched by the runtime's V8 pass) + native classes.
  var collapseV1871 = { focus: true, lifestyle: true, memories: true };
  window.lifeToggleV1871 = function (key) { collapseV1871[key] = !collapseV1871[key]; rerender(); };
  function sectionHead(key, label, summary) {
    var open = !collapseV1871[key];
    return '<div class="section-label life71-collapse" onclick="event.preventDefault();event.stopPropagation();lifeToggleV1871(\'' + key + '\')"><span>' + esc(label) + '</span><span class="life71-collapse-cur">' + esc(summary) + ' <b>' + (open ? "▾" : "▸") + '</b></span></div>';
  }
  function focusPanel() {
    if (typeof lifeFocusCatalog === "undefined" || !Array.isArray(lifeFocusCatalog)) return "";
    var s = S(); var cur = (s && s.life && s.life.focus) || "balanced";
    var curF = lifeFocusCatalog.filter(function (f) { return f.id === cur; })[0] || lifeFocusCatalog[0] || { icon: "", name: "" };
    var head = sectionHead("focus", "🌟 Choose Your Life Focus", (curF.icon || "") + " " + (curF.name || ""));
    if (collapseV1871.focus) return '<section class="panel">' + head + '</section>';
    var grid = '<div class="lf-grid">' + lifeFocusCatalog.map(function (f) {
      var extra = f.id === "adventure" ? '<div class="lf-pill-row"><span class="lf-pill money">Random pop-up events</span><span class="lf-pill good">More memories</span></div>' : "";
      return '<button class="lf-card ' + (cur === f.id ? "selected" : "") + '" onclick="event.preventDefault();event.stopPropagation();setLifeFocus(\'' + f.id + '\')"><div class="lf-title">' + esc(f.icon || "") + " " + esc(f.name) + '</div><div class="lf-sub">' + esc(f.desc || "") + '</div>' + extra + '</button>';
    }).join("") + '</div>';
    return '<section class="panel">' + head + grid + '</section>';
  }
  function lifestylePanel() {
    if (typeof lifestyleCatalog === "undefined" || !Array.isArray(lifestyleCatalog)) return "";
    var s = S(); var cur = (s && s.life && s.life.lifestyle) || "modest"; var young = age() < 18;
    var curL = lifestyleCatalog.filter(function (l) { return l.id === cur; })[0] || lifestyleCatalog[1] || lifestyleCatalog[0] || { name: "", cost: 0 };
    var sum = (curL.name || "") + (young ? "" : " · " + money(curL.cost || 0) + "/yr");
    var head = sectionHead("lifestyle", "🏙️ Lifestyle Budget", sum);
    if (collapseV1871.lifestyle) return '<section class="panel">' + head + '</section>';
    var grid = '<div class="lf-grid">' + lifestyleCatalog.map(function (l) {
      var costTxt = young ? "Family lifestyle influence" : money(l.cost) + "/yr";
      var perks = (l.perks || []).map(function (p) { return '<span class="lf-pill money">' + esc(p) + '</span>'; }).join("");
      var warn = l.warning ? '<div class="row-sub" style="margin-top:6px;color:var(--accent-2)">' + esc(l.warning) + '</div>' : "";
      return '<button class="lf-card ' + (cur === l.id ? "selected" : "") + '" onclick="event.preventDefault();event.stopPropagation();setLifestyle(\'' + l.id + '\')"><div class="lf-title">' + esc(l.name) + '</div><div class="lf-sub">' + esc(costTxt) + " — " + esc(l.desc || "") + '</div><div class="lf-pill-row">' + effectPills(l.deltas || {}) + perks + '</div>' + warn + '</button>';
    }).join("") + '</div>';
    return '<section class="panel">' + head + grid + '</section>';
  }
  function goalPanel() {
    if (typeof lifeGoalCatalog === "undefined" || !Array.isArray(lifeGoalCatalog)) return "";
    var s = S(); if (!s) return "";
    var activeGoal = lifeGoalCatalog.filter(function (g) { return s.life && g.id === s.life.activeGoal; })[0];
    var prog = activeGoal && s.life && s.life.goalProgress ? num(s.life.goalProgress[activeGoal.id]) : 0;
    var done = activeGoal && s.actionsTaken && s.actionsTaken["goal_" + activeGoal.id];
    var head = activeGoal
      ? '<div class="lf-card selected"><div class="lf-title">' + esc(activeGoal.name) + '</div><div class="lf-sub">' + esc(activeGoal.desc || "") + '</div><div class="life-goal-meter"><span style="width:' + c100(prog) + '%"></span></div><div class="lf-pill-row"><span class="lf-pill good">' + Math.round(prog) + '% complete</span></div><div class="mini-actions" style="margin-top:10px"><button class="icon-btn" ' + (done ? "disabled " : "") + 'onclick="event.preventDefault();event.stopPropagation();pursueLifeGoal()">Work on goal</button></div></div>'
      : '<div class="row"><div><div class="row-title">No active personal goal</div><div class="row-sub">Pick one. It gives the life sim direction between age-ups.</div></div></div>';
    var avail = [];
    try { if (typeof availableLifeGoals === "function") avail = availableLifeGoals(); } catch (e) {}
    avail = (avail || []).filter(function (g) { return !activeGoal || g.id !== activeGoal.id; }).slice(0, 6);
    var grid = avail.length ? '<div class="lf-grid" style="margin-top:9px">' + avail.map(function (g) {
      return '<button class="lf-card" onclick="event.preventDefault();event.stopPropagation();chooseLifeGoal(\'' + g.id + '\')"><div class="lf-title">' + esc(g.name) + '</div><div class="lf-sub">' + esc(g.desc || "") + '</div></button>';
    }).join("") + '</div>' : "";
    return '<section class="panel"><div class="section-label">🎯 Personal Goal</div>' + head + grid + '</section>';
  }
  function memoriesPanel() {
    var s = S(); if (!s) return "";
    var mem = (s.life && Array.isArray(s.life.memories)) ? s.life.memories : [];
    var head = sectionHead("memories", "📝 Memories", mem.length + (mem.length === 1 ? " memory" : " memories"));
    if (collapseV1871.memories) return '<section class="panel">' + head + '</section>';
    var body = mem.length
      ? mem.slice(0, 12).map(function (m) { return '<div class="life-memory"><b>Age ' + esc(m.age) + ':</b> ' + esc(m.text) + '</div>'; }).join("")
      : '<div class="row"><div><div class="row-sub">No memories yet. Big decisions and milestones will collect here.</div></div></div>';
    return '<section class="panel">' + head + body + '</section>';
  }

  function luxuryHtml() {
    var perk = statusYearlyPerk();
    var perkRow = perk
      ? '<div class="lf-pill-row" style="margin-top:8px">' + effectPills(perk.deltas) + '<span class="lf-pill money">per year</span></div>'
      : '<div class="row-sub" style="margin-top:6px">Own a few pieces to climb the Status ladder and earn a yearly perk.</div>';
    var head = '<div class="row" style="border-bottom:0;padding-top:0"><div style="width:100%"><div class="row-title">Status: ' + esc(statusLabel()) + '</div><div class="row-sub">Each piece gives a one-time <b style="color:var(--accent-2)">lifetime stat bonus</b> and raises your Status. Lifetime spend ' + money(lux().lifetimeSpend) + ' · a flex, not an asset — not counted in net worth.</div>' + perkRow + '</div></div>';
    var grid = '<div class="life71-lux-grid">' + LUX.slice().sort(function (a, b) { return a.cost - b.cost; }).map(function (d) {
      var owned = ownsLux(d.id);
      var cantAfford = cash() < d.cost;
      var tierTag = "Tier " + d.tier + (d.tier === 5 ? " · Ultra" : "");
      return '<div class="life71-lux-card t' + d.tier + (owned ? " owned" : "") + '">' +
        '<div class="life71-lux-ico">' + esc(d.icon) + '</div>' +
        '<div class="life71-lux-main">' +
          '<div class="life71-lux-nm">' + esc(d.name) + '</div>' +
          '<div class="life71-lux-desc">' + esc(d.note) + '</div>' +
          '<div class="life71-lux-tag">Lifetime bonus</div>' +
          '<div class="lf-pill-row">' + effectPills(d.deltas) + '</div>' +
        '</div>' +
        '<div class="life71-lux-right">' +
          '<span class="life71-lux-badge">' + esc(tierTag) + '</span>' +
          '<button class="life71-lux-buy" ' + (owned || cantAfford ? "disabled " : "") + 'onclick="event.preventDefault();event.stopPropagation();buyLuxuryV1871(\'' + d.id + '\')">' + (owned ? "✓ Owned" : money(d.cost)) + '</button>' +
        '</div>' +
      '</div>';
    }).join("") + '</div>';
    return head + grid;
  }
  function experiencesHtml() {
    var head = '<div class="row" style="border-bottom:0;padding-top:0"><div><div class="row-sub">The good money sink — experiences buy happiness, stress relief, and memories. One of each per year.</div></div></div>';
    var grid = '<div class="life71-lux-grid">' + EXP.slice().sort(function (a, b) { return a.cost - b.cost; }).map(function (d) {
      var doneThisYear = !!actions()["exp_" + d.id];
      var cantAfford = cash() < d.cost;
      return '<div class="life71-lux-card exp' + (doneThisYear ? " owned" : "") + '">' +
        '<div class="life71-lux-ico">' + esc(d.icon) + '</div>' +
        '<div class="life71-lux-main">' +
          '<div class="life71-lux-nm">' + esc(d.name) + '</div>' +
          '<div class="life71-lux-tag">Boost + a memory · once a year</div>' +
          '<div class="lf-pill-row">' + effectPills(d.deltas) + '</div>' +
        '</div>' +
        '<div class="life71-lux-right">' +
          '<span class="life71-lux-badge">Per year</span>' +
          '<button class="life71-lux-buy" ' + (doneThisYear || cantAfford ? "disabled " : "") + 'onclick="event.preventDefault();event.stopPropagation();bookExperienceV1871(\'' + d.id + '\')">' + (doneThisYear ? "✓ Booked" : money(d.cost)) + '</button>' +
        '</div>' +
      '</div>';
    }).join("") + '</div>';
    return head + grid;
  }
  function trainingHtml() {
    var mf = null;
    try { mf = (typeof martialFocus !== "undefined") ? martialFocus : (window.martialFocus || null); } catch (e) { mf = null; }
    try {
      if (mf && typeof window.renderMartialDetail === "function") return window.renderMartialDetail();
      if (typeof window.renderMartialList === "function") return window.renderMartialList();
    } catch (e2) {}
    return '<div class="row"><div><div class="row-sub">Training lives in the Health hub.</div></div>' + routeChip("Health hub", "health") + '</div>';
  }
  function wellbeingHtml() {
    try { if (typeof window.renderWellbeingPanelV1870 === "function") return window.renderWellbeingPanelV1870(); } catch (e) {}
    return '<div class="row"><div><div class="row-sub">Wellbeing panel unavailable.</div></div></div>';
  }

  /* ----------------------------- popup engine ----------------------------- */
  var POPS = {
    bodymind:    { title: "❤️ Body & Mind", build: function () { return activityRows("wellness"); } },
    fun:         { title: "🎨 Fun & Hobbies", build: function () { return activityRows("fun"); } },
    earn:        { title: "💵 Side Money", build: function () { return activityRows("earn"); } },
    wellbeing:   { title: "🧬 Wellbeing", build: wellbeingHtml },
    luxury:      { title: "💎 Luxury & Status", build: luxuryHtml },
    experiences: { title: "🌍 Experiences", build: experiencesHtml },
    training:    { title: "🥋 Training", build: trainingHtml }
  };

  function ensureOverlay() {
    var el = document.getElementById("life-pop-v1871");
    if (el) return el;
    el = document.createElement("div");
    el.id = "life-pop-v1871";
    el.className = "life71-backdrop";
    el.style.display = "none";
    el.addEventListener("click", function (e) { if (e.target === el) window.closeLifePopV1871(); });
    el.innerHTML = '<div class="life71-sheet" role="dialog" aria-modal="true"><div class="life71-sheet-head"><div class="life71-sheet-title" id="life-pop-title-v1871"></div><button class="hub-close" onclick="closeLifePopV1871()">✕</button></div><div class="life71-sheet-body" id="life-pop-body-v1871"></div></div>';
    document.body.appendChild(el);
    return el;
  }
  function fillPop() {
    var cat = window.__lifePopV1871;
    var def = cat && POPS[cat];
    if (!def) return;
    var titleEl = document.getElementById("life-pop-title-v1871");
    var bodyEl = document.getElementById("life-pop-body-v1871");
    if (titleEl) titleEl.innerHTML = esc(def.title);
    if (bodyEl) {
      var html = "";
      try { html = def.build() || ""; } catch (e) { html = '<div class="row"><div><div class="row-sub">Could not load this section.</div></div></div>'; }
      bodyEl.innerHTML = html;
    }
  }
  window.openLifePopV1871 = function (cat) {
    if (!POPS[cat] || !alive()) return;
    window.__lifePopV1871 = cat;
    var el = ensureOverlay();
    fillPop();
    el.style.display = "flex";
  };
  window.closeLifePopV1871 = function () {
    window.__lifePopV1871 = null;
    var el = document.getElementById("life-pop-v1871");
    if (el) el.style.display = "none";
  };
  document.addEventListener("keydown", function (e) {
    if ((e.key === "Escape" || e.keyCode === 27) && window.__lifePopV1871) window.closeLifePopV1871();
  });

  /* ----------------------------- the Life page ----------------------------- */
  // Status tile reuses .lf-card + the native .bar/.fill stat bar.
  function statTile(label, val, kind) {
    var v = c100(val);
    var fillCls = kind === "stress" ? (v > 70 ? "low" : v < 35 ? "high" : "") : (v >= 70 ? "high" : v < 35 ? "low" : "");
    var col = fillCls === "high" ? "var(--good)" : fillCls === "low" ? "var(--bad)" : "var(--ink)";
    return '<div class="lf-card"><div class="lf-sub">' + esc(label) + '</div><div class="row-title" style="color:' + col + '">' + Math.round(v) + '</div><div class="bar"><div class="fill ' + fillCls + '" style="width:' + v + '%"></div></div></div>';
  }
  function catCard(cat, icon, label, hint) {
    return '<button class="school-menu-card" onclick="event.preventDefault();event.stopPropagation();openLifePopV1871(\'' + cat + '\')"><div class="ico">' + esc(icon) + '</div><div class="ttl">' + esc(label) + '</div><div class="desc">' + esc(hint) + '</div></button>';
  }
  function timelineHtml() {
    var s = S();
    var logArr = (s && Array.isArray(s.log)) ? s.log : [];
    var items = logArr.slice(-4).reverse().map(function (e) {
      var text = typeof e === "string" ? e : (e && (e.text || e.message || e.body || e.title)) || "";
      if (!text) return "";
      var when = (e && e.age != null) ? ("Age " + e.age + ": ") : "";
      return '<div class="life-memory"><b>' + esc(when) + '</b>' + esc(String(text).replace(/\s+/g, " ").slice(0, 130)) + '</div>';
    }).filter(Boolean).join("");
    return items || '<div class="row"><div><div class="row-sub">Your story starts with your next move.</div></div></div>';
  }
  function countAvailable(kind) {
    if (typeof activities === "undefined" || !Array.isArray(activities)) return 0;
    return activities.filter(function (a) {
      var isKind = kind === "earn" ? !!a.earn : kind === "wellness" ? (!a.earn && WELLNESS_IDS.indexOf(a.id) >= 0) : (!a.earn && WELLNESS_IDS.indexOf(a.id) < 0);
      return isKind && !actions()[a.id] && age() >= num(a.min) && cash() >= num(a.cost);
    }).length;
  }

  function renderLifeRebuildV1871() {
    var s = S();
    if (!s || !s.alive) return "";
    try { if (typeof window.ensureStateShape === "function") window.ensureStateShape(); } catch (e) {}
    var t = stats();
    var gt = genderText();
    var stress = num(t.stress);
    var stressNote = stress >= 85 ? "Critical — hurting your health" : stress >= 70 ? "High — drag on mood & health" : stress >= 50 ? "Elevated" : "Healthy range";

    var hero =
      '<section class="panel">' +
        '<div class="section-label">📖 Life</div>' +
        '<div class="life71-hero-row">' +
          '<div><div class="life71-name">' + esc(s.name || "Your life") + ' <span>' + esc(age()) + '</span></div>' +
            '<div class="row-sub">' + (gt ? esc(gt) + " · " : "") + esc(stageName()) + ' · Status <b style="color:var(--accent-2)">' + esc(statusLabel()) + '</b></div></div>' +
          '<div class="life71-net-box"><div class="lf-sub">Net Worth</div><div class="life71-net">' + esc(money(netWorth())) + '</div><div class="lf-sub">Cash ' + esc(money(cash())) + '</div></div>' +
        '</div>' +
      '</section>';

    var condition =
      '<section class="panel">' +
        '<div class="section-label">Condition</div>' +
        '<div class="lf-grid-3">' +
          statTile("Health", t.health, "good") +
          statTile("Stress", t.stress, "stress") +
          statTile("Mental", t.mentalHealth, "good") +
          statTile("Energy", t.energy, "good") +
          statTile("Happiness", t.happiness, "good") +
          '<div class="lf-card"><div class="lf-sub">Money</div><div class="row-title" style="color:var(--money)">' + esc(money(cash())) + '</div></div>' +
        '</div>' +
        '<div class="row" style="border-bottom:0;padding-bottom:0;margin-top:4px"><div><div class="row-sub">Stress ' + Math.round(stress) + ' · ' + esc(stressNote) + '</div></div>' +
          '<button class="money-btn green" onclick="event.preventDefault();event.stopPropagation();lifeDecompressV1871()" ' + (cash() < 25 ? "disabled" : "") + '>😮‍💨 Decompress · $25</button></div>' +
      '</section>';

    var doSomething =
      '<section class="panel">' +
        '<div class="section-label">Do something</div>' +
        '<div class="school-menu-grid">' +
          catCard("bodymind", "❤️", "Body & Mind", countAvailable("wellness") + " ready this year") +
          catCard("fun", "🎨", "Fun & Hobbies", countAvailable("fun") + " ready this year") +
          catCard("earn", "💵", "Side Money", countAvailable("earn") + " ready this year") +
          catCard("wellbeing", "🧬", "Wellbeing", "Health, habits & conditions") +
          catCard("luxury", "💎", "Luxury & Status", "Status: " + statusLabel()) +
          catCard("experiences", "🌍", "Experiences", "Spend big, live large") +
          catCard("training", "🥋", "Training", "Martial arts") +
        '</div>' +
      '</section>';

    var nav =
      '<section class="panel">' +
        '<div class="section-label">Jump to</div>' +
        '<div class="mini-actions" style="justify-content:flex-start">' +
          routeChip("👥 People", "people") + routeChip("💼 Career", "career") + routeChip("💰 Money", "money") +
          routeChip("🏠 Real Estate", "home") + routeChip("📊 Stats", "stats") + routeChip("⋯ More", "more") +
        '</div>' +
      '</section>';

    var story =
      '<section class="panel">' +
        '<div class="section-label">📝 Recent Timeline</div>' + timelineHtml() +
      '</section>';

    // Timeline + Goal share a two-column row (the old form factor), collapsing to one column when narrow.
    var twoCol = '<div class="life71-two">' + story + goalPanel() + '</div>';

    return '<div class="life71-page">' + hero + condition + doSomething + focusPanel() + lifestylePanel() + twoCol + memoriesPanel() + nav + '</div>';
  }
  window.renderLifeRebuildV1871 = renderLifeRebuildV1871;

  /* ----------------------------- wiring ----------------------------- */
  function wrapHubContent() {
    var prev = window.renderHubContent || null;
    try { if (!prev && typeof renderHubContent === "function") prev = renderHubContent; } catch (e) {}
    if (typeof prev !== "function" || prev.__v1871LifeRebuild) return;
    var wrapped = function (hubId) {
      var id = String(hubId || "");
      if (id === "lifehub" || id === "life" || id === "stack" || id === "life-stack") {
        var html = renderLifeRebuildV1871();
        if (html) return html;
      }
      return prev.apply(this, arguments);
    };
    wrapped.__v1871LifeRebuild = true;
    window.renderHubContent = wrapped;
    try { renderHubContent = wrapped; } catch (e2) {}
  }
  function wrapRender() {
    var prev = window.render || null;
    try { if (!prev && typeof render === "function") prev = render; } catch (e) {}
    if (typeof prev !== "function" || prev.__v1871LifeRebuild) return;
    var wrapped = function () {
      var out = prev.apply(this, arguments);
      try {
        if (window.__lifePopV1871) {
          if (!alive() || pending()) window.closeLifePopV1871();
          else fillPop();
        }
      } catch (e) {}
      return out;
    };
    wrapped.__v1871LifeRebuild = true;
    window.render = wrapped;
    try { render = wrapped; } catch (e2) {}
  }
  // Apply the yearly Status perk by wrapping the core yearly resolver (runs once per ageUp).
  function wrapYearlyPerk() {
    var prev = window.resolveLifeAndFinanceYear || (typeof resolveLifeAndFinanceYear === "function" ? resolveLifeAndFinanceYear : null);
    if (typeof prev !== "function" || prev.__v1871StatusPerk) return;
    var wrapped = function () {
      var r = prev.apply(this, arguments);
      try { applyStatusPerkYear(); } catch (e) {}
      return r;
    };
    wrapped.__v1871StatusPerk = true;
    window.resolveLifeAndFinanceYear = wrapped;
    try { resolveLifeAndFinanceYear = wrapped; } catch (e2) {}
  }

  // Only feature-specific shell styles — everything else uses the project's classes + tokens.
  function installStyles() {
    if (!document || !document.head || document.getElementById("life71-style")) return;
    var s = document.createElement("style");
    s.id = "life71-style";
    s.textContent = [
      ".life71-page{display:grid;gap:12px}",
      ".life71-hero-row{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-top:4px}",
      ".life71-name{font-family:Fraunces,Georgia,serif;font-weight:900;font-size:30px;line-height:1;color:var(--ink)}",
      ".life71-name span{color:var(--accent-2)}",
      ".life71-net-box{flex-shrink:0;text-align:right}",
      ".life71-net{font-family:'JetBrains Mono',monospace;font-weight:700;font-size:22px;color:var(--money);letter-spacing:-.03em;line-height:1.1;margin:1px 0}",
      // centered dialog shell (the only popup the project doesn't already have a class for)
      ".life71-backdrop{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;padding:20px;background:radial-gradient(circle at 24% 0%,rgba(201,155,85,.08),transparent 34%),rgba(12,9,7,.82);backdrop-filter:blur(4px)}",
      ".life71-sheet{display:flex;flex-direction:column;width:100%;max-width:600px;max-height:86vh;background:linear-gradient(180deg,var(--card) 0%,var(--bg) 70%);border:1px solid var(--line);border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,.55);animation:up .25s ease}",
      ".life71-sheet-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 16px;border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--card);border-radius:14px 14px 0 0;z-index:1}",
      ".life71-sheet-title{font-family:Fraunces,Georgia,serif;font-weight:700;font-size:22px;color:var(--ink)}",
      ".life71-sheet-body{overflow-y:auto;padding:16px}",
      ".life71-sheet-body .lf-grid{margin-top:4px}",
      ".life71-two{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px}",
      ".life71-two > .panel{margin-bottom:0;align-self:start}",
      ".life71-collapse{cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:0}",
      ".life71-collapse:hover{color:var(--ink)}",
      ".life71-collapse-cur{color:var(--dim);text-transform:none;letter-spacing:0;font-size:11px}",
      ".life71-collapse-cur b{color:var(--accent-2)}",
      // premium luxury / experience cards (horizontal band: icon · details · price/buy)
      ".life71-lux-grid{display:grid;grid-template-columns:1fr;gap:10px}",
      ".life71-lux-card{position:relative;display:flex;flex-direction:row;align-items:center;gap:13px;border:1px solid var(--line);border-radius:13px;padding:12px 14px;background:linear-gradient(160deg,var(--card),var(--panel));overflow:hidden;transition:border-color .15s ease,transform .15s ease}",
      ".life71-lux-card:hover{transform:translateY(-1px)}",
      ".life71-lux-ico{font-size:30px;line-height:1;flex-shrink:0}",
      ".life71-lux-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:5px}",
      ".life71-lux-nm{font-family:Fraunces,Georgia,serif;font-weight:700;font-size:16px;color:var(--ink);line-height:1.12}",
      ".life71-lux-desc{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--dim);line-height:1.4}",
      ".life71-lux-tag{font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);margin-top:1px}",
      ".life71-lux-right{flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;gap:7px;text-align:right}",
      ".life71-lux-badge{font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:.1em;text-transform:uppercase;color:var(--dim);border:1px solid var(--line);border-radius:999px;padding:2px 8px;background:rgba(0,0,0,.28);white-space:nowrap}",
      ".life71-lux-buy{border:1px solid var(--accent);background:rgba(201,155,85,.14);color:var(--accent-2);font-family:'JetBrains Mono',monospace;font-weight:700;font-size:12px;letter-spacing:.03em;padding:9px 14px;border-radius:10px;cursor:pointer;white-space:nowrap}",
      ".life71-lux-buy:hover{background:rgba(201,155,85,.24)}.life71-lux-buy:disabled{cursor:not-allowed}",
      ".life71-lux-card.t2{border-color:rgba(126,160,172,.34)}.life71-lux-card.t2 .life71-lux-badge{color:var(--blue);border-color:rgba(126,160,172,.4)}",
      ".life71-lux-card.t3{border-color:rgba(201,155,85,.4)}.life71-lux-card.t3 .life71-lux-badge{color:var(--accent);border-color:rgba(201,155,85,.45)}",
      ".life71-lux-card.t4{border-color:rgba(216,173,109,.55);background:linear-gradient(160deg,rgba(46,35,17,.6),var(--panel))}.life71-lux-card.t4 .life71-lux-badge{color:var(--accent-2);border-color:rgba(216,173,109,.55);background:rgba(201,155,85,.12)}",
      ".life71-lux-card.t5{border-color:rgba(242,201,120,.72);background:radial-gradient(circle at 90% 40%,rgba(242,201,120,.16),transparent 44%),linear-gradient(160deg,rgba(64,48,20,.72),rgba(34,28,20,.6));box-shadow:inset 0 0 0 1px rgba(242,201,120,.12),0 10px 28px rgba(0,0,0,.32)}.life71-lux-card.t5 .life71-lux-nm{color:#fff3df}",
      ".life71-lux-card.t5 .life71-lux-badge{color:#1a140c;border-color:transparent;background:linear-gradient(90deg,#f2c978,#d8ad6d)}",
      ".life71-lux-card.exp{border-color:rgba(126,160,172,.3)}.life71-lux-card.exp .life71-lux-badge{color:var(--money);border-color:rgba(197,180,95,.4)}",
      ".life71-act-card.mind{border-color:rgba(126,160,172,.34)}.life71-act-card.mind .life71-lux-badge{color:var(--blue);border-color:rgba(126,160,172,.42)}",
      ".life71-act-card.fun{border-color:rgba(201,155,85,.30)}.life71-act-card.fun .life71-lux-badge{color:var(--accent-2);border-color:rgba(201,155,85,.42)}",
      ".life71-act-card.earn{border-color:rgba(143,175,108,.34)}.life71-act-card.earn .life71-lux-badge{color:var(--good);border-color:rgba(143,175,108,.42)}",
      ".life71-lux-card.owned{opacity:.72}.life71-lux-card.owned .life71-lux-buy{border-color:var(--good);color:var(--good);background:rgba(143,175,108,.12);cursor:default}",
      "@media(max-width:430px){.life71-lux-card{flex-wrap:wrap}.life71-lux-right{flex-direction:row;align-items:center;width:100%;justify-content:space-between}}",
      "@media(max-width:700px){.life71-two{grid-template-columns:1fr}}",
      "@media(max-width:460px){.life71-hero-row{flex-direction:column}.life71-net-box{text-align:left}}"
    ].join("\n");
    document.head.appendChild(s);
  }

  installStyles();
  wrapHubContent();
  wrapRender();
  wrapYearlyPerk();

  if (window.registerLedgerSystem) {
    window.registerLedgerSystem({
      id: "life-rebuild",
      file: "pages/systems/life-rebuild.js",
      status: "active",
      globals: ["renderLifeRebuildV1871", "openLifePopV1871", "closeLifePopV1871", "buyLuxuryV1871", "bookExperienceV1871", "lifeDecompressV1871"],
      notes: "Popup-driven Life hub rebuild (v18.71). Uses project tokens + component classes. Replaces the old Life page; reuses existing action openers; adds luxury/experiences/status money-sinks (pure sinks, not in net worth)."
    });
  }
})();
