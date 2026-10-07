# Blender → ZAP ZONE asset pipeline

Этот документ — короткий operational owner для 3D-ассетов, которые создаются в Blender и затем попадают в браузерную игру. Он не заменяет specs конкретной подсистемы: gameplay ownership и rig invariants для ботов остаются в `docs/specs/BOT_PRESENTATION.md`.

## First-person rifle path — Pack50

Pack50 — **архивный, отключённый** first-person Blender experiment для player-held rifle. Production снова использует прежний procedural + Pack36 generated-art path:

```text
asset-staging/2026-10-07-fp-rifle-pack-50/build_fp_rifle_50.py
  ├─ zap-fp-rifle-50.blend
  ├─ zap-fp-rifle-preview-50.png
  ├─ manifest.json
  ├─ assets/weapons/models/zap-fp-rifle-50.glb
  └─ assets/weapons/models/zap-fp-rifle-50.runtime.js
       ↓
src/weapons/first-person-rifle-model3d.js
       ↓
src/weapons/system.js::buildGun(rifle)
       ↓
src/game/runtime.js presentation-state update
```

Five components deliberately preserve movable pivots: body, magazine, bolt, left support arm and right firing arm. Blender +Y remains weapon forward and uses the normal `(x,y,z) -> (x,z,-y)` bridge, so runtime muzzle/front is local -Z. Runtime q16 data stores each component local geometry plus explicit rest pivot.

**First-person quality gate is stricter than world assets.** Never approve a Blender studio render alone. Compare the actual WebGL viewport against the currently shipped first-person art for silhouette, occupied screen area, reticle clearance, hand continuity, optic scale and palette. Pack50's first bright/oversized tube-optic pass was rejected by this gate; the accepted pass was reduced in frame and moved back toward Pack36 graphite + blue + orange visual language. Keep before/after browser captures in pack staging when changing framing.

**Gameplay boundary:** Blender only consumes state. Ammo/cadence/damage/projectiles/reload duration/ADS policy/camera recoil remain existing owners. Internal bolt/mag/arms may animate, while `gunGrp` continues to own whole-viewmodel bob/sway/sprint/equip. For ADS, hip-only Pack50 offset must blend back toward the sight line; do not hard-code a permanent lowered model that makes the optic miss the crosshair.

**Production boundary:** Pack50 is not queried by the game. The previous procedural model + Pack36 generated-art path is authoritative again; a future Blender replacement must first prove visual parity or better in the real gameplay viewport.

Current Pack50 baseline: **10,836 triangles / 25 glTF draw calls**, Khronos glTF Validator 2.0.0-dev.3.10 **0/0/0/0**, HTTP + direct-`file://` dedicated browser smoke PASS with zero diagnostics. Detailed provenance and commands live in the Pack50 README.

## World weapon path — Pack49

Pack49 — production Blender presentation для шести огнестрельных world-моделей: pistol, shotgun, rifle, plasma, sniper и rocket launcher. Canonical route:

```text
asset-staging/2026-10-07-world-weapons-pack-49/build_world_weapons_49.py
  ├─ zap-world-weapons-49.blend
  ├─ zap-world-weapons-preview-49.png
  ├─ manifest.json
  ├─ assets/weapons/models/zap-world-weapons-49.glb
  └─ assets/weapons/models/zap-world-weapons-49.runtime.js
       ↓
src/weapons/world-weapon-model3d.js
       ↓
src/weapons/system.js::createWeaponModel()
       ├─ mode=bot   → existing bot weaponPivot + two-hand solver
       └─ mode=world → createWorldWeaponModel() → pickups
```

**First-person boundary:** Pack49 is queried only when `mode !== 'firstPerson'`. Existing `buildGun()`, generated FPS art, HUD anchors, reload art and first-person tuning stay untouched. If the Pack49 derivative is missing/incomplete, `createWeaponModel()` falls through to the previous procedural geometry.

Pack49 uses the same forward convention as the procedural bot weapons: authored along Blender +Y, bridge `(x,y,z) -> (x,z,-y)`, runtime visual front local -Z, while bot gameplay/fire-control remains +Z and existing `BOT_WEAPON_POSES` provides the presentation yaw correction. Long guns use per-component `qScale` so signed-Q16 delivery does not clip rifle/sniper length.

Pickups for these six keys stay real scene-depth Three.js geometry. They intentionally skip `attachDetailedPickupArt()`: that older presentation hook hides the 3D model after bitmap decode. Grounding, geometry batching, bob, respawn, ammo grants and spawn ownership remain unchanged. Equipment not owned by Pack49 keeps the old raster/procedural fallback.

