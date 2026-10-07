# Pack47 — modular sci-fi map kit

Pack47 — единый Blender hard-surface kit для визуального слоя карты ZAP ZONE. Его задача — резко улучшить читаемость и качество окружения, не переносить gameplay-физику в Blender.

## Ownership

Source of truth для столкновений, LOS, projectile wall raycasts и minimap geometry остаётся в `src/core/engine.js`:

```text
box() -> wallMeshes / wallAABBs / minimapStaticGeometry
                 |
                 +-- gameplay / raycast / collision owner
                 |
                 +-- child Blender mesh from Pack47
                     presentation only
```

`src/environment/map-kit3d.js` декодирует generated runtime geometry и прикрепляет её дочерним mesh к существующим collision owners. Когда overlay успешно установлен, поверхность старого box становится невидимой через `material.colorWrite=false` / `depthWrite=false`; сам Mesh остаётся активным для raycast/collision. Нельзя заменять это на `owner.visible=false`.

Если Pack47 отсутствует или не декодируется, текущие procedural/box surfaces остаются fallback.

## Components

- `KIT_Wall_4m`, `KIT_Wall_8m`, `KIT_Wall_12m`
- `KIT_Corner_90`
- `KIT_Column`
- `KIT_Door_Frame`
- `KIT_Barrier`
- `KIT_Container`
- `KIT_Armor_Cover`, `KIT_SciFi_Sandbag`
- `KIT_AntiTank_Block`, `KIT_Cargo_Crate`, `KIT_Reactor_Housing`
- `KIT_Ramp`, `KIT_Ladder`
- `KIT_Grate`
- `KIT_Tech_Panel`, `KIT_Vent`
- `KIT_Pipe_Straight`, `KIT_Pipe_Elbow`
- `KIT_Cable_Tray`
- `KIT_Fortification`
- `KIT_Base_Module`

Дверной проём и ramp входят в kit и используются в четырёх центральных воротах. Для каждого такого прохода сплошной wall collision заменён двумя боковыми authoritative `hazardWall` owners с 3.8 м gap; `KIT_Door_Frame` и низкий service `KIT_Ramp` остаются presentation-only. Не добавляй gameplay lintel box над дверью: character collision проверяет XZ без вертикального допуска и такой box снова закроет проход.

Cover pass добавляет пять специализированных Blender-shells поверх уже существующей gameplay topology: aegis → `KIT_Armor_Cover`, barrier → `KIT_SciFi_Sandbag`, supply/cargo boxes → `KIT_Cargo_Crate`, периферийные высокие owners → `KIT_Reactor_Housing`, бывшие тройные cube clusters → `KIT_AntiTank_Block`. Последние получают случайный visual yaw через `owner.userData.mapKit47PresentationYaw`; сам `box(1.4,.9,1.4)` не вращается, чтобы случайная декоративная ориентация не меняла authoritative `Box3`/AABB.

Cover family тоже строго presentation-only. `createArenaCover()` сохраняет старые box owners, но Aegis получает `KIT_Armor_Cover`, barrier — `KIT_SciFi_Sandbag`, cargo — `KIT_Cargo_Crate`; `createSupplyCrate()` использует тот же dedicated cargo-crate visual. Восемь прежних групп из трёх голых кубов теперь получают `KIT_AntiTank_Block`, а восемь 3×5×3 периферийных owners — `KIT_Reactor_Housing`. Случайный yaw anti-tank записывается только в `mapKit47PresentationYaw` и применяется к Blender child; gameplay collider специально остаётся неповернутым.

## Artifacts

```text
build_map_kit_47.py
  -> zap-map-sci-fi-kit-47.blend
  -> zap-map-sci-fi-kit-preview-47.png
  -> manifest.json
  -> assets/environment/models/zap-map-sci-fi-kit-47.glb
  -> assets/environment/models/zap-map-sci-fi-kit-47.runtime.js
       -> src/environment/map-kit3d.js
       -> src/core/engine.js composition
```

