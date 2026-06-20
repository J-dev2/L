(function () {
  var out = { pass: {}, fail: [], notes: [] };
  function ok(name, cond, detail) {
    out.pass[name] = !!cond;
    if (!cond) out.fail.push(name + (detail ? (": " + detail) : ""));
  }
  function num(x) { return Number.isFinite(Number(x)) ? Number(x) : 0; }
  function cash() { return num(state.money) + num(focus.retainedEarnings); }
  var focus = null;

  try {
    if (typeof window.newGame === "function") window.newGame({});
    if (typeof ensureStateShape === "function") ensureStateShape();
    state.age = 42;
    state.money = 5000000;
    state.stats = state.stats || {};
    state.stats.discipline = 85;
    state.stats.popularity = 85;
    state.finance = state.finance || {};
    state.finance.businesses = [];
    state.actionsTaken = {};

    focus = {
      id: "nightclub",
      baseId: "nightclub",
      name: "Blue Hour Group",
      category: "Nightlife & Events",
      value: 1200000,
      retainedEarnings: 2200000,
      reputation: 88,
      stage: "breakout",
      years: 8,
      assets: { location: 3, equipment: 2, staff: 2 },
      ops: { manager: true, sales: true, bookkeeper: true }
    };
    state.finance.businesses.push(focus);
    state.finance.businessOfficeV1840 = { focusId: focus.id };

    ok("globals_loaded", typeof window.businessLocationsV1857 === "function" && typeof window.openBusinessLocationV1857 === "function" && typeof window.applyBusinessLocationsYearV1857 === "function");

    var oldSave = { id: "fastcasual", baseId: "fastcasual", name: "Old Save Bowls", category: "Food & Drink", value: 300000, reputation: 75, stage: "growing", locations: 3, assets: { location: 3, staff: 1, equipment: 1 }, retainedEarnings: 400000 };
    var oldLoc = window.businessLocationsV1857(oldSave);
    ok("old_save_migrates_sites", oldLoc && oldLoc.sites && oldLoc.sites.length === 3, "sites=" + (oldLoc && oldLoc.sites && oldLoc.sites.length));
    ok("old_save_market_created", !!oldSave.marketV1857 && num(oldSave.marketV1857.share) > 0);

    var locked = { id: "coffeehouse", baseId: "coffeehouse", name: "Locked Cafe", category: "Food & Drink", value: 200000, reputation: 80, stage: "growing", retainedEarnings: 500000, assets: { location: 2, staff: 1, equipment: 1 } };
    state.finance.businesses.push(locked);
    var beforeLocked = window.businessLocationsV1857(locked).sites.length;
    window.openBusinessLocationV1857(locked.id, "owned");
    ok("locked_cannot_open_without_flagship", window.businessLocationsV1857(locked).sites.length === beforeLocked);

    var html0 = window.renderBusinessHubV1840 ? window.renderBusinessHubV1840() : "";
    ok("nightlife_archetypes_render", html0.indexOf("Nightlife circuit") >= 0 && html0.indexOf("Bar") >= 0, html0.slice(0, 80));
    ok("market_share_renders", html0.indexOf("market share") >= 0 && html0.indexOf("Blue Hour Group") >= 0);

    var loc0 = window.businessLocationsV1857(focus);
    var cashBeforeOpen = cash();
    window.openBusinessLocationV1857(focus.id, "owned");
    var loc1 = window.businessLocationsV1857(focus);
    ok("open_owned_adds_site", loc1.sites.filter(function (s) { return s.status !== "closed"; }).length === loc0.sites.length + 1);
    ok("open_owned_deducts_cash_once", cash() < cashBeforeOpen, "before=" + cashBeforeOpen + " after=" + cash());
    ok("opened_sector_site_named", loc1.sites.some(function (s) { return /Lounge|Club room|Live venue|Event hall|Bar/.test(s.archetype); }));

    var newSite = loc1.sites[loc1.sites.length - 1];
    var tierBefore = num(newSite.tier);
    window.upgradeBusinessLocationV1857(focus.id, newSite.id);
    ok("upgrade_site_increases_tier", num(newSite.tier) === tierBefore + 1);
    var demandBefore = num(newSite.demand);
    window.supportBusinessLocationV1857(focus.id, newSite.id, "demand");
    ok("support_site_increases_demand", num(newSite.demand) > demandBefore);

    var shareBefore = num(focus.marketV1857.share);
    window.competeBusinessMarketShareV1857(focus.id);
    ok("compete_sets_year_gate", num(focus.marketV1857.lastCompeteAge) === num(state.age));
    ok("compete_changes_share", num(focus.marketV1857.share) !== shareBefore || num(focus.marketV1857.rivalStrength) !== 55);
    var cashAfterCompete = cash();
    window.competeBusinessMarketShareV1857(focus.id);
    ok("compete_once_per_year", cash() === cashAfterCompete);

    window.openBusinessLocationV1857(focus.id, "franchise");
    ok("franchise_adds_partner", window.businessLocationsV1857(focus).sites.some(function (s) { return s.model === "franchise" && s.status !== "closed"; }));

    focus.retainedEarnings = 10000000;
    focus.value = 6000000;
    focus.reputation = 95;
    var sitesBeforeAcquire = window.businessLocationsV1857(focus).sites.length;
    var shareBeforeAcquire = num(focus.marketV1857.share);
    window.acquireBusinessRivalV1857(focus.id);
    ok("acquire_rival_adds_site", window.businessLocationsV1857(focus).sites.length === sitesBeforeAcquire + 1);
    ok("acquire_rival_increases_share", num(focus.marketV1857.share) > shareBeforeAcquire);

    var branch = window.businessLocationsV1857(focus).sites.find(function (s) { return s.id !== "hq" && s.status !== "closed"; });
    window.closeBusinessLocationV1857(focus.id, branch.id);
    ok("close_site_marks_closed", branch.status === "closed");

    state.actionsTaken = {};
    state.age += 1;
    var ageBefore = state.age;
    window.resolveLifeAndFinanceYear();
    ok("year_tick_runs", state.age === ageBefore);
    ok("year_tick_stores_location_effects", !!focus.lastLocationEffectsV1857 && typeof focus.lastLocationEffectsV1857.income === "number");
    ok("risk_breakdown_has_location", !!window.businessRiskBreakdownV1856(focus).location);

    var html1 = window.renderBusinessHubV1840 ? window.renderBusinessHubV1840() : "";
    ok("ui_has_location_controls", html1.indexOf("Network + market share") >= 0 && html1.indexOf("Acquire") >= 0 && html1.indexOf("Open Owned") >= 0);

    out.summary = { total: Object.keys(out.pass).length, passed: Object.keys(out.pass).filter(function (k) { return out.pass[k]; }).length, failed: out.fail.length };
  } catch (e) {
    out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0, 6).join(" || ") : "");
  }
  return out;
})();
