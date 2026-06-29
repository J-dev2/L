# Patch Script Audit

Last reviewed: 2026-06-29

## Runtime Load List

The old `pages/patches/*.js` files are no longer part of the `play.html` boot path.

- `pages/patches/` is currently empty in the source tree.
- `play.html` has no active `<script src="pages/patches/...">` tags.
- `docs/build-report.json` has no `pages/patches` script entries after rebuild.
- `cdp/no-patches.js` guards the runtime contract so a future cleanup pass can catch accidental reintroduction.
  Browser verification passed 2/2 on 2026-06-29.

Absorbed behavior:

- Patch chunks `01` through `09` are embedded into `pages/runtime/00-core-app-runtime.js` under `BEGIN absorbed ...` markers.
- Patch `10` family enterprise / business-trust behavior is owned by `pages/systems/business-entities.js` and `pages/systems/tax-legal.js`.
- Patch `11`, `13`, and `16` recovery / partial-save / Enter-flow behavior is owned by `pages/systems/save-recovery.js` and related current systems.
- Patch `12` Wayback behavior is owned by `pages/systems/life-command.js`.
- Patch `14` and `15` navigation behavior is owned by `pages/systems/scroll-nav.js` and current hub modules.

## Next Cleanup Candidates

- Keep `pages/patches/` empty unless a historical snapshot is intentionally restored for reference.
- If a future branch reintroduces a patch script, require a matching audit note plus a CDP probe showing why it cannot live in a current owner module.
- Continue favoring current owner modules (`business-entities.js`, `tax-legal.js`, `save-recovery.js`, `life-command.js`, `scroll-nav.js`) over new patch files.
