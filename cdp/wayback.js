(function () {
  var out = { pass: {}, fail: [], notes: [] };
  function ok(name, cond, detail) { out.pass[name] = !!cond; if (!cond) out.fail.push(name + (detail ? (": " + detail) : "")); }
  function num(x) { return Number.isFinite(Number(x)) ? Number(x) : 0; }
  function appHtml() { try { return (document.getElementById("app") || {}).innerHTML || ""; } catch (e) { return ""; } }
  try {
    ok("has_create_fn", typeof window.createWaybackCheckpointV18333 === "function");
    ok("has_restore_fn", typeof window.restoreWaybackIndexV18333 === "function");
    ok("has_slot_restore_fn", typeof window.waybackLifeSlotV18333 === "function");

    // ---- regular wayback: manual checkpoint then restore reverts state ----
    window.newGame({}); if (typeof ensureStateShape === "function") ensureStateShape();
    state.age = 30; state.money = 1000;
    window.createWaybackCheckpointV18333("test");
    ok("checkpoint_created", (state.timeSnapshotsV1814 || []).length >= 1, "snaps=" + (state.timeSnapshotsV1814 || []).length);
    state.age = 40; state.money = 999999;
    window.restoreWaybackIndexV18333(0);
    ok("restore_reverts_age", num(state.age) === 30, "age=" + num(state.age));
    ok("restore_reverts_money", num(state.money) === 1000, "money=" + num(state.money));

    // ---- slot restore (Restore Latest / the death-screen button) ----
    window.newGame({}); if (typeof ensureStateShape === "function") ensureStateShape();
    state.age = 50; state.money = 5000;
    window.createWaybackCheckpointV18333("pre");      // pushes snapshot + persists slot
    if (typeof window.save === "function") window.save();
    state.age = 60; state.money = 1; state.alive = false; state.cause = "test";
    if (typeof window.save === "function") window.save();  // dead state saved to slot, with the snapshot
    // death screen exposes the wayback button when a checkpoint exists
    try { (window.render || render)(); } catch (e) { out.notes.push("render " + e); }
    ok("death_screen_has_wayback", /waybackLifeSlotV18333/.test(appHtml()) || appHtml().indexOf("Undo Death") >= 0, "no wayback btn");
    window.waybackLifeSlotV18333();   // undo death from the latest checkpoint
    ok("wayback_undoes_death", state.alive === true, "alive=" + state.alive);
    ok("wayback_restores_age", num(state.age) === 50, "age=" + num(state.age));

    // ---- age-up auto-creates a checkpoint (so a real player always has one at death) ----
    window.newGame({}); if (typeof ensureStateShape === "function") ensureStateShape();
    state.age = 30; state.stats = state.stats || {}; state.pending = null;
    var before2 = (state.timeSnapshotsV1814 || []).length;
    try { if (typeof window.ageUp === "function") window.ageUp(); } catch (e) { out.notes.push("ageup " + e); }
    ok("ageup_autocheckpoints", (state.timeSnapshotsV1814 || []).length > before2, "snaps=" + (state.timeSnapshotsV1814 || []).length);

    // ---- death screen ALWAYS shows the wayback button now (alive=false, with a checkpoint) ----
    state.alive = false; state.cause = "test";
    try { (window.render || render)(); } catch (e) {}
    ok("death_screen_shows_wayback_always", /waybackLifeSlotV18333|rewindOneYearV1814/.test(appHtml()) && appHtml().indexOf("Undo Death") >= 0, "no btn");

    out.summary = { total: Object.keys(out.pass).length, passed: Object.keys(out.pass).filter(function (k) { return out.pass[k]; }).length, failed: out.fail.length };
  } catch (e) { out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0, 6).join(" || ") : ""); }
  return out;
})();
