# Bot 3D Pack46 — Blender modular volume bot

Общий workflow Blender → GLB → runtime derivative → Three.js verification: [`docs/BLENDER_ASSET_PIPELINE.md`](../../docs/BLENDER_ASSET_PIPELINE.md). Этот README хранит только Pack46-specific provenance, geometry contract, artifact identity и evidence.

Дата: 2026-10-06

## Назначение

Pack46 заменяет простой procedural-внешний вид ботов настоящей модульной Blender-моделью, сохраняя существующие gameplay hit meshes, AI, weapon pivot, two-hand IK и locomotion owners.

Визуальное направление восстановлено вручную по одобренным в этом диалоге ally/enemy concept renders: graphite/steel hard-surface armor, крупный цельный визор, layered chest/shoulder/forearm/thigh/shin plates, cyan/blue ally accents и crimson/red enemy accents. 2D concept используется как design reference, а не как texture plane или источник готовой скрытой 3D-геометрии.

## Canonical sources

- `build_bot_3d.py` — детерминированный Blender builder.
- `manifest.json` — generated machine-readable identity: Blender version, coordinate bridge, per-component triangles/runtime vertices/material groups/q16 bounds и artifact hashes.
- `zap-bot-modular-46.blend` — editable Blender source.
- `zap-bot-modular-preview-46.png` — offline Blender render evidence, не runtime asset.
- `zap-bot-runtime-proof-46.jpg` — close Three.js runtime proof geometry; не runtime asset.
- `zap-bot-runtime-visibility-proof-46.jpg` — neutral-light ally/enemy distance proof для проверки team-color readability; не runtime asset.
- `zap-bot-runtime-facing-proof-46.jpg` — front-facing runtime proof, который сверяет visual body/weapon с gameplay +Z forward; не runtime asset.
- `../../assets/characters/models/zap-bot-modular-46.glb` — canonical glTF 2.0 model artifact.
- `../../assets/characters/models/zap-bot-modular-46.runtime.js` — generated vertex/normal derivative из того же Blender mesh для HTTP + direct `file://` без XHR/CORS.

Runtime owner: `src/entities/bot-model3d.js`.
Rig/hit-mesh bridge: `src/entities/bot-presentation.js`.
Locomotion/AI/weapon owners не переносятся в Pack46.

## Components

Canonical component names:

`ZAP_Head`, `ZAP_Torso`, `ZAP_Pelvis`, `ZAP_Shoulder`, `ZAP_UpperArm`,
`ZAP_Forearm`, `ZAP_Hand`, `ZAP_Thigh`, `ZAP_Shin`, `ZAP_Foot`.

Один component set переиспользуется обеими командами. В runtime он даёт 17 видимых частей после зеркалирования left/right limbs.

## Visual construction

- Head: compact rounded helmet, framed visor, jaw/cheek armor, circular side modules, antenna, layered crown/temple rails, top/bottom visor seals, side blades/crown spine, lower sensor, chin/rear vents and a small antenna collar.
- Torso: broad tapered core with separate pectoral/sternum/ab plates, split clavicle rails, recessed accent backing, center keel/ab rails, compact rear backpack/back blades plus exposed rubber shoulder sockets, metal bearing faces and a service rail.
- Arms: oversized layered pauldrons now sit over a real visual joint/bearing; upper arm and forearm add top/lower collars, wrist bearing, compact actuator pistons and service latches; glove keeps segmented knuckles and adds finger rails.
- Pelvis: armored front/codpiece plates, belt/pouch modules, hip rails/team-color guards plus visible hip bearings and belt latches.
- Legs: wider stance, broader thigh/shin armor, knee/rear/calf/ankle bridges plus hip/knee bearing collars, low-poly actuators/service latches and planted boots with heavier sole/heel/toe bumper, toe seam, ankle latch and heel vents.
- Gap-control + mechanical-realism pass: armor shells now read as covers over a plausible `bearing/collar → actuator → service hardware` layer. Geometry is spent on joints and structural cues that survive gameplay distance; microdetail that only reads in Blender close-up is rejected.
- Rig proportions: presentation shoulders widened to ±0.38m and visual hips to ±0.17m; long-gun poses lower the weapon and elbows so chest armor remains readable.
- Materials: dark undersuit + moderately metallic steel hardware + high-visibility team paint + framed emissive visor/glow. Runtime is calibrated to the actual arena light rig (directional + hemisphere + ambient, no `scene.environment`): shell/edge metalness is `0.36` / `0.48` so hardware keeps diffuse readability instead of collapsing toward black. Ally shell/edge `#506476` / `#8295A7`; enemy `#62565B` / `#8B7D82`. Team paint is saturated azure `#2F97FF` for ally and red `#EF4052` for enemy; `MAT_ACCENT` uses metalness `0.10`, roughness `0.34`, restrained emissive `0.22` / `0.17`. Existing chest, upper-arm, forearm and thigh accent surfaces were enlarged without adding a material slot. Emissive hierarchy remains `accent < visor < small glow`: ally `0.22 < 1.30 < 1.65`, enemy `0.17 < 0.84 < 1.12`. Mechanical hardware still reuses `MAT_EDGE`, keeping 60 GLB draw calls.
- Runtime derivative keeps Blender corner normals for smooth shading and stores position/normal streams as q16 Base64, decoded by `src/entities/bot-model3d.js`, to retain the richer geometry without exceeding the validation budget.
- Desktop `PERF_MODE/MOBILE_LOW`: Pack46 remains active, including direct `file://`; the lightweight procedural fallback is reserved for low-power coarse-touch devices or missing/incomplete Pack46.

