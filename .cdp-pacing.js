(function () {
  var out = { perType: {}, notes: [] };
  try {
    var starter = window.startSandboxV1812 || window.startSandboxV1810 || window.startSandbox;
    if (starter) starter();
    if (typeof ensureStateShape === "function") ensureStateShape();
    var S = state;
    var TYPES = ["saas","ai","fintech","marketplace","consumer","ecom","biotech","hardtech","gaming","creator","health","climate"];

    function live(c){ return c && (c.productStage === "live" || c.productStage === "v2"); }
    function freshCo(type){
      return { type:type, model:"subscription", name:type+"Co", stage:"building", productStage:"concept", age:0,
        cash:120000, revenue:0, users:0, productDev:6, productQuality:20, techDebt:4, growth:0, churn:0.1,
        valuation:0, equity:100, soldStake:0, coFounders:[], rounds:[], totalRaised:0, debt:[], rbf:null,
        team:{eng:0,sales:0,ops:0,growth:0,finance:0,research:0,design:0,cs:0}, hires:[],
        devAlloc:{features:50,bugfix:20,ux:20,custdev:10}, momentum:0.4, hist:[] };
    }
    function runTrial(type){
      // isolate finances
      S.job = null;
      if (!S.finance) S.finance = {};
      S.finance.businesses = [];
      S.money = 50000;
      S.age = 22;
      S.finance.startupV1856 = { co: freshCo(type), history:[], founderRep:20, lifetimeExit:0, fullTime:false, totalExits:0 };
      var devYear = null, exitYear = null, exitVal = null, bankrupt = false, nan = false, maxPersonal = 0;
      for (var y = 1; y <= 45; y++){
        S.actionsTaken = {};
        var sf = S.finance.startupV1856; var c = sf.co;
        if (!c) break;
        // ---- strong-player policy ----
        try {
          if (c.cash < 350000) { try { window.raiseEquityV1856(); } catch(e){} }
          try { window.takeGrantV1856(); } catch(e){}
          if (live(c)) {
            try { window.investRDV1856(); } catch(e){}
            try { window.growthPushV1856(); } catch(e){}
            if (c.hires.indexOf("sales") < 0 && c.cash > 600000) try { window.hireRoleV1856("sales"); } catch(e){}
            if (c.hires.indexOf("growth") < 0 && c.cash > 600000) try { window.hireRoleV1856("growth"); } catch(e){}
          } else {
            try { window.setDevFocusV1856("features"); } catch(e){}
            try { window.buildSprintV1856(); } catch(e){}
            if (c.hires.indexOf("cto") < 0 && c.cash > 500000) try { window.hireRoleV1856("cto"); } catch(e){}
          }
        } catch(e){}
        // ---- advance the year ----
        var moneyBefore = S.money;
        S.age = S.age + 1;
        try { window.resolveLifeAndFinanceYear(); } catch(e){ out.notes.push(type+" tick err "+e); }
        sf = S.finance.startupV1856; c = sf.co;
        if (S.money - moneyBefore > maxPersonal) maxPersonal = S.money - moneyBefore;
        if (!c) {
          var h = sf.history[0];
          if (h && h.outcome === "bankrupt") { bankrupt = true; }
          break;
        }
        if (!isFinite(c.cash) || !isFinite(c.revenue) || !isFinite(c.valuation) || isNaN(c.cash) || isNaN(c.valuation)) nan = true;
        if (devYear === null && live(c)) devYear = y;
        // exit when eligible (scale, or big valuation at growth)
        if (exitYear === null && (c.stage === "scale" || (c.stage === "growth" && c.valuation >= 300000000))) {
          exitYear = y;
          var before = S.money;
          try { window.acceptAcquisitionV1856(); } catch(e){}
          exitVal = S.money - before;
          break;
        }
      }
      return { devYear: devYear, exitYear: exitYear, exitVal: exitVal, bankrupt: bankrupt, nan: nan, maxPersonal: maxPersonal };
    }

    TYPES.forEach(function(type){
      var trials = [];
      for (var t = 0; t < 3; t++) trials.push(runTrial(type));
      function avg(key){ var v = trials.filter(function(r){return r[key]!=null;}).map(function(r){return r[key];}); return v.length? Math.round(v.reduce(function(a,b){return a+b;},0)/v.length):null; }
      out.perType[type] = {
        devYearAvg: avg("devYear"),
        exitYearAvg: avg("exitYear"),
        exitsOf3: trials.filter(function(r){return r.exitYear!=null;}).length,
        exitValAvg: avg("exitVal"),
        bankruptOf3: trials.filter(function(r){return r.bankrupt;}).length,
        nanSeen: trials.some(function(r){return r.nan;}),
        maxPersonalPreExit: Math.max.apply(null, trials.map(function(r){return r.maxPersonal;}))
      };
    });
  } catch (e) {
    out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0,4).join(" || ") : "");
  }
  return out;
})();
