/* People and family system v18.42: richer family life, dating, children, and social play. */
/* Old saves migrate lazily here so existing families gain gender, pronouns, child profiles, and dating state without a reset. */
(function () {
  if (window.__ledgerPeopleFamilyV1842Loaded) return;
  window.__ledgerPeopleFamilyV1842Loaded = true;

  var previousRenderPeopleV1842 = window.renderPeople || (typeof renderPeople === "function" ? renderPeople : null);
  var previousRelationActionV1842 = window.relationAction || (typeof relationAction === "function" ? relationAction : null);
  var previousFamilyActionV1842 = window.familyAction || (typeof familyAction === "function" ? familyAction : null);
  var previousFindDateV1842 = window.findDate || (typeof findDate === "function" ? findDate : null);
  var previousDateActionV1842 = window.dateAction || (typeof dateAction === "function" ? dateAction : null);
  var previousAddChildV1842 = window.addChild || (typeof addChild === "function" ? addChild : null);

  var ORIENTATIONS = {
    straight: { label: "Straight", desc: "Dating pool is the opposite gender." },
    gay: { label: "Gay", desc: "Dating pool is the same gender." },
    bi: { label: "Bisexual", desc: "Dating pool includes men and women." }
  };

  var CHILDCARE = {
    family: { label: "Family Help", cost: 2500, mood: 2, trust: 2, desc: "Relatives help out. Cheap, warm, but inconsistent." },
    standard: { label: "Standard Childcare", cost: 9000, mood: 3, trust: 1, desc: "Reliable school-day support and lower chaos." },
    enrichment: { label: "Private Enrichment", cost: 18000, mood: 4, smarts: 4, confidence: 3, desc: "Tutors, hobbies, trips, and structured attention." },
    nanny: { label: "Nanny + Activities", cost: 32000, mood: 6, smarts: 3, health: 3, desc: "High-touch care with sports, reading, and routine." }
  };

  var CHILD_ACTIVITIES = {
    read: { label: "Read Together", cost: 0, limit: 4, mood: 4, bond: 4, trust: 2, smarts: 2, desc: "Quiet attention. Good for young kids and trust." },
    study: { label: "Reading Routine", cost: 0, limit: 5, mood: -1, bond: 1, trust: 1, smarts: 4, discipline: 3, desc: "Structured reading and homework. Strong growth, less fun." },
    sports: { label: "Practice Sport", cost: 90, limit: 4, mood: 3, bond: 3, health: 4, confidence: 2, desc: "Play, movement, confidence, and family memories." },
    tutor: { label: "Tutor", cost: 240, limit: 3, mood: -1, bond: 1, trust: 2, smarts: 5, discipline: 3, desc: "Academic help. Powerful, but not always fun." },
    hobby: { label: "Hobby Day", cost: 120, limit: 3, mood: 5, bond: 3, confidence: 4, desc: "Music, art, coding, games, cooking, or a niche interest." },
    checkup: { label: "Health Check", cost: 160, limit: 2, mood: 1, trust: 1, health: 6, desc: "Medical, dental, or mental-health maintenance." },
    family_day: { label: "Family Day", cost: 180, limit: 3, mood: 7, bond: 6, trust: 3, desc: "A real day together, not just another button." }
  };

  var RELATION_ACTIONS = {
    talk: { label: "Talk", cost: 0, limit: 6, bond: 3, trust: 2, deltas: { happiness: 2, stress: -2 }, desc: "A normal check-in. This can happen more than once a year." },
    gift: { label: "Gift", cost: 120, limit: 3, bond: 6, trust: 1, deltas: { happiness: 1 }, desc: "Small but thoughtful." },
    bigGift: { label: "Big Gift", cost: 500, limit: 2, bond: 12, trust: 2, deltas: { happiness: 2 }, desc: "Expensive love. Useful, but not a personality." },
    apologize: { label: "Apologize", cost: 0, limit: 3, bond: 4, trust: 7, deltas: { stress: -2 }, desc: "Repair trust after tension." },
    argue: { label: "Argue", cost: 0, limit: 3, bond: -7, trust: -4, deltas: { stress: 5, confidence: 1 }, desc: "Sometimes needed, usually messy." }
  };

  var DATING_ACTIONS = {
    message: { label: "Message", cost: 0, limit: 4, bond: 4, trust: 2, chemistry: 2, deltas: { happiness: 1 }, desc: "Low pressure, low cost." },
    coffee: { label: "Coffee", cost: 25, limit: 3, bond: 6, trust: 3, chemistry: 5, deltas: { happiness: 2, stress: -1 }, desc: "A casual date that reveals the vibe." },
    dinner: { label: "Dinner", cost: 85, limit: 3, bond: 9, trust: 4, chemistry: 8, deltas: { happiness: 4 }, desc: "More serious time together." },
    weekend: { label: "Weekend", cost: 650, limit: 1, bond: 16, trust: 8, chemistry: 10, deltas: { happiness: 8, stress: -4 }, desc: "Big step. Great when there is already chemistry." }
  };

  var SOCIAL_ACTIVITIES = {
    checkin: { label: "Quick Check-in", cost: 0, limit: 8, target: "any", bond: 2, trust: 2, deltas: { happiness: 2, stress: -2 }, desc: "Text, call, or sit with someone for a normal human moment." },
    dinner: { label: "Family Dinner", cost: 75, limit: 4, target: "family", bond: 5, trust: 2, deltas: { happiness: 5, stress: -4 }, desc: "Food and time together. Steady bond, low drama." },
    games: { label: "Game Night", cost: 40, limit: 4, target: "any", bond: 4, trust: 1, deltas: { happiness: 4, stress: -6, popularity: 1 }, desc: "Cheap fun that makes people feel less like a menu." },
    community: { label: "Community Event", cost: 25, limit: 3, target: "all", bond: 1, trust: 1, deltas: { karma: 6, popularity: 4, happiness: 3 }, desc: "Volunteer, network, meet people, or show up publicly." },
    party: { label: "Party Night", cost: 120, limit: 3, target: "friends", bond: 3, trust: 0, deltas: { happiness: 8, popularity: 6, stress: -10, health: -1, discipline: -2 }, desc: "Fun and social, but it has a cost." },
    newfriend: { label: "Meet New Friend", cost: 30, limit: 4, target: "new", bond: 0, trust: 0, deltas: { happiness: 4, popularity: 3, confidence: 2 }, desc: "Adds a new social contact." }
  };

  var PARTNER_ACTIVITIES = {
    checkin: { label: "Check-in", cost: 0, limit: 6, bond: 3, trust: 3, chemistry: 1, deltas: { happiness: 2, stress: -2 }, desc: "A real conversation about the day." },
    dinner: { label: "Dinner Date", cost: 120, limit: 3, bond: 7, trust: 3, chemistry: 5, deltas: { happiness: 5, stress: -3 }, desc: "Food, time, and a little romance." },
    movie: { label: "Movie Night", cost: 45, limit: 4, bond: 5, trust: 1, chemistry: 3, deltas: { happiness: 4, stress: -4 }, desc: "Low-pressure time together." },
    vacation: { label: "Private Vacation", cost: 1500, limit: 1, bond: 14, trust: 6, chemistry: 9, deltas: { happiness: 12, stress: -12 }, desc: "Big reset for the relationship." }
  };

  var PARENT_ACTIVITIES = {
    call: { label: "Call Home", cost: 0, limit: 6, bond: 3, trust: 2, deltas: { happiness: 1, stress: -1 }, desc: "Stay close without making a trip." },
    visit: { label: "Visit", cost: 90, limit: 3, bond: 7, trust: 3, deltas: { happiness: 4, stress: -2 }, desc: "Show up in person." },
    advice: { label: "Ask Advice", cost: 0, limit: 4, bond: 2, trust: 4, deltas: { discipline: 1, stress: -2 }, desc: "Family wisdom, even when imperfect." },
    help: { label: "Ask Help", cost: 0, limit: 2, bond: -2, trust: -4, deltas: { stress: 2 }, desc: "Financial help is only available through age 25." }
  };

  var FRIEND_ACTIVITIES = {
    checkin: { label: "Check-in", cost: 0, limit: 6, bond: 3, trust: 2, deltas: { happiness: 2, stress: -2 }, desc: "Text, call, or meet for a quick reset." },
    hangout: { label: "Hangout", cost: 35, limit: 4, bond: 5, trust: 1, deltas: { happiness: 4, stress: -4 }, desc: "Easy time with your people." },
    movie: { label: "Movie / Cafe", cost: 55, limit: 3, bond: 6, trust: 2, deltas: { happiness: 5, stress: -3 }, desc: "Simple plans that keep the bond warm." },
    nightout: { label: "Night Out", cost: 140, limit: 2, bond: 6, trust: 0, deltas: { happiness: 8, popularity: 4, stress: -8, health: -1 }, desc: "Fun, louder, and a little risky." }
  };

  var CHILD_INTERESTS = ["sports", "music", "science", "art", "reading", "games", "fashion", "animals", "business", "coding", "cooking", "theater"];
  var RELATION_TAGS = ["warm", "funny", "quiet", "ambitious", "loyal", "dramatic", "curious", "creative", "protective", "independent"];
  var DATE_VIBES = ["calm", "ambitious", "funny", "stylish", "bookish", "athletic", "creative", "family-minded", "career-focused", "adventurous"];

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch];
    });
  }

  function n(value, fallback) {
    var num = Number(value);
    return Number.isFinite(num) ? num : (fallback || 0);
  }

  function round(value) {
    return Math.round(n(value));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, n(value)));
  }

  function pick(list) {
    list = Array.isArray(list) && list.length ? list : [""];
    return list[Math.floor(Math.random() * list.length)];
  }

  function randomInt(min, max) {
    min = Math.ceil(n(min));
    max = Math.floor(n(max));
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function chanceLocal(p) {
    try { if (typeof chance === "function") return chance(p); } catch (e) {}
    return Math.random() < n(p);
  }

  function stateNow() {
    try { if (typeof state !== "undefined" && state) return state; } catch (e) {}
    return window.state || {};
  }

  function moneyText(value) {
    try { if (typeof money === "function") return money(round(value)); } catch (e) {}
    return "$" + round(value).toLocaleString();
  }

  function compactMoney(value) {
    value = round(value);
    var abs = Math.abs(value);
    var sign = value < 0 ? "-" : "";
    if (abs >= 1000000000) return sign + "$" + (abs / 1000000000).toFixed(abs >= 10000000 ? 1 : 2).replace(/\.0+$/, "") + "B";
    if (abs >= 1000000) return sign + "$" + (abs / 1000000).toFixed(abs >= 10000000 ? 1 : 2).replace(/\.0+$/, "") + "M";
    if (abs >= 1000) return sign + "$" + (abs / 1000).toFixed(abs >= 10000 ? 1 : 2).replace(/\.0+$/, "") + "K";
    return moneyText(value);
  }

  function capText(value) {
    value = String(value || "");
    try { if (typeof cap === "function") return cap(value); } catch (e) {}
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
  }

  function toast(message) {
    try { if (typeof addToast === "function") return addToast(message); } catch (e) {}
    try { if (typeof addLog === "function") return addLog(message, {}); } catch (e2) {}
  }

  function log(message, deltas) {
    try { if (typeof addLog === "function") return addLog(message, deltas || {}); } catch (e) {}
    return toast(message);
  }

  function apply(deltas) {
    deltas = deltas || {};
    var statDeltas = Object.assign({}, deltas);
    delete statDeltas.money;
    try { if (typeof applyDeltas === "function") return applyDeltas(statDeltas); } catch (e) {}
    var s = stateNow();
    Object.keys(statDeltas).forEach(function (key) {
      if (s.stats && key in s.stats) s.stats[key] = clamp(n(s.stats[key]) + n(statDeltas[key]), 0, key === "iq" ? 220 : 100);
    });
  }

  function saveRender() {
    try { if (typeof save === "function") save(); } catch (e) {}
    try { if (typeof window.renderHubInPlaceV16 === "function") return window.renderHubInPlaceV16("people"); } catch (e2) {}
    try { if (typeof render === "function") render(); } catch (e3) {}
  }

  function playerGender() {
    var s = stateNow();
    var raw = String(s.gender || s.sex || "").toLowerCase();
    if (raw === "m" || raw === "man" || raw === "boy") return "male";
    if (raw === "f" || raw === "woman" || raw === "girl") return "female";
    if (raw === "nonbinary" || raw === "nb") return "nonbinary";
    return raw || "unknown";
  }

  function inferGenderFromName(name) {
    var first = String(name || "").split(/\s+/)[0].toLowerCase();
    try {
      if (typeof names !== "undefined" && names) {
        if (Array.isArray(names.male) && names.male.map(function (x) { return String(x).toLowerCase(); }).indexOf(first) >= 0) return "male";
        if (Array.isArray(names.female) && names.female.map(function (x) { return String(x).toLowerCase(); }).indexOf(first) >= 0) return "female";
      }
    } catch (e) {}
    if (/a$|ia$|na$|la$|elle$|lyn$|yra$|lila$|maeve$/i.test(first)) return "female";
    if (/o$|er$|son$|as$|ix$|liam$|felix$/i.test(first)) return "male";
    return chanceLocal(.5) ? "female" : "male";
  }

  function genderLabel(person) {
    var g = String((person && person.gender) || "unknown").toLowerCase();
    var child = person && person.role === "Child";
    if (g === "male") return child ? "Boy" : "Man";
    if (g === "female") return child ? "Girl" : "Woman";
    if (g === "nonbinary") return "Nonbinary";
    return "Gender not set";
  }

  function pronounsFor(gender) {
    gender = String(gender || "").toLowerCase();
    if (gender === "male") return "he/him";
    if (gender === "female") return "she/her";
    if (gender === "nonbinary") return "they/them";
    return "they/them";
  }

  function relationshipEntries() {
    var s = ensurePeopleState();
    return Object.keys(s.relationships || {}).map(function (key) {
      return [key, s.relationships[key]];
    }).filter(function (pair) { return pair[1] && pair[1].role !== "Crush"; });
  }

  function childEntries() {
    return relationshipEntries().filter(function (pair) { return pair[1] && pair[1].role === "Child"; });
  }

  function crushEntries() {
    var s = ensurePeopleState();
    return Object.keys(s.relationships || {}).map(function (key) {
      return [key, s.relationships[key]];
    }).filter(function (pair) { return pair[1] && pair[1].role === "Crush" && pair[1].alive !== false; });
  }

  function familyEntries() {
    return relationshipEntries().filter(function (pair) {
      return ["Mother", "Father", "Parent", "Sibling", "Older Sibling", "Younger Sibling", "Child", "Partner", "Spouse"].indexOf(pair[1].role) >= 0;
    });
  }

  function partnerEntry() {
    var s = ensurePeopleState();
    if (s.relationships.partner && s.relationships.partner.alive !== false) return ["partner", s.relationships.partner];
    var found = relationshipEntries().find(function (pair) { return pair[1].role === "Partner" || pair[1].role === "Spouse"; });
    return found || null;
  }

  function ensurePerson(key, person) {
    if (!person || typeof person !== "object") return person;
    if (!person.name) person.name = capText(person.role || "Person");
    if (!person.role) person.role = "Friend";
    if (person.alive == null) person.alive = true;
    if (person.bond == null) person.bond = 50;
    if (person.trust == null) person.trust = 50;
    person.bond = clamp(person.bond, 0, 100);
    person.trust = clamp(person.trust, 0, 100);
    if (!person.gender || person.gender === "unknown") person.gender = inferGenderFromName(person.name);
    if (!person.pronouns) person.pronouns = pronounsFor(person.gender);
    if (!person.tags || !Array.isArray(person.tags)) person.tags = [pick(RELATION_TAGS), pick(RELATION_TAGS)].filter(function (v, idx, arr) { return v && arr.indexOf(v) === idx; });
    if (person.role === "Child") ensureChild(key, person);
    if (person.role === "Crush") ensureCrush(person);
    return person;
  }

  function ensureChild(key, child) {
    child.age = Math.max(0, round(child.age == null ? 0 : child.age));
    child.gender = child.gender || inferGenderFromName(child.name);
    child.pronouns = child.pronouns || pronounsFor(child.gender);
    if (!child.birthType) child.birthType = "family";
    if (!Array.isArray(child.interests) || !child.interests.length) {
      child.interests = [pick(CHILD_INTERESTS), pick(CHILD_INTERESTS)].filter(function (v, idx, arr) { return arr.indexOf(v) === idx; });
    }
    if (!child.profileV1842 || typeof child.profileV1842 !== "object") child.profileV1842 = {};
    var p = child.profileV1842;
    p.mood = clamp(p.mood == null ? n(child.mood, 72) : p.mood, 0, 100);
    p.security = clamp(p.security == null ? Math.round((n(child.bond) + n(child.trust)) / 2) : p.security, 0, 100);
    p.school = p.school || schoolStage(child.age);
    p.lastFocus = p.lastFocus || "growing";
    p.needs = p.needs && typeof p.needs === "object" ? p.needs : {};
    p.needs.attention = clamp(p.needs.attention == null ? randomInt(35, 70) : p.needs.attention, 0, 100);
    p.needs.health = clamp(p.needs.health == null ? n(child.health, randomInt(70, 95)) : p.needs.health, 0, 100);
    p.needs.school = clamp(p.needs.school == null ? n(child.smarts, randomInt(55, 95)) : p.needs.school, 0, 100);
    child.smarts = clamp(child.smarts == null ? n(child.smart, p.needs.school) : child.smarts, 0, 120);
    child.confidence = clamp(child.confidence == null ? randomInt(45, 95) : child.confidence, 0, 120);
    child.health = clamp(child.health == null ? p.needs.health : child.health, 0, 120);
    child.discipline = clamp(child.discipline == null ? randomInt(35, 90) : child.discipline, 0, 120);
    return child;
  }

  function ensureCrush(crush) {
    crush.gender = crush.gender || inferGenderFromName(crush.name);
    crush.pronouns = crush.pronouns || pronounsFor(crush.gender);
    crush.chemistry = clamp(crush.chemistry == null ? randomInt(35, 80) : crush.chemistry, 0, 100);
    crush.values = clamp(crush.values == null ? randomInt(35, 90) : crush.values, 0, 100);
    crush.kindness = clamp(crush.kindness == null ? randomInt(35, 95) : crush.kindness, 0, 100);
    crush.intent = crush.intent || pick(["casual", "serious", "slow burn", "family minded", "career first"]);
    crush.tags = crush.tags && crush.tags.length ? crush.tags : [pick(DATE_VIBES), pick(DATE_VIBES)];
    return crush;
  }

  function schoolStage(age) {
    age = round(age);
    if (age < 3) return "Toddler";
    if (age < 5) return "Preschool";
    if (age < 11) return "Elementary";
    if (age < 14) return "Middle school";
    if (age < 18) return "High school";
    if (age < 23) return "College age";
    return "Adult child";
  }

  function ensurePeopleState() {
    try { if (typeof ensureStateShape === "function") ensureStateShape(); } catch (e) {}
    var s = stateNow();
    if (!window.state && s) window.state = s;
    if (!s.stats || typeof s.stats !== "object") s.stats = {};
    if (!s.flags || typeof s.flags !== "object") s.flags = {};
    if (!s.actionsTaken || typeof s.actionsTaken !== "object") s.actionsTaken = {};
    if (!s.relationships || typeof s.relationships !== "object" || Array.isArray(s.relationships)) s.relationships = {};
    if (!s.socialV1842 || typeof s.socialV1842 !== "object") s.socialV1842 = {};
    var social = s.socialV1842;
    if (!ORIENTATIONS[social.orientation]) social.orientation = "straight";
    if (!social.socialTarget) social.socialTarget = "all";
    if (!social.year || social.year !== round(s.age)) {
      social.year = round(s.age);
      social.counts = {};
      social.energyUsed = 0;
    }
    if (!social.counts || typeof social.counts !== "object") social.counts = {};
    social.energyMax = Math.max(8, round(social.energyMax || 12));
    social.energyUsed = clamp(social.energyUsed || 0, 0, social.energyMax);
    if (!social.family || typeof social.family !== "object") social.family = {};
    if (!CHILDCARE[social.family.childcare]) social.family.childcare = "family";
    if (!social.dating || typeof social.dating !== "object") social.dating = {};
    social.dating.searches = Math.max(0, round(social.dating.searches));
    Object.keys(s.relationships).forEach(function (key) { ensurePerson(key, s.relationships[key]); });
    if (Array.isArray(s.children)) {
      s.children.forEach(function (kid, index) {
        if (!kid) return;
        var key = kid.id || ("child_extra_" + index);
        if (!s.relationships[key]) s.relationships[key] = kid;
        s.relationships[key].role = "Child";
        ensurePerson(key, s.relationships[key]);
      });
    }
    if (!s.parentFinances || typeof s.parentFinances !== "object") {
      s.parentFinances = { income: 0, liquid: 0, netWorth: 0, givenThisYear: 0 };
    }
    return s;
  }

  function countKey(id) {
    ensurePeopleState();
    return String(id || "");
  }

  function getCount(id) {
    var social = ensurePeopleState().socialV1842;
    return round(social.counts[countKey(id)] || 0);
  }

  function useCount(id, limit, label, energy) {
    var s = ensurePeopleState();
    var social = s.socialV1842;
    id = countKey(id);
    limit = Math.max(1, round(limit || 1));
    energy = Math.max(0, round(energy == null ? 1 : energy));
    if (getCount(id) >= limit) {
      toast((label || "That action") + " is tapped out for this year.");
      return false;
    }
    if (energy && n(social.energyUsed) + energy > n(social.energyMax)) {
      toast("You are out of social energy this year.");
      return false;
    }
    social.counts[id] = getCount(id) + 1;
    social.energyUsed = clamp(n(social.energyUsed) + energy, 0, social.energyMax);
    return true;
  }

  function canSpend(cost) {
    if (n(stateNow().money) < n(cost)) {
      toast("You need " + compactMoney(cost) + " in checking.");
      return false;
    }
    return true;
  }

  function adjustRelation(person, bond, trust) {
    if (!person) return;
    person.bond = clamp(n(person.bond) + n(bond), 0, 100);
    person.trust = clamp(n(person.trust) + n(trust), 0, 100);
  }

  function adjustChemistry(person, amount) {
    if (!person) return;
    person.chemistry = clamp(n(person.chemistry, 55) + n(amount), 0, 100);
  }

  function parentMoneyOpen() {
    return round(stateNow().age) <= 25;
  }

  function relationshipMood(person) {
    var score = Math.round((n(person && person.bond) * .45) + (n(person && person.trust) * .35) + (n(person && person.chemistry, 55) * .2));
    if (score >= 88) return { label: "glowing", note: "Feeling loved, secure, and close.", kind: "good", score: score };
    if (score >= 72) return { label: "close", note: "Warm and available.", kind: "good", score: score };
    if (score >= 55) return { label: "steady", note: "Fine, but wants attention.", kind: "gold", score: score };
    if (score >= 38) return { label: "strained", note: "Needs repair before big asks.", kind: "bad", score: score };
    return { label: "distant", note: "Low trust and low warmth.", kind: "bad", score: score };
  }

  function relationshipAvailability(person) {
    var stress = n(stateNow().stats && stateNow().stats.stress);
    var trust = n(person && person.trust);
    var bond = n(person && person.bond);
    if (trust >= 78 && bond >= 75 && stress < 75) return { label: "open", note: "Good time for plans.", kind: "good" };
    if (stress >= 82) return { label: "tired", note: "Stress is crowding the relationship.", kind: "bad" };
    if (trust < 45 || bond < 45) return { label: "guarded", note: "Repair trust before pressure.", kind: "gold" };
    return { label: "available", note: "Small plans should land well.", kind: "blue" };
  }

  function relationshipChemistry(person) {
    var chemistry = round(n(person && person.chemistry, 55));
    if (chemistry >= 82) return { label: "spark", note: "Strong romantic pull.", kind: "good", score: chemistry };
    if (chemistry >= 62) return { label: "warm", note: "Attraction is healthy.", kind: "gold", score: chemistry };
    if (chemistry >= 42) return { label: "quiet", note: "Needs intentional time.", kind: "blue", score: chemistry };
    return { label: "cold", note: "Romance is fading.", kind: "bad", score: chemistry };
  }

  function socialTargetType(targetKey) {
    if (!targetKey || targetKey === "all") return "all";
    var person = ensurePeopleState().relationships[targetKey];
    if (!person) return "all";
    if (person.role === "Child") return "child";
    if (person.role === "Partner" || person.role === "Spouse") return "partner";
    if (["Mother", "Father", "Parent"].indexOf(person.role) >= 0) return "parent";
    return "friend";
  }

  function socialPlansForTarget(targetKey) {
    var type = socialTargetType(targetKey);
    if (type === "child") return CHILD_ACTIVITIES;
    if (type === "partner") return PARTNER_ACTIVITIES;
    if (type === "parent") return PARENT_ACTIVITIES;
    if (type === "friend") return FRIEND_ACTIVITIES;
    return SOCIAL_ACTIVITIES;
  }

  function planCostText(plan) {
    return plan && n(plan.cost) ? compactMoney(plan.cost) : "Free";
  }

  function randomFirst(gender) {
    try {
      if (typeof names !== "undefined" && names && Array.isArray(names[gender]) && names[gender].length) return pick(names[gender]);
    } catch (e) {}
    if (gender === "male") return pick(["Theo", "Felix", "Miles", "Julian", "Silas", "Noah", "Ari", "Wren"]);
    if (gender === "female") return pick(["Maeve", "Lila", "June", "Mira", "Avery", "Nora", "Sage", "Iris"]);
    return pick(["River", "Rowan", "Sage", "Quinn", "Avery", "Wren"]);
  }

  function randomLast() {
    try {
      if (typeof names !== "undefined" && names && Array.isArray(names.last) && names.last.length) return pick(names.last);
    } catch (e) {}
    var own = String(stateNow().name || "").split(/\s+/).pop();
    return own || pick(["Kovac", "Miller", "Brennan", "Sato", "Reed"]);
  }

  function randomFullName(gender, last) {
    return randomFirst(gender) + " " + (last || randomLast());
  }

  function datingGenderPool() {
    var pg = playerGender();
    var orientation = ensurePeopleState().socialV1842.orientation;
    if (orientation === "straight") return pg === "female" ? ["male"] : pg === "male" ? ["female"] : ["male", "female", "nonbinary"];
    if (orientation === "gay") return pg === "female" ? ["female"] : pg === "male" ? ["male"] : ["nonbinary"];
    if (orientation === "bi") return ["male", "female"];
    return ["male", "female"];
  }

  function datingAllowed() {
    var s = ensurePeopleState();
    return round(s.age) >= 14 && !partnerEntry();
  }

  function attractionLine() {
    var s = ensurePeopleState();
    var o = ORIENTATIONS[s.socialV1842.orientation] || ORIENTATIONS.straight;
    var pool = datingGenderPool().map(capText).join(", ");
    return o.label + " - pool: " + pool;
  }

  function createDatingProspect(method) {
    var s = ensurePeopleState();
    if (!datingAllowed()) return toast("Dating opens when you are single and old enough.");
    if (!useCount("dating_search_" + method, method === "app" ? 3 : 2, "Dating search", 1)) return;
    var genders = datingGenderPool();
    var gender = pick(genders);
    var ageSpread = round(s.age) < 18 ? randomInt(-1, 1) : randomInt(-4, 5);
    var age = Math.max(14, round(s.age) + ageSpread);
    var vibe = method === "app" ? "Dating app match" : method === "friends" ? "Friend setup" : method === "school" ? "School connection" : method === "work" ? "Work circle" : "Social meet";
    var key = "crush_v1842_" + Date.now().toString(36) + "_" + randomInt(100, 999);
    s.relationships[key] = ensureCrush({
      name: randomFullName(gender),
      role: "Crush",
      vibe: vibe,
      gender: gender,
      pronouns: pronounsFor(gender),
      alive: true,
      age: age,
      bond: randomInt(28, 48),
      trust: randomInt(28, 50),
      looks: randomInt(35, 95),
      smarts: randomInt(35, 95),
      chemistry: randomInt(35, 85),
      values: randomInt(30, 95),
      kindness: randomInt(35, 95),
      intent: pick(["casual", "serious", "slow burn", "family minded", "career first"]),
      tags: [pick(DATE_VIBES), pick(DATE_VIBES)]
    });
    s.socialV1842.dating.searches += 1;
    log("You met " + s.relationships[key].name + " through " + vibe.toLowerCase() + ".", { happiness: 1, confidence: 1 });
    saveRender();
  }

  window.findDateV1842 = function (method) {
    return createDatingProspect(method || "app");
  };

  window.findDate = function (method) {
    return createDatingProspect(method || "app");
  };

  window.dateActionV1842 = function (key, action) {
    var s = ensurePeopleState();
    var crush = s.relationships[key];
    if (!crush || crush.role !== "Crush") return toast("That dating prospect is not available.");
    if (action === "ghost" || action === "end") {
      delete s.relationships[key];
      log("You moved on from " + crush.name + ".", { stress: -1 });
      return saveRender();
    }
    if (action === "official") return window.makeRelationshipOfficialV1842(key);
    var config = DATING_ACTIONS[action];
    if (!config) {
      if (previousDateActionV1842) return previousDateActionV1842.apply(this, arguments);
      return;
    }
    if (!canSpend(config.cost)) return;
    if (!useCount("date_" + key + "_" + action, config.limit, config.label, action === "weekend" ? 2 : 1)) return;
    s.money = round(n(s.money) - n(config.cost));
    crush.bond = clamp(n(crush.bond) + n(config.bond), 0, 100);
    crush.trust = clamp(n(crush.trust) + n(config.trust), 0, 100);
    crush.chemistry = clamp(n(crush.chemistry) + n(config.chemistry), 0, 100);
    var deltas = Object.assign({}, config.deltas || {});
    if (config.cost) deltas.money = -config.cost;
    apply(deltas);
    log(config.label + " with " + crush.name + ". Chemistry is now " + round(crush.chemistry) + "/100.", deltas);
    saveRender();
  };

  window.dateAction = window.dateActionV1842;

  window.makeRelationshipOfficialV1842 = function (key) {
    var s = ensurePeopleState();
    var crush = s.relationships[key];
    if (!crush || crush.role !== "Crush") return toast("That person is not in your dating pool.");
    var threshold = 62;
    if (n(crush.bond) < threshold || n(crush.chemistry) < 52 || n(crush.trust) < 44) {
      return toast("Build more bond, trust, and chemistry before making it official.");
    }
    delete s.relationships[key];
    s.relationships.partner = {
      name: crush.name,
      role: "Partner",
      gender: crush.gender,
      pronouns: crush.pronouns,
      age: crush.age,
      alive: true,
      bond: clamp(n(crush.bond) + 5, 0, 100),
      trust: clamp(n(crush.trust) + 5, 0, 100),
      chemistry: crush.chemistry,
      values: crush.values,
      kindness: crush.kindness,
      intent: crush.intent,
      tags: crush.tags || []
    };
    Object.keys(s.relationships).forEach(function (otherKey) {
      if (s.relationships[otherKey] && s.relationships[otherKey].role === "Crush") delete s.relationships[otherKey];
    });
    apply({ happiness: 10, confidence: 3 });
    log("You and " + crush.name + " made the relationship official.", { happiness: 10, confidence: 3 });
    saveRender();
  };

  window.setOrientationV1842 = function (orientation) {
    var s = ensurePeopleState();
    if (!ORIENTATIONS[orientation]) orientation = "straight";
    s.socialV1842.orientation = orientation;
    log("Your dating compass is now " + ORIENTATIONS[orientation].label + ".", { confidence: 1 });
    saveRender();
  };

  window.setSocialTargetV1842 = function (targetKey) {
    var s = ensurePeopleState();
    var key = String(targetKey || "all");
    if (key !== "all" && (!s.relationships[key] || s.relationships[key].alive === false)) key = "all";
    s.socialV1842.socialTarget = key;
    saveRender();
  };

  window.setChildcareV1842 = function (style) {
    var s = ensurePeopleState();
    if (!CHILDCARE[style]) return;
    s.socialV1842.family.childcare = style;
    childEntries().forEach(function (pair) {
      var child = pair[1];
      ensureChild(pair[0], child);
      child.profileV1842.mood = clamp(n(child.profileV1842.mood) + n(CHILDCARE[style].mood), 0, 100);
      child.trust = clamp(n(child.trust) + n(CHILDCARE[style].trust), 0, 100);
      if (CHILDCARE[style].smarts) child.smarts = clamp(n(child.smarts) + CHILDCARE[style].smarts, 0, 120);
      if (CHILDCARE[style].confidence) child.confidence = clamp(n(child.confidence) + CHILDCARE[style].confidence, 0, 120);
      if (CHILDCARE[style].health) child.health = clamp(n(child.health) + CHILDCARE[style].health, 0, 120);
    });
    toast("Childcare style set: " + CHILDCARE[style].label + ".");
    saveRender();
  };

  window.childActivityV1842 = function (childKey, action) {
    var s = ensurePeopleState();
    var child = s.relationships[childKey];
    var config = CHILD_ACTIVITIES[action];
    if (!child || child.role !== "Child") return toast("Child profile not found.");
    if (!config) return;
    if (!canSpend(config.cost)) return;
    if (!useCount("child_" + childKey + "_" + action, config.limit, config.label, 1)) return;
    s.money = round(n(s.money) - n(config.cost));
    ensureChild(childKey, child);
    child.profileV1842.mood = clamp(n(child.profileV1842.mood) + n(config.mood), 0, 100);
    child.profileV1842.security = clamp(n(child.profileV1842.security) + Math.round((n(config.bond) + n(config.trust)) / 2), 0, 100);
    child.profileV1842.lastFocus = config.label;
    child.profileV1842.needs.attention = clamp(n(child.profileV1842.needs.attention) - Math.max(1, n(config.bond)), 0, 100);
    child.profileV1842.needs.school = clamp(n(child.profileV1842.needs.school) + n(config.smarts), 0, 120);
    child.profileV1842.needs.health = clamp(n(child.profileV1842.needs.health) + n(config.health), 0, 120);
    child.bond = clamp(n(child.bond) + n(config.bond), 0, 100);
    child.trust = clamp(n(child.trust) + n(config.trust), 0, 100);
    if (config.smarts) child.smarts = clamp(n(child.smarts) + config.smarts, 0, 120);
    if (config.confidence) child.confidence = clamp(n(child.confidence) + config.confidence, 0, 120);
    if (config.health) child.health = clamp(n(child.health) + config.health, 0, 120);
    if (config.discipline) child.discipline = clamp(n(child.discipline) + config.discipline, 0, 120);
    var deltas = { happiness: Math.max(0, n(config.mood) > 0 ? 1 : 0) };
    if (config.cost) deltas.money = -config.cost;
    apply(deltas);
    log(config.label + " with " + child.name + ".", deltas);
    saveRender();
  };

  window.doFamilySocialV1842 = function (activityId) {
    var s = ensurePeopleState();
    var config = SOCIAL_ACTIVITIES[activityId];
    if (!config) return;
    if (!canSpend(config.cost)) return;
    if (!useCount("social_" + activityId, config.limit, config.label, activityId === "party" ? 2 : 1)) return;
    var targetValue = s.socialV1842.socialTarget || "all";
    try {
      var el = document.getElementById("v1842-social-target");
      if (el && el.value) targetValue = el.value;
    } catch (e) {}
    s.socialV1842.socialTarget = targetValue;
    var touched = 0;
    if (config.target === "new") {
      var gender = pick(["male", "female", "nonbinary"]);
      var key = "friend_v1842_" + Date.now().toString(36);
      s.relationships[key] = ensurePerson(key, {
        name: randomFullName(gender),
        role: "Friend",
        gender: gender,
        pronouns: pronounsFor(gender),
        alive: true,
        age: Math.max(6, round(s.age) + randomInt(-5, 6)),
        bond: randomInt(42, 66),
        trust: randomInt(35, 62),
        tags: [pick(RELATION_TAGS), pick(RELATION_TAGS)]
      });
      touched = 1;
    } else {
      relationshipEntries().forEach(function (pair) {
        var key = pair[0];
        var person = pair[1];
        var selected = targetValue === "all" || targetValue === key;
        var role = person.role;
        var family = ["Mother", "Father", "Parent", "Sibling", "Older Sibling", "Younger Sibling", "Child", "Partner", "Spouse"].indexOf(role) >= 0;
        var friends = ["Friend", "Best Friend", "Partner", "Spouse"].indexOf(role) >= 0;
        var matches = config.target === "all" || config.target === "any" || (config.target === "family" && family) || (config.target === "friends" && friends);
        if (selected && matches) {
          adjustRelation(person, config.bond, config.trust);
          if (person.role === "Child") {
            ensureChild(key, person);
            person.profileV1842.mood = clamp(n(person.profileV1842.mood) + 2, 0, 100);
          }
          touched += 1;
        }
      });
    }
    if (!touched) return toast("No matching people for that activity yet.");
    s.money = round(n(s.money) - n(config.cost));
    var deltas = Object.assign({}, config.deltas || {});
    if (config.cost) deltas.money = -config.cost;
    apply(deltas);
    log(config.label + " changed the rhythm of your social life.", deltas);
    saveRender();
  };

  function askParentSupport(key, person, action) {
    var s = ensurePeopleState();
    if (!parentMoneyOpen()) return toast("Parent money help usually closes after age 25.");
    var pf = s.parentFinances || (s.parentFinances = { income: 0, liquid: 0, netWorth: 0, givenThisYear: 0 });
    var trustFactor = n(person.trust) >= 65 ? 1.2 : n(person.trust) >= 45 ? 1 : .6;
    var base = action === "askCustom" ? Math.max(2500, Math.round(n(pf.income) * .08)) : Math.max(500, Math.round(n(pf.income) * .025));
    var amount = Math.max(0, Math.min(round(n(pf.liquid)), round(base * trustFactor)));
    if (!amount) return toast("There is no parent cash help available right now.");
    if (!useCount("parent_help_" + key + "_" + action, action === "askCustom" ? 1 : 2, "Parent help", 1)) return;
    s.money = round(n(s.money) + amount);
    pf.liquid = Math.max(0, round(n(pf.liquid) - amount));
    pf.givenThisYear = round(n(pf.givenThisYear) + amount);
    adjustRelation(person, action === "askCustom" ? -6 : -3, action === "askCustom" ? -8 : -4);
    log(person.name + " helped with " + compactMoney(amount) + ".", { money: amount, stress: -2 });
    saveRender();
  }

  window.runTargetSocialV1842 = function (targetKey, activityId) {
    var s = ensurePeopleState();
    targetKey = String(targetKey || "all");
    if (targetKey === "all") return window.doFamilySocialV1842(activityId);
    var person = s.relationships[targetKey];
    if (!person || person.alive === false) return toast("That person is not available.");
    var type = socialTargetType(targetKey);
    var plans = socialPlansForTarget(targetKey);
    var config = plans[activityId];
    if (!config) return toast("That plan is not available for this person.");
    if (type === "child") return window.childActivityV1842(targetKey, activityId);
    if (type === "parent" && activityId === "help") return askParentSupport(targetKey, person, "askMoney");
    if (!canSpend(config.cost)) return;
    if (!useCount("target_social_" + targetKey + "_" + activityId, config.limit, config.label, activityId === "vacation" ? 2 : 1)) return;
    s.money = round(n(s.money) - n(config.cost));
    adjustRelation(person, config.bond, config.trust);
    adjustChemistry(person, config.chemistry);
    var deltas = Object.assign({}, config.deltas || {});
    if (config.cost) deltas.money = -config.cost;
    apply(deltas);
    log(config.label + " with " + person.name + ".", deltas);
    saveRender();
  };

  window.relationActionV1842 = function (key, action) {
    var s = ensurePeopleState();
    var person = s.relationships[key];
    if (!person || person.alive === false) return;
    if (action === "askMoney" || action === "askCustom") {
      return askParentSupport(key, person, action);
    }
    if (person.role === "Child" && CHILD_ACTIVITIES[action]) return window.childActivityV1842(key, action);
    var config = RELATION_ACTIONS[action];
    if (!config) {
      if (previousRelationActionV1842) return previousRelationActionV1842.apply(this, arguments);
      return;
    }
    if (!canSpend(config.cost)) return;
    if (!useCount("rel_" + key + "_" + action, config.limit, config.label, 1)) return;
    s.money = round(n(s.money) - n(config.cost));
    adjustRelation(person, config.bond, config.trust);
    var deltas = Object.assign({}, config.deltas || {});
    if (config.cost) deltas.money = -config.cost;
    apply(deltas);
    log(config.label + " with " + person.name + ".", deltas);
    saveRender();
  };

  window.relationAction = window.relationActionV1842;
  try { relationAction = window.relationAction; } catch (e) {}

  function newChildRecord(kind) {
    var s = ensurePeopleState();
    var last = String(s.name || "").split(/\s+/).pop() || randomLast();
    var gender = pick(["male", "female"]);
    var idx = childEntries().length;
    var key = "child" + idx;
    while (s.relationships[key]) key = "child" + randomInt(1000, 9999);
    s.relationships[key] = ensurePerson(key, {
      name: randomFullName(gender, last),
      role: "Child",
      gender: gender,
      pronouns: pronounsFor(gender),
      birthType: kind || "family",
      alive: true,
      age: 0,
      bond: 82,
      trust: 72,
      tags: [pick(RELATION_TAGS), pick(RELATION_TAGS)]
    });
    if (s.finance && s.finance.trustFunds && s.finance.trustFunds[key] == null) s.finance.trustFunds[key] = 0;
    return [key, s.relationships[key]];
  }

  window.addChildV1842 = function (kind) {
    var result = newChildRecord(kind || "family");
    return result && result[1];
  };

  window.addChild = function () {
    return window.addChildV1842("family");
  };
  try { addChild = window.addChild; } catch (e) {}

  window.familyActionV1842 = function (action) {
    var s = ensurePeopleState();
    var pair = partnerEntry();
    var partner = pair && pair[1];
    if (action === "propose" || action === "marry") {
      if (!partner) return toast("You need a partner first.");
      if (s.married || partner.role === "Spouse") return toast("You are already married.");
      var cost = 1800;
      if (!canSpend(cost)) return;
      s.money = round(n(s.money) - cost);
      s.married = true;
      partner.role = "Spouse";
      partner.bond = clamp(n(partner.bond) + 12, 0, 100);
      partner.trust = clamp(n(partner.trust) + 7, 0, 100);
      apply({ money: -cost, happiness: 14, stress: -3 });
      log("You married " + partner.name + ".", { money: -cost, happiness: 14, stress: -3 });
      return saveRender();
    }
    if (action === "try" || action === "baby") {
      if (!partner) return toast("You need a partner or spouse first.");
      if (s.familyPlan === "no kids") return toast("Change the family plan before trying for a baby.");
      if (s.pregnant) return toast("A pregnancy is already in progress.");
      if (!useCount("family_try_baby", 2, "Baby attempt", 1)) return;
      var age = round(s.age);
      var odds = s.sandbox && s.sandbox.fertilityControl ? 1 : age > 45 ? .16 : age > 39 ? .32 : age < 18 ? .22 : .68;
      if (chanceLocal(odds)) {
        s.pregnant = true;
        log("A pregnancy began.", { happiness: 4, stress: 2 });
      } else {
        apply({ happiness: -2, stress: 3 });
        log("You tried for a baby. No luck this time.", { happiness: -2, stress: 3 });
      }
      return saveRender();
    }
    if (action === "adopt") {
      var adoptCost = 6000;
      if (!canSpend(adoptCost)) return;
      if (!useCount("family_adopt", 2, "Adoption", 2)) return;
      s.money = round(n(s.money) - adoptCost);
      var child = newChildRecord("adopted")[1];
      apply({ money: -adoptCost, happiness: 12, stress: 3 });
      log("You adopted " + child.name + ".", { money: -adoptCost, happiness: 12, stress: 3 });
      return saveRender();
    }
    if (action === "nokids") {
      s.familyPlan = "no kids";
      apply({ happiness: 4, stress: -3 });
      log("You chose a no-kids family plan for now.", { happiness: 4, stress: -3 });
      return saveRender();
    }
    if (action === "open") {
      s.familyPlan = "open";
      toast("Family plan reopened.");
      return saveRender();
    }
    if (previousFamilyActionV1842) return previousFamilyActionV1842.apply(this, arguments);
  };

  window.familyAction = window.familyActionV1842;
  try { familyAction = window.familyAction; } catch (e) {}

  function metric(label, value, note, kind) {
    return '<div class="v1842-metric ' + esc(kind || "") + '"><span>' + esc(label) + '</span><b>' + esc(value) + '</b><em>' + esc(note || "") + '</em></div>';
  }

  function button(label, action, kind, disabled) {
    return '<button class="money-btn ' + esc(kind || "") + '" onclick="event.preventDefault();event.stopPropagation();' + action + '" ' + (disabled ? "disabled" : "") + '>' + esc(label) + '</button>';
  }

  function bar(value, kind) {
    value = clamp(value, 0, 100);
    return '<div class="v1842-bar ' + esc(kind || "") + '"><i style="width:' + value + '%"></i></div>';
  }

  function pill(text, kind) {
    return '<span class="v1842-pill ' + esc(kind || "") + '">' + esc(text) + '</span>';
  }

  function hero() {
    var s = ensurePeopleState();
    var rels = relationshipEntries();
    var kids = childEntries();
    var pair = partnerEntry();
    var social = s.socialV1842;
    var energyLeft = Math.max(0, n(social.energyMax) - n(social.energyUsed));
    return '<section class="v1842-hero"><div><div class="section-label">👥 People command</div><h2>Family Life</h2><p>Dating, partners, children, friends, and family support all shape the life around your character.</p><div class="v1842-pill-row">' +
      pill(rels.length + " people", "gold") +
      pill(kids.length + " children", kids.length ? "good" : "gold") +
      pill(pair ? pair[1].role + ": " + pair[1].name : "Single", pair ? "good" : "gold") +
      pill(attractionLine(), "blue") +
      pill(energyLeft + " / " + social.energyMax + " social energy", energyLeft ? "good" : "bad") +
      '</div></div><strong>' + Math.round(peopleScore()) + '<span>social score</span></strong></section>';
  }

  function peopleScore() {
    var rels = relationshipEntries();
    if (!rels.length) return 0;
    var total = rels.reduce(function (sum, pair) {
      return sum + n(pair[1].bond) * .55 + n(pair[1].trust) * .45;
    }, 0);
    return clamp(Math.round(total / rels.length), 0, 100);
  }

  function overviewMetrics() {
    var s = ensurePeopleState();
    var kids = childEntries();
    var avgChildMood = kids.length ? Math.round(kids.reduce(function (sum, pair) { ensureChild(pair[0], pair[1]); return sum + n(pair[1].profileV1842.mood); }, 0) / kids.length) : 0;
    var pair = partnerEntry();
    var dating = crushEntries().length;
    var pf = s.parentFinances || {};
    return '<section class="v1842-metrics">' +
      metric("Relationships", String(relationshipEntries().length), "Family, friends, partner, children.", "gold") +
      metric("Children", String(kids.length), kids.length ? "Average child mood " + avgChildMood + "/100." : "No children in the home.", kids.length ? "good" : "gold") +
      metric("Dating", pair ? "Committed" : dating + " prospects", pair ? "Partner bond " + round(pair[1].bond) + "/100." : "Build chemistry before official.", pair ? "good" : "blue") +
      metric("Parent help", parentMoneyOpen() ? compactMoney(pf.liquid || 0) : "Closed", parentMoneyOpen() ? "Available family support estimate." : "Money help closes after 25.", parentMoneyOpen() ? "gold" : "blue") +
      '</section>';
  }

  function orientationPanel() {
    var s = ensurePeopleState();
    var cards = Object.keys(ORIENTATIONS).map(function (key) {
      var o = ORIENTATIONS[key];
      return '<button class="v1842-option ' + (s.socialV1842.orientation === key ? "active" : "") + '" onclick="event.preventDefault();event.stopPropagation();setOrientationV1842(\'' + esc(key) + '\')"><span>' + esc(o.label) + '</span><b>Dating pool</b><em>' + esc(o.desc) + '</em></button>';
    }).join("");
    return '<section class="panel v1842-panel"><div class="v1842-head"><div><div class="section-label">🧭 Dating compass</div><h3>Who are you interested in?</h3><p>Dating prospects follow this choice.</p></div><strong>' + esc((ORIENTATIONS[s.socialV1842.orientation] || ORIENTATIONS.straight).label) + '<span>current</span></strong></div><div class="v1842-option-grid">' + cards + '</div></section>';
  }

  function datingPanel() {
    var s = ensurePeopleState();
    var pair = partnerEntry();
    var prospects = crushEntries();
    if (pair) return partnershipPanel(pair[0], pair[1]);
    var locked = !datingAllowed();
    var searchRow = '<div class="v1842-actions">' +
      button("Dating App", "findDateV1842('app')", "blue", locked) +
      button("Friend Setup", "findDateV1842('friends')", "", locked) +
      button("School Circle", "findDateV1842('school')", "", locked || round(s.age) > 24) +
      button("Work Circle", "findDateV1842('work')", "gold", locked || round(s.age) < 16) +
      '</div>';
    var prospectCards = prospects.length ? prospects.map(function (pair) { return crushCard(pair[0], pair[1]); }).join("") : '<div class="v1842-empty">No active prospects. Search when you want to meet someone new.</div>';
    return '<section class="panel v1842-panel"><div class="v1842-head"><div><div class="section-label">💘 Dating life</div><h3>Prospects + chemistry</h3><p>' + (locked ? "Dating unlocks when you are old enough and single." : "Meet people, build chemistry, then decide whether it becomes real.") + '</p></div><strong>' + prospects.length + '<span>prospects</span></strong></div>' + searchRow + '<div class="v1842-card-grid">' + prospectCards + '</div></section>';
  }

  function partnershipPanel(key, partner) {
    ensurePerson(key, partner);
    var mood = relationshipMood(partner);
    var availability = relationshipAvailability(partner);
    var chemistry = relationshipChemistry(partner);
    var summary = partner.name + " feels " + mood.label + " today. Availability is " + availability.label + "; chemistry is " + chemistry.label + ".";
    return '<section class="panel v1842-panel v1842-partner-panel"><div class="v1842-head"><div><div class="section-label">💍 Partner / spouse</div><h3>' + esc(partner.name) + '</h3><p>' + esc(genderLabel(partner)) + " - " + esc(partner.pronouns) + " - age " + esc(partner.age == null ? "?" : partner.age) + " - " + esc(partner.intent || "shared life") + '</p></div><strong>' + esc(partner.role) + '<span>status</span></strong></div><div class="v1842-split"><div>' +
      metric("Mood", capText(mood.label), mood.note, mood.kind) +
      metric("Trust", round(partner.trust) + "/100", "Reliability, promises, and safety.", "blue") +
      metric("Chemistry", round(partner.chemistry || 55) + "/100", chemistry.note, chemistry.kind) +
      metric("Availability", capText(availability.label), availability.note, availability.kind) +
      '</div><div><div class="v1842-actions">' +
      button("Talk", "runTargetSocialV1842('" + esc(key) + "','checkin')", "green", false) +
      button("Dinner", "runTargetSocialV1842('" + esc(key) + "','dinner')", "gold", false) +
      button("Movie", "runTargetSocialV1842('" + esc(key) + "','movie')", "", false) +
      button("Vacation", "runTargetSocialV1842('" + esc(key) + "','vacation')", "blue", false) +
      button("Apologize", "relationActionV1842('" + esc(key) + "','apologize')", "blue", false) +
      button("Marry", "familyActionV1842('propose')", "gold", partner.role === "Spouse" || stateNow().married) +
      '</div><p class="v1842-note">' + esc(summary) + '</p></div></div></section>';
  }

  function crushCard(key, crush) {
    ensureCrush(crush);
    var ready = n(crush.bond) >= 62 && n(crush.trust) >= 44 && n(crush.chemistry) >= 52;
    return '<div class="v1842-card v1842-crush"><div class="v1842-card-top"><div><span>' + esc(crush.vibe || "Prospect") + '</span><b>' + esc(crush.name) + '</b><em>' + esc(genderLabel(crush)) + " - " + esc(crush.pronouns) + " - age " + esc(crush.age == null ? "?" : crush.age) + '</em></div><strong>' + round(crush.chemistry) + '<small>chem</small></strong></div><div class="v1842-pill-row">' +
      pill("Intent " + (crush.intent || "unknown"), "gold") +
      pill("Looks " + round(crush.looks || 0), "") +
      pill("Smarts " + round(crush.smarts || 0), "") +
      pill("Values " + round(crush.values || 0), "blue") +
      '</div>' + bar(crush.bond, "good") + '<div class="v1842-actions">' +
      Object.keys(DATING_ACTIONS).map(function (action) { return button(DATING_ACTIONS[action].label, "dateActionV1842('" + esc(key) + "','" + esc(action) + "')", action === "weekend" ? "gold" : "", false); }).join("") +
      button("Official", "makeRelationshipOfficialV1842('" + esc(key) + "')", "green", !ready) +
      button("Move On", "dateActionV1842('" + esc(key) + "','end')", "red", false) +
      '</div></div>';
  }

  function childrenPanel() {
    var kids = childEntries();
    var s = ensurePeopleState();
    var style = CHILDCARE[s.socialV1842.family.childcare] || CHILDCARE.family;
    var childcare = Object.keys(CHILDCARE).map(function (key) {
      var item = CHILDCARE[key];
      return button(item.label + " - " + compactMoney(item.cost) + "/kid", "setChildcareV1842('" + esc(key) + "')", s.socialV1842.family.childcare === key ? "green" : "gold", false);
    }).join("");
    var cards = kids.length ? kids.map(function (pair) { return childCard(pair[0], pair[1]); }).join("") : '<div class="v1842-empty">No children yet. Family planning can open that path when you want it.</div>';
    return '<section class="panel v1842-panel v1842-children"><div class="v1842-head"><div><div class="section-label">👶 Family command</div><h3>' + kids.length + ' children at home</h3><p>Care style and activities shape mood, smarts, confidence, health, and trust.</p></div><strong>' + esc(style.label) + '<span>care style</span></strong></div><div class="v1842-actions">' + childcare + '</div><div class="v1842-card-grid">' + cards + '</div></section>';
  }

  function childCard(key, child) {
    ensureChild(key, child);
    var p = child.profileV1842;
    return '<div class="v1842-card v1842-child-card"><div class="v1842-card-top"><div><span>' + esc(genderLabel(child)) + " - " + esc(child.pronouns) + '</span><b>' + esc(child.name) + '</b><em>Age ' + esc(child.age) + " - " + esc(p.school) + " - " + esc((child.interests || []).join(", ")) + '</em></div><strong>' + round(p.mood) + '<small>mood</small></strong></div>' +
      '<div class="v1842-pill-row">' + pill("Bond " + round(child.bond), "good") + pill("Trust " + round(child.trust), "blue") + pill("Smarts " + round(child.smarts), "gold") + pill("Health " + round(child.health), "") + pill("Confidence " + round(child.confidence), "") + '</div>' +
      bar(p.mood, p.mood >= 70 ? "good" : p.mood >= 45 ? "gold" : "bad") +
      '<p class="v1842-note">Focus: ' + esc(p.lastFocus || "growing") + '.</p>' +
      '<div class="v1842-pill-row">' + pill("🫂 Attention " + round(p.needs.attention), n(p.needs.attention) >= 60 ? "good" : "bad") + pill("🏫 School " + round(p.needs.school), n(p.needs.school) >= 60 ? "good" : "bad") + pill("❤️ Health " + round(p.needs.health), n(p.needs.health) >= 60 ? "good" : "bad") + '</div>' +
      bar(p.needs.attention, n(p.needs.attention) >= 60 ? "good" : "bad") + bar(p.needs.school, n(p.needs.school) >= 60 ? "good" : "bad") + bar(p.needs.health, n(p.needs.health) >= 60 ? "good" : "bad") +
      '<div class="v1842-actions">' + Object.keys(CHILD_ACTIVITIES).map(function (action) {
        var item = CHILD_ACTIVITIES[action];
        return button(item.label, "childActivityV1842('" + esc(key) + "','" + esc(action) + "')", action === "tutor" ? "blue" : action === "family_day" ? "green" : action === "study" ? "gold" : "", false);
      }).join("") + '</div></div>';
  }

  function relationshipPanel() {
    var rels = relationshipEntries();
    var nonKids = rels.filter(function (pair) { return pair[1].role !== "Child"; });
    var cards = nonKids.length ? nonKids.map(function (pair) { return relationshipCard(pair[0], pair[1]); }).join("") : '<div class="v1842-empty">No relationships yet. Social activities and dating can add people.</div>';
    return '<section class="panel v1842-panel"><div class="v1842-head"><div><div class="section-label">👥 Relationships</div><h3>People in your life</h3><p>Quick actions, trust, bond, and personality tags stay here.</p></div><strong>' + nonKids.length + '<span>non-child</span></strong></div><div class="v1842-card-grid">' + cards + '</div></section>';
  }

  function relationshipCard(key, person) {
    ensurePerson(key, person);
    var parent = ["Mother", "Father", "Parent"].indexOf(person.role) >= 0;
    var parentHelpOpen = !parent || parentMoneyOpen();
    return '<div class="v1842-card"><div class="v1842-card-top"><div><span>' + esc(person.role) + '</span><b>' + esc(person.name) + '</b><em>' + esc(genderLabel(person)) + " - " + esc(person.pronouns) + (person.age != null ? " - age " + esc(person.age) : "") + '</em></div><strong>' + Math.round((n(person.bond) + n(person.trust)) / 2) + '<small>score</small></strong></div><div class="v1842-pill-row">' +
      pill("💞 Bond " + round(person.bond), "good") + pill("🤝 Trust " + round(person.trust), "gold") + (person.tags || []).map(function (tag) { return pill(tag, "gold"); }).join("") +
      '</div>' + bar(person.bond, "good") + bar(person.trust, "gold") + '<div class="v1842-actions">' +
      button("Talk", "relationActionV1842('" + esc(key) + "','talk')", "green", false) +
      button("Gift", "relationActionV1842('" + esc(key) + "','gift')", "", false) +
      button("Big Gift", "relationActionV1842('" + esc(key) + "','bigGift')", "gold", false) +
      button("Apologize", "relationActionV1842('" + esc(key) + "','apologize')", "blue", false) +
      (parent ? button(parentHelpOpen ? "Ask Money" : "Money Closed", "relationActionV1842('" + esc(key) + "','askMoney')", "", !parentHelpOpen) + button("Custom Ask", "relationActionV1842('" + esc(key) + "','askCustom')", "", !parentHelpOpen) : "") +
      button("Argue", "relationActionV1842('" + esc(key) + "','argue')", "red", false) +
      '</div></div>';
  }

  function socialPanel() {
    var s = ensurePeopleState();
    var targets = relationshipEntries();
    var selected = s.socialV1842.socialTarget || "all";
    if (selected !== "all" && (!s.relationships[selected] || s.relationships[selected].alive === false)) selected = "all";
    s.socialV1842.socialTarget = selected;
    var type = socialTargetType(selected);
    var person = selected === "all" ? null : s.relationships[selected];
    var options = '<option value="all"' + (selected === "all" ? " selected" : "") + '>Everyone available</option>' + targets.map(function (pair) {
      return '<option value="' + esc(pair[0]) + '"' + (selected === pair[0] ? " selected" : "") + '>' + esc(pair[1].name + " - " + pair[1].role) + '</option>';
    }).join("");
    var plans = socialPlansForTarget(selected);
    var heading = person ? "Plans with " + person.name : "Plans with people";
    var copy = person ? "This list changes around " + person.role.toLowerCase() + " needs, trust, and daily life." : "Choose everyone for broad social plans, or pick one person for specific plans.";
    var cards = Object.keys(plans).map(function (key) {
      var a = plans[key];
      var disabled = type === "parent" && key === "help" && !parentMoneyOpen();
      var targetLabel = type === "all" ? (a.target || "all") : type;
      var impact = pill("Bond " + (n(a.bond) >= 0 ? "+" : "") + n(a.bond), "good") +
        pill("Trust " + (n(a.trust) >= 0 ? "+" : "") + n(a.trust), "blue") +
        (a.chemistry ? pill("Chemistry +" + n(a.chemistry), "gold") : "") +
        (a.smarts ? pill("Smarts +" + n(a.smarts), "gold") : "") +
        (a.health ? pill("Health +" + n(a.health), "good") : "") +
        (a.confidence ? pill("Confidence +" + n(a.confidence), "blue") : "") +
        Object.keys(a.deltas || {}).slice(0, 2).map(function (stat) {
          var val = a.deltas[stat];
          return pill(capText(stat) + " " + (val > 0 ? "+" : "") + val, stat === "stress" && val < 0 ? "good" : "gold");
        }).join("");
      return '<div class="v1842-card v1842-social-card"><div class="v1842-card-top"><div><span>' + esc(targetLabel) + '</span><b>' + esc(a.label) + '</b><em>' + planCostText(a) + " - " + esc(a.desc) + '</em></div><strong>' + esc(a.limit) + '<small>/yr</small></strong></div><div class="v1842-pill-row">' + impact + '</div>' + button(disabled ? "Closed After 25" : "Do Activity", "runTargetSocialV1842('" + esc(selected) + "','" + esc(key) + "')", key === "vacation" || key === "party" || key === "nightout" ? "gold" : "green", disabled) + '</div>';
    }).join("");
    return '<section class="panel v1842-panel"><div class="v1842-head"><div><div class="section-label">🎉 Social rhythm</div><h3>' + esc(heading) + '</h3><p>' + esc(copy) + '</p></div></div><div class="v1842-target-row"><label><span>Social target</span><select id="v1842-social-target" onchange="setSocialTargetV1842(this.value)">' + options + '</select></label></div><div class="v1842-card-grid">' + cards + '</div></section>';
  }

  function familyPlanningNote(s, pair, kids) {
    if (s.pregnant) return "A new child may arrive at the end of the year.";
    if (s.familyPlan === "no kids") return "No-kids plan is active. Reopen the plan if life changes.";
    if (!pair) return "Build a steady relationship before pregnancy choices open.";
    if (kids.length) return "Your household already has " + kids.length + " child" + (kids.length === 1 ? "" : "ren") + ". Care style and activities shape the home.";
    return "Your family path is open.";
  }

  function familyPlanningPanel() {
    var s = ensurePeopleState();
    var pair = partnerEntry();
    var kids = childEntries();
    var status = s.pregnant ? "Pregnant" : capText(s.familyPlan || "open");
    return '<section class="panel v1842-panel"><div class="v1842-head"><div><div class="section-label">👨‍👩‍👧 Family planning</div><h3>' + esc(status) + '</h3><p>Marriage, baby, adoption, no-kids, childcare, and the family path are visible together.</p></div><strong>' + kids.length + '<span>children</span></strong></div><div class="v1842-actions">' +
      button("Marry", "familyActionV1842('propose')", "gold", !pair || s.married || (pair && pair[1].role === "Spouse")) +
      button("Try For Baby", "familyActionV1842('try')", "green", !pair || s.pregnant || s.familyPlan === "no kids") +
      button("Adopt", "familyActionV1842('adopt')", "blue", n(s.money) < 6000) +
      button("No Kids", "familyActionV1842('nokids')", "", false) +
      button("Reopen Plan", "familyActionV1842('open')", "", s.familyPlan !== "no kids") +
      '</div><div class="v1842-note">' + esc(familyPlanningNote(s, pair, kids)) + '</div></section>';
  }

  function parentFinancePanel() {
    var s = ensurePeopleState();
    var pf = s.parentFinances || {};
    var open = parentMoneyOpen();
    return '<section class="panel v1842-panel v1842-parent-money"><div class="v1842-head"><div><div class="section-label">💰 Parent finances</div><h3>' + esc(capText(s.familyWealth || "household")) + ' household</h3><p>' + (open ? "Family help can still cover early-life gaps." : "Money help is closed after 25, but family advice and visits still matter.") + '</p></div><strong>' + (open ? compactMoney(pf.liquid || 0) : "Advice") + '<span>' + (open ? "available help" : "support mode") + '</span></strong></div><div class="v1842-metrics">' +
      metric("Income", compactMoney(pf.income || 0) + "/yr", "Estimated parent household income.", "gold") +
      metric("Net worth", compactMoney(pf.netWorth || 0), "Family resources and support ceiling.", "blue") +
      metric(open ? "Given this year" : "Cash help", open ? compactMoney(pf.givenThisYear || 0) : "Closed", open ? "Large asks can strain relationships." : "Closed once you are older than 25.", open && n(pf.givenThisYear) ? "bad" : "good") +
      '</div></section>';
  }

  function renderPeopleV1842() {
    ensurePeopleState();
    return '<div class="v1842-people-shell">' +
      hero() +
      overviewMetrics() +
      orientationPanel() +
      childrenPanel() +
      datingPanel() +
      socialPanel() +
      relationshipPanel() +
      familyPlanningPanel() +
      parentFinancePanel() +
      '</div>';
  }

  window.renderPeopleV1842 = renderPeopleV1842;
  window.renderPeople = renderPeopleV1842;
  try { renderPeople = window.renderPeople; } catch (e) {}

  var previousRenderHubContentV1842 = window.renderHubContent || (typeof renderHubContent === "function" ? renderHubContent : null);
  window.renderHubContent = function (hubId) {
    var id = String(hubId || "").toLowerCase();
    if (id === "people" || id === "relationships" || id === "family" || id === "dating") return renderPeopleV1842();
    return previousRenderHubContentV1842 ? previousRenderHubContentV1842.apply(this, arguments) : "";
  };
  try { renderHubContent = window.renderHubContent; } catch (e) {}

  if (typeof document !== "undefined" && document.createElement && document.head) {
    var style = document.createElement("style");
    style.textContent = [
      ".v1842-people-shell{display:grid;gap:14px;padding:4px 0 96px;color:#f6ead8;min-width:0}.v1842-people-shell *{box-sizing:border-box}.v1842-panel{min-width:0;overflow:hidden;border-color:rgba(126,160,172,.34)!important;background:linear-gradient(135deg,rgba(24,37,38,.92),rgba(31,25,19,.96))!important}",
      ".v1842-hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:end;border:1px solid rgba(126,160,172,.46);border-radius:16px;background:radial-gradient(circle at 12% 10%,rgba(126,160,172,.24),transparent 30%),radial-gradient(circle at 78% 0,rgba(216,173,109,.18),transparent 28%),linear-gradient(135deg,rgba(22,39,42,.98),rgba(42,31,22,.98));padding:18px;box-shadow:0 22px 58px rgba(0,0,0,.28)}.v1842-hero h2{font-size:38px;margin:0 0 6px;letter-spacing:0}.v1842-hero p{margin:0;color:#d9c8aa;font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.55}.v1842-hero strong{font-size:42px;color:#f0ca7b;text-align:right}.v1842-hero strong span{display:block;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.15em;font-size:9px;color:#bba988}",
      ".v1842-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:12px}.v1842-head h3{margin:0 0 5px;font-size:25px;color:#fff3df}.v1842-head p{margin:0;color:#c9bda7;font:11px/1.5 'JetBrains Mono',monospace}.v1842-head strong{color:#f0ca7b;font-size:28px;text-align:right;max-width:240px;overflow-wrap:anywhere}.v1842-head strong span{display:block;color:#b9a98e;font:8px 'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.16em}",
      ".v1842-pill-row,.v1842-actions{display:flex;gap:7px;flex-wrap:wrap}.v1842-pill-row{margin-top:11px}.v1842-pill{border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(255,255,255,.045);padding:5px 8px;color:#d6c5aa;font:10px/1.2 'JetBrains Mono',monospace}.v1842-pill.good{color:#b9dc8a;border-color:rgba(185,220,138,.38)}.v1842-pill.bad{color:#e9927d;border-color:rgba(233,146,125,.42)}.v1842-pill.gold{color:#f0ca7b;border-color:rgba(240,202,123,.36)}.v1842-pill.blue{color:#b8dce8;border-color:rgba(126,160,172,.42)}",
      ".v1842-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.v1842-metric{border:1px solid rgba(255,255,255,.11);border-radius:12px;background:rgba(255,255,255,.045);padding:11px;min-width:0}.v1842-metric span{display:block;color:#aa9a82;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.11em;font-size:9px}.v1842-metric b{display:block;color:#fff3df;font-size:20px;margin-top:5px;overflow-wrap:anywhere}.v1842-metric em{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-style:normal;font-size:10px;line-height:1.4;margin-top:5px}.v1842-metric.good b{color:#b9dc8a}.v1842-metric.bad b{color:#e9927d}.v1842-metric.gold b{color:#f0ca7b}.v1842-metric.blue b{color:#b8dce8}",
      ".v1842-option-grid,.v1842-card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(235px,1fr));gap:10px}.v1842-option,.v1842-card{min-width:0;border:1px solid rgba(255,255,255,.11);border-radius:12px;background:rgba(255,255,255,.045);color:#f6ead8;text-align:left;padding:12px}.v1842-option{min-height:132px}.v1842-option.active,.v1842-card.v1842-child-card{border-color:rgba(240,202,123,.56);background:linear-gradient(135deg,rgba(64,48,28,.82),rgba(27,23,18,.96))}.v1842-option span,.v1842-card-top span{display:block;color:#d8b16e;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.12em;font-size:9px}.v1842-option b,.v1842-card-top b{display:block;color:#fff3df;font-size:18px;line-height:1.1;margin-top:5px}.v1842-option em,.v1842-card-top em{display:block;color:#b9a98e;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.4;font-style:normal;margin-top:7px}",
      ".v1842-card-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.v1842-card-top>div{min-width:0}.v1842-card-top strong{color:#f0ca7b;font-size:28px;text-align:right;line-height:1}.v1842-card-top strong small{display:block;color:#b9a98e;font:8px 'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.14em;margin-top:3px}.v1842-card .v1842-actions{margin-top:12px}.v1842-actions .money-btn{white-space:normal!important;min-width:78px}.v1842-bar{height:7px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden;margin:10px 0}.v1842-bar i{display:block;height:100%;border-radius:999px;background:#f0ca7b}.v1842-bar.good i{background:#b9dc8a}.v1842-bar.bad i{background:#e9927d}.v1842-bar.gold i{background:#f0ca7b}",
      ".v1842-split{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px}.v1842-split>div:first-child{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.v1842-note,.v1842-empty{border:1px solid rgba(255,255,255,.10);border-radius:12px;background:rgba(255,255,255,.04);padding:12px;color:#c9bda7;font:11px/1.5 'JetBrains Mono',monospace;min-width:0}.v1842-card .v1842-note{margin:10px 0 0}.v1842-target-row{margin:10px 0}.v1842-target-row label{display:block}.v1842-target-row span{display:block;color:#d8b16e;font:9px 'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.14em;margin-bottom:6px}.v1842-target-row select{width:100%;border:1px solid rgba(216,173,109,.44);border-radius:10px;background:#120e0a;color:#fff3df;padding:11px;font:12px 'JetBrains Mono',monospace}",
      ".v1842-children{border-color:rgba(143,175,108,.38)!important;background:linear-gradient(135deg,rgba(24,42,28,.94),rgba(33,28,22,.96))!important}.v1842-partner-panel{border-color:rgba(216,173,109,.34)!important;background:linear-gradient(135deg,rgba(48,36,22,.94),rgba(28,24,19,.96))!important}.v1842-parent-money{border-color:rgba(240,202,123,.28)!important}",
      "@media(max-width:900px){.v1842-hero,.v1842-head,.v1842-split{display:block}.v1842-hero strong,.v1842-head strong{text-align:left;margin-top:10px}.v1842-metrics,.v1842-split>div:first-child{display:flex;overflow-x:auto;padding-bottom:9px}.v1842-metric{flex:0 0 190px}.v1842-option-grid,.v1842-card-grid{grid-template-columns:1fr}.v1842-hero h2{font-size:30px}}"
    ].join("\n");
    document.head.appendChild(style);
  }

  if (window.registerLedgerSystem) {
    window.registerLedgerSystem({
      id: "people-family",
      file: "pages/systems/people-family.js",
      status: "active",
      globals: [
        "renderPeopleV1842",
        "relationActionV1842",
        "familyActionV1842",
        "findDateV1842",
        "dateActionV1842",
        "childActivityV1842",
        "setOrientationV1842",
        "setChildcareV1842",
        "setSocialTargetV1842",
        "runTargetSocialV1842"
      ],
      notes: "People is now a real family-life system: focused dating compass, target-specific social plans, partner mood/availability, child growth activities, childcare style, family planning, and parent support rules."
    });
  }
})();
