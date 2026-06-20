# Ledger Simulation Patterns

Use this reference when implementing new Ledger gameplay systems or auditing old
ones. It explains how future systems should behave over many years.

## Table of Contents

1. Simulation Shape
2. State Schema Pattern
3. Action Pattern
4. Yearly Tick Pattern
5. Event Pattern
6. Progression Pattern
7. Risk Pattern
8. Money Pattern
9. Migration Pattern
10. Test Pattern
11. Feature Examples

## 1. Simulation Shape

A Ledger system should have:

- persistent state,
- player actions,
- yearly drift,
- random or conditional events,
- visible progression,
- visible risk,
- consequence logging,
- integration with other systems when relevant.

Avoid pure button-click systems that do not evolve with age.

## 2. State Schema Pattern

Use a feature object.

Example shape:

```js
state.finance.crimeV1862 = {
  active: false,
  rank: "none",
  heat: 0,
  reputation: 0,
  dirtyMoney: 0,
  cleanMoney: 0,
  crew: [],
  territory: [],
  yearlyActions: {},
  history: []
};
```

Rules:

- use arrays for repeated entities,
- use objects for keyed counts,
- use numeric fields for values that drift,
- use strings for rank/stage ids,
- use history arrays for UI charts/logs,
- keep old saves safe.

## 3. Action Pattern

Action handlers should follow the same rhythm:

1. Ensure state.
2. Read current player state.
3. Validate gates.
4. Validate costs.
5. Apply changes.
6. Add log/toast.
7. Save.
8. Rerender.

Actions should rarely be silent.

If an action can fail, the player should know why.

## 4. Yearly Tick Pattern

Yearly ticks create life-sim depth.

Good yearly ticks:

- drift risk,
- resolve pending jobs,
- pay income,
- apply maintenance costs,
- age relationships/entities,
- update ranks,
- roll events,
- write history.

Bad yearly ticks:

- apply huge hidden losses,
- double-pay assets,
- run twice per age-up,
- ignore locked/inactive state,
- create NaN values.

## 5. Event Pattern

Small events can be log-only.

Big events should be choices.

Event object pattern:

```js
{
  id: "rival-threat",
  title: "A rival makes a move",
  condition: function (s, feature) { return feature.rivalPressure > 40; },
  choices: [
    { label: "Negotiate", cost: 5000, effects: { heat: -3, loyalty: -2 } },
    { label: "Retaliate", cost: 10000, effects: { heat: 8, reputation: 5 } }
  ]
}
```

Keep event data readable.

## 6. Progression Pattern

Use rank tables.

Example:

```js
var CRIME_RANKS = [
  { id: "runner", label: "Runner", rep: 10, unlocks: ["small-jobs"] },
  { id: "lieutenant", label: "Lieutenant", rep: 50, unlocks: ["crew-orders"] }
];
```

Progression should include:

- id,
- label,
- requirements,
- unlocks,
- UI description.

Do not hide requirements in scattered if-statements if a table would be clearer.

## 7. Risk Pattern

Risk should be composed from causes.

Example:

```js
function crimeHeatRisk(c) {
  var causes = [];
  var risk = c.heat;
  if (c.dirtyMoney > 50000) { risk += 10; causes.push("large dirty cash"); }
  if (!c.legalDefense) { risk += 8; causes.push("no attorney"); }
  return { risk: clamp(risk, 0, 100), causes: causes };
}
```

The UI can then show why risk is high.

## 8. Money Pattern

Money should have ownership.

Ask:

- Who owns this money?
- Can the player spend it?
- Is it legal/clean?
- Is it debt?
- Is it valuation?
- Is it liquid?
- Does net worth count it?

Examples:

- Boxing purse: personal cash after tax/costs.
- Crime dirty money: not fully spendable until laundered.
- Royal estate: asset/income, not always liquid.
- Vampire territory: influence value, not direct cash.
- Billionaire holdings: asset value, not all liquid.

## 9. Migration Pattern

Migrations should be one-way but safe.

Pattern:

- detect old state,
- create new state,
- copy strongest values,
- mark source migrated if needed,
- gate old logic,
- add repair helper if duplicates can occur,
- log or surface migration issues only when actionable.

Never force users to restart old saves because a new system landed.

## 10. Test Pattern

Test the behavior, not just syntax.

Good checks:

- feature initializes from empty state,
- action changes expected fields,
- disabled action refuses correctly,
- yearly tick runs once,
- random event cannot create NaN,
- net worth changes once,
- migration is idempotent,
- render returns useful HTML.

Browser smoke tests should also check console errors.

## 11. Feature Examples

### Crime

Logic spine:

- actions create dirty money and heat,
- laundering converts dirty to clean,
- legal defense reduces heat spikes,
- crew loyalty affects job success,
- territory unlocks higher jobs,
- high heat triggers legal events.

### Boxing

Logic spine:

- training raises stats but increases fatigue/injury,
- recovery lowers injury risk,
- fights resolve from stats and opponent style,
- wins move rank,
- losses affect fame and confidence,
- age slowly reduces physical ceiling.

### Royalty

Logic spine:

- court actions raise influence,
- public actions raise approval,
- intrigue raises scandal risk,
- succession depends on heirs and alliances,
- estate income funds ceremonies,
- rivals act yearly.

### Vampire

Logic spine:

- feeding restores blood but can raise Masquerade risk,
- powers cost blood or humanity,
- coven standing unlocks politics,
- hunters react to secrecy failures,
- age unlocks power but increases political danger.

### Billionaire

Logic spine:

- holdings appreciate or crash,
- liquidity gates big moves,
- leverage magnifies risk,
- family office reduces complexity,
- philanthropy improves reputation,
- scrutiny creates legal/political events.
