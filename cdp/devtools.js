(function () {
  var out = { pass: {}, fail: [], notes: [] };
  function ok(name, cond, detail) { out.pass[name] = !!cond; if (!cond) out.fail.push(name + (detail ? (": " + detail) : "")); }
  function num(x) { return Number.isFinite(Number(x)) ? Number(x) : 0; }
  function $(s) { return document.querySelector(s); }
  try {
    // The driver navigates with ?dev=1, so the dev module is active.
    if (typeof window.newGame === "function") window.newGame({});
    if (typeof ensureStateShape === "function") ensureStateShape();

    ok("devtools_available_with_flag", typeof window.devTools === "function");
    // locked initially: a gate is shown, no fab/panel
    ok("gate_shown_locked", !!document.getElementById("ledger-dev-gate"));
    ok("no_fab_when_locked", !document.getElementById("ledger-dev-fab"));

    ok("wrong_password_rejected", window.devTools("nope") === false);
    ok("still_locked_after_wrong", !document.getElementById("ledger-dev-fab"));

    ok("right_password_unlocks", window.devTools("password") === true);
    ok("fab_shown_unlocked", !!document.getElementById("ledger-dev-fab"));
    ok("gate_removed_unlocked", !document.getElementById("ledger-dev-gate"));

    // open the panel via the fab
    document.getElementById("ledger-dev-fab").click();
    var overlay = document.getElementById("ledger-dev-overlay");
    ok("panel_opens", !!overlay && overlay.innerHTML.indexOf("Dev Tools") >= 0);
    ok("panel_has_sections", overlay.innerHTML.indexOf("Money / Age / Stats") >= 0 && overlay.innerHTML.indexOf("Entrepreneurship") >= 0 && overlay.innerHTML.indexOf("Old Business") >= 0 && overlay.innerHTML.indexOf("Save") >= 0);

    // money tool works
    state.money = 0;
    function clickAct(a) { var el = document.querySelector('[data-act="' + a + '"]'); if (el) el.click(); return !!el; }
    ok("give1m_button", clickAct("give1m"));
    ok("give1m_adds_cash", num(state.money) === 1000000, "money=" + num(state.money));

    // spawn company tool works
    if (!state.finance) state.finance = {};
    state.finance.bizV1860 = undefined;
    // re-open panel (render may have closed overlay) then spawn
    if (!document.getElementById("ledger-dev-overlay")) document.getElementById("ledger-dev-fab").click();
    clickAct("spawn");
    var biz = (state.finance.bizV1860 && state.finance.bizV1860.businesses || [])[0];
    ok("spawn_creates_company", !!biz && biz.active === true, "biz=" + (biz ? biz.name : "none"));

    // make IPO-ready tool
    if (!document.getElementById("ledger-dev-overlay")) document.getElementById("ledger-dev-fab").click();
    clickAct("ipo");
    biz = (state.finance.bizV1860 && state.finance.bizV1860.businesses || [])[0];
    ok("ipo_ready_sets_fields", biz && num(biz.annualRevenue) >= 10000000 && num(biz.yearsOld) >= 5, "rev=" + (biz && biz.annualRevenue) + " yrs=" + (biz && biz.yearsOld));

    // player hub no longer shows the old-business card
    var hub = window.renderEntrepreneurHubV1861 ? window.renderEntrepreneurHubV1861() : "";
    ok("hub_no_old_business_card", hub.indexOf("Old Business Check") < 0 && hub.indexOf("biz1861-migration") < 0);
    // but the migration data fn is still available (for the dev panel / auto-migration)
    ok("old_business_data_fn_kept", typeof window.oldBusinessCheckV1861 === "function");

    // close
    if (!document.getElementById("ledger-dev-overlay")) document.getElementById("ledger-dev-fab").click();
    clickAct("close");
    ok("panel_closes", !document.getElementById("ledger-dev-overlay"));

    out.summary = { total: Object.keys(out.pass).length, passed: Object.keys(out.pass).filter(function (k) { return out.pass[k]; }).length, failed: out.fail.length };
  } catch (e) { out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0, 6).join(" || ") : ""); }
  return out;
})();
