# PAGES — where every screen lives (edit-here guide)

Plain-English index of the game so you can make quick changes yourself without
guessing. **You edit the small source files in `pages/`. You never edit `dist/`.**

AI agents should start with `AI_DEV_README.md` and
`dev-notes/ai-handoff/START_HERE.md` before using this edit guide.

---

## The one rule: source vs. build

- **`pages/` (+ `index.html`, `play.html`) = SOURCE.** Many small files. This is
  where you make changes.
- **`dist/...built.html` = OUTPUT.** A generated single-file bundle that stitches
  every source file together for shipping. **Editing it does nothing lasting —
  the next build overwrites it.** (That giant file is *not* the project.)

The game is a **single-page app**: every "page" (Business, Legal, Trust, Money…)
is a JavaScript **render function** that paints into one shared screen — not a
separate HTML file. They work this way because they all read/write the same live
game state. So "add a page" = add/extend a `.js` render function, not a new HTML.

---

## After you edit: two ways to see it

1. **Fast path (no rebuild):** open `index.html` in a browser → pick a save →
   it loads `play.html`, which pulls the source `.js` files directly. Your edits
   show up on refresh. Best for quick tweaks.
2. **Rebuild the bundle** (updates `dist/`), run from this folder:
   ```powershell
   node build\build-ledger18.js
   ```

---

## Which file holds which screen

| Screen / feature | File to edit |
|---|---|
| **Business desk** (your companies, ops, assets, signature actions) | `pages/systems/business-entities.js` |
| **Business sectors** (the 100 ventures, sector meters) | `pages/systems/business-sectors.js` |
| **Business event pop-ups** (the choice modals) | `pages/systems/business-events.js` |
| **Business problems** (challenges that bite each year) | `pages/systems/business-challenges.js` |
| **Entrepreneurship** (startup founder mini-game: found, raise rounds, scale to a billion-$ exit, graduate to Business) | `pages/systems/startup-founder.js` |
| **Business / formal companies** (incorporate, teams, sectors) | `pages/systems/business-entities.js` (+ legacy in `pages/runtime/00-core-app-runtime.js`) |
| **Legal / Law Office** (tax, accountants, attorneys) | `pages/systems/tax-legal.js` |
| **Family Trust** (trust, child trusts, family fund, succession) | `pages/systems/tax-legal.js` (`renderTrustHub`) |
| **Shopping / The Mall** (luxury items + art market money sink) | `pages/systems/shopping-mall.js` |
| **Money** (checking, savings, budget, tax residence) | `pages/systems/money-banking.js` |
| **Investments / Brokerage** (stocks, funds, personal firm) | `pages/systems/stocks-engine.js` (`stocks-investing.js` still decorates labels/inputs) |
| **Finance / Net worth** (ledger, assets, debts, charts) | `pages/systems/finance-ledger.js` |
| **People / Family** (relationships, dating, kids, friends) | `pages/systems/people-family.js` |
| **Education + Career** (school, IQ, jobs, degrees) | `pages/systems/education-career.js` |
| **More tab** (saves, residence, settings, dev directory) | `pages/systems/more-command.js` |
| **Life tab + Age Up + core engine** (events, stats, the shell) | `pages/runtime/00-core-app-runtime.js` |

> The big one, `pages/runtime/00-core-app-runtime.js`, is the original engine
> (life view, age-up, the base render, lots of older systems). The files in
> `pages/systems/` are newer modules that load *after* it and override/extend it.
> When two files touch the same screen, the **last one loaded wins** — load order
> is the `<script>` list in `play.html`.

---

## How navigation works (handy when adding a screen)

- A "page" is a **hub**. Opening one = `setTab('hubId')` (any tab id that isn't
  `"life"` renders as a hub overlay).
- A file claims a hub by overriding `renderHubContent(hubId)` — e.g. `tax-legal.js`
  returns the Legal page for `law` and the Trust page for `trust`.
- The **More → Quick access** card and the hidden dev directory (tap the More
  header 5×) are the jump-points to everything; both live in `more-command.js`.

---

## Common quick edits

- **Change wording on a screen:** open its file, search for the visible text,
  edit the string. (Text lives inside the render functions as HTML strings.)
- **Tweak a number** (cost, payout, risk %): search the file for the action/event
  name; the numbers are right there in the data tables.
- **Add a new business event/problem:** add an entry to the catalogs in
  `business-events.js` / `business-challenges.js` (they're plain data + small
  functions — follow the existing entries as templates).