Runtime resource rule: engine cleanup disposes child geometry/materials. `world-weapon-model3d.js` therefore caches only decoded canonical geometry and clones geometry/materials per live instance; never hand the disposable bot/pickup object the cache itself.

Current Blender 5.2.2 LTS build: **16,324 triangles / 48,972 runtime vertices / 40 material groups**, textureless GLB **848,928 bytes**, direct-`file://` derivative **786,524 bytes**. Final gate: owner tests + full Node suite **360/360 PASS**, structure PASS, Khronos glTF Validator 2.0.0-dev.3.10 **0/0/0/0**, HTTP + direct-`file://` Pack49 smokes PASS, build `735ed5a770ad242d`. Detailed rebuild/provenance/verification: `asset-staging/2026-10-07-world-weapons-pack-49/README.md`.

## 1. Current bot path

Текущий production route для Pack46:

```text
asset-staging/2026-10-06-bot-3d-pack-46/build_bot_3d.py
  ├─ zap-bot-modular-46.blend             editable source
  ├─ zap-bot-modular-preview-46.png       offline visual evidence
  ├─ manifest.json                        generated geometry/artifact identity
  ├─ assets/characters/models/zap-bot-modular-46.glb
  └─ assets/characters/models/zap-bot-modular-46.runtime.js
       ↓
src/entities/bot-model3d.js
       ↓ attaches presentation meshes to
src/entities/bot-presentation.js rig / gameplay nodes
       ↓
src/entities/bots.js
```

`GLB` — canonical portable glTF 2.0 artifact. `runtime.js` — generated derivative из тех же Blender meshes для direct `file://`, где нельзя строить основной runtime на XHR/fetch GLB. Generated JS нельзя править вручную.

### Current map path — Pack47

Текущий modular environment route:

```text
asset-staging/2026-10-07-map-sci-fi-kit-47/build_map_kit_47.py
  ├─ zap-map-sci-fi-kit-47.blend
  ├─ zap-map-sci-fi-kit-preview-47.png
  ├─ manifest.json
  ├─ assets/environment/models/zap-map-sci-fi-kit-47.glb
  └─ assets/environment/models/zap-map-sci-fi-kit-47.runtime.js
       ↓
src/environment/map-kit3d.js
       ↓ presentation children on
src/core/engine.js collision owners
```

Pack47 содержит стены 4/8/12 м, corner, column, door frame, barrier, container, ramp, ladder, grate, tech panel, vent, straight/elbow pipe, cable tray, fortification, base module и отдельное семейство укрытий: `KIT_Armor_Cover`, `KIT_SciFi_Sandbag`, `KIT_AntiTank_Block`, `KIT_Cargo_Crate`, `KIT_Reactor_Housing`. Для больших environment meshes Q16 stream нормализуется per-component `qScale`, затем runtime восстанавливает метры.

Критическая граница: `box() -> wallMeshes/wallAABBs/minimapStaticGeometry` остаётся gameplay source of truth. Blender mesh — только child presentation layer. После успешной установки overlay исходная box-surface скрывается через material write flags, но сам collision owner остаётся visible/raycastable object; `visible=false` для него запрещён. Это правило действует и для укрытий: armor/sandbag/anti-tank/cargo/reactor geometry не регистрируется в `wallMeshes`/`wallAABBs`, не создаёт новый LOS owner и не меняет форму старого collider без отдельного gameplay решения. Если визуалу нужен декоративный yaw, как у anti-tank blocks, поворачивается child mesh (`mapKit47PresentationYaw`), а не engine box — иначе `Box3.setFromObject()` мог бы незаметно изменить authoritative AABB. Для реального doorway применяется split-owner pattern: сплошная стена делится на два боковых `hazardWall` collision owners, а `KIT_Door_Frame`/низкий service `KIT_Ramp` добавляются presentation-only. Не добавляй collision-box lintel над дверью: текущий character `collideWalls()` работает в XZ и игнорирует высоту, поэтому такой lintel снова сделал бы проход невидимо непроходимым. Проверка обязана доказывать и свободный центр ворот, и блокирующие боковые секции.

