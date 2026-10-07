# Changelog — ZAP ZONE

### 2026-10-07 — CI build stamp made line-ending invariant

- Исправлен cross-platform build hash: текстовые runtime-файлы теперь хешируются с каноническими LF независимо от CRLF/LF рабочей копии. Это устраняет расхождение Windows-локальной проверки и GitHub Actions/Linux без ослабления `Web build stamp` gate.
- После синхронизации локальной версии в GitHub Actions первый run корректно обнаружил stale stamp (`Windows CRLF != Linux LF`); причина исправлена в `scripts/stamp-web-build.mjs`, а build metadata пересчитана.

### 2026-10-07 — Pack50 Blender first-person rifle experiment — rolled back

- **Production rollback:** after live visual review, the user requested the previous assault-rifle asset back. Pack50 was removed from the bootstrap and runtime hooks; active first-person rifle is again the previous procedural + Pack36 generated-art presentation. Pack50 artifacts remain archived for future experimentation.
- Added a rifle-only Blender first-person viewmodel with five independently movable components: body, magazine, bolt, left support arm and right firing arm. Canonical source/build is `asset-staging/2026-10-07-fp-rifle-pack-50/`; delivery is a portable GLB plus q16/Base64 direct-`file://` derivative.
- Integration is presentation-only. Existing gameplay owns ammo, cadence, damage/projectiles, reload timing, ADS policy and camera recoil; Pack50 consumes bounded state to animate bolt kick, magazine extraction/insertion and support-hand reach while existing `gunGrp` retains bob/sway/sprint/equip.
- Preserved recovery path: Pack50 is attempted only for first-person rifle. Missing/incomplete Pack50 falls back to the old procedural rifle and established Pack36 generated art. All other weapons retain their current first-person presentation.
- Live visual review rejected the first too-bright/too-large tube-optic pass instead of shipping it. The accepted pass uses a smaller lower-right frame, graphite/steel body, blue technical strips, orange warning details, compact holo and denser side mechanics. Staging keeps both the Pack36 reference capture and current Pack50 WebGL capture for future regression comparison.
- Deterministic Blender 5.2.2 LTS geometry is **10,836 triangles / 25 glTF draw calls**. Khronos glTF Validator 2.0.0-dev.3.10 reports **0 errors / 0 warnings / 0 infos / 0 hints**. Pack50 owner **5/5 PASS**; fresh HTTP and direct-`file://` dedicated browser smokes PASS with all five components, moving bolt/magazine/support hand, no stale Pack50 scripts and zero diagnostics.
- Added `scripts/first-person-rifle-pack50-owner.test.mjs` and `scripts/browser-fp-rifle50-smoke.mjs`; updated Blender/runtime asset documentation.

### 2026-10-07 — Pack49 Blender world weapon models

- Added six original low/mid-poly Blender firearm components for pistol, shotgun, rifle, plasma, sniper and rocket launcher. Canonical source/build is `asset-staging/2026-10-07-world-weapons-pack-49/`; generated delivery is a textureless GLB plus q16/Base64 direct-`file://` derivative.
- Integration is presentation-only: Pack49 overrides `createWeaponModel()` only for `mode=bot/world`. Existing first-person factory/generated art/HUD anchors remain unchanged, and missing Pack49 falls through to the previous procedural weapon geometry.
- Weapon pickups for Pack49 remain real scene-depth 3D instead of being hidden by the older DOM/raster pickup image. Existing grounding/bob/respawn/grant mechanics are unchanged.
- Resource lifecycle is explicit: decoded canonical geometry is cached, but every live bot/world instance clones geometry and materials because engine cleanup disposes children on weapon switch/removal.
- Blender 5.2.2 LTS deterministic build: **16,324 triangles / 48,972 runtime vertices / 40 material groups**, GLB **848,928 bytes**, runtime derivative **786,524 bytes**, no textures. Added `scripts/world-weapon-pack49-owner.test.mjs` and `scripts/browser-world-weapons49-smoke.mjs`; final full Node suite **360/360 PASS**, structure validation PASS, build stamp current at **`735ed5a770ad242d`**, Khronos glTF Validator 2.0.0-dev.3.10 **0 errors / 0 warnings / 0 infos / 0 hints**, fresh HTTP and direct-`file://` Pack49 smokes PASS with all six 3D pickups, all six bot weapon variants, first-person exclusion and zero browser diagnostics. Runtime bounds caught and regression-locked a rocket join-transform bug before delivery.

### 2026-10-07 — Pack47 anti-shimmer facade pass

- Live screenshots isolated the remaining flicker to distant Pack47 building facades rather than the restored legacy floor. Root causes were combined: shallow/millimetre-scale facade layers competing at distance with a camera near plane of 0.05, coarse directional shadow-map self-shadowing on bevel/rib geometry, and glossy metallic highlights crawling across subpixel edges.
- Final anti-shimmer geometry pass is intentionally static — no LOD and no pop-in. `KIT_Wall_4m/8m/12m` are now one continuous shell plus thick structural posts only: no inset windows, roof lip, lower strip, status bars or layered face geometry. `KIT_Base_Module` is now one continuous beveled shell only: no roof/plinth/front overlay/corner strips/rails/service panels, and runtime no longer attaches tech/vent/grate/cable/pipe/elbow/ladder/corner children to bases. Gameplay collision owners and wall topology are unchanged.
- Pack47 runtime keeps world shadow casting but sets every presentation mesh to `receiveShadow=false`. Shell/edge PBR is intentionally rougher and less metallic (`0.62/0.24` and `0.52/0.34`) to suppress distant specular crawl without flattening silhouettes.
- Main perspective camera near plane changed from `0.05` to `0.12` with far still `220`. FP weapon geometry starts around z=-0.48, so the new near plane preserves the weapon while materially improving depth precision for distant facade layers. Verified desktop browser already reports MSAA `antialias=true`, so no renderer-wide LOD/pop-in workaround was added.
- Deterministic Blender 5.2.2 LTS rebuild now validates at **31,796 triangles / 62,706 GLB vertices / 86 draw calls**, 7 materials, no textures; Khronos glTF Validator 2.0.0-dev.3.10 = **0 errors / 0 warnings / 0 infos / 0 hints**. `KIT_Base_Module` is only **108 triangles / 324 runtime vertices / 1 material group**; `KIT_Wall_12m` is **540 triangles**. Focused Pack47 + wall tests **12/12 PASS**, full Node suite **355/355 PASS**, structure validation PASS, fresh HTTP and direct-`file://` Pack47 smokes PASS with **147/147 anti-shimmer pieces**, **0 shadow receivers**, no stale scripts and zero browser diagnostics. Build: **`f5953b7c9d6a4ab3`**.
- Legacy floor remains active and Pack48 remains archived/disabled; dedicated legacy-floor browser smoke also PASS.

### 2026-10-07 — Pack48 Blender modular floor

- **Production rollback:** after additional live walking screenshots, Pack48 was removed from the game bootstrap and all engine/Frontline install hooks. Persistent distant shimmer/moire remained, while the distance-LOD mitigation introduced visibly unrealistic floor pop-in. The original `arenaFloor` is again the sole rendered/gameplay floor (`PlaneGeometry(220,220)`, Y=-0.04, original material/shadow behavior). Pack48 source, `.blend`, GLB and generated derivative are retained only as an archived experiment.

- Added a dedicated Blender floor kit with seven canonical modules: metallic panel, technical trench, industrial grate, service hatch, guide lane, Frontline capture overlay and `FLOOR_Far_8m` distance LOD. The far component is intentionally only **2 triangles / 6 runtime vertices / 1 material group** with no bevels, seams, bolts, rails or grate bars. Canonical editable source/build lives in `asset-staging/2026-10-07-floor-3d-pack-48/`; runtime artifacts are `assets/environment/models/zap-floor-modular-48.glb` and the direct-`file://` q16/Base64 derivative.
- Runtime architecture deliberately keeps gameplay ground flat. Existing `arenaFloor` stays at Y=-0.04 and remains the source for `firstGroundHitDistance()`; Pack48 tiles are presentation-only and never enter `wallMeshes`, `wallAABBs` or `losMeshes`. Trenches/grates therefore add visual depth without hidden collision or invisible steps.
- Repeated 8 m modules use `THREE.InstancedMesh` batches rather than hundreds of independent meshes. Desktop uses a 21×21 visual grid and `MOBILE_LOW` a 17×17 grid. Capture platforms consume the existing `BOT_MAP_ZONES` array, so Frontline objective coordinates remain owned by tactics rather than duplicated in environment code.
- Blender material/export path stays textureless metal/rough PBR with real bevel geometry, no UV/TEXCOORD stream, portable GLB plus deterministic runtime derivative and SHA-256 manifest. The pack uses the existing directional + hemisphere + ambient lighting constraints and restrained emissive accents rather than a bright floor-wide glow.
- Anti-shimmer follow-up from repeated live walking screenshots: the first pass removed true coplanar z-fighting (broad capture base, authoritative floor raster/depth writes, exposed fallback gaps, shadow receiver acne). The remaining distant shimmer was root-caused as subpixel/high-frequency geometry. Pack48 now uses dynamic distance LOD: desktop **36 m enter / 44 m exit**, low-power **28/36 m**, with per-tile hysteresis and updates only after 2 m of camera movement. Beyond the detail band each tile switches to the two-triangle `FLOOR_Far_8m`; capture overlays are culled past 52/40 m. Gameplay ground/collision stays exactly Y=-0.04.
- Verification after the LOD pass: focused Pack48 **6/6 PASS**; full Node suite **354/354 PASS**; structure validation PASS; Khronos glTF Validator 2.0.0-dev.3.10 **0 errors / 0 warnings / 0 infos / 0 hints**, **8,786 triangles / 17,924 vertices / 33 draw calls**, 7 materials, 0 textures. Fresh HTTP and direct-`file://` browser smokes both PASS with zero diagnostics, build **`85e5fe1660bb886b`**. Browser probes prove centre/edge near+far counts always cover all 441 tiles; one HTTP centre sample is 97 detailed / 344 far, edge sample 22 / 419. Documentation updated in `AGENTS.md`, `docs/ASSETS.md`, `docs/BLENDER_ASSET_PIPELINE.md` and Pack48 README.

### 2026-10-07 — Pack46 role variants + mechanical animation

- Blender Pack46 expanded from 10 to **15 canonical components** with five interchangeable presentation modules: `ZAP_Role_Assault`, `ZAP_Role_Sniper`, `ZAP_Role_Engineer`, `ZAP_Role_Anchor`, `ZAP_Role_Flanker`. Assault gets heavier chest/shoulders, Sniper a slim plate + optics sensor, Engineer a backpack/tools, Anchor wider layered protection, Flanker a lighter rail package.
- Existing tactical ownership is preserved: AI roles remain `assault / flankL / flankR / anchor / engineer`; both flank directions share the Flanker visual, while a bot currently carrying the `sniper` weapon receives the Sniper visual override. No sixth AI role, balance change or collision owner was introduced.
- `src/entities/bot-presentation.js::updateBotMechanicalPresentation()` adds bounded head tracking, smaller torso twist relative to legs, asymmetric shoulder recoil, aim raise/lower, reload lower/roll, cover/suppression crouch and airborne→ground landing compression. It runs after base gait/weapon pose and before `updateBotWeaponHands()`, preserving the existing two-hand grip solver.
- Collision/hit ownership stays unchanged: Blender role geometry is parented under the presentation torso and never enters `pts[]`, LOS/projectile collision, `wallMeshes`, `wallAABBs` or minimap/gameplay geometry.
- Geometry was optimized after the structure gate caught the first over-budget build: role bevels were removed while preserving silhouettes. Final deterministic Blender 5.2.2 LTS rebuild is **15 components / 40,712 triangles / 122,136 runtime vertices / 81 material groups**; GLB **2,111,808 bytes**, q16/Base64 runtime derivative **1,958,998 bytes**. Runtime keeps the 2 MiB cap; canonical source GLB now has a documented 2.25 MiB cap for the five extra modular silhouettes.
- Regression: focused Pack46 model + presentation **16/16 PASS**; full Node suite **348/348 PASS**; structure validation PASS. New `scripts/browser-bot-pack46-smoke.mjs` forces a no-cache HTTP reload and verifies build `3cd43934926b6927`, version 46, all 15 components, all five role mappings, exactly one visible role module, mechanical transform response, zero stale local scripts and zero browser diagnostics — **PASS**.
- Broader `browser-menu-smoke.mjs` was also attempted but its Settings hit-test did not become interactive within 5000 ms; that unrelated UI smoke is explicitly **NOT VERIFIED/PASS for this run** and was not used as evidence for Pack46. The dedicated fresh-reload Pack46 browser smoke is the runtime evidence for this change.
- Documentation updated: Pack46 README, `docs/ASSETS.md`, `docs/BLENDER_ASSET_PIPELINE.md` and this changelog now document role mapping, animation ownership/order, collision invariants, budgets and official Blender/Three.js references.

### 2026-10-07 — Pack47 real Blender cover pass

- Replaced the remaining cube-like cover presentation with five purpose-built Blender archetypes: `KIT_Armor_Cover`, `KIT_SciFi_Sandbag`, `KIT_AntiTank_Block`, `KIT_Cargo_Crate`, `KIT_Reactor_Housing`. Arena Aegis/barrier/cargo variants, supply crates, peripheral tall structures and the former 1.4×0.9×1.4 triple-box clusters now use those meshes instead of visually reading as plain boxes.
- Collision ownership stayed unchanged by design: every new Blender mesh is a `presentationOnly` child of the existing `src/core/engine.js::box()` owner. Blender meshes are not pushed to `wallMeshes`/`wallAABBs`, do not own LOS/projectile collision and do not replace minimap/gameplay geometry. Anti-tank random orientation is stored as `mapKit47PresentationYaw` and rotates only the Blender child; the authoritative box is deliberately left unrotated so decorative yaw cannot alter its AABB.
- Blender/export pipeline: Pack47 now has **23 components**. Deterministic Blender 5.2.2 LTS rebuild updates `.blend`, preview, GLB, q16/Base64 runtime derivative and manifest. Textureless GLB now uses `export_texcoords=False`; Khronos glTF Validator `2.0.0-dev.3.10` reports **0 errors / 0 warnings / 0 infos / 0 hints**, **45,948 triangles / 90,666 vertices / 99 draw calls**, 7 materials and no textures.
- Runtime proof: Pack47 HTTP and direct `file://` browser smokes both PASS with zero diagnostics: **219 presentation pieces**, **139 presentation collision owners**, authoritative `wallMeshes/wallAABBs = 163/163`, 4 armor covers, 4 sci-fi sandbag barricades, 24 anti-tank blocks, 62 cargo crates, 8 reactor housings, 4 door frames and still-passable central gates. No presentation mesh is present in the authoritative wall arrays.
- Regression coverage: focused Pack47 + wall geometry **10/10 PASS**; full Node suite **346/346 PASS**; structure validation PASS; build stamp **`7fabbad9036413a2`** current. `scripts/map-kit47-owner.test.mjs` now asserts the five cover decorators and explicitly guards the unrotated anti-tank collision owner.
- Evidence: fresh 1600×900 live Three.js capture `asset-staging/2026-10-07-map-sci-fi-kit-47/zap-map-sci-fi-kit-runtime-proof-47.png` was regenerated from HTTP build **`7fabbad9036413a2`**; its measured scene state is **23 components / 219 presentation pieces / 139 presentation collision owners / 163 wallMeshes / 163 wallAABBs**. Fresh isolated-profile direct `file://` Pack47 smoke PASS and the broader `browser-menu-smoke.mjs` local-file/generated-asset parity PASS, both with zero diagnostics.
- Documentation updated: `docs/BLENDER_ASSET_PIPELINE.md`, `docs/ASSETS.md`, Pack47 README and this changelog now document the cover/collision boundary, visual-yaw rule, textureless GLB export and current measured budgets.

### 2026-10-07 — v24.1 Pack47 real gates + modular map dressing

- Gameplay topology: the four central 30 m hazard walls are no longer solid across their centres. Each wall is split into two authoritative side `hazardWall` owners around a **3.8 m** opening, so `wallMeshes`, `wallAABBs`, LOS, projectile blocking and minimap geometry still come from engine-owned boxes while the gate centre is genuinely traversable.
- Presentation: added four live `KIT_Door_Frame` gates and four shallow presentation-only `KIT_Ramp` service thresholds. The eight base/annex modules now also use `KIT_Grate`, `KIT_Pipe_Elbow` and two `KIT_Corner_90` armor pieces each, on top of the existing tech panel / vent / cable tray / straight pipe / ladder dressing.
- Collision rule: no gameplay lintel box is created above a doorway. Current character `collideWalls()` resolves XZ only, so a lintel AABB would invisibly close the entire doorway despite being visually overhead. Door frame and ramp remain presentation-only and are never inserted into authoritative wall arrays.
- Regression coverage: `scripts/map-kit47-owner.test.mjs` now owns the split-doorway contract; `scripts/browser-map-kit47-smoke.mjs` proves all four doorway centres remain unchanged through `collideWalls()` while points on the side segments are still pushed out.
- Version/build: game version bumped to **v24.1**; current web build **`102036ca98380599`**.
- Verification: syntax PASS; focused Pack47 **5/5 PASS**; full Node suite **345/345 PASS**; structure PASS; build stamp current. Fresh HTTP and direct `file://` Pack47 browser smokes PASS with zero diagnostics: 18 components, 195 presentation pieces, 115 presentation collision owners, 163 gameplay wall meshes/AABBs, 4 door frames, 4 ramps, 16 corners, 8 grates, 8 pipe elbows, 8 doorway side owners, passable gate centres and solid gate sides. Full direct `file://` menu/generated-asset parity smoke also PASS: settings click/open/close, death UI, Pack42 smoke swap, generated backgrounds/images, pickup/perk layout and zero diagnostics. The first isolated Chrome verification profile stalled at preload 8% because its occluded window received no `requestAnimationFrame`; rerunning with background/occlusion throttling disabled passed without a product-code change.

### 2026-10-07 — Pack47 modular sci-fi map kit + recovery after accidental local deletion

- Added: Blender 5.2.2 LTS modular environment Pack47 with 18 reusable components: walls 4/8/12m, 90° corner, column, door frame, barrier, container, ramp, ladder, grate, tech panel, vent, straight/elbow pipe, cable tray, fortification and base module.
- Architecture: existing `src/core/engine.js::box()` remains authoritative for `wallMeshes`, `wallAABBs`, LOS/raycast, gameplay collision and minimap geometry. Pack47 attaches Blender meshes only as presentation children through `src/environment/map-kit3d.js`. Collision-owner raster surfaces are hidden with material write flags; owners themselves remain active/visible to raycast and are never replaced by Blender collision.
- Runtime/direct-file: Blender builder exports canonical GLB plus generated q16/Base64 runtime derivative `assets/environment/models/zap-map-sci-fi-kit-47.runtime.js`, loaded before `engine.js` so the normal `file://` launch needs no GLB fetch/XHR.
- Initial integration at this recovery checkpoint: hazard/perimeter walls, large base/annex blocks, columns, supply crates and cover variants used Pack47 presentation; base modules received tech panel, vent, cable tray, pipe and ladder details. Door/ramp assets were intentionally not placed over solid collision at this checkpoint; the later v24.1 section above records the split-collision gate implementation.
- Recovery: an accidental local copy/delete operation removed a set of active runtime assets. Recovery used current local `CHANGELOG.md`, active code/catalog references and `asset-staging/*/manifest.json` as truth; stale GitHub `main` was not treated as authoritative because local development had not been committed recently. Pack32/33/34/35/36/39/40/41/42 active assets were restored from exact staging candidates/builders or verified derivatives. Final audit: active catalog references report **0 missing**; **53 active manifest-backed files** report **0 missing / 0 SHA-256 mismatch**. The final Pack36 rifle ready/icon and Pack32 sniper ready match historical manifest byte sizes and SHA-256 exactly.
- Kept retired: old `projectile-trail-atlas-01.webp`, Pack13/16 bot muzzle-ring VFX and legacy `crosshair.svg` remain intentionally absent per earlier changelog decisions; they were not resurrected during recovery.
- Verification: active catalog references report 0 missing assets; structure validation PASS; full Node suite **344/344 PASS**; Pack47 focused tests **8/8 PASS**; build stamp `c4ed512bb6f9344e` current. HTTP browser boot PASS with zero diagnostics. Pack47 HTTP and direct `file://` browser runtime PASS: version47, 18 components, 151 presentation pieces, 111 presentation collision owners, 159 gameplay wall meshes/AABBs, owners still active, Blender meshes absent from authoritative wall arrays. Clean direct-file generated-asset/menu parity smoke at 1600×900 PASS with zero diagnostics. Live 1600×900 map evidence: `asset-staging/2026-10-07-map-sci-fi-kit-47/zap-map-sci-fi-kit-runtime-proof-47.png`; this proves live presentation, not native Pointer Lock/input.
- Documentation: updated `docs/BLENDER_ASSET_PIPELINE.md`, `docs/ASSETS.md`, `docs/README.md` and `asset-staging/2026-10-07-map-sci-fi-kit-47/README.md`; regression owner is `scripts/map-kit47-owner.test.mjs`, browser runtime owner is `scripts/browser-map-kit47-smoke.mjs`.


### 2026-10-07 — Bot visual/gameplay forward-axis fix

- Root cause: AI/shot semantics consistently used bot local `+Z` (`desiredYaw = atan2(dx,dz)`, `getBotMuzzlePos()`), while Blender Pack46 and procedural weapon/body art were authored toward runtime `-Z`. Поэтому бот мог корректно стрелять в цель, визуально показывая ей спину.
- Fix stays presentation-only: Pack46 body components and procedural fallback visuals get a `π` facing correction; `BOT_WEAPON_POSES` now hold models on the `+Z` side with yaw≈`π`; real hands inherit the corrected weapon pivot instead of receiving a second hand-local turn. Gameplay `group.rotation`, AI, accuracy, hit/raycast geometry, projectile direction, deployables and minimap semantics are unchanged.
- Recoil direction corrected after the weapon flip: visual recoil now moves weapon pivot backward along `-Z` rather than farther toward the target.
- Regression: `scripts/bot-presentation-owner.test.mjs` now owns a +Z forward contract over Pack46, procedural fallback, all 10 weapon poses, recoil and unchanged fire-control muzzle math; Pack46 owner additionally checks body components rotate exactly once while weapon-driven hands do not double-rotate.
- Runtime proof `zap-bot-runtime-facing-proof-46.jpg`: enemy at gameplay yaw `0` presents visor/weapon toward the camera; gameplay muzzle `z=+0.96`, actual rifle muzzle `z≈+1.178`, weapon-forward dot gameplay `+Z ≈ 0.989`, 17/17 Pack46 parts, zero diagnostics.
- Verification: focused Pack46/presentation **14/14 PASS**; full Node **340/340 PASS**; structure validation **PASS**; build stamp **d68ed104e9303f4a** current. HTTP boot and percent-encoded direct `file://` browser smoke both **PASS** with zero diagnostics using a temporary local mirror of exact Three.js r128 bytes because fresh isolated Chrome again timed out on the existing external cdnjs dependency.
- Documentation updated: `docs/specs/BOT_PRESENTATION.md`, `docs/BLENDER_ASSET_PIPELINE.md`, `docs/ASSETS.md`, Pack46 README.

