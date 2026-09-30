# Sniper VFX Asset Pack 23 — approved and integrated

**Status:** APPROVED AND INTEGRATED  
**Date:** 2026-09-30  
**Review gate:** the user saw the generated previews in the current ChatGPT dialog and explicitly requested integration.

## Source provenance

Five transparent generated raster sheets:
- rifle bullet flight + aerodynamic smoke trail — generation id `41b2c99c-e243-4d8f-8d96-3e6caaf4d40c`, source 1774×887 RGBA;
- post-shot smoke plume / blast decay — generation id `31f78274-6f7a-4a39-8d49-634ece2528ac`, source 1774×887 RGBA;
- supersonic bullet pressure wake — generation id `1bf2465d-9442-4084-a20f-76a2ae166c90`, source 1774×887 RGBA;
- muzzle flash + smoke sequence — generation id `188fc1c6-905b-4a76-9be0-a2306dba0ce1`, source 1774×887 RGBA;
- rotating rifle casings — generation id `06608999-f78f-4f4b-98da-a5dd992d59d5`, source 1448×1086 RGBA.

The heavy source PNGs total roughly 6.4 MiB and are not duplicated in Git under the same-dialog reviewed-source exception.

## Runtime derivatives

| Runtime asset | Grid | Content | Bytes |
| --- | --- | --- | ---: |
| `assets/ui/fx/sniper-shot-vfx-atlas-23.webp` | 4×4, 768×768 | muzzle rows 0–1 + delayed smoke rows 2–3 | 154,264 |
| `assets/ui/fx/sniper-ballistics-vfx-atlas-23.webp` | 4×4, 768×768 | bullet/trail rows 0–1 + supersonic wake rows 2–3 | 69,250 |
| `assets/ui/fx/sniper-casing-vfx-atlas-23.webp` | 4×3, 768×576 | twelve casing spin poses | 77,398 |

Total runtime payload: 300,912 bytes.

## Consumer / authority / fallback

- `src/settings/settings.js::showGeneratedSniperShotVfx()` emits muzzle + delayed smoke and alternates bullet/supersonic presentation without using gameplay RNG.
- The `sniperFlight` anchor aligns the side-view ballistic art from the current first-person muzzle toward screen center/reticle.
- `src/game/runtime.js` calls `showGeneratedSniperCasingFx()` only when Pack 22's `sniperBoltCycle` action is not active. This avoids duplicate casing art while preserving the real Three.js casing ejection.
- SR-9 hitscan, damage, penetration, recoil, cadence, cycle timing and 70 ms instant trace remain authoritative and unchanged.
- Existing Pack 8/10/procedural visuals remain compatibility fallback; Pack 23 owns no gameplay state.
