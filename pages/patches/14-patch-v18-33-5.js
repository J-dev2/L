/* LEDGER PATCH v18.33.5: stable hub navigation after v18.33 import
   The v18.33.2 law/recovery import wrapped getVisibleHubs through a helper
   that calls getVisibleHubs again. When that recursion fails, only the
   emergency Stocks/Law/More hubs survive. This patch replaces the hub source
   with a known-good core list and gives the Law overlay a non-recursive tab
   strip so a save can never get trapped in three buttons again. */
(function () {
  if (window.__ledgerPatch18335StableNav) return;
  window.__ledgerPatch18335StableNav = true;

  function esc18335(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (ch) {
      return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[ch];
    });
  }
  function state18335() {
    try { if (typeof state !== "undefined") return state; } catch (e) {}
    return window.state || null;
  }
  function num18335(v) {
    v = Number(v);
    return isFinite(v) ? v : 0;
  }
  function normHub18335(id) {
    id = String(id || "").toLowerCase();
    if (id === "life") return "lifehub";
    if (id === "stocks") return "brokerage";
    if (id === "legal" || id === "lawoffice" || id === "law-office" || id === "taxlaw") return "law";
    if (id === "networth" || id === "network" || id === "financehub") return "finance";
    if (id === "education") return "school";
    if (id === "founder" || id === "startup" || id === "entrepreneur") return "entrepreneurship";
    return id || "lifehub";
  }
  function title18335(id) {
    id = normHub18335(id);
    var map = {
      lifehub:"Life",
      people:"People",
      school:"Education",
      career:"Job",
      finance:"Finance",
      money:"Money",
      brokerage:"Stocks",
      business:"Business",
      entrepreneurship:"Entrepreneurship",
      law:"Legal",
      more:"More",
      health:"Health",
      home:"Home",
      stats:"Stats"
    };
    return map[id] || id.replace(/\b\w/g, function (m) { return m.toUpperCase(); });
  }
  function hub18335(id, icon, label, disabled) {
    return { id:normHub18335(id), icon:icon, label:label || title18335(id), disabled:!!disabled };
  }
  function schoolRelevant18335(s) {
    s = s || {};
    var flags = s.flags || {};
    var education = s.education || {};
    var edu25 = s.educationV1825 || {};
    var edu27 = s.educationV1827 || {};
    var age = num18335(s.age);
    return age < 22 || !!flags.inCollege || !!flags.inSchool || !!s.inSchool || !!s.inCollege ||
      !!education.inSchool || !!education.inCollege || !!education.enrolled ||
      !!edu25.active || !!edu25.activeDegree || !!edu27.active || !!edu27.activeDegree;
  }
  function stableHubs18335() {
    var s = state18335() || {};
    var ids = ["lifehub", "people"];
    if (schoolRelevant18335(s)) ids.push("school");
    ids = ids.concat(["career", "finance", "money", "brokerage", "business", "law", "more"]);
    var data = {
      lifehub: hub18335("lifehub", "Life", "Life"),
      people: hub18335("people", "People", "People"),
      school: hub18335("school", "Edu", "Education"),
      career: hub18335("career", "Job", "Job"),
      finance: hub18335("finance", "$", "Finance"),
      money: hub18335("money", "$", "Money"),
      brokerage: hub18335("brokerage", "Stock", "Stocks"),
      business: hub18335("business", "Biz", "Business"),
      law: hub18335("law", "Law", "Legal"),
      more: hub18335("more", "...", "More")
    };
    return ids.map(function (id) { return data[id]; }).filter(Boolean);
  }

  function fullHubs18335() {
    var s = state18335() || {};
    var hubs = stableHubs18335().slice();
    var seen = {};
    hubs.forEach(function (h) { seen[h.id] = true; });
    [
      hub18335("health", "Health", "Health"),
      hub18335("home", "Home", "Home"),
      hub18335("stats", "Stats", "Stats")
    ].forEach(function (h) {
      if (!seen[h.id]) {
        if (h.id === "home" && num18335(s.age) < 10) h.disabled = false;
        hubs.push(h);
        seen[h.id] = true;
      }
    });
    return hubs;
  }

  window.getVisibleHubs = stableHubs18335;
  window.getAllHubsV186 = fullHubs18335;
  window.getStableHubsV18335 = stableHubs18335;
  try { getVisibleHubs = stableHubs18335; } catch (e) {}

  function openCode18335(id) {
    id = esc18335(normHub18335(id));
    return "(window.setTabV16 || window.setTab || setTab)('" + id + "')";
  }
  function navStrip18335(active) {
    active = normHub18335(active);
    return '<div class="v11-hub-tab-strip v18335-tab-strip" aria-label="Hub tab wheel"><div class="v11-hub-tab-scroll">' +
      stableHubs18335().map(function (h) {
        var id = normHub18335(h.id);
        return '<button class="v11-tab-btn' + (id === active ? ' active' : '') + '" ' + (h.disabled ? 'disabled' : '') +
          ' onclick="event.preventDefault();event.stopPropagation();' + openCode18335(id) + '">' +
          '<span class="v11-tab-ico">' + esc18335(h.icon || "") + '</span><span class="v11-tab-lbl">' + esc18335(h.label || title18335(id)) + '</span></button>';
      }).join("") + '</div></div>';
  }
  window.navStripV18335 = navStrip18335;

  var previousOverlay18335 = window.renderHubOverlay || (typeof renderHubOverlay === "function" ? renderHubOverlay : null);
  window.renderHubOverlay = function (hubId) {
    var id = normHub18335(hubId);
    if (id === "law") {
      var content = "";
      try {
        content = typeof renderHubContent === "function" ? renderHubContent("law") : "";
      } catch (e) {
        content = '<section class="panel"><div class="section-label">Legal recovered</div><div class="row-sub">' + esc18335(e && (e.message || e) || "Law render error") + '</div></section>';
      }
      return '<div class="hub-overlay hub-law v16-hub v18335-law-overlay" data-hub-id="law" onclick="if(event.target===this)closeHub()">' +
        '<div class="hub-sheet hub-sheet-law"><div class="hub-head"><h2>Legal</h2>' +
        '<button class="hub-close v16-close" onclick="event.preventDefault();event.stopPropagation();closeHub()">x</button></div>' +
        '<div class="v16-hub-body" data-hub-body="law">' + content + '</div>' + navStrip18335("law") + '</div></div>';
    }
    if (id === "business" || id === "entrepreneurship") {
      var body = "";
      try {
        body = typeof renderHubContent === "function" ? renderHubContent(id) : "";
      } catch (businessError) {
        body = '<section class="panel"><div class="section-label">Render recovered</div><div class="row-sub">' + esc18335(businessError && (businessError.message || businessError) || "business render error") + '</div></section>';
      }
      return '<div class="hub-overlay hub-' + esc18335(id) + ' v16-hub v18335-business-overlay" data-hub-id="' + esc18335(id) + '" onclick="if(event.target===this)closeHub()">' +
        '<div class="hub-sheet hub-sheet-' + esc18335(id) + '"><div class="hub-head"><h2>' + esc18335(title18335(id)) + '</h2>' +
        '<button class="hub-close v16-close" onclick="event.preventDefault();event.stopPropagation();closeHub()">x</button></div>' +
        '<div class="v16-hub-body" data-hub-body="' + esc18335(id) + '">' + body + '</div>' + navStrip18335(id) + '</div></div>';
    }
    if (typeof previousOverlay18335 === "function") return previousOverlay18335.apply(this, [id]);
    var fallback = "";
    try { fallback = typeof renderHubContent === "function" ? renderHubContent(id) : ""; } catch (e2) {
      fallback = '<section class="panel"><div class="section-label">Render recovered</div><div class="row-sub">' + esc18335(e2 && (e2.message || e2) || "hub render error") + '</div></section>';
    }
    return '<div class="hub-overlay hub-' + esc18335(id) + '" onclick="if(event.target===this)closeHub()"><div class="hub-sheet hub-sheet-' + esc18335(id) + '"><div class="hub-head"><h2>' + esc18335(title18335(id)) + '</h2><button class="hub-close" onclick="closeHub()">x</button></div>' + fallback + navStrip18335(id) + '</div></div>';
  };
  try { renderHubOverlay = window.renderHubOverlay; } catch (e) {}

  try {
    var style = document.createElement("style");
    style.textContent = ".v18335-tab-strip .v11-hub-tab-scroll{scrollbar-width:thin}.v18335-law-overlay .hub-head h2{letter-spacing:0}.v18335-law-overlay .hub-close{min-width:42px}";
    document.head.appendChild(style);
  } catch (e) {}

  try {
    if (state18335() && typeof render === "function") render();
  } catch (e) {
    try { console.warn("Ledger v18.33.5 nav refresh skipped", e); } catch (ignore) {}
  }
})();
