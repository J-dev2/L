/* Legal / law office hub bridge. */
(function () {
  if (!window.registerLedgerHub) return;
  window.registerLedgerHub({
    id: "law",
    label: "Legal",
    group: "legal",
    aliases: ["legal", "law", "lawoffice", "taxlaw"],
    sourceFunctions: ["renderLegalHubV1839", "payTaxDebtV1839", "hireAccountantV1839", "hireAttorneyV1839", "createFamilyTrustV1839"],
    owns: ["tax debt", "audit risk", "attorneys", "accountants", "estate planning", "trusts"],
    render: function () {
      if (typeof window.renderHubContent === "function") return window.renderHubContent("law");
      return "";
    }
  });
})();
