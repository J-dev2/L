/* ============================================================================
 * business-challenges.js  (v18.36 — Living Businesses, depth layer)
 * ----------------------------------------------------------------------------
 * Businesses used to only grow: set them up, run one action, and watch the
 * number climb forever with no downside. This adds ongoing PROBLEMS you have to
 * actively manage.
 *
 * Each year a business can pick up a "challenge" (rising competition, a key
 * employee threatening to quit, debt pressure, aging systems, customer churn,
 * regulatory heat, owner burnout). While active, a challenge bites every year —
 * shaving reputation and value — and the bite gets worse the longer it's
 * ignored. So neglected businesses now decline instead of compounding forever.
 *
 * Every challenge is a DECISION with real tradeoffs surfaced on the business
 * desk: pay to fix it cleanly, take a cheap/risky shortcut, or eat the loss.
 * Well-run businesses (a manager/counsel on staff, strong reputation) accrue
 * fewer challenges, so good management is rewarded.
 *
 * Loads after business-events.js. Touches the core runtime through one guarded
 * call (window.tickBizChallengesV1853) in the yearly business loop, and renders
 * its panel into the business desk via window.renderBizChallengesPanelV1853.
 * ========================================================================== */
(function () {
  "use strict";
  if (window.__ledgerBizChallengesV1853Loaded) return;
  window.__ledgerBizChallengesV1853Loaded = true;

  // --------------------------------------------------------------- helpers --
  function S() { try { if (typeof state !== "undefined" && state) return state; } catch (e) {} return window.state || {}; }
  function age() { return Number(S().age) || 0; }
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
  function compact(v) {
    try { if (typeof window.compactMoney === "function") return window.compactMoney(v); } catch (e) {}
    return money(v);
  }
  function logLine(text, deltas) { try { if (typeof window.addLog === "function") window.addLog(text, deltas || {}); } catch (e) {} }
  function applyDeltas(d) { try { if (d && Object.keys(d).length && typeof window.applyDeltas === "function") window.applyDeltas(d); } catch (e) {} }
  function rerender() { try { if (typeof window.render === "function") window.render(); } catch (e) {} }
  function saveGame() { try { if (typeof window.save === "function") window.save(); } catch (e) {} }
  function toast(m) { try { if (typeof window.addToast === "function") window.addToast(m); } catch (e) {} return false; }

  function bizById(id) {
    try {
      var list = (S().finance && S().finance.businesses) || [];
      for (var i = 0; i < list.length; i++) if (String(list[i].id) === String(id)) return list[i];
    } catch (e) {}
    return null;
  }
  function sectorId(b) {
    try { if (typeof window.sectorIdForBusinessV1851 === "function") return window.sectorIdForBusinessV1851(b); } catch (e) {}
    return null;
  }
  function rivalName(b) {
    if (b && b.rivalNameV1852) return b.rivalNameV1852;
    return "a rival";
  }
  function ensure(b) {
    if (!b) return;
    if (!Array.isArray(b.challengesV1853)) b.challengesV1853 = [];
  }
  // Cost helpers scale to the business's own size with a floor.
  function sizeOf(b) { return Math.max(2500, Math.round(Number(b && b.value) || 0)); }
  function fee(b, frac, floor) { return Math.max(floor || 200, Math.round(sizeOf(b) * frac)); }
  function spend(amount) { applyDeltas({ money: -Math.round(amount) }); }
  function adjRep(b, d) { b.reputation = clampN((b.reputation || 10) + d, 0, 100); }
  function adjValue(b, mult) { b.value = Math.max(0, Math.round((b.value || 0) * mult)); }

  // Shared outcome writer for resolution choices.
  function out(b, o) {
    o = o || {};
    if (o.rep) adjRep(b, o.rep);
    if (o.valueMult) adjValue(b, o.valueMult);
    var deltas = {};
    if (o.money) deltas.money = Math.round(o.money);
    if (o.stress) deltas.stress = o.stress;
    if (o.confidence) deltas.confidence = o.confidence;
    applyDeltas(deltas);
    var nm = (b && b.name) || "Your business";
    logLine(((o.icon ? o.icon + " " : "") + nm + ": " + (o.log || "")).trim(), deltas);
  }

  // --------------------------------------------------------- challenge defs --
  // bite: applied every year the challenge stays active (worsens the longer it
  // is ignored). options(b): the decisions; each apply(b) returns false to keep
  // the challenge active, anything else removes it.
  var DEFS = {
    competition: {
      name: "Rising Competition", icon: "🏪", sectors: null,
      bite: { rep: -2, valueMult: 0.985 },
      desc: function (b) { return rivalName(b) + " is undercutting you and pulling customers away."; },
      options: function (b) {
        var camp = fee(b, 0.06, 600);
        return [
          { text: "Out-market them (" + compact(camp) + ")", hint: "Costly, usually works", kind: "gold",
            apply: function (b) {
              if (chance(0.7)) { out(b, { icon: "📣", money: -camp, rep: +5, valueMult: 1.03, log: "Marketing blitz won the block back from " + rivalName(b) + "." }); return true; }
              out(b, { icon: "📣", money: -camp, rep: +1, log: "The campaign underdelivered. " + rivalName(b) + " still looms." }); return false;
            } },
          { text: "Cut prices to compete", hint: "Keep customers, thin margins", kind: "blue",
            apply: function (b) { out(b, { icon: "🏷️", money: -fee(b, 0.02, 200), rep: +3, log: "Matched " + rivalName(b) + " on price and held the line." }); return true; } },
          { text: "Ignore it", hint: "Free — keeps eroding you", kind: "",
            apply: function (b) { out(b, { icon: "🏪", rep: -2, log: "Left " + rivalName(b) + " unchecked. The bleed continues." }); return false; } }
        ];
      }
    },
    keystaff: {
      name: "Key Employee May Quit", icon: "🧑‍💼", sectors: null,
      bite: { rep: -1, valueMult: 0.99 },
      desc: function (b) { return "Your most important person is being courted by a competitor."; },
      options: function (b) {
        var raise = fee(b, 0.05, 800);
        return [
          { text: "Give a raise (" + compact(raise) + ")", hint: "Retain and reward", kind: "green",
            apply: function (b) { out(b, { icon: "🧑‍💼", money: -raise, rep: +4, valueMult: 1.02, log: "Countered the offer. They're staying — and motivated." }); return true; } },
          { text: "Promote into ownership stake", hint: "No cash now, dilutes upside", kind: "gold",
            apply: function (b) { out(b, { icon: "🤝", valueMult: 0.98, rep: +5, log: "Gave them a stake. Locked in for the long haul." }); return true; } },
          { text: "Let them walk", hint: "Lose knowledge and momentum", kind: "red",
            apply: function (b) { out(b, { icon: "🚪", rep: -7, valueMult: 0.95, stress: 3, log: "They left for a rival and took clients with them." }); return true; } }
        ];
      }
    },
    debt: {
      name: "Debt Pressure", icon: "🏦", sectors: null, minValue: 60000,
      bite: { rep: -1, valueMult: 0.975 },
      desc: function (b) { return "Loan payments are squeezing the business. The bank wants a plan."; },
      options: function (b) {
        var pay = fee(b, 0.18, 4000);
        return [
          { text: "Pay it down (" + compact(pay) + ")", hint: "Clear the pressure outright", kind: "green",
            apply: function (b) { out(b, { icon: "🏦", money: -pay, rep: +3, valueMult: 1.02, log: "Paid down the debt. Balance sheet breathing again." }); return true; } },
          { text: "Refinance", hint: "Cheaper now, risk later", kind: "blue",
            apply: function (b) {
              if (chance(0.6)) { out(b, { icon: "🏦", money: -fee(b, 0.04, 800), log: "Refinanced at a better rate. Pressure eased." }); return true; }
              out(b, { icon: "🏦", money: -fee(b, 0.06, 1000), rep: -3, stress: 4, log: "Refi terms were worse than hoped. Still underwater." }); return false;
            } },
          { text: "Ride it out", hint: "Gamble on next year", kind: "",
            apply: function (b) { out(b, { icon: "🏦", rep: -2, valueMult: 0.97, stress: 5, log: "Kicked the can. Interest keeps grinding the value down." }); return false; } }
        ];
      }
    },
    aging: {
      name: "Aging Equipment", icon: "🛠️", sectors: null,
      bite: { rep: -2, valueMult: 0.985 },
      desc: function (b) { return "Equipment and systems are wearing out, dragging on quality."; },
      options: function (b) {
        var fix = fee(b, 0.09, 1200);
        return [
          { text: "Reinvest properly (" + compact(fix) + ")", hint: "Restore quality", kind: "gold",
            apply: function (b) { out(b, { icon: "🛠️", money: -fix, rep: +5, valueMult: 1.04, log: "Overhauled the equipment. Output and reviews bounced back." }); return true; } },
          { text: "Cheap patch", hint: "Buys a little time", kind: "blue",
            apply: function (b) {
              if (chance(0.5)) { out(b, { icon: "🛠️", money: -fee(b, 0.02, 300), log: "The patch held for now." }); return true; }
              out(b, { icon: "🛠️", money: -fee(b, 0.02, 300), rep: -3, log: "The patch failed within months." }); return false;
            } },
          { text: "Run it to failure", hint: "Free — quality keeps slipping", kind: "",
            apply: function (b) { out(b, { icon: "🛠️", rep: -3, valueMult: 0.97, log: "Let it ride. Breakdowns are starting to cost you." }); return false; } }
        ];
      }
    },
    churn: {
      name: "Customer Churn Rising", icon: "📉", sectors: ["tech", "retail", "media"],
      bite: { rep: -2, valueMult: 0.98 },
      desc: function (b) { return "Customers are cancelling faster than you're winning new ones."; },
      options: function (b) {
        var spend2 = fee(b, 0.06, 800);
        return [
          { text: "Improve the product (" + compact(spend2) + ")", hint: "Fix the root cause", kind: "gold",
            apply: function (b) { out(b, { icon: "📈", money: -spend2, rep: +5, valueMult: 1.04, log: "Shipped real improvements. Retention recovered." }); return true; } },
          { text: "Launch a loyalty/win-back offer", hint: "Cheaper, partial fix", kind: "blue",
            apply: function (b) {
              if (chance(0.6)) { out(b, { icon: "🎁", money: -fee(b, 0.02, 300), rep: +3, log: "Win-back offer clawed customers back." }); return true; }
              out(b, { icon: "🎁", money: -fee(b, 0.02, 300), log: "Some came back, but churn still bites." }); return false;
            } },
          { text: "Ignore the churn", hint: "Erodes your base", kind: "",
            apply: function (b) { out(b, { icon: "📉", rep: -3, valueMult: 0.97, log: "Churn went unaddressed. The base keeps shrinking." }); return false; } }
        ];
      }
    },
    regulatory: {
      name: "Regulatory Heat", icon: "⚖️", sectors: ["finance", "health", "nightlife", "food"],
      bite: { rep: -2, valueMult: 0.985 },
      desc: function (b) { return "Regulators are circling. Get ahead of it or get caught flat-footed."; },
      options: function (b) {
        var comply = fee(b, 0.08, 2000);
        return [
          { text: "Invest in compliance (" + compact(comply) + ")", hint: "Clean and safe", kind: "green",
            apply: function (b) { out(b, { icon: "⚖️", money: -comply, rep: +4, valueMult: 1.02, log: "Got fully compliant. Inspectors moved on satisfied." }); return true; } },
          { text: "Lawyer up and fight", hint: "Risk the ruling", kind: "blue",
            apply: function (b) {
              if (chance(0.55)) { out(b, { icon: "⚖️", money: -fee(b, 0.03, 1000), rep: +5, confidence: 2, log: "Beat the citation. Reputation rose." }); return true; }
              out(b, { icon: "⚖️", money: -fee(b, 0.18, 8000), rep: -10, valueMult: 0.9, stress: 8, log: "Lost the fight. Fines and bad press." }); return true;
            } },
          { text: "Hope it blows over", hint: "Dangerous to ignore", kind: "",
            apply: function (b) { out(b, { icon: "⚖️", rep: -3, valueMult: 0.96, stress: 4, log: "Ignored the warning signs. The heat keeps building." }); return false; } }
        ];
      }
    },
    burnout: {
      name: "Owner Burnout", icon: "🥵", sectors: null,
      bite: { rep: -1, valueMult: 0.99 },
      desc: function (b) { return "You're stretched thin running this. Quality and your health are slipping."; },
      options: function (b) {
        var mgr = fee(b, 0.12, 3000);
        return [
          { text: "Hire a manager (" + compact(mgr) + ")", hint: "Delegate the load", kind: "green",
            apply: function (b) { if (b.ops) b.ops.manager = true; out(b, { icon: "🧑‍💼", money: -mgr, rep: +3, valueMult: 1.02, stress: -6, log: "Brought in a manager. The weight lifted." }); return true; } },
          { text: "Step back for a season", hint: "Recover, lose some momentum", kind: "blue",
            apply: function (b) { out(b, { icon: "🌴", valueMult: 0.98, stress: -10, log: "Took real time off. The business idled, but you recovered." }); return true; } },
          { text: "Push through it", hint: "Free — your stress climbs", kind: "",
            apply: function (b) { out(b, { icon: "🥵", rep: -2, stress: 7, log: "Powered through on fumes. It's wearing on you." }); return false; } }
        ];
      }
    }
  };

  function eligible(b) {
    var sid = sectorId(b);
    var val = Number(b && b.value) || 0;
    var ids = [];
    Object.keys(DEFS).forEach(function (id) {
      var d = DEFS[id];
      if (d.sectors && (!sid || d.sectors.indexOf(sid) < 0)) return;
      if (d.minValue && val < d.minValue) return;
      ids.push(id);
    });
    return ids;
  }

  // ------------------------------------------------------------- yearly tick --
  window.tickBizChallengesV1853 = function (b) {
    try {
      if (!b) return;
      ensure(b);
      var arr = b.challengesV1853;

      // 1) active challenges bite — worse the longer they're left unresolved.
      arr.forEach(function (c) {
        var d = DEFS[c.id]; if (!d) return;
        var yrs = Math.max(0, age() - (c.since || age()));
        var escalate = 1 + Math.min(1.2, yrs * 0.18);
        if (d.bite.rep) b.reputation = clampN((b.reputation || 10) + d.bite.rep * escalate, 0, 100);
        if (d.bite.valueMult) b.value = Math.max(0, Math.round((b.value || 0) * (1 - (1 - d.bite.valueMult) * escalate)));
      });

      // 2) maybe pick up a new challenge. Established/larger businesses face
      //    more; a manager/counsel and strong reputation cut the odds.
      if ((b.years || 0) >= 2 && arr.length < 3) {
        var managed = (b.ops && (b.ops.manager || b.ops.counsel)) ? 0.55 : 1;
        var repFactor = (b.reputation || 0) > 70 ? 0.7 : (b.reputation || 0) < 35 ? 1.25 : 1;
        var sizeP = Math.min(0.20, 0.055 + (Number(b.value) || 0) / 4500000 + (b.years || 0) * 0.004);
        if (chance(sizeP * managed * repFactor)) {
          var pool = eligible(b).filter(function (id) { return !arr.some(function (c) { return c.id === id; }); });
          if (pool.length) {
            var id = pick(pool);
            arr.unshift({ id: id, since: age() });
            logLine("⚠️ " + ((b && b.name) || "Your business") + ": " + DEFS[id].name + " — needs a decision on the business desk.", {});
          }
        }
      }
    } catch (e) {}
  };

  // ---------------------------------------------------------- resolve action --
  window.resolveBizChallengeV1853 = function (bizId, pid, optIdx) {
    var b = bizById(bizId);
    if (!b) return toast("Business not found.");
    ensure(b);
    var d = DEFS[pid];
    if (!d) return;
    var opts = d.options(b);
    var o = opts[Number(optIdx)];
    if (!o) return;
    var keep = false;
    try { keep = o.apply(b) === false; } catch (e) { keep = true; }
    if (!keep) b.challengesV1853 = (b.challengesV1853 || []).filter(function (c) { return c.id !== pid; });
    saveGame();
    rerender();
  };

  // --------------------------------------------------------------- panel UI --
  window.renderBizChallengesPanelV1853 = function (b) {
    try {
      if (!b) return "";
      ensure(b);
      var arr = b.challengesV1853 || [];
      if (!arr.length) {
        return '<div class="row v1853-challenges"><div style="flex:1">' +
          '<div class="row-title">🛡️ No active challenges</div>' +
          '<div class="row-sub">Operations are stable. Keep managing — problems tend to find growing businesses.</div>' +
          '</div></div>';
      }
      var blocks = arr.map(function (c) {
        var d = DEFS[c.id];
        if (!d) return "";
        var yrs = Math.max(0, age() - (c.since || age()));
        var aged = yrs >= 2 ? ' <span style="color:var(--bad);font-size:11px">· worsening (' + yrs + 'y)</span>' : "";
        var opts = d.options(b);
        var btns = opts.map(function (o, i) {
          return '<button class="money-btn ' + esc(o.kind || "blue") + '" onclick="event.preventDefault();event.stopPropagation();resolveBizChallengeV1853(\'' + esc(b.id) + '\',\'' + esc(c.id) + '\',' + i + ')">' + esc(o.text) + '</button>';
        }).join("");
        return '<div class="v1853-challenge" style="border:1px solid var(--line);border-radius:10px;padding:10px;margin-top:8px;background:rgba(204,118,97,0.06)">' +
          '<div class="row-title">' + esc(d.icon) + ' ' + esc(d.name) + aged + '</div>' +
          '<div class="row-sub">' + esc(d.desc(b)) + '</div>' +
          '<div class="v1840-action-strip" style="margin-top:8px">' + btns + '</div>' +
          '</div>';
      }).join("");
      return '<div class="row v1853-challenges"><div style="flex:1">' +
        '<div class="row-title">🔥 Active challenges: ' + arr.length + '</div>' +
        '<div class="row-sub">Unresolved problems shave reputation and value every year — and bite harder the longer they sit.</div>' +
        blocks +
        '</div></div>';
    } catch (e) { return ""; }
  };
})();
