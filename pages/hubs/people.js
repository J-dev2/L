/* People hub bridge. */
(function () {
  if (!window.registerLedgerHub) return;
  window.registerLedgerHub({
    id: "people",
    label: "People",
    group: "social",
    aliases: ["relationships", "family", "dating"],
    sourceFunctions: ["renderPeopleV1842", "renderPeople", "relationActionV1842", "familyActionV1842", "findDateV1842", "childActivityV1842", "setOrientationV1842"],
    owns: ["relationships", "partner", "children", "gender", "pronouns", "orientation", "social actions", "dating", "family planning"],
    render: function () {
      if (typeof window.renderHubContent === "function") return window.renderHubContent("people");
      if (typeof window.renderPeople === "function") return window.renderPeople();
      return "";
    }
  });
})();
