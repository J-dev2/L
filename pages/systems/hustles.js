/* ============================================================================
 * hustles.js  (v18.55 — Side Hustles: entrepreneurship from the ground up)
 * ----------------------------------------------------------------------------
 * The grind layer beneath the formal business system. Start small side hustles
 * while you have a job (or instead of one), work them up through five levels,
 * ride momentum and events, reinvest, and eventually take one "pro" — a real
 * recurring income stream and a stepping stone toward a full company.
 *
 * Each hustle scales off one of your life stats (a creative codes differently
 * than a disciplined grinder), has its own signature move, and earns every year
 * whether you tend it or not — but momentum decays if you neglect it, so the
 * ones you actively work pull ahead.
 *
 * Self-contained: own state on state.finance.hustlesV1855, own "hustles" hub,
 * one guarded yearly hook. Income flows to checking; net contribution is logged.
 * Opened with setTab('hustles'). Designed to be safe under the central render
 * crash-guard.
 * ========================================================================== */
(function () {
  "use strict";
  if (window.__ledgerHustlesV1855Loaded) return;
  window.__ledgerHustlesV1855Loaded = true;

  // ----------------------------------------------------------------- helpers --
  function S() { try { if (typeof state !== "undefined" && state) return state; } catch (e) {} return window.state || {}; }
  function age() { return Number(S().age) || 0; }
  function clampN(v, a, b) { v = Number(v); if (!Number.isFinite(v)) v = 0; return Math.max(a, Math.min(b, v)); }
  function round(v) { return Math.round(Number(v) || 0); }
  function rnd(a, b) { try { if (typeof window.rand === "function") return window.rand(a, b); } catch (e) {} return a + Math.floor(Math.random() * (b - a + 1)); }
  function chance(p) { try { if (typeof window.chance === "function") return window.chance(p); } catch (e) {} return Math.random() < p; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }
  function fin() { var s = S(); if (!s.finance || typeof s.finance !== "object") s.finance = {}; return s.finance; }
  function moneyText(v) { try { if (typeof window.fmtMoney === "function") return window.fmtMoney(round(v)); if (typeof window.money === "function") return window.money(round(v)); } catch (e) {} return "$" + round(v).toLocaleString(); }
  function compact(v) {
    v = round(v); var a = Math.abs(v), sgn = v < 0 ? "-" : "";
    if (a >= 1e12) return sgn + "$" + (a / 1e12).toFixed(a >= 1e13 ? 1 : 2).replace(/\.0+$/, "") + "T";
    if (a >= 1e9) return sgn + "$" + (a / 1e9).toFixed(a >= 1e10 ? 1 : 2).replace(/\.0+$/, "") + "B";
    if (a >= 1e6) return sgn + "$" + (a / 1e6).toFixed(a >= 1e7 ? 1 : 2).replace(/\.0+$/, "") + "M";
    if (a >= 1e3) return sgn + "$" + (a / 1e3).toFixed(a >= 1e4 ? 1 : 2).replace(/\.0+$/, "") + "K";
    return moneyText(v);
  }
  function logLine(t, d) { try { if (typeof window.addLog === "function") window.addLog(t, d || {}); } catch (e) {} }
  function applyDeltas(d) { try { if (d && Object.keys(d).length && typeof window.applyDeltas === "function") window.applyDeltas(d); } catch (e) {} }
  function rerender() { try { if (typeof window.render === "function") window.render(); } catch (e) {} }
  function saveGame() { try { if (typeof window.save === "function") window.save(); } catch (e) {} }
  function toast(m) { try { if (typeof window.addToast === "function") window.addToast(m); } catch (e) {} return false; }
  function statVal(k) { try { var s = S(); if (s.stats && Number.isFinite(s.stats[k])) return s.stats[k]; } catch (e) {} return 50; }
  function gainCash(amount) { applyDeltas({ money: round(amount) }); }
  function spendCash(amount) { applyDeltas({ money: -round(amount) }); }
  function cash() { return Math.max(0, round(S().money)); }
  function actionsTaken() { var s = S(); if (!s.actionsTaken || typeof s.actionsTaken !== "object") s.actionsTaken = {}; return s.actionsTaken; }
  function usedThisYear(key) { return !!actionsTaken()[key]; }
  function markUsed(key) { actionsTaken()[key] = true; }

  // ---------------------------------------------------------------- levels ---
  var MAX_LEVEL = 5;
  var LEVEL_NAMES = ["", "Just Starting", "Side Gig", "Picking Up", "Established", "Full Operation"];
  // xp needed to REACH the given level (cumulative thresholds)
  var LEVEL_XP = [0, 0, 100, 280, 620, 1200];
  function xpForNext(level) { return LEVEL_XP[Math.min(MAX_LEVEL, level + 1)] || Infinity; }

  // -------------------------------------------------------------- catalog ----
  // incomeBase = rough yearly take at level 1 with an average stat; income grows
  // ~1.6x per level. scaleStat picks which of your stats supercharges it. vol is
  // year-to-year swing. sig = the once-a-year signature move.
  var HUSTLES = [
    {
      id: "reselling", name: "Reselling & Flipping", icon: "🏷️", cat: "Retail", minAge: 13, startCost: 200,
      incomeBase: 4200, growth: 1.55, vol: 0.30, scaleStat: "discipline",
      desc: "Buy low at yard sales and clearance, sell high online. The original hustle.",
      sig: { label: "Score a Rare Find", icon: "💎", cash: [0.4, 1.1], xp: 60, momentum: 0.3,
        lines: ["Flipped a thrift-store find for 10x.", "Snagged a mispriced collectible and resold it.", "Found gold in someone's garage sale."] }
    },
    {
      id: "dropship", name: "Dropshipping Store", icon: "📦", cat: "E-commerce", minAge: 16, startCost: 1500,
      incomeBase: 6500, growth: 1.62, vol: 0.40, scaleStat: "creativity",
      desc: "A storefront with no inventory. Marketing is everything; margins are thin.",
      sig: { label: "Run a Viral Ad", icon: "📣", cash: [0.3, 1.4], xp: 70, momentum: 0.35,
        lines: ["An ad caught fire and orders flooded in.", "A creative angle finally converted.", "Cracked the algorithm for a week."] }
    },
    {
      id: "freelance_design", name: "Freelance Design", icon: "🎨", cat: "Creative", minAge: 15, startCost: 150,
      incomeBase: 7000, growth: 1.58, vol: 0.22, scaleStat: "creativity",
      desc: "Logos, brands, and graphics for clients. Your portfolio is your resume.",
      sig: { label: "Land a Brand Client", icon: "🌟", cash: [0.3, 0.9], xp: 75, momentum: 0.3,
        lines: ["Landed a recurring brand client.", "A portfolio piece went around design Twitter.", "Won a competitive pitch."] }
    },
    {
      id: "freelance_code", name: "Freelance Coding", icon: "💻", cat: "Tech", minAge: 16, startCost: 300,
      incomeBase: 11000, growth: 1.66, vol: 0.20, scaleStat: "smarts",
      desc: "Build sites and apps on contract. High rates if you can deliver.",
      sig: { label: "Ship a Big Contract", icon: "🚀", cash: [0.4, 1.2], xp: 80, momentum: 0.3,
        lines: ["Shipped a contract early and got a bonus.", "A client referred you to three more.", "Automated your own workflow and doubled output."] }
    },
    {
      id: "content", name: "Content Creator", icon: "🎥", cat: "Media", minAge: 13, startCost: 400,
      incomeBase: 3000, growth: 1.85, vol: 0.55, scaleStat: "creativity",
      desc: "Videos and posts. Brutal at first, exponential if it clicks.",
      sig: { label: "Post Something Viral", icon: "🔥", cash: [0.2, 2.0], xp: 90, momentum: 0.45, fame: 1,
        lines: ["A post blew up overnight.", "The algorithm finally smiled on you.", "A clip hit a million views."] }
    },
    {
      id: "rideshare", name: "Rideshare Driving", icon: "🚗", cat: "Gig", minAge: 18, startCost: 0,
      incomeBase: 9000, growth: 1.35, vol: 0.15, scaleStat: "discipline", lowCeiling: true,
      desc: "Drive on your own schedule. Reliable, but the ceiling is low.",
      sig: { label: "Grind Surge Hours", icon: "⚡", cash: [0.15, 0.5], xp: 45, momentum: 0.25, stress: 3,
        lines: ["Worked every surge window this week.", "Pulled doubles on the holidays.", "Memorized the airport rush."] }
    },
    {
      id: "delivery", name: "Food Delivery", icon: "🛵", cat: "Gig", minAge: 16, startCost: 0,
      incomeBase: 6500, growth: 1.32, vol: 0.15, scaleStat: "fitness", lowCeiling: true,
      desc: "Bike or drive orders around town. Easy to start, capped income.",
      sig: { label: "Hustle Peak Dinner", icon: "🍔", cash: [0.1, 0.4], xp: 40, momentum: 0.25, stress: 3,
        lines: ["Crushed the dinner rush every night.", "Learned the fastest routes.", "Stacked orders like a pro."] }
    },
    {
      id: "tutoring", name: "Tutoring", icon: "📚", cat: "Education", minAge: 15, startCost: 50,
      incomeBase: 6000, growth: 1.5, vol: 0.18, scaleStat: "smarts",
      desc: "Teach what you know. Word of mouth compounds.",
      sig: { label: "Build a Waitlist", icon: "📈", cash: [0.2, 0.6], xp: 60, momentum: 0.3,
        lines: ["Parents started a waitlist for you.", "A student aced their exam and told everyone.", "Raised your rates and nobody blinked."] }
    },
    {
      id: "handyman", name: "Handyman Gigs", icon: "🔧", cat: "Trades", minAge: 16, startCost: 600,
      incomeBase: 8000, growth: 1.5, vol: 0.20, scaleStat: "fitness",
      desc: "Odd jobs, repairs, assembly. Tools pay for themselves fast.",
      sig: { label: "Land a Big Repair Job", icon: "🛠️", cash: [0.3, 0.9], xp: 65, momentum: 0.3,
        lines: ["Landed a whole-house job.", "A property manager put you on call.", "Knocked out a renovation in record time."] }
    },
    {
      id: "vending", name: "Vending Machines", icon: "🥤", cat: "Passive", minAge: 18, startCost: 4000,
      incomeBase: 5500, growth: 1.6, vol: 0.12, scaleStat: "discipline", passive: true,
      desc: "Buy machines, place them well, restock. Mostly hands-off once running.",
      sig: { label: "Lock a Prime Location", icon: "📍", cash: [0.2, 0.7], xp: 60, momentum: 0.3,
        lines: ["Locked a machine in a busy gym.", "Got a route into an office park.", "Negotiated a no-rent placement."] }
    },
    {
      id: "photography", name: "Photography", icon: "📷", cat: "Creative", minAge: 15, startCost: 1200,
      incomeBase: 6800, growth: 1.55, vol: 0.28, scaleStat: "creativity",
      desc: "Weddings, portraits, events. Gear and a good eye.",
      sig: { label: "Shoot a Big Wedding", icon: "💍", cash: [0.3, 1.0], xp: 65, momentum: 0.3,
        lines: ["Shot a wedding that booked you three more.", "A photo got featured.", "Upsold a premium album."] }
    },
    {
      id: "pod", name: "Print-on-Demand", icon: "👕", cat: "E-commerce", minAge: 14, startCost: 250,
      incomeBase: 3800, growth: 1.7, vol: 0.45, scaleStat: "creativity",
      desc: "Designs on shirts, mugs, posters. One hit design can carry you.",
      sig: { label: "Drop a Hit Design", icon: "🎯", cash: [0.2, 1.3], xp: 70, momentum: 0.35,
        lines: ["A design caught a trend perfectly.", "A niche fandom found your store.", "One shirt outsold everything else 20:1."] }
    },
    {
      id: "affiliate", name: "Affiliate Marketing", icon: "🔗", cat: "Online", minAge: 16, startCost: 300,
      incomeBase: 4500, growth: 1.72, vol: 0.42, scaleStat: "smarts",
      desc: "Reviews and links that earn a cut. Slow build, passive payoff.",
      sig: { label: "Rank a Money Page", icon: "🔎", cash: [0.2, 1.1], xp: 75, momentum: 0.3,
        lines: ["A review page hit the top of search.", "A roundup post started printing commissions.", "An email list finally converted."] }
    },
    {
      id: "daytrading", name: "Day Trading", icon: "📈", cat: "Finance", minAge: 18, startCost: 5000,
      incomeBase: 8000, growth: 1.8, vol: 0.85, scaleStat: "smarts", risky: true,
      desc: "Trade the markets actively. Big swings — you can also lose a year.",
      sig: { label: "Catch a Big Move", icon: "🎰", cash: [-0.6, 2.2], xp: 70, momentum: 0.3,
        lines: ["Caught a breakout and rode it.", "A risky play actually paid off.", "Timed a reversal perfectly — this time."] }
    },
    {
      id: "petsitting", name: "Pet Sitting & Walking", icon: "🐕", cat: "Gig", minAge: 14, startCost: 50,
      incomeBase: 4000, growth: 1.45, vol: 0.18, scaleStat: "confidence",
      desc: "Walk dogs, sit pets. Trust and repeat clients are everything.",
      sig: { label: "Become the Go-To Sitter", icon: "🦴", cash: [0.15, 0.5], xp: 55, momentum: 0.3,
        lines: ["The neighborhood made you their go-to.", "A client gave you a key and a raise.", "Holiday bookings stacked up."] }
    },
    {
      id: "baking", name: "Home Bakery", icon: "🧁", cat: "Food", minAge: 14, startCost: 500,
      incomeBase: 4800, growth: 1.5, vol: 0.25, scaleStat: "creativity",
      desc: "Custom cakes and treats from your kitchen. Word of mouth and Instagram.",
      sig: { label: "Cater a Big Event", icon: "🎂", cash: [0.2, 0.8], xp: 60, momentum: 0.3,
        lines: ["Catered a wedding's dessert table.", "A custom cake went viral locally.", "Landed a standing café order."] }
    },
    {
      id: "beats", name: "Selling Beats", icon: "🎧", cat: "Media", minAge: 14, startCost: 800,
      incomeBase: 3500, growth: 1.78, vol: 0.55, scaleStat: "creativity",
      desc: "Produce and license beats online. One placement changes everything.",
      sig: { label: "Land a Placement", icon: "🎶", cash: [0.2, 1.6], xp: 80, momentum: 0.4, fame: 1,
        lines: ["An artist licensed your beat.", "A track you produced started charting.", "Your pack went to the top of the marketplace."] }
    },
    {
      id: "sideapp", name: "Indie App / SaaS", icon: "📱", cat: "Tech", minAge: 17, startCost: 2000,
      incomeBase: 5000, growth: 1.95, vol: 0.5, scaleStat: "smarts", highCeiling: true,
      desc: "Build a small product with recurring revenue. Slow, then sudden.",
      sig: { label: "Ship a Killer Feature", icon: "✨", cash: [0.2, 1.5], xp: 95, momentum: 0.4,
        lines: ["A feature got you on a 'best apps' list.", "Word of mouth spiked signups.", "An integration unlocked a new market."] }
    },
    {
      id: "coaching", name: "Online Coaching", icon: "🎯", cat: "Education", minAge: 18, startCost: 400,
      incomeBase: 7500, growth: 1.65, vol: 0.3, scaleStat: "confidence",
      desc: "Coach fitness, business, or life. Sell your expertise and presence.",
      sig: { label: "Sell Out a Cohort", icon: "🏆", cash: [0.3, 1.1], xp: 75, momentum: 0.35,
        lines: ["A cohort sold out in a day.", "A testimonial brought a wave of clients.", "Raised prices and demand went up."] }
    },
    {
      id: "thrift", name: "Vintage Thrifting", icon: "🧥", cat: "Retail", minAge: 14, startCost: 200,
      incomeBase: 4000, growth: 1.55, vol: 0.32, scaleStat: "looks",
      desc: "Curate and resell vintage fashion. Taste is the moat.",
      sig: { label: "Curate a Drop", icon: "🛍️", cash: [0.2, 1.0], xp: 60, momentum: 0.3,
        lines: ["A curated drop sold out in minutes.", "A rare piece sparked a bidding war.", "An influencer wore your find."] }
    },
    {
      id: "cardetailing", name: "Car Detailing", icon: "🚿", cat: "Trades", minAge: 15, startCost: 700,
      incomeBase: 6000, growth: 1.5, vol: 0.2, scaleStat: "fitness",
      desc: "Mobile detailing for people who love their cars. Repeat clients and upsells.",
      sig: { label: "Detail a Supercar", icon: "✨", cash: [0.25, 0.8], xp: 60, momentum: 0.3,
        lines: ["Detailed a collector's supercar.", "A dealership put you on retainer.", "An upsell ceramic coating paid off."] }
    },
    {
      id: "pressurewash", name: "Pressure Washing", icon: "💦", cat: "Trades", minAge: 16, startCost: 900,
      incomeBase: 7000, growth: 1.52, vol: 0.2, scaleStat: "fitness",
      desc: "Driveways, decks, storefronts. Oddly satisfying and very profitable.",
      sig: { label: "Win a Commercial Route", icon: "🏢", cash: [0.3, 0.9], xp: 65, momentum: 0.3,
        lines: ["Won a strip-mall cleaning route.", "A before/after video went viral.", "Booked out the whole spring."] }
    },
    {
      id: "smm", name: "Social Media Manager", icon: "📲", cat: "Online", minAge: 16, startCost: 200,
      incomeBase: 8500, growth: 1.6, vol: 0.25, scaleStat: "confidence",
      desc: "Run accounts for small businesses. Retainers stack up fast.",
      sig: { label: "Land a Retainer Client", icon: "🤝", cash: [0.3, 0.9], xp: 70, momentum: 0.3,
        lines: ["Signed a monthly retainer.", "Grew a client's account 10x.", "Referrals filled your roster."] }
    },
    {
      id: "bookkeeping", name: "Bookkeeping", icon: "🧾", cat: "Finance", minAge: 18, startCost: 300,
      incomeBase: 9000, growth: 1.58, vol: 0.15, scaleStat: "smarts",
      desc: "Keep small businesses' books. Steady, sticky, recession-proof.",
      sig: { label: "Sign a Long-Term Client", icon: "📒", cash: [0.25, 0.7], xp: 65, momentum: 0.3,
        lines: ["Signed a multi-year client.", "Caught a costly error and earned trust.", "Raised rates at renewal."] }
    },
    {
      id: "voiceover", name: "Voiceover Work", icon: "🎙️", cat: "Creative", minAge: 16, startCost: 600,
      incomeBase: 6500, growth: 1.6, vol: 0.35, scaleStat: "confidence",
      desc: "Narrate ads, audiobooks, and games from a closet booth.",
      sig: { label: "Book a National Ad", icon: "📻", cash: [0.3, 1.4], xp: 75, momentum: 0.35,
        lines: ["Booked a national ad spot.", "Voiced a hit audiobook.", "A studio added you to their roster."] }
    },
    {
      id: "sneakers", name: "Sneaker Reselling", icon: "👟", cat: "Retail", minAge: 14, startCost: 800,
      incomeBase: 5000, growth: 1.7, vol: 0.5, scaleStat: "discipline",
      desc: "Cop limited drops, sell at resale. Bots, raffles, and timing.",
      sig: { label: "Hit a Grail Drop", icon: "🎟️", cash: [0.2, 1.5], xp: 70, momentum: 0.35,
        lines: ["Hit a grail release and flipped it.", "Won three raffles in a row.", "Bought a bulk lot under market."] }
    },
    {
      id: "wholesaling", name: "Real Estate Wholesaling", icon: "🏚️", cat: "Finance", minAge: 19, startCost: 1500,
      incomeBase: 12000, growth: 1.85, vol: 0.6, scaleStat: "confidence", highCeiling: true,
      desc: "Lock up undervalued homes and assign the contract. No capital, all hustle.",
      sig: { label: "Assign a Big Deal", icon: "📑", cash: [0.2, 2.0], xp: 90, momentum: 0.4,
        lines: ["Assigned a contract for a fat fee.", "A motivated seller called you back.", "Built a cash-buyer list that closes fast."] }
    },
    {
      id: "candles", name: "Candle & Soap Making", icon: "🕯️", cat: "Craft", minAge: 13, startCost: 300,
      incomeBase: 3600, growth: 1.5, vol: 0.28, scaleStat: "creativity",
      desc: "Hand-poured goods with a brand. Craft fairs and online shops.",
      sig: { label: "Land a Wholesale Order", icon: "📦", cash: [0.2, 0.8], xp: 60, momentum: 0.3,
        lines: ["A boutique placed a wholesale order.", "A scent line sold out.", "A market booth blew up."] }
    },
    {
      id: "printing3d", name: "3D Printing", icon: "🖨️", cat: "Craft", minAge: 15, startCost: 1500,
      incomeBase: 4500, growth: 1.6, vol: 0.35, scaleStat: "creativity",
      desc: "Print props, parts, and custom goods on demand.",
      sig: { label: "Land a Custom Batch", icon: "🧩", cash: [0.2, 1.0], xp: 65, momentum: 0.3,
        lines: ["A creator ordered a custom batch.", "A part design went viral on a marketplace.", "A local shop outsources prints to you."] }
    },
    {
      id: "djgigs", name: "DJ Gigs", icon: "🎚️", cat: "Media", minAge: 16, startCost: 1800,
      incomeBase: 5500, growth: 1.62, vol: 0.4, scaleStat: "confidence",
      desc: "Spin at parties, clubs, and weddings. Build a name and a calendar.",
      sig: { label: "Headline a Big Night", icon: "🎉", cash: [0.3, 1.2], xp: 70, momentum: 0.35, fame: 1,
        lines: ["Headlined a packed night.", "A wedding booked you for the whole season.", "A residency offer came in."] }
    },
    {
      id: "eventplanning", name: "Event Planning", icon: "🎈", cat: "Creative", minAge: 18, startCost: 800,
      incomeBase: 8000, growth: 1.65, vol: 0.3, scaleStat: "confidence",
      desc: "Plan weddings and parties. Vendors, logistics, and taste.",
      sig: { label: "Plan a Flagship Event", icon: "🥂", cash: [0.3, 1.1], xp: 75, momentum: 0.3,
        lines: ["Planned a flagship wedding.", "A corporate client booked a gala.", "Vendor kickbacks padded the margin."] }
    },
    {
      id: "personaltraining", name: "Personal Training", icon: "🏋️", cat: "Gig", minAge: 17, startCost: 400,
      incomeBase: 7000, growth: 1.55, vol: 0.2, scaleStat: "fitness",
      desc: "Train clients in person or online. Results sell themselves.",
      sig: { label: "Build a Client Roster", icon: "💪", cash: [0.25, 0.7], xp: 65, momentum: 0.3,
        lines: ["A client transformation went viral.", "Your calendar filled with referrals.", "Launched a paid program."] }
    },
    {
      id: "mealprep", name: "Meal Prep Service", icon: "🥗", cat: "Food", minAge: 17, startCost: 1200,
      incomeBase: 7500, growth: 1.58, vol: 0.25, scaleStat: "discipline",
      desc: "Cook and deliver healthy meals on subscription. Logistics-heavy, sticky revenue.",
      sig: { label: "Sign Subscription Clients", icon: "📅", cash: [0.25, 0.8], xp: 70, momentum: 0.3,
        lines: ["A gym partnered for member meals.", "Subscriptions hit a new high.", "A bulk corporate order landed."] }
    },
    {
      id: "cleaning", name: "House Cleaning", icon: "🧹", cat: "Trades", minAge: 16, startCost: 300,
      incomeBase: 6500, growth: 1.5, vol: 0.18, scaleStat: "discipline",
      desc: "Residential cleaning with repeat weekly clients. Easy to scale with crews.",
      sig: { label: "Land Recurring Clients", icon: "🔁", cash: [0.2, 0.6], xp: 60, momentum: 0.3,
        lines: ["Locked in weekly recurring homes.", "A realtor put you on turnover duty.", "Hired help and doubled routes."] }
    },
    {
      id: "junkremoval", name: "Junk Removal", icon: "🚛", cat: "Trades", minAge: 18, startCost: 3500,
      incomeBase: 9000, growth: 1.55, vol: 0.22, scaleStat: "fitness",
      desc: "Haul away junk for cash. A truck and a strong back print money.",
      sig: { label: "Clear a Big Job", icon: "🏗️", cash: [0.3, 0.9], xp: 65, momentum: 0.3,
        lines: ["Cleared a whole estate in a day.", "A contractor put you on speed dial.", "Resold the good stuff for a bonus."] }
    },
    {
      id: "woodworking", name: "Custom Woodworking", icon: "🪵", cat: "Craft", minAge: 16, startCost: 1500,
      incomeBase: 5000, growth: 1.55, vol: 0.28, scaleStat: "creativity",
      desc: "Build furniture and decor to order. Craftsmanship commands a premium.",
      sig: { label: "Land a Custom Commission", icon: "🪚", cash: [0.25, 1.0], xp: 65, momentum: 0.3,
        lines: ["A designer commissioned a statement piece.", "A dining table booked you for months.", "A viral build flooded your inbox."] }
    },
    {
      id: "jewelrymaking", name: "Handmade Jewelry", icon: "💍", cat: "Craft", minAge: 13, startCost: 400,
      incomeBase: 3800, growth: 1.55, vol: 0.3, scaleStat: "creativity",
      desc: "Design and sell jewelry online and at markets. A strong brand scales.",
      sig: { label: "Drop a Collection", icon: "💎", cash: [0.2, 1.0], xp: 60, momentum: 0.3,
        lines: ["A collection sold out in a day.", "A celebrity wore your piece.", "A boutique picked up your line."] }
    },
    {
      id: "yt_automation", name: "Faceless YouTube", icon: "📺", cat: "Media", minAge: 16, startCost: 600,
      incomeBase: 4000, growth: 1.88, vol: 0.55, scaleStat: "smarts", highCeiling: true,
      desc: "Run faceless channels with outsourced editing. Systems, not stardom.",
      sig: { label: "Hit the Algorithm", icon: "📈", cash: [0.2, 1.8], xp: 85, momentum: 0.4,
        lines: ["A channel went exponential.", "An AdSense check tripled.", "You cloned the formula across niches."] }
    },
    {
      id: "newsletter", name: "Paid Newsletter", icon: "✉️", cat: "Online", minAge: 16, startCost: 200,
      incomeBase: 4200, growth: 1.75, vol: 0.4, scaleStat: "creativity",
      desc: "Build an audience and charge for it. Slow to start, then it compounds.",
      sig: { label: "Convert Free to Paid", icon: "💌", cash: [0.2, 1.1], xp: 75, momentum: 0.3,
        lines: ["A wave of free readers upgraded.", "A viral issue doubled the list.", "A sponsor bought the whole quarter."] }
    },
    {
      id: "podcast", name: "Podcasting", icon: "🎙️", cat: "Media", minAge: 16, startCost: 800,
      incomeBase: 3500, growth: 1.8, vol: 0.5, scaleStat: "confidence",
      desc: "Mics, conversations, and patience. Sponsorships follow downloads.",
      sig: { label: "Book a Big Guest", icon: "🎧", cash: [0.2, 1.4], xp: 80, momentum: 0.4, fame: 1,
        lines: ["A big guest sent downloads soaring.", "A network offered an ad deal.", "An episode got clipped everywhere."] }
    },
    {
      id: "streaming", name: "Live Streaming", icon: "🎮", cat: "Media", minAge: 14, startCost: 1200,
      incomeBase: 3000, growth: 1.85, vol: 0.6, scaleStat: "confidence", highCeiling: true,
      desc: "Stream games or talk live. Subs, bits, and donations — if you build a community.",
      sig: { label: "Have a Breakout Stream", icon: "🔴", cash: [0.15, 1.9], xp: 90, momentum: 0.45, fame: 1,
        lines: ["A clip blew up and raiders poured in.", "You hit a subscriber milestone live.", "A sponsor slid into your DMs."] }
    },
    {
      id: "notion", name: "Digital Templates", icon: "🗒️", cat: "Tech", minAge: 15, startCost: 100,
      incomeBase: 3200, growth: 1.75, vol: 0.45, scaleStat: "creativity", passive: true,
      desc: "Sell templates and digital products. Build once, sell forever.",
      sig: { label: "Make a Bestseller", icon: "🏆", cash: [0.2, 1.2], xp: 70, momentum: 0.3,
        lines: ["A template hit the marketplace top sellers.", "A creator featured your product.", "A bundle outsold everything else."] }
    },
    {
      id: "digitalart", name: "Digital Art & Commissions", icon: "🖌️", cat: "Creative", minAge: 13, startCost: 500,
      incomeBase: 4000, growth: 1.62, vol: 0.32, scaleStat: "creativity",
      desc: "Take art commissions and sell prints. A following is your storefront.",
      sig: { label: "Open Premium Slots", icon: "🎨", cash: [0.2, 1.0], xp: 65, momentum: 0.3,
        lines: ["Premium slots sold out instantly.", "A piece went viral on art socials.", "A studio offered freelance work."] }
    },
    {
      id: "stockphotos", name: "Stock Photography", icon: "📸", cat: "Creative", minAge: 15, startCost: 1000,
      incomeBase: 2800, growth: 1.7, vol: 0.4, scaleStat: "creativity", passive: true,
      desc: "Shoot once, license forever. A library that pays while you sleep.",
      sig: { label: "Catch a Trending Theme", icon: "🌅", cash: [0.15, 0.9], xp: 65, momentum: 0.3,
        lines: ["A trending theme spiked your downloads.", "A brand licensed a whole set.", "An editorial buyer found your work."] }
    },
    {
      id: "translation", name: "Translation Work", icon: "🌐", cat: "Education", minAge: 16, startCost: 100,
      incomeBase: 6500, growth: 1.55, vol: 0.2, scaleStat: "smarts",
      desc: "Translate documents and media. Niche languages pay the best.",
      sig: { label: "Land an Agency Contract", icon: "📜", cash: [0.25, 0.7], xp: 60, momentum: 0.3,
        lines: ["An agency added you to their bench.", "A rush job paid double.", "A specialty earned premium rates."] }
    },
    {
      id: "resumes", name: "Resume Writing", icon: "📄", cat: "Education", minAge: 18, startCost: 100,
      incomeBase: 5500, growth: 1.55, vol: 0.22, scaleStat: "smarts",
      desc: "Write resumes and LinkedIn profiles. Word of mouth from happy hires.",
      sig: { label: "Get a Client Hired", icon: "✅", cash: [0.2, 0.6], xp: 55, momentum: 0.3,
        lines: ["A client landed their dream job and told everyone.", "A career coach started referring you.", "You raised prices and demand held."] }
    },
    {
      id: "microgreens", name: "Microgreens Farming", icon: "🌱", cat: "Food", minAge: 16, startCost: 1500,
      incomeBase: 5000, growth: 1.55, vol: 0.25, scaleStat: "discipline",
      desc: "Grow microgreens in a spare room and sell to restaurants and markets.",
      sig: { label: "Win a Restaurant Account", icon: "🥬", cash: [0.2, 0.7], xp: 60, momentum: 0.3,
        lines: ["A chef put you on standing order.", "A farmers' market sold you out weekly.", "A grocer picked up your trays."] }
    },
    {
      id: "airbnb", name: "Rental Arbitrage", icon: "🏠", cat: "Finance", minAge: 21, startCost: 8000,
      incomeBase: 11000, growth: 1.7, vol: 0.4, scaleStat: "confidence", highCeiling: true,
      desc: "Lease a place, furnish it, and short-term rent it for more. Spreads, not ownership.",
      sig: { label: "Optimize a Unit", icon: "🛏️", cash: [0.2, 1.2], xp: 80, momentum: 0.35,
        lines: ["A unit hit superhost and rates jumped.", "You added units and systematized turnover.", "A peak season booked out months ahead."] }
    },
    {
      id: "carflipping", name: "Car Flipping", icon: "🚙", cat: "Retail", minAge: 18, startCost: 6000,
      incomeBase: 8000, growth: 1.6, vol: 0.45, scaleStat: "discipline",
      desc: "Buy undervalued cars, clean them up, sell for more. Capital-heavy but quick.",
      sig: { label: "Flip a Clean Title Deal", icon: "🔑", cash: [0.2, 1.3], xp: 70, momentum: 0.3,
        lines: ["Bought low at auction and flipped fast.", "A mechanic partner cut your costs.", "A clean-title gem sold over ask."] }
    },
    {
      id: "dropservicing", name: "Drop-Servicing Agency", icon: "🧰", cat: "Online", minAge: 18, startCost: 500,
      incomeBase: 7000, growth: 1.78, vol: 0.4, scaleStat: "confidence", highCeiling: true,
      desc: "Sell services, outsource the delivery, keep the margin. Pure middleman hustle.",
      sig: { label: "Close a Retainer", icon: "📞", cash: [0.25, 1.4], xp: 85, momentum: 0.35,
        lines: ["Closed a fat monthly retainer.", "Built a reliable contractor bench.", "A niche offer started printing."] }
    }
  ];
  function defById(id) { for (var i = 0; i < HUSTLES.length; i++) if (HUSTLES[i].id === id) return HUSTLES[i]; return null; }

  // --------------------------------------------------------------- state -----
  function ensure() {
    var f = fin();
    if (!f.hustlesV1855 || typeof f.hustlesV1855 !== "object" || Array.isArray(f.hustlesV1855)) {
      f.hustlesV1855 = { active: [], lifetimeEarned: 0, pro: [] };
    }
    var h = f.hustlesV1855;
    if (!Array.isArray(h.active)) h.active = [];
    if (!Array.isArray(h.pro)) h.pro = [];
    if (!Number.isFinite(h.lifetimeEarned)) h.lifetimeEarned = 0;
    if (typeof h.focusId === "undefined") h.focusId = null;
    if (typeof h.fullTime === "undefined") h.fullTime = false;
    h.active.forEach(function (r) {
      if (!r) return;
      if (!Number.isFinite(r.level)) r.level = 1;
      if (!Number.isFinite(r.xp)) r.xp = 0;
      if (!Number.isFinite(r.momentum)) r.momentum = 0.3;
      if (!Number.isFinite(r.invest)) r.invest = 0;
      if (!Number.isFinite(r.perk)) r.perk = 0;
      if (!Number.isFinite(r.lastIncome)) r.lastIncome = 0;
      if (!Number.isFinite(r.totalEarned)) r.totalEarned = 0;
      if (!Array.isArray(r.milestonesHit)) r.milestonesHit = [];
      if (!r.upg || typeof r.upg !== "object") r.upg = {};
      if (!Number.isFinite(r.since)) r.since = age();
    });
    // focus must point at an active hustle
    if (h.focusId && !h.active.some(function (r) { return r.id === h.focusId; })) h.focusId = null;
    return h;
  }
  function activeRec(id) { var h = ensure(); for (var i = 0; i < h.active.length; i++) if (h.active[i].id === id) return h.active[i]; return null; }
  function isActive(id) { return !!activeRec(id); }
  function isPro(id) { var h = ensure(); return h.pro.indexOf(id) >= 0; }

  // ---------------------------------------------------------- income model ---
  function statBonus(def) { return clampN((statVal(def.scaleStat) - 50) / 120, -0.42, 0.42); }
  function levelBase(def, level) { return def.incomeBase * Math.pow(def.growth || 1.55, (level || 1) - 1); }
  function isFocus(id) { return ensure().focusId === id; }
  function projectedIncome(def, r) {
    var base = levelBase(def, r.level);
    var focusBonus = isFocus(r.id) ? 0.12 : 0;
    var mult = 0.62 + statBonus(def) + clampN(r.momentum, 0, 1) * 0.5 + clampN(r.invest, 0, 0.4) + clampN(r.perk, 0, 0.8) + focusBonus;
    return Math.round(base * Math.max(0.2, mult));
  }

  // Permanent per-hustle upgrades — invest cash for a lasting edge. Each gives an
  // income perk plus a quality-of-life effect (less grind stress, slower momentum
  // decay, a momentum floor) so a well-built hustle needs less babysitting.
  var UPGRADES = {
    assistant: { name: "Hire Help", icon: "🧑‍💼", perk: 0.08, costMult: 0.6, desc: "Less grind stress, more output." },
    automate:  { name: "Add Systems", icon: "⚙️", perk: 0.05, costMult: 0.85, desc: "Runs with less attention; momentum holds." },
    brand:     { name: "Build a Brand", icon: "🏷️", perk: 0.06, costMult: 1.1, fame: 1, desc: "Loyal demand keeps momentum from cratering." }
  };
  var UPGRADE_ORDER = ["assistant", "automate", "brand"];
  function upgradeCost(def, r, upId) { var u = UPGRADES[upId]; return Math.max(1000, Math.round(levelBase(def, r.level) * (u.costMult || 1))); }
  window.buyHustleUpgradeV1855 = function (id, upId) {
    var def = defById(id), r = activeRec(id), u = UPGRADES[upId];
    if (!def || !r || !u) return toast("Unavailable.");
    if (!r.upg) r.upg = {};
    if (r.upg[upId]) return toast("You already have " + u.name + ".");
    var cost = upgradeCost(def, r, upId);
    if (cash() < cost) return toast(u.name + " costs " + compact(cost) + ".");
    spendCash(cost);
    r.upg[upId] = true;
    r.perk = clampN(r.perk + u.perk, 0, 0.8);
    if (u.fame) applyDeltas({ fame: u.fame });
    logLine(u.icon + " " + def.name + ": " + u.name + " (" + compact(cost) + ").", { money: -cost, fame: u.fame || 0 });
    toast(u.icon + " " + def.name + ": " + u.name);
    saveGame(); rerender();
  };

  // Milestones: lifetime-earned thresholds that pay a bonus and grant a permanent
  // income boost (r.perk). The long-term reward for sticking with a hustle.
  var MILESTONES = [
    { at: 50000,    label: "First $50K",     cash: 5000,    perk: 0.03 },
    { at: 250000,   label: "Quarter Million", cash: 20000,   perk: 0.05 },
    { at: 1000000,  label: "First Million",   cash: 75000,   perk: 0.07, fame: 1 },
    { at: 5000000,  label: "$5M Hustler",     cash: 300000,  perk: 0.10, fame: 1 },
    { at: 25000000, label: "Hustle Empire",   cash: 1500000, perk: 0.15, fame: 2 }
  ];
  function checkMilestones(def, r) {
    for (var i = 0; i < MILESTONES.length; i++) {
      var m = MILESTONES[i];
      if (r.totalEarned >= m.at && r.milestonesHit.indexOf(m.at) < 0) {
        r.milestonesHit.push(m.at);
        r.perk = clampN(r.perk + m.perk, 0, 0.8);
        gainCash(m.cash);
        var d = { money: m.cash };
        if (m.fame) { d.fame = m.fame; applyDeltas({ fame: m.fame }); }
        logLine("🏅 " + def.name + " milestone — " + m.label + "! +" + compact(m.cash) + " and a permanent boost.", d);
        toast("🏅 " + def.name + ": " + m.label + "!");
      }
    }
  }
  function milestonesHitCount(r) { return (r.milestonesHit || []).length; }
  function rollIncome(def, r) {
    var proj = projectedIncome(def, r);
    var vol = def.vol || 0.25;
    var swing = 1 + (Math.random() * 2 - 1) * vol;
    var inc = Math.round(proj * Math.max(def.risky ? -0.3 : 0.25, swing));
    return inc;
  }

  // --------------------------------------------------------------- actions ---
  window.startHustleV1855 = function (id) {
    var def = defById(id);
    if (!def) return toast("Unknown hustle.");
    if (isActive(id)) return toast("You're already running that.");
    if (age() < (def.minAge || 0)) return toast("Come back at " + def.minAge + ".");
    if (cash() < (def.startCost || 0)) return toast(def.name + " needs " + compact(def.startCost) + " to start.");
    if (def.startCost) spendCash(def.startCost);
    var h = ensure();
    h.active.push({ id: id, level: 1, xp: 0, momentum: 0.4, invest: 0, lastIncome: 0, totalEarned: 0, since: age() });
    logLine(def.icon + " You started a side hustle: " + def.name + ".", { money: def.startCost ? -def.startCost : 0, confidence: 1 });
    toast("🚀 Started: " + def.name);
    saveGame(); rerender();
  };

  window.grindHustleV1855 = function (id) {
    var def = defById(id), r = activeRec(id);
    if (!def || !r) return toast("Not running that hustle.");
    var key = "hustle_grind_" + id;
    if (usedThisYear(key)) return toast("You already put extra hours in this year.");
    markUsed(key);
    var statXp = Math.round(40 + (statVal(def.scaleStat) - 50) * 0.6 + rnd(0, 30));
    r.xp += Math.max(20, statXp);
    r.momentum = clampN(r.momentum + 0.3, 0, 1.2);
    var quickCash = Math.round(levelBase(def, r.level) * (0.05 + Math.random() * 0.12));
    if (quickCash > 0) { gainCash(quickCash); r.totalEarned += quickCash; }
    var stress = def.lowCeiling ? 4 : 2;
    if (r.upg && r.upg.assistant) stress = Math.max(1, Math.round(stress / 2)); // hired help
    applyDeltas({ stress: stress, discipline: 1 });
    checkLevelUp(def, r);
    logLine(def.icon + " You put extra hours into " + def.name + (quickCash ? " (+" + compact(quickCash) + ")" : "") + ".", { money: quickCash || 0, stress: stress });
    saveGame(); rerender();
  };

  window.reinvestHustleV1855 = function (id) {
    var def = defById(id), r = activeRec(id);
    if (!def || !r) return toast("Not running that hustle.");
    var cost = Math.max(500, Math.round(levelBase(def, r.level) * 0.25));
    if (cash() < cost) return toast("Reinvesting needs " + compact(cost) + ".");
    var key = "hustle_reinvest_" + id;
    if (usedThisYear(key)) return toast("Already reinvested this year.");
    markUsed(key);
    spendCash(cost);
    r.invest = clampN(r.invest + 0.06, 0, 0.5);
    r.momentum = clampN(r.momentum + 0.15, 0, 1.2);
    r.xp += 40;
    checkLevelUp(def, r);
    logLine(def.icon + " You reinvested " + compact(cost) + " into " + def.name + " — bigger and more reliable.", { money: -cost });
    toast("📈 Reinvested into " + def.name);
    saveGame(); rerender();
  };

  window.hustleSignatureV1855 = function (id) {
    var def = defById(id), r = activeRec(id);
    if (!def || !r || !def.sig) return toast("No signature move here.");
    var key = "hustle_sig_" + id;
    if (usedThisYear(key)) return toast("You already pulled that move this year.");
    markUsed(key);
    var sig = def.sig;
    var lo = sig.cash[0], hi = sig.cash[1];
    var frac = lo + Math.random() * (hi - lo);
    var amount = Math.round(levelBase(def, r.level) * frac);
    if (amount >= 0) gainCash(amount); else spendCash(-amount);
    r.totalEarned += Math.max(0, amount);
    r.xp += sig.xp || 50;
    r.momentum = clampN(r.momentum + (sig.momentum || 0.3), 0, 1.3);
    var deltas = { money: amount };
    if (sig.fame) deltas.fame = sig.fame;
    if (sig.stress) deltas.stress = sig.stress;
    applyDeltas(sig.fame ? { fame: sig.fame } : {});
    checkLevelUp(def, r);
    var line = sig.lines ? pick(sig.lines) : sig.label + ".";
    logLine(sig.icon + " " + def.name + ": " + line + " (" + (amount >= 0 ? "+" : "") + compact(amount) + ")", deltas);
    toast((amount >= levelBase(def, r.level) ? "💰 " : "✨ ") + def.name + ": " + (amount >= 0 ? "+" : "") + compact(amount));
    saveGame(); rerender();
  };

  window.quitHustleV1855 = function (id) {
    var def = defById(id), h = ensure();
    var idx = -1; for (var i = 0; i < h.active.length; i++) if (h.active[i].id === id) { idx = i; break; }
    if (idx < 0) return toast("Not running that.");
    h.active.splice(idx, 1);
    logLine((def ? def.icon + " " : "") + "You wound down " + (def ? def.name : "a hustle") + ".", { happiness: 1 });
    saveGame(); rerender();
  };

  // At level 5 a hustle can "go pro": a lump sum, a fame bump, and it joins a
  // passive pro-income roster (a stepping stone toward a real company).
  window.goProHustleV1855 = function (id) {
    var def = defById(id), r = activeRec(id), h = ensure();
    if (!def || !r) return toast("Not running that.");
    if (r.level < MAX_LEVEL) return toast("Reach Full Operation first.");
    var lump = Math.round(projectedIncome(def, r) * (1.5 + Math.random()));
    gainCash(lump);
    var idx = h.active.indexOf(r); if (idx >= 0) h.active.splice(idx, 1);
    if (h.pro.indexOf(id) < 0) h.pro.push(id);
    applyDeltas({ fame: 1, confidence: 3 });
    logLine("🏛️ You took " + def.name + " pro — a " + compact(lump) + " payout and a real recurring business.", { money: lump, fame: 1, confidence: 3 });
    toast("🏛️ " + def.name + " went pro! +" + compact(lump));
    saveGame(); rerender();
  };

  function checkLevelUp(def, r) {
    var leveled = false;
    while (r.level < MAX_LEVEL && r.xp >= xpForNext(r.level)) {
      r.level++;
      leveled = true;
    }
    if (leveled) {
      logLine("⭐ " + def.name + " leveled up to " + LEVEL_NAMES[r.level] + "!", { confidence: 1 });
      if (r.level === MAX_LEVEL) toast("⭐ " + def.name + " hit Full Operation — you can take it pro!");
    }
    checkMilestones(def, r);
  }

  // The Entrepreneur special career: commit full-time. Quits your job (no more
  // salary) but supercharges every hustle — bigger income and momentum that
  // barely decays — and shows "Entrepreneur" as your career.
  var FULLTIME_BOOST = 1.4;
  function isFullTime() { return !!ensure().fullTime; }
  window.goFullTimeEntrepreneurV1855 = function () {
    var s = S(), h = ensure();
    if (age() < 18) return toast("Going full-time unlocks at 18.");
    if (!h.active.length && !h.pro.length) return toast("Start at least one hustle first.");
    if (h.fullTime) return toast("You're already full-time.");
    h.fullTime = true;
    try { s.job = { jobId: "entrepreneur_v1855", title: "Entrepreneur", salary: 0, performance: 60, stress: 0, tier: 0, isEntrepreneurV1855: true }; } catch (e) {}
    applyDeltas({ confidence: 4, stress: 5 });
    logLine("💼 You went full-time as an Entrepreneur. No salary now — your hustles ARE the job.", { confidence: 4, stress: 5 });
    toast("💼 Full-time Entrepreneur!");
    saveGame(); rerender();
  };
  window.stepBackEntrepreneurV1855 = function () {
    var s = S(), h = ensure();
    if (!h.fullTime) return toast("You're not full-time.");
    h.fullTime = false;
    try { if (s.job && s.job.isEntrepreneurV1855) s.job = null; } catch (e) {}
    applyDeltas({ stress: -3 });
    logLine("💼 You stepped back from full-time entrepreneurship. Time to find a paycheck again.", { stress: -3 });
    toast("Stepped back to part-time");
    saveGame(); rerender();
  };

  window.setFocusHustleV1855 = function (id) {
    var h = ensure();
    if (!activeRec(id)) return toast("Not running that.");
    h.focusId = (h.focusId === id) ? null : id;
    var def = defById(id);
    toast(h.focusId === id ? "🎯 Focusing on " + (def ? def.name : "it") : "Focus cleared");
    saveGame(); rerender();
  };

  // ----------------------------------------------------------- yearly tick ---
  // Each active hustle earns, momentum decays, level progresses from earnings,
  // and small auto-events nudge momentum/cash. Pro hustles earn passively.
  var EVENTS = [
    { id: "viral", good: true, icon: "🔥", chance: 0.06, m: 0.3, cashF: [0.1, 0.4], line: "caught a viral moment" },
    { id: "loyal", good: true, icon: "🤝", chance: 0.07, m: 0.15, cashF: [0.05, 0.15], line: "a loyal client sent referrals" },
    { id: "feature", good: true, icon: "📰", chance: 0.04, m: 0.25, cashF: [0.08, 0.25], line: "got featured somewhere" },
    { id: "slow", good: false, icon: "🐌", chance: 0.08, m: -0.2, cashF: [0, 0], line: "hit a slow season" },
    { id: "platform", good: false, icon: "📉", chance: 0.05, m: -0.25, cashF: [-0.1, 0], line: "a platform change hurt reach" },
    { id: "burnout", good: false, icon: "😮‍💨", chance: 0.04, m: -0.15, cashF: [0, 0], line: "burnout crept in", stress: 4 }
  ];
  function tickYear() {
    try {
      var s = S(), h = ensure();
      if (h._lastTickAge === s.age) return;
      h._lastTickAge = s.age;
      var total = 0;
      // active hustles
      h.active.forEach(function (r) {
        var def = defById(r.id); if (!def) return;
        var inc = rollIncome(def, r);
        r.lastIncome = inc;
        r.totalEarned += Math.max(0, inc);
        total += inc;
        // earnings convert to a little progress; momentum decays if not worked
        r.xp += Math.round(Math.abs(inc) / Math.max(1, levelBase(def, 1)) * 18);
        var decay = (isFocus(r.id) || isFullTime() || (r.upg && r.upg.automate)) ? 0.10 : 0.16;
        var floor = (r.upg && r.upg.brand) ? 0.2 : 0;
        r.momentum = clampN(r.momentum - decay, floor, 1.3);
        checkLevelUp(def, r);
        // auto-event
        for (var i = 0; i < EVENTS.length; i++) {
          var e = EVENTS[i];
          if (chance(e.chance)) {
            r.momentum = clampN(r.momentum + e.m, 0, 1.3);
            var ec = Math.round(levelBase(def, r.level) * (e.cashF[0] + Math.random() * (e.cashF[1] - e.cashF[0])));
            if (ec) { total += ec; r.totalEarned += Math.max(0, ec); }
            if (e.stress) applyDeltas({ stress: e.stress });
            logLine(e.icon + " " + def.name + " " + e.line + (ec ? " (" + (ec >= 0 ? "+" : "") + compact(ec) + ")" : "") + ".", ec ? { money: ec } : {});
            break;
          }
        }
      });
      // pro hustles earn passively at a strong, steady rate
      h.pro.forEach(function (id) {
        var def = defById(id); if (!def) return;
        var inc = Math.round(levelBase(def, MAX_LEVEL) * (0.9 + statBonus(def)) * (0.85 + Math.random() * 0.3));
        total += inc;
      });
      if (h.fullTime) total = Math.round(total * FULLTIME_BOOST); // full-time focus pays off
      total = Math.round(total);
      if (total !== 0) {
        gainCash(total);
        h.lifetimeEarned = Math.round(h.lifetimeEarned + Math.max(0, total));
        var cnt = h.active.length + h.pro.length;
        logLine("💼 Your " + cnt + " " + (h.fullTime ? "full-time " : "") + "hustle" + (cnt === 1 ? "" : "s") + " earned " + compact(total) + " this year.", { money: total });
      }
    } catch (e) {}
  }
  var prevResolve = window.resolveLifeAndFinanceYear || (typeof resolveLifeAndFinanceYear === "function" ? resolveLifeAndFinanceYear : null);
  if (prevResolve && !window.__ledgerHustlesResolveWrapped) {
    window.__ledgerHustlesResolveWrapped = true;
    window.resolveLifeAndFinanceYear = function () {
      var out = prevResolve.apply(this, arguments);
      tickYear();
      return out;
    };
    try { resolveLifeAndFinanceYear = window.resolveLifeAndFinanceYear; } catch (e) {}
  }

  // ----------------------------------------------------------------- render --
  function btn(label, onclick, kind, disabled) {
    return '<button class="money-btn ' + esc(kind || "") + '" onclick="event.preventDefault();event.stopPropagation();' + onclick + '" ' + (disabled ? "disabled" : "") + '>' + esc(label) + '</button>';
  }
  function bar(frac, cls) {
    var p = Math.max(0, Math.min(100, Math.round(frac * 100)));
    return '<div class="hus-bar"><div class="hus-fill ' + esc(cls || "") + '" style="width:' + p + '%"></div></div>';
  }
  function activeCard(r) {
    var def = defById(r.id); if (!def) return "";
    var proj = projectedIncome(def, r);
    var nextXp = xpForNext(r.level);
    var prevXp = LEVEL_XP[r.level] || 0;
    var lvlFrac = r.level >= MAX_LEVEL ? 1 : (r.xp - prevXp) / Math.max(1, nextXp - prevXp);
    var stat = def.scaleStat;
    var grindUsed = usedThisYear("hustle_grind_" + r.id);
    var reinvUsed = usedThisYear("hustle_reinvest_" + r.id);
    var sigUsed = usedThisYear("hustle_sig_" + r.id);
    var reinvCost = Math.max(500, Math.round(levelBase(def, r.level) * 0.25));
    var mom = clampN(r.momentum, 0, 1.3);
    var momLabel = mom >= 0.9 ? "On fire" : mom >= 0.55 ? "Strong" : mom >= 0.3 ? "Steady" : "Fading";
    var focused = isFocus(r.id);
    var ms = milestonesHitCount(r);
    var msStars = ms ? ' · ' + Array(ms + 1).join("🏅") : "";
    return '<div class="hus-card lvl-' + r.level + (focused ? " focused" : "") + '">' +
      (focused ? '<div class="hus-focus-tag">🎯 Focus</div>' : "") +
      '<div class="hus-head"><div class="hus-ic">' + def.icon + '</div><div class="hus-titles"><b>' + esc(def.name) + '</b>' +
        '<span class="hus-sub">' + LEVEL_NAMES[r.level] + ' · Lv ' + r.level + '/5 · scales with ' + esc(stat) + msStars + '</span></div>' +
        '<div class="hus-inc"><b>' + compact(r.lastIncome || proj) + '</b><em>last yr</em></div></div>' +
      '<div class="hus-stat-row"><span>Level</span>' + bar(lvlFrac, "gold") + '<small>' + (r.level >= MAX_LEVEL ? "MAX" : compact(r.xp) + "/" + compact(nextXp) + " xp") + '</small></div>' +
      '<div class="hus-stat-row"><span>Momentum</span>' + bar(mom / 1.3, mom >= 0.55 ? "good" : "bad") + '<small>' + momLabel + '</small></div>' +
      '<div class="hus-meta">Projected next year ~' + compact(proj) + ' · lifetime ' + compact(r.totalEarned) + (r.perk > 0 ? ' · +' + Math.round(r.perk * 100) + '% perks' : '') + '</div>' +
      '<div class="hus-upgrades">' + UPGRADE_ORDER.map(function (upId) {
        var u = UPGRADES[upId], have = r.upg && r.upg[upId];
        if (have) return '<span class="hus-upg owned">' + u.icon + ' ' + esc(u.name) + '</span>';
        var c = upgradeCost(def, r, upId);
        return '<button class="hus-upg" title="' + esc(u.desc) + '" onclick="event.preventDefault();event.stopPropagation();buyHustleUpgradeV1855(\'' + esc(r.id) + '\',\'' + upId + '\')" ' + (cash() < c ? "disabled" : "") + '>' + u.icon + ' ' + esc(u.name) + ' · ' + compact(c) + '</button>';
      }).join("") + '</div>' +
      '<div class="hus-actions">' +
        btn((def.sig.icon || "✨") + " " + def.sig.label, "hustleSignatureV1855('" + esc(r.id) + "')", "gold", sigUsed) +
        btn("💪 Grind", "grindHustleV1855('" + esc(r.id) + "')", "blue", grindUsed) +
        btn("📈 Reinvest " + compact(reinvCost), "reinvestHustleV1855('" + esc(r.id) + "')", "green", reinvUsed || cash() < reinvCost) +
        btn(focused ? "🎯 Focused" : "🎯 Focus", "setFocusHustleV1855('" + esc(r.id) + "')", focused ? "gold" : "", false) +
        (r.level >= MAX_LEVEL ? btn("🏛️ Go Pro", "goProHustleV1855('" + esc(r.id) + "')", "gold", false) : "") +
        btn("Quit", "quitHustleV1855('" + esc(r.id) + "')", "red", false) +
      '</div></div>';
  }
  function availableCard(def) {
    var locked = age() < (def.minAge || 0);
    var afford = cash() >= (def.startCost || 0);
    var tags = [];
    if (def.passive) tags.push("Passive");
    if (def.risky) tags.push("High risk");
    if (def.highCeiling) tags.push("High ceiling");
    if (def.lowCeiling) tags.push("Low ceiling");
    var note = locked ? "Unlocks at " + def.minAge : (def.startCost ? "Start " + compact(def.startCost) : "Free to start");
    return '<div class="hus-card avail">' +
      '<div class="hus-head"><div class="hus-ic">' + def.icon + '</div><div class="hus-titles"><b>' + esc(def.name) + '</b>' +
        '<span class="hus-sub">' + esc(def.cat) + ' · scales with ' + esc(def.scaleStat) + (tags.length ? ' · ' + esc(tags.join(", ")) : "") + '</span></div></div>' +
      '<div class="hus-desc">' + esc(def.desc) + '</div>' +
      '<div class="hus-meta">~' + compact(def.incomeBase) + '/yr to start · grows to ~' + compact(levelBase(def, MAX_LEVEL)) + '/yr</div>' +
      '<div class="hus-actions"><span class="hus-start-note">' + esc(note) + '</span>' +
        btn("Start", "startHustleV1855('" + esc(def.id) + "')", "gold", locked || !afford) + '</div></div>';
  }

  function careerBanner() {
    var h = ensure();
    var canGo = age() >= 18 && (h.active.length || h.pro.length);
    if (h.fullTime) {
      return '<section class="hus-career on"><div><div class="hus-career-title">💼 Full-Time Entrepreneur</div><div class="hus-career-sub">No salary — your hustles are your career, earning +' + Math.round((FULLTIME_BOOST - 1) * 100) + '% with momentum that barely fades.</div></div>' +
        '<div class="hus-career-act">' + btn("Step Back to a Job", "stepBackEntrepreneurV1855()", "", false) + '</div></section>';
    }
    return '<section class="hus-career"><div><div class="hus-career-title">💼 Go Full-Time?</div><div class="hus-career-sub">' +
      (canGo ? "Quit your job and make entrepreneurship your career: +" + Math.round((FULLTIME_BOOST - 1) * 100) + "% hustle income and lasting momentum — but no more salary." : "Reach 18 and start a hustle to unlock the full-time Entrepreneur career.") + '</div></div>' +
      '<div class="hus-career-act">' + btn("Go Full-Time", "goFullTimeEntrepreneurV1855()", "gold", !canGo) + '</div></section>';
  }

  function renderHustlesHub() {
    var h = ensure();
    var activeIncome = h.active.reduce(function (s, r) { return s + (r.lastIncome || 0); }, 0);
    var heroIncome = h.fullTime ? Math.round(activeIncome * FULLTIME_BOOST) : activeIncome;
    var hero = '<section class="hus-hero"><div><div class="hus-kicker">💼 Entrepreneurship</div><h2>The Grind</h2><p>Start small, work it up, ride the momentum. Every hustle scales off one of your stats and earns each year — the ones you tend pull ahead. Hit Full Operation and take it pro, or go full-time and make it your career.</p>' +
      '<div class="hus-chips"><span class="gold">Cash ' + compact(cash()) + '</span><span>' + (h.fullTime ? "Full-time" : "Side") + '</span><span>Active ' + h.active.length + '</span><span>Pro ' + h.pro.length + '</span><span>Lifetime ' + compact(h.lifetimeEarned) + '</span></div></div>' +
      '<strong>' + compact(heroIncome) + '<span>income / yr</span></strong></section>';

    var bizLink = '<section class="hus-section"><div class="hus-bizlink" onclick="event.preventDefault();event.stopPropagation();setTab(\'business\')"><div><b>🏢 Ready for a real company?</b><span>Incorporate, hire teams, and run formal businesses in the Business hub.</span></div>' + btn("Open Business →", "setTab('business')", "blue", false) + '</div></section>';

    var activeSection = h.active.length
      ? '<section class="hus-section"><div class="hus-section-head">🔧 Your Hustles <span>' + h.active.length + ' running</span></div><div class="hus-grid">' + h.active.map(activeCard).join("") + '</div></section>'
      : '<section class="hus-section"><div class="hus-section-head">🔧 Your Hustles</div><div class="hus-empty">No hustles yet. Pick one below — most cost little or nothing to start.</div></section>';

    var proSection = h.pro.length
      ? '<section class="hus-section"><div class="hus-section-head">🏛️ Gone Pro <span>passive income</span></div><div class="hus-pro-row">' + h.pro.map(function (id) { var d = defById(id); return d ? '<span class="hus-pro-pill">' + d.icon + " " + esc(d.name) + '</span>' : ""; }).join("") + '</div></section>'
      : "";

    var avail = HUSTLES.filter(function (d) { return !isActive(d.id) && !isPro(d.id); });
    var byCat = {};
    avail.forEach(function (d) { (byCat[d.cat] = byCat[d.cat] || []).push(d); });
    var availSection = '<section class="hus-section"><div class="hus-section-head">🚀 Start a Hustle <span>' + avail.length + ' available</span></div>' +
      Object.keys(byCat).map(function (cat) {
        return '<div class="hus-cat-label">' + esc(cat) + '</div><div class="hus-grid">' + byCat[cat].map(availableCard).join("") + '</div>';
      }).join("") + '</section>';

    return '<div class="hus-shell">' + hero + careerBanner() + activeSection + proSection + availSection + bizLink + '</div>';
  }
  window.renderHustlesHubV1855 = renderHustlesHub;

  // ------------------------------------------------------------- hub wiring --
  // hustles.js loads after business-entities.js, so claiming the "entrepreneurship"
  // ids here makes this the Entrepreneurship home (the old founder-paths hub is
  // reachable via the Business link inside).
  function isHustleHub(id) {
    return id === "hustles" || id === "hustle" || id === "sidehustle" || id === "entrepreneurship" || id === "entrepreneur" || id === "founder" || id === "startup";
  }
  var previousRenderHubContent = window.renderHubContent || (typeof renderHubContent === "function" ? renderHubContent : null);
  window.renderHubContent = function (hubId) {
    var id = String(hubId || "").toLowerCase();
    if (isHustleHub(id)) return renderHustlesHub();
    return previousRenderHubContent ? previousRenderHubContent.apply(this, arguments) : "";
  };
  try { renderHubContent = window.renderHubContent; } catch (e) {}

  var previousRenderHubOverlay = window.renderHubOverlay || (typeof renderHubOverlay === "function" ? renderHubOverlay : null);
  if (typeof previousRenderHubOverlay === "function") {
    window.renderHubOverlay = function (hubId) {
      var html = previousRenderHubOverlay.apply(this, arguments);
      var id = String(hubId || "").toLowerCase();
      if (isHustleHub(id)) html = String(html).replace(/<h2>[^<]*<\/h2>/, "<h2>Entrepreneurship</h2>");
      return html;
    };
    try { renderHubOverlay = window.renderHubOverlay; } catch (e) {}
  }

  // ------------------------------------------------------------------ styles --
  try {
    if (typeof document !== "undefined" && document.head && !document.getElementById("ledger-hustles-v1855-style")) {
      var st = document.createElement("style");
      st.id = "ledger-hustles-v1855-style";
      st.textContent = [
        ".hus-shell{display:grid;gap:15px;padding:4px 0 96px;color:var(--ink,#f3efe4);min-width:0}.hus-shell *{box-sizing:border-box}",
        ".hus-hero{position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:end;border:1px solid rgba(185,220,138,.32);border-radius:18px;background:radial-gradient(circle at 10% 0,rgba(159,208,125,.18),transparent 40%),linear-gradient(135deg,rgba(26,38,24,.96),rgba(19,17,13,.98));padding:20px;overflow:hidden;box-shadow:0 18px 48px rgba(0,0,0,.3)}",
        ".hus-kicker{font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.24em;color:var(--good,#9fd07d);font-size:9px;font-weight:800}",
        ".hus-hero h2{margin:6px 0 7px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:700;font-size:38px;line-height:.95;color:var(--ink,#fff3df)}.hus-hero p{margin:0;max-width:760px;color:var(--dim,#cdbf9f);font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.6}",
        ".hus-hero strong{display:grid;place-items:center;min-width:150px;min-height:90px;border:1px solid rgba(159,208,125,.4);border-radius:14px;background:rgba(0,0,0,.28);color:var(--good,#9fd07d);font-family:Georgia,serif;font-size:24px}.hus-hero strong span{display:block;font-family:'JetBrains Mono',monospace;font-size:8px;text-transform:uppercase;letter-spacing:.14em;color:var(--faint,#9a8c74);margin-top:6px}",
        ".hus-chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:13px}.hus-chips span{border:1px solid rgba(255,255,255,.13);border-radius:999px;background:rgba(255,255,255,.05);padding:6px 10px;color:var(--dim,#cdbf9f);font-family:'JetBrains Mono',monospace;font-size:10px}.hus-chips .gold{color:var(--accent,#f0ca7b);border-color:rgba(201,155,85,.4)}",
        ".hus-section{border:1px solid var(--line,#3a3128);border-radius:16px;background:linear-gradient(135deg,rgba(34,30,23,.9),rgba(20,17,13,.96));padding:16px}.hus-section-head{font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.14em;color:var(--accent,#d8b16e);font-size:11px;margin-bottom:13px;display:flex;justify-content:space-between;gap:8px;align-items:baseline}.hus-section-head span{color:var(--faint,#9a8c74);font-size:9px}",
        ".hus-cat-label{font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.12em;color:var(--faint,#9a8c74);font-size:9px;margin:12px 0 8px}",
        ".hus-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:12px}",
        ".hus-card{position:relative;border:1px solid rgba(255,255,255,.1);border-radius:14px;background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02));padding:13px;display:flex;flex-direction:column;gap:9px;min-width:0;transition:border-color .16s ease,transform .16s ease}.hus-card:hover{border-color:rgba(201,155,85,.4)}.hus-card.lvl-5{border-color:rgba(201,155,85,.5);box-shadow:inset 0 0 0 1px rgba(201,155,85,.18)}.hus-card.focused{border-color:rgba(159,208,125,.6);box-shadow:inset 0 0 0 1px rgba(159,208,125,.25)}",
        ".hus-focus-tag{position:absolute;top:-1px;right:-1px;background:rgba(159,208,125,.16);border:1px solid rgba(159,208,125,.5);border-radius:0 14px 0 10px;color:var(--good,#9fd07d);font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:800;letter-spacing:.08em;padding:4px 8px}",
        ".hus-head{display:flex;gap:11px;align-items:center}.hus-ic{flex:0 0 auto;width:46px;height:46px;display:grid;place-items:center;font-size:24px;border-radius:11px;background:radial-gradient(circle at 50% 38%,rgba(201,155,85,.14),transparent 62%),rgba(0,0,0,.2)}.hus-titles{min-width:0;flex:1}.hus-titles b{display:block;font-family:Georgia,serif;font-size:16px;color:var(--ink,#fff3df);line-height:1.15}.hus-sub{display:block;font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--faint,#9a8c74);margin-top:2px;text-transform:capitalize}",
        ".hus-inc{text-align:right}.hus-inc b{display:block;font-family:'JetBrains Mono',monospace;color:var(--good,#9fd07d);font-size:15px}.hus-inc em{font-style:normal;font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--faint,#9a8c74);text-transform:uppercase;letter-spacing:.1em}",
        ".hus-stat-row{display:grid;grid-template-columns:64px 1fr auto;gap:8px;align-items:center}.hus-stat-row>span{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--faint,#9a8c74);text-transform:uppercase;letter-spacing:.08em}.hus-stat-row small{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--dim,#cdbf9f);white-space:nowrap}",
        ".hus-bar{height:7px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden}.hus-fill{height:100%;border-radius:999px;background:var(--dim,#aa9a82)}.hus-fill.gold{background:linear-gradient(90deg,#c99b55,#f0ca7b)}.hus-fill.good{background:linear-gradient(90deg,#6f9a4f,#9fd07d)}.hus-fill.bad{background:linear-gradient(90deg,#7a5a4a,#e58b76)}",
        ".hus-meta{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--dim,#cdbf9f);line-height:1.45}.hus-desc{font-family:'JetBrains Mono',monospace;font-size:10.5px;color:var(--dim,#cdbf9f);line-height:1.5}",
        ".hus-actions{margin-top:auto;display:flex;gap:7px;flex-wrap:wrap;align-items:center}.hus-start-note{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--faint,#9a8c74);margin-right:auto}",
        ".hus-upgrades{display:flex;gap:6px;flex-wrap:wrap}.hus-upg{font-family:'JetBrains Mono',monospace;font-size:9px;border:1px solid rgba(255,255,255,.14);border-radius:8px;background:rgba(255,255,255,.04);color:var(--dim,#cdbf9f);padding:5px 8px;cursor:pointer;transition:all .14s}.hus-upg:hover:not(:disabled){border-color:rgba(201,155,85,.5);color:var(--ink,#fff3df)}.hus-upg:disabled{opacity:.4;cursor:not-allowed}.hus-upg.owned{border-color:rgba(159,208,125,.45);background:rgba(159,208,125,.1);color:var(--good,#9fd07d);cursor:default}",
        ".hus-empty{border:1px dashed rgba(255,255,255,.14);border-radius:10px;padding:13px;color:var(--faint,#9a8c74);font-family:'JetBrains Mono',monospace;font-size:11px}",
        ".hus-pro-row{display:flex;flex-wrap:wrap;gap:8px}.hus-pro-pill{border:1px solid rgba(201,155,85,.45);border-radius:999px;background:rgba(201,155,85,.1);color:var(--accent,#f0ca7b);font-family:'JetBrains Mono',monospace;font-size:11px;padding:7px 12px}",
        ".hus-career{display:flex;justify-content:space-between;align-items:center;gap:14px;border:1px solid rgba(201,155,85,.32);border-radius:14px;background:linear-gradient(135deg,rgba(40,33,24,.7),rgba(20,17,13,.92));padding:14px 16px}.hus-career.on{border-color:rgba(159,208,125,.5);background:linear-gradient(135deg,rgba(26,38,24,.8),rgba(19,17,13,.94))}.hus-career-title{font-family:Georgia,serif;font-size:17px;color:var(--ink,#fff3df)}.hus-career-sub{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--dim,#cdbf9f);line-height:1.5;margin-top:3px;max-width:620px}.hus-career-act{flex:0 0 auto}",
        ".hus-bizlink{display:flex;justify-content:space-between;align-items:center;gap:14px;cursor:pointer}.hus-bizlink b{display:block;font-family:Georgia,serif;font-size:15px;color:var(--ink,#fff3df)}.hus-bizlink span{display:block;font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--dim,#cdbf9f);margin-top:3px}",
        "@media(max-width:720px){.hus-hero{grid-template-columns:1fr;padding:16px}.hus-hero h2{font-size:31px}.hus-hero strong{place-items:start;min-width:0;padding:12px}}"
      ].join("\n");
      document.head.appendChild(st);
    }
  } catch (e) {}
})();
