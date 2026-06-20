/* Landing page save stack. Does not load the playable runtime. */
(function () {
  var SAVE_KEY_PREFIX = "ledger-life-slot-";
  var ACTIVE_SLOT_KEY = "ledger-active-slot";
  var NUM_SLOTS = 5;

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[ch];
    });
  }

  function money(value) {
    var n = Math.round(Number(value) || 0);
    var sign = n < 0 ? "-" : "";
    n = Math.abs(n);
    if (n >= 1e15) return sign + "$" + (n / 1e15).toFixed(1).replace(/\.0$/, "") + "Q";
    if (n >= 1e12) return sign + "$" + (n / 1e12).toFixed(1).replace(/\.0$/, "") + "T";
    if (n >= 1e9) return sign + "$" + (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
    if (n >= 1e6) return sign + "$" + (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 10000) return sign + "$" + Math.round(n / 1000).toLocaleString() + "K";
    return sign + "$" + n.toLocaleString();
  }

  function slotKey(idx) {
    return SAVE_KEY_PREFIX + idx;
  }

  function activeSlot() {
    var raw = "1";
    try { raw = localStorage.getItem(ACTIVE_SLOT_KEY) || "1"; } catch (e) {}
    var n = Math.round(Number(raw) || 1);
    return Math.max(1, Math.min(NUM_SLOTS, n));
  }

  function validLife(save) {
    var name = save && typeof save.name === "string" ? save.name.trim() : "";
    var age = Number(save && save.age);
    return !!(save && typeof save === "object" && name && name !== "undefined" && Number.isFinite(age));
  }

  function readSlot(idx) {
    var raw = null;
    try { raw = localStorage.getItem(slotKey(idx)); } catch (e) {}
    if (!raw) return { idx:idx, occupied:false };
    try {
      var save = JSON.parse(raw);
      if (save && save.state) save = save.state;
      if (!validLife(save)) return { idx:idx, occupied:false, broken:true };
      return {
        idx: idx,
        occupied: true,
        name: save.name || "Unnamed life",
        age: Number(save.age) || 0,
        alive: save.alive !== false,
        sandboxMode: !!save.sandboxMode,
        netWorth: netWorth(save),
        city: save.city || "Unknown city",
        generation: save.legacy && save.legacy.generation || 1,
        lastLog: Array.isArray(save.log) && save.log.length ? String(save.log[0].text || "") : ""
      };
    } catch (e2) {
      return { idx:idx, occupied:false, broken:true };
    }
  }

  function netWorth(save) {
    var finance = save.finance || {};
    var debts = finance.debts || {};
    var stocks = finance.stocksV18 || {};
    var firm = finance.personalFirm || {};
    var assets = 0;
    assets += Number(save.money) || 0;
    assets += Number(save.savings) || 0;
    assets += Number(save.ira) || 0;
    assets += Number(save.retirement401k) || 0;
    assets += Number(finance.superSaver) || 0;
    assets += Number(finance.brokerage) || 0;
    assets += Number(stocks.marketValue) || Number(stocks.value) || 0;
    assets += Number(firm.capital) || Number(firm.managed) || 0;
    var debt = Number(save.debt) || 0;
    debt += Number(finance.taxDebt) || 0;
    debt += Number(finance.assetBackedLoan) || 0;
    Object.keys(debts).forEach(function (key) { debt += Math.max(0, Number(debts[key]) || 0); });
    return Math.round(assets - debt);
  }

  function playPage() {
    var path = String(window.location.pathname || "");
    return /(?:_landing_built|_built)\.html$/i.test(path) || /\/dist\//i.test(path)
      ? "Ledger_18_dynamic_stocks_v18_35_play_built.html"
      : "play.html";
  }

  function goPlay(query) {
    window.location.href = playPage() + query;
  }

  function setStyle(kind, value) {
    try { localStorage.setItem(kind === "theme" ? "ledger-ui-theme" : "ledger-ui-density", value); } catch (e) {}
    applyStyle();
    render();
  }

  function applyStyle() {
    var theme = "classic";
    var density = "roomy";
    try { theme = localStorage.getItem("ledger-ui-theme") || theme; } catch (e) {}
    try { density = localStorage.getItem("ledger-ui-density") || density; } catch (e2) {}
    document.documentElement.dataset.ledgerTheme = theme;
    document.documentElement.dataset.ledgerDensity = density;
  }

  function deleteSlot(idx) {
    if (!window.confirm("Delete save slot " + idx + "?")) return;
    try { localStorage.removeItem(slotKey(idx)); } catch (e) {}
    render();
  }

  function continueSlot(idx) {
    try { localStorage.setItem(ACTIVE_SLOT_KEY, String(idx)); } catch (e) {}
    goPlay("?slot=" + idx + "&from=landing");
  }

  function newSlot(idx) {
    try { localStorage.setItem(ACTIVE_SLOT_KEY, String(idx)); } catch (e) {}
    goPlay("?new=1&slot=" + idx + "&from=landing");
  }

  function sandboxSlot(idx) {
    try { localStorage.setItem(ACTIVE_SLOT_KEY, String(idx)); } catch (e) {}
    goPlay("?sandbox=1&slot=" + idx + "&from=landing");
  }

  function pulseBars() {
    var heights = [34, 48, 70, 42, 59, 28, 66, 84, 51, 72, 36, 63, 77, 44, 58, 32, 68, 52];
    return heights.map(function (h) { return '<span style="height:' + h + '%"></span>'; }).join("");
  }

  function saveCard(slot, active) {
    if (!slot.occupied) {
      return '<article class="landing-save empty">' +
        '<div class="landing-save-top"><div><div class="landing-save-name">Slot ' + slot.idx + '</div>' +
        '<div class="landing-save-meta">' + (slot.broken ? "Unreadable save was ignored. Start clean here." : "Empty - start a new life here.") + '</div></div>' +
        '<div class="landing-card-v">' + (slot.broken ? "Fix" : "New") + '</div></div>' +
        '<div class="landing-save-actions"><button class="landing-btn green" data-action="new" data-slot="' + slot.idx + '">New Life</button>' +
        '<button class="landing-btn blue" data-action="sandbox" data-slot="' + slot.idx + '">Sandbox</button></div></article>';
    }
    return '<article class="landing-save ' + (slot.idx === active ? "active" : "") + '">' +
      '<div class="landing-save-top"><div><div class="landing-save-name">Slot ' + slot.idx + ' - ' + esc(slot.name) + '</div>' +
      '<div class="landing-save-meta">' + (slot.alive ? "Age " + slot.age : "Deceased at " + slot.age) + ' - Gen ' + esc(slot.generation) + ' - Net ' + money(slot.netWorth) + (slot.sandboxMode ? " - Sandbox" : "") + '<br>' + esc(slot.city) + (slot.lastLog ? ' - ' + esc(slot.lastLog).slice(0, 86) : "") + '</div></div>' +
      '<div class="landing-card-v">' + money(slot.netWorth) + '</div></div>' +
      '<div class="landing-save-actions"><button class="landing-btn green" data-action="continue" data-slot="' + slot.idx + '">Continue</button>' +
      '<button class="landing-btn blue" data-action="new" data-slot="' + slot.idx + '">New Over</button>' +
      '<button class="landing-btn red" data-action="delete" data-slot="' + slot.idx + '">Delete</button></div></article>';
  }

  function render() {
    applyStyle();
    var root = document.getElementById("landing-app");
    if (!root) return;
    var active = activeSlot();
    var slots = [];
    for (var i = 1; i <= NUM_SLOTS; i += 1) slots.push(readSlot(i));
    var occupied = slots.filter(function (slot) { return slot.occupied; }).length;
    var live = slots.filter(function (slot) { return slot.occupied && slot.alive; }).length;
    var totalNet = slots.reduce(function (sum, slot) { return sum + (slot.occupied ? slot.netWorth : 0); }, 0);
    var theme = "classic";
    var density = "roomy";
    try { theme = localStorage.getItem("ledger-ui-theme") || theme; } catch (e) {}
    try { density = localStorage.getItem("ledger-ui-density") || density; } catch (e2) {}

    root.innerHTML = '<section class="landing-hero">' +
      '<div class="landing-stage"><div><div class="landing-kicker">Life stack gate</div><h1 class="landing-title">The Ledger</h1>' +
      '<p class="landing-sub">Choose the life you actually want before the simulation loads. The playable runtime now lives behind this gate, so an old active slot cannot randomly take over the first screen.</p></div>' +
      '<div class="landing-pulse"><div class="landing-pulse-track">' + pulseBars() + '</div><div class="landing-card-grid">' +
      '<div class="landing-card"><div class="landing-card-k">Saved lives</div><div class="landing-card-v">' + occupied + '/' + NUM_SLOTS + '</div></div>' +
      '<div class="landing-card"><div class="landing-card-k">Live slots</div><div class="landing-card-v">' + live + '</div></div>' +
      '<div class="landing-card"><div class="landing-card-k">Stack worth</div><div class="landing-card-v">' + money(totalNet) + '</div></div>' +
      '</div></div><div class="landing-footer"><div class="landing-small">Active slot ' + active + '</div><button class="landing-btn blue" data-action="sandbox" data-slot="' + active + '">Open Sandbox</button></div></div>' +
      '<aside class="landing-stack"><div class="landing-stack-head"><div><div class="landing-kicker">Community stack</div><div class="landing-stack-title">Past Lives + Saves</div></div><button class="landing-btn green" data-action="new" data-slot="' + active + '">New Life</button></div>' +
      '<section class="landing-panel"><div class="landing-kicker">Style menu</div><div class="landing-pref-grid">' +
      '<button class="landing-pref ' + (theme === "classic" ? "selected" : "") + '" data-pref="theme" data-value="classic"><div class="landing-pref-label">Classic</div><span>Warm paper, gold commands, current Ledger feel.</span></button>' +
      '<button class="landing-pref ' + (theme === "signal" ? "selected" : "") + '" data-pref="theme" data-value="signal"><div class="landing-pref-label">Signal</div><span>More blue and green contrast for finance-heavy play.</span></button>' +
      '<button class="landing-pref ' + (density === "roomy" ? "selected" : "") + '" data-pref="density" data-value="roomy"><div class="landing-pref-label">Roomy</div><span>Bigger touch targets and wider spacing.</span></button>' +
      '<button class="landing-pref ' + (density === "compact" ? "selected" : "") + '" data-pref="density" data-value="compact"><div class="landing-pref-label">Compact</div><span>Tighter menus for big finance and stock screens.</span></button></div></section>' +
      '<div class="landing-save-list">' + slots.map(function (slot) { return saveCard(slot, active); }).join("") + '</div></aside></section>';
  }

  document.addEventListener("click", function (event) {
    var pref = event.target.closest("[data-pref]");
    if (pref) {
      event.preventDefault();
      return setStyle(pref.dataset.pref, pref.dataset.value);
    }
    var btn = event.target.closest("[data-action]");
    if (!btn) return;
    event.preventDefault();
    var slot = Math.max(1, Math.min(NUM_SLOTS, Math.round(Number(btn.dataset.slot) || activeSlot())));
    var action = btn.dataset.action;
    if (action === "continue") return continueSlot(slot);
    if (action === "new") return newSlot(slot);
    if (action === "sandbox") return sandboxSlot(slot);
    if (action === "delete") return deleteSlot(slot);
  });

  render();
})();
