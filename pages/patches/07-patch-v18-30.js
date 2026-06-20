/* LEDGER PATCH v18.30: business entity structures, retained earnings, owner distributions, clearer launch requirements */
(function () {
  if (window.__ledgerPatch1830BusinessEntities) return;
  window.__ledgerPatch1830BusinessEntities = true;

  function num(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : (fallback == null ? 0 : fallback);
  }
  function clamp(value, lo, hi) { return Math.max(lo, Math.min(hi, num(value))); }
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  function money(value) {
    var v = Math.round(num(value));
    var sign = v < 0 ? "-" : "";
    v = Math.abs(v);
    if (v >= 1e12) return sign + "$" + (v / 1e12).toFixed(1).replace(/\.0$/, "") + "T";
    if (v >= 1e9) return sign + "$" + (v / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
    if (v >= 1e6) return sign + "$" + (v / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (v >= 1e4) return sign + "$" + Math.round(v / 1000).toLocaleString() + "K";
    return sign + "$" + v.toLocaleString();
  }
  function pct(value) { return (num(value) * 100).toFixed(1).replace(/\.0$/, "") + "%"; }
  function toast(message) {
    try { if (typeof addToast === "function") return addToast(message); } catch (e) {}
    try { if (typeof addLog === "function") return addLog(message, {}); } catch (e) {}
    try { console.log(message); } catch (e) {}
  }
  function log(message, deltas) {
    try { if (typeof addLog === "function") return addLog(message, deltas || {}); } catch (e) {}
    try { console.log(message, deltas || {}); } catch (e) {}
  }
  function apply(deltas) {
    try { if (typeof applyDeltas === "function") return applyDeltas(deltas || {}); } catch (e) {}
    try { if (typeof applyDelta === "function") return applyDelta(deltas || {}); } catch (e) {}
    var s = ensure();
    Object.keys(deltas || {}).forEach(function (key) {
      if (["money", "cash", "checking"].includes(key)) s.money = Math.round(num(s.money) + num(deltas[key]));
      else if (s.stats && key in s.stats) s.stats[key] = clamp(num(s.stats[key]) + num(deltas[key]), 0, 100);
      else s[key] = num(s[key]) + num(deltas[key]);
    });
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
    s.stats = s.stats || {};
    s.flags = s.flags || {};
    s.actionsTaken = s.actionsTaken || {};
    s.finance = s.finance || {};
    s.finance.businesses = Array.isArray(s.finance.businesses) ? s.finance.businesses : [];
    s.finance.debts = s.finance.debts || {};
    s.finance.incomeSources = s.finance.incomeSources || {};
    s.finance.businessTaxV1830 = s.finance.businessTaxV1830 || {};
    var bt = s.finance.businessTaxV1830;
    bt.history = Array.isArray(bt.history) ? bt.history : [];
    bt.processedAges = bt.processedAges || {};
    bt.personalRefunds = Math.max(0, num(bt.personalRefunds));
    bt.entityTaxes = Math.max(0, num(bt.entityTaxes));
    bt.distributions = Math.max(0, num(bt.distributions));
    bt.salaries = Math.max(0, num(bt.salaries));
    s.finance.businesses.forEach(function (b) { ensureBusiness(b); });
    return s;
  }

  var STRUCTURES = {
    soleprop: {
      name: "Sole Prop", cost: 0, minValue: 0, tax: "pass-through",
      retain: 0, entityRate: 0, shield: 0, compliance: 0,
      desc: "Simple side hustle. Profit goes straight to checking and personal tax. No real liability shield."
    },
    partnership: {
      name: "Partnership", cost: 900, minValue: 5000, tax: "pass-through split",
      retain: .10, entityRate: .02, shield: .10, compliance: 650,
      desc: "Shared ownership. Some money can stay inside the business, but most profit is still personal/pass-through."
    },
    llc: {
      name: "LLC", cost: 1200, minValue: 10000, tax: "flexible entity",
      retain: .65, entityRate: .07, shield: .35, compliance: 1200,
      desc: "Default growth structure. Most profit stays in the company. Only draws/distributions hit the owner personally."
    },
    scorp: {
      name: "S-Corp", cost: 3500, minValue: 50000, tax: "salary + distribution",
      retain: .52, entityRate: .05, shield: .45, compliance: 3000,
      desc: "Owner takes reasonable salary/distributions. Better for profitable service companies."
    },
    ccorp: {
      name: "C-Corp", cost: 8500, minValue: 150000, tax: "corporate tax first",
      retain: .88, entityRate: .21, shield: .65, compliance: 8000,
      desc: "Firm pays corporate tax. Owner is personally taxed only on salary/dividends/distributions."
    },
    holding: {
      name: "Holding Company", cost: 25000, minValue: 1000000, tax: "tax-efficient holding",
      retain: .94, entityRate: .14, shield: .80, compliance: 18000,
      desc: "Advanced structure for large assets, subsidiaries, and tax planning. High setup cost, high protection."
    }
  };

  var OPS = {
    manager: { name: "Operator", cost: 65000, boost: "risk", desc: "Reduces failure risk and makes the company less dependent on your yearly click." },
    bookkeeper: { name: "Bookkeeper", cost: 18000, boost: "tax", desc: "Improves clean books and reduces entity-tax leakage." },
    sales: { name: "Sales Lead", cost: 42000, boost: "growth", desc: "Improves revenue growth and breakout chances." },
    counsel: { name: "Business Counsel", cost: 30000, boost: "shield", desc: "Improves legal protection, contracts, and exemption odds." },
    insurance: { name: "Insurance", cost: 12000, boost: "loss", desc: "Reduces one bad year from wrecking personal cash." }
  };

  function structure(id) { return STRUCTURES[id] || STRUCTURES.soleprop; }
  function businesses() { return ensure().finance.businesses || []; }
  function businessById(id) { return businesses().find(function (b) { return String(b.id) === String(id); }) || null; }
  function businessCatalog() {
    try { if (typeof entrepreneurshipCatalog !== "undefined" && Array.isArray(entrepreneurshipCatalog)) return entrepreneurshipCatalog; } catch(e) {}
    try { if (Array.isArray(window.entrepreneurshipCatalog)) return window.entrepreneurshipCatalog; } catch(e) {}
    return [];
  }
  function catalogFor(id) { return businessCatalog().find(function (v) { return String(v.id) === String(id); }) || null; }
  function ensureBusiness(b) {
    if (!b) return b;
    var v = catalogFor(b.id) || {};
    if (!b.name) b.name = v.name || b.id || "Business";
    if (!b.category) b.category = v.category || "Business";
    if (b.value == null) b.value = 0;
    if (b.reputation == null) b.reputation = 10;
    if (b.lastIncome == null) b.lastIncome = 0;
    if (!b.entityType) b.entityType = num(b.value) >= 150000 ? "llc" : "soleprop";
    if (b.retainedEarnings == null) b.retainedEarnings = Math.max(0, num(b.businessCash));
    if (b.ownerDrawAvailable == null) b.ownerDrawAvailable = 0;
    if (b.entityTaxDebt == null) b.entityTaxDebt = 0;
    if (b.complianceDue == null) b.complianceDue = 0;
    b.ops = b.ops || {};
    b.historyV1830 = Array.isArray(b.historyV1830) ? b.historyV1830 : [];
    return b;
  }
  function totalBusinessCash() {
    return businesses().reduce(function (sum, b) { ensureBusiness(b); return sum + Math.max(0, num(b.retainedEarnings)); }, 0);
  }
  function totalEntityDebt() {
    return businesses().reduce(function (sum, b) { ensureBusiness(b); return sum + Math.max(0, num(b.entityTaxDebt)); }, 0);
  }
  function getCustomAmount(id, max) {
    var el = document.getElementById(id);
    var raw = el ? String(el.value || "") : "";
    var value = Math.round(Number(raw.replace(/[^0-9.]/g, "")) || 0);
    return Math.max(0, Math.min(value, Math.max(0, num(max))));
  }
  function amountFrom(raw, max, inputId) {
    if (raw === "all") return Math.max(0, num(max));
    if (raw === "half") return Math.round(Math.max(0, num(max)) / 2);
    if (raw === "custom") return getCustomAmount(inputId, max);
    return Math.max(0, Math.min(Math.round(num(raw)), Math.max(0, num(max))));
  }
  function hasAdvisorHelp() {
    var s = ensure();
    var raw = String(s.finance.accountant || s.finance.accountantPlan || s.finance.attorney || s.finance.legalPlan || "").toLowerCase();
    return /cpa|advisor|attorney|lawyer|legal|elite|tax|wealth|business/.test(raw);
  }
  function taxDiscount(b) {
    var discount = 0;
    if (b.ops && b.ops.bookkeeper) discount += .08;
    if (b.ops && b.ops.counsel) discount += .06;
    if (hasAdvisorHelp()) discount += .08;
    if (String(b.entityType) === "holding") discount += .05;
    return Math.min(.28, discount);
  }
  function protectionScore(b) {
    var st = structure(b.entityType);
    var score = st.shield;
    if (b.ops && b.ops.insurance) score += .10;
    if (b.ops && b.ops.counsel) score += .12;
    return clamp(score, 0, .95);
  }
  function currentBusinessModeLabel(b) {
    var st = structure(b.entityType);
    if (b.entityType === "soleprop") return "Personal/pass-through";
    if (b.entityType === "partnership") return "Partner split + partial reserve";
    if (b.entityType === "llc") return "Company reserve + owner draw";
    if (b.entityType === "scorp") return "Salary/distribution model";
    if (b.entityType === "ccorp") return "Corporate tax, owner taxed on payouts";
    return st.name + " model";
  }

  window.setBusinessEntityV1830 = function (businessId, entityType) {
    var s = ensure();
    var b = businessById(businessId);
    var st = structure(entityType);
    if (!b || !STRUCTURES[entityType]) return toast("Unknown business or entity type.");
    if (b.entityType === entityType) return toast(b.name + " already uses " + st.name + ".");
    if (num(b.value) < st.minValue) return toast(st.name + " needs business value of " + money(st.minValue) + ".");
    if (num(s.money) < st.cost) return toast("Setup cost is " + money(st.cost) + " checking.");
    s.money = Math.round(num(s.money) - st.cost);
    b.entityType = entityType;
    b.complianceDue = Math.max(num(b.complianceDue), Math.round(st.compliance));
    b.historyV1830.unshift({ age: num(s.age), action: "Entity changed", entity: st.name, cost: st.cost });
    log("Set up " + b.name + " as " + st.name + ". Future profit follows " + st.tax + ".", { money: -st.cost, stress: entityType === "holding" || entityType === "ccorp" ? 3 : 1 });
    apply({ stress: entityType === "holding" || entityType === "ccorp" ? 3 : 1 });
    saveRender();
  };

  window.hireBusinessOpsV1830 = function (businessId, role) {
    var s = ensure();
    var b = businessById(businessId);
    var op = OPS[role];
    if (!b || !op) return toast("Unknown business operation.");
    if (b.ops && b.ops[role]) return toast(op.name + " already active for " + b.name + ".");
    // v18.36: pay from company retained earnings first, then top up from personal
    // checking — same as asset upgrades. Lets you max the team with your own money
    // instead of being blocked when the company itself is cash-light.
    var available = Math.max(0, num(b.retainedEarnings));
    var fromBiz = Math.min(op.cost, available);
    var remaining = op.cost - fromBiz;
    if (remaining > Math.max(0, num(s.money))) return toast("Need " + money(op.cost) + " from company or personal cash.");
    b.retainedEarnings = Math.max(0, Math.round(available - fromBiz));
    s.money = Math.max(0, Math.round(num(s.money) - remaining));
    b.ops[role] = true;
    b.value = Math.round(num(b.value) * 1.015 + op.cost * .15);
    b.historyV1830.unshift({ age: num(s.age), action: "Hired " + op.name, cost: op.cost });
    log(b.name + " hired " + op.name + (remaining > 0 ? " (topped up from personal cash)." : " using company money."), { money: -remaining, confidence: 1 });
    saveRender();
  };

  window.distributeBusinessCashV1830 = function (businessId, rawAmount) {
    var s = ensure();
    var b = businessById(businessId);
    if (!b) return toast("Business not found.");
    ensureBusiness(b);
    var inputId = "v1830-dist-" + String(businessId).replace(/[^a-zA-Z0-9_-]/g, "");
    var amount = amountFrom(rawAmount, b.retainedEarnings, inputId);
    if (!amount) return toast("No retained earnings available to distribute.");
    b.retainedEarnings = Math.max(0, Math.round(num(b.retainedEarnings) - amount));
    b.ownerDrawAvailable = Math.max(0, Math.round(num(b.ownerDrawAvailable) + amount));
    s.money = Math.round(num(s.money) + amount);
    s.finance.incomeSources.businessDistributionsV1830 = Math.max(0, num(s.finance.incomeSources.businessDistributionsV1830) + amount);
    s.finance.lastFirmDistribution = Math.max(0, num(s.finance.lastFirmDistribution) + amount);
    s.finance.businessTaxV1830.distributions += amount;
    b.historyV1830.unshift({ age: num(s.age), action: "Owner distribution", amount: amount });
    log("Distributed " + money(amount) + " from " + b.name + " to checking. This is now personal taxable cash.", { money: amount });
    saveRender();
  };

  window.payOwnerSalaryV1830 = function (businessId, rawAmount) {
    var s = ensure();
    var b = businessById(businessId);
    if (!b) return toast("Business not found.");
    ensureBusiness(b);
    var inputId = "v1830-salary-" + String(businessId).replace(/[^a-zA-Z0-9_-]/g, "");
    var cap = Math.min(num(b.retainedEarnings), Math.max(5000, num(b.value) * .15));
    var amount = amountFrom(rawAmount, cap, inputId);
    if (!amount) return toast("No firm cash available for owner salary.");
    b.retainedEarnings = Math.max(0, Math.round(num(b.retainedEarnings) - amount));
    s.money = Math.round(num(s.money) + amount);
    s.finance.incomeSources.ownerSalaryV1830 = Math.max(0, num(s.finance.incomeSources.ownerSalaryV1830) + amount);
    s.finance.businessTaxV1830.salaries += amount;
    b.historyV1830.unshift({ age: num(s.age), action: "Owner salary", amount: amount });
    log("Paid yourself " + money(amount) + " salary from " + b.name + ". Salary is personal taxable income.", { money: amount, stress: -1 });
    apply({ stress: -1 });
    saveRender();
  };

  window.reinvestBusinessCashV1830 = function (businessId, rawAmount) {
    var s = ensure();
    var b = businessById(businessId);
    if (!b) return toast("Business not found.");
    ensureBusiness(b);
    var inputId = "v1830-reinvest-" + String(businessId).replace(/[^a-zA-Z0-9_-]/g, "");
    var amount = amountFrom(rawAmount, b.retainedEarnings, inputId);
    if (!amount) return toast("No retained earnings to reinvest.");
    b.retainedEarnings = Math.max(0, Math.round(num(b.retainedEarnings) - amount));
    b.value = Math.round(num(b.value) + amount * 1.25);
    b.reputation = clamp(num(b.reputation) + Math.max(1, Math.round(amount / Math.max(25000, num(b.value) / 8))), 0, 100);
    b.historyV1830.unshift({ age: num(s.age), action: "Reinvested", amount: amount });
    log("Reinvested " + money(amount) + " into " + b.name + ". Value and reputation improved.", { confidence: 1 });
    saveRender();
  };

  window.payBusinessEntityTaxV1830 = function (businessId, rawAmount) {
    var b = businessById(businessId);
    if (!b) return toast("Business not found.");
    ensureBusiness(b);
    var inputId = "v1830-tax-" + String(businessId).replace(/[^a-zA-Z0-9_-]/g, "");
    var debt = Math.max(0, num(b.entityTaxDebt));
    var amount = amountFrom(rawAmount, Math.min(debt, b.retainedEarnings), inputId);
    if (!amount) return toast("No business cash available for entity tax.");
    b.retainedEarnings = Math.max(0, Math.round(num(b.retainedEarnings) - amount));
    b.entityTaxDebt = Math.max(0, Math.round(debt - amount));
    ensure().finance.businessTaxV1830.entityTaxes += amount;
    b.historyV1830.unshift({ age: num(ensure().age), action: "Paid entity tax", amount: amount });
    log(b.name + " paid " + money(amount) + " entity tax from company cash.", {});
    saveRender();
  };

  window.payBusinessComplianceV1830 = function (businessId) {
    var b = businessById(businessId);
    if (!b) return toast("Business not found.");
    ensureBusiness(b);
    var due = Math.max(0, Math.round(num(b.complianceDue)));
    if (!due) return toast("No compliance bill due.");
    var paid = Math.min(due, Math.max(0, num(b.retainedEarnings)));
    if (!paid) return toast("Need company cash to pay compliance.");
    b.retainedEarnings = Math.max(0, Math.round(num(b.retainedEarnings) - paid));
    b.complianceDue = Math.max(0, due - paid);
    b.historyV1830.unshift({ age: num(ensure().age), action: "Paid compliance", amount: paid });
    log(b.name + " paid " + money(paid) + " in compliance/admin costs from business cash.", {});
    saveRender();
  };

  function reconcileBusinessYearV1830(silent) {
    var s = ensure();
    var ageKey = String(num(s.age));
    var bt = s.finance.businessTaxV1830;
    if (bt.processedAges[ageKey]) return false;
    var list = businesses();
    var totalPositive = 0;
    var entityPositive = 0;
    var passThroughPositive = 0;
    var redistributed = 0;
    var entityTax = 0;
    var refundedPersonalTax = 0;
    var logs = [];

    list.forEach(function (b) {
      ensureBusiness(b);
      var income = Math.round(num(b.lastIncome));
      if (!income) return;
      var st = structure(b.entityType);
      if (income > 0) totalPositive += income;
      if (income <= 0) {
        if (b.entityType !== "soleprop") {
          var loss = Math.abs(income);
          var used = Math.min(loss, Math.max(0, num(b.retainedEarnings)));
          if (used) b.retainedEarnings = Math.max(0, Math.round(num(b.retainedEarnings) - used));
          b.historyV1830.unshift({ age:num(s.age), action:"Operating loss", amount:income });
        }
        return;
      }
      if (b.entityType === "soleprop" || b.entityType === "partnership") {
        var keepPartnership = Math.round(income * st.retain);
        if (keepPartnership > 0) {
          s.money = Math.round(num(s.money) - keepPartnership);
          b.retainedEarnings = Math.max(0, Math.round(num(b.retainedEarnings) + keepPartnership));
          redistributed += keepPartnership;
        }
        passThroughPositive += income - keepPartnership;
        b.historyV1830.unshift({ age:num(s.age), action:"Pass-through year", income:income, retained:keepPartnership });
        return;
      }
      entityPositive += income;
      var retain = Math.round(income * st.retain);
      var ownerAutoDraw = Math.max(0, income - retain);
      s.money = Math.round(num(s.money) - retain);
      b.retainedEarnings = Math.max(0, Math.round(num(b.retainedEarnings) + retain));
      if (ownerAutoDraw > 0) {
        s.finance.incomeSources.businessDistributionsV1830 = Math.max(0, num(s.finance.incomeSources.businessDistributionsV1830) + ownerAutoDraw);
        s.finance.lastFirmDistribution = Math.max(0, num(s.finance.lastFirmDistribution) + ownerAutoDraw);
      }
      var taxBase = Math.max(0, retain);
      var taxRate = Math.max(0, st.entityRate * (1 - taxDiscount(b)));
      var tax = Math.round(taxBase * taxRate);
      if (tax > 0) {
        var paid = Math.min(tax, Math.max(0, num(b.retainedEarnings)));
        b.retainedEarnings = Math.max(0, Math.round(num(b.retainedEarnings) - paid));
        b.entityTaxDebt = Math.max(0, Math.round(num(b.entityTaxDebt) + (tax - paid)));
        entityTax += tax;
      }
      var compliance = Math.round(st.compliance * (b.ops && b.ops.bookkeeper ? .72 : 1));
      if (compliance > 0) b.complianceDue = Math.max(0, Math.round(num(b.complianceDue) + compliance));
      b.historyV1830.unshift({ age:num(s.age), action:"Entity year", income:income, retained:retain, ownerDraw:ownerAutoDraw, entityTax:tax });
      logs.push(b.name + " retained " + money(retain) + " and auto-drew " + money(ownerAutoDraw));
    });

    var businessTaxes = Math.max(0, num(s.finance.lastYearBusinessTaxes));
    if (businessTaxes > 0 && totalPositive > 0 && entityPositive > 0) {
      var entityShare = entityPositive / totalPositive;
      refundedPersonalTax = Math.round(businessTaxes * entityShare);
      if (refundedPersonalTax > 0) {
        s.money = Math.round(num(s.money) + refundedPersonalTax);
        s.finance.lastYearBusinessTaxes = Math.max(0, Math.round(businessTaxes - refundedPersonalTax));
        s.finance.lastYearTaxes = Math.max(0, Math.round(num(s.finance.lastYearTaxes) - refundedPersonalTax));
        bt.personalRefunds += refundedPersonalTax;
      }
    }

    bt.processedAges[ageKey] = true;
    bt.history.unshift({ age:num(s.age), totalPositive:totalPositive, entityPositive:entityPositive, passThroughPositive:passThroughPositive, movedToBusinessCash:redistributed, entityTax:entityTax, personalRefund:refundedPersonalTax, cash:totalBusinessCash(), debt:totalEntityDebt() });
    bt.history = bt.history.slice(0, 16);
    if (!silent && (entityPositive || redistributed || refundedPersonalTax || entityTax)) {
      log("Business entity cleanup: " + money(entityPositive) + " treated as company profit, " + money(refundedPersonalTax) + " personal-tax reclassified, " + money(entityTax) + " entity tax booked.", { money: refundedPersonalTax });
      if (logs[0]) log(logs.slice(0, 2).join(" · "), {});
    }
    return true;
  }

  window.reconcileBusinessEntitiesV1830 = function () {
    var changed = reconcileBusinessYearV1830(false);
    if (!changed) toast("No new business income to reclassify this year.");
    saveRender();
  };

  var previousResolve = window.resolveLifeAndFinanceYear || (typeof resolveLifeAndFinanceYear === "function" ? resolveLifeAndFinanceYear : null);
  if (previousResolve && !window.__ledgerResolve1830Wrapped) {
    window.__ledgerResolve1830Wrapped = true;
    window.resolveLifeAndFinanceYear = function () {
      var out = previousResolve.apply(this, arguments);
      try { reconcileBusinessYearV1830(false); } catch (e) { try { console.warn("v18.30 business entity reconcile failed", e); } catch(ignore) {} }
      return out;
    };
    try { resolveLifeAndFinanceYear = window.resolveLifeAndFinanceYear; } catch (e) {}
  }

  function structureOptionsHtml(b) {
    return Object.keys(STRUCTURES).map(function (id) {
      var st = STRUCTURES[id];
      var active = b.entityType === id;
      var locked = num(b.value) < st.minValue;
      return `<button class="v1830-entity-option ${active ? "active" : ""}" onclick="event.preventDefault();event.stopPropagation();setBusinessEntityV1830('${esc(b.id)}','${esc(id)}')" ${active || locked ? (active ? "disabled" : "disabled") : ""}>
        <b>${esc(st.name)}</b><span>${esc(st.tax)}</span><em>${locked ? "Needs " + money(st.minValue) + " value" : "Setup " + money(st.cost)}</em>
      </button>`;
    }).join("");
  }
  function opsHtml(b) {
    return Object.keys(OPS).map(function (id) {
      var op = OPS[id];
      var active = b.ops && b.ops[id];
      return `<button class="v1830-op ${active ? "active" : ""}" onclick="event.preventDefault();event.stopPropagation();hireBusinessOpsV1830('${esc(b.id)}','${esc(id)}')" ${active ? "disabled" : ""}>
        <b>${esc(op.name)}</b><span>${active ? "Active" : money(op.cost)}</span><em>${esc(op.desc)}</em>
      </button>`;
    }).join("");
  }
  function businessCardHtml(b) {
    ensureBusiness(b);
    var st = structure(b.entityType);
    var safeId = String(b.id).replace(/[^a-zA-Z0-9_-]/g, "");
    var debt = Math.max(0, num(b.entityTaxDebt));
    var compliance = Math.max(0, num(b.complianceDue));
    var recent = (b.historyV1830 || []).slice(0, 3).map(function (h) {
      return `<span>${esc(h.action || "Event")} ${h.amount != null ? money(h.amount) : h.income != null ? money(h.income) : ""}</span>`;
    }).join("");
    return `<div class="v1830-business-card">
      <div class="v1830-business-head"><div><b>${esc(b.name)}</b><span>${esc(b.category || "Business")} · ${esc(currentBusinessModeLabel(b))}</span></div><strong>${esc(st.name)}</strong></div>
      <div class="v1830-grid four">
        <div class="v1830-metric"><span>Value</span><b>${money(b.value)}</b></div>
        <div class="v1830-metric good"><span>Company cash</span><b>${money(b.retainedEarnings)}</b></div>
        <div class="v1830-metric ${debt ? "bad" : "good"}"><span>Entity tax debt</span><b>${money(debt)}</b></div>
        <div class="v1830-metric ${compliance ? "warn" : "good"}"><span>Compliance due</span><b>${money(compliance)}</b></div>
      </div>
      <div class="v1830-note"><b>Tax treatment:</b> ${esc(st.desc)} Protection score ${pct(protectionScore(b))}. Tax discount from bookkeeper/counsel/advisors: ${pct(taxDiscount(b))}.</div>
      <div class="v1830-subtitle">Entity setup</div><div class="v1830-entity-grid">${structureOptionsHtml(b)}</div>
      <div class="v1830-subtitle">Owner money controls</div>
      <div class="v1830-actions">
        <button class="money-btn green" onclick="event.preventDefault();event.stopPropagation();distributeBusinessCashV1830('${esc(b.id)}','all')" ${num(b.retainedEarnings) ? "" : "disabled"}>Distribute All</button>
        <button class="money-btn blue" onclick="event.preventDefault();event.stopPropagation();payOwnerSalaryV1830('${esc(b.id)}',25000)" ${num(b.retainedEarnings) ? "" : "disabled"}>Pay $25K Salary</button>
        <button class="money-btn gold" onclick="event.preventDefault();event.stopPropagation();reinvestBusinessCashV1830('${esc(b.id)}','half')" ${num(b.retainedEarnings) ? "" : "disabled"}>Reinvest Half</button>
        <button class="money-btn red" onclick="event.preventDefault();event.stopPropagation();payBusinessEntityTaxV1830('${esc(b.id)}','all')" ${debt && num(b.retainedEarnings) ? "" : "disabled"}>Pay Entity Tax</button>
        <button class="money-btn" onclick="event.preventDefault();event.stopPropagation();payBusinessComplianceV1830('${esc(b.id)}')" ${compliance && num(b.retainedEarnings) ? "" : "disabled"}>Pay Compliance</button>
      </div>
      <div class="v1830-custom-row"><input id="v1830-dist-${esc(safeId)}" type="number" min="0" placeholder="Custom distribution" /><button class="money-btn green" onclick="event.preventDefault();event.stopPropagation();distributeBusinessCashV1830('${esc(b.id)}','custom')">Distribute</button></div>
      <div class="v1830-custom-row"><input id="v1830-reinvest-${esc(safeId)}" type="number" min="0" placeholder="Custom reinvest" /><button class="money-btn gold" onclick="event.preventDefault();event.stopPropagation();reinvestBusinessCashV1830('${esc(b.id)}','custom')">Reinvest</button></div>
      <div class="v1830-subtitle">Operations</div><div class="v1830-op-grid">${opsHtml(b)}</div>
      ${recent ? `<div class="v1830-history">${recent}</div>` : ""}
    </div>`;
  }
  function launchBoardHtml() {
    var s = ensure();
    var owned = businesses();
    var catalog = businessCatalog().slice(0, 18);
    if (!catalog.length) return "";
    var cards = catalog.map(function (v) {
      var exists = owned.some(function (b) { return String(b.id) === String(v.id); });
      var missing = [];
      if (num(s.age) < num(v.minAge)) missing.push("Age " + num(v.minAge) + "+");
      if (num(s.money) < num(v.startup)) missing.push(money(num(v.startup)) + " startup cash");
      if (exists) missing.push("Already owned");
      var ready = !missing.length;
      return `<div class="v1830-launch ${ready ? "ready" : "locked"}"><div><b>${esc(v.name)}</b><span>${esc(v.category || "Business")} · ${money(v.yearlyMin || 0)} to ${money(v.yearlyMax || 0)}/yr</span></div><em>${ready ? "Ready to launch" : missing.join(" · ")}</em><button class="money-btn ${ready ? "green" : ""}" onclick="event.preventDefault();event.stopPropagation();startVenture && startVenture('${esc(v.id)}')" ${ready ? "" : "disabled"}>Start</button></div>`;
    }).join("");
    return `<div class="v1830-launch-board"><div class="v1830-subtitle">Launch Board: real requirements</div><div class="v1830-launch-grid">${cards}</div></div>`;
  }
  function renderBusinessCommandV1830() {
    var s = ensure();
    var list = businesses();
    var bt = s.finance.businessTaxV1830 || {};
    var history = (bt.history || [])[0];
    return `<section class="panel money-section v1830-business-command">
      <div class="money-section-title">Business Ownership Command <span>entity, tax, cash controls</span></div>
      <div class="v1830-note">Businesses now have legal/tax structures. Sole props pass through to you. LLC/S-Corp/C-Corp/Holding Company can retain profit inside the business, pay entity tax from company cash, and only tax you personally when you take salary or distributions.</div>
      <div class="v1830-grid four">
        <div class="v1830-metric"><span>Businesses</span><b>${list.length}</b></div>
        <div class="v1830-metric good"><span>Company cash</span><b>${money(totalBusinessCash())}</b></div>
        <div class="v1830-metric ${totalEntityDebt() ? "bad" : "good"}"><span>Entity tax debt</span><b>${money(totalEntityDebt())}</b></div>
        <div class="v1830-metric gold"><span>Reclassified</span><b>${money(bt.personalRefunds || 0)}</b></div>
      </div>
      ${history ? `<div class="v1830-note small">Last yearly cleanup: ${money(history.entityPositive || 0)} company profit · ${money(history.personalRefund || 0)} personal-tax reclassified · ${money(history.entityTax || 0)} entity tax.</div>` : ""}
      <div class="v1830-actions"><button class="money-btn gold" onclick="event.preventDefault();event.stopPropagation();reconcileBusinessEntitiesV1830()">Reclassify This Year</button></div>
      ${list.length ? `<div class="v1830-business-list">${list.map(businessCardHtml).join("")}</div>` : `<div class="v1830-empty">No business owned yet. Use the launch board below when you meet age and cash requirements.</div>`}
      ${launchBoardHtml()}
    </section>`;
  }

  function removeBusinessDuplicates(html) {
    var out = String(html || "");
    ["v1830-business-command"].forEach(function (marker) {
      var idx = out.indexOf(marker), guard = 0;
      while (idx >= 0 && guard++ < 15) {
        var start = out.lastIndexOf("<section", idx);
        var end = out.indexOf("</section>", idx);
        if (start < 0 || end < 0) break;
        out = out.slice(0, start) + out.slice(end + 10);
        idx = out.indexOf(marker);
      }
    });
    return out;
  }
  var previousRender = window.renderHubContent || (typeof renderHubContent === "function" ? renderHubContent : null);
  if (previousRender && !window.__ledgerRender1830Wrapped) {
    window.__ledgerRender1830Wrapped = true;
    window.renderHubContent = function (hubId) {
      ensure();
      var html = "";
      try { html = previousRender.apply(this, arguments) || ""; } catch (e) { html = ""; }
      html = removeBusinessDuplicates(html);
      if (hubId === "business") return renderBusinessCommandV1830() + html;
      if (hubId === "finance" || hubId === "money") {
        var summary = `<section class="money-section v1830-business-summary"><div class="money-section-title">Business Entity Snapshot <span>company vs personal</span></div><div class="v1830-grid four"><div class="v1830-metric"><span>Business value</span><b>${money(businesses().reduce(function(sum,b){return sum+Math.max(0,num(b.value));},0))}</b></div><div class="v1830-metric good"><span>Company cash</span><b>${money(totalBusinessCash())}</b></div><div class="v1830-metric bad"><span>Entity debt</span><b>${money(totalEntityDebt())}</b></div><div class="v1830-metric gold"><span>Owner payouts</span><b>${money(num(ensure().finance.incomeSources.businessDistributionsV1830)+num(ensure().finance.incomeSources.ownerSalaryV1830))}</b></div></div></section>`;
        return summary + html;
      }
      return html;
    };
    try { renderHubContent = window.renderHubContent; } catch (e) {}
  }

  function injectStyles() {
    if (document.getElementById("ledger-v1830-style")) return;
    var style = document.createElement("style");
    style.id = "ledger-v1830-style";
    style.textContent = [
      ".v1830-business-command,.v1830-business-summary{border-color:rgba(143,175,108,.46)!important;background:linear-gradient(135deg,rgba(18,36,24,.96),rgba(29,25,20,.98))!important;overflow:hidden!important}",
      ".v1830-note{font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.55;color:#b9a98e;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.035);border-radius:10px;padding:10px;margin:8px 0}.v1830-note b{color:#d8ad6d}.v1830-note.small{font-size:9px}",
      ".v1830-grid{display:grid;gap:8px;margin:10px 0}.v1830-grid.four{grid-template-columns:repeat(4,minmax(0,1fr))}.v1830-metric{border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.045);border-radius:10px;padding:10px;min-width:0}.v1830-metric span{display:block;color:#aa9a82;font-family:'JetBrains Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:.08em}.v1830-metric b{display:block;font-family:'JetBrains Mono',monospace;font-size:16px;margin-top:4px;color:#f2e7d6;overflow-wrap:anywhere}.v1830-metric.good b{color:#8faf6c}.v1830-metric.bad b{color:#cc7661}.v1830-metric.warn b,.v1830-metric.gold b{color:#d8ad6d}",
      ".v1830-business-list{display:grid;gap:11px;margin-top:12px}.v1830-business-card{border:1px solid rgba(255,255,255,.10);background:rgba(20,17,13,.46);border-radius:14px;padding:12px}.v1830-business-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:8px}.v1830-business-head b{font-size:17px}.v1830-business-head span{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;margin-top:3px}.v1830-business-head strong{font-family:'JetBrains Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#14110d;background:#8faf6c;border-radius:999px;padding:5px 8px;white-space:nowrap}",
      ".v1830-subtitle{font-family:'JetBrains Mono',monospace;color:#d8ad6d;font-size:10px;text-transform:uppercase;letter-spacing:.14em;margin:12px 0 7px}.v1830-entity-grid,.v1830-op-grid,.v1830-launch-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.v1830-entity-option,.v1830-op,.v1830-launch{border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.04);color:#f2e7d6;border-radius:10px;padding:10px;text-align:left}.v1830-entity-option.active,.v1830-op.active,.v1830-launch.ready{border-color:rgba(143,175,108,.55);background:rgba(143,175,108,.10)}.v1830-entity-option b,.v1830-op b,.v1830-launch b{display:block;font-size:13px}.v1830-entity-option span,.v1830-op span,.v1830-launch span{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:9px;margin-top:3px}.v1830-entity-option em,.v1830-op em,.v1830-launch em{display:block;color:#d8ad6d;font-family:'JetBrains Mono',monospace;font-size:9px;font-style:normal;margin-top:5px;line-height:1.35}.v1830-entity-option:disabled,.v1830-op:disabled,.v1830-launch.locked{opacity:.62;cursor:not-allowed}",
      ".v1830-actions{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}.v1830-actions .money-btn{flex:1 1 120px}.v1830-custom-row{display:grid;grid-template-columns:1fr auto;gap:7px;margin-top:7px}.v1830-custom-row input{min-width:0}.v1830-history{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.v1830-history span{border:1px solid rgba(255,255,255,.10);border-radius:999px;padding:4px 8px;color:#aa9a82;font-family:'JetBrains Mono',monospace;font-size:9px}.v1830-empty{border:1px dashed rgba(255,255,255,.14);border-radius:10px;padding:14px;color:#aa9a82;font-size:13px;line-height:1.45}.v1830-launch{display:grid;grid-template-columns:1fr auto;gap:7px;align-items:center}.v1830-launch button{grid-column:1/-1}",
      "@media(max-width:760px){.v1830-grid.four{grid-template-columns:repeat(2,minmax(0,1fr))}.v1830-entity-grid,.v1830-op-grid,.v1830-launch-grid{grid-template-columns:1fr}}@media(max-width:430px){.v1830-grid.four{grid-template-columns:1fr}.v1830-custom-row{grid-template-columns:1fr}.v1830-actions .money-btn{width:100%;flex-basis:100%}}"
    ].join("\n");
    document.head.appendChild(style);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", injectStyles); else injectStyles();
})();

