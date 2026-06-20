---
name: ledger-feature-ux
description: Design polished UX for Ledger LifeSim feature expansions such as crime, monsters, royalty, vampires, boxing, billionaire systems, careers, businesses, relationship arcs, and other new gameplay hubs. Use when Codex needs to plan or implement how a new Ledger feature should look, be organized, feel refined, fit the existing modular DOM-rendered game, preserve save-state clarity, and pass desktop/mobile UI QA.
---

# Ledger Feature UX

## Purpose

Use this skill to make new Ledger features feel like premium playable systems,
not loose piles of buttons.

Apply it when adding or planning features such as:

- Crime expansion
- Monster or supernatural systems
- Royalty, aristocracy, dynasties, courts, and succession
- Vampires, immortality, covens, hunters, and secret societies
- Boxing, sports careers, tournaments, training camps, titles, and rivalries
- Billionaire gameplay, family offices, acquisitions, yachts, philanthropy, and legacy
- Any new hub, minigame-like progression, social faction, empire system, or prestige path

## Core Lens

Treat Ledger as a life simulator with layered systems.

Every feature must answer five player questions quickly:

1. What am I now?
2. What do I own or control?
3. What is the danger or opportunity?
4. What can I do this year?
5. What changed because of my last choice?

If the screen does not answer those questions, refine the UX before adding more
mechanics.

## Project Context

Ledger is a modular single-page game.

Use the existing source structure:

- Edit source modules under `pages/`.
- Keep feature systems in `pages/systems/` unless a local pattern says otherwise.
- Keep route labels and hub bridges in `pages/hubs/`.
- Keep generated output in `dist/` as build output only.
- Use existing render-string patterns.
- Prefer DOM-rendered panels, cards, tabs, rails, and buttons.
- Do not introduce React, Phaser, Three.js, or canvas for hub/dashboard features.

Only use a canvas or game engine when the feature truly needs a playfield.

## Deep References

Read these references when the task needs more than the core checklist:

- `references/feature-archetypes.md`: use for crime, monsters, vampires,
  royalty, boxing, billionaire, dynasty, fame, faction, empire, and similar
  Ledger expansion concepts.
- `references/premium-ledger-style.md`: use when the user asks for the game to
  feel premium, classy, refined, well thought through, or similar to the Ledger
  landing/save screen visual language.
- `references/ledger-ux-pattern-library.md`: use when designing or implementing
  refined hubs, cards, tabs, progress meters, consequence feeds, risk displays,
  and mobile layouts for Ledger.

## UX North Star

Make the game feel dense, but never muddy.

Ledger players should feel:

- They are managing a life, not filling a form.
- Every major system has a visible status.
- Every action has a reason.
- Every risk has a readable cause.
- Every reward feels earned.
- Long-term progression is visible.

Favor command-center clarity over decoration.

## Visual Direction

Keep the Ledger house style:

- Dark ledger surfaces.
- Compact panels.
- Small stat chips.
- Gold, green, red, blue, and muted neutral accents.
- Dense but readable card grids.
- Financial/life-sim language.
- Light thematic flavor through icons, labels, and microcopy.

Avoid:

- Generic SaaS dashboards.
- Giant marketing-page heroes.
- Purple gradient app shells.
- Decorative blobs.
- Oversized text.
- Nested card stacks.
- Full-page lore walls.
- Controls that require instructions to understand.

## Feature Screen Anatomy

Most Ledger features should use this structure:

1. Command header
2. Status strip
3. Progression or rank card
4. Action sections
5. Consequence/history feed
6. Risk/opportunity surface
7. Optional detail drawer or tabs

Do not start with a long explanatory paragraph.

Show the system in action immediately.

## Command Header

Use the header to tell the player where they stand.

Include:

- Feature identity: "Crime", "Boxing", "Royal Court", "Vampire Nightlife".
- Current role or rank.
- Current faction/team/organization if relevant.
- One primary number.
- One danger or opportunity.
- One next milestone.

Examples:

- Crime: "Street crew lieutenant / Heat 34 / Next: launder $50K."
- Boxing: "Regional contender / Record 14-2 / Next: title eliminator."
- Royalty: "Duke of York / Influence 61 / Next: secure a marriage alliance."
- Vampire: "Neonate / Blood 72 / Masquerade risk 18 / Next: earn coven standing."
- Billionaire: "Family office / Net worth $1.2B / Next: acquire a media asset."

## Status Strip

Use compact metrics.

Prefer 4-7 chips.

Each chip should be:

- Short label.
- Strong value.
- Optional trend or warning state.

Good chip examples:

- Heat
- Reputation
- Cash Flow
- Influence
- Blood
- Fitness
- Title Rank
- Crew Loyalty
- Public Scrutiny
- Legacy Score

Avoid showing every internal variable.

## Actions

Group actions by intent.

Use sections such as:

- Build
- Train
- Recruit
- Expand
- Influence
- Scheme
- Defend
- Invest
- Recover
- Exit

Never dump actions in one long row.

For each action, make clear:

- Cost.
- Cooldown or yearly limit.
- Expected upside.
- Main risk.
- Required rank, stat, asset, or relationship.

Prefer button labels that sound like gameplay:

- "Run a Small Job"
- "Train Footwork"
- "Host Court Banquet"
- "Hunt Quietly"
- "Acquire Rival Brand"