## Gameplay invariants

- `pts[]` gameplay geometry/order is unchanged and continues to own hits/raycast.
- Old hit-mesh surfaces are hidden only visually; gameplay nodes remain.
- Blender parts attach to the existing animated arm/leg hierarchy.
- Existing real weapon mesh and `BOT_WEAPON_POSES` remain authoritative.
- Existing two-bone IK keeps both hands on weapon grips.
- No PNG/WebP/JPEG is used as a bot WebGL texture plane.
- Missing/incomplete Pack46 fails closed to the procedural bot.

## Rebuild

```powershell
& "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --python "G:\МОЯ Веб-разработка\ZAP_ZONE\asset-staging\2026-10-06-bot-3d-pack-46\build_bot_3d.py"
```

Builder regenerates canonical GLB, runtime derivative, editable `.blend`, preview and `manifest.json`. It fails fast if any component leaves the q16 local-coordinate range `[-1,1]`. Do not hand-edit generated runtime JS or manifest.

## Current artifact identity

Current generated identity is owned by `manifest.json` (Blender `5.2.2 LTS`):

- `zap-bot-modular-46.glb`: 2077760 bytes; SHA256 `43a158de88ea094a34c00b6ea7cd718623ffa116819c9cb00f3d99323f535dd3`.
- `zap-bot-modular-46.runtime.js`: 1934338 bytes; SHA256 `4e7dbaec38a6ae1967cb83cfc8f040fc735cd8e33f942eef87076e0764c29458`.
- `zap-bot-modular-46.blend`: 828036 bytes; SHA256 `59ced45d3443c2b5bb80903e58ba20d51457d167f722a9db31b2536484f9326d`.
- `zap-bot-modular-preview-46.png`: 938049 bytes; SHA256 `4e957b236c9884f185f6909ac93985af21b496ce56a1f5a9e7e632a07ad6369f`.
- `build_bot_3d.py`: 36813 bytes; SHA256 `fa4783b8e1ff1ec43ab88661e0e48e90f55a4c739318d5dfe3dec3021380ede7`.
- `manifest.json`: 2402 bytes; SHA256 `72894e2a3a49fc1d73480f39cfb40319c7a739d036decbdc963c1caa3a352fc0`.
- `zap-bot-runtime-proof-46.jpg`: 54329 bytes; SHA256 `91a78a3a3ed8add07b6be196cd10430f0782d74e6dc67c146371eb7d7c991259`.
- `zap-bot-runtime-visibility-proof-46.jpg`: 36119 bytes; SHA256 `17709aa36078c83759addf09e8e27b3065fc8715efed796f21fd0018effd840d`.
- `zap-bot-runtime-facing-proof-46.jpg`: 25271 bytes; SHA256 `78cc02809057946b53b6df44f1975c9ba700ac3a3f4e225defe4e9724119dcbd`.

## Verification

