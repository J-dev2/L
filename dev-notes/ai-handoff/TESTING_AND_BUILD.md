# Ledger Testing and Build

Use this guide to decide what to run after changes.

## No Runtime Source Changed

If only Markdown/docs/skills changed:

- no game build required,
- no JS syntax check required,
- verify files exist and links are correct.

## JavaScript Source Changed

Run syntax check on touched files:

```powershell
node --check pages\systems\YOUR_FILE.js
```

Also check any touched runtime or patch file.

## Rebuild

After source changes, rebuild:

```powershell
node build\build-ledger18.js
```

Do not hand-edit `dist/`.

## Browser Smoke Tests

Use browser/CDP tests when:

- route behavior changed,
- render functions changed,
- UI layout changed,
- actions rely on DOM,
- save/load or boot changed,
- charts/graphs changed.

Probes live in the **`cdp/`** folder (run via the CDP driver against headless Chrome).
See `cdp/README.md` for the full list and run steps.

- `cdp/separation.js` — Entrepreneurship vs Business separation (20 checks)
- `cdp/features.js` — models make revenue, wizard, graphs across tabs (17)
- `cdp/ipo.js` — IPO / public-company / grants / scale graph (17)
- `cdp/dashboard.js` — Dashboard 2.0 tabs/panels, public gating, market signal (32)
- `cdp/death.js` — death screen + continue-as-heir incl. no-child successor (20)
- `cdp/founderpay.js` — founder salary + manual distribution + tax (24)
- `cdp/stock.js` — share counts, buyback de-list, splits, dividends (30)
- `cdp/trust.js` — family trust net worth + succession carry + death haircut (18)
- `cdp/wayback.js` — checkpoint create/restore + death-screen "Undo Death" (11)
- `cdp/devtools.js` — hidden dev-tools gate/unlock + panel tools (run with `&dev=1` in the URL) (17)
- `cdp/business-locations.js` — Business #10 locations/franchises/rival share (25)
- `cdp/business-income.js` — old/drifted business income + company cash reserve sweep (7)

How to run a probe (Chrome must be started with `--remote-debugging-port=<PORT>`
and a temp `--user-data-dir`; `cdp/driver.js` navigates + evaluates the probe). Reuse ONE
`--user-data-dir` and clean it up — fresh temp profiles per run will fill the disk:

```bash
node cdp/driver.js <PORT> "file:///d:/code/L/play.html?sandbox=1&from=landing" cdp/<name>.js
```

Each probe returns JSON `{ pass, fail, summary, __consoleErrors }`. Keep them green
after any entrepreneurship/stock/finance change; update a probe (don't delete checks)
when the intended contract changes.

## Screenshot QA

Use screenshot QA when:

- a page/hub was redesigned,
- mobile layout might clip,
- charts or action rails changed,
- premium UX quality matters.

Check:

- no clipped buttons,
- no horizontal page overflow,
- text wraps,
- cards do not overlap,
- primary action is visible,
- mobile remains usable.

## Finance Tests

For finance/money changes, verify:

- cash changes exactly once,
- debt changes exactly once,
- assets count once,
- net worth is sensible,
- old saves initialize,
- finance ledger renders,
- More summary renders if affected.

## Yearly Logic Tests

For yearly simulation changes, verify:

- age-up runs without error,
- wrapper calls previous logic once,
- feature tick does not double-run,
- logs are generated for major outcomes,
- random events cannot create NaN,
- inactive systems do not tick.

## Skill/Docs Checks

For new skills:

- `SKILL.md` exists,
- frontmatter has valid `name`,
- frontmatter has valid `description`,
- `agents/openai.yaml` exists,
- local and global copies match when intended.

The official validator may require `PyYAML`; if unavailable, do manual
frontmatter checks.
