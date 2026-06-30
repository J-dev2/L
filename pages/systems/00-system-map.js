/* Ledger systems map.
   This gives each gameplay system a named file target for the next refactor. */
(function () {
  var systems = [];

  function register(system) {
    if (!system || !system.id) return null;
    var idx = systems.findIndex(function (item) { return item.id === system.id; });
    if (idx >= 0) {
      systems[idx] = Object.assign({}, systems[idx], system);
      return systems[idx];
    }
    systems.push(system);
    return system;
  }

  register({
    id: "save-recovery",
    targetFile: "pages/systems/save-recovery.js",
    currentAnchors: ["save", "loadFromSlot", "pickSlot", "recoverLedgerSlotV18334", "enterFromSplash"],
    storageKeys: ["ledger-life-slot-*", "ledger-active-slot", "ledger_v18337_startup_partial_state"],
    rule: "Splash Enter opens Life Stack; saves load only by explicit slot/recovery choice."
  });
  register({
    id: "finance-ledger",
    targetFile: "pages/systems/finance-ledger.js",
    currentAnchors: ["renderFinanceHub1818", "recordCashFlow1824", "financeParts1818"],
    rule: "Net worth, assets, debts, expenses, income, and charts belong in Finance."
  });
  register({
    id: "money-banking",
    targetFile: "pages/systems/money-banking.js",
    currentAnchors: ["renderMoney", "renderBankingSection", "depositSavings", "withdrawSavings"],
    rule: "Checking, savings, super saver, budget, credit, and banking controls belong in Money."
  });
  register({
    id: "tax-legal",
    targetFile: "pages/systems/tax-legal.js",
    currentAnchors: ["renderLegalHubV1839", "payTaxDebtV1839", "hireAccountantV1839", "hireAttorneyV1839", "createFamilyTrustV1839", "fundFamilyTrustV1839", "continueAsHeirV1846", "repairLegacyCarryV1847"],
    rule: "Legal owns accountants, attorneys, tax debt payoff, audit risk, family trusts, child trusts, family fund governance, protected-asset succession, and repair of missed trust/business carries when continuing as an heir."
  });
  register({
    id: "stocks-engine",
    targetFile: "pages/systems/stocks-engine.js",
    currentAnchors: ["ensureStockEngineV2", "renderInvestmentsHubV20", "tickLiveStockMarket", "buyStockAmount", "sellStockAmount", "getPortfolioSummary"],
    rule: "Investments owns live stocks, brokerage cash, real-stock holdings, watchlist/news/earnings, personal firm placement, and market cycle."
  });
  register({
    id: "business-entities",
    targetFile: "pages/systems/business-entities.js",
    currentAnchors: ["renderBusinessHubV1840", "renderEntrepreneurshipHubV1841", "setEntrepreneurshipPathV1841", "setBusinessFocusV1840", "renameBusinessV1840", "setBusinessTrustPercentV1840", "payBusinessDividendToTrustV1840"],
    rule: "Business owns the focused side-company desk, entity cash, owner distributions, acquisitions, launch rails, family enterprise governance, trust ownership, dividends, trust loans, and succession. Entrepreneurship owns the lifelong founder path and opportunity direction."
  });
  register({
    id: "education-career",
    targetFile: "pages/systems/education-career.js",
    currentAnchors: ["renderSchool", "careerInterviewDesk1827", "applyToJobV1828", "answerInterviewV1828"],
    rule: "Education owns degrees/scholarships; Career owns applications, interviews, and requirements."
  });
  register({
    id: "people-family",
    targetFile: "pages/systems/people-family.js",
    currentAnchors: ["renderPeopleV1842", "relationActionV1842", "familyActionV1842", "findDateV1842", "dateActionV1842", "childActivityV1842", "setOrientationV1842"],
    rule: "People owns relationships, gender/pronouns, orientation, dating prospects, partner detail, children, childcare style, repeatable social activities, parent finances, and family planning."
  });
  register({
    id: "sandbox-startup",
    targetFile: "pages/systems/sandbox-startup.js",
    currentAnchors: ["renderSandbox", "startSandboxV1812", "goSandbox", "startGame"],
    rule: "Sandbox owns custom starting stats, money, stress-free mode, and startup builder behavior."
  });
  register({
    id: "scroll-stability",
    targetFile: "pages/systems/scroll-stability.js",
    currentAnchors: ["renderHubInPlaceV16", "render", "preserveHubScrollV1843"],
    rule: "Scroll stability owns hub scroll memory across same-hub button clicks and rerenders."
  });
  register({
    id: "life-command",
    targetFile: "pages/systems/life-command.js",
    currentAnchors: ["render", "renderHubContent", "openLifeCommandHubV1844", "runLifeCommandActionV1844", "runLifeUtilityV1844"],
    rule: "Life Command owns the playable Life home summary, quick next moves, chapter timeline, and the top of the Life hub."
  });
  register({
    id: "more-command",
    targetFile: "pages/systems/more-command.js",
    currentAnchors: ["renderMore", "renderHubContent", "renderMoreCommandV1848", "openMoreHubV1848", "moreActionV1848"],
    rule: "More Command owns the overflow utility room as a direct state-rendered command room: Wayback, slots, trust carry, repair, relocation summary, sandbox switches, and full hub navigation without old extracted feature rails."
  });

  window.LedgerSystems = {
    version: "v18.35",
    list: systems,
    register: register,
    get: function (id) {
      return systems.find(function (system) { return system.id === id; }) || null;
    }
  };
  window.registerLedgerSystem = register;
})();
