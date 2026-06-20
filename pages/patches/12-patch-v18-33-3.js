/* LEDGER PATCH v18.33.3: preserve Wayback restore after v18.33 import */
(function () {
  if (window.__ledgerV18333WaybackLoaded) return;
  window.__ledgerV18333WaybackLoaded = true;

  function esc18333(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (ch) {
      return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[ch];
    });
  }
  function num18333(v, fallback) {
    var n = Number(v);
    return Number.isFinite(n) ? n : (fallback || 0);
  }
  function money18333(v) {
    try { if (typeof money === "function") return money(Math.round(num18333(v))); } catch(e) {}
    var n = Math.round(num18333(v));
    var sign = n < 0 ? "-" : "";
    n = Math.abs(n);
    if (n >= 1e12) return sign + "$" + (n / 1e12).toFixed(1).replace(/\.0$/, "") + "T";
    if (n >= 1e9) return sign + "$" + (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
    if (n >= 1e6) return sign + "$" + (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1e4) return sign + "$" + Math.round(n / 1000) + "K";
    return sign + "$" + n.toLocaleString();
  }
  function toast18333(msg) {
    try { if (typeof addToast === "function") return addToast(msg); } catch(e) {}
    try { if (typeof addLog === "function") return addLog(msg); } catch(e) {}
  }
  function log18333(msg, deltas) {
    try { if (typeof addLog === "function") return addLog(msg, deltas || {}); } catch(e) {}
  }
  function copy18333(obj) {
    try { if (typeof structuredClone === "function") return structuredClone(obj); } catch(e) {}
    try { return JSON.parse(JSON.stringify(obj)); } catch(e) { return null; }
  }
  function slotKey18333(idx) {
    try { if (typeof slotKey === "function") return slotKey(idx); } catch(e) {}
    return "ledger-life-slot-" + idx;
  }
  function activeSlot18333() {
    var idx = 1;
    try { idx = Number(activeSlot) || 1; } catch(e) {}
    return Math.max(1, Math.min(Number(window.NUM_SLOTS || 5) || 5, Math.round(idx)));
  }
  function syncState18333(s) {
    if (!s) return null;
    window.state = s;
    try { state = s; } catch(e) {}
    try { if (typeof ensureStateShape === "function") ensureStateShape(); } catch(e) {}
    if (!Array.isArray(s.timeSnapshotsV1814)) s.timeSnapshotsV1814 = [];
    if (!s.saveHealthV1826) s.saveHealthV1826 = { backups:0, repairs:0, lastBackupAt:0 };
    return s;
  }
  function ensure18333() {
    var s = null;
    try { s = window.state || state; } catch(e) { s = window.state; }
    if (!s) return null;
    syncState18333(s);
    return s;
  }
  function saveSlot18333(idx, s) {
    idx = Math.max(1, Math.min(Number(window.NUM_SLOTS || 5) || 5, Math.round(num18333(idx, activeSlot18333()))));
    s = syncState18333(s || ensure18333());
    if (!s) return false;
    try { localStorage.setItem(slotKey18333(idx), JSON.stringify(s)); } catch(e) { return false; }
    try { localStorage.setItem("ledger-active-slot", String(idx)); } catch(e) {}
    try { activeSlot = idx; } catch(e) {}
    return true;
  }
  function render18333() {
    try { if (typeof render === "function") render(); } catch(e) {}
  }
  function netWorth18333(s) {
    s = s || {};
    try { if (typeof legacyNetWorth === "function") return legacyNetWorth(s); } catch(e) {}
    var f = s.finance || {};
    return Math.round(num18333(s.money) + num18333(s.savings) + num18333(s.ira) + num18333(s.retirement401k) + num18333(f.managedPortfolio) + num18333(f.brokerageCash) - num18333(s.debt) - num18333(f.taxDebt));
  }
  function snapshot18333(s) {
    s = s || ensure18333();
    if (!s) return null;
    var snap = copy18333(s);
    if (!snap) return null;
    delete snap.pending;
    delete snap.activeModal;
    delete snap.timeSnapshotsV1814;
    return snap;
  }
  function label18333(item, fallback) {
    return item && (item.label || item.reason || item.name) || fallback || "Checkpoint";
  }
  function sortedSnapshots18333(s) {
    s = s || ensure18333();
    var snaps = Array.isArray(s && s.timeSnapshotsV1814) ? s.timeSnapshotsV1814 : [];
    return snaps.map(function (item, idx) { return Object.assign({ __idx:idx }, item || {}); }).reverse();
  }

  window.createWaybackCheckpointV18333 = function (label) {
    var s = ensure18333();
    if (!s) return toast18333("Open a life before saving a Wayback checkpoint.");
    var snap = snapshot18333(s);
    if (!snap) return toast18333("Could not create a Wayback checkpoint.");
    s.timeSnapshotsV1814.push({
      id: Date.now(),
      age: s.age || 0,
      at: Date.now(),
      label: label || "Manual checkpoint",
      netWorth: netWorth18333(s),
      state: snap
    });
    s.timeSnapshotsV1814 = s.timeSnapshotsV1814.slice(-18);
    log18333("Saved Wayback checkpoint at age " + (s.age || 0) + ".", {});
    saveSlot18333(activeSlot18333(), s);
    render18333();
  };

  window.restoreWaybackIndexV18333 = function (displayIndex) {
    var current = ensure18333();
    if (!current) return toast18333("Open a life before restoring a Wayback checkpoint.");
    var shown = sortedSnapshots18333(current);
    var shownItem = shown[Math.round(num18333(displayIndex))];
    if (!shownItem || shownItem.__idx == null) return toast18333("That Wayback checkpoint is not readable.");
    var originalIndex = shownItem.__idx;
    var item = current.timeSnapshotsV1814[originalIndex];
    var restored = copy18333(item && item.state);
    if (!restored) return toast18333("That Wayback checkpoint is damaged.");
    restored.timeSnapshotsV1814 = current.timeSnapshotsV1814.slice(0, originalIndex).concat(current.timeSnapshotsV1814.slice(originalIndex + 1));
    syncState18333(restored);
    saveSlot18333(activeSlot18333(), restored);
    toast18333("Wayback restored this life to age " + (restored.age == null ? "?" : restored.age) + ".");
    render18333();
  };

  window.deleteWaybackIndexV18333 = function (displayIndex) {
    var s = ensure18333();
    if (!s) return;
    var shown = sortedSnapshots18333(s);
    var item = shown[Math.round(num18333(displayIndex))];
    if (!item || item.__idx == null) return;
    s.timeSnapshotsV1814.splice(item.__idx, 1);
    saveSlot18333(activeSlot18333(), s);
    render18333();
  };

  window.waybackLifeSlotV18333 = function (idx) {
    idx = Math.max(1, Math.min(Number(window.NUM_SLOTS || 5) || 5, Math.round(num18333(idx, activeSlot18333()))));
    var raw = null;
    try { raw = localStorage.getItem(slotKey18333(idx)); } catch(e) {}
    if (!raw) return toast18333("No saved life in slot " + idx + ".");
    var saved = null;
    try { saved = JSON.parse(raw); } catch(e) {}
    if (!saved) return toast18333("Slot " + idx + " could not be read.");
    var snaps = Array.isArray(saved.timeSnapshotsV1814) ? saved.timeSnapshotsV1814 : [];
    if (!snaps.length) {
      var fresh = snapshot18333(saved);
      if (fresh) {
        saved.timeSnapshotsV1814 = [{
          id: Date.now(),
          age: saved.age || 0,
          at: Date.now(),
          label: "Starting checkpoint",
          netWorth: netWorth18333(saved),
          state: fresh
        }];
        try { localStorage.setItem(slotKey18333(idx), JSON.stringify(saved)); } catch(e) {}
      }
      return toast18333("Slot " + idx + " has no older checkpoint yet. I saved one for next time.");
    }
    var item = snaps[snaps.length - 1];
    var restored = copy18333(item && item.state);
    if (!restored) return toast18333("The latest checkpoint in slot " + idx + " is damaged.");
    restored.timeSnapshotsV1814 = snaps.slice(0, -1);
    syncState18333(restored);
    saveSlot18333(idx, restored);
    toast18333("Wayback restored slot " + idx + " to age " + (restored.age == null ? "?" : restored.age) + ".");
    render18333();
  };

  window.createWaybackCheckpointV1826 = window.createWaybackCheckpointV18333;
  window.restoreWaybackIndexV1826 = window.restoreWaybackIndexV18333;
  window.deleteWaybackIndexV1826 = window.deleteWaybackIndexV18333;
  window.createWaybackCheckpointV1823 = window.createWaybackCheckpointV18333;
  window.waybackLifeSlotV1823 = window.waybackLifeSlotV18333;
  window.waybackLifeSlotV1820 = window.waybackLifeSlotV18333;
  try {
    createWaybackCheckpointV1826 = window.createWaybackCheckpointV1826;
    restoreWaybackIndexV1826 = window.restoreWaybackIndexV1826;
    deleteWaybackIndexV1826 = window.deleteWaybackIndexV1826;
    createWaybackCheckpointV1823 = window.createWaybackCheckpointV1823;
    waybackLifeSlotV1823 = window.waybackLifeSlotV1823;
    waybackLifeSlotV1820 = window.waybackLifeSlotV1820;
  } catch(e) {}

  function waybackPanel18333() {
    var s = ensure18333();
    var rows = "";
    var count = 0;
    if (s) {
      var shown = sortedSnapshots18333(s);
      count = shown.length;
      rows = shown.length ? shown.map(function (item, displayIdx) {
        var age = item.age == null ? "?" : item.age;
        var when = item.at ? new Date(item.at).toLocaleString() : "saved";
        var net = item.netWorth ? " · net " + money18333(item.netWorth) : "";
        return '<div class="v18333-wayback-row"><div><b>' + esc18333(label18333(item, "Checkpoint")) + '</b><span>Age ' + esc18333(age) + ' · ' + esc18333(when) + esc18333(net) + '</span></div><div class="v18333-wayback-actions"><button class="money-btn gold" onclick="event.preventDefault();event.stopPropagation();restoreWaybackIndexV18333(' + displayIdx + ')">Restore</button><button class="money-btn red" onclick="event.preventDefault();event.stopPropagation();deleteWaybackIndexV18333(' + displayIdx + ')">Delete</button></div></div>';
      }).join("") : '<div class="v18333-wayback-empty">No checkpoints yet. Hit Save Checkpoint before risky choices, or age up once to create an automatic rewind point.</div>';
    } else {
      rows = '<div class="v18333-wayback-empty">Open or continue a life to use Wayback.</div>';
    }
    return '<section class="money-section v18333-wayback"><div class="money-section-title">Wayback Machine <span>' + count + ' checkpoints</span></div><div class="money-row"><div><div class="money-row-title">Restore this life from a checkpoint</div><div class="money-row-sub">Newest checkpoints show first. Restore updates the active slot immediately, so the age and money should change right away.</div></div><div class="bank-actions-row"><button class="money-btn green" onclick="event.preventDefault();event.stopPropagation();createWaybackCheckpointV18333(\'Manual checkpoint\')" ' + (!s ? "disabled" : "") + '>Save Checkpoint</button><button class="money-btn gold" onclick="event.preventDefault();event.stopPropagation();waybackLifeSlotV18333(activeSlot)" ' + (!count ? "disabled" : "") + '>Restore Latest</button></div></div><div class="v18333-wayback-list">' + rows + '</div></section>';
  }
  function removeWaybackSections18333(html) {
    html = String(html || "");
    ["v18333-wayback", "v1826-wayback", "v1823-wayback-card", "v1821-wayback-more"].forEach(function (cls) {
      var idx = html.indexOf(cls);
      var guard = 0;
      while (idx >= 0 && guard++ < 20) {
        var start = html.lastIndexOf("<section", idx);
        var end = html.indexOf("</section>", idx);
        if (start < 0 || end < 0 || end <= start) break;
        html = html.slice(0, start) + html.slice(end + 10);
        idx = html.indexOf(cls);
      }
    });
    return html;
  }

  var prevRenderHub18333 = window.renderHubContent || (typeof renderHubContent === "function" ? renderHubContent : null);
  if (prevRenderHub18333 && !window.__ledgerRenderHub18333Wrapped) {
    window.__ledgerRenderHub18333Wrapped = true;
    window.renderHubContent = function (hubId) {
      var html = "";
      try { html = prevRenderHub18333.apply(this, arguments) || ""; } catch(e) { html = ""; }
      html = removeWaybackSections18333(html);
      if (hubId === "more" || hubId === "lifehub") html = waybackPanel18333() + html;
      return html;
    };
    try { renderHubContent = window.renderHubContent; } catch(e) {}
  }

  var prevRenderLife18333 = window.renderLifeHub || (typeof renderLifeHub === "function" ? renderLifeHub : null);
  if (prevRenderLife18333 && !window.__ledgerRenderLife18333Wrapped) {
    window.__ledgerRenderLife18333Wrapped = true;
    window.renderLifeHub = function () {
      var html = "";
      try { html = prevRenderLife18333.apply(this, arguments) || ""; } catch(e) { html = ""; }
      html = removeWaybackSections18333(html);
      return waybackPanel18333() + html;
    };
    try { renderLifeHub = window.renderLifeHub; } catch(e) {}
  }

  function injectStyle18333() {
    if (document.getElementById("ledger-v18333-wayback-style")) return;
    var style = document.createElement("style");
    style.id = "ledger-v18333-wayback-style";
    style.textContent = [
      ".v18333-wayback{border-color:rgba(146,130,220,.48)!important;background:linear-gradient(135deg,rgba(33,29,54,.97),rgba(23,28,29,.98))!important;overflow:hidden!important}",
      ".v18333-wayback-list{display:grid;gap:8px;margin-top:10px}.v18333-wayback-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;border:1px solid rgba(255,255,255,.10);border-radius:12px;background:rgba(255,255,255,.045);padding:10px;min-width:0}.v18333-wayback-row b{display:block;color:#fff3df;overflow-wrap:anywhere}.v18333-wayback-row span{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.4;margin-top:3px}.v18333-wayback-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.v18333-wayback-actions .money-btn{min-width:82px}.v18333-wayback-empty{border:1px dashed rgba(255,255,255,.14);border-radius:12px;padding:11px;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.45;background:rgba(0,0,0,.12)}",
      "@media(max-width:760px){.v18333-wayback-row{grid-template-columns:1fr}.v18333-wayback-actions .money-btn{flex:1 1 42%}}"
    ].join("\n");
    document.head.appendChild(style);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", injectStyle18333); else injectStyle18333();
})();