Pack47 anti-shimmer contract: **никакого distance LOD/pop-in для зданий**. Если фасад мерцает на 50–100 м, сначала убирать источник high-frequency aliasing в canonical Blender geometry: millimetre-thin strips, tiny bolts/chevrons и crossing coplanar-ish braces заменять крупными статичными panels/rails. Все Pack47 presentation meshes продолжают `castShadow`, но имеют `receiveShadow=false`, чтобы 1024² directional shadow-map не создавал moving shadow acne на shallow bevels. Runtime `MAT_SHELL/MAT_EDGE` держатся матовыми (`roughness/metalness 0.62/0.24` и `0.52/0.34`) без HDR environment. Основная perspective camera использует `near=0.12`, `far=220`; не возвращать near к `0.05` без depth-precision regression, потому что дальние миллиметровые слои снова начинают конкурировать в depth buffer. Верифицированный desktop browser уже имеет MSAA `antialias=true`, поэтому дополнительный pop-in/LOD ради маскировки aliasing запрещён.

### Archived floor experiment — Pack48

**Pack48 сейчас не является runtime path.** После live walking review принято решение оставить исходный старый пол: `src/core/engine.js::arenaFloor` снова одновременно gameplay и visual floor. Pack48 `.blend`/GLB/runtime derivative сохранены для анализа, но удалены из bootstrap и не должны подключаться без отдельной новой visual-validation задачи.

Архивный Pack48 route:

```text
asset-staging/2026-10-07-floor-3d-pack-48/build_floor_kit_48.py
  ├─ zap-floor-modular-48.blend
  ├─ zap-floor-modular-preview-48.png
  ├─ manifest.json
  ├─ assets/environment/models/zap-floor-modular-48.glb
  └─ assets/environment/models/zap-floor-modular-48.runtime.js
       ↓
src/environment/floor-kit3d.js
       ↓ presentation-only InstancedMesh batches over
src/core/engine.js::arenaFloor
```

Pack48 intentionally does **not** replace ground physics. `arenaFloor` stays at Y=-0.04 and remains the exact owner used by `firstGroundHitDistance()`. Recesses, grates, hatch edges and guide strips are authored as shallow visual geometry around that plane; they must never be added to `wallMeshes/wallAABBs/losMeshes` or used as a second heightfield. Repeated 8 m tiles use one `THREE.InstancedMesh` per module type so geometry/material groups are reused across the arena instead of creating hundreds of independent meshes. Capture pads consume canonical `BOT_MAP_ZONES` after tactics loads, avoiding duplicated objective coordinates.

Floor-specific visual rule: keep height relief subtle enough that feet do not appear to climb invisible geometry. Use negative/recessed detail for depth, small bevels for readable highlights, and low raised rails only as decoration. The authoritative gameplay surface remains perfectly flat unless a separate gameplay task explicitly changes movement/collision.

Pack48 anti-shimmer contract has two layers. First, do not rasterize the authoritative 220×220 `arenaFloor` together with the Blender tiles. When Pack48 is active, its material keeps the gameplay object alive but sets `colorWrite=false` and `depthWrite=false`; a separate visual fallback plane is placed 0.18 m lower. Capture-zone art is decal-like geometry without a broad 12×12 base plate and uses `polygonOffset` + `depthWrite=false` over the ordinary tiles. Pack48 tiles/fallback do not receive the arena directional shadow map, so grazing-angle shadow acne cannot sweep across floor microgeometry.

Second, **high-frequency geometry must not survive into the distance**. Pack48 includes `FLOOR_Far_8m`: one Blender plane, **2 triangles**, one material group, no thickness/bevel/seams/bolts/grate bars. `src/environment/floor-kit3d.js::updateFloorKit48Lod()` rewrites bounded `InstancedMesh` batches only after the camera moves at least 2 m. Desktop hysteresis is **36 m enter / 44 m exit**; `MOBILE_LOW` is **28/36 m**. A tile keeps its current LOD inside that band, preventing boundary chatter. Capture overlays are culled beyond 52 m desktop / 40 m low-power. This is preferred over renderer-wide `logarithmicDepthBuffer` or permanent supersampling because the defect is local to subpixel floor detail and the LOD removes the source geometry itself.

Three.js references used for this implementation: `https://threejs.org/docs/pages/InstancedMesh.html` (bounded instancing, mutable `count`, `setMatrixAt()` + `instanceMatrix.needsUpdate`) and `https://threejs.org/docs/pages/LOD.html` (distance levels and hysteresis rationale).

### Collision-safe cover overlay pattern

Для укрытий действует более жёсткое правило: **сначала создаётся/сохраняется старый gameplay `box()` owner, потом на него навешивается Blender child** через `installMapKit47Presentation()`. Нельзя двигать, масштабировать или поворачивать gameplay owner только ради совпадения с красивой моделью. Если визуалу нужен другой yaw, сохраняй его как presentation metadata и вращай child; текущие anti-tank blocks именно так используют `mapKit47PresentationYaw`, оставляя исходный 1.4×0.9×1.4 collider неповернутым. Blender child никогда не добавляется в `wallMeshes`/`wallAABBs` и не становится LOS/projectile owner.

