(function () {
  var out = {};
  try {
    var starter = window.startSandboxV1812 || window.startSandboxV1810 || window.startSandbox;
    if (starter) starter();
    if (typeof ensureStateShape === "function") ensureStateShape();
    var S = state; S.job = null; S.finance.businesses = []; S.money = 50000; S.age = 30;

    function makeCo(o){
      var c = { type:"saas", model:"subscription", name:"FundCo", stage:"growth", productStage:"live", age:5,
        cash:5000000, revenue:60000000, users:50000, productDev:600, productQuality:70, techDebt:10, growth:0.25,
        churn:0.1, valuation:400000000, equity:100, soldStake:0, coFounders:[], rounds:[], totalRaised:0, debt:[], rbf:null,
        team:{eng:1,sales:0,ops:0,growth:0,finance:0,research:0,design:0,cs:0}, hires:[],
        devAlloc:{features:50,bugfix:20,ux:20,custdev:10}, momentum:0.6, hist:[] };
      for (var k in (o||{})) c[k]=o[k];
      return c;
    }
    function setCo(c){ S.finance.startupV1856 = { co:c, history:[], founderRep:40, lifetimeExit:0, fullTime:false, totalExits:0 }; }
    function capOK(c){ var cf=(c.coFounders||[]).reduce(function(s,x){return s+x.equity;},0); return (c.equity + c.soldStake + cf) <= 100.5 && c.equity > 0 && c.equity <= 100 && c.soldStake >= 0 && c.soldStake <= 90; }

    // ---- A) Equity rounds dilute progressively ----
    var c = makeCo({}); setCo(c);
    var eq = [Math.round(c.equity)];
    for (var i=0;i<6;i++){ try{ window.raiseEquityV1856(); }catch(e){} eq.push(Math.round(c.equity)); }
    out.equityRounds = { sequence: eq, roundsRaised: c.rounds.length, decreasing: eq.every(function(v,i){return i===0||v<=eq[i-1];}), capOK: capOK(c), finalEquity: Math.round(c.equity) };

    // ---- B) Loan ----
    c = makeCo({}); setCo(c);
    var cashB = c.cash, debtB = c.debt.length;
    try { window.takeLoanV1856(); } catch(e){}
    var d = c.debt[c.debt.length-1] || {};
    out.loan = { cashUp: c.cash > cashB, debtAdded: c.debt.length === debtB+1, annualPositive: (d.annual||0) > 0, yearsLeft: d.yearsLeft };

    // ---- C) Sell + buyback (premium) ----
    c = makeCo({}); setCo(c);
    var eqBefore = c.equity, cashC = c.cash;
    try { window.sellStakeV1856(); } catch(e){}
    var afterSell = { equity: Math.round(c.equity), soldStake: c.soldStake, cashUp: c.cash > cashC, capOK: capOK(c) };
    var cashAfterSell = c.cash;
    try { window.buybackStakeV1856(); } catch(e){}
    out.sellBuyback = { afterSell: afterSell, afterBuyEquity: Math.round(c.equity), afterBuySold: c.soldStake, buybackCostlier: (cashAfterSell - c.cash) > 0, backToStart: Math.round(c.equity) === Math.round(eqBefore), capOK: capOK(c) };

    // ---- D) RBF ----
    c = makeCo({}); setCo(c);
    try { window.takeRBFV1856(); } catch(e){}
    out.rbf = { active: !!(c.rbf && c.rbf.owed > 0), owed: c.rbf ? c.rbf.owed : 0, share: c.rbf ? c.rbf.share : null };

    // ---- E) Loan strain -> bankruptcy when unpayable ----
    c = makeCo({ stage:"launched", revenue: 50000, cash: 200000, valuation: 2000000 });
    c.debt.push({ principal: 5000000, rate: 0.15, yearsLeft: 5, annual: 1200000 });
    setCo(c);
    var died = false;
    for (var y=0; y<6; y++){ S.actionsTaken = {}; S.age++; try{ window.resolveLifeAndFinanceYear(); }catch(e){} if (!S.finance.startupV1856.co){ died = (S.finance.startupV1856.history[0]||{}).outcome === "bankrupt"; break; } }
    out.loanStrain = { wentBankrupt: died };

    // ---- F) Roles: buckets + burn/churn effects ----
    c = makeCo({ team:{eng:1,sales:0,ops:0,growth:0,finance:0,research:0,design:0,cs:0}, cash: 5000000 }); setCo(c);
    var roleTests = {};
    ["sales","cs","growth","cfo","ops","design"].forEach(function(rid){
      var before = JSON.parse(JSON.stringify(c.team));
      try { window.hireRoleV1856(rid); } catch(e){}
      var bucket = ({sales:"sales",cs:"cs",growth:"growth",cfo:"finance",ops:"ops",design:"design"})[rid];
      roleTests[rid] = { hired: c.hires.indexOf(rid)>=0, bucketUp: c.team[bucket] === before[bucket]+1 };
    });
    out.roles = roleTests;

    // ---- G) Graduation -> business loop ----
    c = makeCo({ stage:"scale", revenue: 80000000, valuation: 1200000000, equity: 60, productQuality: 80, cash: 8000000 });
    setCo(c);
    var bizCountBefore = S.finance.businesses.length;
    try { window.graduateStartupV1856(); } catch(e){ out.gradErr = String(e); }
    var biz = S.finance.businesses[S.finance.businesses.length-1] || null;
    out.graduation = biz ? {
      added: S.finance.businesses.length === bizCountBefore+1,
      sector: biz.category, hasMeter: typeof biz.sectorMeterV1851 === "number",
      value: Math.round(biz.value), stage: biz.stage, reputation: biz.reputation
    } : { added:false };
    if (biz){
      var incomes = [];
      for (var yy=0; yy<4; yy++){ S.actionsTaken={}; S.age++; try{ window.resolveLifeAndFinanceYear(); }catch(e){} incomes.push(Math.round(biz.lastIncome||0)); }
      out.graduation.incomesAfter = incomes;
      out.graduation.stageAfter = biz.stage;
      out.graduation.meterAfter = Math.round(biz.sectorMeterV1851);
      out.graduation.sane = incomes.every(function(v){ return isFinite(v) && Math.abs(v) < biz.value * 5; });
    }
  } catch (e) {
    out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0,4).join(" || ") : "");
  }
  return out;
})();