### 2026-10-07 — Pack46 lighting-aware high-visibility pass

- Root cause: runtime lighting inspected before further Blender edits. ZAP ZONE currently uses directional + hemisphere + ambient lights without `scene.environment`/HDR map; Three.js `MeshStandardMaterial` hardware with high metalness was therefore losing too much diffuse response and reading too dark at gameplay distance.
- Materials/runtime: shell/edge metalness reduced to `0.36 / 0.48` and given restrained team tint (ally `#506476 / #8295A7`, enemy `#62565B / #8B7D82`). Team paint is now brighter `#2F97FF / #EF4052`; `MAT_ACCENT` uses metalness `0.10`, roughness `0.34`, emissive `0.22 / 0.17`. Emissive hierarchy stays physical: ally `0.22 < 1.30 < 1.65`, enemy `0.17 < 0.84 < 1.12`.
- Blender geometry: existing team-color surfaces were enlarged on chest, upper arm, forearm and thigh. No new material slot/group was added; high-visibility comes from distance-readable painted area plus PBR response rather than outline/gameplay-marker hacks or flat neon.
- Preserved: AI, `pts[]` hit/raycast geometry/order, collision, pivots, locomotion, weapon mesh/poses, two-hand IK and gameplay balance are unchanged.
- Export/validation: Blender 5.2.2 LTS deterministic rebuild updated `.blend`, GLB, q16/Base64 runtime derivative, preview and manifest. Khronos glTF Validator `2.0.0-dev.3.10`: **0 errors / 0 warnings / 0 infos / 0 hints**, **75,100 vertices / 40,224 triangles / 60 draw calls**. Runtime mirrored component budget is **178,008 vertices/bot**.
- Runtime proof: build stamp **b99ef18d17d23eb3**. The regenerated neutral-light `zap-bot-runtime-visibility-proof-46.jpg` verifies sampled ally/enemy `model46=true`, **17 parts each**, current team colors/shell tints and accent emissive values under the game's actual light objects on a neutral floor.
- Browser verification boundary: fresh isolated Chrome could not fetch the existing external cdnjs Three.js dependency (`ERR_CONNECTION_TIMED_OUT`). Using a temporary local mirror of the **exact Three.js r128 bytes** without modifying production `index.html`, HTTP boot smoke and percent-encoded direct `file://` menu/generated-asset smoke both **PASS** with zero diagnostics. CDN transport remains an external delivery risk, not a Pack46 regression.
- Verification: Python compile + Blender rebuild **PASS**; focused Pack46+rig **13/13 PASS**; full Node **339/339 PASS**; structure validation **PASS**; build stamp current.
- Documentation: synchronized `docs/ASSETS.md`, `docs/BLENDER_ASSET_PIPELINE.md` and Pack46 README. The pipeline now requires inspecting runtime lighting/environment before PBR tuning and records the Blender → glTF → Three.js material parity rule.

### 2026-10-07 — Pack46 mechanical-realism pass

- Blender geometry: поверх существующей surface hierarchy добавлены читаемые механические узлы — shoulder/hip/wrist/knee bearings и collars, low-poly actuator pistons, service latches, chin/heel vents, toe seam и antenna collar. Новые элементы не меняют gameplay `pts[]`, pivots, AI, collision/raycast, gait или two-hand IK.
- Materials/runtime: механический hardware переиспользует затемнённый metallic `MAT_EDGE` вместо нового material slot; team accents/emissive сохраняются. Это убирает часть «игрушечной» белизны и держит draw-call рост на **59 → 60**.
- Export: Blender 5.2.2 LTS rebuild обновил `.blend`, GLB, q16/Base64 runtime derivative, preview и manifest. Khronos glTF Validator `2.0.0-dev.3.10`: **0 errors / 0 warnings / 0 infos / 0 hints**, **75,232 vertices / 40,288 triangles / 60 draw calls**, 7 materials, без textures/UV.
- Runtime evidence: live HTTP proof подтвердил **9/9** initial bots с `model46=true`, 17 Pack46 parts и **178,392** cumulative non-indexed component vertices на каждого; close enemy-rifle proof `zap-bot-runtime-proof-46.jpg` регенерирован.
- Documentation: обновлены `docs/ASSETS.md`, `docs/BLENDER_ASSET_PIPELINE.md` и Pack46 README: mechanical construction rule `shell → bearing/collar → actuator → service hardware`, PBR/normal-map export notes, material/draw-call discipline, свежие hashes/budgets/evidence и official Blender/Three.js references.
- Verification: focused Pack46+rig **13/13 PASS**, full Node **339/339 PASS**, structure PASS, web build stamp **165994f03d18cbb7**, HTTP boot PASS без diagnostics. Отдельный isolated direct `file://` Pack46 runtime proof — **PASS** (`botModel46Available=true`, 10 components, 9/9 bots с 17 parts и 178,392 vertices). Полный `file://` menu parity в этой проходке **NOT VERIFIED**: visible Chrome CDP input timed out, второй headless run не смог hit-test settings control; это не выдано за full UI PASS.

### 2026-10-07 — Pack46 gap-control и runtime readability pass

- Blender geometry: закрыты самые заметные articulation gaps — добавлены jaw/neck sleeve, collar/rib bridge plates, hip sleeves, более плотные arm cores, elbow cap и knee sleeves/joints. Gameplay `pts[]`, pivots, AI, hit/raycast и IK ownership не менялись.
- Materials: shell/edge palette сделана светлее и менее зеркальной для читаемости в игровом освещении; enemy team accent переведён в глубокий crimson, red emissive ослаблен, чтобы детали не выглядели телесно-розовыми/белыми.
- Runtime evidence: regenerated neutral-light Three.js proof показывает ally + enemy Pack46 из production `runtime.js`; все 9 initial bots имеют `model46=true`, sampled ally/enemy — по 17 частей и 138,420 cumulative non-indexed component vertices.
- Export budget: Khronos glTF Validator — **0 errors / 0 warnings / 0 infos / 0 hints**, 58,894 GLB vertices, 31,796 triangles, 59 draw calls. Draw-call count не вырос относительно предыдущего pass.
- Documentation: расширен `docs/BLENDER_ASSET_PIPELINE.md` — gap-control rules, Blender/runtime material parity, emissive discipline, draw-call budget через `BufferGeometry.groups`, обновлён baseline и официальные Blender/Khronos/Three.js references. Pack46 README синхронизирован с текущими artifact hashes/evidence.
- Verification: focused Pack46+rig **12/12 PASS**, full Node **338/338 PASS**, structure PASS, HTTP boot PASS и direct `file://` parity PASS без diagnostics на build `4ede388f11cd31c4`. Один свежий HTTP-профиль отдельно поймал timeout внешнего cdnjs Three.js; повтор на доступном/cached dependency прошёл, поэтому это зафиксировано как внешний loading-risk, а не geometry regression.

### 2026-10-06 — Pack46: настоящие объёмные Blender-боты

- Added: Blender 5.2.2 LTS pipeline и canonical modular model `assets/characters/models/zap-bot-modular-46.glb`; editable `.blend`, deterministic builder, preview/provenance лежат в `asset-staging/2026-10-06-bot-3d-pack-46/`.
- Added: 10 volumetric hard-surface components — head, torso/neck/collar, pelvis, shoulder, upper arm, forearm, hand, thigh, shin/knee, foot. Это настоящая 3D geometry, не PNG/WebP sprite/plane.
- Refined from approved concept renders: rounded integrated helmet/visor, broad tapered layered chest, oversized pauldrons, tapered gauntlets/thighs/shins, knee cups, ankle cuffs and heavier armored boots; graphite/steel stays common while team identity lives in blue/cyan vs crimson/red armor/glow.
- Runtime: `src/entities/bot-model3d.js` переиспользует shared Blender geometry, назначает blue/cyan ally и crimson/red enemy materials и крепит 17 mirrored/individual parts к существующему animated rig.
- Compatibility: Blender builder также генерирует `zap-bot-modular-46.runtime.js` из тех же meshes для direct `file://` без GLB XHR/CORS; runtime derivative сохраняет Blender corner normals и использует q16/Base64 position+normal streams вместо verbose float arrays. Текущие byte/hash/geometry metrics принадлежат generated `manifest.json`, а не захардкоженной исторической цифре.
- Preserved: `pts[]` gameplay hit geometry/order, AI, collision/raycast, weapon meshes, all 10 weapon poses, two-hand IK, locomotion и recoil policy. Старые hit surfaces только скрыты; сами gameplay nodes остаются.
- Performance/fallback: desktop `PERF_MODE/MOBILE_LOW` больше не отключает Pack46. Даже при 4 hardware threads и direct `file://` Blender-модель остаётся активной; lightweight procedural fallback сохраняется только для low-power coarse-touch устройств либо missing/incomplete Pack46.
- Fixed during verification: устранён dangling-`else` в legacy-surface hide path, который мог оставить старые bot surfaces видимыми под Blender armor.
- Quality pass: Pack46 получил layered crown/temple helmet rails, lower sensor/rear vents, split-clavicle chest armor, mechanical vents/fasteners, compact backpack modules, codpiece/hip rails, pauldron top caps/rear fins, arm/thigh/shin side rails, segmented knuckles и многослойные sole/heel/toe boots. Emissive снижен и крепёж переведён в `MAT_EDGE`, чтобы убрать «гирлянду» ярких точек и сохранить hard-surface читаемость. Enemy palette остаётся crimson/red, ally — blue/cyan.
- Combat pose polish: rifle/shotgun/plasma/sniper опущены ниже, а elbow hints разведены наружу/вниз, чтобы оружие не закрывало грудную броню и руки меньше складывались крестом.
- Fixed shading: runtime derivative раньше писал одну face normal на весь triangle, из-за чего округлый Blender-шлем в Three.js выглядел фасеточным. Теперь экспортируются Blender corner normals, поэтому smooth surfaces сохраняют shading в игре; q16/Base64 уменьшает serialization overhead и позволяет сохранять более богатую геометрию в установленном validation budget.
- Pipeline hardening: builder генерирует `manifest.json`, fail-fast запрещает component-local coordinates вне q16 `[-1,1]`, а GLB без textures экспортируется с `export_texcoords=False`. Khronos glTF Validator для текущего GLB: 0 errors/warnings/infos/hints, 53,638 vertices, 29,144 triangles, 59 draw calls.
- Fixed direct `file://`: bootstrap version-ит локальные classic scripts через `?v=<build>` и больше не может молча оставлять stale `bot-model3d.js`/Pack46 runtime из browser cache.
- Documentation: добавлены canonical `docs/BLENDER_ASSET_PIPELINE.md` и `docs/README.md`; обновлены `AGENTS.md`, `AI_WORKFLOW.md`, `ARCHITECTURE.md`, `ASSETS.md`, `assets/README.md`, staging rules и Pack46 README. Зафиксированы Blender→GLB→runtime derivative workflow, normals/shading, ownership, file/HTTP parity, cache/fallback и verification ladder.
- Verification (current artifacts): focused Pack46+rig **12/12 PASS**, полный Node suite **338/338 PASS**, structure validation PASS, current build `59c90e8856cf9401`; generated manifest test сверяет bytes/SHA-256 и q16 geometry contract. Clean isolated Chrome/CDP: HTTP boot PASS и direct `file://` menu/generated-asset parity PASS, оба без diagnostics. Three.js runtime proof подтвердил 9/9 initial bots с `model46=true`, 17 parts и 128,628 cumulative non-indexed component vertices на бота; `zap-bot-runtime-proof-46.jpg` обновлён под текущую geometry. Первый прогон против старого CDP-сеанса завис на transport/input timeout, но чистая сессия прошла те же проверки.

### 2026-10-06 — Артикулированные боты: ноги, броня, двухручный хват и визуальная отдача

- Changed: procedural bot presentation получил отдельный decorative `legRig` с иерархией `hip → knee → ankle`; существующий `pts[]` hit-mesh и его порядок не менялись.
- Changed: руки обёрнуты layered armor shells, реальные кисти сохранены на two-bone solver; палитра переведена на графит/сталь с командными красно-синими пластинами и glow вместо сплошной яркой окраски.
- Added: визуальная отдача weapon pivot потребляет уже существующий `fireBurstRecoil`, поэтому оружие и обе IK-руки отрабатывают выстрел без изменения accuracy/cadence/recoil policy.
- Fixed: добавлен явный `grenade` pose; structural validation теперь требует собственный `BOT_WEAPON_POSES` + `gripR/gripL` для каждого из 10 ключей canonical `WEAPONS` catalog и не позволяет молча жить на rifle fallback.
- Performance: high-detail joint/plate overlays отключаются при `MOBILE_LOW`; gameplay geometry и AI/movement contracts не менялись.
- Regression coverage: `scripts/bot-presentation-owner.test.mjs` расширен проверками leg hierarchy, knee/ankle compensation и fail-closed incomplete rig.
- Verification: syntax PASS; focused bot-presentation 5/5 PASS; полный Node suite 331/331 PASS; structure validation PASS; HTTP browser boot PASS на build `7d9dcbcdc7c38e5f`; isolated HTTP и `file://` Three.js all-10 visual runtime PASS без diagnostics. `file://` real-CDP-click menu smoke — NOT VERIFIED: Chrome не ответил на `Input.dispatchMouseEvent` за 5000 ms; runtime/model contract проверен отдельным direct CDP visual harness.

### 2026-10-06T18:11:00+03:00 — Добавлено приседание игрока на X

- Added: удержание `X` включает приседание; камера плавно опускается с 1,75 м до 1,08 м.
- Movement: в приседе скорость составляет 58% обычной; спринт и прыжок блокируются, отпускание `X` плавно возвращает стойку. `Shift` остаётся клавишей бега.
- Lifecycle: spawn/respawn/new game используют единый `PLAYER_STAND_EYE_HEIGHT`, чтобы состояние стойки не протекало между жизнями.
- UX: подсказки управления в `README.md` и стартовом меню дополнены клавишей `X`.
- Regression coverage: добавлен `scripts/player-crouch-owner.test.mjs`; также старые VM-fixtures damage-тестов явно задают `gameSettings.invincible=false`, чтобы отражать текущий production contract без изменения игровой механики.
- Verification: crouch focused 4/4 PASS; полный Node suite 329/329 PASS; structure validation PASS; HTTP browser boot PASS; build `76f71151464f0054`.

### 2026-10-06T16:33:00+03:00 — Восстановлен общий world-VFX слой для мин, бомб, плазмы и летящих пуль

- Fixed regression: удаление `#projectile-trail-layer` вместе со старым экранным Pack 8 trail случайно отключило не только плохой center-screen overlay, но и актуальные world-projected consumers.
- Restored: общий DOM-контейнер `#projectile-trail-layer`; снова могут рендериться Pack39 mine world art, Pack41 bomb top art, Pack30 plasma flight, Pack35/28 rocket flight, Pack34 grenade flight и Pack36/37/40 rifle/shotgun/pistol projectile art.
- Kept retired: старый `projectile-trail-atlas-01.webp` и `showProjectileTrailFx(...)` не возвращены, потому что именно этот fake center-screen trail давал ранее отмеченный чужеродный светящийся эффект.
- Guard: structure validation теперь различает shared projection layer и retired legacy overlay, чтобы больше не удалять нужный слой вместе с плохим эффектом.
- Verification: пользователь визуально подтвердил возврат нужных ассетов; build `339c9d86b2065758`, structure validation PASS, полный Node suite 324/324 PASS, HTTP browser boot PASS. Live CDP подтвердил `#projectile-trail-layer` в DOM, активные owners для mine/bomb/plasma/ballistic/rocket/grenade и успешную загрузку Pack39 mine, Pack41 bomb, Pack30 plasma, Pack36/37/40 bullet, Pack35/28 rocket assets.

### 2026-10-06T15:36:00+03:00 — Удалены яркие bot muzzle-ring эффекты

- Root cause по двум новым скриншотам: голубой white-hot/cyan burst и оранжево-белый expanding muzzle burst были generated world VFX ботов из Pack 16 (`botPlasmaMuzzle`) и Pack 13 (`botMuzzle`).
- Removed: runtime atlases `bot-action-vfx-atlas-16.svg` и `bot-combat-vfx-atlas-13.svg`, catalog specs, `showGeneratedBotMuzzleVfx(...)`, world-direction helper, fire-control consumer и Pack 16 CSS.
- Preserved: authoritative bot shooting, audio, hit/projectile logic, recoil/cadence and обычный procedural `trigMuzzle(...)`; то есть убраны только чужеродные светящиеся картинки, а не сама стрельба.
- Guard: structural validation теперь запрещает возврат Pack 13/16 generated bot muzzle VFX.
- Verification: build `ec43cc7cebe1b565`, focused bot-fire tests 14/14 PASS, полный Node suite 324/324 PASS, structure validation PASS, HTTP browser boot PASS; live CDP подтвердил, что helper/specs/Pack13/Pack16 отсутствуют в загруженном runtime.

### 2026-10-06T15:20:00+03:00 — Удалены странные экранные projectile-trail эффекты

- Root cause по присланному скриншоту: жёлто-оранжевый «сгусток/луч» был старым Pack 8 `projectile-trail-atlas-01.webp`, который рисовался как краткий DOM-overlay около центра экрана и мог визуально совпадать с аптечками/геометрией мира.
- Removed: сам atlas, `projectileTrailPresentationFrame(...)`, `showProjectileTrailFx(...)`, shot consumer в `combat.js`, DOM `#projectile-trail-layer`, CSS/`pack8Trail` и validation wiring.
- Preserved: баллистика, урон, реальные projectile owners, текущие rocket/plasma world-space flight VFX и weapon-specific muzzle/tracer presentation.
- Guard: structure validation запрещает возврат удалённого Pack 8 projectile-trail overlay.
- Verification: build stamp `7a99f7c1366297a4`, structure validation PASS, полный Node suite 324/324 PASS, HTTP browser boot smoke PASS; live CDP подтвердил `showProjectileTrailFx`/`projectileTrailPresentationFrame` = `undefined`, DOM layer отсутствует, trail nodes = 0.

### 2026-10-06T14:31:00+03:00 — Убраны чужеродные кольца респауна и центральный треугольник угрозы

- Removed: holographic `botSpawn` materialization rings над/вокруг появляющихся ботов больше не выводятся; authoritative spawn position/timing/team logic не менялись.
- Removed: центральный `threat-direction` generated badge (красный треугольник/иконка угрозы) отключён. Обычный feedback фактического полученного урона `damage-direction` сохранён.
- Guard: structural validation теперь фиксирует оба retirement-контракта, чтобы эти декоративные эффекты случайно не вернулись.
- Verification: `node --check`, build stamp `08a3705db502e12e` и structure validation PASS. HTTP/file browser smoke — NOT VERIFIED: Chrome CDP `127.0.0.1:9222` недоступен.

### 2026-10-06T14:28:10+03:00 — Огонь и дым винтовки у дула без мерцания в оптике

- Fixed: убран перенос rifle muzzle FX в центр оптики; новые эффекты и procedural fallback подавляются в прицеле, активные DOM-огонь/дым сразу скрываются. Дым закреплён узким хвостом каждого кадра у дула.
- Fixed: после sway/recoil активные эффекты повторно привязываются к актуальному DOM-маркеру; устранено подтверждённое live-отставание на один кадр. Задержка дыма и возраст эффектов сохранены.
- Verification: 53 focused weapon tests PASS, независимые13/13 и VM lifecycle PASS; syntax/stamp/structure PASS.20 frozen-frame HTTP/file groups и реальная ЛКМ/ПКМ-очередь с Pointer Lock на1600×900 и1200×1000 PASS, pageerrors0. Build b16175c8312c7b12.
- Not verified: внешний хостинг/CI, длительный матч и live asset-failure переход; commit/publication не выполнялись.


### 2026-10-06T14:06:21+03:00 — Подробные попадания вблизи и вдали без золотых колец

- Fixed: concrete/metal/heavy Pack29 возвращены на всех дистанциях с физическим масштабом и wall/smoke occlusion; prewarm не задерживает старт. Pack45 оставлен для дерева и decode fallback, только первые три кадра без поздних круглых облаков.
- Removed: отдельное золотое кольцо/треугольники Pack12 penetrationExit и первая кольцевая heavy-ячейка Pack29. Настоящие entry/exit wallImpact, пробитие, урон и прежние RNG draws сохранены.
- Verified: полный Node suite320/320, независимые проверки58/58, syntax/stamp/structure, HTTP/file smoke и23 browser groups на build 56a5f0670aa7e505. Проверены10/≈60м,16:9/5:4 и реальное пробитие деревянного ящика; первое неверное ожидание пробития толстого metal cover документировано как fixture error.
- Not verified: внешний хостинг/CI, длительный матч, слабый GPU и ручная стрельба с Pointer Lock. Копии исходников сохранены; публикации не было.


### 2026-10-06T13:48:57+03:00 — Реалистичные попадания пуль на расстоянии

- Fixed: убран переход на старые светящиеся эффекты после48/26м и нижний предел экранного масштаба. Общий Pack45 показывает короткую нейтральную пыль/искры/щепки на всех дистанциях; normal alpha без золотой подсветки, physical width/FOV и wall/smoke occlusion.
- Added:768×512 alpha-WebP98,652bytes,24кадра с прозрачными полями; source/prompt/manifest/reproducible builder и6focused regressions в CI. Строгая load/dimension проверка сохраняет procedural particles/mark при отказе, без возврата старого atlas; throttle и один исторический RNG draw сохранены.
- Verification:317/317tests, independent55/55, syntax/structure/stampPASS;21browser scenarios HTTP/file,normal/PERF,1920×1080/1280×1024,10/≈60m кадры с оружием,real bullet contact,wall/smoke hide/reveal,expiry иerror fallbackPASS,0pageerrors. Frozen-frame harness corrections/limits записаны в batch VERIFICATION.md. Длительный матч и внешний hosting/remoteCI не проверены; commit/publication не выполнялись. Buildd8fccbbc17b07761.

### 2026-10-06T13:21:33+03:00 — Одна дымовуха в изображении подбираемого предмета

- Fixed: smoke pickup44 ошибочно показывал целый4×2 atlas из восьми ракурсов. Runtime WebP заменён отдельной pickup cell6 из padded Pack42; число предметов/spawn, гранаты в полёте, дым, FPS, запас/подбор и парение не менялись.
- Assets:1024×768 alpha-WebP92,522bytes; точное source window[887,443,1330,887],alpha bounds иSHA256 записаны в source manifest. Добавлен воспроизводимый cell-only builder в asset-staging; оригинальный atlas сохранён, прежний неправильный WebP скопирован в task work/smoke-single/backup.
- Verification:structure/build stamp и34 focused owner tests PASS. Real isolated browser normal/PERF/HTTP/file: ровно один видимый pickup image; DOM fallback скрыт, тень отсутствует,pageerrors0. Независимый pixel negative control в HTTP обнаруживает8 крупных силуэтов в прежнем bitmap и1 в новом. Pixel read вfile mode блокируется browser CORS: decode/real scene screenshot проверены, защита не отключалась. Initial runner top-level-await harness error исправлен explicit async wrapper; unaffected HTTP/PERF checks сохранены. THREE128 в matrix fixture подставлен из прежнего успешного CDN response. Build9f28dfde2de4977a; remote hosting не проверялся, commit/publication не выполнялись.

### 2026-10-06T12:57:03+03:00 — Случайные предметы без тени и плавное парение

