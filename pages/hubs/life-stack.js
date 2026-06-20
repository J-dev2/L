/* Life Stack / current life hub bridge. */
(function () {
  if (!window.registerLedgerHub) return;
  window.registerLedgerHub({
    id: "lifehub",
    label: "Life",
    group: "core",
    aliases: ["life", "stack", "life-stack"],
    sourceFunctions: ["renderLifeHub", "renderIntro", "enterFromSplash", "pickSlot"],
    owns: ["life log", "life stack", "wayback entry points", "current character overview"],
    render: function () {
      if (typeof window.renderHubContent === "function") return window.renderHubContent("lifehub");
      if (typeof window.renderLifeHub === "function") return window.renderLifeHub();
      return "";
    }
  });
})();
