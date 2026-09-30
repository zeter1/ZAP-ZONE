# Generated VFX Pack 27 — respawn gate + reactive terminal arc

**Status:** APPROVED AND INTEGRATED  
**Date:** 2026-09-30  
**Review gate:** both generated source previews were shown in the current ChatGPT dialog and the user explicitly requested integration.

## Source provenance
- player respawn / materialization gate — generation id `56def2ee-5076-4f86-b3c0-954e434e2175`, source 1536×1024 RGBA;
- reactive terminal electrical breakdown — generation id `1020e275-5b51-400f-a279-d241a305a34e`, source 1774×887 RGBA.

The heavy raster sources are not duplicated in Git under the same-dialog reviewed-source exception from `docs/ASSETS.md`.

## Runtime derivatives
- `assets/ui/fx/player-respawn-gate-vfx-atlas-27.svg` — 768×512 viewBox, 3×2 / 6 deterministic static frames;
- `assets/ui/fx/terminal-electrical-arc-vfx-atlas-27.svg` — 900×480 viewBox, 5×2 / 10 deterministic static frames.

Both derivatives are scriptless/self-contained SVG atlases with no internal animation, scripts, embedded raster images or gameplay authority.

## Consumers / authority / fallback
- player respawn → existing `src/progression/progression.js` respawn transition → `showRespawnMaterializeFx()`; Pack 27 layers the new gate over the existing Pack 7 respawn overlay, which remains a load/failure fallback;
- terminal electrical reaction → `src/core/engine.js::wallImpact()` only when a hit is spatially close to an existing `createArenaTerminal()` body; a per-terminal cooldown bounds repeated fire;
- terminal collision and ballistic material are intentionally unchanged, so presentation cannot alter penetration/ricochet behavior;
- the 15-second respawn delay, spawn shield, HP/ammo, damage, projectile physics, AI, score and gameplay RNG remain unchanged.
