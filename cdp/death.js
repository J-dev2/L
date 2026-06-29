(function () {
  var out = { pass: {}, fail: [], notes: [] };
  function ok(name, cond, detail) { out.pass[name] = !!cond; if (!cond) out.fail.push(name + (detail ? (": " + detail) : "")); }
  function appHtml() { try { return (document.getElementById("app") || {}).innerHTML || ""; } catch (e) { return ""; } }
  function isDeathScreen(h) { return h.indexOf("In Memoriam") >= 0 && h.indexOf("Final Entry") >= 0; }
  function hasContinueBtn(h) { return /continueAsHeir\(\)/.test(h); }
  function num(x) { return Number.isFinite(Number(x)) ? Number(x) : 0; }
  function killToDeath() {
    var ageUpFn = window.ageUp; var guard = 0;
    while (state.alive && guard < 30) { state.pending = null; state.stats.health = -1; try { ageUpFn(); } catch (e) { out.notes.push("ageup threw " + e); break; } guard++; }
    return guard;
  }
  function freshLife(giveChild) {
    window.newGame({}); if (typeof ensureStateShape === "function") ensureStateShape();
    state.relationships = state.relationships || {};
    if (giveChild) state.relationships.child_test = { name: "Avery Test", role: "Child", alive: true, bond: 80, trust: 80, age: 25, gender: "female" };
    state.age = 101; state.stats = state.stats || {}; state.stats.health = 1;
    state.money = 400000; state.savings = 100000;
    try { (window.render || render)(); } catch (e) {}
  }
  try {
    ok("has_ageUp", typeof window.ageUp === "function");
    ok("has_continueAsHeir", typeof window.continueAsHeir === "function");

    // ===== A) death WITH a child =====
    freshLife(true);
    killToDeath();
    ok("withchild_dead", state.alive === false);
    var hA = appHtml();
    ok("withchild_death_screen", isDeathScreen(hA));
    ok("withchild_continue_btn", hasContinueBtn(hA));
    var prevA = state.name, prevGenA = num((state.legacy || {}).generation);
    window.continueAsHeir();
    ok("withchild_continue_alive", state.alive === true, "alive=" + state.alive);
    ok("withchild_next_gen", num((state.legacy || {}).generation) === prevGenA + 1, "gen=" + num((state.legacy || {}).generation));
    ok("withchild_new_char", state.name !== prevA, "name=" + state.name);
    ok("withchild_render_life", !isDeathScreen(appHtml()));
    ok("withchild_got_inheritance", num(state.money) > 0 || num((state.legacy || {}).lastInheritance) > 0, "money=" + num(state.money));

    // ===== B) death with NO child (the bug: must still continue) =====
    freshLife(false);
    var kids = Object.values(state.relationships || {}).filter(function (r) { return r && r.role === "Child"; });
    ok("nochild_setup", kids.length === 0, "kids=" + kids.length);
    killToDeath();
    ok("nochild_dead", state.alive === false);
    var hB = appHtml();
    ok("nochild_death_screen", isDeathScreen(hB));
    ok("nochild_continue_btn_present", hasContinueBtn(hB)); // FIX: button must now appear
    ok("nochild_continue_label", hB.indexOf("Continue the Family Line") >= 0, "no family-line label");
    var prevB = state.name, prevGenB = num((state.legacy || {}).generation), famB = (state.legacy || {}).familyName;
    window.continueAsHeir(); // FIX: must generate a relative successor and continue
    ok("nochild_continue_alive", state.alive === true, "alive=" + state.alive);
    ok("nochild_next_gen", num((state.legacy || {}).generation) === prevGenB + 1, "gen=" + num((state.legacy || {}).generation));
    ok("nochild_new_char", state.name !== prevB && !!state.name, "name=" + state.name);
    ok("nochild_keeps_family", (state.legacy || {}).familyName === famB, "fam=" + (state.legacy || {}).familyName);
    ok("nochild_render_life", !isDeathScreen(appHtml()));

    // ===== C) death from an open hub should still replace the screen, not freeze on stale hub markup =====
    freshLife(true);
    try { if (typeof window.setTabV16 === "function") window.setTabV16("brokerage"); else if (typeof window.setTab === "function") window.setTab("brokerage"); } catch (eHub) { out.notes.push("open hub threw " + eHub); }
    var hadHub = /hub-brokerage|v18-brokerage-hub|Investments/.test(appHtml());
    killToDeath();
    var hC = appHtml();
    ok("openhub_setup_before_death", hadHub);
    ok("openhub_death_screen_replaces_hub", state.alive === false && isDeathScreen(hC) && hasContinueBtn(hC), hC.slice(0, 240));

    out.summary = { total: Object.keys(out.pass).length, passed: Object.keys(out.pass).filter(function (k) { return out.pass[k]; }).length, failed: out.fail.length };
  } catch (e) { out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0, 6).join(" || ") : ""); }
  return out;
})();
