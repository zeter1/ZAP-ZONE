# Pack49 — Blender world weapons

Pack49 заменяет процедурный world/bot presentation для шести огнестрельных типов собственными low/mid-poly Blender-моделями: `pistol`, `shotgun`, `rifle`, `plasma`, `sniper`, `rocket`.

## Ownership

Этот pack **не владеет first-person art**. `src/weapons/system.js::buildGun()` по-прежнему вызывает старый `createWeaponModel(..., {mode:'firstPerson'})` и затем существующие generated FPS layers. Pack49 подключается только когда `mode !== 'firstPerson'`.

Runtime route:

```text
build_world_weapons_49.py
  ├─ zap-world-weapons-49.blend
  ├─ zap-world-weapons-preview-49.png
  ├─ manifest.json
  ├─ assets/weapons/models/zap-world-weapons-49.glb
  └─ assets/weapons/models/zap-world-weapons-49.runtime.js
       ↓
src/weapons/world-weapon-model3d.js
       ↓
src/weapons/system.js::createWeaponModel()
       ├─ mode=bot   → bot weaponPivot / existing two-hand solver
       └─ mode=world → createWorldWeaponModel() → pickups
```

Если Pack49 отсутствует или неполон, `createWeaponModel()` продолжает старую procedural branch. Это intentional fallback, а не второй gameplay owner.

## Components

| Weapon | Blender component | Runtime muzzle convention |
|---|---|---:|
| Pistol | `ZAP_WPN_Pistol` | -0.72 |
| Shotgun | `ZAP_WPN_Shotgun` | -1.13 |
| Rifle | `ZAP_WPN_Rifle` | -1.38 |
| Plasma | `ZAP_WPN_Plasma` | -1.15 |
| Sniper | `ZAP_WPN_Sniper` | -1.76 |
| Rocket launcher | `ZAP_WPN_Rocket` | -1.02 |

Модели authored вдоль Blender +Y. Generated runtime bridge остается общим для проекта: `Blender (x,y,z) -> runtime (x,z,-y)`; поэтому muzzle/front оказывается в runtime local -Z и совместим с существующим `BOT_WEAPON_POSES` yaw≈π. Не менять gameplay forward (+Z), fire-control или muzzle math ради presentation.

Длинные модели используют per-component `qScale`, поэтому sniper/rifle не обрезаются диапазоном signed Q16.

## Pickup contract

Pack49 pickups — настоящая Three.js geometry с scene depth. Для этих шести ключей `src/entities/pickups.js` **не вызывает** старый `attachDetailedPickupArt()`, потому что тот после decode скрывает 3D model и заменяет его DOM/raster card. Остальные equipment/medkit сохраняют прежний fallback path.

`groundPickupModel()` и существующий bob/rotation/respawn lifecycle не менялись. Gameplay pickup radius, grant/reserve logic и spawn ownership не менялись.

## Modeling/material rules

- silhouette-first hard-surface: крупный receiver/stock/barrel/optic/coil/tube важнее micro-fasteners;
- реальные bevels дают читаемые highlights, но мелкий bevel не должен раздувать topology;
- textureless material groups: `MAT_DARK/SHELL/EDGE/ACCENT/GLOW/GLASS/RUBBER/WARNING`;
- metalness умеренный, потому что текущий runtime не имеет `scene.environment`/HDR IBL;
- emissive — только акцент, не замена освещению;
- никаких сторонних meshes/textures: вся Pack49 geometry строится builder-ом из Blender primitives.

Current deterministic Blender 5.2.2 LTS build: **16,324 triangles / 48,972 runtime vertices / 40 material groups**, GLB **848,928 bytes**, direct-`file://` derivative **786,524 bytes**, textures отсутствуют.

## Rebuild

```powershell
python -m py_compile "G:\МОЯ Веб-разработка\ZAP_ZONE\asset-staging\2026-10-07-world-weapons-pack-49\build_world_weapons_49.py"
& "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --python "G:\МОЯ Веб-разработка\ZAP_ZONE\asset-staging\2026-10-07-world-weapons-pack-49\build_world_weapons_49.py"
```

Builder обязан обновлять `.blend`, preview, GLB, runtime derivative и SHA-256 manifest вместе. Generated `runtime.js` вручную не редактировать.

## Runtime resource lifecycle

`src/core/engine.js::clearGroupChildren()/destroySceneObject()` dispose-ят instance geometry/material. Поэтому `world-weapon-model3d.js` кэширует **decoded canonical geometry**, но для каждого bot/world instance делает `geometry.clone()` и clone материалов. Это предотвращает повреждение cache после weapon switch или удаления pickup.

## Verification

Required ladder:
1. Python compile.
2. Headless Blender 5.2.2 rebuild.
3. Visual preview review.
4. Khronos glTF Validator — target 0 errors/warnings/infos/hints.
5. `node --check src/weapons/world-weapon-model3d.js`.
6. `node --test scripts/world-weapon-pack49-owner.test.mjs scripts/pickup-presentation-owner.test.mjs scripts/bot-presentation-owner.test.mjs`.
7. build stamp + structure validation + full Node suite.
8. fresh HTTP browser smoke and direct `file://` smoke.
9. Live proof: Pack49 available; bot weapon points with existing +Z gameplay convention; six pickups stay scene-depth 3D; no new browser diagnostics.

Last verified 2026-10-07: Python compile PASS; Blender 5.2.2 LTS rebuild PASS; final preview reviewed; Pack49 owner 5/5 PASS; full Node suite **360/360 PASS**; structure PASS; build stamp **`735ed5a770ad242d`** current; official Khronos glTF Validator 2.0.0-dev.3.10 = **0 errors / 0 warnings / 0 infos / 0 hints**; fresh HTTP + direct `file://` Pack49 browser smokes PASS with all six pickup and bot variants, first-person exclusion, current cache keys and zero diagnostics. Browser bounds also regression-test the local -Z long axis; this caught the pre-delivery rocket join-transform bug and proves the fix.

## Technical references

Used as technical guidance only; no third-party art was imported:
- Blender 5.2 glTF 2.0 exporter: https://docs.blender.org/manual/en/5.2/addons/import_export/scene_gltf2.html
- Blender Bevel modifier: https://docs.blender.org/manual/en/5.2/modeling/modifiers/generate/bevel.html
- Blender mesh normals: https://docs.blender.org/manual/en/5.2/modeling/meshes/editing/mesh/normals.html
- Khronos Realtime Asset Creation Guidelines: https://github.com/KhronosGroup/3DC-Asset-Creation/blob/main/asset-creation-guidelines/RealtimeAssetCreationGuidelines.md
- glTF 2.0 specification: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html
- Three.js BufferGeometry: https://threejs.org/docs/pages/BufferGeometry.html
- Three.js MeshStandardMaterial: https://threejs.org/docs/pages/MeshStandardMaterial.html

Current project code/manifest/browser evidence always has priority over generic reference guidance.
