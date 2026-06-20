/* ============================================================================
 * business-events.js  (v18.36 — Living Businesses)
 * ----------------------------------------------------------------------------
 * Turns silent yearly market-event log lines into interactive, sector-flavored
 * popup moments. Each sector has its own pool of events; the player chooses how
 * to respond, and each choice applies its own cost / reputation / value / risk
 * outcome. Falls back to a generic pool for sectors with nothing tagged yet.
 *
 * Design adapted from a queue-based event-popup pattern: events stack and show
 * one at a time, the popup is recolored by outcome type (good/bad/major), and a
 * persistent named rival per business gives market events a recurring antagonist
 * instead of an anonymous "a competitor opened nearby."
 *
 * Loads AFTER business-sectors.js. Touches the core runtime through exactly one
 * guarded call site (window.rollBizEventV1852). All effects live here.
 *
 * Exposes:
 *   window.rollBizEventV1852(b)  - maybe queue an event for business b; returns
 *                                  true if it took over this year's market event.
 *   window.queueBizEvent(cfg)    - low-level: queue a prepared popup cfg.
 *   window.flushBizEvents()      - show the next queued popup if idle.
 * ========================================================================== */
(function () {
  "use strict";
  if (window.__ledgerBizEventsV1852Loaded) return;
  window.__ledgerBizEventsV1852Loaded = true;

  // ---------------------------------------------------------------- helpers --
  function S() { try { if (typeof state !== "undefined" && state) return state; } catch (e) {} return window.state || {}; }
  function clampN(v, a, b) { v = Number(v); if (!Number.isFinite(v)) v = 0; return Math.max(a, Math.min(b, v)); }
  function rnd(a, b) { try { if (typeof window.rand === "function") return window.rand(a, b); } catch (e) {} return a + Math.floor(Math.random() * (b - a + 1)); }
  function chance(p) { try { if (typeof window.chance === "function") return window.chance(p); } catch (e) {} return Math.random() < p; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }
  function money(v) {
    v = Math.round(Number(v) || 0);
    try { if (typeof window.money === "function") return window.money(v); } catch (e) {}
    return (v < 0 ? "-$" : "$") + Math.abs(v).toLocaleString();
  }
  function logLine(text, deltas) { try { if (typeof window.addLog === "function") window.addLog(text, deltas || {}); } catch (e) {} }
  function applyDeltas(d) { try { if (d && Object.keys(d).length && typeof window.applyDeltas === "function") window.applyDeltas(d); } catch (e) {} }
  function rerender() { try { if (typeof window.render === "function") window.render(); } catch (e) {} }
  function saveGame() { try { if (typeof window.save === "function") window.save(); } catch (e) {} }

  // ---------------------------------------------------------------- sectors --
  function sectorName(b) {
    try { if (window.SECTOR_OF && b && window.SECTOR_OF[b.id]) return window.SECTOR_OF[b.id]; } catch (e) {}
    return (b && (b.sector || b.category)) || null;
  }
  function sectorId(b) {
    var nm = sectorName(b);
    try {
      if (window.LEDGER_SECTORS && nm) {
        var s = window.LEDGER_SECTORS.find(function (x) { return x.name === nm || x.id === nm; });
        if (s) return s.id;
      }
    } catch (e) {}
    // soft guesses for unmapped legacy ids
    var id = (b && b.id) || "";
    if (/club|bar|night|event/i.test(id)) return "nightlife";
    if (/food|truck|hospitality|restaurant/i.test(id)) return "food";
    if (/saas|startup|tech|software/i.test(id)) return "tech";
    if (/fund|equity|consult|hedge|capital/i.test(id)) return "finance";
    if (/realt|estate|property/i.test(id)) return "realestate";
    if (/lawn|contract|carwash|clean/i.test(id)) return "trades";
    if (/media|record|film|talent|content|print/i.test(id)) return "media";
    if (/resale|ecom|retail|store/i.test(id)) return "retail";
    if (/medical|clinic|health/i.test(id)) return "health";
    if (/logistic|fleet|vending|aircraft/i.test(id)) return "logistics";
    return null;
  }

  // ----------------------------------------------------------------- rivals --
  var RIVAL_NAMES = {
    food: ["Sunrise Diner", "The Copper Fork", "Nonna's Kitchen", "Brick & Barrel", "Two Birds Cafe"],
    nightlife: ["Velvet Room", "Pulse", "After Hours", "The Hideaway", "Neon Owl"],
    retail: ["MarketMile", "ShopSphere", "The Corner Co.", "Trendline", "Goods & Co."],
    trades: ["Apex Services", "Reliable & Sons", "TrueBuild", "First Call", "Ironwood Trades"],
    media: ["Loud Collective", "Frame 9", "Signal Studios", "Northwind Media", "Echo House"],
    tech: ["Cloudpeak", "Nexan", "Brightloop", "Forge Labs", "Quanta"],
    finance: ["Sterling Partners", "Hargrove Capital", "Meridian Advisory", "Oakline", "Ascend Group"],
    realestate: ["Keystone Holdings", "Summit Property", "Halcyon Estates", "Granite & Co.", "Lakeshore Realty"],
    health: ["Vitality Clinic", "Cedar Health", "Wellspring", "NovaCare", "Harbor Medical"],
    logistics: ["SwiftHaul", "Cargo North", "Velocity Freight", "Ironline Logistics", "Pier 7"]
  };
  function rivalName(b) {
    if (b.rivalNameV1852) return b.rivalNameV1852;
    var pool = RIVAL_NAMES[sectorId(b)] || ["Apex Co.", "Northgate", "Vantage Group", "Crest & Co."];
    b.rivalNameV1852 = pick(pool);
    return b.rivalNameV1852;
  }

  // ------------------------------------------------------------- size & fx ---
  // Most costs/payouts scale off the business's own value, with a floor so a
  // tiny lawn-care hustle and a hedge fund both get proportionate stakes.
  function sizeOf(b) { return Math.max(2500, Math.round(Number(b && b.value) || 0)); }
  function fee(b, frac, floor) { return Math.max(floor || 200, Math.round(sizeOf(b) * frac)); }

  // The single outcome primitive every choice calls. Mutates the business,
  // applies player-stat/money deltas, and writes one flavored log line.
  function resolve(b, o) {
    o = o || {};
    if (o.rep) b.reputation = clampN((b.reputation || 10) + o.rep, 0, 100);
    if (o.valueMult) b.value = Math.max(0, Math.round((b.value || 0) * o.valueMult));
    if (o.repBump) b.reputation = clampN((b.reputation || 10) + o.repBump, 0, 100);
    var deltas = {};
    if (o.money) deltas.money = Math.round(o.money);
    if (o.stress) deltas.stress = o.stress;
    if (o.confidence) deltas.confidence = o.confidence;
    if (o.fame) deltas.fame = o.fame;
    if (o.happiness) deltas.happiness = o.happiness;
    applyDeltas(deltas);
    // record on the business's own event history so the card can show a trail
    try {
      if (!Array.isArray(b.eventHistoryV1850)) b.eventHistoryV1850 = [];
      b.eventHistoryV1850.unshift({ age: S().age, icon: o.icon || "📌", event: o.log || "" });
      b.eventHistoryV1850 = b.eventHistoryV1850.slice(0, 10);
    } catch (e) {}
    var nm = (b && b.name) || "Your business";
    var line = ((o.icon ? o.icon + " " : "") + nm + ": " + (o.log || "")).trim();
    logLine(line, deltas);
  }

  // ----------------------------------------------------------- event pools ---
  // Each entry is a factory: (b) => { type, icon, title, body, choices:[...] }.
  // A choice is { text, hint, apply:(b)=>void }. Numbers are resolved per call
  // so the popup body can show the actual amounts.
  function ev(weight, factory) { return { weight: weight, build: factory }; }

  var SECTOR_EVENTS = {
    food: [
      ev(3, function (b) {
        var fine = fee(b, 0.05, 800);
        return {
          type: "bad", icon: "🥡", title: "Surprise Health Inspection",
          body: "An inspector showed up unannounced and flagged the kitchen. How do you handle it?",
          choices: [
            { text: "Fix everything to code — " + money(fine), hint: "Costs cash, protects reputation",
              apply: function (b) { resolve(b, { icon: "🥡", money: -fine, rep: +3, stress: 3, log: "Passed re-inspection after fixing the kitchen to code." }); } },
            { text: "Slip the inspector something", hint: "Cheap if it works — risky if it doesn't",
              apply: function (b) {
                if (chance(0.55)) resolve(b, { icon: "🥡", money: -fee(b, 0.01, 150), log: "Greased a palm and the report quietly disappeared." });
                else resolve(b, { icon: "🚔", money: -fee(b, 0.12, 1500), rep: -10, stress: 8, log: "The bribe backfired — fines and a write-up in the local paper." });
              } },
            { text: "Ignore it and hope", hint: "Free now, reputation roulette",
              apply: function (b) {
                if (chance(0.4)) resolve(b, { icon: "🥡", rep: -2, log: "Nothing came of it this time. You got lucky." });
                else resolve(b, { icon: "⚠️", rep: -12, valueMult: 0.94, stress: 6, log: "A failing grade got posted in the window. Customers noticed." });
              } }
          ]
        };
      }),
      ev(2, function (b) {
        var payout = fee(b, 0.09, 600);
        return {
          type: "good", icon: "⭐", title: "A Critic Walked In",
          body: "A well-followed food critic ate here last night — unannounced.",
          choices: [
            { text: "Comp their meal and charm them", hint: "Small cost, bigger upside",
              apply: function (b) {
                if (chance(0.7)) resolve(b, { icon: "⭐", money: payout - fee(b, 0.01, 80), rep: +9, valueMult: 1.05, fame: 1, log: "The review raved. A line out the door for weeks." });
                else resolve(b, { icon: "⭐", rep: +2, money: -fee(b, 0.01, 80), log: "The review was lukewarm, but no harm done." });
              } },
            { text: "Treat them like any other table", hint: "Let the food speak",
              apply: function (b) {
                if (chance(0.5)) resolve(b, { icon: "⭐", money: payout, rep: +6, log: "An honest, glowing review. Bookings jumped." });
                else resolve(b, { icon: "📝", rep: -3, log: "They dinged you on service. Fair enough." });
              } }
          ]
        };
      })
    ],

    nightlife: [
      ev(3, function (b) {
        var fine = fee(b, 0.06, 1200);
        return {
          type: "bad", icon: "🚒", title: "Fire Marshal at the Door",
          body: "You're packed past capacity on the biggest night of the year. The fire marshal is outside.",
          choices: [
            { text: "Pay the fine, turn people away — " + money(fine), hint: "Lose a night, keep the license",
              apply: function (b) { resolve(b, { icon: "🚒", money: -fine, rep: +1, stress: 4, log: "Paid the fine and cleared the overflow. License intact." }); } },
            { text: "Slip the marshal a 'donation'", hint: "Gamble on looking the other way",
              apply: function (b) {
                if (chance(0.5)) resolve(b, { icon: "🌙", money: -fee(b, 0.015, 300), rep: +3, log: "He looked the other way. The night was electric." });
                else resolve(b, { icon: "🚔", money: -fee(b, 0.15, 3000), rep: -14, valueMult: 0.9, stress: 10, log: "Shut down on the spot and reported. Brutal night." });
              } },
            { text: "Keep the doors open anyway", hint: "Maximum buzz, maximum risk",
              apply: function (b) {
                if (chance(0.35)) resolve(b, { icon: "🔥", money: fee(b, 0.1, 800), rep: +6, fame: 1, log: "Legendary night. Nobody got caught." });
                else resolve(b, { icon: "🚨", money: -fee(b, 0.2, 4000), rep: -18, valueMult: 0.85, stress: 12, log: "Raided mid-set. The fallout was ugly." });
              } }
          ]
        };
      }),
      ev(2, function (b) {
        var rival = rivalName(b);
        return {
          type: "neutral", icon: "🎧", title: rival + " Is Stealing Your Crowd",
          body: rival + " opened down the street and poached your Friday regulars. Response?",
          choices: [
            { text: "Book a headliner to win them back", hint: money(fee(b, 0.08, 1500)) + " upfront",
              apply: function (b) {
                if (chance(0.65)) resolve(b, { icon: "🎧", money: fee(b, 0.05, 500) - fee(b, 0.08, 1500), rep: +8, valueMult: 1.05, log: "The headliner sold out. " + rivalName(b) + " went quiet." });
                else resolve(b, { icon: "🎧", money: -fee(b, 0.08, 1500), rep: +2, log: "Decent turnout, but you barely broke even on the booking." });
              } },
            { text: "Undercut them on drink prices", hint: "Win the crowd, thin the margins",
              apply: function (b) { resolve(b, { icon: "🍸", money: -fee(b, 0.03, 400), rep: +4, log: "Cheap drinks pulled the crowd back — for now." }); } },
            { text: "Let them burn out", hint: "Do nothing",
              apply: function (b) {
                if (chance(0.5)) resolve(b, { icon: "🌙", rep: -3, log: rivalName(b) + " kept eating your numbers all year." });
                else resolve(b, { icon: "🌙", rep: +2, log: rivalName(b) + " overspent and fizzled. You held steady." });
              } }
          ]
        };
      })
    ],

    tech: [
      ev(3, function (b) {
        var cost = fee(b, 0.07, 4000);
        return {
          type: "bad", icon: "🔓", title: "Data Breach",
          body: "A vulnerability leaked customer data. The clock is ticking before it goes public.",
          choices: [
            { text: "Disclose immediately, hire a firm — " + money(cost), hint: "Expensive, but honest",
              apply: function (b) { resolve(b, { icon: "🔓", money: -cost, rep: +4, stress: 6, log: "Owned the breach publicly. Customers respected the transparency." }); } },
            { text: "Quietly patch and say nothing", hint: "Save face — if it stays buried",
              apply: function (b) {
                if (chance(0.5)) resolve(b, { icon: "💻", money: -fee(b, 0.02, 800), log: "Patched it before anyone noticed. Crisis averted." });
                else resolve(b, { icon: "📰", money: -fee(b, 0.16, 9000), rep: -16, valueMult: 0.85, stress: 12, log: "A journalist broke the cover-up. Trust cratered." });
              } }
          ]
        };
      }),
      ev(2, function (b) {
        var raise = fee(b, 0.25, 8000);
        return {
          type: "major", icon: "💸", title: "A VC Wants In",
          body: "A venture fund offered " + money(raise) + " for a slice of equity. Take the money?",
          choices: [
            { text: "Take the round and scale fast", hint: "Cash now, dilution later",
              apply: function (b) { resolve(b, { icon: "💸", money: raise, valueMult: 1.18, rep: +5, fame: 1, stress: 4, confidence: 2, log: "Closed the round. Hiring spree on. Growth on the menu." }); } },
            { text: "Stay bootstrapped", hint: "Keep 100%, grow slower",
              apply: function (b) { resolve(b, { icon: "💻", valueMult: 1.04, confidence: 3, log: "Turned down the VC. Lean, mean, and fully yours." }); } }
          ]
        };
      })
    ],

    finance: [
      ev(3, function (b) {
        var cost = fee(b, 0.06, 5000);
        return {
          type: "bad", icon: "🧾", title: "Regulatory Audit",
          body: "Regulators opened a books-and-records audit on the firm.",
          choices: [
            { text: "Cooperate fully and lawyer up — " + money(cost), hint: "Costly, clean outcome",
              apply: function (b) { resolve(b, { icon: "🧾", money: -cost, rep: +3, stress: 5, log: "Sailed through the audit with a spotless record." }); } },
            { text: "Stonewall and delay", hint: "Buy time, raise suspicion",
              apply: function (b) {
                if (chance(0.45)) resolve(b, { icon: "💼", money: -fee(b, 0.02, 1000), log: "They moved on to a bigger fish. You skated." });
                else resolve(b, { icon: "⚖️", money: -fee(b, 0.2, 12000), rep: -15, valueMult: 0.85, stress: 12, log: "The stonewalling triggered a formal investigation." });
              } }
          ]
        };
      }),
      ev(2, function (b) {
        var aum = fee(b, 0.15, 6000);
        return {
          type: "good", icon: "📈", title: "A Whale Wants to Invest",
          body: "A high-net-worth client offered to move a large book of assets to your firm.",
          choices: [
            { text: "Take the mandate, white-glove them", hint: "Big AUM, big expectations",
              apply: function (b) {
                if (chance(0.7)) resolve(b, { icon: "📈", money: aum, rep: +7, valueMult: 1.08, confidence: 2, log: "Landed the whale. AUM and fees jumped." });
                else resolve(b, { icon: "📉", money: -fee(b, 0.04, 1500), rep: -4, log: "The client was a nightmare and pulled out within months." });
              } },
            { text: "Pass — too concentrated", hint: "Protect the firm's risk profile",
              apply: function (b) { resolve(b, { icon: "💼", rep: +2, confidence: 1, log: "Declined politely. Diversification over a single big fish." }); } }
          ]
        };
      })
    ],

    retail: [
      ev(3, function (b) {
        var stuck = fee(b, 0.1, 1000);
        return {
          type: "bad", icon: "📦", title: "Dead Inventory",
          body: "A whole product line isn't moving and it's tying up " + money(stuck) + " of cash.",
          choices: [
            { text: "Fire-sale it at a loss", hint: "Recover some cash, take the hit",
              apply: function (b) { resolve(b, { icon: "🏷️", money: Math.round(stuck * 0.4), rep: -1, log: "Cleared the dead stock at a loss. Cash freed up." }); } },
            { text: "Hold and wait for demand", hint: "Tie up cash, gamble on a rebound",
              apply: function (b) {
                if (chance(0.4)) resolve(b, { icon: "📦", money: Math.round(stuck * 0.9), rep: +2, log: "Demand came back. You sold it near full price." });
                else resolve(b, { icon: "📦", money: -fee(b, 0.02, 300), stress: 4, log: "It sat another year. Storage costs ate into margins." });
              } }
          ]
        };
      })
    ],

    trades: [
      ev(3, function (b) {
        var job = fee(b, 0.14, 1200);
        return {
          type: "neutral", icon: "🔧", title: "Backlog Crunch",
          body: "You're booked solid and a " + money(job) + " job just came in with a tight deadline.",
          choices: [
            { text: "Pull overtime and deliver", hint: "Big payout, real burnout",
              apply: function (b) {
                if (chance(0.75)) resolve(b, { icon: "🔧", money: job, rep: +6, stress: 7, log: "Crew crushed the deadline. Client's thrilled." });
                else resolve(b, { icon: "🔧", money: Math.round(job * 0.6), rep: -3, stress: 9, log: "Rushed work meant a callback. Margins and pride dinged." });
              } },
            { text: "Subcontract the overflow", hint: "Smaller cut, less strain",
              apply: function (b) { resolve(b, { icon: "🤝", money: Math.round(job * 0.45), rep: +3, log: "Subbed it out. Smaller margin, happy client, rested crew." }); } },
            { text: "Turn it down", hint: "Protect quality and the backlog",
              apply: function (b) { resolve(b, { icon: "🔧", rep: +1, log: "Politely declined. Reputation for not overpromising grows." }); } }
          ]
        };
      })
    ],

    media: [
      ev(3, function (b) {
        return {
          type: "major", icon: "🎬", title: "A Project Is Going Viral",
          body: "Something you put out is blowing up. Strike while it's hot?",
          choices: [
            { text: "Pour budget into the moment", hint: money(fee(b, 0.08, 1000)) + " to ride the wave",
              apply: function (b) {
                if (chance(0.65)) resolve(b, { icon: "🎬", money: fee(b, 0.16, 2000) - fee(b, 0.08, 1000), rep: +9, valueMult: 1.08, fame: 2, log: "The wave became a tidal surge. Audience exploded." });
                else resolve(b, { icon: "🎬", money: -fee(b, 0.08, 1000), rep: +2, log: "The moment passed faster than the spend. Modest bump." });
              } },
            { text: "Stay measured, build slow", hint: "No spend, steady growth",
              apply: function (b) { resolve(b, { icon: "📺", rep: +5, valueMult: 1.03, fame: 1, log: "Let it grow organically. Audience up, costs flat." }); } }
          ]
        };
      })
    ],

    realestate: [
      ev(3, function (b) {
        var repair = fee(b, 0.09, 2000);
        return {
          type: "bad", icon: "🏚️", title: "Major Repair Needed",
          body: "A building system failed across a property. Repairs run " + money(repair) + ".",
          choices: [
            { text: "Fix it properly now", hint: "Protect value and tenants",
              apply: function (b) { resolve(b, { icon: "🏢", money: -repair, rep: +3, valueMult: 1.01, log: "Fixed it right. Occupancy and value held firm." }); } },
            { text: "Patch it cheaply", hint: "Save now, risk later",
              apply: function (b) {
                if (chance(0.5)) resolve(b, { icon: "🏢", money: -Math.round(repair * 0.3), log: "The cheap patch held. Saved a bundle." });
                else resolve(b, { icon: "🚱", money: -fee(b, 0.16, 4000), rep: -8, valueMult: 0.93, stress: 6, log: "The patch failed and took half the building offline." });
              } }
          ]
        };
      })
    ],

    health: [
      ev(3, function (b) {
        var cost = fee(b, 0.08, 4000);
        return {
          type: "bad", icon: "🩺", title: "Malpractice Scare",
          body: "A former patient is threatening a malpractice claim against the practice.",
          choices: [
            { text: "Settle quietly — " + money(cost), hint: "Pay to make it disappear",
              apply: function (b) { resolve(b, { icon: "🩺", money: -cost, rep: +1, stress: 6, log: "Settled out of court. The story never spread." }); } },
            { text: "Fight it in court", hint: "Risk the verdict and the headlines",
              apply: function (b) {
                if (chance(0.55)) resolve(b, { icon: "⚖️", money: -fee(b, 0.03, 1500), rep: +5, confidence: 2, log: "Won the case cleanly. Reputation actually rose." });
                else resolve(b, { icon: "⚖️", money: -fee(b, 0.2, 12000), rep: -14, valueMult: 0.86, stress: 12, log: "Lost the case. Damages and a bruised name." });
              } }
          ]
        };
      })
    ],

    logistics: [
      ev(3, function (b) {
        var rival = rivalName(b);
        var bid = fee(b, 0.18, 5000);
        return {
          type: "neutral", icon: "🚚", title: "Contract Up for Bid",
          body: "A " + money(bid) + "/yr retail delivery contract is open. " + rival + " is bidding too.",
          choices: [
            { text: "Bid aggressively to win it", hint: "Thin margin, full trucks",
              apply: function (b) {
                if (chance(0.6)) resolve(b, { icon: "🚚", money: Math.round(bid * 0.5), rep: +6, valueMult: 1.06, log: "Won the contract. Capacity utilization way up." });
                else resolve(b, { icon: "🚚", rep: -2, log: rivalName(b) + " lowballed you and took the contract." });
              } },
            { text: "Bid for healthy margin", hint: "Walk away if it's a race to the bottom",
              apply: function (b) {
                if (chance(0.35)) resolve(b, { icon: "🚚", money: Math.round(bid * 0.8), rep: +5, valueMult: 1.04, log: "They blinked first. You won it at a real margin." });
                else resolve(b, { icon: "🚚", rep: +1, log: "Held your price and lost the bid. No regrets." });
              } }
          ]
        };
      })
    ]
  };

  // Generic fallback pool — fires for any sector with nothing tagged, or as a
  // change-up. Uses the persistent rival where it adds flavor.
  var GENERIC_EVENTS = [
    ev(2, function (b) {
      var rival = rivalName(b);
      return {
        type: "neutral", icon: "🏪", title: rival + " Moved In Nearby",
        body: rival + " opened up the road and is undercutting your prices. React how?",
        choices: [
          { text: "Match their prices", hint: "Protect share, squeeze margin",
            apply: function (b) { resolve(b, { icon: "🏷️", money: -fee(b, 0.03, 300), rep: +3, log: "Matched " + rivalName(b) + " on price and held your customers." }); } },
          { text: "Out-market them", hint: money(fee(b, 0.05, 500)) + " campaign",
            apply: function (b) {
              if (chance(0.6)) resolve(b, { icon: "📣", money: fee(b, 0.06, 400) - fee(b, 0.05, 500), rep: +6, valueMult: 1.04, log: "Your campaign buried " + rivalName(b) + ". Market share up." });
              else resolve(b, { icon: "📣", money: -fee(b, 0.05, 500), rep: +1, log: "The campaign underwhelmed. Slight edge at best." });
            } },
          { text: "Ignore them", hint: "Bet on loyalty",
            apply: function (b) {
              if (chance(0.5)) resolve(b, { icon: "🏪", rep: -3, valueMult: 0.98, log: rivalName(b) + " chipped away at your numbers." });
              else resolve(b, { icon: "🏪", rep: +2, log: "Your regulars stayed loyal. " + rivalName(b) + " barely dented you." });
            } }
        ]
      };
    }),
    ev(2, function (b) {
      var bonus = fee(b, 0.07, 400);
      return {
        type: "good", icon: "🏆", title: "Community Recognition",
        body: "Local press wants to feature your business as a community favorite.",
        choices: [
          { text: "Lean into the press", hint: "Reputation and a little revenue",
            apply: function (b) { resolve(b, { icon: "🏆", money: bonus, rep: +6, valueMult: 1.03, fame: 1, log: "The feature ran. New customers, warm goodwill." }); } },
          { text: "Stay low-key", hint: "Quiet confidence",
            apply: function (b) { resolve(b, { icon: "🏆", rep: +3, confidence: 1, log: "Kept it humble. Steady reputation gain." }); } }
        ]
      };
    }),
    ev(2, function (b) {
      var cost = fee(b, 0.05, 500);
      return {
        type: "bad", icon: "📦", title: "Supply Costs Spiked",
        body: "Your main supplier hiked prices " + rnd(15, 40) + "% this year.",
        choices: [
          { text: "Eat the cost, keep prices steady", hint: "Protect loyalty, lose margin",
            apply: function (b) { resolve(b, { icon: "📦", money: -cost, rep: +3, log: "Absorbed the hike. Customers never felt it." }); } },
          { text: "Pass it on to customers", hint: "Protect margin, risk grumbling",
            apply: function (b) {
              if (chance(0.55)) resolve(b, { icon: "📦", rep: -2, log: "Raised prices. A few complaints, no real damage." });
              else resolve(b, { icon: "📦", rep: -7, valueMult: 0.97, log: "The price hike pushed regulars to a competitor." });
            } },
          { text: "Find a new supplier", hint: "Effort now, savings later",
            apply: function (b) {
              if (chance(0.6)) resolve(b, { icon: "🔁", money: -fee(b, 0.01, 150), rep: +1, log: "Switched suppliers and locked in a better rate." });
              else resolve(b, { icon: "🔁", money: -fee(b, 0.03, 300), stress: 4, log: "The new supplier was unreliable. Costly lesson." });
            } }
        ]
      };
    })
  ];

  // ------------------------------------------------------------ roll logic ---
  function weightedPick(pool) {
    var total = pool.reduce(function (s, e) { return s + (e.weight || 1); }, 0);
    var r = Math.random() * total;
    for (var i = 0; i < pool.length; i++) { r -= (pool[i].weight || 1); if (r <= 0) return pool[i]; }
    return pool[pool.length - 1];
  }

  // Cap interactive popups so owning many businesses doesn't spam the player.
  function popupBudgetLeft() {
    var s = S();
    if (s.__bizEvYearV1852 !== s.age) { s.__bizEvYearV1852 = s.age; s.__bizEvCountV1852 = 0; }
    return (s.__bizEvCountV1852 || 0) < 2;
  }
  function spendBudget() {
    var s = S();
    s.__bizEvCountV1852 = (s.__bizEvCountV1852 || 0) + 1;
  }

  // Called from the runtime's per-business yearly loop. Returns true if it
  // queued an interactive event (so the runtime skips its old market-event log).
  window.rollBizEventV1852 = function (b) {
    try {
      if (!b) return false;
      if (!chance(0.14)) return false;          // base fire rate per business/yr
      if (!popupBudgetLeft()) return false;      // let old auto-event handle it
      var pool = (SECTOR_EVENTS[sectorId(b)] || []).concat(GENERIC_EVENTS);
      if (!pool.length) return false;
      var cfg = weightedPick(pool).build(b);
      if (!cfg) return false;
      cfg.biz = b;
      spendBudget();
      queueBizEvent(cfg);
      return true;
    } catch (e) { return false; }
  };

  // --------------------------------------------------------- popup renderer --
  var _queue = [];
  var _showing = false;
  var _flushPending = false;

  function queueBizEvent(cfg) {
    _queue.push(cfg);
    scheduleFlush();
  }
  function scheduleFlush() {
    if (_flushPending) return;
    _flushPending = true;
    // Defer so the year fully resolves and renders before the popup appears.
    setTimeout(function () { _flushPending = false; flushBizEvents(); }, 60);
  }
  function flushBizEvents() {
    // Self-recover: if we think a popup is up but its node is gone (e.g. a render
    // wiped the body), clear the flag so the queue can never get stuck on-screen.
    if (_showing) {
      try { if (!document.getElementById("biz-ev-overlay")) _showing = false; } catch (e) {}
      if (_showing) return;
    }
    if (!_queue.length) return;
    _showing = true;
    try {
      renderPopup(_queue.shift());
    } catch (e) {
      _showing = false;
      try { var o = document.getElementById("biz-ev-overlay"); if (o) o.remove(); } catch (e2) {}
    }
  }
  window.queueBizEvent = queueBizEvent;
  window.flushBizEvents = flushBizEvents;

  var C_MAP = { good: "var(--good)", bad: "var(--bad)", neutral: "var(--dim)", major: "var(--accent)" };
  var BG_MAP = {
    good: "rgba(143,175,108,0.10)", bad: "rgba(204,118,97,0.10)",
    neutral: "rgba(255,255,255,0.035)", major: "rgba(201,155,85,0.13)"
  };

  function renderPopup(cfg) {
    var old = document.getElementById("biz-ev-overlay");
    if (old) old.remove();
    var col = C_MAP[cfg.type] || C_MAP.neutral;
    var bg = BG_MAP[cfg.type] || BG_MAP.neutral;
    var biz = cfg.biz || {};

    var overlay = document.createElement("div");
    overlay.id = "biz-ev-overlay";
    overlay.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,0.66);z-index:2147483000;display:flex;" +
      "align-items:center;justify-content:center;padding:20px;animation:bizEvFade .16s ease;" +
      "font-family:inherit;";

    var choices = cfg.choices || [];
    var btnHTML = choices.length
      ? choices.map(function (c, i) {
          var hint = c.hint ? '<div style="font-size:11px;color:var(--faint);margin-top:3px;">' + esc(c.hint) + '</div>' : "";
          return '<button data-i="' + i + '" class="biz-ev-choice" style="display:block;width:100%;text-align:left;' +
            'padding:11px 14px;margin-bottom:8px;background:var(--card);border:1px solid var(--line);' +
            'border-radius:9px;color:var(--ink);cursor:pointer;font-size:13px;line-height:1.4;transition:all .14s;">' +
            '<span style="font-weight:600;">' + esc(c.text) + "</span>" + hint + "</button>";
        }).join("")
      : '<button data-i="-1" class="biz-ev-choice" style="display:block;width:100%;padding:12px;' +
        "background:" + col + ";border:none;border-radius:9px;color:#14110d;cursor:pointer;font-weight:700;font-size:14px;\">Continue →</button>";

    var sub = biz.name ? '<div style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--faint,#718071);margin-bottom:8px;">' + esc(biz.name) + "</div>" : "";

    // Fallback colors (after the CSS var) so the card can never render invisible
    // — an invisible-but-present overlay would block clicks and look like a freeze.
    overlay.innerHTML =
      '<div role="dialog" aria-modal="true" style="position:relative;max-width:430px;width:100%;background:var(--bg,#14110d);border:1px solid ' + col +
      '66;border-radius:14px;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,0.55);">' +
        '<button class="biz-ev-x" aria-label="Close" style="position:absolute;top:8px;right:10px;z-index:2;width:30px;height:30px;border:none;border-radius:8px;background:rgba(0,0,0,0.28);color:#f3efe4;font-size:18px;line-height:1;cursor:pointer;">×</button>' +
        '<div style="padding:20px 22px 16px;background:' + bg + ";border-bottom:1px solid " + col + '33;">' +
          sub +
          '<div style="font-size:34px;line-height:1;margin-bottom:10px;">' + esc(cfg.icon || "📌") + "</div>" +
          '<div style="font-family:\'Georgia\',serif;font-size:18px;font-weight:700;color:' + col + ';margin-bottom:8px;padding-right:28px;">' + esc(cfg.title || "Business Event") + "</div>" +
          '<div style="font-size:13px;color:var(--dim,#aa9a82);line-height:1.6;">' + esc(cfg.body || "") + "</div>" +
        "</div>" +
        '<div style="padding:16px 22px 18px;">' + btnHTML + "</div>" +
      "</div>";

    // One dismissal path used by every exit (choice, ✕, backdrop, Escape) so the
    // overlay can NEVER be left on screen blocking input.
    function closePopup(applyFn) {
      try { document.removeEventListener("keydown", onKey, true); } catch (e) {}
      try { overlay.remove(); } catch (e) {}
      _showing = false;
      try { if (typeof applyFn === "function") applyFn(); } catch (e) {}
      try { rerender(); } catch (e) {}
      try { saveGame(); } catch (e) {}
      flushBizEvents();
    }
    function onKey(e) { if (e.key === "Escape" || e.keyCode === 27) { e.preventDefault(); closePopup(null); } }
    try { document.addEventListener("keydown", onKey, true); } catch (e) {}

    overlay.querySelectorAll(".biz-ev-choice").forEach(function (btn) {
      btn.addEventListener("mouseenter", function () { btn.style.borderColor = col; btn.style.background = bg; });
      btn.addEventListener("mouseleave", function () { btn.style.borderColor = "var(--line)"; btn.style.background = "var(--card)"; });
      btn.addEventListener("click", function () {
        var i = parseInt(btn.getAttribute("data-i"), 10);
        closePopup(function () {
          if (choices.length && i >= 0 && choices[i] && typeof choices[i].apply === "function") choices[i].apply(cfg.biz);
          else if (typeof cfg.onContinue === "function") cfg.onContinue(cfg.biz);
        });
      });
    });

    // ✕ button and dark-backdrop click both dismiss without applying a choice —
    // guaranteeing the full-screen overlay can never trap input.
    var xBtn = overlay.querySelector(".biz-ev-x");
    if (xBtn) xBtn.addEventListener("click", function () { closePopup(null); });
    overlay.addEventListener("click", function (e) { if (e.target === overlay) closePopup(null); });

    (document.body || document.documentElement).appendChild(overlay);
  }

  // ------------------------------------------------------------- one-time css
  try {
    var st = document.createElement("style");
    st.textContent =
      "@keyframes bizEvFade{0%{opacity:0;transform:scale(0.98);}100%{opacity:1;transform:scale(1);}}" +
      "#biz-ev-overlay .biz-ev-choice:active{transform:translateX(2px);}";
    document.head.appendChild(st);
  } catch (e) {}
})();
