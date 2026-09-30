# Generated Weapon Action VFX Pack 22 — approved and integrated

**Status:** APPROVED AND INTEGRATED  
**Date:** 2026-09-30  
**Source previews:** two transparent 4×3 raster sprite sheets generated and visually reviewed in the current ChatGPT dialog.

## Source provenance

- rifle first-person reload sheet — generation id `c2f29c32-6d78-49b5-8d79-a645beb180c2`, source 1536×1024 RGBA;
- SR-9 first-person bolt-cycle sheet — generation id `6d1aaf8b-876a-4d89-8c98-6d0ec26016d7`, source 1536×1024 RGBA.

The user explicitly approved integration after seeing both previews. The same-dialog exception in `docs/ASSETS.md` is used, so the heavy source rasters are not duplicated in Git.

## Runtime derivatives

- `assets/ui/fx/rifle-reload-vfx-atlas-22.webp` — 720×480 alpha WebP, 4×3 grid, 180×160 cells, <=160 KiB;
- `assets/ui/fx/sniper-bolt-cycle-vfx-atlas-22.webp` — 720×480 alpha WebP, 4×3 grid, 180×160 cells, <=160 KiB.

## Consumers / authority / fallback

- rifle reload → `src/combat/combat.js::doReload()` → action playback uses the existing reload duration; tactical path skips the late charging frames while empty reload uses all 12;
- SR-9 cycle → `src/combat/combat.js::shoot()` + `src/game/runtime.js` → action playback follows existing `cycleT`; the world casing still ejects at the existing cycle point;
- `src/weapons/system.js` owns the local first-person action layer and restores the static generated weapon after completion;
- procedural first-person animation, magazine-drop VFX, casing VFX and normal weapon art remain failure fallbacks;
- damage, ammo, reload/cycle timing, fire cadence, projectile behavior, recoil and RNG policy are unchanged.
