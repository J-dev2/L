/* Play boot command reader. Loaded before the legacy runtime. */
(function () {
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

  window.__ledgerPlayBoot = {
    action: action,
    slot: params.has("slot") ? slotFrom(params.get("slot")) : null,
    hub: String(params.get("hub") || "").toLowerCase(),
    fromLanding: params.get("from") === "landing",
    missingCommand: !action
  };
  applyStylePrefs();
})();
