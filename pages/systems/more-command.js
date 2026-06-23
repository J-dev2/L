(function () {
  var VERSION = "v18.49";
  var previousRenderHubContent = window.renderHubContent || (typeof renderHubContent === "function" ? renderHubContent : null);

  function getState() {
    try { if (window.state) return window.state; } catch (e) {}
    try { if (typeof state !== "undefined" && state) return state; } catch (e2) {}
    return {};
  }

  function n(value) {
    var out = Number(value);
    return Number.isFinite(out) ? out : 0;
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch];
    });
  }

  function attr(value) {
    return esc(value).replace(/\n/g, " ");
  }

  function titleCase(value) {
    return String(value || "").replace(/[_-]+/g, " ").replace(/\b\w/g, function (m) { return m.toUpperCase(); });
  }

  function moneyText(value) {
    try {
      if (typeof money === "function") return money(value);
    } catch (e) {}
    try {
      if (typeof fmtMoney === "function") return fmtMoney(value);
    } catch (e2) {}
    var amount = n(value);
    var sign = amount < 0 ? "-" : "";
    var abs = Math.abs(amount);
    var units = [
      [1e15, "Q"],
      [1e12, "T"],
      [1e9, "B"],
      [1e6, "M"],
      [1e3, "K"]
    ];
    for (var i = 0; i < units.length; i += 1) {
      if (abs >= units[i][0]) {
        return sign + "$" + (abs / units[i][0]).toFixed(abs >= units[i][0] * 100 ? 0 : 1).replace(/\.0$/, "") + units[i][1];
      }
    }
    return sign + "$" + Math.round(abs).toLocaleString();
  }

  function pctText(value) {
    var p = n(value);
    return Math.round(p * 10) / 10 + "%";
  }

  function activeSlotNumber() {
    try {
      if (typeof activeSlot !== "undefined" && activeSlot) return Math.max(1, Math.round(Number(activeSlot) || 1));
    } catch (e) {}
    try {
      var stored = localStorage.getItem("ledger-active-slot");
      if (stored) return Math.max(1, Math.round(Number(stored) || 1));
    } catch (e2) {}
    return 1;
  }

  function totalSlots() {
    try {
      if (typeof NUM_SLOTS !== "undefined" && NUM_SLOTS) return Math.max(1, Number(NUM_SLOTS) || 5);
    } catch (e) {}
    return 5;
  }

  function slotKeyFor(idx) {
    try {
      if (typeof slotKey === "function") return slotKey(idx);
    } catch (e) {}
    return "ledger-life-slot-" + idx;
  }

  function readStorageJson(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function readSlot(idx) {
    return readStorageJson(slotKeyFor(idx));
  }

  function saveRender() {
    try { if (typeof save === "function") save(); } catch (e) {}
    try { if (typeof render === "function") render(); } catch (e2) {}
  }

  function toast(msg) {
    try {
      if (typeof addToast === "function") addToast(msg);
      else if (window.console) console.log(msg);
    } catch (e) {}
    return false;
  }

  function routeHub(id) {
    id = String(id || "").toLowerCase();
    var map = {
      lifehub: "lifehub",
      life: "lifehub",
      stack: "lifehub",
      "life-stack": "lifehub",
      people: "people",
      relationships: "people",
      family: "people",
      dating: "people",
      education: "school",
      school: "school",
      college: "school",
      job: "career",
      career: "career",
      work: "career",
      finance: "finance",
      networth: "finance",
      network: "finance",
      money: "money",
      investments: "brokerage",
      investing: "brokerage",
      stocks: "brokerage",
      brokerage: "brokerage",
      legal: "law",
      law: "law",
      tax: "law",
      taxlaw: "law",
      trust: "trust",
      trusts: "trust",
      familytrust: "trust",
      shopping: "shopping",
      shop: "shopping",
      mall: "shopping",
      hustles: "hustles",
      hustle: "hustles",
      sidehustle: "hustles",
      business: "business",
      biz: "business",
      company: "business",
      entrepreneurship: "entrepreneurship",
      founder: "entrepreneurship",
      startup: "entrepreneurship",
      health: "health",
      wellness: "health",
      home: "home",
      housing: "home",
      property: "home",
      realestate: "home",
      "real-estate": "home",
      vehicles: "vehicles",
      vehicle: "vehicles",
      cars: "vehicles",
      car: "vehicles",
      garage: "vehicles",
      stats: "stats",
      allstats: "stats",
      more: "more"
    };
    var target = map[id] || id;
    try {
      if (typeof setTabV16 === "function") { setTabV16(target); return false; }
    } catch (e) {}
    try {
      if (typeof setTab === "function") { setTab(target); return false; }
    } catch (e2) {}
    return toast("That hub is not available in this build yet.");
  }

  window.openMoreHubV1848 = function (id) {
    if (id === "stack" || id === "landing") {
      try { location.href = "index.html"; } catch (e) {}
      return false;
    }
    if (id === "sandbox") {
      try { if (typeof goSandbox === "function") { goSandbox(); return false; } } catch (e2) {}
      try { location.href = "index.html"; } catch (e3) {}
      return false;
    }
    return routeHub(id);
  };
  window.openMoreHubV1845 = window.openMoreHubV1848;

  window.scrollMoreSectionV1848 = function (id) {
    try {
      var el = document.querySelector('[data-more-v1848-section="' + String(id).replace(/"/g, "") + '"]');
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {}
    return false;
  };
  window.scrollMoreSectionV1845 = window.scrollMoreSectionV1848;

  window.moreActionV1848 = function (event, action, arg) {
    try {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
    } catch (e) {}

    var s = getState();
    if (action === "open") return window.openMoreHubV1848(arg);
    if (action === "stack") return window.openMoreHubV1848("stack");
    if (action === "sandbox") return window.openMoreHubV1848("sandbox");
    if (action === "scroll") return window.scrollMoreSectionV1848(arg);

    if (action === "saveCheckpoint") {
      try {
        if (typeof createWaybackCheckpointV1823 === "function") return createWaybackCheckpointV1823();
      } catch (e2) {}
      try {
        if (typeof createTimeCheckpointV1816 === "function") return createTimeCheckpointV1816("Manual checkpoint");
      } catch (e3) {}
      try {
        s.timeSnapshotsV1814 = Array.isArray(s.timeSnapshotsV1814) ? s.timeSnapshotsV1814 : [];
        s.timeSnapshotsV1814.unshift({ age: s.age || 0, at: Date.now(), label: "Manual checkpoint", state: JSON.parse(JSON.stringify(s)) });
        s.timeSnapshotsV1814 = s.timeSnapshotsV1814.slice(0, 5);
        saveRender();
        return toast("Checkpoint saved.");
      } catch (e4) {
        return toast("Could not save a checkpoint.");
      }
    }

    if (action === "restoreLatest") {
      var slot = activeSlotNumber();
      try {
        if (typeof waybackLifeSlotV1823 === "function") return waybackLifeSlotV1823(slot);
      } catch (e5) {}
      try {
        if (typeof waybackLifeSlotV1820 === "function") return waybackLifeSlotV1820(slot);
      } catch (e6) {}
      try {
        if (typeof rewindOneYearV1814 === "function") return rewindOneYearV1814();
      } catch (e7) {}
      return toast("No restore hook is available yet.");
    }

    if (action === "switchSlot" || action === "newSlot") {
      var idx = Math.max(1, Math.round(Number(arg) || activeSlotNumber()));
      try {
        if (typeof switchLifeSlotV186 === "function") return switchLifeSlotV186(idx);
      } catch (e8) {}
      try {
        if (typeof pickSlot === "function") return pickSlot(idx);
      } catch (e9) {}
      try {
        if (typeof loadFromSlot === "function") return loadFromSlot(idx);
      } catch (e10) {}
      return window.openMoreHubV1848("stack");
    }

    if (action === "backup") {
      try {
        localStorage.setItem("ledger_v1848_manual_backup_slot_" + activeSlotNumber(), JSON.stringify(s));
        return toast("Manual backup saved.");
      } catch (e11) {
        return toast("Backup could not be written.");
      }
    }

    if (action === "repairSlot") {
      try {
        if (typeof recoverLedgerSlotV18334 === "function") return recoverLedgerSlotV18334(activeSlotNumber());
      } catch (e12) {}
      try {
        if (typeof repairCurrentSlotV1833 === "function") return repairCurrentSlotV1833();
      } catch (e13) {}
      return toast("No slot repair hook is available yet.");
    }

    if (action === "repairCarry") {
      try {
        if (typeof repairLegacyCarryV1847 === "function") return repairLegacyCarryV1847();
      } catch (e14) {}
      return toast("Legacy repair is not available in this build.");
    }

    if (action === "toggleStress") {
      s.sandbox = s.sandbox || {};
      s.sandbox.stressFreeLife = !s.sandbox.stressFreeLife;
      s.sandbox.noStress = !!s.sandbox.stressFreeLife;
      try { window.state = s; } catch (e15) {}
      saveRender();
      return false;
    }

    if (action === "dryRun") return routeHub("law");
    return false;
  };

  function click(action, arg) {
    return "return moreActionV1848(event,'" + attr(action) + "','" + attr(arg || "") + "')";
  }

  function btn(label, action, arg, cls, disabled) {
    return '<button class="more-v1848-btn ' + esc(cls || "") + '" onclick="' + click(action, arg) + '"' + (disabled ? " disabled" : "") + ">" + esc(label) + "</button>";
  }

  function routeButton(label, action, arg, note, cls, status) {
    return '<button class="more-v1848-route ' + esc(cls || "") + '" onclick="' + click(action || "open", arg || "") + '">' +
      '<span>' + esc(status || "") + '</span><b>' + esc(label) + '</b><em>' + esc(note || "") + '</em></button>';
  }

  function pill(label, value, cls) {
    return '<span class="more-v1848-pill ' + esc(cls || "") + '"><b>' + esc(label) + '</b> ' + esc(value) + '</span>';
  }

  function metric(label, value, note, cls) {
    return '<div class="more-v1848-metric ' + esc(cls || "") + '"><span>' + esc(label) + '</span><b>' + esc(value) + '</b><em>' + esc(note || "") + '</em></div>';
  }

  function card(title, tag, body, cls, key) {
    return '<section class="more-v1848-card ' + esc(cls || "") + '" data-more-v1848-section="' + esc(key || title) + '">' +
      '<div class="more-v1848-card-head"><div><span>' + esc(tag || "") + '</span><h3>' + esc(title) + '</h3></div></div>' +
      body +
      '</section>';
  }

  function finance(s) {
    s = s || getState();
    s.finance = s.finance || {};
    return s.finance;
  }

  function arraySum(items, fn) {
    if (!Array.isArray(items)) return 0;
    return items.reduce(function (sum, item) { return sum + n(fn(item)); }, 0);
  }

  function businessList(s) {
    var f = finance(s);
    var out = [];
    if (Array.isArray(f.businesses)) out = out.concat(f.businesses.filter(function (b) { return b && !b._migratedToBizV1861; }));
    if (Array.isArray(s.businesses)) out = out.concat(s.businesses);
    var B = f.bizV1860 || {};
    if (Array.isArray(B.businesses)) out = out.concat(B.businesses.filter(function (b) { return b && b.active !== false && !b.dead; }));
    return out;
  }

  function businessValue(s) {
    return arraySum(businessList(s), function (b) {
      return n(b.value || b.valuation || b.marketValue || b.companyValue) + n(b.cash || b.retainedEarnings || b.companyCash || b.cashInBusiness);
    });
  }

  function trustBusinessStake(s) {
    return arraySum(businessList(s), function (b) {
      var value = n(b.value || b.valuation || b.marketValue || b.companyValue) + n(b.cash || b.retainedEarnings || b.companyCash);
      var pct = 0;
      if (b.familyV1833) pct = n(b.familyV1833.trustPercent);
      pct = pct || n(b.trustPercent || b.familyTrustPercent || b.inTrustPercent);
      if (pct > 1) pct = pct / 100;
      if (!pct && (b.inTrust || b.trustOwned || b.familyTrustOwned)) pct = 1;
      return value * Math.max(0, Math.min(1, pct));
    });
  }

  function trustFundTotal(s) {
    var f = finance(s);
    var trust = f.familyTrustV1839 || f.familyTrust || {};
    var fund = trust.familyFund || f.familyFund || {};
    var childTrusts = f.trustFunds || trust.trustFunds || {};
    var childTotal = Object.keys(childTrusts || {}).reduce(function (sum, key) { return sum + n(childTrusts[key]); }, 0);
    return n(f.familyTrustValue) + n(trust.corpus || trust.balance || trust.cash) + n(f.trustCash || trust.trustCash) + n(f.estateTrustCash) + n(fund.capital || fund.cash || fund.balance) + childTotal;
  }

  function protectedFamilyCapital(s) {
    return trustFundTotal(s) + trustBusinessStake(s);
  }

  function childrenCount(s) {
    var rels = s && s.relationships ? s.relationships : {};
    return Object.keys(rels).filter(function (key) {
      var role = String((rels[key] && rels[key].role) || "").toLowerCase();
      return role === "child" || role.indexOf("child") >= 0 || role.indexOf("son") >= 0 || role.indexOf("daughter") >= 0;
    }).length;
  }

  function familyScore(s) {
    var f = finance(s);
    if (f.familyScore != null) return Math.max(0, Math.min(100, Math.round(n(f.familyScore))));
    if (f.familyTrustScore != null) return Math.max(0, Math.min(100, Math.round(n(f.familyTrustScore))));
    var trust = f.familyTrustV1839 || f.familyTrust || {};
    var score = 0;
    if (trust.created || trust.active || trust.plan) score += 22;
    if (protectedFamilyCapital(s) > 0) score += 18;
    if (trustBusinessStake(s) > 0) score += 18;
    score += Math.min(24, childrenCount(s) * 8);
    score += Math.min(18, Math.floor(n(s.age) / 6));
    return Math.max(0, Math.min(100, score));
  }

  function investmentValue(s) {
    var f = finance(s);
    var firm = f.personalFirm || f.personalFund || {};
    return n(f.brokerage) + n(f.brokerageCash) + n(s.brokerage) +
      n(f.stockValue) + n(f.realStocksValue) + n(f.marketValue) +
      n(f.managedPortfolio) + n(f.outsideManaged) + n(f.managerCapital) +
      n(f.externalManager && f.externalManager.capital) +
      n(f.managerFirmsV1829 && f.managerFirmsV1829.capital) +
      n(f.personalFirmCash) + n(f.firmCashV1828) + n(f.firmCash) +
      n(firm.cash) + n(firm.managed) + n(firm.capital) + n(firm.balance) + n(firm.account);
  }

  function debtValue(s) {
    var f = finance(s);
    return n(s.debt) + n(f.taxDebt) + n(f.creditCardDebt) + n(f.assetBackedLoan) + n(f.schoolDebt) + n(f.medicalDebt) + n(f.businessDebt);
  }

  function netWorth(s) {
    try {
      if (typeof financeNetWorth === "function") return n(financeNetWorth(s));
    } catch (e) {}
    return n(s.money) + n(s.savings) + n(s.ira) + n(s.retirement401k) + investmentValue(s) + businessValue(s) + trustFundTotal(s) - debtValue(s);
  }

  function checkpointList(s) {
    var snaps = [];
    if (Array.isArray(s.timeSnapshotsV1814)) snaps = snaps.concat(s.timeSnapshotsV1814);
    if (Array.isArray(s.waybackSnapshotsV1823)) snaps = snaps.concat(s.waybackSnapshotsV1823);
    if (s.legacy && Array.isArray(s.legacy.checkpoints)) snaps = snaps.concat(s.legacy.checkpoints);
    return snaps.filter(Boolean).slice(0, 5);
  }

  function dateShort(value) {
    if (!value) return "Manual save";
    try { return new Date(value).toLocaleString(); } catch (e) { return "Manual save"; }
  }

  function residenceText(s) {
    var f = finance(s);
    try {
      if (typeof countryV6 === "function") {
        var c = countryV6(f.taxCountry || "us");
        var r = typeof regionV6 === "function" ? regionV6((c && c.id) || f.taxCountry || "us", f.taxRegion) : null;
        if (c && r) return c.name + " / " + (r.name || r[1] || f.taxRegion || "Region");
      }
    } catch (e) {}
    var countryNames = { us: "United States", ca: "Canada", uk: "United Kingdom", de: "Germany", fr: "France", sg: "Singapore", ae: "United Arab Emirates", th: "Thailand", vn: "Vietnam" };
    var regionNames = { pa: "Pennsylvania", de: "Delaware", ca: "California", ny: "New York", tx: "Texas", fl: "Florida", wa: "Washington" };
    return (countryNames[f.taxCountry] || titleCase(f.taxCountry || "United States")) + " / " + (regionNames[f.taxRegion] || titleCase(f.taxRegion || "Home"));
  }

  function lastStory(s) {
    var log = Array.isArray(s.log) ? s.log : [];
    var item = log[0] || log[log.length - 1] || null;
    if (!item) return "No recent system note yet.";
    return item.text || item.msg || item.message || String(item);
  }

  function legacyTransferText(s) {
    var f = finance(s);
    var trust = f.familyTrustV1839 || f.familyTrust || {};
    var values = [
      f.lastLegacyCarryV1847,
      f.lastLegacyCarry,
      trust.lastTransfer,
      trust.lastCarry,
      s.legacy && s.legacy.lastCarry
    ];
    for (var i = 0; i < values.length; i += 1) {
      var item = values[i];
      if (!item) continue;
      if (typeof item === "number") return moneyText(item);
      if (typeof item === "string") return item;
      if (item.amount != null) return moneyText(item.amount);
      if (item.value != null) return moneyText(item.value);
    }
    return "None";
  }

  function timeCard(s) {
    var snaps = checkpointList(s);
    var rows = snaps.length ? snaps.map(function (snap, idx) {
      return '<div class="more-v1848-save-row"><div><b>' + esc(snap.label || "Checkpoint") + '</b><span>Age ' + esc(snap.age == null ? (s.age || 0) : snap.age) + " - " + esc(dateShort(snap.at)) + '</span></div>' + (idx === 0 ? '<strong>latest</strong>' : "") + '</div>';
    }).join("") : '<div class="more-v1848-empty">No checkpoints yet. Save one before risky choices.</div>';
    return card("Time + Saves", "wayback, backups, exit", [
      '<div class="more-v1848-inline">',
      metric("Checkpoints", snaps.length + "/5", "Newest restore runs first.", "violet"),
      metric("Active slot", "Slot " + activeSlotNumber(), "The life currently loaded.", "blue"),
      metric("Manual backup", "Ready", "Writes a local safety copy.", "green"),
      "</div>",
      '<div class="more-v1848-actions">',
      btn("Save checkpoint", "saveCheckpoint", "", "green", false),
      btn("Restore latest", "restoreLatest", "", "gold", !snaps.length),
      btn("Backup now", "backup", "", "blue", false),
      btn("Return to Life Stack", "stack", "", "violet", false),
      "</div>",
      '<div class="more-v1848-scroll-list">' + rows + "</div>"
    ].join(""), "time", "time");
  }

  function legacyCard(s) {
    var f = finance(s);
    var trust = f.familyTrustV1839 || f.familyTrust || {};
    var protectedCapital = protectedFamilyCapital(s);
    var title = protectedCapital > 0 || trust.created || trust.active ? "Family structure active" : "No family structure yet";
    var note = protectedCapital > 0 ? "Protected assets, trust ownership, and successor carry are being watched here." : "Create a trust in Legal, title businesses, or move capital before switching generations.";
    var chips = [
      metric("Protected family capital", moneyText(protectedCapital), "Trust cash plus titled business stake.", protectedCapital > 0 ? "green" : "bad"),
      metric("Trust business stake", moneyText(trustBusinessStake(s)), "Business value marked as family trust owned.", trustBusinessStake(s) > 0 ? "green" : "gold"),
      metric("Family score", familyScore(s) + "/100", "Succession health, documents, governance, and heirs.", familyScore(s) >= 50 ? "green" : "gold"),
      metric("Family fund", moneyText(n((trust.familyFund || {}).capital) || n((f.familyFund || {}).capital)), "Optional family investment pool.", "blue"),
      metric("Trust cash", moneyText(n(f.trustCash || f.estateTrustCash || trust.trustCash)), "Spendable or protected trust pool.", "green"),
      metric("Last transfer", legacyTransferText(s), "Successor transfer record.", legacyTransferText(s) === "None" ? "gold" : "green")
    ].join("");
    return card("👨‍👩‍👧 Family command desk", "legacy + trust", [
      '<div class="more-v1848-feature">',
      '<div><span>Legacy command</span><h4>' + esc(title) + '</h4><p>' + esc(note) + '</p></div>',
      '<strong>' + familyScore(s) + '<small>score</small></strong>',
      "</div>",
      '<div class="more-v1848-inline">' + chips + "</div>",
      '<div class="more-v1848-actions">',
      btn("🏛️ Open Family Office (Trust + Succession)", "open", "law", "green", false),
      btn("🏢 Open Family Business", "open", "business", "blue", false),
      btn("🛠️ Repair Carry", "repairCarry", "", "red", false),
      "</div>"
    ].join(""), "legacy wide", "legacy");
  }

  function worldCard(s) {
    var f = finance(s);
    var projected = n(f.projectedTax || f.lastTax || f.taxProjection || f.taxDebt);
    var moveCost = Math.max(4700, Math.round(Math.max(1, netWorth(s)) * 0.00002));
    return card("World + Residence", "tax home", [
      '<div class="more-v1848-inline">',
      metric("Current residence", residenceText(s), "This drives the tax profile.", "blue"),
      metric("Projected tax", moneyText(projected), "Shown from the current model.", projected > 0 ? "bad" : "green"),
      metric("Move estimate", moneyText(moveCost), "Relocation is handled from Legal/More.", "gold"),
      "</div>",
      '<div class="more-v1848-note">Residence controls should stay readable instead of becoming a long rail. Open Legal for deeper tax and residency work.</div>',
      '<div class="more-v1848-actions">',
      btn("Open Legal", "open", "law", "blue", false),
      btn("Open Finance", "open", "finance", "gold", false),
      "</div>"
    ].join(""), "world", "world");
  }

  function systemCard(s) {
    var stressFree = !!(s.sandbox && (s.sandbox.stressFreeLife || s.sandbox.noStress));
    var repair = readStorageJson("ledger_v1847_pre_succession_slot_" + activeSlotNumber()) ? "Carry backup found" : "No carry backup";
    return card("System Tools", "save health, sandbox, cleanup", [
      '<div class="more-v1848-inline">',
      metric("Stress-free", stressFree ? "On" : "Off", stressFree ? "Stress gains should be blocked." : "Normal stress rules are active.", stressFree ? "green" : "gold"),
      metric("Repair carry", repair, "Uses the pre-succession backup if one exists.", repair.indexOf("found") >= 0 ? "green" : "gold"),
      metric("Slot health", "Guarded", "Manual backup and repair controls stay here.", "blue"),
      "</div>",
      '<div class="more-v1848-actions">',
      btn(stressFree ? "Turn Stress-Free Off" : "Turn Stress-Free On", "toggleStress", "", stressFree ? "gold" : "green", false),
      btn("Repair current slot", "repairSlot", "", "blue", false),
      btn("Backup now", "backup", "", "violet", false),
      "</div>"
    ].join(""), "systems", "systems");
  }

  function slotName(slot, idx) {
    if (!slot) return "Slot " + idx;
    return slot.name || (slot.firstName ? slot.firstName + " " + (slot.lastName || "") : "") || "Slot " + idx;
  }

  function stackCard(s) {
    var active = activeSlotNumber();
    var rows = [];
    for (var i = 1; i <= totalSlots(); i += 1) {
      var slot = i === active ? s : readSlot(i);
      if (!slot || !slot.name) {
        rows.push('<div class="more-v1848-slot-row empty"><div><b>Slot ' + i + '</b><span>Empty - start a new life here.</span></div>' + btn("New", "newSlot", String(i), "green", false) + '</div>');
        continue;
      }
      var current = i === active;
      var alive = slot.alive !== false;
      rows.push('<div class="more-v1848-slot-row ' + (current ? "active" : "") + '"><div><b>Slot ' + i + " - " + esc(slotName(slot, i)) + '</b><span>' + (alive ? "Age " + esc(slot.age || 0) : "Deceased at " + esc(slot.age || 0)) + ' - Net ' + esc(moneyText(netWorth(slot))) + (slot.sandboxMode ? " - Sandbox" : "") + '</span><em>' + esc(lastStory(slot)).slice(0, 110) + '</em></div>' + btn(current ? "Current" : "Switch", "switchSlot", String(i), current ? "disabled" : "blue", current) + '</div>');
    }
    return card("Life Stack", "past lives + saves", [
      '<div class="more-v1848-scroll-list slots">' + rows.join("") + "</div>",
      '<div class="more-v1848-actions">',
      btn("Return to Life Stack", "stack", "", "violet", false),
      btn("Open Life", "open", "life", "gold", false),
      "</div>"
    ].join(""), "stack", "stack");
  }

  function directoryGroup(title, tag, routes) {
    return '<div class="more-v1848-dir-group"><div class="more-v1848-dir-head"><b>' + esc(title) + '</b><span>' + esc(tag || "") + '</span></div>' +
      '<div class="more-v1848-route-grid compact">' + routes.join("") + "</div></div>";
  }

  function directoryCard(s) {
    var core = [
      routeButton("Life", "open", "life", "Chapter, goals, recovery, successor controls.", "gold", "main"),
      routeButton("People", "open", "people", "Family, dating, partner, children, social rhythm.", "violet", "main"),
      routeButton("Education", "open", "school", "School, IQ, scholarships, sports, degrees.", "gold", "age"),
      routeButton("Job", "open", "career", "Search jobs, contracts, industry experience.", "blue", "work"),
      routeButton("Finance", "open", "finance", "Net worth, assets, debts, income, charts.", "green", "ledger"),
      routeButton("Money", "open", "money", "Checking, savings, budget, credit, insurance.", "gold", "bank"),
      routeButton("Investments", "open", "brokerage", "Stocks, brokerage, personal firm, funds.", "blue", "market"),
      routeButton("Legal", "open", "law", "Taxes, attorneys, trusts, debt payoff.", "violet", "law")
    ];
    var lifeSystems = [
      routeButton("Health", "open", "health", "Doctor, wellness, recovery, health activities.", "green", "body"),
      routeButton("Real Estate", "open", "home", "Living situation and your property portfolio.", "gold", "place"),
      routeButton("Vehicles", "open", "vehicles", "Your garage: buy, finance, service, and sell cars.", "blue", "place"),
      routeButton("All Stats", "open", "stats", "Detailed stats, IQ, traits, long-form signals.", "blue", "stats"),
      routeButton("Recovery", "open", "life", "De-stress tools currently live inside Life.", "green", "stress"),
      routeButton("Insurance", "open", "money", "Health insurance stays with Money controls.", "blue", "cover"),
      routeButton("Residence", "scroll", "world", "Tax home summary and relocation shortcut.", "gold", "tax")
    ];
    var businessLegacy = [
      routeButton("Business", "open", "business", "Side companies, family companies, ownership.", "gold", "biz"),
      routeButton("Entrepreneurship", "open", "entrepreneurship", "Founder path, venture/fund systems.", "green", "founder"),
      routeButton("Family Trust", "open", "law", "Create trust, title assets, protect succession.", "violet", "trust"),
      routeButton("Family Business", "open", "business", "Company value, succession, owner controls.", "green", "enterprise"),
      routeButton("Successor Tools", "open", "life", "Wayback, heirs, continue legacy controls.", "gold", "heirs"),
      routeButton("Repair Carry", "repairCarry", "", "Try to restore missed trust/successor transfer.", "red", "fix")
    ];
    var tools = [
      routeButton("Wayback", "scroll", "time", "Checkpoints, restore latest, manual backup.", "violet", "time"),
      routeButton("Life Stack", "stack", "", "Leave to the save picker and all life slots.", "blue", "slots"),
      routeButton("Sandbox", "sandbox", "", "Open the sandbox builder when available.", "green", "lab"),
      routeButton("System Tools", "scroll", "systems", "Stress-free switch, repair current slot, backup.", "violet", "tools"),
      routeButton("World", "scroll", "world", "Country, state, and tax-home quick summary.", "blue", "move"),
      routeButton("More", "open", "more", "Return to this full command directory.", "gold", "here")
    ];
    return card("All Places", "developer · tap header 5× to hide", [
      '<div class="more-v1848-directory">',
      directoryGroup("Core play", "main bottom tabs", core),
      directoryGroup("Life systems", "old pages restored", lifeSystems),
      directoryGroup("Business + legacy", "trust, company, heirs", businessLegacy),
      directoryGroup("Tools + world", "saves, sandbox, relocation", tools),
      "</div>"
    ].join(""), "routes wide", "routes");
  }

  // Curated quick-access for regular players: the handful of gameplay places
  // that aren't already on the bottom tab bar. The exhaustive jump-to-everything
  // grid stays developer-only (directoryCard, gated below).
  function quickAccessCard(s) {
    var routes = [
      routeButton("Business", "open", "business", "Your companies, sectors, and owner controls.", "gold", "biz"),
      routeButton("Entrepreneurship", "open", "entrepreneurship", "Found a startup, raise funding, scale to a billion-dollar exit.", "green", "founder"),
      routeButton("Investments", "open", "brokerage", "Stocks, funds, and your brokerage.", "blue", "market"),
      routeButton("Shopping", "open", "shopping", "The mall: luxury toys and the art market.", "gold", "shop"),
      routeButton("Legal", "open", "law", "Taxes, accountants, attorneys, lawsuits.", "violet", "law"),
      routeButton("Family Trust", "open", "trust", "Trusts, child trusts, family fund, succession.", "gold", "trust"),
      routeButton("Health", "open", "health", "Doctor, wellness, and recovery.", "green", "body"),
      routeButton("Real Estate", "open", "home", "Living situation and your property portfolio.", "gold", "place"),
      routeButton("Vehicles", "open", "vehicles", "Your garage of cars.", "blue", "place")
    ];
    return card("Quick access", "jump to your places", [
      '<div class="more-v1848-route-grid">',
      routes.join(""),
      "</div>"
    ].join(""), "routes wide", "quick");
  }

  // ---- Developer mode: the full "All Places" jump-directory is a power-user
  // tool, not something regular players need. It stays hidden until you tap the
  // More header 5 times (within ~1.5s between taps), which toggles it on/off.
  var DEV_KEY = "ledger_dev_directory_v1853";
  function devOn() {
    try { return localStorage.getItem(DEV_KEY) === "1"; } catch (e) { return false; }
  }
  function setDev(on) {
    try { localStorage.setItem(DEV_KEY, on ? "1" : "0"); } catch (e) {}
  }
  var _devTaps = 0, _devTapAt = 0;
  window.moreDevTapV1853 = function () {
    var now = Date.now ? Date.now() : new Date().getTime();
    if (now - _devTapAt > 1500) _devTaps = 0;   // reset the streak if you pause
    _devTapAt = now;
    _devTaps++;
    if (_devTaps >= 5) {
      _devTaps = 0;
      var on = !devOn();
      setDev(on);
      toast(on ? "Developer mode ON — full directory unlocked." : "Developer mode off.");
      saveRender();
    }
  };

  function renderMoreCommand() {
    var s = getState();
    var f = finance(s);
    var protectedCapital = protectedFamilyCapital(s);
    var saves = checkpointList(s).length;
    var stressFree = !!(s.sandbox && (s.sandbox.stressFreeLife || s.sandbox.noStress));
    var top = [
      '<section class="more-v1848-hero" onclick="moreDevTapV1853()">',
      '<div><span>More</span><h2>More</h2><p>Saves &amp; checkpoints, your past lives, residency, and settings for this life.</p></div>',
      '<strong>' + esc("Slot " + activeSlotNumber()) + '<small>active life</small></strong>',
      "</section>",
      '<section class="more-v1848-strip">',
      metric("Net worth", moneyText(netWorth(s)), "Full ledger lives in Finance.", "gold"),
      metric("Protected", moneyText(protectedCapital), "Trust and family business protection.", protectedCapital > 0 ? "green" : "bad"),
      metric("Wayback", saves + " saves", "Manual checkpoints for risky choices.", "violet"),
      metric("Residence", residenceText(s), "Tax home for this life.", "blue"),
      metric("Sandbox", stressFree ? "Stress-free" : (s.sandboxMode ? "Sandbox" : "Normal"), "Mode switches stay in system tools.", stressFree ? "green" : "gold"),
      "</section>",
      '<section class="more-v1848-dock">',
      btn("Save checkpoint", "saveCheckpoint", "", "green", false),
      btn("Repair carry", "repairCarry", "", "red", false),
      btn("Open Legal", "open", "law", "blue", false),
      btn("Open Finance", "open", "finance", "gold", false),
      btn("Life Stack", "stack", "", "violet", false),
      "</section>"
    ].join("");

    return '<div class="more-v1848-shell">' + top +
      '<div class="more-v1848-grid">' +
      quickAccessCard(s) +
      legacyCard(s) +
      timeCard(s) +
      stackCard(s) +
      worldCard(s) +
      systemCard(s) +
      (devOn() ? directoryCard(s) : "") +
      '</div>' +
      '</div>';
  }

  window.renderMoreCommandV1848 = renderMoreCommand;
  window.renderMoreCommandV1845 = renderMoreCommand;
  window.renderMore = function () { return renderMoreCommand(); };

  // Central crash-guard. This is the outermost renderHubContent (more-command
  // loads last), so wrapping it here contains a render error in ANY hub —
  // business, investments/brokerage, money, legal, etc. Before this, one bad
  // panel (e.g. right after a fund distribution) threw all the way up and froze
  // the whole screen. Now the failing hub shows a recoverable notice instead,
  // and the error is logged so the root cause can be pinpointed.
  function hubErrorCardV1853(hubId, err) {
    try { if (window.console && console.error) console.error("[renderHubContent] hub '" + hubId + "' failed:", err); } catch (e) {}
    return '<div style="margin:14px;padding:16px 18px;border:1px solid rgba(255,159,140,.4);border-radius:12px;' +
      'background:rgba(40,20,16,.6);color:#f6ead8;font-family:\'JetBrains Mono\',monospace;font-size:12px;line-height:1.6">' +
      '<div style="font-size:14px;color:#ffb09f;margin-bottom:6px">⚠️ This screen hit a snag</div>' +
      'Something in this panel errored, so it was skipped to keep the game responsive. ' +
      'Your save is safe — switch tabs or advance a year and it should clear.' +
      '</div>';
  }
  if (previousRenderHubContent && !previousRenderHubContent.__v1848MoreCommand) {
    window.renderHubContent = function (hubId) {
      try {
        if (String(hubId || "") === "more") return renderMoreCommand();
        return previousRenderHubContent.apply(this, arguments);
      } catch (err) {
        return hubErrorCardV1853(hubId, err);
      }
    };
    window.renderHubContent.__v1848MoreCommand = true;
    try { renderHubContent = window.renderHubContent; } catch (e) {}
  }

  // Universal render crash-guard. more-command loads last, so this wraps the
  // entire render() chain (life view, age-up, every tab). A render that throws
  // used to propagate into the click/age-up handler and freeze the whole game —
  // including "life up". Now the exception is caught and logged (with a stack)
  // so the UI stays interactive and the real culprit can be identified, instead
  // of the screen locking. The previous DOM stays put on failure.
  (function installRenderCrashGuardV1853() {
    try {
      var prev = window.render || (typeof render === "function" ? render : null);
      if (typeof prev === "function" && !prev.__crashGuardV1853) {
        var guarded = function () {
          try {
            return prev.apply(this, arguments);
          } catch (err) {
            try {
              if (window.console && console.error) console.error("[render] crashed and was caught — UI kept alive:", err);
              var msg = (err && err.message) ? String(err.message).slice(0, 80) : "unknown";
              if (typeof window.addToast === "function") window.addToast("Render error (kept alive): " + msg);
            } catch (e2) {}
          }
        };
        guarded.__crashGuardV1853 = true;
        window.render = guarded;
        try { render = guarded; } catch (e3) {}
      }
    } catch (e) {}
  })();

  function installStyle() {
    if (typeof document === "undefined" || !document.head || !document.createElement) return;
    try {
      var old = document.getElementById("ledger-more-command-v1845-style");
      if (old && old.parentNode) old.parentNode.removeChild(old);
    } catch (e) {}
    if (document.getElementById("ledger-more-command-v1848-style")) return;
    var css = document.createElement("style");
    css.id = "ledger-more-command-v1848-style";
    css.textContent = [
      ".more-v1848-shell,.more-v1848-shell *{box-sizing:border-box}.more-v1848-shell{display:grid;gap:12px;width:100%;padding:0 14px 92px;color:#f6ead8}",
      ".more-v1848-hero{position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:end;min-width:0;border:1px solid rgba(126,160,172,.38);border-radius:14px;background:linear-gradient(135deg,rgba(16,36,38,.94),rgba(30,24,18,.96));padding:16px 18px;overflow:hidden}.more-v1848-hero:before{content:\"\";position:absolute;inset:0;background:linear-gradient(110deg,rgba(216,173,109,.08),transparent 42%,rgba(126,160,172,.09));pointer-events:none}.more-v1848-hero>*{position:relative}.more-v1848-hero span,.more-v1848-card-head span,.more-v1848-feature span,.more-v1848-metric span{display:block;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.18em;color:#d8ad6d;font-size:9px;font-weight:800}.more-v1848-hero h2{margin:4px 0 5px;color:#fff3df;font-size:34px;line-height:.95;letter-spacing:0}.more-v1848-hero p{max-width:780px;margin:0;color:#d8d0bd;font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.45}.more-v1848-hero strong{display:grid;place-items:center;min-width:112px;min-height:76px;border:1px solid rgba(216,173,109,.32);border-radius:13px;background:rgba(0,0,0,.25);color:#f2c978;font-size:25px;line-height:1}.more-v1848-hero small{display:block;margin-top:4px;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:8px;text-transform:uppercase;letter-spacing:.14em}",
      ".more-v1848-strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr));gap:9px}.more-v1848-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:12px;align-items:stretch;width:100%}.more-v1848-card{display:block;min-width:0;border:1px solid rgba(216,173,109,.22);border-radius:14px;background:linear-gradient(135deg,rgba(35,29,22,.92),rgba(16,14,11,.96));padding:14px;overflow:hidden}.more-v1848-card.wide{grid-column:1/-1}.more-v1848-card.legacy{display:block;border-color:rgba(185,220,138,.32);background:linear-gradient(135deg,rgba(16,38,21,.92),rgba(20,17,13,.96))}.more-v1848-card.time{border-color:rgba(170,145,255,.3);background:linear-gradient(135deg,rgba(28,25,43,.9),rgba(18,16,13,.96))}.more-v1848-card.world,.more-v1848-card.routes{border-color:rgba(126,160,172,.34);background:linear-gradient(135deg,rgba(16,35,38,.9),rgba(18,16,13,.96))}.more-v1848-card.systems{border-color:rgba(170,145,255,.3);background:linear-gradient(135deg,rgba(34,25,45,.88),rgba(18,16,13,.96))}.more-v1848-card-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;border-bottom:1px solid rgba(255,255,255,.09);padding-bottom:9px;margin-bottom:11px}.more-v1848-card-head h3{margin:3px 0 0;color:#fff3df;font-size:22px;line-height:1.05;letter-spacing:0}",
      ".more-v1848-inline{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,156px),1fr));gap:9px;min-width:0}.more-v1848-metric{min-width:0;border:1px solid rgba(255,255,255,.1);border-radius:11px;background:rgba(255,255,255,.045);padding:11px}.more-v1848-metric b{display:block;margin:5px 0 3px;color:#fff3df;font-size:20px;line-height:1.05;letter-spacing:0;overflow-wrap:anywhere}.more-v1848-metric em{display:block;color:#cdbf9f;font-family:'JetBrains Mono',monospace;font-size:9px;line-height:1.35;font-style:normal}.more-v1848-metric.gold b{color:#f2c978}.more-v1848-metric.green b{color:#b9dc8a}.more-v1848-metric.blue b{color:#9fc8d3}.more-v1848-metric.violet b{color:#cbb9ff}.more-v1848-metric.bad b{color:#ff9f8c}",
      ".more-v1848-dock,.more-v1848-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.more-v1848-dock{padding:1px 0 3px}.more-v1848-actions{margin-top:12px}.more-v1848-btn{appearance:none;border:1px solid rgba(216,173,109,.28);border-radius:999px;background:rgba(34,27,18,.82);color:#f8e9c9;font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;min-height:34px;padding:8px 13px;cursor:pointer;white-space:normal;text-align:center}.more-v1848-btn:hover:not(:disabled){border-color:rgba(242,201,120,.68);transform:translateY(-1px);background:rgba(58,42,22,.88)}.more-v1848-btn:disabled,.more-v1848-btn.disabled{opacity:.45;cursor:not-allowed}.more-v1848-btn.green{border-color:rgba(185,220,138,.38);color:#c7f09b}.more-v1848-btn.blue{border-color:rgba(126,160,172,.46);color:#b7ddeb}.more-v1848-btn.gold{border-color:rgba(216,173,109,.52);color:#f2c978}.more-v1848-btn.red{border-color:rgba(255,159,140,.42);color:#ffb09f}.more-v1848-btn.violet{border-color:rgba(175,145,255,.38);color:#d2c2ff}",
      ".more-v1848-feature{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:start;margin-bottom:11px}.more-v1848-feature h4{margin:4px 0;color:#fff3df;font-size:25px;line-height:1}.more-v1848-feature p{max-width:780px;margin:0;color:#d8d0bd;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.45}.more-v1848-feature strong{display:grid;place-items:center;min-width:86px;min-height:72px;border:1px solid rgba(185,220,138,.28);border-radius:12px;background:rgba(185,220,138,.08);color:#b9dc8a;font-size:31px;line-height:1}.more-v1848-feature small{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:8px;text-transform:uppercase;letter-spacing:.14em}.more-v1848-note{margin-top:10px;border:1px dashed rgba(255,255,255,.12);border-radius:11px;background:rgba(0,0,0,.18);padding:10px;color:#cdbf9f;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.45}",
      ".more-v1848-scroll-list{display:grid;gap:8px;max-height:250px;overflow:auto;padding-right:4px;scrollbar-color:rgba(216,173,109,.55) rgba(0,0,0,.22)}.more-v1848-scroll-list.slots{max-height:300px}.more-v1848-save-row,.more-v1848-slot-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;border:1px solid rgba(255,255,255,.1);border-radius:11px;background:rgba(255,255,255,.04);padding:10px;min-width:0}.more-v1848-slot-row.active{border-color:rgba(216,173,109,.46);background:rgba(216,173,109,.08)}.more-v1848-slot-row.empty{border-style:dashed}.more-v1848-save-row b,.more-v1848-slot-row b{display:block;color:#fff3df;font-size:16px;line-height:1.08;overflow-wrap:anywhere}.more-v1848-save-row span,.more-v1848-slot-row span,.more-v1848-slot-row em{display:block;color:#cdbf9f;font-family:'JetBrains Mono',monospace;font-size:9px;line-height:1.35;font-style:normal;margin-top:3px}.more-v1848-save-row strong{color:#d8ad6d;font-family:'JetBrains Mono',monospace;font-size:8px;text-transform:uppercase;letter-spacing:.12em}.more-v1848-empty{border:1px dashed rgba(255,255,255,.12);border-radius:11px;color:#cdbf9f;background:rgba(0,0,0,.18);font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.4;padding:12px}",
      ".more-v1848-directory{display:grid;gap:12px}.more-v1848-dir-group{min-width:0;border:1px solid rgba(255,255,255,.1);border-radius:12px;background:rgba(0,0,0,.16);padding:11px}.more-v1848-dir-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:9px}.more-v1848-dir-head b{color:#fff3df;font-size:16px;line-height:1.05}.more-v1848-dir-head span{color:#d8ad6d;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.16em;font-size:8px;text-align:right}.more-v1848-route-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));gap:9px}.more-v1848-route-grid.compact{grid-template-columns:repeat(auto-fit,minmax(min(100%,145px),1fr))}.more-v1848-route{appearance:none;display:grid;gap:4px;text-align:left;border:1px solid rgba(255,255,255,.1);border-radius:11px;background:rgba(255,255,255,.045);color:#f6ead8;padding:12px;min-height:86px;cursor:pointer}.more-v1848-route:hover{border-color:rgba(216,173,109,.46);background:rgba(58,42,22,.55)}.more-v1848-route b{color:#fff3df;font-size:17px;line-height:1.05}.more-v1848-route span{color:#d8ad6d;font-family:'JetBrains Mono',monospace;font-size:8px;line-height:1;text-transform:uppercase;letter-spacing:.14em}.more-v1848-route em{display:block;color:#cdbf9f;font-family:'JetBrains Mono',monospace;font-size:9px;line-height:1.35;font-style:normal}.more-v1848-route.green{border-color:rgba(185,220,138,.22)}.more-v1848-route.blue{border-color:rgba(126,160,172,.26)}.more-v1848-route.gold{border-color:rgba(216,173,109,.28)}.more-v1848-route.violet{border-color:rgba(175,145,255,.22)}.more-v1848-route.red{border-color:rgba(255,159,140,.24)}",
      "@media (max-width:720px){.more-v1848-shell{padding:0 10px 96px}.more-v1848-hero{grid-template-columns:1fr;padding:14px}.more-v1848-hero h2{font-size:30px}.more-v1848-hero strong{place-items:start;align-items:start;min-height:auto;min-width:0;padding:12px}.more-v1848-card.wide{grid-column:auto}.more-v1848-feature{grid-template-columns:1fr}.more-v1848-feature strong{place-items:start;min-height:auto;width:100%;padding:10px}.more-v1848-save-row,.more-v1848-slot-row{grid-template-columns:1fr}.more-v1848-btn{width:auto;min-width:110px}}"
    ].join("\n");
    document.head.appendChild(css);
  }

  installStyle();
  if (typeof registerLedgerSystem === "function") {
    registerLedgerSystem({
      id: "more-command",
      targetFile: "pages/systems/more-command.js",
      currentAnchors: ["renderMore", "renderHubContent", "renderMoreCommandV1848", "openMoreHubV1848", "moreActionV1848"],
      status: "active",
      version: VERSION,
      rule: "More is a purpose-built utility command room. It renders directly from state, avoids old extracted feature rails, and keeps Wayback, life stack, trust carry, repair, residency, sandbox, and full navigation readable."
    });
  }
})();
