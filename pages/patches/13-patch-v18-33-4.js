/* LEDGER PATCH v18.33.4: recovery screen unstick + active-slot-first restore */
(function () {
  if (window.__ledgerPatch18334RecoveryUnstick) return;
  window.__ledgerPatch18334RecoveryUnstick = true;

  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (ch) {
      return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[ch];
    });
  }
  function app() { return document.getElementById("app"); }
  function getState() {
    try { if (typeof state !== "undefined") return state; } catch(e) {}
    try { return window.state; } catch(e2) {}
    return null;
  }
  function setState(next) {
    try { state = next; } catch(e) {}
    try { window.state = next; } catch(e2) {}
    return next;
  }
  function activeSlotIndex() {
    try {
      var direct = Number(activeSlot);
      if (Number.isFinite(direct) && direct >= 1) return Math.round(direct);
    } catch(e) {}
    try {
      var stored = Number(localStorage.getItem("ledger-active-slot") || 1);
      return Number.isFinite(stored) && stored >= 1 ? Math.round(stored) : 1;
    } catch(e2) { return 1; }
  }
  function keyForSlot(idx) {
    try { if (typeof slotKey === "function") return slotKey(idx); } catch(e) {}
    return "ledger-life-slot-" + idx;
  }
  function parse(raw) {
    try { return raw ? JSON.parse(raw) : null; } catch(e) { return null; }
  }
  function validLife(s) {
    var name = s && typeof s.name === "string" ? s.name.trim() : "";
    var age = Number(s && s.age);
    return !!(s && typeof s === "object" && name && name !== "undefined" && name !== "null" && Number.isFinite(age) && age >= 0 && age < 130 && (s.alive === true || s.alive === false));
  }
  function partialLife(s) {
    if (!s || typeof s !== "object") return false;
    if (validLife(s)) return false;
    if (s.alive !== true) return true;
    if (!s.name || !Number.isFinite(Number(s.age))) return true;
    return false;
  }
  function normalize(s) {
    if (!validLife(s)) return s;
    if (!s.stats || typeof s.stats !== "object" || Array.isArray(s.stats)) s.stats = {};
    if (!s.finance || typeof s.finance !== "object" || Array.isArray(s.finance)) s.finance = {};
    if (!s.finance.debts || typeof s.finance.debts !== "object" || Array.isArray(s.finance.debts)) s.finance.debts = {};
    if (!s.finance.incomeSources || typeof s.finance.incomeSources !== "object" || Array.isArray(s.finance.incomeSources)) s.finance.incomeSources = {};
    if (!s.relationships || typeof s.relationships !== "object" || Array.isArray(s.relationships)) s.relationships = {};
    if (!s.legacy || typeof s.legacy !== "object" || Array.isArray(s.legacy)) s.legacy = { generation:1 };
    if (!Array.isArray(s.log)) s.log = [];
    if (!Array.isArray(s.inventory)) s.inventory = [];
    if (!Array.isArray(s.timeSnapshotsV1814)) s.timeSnapshotsV1814 = [];
    if (!Number.isFinite(Number(s.money))) s.money = 0;
    if (!Number.isFinite(Number(s.savings))) s.savings = 0;
    return s;
  }
  function readSave(label, key, slot, priority) {
    var data = null;
    try { data = parse(localStorage.getItem(key)); } catch(e) {}
    if (data && data.state && typeof data.state === "object") data = data.state;
    if (!validLife(data)) return null;
    return { label:label, key:key, slot:slot || null, priority:priority || 0, state:normalize(data) };
  }
  function recoveryChoices() {
    var active = activeSlotIndex();
    var out = [], seen = {};
    function push(c) {
      if (!c) return;
      var id = String(c.key || "") + "|" + String(c.state.name || "") + "|" + String(c.state.age);
      if (seen[id]) return;
      seen[id] = true;
      out.push(c);
    }
    push(readSave("active slot " + active, keyForSlot(active), active, 10000));
    push(readSave("active backup slot " + active, "ledger-v1826-backup-slot-" + active, active, 9000));
    push(readSave("last good backup", "ledger_v1832_last_good_state", active, 8000));
    for (var i = 1; i <= 5; i++) {
      push(readSave("slot " + i, keyForSlot(i), i, i === active ? 7000 : 1000 - i));
      push(readSave("backup slot " + i, "ledger-v1826-backup-slot-" + i, i, i === active ? 6000 : 500 - i));
    }
    out.sort(function (a, b) { return (b.priority || 0) - (a.priority || 0); });
    return out;
  }
  function loadChoice(choice, silent) {
    if (!choice || !validLife(choice.state)) return false;
    var next = normalize(JSON.parse(JSON.stringify(choice.state)));
    setState(next);
    if (choice.slot) {
      try { activeSlot = choice.slot; } catch(e) {}
      try { localStorage.setItem("ledger-active-slot", String(choice.slot)); } catch(e2) {}
      try { localStorage.setItem(keyForSlot(choice.slot), JSON.stringify(next)); } catch(e3) {}
    }
    try { if (typeof ensureStateShape === "function") ensureStateShape(); } catch(e4) {}
    try { if (typeof save === "function") save(); } catch(e5) {}
    if (!silent) {
      try { if (typeof addToast === "function") addToast("Loaded " + (next.name || "life") + " from " + choice.label + "."); } catch(e6) {}
    }
    return true;
  }
  function currentSlotIsPartial() {
    var idx = activeSlotIndex(), raw = null, parsed = null;
    try { raw = localStorage.getItem(keyForSlot(idx)); } catch(e) {}
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
    var rows = choices.length ? choices.map(function (c, idx) {
      var s = c.state || {};
      var activeTag = c.slot === active ? " · ACTIVE" : "";
      return '<button class="secondary v18334-recover-choice" onclick="event.preventDefault();event.stopPropagation();recoverLedgerSlotV18334(' + idx + ')"><b>' + esc(s.name || "Unnamed life") + '</b><span>Age ' + esc(s.age) + ' · ' + esc(c.label) + activeTag + '</span></button>';
    }).join("") : '<div class="row-sub">No readable saves were found. Return to Start will clear only the broken in-memory state.</div>';
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
    var activeChoice = readSave("active slot " + active, keyForSlot(active), active, 10000);
    if (activeChoice && loadChoice(activeChoice, true)) return true;
    var backup = readSave("active backup slot " + active, "ledger-v1826-backup-slot-" + active, active, 9000);
    if (backup && loadChoice(backup, true)) return true;
    return false;
  }

  window.recoverLedgerSlotV18334 = function (idx) {
    var choices = window.__ledgerRecoverChoicesV18334 || recoveryChoices();
    var c = choices[Math.max(0, Math.round(Number(idx) || 0))];
    if (!loadChoice(c, false)) return showRecovery("selected save was not readable");
    try { if (typeof render === "function") render(); } catch(e) { try { location.reload(); } catch(ignore) {} }
  };
  window.clearPartialLedgerStateV18334 = function () {
    var s = getState();
    try { if (partialLife(s)) localStorage.setItem("ledger_v18334_corrupt_state", JSON.stringify(s)); } catch(e) {}
    if (currentSlotIsPartial()) {
      try { localStorage.removeItem(keyForSlot(activeSlotIndex())); } catch(e2) {}
    }
    setState(null);
    try { tab = "lifehub"; introMode = "main"; } catch(e3) {}
    try { if (typeof render === "function") render(); } catch(e4) { try { location.reload(); } catch(ignore) {} }
  };
  window.recoverLedgerSlotV18332 = window.recoverLedgerSlotV18334;
  window.clearPartialLedgerStateV18332 = window.clearPartialLedgerStateV18334;
  try { recoverLedgerSlotV18332 = window.recoverLedgerSlotV18332; clearPartialLedgerStateV18332 = window.clearPartialLedgerStateV18332; } catch(e) {}

  var previousRender = window.render || (typeof render === "function" ? render : null);
  if (typeof previousRender === "function" && !previousRender.__ledger18334Wrapped) {
    var fixedRender = function () {
      if (partialLife(getState())) {
        if (autoRecoverActive()) return previousRender.apply(this, arguments);
        showRecovery("partial state cannot be rendered as a life");
        return;
      }
      return previousRender.apply(this, arguments);
    };
    fixedRender.__ledger18334Wrapped = true;
    window.render = fixedRender;
    try { render = fixedRender; } catch(e) {}
  }

  try {
    var style = document.createElement("style");
    style.textContent = ".v18334-recovery{border-color:rgba(233,146,125,.55)!important;background:linear-gradient(135deg,rgba(56,25,22,.96),rgba(29,25,20,.98))!important}.v18334-recover-choice{display:block;width:100%;text-align:left;margin-top:8px}.v18334-recover-choice b{display:block;color:var(--ink)}.v18334-recover-choice span{display:block;font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--dim);margin-top:4px}";
    document.head.appendChild(style);
  } catch(e) {}

  setTimeout(function () {
    if (partialLife(getState())) {
      if (autoRecoverActive()) { try { if (typeof render === "function") render(); } catch(e) {} }
      else showRecovery("partial state found on load");
    }
  }, 0);
})();

