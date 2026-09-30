# Generated VFX Pack 28 — rocket flight exhaust

**Status:** APPROVED AND INTEGRATED  
**Date:** 2026-09-30  
**Review gate:** the generated 4×3 rocket-exhaust source sheet was shown in this ChatGPT dialog and the user explicitly requested integration.

## Source provenance

- source generation id: `c699a5a8-db2f-4da7-91a3-e52977f7b390`;
- source master: transparent PNG, 1448×1086, 4×3 / 12 frames;
- visual intent: white-hot/blue nozzle core, orange turbulent flame, sparks and layered grey smoke, with ignition → sustained burn → soft dissipation variation.

Under the same-dialog source exception from `docs/ASSETS.md`, the large raster source sheet is not duplicated in Git.

## Runtime derivative

- `assets/ui/fx/rocket-flight-exhaust-vfx-atlas-28.svg`;
- 768×576 static/scriptless vector atlas, 4×3 / 12 frames;
- transparent background; no SMIL, script, foreignObject or external resource;
- intended for the existing DOM presentation layer, not as a persistent Three.js raster plane.

## Consumer / authority / fallback

- `src/combat/combat.js` projects every live player/bot rocket from its authoritative world position into `#projectile-trail-layer`;
- frame playback is elapsed-time driven and deterministic; no gameplay RNG is consumed;
- the overlay is oriented from the projected rocket velocity so the plume extends behind the projectile and scales down with camera distance;
- occluded/off-screen rockets hide their DOM overlay;
- the existing Three.js rocket body, additive procedural flame, smoke/spark particles, physics, collision, damage and explosion remain authoritative/fallback.
