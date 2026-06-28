# Patch Script Audit

Last reviewed: 2026-06-28

## Runtime Load List

The old `pages/patches/*.js` files are still part of the boot path, but they are not all equal:

- Retired from `play.html`: `10-patch-v18-33.js`
  - Reason: family trust / family enterprise / business trust controls are now owned by `pages/systems/business-entities.js` and `pages/systems/tax-legal.js`.
  - The file stays on disk as historical backup, but it is no longer executed during normal play.

- Kept loaded for now: `01` through `09`, `11` through `16`
  - `07-patch-v18-30.js` still provides the legacy entity cash/tax action globals used by the current Business UI.
  - `11-patch-v18-33-2.js`, `13-patch-v18-33-4.js`, and `16-patch-v18-33-7.js` still protect save recovery, partial-save handling, and the Enter flow.
  - `12-patch-v18-33-3.js` still owns Wayback checkpoint globals used by Life Command and CDP coverage.
  - `14-patch-v18-33-5.js` and `15-patch-v18-33-6.js` still stabilize old hub navigation wrappers.

## Next Cleanup Candidates

- Move the remaining `07-patch-v18-30.js` action globals into `business-entities.js`, then remove patch 07 from the page load list.
- Move Wayback and recovery globals into `pages/systems/save-recovery.js` / `pages/systems/life-command.js`, then revisit patches 12, 13, and 16.
- Only remove a patch after the matching CDP probe passes with the script tag disabled.
