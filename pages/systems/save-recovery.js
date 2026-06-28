/* Save / recovery system bridge plus play-page boot guard. */
(function () {
  var SYSTEM_META = {
    id: "save-recovery",
    file: "pages/systems/save-recovery.js",
    status: "active-boot-guard",
    globals: ["save", "loadFromSlot", "pickSlot", "recoverLedgerSlotV18334", "enterFromSplash"],
    nextMove: "Move the remaining slot loading code fully out of the legacy runtime."
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

  function activeSlotIndex() {
    try {
      var direct = Number(activeSlot);
      if (Number.isFinite(direct) && direct >= 1) return clampSlot(direct);
    } catch (e) {}
    try {
      return clampSlot(localStorage.getItem("ledger-active-slot") || 1);
    } catch (e2) {}
    return 1;
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

  function readRecoverySave(label, key, slot, priority) {
    var data = null;
    try { data = parse(localStorage.getItem(key)); } catch (e) {}
    if (data && data.state && typeof data.state === "object") data = data.state;
    if (!validLife(data)) return null;
    return { label: label, key: key, slot: slot || null, priority: priority || 0, state: normalizeLife(data) };
  }

  function recoveryChoices() {
    var active = activeSlotIndex();
    var out = [];
    var seen = {};
    function push(choice) {
      if (!choice || !choice.state) return;
      var id = String(choice.key || "") + "|" + String(choice.state.name || "") + "|" + String(choice.state.age);
      if (seen[id]) return;
      seen[id] = true;
      out.push(choice);
    }
    push(readRecoverySave("active slot " + active, slotKeyFor(active), active, 10000));
    push(readRecoverySave("active backup slot " + active, "ledger-v1826-backup-slot-" + active, active, 9000));
    push(readRecoverySave("last good backup", "ledger_v1832_last_good_state", active, 8000));
    for (var i = 1; i <= 5; i++) {
      push(readRecoverySave("slot " + i, slotKeyFor(i), i, i === active ? 7000 : 1000 - i));
      push(readRecoverySave("backup slot " + i, "ledger-v1826-backup-slot-" + i, i, i === active ? 6000 : 500 - i));
    }
    out.sort(function (a, b) { return (b.priority || 0) - (a.priority || 0); });
    return out;
  }

  function loadRecoveryChoice(choice, silent) {
    if (!choice || !validLife(choice.state)) return false;
    var next = null;
    try { next = normalizeLife(JSON.parse(JSON.stringify(choice.state))); } catch (e) {}
    if (!validLife(next)) return false;
    setState(next);
    if (choice.slot) {
      try { activeSlot = choice.slot; } catch (e2) {}
      try { localStorage.setItem("ledger-active-slot", String(choice.slot)); } catch (e3) {}
      try { localStorage.setItem(slotKeyFor(choice.slot), JSON.stringify(next)); } catch (e4) {}
    }
    try { if (typeof ensureStateShape === "function") ensureStateShape(); } catch (e5) {}
    try { if (typeof save === "function") save(); } catch (e6) {}
    if (!silent) {
      try { if (typeof addToast === "function") addToast("Loaded " + (next.name || "life") + " from " + choice.label + "."); } catch (e7) {}
    }
    return true;
  }

  function currentSlotIsPartial() {
    var raw = null;
    var parsed = null;
    try { raw = localStorage.getItem(slotKeyFor(activeSlotIndex())); } catch (e) {}
    parsed = parse(raw);
    if (parsed && parsed.state) parsed = parsed.state;
    return partialLife(parsed);
  }

  function showRecovery(reason) {
    var el = app();
    if (!el) return;
    var choices = recoveryChoices();
    window.__ledgerRecoverChoicesV18334 = choices;
    var active = activeSlotIndex();
    var rows = choices.length ? choices.map(function (choice, idx) {
      var s = choice.state || {};
      var activeTag = choice.slot === active ? " - ACTIVE" : "";
      return '<button class="secondary v18334-recover-choice" onclick="event.preventDefault();event.stopPropagation();recoverLedgerSlotV18334(' + idx + ')"><b>' + esc(s.name || "Unnamed life") + '</b><span>Age ' + esc(s.age) + ' - ' + esc(choice.label) + activeTag + '</span></button>';
    }).join("") : '<div class="row-sub">No readable saves were found. Return to Life Stack will clear only the broken in-memory state.</div>';
    el.innerHTML = '<div class="masthead"><div class="title">The Ledger</div><div class="vol">Recovery</div></div>' +
      '<section class="panel v18334-recovery"><div class="section-label">Save Recovery</div>' +
      '<div class="row-title">A partial life was stopped before it became a fake character.</div>' +
      '<div class="row-sub">The active slot is checked first. Pick the life you want, or return to the life stack without saving the broken state.</div>' +
      (reason ? '<div class="row-sub">Reason: ' + esc(reason) + '</div>' : '') +
      '<div class="row-sub">Active slot: ' + esc(active) + '</div>' + rows +
      '<div class="mini-actions" style="justify-content:flex-start;margin-top:12px;gap:8px">' +
      '<button class="secondary" style="width:auto;margin-top:0;padding:12px 16px" onclick="event.preventDefault();event.stopPropagation();clearPartialLedgerStateV18334()">Return To Life Stack</button>' +
      '</div></section>';
  }

  function autoRecoverActive() {
    var active = activeSlotIndex();
    var activeChoice = readRecoverySave("active slot " + active, slotKeyFor(active), active, 10000);
    if (activeChoice && loadRecoveryChoice(activeChoice, true)) return true;
    var backup = readRecoverySave("active backup slot " + active, "ledger-v1826-backup-slot-" + active, active, 9000);
    return !!(backup && loadRecoveryChoice(backup, true));
  }

  window.recoverLedgerSlotV18334 = function (idx) {
    var choices = window.__ledgerRecoverChoicesV18334 || recoveryChoices();
    var choice = choices[Math.max(0, Math.round(Number(idx) || 0))];
    if (!loadRecoveryChoice(choice, false)) return showRecovery("selected save was not readable");
    try { if (typeof render === "function") render(); } catch (e) { try { location.reload(); } catch (ignore) {} }
  };

  window.clearPartialLedgerStateV18334 = function () {
    var s = getState();
    try { if (partialLife(s)) localStorage.setItem("ledger_v18334_corrupt_state", JSON.stringify(s)); } catch (e) {}
    if (currentSlotIsPartial()) {
      try { localStorage.removeItem(slotKeyFor(activeSlotIndex())); } catch (e2) {}
    }
    setState(null);
    try { tab = "lifehub"; introMode = "main"; } catch (e3) {}
    try { if (typeof render === "function") render(); } catch (e4) { try { location.reload(); } catch (ignore) {} }
  };

  window.recoverLedgerSlotV18332 = window.recoverLedgerSlotV18334;
  window.clearPartialLedgerStateV18332 = window.clearPartialLedgerStateV18334;
  try {
    recoverLedgerSlotV18332 = window.recoverLedgerSlotV18332;
    clearPartialLedgerStateV18332 = window.clearPartialLedgerStateV18332;
  } catch (e) {}

  function storePartialStartup(reason) {
    var s = getState();
    if (!partialLife(s)) return false;
    try {
      localStorage.setItem("ledger_v18337_startup_partial_state", JSON.stringify({
        at: Date.now(),
        reason: reason || "startup",
        state: s
      }));
    } catch (e) {}
    setState(null);
    try { tab = "life"; introMode = "main"; } catch (e2) {}
    return true;
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
      if (partialLife(getState())) {
        if (autoRecoverActive()) return previousRender.apply(this, arguments);
        showRecovery("partial state cannot be rendered as a life");
        return;
      }
      return previousRender.apply(this, arguments);
    };
    window.render.__ledger1835BootGuard = true;
    try { render = window.render; } catch (e) {}
  }

  var previousDeath = window.renderDeath || (typeof renderDeath === "function" ? renderDeath : null);
  if (typeof previousDeath === "function" && !previousDeath.__ledger1835RecoveryGuard) {
    window.renderDeath = function () {
      var s = getState();
      if (partialLife(s) || (s && !validLife(s))) {
        showRecovery("death screen blocked missing name/age/cause");
        return;
      }
      var result = previousDeath.apply(this, arguments);
      try {
        var html = app() ? app().innerHTML : "";
        if (/undefined|NaN/.test(html)) showRecovery("death screen contained undefined values");
      } catch (e) {}
      return result;
    };
    window.renderDeath.__ledger1835RecoveryGuard = true;
    try { renderDeath = window.renderDeath; } catch (e2) {}
  }

  var previousSave = window.save || (typeof save === "function" ? save : null);
  if (typeof previousSave === "function" && !previousSave.__ledger1835RecoveryGuard) {
    window.save = function () {
      if (partialLife(getState())) {
        try { localStorage.setItem("ledger_v1835_blocked_bad_save", JSON.stringify(getState())); } catch (e) {}
        return false;
      }
      return previousSave.apply(this, arguments);
    };
    window.save.__ledger1835RecoveryGuard = true;
    try { save = window.save; } catch (e3) {}
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

  storePartialStartup("startup before splash/menu");

  var previousEnter = window.enterFromSplash || (typeof enterFromSplash === "function" ? enterFromSplash : null);
  window.enterFromSplash = function () {
    storePartialStartup("splash enter");
    try {
      if (Array.isArray(splashTimers)) {
        splashTimers.forEach(function (timer) {
          try { clearInterval(timer); clearTimeout(timer); } catch (e) {}
        });
        splashTimers = [];
      }
    } catch (e2) {}
    function openStack() {
      try { splashShown = true; introMode = "main"; tab = "life"; } catch (e3) {}
      setState(null);
      try { if (typeof render === "function") render(); } catch (e4) {
        if (typeof previousEnter === "function") return previousEnter.apply(window, arguments);
      }
    }
    var root = null;
    try { root = document.getElementById("splash-root"); } catch (e5) {}
    if (root) {
      try { root.classList.add("fading"); } catch (e6) {}
      setTimeout(openStack, 180);
    } else {
      openStack();
    }
  };
  window.enterFromSplash.__ledger18337Wrapped = true;
  try { enterFromSplash = window.enterFromSplash; } catch (e7) {}

  document.addEventListener("keydown", function (event) {
    if (!event || event.key !== "Enter") return;
    if (getState()) return;
    var target = event.target || {};
    var tag = String(target.tagName || "").toLowerCase();
    var id = String(target.id || "");
    var inBuilder = id === "name" || id === "city" || id.indexOf("sb-") === 0 || tag === "select" || tag === "input";
    if (inBuilder) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  try {
    var style = document.createElement("style");
    style.textContent = ".v1835-boot-return{border-color:rgba(126,160,172,.44)!important;background:linear-gradient(135deg,rgba(22,38,42,.96),rgba(35,28,22,.96))!important}.v18334-recovery{border-color:rgba(233,146,125,.55)!important;background:linear-gradient(135deg,rgba(56,25,22,.96),rgba(29,25,20,.98))!important}.v18334-recover-choice{display:block;width:100%;text-align:left;margin-top:8px}.v18334-recover-choice b{display:block;color:var(--ink)}.v18334-recover-choice span{display:block;font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--dim);margin-top:4px}";
    document.head.appendChild(style);
  } catch (e4) {}

  finishPlayBoot();
})();
