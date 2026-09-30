# Generated VFX Pack 15 — review before runtime integration

**Status:** `INTEGRATED` / runtime derivatives tracked by repository validation  
**Date:** 2026-09-30  
**Asset count:** 2

This batch intentionally targets two current gameplay events that still rely on generic/procedural presentation and are not covered by generated Packs 7–14. Both files are transparent, self-contained, scriptless SVG source previews. They are staging/review sources only and are **not** imported by `src/**`, `index.html`, runtime CSS or `assets/**`.

## 1. `frag-grenade-shrapnel-bloom-vfx-01.svg`

High-energy frag-grenade detonation with:
- white-hot ignition core and expanding pressure rings;
- asymmetric incandescent shrapnel fan;
- dark metal fragments with ember edges;
- delayed dust/smoke bloom and secondary sparks;
- deliberately uneven geometry so repeated detonations do not read as a perfect radial stamp.

**Intended consumer after approval:** `src/combat/combat.js::tickBotGrenades()` at the authoritative `g.fuse <= 0` detonation event.

**Current fallback that must remain:** `playExplosionSound(...)`, procedural `explode(...)`, and `spawnCombatImpact(pos, 'rocket')`.

**Integration plan:** build an 8-frame transparent world-space atlas, project it at `pos`, and keep playback bounded and elapsed-time driven. Add small seeded rotation/scale variation per detonation; keep damage, fuse timing, radius and collision logic unchanged.

## 2. `player-death-signal-collapse-vfx-01.svg`

16:9 death-transition overlay designed to preserve the live kill camera and death text:
- fast central impact iris;
- red peripheral collapse/vignette;
- fracture paths entering from screen edges instead of covering the center;
- sparse chromatic signal tears and angular shards;
- rapid decay so the battlefield becomes readable again early in the 15-second respawn interval.

**Intended consumer after approval:** `src/progression/progression.js::checkDeath()` after the authoritative death state is entered and `startDeathCamera(killer)` has switched to the kill camera.

**Current fallback that must remain:** `#death-flash` radial gradient, `#death-msg`, `battle-result-frame`, death audio, kill camera and existing respawn-countdown presentation.

**Integration plan:** build a deterministic 8–10-frame transparent 16:9 overlay atlas. Playback should be screen-local, short-lived and independent from the 15-second respawn timer. A reduced-motion path should skip the fracture/glitch motion and keep only a brief opacity pulse. Gameplay state, camera ownership and respawn timing stay authoritative in existing code.

## Browser/VFX implementation notes

- The animated SVGs are convenient visual review sources; runtime integration should freeze them into static atlas frames so game time remains authoritative.
- Runtime frame selection should use elapsed time rather than callback count, matching the current Pack 10–14 VFX player and avoiding refresh-rate-dependent speed.
- Screen-local runtime animation should primarily change `transform`/`opacity`; world-space effects should reuse the bounded presentation layer rather than create an unbounded particle DOM/tree.
- No JavaScript, remote resources, fonts or external URLs are embedded in either SVG.

## Review checklist

- [ ] Grenade detonation reads as distinct from rocket / mine / bomb VFX.
- [ ] Shrapnel is energetic but does not look like a perfect symmetric star.
- [ ] Death overlay leaves the center/death message readable.
- [ ] Death overlay clears quickly enough to expose the kill camera.
- [ ] Visual style fits ZAP ZONE's current orange/red combat VFX and technical HUD language.
- [x] User approved runtime integration.

After approval, update this file to `INTEGRATED` only after runtime hooks, fallbacks, validation and browser smoke checks pass.

## Integration result

Integrated into runtime as deterministic static SVG atlases:
- `assets/ui/fx/frag-grenade-shrapnel-bloom-atlas-15.svg`;
- `assets/ui/fx/player-death-signal-collapse-atlas-15.svg`.

The staging previews remain unchanged as archive/provenance and are not imported by the game. Gameplay authority and existing fallbacks are preserved. Repository validation owns the structural/browser verification for the integration commit.
