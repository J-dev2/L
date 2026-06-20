/* Finance / net worth hub bridge. */
(function () {
  if (!window.registerLedgerHub) return;
  window.registerLedgerHub({
    id: "finance",
    label: "Finance",
    group: "money",
    aliases: ["networth", "network", "ledger"],
    sourceFunctions: ["renderFinanceHub1818", "financeParts1818", "cashFlow1818"],
    owns: ["net worth", "assets", "debts", "income sources", "expenses", "charts"],
    render: function () {
      if (typeof window.renderHubContent === "function") return window.renderHubContent("finance");
      return "";
    }
  });
})();
