# Game Studio skill routing for Ledger

Use this note as the project-local handoff for browser-game work. The actual
Game Studio skills live in Codex; this file records when to use each one for
this repo.

Local copy of the umbrella skill: `dev-notes/codex-skills/game-studio/SKILL.md`.

For the full AI handoff and skill routing index, read
`dev-notes/ai-handoff/SKILL_INDEX.md`.

## Default routing

- Start with `game-studio:game-studio` when the request is broad, early, or spans
  gameplay, UI, assets, and QA.
- Use `game-studio:web-game-foundations` for core-loop design, save/debug
  boundaries, progression, failure states, and engine decisions.
- Use `game-studio:game-ui-frontend` for hub layouts, HUDs, menus, overlays,
  responsive panels, and visual hierarchy that must preserve the play surface.
- Use `game-studio:game-playtest` for browser smoke tests, screenshot QA, HUD
  overlap checks, and structured playtest reports.

## Specialist routes

- `game-studio:phaser-2d-game`: new 2D browser-game prototypes, canvas-heavy
  gameplay, sprites, tilemaps, arcade loops, and tactical grids.
- `game-studio:sprite-pipeline`: generated or normalized 2D sprite sheets,
  animation strips, anchors, and scale consistency.
- `game-studio:three-webgl-game`: plain Three.js / WebGL scenes with direct
  render-loop control.
- `game-studio:react-three-fiber-game`: React-hosted 3D scenes with shared React
  state and declarative scene composition.
- `game-studio:web-3d-asset-pipeline`: GLB/glTF cleanup, compression, collision,
  LOD, texture packaging, and runtime validation.

## Ledger-specific defaults

- Treat Ledger as an existing modular single-page game, not a blank engine.
- Prefer source modules under `pages/` and rebuild `dist/` only after source
  changes.
- For near-term Ledger work, favor `game-ui-frontend` and `game-playtest` first:
  the game already has deep simulation logic, so dashboard clarity and smoke
  testing usually pay off faster than a new engine layer.
- For new mini-games, default to Phaser only if the feature needs an actual
  playfield. For hub/dashboard features, stay in the current DOM-rendered system.

## Feature brief: Entrepreneurship Dashboard 2.0

Use `game-studio:game-ui-frontend` for the design pass and
`game-studio:game-playtest` for verification. This feature is a UI/UX upgrade
for the current DOM-rendered Entrepreneurship hub, not a new canvas/engine layer.

### Feature goal

Make the rebuilt Entrepreneurship system feel like a readable founder command
center instead of one long action panel. The simulation already has product,
team, funding, growth, IPO, grants, public-stock coupling, and history; this
feature should organize those systems so the player understands:

- what the company is worth,
- whether it is alive or in danger,
- what lever they can pull this year,
- why revenue/valuation/share price changed,
- and what the next milestone is.

### Player-facing success criteria

- Opening Entrepreneurship immediately shows the active company, founder status,
  cash/runway, valuation, yearly profit, customers, and next milestone.
- Founding a company returns the player to the Entrepreneurship page, not the
  legacy Business page.
- Business and Entrepreneurship remain separate: Business keeps entities, trust,
  family enterprise, and old managed companies; Entrepreneurship keeps founder
  startups/ported founder companies.
- Actions are grouped by player intent instead of file/history order:
  build product, grow demand, hire team, raise capital, go public/exit.
- IPO companies clearly explain public ownership, founder control, share price,
  and whether the broader market helped or hurt this year.
- Mobile layout stays usable without clipped buttons or horizontal overflow.

### UX structure

Keep the current Ledger visual language: dark parchment/ledger panels, compact
cards, small stat pills, and dense but readable game UI. Avoid making it look
like a generic SaaS dashboard.

Recommended active-company layout:

1. **Command header**
   - Company name, industry, model, stage, founder ownership/control.
   - Primary status chips: Cash, Runway, Valuation, Revenue, Profit, Customers.
   - One high-signal next-milestone line such as "Reach $10M revenue and 5 years
     to IPO" or "Runway under 6 months: raise, self-fund, or cut burn."
