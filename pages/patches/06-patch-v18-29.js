/* LEDGER PATCH v18.29: manager firms, mandates, dividends, clear investment office controls */
(function () {
  if (window.__ledgerPatch1829Managers) return;
  window.__ledgerPatch1829Managers = true;

  function n(value, fallback) {
    var out = Number(value);
    return Number.isFinite(out) ? out : (fallback == null ? 0 : fallback);
  }
  function clamp(value, lo, hi) { return Math.max(lo, Math.min(hi, n(value))); }
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  function money(value) {
    var v = Math.round(n(value));
    var sign = v < 0 ? "-" : "";
    v = Math.abs(v);
    if (v >= 1e12) return sign + "$" + (v / 1e12).toFixed(1).replace(/\.0$/, "") + "T";
    if (v >= 1e9) return sign + "$" + (v / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
    if (v >= 1e6) return sign + "$" + (v / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (v >= 1e4) return sign + "$" + Math.round(v / 1000).toLocaleString() + "K";
    return sign + "$" + v.toLocaleString();
  }
  function pct(value) { return (n(value) * 100).toFixed(1).replace(/\.0$/, "") + "%"; }
  function signedPct(value) { return (n(value) >= 0 ? "+" : "") + pct(value); }
  function toast(msg) {
    try { if (typeof addToast === "function") return addToast(msg); } catch (e) {}
    try { if (typeof addLog === "function") return addLog(msg, {}); } catch (e) {}
    try { console.log(msg); } catch (e) {}
  }
  function log(msg, deltas) {
    try { if (typeof addLog === "function") return addLog(msg, deltas || {}); } catch (e) {}
    try { console.log(msg, deltas || {}); } catch (e) {}
  }
  function saveRender() {
    try { if (typeof save === "function") save(); } catch (e) {}
    try { if (typeof render === "function") render(); } catch (e) {}
  }
  function ensure() {
    try { if (typeof window.__ledgerEnsureStateSync18261 === "function") window.__ledgerEnsureStateSync18261(); } catch (e) {}
    try { if (typeof ensureStateShape === "function") ensureStateShape(); } catch (e) {}
    try { if ((typeof state === "undefined" || !state) && window.state) state = window.state; } catch (e) {}
    if (!window.state && typeof state !== "undefined") window.state = state;
    if (!window.state) window.state = {};
    try { if (typeof state === "undefined" || !state) state = window.state; } catch (e) {}
    var s = window.state;
    s.finance = s.finance || {};
    s.stats = s.stats || {};
    s.finance.incomeSources = s.finance.incomeSources || {};
    s.finance.externalManager = s.finance.externalManager || { id: null, capital: 0, lastReturn: 0, lastFee: 0 };
    s.finance.managerV1829 = s.finance.managerV1829 || {};
    var m = s.finance.managerV1829;
    m.mandate = m.mandate || "balanced";
    m.history = Array.isArray(m.history) ? m.history : [];
    m.pendingDistribution = Math.max(0, n(m.pendingDistribution));
    m.totalDividends = Math.max(0, n(m.totalDividends));
    m.totalFees = Math.max(0, n(m.totalFees));
    m.totalNetReturn = n(m.totalNetReturn);
    m.lastProcessedAge = n(m.lastProcessedAge, -1);
    if (s.money == null) s.money = 0;
    if (s.savings == null) s.savings = 0;
    if (s.finance.superSaver == null) s.finance.superSaver = 0;
    if (s.finance.brokerage == null) s.finance.brokerage = 0;
    return s;
  }

  var FIRMS = [
    { id: "vanguard", name: "Vanguard Index Office", min: 1000, upfront: 25, fee: .0015, target: .064, risk: .10, income: .012, taxEff: .16, ability: "Ultra-low fees, broad index exposure, steady retirement-style growth.", unlock: "Starter friendly" },
    { id: "blackrock", name: "BlackRock Global Allocation", min: 25000, upfront: 500, fee: .004, target: .077, risk: .14, income: .018, taxEff: .12, ability: "Mega-firm diversification, lower drawdowns, smoother performance during bad markets.", unlock: "$25K managed" },
    { id: "fidelity", name: "Fidelity Active Growth", min: 10000, upfront: 250, fee: .0065, target: .091, risk: .21, income: .010, taxEff: .08, ability: "Growth stock tilt with useful research and slightly higher upside.", unlock: "$10K managed" },
    { id: "berkshire", name: "Berkshire Value Desk", min: 50000, upfront: 1000, fee: .003, target: .084, risk: .16, income: .006, taxEff: .20, ability: "Value compounding, patient capital, and a drawdown guard when markets panic.", unlock: "$50K managed" },
    { id: "bridgewater", name: "Bridgewater Macro Hedge", min: 250000, upfront: 5000, fee: .012, target: .082, risk: .11, income: .015, taxEff: .05, ability: "Macro hedge. It can protect capital when market mood is weak or volatile.", unlock: "$250K managed" },
    { id: "renaissance", name: "Renaissance Quant Sleeve", min: 1000000, upfront: 25000, fee: .018, target: .118, risk: .20, income: .002, taxEff: .03, ability: "Quant alpha. High fees, but strong upside for very large accounts.", unlock: "$1M managed" },
    { id: "sequoia", name: "Sequoia Venture Track", min: 5000000, upfront: 50000, fee: .02, target: .155, risk: .38, income: 0, taxEff: .02, ability: "Venture boom/bust. Can explode upward, but drawdowns are ugly.", unlock: "$5M managed" }
  ];
  var MANDATES = {
    preservation: { name: "Preservation", returnAdj: -.018, riskAdj: -.45, incomeAdj: .006, taxAdj: .08, desc: "Protect capital first, lower upside, more cash-like behavior." },
    balanced: { name: "Balanced", returnAdj: 0, riskAdj: 0, incomeAdj: 0, taxAdj: 0, desc: "Normal blended strategy with moderate risk and some distributions." },
    growth: { name: "Growth", returnAdj: .024, riskAdj: .35, incomeAdj: -.008, taxAdj: -.03, desc: "Reinvest aggressively. Higher swings, lower yearly income." },
    income: { name: "Income", returnAdj: -.006, riskAdj: -.08, incomeAdj: .024, taxAdj: -.02, desc: "Prioritize dividends/distributions into checking." },
    taxsmart: { name: "Tax Smart", returnAdj: -.004, riskAdj: -.12, incomeAdj: -.003, taxAdj: .18, desc: "Lower taxable payouts and fees through tax-aware management." }
  };
  function firmById(id) { return FIRMS.find(function (f) { return f.id === id; }) || FIRMS[0]; }
  function mandateById(id) { return MANDATES[id] || MANDATES.balanced; }
  function manager() { return ensure().finance.externalManager; }
  function mgrState() { return ensure().finance.managerV1829; }
  function currentFirm() { return manager().id ? firmById(manager().id) : null; }
  function liquidCash() {
    var s = ensure();
    return Math.max(0, n(s.money) + n(s.savings) + n(s.finance.superSaver));
  }
  function pullCash(amount) {
    var s = ensure();
    var rem = Math.max(0, Math.round(n(amount)));
    rem = Math.min(rem, liquidCash());
    var paid = rem;
    var take = Math.min(Math.max(0, n(s.money)), rem); s.money = Math.round(n(s.money) - take); rem -= take;
    take = Math.min(Math.max(0, n(s.savings)), rem); s.savings = Math.round(n(s.savings) - take); rem -= take;
    take = Math.min(Math.max(0, n(s.finance.superSaver)), rem); s.finance.superSaver = Math.round(n(s.finance.superSaver) - take); rem -= take;
    return paid - rem;
  }
  function addChecking(amount) { var s = ensure(); s.money = Math.round(n(s.money) + Math.max(0, n(amount))); }
  function getCustom(id, max) {
    var el = document.getElementById(id);
    var raw = el ? String(el.value || "") : "";
    var out = Math.round(Number(raw.replace(/[^0-9.]/g, "")) || 0);
    if (max != null) out = Math.min(out, Math.max(0, n(max)));
    return Math.max(0, out);
  }
  function getAmount(raw, max) {
    if (raw === "all") return Math.max(0, n(max));
    if (raw === "half") return Math.round(Math.max(0, n(max)) / 2);
    if (raw === "custom") return getCustom("v1829-manager-custom", max);
    return Math.max(0, Math.min(Math.round(n(raw)), Math.max(0, n(max))));
  }
  function firmUnlocked(firm) {
    var cap = n(manager().capital);
    return cap >= n(firm.min) || liquidCash() >= n(firm.min) || n(ensure().money) >= n(firm.upfront);
  }

  window.hireManagerV1829 = function (firmId) {
    var s = ensure();
    var firm = firmById(firmId);
    if (!firm) return toast("Unknown management firm.");
    if (n(s.age) < 18) return toast("You need to be an adult to sign with an outside manager.");
    if (n(s.money) < firm.upfront) return toast("Need " + money(firm.upfront) + " checking for the onboarding fee.");
    s.money = Math.round(n(s.money) - firm.upfront);
    manager().id = firm.id;
    manager().name = firm.name;
    mgrState().mandate = mgrState().mandate || "balanced";
    log("Hired " + firm.name + ". Set a mandate and allocate capital when ready.", { money: -firm.upfront, confidence: 1 });
    saveRender();
  };
  window.setManagerMandateV1829 = function (id) {
    ensure();
    if (!MANDATES[id]) return toast("Unknown mandate.");
    mgrState().mandate = id;
    log("Outside manager mandate changed to " + MANDATES[id].name + ".", {});
    saveRender();
  };
  window.allocateToManagerV1829 = function (rawAmount) {
    ensure();
    var firm = currentFirm();
    if (!firm) return toast("Hire a management firm first.");
    var amt = getAmount(rawAmount, liquidCash());
    if (!amt) return toast("No cash available to allocate.");
    var pulled = pullCash(amt);
    if (!pulled) return toast("No cash available to allocate.");
    manager().capital = Math.round(n(manager().capital) + pulled);
    log("Allocated " + money(pulled) + " to " + firm.name + ".", { money: -pulled });
    saveRender();
  };
  window.withdrawFromManagerV1829 = function (rawAmount) {
    ensure();
    var mgr = manager();
    var amt = getAmount(rawAmount, n(mgr.capital));
    if (!amt) return toast("No managed money to withdraw.");
    mgr.capital = Math.max(0, Math.round(n(mgr.capital) - amt));
    addChecking(amt);
    log("Withdrew " + money(amt) + " from outside management to checking.", { money: amt });
    saveRender();
  };
  window.claimManagerDistributionV1829 = function () {
    var m = mgrState();
    var amt = Math.max(0, Math.round(n(m.pendingDistribution)));
    if (!amt) return toast("No pending manager distribution.");
    m.pendingDistribution = 0;
    addChecking(amt);
    ensure().finance.incomeSources.managerDistributionV1829 = Math.max(0, n(ensure().finance.incomeSources.managerDistributionV1829) + amt);
    log("Claimed " + money(amt) + " in outside-manager distributions to checking.", { money: amt });
    saveRender();
  };
  window.reinvestManagerDistributionV1829 = function () {
    var m = mgrState();
    var amt = Math.max(0, Math.round(n(m.pendingDistribution)));
    if (!amt) return toast("No pending manager distribution.");
    m.pendingDistribution = 0;
    manager().capital = Math.round(n(manager().capital) + amt);
    log("Reinvested " + money(amt) + " of manager distributions.", {});
    saveRender();
  };
  window.stressTestManagerV1829 = function () {
    ensure();
    var firm = currentFirm();
    if (!firm || n(manager().capital) <= 0) return toast("Hire a firm and allocate capital first.");
    var mandate = mandateById(mgrState().mandate);
    var risk = Math.max(.02, firm.risk * (1 + mandate.riskAdj));
    var bear = -Math.round(n(manager().capital) * risk * .72);
    var normal = Math.round(n(manager().capital) * (firm.target + mandate.returnAdj - firm.fee) * .60);
    mgrState().lastStressTest = { firm: firm.name, mandate: mandate.name, bear: bear, normal: normal, age: ensure().age || 0 };
    log("Ran a manager stress test: bear case " + money(bear) + ", normal case " + money(normal) + ".", {});
    saveRender();
  };

  function managerYearV1829() {
    var s = ensure();
    var m = mgrState();
    var mgr = manager();
    var age = n(s.age);
    if (!mgr.id || n(mgr.capital) <= 0) return;
    if (m.lastProcessedAge === age) return;
    m.lastProcessedAge = age;
    var firm = firmById(mgr.id);
    var mandate = mandateById(m.mandate);
    var marketReturn = n((s.market || {}).lastReturn);
    var mood = String((s.market || {}).mood || "normal").toLowerCase();
    var risk = Math.max(.02, firm.risk * (1 + mandate.riskAdj));
    var alpha = firm.target + mandate.returnAdj;
    if (firm.id === "blackrock" && (mood.indexOf("bad") >= 0 || marketReturn < -.08)) alpha += .018;
    if (firm.id === "bridgewater" && marketReturn < 0) alpha += Math.min(.05, Math.abs(marketReturn) * .55);
    if (firm.id === "berkshire" && marketReturn < -.12) risk *= .72;
    if (firm.id === "renaissance") alpha += clamp(n((s.stats || {}).smarts || s.smarts, 50) - 65, -10, 25) / 1000;
    if (firm.id === "sequoia" && Math.random() < .08) alpha += .45;
    var randomSwing = (Math.random() * 2 - 1) * risk;
    var grossRate = alpha + marketReturn * .28 + randomSwing;
    var gross = Math.round(n(mgr.capital) * grossRate);
    var fee = Math.max(0, Math.round(n(mgr.capital) * firm.fee));
    var distributionRate = Math.max(0, firm.income + mandate.incomeAdj);
    var distribution = Math.max(0, Math.round(Math.max(0, n(mgr.capital) + gross - fee) * distributionRate));
    var taxEfficiency = clamp(firm.taxEff + mandate.taxAdj, 0, .55);
    var taxableDistribution = Math.round(distribution * (1 - taxEfficiency));
    var net = gross - fee - distribution;
    mgr.capital = Math.max(0, Math.round(n(mgr.capital) + net));
    mgr.lastReturn = gross - fee;
    mgr.lastFee = fee;
    m.pendingDistribution = Math.max(0, Math.round(n(m.pendingDistribution) + distribution));
    m.totalDividends += distribution;
    m.totalFees += fee;
    m.totalNetReturn += gross - fee;
    m.lastGross = gross;
    m.lastFee = fee;
    m.lastDistribution = distribution;
    m.lastTaxableDistribution = taxableDistribution;
    m.lastNet = gross - fee;
    m.history.unshift({ age: age, firm: firm.name, mandate: mandate.name, startCapital: Math.round(n(mgr.capital) - net), gross: gross, fee: fee, distribution: distribution, taxableDistribution: taxableDistribution, net: gross - fee, endCapital: Math.round(n(mgr.capital)), returnRate: grossRate });
    m.history = m.history.slice(0, 12);
    s.finance.incomeSources.pendingManagerDistributionV1829 = m.pendingDistribution;
    s.finance.incomeSources.taxableManagerDistributionV1829 = Math.max(0, n(s.finance.incomeSources.taxableManagerDistributionV1829) + taxableDistribution);
    log(firm.name + " returned " + signedPct(grossRate) + " before fees; distribution pending " + money(distribution) + ".", { brokerage: gross - fee });
  }

  var previousAgeUp = window.ageUp || (typeof ageUp === "function" ? ageUp : null);
  if (previousAgeUp && !window.__ledgerAgeUp1829Wrapped) {
    window.__ledgerAgeUp1829Wrapped = true;
    window.ageUp = function () {
      var result = previousAgeUp.apply(this, arguments);
      try { managerYearV1829(); } catch (e) { console.error("v18.29 manager yearly failed", e); }
      try { if (typeof save === "function") save(); } catch (e) {}
      return result;
    };
    try { ageUp = window.ageUp; } catch (e) {}
  }
  window.processManagerYearV1829 = function () { managerYearV1829(); saveRender(); };

  function managerStatusLabel() {
    var firm = currentFirm();
    var mandate = mandateById(mgrState().mandate);
    if (!firm) return "No firm hired";
    return firm.name + " · " + mandate.name;
  }
  function firmCards() {
    var s = ensure();
    return FIRMS.map(function (firm) {
      var selected = currentFirm() && currentFirm().id === firm.id;
      var unlocked = firmUnlocked(firm);
      return '<div class="v1829-firm-card ' + (selected ? 'selected ' : '') + (!unlocked ? 'locked' : '') + '">' +
        '<div class="v1829-firm-top"><div><b>' + esc(firm.name) + '</b><span>' + esc(firm.ability) + '</span></div><strong>' + esc(firm.unlock) + '</strong></div>' +
        '<div class="v1829-chip-row"><span>Target ' + pct(firm.target) + '</span><span>Risk ' + pct(firm.risk) + '</span><span>Fee ' + pct(firm.fee) + '</span><span>Income ' + pct(firm.income) + '</span><span>Tax efficiency ' + pct(firm.taxEff) + '</span></div>' +
        '<button class="money-btn ' + (selected ? '' : 'green') + '" onclick="event.preventDefault();event.stopPropagation();hireManagerV1829(\'' + esc(firm.id) + '\')" ' + (selected || n(s.age) < 18 || n(s.money) < firm.upfront ? 'disabled' : '') + '>' + (selected ? 'Current Firm' : 'Hire ' + money(firm.upfront)) + '</button>' +
      '</div>';
    }).join('');
  }
  function mandateCards() {
    var current = mgrState().mandate;
    return Object.keys(MANDATES).map(function (id) {
      var mandate = MANDATES[id];
      return '<button class="v1829-mandate-card ' + (current === id ? 'active' : '') + '" onclick="event.preventDefault();event.stopPropagation();setManagerMandateV1829(\'' + esc(id) + '\')"><b>' + esc(mandate.name) + '</b><span>' + esc(mandate.desc) + '</span></button>';
    }).join('');
  }
  function historyRows() {
    var rows = (mgrState().history || []).slice(0, 7);
    if (!rows.length) return '<div class="v1829-note">No yearly manager history yet. Age up after hiring and allocating capital.</div>';
    return rows.map(function (r) {
      return '<div class="v1829-history-row"><span>Age ' + esc(r.age) + ' · ' + esc(r.firm) + '</span><b class="' + (n(r.net) >= 0 ? 'good' : 'bad') + '">' + money(r.net) + '</b><em>Gross ' + money(r.gross) + ' · fee ' + money(r.fee) + ' · distribution ' + money(r.distribution) + ' · capital ' + money(r.endCapital) + '</em></div>';
    }).join('');
  }
  function managerDeskHtml() {
    var s = ensure();
    var mgr = manager();
    var m = mgrState();
    var firm = currentFirm();
    var mandate = mandateById(m.mandate);
    var test = m.lastStressTest || null;
    return '<section class="panel v1829-manager-desk"><div class="section-label">Outside Management Firms v18.29</div>' +
      '<div class="v1829-hero"><div><b>Management firms now have abilities, fees, mandates, distributions, and withdrawal controls.</b><span>Hire a firm, pick a mandate, allocate capital, and decide whether to claim or reinvest distributions.</span></div></div>' +
      '<div class="v1829-grid four"><div class="v1829-stat"><span>Status</span><b>' + esc(managerStatusLabel()) + '</b></div><div class="v1829-stat"><span>Managed capital</span><b>' + money(mgr.capital) + '</b></div><div class="v1829-stat"><span>Pending distribution</span><b class="good">' + money(m.pendingDistribution) + '</b></div><div class="v1829-stat"><span>Last net after fee</span><b class="' + (n(m.lastNet) >= 0 ? 'good' : 'bad') + '">' + money(m.lastNet) + '</b></div></div>' +
      '<div class="v1829-note">Current mandate: <b>' + esc(mandate.name) + '</b>. ' + esc(mandate.desc) + (firm ? ' Firm ability: ' + esc(firm.ability) : ' Hire a firm to activate yearly management effects.') + '</div>' +
      '<div class="v1829-action-row"><button class="money-btn green" onclick="event.preventDefault();event.stopPropagation();allocateToManagerV1829(10000)" ' + (!firm || liquidCash() < 10000 ? 'disabled' : '') + '>Allocate $10K</button><button class="money-btn green" onclick="event.preventDefault();event.stopPropagation();allocateToManagerV1829(100000)" ' + (!firm || liquidCash() < 100000 ? 'disabled' : '') + '>Allocate $100K</button><button class="money-btn green" onclick="event.preventDefault();event.stopPropagation();allocateToManagerV1829(\'all\')" ' + (!firm || liquidCash() <= 0 ? 'disabled' : '') + '>Allocate Liquid</button><button class="money-btn" onclick="event.preventDefault();event.stopPropagation();withdrawFromManagerV1829(10000)" ' + (n(mgr.capital) < 10000 ? 'disabled' : '') + '>Withdraw $10K</button><button class="money-btn" onclick="event.preventDefault();event.stopPropagation();withdrawFromManagerV1829(\'all\')" ' + (n(mgr.capital) <= 0 ? 'disabled' : '') + '>Withdraw All</button></div>' +
      '<div class="v1829-custom-row"><input id="v1829-manager-custom" inputmode="numeric" placeholder="Custom allocation / withdrawal $"><button class="money-btn green" onclick="event.preventDefault();event.stopPropagation();allocateToManagerV1829(\'custom\')" ' + (!firm || liquidCash() <= 0 ? 'disabled' : '') + '>Allocate Custom</button><button class="money-btn" onclick="event.preventDefault();event.stopPropagation();withdrawFromManagerV1829(\'custom\')" ' + (n(mgr.capital) <= 0 ? 'disabled' : '') + '>Withdraw Custom</button></div>' +
      '<div class="v1829-action-row"><button class="money-btn gold" onclick="event.preventDefault();event.stopPropagation();claimManagerDistributionV1829()" ' + (n(m.pendingDistribution) <= 0 ? 'disabled' : '') + '>Claim Distribution</button><button class="money-btn blue" onclick="event.preventDefault();event.stopPropagation();reinvestManagerDistributionV1829()" ' + (n(m.pendingDistribution) <= 0 ? 'disabled' : '') + '>Reinvest Distribution</button><button class="money-btn blue" onclick="event.preventDefault();event.stopPropagation();stressTestManagerV1829()" ' + (!firm || n(mgr.capital) <= 0 ? 'disabled' : '') + '>Stress Test</button></div>' +
      (test ? '<div class="v1829-note">Last stress test: bear case <b class="bad">' + money(test.bear) + '</b>, normal case <b class="good">' + money(test.normal) + '</b>.</div>' : '') +
      '<div class="v1829-subtitle">Mandates</div><div class="v1829-mandate-grid">' + mandateCards() + '</div>' +
      '<div class="v1829-subtitle">Firms</div><div class="v1829-firm-grid">' + firmCards() + '</div>' +
      '<div class="v1829-subtitle">Performance History</div><div class="v1829-history">' + historyRows() + '</div>' +
    '</section>';
  }
  window.renderManagerDeskV1829 = managerDeskHtml;

  function removeOldManagerCards(html) {
    var out = String(html || "");
    ["Outside Management Firms v18.29", "🏢 Outside Management Firms"].forEach(function (marker) {
      var guard = 0;
      var idx = out.indexOf(marker);
      while (idx >= 0 && guard++ < 20) {
        var start = out.lastIndexOf("<section", idx);
        var end = out.indexOf("</section>", idx);
        if (start < 0 || end < 0 || end <= start) break;
        out = out.slice(0, start) + out.slice(end + 10);
        idx = out.indexOf(marker);
      }
    });
    return out;
  }
  function insertAfterFirstSection(html, chunk) {
    var source = String(html || "");
    var end = source.indexOf("</section>");
    return end >= 0 ? source.slice(0, end + 10) + chunk + source.slice(end + 10) : chunk + source;
  }

  var previousRender = window.renderHubContent || (typeof renderHubContent === "function" ? renderHubContent : null);
  if (previousRender && !window.__ledgerRender1829Wrapped) {
    window.__ledgerRender1829Wrapped = true;
    window.renderHubContent = function (hubId) {
      ensure();
      var html = "";
      try { html = previousRender.apply(this, arguments) || ""; } catch (e) { html = ""; }
      if (hubId === "brokerage" || hubId === "finance" || hubId === "money") {
        html = removeOldManagerCards(html);
        return insertAfterFirstSection(html, managerDeskHtml());
      }
      return html;
    };
    try { renderHubContent = window.renderHubContent; } catch (e) {}
  }

  function injectStyles() {
    if (document.getElementById("ledger-v1829-style")) return;
    var style = document.createElement("style");
    style.id = "ledger-v1829-style";
    style.textContent = [
      ".v1829-manager-desk{border-color:rgba(126,160,172,.52)!important;background:linear-gradient(135deg,rgba(16,30,33,.98),rgba(29,25,20,.98))!important;overflow:hidden!important}",
      ".v1829-hero{border:1px solid rgba(126,160,172,.28);border-radius:16px;padding:14px;margin:8px 0 12px;background:linear-gradient(135deg,rgba(126,160,172,.14),rgba(201,155,85,.07))}.v1829-hero b{display:block;font-size:18px;color:#fff3df}.v1829-hero span{display:block;font-family:'JetBrains Mono',monospace;font-size:10px;color:#b9a98e;line-height:1.5;margin-top:5px}",
      ".v1829-grid{display:grid;gap:8px;margin:10px 0}.v1829-grid.four{grid-template-columns:repeat(4,minmax(0,1fr))}.v1829-stat,.v1829-firm-card,.v1829-mandate-card,.v1829-history-row{border:1px solid rgba(255,255,255,.10);border-radius:13px;background:rgba(255,255,255,.045);padding:11px;min-width:0}.v1829-stat span{display:block;font-family:'JetBrains Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:.12em;color:#aa9a82}.v1829-stat b{display:block;margin-top:5px;color:#fff3df;font-size:16px;overflow-wrap:anywhere}.v1829-stat b.good,.v1829-history-row b.good{color:#b9dc8a}.v1829-stat b.bad,.v1829-history-row b.bad{color:#e9927d}",
      ".v1829-note{font-family:'JetBrains Mono',monospace;font-size:10px;color:#cdbb9c;line-height:1.55;border:1px solid rgba(255,255,255,.09);border-radius:12px;background:rgba(255,255,255,.04);padding:10px 12px;margin:9px 0}.v1829-note b{color:#d8ad6d}.v1829-note b.good{color:#b9dc8a}.v1829-note b.bad{color:#e9927d}.v1829-subtitle{font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.14em;color:#d8ad6d;font-size:10px;margin:14px 0 8px}",
      ".v1829-action-row{display:flex;gap:7px;flex-wrap:wrap;margin:8px 0}.v1829-action-row .money-btn{font-size:9px;padding:8px 10px}.v1829-custom-row{display:grid;grid-template-columns:minmax(120px,1fr) auto auto;gap:7px;margin:8px 0}.v1829-custom-row input{min-width:0}",
      ".v1829-mandate-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}.v1829-mandate-card{cursor:pointer;color:#f6ead8;text-align:left}.v1829-mandate-card.active{border-color:rgba(216,173,109,.72);background:rgba(216,173,109,.12)}.v1829-mandate-card b,.v1829-firm-card b{display:block;color:#fff3df;font-size:14px}.v1829-mandate-card span,.v1829-firm-card span,.v1829-history-row em{display:block;color:#aa9a82;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.45;margin-top:4px;font-style:normal}",
      ".v1829-firm-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.v1829-firm-card.selected{border-color:rgba(143,175,108,.62);background:rgba(143,175,108,.08)}.v1829-firm-card.locked{opacity:.65}.v1829-firm-top{display:flex;gap:10px;justify-content:space-between;align-items:flex-start}.v1829-firm-top strong{font-family:'JetBrains Mono',monospace;color:#d8ad6d;font-size:9px;text-transform:uppercase;letter-spacing:.08em;white-space:nowrap}.v1829-chip-row{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}.v1829-chip-row span{border:1px solid rgba(255,255,255,.10);border-radius:999px;background:rgba(255,255,255,.04);padding:4px 7px;color:#d8ad6d;font-family:'JetBrains Mono',monospace;font-size:9px}.v1829-firm-card .money-btn{width:100%;margin-top:8px}",
      ".v1829-history{display:grid;gap:7px}.v1829-history-row{display:grid;grid-template-columns:1fr auto;gap:7px;align-items:start}.v1829-history-row span{font-family:'JetBrains Mono',monospace;color:#d8ad6d;font-size:10px}.v1829-history-row em{grid-column:1/-1;margin-top:0}",
      "@media(max-width:980px){.v1829-grid.four{grid-template-columns:repeat(2,minmax(0,1fr))}.v1829-mandate-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:640px){.v1829-grid.four,.v1829-firm-grid,.v1829-mandate-grid,.v1829-custom-row{grid-template-columns:1fr}.v1829-action-row .money-btn{width:100%}.v1829-firm-top{display:block}.v1829-firm-top strong{display:inline-block;margin-top:6px}}"
    ].join("\n");
    document.head.appendChild(style);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", injectStyles); else injectStyles();
})();

