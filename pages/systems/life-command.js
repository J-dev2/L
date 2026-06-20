/* Ledger system v18.44: richer Life home and Life hub command surfaces. */
(function () {
  if (window.__ledgerLifeCommandV1844Loaded) return;
  window.__ledgerLifeCommandV1844Loaded = true;

  function getStateV1844() {
    try {
      if (typeof state !== "undefined" && state) return state;
    } catch (e) {}
    try { return window.state || null; } catch (e2) {}
    return null;
  }

  function escapeV1844(value) {
    return String(value === undefined || value === null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function numberV1844(value) {
    var n = Number(value);
    return isFinite(n) ? n : 0;
  }

  function clampV1844(value, min, max) {
    value = numberV1844(value);
    return Math.max(min, Math.min(max, value));
  }

  function moneyV1844(value) {
    value = Math.round(numberV1844(value));
    try {
      if (typeof money === "function") return money(value);
    } catch (e) {}
    var abs = Math.abs(value);
    var sign = value < 0 ? "-" : "";
    if (abs >= 1000000000) return sign + "$" + (abs / 1000000000).toFixed(1).replace(/\.0$/, "") + "B";
    if (abs >= 1000000) return sign + "$" + (abs / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (abs >= 10000) return sign + "$" + Math.round(abs / 1000) + "K";
    return sign + "$" + abs.toLocaleString();
  }

  function stageV1844(s) {
    try {
      if (typeof lifeStage === "function") return lifeStage();
    } catch (e) {}
    var age = numberV1844(s && s.age);
    if (age < 13) return "Child";
    if (age < 18) return "Teen";
    if (age < 30) return "Young Adult";
    if (age < 55) return "Adult";
    if (age < 70) return "Mature Adult";
    return "Elder";
  }

  function netWorthV1844(s) {
    try {
      if (typeof financeNetWorth === "function") return Math.round(numberV1844(financeNetWorth(s)));
    } catch (e) {}
    try {
      if (typeof legacyNetWorth === "function") return Math.round(numberV1844(legacyNetWorth(s)));
    } catch (e2) {}
    s = s || {};
    var f = s.finance || {};
    return Math.round(
      numberV1844(s.money) +
      numberV1844(s.savings) +
      numberV1844(s.ira) +
      numberV1844(s.retirement401k) +
      numberV1844(f.brokerage) +
      numberV1844((f.personalFirm || {}).managed) +
      numberV1844(f.familyTrustValue || f.familyTrustCash) -
      numberV1844(s.debt) -
      numberV1844(f.creditCardDebt) -
      numberV1844(f.taxDebt) -
      numberV1844(f.assetBackedLoan)
    );
  }

  function statV1844(s, key) {
    return Math.round(clampV1844(((s || {}).stats || {})[key], 0, key === "iq" ? 200 : 100));
  }

  function effectiveIqV1844(s) {
    try {
      if (typeof effectiveIQ === "function") return Math.round(numberV1844(effectiveIQ(s)));
    } catch (e) {}
    return Math.round(numberV1844(((s || {}).traits || {}).iq || ((s || {}).stats || {}).iq || ((s || {}).stats || {}).smarts || 100));
  }

  function relationshipListV1844(s) {
    var rel = (s && s.relationships) || {};
    return Object.keys(rel).map(function (key) {
      var person = rel[key] || {};
      person.__key = key;
      return person;
    });
  }

  function childrenV1844(s) {
    return relationshipListV1844(s).filter(function (r) { return r.role === "Child"; });
  }

  function partnerV1844(s) {
    var list = relationshipListV1844(s);
    return list.find(function (r) { return r.role === "Spouse" || r.role === "Partner"; }) || ((s || {}).relationships || {}).partner || null;
  }

  function relationScoreV1844(r) {
    var bond = clampV1844((r || {}).bond, 0, 100);
    var trust = clampV1844((r || {}).trust, 0, 100);
    var chemistry = clampV1844((r || {}).chemistry, 0, 100);
    var mood = clampV1844((r || {}).mood, 0, 100);
    var bonus = 0;
    if (chemistry) bonus += Math.max(0, chemistry - 70) * 0.12;
    if (mood) bonus += Math.max(0, mood - 70) * 0.08;
    return Math.round(clampV1844((bond * 0.58) + (trust * 0.36) + bonus, 0, 100));
  }

  function closeRelationshipStatsV1844(s) {
    var list = relationshipListV1844(s).filter(function (r) {
      var role = String((r || {}).role || "").toLowerCase();
      return r && r.name && r.alive !== false && role.indexOf("ex") < 0 && role.indexOf("rival") < 0 && role.indexOf("enemy") < 0;
    }).map(function (r) {
      r.__closeScore = relationScoreV1844(r);
      return r;
    }).sort(function (a, b) { return b.__closeScore - a.__closeScore; });

    var close = list.filter(function (r) {
      return r.__closeScore >= 80 || (numberV1844(r.bond) >= 86 && numberV1844(r.trust) >= 68);
    });
    var count = close.length;
    var best = close[0] || list[0] || null;
    var bestScore = best ? relationScoreV1844(best) : 0;
    var progress = 0;
    if (count >= 3) progress = 100;
    else if (count === 2) progress = Math.max(90, bestScore);
    else if (count === 1) progress = Math.max(72, Math.min(94, bestScore));
    else progress = Math.max(0, bestScore - 25);

    var glow = "Quiet";
    var tone = "warn";
    if (count >= 3) { glow = "Radiant"; tone = "good"; }
    else if (count === 2) { glow = "Close circle"; tone = "good"; }
    else if (count === 1) { glow = "Warm bond"; tone = "people"; }

    return {
      count: count,
      ready: count >= 2 || bestScore >= 94,
      progress: Math.round(clampV1844(progress, 0, 100)),
      bestScore: bestScore,
      glow: glow,
      tone: tone,
      names: close.slice(0, 4).map(function (r) { return r.name; }),
      bestName: best ? best.name : ""
    };
  }

  function syncPersonalGoalProgressV1844(s) {
    var close = closeRelationshipStatsV1844(s);
    var goal = activeGoalV1844(s);
    if (!goal || goal.id !== "bestfriend" || !s) return close;
    s.life = s.life || {};
    s.life.goalProgress = s.life.goalProgress || {};
    var current = numberV1844(s.life.goalProgress.bestfriend);
    var dynamic = close.ready ? 100 : close.progress;
    if (dynamic > current) s.life.goalProgress.bestfriend = dynamic;
    close.progress = Math.max(current, dynamic);
    close.ready = close.ready || close.progress >= 100;
    return close;
  }

  function goalProgressV1844(s, goal) {
    if (!goal) return 0;
    if (goal.id === "bestfriend") return syncPersonalGoalProgressV1844(s).progress;
    return goal && s.life && s.life.goalProgress ? numberV1844(s.life.goalProgress[goal.id]) : 0;
  }

  function jobLineV1844(s) {
    if (s && s.job) {
      var title = s.job.title || s.job.name || "Current job";
      var salary = s.job.salary ? " - " + moneyV1844(s.job.salary) + "/yr" : "";
      return title + salary;
    }
    if (s && s.flags && s.flags.retired) return "Retired";
    if (s && s.age >= 14) return "No job yet";
    return "Too young for work";
  }

  function jobTitleV1844(s) {
    if (s && s.job) return s.job.title || s.job.name || "Current job";
    if (s && s.flags && s.flags.retired) return "Retired";
    if (s && s.age >= 14) return "No job yet";
    return "Growing up";
  }

  function jobDetailV1844(s) {
    if (s && s.job) return moneyV1844(s.job.salary || 0) + "/yr";
    return educationLineV1844(s);
  }

  function educationLineV1844(s) {
    if (!s) return "No education data";
    if (s.flags && s.flags.inCollege) return "College - " + (s.major || "undecided");
    if (s.school && s.school.level && s.school.level !== "None") return s.school.level;
    if (s.education) return s.education;
    if (s.age >= 5 && s.age <= 18) return "School age";
    return "No active school";
  }

  function gpaLineV1844() {
    try {
      if (typeof calcGPA === "function") return "GPA " + calcGPA().toFixed(2);
    } catch (e) {}
    return "GPA unknown";
  }

  function logTextV1844(item) {
    if (!item) return "";
    if (typeof item === "string") return item;
    return item.text || item.message || item.body || item.title || "";
  }

  function shortTextV1844(text, max) {
    text = String(text || "").replace(/\s+/g, " ").trim();
    max = max || 118;
    if (text.length <= max) return text;
    var clipped = text.slice(0, max - 1);
    var lastSpace = clipped.lastIndexOf(" ");
    if (lastSpace > 60) clipped = clipped.slice(0, lastSpace);
    return clipped + "...";
  }

  function logAgeV1844(item) {
    if (!item || typeof item !== "object") return "";
    return item.age === undefined || item.age === null ? "" : "Age " + item.age;
  }

  function latestLogsV1844(s, count) {
    var log = Array.isArray(s && s.log) ? s.log : [];
    return log.slice(0, count || 5).filter(function (item) { return !!logTextV1844(item); });
  }

  function focusLabelV1844(s) {
    var id = s && s.life && s.life.focus;
    try {
      if (typeof lifeFocusCatalog !== "undefined" && Array.isArray(lifeFocusCatalog)) {
        var found = lifeFocusCatalog.find(function (item) { return item.id === id; });
        if (found) return found.name;
      }
    } catch (e) {}
    return id ? String(id).replace(/_/g, " ") : "Balanced";
  }

  function lifestyleLabelV1844(s) {
    var id = s && s.life && s.life.lifestyle;
    try {
      if (typeof lifestyleCatalog !== "undefined" && Array.isArray(lifestyleCatalog)) {
        var found = lifestyleCatalog.find(function (item) { return item.id === id; });
        if (found) return found.name;
      }
    } catch (e) {}
    return id ? String(id).replace(/_/g, " ") : "Modest";
  }

  function activeGoalV1844(s) {
    var id = s && s.life && s.life.activeGoal;
    if (!id) return null;
    try {
      if (typeof lifeGoalCatalog !== "undefined" && Array.isArray(lifeGoalCatalog)) {
        var found = lifeGoalCatalog.find(function (item) { return item.id === id; });
        if (found) return found;
      }
    } catch (e) {}
    return { id: id, name: String(id).replace(/_/g, " ") };
  }

  function suggestedActionsV1844(s) {
    try {
      if (typeof getSuggestedActions === "function") return getSuggestedActions(s).slice(0, 4);
    } catch (e) {}
    return [];
  }

  function routeHubV1844(hubId) {
    var target = String(hubId || "lifehub");
    if (target === "job") target = "career";
    if (target === "education") target = "school";
    if (target === "investments") target = "brokerage";
    try {
      if (typeof window.setTabV16 === "function") return window.setTabV16(target);
    } catch (e) {}
    try {
      if (typeof window.setTabV11 === "function") return window.setTabV11(target);
    } catch (e2) {}
    try {
      if (typeof window.setTab === "function") return window.setTab(target);
    } catch (e3) {}
    try {
      if (typeof setTab === "function") return setTab(target);
    } catch (e4) {}
    return false;
  }

  window.openLifeCommandHubV1844 = routeHubV1844;

  window.runLifeCommandActionV1844 = function (index) {
    var s = getStateV1844();
    var actions = suggestedActionsV1844(s);
    var action = actions[Math.max(0, Math.min(actions.length - 1, Number(index) || 0))];
    if (!action || !action.action) return false;
    try {
      var fn = Function(action.action);
      fn.call(window);
    } catch (e) {
      try {
        if (typeof addToast === "function") addToast("That action could not run.");
      } catch (e2) {}
    }
    return false;
  };

  window.runLifeUtilityV1844 = function (action) {
    action = String(action || "");
    try {
      if (action === "goal") {
        var s = getStateV1844();
        var goal = activeGoalV1844(s);
        if (goal && goal.id === "bestfriend") {
          var close = syncPersonalGoalProgressV1844(s);
          if (close.ready) {
            s.life.goalProgress[goal.id] = 100;
            var completed = false;
            try {
              if (typeof completeLifeGoal === "function") {
                completeLifeGoal(goal.id);
                completed = true;
              }
            } catch (e0) {}
            try {
              if (!completed && typeof window.completeLifeGoal === "function") {
                window.completeLifeGoal(goal.id);
                completed = true;
              }
            } catch (e1) {}
            try { if (typeof addToast === "function") addToast(completed ? "Close-bond goal completed." : "Close-bond progress is ready."); } catch (e2) {}
            try { if (typeof save === "function") save(); } catch (e3) {}
            try { if (typeof render === "function") render(); } catch (e4) {}
            return false;
          }
        }
        if (typeof window.pursueLifeGoal === "function") return window.pursueLifeGoal();
      }
      if (action === "ai" && typeof window.doLifestyleActionV8 === "function") return window.doLifestyleActionV8("ai_coach");
      if (action === "save") {
        if (typeof window.createWaybackCheckpointV18333 === "function") return window.createWaybackCheckpointV18333("Manual checkpoint");
        if (typeof window.createWaybackCheckpointV1823 === "function") return window.createWaybackCheckpointV1823();
        if (typeof window.createTimeCheckpointV1816 === "function") return window.createTimeCheckpointV1816("Manual checkpoint");
      }
      if (action === "rewind") {
        if (typeof window.waybackLifeSlotV18333 === "function") return window.waybackLifeSlotV18333(typeof activeSlot !== "undefined" ? activeSlot : 1);
        if (typeof window.waybackLifeSlotV1823 === "function") return window.waybackLifeSlotV1823(typeof activeSlot !== "undefined" ? activeSlot : 1);
        if (typeof window.rewindOneYearV1814 === "function") return window.rewindOneYearV1814();
      }
    } catch (e) {
      try { if (typeof addToast === "function") addToast("Life tool could not run."); } catch (e2) {}
    }
    return false;
  };

  function statCardV1844(label, value, detail, cls) {
    return '<div class="life-v1844-stat ' + escapeV1844(cls || "") + '">' +
      '<span>' + escapeV1844(label) + '</span>' +
      '<b>' + escapeV1844(value) + '</b>' +
      '<em>' + escapeV1844(detail || "") + '</em>' +
    '</div>';
  }

  function meterV1844(value, reverse) {
    value = Math.round(clampV1844(value, 0, 100));
    var cls = reverse ? (value > 70 ? "bad" : value < 35 ? "good" : "warn") : (value >= 70 ? "good" : value < 35 ? "bad" : "warn");
    return '<div class="life-v1844-meter ' + cls + '"><span style="width:' + value + '%"></span></div>';
  }

  function routeButtonV1844(label, hubId, cls) {
    return '<button class="life-v1844-route ' + escapeV1844(cls || "") + '" onclick="event.preventDefault();event.stopPropagation();return openLifeCommandHubV1844(\'' + escapeV1844(hubId) + '\')">' + escapeV1844(label) + '</button>';
  }

  function renderLifeHomePanelV1844() {
    var s = getStateV1844();
    if (!s || !s.alive) return "";
    try {
      if (typeof ensureStateShape === "function") ensureStateShape();
    } catch (e) {}

    var partner = partnerV1844(s);
    var children = childrenV1844(s);
    var close = syncPersonalGoalProgressV1844(s);
    var net = netWorthV1844(s);
    var stress = statV1844(s, "stress");
    var health = statV1844(s, "health");
    var happiness = statV1844(s, "happiness");
    var goal = activeGoalV1844(s);
    var logs = latestLogsV1844(s, 3);
    var actions = suggestedActionsV1844(s);
    var hasSchool = s.age >= 5 && (s.age <= 18 || (s.flags && s.flags.inCollege));
    var canWork = s.age >= 14;
    var currentStory = logs[0] ? shortTextV1844(logTextV1844(logs[0]), 78) : "A quiet year is waiting for your next move.";

    var routeButtons = [
      routeButtonV1844("Life Hub", "lifehub", "gold"),
      routeButtonV1844("People", "people", "people"),
      hasSchool ? routeButtonV1844("Education", "school", "school") : "",
      canWork ? routeButtonV1844("Job", "career", "job") : "",
      routeButtonV1844("Finance", "finance", "finance"),
      routeButtonV1844("Money", "money", "money")
    ].filter(Boolean).join("");

    var actionHtml = actions.length ? actions.map(function (a, index) {
      return '<button class="life-v1844-action ' + (a.urgent ? "urgent" : "") + '" onclick="event.preventDefault();event.stopPropagation();return runLifeCommandActionV1844(' + index + ')">' + escapeV1844(a.label || "Next move") + '</button>';
    }).join("") : routeButtonV1844("Take care of yourself", "people", "people");

    return '<section class="life-command-v1844" aria-label="Life command center">' +
      '<div class="life-v1844-hero">' +
        '<div>' +
          '<div class="life-v1844-kicker">Life Command</div>' +
          '<h1>' + escapeV1844(s.name || "Your life") + ' <span>' + escapeV1844(s.age || 0) + '</span></h1>' +
          '<p>' + escapeV1844(stageV1844(s)) + ' - ' + escapeV1844(focusLabelV1844(s)) + ' focus - ' + escapeV1844(lifestyleLabelV1844(s)) + ' lifestyle</p>' +
        '</div>' +
        '<div class="life-v1844-worth"><span>Net Worth</span><b>' + escapeV1844(moneyV1844(net)) + '</b><em>Cash ' + escapeV1844(moneyV1844(s.money || 0)) + '</em></div>' +
      '</div>' +
      '<div class="life-v1844-stats">' +
        statCardV1844("Body", health + "%", "Health and energy", health >= 70 ? "good" : health < 35 ? "bad" : "warn") +
        statCardV1844("Mood", happiness + "%", "Happiness pressure", happiness >= 70 ? "good" : happiness < 35 ? "bad" : "warn") +
        statCardV1844("Stress", stress + "%", stress > 70 ? "Needs relief" : "Manageable", stress > 70 ? "bad" : stress < 35 ? "good" : "warn") +
        statCardV1844("IQ", effectiveIqV1844(s), gpaLineV1844(), "school") +
      '</div>' +
      '<div class="life-v1844-grid">' +
        '<article class="life-v1844-card story">' +
          '<div class="life-v1844-label">Current Story</div>' +
          '<h2>' + escapeV1844(currentStory) + '</h2>' +
          '<div class="life-v1844-chipline">' +
            '<span>' + escapeV1844(goal ? ("Goal: " + goal.name) : "No active goal") + '</span>' +
            '<span>' + escapeV1844("Glow: " + close.glow) + '</span>' +
            '<span>' + escapeV1844(children.length + " children") + '</span>' +
            '<span>' + escapeV1844(partner ? partner.name || partner.role : "No partner") + '</span>' +
          '</div>' +
        '</article>' +
        '<article class="life-v1844-card">' +
          '<div class="life-v1844-label">People</div>' +
          '<h3>' + escapeV1844(partner ? (partner.role + ": " + partner.name) : "Relationships open") + '</h3>' +
          '<p>' + escapeV1844(children.length ? children.length + " children at home or in the family stack." : "Build friendships, dating, and family when it matters.") + '</p>' +
          meterV1844(partner ? ((numberV1844(partner.bond) + numberV1844(partner.trust)) / 2) : 55, false) +
        '</article>' +
        '<article class="life-v1844-card">' +
          '<div class="life-v1844-label">Work / School</div>' +
          '<h3>' + escapeV1844(jobTitleV1844(s)) + '</h3>' +
          '<p>' + escapeV1844(jobDetailV1844(s)) + ' - ' + escapeV1844(educationLineV1844(s)) + '</p>' +
          '<div class="life-v1844-chipline"><span>' + escapeV1844(gpaLineV1844()) + '</span><span>Age ' + escapeV1844(s.age || 0) + '</span></div>' +
        '</article>' +
      '</div>' +
      '<div class="life-v1844-actions">' +
        '<div><div class="life-v1844-label">Next Moves</div><div class="life-v1844-action-row">' + actionHtml + '</div></div>' +
        '<div><div class="life-v1844-label">Open</div><div class="life-v1844-route-row">' + routeButtons + '</div></div>' +
      '</div>' +
    '</section>';
  }

  function renderTimelineV1844(s, count) {
    var logs = latestLogsV1844(s, count || 6);
    if (!logs.length) return '<div class="life-v1844-empty">No story entries yet.</div>';
    return logs.map(function (item) {
      return '<div class="life-v1844-timeline-item"><span>' + escapeV1844(logAgeV1844(item)) + '</span><b>' + escapeV1844(logTextV1844(item)) + '</b></div>';
    }).join("");
  }

  function renderGoalRailV1844(s) {
    var goal = activeGoalV1844(s);
    var close = syncPersonalGoalProgressV1844(s);
    var progress = goalProgressV1844(s, goal);
    if (!goal) {
      return '<div class="life-v1844-hub-card"><div class="life-v1844-label">Chapter Goal</div><h3>No active personal goal</h3><p>Pick a direction below, then work on it between age-ups.</p>' + routeButtonV1844("Choose Goal", "lifehub", "gold") + '</div>';
    }
    var bondScan = "";
    if (goal.id === "bestfriend") {
      bondScan = '<div class="life-v1844-bond-scan">' +
        '<div><span>Close bonds detected</span><b>' + escapeV1844(close.count) + '</b><em>' + escapeV1844(close.names.length ? close.names.join(", ") : "No close circle yet") + '</em></div>' +
        '<strong class="' + escapeV1844(close.tone) + '">' + escapeV1844(close.glow) + '</strong>' +
      '</div>';
    }
    return '<div class="life-v1844-hub-card"><div class="life-v1844-label">Chapter Goal</div><h3>' + escapeV1844(goal.name) + '</h3><p>' + escapeV1844(goal.desc || "Progress this life goal each year.") + '</p>' + bondScan + meterV1844(progress, false) + '<div class="life-v1844-chipline"><span>' + Math.round(progress) + '% complete</span>' + (goal.id === "bestfriend" && close.ready ? '<span>Ready to claim</span>' : "") + '</div>' + toolButtonV1844(goal.id === "bestfriend" && close.ready ? "Claim goal" : "Work on goal", "goal", "gold", false) + '</div>';
  }

  function toolButtonV1844(label, action, cls, disabled) {
    return '<button class="life-v1844-tool ' + escapeV1844(cls || "") + '" onclick="event.preventDefault();event.stopPropagation();return runLifeUtilityV1844(\'' + escapeV1844(action) + '\')" ' + (disabled ? "disabled" : "") + '>' + escapeV1844(label) + '</button>';
  }

  function renderLifeToolDeskV1844(s) {
    var goal = activeGoalV1844(s);
    var close = syncPersonalGoalProgressV1844(s);
    var goalDone = false;
    try {
      goalDone = !!(goal && s.actionsTaken && s.actionsTaken["goal_" + goal.id]);
    } catch (e) {}
    var closeReady = !!(goal && goal.id === "bestfriend" && close.ready);
    var stress = statV1844(s, "stress");
    var waybackCount = Array.isArray(s.timeSnapshotsV1814) ? s.timeSnapshotsV1814.length : 0;
    return '<section class="life-v1844-tool-desk">' +
      '<div class="life-v1844-label">Life Tools</div>' +
      '<div class="life-v1844-tool-grid">' +
        '<div class="life-v1844-tool-card"><h3>Goal move</h3><p>' + escapeV1844(goal ? (goal.id === "bestfriend" ? close.count + " close bonds are carrying this goal." : goal.name) : "Pick a chapter goal below.") + '</p>' + toolButtonV1844(closeReady ? "Claim bond goal" : goalDone ? "Used this year" : "Work on goal", "goal", "gold", !goal || (goalDone && !closeReady)) + '</div>' +
        '<div class="life-v1844-tool-card"><h3>Recovery</h3><p>Stress ' + escapeV1844(stress) + '%. Use the repeatable coach when life gets noisy.</p>' + toolButtonV1844("AI Coach", "ai", "blue", false) + '</div>' +
        '<div class="life-v1844-tool-card"><h3>Checkpoint</h3><p>' + escapeV1844(waybackCount) + ' saves. Full restore list stays in More.</p><div class="life-v1844-tool-row">' + toolButtonV1844("Save", "save", "blue", false) + toolButtonV1844("Rewind", "rewind", "gold", !waybackCount) + '</div></div>' +
      '</div>' +
    '</section>';
  }

  function renderLifeHubCommandV1844() {
    var s = getStateV1844();
    if (!s || !s.alive) return "";
    try {
      if (typeof ensureStateShape === "function") ensureStateShape();
    } catch (e) {}
    var net = netWorthV1844(s);
    var stress = statV1844(s, "stress");
    var health = statV1844(s, "health");
    var children = childrenV1844(s);
    var partner = partnerV1844(s);
    var close = syncPersonalGoalProgressV1844(s);
    var memories = (s.life && Array.isArray(s.life.memories)) ? s.life.memories.slice(0, 4) : [];

    return '<div class="lifehub-command-v1844">' +
      '<section class="life-v1844-hub-hero">' +
        '<div><div class="life-v1844-kicker">Chapter Desk</div><h2>' + escapeV1844(stageV1844(s)) + ' at age ' + escapeV1844(s.age || 0) + '</h2><p>Life hub now starts with the big picture, then the older focus, lifestyle, goals, and memories stay below.</p></div>' +
        '<div class="life-v1844-hub-worth"><span>Net worth</span><b>' + escapeV1844(moneyV1844(net)) + '</b><em>' + escapeV1844(focusLabelV1844(s)) + ' focus</em></div>' +
      '</section>' +
      '<section class="life-v1844-hub-grid">' +
        statCardV1844("Health", health + "%", "Body stability", health >= 70 ? "good" : health < 35 ? "bad" : "warn") +
        statCardV1844("Stress", stress + "%", stress > 70 ? "Needs attention" : "Under control", stress > 70 ? "bad" : stress < 35 ? "good" : "warn") +
        statCardV1844("Family", children.length, partner ? (partner.role + ": " + partner.name) : "No partner", "people") +
        statCardV1844("Personal Glow", close.glow, close.count + " close bonds", close.tone) +
        statCardV1844("Career", s.job ? (s.job.title || "Working") : "Open", s.job ? moneyV1844(s.job.salary || 0) + "/yr" : educationLineV1844(s), "job") +
      '</section>' +
      '<section class="life-v1844-hub-two">' +
        '<div class="life-v1844-hub-card"><div class="life-v1844-label">Recent Timeline</div>' + renderTimelineV1844(s, 5) + '</div>' +
        renderGoalRailV1844(s) +
      '</section>' +
      renderLifeToolDeskV1844(s) +
      '<section class="life-v1844-hub-two">' +
        '<div class="life-v1844-hub-card compact"><div class="life-v1844-label">Stack</div><h3>Life files stay below</h3><p>Successor, family line, and checkpoint tools are still here, just no longer shoved above the chapter desk.</p><div class="life-v1844-route-row">' + routeButtonV1844("Open More", "more", "gold") + routeButtonV1844("People", "people", "people") + '</div></div>' +
        '<div class="life-v1844-hub-card"><div class="life-v1844-label">Memories</div>' + (memories.length ? memories.map(function (m) { return '<div class="life-v1844-memory"><span>Age ' + escapeV1844(m.age) + '</span><b>' + escapeV1844(m.text) + '</b></div>'; }).join("") : '<p>No memories yet. Major choices will collect here.</p>') + '</div>' +
      '</section>' +
    '</div>';
  }

  function removeSectionByClassV1844(html, className) {
    html = String(html || "");
    var idx = html.indexOf(className);
    var guard = 0;
    while (idx >= 0 && guard++ < 20) {
      var start = html.lastIndexOf("<section", idx);
      var end = html.indexOf("</section>", idx);
      if (start < 0 || end < 0 || end <= start) break;
      html = html.slice(0, start) + html.slice(end + 10);
      idx = html.indexOf(className);
    }
    return html;
  }

  function cleanLifeHubHtmlV1844(html) {
    ["v18333-wayback", "v1826-wayback", "v1823-wayback-card", "v1821-wayback-more"].forEach(function (className) {
      html = removeSectionByClassV1844(html, className);
    });
    return html;
  }

  function injectHomePanelV1844() {
    var s = getStateV1844();
    if (!s || !s.alive) return;
    var app = null;
    try {
      if (typeof document !== "undefined") app = document.getElementById ? document.getElementById("app") : null;
      if (!app && typeof document !== "undefined" && document.querySelector) app = document.querySelector("#app");
    } catch (e) {}
    if (!app || typeof app.innerHTML !== "string") return;
    if (app.innerHTML.indexOf("life-command-v1844") >= 0) return;
    var panel = renderLifeHomePanelV1844();
    if (!panel) return;
    var marker = '<div class="ribbon"';
    var idx = app.innerHTML.indexOf(marker);
    if (idx >= 0) app.innerHTML = app.innerHTML.slice(0, idx) + panel + app.innerHTML.slice(idx);
    else app.innerHTML = panel + app.innerHTML;
  }

  function wrapRenderV1844() {
    var previous = window.render || null;
    try {
      if (!previous && typeof render === "function") previous = render;
    } catch (e) {}
    if (typeof previous !== "function" || previous.__v1844LifeCommand) return;
    var wrapped = function () {
      var out = previous.apply(this, arguments);
      try { injectHomePanelV1844(); } catch (e) {}
      return out;
    };
    wrapped.__v1844LifeCommand = true;
    window.render = wrapped;
    try { render = wrapped; } catch (e2) {}
  }

  function wrapLifeHubContentV1844() {
    var previous = window.renderHubContent || null;
    try {
      if (!previous && typeof renderHubContent === "function") previous = renderHubContent;
    } catch (e) {}
    if (typeof previous !== "function" || previous.__v1844LifeCommandHub) return;
    var wrapped = function (hubId) {
      var id = String(hubId || "");
      var html = previous.apply(this, arguments) || "";
      if (id === "lifehub" || id === "life" || id === "stack" || id === "life-stack") {
        html = cleanLifeHubHtmlV1844(html);
        if (String(html).indexOf("lifehub-command-v1844") < 0) {
          return renderLifeHubCommandV1844() + html;
        }
      }
      return html;
    };
    wrapped.__v1844LifeCommandHub = true;
    window.renderHubContent = wrapped;
    try { renderHubContent = wrapped; } catch (e2) {}
  }

  function installStylesV1844() {
    if (typeof document === "undefined" || !document.createElement || !document.head) return;
    if (document.getElementById && document.getElementById("ledger-life-command-v1844-style")) return;
    var style = document.createElement("style");
    style.id = "ledger-life-command-v1844-style";
    style.textContent = [
      ".life-command-v1844{position:relative;margin:10px 0 12px;padding:16px;border:1px solid rgba(216,173,109,.36);border-radius:18px;background:linear-gradient(135deg,rgba(33,27,19,.97),rgba(18,35,35,.94) 54%,rgba(35,24,19,.96));box-shadow:0 18px 48px rgba(0,0,0,.28);overflow:hidden}",
      ".life-command-v1844:before{content:\"\";position:absolute;inset:0;background:linear-gradient(110deg,rgba(216,173,109,.08),transparent 32%,rgba(126,160,172,.1) 65%,transparent);pointer-events:none}",
      ".life-v1844-hero,.life-v1844-grid,.life-v1844-actions,.life-v1844-hub-hero,.life-v1844-hub-two{position:relative;display:grid;gap:12px}",
      ".life-v1844-hero{grid-template-columns:minmax(0,1fr) minmax(160px,220px);align-items:stretch;margin-bottom:12px}",
      ".life-v1844-kicker,.life-v1844-label{font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.18em;color:#d8ad6d;font-size:10px;font-weight:700}",
      ".life-v1844-hero h1{font-size:42px;line-height:.95;margin:7px 0 6px;color:#fff3df;letter-spacing:0}.life-v1844-hero h1 span{color:#f2c978}.life-v1844-hero p,.life-v1844-hub-hero p,.life-v1844-card p,.life-v1844-hub-card p{margin:0;color:#cdbf9f;font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.45}",
      ".life-v1844-worth,.life-v1844-hub-worth{border:1px solid rgba(216,173,109,.28);border-radius:14px;background:rgba(9,8,6,.38);padding:14px;text-align:right;display:flex;flex-direction:column;justify-content:center}.life-v1844-worth span,.life-v1844-hub-worth span{font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.16em;color:#b9a98e;font-size:9px}.life-v1844-worth b,.life-v1844-hub-worth b{font-size:30px;color:#f2c978}.life-v1844-worth em,.life-v1844-hub-worth em{font-style:normal;color:#b9dc8a;font-family:'JetBrains Mono',monospace;font-size:10px}",
      ".life-v1844-stats,.life-v1844-hub-grid{position:relative;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:12px}.life-v1844-stat{min-width:0;border:1px solid rgba(255,255,255,.1);border-radius:12px;background:rgba(255,255,255,.045);padding:11px}.life-v1844-stat span{display:block;font-family:'JetBrains Mono',monospace;color:#b9a98e;text-transform:uppercase;letter-spacing:.13em;font-size:9px}.life-v1844-stat b{display:block;color:#fff3df;font-size:20px;margin:4px 0;overflow-wrap:anywhere}.life-v1844-stat em{display:block;font-style:normal;color:#cdbf9f;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.35}.life-v1844-stat.good b{color:#b9dc8a}.life-v1844-stat.bad b{color:#e9927d}.life-v1844-stat.warn b,.life-v1844-stat.school b,.life-v1844-stat.job b{color:#f2c978}.life-v1844-stat.people b{color:#9fc8d3}",
      ".life-v1844-grid{grid-template-columns:minmax(0,1.2fr) minmax(0,.85fr) minmax(0,.85fr);margin-bottom:12px}.life-v1844-card,.life-v1844-hub-card{min-width:0;border:1px solid rgba(255,255,255,.11);border-radius:14px;background:rgba(13,11,8,.46);padding:14px}.life-v1844-card.story{background:linear-gradient(135deg,rgba(50,37,19,.7),rgba(17,38,38,.54));border-color:rgba(216,173,109,.3)}.life-v1844-card h2,.life-v1844-card h3,.life-v1844-hub-card h3{margin:7px 0;color:#fff3df;line-height:1.08;letter-spacing:0}.life-v1844-card h2{font-size:24px}.life-v1844-card h3,.life-v1844-hub-card h3{font-size:19px}",
      ".life-v1844-chipline,.life-v1844-route-row,.life-v1844-action-row{display:flex;flex-wrap:wrap;gap:7px;align-items:center}.life-v1844-chipline{margin-top:10px}.life-v1844-chipline span{border:1px solid rgba(216,173,109,.26);border-radius:999px;padding:5px 8px;color:#d8d0bd;background:rgba(0,0,0,.18);font-family:'JetBrains Mono',monospace;font-size:9px}",
      ".life-v1844-actions{grid-template-columns:minmax(0,1.15fr) minmax(260px,.85fr);align-items:start;border-top:1px solid rgba(255,255,255,.08);padding-top:12px}.life-v1844-action,.life-v1844-route{border:1px solid rgba(216,173,109,.34);border-radius:999px;background:rgba(30,24,18,.78);color:#f6ead8;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;padding:9px 11px;cursor:pointer;min-width:0}.life-v1844-action.urgent{border-color:rgba(233,146,125,.65);color:#ffb09f;background:rgba(73,30,24,.55)}.life-v1844-route.finance,.life-v1844-route.people{border-color:rgba(126,160,172,.48);background:rgba(25,45,47,.58)}.life-v1844-route.money,.life-v1844-route.gold{border-color:rgba(216,173,109,.56);background:rgba(61,43,18,.58)}.life-v1844-route.school,.life-v1844-route.job{border-color:rgba(185,220,138,.38);background:rgba(32,49,24,.5)}",
      ".life-v1844-meter{height:7px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden;margin-top:10px}.life-v1844-meter span{display:block;height:100%;border-radius:999px}.life-v1844-meter.good span{background:#b9dc8a}.life-v1844-meter.warn span{background:#f2c978}.life-v1844-meter.bad span{background:#e9927d}",
      ".lifehub-command-v1844{display:grid;gap:12px;margin-bottom:14px}.life-v1844-hub-hero{grid-template-columns:minmax(0,1fr) minmax(170px,230px);border:1px solid rgba(126,160,172,.36);border-radius:16px;background:linear-gradient(135deg,rgba(17,38,38,.82),rgba(31,25,18,.88));padding:15px}.life-v1844-hub-hero h2{margin:6px 0;color:#fff3df;font-size:34px;line-height:1;letter-spacing:0}.life-v1844-hub-grid{margin-bottom:0}.life-v1844-hub-two{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.life-v1844-timeline-item,.life-v1844-memory{border-top:1px solid rgba(255,255,255,.08);padding:10px 0}.life-v1844-timeline-item:first-of-type,.life-v1844-memory:first-of-type{border-top:0}.life-v1844-timeline-item span,.life-v1844-memory span{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.12em;font-size:9px}.life-v1844-timeline-item b,.life-v1844-memory b{display:block;color:#f6ead8;line-height:1.25;margin-top:3px}.life-v1844-empty{color:#cdbf9f;font-family:'JetBrains Mono',monospace;font-size:11px}",
      ".life-v1844-tool-desk{border:1px solid rgba(216,173,109,.24);border-radius:15px;background:linear-gradient(135deg,rgba(42,31,18,.68),rgba(16,35,36,.62));padding:13px}.life-v1844-tool-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-top:9px}.life-v1844-tool-card{border:1px solid rgba(255,255,255,.1);border-radius:12px;background:rgba(0,0,0,.18);padding:11px;min-width:0}.life-v1844-tool-card h3{margin:0 0 5px;color:#fff3df;font-size:18px;line-height:1.05}.life-v1844-tool-card p{margin:0 0 10px;color:#cdbf9f;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.35}.life-v1844-tool-row{display:flex;flex-wrap:wrap;gap:7px}.life-v1844-tool{border:1px solid rgba(216,173,109,.4);border-radius:999px;background:rgba(36,28,18,.82);color:#f6ead8;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;padding:8px 10px;cursor:pointer}.life-v1844-tool.blue{border-color:rgba(126,160,172,.5);background:rgba(23,43,46,.7)}.life-v1844-tool.gold{border-color:rgba(216,173,109,.58);background:rgba(66,45,18,.66)}.life-v1844-tool:disabled{opacity:.45;cursor:not-allowed}",
      ".life-v1844-bond-scan{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;border:1px solid rgba(126,160,172,.24);border-radius:12px;background:linear-gradient(135deg,rgba(18,38,39,.68),rgba(35,27,17,.55));padding:10px;margin:10px 0 0}.life-v1844-bond-scan span,.life-v1844-bond-scan em{display:block;font-family:'JetBrains Mono',monospace;font-style:normal;color:#b9a98e;font-size:9px;text-transform:uppercase;letter-spacing:.11em}.life-v1844-bond-scan b{display:block;color:#f2c978;font-size:28px;line-height:1}.life-v1844-bond-scan strong{border:1px solid rgba(216,173,109,.28);border-radius:999px;padding:7px 9px;color:#f2c978;background:rgba(0,0,0,.16);font-family:'JetBrains Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:.08em;white-space:nowrap}.life-v1844-bond-scan strong.good{border-color:rgba(185,220,138,.36);color:#b9dc8a;background:rgba(30,55,25,.22)}.life-v1844-bond-scan strong.people{border-color:rgba(126,160,172,.38);color:#9fc8d3;background:rgba(18,44,47,.24)}",
      ".lifehub-command-v1844 .life-v1844-hub-grid{grid-template-columns:repeat(auto-fit,minmax(132px,1fr))!important}.lifehub-command-v1844 .life-v1844-stat{min-height:82px}",
      ".hub-lifehub .life-dashboard{display:grid!important;gap:12px!important}.hub-lifehub .life-dashboard>.panel:not(.v1816-life-tools){position:relative;border:1px solid rgba(216,173,109,.22)!important;border-radius:15px!important;background:linear-gradient(135deg,rgba(36,29,21,.86),rgba(20,18,14,.92))!important;box-shadow:0 12px 28px rgba(0,0,0,.18)!important;padding:14px!important;overflow:hidden}.hub-lifehub .life-dashboard>.panel:not(.v1816-life-tools):before{content:\"\";position:absolute;inset:0;background:linear-gradient(110deg,rgba(216,173,109,.055),transparent 34%,rgba(126,160,172,.045));pointer-events:none}.hub-lifehub .life-dashboard>.panel:not(.v1816-life-tools)>*{position:relative}.hub-lifehub .life-dashboard .section-label{font-size:9px!important;letter-spacing:.18em!important;color:#d8ad6d!important}.hub-lifehub .life-dashboard .row-title{font-size:20px!important;line-height:1.08!important;color:#fff3df!important;overflow-wrap:anywhere}.hub-lifehub .life-dashboard .row-sub{font-size:10px!important;line-height:1.45!important;color:#cdbf9f!important}.hub-lifehub .life-dashboard .lf-pill-row{display:flex!important;flex-wrap:wrap!important;gap:7px!important;margin-top:10px!important}.hub-lifehub .life-dashboard .lf-pill{min-width:0!important;border-radius:999px!important;padding:4px 7px!important;font-size:9px!important;line-height:1.15!important;background:rgba(0,0,0,.18)!important}",
      ".hub-lifehub .life-dashboard .lf-grid{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr))!important;gap:10px!important;align-items:stretch!important}.hub-lifehub .life-dashboard .lf-grid-3{grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr))!important}.hub-lifehub .life-dashboard .lf-card{min-width:0!important;min-height:96px!important;border:1px solid rgba(255,255,255,.1)!important;border-radius:12px!important;background:rgba(12,10,7,.42)!important;padding:13px!important;text-align:left!important;color:#f6ead8!important;box-shadow:none!important;overflow:hidden!important}.hub-lifehub .life-dashboard .lf-card:hover{border-color:rgba(216,173,109,.42)!important;background:rgba(50,37,20,.5)!important}.hub-lifehub .life-dashboard .lf-card.selected{border-color:rgba(216,173,109,.68)!important;background:linear-gradient(135deg,rgba(69,49,22,.58),rgba(16,38,38,.32))!important}.hub-lifehub .life-dashboard .lf-title{font-size:17px!important;line-height:1.08!important;color:#fff3df!important;overflow-wrap:anywhere}.hub-lifehub .life-dashboard .lf-sub{font-size:10px!important;line-height:1.45!important;color:#cdbf9f!important;margin-top:4px!important}.hub-lifehub .life-dashboard .life-goal-meter{height:8px!important;border-radius:999px!important;background:rgba(255,255,255,.08)!important;overflow:hidden!important;margin:11px 0 0!important}.hub-lifehub .life-dashboard .life-goal-meter span{display:block!important;height:100%!important;border-radius:999px!important;background:linear-gradient(90deg,#d8ad6d,#b9dc8a)!important}",
      ".hub-lifehub .life-dashboard .panel:has(.life-memory){max-height:270px!important;overflow:auto!important}.hub-lifehub .life-dashboard .life-memory{border-left:2px solid rgba(216,173,109,.75)!important;border-top:0!important;padding:8px 0 8px 12px!important;margin:0!important;color:#d8d0bd!important;font-size:12px!important;line-height:1.4!important}.hub-lifehub .life-dashboard .life-memory b{color:#fff3df!important}.hub-lifehub .life-dashboard .mini-actions{display:flex!important;flex-wrap:wrap!important;gap:7px!important}.hub-lifehub .life-dashboard .icon-btn{min-height:34px!important;border-radius:999px!important;font-size:9px!important;letter-spacing:.08em!important;padding:8px 11px!important}.hub-lifehub .life-dashboard>.panel:not(.v1816-life-tools)::-webkit-scrollbar,.hub-lifehub .life-dashboard .lf-grid::-webkit-scrollbar{width:10px;height:10px}.hub-lifehub .life-dashboard>.panel:not(.v1816-life-tools)::-webkit-scrollbar-thumb,.hub-lifehub .life-dashboard .lf-grid::-webkit-scrollbar-thumb{border-radius:999px;background:rgba(216,173,109,.48)}",
      ".hub-lifehub .v1817-recovery-grid,.hub-lifehub .v1814-recovery-grid,.hub-lifehub .v8-responsive-grid{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(100%,185px),1fr))!important;gap:10px!important}.hub-lifehub .v1817-recovery-card,.hub-lifehub .v1814-recovery-card,.hub-lifehub .v8-life-action-card{min-height:0!important;border-radius:12px!important;background:rgba(12,10,7,.45)!important;border-color:rgba(255,255,255,.11)!important;padding:13px!important}.hub-lifehub .v1817-recovery-card h3,.hub-lifehub .v1814-recovery-card h3,.hub-lifehub .v8-life-action-card h3{font-size:18px!important;line-height:1.08!important;margin:0 0 5px!important}.hub-lifehub .v1817-recovery-card p,.hub-lifehub .v1814-recovery-card p,.hub-lifehub .v8-life-action-card p{font-size:10px!important;line-height:1.4!important;color:#cdbf9f!important}.hub-lifehub .v8-bonus-list{display:flex!important;flex-wrap:wrap!important;gap:6px!important;margin-top:8px!important}.hub-lifehub .life-dashboard>.panel:has(.v1817-recovery-card),.hub-lifehub .life-dashboard>.panel:has(.v1814-recovery-card){background:linear-gradient(135deg,rgba(25,43,21,.74),rgba(22,19,14,.92))!important;border-color:rgba(185,220,138,.25)!important}",
      "@media(max-width:760px){.hub-lifehub .life-dashboard>.panel:not(.v1816-life-tools){padding:12px!important}.hub-lifehub .life-dashboard .lf-grid{grid-template-columns:1fr!important}.life-v1844-bond-scan{grid-template-columns:1fr}.life-v1844-bond-scan strong{justify-self:start}.hub-lifehub .life-dashboard .row-title{font-size:18px!important}}",
      ".life-command-v1844{container-type:inline-size}.life-v1844-grid{grid-template-columns:repeat(auto-fit,minmax(min(100%,185px),1fr))!important;align-items:stretch}.life-v1844-card.story{grid-column:1/-1}.life-v1844-card{min-height:0}.life-v1844-card h2{font-size:clamp(18px,4.8cqw,24px);line-height:1.08;overflow-wrap:break-word}.life-v1844-card h3{font-size:clamp(17px,4.2cqw,21px);line-height:1.06;overflow-wrap:break-word}.life-v1844-stats{grid-template-columns:repeat(auto-fit,minmax(96px,1fr))!important}.life-v1844-actions{grid-template-columns:1fr!important}.life-v1844-worth b,.life-v1844-hub-worth b{overflow-wrap:anywhere}.life-v1844-action-row,.life-v1844-route-row{align-content:flex-start}",
      "@container(max-width:640px){.life-v1844-hero{grid-template-columns:1fr!important}.life-v1844-worth{text-align:left;min-height:auto}.life-v1844-hero h1{font-size:clamp(32px,11cqw,44px)!important}.life-v1844-card.story h2{font-size:clamp(19px,5.6cqw,23px)!important}.life-v1844-card{padding:12px}.life-v1844-actions{gap:10px}.life-v1844-action,.life-v1844-route{padding:8px 10px;font-size:9px}}",
      "@container(min-width:720px){.life-v1844-grid{grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr) minmax(0,.9fr)!important}.life-v1844-card.story{grid-column:auto}.life-v1844-actions{grid-template-columns:minmax(0,1.15fr) minmax(260px,.85fr)!important}}",
      ".lifehub-command-v1844 .life-v1844-hub-card.compact{background:rgba(17,38,38,.42);border-color:rgba(126,160,172,.24)}",
      "@media(max-width:860px){.life-v1844-hero,.life-v1844-grid,.life-v1844-actions,.life-v1844-hub-hero,.life-v1844-hub-two{grid-template-columns:1fr}.life-v1844-stats,.life-v1844-hub-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.life-v1844-worth,.life-v1844-hub-worth{text-align:left}.life-v1844-hero h1{font-size:34px}}",
      "@media(max-width:520px){.life-command-v1844{padding:12px;border-radius:14px}.life-v1844-stats,.life-v1844-hub-grid{grid-template-columns:1fr}.life-v1844-action,.life-v1844-route{width:100%;text-align:center}.life-v1844-card h2{font-size:20px}.life-v1844-hub-hero h2{font-size:28px}}",
      ".life-command-v1844{margin:6px 0 8px!important;padding:10px 12px!important;border-radius:14px!important;box-shadow:0 12px 30px rgba(0,0,0,.22)!important}",
      ".life-command-v1844 .life-v1844-hero{grid-template-columns:minmax(0,1fr) minmax(126px,174px)!important;gap:9px!important;margin-bottom:8px!important;align-items:stretch!important}",
      ".life-command-v1844 .life-v1844-kicker,.life-command-v1844 .life-v1844-label{font-size:8px!important;letter-spacing:.15em!important;line-height:1.15!important}",
      ".life-command-v1844 .life-v1844-hero h1{font-size:clamp(26px,7cqw,34px)!important;line-height:.94!important;margin:3px 0 2px!important;letter-spacing:0!important}",
      ".life-command-v1844 .life-v1844-hero p{font-size:9px!important;line-height:1.25!important}",
      ".life-command-v1844 .life-v1844-worth{min-height:68px!important;padding:9px 10px!important;border-radius:11px!important;text-align:right!important}",
      ".life-command-v1844 .life-v1844-worth span,.life-command-v1844 .life-v1844-worth em{font-size:8px!important;line-height:1.2!important;letter-spacing:.1em!important}",
      ".life-command-v1844 .life-v1844-worth b{font-size:clamp(21px,5cqw,28px)!important;line-height:.95!important;margin:2px 0!important}",
      ".life-command-v1844 .life-v1844-stats{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:7px!important;margin-bottom:8px!important}",
      ".life-command-v1844 .life-v1844-stat{padding:7px 8px!important;border-radius:10px!important;min-height:58px!important}",
      ".life-command-v1844 .life-v1844-stat span{font-size:7px!important;letter-spacing:.12em!important}.life-command-v1844 .life-v1844-stat b{font-size:17px!important;line-height:1!important;margin:2px 0!important}.life-command-v1844 .life-v1844-stat em{font-size:8px!important;line-height:1.2!important}",
      ".life-command-v1844 .life-v1844-grid{grid-template-columns:repeat(auto-fit,minmax(min(100%,170px),1fr))!important;gap:8px!important;margin-bottom:8px!important}.life-command-v1844 .life-v1844-card.story{grid-column:1/-1!important}",
      ".life-command-v1844 .life-v1844-card{padding:9px 10px!important;border-radius:11px!important}.life-command-v1844 .life-v1844-card h2{font-size:clamp(17px,4.2cqw,21px)!important;line-height:1.05!important;margin:4px 0!important}.life-command-v1844 .life-v1844-card h3{font-size:clamp(15px,3.6cqw,18px)!important;line-height:1.06!important;margin:4px 0!important}.life-command-v1844 .life-v1844-card p{font-size:9px!important;line-height:1.3!important}",
      ".life-command-v1844 .life-v1844-chipline{margin-top:6px!important;gap:5px!important}.life-command-v1844 .life-v1844-chipline span{font-size:7.5px!important;padding:3px 6px!important}",
      ".life-command-v1844 .life-v1844-meter{height:5px!important;margin-top:7px!important}.life-command-v1844 .life-v1844-actions{grid-template-columns:1fr!important;gap:8px!important;padding-top:8px!important}.life-command-v1844 .life-v1844-action-row,.life-command-v1844 .life-v1844-route-row{gap:5px!important}.life-command-v1844 .life-v1844-action,.life-command-v1844 .life-v1844-route{font-size:8px!important;line-height:1.05!important;padding:6px 8px!important;letter-spacing:.06em!important}",
      "@container(max-width:430px){.life-command-v1844 .life-v1844-hero{grid-template-columns:1fr!important}.life-command-v1844 .life-v1844-worth{text-align:left!important}.life-command-v1844 .life-v1844-stats{grid-template-columns:repeat(2,minmax(0,1fr))!important}.life-command-v1844 .life-v1844-action,.life-command-v1844 .life-v1844-route{width:auto!important}}"
    ].join("\n");
    document.head.appendChild(style);
  }

  installStylesV1844();
  wrapLifeHubContentV1844();
  wrapRenderV1844();
  try { injectHomePanelV1844(); } catch (e) {}

  if (window.registerLedgerSystem) {
    window.registerLedgerSystem({
      id: "life-command",
      file: "pages/systems/life-command.js",
      status: "active",
      globals: ["openLifeCommandHubV1844", "runLifeCommandActionV1844", "runLifeUtilityV1844"],
      notes: "Reworks the Life home surface and Life hub with status cards, next moves, timeline, and chapter planning."
    });
  }
})();