Visual envelope должна оставаться внутри или близко к уже существующему collider envelope. Существенно выступающая геометрия — это уже gameplay/collision change и требует отдельного решения и collision regression, а не скрытого расширения физики. Текущий cover mapping: arena Aegis → `KIT_Armor_Cover`, barrier → `KIT_SciFi_Sandbag`, cargo + supply crates → `KIT_Cargo_Crate`, прежние тройные кубы → `KIT_AntiTank_Block`, периферийные 3×5×3 owners → `KIT_Reactor_Housing`. Fallback остаётся прежней procedural/box presentation.

## 2. Ownership boundary

Blender mesh отвечает только за внешний объём. Он не владеет AI, collision, hit detection, locomotion, weapon data или combat timing.
Canonical component contract Pack46:

| Component | Runtime attachment |
|---|---|
| `ZAP_Head` | head gameplay node |
| `ZAP_Torso` | torso gameplay node |
| `ZAP_Pelvis` | pelvis gameplay node |
| `ZAP_Shoulder` | left/right upper-arm nodes |
| `ZAP_UpperArm` | left/right upper-arm nodes |
| `ZAP_Forearm` | left/right forearm nodes |
| `ZAP_Hand` | real IK hand nodes |
| `ZAP_Thigh` | left/right hip rig nodes |
| `ZAP_Shin` | left/right knee rig nodes |
| `ZAP_Foot` | left/right ankle rig nodes |

После зеркалирования получается 17 видимых частей. Старые `pts[]` остаются gameplay hit meshes и лишь скрываются визуально. Любое изменение component names, pivots или attach semantics считается контрактным изменением и требует обновления owner tests/spec, а не только Blender-файла.

## 3. Modeling rules

- Работать в метрах и держать каждый canonical component около локального origin своего rig pivot.
- Перед export компоненты должны иметь location=(0,0,0), rotation=(0,0,0), scale=(1,1,1); builder делает это детерминированно.
- Силуэт и крупные плоскости важнее микродеталей: helmet/shoulders/chest/forearms/knees/boots должны читаться на игровой дистанции.
- Строить **surface hierarchy**, а не просто наращивать мелкие детали: сначала крупная бронеплоскость, затем читаемая рамка/rail/keel, затем только локальные fasteners/vents. Для Pack46 этот pass дал visor top/bottom seals, helmet side blades/crown spine, chest center keel/ab rails, shoulder skirt, forearm back plate, knee/calf/ankle bridges и toe bumper/clamp. Если новая деталь не меняет силуэт, стык или световую иерархию на игровой дистанции — не добавлять её.
- Hard-surface края получают небольшую реальную фаску. Blender Bevel даёт контролируемую геометрию и лучше ловит свет, чем идеально острое ребро; после export всё равно проверять normals и итоговый GLB vertex count.
- Суставы не оставлять как большие пустые разрывы между armor shells: использовать тёмные механические sleeves/joints и небольшие bridge plates вокруг neck/hip/elbow/knee. Они должны закрывать только визуальный gap и не менять gameplay hit meshes/pivots.
- Для более реалистичной механики строить понятную причинную конструкцию: **armor shell → bearing/collar → actuator/piston → service latch/vent**. Bearing должен объяснять ось вращения, piston — связь между двумя объёмами; случайные выступы без функции не добавлять. Pack46 mechanical-realism pass использует это на shoulders/hips/wrists/knees и в arm/leg modules.
- Детали, которые должны пережить и GLB, и custom `runtime.js`, моделировать геометрией/material groups, а не рассчитывать на неподдержанный texture-only путь.
- Не добавлять декоративные элементы, которые визуально мешают weapon grip, reticle, team recognition или перекрывают соседний articulated segment.
- Одинаковый mesh используется ally/enemy; team identity задаётся материалами в runtime.
## 4. Coordinate and q16 contract

Builder переводит вершины из Blender в runtime так:

```text
Blender (x, y, z) → runtime (x, z, -y)
```

Это rotation-preserving axis bridge, но у Pack46 есть важный **semantic forward contract**: модель authored лицом по Blender +Y, после bridge её локальный front становится runtime -Z, тогда как bot gameplay/fire-control использует +Z как forward. Поэтому runtime attach в `src/entities/bot-model3d.js` делает presentation-only yaw `Math.PI` для body components, а `BOT_WEAPON_POSES` в `src/weapons/system.js` хранит такой же yaw correction для weapon meshes. Нельзя «исправлять» это поворотом gameplay `group.rotation` или сменой знака в `getBotMuzzlePos()`: это затронет AI, deployment, minimap, movement stability и projectile semantics. Hand component — особый случай: real hand quaternion уже наследует corrected weapon pivot, поэтому второй local `Math.PI` для Pack46 hand запрещён.

