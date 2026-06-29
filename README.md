# Ledger LifeSim Modular v18.35

Started from the v18.34 mechanical split, generated from `../Ledger_18_dynamic_stocks_v18_33_7_splash_stack_gate.html`.

AI agents: read `AI_DEV_README.md` first, then `dev-notes/ai-handoff/START_HERE.md`.

Open `index.html` to enter the Life Stack landing page. It reads save slots without loading the playable runtime.

Open `play.html` only through the landing page. The play entry requires an explicit `?slot=`, `?new=`, or `?sandbox=` boot command, which prevents the old active-slot auto-load bug from dropping you into a random character.

Groups:

- `themes/` owns palette and theme tokens.
- `styles/` owns extracted UI CSS.
- `assets/` is reserved for images, audio, icons, and generated media.
- `state/` documents current state/storage shape.
- `pages/landing/` owns the save-selection landing page.
- `pages/runtime/` owns the legacy core runtime.
- `pages/patches/` is historical; current patch chunks are absorbed into runtime/system modules and are not loaded from this folder.
- `pages/hubs/` names the playable hubs and bridges to current global renderers.
- `pages/systems/` maps gameplay systems to future files.
- `build/` can generate a single bundled HTML.
- `docs/page-map.json` records the extraction order and source file.

Important startup rule: `index.html` must not load `pages/runtime/00-core-app-runtime.js`. The playable runtime belongs to `play.html`, and `play.html` must receive an explicit boot command from the landing page.

Build one-file output (run from this folder):

```powershell
node build\build-ledger18.js
```

Outputs:

`dist/Ledger_18_dynamic_stocks_v18_35_landing_built.html`

`dist/Ledger_18_dynamic_stocks_v18_35_play_built.html`
