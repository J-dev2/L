/* ============================================================================
 * venture-lifecycle.js  (v18.60 — unified founder lifecycle)
 * ----------------------------------------------------------------------------
 * Binds the fragmented entrepreneurship systems into ONE lifecycle on the
 * canonical store state.finance.businesses[]:
 *   - one stage spine (idea→startup→growing→established→mature→declining→exited)
 *     with mappers from the 3 legacy vocabularies (core, startup-founder, desk)
 *   - self-funding: inject personal cash (equity) OR lend it (owner loan, repaid
 *     yearly with interest from the business)
 *   - decline & revive: a venture left untouched too long slides toward decline;
 *     working or funding it revives it
 *   - founder-path bonuses (builder/acquirer/investor/family)
 *
 * Concentrated here and wired via decorators (renderHubContent + the yearly
 * resolveLifeAndFinanceYear) so existing files barely change. Loads AFTER
 * business-entities.js and startup-founder.js. Fully guarded / try-caught.
 * ========================================================================== */
(function () {
  "use strict";
  if (window.__ledgerVentureLifecycleV1860Loaded) return;
  window.__ledgerVentureLifecycleV1860Loaded = true;

  // ---------------------------------------------------------------- helpers --
  function S() { try { if (typeof state !== "undefined" && state) return state; } catch (e) {} return window.state || {}; }
  function n(v, d) { var x = Number(v); return Number.isFinite(x) ? x : (d || 0); }
  function round(v) { return Math.round(n(v)); }
  function clampN(v, a, b) { return Math.max(a, Math.min(b, n(v))); }
  function fin() { var s = S(); if (!s.finance || typeof s.finance !== "object") s.finance = {}; if (!Array.isArray(s.finance.businesses)) s.finance.businesses = []; return s.finance; }
  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" })[c]; }); }
  function moneyText(v) { try { if (typeof window.money === "function") return window.money(round(v)); } catch (e) {} return "$" + round(v).toLocaleString(); }
  function compact(v) {
    v = round(v); var a = Math.abs(v), sign = v < 0 ? "-" : "";
    if (a >= 1e12) return sign + "$" + (a / 1e12).toFixed(a >= 1e13 ? 1 : 2).replace(/\.0+$/, "") + "T";
    if (a >= 1e9) return sign + "$" + (a / 1e9).toFixed(a >= 1e10 ? 1 : 2).replace(/\.0+$/, "") + "B";
    if (a >= 1e6) return sign + "$" + (a / 1e6).toFixed(a >= 1e7 ? 1 : 2).replace(/\.0+$/, "") + "M";
    if (a >= 1e3) return sign + "$" + (a / 1e3).toFixed(a >= 1e4 ? 1 : 2).replace(/\.0+$/, "") + "K";
    return moneyText(v);
  }
  function logLine(t, d) { try { if (typeof window.addLog === "function") window.addLog(t, d || {}); } catch (e) {} }
  function toast(t) { try { if (typeof window.addToast === "function") return window.addToast(t); } catch (e) {} logLine(t); }
  function applyDeltas(d) { try { if (d && Object.keys(d).length && typeof window.applyDeltas === "function") window.applyDeltas(d); } catch (e) {} }
  function saveGame() { try { if (typeof window.save === "function") window.save(); } catch (e) {} }
  function rerender() {
    try { var hub = window.tab || "business"; if (typeof window.renderHubInPlaceV16 === "function") return window.renderHubInPlaceV16(hub); } catch (e) {}
    try { if (typeof window.render === "function") window.render(); } catch (e2) {}
  }
  function saveRender() { saveGame(); rerender(); }
  function age() { return n(S().age); }
  function readAmt(id, max) {
    var el = typeof document !== "undefined" ? document.getElementById(id) : null;
    var raw = String(el && el.value || "").replace(/[^0-9.]/g, "");
    var amt = Math.max(0, round(raw));
    if (max != null) amt = Math.min(amt, Math.max(0, round(max)));
    if (el) el.value = "";
    return amt;
  }

  // ---------------------------------------------------------- stage spine ----
  var STAGE_ORDER = ["idea", "startup", "growing", "established", "mature", "declining", "exited"];
  var STAGE_LABEL = { idea: "Idea", startup: "Startup", growing: "Growing", established: "Established", mature: "Mature", declining: "Declining", exited: "Exited" };
  var STAGE_ICON = { idea: "💡", startup: "🌱", growing: "📈", established: "🏢", mature: "🏛️", declining: "📉", exited: "🏁" };
  var LEGACY_MAP = {
    idea: "idea", startup: "startup", growing: "growing", established: "established", mature: "mature", declining: "declining", exited: "exited",
    breakout: "established",                    // core ventures
    building: "startup", launched: "growing", growth: "growing", scale: "established", dead: "exited" // startup-founder
  };
  function mapStage(stage) { return LEGACY_MAP[String(stage || "").toLowerCase()] || null; }

  function ventureStageOf(b) {
    if (!b) return "startup";
    var mapped = mapStage(b.stageV1860 || b.stage);
    if (mapped) return mapped;
    return n(b.value) > 0 ? "established" : "startup";
  }
  function ventureStageLabel(b) { return STAGE_LABEL[ventureStageOf(b)] || "Startup"; }
  function ventureStageIcon(b) { return STAGE_ICON[ventureStageOf(b)] || "🌱"; }

  function catalogFor(b) {
    try {
      var cat = (typeof window.entrepreneurshipCatalog !== "undefined" && Array.isArray(window.entrepreneurshipCatalog)) ? window.entrepreneurshipCatalog : [];
      return cat.find(function (x) { return String(x.id) === String((b && (b.baseId || b.catalogId || b.id))); }) ||
        cat.find(function (x) { return String(x.id) === String(b && b.id); }) || {};
    } catch (e) { return {}; }
  }
  function startupCost(b) { var v = catalogFor(b); return v && v.startup ? n(v.startup) : Math.max(2500, round(n(b && b.value) / 4) || 2500); }
  function neglectYears(b) { if (!b) return 0; var last = b.lastTouchedAgeV1860; if (last == null) { b.lastTouchedAgeV1860 = age(); return 0; } return Math.max(0, age() - n(last)); }
  function touch(b) { if (b) b.lastTouchedAgeV1860 = age(); }
  function findBiz(id) { var list = fin().businesses; for (var i = 0; i < list.length; i++) { if (String(list[i].id) === String(id)) return list[i]; } return null; }
  function activeStartupCo() {
    try {
      var sf = fin().startupV1856 || {};
      return sf.co && typeof sf.co === "object" ? sf.co : null;
    } catch (e) { return null; }
  }
  function activeStartupId(c) {
    c = c || activeStartupCo();
    return c ? "founder_active_" + String(c.type || "startup") : "";
  }
  function catalogLookupId(b) { return String((b && (b.baseId || b.catalogId || b.id)) || ""); }
  function ensureActiveStartupBridge(c) {
    c = c || activeStartupCo();
    if (!c) return null;
    var f = fin();
    var id = activeStartupId(c);
    var existing = findBiz(id);
    if (!existing) {
      existing = {
        id: id,
        baseId: "startup_" + String(c.type || "startup"),
        catalogId: String(c.type || "startup"),
        name: c.name || "Active startup",
        category: "Tech & Startups",
        sector: "Tech & Startups",
        value: Math.max(0, round(n(c.valuation))),
        years: Math.max(0, round(n(c.age))),
        reputation: Math.max(10, round(35 + n(c.productQuality) / 3 + n(c.momentum) * 8)),
        lastIncome: 0,
        retainedEarnings: Math.max(0, round(n(c.cash))),
        stage: c.stage || "building",
        stageV1860: mapStage(c.stage) || "startup",
        founderActiveV1860: true,
        linkedStartupV1856: true,
        failureRisk: .09
      };
      f.businesses.push(existing);
    }
    existing.name = c.name || existing.name;
    existing.value = Math.max(0, round(n(c.valuation)));
    existing.years = Math.max(0, round(n(c.age)));
    existing.retainedEarnings = Math.max(0, round(n(c.cash)));
    existing.stage = c.stage || existing.stage || "building";
    existing.stageV1860 = mapStage(c.stage) || existing.stageV1860 || "startup";
    existing.founderActiveV1860 = true;
    existing.linkedStartupV1856 = true;
    existing.baseId = existing.baseId || ("startup_" + String(c.type || "startup"));
    existing.catalogId = existing.catalogId || String(c.type || "startup");
    return existing;
  }
  function retireActiveStartupBridge(c, graduatedBiz) {
    c = c || activeStartupCo();
    var id = activeStartupId(c);
    if (!id) return;
    var list = fin().businesses;
    for (var i = list.length - 1; i >= 0; i -= 1) {
      if (String(list[i].id) === String(id)) list.splice(i, 1);
    }
    if (graduatedBiz) {
      graduatedBiz.founderActiveV1860 = false;
      graduatedBiz.linkedStartupV1856 = false;
      graduatedBiz.stageV1860 = mapStage(graduatedBiz.stage) || "growing";
    }
  }

  // Recompute the unified stage from fundamentals + neglect. Runs AFTER the core
  // yearly loop (which already did income/value), so it only sets b.stageV1860.
  function advanceVentureStage(b) {
    if (!b) return;
    var cur = ventureStageOf(b);
    if (cur === "exited") return;
    var rep = n(b.reputation, 10);
    var val = n(b.value);
    var cost = startupCost(b);
    var neglect = neglectYears(b);
    if (cur === "declining") {
      if (neglect <= 1) b.stageV1860 = rep >= 78 ? "established" : "growing"; // revived
      return;
    }
    if (neglect >= 4 && cur !== "startup") { b.stageV1860 = "declining"; return; }
    var next = cur;
    if (rep >= 60 && cur === "startup") next = "growing";
    if (rep >= 82 && val > cost * 3 && (cur === "startup" || cur === "growing")) next = "established";
    if (next === "established" && n(b.years) >= 12 && rep >= 78) next = "mature";
    b.stageV1860 = next;
  }

  // ---------------------------------------------------- founder-path bonus ---
  // Small, readable modifiers so the chosen path actually changes the game.
  function founderPath() { var f = fin(); var e = f.entrepreneurshipV1841 || {}; return String(e.path || "undecided"); }
  // multiplier applied to self-funding growth effect / yield, by path
  function pathInjectBonus() { return founderPath() === "builder" ? 1.4 : founderPath() === "investor" ? 1.2 : 1; }
  function pathLoanRate(base) { return founderPath() === "investor" ? base * 0.8 : founderPath() === "family" ? base * 0.85 : base; }
  function yearlyModifiers(b) {
    var path = founderPath();
    var stage = ventureStageOf(b);
    var out = { incomeMult: 1, valueMult: 1, yieldMult: 1, riskCut: 0, stage: stage, skipCoreIncome: !!(b && b.founderActiveV1860) };
    if (path === "builder") { out.incomeMult += .06; out.valueMult += .12; }
    else if (path === "investor") { out.yieldMult += .18; out.riskCut += .015; }
    else if (path === "acquirer") { out.incomeMult += stage === "established" || stage === "mature" ? .08 : .03; out.riskCut += .01; }
    else if (path === "family") { out.riskCut += .025; out.valueMult += .04; }
    if (stage === "declining") { out.incomeMult *= .72; out.yieldMult *= .55; out.valueMult *= .90; }
    if (stage === "mature") { out.yieldMult += .12; out.riskCut += .01; }
    return out;
  }
  window.ventureFounderPathBonusV1860 = { inject: pathInjectBonus, loanRate: pathLoanRate, path: founderPath };
  window.ventureYearlyModifiersV1860 = yearlyModifiers;
  window.ventureCatalogLookupIdV1860 = catalogLookupId;
  window.ensureActiveStartupBridgeV1860 = ensureActiveStartupBridge;
  window.retireActiveStartupBridgeV1860 = retireActiveStartupBridge;

  // ------------------------------------------------------------ self-fund ----
  function injectVentureCapital(id, amount) {
    var s = S(); var b = findBiz(id);
    if (!b) return toast("That venture is not in your portfolio.");
    var activeCo = b.founderActiveV1860 ? activeStartupCo() : null;
    var cash = Math.max(0, round(s.money));
    var amt = amount === "max" ? cash : Math.min(cash, Math.max(0, round(amount)));
    if (!amt) return toast("No cash available to invest.");
    s.money = round(n(s.money) - amt);
    b.retainedEarnings = round(n(b.retainedEarnings) + amt);
    b.value = round(n(b.value) + amt);                  // equity in = enterprise value up
    if (activeCo) {
      activeCo.cash = round(n(activeCo.cash) + amt);
      activeCo.valuation = Math.max(n(activeCo.valuation), round(n(activeCo.valuation) + amt * .8));
    }
    b.injectedCapitalV1860 = round(n(b.injectedCapitalV1860) + amt);
    var repGain = Math.min(10, Math.round(amt / Math.max(20000, startupCost(b)) * pathInjectBonus()));
    if (repGain > 0) b.reputation = clampN(n(b.reputation, 10) + repGain, 0, 100);
    touch(b);
    advanceVentureStage(b);
    logLine("Invested " + moneyText(amt) + " of your own cash into " + (b.name || "your venture") + ". Reputation +" + repGain + ".", { money: -amt });
    applyDeltas({ confidence: 1 });
    saveRender();
  }
  function lendVentureCapital(id, amount) {
    var s = S(); var b = findBiz(id);
    if (!b) return toast("That venture is not in your portfolio.");
    var activeCo = b.founderActiveV1860 ? activeStartupCo() : null;
    var cash = Math.max(0, round(s.money));
    var amt = amount === "max" ? cash : Math.min(cash, Math.max(0, round(amount)));
    if (!amt) return toast("No cash available to lend.");
    s.money = round(n(s.money) - amt);
    b.retainedEarnings = round(n(b.retainedEarnings) + amt);
    if (activeCo) activeCo.cash = round(n(activeCo.cash) + amt);
    if (!b.ownerLoanV1860 || typeof b.ownerLoanV1860 !== "object") b.ownerLoanV1860 = { principal: 0, rate: pathLoanRate(.06) };
    b.ownerLoanV1860.principal = round(n(b.ownerLoanV1860.principal) + amt);
    b.ownerLoanV1860.rate = pathLoanRate(b.ownerLoanV1860.rate || .06);
    touch(b);
    logLine("Lent " + moneyText(amt) + " to " + (b.name || "your venture") + " as an owner loan (repaid yearly with interest).", { money: -amt });
    saveRender();
  }
  window.injectVentureCapitalV1860 = injectVentureCapital;
  window.lendVentureCapitalV1860 = lendVentureCapital;
  window.injectVentureCustomV1860 = function (id, inputId) { injectVentureCapital(id, readAmt(inputId)); };
  window.lendVentureCustomV1860 = function (id, inputId) { lendVentureCapital(id, readAmt(inputId)); };
  window.ventureStageOfV1860 = ventureStageOf;
  window.ventureStageLabelV1860 = ventureStageLabel;
  window.ventureStageIconV1860 = ventureStageIcon;

  // Total owner-loan principal outstanding (a player receivable for net worth).
  window.ventureOwnerLoanTotalV1860 = function () {
    return fin().businesses.reduce(function (sum, b) { return sum + Math.max(0, round(n(b.ownerLoanV1860 && b.ownerLoanV1860.principal))); }, 0);
  };

  // ------------------------------------------------------ yearly mechanics ---
  // Repay owner loans from business cash to the player; ~5-yr amortization.
  function repayOwnerLoans() {
    var s = S();
    ensureActiveStartupBridge();
    fin().businesses.forEach(function (b) {
      if (b && b._migratedToBizV1861) return; // owned by entrepreneur port (bizV1860)
      var loan = b.ownerLoanV1860;
      if (!loan || n(loan.principal) <= 0) return;
      var rate = n(loan.rate, .06);
      var due = Math.max(0, Math.round(n(loan.principal) * (1 + rate) / 5));
      var cash = Math.max(0, round(n(b.retainedEarnings)));
      var pay = Math.min(due, cash);
      if (pay <= 0) return;
      b.retainedEarnings = round(cash - pay);
      var interestPortion = Math.round(pay * (rate / (1 + rate)));
      loan.principal = Math.max(0, round(n(loan.principal) - (pay - interestPortion)));
      s.money = round(n(s.money) + pay);
      logLine((b.name || "Your venture") + " repaid " + moneyText(pay) + " on your owner loan" + (loan.principal <= 0 ? " (paid off)." : "."), { money: pay });
    });
  }
  // Erosion for neglected ventures (decline lifecycle). The core loop still gives
  // passive yield; this nudges neglected, non-startup ventures downward.
  function applyDecline() {
    ensureActiveStartupBridge();
    fin().businesses.forEach(function (b) {
      if (b && b._migratedToBizV1861) return; // owned by entrepreneur port (bizV1860)
      var neglect = neglectYears(b);
      var stage = ventureStageOf(b);
      if (neglect >= 3 && stage !== "startup" && stage !== "exited") {
        var hit = Math.min(18, 4 + neglect * 2);
        b.reputation = clampN(n(b.reputation, 10) - hit, 0, 100);
        b.value = Math.max(0, round(n(b.value) * (1 - Math.min(.18, neglect * 0.035))));
        if (neglect >= 5) logLine((b.name || "A venture") + " is sliding without your attention — reputation and value are eroding.", {});
      }
      advanceVentureStage(b);
    });
  }

  var prevResolveV1860 = window.resolveLifeAndFinanceYear || (typeof resolveLifeAndFinanceYear === "function" ? resolveLifeAndFinanceYear : null);
  if (prevResolveV1860 && !window.__ledgerVentureResolveV1860Wrapped) {
    window.__ledgerVentureResolveV1860Wrapped = true;
    window.resolveLifeAndFinanceYear = function () {
      var out = prevResolveV1860.apply(this, arguments);
      try { repayOwnerLoans(); } catch (e) {}
      try { applyDecline(); } catch (e2) {}
      return out;
    };
    try { resolveLifeAndFinanceYear = window.resolveLifeAndFinanceYear; } catch (e3) {}
  }

  // Mark a venture "touched" whenever the player works or funds it (neglect reset).
  ["workVenture", "workVentureV1830"].forEach(function (fnName) {
    var prev = window[fnName] || (typeof window[fnName] === "function" ? window[fnName] : null);
    if (typeof prev === "function" && !prev.__ventureTouchV1860) {
      var wrapped = function (id) { try { var b = findBiz(id); if (b) touch(b); } catch (e) {} return prev.apply(this, arguments); };
      wrapped.__ventureTouchV1860 = true;
      window[fnName] = wrapped;
      try { if (fnName === "workVenture") workVenture = wrapped; } catch (e4) {}
    }
  });

  // -------------------------------------------------------------- render -----
  function fundingSection() {
    ensureActiveStartupBridge();
    var list = fin().businesses;
    // Phase 0 of the entrepreneur port: suppress the empty-state panel (the active
    // startup lives in startupV1856.co, not businesses[]), so it no longer misleads.
    if (!list.length) return "";
    var cards = list.map(function (b) {
      var id = String(b.id);
      var stage = ventureStageOf(b);
      var loan = Math.max(0, round(n(b.ownerLoanV1860 && b.ownerLoanV1860.principal)));
      var cid = "v1860-fund-" + esc(id);
      var declining = stage === "declining";
      return '<div class="v1860-fund-card' + (declining ? " declining" : "") + '">' +
        '<div class="v1860-fund-head"><div><b>' + ventureStageIcon(b) + ' ' + esc(b.name || "Venture") + '</b>' +
        '<span>' + esc(STAGE_LABEL[stage] || "Startup") + ' · value ' + compact(b.value) + ' · rep ' + round(b.reputation) + (loan ? ' · owner loan ' + compact(loan) : '') + '</span></div></div>' +
        (declining ? '<div class="v1860-fund-warn">Declining from neglect — work or fund it to revive.</div>' : '') +
        '<div class="v1860-fund-actions">' +
        btn("Invest $10K", "injectVentureCapitalV1860('" + esc(id) + "',10000)", n(S().money) < 10000) +
        btn("Invest $100K", "injectVentureCapitalV1860('" + esc(id) + "',100000)", n(S().money) < 100000) +
        btn("Lend $25K", "lendVentureCapitalV1860('" + esc(id) + "',25000)", n(S().money) < 25000) +
        btn("Lend $250K", "lendVentureCapitalV1860('" + esc(id) + "',250000)", n(S().money) < 250000) +
        '</div>' +
        '<div class="v1860-fund-custom"><input id="' + cid + '" inputmode="numeric" placeholder="Custom $">' +
        '<button class="money-btn green" onclick="event.preventDefault();event.stopPropagation();injectVentureCustomV1860(\'' + esc(id) + '\',\'' + cid + '\')">Invest</button>' +
        '<button class="money-btn blue" onclick="event.preventDefault();event.stopPropagation();lendVentureCustomV1860(\'' + esc(id) + '\',\'' + cid + '\')">Lend</button></div>' +
        '</div>';
    }).join("");
    return '<section class="panel v1860-founder-capital"><div class="section-label">💼 Founder Capital</div>' +
      '<div class="row-sub" style="margin-bottom:8px">Put your own money in: <b>Invest</b> adds equity (raises value + reputation, no repayment) · <b>Lend</b> is an owner loan the business repays yearly with interest.</div>' +
      '<div class="v1860-fund-grid">' + cards + '</div></section>';
  }
  function btn(label, handler, disabled) {
    return '<button class="money-btn" onclick="event.preventDefault();event.stopPropagation();' + handler + '"' + (disabled ? " disabled" : "") + '>' + esc(label) + '</button>';
  }

  var prevRenderHubContentV1860 = window.renderHubContent || (typeof renderHubContent === "function" ? renderHubContent : null);
  if (typeof prevRenderHubContentV1860 === "function" && !prevRenderHubContentV1860.__ventureCapitalV1860) {
    var wrappedRHC = function (hubId) {
      var html = prevRenderHubContentV1860.apply(this, arguments) || "";
      try {
        var id = String(hubId || "").toLowerCase();
        // Business hub now has a per-company "Capital" popup (openBizModalV1862(id,'capital')),
        // so the global all-companies Founder Capital list is only appended on entrepreneurship.
        if (id === "entrepreneurship") html += fundingSection();
      } catch (e) {}
      return html;
    };
    wrappedRHC.__ventureCapitalV1860 = true;
    window.renderHubContent = wrappedRHC;
    try { renderHubContent = wrappedRHC; } catch (e5) {}
  }

  // -------------------------------------------------------------- styles -----
  try {
    if (typeof document !== "undefined" && document.head && !document.getElementById("v1860-style")) {
      var st = document.createElement("style");
      st.id = "v1860-style";
      st.textContent = [
        ".v1860-founder-capital .v1860-fund-grid{display:grid;gap:10px;margin-top:8px}",
        ".v1860-fund-card{border:1px solid rgba(255,255,255,.11);border-radius:12px;background:rgba(255,255,255,.045);padding:11px}",
        ".v1860-fund-card.declining{border-color:rgba(233,146,125,.5)}",
        ".v1860-fund-head b{display:block;color:#fff3df;font-size:15px}.v1860-fund-head span{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;margin-top:3px}",
        ".v1860-fund-warn{color:#e9927d;font-family:'JetBrains Mono',monospace;font-size:10px;margin-top:6px}",
        ".v1860-fund-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px}",
        ".v1860-fund-custom{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:7px;margin-top:8px}",
        ".v1860-fund-custom input{min-width:0;border:1px solid rgba(216,173,109,.32);border-radius:8px;background:#100d0a;color:#f6ead8;padding:9px;font-family:'JetBrains Mono',monospace;font-size:11px}"
      ].join("\n");
      document.head.appendChild(st);
    }
  } catch (e) {}

  if (window.registerLedgerSystem) {
    window.registerLedgerSystem({
      id: "venture-lifecycle",
      file: "pages/systems/venture-lifecycle.js",
      status: "active",
      globals: ["injectVentureCapitalV1860", "lendVentureCapitalV1860", "ventureStageOfV1860", "ventureOwnerLoanTotalV1860"],
      notes: "Unified entrepreneurship lifecycle: stage spine, self-funding (equity inject + owner loan), yearly loan repayment, neglect/decline & revive, founder-path bonuses."
    });
  }
})();