- Changed: оружие выдаёт равномерно3–100 патронов своему резерву; grenade reserveCap9999 поддерживает полный диапазон. На карте38 weapon pickups вместо17 и40 аптечек normal/24 mobile-PERF. Fresh-game grid с random jitter/clearance по wallAABBs; оружие и аптечки возвращаются в другую точку≥6м от прежней.
- Fixed: удалены analytic/contact shadow и CSS drop shadows, fallback castShadow=false. Проекция предметов обновляется каждый renderFrame вместо20–40Hz, visual bob/yaw — каждый frame независимо от30Hz collection tick. LOS cache100мс инвалидируется при перемещении камеры/root, offscreen culling предшествует raycast.
- Added:9 подробных alpha-WebP1024×768≤240KiB; rifle/rocket/shotgun/pistol/plasma/bomb/smoke из сохранённых HD sources, sniper и medkit догенерированы по прежнему дизайну. Runtime bytes1,395,210; source/derivation/prompts/hashes в asset-staging/2026-10-06-pickups-44. Старые HUD/toast assets сохранены; fallbackHD→legacy→3D. Fixed-view DOM art не является orbitable mesh.
- Fixed: grantWeapon в src/player/state.js прибавляет к реальному сохранённому резерву, а не virtual reserve testing mode; после первого подбора/автоматического switch текущий ammo/uAmmo снова берётся из реальных массивов. Owned-slot switchW сохраняет реальный резерв вместо testing virtual reserve. Regression actual10→13→113 и first pickup0→3→103 покрывает all10 types, infinite on/off, switch-away/back, sync и browser save.
- Verification:311/311 Node tests, syntax, structure/build stamp PASS; independent grants/frame owner/no-shadow/fallback/alpha review PASS. Real browser HTTP/file,normal/PERF,1920×1080/1280×1024,actual arena placement/relocation,all10 grant endpoints3&100,infinite on/off,first pickup+auto-switch+captureSave,health collection,wall/smoke/reveal,reset/new game и оба decode fallback PASS без pageerrors. Camera sweep:before30/120frames,max6.215px;after120/120frames,max<.001px. CDN библиотека в matrix fixture подставлена из ранее успешного exactTHREE128 response; normal HTTP отдельного camera test использовал обычную загрузку. Screenshot fixture с пересекающей стену камерой отвергнут и заменён проверенным свободным коридором; code/behavior assertions unaffected. Длительный матч, слабый GPU, live hosting не проверены; commit/publication не выполнялись.

### 2026-10-06T12:20:46+03:00 — Подробные парящие предметы и отключение кровавой рамки

- Changed: подбираемые оружие/снаряжение/аптечки используют подробные изометрические рендеры того же дизайна, что и в руках игрока; парение .48м±.08м, перспектива по physical width/depth/FOV и напольная тень. DOM art скрывается за стенами/дымом; decode failure сохраняет3D fallback. Общий FPS/bot factory и pickup economy сохранены.
- Added: plasma pickup43 по FPS33,512×384 alpha-WebP37,202bytes; источник/промпт/хеши в asset-staging. Объединение fallback geometry учитывает nested transforms и effective visibility; новый owner test подключён в CI.
- Fixed: кровавый low-health-overlay отключён; HP/save/restart и остальные краткие сигналы попадания сохранены.
- Verification: syntax/structure PASS;306/306 Node tests PASS; independent THREE128 geometry/normal/hidden-node oracle и16 regressions PASS. Реальный isolated browser: HTTP/file,normal/PERF,1920×1080/1280×1024,all10+medkit,wall/smoke,reveal,collection/respawn/reset,HP1→freshHP100 без blood layer и без pageerrors PASS. Длительный матч, слабый GPU и live hosting не проверены; commit/publication не выполнялись.

### 2026-10-06T11:53:58+03:00 — Выстрелы останавливаются на земле

- Fixed: пули, дробь, плазма и снайперский след встречают реальный пол арены в ближайшей точке контакта; появляются surface/weapon эффекты и звук. Пол не пробивается и не рикошетит. Контакт со стенами и ракетная физика сохранены.
- Fixed: muzzle convergence учитывает землю; separation offset бронебойной пули после персонажа больше не переносит её через поверхность. Общий sniper trace ограничивает след ботов полом.
- Verification: 301/301 tests, syntax, structure и build stamp PASS; independent source/unit signoff PASS. Browser HTTP: шесть оружий в16:9/5:4, real decoded muzzle art, первый контакт, появление/очистка plasma DOM и wall-order control PASS; file menu/start smoke PASS,0 page errors. В тестовых заглушках sniper/rocket восстановлен DOM style после прежнего HUD-обновления; ground regression включён в CI. Длительный матч и remote CI не проверены; commit/publication не выполнялись.


### 2026-10-06T11:31:15+03:00 — Металлические рамки информирующего HUD

- Added: общий generated reference и десять компактных SVG-ассетов для уровня, команд, карты, характеристик, здоровья, боезапаса, очков, союзников и приказа. Карточки оружия используют тот же стиль; голубой/зелёный/красный/янтарный акценты различают назначение.
- Changed: nine-slice сохраняет углы, критические цифры остаются DOM-текстом. Исправлены ширина weapon-bar, переносы и компактная раскладка низких окон; короткая подпись максимального уровня помещается в рамку. Баланс, физика, AI и сохранения сохранены.
- Verification: syntax/structure/build stamp PASS;12 HTTP сценариев на1920×1080,1280×1024,1366×768,960×540,768×1024,640×480, normal/long states — glyph bounds, реальные карточки, viewport и свободный прицел PASS.10/10 SVG HTTP/file decode; file menu/start smoke и отсутствие новых рамок с видимым критическим текстом PASS. В file проверке точная библиотека Three.js из успешного HTTP ответа подставлена только в изолированном browser fixture после timeout CDN; обычная внешняя CDN-доступность остаётся нестабильной. Details/limits — source batch VERIFICATION.md. GitHub/publication не выполнялись.

### 2026-10-06T10:50:21+03:00 — Густой дым скрывает деревья и людей внутри облака

- Fixed: шум больше не создаёт прозрачные провалы в середине. Добавлен округлый плотный объём, минимальная шумовая плотность0,10→0,35, extinction2,4→4,2; CPU visibility синхронизирована.
- Root cause: opaque depth ранее менял шаги ray march, и силуэт дерева проявлялся изменением самого цвета дыма. Шаги теперь определяются полным ray-box interval до depth clipping; последняя часть луча ограничена препятствием, ранняя остановкаopacity0,9995. Число шагов/разрешение/облачный cap сохранены.
- Verification:287/287 tests PASS; normal/PERF real GLSL + actual arena tree и mkHuman model на4 глубинах внутри, clear/foreground controls. Максимальная разница изображения при появлении дерева внутри79/255 до исправления,2/255 после; модель бота≤1/255. Проверка пола/тонких преград/DOM/disposal и окончательный target/hash gate — в отчёте задачи. Слабый физический GPU, длительный матч, remote CI и финальный independent signoff не проверены; verifier остаётся usage-limited. Commit/publication не выполнялись.


### 2026-10-06T10:35:26+03:00 — Плотный дым у земли, клубы и оптимизация

- Fixed: плавающий разреженный эллипсоид заменён широким шумовым куполом от опорной поверхности; радиус15,5→19,5м. Плотное ядро скрывает мир внутри/за облаком, клубы двигаются и затеняют друг друга; плотность на гранях ограничивающего объёма нулевая, без прямой обрезки. Старые кольцо и плоские облака остаются отключены.
- Presentation: единый CPU owner скрывает pickup/projectile/ground-decal DOM внутри и за дымом; предметы перед облаком видны.
- Rendering: мир рисуется один раз; дым рассчитывается в четверти пикселей с ограничением разрешения и40/24 шагами, затем смешивается по глубине. Узкие препятствия используют точный луч, пол сохраняет плавное покрытие. Ресурсы освобождаются после последнего облака, состояние renderer восстанавливается и при исключении.
- Verification:287/287 source/VM/asset tests PASS; isolated browser HTTP/file и PERF_MODE: GLSL, плотность внутри/снаружи/у пола, тонкое переднее/заднее препятствие, DOM,16:9/5:4 и GPU disposal PASS. Контрольная сцена с3 облаками: прежний кадр42,7мс, новый около11–12,5мс; это измерение сцены, не гарантия FPS полного матча/слабого GPU. Финальный независимый signoff недоступен после лимита verifier; его два подтверждённых замечания исправлены и проверены браузером. Итоговый build/SHA256 доставки — в отчёте задачи. Commit/publication не выполнялись.


## Unreleased — 2026-10-01

### 2026-10-06T09:36:01+03:00 — Объёмный дым и удаление старого кольца

- Fixed: плоские cloud/near/far/wisp и inside-картинки заменены мировым3D-объёмом с постепенным ростом, движущейся плотностью, внутренними тенями и рассеиванием. Пол/крыша ограничивают нижнюю границу; глубина сцены отсекает дым за непрозрачными объектами. Старое deploy-кольцо/вспышка отключены независимо от decode, прежний RNG draw сохранён.
- Rendering: highp depth-reconstruction и28/48 шагов для PERF/обычного режима; безопасный native3D fallback при отсутствии highp/depth texture. Временный depth target подстраивается под drawing buffer и освобождается после последнего облака; cloud geometry/material удаляются при expiry/cap/fresh game. Радиус, lifetime, cooldown, AI и боезапас сохранены. Новые ассеты/зависимости не добавлены.
- Verification:284/284 source/VM/asset tests PASS; независимая проверка precision/capability fallback и validator PASS. Browser HTTP/file: GLSL без ошибок, точное RGB-отсечение стеной перед облаком, рост/клубы/вид изнутри в16:9 и5:4, cap4→3, GPU disposal2 и depth disposal1. Первые неуспешные harness-попытки и границы evidence сохранены в отчёте задачи. Производительность на слабых GPU и длительный матч не проверены; commit/GitHub publication не выполнялись.


### 2026-10-06T09:15:16+03:00 — Пояснение заблокированного выстрела ракетницы

- UI: попытка стрелять во время охлаждения/перезарядки ракетницы показывает по центру «Перезарядка и остывание ракетницы» на2,2с. Повторное нажатие обновляет единственный таймер; обычные сообщения сохраняют прежнее положение. Текст адаптируется к ширине окна и не перехватывает управление.
- Gameplay:10 секунд по-прежнему начинаются с выстрела; полёт и взрыв таймер не продлевают. Боезапас и другие виды оружия при заблокированной попытке не меняются.
- Verification:279/279 tests PASS в подготовленной копии; регрессии текста, очистки таймера/положения и shot→3s→impact→7s→ready. Native mouse/browser, SHA256 доставки и итоговый build зафиксированы в отчёте задачи. Commit/publication не выполнялись.

### 2026-10-06T09:06:06+03:00 — Удаление старой вспышки попадания ракеты

- Fixed: убраны вызовы прежнего лучевого impact-burst, кольца/лучей взрыва, fullscreen shockwave и старой SVG-картинки при детонации ракеты. Они не возвращаются при загрузке/ошибке Pack35; новый огонь/дым остаётся единственным владельцем оформления, при отсутствии атласа используются обычные частицы и дым. Shared ассеты других видов оружия сохранены.
- Verification:277/277 tests PASS в подготовленной копии, включая decoded/failed × player/bot, отсутствие старого impact и сохранение boolean/RNG-контракта общего explode. Повторный browser/target gate и итоговый build зафиксированы в отчёте задачи.

### 2026-10-06T09:00:45+03:00 — Прицел, полёт, столкновения и интервал ракетницы

- Fixed: ствол Pack35 и резервного ready-ассета ориентируется к центру прицела с сохранением выхода рук за viewport. Непрерывная проверка первого контакта со стенами/крышей, полом и персонажами устраняет пропуски коротких шагов и пролёт сквозь цель; запуск рядом с препятствием ограничен безопасной точкой. След попадания совпадает с поверхностью взрыва.
- Flight: объёмный корпус ракеты сохраняется после загрузки ассетов, плавный разгон одинаков при разном разбиении кадров, выхлоп и дым исходят из сопла. Плоское оформление ограничено выхлопом и скрывается при взгляде вдоль оси; fallback вспышки работает при недоступных ready-ассетах.
- Gameplay: игрок и боты выпускают ракету раз в10 активных секунд; смена оружия, reload и бонусы скорострельности не обходят интервал. HUD показывает оставшееся время; отсчёт продолжается в мире камеры смерти и останавливается на паузе. Базовый радиус урона увеличен с6,5 до9,1м, бонусы игрока сохранены; размеры взрыва и остаточного дыма увеличены на40%.
- Verification:275/275 source/VM/asset tests PASS в подготовленной копии, включая swept contacts, rotated wall, launch guard, cooldown/killcam и расширенный радиус. Browser HTTP/file и отсутствие ready-ассетов проверены отдельно; итоговая проверка целевой папки и границы evidence сохранены в отчёте задачи. Новые ассеты, commit и GitHub publication не выполнялись.

### 2026-10-04T21:34:49+03:00 — Дымовуха ZAP ZONE Pack42

- Assets: 12 alpha-WebP и5 PCM WAV: подробные ready/pin/windup/release/recovery/reload руки, корпус в полёте/на земле, pickup/icon, шесть фаз облака,4 near и6 far вариантов,8 завихрений, dense/edge дым изнутри. Полные FPS canvases и независимые near sources сохраняют цельность предплечий и прозрачные поля.
- Fixed: pending release.29s с однократным расходом ammo/CD, отмена невыпущенного броска при switch/pause/death/reload/blur/hidden/newgame, один слой рук после exact decode. Swept3D camera→spawn и движение исправляют проход сквозь близкую/тонкую стену и углы; учитывается высота стен/крыши/пол. Облака имеют bounded DOM lifetime/cap и procedural fallback. Камера обновляет inverse matrix один раз перед smoke projection, убирая задержку при движении/повороте. Reload сохраняет прежний pitch RNG draw; decoded throw убирает старые muzzle particles/light через RNG-preserving owner. Gameplay radius/lifetime/cooldown/RNG сохранены.
- Cleanup: семь smoke-only legacy runtime файлов удаляются после hash-verified recovery backup. Shared/other-weapon ассеты сохранены. Добавлена регрессия закрытия CSS media block с отрицательным контролем; FPS framing70%contain проверен в16:9 и5:4.
- Verification: независимые255/255 tests, syntax/stamp/structure PASS; HTTP иfile:// browser, native Pointer Lock/LMB throw, wall bounce, reload, cloud near/far/inside/cap/expiry и missing/wrong-size fallback. Exact target delivery hashes и итоговые границы проверки — asset-staging/2026-10-04-smoke-pack-42/VERIFICATION.md. GitHub publication не выполнялась.

### 2026-10-04T20:02:13+03:00 — Удаление старого индикатора/фитиля и более широкие эффекты бомбы

- Fixed: shared explosive-fuse overlay продолжал рисовать старый синий/красный badge над новой бомбой. Bomb исключён из ensure/sync; существующие stale nodes удаляются. Старый spark скрыт всегда, из countdown удалены particle spark/smoke producers с сохранением прежних RNG draws. Таймер, fuse и новый взрыв работают.
- Visual: огонь на40% шире при прежней высоте, wave28m вместо18m. По выбору пользователя radius/damage оставлены прежними34m player/32m bot;180s cooldown сохранён.
- Verification: actual owner tests для stale badge, всех стадий45/43/8/1 и сохранения mine fallback; реальный engine RNG oracle. Независимый239/239 suite и Preview27browser checks PASS, включая окно640px без cap150px; На G exact hash map,239/239 tests,27browser checks и unmocked file mode PASS. Build 6e39248d342cf16a; итоговая evidence в Pack41/VERIFICATION.md.


### 2026-10-04T19:38:12+03:00 — Цельный наземный корпус и очистка старого оформления бомбы

- Fixed: выступавшие серебристые рейки заменены низкой тёмной оболочкой и округлыми боковыми модулями; верхняя текстура лежит на корпусе, native экран/антенна скрыты после decode. Таймер00:SS уменьшен и лишён старой рамки/emoji.
- Cleanup: удалены legacy ready01, bomb.svg, старый heavy explosion26 и три неиспользуемых A/B/C candidate WebP; удалены их fallback consumers. Старые картинки/лучи не возвращаются даже при отсутствии новых ассетов; обновлённый native fallback сохраняет gameplay. Все удаляемые файлы заранее архивируются.
- Verification: независимые236/236 tests,30JS syntax, stamp/structure;23 browser checks в копии, включая отсутствие legacy art при broken requests. Build 3e7dd011bbfb167a. Итоговые target checks и visual snapshots — asset-staging/2026-10-04-bomb-pack-41/VERIFICATION.md.


### 2026-10-04T19:18:07+03:00 — Бомба ZAP ZONE Pack41

- Added: согласованные ready/plant/recovery/reload с цельными руками, подробный корпус на земле, pickup/icon; один17-кадровый взрыв, сохранённые6 кадров дыма и шлейф, новая6-кадровая ударная волна по земле. Sources/prompts/alpha/SHA256 и проверка — asset-staging/2026-10-04-bomb-pack-41.
- Fixed: ammo/CD/world object создавались до косметической установки; теперь выпуск.48s в анимации.96s, precommit отмена без расхода, guards G, swept placement у тонких стен, компактный timer, один FX owner без старых белых лучей. Игрок и каждый бот:180s после успешной установки.
- Cleanup: четыре лишних bomb-only файла удалены после резервного копирования; рабочие fallback и shared FX сохранены.
- Verification: независимые236/236 Node checks;23 браузерных checks в копии,10 игровых поз в16:9/5:4,17blast+6smoke+6wave frames. Final build64ec46671a1ff697. Доставка проверяется exact SHA map и запуском G. Пределы и первые сбои сохранены в VERIFICATION.md; remote hosting/CI/audio listening не проверены.


### 2026-10-04T16:27:06+03:00 — Общая нижняя панель патронов для пистолета

- Fixed: по уточнению пользователя возвращены стандартные нижнее правое положение и размеры ammo HUD, одинаковые с остальным оружием. Удалены отдельные Pack40 HUD helper/tag/top и компактный override; расчёт дула, эффекты и размещение рук сохранены.
- Verification: синтаксис/stamp/structure, текущие pistol regressions и игровые ready/reload кадры с измерением нижнего HUD; окончательные результаты и target SHA map в отчёте проверки задачи. Старый test переноса/очистки HUD удалён вместе с отменённым поведением.

### 2026-10-04T16:18:51+03:00 — Привязка дула и направление пистолета

- Fixed: ready front-plane marker [431,150], направление ствола к центру прицела; огонь/дым нормализованы по реальным source cells313/314, late FX sync сохранён.
- Fixed: размещение учитывает реальные выходы предплечий каждой reload-позы; кисти/магазин и задняя часть оружия видны. Ammo HUD Pack40 под характеристиками, компактный ≤760px; переключение на другое оружие очищает перенос HUD.
- Verification:221/221 tests (20 pistol), syntax/stamp/structure, HTTP/file boot/menu, native shot/tactical/empty/cancel PASS. 28 игровых ready/reload frames в1920×1080/1280×960/1495×749/760×570 приняты;12FXframes, dense roots≤0.072px/estimated bore≤0.015deg. Первый pose4/HUD/cleanup FAIL исправлен; тестовые FX failures и неверный cwd сохранены в VERIFICATION. Build ed7072a66124590e; exact G transfer проверяется SHA map и запуском target. Remote hosting/CI, субъективный звук NOT_VERIFIED.

### 2026-10-04T15:22:07+03:00 — Пистолет ZAP ZONE Pack40

- Added: подробные ready/reload позы с цельными руками, огонь/дым/пуля/гильза, pickup/иконка и четыре оригинальных WAV; source/prompts/manifest и проверки сохранены в asset-staging/2026-10-04-pistol-pack-40.
- Fixed: отсутствие muzzle feedback, стирание камерной отдачи, старт пули внутри близкой стены, пустой слой при decode failure; рабочая кисть с магазином и края предплечий проверены в 16:9/4:3. Убрано смешивание новых и старых pistol action/effects. Shared flight capacity больше не делает винтовочную пулю невидимой после пистолетных DOM nodes.
- Verification: полный suite219/219 PASS, independent affected18/18 и review PASS; all14 actual-game ready/reload frames ACCEPT, native shot/reload/cancel, near-wall Three.js, pause/death/fresh, seven asset/protocol modes и four FX frames PASS. Build12b08ff5f220c47a. Exact G: transfer проверяется SHA-map и запуском target. Звук на устройстве и remote hosting/CI NOT_VERIFIED.
### 2026-10-04T11:14:54+03:00 — Интеграция мины Pack39

- Added: 9 WebP и 5 WAV подключены к удержанию, броску, перезарядке, pickup/иконке, полёту, активации, взрыву, дыму, осколкам и следу на полу. Лежачая мина — низкий детализированный 3D-корпус с текстурированной горизонтальной крышкой, без поворота к камере.
- Changed: выпуск мины на кадре 3 через 0.29s, один расход боезапаса; отмена до выпуска не расходует мину. Любой наступивший на вооружённую лежащую мину погибает сразу, включая игрока, союзников и владельца; прямое наступание обходит броню/щит/второе дыхание, урон соседним целям сохраняет прежние правила. За самоподрыв и союзника награда не начисляется.
- Fixed: масштаб ready/throw/reload, владение видимостью при ошибке ready, fallback/decode и очистка presentation-ресурсов. Ошибочные промежуточные вставки в соседние projectile owners удалены и перепроверены.
- Verification: 201 source/VM tests PASS; independent review/verification PASS; actual-browser LMB/F/reload/cancel, все action-кадры в 16:9/4:3, camera top/side/orbit, wall/depth, contact matrix 11/11, FX/cooling/expiry, missing/wrong-size/file modes PASS. Build 410e3bb0d1418b79. Финальный перенос проверяется отдельным SHA-map и запуском G: target; субъективный звук на устройстве и hosting/remote CI NOT_VERIFIED.

### 2026-10-04T10:01:53+03:00 — Кандидаты ассетов мины ZAP ZONE Pack39

- Added: asset-staging/2026-10-04-mine-pack-39 — 36 прозрачных PNG/WebP-пар, 6 атласов, 5 синтезированных WAV; удержание/бросок/подготовка, мировые состояния/полёт, взрыв/дым/осколки/следы, pickup и иконка. 10 image_gen originals, точные prompts, source slicing/alpha/размеры/SHA256, overview и HTML preview сохранены.
- Verification: независимая проверка hashes/decode/alpha/atlas/WAV; preview JS syntax PASS. Пять runtime SHA256 сохранены; пакет не подключён. Браузерный preview получил local connection timeout, причина UNKNOWN; реальная игра и прослушивание звука NOT_VERIFIED.

### 2026-10-03T22:15:36+03:00 — Удалён электрический эффект попадания в ящик

- Removed: Pack27 terminal cable/arc overlay при попаданиях в reactive arena boxes; общий showGeneratedTerminalArcVfx возвращает false без создания DOM эффекта.
- Preserved: геометрия/коллизии ящика, surface feedback, отметки попадания, урон и физика пуль. Validator проверяет retired hook вместо обязательного запуска удалённой анимации.
- Verification: regression FAIL before→PASS after;179/179 tests, syntax/stamp/structure; native actual cabinet shot создавал terminalArc27 до правки и не создаёт после,8 дробин,ammo6→5,page errors0.

