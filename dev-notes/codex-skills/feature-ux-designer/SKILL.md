---
name: feature-ux-designer
description: Design refined UX for new features in general software projects, games, dashboards, tools, apps, and web products. Use when Codex needs to decide how a future feature should look, be presented, feel polished, organize information, guide users through actions, handle states, support mobile, and ship with clear acceptance criteria before or during frontend implementation.
---

# Feature UX Designer

## Purpose

Use this skill to turn a feature idea into a polished user experience.

Apply it when the user says things like:

- "How should this feature look?"
- "Make this feel refined."
- "Plan the UX."
- "Design the frontend for this feature."
- "Create a future feature concept."
- "Add a dashboard/page/modal/workflow."
- "Make this easier to understand."

This skill is useful for:

- Apps
- Games
- Dashboards
- Internal tools
- SaaS products
- Consumer web apps
- Creator tools
- Finance tools
- Education tools
- Health and habit tools
- Marketplaces
- Admin systems

## Core Principle

UX is not just the look.

UX is the path from user intent to successful outcome.

For every feature, define:

1. Who is using it?
2. What are they trying to do?
3. What do they need to know first?
4. What action should be easiest?
5. What can go wrong?
6. How does the interface recover?
7. What does success feel like?

Do not design screens before answering these questions.

## UX Outcome

A good feature UX should make users feel:

- Oriented.
- Capable.
- In control.
- Confident about consequences.
- Aware of progress.
- Protected from mistakes.
- Rewarded when they complete the task.

If the interface looks beautiful but users do not know what to do, the UX is not
done.

## Discovery Workflow

Before designing:

1. Inspect the existing product if code or screenshots are available.
2. Identify the current design language.
3. Find existing components, classes, tokens, routes, and patterns.
4. Identify the user journey.
5. Identify primary and secondary actions.
6. Identify required data states.
7. Identify constraints such as mobile, accessibility, performance, and save/data compatibility.

Ask the user only for preferences that cannot be discovered.

## Feature Brief

Every UX plan should include:

- Feature name.
- User type.
- User goal.
- Primary workflow.
- Secondary workflows.
- Entry point.
- Empty state.
- Loading state.
- Error state.
- Success state.
- Mobile behavior.
- Acceptance criteria.

Keep the brief practical.

Avoid vague statements like "make it modern."

Translate taste into concrete interface decisions.

## Information Hierarchy

Rank information by importance.

Use this order:

1. Critical status.
2. Primary action.
3. Current progress.
4. Context and explanation.
5. Secondary tools.
6. Rare settings.
7. Historical detail.

Do not give every element equal weight.

Users should know where to look first.

## Screen Anatomy

Most features need:

- Header or title area.
- One-sentence context.
- Primary status or object.
- Primary action.
- Supporting metrics.
- Detailed controls.
- Feedback or activity area.
- Escape/cancel/back path.

For complex features, use:

- Tabs.
- Stepper flows.
- Accordions.
- Drawers.
- Comparison cards.
- Filters.
- Search.
- Progressive disclosure.

## Visual Refinement

Polish comes from restraint.

Use:

- Consistent spacing.
- Predictable alignment.
- Clear type scale.
- Meaningful color.
- Button hierarchy.
- Strong empty states.
- Clear focus states.
- Responsive constraints.

Avoid:

- Too many accents.
- Nested cards.
- Over-large hero text.
- Decorative blobs.
- Unclear icons.
- Dense walls of text.
- Buttons with similar weight.
- Layout shift.
- Text clipping.

## Component Choice

Choose controls by job:

- Button: execute a command.
- Toggle: turn a boolean on/off.
- Checkbox: select one or more independent options.
- Radio/segmented control: choose one of a few options.
- Select/menu: choose one of many options.
- Slider: adjust an approximate numeric value.
- Stepper/input: enter precise numeric value.
- Tabs: switch major views.
- Accordion: reveal optional details.
- Modal: focus a blocking decision.
- Drawer: show secondary tools without leaving context.
- Card: represent one item in a repeated set.
- Table: compare many structured rows.

Do not use cards for everything.

## Action Hierarchy

Every screen should have:

- One primary action.
- A few secondary actions.
- Rare destructive actions visually separated.

Primary actions should be obvious.

Destructive actions should:

- Use warning color.
- Be placed away from positive actions.
- Explain consequences.
- Ask for confirmation when costly or irreversible.

## States

Design all states.

Required states:

- Empty.
- Partially complete.
- Normal.
- Loading.
- Saving.
- Error.
- Success.
- Disabled.
- Permission locked.
- Mobile cramped.

Never ship a feature that only looks good with perfect data.

## Empty States

Good empty states do three things:

