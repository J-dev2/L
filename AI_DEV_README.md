# AI Dev README for Ledger

This is the first file an AI coding agent should read before changing Ledger.
It is written for Codex, Claude, local LLMs, and future assistants.

After this file, read `dev-notes/ai-handoff/START_HERE.md`. That folder is the
organized AI handoff hub for this project.

## What Ledger Is

Ledger is a modular single-page life simulation game.

It is not a normal multi-page website.

It is not currently a traditional server-backed app.

Most "backend" work in this repo means gameplay simulation logic:

- save-state schema,
- action handlers,
- yearly ticks,
- event rolls,
- migrations,
- finance and net-worth integration,
- UI contracts,
- tests and smoke checks.

## Read First

Before editing code, read:

1. `dev-notes/ai-handoff/START_HERE.md` - organized handoff front door.
2. `README.md` - project overview and startup rules.
3. `PAGES.md` - where screens and systems live.
4. `dev-notes/ai-handoff/PROJECT_CONTEXT.md` - compact project summary.
5. `dev-notes/ai-handoff/SKILL_INDEX.md` - which skill to use.
6. `dev-notes/codex-skills/ledger-feature-ux/SKILL.md` - project UX skill.
7. `dev-notes/codex-skills/ledger-system-logic/SKILL.md` - logic skill.

For premium UI/UX work, also read:

- `dev-notes/codex-skills/ledger-feature-ux/references/premium-ledger-style.md`
- `dev-notes/codex-skills/ledger-feature-ux/references/ledger-ux-pattern-library.md`

For future feature concepts like crime, monsters, vampires, royalty, boxing, and
billionaire systems, also read:

- `dev-notes/codex-skills/ledger-feature-ux/references/feature-archetypes.md`
- `dev-notes/codex-skills/ledger-system-logic/references/feature-logic-blueprints.md`

For save, money, asset, debt, business, trust, tax, inheritance, or stock work,
also read:

- `dev-notes/codex-skills/ledger-system-logic/references/save-finance-integration.md`

For another AI agent or local LLM entering the project cold, also read:

- `dev-notes/codex-skills/ledger-system-logic/references/ai-agent-workflow.md`

## Source vs Build

Edit source files.

Do not hand-edit generated `dist/` files.

Source:

- `index.html`
- `play.html`
- `pages/`
- `styles/`
- `themes/`
- `state/`
- `assets/`
- `build/`

Generated output:

- `dist/`

After source changes, rebuild:

```powershell
node build\build-ledger18.js
```

## Boot Model

`index.html` is the landing/save gate.

`play.html` is the runtime.

Important rule:

- `index.html` should not load `pages/runtime/00-core-app-runtime.js`.
- `play.html` should receive an explicit boot command such as `?slot=`, `?new=`,
  or `?sandbox=`.

This prevents the old active-slot auto-load bug.

## App Model

Ledger is a single-page app made of:

- global game state,
- render functions,
- action handlers,
- yearly simulation wrappers,
- modular systems,
- generated bundles.

A "page" is usually a hub render, not a separate HTML page.

Adding a feature usually means:

- add or extend a module in `pages/systems/`,
- add route handling if needed,
- add state initialization,
- add action handlers,
- add yearly logic if needed,
- add CSS following existing patterns,
- rebuild `dist/`.

## Load Order

`play.html` controls script order.

Later scripts can override earlier renderers and wrap global functions.

Before changing behavior:

1. Search the function name.
2. Check whether a patch or later system overrides it.
3. Check `play.html` for load position.
4. Confirm the live route uses the module you plan to edit.

Use `rg` first.

## Current Important Split

Business and Entrepreneurship are separate.

Business:

- entities,
- managed companies,
- trust,
- family enterprise,
- old business hub.

Entrepreneurship:

- founder/startup journey,
- founder companies,
- grants,
- IPO,
- public-company/self-stock behavior.

Do not merge these unless the user explicitly requests a redesign.

## Premium UX Target

Ledger should feel premium, classy, mature, and authored.

Use:

- editorial serif titles,
- tiny uppercase system labels,
- dark warm panels,
- gold/green/red/blue semantic accents,
- compact cards,
- visible status chips,
- refined action pills,
- useful charts,
- restrained atmosphere.

Avoid:

- generic SaaS dashboards,
- bright cartoon UI,
- random gradients,
- huge instruction blocks,
- decorative clutter,
- ungrouped button dumps.

Every major feature screen should answer:

1. What am I now?
2. What do I own or control?
3. What is the danger or opportunity?
4. What can I do this year?
5. What changed because of my last choice?

## Logic Target

Ledger logic should be:

- save-compatible,
- visible in the UI,
- deterministic where possible,
- easy to audit,
- hard to double-count,
- fun across many years.

For every feature, define:

- state shape,
- initializer,
- player actions,
- yearly tick,
- risk model,
- progression ladder,
- unlocks,
- event outcomes,
- UI feedback,
- finance/net-worth integration if relevant,
- migration behavior,
- tests.