Position/normal streams для `runtime.js` квантуются в signed Q16. Поэтому component-local координаты обязаны находиться в `[-1, 1]`. Builder теперь делает fail-fast, если хотя бы одна координата выходит за диапазон; нельзя возвращать молчаливый clamp, потому что он геометрически ломает модель.

`manifest.json` сохраняет для каждого компонента triangle count, runtime vertex count, material-group count и максимальную абсолютную локальную координату. После изменения Blender geometry сравнивать manifest с предыдущим состоянием и объяснять крупный рост.

## 5. Materials and glTF

Текущий whitelist: `MAT_DARK`, `MAT_SHELL`, `MAT_EDGE`, `MAT_ACCENT`, `MAT_GLOW`, `MAT_VISOR`, `MAT_WARNING`, `MAT_RUBBER`. `MAT_WARNING` используется Pack47 для небольших orange hazard/service accents; это presentation material, не gameplay marker.

Blender source использует Principled BSDF metal/rough workflow. Это соответствует базовой PBR-модели glTF. Для metal/rough переносимыми каналами являются base color, metallic, roughness, AO, tangent-space normal и emissive; normal map при появлении textures должна идти через `Normal Map` в **Tangent Space**, а image node — `Non-Color`. Emissive применять только как акцент: много маленьких очень ярких точек ухудшает читаемость и делает hard-surface модель игрушечной. Для hard-surface shading сначала использовать реальную небольшую фаску и корректные normals; Weighted Normal/Smooth by Angle допустимы только после проверки exported corner normals и итогового vertex count.

Blender preview и Three.js runtime должны иметь одну визуальную иерархию материалов: `DARK < SHELL < EDGE` по светлоте, отдельный насыщенный team accent и контролируемый emissive. Team-color armor, который обязан читаться на дистанции, трактуется как окрашенная/покрытая поверхность, а не голый металл: сначала повышать насыщенность Base Color и площадь крупных цветных панелей, затем при необходимости добавлять только небольшой emissive lift.

Перед любым PBR tuning обязательно сначала читать **реальный lighting path игры**, а не подгонять материалы только под Blender studio preview. `MeshStandardMaterial` — metallic/roughness PBR, и Three.js прямо рекомендует environment map для лучших результатов. В текущем ZAP ZONE `scene.environment`/PMREM не используется: arena освещается directional + hemisphere + ambient lights. Поэтому слишком высокий metalness у shell/edge уменьшает diffuse response и в живой игре делает детали темнее, чем в Blender preview. Для Pack46 текущий runtime baseline сознательно умеренный: shell metalness `0.36`, edge `0.48`, accent `0.10`; roughness соответственно `0.34`, `0.30`, `0.34`. Team tint на нейтральном hardware: ally shell/edge `#506476` / `#8295A7`, enemy `#62565B` / `#8B7D82`. `MAT_ACCENT`: ally `#2F97FF`, enemy `#EF4052`, emissive intensity `0.22` / `0.17`. Большие цветные панели не должны становиться flat-neon: `accent emissive < visor emissive < small MAT_GLOW` остаётся обязательной иерархией (`0.22 < 1.30 < 1.65` ally; `0.17 < 0.84 < 1.12` enemy).

Практический порядок для дальнейшего Blender → game material pass: **inspect runtime lights/environment → calibrate base color/metalness/roughness → enlarge only distance-readable existing color surfaces → rebuild → neutral-light ally+enemy runtime proof**. Не компенсировать отсутствие environment map чрезмерным emissive: это убирает объём и превращает броню в UI-подсветку. Blender glTF exporter переносит metallic/roughness из Principled BSDF в glTF, но runtime appearance всё равно зависит от освещения движка; поэтому корректный export и красивый offline render не заменяют live proof.

Большой visor — это стеклянная/техническая поверхность внутри механического bezel, а не светящаяся белая панель: bezel/seals моделируются отдельной геометрией. Нельзя считать светлый studio-preview доказательством читаемости в игре: после material/team-color change обязательно делать neutral-light runtime proof для ally + enemy на средней/дальней дистанции, а не только close-up. Для Pack46 такой evidence хранится как `asset-staging/2026-10-06-bot-3d-pack-46/zap-bot-runtime-visibility-proof-46.jpg`. Красный enemy glow должен оставаться красным, а не выгорать в телесно-розовый/белый — для этого предпочтительнее контролировать emissive intensity и metalness/roughness цветной краски, а не затемнять всю модель.

