# Business Uniqueness Roadmap

> **Status (shipped):** The big overhaul landed. There are now **100 businesses
> across 10 clean sectors** (10 each), each with a **unique signature action**,
> and **each sector has its own running meter** you manage — Food = Health
> Rating, Nightlife = Buzz, Tech = Recurring Revenue, Finance = AUM, Retail =
> Inventory, Trades = Job Backlog, Media = Audience, Real Estate = Occupancy,
> Health = Patient Load, Logistics = Capacity. These meters drive income/risk and
> drift differently (maintain / compound / band), so businesses no longer play
> the same. The distribution/owner-cash UI was also regrouped for clarity. See
> `pages/systems/business-sectors.js`. The notes below are the *remaining* ideas.

> **Status (v18.36 — Living Businesses, shipped):** Phase 1 landed plus the
> interactive-event layer. Business market events are no longer silent log
> lines — they fire as **themed popup moments where the player chooses the
> response** (`pages/systems/business-events.js`), each choice with its own
> cost/rep/value/risk outcome. Sector-specific event pools (health inspection,
> fire marshal, data breach, regulatory audit, dead inventory, viral moment…)
> with a generic fallback; each business now has a **persistent named rival**.
> Also shipped: multiple result lines per signature action, **sector-flavored
> asset tier names**, and a **stage-gated second signature action** that unlocks
> past startup stage. Popups are capped at 2/year so they read as moments, not
> spam. The notes below are the *remaining* ideas.

## What already makes businesses unique (don't redo this)

- **Name, description, numbers** — startup cost, income range, failure risk,
  `scaleStat` (which player stat grows it) all differ per venture.
  `00-core-app-runtime.js` (~4620, 5875, 7324, 7380).
- **One signature action per venture** — 31 distinct actions
  (`VENTURE_ACTIONS` in `business-entities.js:186`), each with its own label,
  icon, cost, and effect (reputation / value / cash payout).
- **Category icon** on the card/header (`categoryIcon()`,
  `business-entities.js:847`).

## The actual gap: everything else is shared by all 31

These systems apply identically no matter what business you're running:

- **Asset slots** — every business has the exact same 3 slots
  (`Location` / `Equipment` / `Staff`) with the exact same tier names and
  descriptions (`ASSET_SLOTS`, `business-entities.js:153`). A nightclub and a
  tutoring business both upgrade to "Automated Systems."
- **Market events** — one shared pool of 5 events fires for everyone
  (`BUSINESS_MARKET_EVENTS`, `00-core-app-runtime.js:6109`). A lawn care
  hustle and a hedge fund can both get "a new competitor opened nearby."
- **Risk/income formula** — same shape for every category (`riskFor()`,
  `business-entities.js:831`; the per-business loop in
  `00-core-app-runtime.js` ~6221).
- **Ops hires** (Manager/Sales/Counsel/Bookkeeper/Insurance) — same 5 roles,
  same effect, regardless of what the business actually does.

This is why it still reads as "31 spreadsheets with different numbers" even
though it plays better than before. The fix is to push variation into these
shared systems, not to add more standalone fields.

---

## Phase 1 — Cheap, high-impact, reuses existing patterns

Best next step: small, data-shaped changes to systems that already exist.

1. **Category-specific market events.** Replace the single shared
   `BUSINESS_MARKET_EVENTS` pool with events tagged by category, falling back
   to the generic pool if a category has nothing yet. Nightlife gets "noise
   complaint" / "fight at the door," healthcare gets "malpractice scare,"
   tech gets "data breach," food/hospitality gets "health inspection,"
   aviation gets "FAA audit." Same `rollBusinessMarketEvent()` call site,
   just filter by `b.category` before picking.
2. **Category-flavored asset tiers.** Keep the same 3 slots and the same
   cost/bonus math, but give a handful of categories their own tier
   name/description text — a nightclub's top Equipment tier reads "State of
   the Art Sound System" instead of "Automated Systems," a SaaS company's
   Staff tier reads "Engineering Team" instead of "Full Team." Purely
   cosmetic overlay on `ASSET_SLOTS`, no new math.
3. **Multiple result lines per signature action.** Change `result` in
   `VENTURE_ACTIONS` from a single string to an array and `pick()` one each
   time it fires, so running the same action 5 years in a row doesn't show
   identical log text.
4. **Stage-gated second action.** Once a business advances past `startup`
   stage (the `stageIcon()`/`b.stage` concept already exists), unlock a
   second, bigger signature action for that venture — e.g. lawncare unlocks
   "Buy a Truck Fleet" once established. Gives long-lived businesses
   something new instead of repeating the same one action forever.

## Phase 2 — A real per-venture mechanic (the biggest lever)

5. **A second venture-specific meter**, beyond the universal
   reputation/value/risk every business already has. This is the single
   change most likely to make businesses feel different to actually run.
   Don't try to give all 31 a bespoke meter at once — start with 3-4
   archetypal categories sharing a meter "shape": Nightlife gets **Buzz**
   (decays without action, signature actions/events spike it, low buzz hurts
   income); Tech/SaaS gets **Churn/MRR** (recurring-revenue framing instead
   of one-shot income rolls); Food/Hospitality gets **Health Score**
   (inspection events hit it, recovers slowly, low score raises failure
   risk); Finance gets **AUM** (assets under management, separate from
   `b.value`, grows with signature actions, market events swing it harder).
6. **Category-specific risk line items** in `riskFor()` — surface a named
   risk factor per category the way `manager`/`insurance`/`counsel` already
   show as line items: "licensing risk" for nightlife, "regulatory risk" for
   aviation/medical, "IP/security risk" for tech. Makes the risk pill explain
   *why* a hedge fund is riskier than a tutoring business beyond a flat
   number.
7. **Portfolio synergy bonuses.** Owning 2+ businesses in the same category
   gives a small discount/reputation bonus (franchise effect); owning across
   many categories instead gives a small diversification risk cut. Lightweight
   addition to the existing per-business yearly loop, encourages a deliberate
   specialize-vs-diversify choice.

## Phase 3 — Bigger systemic bets (future, optional)

8. **Interactive choice events for businesses**, reusing the life-event
   choice-modal pattern (`events` catalog + `maybeEvent()`) instead of
   auto-resolving market events. "A competitor opened nearby" becomes a
   choice — cut prices / out-market them / ignore — with category-specific
   options and payoffs.
9. **Named rivals.** A lightweight per-business rival NPC that persists and
   evolves year to year, showing up by name in log lines and market events
   ("Sunrise Cleaners is undercutting your prices again"), instead of
   one-off anonymous event text.
10. **Multi-location/franchise expansion.** Once a business reaches Flagship
    Location, allow opening a second location as a distinct late-game money
    sink and scaling path. Noted as out of scope in the previous redesign
    pass too — biggest lift on this list, do last if at all.

---

## Suggested order

Start with **Phase 1** — all four items are data/content extensions to
systems that already work (`ASSET_SLOTS`, `BUSINESS_MARKET_EVENTS`,
`VENTURE_ACTIONS`), so they're low-risk and give the most "this feels
different" payoff per hour spent. **Phase 2, item 5** (the per-category
meter) is the real answer to "I want each business to feel unique" — worth
doing once there's time to commit to a proper design pass rather than
squeezing it in. Phase 3 is for later; none of it blocks Phase 1 or 2.
