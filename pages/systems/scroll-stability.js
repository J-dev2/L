/* Ledger system v18.43: preserve hub scroll when actions rerender a panel. */
(function () {
  if (window.__ledgerScrollStabilityV1843Loaded) return;
  window.__ledgerScrollStabilityV1843Loaded = true;

  function q(selector) {
    try {
      if (typeof document !== "undefined" && document.querySelector) return document.querySelector(selector);
    } catch (e) {}
    return null;
  }

  function hubScroller() {
    return q(".v16-hub-body,.v11-hub-body,.v10-hub-body,.v9-hub-body,.v6-hub-body,.hub-body,.hub-sheet-money");
  }

  function currentHubId() {
    var overlay = q(".hub-overlay");
    if (overlay && overlay.dataset && overlay.dataset.hubId) return String(overlay.dataset.hubId);
    var body = hubScroller();
    if (body && body.dataset && body.dataset.hubBody) return String(body.dataset.hubBody);
    try {
      if (typeof tab !== "undefined" && tab && tab !== "life") return String(tab);
    } catch (e) {}
    try {
      if (window.tab && window.tab !== "life") return String(window.tab);
    } catch (e2) {}
    return "";
  }

  window.__ledgerScrollMemoryV1843 = window.__ledgerScrollMemoryV1843 || {};

  function capture(hubId) {
    var sc = hubScroller();
    var id = hubId || currentHubId();
    return {
      hubId: id,
      top: sc ? Number(sc.scrollTop) || 0 : 0,
      left: sc ? Number(sc.scrollLeft) || 0 : 0,
      winX: typeof window.scrollX === "number" ? window.scrollX : 0,
      winY: typeof window.scrollY === "number" ? window.scrollY : 0
    };
  }

  function remember(hubId) {
    var pos = capture(hubId);
    if (pos.hubId) window.__ledgerScrollMemoryV1843[pos.hubId] = pos;
    return pos;
  }

  function sameHub(pos) {
    if (!pos || !pos.hubId) return true;
    var now = currentHubId();
    return !now || now === pos.hubId;
  }

  function restore(pos) {
    if (!pos) return;
    var apply = function () {
      if (!sameHub(pos)) return;
      var sc = hubScroller();
      if (sc) {
        sc.scrollTop = Number(pos.top) || 0;
        sc.scrollLeft = Number(pos.left) || 0;
      }
      try {
        if (typeof window.scrollTo === "function") window.scrollTo(Number(pos.winX) || 0, Number(pos.winY) || 0);
      } catch (e) {}
    };
    apply();
    try {
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(apply);
        requestAnimationFrame(function () { requestAnimationFrame(apply); });
      }
    } catch (e2) {}
    try { setTimeout(apply, 0); } catch (e3) {}
    try { setTimeout(apply, 45); } catch (e4) {}
    try { setTimeout(apply, 140); } catch (e5) {}
  }

  function targetPos(targetHub, provided, beforeHub, captured) {
    if (provided) return provided;
    if (!targetHub || !beforeHub || targetHub === beforeHub) return captured;
    return window.__ledgerScrollMemoryV1843[targetHub] || { hubId: targetHub, top: 0, left: 0, winX: 0, winY: 0 };
  }

  function wrapInPlaceRenderer() {
    var previous = window.renderHubInPlaceV16 || (typeof renderHubInPlaceV16 === "function" ? renderHubInPlaceV16 : null);
    if (typeof previous !== "function" || previous.__v1843ScrollStable) return;
    var wrapped = function (hubId, pos) {
      var beforeHub = currentHubId();
      var targetHub = String(hubId || beforeHub || "");
      var captured = remember(beforeHub || targetHub);
      var usePos = targetPos(targetHub, pos, beforeHub, captured);
      var out = previous.call(this, hubId || targetHub, usePos);
      remember(targetHub);
      restore(usePos);
      return out;
    };
    wrapped.__v1843ScrollStable = true;
    window.renderHubInPlaceV16 = wrapped;
    try { renderHubInPlaceV16 = wrapped; } catch (e) {}
  }

  function wrapFullRender() {
    var previous = window.render || (typeof render === "function" ? render : null);
    if (typeof previous !== "function" || previous.__v1843ScrollStable) return;
    var wrapped = function () {
      var beforeHub = currentHubId();
      var pos = beforeHub ? remember(beforeHub) : null;
      var out = previous.apply(this, arguments);
      if (pos) restore(pos);
      return out;
    };
    wrapped.__v1843ScrollStable = true;
    window.render = wrapped;
    try { render = wrapped; } catch (e) {}
  }

  // v18.57: the old version read layout (scrollTop/scrollLeft) on every
  // pointerdown/click/keydown/scroll/touchstart — a forced reflow on every
  // interaction, which caused noticeable input lag. We now snapshot on
  // pointerdown only, debounced to a single requestAnimationFrame (passive), and
  // drop the high-frequency scroll/touch/click capture reads entirely. The
  // render wrap (wrapFullRender) still restores position around rerenders, so
  // behavior is preserved while the per-click reflow is gone.
  function installEventMemory() {
    if (typeof document === "undefined" || !document.addEventListener) return;
    var pending = false;
    function snapshot() {
      pending = false;
      try { remember(); } catch (e) {}
    }
    function schedule() {
      if (pending) return;
      pending = true;
      try {
        if (typeof requestAnimationFrame === "function") requestAnimationFrame(snapshot);
        else setTimeout(snapshot, 0);
      } catch (e) { snapshot(); }
    }
    try { document.addEventListener("pointerdown", schedule, { capture: true, passive: true }); }
    catch (e) { document.addEventListener("pointerdown", schedule, true); }
  }

  wrapInPlaceRenderer();
  wrapFullRender();
  installEventMemory();

  window.preserveHubScrollV1843 = function (fn, hubId) {
    var pos = remember(hubId || currentHubId());
    var out = typeof fn === "function" ? fn() : undefined;
    restore(pos);
    return out;
  };

  if (window.registerLedgerSystem) {
    window.registerLedgerSystem({
      id: "scroll-stability",
      file: "pages/systems/scroll-stability.js",
      status: "active",
      globals: ["preserveHubScrollV1843"],
      notes: "Captures hub scroll before clicks and restores it after in-place or full rerenders."
    });
  }
})();