Pack46 и Pack47 сейчас не используют textures. Поэтому оба GLB export явно отключают UV/TEXCOORD, что уменьшает artifact и устраняет validator infos про unused UV attributes. Для Pack47 этот gate убрал 99 `UNUSED_OBJECT` infos и текущий GLB проходит Khronos glTF Validator `2.0.0-dev.3.10` с **0 errors / 0 warnings / 0 infos / 0 hints**. Если позже появятся textures, это решение нужно пересмотреть вместе с runtime derivative: нельзя добавить texture в GLB и забыть, что `file://` path её сейчас не переносит.

GLB выбран как single-file delivery artifact. Blender exporter применяет modifiers и экспортирует +Y-up glTF. Не включать Draco/Meshopt только ради меньшего файла: production игра сейчас читает generated `runtime.js`, а не GLB через GLTFLoader. Compression имеет смысл только после измеренного изменения loading path и проверки HTTP + `file://`.

## 6. Rebuild

```powershell
& "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --python "G:\МОЯ Веб-разработка\ZAP_ZONE\asset-staging\2026-10-06-bot-3d-pack-46\build_bot_3d.py"
```
Rebuild обязан обновлять `.blend`, preview, GLB, runtime derivative и manifest одним builder-ом. Если какой-либо runtime artifact правился вручную — изменение считается недетерминированным и должно быть переделано через builder.

## 7. Validation ladder

После каждого geometry/export/runtime change:

1. `python -m py_compile asset-staging/.../build_bot_3d.py`.
2. Headless Blender rebuild; non-zero exit — стоп.
3. Открыть preview конкретного pack: для Pack46 проверить silhouette/intersections/visor/armor hierarchy/feet; для Pack47 — стены, gates и каждый cover archetype, особенно чтобы Blender volume не обещал gameplay footprint, которого нет у старого collider.
4. Прогнать Khronos glTF Validator по GLB. Target: 0 errors, 0 warnings, 0 infos, 0 hints. Для textureless packs лишние `TEXCOORD_0` не оставлять.
5. Прогнать focused owner tests pack-а. Pack46: `node --test scripts/bot-model3d-owner.test.mjs scripts/bot-presentation-owner.test.mjs`; Pack47: `node --test scripts/map-kit47-owner.test.mjs scripts/engine-wall-geometry-owner.test.mjs`. Generated-manifest test должен сверять artifact bytes/SHA-256, а Pack47 collision oracle — дополнительно доказывать, что presentation meshes не попали в authoritative wall arrays.
6. `node scripts/stamp-web-build.mjs --check`; если stale — запустить штатный `node scripts/stamp-web-build.mjs`, затем повторить `--check`.
7. `node scripts/validate-structure.mjs`.
8. Полный `node --test scripts/*.test.mjs`.
9. HTTP browser boot smoke.
10. Реальный `file://` browser smoke, потому что это отдельный supported loading path.
11. В live scene проверить ally/enemy, оружие, обе руки, ходьбу/ноги, несколько дистанций камеры и отсутствие page errors.

Source/unit tests не доказывают качество silhouette, z-fighting, clipping или performance в живом WebGL. Blender preview не доказывает правильную привязку к игровому rig.

## 8. Performance review

Pack46 caches one `BufferGeometry` per component и две material sets (ally/enemy), поэтому geometry не дублируется в JS memory для каждого бота. Но каждый видимый segment/material group всё равно участвует в rendering.

При quality pass смотреть минимум на:
- GLB bytes и runtime.js bytes;
- total triangles/vertices из validator/manifest;
- material groups/draw calls;
- количество живых ботов;
- desktop и coarse-touch fallback;
- frame pacing в реальном бою, а не только статический preview.

Если детализация заметна только в Blender крупным планом, но сильно увеличивает triangle count, её лучше убрать или заменить более крупной формой.

Текущий Pack47 anti-shimmer baseline: **23 components**, **31,796 triangles**, **62,706 GLB vertices**, **86 draw calls/material primitives**, 7 materials, textures отсутствуют. Runtime derivative содержит **95,388 non-indexed vertices** суммарно по canonical component meshes. `KIT_Base_Module` = **108 triangles / 324 runtime vertices / 1 group**; `KIT_Wall_12m` = **540 triangles**. Khronos glTF Validator `2.0.0-dev.3.10`: **0 errors / 0 warnings / 0 infos / 0 hints**. В live arena сейчас **147 presentation pieces** поверх **139 presentation collision owners**, authoritative `wallMeshes/wallAABBs` остаются **163/163**; все 147 Pack47 pieces `receiveShadow=false`, presentation objects в gameplay arrays отсутствуют. HTTP и direct-`file://` smoke подтверждают build `f5953b7c9d6a4ab3`, `camera.near=0.12`, `camera.far=220`, active MSAA, отсутствие stale scripts и ноль base secondary attachments.