1. Explain what belongs here.
2. Tell the user why it matters.
3. Offer the first useful action.

Avoid cute empty states that do not help.

## Loading States

Use loading states that preserve layout.

Prefer:

- Skeleton rows.
- Stable card placeholders.
- Inline spinners for small actions.
- Disabled buttons with saving text.

Avoid full-page spinners unless the whole page is truly unavailable.

## Error States

Good errors are specific.

They should say:

- What failed.
- Whether user data is safe.
- What to try next.
- Whether retry is possible.

Avoid:

- "Something went wrong."
- Raw exception text.
- Errors that disappear too quickly.

## Success Feedback

Success should be visible but not disruptive.

Use:

- Toasts.
- Inline confirmation.
- Updated status.
- Progress movement.
- New item appearing.
- Brief animation if appropriate.

The best success state changes the interface in a way the user can see.

## Progressive Disclosure

Show enough to act.

Hide enough to breathe.

Use progressive disclosure when:

- There are many settings.
- Users need different levels of detail.
- Advanced controls could distract beginners.
- Rare actions should not dominate.

Do not hide primary actions behind menus.

## Mobile UX

Design mobile intentionally.

Use:

- Single-column layout.
- Sticky bottom primary action only when it does not cover content.
- Large tap targets.
- Wrapping chips.
- Collapsed filters.
- Short labels.
- Stable cards.

Avoid:

- Wide tables.
- Hover-only interactions.
- Tiny controls.
- Fixed sidebars.
- Modals that exceed viewport height.
- Horizontal page overflow.

## Accessibility

Include practical accessibility by default.

Ensure:

- Keyboard focus is visible.
- Buttons have text or labels.
- Color is not the only signal.
- Text contrast is readable.
- Forms have labels.
- Error messages are tied to fields.
- Motion respects reduced-motion settings.
- Touch targets are large enough.

Do not treat accessibility as a final polish pass.

## Writing and Microcopy

Microcopy should reduce uncertainty.

Use:

- Concrete verbs.
- Short sentences.
- Specific consequences.
- Human labels.
- Clear thresholds.
- Calm warnings.

Avoid:

- Internal jargon.
- Marketing fluff.
- Multi-paragraph instructions.
- Labels that describe implementation.

Examples:

- Good: "Invite teammate"
- Weak: "Create user association"
- Good: "Save draft"
- Weak: "Submit"
- Good: "This will remove access immediately."
- Weak: "Are you sure?"

## Layout Patterns

Use the pattern that matches the task:

- Dashboard: overview, metrics, recent activity, next actions.
- Builder: canvas/work area, inspector, toolbar, preview.
- Workflow: stepper, checklist, progress, review.
- Marketplace: search, filters, item cards, comparison.
- Settings: grouped sections, toggles, danger zone.
- Analytics: filters, charts, summary insights, table details.
- Game hub: status, progression, actions, consequences.
- Admin table: bulk actions, filters, row details, audit trail.

Do not force every feature into a dashboard.

## Refinement Checklist

Before calling a feature polished, check:

- Is the first thing users see the most important thing?
- Is the primary action obvious?
- Are secondary actions available but quieter?
- Are destructive actions separated?
- Is the language specific?
- Does the layout work with long text?
- Does it work with no data?
- Does it work with too much data?
- Does it work on mobile?
- Can keyboard users operate it?
- Does success visibly change the interface?
- Does error recovery exist?

## Implementation Guidance

When coding:

1. Follow the existing design system.
2. Reuse local components.
3. Keep changes scoped.
4. Add state names that match user concepts.
5. Avoid one-off styling when tokens/classes exist.
6. Use semantic HTML where possible.
7. Keep responsive behavior explicit.
8. Add tests for critical flows.
9. Verify visually with screenshots when layout matters.

Prefer small, complete improvements over sprawling redesigns.

## Feature Concept Output

When asked to design a future feature, provide:

- Concept summary.
- Target user.
- User goal.
- Main screen layout.
- Key states.
- Primary actions.
- Secondary actions.
- Data shown.
- Empty/loading/error/success states.
- Mobile behavior.
- Acceptance criteria.

If implementation is requested, produce the code changes after grounding in the
repo.

## Handoff Plan Output

When asked for a plan, include:

- Summary.
- UX decisions.
- Component/interface changes.
- Data/state needs.
- Edge states.
- Test plan.
- Assumptions.

Make the plan decision-complete.

## Tone

Be opinionated but adaptive.

Keep the user's taste central.

If the user wants refined, make it feel:

- Purposeful.
- Dense where useful.
- Clean where needed.
- Alive without being noisy.
- Specific to the product.

Do not make every project look the same.

## Final Reminder

Great UX makes the next action feel obvious.

Great UI makes that action feel good to take.
