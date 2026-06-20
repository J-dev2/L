# Premium Ledger Style

Use this reference when the user wants Ledger features to feel premium, classy,
refined, authored, elegant, or "like the nice Ledger save screen."

## Table of Contents

1. Style Goal
2. What Premium Means Here
3. Visual Ingredients
4. Layout Ingredients
5. Typography Ingredients
6. Color and Material
7. Panel Design
8. Buttons and Controls
9. Data Details
10. Feature Applications
11. Anti-Patterns
12. Implementation Checklist

## 1. Style Goal

Make Ledger feel like a deliberate premium life-sim object.

The target feeling:

- classy,
- mature,
- atmospheric,
- readable,
- expensive without being flashy,
- game-like without being cartoonish,
- detailed without being messy.

The player should think:

"This was designed on purpose."

## 2. What Premium Means Here

Premium is not:

- more gradients,
- more animation,
- more icons,
- more glow,
- bigger panels,
- more text,
- more buttons.

Premium is:

- restraint,
- hierarchy,
- strong type,
- warm accent color,
- careful spacing,
- useful details,
- tactile panels,
- visible state,
- subtle atmosphere.

The Ledger landing screenshot works because it combines:

- a large editorial title,
- small technical labels,
- dark warm material,
- gold highlights,
- compact cards,
- fine borders,
- mini data visualization,
- clear action chips,
- and a sense of depth.

## 3. Visual Ingredients

Use these ingredients across future feature hubs.

### Editorial Title

Use a large serif or display-style heading for important surfaces.

Good uses:

- main landing page,
- major feature hub title,
- prestige rank,
- dynasty title,
- fight-night title,
- royal title,
- vampire court title.

Avoid using giant headings on every card.

### Tiny System Labels

Use small uppercase labels for structure.

Examples:

- LIFE STACK GATE
- COMMUNITY STACK
- STYLE MENU
- ACTIVE COMPANY
- COURT STANDING
- TITLE PATH
- HEAT INDEX

These labels make the UI feel technical, composed, and intentional.

### Warm Accent Numbers

Use gold/amber for prestige values:

- net worth,
- stack worth,
- title rank,
- valuation,
- fight purse,
- influence,
- dynasty score,
- bloodline age.

Large values should feel like trophies.

### Fine Borders

Use thin borders and subtle contrast.

Borders should feel like etched lines, not heavy boxes.

### Background Atmosphere

Use subtle texture, low-contrast lines, or faint geometry.

Good:

- diagonal ledger lines,
- faint grid,
- paper grain,
- soft radial depth,
- muted shadow.

Avoid:

- bright abstract blobs,
- loud gradients,
- high contrast patterns,
- decorative backgrounds that fight text.

## 4. Layout Ingredients

### Two-Panel Premium Layout

For major hubs, use:

- left side: identity, status, atmosphere, primary summary;
- right side: actionable stack, saves, cards, menu, or current objects.

This works for:

- landing/save screen,
- billionaire family office,
- royal court,
- vampire court,
- boxing career office,
- crime operation desk.

### Hero + Stack

The left hero should not be just marketing.

It should contain useful state:

- current rank,
- status chart,
- key metrics,
- active slot/company/identity,
- primary action.

### Right-Side Working Panel

The right panel should hold the repeatable objects:

- saves,
- businesses,
- fights,
- jobs,
- rivals,
- properties,
- court figures,
- opportunities.

It should feel like a command stack.

### Premium Card Rhythm

Use cards with breathing room but not huge padding.

Good rhythm:

- card title,
- small metadata line,
- short consequence or description,
- right-aligned number,
- bottom action chips.

Avoid:

- card walls,
- nested cards,
- equal-size panels for unequal information,
- huge empty space in action areas.

## 5. Typography Ingredients

Use contrast between:

- large serif display type,
- compact monospace or technical labels,
- readable body copy,
- bold numeric values.

### Serif Display

Use for:

- feature names,
- prestige titles,
- save names,
- ranks,
- royal houses,
- fight cards.

The serif type makes the game feel literary and premium.

### Mono / Technical Small Text

Use for:

- metadata,
- stat labels,
- system messages,
- compact descriptions,
- save slot details.

This makes the game feel like a ledger, dossier, or command file.

### Body Copy

Keep body copy short.

Premium UI does not explain everything at once.

Use one or two lines.

Let cards and stats do the work.

## 6. Color and Material

Preferred palette mood:

- near-black green/brown,
- warm charcoal,
- muted parchment,
- amber/gold,
- restrained green,
- restrained blue,
- restrained red.

### Gold

Use gold for:

- money,
- prestige,
- active selection,
- premium border,
- achievement.

Do not use gold on every element.

### Green

Use green for:

- continue,
- safe,
- growth,
- positive status,
- new life,
- recovery.

### Blue

Use blue for:

- sandbox,
- information,
- new path,
- secondary action.

