# Generated VFX Pack 18 — approved and integrated

**Status:** APPROVED AND INTEGRATED  
**Date:** 2026-09-30  
**Source previews:** 3 transparent raster sprite sheets generated and visually reviewed in the current ChatGPT dialog.

The user explicitly approved integration after seeing all three previews, so the same-dialog approval exception in `docs/ASSETS.md` is used: the heavy source rasters are not duplicated in Git. This manifest preserves provenance and the exact runtime mapping.

Runtime derivative: `assets/ui/fx/player-action-vfx-atlas-18.svg` — deterministic scriptless 4×7 static-frame atlas.

- rows 0–1 → shotgun shell insert → `src/combat/combat.js::completePlayerReloadStep()` → existing shell animation/audio remain fallback;
- row 2 → metal foot contact → `src/settings/settings.js::playFootstepSound()` → existing footstep audio/procedural motion remains fallback;
- row 3 → concrete/gravel dust foot contact → same footstep owner/fallback;
- row 4 → water splash foot contact → same footstep owner/fallback;
- row 5 → medkit HP recovery → `src/entities/pickups.js::tickPickups()` → existing HUD toast/HP update remain authoritative;
- row 6 → medkit overheal-to-armor → same pickup owner → existing HUD toast/armor update remain authoritative.

No gameplay timing, ammo, movement speed, healing amount, armor amount, pickup respawn or RNG policy is changed by this pack.
