/* Business hub bridge. */
(function () {
  if (!window.registerLedgerHub) return;
  window.registerLedgerHub({
    id: "business",
    label: "Business",
    group: "business",
    aliases: ["company", "firm", "sidebusiness"],
    sourceFunctions: ["renderBusinessHubV1840", "renderEntrepreneurshipHubV1841", "setBusinessFocusV1840", "setBusinessTrustPercentV1840", "payBusinessDividendToTrustV1840"],
    owns: ["business ownership", "entities", "retained earnings", "family enterprise", "business trust"],
    render: function () {
      if (typeof window.renderHubContent === "function") return window.renderHubContent("business");
      return "";
    }
  });
  window.registerLedgerHub({
    id: "entrepreneurship",
    label: "Entrepreneurship",
    group: "business",
    aliases: ["founder", "startup", "entrepreneur"],
    sourceFunctions: ["renderEntrepreneurshipHubV1841", "setEntrepreneurshipPathV1841", "renderBusinessHubV1840"],
    owns: ["founder path", "entrepreneur identity", "full-time founder mode", "business opportunity requirements"],
    render: function () {
      if (typeof window.renderHubContent === "function") return window.renderHubContent("entrepreneurship");
      return "";
    }
  });
})();
