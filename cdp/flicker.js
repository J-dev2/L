(async function () {
  var out = { pass: {}, fail: [], notes: [], samples: [] };
  function ok(name, cond, detail) { out.pass[name] = !!cond; if (!cond) out.fail.push(name + (detail ? ": " + detail : "")); }
  function wait(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function counterProbe() {
    var counts = window.__ledgerFlickerProbe || { render: 0, hubContent: 0, inPlace: 0, mutations: 0 };
    window.__ledgerFlickerProbe = counts;
    if (!counts._wrappedRender) {
      var prevRender = window.render || (typeof render === "function" ? render : null);
      if (typeof prevRender === "function") {
        var wrappedRender = function () { counts.render += 1; return prevRender.apply(this, arguments); };
        wrappedRender.__flickerProbe = true;
        window.render = wrappedRender;
        try { render = wrappedRender; } catch (e) {}
      }
      var prevHubContent = window.renderHubContent || (typeof renderHubContent === "function" ? renderHubContent : null);
      if (typeof prevHubContent === "function") {
        var wrappedHubContent = function () { counts.hubContent += 1; return prevHubContent.apply(this, arguments); };
        wrappedHubContent.__flickerProbe = true;
        window.renderHubContent = wrappedHubContent;
        try { renderHubContent = wrappedHubContent; } catch (e2) {}
      }
      var prevInPlace = window.renderHubInPlaceV16 || (typeof renderHubInPlaceV16 === "function" ? renderHubInPlaceV16 : null);
      if (typeof prevInPlace === "function") {
        var wrappedInPlace = function () { counts.inPlace += 1; return prevInPlace.apply(this, arguments); };
        wrappedInPlace.__flickerProbe = true;
        window.renderHubInPlaceV16 = wrappedInPlace;
        try { renderHubInPlaceV16 = wrappedInPlace; } catch (e3) {}
      }
      try {
        counts._observer = new MutationObserver(function (list) { counts.mutations += list.length; });
        counts._observer.observe(document.getElementById("app") || document.body, { childList: true, subtree: true });
      } catch (e4) {}
      counts._wrappedRender = true;
    }
    return counts;
  }
  function resetCounts() {
    var c = counterProbe();
    c.render = 0;
    c.hubContent = 0;
    c.inPlace = 0;
    c.mutations = 0;
    return c;
  }
  function currentHub() {
    var overlay = document.querySelector(".hub-overlay");
    return overlay && overlay.dataset ? overlay.dataset.hubId : "";
  }
  function guardActive() {
    return !!(document.documentElement && document.documentElement.classList && document.documentElement.classList.contains("ledger-render-steady-v1843"));
  }
  async function sampleHub(id) {
    var c = resetCounts();
    try {
      if (typeof window.setTabV16 === "function") window.setTabV16(id);
      else if (typeof window.setTab === "function") window.setTab(id);
    } catch (e) { out.notes.push("setTab " + id + " threw " + e); }
    await wait(250);
    c.render = 0;
    c.hubContent = 0;
    c.inPlace = 0;
    c.mutations = 0;
    await wait(1200);
    var sample = { hub: id, currentHub: currentHub(), render: c.render, hubContent: c.hubContent, inPlace: c.inPlace, mutations: c.mutations };
    out.samples.push(sample);
    ok("idle_" + id + "_does_not_rerender", c.render === 0 && c.inPlace === 0, JSON.stringify(sample));
    ok("idle_" + id + "_low_mutation", c.mutations <= 3, JSON.stringify(sample));
  }
  async function sampleMoneyAction() {
    try {
      if (typeof window.setTabV16 === "function") window.setTabV16("money");
      else if (typeof window.setTab === "function") window.setTab("money");
    } catch (e) { out.notes.push("setTab money action threw " + e); }
    await wait(250);
    var c = resetCounts();
    try {
      if (typeof window.v17HubAction === "function") window.v17HubAction(function () { state.money += 1; });
      else if (typeof window.v16HubAction === "function") window.v16HubAction(function () { state.money += 1; });
      else state.money += 1;
    } catch (e2) { out.notes.push("money action threw " + e2); }
    var activeSoon = guardActive();
    var legacySoon = !!window.__ledgerV13LockTimer;
    var actionSample = { hub: currentHub(), activeSoon: activeSoon, legacySoon: legacySoon, render: c.render, hubContent: c.hubContent, inPlace: c.inPlace, mutations: c.mutations };
    out.samples.push(Object.assign({ action: "money" }, actionSample));
    ok("money_action_uses_flicker_guard", activeSoon, JSON.stringify(actionSample));
    ok("money_action_clears_legacy_lock", !legacySoon, JSON.stringify(actionSample));
    await wait(300);
    ok("money_action_guard_clears", !guardActive(), JSON.stringify({ activeLate: guardActive() }));
    c.render = 0;
    c.hubContent = 0;
    c.inPlace = 0;
    c.mutations = 0;
    await wait(900);
    var idleSample = { hub: currentHub(), render: c.render, hubContent: c.hubContent, inPlace: c.inPlace, mutations: c.mutations };
    out.samples.push(Object.assign({ action: "money_idle_after" }, idleSample));
    ok("money_action_idle_after_guard", c.render === 0 && c.inPlace === 0 && c.mutations <= 3, JSON.stringify(idleSample));
  }
  async function sampleLayoutAction() {
    try {
      if (typeof window.setTabV16 === "function") window.setTabV16("money");
      else if (typeof window.setTab === "function") window.setTab("money");
    } catch (e) { out.notes.push("setTab money layout threw " + e); }
    await wait(250);
    var c = resetCounts();
    var beforeWidth = document.body ? document.body.getAttribute("data-ledger-width") : "";
    var nextWidth = beforeWidth === "compact" ? "wide" : "compact";
    try {
      if (typeof window.setHubWidthV16 === "function") window.setHubWidthV16(nextWidth);
    } catch (e2) { out.notes.push("setHubWidth threw " + e2); }
    var activeSoon = guardActive();
    var legacySoon = !!window.__ledgerV13LockTimer;
    var sample = { hub: currentHub(), beforeWidth: beforeWidth, nextWidth: nextWidth, activeSoon: activeSoon, legacySoon: legacySoon, render: c.render, hubContent: c.hubContent, inPlace: c.inPlace, mutations: c.mutations };
    out.samples.push(Object.assign({ action: "layout" }, sample));
    ok("layout_action_uses_flicker_guard", activeSoon, JSON.stringify(sample));
    ok("layout_action_clears_legacy_lock", !legacySoon, JSON.stringify(sample));
    await wait(300);
    ok("layout_action_guard_clears", !guardActive(), JSON.stringify({ activeLate: guardActive() }));
    c.render = 0;
    c.hubContent = 0;
    c.inPlace = 0;
    c.mutations = 0;
    await wait(900);
    var idleSample = { hub: currentHub(), render: c.render, hubContent: c.hubContent, inPlace: c.inPlace, mutations: c.mutations };
    out.samples.push(Object.assign({ action: "layout_idle_after" }, idleSample));
    ok("layout_action_idle_after_guard", c.render === 0 && c.inPlace === 0 && c.mutations <= 3, JSON.stringify(idleSample));
  }

  try {
    if (typeof window.newGame === "function") window.newGame({ sandboxMode: true });
    if (typeof window.ensureStateShape === "function") window.ensureStateShape();
    state.age = 35;
    state.alive = true;
    state.money = 5000000;
    state.finance = state.finance || {};
    if (typeof window.ensureLegalState === "function") window.ensureLegalState();
    counterProbe();
    await sampleHub("lifehub");
    await sampleHub("money");
    await sampleMoneyAction();
    await sampleLayoutAction();
    await sampleHub("trust");
    await sampleHub("business");
    await sampleHub("entrepreneurship");
    out.summary = { total: Object.keys(out.pass).length, passed: Object.keys(out.pass).filter(function (k) { return out.pass[k]; }).length, failed: out.fail.length };
  } catch (e) {
    out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0, 8).join(" || ") : "");
  }
  return out;
})();