Текущий Pack46 после lighting-aware visibility pass для ориентира: **40,224 GLB triangles, 75,100 GLB vertices, 60 GLB draw calls**; runtime после зеркалирования даёт **178,008 non-indexed component vertices** на одного бота. По сравнению с предыдущим mechanical-realism baseline (**40,288 / 75,232 / 178,392**) draw-call count не вырос, а итоговая tessellation даже слегка уменьшилась после изменения размеров существующих bevelled accent-вставок. Это подтверждает правило: для дальнего team read сначала менять крупную форму/площадь уже существующего material group и PBR response, а не добавлять новые мелкие детали или material slots.

В Three.js один `BufferGeometry.groups` рендерится отдельным draw call, поэтому новый material group — не бесплатная детализация. Mechanical-realism и high-visibility passes специально **не вводят новый material slot**: hardware reuse-ит существующий metallic `MAT_EDGE`, а заметность команды повышается параметрами/площадью существующего `MAT_ACCENT`. Сначала улучшать силуэт, стыки и читаемость внутри существующих материалов; после каждого pass сверять validator `drawCallCount` и реальный `renderer.info` в браузере.

## 9. External references and rights

Интернет использовать активно для техники, topology/PBR/glTF документации и визуальных референсов. Стороннюю 3D-модель, texture/material pack или kitbash нельзя просто скачать и положить в проект.

Перед использованием внешнего asset зафиксировать: точный asset, source, license/terms, commercial use, modification, attribution, redistribution/client handoff и ограничения. `Free download` не означает свободное коммерческое использование. Если права не подтверждены, использовать источник только как визуальный reference и строить собственную geometry.

## 10. Failure modes

- **В игре старый bot:** проверить `index.html` load order/build key и наличие `window.ZAP_BOT_MODEL_46`; не копировать GLB вручную вместо rebuild.
- **Часть модели пропала:** проверить полный component contract; missing component специально приводит к procedural fallback.
- **Меш сплющен/обрезан:** смотреть `maxAbsLocalCoordinate` в manifest и q16 range; builder должен падать до export.
- **Неправильная ориентация:** не чинить случайным rotation в runtime; проверить Blender→runtime coordinate bridge и pivot.
- **Белые/неоновые точки везде:** снизить emissive, использовать `MAT_EDGE` для механического крепежа.
- **GLB validator показывает unused UV:** Pack46/Pack47 без textures должны экспортироваться с `export_texcoords=False`; не оставлять `TEXCOORD_0`, который runtime не использует.
- **Preview хороший, игра плохая:** сначала сравнить runtime palette/exposure и убедиться, что active bot действительно `model46=true`; затем проверять attach scale/pivot/pose/IK в `bot-model3d.js` и `bot-presentation.js`. Не переделывать mesh вслепую по одному studio-preview.
- **Pack47 фасад мерцает при ходьбе:** не вводить moving LOD. Проверить: свежий build/no-cache reload; `receiveShadow=false` на presentation pieces; `camera.near=0.12`; отсутствие millimetre-thin/copanar-ish strips в wall/base builder; shell/edge roughness/metalness baseline. Если это всё соблюдено, дальше упрощать только статичную Blender geometry на проблемном компоненте.
- **Игра хорошая по HTTP, плохая через file:** отдельно проверять generated `runtime.js`, classic-script load order и browser cache/build key. Для автоматического Windows smoke на пути с кириллицей строить настоящий percent-encoded `file:///...` URI (например через `.NET System.Uri.AbsoluteUri`), а не передавать raw path строкой: неправильный launcher URI может дать ложный boot timeout до исполнения Pack46.

## 11. Authoritative references

Source checkpoint **2026-10-07**: Blender 5.2 exporter docs подтверждают прямой перенос Principled BSDF metallic/roughness в glTF; Three.js `MeshStandardMaterial` docs отдельно рекомендуют environment map для лучших PBR results; Khronos Validator `2.0.0-dev.3.10` использован для текущего GLB. Эти источники объясняют material-transfer semantics, но текущие `engine.js`, generated manifest и live runtime proof остаются приоритетнее общих рекомендаций.

