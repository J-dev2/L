# Ledger Feature Logic Blueprints

Use this reference for future gameplay expansions. Each blueprint describes the
logic spine, state, actions, yearly behavior, risk, progression, and integration
concerns.

## Table of Contents

1. Blueprint Format
2. Crime
3. Monster
4. Vampire
5. Royalty
6. Boxing
7. Billionaire
8. Fame and Celebrity
9. Politics
10. Dynasty
11. Real Estate Empire
12. Racing
13. Music
14. Fashion and Luxury
15. Secret Society
16. Cross-Feature Systems

## 1. Blueprint Format

For every feature, decide:

- state object,
- ranks/stages,
- resources,
- risks,
- action groups,
- yearly tick,
- random events,
- integrations,
- failure states,
- tests.

Do not implement everything at once. Build a playable v1 with a clear spine.

## 2. Crime

### State

Suggested state:

```js
crimeV1862: {
  active: false,
  rank: "none",
  heat: 0,
  reputation: 0,
  dirtyMoney: 0,
  cleanMoney: 0,
  crewLoyalty: 50,
  territory: 0,
  legalDefense: 0,
  rivalPressure: 0,
  yearly: {},
  jobs: [],
  crew: [],
  history: []
}
```

### Core Loop

Pick job -> gain dirty money/reputation -> heat rises -> launder or lay low ->
rank up -> unlock bigger jobs and bigger risks.

### Actions

- Run small job.
- Run fraud scheme.
- Recruit crew.
- Pay crew.
- Launder money.
- Hire attorney.
- Lay low.
- Expand territory.
- Negotiate with rival.

### Yearly Tick

- Heat cools if inactive.
- Heat rises if dirty money is high.
- Rival pressure changes with territory.
- Crew loyalty drifts based on pay and risk.
- Legal events roll at high heat.
- Territory can produce job opportunities.

### Risk

Risk sources:

- heat,
- dirty money,
- no attorney,
- low crew loyalty,
- rival pressure,
- repeated jobs in one year.

Failures:

- fine,
- prison risk,
- asset seizure,
- crew betrayal,
- injury,
- family/relationship damage.

### Integration

- Legal hub can reduce consequences.
- Finance can show dirty vs clean money if implemented.
- Business fronts can launder or reduce heat.
- Family/relationship systems can react to scandal.

## 3. Monster

### State

```js
monsterV1862: {
  active: false,
  kind: "unknown",
  stage: "changed",
  hunger: 40,
  control: 60,
  secrecy: 80,
  hunterAttention: 0,
  humanity: 70,
  lair: { level: 0, safety: 50 },
  powers: [],
  weaknesses: [],
  history: []
}
```

### Core Loop

Manage hunger/control -> hide evidence -> improve lair/powers -> avoid hunters
-> decide whether to seek cure, embrace power, or protect normal life.

### Actions

- Suppress urge.
- Feed safely.
- Feed violently.
- Hide evidence.
- Improve lair.
- Train control.
- Use power.
- Research cure.
- Face hunter.

### Yearly Tick

- Hunger rises.
- Control can fall if hunger is high.
- Hunter attention follows secrecy failures.
- Humanity drifts from choices.
- Powers unlock with stage and experience.

### Risk

Failures:

- public incident,
- hunter attack,
- relationship loss,
- legal danger,
- forced transformation.

## 4. Vampire

### State

```js
vampireV1862: {
  active: false,
  rank: "neonate",
  blood: 60,
  masquerade: 90,
  covenStanding: 20,
  hunterAttention: 0,
  humanity: 70,
  territory: 0,
  thralls: [],
  powers: {},
  ageAsVampire: 0,
  history: []
}
```

### Core Loop

Feed -> preserve Masquerade -> gain coven standing -> unlock powers/territory ->
face hunters and politics.

### Actions

- Feed quietly.
- Risky hunt.
- Visit blood bank.
- Clean evidence.
- Attend court.
- Trade favor.
- Train power.
- Create thrall.
- Claim territory.
- Misdirect hunter.

### Yearly Tick

- Blood falls.
- Masquerade recovers or worsens.
- Hunter attention follows breaches.
- Coven opportunities appear.
- Thrall loyalty drifts.
- Vampire age increases.

### Risk

Failures:

- Masquerade breach,
- hunter raid,
- coven punishment,
- thrall betrayal,
- humanity loss.

### Integration

- Relationships can become thralls or victims.
- Legal risk can spike after breaches.
- Fame/public life increases Masquerade risk.

## 5. Royalty

### State

```js
royaltyV1862: {
  active: false,
  title: "commoner",
  houseName: "",
  influence: 0,
  publicApproval: 50,
  courtFavor: 0,
  estateValue: 0,
  estateIncome: 0,
  succession: { strength: 0, heirs: [] },
  scandals: [],
  alliances: [],
  rivals: [],
  history: []
}
```

### Core Loop

Gain title/influence -> build estate and alliances -> manage approval/scandal ->
secure succession -> rise toward crown or dynasty.

### Actions

- Attend court.
- Host banquet.
- Arrange marriage.
- Improve estate.
- Sponsor charity.
- Spy on rival.
- Handle scandal.
- Educate heir.
- Petition monarch.

### Yearly Tick

