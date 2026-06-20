---
name: ledger-system-logic
description: Design, audit, and implement Ledger LifeSim simulation logic, backend-style gameplay systems, yearly ticks, save-state schemas, migrations, finance and net-worth integration, action handlers, risk models, and cross-module behavior. Use for Ledger features that need game logic beyond visual UX, including crime, monsters, vampires, royalty, boxing, billionaire systems, business, finance, family, career, and future expansion mechanics.
---

# Ledger System Logic

## Purpose

Use this skill when a Ledger feature needs durable gameplay logic.

This is the backend-style brain for a static browser game:

- state schemas,
- action handlers,
- yearly simulation,
- random events,
- migrations,
- finance integration,
- risk systems,
- progression,
- tests.

Ledger does not currently use a traditional server backend. Treat "backend" as
the simulation layer that lives in JavaScript modules.

## Core Standard

Good Ledger logic is:

- visible in the UI,
- save-compatible,
- hard to double-count,
- easy to audit,
- guarded against old saves,
- fun across many years,
- not just one-click money printing.

Every mechanic should answer:

1. Where is the state stored?
2. How is it initialized?
3. What changes when the player clicks?
4. What changes every year?
5. What can fail?
6. How does the UI explain it?
7. How is it tested?

## Required Reading

Before changing logic, read:

- `AI_DEV_README.md`
- `README.md`
- `PAGES.md`
- relevant `dev-notes/*.md`
- the active module under `pages/systems/`
- `play.html` load order

If the feature is visual too, also use `ledger-feature-ux`.

## Deep Reference

Read `references/simulation-patterns.md` when designing a new major feature,
auditing a yearly system, adding migrations, or deciding how actions, risks,
events, money, and progression should work over many years.

Read `references/ai-agent-workflow.md` when another AI agent needs a reliable
step-by-step work process for Ledger, especially Claude or a local LLM.

Read `references/feature-logic-blueprints.md` when planning future expansions
such as crime, monsters, vampires, royalty, boxing, billionaire, fame, politics,
dynasty, real estate, racing, music, or fashion.

Read `references/save-finance-integration.md` when a feature touches saves,
migrations, money, assets, debt, taxes, net worth, stocks, trust, businesses, or
inheritance.

## Source Rules

Edit source files only.

Do not hand-edit `dist/`.

Rebuild after source changes.

Use existing module patterns.

Avoid new frameworks for simulation logic.

## State Design

Store new feature state under the most relevant branch.

Common homes:

- `state.finance` for money, business, assets, companies, debt, investments.
- existing family structures for relationships and children.
- `state.stats` for core personal stats.
- a feature-specific object under `state` or `state.finance` for major hubs.

Use versioned keys when appropriate:

- `crimeV1862`
- `royaltyV1862`
- `boxingV1862`
- `vampireV1862`
- `billionaireV1862`

Use lazy initialization.

Do not assume old saves have new fields.

## Initializers

Every feature should have an `ensure...State` style helper.

It should:

- create missing objects,
- create missing arrays,
- sanitize numeric values,
- preserve existing data,
- set defaults only when fields are missing,
- return the feature state.

Avoid clobbering existing nested objects.

## Action Handlers

Action handlers should:

- validate state,
- validate unlocks,
- validate cost,
- enforce cooldowns,
- apply changes,
- log outcome,
- save,
- rerender.

Use specific names.

Good:

- `runSmallJobCrimeV1862`
- `trainFootworkBoxingV1862`
- `hostCourtBanquetRoyaltyV1862`

Weak:

- `doAction`
- `process`
- `submitFeature`

## Yearly Simulation

Yearly logic usually wraps `resolveLifeAndFinanceYear`.

Rules:

- Store the previous function.
- Call it once.
- Run feature tick intentionally before or after.
- Guard against duplicate wrappers.
- Skip inactive or migrated systems.
- Log major outcomes.
- Cap noisy random events.

Adapt wrapper style to the local code.

Do not blindly paste a wrapper if the repo already has a safer pattern.

## Money Logic

Be explicit about money locations.

Personal cash is not the same as:

- business cash,
- trust corpus,
- company valuation,
- dirty money,
- investments,
- debt,
- line of credit,
- estate assets.

Before adding money logic, decide:

- Is this spendable personal cash?
- Is this an asset value?
- Is this debt?
- Is this company cash?
- Is this yearly income?
- Should it affect net worth?

Avoid double counting.

## Risk Logic

Every major feature needs visible risk.

Risk should have:

- named causes,
- visible current level,
- mitigation actions,
- failure outcomes,
- year-to-year movement.

Examples:

- Crime: heat, rival pressure, betrayal.
- Boxing: injury, bad weight cut, aging.
- Royalty: scandal, succession instability, rival claim.
- Vampire: Masquerade breach, hunter trail, hunger.
- Billionaire: public scrutiny, leverage, legal exposure.

Do not use invisible random punishment without UI explanation.

## Progression Logic

Progression should be explicit.

Define:

- ranks,
- requirements,
- unlocks,
- rewards,
- failure or demotion conditions.

