# Assets — quick map

## Pack 13 consumers
Two approved bot-combat VFX are integrated as `ui/fx/bot-combat-vfx-atlas-13.svg`, an 8×2 static-frame SVG atlas. Row 0 decorates real bot muzzle events through `src/ai/bot-fire-control.js`; row 1 decorates `Bot.die()` through `src/entities/bots.js`. `src/settings/settings.js` owns elapsed-time playback, per-bot muzzle throttling, world projection/orientation, budgeting and cleanup.

The pack is presentation-only. Existing procedural muzzle flashes, gibs and particles remain fallback; fire cadence, hit logic, projectile spawning, damage, kills and respawn are unchanged. The animated staging originals remain under `asset-staging/2026-09-30-vfx-pack-13/` as provenance.

## Pack 12 consumers
Five approved staging VFX are integrated as one deterministic 8×5 static-frame SVG mega-atlas: ricochet spark fan, wall-penetration exit debris, smoke deployment bloom, mine shrapnel detonation and bomb pressure-core detonation. `src/assets/catalog.js` owns row/frame/duration metadata, `src/settings/settings.js` reuses the existing bounded elapsed-time DOM VFX player, and `src/combat/combat.js` emits only from existing authoritative projectile/smoke/explosive events.

The atlas is presentation-only: projectile physics, penetration/ricochet policy, smoke LOS/density, fuse timers and blast damage/radius remain unchanged. Existing procedural particles, smoke puffs, explosion geometry, audio and screen shake remain fallback. The original animated SVG candidates stay under `asset-staging/2026-09-30-vfx-pack-12/` as provenance.

## Pack 11 consumers
Three approved staging VFX are integrated as deterministic static-frame SVG atlases: rocket explosion (4×3), plasma impact (4×3) and plasma reload energy-lock (4×2). `src/assets/catalog.js` owns atlas metadata, the existing bounded VFX player in `src/settings/settings.js` owns elapsed-time playback/projection/cleanup, and `src/combat/combat.js` emits the rocket detonation, plasma hit and completed plasma reload events.

The original animated SVGs remain under `asset-staging/2026-09-30-vfx-pack-11/` only as review/provenance sources. Runtime does not load staging. Procedural explosion/impact/reload presentation remains fallback, and generated art stays DOM-only rather than persistent Three.js texture geometry.

## Pack 10 consumers
Ten generated one-shot combat animations are packed into `ui/fx/combat-vfx-atlas-10.webp` as a uniform 8×10 alpha-WebP atlas. Rows represent rocket backblast, SR-9 pressure blast, shotgun muzzle smoke, brass casing, shotgun shell, magazine drop, concrete/metal/wood impacts and near-miss air streak.

Ownership: `src/assets/catalog.js` stores row/frame/duration metadata; `src/settings/settings.js` owns elapsed-time DOM playback, projection, budgets and cleanup; `src/combat/combat.js` emits local-player shot/reload/casing events; `src/game/runtime.js` emits pump/bolt ejection; `src/core/engine.js` emits material-impact presentation. Procedural feedback remains fallback and the generated atlas never becomes persistent Three.js texture geometry.

## Pack 9 consumers
The 2026-09-30 pack adds ten SVG runtime derivatives for match deployment, Frontline retarget/capture presentation, Second Wind, dodge feedback, perk-path identity, equipment readiness, ally tactical callouts, pause presentation and mobile controls. Geometric generated art now uses the contact sheet as visual source and commits lightweight SVG derivatives instead of unnecessary raster crops.

Ownership: `src/game/session.js` → deploy/pause; `src/game/frontline.js` → retarget/progress; `src/progression/progression.js` → Second Wind/dodge/perk path; `src/combat/combat.js` → equipment state; `src/game/runtime.js` → ally callouts/mobile controls. Existing text/procedural state remains authoritative.

## Pack 8 consumers
The 2026-09-29 tactical presentation pack adds ten compact alpha WebP atlases for reticles, minimap markers, spawn protection, respawn countdown, explosive fuse state, projectile trails, weapon switching, bot overhead frames, combo feedback and pickup beacons. Ownership stays close to the existing gameplay source: `src/game/runtime.js` owns reticle/shield/combo timing, `src/ui/minimap.js` owns tactical markers, `src/combat/combat.js` owns projectile/fuse presentation, `src/entities/bots.js` owns overhead bars, `src/entities/pickups.js` owns pickup beacons, and `src/player/state.js` emits the equip transition.

