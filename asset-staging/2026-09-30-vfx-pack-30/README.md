# Generated VFX Pack 30 — tracked plasma flight ion sheath

Date: 2026-09-30
Status: reviewed in ChatGPT and explicitly approved for runtime integration.

## Source provenance

- ChatGPT image generation id: `86aabc48-76a6-4ac5-b768-9377f28bb473`
- reviewed source: 1254×1254 transparent 4×4 concept sheet
- visual direction: white-hot plasma core, cyan/electric-blue ion sheath, violet accents, electrical arcs and turbulent tail
- the heavy generator raster is intentionally not duplicated in Git under the same-dialog approval exception.

## Runtime derivative

- `assets/ui/fx/plasma-flight-ion-sheath-vfx-atlas-30.webp`
- 256×256 VP8X alpha-WebP
- 4 columns × 4 rows, 64×64 source cells
- 24,616 bytes (budget <= 32 KiB)
- SHA-256: `4e6a814a7a6010f956a1a4b885a56dca1efdc64b06e58976f58c3da084dfa4a6`
- low-alpha fringe/noise was cleaned before downsampling/encoding.

## Consumer / event / fallback

- owner: tracked presentation helper in `src/combat/combat.js`
- authoritative sources: live `pBullets` / `eBullets` with `wKey === 'plasma'`
- launch frames: 0–3; sustained frames: 4–11; late-life breakup: 12–15
- projection follows the real projectile position and velocity; off-screen, LOS-blocked and over-budget effects are hidden/omitted
- fallback: existing Pack 8 one-shot plasma trail until/if the atlas is unavailable, plus the existing Three.js plasma tracer at all times
- the legacy Pack 8 trail RNG draw remains consumed when Pack 30 suppresses that visual, preserving observable gameplay RNG ordering.

## Gameplay contract

Presentation only. No changes to projectile spawn, velocity, gravity/drop, collision, wall penetration, damage, ammo, recoil, AI, impact ownership or gameplay RNG.
