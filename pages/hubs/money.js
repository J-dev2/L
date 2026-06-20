/* Money / banking hub bridge. */
(function () {
  if (!window.registerLedgerHub) return;
  window.registerLedgerHub({
    id: "money",
    label: "Money",
    group: "money",
    aliases: ["bank", "banking", "cash"],
    sourceFunctions: ["renderMoney", "renderBankingSection", "renderCashFlowV6"],
    owns: ["checking", "savings", "super saver", "cash flow", "budget", "insurance", "accountant shortcut"],
    render: function () {
      if (typeof window.renderHubContent === "function") return window.renderHubContent("money");
      if (typeof window.renderMoney === "function") return window.renderMoney();
      return "";
    }
  });
})();
