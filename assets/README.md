## Pack45 — попадания пуль

Подробные Pack29 concrete/metal/heavy вблизи и вдали; Pack45 для дерева и decode fallback, без декоративных колец: [canonical contract](../docs/ASSETS.md#попадания-пуль-по-поверхностям--pack45). [Source and mapping](../asset-staging/2026-10-06-surface-impact-45/README.md).

## Pack42 — дымовуха

FPS ready/throw/reload, flight/vent/pickup/icon, cloud timeline, near/far variants, eight curls, dense/edge inside fog и пять WAV: [canonical contract](../docs/ASSETS.md#дымовуха--pack42). [Source manifest](../asset-staging/2026-10-04-smoke-pack-42/manifest.json); проверки и ограничения — batch VERIFICATION.md.

## Pack40 — пистолет

Ready/reload, flame/smoke/bullet/casing, pickup/icon и четыре WAV: [canonical asset contract](../docs/ASSETS.md#пистолет--pack40). [Исходники, prompts и SHA256](../asset-staging/2026-10-04-pistol-pack-40/manifest.json); live checks — batch VERIFICATION.md.

## Pack36 — штурмовая винтовка

Ready/reload, flame/smoke/bullet/casing, pickup/icon и общий hip/ADS прицел: [canonical asset contract](../docs/ASSETS.md#штурмовая-винтовка--pack36). Исходники и hashes: [batch manifest](../asset-staging/2026-10-03-rifle-pack-36/manifest.json). Правила цельности рук и огня от дула находятся в том же canonical документе.

# Pack 34

See `../docs/ASSETS.md` for grenade ready/throw/pickup/flight/blast and 15-second ground-crater owners. Runtime mapping and source hashes: `../asset-staging/2026-10-03-grenade-pack-34/manifest.json`.

# Runtime assets — карта consumers

Общий контракт, включая правила slicing, качества, identity, image fallback, RNG и браузерных проверок: [docs/ASSETS.md](../docs/ASSETS.md#практические-правила-для-weaponactionvfx-ассетов). Для Blender/GLB/3D authoring и переноса в Three.js использовать [docs/BLENDER_ASSET_PIPELINE.md](../docs/BLENDER_ASSET_PIPELINE.md). Исходные кандидаты и provenance находятся вне runtime в [asset-staging](../asset-staging/README.md).

## Pack47 — modular sci-fi Blender map kit

Runtime portable model: `environment/models/zap-map-sci-fi-kit-47.glb`; direct-`file://` generated derivative: `environment/models/zap-map-sci-fi-kit-47.runtime.js`. Editable `.blend`, deterministic builder, preview, manifest and provenance: `../asset-staging/2026-10-07-map-sci-fi-kit-47/`. Runtime owner is `src/environment/map-kit3d.js`.

Pack47 is **presentation-only**. Existing `src/core/engine.js::box()` meshes/AABBs remain authoritative for collision, LOS/raycast and minimap geometry. Do not add Pack47 children to `wallMeshes` / `wallAABBs`, and do not hide authoritative owners with `visible=false`. Full ownership/rebuild contract: [Blender pipeline](../docs/BLENDER_ASSET_PIPELINE.md) and [canonical assets contract](../docs/ASSETS.md#модульный-sci-fi-environment--pack47).

## Pack46 — volumetric Blender bots

Runtime 3D model: `characters/models/zap-bot-modular-46.glb`; direct-`file://` derivative: `characters/models/zap-bot-modular-46.runtime.js`. Editable `.blend`, deterministic builder, preview/runtime proof and hashes live in `../asset-staging/2026-10-06-bot-3d-pack-46/`. Runtime owner is `src/entities/bot-model3d.js`; hit-mesh/arm/leg bridge is `src/entities/bot-presentation.js`. Pack46 is real mesh geometry, not a DOM/raster bot sprite.

## Pack 33 player plasma

Player-held plasma ready and tactical/empty reload use one six-frame generated source. Runtime paths, quality budget, decode fallback and timing live in [the canonical Pack33 contract](../docs/ASSETS.md#player-plasma-presentation-pack-33-2026-10-03). Upper weapon-bar icons are unchanged.

## Pack 32 consumers

SR-9 ready/reload/bolt и отдельные muzzle/smoke/bullet/casing слои используют один approved комплект. Пути, frame sequences, owners, fallback и regression описаны в [canonical Pack32 contract](../docs/ASSETS.md#sr-9-sniper-presentation-pack-32-2026-10-03); source и hashes — в [batch README](../asset-staging/2026-10-03-sniper-pack-32/README.md). Это player first-person presentation; world pickups и bot geometry сохраняют свои consumers.

## Pack 31 consumers
Pack33 now owns primary player plasma ready/reload. Pack31 is the matched ready/reload fallback when the primary ready asset cannot decode; see the canonical Pack33 contract above.

The approved plasma-core reload source is integrated as `ui/fx/plasma-core-reload-vfx-atlas-31.webp` (4×3 / 12 frames), and frame 12 of the same source defines the ordinary ready-state player weapon as `ui/weapons/fp/player-plasma-fps-31.webp`. This intentionally makes the weapon seen during normal play the same design seen during reload rather than swapping to a different model only for the action.

`src/weapons/system.js` reuses the bounded first-person action stage and `src/combat/combat.js` stretches tactical/empty sequences to the authoritative existing reload timers. If Pack 31 cannot start, the previous generic magazine drop plus Pack 11 plasma energy-lock completion VFX remain fallback; the procedural first-person plasma rig remains fallback for ready presentation.

**Identity rule:** whenever a generated first-person reload/action asset visibly redesigns the weapon, update the normal player-visible idle/ready asset in the same integration pass. Do not ship reload-only weapon redesigns.

## Pack 30 consumers
The approved plasma-flight source is integrated as `ui/fx/plasma-flight-ion-sheath-vfx-atlas-30.webp`, a compact 4×4 / 16-frame alpha-WebP atlas. `src/combat/combat.js` projects it from each live player/bot plasma bullet using the real projectile position and velocity, with distance scaling, LOS/off-screen culling and a bounded DOM-node budget.

Pack 30 is presentation-only and deterministic. The existing Three.js plasma tracer remains authoritative/fallback. Pack 8's one-shot plasma trail remains a load/decode fallback; when Pack 30 is ready that older overlay is hidden while its legacy RNG draw is still consumed to preserve gameplay RNG ordering.

## Pack 29 consumers
The approved surface-impact source is integrated as `ui/fx/surface-impact-vfx-atlas-29.webp`, a 320×320 alpha-WebP 4×4 atlas. Rows are concrete/dust, metal/ricochet, cyan tech-panel impact and heavy ballistic debris; the runtime player stretches selected source frames into short elapsed-time sequences without self-running image animation.

`src/core/engine.js::wallImpact()` remains the single surface-feedback seam. Pack29 concrete/metal/heavy now apply at every distance with physical size and wall/smoke occlusion; heavy source cell0 is skipped. Wood and unavailable Pack29 use the first three frames of material-matching Pack45. Missing both leaves procedural particles and marks. Terminal electricity, old distant Pack10 and the separate Pack12 penetration-exit ring are retired; bullet mechanics and historic RNG draws remain. See the canonical surface-impact contract above for current metadata and verification.

## Pack 28 consumers
The approved rocket-flight source is integrated as `ui/fx/rocket-flight-exhaust-vfx-atlas-28.svg`, a compact static 4×3 / 12-frame transparent atlas. `src/combat/combat.js` projects it from each live player/bot rocket into the existing projectile presentation layer, aligns the plume opposite the projected velocity and scales it by camera distance.

Pack 28 is presentation-only and deterministic. Off-screen/occluded overlays are hidden; the existing Three.js rocket body, additive procedural exhaust, smoke/spark particles, physics, collision, damage and explosion remain authoritative/fallback.

## Pack 27 consumers
The player respawn gate was retired on 2026-10-06: `ui/fx/player-respawn-gate-vfx-atlas-27.svg` and its catalog/spec/anchor/CSS/runtime wiring were deleted. Gameplay respawn and spawn protection are unchanged. `ui/fx/terminal-electrical-arc-vfx-atlas-27.svg` remains only as a compatibility/provenance asset; its helper returns false and does not allocate VFX.

## Pack 26 consumers
Two newly approved generated source sheets are integrated as compact presentation-only alpha-WebP atlases: `ui/fx/weapon-discharge-vfx-atlas-26.webp` (4×2 / 8 frames) and `ui/fx/heavy-explosion-vfx-atlas-26.webp` (4×2 / 8 frames). The first atlas gives pistol/rifle shots a warmer ballistic discharge sequence and plasma a distinct cyan energy discharge. The second provides an ignition-to-smoke heavy blast sequence.

`src/settings/settings.js` owns playback through the existing elapsed-time DOM VFX layer. The current `src/combat/combat.js` shot/rocket/bomb hooks stay authoritative: every third rocket can receive the heavy visual layer and each bomb receives it after the existing Pack 12 detonation layer. Existing procedural/Pack 10–12 visuals remain fallback, and Pack 26 changes no ammo, damage, blast radius, projectile physics, timing or gameplay RNG.

## Pack 25 consumers
Two approved first-person action sheets are integrated as `ui/fx/pistol-reload-vfx-atlas-25.webp` (4×3 / 12 frames) and `ui/fx/shotgun-pump-cycle-vfx-atlas-25.webp` (4×2 / 8 frames). Both atlases use 4:3 padded frame cells so the existing `#fp-weapon-action` stage preserves weapon/hand proportions instead of stretching the generated sources.

`src/weapons/system.js` reuses the Pack 22 action layer. `src/combat/combat.js` starts pistol reload from the real reload timer and shotgun pump from the real post-shot cycle timer; `src/game/runtime.js` keeps the real Three.js shell ejection but suppresses the older DOM shell-spin fallback only while the complete pump action is active. Gameplay timing, ammo, damage, recoil and RNG remain authoritative and unchanged.

## Pack 24 consumers
Two newly approved first-person action sources are integrated as `ui/fx/rocket-reload-vfx-atlas-24.webp` (4×3 / 12 frames) and `ui/fx/mine-throw-vfx-atlas-24.webp` (6×1 / 6 frames). `src/weapons/system.js` reuses the Pack 22 action layer; `src/combat/combat.js` starts rocket reload only from the authoritative reload timer and mine throw only after the real mine has been spawned.

Pack 24 is presentation-only. Rocket ammo transfer/reload timing and mine ammo/cooldown/trajectory/arming stay authoritative. The generic magazine-drop overlay remains the rocket fallback when the full action atlas cannot start, while the ordinary generated/procedural first-person mine remains fallback for the throw animation.

## Pack 23 consumers
Five approved SR-9 source sheets are compacted into three runtime WebP atlases: `ui/fx/sniper-shot-vfx-atlas-23.webp`, `ui/fx/sniper-ballistics-vfx-atlas-23.webp` and `ui/fx/sniper-casing-vfx-atlas-23.webp`. `src/settings/settings.js` owns muzzle/smoke/ballistic playback and aligns the projectile overlay from the current first-person muzzle toward the reticle; `src/game/runtime.js` uses the dedicated casing atlas only when Pack 22's full bolt animation is unavailable.

The SR-9 remains hitscan-authoritative. Pack 23 never changes damage, penetration, timing or projectile simulation and consumes no gameplay RNG. Existing procedural muzzle, instant Three.js trace, Pack 8 trail, Pack 10 casing and Pack 22 bolt-cycle presentation remain compatibility/fallback layers; the old Pack 10 sniper-pressure overlay is retired.

## Pack 22 consumers
Two approved first-person weapon-action sheets are integrated as `ui/fx/rifle-reload-vfx-atlas-22.webp` and `ui/fx/sniper-bolt-cycle-vfx-atlas-22.webp`. `src/weapons/system.js` owns the temporary action layer inside the existing first-person DOM stage; `src/combat/combat.js` starts actions only from real rifle reload / SR-9 cycle events, and `src/game/runtime.js` advances them from elapsed time.

Rifle tactical reload skips the late charging phase while empty reload uses all twelve source frames. SR-9 bolt cycling temporarily hides scope presentation, but the existing cycle timer, world casing ejection, weapon blocking and procedural animation remain authoritative/fallback. Both 720×480 alpha-WebP atlases are presentation-only and never become persistent Three.js textures.

## Pack 18 consumers
`ui/fx/player-action-vfx-atlas-18.svg` remains for rows 0–1 shotgun shell-insert presentation only. Rows 2–6 are retired/unreachable: generated metal/dust/water footsteps and medkit heal/armor pulses have no runtime specs, helpers, anchors, consumers or CSS. Footstep audio, movement and medkit gameplay are unchanged.

## Pack 17 consumers
Pack 17 was fully retired on 2026-10-06. `ui/fx/interaction-vfx-atlas-17.svg` and the generated bot reload/hit/pickup-collapse wiring were deleted; gameplay timing, damage/AI and pickup economy remain authoritative.

## Pack 16 consumers
Pack 16 was fully retired on 2026-10-06. `ui/fx/bot-action-vfx-atlas-16.svg` and all generated bot plasma-muzzle/dodge/spawn presentation wiring were removed. Bot firing, dodge and spawn gameplay remain unchanged.

# Assets — quick map

## Pack 15 consumers
The two approved staging candidates are integrated as separate deterministic static SVG atlases. `ui/fx/frag-grenade-shrapnel-bloom-atlas-15.svg` decorates the authoritative bot frag-grenade fuse detonation in `src/combat/combat.js`; `ui/fx/player-death-signal-collapse-atlas-15.svg` is a short full-screen transition started by `src/progression/progression.js::checkDeath()` after the kill camera takes ownership and advanced by the dedicated dying branch in `src/game/runtime.js`.

Both are presentation-only. Procedural explosions, impact art, death radial flash, death text, kill camera, audio and the exact 15-second respawn remain fallback/authority. The original animated sources stay under `asset-staging/2026-09-30-vfx-pack-15/` as provenance.

## Pack 14 consumers
Pack 14 was fully retired on 2026-10-06. `ui/fx/player-feedback-vfx-atlas-14.svg` and generated `criticalHit` / `playerArmorBreak` wiring were deleted. Damage multipliers, armor absorption, HP, hitmarkers and ordinary procedural/HUD feedback remain unchanged.

## Pack 13 consumers
Pack 13 was fully retired on 2026-10-06. `ui/fx/bot-combat-vfx-atlas-13.svg` and the generated bot muzzle/death presentation wiring were removed. Existing procedural muzzle feedback, gibs/particles, damage, kills and respawn remain unchanged.

## Pack 12 consumers
Five approved staging VFX are integrated as one deterministic 8×5 static-frame SVG mega-atlas: ricochet spark fan, wall-penetration exit debris, smoke deployment bloom, mine shrapnel detonation and bomb pressure-core detonation. `src/assets/catalog.js` owns row/frame/duration metadata, `src/settings/settings.js` reuses the existing bounded elapsed-time DOM VFX player, and `src/combat/combat.js` emits only from existing authoritative projectile/smoke/explosive events.

The atlas is presentation-only: projectile physics, penetration/ricochet policy, smoke LOS/density, fuse timers and blast damage/radius remain unchanged. Existing procedural particles, smoke puffs, explosion geometry, audio and screen shake remain fallback. The original animated SVG candidates stay under `asset-staging/2026-09-30-vfx-pack-12/` as provenance.

## Pack 11 consumers
Three approved staging VFX are integrated as deterministic static-frame SVG atlases: rocket explosion (4×3), plasma impact (4×3) and plasma reload energy-lock (4×2). `src/assets/catalog.js` owns atlas metadata, the existing bounded VFX player in `src/settings/settings.js` owns elapsed-time playback/projection/cleanup, and `src/combat/combat.js` emits the rocket detonation, plasma hit and completed plasma reload events.

The original animated SVGs remain under `asset-staging/2026-09-30-vfx-pack-11/` only as review/provenance sources. Runtime does not load staging. Procedural explosion/impact/reload presentation remains fallback, and generated art stays DOM-only rather than persistent Three.js texture geometry.

## Pack 10 consumers
The shared `ui/fx/combat-vfx-atlas-10.webp` remains for active weapon/casing/impact rows. The old SR-9 `sniperPressure` row and `nearMiss` row are retired/unreachable: their runtime specs, helpers/consumers and CSS were removed. Suppression mechanics/audio remain active without generated near-miss streak art.

## Pack 9 consumers
The match-deploy, Frontline-retarget, Second-Wind and dodge-phase screen animations were retired on 2026-10-06; their standalone SVGs and DOM/CSS/playback wiring were deleted. Pack 9 still provides perk-path identity, equipment readiness, Frontline progress decoration, ally tactical callouts, pause presentation and mobile controls.

## Pack 8 consumers
Spawn-protection generated art and the legacy center-screen projectile-trail atlas were retired on 2026-10-06. The fake trail atlas/helper/CSS/shot wiring remain deleted, but the shared `#projectile-trail-layer` container is retained because current world-projected mine, bomb, rocket, plasma, grenade and rifle/shotgun/pistol art uses it. Gameplay projectile simulation remains unchanged.

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
- `characters/models` — volumetric Blender/GLB model artifacts and generated local-runtime derivatives; authoring/provenance stays in `asset-staging`, not here;
- `environment`, `characters`, `pickups` — existing domain assets.

## Critical invariants

1. Generated raster/WebP UI art is DOM/CSS presentation-only; do not route it into persistent WebGL texture planes/sprites. Generated player-held weapons and generated world pickups follow the same rule: DOM presentation with procedural Three.js fallback. **Bots no longer remain procedural by default:** desktop bots use volumetric Blender Pack46 mesh geometry, with procedural body retained only as fallback. Current FPS weapon pack is **baked-hands**: when its image is active, hide the entire local procedural first-person rig so blocky fallback hands are never double-rendered.
2. Critical information keeps SVG/text/DOM fallback; decorative art may degrade to absence only when meaning remains intact.
3. Runtime generated filenames are semantic ASCII kebab-case, not generator filenames.
4. Catalog-managed runtime art добавлять в `GAME_ASSETS` и `scripts/validate-structure.mjs`. Direct classic-script/3D artifacts вроде Pack46 могут иметь отдельный load owner в `index.html`/`bot-model3d.js`; для них обязателен явный load-graph/structure guard, а не фиктивная запись в catalog.
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
21. Classic local scripts use the current build query `?v=<application-build>` in both HTTP(S) and direct `file://` modes to prevent stale JS after updates. Asset URL policy remains consumer-specific: do not assume a cache-key rule from one asset class applies to all files. Generated menu backgrounds, logos, HUD/perk/medal/feedback art, Pack46 runtime geometry and weapon/pickup presentation must remain available in both modes with fallback only on real load/decode/missing-pack failure.
22. Asset work is not complete until both hosted validation and the local-file browser smoke prove the relevant generated presentation path is active.
23. Pack 5 status/legendary-perk runtime derivatives are 256×256 alpha WebP <=32 KiB. Keep SVG fallback wiring; never make these presentation images a gameplay-state dependency.
24. Pack 6 perk runtime derivatives use the same 256×256 alpha WebP <=32 KiB envelope. Each new generated perk must resolve through `perkAsset(id,path)`, retain its exact per-id SVG fallback, and remain presentation-only.