### 2026-10-03T21:44:23+03:00 — Удалён оставшийся круг с веером рикошета

- Fixed: общий player/bot hook showGeneratedRicochetVfx больше не создаёт Pack12 ricochet fan/ring. Ранее отключённый procedural impact был другим слоем; именно Pack12 воспроизведён по скриншоту.
- Preserved: физика рикошета, урон, звук, throttle и исторический presentation RNG draw; остальные строки общего atlas используются прежними consumer-ами.
- Verification: regression FAIL before→PASS after;178/178 tests; native shallow-wall shot вызывает8 ricochet callbacks,0 generated fans/radial rings; ammo6→5; page errors0.

### 2026-10-03T21:30:39+03:00 — Размер выбрасываемой гильзы дробовика

- Changed: размер generated casing увеличен с44 до96px (в2.18раза), чтобы соотноситься с патронами на FPS-оружии. Единственный выброс, привязка к окну и траектория сохранены.
- Verification: существующие owner tests и просмотр выброса в игровом viewport; cache build обновлён.

### 2026-10-03T21:21:29+03:00 — Детальный дробовик Pack38, дуло/гильза и удаление эффекта попадания

- Added: шесть отдельно сгенерированных FPS-поз1448×1086; ready, action1280×960/cell и новые flame/smoke/casing WebP. Active selected sources, exact prompts, reproducible build, alpha/dimensions/budgets/SHA256 сохранены в asset-staging/2026-10-03-shotgun-pack-38.
- Changed: металл/крепёж/перчатки/броня/ammo детализированы; уменьшена внешняя тень и убран opacity crossfade ready/pump только у дробовика. Руки проверяются по всем позам в actual game viewport.
- Fixed: дым/огонь закреплены измеренным emission tip на transformed muzzle текущей позы; generated casing выбрасывается ровно один раз из current ejection port после обновления оружия, отделяется, вращается и падает. Устранено отставание FX на кадр; delayed smoke остаётся hidden до своей задержки.
- Removed: radial burst и растущее кольцо при firearm попаданиях; rocket/plasma используют прежний owner.
- Verification: owner/behavior/hash tests, HTTP/file smoke и native current-frame marker/port measurement описаны в asset-staging/2026-10-03-shotgun-pack-38/VERIFICATION.md. Browser tests используют отдельный временный context. Gameplay/боезапас исправлений Pack37 сохранены; публикация и remote CI не выполнялись.

### 2026-10-03T20:35:52+03:00 — Дробовик ZAP ZONE: Pack37, цельные руки и исправление попаданий

- Added:5 alpha-WebP — ready, pump/shell action, flame/smoke/pellet/casing, pickup, icon;4 синтезированных WAV. Active source, prompts, slicing/fit/gutters, alpha/размеры/бюджеты/SHA256 сохранены в asset-staging.
- Changed: согласованные ready/pump/shell poses; руки продолжаются за нижний край игрового viewport. Эффекты привязаны к stage muzzle marker, полёт — к реальным pos/vel/FOV/occlusion; decode failure сохраняет matching ready/legacy/procedural fallback. Гильза выбрасывается единожды.
- Fixed: дробь не появляется внутри близкой стены; первая попавшая боковая дробина даёт одно подтверждение за залп, позднее убийство — одно обновление. Shared feedback сохраняется настоящим projectile producer. Отдача больше не исчезает перед первым кадром и восстанавливается независимо от FPS.
- Verification:172/172 regressions PASS; независимые22/22 focused/neighbor checks PASS; syntax/structure/stamp PASS. Native shot/pump, shell interrupt, reserve exhaustion, owned-ammo switch, pause/resume и реальная THREE wall geometry проверены. Все6 поз проверены в игровом DOM при1920×1080/1280×960; HTTP/file smoke и5 image-failure cases PASS. Сборка47f5c068a8331206. Публикация/remote CI и субъективное качество звука не проверялись.

### 2026-10-03T19:14:22+03:00 — Штурмовая винтовка ZAP ZONE: комплект ассетов и исправления

- Added: Pack36 — единый ready/reload-дизайн с цельными перчатками, запястьями и предплечьями, вспышка/дым/пуля/гильза, pickup и иконка; SVG прицел/рамка оптики. Raw sources, точные prompts, active revision, slicing, alpha/размеры/бюджеты/SHA256 сохранены в asset-staging.
- Fixed: лишние полосы соседних atlas-ячеек; каждый ready/reload кадр проверен в игровом DOM при1600×900,1200×1000 и1920×900. Для высокого окна адаптированы масштаб и положение рук/магазина.
- Fixed: видимая ось ствола смотрит к прицелу; вспышка каждым nozzle-пикселем выходит из дула и наследует отдачу. Пули следуют реальной позиции/скорости, ближайшая цель и боковая/близкая стена учитываются при muzzle launch; гильза не дублируется.
- Fixed: отдача не исчезает до отрисовки; cooldown очереди сохраняет частоту при30/60/144 FPS. Центральная отметка одинакова в hip/ADS. Существующие sounds, damage, gravity, ammo/reload timing и RNG owners сохранены.
- Fixed: reload не скрывает оружие при недекодированном atlas; missing new ready использует согласованный legacy ready/reload, отказ обоих ready сохраняет procedural shot/reload.
- Docs: обязательные правила цельности рук, выхода за край viewport, оси ствола, nozzle-origin, alpha и каждого игрового кадра записаны в docs/ASSETS.md; исправлены устаревшие scoped-утверждения ARCHITECTURE.
- Verification: syntax/structure/stamp PASS;9 rifle regressions PASS, независимые focused/neighbor checks и near-wall mutation oracle PASS. Native shot/queue, ADS, tactical/empty reload, pause/resume/switch/cancel, all6 action cells/all4 flame cells и3 image-error paths проверены в отдельном Chromium; при отказе обоих ready native shot проверяет положительную opacity procedural flash/beam. Независимый verifier выявил прежнее двойное подавление вспышек; оно исправлено, отдельная матрица active×effectsReady проходит. Ready и все6 action tiles имеют прозрачные top/left gutters. Финальный HTTP/file smoke PASS; build59ecb0d91ce5e75e. Публикация/HTTPS/remote CI не выполнялись; субъективное качество звучания не оценивалось.

### 2026-10-03T18:02:32+03:00 — Ракетница ZAP ZONE: полный комплект, следы и смертельное прямое попадание

- Added: Pack35 в стиле ZAP ZONE — оружие с цельными руками, согласованные reload, вспышка, ракета/выхлоп, взрыв/дым/обломки, pickup/иконка и прозрачные следы на полу и стенах; исходники, prompts, размеры, alpha и SHA256 сохранены в asset-staging.
- Fixed: соседние фрагменты атласа больше не появляются возле оружия; ready и все reload-кадры очищены и проверены в игровых viewport16:9 и6:5.
- Changed: летящая ракета следует реальному снаряду; декодированный metallic sprite заменяет procedural body, сохраняет его как fallback и скрывается стенами. Muzzle привязан к отдельной точке дула; gameplay timing/звук/боеприпасы сохранены.
- Added: след на стене привязан к реальному ближайшему mesh face и его повороту/границам; общий floor/wall projection хранит следы15 активных секунд и затухает13–15. Обычные краткие эффекты их не вытесняют.
- Changed: прямое попадание ракеты смертельно для враждебной цели независимо от её HP; обычный owner смерти/награды срабатывает один раз. Взрыв рядом, укрытия, self-damage и команды сохранены. Для игрока остаются специальные защиты respawn shield/second wind.
- Verification: structure и43 rocket/grenade/sniper regressions PASS; независимый oracle повёрнутых поверхностей/общего decal-budget и полная проверка шести WebP по manifest PASS. Local HTTP/file smoke, native Pointer Lock/shot/switch, reload кадры, image-failure fallback, реальные rocket physics wall contact, oblique/back occlusion и13/14.99/15s expiry проверены. Native mouse shot против настоящего Enemy с10000HP: HP0, ammo1→0, kills0→1; соседняя цель выжила со splash. Controlled enemy projectile проверил lethal player contact, spawn shield и second wind в браузере. Финальный HTTP/file smoke и stamp PASS, build cd068af47d5635cd. Публикация/HTTPS/remote CI не выполнялись.

### 2026-10-03T16:24:30+03:00 — Новое окно улучшений и 52 индивидуальные иконки

- Fixed: текст больше не попадает на декоративную рамку; название, описание и метаданные находятся в отдельных строках с внутренними отступами и высотой по содержимому.
- Changed: окно получило новое оформление, подсветку редкости, сетку 5/3/2/1, прокрутку низкого viewport, native button-карточки, focus при открытии и Tab/Shift+Tab внутри диалога.
- Added: 52 прозрачных WebP-иконки V2, общий resolver для выбора и активных улучшений, сохранённые SVG fallback; source/prompts/cell mapping/alpha/SHA-256 — в asset-staging/perk-icons-v2.
- Verification: syntax/structure/stamp PASS; HTTP boot и file menu smoke PASS. Геометрия всех 52 текстов проверена на шести viewport, загрузка всех иконок, reroll, Space/1–5/mouse routing, focus/Tab wrap и image-failure fallback PASS; независимая source/manifest проверка PASS. Выбор в interaction-проверке перехвачен до gameplay effect. Build af6508fb847fdfc0. Публикация/HTTPS/remote CI не выполнялись.

### 2026-10-03T15:57:35+03:00 — Полный комплект гранаты, удержание броска и воронка на земле

- Added: Pack34 — ready, восемь полноэкранных кадров броска с цельными предплечьями, иконка, pickup, полёт/лежание, увеличенные blast/smoke/debris и новая top-down воронка; sources/prompts/alpha/SHA-256 сохранены в asset-staging.
- Fixed: тело гранаты видно до детонации и следует реальному снаряду; стены скрывают его. Взрыв расположен в точке детонации и не включает fullscreen shockwave. Воронка проецируется на пол и хранится 15 секунд с fade13–15; обычные попадания не вытесняют её.
- Changed: удержание ЛКМ заряжает силу до1,1с, отпуск запускает анимацию и выпуск на кадре5; скорость11,6–18, подъём5,8–8,2; fuse1,82с начинается после выпуска. Switch/reload/pause/death/blur/restart отменяют подготовку без расхода ammo и с прекращением obsolete action.
- Changed: игровой blast radius8м, полный урон до2м и линейный спад; сплошная стена блокирует grenade damage. Урон в центре — 80% maxHp, броня поглощает максимум 10% входящего урона; firearm/perk damage и прежнее понижение self-damage не влияют на гранату. Swept3D контакт по canonical wallAABBs учитывает высоту стены, тонкие препятствия, крышу и потолок. Другие взрывные политики сохранены.
- Verification: 18 focused grenade regressions, 5 sniper и 4 wall checks PASS; syntax/structure/stamp и локальный HTTP/file browser smoke, native hold/release, fallback и 15s expiry проверены. Ранние проверки выявили reload-action и queue-eviction defects, исправлены и перепроверены. Финальные framing/evidence — asset-staging VERIFICATION.md. Публикация/HTTPS/remote CI не выполнялись.

### 2026-10-03T14:04:22+03:00 — Плазма в руках, вылет из дула и рамка паузы

- Added: Pack33 — прозрачное оружие с руками и согласованные tactical/empty reload из одного шестикадрового набора; source, prompt, alpha, размеры и SHA-256 сохранены в asset-staging.
- Fixed: плазма вылетает из отдельной точки дула, которая следует sway/recoil и не зависит от нулевого масштаба вспышки; при отказе primary/fallback изображений прекращены повторные запросы каждый кадр, остаётся procedural rig до нового выбора оружия.
- Changed: летящие плазменные сгустки игрока и ботов уменьшены на 22% в DOM и Three.js presentation; физика, урон, скорость и верхняя иконка оружия сохранены. Ready failure использует согласованный Pack31; action failure держит новый ready вместо смены модели.
- Fixed: SVG-рамка паузы растягивается по группе кнопок без внутренних пустых полей; desktop/mobile отступы, перенос длинной кнопки и прокрутка низкого окна удерживают действия внутри рамки.
- Verification: syntax, stamp/check, structure и 5 sniper regressions PASS; independent load-failure/reselection/stale-callback fixture PASS. HTTP/file boot, single/burst, обе reload, switch cancellation, запуск при flash scale=0, три image-failure сценария и frame/hit checks пяти viewport PASS. Первые проверки выявили повтор загрузки и устаревший pause-validator — причины устранены; synthetic Pointer Lock не доказывает нативный захват. Final build e8e712f2a3cc5bc2; публикация/HTTPS/remote CI не выполнялись.

### 2026-10-03T13:19:18+03:00 — Подписи внутри панелей уведомления подбора

- Fixed: заголовок и описание подбора центрируются в своих нарисованных панелях с учётом прозрачных полей рамки; иконка и шрифты масштабируются вместе с ней.
- Changed: browser-menu smoke проверяет границы и центры реальных букв внутри панелей; в docs/ASSETS.md закреплены правила привязки текста к декоративной рамке.
- Verification: исходная разметка воспроизвела смещение; исправленная прошла визуальную и геометрическую проверку короткой и длинной русской строки на 1920/1280/768/390 px через HTTP и на 1920 px при локальном file:// запуске; syntax, stamp и structure PASS. Публикация на внешнем сайте не выполнялась.

### 2026-10-03T12:59:36+03:00 — Согласованный графический комплект SR-9 и asset workflow

- Added: canonical правила slicing/качества/identity/fallback/RNG и проверок в docs/ASSETS.md; исправлены карта consumers и описание десяти SVG типов; Pack 32 — оружие с руками, тактическая/пустая перезарядка, затвор, компактные вспышка/дым/след пули и пустая латунная гильза; исходники, prompts и SHA-256 сохранены в asset-staging.
- Changed: ready и action используют один дизайн; анимации следуют reloadTot/cycleTot, гильза появляется при открытии затвора; новые эффекты заменяют старый player muzzle/trail после загрузки.
- Fixed: сохранены исторические RNG draws при подавлении magazine/muzzle/trail; ошибки загрузки возвращают legacy/procedural presentation. Hitscan, урон, penetration, баланс, звуки, оптика, world pickups и боты сохранены.
- Verification: syntax, stamp, structure и 5 focused regressions PASS; independent source/VM review PASS; HTTP boot и file menu/parity smoke PASS; shot/bolt/ADS return, две перезарядки и switch cancellation PASS в обоих режимах, image-failure fallback PASS на HTTP. Native Pointer Lock в asset-сценариях MOCKED; HTTPS hosting и remote CI NOT_VERIFIED.


### Pistol / assault-rifle muzzle presentation — oversized fire removed
- removed the large orange first-person muzzle-fire effect from the pistol and assault rifle by disabling their generated muzzle flash layer and procedural flash/beam;
- player-owned pistol/rifle shots no longer spawn the nearby fire/smoke/spark muzzle particles that produced the bright flame blob shown in the screenshots;
- recoil, sound, casings, projectile travel, collision, damage, impacts and hit feedback are unchanged;
- the silent muzzle path consumes the same historical presentation RNG draws, so this visual cleanup does not shift later gameplay randomness;
- shotgun, rocket, plasma and sniper muzzle presentation remains unchanged; structural regression guards keep this separation explicit.

### Perk cards + sprint presentation — frame-safe text and stable lower HUD
- rebuilt perk-choice cards as explicit internal rows for icon, rarity, name, description and metadata, with a larger bottom safe inset and smaller responsive typography so long Russian perk text no longer crosses the generated card border;
- reduced perk-icon footprint and normalized description/meta wrapping while preserving all perk names, values, ranks, keyboard hints and selection behavior;
- stopped the generated first-person weapon raster from inheriting the sprint lower/rotate pose; sprint speed, sprint-to-fire blocking, recovery timing, footsteps and gameplay balance are unchanged, but the odd movement near the bottom-center HUD is removed;
- added structural guards plus a direct-`file://` browser geometry regression for a representative long perk card.

### Pickup notification frame — text aligned to dedicated slots
- changed the pickup notification copy from one vertically centered text block into two fixed visual rows that match the generated frame: the title now occupies the upper blue panel and the weapon/ammo detail occupies the lower dark panel;
- removed the old detail top margin, added dedicated lower-slot insets, and kept long reserve strings on one clipped line so text cannot drift across the decorative border;
- added a direct-`file://` browser geometry smoke that checks normalized title/detail centers, separation, containment and overflow against the real CSS layout.

### Assault rifle presentation — stray shot overlays removed
- removed the assault rifle's legacy center-screen ballistic-strip overlay, matching the cleaned-up pistol presentation;
- hid the player's procedural rifle/pistol projectile mesh that produced oversized polygon/end-cap shapes and bright streaks near the camera; projectile travel, collision, penetration, ricochet and damage simulation are unchanged;
- preserved the historical tracer-phase RNG draw when those visuals are suppressed, so gameplay random ordering does not shift;
- added structural regression guards so the pistol/rifle cleanup cannot silently regress, while the Pack 30 check still verifies that plasma keeps its procedural Three.js tracer fallback.

### HUD / firing presentation — pickup frame, pistol trail, rocket overlay and pause border
- aligned the weapon-pickup notification with its native 1000×320 frame ratio, widened the safe text area and allowed long reserve text such as the sniper pickup message to wrap inside the panel instead of crowding the decorative edge;
- pistol shots keep the real muzzle flash, projectile/tracer and casing behavior, but the legacy center-screen ballistic-strip overlay is no longer rendered; its historical presentation RNG draw is still consumed so gameplay RNG ordering does not shift;
- player-owned rocket detonations keep world explosion VFX, damage, sound and the user-controlled screen-shake path, but no longer trigger the full-screen explosion-shockwave texture shown over the whole display;
- expanded the pause-panel safe area so the generated border surrounds all four buttons, including “НАЧАТЬ ИГРУ ЗАНОВО”;
- added structural regression guards for these presentation contracts.

### Sprint presentation — speed-line overlay removed
- removed the full-screen sprint speed-line overlay from the live frame loop and hard-disabled its CSS surface, so sprinting no longer paints the bright radial streaks across the scene;
- sprint speed, weapon-lowering pose, crosshair behavior, footsteps and gameplay balance are unchanged;
- added a structural regression guard so the sprint overlay consumer cannot silently return;
- realigned stale structure checks with the current first-person plasma fallback and simplified world-pickup presentation, fixing the pre-existing red validation state without weakening the intended contracts.

### Browser/CDP session — individual command waits are now bounded
- fixed a CI reliability gap where one CDP command could remain pending indefinitely while the WebSocket stayed open, leaving the outer 35/40-second shell timeout to kill the smoke without the failing command context;
- the shared session owner now gives every CDP request a 5-second response deadline, reports only the method and request id on timeout, and deliberately omits request params/evaluated page data from the error;
- response, synchronous send failure, explicit close and socket failure all remove pending state and clear the associated timer through one cleanup path, so HTTP and direct-`file://` smokes inherit identical behavior automatically;
- added deterministic fake-WebSocket/timer regressions for normal-response cleanup, hung-command timeout privacy and socket-failure exactly-once cleanup; diagnostic severity and all product-specific browser assertions are unchanged.

### Browser boot smoke — fatal runtime diagnostics now invalidate green readiness
- fixed a CI blind spot where the HTTP Chrome/CDP smoke could report success after collecting an uncaught `Runtime.exceptionThrown`, `console.error` or error-level `Log.entryAdded` event as long as `data-zap-boot` still reached `ready`;
- extracted one deterministic CDP diagnostic policy: runtime exceptions plus console/log errors are fatal, while warning-level events remain bounded, visible diagnostics instead of becoming blanket flaky failures;
- added Node 22 policy regressions, wired them into `Validate`, kept the existing wall-geometry/runtime smoke assertions intact and documented the browser-error oracle/read route for future AI passes;
- the stronger smoke exposed and fixed a real hosted presentation bug: dynamic `GAME_ASSETS` URLs used inside CSS custom properties were resolving under `src/styles/` and returning 404; the canonical asset URL owner now resolves against `document.baseURI` for HTTP(S) and direct `file://` use;
- added an explicit SVG favicon so headless/browser runs no longer generate an unrelated `/favicon.ico` 404; gameplay and balance are unchanged;
- extended the same fatal-diagnostic oracle to the real direct-`file://` menu smoke without weakening its generated-art parity, settings-click or no-local-WAV assertions; the script is now also syntax-checked explicitly in CI.

### Core wall-ray geometry — regression contract
- added a focused regression around the canonical `firstWallHitDistance(...)` / `wallBetween(...)` owner: clear path, nearest-hit ordering, short segments and the existing 0.15 m target-end tolerance are now explicit behavior;
- strengthened HTTP browser smoke with real Three.js BoxGeometry/Raycaster checks so the project verifies the engine primitive integration in addition to the deterministic Node harness;
- wired the geometry regression into Node 22 CI and documented the shortest AI reading route; gameplay geometry, collision tuning and balance are unchanged.

### Bot occlusion feedback — blocked traces stop at cover
- fixed a presentation bug where the 20% visual-only trace for an `OCCLUDED` bot attempt could extend through opaque cover even though gameplay correctly failed closed;
- added `firstWallHitDistance(...)` to the existing core raycast owner and made `wallBetween(...)` delegate to it, avoiding a second collision implementation;
- wall-blocked feedback now clamps to the nearest opaque surface, while smoke-only feedback intentionally keeps the legacy 18m visual cap and suppress-memory behavior;
- preserved the single visual-feedback RNG draw and all blocked-shot ammo/recoil/noise/damage/projectile/cadence invariants;
- added deterministic wall/smoke regressions, structural ownership guards, AI navigation docs and the reusable `OCCLUSION_CONSISTENT_PRESENTATION` pattern;
- corrected the structure-oracle declaration order after CI exposed a TDZ in the new engine guard; the guard remains strict and runtime code is unchanged by that CI-only correction.

### Bot shot outcomes — safety retry no longer gets overwritten
- added a closed `BOT_SHOT_OUTCOME` contract between fire-control and cadence: emitted, wall/smoke occluded, friendly-fire blocked and rocket-safety blocked;
- removed next-attempt `sT` ownership from fire-control: `src/entities/bots.js` now forwards the concrete outcome and `bot-fire-cadence.js` is the single scheduler;
- fixed a real safety-cadence bug where friendly-fire `.10..22s` and unsafe-rocket `.18s` backoffs were immediately overwritten by generic post-attempt cadence; these safety vetoes now preserve the unfired burst and keep bounded retry delays;
- intentionally kept wall/smoke occlusion on the legacy full attempt cadence/burst path so the fix does not silently increase wall spam or reacquisition pressure;
- emitted and occluded cadence keep their legacy RNG formulas/order; friendly-fire keeps exactly one bounded retry draw while generic cadence draws are skipped, and rocket-safety uses no cadence RNG;
- added deterministic outcome/RNG regressions, no-scheduler-leak structural guards, updated AI owner maps/specs and the reusable `OUTCOME_DRIVEN_CADENCE` pattern.

