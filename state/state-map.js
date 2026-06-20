/* Ledger state map.
   This documents the current global state shape before deeper refactoring. */
(function () {
  window.LedgerStateMap = {
    version: "v18.35",
    storageKeys: {
      slotPrefix: "ledger-life-slot-",
      activeSlot: "ledger-active-slot",
      startupPartial: "ledger_v18337_startup_partial_state",
      lastGood: "ledger_v1832_last_good_state",
      v1826BackupPrefix: "ledger-v1826-backup-slot-"
    },
    roots: {
      identity: ["name", "age", "gender", "city", "background", "alive", "sandboxMode"],
      stats: ["stats", "traits", "fame", "followers"],
      people: ["relationships", "married", "pregnant"],
      education: ["education", "school", "clubs", "educationV1825", "educationV1827"],
      career: ["job", "careerHistory", "applicationsV1827"],
      money: ["money", "savings", "debt", "ira", "retirement401k", "finance"],
      life: ["log", "legacy", "life", "inventory"],
      recovery: ["saveHealthV1826", "timeSnapshotsV1814"]
    },
    financeChildren: {
      banking: ["superSaver", "creditScore", "creditCardDebt", "assetBackedLoan"],
      investing: ["brokerage", "stocksV18", "managedPortfolio", "externalManager", "managerFirmsV1829"],
      business: ["businesses", "personalFirm", "businessCash", "firmCashV1828", "businessTaxV1830"],
      legalTax: ["taxDebt", "taxCountry", "taxRegion", "taxLegalRisk", "taxCanonicalV1832", "taxCleanupV1832"],
      protection: ["insurance", "medicalDebt", "legalCasesV1826"],
      history: ["financialHistory", "netWorthHistory", "incomeSources", "debts"]
    }
  };
})();
