/* Investments / brokerage hub bridge. */
(function () {
  if (!window.registerLedgerHub) return;
  window.registerLedgerHub({
    id: "brokerage",
    label: "Investments",
    group: "investing",
    aliases: ["stocks", "investments", "investing", "brokerage", "market"],
    sourceFunctions: ["renderBrokerageHubV11", "buyStock", "sellStock", "investBrokerage"],
    owns: ["brokerage", "real stocks", "market cycle", "outside managers", "personal firm", "venture fund"],
    render: function () {
      if (typeof window.renderHubContent === "function") return window.renderHubContent("brokerage");
      if (typeof window.renderBrokerageHubV11 === "function") return window.renderBrokerageHubV11();
      return "";
    }
  });
})();