### Bot burst recoil — emitted-shot accumulation and settle recovery
- added a bounded per-bot `fireBurstRecoil` channel owned by fire-control and kept it separate from measured movement instability and suppression pressure;
- the current shot reads pre-shot recoil, then successful emitted firearm shots add weapon-class-aware kick for the next round: rifle/plasma accumulate substantially more sustained-burst instability than pistol, while shotgun/sniper/rocket remain tightly bounded;
- recoil settles exponentially from `dt`, resets when the bot changes weapon identity, and composes with movement without adding or reordering gameplay RNG draws;
- LOS/smoke fail-close, friendly-fire blocks and unsafe rocket attempts do not accumulate recoil or consume ammo; existing attempt-based cadence/RNG behavior remains deliberately unchanged;
- expanded deterministic fire-control regressions and structural safety-order guards, and added `docs/patterns/COMPOSED_FIRE_STABILITY.md` so future AI edits can preserve separate continuous/event-driven owners.

### Bot firing stability — movement-aware weapon handling
- bot fire-control now consumes the bot's measured post-collision `velX/velZ` instead of treating a hard strafe like a settled firing platform;
- added bounded frame-rate-independent stability attack/recovery: lateral movement penalizes weapon stability more than forward movement, while stopping restores accuracy progressively rather than instantly;
- precision weapons receive the strongest movement sensitivity, automatic/energy weapons a moderate penalty and rocket/shotgun execution a softer spread-only response where appropriate;
- movement composes with existing suppression and target-motion penalties without adding gameplay RNG draws or changing their order; damage, cadence, ammo, friendly-fire and rocket-safety contracts are unchanged;
- added deterministic movement/recovery/weapon-class/RNG-order regressions, structural owner/consumer guards and a reusable measured-runtime-state documentation pattern.


### Save lifecycle — new game on version update
- bumped the game version to **v24.0** and made autosaves carry the exact application version that created them;
- when the stored game version differs from the currently loaded version, gameplay progress is discarded before preload and the start screen offers a fresh game instead of continuing an older run;
- reset scope is limited to gameplay autosave keys, so user settings remain intact across game updates;
- moved save-storage clearing into the player/save owner and added structural regression guards for the version-gated new-game contract.


### Generated Weapon Action Pack 31 — plasma core reload + consistent weapon identity
- integrated the approved 12-frame plasma-core reload as a compact 720×405 alpha-WebP atlas with separate tactical and empty-reload sequences driven by the existing authoritative reload timer;
- replaced the ordinary player first-person plasma render with a 960×720 ready-state derived from the same approved source, eliminating the visual model swap between normal play and reload;
- retuned the plasma muzzle anchor for the new ready composition while preserving recoil, fire cadence, ammo transfer, damage, Pack 26 discharge, Pack 30 projectile flight and Pack 11 impact/reload fallbacks;
- full Pack 31 reload suppresses the generic magazine-drop and legacy completion-only energy-lock overlay only while it is actually available; procedural/legacy presentation remains fallback;
- documented and validated the new first-person weapon identity invariant: reload/action art that visibly redesigns a weapon must update that weapon's normal idle/ready player asset in the same integration pass.

### Generated VFX Pack 30 — tracked plasma flight ion sheath
- integrated the approved 4×4 plasma-flight source as a compact 256×256 alpha-WebP atlas with launch, sustained-flight and breakup/fade stages;
- player and bot plasma bullets now receive a world-projected ion-sheath layer that follows the real projectile position/velocity, scales with distance and hides when off-screen or occluded;
- added a bounded deterministic presentation phase with no new gameplay RNG; the old Pack 8 plasma trail remains the load/decode fallback and its historical RNG draw is preserved even when the overlay is suppressed;
- retained the existing Three.js plasma tracer/core plus all projectile motion/drop, collision, damage, penetration, AI and impact behavior as authoritative fallback;
- added exact VP8X alpha/dimension/byte-budget plus catalog/runtime/CSS/fallback structural validation.

### Generated VFX Pack 29 — high-fidelity surface impacts
- integrated the approved 4×4 impact sheet as a cleaned 320×320 alpha-WebP atlas with concrete, metal, cyan tech-panel and heavy ballistic rows;
- close/medium wall hits now prefer the new material-aware animation while wood/distant hits and load/playback failure retain Pack 10 as the graceful fallback;
- Zone Net terminal proximity selects the cyan row without changing ballistic material semantics, while SR-9, real wall penetration and the first player-shotgun pellet can request the heavy row;
- retained procedural sparks/smoke, pooled impact decals, Pack 12 ricochet/penetration effects and Pack 27 terminal arcs; damage, bullet physics, ricochet/penetration policy, AI and gameplay RNG remain unchanged;
- added exact VP8X alpha/dimension/byte-budget plus catalog/runtime/CSS/fallback structural validation.

### Generated VFX Pack 28 — tracked rocket flight exhaust
- integrated the newly approved 4×3 rocket-exhaust concept as a compact static 12-frame SVG runtime atlas instead of shipping the heavy source PNG;
- player and bot rockets now receive a world-projected exhaust plume aligned opposite their actual screen-space velocity, distance-scaled and hidden when off-screen or occluded;
- ignition and sustained-burn frame selection are elapsed-time driven and deterministic, with no gameplay RNG draw;
- retained the existing Three.js rocket body, additive procedural flame, smoke/spark trail and all projectile physics/collision/damage/explosion behavior as authoritative fallback; structural validation covers the atlas, wiring and fallback contract.

### Generated VFX Pack 27 — respawn materialization + reactive terminals
- integrated the two newly approved VFX concepts as compact static SVG atlases: a six-frame player respawn energy gate and a ten-frame terminal electrical breakdown sequence;
- player respawn now layers the new gate animation over the existing respawn materialize overlay while preserving the authoritative 15-second death/respawn flow and spawn protection;
- arena terminals now emit a throttled electrical arc presentation when bullet impacts occur close to their existing collision body; the terminal remains nondestructible and the effect changes no damage, penetration, ricochet, stun or AI state;
- kept both effects DOM-only, elapsed-time driven and scriptless, with existing procedural/Pack 7/16 presentation retained as fallback.

### Generated VFX Pack 26 — weapon discharge + heavy explosion diversity
- integrated the two newly approved source sheets as two compact alpha-WebP atlases: an eight-frame ballistic/energy discharge sheet and an eight-frame heavy ignition-to-smoke explosion sequence;
- pistol/rifle shots now receive a dedicated ballistic discharge layer and plasma receives a separate cyan energy-discharge presentation through the existing successful-shot hook;
- retained Pack 11 rocket and Pack 12 bomb detonation visuals as primary/fallback layers while adding a deterministic heavy-blast variation (every third rocket, every bomb) without consuming gameplay RNG;
- kept all Pack 26 art DOM-only, added exact VP8X/alpha/dimension/byte-budget and wiring regression checks, and preserved ammo, damage, blast radius, physics, recoil, cadence and timing.

### Generated Weapon Action VFX Pack 25 — pistol reload + shotgun pump
- integrated the two newly approved first-person action sheets as compact alpha-WebP atlases with 4:3 padded frame cells, preventing aspect distortion in the existing action stage;
- pistol tactical reload follows frames 0–7 then 11, while empty reload uses all twelve frames; both synchronize to the authoritative reload timer and suppress only the generic magazine-drop fallback while active;
- shotgun pump uses eight frames over the existing post-shot cycle timer; physical Three.js shell ejection remains authoritative while the older DOM shell-spin fallback is hidden only during the full action;
- reused the Pack 22/24 elapsed-time action player, added exact alpha/dimension/byte-budget validation and preserved ammo, cadence, recoil, damage, pellet simulation and gameplay RNG.

### Generated Weapon Utility Action VFX Pack 24 — rocket reload + mine throw
- integrated both newly approved first-person action sequences as compact alpha-WebP atlases: a twelve-frame rocket-launcher reload and a six-frame mine throw/deploy;
- reused the existing Pack 22 first-person action owner, keeping playback elapsed-time driven and avoiding a second animation pipeline;
- synchronized rocket art to the authoritative reload timer and suppresses only the generic magazine-drop fallback while the full action is available;
- starts the mine throw presentation only after the real mine is spawned, preserving ammo, cooldown, trajectory, arming, damage and gameplay RNG;
- added Pack 24 alpha/dimension/byte-budget validation, runtime catalog wiring and provenance documentation; narrowed legacy Pack 10/20 structural oracles so they verify the new rocket fallback and grenade-vs-mine boundaries instead of rejecting the Pack 24 helpers by name.

### Sniper VFX Asset Pack 23 — muzzle, smoke, bullet wake and casing fallback
- integrated five newly approved SR-9 source sheets as three compact alpha-WebP runtime atlases (~301 KiB total) instead of shipping ~6.4 MiB of source PNGs;
- added a dedicated high-energy muzzle flash plus delayed smoke plume to every player SR-9 shot;
- added two deterministic ballistic presentation variants — visible bullet/trail and supersonic pressure wake — aligned from the current first-person muzzle toward the reticle and alternated without gameplay RNG;
- kept the SR-9 hitscan, damage, penetration, recoil, cadence and instant Three.js trace authoritative; Pack 23 is presentation-only;
- added a twelve-frame rifle-casing atlas as fallback when the Pack 22 full bolt-cycle art is unavailable, deliberately avoiding a duplicate casing when Pack 22 already shows extraction;
- structural validation now checks Pack 23 WebP alpha envelopes, exact dimensions, byte budgets, catalog/runtime/CSS wiring and the existing dual-runtime smoke gates.

### Generated Weapon Action VFX Pack 22 — rifle reload + SR-9 bolt cycle
- integrated both newly approved first-person source sheets as two compact 720×480 alpha-WebP 4×3 runtime atlases instead of shipping the 1536×1024 source rasters;
- rifle tactical reload uses a shortened nine-frame path while empty reload uses the complete twelve-frame sequence, both synchronized to the authoritative existing reload timer and ammo transfer;
- SR-9 now plays the complete twelve-frame bolt lift/extract/eject/chamber/lock sequence over the real existing cycle timer; the world casing ejection remains authoritative and the old generic casing overlay is suppressed only while the full bolt animation is active;
- generated weapon-action art temporarily replaces the static first-person render and hides the sniper scope during bolt operation, preventing double weapons while keeping the procedural weapon animation and existing VFX as load/decode fallbacks;
- no reload/cycle timing, ammo, recoil, damage, fire cadence, projectile behavior or gameplay RNG was changed; structural validation covers WebP alpha/dimensions/budgets and all Pack 22 wiring.

### Grenade VFX Asset Pack 21 — selected sheet #2
- integrated the user-selected second grenade concept sheet as three compact scriptless runtime atlases instead of shipping the heavy source raster;
- added a tracked flight trail and close-range last-0.78-second live-fuse warning for both player and bot fragmentation grenades;
- layered a realistic fireball, additional debris, delayed post-explosion smoke and a short scorch/ground-impact stage onto the existing authoritative grenade detonation;
- retained Pack 15 shrapnel bloom and all existing grenade damage, fuse, bounce, ammo, ownership and reward behavior;
- extended the shared DOM VFX player with optional moving-world-object tracking and delayed presentation, with structural regression contracts for atlas safety, wiring and consumers.

### Grenade + Bomb Asset Pack 20
- added a real player fragmentation grenade as the tenth weapon/utility slot (`0`) without shifting the existing pistol-through-sniper indices or old save-array positions;
- added small-capacity grenade pickup economy, procedural fallback geometry, owner-aware bounce/fuse/blast behavior, self-damage and player kill/XP attribution;
- integrated generated-direction first-person, map-pickup and 2×2 HUD identity art plus an eight-frame throw VFX; existing Pack 15 shrapnel bloom remains the detonation effect;
- integrated the separately approved second asset: an eight-frame bomb placement/arming animation that fires only after successful authoritative bomb placement;
- structural validation now covers the new weapon identity, required assets, player/bot grenade ownership, VFX hooks and pickup distribution.

### Generated Asset Pack 19 — landing impact and first-person smoke throw
- integrated the two newly approved source previews as compact deterministic scriptless SVG atlases: a two-material landing impact sequence and an eight-frame first-person smoke-grenade throw;
- landing VFX fires only on the real airborne-to-ground transition, scales from impact speed, uses dust for concrete/gravel, energy/sparks for metal and intentionally skips water;
- player smoke throws now receive a short local hand/grenade release animation only after the authoritative 3D grenade has been spawned; grenade physics, ammo, cooldown and Pack 12 smoke deployment remain unchanged;
- both effects reuse the existing bounded elapsed-time DOM VFX player, add no gameplay RNG draws and retain current procedural/3D presentation as fallback;
- structural validation now covers atlas safety/count/byte budgets, catalog/runtime/consumer/CSS wiring and the complete runtime asset set through Pack 19.

### Generated Asset Pack 18 — shotgun reload, footsteps and medkit recovery
- integrated the three newly approved source previews as one deterministic scriptless 4×7 SVG runtime atlas;
- each actually inserted shotgun shell now receives a synchronized local insert VFX, while metal/concrete-gravel/water footsteps decorate the existing distance-driven player/bot stride events;
- medkit feedback now visually distinguishes real HP recovery from overheal-to-armor conversion without changing healing values or pickup economy;
- all effects remain DOM-only, bounded and elapsed-time driven; existing audio/procedural feedback remains fallback and the new presentation adds no gameplay RNG draws;
- asset documentation now records a same-dialog approval path that avoids duplicating heavy reviewed source rasters in Git while retaining a staging manifest.

### Generated Asset Pack 17 — bot reload/hit and pickup collection VFX
- integrated all three approved Pack 17 candidates as one deterministic scriptless 8×3 SVG runtime atlas;
- bot reload gets mag-lock presentation after the authoritative timer/sound, nonlethal bot hits get directional sparks after the existing reaction/RNG path, and successful pickups get a collection-collapse effect;
- gameplay timing, damage/AI, RNG order, pickup grants/respawn economy and existing fallbacks remain unchanged;
- structural validation, build stamping and browser smoke cover the new runtime wiring.

### Generated Asset Pack 16 — bot plasma muzzle, dodge and respawn VFX
- approved all three candidates from `asset-staging/2026-09-30-vfx-pack-16/` and integrated them as one deterministic scriptless 8×3 SVG runtime atlas;
- bot plasma shots now use a dedicated cyan ion-burst row through the existing authoritative muzzle hook, while Pack 13 remains the ballistic/rocket muzzle presentation;
- a successful bot dodge now emits one ground-level kinetic skid effect after the canonical dodge response starts, without changing dodge RNG order, duration, speed, cooldown or jump policy;
- replacement bots now materialize with a short world-projected spawn effect after creation; initial match population explicitly suppresses the effect to avoid a startup burst;
- structural validation covers static-frame safety/count/byte budget, catalog/runtime/consumer/CSS wiring, and the existing dual-runtime build stamp/browser smoke gates verify the integrated runtime.

### Generated Asset Pack 15 — frag grenade and player death-transition VFX
- approved both candidates from `asset-staging/2026-09-30-vfx-pack-15/` and integrated them as deterministic scriptless 8-frame SVG runtime atlases;
- bot frag-grenade detonation now adds a distinct shrapnel/dust bloom after the existing procedural explosion/impact event, without changing fuse, damage, radius or team logic;
- player death now adds a short edge-focused signal-collapse transition after the kill camera takes ownership; the center remains readable for death text and the effect advances from the dedicated dying loop;
- reduced-motion preference uses a brief static fade instead of fracture/glitch frame motion, while cleanup stays bound to death-camera cleanup and the exact 15-second respawn remains unchanged;
- structural validation covers atlas safety/frame count/byte budgets, catalog/runtime/consumer/CSS wiring, and the integration participates in the existing dual-runtime build stamp and browser smoke gates.


### Generated Asset Pack 14 — critical-hit and player armor-break VFX
- approved both candidates from `asset-staging/2026-09-30-vfx-pack-14/` and integrated them as one deterministic scriptless 8×2 SVG runtime atlas;
- player critical hits now add a short world-projected gold/cyan overcharge burst on top of the existing procedural critical impact, with bounded playback and mobile throttling;
- the centralized player armor-depletion event now adds a screen-local cyan shield-shatter while preserving the existing armor-hit overlay and armor-break HUD art;
- critical damage, armor absorption, HP, hitmarkers, audio and gameplay timing are unchanged; generated presentation remains DOM-only and current procedural/UI feedback remains fallback;
- structural validation covers atlas safety/frame count/byte budget, catalog/runtime/consumer/CSS wiring, and the integration participates in the existing dual-runtime build stamp and browser smoke gates.

### Generated Asset Pack 13 — bot muzzle and armor-rupture VFX
- approved both candidates from `asset-staging/2026-09-30-vfx-pack-13/` and integrated them as one deterministic scriptless 8×2 SVG runtime atlas;
- bot firearm/rocket shots now decorate the existing authoritative muzzle event with a world-projected, screen-oriented generated blast; plasma intentionally keeps its existing cyan presentation;
- bot death now emits a short armor-rupture burst before model disposal while preserving the existing gibs and procedural particles;
- generated muzzle playback is throttled per bot and shares the existing bounded elapsed-time DOM VFX player; off-screen cleanup/projection behavior remains centralized;
- fire cadence, accuracy, projectiles, damage, kill rewards, death physics and respawn are unchanged; structural validation and dual-runtime build stamping cover the new integration.

### Generated Asset Pack 12 — ricochet, penetration, smoke and explosive VFX
- approved all five candidates from `asset-staging/2026-09-30-vfx-pack-12/` and integrated them into real gameplay events;
- added one deterministic scriptless 8×5 static-frame SVG mega-atlas for ricochet sparks, penetration exit debris, smoke deployment bloom, mine shrapnel detonation and bomb pressure-core detonation;
- player and bot projectile paths both emit the new ricochet/penetration presentation, while smoke/mine/bomb VFX attach to the existing authoritative deploy/detonation events;
- projectile physics, damage, blast radius, fuse timers, smoke LOS/density and audio are unchanged; existing procedural effects remain fallback and generated art stays DOM-only;
- structural validation now checks atlas dimensions/frame count/byte budget, static SVG safety, catalog/player/consumer wiring and dual-runtime build stamping.

### Generated Asset Pack 11 — explosion, plasma impact and reload VFX
- approved the three candidates from `asset-staging/2026-09-30-vfx-pack-11/` and integrated them into real gameplay events instead of leaving staging art unused;
- added deterministic static-frame SVG sprite atlases for rocket detonation, plasma impact and plasma reload energy-lock, played through the existing bounded elapsed-time VFX player;
- rocket VFX is projected at detonation world position, plasma impact is throttled and shown on actor/wall hits, and the reload lock appears only after a successful player plasma reload completion;
- existing procedural explosion/impact/reload feedback remains fallback; runtime does not load `asset-staging/**`, generated effects remain DOM-only, and gameplay/balance are unchanged;
- structural validation now checks Pack 11 presence, viewBoxes, byte budgets, absence of self-running SVG animation, catalog/runtime/consumer/CSS wiring and dual-runtime build stamping.

### Generated Asset Pack 10 — animated combat VFX atlas
- добавлены 10 новых логических one-shot анимаций: backblast ракетницы, pressure blast SR-9, дымовой blast дробовика, латунная гильза, shotgun shell, падающий магазин, concrete/metal/wood impacts и directional near-miss streak;
- все десять последовательностей упакованы в один 8×10 alpha-WebP mega-atlas 448×560 (56×56 на кадр), чтобы браузер делал один запрос/декод вместо десяти отдельных runtime-файлов;
- эффекты подключены к реальным player-shot, reload, casing-cycle, wall-impact и suppression events; кадры выбираются по elapsed time, DOM-узлы ограничены бюджетом и удаляются после one-shot;
- существующие procedural Three.js/CSS эффекты остаются authoritative fallback, gameplay/balance не менялись, generated raster не возвращается в persistent WebGL texture planes;
- structural validation проверяет VP8X alpha, размер/вес atlas, catalog/runtime/CSS wiring; dual-runtime HTTP(S)/uCoz + прямой file:// сохранён.

### Generated Asset Pack 9 — vector tactical feedback
- aligned stale structural regression oracles with the current bot overhead-fill and respawn-countdown DOM contracts so validation checks the intended behavior rather than the old implementation shape;
- added ten new generated-direction SVG runtime assets for match deployment, Frontline retarget/capture, Second Wind, dodge feedback, perk paths, equipment readiness, ally tactical callouts, pause presentation and mobile controls;
- wired every asset into a real UI/gameplay consumer while keeping text/procedural state authoritative;
- introduced an SVG derivative workflow for geometric generated HUD art to improve DPI clarity, payload size and HTTP(S)/file:// reliability;
- extended structural validation and asset documentation for Pack 9.

### Generated Asset Pack 8 — tactical readability and motion
- added ten compact alpha WebP atlases for weapon reticles, tactical minimap markers, spawn shielding, the 15-second respawn countdown, explosive fuse states, projectile trails, weapon-switch swipes, bot overhead combat frames, combo feedback and world-pickup beacons;
- wired every asset into an existing runtime consumer instead of leaving art unused; procedural/text state remains authoritative and acts as a graceful fallback;
- kept generated raster out of persistent Three.js geometry and preserved direct `file://` compatibility;
- minimap art is information-safe: it renders the player, allies, objectives, visible pickups, player-owned deployables and player smoke, but does not reveal enemy-only state;
- structural validation now checks Pack 8 presence, catalog/runtime wiring, VP8X alpha, exact dimensions and a 64 KiB per-asset budget.

### Generated Asset Pack 7 — combat textures and screen-space feedback
- added ten optimized alpha WebP combat textures: low-health vignette, directional damage, tactical smoke, ballistic/plasma muzzle sheets, explosion shockwave, suppression, armor hit, sprint speed-lines and respawn materialization;
- new textures are actually consumed at runtime through the centralized asset catalog: screen overlays stay DOM/CSS presentation-only, the two 4×2 sheets decorate the existing first-person muzzle-flash layer, and the engine only emits a presentation hook for nearby explosions;
- existing procedural arrow/gradient/glow feedback remains as graceful fallback, including direct `file://` play; no generated raster is introduced into persistent WebGL scene geometry;
- structural validation now checks Pack 7 presence/catalog/wiring, VP8X alpha, 512px dimensions and a 128 KiB per-file budget.

### Generated Asset Pack 6 — high-impact perk art
- добавлены 10 оптимизированных 256×256 alpha WebP для `bulletstorm`, `immortal`, `doubletap`, `piercing`, `laststand`, `thorns`, `explosive_rounds`, `evasive_matrix`, `headshot_armor` и `bombtech`;
- карточки выбора уровня и панель уже взятых perks используют новые арты через существующий `perkAsset(id,path)`, а точные per-id `assets/perks/*.svg` остаются fallback при load/decode error;
- generated perk art остаётся DOM-only и protocol-neutral: один и тот же presentation path работает на HTTP(S)/uCoz и при прямом `file://` запуске, без возврата raster textures в persistent WebGL scene;
- structural validation проверяет Pack 6 catalog/wiring, RIFF/WEBP + VP8X alpha, точный размер 256×256 и лимит 32 KiB; характеристики, редкости и баланс perks не менялись.

### Generated Asset Pack 5 — status HUD + legendary perks
- добавлены 8 проверенных generated WebP 256×256 с alpha: шесть статусных HUD-иконок (`secondWind`, `lifesteal`, `armorRegen`, `lowHealth`, `smokeGuard`, `critReady`) и отдельные legendary-perk арты для `predator` / `warmachine`;
- статусный HUD теперь выбирает generated art через централизованный catalog и автоматически возвращается на существующие `assets/status/*.svg` при ошибке загрузки/декодирования; обе runtime-модели HTTP(S) и `file://` сохраняются;
- `Режим хищника` и `Машина разрушения` получают собственные generated изображения в карточках выбора и perk-panel, при этом уникальные SVG остаются fallback; игровые характеристики и баланс не менялись;
- structural validation проверяет наличие/каталогизацию Pack 5, RIFF/WEBP + VP8X alpha, точный размер 256×256, лимит 32 KiB, fallback wiring и запрет использования generated raster assets в persistent WebGL scene.

