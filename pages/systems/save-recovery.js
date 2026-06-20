/* Save / recovery system bridge plus play-page boot guard. */
(function () {
  var SYSTEM_META = {
    id: "save-recovery",
    file: "pages/systems/save-recovery.js",
    status: "active-boot-guard",
    globals: ["save", "loadFromSlot", "pickSlot", "recoverLedgerSlotV18334", "enterFromSplash"],
    nextMove: "Move slot loading, recovery picker, and Wayback save reads fully out of the legacy runtime."
  };

  if (window.registerLedgerSystem) window.registerLedgerSystem(SYSTEM_META);

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[ch];
    });
  }

  function app() {
    return document.getElementById("app");
  }

  function slotKeyFor(idx) {
    try { if (typeof slotKey === "function") return slotKey(idx); } catch (e) {}
    return "ledger-life-slot-" + idx;
  }

  function clampSlot(raw) {
    var n = Math.round(Number(raw) || 1);
    return Math.max(1, Math.min(5, Number.isFinite(n) ? n : 1));
  }

  function getState() {
    try { if (typeof state !== "undefined" && state) return state; } catch (e) {}
    try { if (window.state) return window.state; } catch (e2) {}
    return null;
  }

  function setState(next) {
    try { state = next; } catch (e) {}
    try { window.state = next; } catch (e2) {}
    return next;
  }

  function validLife(s) {
    var name = s && typeof s.name === "string" ? s.name.trim() : "";
    var age = Number(s && s.age);
    return !!(s && typeof s === "object" && name && name !== "undefined" && name !== "null" && Number.isFinite(age) && age >= 0 && age < 130 && (s.alive === true || s.alive === false));
  }

  function partialLife(s) {
    if (!s || typeof s !== "object") return false;
    if (validLife(s)) return false;
    if (Array.isArray(s)) return true;
    if (!Object.keys(s).length) return true;
    if (s.alive !== true) return true;
    if (!s.name || !Number.isFinite(Number(s.age))) return true;
    return false;
  }

  function parse(raw) {
    try { return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }

  function normalizeLife(s) {
    if (!validLife(s)) return s;
    s.stats = s.stats && typeof s.stats === "object" && !Array.isArray(s.stats) ? s.stats : {};
    s.flags = s.flags && typeof s.flags === "object" && !Array.isArray(s.flags) ? s.flags : {};
    s.finance = s.finance && typeof s.finance === "object" && !Array.isArray(s.finance) ? s.finance : {};
    s.relationships = s.relationships && typeof s.relationships === "object" && !Array.isArray(s.relationships) ? s.relationships : {};
    s.legacy = s.legacy && typeof s.legacy === "object" && !Array.isArray(s.legacy) ? s.legacy : { generation:1 };
    s.log = Array.isArray(s.log) ? s.log : [];
    s.inventory = Array.isArray(s.inventory) ? s.inventory : [];
    s.timeSnapshotsV1814 = Array.isArray(s.timeSnapshotsV1814) ? s.timeSnapshotsV1814 : [];
    if (!Number.isFinite(Number(s.money))) s.money = 0;
    if (!Number.isFinite(Number(s.savings))) s.savings = 0;
    return s;
  }

  function storeBadState(reason, s) {
    try {
      localStorage.setItem("ledger_v1835_blocked_startup_state", JSON.stringify({
        at: Date.now(),
        reason: reason || "unknown",
        state: s || getState()
      }));
    } catch (e) {}
  }

  function clearPatchGhosts(reason) {
    var s = getState();
    if (partialLife(s)) {
      storeBadState(reason || "partial life cleaned", s);
      setState(null);
      return true;
    }
    try {
      if (partialLife(window.state)) {
        storeBadState(reason || "window state ghost cleaned", window.state);
        window.state = null;
        return true;
      }
    } catch (e) {}
    return false;
  }

  function showLandingReturn(reason) {
    var el = app();
    if (!el) return;
    setState(null);
    el.innerHTML = '<div class="masthead"><div class="title">The Ledger</div><div class="vol">Life Stack</div></div>' +
      '<section class="panel v1835-boot-return"><div class="section-label">Startup Gate</div>' +
      '<div class="row-title">Choose a life from the landing page first.</div>' +
      '<div class="row-sub">' + esc(reason || "The play runtime did not receive a slot, new-life, or sandbox command.") + '</div>' +
      '<div class="mini-actions" style="justify-content:flex-start;margin-top:12px">' +
      '<button class="secondary" style="width:auto;margin-top:0;padding:12px 16px" onclick="event.preventDefault();location.href=\'index.html\'">Return To Life Stack</button>' +
      '</div></section>';
  }

  function loadExplicitSlot(idx) {
    idx = clampSlot(idx);
    try { activeSlot = idx; } catch (e) {}
    try { localStorage.setItem("ledger-active-slot", String(idx)); } catch (e2) {}
    if (typeof loadFromSlot === "function") {
      try {
        if (loadFromSlot(idx) && validLife(getState())) return true;
      } catch (e3) {}
    }
    var saved = null;
    try { saved = parse(localStorage.getItem(slotKeyFor(idx))); } catch (e4) {}
    if (saved && saved.state && typeof saved.state === "object") saved = saved.state;
    if (!validLife(saved)) return false;
    setState(normalizeLife(saved));
    try { if (typeof ensureStateShape === "function") ensureStateShape(); } catch (e5) {}
    return true;
  }

  function renderNow() {
    try { if (typeof render === "function") render(); } catch (e) { showLandingReturn(e && e.message || e); }
  }

  function finishPlayBoot() {
    var boot = window.__ledgerPlayBoot || {};
    clearPatchGhosts("before explicit play boot");

    if (boot.missingCommand) {
      showLandingReturn("The play page was opened directly. Open index.html and choose a save first.");
      return;
    }

    var selected = clampSlot(boot.slot || 1);
    try { activeSlot = selected; } catch (e) {}
    try { localStorage.setItem("ledger-active-slot", String(selected)); } catch (e2) {}

    if (boot.action === "slot") {
      if (!loadExplicitSlot(selected)) {
        setState(null);
        try { splashShown = true; introMode = "main"; tab = "life"; } catch (e3) {}
        showLandingReturn("Slot " + selected + " was not readable. Go back and choose another slot or start a new life.");
        return;
      }
      try {
        splashShown = true;
        introMode = "main";
        tab = boot.hub || "life";
      } catch (e4) {}
      renderNow();
      return;
    }

    setState(null);
    try {
      splashShown = true;
      introMode = boot.action === "sandbox" ? "sandbox" : "main";
      tab = "life";
    } catch (e5) {}
    renderNow();
  }

  var previousRender = window.render || (typeof render === "function" ? render : null);
  if (typeof previousRender === "function" && !previousRender.__ledger1835BootGuard) {
    window.render = function () {
      if (clearPatchGhosts("render blocked partial life")) {
        showLandingReturn("A partial startup state was blocked before it could become a random character.");
        return;
      }
      return previousRender.apply(this, arguments);
    };
    window.render.__ledger1835BootGuard = true;
    try { render = window.render; } catch (e) {}
  }

  var previousPickSlot = window.pickSlot || (typeof pickSlot === "function" ? pickSlot : null);
  window.pickSlot = function (idx) {
    idx = clampSlot(idx);
    try { localStorage.setItem("ledger-active-slot", String(idx)); } catch (e) {}
    if (previousPickSlot) return previousPickSlot.apply(this, arguments);
    if (loadExplicitSlot(idx)) return renderNow();
    setState(null);
    try { activeSlot = idx; splashShown = true; introMode = "main"; } catch (e2) {}
    return renderNow();
  };
  try { pickSlot = window.pickSlot; } catch (e3) {}

  try {
    var style = document.createElement("style");
    style.textContent = ".v1835-boot-return{border-color:rgba(126,160,172,.44)!important;background:linear-gradient(135deg,rgba(22,38,42,.96),rgba(35,28,22,.96))!important}";
    document.head.appendChild(style);
  } catch (e4) {}

  finishPlayBoot();
})();
