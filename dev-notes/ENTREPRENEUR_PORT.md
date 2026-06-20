# Entrepreneur port (base code → modular) — execution note

Resume insurance for the approved port. Plan: `~/.claude/plans/plan-it-out-and-flickering-flask.md`.
Supersedes dev-notes/ENTREPRENEURSHIP_REBUILD.md (the incremental venture-lifecycle attempt).

## Goal
Port the base-code (Verdant) entrepreneur system into ONE modular module
`pages/systems/entrepreneur.js`, REPLACING the fragmented systems (startup-founder mini-game,
business-entities ventures, core ventures, venture-lifecycle.js). Approved: port & replace.

## Source (base code.devtools, ~119217–121800)
BIZ_TYPES (17 industries, ~119229), BIZ_MODEL_INFO (6 models, ~119249), _genCompetitors (119329),
_newBizObj (119300), initBiz (119287, `G.biz`), getActiveBiz (119345); creation flow
_bizStep1..6 + _createBiz/_launchBiz (119357–119505); yearly processEntrepreneurYear +
_processSingleBiz/_runBizSales/_runBizHR/_runBizFinancial/_checkBizDeath/_checkBizStageUp/
_bizProductLaunch/_fireBizEvent/_bizWindDown/_bizExecuteExit (119506–119967); actions
bizHire/bizFire/bizSetMktgBudget/bizSetDevAlloc/bizRaiseFunding/bizStartFranchise/bizExitAction/
bizStartSecond (119968–120111); render showEntrepreneurPanel/renderEntrepreneurPanel (120112–121683,
~1500 lines); _randomBizName (121683).

## Shim (G.* → modular)
G.biz→state.finance.bizV1860 · G.age→state.age · G.smarts→state.stats.smarts · G.karma→
state.stats.karma · G.fame→state.fame · G.wealth→state.money · rnd→rand · showToast→addToast ·
getCurrencySymbol→"$" · renderX(el){el.innerHTML} → renderX(){return html} for renderHubContent ·
Verdant CSS vars defined locally · modal steps → in-hub wizard on bizV1860._wizard.

## Progress
- [x] Phase 0 — dev-note; hid broken venture-lifecycle empty-state panel (returns "").
- [x] Phase A — entrepreneur.js created: BIZ_TYPES(17), BIZ_MODEL_INFO(6), _genCompetitors,
      _newBizObj, initBiz (→state.finance.bizV1860), getActiveBiz, shim. Exposed as
      `window.EntrepreneurV1861`. Added `<script>` to play.html (after venture-lifecycle.js).
      Both pass node --check. INERT (no UI/engine yet).
- [x] Phase B — 6-step in-hub wizard (state machine on bizV1860._wizard): startEntrepreneurV1861 +
      bizWizardPick{Type,Model,Name,CoFounder,Capital,Focus}V1861 + Back/Cancel + custom name;
      _createBiz/_launchBiz push to bizV1860.businesses[] & set activeBizId. Minimal render
      (renderBizWizardV1861) surfaced in the Business hub via a renderHubContent decorator
      (transitional). Passes node --check.
      NOTE: a founded company does NOT run yet (no yearly engine = Phase C) and has no metrics
      panel yet (Phase D). Testable: you can walk the wizard and found a company; it logs + appears
      in bizV1860, but won't grow/earn until Phase C.
- [ ] Phase C — yearly engine + actions + self-funding; decorate resolveLifeAndFinanceYear.
- [ ] Phase D — render panel → hub renderer + CSS; route "business" hub.
- [ ] Phase E — retire old systems + save migration + finance-ledger net worth (no double-count).

## Guardrails
Game playable after every phase · one yearly engine + one net-worth source for businesses ·
grandfather old saves · `node --check` per file · source only (dist not rebuilt).
