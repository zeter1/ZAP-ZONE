# Generated VFX Pack 19 — approved and integrated

**Status:** APPROVED AND INTEGRATED  
**Date:** 2026-09-30  
**Source previews:** 2 transparent raster sprite sheets generated and visually reviewed in the current ChatGPT dialog.

The user explicitly approved integration after seeing both previews. The same-dialog exception in `docs/ASSETS.md` is used: the heavy source rasters are not duplicated in Git. This manifest preserves provenance and runtime mapping.

Runtime derivatives:
- `assets/ui/fx/landing-impact-vfx-atlas-19.svg` — deterministic scriptless 4×4 static-frame atlas; rows 0–1 concrete/gravel dust, rows 2–3 metal energy/sparks;
- `assets/ui/fx/smoke-throw-vfx-atlas-19.svg` — deterministic scriptless 4×2 first-person grip/throw/release/trail atlas.

Consumers and fallbacks:
- landing → `src/game/runtime.js` airborne-to-ground transition → existing movement/camera and Pack 18 footsteps remain authoritative; water intentionally skips this atlas;
- player smoke throw → `src/combat/combat.js::throwSmokeGrenade()` after successful 3D grenade spawn → `mkSmokeGrenade()`, trajectory/bounce, ammo/cooldown and Pack 12 `smokeDeploy` remain authoritative.

No jump physics, movement speed, smoke trajectory, smoke LOS/density, ammo economy, cooldown, damage or gameplay RNG policy is changed.