## State Rules

Preserve old saves.

Use lazy initialization:

- If an object is missing, create it.
- If an array is missing, create it.
- If a number is invalid, default it.
- If data exists, do not clobber it.

Prefer versioned keys:

- `crimeV1862`
- `boxingV1862`
- `royaltyV1862`
- `vampireV1862`
- `billionaireV1862`

Use local project naming patterns over invented conventions.

## Yearly Tick Rules

Yearly logic usually wraps `resolveLifeAndFinanceYear`.

When wrapping:

- store the previous function,
- call it exactly once,
- avoid duplicate wrappers,
- avoid double-ticking migrated systems,
- guard inactive systems,
- log important outcomes,
- cap noisy events,
- keep UI and logic consistent.

Do not silently apply major losses.

If the game tells the player risk exists, show the risk causes.

## Money Rules

Be careful with money.

Different money buckets are not interchangeable:

- personal cash,
- checking/savings,
- business cash,
- company valuation,
- dirty money,
- trust corpus,
- debt,
- stock holdings,
- family office assets.

Before adding a money mechanic, decide:

- Is this spendable cash?
- Is this an asset?
- Is this a debt?
- Is this yearly income?
- Is this company cash?
- Is this taxable?
- Is this counted in net worth?

Avoid double counting.

If a value appears in net worth, know exactly where it is counted.

## UI + Logic Contract

The UI and logic must agree.

If the UI says:

- once per year,
- inflows only,
- unlocks at rank 5,
- heat is 70,
- score gives $2M credit,
- this asset counts in net worth,

then the code must enforce the same rule.

When in doubt, create one shared helper and route display/enforcement through it.

## Feature Workflow

For a new feature like crime, monsters, royalty, vampires, boxing, or
billionaire gameplay:

1. Read the UX skill references.
2. Read the logic skill.
3. Pick the hub or route.
4. Define the fantasy sentence.
5. Define the progression ladder.
6. Define the state shape.
7. Build the first useful screen.
8. Add action handlers.
9. Add consequence logging.
10. Add yearly simulation.
11. Add random events.
12. Integrate finance/net worth if needed.
13. Add responsive CSS.
14. Rebuild `dist/`.
15. Run syntax and smoke checks.

## Choosing UX vs Logic

Most real Ledger features need both UX and logic.

Use UX first when the task is about:

- how it should look,
- what the player sees first,
- how actions are grouped,
- how it feels premium,
- what the hub layout should be,
- what screenshots should look like.

Use logic first when the task is about:

- state shape,
- yearly outcomes,
- money movement,
- risk formulas,
- rank progression,
- save migration,
- net worth,
- old systems,
- tests.

For a big feature, do both:

1. UX fantasy and screen structure.
2. Logic state and simulation.
3. UI/logic contract.
4. Implementation.
5. QA.

## UI/Logic Contract Examples

Crime:

- UI shows Heat 80 and "raid risk high."
- Logic must actually use Heat 80 to increase raid chance.
- Legal defense button must reduce either heat, consequence severity, or both.

Boxing:

- UI shows Injury Risk 62.
- Fight simulation must use injury risk.
- Recovery actions must visibly lower injury/fatigue.

Royalty:

- UI shows Succession Strength.
- Yearly succession events must use that value.
- Heir education/marriage actions must affect it.

Vampire:

- UI shows Masquerade Risk.
- Feeding and power use must alter that risk.
- Hunter events must depend on it.

Billionaire:

- UI shows Liquidity and Net Worth separately.
- Big purchases must require liquidity, not total net worth.
- Holdings should affect net worth without becoming spendable cash.

## Testing

At minimum, run syntax checks on touched JS:

```powershell
node --check pages\systems\YOUR_FILE.js
```

Then rebuild.

Use existing CDP smoke patterns when browser behavior matters.

Known smoke tests include:

- `.cdp-separation.js`
- `.cdp-features.js`
- `.cdp-ipo.js`

For future features, add targeted tests for:

- route renders,
- action handler changes state,
- age-up/yearly tick works,
- old saves initialize safely,
- no console errors,
- mobile layout does not clip.

## AI Agent Rules

Do:

- read source before editing,
- preserve user work,
- keep edits scoped,
- follow existing patterns,
- update dev notes when handoff context changes,
- make risks and consequences visible,
- rebuild after source changes.

Do not:

- edit `dist/` by hand,
- revert unrelated changes,
- introduce a new frontend framework for a DOM hub,
- merge separate systems accidentally,
- add hidden simulation logic with no UI,
- create pretty panels that do not help gameplay.

## Handoff Notes

If you stop mid-feature, update `dev-notes/SESSION_SUMMARY.md` or create a
focused note in `dev-notes/`.

Include:

- what changed,
- what files matter,
- what is incomplete,
- what tests passed,
- what tests remain,
- any important decisions.

## Final Standard

A feature is not done because it has buttons.

A feature is done when the player can understand the system, make a meaningful
choice, see consequences, and continue the story across years.
