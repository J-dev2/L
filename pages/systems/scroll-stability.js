/* Ledger system v18.43/v18.74: preserve hub scroll and suppress action rerender flicker. */
(function () {
  if (window.__ledgerScrollStabilityV1843Loaded) return;
  window.__ledgerScrollStabilityV1843Loaded = true;
  var FLICKER_CLASS = "ledger-render-steady-v1843";
  var flickerTimer = 0;

  function q(selector) {
    try {
      if (typeof document !== "undefined" && document.querySelector) return document.querySelector(selector);
    } catch (e) {}
    return null;
  }

  function hubScroller() {
    return q(".v16-hub-body,.v11-hub-body,.v10-hub-body,.v9-hub-body,.v6-hub-body,.hub-body,.hub-sheet-money");
  }

  function installFlickerStyles() {
    if (typeof document === "undefined" || !document.createElement) return;
    if (document.getElementById("ledger-flicker-stability-v1843")) return;
    var style = document.createElement("style");
    style.id = "ledger-flicker-stability-v1843";
    style.textContent = [
      "html." + FLICKER_CLASS + " *{scroll-behavior:auto!important;}",
      "html." + FLICKER_CLASS + " .hub-overlay.v16-hub,",
      "html." + FLICKER_CLASS + " .hub-overlay.v16-hub .hub-sheet,",
      "html." + FLICKER_CLASS + " .hub-overlay.v16-hub .v16-hub-body *,",
      "html." + FLICKER_CLASS + " .life71-backdrop,",
      "html." + FLICKER_CLASS + " .life71-backdrop *,",
      "html." + FLICKER_CLASS + " .fo72-backdrop,",
      "html." + FLICKER_CLASS + " .fo72-backdrop *{transition-duration:0s!important;}"
    ].join("\n");
    try { (document.head || document.documentElement).appendChild(style); } catch (e) {}
  }

  function stopLegacyScrollLocks() {
    try {
      if (window.__ledgerV13LockTimer) clearInterval(window.__ledgerV13LockTimer);
      window.__ledgerV13LockTimer = null;
    } catch (e) {}
    try {
      window.__ledgerV13FrozenSnap = null;
      window.__ledgerV14ActionSnap = null;
      window.__ledgerV12LastSnap = null;
      window.__ledgerV12Restoring = false;
    } catch (e2) {}
  }

  function beginFlickerGuard() {
    installFlickerStyles();
    stopLegacyScrollLocks();
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.classList.add(FLICKER_CLASS);
    }
    try { if (flickerTimer) clearTimeout(flickerTimer); } catch (e) {}
  }

  function endFlickerGuard() {
    stopLegacyScrollLocks();
    if (typeof document === "undefined" || !document.documentElement) return;
    try { if (flickerTimer) clearTimeout(flickerTimer); } catch (e) {}
    flickerTimer = setTimeout(function () {
      stopLegacyScrollLocks();
      try { document.documentElement.classList.remove(FLICKER_CLASS); } catch (e) {}
    }, 180);
  }

  function withFlickerGuard(fn) {
    beginFlickerGuard();
    try {
      return typeof fn === "function" ? fn() : undefined;
    } finally {
      endFlickerGuard();
    }
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
      var self = this;
      var beforeHub = currentHubId();
      var targetHub = String(hubId || beforeHub || "");
      var captured = remember(beforeHub || targetHub);
      var usePos = targetPos(targetHub, pos, beforeHub, captured);
      var out = withFlickerGuard(function () {
        return previous.call(self, hubId || targetHub, usePos);
      });
      remember(targetHub);
      restore(usePos);
      stopLegacyScrollLocks();
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
      var self = this;
      var args = arguments;
      var beforeHub = currentHubId();
      var pos = beforeHub ? remember(beforeHub) : null;
      var out = withFlickerGuard(function () {
        return previous.apply(self, args);
      });
      if (pos) restore(pos);
      stopLegacyScrollLocks();
      return out;
    };
    wrapped.__v1843ScrollStable = true;
    window.render = wrapped;
    try { render = wrapped; } catch (e) {}
  }

  function assignActionAliases(fn) {
    window.v17HubAction = fn;
    window.v16HubAction = fn;
    window.stableHubActionV16 = fn;
    window.stableHubActionV15 = fn;
    window.stableHubActionV14 = fn;
    window.stableHubActionV13 = fn;
    window.stableHubActionV12 = fn;
    try { v17HubAction = fn; } catch (e) {}
    try { v16HubAction = fn; } catch (e2) {}
    try { stableHubActionV16 = fn; } catch (e3) {}
    try { stableHubActionV15 = fn; } catch (e4) {}
    try { stableHubActionV14 = fn; } catch (e5) {}
    try { stableHubActionV13 = fn; } catch (e6) {}
    try { stableHubActionV12 = fn; } catch (e7) {}
  }

  function wrapHubActions() {
    var previous = window.v17HubAction || window.v16HubAction || window.stableHubActionV16 || window.stableHubActionV15 || window.stableHubActionV14 || window.stableHubActionV13 || window.stableHubActionV12;
    if (typeof previous !== "function" || previous.__v1843FlickerStable) return;
    var wrapped = function (fn) {
      var self = this;
      return withFlickerGuard(function () {
        return previous.call(self, fn);
      });
    };
    wrapped.__v1843FlickerStable = true;
    wrapped.__v1843PreviousAction = previous;
    assignActionAliases(wrapped);
  }

  function wrapMoneyAction() {
    var previous = window.v181MoneyAction || (typeof v181MoneyAction === "function" ? v181MoneyAction : null);
    if (typeof previous !== "function" || previous.__v1843FlickerStable) return;
    var wrapped = function (fn) {
      var self = this;
      return withFlickerGuard(function () {
        return previous.call(self, fn);
      });
    };
    wrapped.__v1843FlickerStable = true;
    window.v181MoneyAction = wrapped;
    try { v181MoneyAction = wrapped; } catch (e) {}
  }

  function wrapLayoutControls() {
    var width = window.setHubWidthV17 || window.setHubWidthV16 || window.setHubWidthV9;
    if (typeof width === "function" && !width.__v1843FlickerStable) {
      var wrappedWidth = function () {
        var self = this;
        var args = arguments;
        var pos = remember(currentHubId());
        var out = withFlickerGuard(function () { return width.apply(self, args); });
        restore(pos);
        return out;
      };
      wrappedWidth.__v1843FlickerStable = true;
      window.setHubWidthV17 = wrappedWidth;
      window.setHubWidthV16 = wrappedWidth;
      window.setHubWidthV9 = wrappedWidth;
      try { setHubWidthV17 = wrappedWidth; } catch (e) {}
      try { setHubWidthV16 = wrappedWidth; } catch (e2) {}
      try { setHubWidthV9 = wrappedWidth; } catch (e3) {}
    }

    var height = window.setHubHeightV16 || window.setHubHeightV9;
    if (typeof height === "function" && !height.__v1843FlickerStable) {
      var wrappedHeight = function () {
        var self = this;
        var args = arguments;
        var pos = remember(currentHubId());
        var out = withFlickerGuard(function () { return height.apply(self, args); });
        restore(pos);
        return out;
      };
      wrappedHeight.__v1843FlickerStable = true;
      window.setHubHeightV16 = wrappedHeight;
      window.setHubHeightV9 = wrappedHeight;
      try { setHubHeightV16 = wrappedHeight; } catch (e4) {}
      try { setHubHeightV9 = wrappedHeight; } catch (e5) {}
    }

    var text = window.adjustTextV16 || window.adjustTextV9;
    if (typeof text === "function" && !text.__v1843FlickerStable) {
      var wrappedText = function () {
        var self = this;
        var args = arguments;
        var pos = remember(currentHubId());
        var out = withFlickerGuard(function () { return text.apply(self, args); });
        restore(pos);
        return out;
      };
      wrappedText.__v1843FlickerStable = true;
      window.adjustTextV16 = wrappedText;
      window.adjustTextV9 = wrappedText;
      try { adjustTextV16 = wrappedText; } catch (e6) {}
      try { adjustTextV9 = wrappedText; } catch (e7) {}
    }
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
  wrapHubActions();
  wrapMoneyAction();
  wrapLayoutControls();
  installEventMemory();

  window.preserveHubScrollV1843 = function (fn, hubId) {
    var pos = remember(hubId || currentHubId());
    var out = withFlickerGuard(fn);
    restore(pos);
    return out;
  };

  if (window.registerLedgerSystem) {
    window.registerLedgerSystem({
      id: "scroll-stability",
      file: "pages/systems/scroll-stability.js",
      status: "active",
      globals: ["preserveHubScrollV1843"],
      notes: "Captures hub scroll before clicks, clears legacy scroll locks, and suppresses hub flicker during action rerenders."
    });
  }
})();