- Blender 5.2 glTF exporter manual: https://docs.blender.org/manual/ru/5.2/addons/scene_gltf2.html
- Blender 5.2 Apply transforms: https://docs.blender.org/manual/en/latest/scene_layout/object/editing/apply.html
- Blender 5.2 mesh normals: https://docs.blender.org/manual/en/latest/modeling/meshes/editing/mesh/normals.html
- Blender 5.2 Bevel manual: https://docs.blender.org/manual/en/5.2/modeling/modifiers/generate/bevel.html
- Blender 5.2 Weighted Normal manual: https://docs.blender.org/manual/en/5.2/modeling/modifiers/normals/weighted_normal.html
- Blender 5.2 Smooth by Angle: https://docs.blender.org/manual/en/5.2/modeling/modifiers/normals/smooth_by_angle.html
- Khronos Realtime Asset Creation Guidelines: https://github.com/KhronosGroup/3DC-Asset-Creation/blob/main/asset-creation-guidelines/RealtimeAssetCreationGuidelines.md
- Khronos glTF 2.0 specification: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html
- Khronos glTF Validator: https://github.com/KhronosGroup/glTF-Validator
- Three.js GLTFLoader: https://threejs.org/docs/#examples/en/loaders/GLTFLoader
- Three.js MeshStandardMaterial (metal/rough PBR; environment map recommended for best results): https://threejs.org/docs/pages/MeshStandardMaterial.html
- Three.js MeshPhysicalMaterial (clearcoat and advanced PBR): https://threejs.org/docs/pages/MeshPhysicalMaterial.html
- Three.js color management: https://threejs.org/manual/pages/color-management.html
- Three.js BufferGeometry / groups: https://threejs.org/docs/pages/BufferGeometry.html
- Three.js resource disposal: https://threejs.org/manual/en/how-to-dispose-of-objects.html

Use official docs as technical reference; current project code/manifest/runtime evidence remains the source of truth for ZAP ZONE.

## Pack46 role modules and procedural mechanical animation — 2026-10-07

### Role-module authoring contract
Author role parts around the same torso-local origin as `ZAP_Torso`, keep local coordinates inside the q16 range `[-1,+1]`, reuse existing Pack46 materials and keep them presentation-only. Canonical outputs are `ZAP_Role_Assault`, `ZAP_Role_Sniper`, `ZAP_Role_Engineer`, `ZAP_Role_Anchor`, `ZAP_Role_Flanker`.

The runtime attaches exactly one role module as a child of the visible Blender torso mesh. This intentionally inherits torso twist/crouch/landing transforms while staying outside `pts[]`. Never add a role mesh to hit detection, `wallMeshes`, `wallAABBs`, LOS, projectile collision or gameplay scale logic.

The AI role contract stays `assault / flankL / flankR / anchor / engineer`. Both flank directions share Flanker. Sniper is a presentation override selected from current weapon key `sniper`; this connects appearance to existing weapon behavior without widening tactical state ownership.

### Mechanical animation contract
Keep gameplay/locomotion state authoritative in `bots.js`, visual transform composition in `bot-presentation.js`, and generated geometry/role switching in `bot-model3d.js`. Required order: `base gait + weapon pose → updateBotMechanicalPresentation() → updateBotWeaponHands()`. This lets reload/aim/recoil move the presentation weapon first and then re-pins both hands to the final grips.

Current layers: clamped head target yaw; smaller torso twist with pelvis counter-twist; asymmetric shoulder kick from existing `fireBurstRecoil`; aim raise/lower; reload lower/roll; cover/reload/suppression visual crouch; short decaying landing compression. All offsets are presentation-only.

Blender/glTF supports object-transform animations as well as bone animation, so authored clips remain possible later. For the current AI-reactive micro-animation, do not add an Armature merely to duplicate live state already available deterministically at runtime.

### Verification and budgets
Gate: Python compile → Blender 5.2.2 LTS rebuild → manifest/hash owner → bot model owner → bot presentation owner → structure validation → full Node suite → browser smoke. `zap-bot-modular-46.runtime.js` remains capped at 2 MiB. Canonical GLB, now carrying five additional modular source components, is capped separately at 2.25 MiB. Reduce geometry before revising either budget.

Current rebuild: 15 components, 40,712 triangles, 122,136 non-indexed runtime vertices; GLB 2,111,808 bytes; runtime derivative 1,958,998 bytes.

References: Blender glTF 2.0 https://docs.blender.org/manual/en/5.2/addons/import_export/scene_gltf2.html ; Blender transforms https://docs.blender.org/manual/en/5.2/scene_layout/object/properties/transforms.html ; Three.js Object3D https://threejs.org/docs/pages/Object3D.html ; Three.js Group https://threejs.org/docs/pages/Group.html
