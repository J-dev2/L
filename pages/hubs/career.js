/* Career / job hub bridge. */
(function () {
  if (!window.registerLedgerHub) return;
  window.registerLedgerHub({
    id: "career",
    label: "Job",
    group: "life-path",
    aliases: ["job", "career", "work"],
    sourceFunctions: ["renderCareer", "takeCareer", "askPromotion", "workHarder"],
    owns: ["jobs", "career requirements", "interviews", "promotions"],
    render: function () {
      if (typeof window.renderHubContent === "function") return window.renderHubContent("career");
      if (typeof window.renderCareer === "function") return window.renderCareer();
      return "";
    }
  });
})();