2. **Section tabs or segmented chips**
   - `Overview`: core metrics, next milestone, recent log/history.
   - `Product`: product stage, dev progress, dev focus, build/R&D actions.
   - `Growth`: marketing budget, customer growth, scale graph, growth actions.
   - `Team`: roles, payroll, hiring impact, hire/fire actions.
   - `Funding`: runway, self-fund, rounds, loans, grants, ownership/dilution.
   - `Public Market`: shown only after IPO; ticker, share price, market factor,
     founder shares, buy/sell own stock, control warning.
   - `Exit`: acquisition/IPO/close options, shown when relevant or as a compact
     late-game section.
3. **Portfolio rail**
   - Keep company switching compact and persistent near the top.
   - Show stage/value/status for each company.
   - Do not bury "Found another business" if the player can run another company.
4. **Old Business Check**
   - Keep it available but visually quieter unless there is an actual migration
     issue or duplicate to repair.

### Implementation boundaries

- Primary file: `pages/systems/entrepreneur.js`.
- Stay within the current render-string pattern; do not introduce a framework.
- Reuse existing helpers where possible: metric cards, action buttons, graph
  helpers, `renderBizGraphsV1861`, public-company helpers, and active-business
  state.
- Keep save data compatible. This feature should mostly reorganize rendering and
  call existing action handlers.
- Source is authoritative. Rebuild `dist/` after source changes.
- Fix stale copy while touching the file:
  - after founding, route to `entrepreneurship` instead of `business`;
  - remove text that says the new founder engine owns the Business hub;
  - update exported `EntrepreneurV1861.notes` if it still says the Business route
    is owned by the ported hub.

### Suggested implementation shape

- Add a small UI state field for the active section, preferably on
  `state.finance.bizV1860.activePanelV1862` or a similarly versioned key.
- Add `bizSetPanelV1862(panel)` to switch tabs, save, and rerender.
- Split the active-company renderer into focused render helpers:
  `renderBizCommandHeader`, `renderBizPanelTabs`, `renderBizOverviewPanel`,
  `renderBizProductPanel`, `renderBizGrowthPanel`, `renderBizTeamPanel`,
  `renderBizFundingPanel`, `renderBizPublicMarketPanel`, and
  `renderBizExitPanel`.
- Keep the old graph helpers, but place each graph near the decisions it
  explains instead of showing every graph at once.
- Use responsive CSS inside the existing entrepreneur style injection:
  - desktop: two-column content where useful, compact cards, sticky-ish tabs only
    if they do not overlap the app shell;
  - mobile: single column, horizontally scrollable tab chips, buttons wrap, no
    fixed overlays.

### Public-market visibility details

For IPO companies, the Public Market section should show:

- ticker and current share price,
- founder shares and ownership percentage,
- control status: CEO control kept/lost/restored,
- last price move if available,
- company fundamental anchor: valuation / shares,
- market factor label: market tailwind, flat market, or market headwind,
- action buttons for buying/selling own stock and custom buy/sell amounts.

If exact last-year market factor is not stored, add a small non-breaking field
when `_bizUpdateSharePriceV1861` runs, such as `biz.lastMarketFactorV1862` and
`biz.lastPriceMoveV1862`. Do not rewrite stock engine behavior just to support
the display.

### Game Studio QA plan

Use `game-playtest` style verification after implementation:

- Run `node --check` on touched JavaScript.
- Rebuild `dist/`.
- Run existing CDP smoke tests:
  - `.cdp-separation.js`
  - `.cdp-features.js`
  - `.cdp-ipo.js`
- Add or update a CDP smoke test for Dashboard 2.0:
  - Entrepreneurship renders command header and tabs.
  - Founding wizard creates a company and lands on Entrepreneurship.
  - Each tab can be selected without console errors.
  - Public Market tab appears after IPO and shows ticker/share/control details.
  - Business route still renders the old Business hub, not Entrepreneurship.
- Do screenshot QA at desktop and mobile widths:
  - no clipped buttons,
  - no overlapping tabs/actions,
  - no unreadable dense blocks,
  - horizontal chip rails scroll without visible page overflow,
  - key actions are visible without hunting.

### Acceptance checklist

- [ ] New company creation stays on Entrepreneurship.
- [ ] Business route remains separate.
- [ ] Active company has command header + grouped sections.
- [ ] Public companies explain ticker, ownership, control, and price movement.
- [ ] Existing Phase G/H behavior still works.
- [ ] `dist/` rebuilt after source changes.
- [ ] CDP and screenshot smoke checks pass.
