# Ledger UX Pattern Library

Use this reference when designing or implementing Ledger screens. It describes
the repeatable presentation patterns that make a feature feel refined.

## Table of Contents

1. Screen Philosophy
2. Hub Layouts
3. Command Headers
4. Metric Chips
5. Progression Displays
6. Action Groups
7. Consequence Feeds
8. Risk Panels
9. Choice Modals
10. Item Cards
11. Tabs and Rails
12. Graphs and Trends
13. Empty States
14. Locked States
15. Mobile Layout
16. Copywriting
17. Visual Polish
18. Implementation Checklist
19. QA Checklist

## 1. Screen Philosophy

Ledger is dense by design.

Density is good when the hierarchy is clear.

Avoid visual mush by giving every screen:

- One strongest header.
- One strongest action.
- One status strip.
- Related action groups.
- One consequence area.

The player should not need to read every card to know what matters.

## 2. Hub Layouts

Use a hub when the feature is a persistent life system.

Common hub sections:

- Hero or command header.
- Active status.
- Primary action group.
- Secondary action group.
- Progression ladder.
- History/log.
- Upgrade or asset cards.

Keep the first viewport useful.

Do not begin with documentation.

## 3. Command Headers

Command headers are the top-level orientation device.

Include:

- Feature name.
- Current player role.
- Main number.
- Warning or opportunity.
- Next milestone.

Strong examples:

- "Crime: Crew Lieutenant"
- "Boxing: Regional Contender"
- "Royal Court: Duchess"
- "Billionaire: Family Office"

Weak examples:

- "Welcome to the crime feature"
- "Manage your boxing"
- "Royalty screen"

Header microcopy should be one sentence max.

## 4. Metric Chips

Metric chips are for quick state.

Use them for:

- Heat.
- Blood.
- Fitness.
- Rank.
- Loyalty.
- Cash.
- Influence.
- Approval.
- Risk.
- Runway.

Good chips have:

- Label.
- Value.
- Optional warning color.

Avoid:

- Long labels.
- Full explanations.
- Too many chips.
- Raw internal variable names.

Use 4-7 chips by default.

Use more only for deep management screens.

## 5. Progression Displays

Progression should show:

- Current rank.
- Next rank.
- Requirement.
- Reward or unlock.

Good pattern:

- "Contender -> Title Challenger"
- "Needs: Rank Top 5, Fitness 80, Win streak 3"
- "Unlocks: Title eliminator"

Avoid hidden progression.

Players should know what they are working toward.

## 6. Action Groups

Group by intent, not implementation.

Good groups:

- Train.
- Recruit.
- Expand.
- Recover.
- Invest.
- Influence.
- Defend.
- Exit.

Bad groups:

- Misc.
- Actions.
- Buttons.
- Options.

Each action card or button should show:

- Verb.
- Cost.
- Lock condition if disabled.
- Main risk if meaningful.

Disabled buttons should explain why.

## 7. Consequence Feeds

Ledger depends on consequences.

Every major action should generate a readable result.

Use:

- Recent events list.
- Log card.
- Toast.
- Inline delta.

Best pattern:

- Action button changes a stat.
- A log line explains why.
- A status chip reflects the change.

Example:

"Your public apology lands well. Scandal -8, Approval +3."

## 8. Risk Panels

Risk panels make systems fair.

A risk panel should show:

- Current risk level.
- Main causes.
- What reduces it.
- What happens if it spikes.

Example:

"Heat is High because you ran two jobs this year and have no attorney. Hire legal
defense or lay low before aging up."

Do not hide risk causes in code.

## 9. Choice Modals

Use choice modals for dramatic moments.

Good modal events:

- Police raid.
- Title fight negotiation.
- Royal scandal.
- Vampire witness.
- Billionaire acquisition lawsuit.

Each modal option should show:

- Short label.
- Flavor sentence.
- Cost/risk.
- Likely outcome.

Avoid modal spam.

Cap major modal events per year when needed.

## 10. Item Cards

Use cards for repeated entities:

- Crew members.
- Fighters.
- Properties.
- Businesses.
- Royal rivals.
- Thralls.
- Holdings.

Card anatomy:

- Name.
- Type/rank.
- One key value.
- One risk/status.
- One action cluster.

Avoid nested cards.

## 11. Tabs and Rails

Use tabs when a feature has distinct modes.

Examples:

- Overview.
- Training.
- Team.
- Assets.
- Influence.
- Public Market.
- History.

Use horizontal rails for many compact actions or items.

Rails should:

- Hide scrollbar if local pattern supports it.
- Have scroll buttons if needed.
- Preserve mobile usability.

Do not put the only critical action far offscreen.

## 12. Graphs and Trends

Use graphs when they explain change over time.

Good graph uses:

- Revenue history.
- Fitness over camp.
- Heat over time.
- Approval trend.
- Net worth.
- Territory growth.
- Share price.

Bad graph uses:

- Decorative sparklines with no decision value.
- Charts that replace clearer numbers.

Every graph should have:

- Label.
- Latest value.
- Direction.
- Short meaning.

## 13. Empty States

Empty states should invite action.

Formula:

- What this area is.
- Why it matters.
- First useful action.

Example:

"No crew yet. Recruit a trusted partner before taking larger jobs."

Avoid:

- "Nothing here."
- Blank panels.
- Lore-only empty states.

## 14. Locked States

Locked states should motivate.

Show:

- Requirement.
- Benefit.
- Current progress.

Example:

"Title fights unlock at Top 10 ranking. Current rank: 18."

Do not simply disable actions with no explanation.

## 15. Mobile Layout

Mobile should be first-class.

Use:

- Single-column panels.
- Wrapping metrics.
- Scrollable tabs.
- Full-width action buttons when needed.
- Compact labels.
- No fixed sidebars.

Check:

- Buttons do not clip.
- Cards do not overflow.
- Text wraps cleanly.
- Horizontal rails do not create page overflow.
- Touch targets are comfortable.

## 16. Copywriting

Use themed but clear language.

Good:

- "Lay Low"
- "Book Title Eliminator"
- "Host Court Banquet"
- "Clean Dirty Cash"
- "Train Footwork"
- "Buy Back Control"

Weak:

- "Execute"
- "Perform"
- "Option 1"
- "Upgrade stat"
- "Submit"

Keep labels short.

Put details in subtext.

## 17. Visual Polish

Refinement comes from consistency.

Use:

- Shared panel classes.
- Existing button styles.
- Matching border radius.
- Tight spacing.
- Clear hierarchy.
- Accent colors with meaning.

Avoid:

- New palettes per feature.
- Giant icons everywhere.
- Too many borders.
- Too many equal-weight panels.
- All-caps paragraphs.
- Decorative effects without function.

## 18. Implementation Checklist

Before coding:

- Identify hub route.
- Identify state object.
- Identify render function.
- Identify local helper functions.
- Identify existing CSS injection pattern.
- Identify build command.
- Identify smoke tests.

During coding:

- Keep state save-compatible.
- Add default state lazily.
- Keep render helpers focused.
- Preserve old routes unless intentionally replacing them.
- Add actions with visible feedback.
- Add mobile CSS.
- Rebuild dist.

## 19. QA Checklist

Run:

- Syntax check on touched JS.
- Existing smoke tests.
- Feature-specific route render check.
- Desktop screenshot.
- Mobile screenshot.

Verify:

- First view is useful.
- Primary action is visible.
- Disabled actions explain why.
- Consequences appear.
- Mobile layout does not clip.
- Existing hubs still work.
- Dist was rebuilt if source changed.