GLB — переносимый glTF 2.0 artifact. Generated `runtime.js` нужен текущему direct `file://` startup и не редактируется вручную.

## Coordinate/runtime contract

Blender authoring использует метры. Runtime bridge:

```text
Blender (x, y, z) -> Three.js runtime (x, z, -y)
```

В отличие от небольших bot components, крупные map pieces не помещаются в `[-1,1]`. Поэтому Pack47 хранит позиции как signed Q16, нормализованные на per-component `qScale`; runtime восстанавливает meters как `q16 / 32767 * qScale`.

Material whitelist: `MAT_DARK`, `MAT_SHELL`, `MAT_EDGE`, `MAT_ACCENT`, `MAT_GLOW`, `MAT_WARNING`, `MAT_RUBBER`. `MAT_WARNING` — небольшой orange hazard/service accent, не gameplay marker. После live anti-shimmer review broad shell/edge materials намеренно стали более матовыми и менее металлическими (`SHELL roughness/metalness 0.62/0.24`, `EDGE 0.52/0.34`), чтобы тонкие hard-surface блики не «ползли» по пикселям при движении камеры. Все Pack47 presentation meshes продолжают `castShadow`, но используют `receiveShadow=false`: они сохраняют тени на мире, но не получают coarse 1024² directional shadow-map на собственные мелкие bevel/rib surfaces. Pack47 textureless; GLB экспортирует `export_texcoords=False`, чтобы не хранить неиспользуемые `TEXCOORD_0`.

## Rebuild

```powershell
python -m py_compile asset-staging/2026-10-07-map-sci-fi-kit-47/build_map_kit_47.py
& "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --python "G:\МОЯ Веб-разработка\ZAP_ZONE\asset-staging\2026-10-07-map-sci-fi-kit-47\build_map_kit_47.py"
```

Successful Pack47 build currently records Blender `5.2.2 LTS` in `manifest.json`.

## Verification

Minimum focused gate:

```powershell
node --check src/environment/map-kit3d.js
node --check src/core/engine.js
node --test scripts/map-kit47-owner.test.mjs scripts/engine-wall-geometry-owner.test.mjs
```

Then follow the project-wide ladder: build stamp check/update, structure validation, full Node tests, HTTP browser smoke, direct `file://` smoke, and live visual review. The preview proves Blender geometry only; it does not prove collision parity or browser rendering.

Current anti-shimmer evidence: Blender 5.2.2 LTS deterministic rebuild PASS; focused Pack47 + wall geometry **12/12 PASS**; full Node suite **355/355 PASS**; structure validation PASS; build stamp **`f5953b7c9d6a4ab3`** current. Khronos glTF Validator `2.0.0-dev.3.10` = **0 errors / 0 warnings / 0 infos / 0 hints**, **31,796 triangles / 62,706 GLB vertices / 86 draw calls**, 7 materials, no textures. Runtime derivative contains **95,388 non-indexed vertices**. `KIT_Base_Module` is intentionally **108 triangles / 324 runtime vertices / 1 material group**; no secondary base attachments are installed. The browser oracle forces a no-cache reload and proves all **147** live Pack47 presentation pieces use the anti-shimmer policy, **0/147 receive shadows**, desktop MSAA is active, camera depth range is `near=0.12 / far=220`, stale scripts are absent, and gameplay `wallMeshes/wallAABBs = 163/163`. HTTP and direct `file://` smokes both PASS with zero diagnostics.

## Current integration

Pack47 is used for hazard/perimeter walls, large base blocks and annexes, central columns, dedicated armor/sandbag/cargo cover variants, supply cargo crates, anti-tank block rows and reactor housings. The four central walls use split collision topology with real 3.8 m gates, presentation-only door frames and low service ramps. Large base/annex owners now receive only the monolithic `KIT_Base_Module`; no secondary facade or corner/pipe/ladder attachments are installed. Trees, terminals and gameplay-special geometry keep their previous presentation unless deliberately migrated.

The collision owner must remain the original engine box. New Blender children must never be pushed into `wallAABBs` or become authoritative LOS geometry.
