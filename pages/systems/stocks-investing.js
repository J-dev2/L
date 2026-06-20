/* Investments system bridge and label normalization. */
(function () {
  if (window.__ledgerInvestmentsLabelV1837Loaded) return;
  window.__ledgerInvestmentsLabelV1837Loaded = true;
  window.__ledgerInvestmentsRefreshV1838Loaded = true;

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch];
    });
  }

  function n(value, fallback) {
    var num = Number(value);
    return Number.isFinite(num) ? num : (fallback || 0);
  }

  function round(value) {
    return Math.round(n(value));
  }

  function stateNow() {
    try { if (typeof state !== "undefined" && state) return state; } catch (e) {}
    return window.state || {};
  }

  function moneyText(value) {
    try { if (typeof money === "function") return money(round(value)); } catch (e) {}
    return "$" + round(value).toLocaleString();
  }

  function compactMoney(value) {
    value = round(value);
    var abs = Math.abs(value);
    var sign = value < 0 ? "-" : "";
    if (abs >= 1000000000000) return sign + "$" + (abs / 1000000000000).toFixed(abs >= 10000000000000 ? 1 : 2).replace(/\.0+$/, "") + "T";
    if (abs >= 1000000000) return sign + "$" + (abs / 1000000000).toFixed(abs >= 10000000000 ? 1 : 2).replace(/\.0+$/, "") + "B";
    if (abs >= 1000000) return sign + "$" + (abs / 1000000).toFixed(abs >= 10000000 ? 1 : 2).replace(/\.0+$/, "") + "M";
    if (abs >= 1000) return sign + "$" + (abs / 1000).toFixed(abs >= 10000 ? 1 : 2).replace(/\.0+$/, "") + "K";
    return moneyText(value);
  }

  function financeNow() {
    var s = stateNow();
    if (!s.finance || typeof s.finance !== "object") s.finance = {};
    return s.finance;
  }

  function stockValue() {
    try { if (typeof stockValue18 === "function") return Math.max(0, round(stockValue18())); } catch (e) {}
    var f = financeNow();
    var m = f.stocksV18 || {};
    if (!Array.isArray(m.holdings)) return Math.max(0, round(f.stockValue));
    return Math.max(0, round(m.holdings.reduce(function (sum, h) {
      var price = n(m.prices && (m.prices[h.id] != null ? m.prices[h.id] : m.prices[h.symbol]));
      if (!price) price = n(h.price || h.currentPrice || h.avgCost);
      return sum + n(h.shares) * price;
    }, 0)));
  }

  function liquidCash() {
    var s = stateNow();
    var f = financeNow();
    return Math.max(0, round(n(s.money) + n(s.savings) + n(f.superSaver)));
  }

  function totalInvested() {
    var f = financeNow();
    return Math.max(0, round(n(f.brokerage) + stockValue() + n(f.managedPortfolio) + n((f.externalManager || {}).capital) + n((f.managerFirmsV1829 || {}).capital)));
  }

  function investmentSnapshot() {
    var f = financeNow();
    var external = f.externalManager || {};
    var firmDesk = f.managerFirmsV1829 || {};
    var personalFirm = f.personalFirm || {};
    var manager = Math.max(0, round(n(external.capital) + n(firmDesk.capital)));
    var personal = Math.max(0, round(n(f.managedPortfolio) + n(personalFirm.cash)));
    var pending = Math.max(0, round(n(external.pendingDistribution) + n(firmDesk.pendingDistribution) + n(f.fundPendingDistribution)));
    return {
      checking: Math.max(0, round(n(stateNow().money))),
      liquid: liquidCash(),
      brokerage: Math.max(0, round(n(f.brokerage))),
      stocks: stockValue(),
      manager: manager,
      personal: personal,
      pending: pending,
      total: Math.max(0, round(n(f.brokerage) + stockValue() + manager + personal))
    };
  }

  function parseMoneyInput(value) {
    var raw = String(value == null ? "" : value).replace(/[^0-9.]/g, "");
    return raw ? Math.max(0, round(Number(raw) || 0)) : 0;
  }

  function inputContext(input) {
    var id = String((input && input.id) || "").toLowerCase();
    var snap = investmentSnapshot();
    var brokerage = snap.brokerage;
    var manager = snap.manager;
    var personal = snap.personal;
    var stock = snap.stocks;
    var liquid = snap.liquid;
    if (/manager/.test(id) && (/out|withdraw|take/.test(id))) return { max: manager, label: "Managed max " + compactMoney(manager) };
    if (/manager/.test(id)) return { max: Math.max(liquid, manager), label: "Liquid " + compactMoney(liquid) + " / managed " + compactMoney(manager), fill: liquid };
    if (/pfirm|firm/.test(id) && (/out|withdraw|take/.test(id))) return { max: personal, label: "Personal firm max " + compactMoney(personal) };
    if (/pfirm|firm/.test(id)) return { max: liquid, label: "Liquid max " + compactMoney(liquid) };
    if (/broker.*out|brokerage.*out|withdraw|take/.test(id)) return { max: brokerage, label: "Brokerage cash max " + compactMoney(brokerage) };
    if (/^v18-/.test(id)) return { max: Math.max(brokerage, stock), label: "Cash " + compactMoney(brokerage) + " / held " + compactMoney(stock), fill: brokerage };
    if (/broker|invest|alloc|in/.test(id)) return { max: liquid, label: "Liquid max " + compactMoney(liquid) };
    return { max: Math.max(liquid, brokerage, manager, personal, stock), label: "Available " + compactMoney(Math.max(liquid, brokerage, manager, personal, stock)) };
  }

  function cleanAmountInput(input, fillMax) {
    if (!input || input.dataset.ledgerMoneyClamp === "off") return;
    var ctx = inputContext(input);
    var raw = String(input.value || "").replace(/[^0-9.]/g, "");
    var value = parseMoneyInput(input.value);
    var fill = ctx.fill != null ? ctx.fill : ctx.max;
    if (fillMax) value = Math.max(0, round(fill));
    if (value > Math.max(0, ctx.max)) value = Math.max(0, ctx.max);
    if (raw || fillMax) input.value = value ? String(value) : "";
    updateMoneyReadout(input);
  }

  function updateMoneyReadout(input) {
    if (!input || !input.parentNode) return;
    var next = input.nextElementSibling;
    if (!next || !next.classList || !next.classList.contains("v1838-money-readout")) {
      next = document.createElement("button");
      next.type = "button";
      next.className = "v1838-money-readout";
      next.title = "Click to fill the maximum playable amount for this field.";
      input.parentNode.insertBefore(next, input.nextSibling);
    }
    var ctx = inputContext(input);
    var typed = parseMoneyInput(input.value);
    next.textContent = typed ? compactMoney(typed) + " / " + ctx.label : ctx.label;
    next.dataset.inputId = input.id || "";
    input.dataset.ledgerMaxAmount = String(Math.max(0, round(ctx.max)));
    input.dataset.ledgerFillAmount = String(Math.max(0, round(ctx.fill != null ? ctx.fill : ctx.max)));
    next.disabled = ctx.max <= 0 && !ctx.fill;
  }

  function enhanceMoneyInputsV1838() {
    try {
      var root = document.querySelector(".hub-overlay.hub-brokerage") || document;
      var inputs = root.querySelectorAll("input[inputmode='numeric'], input[type='number'], input.v17-money-input");
      Array.prototype.forEach.call(inputs, function (input) {
        if (!input.id) return;
        if (!input.dataset.v1838MoneyEnhanced) {
          input.dataset.v1838MoneyEnhanced = "1";
          input.setAttribute("autocomplete", "off");
        }
        updateMoneyReadout(input);
      });
    } catch (e) {}
  }

  function scheduleEnhanceMoneyInputsV1838() {
    try {
      var run = function () {
        fixInvestmentLabelsV1838();
        enhanceMoneyInputsV1838();
      };
      if (typeof requestAnimationFrame === "function") requestAnimationFrame(run);
      else setTimeout(run, 0);
    } catch (e) {}
  }

  function investmentsPulseHtml() {
    var s = stateNow();
    var f = financeNow();
    var m = f.stocksV18 || {};
    var snap = investmentSnapshot();
    var cycle = m.cycle || ((s.market || {}).mood) || "normal";
    var last = round(n((m.lastMarketGain != null ? m.lastMarketGain : f.lastInvestmentReturn)));
    var cycleIcon = /bull/i.test(cycle) ? "📈" : /bear/i.test(cycle) ? "📉" : "➖";
    return '<section class="v1838-investment-pulse v1838-investments-pulse"><div><div class="v1838-kicker">📈 investment command ledger</div><h3>📈 Investments</h3><p>Stocks, brokerage cash, outside managers, and your personal firm stay in one scroll-friendly command desk. Custom money fields now show the playable max beside them.</p></div><div class="v1838-pulse-rail">' +
      '<span><b>' + esc(compactMoney(snap.total || totalInvested())) + '</b><em>💰 Total invested</em></span>' +
      '<span><b>' + esc(compactMoney(snap.liquid)) + '</b><em>💵 Liquid available</em></span>' +
      '<span><b>' + esc(compactMoney(snap.brokerage)) + '</b><em>🏦 Brokerage cash</em></span>' +
      '<span><b>' + esc(compactMoney(snap.stocks)) + '</b><em>📊 Real stocks</em></span>' +
      '<span><b>' + esc(compactMoney(snap.manager)) + '</b><em>🤝 Outside managers</em></span>' +
      '<span><b>' + esc(compactMoney(snap.personal)) + '</b><em>🏢 Personal firm</em></span>' +
      '<span><b>' + esc(compactMoney(snap.pending)) + '</b><em>⏳ Pending income</em></span>' +
      '<span class="' + (last >= 0 ? "good" : "bad") + '"><b>' + esc((last >= 0 ? "+" : "-") + compactMoney(Math.abs(last))) + '</b><em>' + (last >= 0 ? "📈" : "📉") + ' Last move</em></span>' +
      '<span><b>' + esc(String(cycle).replace(/_/g, " ")) + '</b><em>' + cycleIcon + ' Market cycle</em></span>' +
      '</div></section>';
  }

  function isInvestmentMoneyInput(target) {
    if (!target || !target.matches) return false;
    if (!target.matches("input[inputmode='numeric'], input[type='number'], input.v17-money-input")) return false;
    if (!target.closest) return true;
    return !!target.closest(".hub-overlay.hub-brokerage,.v17-brokerage-hub,.v18-brokerage-hub,.v17-brokerage-section,.v18-stock-desk,.v1829-manager-desk,.v17-manager-card,.v17-personal-card,.v189-fund-track");
  }

  function bindInvestmentInputEventsV1838() {
    if (typeof document === "undefined" || !document.addEventListener || window.__ledgerInvestmentInputEventsV1838) return;
    window.__ledgerInvestmentInputEventsV1838 = true;
    document.addEventListener("input", function (event) {
      if (isInvestmentMoneyInput(event.target)) cleanAmountInput(event.target, false);
    }, true);
    document.addEventListener("change", function (event) {
      if (isInvestmentMoneyInput(event.target)) cleanAmountInput(event.target, false);
    }, true);
    document.addEventListener("blur", function (event) {
      if (isInvestmentMoneyInput(event.target)) cleanAmountInput(event.target, false);
    }, true);
    document.addEventListener("click", function (event) {
      var target = event.target;
      if (!target || !target.classList || !target.classList.contains("v1838-money-readout")) return;
      event.preventDefault();
      event.stopPropagation();
      var input = target.dataset && target.dataset.inputId && document.getElementById ? document.getElementById(target.dataset.inputId) : null;
      if (!input) input = target.previousElementSibling;
      cleanAmountInput(input, true);
      try {
        if (typeof Event === "function") {
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
        }
      } catch (e) {}
    }, true);
  }

  function fixInvestmentLabelsV1838() {
    if (typeof document === "undefined" || !document.querySelectorAll) return;
    try {
      Array.prototype.forEach.call(document.querySelectorAll(".hub-overlay.hub-brokerage .hub-head h2"), function (el) {
        if (/brokerage|stocks/i.test(el.textContent || "")) el.textContent = "Investments";
      });
      Array.prototype.forEach.call(document.querySelectorAll(".hub-overlay.hub-brokerage .v11-tab-btn,.hub-overlay.hub-brokerage .nav-btn"), function (btn) {
        var raw = (btn.getAttribute && (btn.getAttribute("onclick") || btn.getAttribute("data-hub") || "")) || "";
        var activeBrokerage = /\bbrokerage\b|\bstocks\b/i.test(raw) || (btn.classList && btn.classList.contains("active") && /stocks|brokerage/i.test(btn.textContent || ""));
        if (!activeBrokerage) return;
        Array.prototype.forEach.call(btn.querySelectorAll(".v11-tab-lbl,.nav-label"), function (label) {
          if (/stocks|brokerage/i.test(label.textContent || "")) label.textContent = "Investments";
        });
      });
    } catch (e) {}
  }

  function injectInvestmentsRefresh(html) {
    html = replaceInvestmentsText(html);
    if (String(html || "").indexOf("v1838-investment-pulse") >= 0) return html;
    var source = String(html || "");
    var end = source.indexOf("</section>");
    var pulse = investmentsPulseHtml();
    return end >= 0 ? source.slice(0, end + 10) + pulse + source.slice(end + 10) : pulse + source;
  }

  function relabelHub(hub) {
    if (!hub || typeof hub !== "object") return hub;
    var copy = Object.assign({}, hub);
    if (String(copy.id || "").toLowerCase() === "stocks") copy.id = "brokerage";
    if (String(copy.id || "").toLowerCase() === "brokerage") {
      copy.label = "Investments";
      copy.title = "Investments";
      copy.icon = copy.icon || "📈";
    }
    return copy;
  }

  function relabelHubs(list) {
    return Array.isArray(list) ? list.map(relabelHub) : list;
  }

  function replaceInvestmentsText(html) {
    if (html == null) return html;
    return String(html)
      .replace(/>Stocks<\/span>/g, ">Investments</span>")
      .replace(/>Stocks<\/b>/g, ">Investments</b>")
      .replace(/>Stocks<\/h2>/g, ">Investments</h2>")
      .replace(/>Stocks<\/div>/g, ">Investments</div>")
      .replace(/>Brokerage<\/h2>/g, ">Investments</h2>")
      .replace(/>Brokerage<\/span>/g, ">Investments</span>")
      .replace(/aria-label="Brokerage"/g, 'aria-label="Investments"')
      .replace(/Open Stocks/g, "Open Investments")
      .replace(/Brokerage Command Center/g, "Investment Command Center")
      .replace(/Brokerage \/ Market/g, "Investments / Market")
      .replace(/Total Brokerage/g, "Total Investments")
      .replace(/Brokerage cash/g, "Investment cash")
      .replace(/Brokerage Cash/g, "Investment Cash")
      .replace(/Stocks \/ Brokerage/g, "Investments")
      .replace(/Investing lives in Stocks/g, "Investing lives in Investments")
      .replace(/Stocks handles investing controls/g, "Investments handles investing controls")
      .replace(/Stocks, outside managers/g, "Investments, outside managers")
      .replace(/stocks, outside managers/g, "investments, outside managers")
      .replace(/Stocks tab/g, "Investments tab")
      .replace(/Stocks and funds/g, "Investments and funds")
      .replace(/Stocks\/firms/g, "Investments/firms")
      .replace(/Real stocks/g, "Real stocks")
      .replace(/stock market/g, "investment market");
  }

  function normalizeId(id) {
    id = String(id || "").toLowerCase();
    if (id === "stocks") return "brokerage";
    return id;
  }

  var previousGetVisibleHubs = window.getVisibleHubs || (typeof getVisibleHubs === "function" ? getVisibleHubs : null);
  if (typeof previousGetVisibleHubs === "function") {
    window.getVisibleHubs = function () {
      return relabelHubs(previousGetVisibleHubs.apply(this, arguments));
    };
    try { getVisibleHubs = window.getVisibleHubs; } catch (e) {}
  }

  var previousGetAllHubs = window.getAllHubsV186 || (typeof getAllHubsV186 === "function" ? getAllHubsV186 : null);
  if (typeof previousGetAllHubs === "function") {
    window.getAllHubsV186 = function () {
      return relabelHubs(previousGetAllHubs.apply(this, arguments));
    };
    try { getAllHubsV186 = window.getAllHubsV186; } catch (e2) {}
  }

  var previousStable = window.getStableHubsV18336;
  if (typeof previousStable === "function") {
    window.getStableHubsV18336 = function () {
      return relabelHubs(previousStable.apply(this, arguments));
    };
  }

  var previousRenderHubOverlay = window.renderHubOverlay || (typeof renderHubOverlay === "function" ? renderHubOverlay : null);
  if (typeof previousRenderHubOverlay === "function") {
    window.renderHubOverlay = function (hubId) {
      var id = normalizeId(hubId);
      var html = replaceInvestmentsText(previousRenderHubOverlay.apply(this, [id]));
      if (id === "brokerage") scheduleEnhanceMoneyInputsV1838();
      return html;
    };
    try { renderHubOverlay = window.renderHubOverlay; } catch (e3) {}
  }

  var previousRenderHubContent = window.renderHubContent || (typeof renderHubContent === "function" ? renderHubContent : null);
  if (typeof previousRenderHubContent === "function") {
    window.renderHubContent = function (hubId) {
      var id = normalizeId(hubId);
      var html = previousRenderHubContent.apply(this, [id]);
      if (id === "brokerage") {
        html = injectInvestmentsRefresh(html);
        scheduleEnhanceMoneyInputsV1838();
        return html;
      }
      return id === "money" || id === "finance" ? replaceInvestmentsText(html) : html;
    };
    try { renderHubContent = window.renderHubContent; } catch (e4) {}
  }

  var previousSetTab = window.setTabV16 || window.setTab || (typeof setTab === "function" ? setTab : null);
  window.openInvestmentsV1837 = function () {
    if (typeof previousSetTab === "function") {
      var out = previousSetTab("brokerage");
      scheduleEnhanceMoneyInputsV1838();
      return out;
    }
  };

  bindInvestmentInputEventsV1838();
  window.investmentSnapshotV1838 = investmentSnapshot;
  window.investmentInputInfoV1838 = inputContext;
  window.decorateMoneyInputsV1838 = enhanceMoneyInputsV1838;
  window.fixInvestmentLabelsV1838 = fixInvestmentLabelsV1838;
  window.clampInvestmentInputV1838 = function (input, fillMax) {
    cleanAmountInput(input, !!fillMax);
    return input && input.value;
  };

  if (typeof document !== "undefined" && document.createElement && document.head) {
    var style = document.createElement("style");
    style.textContent = [
      ".hub-overlay.hub-brokerage .hub-head h2::after{content:' / Investments';display:none}",
      ".v1837-investments-label{letter-spacing:0!important}",
      ".hub-overlay.hub-brokerage .v1838-investment-pulse{border:1px solid rgba(126,160,172,.48);border-radius:18px;background:radial-gradient(circle at 12% 0,rgba(185,220,138,.18),transparent 28%),radial-gradient(circle at 88% 16%,rgba(143,196,215,.20),transparent 30%),linear-gradient(135deg,rgba(19,35,35,.98),rgba(42,31,20,.98));box-shadow:0 20px 55px rgba(0,0,0,.28);padding:16px;margin:12px 0;overflow:hidden}",
      ".hub-overlay.hub-brokerage .v1838-investment-pulse h3{margin:2px 0 5px;color:#fff3df;font-size:28px;letter-spacing:0}",
      ".hub-overlay.hub-brokerage .v1838-investment-pulse p{margin:0;color:#d6c7aa;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.55;max-width:760px}",
      ".hub-overlay.hub-brokerage .v1838-kicker{font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.18em;color:#e6c178;font-size:9px}",
      ".hub-overlay.hub-brokerage .v1838-pulse-rail{display:flex;gap:9px;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x proximity;padding:13px 2px 3px;margin-top:8px}",
      ".hub-overlay.hub-brokerage .v1838-pulse-rail span{flex:0 0 154px;scroll-snap-align:start;border:1px solid rgba(255,255,255,.12);border-radius:13px;background:rgba(255,255,255,.055);padding:10px;min-width:0}",
      ".hub-overlay.hub-brokerage .v1838-pulse-rail b{display:block;color:#f2d089;font-size:20px;overflow-wrap:anywhere}.hub-overlay.hub-brokerage .v1838-pulse-rail em{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-style:normal;text-transform:uppercase;letter-spacing:.08em;font-size:8px;margin-top:4px}.hub-overlay.hub-brokerage .v1838-pulse-rail .good b{color:#b9dc8a}.hub-overlay.hub-brokerage .v1838-pulse-rail .bad b{color:#e9927d}",
      ".hub-overlay.hub-brokerage .v1838-money-readout{border:1px solid rgba(143,196,215,.38);border-radius:12px;background:linear-gradient(135deg,rgba(23,37,41,.92),rgba(44,35,22,.88));color:#dcecf0;font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.04em;line-height:1.25;padding:9px 10px;min-height:38px;text-align:left;white-space:normal;overflow-wrap:anywhere;cursor:pointer}.hub-overlay.hub-brokerage .v1838-money-readout:disabled{opacity:.55;cursor:not-allowed}.hub-overlay.hub-brokerage .v1838-money-readout:hover:not(:disabled){border-color:rgba(240,202,123,.62);color:#f6dfaa}",
      ".hub-overlay.hub-brokerage .v18-input-row,.hub-overlay.hub-brokerage .v1829-custom-row{display:grid!important;grid-template-columns:minmax(150px,1fr) minmax(140px,auto) auto auto!important;gap:8px!important;align-items:stretch!important}.hub-overlay.hub-brokerage .v18-input-row input,.hub-overlay.hub-brokerage .v1829-custom-row input{min-width:0!important}",
      ".hub-overlay.hub-brokerage .v18-stock-card .v18-input-row{grid-template-columns:1fr 1fr!important}.hub-overlay.hub-brokerage .v18-stock-card .v18-input-row input,.hub-overlay.hub-brokerage .v18-stock-card .v1838-money-readout{grid-column:1/-1!important;width:100%!important;box-sizing:border-box!important}.hub-overlay.hub-brokerage .v18-stock-card .v1838-money-readout{min-height:32px!important;padding:7px 9px!important;font-size:8px!important}",
      ".hub-overlay.hub-brokerage .v17-transfer-desk{display:grid!important;grid-template-columns:1fr!important;gap:10px!important}.hub-overlay.hub-brokerage .v17-input-row{display:grid!important;grid-template-columns:minmax(104px,145px) minmax(130px,1fr) minmax(150px,auto) auto!important;gap:8px!important;align-items:center!important}.hub-overlay.hub-brokerage .v17-input-row input{min-width:0!important}.hub-overlay.hub-brokerage .v17-input-row .v1838-money-readout{min-width:135px!important}",
      ".hub-overlay.hub-brokerage .v1829-grid.four,.hub-overlay.hub-brokerage .v1829-mandate-grid,.hub-overlay.hub-brokerage .v1829-firm-grid,.hub-overlay.hub-brokerage .v1820-firm-skill-grid,.hub-overlay.hub-brokerage .v189-fund-grid,.hub-overlay.hub-brokerage .v18-summary-grid,.hub-overlay.hub-brokerage .v17-broker-stats{display:flex!important;gap:10px!important;overflow-x:auto!important;overflow-y:hidden!important;scroll-snap-type:x proximity!important;padding:2px 2px 9px!important}",
      ".hub-overlay.hub-brokerage .v1829-stat,.hub-overlay.hub-brokerage .v1829-mandate-card,.hub-overlay.hub-brokerage .v1829-firm-card,.hub-overlay.hub-brokerage .v1820-firm-skill-grid>*,.hub-overlay.hub-brokerage .v189-fund-grid>*,.hub-overlay.hub-brokerage .v18-summary-card,.hub-overlay.hub-brokerage .v17-broker-stat{flex:0 0 190px!important;scroll-snap-align:start!important;min-width:0!important}",
      ".hub-overlay.hub-brokerage .v1829-firm-card{flex-basis:285px!important}.hub-overlay.hub-brokerage .v1829-mandate-card{flex-basis:210px!important}.hub-overlay.hub-brokerage .v1829-history{display:flex!important;gap:10px!important;overflow-x:auto!important;overflow-y:hidden!important;padding:2px 2px 9px!important;scroll-snap-type:x proximity!important}.hub-overlay.hub-brokerage .v1829-history-row{flex:0 0 265px!important;scroll-snap-align:start!important}",
      ".hub-overlay.hub-brokerage .v17-manager-grid,.hub-overlay.hub-brokerage .v18-stock-list{display:flex!important;gap:10px!important;overflow-x:auto!important;overflow-y:hidden!important;padding:3px 3px 10px!important;scroll-snap-type:x proximity!important}.hub-overlay.hub-brokerage .v17-manager-option{flex:0 0 275px!important;min-width:0!important}.hub-overlay.hub-brokerage .v18-stock-card{flex:0 0 265px!important;min-width:0!important;scroll-snap-align:start!important}",
      ".hub-overlay.hub-brokerage .v17-personal-card .v17-actions,.hub-overlay.hub-brokerage .v1829-action-row,.hub-overlay.hub-brokerage .v18-actions{display:flex!important;gap:8px!important;overflow-x:auto!important;overflow-y:hidden!important;flex-wrap:nowrap!important;padding-bottom:8px!important}.hub-overlay.hub-brokerage .v17-personal-card .v17-actions .money-btn,.hub-overlay.hub-brokerage .v1829-action-row .money-btn,.hub-overlay.hub-brokerage .v18-actions .money-btn{flex:0 0 auto!important}",
      "@media(max-width:900px){.hub-overlay.hub-brokerage .v17-input-row{grid-template-columns:1fr!important}.hub-overlay.hub-brokerage .v17-input-row .v1838-money-readout{min-width:0!important;width:100%!important}}@media(max-width:720px){.hub-overlay.hub-brokerage .v18-input-row,.hub-overlay.hub-brokerage .v1829-custom-row,.hub-overlay.hub-brokerage .v17-transfer-desk,.hub-overlay.hub-brokerage .v17-input-row{grid-template-columns:1fr!important}.hub-overlay.hub-brokerage .v1838-pulse-rail span,.hub-overlay.hub-brokerage .v18-stock-card,.hub-overlay.hub-brokerage .v17-manager-option,.hub-overlay.hub-brokerage .v1829-firm-card{flex-basis:82vw!important}}"
    ].join("\n");
    document.head.appendChild(style);
  }

  if (window.registerLedgerSystem) {
    window.registerLedgerSystem({
      id: "stocks-investing",
      file: "pages/systems/stocks-investing.js",
      status: "active",
      globals: ["renderBrokerageHubV11", "buyStock", "sellStock", "investBrokerage", "openInvestmentsV1837", "decorateMoneyInputsV1838", "clampInvestmentInputV1838", "fixInvestmentLabelsV1838"],
      notes: "The underlying route remains brokerage for compatibility, but visible UI labels now say Investments. v18.38.1 adds the investment command ledger, horizontal firm rails, smart max readouts, and header/nav label cleanup."
    });
  }
})();
