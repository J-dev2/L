(function () {
  var out = { pass: {}, fail: [], notes: [] };
  function ok(name, condition, detail) {
    out.pass[name] = !!condition;
    if (!condition) out.fail.push(name + (detail ? ": " + detail : ""));
  }
  function num(v) { return Number(v) || 0; }
  function reset() {
    if (window.newGame) window.newGame({ sandboxMode: true });
    if (typeof ensureStateShape === "function") ensureStateShape();
    state.age = 40;
    state.money = 12000000;
    state.finance = state.finance || {};
    state.finance.creditScore = 765;
    state.rentals = [];
    state.finance.reV1862 = { portfolio: [], nextId: 1, version: 1862, migrated: true };
    state.finance.reV1863 = { version: 1863, nextId: 1, migrated: { legacyRentals: true, reV1862: true }, market: { year: null, trend: "stable", trendYears: 0, listings: [], urgencyListings: [] }, portfolio: [], lastYear: {} };
    window.reEnsureV1863();
  }

  try {
    reset();

    ok("globals_v1863", typeof window.reBuyV1863 === "function" && typeof window.reYearlyTickV1863 === "function" && typeof window.renderRealEstateV1863 === "function");
    ok("globals_v1862_alias", typeof window.reBuyV1862 === "function" && typeof window.reYearlyTickV1862 === "function" && typeof window.renderRealEstateV1862 === "function");

    var market = window.reMarketV1863();
    var urgent = window.reUrgencyMarketV1863();
    ok("market_renders", market.length === 20 && !!market[0].lid, "market length " + market.length);
    ok("market_rarity_mix", market.filter(function (l) { return l.rarity === "rare"; }).length >= 3 && market.filter(function (l) { return l.rarity === "epic"; }).length >= 1, "rarities=" + JSON.stringify(market.map(function (l) { return l.rarity; })));
    ok("urgency_renders", urgent.length >= 1 && !!urgent[0].urgencyType, "urgent length " + urgent.length);

    var html = window.renderRealEstateV1863();
    ok("ui_credit_summary_market", /Credit desk/.test(html) && /Deal board/.test(html) && /Urgency deals/.test(html), html.slice(0, 180));
    ok("deal_board_badges_visible", /Deal board/.test(html) && /Rare deal/.test(html) && /Epic deal/.test(html), html.slice(0, 260));
    window.reOpenListingV1863(urgent[0].lid);
    html = window.renderRealEstateV1863();
    ok("listing_detail_cash_mortgage", /re1863-overlay/.test(html) && /Listing detail|Off-market|Foreclosure/.test(html) && /Buy cash/.test(html) && /Buy mortgage/.test(html), html.slice(0, 240));

    var mortgageListing = urgent.concat(market).find(function (l) { return !l.cashOnly && l.monthlyRent > 0 && l.listPrice < 2000000; }) || market.find(function (l) { return !l.cashOnly; });
    var cash0 = state.money;
    window.reBuyV1863(mortgageListing.lid, "mortgage");
    var re = state.finance.reV1863;
    var p = re.portfolio[0];
    ok("buy_mortgage_adds_property", !!p && p.tplId === mortgageListing.tplId, p && p.tplId);
    ok("mortgage_created", p && p.mortgageLeft > 0 && p.mortgageRate > 0, JSON.stringify(p && { debt: p.mortgageLeft, rate: p.mortgageRate }));
    ok("only_down_payment_spent", (cash0 - state.money) > 0 && (cash0 - state.money) < p.buyPrice, "spent=" + (cash0 - state.money) + " price=" + p.buyPrice);
    ok("strategy_prompt", !!re.pendingStrategyUid && /Purchase strategy/.test(window.renderRealEstateV1863()));

    window.reSetStrategyV1863(p.uid, "rent");
    ok("strategy_rent_sets_tenant_path", p.strategy === "rent" && p.rentedOut === true);
    window.reAdjustRentV1863(p.uid, 0.05);
    ok("rent_adjusts", p.askingRent > p.monthlyRent);

    var condition0 = p.condition;
    var mortgage0 = p.mortgageLeft;
    p.tenant = { name: "Maya Chen", reliability: 96, happiness: 80, leaseYearsLeft: 2 };
    var money0 = state.money;
    window.reYearlyTickV1863();
    ok("yearly_condition_decays", p.condition < condition0, condition0 + " -> " + p.condition);
    ok("yearly_mortgage_amortizes", p.mortgageLeft < mortgage0, mortgage0 + " -> " + p.mortgageLeft);
    ok("yearly_records_cashflow", typeof p.lastYear.cashFlow === "number" && typeof state.finance.lastRealEstateCashFlowV1863 === "number");
    ok("tenant_income_recorded", num(p.lastYear.rent) > 0 && num(state.finance.lastRealEstateTenantIncomeV1863) > 0, JSON.stringify(p.lastYear));
    out.notes.push("yearly money delta=" + (state.money - money0) + " last=" + JSON.stringify(p.lastYear));

    var value0 = p.currentValue;
    var cond1 = p.condition;
    state.money = 20000000;
    window.reRenovateV1863(p.uid, "cosmetic");
    ok("renovation_improves", p.condition > cond1 && p.currentValue > value0, cond1 + " -> " + p.condition + ", " + value0 + " -> " + p.currentValue);

    var debt0 = p.mortgageLeft;
    window.rePayMortgageV1863(p.uid, 50000);
    ok("paydown_reduces_debt", p.mortgageLeft < debt0, debt0 + " -> " + p.mortgageLeft);
    var oldRate = p.mortgageRate;
    state.finance.creditScore = 825;
    p.mortgageRate = oldRate + 0.02;
    window.reRefinanceV1863(p.uid);
    ok("refinance_reduces_rate", p.mortgageRate < oldRate + 0.02, "rate=" + p.mortgageRate);

    window.reListSaleV1863(p.uid, 0);
    ok("list_sale_sets_state", p.forSale && p.askingPrice > 0);
    ok("sale_quote_global", typeof window.reSaleQuoteV1868 === "function" && window.reSaleQuoteV1868(p.uid).fair > 0);
    var qBase = window.reSaleQuoteV1868(p.uid);
    window.reSetSaleAskV1868(p.uid, Math.round(qBase.fair * 1.25));
    var qHigh = window.reSaleQuoteV1868(p.uid);
    ok("overpricing_reduces_sale_odds", qHigh.chance < qBase.chance && p.askingPrice > qBase.fair, "base=" + qBase.chance + " high=" + qHigh.chance + " ask=" + p.askingPrice + " fair=" + qBase.fair);
    window.reOpenSaleV1868(p.uid);
    ok("sale_manager_popup_renders", /Sale manager/.test(window.renderRealEstateV1863()) && /Buyer odds/.test(window.renderRealEstateV1863()));
    var count0 = re.portfolio.length;
    var saleCash0 = state.money;
    window.reSellV1863(p.uid);
    ok("sell_removes_property", re.portfolio.length === count0 - 1);
    ok("sell_adds_cash", state.money > saleCash0);

    var cashListing = window.reMarketV1863().find(function (l) { return l.listPrice < state.money; });
    window.reBuyV1863(cashListing.lid, "cash");
    var cashProp = state.finance.reV1863.portfolio[state.finance.reV1863.portfolio.length - 1];
    ok("buy_cash_no_mortgage", cashProp && cashProp.mortgageLeft === 0);

    var stats = window.rePortfolioStatsV1863();
    ok("stats_value_debt_equity", stats.value >= cashProp.currentValue && stats.equity === stats.value - stats.debt, JSON.stringify(stats));
    ok("networth_includes_equity_once", window.reEquityV1863() === stats.equity && legacyNetWorth() >= stats.equity);

    var totals = typeof window.financeLedgerTotalsV1836 === "function" ? window.financeLedgerTotalsV1836() : null;
    ok("finance_rows_property_value", !!totals && totals.assets.some(function (r) { return r.id === "property" && r.value >= stats.value; }));
    ok("finance_rows_property_debt", !!totals && totals.debts.some(function (r) { return r.id === "propertyMortgage" && r.value === stats.debt; }));
    ok("finance_cashflow_reads_v1863", /Real estate cash flow/.test(document.body.innerHTML) || num(state.finance.lastRealEstateCashFlowV1863) === num(state.finance.lastRealEstateCashFlowV1862));

    state.finance.reV1863 = null;
    state.finance.reV1862 = { portfolio: [{ uid: "old_p", tplId: "duplex", name: "Old Duplex", type: "multi", hood: "Oldtown", basePrice: 300000, value: 340000, mortgage: { balance: 180000, rate: 0.055, termYears: 25 }, baseRent: 2800, maint: 6000, condition: 76, strategy: "rent", rentedOut: true }], nextId: 3, version: 1862, migrated: true };
    state.rentals = ["rent_studio"];
    window.reEnsureV1863();
    ok("migration_imports_legacy_rentals", state.rentals.length === 0 && state.finance.reV1863.portfolio.some(function (x) { return /Studio/i.test(x.name); }));
    ok("migration_imports_reV1862", state.finance.reV1863.portfolio.some(function (x) { return x.name === "Old Duplex" && x.mortgageLeft === 180000; }));

    reset();
    var legacyCash0 = state.money;
    window.buyRental("rent_studio");
    var legacyRental = state.finance.reV1863.portfolio.find(function (x) { return x.legacyRentalId === "rent_studio" || x.tplId === "legacy_rent_studio"; });
    ok("legacy_buy_rental_uses_real_estate", state.rentals.length === 0 && !!legacyRental && legacyRental.strategy === "rent" && state.money === legacyCash0 - 95000, JSON.stringify({ rentals: state.rentals, prop: legacyRental && legacyRental.name, money: state.money }));
    var legacyHomeHtml = window.renderHome();
    ok("legacy_home_hides_rental_catalog", legacyHomeHtml.indexOf("Available rentals") < 0 && legacyHomeHtml.indexOf("Owned rentals") < 0 && legacyHomeHtml.indexOf("buyRental('") < 0);

    html = window.renderRealEstateV1863();
    ok("portfolio_card_renders", /Portfolio cards/.test(html) && /Condition/.test(html) && /Mortgage/.test(html), html.slice(0, 260));
    ok("living_split_renders", typeof window.renderLivingSituationV1863 === "function" && /Living Situation/.test(window.renderLivingSituationV1863()));

    // ---- Property class / prestige tiers (v18.64) ----
    reset(); // clean portfolio, money 12,000,000, credit 765, age 40 (net worth ~12M)
    var mktT = window.reMarketV1863();
    ok("listings_have_class", mktT.length > 0 && mktT.every(function (l) { return l.cls && l.className && l.reqNetWorth != null && num(l.classPrestige) > 0; }), "first=" + JSON.stringify(mktT[0] && { cls: mktT[0].cls, req: mktT[0].reqNetWorth, prestige: mktT[0].classPrestige }));

    // At ~12M net worth: luxury (req 3M) is buyable, prestige (req 20M) is gated.
    var c0 = state.finance.reV1863.portfolio.length;
    window.reBuyV1863("office_floor", "mortgage"); // luxury, reqNetWorth 3M, credit 750
    ok("luxury_allowed_at_12m_nw", state.finance.reV1863.portfolio.length === c0 + 1, "count " + c0 + " -> " + state.finance.reV1863.portfolio.length);

    var c1 = state.finance.reV1863.portfolio.length;
    var money1 = state.money;
    window.reBuyV1863("mansion_let", "mortgage"); // prestige, reqNetWorth 20M > ~12M net worth
    ok("prestige_blocked_below_networth_gate", state.finance.reV1863.portfolio.length === c1 && state.money === money1, "net worth gate should block; count=" + state.finance.reV1863.portfolio.length);

    state.money = 60000000; // net worth now clears the 20M prestige gate
    window.reBuyV1863("mansion_let", "cash"); // cash avoids the 800 credit requirement; gate still applies
    ok("prestige_allowed_when_rich", state.finance.reV1863.portfolio.length === c1 + 1, "count=" + state.finance.reV1863.portfolio.length);
    var boughtP = state.finance.reV1863.portfolio[state.finance.reV1863.portfolio.length - 1];
    ok("bought_property_has_class", !!boughtP && boughtP.cls === "prestige", boughtP && boughtP.cls);
    var statsT = window.rePortfolioStatsV1863();
    ok("prestige_accumulates", typeof window.rePrestigeV1863 === "function" && window.rePrestigeV1863() >= 175 && num(statsT.prestige) >= 175, "prestige=" + statsT.prestige);

    var htmlT = window.renderRealEstateV1863();
    ok("summary_shows_prestige_rank", /Estate prestige/.test(htmlT) && /(No Holdings|First Rung|Landlord|Landed Owner|Real-Estate Magnate|Property Dynasty)/.test(htmlT), htmlT.slice(0, 120));
    ok("ladder_shows_class_tiers", /Economy/.test(htmlT) && /Luxury/.test(htmlT) && /Prestige/.test(htmlT));
    ok("portfolio_card_shows_prestige", /prestige/i.test(htmlT));

    // Migrated/legacy property without a stored class still receives a derived one.
    state.finance.reV1863 = null;
    state.finance.reV1862 = { portfolio: [{ uid: "old_q", tplId: "duplex", name: "Old Duplex 2", type: "multi", value: 340000, baseRent: 2800, maint: 6000, condition: 76, strategy: "rent", rentedOut: true }], nextId: 5, version: 1862, migrated: true };
    state.rentals = [];
    window.reEnsureV1863();
    ok("migrated_property_gets_class", state.finance.reV1863.portfolio.length > 0 && state.finance.reV1863.portfolio.every(function (x) { return !!x.cls; }), JSON.stringify(state.finance.reV1863.portfolio.map(function (x) { return x.cls; })));

    // ---- Flip + tenant screening (v18.65) ----
    reset();
    ok("globals_screening_v1865", typeof window.reScreenApplicantV1865 === "function" && typeof window.reAcceptApplicantV1865 === "function" && typeof window.reRejectApplicantV1865 === "function");

    var rentListing = window.reMarketV1863().find(function (l) { return l.monthlyRent > 0 && l.type !== "land" && l.listPrice < state.money; });
    window.reBuyV1863(rentListing.lid, "cash");
    var rp = state.finance.reV1863.portfolio[state.finance.reV1863.portfolio.length - 1];
    window.reSetStrategyV1863(rp.uid, "rent");
    ok("rent_generates_applicants_not_auto_tenant", !rp.tenant && rp.applicantsV1865 && rp.applicantsV1865.list.length >= 1, "applicants=" + (rp.applicantsV1865 && rp.applicantsV1865.list.length) + " tenant=" + !!rp.tenant);

    window.reOpenApplicantsV1865(rp.uid);
    ok("applicants_open_as_scrollable_popup", state.finance.reV1863.applicantsUid === rp.uid && /Applicants for/.test(window.renderRealEstateV1863()), "uid=" + state.finance.reV1863.applicantsUid);

    var ap0 = rp.applicantsV1865.list[0];
    var screenMoney0 = state.money;
    window.reScreenApplicantV1865(rp.uid, ap0.id, "credit");
    ok("screen_reveals_credit_and_charges_fee", ap0.revealed.credit === true && state.money < screenMoney0, "spent=" + (screenMoney0 - state.money));
    window.reScreenApplicantV1865(rp.uid, ap0.id, "background");
    ok("screen_reveals_background", ap0.revealed.background === true);
    window.reAcceptApplicantV1865(rp.uid, ap0.id);
    ok("accept_places_tenant_clears_applicants", !!rp.tenant && rp.tenant.name === ap0.name && rp.applicantsV1865 === null);
    ok("accepted_tenant_carries_record", typeof rp.tenant.criminalV1865 === "string");

    // ---- Tenant relationships (v18.66) ----
    ok("globals_tenant_rel_v1866", typeof window.reTenantActV1866 === "function" && typeof window.reTenantRomanceV1866 === "function" && typeof window.reOpenTenantV1866 === "function");
    window.reTenantActV1866(rp.uid, "talk");
    ok("tenant_talk_builds_relationship", rp.tenant.relV1866 > 18, "rel=" + rp.tenant.relV1866);
    var chem0 = rp.tenant.chemV1866 || 0;
    window.reTenantActV1866(rp.uid, "flirt");
    ok("tenant_flirt_builds_chemistry", rp.tenant.chemV1866 > chem0, "chem=" + rp.tenant.chemV1866);
    window.reTenantActV1866(rp.uid, "night");
    ok("intimacy_gated_until_romantic", !(rp.tenant.actsV1866 && rp.tenant.actsV1866.night), "should be blocked pre-romance");
    rp.tenant.relV1866 = 80; rp.tenant.chemV1866 = 80;
    var tries = 0; while (!rp.tenant.romanticV1866 && tries++ < 15) window.reTenantRomanceV1866(rp.uid);
    ok("tenant_can_become_romantic", rp.tenant.romanticV1866 === true, "after " + tries + " tries");
    window.reTenantActV1866(rp.uid, "night");
    ok("romantic_unlocks_intimacy_act", !!(rp.tenant.actsV1866 && rp.tenant.actsV1866.night >= 1), "acts=" + JSON.stringify(rp.tenant.actsV1866));
    window.reOpenTenantV1866(rp.uid);
    var trHtml = window.renderRealEstateV1863();
    ok("tenant_overlay_renders", state.finance.reV1863.tenantUid === rp.uid && /Relationship/.test(trHtml) && /Chemistry/.test(trHtml));

    // ---- Tenant personalities + flavor + story moments (v18.67) ----
    ok("tenant_has_persona", typeof rp.tenant.personaV1867 === "string" && rp.tenant.personaV1867.length > 0, "persona=" + rp.tenant.personaV1867);
    ok("overlay_shows_persona", /font-style:italic/.test(trHtml) && /The /.test(trHtml));
    var flav = window.reTenantLineV1867(rp.uid, "talk");
    ok("flavor_line_resolves_name", typeof flav === "string" && flav.length > 0 && flav.indexOf("{name}") === -1 && flav.indexOf(rp.tenant.name) >= 0, "line=" + flav);
    rp.tenant.relV1866 = 60;
    var relB = rp.tenant.relV1866, chemB = rp.tenant.chemV1866, moneyB = state.money, condB = rp.condition;
    window.reRollTenantStoryV1867(rp.uid);
    ok("story_event_applies_effect", rp.tenant.relV1866 !== relB || rp.tenant.chemV1866 !== chemB || state.money !== moneyB || rp.condition !== condB, "rel " + relB + "->" + rp.tenant.relV1866 + " moneyD=" + (state.money - moneyB));
    ok("tenant_has_persona_icon", typeof window.reTenantLineV1867 === "function" && typeof rp.tenant.personaV1867 === "string");
    var badge = typeof window.reTenantBadgeV1868 === "function" ? window.reTenantBadgeV1868(rp.uid) : "";
    ok("tenant_gender_badge_renders", /Male|Female/.test(badge) && (/👨|👩/.test(badge)) && badge.split("·").length >= 2, "badge=" + badge);
    ok("evict_removes_tenant", (typeof window.reEvictTenantV1866 === "function") && (window.reEvictTenantV1866(rp.uid), !rp.tenant), "tenant should be gone after evict");

    // High-relationship tenant renews instead of leaving when the lease ends.
    window.reCloseOverlayV1863();
    var renewed = false;
    for (var rz = 0; rz < 12 && !renewed; rz++) {
      rp.tenant = { name: "Loyal Tenant", reliability: 80, happiness: 80, leaseYearsLeft: 0, relV1866: 95, chemV1866: 0 };
      rp.condition = 80; rp.strategy = "rent";
      window.reYearlyTickV1863();
      if (rp.tenant && rp.tenant.name === "Loyal Tenant" && rp.tenant.leaseYearsLeft > 0) renewed = true;
    }
    ok("high_relationship_renews_lease", renewed, "tenant should renew at rel 95");

    // A bad tenant can damage condition + value (probabilistic; reset each forced year so it stays leased).
    var dmgSeen = false;
    for (var y = 0; y < 15 && !dmgSeen; y++) {
      rp.condition = 80; rp.currentValue = 500000; rp.strategy = "rent";
      rp.tenant = { name: "Risky Renter", reliability: 30, happiness: 50, leaseYearsLeft: 3, criminalV1865: "serious" };
      window.reYearlyTickV1863();
      if (rp._tenantDamageV1865) dmgSeen = true;
    }
    ok("bad_tenant_can_damage_property", dmgSeen, "no damage in 15 forced years (should be ~certain)");

    // Flip button actually changes state + renders a flip project.
    reset();
    var flipL = window.reMarketV1863().find(function (l) { return l.listPrice < state.money; });
    window.reBuyV1863(flipL.lid, "cash");
    var fp = state.finance.reV1863.portfolio[state.finance.reV1863.portfolio.length - 1];
    window.reSetStrategyV1863(fp.uid, "flip");
    ok("flip_button_sets_state", fp.strategy === "flip" && fp.flipFromV1865 > 0 && fp.tenant === null, "strategy=" + fp.strategy + " flipFrom=" + fp.flipFromV1865);
    var flipHtml = window.renderRealEstateV1863();
    ok("flip_panel_and_active_state_render", /Flip project/.test(flipHtml) && /Flipping/.test(flipHtml), flipHtml.slice(0, 80));
    ok("flip_panel_shows_sale_math", /Bought for/.test(flipHtml) && /Market sale/.test(flipHtml) && /Buyer odds/.test(flipHtml), flipHtml.slice(0, 180));

    // ---- Live-in residence lifestyle (v18.66) ----
    reset();
    ok("globals_residence_v1866", typeof window.rePrimaryResidenceV1866 === "function" && typeof window.reResidenceLifestyleV1866 === "function");
    var liveL = window.reMarketV1863().find(function (l) { return l.listPrice < state.money; });
    window.reBuyV1863(liveL.lid, "cash");
    var lp = state.finance.reV1863.portfolio[state.finance.reV1863.portfolio.length - 1];
    state.finance.residenceBonusV1866 = null;
    window.reSetStrategyV1863(lp.uid, "live");
    ok("move_in_sets_primary_residence", state.finance.reV1863.primaryUid === lp.uid && window.rePrimaryResidenceV1866() === lp);
    ok("residence_lifestyle_positive", window.reResidenceLifestyleV1866().happy > 0, JSON.stringify(window.reResidenceLifestyleV1866()));
    ok("move_in_grants_tracked_bonus", !!state.finance.residenceBonusV1866 && state.finance.residenceBonusV1866.happy > 0, "bonus=" + JSON.stringify(state.finance.residenceBonusV1866));
    window.reSetStrategyV1863(lp.uid, "flip");
    ok("move_out_resets_bonus", state.finance.reV1863.primaryUid == null && state.finance.residenceBonusV1866 && state.finance.residenceBonusV1866.happy === 0, "bonus=" + JSON.stringify(state.finance.residenceBonusV1866));

    out.summary = {
      total: Object.keys(out.pass).length,
      passed: Object.keys(out.pass).filter(function (k) { return out.pass[k]; }).length,
      failed: out.fail.length
    };
  } catch (e) {
    out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0, 8).join(" || ") : "");
  }
  return out;
})();
