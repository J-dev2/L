/* LEDGER PATCH v18.33.7: splash Enter opens Life Stack, not a random active save */
(function () {
  if (window.__ledgerPatch18337SplashStackGate) return;
  window.__ledgerPatch18337SplashStackGate = true;

  function state18337() {
    try { if (typeof state !== "undefined") return state; } catch (e) {}
    try { return window.state; } catch (e2) {}
    return null;
  }
  function setState18337(next) {
    try { state = next; } catch (e) {}
    try { window.state = next; } catch (e2) {}
    return next;
  }
  function validLife18337(s) {
    var name = s && typeof s.name === "string" ? s.name.trim() : "";
    var age = Number(s && s.age);
    return !!(s && typeof s === "object" && name && name !== "undefined" && name !== "null" && Number.isFinite(age) && age >= 0 && age < 130 && (s.alive === true || s.alive === false));
  }
  function partialLife18337(s) {
    if (!s || typeof s !== "object") return false;
    if (validLife18337(s)) return false;
    if (s.alive !== true) return true;
    if (!s.name || !Number.isFinite(Number(s.age))) return true;
    return false;
  }
  function storePartial18337(reason) {
    var s = state18337();
    if (!partialLife18337(s)) return false;
    try {
      localStorage.setItem("ledger_v18337_startup_partial_state", JSON.stringify({ at:Date.now(), reason:reason || "startup", state:s }));
    } catch (e) {}
    setState18337(null);
    try { tab = "life"; introMode = "main"; } catch (e2) {}
    return true;
  }

  // Run before the older v18.33.4 zero-delay recovery timer can auto-pick the active slot.
  storePartial18337("startup before splash/menu");

  var previousRender18337 = window.render || (typeof render === "function" ? render : null);
  if (typeof previousRender18337 === "function" && !previousRender18337.__ledger18337Wrapped) {
    window.render = function () {
      if (partialLife18337(state18337())) storePartial18337("render gate");
      return previousRender18337.apply(this, arguments);
    };
    window.render.__ledger18337Wrapped = true;
    try { render = window.render; } catch (e) {}
  }

  var previousEnter18337 = window.enterFromSplash || (typeof enterFromSplash === "function" ? enterFromSplash : null);
  window.enterFromSplash = function () {
    storePartial18337("splash enter");
    try {
      if (Array.isArray(splashTimers)) {
        splashTimers.forEach(function (t) { try { clearInterval(t); clearTimeout(t); } catch (e) {} });
        splashTimers = [];
      }
    } catch (e2) {}
    var root = null;
    try { root = document.getElementById("splash-root"); } catch (e3) {}
    function openStack() {
      try { splashShown = true; introMode = "main"; tab = "life"; } catch (e4) {}
      setState18337(null);
      try { if (typeof render === "function") render(); } catch (e5) {}
    }
    if (root) {
      try { root.classList.add("fading"); } catch (e6) {}
      setTimeout(openStack, 180);
    } else {
      openStack();
    }
  };
  window.enterFromSplash.__ledger18337Wrapped = true;
  try { enterFromSplash = window.enterFromSplash; } catch (e) {}

  document.addEventListener("keydown", function (event) {
    if (!event || event.key !== "Enter") return;
    var s = state18337();
    if (s) return;
    var target = event.target || {};
    var tag = String(target.tagName || "").toLowerCase();
    var id = String(target.id || "");
    var inBuilder = id === "name" || id === "city" || id.indexOf("sb-") === 0 || tag === "select" || tag === "input";
    if (inBuilder) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
})();