All Pack 8 images are DOM/canvas presentation only and keep procedural/text fallbacks. The generated minimap never exposes enemy locations or enemy deployables that were not already available to the player.

## Pack 7 consumers
The 2026-09-29 combat-texture pack adds ten generated alpha WebP assets: low-health, directional damage, smoke, ballistic/plasma muzzle sheets, explosion shockwave, suppression, armor-hit, sprint-speed and respawn materialization. Runtime ownership is split deliberately: `src/settings/settings.js` owns screen-space transient overlays, `src/game/runtime.js` owns low-health/sprint strengths, `src/progression/progression.js` owns armor-hit/respawn events, `src/core/engine.js` only emits the explosion presentation hook, and `src/weapons/system.js` consumes the two muzzle spritesheets.

All Pack 7 rasters remain DOM/CSS presentation-only and protocol-neutral. The procedural damage arrow, smoke gradient and procedural muzzle glow remain graceful fallbacks, so a missing generated texture does not remove critical gameplay information.

## Pack 6 consumers
The 2026-09-29 pack adds ten generated perk renders as 256×256 transparent WebP: `bulletstorm`, `immortal`, `doubletap`, `piercing`, `laststand`, `thorns`, `explosive_rounds`, `evasive_matrix`, `headshot_armor` and `bombtech`. They are selected by `perkAsset(id,path)` in `src/assets/catalog.js` and appear in both level-up perk cards and the active perk panel through the existing `src/progression/progression.js` consumers.

Every Pack 6 image keeps its per-id `assets/perks/*.svg` fallback, works in both HTTP(S) and direct `file://` runtimes, stays DOM-only, and is validated as VP8X alpha WebP at exactly 256×256 and <=32 KiB. The pack changes presentation only; perk balance and gameplay semantics are unchanged.

## Pack 5 consumers
The 2026-09-29 pack adds six generated status-HUD icons and two legendary perk renders as 256×256 transparent WebP. Status art lives in `ui/status` and is selected by `src/progression/progression.js` through `src/assets/catalog.js`, with the existing `status/*.svg` files kept as load/decode fallbacks. `predator-tech-01.webp` and `warmachine-tech-01.webp` are selected only for the matching legendary perk IDs; their existing unique perk SVGs remain fallback.

Pack 5 stays DOM-only, uses semantic ASCII filenames, and is validated as VP8X alpha WebP, exactly 256×256 and <=32 KiB per file. It does not alter perk/status gameplay semantics.

## Pack 4 consumers
The 2026-09-28 pack adds eight generated WebP assets. Consumer ownership is explicit: bomb FPS art → `src/weapons/system.js`; bomb/medkit world art → `src/entities/pickups.js`; scope overlays → `src/game/runtime.js`; Frontline burst → `src/entities/bots.js`; result frame → `src/progression/progression.js`; ammo crate → `src/styles/game.css`.

Do not add a generated file without a consumer and fallback. WebP upload must be binary-safe; CI verifies RIFF/WEBP envelopes and size caps.

Главный контракт: **[../docs/ASSETS.md](../docs/ASSETS.md)**.

## Ownership

- `ui/backgrounds` — menu/loading presentation backgrounds;
- `ui/feedback` — level/death/armor-break и другой transient DOM feedback;
- `ui/medals` — generated combat medals;
- `ui/objective` — objective/Frontline presentation;
- `ui/perks` — generated perk presentation overlays;
- `ui/status` — generated status-HUD presentation with `status/*.svg` fallback;
- `ui/icons`, `ui/teams`, `ui/pickups` — HUD/team/pickup presentation;
- `ui/pickups/weapons` — generated map weapon pickup WebP; DOM-projected from real 3D pickup positions;
- `ui/weapons/fp` — player-only generated first-person weapon presentation; never bot geometry;
- `medals`, `status`, `fx`, `perks` — lightweight SVG gameplay/UI fallbacks;
- `weapons` — weapon identity/model visuals;
- `audio` — local runtime audio;
- `environment`, `characters`, `pickups` — existing domain assets.

