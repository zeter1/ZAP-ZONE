# Generated VFX Pack 26 — weapon discharge + heavy explosion diversity

**Status:** APPROVED AND INTEGRATED  
**Date:** 2026-09-30  
**Review gate:** both generated source sheets were shown in this ChatGPT dialog before the user explicitly requested integration.

## Source provenance
- warm ballistic rifle/discharge + explosion source — generation id `d201b4cc-e8e8-4aad-9070-e6053539bb7e`;
- cyan energy rifle/discharge + explosion source — generation id `bb659bb4-0651-4647-abd2-deb8d8c001fc`.

Under the same-dialog source exception from `docs/ASSETS.md`, the large raster source sheets are not duplicated in Git. Only compact runtime derivatives are committed.

## Runtime derivatives
- `assets/ui/fx/weapon-discharge-vfx-atlas-26.webp` — 512×192 RGBA/alpha WebP, 4×2 / 8 frames, 46,710 bytes. Row 0: four ballistic muzzle/post-shot states for pistol/rifle. Row 1: four cyan energy-discharge states for plasma.
- `assets/ui/fx/heavy-explosion-vfx-atlas-26.webp` — 512×192 RGBA/alpha WebP, 4×2 / 8 representative ignition/fire/smoke states, 41,876 bytes.

## Consumers / authority / fallback
- `src/combat/combat.js` already emits the authoritative successful-shot hook; `src/settings/settings.js::showGeneratedWeaponShotVfx()` maps pistol/rifle/plasma into Pack 26 without changing the shot itself;
- rocket detonation keeps Pack 11 as primary/fallback and deterministically adds the heavy layer every third rocket;
- bomb detonation keeps Pack 12 as primary/fallback and adds the heavy layer after the existing detonation presentation;
- playback remains DOM-only and elapsed-time driven through the shared generated-combat VFX owner;
- procedural/older generated visuals remain fallback if Pack 26 cannot load/decode;
- ammo, damage, blast radius, projectile physics, recoil, cadence, timing, rewards and gameplay RNG remain unchanged.
