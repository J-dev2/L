# Ledger Project Context

This is the compact project overview for AI agents.

## What Ledger Is

Ledger LifeSim Modular v18.35 is a static modular browser life-sim game.

It uses:

- HTML entrypoints,
- modular JavaScript systems,
- global game state,
- render functions,
- generated bundled output.

It does not currently use a traditional backend server.

"Backend logic" means simulation code: state, actions, yearly ticks, finance,
migrations, random events, and save compatibility.

## Source vs Build

Edit source:

- `index.html`
- `play.html`
- `pages/`
- `styles/`
- `themes/`
- `state/`
- `assets/`
- `build/`

Do not hand-edit generated output:

- `dist/`

Build from repo root:

```powershell
& "C:\Users\jgodj\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" build\build-ledger18.js
```

## Boot Model

`index.html` is the landing/save gate.

`play.html` is the playable runtime.

Important rule:

- `index.html` should not load `pages/runtime/00-core-app-runtime.js`.
- `play.html` should receive explicit boot params such as `?slot=`, `?new=`, or
  `?sandbox=`.

## Load Order

`play.html` owns script order.

Later scripts can wrap or override earlier functions.

Before editing any feature:

1. Search for the visible text or function name.
2. Check `play.html` load order.
3. Check whether a later module overrides the behavior.
4. Confirm the live owner file.

## Screen Model

A game screen is usually:

- a hub id,
- a render function,
- action handlers,
- state initialization,
- optional yearly logic,
- optional CSS injection.

Adding a feature normally means editing a module in `pages/systems/`, not adding
a standalone HTML page.

## Current Major Separation

Business and Entrepreneurship are intentionally separate.

Business:

- managed companies,
- entities,
- trust,
- family enterprise,
- legacy Business hub.

Entrepreneurship:

- founder/startup journey,
- founder companies,
- grants,
- IPO,
- public-company/self-stock behavior.

Do not merge their state or routes unless explicitly asked.

## Premium UX Target

Ledger should feel:

- premium,
- classy,
- mature,
- dark and warm,
- readable,
- authored,
- game-like without cartoon clutter.

Preferred ingredients:

- editorial serif headings,
- tiny uppercase system labels,
- dark glass/ledger panels,
- gold/green/red/blue semantic accents,
- compact status chips,
- refined action pills,
- useful charts,
- restrained atmosphere.

Every major feature should answer:

1. What am I now?
2. What do I own or control?
3. What is the danger or opportunity?
4. What can I do this year?
5. What changed because of my last choice?

## Logic Target

Ledger logic should be:

- save-compatible,
- visible in UI,
- hard to double-count,
- guarded against old saves,
- clear over many years.

Every new feature should define:

- state shape,
- initializer,
- action handlers,
- yearly tick,
- risk model,
- progression,
- UI feedback,
- finance/net-worth impact if relevant,
- tests.

## Historical Notes

Historical notes remain in `dev-notes/` and should not be moved in this pass.

Some notes are stale. Trust source and the newest specialized note when there is
a conflict.
