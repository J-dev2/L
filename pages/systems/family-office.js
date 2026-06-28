/* ============================================================================
   FAMILY OFFICE  (v18.72)
   Sits on top of Codex's Trust Envelop (familyTrustV1839.holdingsV1868). Adds, as a
   SEPARATE module (no edits to tax-legal.js / entrepreneur.js), three things the user asked for:
     1. A "Family Office" HOLDINGS POPUP — one window that lays out everything you hold/control
        and protect (corpus, child trusts, titled property, titled entrepreneurship, titled
        businesses) vs net worth.  [THIS FILE — feature 1]
     2. Hire an OPERATOR to run + grow titled assets passively for a fee.  [feature 2 — added below]
     3. Title a SPECIFIC founder company to the trust (granular, not all-or-nothing). [feature 3]

   Everything reads Codex's window accessors (legalProtectedAssetsV1839, businessTrustValueV1840,
   trustHeldPropertyValueV1868, trustHeldEntrepreneurshipValueV1868, reEquityV1863) — DISPLAY ONLY for
   the popup, so it can't change net worth or wipe data. Uses the project tokens + classes.
   ========================================================================== */
(function () {
  "use strict";
  if (window.__ledgerFamilyOfficeV1872) return;
  window.__ledgerFamilyOfficeV1872 = true;

  /* ----------------------------- helpers ----------------------------- */
  function S() { return window.state || null; }
  function num(v, d) { v = Number(v); return isNaN(v) ? (d || 0) : v; }
  function round(v) { return Math.round(num(v)); }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function alive() { var s = S(); return !!(s && s.alive); }
  function pending() { var s = S(); return !!(s && s.pending); }
  function rerender() { try { if (typeof window.render === "function") window.render(); } catch (e) {} }
  function toast(m) { try { if (typeof window.addToast === "function") window.addToast(m); } catch (e) {} }
  function saveGame() { try { if (typeof window.save === "function") window.save(); } catch (e) {} }
  function log(m, d) { try { if (typeof window.addLog === "function") window.addLog(m, d || {}); } catch (e) {} }
  function callWin(name, arg) { try { if (typeof window[name] === "function") return num(window[name](arg)); } catch (e) {} return 0; }
  function jsArg(s) { return String(s == null ? "" : s).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\r?\n/g, " "); }
  function validKey(k) {
    k = String(k == null ? "" : k);
    return !!(k && k !== "undefined" && k !== "null");
  }
  function companyKeyV1872(b) {
    b = b || {};
    var keys = [b.uid, b.sourceKeyV1861, b.id, b.legacyIdV1861, b.name];
    for (var i = 0; i < keys.length; i++) {
      if (validKey(keys[i])) return String(keys[i]);
    }
    return "";
  }
  function companyKeysV1872(b) {
    b = b || {};
    var seen = {}, out = [];
    [b.uid, b.sourceKeyV1861, b.id, b.legacyIdV1861, b.name].forEach(function (k) {
      k = String(k == null ? "" : k);
      if (validKey(k) && !seen[k]) { seen[k] = true; out.push(k); }
    });
    return out;
  }
  function cleanCompanyMapV1872(map) {
    if (!map || typeof map !== "object") return {};
    Object.keys(map).forEach(function (k) { if (!validKey(k)) delete map[k]; });
    return map;
  }
  function mapHasTitledCompanyV1872(map) {
    map = cleanCompanyMapV1872(map);
    return Object.keys(map).some(function (k) { return !!map[k]; });
  }
  function mapCompanyTitledV1872(map, b) {
    map = cleanCompanyMapV1872(map);
    return companyKeysV1872(b).some(function (k) { return !!map[k]; });
  }
  function money(v) {
    v = round(v);
    try { if (typeof window.compactMoney === "function") return window.compactMoney(v); } catch (e) {}
    try { if (typeof window.money === "function") return window.money(v); } catch (e2) {}
    var a = Math.abs(v), sign = v < 0 ? "-" : "";
    if (a >= 1e9) return sign + "$" + (a / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
    if (a >= 1e6) return sign + "$" + (a / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (a >= 1e4) return sign + "$" + Math.round(a / 1e3) + "K";
    return sign + "$" + a.toLocaleString();
  }
  function netWorth() {
    var v = callWin("financeNetWorth");
    if (!v) v = callWin("legacyNetWorth");
    return round(v);
  }

  // Snapshot of everything the family office holds / protects (all from window accessors + state).
  function holdings() {
    var s = S() || {}, f = s.finance || {};
    var trust = f.familyTrustV1839 || {};
    var childTrusts = 0, tf = f.trustFunds || {};
    Object.keys(tf).forEach(function (k) { childTrusts += Math.max(0, num(tf[k])); });
    var corpus = Math.max(0, num(trust.corpus));
    var titledProperty = Math.max(0, callWin("trustHeldPropertyValueV1868"));
    var titledVenture = Math.max(0, callWin("trustHeldEntrepreneurshipValueV1868"));
    var titledBusiness = Math.max(0, callWin("businessTrustValueV1840"));
    var outsideManager = Math.max(0, num((f.externalManager || {}).capital) + num((f.managerFirmsV1829 || {}).capital));
    var propertyTotal = Math.max(0, callWin("reEquityV1863") || callWin("reEquityV1862"));
    var protectedTotal = Math.max(0, callWin("legalProtectedAssetsV1839"));
    var underTrust = corpus + childTrusts + titledProperty + titledVenture + titledBusiness;
    return {
      created: !!trust.created,
      plan: trust.plan || "none",
      corpus: corpus,
      childTrusts: childTrusts,
      titledProperty: titledProperty,
      titledVenture: titledVenture,
      titledBusiness: titledBusiness,
      outsideManager: outsideManager,
      propertyTotal: propertyTotal,
      propertyUntitled: Math.max(0, propertyTotal - titledProperty),
      protectedTotal: protectedTotal,
      underTrust: underTrust,
      net: netWorth()
    };
  }

  /* ----------------------------- OPERATOR (feature 2) -----------------------------
     Hire an operator to RUN + GROW titled family-office holdings when you're not actively managing
     them. Each year the operator earns a return on the TITLED value (property + founder companies +
     titled businesses), keeps a fee, and compounds the rest into the trust corpus — so protected
     family wealth grows across years and generations. State lives on the trust (carries to heirs).
     Writes ONLY to trust.corpus + cash on hire; never touches the asset engines, so no net-worth
     double-count. NOTE (tested side): the return/fee rates are a first pass — tune for balance. */
  var OPERATORS = [
    { id: "associate", name: "Associate operator",            cost: 50000,   annualFeeRate: 0.15, returnRate: 0.025, desc: "A capable hand to keep titled holdings running." },
    { id: "director",  name: "Managing director",             cost: 600000,  annualFeeRate: 0.13, returnRate: 0.040, desc: "Actively runs and grows the family holdings." },
    { id: "chief",     name: "Chief family-office operator",  cost: 3000000, annualFeeRate: 0.11, returnRate: 0.060, desc: "Top tier: best growth, lowest relative fee, runs across generations." }
  ];
  function operatorDef(id) { for (var i = 0; i < OPERATORS.length; i++) if (OPERATORS[i].id === id) return OPERATORS[i]; return null; }
  function operatorState() {
    var s = S(); if (!s) return null;
    var f = s.finance || (s.finance = {});
    var trust = f.familyTrustV1839; if (!trust) return null;
    if (!trust.operatorV1872 || typeof trust.operatorV1872 !== "object") {
      trust.operatorV1872 = { hired: false, tier: null, hiredAge: null, lastReturn: 0, lastFee: 0, totalGrown: 0, _yr: -1 };
    }
    return trust.operatorV1872;
  }
  function titledManagedValue() {
    return Math.max(0, callWin("trustHeldPropertyValueV1868")) +
           Math.max(0, callWin("trustHeldEntrepreneurshipValueV1868")) +
           Math.max(0, callWin("businessTrustValueV1840"));
  }
  window.hireOperatorV1872 = function (tierId) {
    if (!alive()) return;
    var s = S(); var trust = (s.finance || {}).familyTrustV1839;
    if (!trust || !trust.created) { toast("Create a family trust first."); return; }
    var def = operatorDef(tierId); if (!def) return;
    var op = operatorState(); if (!op) return;
    if (op.hired && op.tier === tierId) { toast("That operator already runs your family office."); return; }
    if (num(s.money) < def.cost) { toast(def.name + " costs " + money(def.cost) + " to bring on."); return; }
    s.money = round(num(s.money) - def.cost);
    op.hired = true; op.tier = tierId; op.hiredAge = round(num(s.age));
    log("🤝 Hired " + def.name + " to run the family office (" + money(def.cost) + ").", { money: -def.cost });
    toast("Hired " + def.name + ".");
    saveGame(); rerender();
  };
  window.fireOperatorV1872 = function () {
    var op = operatorState(); if (!op || !op.hired) return;
    op.hired = false; op.tier = null;
    log("Let the family-office operator go.");
    saveGame(); rerender();
  };
  // Yearly: operator earns returnRate × titled value, keeps annualFeeRate of it, compounds the rest
  // into trust corpus. Guarded once per year. Hooked onto resolveLifeAndFinanceYear below.
  function applyOperatorYear() {
    var s = S(); if (!s || !s.alive) return;
    var trust = (s.finance || {}).familyTrustV1839; if (!trust || !trust.created) return;
    var op = trust.operatorV1872; if (!op || !op.hired || !op.tier) return;
    if (op._yr === round(num(s.age))) return; // once per year
    op._yr = round(num(s.age));
    var def = operatorDef(op.tier); if (!def || !def.returnRate) return;
    var titled = titledManagedValue();
    if (titled <= 0) { op.lastReturn = 0; op.lastFee = 0; return; }
    var gross = round(def.returnRate * titled);
    var fee = round(def.annualFeeRate * gross);
    var net = Math.max(0, gross - fee);
    trust.corpus = Math.max(0, round(num(trust.corpus) + net));
    op.lastReturn = net; op.lastFee = fee; op.totalGrown = round(num(op.totalGrown) + net);
    if (!Array.isArray(trust.history)) trust.history = [];
    trust.history.unshift({ age: round(num(s.age)), event: def.name + " grew the family office", amount: net });
    trust.history = trust.history.slice(0, 10);
    log("🏛️ " + def.name + " grew the family office by " + money(net) + " (after " + money(fee) + " operator fee).");
  }
  function operatorDesk() {
    var s = S(); if (!s) return "";
    var trust = (s.finance || {}).familyTrustV1839 || {};
    if (!trust.created) return "";
    var op = operatorState() || {};
    var titled = titledManagedValue();
    var cur = op.hired ? operatorDef(op.tier) : null;
    var status = cur
      ? '<div class="row-sub">Current: <b style="color:var(--accent-2)">' + esc(cur.name) + '</b> · last year grew the office ' + money(op.lastReturn) + ' (fee ' + money(op.lastFee) + ') · total grown ' + money(op.totalGrown) + '.</div>'
      : '<div class="row-sub">No operator. Your titled holdings (' + money(titled) + ') sit protected but aren\'t actively grown — hire someone to run + compound them into the trust each year.</div>';
    var cards = OPERATORS.map(function (d) {
      var active = op.hired && op.tier === d.id;
      var est = round(d.returnRate * titled);
      return '<div class="fo72-op-card' + (active ? " on" : "") + '"><div class="fo72-op-top"><b>' + esc(d.name) + '</b><span>' + esc(money(d.cost)) + '</span></div>' +
        '<div class="row-sub">' + esc(d.desc) + '</div>' +
        '<div class="lf-pill-row"><span class="lf-pill good">~' + (d.returnRate * 100).toFixed(1) + '%/yr</span><span class="lf-pill">' + Math.round(d.annualFeeRate * 100) + '% fee</span>' + (titled > 0 ? '<span class="lf-pill money">~' + esc(money(est)) + '/yr</span>' : '') + '</div>' +
        '<div class="mini-actions" style="margin-top:8px"><button class="money-btn ' + (active ? "blue" : "gold") + '" onclick="event.preventDefault();event.stopPropagation();hireOperatorV1872(\'' + d.id + '\')" ' + (active ? "disabled" : "") + '>' + (active ? "Running" : "Hire") + '</button></div></div>';
    }).join("");
    var fire = op.hired ? '<div class="mini-actions" style="margin-top:8px"><button class="money-btn red" onclick="event.preventDefault();event.stopPropagation();fireOperatorV1872()">Let operator go</button></div>' : "";
    return '<section class="panel" data-fo72-panel="operator"><div class="section-label">🤝 Family office operator</div>' + status + '<div class="fo72-op-grid">' + cards + '</div>' + fire + '</section>';
  }

  /* ----------------------------- PER-COMPANY TITLING (feature 3) -----------------------------
     Title a SPECIFIC founder company into the trust instead of the all-or-nothing portfolio toggle.
     Stores a per-company map on holdings.entrepreneurship.companiesV1872 ({id:true}); tax-legal's
     trustHeldEntrepreneurshipValueV1868 now reads it (per-company sum) and falls back to the master
     flag for old saves. Net worth is unchanged — titling only flags protection + carry. */
  function companyValueV1872(b) {
    b = b || {};
    if (b.active === false || b.dead) return 0;
    try {
      if (typeof window.bizV1860StakeValueV1861 === "function") return Math.max(0, round(window.bizV1860StakeValueV1861(b)));
    } catch (e) {}
    return Math.max(0, round((num(b.valuation) || num(b.value) || num(b.marketValue) || num(b.companyValue)) +
      (num(b.cashInBusiness) || num(b.retainedEarnings) || num(b.companyCash) || num(b.cash))));
  }
  window.titleEntrepreneurshipCompanyV1872 = function (id, titled) {
    if (!alive()) return;
    var s = S(); var trust = (s.finance || {}).familyTrustV1839;
    if (!trust || !trust.created) { toast("Create a family trust first."); return; }
    var h = trust.holdingsV1868 || (trust.holdingsV1868 = {});
    if (!h.entrepreneurship || typeof h.entrepreneurship !== "object") h.entrepreneurship = {};
    var ent = h.entrepreneurship;
    var biz0 = ((s.finance.bizV1860 || {}).businesses) || [];
    var hadWholePortfolio = !!ent.titled && !mapHasTitledCompanyV1872(ent.companiesV1872);
    if (!ent.companiesV1872 || typeof ent.companiesV1872 !== "object") {
      ent.companiesV1872 = {};
    } else {
      cleanCompanyMapV1872(ent.companiesV1872);
    }
    if (hadWholePortfolio && titled === false) {
      // If the whole portfolio was already titled via the all-or-nothing toggle, seed the map from the
      // live companies so per-company control takes over cleanly without dropping protection.
      biz0.forEach(function (b) {
        var key = companyKeyV1872(b);
        if (key && b && b.active !== false && !b.dead) ent.companiesV1872[key] = true;
      });
    }
    id = String(id == null ? "" : id);
    if (!validKey(id)) { toast("That founder company needs a valid id first."); return; }
    ent.companiesV1872[id] = !!titled;
    ent.titled = mapHasTitledCompanyV1872(ent.companiesV1872);
    ent.pct = 1;
    log((titled ? "Titled " : "Removed ") + "a founder company " + (titled ? "into" : "from") + " family trust protection.");
    saveGame(); rerender();
  };
  function founderTitlingDesk() {
    var s = S(); if (!s) return "";
    var f = s.finance || {};
    var trust = f.familyTrustV1839 || {};
    if (!trust.created) return "";
    var bizRaw = (f.bizV1860 || {}).businesses;
    var biz = Array.isArray(bizRaw) ? bizRaw : [];
    var live = biz.filter(function (b) { return b && b.active !== false && !b.dead; });
    if (!live.length) return "";
    var ent = (trust.holdingsV1868 || {}).entrepreneurship || {};
    var map = cleanCompanyMapV1872(ent.companiesV1872 || {});
    var mapHasAny = mapHasTitledCompanyV1872(map);
    var allViaMaster = ent.titled && !mapHasAny; // whole portfolio titled via Codex's all-or-nothing button
    var cards = live.map(function (b) {
      var id = companyKeyV1872(b);
      if (!id) return "";
      var titled = mapCompanyTitledV1872(map, b) || allViaMaster;
      var val = companyValueV1872(b);
      return '<div class="v1839-child-card"><span>' + esc(b.name || id) + '</span><b class="' + (titled ? "good" : "gold") + '">' + (titled ? "In trust" : "Personal") + '</b><em>Value ' + esc(money(val)) + '.</em>' +
        '<div class="v1839-mini-actions"><button class="money-btn ' + (titled ? "green" : "gold") + '" onclick="event.preventDefault();event.stopPropagation();titleEntrepreneurshipCompanyV1872(\'' + esc(jsArg(id)) + '\',' + (titled ? "false" : "true") + ')">' + (titled ? "Titled — remove" : "Title to trust") + '</button></div></div>';
    }).join("");
    return '<section class="panel" data-fo72-panel="founder"><div class="section-label">🚀 Title individual founder companies</div><div class="row-sub" style="margin-bottom:8px">Pick exactly which founder companies sit in the trust — protected and carried to heirs, still counted once in net worth.</div><div class="v1839-rail">' + cards + '</div></section>';
  }

  /* ----------------------------- holdings popup ----------------------------- */
  function row(icon, label, value, status, note) {
    var chip = status ? '<span class="fo72-chip ' + (status === "Protected" ? "good" : "gold") + '">' + esc(status) + '</span>' : "";
    return '<div class="fo72-row"><div class="fo72-row-main"><div class="fo72-row-title">' + esc(icon) + " " + esc(label) + '</div>' +
      (note ? '<div class="fo72-row-note">' + esc(note) + '</div>' : "") + '</div>' +
      '<div class="fo72-row-right"><b>' + esc(money(value)) + '</b>' + chip + '</div></div>';
  }
  function popBody() {
    var h = holdings();
    if (!h.created) {
      return '<div class="fo72-note">No family trust yet. Create one in the Family Trust hub, then title your property, founder companies, and businesses into it — they stay counted once in net worth, but become protected and carry to your heirs.</div>';
    }
    var rows =
      row("🏦", "Trust corpus", h.corpus, "Protected", "Liquid capital inside the trust.") +
      (h.childTrusts > 0 ? row("👶", "Child trusts", h.childTrusts, "Protected", "Earmarked for your heirs.") : "") +
      row("🏠", "Titled property", h.titledProperty, h.titledProperty > 0 ? "Protected" : "Open", h.titledProperty > 0 ? "Real estate equity, protected by the trust." : (h.propertyTotal > 0 ? "You hold " + money(h.propertyTotal) + " of property — title it to protect it." : "No property yet.")) +
      row("🚀", "Titled entrepreneurship", h.titledVenture, h.titledVenture > 0 ? "Protected" : "Open", h.titledVenture > 0 ? "Founder companies, protected by the trust." : "Title founder companies to protect them.") +
      row("🏢", "Titled businesses", h.titledBusiness, h.titledBusiness > 0 ? "Protected" : "Open", h.titledBusiness > 0 ? "Business shares titled into the trust." : "Title business shares in the Trust hub.");
    if (h.outsideManager > 0) rows += row("📈", "Outside manager capital", h.outsideManager, "Carries", "Externally managed capital — carries into the trust on succession. Move it into the corpus from the Trust hub to protect it now.");
    var op72 = operatorState() || {};
    var op72Def = op72.hired ? operatorDef(op72.tier) : null;
    if (op72Def) rows += row("🤝", "Operator", op72.totalGrown, "Active", op72Def.name + " · grew the office " + money(op72.lastReturn) + " last year.");

    var hero =
      '<div class="fo72-hero">' +
        '<div class="fo72-hero-cell"><span>Protected (under trust)</span><b class="gold">' + esc(money(h.protectedTotal)) + '</b><em>Shielded from estate tax · carries to heirs</em></div>' +
        '<div class="fo72-hero-cell"><span>Net worth</span><b>' + esc(money(h.net)) + '</b><em>Everything counted once</em></div>' +
      '</div>';

    var foot = '<div class="fo72-note">Titling protects an asset and carries it to your heirs — it does <b>not</b> add to net worth (each asset is still counted exactly once). ' +
      (h.propertyUntitled > 0 ? 'You have <b>' + money(h.propertyUntitled) + '</b> of property not yet titled.' : '') + '</div>';

    return hero + '<div class="fo72-rows">' + rows + '</div>' + foot +
      '<div class="fo72-actions">' +
        '<button class="money-btn gold" onclick="event.preventDefault();event.stopPropagation();closeFamilyOfficeV1872();(window.setTabV16||window.setTab||function(){})(\'trust\')">Open Family Trust hub</button>' +
      '</div>';
  }

  function ensureOverlay() {
    var el = document.getElementById("fo72-pop");
    if (el) return el;
    el = document.createElement("div");
    el.id = "fo72-pop";
    el.className = "fo72-backdrop";
    el.style.display = "none";
    el.addEventListener("click", function (e) { if (e.target === el) window.closeFamilyOfficeV1872(); });
    el.innerHTML = '<div class="fo72-sheet" role="dialog" aria-modal="true"><div class="fo72-head"><div class="fo72-title">🏛️ Family Office</div><button class="hub-close" onclick="closeFamilyOfficeV1872()">✕</button></div><div class="fo72-body" id="fo72-body"></div></div>';
    document.body.appendChild(el);
    return el;
  }
  function fillPop() {
    var bodyEl = document.getElementById("fo72-body");
    if (!bodyEl) return;
    try { bodyEl.innerHTML = popBody(); } catch (e) { bodyEl.innerHTML = '<div class="fo72-note">Could not load holdings.</div>'; }
  }
  window.openFamilyOfficeV1872 = function () {
    if (!alive()) return;
    window.__fo72Open = true;
    var el = ensureOverlay();
    fillPop();
    el.style.display = "flex";
  };
  window.closeFamilyOfficeV1872 = function () {
    window.__fo72Open = false;
    var el = document.getElementById("fo72-pop");
    if (el) el.style.display = "none";
  };
  document.addEventListener("keydown", function (e) {
    if ((e.key === "Escape" || e.keyCode === 27) && window.__fo72Open) window.closeFamilyOfficeV1872();
  });

  /* ----------------------------- launcher (injected into the Trust hub) ----------------------------- */
  function launcherPanel() {
    var h = holdings();
    return '<section class="panel fo72-launch" data-fo72-panel="launcher"><div class="fo72-launch-row"><div><div class="section-label">🏛️ Family office</div>' +
      '<div class="row-sub">One view of everything you hold and protect — ' + esc(money(h.protectedTotal)) + ' under trust.</div></div>' +
      '<button class="money-btn gold" onclick="event.preventDefault();event.stopPropagation();openFamilyOfficeV1872()">What you hold</button></div></section>';
  }
  function injectTrustPanels(html) {
    html = String(html || "");
    var top = "", desks = "";
    try { top = launcherPanel(); } catch (e1) {}
    try { desks += operatorDesk(); } catch (e2) {}
    try { desks += founderTitlingDesk(); } catch (e3) {}
    var bottom = desks ? '<div class="fo72-trust-desks" data-fo72-panel="desks">' + desks + '</div>' : "";
    var shellOpen = /<div class="v1839-legal-shell"[^>]*>/;
    if (shellOpen.test(html)) {
      html = html.replace(shellOpen, function (m) { return m + top; });
      if (bottom) {
        var idx = html.lastIndexOf("</div>");
        html = idx >= 0 ? html.slice(0, idx) + bottom + html.slice(idx) : html + bottom;
      }
      return html;
    }
    return top + html + bottom;
  }
  // Inject the launcher by wrapping renderHubContent (the real chokepoint) for the trust hub ids.
  function wrapHubLauncher() {
    var prev = window.renderHubContent || null;
    try { if (!prev && typeof renderHubContent === "function") prev = renderHubContent; } catch (e) {}
    if (typeof prev !== "function" || prev.__fo72) return;
    var wrapped = function (hubId) {
      var html = prev.apply(this, arguments) || "";
      var id = String(hubId || "").toLowerCase();
      if (id === "trust" || id === "trusts" || id === "familytrust") {
        // Keep Family Office panels inside the Trust content shell instead of loose after the overlay.
        return injectTrustPanels(html);
      }
      return html;
    };
    wrapped.__fo72 = true;
    window.renderHubContent = wrapped;
    try { renderHubContent = wrapped; } catch (e2) {}
  }
  // Keep the open popup fresh after any re-render (and auto-close on death / pending event).
  function wrapRender() {
    var prev = window.render || null;
    if (typeof prev !== "function" || prev.__fo72) return;
    var wrapped = function () {
      var out = prev.apply(this, arguments);
      try { if (window.__fo72Open) { if (!alive() || pending()) window.closeFamilyOfficeV1872(); else fillPop(); } } catch (e) {}
      return out;
    };
    wrapped.__fo72 = true;
    window.render = wrapped;
    try { render = wrapped; } catch (e2) {}
  }

  function installStyles() {
    if (!document || !document.head || document.getElementById("fo72-style")) return;
    var st = document.createElement("style");
    st.id = "fo72-style";
    st.textContent = [
      ".fo72-launch-row{display:flex;justify-content:space-between;align-items:center;gap:12px}",
      ".fo72-backdrop{position:fixed;inset:0;z-index:9100;display:flex;align-items:center;justify-content:center;padding:20px;background:radial-gradient(circle at 24% 0%,rgba(201,155,85,.08),transparent 34%),rgba(12,9,7,.82);backdrop-filter:blur(4px)}",
      ".fo72-sheet{display:flex;flex-direction:column;width:100%;max-width:560px;max-height:86vh;background:linear-gradient(180deg,var(--card) 0%,var(--bg) 70%);border:1px solid var(--line);border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,.55);animation:up .25s ease}",
      ".fo72-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 16px;border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--card);border-radius:14px 14px 0 0;z-index:1}",
      ".fo72-title{font-family:Fraunces,Georgia,serif;font-weight:700;font-size:22px;color:var(--ink)}",
      ".fo72-body{overflow-y:auto;padding:16px}",
      ".fo72-hero{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}",
      ".fo72-hero-cell{border:1px solid var(--line);border-radius:12px;background:rgba(0,0,0,.18);padding:12px}",
      ".fo72-hero-cell span{display:block;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.12em;color:var(--dim);font-size:8px}",
      ".fo72-hero-cell b{display:block;font-family:'JetBrains Mono',monospace;font-size:24px;color:var(--ink);letter-spacing:-.03em;margin:2px 0;line-height:1}.fo72-hero-cell b.gold{color:var(--money)}",
      ".fo72-hero-cell em{font-style:normal;font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--faint)}",
      ".fo72-rows{display:grid;gap:1px;background:var(--line);border:1px solid var(--line);border-radius:12px;overflow:hidden}",
      ".fo72-row{display:flex;justify-content:space-between;align-items:center;gap:12px;background:var(--card);padding:11px 13px}",
      ".fo72-row-title{font-weight:700;font-size:14px;color:var(--ink)}",
      ".fo72-row-note{font-family:'JetBrains Mono',monospace;font-size:9.5px;color:var(--dim);line-height:1.4;margin-top:2px}",
      ".fo72-row-right{flex-shrink:0;text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:4px}",
      ".fo72-row-right b{font-family:'JetBrains Mono',monospace;font-size:15px;color:var(--ink)}",
      ".fo72-chip{font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:.08em;text-transform:uppercase;border:1px solid var(--line);border-radius:999px;padding:2px 7px;color:var(--dim)}.fo72-chip.good{color:var(--good);border-color:rgba(143,175,108,.4)}.fo72-chip.gold{color:var(--accent);border-color:rgba(201,155,85,.4)}",
      ".fo72-note{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--dim);line-height:1.55;margin-top:12px}.fo72-note b{color:var(--accent-2)}",
      ".fo72-actions{display:flex;gap:8px;margin-top:14px}",
      ".fo72-trust-desks{display:grid;gap:14px}",
      ".fo72-op-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-top:10px}",
      ".fo72-op-card{border:1px solid var(--line);border-radius:12px;background:rgba(12,10,7,.4);padding:12px}.fo72-op-card.on{border-color:rgba(201,155,85,.6);background:rgba(50,37,20,.45)}",
      ".fo72-op-top{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:4px}.fo72-op-top b{color:var(--ink);font-size:14px}.fo72-op-top span{font-family:'JetBrains Mono',monospace;color:var(--money);font-size:11px}",
      "@media(max-width:460px){.fo72-hero{grid-template-columns:1fr}}"
    ].join("\n");
    document.head.appendChild(st);
  }

  // Apply the operator's yearly return by wrapping the core yearly resolver (runs once per ageUp).
  function wrapOperatorYear() {
    var prev = window.resolveLifeAndFinanceYear || (typeof resolveLifeAndFinanceYear === "function" ? resolveLifeAndFinanceYear : null);
    if (typeof prev !== "function" || prev.__fo72Year) return;
    var wrapped = function () { var r = prev.apply(this, arguments); try { applyOperatorYear(); } catch (e) {} return r; };
    wrapped.__fo72Year = true;
    window.resolveLifeAndFinanceYear = wrapped;
    try { resolveLifeAndFinanceYear = wrapped; } catch (e2) {}
  }

  installStyles();
  wrapHubLauncher();
  wrapRender();
  wrapOperatorYear();

  if (window.registerLedgerSystem) {
    window.registerLedgerSystem({
      id: "family-office",
      file: "pages/systems/family-office.js",
      status: "active",
      globals: ["openFamilyOfficeV1872", "closeFamilyOfficeV1872"],
      notes: "v18.72 Family Office. Holdings popup, operator, and per-company founder-company titling are active."
    });
  }
})();
