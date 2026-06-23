(function () {
  var out = { pass: {}, fail: [], notes: [] };
  function ok(n, c, d) { out.pass[n] = !!c; if (!c) out.fail.push(n + (d ? (": " + d) : "")); }
  try {
    if (window.newGame) window.newGame({});
    if (typeof ensureStateShape === "function") ensureStateShape();
    if (typeof ensureLegacyShape === "function") ensureLegacyShape();
    state.name = "Roman Hutchinson"; state.age = 48; state.money = 5000000; state.alive = false; state.cause = "old age";
    state.relationships = state.relationships || {};
    state.relationships.child0 = { role: "Child", name: "Marcus Hutchinson", alive: true, age: 23, bond: 80, trust: 70, iqV1862: 128 };
    state.legacy = state.legacy || {}; state.legacy.successorKey = "child0"; state.legacy.generation = 1; state.legacy.familyName = "Hutchinson";

    if (typeof window.continueAsHeirV1846 === "function") window.continueAsHeirV1846();
    var st = (typeof stateNow === "function") ? stateNow() : state;
    out.notes.push("age=" + st.age + " edu=" + st.education + " iq=" + (st.traits && st.traits.iq) + " gen=" + (st.legacy && st.legacy.generation));
    ok("heir_starts_at_child_age", Number(st.age) === 23, "age=" + st.age);
    ok("heir_not_in_preschool", st.education !== "Preschool", "edu=" + st.education);
    ok("heir_inherited_iq", st.traits && Number(st.traits.iq) === 128, "iq=" + (st.traits && st.traits.iq));
    ok("generation_advanced", st.legacy && Number(st.legacy.generation) === 2, "gen=" + (st.legacy && st.legacy.generation));

    // --- UI-scale buttons actually drive the wired CSS vars ---
    if (typeof window.setHubWidthV16 === "function") {
      window.setHubWidthV16("compact");
      var w1 = document.documentElement.style.getPropertyValue("--ledger-hub-width");
      window.setHubWidthV16("max");
      var w2 = document.documentElement.style.getPropertyValue("--ledger-hub-width");
      ok("width_var_changes", w1 && w2 && w1 !== w2, "w1=" + w1 + " w2=" + w2);
    }
    if (typeof window.adjustTextV16 === "function") {
      var s0 = document.documentElement.style.getPropertyValue("--ledger-ui-scale");
      window.adjustTextV16(0.08);
      var s1 = document.documentElement.style.getPropertyValue("--ledger-ui-scale");
      ok("scale_var_changes", s0 !== s1, "s0=" + s0 + " s1=" + s1);
    }

    out.summary = { total: Object.keys(out.pass).length, passed: Object.keys(out.pass).filter(function (k) { return out.pass[k]; }).length, failed: out.fail.length };
  } catch (e) { out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0, 6).join(" || ") : ""); }
  return out;
})();
