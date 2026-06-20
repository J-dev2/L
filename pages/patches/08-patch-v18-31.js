/* LEDGER PATCH v18.31: Family Trust / Estate Planning / Dynasty Settlement */
(() => {
  const PATCH_ID = "v18.31";
  if (window.__ledgerPatch1831) return;
  window.__ledgerPatch1831 = true;

  function rootState() {
    try { if (typeof state !== "undefined" && state) return state; } catch (e) {}
    return window.state || null;
  }
  function assignState(next) {
    try { state = next; } catch (e) {}
    window.state = next;
    return next;
  }
  function n(value, fallback = 0) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function esc(value) {
    return String(value ?? "").replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));
  }
  function money(value) {
    const v = n(value);
    const sign = v < 0 ? "-" : "";
    const abs = Math.abs(v);
    if (abs >= 1e12) return sign + "$" + (abs / 1e12).toFixed(1) + "T";
    if (abs >= 1e9) return sign + "$" + (abs / 1e9).toFixed(1) + "B";
    if (abs >= 1e6) return sign + "$" + (abs / 1e6).toFixed(1) + "M";
    if (abs >= 1e3) return sign + "$" + Math.round(abs).toLocaleString();
    return sign + "$" + Math.round(abs).toLocaleString();
  }
  function pct(value) { return Math.round(n(value) * 100) + "%"; }
  function toast(text) {
    try { if (typeof addToast === "function") return addToast(text); } catch (e) {}
    try { alert(text); } catch (e) {}
  }
  function log(text, deltas) {
    try { if (typeof addLog === "function") return addLog(text, deltas || {}); } catch (e) {}
    const s = rootState();
    if (s) {
      if (!Array.isArray(s.log)) s.log = [];
      s.log.push({ text, deltas: deltas || {}, age: s.age });
    }
  }
  function saveRender() {
    try { if (typeof save === "function") save(); } catch (e) {}
    try { if (typeof render === "function") render(); } catch (e) {}
  }
  function setHub(id) {
    try { if (typeof setTabV16 === "function") return setTabV16(id); } catch (e) {}
    try { if (typeof setTab === "function") return setTab(id); } catch (e) {}
  }
  function ensure() {
    let s = rootState();
    if (!s) return null;
    if (!s.finance || typeof s.finance !== "object") s.finance = {};
    if (!s.finance.incomeSources || typeof s.finance.incomeSources !== "object") s.finance.incomeSources = {};
    if (!s.finance.debts || typeof s.finance.debts !== "object") s.finance.debts = {};
    if (!Array.isArray(s.finance.businesses)) s.finance.businesses = [];
    if (!Array.isArray(s.rentals)) s.rentals = [];
    if (!s.relationships || typeof s.relationships !== "object") s.relationships = {};
    if (!s.estateV1831 || typeof s.estateV1831 !== "object") s.estateV1831 = {};
    const e = s.estateV1831;
    if (!e.version) e.version = PATCH_ID;
    if (e.hasWill == null) e.hasWill = false;
    if (!e.trustType) e.trustType = "none";
    if (!e.trustee) e.trustee = "self";
    if (!e.beneficiaryMode) e.beneficiaryMode = "children_equal";
    if (!e.distributionAge) e.distributionAge = 25;
    if (!e.guardian) e.guardian = "trusted_family";
    if (!e.assets || typeof e.assets !== "object") e.assets = {};
    e.assets.trustCash = Math.max(0, Math.round(n(e.assets.trustCash)));
    e.assets.home = !!e.assets.home;
    e.assets.rentals = !!e.assets.rentals;
    e.assets.businessPercent = clamp(n(e.assets.businessPercent), 0, 1);
    e.assets.brokeragePercent = clamp(n(e.assets.brokeragePercent), 0, 1);
    e.assets.managerPercent = clamp(n(e.assets.managerPercent), 0, 1);
    e.assets.retirementBeneficiary = !!e.assets.retirementBeneficiary;
    if (!e.clauses || typeof e.clauses !== "object") e.clauses = {};
    ["spendthrift", "guardianship", "healthDirective", "powerOfAttorney", "businessSuccession", "charityRemainder"].forEach(k => { e.clauses[k] = !!e.clauses[k]; });
    e.familyOffice = !!e.familyOffice;
    e.maintenanceDue = Math.max(0, Math.round(n(e.maintenanceDue)));
    if (!Array.isArray(e.history)) e.history = [];
    return s;
  }

  const TRUST_TYPES = {
    none: { name:"No Trust", setup:0, maint:0, probate:.10, estateTaxCut:0, protection:0, desc:"No trust. Assets face the highest probate delay and weakest estate plan." },
    revocable: { name:"Revocable Living Trust", setup:3500, maint:300, probate:.018, estateTaxCut:.10, protection:.18, desc:"Flexible living trust. You keep control, avoid most probate delay, and can change beneficiaries." },
    irrevocable: { name:"Irrevocable Family Trust", setup:15000, maint:1200, probate:.006, estateTaxCut:.32, protection:.46, desc:"Stronger asset and estate planning. Less flexible, but better protection for very wealthy lives." },
    dynasty: { name:"Dynasty Trust", setup:85000, maint:7500, probate:.003, estateTaxCut:.55, protection:.72, desc:"Ultra-high-net-worth structure for multi-generation family wealth, businesses, and investment assets." }
  };
  const BENEFICIARIES = {
    children_equal: "Children equally",
    spouse_then_children: "Spouse first, then children",
    family_line: "Family line / descendants",
    charity_10: "Family + 10% charity",
    business_heir: "Business successor first"
  };
  const TRUSTEES = {
    self: "Self while alive",
    spouse: "Spouse / partner",
    adult_child: "Adult child",
    sibling: "Sibling / trusted relative",
    professional: "Professional trustee",
    bank: "Bank trust department"
  };

  function homeValue(s) {
    try {
      if (typeof homes !== "undefined" && Array.isArray(homes)) {
        const h = homes.find(x => x.id === s.home);
        return Math.max(0, n(h && h.price));
      }
    } catch (e) {}
    return 0;
  }
  function rentalValue(s) {
    try {
      if (typeof rentals !== "undefined" && Array.isArray(rentals)) {
        return (s.rentals || []).reduce((sum, id) => {
          const r = rentals.find(x => x.id === id);
          return sum + Math.max(0, n(r && r.price));
        }, 0);
      }
    } catch (e) {}
    return 0;
  }
  function businessValue(s) {
    return (s.finance && Array.isArray(s.finance.businesses) ? s.finance.businesses : []).reduce((sum, b) => {
      return sum + Math.max(0, n(b.value)) + Math.max(0, n(b.retainedEarnings));
    }, 0);
  }
  function brokerageValue(s) {
    const f = s.finance || {};
    return Math.max(0, n(f.brokerage)) + Math.max(0, n(f.stockValue)) + Math.max(0, n(f.managedPortfolio));
  }
  function managerValue(s) {
    const f = s.finance || {};
    return Math.max(0, n(f.externalManager && f.externalManager.capital)) + Math.max(0, n(f.managerFirmsV1829 && f.managerFirmsV1829.capital));
  }
  function retirementValue(s) { return Math.max(0, n(s.ira)) + Math.max(0, n(s.retirement401k)); }
  function baseNetWorth(s) {
    try { if (typeof legacyNetWorth === "function") return Math.max(0, n(legacyNetWorth(s))); } catch (e) {}
    const f = s.finance || {};
    return Math.max(0, n(s.money) + n(s.savings) + n(f.superSaver) + n(s.ira) + n(s.retirement401k) + brokerageValue(s) + managerValue(s) + businessValue(s) + homeValue(s) + rentalValue(s) - n(s.debt) - n(f.creditCardDebt) - n(f.assetBackedLoan) - n(f.taxDebt));
  }
  function childrenList(s) {
    const relKids = Object.values(s.relationships || {}).filter(r => r && r.role === "Child");
    const arrKids = Array.isArray(s.children) ? s.children.map(c => typeof c === "string" ? { name:c, role:"Child" } : c).filter(Boolean) : [];
    const byName = {};
    relKids.concat(arrKids).forEach(k => { if (k && (k.name || k.id)) byName[k.name || k.id] = k; });
    return Object.values(byName);
  }
  function assignedTrustValue(s) {
    const e = ensure().estateV1831;
    const a = e.assets;
    return Math.round(
      Math.max(0, n(a.trustCash)) +
      (a.home ? homeValue(s) : 0) +
      (a.rentals ? rentalValue(s) : 0) +
      businessValue(s) * n(a.businessPercent) +
      brokerageValue(s) * n(a.brokeragePercent) +
      managerValue(s) * n(a.managerPercent) +
      (a.retirementBeneficiary ? retirementValue(s) : 0)
    );
  }
  function protectionScore(s) {
    const e = ensure().estateV1831;
    const t = TRUST_TYPES[e.trustType] || TRUST_TYPES.none;
    let score = 0;
    if (e.hasWill) score += 12;
    score += t.protection * 55;
    if (e.clauses.spendthrift) score += 8;
    if (e.clauses.guardianship) score += 7;
    if (e.clauses.healthDirective) score += 5;
    if (e.clauses.powerOfAttorney) score += 5;
    if (e.clauses.businessSuccession) score += 8;
    if (e.familyOffice) score += 14;
    const gross = Math.max(1, baseNetWorth(s) + n(e.assets.trustCash));
    score += clamp(assignedTrustValue(s) / gross, 0, 1) * 18;
    return Math.round(clamp(score, 0, 100));
  }
  function estateSettlement(s = ensure()) {
    if (!s) return null;
    const e = ensure().estateV1831;
    const t = TRUST_TYPES[e.trustType] || TRUST_TYPES.none;
    const gross = Math.max(0, Math.round(baseNetWorth(s) + n(e.assets.trustCash)));
    const protectedValue = Math.min(gross, Math.max(0, assignedTrustValue(s)));
    const unprotected = Math.max(0, gross - protectedValue);
    const probateRate = e.hasWill ? Math.min(t.probate, .055) : t.probate;
    const probateLoss = Math.round(unprotected * probateRate);
    const exemption = e.familyOffice ? 10000000 : 5000000;
    const estateTaxBase = Math.max(0, gross - exemption);
    const estateTaxRate = .20 * (1 - clamp(t.estateTaxCut + (e.familyOffice ? .18 : 0) + (e.clauses.charityRemainder ? .08 : 0), 0, .82));
    const estateTax = Math.round(estateTaxBase * estateTaxRate);
    const maintenance = Math.max(0, n(e.maintenanceDue));
    const netTransfer = Math.max(0, gross - probateLoss - estateTax - maintenance);
    const kids = childrenList(s).length;
    const childShare = kids > 0 ? Math.round(netTransfer / kids) : 0;
    const dynastyScore = Math.round(netTransfer / 25000 + protectionScore(s) * 8 + kids * 120 + (e.familyOffice ? 500 : 0));
    return { gross, protectedValue, unprotected, probateRate, probateLoss, estateTaxBase, estateTaxRate, estateTax, maintenance, netTransfer, kids, childShare, protection:protectionScore(s), dynastyScore };
  }
  function addHistory(action, amount) {
    const s = ensure(); if (!s) return;
    const e = s.estateV1831;
    e.history.unshift({ age:n(s.age), action, amount:Math.round(n(amount)), at:Date.now() });
    e.history = e.history.slice(0, 20);
  }
  function payCost(amount, label) {
    const s = ensure(); if (!s) return false;
    amount = Math.max(0, Math.round(n(amount)));
    if (n(s.money) < amount) { toast("Need " + money(amount) + " in checking for " + label + "."); return false; }
    s.money = Math.round(n(s.money) - amount);
    return true;
  }

  window.createWillV1831 = function () {
    const s = ensure(); if (!s) return;
    if (s.estateV1831.hasWill) return toast("You already have a will.");
    const cost = 800;
    if (!payCost(cost, "a will")) return;
    s.estateV1831.hasWill = true;
    addHistory("Created will", cost);
    log("You created a basic will. Probate risk is lower and heirs are named.", { money:-cost, stress:-1 });
    saveRender();
  };
  window.createTrustV1831 = function (type) {
    const s = ensure(); if (!s) return;
    const plan = TRUST_TYPES[type] || TRUST_TYPES.revocable;
    if (s.estateV1831.trustType === type) return toast("That trust is already active.");
    if (type === "dynasty" && baseNetWorth(s) < 1000000) return toast("Dynasty trust requires at least $1M net worth in this gameplay model.");
    if (!payCost(plan.setup, plan.name)) return;
    s.estateV1831.trustType = type;
    s.estateV1831.hasWill = true;
    addHistory("Created " + plan.name, plan.setup);
    log("Set up a " + plan.name + ". Assets can now be titled into the family trust.", { money:-plan.setup, stress:type === "dynasty" ? -5 : -2 });
    saveRender();
  };
  window.setTrusteeV1831 = function (value) {
    const s = ensure(); if (!s) return;
    s.estateV1831.trustee = TRUSTEES[value] ? value : "self";
    addHistory("Changed trustee", 0);
    saveRender();
  };
  window.setBeneficiaryModeV1831 = function (value) {
    const s = ensure(); if (!s) return;
    s.estateV1831.beneficiaryMode = BENEFICIARIES[value] ? value : "children_equal";
    addHistory("Changed beneficiaries", 0);
    saveRender();
  };
  window.setDistributionAgeV1831 = function (value) {
    const s = ensure(); if (!s) return;
    s.estateV1831.distributionAge = clamp(Math.round(n(value, 25)), 18, 45);
    addHistory("Changed distribution age", 0);
    saveRender();
  };
  window.toggleTrustClauseV1831 = function (key) {
    const s = ensure(); if (!s) return;
    if (!Object.prototype.hasOwnProperty.call(s.estateV1831.clauses, key)) return;
    const enabling = !s.estateV1831.clauses[key];
    const costs = { spendthrift:1200, guardianship:700, healthDirective:350, powerOfAttorney:350, businessSuccession:2500, charityRemainder:3500 };
    const cost = enabling ? Math.round(n(costs[key])) : 0;
    if (enabling && !payCost(cost, "estate clause")) return;
    s.estateV1831.clauses[key] = enabling;
    addHistory((enabling ? "Added " : "Removed ") + key, cost);
    log((enabling ? "Added" : "Removed") + " estate planning clause: " + key.replace(/([A-Z])/g, " $1") + ".", { money:-cost });
    saveRender();
  };
  window.hireFamilyOfficeV1831 = function () {
    const s = ensure(); if (!s) return;
    if (s.estateV1831.familyOffice) return toast("Family office is already active.");
    if (baseNetWorth(s) < 2000000) return toast("Family office requires at least $2M net worth in this gameplay model.");
    const cost = 100000;
    if (!payCost(cost, "family office setup")) return;
    s.estateV1831.familyOffice = true;
    addHistory("Hired family office", cost);
    log("You hired a family office to coordinate trusts, business succession, taxes, and multi-generation wealth.", { money:-cost, stress:-6 });
    saveRender();
  };
  window.fundTrustCashV1831 = function (source, rawAmount) {
    const s = ensure(); if (!s) return;
    const e = s.estateV1831;
    if (e.trustType === "none") return toast("Create a trust first.");
    let available = 0;
    if (source === "savings") available = Math.max(0, n(s.savings));
    else available = Math.max(0, n(s.money));
    let amount = rawAmount === "all" ? available : Math.round(n(rawAmount));
    if (source === "custom") {
      const el = document.getElementById("v1831-custom-fund");
      amount = Math.round(n(el && el.value));
      source = "checking";
      available = Math.max(0, n(s.money));
    }
    amount = Math.max(0, Math.min(amount, available));
    if (!amount) return toast("No cash available to fund.");
    if (source === "savings") s.savings = Math.max(0, Math.round(n(s.savings) - amount));
    else s.money = Math.max(0, Math.round(n(s.money) - amount));
    e.assets.trustCash = Math.max(0, Math.round(n(e.assets.trustCash) + amount));
    addHistory("Funded trust cash", amount);
    log("Moved " + money(amount) + " into the family trust.", { money:-amount, karma:1 });
    saveRender();
  };
  window.withdrawTrustCashV1831 = function (rawAmount) {
    const s = ensure(); if (!s) return;
    const e = s.estateV1831;
    if (e.trustType !== "revocable") return toast("Only revocable trust cash can be pulled back easily.");
    let amount = rawAmount === "all" ? n(e.assets.trustCash) : Math.round(n(rawAmount));
    if (rawAmount === "custom") {
      const el = document.getElementById("v1831-custom-withdraw");
      amount = Math.round(n(el && el.value));
    }
    amount = Math.max(0, Math.min(amount, n(e.assets.trustCash)));
    if (!amount) return toast("No trust cash available.");
    e.assets.trustCash = Math.max(0, Math.round(n(e.assets.trustCash) - amount));
    s.money = Math.round(n(s.money) + amount);
    addHistory("Withdrew trust cash", amount);
    log("Pulled " + money(amount) + " back from the revocable trust.", { money:amount, stress:1 });
    saveRender();
  };
  window.toggleTrustAssetV1831 = function (asset) {
    const s = ensure(); if (!s) return;
    const e = s.estateV1831;
    if (e.trustType === "none") return toast("Create a trust first.");
    if (asset === "home" || asset === "rentals" || asset === "retirementBeneficiary") {
      e.assets[asset] = !e.assets[asset];
      const cost = e.assets[asset] ? (asset === "home" ? 900 : asset === "rentals" ? 1500 : 250) : 0;
      if (cost && !payCost(cost, "asset retitling")) { e.assets[asset] = false; return; }
      addHistory((e.assets[asset] ? "Assigned " : "Unassigned ") + asset, cost);
      log((e.assets[asset] ? "Assigned " : "Removed ") + asset.replace(/([A-Z])/g, " $1") + " in the estate plan.", { money:-cost });
      saveRender();
    }
  };
  window.setTrustPercentV1831 = function (asset, rawPct) {
    const s = ensure(); if (!s) return;
    const e = s.estateV1831;
    if (e.trustType === "none") return toast("Create a trust first.");
    const key = asset + "Percent";
    if (!["businessPercent", "brokeragePercent", "managerPercent"].includes(key)) return;
    const pctValue = clamp(n(rawPct), 0, 1);
    const previous = n(e.assets[key]);
    if (pctValue > previous) {
      const cost = Math.round((pctValue - previous) * (asset === "business" ? 4000 : 1500));
      if (cost && !payCost(cost, "retitling " + asset)) return;
      addHistory("Assigned " + Math.round(pctValue * 100) + "% " + asset, cost);
      log("Assigned " + Math.round(pctValue * 100) + "% of " + asset + " interests to the estate plan.", { money:-cost });
    }
    e.assets[key] = pctValue;
    saveRender();
  };
  window.payEstateMaintenanceV1831 = function () {
    const s = ensure(); if (!s) return;
    const due = Math.max(0, Math.round(n(s.estateV1831.maintenanceDue)));
    if (!due) return toast("No estate maintenance due.");
    const paid = Math.min(due, Math.max(0, n(s.money)));
    if (!paid) return toast("Need checking cash to pay maintenance.");
    s.money = Math.round(n(s.money) - paid);
    s.estateV1831.maintenanceDue = Math.max(0, due - paid);
    addHistory("Paid estate maintenance", paid);
    log("Paid " + money(paid) + " in estate/trust maintenance.", { money:-paid });
    saveRender();
  };

  function yearlyEstateMaintenance(s = ensure()) {
    if (!s) return false;
    const e = s.estateV1831;
    const t = TRUST_TYPES[e.trustType] || TRUST_TYPES.none;
    const ageKey = String(n(s.age));
    if (e.lastMaintenanceAge === ageKey) return false;
    e.lastMaintenanceAge = ageKey;
    let due = Math.round(n(t.maint) + (e.familyOffice ? 18000 : 0));
    if (!due) return false;
    if (n(s.money) >= due) {
      s.money = Math.round(n(s.money) - due);
      addHistory("Auto-paid estate maintenance", due);
      log("Estate plan maintenance cost " + money(due) + " this year.", { money:-due });
    } else {
      e.maintenanceDue = Math.round(n(e.maintenanceDue) + due);
      addHistory("Estate maintenance due", due);
      log("Estate plan maintenance of " + money(due) + " is due.", { stress:1 });
    }
    return true;
  }

  const previousResolve = window.resolveLifeAndFinanceYear || (typeof resolveLifeAndFinanceYear === "function" ? resolveLifeAndFinanceYear : null);
  if (previousResolve && !window.__ledgerResolve1831Wrapped) {
    window.__ledgerResolve1831Wrapped = true;
    window.resolveLifeAndFinanceYear = function () {
      const out = previousResolve.apply(this, arguments);
      try { yearlyEstateMaintenance(ensure()); } catch (e) { try { console.warn("v18.31 estate yearly failed", e); } catch(ignore) {} }
      return out;
    };
    try { resolveLifeAndFinanceYear = window.resolveLifeAndFinanceYear; } catch (e) {}
  }

  function selectHtml(value, options, action) {
    return `<select onchange="event.preventDefault();event.stopPropagation();${action}(this.value)">${Object.keys(options).map(k => `<option value="${esc(k)}" ${k === value ? "selected" : ""}>${esc(options[k])}</option>`).join("")}</select>`;
  }
  function button(label, cls, js, disabled) {
    return `<button class="money-btn ${cls || ""}" onclick="event.preventDefault();event.stopPropagation();${js}" ${disabled ? "disabled" : ""}>${esc(label)}</button>`;
  }
  function metric(label, value, tone, sub) {
    return `<div class="v1831-metric ${tone || ""}"><span>${esc(label)}</span><b>${esc(value)}</b>${sub ? `<em>${esc(sub)}</em>` : ""}</div>`;
  }
  function renderPlanOptions(e) {
    return Object.keys(TRUST_TYPES).filter(k => k !== "none").map(k => {
      const t = TRUST_TYPES[k];
      const active = e.trustType === k;
      return `<div class="v1831-plan ${active ? "active" : ""}"><div><b>${esc(t.name)}</b><span>${esc(t.desc)}</span><em>Setup ${money(t.setup)} · yearly ${money(t.maint)} · probate leak ${pct(t.probate)}</em></div>${button(active ? "Active" : "Create", active ? "" : "gold", `createTrustV1831('${esc(k)}')`, active)}</div>`;
    }).join("");
  }
  function renderAssetControls(s, settlement) {
    const e = s.estateV1831, a = e.assets;
    const hasTrust = e.trustType !== "none";
    const pctButtons = (asset, current) => [0, .25, .50, .75, 1].map(v => button(Math.round(v*100) + "%", v === current ? "green" : "", `setTrustPercentV1831('${asset}',${v})`, !hasTrust || v === current)).join("");
    return `<section class="money-section v1831-assets"><div class="money-section-title">Fund / Title Assets Into Trust <span>legal ownership, not personal tax</span></div>
      <div class="v1831-grid four">
        ${metric("Trust cash", money(a.trustCash), "gold", "Cash already inside trust")}
        ${metric("Home value", money(homeValue(s)), a.home ? "good" : "", a.home ? "Assigned" : "Not assigned")}
        ${metric("Business value", money(businessValue(s)), a.businessPercent ? "good" : "", Math.round(a.businessPercent*100)+"% assigned")}
        ${metric("Projected transfer", money(settlement.netTransfer), "good", "After gameplay probate/tax leak")}
      </div>
      <div class="v1831-subtitle">Move cash into trust</div>
      <div class="v1831-actions">${button("Fund $10K", "gold", "fundTrustCashV1831('checking',10000)", !hasTrust || n(s.money) < 10000)}${button("Fund $100K", "gold", "fundTrustCashV1831('checking',100000)", !hasTrust || n(s.money) < 100000)}${button("Fund All Checking", "green", "fundTrustCashV1831('checking','all')", !hasTrust || n(s.money) <= 0)}${button("Fund All Savings", "green", "fundTrustCashV1831('savings','all')", !hasTrust || n(s.savings) <= 0)}</div>
      <div class="v1831-custom"><input id="v1831-custom-fund" type="number" min="0" placeholder="Custom amount from checking" /><button class="money-btn gold" onclick="event.preventDefault();event.stopPropagation();fundTrustCashV1831('custom')" ${!hasTrust ? "disabled" : ""}>Fund Custom</button></div>
      <div class="v1831-custom"><input id="v1831-custom-withdraw" type="number" min="0" placeholder="Custom revocable withdrawal" /><button class="money-btn" onclick="event.preventDefault();event.stopPropagation();withdrawTrustCashV1831('custom')" ${e.trustType !== "revocable" || !a.trustCash ? "disabled" : ""}>Withdraw</button><button class="money-btn" onclick="event.preventDefault();event.stopPropagation();withdrawTrustCashV1831('all')" ${e.trustType !== "revocable" || !a.trustCash ? "disabled" : ""}>Withdraw All</button></div>
      <div class="v1831-subtitle">Retitle major assets</div>
      <div class="v1831-toggle-grid">
        <button class="v1831-toggle ${a.home ? "active" : ""}" onclick="event.preventDefault();event.stopPropagation();toggleTrustAssetV1831('home')" ${!hasTrust || !homeValue(s) ? "disabled" : ""}><b>Home</b><span>${a.home ? "In plan" : "Add deed/trust title"}</span></button>
        <button class="v1831-toggle ${a.rentals ? "active" : ""}" onclick="event.preventDefault();event.stopPropagation();toggleTrustAssetV1831('rentals')" ${!hasTrust || !rentalValue(s) ? "disabled" : ""}><b>Rental properties</b><span>${a.rentals ? "In plan" : "Add portfolio"}</span></button>
        <button class="v1831-toggle ${a.retirementBeneficiary ? "active" : ""}" onclick="event.preventDefault();event.stopPropagation();toggleTrustAssetV1831('retirementBeneficiary')" ${!retirementValue(s) ? "disabled" : ""}><b>Retirement beneficiaries</b><span>${a.retirementBeneficiary ? "Filed" : "Add beneficiary forms"}</span></button>
      </div>
      <div class="v1831-percent-row"><b>Business interests</b><span>${pct(a.businessPercent)} assigned</span><div>${pctButtons("business", a.businessPercent)}</div></div>
      <div class="v1831-percent-row"><b>Brokerage / stocks</b><span>${pct(a.brokeragePercent)} assigned</span><div>${pctButtons("brokerage", a.brokeragePercent)}</div></div>
      <div class="v1831-percent-row"><b>Outside manager accounts</b><span>${pct(a.managerPercent)} assigned</span><div>${pctButtons("manager", a.managerPercent)}</div></div>
    </section>`;
  }
  function renderClauseControls(e) {
    const clauses = [
      ["spendthrift", "Spendthrift protection", "Protects heirs from blowing all money instantly."],
      ["guardianship", "Minor guardianship", "Names who cares for minor children."],
      ["healthDirective", "Health directive", "Reduces chaos if health collapses."],
      ["powerOfAttorney", "Power of attorney", "Lets a trusted person manage finances if incapacitated."],
      ["businessSuccession", "Business succession", "Keeps companies from being forced-sold at death."],
      ["charityRemainder", "Charity remainder", "Adds legacy points and lowers estate-tax exposure."
      ]
    ];
    return `<section class="money-section v1831-clauses"><div class="money-section-title">Estate Documents <span>rules for family, health, business</span></div>
      <div class="v1831-controls">
        <label><span>Trustee</span>${selectHtml(e.trustee, TRUSTEES, "setTrusteeV1831")}</label>
        <label><span>Beneficiaries</span>${selectHtml(e.beneficiaryMode, BENEFICIARIES, "setBeneficiaryModeV1831")}</label>
        <label><span>Kids receive control at age</span><select onchange="event.preventDefault();event.stopPropagation();setDistributionAgeV1831(this.value)">${[18,21,25,30,35,40].map(age => `<option value="${age}" ${n(e.distributionAge) === age ? "selected" : ""}>${age}</option>`).join("")}</select></label>
      </div>
      <div class="v1831-toggle-grid clauses">${clauses.map(([key, title, desc]) => `<button class="v1831-toggle ${e.clauses[key] ? "active" : ""}" onclick="event.preventDefault();event.stopPropagation();toggleTrustClauseV1831('${key}')"><b>${esc(title)}</b><span>${esc(desc)}</span></button>`).join("")}</div>
    </section>`;
  }
  function renderHistory(e) {
    const rows = (e.history || []).slice(0, 6).map(h => `<div class="v1831-history-row"><span>Age ${esc(h.age)}</span><b>${esc(h.action)}</b><em>${h.amount ? money(h.amount) : "—"}</em></div>`).join("");
    return rows ? `<section class="money-section v1831-history"><div class="money-section-title">Estate Ledger <span>recent actions</span></div>${rows}</section>` : "";
  }
  function renderEstateCommand() {
    const s = ensure(); if (!s) return "";
    const e = s.estateV1831;
    const t = TRUST_TYPES[e.trustType] || TRUST_TYPES.none;
    const settlement = estateSettlement(s);
    const kids = childrenList(s);
    return `<section class="money-section v1831-estate-command"><div class="money-section-title">Family Trust / Estate Planning <span>legal home</span></div>
      <div class="v1831-hero"><div><div class="v1831-kicker">Dynasty planning</div><h3>${esc(t.name)}</h3><p>${esc(t.desc)}</p></div><div class="v1831-score"><b>${settlement.protection}</b><span>protection</span></div></div>
      <div class="v1831-grid four">
        ${metric("Gross estate", money(settlement.gross), "gold", "Gameplay estate value")}
        ${metric("Trust-protected", money(settlement.protectedValue), settlement.protectedValue ? "good" : "", "Assigned or titled")}
        ${metric("Probate leak", money(settlement.probateLoss), settlement.probateLoss ? "bad" : "good", pct(settlement.probateRate) + " on unprotected")}
        ${metric("Heir transfer", money(settlement.netTransfer), "good", kids.length ? kids.length + " child/heir records" : "No child heirs yet")}
      </div>
      <div class="v1831-plan-status"><span class="${e.hasWill ? "good" : "bad"}">${e.hasWill ? "Will active" : "No will"}</span><span>${esc(BENEFICIARIES[e.beneficiaryMode] || "Children")}</span><span>Trustee: ${esc(TRUSTEES[e.trustee] || "Self")}</span><span>Distribution age ${esc(e.distributionAge)}</span>${e.familyOffice ? "<span class='good'>Family office active</span>" : ""}</div>
      <div class="v1831-actions">${button("Create Will", "gold", "createWillV1831()", e.hasWill)}${button("Hire Family Office", "blue", "hireFamilyOfficeV1831()", e.familyOffice || baseNetWorth(s) < 2000000)}${button("Pay Maintenance", "red", "payEstateMaintenanceV1831()", !e.maintenanceDue)}</div>
      <div class="v1831-subtitle">Trust types</div><div class="v1831-plan-grid">${renderPlanOptions(e)}</div>
    </section>${renderAssetControls(s, settlement)}${renderClauseControls(e)}${renderHistory(e)}`;
  }
  function renderEstateShortcut() {
    const s = ensure(); if (!s) return "";
    const e = s.estateV1831;
    const settlement = estateSettlement(s);
    return `<section class="money-section v1831-estate-shortcut"><div class="money-section-title">Family Trust / Legacy <span>estate tools live in Legal</span></div><div class="v1831-grid four">${metric("Plan", (TRUST_TYPES[e.trustType] || TRUST_TYPES.none).name, e.trustType === "none" ? "bad" : "good", e.hasWill ? "Will active" : "No will")}${metric("Protection", settlement.protection + "/100", settlement.protection >= 60 ? "good" : settlement.protection ? "gold" : "bad", "Estate readiness")}${metric("Projected heirs", money(settlement.netTransfer), "good", "After leak/tax model")}${metric("Maintenance due", money(e.maintenanceDue), e.maintenanceDue ? "bad" : "good", "Yearly docs/admin")}</div><div class="v1831-actions">${button("Open Legal Estate Desk", "blue", "setTabV16 ? setTabV16('law') : setTab('law')", false)}</div></section>`;
  }

  function removeSections(html) {
    let out = String(html || "");
    ["v1831-estate-command", "v1831-estate-shortcut", "v1831-assets", "v1831-clauses", "v1831-history"].forEach(cls => {
      let idx = out.indexOf(cls), guard = 0;
      while (idx >= 0 && guard++ < 20) {
        const start = out.lastIndexOf("<section", idx);
        const end = out.indexOf("</section>", idx);
        if (start < 0 || end < 0) break;
        out = out.slice(0, start) + out.slice(end + 10);
        idx = out.indexOf(cls);
      }
    });
    return out;
  }
  const previousRenderHubContent = window.renderHubContent || (typeof renderHubContent === "function" ? renderHubContent : null);
  if (previousRenderHubContent && !window.__ledgerRender1831Wrapped) {
    window.__ledgerRender1831Wrapped = true;
    window.renderHubContent = function (hubId) {
      ensure();
      let html = "";
      try { html = previousRenderHubContent.apply(this, arguments) || ""; } catch (e) { html = `<section class="panel"><div class="row-title">Recovered hub</div><div class="row-sub">${esc(e.message || e)}</div></section>`; }
      html = removeSections(html);
      if (hubId === "law" || hubId === "legal") return renderEstateCommand() + html;
      if (hubId === "more") return renderEstateShortcut() + html;
      if (hubId === "finance" || hubId === "money") return renderEstateShortcut() + html;
      return html;
    };
    try { renderHubContent = window.renderHubContent; } catch (e) {}
  }

  const previousOverlay = window.renderHubOverlay || (typeof renderHubOverlay === "function" ? renderHubOverlay : null);
  if (previousOverlay && !window.__ledgerOverlay1831Wrapped) {
    window.__ledgerOverlay1831Wrapped = true;
    window.renderHubOverlay = function (hubId) {
      if (hubId === "law" || hubId === "legal") {
        return `<div class="hub-overlay" onclick="if(event.target===this)closeHub()"><div class="hub-sheet"><div class="hub-head"><h2>Legal / Estate</h2><button class="hub-close" onclick="closeHub()">×</button></div>${window.renderHubContent(hubId)}</div></div>`;
      }
      return previousOverlay.apply(this, arguments);
    };
    try { renderHubOverlay = window.renderHubOverlay; } catch (e) {}
  }

  const previousGetVisibleHubs = window.getVisibleHubs || (typeof getVisibleHubs === "function" ? getVisibleHubs : null);
  if (previousGetVisibleHubs && !window.__ledgerHubs1831Wrapped) {
    window.__ledgerHubs1831Wrapped = true;
    window.getVisibleHubs = function () {
      let hubs = [];
      try { hubs = previousGetVisibleHubs.apply(this, arguments) || []; } catch (e) {}
      hubs = Array.isArray(hubs) ? hubs.slice() : [];
      const s = ensure();
      const shouldShow = s && n(s.age) >= 18;
      if (shouldShow && !hubs.some(h => h && h.id === "law")) {
        const idx = Math.max(0, hubs.findIndex(h => h && h.id === "more"));
        const lawHub = { id:"law", icon:"⚖", label:"Legal" };
        if (idx >= 0) hubs.splice(idx, 0, lawHub); else hubs.push(lawHub);
      }
      return hubs.slice(0, 9);
    };
    try { getVisibleHubs = window.getVisibleHubs; } catch (e) {}
  }

  function deathPanelHtml() {
    const s = ensure(); if (!s) return "";
    const e = s.estateV1831;
    const t = TRUST_TYPES[e.trustType] || TRUST_TYPES.none;
    const x = estateSettlement(s);
    return `<section class="v1831-death-panel"><div class="v1831-death-title">Family Trust Settlement</div><div class="legacy"><div><span class="mono">Plan</span><b>${esc(t.name)}</b></div><div><span class="mono">Protected</span><b>${money(x.protectedValue)}</b></div><div><span class="mono">Probate Loss</span><b>${money(x.probateLoss)}</b></div><div><span class="mono">Estate Tax</span><b>${money(x.estateTax)}</b></div><div><span class="mono">Net To Heirs</span><b>${money(x.netTransfer)}</b></div><div><span class="mono">Each Child</span><b>${money(x.childShare)}</b></div></div><div class="cause">${e.hasWill || e.trustType !== "none" ? "Your estate plan reduced the leak between final net worth and the next generation." : "No meaningful estate plan existed, so probate and delays reduced the family transfer."}</div></section>`;
  }
  const previousRenderDeath = window.renderDeath || (typeof renderDeath === "function" ? renderDeath : null);
  if (previousRenderDeath && !window.__ledgerDeath1831Wrapped) {
    window.__ledgerDeath1831Wrapped = true;
    window.renderDeath = function () {
      previousRenderDeath.apply(this, arguments);
      try {
        const death = document.querySelector(".death");
        const actions = document.querySelector(".death-actions");
        if (death && !death.querySelector(".v1831-death-panel")) {
          const wrap = document.createElement("div");
          wrap.innerHTML = deathPanelHtml();
          const node = wrap.firstElementChild;
          if (actions) death.insertBefore(node, actions); else death.appendChild(node);
        }
      } catch (e) { try { console.warn("v18.31 death panel failed", e); } catch(ignore) {} }
    };
    try { renderDeath = window.renderDeath; } catch (e) {}
  }

  const previousContinueAsHeir = window.continueAsHeir || (typeof continueAsHeir === "function" ? continueAsHeir : null);
  if (previousContinueAsHeir && !window.__ledgerHeir1831Wrapped) {
    window.__ledgerHeir1831Wrapped = true;
    window.continueAsHeir = function () {
      const old = ensure();
      if (!old || old.alive) return previousContinueAsHeir.apply(this, arguments);
      const kids = childrenList(old);
      if (!kids.length) return previousContinueAsHeir.apply(this, arguments);
      const x = estateSettlement(old);
      const heir = kids[0] || {};
      const oldLegacy = old.legacy || {};
      const familyName = oldLegacy.familyName || String(old.name || "Legacy").split(" ").pop() || "Legacy";
      const nextName = heir.name || (typeof randomName === "function" ? randomName(Math.random() < .5 ? "male" : "female").replace(/ \w+$/, " " + familyName) : "Heir " + familyName);
      const inheritance = Math.max(0, Math.round(x.childShare || x.netTransfer * .65));
      const oldScore = (() => { try { return typeof ledgerLegacyScore === "function" ? n(ledgerLegacyScore(old)) : x.dynastyScore; } catch(e) { return x.dynastyScore; } })();
      try {
        newGame({
          name: nextName,
          gender: Math.random() < .5 ? "male" : "female",
          background: old.background || "middle",
          city: old.city || (typeof cities !== "undefined" && Array.isArray(cities) ? cities[0] : "Philadelphia"),
          startingMoney: inheritance,
          sandbox: old.sandbox || {},
          sandboxMode: !!old.sandboxMode
        });
        const s = ensure();
        if (s) {
          if (!s.legacy) s.legacy = {};
          s.legacy.generation = n(oldLegacy.generation, 1) + 1;
          s.legacy.familyName = familyName;
          s.legacy.cumulativeScore = n(oldLegacy.cumulativeScore) + oldScore + x.dynastyScore;
          s.legacy.inheritedFrom = old.name;
          s.legacy.lastInheritance = inheritance;
          s.legacy.lastEstatePlanV1831 = { plan:(TRUST_TYPES[old.estateV1831.trustType] || TRUST_TYPES.none).name, gross:x.gross, protectedValue:x.protectedValue, netTransfer:x.netTransfer, childShare:x.childShare, protection:x.protection };
          s.legacy.milestones = [];
          log("You carry the " + familyName + " legacy forward after inheriting " + money(inheritance) + " through the family estate plan.", {});
        }
        saveRender();
        try { if (typeof milestoneToast === "function") milestoneToast("Legacy Continued", nextName + " begins generation " + (rootState().legacy && rootState().legacy.generation || "next") + "."); } catch(e) {}
      } catch (err) {
        try { console.warn("v18.31 trust-aware heir failed; using base", err); } catch(ignore) {}
        return previousContinueAsHeir.apply(this, arguments);
      }
    };
    try { continueAsHeir = window.continueAsHeir; } catch (e) {}
  }

  function injectStyles() {
    if (document.getElementById("ledger-v1831-style")) return;
    const style = document.createElement("style");
    style.id = "ledger-v1831-style";
    style.textContent = `
      .v1831-estate-command,.v1831-estate-shortcut,.v1831-assets,.v1831-clauses,.v1831-history{border-color:rgba(216,173,109,.50)!important;background:linear-gradient(135deg,rgba(50,38,20,.97),rgba(29,25,20,.98))!important;overflow:hidden!important}.v1831-assets{border-color:rgba(143,175,108,.45)!important;background:linear-gradient(135deg,rgba(20,43,27,.96),rgba(29,25,20,.98))!important}.v1831-clauses{border-color:rgba(126,160,172,.45)!important;background:linear-gradient(135deg,rgba(20,38,45,.96),rgba(29,25,20,.98))!important}.v1831-estate-shortcut{border-color:rgba(180,146,220,.38)!important;background:linear-gradient(135deg,rgba(36,28,48,.96),rgba(29,25,20,.98))!important}
      .v1831-hero{display:flex;justify-content:space-between;gap:14px;align-items:center;border:1px solid rgba(255,255,255,.10);border-radius:16px;padding:15px;background:radial-gradient(circle at 20% 0%,rgba(216,173,109,.18),transparent 42%),rgba(255,255,255,.04);margin:8px 0 10px}.v1831-hero h3{font-size:25px;line-height:1.05;margin:2px 0 4px}.v1831-hero p{font-family:'JetBrains Mono',monospace;color:#b9a98e;font-size:10px;line-height:1.45}.v1831-kicker,.v1831-subtitle{font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.16em;font-size:9px;color:#d8ad6d}.v1831-subtitle{margin:12px 0 7px}.v1831-score{min-width:84px;text-align:center;border:1px solid rgba(216,173,109,.35);border-radius:14px;padding:10px;background:rgba(0,0,0,.18)}.v1831-score b{display:block;font-family:'JetBrains Mono',monospace;font-size:31px;color:#d8ad6d}.v1831-score span{display:block;font-family:'JetBrains Mono',monospace;font-size:9px;color:#aa9a82;text-transform:uppercase;letter-spacing:.1em}
      .v1831-grid{display:grid;gap:8px;margin:10px 0}.v1831-grid.four{grid-template-columns:repeat(4,minmax(0,1fr))}.v1831-metric{border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.045);border-radius:12px;padding:10px;min-width:0}.v1831-metric span{display:block;color:#aa9a82;font-family:'JetBrains Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:.08em}.v1831-metric b{display:block;font-family:'JetBrains Mono',monospace;font-size:16px;margin-top:4px;color:#f2e7d6;overflow-wrap:anywhere}.v1831-metric em{display:block;color:#8e806c;font-family:'JetBrains Mono',monospace;font-size:9px;font-style:normal;margin-top:4px;line-height:1.35}.v1831-metric.good b{color:#8faf6c}.v1831-metric.bad b{color:#cc7661}.v1831-metric.gold b{color:#d8ad6d}
      .v1831-plan-status,.v1831-actions{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}.v1831-plan-status span{font-family:'JetBrains Mono',monospace;font-size:9px;border:1px solid rgba(255,255,255,.11);border-radius:999px;padding:5px 8px;color:#aa9a82;background:rgba(255,255,255,.04)}.v1831-plan-status span.good{color:#8faf6c;border-color:rgba(143,175,108,.4)}.v1831-plan-status span.bad{color:#cc7661;border-color:rgba(204,118,97,.4)}.v1831-actions .money-btn{flex:1 1 130px}.v1831-plan-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.v1831-plan{border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.04);border-radius:13px;padding:11px;display:grid;gap:9px}.v1831-plan.active{border-color:rgba(143,175,108,.52);background:rgba(143,175,108,.08)}.v1831-plan b{display:block;font-size:15px}.v1831-plan span,.v1831-plan em{display:block;font-family:'JetBrains Mono',monospace;font-size:9px;line-height:1.42;color:#aa9a82;margin-top:4px}.v1831-plan em{color:#d8ad6d;font-style:normal}
      .v1831-custom{display:grid;grid-template-columns:1fr auto auto;gap:7px;margin-top:7px}.v1831-custom input{min-width:0}.v1831-toggle-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.v1831-toggle-grid.clauses{grid-template-columns:repeat(2,minmax(0,1fr))}.v1831-toggle{border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.04);border-radius:12px;padding:11px;text-align:left;color:#f2e7d6}.v1831-toggle.active{border-color:rgba(143,175,108,.55);background:rgba(143,175,108,.09)}.v1831-toggle b{display:block;font-size:13px}.v1831-toggle span{display:block;color:#aa9a82;font-family:'JetBrains Mono',monospace;font-size:9px;line-height:1.42;margin-top:4px}.v1831-toggle:disabled{opacity:.45;cursor:not-allowed}.v1831-percent-row{border:1px solid rgba(255,255,255,.10);border-radius:12px;padding:10px;margin-top:8px;background:rgba(255,255,255,.035)}.v1831-percent-row>b{display:block;font-size:14px}.v1831-percent-row>span{display:block;color:#d8ad6d;font-family:'JetBrains Mono',monospace;font-size:9px;margin:4px 0 7px}.v1831-percent-row>div{display:flex;gap:6px;flex-wrap:wrap}.v1831-percent-row .money-btn{flex:1 1 56px}.v1831-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:10px}.v1831-controls label{display:grid;gap:5px}.v1831-controls label span{font-family:'JetBrains Mono',monospace;font-size:9px;text-transform:uppercase;color:#aa9a82;letter-spacing:.08em}.v1831-controls select{min-width:0}.v1831-history-row{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;border-bottom:1px solid rgba(255,255,255,.08);padding:9px 0}.v1831-history-row:last-child{border-bottom:0}.v1831-history-row span,.v1831-history-row em{font-family:'JetBrains Mono',monospace;color:#aa9a82;font-size:9px;font-style:normal}.v1831-history-row b{font-size:13px}.v1831-death-panel{margin:16px 0}.v1831-death-title{font-family:'JetBrains Mono',monospace;color:#d8ad6d;text-transform:uppercase;letter-spacing:.16em;font-size:10px;margin-bottom:8px}
      @media(max-width:760px){.v1831-grid.four{grid-template-columns:repeat(2,minmax(0,1fr))}.v1831-plan-grid,.v1831-toggle-grid,.v1831-toggle-grid.clauses,.v1831-controls{grid-template-columns:1fr}.v1831-hero{align-items:flex-start}.v1831-score{min-width:72px}.v1831-custom{grid-template-columns:1fr}.v1831-actions .money-btn{flex-basis:100%}}@media(max-width:430px){.v1831-grid.four{grid-template-columns:1fr}.v1831-hero{display:block}.v1831-score{margin-top:10px;width:100%}}
    `;
    document.head.appendChild(style);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", injectStyles); else injectStyles();
  try { ensure(); } catch (e) {}
})();

