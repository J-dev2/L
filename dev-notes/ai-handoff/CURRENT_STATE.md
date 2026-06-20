# Ledger Current State

This summarizes the reliable current project state for AI agents.

## Repo State

Ledger is currently organized as a modular v18.35 static browser game.

Main source entrypoints:

- `index.html`
- `play.html`

Main source folders:

- `pages/`
- `state/`
- `styles/`
- `themes/`
- `build/`

Generated output:

- `dist/`

## Reliable Recent Notes

Most useful current notes:

- `dev-notes/ENTREPRENEURSHIP_REBUILD.md`
- `dev-notes/CREDIT_REDESIGN_PLAN.md`
- `dev-notes/GAME_STUDIO_SKILLS.md`
- `AI_DEV_README.md`
- `dev-notes/ai-handoff/`

## Stale Note Warning

`dev-notes/SESSION_SUMMARY.md` is useful as historical context, but it appears
stale in at least one place. It says scroll-nav Part E was not done, while source
shows the scroll-nav work is already implemented.

Always verify against source before acting on this note.

## Entrepreneurship

The Entrepreneurship rebuild is the latest major feature work.

Current reliable shape:

- Entrepreneurship is separate from Business.
- Entrepreneurship owns founder/startup style companies.
- Business owns managed companies, entities, trust, and family enterprise.
- Entrepreneurship includes deeper founder systems, graphs, IPO/public-company
  behavior, grants, and stock coupling.

Known polish target:

- Dashboard 2.0 is recommended to better organize the active company panel.
- Founding should stay on Entrepreneurship, not route back to Business.
- Stale copy that says Entrepreneurship owns Business should be removed when
  touching that module.

## Business

Business has shipped uniqueness upgrades:

- 100 businesses across 10 sectors,
- unique signature actions,
- sector meters,
- market events,
- rivals,
- business challenge/event layers.

Do not collapse Business into Entrepreneurship.

## Credit and Finance

Credit redesign is marked complete:

- unified credit-card limit helper,
- score-tiered secured-loan APR,
- personal line of credit,
- operating businesses in finance/net worth.

Finance is sensitive. For any money/net-worth change, read:

- `dev-notes/codex-skills/ledger-system-logic/references/save-finance-integration.md`

## UX Direction

The preferred visual direction is premium Ledger style:

- dark warm panels,
- serif headings,
- tiny uppercase labels,
- gold values,
- compact action chips,
- useful charts and status cards,
- refined but readable density.

For UX work, read:

- `dev-notes/codex-skills/ledger-feature-ux/references/premium-ledger-style.md`

## AI Handoff Additions

This handoff system now exists to orient future agents:

- `dev-notes/ai-handoff/START_HERE.md`
- `dev-notes/ai-handoff/PROJECT_CONTEXT.md`
- `dev-notes/ai-handoff/SKILL_INDEX.md`
- `dev-notes/ai-handoff/CURRENT_STATE.md`
- `dev-notes/ai-handoff/FEATURE_WORKFLOW.md`
- `dev-notes/ai-handoff/TESTING_AND_BUILD.md`

The root `AI_DEV_README.md` remains the easy top-level entry.