### Red

Use red for:

- delete,
- danger,
- heat,
- injury,
- scandal,
- Masquerade breach.

### Material Feel

Panels should feel like:

- dark glass,
- leather ledger,
- smoked acrylic,
- worn paper,
- polished metal trim.

Not like:

- flat default web cards,
- bright SaaS panels,
- cartoon popups.

## 7. Panel Design

### Premium Panel Traits

Use:

- rounded corners around 8-14px depending on local style,
- thin border,
- low-opacity background,
- subtle shadow,
- small uppercase label,
- one clear focal value.

### Panel Header

Panel headers should be compact.

Use:

- eyebrow label,
- title,
- optional right-side action.

Example:

`ROYAL COURT`

`House Ledger`

Right action: `HOST BANQUET`

### Empty Panel

Empty panels should still feel designed.

Example:

"No rival declared. Win two more fights to draw a ranked contender."

Then a clear action:

`BOOK FIGHT`

## 8. Buttons and Controls

Use compact pill buttons for common actions.

Button labels should be short and game-like.

Good:

- CONTINUE
- NEW LIFE
- TRAIN
- BOOK FIGHT
- HOST COURT
- LAY LOW
- FEED QUIETLY
- INVEST

Use button color to signal intent:

- green: proceed / positive,
- blue: alternate / info,
- gold: premium / special,
- red: danger / destructive.

### Refined Action Chips

Small action chips make the UI feel controlled.

Use them in card footers.

Avoid giant buttons unless the action is the one primary CTA.

### Destructive Actions

Destructive actions should be visually quieter than the main action but clearly
dangerous.

Example:

`DELETE` as a red outlined pill.

Do not make destructive buttons large and loud unless immediate danger is the
point.

## 9. Data Details

Premium game UI includes small meaningful extras.

Use:

- mini bar charts,
- sparklines,
- slot counters,
- rank pips,
- progress ticks,
- small timelines,
- subtle trend arrows,
- current/next labels.

These should explain status, not decorate randomly.

### Mini Charts

Mini charts are excellent for:

- stack worth,
- revenue history,
- blood over time,
- heat over time,
- training camp readiness,
- public approval,
- dynasty influence,
- fight performance.

Keep them small.

### Right-Aligned Big Values

Money and score values often look best right-aligned.

Examples:

- `-$34.1M`
- `$1.5B`
- `New`
- `Rank #4`

This creates a premium financial ledger feel.

## 10. Feature Applications

### Crime

Premium Crime should look like a dark operation ledger.

Use:

- Heat index chart,
- crew cards,
- dirty/clean money split,
- job dossiers,
- rival warnings,
- legal defense chip.

Make jobs feel like selected opportunities, not random buttons.

### Vampire

Premium Vampire should look like a night court dossier.

Use:

- blood meter,
- Masquerade warning,
- coven standing,
- territory cards,
- hunter trail,
- elegant serif titles.

Use gold for court rank, red for blood/danger, and muted blue for secrecy.

### Royalty

Premium Royalty should look like a court archive.

Use:

- title card,
- succession strip,
- family house panel,
- court influence cards,
- public approval,
- scandal warnings.

Use serif heavily, but keep controls compact.

### Boxing

Premium Boxing should look like a fight office plus fight-night card.

Use:

- record,
- rank,
- upcoming opponent,
- camp readiness,
- injury risk,
- purse,
- belt path.

Use mini bars for training attributes.

### Billionaire

Premium Billionaire should look like a private family office.

Use:

- net worth hero,
- liquidity,
- holdings stack,
- public scrutiny,
- legacy projects,
- acquisition cards.

Use gold values and dark restrained panels.

### Monster

Premium Monster should look like a classified identity file.

Use:

- human/monster split,
- control meter,
- secrecy,
- hunter attention,
- lair/safehouse,
- power unlocks.

Use atmosphere, but keep gameplay readable.

## 11. Anti-Patterns

Avoid:

- huge neon fantasy UI,
- generic bootstrap dashboard,
- bright mobile-game reward clutter,
- one card per stat with no hierarchy,
- too many glowing borders,
- paragraphs explaining mechanics,
- icon soup,
- inconsistent button colors,
- every feature having a totally different palette,
- large empty cards with no decision value.

Premium means composed.

## 12. Implementation Checklist

When implementing premium Ledger UX:

- Start with the current Ledger color tokens and panel classes.
- Add only feature-specific styles that extend the system.
- Use one large focal heading max per surface.
- Add tiny uppercase labels.
- Add compact stat chips.
- Add one useful mini data visual if the feature has history.
- Use card footers for action chips.
- Keep first viewport useful.
- Test desktop and mobile screenshots.
- Check long names and large money values.
- Check empty and locked states.

## Final Reminder

The target is not "fancy."

The target is "I want to stay in this world because the interface feels cared
for."
