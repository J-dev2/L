(async function () {
  var out = { pass: {}, fail: [], notes: [], info: {} };
  function ok(name, cond, detail) { out.pass[name] = !!cond; if (!cond) out.fail.push(name + (detail ? ": " + detail : "")); }
  function wait(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function px(v) { var n = parseFloat(String(v || "0")); return Number.isFinite(n) ? n : 0; }

  try {
    if (typeof window.newGame === "function") window.newGame({ sandboxMode: true });
    if (typeof window.ensureStateShape === "function") window.ensureStateShape();
    state.age = 35;
    state.alive = true;
    state.money = 250000;
    state.savings = 50000;
    state.finance = state.finance || {};
    state.finance.superSaver = 25000;
    if (typeof window.setTabV16 === "function") window.setTabV16("money");
    else if (typeof window.setTab === "function") window.setTab("money");
    await wait(300);

    var overlay = document.querySelector(".hub-overlay.hub-money");
    var sheet = document.querySelector(".hub-sheet-money");
    var body = document.querySelector(".hub-overlay.hub-money .v16-hub-body,.hub-overlay.hub-money .v11-hub-body,[data-hub-body='money']");
    var shell = document.querySelector(".v1837-money-shell");
    var styles = Array.prototype.map.call(document.querySelectorAll("style"), function (s) { return s.textContent || ""; }).join("\n");
    var sheetCS = sheet ? getComputedStyle(sheet) : {};
    var bodyCS = body ? getComputedStyle(body) : {};
    var sheetRect = sheet ? sheet.getBoundingClientRect() : { bottom: 999999, height: 0 };
    var bodyRect = body ? body.getBoundingClientRect() : { height: 0 };
    var bottomPad = px(bodyCS.paddingBottom) + px(shell ? getComputedStyle(shell).paddingBottom : 0);

    ok("money_overlay_renders", !!(overlay && sheet && body && shell));
    ok("money_css_uses_dynamic_viewport", styles.indexOf("100dvh") >= 0 && styles.indexOf(".hub-overlay.hub-money") >= 0);
    ok("money_css_uses_safe_area_bottom", styles.indexOf("safe-area-inset-bottom") >= 0);
    ok("money_sheet_is_flex_column", sheetCS.display === "flex" && sheetCS.flexDirection === "column", "display=" + sheetCS.display + " direction=" + sheetCS.flexDirection);
    ok("money_body_scrolls_internally", /auto|scroll/.test(String(bodyCS.overflowY)), "overflowY=" + bodyCS.overflowY);
    ok("money_body_has_touch_scrolling_contract", styles.indexOf("-webkit-overflow-scrolling:touch") >= 0 && styles.indexOf("overscroll-behavior:contain") >= 0);
    ok("money_bottom_safe_padding_large_enough", bottomPad >= 120, "bottomPad=" + bottomPad);
    ok("money_sheet_fits_viewport", sheetRect.height <= window.innerHeight + 2 && sheetRect.bottom <= window.innerHeight + 2, "sheet=" + JSON.stringify({ height: sheetRect.height, bottom: sheetRect.bottom, innerHeight: window.innerHeight }));
    ok("money_body_has_visible_height", bodyRect.height > 120, "bodyHeight=" + bodyRect.height);

    if (body) {
      body.scrollTop = body.scrollHeight;
      await wait(80);
      var last = document.querySelector(".v1837-shortcuts") || shell.lastElementChild;
      var lastRect = last ? last.getBoundingClientRect() : { bottom: 999999 };
      ok("money_bottom_controls_reachable_after_scroll", lastRect.bottom <= window.innerHeight + 8, "lastBottom=" + lastRect.bottom + " innerHeight=" + window.innerHeight);
    }

    out.info = {
      sheetHeight: sheetRect.height,
      bodyHeight: bodyRect.height,
      bodyScrollHeight: body ? body.scrollHeight : 0,
      bottomPad: bottomPad,
      viewport: { width: window.innerWidth, height: window.innerHeight }
    };
    out.summary = { total: Object.keys(out.pass).length, passed: Object.keys(out.pass).filter(function (k) { return out.pass[k]; }).length, failed: out.fail.length };
  } catch (e) {
    out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0, 8).join(" || ") : "");
  }
  return out;
})();
