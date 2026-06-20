---
name: ledger-ai-handoff
description: Orient AI agents before Ledger LifeSim development. Use when Codex, Claude, a local LLM, or another assistant needs to read the project handoff, understand source/build rules, choose Ledger-specific UX and system-logic skills, avoid stale notes, and prepare to work safely on Ledger before coding.
---

# Ledger AI Handoff

## Purpose

Use this skill before working on Ledger.

This is the orientation skill. It does not replace:

- `ledger-feature-ux` for premium UX and feature presentation.
- `ledger-system-logic` for simulation/backend-style logic.
- `game-studio:*` for game UI, playtest, and asset workflows.

It tells an AI agent where to start and what to read.

## Required First Read

Read these files in order:

1. `AI_DEV_README.md`
2. `dev-notes/ai-handoff/START_HERE.md`
3. `dev-notes/ai-handoff/PROJECT_CONTEXT.md`
4. `dev-notes/ai-handoff/CURRENT_STATE.md`
5. `dev-notes/ai-handoff/SKILL_INDEX.md`

Then choose task-specific references:

- Future feature work: `dev-notes/ai-handoff/FEATURE_WORKFLOW.md`
- Testing/build decisions: `dev-notes/ai-handoff/TESTING_AND_BUILD.md`
- UX/premium design: `dev-notes/codex-skills/ledger-feature-ux/SKILL.md`
- Simulation/backend logic: `dev-notes/codex-skills/ledger-system-logic/SKILL.md`

## Core Rules

- Edit source files, not generated `dist/`.
- Keep old historical notes in place.
- Verify stale notes against source.
- Preserve saves.
- Keep Business and Entrepreneurship separate.
- Rebuild `dist/` after source changes.
- Pair gameplay logic with visible UI feedback.

## How to Start a Task

1. Read the required handoff files.
2. Identify whether the task is UX, logic, testing, or docs.
3. Read the matching skill.
4. Search source for the live owner module.
5. Check `play.html` load order.
6. Make the smallest scoped change.
7. Run only the checks needed for the changed files.
8. Update handoff notes if the project state changes.

## Skill Routing

Use `ledger-feature-ux` when the user asks:

- how a feature should look,
- how to make it premium/classy,
- how actions should be presented,
- how crime/royalty/vampires/boxing/billionaire features should feel.

Use `ledger-system-logic` when the user asks:

- how the feature works,
- state shape,
- yearly ticks,
- finance/net-worth integration,
- migrations,
- risk/progression systems.

Use `game-studio:game-ui-frontend` when the work is browser-game UI.

Use `game-studio:game-playtest` when screenshots, console checks, or playtest QA
matter.

## Handoff Standard

When finishing meaningful work, leave the next agent with:

- files changed,
- current status,
- decisions made,
- tests run,
- tests not run,
- known risks,
- next recommended step.

Prefer updating `dev-notes/ai-handoff/CURRENT_STATE.md` for broad project state
and a focused dev note for feature-specific work.

## Final Reminder

This skill is the front door.

Do not stay here once the task is clearly UX, logic, or playtest. Route to the
specific skill and continue.
