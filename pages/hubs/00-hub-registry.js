/* Ledger v18.35 hub registry.
   This is a bridge layer: the old global renderers still run, but hubs now
   have named files and metadata so future work can move code out safely. */
(function () {
  if (window.LedgerPages && window.LedgerPages.version === "v18.35") return;

  var api = {
    version: "v18.35",
    hubs: {},
    order: [],
    aliases: {},
    registerHub: function (def) {
      if (!def || !def.id) return null;
      var id = String(def.id);
      if (!this.hubs[id]) this.order.push(id);
      this.hubs[id] = def;
      (def.aliases || []).forEach(function (alias) {
        api.aliases[String(alias)] = id;
      });
      return def;
    },
    normalize: function (id) {
      id = String(id || "lifehub").toLowerCase();
      return this.aliases[id] || id;
    },
    getHub: function (id) {
      return this.hubs[this.normalize(id)] || null;
    },
    listHubs: function () {
      return this.order.map(function (id) { return api.hubs[id]; }).filter(Boolean);
    },
    render: function (id) {
      var hub = this.getHub(id);
      if (hub && typeof hub.render === "function") return hub.render();
      var normalized = this.normalize(id);
      if (typeof window.renderHubContent === "function") return window.renderHubContent(normalized);
      return "";
    },
    open: function (id) {
      var normalized = this.normalize(id);
      var opener = window.setTabV16 || window.setTab || window.setTabV11;
      if (typeof opener === "function") return opener(normalized);
      try { window.tab = normalized; } catch (e) {}
      if (typeof window.render === "function") return window.render();
    }
  };

  window.LedgerPages = api;
  window.registerLedgerHub = function (def) { return api.registerHub(def); };
})();
