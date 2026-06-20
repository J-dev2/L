/* ============================================================================
 * scroll-nav.js  (v18.59 — scroll buttons for horizontal rails)
 * ----------------------------------------------------------------------------
 * The game has many horizontal scroll "rails". Dragging them is laggy and easy
 * to miss, so this adds ◀ / ▶ buttons:
 *   - TAP a button = one gentle smooth nudge (~58% of the rail width).
 *   - HOLD a button = keep scrolling continuously until you let go.
 * The scrollbar itself is hidden (buttons are the way to move; touch-drag still
 * works on mobile). Smoothing is applied ONLY in JS on an explicit press — there
 * is no CSS `scroll-behavior:smooth`, which previously made any programmatic
 * scrollLeft (e.g. focus-into-view after a render) animate and read as the rail
 * "scrolling on its own".
 *
 *   - window.scrollRailV1857(innerHTML)  — wrap content in a button-railed track.
 *   - A guarded post-render decorator retro-fits legacy rails with the buttons.
 *     Idempotent (data-snav guard) and fully try/caught.
 * Buttons carry no inline handlers; a single delegated pointer listener drives
 * both new and legacy buttons (tap vs hold). Loads before more-command.js so the
 * central render crash-guard wraps it.
 * ========================================================================== */
(function () {
  "use strict";
  if (window.__ledgerScrollNavV1857Loaded) return;
  window.__ledgerScrollNavV1857Loaded = true;

  var TAP_FRAC = 0.58;     // gentle: ~58% of the visible width per tap
  var TAP_MIN = 150;       // never less than 150px
  var HOLD_DELAY = 200;    // ms held before continuous scroll kicks in
  var TAP_MAX = 260;       // ms — a press shorter than this (no hold) counts as a tap
  var HOLD_SPEED = 9;      // px per frame while holding (~540px/s @60fps)

  var raf = window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function (f) { return setTimeout(f, 16); };
  var caf = window.cancelAnimationFrame ? window.cancelAnimationFrame.bind(window) : clearTimeout;

  function trackFor(btn) {
    if (!btn) return null;
    var wrap = btn.closest ? btn.closest(".snav-wrap") : (btn.parentNode || null);
    return wrap ? wrap.querySelector(".snav-track") : null;
  }
  function dirOf(btn) { return btn && btn.classList && btn.classList.contains("right") ? 1 : -1; }

  // One gentle smooth nudge (explicit JS smoothing — no CSS scroll-behavior).
  function nudge(track, dir) {
    if (!track) return;
    var by = Math.max(TAP_MIN, Math.round(track.clientWidth * TAP_FRAC)) * dir;
    try { track.scrollBy({ left: by, behavior: "smooth" }); }
    catch (e) { try { track.scrollLeft += by; } catch (e2) {} }
  }

  // Continuous scroll while a button is held.
  var HOLD = null;
  function startHold(track, dir) {
    stopHold();
    HOLD = { track: track, dir: dir, id: 0 };
    var step = function () {
      if (!HOLD) return;
      try { HOLD.track.scrollLeft += HOLD.dir * HOLD_SPEED; } catch (e) {}
      HOLD.id = raf(step);
    };
    HOLD.id = raf(step);
  }
  function stopHold() { if (HOLD) { try { caf(HOLD.id); } catch (e) {} HOLD = null; } }

  // Single delegated pointer handler drives every .snav-btn (new + legacy).
  function onPointerDown(e) {
    var btn = e.target && e.target.closest ? e.target.closest(".snav-btn") : null;
    if (!btn) return;
    var track = trackFor(btn);
    if (!track) return;
    try { e.preventDefault(); } catch (ee) {}
    try { e.stopPropagation(); } catch (ee2) {}
    var dir = dirOf(btn);
    var t0 = Date.now();
    var holdTimer = setTimeout(function () { holdTimer = null; startHold(track, dir); }, HOLD_DELAY);
    function release() {
      document.removeEventListener("pointerup", release, true);
      document.removeEventListener("pointercancel", release, true);
      var wasHolding = !!HOLD;
      if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
      stopHold();
      if (!wasHolding && (Date.now() - t0) < TAP_MAX) nudge(track, dir); // quick tap
    }
    document.addEventListener("pointerup", release, true);
    document.addEventListener("pointercancel", release, true);
  }
  try { document.addEventListener("pointerdown", onPointerDown, true); } catch (e) {}

  // Back-compat: a plain single nudge for any external caller.
  window.snavScrollV1857 = function (btn, dir) {
    try { nudge(trackFor(btn), dir < 0 ? -1 : 1); } catch (e) {}
    return false;
  };

  // For new components: content already wrapped with scroll buttons (no inline handlers).
  window.scrollRailV1857 = function (inner, extraCls) {
    return '<div class="snav-wrap ' + (extraCls || "") + '">' +
      '<button class="snav-btn left" type="button" aria-label="scroll left">‹</button>' +
      '<div class="snav-track">' + inner + '</div>' +
      '<button class="snav-btn right" type="button" aria-label="scroll right">›</button>' +
      '</div>';
  };

  // ----- legacy rail decorator -----
  var RAIL_SEL = [
    ".v1839-rail", ".v1839-action-row", ".v1840-action-row", ".shop-tabs",
    ".v1829-grid", ".v1829-mandate-grid", ".v1829-firm-grid", ".v189-fund-grid",
    ".v18-summary-grid", ".v17-broker-stats", ".v1820-firm-skill-grid"
  ].join(",");

  function makeBtn(side) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "snav-btn " + side + " legacy";
    b.setAttribute("aria-label", "scroll " + side);
    b.textContent = side === "left" ? "‹" : "›";
    return b; // driven by the delegated pointer handler
  }

  function decorate() {
    try {
      if (typeof document === "undefined" || !document.querySelectorAll) return;
      var rails = document.querySelectorAll(RAIL_SEL);
      for (var i = 0; i < rails.length; i++) {
        var r = rails[i];
        try {
          if (!r || r.getAttribute("data-snav")) continue;
          // only decorate rails that actually overflow horizontally
          if ((r.scrollWidth || 0) <= (r.clientWidth || 0) + 6) continue;
          var p = r.parentNode; if (!p) continue;
          r.setAttribute("data-snav", "1");
          var wrap = document.createElement("div");
          wrap.className = "snav-wrap legacy-wrap";
          p.insertBefore(wrap, r);
          wrap.appendChild(r);
          r.classList.add("snav-track");
          wrap.appendChild(makeBtn("left"));
          wrap.appendChild(makeBtn("right"));
        } catch (e) {}
      }
    } catch (e) {}
  }
  window.decorateRailsV1857 = decorate;

  // run after every render (rAF so layout is settled); fully guarded
  var prev = window.render || (typeof render === "function" ? render : null);
  if (typeof prev === "function" && !prev.__snavWrapped) {
    var wrapped = function () {
      var out = prev.apply(this, arguments);
      try {
        if (typeof requestAnimationFrame === "function") requestAnimationFrame(decorate);
        else decorate();
      } catch (e) { try { decorate(); } catch (e2) {} }
      return out;
    };
    wrapped.__snavWrapped = true;
    window.render = wrapped;
    try { render = wrapped; } catch (e) {}
  }

  // ----- styles -----
  try {
    if (typeof document !== "undefined" && document.head && !document.getElementById("ledger-scroll-nav-v1857-style")) {
      var st = document.createElement("style");
      st.id = "ledger-scroll-nav-v1857-style";
      st.textContent = [
        ".snav-wrap{position:relative;min-width:0;width:100%}",
        // scrollbar hidden — buttons are the way to move; no CSS smooth (JS-only on press)
        ".snav-track{overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;scrollbar-width:none}",
        ".snav-track::-webkit-scrollbar{display:none}",
        ".snav-wrap:not(.legacy-wrap) .snav-track{display:flex;gap:8px;flex-wrap:nowrap;align-items:center;padding:2px 30px 8px}",
        ".snav-wrap:not(.legacy-wrap) .snav-track>*{flex:0 0 auto}",
        ".snav-btn{position:absolute;top:50%;transform:translateY(-50%);z-index:6;width:26px;height:38px;display:grid;place-items:center;border:1px solid var(--line,#3a3128);border-radius:9px;background:rgba(18,15,11,.92);color:var(--ink,#f3efe4);font-size:18px;line-height:1;cursor:pointer;opacity:.9;-webkit-user-select:none;user-select:none;touch-action:none;transition:opacity .14s,background .14s,border-color .14s}",
        ".snav-btn:hover{opacity:1;background:rgba(40,33,24,.96);border-color:rgba(201,155,85,.55)}",
        ".snav-btn:active{transform:translateY(-50%) scale(.94)}",
        ".snav-btn.left{left:-3px}.snav-btn.right{right:-3px}",
        ".snav-wrap.legacy-wrap{padding:0 2px}"
      ].join("\n");
      document.head.appendChild(st);
    }
  } catch (e) {}
})();
