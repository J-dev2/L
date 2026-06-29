(function () {
  var out = { pass: {}, fail: [], notes: [], info: {} };
  function ok(name, cond, detail) { out.pass[name] = !!cond; if (!cond) out.fail.push(name + (detail ? ": " + detail : "")); }
  function num(v) { return Number.isFinite(Number(v)) ? Number(v) : 0; }
  function nw() {
    try { if (typeof window.legacyNetWorth === "function") return num(window.legacyNetWorth()); } catch (e) {}
    return num(state && state.money);
  }
  function hasLuxuryText(html) { return /Luxury (?:&|&amp;) Status/.test(String(html || "")); }
  function reset() {
    if (typeof window.newGame === "function") window.newGame({ sandboxMode: true });
    if (typeof window.ensureStateShape === "function") window.ensureStateShape();
    state.age = 32;
    state.alive = true;
    state.money = 5000000;
    state.actionsTaken = {};
    state.stats = state.stats || {};
    state.stats.health = 80;
    state.stats.stress = 60;
    state.stats.mentalHealth = 74;
    state.stats.energy = 70;
    state.stats.happiness = 65;
    state.life = state.life || {};
    state.life.memories = [];
    try { tab = "life"; } catch (e) {}
  }

  try {
    reset();

    ok("life_rebuild_globals", typeof window.renderLifeRebuildV1871 === "function" && typeof window.openLifePopV1871 === "function" && typeof window.buyLuxuryV1871 === "function" && typeof window.bookExperienceV1871 === "function" && typeof window.lifeDecompressV1871 === "function");

    var html = window.renderLifeRebuildV1871();
    ok("life_page_renders", typeof html === "string" && html.length > 1000, "len=" + (html || "").length);
    ok("life_page_has_core_panels", hasLuxuryText(html) && /Experiences/.test(html) && /Recent Timeline/.test(html) && /Lifestyle Budget/.test(html) && /Personal Goal/.test(html), html.slice(0, 240));
    ok("life_page_has_decompress", /Decompress/.test(html) && /\$25/.test(html), html.slice(0, 240));

    var hubHtml = typeof window.renderHubContent === "function" ? window.renderHubContent("lifehub") : "";
    ok("life_hub_route_uses_rebuild", hasLuxuryText(hubHtml) && /Decompress/.test(hubHtml), hubHtml.slice(0, 240));
    try {
      if (typeof window.setTabV16 === "function") window.setTabV16("lifehub");
      else { tab = "lifehub"; if (typeof window.render === "function") window.render(); }
    } catch (eRoute) {}
    var overlay = document.querySelector('.hub-overlay[data-hub-id="lifehub"], .hub-overlay.hub-lifehub');
    var page = document.querySelector(".life71-page");
    ok("lifehub_overlay_renders_cleanly", !!overlay && !!page && hasLuxuryText(document.body.innerHTML) && /Decompress/.test(document.body.innerHTML), document.body.innerHTML.slice(0, 240));
    ok("lifehub_no_horizontal_overflow", document.documentElement.scrollWidth <= window.innerWidth + 2, "scrollWidth=" + document.documentElement.scrollWidth + " innerWidth=" + window.innerWidth);

    window.openLifePopV1871("luxury");
    ok("luxury_popup_opens", !!document.getElementById("life-pop-v1871") && hasLuxuryText(document.body.innerHTML) && /Lifetime bonus/.test(document.body.innerHTML));
    window.openLifePopV1871("bodymind");
    ok("bodymind_popup_uses_activity_cards", !!document.getElementById("life-pop-v1871") && /life71-act-card mind/.test(document.body.innerHTML) && /doActivity\('/.test(document.body.innerHTML));
    window.openLifePopV1871("fun");
    ok("fun_popup_uses_activity_cards", !!document.getElementById("life-pop-v1871") && /life71-act-card fun/.test(document.body.innerHTML));
    window.openLifePopV1871("earn");
    ok("side_money_popup_uses_activity_cards", !!document.getElementById("life-pop-v1871") && /life71-act-card earn/.test(document.body.innerHTML));

    var cash0 = num(state.money);
    var stress0 = num(state.stats.stress);
    var happy0 = num(state.stats.happiness);
    window.lifeDecompressV1871();
    ok("decompress_spends_25", num(state.money) === cash0 - 25, "money " + cash0 + " -> " + num(state.money));
    ok("decompress_changes_stats", num(state.stats.stress) === stress0 - 6 && num(state.stats.happiness) === happy0 + 2, "stress=" + state.stats.stress + " happy=" + state.stats.happiness);

    var moneyBeforeLux = num(state.money);
    var nwBeforeLux = nw();
    window.buyLuxuryV1871("bag");
    ok("luxury_records_owned", state.luxuryV1871 && state.luxuryV1871.owned.indexOf("bag") >= 0);
    ok("luxury_spends_cash", num(state.money) === moneyBeforeLux - 12000, "money=" + num(state.money));
    ok("luxury_is_pure_sink", nw() <= nwBeforeLux - 11900, "nw " + nwBeforeLux + " -> " + nw());

    var moneyBeforeRepeat = num(state.money);
    window.buyLuxuryV1871("bag");
    ok("luxury_cannot_double_buy", num(state.money) === moneyBeforeRepeat && state.luxuryV1871.owned.filter(function (id) { return id === "bag"; }).length === 1);

    var moneyBeforeExp = num(state.money);
    var memBefore = (state.life.memories || []).length;
    window.bookExperienceV1871("festival");
    ok("experience_spends_and_marks_year", num(state.money) === moneyBeforeExp - 18000 && state.actionsTaken.exp_festival === true, "money=" + num(state.money) + " action=" + state.actionsTaken.exp_festival);
    ok("experience_adds_memory", (state.life.memories || []).length > memBefore, "memories=" + (state.life.memories || []).length);
    var moneyBeforeExpRepeat = num(state.money);
    window.bookExperienceV1871("festival");
    ok("experience_once_per_year", num(state.money) === moneyBeforeExpRepeat, "money=" + num(state.money));

    var logsBefore = (state.log || []).filter(function (row) { return /Status/.test(String(row && row.text || "")); }).length;
    if (typeof window.resolveLifeAndFinanceYear === "function") window.resolveLifeAndFinanceYear();
    var perkYear = state.luxuryV1871 && state.luxuryV1871._perkYr;
    var logsAfterOne = (state.log || []).filter(function (row) { return /Status/.test(String(row && row.text || "")); }).length;
    if (typeof window.resolveLifeAndFinanceYear === "function") window.resolveLifeAndFinanceYear();
    var logsAfterTwo = (state.log || []).filter(function (row) { return /Status/.test(String(row && row.text || "")); }).length;
    ok("status_perk_marks_year", perkYear === state.age, "perkYear=" + perkYear + " age=" + state.age);
    ok("status_perk_once_per_year", logsAfterOne > logsBefore && logsAfterTwo === logsAfterOne, "logs " + logsBefore + " -> " + logsAfterOne + " -> " + logsAfterTwo);

    out.info = {
      money: state.money,
      netWorth: nw(),
      luxuries: state.luxuryV1871 && state.luxuryV1871.owned,
      memories: (state.life.memories || []).length
    };
    out.summary = {
      total: Object.keys(out.pass).length,
      passed: Object.keys(out.pass).filter(function (k) { return out.pass[k]; }).length,
      failed: out.fail.length
    };
  } catch (e) {
    out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0, 8).join(" || ") : "");
  }
  return out;
})();
