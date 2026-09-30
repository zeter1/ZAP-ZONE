# Generated VFX Pack 29 — surface impacts

Date: 2026-09-30
Status: reviewed in ChatGPT and explicitly approved for runtime integration.

## Source provenance

- ChatGPT image generation id: `69e5b2b7-e8da-48d3-8a3e-d5e790438d7d`
- reviewed source: 1254×1254 transparent 4×4 concept sheet
- source rows: concrete/dust → metal/ricochet → cyan tech/electrical → heavy debris
- the heavy generator raster is intentionally not duplicated in Git under the same-dialog approval exception.

## Runtime derivative

- `assets/ui/fx/surface-impact-vfx-atlas-29.webp`
- 320×320 VP8X alpha-WebP
- 4 columns × 4 rows, 80×80 source cells
- byte budget: <=64 KiB
- cleaned low-alpha chroma fringe/noise before downsampling and encoding.

## Consumer / event / fallback

- owner: existing bounded elapsed-time DOM combat VFX player in `src/settings/settings.js`
- trigger seam: `src/core/engine.js::wallImpact()`
- concrete/metal: close and medium wall hits
- tech row: existing Zone Net terminal proximity only; does not create a new ballistic material
- heavy row: SR-9 wall hit, real wall penetration, or marker-eligible first player-shotgun pellet
- fallback: Pack 10 concrete/metal/wood rows for wood, distance degradation or failed Pack 29 playback
- procedural fallback retained: sparks, smoke and pooled bullet-impact decals
- specialized layers retained: Pack 12 ricochet/penetration exit and Pack 27 terminal arc

## Gameplay contract

Presentation only. No changes to damage, projectile motion/drop, collision, wall resistance, penetration thickness, ricochet chance/retention, ammo, AI, sound ownership or gameplay RNG.
