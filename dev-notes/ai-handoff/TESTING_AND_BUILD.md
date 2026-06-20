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
& "C:\Users\jgodj\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" --check pages\systems\YOUR_FILE.js
```

Also check any touched runtime or patch file.

## Rebuild

After source changes, rebuild:

```powershell
& "C:\Users\jgodj\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" build\build-ledger18.js
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

Existing useful probes:

- `.cdp-separation.js`
- `.cdp-features.js`
- `.cdp-ipo.js`

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
