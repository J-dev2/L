/* Hidden Dev Tools (v18.62)
 * Inert unless play.html is opened with ?dev=1. Then a small password gate appears;
 * the correct password reveals a floating Dev Tools panel. Normal players never see it.
 * Access can also be triggered from the console with window.devTools("<password>").
 * Password is obfuscation, not real security — this is a developer/test convenience.
 */
(function () {
  "use strict";
  var DEV_PASSWORD = "password";

  function hasDevFlag() { try { return new URLSearchParams(location.search || "").has("dev"); } catch (e) { return false; } }
  if (!hasDevFlag()) return; // completely inert for the playable user build

  var unlocked = false;
  var panelOpen = false;

  // ---- small helpers -------------------------------------------------------
  function S() { return window.state || null; }
  function num(x) { return Number.isFinite(Number(x)) ? Number(x) : 0; }
  function money(v) { try { return (typeof window.money === "function") ? window.money(v) : ("$" + Math.round(num(v)).toLocaleString()); } catch (e) { return "$" + Math.round(num(v)); } }
  function call(name) { try { if (typeof window[name] === "function") return window[name].apply(null, Array.prototype.slice.call(arguments, 1)); } catch (e) {} }
  function reRender() { try { if (typeof window.render === "function") window.render(); } catch (e) {} }
  function doSave() { try { if (typeof window.save === "function") window.save(); } catch (e) {} }
  function toast(m) { try { if (typeof window.addToast === "function") window.addToast(m); else if (typeof window.toast === "function") window.toast(m); } catch (e) {} }
  function ent() { return window.EntrepreneurV1861 || null; }
  function refresh() { doSave(); reRender(); paint(); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }

  // ---- tool actions --------------------------------------------------------
  function giveMoney(amt) { var s = S(); if (!s) return toast("No game loaded."); s.money = num(s.money) + amt; refresh(); toast("Added " + money(amt)); }
  function setAge() { var s = S(); if (!s) return; var v = prompt("Set age:", String(num(s.age))); if (v == null) return; s.age = Math.max(0, Math.round(num(v))); refresh(); }
  function maxStats() {
    var s = S(); if (!s || !s.stats) return toast("No stats.");
    Object.keys(s.stats).forEach(function (k) { if (typeof s.stats[k] === "number") s.stats[k] = 100; });
    if ("stress" in s.stats) s.stats.stress = 0;
    refresh(); toast("Stats maxed.");
  }
  function ageUpN(n) { for (var i = 0; i < n; i++) { call("ageUp"); if (!S() || S().alive === false) break; } paint(); }

  function spawnCompany() {
    var E = ent(); if (!E || !E.initBiz || !E.newBizObj) return toast("Entrepreneur module unavailable.");
    try {
      var B = E.initBiz();
      var biz = E.newBizObj("DevCo " + (Math.floor(Math.random() * 900) + 100), "saas", "saas", 1000000);
      biz.productStage = "live"; biz.stage = "growth"; biz.customers = 5000; biz.productQuality = 80;
      biz.nps = 40; biz.brand = 60; biz.active = true; biz.annualRevenue = 2000000; biz.valuation = 20000000;
      B.businesses = B.businesses || []; B.businesses.push(biz); B.activeBizId = biz.uid; B.active = true; B._migrationCheckedV1861 = true;
      refresh(); toast("Spawned " + biz.name);
    } catch (e) { toast("Spawn failed."); }
  }
  function makeIpoReady() {
    var E = ent(); if (!E || !E.getActiveBiz) return toast("No entrepreneur module.");
    var biz = E.getActiveBiz(); if (!biz) return toast("No active company — spawn one first.");
    biz.annualRevenue = Math.max(num(biz.annualRevenue), 12000000);
    biz.yearsOld = Math.max(num(biz.yearsOld), 6);
    biz.productStage = "live"; biz.stage = "scale";
    refresh(); toast(biz.name + " is IPO-ready.");
  }
  function growYears(n) { for (var i = 0; i < n; i++) call("runEntrepreneurYearV1861"); refresh(); toast("Ran " + n + " founder year(s)."); }

  // ---- the panel -----------------------------------------------------------
  function injectStyle() {
    if (document.getElementById("ledger-devtools-style")) return;
    var st = document.createElement("style");
    st.id = "ledger-devtools-style";
    st.textContent = [
      "#ledger-dev-fab{position:fixed;right:14px;bottom:14px;z-index:99998;width:46px;height:46px;border-radius:12px;border:1px solid rgba(216,173,109,.5);background:linear-gradient(135deg,#2a2218,#16120d);color:#e9cf9c;font-size:20px;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.5)}",
      "#ledger-dev-fab:hover{border-color:#d8b16e}",
      "#ledger-dev-overlay{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px}",
      ".ledger-dev-card{width:min(560px,96vw);max-height:90vh;overflow:auto;border:1px solid rgba(216,173,109,.4);border-radius:14px;background:linear-gradient(135deg,rgba(31,27,21,.99),rgba(16,14,11,.99));color:#f6ead8;padding:16px;font-family:'JetBrains Mono',monospace;box-shadow:0 20px 60px rgba(0,0,0,.6)}",
      ".ledger-dev-card h2{font-family:'Fraunces',Georgia,serif;margin:0 0 2px;color:#fff3df;font-size:20px}",
      ".ledger-dev-card .ld-sub{color:#b9a98e;font-size:10px;margin-bottom:12px;text-transform:uppercase;letter-spacing:.12em}",
      ".ld-sec{border:1px solid rgba(255,255,255,.10);border-radius:10px;background:rgba(255,255,255,.04);padding:11px;margin-bottom:10px}",
      ".ld-sec h3{margin:0 0 8px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#d8b16e}",
      ".ld-read{color:#b9a98e;font-size:11px;line-height:1.5;margin-bottom:8px}.ld-read b{color:#fff3df}",
      ".ld-row{display:flex;flex-wrap:wrap;gap:6px}",
      ".ld-btn{border:1px solid rgba(255,255,255,.14);border-radius:8px;background:rgba(255,255,255,.05);color:#f6ead8;font-family:'JetBrains Mono',monospace;font-size:11px;padding:7px 10px;cursor:pointer}",
      ".ld-btn:hover{border-color:rgba(216,173,109,.5);color:#fff3df}.ld-btn.danger{border-color:rgba(233,146,125,.4);color:#e9927d}.ld-btn.gold{border-color:rgba(216,173,109,.5);color:#e9cf9c}",
      ".ld-close{float:right;border:1px solid rgba(255,255,255,.18);border-radius:8px;background:transparent;color:#b9a98e;cursor:pointer;padding:4px 9px;font-size:12px}",
      "#ledger-dev-gate{position:fixed;right:14px;bottom:14px;z-index:99998;border:1px solid rgba(216,173,109,.4);border-radius:12px;background:rgba(16,14,11,.97);padding:10px;display:flex;gap:6px;align-items:center;box-shadow:0 6px 20px rgba(0,0,0,.5)}",
      "#ledger-dev-gate input{border:1px solid rgba(216,173,109,.35);border-radius:8px;background:#100d0a;color:#f6ead8;padding:7px;font-family:'JetBrains Mono',monospace;font-size:11px;width:130px}",
      "#ledger-dev-gate span{color:#8c7f6a;font-size:9px;letter-spacing:.1em}"
    ].join("\n");
    (document.head || document.documentElement).appendChild(st);
  }

  function bizLine() {
    var E = ent(); if (!E || !E.getActiveBiz) return "no entrepreneur module";
    var b = E.getActiveBiz();
    if (!b) return "no active company";
    return esc(b.name) + " · " + (b.public ? "public " + esc(b.shareTicker || "") : "private") + " · rev " + money(b.annualRevenue) + " · val " + money(b.valuation);
  }
  function oldBizLine() {
    try { var c = call("oldBusinessCheckV1861") || {}; return "legacy " + num(c.oldCount) + " · migrated " + num(c.migrated) + " · duplicates " + num(c.duplicates) + " · portfolio " + num(c.newCount); }
    catch (e) { return "unavailable"; }
  }

  function panelHTML() {
    var s = S();
    var who = s ? (esc(s.name || "—") + ", age " + num(s.age) + " · " + money(s.money)) : "no game loaded";
    function btn(label, fn, cls) { return '<button class="ld-btn ' + (cls || "") + '" data-act="' + fn + '">' + esc(label) + '</button>'; }
    return '<div class="ledger-dev-card">' +
      '<button class="ld-close" data-act="close">✕ Close</button>' +
      '<h2>🛠 Dev Tools</h2><div class="ld-sub">Hidden · ?dev=1 build only</div>' +
      '<div class="ld-read"><b>' + who + '</b></div>' +

      '<div class="ld-sec"><h3>Money / Age / Stats</h3><div class="ld-row">' +
      btn("+ $100K", "give100k") + btn("+ $1M", "give1m") + btn("+ $1B", "give1b") +
      btn("Set age…", "setage") + btn("Max stats", "maxstats") + btn("Age up ×5", "ageup5") + btn("Age up ×1", "ageup1") +
      '</div></div>' +

      '<div class="ld-sec"><h3>Entrepreneurship</h3><div class="ld-read">' + bizLine() + '</div><div class="ld-row">' +
      btn("Spawn company", "spawn", "gold") + btn("Make IPO-ready", "ipo") + btn("Grow ×1 yr", "grow1") + btn("Grow ×5 yrs", "grow5") +
      '</div></div>' +

      '<div class="ld-sec"><h3>Old Business migration</h3><div class="ld-read">' + oldBizLine() + '</div><div class="ld-row">' +
      btn("Recheck / migrate", "migrate") + btn("Merge duplicates", "repair") +
      '</div></div>' +

      '<div class="ld-sec"><h3>Save</h3><div class="ld-row">' +
      btn("Force save", "save") + btn("Export save", "export") + btn("Import save", "import") + btn("Wipe slot", "wipe", "danger") +
      '</div></div>' +
      '</div>';
  }

  var ACTIONS = {
    close: function () { panelOpen = false; paint(); },
    give100k: function () { giveMoney(100000); },
    give1m: function () { giveMoney(1000000); },
    give1b: function () { giveMoney(1000000000); },
    setage: setAge,
    maxstats: maxStats,
    ageup5: function () { ageUpN(5); },
    ageup1: function () { ageUpN(1); },
    spawn: spawnCompany,
    ipo: makeIpoReady,
    grow1: function () { growYears(1); },
    grow5: function () { growYears(5); },
    migrate: function () { call("migrateOldBusinessesV1861"); refresh(); },
    repair: function () { call("repairDuplicateBusinessesV1861"); refresh(); },
    save: function () { doSave(); toast("Saved."); },
    export: function () { call("exportLedgerSave"); },
    import: function () { call("importLedgerSave"); },
    wipe: function () { if (confirm("Wipe the current save slot? This cannot be undone.")) call("resetSave"); }
  };

  function bindActions(root) {
    root.querySelectorAll("[data-act]").forEach(function (el) {
      el.addEventListener("click", function (ev) {
        ev.preventDefault(); ev.stopPropagation();
        var fn = ACTIONS[el.getAttribute("data-act")];
        if (typeof fn === "function") fn();
      });
    });
  }

  // paint reconciles the DOM with {unlocked, panelOpen}
  function paint() {
    injectStyle();
    var gate = document.getElementById("ledger-dev-gate");
    var fab = document.getElementById("ledger-dev-fab");
    var overlay = document.getElementById("ledger-dev-overlay");
    if (!unlocked) {
      if (fab) fab.remove();
      if (overlay) overlay.remove();
      if (!gate) {
        gate = document.createElement("div"); gate.id = "ledger-dev-gate";
        gate.innerHTML = '<input type="password" id="ledger-dev-pw" placeholder="dev password" autocomplete="off"><button class="ld-btn gold" id="ledger-dev-go">Unlock</button>';
        document.body.appendChild(gate);
        var go = function () { var v = (document.getElementById("ledger-dev-pw") || {}).value || ""; if (v === DEV_PASSWORD) { unlocked = true; paint(); } else { toast("Wrong dev password."); } };
        gate.querySelector("#ledger-dev-go").addEventListener("click", go);
        gate.querySelector("#ledger-dev-pw").addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
      }
      return;
    }
    if (gate) gate.remove();
    if (!fab) {
      fab = document.createElement("button"); fab.id = "ledger-dev-fab"; fab.title = "Dev Tools"; fab.textContent = "🛠";
      document.body.appendChild(fab);
      fab.addEventListener("click", function () { panelOpen = !panelOpen; paint(); });
    }
    if (panelOpen) {
      if (!overlay) { overlay = document.createElement("div"); overlay.id = "ledger-dev-overlay"; document.body.appendChild(overlay); overlay.addEventListener("click", function (e) { if (e.target === overlay) { panelOpen = false; paint(); } }); }
      overlay.innerHTML = panelHTML();
      bindActions(overlay);
    } else if (overlay) { overlay.remove(); }
  }

  // Programmatic unlock (console / tests): window.devTools("password")
  window.devTools = function (pw) { if (pw === DEV_PASSWORD) { unlocked = true; paint(); return true; } return false; };

  function boot() { try { paint(); } catch (e) {} }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
