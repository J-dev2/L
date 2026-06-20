/* Education / career system bridge and school hub organizer. */
(function () {
  if (window.__ledgerEducationCareerSystemLoaded) return;
  window.__ledgerEducationCareerSystemLoaded = true;

  var SCHOOL_MERIT_AGE = 5;
  var CAREER_PLANNING_AGE = 14;
  var CAREER_JOB_ACCESS_AGE = 16;
  var DEGREE_SECTION_MARKERS = [
    "v1827-degree-center",
    "v1825-degree-desk",
    "v1825-career-degree",
    "v1832-education-link"
  ];
  var MERIT_SECTION_MARKERS = ["v1822-merit-note", "Merit Aid Watch"];
  var SPORT_LIMIT_V1835 = 3;
  var SPORT_HOUR_CAP_V1835 = 60;
  var SPORT_LEADERSHIP_V1835 = ["player", "vice", "leader", "captain"];
  var SPORT_LEADERSHIP_LABELS_V1835 = {
    player: "Player",
    vice: "Vice Captain",
    leader: "Team Leader",
    captain: "Captain for Life"
  };
  var CAREER_FILTER_DEFAULT_V1835 = { category: "open", sort: "salary_desc", search: "" };
  var CAREER_SECTION_MARKERS = [
    "v1835-career-desk",
    "v1832-career-command",
    "v1828-career-system",
    "v1827-career-interviews",
    "v1824-career-reqs",
    "v1818-career-reqs",
    "Qualified Careers",
    "Career Ladder",
    "Job</div>"
  ];
  var INDUSTRY_RANKS_V1835 = [
    { min: 20, label: "Industry Authority", bonus: .20, tierBias: 99 },
    { min: 15, label: "Senior Operator", bonus: .14, tierBias: 3 },
    { min: 10, label: "Established Specialist", bonus: .09, tierBias: 2 },
    { min: 5, label: "Field-Tested", bonus: .04, tierBias: 1 },
    { min: 0, label: "Early Track", bonus: 0, tierBias: 0 }
  ];

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch];
    });
  }

  function moneyText(value) {
    try { if (typeof money === "function") return money(Number(value) || 0); } catch (e) {}
    var rounded = Math.round(Number(value) || 0);
    return "$" + rounded.toLocaleString();
  }

  function statNumber(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : (fallback || 0);
  }

  function clampStat(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function safeState() {
    try { return state || window.state || {}; } catch (e) { return window.state || {}; }
  }

  function currentSchoolPage() {
    try {
      if (window.__ledgerSchoolPageV1835) return String(window.__ledgerSchoolPageV1835);
    } catch (e) {}
    try { return String(schoolPage || "overview"); } catch (e2) { return "overview"; }
  }

  function rememberSchoolPage(page) {
    var next = page || "overview";
    try { schoolPage = next; } catch (e) {}
    try { window.__ledgerSchoolPageV1835 = next; } catch (e2) {}
    return next;
  }

  function currentHubId() {
    if (typeof document === "undefined") {
      try { return String(tab || ""); } catch (e) { return ""; }
    }
    var overlay = document.querySelector && document.querySelector(".hub-overlay");
    if (overlay && overlay.dataset && overlay.dataset.hubId) return overlay.dataset.hubId;
    try { return String(tab || ""); } catch (e) { return ""; }
  }

  function isSchoolHub(id) {
    return id === "school" || id === "education";
  }

  function isCareerHub(id) {
    return id === "career" || id === "job" || id === "work";
  }

  function careerPlanningUnlocked() {
    var s = safeState();
    var flags = s.flags || {};
    var age = Number(s.age) || 0;
    var degreeIds = s.degreeIds || s.degrees || [];
    return age >= CAREER_PLANNING_AGE || !!flags.inCollege || !!flags.hasDegree || !!s.college || (Array.isArray(degreeIds) && degreeIds.length > 0);
  }

  function schoolStageSafe() {
    try { if (typeof schoolStageKey === "function") return schoolStageKey(); } catch (e) {}
    var s = safeState();
    var age = Number(s.age) || 0;
    if (s.flags && s.flags.inCollege) return "college";
    if (age < 5) return "preschool";
    if (age <= 11) return "elementary";
    if (age <= 13) return "middle";
    if (age <= 18) return "high";
    return "adult";
  }

  function schoolStageTitle() {
    var stage = schoolStageSafe();
    return { preschool: "Pre-school", elementary: "Elementary School", middle: "Middle School", high: "High School", college: "College", adult: "Adult" }[stage] || "School";
  }

  function stageTitleFromKey(stage) {
    return { elementary: "Elementary School", middle: "Middle School", high: "High School", college: "College" }[stage] || stage;
  }

  function effectiveIQSafe() {
    try { if (typeof effectiveIQ === "function") return Number(effectiveIQ()) || 100; } catch (e) {}
    var s = safeState();
    return Number((s.traits || {}).iq) || Number((s.traits || {}).iqPotential) || Number((s.stats || {}).smarts) || 100;
  }

  function gpaSafe() {
    try { if (typeof calcGPA === "function") return Number(calcGPA()) || 0; } catch (e) {}
    var school = safeState().school || {};
    return Number(school.lastGPA) || 0;
  }

  function adjustedGpaForIq(base) {
    var s = safeState();
    var iq = effectiveIQSafe();
    var stats = s.stats || {};
    var adjusted = Number(base) || 0;
    var support = Math.max(statNumber(stats.smarts, 50), statNumber(stats.discipline, 50));
    if (iq < 70) adjusted -= .85;
    else if (iq < 80) adjusted -= .62;
    else if (iq < 90) adjusted -= .38;
    else if (iq < 100) adjusted -= .12;
    if (iq < 75 && support < 90) adjusted = Math.min(adjusted, 2.85);
    else if (iq < 85 && support < 92) adjusted = Math.min(adjusted, 3.20);
    else if (iq < 95 && support < 88) adjusted = Math.min(adjusted, 3.55);
    return Math.max(0, Math.min(4, adjusted));
  }

  function iqLearningProfile() {
    var iq = effectiveIQSafe();
    if (iq < 70) return { label: "Major learning support", cls: "bad", note: "Lower IQ sharply slows independent classwork. High discipline and support can still help, but perfect grades should be rare." };
    if (iq < 85) return { label: "Learning friction", cls: "bad", note: "Lower IQ now creates a real GPA drag unless Smarts, discipline, and school support are excellent." };
    if (iq < 100) return { label: "Slight academic drag", cls: "gold", note: "Average-below IQ makes hard classes less automatic. Homework and tutoring matter more." };
    if (iq >= 145) return { label: "Acceleration edge", cls: "good", note: "High IQ improves learning speed, test readiness, and grade-skip potential." };
    return { label: "Standard learning curve", cls: "good", note: "Grades depend mostly on subject scores, discipline, conduct, absences, and school choices." };
  }

  function iqLearningCard() {
    var profile = iqLearningProfile();
    var gpa = gpaSafe();
    var gpaPct = Math.max(0, Math.min(100, Math.round((gpa / 4) * 100)));
    var gpaKind = gpa >= 3 ? "high" : gpa < 2 ? "low" : "";
    return '<section class="panel v1835-iq-dynamics"><div class="section-label">🧠 IQ Learning Dynamics</div><div class="row"><div><div class="row-title">' + esc(profile.label) + '</div><div class="row-sub">' + esc(profile.note) + '<div class="bar"><div class="fill ' + gpaKind + '" style="width:' + gpaPct + '%"></div></div></div></div><span class="school-badge ' + esc(profile.cls) + '">GPA ' + esc(gpa.toFixed(2)) + '</span></div></section>';
  }

  function schoolChoiceNameForStage(stage) {
    var s = safeState();
    if (stage === "college") {
      if (s.flags && s.flags.inCollege) return "College enrolled";
      if (s.flags && s.flags.hasDegree) return "College complete";
      return "College path later";
    }
    var id = (((s.school || {}).schoolChoices || {})[stage]) || "";
    try {
      var match = (schoolTypeOptions || []).find(function (opt) { return opt && opt.id === id && (!opt.stages || opt.stages.indexOf(stage) >= 0); });
      if (match) return match.name;
    } catch (e) {}
    return stage === schoolStageSafe() ? schoolDisplayNameSafe() : "Not chosen yet";
  }

  function schoolDisplayNameSafe() {
    try { if (typeof schoolDisplayName === "function") return schoolDisplayName(); } catch (e) {}
    return schoolStageTitle();
  }

  function schoolStagePathCard() {
    var current = schoolStageSafe();
    var stages = ["elementary", "middle", "high", "college"];
    return '<section class="panel v1835-school-path"><div class="section-label">🏫 School Path</div><div class="v1835-school-stage-rail">' + stages.map(function (stage) {
      return '<div class="v1835-school-stage ' + (stage === current ? "active" : "") + '"><span>' + esc(stageTitleFromKey(stage)) + '</span><b>' + esc(schoolChoiceNameForStage(stage)) + '</b></div>';
    }).join("") + '</div><div class="row-sub">Elementary, middle, high school, and college are shown as separate steps so private/public/magnet choices are easier to understand.</div></section>';
  }

  function subjectAverageSafe() {
    try { if (typeof subjectAverage === "function") return Number(subjectAverage()) || 75; } catch (e) {}
    var school = safeState().school || {};
    var grades = school.subjectGrades || {};
    var values = Object.keys(grades).map(function (key) { return Number(grades[key]) || 0; }).filter(Boolean);
    return values.length ? values.reduce(function (sum, value) { return sum + value; }, 0) / values.length : 75;
  }

  function earlyMeritPackage() {
    var s = safeState();
    var age = Number(s.age) || 0;
    if (age < SCHOOL_MERIT_AGE) {
      return { type: "K-12 Merit", annualAward: 0, fullRide: false, reason: "Merit aid opens when actual school starts." };
    }
    if (age > 18 || (s.flags && s.flags.inCollege)) {
      return { type: "K-12 Merit", annualAward: 0, fullRide: false, reason: "K-12 private-school merit aid is for school-age years." };
    }
    var stats = s.stats || {};
    var iq = effectiveIQSafe();
    var gpa = gpaSafe();
    var avg = subjectAverageSafe();
    var discipline = statNumber(stats.discipline, 50);
    var smarts = statNumber(stats.smarts, 50);
    var score = Math.round(iq * 1.25 + avg * 0.55 + discipline * 0.35 + smarts * 0.30 + gpa * 18);
    var fullRide = false;
    var annualAward = 0;
    var reason = "Raise IQ/smarts, grades, discipline, and school record for K-12 aid.";
    if (iq >= 185 && (avg >= 84 || gpa >= 3.35)) {
      fullRide = true;
      annualAward = 999999;
      reason = "Genius-level academic profile: private-school full ride is realistic.";
    } else if (iq >= 165 && (avg >= 78 || gpa >= 3.0)) {
      annualAward = 28000;
      reason = "Elite gifted profile: enough aid for prep or boarding-school tuition.";
    } else if (iq >= 145 && (avg >= 74 || gpa >= 2.7)) {
      annualAward = 12000;
      reason = "Gifted academic profile: private prep merit aid is possible.";
    } else if (iq >= 130 || score >= 245) {
      annualAward = 5200;
      reason = "Strong student profile: parochial or partial private-school aid is possible.";
    } else if (score >= 220) {
      annualAward = 1800;
      reason = "Good early record: small K-12 merit grant is possible.";
    }
    return { type: "K-12 Merit", strength: score, annualAward: annualAward, fullRide: fullRide, reason: reason };
  }

  function findSectionBounds(html, marker) {
    var markerAt = html.indexOf(marker);
    if (markerAt < 0) return null;
    var start = html.lastIndexOf("<section", markerAt);
    var end = html.indexOf("</section>", markerAt);
    if (start < 0 || end < 0) return null;
    return { start: start, end: end + "</section>".length };
  }

  function pullSections(html, markers) {
    var found = [];
    var changed = true;
    html = String(html || "");
    while (changed) {
      changed = false;
      for (var i = 0; i < markers.length; i += 1) {
        var bounds = findSectionBounds(html, markers[i]);
        if (!bounds) continue;
        found.push(html.slice(bounds.start, bounds.end));
        html = html.slice(0, bounds.start) + html.slice(bounds.end);
        changed = true;
        break;
      }
    }
    return { html: html, sections: found };
  }

  function insertAfterFirstSection(html, chunk) {
    if (!chunk) return html;
    var end = String(html || "").indexOf("</section>");
    return end >= 0 ? html.slice(0, end + "</section>".length) + chunk + html.slice(end + "</section>".length) : chunk + html;
  }

  function scholarshipProjection() {
    var early = earlyMeritPackage();
    try {
      var pack = null;
      if (typeof bestScholarshipPackage === "function") pack = bestScholarshipPackage();
      else if (typeof window.bestScholarshipPackage === "function") pack = window.bestScholarshipPackage();
      if (pack && pack.winner) {
        var winner = pack.winner;
        if (early.fullRide || (Number(early.annualAward) || 0) > (Number(winner.annualAward) || 0)) {
          return { academic: early, athletic: pack.athletic, winner: early };
        }
        return pack;
      }
    } catch (e) {}
    return { winner: early };
  }

  function scholarshipDecision() {
    var s = safeState();
    var school = s.school || {};
    var actions = s.actionsTaken || {};
    var offer = school.scholarshipOffer || null;
    var stored = school.scholarshipDecision || null;
    var award = Number((offer && offer.annualAward) || school.scholarshipAward || 0);
    if (offer || award > 0) {
      return {
        status: "approved",
        type: (offer && offer.type) || "Merit Aid",
        annualAward: award,
        fullRide: !!(offer && offer.fullRide) || award >= 999999,
        reason: (offer && offer.reason) || (stored && stored.reason) || "Scholarship aid is on file.",
        age: (offer && offer.ageAwarded) || (stored && stored.age) || s.age
      };
    }
    if (stored && stored.status === "not_awarded" && stored.age === s.age) return stored;
    if (actions.scholarshipApply) {
      return {
        status: "not_awarded",
        type: "No award",
        annualAward: 0,
        fullRide: false,
        reason: "Applications went out, but no scholarship came through this year.",
        age: s.age
      };
    }
    if ((Number(s.age) || 0) < SCHOOL_MERIT_AGE) return { status: "locked", reason: "Merit aid opens when actual school starts." };
    if ((Number(s.age) || 0) > 21) return { status: "closed", reason: "Traditional merit aid applications usually close after age 21." };
    return { status: "ready" };
  }

  function buildMeritStatusCard() {
    var s = safeState();
    var decision = scholarshipDecision();
    var pack = scholarshipProjection();
    var winner = pack.winner || {};
    var projected = winner.fullRide ? "Full ride possible" : moneyText(winner.annualAward || 0) + " / yr possible";
    var title = projected;
    var sub = (winner.reason || "Scholarship profile is building.") + " Apply to lock in a real decision.";
    var badge = "Projection";
    var cls = "ready";
    var action = '<button class="icon-btn" onclick="applyScholarships()">Apply</button>';

    if (decision.status === "approved") {
      title = decision.fullRide ? "Full ride approved" : moneyText(decision.annualAward || 0) + " / yr approved";
      sub = "You are on " + (decision.type || "Merit Aid") + ". " + (decision.reason || "Scholarship aid is on file.");
      badge = "On file";
      cls = "approved";
      action = '<button class="icon-btn" disabled>On File</button>';
    } else if (decision.status === "not_awarded") {
      title = "No award this year";
      sub = decision.reason || "Applications went out, but no scholarship came through this year.";
      badge = "Applied";
      cls = "missed";
      action = '<button class="icon-btn" disabled>Applied</button>';
    } else if (decision.status === "locked" || decision.status === "closed") {
      title = decision.status === "locked" ? "Merit aid opens at school age" : "Merit aid window closed";
      sub = decision.reason || "Scholarship timing depends on age and school stage.";
      badge = decision.status === "locked" ? "Locked" : "Closed";
      cls = "locked";
      action = '<button class="icon-btn" disabled>Apply</button>';
    }

    return '<section class="panel v1822-merit-note v1835-scholarship-status ' + cls + '">' +
      '<div class="section-label">🎓 Merit Aid Status</div>' +
      '<div class="row"><div><div class="row-title">' + esc(title) + '</div>' +
      '<div class="row-sub">' + esc(sub) + '</div></div>' + action + '</div>' +
      '<div class="v1835-aid-chip-row">' +
      '<span>' + esc(badge) + '</span>' +
      '<span>Age ' + esc(s.age == null ? "" : s.age) + '</span>' +
      '<span>Best profile: ' + esc(projected) + '</span>' +
      '</div></section>';
  }

  var SCHOOL_SPORTS_V1835 = [
    { id: "peeweeBasketball", icon: "🏀", name: "Peewee Basketball", min: 5, max: 12, stage: "all", cost: 0, sport: true, sportType: "basketball", deltas: { athleticism: 2, health: 2, confidence: 1 }, gpa: .03, desc: "After-school practices, weekend games, and early team confidence." },
    { id: "middleBasketball", icon: "🏀", name: "Middle School Basketball", min: 11, max: 13, stage: "middle", cost: 0, sport: true, sportType: "basketball", deltas: { athleticism: 4, health: 2, popularity: 2, confidence: 1 }, gpa: .03, desc: "Tryouts, rotations, game minutes, and a path into varsity basketball." },
    { id: "juniorTrack", icon: "🏃", name: "Junior Track", min: 7, max: 13, stage: "all", cost: 0, sport: true, sportType: "track", deltas: { athleticism: 3, health: 3, discipline: 1 }, gpa: .04, desc: "Sprints, relays, fitness tests, and the first taste of meets." },
    { id: "schoolSwim", icon: "🏊", name: "School Swim", min: 6, max: 18, stage: "all", cost: 0, sport: true, sportType: "swimming", deltas: { athleticism: 3, health: 4, discipline: 1 }, gpa: .04, desc: "Low-impact conditioning, time trials, and strong health gains." },
    { id: "schoolTennis", icon: "🎾", name: "School Tennis", min: 8, max: 18, stage: "all", cost: 0, sport: true, sportType: "tennis", deltas: { athleticism: 3, discipline: 2, confidence: 1 }, gpa: .04, desc: "Singles, doubles, quick footwork, and a clean prep-school lane." },
    { id: "crossCountry", icon: "👟", name: "Cross Country", min: 9, max: 18, stage: "all", cost: 0, sport: true, sportType: "running", deltas: { athleticism: 4, health: 4, discipline: 2, stress: -1 }, gpa: .05, desc: "Distance running, mental toughness, and reliable varsity potential." },
    { id: "schoolGolf", icon: "⛳", name: "School Golf", min: 10, max: 18, stage: "all", cost: 0, sport: true, sportType: "golf", deltas: { discipline: 3, confidence: 2, stress: -1 }, gpa: .04, desc: "Quiet focus, tournaments, and private-school visibility without brutal injury risk." },
    { id: "cheerTeam", icon: "📣", name: "Cheer Team", min: 11, max: 18, stage: "all", cost: 0, sport: true, sportType: "cheer", deltas: { athleticism: 3, popularity: 3, confidence: 3 }, gpa: .03, desc: "Stunts, performance, leadership, and school-spirit pressure." },
    { id: "middleBaseball", icon: "⚾", name: "Middle School Baseball", min: 11, max: 13, stage: "middle", cost: 0, sport: true, sportType: "baseball", deltas: { athleticism: 3, discipline: 2, popularity: 1 }, gpa: .03, desc: "Seasonal games, hand-eye coordination, and team reps before varsity." },
    { id: "middleVolleyball", icon: "🏐", name: "Middle School Volleyball", min: 11, max: 13, stage: "middle", cost: 0, sport: true, sportType: "volleyball", deltas: { athleticism: 3, health: 2, popularity: 2 }, gpa: .03, desc: "Teamwork, quick reactions, and a smoother path into high school sports." },
    { id: "middleWrestling", icon: "🤼", name: "Middle School Wrestling", min: 12, max: 13, stage: "middle", cost: 0, sport: true, sportType: "wrestling", deltas: { athleticism: 4, discipline: 3, stress: 1 }, gpa: .03, desc: "Weight classes, discipline, and toughness with real training pressure." },
    { id: "varsityVolleyball", icon: "🏐", name: "Varsity Volleyball", min: 14, max: 18, stage: "high", cost: 0, sport: true, sportType: "volleyball", deltas: { athleticism: 4, popularity: 3, health: 2 }, gpa: .03, desc: "Competitive team sport with leadership and recruiting upside." },
    { id: "varsityTennis", icon: "🎾", name: "Varsity Tennis", min: 14, max: 18, stage: "high", cost: 0, sport: true, sportType: "tennis", deltas: { athleticism: 4, discipline: 3, confidence: 2 }, gpa: .04, desc: "Prep-school classic with match play, rankings, and scholarship chances." },
    { id: "wrestlingTeam", icon: "🤼", name: "Wrestling Team", min: 14, max: 18, stage: "high", cost: 0, sport: true, sportType: "wrestling", deltas: { athleticism: 5, discipline: 4, health: 1, stress: 2 }, gpa: .03, desc: "High effort, high discipline, and strong recruiting if you keep winning." },
    { id: "softballTeam", icon: "🥎", name: "Softball Team", min: 12, max: 18, stage: "all", cost: 0, sport: true, sportType: "softball", deltas: { athleticism: 4, discipline: 2, popularity: 2 }, gpa: .03, desc: "A seasonal team path with tournaments, reps, and real leadership chances." },
    { id: "lacrosseTeam", icon: "🥍", name: "Lacrosse Team", min: 12, max: 18, stage: "all", cost: 0, sport: true, sportType: "lacrosse", deltas: { athleticism: 4, popularity: 2, confidence: 2 }, gpa: .03, desc: "A fast prep-school sport with strong private-school visibility." }
  ];

  function allSports() {
    var byId = {};
    var list = [];
    function add(club) {
      if (!club || !club.sport || !club.id || byId[club.id]) return;
      byId[club.id] = true;
      list.push(Object.assign({ cost: 0 }, club));
    }
    try { (clubs || []).forEach(add); } catch (e) {}
    SCHOOL_SPORTS_V1835.forEach(add);
    return list;
  }

  function sportAllowedHere(club) {
    var s = safeState();
    var age = Number(s.age) || 0;
    var stage = schoolStageSafe();
    if (!club || age < Number(club.min || 0) || age > Number(club.max || 99)) return false;
    if (stage === "college") return club.stage === "college" || club.id === "intramural";
    if (club.stage === "all" || club.stage === stage) return true;
    if (stage === "middle" && club.stage === "high" && age >= 13) return true;
    if (stage === "high" && club.stage === "middle") return true;
    return false;
  }

  function availableSports() {
    var sports = allSports().filter(sportAllowedHere);
    var stage = schoolStageSafe();
    var age = Number(safeState().age) || 0;
    if (!sports.length && stage === "middle" && age >= 13) {
      sports = allSports().filter(function (club) { return club && club.id === "track" && age >= Number(club.min || 0) && age <= Number(club.max || 99); });
    }
    return sports;
  }

  function joinedSports() {
    var s = safeState();
    var joined = Array.isArray(s.clubs) ? s.clubs : [];
    return allSports().filter(function (club) { return joined.indexOf(club.id) >= 0; });
  }

  function activeSports() {
    return joinedSports().slice(0, SPORT_LIMIT_V1835);
  }

  function benchSports() {
    return joinedSports().slice(SPORT_LIMIT_V1835);
  }

  function ensureSportsProfile() {
    var s = safeState();
    s.school = s.school || {};
    s.school.sportsProfile = s.school.sportsProfile || {};
    return s.school.sportsProfile;
  }

  function sportRecord(id) {
    var profile = ensureSportsProfile();
    profile[id] = profile[id] || { trained: 0, games: 0, wins: 0, captain: false, visibility: 0 };
    if (!profile[id].leadership) profile[id].leadership = profile[id].captain ? "captain" : "player";
    if (profile[id].leadership === "captain") profile[id].captain = true;
    if (profile[id].varsity == null) profile[id].varsity = !!profile[id].captain;
    return profile[id];
  }

  function sportById(id) {
    return allSports().find(function (club) { return club.id === id; }) || null;
  }

  function sportLeadershipIndex(record) {
    var role = (record && record.leadership) || "player";
    var idx = SPORT_LEADERSHIP_V1835.indexOf(role);
    return idx >= 0 ? idx : 0;
  }

  function sportLeadershipLabel(record) {
    var role = (record && record.leadership) || "player";
    return SPORT_LEADERSHIP_LABELS_V1835[role] || "Player";
  }

  function nextSportLeadership(record) {
    var idx = sportLeadershipIndex(record);
    return SPORT_LEADERSHIP_V1835[Math.min(SPORT_LEADERSHIP_V1835.length - 1, idx + 1)];
  }

  function sportBaseHours(club) {
    var stage = schoolStageSafe();
    var type = String((club || {}).sportType || "");
    var base = stage === "elementary" ? 4 : stage === "middle" ? 7 : stage === "high" ? 10 : stage === "college" ? 8 : 5;
    if (type === "football" || type === "wrestling") base += 3;
    if (type === "track" || type === "running" || type === "swimming") base += 1;
    if (type === "golf" || type === "tennis") base -= 1;
    return Math.max(3, base);
  }

  function sportWeeklyHours(club) {
    var record = sportRecord((club || {}).id);
    var hours = sportBaseHours(club);
    if (record.varsity) hours += 3;
    hours += sportLeadershipIndex(record) * 2;
    return Math.max(0, Math.round(hours));
  }

  function sportsLoadSummary(extraClub) {
    var sports = activeSports().slice();
    if (extraClub && sports.every(function (club) { return club.id !== extraClub.id; })) sports.push(extraClub);
    var hours = sports.reduce(function (sum, club) { return sum + sportWeeklyHours(club); }, 0);
    var label = hours >= 60 ? "Maxed schedule" : hours >= 46 ? "Heavy schedule" : hours >= 34 ? "Busy schedule" : "Playable schedule";
    var cls = hours >= 46 ? "bad" : hours >= 34 ? "gold" : "good";
    return { hours: hours, label: label, cls: cls, sports: sports.length, remaining: Math.max(0, SPORT_HOUR_CAP_V1835 - hours) };
  }

  function sportsStageRail(available, joined, load) {
    var age = Number(safeState().age) || 0;
    var stageTitle = schoolStageTitle();
    var roster = joinedSports();
    var stageCounts = [
      ["Now", available.length],
      ["Joined", joined.length + "/" + SPORT_LIMIT_V1835],
      ["Roster", roster.length],
      [stageTitle, available.filter(function (club) { return sportAllowedHere(club); }).length],
      ["Varsity", joined.filter(function (club) { return sportRecord(club.id).varsity; }).length],
      ["Leaders", joined.filter(function (club) { return sportLeadershipIndex(sportRecord(club.id)) > 0; }).length],
      ["Hours", load.hours + "/" + SPORT_HOUR_CAP_V1835],
      ["Age", age]
    ];
    return '<div class="v1835-sport-scroll-rail" aria-label="Athletics quick scroll">' + stageCounts.map(function (item) {
      return '<span class="v1835-stage-chip"><b>' + esc(item[0]) + '</b>' + esc(item[1]) + '</span>';
    }).join("") + '</div>';
  }

  function joinSchoolSport(id) {
    var s = safeState();
    s.clubs = Array.isArray(s.clubs) ? s.clubs : [];
    s.school = s.school || {};
    var club = sportById(id);
    if (!club) return logSport("That sport is not available.");
    if (!sportAllowedHere(club)) return logSport(club.name + " is not available for your current age or school stage.");
    if (s.clubs.indexOf(id) >= 0) return logSport("You are already on " + club.name + ".");
    if (joinedSports().length >= SPORT_LIMIT_V1835) return logSport("You can only carry three school sports at a time. Leave one before joining another.");
    var nextLoad = sportsLoadSummary(club);
    if (nextLoad.hours > SPORT_HOUR_CAP_V1835) return logSport("That would push your athletics schedule past " + SPORT_HOUR_CAP_V1835 + " hours/week.");
    s.clubs.push(id);
    s.school.clubs = s.clubs;
    var record = sportRecord(id);
    record.joinedAge = Number(s.age) || 0;
    record.visibility += schoolStageSafe() === "high" ? 2 : 1;
    var deltas = Object.assign({ confidence: 1 }, club.deltas || {});
    if (nextLoad.hours >= 46) deltas.stress = (deltas.stress || 0) + 3;
    else if (nextLoad.hours >= 34) deltas.stress = (deltas.stress || 0) + 1;
    runDeltas(deltas);
    logSport("Joined " + club.name + ". Your school now has a real team path for it.", deltas);
    saveAndRenderSchool();
  }

  function leaveSchoolSport(id) {
    var s = safeState();
    s.clubs = Array.isArray(s.clubs) ? s.clubs : [];
    var club = sportById(id);
    s.clubs = s.clubs.filter(function (clubId) { return clubId !== id; });
    s.school = s.school || {};
    s.school.clubs = s.clubs;
    logSport("Left " + ((club && club.name) || "that sport") + ".");
    saveAndRenderSchool();
  }

  function sportActionDone(key) {
    var s = safeState();
    s.actionsTaken = s.actionsTaken || {};
    return !!s.actionsTaken[key];
  }

  function setSportActionDone(key) {
    var s = safeState();
    s.actionsTaken = s.actionsTaken || {};
    s.actionsTaken[key] = true;
  }

  function runDeltas(deltas) {
    try { if (typeof applyDeltas === "function") applyDeltas(deltas || {}); } catch (e) {}
  }

  function logSport(message, deltas) {
    // addToast() also calls addLog() internally, so calling both wrote the line twice.
    // Prefer addLog (keeps the stat deltas); only fall back to addToast if it is missing.
    try { if (typeof addLog === "function") { addLog(message, deltas || {}); return; } } catch (e) {}
    try { if (typeof addToast === "function") addToast(message); } catch (e2) {}
  }

  function saveAndRenderSchool() {
    try { if (typeof save === "function") save(); } catch (e) {}
    if (isSchoolHub(currentHubId()) && typeof window.renderHubInPlaceV16 === "function") {
      window.renderHubInPlaceV16("school", captureSchoolScroll());
    } else {
      try { if (typeof render === "function") render(); } catch (e2) {}
    }
  }

  function approveEarlyMeritAid() {
    var s = safeState();
    s.school = s.school || {};
    s.actionsTaken = s.actionsTaken || {};
    if ((Number(s.age) || 0) < SCHOOL_MERIT_AGE) {
      logSport("Merit aid opens when actual school starts.");
      return;
    }
    if (s.actionsTaken.scholarshipApply) {
      logSport("You already applied this year.");
      return;
    }
    var offer = earlyMeritPackage();
    s.actionsTaken.scholarshipApply = true;
    if (offer.fullRide || (Number(offer.annualAward) || 0) > 0) {
      s.school.scholarshipOffer = {
        type: offer.type,
        annualAward: offer.annualAward,
        fullRide: !!offer.fullRide,
        reason: offer.reason,
        ageAwarded: s.age
      };
      s.school.scholarshipAward = offer.fullRide ? 999999 : offer.annualAward;
      s.school.scholarshipDecision = {
        status: "approved",
        type: offer.type,
        annualAward: offer.fullRide ? 999999 : offer.annualAward,
        fullRide: !!offer.fullRide,
        reason: offer.reason,
        age: Number(s.age) || 0
      };
      runDeltas({ confidence: offer.fullRide ? 4 : 2, happiness: 2, stress: -1 });
      logSport(offer.type + " approved: " + (offer.fullRide ? "full ride" : moneyText(offer.annualAward) + "/yr") + ". " + offer.reason, { confidence: offer.fullRide ? 4 : 2, happiness: 2, stress: -1 });
    } else {
      s.school.scholarshipDecision = {
        status: "not_awarded",
        type: "No award",
        annualAward: 0,
        fullRide: false,
        reason: offer.reason,
        age: Number(s.age) || 0
      };
      runDeltas({ discipline: 1 });
      logSport("No K-12 merit aid came through yet. " + offer.reason, { discipline: 1 });
    }
    saveAndRenderSchool();
  }

  function trainSport(id) {
    var s = safeState();
    var club = sportById(id);
    if (!club) return;
    if (!Array.isArray(s.clubs) || s.clubs.indexOf(id) < 0) return logSport("Join that sport first.");
    var key = "v1835_trainSport_" + id;
    if (sportActionDone(key)) return logSport("You already trained that sport this year.");
    var record = sportRecord(id);
    record.trained += 1;
    record.visibility += schoolStageSafe() === "middle" ? 1 : 2;
    setSportActionDone(key);
    var deltas = { athleticism: 4, discipline: 2, health: 2, energy: -3, stress: -1 };
    runDeltas(deltas);
    logSport("Trained for " + club.name + ". Coaches can see the work now.", deltas);
    saveAndRenderSchool();
  }

  function playSportGame(id) {
    var s = safeState();
    var club = sportById(id);
    if (!club) return;
    if (!Array.isArray(s.clubs) || s.clubs.indexOf(id) < 0) return logSport("Join that sport first.");
    var key = "v1835_gameSport_" + id;
    if (sportActionDone(key)) return logSport("You already played a spotlight game this year.");
    var stats = s.stats || {};
    var record = sportRecord(id);
    var score = statNumber(stats.athleticism, 50) * 0.48 + statNumber(stats.discipline, 50) * 0.24 + statNumber(stats.health, 50) * 0.18 + record.trained * 4 + (record.captain ? 8 : 0);
    var won = score >= 58;
    record.games += 1;
    if (won) record.wins += 1;
    record.visibility += won ? 4 : 2;
    setSportActionDone(key);
    var deltas = won ? { confidence: 4, popularity: 3, athleticism: 2, stress: -1, energy: -4 } : { confidence: 1, athleticism: 2, discipline: 1, stress: 2, energy: -4 };
    runDeltas(deltas);
    logSport((won ? "Big game went well for " : "You got real reps in ") + club.name + ".", deltas);
    saveAndRenderSchool();
  }

  function attendSportClinic(id) {
    var s = safeState();
    var club = sportById(id);
    if (!club) return;
    if (!Array.isArray(s.clubs) || s.clubs.indexOf(id) < 0) return logSport("Join that sport first.");
    var key = "v1835_clinicSport_" + id;
    if (sportActionDone(key)) return logSport("You already did a skills clinic this year.");
    var record = sportRecord(id);
    record.trained += 1;
    record.visibility += schoolStageSafe() === "elementary" ? 2 : 3;
    setSportActionDone(key);
    var deltas = { athleticism: 3, confidence: 2, discipline: 1, energy: -2 };
    runDeltas(deltas);
    logSport("Skills clinic sharpened your " + club.name + " profile.", deltas);
    saveAndRenderSchool();
  }

  function playSportTournament(id) {
    var s = safeState();
    var club = sportById(id);
    if (!club) return;
    if (!Array.isArray(s.clubs) || s.clubs.indexOf(id) < 0) return logSport("Join that sport first.");
    if ((Number(s.age) || 0) < 8) return logSport("Tournament play opens around age 8.");
    var key = "v1835_tournamentSport_" + id;
    if (sportActionDone(key)) return logSport("You already played a tournament this year.");
    var stats = s.stats || {};
    var record = sportRecord(id);
    var score = statNumber(stats.athleticism, 50) * 0.45 + statNumber(stats.confidence, 50) * 0.20 + statNumber(stats.discipline, 50) * 0.20 + record.trained * 5;
    var medal = score >= 62;
    record.games += 2;
    if (medal) record.wins += 2;
    record.visibility += medal ? 6 : 3;
    setSportActionDone(key);
    var deltas = medal ? { confidence: 5, popularity: 2, athleticism: 3, happiness: 3, energy: -5 } : { confidence: 1, athleticism: 2, discipline: 2, energy: -4 };
    runDeltas(deltas);
    logSport(medal ? "Tournament weekend made people notice your " + club.name + " talent." : "Tournament weekend gave you real competition reps.", deltas);
    saveAndRenderSchool();
  }

  function tryVarsitySport(id) {
    var s = safeState();
    var club = sportById(id);
    if (!club) return;
    if (!Array.isArray(s.clubs) || s.clubs.indexOf(id) < 0) return logSport("Join that sport first.");
    if ((Number(s.age) || 0) < 13) return logSport("Varsity starts around middle/high school.");
    var record = sportRecord(id);
    if (record.varsity) return logSport("You are already on varsity for " + club.name + ".");
    var key = "v1835_varsitySport_" + id;
    if (sportActionDone(key)) return logSport("You already tried for varsity this year.");
    var stats = s.stats || {};
    var score = statNumber(stats.athleticism, 50) * 0.75 + statNumber(stats.discipline, 50) * 0.35 + statNumber(stats.health, 50) * 0.25 + record.trained * 6 + record.games * 3 + record.wins * 7 + record.visibility * 2;
    var madeIt = score >= 122;
    setSportActionDone(key);
    if (madeIt) {
      record.varsity = true;
      record.visibility += 7;
    }
    var deltas = madeIt ? { confidence: 5, popularity: 2, stress: 1 } : { discipline: 2, stress: 2 };
    runDeltas(deltas);
    logSport(madeIt ? "You made varsity for " + club.name + "." : "Varsity coaches passed this year. Build wins, training, and visibility.", deltas);
    saveAndRenderSchool();
  }

  function tryCaptainSport(id) {
    var s = safeState();
    var club = sportById(id);
    if (!club) return;
    if (!Array.isArray(s.clubs) || s.clubs.indexOf(id) < 0) return logSport("Join that sport first.");
    if ((Number(s.age) || 0) < 13) return logSport("Leadership roles unlock around middle school.");
    var record = sportRecord(id);
    if (!record.varsity) return logSport("Make varsity before chasing team leadership.");
    if (record.captain || record.leadership === "captain") return logSport("You are already Captain for Life in that sport.");
    var key = "v1835_captainSport_" + id;
    if (sportActionDone(key)) return logSport("You already tried for leadership this year.");
    var stats = s.stats || {};
    var nextRole = nextSportLeadership(record);
    var nextIdx = SPORT_LEADERSHIP_V1835.indexOf(nextRole);
    var threshold = [0, 205, 238, 275][nextIdx] || 275;
    var odds = statNumber(stats.discipline, 50) + statNumber(stats.confidence, 50) + statNumber(stats.athleticism, 50) + record.trained * 7 + record.wins * 8 + record.visibility * 3 + (record.varsity ? 25 : 0);
    var madeIt = odds >= threshold;
    setSportActionDone(key);
    if (madeIt) {
      record.leadership = nextRole;
      record.captain = nextRole === "captain";
      record.visibility += nextRole === "captain" ? 8 : 5;
    }
    var deltas = madeIt ? { confidence: nextRole === "captain" ? 7 : 4, popularity: 3, discipline: 2 } : { discipline: 2, stress: 2 };
    runDeltas(deltas);
    logSport(madeIt ? "You earned " + SPORT_LEADERSHIP_LABELS_V1835[nextRole] + " in " + club.name + "." : "Leadership did not happen yet. Captain takes varsity status, wins, visibility, and discipline.", deltas);
    saveAndRenderSchool();
  }

  function attendPrepCamp() {
    var s = safeState();
    var sports = activeSports();
    if (!sports.length) return logSport("Join a sport before camp matters.");
    if ((Number(s.age) || 0) < 13 || (Number(s.age) || 0) > 18) return logSport("Athletic camps matter most from 13 to 18.");
    var key = "v1835_athleticPrepCamp";
    if (sportActionDone(key)) return logSport("You already attended a sports camp this year.");
    sports.forEach(function (club) {
      var record = sportRecord(club.id);
      record.visibility += schoolStageSafe() === "middle" ? 4 : 6;
    });
    setSportActionDone(key);
    var deltas = { athleticism: 3, confidence: 3, popularity: 2, stress: 1, energy: -4 };
    runDeltas(deltas);
    logSport("Athletic camp gave your sports profile real visibility.", deltas);
    saveAndRenderSchool();
  }

  function athleticProjection() {
    try {
      if (typeof athleticScholarshipEstimate === "function") return athleticScholarshipEstimate();
    } catch (e) {}
    var s = safeState();
    var stats = s.stats || {};
    var sports = joinedSports();
    var visibility = sports.reduce(function (sum, club) {
      var record = sportRecord(club.id);
      return sum + statNumber(record.visibility, 0) + (record.varsity ? 6 : 0) + sportLeadershipIndex(record) * 4;
    }, 0);
    var score = Math.round(statNumber(stats.athleticism, 50) * .8 + statNumber(stats.discipline, 50) * .25 + sports.length * 8 + visibility);
    return { score: score, annualAward: score >= 100 ? 12000 : 0, fullRide: score >= 125, reason: sports.length ? "Build training, games, GPA, and visibility for recruiting." : "Join a sport to build a profile.", sportsCount: sports.length, highSchoolSports: sports.length, sports: sports };
  }

  function renderSportsDesk() {
    var s = safeState();
    var stage = schoolStageSafe();
    var stageTitle = schoolStageTitle();
    var available = availableSports();
    var roster = joinedSports();
    var joined = activeSports();
    var bench = benchSports();
    var projection = athleticProjection();
    var load = sportsLoadSummary();
    var visibility = joined.reduce(function (sum, club) { return sum + statNumber(sportRecord(club.id).visibility, 0); }, 0);
    var joinCards = available.map(function (club) {
      var isJoined = Array.isArray(s.clubs) && s.clubs.indexOf(club.id) >= 0;
      var effect = club.deltas ? Object.keys(club.deltas).map(function (key) {
        var value = club.deltas[key];
        return key + " " + (value > 0 ? "+" : "") + value;
      }).join(" / ") : "Athletic profile";
      return '<div class="v1835-sport-card ' + (isJoined ? "active" : "") + '">' +
        '<div class="v1835-sport-name">' + esc((club.icon || "") + " " + club.name + (isJoined ? " - joined" : "")) + '</div>' +
        '<div class="v1835-sport-desc">' + esc(club.desc || "Build athleticism and recruiting visibility.") + '</div>' +
        '<div class="v1835-aid-chip-row"><span>Free</span><span>' + esc(stageTitle) + '</span><span>' + esc(effect) + '</span></div>' +
        '<div class="v1835-sport-actions"><button class="icon-btn" onclick="' + (isJoined ? "leaveSchoolSportV1835" : "joinSchoolSportV1835") + '(\'' + esc(club.id) + '\')">' + (isJoined ? "Leave" : "Join") + '</button></div></div>';
    }).join("");
    var seasonCards = joined.map(function (club) {
      var record = sportRecord(club.id);
      var trainDone = sportActionDone("v1835_trainSport_" + club.id);
      var gameDone = sportActionDone("v1835_gameSport_" + club.id);
      var clinicDone = sportActionDone("v1835_clinicSport_" + club.id);
      var tournamentDone = sportActionDone("v1835_tournamentSport_" + club.id);
      var captainDone = sportActionDone("v1835_captainSport_" + club.id);
      var varsityDone = sportActionDone("v1835_varsitySport_" + club.id);
      var nextRole = nextSportLeadership(record);
      var roleLabel = sportLeadershipLabel(record);
      var nextRoleLabel = SPORT_LEADERSHIP_LABELS_V1835[nextRole] || "Leadership";
      return '<div class="v1835-sport-card active">' +
        '<div class="v1835-sport-name">' + esc((club.icon || "") + " " + club.name) + '</div>' +
        '<div class="v1835-sport-desc">Role ' + esc(roleLabel) + ' / ' + (record.varsity ? "Varsity" : "JV or club") + ' / ' + esc(sportWeeklyHours(club)) + ' hr/wk<br>Training ' + esc(record.trained || 0) + ' / games ' + esc(record.games || 0) + ' / wins ' + esc(record.wins || 0) + ' / visibility ' + esc(record.visibility || 0) + '</div>' +
        '<div class="v1835-sport-actions">' +
        '<button class="icon-btn" onclick="trainSportV1835(\'' + esc(club.id) + '\')" ' + (trainDone ? "disabled" : "") + '>Train</button>' +
        '<button class="icon-btn" onclick="playSportGameV1835(\'' + esc(club.id) + '\')" ' + (gameDone ? "disabled" : "") + '>Game Day</button>' +
        '<button class="icon-btn" onclick="attendSportClinicV1835(\'' + esc(club.id) + '\')" ' + (clinicDone ? "disabled" : "") + '>Skills Clinic</button>' +
        '<button class="icon-btn" onclick="playSportTournamentV1835(\'' + esc(club.id) + '\')" ' + (tournamentDone || (Number(s.age) || 0) < 8 ? "disabled" : "") + '>Tournament</button>' +
        '<button class="icon-btn" onclick="tryVarsitySportV1835(\'' + esc(club.id) + '\')" ' + (record.varsity || varsityDone || (Number(s.age) || 0) < 13 ? "disabled" : "") + '>Try Varsity</button>' +
        '<button class="icon-btn" onclick="tryCaptainSportV1835(\'' + esc(club.id) + '\')" ' + (record.captain || captainDone || !record.varsity || (Number(s.age) || 0) < 13 ? "disabled" : "") + '>' + esc(record.captain ? "Captain" : nextRoleLabel) + '</button>' +
        '</div></div>';
    }).join("");
    var benchCards = bench.map(function (club) {
      return '<div class="v1835-bench-chip"><span>' + esc((club.icon || "") + " " + club.name) + '</span><button class="icon-btn" onclick="leaveSchoolSportV1835(\'' + esc(club.id) + '\')">Leave</button></div>';
    }).join("");
    var aidText = projection.fullRide ? "Full ride" : moneyText(projection.annualAward || 0) + " / yr";
    var unlocks = [
      (Number(s.age) || 0) < 8 ? "Tournaments unlock at 8" : "Tournaments open",
      (Number(s.age) || 0) < 13 ? "Captain roles unlock at 13" : "Captain roles open",
      (Number(s.age) || 0) < 14 ? "Showcases unlock at 14" : "Showcases open"
    ].join(" / ");
    return '<section class="panel v1835-athletics-hero"><div class="section-label">🏅 ' + esc(stageTitle) + ' Athletics Department</div>' +
      '<div class="v1835-athletics-grid"><div><span>Recruit score</span><b>' + esc(projection.score || 0) + '</b><em>' + esc(projection.reason || "Build a sport profile.") + '</em></div><div><span>Active sports</span><b>' + esc(joined.length) + '/' + esc(SPORT_LIMIT_V1835) + '</b><em>' + esc(joined.map(function (club) { return club.name; }).join(", ") || "Pick up to three sports below.") + (bench.length ? esc(" +" + bench.length + " benched from older save.") : "") + '</em></div><div><span>Weekly load</span><b>' + esc(load.hours) + ' hr</b><em>' + esc(load.label) + '. 60 hr/week is the stress ceiling.</em></div><div><span>Visibility</span><b>' + esc(visibility) + '</b><em>Varsity, wins, leaders, and camp raise this.</em></div><div><span>Best sports aid</span><b>' + esc(aidText) + '</b><em>GPA still matters for scholarships.</em></div></div></section>' +
      sportsStageRail(available, joined, load) +
      '<section class="panel v1835-sports-brief"><div class="section-label">Season Plan</div><div class="row"><div><div class="row-title">' + (joined.length ? "Build the profile every year" : "Every school has teams now") + '</div><div class="row-sub">Public, private, prep, and college paths all use this Athletics Department. You can carry three sports, up to ' + esc(SPORT_HOUR_CAP_V1835) + ' hours/week. Varsity comes before Vice Captain, Team Leader, and Captain for Life. ' + esc(unlocks) + '.</div></div></div></section>' +
      (benchCards ? '<section class="panel v1835-sports-panel"><div class="section-label">🪑 Bench / old-save overflow</div><div class="row-sub">Only the first three teams are active for hours, stress, and recruiting. Leave extras to clean up the roster.</div><div class="v1835-bench-list">' + benchCards + '</div></section>' : '') +
      '<section class="panel v1835-sports-panel"><div class="section-label">⚽ Join Sports</div>' + (joinCards || '<div class="row"><div><div class="row-title">No sports available right now</div><div class="row-sub">Sports unlock by age and school stage.</div></div></div>') + '</section>' +
      '<section class="panel v1835-sports-panel"><div class="section-label">Season Actions</div>' + (seasonCards || '<div class="row"><div><div class="row-title">Join a sport first</div><div class="row-sub">Once you join, you can train, play a spotlight game, and try for captain.</div></div></div>') + '<div class="v1835-sport-actions"><button class="icon-btn" onclick="attendPrepCampV1835()" ' + (!joined.length || sportActionDone("v1835_athleticPrepCamp") || (Number(s.age) || 0) < 13 || (Number(s.age) || 0) > 18 ? "disabled" : "") + '>Prep Camp</button><button class="icon-btn" onclick="attendRecruitingShowcase()" ' + ((Number(s.age) || 0) < 14 || (Number(s.age) || 0) > 22 || !joined.length ? "disabled" : "") + '>Recruiting Showcase</button><button class="icon-btn" onclick="applyScholarships()" ' + ((Number(s.age) || 0) < 14 || (Number(s.age) || 0) > 21 || (s.actionsTaken || {}).scholarshipApply ? "disabled" : "") + '>Apply Sports Aid</button></div></section>';
  }

  function organizeSchoolHtml(html) {
    var pulledMerit = pullSections(html, MERIT_SECTION_MARKERS);
    html = pulledMerit.html;
    html = String(html || "").replace(/Athletic Recruiting/g, "Athletics");
    var merit = pulledMerit.sections.length ? buildMeritStatusCard() : "";

    var pulledDegrees = pullSections(html, DEGREE_SECTION_MARKERS);
    html = pulledDegrees.html;
    var page = currentSchoolPage();
    var quietPlanningPages = page === "iq" || page === "subjects" || page === "clubs";

    if (page === "athletics") {
      var firstSection = String(html || "").indexOf("<section");
      var prefix = firstSection >= 0 ? String(html || "").slice(0, firstSection) : "";
      return prefix + renderSportsDesk();
    }

    if (page === "schools" && html.indexOf("v1835-school-path") < 0) {
      html = schoolStagePathCard() + html;
    }

    if (page === "iq" && html.indexOf("v1835-iq-dynamics") < 0) {
      html = insertAfterFirstSection(html, iqLearningCard());
    }

    if (merit && page !== "iq") {
      html = insertAfterFirstSection(html, merit);
    }

    if (!quietPlanningPages && careerPlanningUnlocked() && pulledDegrees.sections.length) {
      html += pulledDegrees.sections.join("");
    }

    return html;
  }

  function ensureCareerStarterJobs() {
    var catalog = null;
    try { if (typeof careerCatalog !== "undefined" && Array.isArray(careerCatalog)) catalog = careerCatalog; } catch (e) {}
    if (!catalog) {
      try { if (Array.isArray(window.careerCatalog)) catalog = window.careerCatalog; } catch (e2) {}
    }
    if (!catalog || catalog.__v1835StarterJobs) return;
    function has(id) {
      return catalog.some(function (job) { return job && String(job.id || "") === id; });
    }
    [
      { id: "grocery_clerk", title: "Grocery Clerk", salary: 26000, minAge: 16, req: function () { return true; }, desc: "After-school hours, customer service, and steady starter cash.", ladder: [
        { title: "Grocery Clerk", salary: 26000, minPerf: 0 },
        { title: "Front End Lead", salary: 36000, minPerf: 58 },
        { title: "Assistant Manager", salary: 52000, minPerf: 72 },
        { title: "Store Manager", salary: 82000, minPerf: 86 }
      ] },
      { id: "lifeguard", title: "Lifeguard", salary: 24000, minAge: 16, req: function (s) { return (s.stats && Number(s.stats.health) >= 45) || (s.stats && Number(s.stats.athleticism) >= 45); }, desc: "Seasonal work that rewards health, discipline, and attention.", ladder: [
        { title: "Lifeguard", salary: 24000, minPerf: 0 },
        { title: "Head Lifeguard", salary: 34000, minPerf: 60 },
        { title: "Aquatics Supervisor", salary: 54000, minPerf: 78 }
      ] },
      { id: "student_tutor", title: "Student Tutor", salary: 22000, minAge: 16, req: function (s) { return Number((s.stats || {}).smarts) >= 60 || Number((s.traits || {}).iq) >= 115; }, desc: "Turn strong grades or high IQ into early income.", ladder: [
        { title: "Student Tutor", salary: 22000, minPerf: 0 },
        { title: "Private Tutor", salary: 42000, minPerf: 62 },
        { title: "Test Prep Coach", salary: 70000, minPerf: 82 }
      ] },
      { id: "social_media_assistant", title: "Social Media Assistant", salary: 30000, minAge: 16, req: function (s) { return Number((s.stats || {}).creativity) >= 45 || Number(s.followers) >= 1000; }, desc: "Creator-adjacent work with a path into marketing and media.", ladder: [
        { title: "Social Media Assistant", salary: 30000, minPerf: 0 },
        { title: "Content Coordinator", salary: 48000, minPerf: 58 },
        { title: "Growth Marketer", salary: 84000, minPerf: 78 }
      ] }
    ].forEach(function (job) { if (!has(job.id)) catalog.push(job); });
    catalog.__v1835StarterJobs = true;
  }

  function rootCareerCatalog() {
    ensureCareerStarterJobs();
    var jobs = [];
    try { if (typeof careerCatalog !== "undefined" && Array.isArray(careerCatalog)) jobs = jobs.concat(careerCatalog); } catch (e) {}
    try { if (Array.isArray(window.careerCatalog)) jobs = jobs.concat(window.careerCatalog); } catch (e2) {}
    var seen = {};
    return jobs.filter(function (job) {
      var id = String((job && (job.id || job.title || job.name)) || "").toLowerCase();
      if (!id || seen[id]) return false;
      seen[id] = true;
      return true;
    });
  }

  function careerFilterState() {
    var existing = window.__ledgerCareerFilterV1835 || {};
    var filter = {
      category: existing.category || CAREER_FILTER_DEFAULT_V1835.category,
      sort: existing.sort || CAREER_FILTER_DEFAULT_V1835.sort,
      search: existing.search || CAREER_FILTER_DEFAULT_V1835.search
    };
    window.__ledgerCareerFilterV1835 = filter;
    return filter;
  }

  function normalizeDegreeCareer(id) {
    id = String(id || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    if (id === "computer_science_degree" || id === "computer_science") return "cs";
    if (id === "business_degree") return "business";
    if (id === "finance_degree") return "finance";
    if (id === "nursing_degree") return "nursing";
    if (id === "law_degree") return "law";
    if (id === "psychology") return "psych";
    return id;
  }

  function completedDegreeIdsCareer(s) {
    s = s || safeState();
    var ids = [];
    if (s.major) ids.push(s.major);
    if (Array.isArray(s.degreeIds)) ids = ids.concat(s.degreeIds);
    if (Array.isArray(s.degrees)) ids = ids.concat(s.degrees);
    Object.keys(s.flags || {}).forEach(function (key) {
      if (key.indexOf("degree_") === 0 && s.flags[key]) ids.push(key.replace("degree_", ""));
    });
    try {
      ((s.educationV1825 || {}).degrees || []).forEach(function (degree) {
        if (degree && degree.id && (degree.completed || Number(degree.yearsDone) >= Number(degree.years || 4))) ids.push(degree.id);
      });
    } catch (e) {}
    return ids.map(normalizeDegreeCareer).filter(function (id, index, arr) {
      return !!id && arr.indexOf(id) === index;
    });
  }

  function careerReqDegrees(job) {
    var out = [];
    (job.degreeIds || job.degrees || job.majors || []).forEach(function (id) { out.push(normalizeDegreeCareer(id)); });
    var text = String((job.title || "") + " " + (job.desc || "") + " " + (job.id || "")).toLowerCase();
    if (/quant|finance|wealth|account|analyst|portfolio|fund/.test(text)) out.push("finance", "business");
    if (/software|security|cyber|developer|engineer|data|tech/.test(text)) out.push("cs", "engineering");
    if (/nurse|medical|physician|doctor|lab|health/.test(text)) out.push("nursing", "biology", "medical");
    if (/law|legal|attorney|paralegal/.test(text)) out.push("law", "criminaljustice", "politicalscience");
    if (/teacher|education|counsel/.test(text)) out.push("education", "psych");
    if (/marketing|media|content|creative|social/.test(text)) out.push("business", "arts");
    if (/real estate|developer|property/.test(text)) out.push("business", "finance", "engineering");
    return out.filter(function (id, index, arr) { return !!id && arr.indexOf(id) === index; });
  }

  function careerCategory(job) {
    var text = String((job.id || "") + " " + (job.title || "") + " " + (job.desc || "")).toLowerCase();
    if (/retail|server|grocery|lifeguard|student|warehouse|delivery/.test(text) && Number(job.minAge || 0) <= 18) return "starter";
    if (/software|security|cyber|developer|engineer|data|tech/.test(text)) return "tech";
    if (/real estate|property|developer/.test(text)) return "real_estate";
    if (/quant|finance|wealth|account|portfolio|fund|analyst/.test(text)) return "finance";
    if (/business|startup|founder|operator|office|marketing|manager|operations/.test(text)) return "business";
    if (/law|legal|attorney|paralegal/.test(text)) return "legal";
    if (/nurse|medical|doctor|physician|lab|health/.test(text)) return "health";
    if (/teacher|education|counselor/.test(text)) return "education";
    if (/electrician|hvac|trade|warehouse|driver|logistics/.test(text)) return "trades";
    if (/marketing|media|content|creative|social/.test(text)) return "creative";
    return "general";
  }

  function careerCategoryLabel(id) {
    return {
      open: "Open now", degree: "My degree lanes", business_finance: "Business + finance", starter: "Teen / starter",
      finance: "Finance", business: "Business", tech: "Technology", real_estate: "Real estate", legal: "Legal",
      health: "Health", education: "Education", trades: "Trades", creative: "Creative / media", general: "General", all: "All jobs"
    }[id] || "General";
  }

  function ensureCareerV1835(s) {
    s = s || safeState();
    s.careerV1835 = s.careerV1835 || {};
    s.careerV1835.industryYears = s.careerV1835.industryYears || {};
    s.careerV1835.poachHistory = Array.isArray(s.careerV1835.poachHistory) ? s.careerV1835.poachHistory : [];
    return s.careerV1835;
  }

  function currentIndustryCategory(s) {
    s = s || safeState();
    var current = careerByCurrentJob(s);
    if (current) return careerCategory(current);
    if (s.job) return careerCategory({ id: s.job.jobId, title: s.job.title, desc: s.job.title });
    return "general";
  }

  function industryStanding(years) {
    years = Math.max(0, Number(years) || 0);
    for (var i = 0; i < INDUSTRY_RANKS_V1835.length; i++) {
      if (years >= INDUSTRY_RANKS_V1835[i].min) {
        return Object.assign({ years: years }, INDUSTRY_RANKS_V1835[i]);
      }
    }
    return Object.assign({ years: years }, INDUSTRY_RANKS_V1835[INDUSTRY_RANKS_V1835.length - 1]);
  }

  function industryExperienceYears(category, s) {
    s = s || safeState();
    category = category || currentIndustryCategory(s);
    var career = ensureCareerV1835(s);
    var stored = Math.max(0, Number(career.industryYears[category]) || 0);
    if (s.job && category === currentIndustryCategory(s)) {
      stored = Math.max(stored, currentJobTenure(s));
    }
    return Math.round(stored);
  }

  function industryPremiumText(job, s) {
    var years = industryExperienceYears(careerCategory(job), s);
    var standing = industryStanding(years);
    return standing.label + " - " + years + " yr" + (years === 1 ? "" : "s") + (standing.bonus ? " - +" + Math.round(standing.bonus * 100) + "% offers" : "");
  }

  function recordIndustryYear(category, title) {
    var s = safeState();
    if (!category) return;
    var career = ensureCareerV1835(s);
    var age = Number(s.age) || 0;
    if (career.lastIndustryTickAge === age) return;
    career.lastIndustryTickAge = age;
    career.industryYears[category] = Math.max(0, Number(career.industryYears[category]) || 0) + 1;
    career.lastIndustry = category;
    career.lastIndustryTitle = title || "";
  }

  function industryOfferPlan(job, baseSalary, s) {
    s = s || safeState();
    var cat = careerCategory(job || {});
    var years = industryExperienceYears(cat, s);
    var standing = industryStanding(years);
    var ladder = (job && job.ladder) || [];
    var targetTier = 0;
    if (ladder.length) targetTier = Math.min(ladder.length - 1, standing.tierBias >= 99 ? ladder.length - 1 : standing.tierBias);
    var rung = ladder[targetTier] || null;
    var salary = Math.max(Number(baseSalary) || 0, rung ? Number(rung.salary) || 0 : 0);
    salary = Math.round(salary * (1 + standing.bonus));
    if (!careerHasNoCeiling(job)) salary = Math.min(salary, Math.round(careerSoftCap(job)));
    return {
      category: cat,
      years: years,
      standing: standing,
      tier: targetTier,
      title: rung ? rung.title : (job && (job.title || job.name)) || "Job",
      salary: Math.max(Math.round(Number(baseSalary) || 0), salary)
    };
  }

  function applyIndustryUpgradeToOffer(jobId, source) {
    var s = safeState();
    var offer = activeCareerOffer(jobId);
    var job = rootCareerCatalog().find(function (item) { return item && String(item.id || item.title) === String(jobId); }) || null;
    if (!offer || !job) return false;
    var plan = industryOfferPlan(job, offer.salary || job.salary, s);
    if (plan.years < 5 || plan.salary <= Number(offer.salary || 0)) return false;
    offer.salary = plan.salary;
    offer.industryAdjustedV1835 = true;
    offer.industryYearsV1835 = plan.years;
    offer.industryStandingV1835 = plan.standing.label;
    offer.startTierV1835 = plan.tier;
    offer.startTitleV1835 = plan.title;
    offer.strength = String(offer.strength || "standard").indexOf("industry") >= 0 ? offer.strength : (offer.strength || "standard") + " + industry";
    if (!offer.industryLoggedV1835) {
      offer.industryLoggedV1835 = true;
      careerLog((source || "Industry experience") + " improved the " + (job.title || offer.title) + " offer to " + moneyText(plan.salary) + "/yr as " + plan.title + ".", { confidence: 2 });
    }
    return true;
  }

  function applyAcceptedIndustryOffer(jobId, offerSnapshot) {
    var s = safeState();
    var offer = offerSnapshot || null;
    if (!offer && s.careerV1827 && Array.isArray(s.careerV1827.offers)) {
      offer = s.careerV1827.offers.find(function (item) { return item && String(item.jobId) === String(jobId); }) || null;
    }
    if (!s.job) return;
    ensureJobCareerMeta(s);
    var current = careerByCurrentJob(s);
    var cat = current ? careerCategory(current) : currentIndustryCategory(s);
    s.job.industryV1835 = cat;
    if (offer && offer.startTierV1835 != null) {
      s.job.tier = Math.max(Number(s.job.tier) || 0, Number(offer.startTierV1835) || 0);
      if (offer.startTitleV1835) s.job.title = offer.startTitleV1835;
      if (offer.salary) s.job.salary = Math.max(Number(s.job.salary) || 0, Number(offer.salary) || 0);
      s.job.roleStartAge = Number(s.age) || 0;
    }
  }

  function careerStateForReq(s) {
    var fake = {};
    Object.keys(s || {}).forEach(function (key) { fake[key] = s[key]; });
    fake.flags = Object.assign({}, (s || {}).flags || {});
    fake.stats = Object.assign({}, (s || {}).stats || {});
    fake.inventory = Array.isArray((s || {}).inventory) ? (s || {}).inventory : [];
    fake.finance = (s || {}).finance || {};
    return fake;
  }

  function jobQualifiesCareer(job, s) {
    s = s || safeState();
    if (!job) return false;
    var age = Number(s.age) || 0;
    var minAge = Number(job.minAge) || CAREER_JOB_ACCESS_AGE;
    if (age < minAge) return false;
    try { if (typeof job.req === "function" && job.req(careerStateForReq(s))) return true; } catch (e) {}
    var degrees = completedDegreeIdsCareer(s);
    var reqs = careerReqDegrees(job);
    if (reqs.length && reqs.some(function (id) { return degrees.indexOf(id) >= 0; })) return true;
    if (minAge <= CAREER_JOB_ACCESS_AGE && !reqs.length) return true;
    if (industryExperienceYears(careerCategory(job), s) >= 5) return true;
    return age >= CAREER_JOB_ACCESS_AGE && careerCategory(job) === "starter";
  }

  function nativeJobQualifiesCareer(job, s) {
    s = s || safeState();
    if (!job) return false;
    var age = Number(s.age) || 0;
    var minAge = Number(job.minAge) || CAREER_JOB_ACCESS_AGE;
    if (age < minAge) return false;
    try { if (typeof job.req === "function" && job.req(careerStateForReq(s))) return true; } catch (e) {}
    var degrees = completedDegreeIdsCareer(s);
    var reqs = careerReqDegrees(job);
    if (reqs.length && reqs.some(function (id) { return degrees.indexOf(id) >= 0; })) return true;
    if (minAge <= CAREER_JOB_ACCESS_AGE && !reqs.length) return true;
    return age >= CAREER_JOB_ACCESS_AGE && careerCategory(job) === "starter";
  }

  function ensureCareerPipelineState(s) {
    s = s || safeState();
    s.careerV1827 = s.careerV1827 || {};
    s.careerV1827.applications = Array.isArray(s.careerV1827.applications) ? s.careerV1827.applications : [];
    s.careerV1827.offers = Array.isArray(s.careerV1827.offers) ? s.careerV1827.offers : [];
    s.careerV1827.history = Array.isArray(s.careerV1827.history) ? s.careerV1827.history : [];
    return s.careerV1827;
  }

  function createCareerApplicationV1835(job, reason) {
    var s = safeState();
    var pipe = ensureCareerPipelineState(s);
    var jobId = String(job && (job.id || job.title) || "");
    if (!jobId) return careerToast("That job is not loaded.");
    if (activeCareerApplication(jobId)) return careerToast("You already have an active application for this job.");
    if (activeCareerOffer(jobId)) return careerToast("You already have an offer for this job.");
    var plan = industryOfferPlan(job, job.salary || 0, s);
    pipe.applications.unshift({
      jobId: jobId,
      title: job.title || job.name || jobId,
      stage: "prep",
      score: careerFitScore(job, s),
      prepPoints: Math.max(0, Math.round(plan.years / 2)),
      industryGateV1835: plan.years >= 5,
      industryYearsV1835: plan.years,
      industryStandingV1835: plan.standing.label,
      targetSalaryV1835: plan.salary,
      createdAge: Number(s.age) || 0
    });
    careerLog((reason || "Application opened") + " for " + (job.title || jobId) + ". Expected offer range starts around " + moneyText(plan.salary) + "/yr.", { confidence: 1 });
    saveRenderCareer();
  }

  function createCompetitorOfferV1835(manual) {
    var s = safeState();
    var job = ensureJobCareerMeta(s);
    var current = careerByCurrentJob(s);
    if (!job || !current) {
      if (manual) return careerToast("Build a current job track record before competitors can bid.");
      return false;
    }
    var cat = careerCategory(current);
    var years = industryExperienceYears(cat, s);
    var standing = industryStanding(years);
    if (years < 5) {
      if (manual) return careerToast("Competitors start calling after roughly five years in the same industry.");
      return false;
    }
    var perf = Number(job.performance) || 50;
    if (perf < 62) {
      if (manual) return careerToast("Your industry name is real, but performance needs to be stronger before rivals bid.");
      return false;
    }
    s.actionsTaken = s.actionsTaken || {};
    var career = ensureCareerV1835(s);
    var age = Number(s.age) || 0;
    if (manual && s.actionsTaken.competitorBidV1835) return careerToast("You already scouted a competitor bid this year.");
    if (!manual && career.lastAutoPoachAge === age) return false;
    var jobId = String(current.id || job.jobId || current.title || job.title || "current_job");
    if (activeCareerOffer(jobId)) {
      if (manual) return careerToast("A competing offer is already sitting in your pipeline.");
      return false;
    }
    var ladder = current.ladder || [];
    var tier = Math.max(0, Number(job.tier) || 0);
    var jump = years >= 20 ? 99 : years >= 15 ? 2 : years >= 10 ? 1 : 0;
    var targetTier = ladder.length ? Math.min(ladder.length - 1, tier + jump) : tier;
    var rung = ladder[targetTier] || null;
    var base = Math.max(1, Math.round(Number(job.salary) || Number(current.salary) || 0));
    var bumpPct = .04 + Math.min(.16, years * .006) + Math.max(0, perf - 70) * .0015 + (manual ? .015 : 0);
    var salary = Math.max(base + 1000, Math.round(base * (1 + bumpPct)));
    if (rung && Number(rung.salary) > salary) salary = Math.round(Number(rung.salary) * (1 + Math.max(.03, standing.bonus / 2)));
    var targetTitle = (rung && rung.title) || job.title || current.title || "New role";
    var pipe = ensureCareerPipelineState(s);
    pipe.offers.unshift({
      jobId: jobId,
      title: "Competitor bid: " + targetTitle,
      salary: salary,
      baseSalaryV1835: base,
      strength: "poach",
      closed: false,
      negotiated: false,
      poachV1835: true,
      industryAdjustedV1835: true,
      industryYearsV1835: years,
      industryStandingV1835: standing.label,
      startTierV1835: targetTier,
      startTitleV1835: targetTitle,
      createdAge: age
    });
    if (manual) s.actionsTaken.competitorBidV1835 = true;
    else career.lastAutoPoachAge = age;
    career.poachHistory.unshift({ age: age, category: cat, title: targetTitle, salary: salary });
    career.poachHistory = career.poachHistory.slice(0, 10);
    careerLog((manual ? "Competitor search" : "A rival firm") + " produced a " + moneyText(salary) + "/yr offer for " + targetTitle + ".", { confidence: 2, stress: 1 });
    if (manual || isCareerHub(currentHubId())) saveRenderCareer();
    else {
      try { if (typeof save === "function") save(); } catch (e) {}
    }
    return true;
  }

  function missingForCareer(job, s) {
    s = s || safeState();
    var missing = [];
    var minAge = Number(job && job.minAge) || CAREER_JOB_ACCESS_AGE;
    if ((Number(s.age) || 0) < minAge) missing.push("Age " + minAge + "+");
    if (!jobQualifiesCareer(job, s)) {
      var degrees = careerReqDegrees(job);
      missing.push(degrees.length ? degrees.map(function (id) { return id === "cs" ? "computer science" : id; }).join(" / ") + " or 5+ industry years" : "more stats or experience");
    }
    return missing.join(" - ") || "Ready";
  }

  function careerFitScore(job, s) {
    s = s || safeState();
    var stats = s.stats || {};
    var score = 38;
    if (jobQualifiesCareer(job, s)) score += 20;
    score += statNumber(stats.smarts, 50) * .13;
    score += statNumber(stats.discipline, 50) * .12;
    score += statNumber(stats.confidence, 50) * .12;
    score += statNumber(stats.creativity, 50) * .05;
    score -= statNumber(stats.stress, 0) * .07;
    if (careerReqDegrees(job).some(function (id) { return completedDegreeIdsCareer(s).indexOf(id) >= 0; })) score += 8;
    score += Math.min(20, industryExperienceYears(careerCategory(job), s) * 1.15);
    return Math.round(clampStat(score, 5, 99));
  }

  function activeCareerApplication(jobId) {
    var apps = (((safeState().careerV1827 || {}).applications) || []);
    return apps.find(function (app) { return app && !app.closed && String(app.jobId) === String(jobId); }) || null;
  }

  function activeCareerOffer(jobId) {
    var offers = (((safeState().careerV1827 || {}).offers) || []);
    return offers.find(function (offer) { return offer && !offer.closed && String(offer.jobId) === String(jobId); }) || null;
  }

  function careerByCurrentJob(s) {
    s = s || safeState();
    if (!s.job) return null;
    var id = String(s.job.jobId || "");
    var title = String(s.job.title || "");
    return rootCareerCatalog().find(function (job) {
      return String(job.id || "") === id || String(job.title || "") === title || (job.ladder || []).some(function (rung) { return rung && rung.title === title; });
    }) || null;
  }

  function ensureJobCareerMeta(s) {
    s = s || safeState();
    if (!s.job) return null;
    var age = Number(s.age) || 0;
    var tier = Number(s.job.tier) || 0;
    if (s.job.startedAge == null) s.job.startedAge = Math.max(CAREER_JOB_ACCESS_AGE, age - Math.max(1, (tier + 1) * 2));
    if (s.job.roleStartAge == null) s.job.roleStartAge = Math.max(CAREER_JOB_ACCESS_AGE, age - Math.max(1, tier ? 2 : 1));
    if (s.job.contractLevel == null) s.job.contractLevel = 0;
    if (!Array.isArray(s.job.contractHistoryV1835)) s.job.contractHistoryV1835 = [];
    return s.job;
  }

  function currentJobTenure(s) {
    var job = ensureJobCareerMeta(s);
    if (!job) return 0;
    return Math.max(0, (Number((s || safeState()).age) || 0) - (Number(job.roleStartAge) || 0));
  }

  function promotionMinYears(job, nextTierIndex) {
    var cat = careerCategory(job || {});
    var salary = Number(job && job.ladder && job.ladder[nextTierIndex] && job.ladder[nextTierIndex].salary) || Number(job && job.salary) || 0;
    var years = nextTierIndex <= 1 ? 2 : nextTierIndex <= 3 ? 3 : 5;
    if (cat === "starter" || cat === "trades") years = nextTierIndex <= 1 ? 1 : nextTierIndex <= 3 ? 2 : 3;
    if (cat === "finance" || cat === "tech" || cat === "legal" || cat === "health" || salary >= 250000) years += 1;
    return Math.max(1, Math.min(5, years));
  }

  function careerHasNoCeiling(job) {
    return ["finance", "business", "tech", "legal", "real_estate", "creative"].indexOf(careerCategory(job || {})) >= 0;
  }

  function careerSoftCap(job) {
    if (!job) return 250000;
    var ladder = job.ladder || [];
    var last = ladder.length ? Number(ladder[ladder.length - 1].salary) || 0 : 0;
    return Math.max(last, Number(job.salary) * 2.4, 85000);
  }

  function careerPromotionStatus(s) {
    s = s || safeState();
    var current = careerByCurrentJob(s);
    var job = ensureJobCareerMeta(s);
    if (!job || !current || !current.ladder) return { text: "No ladder loaded yet.", cls: "gold", canAsk: !!job };
    var tier = Number(job.tier) || 0;
    var next = current.ladder[tier + 1];
    var tenure = currentJobTenure(s);
    if (!next) {
      return {
        text: careerHasNoCeiling(current) ? "Top rung reached. Contract upside can keep growing." : "Top rung reached. Raises are now slower.",
        cls: careerHasNoCeiling(current) ? "good" : "gold",
        canAsk: true
      };
    }
    var years = promotionMinYears(current, tier + 1);
    var perf = Number(job.performance) || 50;
    var needPerf = Number(next.minPerf) || 0;
    return {
      text: "Next: " + next.title + " needs " + years + " yrs in role and " + needPerf + "+ performance.",
      cls: tenure >= years && perf >= needPerf ? "good" : "gold",
      canAsk: tenure >= years,
      next: next,
      years: years,
      tenure: tenure,
      perf: perf
    };
  }

  function careerToast(message) {
    try { if (typeof addToast === "function") return addToast(message); } catch (e) {}
    try { if (typeof addLog === "function") return addLog(message); } catch (e2) {}
  }

  function careerLog(message, deltas) {
    try { if (typeof addLog === "function") return addLog(message, deltas || {}); } catch (e) {}
    return careerToast(message);
  }

  function saveRenderCareer() {
    try { if (typeof save === "function") save(); } catch (e) {}
    if (isCareerHub(currentHubId()) && typeof window.renderHubInPlaceV16 === "function") {
      var pos = captureCareerScroll();
      window.renderHubInPlaceV16("career", pos);
      restoreCareerScroll(pos);
      return;
    }
    try { if (typeof render === "function") render(); } catch (e2) {}
  }

  function careerActionExpression(job, qualified, app, offer, current) {
    var id = esc(String(job.id || job.title || ""));
    if (current) return '<button class="money-btn" disabled>Current job</button>';
    if (offer) return '<button class="money-btn green" onclick="event.preventDefault();event.stopPropagation();acceptCareerOfferV1835(\'' + id + '\')">Accept Offer</button><button class="money-btn gold" onclick="event.preventDefault();event.stopPropagation();negotiateOfferV1832 && negotiateOfferV1832(\'' + id + '\')">Negotiate</button>';
    if (app) return '<button class="money-btn gold" onclick="event.preventDefault();event.stopPropagation();startCareerInterviewV1835(\'' + id + '\')">Interview Options</button>';
    if (qualified) return '<button class="money-btn blue" onclick="event.preventDefault();event.stopPropagation();applyCareerJobV1835(\'' + id + '\')">Apply</button>';
    return '<button class="money-btn" disabled>Locked</button>';
  }

  function filterJobsForCareer(jobs, filter, s) {
    var degrees = completedDegreeIdsCareer(s);
    var list = jobs.filter(function (job) {
      var cat = careerCategory(job);
      var qualified = jobQualifiesCareer(job, s);
      var reqs = careerReqDegrees(job);
      if (filter.category === "open") return qualified;
      if (filter.category === "degree") return reqs.some(function (id) { return degrees.indexOf(id) >= 0; });
      if (filter.category === "business_finance") return ["finance", "business", "real_estate"].indexOf(cat) >= 0;
      if (filter.category === "all") return true;
      return cat === filter.category;
    });
    var search = String(filter.search || "").toLowerCase().trim();
    if (search) {
      list = list.filter(function (job) {
        return String((job.title || "") + " " + (job.desc || "") + " " + careerCategoryLabel(careerCategory(job)) + " " + careerReqDegrees(job).join(" ")).toLowerCase().indexOf(search) >= 0;
      });
    }
    list.sort(function (a, b) {
      var payA = industryOfferPlan(a, a.salary, s).salary;
      var payB = industryOfferPlan(b, b.salary, s).salary;
      if (filter.sort === "salary_asc") return payA - payB;
      if (filter.sort === "age") return (Number(a.minAge) || 0) - (Number(b.minAge) || 0) || payB - payA;
      if (filter.sort === "fit") return careerFitScore(b, s) - careerFitScore(a, s) || payB - payA;
      if (filter.sort === "qualified") return (jobQualifiesCareer(b, s) - jobQualifiesCareer(a, s)) || payB - payA;
      return payB - payA;
    });
    return list;
  }

  function renderCareerControls(filter, total, shown) {
    var options = [
      ["open", "Open now"], ["degree", "My degree lanes"], ["business_finance", "Business + finance"], ["starter", "Teen / starter"],
      ["finance", "Finance"], ["business", "Business"], ["tech", "Technology"], ["real_estate", "Real estate"],
      ["legal", "Legal"], ["health", "Health"], ["education", "Education"], ["trades", "Trades"], ["creative", "Creative / media"], ["all", "All jobs"]
    ].map(function (opt) {
      return '<option value="' + esc(opt[0]) + '"' + (filter.category === opt[0] ? " selected" : "") + '>' + esc(opt[1]) + '</option>';
    }).join("");
    var sorts = [
      ["salary_desc", "Pay: highest first"], ["salary_asc", "Pay: lowest first"], ["fit", "Best fit"], ["qualified", "Qualified first"], ["age", "Youngest unlock"]
    ].map(function (opt) {
      return '<option value="' + esc(opt[0]) + '"' + (filter.sort === opt[0] ? " selected" : "") + '>' + esc(opt[1]) + '</option>';
    }).join("");
    return '<div class="v1835-career-controls"><label><span>Category</span><select onchange="setCareerFilterV1835(\'category\',this.value)">' + options + '</select></label><label><span>Search</span><input value="' + esc(filter.search) + '" placeholder="Search jobs, degrees, fields" oninput="setCareerSearchV1835(this.value)"></label><label><span>Sort</span><select onchange="setCareerFilterV1835(\'sort\',this.value)">' + sorts + '</select></label><div class="v1835-career-count"><b>' + shown + '</b><span>shown / ' + total + '</span></div></div>';
  }

  function renderCareerJobCard(job, s) {
    var id = String(job.id || job.title || "");
    var qualified = jobQualifiesCareer(job, s);
    var app = activeCareerApplication(id);
    var offer = activeCareerOffer(id);
    var current = s.job && (String(s.job.jobId || "") === id || s.job.title === job.title);
    var cat = careerCategory(job);
    var reqs = careerReqDegrees(job);
    var ladder = job.ladder || [];
    var ceiling = ladder.length ? ladder[ladder.length - 1].salary : careerSoftCap(job);
    var plan = industryOfferPlan(job, job.salary, s);
    var industryYears = industryExperienceYears(cat, s);
    var maxCapTag = ladder.length
      ? "Max cap " + moneyText(ceiling) + (careerHasNoCeiling(job) ? "+" : "")
      : "Max cap " + moneyText(ceiling);
    var tags = [
      "Base " + moneyText(job.salary || 0) + "/yr",
      plan.salary > Number(job.salary || 0) ? "Likely offer " + moneyText(plan.salary) : "Offer floor " + moneyText(plan.salary),
      "Age " + (Number(job.minAge) || CAREER_JOB_ACCESS_AGE) + "+",
      qualified ? "🎯 Fit " + careerFitScore(job, s) + "/100" : missingForCareer(job, s),
      industryPremiumText(job, s),
      reqs.length ? reqs.slice(0, 3).join(" / ") : careerCategoryLabel(cat),
      maxCapTag,
      careerHasNoCeiling(job) ? "uncapped negotiation" : "salary ceiling"
    ];
    return '<div class="v1835-job-card ' + (current ? "current" : offer ? "offer" : app ? "pipeline" : qualified ? "qualified" : "locked") + (industryYears >= 5 ? " industry" : "") + '" data-career-card="1" data-category="' + esc(cat) + '" data-search="' + esc(String((job.title || "") + " " + (job.desc || "") + " " + reqs.join(" ")).toLowerCase()) + '"><div class="v1835-job-card-head"><div><span>' + esc(careerCategoryLabel(cat)) + '</span><b>' + esc(job.title || job.name || id) + '</b></div><em>' + (current ? "Current" : offer ? "Offer" : app ? "Pipeline" : qualified ? "Qualified" : "Locked") + '</em></div>' + (industryYears >= 5 ? '<div class="v1835-industry-ribbon">' + esc(plan.standing.label) + ' track - starts near ' + esc(plan.title) + '</div>' : '') + '<p>' + esc(job.desc || "Career path.") + '</p><div class="v1835-career-chip-row">' + tags.map(function (tag) { return '<span>' + esc(tag) + '</span>'; }).join("") + '</div><div class="v1835-career-card-actions">' + careerActionExpression(job, qualified, app, offer, current) + '</div></div>';
  }

  function renderCareerPipeline() {
    var s = safeState();
    var active = (((s.careerV1827 || {}).applications) || []).filter(function (app) { return app && !app.closed; });
    var offers = (((s.careerV1827 || {}).offers) || []).filter(function (offer) { return offer && !offer.closed; });
    var rows = [];
    offers.forEach(function (offer) {
      var detail = esc(offer.strength || "standard") + ' offer - ' + moneyText(offer.salary || 0) + '/yr' + (offer.negotiated ? " - negotiated" : "");
      if (offer.industryStandingV1835) detail += " - " + esc(offer.industryStandingV1835) + " track";
      if (offer.startTitleV1835) detail += " - starts as " + esc(offer.startTitleV1835);
      rows.push('<div class="v1835-career-pipeline-card offer ' + (offer.poachV1835 ? "poach" : "") + '"><div><b>Offer: ' + esc(offer.title || "Job") + '</b><span>' + detail + '</span></div><div class="v1835-career-card-actions"><button class="money-btn green" onclick="event.preventDefault();event.stopPropagation();acceptCareerOfferV1835(\'' + esc(offer.jobId) + '\')">Accept</button><button class="money-btn gold" onclick="event.preventDefault();event.stopPropagation();negotiateOfferV1832 && negotiateOfferV1832(\'' + esc(offer.jobId) + '\')">Negotiate</button><button class="money-btn" onclick="event.preventDefault();event.stopPropagation();declineJobOfferV1832 ? declineJobOfferV1832(\'' + esc(offer.jobId) + '\') : declineJobOfferV1827(\'' + esc(offer.jobId) + '\')">Decline</button></div></div>');
    });
    active.forEach(function (app) {
      var inQuestion = app.stage === "question" || app.stage === "second";
      var nextStep = inQuestion
        ? '<div class="v1835-career-question"><b>' + esc(app.question || "Interview question") + '</b><span>Pick a strategy. Prep, referrals, and stress affect the score.</span></div><div class="v1835-career-card-actions"><button class="money-btn green" onclick="event.preventDefault();event.stopPropagation();answerInterviewV1832(\'' + esc(app.jobId) + '\',\'technical\')">Technical Proof</button><button class="money-btn blue" onclick="event.preventDefault();event.stopPropagation();answerInterviewV1832(\'' + esc(app.jobId) + '\',\'behavioral\')">Behavioral Story</button><button class="money-btn gold" onclick="event.preventDefault();event.stopPropagation();answerInterviewV1832(\'' + esc(app.jobId) + '\',\'leadership\')">Leadership Example</button><button class="money-btn" onclick="event.preventDefault();event.stopPropagation();answerInterviewV1832(\'' + esc(app.jobId) + '\',\'honest\')">Honest Growth Answer</button></div>'
        : '<div class="v1835-career-card-actions"><button class="money-btn gold" onclick="event.preventDefault();event.stopPropagation();startCareerInterviewV1835(\'' + esc(app.jobId) + '\')">Interview Options</button></div>';
      rows.push('<div class="v1835-career-pipeline-card"><div><b>' + esc(app.title || "Application") + '</b><span>' + esc(app.stage || "prep") + ' - fit ' + Math.round(Number(app.score) || 0) + '/100 - prep ' + Math.round(Number(app.prepPoints) || 0) + '</span></div><div class="v1835-prep-row"><button class="money-btn" onclick="event.preventDefault();event.stopPropagation();prepCareerInterviewV1835(\'' + esc(app.jobId) + '\',\'research\')">Research</button><button class="money-btn" onclick="event.preventDefault();event.stopPropagation();prepCareerInterviewV1835(\'' + esc(app.jobId) + '\',\'resume\')">Resume</button><button class="money-btn" onclick="event.preventDefault();event.stopPropagation();prepCareerInterviewV1835(\'' + esc(app.jobId) + '\',\'practice\')">Practice</button><button class="money-btn" onclick="event.preventDefault();event.stopPropagation();prepCareerInterviewV1835(\'' + esc(app.jobId) + '\',\'network\')">Referral</button><button class="money-btn" onclick="event.preventDefault();event.stopPropagation();prepCareerInterviewV1835(\'' + esc(app.jobId) + '\',\'mock\')">Mock</button><button class="money-btn" onclick="event.preventDefault();event.stopPropagation();prepCareerInterviewV1835(\'' + esc(app.jobId) + '\',\'rest\')">Rest</button></div>' + nextStep + '<div class="v1835-career-card-actions"><button class="money-btn" onclick="event.preventDefault();event.stopPropagation();withdrawApplicationV1832 && withdrawApplicationV1832(\'' + esc(app.jobId) + '\')">Withdraw</button></div></div>');
    });
    if (!rows.length) rows.push('<div class="v1835-career-note">No active applications. Apply below, prep the interview, then negotiate before accepting.</div>');
    return '<section class="panel v1835-career-pipeline"><div class="section-label">📨 Applications + Offers</div>' + rows.join("") + '</section>';
  }

  function renderCareerLadderPanel(s, current) {
    if (!s.job || !current || !current.ladder) return "";
    var tier = Number(s.job.tier) || 0;
    return '<section class="panel v1835-career-ladder"><div class="section-label">🪜 Career Ladder</div><div class="v1835-ladder-rail">' + current.ladder.map(function (rung, index) {
      var reached = index <= tier;
      var nextYears = index > 0 ? promotionMinYears(current, index) : 0;
      return '<div class="v1835-ladder-rung ' + (index === tier ? "current" : reached ? "reached" : "") + '"><span>' + (reached ? "Reached" : "Locked") + '</span><b>' + esc(rung.title) + '</b><em>' + moneyText(rung.salary || 0) + '/yr' + (index > 0 ? " - " + nextYears + " yr gate - " + (Number(rung.minPerf) || 0) + "+ perf" : "") + '</em></div>';
    }).join("") + '</div></section>';
  }

  function renderCurrentCareerPanel() {
    var s = safeState();
    var job = ensureJobCareerMeta(s);
    var current = careerByCurrentJob(s);
    var status = careerPromotionStatus(s);
    if (!job) {
      return '<section class="panel v1835-career-current empty"><div class="section-label">💼 Current Work</div><div class="v1835-career-hero"><div><b>Unemployed</b><span>At 16, starter jobs open up. Degree lanes and higher-paying careers stay visible but locked until you qualify.</span></div><strong>' + (Number(s.age) || 0) + '</strong></div></section>';
    }
    var tenure = currentJobTenure(s);
    var cap = careerSoftCap(current);
    var uncapped = careerHasNoCeiling(current);
    var industryCat = currentIndustryCategory(s);
    var industryYears = industryExperienceYears(industryCat, s);
    var standing = industryStanding(industryYears);
    var perfPct = Math.max(0, Math.min(100, Math.round(Number(job.performance) || 50)));
    var perfKind = perfPct >= 65 ? "high" : perfPct < 35 ? "low" : "";
    return '<section class="panel v1835-career-current"><div class="section-label">💼 Current Work</div><div class="v1835-career-hero"><div><b>' + esc(job.title || "Job") + '</b><span>' + moneyText(job.salary || 0) + '/yr - performance ' + perfPct + '/100 - tenure ' + tenure + ' yr' + (tenure === 1 ? "" : "s") + '</span></div><strong>' + moneyText(job.salary || 0) + '</strong></div><div class="v1835-career-metrics"><div><span>📈 Promotion gate</span><b class="' + esc(status.cls) + '">' + esc(status.canAsk ? "Ready / close" : "Waiting") + '</b><em>' + esc(status.text) + '<div class="bar"><div class="fill ' + perfKind + '" style="width:' + perfPct + '%"></div></div></em></div><div><span>Industry standing</span><b class="' + (industryYears >= 5 ? "good" : "gold") + '">' + esc(standing.label) + '</b><em>' + esc(careerCategoryLabel(industryCat)) + " - " + industryYears + ' yr' + (industryYears === 1 ? "" : "s") + ' - +' + Math.round(standing.bonus * 100) + '% similar offers.</em></div><div><span>Contract ceiling</span><b class="' + (uncapped ? "good" : "gold") + '">' + (uncapped ? "Uncapped" : esc(moneyText(cap))) + '</b><em>' + (uncapped ? "This field can keep negotiating past the ladder." : "Raises slow down near the ladder cap.") + '</em></div><div><span>Role started</span><b>Age ' + esc(job.roleStartAge) + '</b><em>Promotions now respect years in role.</em></div></div><div class="v1835-career-actions"><button class="money-btn" onclick="event.preventDefault();event.stopPropagation();workHarder()" ' + (s.actionsTaken && s.actionsTaken.workHarder ? "disabled" : "") + '>Work Harder</button><button class="money-btn" onclick="event.preventDefault();event.stopPropagation();workOverdrive()" ' + (s.actionsTaken && s.actionsTaken.workOverdrive ? "disabled" : "") + '>Overdrive</button><button class="money-btn gold" onclick="event.preventDefault();event.stopPropagation();askPromotion()" ' + (s.actionsTaken && s.actionsTaken.askPromotion ? "disabled" : "") + '>Promotion</button><button class="money-btn blue" onclick="event.preventDefault();event.stopPropagation();negotiateContractV1835()" ' + (s.actionsTaken && s.actionsTaken.contractNegotiationV1835 ? "disabled" : "") + '>Negotiate Contract</button><button class="money-btn green" onclick="event.preventDefault();event.stopPropagation();scoutCompetitorOfferV1835()" ' + (s.actionsTaken && s.actionsTaken.competitorBidV1835 ? "disabled" : "") + '>Scout Competitor Bid</button></div></section>' + renderCareerLadderPanel(s, current);
  }

  function renderCareerMarket() {
    var s = safeState();
    var filter = careerFilterState();
    var jobs = rootCareerCatalog();
    var list = filterJobsForCareer(jobs, filter, s);
    var visible = list.slice(0, 40);
    var cards = visible.map(function (job) { return renderCareerJobCard(job, s); }).join("");
    if (!cards) cards = '<div class="v1835-career-note">No jobs match this filter yet. Try All jobs or clear the search.</div>';
    var degrees = completedDegreeIdsCareer(s);
    return '<section class="panel v1835-career-market"><div class="section-label">🔍 Job Market</div><div class="v1835-career-market-head"><div><b>Searchable career board</b><span>Filter by business/finance, starter jobs, degree lanes, or highest pay.</span></div><em>' + esc(degrees.join(", ") || "no degree on file") + '</em></div>' + renderCareerControls(filter, jobs.length, list.length) + '<div class="v1835-job-grid">' + cards + '</div></section>';
  }

  function renderCareerDesk() {
    var s = safeState();
    s.careerV1827 = s.careerV1827 || {};
    s.careerV1827.applications = Array.isArray(s.careerV1827.applications) ? s.careerV1827.applications : [];
    s.careerV1827.offers = Array.isArray(s.careerV1827.offers) ? s.careerV1827.offers : [];
    s.careerV1827.history = Array.isArray(s.careerV1827.history) ? s.careerV1827.history : [];
    var age = Number(s.age) || 0;
    var unlocked = age >= CAREER_JOB_ACCESS_AGE;
    var open = rootCareerCatalog().filter(function (job) { return jobQualifiesCareer(job, s); }).length;
    return '<div class="v1835-career-desk"><section class="panel v1835-career-topline"><div><div class="money-kicker">Career command center</div><h2>Job</h2><p>Current work stays first. Search, categories, applications, interviews, salary sorting, contract negotiation, and slower promotion gates live below.</p></div><div class="v1835-career-score"><b>' + open + '</b><span>open jobs</span></div></section>' + (!unlocked ? '<section class="panel v1835-career-note locked">Job access opens at 16. You can still scout careers before then.</section>' : "") + renderCurrentCareerPanel() + renderCareerPipeline() + renderCareerMarket() + '</div>';
  }

  function schoolScroller() {
    if (typeof document === "undefined" || !document.querySelector) return null;
    return document.querySelector && (
      document.querySelector('[data-hub-body="school"]') ||
      document.querySelector('[data-hub-body="education"]') ||
      document.querySelector(".hub-sheet-school .v16-hub-body") ||
      document.querySelector(".hub-sheet-school .v11-hub-body") ||
      document.querySelector(".hub-sheet-school")
    );
  }

  function captureSchoolScroll() {
    var scroller = schoolScroller();
    return {
      hubId: currentHubId(),
      top: scroller && typeof scroller.scrollTop === "number" ? scroller.scrollTop : 0,
      left: scroller && typeof scroller.scrollLeft === "number" ? scroller.scrollLeft : 0,
      winX: window.scrollX || 0,
      winY: window.scrollY || 0
    };
  }

  function restoreSchoolScroll(pos) {
    if (!pos || !isSchoolHub(pos.hubId)) return;
    var restore = function () {
      if (!isSchoolHub(currentHubId())) return;
      var scroller = schoolScroller();
      if (scroller) {
        scroller.scrollTop = Number(pos.top) || 0;
        scroller.scrollLeft = Number(pos.left) || 0;
      }
      if (typeof window.scrollTo === "function") window.scrollTo(Number(pos.winX) || 0, Number(pos.winY) || 0);
    };
    restore();
    setTimeout(restore, 0);
    setTimeout(restore, 40);
  }

  function careerScroller() {
    if (typeof document === "undefined" || !document.querySelector) return null;
    return document.querySelector && (
      document.querySelector('[data-hub-body="career"]') ||
      document.querySelector('[data-hub-body="job"]') ||
      document.querySelector(".hub-sheet-career .v16-hub-body") ||
      document.querySelector(".hub-sheet-career .v11-hub-body") ||
      document.querySelector(".hub-sheet-career") ||
      document.querySelector(".hub-overlay .v16-hub-body")
    );
  }

  function captureCareerScroll() {
    var scroller = careerScroller();
    return {
      hubId: currentHubId(),
      top: scroller && typeof scroller.scrollTop === "number" ? scroller.scrollTop : 0,
      left: scroller && typeof scroller.scrollLeft === "number" ? scroller.scrollLeft : 0,
      winX: window.scrollX || 0,
      winY: window.scrollY || 0
    };
  }

  function restoreCareerScroll(pos) {
    if (!pos || !isCareerHub(pos.hubId)) return;
    var restore = function () {
      if (!isCareerHub(currentHubId())) return;
      var scroller = careerScroller();
      if (scroller) {
        scroller.scrollTop = Number(pos.top) || 0;
        scroller.scrollLeft = Number(pos.left) || 0;
      }
      if (typeof window.scrollTo === "function") window.scrollTo(Number(pos.winX) || 0, Number(pos.winY) || 0);
    };
    restore();
    setTimeout(restore, 0);
    setTimeout(restore, 40);
  }

  var previousRenderHubContent = window.renderHubContent || (typeof renderHubContent === "function" ? renderHubContent : null);
  if (previousRenderHubContent) {
    window.renderHubContent = function (hubId) {
      var html = previousRenderHubContent.apply(this, arguments) || "";
      if (isCareerHub(hubId)) return renderCareerDesk();
      return isSchoolHub(hubId) ? organizeSchoolHtml(html) : html;
    };
    try { renderHubContent = window.renderHubContent; } catch (e) {}
  }

  var previousSetSchoolPage = window.setSchoolPage || (typeof setSchoolPage === "function" ? setSchoolPage : null);
  window.setSchoolPage = function (page) {
    var pos = captureSchoolScroll();
    try { rememberSchoolPage(page); } catch (e) {
      if (previousSetSchoolPage) return previousSetSchoolPage.apply(this, arguments);
    }
    if (isSchoolHub(currentHubId()) && typeof window.renderHubInPlaceV16 === "function") {
      window.renderHubInPlaceV16("school", pos);
      restoreSchoolScroll(pos);
      return;
    }
    if (typeof render === "function") render();
    restoreSchoolScroll(pos);
  };
  try { setSchoolPage = window.setSchoolPage; } catch (e) {}

  function stampCurrentCareerJob(beforeTitle) {
    var s = safeState();
    if (!s.job) return;
    ensureJobCareerMeta(s);
    if (beforeTitle && s.job.title !== beforeTitle) {
      s.job.roleStartAge = Number(s.age) || 0;
      s.job.lastPromotionAgeV1835 = Number(s.age) || 0;
    }
  }

  window.setCareerFilterV1835 = function (key, value) {
    var filter = careerFilterState();
    filter[key] = value;
    var pos = captureCareerScroll();
    if (typeof window.renderHubInPlaceV16 === "function") {
      window.renderHubInPlaceV16("career", pos);
      restoreCareerScroll(pos);
    } else if (typeof render === "function") {
      render();
      restoreCareerScroll(pos);
    }
  };

  window.setCareerSearchV1835 = function (value) {
    var filter = careerFilterState();
    filter.search = String(value || "");
    if (typeof window.filterCareerCardsDomV1835 === "function") window.filterCareerCardsDomV1835();
  };

  window.filterCareerCardsDomV1835 = function () {
    if (typeof document === "undefined" || !document.querySelectorAll) return;
    var filter = careerFilterState();
    var search = String(filter.search || "").toLowerCase().trim();
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-career-card='1']"));
    cards.forEach(function (card) {
      var hay = String((card.dataset && card.dataset.search) || "").toLowerCase();
      card.style.display = !search || hay.indexOf(search) >= 0 ? "" : "none";
    });
  };

  window.applyCareerJobV1835 = function (jobId) {
    var s = safeState();
    var job = rootCareerCatalog().find(function (item) { return item && String(item.id || item.title) === String(jobId); }) || null;
    if (!job) return careerToast("That job is not loaded yet.");
    if (!jobQualifiesCareer(job, s)) return careerToast("Locked: " + missingForCareer(job, s));
    if (!nativeJobQualifiesCareer(job, s) && industryExperienceYears(careerCategory(job), s) >= 5) {
      return createCareerApplicationV1835(job, "Your industry reputation opened the door");
    }
    if (typeof window.applyToJobV1832 === "function") return window.applyToJobV1832(jobId);
    if (typeof window.applyToJobV1828 === "function") return window.applyToJobV1828(jobId);
    if (typeof window.takeCareer === "function") return window.takeCareer(jobId);
    return createCareerApplicationV1835(job, "Direct application started");
  };

  window.prepCareerInterviewV1835 = function (jobId, type) {
    if (typeof window.prepInterviewV1832 === "function") return window.prepInterviewV1832(jobId, type);
    if (typeof window.prepApplicationV1828 === "function") return window.prepApplicationV1828(jobId, type);
    return careerToast("Interview prep is not ready yet.");
  };

  window.startCareerInterviewV1835 = function (jobId) {
    if (typeof window.scheduleInterviewV1832 === "function") return window.scheduleInterviewV1832(jobId);
    if (typeof window.startInterviewV1828 === "function") return window.startInterviewV1828(jobId);
    if (typeof window.interviewForJobV1827 === "function") return window.interviewForJobV1827(jobId);
    return careerToast("Interview options are not ready yet.");
  };

  window.acceptCareerOfferV1835 = function (jobId) {
    var before = safeState().job && safeState().job.title;
    var offerSnapshot = activeCareerOffer(jobId);
    if (offerSnapshot) offerSnapshot = Object.assign({}, offerSnapshot);
    var result;
    if (typeof window.acceptJobOfferV1828 === "function") result = window.acceptJobOfferV1828(jobId);
    else if (typeof window.acceptJobOfferV1827 === "function") result = window.acceptJobOfferV1827(jobId);
    else return careerToast("No offer accept function is loaded.");
    applyAcceptedIndustryOffer(jobId, offerSnapshot);
    stampCurrentCareerJob(before);
    try { if (typeof save === "function") save(); } catch (e) {}
    return result;
  };

  window.scoutCompetitorOfferV1835 = function () {
    return createCompetitorOfferV1835(true);
  };

  window.negotiateContractV1835 = function () {
    var s = safeState();
    var job = ensureJobCareerMeta(s);
    if (!job) return careerToast("You need a job before negotiating a contract.");
    s.actionsTaken = s.actionsTaken || {};
    if (s.actionsTaken.contractNegotiationV1835) return careerToast("You already negotiated this year.");
    var current = careerByCurrentJob(s);
    var tenure = currentJobTenure(s);
    if (tenure < 1) return careerToast("Give the role at least one year before renegotiating.");
    var stats = s.stats || {};
    var perf = Number(job.performance) || 50;
    var score = perf + statNumber(stats.confidence, 50) * .20 + statNumber(stats.discipline, 50) * .10 + tenure * 4 - statNumber(stats.stress, 0) * .08;
    var uncapped = careerHasNoCeiling(current);
    var cap = careerSoftCap(current);
    var basePct = .035 + Math.min(.055, tenure * .006) + Math.max(0, perf - 65) / 1500;
    if (uncapped && perf >= 80) basePct += .035;
    var success = score >= (uncapped ? 74 : 68);
    s.actionsTaken.contractNegotiationV1835 = true;
    if (!success) {
      job.performance = Math.max(35, perf - 3);
      try { if (typeof applyDeltas === "function") applyDeltas({ stress: 3, confidence: -1 }); } catch (e) {}
      careerLog("Contract negotiation stalled. Build performance, confidence, or tenure and try again next year.", { stress: 3, confidence: -1 });
      saveRenderCareer();
      return;
    }
    var oldSalary = Math.round(Number(job.salary) || 0);
    var raise = Math.max(1000, Math.round(oldSalary * basePct));
    if (!uncapped && oldSalary + raise > cap) raise = Math.max(0, Math.round(cap - oldSalary));
    if (!raise) {
      careerLog("This career is at its soft salary ceiling. A promotion or a no-cap field is needed for bigger upside.");
      saveRenderCareer();
      return;
    }
    job.salary = oldSalary + raise;
    job.contractLevel = (Number(job.contractLevel) || 0) + 1;
    job.contractHistoryV1835.unshift({ age: Number(s.age) || 0, raise: raise, salary: job.salary, uncapped: !!uncapped });
    job.contractHistoryV1835 = job.contractHistoryV1835.slice(0, 8);
    job.performance = Math.max(45, perf - (uncapped ? 5 : 7));
    try { if (typeof applyDeltas === "function") applyDeltas({ happiness: 5, confidence: 2, stress: 1 }); } catch (e2) {}
    careerLog("Negotiated the contract up by " + moneyText(raise) + ". Salary is now " + moneyText(job.salary) + "/yr.", { happiness: 5, confidence: 2, stress: 1 });
    saveRenderCareer();
  };

  var previousAskPromotionV1835 = window.askPromotion || (typeof askPromotion === "function" ? askPromotion : null);
  if (previousAskPromotionV1835 && !previousAskPromotionV1835.__v1835TenureWrapped) {
    window.askPromotion = function () {
      var s = safeState();
      var current = careerByCurrentJob(s);
      var job = ensureJobCareerMeta(s);
      if (job && current && current.ladder) {
        var tier = Number(job.tier) || 0;
        var next = current.ladder[tier + 1];
        if (next) {
          var needYears = promotionMinYears(current, tier + 1);
          var tenure = currentJobTenure(s);
          if (tenure < needYears) {
            return careerToast("Promotion track needs " + needYears + " years in this role. You have " + tenure + ".");
          }
        }
      }
      var beforeTitle = job && job.title;
      var result = previousAskPromotionV1835.apply(this, arguments);
      stampCurrentCareerJob(beforeTitle);
      try { if (typeof save === "function") save(); } catch (e) {}
      return result;
    };
    window.askPromotion.__v1835TenureWrapped = true;
    try { askPromotion = window.askPromotion; } catch (e2) {}
  }

  ["acceptJobOfferV1828", "acceptJobOfferV1827", "takeCareer"].forEach(function (name) {
    var previous = window[name] || null;
    if (typeof previous !== "function" || previous.__v1835JobStampWrapped) return;
    window[name] = function () {
      var jobId = arguments.length ? arguments[0] : "";
      var beforeTitle = safeState().job && safeState().job.title;
      var offerSnapshot = activeCareerOffer(jobId);
      if (offerSnapshot) offerSnapshot = Object.assign({}, offerSnapshot);
      var result = previous.apply(this, arguments);
      applyAcceptedIndustryOffer(jobId, offerSnapshot);
      stampCurrentCareerJob(beforeTitle);
      try { if (typeof save === "function") save(); } catch (e) {}
      return result;
    };
    window[name].__v1835JobStampWrapped = true;
    try { if (name === "takeCareer") takeCareer = window[name]; } catch (e3) {}
    try { if (name === "acceptJobOfferV1828") acceptJobOfferV1828 = window[name]; } catch (e4) {}
    try { if (name === "acceptJobOfferV1827") acceptJobOfferV1827 = window[name]; } catch (e5) {}
  });

  ["answerInterviewV1832", "answerInterviewV1828", "interviewForJobV1827", "scheduleInterviewV1832", "startInterviewV1828", "negotiateOfferV1832", "negotiateOfferV1828"].forEach(function (name) {
    var previous = window[name] || null;
    if (typeof previous !== "function" || previous.__v1835IndustryOfferWrapped) return;
    window[name] = function () {
      var jobId = arguments.length ? arguments[0] : "";
      var result = previous.apply(this, arguments);
      if (jobId && applyIndustryUpgradeToOffer(jobId, name === "negotiateOfferV1832" || name === "negotiateOfferV1828" ? "Negotiation" : "Interview result")) {
        try { if (typeof save === "function") save(); } catch (e) {}
        if (isCareerHub(currentHubId()) && typeof window.renderHubInPlaceV16 === "function") window.renderHubInPlaceV16("career", captureCareerScroll());
      }
      return result;
    };
    window[name].__v1835IndustryOfferWrapped = true;
    try { if (name === "answerInterviewV1832") answerInterviewV1832 = window[name]; } catch (e1) {}
    try { if (name === "answerInterviewV1828") answerInterviewV1828 = window[name]; } catch (e2) {}
    try { if (name === "interviewForJobV1827") interviewForJobV1827 = window[name]; } catch (e3) {}
    try { if (name === "scheduleInterviewV1832") scheduleInterviewV1832 = window[name]; } catch (e4) {}
    try { if (name === "startInterviewV1828") startInterviewV1828 = window[name]; } catch (e5) {}
    try { if (name === "negotiateOfferV1832") negotiateOfferV1832 = window[name]; } catch (e6) {}
    try { if (name === "negotiateOfferV1828") negotiateOfferV1828 = window[name]; } catch (e7) {}
  });

  var previousAgeUpV1835 = window.ageUp || (typeof ageUp === "function" ? ageUp : null);
  if (previousAgeUpV1835 && !previousAgeUpV1835.__v1835IndustryWrapped) {
    window.ageUp = function () {
      var beforeState = safeState();
      var beforeJob = beforeState.job ? Object.assign({}, beforeState.job) : null;
      var beforeCurrent = beforeJob ? careerByCurrentJob(beforeState) : null;
      var beforeCategory = beforeCurrent ? careerCategory(beforeCurrent) : (beforeJob ? currentIndustryCategory(beforeState) : "");
      var beforeAge = Number(beforeState.age) || 0;
      var result = previousAgeUpV1835.apply(this, arguments);
      var afterState = safeState();
      var afterAge = Number(afterState.age) || 0;
      if (beforeJob && beforeCategory && afterAge > beforeAge) {
        recordIndustryYear(beforeCategory, beforeJob.title || "");
        var years = industryExperienceYears(beforeCategory, afterState);
        var chance = years >= 20 ? .45 : years >= 15 ? .34 : years >= 10 ? .24 : years >= 5 ? .14 : 0;
        if (chance && Math.random() < chance) createCompetitorOfferV1835(false);
        else {
          try { if (typeof save === "function") save(); } catch (e) {}
        }
      }
      return result;
    };
    window.ageUp.__v1835IndustryWrapped = true;
    try { ageUp = window.ageUp; } catch (e) {}
  }

  var previousCalcGPA = window.calcGPA || (typeof calcGPA === "function" ? calcGPA : null);
  if (previousCalcGPA && !previousCalcGPA.__v1835IqWrapped) {
    window.calcGPA = function () {
      return adjustedGpaForIq(previousCalcGPA.apply(this, arguments));
    };
    window.calcGPA.__v1835IqWrapped = true;
    try { calcGPA = window.calcGPA; } catch (e) {}
  }

  var previousSkipGrade = window.skipGrade || (typeof skipGrade === "function" ? skipGrade : null);
  if (previousSkipGrade && !previousSkipGrade.__v1835PathWrapped) {
    window.skipGrade = function () {
      var s = safeState();
      s.school = s.school || {};
      s.school.schoolChoices = s.school.schoolChoices || {};
      s.school.choicePrompted = s.school.choicePrompted || {};
      var beforeStage = schoolStageSafe();
      var beforeChoice = s.school.schoolChoices[beforeStage] || (s.school.path || "");
      var result = previousSkipGrade.apply(this, arguments);
      var afterStage = schoolStageSafe();
      if (beforeChoice && beforeStage !== afterStage) {
        var supported = false;
        try {
          supported = (schoolTypeOptions || []).some(function (opt) {
            return opt && opt.id === beforeChoice && opt.stages && opt.stages.indexOf(afterStage) >= 0;
          });
        } catch (e) {}
        if (supported) s.school.schoolChoices[afterStage] = beforeChoice;
        s.school.choicePrompted[afterStage] = true;
        try { if (typeof save === "function") save(); } catch (e2) {}
        if (isSchoolHub(currentHubId()) && typeof window.renderHubInPlaceV16 === "function") {
          window.renderHubInPlaceV16("school", captureSchoolScroll());
        } else {
          try { if (typeof render === "function") render(); } catch (e3) {}
        }
      }
      return result;
    };
    window.skipGrade.__v1835PathWrapped = true;
    try { skipGrade = window.skipGrade; } catch (e) {}
  }

  var previousRenderSchoolPage = window.renderSchoolPage || (typeof renderSchoolPage === "function" ? renderSchoolPage : null);
  if (previousRenderSchoolPage) {
    window.renderSchoolPage = function () {
      if (currentSchoolPage() === "athletics") return renderSportsDesk();
      return previousRenderSchoolPage.apply(this, arguments);
    };
    try { renderSchoolPage = window.renderSchoolPage; } catch (e) {}
  }

  var previousApplyScholarships = window.applyScholarships || (typeof applyScholarships === "function" ? applyScholarships : null);
  if (previousApplyScholarships) {
    window.applyScholarships = function () {
      var earlyState = safeState();
      var earlyAge = Number(earlyState.age) || 0;
      if (earlyAge >= SCHOOL_MERIT_AGE && earlyAge < CAREER_PLANNING_AGE && !(earlyState.flags && earlyState.flags.inCollege)) {
        approveEarlyMeritAid();
        return;
      }
      var result = previousApplyScholarships.apply(this, arguments);
      try {
        var s = safeState();
        if (s.school) {
          var decision = scholarshipDecision();
          if (decision.status === "approved" || decision.status === "not_awarded") {
            s.school.scholarshipDecision = {
              status: decision.status,
              type: decision.type || "",
              annualAward: Number(decision.annualAward) || 0,
              fullRide: !!decision.fullRide,
              reason: decision.reason || "",
              age: Number(s.age) || 0
            };
            if (typeof save === "function") save();
            if (isSchoolHub(currentHubId()) && typeof window.renderHubInPlaceV16 === "function") {
              window.renderHubInPlaceV16("school", captureSchoolScroll());
            } else if (typeof render === "function") {
              render();
            }
          }
        }
      } catch (e) {}
      return result;
    };
    try { applyScholarships = window.applyScholarships; } catch (e) {}
  }

  var previousScholarshipCoverage = window.scholarshipCoverageForSchool || (typeof scholarshipCoverageForSchool === "function" ? scholarshipCoverageForSchool : null);
  window.scholarshipCoverageForSchool = function (school) {
    var base = 0;
    try { if (previousScholarshipCoverage) base = Number(previousScholarshipCoverage.apply(this, arguments)) || 0; } catch (e) {}
    var cost = Number((school || {}).cost) || 0;
    var s = safeState();
    var early = earlyMeritPackage();
    var offer = (s.school || {}).scholarshipOffer || null;
    var earlyAward = Math.max(Number(early.annualAward) || 0, Number(offer && offer.annualAward) || 0);
    if ((early.fullRide || (offer && offer.fullRide)) && (Number(s.age) || 0) >= SCHOOL_MERIT_AGE && (Number(s.age) || 0) <= 18) {
      return cost;
    }
    return Math.min(cost, Math.max(base, earlyAward));
  };
  try { scholarshipCoverageForSchool = window.scholarshipCoverageForSchool; } catch (e) {}

  var previousCanFundSchoolCost = window.canFundSchoolCost || (typeof canFundSchoolCost === "function" ? canFundSchoolCost : null);
  window.canFundSchoolCost = function (cost) {
    var amount = Math.max(0, Math.round(Number(cost) || 0));
    try { if (previousCanFundSchoolCost && previousCanFundSchoolCost.apply(this, arguments)) return true; } catch (e) {}
    var s = safeState();
    var finance = s.finance || {};
    var liquid = Math.max(0, Number(s.money) || 0) +
      Math.max(0, Number(s.savings) || 0) +
      Math.max(0, Number(finance.superSaver) || 0) +
      Math.max(0, Number(finance.brokerage) || 0) +
      Math.max(0, Number((s.parentFinances || {}).liquid) || 0);
    var early = earlyMeritPackage();
    var aid = early.fullRide ? amount : Math.max(0, Number(early.annualAward) || 0);
    return liquid + aid >= amount;
  };
  try { canFundSchoolCost = window.canFundSchoolCost; } catch (e) {}

  window.trainSportV1835 = trainSport;
  window.playSportGameV1835 = playSportGame;
  window.attendSportClinicV1835 = attendSportClinic;
  window.playSportTournamentV1835 = playSportTournament;
  window.tryVarsitySportV1835 = tryVarsitySport;
  window.tryCaptainSportV1835 = tryCaptainSport;
  window.attendPrepCampV1835 = attendPrepCamp;
  window.joinSchoolSportV1835 = joinSchoolSport;
  window.leaveSchoolSportV1835 = leaveSchoolSport;

  var previousJoinClubForSportCap = window.joinClub || (typeof joinClub === "function" ? joinClub : null);
  if (previousJoinClubForSportCap && !previousJoinClubForSportCap.__v1835SportCapWrapped) {
    window.joinClub = function (id) {
      var club = sportById(id);
      var s = safeState();
      if (club && club.sport && Array.isArray(s.clubs) && s.clubs.indexOf(id) < 0 && joinedSports().length >= SPORT_LIMIT_V1835) {
        logSport("You can only carry three school sports at a time.");
        return;
      }
      return previousJoinClubForSportCap.apply(this, arguments);
    };
    window.joinClub.__v1835SportCapWrapped = true;
    try { joinClub = window.joinClub; } catch (e) {}
  }

  var previousRecruitingShowcase = window.attendRecruitingShowcase || (typeof attendRecruitingShowcase === "function" ? attendRecruitingShowcase : null);
  window.attendRecruitingShowcase = function () {
    var s = safeState();
    s.school = s.school || {};
    s.finance = s.finance || {};
    s.actionsTaken = s.actionsTaken || {};
    var age = Number(s.age) || 0;
    if (age < 14 || age > 22) return logSport("Recruiting showcases matter most from 14 to 22.");
    if ((Number(s.money) || 0) < 500) return logSport("Showcase travel and fees cost $500.");
    if (s.actionsTaken.v1835RecruitingShowcase) return logSport("You already did a recruiting showcase this year.");
    var sports = activeSports();
    if (!sports.length) return logSport("Join an active sport before a showcase matters.");
    s.money -= 500;
    s.actionsTaken.v1835RecruitingShowcase = true;
    var projection = athleticProjection();
    var visibilityGain = Math.max(6, Math.round((Number(projection.score) || 0) / 15));
    sports.forEach(function (club) {
      var record = sportRecord(club.id);
      record.visibility += visibilityGain + (record.varsity ? 2 : 0) + sportLeadershipIndex(record);
      record.showcases = (record.showcases || 0) + 1;
    });
    var recruitValue = Math.round(((Number(projection.score) || 0) * 420) + visibilityGain * 850 + sports.length * 1200);
    s.school.recruitingValue = Math.max(Number(s.school.recruitingValue) || 0, recruitValue);
    if (age >= 16 && (Number(projection.score) || 0) >= 78) {
      s.finance.nilDeals = Math.max(Number(s.finance.nilDeals) || 0, Math.round(recruitValue * 0.18));
    }
    if (projection.annualAward > 0 || projection.fullRide) {
      s.school.scholarshipOffer = {
        type: "Athletic Scholarship",
        annualAward: projection.annualAward,
        fullRide: !!projection.fullRide,
        reason: projection.reason || "Showcase improved your recruit profile.",
        ageAwarded: age
      };
      s.school.scholarshipAward = projection.fullRide ? 999999 : Math.max(Number(s.school.scholarshipAward) || 0, Number(projection.annualAward) || 0);
    }
    var deltas = { popularity: 3, confidence: 3, stress: 1 };
    runDeltas(deltas);
    logSport("Recruiting showcase raised your athlete profile. Recruiting value now " + moneyText(s.school.recruitingValue) + ".", Object.assign({ money: -500 }, deltas));
    saveAndRenderSchool();
  };
  window.attendRecruitingShowcase.__v1835Showcase = true;
  try { attendRecruitingShowcase = window.attendRecruitingShowcase; } catch (e) {}
  var previousRenderAthletics = window.renderAthleticsRecruitingPageV6 || (typeof renderAthleticsRecruitingPageV6 === "function" ? renderAthleticsRecruitingPageV6 : null);
  window.renderAthleticsRecruitingPageV6 = function () {
    var legacy = previousRenderAthletics ? previousRenderAthletics.apply(this, arguments) || "" : "";
    legacy = String(legacy)
      .replace(/<section class="panel"><div class="section-label">[^<]*Join \/ Train Sports[\s\S]*?<\/section>/, "")
      .replace(/<section class="panel"><div class="section-label">[^<]*Join Sports[\s\S]*?<\/section>/, "");
    return renderSportsDesk() + legacy;
  };
  try { renderAthleticsRecruitingPageV6 = window.renderAthleticsRecruitingPageV6; } catch (e) {}

  var previousRender = window.render || (typeof render === "function" ? render : null);
  if (previousRender) {
    window.render = function () {
      var hub = currentHubId();
      var pos = isSchoolHub(hub) ? captureSchoolScroll() : (isCareerHub(hub) ? captureCareerScroll() : null);
      var result = previousRender.apply(this, arguments);
      if (pos && isSchoolHub(pos.hubId)) restoreSchoolScroll(pos);
      if (pos && isCareerHub(pos.hubId)) restoreCareerScroll(pos);
      return result;
    };
    try { render = window.render; } catch (e) {}
  }

  if (typeof document !== "undefined" && document.createElement && document.head) {
    var style = document.createElement("style");
    style.textContent = [
      ".hub-sheet-school .v1822-merit-note{margin-top:14px!important;margin-bottom:14px!important}",
      ".hub-sheet-school .v1835-scholarship-status.approved{border-color:rgba(185,220,138,.52)!important;background:linear-gradient(135deg,rgba(28,54,31,.94),rgba(35,29,20,.96))!important}",
      ".hub-sheet-school .v1835-scholarship-status.missed{border-color:rgba(233,146,125,.50)!important;background:linear-gradient(135deg,rgba(54,29,25,.94),rgba(35,29,20,.96))!important}",
      ".hub-sheet-school .v1835-scholarship-status.locked{border-color:rgba(126,160,172,.42)!important;background:linear-gradient(135deg,rgba(24,38,42,.92),rgba(35,29,20,.96))!important}",
      ".v1835-aid-chip-row{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}.v1835-aid-chip-row span{border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(255,255,255,.05);padding:5px 8px;color:#d6c5aa;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.2}",
      ".v1835-job-card.industry{border-color:rgba(126,160,172,.50);background:linear-gradient(135deg,rgba(24,42,46,.82),rgba(35,29,20,.96))}.v1835-industry-ribbon{margin:9px 0 2px;border:1px solid rgba(126,160,172,.38);border-radius:999px;background:rgba(126,160,172,.12);padding:6px 8px;color:#bee8f3;font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.05em;text-transform:uppercase;line-height:1.25;overflow-wrap:anywhere}.v1835-career-pipeline-card.poach{border-color:rgba(240,202,123,.56);background:linear-gradient(135deg,rgba(65,49,24,.86),rgba(24,42,46,.82))}",
      ".hub-sheet-school .v1827-degree-center,.hub-sheet-school .v1825-degree-desk{margin-top:18px!important}",
      ".hub-sheet-school .school-hero + .school-subnav{margin-bottom:12px;overflow-x:auto!important;display:flex!important;gap:8px!important;padding-bottom:6px!important;scrollbar-color:rgba(216,177,110,.65) rgba(255,255,255,.05)!important}.hub-sheet-school .school-subnav button{white-space:nowrap!important;flex:0 0 auto!important}",
      ".v1835-athletics-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:9px;margin-top:10px}.v1835-athletics-grid>div,.v1835-sport-card{border:1px solid rgba(255,255,255,.11);border-radius:12px;background:rgba(255,255,255,.045);padding:11px;min-width:0}.v1835-athletics-grid>div{min-height:118px;max-height:188px;overflow:auto;scrollbar-color:rgba(216,177,110,.55) rgba(255,255,255,.04)}.v1835-athletics-grid span{display:block;color:#d8b16e;font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase}.v1835-athletics-grid b{display:block;color:#fff3df;font-size:22px;margin-top:4px}.v1835-athletics-grid em{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.45;font-style:normal;margin-top:4px;max-height:76px;overflow:auto}.v1835-sport-scroll-rail,.v1835-school-stage-rail{display:flex;gap:8px;overflow-x:auto;padding:4px 0 12px;margin:6px 0 2px;scrollbar-color:rgba(216,177,110,.65) rgba(255,255,255,.05)}.v1835-stage-chip{flex:0 0 auto;border:1px solid rgba(216,177,110,.28);border-radius:999px;padding:7px 10px;background:rgba(255,255,255,.045);font-family:'JetBrains Mono',monospace;font-size:10px;color:#d6c5aa}.v1835-stage-chip b{display:inline-block;margin-right:7px;color:#f0ca7b;text-transform:uppercase;letter-spacing:.12em;font-size:9px}.v1835-school-stage{flex:0 0 190px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:rgba(255,255,255,.045);padding:10px}.v1835-school-stage.active{border-color:rgba(240,202,123,.62);background:linear-gradient(135deg,rgba(80,61,33,.82),rgba(35,29,20,.95))}.v1835-school-stage span{display:block;color:#d8b16e;font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase}.v1835-school-stage b{display:block;color:#fff3df;margin-top:5px;font-size:14px}.v1835-iq-dynamics{border-color:rgba(126,160,172,.42)!important;background:linear-gradient(135deg,rgba(23,42,45,.92),rgba(35,29,20,.96))!important}.v1835-sports-brief{border-color:rgba(126,160,172,.38)!important;background:linear-gradient(135deg,rgba(23,42,45,.92),rgba(35,29,20,.96))!important}.v1835-sports-panel{display:grid;gap:9px;max-height:460px;overflow:auto;scrollbar-color:rgba(216,177,110,.65) rgba(255,255,255,.05)}.v1835-sport-card.active{border-color:rgba(185,220,138,.48);background:linear-gradient(135deg,rgba(28,48,31,.88),rgba(35,29,20,.94))}.v1835-sport-name{font-weight:900;color:#fff1dc;font-size:15px}.v1835-sport-desc{margin-top:5px;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.45}.v1835-sport-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}.v1835-sport-actions .icon-btn{white-space:normal;min-width:92px;flex:0 1 auto}.v1835-bench-list{display:flex;gap:8px;overflow-x:auto;padding:8px 0}.v1835-bench-chip{flex:0 0 auto;border:1px solid rgba(233,146,125,.30);border-radius:999px;padding:7px 8px;background:rgba(70,35,30,.30);display:flex;align-items:center;gap:8px}.v1835-bench-chip span{font-family:'JetBrains Mono',monospace;font-size:10px;color:#d6c5aa}",
      ".v1835-career-desk{display:grid;gap:14px;min-width:0;overflow:hidden;padding-bottom:86px}.v1835-career-desk .panel{min-width:0;overflow:hidden}.v1835-career-topline{display:flex!important;align-items:center;justify-content:space-between;gap:18px;border-color:rgba(126,160,172,.42)!important;background:linear-gradient(135deg,rgba(24,42,46,.94),rgba(35,29,20,.96))!important}.v1835-career-topline h2{margin:4px 0 6px;color:#fff3df;font-size:34px;line-height:1}.v1835-career-topline p{margin:0;color:#c9bda7;font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.45}.v1835-career-score{min-width:118px;text-align:right}.v1835-career-score b{display:block;color:#f0ca7b;font-size:36px;line-height:1}.v1835-career-score span{font-family:'JetBrains Mono',monospace;font-size:10px;text-transform:uppercase;letter-spacing:.16em;color:#b9a98e}.v1835-career-hero{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;border:1px solid rgba(255,255,255,.10);border-radius:12px;background:rgba(255,255,255,.045);padding:14px;min-width:0}.v1835-career-hero>div{min-width:0}.v1835-career-hero b{display:block;color:#fff3df;font-size:24px;line-height:1.1;overflow-wrap:anywhere}.v1835-career-hero span{display:block;color:#c9bda7;font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.45;margin-top:4px;overflow-wrap:anywhere}.v1835-career-hero strong{color:#f0ca7b;font-size:28px;white-space:nowrap}.v1835-career-metrics{display:flex;gap:9px;margin-top:10px;overflow-x:auto;overflow-y:hidden;padding:2px 0 12px;scrollbar-color:rgba(216,177,110,.75) rgba(255,255,255,.05);scrollbar-width:thin}.v1835-career-metrics>div{flex:0 0 245px;border:1px solid rgba(255,255,255,.11);border-radius:12px;background:rgba(255,255,255,.04);padding:11px;min-height:105px;box-sizing:border-box}.v1835-career-metrics span,.v1835-job-card-head span,.v1835-career-controls span{display:block;color:#d8b16e;font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase}.v1835-career-metrics b{display:block;color:#fff3df;font-size:19px;margin-top:5px}.v1835-career-metrics b.good{color:#b9dc8a}.v1835-career-metrics b.gold{color:#f0ca7b}.v1835-career-metrics em{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.4;font-style:normal;margin-top:5px;overflow-wrap:anywhere}.v1835-career-actions,.v1835-career-card-actions,.v1835-prep-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.v1835-ladder-rail{display:flex;gap:10px;overflow-x:auto;overflow-y:hidden;padding:4px 0 14px;scrollbar-color:rgba(216,177,110,.75) rgba(255,255,255,.05);scrollbar-width:thin}.v1835-ladder-rung{flex:0 0 190px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:rgba(255,255,255,.04);padding:11px}.v1835-ladder-rung.current{border-color:rgba(240,202,123,.68);background:linear-gradient(135deg,rgba(80,61,33,.82),rgba(35,29,20,.95))}.v1835-ladder-rung.reached{border-color:rgba(185,220,138,.36)}.v1835-ladder-rung span{display:block;color:#d8b16e;font-family:'JetBrains Mono',monospace;font-size:9px;text-transform:uppercase;letter-spacing:.14em}.v1835-ladder-rung b{display:block;color:#fff3df;margin-top:5px}.v1835-ladder-rung em{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.4;font-style:normal;margin-top:5px}.v1835-career-pipeline-card,.v1835-job-card{border:1px solid rgba(255,255,255,.12);border-radius:12px;background:rgba(255,255,255,.045);padding:12px;min-width:0}.v1835-career-pipeline-card.offer,.v1835-job-card.offer{border-color:rgba(185,220,138,.48);background:linear-gradient(135deg,rgba(28,48,31,.88),rgba(35,29,20,.94))}.v1835-job-card.current{border-color:rgba(240,202,123,.68)}.v1835-job-card.locked{opacity:.72}.v1835-career-pipeline-card b{display:block;color:#fff3df}.v1835-career-pipeline-card span{display:block;color:#c9bda7;font-family:'JetBrains Mono',monospace;font-size:10px;margin-top:4px}.v1835-career-market-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:10px}.v1835-career-market-head b{display:block;color:#fff3df;font-size:20px}.v1835-career-market-head span,.v1835-career-market-head em,.v1835-career-note{color:#c9bda7;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.45;font-style:normal}.v1835-career-controls{display:flex;gap:9px;margin:10px 0;overflow-x:auto;overflow-y:hidden;padding-bottom:10px;scrollbar-color:rgba(216,177,110,.75) rgba(255,255,255,.05);scrollbar-width:thin}.v1835-career-controls label{flex:0 0 240px;min-width:0}.v1835-career-controls label:nth-child(2){flex-basis:340px}.v1835-career-controls select,.v1835-career-controls input{width:100%;box-sizing:border-box;border:1px solid rgba(216,177,110,.34);border-radius:9px;background:#120e0a;color:#fff3df;padding:10px 11px;font-family:'JetBrains Mono',monospace;font-size:11px}.v1835-career-count{flex:0 0 110px;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:rgba(255,255,255,.045);padding:8px 10px;text-align:right;box-sizing:border-box}.v1835-career-count b{display:block;color:#f0ca7b;font-size:20px}.v1835-career-count span{font-family:'JetBrains Mono',monospace;font-size:9px;color:#b9a98e}.v1835-job-grid{display:flex;gap:10px;overflow-x:auto;overflow-y:hidden;padding:2px 4px 16px 0;scrollbar-color:rgba(216,177,110,.78) rgba(255,255,255,.05);scrollbar-width:thin}.v1835-job-card{flex:0 0 240px;box-sizing:border-box}.v1835-job-card-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.v1835-job-card-head b{display:block;color:#fff3df;font-size:17px;line-height:1.15;margin-top:4px;overflow-wrap:anywhere}.v1835-job-card-head em{font-family:'JetBrains Mono',monospace;font-size:9px;color:#f0ca7b;text-transform:uppercase;letter-spacing:.11em;font-style:normal;white-space:nowrap}.v1835-job-card p{color:#c9bda7;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.45;margin:9px 0;overflow-wrap:anywhere}.v1835-career-chip-row{display:flex;flex-wrap:wrap;gap:6px}.v1835-career-chip-row span{border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(255,255,255,.05);padding:5px 7px;color:#d6c5aa;font-family:'JetBrains Mono',monospace;font-size:9px;line-height:1.2}.v1835-career-note.locked{border-color:rgba(233,146,125,.38)!important;background:rgba(70,35,30,.25)!important}.v1835-career-metrics::-webkit-scrollbar,.v1835-ladder-rail::-webkit-scrollbar,.v1835-job-grid::-webkit-scrollbar,.v1835-career-controls::-webkit-scrollbar{height:10px}.v1835-career-metrics::-webkit-scrollbar-thumb,.v1835-ladder-rail::-webkit-scrollbar-thumb,.v1835-job-grid::-webkit-scrollbar-thumb,.v1835-career-controls::-webkit-scrollbar-thumb{background:rgba(216,177,110,.72);border-radius:999px}.v1835-career-metrics::-webkit-scrollbar-track,.v1835-ladder-rail::-webkit-scrollbar-track,.v1835-job-grid::-webkit-scrollbar-track,.v1835-career-controls::-webkit-scrollbar-track{background:rgba(255,255,255,.05);border-radius:999px}@media(max-width:760px){.v1835-career-topline,.v1835-career-hero,.v1835-career-market-head{display:block!important}.v1835-career-score,.v1835-career-hero strong{text-align:left;margin-top:10px}.v1835-career-controls label{flex-basis:210px}.v1835-career-controls label:nth-child(2){flex-basis:260px}.v1835-job-card{flex-basis:220px}.v1835-career-metrics>div{flex-basis:220px}}"
    ].join("\n");
    document.head.appendChild(style);
  }

  if (window.registerLedgerSystem) {
    window.registerLedgerSystem({
      id: "education-career",
      file: "pages/systems/education-career.js",
      status: "active",
      globals: ["renderSchool", "renderSchoolPage", "setSchoolPage", "applyScholarships", "joinSchoolSportV1835", "leaveSchoolSportV1835", "trainSportV1835", "playSportGameV1835", "attendSportClinicV1835", "playSportTournamentV1835", "tryVarsitySportV1835", "tryCaptainSportV1835", "setCareerFilterV1835", "applyCareerJobV1835", "negotiateContractV1835", "scoutCompetitorOfferV1835", "askPromotion"],
      notes: "Orders School hub content, shows scholarship decisions, adds playable school athletics, restores a single Career desk with search/category/salary sort, gates promotions by tenure, tracks industry experience, creates competitor poach offers, and preserves School/Career scroll."
    });
  }
})();