Avoid vague labels:

- "Submit"
- "Do Action"
- "Upgrade"
- "Process"

## Consequences

Every feature needs a visible result layer.

After a choice, show:

- A log line.
- A stat delta where useful.
- A changed status chip.
- A new opportunity or warning.

Use short, flavorful lines.

Examples:

- "The job paid, but a camera caught the getaway car. +$12K, +8 Heat."
- "Your jab looked sharp in sparring. +4 Technique, -6 Energy."
- "The court accepts your toast. +7 Influence, +3 Rival Jealousy."
- "You fed without witnesses. +28 Blood, Masquerade stable."

## Progression

Every feature should have a progression spine.

Define the ladder early.

Example ladders:

- Crime: petty thief -> crew member -> enforcer -> lieutenant -> boss -> syndicate power.
- Boxing: amateur -> prospect -> contender -> challenger -> champion -> undisputed -> legend.
- Royalty: outsider -> minor noble -> courtier -> duke/duchess -> regent -> monarch -> dynasty founder.
- Vampire: mortal contact -> ghoul -> neonate -> recognized vampire -> coven officer -> elder -> prince.
- Billionaire: high earner -> first million -> founder/investor -> centimillionaire -> billionaire -> dynasty office.

Show the current rung and the next rung.

## Risk Design

Make risks legible.

Do not use invisible failure rolls without explanation.

Display named risk factors:

- Heat
- Injury
- Scandal
- Betrayal
- Masquerade breach
- Public scrutiny
- Rival pressure
- Debt load
- Succession tension
- Burnout

Risk cards should answer:

- Why is this risky?
- What makes it better?
- What makes it worse?
- What happens if it breaks?

## Feature-Specific UX Patterns

### Crime

Make Crime feel like pressure management: heat, crew loyalty, territory,
laundered money, police attention, rival crews, jobs, and legal defense. Actions
should escalate from petty to organized, with clear morality/risk language.

### Monster / Supernatural

Make Monster features feel like dual identity: human identity, monster form,
hunger or rage, secrecy, hunters, powers, weaknesses, and safehouses. Put
ordinary life pressure beside supernatural pressure.

### Vampires

Make Vampires feel elegant, dangerous, and political: blood, Masquerade risk,
coven standing, powers, thralls, hunters, territory, and age. Avoid making it
only a hunger bar.

### Royalty

Make Royalty feel like ceremony plus power: title, succession, court influence,
public approval, estates, marriages, rivals, and scandals. Include both public
ritual and private leverage.

### Boxing

Make Boxing feel physical and seasonal: record, rank, fitness, weight class,
injury risk, coach/team, upcoming fight, purse, and legacy. Separate training,
fight booking, sponsorships, and recovery.

### Billionaire

Make Billionaire feel like capital allocation plus reputation: net worth,
liquidity, holdings, family office, public scrutiny, philanthropy, political
access, and legacy. Make actions high-stakes, not just larger purchases.

## Presentation Rules

Use tabs when a feature has multiple distinct modes.

Use cards when comparing repeated items.

Use chips for statuses.

Use modals only for meaningful choices.

Use rails for horizontal repeated actions.

Use collapsed details for rare information.

Keep the first screen useful without scrolling too far.

## Mobile Rules

Design mobile from the start.

Use:

- Single-column panels.
- Wrapping action buttons.
- Horizontally scrollable tab chips.
- Short labels.
- Stable metric grids.

Avoid:

- Tiny text.
- Side-by-side critical controls.
- Fixed overlays.
- Wide tables.
- Buttons that overflow cards.

## Writing Style

Write microcopy like a game designer.

Use:

- Specific nouns.
- Short consequences.
- Thematic verbs.
- Clear thresholds.
- Direct warnings.

Avoid:

- Explaining the UI.
- Multi-paragraph lore in main panels.
- Joke labels for serious mechanics.
- Placeholder text.

## Integration Workflow

Before implementation:

1. Read the relevant existing feature module.
2. Find existing render helpers.
3. Find state shape and save patterns.
4. Identify the hub route.
5. Identify existing styles and button classes.
6. Decide whether this is a new hub, a section in an existing hub, or an overlay.

During implementation:

1. Add the smallest compatible state shape.
2. Render an immediately useful first screen.
3. Group actions by intent.
4. Add visible feedback for outcomes.
5. Add responsive CSS near the feature module if that is the local pattern.
6. Preserve old saves.
7. Rebuild `dist/` after source changes.

## Acceptance Checks

A Ledger feature UX is ready when:

- The first view answers the five player questions.
- The feature has a visible progression spine.
- Actions are grouped by player intent.
- Costs, risks, and unlocks are visible.
- Consequences appear after choices.
- Mobile does not clip or overflow.
- The feature fits the existing Ledger visual language.
- The system can be understood from the screen without reading dev notes.

## Output Expectations

When planning, return:

- Feature fantasy.
- Player verbs.
- Screen structure.
- Progression spine.
- Status metrics.
- Action groups.
- Risk model.
- Mobile behavior.
- Test plan.

When implementing, create:

- Source changes only.
- Compact, readable panels.
- Clear action grouping.
- Save-compatible state.
- Focused verification.

## Final Reminder

Do not make new Ledger features merely bigger.

Make them readable, dramatic, and easy to steer.
