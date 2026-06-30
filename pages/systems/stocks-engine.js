/* Investments 2.0 stock engine and trading desk.
 * This adapts the Verdant stock-engine idea into Ledger's existing state:
 * state.finance.stocksV18 remains the save home, and the legacy v18 action
 * names keep working for Money, Finance, Entrepreneurship, and old saves.
 */
(function () {
  "use strict";
  if (window.__ledgerStocksEngineV20Loaded) return;
  window.__ledgerStocksEngineV20Loaded = true;

  var ENGINE_VERSION = "investments-v21-stocks1";
  var TICK_MS = 1000;
  var MAX_CANDLES = 140;
  var MAX_HISTORY = 280;
  var MAX_LOG = 48;

  var STOCKS = [
    { id:"VOO", name:"Vanguard S&P 500 ETF", sector:"Index", icon:"IDX", price:510, beta:.75, volatility:.07, dividend:.014, style:"core", desc:"Broad market anchor. Slow, diversified, and hard to beat." },
    { id:"QQQ", name:"Nasdaq 100 ETF", sector:"Index", icon:"NDX", price:435, beta:1.05, volatility:.11, dividend:.006, style:"growth", desc:"Large-cap tech index. Faster than VOO, rougher in selloffs." },
    { id:"SCHD", name:"Dividend Equity ETF", sector:"Index", icon:"DIV", price:80, beta:.65, volatility:.07, dividend:.036, style:"income", desc:"Dividend-heavy portfolio for steadier income." },
    { id:"AAPL", name:"Apple", sector:"Tech", icon:"APL", price:195, beta:1.05, volatility:.13, dividend:.005, style:"quality", desc:"Consumer hardware and services with a deep cash moat." },
    { id:"MSFT", name:"Microsoft", sector:"Tech", icon:"MSF", price:430, beta:.98, volatility:.12, dividend:.007, style:"quality", desc:"Cloud, software, and AI infrastructure." },
    { id:"NVDA", name:"NVIDIA", sector:"Tech", icon:"GPU", price:125, beta:1.8, volatility:.24, dividend:.001, style:"momentum", desc:"AI chips. Can surge hard and pull back even harder." },
    { id:"AMD", name:"AMD", sector:"Tech", icon:"CHP", price:160, beta:1.55, volatility:.21, dividend:0, style:"growth", desc:"Semiconductor challenger with cyclical swings." },
    { id:"AMZN", name:"Amazon", sector:"Consumer", icon:"AMZ", price:185, beta:1.18, volatility:.16, dividend:0, style:"growth", desc:"Retail, cloud, ads, and logistics." },
    { id:"GOOGL", name:"Alphabet", sector:"Tech", icon:"GOO", price:175, beta:1.08, volatility:.14, dividend:.004, style:"quality", desc:"Search, ads, cloud, and AI." },
    { id:"META", name:"Meta Platforms", sector:"Tech", icon:"MET", price:505, beta:1.35, volatility:.18, dividend:.004, style:"momentum", desc:"Social platforms, ads, AI, and metaverse optionality." },
    { id:"TSLA", name:"Tesla", sector:"Speculative", icon:"EV", price:180, beta:2.15, volatility:.32, dividend:0, style:"speculative", desc:"EVs, energy, and narrative risk. Not calm money." },
    { id:"NFLX", name:"Netflix", sector:"Consumer", icon:"NFL", price:650, beta:1.25, volatility:.17, dividend:0, style:"growth", desc:"Streaming leader with hit-driven sentiment." },
    { id:"CRM", name:"Salesforce", sector:"Tech", icon:"CRM", price:285, beta:1.12, volatility:.15, dividend:0, style:"growth", desc:"Enterprise software with margin expansion hopes." },
    { id:"ORCL", name:"Oracle", sector:"Tech", icon:"DB", price:140, beta:.92, volatility:.12, dividend:.012, style:"quality", desc:"Legacy software plus cloud infrastructure." },
    { id:"JPM", name:"JPMorgan Chase", sector:"Finance", icon:"BNK", price:205, beta:1.02, volatility:.13, dividend:.022, style:"income", desc:"Banking and capital markets." },
    { id:"GS", name:"Goldman Sachs", sector:"Finance", icon:"IB", price:455, beta:1.18, volatility:.16, dividend:.023, style:"cyclical", desc:"Investment banking. Big cycles, big bonuses." },
    { id:"V", name:"Visa", sector:"Finance", icon:"PAY", price:280, beta:.88, volatility:.11, dividend:.008, style:"quality", desc:"Global payments network." },
    { id:"MA", name:"Mastercard", sector:"Finance", icon:"PAY", price:455, beta:.95, volatility:.12, dividend:.006, style:"quality", desc:"Payments compounder with global reach." },
    { id:"BRK-B", name:"Berkshire Hathaway", sector:"Finance", icon:"BRK", price:420, beta:.72, volatility:.08, dividend:0, style:"core", desc:"Diversified conglomerate with insurance float." },
    { id:"BLK", name:"BlackRock", sector:"Finance", icon:"AUM", price:840, beta:1.0, volatility:.13, dividend:.024, style:"income", desc:"Asset management scale and market beta." },
    { id:"XOM", name:"Exxon Mobil", sector:"Energy", icon:"OIL", price:112, beta:.88, volatility:.14, dividend:.035, style:"income", desc:"Energy exposure and dividends." },
    { id:"CVX", name:"Chevron", sector:"Energy", icon:"OIL", price:158, beta:.82, volatility:.13, dividend:.038, style:"income", desc:"Integrated energy major." },
    { id:"NEE", name:"NextEra Energy", sector:"Energy", icon:"PWR", price:74, beta:.62, volatility:.11, dividend:.028, style:"defensive", desc:"Utility plus renewables exposure." },
    { id:"ENPH", name:"Enphase Energy", sector:"Energy", icon:"SUN", price:112, beta:1.85, volatility:.32, dividend:0, style:"speculative", desc:"Solar hardware. Sharp upside and drawdowns." },
    { id:"JNJ", name:"Johnson & Johnson", sector:"Health", icon:"HLT", price:155, beta:.55, volatility:.08, dividend:.031, style:"defensive", desc:"Defensive healthcare and dividends." },
    { id:"UNH", name:"UnitedHealth Group", sector:"Health", icon:"INS", price:515, beta:.75, volatility:.10, dividend:.015, style:"quality", desc:"Large healthcare operator." },
    { id:"PFE", name:"Pfizer", sector:"Health", icon:"RX", price:29, beta:.62, volatility:.11, dividend:.058, style:"income", desc:"Pharmaceutical value and dividend risk." },
    { id:"MRNA", name:"Moderna", sector:"Health", icon:"BIO", price:118, beta:1.45, volatility:.28, dividend:0, style:"speculative", desc:"Biotech pipeline. Clinical news can move the tape." },
    { id:"COST", name:"Costco", sector:"Consumer", icon:"CST", price:845, beta:.74, volatility:.10, dividend:.006, style:"quality", desc:"Membership retail with premium valuation." },
    { id:"WMT", name:"Walmart", sector:"Consumer", icon:"WMT", price:68, beta:.52, volatility:.08, dividend:.012, style:"defensive", desc:"Scale retail and grocery resilience." },
    { id:"PG", name:"Procter & Gamble", sector:"Consumer", icon:"PG", price:165, beta:.45, volatility:.07, dividend:.024, style:"defensive", desc:"Consumer staples with steady cash flow." },
    { id:"MCD", name:"McDonald's", sector:"Consumer", icon:"MCD", price:285, beta:.68, volatility:.09, dividend:.022, style:"income", desc:"Franchise model with pricing power." },
    { id:"NKE", name:"Nike", sector:"Consumer", icon:"NKE", price:96, beta:1.12, volatility:.15, dividend:.015, style:"cyclical", desc:"Brand strength, fashion cycles, and margin pressure." },
    { id:"LVMH", name:"LVMH", sector:"Luxury", icon:"LUX", price:780, beta:1.05, volatility:.15, dividend:.018, style:"quality", desc:"Luxury brands. Wealth-cycle sensitive." },
    { id:"PLD", name:"Prologis", sector:"Real Estate", icon:"LOG", price:112, beta:1.0, volatility:.13, dividend:.032, style:"income", desc:"Logistics real estate." },
    { id:"AMT", name:"American Tower", sector:"Real Estate", icon:"TWR", price:190, beta:.82, volatility:.12, dividend:.034, style:"income", desc:"Cell towers and infrastructure leases." },
    { id:"SPG", name:"Simon Property Group", sector:"Real Estate", icon:"MAL", price:148, beta:1.18, volatility:.16, dividend:.052, style:"income", desc:"Mall REIT with cyclical rent risk." },
    { id:"CAT", name:"Caterpillar", sector:"Industrial", icon:"CAT", price:340, beta:1.12, volatility:.14, dividend:.016, style:"cyclical", desc:"Machinery tied to building cycles." },
    { id:"BA", name:"Boeing", sector:"Industrial", icon:"AIR", price:185, beta:1.45, volatility:.22, dividend:0, style:"turnaround", desc:"Aircraft backlog with execution risk." },
    { id:"DAL", name:"Delta Air Lines", sector:"Industrial", icon:"JET", price:48, beta:1.35, volatility:.20, dividend:.008, style:"cyclical", desc:"Travel demand, fuel costs, and recession risk." },
    { id:"DIS", name:"Disney", sector:"Consumer", icon:"DIS", price:105, beta:1.15, volatility:.16, dividend:.006, style:"turnaround", desc:"Parks, media, streaming, and brand library." },
    { id:"COIN", name:"Coinbase", sector:"Crypto", icon:"COI", price:245, beta:2.7, volatility:.42, dividend:0, style:"crypto", desc:"Crypto exchange proxy. Moves with risk appetite." },
    { id:"BTC-USD", name:"Bitcoin", sector:"Crypto", icon:"BTC", price:68000, beta:3.0, volatility:.52, dividend:0, style:"crypto", desc:"Crypto proxy. Extremely volatile and cycle-driven." },
    { id:"ETH-USD", name:"Ethereum", sector:"Crypto", icon:"ETH", price:3500, beta:3.1, volatility:.58, dividend:0, style:"crypto", desc:"Smart-contract ecosystem. Big upside, big air pockets." },
    { id:"SOL-USD", name:"Solana", sector:"Crypto", icon:"SOL", price:145, beta:3.8, volatility:.75, dividend:0, style:"crypto", desc:"High-beta crypto network." },
    { id:"DOGE-USD", name:"Dogecoin", sector:"Crypto", icon:"DOG", price:.14, beta:4.8, volatility:1.10, dividend:0, style:"meme", desc:"Meme coin. Can spike, can vanish." },
    { id:"GME", name:"GameStop", sector:"Speculative", icon:"MEM", price:28, beta:3.2, volatility:.72, dividend:0, style:"meme", desc:"Meme-stock tape. Position sizing matters." },
    { id:"HOOD", name:"Robinhood", sector:"Speculative", icon:"TRD", price:22, beta:2.2, volatility:.40, dividend:0, style:"speculative", desc:"Retail brokerage and trading-volume sensitivity." },
    { id:"RIVN", name:"Rivian", sector:"Speculative", icon:"EV2", price:14, beta:2.4, volatility:.46, dividend:0, style:"speculative", desc:"EV growth story with capital needs." },
    { id:"ROKU", name:"Roku", sector:"Speculative", icon:"ADS", price:62, beta:2.1, volatility:.38, dividend:0, style:"speculative", desc:"Ad-cycle and streaming-platform bet." },
    { id:"SMR", name:"NuScale Power", sector:"Energy", icon:"NUC", price:10, beta:2.6, volatility:.55, dividend:0, style:"speculative", desc:"Small modular reactor theme. Story can outrun numbers." }
  ];

  var STOCK_INDEX = {};
  STOCKS.forEach(function (s) { STOCK_INDEX[s.id] = s; });
  var LEGACY_IDS = { VOO:1, AAPL:1, MSFT:1, NVDA:1, AMZN:1, GOOGL:1, TSLA:1, JPM:1, V:1, XOM:1, JNJ:1, UNH:1, PG:1, PLD:1, "BTC-USD":1 };
  var SECTOR_COLORS = {
    Index:"#d8b16e", Tech:"#7ea0ac", Finance:"#8fbf78", Energy:"#c58d55",
    Health:"#8cc2b4", Consumer:"#c9a16b", Luxury:"#c69dc7", "Real Estate":"#9b8cc2",
    Industrial:"#b7a48a", Crypto:"#d17070", Speculative:"#d68c5f"
  };
  var CYCLES = {
    bull: { label:"Bull market", bias:.0012, yearly:.115, vol:.050, desc:"Risk is being rewarded." },
    normal: { label:"Normal tape", bias:.00035, yearly:.068, vol:.070, desc:"Mixed but orderly." },
    bear: { label:"Bear market", bias:-.0010, yearly:-.095, vol:.105, desc:"Rallies fade quickly." },
    recession: { label:"Recession", bias:-.0015, yearly:-.155, vol:.125, desc:"Cash matters and cyclicals struggle." },
    recovery: { label:"Recovery", bias:.0016, yearly:.145, vol:.090, desc:"Oversold names are catching bids." },
    bubble: { label:"Bubble", bias:.0025, yearly:.220, vol:.145, desc:"Speculation is running hot." },
    crash: { label:"Crash", bias:-.0030, yearly:-.285, vol:.180, desc:"Forced selling is hitting the tape." }
  };
  var CYCLE_DURATIONS = {
    bull:[2, 4], bear:[1, 3], recession:[1, 2], recovery:[1, 3],
    normal:[2, 4], bubble:[1, 3], crash:[1, 1]
  };
  var ACCOUNT_TYPES = {
    cash: { label:"Cash Account", min:0, risk:"Low", note:"Personal trading with no borrowed money.", effects:["No margin debt", "Cleanest net-worth math"] },
    retirement: { label:"Retirement Account", min:25000, risk:"Low", note:"Long-horizon sleeve for patient investing.", effects:["Tax-aware framing", "Still uses Ledger investment cash"] },
    business: { label:"Business Account", min:100000, risk:"Medium", note:"A business treasury account for larger balances.", effects:["Separates intent", "No operating-company cash is touched"] },
    trust: { label:"Trust Account", min:250000, risk:"Medium", note:"A protected investing account for family planning.", effects:["Pairs with Legal trust", "Does not move assets into trust by itself"] },
    familyOffice: { label:"Family Office", min:10000000, risk:"Medium", note:"Coordination layer for very wealthy characters.", effects:["Works beside personal firm", "No replacement of existing firm state"] },
    margin: { label:"Margin Account", min:500000, risk:"High", note:"Visible as a future risk system; real margin debt is not enabled in this pass.", effects:["Locked for now", "Avoids hidden debt or double counting"] }
  };
  var TABS = [
    ["overview", "Overview"],
    ["stocks", "Stocks"],
    ["risk", "Risk"],
    ["firm", "Personal Firm"],
    ["funds", "Funds"],
    ["accounts", "Accounts"]
  ];
  var SORT_MODES = {
    default:"Featured",
    liveBest:"Live winners",
    liveWorst:"Live losers",
    annualBest:"Annual winners",
    annualWorst:"Annual losers",
    dividend:"Dividend yield",
    volatilityHigh:"High volatility",
    volatilityLow:"Low volatility",
    riskHigh:"Highest risk"
  };
  var FILTER_MODES = {
    all:"All",
    owned:"Owned",
    watchlist:"Watchlist",
    dividend:"Dividend",
    tech:"Tech",
    finance:"Finance",
    crypto:"Crypto",
    defensive:"Defensive"
  };

  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (ch) {
      return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[ch];
    });
  }
  function n(v, fallback) {
    var x = Number(v);
    return Number.isFinite(x) ? x : (fallback || 0);
  }
  function round(v) { return Math.round(n(v)); }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, n(v))); }
  function pct(v) {
    v = n(v);
    return (v >= 0 ? "+" : "") + (v * 100).toFixed(Math.abs(v) >= .1 ? 1 : 2) + "%";
  }
  function money(v) {
    try { if (typeof window.money === "function") return window.money(round(v)); } catch (e) {}
    v = round(v);
    var sign = v < 0 ? "-" : "";
    var a = Math.abs(v);
    if (a >= 1e12) return sign + "$" + (a / 1e12).toFixed(a >= 1e13 ? 1 : 2).replace(/\.0+$/, "") + "T";
    if (a >= 1e9) return sign + "$" + (a / 1e9).toFixed(a >= 1e10 ? 1 : 2).replace(/\.0+$/, "") + "B";
    if (a >= 1e6) return sign + "$" + (a / 1e6).toFixed(a >= 1e7 ? 1 : 2).replace(/\.0+$/, "") + "M";
    if (a >= 1e3) return sign + "$" + (a / 1e3).toFixed(a >= 1e4 ? 1 : 2).replace(/\.0+$/, "") + "K";
    return sign + "$" + a.toLocaleString();
  }
  function priceText(v) {
    v = n(v);
    var a = Math.abs(v);
    var decimals = a >= 1000 ? 2 : a >= 1 ? 2 : 4;
    return (v < 0 ? "-$" : "$") + a.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }
  function signedMoney(v) {
    v = round(v);
    if (!v) return "$0";
    return (v > 0 ? "+" : "-") + money(Math.abs(v));
  }
  function toast(msg) {
    try { if (typeof window.addToast === "function") return window.addToast(msg); } catch (e) {}
    try { if (typeof window.addLog === "function") return window.addLog(msg); } catch (e2) {}
  }
  function log(msg, deltas) {
    try { if (typeof window.addLog === "function") return window.addLog(msg, deltas || {}); } catch (e) {}
  }
  function save() {
    try { if (typeof window.save === "function") window.save(); } catch (e) {}
  }
  function stateNow() {
    try { if (window.state) return window.state; } catch (e) {}
    try { if (typeof state !== "undefined" && state) return state; } catch (e2) {}
    return null;
  }
  function engineReady(m) {
    return !!(m && typeof m === "object" && !Array.isArray(m) &&
      m.engineVersion === ENGINE_VERSION &&
      m.catalogSizeV20 === STOCKS.length &&
      Array.isArray(m.holdings) &&
      m.prices && typeof m.prices === "object" &&
      m.previousPrices && typeof m.previousPrices === "object" &&
      m.history && typeof m.history === "object" &&
      m.candles && typeof m.candles === "object" &&
      m.volumes && typeof m.volumes === "object" &&
      m.liveV18 && typeof m.liveV18 === "object" &&
      m.liveV18.trends && typeof m.liveV18.trends === "object" &&
      Array.isArray(m.watchlist) &&
      Array.isArray(m.shortPositions) &&
      Array.isArray(m.annualPositionsV21) &&
      Array.isArray(m.tradeHistory) &&
      Array.isArray(m.news) &&
      Array.isArray(m.marketAlertsV21) &&
      Array.isArray(m.earnings) &&
      Array.isArray(m.dividendHistory) &&
      m.livePositionsV21 && typeof m.livePositionsV21 === "object" &&
      m.stopLossRulesV21 && typeof m.stopLossRulesV21 === "object" &&
      m.liquidityV21 && typeof m.liquidityV21 === "object" &&
      m.cycleV21 && typeof m.cycleV21 === "object" &&
      m.accounts && typeof m.accounts === "object" &&
      ACCOUNT_TYPES[m.accounts.active || "cash"] &&
      STOCK_INDEX[m.selectedStockV20 || ""] &&
      (m.activeStocksModeV21 === "live" || m.activeStocksModeV21 === "annual") &&
      SORT_MODES[m.sortModeV21 || "default"] &&
      FILTER_MODES[m.filterModeV21 || "all"]);
  }
  function ensureShape() {
    var existing = stateNow();
    if (existing && existing.finance && engineReady(existing.finance.stocksV18)) return existing;
    try { if (typeof window.ensureStateShape === "function") window.ensureStateShape(); } catch (e) {}
    var s = stateNow();
    if (!s) return null;
    if (!s.finance || typeof s.finance !== "object") s.finance = {};
    if (!s.market || typeof s.market !== "object") s.market = { index:1000, mood:"normal", lastReturn:0, sectors:[] };
    if (s.money == null || !Number.isFinite(Number(s.money))) s.money = 0;
    if (s.savings == null || !Number.isFinite(Number(s.savings))) s.savings = 0;
    var f = s.finance;
    if (f.brokerage == null || !Number.isFinite(Number(f.brokerage))) f.brokerage = 0;
    if (f.managedPortfolio == null || !Number.isFinite(Number(f.managedPortfolio))) f.managedPortfolio = 0;
    if (!f.externalManager || typeof f.externalManager !== "object") f.externalManager = { id:null, capital:0, lastReturn:0, lastFee:0 };
    if (!f.personalFirm || typeof f.personalFirm !== "object") f.personalFirm = { hired:false, staff:{ advisor:1, analyst:1, risk:1, tax:1 } };
    if (!f.personalFirm.staff || typeof f.personalFirm.staff !== "object") f.personalFirm.staff = { advisor:1, analyst:1, risk:1, tax:1 };
    if (!f.fundTrackV189 || typeof f.fundTrackV189 !== "object") f.fundTrackV189 = { active:false, outsideCapital:0, risk:"balanced", reputation:0, lastReturn:0, lastFees:0, years:0 };
    if (!f.stocksV18 || typeof f.stocksV18 !== "object" || Array.isArray(f.stocksV18)) f.stocksV18 = {};
    var m = f.stocksV18;
    if (!Array.isArray(m.holdings)) m.holdings = [];
    if (!m.prices || typeof m.prices !== "object") m.prices = {};
    if (!m.previousPrices || typeof m.previousPrices !== "object") m.previousPrices = {};
    if (!m.history || typeof m.history !== "object") m.history = {};
    if (!m.candles || typeof m.candles !== "object") m.candles = {};
    if (!m.volumes || typeof m.volumes !== "object") m.volumes = {};
    if (!m.sectorTrends || typeof m.sectorTrends !== "object") m.sectorTrends = {};
    if (!Array.isArray(m.watchlist)) m.watchlist = [];
    if (!Array.isArray(m.shortPositions)) m.shortPositions = [];
    if (!Array.isArray(m.annualPositionsV21)) m.annualPositionsV21 = [];
    if (!Array.isArray(m.tradeHistory)) m.tradeHistory = [];
    if (!Array.isArray(m.news)) m.news = [];
    if (!Array.isArray(m.marketAlertsV21)) m.marketAlertsV21 = [];
    if (!Array.isArray(m.earnings)) m.earnings = [];
    if (!Array.isArray(m.dividendHistory)) m.dividendHistory = [];
    if (!m.livePositionsV21 || typeof m.livePositionsV21 !== "object") m.livePositionsV21 = {};
    if (!m.stopLossRulesV21 || typeof m.stopLossRulesV21 !== "object") m.stopLossRulesV21 = {};
    if (!m.liquidityV21 || typeof m.liquidityV21 !== "object") m.liquidityV21 = {};
    if (!m.analystRatings || typeof m.analystRatings !== "object") m.analystRatings = {};
    if (!m.accounts || typeof m.accounts !== "object") m.accounts = { active:"cash", marginDebt:0, lastMarginHealth:100 };
    if (!ACCOUNT_TYPES[m.accounts.active]) m.accounts.active = "cash";
    if (!Array.isArray(m.snapshots)) m.snapshots = [];
    if (!m.liveV18 || typeof m.liveV18 !== "object") m.liveV18 = { enabled:true, ticks:0, trends:{} };
    if (!m.liveV18.trends || typeof m.liveV18.trends !== "object") m.liveV18.trends = {};
    if (m.liveV18.enabled === false && !m.liveV18.userPausedV18) m.liveV18.enabled = true;
    if (!m.cycle) m.cycle = "normal";
    if (!m.activeTabV20) m.activeTabV20 = "overview";
    if (m.activeTabV20 === "live" || m.activeTabV20 === "annual" || m.activeTabV20 === "watchlist" || m.activeTabV20 === "news") m.activeTabV20 = "stocks";
    if (m.activeTabV20 === "history" || m.activeTabV20 === "guide" || m.activeTabV20 === "earnings" || m.activeTabV20 === "dividends") m.activeTabV20 = "overview";
    if (!m.searchV20) m.searchV20 = "";
    if (m.returnModeV20 !== "annual") m.returnModeV20 = "live";
    if (m.activeStocksModeV21 !== "annual") m.activeStocksModeV21 = m.returnModeV20 === "annual" ? "annual" : "live";
    if (!SORT_MODES[m.sortModeV21]) m.sortModeV21 = "default";
    if (!FILTER_MODES[m.filterModeV21]) m.filterModeV21 = "all";
    if (!m.cycleV21 || typeof m.cycleV21 !== "object") m.cycleV21 = seedCycleState(m.cycle);
    if (!CYCLES[m.cycleV21.key]) m.cycleV21 = seedCycleState(m.cycle);
    m.cycle = m.cycleV21.key;
    m.engineVersion = ENGINE_VERSION;
    m.catalogSizeV20 = STOCKS.length;
    STOCKS.forEach(function (stock) {
      if (!Number.isFinite(Number(m.prices[stock.id])) || Number(m.prices[stock.id]) <= 0) m.prices[stock.id] = stock.price;
      if (!Number.isFinite(Number(m.previousPrices[stock.id])) || Number(m.previousPrices[stock.id]) <= 0) m.previousPrices[stock.id] = m.prices[stock.id];
      if (!Array.isArray(m.history[stock.id]) || !m.history[stock.id].length) m.history[stock.id] = [m.prices[stock.id]];
      m.history[stock.id] = m.history[stock.id].map(Number).filter(function (x) { return x > 0; }).slice(-MAX_HISTORY);
      seedCandles(stock.id);
      if (!m.analystRatings[stock.id]) m.analystRatings[stock.id] = defaultRating(stock);
      if (!Number.isFinite(Number(m.volumes[stock.id]))) m.volumes[stock.id] = seedVolume(stock);
      if (!Number.isFinite(Number(m.liquidityV21[stock.id])) || Number(m.liquidityV21[stock.id]) < 1000000000) m.liquidityV21[stock.id] = seedLiquidity(stock);
    });
    m.holdings.forEach(function (h) {
      if (!h || typeof h !== "object") return;
      if (!h.id && h.symbol) h.id = h.symbol;
      h.id = String(h.id || "").toUpperCase();
      h.shares = Math.max(0, n(h.shares));
      var stock = stockById(h.id);
      var price = Math.max(.0001, n(m.prices[h.id], stock ? stock.price : n(h.price || h.currentPrice || h.avgCost, 1)));
      h.avgCost = Math.max(.0001, n(h.avgCost, price));
      h.invested = Math.max(0, n(h.invested, h.shares * h.avgCost));
    });
    m.holdings = m.holdings.filter(function (h) { return h && h.id && n(h.shares) > .000001; });
    m.annualPositionsV21.forEach(function (p) {
      if (!p || typeof p !== "object") return;
      if (!p.id && p.symbol) p.id = p.symbol;
      p.id = String(p.id || "").toUpperCase();
      var stock = stockById(p.id);
      var price = Math.max(.0001, n(p.markPrice, stock ? getPrice(p.id) : 1));
      p.shares = Math.max(0, n(p.shares));
      p.entryPrice = Math.max(.0001, n(p.entryPrice, price));
      p.markPrice = Math.max(.0001, n(p.markPrice, price));
      p.invested = Math.max(0, n(p.invested, p.shares * p.entryPrice));
      p.entryAge = round(n(p.entryAge, s.age || 0));
      p.dividends = Math.max(0, n(p.dividends));
      p.lastAnnualReturn = n(p.lastAnnualReturn);
    });
    m.annualPositionsV21 = m.annualPositionsV21.filter(function (p) { return p && stockById(p.id) && n(p.shares) > .000001; });
    m.shortPositions.forEach(function (p) {
      if (!p || typeof p !== "object") return;
      if (!p.id && p.symbol) p.id = p.symbol;
      p.id = String(p.id || "").toUpperCase();
      var stock = stockById(p.id);
      var price = Math.max(.0001, n(m.prices[p.id], stock ? stock.price : n(p.avgPrice, 1)));
      p.shares = Math.max(0, n(p.shares));
      p.avgPrice = Math.max(.0001, n(p.avgPrice, price));
      p.collateral = Math.max(0, n(p.collateral, p.shares * p.avgPrice));
      p.openedValue = Math.max(0, n(p.openedValue, p.shares * p.avgPrice));
    });
    m.shortPositions = m.shortPositions.filter(function (p) { return p && stockById(p.id) && n(p.shares) > .000001 && n(p.collateral) > 0; });
    if (!stockById(m.selectedStockV20)) {
      m.selectedStockV20 = (m.holdings[0] && stockById(m.holdings[0].id) && m.holdings[0].id) ||
        (m.watchlist[0] && stockById(m.watchlist[0]) && m.watchlist[0]) ||
        "VOO";
    }
    seedCandles(m.selectedStockV20);
    if (f.brokerage > 0 || m.holdings.length) f.brokerageOpened = true;
    return s;
  }
  function store() {
    var s = ensureShape();
    return s && s.finance && s.finance.stocksV18;
  }
  function stockById(id) {
    id = String(id || "").toUpperCase();
    return STOCK_INDEX[id] || null;
  }
  function getPrice(id) {
    var m = store();
    id = String(id || "").toUpperCase();
    var stock = stockById(id);
    return Math.max(.0001, n(m && m.prices && m.prices[id], stock ? stock.price : 0));
  }
  function getHolding(id, create) {
    var m = store();
    id = String(id || "").toUpperCase();
    var h = m.holdings.find(function (x) { return String(x.id || "").toUpperCase() === id; });
    if (!h && create) {
      h = { id:id, shares:0, avgCost:getPrice(id), invested:0 };
      m.holdings.push(h);
    }
    return h || null;
  }
  function getLivePositionMeta(id, create) {
    var m = store();
    id = String(id || "").toUpperCase();
    if (!stockById(id)) return null;
    var h = getHolding(id, false);
    var meta = m.livePositionsV21[id];
    if (!meta && create && h && n(h.shares) > 0) {
      meta = {
        id:id,
        entryPrice:n(h.avgCost, getPrice(id)),
        entryValue:n(h.shares) * n(h.avgCost, getPrice(id)),
        openedTick:n(m.liveV18 && m.liveV18.ticks),
        openedAt:Date.now(),
        highPrice:getPrice(id)
      };
      m.livePositionsV21[id] = meta;
    }
    if (meta) {
      meta.id = id;
      meta.entryPrice = Math.max(.0001, n(meta.entryPrice, h ? n(h.avgCost, getPrice(id)) : getPrice(id)));
      meta.entryValue = Math.max(0, n(meta.entryValue, h ? n(h.shares) * n(h.avgCost, getPrice(id)) : 0));
      meta.openedTick = Math.max(0, n(meta.openedTick));
      meta.openedAt = Math.max(0, n(meta.openedAt, Date.now()));
      meta.highPrice = Math.max(getPrice(id), n(meta.highPrice, getPrice(id)));
    }
    return meta || null;
  }
  function syncLivePositionMeta(id, h) {
    var m = store();
    id = String(id || "").toUpperCase();
    if (!h || n(h.shares) <= .000001) {
      delete m.livePositionsV21[id];
      delete m.stopLossRulesV21[id];
      return null;
    }
    var meta = getLivePositionMeta(id, true);
    if (!meta) return null;
    meta.entryPrice = Math.max(.0001, n(h.avgCost, getPrice(id)));
    meta.entryValue = Math.max(0, n(h.shares) * n(h.avgCost, getPrice(id)));
    meta.highPrice = Math.max(n(meta.highPrice), getPrice(id));
    return meta;
  }
  function livePositionSummary(id) {
    id = String(id || "").toUpperCase();
    var h = getHolding(id, false);
    var meta = getLivePositionMeta(id, true);
    if (!h || !meta) return { value:0, entryValue:0, gain:0, pct:0, held:"No live position", entryPrice:getPrice(id), highPrice:getPrice(id) };
    var value = holdingValue(h);
    var entry = Math.max(0, n(meta.entryValue, n(h.shares) * n(h.avgCost)));
    var gain = value - entry;
    var pctGain = entry ? gain / entry : 0;
    var heldMs = Math.max(0, Date.now() - n(meta.openedAt, Date.now()));
    var mins = Math.floor(heldMs / 60000);
    var secs = Math.floor((heldMs % 60000) / 1000);
    return {
      value:value,
      entryValue:entry,
      gain:gain,
      pct:pctGain,
      shares:n(h.shares),
      entryPrice:n(meta.entryPrice, n(h.avgCost)),
      highPrice:n(meta.highPrice, getPrice(id)),
      held:(mins ? mins + "m " : "") + secs + "s"
    };
  }
  function getShortPosition(id, create) {
    var m = store();
    id = String(id || "").toUpperCase();
    var p = m.shortPositions.find(function (x) { return String(x.id || "").toUpperCase() === id; });
    if (!p && create) {
      p = { id:id, shares:0, avgPrice:getPrice(id), collateral:0, openedValue:0 };
      m.shortPositions.push(p);
    }
    return p || null;
  }
  function holdingValue(h) {
    return Math.max(0, n(h && h.shares) * getPrice(h && h.id));
  }
  function shortMarketValue(p) {
    return Math.max(0, n(p && p.shares) * getPrice(p && p.id));
  }
  function shortUnrealized(p) {
    return p ? n(p.shares) * (n(p.avgPrice, getPrice(p.id)) - getPrice(p.id)) : 0;
  }
  function shortEquity(p) {
    if (!p) return 0;
    return Math.max(0, n(p.collateral) + shortUnrealized(p));
  }
  function totalShortEquity() {
    var m = store();
    if (!m) return 0;
    return Math.round((m.shortPositions || []).reduce(function (sum, p) { return sum + shortEquity(p); }, 0));
  }
  function totalShortExposure() {
    var m = store();
    if (!m) return 0;
    return Math.round((m.shortPositions || []).reduce(function (sum, p) { return sum + shortMarketValue(p); }, 0));
  }
  function totalShortUnrealized() {
    var m = store();
    if (!m) return 0;
    return Math.round((m.shortPositions || []).reduce(function (sum, p) { return sum + shortUnrealized(p); }, 0));
  }
  function stockValue() {
    var m = store();
    if (!m) return 0;
    return Math.round(m.holdings.reduce(function (sum, h) { return sum + holdingValue(h); }, 0));
  }
  function annualPositionValue(p) {
    return Math.max(0, n(p && p.shares) * Math.max(.0001, n(p && p.markPrice)));
  }
  function annualValue() {
    var m = store();
    if (!m) return 0;
    return Math.round((m.annualPositionsV21 || []).reduce(function (sum, p) { return sum + annualPositionValue(p); }, 0));
  }
  function annualCost() {
    var m = store();
    if (!m) return 0;
    return Math.round((m.annualPositionsV21 || []).reduce(function (sum, p) { return sum + n(p.invested, n(p.shares) * n(p.entryPrice)); }, 0));
  }
  function investedCost() {
    var m = store();
    if (!m) return 0;
    return Math.round(m.holdings.reduce(function (sum, h) { return sum + n(h.shares) * n(h.avgCost); }, 0));
  }
  function liquidCash(includeSavings) {
    var s = ensureShape();
    if (!s) return 0;
    var f = s.finance || {};
    return Math.max(0, round(n(s.money) + (includeSavings ? n(s.savings) + n(f.superSaver) : 0)));
  }
  function brokerageCash() {
    var s = ensureShape();
    return Math.max(0, round(s && s.finance && s.finance.brokerage));
  }
  function pullChecking(amount) {
    var s = ensureShape();
    amount = Math.max(0, round(amount));
    var paid = Math.min(Math.max(0, round(s.money)), amount);
    s.money = Math.max(0, round(s.money) - paid);
    return paid;
  }
  function addChecking(amount) {
    var s = ensureShape();
    s.money = Math.max(0, round(n(s.money) + Math.max(0, n(amount))));
  }
  function accountEquity() {
    return brokerageCash() + stockValue() + totalShortEquity();
  }
  function cycleDuration(key) {
    var span = CYCLE_DURATIONS[key] || CYCLE_DURATIONS.normal;
    return span[0] + Math.floor(Math.random() * (span[1] - span[0] + 1));
  }
  function seedCycleState(key) {
    key = CYCLES[key] ? key : "normal";
    var length = cycleDuration(key);
    return { key:key, year:1, remaining:length, length:length, startedAge:round((stateNow() || {}).age || 0) };
  }
  function advanceCycleState(m) {
    if (!m.cycleV21 || !CYCLES[m.cycleV21.key]) m.cycleV21 = seedCycleState(m.cycle || "normal");
    m.cycleV21.year = Math.max(1, round(n(m.cycleV21.year, 1)));
    m.cycleV21.remaining = Math.max(0, round(n(m.cycleV21.remaining, 1)) - 1);
    if (m.cycleV21.remaining <= 0) {
      var next = chooseCycle(m.cycleV21.key);
      m.cycleV21 = seedCycleState(next);
    } else {
      m.cycleV21.year += 1;
    }
    m.cycle = m.cycleV21.key;
    return m.cycleV21;
  }
  function cycleLabel() {
    var m = store();
    var c = m && m.cycleV21 || seedCycleState("normal");
    var meta = CYCLES[c.key] || CYCLES.normal;
    return meta.label + " / Year " + round(c.year || 1) + " / " + round(c.remaining || 0) + "y left";
  }
  function seedVolume(stock) {
    var base = stock.sector === "Crypto" ? 900000 : stock.sector === "Index" ? 600000 : stock.style === "speculative" || stock.style === "meme" ? 450000 : 260000;
    return Math.round(base * (.7 + Math.random() * .8));
  }
  function seedLiquidity(stock) {
    var base = 1000000000;
    if (stock.sector === "Index") base = 50000000000;
    else if (stock.style === "quality" || stock.style === "core") base = 25000000000;
    else if (stock.sector === "Crypto") base = 12000000000;
    else if (stock.style === "speculative" || stock.style === "meme") base = 3000000000;
    return Math.max(1000000000, Math.round(base * (.85 + Math.random() * .45)));
  }
  function defaultRating(stock) {
    var score = 55;
    if (stock.style === "quality" || stock.style === "core") score += 12;
    if (stock.style === "defensive" || stock.style === "income") score += 7;
    if (stock.style === "speculative" || stock.style === "meme" || stock.style === "crypto") score -= 10;
    score += Math.round((Math.random() - .5) * 10);
    return { score:clamp(score, 5, 95), label:ratingLabel(score), age:0, note:"Baseline desk rating." };
  }
  function ratingLabel(score) {
    score = n(score);
    if (score >= 78) return "Buy";
    if (score >= 62) return "Outperform";
    if (score >= 42) return "Hold";
    if (score >= 25) return "Underperform";
    return "Sell";
  }
  function seedCandles(id) {
    var s = stateNow();
    var m = s && s.finance && s.finance.stocksV18;
    if (!m) return [];
    if (Array.isArray(m.candles[id]) && m.candles[id].length) {
      var existing = m.candles[id].filter(validCandle).slice(-MAX_CANDLES);
      if (existing.length >= 2) {
        m.candles[id] = existing;
        return m.candles[id];
      }
      if (existing.length === 1) {
        var only = existing[0];
        m.history[id] = [Math.max(.0001, n(only.o, only.c)), Math.max(.0001, n(only.c, only.o))];
      }
    }
    var stock = stockById(id);
    var rawPrice = Math.max(.0001, n(m.prices && m.prices[id], stock ? stock.price : 1));
    stock = stock || { id:id, price:rawPrice, beta:1, volatility:.1 };
    var hist = (Array.isArray(m.history[id]) ? m.history[id] : [rawPrice]).map(Number).filter(function (v) { return v > 0; });
    if (!hist.length) hist = [stock.price || 1];
    if (hist.length === 1) {
      var seedMove = Math.max(.0025, n(stock.volatility, .1) * .018);
      hist = [Math.max(.0001, hist[0] * (1 - seedMove)), hist[0]];
      m.history[id] = hist.slice(-MAX_HISTORY);
    }
    var candles = [];
    for (var i = 0; i < hist.length; i++) {
      var open = i ? hist[i - 1] : hist[i] * (1 - .003);
      var close = hist[i];
      var spread = Math.max(.002, Math.abs(close - open) / Math.max(open, .01) + n(stock.volatility, .1) * .025);
      candles.push({
        o: Math.max(.0001, open),
        h: Math.max(open, close) * (1 + spread),
        l: Math.max(.0001, Math.min(open, close) * (1 - spread)),
        c: Math.max(.0001, close)
      });
    }
    m.candles[id] = candles.slice(-MAX_CANDLES);
    return m.candles[id];
  }
  function validCandle(c) {
    return c && n(c.o) > 0 && n(c.h) > 0 && n(c.l) > 0 && n(c.c) > 0;
  }
  function ensureCandleDepth(id, minCount) {
    var m = store();
    var stock = stockById(id) || { id:id, volatility:.1, price:getPrice(id) };
    var candles = seedCandles(id).filter(validCandle);
    var price = getPrice(id);
    var last = candles.length ? n(candles[candles.length - 1].c, price) : price;
    while (candles.length < minCount) {
      var wiggle = Math.sin((candles.length + String(id).length) * 1.71) * .0035 + randomNormalish() * Math.max(.004, n(stock.volatility, .1) * .018);
      var open = Math.max(.0001, last);
      var close = Math.max(.0001, open * (1 + wiggle));
      var spread = Math.max(.002, Math.abs(wiggle) * .75 + n(stock.volatility, .1) * .006);
      candles.push({
        o: open,
        h: Math.max(open, close) * (1 + spread),
        l: Math.max(.0001, Math.min(open, close) * (1 - spread)),
        c: close
      });
      last = close;
    }
    m.candles[id] = candles.slice(-MAX_CANDLES);
    return m.candles[id];
  }
  function fallbackCandleSVG(candles, compact, large) {
    candles = (candles || []).filter(validCandle).slice(large ? -72 : compact ? -26 : -44);
    if (candles.length < 2) return '<div class="v20-empty-small">Tape warming up.</div>';
    var W = large ? 780 : compact ? 180 : 320;
    var H = large ? 240 : compact ? 52 : 92;
    var pad = 5;
    var min = Math.min.apply(null, candles.map(function (c) { return n(c.l); }));
    var max = Math.max.apply(null, candles.map(function (c) { return n(c.h); }));
    var range = (max - min) || Math.abs(max) || 1;
    var slot = (W - pad * 2) / candles.length;
    var cw = Math.max(1.2, Math.min(slot * .62, large ? 10 : 7));
    function y(v) { return H - pad - ((v - min) / range) * (H - pad * 2); }
    var bars = candles.map(function (c, i) {
      var x = pad + i * slot + slot / 2;
      var up = n(c.c) >= n(c.o);
      var color = up ? "#42bd6b" : "#d65b5b";
      var yo = y(n(c.o)), yc = y(n(c.c));
      var top = Math.min(yo, yc), body = Math.max(1, Math.abs(yc - yo));
      return '<line x1="' + x.toFixed(1) + '" y1="' + y(n(c.h)).toFixed(1) + '" x2="' + x.toFixed(1) + '" y2="' + y(n(c.l)).toFixed(1) + '" stroke="' + color + '" stroke-width="' + (large ? "1.4" : "1") + '"/>' +
        '<rect x="' + (x - cw / 2).toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + cw.toFixed(1) + '" height="' + body.toFixed(1) + '" rx="' + (large ? "1.2" : ".6") + '" fill="' + color + '"/>';
    }).join("");
    return '<svg class="v18-candle-chart v20-candle-chart ' + (large ? "v20-candle-large" : "") + '" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">' + bars + '</svg>';
  }
  function candleSVG(id, compact, large) {
    var max = large ? 72 : compact ? 30 : 52;
    var candles = ensureCandleDepth(id, large ? 48 : compact ? 18 : 34).slice(-max);
    if (window.LedgerChartsV1874 && typeof window.LedgerChartsV1874.candleSVG === "function") {
      var svg = window.LedgerChartsV1874.candleSVG(candles, {
        className:"v18-candle-chart v20-candle-chart",
        w: large ? 780 : compact ? 190 : 330,
        h: large ? 240 : compact ? 52 : 92,
        max:max,
        empty:"<div class=\"v20-empty-small\">Tape warming up.</div>"
      });
      if (/<svg/i.test(svg || "")) return svg;
    }
    return fallbackCandleSVG(candles, compact, large);
  }
  function appendCandle(id, open, close, move) {
    var m = store();
    var stock = stockById(id) || { volatility:.1, beta:1 };
    var vol = Math.max(.0025, Math.abs(move) * .6 + n(stock.volatility, .1) * .010 * Math.random());
    var high = Math.max(open, close) * (1 + vol);
    var low = Math.max(.0001, Math.min(open, close) * (1 - vol * (.75 + Math.random() * .5)));
    m.candles[id] = (seedCandles(id) || []).concat([{ o:open, h:high, l:low, c:close }]).filter(validCandle).slice(-MAX_CANDLES);
  }
  function trendPattern(id) {
    var m = store();
    var hist = ((m.history && m.history[id]) || []).map(Number).filter(function (x) { return x > 0; }).slice(-22);
    if (hist.length < 4) return "Fresh tape";
    var last = hist[hist.length - 1];
    var prev = hist[hist.length - 2];
    var first = hist[0];
    var high = Math.max.apply(null, hist);
    var low = Math.min.apply(null, hist);
    var one = prev ? (last - prev) / prev : 0;
    var run = first ? (last - first) / first : 0;
    var offHigh = high ? (high - last) / high : 0;
    var fromLow = low ? (last - low) / low : 0;
    if (offHigh > .18 && one > .008) return "Rebound watch";
    if (fromLow > .30 && one < -.006) return "Pullback risk";
    if (run > .22 && one > 0) return "Momentum run";
    if (run < -.18 && one < 0) return "Falling knife";
    if (Math.abs(one) > .045) return one > 0 ? "Breakout spike" : "Sharp selloff";
    if (hist.slice(-4).every(function (v, i, a) { return !i || v >= a[i - 1]; })) return "Green stair-step";
    if (hist.slice(-4).every(function (v, i, a) { return !i || v <= a[i - 1]; })) return "Red stair-step";
    return one >= 0 ? "Green tick" : "Red tick";
  }
  function chooseCycle(prev) {
    var r = Math.random();
    if (prev === "crash") return r < .52 ? "recovery" : "bear";
    if (prev === "bubble") return r < .24 ? "crash" : r < .58 ? "bull" : "normal";
    if (prev === "recession") return r < .48 ? "recovery" : r < .76 ? "bear" : "normal";
    if (prev === "bear") return r < .30 ? "recovery" : r < .55 ? "normal" : "bear";
    if (r < .06) return "crash";
    if (r < .16) return "bear";
    if (r < .24) return "recession";
    if (r < .39) return "recovery";
    if (r < .56) return "bull";
    if (r < .64) return "bubble";
    return "normal";
  }
  function randomNormalish() {
    return (Math.random() + Math.random() + Math.random()) / 3 - .5;
  }
  function sectorDrift(stock) {
    var m = store();
    var cur = n(m.sectorTrends[stock.sector]);
    var drift = cur * .985 + randomNormalish() * .020;
    if (stock.sector === "Crypto") drift += randomNormalish() * .030;
    if (stock.sector === "Speculative") drift += randomNormalish() * .025;
    m.sectorTrends[stock.sector] = clamp(drift, -.18, .18);
    return m.sectorTrends[stock.sector];
  }
  function eventBias(stock) {
    var m = store();
    var bias = 0;
    var rating = m.analystRatings && m.analystRatings[stock.id];
    if (rating) bias += (n(rating.score, 50) - 50) / 50000;
    var recent = (m.news || []).slice(0, 10).filter(function (row) {
      return row.symbol === stock.id || row.sector === stock.sector;
    });
    recent.forEach(function (row) { bias += n(row.impact) * .035; });
    return clamp(bias, -.012, .012);
  }
  function liveMove(stock, oldPrice) {
    var m = store();
    var live = m.liveV18 || {};
    var cycle = CYCLES[m.cycle] || CYCLES.normal;
    var beta = Math.max(.15, n(stock.beta, 1));
    var vol = Math.max(.02, n(stock.volatility, .10));
    var hist = ((m.history && m.history[stock.id]) || [oldPrice]).map(Number).filter(function (x) { return x > 0; }).slice(-36);
    var high = Math.max.apply(null, hist);
    var low = Math.min.apply(null, hist);
    var trend = n(live.trends && live.trends[stock.id]);
    var pressure = 0;
    if (high && oldPrice < high * (1 - .050 * beta)) pressure += .45;
    if (low && oldPrice > low * (1 + .070 * beta)) pressure -= .34;
    var sector = sectorDrift(stock);
    var move = cycle.bias * beta + sector * .012 + trend * .004 + pressure * .0045 + eventBias(stock);
    move += randomNormalish() * vol * .040 * beta;
    var shockChance = .014 + vol * .050;
    if (stock.sector === "Crypto") shockChance += .045;
    if (stock.sector === "Speculative") shockChance += .030;
    if (stock.style === "meme") shockChance += .065;
    if (Math.random() < shockChance) {
      var direction = Math.random() < .5 ? -1 : 1;
      if (m.cycle === "bubble" && (stock.sector === "Crypto" || stock.sector === "Speculative")) direction = Math.random() < .38 ? -1 : 1;
      if (m.cycle === "crash") direction = Math.random() < .76 ? -1 : 1;
      var magnitude = (.006 + Math.random() * vol * (stock.sector === "Crypto" ? .18 : stock.style === "meme" ? .16 : .09)) * Math.max(.7, beta);
      move += direction * magnitude;
      if (Math.random() < .35) addMarketNews(stock, direction > 0 ? "sudden bid" : "air pocket", direction * magnitude, "live");
    }
    if (stock.style === "meme" && Math.random() < .018) move += (Math.random() < .55 ? 1 : -1) * (.08 + Math.random() * .22);
    var capDown = stock.sector === "Crypto" || stock.style === "meme" ? -.34 : stock.sector === "Speculative" ? -.22 : -.12;
    var capUp = stock.sector === "Crypto" || stock.style === "meme" ? .40 : stock.sector === "Speculative" ? .28 : .16;
    move = clamp(move, capDown, capUp);
    live.trends[stock.id] = clamp(trend * .86 + move * 10 + randomNormalish() * .10, -1, 1);
    return move;
  }
  function updatePrice(stock, move, reason) {
    var m = store();
    var id = stock.id;
    var old = getPrice(id);
    var floor = stock.sector === "Crypto" ? (id === "BTC-USD" ? 250 : .0001) : .01;
    var next = Math.max(floor, old * (1 + move));
    next = next >= 10 ? Math.round(next * 100) / 100 : Math.round(next * 10000) / 10000;
    m.previousPrices[id] = old;
    m.prices[id] = next;
    m.history[id] = (Array.isArray(m.history[id]) ? m.history[id] : [old]).concat([next]).filter(function (x) { return n(x) > 0; }).slice(-MAX_HISTORY);
    appendCandle(id, old, next, move);
    m.volumes[id] = Math.max(1000, Math.round(n(m.volumes[id], seedVolume(stock)) * (.92 + Math.random() * .22) * (1 + Math.min(2, Math.abs(move) * 8))));
    if (reason && Math.abs(move) > .06) addMarketNews(stock, reason, move, "move");
    return { old:old, next:next, move:move };
  }
  function tickLiveStockMarket() {
    var m = store();
    if (!m || !m.liveV18 || !m.liveV18.enabled) return false;
    if (!isInvestmentsOpen()) {
      if (window.__ledgerStockEngineV20Timer) {
        try { clearInterval(window.__ledgerStockEngineV20Timer); } catch (e) {}
        window.__ledgerStockEngineV20Timer = null;
      }
      return false;
    }
    var before = stockValue();
    STOCKS.forEach(function (stock) {
      updatePrice(stock, liveMove(stock, getPrice(stock.id)), "live tape");
      var meta = getLivePositionMeta(stock.id, false);
      if (meta) meta.highPrice = Math.max(n(meta.highPrice, getPrice(stock.id)), getPrice(stock.id));
    });
    checkStopLosses();
    m.liveV18.ticks = Math.max(0, n(m.liveV18.ticks)) + 1;
    if (m.liveV18.ticks % 7 === 0) maybeGenerateTapeEvent();
    if (m.liveV18.ticks % 19 === 0) generateAnalystRating(null, true);
    m.lastMarketGain = Math.round(stockValue() - before);
    snapshotPortfolio("live");
    updateLiveDom();
    if (m.liveV18.ticks % 10 === 0) save();
    return true;
  }
  function processStockMarketYear(options) {
    options = options || {};
    var s = ensureShape();
    var m = s.finance.stocksV18;
    var ageKey = "y" + round(s.age || 0);
    if (options.mode === "ageup" && m.lastProcessedAgeV20 === ageKey) return false;
    if (options.mode === "ageup") m.lastProcessedAgeV20 = ageKey;
    var before = stockValue();
    var cycleKey = options.cycle || (advanceCycleState(m).key);
    if (options.cycle) {
      m.cycleV21 = seedCycleState(cycleKey);
      m.cycle = cycleKey;
    }
    var cycle = CYCLES[cycleKey] || CYCLES.normal;
    var sectorMoves = {};
    Object.keys(SECTOR_COLORS).forEach(function (sector) {
      sectorMoves[sector] = cycle.yearly + n(m.sectorTrends[sector]) * .22 + randomNormalish() * cycle.vol;
    });
    var dividends = 0;
    STOCKS.forEach(function (stock) {
      if (options.skipLegacy && LEGACY_IDS[stock.id]) return;
      var base = n(sectorMoves[stock.sector], cycle.yearly);
      var move = base * Math.max(.25, n(stock.beta, 1)) + randomNormalish() * cycle.vol;
      if (cycleKey === "crash" && (stock.sector === "Crypto" || stock.sector === "Speculative")) move -= Math.random() * .22;
      if (cycleKey === "bubble" && (stock.sector === "Crypto" || stock.sector === "Speculative" || stock.style === "momentum")) move += Math.random() * .24;
      move = clamp(move, stock.sector === "Crypto" ? -.75 : -.55, stock.sector === "Crypto" ? 1.10 : .75);
      updatePrice(stock, move, cycle.label);
    });
    (m.holdings || []).forEach(function (h) {
      var stock = stockById(h.id);
      if (!stock || !stock.dividend) return;
      if (options.skipLegacy && LEGACY_IDS[stock.id]) return;
      dividends += n(h.shares) * getPrice(h.id) * n(stock.dividend);
    });
    (m.annualPositionsV21 || []).forEach(function (p) {
      var stock = stockById(p.id);
      if (!stock) return;
      var beforeMark = Math.max(.0001, n(p.markPrice, n(p.entryPrice, getPrice(p.id))));
      var nextMark = getPrice(p.id);
      p.markPrice = Math.max(.0001, nextMark);
      p.lastAnnualReturn = beforeMark ? (p.markPrice - beforeMark) / beforeMark : 0;
      if (stock.dividend) {
        var annualDiv = n(p.shares) * p.markPrice * n(stock.dividend);
        p.dividends = n(p.dividends) + annualDiv;
        dividends += annualDiv;
      }
    });
    dividends = Math.max(0, round(dividends));
    if (dividends) {
      s.finance.brokerage = brokerageCash() + dividends;
      m.lastDividends = round(n(m.lastDividends) + dividends);
      m.dividendHistory.unshift({ age:round(s.age), amount:dividends, note:cycle.label, time:Date.now() });
      m.dividendHistory = m.dividendHistory.slice(0, MAX_LOG);
      try { s.finance.incomeSources = s.finance.incomeSources || {}; s.finance.incomeSources.dividends = n(s.finance.incomeSources.dividends) + dividends; } catch (e) {}
    }
    var after = stockValue();
    m.lastMarketGain = round(after - before);
    s.market.index = Math.max(100, round(n(s.market.index, 1000) * (1 + cycle.yearly)));
    s.market.mood = cycle.label;
    s.market.lastReturn = cycle.yearly;
    s.market.sectors = Object.keys(sectorMoves).map(function (sector) { return { name:sector, change:sectorMoves[sector] }; }).slice(0, 10);
    generateEarnings(true);
    generateSectorNews(true);
    snapshotPortfolio("year");
    if (before > 0 || dividends > 0) {
      log("Market year: " + cycle.label + ". Stocks " + signedMoney(m.lastMarketGain) + (dividends ? ", dividends " + money(dividends) + "." : "."), { brokerage:dividends });
    }
    return true;
  }
  function addTrade(row) {
    var m = store();
    row = Object.assign({ age:round((stateNow() || {}).age), time:Date.now() }, row || {});
    m.tradeHistory.unshift(row);
    m.tradeHistory = m.tradeHistory.slice(0, MAX_LOG);
  }
  function addMarketNews(stock, title, impact, type) {
    var m = store();
    if (!stock) return;
    var row = {
      age:round((stateNow() || {}).age),
      time:Date.now(),
      type:type || "news",
      symbol:stock.id,
      sector:stock.sector,
      title:stock.id + " " + title,
      impact:clamp(impact, -.5, .5),
      note:newsNote(stock, impact)
    };
    m.news.unshift(row);
    m.news = m.news.slice(0, MAX_LOG);
  }
  function newsNote(stock, impact) {
    if (impact > .08) return stock.name + " caught a strong bid as traders chased upside.";
    if (impact > .02) return stock.name + " improved after a constructive market update.";
    if (impact < -.08) return stock.name + " dropped after a sharp risk-off headline.";
    if (impact < -.02) return stock.name + " traded lower as investors trimmed exposure.";
    return stock.name + " stayed mostly range-bound.";
  }
  function maybeGenerateTapeEvent() {
    if (Math.random() > .55) return;
    var stock = STOCKS[Math.floor(Math.random() * STOCKS.length)];
    var dir = Math.random() < .52 ? 1 : -1;
    var mag = (.012 + Math.random() * n(stock.volatility, .1) * .12) * dir;
    var titles = dir > 0 ? ["earnings whisper", "upgrade chatter", "sector rotation", "breakout volume"] : ["downgrade chatter", "margin worry", "profit taking", "failed breakout"];
    addMarketNews(stock, titles[Math.floor(Math.random() * titles.length)], mag, "tape");
  }
  function generateSectorNews(silent) {
    var m = store();
    var sectors = Object.keys(SECTOR_COLORS);
    var sector = sectors[Math.floor(Math.random() * sectors.length)];
    var impact = randomNormalish() * (sector === "Crypto" || sector === "Speculative" ? .18 : .09);
    m.sectorTrends[sector] = clamp(n(m.sectorTrends[sector]) + impact * .45, -.20, .20);
    m.news.unshift({
      age:round((stateNow() || {}).age),
      time:Date.now(),
      type:"sector",
      sector:sector,
      title:sector + " sector " + (impact >= 0 ? "tailwind" : "pressure"),
      impact:impact,
      note:impact >= 0 ? "Money is rotating into " + sector + "." : "Money is rotating out of " + sector + "."
    });
    m.news = m.news.slice(0, MAX_LOG);
    if (!silent) { save(); refreshHub(); }
  }
  function generateEarnings(silent) {
    var m = store();
    var stock = STOCKS[Math.floor(Math.random() * STOCKS.length)];
    var surprise = randomNormalish() * (stock.sector === "Crypto" ? .25 : n(stock.volatility, .12));
    var revenue = 50 + Math.round((Math.random() - .5) * 18 + surprise * 80);
    var eps = 50 + Math.round((Math.random() - .5) * 22 + surprise * 95);
    var move = clamp(surprise * .28, -.18, .24);
    updatePrice(stock, move, "earnings");
    var row = {
      age:round((stateNow() || {}).age),
      time:Date.now(),
      symbol:stock.id,
      name:stock.name,
      surprise:surprise,
      revenue:clamp(revenue, 0, 100),
      eps:clamp(eps, 0, 100),
      move:move,
      title:stock.id + (surprise >= 0 ? " beats" : " misses")
    };
    m.earnings.unshift(row);
    m.earnings = m.earnings.slice(0, MAX_LOG);
    m.news.unshift({
      age:row.age,
      time:row.time,
      type:"earnings",
      symbol:stock.id,
      sector:stock.sector,
      title:row.title,
      impact:move,
      note:stock.name + " reported " + (surprise >= 0 ? "better" : "weaker") + " numbers and moved " + pct(move) + "."
    });
    m.news = m.news.slice(0, MAX_LOG);
    if (!silent) { save(); refreshHub(); }
    return row;
  }
  function generateAnalystRating(symbol, silent) {
    var m = store();
    var stock = symbol ? stockById(symbol) : STOCKS[Math.floor(Math.random() * STOCKS.length)];
    if (!stock) return null;
    var old = m.analystRatings[stock.id] || defaultRating(stock);
    var score = clamp(n(old.score, 50) + Math.round((Math.random() - .47) * 18), 5, 95);
    var row = { score:score, label:ratingLabel(score), age:round((stateNow() || {}).age), note:stock.id + " desk rating moved from " + old.label + " to " + ratingLabel(score) + "." };
    m.analystRatings[stock.id] = row;
    var move = clamp((score - n(old.score, 50)) / 420, -.06, .07);
    if (Math.abs(move) > .008) updatePrice(stock, move, "analyst rating");
    m.news.unshift({ age:row.age, time:Date.now(), type:"rating", symbol:stock.id, sector:stock.sector, title:stock.id + " " + row.label, impact:move, note:row.note });
    m.news = m.news.slice(0, MAX_LOG);
    if (!silent) { save(); refreshHub(); }
    return row;
  }
  function generateCompanyAction(symbol) {
    var stock = symbol ? stockById(symbol) : STOCKS[Math.floor(Math.random() * STOCKS.length)];
    if (!stock) return;
    var kind = Math.random() < .5 ? "buyback" : "split";
    var move = kind === "buyback" ? .018 + Math.random() * .055 : -.012 + Math.random() * .040;
    updatePrice(stock, move, kind);
    addMarketNews(stock, kind === "buyback" ? "buyback authorization" : "stock split chatter", move, kind);
    save();
    refreshHub();
  }
  function buyStockAmount(id, amount, options) {
    var s = ensureShape();
    var stock = stockById(id);
    if (!stock) return toast("Stock not found.");
    options = options || {};
    amount = Math.max(0, round(amount));
    if (!amount) return toast("Enter an amount to buy.");
    var source = options.source || "brokerage";
    var fromChecking = 0;
    var fromBrokerage = 0;
    if (source === "checking") {
      fromChecking = pullChecking(amount);
      if (fromChecking < amount) {
        if (fromChecking) s.money += fromChecking;
        return toast("Not enough checking cash for that buy.");
      }
    } else if (source === "auto") {
      fromBrokerage = Math.min(brokerageCash(), amount);
      var shortfall = amount - fromBrokerage;
      if (shortfall > 0) {
        fromChecking = pullChecking(shortfall);
        if (fromChecking < shortfall) {
          s.money += fromChecking;
          return toast("Not enough investment/checking cash for that buy.");
        }
      }
      s.finance.brokerage = brokerageCash() - fromBrokerage;
    } else {
      fromBrokerage = Math.min(brokerageCash(), amount);
      if (fromBrokerage < amount) return toast("Not enough Investment Cash. Fund the account or use Buy from Checking.");
      s.finance.brokerage = brokerageCash() - fromBrokerage;
    }
    var paid = fromBrokerage + fromChecking;
    var price = getPrice(stock.id);
    var shares = paid / price;
    var h = getHolding(stock.id, true);
    var oldCost = n(h.shares) * n(h.avgCost, price);
    h.shares = n(h.shares) + shares;
    h.avgCost = Math.max(.0001, (oldCost + paid) / h.shares);
    h.invested = n(h.shares) * h.avgCost;
    syncLivePositionMeta(stock.id, h);
    s.finance.brokerageOpened = true;
    addTrade({ side:"buy", symbol:stock.id, name:stock.name, amount:paid, shares:shares, price:price, source:source });
    log("Bought " + stock.id + " with " + money(paid) + (source === "checking" ? " from checking." : " of investment cash."), { money:-fromChecking, brokerage:-fromBrokerage });
    save();
    refreshHub();
    return h;
  }
  function sellStockAmount(id, amount, options) {
    var s = ensureShape();
    var stock = stockById(id) || { id:String(id || "").toUpperCase(), name:String(id || "").toUpperCase() };
    var h = getHolding(stock.id, false);
    if (!h || n(h.shares) <= 0) return toast("No shares to sell.");
    options = options || {};
    var price = getPrice(stock.id);
    var shares = 0;
    if (options.shares) shares = Math.min(n(h.shares), Math.max(0, n(amount)));
    else {
      var value = holdingValue(h);
      amount = Math.min(value, Math.max(0, round(amount)));
      shares = Math.min(n(h.shares), amount / price);
    }
    if (!shares) return toast("Enter an amount to sell.");
    var proceeds = Math.round(shares * price);
    var costBasis = shares * n(h.avgCost, price);
    h.shares = Math.max(0, n(h.shares) - shares);
    h.invested = Math.max(0, n(h.shares) * n(h.avgCost, price));
    s.finance.brokerage = brokerageCash() + proceeds;
    var m = s.finance.stocksV18;
    m.realizedGain = round(n(m.realizedGain) + proceeds - costBasis);
    if (h.shares < .000001) {
      m.holdings = m.holdings.filter(function (row) { return row !== h; });
      syncLivePositionMeta(stock.id, null);
    } else {
      syncLivePositionMeta(stock.id, h);
    }
    addTrade({ side:"sell", symbol:stock.id, name:stock.name, amount:proceeds, shares:shares, price:price, gain:Math.round(proceeds - costBasis), source:"brokerage" });
    log("Sold " + stock.id + " for " + money(proceeds) + ". Cash returned to Investment Cash.", { brokerage:proceeds });
    save();
    refreshHub();
    return proceeds;
  }
  function sellAllStocks() {
    var m = store();
    var ids = (m.holdings || []).map(function (h) { return h.id; });
    if (!ids.length) return toast("No stock holdings to sell.");
    ids.forEach(function (id) {
      var h = getHolding(id, false);
      if (h) sellStockAmount(id, holdingValue(h));
    });
  }
  function shortStockAmount(id, amount) {
    var s = ensureShape();
    var stock = stockById(id);
    if (!stock) return toast("Stock not found.");
    amount = Math.max(0, round(amount));
    if (!amount) return toast("Enter an amount to short.");
    var cash = brokerageCash();
    if (cash < amount) return toast("Not enough Investment Cash to post short collateral.");
    var price = getPrice(stock.id);
    var shares = amount / price;
    var p = getShortPosition(stock.id, true);
    var oldOpen = n(p.shares) * n(p.avgPrice, price);
    p.shares = n(p.shares) + shares;
    p.avgPrice = Math.max(.0001, (oldOpen + amount) / p.shares);
    p.collateral = n(p.collateral) + amount;
    p.openedValue = n(p.openedValue) + amount;
    s.finance.brokerage = cash - amount;
    s.finance.brokerageOpened = true;
    addTrade({ side:"short", symbol:stock.id, name:stock.name, amount:amount, shares:shares, price:price, source:"brokerage" });
    log("Shorted " + stock.id + " with " + money(amount) + " collateral.", { brokerage:-amount });
    save();
    refreshHub();
    return p;
  }
  function coverShortAmount(id, amount, options) {
    var s = ensureShape();
    var stock = stockById(id);
    if (!stock) return toast("Stock not found.");
    var p = getShortPosition(stock.id, false);
    if (!p || n(p.shares) <= 0) return toast("No short position to cover.");
    options = options || {};
    var price = getPrice(stock.id);
    var maxCost = shortMarketValue(p);
    var shares = 0;
    if (options.shares) shares = Math.min(n(p.shares), Math.max(0, n(amount)));
    else {
      var coverCost = amount === "all" ? maxCost : Math.min(maxCost, Math.max(0, round(amount)));
      shares = Math.min(n(p.shares), coverCost / price);
    }
    if (!shares) return toast("Enter an amount to cover.");
    var ratio = shares / Math.max(.000001, n(p.shares));
    var cost = shares * price;
    var openValue = shares * n(p.avgPrice, price);
    var released = n(p.collateral) * ratio;
    var gain = openValue - cost;
    var returned = Math.max(0, round(released + gain));
    p.shares = Math.max(0, n(p.shares) - shares);
    p.collateral = Math.max(0, n(p.collateral) - released);
    p.openedValue = Math.max(0, n(p.openedValue) - openValue);
    if (p.shares < .000001 || p.collateral < 1) s.finance.stocksV18.shortPositions = (s.finance.stocksV18.shortPositions || []).filter(function (row) { return row !== p; });
    s.finance.brokerage = brokerageCash() + returned;
    s.finance.stocksV18.realizedGain = round(n(s.finance.stocksV18.realizedGain) + gain);
    addTrade({ side:"cover", symbol:stock.id, name:stock.name, amount:Math.round(cost), shares:shares, price:price, gain:Math.round(gain), source:"brokerage" });
    log("Covered " + stock.id + " short. Collateral returned " + money(returned) + ", P/L " + signedMoney(gain) + ".", { brokerage:returned });
    save();
    refreshHub();
    return returned;
  }
  function getAnnualPosition(id, create) {
    var m = store();
    id = String(id || "").toUpperCase();
    var p = (m.annualPositionsV21 || []).find(function (x) { return String(x.id || "").toUpperCase() === id; });
    if (!p && create) {
      p = { id:id, shares:0, entryPrice:getPrice(id), markPrice:getPrice(id), invested:0, entryAge:round((stateNow() || {}).age || 0), lastAnnualReturn:0, dividends:0 };
      m.annualPositionsV21.push(p);
    }
    return p || null;
  }
  function buyAnnualStockAmount(id, amount) {
    var s = ensureShape();
    var stock = stockById(id);
    if (!stock) return toast("Stock not found.");
    amount = Math.max(0, round(amount));
    if (!amount) return toast("Enter an amount for the annual position.");
    var cash = brokerageCash();
    if (cash < amount) return toast("Not enough Investment Cash for that annual bet.");
    var price = getPrice(stock.id);
    var shares = amount / price;
    var p = getAnnualPosition(stock.id, true);
    var oldCost = n(p.shares) * n(p.entryPrice, price);
    p.shares = n(p.shares) + shares;
    p.entryPrice = Math.max(.0001, (oldCost + amount) / p.shares);
    p.markPrice = Math.max(.0001, n(p.markPrice, price));
    p.invested = n(p.shares) * p.entryPrice;
    p.entryAge = p.entryAge || round(s.age || 0);
    s.finance.brokerage = cash - amount;
    s.finance.brokerageOpened = true;
    addTrade({ side:"annual buy", symbol:stock.id, name:stock.name, amount:amount, shares:shares, price:price, source:"brokerage" });
    log("Opened annual " + stock.id + " position with " + money(amount) + ".", { brokerage:-amount });
    save();
    refreshHub();
    return p;
  }
  function sellAnnualStockAmount(id, amount) {
    var s = ensureShape();
    var stock = stockById(id);
    if (!stock) return toast("Stock not found.");
    var p = getAnnualPosition(stock.id, false);
    if (!p || n(p.shares) <= 0) return toast("No annual position to sell.");
    var value = annualPositionValue(p);
    amount = amount === "all" ? value : Math.min(value, Math.max(0, round(amount)));
    if (!amount) return toast("Enter an amount to sell.");
    var price = Math.max(.0001, n(p.markPrice, getPrice(stock.id)));
    var shares = Math.min(n(p.shares), amount / price);
    var proceeds = Math.round(shares * price);
    var costBasis = shares * n(p.entryPrice, price);
    p.shares = Math.max(0, n(p.shares) - shares);
    p.invested = Math.max(0, n(p.shares) * n(p.entryPrice, price));
    s.finance.brokerage = brokerageCash() + proceeds;
    s.finance.stocksV18.realizedGain = round(n(s.finance.stocksV18.realizedGain) + proceeds - costBasis);
    if (p.shares < .000001) s.finance.stocksV18.annualPositionsV21 = (s.finance.stocksV18.annualPositionsV21 || []).filter(function (row) { return row !== p; });
    addTrade({ side:"annual sell", symbol:stock.id, name:stock.name, amount:proceeds, shares:shares, price:price, gain:Math.round(proceeds - costBasis), source:"brokerage" });
    log("Sold annual " + stock.id + " position for " + money(proceeds) + ".", { brokerage:proceeds });
    save();
    refreshHub();
    return proceeds;
  }
  function addMarketAlert(title, note, symbol, kind) {
    var m = store();
    m.marketAlertsV21.unshift({ time:Date.now(), age:round((stateNow() || {}).age), title:title, note:note, symbol:symbol || "", kind:kind || "info" });
    m.marketAlertsV21 = m.marketAlertsV21.slice(0, MAX_LOG);
  }
  function setStopLoss(id, type, value) {
    var m = store();
    var stock = stockById(id);
    if (!stock) return toast("Stock not found.");
    var h = getHolding(stock.id, false);
    if (!h || n(h.shares) <= 0) return toast("Buy a live position before setting a stop.");
    var meta = getLivePositionMeta(stock.id, true);
    var price = getPrice(stock.id);
    type = type === "trailing" || type === "trailingPercent" ? "trailingPercent" : "fixed";
    value = Math.max(0, n(value));
    if (!value) return toast("Enter a stop value.");
    var rule = { id:stock.id, type:type, active:true, setAt:Date.now(), peakPrice:Math.max(price, n(meta && meta.highPrice, price)) };
    if (type === "fixed") rule.stopPrice = Math.max(.0001, value);
    else rule.trailingPercent = clamp(value > 1 ? value / 100 : value, .01, .90);
    m.stopLossRulesV21[stock.id] = rule;
    addMarketAlert("Stop set for " + stock.id, type === "fixed" ? "Auto-sell at " + priceText(rule.stopPrice) + "." : "Trailing stop at " + pct(rule.trailingPercent) + " below the high.", stock.id, "stop");
    save();
    refreshHub();
    return rule;
  }
  function clearStopLoss(id) {
    var m = store();
    id = String(id || "").toUpperCase();
    if (m.stopLossRulesV21[id]) {
      delete m.stopLossRulesV21[id];
      save();
      refreshHub();
    }
  }
  function stopPriceForRule(rule, price) {
    if (!rule || !rule.active) return 0;
    if (rule.type === "trailingPercent") return Math.max(.0001, n(rule.peakPrice, price) * (1 - clamp(rule.trailingPercent, .01, .90)));
    return Math.max(.0001, n(rule.stopPrice));
  }
  function checkStopLosses() {
    var m = store();
    Object.keys(m.stopLossRulesV21 || {}).forEach(function (id) {
      var rule = m.stopLossRulesV21[id];
      var stock = stockById(id);
      var h = getHolding(id, false);
      if (!stock || !h || n(h.shares) <= 0 || !rule || !rule.active) { delete m.stopLossRulesV21[id]; return; }
      var price = getPrice(id);
      var meta = getLivePositionMeta(id, true);
      if (meta) {
        meta.highPrice = Math.max(n(meta.highPrice, price), price);
        if (rule.type === "trailingPercent") rule.peakPrice = Math.max(n(rule.peakPrice, price), meta.highPrice);
      }
      var stop = stopPriceForRule(rule, price);
      if (price <= stop) {
        delete m.stopLossRulesV21[id];
        var value = holdingValue(h);
        sellStockAmount(id, value, { stop:true });
        addMarketAlert("Stop triggered: " + id, "Sold live position at " + priceText(price) + " after crossing " + priceText(stop) + ".", id, "bad");
      }
    });
  }
  function fundInvestmentCash(amount) {
    var s = ensureShape();
    var available = Math.max(0, round(s.money));
    var amt = amount === "max" ? available : Math.min(available, Math.max(0, round(amount)));
    if (!amt) return toast("No checking cash available to fund investments.");
    s.money = available - amt;
    s.finance.brokerage = brokerageCash() + amt;
    s.finance.brokerageOpened = true;
    log("Moved " + money(amt) + " from checking into Investment Cash.", { money:-amt, brokerage:amt });
    save();
    refreshHub();
  }
  function withdrawInvestmentCash(amount) {
    var s = ensureShape();
    var cash = brokerageCash();
    var amt = amount === "all" ? cash : Math.min(cash, Math.max(0, round(amount)));
    if (!amt) return toast("No Investment Cash to withdraw.");
    s.finance.brokerage = cash - amt;
    s.money = Math.max(0, round(n(s.money) + amt));
    log("Withdrew " + money(amt) + " from Investment Cash to checking.", { money:amt, brokerage:-amt });
    save();
    refreshHub();
  }
  function readAmount(inputId, max) {
    var el = inputId && document.getElementById(inputId);
    var raw = el ? String(el.value || "") : "";
    var val = Math.round(Number(raw.replace(/[^0-9.]/g, "")) || 0);
    if (max != null) val = Math.min(val, Math.max(0, n(max)));
    return Math.max(0, val);
  }
  function readPreciseAmount(inputId, max) {
    var el = inputId && document.getElementById(inputId);
    var raw = el ? String(el.value || "") : "";
    var val = Number(raw.replace(/[^0-9.]/g, "")) || 0;
    if (max != null) val = Math.min(val, Math.max(0, n(max)));
    return Math.max(0, val);
  }
  function clearInput(inputId) {
    var el = inputId && document.getElementById(inputId);
    if (el) el.value = "";
  }
  function portfolioSummary() {
    var s = ensureShape();
    var m = s.finance.stocksV18;
    var stockVal = stockValue();
    var cost = investedCost();
    var annualVal = annualValue();
    var annualBasis = annualCost();
    var unrealized = stockVal - cost;
    var annualUnrealized = annualVal - annualBasis;
    var shortExposure = totalShortExposure();
    var shortOpenGain = totalShortUnrealized();
    var shortEq = totalShortEquity();
    var sectors = {};
    var holdings = (m.holdings || []).map(function (h) {
      var stock = stockById(h.id) || { id:h.id, name:h.id, sector:"Other", style:"unknown" };
      var value = holdingValue(h);
      sectors[stock.sector] = n(sectors[stock.sector]) + value;
      return { id:h.id, stock:stock, shares:n(h.shares), value:value, cost:n(h.shares) * n(h.avgCost), gain:value - n(h.shares) * n(h.avgCost), weight:stockVal ? value / stockVal : 0 };
    }).sort(function (a, b) { return b.value - a.value; });
    var shorts = (m.shortPositions || []).map(function (p) {
      var stock = stockById(p.id) || { id:p.id, name:p.id, sector:"Other", style:"unknown" };
      var exposure = shortMarketValue(p);
      return { id:p.id, stock:stock, shares:n(p.shares), exposure:exposure, collateral:n(p.collateral), gain:shortUnrealized(p), equity:shortEquity(p) };
    }).sort(function (a, b) { return b.exposure - a.exposure; });
    var annuals = (m.annualPositionsV21 || []).map(function (p) {
      var stock = stockById(p.id) || { id:p.id, name:p.id, sector:"Other", style:"unknown" };
      var value = annualPositionValue(p);
      return { id:p.id, stock:stock, shares:n(p.shares), value:value, cost:n(p.invested), gain:value - n(p.invested), lastAnnualReturn:n(p.lastAnnualReturn), dividends:n(p.dividends), years:Math.max(0, round((s.age || 0) - n(p.entryAge, s.age || 0))) };
    }).sort(function (a, b) { return b.value - a.value; });
    var best = holdings.slice().sort(function (a, b) { return b.gain - a.gain; })[0] || null;
    var worst = holdings.slice().sort(function (a, b) { return a.gain - b.gain; })[0] || null;
    var concentration = holdings[0] ? holdings[0].weight : 0;
    var speculative = holdings.reduce(function (sum, row) {
      return sum + ((row.stock.sector === "Crypto" || row.stock.sector === "Speculative" || row.stock.style === "meme") ? row.value : 0);
    }, 0);
    var riskScore = clamp(Math.round(concentration * 42 + (stockVal ? speculative / stockVal : 0) * 36 + (stockVal ? shortExposure / Math.max(1, stockVal) : shortExposure ? .30 : 0) * 20 + Math.max(0, -unrealized / Math.max(1, cost)) * 22 + (m.cycle === "crash" ? 18 : m.cycle === "bear" || m.cycle === "recession" ? 10 : 0)), 0, 100);
    return {
      checking:Math.max(0, round(s.money)),
      investmentCash:brokerageCash(),
      stockValue:stockVal,
      annualValue:annualVal,
      shortExposure:shortExposure,
      shortUnrealized:shortOpenGain,
      shortEquity:shortEq,
      total:brokerageCash() + stockVal + annualVal + shortEq,
      cost:cost,
      unrealized:unrealized,
      annualCost:annualBasis,
      annualUnrealized:annualUnrealized,
      realized:round(n(m.realizedGain)),
      sectors:sectors,
      holdings:holdings,
      annuals:annuals,
      shorts:shorts,
      best:best,
      worst:worst,
      concentration:concentration,
      speculative:speculative,
      riskScore:riskScore,
      riskLabel:riskScore >= 75 ? "Extreme" : riskScore >= 55 ? "High" : riskScore >= 30 ? "Moderate" : "Low"
    };
  }
  function snapshotPortfolio(kind) {
    var m = store();
    var summary = portfolioSummary();
    m.snapshots.unshift({ age:round((stateNow() || {}).age), time:Date.now(), kind:kind || "snapshot", total:summary.total, stocks:summary.stockValue + summary.annualValue, cash:summary.investmentCash, risk:summary.riskScore });
    m.snapshots = m.snapshots.slice(0, 36);
  }
  function getStockDetail(id) {
    var stock = stockById(id);
    if (!stock) return null;
    var h = getHolding(stock.id, false);
    var p = getShortPosition(stock.id, false);
    var annual = getAnnualPosition(stock.id, false);
    var price = getPrice(stock.id);
    var hist = (store().history[stock.id] || [price]).slice(-2);
    var prev = hist.length > 1 ? hist[hist.length - 2] : price;
    var liveSummary = livePositionSummary(stock.id);
    return {
      stock:stock,
      price:price,
      previous:prev,
      change:prev ? (price - prev) / prev : 0,
      holding:h,
      shortPosition:p,
      annualPosition:annual,
      value:h ? holdingValue(h) : 0,
      shortValue:p ? shortMarketValue(p) : 0,
      shortGain:p ? shortUnrealized(p) : 0,
      annualValue:annual ? annualPositionValue(annual) : 0,
      annualGain:annual ? annualPositionValue(annual) - n(annual.invested) : 0,
      liveSummary:liveSummary,
      stopRule:(store().stopLossRulesV21 || {})[stock.id] || null,
      liquidity:n((store().liquidityV21 || {})[stock.id], seedLiquidity(stock)),
      pattern:trendPattern(stock.id),
      rating:(store().analystRatings || {})[stock.id] || defaultRating(stock)
    };
  }
  function selectedStockId() {
    var m = store();
    var id = String(m.selectedStockV20 || "").toUpperCase();
    if (!stockById(id)) id = "VOO";
    m.selectedStockV20 = id;
    return id;
  }
  function selectStock(id) {
    var m = store();
    id = String(id || "").toUpperCase();
    if (!stockById(id)) return;
    m.selectedStockV20 = id;
    seedCandles(id);
    refreshHub();
  }
  function setReturnMode(mode) {
    var m = store();
    m.returnModeV20 = mode === "annual" ? "annual" : "live";
    m.activeStocksModeV21 = m.returnModeV20;
    refreshHub();
  }
  function setSortMode(mode) {
    var m = store();
    m.sortModeV21 = SORT_MODES[mode] ? mode : "default";
    refreshHub();
  }
  function setFilterMode(mode) {
    var m = store();
    m.filterModeV21 = FILTER_MODES[mode] ? mode : "all";
    refreshHub();
  }
  function annualReturnProfile(stock) {
    var m = store();
    var cycle = CYCLES[m.cycle] || CYCLES.normal;
    var beta = Math.max(.25, n(stock.beta, 1));
    var sector = n(m.sectorTrends && m.sectorTrends[stock.sector]);
    var base = cycle.yearly * beta + sector * .22;
    if (stock.style === "defensive" || stock.style === "income") base *= .72;
    if (stock.style === "crypto" || stock.style === "meme") base *= 1.38;
    var spread = Math.max(.04, n(stock.volatility, .1) * 1.35);
    return {
      expected:clamp(base + n(stock.dividend), -.82, 1.35),
      low:clamp(base - spread, -.95, 1.10),
      high:clamp(base + spread * 1.25, -.55, 1.80),
      dividend:n(stock.dividend),
      cycle:cycle
    };
  }
  function stockRiskScore(stock) {
    var m = store();
    var profile = annualReturnProfile(stock);
    var score = Math.round(n(stock.volatility, .1) * 115 + Math.max(0, n(stock.beta, 1) - 1) * 18);
    if (stock.sector === "Crypto" || stock.sector === "Speculative" || stock.style === "meme") score += 22;
    if (m.cycle === "crash" || m.cycle === "bear" || m.cycle === "recession") score += 12;
    if (profile.expected < 0) score += 10;
    if (stock.style === "defensive" || stock.style === "income") score -= 8;
    return clamp(score, 3, 100);
  }
  function stockSignal(stock) {
    var profile = annualReturnProfile(stock);
    var risk = stockRiskScore(stock);
    if (risk >= 78 && profile.expected < .04) return "Hedge";
    if (profile.expected >= .16 && risk < 70) return "Buy";
    if (profile.expected < -.08) return "Sell";
    if (risk > 68) return "Watch";
    if (profile.expected >= .06) return "Hold";
    return "Trim";
  }
  function setTab(tab) {
    var m = store();
    if (tab === "live" || tab === "annual" || tab === "watchlist") {
      m.activeStocksModeV21 = tab === "annual" ? "annual" : "live";
      tab = "stocks";
    }
    if (tab === "news" || tab === "history") tab = "overview";
    if (!TABS.some(function (t) { return t[0] === tab; })) tab = "overview";
    m.activeTabV20 = tab;
    refreshHub();
  }
  function setFilter(raw) {
    var m = store();
    m.searchV20 = String(raw || "").slice(0, 40);
    refreshHub();
  }
  function toggleWatchlist(id) {
    var m = store();
    id = String(id || "").toUpperCase();
    if (!stockById(id)) return;
    if (m.watchlist.indexOf(id) >= 0) m.watchlist = m.watchlist.filter(function (x) { return x !== id; });
    else m.watchlist.push(id);
    save();
    refreshHub();
  }
  function setAccount(type) {
    var m = store();
    var acct = ACCOUNT_TYPES[type];
    if (!acct) return;
    if (type === "margin") return toast("Margin debt is parked for a later pass so net worth stays clean.");
    if (accountEquity() < acct.min) return toast(acct.label + " needs at least " + money(acct.min) + " account equity.");
    m.accounts.active = type;
    log("Switched Investments account view to " + acct.label + ".");
    save();
    refreshHub();
  }
  function resetInvestmentsView() {
    var m = store();
    m.activeTabV20 = "overview";
    m.searchV20 = "";
    if (!m.liveV18 || typeof m.liveV18 !== "object") m.liveV18 = { enabled:false, ticks:0, trends:{} };
    m.liveV18.enabled = false;
    m.liveV18.userPausedV18 = true;
    stopLiveMarket();
    save();
    refreshHub();
  }
  function renderTabs(m) {
    return '<div class="v20-tabs">' + TABS.map(function (t) {
      return '<button class="v20-tab ' + (m.activeTabV20 === t[0] ? "active" : "") + '" onclick="event.preventDefault();event.stopPropagation();setStockTabV20(\'' + esc(t[0]) + '\')">' + esc(t[1]) + '</button>';
    }).join("") + '</div>';
  }
  function metric(label, value, note, cls) {
    return '<div class="v20-metric ' + esc(cls || "") + '"><span>' + esc(label) + '</span><b>' + esc(value) + '</b><em>' + esc(note || "") + '</em></div>';
  }
  function action(label, cls, code, disabled) {
    return '<button class="money-btn ' + esc(cls || "") + '" onclick="event.preventDefault();event.stopPropagation();' + code + '" ' + (disabled ? "disabled" : "") + '>' + esc(label) + '</button>';
  }
  function customInput(id, placeholder) {
    return '<input class="v20-money-input v17-money-input" id="' + esc(id) + '" inputmode="numeric" autocomplete="off" placeholder="' + esc(placeholder || "$ custom amount") + '">';
  }
  function renderHero() {
    var s = ensureShape();
    var m = s.finance.stocksV18;
    var summary = portfolioSummary();
    var cycle = CYCLES[m.cycle] || CYCLES.normal;
    var live = !!(m.liveV18 && m.liveV18.enabled);
    var firm = personalFirmSummary();
    return '<section class="v20-hero">' +
      '<div><div class="v20-kicker">INVESTMENTS 2.0 STOCK ENGINE</div><h2>Investments</h2><p>Live stocks, personal holdings, outside managers, and your existing personal firm now sit in one trading desk.</p><div class="v20-hero-actions">' +
      action("Fund $10K", "green", "fundInvestmentCash(10000)", summary.checking < 10000) +
      action("Fund $100K", "green", "fundInvestmentCash(100000)", summary.checking < 100000) +
      action("Fund Max", "green", "fundInvestmentCash('max')", summary.checking <= 0) +
      action(live ? "Stop Live" : "Live Market", "blue", "toggleLiveMarketV18()", false) +
      action("Sim Market Year", "blue", "processStockMarketYearV20()", false) +
      action("Sell All Stocks", "", "sellAllStocksV18()", summary.stockValue <= 0) +
      action("Withdraw Cash", "", "withdrawInvestmentCash('all')", summary.investmentCash <= 0) +
      '</div></div><div class="v20-hero-ledger">' +
      metric("Checking", money(summary.checking), "Spendable outside brokerage.", "good") +
      metric("Investment Cash", money(summary.investmentCash), "Uninvested brokerage cash.", "gold") +
      metric("Stocks", money(summary.stockValue), "Live market value.", summary.unrealized >= 0 ? "good" : "bad") +
      metric("Unrealized", signedMoney(summary.unrealized), "Realized " + money(summary.realized) + ".", summary.unrealized >= 0 ? "good" : "bad") +
      metric("Market", cycle.label, live ? "Live: ON, tick " + round(m.liveV18.ticks) : cycle.desc, live ? "blue" : "") +
      metric("Personal Firm", money(firm.total), firm.status + " / staff Lv " + firm.skill.toFixed(1), firm.total ? "good" : "") +
      '</div></section>';
  }
  function renderAllocation(summary) {
    var rows = Object.keys(summary.sectors).map(function (sector) {
      return { label:sector, value:summary.sectors[sector], color:SECTOR_COLORS[sector] || "#d8b16e" };
    }).filter(function (row) { return row.value > 0; });
    if (!rows.length && summary.investmentCash > 0) rows.push({ label:"Cash", value:summary.investmentCash, color:"#d8b16e" });
    if (!rows.length) return '<div class="v20-empty-small">No sector allocation yet.</div>';
    if (window.LedgerChartsV1874 && typeof window.LedgerChartsV1874.donutSVG === "function") {
      return '<div class="v1838-chart-tile">' + window.LedgerChartsV1874.donutSVG(rows, { centerLabel:"MIX", wrapClass:"v1838-donut-wrap v20-donut-wrap", svgClass:"biz1862-donut", legendClass:"biz1861-legend", empty:"" }) + '</div>';
    }
    return rows.map(function (row) { return '<span>' + esc(row.label) + ' ' + money(row.value) + '</span>'; }).join("");
  }
  function renderOverview() {
    var m = store();
    var summary = portfolioSummary();
    var cycle = CYCLES[m.cycle] || CYCLES.normal;
    var recentTrades = (m.tradeHistory || []).slice(0, 5);
    var recentNews = (m.news || []).slice(0, 4);
    var alerts = (m.marketAlertsV21 || []).slice(0, 4);
    return '<div class="v20-grid-main"><section class="v20-panel"><div class="v20-panel-head"><div><span>ASSET SUMMARY</span><b>Total Investment Desk</b></div><strong>' + money(summary.total) + '</strong></div><div class="v20-stat-grid">' +
      metric("Investment Cash", money(summary.investmentCash), "Ready to deploy.", "gold") +
      metric("Stock Value", money(summary.stockValue), "Cost " + money(summary.cost) + ".", "blue") +
      metric("Annual Positions", money(summary.annualValue), "P/L " + signedMoney(summary.annualUnrealized) + ".", summary.annualUnrealized >= 0 ? "good" : "bad") +
      metric("Unrealized", signedMoney(summary.unrealized), "Open gain/loss.", summary.unrealized >= 0 ? "good" : "bad") +
      metric("Realized", signedMoney(summary.realized), "Locked trading result.", summary.realized >= 0 ? "good" : "bad") +
      metric("Risk", summary.riskLabel, summary.riskScore + "/100", summary.riskScore > 55 ? "bad" : "good") +
      metric("Cycle", cycle.label, cycle.desc, "blue") +
      '</div></section><section class="v20-panel"><div class="v20-panel-head"><div><span>ALLOCATION</span><b>Sector Mix</b></div></div>' + renderAllocation(summary) + '</section></div>' +
      '<div class="v20-grid-main"><section class="v20-panel"><div class="v20-panel-head"><div><span>HOLDINGS</span><b>Portfolio Readout</b></div></div>' + renderHoldings(summary.holdings) + '</section>' +
      '<section class="v20-panel"><div class="v20-panel-head"><div><span>RECENT TAPE</span><b>Trades, Alerts, News</b></div><div class="v20-inline-actions">' + action("Market News", "blue", "generateSectorNewsV20()", false) + action("Earnings", "gold", "generateEarningsV20()", false) + '</div></div><div class="v20-feed">' +
      (recentTrades.length ? recentTrades.map(tradeRow).join("") : '<div class="v20-empty-small">No trades yet.</div>') +
      (alerts.length ? alerts.map(alertRow).join("") : '') +
      (recentNews.length ? recentNews.map(newsRow).join("") : '') +
      '</div></section></div>';
  }
  function renderHoldings(holdings) {
    if (!holdings.length) return '<div class="v20-empty">No stocks yet. Fund Investment Cash, then use Live Trading to buy a position.</div>';
    return '<div class="v20-holdings">' + holdings.map(function (row) {
      return '<div class="v18-holding-row v20-holding-row"><div><b>' + esc(row.id) + '</b><span>' + esc(row.stock.name) + ' / ' + row.shares.toFixed(row.shares >= 10 ? 2 : 4) + ' sh</span><em data-stock18-holding-chart="' + esc(row.id) + '">' + candleSVG(row.id, true) + '</em></div><div><b>' + money(row.value) + '</b><span class="' + (row.gain >= 0 ? "up" : "down") + '">' + signedMoney(row.gain) + ' / ' + Math.round(row.weight * 100) + '%</span></div></div>';
    }).join("") + '</div>';
  }
  function filteredStocks(limitToWatchlist) {
    var m = store();
    var q = String(m.searchV20 || "").toLowerCase().trim();
    var list = STOCKS.slice();
    var filter = m.filterModeV21 || "all";
    if (limitToWatchlist || filter === "watchlist") list = list.filter(function (stock) { return m.watchlist.indexOf(stock.id) >= 0; });
    if (filter === "owned") list = list.filter(function (stock) { return !!getHolding(stock.id, false) || !!getAnnualPosition(stock.id, false) || !!getShortPosition(stock.id, false); });
    if (filter === "dividend") list = list.filter(function (stock) { return n(stock.dividend) > 0; });
    if (filter === "tech") list = list.filter(function (stock) { return stock.sector === "Tech"; });
    if (filter === "finance") list = list.filter(function (stock) { return stock.sector === "Finance"; });
    if (filter === "crypto") list = list.filter(function (stock) { return stock.sector === "Crypto"; });
    if (filter === "defensive") list = list.filter(function (stock) { return stock.style === "defensive" || stock.style === "income" || n(stock.beta, 1) < .8; });
    if (q) {
      list = list.filter(function (stock) {
        return stock.id.toLowerCase().indexOf(q) >= 0 || stock.name.toLowerCase().indexOf(q) >= 0 || stock.sector.toLowerCase().indexOf(q) >= 0 || stock.style.toLowerCase().indexOf(q) >= 0;
      });
    }
    var sort = m.sortModeV21 || "default";
    list.sort(function (a, b) {
      var da = getStockDetail(a.id), db = getStockDetail(b.id);
      if (sort === "liveBest") return db.change - da.change;
      if (sort === "liveWorst") return da.change - db.change;
      if (sort === "annualBest") return annualReturnProfile(b).expected - annualReturnProfile(a).expected;
      if (sort === "annualWorst") return annualReturnProfile(a).expected - annualReturnProfile(b).expected;
      if (sort === "dividend") return n(b.dividend) - n(a.dividend);
      if (sort === "volatilityHigh") return n(b.volatility) - n(a.volatility);
      if (sort === "volatilityLow") return n(a.volatility) - n(b.volatility);
      if (sort === "riskHigh") return stockRiskScore(b) - stockRiskScore(a);
      return 0;
    });
    return list;
  }
  function tickerPill(stock, active) {
    var detail = getStockDetail(stock.id);
    var h = detail.holding;
    var p = detail.shortPosition;
    var owned = h ? holdingValue(h) : 0;
    var shortVal = p ? shortMarketValue(p) : 0;
    var changeCls = detail.change >= 0 ? "up" : "down";
    return '<button class="v20-ticker-pill ' + (active ? "active" : "") + '" data-v20-ticker-id="' + esc(stock.id) + '" onclick="event.preventDefault();event.stopPropagation();selectStockV20(\'' + esc(stock.id) + '\')">' +
      '<b>' + esc(stock.id) + '</b><span data-v20-ticker-price>' + priceText(detail.price) + '</span><em data-v20-ticker-change class="' + changeCls + '">' + pct(detail.change) + '</em>' +
      '<small data-v20-ticker-owned>' + (owned ? "Own " + money(owned) : shortVal ? "Short " + money(shortVal) : esc(stock.sector)) + '</small></button>';
  }
  function renderTickerRail(list, selectedId, totalMatches) {
    var visible = list.slice(0, 28);
    if (!visible.some(function (s) { return s.id === selectedId; })) {
      var selected = stockById(selectedId);
      if (selected) visible.unshift(selected);
    }
    return '<div class="v20-ticker-rail" data-v20-ticker-rail>' + (visible.length ? visible.map(function (stock) {
      return tickerPill(stock, stock.id === selectedId);
    }).join("") : '<div class="v20-empty-small">No tickers match this search.</div>') + '</div>' +
      (totalMatches > visible.length ? '<div class="v20-empty-small">Showing ' + visible.length + ' / ' + totalMatches + ' matches. Search narrows the rest of the market.</div>' : '');
  }
  function renderReturnSwitch(mode) {
    return '<div class="v20-return-switch">' +
      '<button class="' + (mode === "live" ? "active" : "") + '" onclick="event.preventDefault();event.stopPropagation();setStockReturnModeV20(\'live\')"><b>Live Trading</b><span>Second-by-second tape</span></button>' +
      '<button class="' + (mode === "annual" ? "active" : "") + '" onclick="event.preventDefault();event.stopPropagation();setStockReturnModeV20(\'annual\')"><b>Annual Trading</b><span>Changes once per year</span></button>' +
      '</div>';
  }
  function renderPickerControls(mode) {
    var m = store();
    var filter = m.filterModeV21 || "all";
    var sort = m.sortModeV21 || "default";
    var filterButtons = Object.keys(FILTER_MODES).map(function (key) {
      return '<button class="v20-chip-filter ' + (filter === key ? "active" : "") + '" onclick="event.preventDefault();event.stopPropagation();setStockFilterModeV21(\'' + esc(key) + '\')">' + esc(FILTER_MODES[key]) + '</button>';
    }).join("");
    var sortOptions = Object.keys(SORT_MODES).map(function (key) {
      return '<option value="' + esc(key) + '" ' + (sort === key ? "selected" : "") + '>' + esc(SORT_MODES[key]) + '</option>';
    }).join("");
    return '<div class="v20-picker-controls"><div class="v20-filter-chips">' + filterButtons + '</div><div class="v20-sort-search"><select onchange="setStockSortV21(this.value)">' + sortOptions + '</select>' + customInput("v20-stock-filter", mode === "annual" ? "Search annual picks" : "Search live stocks") + action("Search", "blue", "setStockFilterV20((document.getElementById('v20-stock-filter')||{}).value||'')", false) + action("Clear", "", "setStockFilterV20('')", !m.searchV20) + '</div></div>';
  }
  function renderFocusStats(stock, detail, summary, mode) {
    var profile = annualReturnProfile(stock);
    var live = detail.liveSummary || {};
    var annual = detail.annualPosition;
    var annualValueNow = detail.annualValue || 0;
    var annualGain = detail.annualGain || 0;
    return '<div class="v20-focus-stats">' +
      metric(mode === "annual" ? "Expected Annual" : "Live Return", mode === "annual" ? pct(profile.expected) : signedMoney(live.gain || 0), mode === "annual" ? profile.cycle.label : pct(live.pct || 0) + " / held " + esc(live.held || "0s"), (mode === "annual" ? profile.expected : live.gain) >= 0 ? "good" : "bad") +
      metric(mode === "annual" ? "Annual Position" : "Live Position", money(mode === "annual" ? annualValueNow : detail.value), mode === "annual" ? (annual ? signedMoney(annualGain) + " total" : "No annual bet") : (detail.holding ? n(detail.holding.shares).toFixed(n(detail.holding.shares) >= 10 ? 2 : 4) + " shares" : "No live position"), (mode === "annual" ? annualValueNow : detail.value) ? "good" : "") +
      metric("Market Cycle", cycleLabel(), (CYCLES[store().cycle] || CYCLES.normal).desc, "blue") +
      metric("Signal", stockSignal(stock), "Risk " + stockRiskScore(stock) + "/100", stockRiskScore(stock) >= 70 ? "bad" : "good") +
      '</div>';
  }
  function renderLiveFocus(stock, detail, summary, inputId) {
    var watched = store().watchlist.indexOf(stock.id) >= 0;
    var stopId = inputId + "-stop";
    var stop = detail.stopRule;
    var stopText = stop ? (stop.type === "trailingPercent" ? "Trailing " + pct(stop.trailingPercent) + " / stop " + priceText(stopPriceForRule(stop, detail.price)) : "Fixed stop " + priceText(stop.stopPrice)) : "No stop set";
    return '<div class="v20-focus-copy"><span>' + esc(stock.sector) + ' / ' + esc(stock.style) + '</span><p>' + esc(stock.desc) + '</p></div>' +
      '<div class="v20-position-strip"><span>Entry <b data-v20-live-entry>' + priceText(detail.liveSummary.entryPrice || detail.price) + '</b></span><span>Current <b data-v20-live-current>' + money(detail.liveSummary.value || 0) + '</b></span><span>P/L <b data-v20-live-pl class="' + ((detail.liveSummary.gain || 0) >= 0 ? "up" : "down") + '">' + signedMoney(detail.liveSummary.gain || 0) + '</b></span><span>Stop <b data-v20-stop-text>' + esc(stopText) + '</b></span></div>' +
      '<div class="v20-trade-box"><div class="v20-trade-input">' + customInput(inputId, "$ amount") + '</div><div class="v20-action-group"><b>Buy</b><div class="v20-trade-actions">' +
      action("Buy", "green", "buyCustomStockV18('" + esc(stock.id) + "','" + esc(inputId) + "')", summary.investmentCash <= 0) +
      action("Buy Max", "green", "buyStockV18('" + esc(stock.id) + "','all')", summary.investmentCash <= 0) +
      action("Buy Checking", "blue", "buyStockFromCheckingV20('" + esc(stock.id) + "','custom','" + esc(inputId) + "')", summary.checking <= 0) +
      '</div></div><div class="v20-action-group"><b>Sell</b><div class="v20-trade-actions">' +
      action("Sell", "", "sellCustomStockV18('" + esc(stock.id) + "','" + esc(inputId) + "')", detail.value <= 0) +
      action("Sell All", "", "sellStockV18('" + esc(stock.id) + "','all')", detail.value <= 0) +
      action(watched ? "Unwatch" : "Watch", "gold", "toggleStockWatchV20('" + esc(stock.id) + "')", false) +
      '</div></div><div class="v20-action-group"><b>Protection</b><div class="v20-stop-row">' + customInput(stopId, "stop price or trailing %") +
      action("Fixed Stop", "blue", "setStopLossV21('" + esc(stock.id) + "','fixed',readStockInputV21('" + esc(stopId) + "'))", detail.value <= 0) +
      action("Trail %", "blue", "setStopLossV21('" + esc(stock.id) + "','trailing',readStockInputV21('" + esc(stopId) + "'))", detail.value <= 0) +
      action("Clear Stop", "", "clearStopLossV21('" + esc(stock.id) + "')", !stop) +
      '</div></div><div class="v20-action-group"><b>Advanced</b><div class="v20-trade-actions">' +
      action("Short", "bad", "shortCustomStockV20('" + esc(stock.id) + "','" + esc(inputId) + "')", summary.investmentCash <= 0) +
      action("Cover", "blue", "coverCustomShortV20('" + esc(stock.id) + "','" + esc(inputId) + "')", detail.shortValue <= 0) +
      action("Cover All", "blue", "coverStockV20('" + esc(stock.id) + "','all')", detail.shortValue <= 0) +
      '</div></div></div>';
  }
  function renderAnnualFocus(stock, detail, summary, inputId) {
    var profile = annualReturnProfile(stock);
    var annual = detail.annualPosition;
    var years = annual ? Math.max(0, round((stateNow() || {}).age - n(annual.entryAge, (stateNow() || {}).age))) : 0;
    return '<div class="v20-annual-band">' +
      metric("Annual Range", pct(profile.low) + " to " + pct(profile.high), "Expected " + pct(profile.expected), profile.expected >= 0 ? "good" : "bad") +
      metric("Dividend Yield", (profile.dividend * 100).toFixed(1) + "%", "Paid during market years.", profile.dividend ? "good" : "") +
      metric("Cycle", profile.cycle.label, profile.cycle.desc, "blue") +
      metric("One-Year Risk", stock.volatility >= .35 ? "Wild" : stock.volatility >= .18 ? "High" : "Normal", "Beta " + n(stock.beta, 1).toFixed(2), stock.volatility >= .25 ? "bad" : "good") +
      '</div><div class="v20-focus-copy"><span>ANNUAL TRADING</span><p>Annual bets stay frozen between years. They update on age-up or a manual market-year simulation, then you decide whether to hold, hedge, or sell.</p></div>' +
      '<div class="v20-position-strip"><span>Annual Value <b>' + money(detail.annualValue || 0) + '</b></span><span>Total P/L <b class="' + ((detail.annualGain || 0) >= 0 ? "up" : "down") + '">' + signedMoney(detail.annualGain || 0) + '</b></span><span>Last Year <b class="' + (annual && n(annual.lastAnnualReturn) >= 0 ? "up" : "down") + '">' + pct(annual ? annual.lastAnnualReturn : 0) + '</b></span><span>Held <b>' + years + 'y</b></span></div>' +
      '<div class="v20-trade-box"><div class="v20-trade-input">' + customInput(inputId, "$ annual amount") + '</div><div class="v20-trade-actions">' +
      action("Buy Annual", "green", "buyAnnualStockV21('" + esc(stock.id) + "','custom','" + esc(inputId) + "')", summary.investmentCash <= 0) +
      action("Buy Max", "green", "buyAnnualStockV21('" + esc(stock.id) + "','all')", summary.investmentCash <= 0) +
      action("Sell Annual", "", "sellAnnualStockV21('" + esc(stock.id) + "','custom','" + esc(inputId) + "')", detail.annualValue <= 0) +
      action("Sell All", "", "sellAnnualStockV21('" + esc(stock.id) + "','all')", detail.annualValue <= 0) +
      action("Run Market Year", "blue", "processStockMarketYearV20()", false) +
      action("Generate Earnings", "gold", "generateEarningsV20()", false) +
      '</div></div>';
  }
  function renderFocusDesk(stock, mode, list, totalMatches, limitToWatchlist) {
    var detail = getStockDetail(stock.id);
    var summary = portfolioSummary();
    var inputId = "v20-focus-amt-" + stock.id.replace(/[^a-z0-9]/gi, "-").toLowerCase();
    var annual = detail.annualPosition;
    var displayPrice = mode === "annual" && annual ? n(annual.markPrice, detail.price) : detail.price;
    var displayChange = mode === "annual" && annual ? n(annual.lastAnnualReturn) : detail.change;
    var changeCls = displayChange >= 0 ? "up" : "down";
    var profile = annualReturnProfile(stock);
    return '<section class="v20-panel v20-live-panel"><div class="v20-panel-head"><div><span>STOCKS</span><b>' + (limitToWatchlist ? "Watchlist Desk" : "Trading Desk") + '</b></div><strong data-v20-cycle-label>' + esc(cycleLabel()) + '</strong></div>' +
      '<div class="v20-live-status ' + (store().liveV18.enabled ? "running" : "") + '" data-stock18-live-panel>' + esc(liveStatusText()) + '</div>' +
      renderReturnSwitch(mode) +
      renderPickerControls(mode) +
      '<div class="v20-focus-desk" data-v20-focus-desk data-v20-focus-id="' + esc(stock.id) + '">' +
      '<div class="v20-focus-chart-panel"><div class="v20-focus-head"><div class="v20-stock-id"><i>' + esc(stock.icon || stock.id.slice(0, 3)) + '</i><div><div class="v18-ticker" data-v20-focus-symbol>' + esc(stock.id) + '</div><div class="v18-stock-name">' + esc(stock.name) + '</div></div></div><div class="v20-focus-price"><b data-v20-focus-price>' + priceText(displayPrice) + '</b><span data-v20-focus-change class="' + changeCls + '">' + pct(displayChange) + '</span></div></div>' +
      '<div class="v20-focus-chart" data-v20-focus-chart data-stock18-chart="' + esc(stock.id) + '">' + candleSVG(stock.id, false, true) + '</div>' +
      '<div class="v20-focus-meta"><span>Pattern <b data-v20-focus-pattern>' + esc(detail.pattern) + '</b></span><span>Annual model <b data-v20-focus-annual>' + pct(profile.expected) + '</b></span><span>Volume <b data-v20-focus-volume>' + money(store().volumes[stock.id] || 0) + '</b></span></div>' +
      '</div><div class="v20-focus-side">' + renderFocusStats(stock, detail, summary, mode) + (mode === "annual" ? renderAnnualFocus(stock, detail, summary, inputId) : renderLiveFocus(stock, detail, summary, inputId)) + '</div></div>' +
      renderTickerRail(list, stock.id, totalMatches) +
      '</section>';
  }
  function renderLiveTrading(limitToWatchlist, forcedMode) {
    var m = store();
    var list = filteredStocks(limitToWatchlist);
    var totalMatches = list.length;
    var selected = stockById(selectedStockId()) || STOCKS[0];
    if (list.length && !list.some(function (stock) { return stock.id === selected.id; })) selected = list[0];
    m.selectedStockV20 = selected.id;
    return renderFocusDesk(selected, forcedMode || m.activeStocksModeV21 || m.returnModeV20 || "live", list, totalMatches, limitToWatchlist);
  }
  function stockCard(stock) {
    var detail = getStockDetail(stock.id);
    var m = store();
    var h = detail.holding;
    var owned = h ? holdingValue(h) : 0;
    var inputId = "v20-amt-" + stock.id.replace(/[^a-z0-9]/gi, "-").toLowerCase();
    var watched = m.watchlist.indexOf(stock.id) >= 0;
    var rating = detail.rating || defaultRating(stock);
    return '<div class="v18-stock-card v20-stock-card" data-stock18-id="' + esc(stock.id) + '" data-v20-stock-card="' + esc(stock.id) + '">' +
      '<div class="v18-stock-top"><div class="v20-stock-id"><i>' + esc(stock.icon || stock.id.slice(0, 3)) + '</i><div><div class="v18-ticker">' + esc(stock.id) + '</div><div class="v18-stock-name">' + esc(stock.name) + '</div></div></div><div class="v18-price"><b data-v20-price>' + priceText(detail.price) + '</b><span data-v20-change class="' + (detail.change >= 0 ? "up" : "down") + '">' + pct(detail.change) + '</span></div></div>' +
      '<div class="v18-candle-wrap v20-candle-wrap" data-stock18-chart="' + esc(stock.id) + '">' + candleSVG(stock.id, false) + '</div>' +
      '<div class="v18-pattern"><b>Pattern</b><span data-stock18-pattern>' + esc(detail.pattern) + '</span></div>' +
      '<div class="v18-stock-note">' + esc(stock.sector) + " / " + esc(stock.style) + " / " + esc(stock.desc) + '</div>' +
      '<div class="v18-chip-row v20-chip-row"><span class="money-chip">Yield ' + (n(stock.dividend) * 100).toFixed(1) + '%</span><span class="money-chip">Rating ' + esc(rating.label) + '</span><span data-stock18-owned class="money-chip ' + (owned ? "good" : "") + '">Owned ' + money(owned) + '</span></div>' +
      '<div class="v18-actions v20-card-actions">' +
      action("Buy $1K", "green", "buyStockV18('" + esc(stock.id) + "',1000)", brokerageCash() < 1000) +
      action("Buy $10K", "green", "buyStockV18('" + esc(stock.id) + "',10000)", brokerageCash() < 10000) +
      action("Buy Max", "green", "buyStockV18('" + esc(stock.id) + "','all')", brokerageCash() <= 0) +
      action("Sell $1K", "", "sellStockV18('" + esc(stock.id) + "',1000)", owned < 1000) +
      action("Sell All", "", "sellStockV18('" + esc(stock.id) + "','all')", owned <= 0) +
      action(watched ? "Unwatch" : "Watch", "blue", "toggleStockWatchV20('" + esc(stock.id) + "')", false) +
      '</div><div class="v18-input-row v20-input-row">' + customInput(inputId, "$ custom amount") +
      action("Buy", "green", "buyCustomStockV18('" + esc(stock.id) + "','" + esc(inputId) + "')", brokerageCash() <= 0) +
      action("Buy Checking", "blue", "buyStockFromCheckingV20('" + esc(stock.id) + "','custom','" + esc(inputId) + "')", liquidCash(false) <= 0) +
      action("Sell", "", "sellCustomStockV18('" + esc(stock.id) + "','" + esc(inputId) + "')", owned <= 0) +
      '</div></div>';
  }
  function renderWatchlist() {
    var m = store();
    if (!m.watchlist.length) {
      return '<section class="v20-panel"><div class="v20-panel-head"><div><span>WATCHLIST</span><b>No tracked stocks yet</b></div></div><div class="v20-empty">Use the Watch button on Live Trading cards to build a focused tape.</div></section>' + renderLiveTrading(true);
    }
    return renderLiveTrading(true);
  }
  function renderAnnualReturns() {
    return renderLiveTrading(false, "annual");
  }
  function alertRow(row) {
    var cls = row && row.kind === "bad" ? "bad" : "good";
    return '<div class="v20-feed-row ' + cls + '"><b>' + esc((row && row.title) || "Market alert") + '</b><span>' + esc((row && row.note) || "") + '</span><em>' + esc((row && row.symbol) || "alert") + '</em></div>';
  }
  function newsRow(row) {
    return '<div class="v20-feed-row ' + (n(row.impact) >= 0 ? "good" : "bad") + '"><b>' + esc(row.title || "Market note") + '</b><span>' + esc(row.note || "") + '</span><em>' + esc(row.symbol || row.sector || "market") + ' / ' + pct(row.impact || 0) + '</em></div>';
  }
  function tradeRow(row) {
    var side = String(row.side || "").toLowerCase();
    var cls = side === "buy" ? "good" : side === "short" ? "bad" : (n(row.gain) >= 0 ? "good" : "bad");
    var note = side === "sell" || side === "cover" ? "Gain " + signedMoney(row.gain || 0) : (side === "short" ? "Short " : "Shares ") + n(row.shares).toFixed(4);
    return '<div class="v20-feed-row ' + cls + '"><b>' + esc(side.toUpperCase()) + ' ' + esc(row.symbol || "") + '</b><span>' + esc(row.name || "") + ' / ' + money(row.amount || 0) + ' at ' + priceText(row.price || 0) + '</span><em>' + note + '</em></div>';
  }
  function renderNews() {
    var m = store();
    var earnings = (m.earnings || []).slice(0, 8);
    var dividends = (m.dividendHistory || []).slice(0, 6);
    return '<section class="v20-panel"><div class="v20-panel-head"><div><span>NEWS TAPE</span><b>Market Events</b></div><div class="v20-inline-actions">' + action("Sector News", "blue", "generateSectorNewsV20()", false) + action("Analyst Rating", "gold", "generateAnalystRatingV20()", false) + action("Company Action", "blue", "generateCompanyActionV20()", false) + action("Earnings", "green", "generateEarningsV20()", false) + '</div></div><div class="v20-feed">' + ((m.news || []).length ? m.news.map(newsRow).join("") : '<div class="v20-empty">No market news yet. Generate a news event or let the live tape run.</div>') + '</div></section>' +
      '<div class="v20-grid-main"><section class="v20-panel"><div class="v20-panel-head"><div><span>EARNINGS</span><b>Company Reports</b></div></div><div class="v20-feed">' + (earnings.length ? earnings.map(function (row) {
        return '<div class="v20-feed-row ' + (n(row.move) >= 0 ? "good" : "bad") + '"><b>' + esc(row.title) + '</b><span>Revenue score ' + round(row.revenue) + ' / EPS score ' + round(row.eps) + '</span><em>' + pct(row.move) + '</em></div>';
      }).join("") : '<div class="v20-empty-small">Earnings reports appear after market years or manual earnings events.</div>') + '</div></section>' +
      '<section class="v20-panel"><div class="v20-panel-head"><div><span>DIVIDENDS</span><b>Income History</b></div><strong>' + money(m.lastDividends || 0) + '</strong></div><div class="v20-feed">' + (dividends.length ? dividends.map(function (row) {
        return '<div class="v20-feed-row good"><b>' + money(row.amount) + '</b><span>' + esc(row.note || "Dividend income") + '</span><em>Age ' + esc(row.age) + '</em></div>';
      }).join("") : '<div class="v20-empty-small">Dividend income appears after market years.</div>') + '</div></section></div>';
  }
  function renderEarnings() {
    var m = store();
    return '<section class="v20-panel"><div class="v20-panel-head"><div><span>EARNINGS</span><b>Company Reports</b></div>' + action("Run Earnings", "green", "generateEarningsV20()", false) + '</div><div class="v20-feed">' + ((m.earnings || []).length ? m.earnings.map(function (row) {
      return '<div class="v20-feed-row ' + (n(row.move) >= 0 ? "good" : "bad") + '"><b>' + esc(row.title) + '</b><span>Revenue score ' + round(row.revenue) + ' / EPS score ' + round(row.eps) + '</span><em>' + pct(row.move) + '</em></div>';
    }).join("") : '<div class="v20-empty">No earnings reports yet.</div>') + '</div></section>';
  }
  function renderDividends() {
    var m = store();
    var rows = (m.dividendHistory || []).slice(0, 20);
    var incomeStocks = STOCKS.filter(function (s) { return n(s.dividend) > 0; }).sort(function (a, b) { return b.dividend - a.dividend; }).slice(0, 12);
    return '<div class="v20-grid-main"><section class="v20-panel"><div class="v20-panel-head"><div><span>DIVIDENDS</span><b>Income History</b></div><strong>' + money(m.lastDividends || 0) + '</strong></div><div class="v20-feed">' + (rows.length ? rows.map(function (row) {
      return '<div class="v20-feed-row good"><b>' + money(row.amount) + '</b><span>' + esc(row.note || "Dividend income") + '</span><em>Age ' + esc(row.age) + '</em></div>';
    }).join("") : '<div class="v20-empty">Dividend income appears here after market years.</div>') + '</div></section><section class="v20-panel"><div class="v20-panel-head"><div><span>YIELD WATCH</span><b>Higher Yield Names</b></div></div><div class="v20-mini-list">' + incomeStocks.map(function (s) {
      return '<button onclick="event.preventDefault();event.stopPropagation();setStockTabV20(\'live\');setStockFilterV20(\'' + esc(s.id) + '\')"><b>' + esc(s.id) + '</b><span>' + esc(s.name) + '</span><em>' + (s.dividend * 100).toFixed(1) + '%</em></button>';
    }).join("") + '</div></section></div>';
  }
  function renderRisk() {
    var summary = portfolioSummary();
    var causes = [];
    if (summary.concentration > .35) causes.push("Largest holding is " + Math.round(summary.concentration * 100) + "% of stocks.");
    if (summary.stockValue && summary.speculative / summary.stockValue > .25) causes.push("Speculative/crypto exposure is " + Math.round(summary.speculative / summary.stockValue * 100) + "%.");
    if (summary.shortExposure > 0) causes.push("Open shorts have " + money(summary.shortExposure) + " exposure and " + signedMoney(summary.shortUnrealized) + " unrealized P/L.");
    if (summary.unrealized < 0) causes.push("Open losses are " + money(Math.abs(summary.unrealized)) + ".");
    if (!causes.length) causes.push("Diversification is currently reasonable.");
    return '<section class="v20-panel"><div class="v20-panel-head"><div><span>RISK DESK</span><b>' + esc(summary.riskLabel) + ' Risk</b></div><strong>' + summary.riskScore + '/100</strong></div><div class="v20-stat-grid">' +
      metric("Concentration", Math.round(summary.concentration * 100) + "%", summary.holdings[0] ? summary.holdings[0].id : "No holdings", summary.concentration > .35 ? "bad" : "good") +
      metric("Speculative", money(summary.speculative), "Crypto, meme, high beta.", summary.stockValue && summary.speculative / summary.stockValue > .25 ? "bad" : "good") +
      metric("Short Exposure", money(summary.shortExposure), "Collateral equity " + money(summary.shortEquity), summary.shortExposure ? "bad" : "good") +
      metric("Open P/L", signedMoney(summary.unrealized), "Unrealized gain/loss.", summary.unrealized >= 0 ? "good" : "bad") +
      metric("Cash Buffer", money(summary.investmentCash), "Investment Cash available.", summary.investmentCash > 0 ? "good" : "") +
      '</div><div class="v20-risk-list">' + causes.map(function (c) { return '<div>' + esc(c) + '</div>'; }).join("") + '</div></section>';
  }
  function renderAccounts() {
    var m = store();
    var equity = accountEquity();
    return '<section class="v20-panel"><div class="v20-panel-head"><div><span>ACCOUNTS</span><b>Brokerage Account Type</b></div><strong>' + money(equity) + '</strong></div><div class="v20-account-grid">' + Object.keys(ACCOUNT_TYPES).map(function (key) {
      var acct = ACCOUNT_TYPES[key];
      var active = m.accounts.active === key;
      var locked = key === "margin" || equity < acct.min;
      return '<div class="v20-account-card ' + (active ? "active" : "") + '"><div><span>' + esc(acct.risk) + '</span><b>' + esc(acct.label) + '</b><em>Minimum ' + money(acct.min) + '</em></div><p>' + esc(acct.note) + '</p><ul>' + acct.effects.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join("") + '</ul>' + action(active ? "Active" : "Use Account", active ? "green" : "gold", "setStockAccountV20('" + esc(key) + "')", active || locked) + '</div>';
    }).join("") + '</div></section>';
  }
  function personalFirmSummary() {
    var s = ensureShape();
    var f = s.finance;
    var pf = f.personalFirm || {};
    var staff = pf.staff || {};
    var skill = (n(staff.advisor, 1) + n(staff.analyst, 1) + n(staff.risk, 1) + n(staff.tax, 1)) / 4;
    var cash = Math.max(0, n(pf.cash) + n(f.firmCashV1828) + n(f.personalFirmCash));
    var managed = Math.max(0, n(f.managedPortfolio));
    return {
      active:!!pf.hired || managed > 0 || cash > 0,
      status:pf.hired ? "Built" : "Not built",
      skill:skill,
      managed:managed,
      cash:cash,
      total:managed + cash,
      lastReturn:n(pf.lastReturn),
      lastFee:n(pf.lastFee)
    };
  }
  function renderPersonalFirm() {
    var s = ensureShape();
    var f = s.finance;
    var pf = f.personalFirm || {};
    var staff = pf.staff || {};
    var firm = personalFirmSummary();
    var fund = f.fundTrackV189 || {};
    var canBuild = liquidCash(true) >= 10000000 && n(s.money) >= 250000;
    return '<div class="v20-grid-main"><section class="v20-panel"><div class="v20-panel-head"><div><span>PERSONAL FIRM</span><b>Existing Ledger Firm</b></div><strong>' + money(firm.total) + '</strong></div><p class="v20-copy">This tab preserves the personal firm you already had. Personal stock trading stays separate from managed firm capital.</p><div class="v20-stat-grid">' +
      metric("Status", firm.status, "Build cost $250K, unlock around $10M liquid.", firm.active ? "good" : "") +
      metric("Managed", money(firm.managed), "Your personal firm portfolio.", "gold") +
      metric("Firm Cash", money(firm.cash), "Legacy firm reserve/cash fields.", firm.cash ? "good" : "") +
      metric("Last Return", signedMoney(firm.lastReturn), "Last fee " + money(firm.lastFee), firm.lastReturn >= 0 ? "good" : "bad") +
      metric("Staff Skill", "Lv " + firm.skill.toFixed(1), "Advisor, analyst, risk, tax.", "blue") +
      '</div><div class="v20-firm-staff">' + ["advisor", "analyst", "risk", "tax"].map(function (role) {
        return '<div><b>' + esc(role.charAt(0).toUpperCase() + role.slice(1)) + '</b><span>Lv ' + round(n(staff[role], 1)) + '</span>' + action("Train", "blue", "trainPersonalStaffV16('" + role + "')", !pf.hired) + '</div>';
      }).join("") + '</div><div class="v20-transfer-row">' + customInput("v20-pfirm-in", "$ add to firm") + action(pf.hired ? "Firm Built" : "Build Firm", "green", "hirePersonalFirmBaseV16()", pf.hired || !canBuild) + action("Allocate", "green", "allocatePersonalFirmV20('custom','v20-pfirm-in')", !pf.hired || liquidCash(true) <= 0) + action("Allocate All", "green", "allocatePersonalFirmV20('all')", !pf.hired || liquidCash(true) <= 0) + '</div><div class="v20-transfer-row">' + customInput("v20-pfirm-out", "$ withdraw") + action("Withdraw", "", "withdrawPersonalFirmV20('custom','v20-pfirm-out')", firm.managed <= 0) + action("Withdraw All", "", "withdrawPersonalFirmV20('all')", firm.managed <= 0) + '</div></section>' +
      '<section class="v20-panel"><div class="v20-panel-head"><div><span>FUND TRACK</span><b>Client Capital</b></div><strong>' + money(fund.outsideCapital || 0) + '</strong></div><div class="v20-stat-grid">' +
      metric("Fund", fund.active ? "Active" : "Not launched", "Risk " + esc(fund.risk || "balanced"), fund.active ? "good" : "") +
      metric("Reputation", round(fund.reputation || 0), "Out of 100.", "blue") +
      metric("Last Fees", money(fund.lastFees || 0), "Fees go to checking.", "good") +
      metric("Last Return", signedMoney(fund.lastReturn || 0), "Client capital result.", n(fund.lastReturn) >= 0 ? "good" : "bad") +
      '</div><div class="v20-card-actions">' +
      action(fund.active ? "Fund Active" : "Launch Fund", "gold", "startFundTrackV189()", fund.active || !pf.hired || liquidCash(true) < 2500000) +
      action("Raise Capital", "blue", "raiseFundCapitalV189()", !fund.active) +
      action("Commit $1M Personal", "green", "commitPersonalToFundV189()", !fund.active || n(s.money) < 1000000) +
      action("Defensive", fund.risk === "defensive" ? "blue" : "", "setFundRiskV189('defensive')", !fund.active) +
      action("Balanced", fund.risk === "balanced" ? "blue" : "", "setFundRiskV189('balanced')", !fund.active) +
      action("Aggressive", fund.risk === "aggressive" ? "blue" : "", "setFundRiskV189('aggressive')", !fund.active) +
      '</div></section></div>';
  }
  function renderFunds() {
    var s = ensureShape();
    var f = s.finance;
    var pf = f.personalFirm || {};
    var fund = f.fundTrackV189 || {};
    return '<section class="v20-panel"><div class="v20-panel-head"><div><span>FUNDS</span><b>Client Capital Track</b></div><strong>' + money(fund.outsideCapital || 0) + '</strong></div><p class="v20-copy">This is separate from your personal stock positions and preserves the existing Ledger fund-track save fields.</p><div class="v20-stat-grid">' +
      metric("Fund", fund.active ? "Active" : "Not launched", "Risk " + esc(fund.risk || "balanced"), fund.active ? "good" : "") +
      metric("Reputation", round(fund.reputation || 0), "Out of 100.", "blue") +
      metric("Last Fees", money(fund.lastFees || 0), "Fees go to checking.", "good") +
      metric("Last Return", signedMoney(fund.lastReturn || 0), "Client capital result.", n(fund.lastReturn) >= 0 ? "good" : "bad") +
      '</div><div class="v20-card-actions">' +
      action(fund.active ? "Fund Active" : "Launch Fund", "gold", "startFundTrackV189()", fund.active || !pf.hired || liquidCash(true) < 2500000) +
      action("Raise Capital", "blue", "raiseFundCapitalV189()", !fund.active) +
      action("Commit $1M Personal", "green", "commitPersonalToFundV189()", !fund.active || n(s.money) < 1000000) +
      action("Defensive", fund.risk === "defensive" ? "blue" : "", "setFundRiskV189('defensive')", !fund.active) +
      action("Balanced", fund.risk === "balanced" ? "blue" : "", "setFundRiskV189('balanced')", !fund.active) +
      action("Aggressive", fund.risk === "aggressive" ? "blue" : "", "setFundRiskV189('aggressive')", !fund.active) +
      '</div></section>';
  }
  function allocatePersonalFirm(mode, inputId) {
    if (typeof window.allocatePersonalFirmV17 === "function") return window.allocatePersonalFirmV17(mode, inputId);
    var s = ensureShape();
    var pf = s.finance.personalFirm || {};
    if (!pf.hired) return toast("Build the personal firm first.");
    var max = liquidCash(true);
    var amt = mode === "all" ? max : readAmount(inputId, max);
    if (!amt) return toast("No cash available to allocate.");
    var pulled = 0;
    var take = Math.min(n(s.money), amt); s.money -= take; pulled += take; amt -= take;
    take = Math.min(n(s.savings), amt); s.savings -= take; pulled += take; amt -= take;
    take = Math.min(n(s.finance.superSaver), amt); s.finance.superSaver -= take; pulled += take;
    s.finance.managedPortfolio = round(n(s.finance.managedPortfolio) + pulled);
    log("Allocated " + money(pulled) + " to your personal firm.", { money:-pulled });
    save();
    refreshHub();
  }
  function withdrawPersonalFirm(mode, inputId) {
    if (typeof window.withdrawPersonalFirmV17 === "function") return window.withdrawPersonalFirmV17(mode, inputId);
    var s = ensureShape();
    var bal = Math.max(0, round(s.finance.managedPortfolio));
    var amt = mode === "all" ? bal : readAmount(inputId, bal);
    if (!amt) return toast("No personal-firm capital to withdraw.");
    s.finance.managedPortfolio = bal - amt;
    addChecking(amt);
    log("Withdrew " + money(amt) + " from your personal firm to checking.", { money:amt });
    save();
    refreshHub();
  }
  function renderHistory() {
    var m = store();
    return '<section class="v20-panel"><div class="v20-panel-head"><div><span>HISTORY</span><b>Trading Ledger</b></div></div><div class="v20-feed">' + ((m.tradeHistory || []).length ? m.tradeHistory.map(tradeRow).join("") : '<div class="v20-empty">No trades recorded yet.</div>') + '</div></section>';
  }
  function renderGuide() {
    return '<section class="v20-panel"><div class="v20-panel-head"><div><span>MARKET GUIDE</span><b>Engine Rules</b></div></div><div class="v20-guide-grid">' +
      '<div><b>Live tape</b><span>Every second updates prices, candles, volume, patterns, and owned value without rerendering the whole app.</span></div>' +
      '<div><b>Cycles</b><span>Bull, bear, recovery, bubble, recession, and crash cycles shape yearly moves and sector pressure.</span></div>' +
      '<div><b>Amount trading</b><span>Buy or sell by dollar amount. Sell proceeds return to Investment Cash first.</span></div>' +
      '<div><b>Personal firm</b><span>Your existing firm remains separate from personal stock holdings and keeps its old save data.</span></div>' +
      '</div></section>';
  }
  function renderActiveTab() {
    var tab = (store() || {}).activeTabV20 || "overview";
    if (tab === "stocks" || tab === "live") return renderLiveTrading(false);
    if (tab === "annual") return renderAnnualReturns();
    if (tab === "watchlist") return renderWatchlist();
    if (tab === "news" || tab === "earnings" || tab === "dividends" || tab === "history" || tab === "guide") return renderOverview();
    if (tab === "risk") return renderRisk();
    if (tab === "accounts") return renderAccounts();
    if (tab === "firm") return renderPersonalFirm();
    if (tab === "funds") return renderFunds();
    return renderOverview();
  }
  function isInvestmentsOpen() {
    try {
      var overlay = document.querySelector(".hub-overlay.hub-brokerage,[data-hub-id='brokerage']");
      return !!(overlay && document.body && document.body.contains(overlay));
    } catch (e) {
      return false;
    }
  }
  function scheduleLiveTimer() {
    setTimeout(function () {
      try {
        if (isInvestmentsOpen()) ensureLiveTimer();
      } catch (e) {}
    }, 0);
  }
  function renderInvestmentsFallback(error) {
    try { stopLiveMarket(); } catch (ignore) {}
    var msg = error && (error.message || error) || "Investments render error";
    return '<div class="v20-investments-hub v18-brokerage-hub v17-brokerage-hub">' +
      '<section class="v20-hero"><div><div class="v20-kicker">INVESTMENTS RECOVERED</div><h2>Investments</h2><p>The trading desk hit a recoverable save/render issue, so the game stayed open instead of freezing.</p><div class="v20-hero-actions">' +
      action("Reset View", "blue", "resetInvestmentsViewV20()", false) +
      action("Stop Live", "", "stopLiveMarketV18()", false) +
      '</div></div><div class="v20-hero-ledger">' +
      metric("Checking", money((stateNow() || {}).money || 0), "Spendable cash.", "good") +
      metric("Investment Cash", money(((stateNow() || {}).finance || {}).brokerage || 0), "Brokerage cash.", "gold") +
      metric("Recovery", "Open", "Use Reset View, then reopen Investments.", "blue") +
      '</div></section><section class="v20-panel"><div class="v20-panel-head"><div><span>SAFE FALLBACK</span><b>Render details</b></div></div><div class="v20-empty">' + esc(String(msg).slice(0, 240)) + '</div></section></div>';
  }
  function renderInvestmentsHub() {
    try {
      var m = store();
      scheduleLiveTimer();
      return '<div class="v20-investments-hub v18-brokerage-hub v17-brokerage-hub">' + renderHero() + renderTabs(m) + '<div class="v20-tab-body">' + renderActiveTab() + '</div></div>';
    } catch (e) {
      try { console.error("Investments 2.0 render recovered", e); } catch (ignore) {}
      return renderInvestmentsFallback(e);
    }
  }
  function liveStatusText() {
    var m = store();
    var summary = portfolioSummary();
    var selected = stockById(selectedStockId());
    var signal = selected ? stockSignal(selected) : "Watch";
    if (m.liveV18 && m.liveV18.enabled) {
      return cycleLabel() + " - " + (selected ? selected.id + " signal " + signal + ". " : "") + "Investment Cash " + money(summary.investmentCash) + "; live positions " + money(summary.stockValue) + "; last move " + signedMoney(m.lastMarketGain || 0) + ".";
    }
    return cycleLabel() + " - live tape is paused. Annual positions only update on age-up or market-year simulation.";
  }
  function updateLiveDom() {
    var m = store();
    try {
      STOCKS.forEach(function (stock) {
        var detail = getStockDetail(stock.id);
        var h = detail.holding;
        var p = detail.shortPosition;
        var owned = h ? holdingValue(h) : 0;
        var shortVal = p ? shortMarketValue(p) : 0;
        document.querySelectorAll('[data-stock18-id="' + stock.id + '"]').forEach(function (card) {
          var priceEl = card.querySelector("[data-v20-price]");
          var changeEl = card.querySelector("[data-v20-change]");
          var ownedEl = card.querySelector("[data-stock18-owned]");
          var chartEl = card.querySelector("[data-stock18-chart]");
          var patternEl = card.querySelector("[data-stock18-pattern]");
          if (priceEl) priceEl.textContent = priceText(detail.price);
          if (changeEl) { changeEl.textContent = pct(detail.change); changeEl.className = detail.change >= 0 ? "up" : "down"; }
          if (ownedEl) { ownedEl.textContent = "Owned " + money(owned); ownedEl.className = "money-chip " + (owned ? "good" : ""); }
          if (chartEl) chartEl.innerHTML = candleSVG(stock.id, false);
          if (patternEl) patternEl.textContent = detail.pattern;
        });
        document.querySelectorAll('[data-v20-ticker-id="' + stock.id + '"]').forEach(function (pill) {
          var priceEl = pill.querySelector("[data-v20-ticker-price]");
          var changeEl = pill.querySelector("[data-v20-ticker-change]");
          var ownedEl = pill.querySelector("[data-v20-ticker-owned]");
          if (priceEl) priceEl.textContent = priceText(detail.price);
          if (changeEl) { changeEl.textContent = pct(detail.change); changeEl.className = detail.change >= 0 ? "up" : "down"; }
          if (ownedEl) ownedEl.textContent = owned ? "Own " + money(owned) : shortVal ? "Short " + money(shortVal) : stock.sector;
        });
        document.querySelectorAll('[data-stock18-holding-chart="' + stock.id + '"]').forEach(function (el) { el.innerHTML = candleSVG(stock.id, true); });
      });
      var selected = stockById(selectedStockId());
      if (selected) {
        var selectedDetail = getStockDetail(selected.id);
        var profile = annualReturnProfile(selected);
        var activeMode = (store().activeStocksModeV21 || store().returnModeV20 || "live");
        var annual = selectedDetail.annualPosition;
        var displayPrice = activeMode === "annual" && annual ? n(annual.markPrice, selectedDetail.price) : selectedDetail.price;
        var displayChange = activeMode === "annual" && annual ? n(annual.lastAnnualReturn) : selectedDetail.change;
        var live = selectedDetail.liveSummary || {};
        var stop = selectedDetail.stopRule;
        var stopText = stop ? (stop.type === "trailingPercent" ? "Trailing " + pct(stop.trailingPercent) + " / stop " + priceText(stopPriceForRule(stop, selectedDetail.price)) : "Fixed stop " + priceText(stop.stopPrice)) : "No stop set";
        document.querySelectorAll("[data-v20-focus-symbol]").forEach(function (el) { el.textContent = selected.id; });
        document.querySelectorAll("[data-v20-focus-price]").forEach(function (el) { el.textContent = priceText(displayPrice); });
        document.querySelectorAll("[data-v20-focus-change]").forEach(function (el) {
          el.textContent = pct(displayChange);
          el.className = displayChange >= 0 ? "up" : "down";
        });
        document.querySelectorAll("[data-v20-focus-pattern]").forEach(function (el) { el.textContent = selectedDetail.pattern; });
        document.querySelectorAll("[data-v20-focus-annual]").forEach(function (el) { el.textContent = pct(profile.expected); });
        document.querySelectorAll("[data-v20-focus-volume]").forEach(function (el) { el.textContent = money(m.volumes[selected.id] || 0); });
        if (activeMode !== "annual") document.querySelectorAll("[data-v20-focus-chart]").forEach(function (el) { el.innerHTML = candleSVG(selected.id, false, true); });
        document.querySelectorAll("[data-v20-live-entry]").forEach(function (el) { el.textContent = priceText(live.entryPrice || selectedDetail.price); });
        document.querySelectorAll("[data-v20-live-current]").forEach(function (el) { el.textContent = money(live.value || 0); });
        document.querySelectorAll("[data-v20-live-pl]").forEach(function (el) {
          el.textContent = signedMoney(live.gain || 0);
          el.className = (live.gain || 0) >= 0 ? "up" : "down";
        });
        document.querySelectorAll("[data-v20-stop-text]").forEach(function (el) { el.textContent = stopText; });
      }
      document.querySelectorAll("[data-stock18-live]").forEach(function (el) {
        el.textContent = m.liveV18.enabled ? "Live: ON" : "Live: OFF";
        el.className = m.liveV18.enabled ? "up" : "";
      });
      document.querySelectorAll("[data-v20-cycle-label]").forEach(function (el) { el.textContent = cycleLabel(); });
      document.querySelectorAll("[data-stock18-live-panel]").forEach(function (el) {
        el.textContent = liveStatusText();
        el.className = "v20-live-status " + (m.liveV18.enabled ? "running" : "");
      });
      var summary = portfolioSummary();
      document.querySelectorAll("[data-ledger-money='checking']").forEach(function (el) { el.textContent = money(summary.checking); });
      document.querySelectorAll("[data-ledger-money='brokerage-total']").forEach(function (el) { el.textContent = money(summary.total); });
      document.querySelectorAll("[data-ledger-money='brokerage-cash']").forEach(function (el) { el.textContent = money(summary.investmentCash); });
      document.querySelectorAll("[data-ledger-money='stock-value']").forEach(function (el) { el.textContent = money(summary.stockValue); });
      var topCash = document.querySelector(".topbar .cash");
      if (topCash) topCash.textContent = money(summary.checking);
    } catch (e) {}
  }
  function ensureLiveTimer() {
    var m = store();
    if (!m || !m.liveV18 || !m.liveV18.enabled) return;
    if (!isInvestmentsOpen()) return;
    if (window.__ledgerLiveMarketTimer18) {
      try { clearInterval(window.__ledgerLiveMarketTimer18); } catch (e) {}
      window.__ledgerLiveMarketTimer18 = null;
    }
    if (!window.__ledgerStockEngineV20Timer) window.__ledgerStockEngineV20Timer = setInterval(tickLiveStockMarket, TICK_MS);
  }
  function stopLiveMarket() {
    if (window.__ledgerStockEngineV20Timer) {
      clearInterval(window.__ledgerStockEngineV20Timer);
      window.__ledgerStockEngineV20Timer = null;
    }
    if (window.__ledgerLiveMarketTimer18) {
      try { clearInterval(window.__ledgerLiveMarketTimer18); } catch (e) {}
      window.__ledgerLiveMarketTimer18 = null;
    }
    var m = store();
    if (m && m.liveV18) {
      m.liveV18.enabled = false;
      m.liveV18.userPausedV18 = true;
    }
    updateLiveDom();
  }
  function toggleLiveMarket() {
    var m = store();
    if (!m.liveV18 || typeof m.liveV18 !== "object") m.liveV18 = { enabled:true, ticks:0, trends:{} };
    m.liveV18.enabled = !m.liveV18.enabled;
    m.liveV18.userPausedV18 = !m.liveV18.enabled;
    if (m.liveV18.enabled) {
      ensureLiveTimer();
      if (isInvestmentsOpen()) tickLiveStockMarket();
    } else {
      stopLiveMarket();
    }
    save();
    refreshHub();
  }
  function refreshHub() {
    updateLiveDom();
    try {
      var body = document.querySelector(".v16-hub-body") || document.querySelector(".v11-hub-body,.v10-hub-body,.v9-hub-body");
      var overlay = document.querySelector(".hub-overlay");
      var hub = overlay && overlay.dataset ? overlay.dataset.hubId : "";
      if (body && (!hub || hub === "brokerage" || (overlay && /hub-brokerage/.test(overlay.className || "")))) {
        body.innerHTML = renderInvestmentsHub();
        try { if (window.decorateMoneyInputsV1838) window.decorateMoneyInputsV1838(); } catch (e) {}
        try { if (window.applyLedgerEmojiFallbackV1875) window.applyLedgerEmojiFallbackV1875(); } catch (e2) {}
      }
    } catch (e3) {}
  }
  function wrapAgeUp() {
    if (window.__ledgerStocksEngineV20AgeWrapped) return;
    var prev = window.ageUp || (typeof ageUp === "function" ? ageUp : null);
    if (typeof prev !== "function") return;
    window.__ledgerStocksEngineV20AgeWrapped = true;
    var wrapped = function () {
      var s = stateNow();
      var beforeAge = s && s.age;
      var out = prev.apply(this, arguments);
      try {
        var after = stateNow();
        if (after && after.age !== beforeAge) {
          processStockMarketYear({ mode:"ageup", skipLegacy:true });
          save();
        }
      } catch (e) { try { console.error("Investments 2.0 age-up tick failed", e); } catch (ignore) {} }
      return out;
    };
    window.ageUp = wrapped;
    try { ageUp = wrapped; } catch (e2) {}
  }
  function installRenderOverride() {
    var previousRenderHubContent = window.renderHubContent || (typeof renderHubContent === "function" ? renderHubContent : null);
    window.renderBrokerageHubV11 = function () {
      return renderInvestmentsHub();
    };
    try { renderBrokerageHubV11 = window.renderBrokerageHubV11; } catch (e) {}
    window.renderHubContent = function (hubId) {
      hubId = String(hubId || "").toLowerCase();
      if (hubId === "stocks") hubId = "brokerage";
      if (hubId === "brokerage") return renderInvestmentsHub();
      return previousRenderHubContent ? previousRenderHubContent.apply(this, arguments) : "";
    };
    try { renderHubContent = window.renderHubContent; } catch (e2) {}
  }
  function installStyles() {
    if (!document.head || document.getElementById("ledger-stocks-engine-v20-style")) return;
    var style = document.createElement("style");
    style.id = "ledger-stocks-engine-v20-style";
    style.textContent = [
      ".hub-overlay.hub-brokerage .v16-hub-body,.hub-overlay.hub-brokerage .v11-hub-body,.hub-overlay.hub-brokerage [data-hub-body='brokerage']{flex:1 1 auto!important;min-height:0!important;overflow-x:hidden!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior:contain!important}",
      ".v20-investments-hub{display:grid;gap:12px;padding-bottom:calc(124px + env(safe-area-inset-bottom,0px));box-sizing:border-box}",
      ".v20-hero{display:grid;grid-template-columns:minmax(260px,.82fr) minmax(320px,1.18fr);gap:12px;border:1px solid rgba(216,177,110,.32);border-radius:16px;background:linear-gradient(135deg,rgba(32,29,24,.98),rgba(14,20,20,.98));padding:15px;box-shadow:0 18px 46px rgba(0,0,0,.25)}",
      ".v20-kicker,.v20-panel-head span{font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.16em;font-size:9px;color:#d8b16e}",
      ".v20-hero h2{margin:2px 0 6px;color:#fff3df;font-size:32px;letter-spacing:0}",
      ".v20-hero p,.v20-copy{margin:0;color:#cdbf9e;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.55}",
      ".v20-hero-actions,.v20-inline-actions,.v20-card-actions,.v20-transfer-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px}",
      ".v20-hero-ledger,.v20-stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:9px}",
      ".v20-metric{border:1px solid rgba(255,255,255,.10);border-radius:12px;background:rgba(255,255,255,.045);padding:10px;min-width:0}",
      ".v20-metric span{display:block;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.13em;color:#a89472;font-size:8px}",
      ".v20-metric b{display:block;margin-top:3px;color:#f0cf86;font-family:'JetBrains Mono',monospace;font-size:18px;overflow-wrap:anywhere}",
      ".v20-metric em{display:block;margin-top:4px;color:#b9a98d;font-family:'JetBrains Mono',monospace;font-style:normal;font-size:8.5px;line-height:1.35}",
      ".v20-metric.good b,.v20-feed-row.good em,.v20-feed-row.good b{color:#b9dc8a}.v20-metric.bad b,.v20-feed-row.bad em,.v20-feed-row.bad b{color:#e9927d}.v20-metric.blue b{color:#9fc7d8}.v20-metric.gold b{color:#f0cf86}",
      ".v20-tabs{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:8px;padding:2px 2px 8px}",
      ".v20-tab{border:1px solid rgba(216,177,110,.24);border-radius:999px;background:rgba(255,255,255,.045);color:#d8ccb4;font-family:'JetBrains Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:.08em;padding:9px 10px;cursor:pointer;min-width:0}",
      ".v20-tab.active{background:linear-gradient(135deg,rgba(216,177,110,.32),rgba(126,160,172,.20));border-color:rgba(216,177,110,.66);color:#fff3df}",
      ".v20-tab-body{display:grid;gap:12px}",
      ".v20-grid-main{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:start}",
      ".v20-panel{border:1px solid rgba(216,177,110,.22);border-radius:14px;background:linear-gradient(180deg,rgba(35,31,25,.98),rgba(17,15,12,.98));padding:13px;min-width:0;overflow:hidden}",
      ".v20-panel-head{display:flex;justify-content:space-between;gap:12px;align-items:start;margin-bottom:10px}",
      ".v20-panel-head b{display:block;color:#fff3df;font-family:Fraunces,Georgia,serif;font-size:20px;letter-spacing:0}.v20-panel-head strong{color:#f0cf86;font-family:'JetBrains Mono',monospace;font-size:18px;text-align:right;overflow-wrap:anywhere}",
      ".v20-donut-wrap{margin-top:2px}.v20-empty,.v20-empty-small{border:1px dashed rgba(255,255,255,.12);border-radius:12px;padding:12px;color:#b9a98d;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.5;background:rgba(255,255,255,.03)}.v20-empty-small{padding:8px;font-size:9px}",
      ".v20-holdings,.v20-feed,.v20-mini-list,.v20-risk-list{display:grid;gap:8px}.v20-holding-row{border-radius:11px}",
      ".v20-feed-row{border:1px solid rgba(255,255,255,.10);border-radius:11px;background:rgba(255,255,255,.04);padding:10px;display:grid;gap:3px}.v20-feed-row b{color:#fff3df}.v20-feed-row span,.v20-feed-row em{font-family:'JetBrains Mono',monospace;font-size:9px;line-height:1.4;color:#b9a98d;font-style:normal}",
      ".v20-live-status{border:1px solid rgba(126,160,172,.32);border-radius:12px;background:rgba(126,160,172,.08);color:#cde7ed;font-family:'JetBrains Mono',monospace;font-size:9px;line-height:1.45;padding:9px;margin-bottom:10px}.v20-live-status.running{border-color:rgba(185,220,138,.42);color:#dff1c9;background:rgba(185,220,138,.08)}",
      ".v20-filter-row{display:grid;grid-template-columns:minmax(180px,1fr) auto auto auto;gap:8px;align-items:center;margin-bottom:10px}.v20-filter-row span{font-family:'JetBrains Mono',monospace;color:#a89472;font-size:9px;text-transform:uppercase;letter-spacing:.08em}",
      ".v20-picker-controls{border:1px solid rgba(255,255,255,.09);border-radius:12px;background:rgba(255,255,255,.03);padding:8px;display:grid;gap:8px;margin-bottom:10px}.v20-filter-chips,.v20-sort-search{display:flex;gap:7px;flex-wrap:wrap;align-items:center}.v20-chip-filter{border:1px solid rgba(216,177,110,.22);border-radius:999px;background:rgba(255,255,255,.04);color:#d8ccb4;font-family:'JetBrains Mono',monospace;font-size:8.5px;text-transform:uppercase;letter-spacing:.06em;padding:7px 9px;cursor:pointer}.v20-chip-filter.active{border-color:rgba(216,177,110,.68);background:rgba(216,177,110,.18);color:#fff3df}.v20-sort-search select{border:1px solid rgba(126,160,172,.28);border-radius:10px;background:rgba(0,0,0,.24);color:#dff1c9;padding:10px;font-family:'JetBrains Mono',monospace;font-size:10px}",
      ".v20-money-input{min-width:0;border:1px solid rgba(216,177,110,.24);border-radius:11px;background:rgba(0,0,0,.20);color:#fff3df;padding:10px;font-family:'JetBrains Mono',monospace;font-size:11px;box-sizing:border-box}",
      ".v20-return-switch{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:10px}.v20-return-switch button{border:1px solid rgba(216,177,110,.20);border-radius:12px;background:rgba(255,255,255,.04);padding:10px;text-align:left;cursor:pointer}.v20-return-switch button.active{border-color:rgba(216,177,110,.64);background:linear-gradient(135deg,rgba(216,177,110,.20),rgba(126,160,172,.13))}.v20-return-switch b{display:block;color:#fff3df;font-family:Fraunces,Georgia,serif;font-size:17px;letter-spacing:0}.v20-return-switch span{display:block;color:#b9a98d;font-family:'JetBrains Mono',monospace;font-size:9px;margin-top:2px}",
      ".v20-focus-desk{display:grid;grid-template-columns:minmax(360px,1.35fr) minmax(270px,.65fr);gap:12px;align-items:stretch}.v20-focus-chart-panel,.v20-focus-side{border:1px solid rgba(255,255,255,.10);border-radius:14px;background:rgba(255,255,255,.035);padding:12px;min-width:0}.v20-focus-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px}.v20-focus-price{text-align:right}.v20-focus-price b{display:block;color:#fff3df;font-family:'JetBrains Mono',monospace;font-size:24px}.v20-focus-price span,.up{color:#b9dc8a}.down{color:#e9927d}",
      ".v20-focus-chart{height:276px;border:1px solid rgba(126,160,172,.18);border-radius:13px;background:linear-gradient(180deg,rgba(6,13,14,.95),rgba(2,5,5,.98));padding:10px;box-sizing:border-box;overflow:hidden}.v20-focus-chart svg{width:100%;height:100%;display:block}.v20-candle-large{width:100%;height:100%}.v20-focus-meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}.v20-focus-meta span{border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:8px;color:#a89472;font-family:'JetBrains Mono',monospace;font-size:8px;text-transform:uppercase;letter-spacing:.08em}.v20-focus-meta b{display:block;margin-top:3px;color:#f0cf86;font-size:10px;letter-spacing:0;text-transform:none}",
      ".v20-focus-stats,.v20-annual-band{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:10px}.v20-focus-copy{border:1px solid rgba(255,255,255,.08);border-radius:11px;background:rgba(0,0,0,.14);padding:10px;margin-bottom:10px}.v20-focus-copy span{display:block;color:#d8b16e;font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:.12em;text-transform:uppercase}.v20-focus-copy p{margin:4px 0 0;color:#cdbf9e;font-family:'JetBrains Mono',monospace;font-size:9px;line-height:1.5}",
      ".v20-position-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:0 0 10px}.v20-position-strip span,.v20-action-group>b{display:block;border:1px solid rgba(255,255,255,.08);border-radius:10px;background:rgba(255,255,255,.035);padding:8px;color:#a89472;font-family:'JetBrains Mono',monospace;font-size:8px;text-transform:uppercase;letter-spacing:.08em;min-width:0}.v20-position-strip b{display:block;margin-top:3px;color:#f0cf86;font-size:10px;letter-spacing:0;text-transform:none;overflow-wrap:anywhere}.v20-action-group{display:grid;gap:6px}.v20-action-group>b{background:transparent;border-color:rgba(216,177,110,.18);padding:6px 8px;color:#d8b16e}",
      ".v20-trade-box{display:grid;gap:8px}.v20-trade-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.v20-stop-row{display:grid;grid-template-columns:minmax(110px,1fr) repeat(3,minmax(0,auto));gap:7px;align-items:center}.v20-trade-actions .money-btn,.v20-stop-row .money-btn{min-width:0}.money-btn.bad{border-color:rgba(214,91,91,.45)!important;background:rgba(214,91,91,.12)!important;color:#ffd2c8!important}",
      ".v20-ticker-rail{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:8px;margin-top:12px}.v20-ticker-pill{border:1px solid rgba(255,255,255,.10);border-radius:12px;background:rgba(255,255,255,.035);padding:9px;text-align:left;cursor:pointer;min-width:0}.v20-ticker-pill.active{border-color:rgba(216,177,110,.72);background:rgba(216,177,110,.12);box-shadow:inset 3px 0 0 #d8b16e}.v20-ticker-pill b{display:block;color:#fff3df;font-family:'JetBrains Mono',monospace;font-size:12px}.v20-ticker-pill span{display:block;color:#f0cf86;font-family:'JetBrains Mono',monospace;font-size:10px;margin-top:2px}.v20-ticker-pill em,.v20-ticker-pill small{display:block;font-family:'JetBrains Mono',monospace;font-style:normal;font-size:8.5px;margin-top:2px}.v20-ticker-pill small{color:#a89472;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".v20-stock-list{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(285px,1fr))!important;overflow:visible!important;padding:2px!important}.v20-stock-card{display:grid;gap:9px;flex:auto!important}.v20-stock-id{display:flex;gap:9px;align-items:start}.v20-stock-id i{display:grid;place-items:center;width:36px;height:36px;border:1px solid rgba(216,177,110,.32);border-radius:10px;background:rgba(216,177,110,.10);color:#f0cf86;font-family:'JetBrains Mono',monospace;font-size:10px;font-style:normal;font-weight:900}",
      ".v20-candle-wrap{min-height:88px}.v20-chip-row{display:flex;gap:6px;flex-wrap:wrap}.v20-card-actions{margin-top:0}.v20-input-row{display:grid!important;grid-template-columns:minmax(130px,1fr) auto auto auto!important;gap:7px!important;align-items:center!important}",
      ".v20-account-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px}.v20-account-card{border:1px solid rgba(255,255,255,.11);border-radius:12px;background:rgba(255,255,255,.04);padding:11px;display:grid;gap:8px}.v20-account-card.active{border-color:rgba(185,220,138,.55);background:rgba(185,220,138,.08)}.v20-account-card b{display:block;color:#fff3df}.v20-account-card span,.v20-account-card em,.v20-account-card p,.v20-account-card li{font-family:'JetBrains Mono',monospace;color:#b9a98d;font-size:9px;line-height:1.45}.v20-account-card ul{margin:0 0 0 16px;padding:0}",
      ".v20-firm-staff{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:10px 0}.v20-firm-staff>div,.v20-guide-grid>div,.v20-risk-list>div,.v20-mini-list button{border:1px solid rgba(255,255,255,.10);border-radius:11px;background:rgba(255,255,255,.04);padding:10px;text-align:left}.v20-firm-staff b,.v20-guide-grid b,.v20-mini-list b{display:block;color:#fff3df}.v20-firm-staff span,.v20-guide-grid span,.v20-mini-list span,.v20-mini-list em,.v20-risk-list>div{display:block;color:#b9a98d;font-family:'JetBrains Mono',monospace;font-size:9px;line-height:1.45;font-style:normal}",
      ".v20-guide-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px}.v20-mini-list button{cursor:pointer}.v20-mini-list em{color:#f0cf86}",
      "@media(max-width:900px){.v20-hero,.v20-grid-main,.v20-focus-desk,.v20-return-switch{grid-template-columns:1fr}.v20-filter-row,.v20-input-row,.v20-transfer-row,.v20-trade-actions,.v20-stop-row{grid-template-columns:1fr!important}.v20-stock-list{grid-template-columns:1fr!important}.v20-panel-head,.v20-focus-head{align-items:flex-start}.v20-panel-head strong,.v20-focus-price{text-align:left}.v20-hero h2{font-size:28px}.v20-focus-chart{height:220px}.v20-focus-meta,.v20-focus-stats,.v20-annual-band,.v20-position-strip{grid-template-columns:1fr}.v20-sort-search{display:grid;grid-template-columns:1fr;align-items:stretch}.v20-tabs{grid-template-columns:repeat(2,minmax(0,1fr))}}"
    ].join("\n");
    document.head.appendChild(style);
  }

  window.ensureStockEngineV2 = ensureShape;
  window.getStockUniverse = function () { ensureShape(); return STOCKS.slice(); };
  window.getStockPrice = getPrice;
  window.tickLiveStockMarket = tickLiveStockMarket;
  window.processStockMarketYear = processStockMarketYear;
  window.processStockMarketYearV20 = function () { processStockMarketYear({ mode:"manual" }); save(); refreshHub(); };
  window.buyStockAmount = buyStockAmount;
  window.sellStockAmount = sellStockAmount;
  window.shortStockAmount = shortStockAmount;
  window.coverShortAmount = coverShortAmount;
  window.sellAllStocks = sellAllStocks;
  window.fundInvestmentCash = fundInvestmentCash;
  window.withdrawInvestmentCash = withdrawInvestmentCash;
  window.getPortfolioSummary = portfolioSummary;
  window.getStockDetail = getStockDetail;
  window.renderInvestmentsHubV20 = renderInvestmentsHub;
  window.setStockTabV20 = setTab;
  window.setStockFilterV20 = setFilter;
  window.toggleStockWatchV20 = toggleWatchlist;
  window.setStockAccountV20 = setAccount;
  window.selectStockV20 = selectStock;
  window.setStockReturnModeV20 = setReturnMode;
  window.setStockSortV21 = setSortMode;
  window.setStockFilterModeV21 = setFilterMode;
  window.readStockInputV21 = readPreciseAmount;
  window.setStopLossV21 = setStopLoss;
  window.clearStopLossV21 = clearStopLoss;
  window.resetInvestmentsViewV20 = resetInvestmentsView;
  window.generateSectorNewsV20 = function () { generateSectorNews(false); };
  window.generateEarningsV20 = function () { generateEarnings(false); };
  window.generateAnalystRatingV20 = function () { generateAnalystRating(null, false); };
  window.generateCompanyActionV20 = function () { generateCompanyAction(); };
  window.allocatePersonalFirmV20 = allocatePersonalFirm;
  window.withdrawPersonalFirmV20 = withdrawPersonalFirm;

  window.stockValue18 = stockValue;
  window.stockShortEquityV20 = totalShortEquity;
  window.brokerageTotal18 = function () { return brokerageCash() + stockValue() + annualValue() + totalShortEquity(); };
  window.buyStockV18 = function (id, mode, inputId) {
    var cash = brokerageCash();
    var amount = mode === "all" ? cash : mode === "custom" ? readAmount(inputId, cash) : Math.max(0, round(mode));
    var out = buyStockAmount(id, amount, { source:"brokerage" });
    clearInput(inputId);
    return out;
  };
  window.buyCustomStockV18 = function (id, inputId) { return window.buyStockV18(id, "custom", inputId); };
  window.buyStockFromCheckingV20 = function (id, mode, inputId) {
    var amount = mode === "all" ? liquidCash(false) : mode === "custom" ? readAmount(inputId, liquidCash(false)) : Math.max(0, round(mode));
    var out = buyStockAmount(id, amount, { source:"checking" });
    clearInput(inputId);
    return out;
  };
  window.sellStockV18 = function (id, mode, inputId) {
    var h = getHolding(id, false);
    var max = h ? holdingValue(h) : 0;
    var amount = mode === "all" ? max : mode === "custom" ? readAmount(inputId, max) : Math.max(0, round(mode));
    var out = sellStockAmount(id, amount);
    clearInput(inputId);
    return out;
  };
  window.sellCustomStockV18 = function (id, inputId) { return window.sellStockV18(id, "custom", inputId); };
  window.shortStockV20 = function (id, mode, inputId) {
    var cash = brokerageCash();
    var amount = mode === "all" ? cash : mode === "custom" ? readAmount(inputId, cash) : Math.max(0, round(mode));
    var out = shortStockAmount(id, amount);
    clearInput(inputId);
    return out;
  };
  window.shortCustomStockV20 = function (id, inputId) { return window.shortStockV20(id, "custom", inputId); };
  window.coverStockV20 = function (id, mode, inputId) {
    var p = getShortPosition(id, false);
    var max = p ? shortMarketValue(p) : 0;
    var amount = mode === "all" ? max : mode === "custom" ? readAmount(inputId, max) : Math.max(0, round(mode));
    var out = coverShortAmount(id, amount);
    clearInput(inputId);
    return out;
  };
  window.coverCustomShortV20 = function (id, inputId) { return window.coverStockV20(id, "custom", inputId); };
  window.buyAnnualStockV21 = function (id, mode, inputId) {
    var cash = brokerageCash();
    var amount = mode === "all" ? cash : mode === "custom" ? readAmount(inputId, cash) : Math.max(0, round(mode));
    var out = buyAnnualStockAmount(id, amount);
    clearInput(inputId);
    return out;
  };
  window.sellAnnualStockV21 = function (id, mode, inputId) {
    var p = getAnnualPosition(id, false);
    var max = p ? annualPositionValue(p) : 0;
    var amount = mode === "all" ? "all" : mode === "custom" ? readAmount(inputId, max) : Math.max(0, round(mode));
    var out = sellAnnualStockAmount(id, amount);
    clearInput(inputId);
    return out;
  };
  window.sellAllStocksV18 = sellAllStocks;
  window.fundStockCashV18 = fundInvestmentCash;
  window.withdrawStockCashV20 = withdrawInvestmentCash;
  window.runMarketYearV18 = window.processStockMarketYearV20;
  window.liveMarketTickV18 = tickLiveStockMarket;
  window.toggleLiveMarketV18 = toggleLiveMarket;
  window.stopLiveMarketV18 = stopLiveMarket;
  try { stockValue18 = window.stockValue18; } catch (e) {}
  try { brokerageTotal18 = window.brokerageTotal18; } catch (e2) {}
  try { buyStockV18 = window.buyStockV18; sellStockV18 = window.sellStockV18; buyCustomStockV18 = window.buyCustomStockV18; sellCustomStockV18 = window.sellCustomStockV18; sellAllStocksV18 = window.sellAllStocksV18; } catch (e3) {}
  try { fundStockCashV18 = window.fundStockCashV18; runMarketYearV18 = window.runMarketYearV18; liveMarketTickV18 = window.liveMarketTickV18; toggleLiveMarketV18 = window.toggleLiveMarketV18; stopLiveMarketV18 = window.stopLiveMarketV18; } catch (e4) {}

  installStyles();
  ensureShape();
  installRenderOverride();
  wrapAgeUp();

  if (window.registerLedgerSystem) {
    window.registerLedgerSystem({
      id: "stocks-engine",
      file: "pages/systems/stocks-engine.js",
      status: "active",
      globals: ["ensureStockEngineV2", "getStockUniverse", "tickLiveStockMarket", "buyStockAmount", "sellStockAmount", "renderInvestmentsHubV20"],
      notes: "Investments 2.0 stock engine: expanded live market, candles, amount trading, watchlist/news/earnings/risk/accounts, and existing personal firm preservation under state.finance.stocksV18."
    });
  }
})();
