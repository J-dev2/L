/* LEDGER PATCH v18.33.2: Law Office overlay + cautious recovery hotfix
   - Prevents partial/blank state from auto-recovering into a random slot.
   - Restores Law Office to the standard hub overlay/navigation path instead of the old v18.31 special overlay.
*/
(function () {
  if (window.__ledgerPatch18332LawRecovery) return;
  window.__ledgerPatch18332LawRecovery = true;
  var PATCH_ID = "v18.33.2";

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[ch];
    });
  }
  function n(value, fallback) {
    var x = Number(value);
    return Number.isFinite(x) ? x : (fallback || 0);
  }
  function app() { return document.getElementById("app"); }
  function getState() {
    try { if (typeof state !== "undefined") return state; } catch (e) {}
    try { return window.state; } catch (e2) {}
    return null;
  }
  function setState(next) {
    try { state = next; } catch (e) {}
    try { window.state = next; } catch (e2) {}
    return next;
  }
  function activeSlotIndex() {
    try { if (Number.isFinite(Number(activeSlot))) return Number(activeSlot); } catch (e) {}
    try {
      var raw = localStorage.getItem("ledger-active-slot");
      var idx = Number(raw || 1);
      return Number.isFinite(idx) && idx >= 1 ? idx : 1;
    } catch (e2) { return 1; }
  }
  function slotKey(idx) {
    try { if (typeof window.slotKey === "function") return window.slotKey(idx); } catch (e) {}
    try { if (typeof slotKey === "function") return slotKey(idx); } catch (e2) {}
    return "ledger-life-slot-" + idx;
  }
  function parse(raw) {
    try { return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  function validName(s) {
    var name = s && typeof s.name === "string" ? s.name.trim() : "";
    return !!name && name !== "undefined" && name !== "null" && name !== "NaN";
  }
  function validAge(s) {
    var age = Number(s && s.age);
    return Number.isFinite(age) && age >= 0 && age < 130;
  }
  function validLife(s) {
    return !!(s && typeof s === "object" && validName(s) && validAge(s) && (s.alive === true || s.alive === false));
  }
  function partialLife(s) {
    if (!s || typeof s !== "object") return false;
    if (validLife(s)) return false;
    // Original bug: missing alive/name/age got rendered as a dead person.
    if (s.alive !== true) return true;
    if (!validName(s) || !validAge(s)) return true;
    return false;
  }
  function normalizeLife(s) {
    if (!validLife(s)) return s;
    if (!s.stats || typeof s.stats !== "object" || Array.isArray(s.stats)) s.stats = {};
    if (!s.flags || typeof s.flags !== "object" || Array.isArray(s.flags)) s.flags = {};
    if (!s.relationships || typeof s.relationships !== "object" || Array.isArray(s.relationships)) s.relationships = {};
    if (!s.legacy || typeof s.legacy !== "object" || Array.isArray(s.legacy)) s.legacy = { generation: 1 };
    if (!Number.isFinite(Number(s.legacy.generation))) s.legacy.generation = 1;
    if (!Array.isArray(s.log)) s.log = [];
    if (!Array.isArray(s.inventory)) s.inventory = [];
    if (!Array.isArray(s.assets)) s.assets = [];
    if (!Array.isArray(s.rentals)) s.rentals = [];
    if (!s.finance || typeof s.finance !== "object" || Array.isArray(s.finance)) s.finance = {};
    if (!s.finance.debts || typeof s.finance.debts !== "object" || Array.isArray(s.finance.debts)) s.finance.debts = {};
    if (!s.finance.incomeSources || typeof s.finance.incomeSources !== "object" || Array.isArray(s.finance.incomeSources)) s.finance.incomeSources = {};
    if (!Number.isFinite(Number(s.money))) s.money = 0;
    if (!Number.isFinite(Number(s.savings))) s.savings = 0;
    if (!Number.isFinite(Number(s.fame))) s.fame = 0;
    if (s.alive === false && !s.cause) s.cause = "natural causes";
    return s;
  }
  function readLife(label, key, slot) {
    var data = null;
    try { data = parse(localStorage.getItem(key)); } catch (e) {}
    if (!data) return null;
    if (data.state && typeof data.state === "object") data = data.state;
    if (!validLife(data)) return null;
    return { label: label, key: key, slot: slot || null, state: normalizeLife(data) };
  }
  function activeCandidateOnly() {
    var idx = activeSlotIndex();
    return readLife("active slot " + idx, slotKey(idx), idx) ||
      readLife("active-slot backup", "ledger-v1826-backup-slot-" + idx, idx) ||
      readLife("last good backup", "ledger_v1832_last_good_state", idx);
  }
  function readableSlotList() {
    var list = [];
    var active = activeSlotIndex();
    var seen = {};
    function push(c) {
      if (!c || !c.state) return;
      var id = (c.key || c.label || "") + "|" + (c.state.name || "") + "|" + c.state.age;
      if (seen[id]) return;
      seen[id] = true;
      list.push(c);
    }
    push(activeCandidateOnly());
    try {
      for (var i = 1; i <= 5; i++) {
        push(readLife("slot " + i, slotKey(i), i));
        push(readLife("backup slot " + i, "ledger-v1826-backup-slot-" + i, i));
      }
      push(readLife("v18.32 last good backup", "ledger_v1832_last_good_state", null));
    } catch (e) {}
    list.sort(function (a, b) {
      var aw = (a.slot === active ? 10000 : 0) + (a.state.alive === true ? 1000 : 0) + n(a.state.age);
      var bw = (b.slot === active ? 10000 : 0) + (b.state.alive === true ? 1000 : 0) + n(b.state.age);
      return bw - aw;
    });
    return list;
  }
  function showCautiousRecovery(reason) {
    var el = app();
    if (!el) return;
    var list = readableSlotList();
    var active = activeSlotIndex();
    var rows = list.length ? list.map(function (c, idx) {
      var s = c.state || {};
      return '<button class="secondary v18332-recover-choice" onclick="recoverLedgerSlotV18332(' + idx + ')" style="text-align:left;margin-top:8px">' +
        '<b>' + esc(s.name) + '</b><br><span>Age ' + esc(s.age) + ' · ' + esc(c.label) + (c.slot === active ? ' · ACTIVE' : '') + '</span></button>';
    }).join("") : '<div class="cause">No readable life save was found. Start a clean new life to continue.</div>';
    try { window.__ledgerRecoverChoicesV18332 = list; } catch (e) {}
    el.innerHTML = '<div class="masthead"><div class="title">The Ledger</div><div class="vol">Recovery</div></div>' +
      '<section class="panel v18332-recovery"><div class="section-label">Save Recovery</div>' +
      '<div class="row-title">The game blocked the undefined death-screen bug.</div>' +
      '<div class="row-sub">It did not auto-pick a random save. Choose the save you actually want, or return to the start screen.</div>' +
      (reason ? '<div class="row-sub">Reason: ' + esc(reason) + '</div>' : '') +
      '<div class="row-sub">Active slot: ' + esc(active) + '</div>' + rows +
      '<div class="mini-actions" style="justify-content:flex-start;margin-top:12px;gap:8px"><button class="secondary" style="width:auto;margin-top:0;padding:12px 16px" onclick="clearPartialLedgerStateV18332()">Return To Start</button></div>' +
      '</section>';
  }
  window.recoverLedgerSlotV18332 = function (idx) {
    var list = window.__ledgerRecoverChoicesV18332 || [];
    var c = list[idx];
    if (!c || !validLife(c.state)) return showCautiousRecovery("selected save was not readable");
    setState(normalizeLife(c.state));
    try { if (c.slot) activeSlot = c.slot; } catch (e) {}
    try { if (c.slot) localStorage.setItem("ledger-active-slot", String(c.slot)); } catch (e2) {}
    try { if (typeof window.migrateLedgerStateV1832 === "function") window.migrateLedgerStateV1832(); } catch (e3) {}
    try { if (typeof save === "function") save(); } catch (e4) {}
    try { if (typeof render === "function") render(); } catch (e5) { location.reload(); }
  };
  window.clearPartialLedgerStateV18332 = function () {
    var s = getState();
    try { if (partialLife(s)) localStorage.setItem("ledger_v18332_corrupt_state", JSON.stringify(s)); } catch (e) {}
    setState(null);
    try { tab = "lifehub"; introMode = "main"; } catch (e2) {}
    try { if (typeof render === "function") render(); } catch (e3) { location.reload(); }
  };

  var previousRender = window.render || (typeof render === "function" ? render : null);
  if (typeof previousRender === "function" && !previousRender.__ledger18332Wrapped) {
    var guardedRender = function () {
      var s = getState();
      if (partialLife(s)) {
        showCautiousRecovery("partial state cannot be rendered as a life");
        return;
      }
      return previousRender.apply(this, arguments);
    };
    guardedRender.__ledger18332Wrapped = true;
    window.render = guardedRender;
    try { render = guardedRender; } catch (e) {}
  }

  var previousDeath = window.renderDeath || (typeof renderDeath === "function" ? renderDeath : null);
  if (typeof previousDeath === "function" && !previousDeath.__ledger18332Wrapped) {
    var guardedDeath = function () {
      var s = getState();
      if (partialLife(s) || !validLife(s)) {
        showCautiousRecovery("death screen blocked missing name/age/cause");
        return;
      }
      var result = previousDeath.apply(this, arguments);
      try {
        var html = app() ? app().innerHTML : "";
        if (/undefined|NaN/.test(html)) showCautiousRecovery("death screen contained undefined values");
      } catch (e) {}
      return result;
    };
    guardedDeath.__ledger18332Wrapped = true;
    window.renderDeath = guardedDeath;
    try { renderDeath = guardedDeath; } catch (e) {}
  }

  var previousSave = window.save || (typeof save === "function" ? save : null);
  if (typeof previousSave === "function" && !previousSave.__ledger18332Wrapped) {
    var guardedSave = function () {
      if (partialLife(getState())) {
        try { localStorage.setItem("ledger_v18332_blocked_bad_save", JSON.stringify(getState())); } catch (e) {}
        return false;
      }
      return previousSave.apply(this, arguments);
    };
    guardedSave.__ledger18332Wrapped = true;
    window.save = guardedSave;
    try { save = guardedSave; } catch (e) {}
  }

  function normHub(id) {
    id = String(id || "").toLowerCase();
    if (id === "legal" || id === "lawoffice" || id === "law-office" || id === "taxlaw") return "law";
    if (id === "stocks") return "brokerage";
    if (id === "life") return "lifehub";
    return id || "lifehub";
  }
  function titleFor(id) {
    id = normHub(id);
    var map = { lifehub:"Life", people:"People", career:"Career", school:"Education", education:"Education", finance:"Finance", money:"Money", brokerage:"Stocks", business:"Business", law:"Law Office", health:"Health", home:"Real Estate", vehicles:"Vehicles", more:"More", stats:"All Stats", tax:"Tax Office" };
    return map[id] || id.replace(/\b\w/g, function (m) { return m.toUpperCase(); });
  }
  function visibleHubs() {
    var hubs = [];
    try { hubs = typeof getVisibleHubs === "function" ? getVisibleHubs() : []; } catch (e) {}
    hubs = Array.isArray(hubs) ? hubs.slice() : [];
    var by = {}, out = [];
    hubs.forEach(function (h) {
      if (!h) return;
      var id = normHub(h.id);
      if (id === "legal") id = "law";
      if (by[id]) return;
      var copy = {};
      Object.keys(h).forEach(function (k) { copy[k] = h[k]; });
      copy.id = id;
      if (id === "law") { copy.icon = copy.icon || "⚖"; copy.label = "Law"; }
      if (id === "brokerage") { copy.icon = copy.icon || "📈"; copy.label = "Stocks"; }
      by[id] = copy;
      out.push(copy);
    });
    function add(id, icon, label, disabled) {
      if (!by[id]) { by[id] = { id:id, icon:icon, label:label, disabled:!!disabled }; out.push(by[id]); }
    }
    var s = getState() || {};
    add("brokerage", "📈", "Stocks", n(s.age) < 13);
    add("law", "⚖", "Law", n(s.age) < 13);
    add("more", "⋯", "More", false);
    var preferred = ["lifehub", "people", "career", "school", "finance", "money", "brokerage", "business", "law", "more"];
    out.sort(function (a, b) {
      var ai = preferred.indexOf(a.id), bi = preferred.indexOf(b.id);
      ai = ai < 0 ? 999 : ai; bi = bi < 0 ? 999 : bi;
      return ai - bi;
    });
    return out.slice(0, 10);
  }
  var oldGetVisibleHubs = window.getVisibleHubs || (typeof getVisibleHubs === "function" ? getVisibleHubs : null);
  if (typeof oldGetVisibleHubs === "function" && !oldGetVisibleHubs.__ledger18332Wrapped) {
    var wrappedHubs = function () { return visibleHubs(); };
    wrappedHubs.__ledger18332Wrapped = true;
    window.getVisibleHubs = wrappedHubs;
    try { getVisibleHubs = wrappedHubs; } catch (e) {}
  }

  function navStrip(active) {
    var hubs = visibleHubs();
    return '<div class="v11-hub-tab-strip v18332-tab-strip" aria-label="Hub tab wheel"><div class="v11-hub-tab-scroll">' + hubs.map(function (h) {
      var id = normHub(h.id);
      var disabled = h.disabled ? "disabled" : "";
      return '<button class="v11-tab-btn' + (id === active ? ' active' : '') + '" ' + disabled + ' onclick="event.preventDefault();event.stopPropagation();setTabV16(\'' + esc(id) + '\')"><span class="v11-tab-ico">' + esc(h.icon || "•") + '</span><span class="v11-tab-lbl">' + esc(h.label || titleFor(id)) + '</span></button>';
    }).join("") + '</div></div>';
  }
  var previousOverlay = window.renderHubOverlay || (typeof renderHubOverlay === "function" ? renderHubOverlay : null);
  if (typeof previousOverlay === "function" && !previousOverlay.__ledger18332Wrapped) {
    var overlayFix = function (hubId) {
      hubId = normHub(hubId);
      // Rebuild Law Office with the normal v16 hub shape. This bypasses the old v18.31 special Law/Estate overlay.
      if (hubId === "law" || hubId === "legal") {
        var content = "";
        try { content = typeof renderHubContent === "function" ? renderHubContent("law") : ""; } catch (e) { content = '<section class="panel"><div class="row-title">Law Office recovered</div><div class="row-sub">' + esc(e.message || e) + '</div></section>'; }
        return '<div class="hub-overlay hub-law v16-hub v18332-law-overlay" data-hub-id="law" onclick="if(event.target===this)closeHub()"><div class="hub-sheet hub-sheet-law"><div class="hub-head"><h2>Law Office</h2><button class="hub-close v16-close" onclick="event.preventDefault();event.stopPropagation();closeHub()">×</button></div><div class="v16-hub-body" data-hub-body="law">' + content + '</div>' + navStrip("law") + '</div></div>';
      }
      return previousOverlay.apply(this, [hubId]);
    };
    overlayFix.__ledger18332Wrapped = true;
    window.renderHubOverlay = overlayFix;
    try { renderHubOverlay = overlayFix; } catch (e) {}
  }

  var previousSetTab = window.setTabV16 || window.setTab || (typeof setTab === "function" ? setTab : null);
  if (typeof previousSetTab === "function" && !previousSetTab.__ledger18332Wrapped) {
    var tabFix = function (targetTab) {
      targetTab = normHub(targetTab);
      try { tab = targetTab; } catch (e) { window.tab = targetTab; }
      try { return previousSetTab.apply(this, [targetTab]); }
      catch (e2) {
        var el = app();
        if (el) el.innerHTML = (window.renderHubOverlay ? window.renderHubOverlay(targetTab) : "");
      }
    };
    tabFix.__ledger18332Wrapped = true;
    window.setTabV16 = tabFix;
    window.setTab = tabFix;
    try { setTabV16 = tabFix; setTab = tabFix; } catch (e) {}
  }

  // If the old special Law overlay is on screen, replace it with the normal hub overlay immediately.
  try {
    var overlay = document.querySelector(".hub-overlay");
    if (overlay && /Legal\s*\/\s*Estate/.test(overlay.textContent || "") && !(overlay.className || "").match(/v16-hub/)) {
      var el = app();
      if (el && window.renderHubOverlay) el.innerHTML = window.renderHubOverlay("law");
    }
  } catch (e) {}

  try {
    var style = document.createElement("style");
    style.textContent = ".v18332-recovery{border-color:rgba(233,146,125,.55)!important;background:linear-gradient(135deg,rgba(56,25,22,.96),rgba(29,25,20,.98))!important}.v18332-recover-choice b{color:var(--ink)}.v18332-recover-choice span{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--dim)}.v18332-law-overlay .hub-sheet{min-height:100vh;max-height:100vh;border-radius:0}.v18332-law-overlay .v16-hub-body{padding-bottom:92px}";
    document.head.appendChild(style);
  } catch (e) {}
})();