- Blender 5.2.2 LTS headless rebuild: **PASS**; q16 range guards all pass. Maximum current component-local absolute coordinate: `0.45` (`ZAP_Head`).
- Khronos glTF Validator `2.0.0-dev.3.10`: **0 errors / 0 warnings / 0 infos / 0 hints**; **75,100 GLB vertices, 40,224 triangles, 60 draw calls**, 7 materials, no texture/UV payload; extension used: `KHR_materials_emissive_strength`.
- Mirrored runtime component budget: **178,008 non-indexed vertices per bot**. Relative to the previous mechanical-realism baseline (**75,232 / 40,288 / 178,392**) this pass slightly reduced tessellation while keeping draw calls at 60; no new material group was introduced.
- Focused Pack46 + presentation tests on current artifacts: **14/14 PASS**, including generated-manifest SHA-256 identity, q16 decoder, team PBR palette hierarchy, desktop-low-perf/touch fallback, rig regressions and the +Z visual/gameplay facing contract.
- Full Node regression suite on current working tree: **340/340 PASS**.
- Structure validation: **PASS**.
- Web build stamp: **d68ed104e9303f4a**, current.
- Fresh isolated Chrome with production `index.html` could not fetch external `https://cdnjs.cloudflare.com/.../three.min.js` and produced `ERR_CONNECTION_TIMED_OUT`; this is an external CDN delivery limitation in the verification environment, not a Pack46 exception.
- To separate CDN transport from bot/runtime correctness, verification temporarily mirrored the exact Three.js r128 CDN bytes locally without changing production `index.html`. With that mirror, HTTP boot smoke **PASS** with zero diagnostics, and direct percent-encoded `file://` menu/generated-asset parity **PASS** with zero diagnostics.
- Three.js neutral-light team proof on the mirrored-r128 runtime: **PASS** — sampled ally/enemy both reported `model46=true`, each retained **17 Pack46 parts**, runtime colors were `#2F97FF` / `#EF4052`, shell tints `#506476` / `#62565B`, and accent emissive `0.22` / `0.17`. The regenerated `zap-bot-runtime-visibility-proof-46.jpg` shows both teams front-on under the game's actual light objects on a neutral floor.
- Forward-axis runtime proof on both HTTP and percent-encoded direct `file://`: **PASS**, zero diagnostics. For an enemy at gameplay yaw `0`, body head/torso receive local yaw `π`; canonical rifle pose uses `z=+0.24`, yaw `π+0.02`; gameplay muzzle is `z=+0.96`, actual weapon muzzle `z≈+1.178`, and normalized weapon-forward dot gameplay `+Z` is `≈0.989`. `zap-bot-runtime-facing-proof-46.jpg` visually confirms the visor and held rifle face the target instead of the bot's back.
- Existing close enemy-rifle runtime evidence `zap-bot-runtime-proof-46.jpg` is retained as the geometry/rig close-up; it was not regenerated in this pass.

After any future Blender/builder/runtime change, rebuild through the canonical builder, run Khronos validation, focused/full tests, structure validation, HTTP + direct `file://` smokes and a real Pack46 runtime proof.

## 2026-10-07 — modular role silhouettes + mechanical runtime animation

Pack46 now contains **15 canonical Blender components**: the original 10 body modules plus `ZAP_Role_Assault`, `ZAP_Role_Sniper`, `ZAP_Role_Engineer`, `ZAP_Role_Anchor` and `ZAP_Role_Flanker`. Role meshes are low-poly presentation add-ons parented under the existing Blender torso mesh at runtime. They never enter `pts[]`, collision/raycast ownership, AI state, projectile math or minimap geometry.

Role selection adapts the existing AI contract instead of inventing a second role system: `assault` → Assault; `engineer` → Engineer; `anchor` → Anchor; `flankL/flankR` → shared Flanker. Any bot currently holding the `sniper` weapon uses the Sniper slim-chest + optics variant, so the requested sniper read follows real behavior without adding a sixth AI role.

`src/entities/bot-presentation.js::updateBotMechanicalPresentation()` now layers bounded head target yaw, smaller torso twist, aim raise/lower, asymmetric shoulder recoil, reload lowering/roll, cover/suppression crouch and landing compression over the existing gait. It runs after the base weapon pose and before `updateBotWeaponHands()`, so both real hands are re-solved onto final moved weapon grips every frame. Gameplay hit meshes keep their established ownership.

Current deterministic rebuild: **15 components / 40,712 triangles / 122,136 non-indexed runtime vertices / 81 material groups**. GLB: **2,111,808 bytes**. Browser-facing q16/Base64 runtime derivative: **1,958,998 bytes**. Runtime keeps the strict 2 MiB gate; the richer canonical GLB has a separate 2.25 MiB source budget.

Official references used in this pass: Blender 5.2 glTF exporter/animations https://docs.blender.org/manual/en/5.2/addons/import_export/scene_gltf2.html ; Blender transforms https://docs.blender.org/manual/en/5.2/scene_layout/object/properties/transforms.html ; Three.js Object3D https://threejs.org/docs/pages/Object3D.html ; Three.js Group https://threejs.org/docs/pages/Group.html

Verification: builder Python compile + Blender 5.2.2 LTS rebuild PASS; focused Pack46 model/presentation 16/16 PASS; full Node 348/348 PASS; structure PASS. `scripts/browser-bot-pack46-smoke.mjs` fresh-reload HTTP proof PASS on build `3cd43934926b6927` with all 15 components, all five role mappings, mechanical transform response, zero stale local scripts and zero diagnostics. Broader menu smoke was attempted separately but its Settings hit-test timed out and is not counted as a Pack46 pass.