Show current and next rank in the UI.

Keep requirements inspectable as data when practical.

## Random Events

Random events should feel authored.

Good event data includes:

- id,
- title,
- description,
- conditions,
- choices,
- outcomes,
- cooldown or cap.

Use choice modals for big events.

Use log lines for small yearly flavor.

Cap events that can spam.

## Migrations

When replacing or absorbing an old system:

- identify old state,
- migrate once,
- mark migrated records,
- gate old yearly ticks,
- avoid double income,
- repair duplicates if needed,
- keep old saves playable.

Never assume every save starts fresh.

## Finance Integration

If a feature creates meaningful assets or debts, integrate with finance.

Check:

- net worth helper,
- finance ledger asset rows,
- debt rows,
- More summary,
- yearly income,
- tax/legal impact if relevant.

Document where the value is counted.

Avoid counting the same value in two places.

## UI Contract

Logic and UI must match.

If the UI says:

- "inflows only,"
- "once per year,"
- "risk 20/100,"
- "unlocks at rank 5,"
- "net worth includes this,"

then the logic must enforce the same thing.

When UI and logic disagree, fix the shared source of truth.

## Feature Blueprint: Crime

State:

- rank,
- heat,
- dirtyMoney,
- cleanMoney,
- crew,
- loyalty,
- territory,
- legalDefense,
- rivalPressure,
- yearlyActions,
- history.

Yearly:

- heat decays or rises,
- legal pressure resolves,
- crew loyalty drifts,
- rivals act,
- dirty money creates risk,
- territory produces opportunities.

Actions:

- run job,
- launder money,
- recruit crew,
- pay crew,
- lay low,
- hire attorney,
- expand territory,
- negotiate with rival.

## Feature Blueprint: Boxing

State:

- record,
- rank,
- weightClass,
- fitness,
- technique,
- power,
- defense,
- injury,
- camp,
- opponent,
- purses,
- titles,
- history.

Yearly:

- aging affects physical stats,
- injuries heal or worsen,
- ranking changes,
- sponsor/fame changes,
- scheduled fight resolves if applicable.

Actions:

- train,
- spar,
- recover,
- book fight,
- hire coach,
- cut weight,
- negotiate purse,
- retire.

## Feature Blueprint: Royalty

State:

- title,
- succession,
- influence,
- publicApproval,
- estateIncome,
- scandals,
- alliances,
- rivals,
- heirs,
- ceremonies.

Yearly:

- estate income,
- court favor drift,
- scandals cool down or explode,
- succession events,
- rival moves.

Actions:

- host banquet,
- arrange marriage,
- secure heir,
- improve estate,
- handle scandal,
- court monarch,
- expose rival.

## Feature Blueprint: Vampire

State:

- rank,
- blood,
- masqueradeRisk,
- covenStanding,
- powers,
- thralls,
- territory,
- hunterAttention,
- humanity,
- age.

Yearly:

- hunger pressure,
- hunter trail changes,
- coven politics,
- power growth,
- thrall loyalty,
- secrecy consequences.

Actions:

- feed discreetly,
- clean evidence,
- attend court,
- train power,
- claim territory,
- manage thrall,
- misdirect hunters.

## Feature Blueprint: Billionaire

State:

- liquidity,
- holdings,
- familyOffice,
- publicScrutiny,
- politicalAccess,
- philanthropy,
- legacyProjects,
- leverage,
- acquisitions.

Yearly:

- holdings move,
- cash flow resolves,
- scrutiny changes,
- philanthropy affects reputation,
- acquisitions integrate or fail,
- family office reduces risk.

Actions:

- acquire asset,
- sell asset,
- hire family office team,
- launch foundation,
- lobby,
- fund legacy project,
- restructure debt.

## Cross-System Rules

When a feature touches another system:

- identify the owning module,
- use existing helpers if available,
- avoid bypassing save/render patterns,
- avoid duplicate yearly hooks,
- avoid duplicate net-worth values.

Examples:

- Crime dirty money may become clean money through finance/legal systems.
- Boxing fame may affect celebrity or income.
- Royalty marriage may affect family.
- Vampire secrecy may affect relationships and legal danger.
- Billionaire acquisitions may affect business and finance.

## Testing

At minimum:

- syntax check touched JS,
- run existing smoke tests,
- add a small deterministic harness for new logic when possible,
- verify old saves with missing state do not crash,
- verify one age-up does not double-tick,
- verify UI displayed numbers match enforced logic.

For high-risk finance features:

- test net worth before/after,
- test debt rows,
- test asset rows,
- test negative money paths,
- test old save migration.

## Output Expectations

When planning logic, provide:

- state shape,
- action handlers,
- yearly tick,
- risk model,
- progression model,
- UI contract,
- migration notes,
- test plan.

When implementing logic:

- keep edits scoped,
- preserve saves,
- expose outcomes,
- run checks,
- rebuild dist.

## Final Reminder

Ledger logic should create stories over time.

Numbers should move because the player understands what they did.
