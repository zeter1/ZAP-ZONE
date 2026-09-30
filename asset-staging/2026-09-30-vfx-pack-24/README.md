# Generated Weapon Utility Action VFX Pack 24 — 2026-09-30

Status: **INTEGRATED after explicit same-dialog approval**.

The user reviewed the generated 1536×1024 RGBA contact sheet in the current ChatGPT dialog and then explicitly requested integration. Under the same-dialog source exception in `docs/ASSETS.md`, the heavy source raster is not duplicated in Git; this manifest records provenance and the exact runtime derivatives.

## Reviewed source mapping
- top 4×3 / 12 frames → rocket-launcher reload: rear access, rocket insertion, lock/close and return-to-ready;
- bottom 6×1 / 6 frames → mine throw/deploy: grip/arming, release and follow-through. The reviewed generator output contains six distinct mine states, so runtime uses those six directly rather than inventing duplicate/interpolated frames.

## Runtime derivatives
- `assets/ui/fx/rocket-reload-vfx-atlas-24.webp` — 720×405 alpha WebP, 4×3 / 12 frames, ~85 KiB;
- `assets/ui/fx/mine-throw-vfx-atlas-24.webp` — 1080×135 alpha WebP, 6×1 / 6 frames, ~39 KiB.

Both atlases use 4:3 per-frame cells to match the existing first-person action stage without stretching the reviewed silhouettes.

## Consumers / authority / fallback
- rocket reload starts only after the existing reload state has become authoritative in `src/combat/combat.js::doReload()`; playback duration is driven by the existing `reloadTot/reloadT` timer;
- the full rocket action suppresses only the generic Pack 10 magazine-drop overlay while it is actually available; the static generated/procedural first-person weapon remains fallback;
- mine throw starts only after the real Three.js mine has been spawned and inserted into the authoritative `mines` collection;
- ammo consumption, reserve transfer, cooldowns, mine physics/arming, rocket reload duration, damage, recoil and gameplay RNG are unchanged;
- playback reuses the Pack 22 first-person action owner in `src/weapons/system.js`, so cleanup and elapsed-time stepping remain centralized.
