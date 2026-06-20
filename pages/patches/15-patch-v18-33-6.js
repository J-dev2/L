/* LEDGER PATCH v18.33.6: readable seven-slot primary nav */
(function () {
  if (window.__ledgerPatch18336ReadablePrimaryNav) return;
  window.__ledgerPatch18336ReadablePrimaryNav = true;

  function esc18336(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (ch) {
      return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[ch];
    });
  }
  function state18336() {
    try { if (typeof state !== "undefined") return state; } catch (e) {}
    return window.state || null;
  }
  function n18336(v) {
    v = Number(v);
    return isFinite(v) ? v : 0;
  }
  function norm18336(id) {
    id = String(id || "").toLowerCase();
    if (id === "life") return "lifehub";
    if (id === "stocks") return "brokerage";
    if (id === "legal" || id === "lawoffice" || id === "law-office" || id === "taxlaw") return "law";
    if (id === "education") return "school";
    if (id === "networth" || id === "network") return "finance";
    return id || "lifehub";
  }
  function schoolRelevant18336(s) {
    s = s || {};
    var flags = s.flags || {};
    var education = s.education || {};
    var edu25 = s.educationV1825 || {};
    var edu27 = s.educationV1827 || {};
    var age = n18336(s.age);
    return age < 22 || !!flags.inCollege || !!flags.inSchool || !!s.inCollege || !!s.inSchool ||
      !!education.inCollege || !!education.inSchool || !!education.enrolled ||
      !!edu25.active || !!edu25.activeDegree || !!edu27.active || !!edu27.activeDegree;
  }
  function hub18336(id, icon, label) {
    return { id:norm18336(id), icon:icon, label:label };
  }
  function hubMap18336() {
    return {
      lifehub: hub18336("lifehub", "📖", "Life"),
      people: hub18336("people", "👥", "People"),
      school: hub18336("school", "🎓", "Education"),
      career: hub18336("career", "💼", "Job"),
      finance: hub18336("finance", "📊", "Finance"),
      money: hub18336("money", "💰", "Money"),
      brokerage: hub18336("brokerage", "📈", "Stocks"),
      business: hub18336("business", "🏢", "Business"),
      law: hub18336("law", "⚖", "Legal"),
      health: hub18336("health", "❤", "Health"),
      home: hub18336("home", "⌂", "Home"),
      stats: hub18336("stats", "▦", "Stats"),
      more: hub18336("more", "...", "More")
    };
  }
  function primaryHubs18336() {
    var map = hubMap18336();
    var s = state18336() || {};
    var middle = schoolRelevant18336(s) ? "school" : "career";
    return ["lifehub", "people", middle, "finance", "money", "law", "more"].map(function (id) { return map[id]; });
  }
  function allHubs18336() {
    var map = hubMap18336();
    return ["lifehub", "people", "school", "career", "finance", "money", "brokerage", "business", "law", "health", "home", "stats", "more"].map(function (id) { return map[id]; });
  }
  function nav18336(active) {
    active = norm18336(active);
    return '<div class="v11-hub-tab-strip v18336-tab-strip" aria-label="Hub tab wheel"><div class="v11-hub-tab-scroll">' +
      primaryHubs18336().map(function (h) {
        var id = norm18336(h.id);
        return '<button class="v11-tab-btn' + (id === active ? ' active' : '') + '" onclick="event.preventDefault();event.stopPropagation();(window.setTabV16||window.setTab||setTab)(\'' + esc18336(id) + '\')"><span class="v11-tab-ico">' + esc18336(h.icon || "") + '</span><span class="v11-tab-lbl">' + esc18336(h.label || id) + '</span></button>';
      }).join("") + '</div></div>';
  }

  window.getVisibleHubs = primaryHubs18336;
  window.getAllHubsV186 = allHubs18336;
  window.getStableHubsV18336 = primaryHubs18336;
  try { getVisibleHubs = primaryHubs18336; } catch (e) {}

  var previousOverlay18336 = window.renderHubOverlay || (typeof renderHubOverlay === "function" ? renderHubOverlay : null);
  window.renderHubOverlay = function (hubId) {
    var id = norm18336(hubId);
    if (id === "law") {
      var content = "";
      try { content = typeof renderHubContent === "function" ? renderHubContent("law") : ""; }
      catch (e) { content = '<section class="panel"><div class="section-label">Legal recovered</div><div class="row-sub">' + esc18336(e && (e.message || e) || "Law render error") + '</div></section>'; }
      return '<div class="hub-overlay hub-law v16-hub v18336-law-overlay" data-hub-id="law" onclick="if(event.target===this)closeHub()"><div class="hub-sheet hub-sheet-law"><div class="hub-head"><h2>Legal</h2><button class="hub-close v16-close" onclick="event.preventDefault();event.stopPropagation();closeHub()">x</button></div><div class="v16-hub-body" data-hub-body="law">' + content + '</div>' + nav18336("law") + '</div></div>';
    }
    return typeof previousOverlay18336 === "function" ? previousOverlay18336.apply(this, [id]) : "";
  };
  try { renderHubOverlay = window.renderHubOverlay; } catch (e) {}

  try {
    var style = document.createElement("style");
    style.textContent = [
      ".bottom-nav{display:grid!important;grid-template-columns:repeat(7,minmax(0,1fr))!important;gap:4px!important;overflow:visible!important;scroll-snap-type:none!important;padding:6px!important;box-sizing:border-box!important;width:100%!important}",
      ".bottom-nav::-webkit-scrollbar{display:none!important}",
      ".bottom-nav .nav-btn{flex:1 1 auto!important;min-width:0!important;width:auto!important;scroll-snap-align:none!important;padding:8px 1px!important;gap:3px!important;overflow:hidden!important}",
      ".bottom-nav .nav-btn .nav-icon{font-size:12px!important;line-height:1!important;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:clip}",
      ".bottom-nav .nav-btn .nav-label{font-size:7px!important;letter-spacing:0!important;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:clip}",
      ".v18336-tab-strip .v11-hub-tab-scroll{display:grid!important;grid-template-columns:repeat(7,minmax(0,1fr))!important;gap:6px!important;overflow:visible!important}",
      ".v18336-tab-strip .v11-tab-btn{min-width:0!important;flex:1 1 auto!important}.v18336-tab-strip .v11-tab-lbl{letter-spacing:0!important}"
    ].join("\n");
    document.head.appendChild(style);
  } catch (e2) {}

  try { if (state18336() && typeof render === "function") render(); } catch (e3) {}
})();