- Estate pays income.
- Court favor drifts.
- Public approval reacts to scandal/luxury.
- Rivals advance claims.
- Heirs age.
- Succession crises can trigger.

### Risk

Failures:

- scandal,
- disinheritance,
- estate debt,
- rival claim,
- public unrest.

## 6. Boxing

### State

```js
boxingV1862: {
  active: false,
  record: { wins: 0, losses: 0, draws: 0, ko: 0 },
  rank: 999,
  tier: "amateur",
  weightClass: "welter",
  fitness: 50,
  technique: 50,
  power: 50,
  defense: 50,
  chin: 50,
  injury: 0,
  fatigue: 0,
  fame: 0,
  currentOpponent: null,
  titles: [],
  history: []
}
```

### Core Loop

Train -> manage fatigue/injury -> book fight -> resolve fight -> rank up/down ->
chase belts and legacy.

### Actions

- Train conditioning.
- Train technique.
- Spar.
- Recover.
- Hire coach.
- Book tune-up fight.
- Book contender fight.
- Negotiate purse.
- Cut weight.
- Retire.

### Yearly Tick

- Age affects ceilings.
- Injury heals slowly.
- Fame drifts.
- Inactivity hurts ranking.
- Scheduled fights resolve if not manually resolved.

### Fight Resolution

Consider:

- player stats,
- opponent style,
- injury/fatigue,
- age,
- random variance,
- preparation quality.

Output:

- win/loss/draw,
- KO/TKO/decision,
- purse,
- injury change,
- fame/rank change,
- log line.

## 7. Billionaire

### State

```js
billionaireV1862: {
  active: false,
  familyOffice: { level: 0, staff: [] },
  liquidity: 0,
  holdings: [],
  leverage: 0,
  publicScrutiny: 0,
  politicalAccess: 0,
  philanthropy: 0,
  legacyProjects: [],
  acquisitions: [],
  history: []
}
```

### Core Loop

Allocate capital -> acquire/control assets -> manage liquidity/leverage ->
convert wealth into influence/legacy -> survive scrutiny and family disputes.

### Actions

- Buy asset.
- Sell asset.
- Acquire company.
- Hire family office staff.
- Launch foundation.
- Fund political access.
- Build legacy project.
- Restructure leverage.
- Set succession plan.

### Yearly Tick

- Holdings appreciate/depreciate.
- Leverage creates risk.
- Family office reduces mistakes.
- Public scrutiny follows flashy actions.
- Philanthropy improves reputation.
- Legacy projects mature.

## 8. Fame and Celebrity

State:

- fame,
- fanLoyalty,
- publicImage,
- mediaHeat,
- agent,
- brandValue,
- burnout,
- scandalRisk,
- projects.

Loop:

work -> gain fame -> manage media heat -> monetize brand -> avoid burnout and
scandal.

Integrations:

- career,
- money,
- relationships,
- politics,
- billionaire.

## 9. Politics

State:

- office,
- approval,
- campaignFunds,
- donorSupport,
- partyFavor,
- mediaHeat,
- scandal,
- policyWins,
- oppositionStrength.

Loop:

campaign -> win office -> pass policy -> manage coalition -> survive scandal ->
seek higher office.

Integrations:

- fame,
- billionaire,
- crime/corruption,
- family.

## 10. Dynasty

State:

- familyHead,
- heirs,
- familyWealth,
- trusts,
- reputation,
- successionStability,
- familyConflict,
- legacyScore.

Loop:

grow wealth/status -> prepare heirs -> manage succession -> preserve legacy
across generations.

Integrations:

- royalty,
- billionaire,
- trust/legal,
- family.

## 11. Real Estate Empire

State:

- properties,
- debt,
- cashFlow,
- occupancy,
- maintenance,
- marketCycle,
- managers,
- developmentProjects.

Loop:

acquire -> renovate -> rent -> refinance -> develop -> sell or hold.

Integration:

- finance ledger,
- debt,
- tax/legal,
- billionaire.

## 12. Racing

State:

- car,
- driverSkill,
- crew,
- sponsors,
- heat/regulation,
- rivalries,
- injuryRisk,
- raceHistory.

Loop:

tune -> practice -> race -> win money/fame -> upgrade -> enter higher series.

## 13. Music

State:

- skill,
- catalog,
- fans,
- streaming,
- labelInterest,
- tourEnergy,
- fame,
- burnout,
- releases.

Loop:

write -> record -> release -> tour -> grow fans -> choose label/independent.

## 14. Fashion and Luxury

State:

- brandHeat,
- taste,
- inventory,
- margin,
- celebrityAdoption,
- runwayScore,
- counterfeitRisk,
- collections.

Loop:

design -> produce -> launch -> seed influencers -> manage scarcity -> expand.

## 15. Secret Society

State:

- rank,
- secrecy,
- influence,
- favorsOwed,
- ritualKnowledge,
- internalRivalry,
- exposureRisk,
- members.

Loop:

initiate -> perform favors -> gain rank -> unlock influence -> manage secrecy.

## 16. Cross-Feature Systems

Shared systems worth extracting later:

- rank ladder helper,
- yearly action cooldown helper,
- risk cause composer,
- event choice modal helper,
- history/chart recorder,
- asset/debt row adapter,
- migration marker helper.

Only extract when at least two live features need the same helper.