### Death/respawn UX and in-game testing controls
- death result frame and message are now bottom-anchored as one responsive unit; the death reason wraps/scales inside the frame instead of escaping it;
- player first-person weapon presentation is removed immediately for the death camera, and weapon swaps keep both stale generated art and procedural fallback hidden until the new generated asset is ready;
- player respawn delay is now exactly 15 seconds while the death camera motion remains independently timed;
- Settings now include testing toggles for freezing bot AI, infinite player ammunition (including deployables), and immediate access to every weapon type without permanently changing weapon ownership in autosave;
- structural regression guards cover the new settings wiring, respawn timing, bot freeze, infinite-ammo consumption gates, death-frame containment and first-person weapon transition seam.

### Projectile ricochet parity and shared shooting-physics policy
- successful player ricochet теперь реально отражает projectile по world-space normal, уменьшает speed/damage и продолжает swept flight вместо ложного sound/FX перед удалением;
- player и bot projectile paths используют canonical `src/combat/projectile-ricochet.js`; прежние material probabilities сохранены без hidden rebalance;
- wall penetration остаётся раньше ricochet, cap = 1, post-bounce offset предотвращает повторный hit, ineligible/capped impacts не расходуют RNG;
- добавлены Node 22 regressions, spec, AI routing, structural guards и Validate step.


### Bot engage-state movement ownership
- strafe timer/direction, role/tactical optimal-range policy, opponent-weapon matchup, Frontline objective pull, flank bias, close/far correction и anchor cover tether вынесены из `Enemy.update()` в canonical owner `src/ai/bot-engagement-movement.js`;
- extraction сохраняет snapshot `myX/myZ`, exact strict thresholds, movement-addition order и branch-specific RNG: normal strafe reset draw выполняется раньше optional sniper clamp draw;
- broad fire gate/shot execution, weapon selection, cover execution, squad/frontline fact production и collision-limited navigation остаются у прежних owners; gameplay balance не менялся;
- добавлены 7 focused Node 22 regressions, `BOT_ENGAGEMENT_MOVEMENT` spec, AI routing, reverse/authority/load-order guards и отдельный Validate step.

### Bot cover / peek execution ownership
- cover reevaluation, peek-side probing, LOS/smoke validation, peek timing/envelope, hold/chaining и cover exit вынесены из большого `Enemy.update()` в canonical owner `src/ai/bot-cover-execution.js`;
- `src/ai/bot-positioning.js` сохраняет единоличное владение cover/flank destination scoring, `src/ai/bot-navigation.js` — collision-limited locomotion, а constructor/timer lifecycle и final movement остаются в `src/entities/bots.js`;
- pure extraction сохраняет probe order `[sideBias,-sideBias]`, collision rejection `> 0.55`, LOS→smoke short-circuit, peek/chain/exit thresholds и точный branch-specific RNG order; duplicate peek-envelope math заменён одним canonical helper;
- добавлены focused Node 22 regressions, `docs/specs/BOT_COVER_EXECUTION.md`, AI routing, reverse/authority/load-order guards и отдельный Validate step без ослабления HTTP/`file://` browser gates.

### Bot AI state-selection policy ownership
- strict high-level state-selection ladder вынесен из большого `Enemy.update()` в canonical owner `src/ai/bot-state-policy.js`; `stateCD` decrement/gate, derived tactical facts и state execution остаются в `src/entities/bots.js`;
- pure extraction сохраняет точный precedence `resupply → retreat → support → cover → flank → objective → engage → hunt → search → fallback`, strict/inclusive threshold semantics, ally/enemy engage-range multipliers и финальный objective/patrol fallback без gameplay rebalance;
- каждое реальное policy execution по-прежнему потребляет ровно один RNG draw для `stateCD=.22+Math.random()*.30`, а gated updates при `stateCD>0` не вызывают owner; это закреплено controlled-RNG и exact-boundary regressions;
- добавлены `docs/specs/BOT_STATE_POLICY.md`, AI routing, owner/consumer/reverse/authority/load-order structural guards и отдельный Validate step без ослабления HTTP/`file://` browser gates.

### Bot post-shot fire-cadence ownership
- post-shot burst reset, pause, next-shot `sT` и empty-mag reload handoff вынесены из большого `Enemy.update()` в canonical owner `src/ai/bot-fire-cadence.js`; broad fire gate и concrete shot execution остаются у прежних owners;
- pure extraction сохраняет все weapon/player/suppressing formulas, cadence floors `0.095/0.055`, `fireRateMul` semantics и точный branch-specific RNG order, включая legacy `normalPause` draw, который вычисляется перед enemy-player override;
- добавлены controlled-RNG Node 22 regressions, reverse/authority/order/load structural guards, отдельный `BOT_FIRE_CADENCE` spec и AI routing; constructor cadence RNG намеренно не переносится, чтобы не менять global spawn RNG order;
- Validate получает отдельный fire-cadence regression step без ослабления существующих fire-control/deployables/browser gates.

### Bot progression-scaling ownership
- deterministic level/kills/role scaling вынесен из `Enemy.syncScale()` в canonical owner `src/ai/bot-progression-scaling.js`, а constructor/update сохраняют прежнюю seam;
- pure extraction сохраняет same-level early return, `force=true`, все формулы/caps/role multipliers, 24% HP-ratio floor + legacy growth heal и clamp-before-assault semantics для fire-rate без balance changes;
- добавлены 7 Node 22 regressions, `docs/specs/BOT_PROGRESSION_SCALING.md`, AI routing, owner/consumer/reverse/load-order guards и отдельный Validate step;
- `stamp-web-build --check` теперь при stale build печатает вычисленный expected build ID, ускоряя безопасное исправление manifest/cache keys без ослабления gate.

### Bot dodge-response execution ownership
- concrete dodge execution вынесено из `Enemy.triggerDodge()` в canonical owner `src/ai/bot-dodge-response.js`, при этом public seam и оба producer-а (survived damage / rocket threat) сохранены;
- pure extraction сохраняет active/cooldown early return, preferred-direction precedence, duration/speed urgency clamps, cooldown, optional jump и точный `Math.random()` consumption order без balance changes;
- dodge timer decay, movement consumption/collision и rocket sensing остаются у прежних owners; producer-ы не обходят `Enemy.triggerDodge()`;
- добавлены 4 controlled-RNG Node 22 regressions, `docs/specs/BOT_DODGE_RESPONSE.md`, AI routing, owner/consumer/reverse/producer guards и classic-script load-order validation.

### Bot suppression-response policy ownership
- near-miss suppression response вынесен из `Enemy.registerSuppression()` в canonical owner `src/ai/bot-suppression-response.js`, при этом `Enemy.registerSuppression(...)` сохранён как стабильная public seam для `combat.js`;
- pure extraction сохраняет source guard, player-token semantics, pressure clamp `0.3..1.4`, duration `0.62 + pressure*0.78`, strict thresholds `hp/maxHp < 0.72` / `pressure > 0.9` и все timer clamps без новых RNG calls или balance changes;
- suppression decay/source expiry и cover/FSM consumers остаются в `bots.js`; swept-bullet near-miss detection остаётся в `combat.js`, поэтому detection/response/lifecycle boundaries не смешаны;
- добавлены 5 focused Node 22 regressions, `docs/specs/BOT_SUPPRESSION_RESPONSE.md`, AI routing, owner/consumer/reverse/producer guards и classic-script load-order validation.

### Bot damage-reaction policy ownership
- retaliatory target selection, source semantics, target memory/lock и reaction/burst/FSM timer clamps вынесены из `Enemy.hurt()` в canonical owner `src/ai/bot-damage-reaction.js`;
- `Enemy.hurt(...)` остаётся стабильной public seam и по-прежнему владеет HP mutation, hit presentation, dodge RNG/concrete execution и death lifecycle; порядок side effects сохранён как `dodge → damage reaction → death`;
- pure extraction сохраняет включительный threshold `dmg >= 10% maxHp`, bot/player source precedence и не добавляет новых random calls или balance changes;
- добавлены 4 focused Node 22 regressions, `docs/specs/BOT_DAMAGE_REACTION.md`, AI routing, classic-script load-order и owner/consumer/reverse/event-order guards.

### GitHub Actions Node 24 runtime migration
- `actions/checkout` обновлён до стабильного `v7.0.1` и закреплён на полном SHA `3d3c42e5aac5ba805825da76410c181273ba90b1`; `actions/setup-node` обновлён до стабильного `v7.0.0` и закреплён на полном SHA `820762786026740c76f36085b0efc47a31fe5020`;
- оба выбранных upstream-релиза объявляют `runs.using: node24`, поэтому устранён warning GitHub о Node 20 actions, принудительно запускаемых на Node 24;
- project runtime намеренно остаётся `node-version: "22"`: runtime JavaScript Action и Node-версия тестируемого проекта разделены как разные concerns;
- exact PR-head `8f4f201617cdeb955dcd81f651d8701c003a4baf` прошёл полный Validate run `36558620151` без `##[warning]`; triggers, path filters, `contents: read`, concurrency, regression suites, HTTP boot и реальный `file://` smoke сохранены.

### Bot individual mine/bomb deployable ownership
- individual mine/bomb eligibility, role/doctrine probability и deployment side effects вынесены из `src/entities/bots.js` в canonical owner `src/ai/bot-deployables.js`;
- `bots.js` сохраняет FSM/fire gate, cooldown lifecycle и порядок `bomb → mine → firearm shot`; coordinated smoke/frag остаётся в `src/ai/tactics.js`, shared constructors/state — в combat/weapon owners;
- pure extraction сохраняет thresholds, multipliers, limits, placement physics, damage/fuse/cooldown formulas и RNG consumption order без gameplay balance change;
- добавлены focused Node 22 regressions, `docs/specs/BOT_DEPLOYABLES.md`, AI routing, load-order oracle и owner/consumer/reverse structural guards.

### Bot weapon-selection policy ownership
- post-spawn weapon reconsideration, current-weapon hold/hysteresis и switch timers вынесены из `src/entities/bots.js` в canonical owner `src/ai/bot-weapon-policy.js`;
- weapon data/role-range scoring и visual implementation остаются в `src/weapons/system.js`, fire execution — в `src/ai/bot-fire-control.js`, а `bots.js` сохраняет FSM/fire-gate authority и отдельную spawn initialization;
- pure extraction сохраняет thresholds, probabilities, random-call order, magazine semantics и visual refresh order без gameplay balance change;
- добавлены focused Node 22 regressions, `docs/specs/BOT_WEAPON_POLICY.md`, AI routing и owner/consumer/reverse structural guards.

### Bot fire-control execution ownership
- aim/muzzle helpers, reload lifecycle, concrete shot execution, hit/near-miss resolution и bot kill accounting вынесены из `src/entities/bots.js` в canonical owner `src/ai/bot-fire-control.js`;
- FSM/fire gate, burst cadence, utility planting и squad doctrine остаются вне fire-control; post-spawn weapon selection теперь принадлежит `src/ai/bot-weapon-policy.js`, а projectile/collision primitives не дублируются из `src/combat/combat.js`;
- coordinated smoke/frag теперь получает muzzle origin через canonical `getBotMuzzlePos(bot)`, поэтому один muzzle contract используется и firearms, и utility;
- добавлены focused `node:test` regressions, `docs/specs/BOT_FIRE_CONTROL.md`, AI-routing и owner/consumer/reverse structural guards без gameplay balance change.

### Bot tactical positioning ownership
- cover/flank candidate filtering и scoring вынесены из `src/entities/bots.js` в canonical owner `src/ai/bot-positioning.js`;
- pure extraction сохраняет distance/LOS/smoke/route/crowding/Frontline/doctrine weights и procedural flank fallback без balance change;
- `bots.js` остаётся owner-ом FSM, reevaluation/commit timers и peek/cover/flank execution; `bot-navigation.js` — movement mechanics, `tactics.js` — squad policy, `frontline.js` — objective state;
- добавлены direct `node:test` regressions, `docs/specs/BOT_POSITIONING.md`, source-oracle migration и owner/consumer/reverse structural guards.


### Bot navigation / locomotion ownership
- patrol points, wall/smoke steering, route penalty, speed caps и collision substeps вынесены из `src/entities/bots.js` в canonical owner `src/ai/bot-navigation.js`;
- pure extraction сохраняет `BOT_MOVE_CFG`, `substep=.16`, correction/final displacement caps, smoke thresholds/weights и `WPTS` без balance change;
- `nearestHostileGrenade()`, mine/noise/hearing и individual FSM остаются в `bots.js`, squad doctrine — в `src/ai/tactics.js`; structural guards закрепляют границу;
- добавлены direct `node:test` regressions, `docs/specs/BOT_NAVIGATION.md` и AI routing для быстрого поиска owner-а.

### Bot presentation / arm-rig ownership
- procedural bot body, stable gameplay hit-mesh construction, visual armor/readability, weapon pivot и two-hand arm-rig solver вынесены из `src/entities/bots.js` в отдельный canonical owner `src/entities/bot-presentation.js`;
- `bots.js` остаётся consumer-ом presentation seam; FSM/perception/combat execution остаются там, а locomotion mechanics позднее вынесены в `src/ai/bot-navigation.js` (см. текущую запись выше); geometry, grip positions, arm constants, hit-mesh order и gameplay balance в presentation extraction не менялись;
- добавлены direct `node:test` regressions для grip coordinate conversion/hand pinning и structural owner/consumer guards, запрещающие возврат presentation implementation в AI owner;
- AI routing, architecture/spec и classic-script graph обновлены так, чтобы задачи по модели/arm rig открывали узкий owner вместо повторного чтения всего bot runtime.


### Frontline objective ownership + regression contract
- Frontline objective/game-mode orchestration вынесена из большого `src/entities/bots.js` в отдельный canonical owner `src/game/frontline.js`: state, capture/rotation, control scores, save/restore, marker и HUD теперь имеют одну границу ответственности;
- gameplay semantics сохранены без balance change: rotation/capture constants, rewards, thresholds, announcements/audio/save ordering не менялись; bots остаётся consumer-ом active objective для tactical execution;
- classic-script graph закреплён как `combat → tactics → frontline → bots`; structural validation запрещает drift извлечённого owner обратно в `bots.js` и проверяет consumer contracts;
- добавлен прямой `node:test` regression suite для restore/reset/capture semantics и новый `docs/specs/FRONTLINE.md`, чтобы fresh AI открывала точный contract вместо поиска по 90k+ `bots.js`.

### AI ownership extraction — Map Tactics / Adaptive Commander
- командный tactical layer вынесен из 2200+ строкового `src/entities/bots.js` в новый canonical owner `src/ai/tactics.js`: map zones, squad plan, doctrine selection, Adaptive Commander profile, assault-wave planning и coordinated smoke/frag policy;
- индивидуальный bot FSM/perception, cover/flank execution, suppression effects и стрельба остаются в `src/entities/bots.js`; locomotion mechanics позднее вынесены в `src/ai/bot-navigation.js`, а Frontline state — в `src/game/frontline.js`; gameplay constants, probabilities, timers и balance в tactical extraction не менялись;
- classic load graph теперь явно `combat → tactics → bots`; structural validation проверяет новый owner, запрещает drift командной policy обратно в `bots.js` и сохраняет HTTP + `file://` runtime gates;
- `docs/AI_WORKFLOW.md` и `docs/ARCHITECTURE.md` обновлены так, чтобы следующая AI-сессия сразу открывала нужный owner вместо повторного чтения всего bot runtime.

### Session lifecycle ownership + AI navigation
- браузерный lifecycle матча вынесен из `player/state.js` и `game/runtime.js` в новый canonical owner `src/game/session.js`: Pointer Lock, start/resume/pause, Escape sequencing, blur/focus/visibility/pagehide и frame-clock reset теперь собраны в одном месте;
- `runtime.js` снова отвечает за frame simulation/render + boot, а `player/state.js` — за player/save/weapon/mobile state; gameplay balance и combat semantics не менялись;
- structural validation закрепляет owner boundary и порядок загрузки `progression → session → runtime`, а существующие HTTP boot + реальный `file://` Chrome/CDP smoke остаются runtime proof;
- добавлены `AGENTS.md`, `docs/AI_WORKFLOW.md` и управляемая очередь `task/`, чтобы ChatGPT/Codex начинали с карты owner-ов и читали только релевантные спецификации;
- README исправлен под фактический dual-runtime generated-art contract: HTTP(S) и `file://` используют один presentation pack с fallback только при реальной ошибке загрузки.
### Generated Asset Pack 4 — bomb, pickups, scopes and combat feedback
- загружены 8 новых WebP: player-held bomb, world bomb pickup, medkit pickup, ammo crate, sniper scope, rifle scope, Frontline capture burst и battle/death result frame;
- bomb теперь закрывает прежний generated-art gap и в first-person, и среди world weapon pickups, сохраняя procedural fallback;
- health pickups получили DOM-projected medkit art поверх реальной 3D-позиции; procedural medkit body остаётся fallback при load/decode error;
- rifle/sniper scope используют новые WebP overlays с явным SVG fallback, поэтому ошибка raster asset не ломает прицеливание;
- Frontline capture запускает краткий presentation-only burst, а killcam/death feedback получает result frame; gameplay state и scoring не меняются;
- ammo crate используется в ammo HUD; все новые raster assets остаются DOM/CSS-only и не возвращают постоянные Three.js texture-quads;
- runtime теперь явно синхронизирует DOM-projected world pickup art каждый кадр; validation закрепляет новые consumers и binary WebP envelope.


### Asset runtime parity — uCoz + local file
- исправлена причина пропажи generated background/логотипа и части UI assets при локальном запуске: `catalog.js` больше не включает generated presentation art только для HTTP(S);
- menu/loading backgrounds, generated logo, perk icons, combat medals, headshot art и другие DOM/CSS presentation assets теперь активируются и на uCoz/static HTTP(S), и при прямом `file://` запуске; HTTP cache-busting остаётся только для hosted mode;
- local-file browser smoke усилен: проверяет `generated-art-enabled`, реальную загрузку generated logo, menu/loading backgrounds и всех стартовых `data-generated-src` images;
- asset documentation закрепляет обязательный dual-runtime invariant: любой runtime asset/consumer должен работать в обоих режимах, а fallback применяется только при реальной ошибке загрузки/декодирования.


### Generated World Weapon Pickup Pack — arena pickup presentation
- добавлены 8 компактных 512×384 alpha WebP для оружия/снаряжения, лежащего на карте: pistol, shotgun, rifle, rocket, plasma, mine, smoke и sniper; bomb пока остаётся procedural;
- world pickup art рендерится через отдельный DOM layer, привязанный к настоящей 3D-позиции pickup; generated raster не передаётся в TextureLoader/plane/sprite и сохраняет uCoz anti-black-quad invariant;
- размер изображения меняется по дистанции, off-screen/far pickups скрываются, а wall Raycaster occlusion не даёт generated art просвечивать сквозь стены;
- после успешной загрузки скрывается только procedural weapon body; pedestal/ring/beacon, respawn, pickup radius, reserve grant и minimap semantics остаются прежними; при 404/decode error 3D-модель автоматически остаётся fallback;
- catalog, asset contract, README и structural validation обновлены под отдельный world-pickup DOM pipeline.
- исправлен binary upload world-pickup WebP: предыдущий bridge записал текстовые UTF-8 payloads вместо RIFF/WebP bytes; 8 файлов перезалиты через binary-safe base64 blobs с предварительной SHA-проверкой, а правила upload/validation усилены.

### Generated First-Person Weapon Pack — player-held firearms
- approved V3 framing зафиксирован в asset contract как проверенный success baseline: 960×720 alpha, transparent headroom/left-space, baked angle, HUD-safe composition и screenshot-driven tuning;
- добавлены baked-hands first-person assets для mine и smoke; они используют тот же DOM/fallback pipeline, bomb пока остаётся procedural;
- muzzle flash огнестрела переработан из короткого овального «обрубка» в отдельный layered hot-core/starburst/glow effect с per-weapon цветом и масштабом; procedural fallback flash переведён на additive tapered flare;
- visual recoil усилен отдельными per-weapon push/pitch/roll профилями и стал frame-rate independent; generated overlay получает безопасный recoil kick без выхода из HUD safe zones;
- V3 pack перегенерирован с дополнительным transparent headroom/left-space и более компактной FPS-композицией: оружие занимает меньшую долю viewport и сохраняет нормальный baked first-person угол;
- per-weapon runtime tuning уменьшен и сдвинут в lower-right safe sector; muzzle anchors пересчитаны под новую композицию;
- sway/recoil/rotation raster overlay ограничены clamp-ами, чтобы оружие не уезжало в центр, HP, Score/Kills и reticle;
- critical HUD слои (reticle, HP, Score/Kills, weapon HUD) получили явный stacking priority выше decorative weapon art; weapon stage ограничен max 980 px;
- V2 pack перегенерирован по утверждённому reference montage: first-person угол теперь задаёт оружие из нижнего правого сектора влево/вверх, с корректно встроенными руками/предплечьями вместо showroom/profile-композиции;
- 6 runtime WebP заменены на 960×720 alpha derivatives (pistol, shotgun, rifle, rocket, plasma, sniper), каждый ограничен 250 KiB;
- добавлены 6 оптимизированных прозрачных WebP для оружия, которое видит и держит локальный игрок: pistol, shotgun, rifle, rocket, plasma и sniper;
- generated FPS-art подключён как DOM presentation поверх canvas и работает как на HTTP/HTTPS, так и при прямом `file://` запуске; procedural first-person weapon остаётся fallback для 404/decode error и оружия без нового art;
- текущий V2 pack использует baked-hands: при успешной загрузке скрывается весь procedural first-person rig (корпус + blocky procedural hands), а при 404/decode error он полностью восстанавливается; gameplay/ballistics, bots и world pickups остаются на прежней Three.js логике;
- overlay получает позу из текущего gunGrp: equip/reload/sprint/recoil/cycle визуально двигают новый art; для выстрела добавлен отдельный DOM muzzle flash;
- generated weapon WebP не передаются в TextureLoader/gameTexture/makeAssetPlane/makeAssetSprite, сохраняя uCoz anti-black-quad invariant;
- catalog, structural validation, README и asset contract обновлены под новый player-held pipeline;
- browser/preload safety: generated player weapon остаётся `visibility:hidden` до фактического старта матча; сам WebP также lazy-loadится только после `running`, поэтому menu/preload и browser boot не декодируют player weapon заранее.
- исправлен локальный `file://` path: прежний `GAME_HOSTED_HTTP_MODE` guard полностью блокировал generated weapon loader, поэтому локальная копия всегда показывала старую procedural модель; protocol gate удалён только из player-held loader, а lazy-load/fallback сохранены.


