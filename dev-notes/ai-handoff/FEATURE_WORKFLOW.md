# Ledger Feature Workflow

Use this workflow for future features such as crime, monsters, royalty,
vampires, boxing, billionaire, fame, politics, dynasty, racing, music, fashion,
or secret society systems.

## Step 1: Choose Skill Stack

Use:

- `ledger-ai-handoff` for orientation.
- `ledger-feature-ux` for presentation and premium feel.
- `ledger-system-logic` for state, yearly ticks, and economy.
- `game-studio:game-ui-frontend` for game UI layout.
- `game-studio:game-playtest` for visual/browser QA.

## Step 2: Define the Fantasy

Write one sentence:

- Crime: climb from petty jobs to organized power while managing heat.
- Boxing: train, fight, recover, and chase titles before age/injury catch up.
- Royalty: use ceremony, inheritance, court politics, and succession to build a
  dynasty.
- Vampire: balance blood, secrecy, power, hunters, and coven politics.
- Billionaire: allocate capital, control institutions, and convert money into
  legacy.

## Step 3: Define the First Screen

Every feature screen should answer:

1. What am I now?
2. What do I own or control?
3. What is the danger or opportunity?
4. What can I do this year?
5. What changed because of my last choice?

Preferred screen structure:

- command header,
- 4-7 status chips,
- progression card,
- action groups,
- risk/opportunity panel,
- consequence feed.

## Step 4: Define State

Create a feature state object with:

- active flag,
- rank/stage,
- main resources,
- main risks,
- yearly action counters,
- history/log arrays,
- repeated entities.

Use lazy initialization and versioned keys.

## Step 5: Define Actions

Group actions by intent:

- Build,
- Train,
- Recruit,
- Expand,
- Influence,
- Defend,
- Recover,
- Exit.

Each action should show:

- cost,
- requirement,
- risk,
- outcome.

## Step 6: Define Yearly Logic

A feature should evolve through age-up/yearly ticks.

Yearly logic can:

- drift risk,
- resolve events,
- pay income,
- apply costs,
- advance ranks,
- age entities,
- create opportunities,
- write history.

Guard against duplicate ticks.

## Step 7: Define Risk

Risk should be named and visible.

Examples:

- Crime: heat, rival pressure, betrayal.
- Boxing: injury, fatigue, age.
- Royalty: scandal, succession instability.
- Vampire: Masquerade risk, hunter attention.
- Billionaire: public scrutiny, leverage.

## Step 8: Define Integration

Decide whether the feature touches:

- money,
- net worth,
- finance ledger,
- legal/tax,
- trust/inheritance,
- family,
- career,
- Business,
- Entrepreneurship,
- stocks.

If yes, read `save-finance-integration.md`.

## Step 9: Implement Small v1

Build the smallest playable version:

- one hub,
- one state object,
- a progression spine,
- a few actions,
- yearly drift,
- visible consequence feed,
- mobile-safe layout.

Then deepen.

## Step 10: Verify

Run:

- syntax check on touched JS,
- build,
- route smoke test,
- age-up/yearly tick test,
- screenshot QA if UI changed,
- finance/net-worth checks if money changed.
