/* Play boot command reader. Loaded before the legacy runtime. */
(function () {
  var SAVE_SLOT_PREFIX = "ledger-life-slot-";

  function slotFrom(raw) {
    var n = Math.round(Number(raw) || 0);
    if (!Number.isFinite(n)) n = 0;
    return Math.max(1, Math.min(5, n || 1));
  }

  function applyStylePrefs() {
    var theme = "classic";
    var density = "roomy";
    try { theme = localStorage.getItem("ledger-ui-theme") || theme; } catch (e) {}
    try { density = localStorage.getItem("ledger-ui-density") || density; } catch (e2) {}
    try {
      document.documentElement.dataset.ledgerTheme = theme;
      document.documentElement.dataset.ledgerDensity = density;
    } catch (e3) {}
  }

  var params = new URLSearchParams(window.location.search || "");
  var action = "";
  if (params.has("slot")) action = "slot";
  if (params.has("new")) action = "new";
  if (params.has("sandbox")) action = "sandbox";

  function installEarlySlotGuard() {
    if (action !== "slot") return;
    if (window.__ledgerEarlyStorageGuardV1835) return;
    try {
      var proto = Object.getPrototypeOf(localStorage);
      var originalGetItem = proto && proto.getItem;
      if (typeof originalGetItem !== "function") return;
      proto.getItem = function (key) {
        if (this === localStorage && String(key || "").indexOf(SAVE_SLOT_PREFIX) === 0) return null;
        return originalGetItem.apply(this, arguments);
      };
      window.__ledgerEarlyStorageGuardV1835 = {
        active: true,
        installedAt: Date.now(),
        reason: "Shield legacy first render from parsing save slots before recovery loads.",
        restore: function () {
          try { proto.getItem = originalGetItem; } catch (e) {}
          this.active = false;
          this.restoredAt = Date.now();
        }
      };
    } catch (e) {
      window.__ledgerEarlyStorageGuardV1835 = {
        active: false,
        failedAt: Date.now(),
        message: e && e.message || String(e)
      };
    }
  }

  window.__ledgerPlayBoot = {
    action: action,
    slot: params.has("slot") ? slotFrom(params.get("slot")) : null,
    hub: String(params.get("hub") || "").toLowerCase(),
    fromLanding: params.get("from") === "landing",
    missingCommand: !action
  };
  installEarlySlotGuard();
  applyStylePrefs();
})();
