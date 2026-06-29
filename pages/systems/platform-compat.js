/* Platform compatibility: mobile safe labels + emoji fallbacks. */
(function () {
  "use strict";
  if (window.__ledgerPlatformCompatV1875) return;
  window.__ledgerPlatformCompatV1875 = true;

  var STORAGE_KEY = "ledger_emoji_mode_v1875";
  var lastTimer = null;
  var observer = null;

  function ua() {
    try { return String(navigator.userAgent || ""); } catch (e) { return ""; }
  }
  function platformString() {
    try { return String(navigator.platform || ""); } catch (e) { return ""; }
  }
  function isIOS() {
    var u = ua();
    var p = platformString();
    return /iPad|iPhone|iPod/i.test(u) || (p === "MacIntel" && Number(navigator.maxTouchPoints || 0) > 1);
  }
  function isAndroid() {
    return /Android/i.test(ua());
  }
  function platform() {
    if (isIOS()) return "ios";
    if (isAndroid()) return "android";
    return "desktop";
  }
  function storedMode() {
    try { return localStorage.getItem(STORAGE_KEY) || ""; } catch (e) { return ""; }
  }
  function canvasEmojiCheck() {
    try {
      var canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      var ctx = canvas.getContext("2d");
      if (!ctx) return true;
      ctx.textBaseline = "top";
      ctx.font = "32px Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif";
      ctx.fillText("💼", 0, 0);
      var data = ctx.getImageData(0, 0, 64, 64).data;
      for (var i = 3; i < data.length; i += 4) if (data[i] > 0) return true;
    } catch (e) {
      return true;
    }
    return false;
  }
  function desiredMode() {
    var forced = storedMode();
    if (forced === "emoji" || forced === "symbols") return forced;
    if (!canvasEmojiCheck()) return "symbols";
    return platform() === "ios" ? "symbols" : "emoji";
  }

  var ICONS = {
    "🏦": "BANK",
    "💓": "PULSE",
    "💵": "CASH",
    "💳": "CARD",
    "💼": "LINE",
    "🔒": "SECURE",
    "🛡️": "SHIELD",
    "🛡": "SHIELD",
    "🌍": "TAX",
    "🧭": "NAV",
    "📊": "CHART",
    "📈": "MARKET",
    "🏛️": "TRUST",
    "🏛": "TRUST",
    "🤝": "OPERATOR",
    "🚀": "STARTUP",
    "🏢": "BUSINESS",
    "🏠": "HOME",
    "👶": "HEIR",
    "💾": "SAVED",
    "⚖️": "LEGAL",
    "⚖": "LEGAL",
    "🔧": "TOOLS",
    "🩹": "SAFE",
    "🌳": "LEGACY",
    "👑": "HEIR",
    "🗺️": "MAP",
    "🗺": "MAP"
  };
  var ICON_KEYS = Object.keys(ICONS).sort(function (a, b) { return b.length - a.length; });

  function replaceText(text) {
    for (var i = 0; i < ICON_KEYS.length; i++) {
      var icon = ICON_KEYS[i];
      if (text.indexOf(icon) >= 0) text = text.split(icon).join(ICONS[icon]);
    }
    return text;
  }
  function shouldSkip(node) {
    var el = node && node.parentNode;
    while (el && el.nodeType === 1) {
      var tag = String(el.tagName || "").toUpperCase();
      if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT") return true;
      if (el.getAttribute && el.getAttribute("data-ledger-emoji-lock") === "1") return true;
      el = el.parentNode;
    }
    return false;
  }
  function applyFallback(root) {
    root = root || document.body;
    if (!root || window.ledgerPlatformV1875.mode !== "symbols") return;
    try {
      var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: function (node) {
          if (!node || !node.nodeValue || shouldSkip(node)) return NodeFilter.FILTER_REJECT;
          return /[\u2600-\u27BF\uD83C-\uDBFF]/.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      });
      var pending = [];
      while (walker.nextNode()) pending.push(walker.currentNode);
      pending.forEach(function (node) {
        var next = replaceText(node.nodeValue);
        if (next !== node.nodeValue) node.nodeValue = next;
      });
    } catch (e) {}
  }
  function schedule(root) {
    if (lastTimer) clearTimeout(lastTimer);
    lastTimer = setTimeout(function () { applyFallback(root || document.body); }, 0);
  }
  function setAttrs() {
    var info = window.ledgerPlatformV1875;
    try {
      document.documentElement.setAttribute("data-ledger-platform", info.platform);
      document.documentElement.setAttribute("data-ledger-emoji-mode", info.mode);
      document.body && document.body.setAttribute("data-ledger-emoji-mode", info.mode);
    } catch (e) {}
  }
  function installStyles() {
    if (!document.head || document.getElementById("ledger-platform-compat-v1875")) return;
    var st = document.createElement("style");
    st.id = "ledger-platform-compat-v1875";
    st.textContent = [
      "html[data-ledger-emoji-mode='emoji'] body{font-family:Fraunces,Georgia,'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',serif}",
      "html[data-ledger-emoji-mode='symbols'] .section-label,html[data-ledger-emoji-mode='symbols'] button{letter-spacing:0!important}",
      "html[data-ledger-platform='ios'] .hub-overlay{padding-bottom:env(safe-area-inset-bottom,0px)}"
    ].join("\n");
    document.head.appendChild(st);
  }
  function wrapRenderers() {
    var prevRender = window.render || null;
    if (typeof prevRender === "function" && !prevRender.__platformCompatV1875) {
      var renderWrapped = function () {
        var out = prevRender.apply(this, arguments);
        schedule(document.body);
        return out;
      };
      renderWrapped.__platformCompatV1875 = true;
      window.render = renderWrapped;
      try { render = renderWrapped; } catch (e) {}
    }
    var prevInPlace = window.renderHubInPlaceV16 || null;
    if (typeof prevInPlace === "function" && !prevInPlace.__platformCompatV1875) {
      var inPlaceWrapped = function () {
        var out = prevInPlace.apply(this, arguments);
        schedule(document.body);
        return out;
      };
      inPlaceWrapped.__platformCompatV1875 = true;
      window.renderHubInPlaceV16 = inPlaceWrapped;
      try { renderHubInPlaceV16 = inPlaceWrapped; } catch (e2) {}
    }
  }
  function installObserver() {
    if (observer || !window.MutationObserver || !document.body) return;
    observer = new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].addedNodes && list[i].addedNodes.length) { schedule(document.body); return; }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  function refreshInfo(mode) {
    window.ledgerPlatformV1875 = {
      platform: platform(),
      mode: mode || desiredMode(),
      emojiCanvas: canvasEmojiCheck()
    };
    setAttrs();
  }

  window.ledgerIconV1875 = function (emoji, fallback) {
    if ((window.ledgerPlatformV1875 || {}).mode === "symbols") return fallback || ICONS[emoji] || "";
    return emoji;
  };
  window.setLedgerEmojiModeV1875 = function (mode) {
    if (mode !== "emoji" && mode !== "symbols" && mode !== "auto") return;
    try {
      if (mode === "auto") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, mode);
    } catch (e) {}
    refreshInfo(mode === "auto" ? null : mode);
    schedule(document.body);
  };
  window.applyLedgerEmojiFallbackV1875 = function () { applyFallback(document.body); };

  refreshInfo();
  installStyles();
  wrapRenderers();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setAttrs();
      installObserver();
      schedule(document.body);
    });
  } else {
    installObserver();
    schedule(document.body);
  }

  if (window.registerLedgerSystem) {
    window.registerLedgerSystem({
      id: "platform-compat",
      file: "pages/systems/platform-compat.js",
      status: "active",
      globals: ["ledgerPlatformV1875", "ledgerIconV1875", "setLedgerEmojiModeV1875"],
      notes: "Detects iOS, Android, and desktop. Falls back from emoji labels to readable symbols/text when platform emoji rendering is unreliable."
    });
  }
})();