### Generated Gameplay Feedback Pack 3 — six semantic UI assets
- добавлены 6 оптимизированных 256×256 WebP с прозрачностью: MULTI KILL, level-up energy core, death skull, armor-break crest, Frontline capture beacon и defender crest;
- `multikill-tech-02.webp` закрывает прежний SVG-only gap в combat medals; `multikill.svg` остаётся fallback;
- level-up, death и armor-break DOM images используют новые WebP только на HTTP/HTTPS через общий `data-generated-src` activation path и автоматически возвращаются к прежним SVG при ошибке;
- Frontline получает новый CSS-only decorative WebP, а смысл цели остаётся в bearing/state text; defensive perks `armor`, `armorregen`, `blastshield`, `ballistic_lining`, `surplus_armor`, `smoke_guard` используют defender crest с per-id SVG fallback;
- добавлены `docs/ASSETS.md` и `assets/README.md`: правила генерации, оптимизации, naming/ownership, fallback, WebGL-safety, GitHub atomic upload, CI evidence и порядок ручной публикации на uCoz;
- validation теперь проверяет WebP envelope, catalog/DOM/CSS wiring и по-прежнему запрещает generated raster/WebP внутри 3D engine scene.
- corrective CI follow-up: web build stamp пересчитан с учётом нового `assets/README.md`, потому что текущий stamp contract хеширует всё дерево `assets/**`.

### Generated Combat Medals Pack — kill/precision feedback
- добавлен согласованный набор из 8 оптимизированных прозрачных PNG: First Blood, Double Kill, Triple Kill, Killing Spree, Longshot, Critical Kill, Explosive Kill и Headshot;
- combat medal HUD на HTTP/HTTPS использует новые raster icons, а при ошибке загрузки автоматически возвращается к прежним `assets/medals/*.svg`; существующий `multikill.svg` остаётся SVG-only;
- headshot popup использует `headshot-tech-01.png` с отдельным fallback на `assets/fx/headshot.svg` / `headshot-kill.svg`;
- новые изображения остаются presentation-only DOM assets и не передаются в Three.js/WebGL texture planes/sprites, сохраняя uCoz anti-black-quad invariant;
- validation расширен на наличие/PNG signature/минимальный размер, asset catalog mapping, реальное medal/headshot UI wiring, SVG fallback и запрет raster medals в `src/core/engine.js`; build stamp/cache key пересчитан.

### Generated Gameplay UI Pack — team/perk/objective integration
- добавлен второй набор из 8 оптимизированных PNG-ассетов: эмблемы синей/красной команд, ammo, damage/speed/reload, Frontline beacon и weapon crate;
- scoreboard, ammo HUD, reload HUD, Frontline objective и стартовые подсказки используют новые изображения через `.generated-art-enabled` только на HTTP/HTTPS;
- perk-карточки `damage`, `reload`, `mobility` и `sprint_drive` получают новые PNG-иконки, но при ошибке загрузки автоматически откатываются на прежние SVG;
- новые изображения остаются DOM/CSS presentation-only и не используются как Three.js/WebGL texture planes, чтобы не возвращать uCoz-проблему с чёрными прямоугольниками;
- validation проверяет PNG-сигнатуры, catalog/CSS/perk wiring, fallback и запрет попадания raster presentation assets в 3D engine.


### Static deploy cache-busting — обновление без Ctrl+F5
- перенесён проверенный pattern из ZeTer Photo Editor: `version.json` + build identity + guarded bootstrap;
- HTTP/HTTPS startup запрашивает manifest через `cache: 'no-store'` и timestamp query, сравнивает remote build с build текущего HTML и при необходимости один раз открывает URL с `?zap_build=<id>`;
- локальные JS загружаются последовательно с `?v=<build-id>`, stylesheet и CSS assets получают тот же cache key, catalog/DOM images versioned на HTTP(S);
- прямой `file://` запуск не зависит от manifest/fetch и сохраняет отдельный local path;
- добавлен `scripts/stamp-web-build.mjs`: build ID вычисляется по runtime bytes (`src` + `assets` + normalized index/CSS), обновляет `index.html`, CSS и `version.json`;
- CI запускает stamp в `--check` режиме и не пропускает runtime change со stale cache metadata;
- для ручного uCoz deploy `version.json` документирован как последний публикуемый файл, чтобы manifest не объявил сборку до завершения загрузки assets/code.


### Generated Visual Pack — hosting-safe UI integration
- добавлен оптимизированный набор из 8 сгенерированных ассетов: отдельные фоны меню и загрузки, логотип ZAP ZONE, HUD-эмблемы HP/armor/XP, hazard-панель и terminal-screen;
- исходные крупные изображения подготовлены для браузера: фоны/панели сохранены как оптимизированные JPEG, прозрачные эмблемы — как уменьшенные PNG; общий вес набора около 1.84 MiB;
- все новые raster assets подключены только в HTML/CSS presentation layer: постоянная Three.js/WebGL-сцена по-прежнему не использует image texture-quads, поэтому сохраняется защита от прежних чёрных прямоугольников на uCoz;
- на HTTP/HTTPS (включая uCoz) generated-art включается отдельным CSS gate; при file:// новые raster-файлы вообще не декодируются до первого клика, поэтому локальный smoke остаётся быстрым;
- меню и loading screen имеют CSS gradient fallback, новый логотип загружается поверх прежнего SVG только на HTTP/HTTPS и автоматически откатывается на SVG при ошибке, а HUD сохраняет текстовые значения и полосы даже без картинок;
- validation проверяет наличие и сигнатуры PNG/JPEG, catalog + CSS/HTML wiring и отдельно запрещает попадание нового raster pack в 3D engine scene.

### Hosting Compatibility 3.0 — без texture-quads в 3D-сцене
- устранён оставшийся эпизодический источник чёрных квадратов на uCoz: временные explosion/headshot/impact эффекты больше не создают SVG Sprite billboards;
- explosion, headshot/headshot-kill и bullet/wall/plasma/sniper/rocket/critical impacts переведены на procedural Three.js burst geometry: additive ring + core + radial rays;
- procedural bursts по-прежнему billboard-ориентируются к камере для читаемости, но состоят только из WebGL geometry/materials и не имеют image texture;
- water.svg удалён из 3D water material: поверхность воды теперь процедурная по цвету/emissive/opacity и анимируется без TextureLoader;
- после этого src/core/engine.js не содержит makeAssetPlane, makeAssetSprite или gameTexture и не зависит от внешних SVG/image textures для 3D-сцены;
- обычные SVG в HTML/CSS UI остаются допустимыми, потому что они не создают WebGL texture-quads.

### Regression protection
- validation запрещает любые внешние texture plane/sprite вызовы внутри 3D engine scene;
- отдельно проверяются makeProceduralBurst / setProceduralFxOpacity и отсутствие waterTex / GAME_ASSETS.fx / GAME_ASSETS.impact usage в engine;
- версия повышена до v23.9.

### Bot HUD cleanup — только здоровье над ботами
- удалены текстовые overhead-бейджи над ботами: больше нет подписей «СВОЙ», «ВРАГ», роли и иконки оружия над головой;
- над каждым видимым ботом остаётся только компактная полоска здоровья;
- цвет полосы сохраняет быстрое распознавание команды: голубая для союзников, красная для противников;
- DOM-элемент старого бейджа удалён полностью вместе с update/position/cleanup логикой, а не просто скрыт CSS;
- версия повышена до v23.8; validation запрещает возврат overhead text badges и требует health-bar HUD.

### Visual Polish 2.0 — HUD, pickups, weapons и укрытия
- tactical minimap стала примерно на 12% компактнее: меньше рамка/легенда и нижний tactical stack, при этом canvas остаётся высоким по внутреннему разрешению для чёткой картинки;
- контраст реальной геометрии карты повышен, союзники и игрок получили более читаемые маркеры с тёмной обводкой, активная capture-zone мягко пульсирует, world-weapon dots стали круглыми и аккуратнее;
- pickup beacons стали ниже и тоньше: уменьшены stem/diamond/halo, pedestal/ring больше не доминируют над предметом; добавлены мягкий pulse, локальный bob и медленное вращение;
- общая амплитуда bob/rotation самих pickup-моделей уменьшена, чтобы предметы выглядели как физические объекты, а не как крупные аркадные маркеры.

### First-person weapon materials
- procedural weapon accents получили металлические fasteners, более тонкие emissive strips и отдельные micro-details без возврата SVG overlays;
- rifle/sniper получили боковые rails и status module, plasma — парные emissive coils/caps, shotgun/rocket — дополнительный structural brace;
- материалы сохранены hosting-safe и одинаково работают на uCoz / localhost / file://.

### Cover material variation
- Aegis / industrial barrier / cargo cover теперь получают детерминированные вариации палитры по позиции на карте;
- добавлены разные metal/wood trims, fasteners, small braces и менее агрессивное свечение;
- collision, LOS, penetration semantics и minimap geometry не менялись.

### Проверка
- версия повышена до v23.7;
- validation закрепляет compact minimap sizing, marker contrast/pulse, pickup beacon animation, weapon micro-details и cover palettes.

### Hosting Compatibility 2.0 — одинаковая 3D-сцена на uCoz / localhost / file://
- устранён источник чёрных прямоугольников и тёмных накладок на uCoz: постоянные 3D-объекты больше не используют полноразмерные SVG как PlaneGeometry/Sprite texture overlays;
- причина была архитектурной: локальный file:// режим скрывал эти texture overlays прозрачным fallback, а HTTP-хостинг реально загружал SVG с собственными тёмными подложками, поэтому сайт выглядел иначе локального запуска;
- оружие от первого лица теперь получает нативные emissive tech-panels/полосы из Three.js geometry вместо SVG skin/tech planes;
- боты получили процедурные цветные insignia/chevrons вместо SVG emblem planes;
- аптечки, боеприпасы и лежащее оружие используют объёмные beacon-маркеры (stem + diamond + halo) вместо billboard SVG sprites;
- hazard-разметка на стенах заменена объёмными жёлто-чёрными панелями, crate labels — металлическими plates/bolts, terminal screens — emissive geometry/glyphs;
- low-poly foliage остаётся полностью геометрическим: дополнительные SVG foliage cards удалены;
- временные FX и обычный 2D UI могут по-прежнему использовать SVG, потому что они не являются постоянными surface overlays на 3D-моделях.

### Regression protection
- validation запрещает возвращать SVG PlaneGeometry на first-person weapons, bots и persistent environment, а также SVG Sprite для pickup markers;
- проверяются procedural hazard panels, terminal glyph screen, bot insignia и pickup beacon;
- версия повышена до v23.6.

### Tactical Radar 2.0 — настоящая миникарта арены
- абстрактная схема пяти зон удалена: в нижнем левом tactical stack теперь круглая real-time миникарта, построенная из той же collision geometry, что используется игроком и ботами;
- радар показывает стены, строения, ящики, деревья, терминалы и новые cover-prefabs в их фактических координатах и поворотах;
- игрок отображается яркой направленной стрелкой, союзники — синими стрелками, активная зона и владельцы всех пяти capture zones — цветными кругами; видимые world weapon pickups дополнительно отмечены маленькими золотыми точками;
- north-up карта обновляется 10 раз/с независимо от 3D FPS, поэтому HUD остаётся дешёвым даже при 144 FPS;
- Frontline progress/status встроен прямо под картой; прежний верхний схематичный блок больше не занимает центр экрана.

### Battlefield Dressing — procedural cover assets
- добавлены три новые полностью процедурные разновидности укрытий: Aegis armor shield, industrial barrier и cargo cover;
- укрытия имеют отдельные low-poly детали, металлические/деревянные материалы, светящиеся полосы, collision/LOS и material penetration semantics;
- десять новых укрытий размещены по боковым и внешним маршрутам арены; они автоматически попадают на реальную миникарту;
- новые prefab-объекты не требуют SVG/texture fetch и поэтому одинаково работают через HTTP и file://.

### Loot & bot utility tuning
- количество world weapon pickups увеличено с 9 до 16: пистолет/дробовик/ракетница/плазма/SR-9 имеют по две точки, rifle — три, utility остаются по одной;
- точки продолжают релоцироваться после подбора и избегают скучивания;
- командный smoke теперь решается один раз на assault wave, используется только в 30% подходящих волн и после броска получает общий cooldown 14–22 секунды.

### Local file resilience
- общий DOM helper G перенесён в самый ранний catalog.js, поэтому state/bots больше не зависят от поздней загрузки progression.js;
- Three.js TextureLoader при file:// больше не создаёт CORS-шторм для SVG: используется прозрачная procedural fallback texture; по HTTP/HTTPS настоящие SVG остаются активными.

### Проверка
- версия интерфейса повышена до v23.5;
- validation закрепляет real minimap geometry, ally/player/zone markers, 10 Hz budget, новые covers, расширенный weapon distribution, reduced bot smoke и file:// texture fallback.

### Browser Local-File Hotfix — клики меню и WAV fetch storm
- исправлен root cause зависающих кнопок в Chrome/Firefox при запуске через file://: browser fetch локальных WAV возвращал Failed to fetch, а battlefield ambience после null-result немедленно вызывал себя снова через resolved Promise и мог создать бесконечную microtask-цепочку;
- в file:// режиме файловые WAV полностью отключены, а звук использует существующий Web Audio synth fallback; при HTTP/HTTPS качественные WAV продолжают загружаться;
- playBufferSfx/preload больше не создают локальные WAV fetch, поэтому консоль не должна заполняться повторяющимися Failed to fetch;
- battlefield ambience повторно запускается только после реально успешно загруженного buffer и больше не рекурсирует на null.

### Regression test
- добавлен headless Chrome smoke через настоящий file:// + DevTools Protocol: тест ждёт boot-ready, генерирует первый pointerdown, проверяет hit-test кнопки «Настройки», открытие/закрытие modal, отсутствие file-WAV loads и отсутствие критической event-loop задержки;
- обычный HTTP browser boot smoke сохранён отдельным gate.

### Проверка
- версия интерфейса повышена до v23.4.

### HUD Navigation 1.0 — карта фронта и нижняя тактическая панель
- подробная Frontline-панель перенесена из верхнего центра в общий нижний левый tactical stack над списком союзников, поэтому она больше не конфликтует с оружейным баром;
- сверху добавлена компактная карта пяти зон (Север / Запад / Центр / Восток / Юг) в реальном расположении карты; активная цель подсвечивается жёлтым, спорная зона пульсирует, захват и владелец читаются по цвету;
- карта запоминает последнего владельца каждой зоны отдельно, сохраняет это состояние в прогрессе и показывает, какие точки уже брали синие/красные, даже когда активная цель ротируется дальше;
- верхний HUD отдельно показывает текущую цель и дистанцию до неё.

