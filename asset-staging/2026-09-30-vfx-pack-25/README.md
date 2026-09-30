# Generated Weapon Action VFX Pack 25 — 2026-09-30

Status: **INTEGRATED after explicit same-dialog approval**.

The user reviewed two generated first-person action sheets in the current ChatGPT dialog and then explicitly requested integration. Under the same-dialog source exception in `docs/ASSETS.md`, the heavy source rasters are not duplicated in Git; this manifest records provenance, runtime derivatives, consumers and fallback boundaries.

## Reviewed source mapping
- pistol reload: 4×3 / 12 states from ready → magazine release/drop → fresh magazine insertion/seating → slide rack → ready;
- shotgun pump: 4×2 / 8 states from ready → fore-end travel → chamber opening/ejection → closing → ready.

## Runtime derivatives
- `assets/ui/fx/pistol-reload-vfx-atlas-25.webp` — 960×540 alpha WebP, 4×3 / 12 frames, 4:3 padded cells;
- `assets/ui/fx/shotgun-pump-cycle-vfx-atlas-25.webp` — 1024×384 alpha WebP, 4×2 / 8 frames, 4:3 padded cells.

The padding is intentional: the source contact sheets use narrower/square cells, while the current first-person action stage is 4:3. Repacking into transparent 4:3 cells preserves the approved weapon/hand proportions without runtime stretching.

## Consumers / authority / fallback
- pistol reload begins only after the existing reload state is authoritative in `src/combat/combat.js::doReload()`; tactical reload skips the late rack frames and empty reload uses all twelve;
- shotgun pump begins only from the existing `cycleTime` state after a successful real shot;
- `src/weapons/system.js` owns playback through the existing Pack 22 action layer;
- `src/game/runtime.js` keeps physical Three.js shell ejection and suppresses only the generic DOM shell-spin overlay when the full shotgun action is active;
- generic magazine-drop / shell-spin VFX and procedural/static first-person presentation remain load/decode fallbacks;
- ammo, reload/cycle duration, cadence, damage, recoil, pellet simulation, casing physics and gameplay RNG are unchanged.
