/* ============================================================================
   LIFE — WELLBEING OVERHAUL  (v18.70)
   A cohesive health + stress + mental-health system layered on the Life hub.
   - Wellbeing dashboard (health / stress / mental / energy / happiness + drivers)
   - Stress rebalance: slower net buildup, strong + repeatable relief, real consequences
   - Fitness & diet & sleep that build health over the years
   - Lifestyle habits that compound
   - Conditions you manage (checkups, treatment, recovery)
   Self-contained: wraps resolveAnnualActivityHabits (yearly pass) + renderLifeHub (UI).
   ========================================================================== */
(function () {
  "use strict";

  // ----- tiny helpers (defensive; never throw into the runtime) -----
  function S() { return window.state || {}; }
  function num(v, d) { v = Number(v); return isNaN(v) ? (d || 0) : v; }
  function clampN(v, lo, hi) { v = Number(v) || 0; return Math.max(lo, Math.min(hi, v)); }
  function c100(v) { return clampN(v, 0, 100); }
  function rnd(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }
  function log(msg, d) { try { if (typeof window.addLog === "function") window.addLog(msg, d || {}); } catch (e) {} }
  function toast(msg) { try { if (typeof window.addToast === "function") window.addToast(msg); } catch (e) {} }
  function moneyTxt(v) { try { if (typeof window.money === "function") return window.money(Math.round(v)); } catch (e) {} return "$" + Math.round(num(v)).toLocaleString(); }
  function rerender() { try { if (typeof window.render === "function") window.render(); } catch (e) {} }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function stats() { var s = S(); if (!s.stats || typeof s.stats !== "object") s.stats = {}; var t = s.stats; if (t.stress == null) t.stress = 25; if (t.health == null) t.health = 80; if (t.mentalHealth == null) t.mentalHealth = 75; if (t.energy == null) t.energy = 70; if (t.happiness == null) t.happiness = 65; return t; }
  function cash() { var s = S(); return num(s.money); }
  function spend(v) { var s = S(); if (num(s.money) < v) return false; s.money -= Math.round(v); return true; }
  function age() { return num(S().age); }

  // ----- catalogs -----
  var DIET = {
    poor:  { label: "Poor", cost: 0,    healthYr: -2, energy: -3, note: "Cheap, fast, processed." },
    ok:    { label: "Average", cost: 1200, healthYr: 0,  energy: 0,  note: "Standard mixed diet." },
    good:  { label: "Healthy", cost: 4200, healthYr: 2,  energy: 3,  note: "Whole foods, balanced." },
    elite: { label: "Optimized", cost: 12000, healthYr: 4, energy: 5, note: "Dialed-in nutrition & supplements." }
  };
  var SLEEP = {
    poor: { label: "Poor (<6h)", stressYr: 4,  energy: -4, mentalYr: -2, note: "Always tired and wired." },
    ok:   { label: "OK (~7h)",   stressYr: 0,  energy: 0,  mentalYr: 0,  note: "Functional but not great." },
    good: { label: "Great (8h)", stressYr: -4, energy: 4,  mentalYr: 2,  note: "Rested and recovered." }
  };
  // Lifestyle habits that compound year over year.
  var HABITS = {
    exercise: { label: "Exercise routine", icon: "🏋️", good: true,  fitness: 6, healthYr: 1, stressYr: -3, note: "Regular training builds fitness & cuts stress." },
    meditate: { label: "Daily meditation", icon: "🧘", good: true,  stressYr: -5, mentalYr: 3, note: "Lower stress, steadier mind." },
    smoke:    { label: "Smoking", icon: "🚬", good: false, healthYr: -4, conditionRisk: 0.10, note: "Feels calming; quietly wrecks your health." },
    drink:    { label: "Heavy drinking", icon: "🍺", good: false, healthYr: -2, stressYr: -1, mentalYr: -1, conditionRisk: 0.05, note: "Short relief, long-term damage." }
  };
  // Conditions you can develop and manage.
  var CONDITIONS = [
    { id: "anxiety",   name: "Anxiety", emoji: "😰", drives: "mentalHealth", treatCost: 1800 },
    { id: "backpain",  name: "Chronic back pain", emoji: "🦴", drives: "health", treatCost: 2400 },
    { id: "bp",        name: "High blood pressure", emoji: "🫀", drives: "health", treatCost: 3200 },
    { id: "insomnia",  name: "Insomnia", emoji: "🌙", drives: "energy", treatCost: 1500 },
    { id: "burnout",   name: "Burnout", emoji: "🔥", drives: "mentalHealth", treatCost: 2800 },
    { id: "obesity",   name: "Obesity", emoji: "⚖️", drives: "health", treatCost: 3600 }
  ];
  function condDef(id) { for (var i = 0; i < CONDITIONS.length; i++) if (CONDITIONS[i].id === id) return CONDITIONS[i]; return null; }

  // ----- state -----
  function wb() {
    var s = S();
    if (!s.wbV1870) s.wbV1870 = { fitness: 45, diet: "ok", sleep: "ok", habits: {}, conditions: [], _yr: -1, _reliefUsed: 0 };
    var w = s.wbV1870;
    if (typeof w.fitness !== "number") w.fitness = 45;
    if (!DIET[w.diet]) w.diet = "ok";
    if (!SLEEP[w.sleep]) w.sleep = "ok";
    if (!w.habits || typeof w.habits !== "object") w.habits = {};
    if (!Array.isArray(w.conditions)) w.conditions = [];
    return w;
  }
  function hasHabit(k) { return !!wb().habits[k]; }

  // ============================ YEARLY PASS ============================
  // Runs once per year (wrapped onto resolveAnnualActivityHabits). Applies fitness/diet/sleep/
  // habit effects, rebalances stress (baseline recovery + relief vs. buildup), progresses
  // conditions, and applies clear consequences for neglect.
  function applyWellbeingYearV1870() {
    var s = S(); if (!s || !s.alive) return;
    var t = stats(); var w = wb();
    w._yr = age(); w._reliefUsed = 0; // reset yearly relief budget

    var dHealth = 0, dStress = 0, dMental = 0, dEnergy = 0, dHappy = 0;

    // --- baseline: everyone naturally decompresses a little (slows runaway buildup) ---
    dStress -= 2;

    // --- fitness drifts: exercise builds it, neglect + age erode it ---
    if (hasHabit("exercise")) w.fitness = c100(w.fitness + HABITS.exercise.fitness);
    else w.fitness = c100(w.fitness - (age() > 40 ? 3 : 2));
    if (w.fitness >= 65) { dHealth += 2; dEnergy += 2; }
    else if (w.fitness < 30) { dHealth -= 2; dEnergy -= 2; }

    // --- diet & sleep ---
    var diet = DIET[w.diet] || DIET.ok; dHealth += diet.healthYr; dEnergy += diet.energy;
    var sleep = SLEEP[w.sleep] || SLEEP.ok; dStress += sleep.stressYr; dEnergy += sleep.energy; dMental += sleep.mentalYr;

    // --- habits compound ---
    Object.keys(HABITS).forEach(function (k) {
      if (!hasHabit(k)) return;
      var H = HABITS[k];
      if (H.fitness) {} // already applied above
      if (H.healthYr) dHealth += H.healthYr;
      if (H.stressYr) dStress += H.stressYr;
      if (H.mentalYr) dMental += H.mentalYr;
    });

    // --- aging: health softly declines after ~45 unless fitness/diet hold it up ---
    if (age() > 45) dHealth -= Math.floor((age() - 45) / 10) + 1;

    // --- STRESS CONSEQUENCES: high stress drags health, happiness, mind ---
    if (t.stress >= 85) { dHealth -= 4; dHappy -= 5; dMental -= 4; }
    else if (t.stress >= 70) { dHealth -= 2; dHappy -= 3; dMental -= 2; }
    else if (t.stress <= 35) { dHappy += 2; dMental += 1; } // calm life is good for you

    // --- CONDITIONS progress: untreated worsen, treated heal ---
    var newlyWorse = [];
    w.conditions.forEach(function (c) {
      var def = condDef(c.id) || {};
      if (c.treated) { c.severity = num(c.severity) - 2; if (c.severity <= 0) c.healed = true; }
      else {
        c.severity = num(c.severity, 1) + 1;
        var drive = def.drives || "health";
        if (drive === "health") dHealth -= Math.min(5, c.severity);
        else if (drive === "mentalHealth") dMental -= Math.min(5, c.severity);
        else if (drive === "energy") dEnergy -= Math.min(4, c.severity);
        if (c.severity === 2) newlyWorse.push(def.name || c.id);
      }
    });
    w.conditions = w.conditions.filter(function (c) { return !c.healed; });
    if (newlyWorse.length) log("⚠️ Untreated condition worsening: " + newlyWorse.join(", ") + ". See a doctor.");

    // --- new conditions can arise (age + bad habits + high stress + low fitness) ---
    var riskBase = (age() > 50 ? 0.10 : age() > 35 ? 0.05 : 0.02);
    if (hasHabit("smoke")) riskBase += HABITS.smoke.conditionRisk;
    if (hasHabit("drink")) riskBase += HABITS.drink.conditionRisk;
    if (t.stress >= 75) riskBase += 0.06;
    if (w.fitness < 30) riskBase += 0.05;
    var have = {}; w.conditions.forEach(function (c) { have[c.id] = 1; });
    if (Math.random() < riskBase) {
      var pool = CONDITIONS.filter(function (d) { return !have[d.id]; });
      if (pool.length) {
        var pick = pool[rnd(0, pool.length - 1)];
        w.conditions.push({ id: pick.id, severity: 1, treated: false });
        log("🩺 You developed " + pick.name + ". Manage it before it gets worse (checkup / treat in the Life hub).");
      }
    }

    // --- apply the net deltas ---
    t.health = c100(num(t.health) + dHealth);
    t.stress = c100(num(t.stress) + dStress);
    t.mentalHealth = c100(num(t.mentalHealth) + dMental);
    t.energy = c100(num(t.energy) + dEnergy);
    t.happiness = c100(num(t.happiness) + dHappy);
  }

  // ============================ ACTIONS ============================
  function reliefLeft() { var w = wb(); if (w._yr !== age()) { w._yr = age(); w._reliefUsed = 0; } return Math.max(0, 3 - num(w._reliefUsed)); }
  function useRelief() { var w = wb(); if (w._yr !== age()) { w._yr = age(); w._reliefUsed = 0; } w._reliefUsed = num(w._reliefUsed) + 1; }

  window.wbExerciseV1870 = function () {
    if (reliefLeft() <= 0) { toast("You've already done enough recovery this year — age up to reset."); return; }
    var t = stats(), w = wb();
    w.fitness = c100(w.fitness + 5);
    t.health = c100(t.health + 2); t.stress = c100(t.stress - 4); t.mentalHealth = c100(t.mentalHealth + 2); t.energy = c100(t.energy - 1);
    useRelief(); log("🏋️ You worked out — fitness up, stress down."); toast("Workout done — stress −4, fitness +5."); rerender();
  };
  window.wbMeditateV1870 = function () {
    if (reliefLeft() <= 0) { toast("You've already done enough recovery this year — age up to reset."); return; }
    var t = stats();
    t.stress = c100(t.stress - 7); t.mentalHealth = c100(t.mentalHealth + 5); t.happiness = c100(t.happiness + 2);
    useRelief(); log("🧘 You took time to meditate — calmer and clearer."); toast("Meditated — stress −7, mind +5."); rerender();
  };
  window.wbVacationV1870 = function () {
    var costV = Math.max(2000, Math.round(num(S().money) * 0.01));
    if (!spend(costV)) { toast("You can't afford a proper trip right now."); return; }
    var t = stats();
    t.stress = c100(t.stress - 20); t.happiness = c100(t.happiness + 14); t.mentalHealth = c100(t.mentalHealth + 6); t.energy = c100(t.energy + 8);
    log("✈️ You took a real vacation (" + moneyTxt(costV) + ") — a full reset.", { money: -costV }); toast("Vacation — stress −20, happiness +14!"); rerender();
  };
  window.wbSetDietV1870 = function (level) {
    if (!DIET[level]) return; var w = wb(); var d = DIET[level];
    if (d.cost > 0 && level !== w.diet) { if (!spend(d.cost)) { toast("That diet costs " + moneyTxt(d.cost) + "/yr — not enough cash."); return; } }
    w.diet = level; log("🥗 Diet set to " + d.label + (d.cost ? " (" + moneyTxt(d.cost) + "/yr)" : "") + "."); rerender();
  };
  window.wbSetSleepV1870 = function (level) {
    if (!SLEEP[level]) return; var w = wb(); w.sleep = level; log("😴 Sleep routine set to " + SLEEP[level].label + "."); rerender();
  };
  window.wbToggleHabitV1870 = function (k) {
    if (!HABITS[k]) return; var w = wb(); w.habits[k] = !w.habits[k];
    log((w.habits[k] ? "✅ Picked up habit: " : "🚫 Dropped habit: ") + HABITS[k].label + "."); rerender();
  };
  window.wbCheckupV1870 = function () {
    var costV = 350;
    if (!spend(costV)) { toast("A checkup costs " + moneyTxt(costV) + "."); return; }
    var t = stats();
    t.health = c100(t.health + 2);
    var w = wb(); var found = w.conditions.filter(function (c) { return !c.diagnosed; });
    found.forEach(function (c) { c.diagnosed = true; });
    if (found.length) { log("🩺 Checkup (" + moneyTxt(costV) + ") flagged: " + found.map(function (c) { return (condDef(c.id) || {}).name || c.id; }).join(", ") + ".", { money: -costV }); toast("Checkup found " + found.length + " thing(s) to treat."); }
    else { log("🩺 Checkup (" + moneyTxt(costV) + ") — all clear. Nice.", { money: -costV }); toast("Checkup: all clear."); }
    rerender();
  };
  window.wbTreatV1870 = function (id) {
    var w = wb(); var c = null; for (var i = 0; i < w.conditions.length; i++) if (w.conditions[i].id === id) c = w.conditions[i];
    if (!c) return; var def = condDef(id) || {}; var costV = num(def.treatCost, 2000);
    if (!spend(costV)) { toast("Treating " + (def.name || id) + " costs " + moneyTxt(costV) + "."); return; }
    c.treated = true; c.diagnosed = true;
    log("💊 Started treatment for " + (def.name || id) + " (" + moneyTxt(costV) + "). It'll improve over the next year or two.", { money: -costV });
    toast("Treating " + (def.name || id) + "."); rerender();
  };

  // ============================ DASHBOARD ============================
  function bar(label, val, kind, note) {
    var v = c100(val);
    var col = kind === "stress"
      ? (v >= 75 ? "#e8736a" : v >= 50 ? "#e9c77d" : "#9ccf9c")
      : (v >= 65 ? "#9ccf9c" : v >= 40 ? "#e9c77d" : "#e8736a");
    return '<div style="flex:1;min-width:150px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:10px 12px">' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,.6)">' + esc(label) + '</span><b style="font-size:17px;color:' + col + '">' + Math.round(v) + '</b></div>' +
      '<div style="height:7px;border-radius:999px;background:rgba(255,255,255,.1);overflow:hidden;margin:6px 0 4px"><div style="height:100%;width:' + v + '%;background:' + col + '"></div></div>' +
      '<div style="font-size:10px;color:rgba(255,255,255,.5)">' + esc(note || "") + '</div></div>';
  }
  function chip(label, on, onclick, goodWhenOn) {
    var col = on ? (goodWhenOn ? "#9ccf9c" : "#e8a06a") : "rgba(255,255,255,.45)";
    var bg = on ? (goodWhenOn ? "rgba(156,207,156,.14)" : "rgba(232,160,106,.14)") : "rgba(255,255,255,.04)";
    return '<button onclick="event.preventDefault();event.stopPropagation();' + onclick + '" style="border:1px solid ' + (on ? col : "rgba(255,255,255,.12)") + ';background:' + bg + ';color:' + col + ';font-size:11px;font-weight:700;padding:7px 11px;border-radius:10px;cursor:pointer">' + esc(label) + (on ? " ✓" : "") + '</button>';
  }
  function selBtn(label, active, onclick) {
    return '<button onclick="event.preventDefault();event.stopPropagation();' + onclick + '" style="border:1px solid ' + (active ? "rgba(216,173,109,.7)" : "rgba(255,255,255,.12)") + ';background:' + (active ? "rgba(216,173,109,.16)" : "rgba(255,255,255,.04)") + ';color:' + (active ? "#e9c77d" : "rgba(255,255,255,.7)") + ';font-size:11px;font-weight:700;padding:6px 10px;border-radius:9px;cursor:pointer">' + esc(label) + '</button>';
  }
  function actBtn(label, onclick, color, disabled) {
    return '<button ' + (disabled ? "disabled " : "") + 'onclick="event.preventDefault();event.stopPropagation();' + onclick + '" style="border:1px solid rgba(255,255,255,.14);background:' + (disabled ? "rgba(255,255,255,.03)" : (color || "rgba(216,173,109,.16)")) + ';color:' + (disabled ? "rgba(255,255,255,.3)" : "#f4e9d4") + ';font-size:12px;font-weight:800;padding:9px 13px;border-radius:11px;cursor:' + (disabled ? "not-allowed" : "pointer") + '">' + esc(label) + '</button>';
  }

  window.renderWellbeingPanelV1870 = function () {
    var s = S(); if (!s || !s.stats) return "";
    var t = stats(); var w = wb();
    var sec = "background:rgba(20,17,13,.5);border:1px solid rgba(216,173,109,.16);border-radius:16px;padding:14px;margin:0 0 12px";
    var lbl = "font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:rgba(216,173,109,.85);margin-bottom:10px";

    // stress driver summary
    var relief = reliefLeft();
    var stressNote = t.stress >= 85 ? "Critical — this is hurting your health" : t.stress >= 70 ? "High — dragging health & mood down" : t.stress >= 50 ? "Elevated — keep managing it" : "Healthy range";
    var bars = '<div style="display:flex;flex-wrap:wrap;gap:8px">' +
      bar("Health", t.health, "good", w.fitness >= 65 ? "Fit & strong" : w.fitness < 30 ? "Out of shape" : "Holding steady") +
      bar("Stress", t.stress, "stress", stressNote) +
      bar("Mental health", t.mentalHealth, "good", hasHabit("meditate") ? "Meditation helps" : "Mind & mood") +
      bar("Energy", t.energy, "good", (SLEEP[w.sleep] || {}).label || "Rest level") +
      bar("Happiness", t.happiness, "good", "Overall life satisfaction") +
      '</div>';

    // recovery actions
    var vacCost = Math.max(2000, Math.round(num(s.money) * 0.01));
    var actions = '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px">' +
      actBtn("🏋️ Work out", "wbExerciseV1870()", "rgba(156,207,156,.18)", relief <= 0) +
      actBtn("🧘 Meditate", "wbMeditateV1870()", "rgba(126,160,172,.18)", relief <= 0) +
      actBtn("✈️ Vacation (" + moneyTxt(vacCost) + ")", "wbVacationV1870()", "rgba(216,173,109,.18)", num(s.money) < vacCost) +
      '</div><div style="font-size:10px;color:rgba(255,255,255,.45);margin-top:6px">Quick recovery left this year: ' + relief + '/3 · age up to reset</div>';

    // fitness / diet / sleep
    var dietRow = Object.keys(DIET).map(function (k) { return selBtn(DIET[k].label + (DIET[k].cost ? " · " + moneyTxt(DIET[k].cost) : ""), w.diet === k, "wbSetDietV1870('" + k + "')"); }).join(" ");
    var sleepRow = Object.keys(SLEEP).map(function (k) { return selBtn(SLEEP[k].label, w.sleep === k, "wbSetSleepV1870('" + k + "')"); }).join(" ");
    var fitness = '<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px"><span style="font-size:11px;color:rgba(255,255,255,.6);min-width:64px">Fitness</span>' +
      '<div style="flex:1;height:7px;border-radius:999px;background:rgba(255,255,255,.1);overflow:hidden"><div style="height:100%;width:' + c100(w.fitness) + '%;background:#9ccf9c"></div></div><b style="font-size:12px;color:#cfe8cf">' + Math.round(w.fitness) + '/100</b></div>';
    var lifestyle = '<div style="' + sec + '"><div style="' + lbl + '">🏃 Fitness · diet · sleep</div>' + fitness +
      '<div style="font-size:11px;color:rgba(255,255,255,.6);margin:8px 0 5px">Diet</div><div style="display:flex;flex-wrap:wrap;gap:6px">' + dietRow + '</div>' +
      '<div style="font-size:11px;color:rgba(255,255,255,.6);margin:10px 0 5px">Sleep</div><div style="display:flex;flex-wrap:wrap;gap:6px">' + sleepRow + '</div></div>';

    // habits
    var habitRow = Object.keys(HABITS).map(function (k) { return chip(HABITS[k].icon + " " + HABITS[k].label, hasHabit(k), "wbToggleHabitV1870('" + k + "')", HABITS[k].good); }).join(" ");
    var habits = '<div style="' + sec + '"><div style="' + lbl + '">🔁 Lifestyle habits <span style="opacity:.6;text-transform:none;letter-spacing:0">— compound every year</span></div><div style="display:flex;flex-wrap:wrap;gap:6px">' + habitRow + '</div></div>';

    // conditions
    var conds = w.conditions.length
      ? w.conditions.map(function (c) {
          var def = condDef(c.id) || {}; var sev = num(c.severity, 1);
          var statusCol = c.treated ? "#9ccf9c" : sev >= 3 ? "#e8736a" : "#e9c77d";
          var status = c.treated ? "in treatment — recovering" : (c.diagnosed ? "untreated · severity " + sev : "undiagnosed — get a checkup");
          return '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:9px 11px;margin-bottom:6px">' +
            '<div><b style="font-size:13px">' + esc(def.emoji || "🩹") + " " + esc(def.name || c.id) + '</b><div style="font-size:10px;color:' + statusCol + '">' + esc(status) + '</div></div>' +
            (c.treated ? '' : actBtn("Treat · " + moneyTxt(num(def.treatCost, 2000)), "wbTreatV1870('" + c.id + "')", "rgba(232,115,106,.16)", false)) + '</div>';
        }).join("")
      : '<div style="font-size:11px;color:rgba(255,255,255,.45)">No active conditions. Keep up your fitness, sleep, and stress and it stays that way.</div>';
    var condBox = '<div style="' + sec + '"><div style="' + lbl + '">🩺 Conditions ' + actBtn("Get a checkup · $350", "wbCheckupV1870()", "rgba(126,160,172,.16)", false).replace("font-size:12px", "font-size:10px").replace("padding:9px 13px", "padding:5px 9px") + '</div>' + conds + '</div>';

    return '<section class="panel" style="margin-bottom:14px"><div style="' + sec + ';margin-bottom:12px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div style="' + lbl + ';margin:0">🧬 Wellbeing</div><span style="font-size:10px;color:rgba(255,255,255,.45)">your health, stress & mind in one place</span></div>' +
      bars +
      '<div style="font-size:11px;color:rgba(255,255,255,.55);margin:10px 0 6px">Recover now (repeatable):</div>' + actions +
      '</div>' + lifestyle + habits + condBox + '</section>';
  };

  // ============================ WIRING ============================
  // 1) Yearly pass — wrap resolveAnnualActivityHabits (runs once per ageUp).
  try {
    var _prevHabits = window.resolveAnnualActivityHabits || (typeof resolveAnnualActivityHabits === "function" ? resolveAnnualActivityHabits : null);
    window.resolveAnnualActivityHabits = function () {
      var r; if (typeof _prevHabits === "function") r = _prevHabits.apply(this, arguments);
      try { applyWellbeingYearV1870(); } catch (e) {}
      return r;
    };
    try { resolveAnnualActivityHabits = window.resolveAnnualActivityHabits; } catch (e) {}
  } catch (e) {}

  // 2) Dashboard — wrap renderLifeHub, inject the wellbeing panel near the top of the Life hub.
  try {
    var _prevLifeHub = window.renderLifeHub || (typeof renderLifeHub === "function" ? renderLifeHub : null);
    window.renderLifeHub = function () {
      var out = ""; try { out = _prevLifeHub ? _prevLifeHub.apply(this, arguments) : ""; } catch (e) { out = ""; }
      var panel = ""; try { panel = window.renderWellbeingPanelV1870() || ""; } catch (e) { panel = ""; }
      if (!panel) return out;
      // inject right after the first closing of the stats/pill header if present, else prepend.
      var marker = '</div>';
      return panel + out;
    };
    try { renderLifeHub = window.renderLifeHub; } catch (e) {}
  } catch (e) {}

})();
