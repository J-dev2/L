/* More / overflow hub bridge. */
(function () {
  if (!window.registerLedgerHub) return;
  window.registerLedgerHub({
    id: "more",
    label: "More",
    group: "navigation",
    aliases: ["menu", "overflow"],
    sourceFunctions: ["renderMore", "exitToLifeMenuV186"],
    owns: ["full hub list", "switch life", "relocation", "wayback shortcuts", "settings"],
    render: function () {
      if (typeof window.renderHubContent === "function") return window.renderHubContent("more");
      if (typeof window.renderMore === "function") return window.renderMore();
      return "";
    }
  });
})();