### Firefox / local-file responsiveness
- тяжёлая 3D-сцена больше не рендерится на полной частоте, пока открыто главное меню, пауза или экран выбора улучшения: idle/pause rendering ограничен, а активная игра остаётся на полном requestAnimationFrame;
- первый pointerdown больше не запускает массовый WAV-preload прямо внутри пользовательского события: прогрев аудио переносится в requestIdleCallback / deferred timeout;
- неудачные WAV-загрузки получают backoff (для file:// — 60 секунд), поэтому Firefox не повторяет десятки неуспешных fetch на каждом выстреле/звуке;
- меню и настройки получили явные button hit-targets, touch-action и type=button для стабильного клика в Firefox.

### Проверка
- версия интерфейса повышена до v23.3;
- validation закрепляет tactical map/zone ownership, нижний tactical stack, menu render throttling и deferred/backoff audio-loading.

### Combat Presence 1.4 — Advanced Ballistics & Tactical Awareness
- travelling bullets получили penetration energy: дерево, металл и бетон имеют разные resistance/max-thickness/speed/damage retention; толщина реально оценивается в локальном BoxGeometry пространства объекта, поэтому тонкий ящик и толстая стена больше не эквивалентны;
- player/enemy projectile может пройти максимум через два подходящих препятствия; после каждого penetration уменьшаются скорость и урон, а на входе/выходе создаются отдельные material impacts;
- enemy tracer visuals переведены на LOD + bounded pool: дальние трассеры прореживаются, одновременно активное число ограничено, а Three.js meshes повторно используются вместо постоянного create/dispose;
- bullet decals стали ориентированными по нормали поверхности и тоже работают через pool до 56 marks — больше читаемости попаданий с меньшим allocation pressure.

### Tactical awareness
- боты отслеживают физические frag grenades противоположной команды, оценивают дистанцию/fuse и уходят от гранаты диагональным escape-vector без teleport-like dodge;
- path scoring и финальное steering учитывают hostile smoke: AI предпочитает обходить плотное чужое облако, но не боится собственного smoke screen во время штурма;
- suppressor теперь имеет handoff/hysteresis: живой и боеспособный suppressor удерживает роль короткое время, а reload/death/empty magazine вызывают быструю замену без постоянного role thrashing;
- suppressor может вести controlled fire по last-known position до 2.6 секунды после потери LOS, включая огонь сквозь дым, но не сквозь реальную стену;
- peek-from-cover получил полный cadence out → hold → return и визуальный body lean; бот больше не телепортируется между center/peek point и естественно возвращается за укрытие.

### Проверка
- версия интерфейса повышена до v23.2;
- validation закрепляет penetration profiles/thickness, projectile energy loss, tracer LOD/pool, pooled oriented decals, grenade awareness, smoke avoidance, suppressor handoff/last-known fire и lean/peek cadence.

### Combat Presence 1.3 — Ballistic Simulation & Squad Combat
- обычные пистолеты, автоматы, дробовики и плазма ботов больше не наносят урон мгновенным hit-roll: каждый pellet/round становится bounded travelling projectile с muzzle velocity, gravity, range, swept-segment wall/entity collision и distance damage falloff;
- SR-9 сохранена как мгновенный hitscan, ракеты остаются отдельными rocket entities — предыдущая игровая семантика этих классов оружия не сломана;
- входящий suppression теперь собирается с фактических сегментов нескольких пуль: closest point считается на каждом реально пройденном участке, поэтому стена действительно прекращает suppression;
- физические пули могут подавлять и других ботов рядом с траекторией, а попадание может прийтись не только в исходную выбранную AI-цель.

### Material impacts + reactive battlefield
- объектам карты добавлена impact-material metadata: hazard walls = metal, supply crates = wood, остальные стены по умолчанию concrete;
- sparks, smoke, decals, impact pitch и вероятность ricochet различаются по metal / concrete / wood;
- вражеская пуля может один раз физически отрикошетить от metal/concrete при малом угле, теряя скорость и 44% урона;
- дальний acoustic tail теперь дополнительно рождается из реальных пространственных выстрелов ботов, поэтому distant combat реагирует на фактическую перестрелку, а не только на фоновый loop.

### Squad utility + peek combat
- breach/retake wave получила цепочку suppressor → flankers → breach assault; состояние breachReady появляется только при активном suppressor и живом flank pressure;
- инженер/anchor один раз за assault wave может поставить smoke screen на направлении движения, а assault/engineer — бросить физическую осколочную гранату, если в точке нет союзников;
- bot smoke использует общий smoke simulation и реально блокирует LOS;
- frag grenade имеет полёт, gravity, bounce, fuse и team-safe blast damage через общий explosion pipeline;
- бот в cover теперь ищет безопасную левую/правую peek-position с проверкой collision, LOS и smoke, ненадолго выходит из укрытия и возвращается вместо вечной стрельбы из центра cover point.

### Проверка
- версия интерфейса повышена до v23.1;
- validation закрепляет travelling enemy bullets, bounded pool, swept collision, physical suppression, material metadata/ricochet, squad utility, breachReady role chain и peek-from-cover.

### Combat Presence 1.2 — Suppression & Battlefield Life
- случайный near-miss feedback заменён геометрией реального выстрела бота: для фактического tracer direction вычисляется closest approach к торсу игрока, дальность вдоль луча и проверка препятствий; whiz/suppression возникает только если пуля действительно проходит рядом;
- добавлено накопительное состояние suppression: плотный близкий огонь мягко увеличивает реальный weapon spread, раскачивает оружие, расширяет/подсвечивает reticle и даёт короткую presentation-only camera reaction без фиктивного урона;
- SR-9 использует усиленный supersonic crack только при реально близком пролёте.

### Battlefield audio
- добавлены ещё 10 оригинальных procedural WAV: distant battlefield loop, magazine reload, reload completion, shell insert, bolt, pump, equip и отдельные шаги по metal / gravel / water;
- после первого пользовательского ввода запускается тихий low-pass battlefield ambience; он проходит через общий SFX master и не создаёт отдельной настройки громкости;
- синтетические reload/equip/bolt/pump cues заменены WAV-механикой с сохранением synth fallback;
- удалённые боты также слышимо перезаряжаются через spatial attenuation;
- поверхность шага выбирается по геометрически осмысленным зонам карты: индустриальный центр — metal, внешний периметр — gravel, бассейн на западе — water, остальная арена — concrete.

### Coordinated breach / retake + cover-to-cover
- для доктрин breach и retake введены командные assault waves с короткой staging-фазой и общей active-фазой: роли сначала собираются в разнесённой формации, затем синхронно ускоряют заход на objective;
- objective orders учитывают wave state, поэтому assault/flank/anchor/engineer меньше растягиваются по карте перед прорывом;
- выбор укрытия во время breach/retake награждает реальное продвижение к objective;
- бот, достигнув промежуточного укрытия в активной assault wave, может выбрать следующее более переднее укрытие вместо немедленного выхода в обычный engage — появился настоящий cover-to-cover chain.

### Проверка
- версия интерфейса повышена до v23.0;
- validation проверяет 28 WAV-файлов, physical closest-approach near miss, suppression spread, sampled weapon mechanics, surface footsteps, battlefield ambience, assault wave state и cover-chain; legacy random near-miss запрещён.

### Combat Presence 1.1 — акустика пространства, шаги и impact layer
- добавлены ещё 8 оригинальных procedural WAV: открытый и тесный acoustic tail, supersonic crack SR-9, шаг/бег, попадание в тело, бронепластину и голову;
- выстрелы теперь получают геометрически выбранный хвост: четыре коротких raycast-пробы вокруг источника отличают открытое пространство от участков с близкими отражающими стенами; tail имеет cooldown, чтобы автоматический огонь не превращался в аудио-кашу;
- SR-9 получил отдельный мощный crack поверх muzzle report; опасный промах вражеской SR-9 дополнительно воспроизводит listener-side crack вместе с directional threat cue;
- шаги игрока и ботов привязаны к реально пройденной дистанции: бег имеет более короткий stride и тяжёлый звук, удалённые боты отсекаются spatial attenuation;
- ballistic hit-feedback разделён по зонам: нижняя часть тела, бронированный торс и голова/шлем звучат по-разному; при входящем уроне броня игрока также имеет отдельный metallic impact.

### Cover Navigation + Frontline density
- binary «прямая линия заблокирована» заменена на route penalty: AI пробует безопасный двухсегментный обход слева/справа и не отвергает хорошее укрытие только потому, что к нему нет прямой линии;
- при спорной или потерянной Frontline-точке растёт objective urgency: удалённые бойцы раньше возвращаются к зоне, objective movement немного ускоряется, а engagement получает мягкое притяжение к точке;
- бот внутри горячей зоны меньше склонен уходить в retreat при умеренном уроне: так сохраняется плотность боя, но критически раненые и окружённые боты по-прежнему отступают.

### Проверка
- версия интерфейса повышена до v22.9;
- validation проверяет все 18 WAV-файлов, acoustic profiling/tails, sniper crack, distance-driven footsteps, hit-zone audio, route penalty и Frontline urgency.

### Combat Presence 1.0 — пространственный звук и читаемость угроз
- добавлен собственный набор оригинальных PCM WAV-эффектов без сторонних семплов: пистолет, автомат, дробовик, SR-9, ракетница, плазма, взрыв, рикошет, пролёт пули и музыкальный сигнал захвата Frontline;
- выстрелы ботов теперь реально слышны: громкость затухает с расстоянием, а StereoPanner даёт направление слева/справа относительно взгляда игрока; снайперские выстрелы слышны дальше обычных;
- выстрел игрока, взрывы, рикошеты и near-miss используют файловые эффекты, а прежний Web Audio synth остаётся безопасным fallback, если asset ещё грузится или декодирование недоступно;
- опасный промах противника получил отдельный янтарный directional telegraph: игрок получает направление угрозы ещё до получения урона, не смешивая его с красным индикатором фактического попадания.

### Frontline readability + cover AI
- заголовок Frontline получил вращаемый bearing-arrow к активной зоне и явный статус «В ЗОНЕ», поэтому цель легче читать даже во время интенсивной перестрелки;
- удерживающие и возвращающие точку боты теперь предпочитают тактические укрытия внутри/рядом с активной Frontline-зоной; фланкеры получают мягкий штраф за маршруты, слишком далеко уводящие их от цели;
- захват точки получил отдельный аудио-stinger с различимым тоном для синей/красной команды.

### Проверка
- версия интерфейса повышена до v22.8;
- validation проверяет наличие и RIFF/WAVE-заголовки всех 10 аудиофайлов, интеграцию spatial audio, threat telegraph, Frontline bearing и objective-aware cover scoring.

### Frontline 1.0 — ротационные зоны контроля
- внутренние тактические районы AI превращены в реальную игровую цель: активная Frontline-зона меняется примерно раз в 44 секунды и отмечается 3D-кольцом/маяком на арене;
- захват зависит от реального присутствия обеих команд внутри радиуса: превосходство ускоряет прогресс, одновременное присутствие делает точку спорной, а полный захват приносит команде отдельное очко контроля;
- каждый захват считается как 3 командных очка поверх убийств; HUD показывает активный район, расстояние, время до ротации, направление захвата и счёт по зонам;
- Tactical AI 2.2 получил высокий приоритет активной Frontline-точки при выборе push/hold/retake, поэтому отделения теперь естественно сходятся к общей цели, не теряя существующие anti-camp и recovery-механики;
- игрок, который реально находится в зоне при синем захвате, получает +150 score и +35 XP — участие в объекте выгоднее пассивного наблюдения со стороны.

### Сохранение и проверка
- формат автосохранения повышен до v27: сохраняются активная зона, прогресс захвата, владелец, оставшееся время ротации и число захваченных зон обеих команд;
- старые v20–v26 сохранения продолжают загружаться и начинают Frontline с нейтрального ЦЕНТРА;
- validation закрепляет Frontline runtime tick, 3D marker, HUD, AI-bias, v27 persistence и версию интерфейса v22.7.

### Combat AI 2.2 — Adaptive Commander
- добавлен лёгкий профиль поведения игрока: AI различает длительное удержание небольшой позиции, мобильный стиль и глубокий раш в сторону красной половины карты;
- если игрок долго держит одну небольшую зону и продолжает стрелять, красная команда может перейти в приказ `breach` / «ПРОРЫВ»: suppressor сохраняет давление, flankL/flankR получают более длинный commit на pincer, assault продвигается глубже;
- при глубоком раше игрока красная команда быстрее выбирает retake района рядом с его текущей позицией вместо бесконтрольного преследования;
- серия потерь во время `push/breach` включает короткую recovery-фазу: commander временно выбирает hold и только затем снова наращивает давление;
- engineer/anchor чаще используют мины при hold/retake, а бомбы получают повышенный шанс именно при breach; это меняет utility по тактическому приказу, а не просто увеличивает общий урон.

### Плавность движения ботов
- устранён главный источник «телепортирующих» рывков: прежний dodge разгонял AI примерно до 2.35–3× обычной скорости;
- dodge теперь остаётся коротким уклонением около 1.3–1.5× базовой скорости, а mine-evasion также ограничен;
- stuck recovery больше не вызывает высокоскоростной dodge: бот делает отдельный плавный боковой выход из препятствия;
- движение проходит через acceleration cap и общий speed cap, поэтому резкая смена AI-state не может мгновенно разогнать модель;
- collision movement разбит на небольшие micro-steps, а фактическое смещение за кадр имеет hard cap — даже push-out из AABB не должен выглядеть как телепорт;
- рост скорости ботов от высокого уровня/числа убийств ограничен, чтобы late-game AI становился сильнее без неестественного ускорения.

### Regression checks
- validation закрепляет adaptive player profile, `breach`, recovery after failed pushes, doctrine-aware explosives и anti-teleport locomotion safeguards;
- версия интерфейса повышена до v22.6.

### Combat AI 2.1 — Map Tactics
- арена разделена на пять логических тактических районов: ЦЕНТР, СЕВЕР, ЮГ, ЗАПАД и ВОСТОК;
- каждая команда периодически оценивает присутствие обеих сторон в районах, живую численность и глубину продвижения относительно собственного направления атаки;
- введены командные приказы `push / hold / retake`: численное преимущество переводит отделение в продвижение, глубокое вторжение противника на свою половину — в retake, а заметное численное отставание — в удержание;
- map-order имеет commit window, поэтому команда не меняет приказ каждый кадр из-за кратковременного колебания контроля;
- новый `objective` state ведёт ботов к общей зоне с разными role offsets: assault продвигается глубже, anchor держится позади, flankL/flankR разводятся по сторонам, engineer занимает поддерживающую позицию;
- при `hold` даже находящиеся в бою боты получают мягкий leash к назначенному району и меньше увлекаются погоней через всю арену;
- панель союзников теперь показывает текущий приказ, район и численную дельту команды.

### Regression checks
- validation закрепляет карту тактических зон, расчёт map-order, objective-state, hold leash и HUD-индикацию приказа;
- версия интерфейса повышена до v22.5.

### Tactical AI 2.0 — координация отделения
- поверх существующих индивидуальных ролей добавлен общий squad-plan для каждой команды: AI голосует за приоритетную цель на основе текущей видимости, памяти и уже существующего `TEAM_INTEL`;
- один подходящий assault/anchor/engineer назначается suppressor, пока flankL/flankR выполняют обход;
- suppressor использует более длинные очереди с намеренно сниженной точностью: это даёт прикрывающий огонь без простого роста lethality;
- flankL и flankR ищут разные боковые позиции среди cover points, учитывая маршрут, занятость союзниками и наличие будущей линии огня;
- промахи по AI-боту теперь могут создавать suppression pressure: подавленный бот чаще ищет укрытие и временно стреляет менее точно, но не получает фиктивный урон;
- anchor и engineer способны перейти в support-state и держаться рядом с наиболее раненым союзником, сохраняя направление на противника;
- существующий лимит одновременного огня по игроку сохранён, но внутри лимита приоритет получает назначенный suppressor, а фланкеры реже превращаются в обычную фронтальную firing line;
- роли теперь видны над ботами и в панели синих союзников.

### Regression checks
- validation закрепляет squad-plan, flank/support states, suppression semantics, suppressor-aware player pressure и отображение ролей;
- после первого CI-run обновлены устаревший locomotion-token и порядок чтения runtime в validation script; gameplay-код при этом не ослаблялся;
- версия интерфейса повышена до v22.4.

### Непрерывный бой и тактическое возрождение
- смерть игрока больше не уничтожает всех живых ботов, pickups, мины и летящие снаряды: командный бой 5×5 продолжается без искусственного «перезапуска карты»;
- игрок возрождается на безопасной точке синей стороны, выбранной с учётом расстояния до живых врагов и союзников, вместо жёсткого возврата в центр арены;
- после respawn камера ориентируется в сторону ближайшего живого противника, а существующий spawn shield защищает от случайного мгновенного повторного убийства;
- недостающие боты по-прежнему пополняются штатным runtime-spawn циклом, поэтому состав 5×5 восстанавливается без стирания живой сцены.

### Kill feed
- добавлен компактный kill feed с цветовой идентификацией игрока, союзников и врагов;
- feed показывает прямые убийства, headshot, ракеты, мины, бомбы и bot-vs-bot события;
- новая игра очищает feed, а обычное возрождение сохраняет контекст текущего боя.

### Regression checks
- validation закрепляет наличие safe-respawn selector, непрерывного player respawn и kill-feed wiring;
- исправлена дублирующая декларация в validation script, найденная первым CI-run после v22.3;
- версия интерфейса повышена до v22.3.

### Premium-pass всех first-person моделей оружия
- визуально переработаны все 9 типов оружия/снаряжения в руках игрока, а не только штурмовая винтовка;
- для pistol, shotgun, rifle, rocket, plasma и sniper добавлены отдельные muzzle/optic/rail/vent/stock/coil детали и более выразительные силуэты;
- mine, bomb и smoke получили более детализированные корпуса, индикаторы, кольца, сегменты брони и utility-элементы;
- добавлены ещё 9 новых SVG skin-assets `assets/weapons/fp/*-skin.svg` поверх уже существующих tech-панелей;
- введены индивидуальные `FP_MODEL_TUNING` и `FP_DECAL_TUNING`, чтобы каждый ствол занимал более аккуратную часть экрана и не выглядел одинаково масштабированным;
- muzzle flash и beam теперь являются дочерними элементами самой модели оружия, поэтому корректно следуют её масштабу/позиции.

### Проверка
- structure validation теперь требует все новые skin-assets, их регистрацию в asset catalog и наличие premium first-person model/tuning path.

### First-person оружие и прицел штурмовой винтовки
- полностью переделан `rifle-scope.svg`: центр оптики теперь прозрачный и не закрывает игровой мир;
- добавлены 9 новых SVG tech-assets в `assets/weapons/fp/` — отдельный визуальный модуль для каждого типа оружия;
- first-person оружие получило улучшенные руки/перчатки, разные hand poses по типам оружия и более выразительные sci-fi hard-surface детали;
- штурмовая винтовка дополнительно получила усиленные боковые панели, rail/optic элементы и emissive-акценты.

### Походка и хват оружия ботов — дополнительная проходка
- для каждого оружия добавлены индивидуальные elbow hints, чтобы локти сгибались естественнее и руки меньше пересекали корпус;
- оружие сдвинуто ближе к центру груди и выше к линии плеч, а не висит сбоку;
- gait дополнен вертикальным step-bob, hip sway, переносом корпуса и движением стоп по фазе шага;
- IK-хват продолжает пересчитываться после weapon sway, поэтому кисти остаются на рукояти/цевье во время движения.

### Пустое оружие
- если магазин и резерв найденного оружия одновременно равны нулю, его слот исчезает из weapon-bar;
- колесо мыши, Q и прямое переключение больше не выбирают полностью пустой ствол;
- если текущий ствол полностью закончился, игра автоматически переключается на следующее доступное оружие с боезапасом;
- повторный pickup этого типа возвращает слот обратно, ownership в сохранении при этом не теряется.

### Regression checks
- validation закрепляет прозрачный rifle scope, новые first-person assets, улучшенный gait/IK и скрытие полностью пустых оружейных слотов.

### Реалистичный хват оружия ботами
- убраны декоративные «фальшивые кисти», которые были прикреплены к самой модели оружия;
- для каждого типа оружия заданы реальные точки хвата правой и левой руки;
- у ботов добавлен двухсегментный IK-подобный решатель плечо → локоть → кисть;
- правая рука теперь тянется к рукояти/спуску, левая — к цевью или корпусу оружия;
- хват пересчитывается после weapon sway/gait, поэтому руки остаются на оружии при ходьбе, стрейфе и боевой позе.

### HUD и переключение оружия
- LEVEL/XP перенесён из центральной зоны weapon bar в левый верхний угол;
- колесо мыши вниз переключает на следующее найденное оружие, вверх — на предыдущее;
- закрытые/ещё не найденные слоты при прокрутке автоматически пропускаются;
- подсказки управления и README синхронизированы с новым поведением.

### Regression checks
- validation закрепляет отсутствие fake-hands на weapon mesh, наличие bot arm IK, wheel cycling только по owned weapon slots и новый безопасный layout LEVEL/XP.

### Арсенал и боезапас
- новая игра начинается только с пистолетом; остальные слоты открываются world pickups;
- каждый слот хранит отдельные магазин и резерв;
- повторный pickup того же типа даёт случайно 50–400 единиц его боезапаса;
- отдельные универсальные ammo-box pickups больше не спавнятся;
- после сбора weapon pickup респавнится через время в другой части карты;
- autosave v26 сохраняет ownership, магазины и резервы; legacy saves не возвращают весь арсенал бесплатно.

### Оптика штурмовой винтовки
- штурмовая винтовка получила ПКМ optical scope с отдельным rifle-scope.svg и умеренным увеличением;
- SR-9 сохраняет свой 8× scope; дробовик scope не получил.

### Визуальная проходка ботов
- добавлены новые SVG-маркировки командной брони, светящийся визор и дополнительные элементы силуэта;
- weapon pose теперь зависит от типа ствола; добавлен более естественный двуручный хват.

### Regression checks
- validation закрепляет pistol-only старт, диапазон 50–400, отсутствие standalone ammo pickups, динамический weapon respawn, rifle scope и новые bot assets.

### Реалистичное передвижение ботов
- убрано мгновенное переключение между скоростями: ускорение, торможение и смена направления теперь сглаживаются, а экстренные уклонения остаются отзывчивыми;
- цикл шага привязан к реально пройденной дистанции и фактической скорости, поэтому ноги больше не «едут» по земле с фиксированной частотой;
- в походку включены бёдра, колени, ступни и руки; добавлены отдельные реакции для движения назад и бокового стрейфа;
- корпус и оружие получают небольшой перенос веса, шаговый sway и idle-breathing без изменения логики боя;
- проверка структуры закрепляет наличие нового locomotion state, velocity response и процедурной gait-анимации.

### Командный режим 5×5
- режим free-for-all заменён на командный бой: игрок + 4 союзных AI-бота против 5 вражеских ботов;
- спавн и respawn поддерживают состав 5×5;
- командный счёт разделён на «СИНИЕ» и «КРАСНЫЕ»;
- панель союзников теперь показывает именно живых ботов своей команды.

### Различие своих и врагов
- союзники получили выраженную синюю/голубую палитру, враги — красную;
- усилены цветные кольца, HP-индикаторы и подписи «СВОЙ» / «ВРАГ»;
- оружие и ракеты союзников визуально отличаются от вражеских.

### Team-aware combat
- боты больше не выбирают союзников целью;
- союзные боты не атакуют игрока;
- отключён friendly fire для прямых попаданий, ракет, мин, бомб и blast damage;
- мины и ракеты хранят команду владельца и не срабатывают на своих;
- AI учитывает союзников на линии огня и рядом с точкой ракетного взрыва;
- убийства союзных AI корректно увеличивают счёт синей команды.

### Интеллект ботов
- добавлено восприятие по уровням «вижу / слышу / помню» вместо одинакового знания всех целей;
- выстрелы создают шум с дальностью, зависящей от оружия; стены приглушают звук, а услышанная позиция имеет погрешность;
- выбор цели учитывает видимость, слух, память, здоровье, опасность цели и число уже атакующих её союзников;
- добавлена реакция на локальное численное превосходство;
- боты меняют дистанцию и стрейф с учётом оружия противника;
- добавлено прогнозирование траектории входящей ракеты и направленное уклонение;
- сохранены улучшения поиска цели, укрытий, локального обхода препятствий и памяти движения.

### Сохранения
- формат автосохранения повышен до v25;
- старые v20–v24 сейвы продолжают загружать прогресс игрока, но старый FFA-счёт не переносится в новый командный счёт.

### Проверка
- GitHub Actions Validate #20 успешно прошёл syntax, project structure и browser boot smoke test после основного 5×5/AI-коммита;
- Validate #21 успешно подтвердил финальную миграцию автосохранений.

## v22.2 — 2026-09-25

### Weapon handling
- добавлено реальное время вскидывания после смены оружия;
- добавлен sprint-to-fire: во время спринта оружие опускается, а после остановки требуется короткое время возврата к боевой готовности;
- sprint больше не даёт ускорение, когда оружие занято reload/cycle/scope;
- добавлен live HUD состояния оружия: вскидывание, спринт, bolt/pump cycle, tactical/empty/shell reload;
- добавлен quick-switch на предыдущее оружие по `Q`, но он не обходит equip time;
- first-shot accuracy теперь отдельно улучшает первый выстрел из устойчивого положения;
- recoil/reticle учитывают реальное состояние handling.

### Перезарядка и механика
- дробовик получил shell-by-shell reload вместо мгновенного заполнения всего магазина;
- после вставленного патрона shell reload можно прервать выстрелом;
- магазинные стволы различают tactical reload и empty reload;
- pump-action и bolt-action получили отдельные механические cycle states и анимацию;
- гильза дробовика и SR-9 выбрасывается во время движения помпы/затвора, а не в момент выстрела;
- perk скорострельности теперь ускоряет и fire cadence, и pump/bolt cycle;
- добавлены equip, shell insert, reload cancel, ricochet и near-miss audio cues.

### SR-9
- SR-9 гарантированно убивает **первую живую цель одним прямым попаданием**;
- гарантированный one-shot не переносится на вторую цель после penetration: она получает ослабленный урон;
- SR-9 остаётся мгновенным hitscan без bullet travel и bullet drop.

### Прицел
- найдена и устранена причина двойного прицела: старый SVG-crosshair одновременно рисовался под новым динамическим reticle;
- legacy `assets/ui/crosshair.svg` удалён из игры и репозитория;
- обычное оружие использует ровно один динамический CSS-reticle;
- SR-9 использует только отдельный sniper scope и не показывает обычный crosshair.

### Дополнительный feedback
- добавлен ricochet feedback для неглубоких попаданий ballistic-пуль в стены;
- добавлен near-miss bullet whiz для промахов вражеских ботов рядом с игроком.

### Проверка
- validation закрепляет one-shot SR-9, отсутствие legacy crosshair SVG и новый weapon lifecycle;
- browser boot smoke остаётся обязательным перед merge.

## v22.1 — 2026-09-25

### Стрельба и баллистика
- исправлена реальная дальность hit detection: цель больше не отбрасывается жёстким лимитом около 60 игровых единиц;
- пистолет, дробовик, штурмовая винтовка и плазма теперь создают реальные движущиеся projectiles;
- для быстрых пуль используется swept segment collision, чтобы они не пролетали через ботов и стены между кадрами;
- ballistic-профили получили muzzle velocity и bullet gravity;
- damage falloff считается по фактически пройденной пулей дистанции;
- penetration продолжает полёт пули после первого попадания со снижением урона;
- добавлен накапливаемый weapon bloom и восстановление точности;
- recoil использует повторяемые горизонтальные patterns с небольшим случайным jitter;
- динамический crosshair показывает текущую spread/bloom обычного оружия;
- HUD показывает fire mode и фактическую скорость снаряда;
- добавлены dry-fire, bolt и pump механические SFX.

### SR-9 и ПКМ-прицел
- SR-9 переведена на **мгновенный hitscan**: попадание регистрируется в момент клика, без travel time и bullet drop;
- добавлен явный `aimMode:'scope'`, который есть только у SR-9;
- ПКМ больше не меняет FOV, позицию оружия или чувствительность у остальных стволов;
- снайперская винтовка не показывает обычный hip-fire crosshair — прицел появляется только как 8× scope по ПКМ;
- scope входит плавно, а точность интерполируется вместе с фактическим временем входа в оптику;
- HUD SR-9 показывает режим `BOLT · МГНОВЕННО`.

### Надёжность
- validation закрепляет sniper-only RMB scope, instant hitscan SR-9 и ballistic projectile path обычных стволов;
- browser boot smoke остаётся обязательным перед merge.

## v22.0 — 2026-09-25

### Оружие и физика стрельбы
- все основные стволы получили отдельные handling-профили вместо почти одинаковой логики;
- пистолет работает как semi-auto: умеренный темп, быстрый reload и средний урон;
- дробовик работает как pump-action: 6 патронов, медленный повторный выстрел, сильная отдача и резкий close-range falloff;
- прежняя винтовка стала штурмовой: 30 патронов, автоматический огонь, средний урон и контролируемая дальность;
- ракетница стала однозарядной тяжёлой системой с более медленной перезарядкой и ускоренным физическим снарядом;
- плазма стала high-RPM / low-damage автоматом с большим магазином;
- для ballistic-оружия добавлены отдельные hip/ADS spread, штраф точности в движении и воздухе, damage falloff и индивидуальная скорость трассера;
- восстановление camera recoil теперь зависит от конкретного оружия;
- удержание ЛКМ повторяет огонь только у реальных automatic-профилей.

### Новая снайперская винтовка SR-9
- добавлена девятым оружием на клавишу `9`;
- bolt-action cadence: 5 патронов, 3.4 секунды reload и 1.30 секунды между выстрелами;
- высокий базовый урон и отдельный headshot multiplier;
- очень высокая скорость трассера и сильная отдача;
- высокая hip-fire неточность и почти точный выстрел через scope;
- 8× scope с отдельным SVG-reticle и замедлением чувствительности мыши;
- отдельная 3D procedural-модель для first-person, ботов и world pickup;
- отдельные `assets/weapons/sniper.svg`, `assets/fx/sniper-shot.svg` и `assets/ui/sniper-scope.svg`;
- отдельный sniper shot SFX и scope recoil animation;
- боты умеют выбирать SR-9 на дальней дистанции, особенно в роли anchor.

### Проверка
- Validate теперь требует 9 weapon definitions;
- CI проверяет sniper weapon / impact / scope assets и wiring;
- browser boot smoke остаётся обязательным перед merge.

Все заметные игровые и инженерные изменения фиксируются здесь отдельными версиями: что изменилось, зачем и как это проверяется.

## v21.9 — 2026-09-25

### Добавлено
- отдельный модуль `src/settings/settings.js`;
- меню настроек из стартового экрана и паузы;
- чувствительность мыши 0.50×–2.00×;
- регулируемая громкость звуковых эффектов;
- переключатели screen shake, динамического прицела и FPS-индикатора;
- Web Audio SFX для стрельбы, попаданий, критов, убийств, перезарядки, урона, level-up, смерти и взрывов;
- hitmarker с состояниями hit / headshot / critical / kill;
- указатель направления входящего урона;
- сохранение пользовательских настроек отдельно от игрового прогресса.

### Изменено
- mouse-look использует пользовательский multiplier вместо жёстко заданной чувствительности;
- screen shake реализован как presentation-only CSS transform canvas и не меняет физическую позицию камеры;
- rocket explosions получают дистанционно ослабляемый звук и экранную отдачу;
- validation проверяет wiring нового settings/presentation слоя;
- текущая версия интерфейса обновлена до **v21.9**.

### Проверка
- `node --check` для всех JS;
- `scripts/validate-structure.mjs`;
- browser boot smoke test в GitHub Actions.

## v21.8 — 2026-09-25

- 52 уникальных SVG-иконки perks;
- combat medals и status HUD;
- world-space impact FX;
- отдельный armor-break feedback;
- CI связывает фактические perk ids с обязательными SVG assets.

## v21.7 — 2026-09-25

- визуальный asset layer для арены, персонажей и pickups;
- улучшенные explosions и lethal headshot finisher;
- visual meshes отделены от collision/hit meshes.
