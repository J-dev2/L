(function () {
  var out = { pass: {}, fail: [], notes: [], info: {} };
  function ok(name, cond, detail) { out.pass[name] = !!cond; if (!cond) out.fail.push(name + (detail ? (": " + detail) : "")); }
  function num(x) { return Number.isFinite(Number(x)) ? Number(x) : 0; }
  function fin() { return (state && state.finance) || {}; }
  function trust() { return fin().familyTrustV1839 || {}; }
  try {
    if (typeof window.newGame === "function") window.newGame({});
    if (typeof ensureStateShape === "function") ensureStateShape();
    var S = state; S.age = 50; S.money = 5000000;
    if (typeof window.ensureLegalState === "function") window.ensureLegalState();

    ok("has_create_fn", typeof window.createFamilyTrustV1839 === "function");
    ok("has_fund_fn", typeof window.fundFamilyTrustV1839 === "function");
    ok("has_legal_render", typeof window.renderLegalHubV1839 === "function");

    // ---- create dynasty trust ----
    var moneyBefore = num(S.money);
    window.createFamilyTrustV1839("dynasty");
    out.info.afterCreate = { created: trust().created, plan: trust().plan, protection: trust().protection, money: num(S.money) };
    ok("trust_created", trust().created === true, "created=" + trust().created);
    ok("trust_plan_dynasty", trust().plan === "dynasty", "plan=" + trust().plan);
    ok("trust_cost_charged", num(S.money) === moneyBefore - 250000, "money=" + num(S.money));
    ok("trust_has_protection", num(trust().protection) > 0, "prot=" + num(trust().protection));

    // ---- fund it from checking ----
    var checkingBefore = num(S.money);
    window.fundFamilyTrustV1839("checking", "max");
    out.info.afterFund = { corpus: num(trust().corpus), money: num(S.money) };
    ok("trust_funded_corpus", num(trust().corpus) >= checkingBefore - 1, "corpus=" + num(trust().corpus) + " expected~" + checkingBefore);
    ok("checking_drained", num(S.money) <= 1, "money=" + num(S.money));

    // ---- legal hub renders with trust info ----
    var html = "";
    try { html = window.renderLegalHubV1839(); } catch (e) { out.notes.push("legal render threw " + e); }
    ok("legal_hub_renders", typeof html === "string" && html.length > 200, "len=" + (html || "").length);
    ok("legal_hub_shows_trust", html.indexOf("rust") >= 0, "no trust text");

    // ---- trust counts in net worth ----
    var nw = 0; try { if (typeof legacyNetWorth === "function") nw = legacyNetWorth(); } catch (e) {}
    out.info.netWorth = nw;
    ok("trust_in_networth", nw >= num(trust().corpus) - 1, "nw=" + nw + " corpus=" + num(trust().corpus));

    // ---- survives a year tick ----
    var corpusBeforeYear = num(trust().corpus);
    S.actionsTaken = {}; S.age += 1;
    try { if (typeof window.resolveLifeAndFinanceYear === "function") window.resolveLifeAndFinanceYear(); } catch (e) { out.notes.push("year threw " + e); }
    out.info.afterYear = { corpus: num(trust().corpus) };
    ok("trust_survives_year", num(trust().corpus) > 0, "corpus=" + num(trust().corpus));

    // ---- carries through succession (continueAsHeir) ----
    S.relationships = S.relationships || {};
    S.relationships.kid = { name: "Heir One", role: "Child", alive: true, bond: 80, trust: 80, age: 28, gender: "male" };
    var corpusBeforeDeath = num(trust().corpus);
    S.alive = false; S.cause = "test";
    out.info.beforeContinue = { corpus: corpusBeforeDeath };
    if (typeof window.continueAsHeir === "function") {
      try { window.continueAsHeir(); } catch (e) { out.notes.push("continue threw " + e); }
    }
    out.info.afterContinue = { alive: state.alive, gen: (state.legacy || {}).generation, corpus: num(trust().corpus), created: trust().created };
    ok("heir_alive_after_continue", state.alive === true, "alive=" + state.alive);
    ok("trust_carried_to_heir", num(trust().corpus) > 0 && trust().created === true, "corpus=" + num(trust().corpus) + " created=" + trust().created);

    // ---- a strong trust sharply reduces the death haircut on the personal estate ----
    function runHaircut(withDynasty) {
      window.newGame({}); if (typeof ensureStateShape === "function") ensureStateShape();
      var s = state; s.age = 60; if (typeof window.ensureLegalState === "function") window.ensureLegalState();
      s.finance = s.finance || {}; s.finance.brokerage = 100000000; s.money = withDynasty ? 300000 : 0; // $100M liquid, non-trust
      s.relationships = { kid: { name: "Heir", role: "Child", alive: true, bond: 80, trust: 80, age: 30, gender: "male" } };
      if (withDynasty) window.createFamilyTrustV1839("dynasty");
      var before = num(legacyNetWorth(s));
      s.alive = false; s.cause = "t";
      window.continueAsHeir();
      var after = num(legacyNetWorth(state));
      return { before: before, after: after, keep: before > 0 ? after / before : 0 };
    }
    var noTrust = runHaircut(false);
    var withTrust = runHaircut(true);
    out.info.haircut = { noTrust: noTrust, withTrust: withTrust };
    ok("notrust_haircut_~45pct", noTrust.keep > 0.35 && noTrust.keep < 0.6, "keep=" + noTrust.keep.toFixed(2));
    ok("dynasty_protects_most", withTrust.keep > 0.78, "keep=" + withTrust.keep.toFixed(2));
    ok("trust_beats_no_trust", withTrust.keep > noTrust.keep + 0.2, "no=" + noTrust.keep.toFixed(2) + " yes=" + withTrust.keep.toFixed(2));

    out.summary = { total: Object.keys(out.pass).length, passed: Object.keys(out.pass).filter(function (k) { return out.pass[k]; }).length, failed: out.fail.length };
  } catch (e) { out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0, 6).join(" || ") : ""); }
  return out;
})();
