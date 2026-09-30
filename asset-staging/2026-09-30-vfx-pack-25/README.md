# Generated Weapon Action VFX Pack 25 — 2026-09-30

Status: **INTEGRATED after explicit same-dialog approval**.

The user reviewed both generated first-person source sheets directly in the current ChatGPT dialog and then requested integration. Under the same-dialog source exception in `docs/ASSETS.md`, the heavy raster sources are not duplicated in Git; this manifest records their stable generation identity, intended sequence and runtime derivatives.

## Reviewed sources
- pistol reload source — image generation id `7268b229-456f-45d3-80b4-94d15ec8f6ba`; 1536×1024 RGBA contact sheet, interpreted as a 4×3 / 12-frame sequence;
- shotgun pump source — image generation id `1907785e-46c2-422d-8da7-87ad9c749b21`; 1774×887 RGBA contact sheet, interpreted as a 4×2 / 8-frame sequence.

## Runtime derivatives
- `assets/ui/fx/pistol-reload-vfx-atlas-25.svg` — static/scriptless 4×3 atlas remastered from the approved pistol composition and amber/black material language;
- `assets/ui/fx/shotgun-pump-vfx-atlas-25.svg` — static/scriptless 4×2 atlas remastered from the approved shotgun composition, including the visible red/brass shell-ejection phase.

## Consumers / authority / fallback
- `src/weapons/system.js` owns playback via the existing Pack 22 first-person action layer;
- `src/combat/combat.js::doReload()` starts pistol presentation only after authoritative reload state exists; tactical reload skips the slide-rack phase while empty reload uses all frames;
- the player-shot cycle hook starts the shotgun pump action only after the authoritative `cycleTime` state is created;
- `src/game/runtime.js` keeps real Three.js shell ejection authoritative and suppresses only the duplicate Pack 10 2D shell overlay while Pack 25 pump art is active;
- old magazine-drop/shell-spin and normal generated/procedural first-person art remain fallbacks;
- ammo, timing, damage, recoil, spread, ballistics, fire cadence and gameplay RNG are unchanged.
