(async function () {
  var out = { pass: {}, fail: [], notes: [], info: {} };
  function ok(name, cond, detail) { out.pass[name] = !!cond; if (!cond) out.fail.push(name + (detail ? ": " + detail : "")); }
  function wait(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }

  try {
    if (typeof window.newGame === "function") window.newGame({ sandboxMode: true });
    if (typeof window.ensureStateShape === "function") window.ensureStateShape();
    state.age = 35;
    state.alive = true;
    state.money = 250000;
    state.finance = state.finance || {};

    ok("platform_compat_loaded", !!window.ledgerPlatformV1875 && typeof window.ledgerIconV1875 === "function" && typeof window.setLedgerEmojiModeV1875 === "function");
    ok("platform_detects_known_bucket", /^(ios|android|desktop)$/.test(String((window.ledgerPlatformV1875 || {}).platform)), JSON.stringify(window.ledgerPlatformV1875 || {}));
    ok("platform_attrs_set", !!(document.documentElement.getAttribute("data-ledger-platform") && document.documentElement.getAttribute("data-ledger-emoji-mode")));

    window.setLedgerEmojiModeV1875("symbols");
    if (typeof window.setTabV16 === "function") window.setTabV16("money");
    else if (typeof window.setTab === "function") window.setTab("money");
    await wait(250);
    if (typeof window.applyLedgerEmojiFallbackV1875 === "function") window.applyLedgerEmojiFallbackV1875();
    var moneyText = (document.querySelector(".hub-overlay.hub-money") || document.body).textContent || "";

    ok("symbol_mode_sets_attr", document.documentElement.getAttribute("data-ledger-emoji-mode") === "symbols");
    ok("ledger_icon_returns_symbol", window.ledgerIconV1875("🏦", "BANK") === "BANK");
    ok("money_icons_fallback_to_text", moneyText.indexOf("BANK Banking command center") >= 0 && moneyText.indexOf("PULSE Live money pulse") >= 0, moneyText.slice(0, 240));
    ok("money_problem_emoji_removed_in_symbol_mode", moneyText.indexOf("🏦") < 0 && moneyText.indexOf("💓") < 0 && moneyText.indexOf("💵") < 0 && moneyText.indexOf("💳") < 0, moneyText.slice(0, 240));

    window.setLedgerEmojiModeV1875("emoji");
    ok("emoji_mode_keeps_icon_helper", window.ledgerIconV1875("🏦", "BANK") === "🏦");
    window.setLedgerEmojiModeV1875("auto");

    out.info = {
      platform: window.ledgerPlatformV1875,
      textSample: moneyText.slice(0, 220)
    };
    out.summary = { total: Object.keys(out.pass).length, passed: Object.keys(out.pass).filter(function (k) { return out.pass[k]; }).length, failed: out.fail.length };
  } catch (e) {
    out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0, 8).join(" || ") : "");
  }
  return out;
})();