## Critical invariants

1. Generated raster/WebP UI art is DOM/CSS presentation-only; do not route it into persistent WebGL texture planes/sprites. Generated player-held weapons and generated world pickups follow the same rule: DOM presentation with procedural Three.js fallback. Bots remain procedural. Current FPS weapon pack is **baked-hands**: when its image is active, hide the entire local procedural first-person rig so blocky fallback hands are never double-rendered.
2. Critical information keeps SVG/text/DOM fallback; decorative art may degrade to absence only when meaning remains intact.
3. Runtime generated filenames are semantic ASCII kebab-case, not generator filenames.
4. Add every runtime asset to `GAME_ASSETS` and `scripts/validate-structure.mjs`.
5. After runtime asset change, restamp web build and commit `CHANGELOG.md` in the same logical change.
6. Upload a pack atomically when possible; do not create one push/CI run per image.
7. For manual static/uCoz publication upload `version.json` last.
8. FPS weapon generation must match the approved first-person reference angle/framing; a side-profile/poster weapon is not an acceptable replacement even if the art itself is high quality.
9. Current FPS runtime derivative target: 960×720 transparent WebP, <=250 KiB, per-weapon framing/muzzle tuning, visual screenshot check before calling the integration complete.
10. FPS weapon canvas keeps transparent headroom/left-space; do not tight-crop. Desktop visible silhouette should stay in the lower-right safe sector and away from reticle + center-bottom HP/Score/Kills.
11. Decorative weapon art stays below critical HUD layers; clamp raster sway/rotation so recoil cannot drag the baked image across HUD safe zones.
12. Approved V3 baseline: 960×720 alpha, generous transparent headroom/left-space, baked first-person angle, screenshot-tuned per-weapon placement. Reuse this composition contract for new player-held assets.
13. Recoil is runtime-only and frame-rate independent; muzzle flash is a separate anchored layered effect, never baked into the weapon image and never a short opaque/stubby shape.
14. Mine and smoke may use baked-hands DOM assets like firearms; bomb remains procedural until it has its own approved asset.
15. Generated world weapon pickups use 512×384 alpha WebP <=120 KiB in `ui/pickups/weapons`; project the real 3D pickup position into DOM screen space, keep pedestal/beacon/gameplay geometry in Three.js.
16. World pickup DOM art must use distance scaling + viewport clipping + wall Raycaster occlusion and fall back to `createWorldWeaponModel()` on image error.
17. Never route generated world pickup WebP through `gameTexture`, `makeAssetPlane` or `makeAssetSprite`; bomb stays procedural until it has its own approved asset.
18. Binary-safe upload invariant: WebP/PNG/JPEG must be uploaded as base64-decoded Git blobs, never as UTF-8 text. Verify the created Git blob SHA against the local file bytes before putting it in a tree.
19. After a binary asset commit, validate magic/envelope from GitHub (WebP must be RIFF…WEBP) and let `scripts/validate-structure.mjs` fail hard on corrupted or text-wrapped payloads.
20. Dual-runtime invariant: every visual/runtime asset must work both from uCoz/static HTTP(S) hosting and from a direct local `file://.../index.html` launch. Do not gate generated visual art off merely because the protocol is `file:`.
21. HTTP(S) may add the current build query for cache busting; local file mode must use plain relative paths. Generated menu backgrounds, logos, HUD/perk/medal/feedback art and weapon/pickup DOM art must remain available in both modes with fallback only on real load/decode failure.
22. Asset work is not complete until both hosted validation and the local-file browser smoke prove the relevant generated presentation path is active.
23. Pack 5 status/legendary-perk runtime derivatives are 256×256 alpha WebP <=32 KiB. Keep SVG fallback wiring; never make these presentation images a gameplay-state dependency.
24. Pack 6 perk runtime derivatives use the same 256×256 alpha WebP <=32 KiB envelope. Each new generated perk must resolve through `perkAsset(id,path)`, retain its exact per-id SVG fallback, and remain presentation-only.
