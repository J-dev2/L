# Ledger AI Handoff - Start Here

Read this before changing Ledger. This handoff is for Codex, Claude, local LLMs,
and any future AI coding agent.

## Required First Reads

1. `AI_DEV_README.md`
2. `README.md`
3. `PAGES.md`
4. `dev-notes/ai-handoff/PROJECT_CONTEXT.md`
5. `dev-notes/ai-handoff/CURRENT_STATE.md`
6. `dev-notes/ai-handoff/SKILL_INDEX.md`

Then read the task-specific handoff:

- UX or premium visual work: `dev-notes/codex-skills/ledger-feature-ux/SKILL.md`
- Gameplay/backend logic: `dev-notes/codex-skills/ledger-system-logic/SKILL.md`
- New feature concepts: `dev-notes/ai-handoff/FEATURE_WORKFLOW.md`
- Testing/build questions: `dev-notes/ai-handoff/TESTING_AND_BUILD.md`

## Hard Rules

- Edit source, not `dist/`.
- Do not move or delete old `dev-notes/` files in routine work.
- Verify source before trusting stale notes.
- Preserve old saves.
- Keep Business and Entrepreneurship separate.
- Rebuild `dist/` after source changes.
- Do not add hidden logic without UI feedback.

## Fast Orientation

Ledger is a modular single-page life sim.

`index.html` is the landing/save gate.

`play.html` is the runtime.

Most screens are render functions inside `pages/systems/` or `pages/hubs/`, not
separate HTML pages.

The project wants future features to feel premium, classy, readable, and
well-thought-through.

## If You Are Unsure

Search before editing:

```powershell
rg "visible text" pages
rg "functionName" pages
rg "renderHubContent" pages
rg "resolveLifeAndFinanceYear" pages
```

Then check `play.html` load order.

## When You Finish

For meaningful work, update a dev note with:

- changed files,
- decisions,
- tests run,
- tests not run,
- remaining risks,
- next step.
