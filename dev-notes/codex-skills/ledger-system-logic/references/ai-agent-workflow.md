# Ledger AI Agent Workflow

Use this reference when Codex, Claude, or a local LLM is about to work on Ledger.
It is intentionally explicit. The goal is to reduce wrong-file edits, accidental
system merges, hidden logic, broken saves, and generated-output churn.

## Table of Contents

1. Agent Mission
2. First 10 Minutes
3. Source Map
4. Investigation Workflow
5. Planning Workflow
6. Implementation Workflow
7. Review Workflow
8. Handoff Workflow
9. Common Failure Modes
10. Agent Prompts

## 1. Agent Mission

The agent's job is not just to make code pass.

The job is to keep Ledger coherent:

- premium UI,
- readable life-sim systems,
- save-compatible logic,
- no duplicate yearly ticks,
- no hidden economy breaks,
- source edits only,
- clear handoff notes.

The agent should behave like a careful senior game-systems engineer.

## 2. First 10 Minutes

Before coding:

1. Read `AI_DEV_README.md`.
2. Read `README.md`.
3. Read `PAGES.md`.
4. Read the most relevant dev note.
5. Inspect `play.html` for load order.
6. Search the target feature by visible text and function names.
7. Confirm whether `dist/` is generated.
8. Identify tests or CDP probes.
9. Identify whether UX or logic skill references apply.
10. Write down the current active owner module.

Do not edit until the active owner module is known.

## 3. Source Map

Common locations:

- Runtime core: `pages/runtime/00-core-app-runtime.js`
- Modular systems: `pages/systems/*.js`
- Hub route bridges: `pages/hubs/*.js`
- Save gate: `pages/landing/landing-page.js`
- Build script: `build/build-ledger18.js`
- Generated output: `dist/`
- Handoff notes: `dev-notes/`

Feature work usually belongs in `pages/systems/`.

Do not add a new source root casually.

## 4. Investigation Workflow

Use searches like:

```powershell
rg "visible text" pages
rg "functionName" pages
rg "state.finance" pages/systems
rg "resolveLifeAndFinanceYear" pages
rg "renderHubContent" pages
```

When a function appears multiple times:

- check load order,
- check wrappers,
- check whether a newer module overrides it,
- check whether the old version is dead code.

Never assume the first search hit is live.

## 5. Planning Workflow

For any feature, define:

- player fantasy,
- state shape,
- route/hub,
- action groups,
- yearly tick,
- risk model,
- progression ladder,
- finance integration,
- UI display,
- save compatibility,
- tests.

If the user asks for "premium" or "classy", use `ledger-feature-ux`.

If the user asks for "backend", "logic", "systems", "how it works", or
"future features", use this skill.

## 6. Implementation Workflow

Good implementation rhythm:

1. Add or extend initializer.
2. Add data tables.
3. Add pure helper functions.
4. Add action handlers.
5. Add yearly tick wrapper.
6. Add render sections.
7. Add CSS.
8. Add tests/probes.
9. Rebuild.
10. Update dev notes.

Prefer data tables for ranks, events, costs, and unlocks.

Prefer helper functions for repeated math.

Avoid scattering constants through render strings.

## 7. Review Workflow

After editing, check:

- Syntax passes.
- Build succeeds.
- Route renders.
- No console errors.
- Old saves initialize.
- Actions save and rerender.
- Age-up runs once.
- Money is counted once.
- Mobile layout does not clip.
- Dev notes are accurate.

If a change touches finance, be extra suspicious.

## 8. Handoff Workflow

Update or create a dev note when work is meaningful.

Handoff should include:

- current status,
- changed files,
- important decisions,
- tests run,
- tests not run,
- known risks,
- next step.

Do not leave only chat context.

Claude or a local LLM may enter later and need the file trail.

## 9. Common Failure Modes

Avoid these:

- editing `dist/` directly,
- changing a dead render function,
- wrapping yearly logic twice,
- applying money deltas twice,
- showing a number that logic does not enforce,
- migrating a system and leaving old income active,
- adding UI with no state persistence,
- adding state with no UI feedback,
- making a new feature visually disconnected from Ledger,
- breaking Business/Entrepreneurship separation.

## 10. Agent Prompts

Useful prompt for a future AI:

"Read `AI_DEV_README.md`, `PAGES.md`, and the relevant Ledger skill files before
editing. Identify the live owner module and load order first. Preserve saves,
edit source only, rebuild dist after source changes, and update dev notes."

Useful prompt for UX feature planning:

"Use `ledger-feature-ux` and read `premium-ledger-style.md`,
`ledger-ux-pattern-library.md`, and `feature-archetypes.md`. Produce a Ledger
feature design with command header, metrics, action groups, progression, risk,
consequence feed, mobile behavior, and tests."

Useful prompt for systems planning:

"Use `ledger-system-logic` and read `simulation-patterns.md`,
`feature-logic-blueprints.md`, and `save-finance-integration.md`. Produce state
shape, action handlers, yearly tick, risk model, migrations, finance impact, and
test plan."
