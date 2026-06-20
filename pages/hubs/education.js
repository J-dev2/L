/* Education hub bridge. */
(function () {
  if (!window.registerLedgerHub) return;
  window.registerLedgerHub({
    id: "school",
    label: "Education",
    group: "life-path",
    aliases: ["education", "college", "school"],
    sourceFunctions: ["renderSchool", "renderSchoolPage", "setSchoolPage", "enrollCollege"],
    owns: ["school", "college", "degrees", "scholarships", "clubs", "GPA"],
    render: function () {
      if (typeof window.renderHubContent === "function") return window.renderHubContent("school");
      if (typeof window.renderSchool === "function") return window.renderSchool();
      return "";
    }
  });
})();
