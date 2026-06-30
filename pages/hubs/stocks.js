/* Investments / brokerage hub bridge. */
(function () {
  if (!window.registerLedgerHub) return;
  window.registerLedgerHub({
    id: "brokerage",
    label: "Investments",
    group: "investing",
    aliases: ["stocks", "investments", "investing", "brokerage", "market"],
    sourceFunctions: ["renderInvestmentsHubV20", "ensureStockEngineV2", "tickLiveStockMarket", "buyStockAmount", "sellStockAmount"],
    owns: ["investments", "brokerage cash", "real stocks", "market cycle", "watchlist", "outside managers", "personal firm", "venture fund"],
    render: function () {
      if (typeof window.renderHubContent === "function") return window.renderHubContent("brokerage");
      if (typeof window.renderBrokerageHubV11 === "function") return window.renderBrokerageHubV11();
      return "";
    }
  });
})();
