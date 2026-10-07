# Assets — runtime contracts and generated packs

Для **Blender/GLB/3D asset authoring, экспортов, transform/shading правил, direct `file://` derivative и verification ladder** сначала читать [`docs/BLENDER_ASSET_PIPELINE.md`](BLENDER_ASSET_PIPELINE.md). Этот файл остаётся canonical каталогом **интегрированных runtime asset contracts**: consumer, fallback, budgets, lifecycle и pack-specific behavior.

Правило документации: reusable Blender workflow не дублировать внутри каждого pack; pack README хранит provenance/hashes/evidence, `BLENDER_ASSET_PIPELINE.md` — общий процесс, а `ASSETS.md` — интегрированный runtime contract.

## Blender first-person rifle — Pack50

**Статус:** ARCHIVED / DISABLED. По запросу пользователя production first-person rifle возвращён к предыдущему procedural + Pack36 generated-art пути. Pack50 сохраняется только как Blender-эксперимент в `asset-staging/2026-10-07-fp-rifle-pack-50/` и не загружается из `index.html`.

Pack50 больше не участвует в production runtime: `index.html` не загружает его derivative/module, `buildGun()` его не вызывает, а `src/game/runtime.js` не обновляет его pivots. Активный first-person rifle снова использует прежнюю procedural geometry + Pack36 generated-art, включая старые руки, reload/effects anchors и уже настроенное положение в кадре.

Архив Pack50 сохранён только как материал для будущих экспериментов; повторное включение требует отдельного visual/runtime quality gate против текущего Pack36.

Staging сохраняет оба browser capture как evidence причины отката: `browser-fp-rifle50-http.png` показывает неудачный Blender-вариант, а `browser-fp-rifle36-reference.png` — снова активный детализированный Pack36.

После rollback: archive + rifle focused tests **15/15 PASS**, полный Node suite **362/362 PASS**, structure validation PASS, build stamp **`58a45d161e139dde`**. Pack50 artifacts остаются воспроизводимыми по `manifest.json`, но shipping runtime их не грузит.

## Blender world weapons — Pack49

**Статус:** production presentation для `pistol / shotgun / rifle / plasma / sniper / rocket`. Editable/build source: `asset-staging/2026-10-07-world-weapons-pack-49/`; portable artifact: `assets/weapons/models/zap-world-weapons-49.glb`; direct-`file://` derivative: `zap-world-weapons-49.runtime.js`; runtime decoder/constructor: `src/weapons/world-weapon-model3d.js`.

Pack49 заменяет только `bot` и `world` branches существующего `src/weapons/system.js::createWeaponModel()`. **First-person art не меняется:** `mode:'firstPerson'` всегда проходит старым FPS path с уже настроенными generated-art layers/HUD anchors. Missing/incomplete Pack49 автоматически оставляет прежнюю procedural geometry.

World pickups этих шести типов теперь остаются настоящей 3D geometry и не скрываются старым DOM/raster pickup presentation. `src/entities/pickups.js` определяет Pack49 до `groundPickupModel()` и не вызывает для него `attachDetailedPickupArt()`; при этом grounding, bob, spawn/respawn и gameplay grant logic сохраняются.

Canonical components: `ZAP_WPN_Pistol`, `ZAP_WPN_Shotgun`, `ZAP_WPN_Rifle`, `ZAP_WPN_Plasma`, `ZAP_WPN_Sniper`, `ZAP_WPN_Rocket`. Coordinate bridge общий: Blender +Y front → runtime local -Z; bot gameplay forward остаётся +Z и использует существующую pose yaw correction. Long-gun streams имеют per-component `qScale`.

Current generated budget: **16,324 triangles / 48,972 runtime vertices / 40 material groups**, GLB **848,928 bytes**, runtime JS **786,524 bytes**, textures отсутствуют. Instance geometry/materials клонируются из decoded cache, потому что engine cleanup освобождает resources при bot weapon switch и удалении world objects. Focused owners: `scripts/world-weapon-pack49-owner.test.mjs` + `scripts/browser-world-weapons49-smoke.mjs`. Final 2026-10-07 evidence: full Node **360/360 PASS**, structure PASS, Khronos glTF Validator **0/0/0/0**, fresh HTTP + direct `file://` Pack49 smoke PASS, build `735ed5a770ad242d`, zero browser diagnostics. Rebuild/evidence and official Blender/Khronos references: Pack49 README + `docs/BLENDER_ASSET_PIPELINE.md`.

## Модульный Blender-пол — Pack48 — архив, не production

**Статус:** отключён от runtime 2026-10-07 после live-проверок. Production снова использует исходный `src/core/engine.js::arenaFloor` без Blender floor overlay. Причина отката: даже после depth/shadow fixes и distance LOD оставались заметные shimmer/moire на движении, а LOD создавал визуально плохое «дорисовывание» пола. Файлы Pack48 сохранены только как Blender/GLB эксперимент и материал для будущей переработки; `index.html` их не загружает.

Pack48 — архивный presentation layer для поверхности арены. Canonical source/build: `asset-staging/2026-10-07-floor-3d-pack-48/`; portable artifact: `assets/environment/models/zap-floor-modular-48.glb`; direct-`file://` derivative: `zap-floor-modular-48.runtime.js`; runtime owner: `src/environment/floor-kit3d.js`.

Набор содержит семь canonical modules: пять детальных 8-метровых вариантов `FLOOR_Panel_8m`, `FLOOR_Trench_8m`, `FLOOR_Grate_8m`, `FLOOR_Hatch_8m`, `FLOOR_Guide_8m`, двухтреугольный distance-LOD `FLOOR_Far_8m` и objective overlay `FLOOR_Capture_12m`. Арена покрывается bounded `THREE.InstancedMesh` batches. Desktop держит detail внутри hysteresis band **36 m enter / 44 m exit**; `MOBILE_LOW` — **28/36 m**. За пределами band исходный тип тайла заменяется на `FLOOR_Far_8m`, поэтому решётки, болты, тонкие рёбра и швы не уходят в subpixel shimmer. Capture pads также distance-cull-ятся на 52 m desktop / 40 m low-power и по-прежнему потребляют canonical `BOT_MAP_ZONES` без копирования objective coordinates.

Критический invariant: `src/core/engine.js::arenaFloor` остаётся единственным плоским gameplay-ground owner на Y=-0.04. `firstGroundHitDistance()` продолжает работать по исходной `PlaneGeometry(220,220)`; Pack48 не попадает в `wallMeshes`, `wallAABBs`, `losMeshes` и не создаёт hidden collision у trench/grate/hatch. При активном Pack48 authoritative floor остаётся в scene, но его material имеет `colorWrite=false/depthWrite=false`; отдельный presentation-only fallback находится на Y=-0.22. Поэтому collision/ballistics остаются на -0.04, а raster floor не конкурирует по depth с Blender geometry.

Builder детерминированно генерирует `.blend`, preview PNG, textureless GLB, q16/Base64 runtime derivative и SHA-256 manifest. Current Khronos glTF Validator 2.0.0-dev.3.10: **0 errors / 0 warnings / 0 infos / 0 hints**, **8,786 triangles / 17,924 vertices / 33 draw calls**, 7 materials, 0 textures; `FLOOR_Far_8m` — ровно **2 triangles / 6 runtime vertices / 1 material group**. Focused regression: `scripts/floor-kit48-owner.test.mjs`; live HTTP/direct-`file://` oracle: `scripts/browser-floor-kit48-smoke.mjs`. Rebuild и budget details: Pack48 README и `docs/BLENDER_ASSET_PIPELINE.md`.

## Модульный sci-fi environment — Pack47

Pack47 — Blender presentation layer для существующей карты. Canonical source/build: `asset-staging/2026-10-07-map-sci-fi-kit-47/`; portable artifact: `assets/environment/models/zap-map-sci-fi-kit-47.glb`; direct-`file://` derivative: `zap-map-sci-fi-kit-47.runtime.js`; runtime owner: `src/environment/map-kit3d.js`.

Главный invariant: карта не переносит gameplay collision в Blender. `src/core/engine.js::box()` по-прежнему создаёт authoritative `wallMeshes`, `wallAABBs` и minimap descriptors. Pack47 attaches child meshes к тем же objects; после успешного attach скрывается только rasterized surface collision-owner material через `colorWrite=false/depthWrite=false`, но сам owner не становится `visible=false`, не удаляется из scene и продолжает raycast/collision. Missing Pack47 оставляет прежний procedural/box fallback.

Kit содержит стены 4/8/12 м, 90° corner, column, door frame, barrier, container, ramp, ladder, grate, tech panel, vent, straight/elbow pipe, cable tray, fortification, base module и dedicated cover family: `KIT_Armor_Cover`, `KIT_SciFi_Sandbag`, `KIT_AntiTank_Block`, `KIT_Cargo_Crate`, `KIT_Reactor_Housing`. Runtime заменяет presentation у hazard/perimeter walls, крупных base/annex boxes и central columns; arena Aegis/barrier/cargo получают armor/sandbag/cargo visuals, supply crates — dedicated cargo crate, прежние тройные box-группы — anti-tank blocks, периферийные 3×5×3 owners — reactor housings. Все они остаются child presentation поверх прежних authoritative box owners; даже случайный yaw anti-tank вращает только Blender child. После anti-shimmer pass большие base/annex owners получают **только монолитный `KIT_Base_Module`** без tech/vent/grate/cable/pipe/elbow/ladder/corner attachments. Центральные четыре hazard wall имеют настоящие 3.8 м проходы: каждый прежний сплошной collision owner заменён двумя боковыми `hazardWall` collision owners, а `KIT_Door_Frame` и низкий `KIT_Ramp` стоят только как presentation. Поэтому `collideWalls()` действительно пропускает игрока через центр ворот, но боковые секции по-прежнему блокируют движение/LOS/projectiles.

Large environment coordinates используют per-component `qScale`: generated Q16 positions нормализуются на `[-1,1]`, а runtime восстанавливает meter scale. Geometry/materials кэшируются и переиспользуются между instances. Final anti-shimmer geometry deliberately removes layered facade detail instead of hiding it with LOD: `KIT_Wall_4m/8m/12m` are one shell plus thick posts, while `KIT_Base_Module` is one beveled shell only. Runtime `MAT_SHELL`/`MAT_EDGE` use `roughness/metalness = 0.62/0.24` and `0.52/0.34`; all Pack47 presentation meshes `castShadow`, but `receiveShadow=false`. Основная камера использует near `0.12` / far `220`. Textureless GLB экспортируется с `export_texcoords=False`; текущий Khronos glTF Validator `2.0.0-dev.3.10` показывает **0 errors / 0 warnings / 0 infos / 0 hints**, **31,796 triangles / 62,706 vertices / 86 draw calls**, 7 materials и 0 textures. `KIT_Base_Module` = **108 triangles / 324 runtime vertices / 1 material group**.

Machine-readable component stats и SHA-256 artifacts: `asset-staging/2026-10-07-map-sci-fi-kit-47/manifest.json`. Focused regression: `scripts/map-kit47-owner.test.mjs`; existing wall raycast oracle: `scripts/engine-wall-geometry-owner.test.mjs`; browser oracle: `scripts/browser-map-kit47-smoke.mjs`. Текущий live contract: **23 components**, **147 presentation pieces**, **139 presentation collision owners**, gameplay `wallMeshes/wallAABBs = 163/163`; Blender presentation meshes в authoritative wall arrays отсутствуют. В runtime: 8 monolithic base modules, 24 monolithic wall pieces, 4 armor covers, 4 sci-fi sandbag barricades, 24 anti-tank blocks, 62 cargo crates, 8 reactor housings, 5 columns, 4 door frames и 4 ramps; base secondary attachments = 0. Rebuild/ownership/evidence details: pack README и `docs/BLENDER_ASSET_PIPELINE.md`.

## Объёмные Blender-боты — Pack46

Pack46 — настоящий модульный 3D bot body, а не raster sprite/texture plane. Canonical editable source и builder: `asset-staging/2026-10-06-bot-3d-pack-46/`; runtime model artifact: `assets/characters/models/zap-bot-modular-46.glb`. Компоненты: head, torso, pelvis, shoulder, upper arm, forearm, hand, thigh, shin, foot. Один набор geometry переиспользуется обеими командами; `src/entities/bot-model3d.js` назначает blue/cyan ally либо crimson/red enemy materials.

Текущий realism/quality pass восстанавливает approved concept language не только цветом: compact helmet с framed visor, crown/temple rails, top/bottom visor seals, side blades, chin/rear vents, sensor и antenna collar; layered chest со split-clavicle armor, center keel/ab rails, compact backpack и читаемыми shoulder sockets/bearings; belt/codpiece/hip rails с отдельными hip bearings/latches; oversized pauldrons с механическим joint/bearing; arm и leg shells получили collar/bearing rings, low-poly actuator pistons и service latches; glove — finger rails; boots — toe seam, ankle latch и heel vents. Эти детали специально показывают конструкцию «броня поверх механики», а не добавляют случайный шум. Presentation плечи остаются разведены до ±0.38 м, visual hips до ±0.17 м; long-gun poses опущены и разводят локти, чтобы оружие не закрывало нагрудник.

Lighting-aware high-visibility pass решает дальнюю читаемость в серой арене с учётом реального Three.js lighting path. В `src/core/engine.js` сейчас есть directional + hemisphere + ambient light, но нет `scene.environment`/HDR environment map; поэтому прежние высокие metalness shell/edge теряли слишком много diffuse response и темнели на дистанции. Runtime shell/edge переведены на умеренный metalness (`0.36` / `0.48`) и получили лёгкий team tint: ally shell/edge `#506476` / `#8295A7`, enemy `#62565B` / `#8B7D82`. Team paint стал ярче — ally `#2F97FF`, enemy `#EF4052`, `MAT_ACCENT` metalness `0.10`, roughness `0.34`, emissive `0.22` / `0.17`. Помимо chest panels увеличены существующие accent-вставки upper arm, forearm и thigh; новый material slot не добавлен. Иерархия `accent < visor < small glow` сохранена (`0.22 < 1.30 < 1.65` ally; `0.17 < 0.84 < 1.12` enemy), поэтому команда читается цветом и площадью покрытия, а не flat-neon. Gameplay hit meshes/pivots/AI не менялись.

Для direct `file://` builder дополнительно публикует `zap-bot-modular-46.runtime.js` — vertex/normal derivative из того же Blender mesh. Он сохраняет Blender corner normals и использует q16/Base64 streams; builder теперь fail-fast проверяет локальный диапазон `[-1,1]` вместо молчаливого clamp. Generated `manifest.json` фиксирует triangle/runtime-vertex counts, material groups, q16 bounds и SHA-256 canonical artifacts. GLB без textures экспортируется без лишних UV и проходит Khronos glTF Validator с 0 errors/warnings/infos/hints. `index.html` грузит Pack46 и остальные local classic scripts с build-key `?v=<application-build>` даже на `file://`, чтобы обычный Chrome не удерживал stale JS после обновления. Generated PNG/WebP/JPEG не становятся bot-scene texture plane.

`src/entities/bot-presentation.js` сохраняет canonical `pts[]` hit meshes и arm/leg nodes, скрывает только их старые visible materials и крепит Blender components поверх существующего animated rig. Weapon mesh, two-bone hand IK, gait, recoil и gameplay hit/raycast owners сохраняются; `BOT_WEAPON_POSES` меняют только presentation pose/grip metadata. Forward-axis regression исправлен presentation-only: gameplay/shot convention остаётся local +Z, а Pack46 и procedural visuals, authored toward runtime -Z, разворачиваются на π; weapon poses также перенесены на +Z side с yaw≈π. Поэтому бот теперь визуально смотрит и держит оружие в ту же сторону, куда реально стреляет, без изменения AI/accuracy/projectile math. `PERF_MODE/MOBILE_LOW` сам по себе больше не отключает Pack46 на desktop: Blender-модель остаётся активной даже при 4 hardware threads и direct `file://`. Облегчённый procedural fallback сохраняется только для low-power coarse-touch устройств либо missing/incomplete Pack46. Текущий measured baseline: **40,224 GLB triangles, 75,100 GLB vertices, 60 draw calls** и **178,008 non-indexed component vertices** на одного runtime-бота после зеркалирования. Текущий visibility pass остаётся budget-neutral по draw calls/material groups и даже немного уменьшил итоговую tessellation после пересчёта bevel topology. Khronos Validator на текущем GLB: **0 errors / 0 warnings / 0 infos / 0 hints**. Build stamp **d68ed104e9303f4a** current; focused Pack46 + rig **14/14 PASS**, полный Node suite **340/340 PASS**, structure validation **PASS**. Neutral-light Three.js proof подтверждает sampled ally/enemy с `model46=true`, по 17 Pack46 parts и текущими runtime palette values. Отдельный facing proof подтверждает: при gameplay yaw=0 логический muzzle находится на +Z (`z=0.96`), реальный rifle muzzle тоже на +Z (`z≈1.178`), а его forward dot с gameplay +Z ≈`0.989`; одновременно visor/torso визуально обращены к цели. На этой машине свежий isolated Chrome не смог скачать внешний cdnjs Three.js (`ERR_CONNECTION_TIMED_OUT`), поэтому HTTP и direct `file://` integration были дополнительно проверены через временное локальное зеркало **точного Three.js r128 файла**: оба smoke прошли без diagnostics. Это ограничение внешней доставки CDN, а не Pack46 geometry/runtime regression; production `index.html` в рамках этого pass не менялся на vendored Three.js.

Source provenance/rebuild/evidence: `asset-staging/2026-10-06-bot-3d-pack-46/README.md`; machine-readable geometry/artifact identity — соседний generated `manifest.json`. Общий Blender/export/runtime workflow — `docs/BLENDER_ASSET_PIPELINE.md`. Focused oracle: `scripts/bot-model3d-owner.test.mjs`; общая rig regression: `scripts/bot-presentation-owner.test.mjs`.

## Информирующий HUD — Pack43

Десять металлических рамок: XP, синяя/красная команды, миникарта, характеристики, здоровье, боезапас, очки, союзники и приказ. Built-in image_gen создал общий reference-лист; runtime — детерминированные scriptless SVG по его геометрическому стилю (19 300 байт суммарно). Источник, точный prompt, builder, consumer map и SHA256: `asset-staging/2026-10-06-hud-shells-43/`.

Владелец путей — `GAME_ASSETS.presentationHudShells` в `src/assets/catalog.js`; оформление и responsive composition — блок HUD Pack43 в `src/styles/game.css`. Nine-slice сохраняет металлические углы без растягивания; источник512×256, slice56, край3–10 CSS px. Верхние карточки оружия используют squad/ammo рамки. Подписи находятся во внутренней свободной области, а не запекаются в изображения; динамические HP/ammo/XP, состояние цели и миникарта сохраняют прежних владельцев. Максимальный уровень подписан коротко: «ЛВЛ30 · МАКС. УРОВЕНЬ».

Рамки — только DOM/CSS. URL разрешаются существующим `gameAssetUrl()` и работают на HTTP(S)/`file://`. При отказе изображений остаются тёмный CSS-фон, цветная граница и весь текст/canvas. Для низких окон миникарта и строки союзников компактнее; реальные карточки weapon-bar проверяются отдельно от пустых промежутков flex-контейнера. Проверки и их ограничения — `VERIFICATION.md` внутри source batch. Баланс, физика, AI, оружие и сохранения этим пакетом не меняются.

## Дымовуха — Pack42

Комплект ZAP ZONE: потёртый silver/charcoal металл, cyan вставки, amber подсветка, цельные бронированные перчатки и предплечья. Все растровые исходники созданы built-in image_gen; производные сохраняют alpha. Runtime: 12 WebP и пять PCM mono44100Hz/16bit WAV (pin, throw, bounce, vent, reload), всего 3.34MiB. Источники, prompts, SHA256, точные окна slicing, builder и evidence: `asset-staging/2026-10-04-smoke-pack-42/`. Ранние листы броска заменены отдельными подробными full16:9 источниками; release показывает пустую ладонь, летящий корпус принадлежит физике.

| Consumer | Runtime image | Размер / сетка |
|---|---|---|
| FPS ready | player-smoke-fps-42.webp | 1600×900 |
| FPS throw | smoke-throw-atlas-42.webp | 3840×1440,3×2,6 cells1280×720 |
| FPS reload | smoke-reload-atlas-42.webp | 3840×720,3×1,3 cells1280×720 |
| Flight/landed/venting | smoke-world-atlas-42.webp | 1536×768,4×2,8 cells384×384 |
| Retired flat cloud (not rendered) | smoke-cloud-atlas-42.webp | 1536×1024,3×2,6 cells512×512 |
| Retired near variants (not rendered) | smoke-near-atlas-42.webp | 1536×1536,2×2,4 cells768×768 |
| Retired far variants (not rendered) | smoke-far-atlas-42.webp | 1536×1024,3×2,6 cells512×512 |
| Retired flat curls (not rendered) | smoke-wisps-atlas-42.webp | 1536×768,4×2,8 cells384×384 |
| Retired inside images (not rendered) | smoke-inside-{dense,edge}-42.webp | 960×540 each |
| Pickup/icon | world-smoke-pickup-42.webp / smoke-icon-42.webp | 512×384 /128×128 |

FPS ready ≤500KiB, pickup ≤120KiB, icon ≤32KiB, inside overlays ≤250KiB each, other images ≤3MiB each. Explicit combined FPS decoded budget40MiB; actual37.13MiB. This budget covers detailed ready/throw/reload lazily loaded only when used. Full FPS canvases are resized without tight crop; square empty-hand recovery window is fitted intact at lower right. World/wisp cells retain transparent gutters. Near/far variants and all lifecycle frames use complete independent square sources with extra transparent padding; rejected multi-cloud sheets never enter runtime. This prevents neighboring fragments and straight clipping. No creative raster edits occur in builder.

`src/combat/combat.js` owns pending smoke release: six poses ready→pin→windup→empty release→empty recovery→ready over.58s; actual release at.29s. Before release ammo/CD and world objects remain unchanged. The release rechecks ownership/ammo/cloud projectile cap/cooldown/session and commits once independently of decode. Switch/pause/death/reload/blur/hidden/newgame cancel a pending attempt. Existing ammo reload owner commits stock. Smoke reload retains the original mechanic pitch RNG draw. Decoded world art suppresses legacy muzzle particles/light through trigMuzzle visual=false, preserving its exact historical RNG sequence; missing art keeps the original fallback. `system.js` owns one FPS ready/action layer. When Pack42 ready exists in the catalog, the native smoke rig is hidden immediately during the pending decode so the old model cannot flash for a frame on weapon selection; exact1600×900 decode then exposes Pack42, while terminal missing/wrong-size/decode failure restores the native rig. Missing/wrong-size action keeps ready or native rig; no duplicated hands. Ready/action use matching proportional contain70% viewport, right/bottom anchor; actual16:9 and5:4 game frames validate continuous forearms. Legacy narrow ready tuning remains an unrelated fallback default, overridden by Pack42 CSS.

Player and bot grenade motion uses canonical `sweepWallSphere`, including camera→spawn, continuous contacts, floor, wall heights/corners and roof support. Radius19.5m (expanded from15.5m by the smoke-coverage request), lifetime60s, cooldown30s and max3 active clouds. Team/AI sight blocking consumes the same canonical radius; historical gameplay RNG remains unchanged.

Cloud presentation is a world-space ray-marched density volume owned by `createSmokeVolume42/updateSmokeVolume42` in combat. Shared `smokeVolumeGlsl42` owns its noisy ground dome, advected density and integration, including the exact-depth silhouette correction. The base spreads across the support plane; height is0.48×radius rather than the old floating ellipsoid. Density reaches zero at every container face, preventing a straight cut when noisy billows meet the box. Dense extinction4.2/m and a continuous rounded interior density floor prevent noise holes from revealing trees/people inside the cloud; the outer edge stays soft. The cloud sampling grid is fixed by ray-box bounds BEFORE opaque-depth clipping; only the final segment is shortened, so a hidden object cannot change the fog colour by changing sample spacing. GPU accumulation stops at opacity0.9995. CPU projected-art attenuation uses the same extinction4.2/m. Browser oracles must compare an actual arena tree and mkHuman bot shown/hidden at several distances INSIDE the cloud, with clear and foreground positive controls; a black/white target behind the full cloud alone misses depth-dependent ghost silhouettes. Three-dimensional noise is advected upward with slow lateral curling; broad turbulent lobes shape the edge and two density samples toward sunlight shade the interior. It expands during the first4s, retains the existing density fade-in1.35s/fade-out4s, and changes shape continuously without new random draws. Its box begins at the actual support plane (arena floor or roof); density below that plane is zero. No camera-facing cloud images or static inside textures are published. The retired deployment flash/ring is suppressed independently of asset decode, while its historical random draw is consumed. Retired image files remain as preserved source/compatibility material, not as live cloud layers; shared Pack12 art for other effects is retained.

`renderSmokeDepth42` in engine renders the world colour/depth once at full drawing-buffer resolution, volume clouds alone into a reduced target, then composites in linear colour. The cloud target is at most half width/height (one quarter of pixels), capped at960px wide normally or640px in PERF_MODE. World depth stops integration at floor, walls and geometry. Four depth-aware samples preserve silhouette edges; a bounded exact-depth march corrects subpixel geometry when every low-resolution sample belongs to a different surface. March count is40 normally/24 in PERF_MODE. Midpoint sampling avoids screen-space grain. Targets track resize and are released, with compositor geometry/material, after the last cloud; cloud geometry/material use canonical disposal on expiry/cap/new game. Camera layers, target, background, clear colour and shadow state restore in finally, including a render exception. Fragment highp/depth capability failure keeps native constrained 3D puffs. The native inside fallback is a plain radial overlay, never an old bitmap.

`smokeVisibilityBetween42` owns bounded CPU visibility for projected world pickup/projectile/ground-decal art: finite segment clipping, six density-envelope samples per cloud, Beer-Lambert attenuation. This deliberately uses a conservative smooth mean envelope, not a second GLSL-noise implementation; inside/behind art fades or hides, while objects before the segment enters a cloud remain visible. It allocates no textures or random samples and leaves FPS/HUD art alone.

Regression owners: `scripts/smoke-density-owner.test.mjs` (CPU segment/ground envelope, inside/behind/foreground/expiry) and `scripts/smoke-volume-owner.test.mjs` (volume selection, precision, support bounds, retirement/RNG, scene-depth state restoration and target disposal) and `scripts/smoke-presentation-owner.test.mjs` (FPS, release/cancel, swept physics, historic RNG, cloud cap/fade/expiry). Browser checks must additionally prove real GLSL compilation, wall/floor occlusion, changing shape, view from inside,16:9/5:4, GPU disposal and target recreation. Source/VM tests alone do not prove visual realism or weak-GPU performance.

Seven smoke-only legacy files removed after recovery backup: smoke.svg, smoke-tech.svg, smoke-skin.svg, player-smoke-fps-01.webp, world-smoke-pickup-01.webp, smoke-clouds-01.webp, smoke-throw-vfx-atlas-19.svg. Shared atlases, other weapons, killfeed/minimap/perk icons remain. Regression: `scripts/smoke-presentation-owner.test.mjs`; CSS oracle includes a negative control for a missing landing media brace. Verification boundaries and first failed fixture/browser attempts are recorded in the batch VERIFICATION.md. Atlas preview alone does not prove game framing.

## Бомба — Pack41

Один дизайн ZAP ZONE: прямоугольный потёртый silver/charcoal корпус, жёлтые hazard-вставки, cyan подсветка, экран с четырьмя вертикальными amber полосами. Девять alpha-WebP: ready1600×900, четыре позы установки3200×1800 (2×2), единый взрыв3840×3072 (5×4,17 кадров768×768), прежняя последовательность дыма1536×1024 (3×2,6 кадров), большой шлейф768×768, pickup512×512, icon128×128, ортографическая верхняя текстура512×768. Для подробного взрыва разрешён отдельный бюджет5MiB; фактически3,606,016bytes, RGBA45MiB, остальные картинки≤3MiB каждая. Пик улучшен генератором из отдельных исходников1280×1280, а не простым увеличением. Padding36px защищает соседние клетки. Кадры огня и дыма, ранее показанные пользователю, сохранены в последовательности и исходниках. Огонь визуально расширен на40% (viewport cell1075×768, source cell остаётся768×768), высота прежняя; damage radii34m player/32m bot не менялись по прямому выбору пользователя. Взрыв развивается последовательно2.1s: зажигание→рост→пик→затухание; выбор разных взрывов между событиями отсутствует. Шестикадровый дым начинается через.85s, большой шлейф через1.8s, плавно расширяется и исчезает. Ударная волна1536×1024 (3×2,6 кадров512×512) развивается.9s от горячего малого кольца к широкому рассеивающемуся пылевому ободу. Это отдельная groundPlane quad28m на arena floor; старт через.04s при реальной детонации, missing/wrong-size волна пропускается независимо от взрыва. Transparent gutters16px, normal blending. Ground scorch использует уже существующий Pack35.

`src/combat/combat.js` — gameplay owner. Установка.96s, выпуск.48s. До выпуска не расходуются ammo/CD и не существует world object. Выпуск повторно проверяет ownership/ammo/caps/CD/ground/equip/sprint и место, выполняется один раз независимо от decode. Switch/pause/death/reload/blur/newgame отменяют невыпущенную попытку; уже установленная бомба сохраняется. G не повторяется от key-repeat и использует ту же механику. Swept footprint.42m сохраняет сторону тонких стен; initial overlap отвергается. Физика поддерживает плоский arena floor, не произвольные крыши. Игрок и каждый бот имеют собственный cooldown180s после успешной установки. У ботов удалена дополнительная случайная задержка24s; исторический RNG draw сохранён. Начальная задержка первого действия ботов остаётся прежней. Урон/радиус/fuse/team/AI probability не менялись; текст fuse учитывает perk.

`system.js::createBombDevice41` — общий низкий объёмный корпус для земли, bot/world fallback и FPS fallback. По исправлению скриншота: тёмная оболочка.48×.72×.12m и два округлых боковых модуля; высокие серебристые полосы отсутствуют. Decoded artwork скрывает целую native-details группу, поэтому экран/антенна не дублируются. Верхняя текстура localY=-.217, непосредственно над оболочкой. Bottomlocaly=-.34 + physicscentery=.34 = ground0. Экран/антенна/rails/spark сохраняют цельный дизайн. `combat.js::syncBombWorldArt41` добавляет верхнюю текстуру реальному world object после exact decode. HTTP использует горизонтальный WebGL mesh/depth-test, map принадлежит каждой бомбе и освобождается canonical destroy; `file://` использует тот же рисунок на горизонтальной DOM quad через canonical projection/wall occlusion без tainted GPU texture. Удалённые бомбы и fresh game удаляют DOM узлы. Timer.28×.07m на localy.03, depthTesttrue: компактный текст00:SS без рамки и emoji, рядом с устройством.

`system.js` владеет одним FPS ready/action слоем; позы ready/arm/lower/release/recovery сохраняют положение компонентов. Ready→обновлённый native fallback; старые ready01 не используются. При отсутствующем action текущие руки/rig остаются видимыми, mechanics не зависит от картинок. Exact one-shot probes в settings, без retries/wrong-size acceptance. Общий viewport16:9 canvas min-size и right/bottom anchor уводят оба предплечья за экран при16:9 и5:4. Reload показывает извлечение следующего устройства через те же позы; ammo owner прежний.

Старый синий/красный значок над бомбой из explosive-fuse-atlas01 больше не создаётся: combat::ensureExplosiveFuseArt отвергает bomb, syncExplosiveFuseArt пропускает bomb и удаляет их stale nodes. Общий atlas сохраняется для mine fallback. Combat::updateBombFuseVisual никогда не включает старый fuse spark и не вызывает spark/smoke emitters; интервалы и4+1(+3) исторических RNG draws сохранены по фактическим engine owners. Таймер00:SS и damage/fuse не изменены.

`settings.js` публикует FX только при настоящей детонации. При decoded Pack41 `tickMines` подавляет прежние procedural burst/ray/ring/core и screenwave; звук, краткий свет, shake и damage сохраняются. `engine.js::spawnBombBlastWave(...,presentation=false)` сохраняет164/69 старых RNG draws. При missing blast старые Pack12/Pack26/procedural лучи не возвращаются; gameplay/light/shake/sound сохраняются. Слои имеют существующий bounded lifetime/cap; cleanup через canonical helpers.

Удалены семь старых bomb-only runtime файлов: legacy ready01 WebP, bomb.svg и heavy explosion26 WebP, а также arm-vfx-atlas20 SVG, world-bomb-pickup01 WebP, bomb-tech SVG, bomb-skin SVG. Последние два имели только неактивные catalog/validation ссылки, без render consumer. Legacy FPS01 и bomb.svg удалены по прямому уточнению пользователя; shared atlases и perk/minimap art других слоёв сохранены. Три superseded A/B/C WebP candidates вынесены в резервную копию вне проекта; generation sources и17-кадровый atlas сохранены. Sources/prompts/SHA256/build maps и проверка: `asset-staging/2026-10-04-bomb-pack-41/`. Regression owners: `scripts/bomb-presentation-owner.test.mjs`, `scripts/bomb-asset-contract.test.mjs`, `scripts/bot-deployables-owner.test.mjs`. Atlas preview не заменяет реальные игровые кадры.

## Пистолет — Pack40

Комплект ZAP ZONE: потёртый silver/navy металл, blue inserts, amber sights, бронированные перчатки. Runtime: ready1448×1086, reload3840×1920 (3×2, шесть cells1280×960), effects768×768 (4×4: flame/smoke/bullet/casing), pickup512×384, icon256×192 и четыре оригинальных PCM WAV. Отдельные FPS sources1448×1086, prompts, SHA256, бюджеты и builder: `asset-staging/2026-10-04-pistol-pack-40/`. Ready ≤450KiB — исключение для подробного FPS-арта; reload ≤2100KiB. FPS cells уменьшаются целым canvas с alpha, без tight-crop или дорисованных рамок. Recovery повторяет ready source.

`system.js` владеет одним ready/action слоем. Tactical sequence0/1/2/3/5 длится прежние1.10s; empty0/1/2/3/4/5 —1.35s. Затвор звучит только в empty phase4, один раз. Боезапас переносит только `completePlayerReloadStep`. Все позы имеют одинаковые масштаб/pivot; muzzle/ejection landmarks меняют markers. Framing учитывает реальные alpha-выходы предплечий каждой позы, а не прозрачные углы canvas. Ready axis−158.5° направляется к центру прицела, slide-rack сохраняет отдельный запас для заднего прицела в4:3. Размещение зависит от viewport: рабочая кисть с магазином видна в16:9/4:3, нижние края предплечий находятся за экраном. Source pose4 с выходом руки через левый край отклонён и заменён позой с выходом обоих предплечий через низ. Проверка atlas не заменяет игровых screenshots.

Ready требует exact decode до замены rig: Pack40→legacy01→procedural. Pack40 action требует3840×1920; при отказе держит тот же ready40 через hold action. Legacy25 reload используется только с legacy01 ready и после960×540 decode. Wrong-size и stale callbacks не создают пустой/чужой слой. Normal Pack40 не запускает прежние magazine-drop и weapon/hands discharge overlays.

`settings.js` закрепляет плотное окончание каждой flame/smoke cell на transformed zero-size muzzle marker. Ready front-plane anchor[431,150] — визуальная оценка±6sourcepx: само отверстие закрыто ракурсом. Roots измерены на исходнике1254×1254 и нормализованы по точным floor-cells313/314, без ложного reference320. После FPS transform выполняется late FX sync. Ammo HUD Pack40 использует стандартное нижнее правое положение и размеры общей панели #whud, как у остальных видов оружия. CSS в узком окне сохраняет вычисленную ширину stage. Одна гильза выходит из port marker. Generated muzzle/casing подавляют процедурные только при active ready и decoded effects. `combat.js::syncRifleFlightArt36` показывает pistol bullet art на реальном projectile с velocity/FOV/near-clip/opaque-wall facts и bounded capacity; при отказе DOM виден исходный tracer. Поворот учитывает направленный влево source. Общий surface-impact owner Pack29/45 описан ниже. Damage, cadence, clip, reserve и RNG сохранены. Near-wall muzzle проходит общий camera→spawn clamp; `runtime.js` восстанавливает pistol camera recoil exponential, чтобы он не обнулялся до применения.

WAV shot/mag/slide/done используют существующий WebAudio owner; file:// и отсутствующие buffers — прежний синтез. Новых timers и повторного завершения reload нет. Тесты: `scripts/pistol-presentation-owner.test.mjs`, общий Validate. Результаты и первые сбои проверок — staging `VERIFICATION.md`. Remote hosting/CI и слышимость на устройстве требуют отдельной проверки.

## Мина — Pack39

Явно одобренный blue/silver/amber комплект подключён без изменения damage/radius, teams, AI, ammo/caps и задержки активации1.5s. Source→runtime SHA256/размеры/alpha/сетку и сохранённый fallback описывает `asset-staging/2026-10-04-mine-pack-39/manifest.json`; исходники/prompts не изменяются runtime интеграцией.

`src/combat/combat.js::tickPendingMineThrow` — единственный producer выпуска игрока: native slot6 LMB и F quick-throw с исходного слота. Throw .58s, release frame3/6=.29s. Ammo/CD списываются только при реальном выпуске; switch/pause/death/reload/new game отменяют pending без ghost. Release повторно проверяет актуальные caps/ammo. При отсутствии action legacy-ready использует свой mineThrow24; Pack39 ready остаётся видимым. FPS ready1600×900, throw3840×1440 (3×2), reload3840×720 (3×1) используют один слой, right/bottom anchor и единый16:9 scale44% viewport. Action отключает процедурные руки и original ready до возврата. Ready loading/error callbacks не снимают видимость активного decoded throw; после actionstop terminal ready failure возвращает rig.

`syncMineWorldArt39` читает только реальную мину и её состояние. В полёте atlas1536×1536 даёт cells5/6/7. На полу `makeMineBody39` создаёт цельный низкий металлический 3D-корпус: круглый silver body, шесть креплений/вентиляционных вырезов, cyan band, amber indicator и cell8 на настоящей горизонтальной textured plane. Высота всего корпуса .063m; нижняя точка localy=-.08 лежит на groundy=0 при прежнем physics center y=.08. Все четыре старых элемента скрыты. WebGL camera/FOV/depth test обеспечивают ракурс и перекрытие; planted DOM billboard отсутствует. Yaw наследуется от реального `mn.m`. Физика поддерживает только плоский arena floor, новые raised supports не добавлены. Exact1536 decode обязателен до замены; fallback восстанавливает исходный `mkMine`. HTTP использует строгий decoded Image и top8 UV crop64..448 внутри512 cell (без прозрачного padding); file:// не загружает tainted Image в WebGL: тот же одобренный crop top8 лежит на горизонтальной DOM surface через `positionGroundGrenadeDecal`, worldquad .64m, actualy=.059, реальный yaw, background400%/position94.444444%. Нижний подробный 3D-корпус заполнен flush metal backing; raised cap/ring отсутствуют. Shared helper владеет wall/nearclip/FOV projection. все мины разделяют один immutable GPU atlas; bounded geometry/material/instanced buffers принадлежат каждой мине (capMAX_MINES); remove, detonation и fresh-game detach/dispose их до canonical parent destruction, сохраняя shared decoded source; last-user release освобождает GPU atlas. Fuse icon не дублируется, bombs не затронуты.

`mineContactActors` проверяет касание каждой armed grounded мины каждый physics frame: радиус тела .32m плюс существующий player/bot collider, feet на поверхности, без airborne/jump и через стены. Прежняя hostile proximity зона √10 удалена. После активации1.5s прямой наступивший игрок/любой бот, включая союзника и самого владельца, немедленно умирает через canonical damage/death. Explicit directMineContact bypasses shield/armor/resistance/secondWind только для прямого контакта; nearby AoE сохраняет прежние team/owner/damage rules. Owner snapshot берётся до bot death; stale/friendly player attacker очищается, награды даются только за настоящие enemy kills и один раз.

`settings.js` владеет bounded elapsed combatVfx/decal и пятью WAV через существующий WebAudio audio owner. Explosion2048×1024 (4×2), smoke1536×1024 (3×2), utility1536×1024 (3×2): metal0, electronics1, landing2, hot-scar3, cold-scar4, activation5 — разные эффекты. Взрыв/дым anchorx=.5,y=472/512; только реальная ground detonation публикует floor-perspective scar hot→cold .65s, lifetime15s. `engine.js::explode` optional presentation=false сохраняет старые RNG draws/lights и не публикует duplicate particles/ring; mine detonation не создаёт ring/fullscreen shockwave даже при legacy-sprite fallback. Прочие explode calls используют прежние defaults. WAV HTTP, file:// и unavailable buffers используют synthesis без duplicate explosion sound.

Regression owner: `scripts/mine-presentation-owner.test.mjs`, registered Validate. Проверять actual native LMB/F, all6 throw/all3 reload frames в игровом DOM16:9/4:3, release/cancel/retry, pause/switch/death/new game, walls, landing/arming/trigger, full/partial decode failure и HTTP/file://. Source/VM не доказывают live screenshots/audio; результаты — staging `VERIFICATION.md`.

## Дробовик — Pack37

## Pack38 — детальный дробовик и привязанные эффекты

Active FPS ready1448×1086, six-pose action3840×1920 (1280×960/cell), effects768×768. Каждый FPS source отдельно1448×1086, а не512px фрагмент общего atlas; качество WebP96. Детализированы металл, крепёж, перчатки/броня и red/brass ammo. Прежние Pack37 sounds/icon/pickup/ballistics/fallback owners используются.

Flame и smoke закрепляют измеренный tip каждого tile на transformed muzzle текущей action-позы. Generated casing возникает единожды в transformed open ejection port после current DOM sync, затем отделяется/вращается/падает. Размер sprite96px соотнесён с патронами на FPS-оружии. Отключены большой radial firearm hit burst/ring и отдельный золотой Pack12 ricochet fan/ring у игрока и ботов. showGeneratedRicochetVfx сохраняет throttle/RNG draw без создания DOM эффекта; физика и звук рикошета прежние. Owner paths: catalog.js assets/emitter origins; system.js pose landmarks; settings.js effect positioning; runtime.js emission order; engine.js impact policy. Sources/prompts/reproducible build/hash/verification: asset-staging/2026-10-03-shotgun-pack-38/README.md. Renderer budget: три runtimeWebP≈2MB; action largest edge3840px.


Согласованный комплект в серебристо-синем стиле ZAP ZONE с янтарными деталями:
ready, передёргивание помпы, зарядка одного патрона, вспышка/дым/летящая дробь/
гильза, мировой pickup, иконка и четыре детерминированно синтезированных WAV.
Пять alpha-WebP и четыре PCM22.05kHz mono занимают около680KiB. Исходники,
prompts, slicing, размеры, бюджеты и SHA256 —
`asset-staging/2026-10-03-shotgun-pack-37/manifest.json` и README рядом.

Ready960×720 происходит из action cell0. Atlas2304×1152 содержит шесть
768×576 ячеек. Все позы имеют один fit576×576 в(140,50); bottom-row top8 и
frame4 left16 исходных пикселей очищены как доказанные соседние фрагменты.
Pump sequence:0,1,1,2,0; shell sequence:0,3,4,5,0. Время берётся из существующих
`cycleTot` и `reloadTot`, а перенос одного патрона — только из
`completePlayerReloadStep`. Отмена/завершение зарядки очищает action.
Цельность обеих кистей/запястий/предплечий проверена для каждой ячейки в игровом
DOM при1920×1080 и1280×960: руки продолжаются за нижний край viewport.

`src/weapons/system.js` владеет позой и согласованным fallback. Строгие
one-shot probes в settings допускают atlas только после decode и проверки
размеров. При loading/error новый ready остаётся через shotgunHold37;
отказ ready использует legacy01/pump25, отказ обеих картинок — procedural rig.
Вспышка/дым имеют zero-size marker дула34.3%/20.1% внутри transform stage;
flame nozzle(.77,.58) закреплён именно к нему. Выброс гильзы один раз на
cycleP>.38: action не содержит baked shell, готовый casing37 заменяет
процедурную видимость, сохраняя существующие RNG draws.

`src/combat/combat.js::syncRifleFlightArt36` — существующий общий consumer
летящих firearm sprites: rifle36 и shotgun37 используют фактические pos/vel,
elapsed life, FOV/distance и opaque-wall occlusion. Общий cap96, прежний rifle
cap32 сохраняется; decode failure возвращает mesh, удаление очищает узлы.
Surface impact использует общий Pack45; damage/penetration/ricochet owners сохранены.

Начало дробины теперь проверяет участок camera→muzzle и ограничивается
позицией перед близким укрытием, включая procedural fallback. Ранее .48м
offset мог стартовать внутри .5м стены и пропускать её FrontSide raycast.
Общее shotFeedback передаётся из shoot через настоящий spawnPlayerBullet:
первая попавшая дробина даёт одно подтверждение, позднее убийство — одно
обновление kill. Декоративный markerEligible остаётся ограничителем FX.
Камерная отдача дробовика использует dt-independent exponential decay:
ранее линейный шаг стирал .085rad kick до первого обычного кадра.

Regression owner: `scripts/shotgun-presentation-owner.test.mjs`, включён в
Validate. Проверять native shot→pump, R→LMB, пустой резерв, R→switch,
R→pause→resume, выстрел вплотную к стене и попадание боковой дробиной;
HTTP/file decode, missing action/effects/ready, wrong dimensions и отказ
обоих ready. WAV работают по HTTP; прямой file использует штатный WebAudio
synthesis fallback. Реальный звук на пользовательском устройстве и hosting
требуют отдельных проверок.

## Штурмовая винтовка — Pack36

Комплект в стиле ZAP ZONE: серебристый металл, чёрные перчатки, синие
энергетические вставки и янтарные детали. Пять alpha-WebP покрывают ready,
шесть поз перезарядки, вспышку/дым/полёт пули/гильзу, мировой pickup и иконку
слота. Центральная отметка и рамка оптики — отдельные SVG. Звуки выстрела,
механики и существующие попадания используют прежние звуковые/боевые owners.
Исходники, точные prompts, размеры, alpha, бюджет и SHA256:
`asset-staging/2026-10-03-rifle-pack-36/manifest.json` и README рядом.

`src/assets/catalog.js` хранит mapping и sequences. Ready960×720 получен
из того же кадра5, что reload2304×1152 (3×2, ячейки768×576). Tactical:
5,1,2,3,5; empty:5,1,2,3,4,5. `reloadTot` остаётся authoritative:
1.935/2.408 секунды. `src/weapons/system.js` допускает замену ready только
декодированным подходящим atlas. При loading/error держит ready36;
legacy01 получает matching reload22, иначе сохраняется procedural fallback.

`src/settings/settings.js` привязывает вспышку и дым к нулевому маркеру
дула внутри трансформируемого stage. Координаты ready36:20.3%/22.5%,
измеренный угол оси ствола:-157°. Вспышка закреплена именно точкой выхода
пламени каждого tile, а не центром изображения: origins (.900,.755),
(.865,.755),(.785,.755),(.780,.755). Отдача/resize перемещают и дуло,
и огонь совместно. Runtime повторно привязывает активные rifle-эффекты
после текущего sway/recoil transform, не продвигая age или задержку дыма.
Дым закреплён нижним узким хвостом каждого кадра
(origins .60/.96, .47/.98, .68/.98, .35/.98) и поднимается от дула.
В оптике rifle вспышка и дым игрока не создаются; уже активные эффекты
скрываются при входе в прицел. Procedural fallback также не создаёт
огонь/дым в оптике при отказе ready/effects. Попадания и полёт пуль сохранены.
Один и тот же центральный прицел виден без увеличения
и внутри оптики; SVG рамка не добавляет вторую отметку.

`src/combat/combat.js` получает начало выстрела из фактического DOM-маркера,
сводит направление к ближайшей стене/цели луча прицела и проверяет укрытие
между камерой и дулом. Летящая пуля следует живому projectile/velocity,
учитывает FOV, расстояние и стены; bounded budget32 и загрузочные fallback
сохраняют процедурный объект. Гильза не рисуется дважды. Damage, gravity,
reload/ammo и исторические RNG draws сохранены. `src/game/runtime.js`
сохраняет отдачу между кадрами и переносит остаток cooldown только внутри
очереди, чтобы частота огня не зависела от обычных30/60/144 FPS.
Regression owner: `scripts/rifle-presentation-owner.test.mjs`, включён в Validate.

### Обязательные правила FPS-ассетов рук и оружия

- Кисть/перчатка → запястье → предплечье должны быть цельными во всех позах.
  Предплечье продолжается за край viewport; срез внутри игрового экрана
  недопустим. Не скрывать ошибку анатомии масштабом или обрезкой.
- В каждом ready, pin, throw/reload и recovery кадре проверять положение
  кистей и механики в игре по фактическому DOM/canvas. Проверить16:9 и другую
  форму окна, доступность прицела, HUD и переходы между позами. Atlas/contact
  sheet является вспомогательным просмотром и не заменяет игровые кадры.
- Ready и action используют один дизайн и согласованный масштаб. Alpha
  не содержит соседних ячеек, лишних полос и обрывов. Если источник не имеет
  равных рядов, сохранить фактические окна slicing в manifest. Pack36 очищает
  доказанные top32/left16 gutters и единые bottom7 исходных пикселей.
- Видимая ось ствола должна смотреть к прицелу. Огонь начинается на выходе
  дула, наследует sway/recoil, не смещается из-за размера вспышки и использует
  проверенную nozzle-точку каждого кадра. Проверять все flame frames.
- Полёт/попадание отображают реальные данные симуляции, включая близкие
  стены и удаление projectile. Повторное использование узла не должно
  показывать прежнюю пулю или оставлять скрытый fallback.
- Проверять native shot, tactical/empty reload, pause/resume, switch/cancel,
  загрузку HTTP/file и недоступный atlas. Один successful load не доказывает
  fallback; отсутствие ошибок консоли не доказывает качество кадра.

## Rocket launcher presentation — Pack35

The user authorized generation and integration together and specified ZAP ZONE's
silver/black, blue and orange sci-fi style. The rejected military prototype is not
part of the runtime. `asset-staging/2026-10-03-rocket-pack-35/` retains source PNGs,
built-in image_gen prompts, integer cell mapping, alpha, dimensions and SHA256.

Six alpha-WebP assets cover ready, six matching reload poses, muzzle ignition,
tracked missile/exhaust, explosion, lingering smoke/debris, floor scar, wall scar,
world pickup and rocket slot icon. Ready is reload source cell5; six action frames
use `[5,1,2,3,4,5]` with the existing `reloadTot`. The final regenerated source has
connected forearms exiting bottom/right; source slicing isolates the empty top12px
and left48px gutters to remove proven neighboring-cell contamination. The same
806×605 fit at(154,115) is applied to every 960×720 ready frame; action cells768×576
form a2304×1152 atlas. The muzzle marker inherits the stage transform and does not
depend on the animated flash's bounding box. Primary tuning is31.5%/36% with a measured
-152° bore; legacy34%/35% uses -149°. `rocketPresentationLayout` aligns that bore
with the live reticle and keeps both baked forearm exits beyond the viewport during
sway/recoil, including wide and tall windows.

Strict lazy probes accept exact dimensions before replacing presentation. Reload
loading/failure holds the decoded ready35. Ready failure uses legacy01 with its
matching reload24; failure of both restores the procedural rig with bounded loading.
Player/bot missiles always retain the shared 3D silver body, orange nose, glowing
bands, four radial fins, nozzle and pulsing exhaust from `mkRkt`. Pack35 flight row1
adds only cropped side-on exhaust: its painted metallic body is excluded. The DOM
exhaust uses FOV/distance and view-angle foreshortening, hides in axial views and
behind opaque walls, and is optional on decode failure. Removal clears frame caches.
Smoke originates at the actual nozzle. Powered speed starts at82% and approaches
the existing maximum with a .18s time constant; distance and speed are integrated
analytically, independent of frame partitioning.

`rocketWallContact` sweeps the whole segment against actual box meshes in local
space, including rotated/scaled walls and roofs, without the LOS endpoint tolerance.
`firstRocketContact` chooses the earliest wall/floor/actor contact; detonation, damage
and presentation receive that same point. Existing actor contact radii are retained.
Friendly bodies stop missiles but never receive hostile direct-hit damage. Launch
offsets for player and bot are guarded against nearby walls; the bot offset is .42m.
Lifetime expiry cannot advance beyond remaining active flight time. Regressions:
`scripts/rocket-contact-owner.test.mjs` plus presentation/damage tests, included in CI.

Both player and bot rocket launches have a fixed minimum interval of10 active
simulation seconds (`ROCKET_FIRE_INTERVAL`). Dedicated per-owner timers survive
reload and weapon switches; fire-rate perks do not shorten the interval. Normal
runtime and the active killcam world count down before firing; pause freezes time.
The interval starts at launch, not impact; detonation never restarts it. A player
fire attempt during rocket cooldown/reload shows the exact centered message
`Перезарядка и остывание ракетницы` for2.2s. Repeated attempts replace its existing
timer; ordinary notifications restore their normal placement. The HUD shows
remaining seconds. Rocket cooldown does not prevent other weapons
from firing. `scripts/rocket-cadence-owner.test.mjs` owns these regressions.
Base damage radius is9.1m for both owners (`ROCKET_BLAST_RADIUS`); player radius
perks remain multiplicative and existing direct damage/falloff/team rules apply.
Fireball10.64m and lingering smoke8.68m are40% larger than the previous visuals.

Impact fire/smoke use world projection and opaque-cover checks. Floor scorch is
emitted only from the authoritative floor-contact fact. Wall scorch uses the same
accepted swept segment, nearest actual mesh face, local normal and box-face bounds;
its four corners are offset0.025m outside the surface, fitted within its edges and
transformed by that mesh into world space. Fire/smoke render above the persistent
scar rather than drawing the wall mark over the blast. Both floor and wall use the existing
perspective CSS projection owner `positionGroundGrenadeDecal`, never billboard UI.
Very small edge remnants below0.12m are skipped. Damage, speed, ammo, sound and
simulation position remain unchanged by visual surface extraction.

Direct rocket collision passes its accepted hostile target through `detonateRocket`
to `applyBlastDamage`. That target takes at least its remaining HP through the normal
hurt/death/reward owner, once. Splash, cover, self-damage and friendly-fire rules
remain unchanged. Enemy rockets use the same lethal-contact rule against the player
after armor/resistance; existing respawn shield and second-wind protection still apply.
Ground/wall contacts and lifetime expiry never assign a direct target.
`scripts/rocket-damage-owner.test.mjs` verifies these gameplay boundaries.

Both scars last15 active seconds, fade during13–15 and share the existing protected
128-decal budget. Short-lived explosions cannot evict them. Pausing suspends active
time. Air bursts produce no surface scar. Rocket detonation no longer emits the
old radial impact burst, explosion ring/rays, fullscreen shockwave or Pack11 SVG
blast, including while Pack35 loads or fails. Pack35 owns decoded fire/smoke;
missing/failed effects retain only native particles, smoke, sound and light.
`engine::explode` accepts `presentation='particles'` for this fallback, while
existing boolean modes keep their original behavior and decoration RNG counts.
`scripts/rocket-presentation-owner.test.mjs` is wired into Validate. Inspect every
ready/reload frame at actual gameplay framing in16:9 and another window shape,
native shot/reload/switch, HTTP/file loading and failure paths, rotated/edge wall
contact, front/oblique/back occlusion and13/14.99/15-second expiry.

## Pack 34 — fragmentation grenade: complete arms, tracked projectile and floor crater

Local runtime integrates nine alpha-WebP files from `asset-staging/2026-10-03-grenade-pack-34`. The manifest owns source/prompt/size/hash identity and exact staging→runtime mapping. `generatedFirstPersonWeapons.grenade` and `generatedWorldWeaponPickups.grenade` use Pack34; Pack20/21 and procedural geometry remain load-error fallback.

`src/weapons/system.js` owns one ready/action layer. `grenadeThrow34` uses a full-viewport 2×4 atlas of eight 16:9 frames; the action node temporarily moves from weapon stage to viewport wrap, then returns on completion/cancellation. Both forearms must continue to viewport edges, with no cell-side stump visible inside gameplay. Review every ready/pin/wind-up/release/recovery frame at native DOM framing in 16:9 and another window shape; a contact sheet alone is not acceptance. Check HUD/crosshair clearance, anatomy, alpha, grid contamination and design continuity.

`src/combat/combat.js` owns hold/release strength, delayed frame-5 emission, projectile physics and the persistent grenade body projection. Charge saturates at 1.1s; launch speed 11.6–18 and upward lift 5.8–8.2. Fuse starts at real release (1.82s); holding is preparation, not fuse cooking. Switch/reload/pause/death/blur/hidden/restart cancel charge/pending throw without ammo consumption and stop only the obsolete grenade action. The sprite follows the authoritative live object, uses the post-physics resting fact, and disappears on detonation/removal.

`src/core/engine.js::sweepWallSphere` owns continuous sphere contact against canonical wallAABBs in three dimensions. `moveFragGrenade` consumes the first contact, reflects wall/ceiling velocity and settles on arena floor or roof. Elevated flight can clear wall tops; a sphere touching the wall still bounces. Crater uses the actual resting surface height; air bursts create no floor crater. Bounds of rotated walls retain the arena collision approximation used by character collision.

Grenade damage uses radius8m (scaled by existing player radius perk), 80% of each target maxHp through the inner25% (default2m), capped armor absorption10% (100HP:80/72), then continuous falloff to zero. Opaque wallMeshes fully block grenade damage; other explosive policies are preserved. `explode(...,4,false)` disables grenade fullscreen shockwave.

`src/settings/settings.js` owns world blast projection and floor decal projection. Blast/smoke/debris are distance-scaled and occluded. The top-down crater projects four corners onto arena floor y=-.025 (floor y=-.04), cools after .65s and fades over active seconds13–15. Transient VFX and ground decals have separate bounded eviction budgets (18/8 vs128), preventing ordinary impacts from shortening crater lifetime. Historical six presentation RNG draws remain consumed.

Regression owner: `scripts/grenade-flight-presentation-owner.test.mjs` (18 focused tests), wired into Validate. Browser evidence covers native LMB/Pointer Lock and HTTP/file decoding; remote hosting/CI require a separate publication check.

# Asset pipeline — ZAP ZONE

## Player plasma presentation pack 33 (2026-10-03)

Player ready and reload are derivatives of one generated six-frame 3×2 source.
`assets/ui/weapons/fp/player-plasma-fps-33.webp` is the exact source cell 5,
normalized to 960×720 alpha WebP (budget 250 KiB). The action atlas
`assets/ui/fx/plasma-core-reload-vfx-atlas-33.webp` is 2304×1152, six 768×576
cells (budget 512 KiB, decoded RGBA ≈10.1 MiB). All cells use the same padding
and transform; hands are baked in, so the procedural first-person rig is hidden
only after successful ready decode. Tactical sequence: 5,1,2,3,4,5;
empty sequence: 5,1,2,2,3,4,4,5. The existing `reloadTot` remains authoritative.

`showGeneratedPlasmaCoreReloadVfx()` uses a one-shot image probe before replacing
ready with the action atlas. While the atlas is loading or after failure, the
same decoded ready image is held during reload (progress/sound/timing remain),
so no other weapon body flashes and no new RNG draw is introduced. If primary
ready fails, the existing Pack31 ready and matching Pack31 reload remain fallback;
failure of both ready images returns the procedural rig and marks the load terminal
until weapon reselection (no per-frame request retry). Switching cancels action
through the existing loadId/lifecycle owner. Source/prompt/dimensions/hash mapping:
`asset-staging/2026-10-03-plasma-fp-pack-33/`.

Player plasma launch uses a zero-size `#fp-plasma-muzzle-anchor` inside the
transformed weapon stage, rather than the animated flash rectangle (whose scale
can be zero before a shot). This preserves sway/recoil and the existing convergence
ray while keeping the launch at the drawn muzzle. The shared presentation-only
`PLASMA_PROJECTILE_VISUAL_SCALE=.78` reduces both Pack30 DOM flight and procedural
plasma tracer geometry by 22%; simulation/collision and damage are unchanged.

The current user authorized generation and integration together and explicitly
excluded the upper weapon-bar icon. This pack replaces only player first-person weapon art. World pickups and the
weapon-bar retain their existing images. Shared player/bot plasma flight presentation
is scaled by .78; muzzle/flight/impact owners, balance, physics, sounds and gameplay
timers remain authoritative. Player muzzle launch uses the new stage marker.

## Pause button frame geometry

`assets/ui/panels/pause-panel-tech-01.svg` uses `preserveAspectRatio="none"`:
the drawn frame must stretch to the `.pause-actions` container instead of adding
an internal letterbox margin. CSS bounds the container at 560px/94vw, keeps buttons
inside its padding and lets long labels wrap on narrow screens. The frame path
remains at x=18..782 / y=18..242 of the 800×260 viewBox. Browser geometry checks
must test actual button bounds against these normalized visible bounds, not only
the pseudo-element rectangle. Short viewports scroll the pause menu.

## 0.0. Asset staging before runtime integration

Новые generated assets сначала должны попадать в корневой каталог `asset-staging/`, а не напрямую в runtime-`assets/`. Это обязательный review gate для ChatGPT/Codex и других AI-агентов.

Порядок:
1. пройти duplicate gate из раздела ниже и назначить конкретный consumer/event/fallback;
2. создать датированный batch в `asset-staging/YYYY-MM-DD-<pack>/`;
3. положить туда source-candidates + короткий manifest/README; **не** добавлять их в `GAME_ASSETS`, `index.html`, runtime CSS/JS или `assets/**`;
4. пользователь визуально проверяет кандидаты и явно разрешает интеграцию;
5. только после одобрения сделать runtime derivative (для коротких VFX обычно alpha-WebP sprite sheet/atlas), подключить consumer и fallback, затем выполнить validation/smoke/screenshot gate;
6. после успешной интеграции staging-source можно оставить как provenance/reference или удалить отдельным осознанным cleanup-коммитом.

Исключение для уже просмотренного в текущем диалоге source: если пользователь **сначала увидел generated preview прямо в чате, затем в этом же диалоге явно разрешил интеграцию**, тяжёлый исходный raster не обязательно дублировать в Git. В `asset-staging/YYYY-MM-DD-<pack>/README.md` всё равно фиксируются provenance, consumer/event/fallback и runtime derivative. Это исключение нельзя использовать для непросмотренных кандидатов или чтобы обойти review gate.

Почему staging находится вне `assets/**`: каталог `assets/` является runtime surface и проверяется CI как часть игры. `asset-staging/` — не runtime и не должен случайно подхватываться catalog/loader-ами до одобрения.

Для анимированных SVG в staging считать их **preview/source**, а не gameplay-time authority. При интеграции снимать детерминированные кадры и проигрывать их по elapsed time существующего game loop / `requestAnimationFrame`.


### First-person weapon identity invariant

Если generated reload/action-ассет заметно показывает или меняет корпус first-person оружия, **тот же integration pass обязан обновить обычный player-visible idle/ready asset этого оружия до того же дизайна**. Нельзя выпускать состояние, где в обычной игре игрок держит одну модель, а во время перезарядки на экране появляется другая. Reload/action и idle/ready должны происходить из одного visual source или из явно согласованного набора с одинаковыми silhouette, materials, hands, perspective и attachment layout.

Это правило относится именно к player first-person presentation. World pickup и bot geometry меняются отдельно только когда для них есть подходящий ракурс/consumer; нельзя подменять их неподходящим first-person кадром ради формального совпадения.

### Практические правила для weapon/action/VFX ассетов

Эти правила закрепляют проверенные выводы интеграции SR-9. Детали конкретного Pack32 находятся ниже; общий semantic owner остаётся `src/assets/catalog.js`.

1. **Назначить представление и событие.** First-person оружие с руками, world pickup, bot geometry, HUD icon и world projectile — отдельные consumers. First-person картинка не заменяет 3D-модель бота или изображение pickup. Для каждого нового слоя заранее записать producer/event, existing owner, lifetime/cap, anchor, заменяемый старый слой и fallback.
2. **Проверять лист по кадрам.** Generator может пересечь условную границу ячейки. Если размер не делится на сетку, вычислять границы через `floor(col*width/cols)` и `floor(row*height/rows)`, а не накапливать округлённый шаг. Удалять только доказанные соседние фрагменты, восстанавливать прозрачный margin и одинаковый padding для всех кадров. Проверить первый/последний кадр, затвор/магазин и все четыре края каждой ячейки. Чёрный фон preview не доказывает alpha — проверить формат и реальный render на светлом/тёмном фоне игры.
3. **Сохранять качество в реальном размере.** Сначала оценить размер оружия в desktop/mobile viewport, затем выбрать cell resolution и byte/decode-memory budget. Не уменьшать готовый frame до крошечной runtime-ячейки и затем увеличивать его для idle. Ready следует брать из полного approved source; action должен сохранять достаточную detail density. Размеры/сетка/alpha/budget и SHA-256 derivative должны совпадать в manifest, catalog, docs и regression.
4. **Один дизайн во всех состояниях.** Ready/reload/bolt должны сохранять silhouette, materials, scope, hands, camera и padding. Конечный кадр должен возвращаться к ready; проверять это через явный frame mapping. Разный физический смысл требует разных sequences: tactical reload не обязан повторять empty chambering. Уже существующий reload/cycle timer остаётся gameplay authority.
5. **Механическое событие имеет одного producer.** Гильза появляется при открытии затвора, магазин — при reload, эффекты выстрела — после emitted shot. Если гильза нарисована внутри action, не добавлять вторую DOM-гильзу. Если она отдельная, не встраивать её в action. World effect и first-person art могут иметь отдельные consumers, но нельзя принять их за два gameplay-события. Таймер/guard должен гарантировать exactly-once через несколько update-кадров.
6. **Fallback проверяется загрузкой.** Наличие пути/spec и успешное присваивание CSS background не доказывают image decode. До подмены слоя использовать успешный image probe (`complete` плюс ненулевые natural dimensions); при loading/failure сохранять старое отображение. Не делать бесконечный retry. Для ready допустима bounded цепочка approved art → legacy art → procedural. Смена оружия должна отменять action и защищать callbacks от старого loadId.
7. **Замена слоя сохраняет RNG.** Presentation helpers иногда используют общий `Math.random()`. Нельзя просто пропустить старый helper после загрузки картинки: это меняет последующую стрельбу/AI. Сохранять исторические draws через existing silent/visible flag и проверять настоящие owners, а не заглушки. Число/порядок draws должны совпадать при ready/loading/failure и для branch-условий вроде smoke. Не добавлять новые gameplay RNG draws для выбора косметического кадра.
8. **Проверять anchors в игре.** После crop/padding измерить muzzle, receiver/ejection и magazine относительно ready/action stage. Компактный muzzle и короткий trail не должны закрывать прицел или HUD; проверить, какие procedural и legacy overlays они заменяют. Не принимать корректный atlas за доказательство правильной позиции/размера или отсутствия дублирования.
9. **Проверять последовательности и failure paths.** После syntax → stamp/check → structure → focused owner regressions выполнить HTTP boot и direct-file menu/parity smoke. В игре: shot → bolt → ADS return, tactical/empty reload, switch во время reload/bolt, повторные события, реальный отказ новых image requests. ADS возвращается через существующий blend, поэтому assertion ждёт его конечного условия, а не мгновенного появления scope в кадре завершения action.
10. **Разделять доказательства.** Source/VM проверяет mapping, guards, timing и RNG; browser screenshot/render проверяет загрузку, положение, прозрачность и слои; fault injection проверяет запасные изображения. Synthetic Pointer Lock не доказывает нативный захват мыши. Local HTTP не доказывает конкретный HTTPS/uCoz deployment, а локальный workflow run не доказывает remote CI. Сохранять build/hash и обозначать эти границы явно.

## SR-9 sniper presentation pack 32 (2026-10-03)

The user reviewed both built-in image_gen source sheets in the current chat and explicitly approved integration. Source PNGs, prompts and derivative hashes are retained in `asset-staging/2026-10-03-sniper-pack-32/`.

- `assets/ui/weapons/fp/player-sniper-fps-32.webp`: 960x720 ready art, from action source frame 11.
- `assets/ui/fx/sniper-action-vfx-atlas-32.webp`: 2048x1536 alpha WebP, 4x4 equal 512x384 cells. Frames 0-11 reload; frames 12-15 bolt. Shared transparent padding preserves the ready/reload/bolt silhouette and camera. The larger atlas retains source detail during the action rather than magnifying half-resolution cells.
- `assets/ui/fx/sniper-effects-vfx-atlas-32.webp`: 512x512 alpha WebP, four frames per row: compact muzzle flash, smoke, bullet/wake and empty brass casing.

`catalog.js` owns frame mapping. `system.js` reuses the existing elapsed-time action player: tactical reload ends at frame 11; empty reload adds the bolt/chamber sequence; bolt uses `11,12,13,14,15,11`. Durations remain the authoritative `reloadTot`/`cycleTot`. Scope returns through the existing ADS blend after the bolt action. Switching cancels the action through the existing weapon owner.

Pack32 contains no baked casing: the existing `runtime.js` cycle event emits its separate casing at `cycleP > .38`, exactly once. Legacy Pack22 retains its embedded-casing suppression. This is a first-person presentation layer; the procedural world casing remains a separate fallback/world effect.

Image probes enable actions/effects only after decode. Missing action keeps magazine/recoil presentation; missing effects keep Pack23 and procedural muzzle/trail. Ready art falls back once to legacy SR-9 art, then to the procedural rig. While Pack32 effects are ready, they replace the old player muzzle particles/beam and center-screen trail; silent owners still consume their historical RNG draws. Full reload similarly consumes the old magazine-rotation draw without adding a second overlay. Hitscan, damage, penetration, balance, sound, scope image, pickups and bot geometry stay with their existing owners.

Regression: `node --test scripts/sniper-presentation-owner.test.mjs`, also wired into the existing validation workflow. Browser verification must cover HTTP and direct `file://`, partial/empty reload, shot/bolt/ADS return, switch cancellation and failed image fallbacks. Synthetic native-input fixtures do not verify native Pointer Lock.

## Generated Plasma Core Reload + Player Weapon Identity Pack 31 (2026-09-30)
The generated 4×3 plasma-core reload sheet was reviewed in the current ChatGPT dialog and explicitly approved for integration under the same-dialog source exception.

Runtime derivatives:
- `assets/ui/fx/plasma-core-reload-vfx-atlas-31.webp` — 720×405 VP8X alpha-WebP, 4×3 / 12 source frames with 180×135 4:3 padded cells;
- `assets/ui/weapons/fp/player-plasma-fps-31.webp` — 960×720 VP8X alpha-WebP ready-state render derived from frame 12 of the same approved weapon source.

Integration rules:
- Pack33 now owns the primary player plasma path; Pack31 ready/reload are the matched fallback after primary ready failure;
- `src/weapons/system.js` reuses the existing Pack 22 action owner; tactical plasma reload uses source frames `0,1,2,3,4,6,7,8,9,11`, while empty reload uses all twelve frames;
- `src/combat/combat.js` starts Pack 31 from the authoritative reload timer. A successfully started full action suppresses the generic magazine-drop overlay and the legacy Pack 11 completion-only energy-lock overlay;
- if the full Pack 31 action cannot start, the existing generic magazine-drop + Pack 11 `plasmaReload` completion effect remain fallback; if the ready image fails, the procedural first-person plasma rig remains fallback;
- the Pack 31 ready-state muzzle anchor is retuned to the approved image composition; recoil, muzzle/discharge VFX, projectile flight Pack 30, impact VFX, ammo transfer and reload timing remain authoritative and unchanged.

The heavy 1448×1086 reviewed source PNG is not duplicated in Git. ChatGPT generation identity `fe049d05-5989-4242-901d-bd963dcd611d` and source/runtime mapping are recorded in `asset-staging/2026-09-30-vfx-pack-31/README.md`.

## Generated Plasma Flight VFX Pack 30 (2026-09-30)
The generated 4×4 plasma bolt / ion-sheath source sheet was reviewed in the current ChatGPT dialog and explicitly approved for integration under the same-dialog source exception.

Runtime derivative:
- `assets/ui/fx/plasma-flight-ion-sheath-vfx-atlas-30.webp` — 256×256 VP8X alpha-WebP, 4×4 / 16 frames, 64×64 per cell, 24,616 bytes; SHA-256 `4e6a814a7a6010f956a1a4b885a56dca1efdc64b06e58976f58c3da084dfa4a6`.

Integration rules:
- `src/combat/combat.js` tracks the real player/bot plasma bullets in `pBullets` / `eBullets`; no duplicate gameplay projectile is created;
- frames 0–3 form the launch/charge-in, frames 4–11 provide deterministic sustained-flight variation, and frames 12–15 cover late-life breakup/fade;
- presentation is projected from each authoritative bullet position and velocity, distance-scaled, capped, hidden off-screen and behind LOS geometry, and consumes no gameplay RNG;
- a lightweight image probe gates the tracked layer. Until the atlas loads, or after a load failure, Pack 8's existing plasma trail remains the visual fallback;
- when Pack 30 is ready the old Pack 8 plasma overlay is hidden, but its existing trail-rotation RNG draw is deliberately still consumed so gameplay RNG ordering cannot shift;
- the existing Three.js plasma tracer/core, projectile motion/drop, collision, damage, penetration, AI and impact VFX remain authoritative/fallback.

The heavy reviewed 1254×1254 source PNG is intentionally not duplicated in Git. ChatGPT generation identity `86aabc48-76a6-4ac5-b768-9377f28bb473` and source/runtime mapping are recorded in `asset-staging/2026-09-30-vfx-pack-30/README.md`.

## Попадания пуль по поверхностям — Pack45

Текущий общий owner сочетает подробный Pack29 и компактный Pack45. `settings.js::showGeneratedSurfaceImpactVfx` выбирает concrete/metal/heavy Pack29 на всех расстояниях; дерево использует Pack45. Нет переключения на старые светящиеся эффекты после48/26м. `preloadGameContent` заранее запускает одноразовые image probes, не задерживая игру; exact320×320 /768×512 readiness защищает выбор ассетов. При отказе Pack29 используется материал Pack45, при отказе обоих — существующие частицы и отметка `engine.js::wallImpact`.

Pack29: `assets/ui/fx/surface-impact-vfx-atlas-29.webp`, alpha-WebP320×320,4×4. Concrete sequence[0,1,2,2,3,3], metal[0,1,2,3], heavy[1,1,2,2,3,3]; первая heavy-ячейка с запечённым кольцом исключена. Timeline.24–.36s, physical width.95–1.24m, zero pixel floor и верхний предел128–150px. Pack45: `assets/ui/fx/surface-impact-atlas-45.webp`, alpha-WebP768×512,6×4, ячейка128px с8px прозрачными полями; runtime проигрывает только первые три кадра каждого ряда(.16–.26s). Последние круглые пылевые облака не используются. Физический размер.72–1.16m, верхний предел82–110px; contact anchor originY=.64.

Общий DOM player учитывает FOV, расстояние, стены, дым, offscreen и active-time cleanup. CSS normal alpha/filter:none убирает декоративное свечение. Исторический RNG draw и throttle сохранены; электрический tech-ряд не выбирается. Не используется GPU raster texture.

`settings.js::showGeneratedPenetrationExitVfx` больше не создаёт золотое кольцо с треугольниками из Pack12; один прежний RNG draw сохранён. Оба projectile caller в combat по-прежнему вызывают `wallImpact` на выходе и продолжают реальный полёт после пробития. Общий Pack12 не удаляется, поскольку содержит другие эффекты. Процедурные частицы/малые bullet marks, звук, collision, damage, penetration, ricochet и AI сохраняют владельцев.

Источники, prompt, SHA256, exact cell windows и reproducible derivative: [asset-staging/2026-10-06-surface-impact-45](../asset-staging/2026-10-06-surface-impact-45/README.md). Текущие проверки и первое ограничение fixture: [REVISION_VERIFICATION.md](../asset-staging/2026-10-06-surface-impact-45/REVISION_VERIFICATION.md). Regression: `scripts/surface-impact-presentation-owner.test.mjs`.

## Generated Surface Impact VFX Pack 29 (2026-09-30)
Историческое описание первоначальной интеграции. Текущие последовательности Pack29/45, decode и отключённые кольца определены общим контрактом выше; прежние правила terminal/distance/fallback ниже не действуют.
The generated 4×4 surface-impact source sheet was reviewed in the current ChatGPT dialog and explicitly approved for integration under the same-dialog source exception.

Runtime derivative:
- `assets/ui/fx/surface-impact-vfx-atlas-29.webp` — 320×320 VP8X alpha-WebP, 4×4 / 16 source frames, 80×80 per cell; the reviewed 1254×1254 generator raster was cleaned of fringe/noise and normalized before runtime encoding.

Integration rules:
- row 0 provides concrete/dust impact stages, row 1 metal/ricochet stages, row 2 cyan electrical/tech-panel stages and row 3 heavier debris stages;
- the existing bounded elapsed-time DOM VFX player owns playback; Pack 29 does not create a second animation loop or persistent Three.js texture sprite;
- `wallImpact()` stays authoritative for surface presentation, sparks/smoke and decals; nearby existing terminals select only the cyan presentation variant while retaining their existing ballistic material/penetration semantics;
- SR-9 wall hits, real wall penetration and only the marker-eligible first player shotgun pellet may request the heavy presentation; metal keeps the metal row even for heavy requests;
- Historical: Pack29/Pack10 fallback is retired by Pack45; current bullet surfaces use Pack45 at every distance and procedural fallback on load failure; wall-penetration presentation remains separate; Pack 12 ricochet fan and Pack 27 terminal cable/arc overlays are retired;
- no new gameplay RNG draw is introduced; damage, projectile flight/drop, penetration, ricochet probability, collision, AI and sound authority stay unchanged.

The heavy reviewed source PNG is not duplicated in Git. Generation identity `69e5b2b7-e8da-48d3-8a3e-d5e790438d7d` and source/runtime mapping are recorded in `asset-staging/2026-09-30-vfx-pack-29/README.md`.

## Generated Rocket Flight VFX Pack 28 (2026-09-30)
The generated 4×3 rocket-exhaust source sheet was reviewed in the current ChatGPT dialog and explicitly approved for integration under the same-dialog source exception.

Runtime derivative:
- `assets/ui/fx/rocket-flight-exhaust-vfx-atlas-28.svg` — 768×576, scriptless 4×3 / 12-frame transparent SVG atlas preserving the approved white-hot/blue core, orange flame, sparks and grey-smoke silhouette.

Integration rules:
- `src/combat/combat.js` keeps the existing Three.js rocket object authoritative and projects only presentation art into the existing `#projectile-trail-layer`;
- the atlas follows both player and bot rockets from their real world position and projected velocity, scales with camera distance, and hides when off-screen or blocked by world LOS geometry;
- ignition uses frames 0–3, sustained flight loops deterministically across frames 4–9 with a per-rocket presentation phase; gameplay RNG is not consumed;
- the existing additive Three.js flame meshes plus procedural smoke/sparks remain compatibility/fallback presentation;
- rocket speed, acceleration, collision, warning logic, damage, blast radius, ownership, AI and explosion timing remain unchanged.

The heavy reviewed source PNG is not duplicated in Git. Generation identity and source/runtime mapping are recorded in `asset-staging/2026-09-30-vfx-pack-28/README.md`.

## Generated Weapon Discharge + Heavy Explosion VFX Pack 26 (2026-09-30)
The two newly generated source sheets were reviewed in the current ChatGPT dialog and explicitly approved for integration under the same-dialog source exception.

Runtime derivatives:
- `assets/ui/fx/weapon-discharge-vfx-atlas-26.webp` — 512×192 alpha WebP, 4×2 / 8 frames: row 0 ballistic discharge for pistol/rifle, row 1 cyan energy discharge for plasma;
- `assets/ui/fx/heavy-explosion-vfx-atlas-26.webp` — 512×192 alpha WebP, 4×2 / 8 representative ignition/fire/smoke stages.

Integration rules:
- both assets use the existing DOM-only elapsed-time VFX player; they are not loaded into persistent WebGL planes/sprites;
- the Pack 26 ballistic/energy discharge sheet remains catalogued for provenance, but is no longer projected over player pistol/rifle/plasma shots because its cells contain a baked second weapon/hands silhouette; those shots use the dedicated first-person muzzle flash plus the existing procedural muzzle/impact presentation;
- the existing rocket Pack 11 explosion remains primary/fallback and Pack 26 decorates every third rocket deterministically; the existing bomb Pack 12 detonation remains primary/fallback and Pack 26 adds the heavier fire/smoke layer;
- no new gameplay RNG draw is introduced by variation selection; ammo, damage, blast radius, projectile physics, recoil, cadence and timing stay authoritative and unchanged;
- source generator rasters are not duplicated in Git; provenance and source identities are recorded in `asset-staging/2026-09-30-vfx-pack-26/README.md`.

## Generated VFX Pack 27 — runtime retirement (2026-10-06)
The player respawn gate was removed from runtime: `assets/ui/fx/player-respawn-gate-vfx-atlas-27.svg`, its catalog/spec entry, anchor/CSS and playback wiring are gone. Spawn timing and protection remain gameplay-authoritative with no generated gate around the player.

The terminal atlas `assets/ui/fx/terminal-electrical-arc-vfx-atlas-27.svg` remains only as a compatibility/provenance entry; `showGeneratedTerminalArcVfx()` still returns `false` and allocates no visual effect. Staging sources remain provenance only.

## Generated Weapon Action VFX Pack 25 (2026-09-30)
The two newly generated first-person action sheets were reviewed in the current ChatGPT dialog and explicitly approved for integration under the same-dialog source exception.

Runtime derivatives:
- `assets/ui/fx/pistol-reload-vfx-atlas-25.webp` — 960×540 alpha WebP, 4×3 / 12 frames. Each frame is padded to a 4:3 cell before WebP encoding so the existing first-person action stage does not stretch the approved hands/weapon silhouette.
- `assets/ui/fx/shotgun-pump-cycle-vfx-atlas-25.webp` — 1024×384 alpha WebP, 4×2 / 8 frames with 4:3 padded cells; the source weapon proportions remain unchanged.

Integration rules:
- both actions reuse the Pack 22 first-person elapsed-time action owner; no second animation loop or timer is introduced;
- pistol tactical reload uses frames 0–7 then 11, skipping the late slide-rack phase, while an empty reload uses all twelve frames; both are stretched to the authoritative existing `reloadTot` duration;
- the full pistol action suppresses only the generic Pack 10 magazine-drop overlay while it is available; procedural/generated static pistol presentation remains the fallback;
- shotgun pump playback starts only from the existing authoritative `cycleTime` state after a real shot; the real Three.js shell ejection remains unchanged, while the old DOM shell-spin overlay is suppressed only when the full pump atlas is active;
- ammo transfer, reload/cycle duration, firing cadence, recoil, damage, pellet simulation, casing physics and gameplay RNG remain unchanged.

The heavy reviewed generator sources are not duplicated in Git. Provenance and consumer/fallback mapping are recorded in `asset-staging/2026-09-30-vfx-pack-25/README.md`.

## Generated Weapon Utility Action VFX Pack 24 (2026-09-30)
The two newly generated first-person action sequences were reviewed in the current ChatGPT dialog and explicitly approved for integration under the same-dialog source exception.

Runtime derivatives:
- `assets/ui/fx/rocket-reload-vfx-atlas-24.webp` — 720×405 alpha WebP, 4×3 / 12 frames;
- `assets/ui/fx/mine-throw-vfx-atlas-24.webp` — 1080×135 alpha WebP, 6×1 / 6 frames.

Integration rules:
- both assets reuse the existing Pack 22 first-person action layer instead of creating another animation owner;
- rocket playback is stretched to the authoritative `reloadTot` duration; it replaces only presentation and suppresses Pack 10 magazine-drop while the full action is active;
- mine playback is emitted only after the authoritative mine object is already in the live `mines` collection;
- static generated first-person art and procedural Three.js remain fallback if the action atlas cannot start;
- reload timing, ammo transfer, mine ammo/cooldown/flight/arming, damage, recoil and gameplay RNG remain unchanged.

The reviewed 1536×1024 RGBA contact sheet is not duplicated in Git. The source mapping, exact derivative dimensions and fallback contract are recorded in `asset-staging/2026-09-30-vfx-pack-24/README.md`.

## Sniper VFX Asset Pack 23 (2026-09-30)
Five generated SR-9 source sheets reviewed in the current ChatGPT dialog are integrated under the same-dialog source exception. They cover muzzle flash/smoke, post-shot smoke, visible rifle bullet flight, supersonic pressure wake and rotating brass casings.

To reduce browser requests and payload, the five heavy PNG sources are normalized into three alpha-WebP runtime atlases:
- `assets/ui/fx/sniper-shot-vfx-atlas-23.webp` — 768×768 / 4×4: rows 0–1 muzzle flash + immediate smoke, rows 2–3 delayed smoke plume;
- `assets/ui/fx/sniper-ballistics-vfx-atlas-23.webp` — 768×768 / 4×4: rows 0–1 visible bullet/trail, rows 2–3 supersonic pressure wake;
- `assets/ui/fx/sniper-casing-vfx-atlas-23.webp` — 768×576 / 4×3: twelve rotating rifle-casing poses.

Integration rules:
- the existing SR-9 hitscan, damage, penetration, recoil, cadence and 70 ms Three.js trace remain authoritative; Pack 23 only decorates the shot;
- muzzle flash and delayed smoke play on every SR-9 shot, while bullet/trail and supersonic wake alternate deterministically by presentation shot count without consuming gameplay RNG;
- the ballistic overlay is oriented from the actual first-person muzzle DOM anchor toward the screen reticle, so the source side-view bullet is aligned with the player shot direction on screen;
- Pack 22 remains the primary bolt-cycle presentation and already contains visual casing extraction. Pack 23 casing playback is therefore used only if the full Pack 22 bolt action is unavailable, preventing duplicate casings; the real Three.js casing object remains authoritative in both cases;
- Pack 10 sniper pressure, Pack 8 projectile trail and procedural muzzle/trace assets remain existing compatibility/fallback layers, but no gameplay state depends on Pack 23.

The five 1448–1774 px reviewed source PNGs are not duplicated in Git. Their generation identities and merge mapping are recorded in `asset-staging/2026-09-30-vfx-pack-23/README.md`.

## Generated Weapon Action VFX Pack 22 (2026-09-30)
The two first-person source sheets generated and reviewed in the current ChatGPT dialog are approved for runtime integration under the same-dialog source exception.

Runtime derivatives:
- `assets/ui/fx/rifle-reload-vfx-atlas-22.webp` — 720×480 alpha WebP, 4×3 source grid; tactical reload uses frames 0–7 then 11, while empty reload uses all 12;
- `assets/ui/fx/sniper-bolt-cycle-vfx-atlas-22.webp` — 720×480 alpha WebP, 4×3 / 12 frames for SR-9 bolt lift, extraction/ejection, chambering, lock and return.

Integration rules:
- playback is elapsed-time driven by the authoritative existing `reloadTot/reloadT` and `cycleTot/cycleT` durations rather than internal image animation;
- action art temporarily replaces the normal generated first-person weapon image inside the same bounded DOM stage, so the static weapon is never double-rendered underneath;
- SR-9 scope presentation is hidden only while the bolt action is active and can return if ADS is still held afterwards;
- rifle magazine-drop and sniper generic casing presentation remain fallbacks when the full action atlas cannot start; the real Three.js casing ejection remains unchanged;
- no ammo transfer, reload/cycle duration, damage, recoil, cadence, projectile or RNG semantics are owned by Pack 22.

The 1536×1024 reviewed source rasters are not duplicated in Git. Provenance is recorded in `asset-staging/2026-09-30-vfx-pack-22/README.md`.

## Grenade VFX Asset Pack 21 — selected sheet #2 (2026-09-30)
The user explicitly selected the **second generated grenade sheet** from the current dialog. It is treated as reviewed art direction under the same-dialog source exception. The heavy 1774×887 raster concept sheet is not duplicated into runtime; its stable source identity is recorded in staging and three compact scriptless SVG atlases reproduce the useful missing states.

Runtime derivatives:
- `assets/ui/fx/frag-grenade-flight-fuse-atlas-21.svg` — 8 flight-trail frames + 8 live-fuse warning frames;
- `assets/ui/fx/frag-grenade-explosion-smoke-atlas-21.svg` — 8 realistic fireball frames + 8 post-blast smoke frames;
- `assets/ui/fx/frag-grenade-debris-scorch-atlas-21.svg` — 16 fragment/debris frames + 5 hot-to-dark scorch frames.

Integration rules:
- flight trail follows the authoritative Three.js grenade object through the existing DOM VFX layer; no duplicate gameplay projectile is created;
- fuse warning begins only in the last 0.78 s and only for grenades within 25 m of the camera;
- detonation retains Pack 15's stylized shrapnel bloom and layers Pack 21 fireball/debris/smoke/scorch presentation on the same authoritative explosion event;
- smoke and scorch use delayed elapsed-time playback so the fireball leads the sequence naturally;
- damage, radius, fuse duration, bounce physics, ammo, ownership and XP remain unchanged.

The generic VFX player now supports optional tracked `worldObject` positioning and presentation-only `delay`; existing callers use the previous zero-delay/static-world behavior. All Pack 21 assets are static SVG (no scripts/self-running animation/raster embedding) and stay out of persistent Three.js texture geometry.

## Grenade + Bomb Asset Pack 20 (2026-09-30)
Pack 20 adds a real player fragmentation grenade instead of repurposing the mine, and keeps the separately approved bomb placement/arming asset as a real runtime effect.

Runtime paths:
- `assets/weapons/grenade.svg` — compact weapon-bar/procedural fallback identity;
- `assets/ui/weapons/fp/player-grenade-fps-20.svg` — retained as the reviewed Pack 20 source/runtime derivative, but Pack34 now supplies the live idle first-person grenade; this flat Pack20 placeholder remains historical source;
- `assets/ui/pickups/weapons/world-grenade-pickup-20.svg` — generated-direction map pickup presentation;
- `assets/ui/equipment/frag-grenade-ui-atlas-20.svg` — 2×2 inventory/pickup/readiness/attack identity atlas;
- `assets/ui/fx/frag-grenade-throw-vfx-atlas-20.svg` — 4×2 / 8 deterministic first-person throw frames;
- `assets/ui/fx/player-bomb-arm-vfx-atlas-20.svg` — 4×2 / 8 deterministic bomb placement/arming frames.

The grenade is appended as weapon index 9 / keyboard slot `0`, preserving historical indices 0–8 and the existing bomb perk's index-6 contract. First pickup gives the 2-grenade ready load plus a small 1–3 reserve grant; reserve is capped at 12. The projectile reuses the battle-tested frag bounce/fuse loop with `ownerType:'player'`, so blast ownership, enemy filtering, XP/kills and self-damage use the existing authoritative explosion path. Pack34 supplies the decoded detonation effects; Pack15/21 remain fallback.

Bomb arming presentation is emitted only after the authoritative bomb has already been inserted into the live explosive collection. All Pack 20 SVG derivatives are static/scriptless and presentation-only; Three.js gameplay geometry remains the fallback. Provenance is recorded in `asset-staging/2026-09-30-vfx-pack-20/README.md`.

## Generated Asset Pack 19 — landing VFX retired (2026-10-06)
The landing dust/metal runtime derivative `assets/ui/fx/landing-impact-vfx-atlas-19.svg` and all `landingDust` / `landingMetal` playback, anchors and CSS were removed. Airborne → grounded physics remains unchanged. Pack42 owns the current smoke-grenade presentation; Pack19 staging material remains provenance only.

## Generated Asset Pack 18 — footsteps/medkit VFX retired (2026-10-06)
The shared `assets/ui/fx/player-action-vfx-atlas-18.svg` remains because rows 0–1 still provide the shotgun shell-insert presentation. Runtime mappings for rows 2–6 were removed: `footstepMetal`, `footstepDust`, `footstepWater`, `medkitHeal` and `medkitArmor` no longer have specs, helpers, anchors, consumers or CSS. Footstep audio, movement, medkit healing/armor conversion and pickup economy remain unchanged.

## Generated Asset Pack 17 — retired (2026-10-06)
`assets/ui/fx/interaction-vfx-atlas-17.svg` was removed from runtime together with `botReload`, `botHit` and `pickupCollect` specs, helpers, consumers and CSS. Bot reload/damage logic and pickup grants still run normally; only these generated decorations were deleted. Staging files remain provenance only.

## Generated Asset Pack 16 — fully retired (2026-10-06)
`assets/ui/fx/bot-action-vfx-atlas-16.svg` was removed from runtime. The remaining `botPlasmaMuzzle` row was identified as the bright cyan/white expanding-ring effect visible in firefights and was removed together with its spec, helper/consumer and CSS. Earlier `botDodge` and `botSpawn` rows were already retired. Plasma projectile simulation, audio, bot fire cadence and procedural muzzle feedback remain unchanged.

## Generated Asset Pack 15 (2026-09-30)
Approved staging sources from `asset-staging/2026-09-30-vfx-pack-15/` are integrated as two deterministic scriptless runtime atlases:
- `assets/ui/fx/frag-grenade-shrapnel-bloom-atlas-15.svg` — 8×1 static frames for bot frag-grenade detonation;
- `assets/ui/fx/player-death-signal-collapse-atlas-15.svg` — 8×1 16:9 static frames for the short player death → kill-camera transition.

`src/combat/combat.js::tickBotGrenades()` emits the frag decoration after the existing procedural explosion/impact event, while `src/progression/progression.js::checkDeath()` starts the death overlay only after `startDeathCamera(killer)` has transferred view ownership. The death atlas advances from the dedicated dying loop in `src/game/runtime.js`, so the effect remains elapsed-time driven even while ordinary gameplay presentation ticking is paused. `cleanupDeathCamera()` owns cleanup. A reduced-motion preference keeps a brief static pulse instead of fracture/glitch frame motion.

Damage, fuse timing, blast radius, team filtering, respawn delay, kill-camera ownership, death text and existing procedural/CSS/audio fallbacks remain authoritative and unchanged. The animated staging SVGs remain provenance/review sources only.

## Generated Asset Pack 14 — retired (2026-10-06)
`assets/ui/fx/player-feedback-vfx-atlas-14.svg` was removed from runtime. The generated `criticalHit` and `playerArmorBreak` specs, helpers, consumers and CSS are gone. Critical damage, ordinary impact feedback, armor depletion and the existing non-Pack14 HUD feedback remain authoritative.

## Generated Asset Pack 13 — fully retired (2026-10-06)
`assets/ui/fx/bot-combat-vfx-atlas-13.svg` was removed from runtime. The final row-0 `botMuzzle` generated blast was the bright orange/white expanding muzzle effect seen floating in firefights and is now removed together with its spec/helper/consumer. Row-1 `botDeath` had already been retired. Bot fire cadence, projectiles/hitscan, audio, damage, rewards, gibs and procedural `trigMuzzle(...)` feedback remain unchanged.

## Generated Asset Pack 12 (2026-09-30)
Approved staging sources from `asset-staging/2026-09-30-vfx-pack-12/` are integrated into one static-frame runtime atlas:
- `assets/ui/fx/combat-vfx-atlas-12.svg` — 8×5 / 40-frame mega-atlas;
- row 0: historical ricochet spark fan, disabled by showGeneratedRicochetVfx;
- row 1: wall-penetration exit debris;
- row 2: smoke deployment bloom;
- row 3: mine shrapnel detonation;
- row 4: bomb pressure-core detonation.

The atlas is scriptless and has no internal SVG animation. `generatedCombatVfxFrame(...)` now supports a row offset for shared static atlases, while playback remains elapsed-time driven and bounded by the existing Pack 10/11 DOM VFX budget. Player and bot ricochets/penetrations share the same presentation hooks; smoke bloom decorates only cloud deployment; mine/bomb effects decorate existing detonation events. Physics, damage, fuse, smoke density/LOS and audio stay authoritative in current gameplay code, with all procedural presentation retained as fallback.

## Generated Asset Pack 11 (2026-09-30)
Approved staging sources from `asset-staging/2026-09-30-vfx-pack-11/` are now integrated.

Runtime paths:
- `assets/ui/fx/rocket-explosion-fireball-atlas-11.svg` — 4×3 / 12-frame world rocket detonation fireball;
- `assets/ui/fx/plasma-impact-ion-bloom-atlas-11.svg` — 4×3 / 12-frame plasma impact bloom for actor and wall hits;
- `assets/ui/fx/plasma-reload-energy-lock-atlas-11.svg` — 4×2 / 8-frame local first-person plasma reload completion lock.

These runtime files are **static-frame SVG sprite atlases**, not self-animating SVGs. The staging art is geometric vector VFX, so preserving it as compact SVG avoids unnecessary raster resampling/binary-upload risk while keeping deterministic elapsed-time playback through the existing Pack 10 VFX player. The game remains authoritative: rocket/plasma/reload events trigger the presentation layer, procedural impact/explosion/reload feedback remains fallback, simultaneous DOM effects stay bounded and off-screen world effects are hidden by projection.

The staging source candidates remain in `asset-staging/` as provenance/reference. They are not imported by runtime code.

## Generated Asset Pack 10 (2026-09-30)
Runtime file:
- `assets/ui/fx/combat-vfx-atlas-10.webp` — единый 8×10 alpha-WebP mega-atlas 448×560, cell 56×56, <=128 KiB.

Логические rows/consumers:
- row 0 · `rocket-backblast-sheet-01` · 6 frames → player rocket shot / muzzle anchor;
- row 1 · `sniper-pressure-blast-sheet-01` · retired/unreachable shared atlas row; no runtime spec or consumer;
- row 2 · `shotgun-muzzle-smoke-sheet-01` · 8 frames → player shotgun shot / muzzle anchor;
- row 3 · `brass-casing-spin-sheet-01` · 8 frames → player pistol/rifle + SR-9 bolt ejection;
- row 4 · `shotgun-shell-spin-sheet-01` · 6 frames → player pump-cycle ejection;
- row 5 · `magazine-drop-sheet-01` · 8 frames → non-shell pistol/rifle/plasma/SR-9 reload;
- row 6 · `concrete-impact-burst-sheet-01` · 8 frames → concrete `wallImpact`;
- row 7 · `metal-impact-sparks-sheet-01` · 8 frames → metal `wallImpact`;
- row 8 · `wood-impact-splinter-sheet-01` · 5 frames → wood `wallImpact`;
- row 9 · `near-miss-air-streak-sheet-01` · retired/unreachable shared atlas row; suppression gameplay/audio remains without generated streak art.

Pack 10 intentionally stores ten semantic animations in one physical atlas. The catalog owns row/frame/duration metadata; `src/settings/settings.js` owns bounded DOM playback and cleanup; combat/runtime/engine only emit presentation hooks from existing authoritative events. Playback is elapsed-time based, not callback-count based. Procedural muzzle, casing, wall-impact and suppression feedback remains fallback, and the atlas is never passed to `TextureLoader`, `makeAssetPlane` or `makeAssetSprite`.

## Generated Asset Pack 9 (2026-09-30)
Runtime paths:
- `matchDeploy`, `frontlineRetarget`, `secondWindRescue` and `dodgePhase` were retired on 2026-10-06; their standalone runtime SVGs and DOM/CSS/playback wiring were deleted.
- `assets/ui/perks/perk-path-crest-atlas-01.svg` — assault/survival/demolition/precision/mobility crests.
- `assets/ui/equipment/equipment-readiness-atlas-01.svg` — mine/bomb/smoke ready/cooldown states.
- `assets/ui/objective/frontline-capture-progress-frame-01.svg` — decorative capture-progress frame.
- `assets/ui/bots/ally-tactical-callout-atlas-01.svg` — ally-only tactical callouts.
- `assets/ui/panels/pause-panel-tech-01.svg` — pause tactical shell.
- `assets/ui/mobile/mobile-control-icons-atlas-01.svg` — six touch-control icons.

Pack 9 uses a better workflow for geometric HUD art: the image-generator contact sheet is the visual source, but the committed runtime derivative is rebuilt as compact SVG when the asset is mostly lines, crests, panels or icons. That removes binary-upload corruption risk, stays crisp across DPI and preserves HTTP(S) + direct `file://` parity. Painterly effects, backgrounds and first-person renders remain raster/WebP candidates.

## Generated Asset Pack 8 (2026-09-29)
Runtime paths:
- `assets/ui/combat/reticle-identity-atlas-01.webp` — weapon-class reticle identities layered over the existing dynamic crosshair.
- `assets/ui/minimap/minimap-marker-atlas-01.webp` — player/ally/pickup/objective/player-deployable tactical markers.
- spawn-protection generated art was retired on 2026-10-06; the gameplay shield timer remains, but its standalone WebP/DOM/CSS presentation was deleted.
- `assets/ui/feedback/respawn-countdown-atlas-01.webp` — 15-state respawn ring; numeric seconds remain a text fallback.
- `assets/ui/explosives/explosive-fuse-atlas-01.webp` — safe/arming/armed/danger fuse states projected over mines and bombs.
- generated Pack 8 center-screen projectile-trail overlay was retired on 2026-10-06: `assets/ui/fx/projectile-trail-atlas-01.webp`, its catalog/frame helper, overlay CSS and shot consumer remain deleted. The shared DOM container `#projectile-trail-layer` is intentionally retained because it is the projection surface for real world-owned mine, bomb, rocket, plasma, grenade and rifle/shotgun/pistol flight art.
- `assets/ui/weapons/weapon-switch-swipe-atlas-01.webp` — seven-frame equip/switch swipe.
- `assets/ui/bots/bot-overhead-frame-atlas-01.webp` — ally/enemy overhead combat frames around the authoritative health bar.
- `assets/ui/feedback/combo-meter-atlas-01.webp` — escalating combo presentation frame.
- `assets/ui/pickups/pickup-beacon-atlas-01.webp` — normal/heavy/utility/medkit world-pickup beacon pulses.

Pack 8 follows the same reliability contract as recent generated-art packs: raster art is presentation-only, never a persistent Three.js texture plane; gameplay state stays in existing systems; and procedural/text UI remains the fallback. The minimap intentionally renders only information already available to the player (player, allies, visible pickups, objectives, player-owned deployables and player smoke), so the art does not create a hidden-information advantage.

## Generated Asset Pack 7 (2026-09-29)
Runtime paths:
- `assets/ui/overlays/low-health-vignette-01.webp` — low-HP peripheral damage texture.
- `assets/ui/overlays/damage-direction-01.webp` — rotatable directional hit texture.
- `assets/ui/overlays/smoke-clouds-01.webp` — smoke-screen presentation layer.
- `assets/ui/fx/ballistic-muzzle-flash-sheet-01.webp` — 4×2 ballistic muzzle sheet.
- `assets/ui/fx/plasma-discharge-sheet-01.webp` — 4×2 plasma discharge sheet.
- `assets/ui/overlays/explosion-shockwave-01.webp` — nearby explosion screen shockwave.
- `assets/ui/overlays/suppression-vignette-01.webp` — player near-miss/suppression overlay.
- `assets/ui/overlays/armor-hit-field-01.webp` — non-breaking armor-hit field.
- `assets/ui/overlays/sprint-speed-lines-01.webp` — sprint peripheral speed texture.
- `assets/ui/overlays/respawn-materialize-01.webp` — respawn materialization overlay.

Pack 7 is presentation-only. Screen overlays are DOM/CSS layers, muzzle sheets decorate the existing DOM first-person flash, and no generated raster is routed into persistent Three.js texture planes/sprites. Every overlay keeps an existing procedural/UI fallback. Runtime derivatives are VP8X alpha WebP, 512×288 for screen overlays and 512×256 for the two 4×2 sheets, with a 128 KiB CI budget.

## Generated Asset Pack 6 (2026-09-29)
Runtime paths:
- `assets/ui/perks/bulletstorm-tech-01.webp` — «Шторм свинца».
- `assets/ui/perks/immortal-tech-01.webp` — «Несокрушимый».
- `assets/ui/perks/doubletap-tech-01.webp` — «Двойной импульс».
- `assets/ui/perks/piercing-tech-01.webp` — «Бронебойный сердечник».
- `assets/ui/perks/laststand-tech-01.webp` — «Последний рубеж».
- `assets/ui/perks/thorns-tech-01.webp` — «Ответный разряд».
- `assets/ui/perks/explosive-rounds-tech-01.webp` — «Разрывные боеприпасы».
- `assets/ui/perks/evasive-matrix-tech-01.webp` — «Матрица уклонения».
- `assets/ui/perks/headshot-armor-tech-01.webp` — «Трофейная броня».
- `assets/ui/perks/bombtech-tech-01.webp` — «Тяжёлая бомба».

Pack 6 is wired through the existing protocol-neutral `perkAsset(id,path)` resolver, so generated art is used by level-up cards and the active perk panel while `assets/perks/<id>.svg` remains the authoritative load/decode fallback. All files are DOM-only 256×256 VP8X alpha WebP derivatives <=32 KiB and do not change perk mechanics or balance.

## Generated Asset Pack 4 (2026-09-28)
Runtime paths:
- `assets/ui/weapons/fp/player-bomb-fps-01.webp` — baked-hands FPS bomb, DOM overlay.
- `assets/ui/pickups/weapons/world-bomb-pickup-01.webp` — projected world bomb pickup.
- `assets/ui/pickups/world-medkit-pickup-01.webp` — projected health pickup with procedural fallback.
- `assets/ui/pickups/ammo-crate-tech-02.webp` — ammo HUD presentation.
- `assets/ui/scopes/{sniper,rifle}-scope-tech-01.webp` — scope overlays; original SVG files are mandatory fallbacks.
- `assets/ui/objective/frontline-capture-burst-tech-01.webp` — transient capture feedback.
- `assets/ui/feedback/battle-result-frame-tech-01.webp` — death/killcam result shell.

All eight files are presentation-only raster art. They must never be passed to `TextureLoader`, `makeAssetPlane` or `makeAssetSprite`. Detailed pickup art follows the floating body center and physical perspective size; procedural geometry remains the decode failure fallback.

Этот документ — обязательный operational contract для человека, ChatGPT/Codex и других AI-агентов при создании, изменении и публикации игровых ассетов.

## 0. Pre-generation duplicate gate

Перед каждой новой генерацией сначала доказать, что asset действительно новый и нужен текущей игре. Это отдельный gate до image generation, а не проверка после неё.

Минимальный порядок:
1. прочитать начало этого файла и `assets/README.md`, чтобы увидеть уже интегрированные generated packs;
2. проверить последние generated-asset commits и реальные runtime filenames в `assets/ui/**`;
3. найти конкретный consumer/callsite, который сейчас остаётся procedural/text-only или визуально слабее соседних систем;
4. зарезервировать semantic ASCII filename и назначение до генерации;
5. не генерировать новый вариант существующего asset без явной задачи на replacement;
6. после генерации считать изображение **source candidate**, пока оно не прошло runtime derivative → consumer wiring → fallback → validation → screenshot gate.

Для pack из нескольких изображений сначала фиксировать короткий manifest: `filename → owner/consumer → event/state → fallback → target runtime envelope`. Это уменьшает дубли между разными ChatGPT-сессиями и не даёт складывать «красивые, но неиспользуемые» файлы в репозиторий.

## 1. Сначала определить владельца ассета

Перед генерацией или заменой изображения определить реальный consumer:

- DOM/HUD/menu/feedback → `assets/ui/**` и `GAME_ASSETS.presentation*`;
- gameplay SVG fallback → существующий доменный каталог (`assets/medals`, `assets/status`, `assets/fx`, `assets/perks`);
- weapon identity / bot procedural model art → `assets/weapons/**` и `WEAPONS[].asset`;
- generated player-held first-person presentation → `assets/ui/weapons/fp/**`, только DOM overlay локального игрока;
- generated world pickup presentation → `assets/ui/pickups/weapons/**`, DOM projection реальной 3D pickup-позиции с procedural fallback;
- audio → `assets/audio/**`;
- постоянная Three.js сцена → по умолчанию procedural geometry/materials, а не generated raster texture.

Не добавлять картинку «на будущее» без конкретного callsite. Asset считается интегрированным только когда есть consumer, fallback/degradation contract и validation.

## 2. Generated source и runtime derivative — разные вещи

Генератор может вернуть 1024–2048 px PNG. Такой файл является source/reference, но не обязан попадать в runtime.

Для HUD/icon assets:
1. визуально проверить источник;
2. обрезать лишний transparent padding при необходимости;
3. уменьшить до фактического UI-resolution;
4. сохранить прозрачность;
5. подготовить runtime derivative.

Текущий ориентир для компактных эмблем — 256×256 WebP с alpha. PNG допустим, когда lossless edge fidelity действительно нужна. Большой raster >512 px или >250 KiB в обычном HUD требует отдельного обоснования.

Для player-held FPS weapon art действует отдельный envelope: текущий целевой runtime derivative — **960×720 WebP с alpha, до 250 KiB на файл**. Такой размер нужен потому, что оружие занимает значительную часть 16:9 viewport; уменьшать его до icon-resolution нельзя.

Для generated world weapon pickups целевой runtime derivative — **512×384 WebP с alpha, до 120 KiB на файл**. Здесь tight crop допустим: asset показывается как небольшой объект на карте, а не занимает FPS viewport.

### Текст внутри декоративных HUD-рамок

Привязывать подписи к внутренним панелям исходного изображения, учитывая прозрачные поля; общий `padding` и пропорции строк контейнера не задают границы нарисованных панелей. Сохранять aspect ratio рамки и задавать позиции в процентах от её исходного размера; размер шрифта согласовывать с шириной самой рамки.

Для `pickup-notification-frame-01.webp` (1000×320) `src/styles/game.css` размещает заголовок по центру верхней панели (59.75%, 44.5%), а описание — нижней (56%, 68.5%). `scripts/browser-menu-smoke.mjs` проверяет положение реальных букв внутри этих панелей через DOM Range; попадания в общий прямоугольник уведомления недостаточно. При смене рамки заново определить её внутренние границы и проверить короткое/длинное русское название на широком и узком экране, включая HTTP и `file://`.

Background/photo-like art: WebP/JPEG. Простые векторные fallback: SVG. Не конвертировать SVG в тяжёлый raster без пользы.


## 2.1. Animated generated assets — canonical browser workflow

Для transient VFX и других коротких анимаций основной generated source по умолчанию — **sprite sheet / texture atlas с alpha**, а не GIF и не набор отдельных PNG-файлов.

Если несколько related one-shot VFX используют одинаковую сетку и общий lifecycle, предпочтителен **один uniform mega-atlas**: одна строка/регион на semantic effect + metadata `row/frameCount/duration`. Это уменьшает request/decode churn и сохраняет отдельные gameplay consumers. Pack 10 — текущий reference: 10 logical effects → один 8×10 WebP atlas.

Почему:
- один atlas уменьшает количество HTTP/file requests и декодирований;
- кадр можно детерминированно выбирать по gameplay-time, а не надеяться на внутренний таймер animated image;
- эффект можно запускать, останавливать, ускорять, обрывать и синхронизировать с выстрелом/попаданием/reload;
- один и тот же runtime derivative можно использовать через CSS background-position, DOM/canvas projection или отдельный bounded consumer;
- generated animation не становится gameplay-state authority: событие игры остаётся источником истины, atlas только визуализирует его.

### Preferred source contract

До генерации зафиксировать:
- semantic filename;
- consumer/owner;
- trigger/event;
- rows × columns;
- frame count;
- intended frame duration/FPS;
- loop mode: one-shot / hold-last / loop;
- screen/world anchor;
- fallback;
- runtime target size/budget.

Для коротких one-shot VFX начинать с равномерной сетки 4×2 или 4×4. Все кадры должны иметь одинаковый viewpoint/scale/anchor, прозрачный фон и последовательное движение без случайного перескока объекта между ячейками.

### Runtime playback

1. **Gameplay-synchronised effect:** переключать frame index от реального elapsed time через существующий game loop / `requestAnimationFrame` timestamp. Не считать «1 callback = 1 frame»: high-refresh дисплеи иначе ускорят анимацию.
2. **Чисто декоративный постоянный loop:** допустим CSS `background-position` + `steps(...)`, если loop не несёт gameplay-смысла.
3. Не держать невидимый loop постоянно активным; hidden/inactive effect должен быть paused/removed.
4. Предзагружать только assets, которые реально нужны раннему экрану; остальные — lazy-load перед первым consumer. Перед reveal желательно дождаться decode/load success и сохранить procedural/text fallback.
5. Не раскладывать 8–16 кадров одного эффекта в отдельные runtime files без доказанной причины.

### Format policy

- runtime atlas с alpha: WebP по умолчанию;
- PNG/APNG — только когда lossless edge fidelity или конкретная lossless animation действительно оправданы;
- animated WebP/APNG могут использоваться как автономные декоративные loops, но **не являются default для gameplay-synchronised VFX**, потому что код теряет удобный direct control над конкретным кадром;
- GIF не использовать как основной игровой VFX-format: для этого проекта atlas + controlled playback даёт лучшее управление и обычно меньший runtime overhead;
- geometric HUD art по-прежнему сначала рассматривать как SVG, а не raster animation.

### Current ZAP-ZONE safety boundary

Generated animated raster остаётся presentation-only и не отменяет текущий запрет на persistent Three.js generated texture planes/sprites. Если позже понадобится настоящий world-space textured VFX pipeline, это отдельная задача с browser/uCoz evidence, memory/performance profiling и новым regression contract. Для будущих тяжёлых GPU texture pipelines отдельно оценивать KTX2/Basis, но не тащить его в текущий DOM/CSS asset path без измеримой пользы.

### Verification gate

Animated asset считается готовым к интеграции только после:
- проверенного frame grid/alpha;
- стабильного anchor между кадрами;
- frame-time independent playback;
- trigger/stop cleanup без orphan DOM elements/timers;
- fallback при load/decode failure;
- dual-runtime HTTP(S) + direct `file://`;
- browser screenshot/runtime proof на desktop и хотя бы mobile-low path;
- size/signature/wiring checks в `scripts/validate-structure.mjs` после фактического runtime подключения.


## 3. Имена и каталоги

Runtime-файлы используют ASCII kebab-case и смысловое имя:

`<semantic-name>-tech-<nn>.<ext>`

Примеры:
- `assets/ui/feedback/armor-break-tech-01.webp`;
- `assets/ui/medals/multikill-tech-02.webp`;
- `assets/ui/perks/defender-tech-01.webp`.

Не коммитить имена генератора, кириллицу, `imagegen.png`, `final-final.png`, случайные UUID и временные contact sheets как runtime assets.

Каталог определяется владельцем UI, а не сессией генерации.

## 4. Fallback, graceful degradation и обязательный dual-runtime

**Жёсткое правило проекта:** каждый runtime asset и каждый его consumer должны работать в двух режимах:
1. после загрузки файлов в файловый менеджер uCoz / другой обычный HTTP(S) static hosting;
2. при прямом запуске локального `index.html` с компьютера через `file://`.

Нельзя считать asset интегрированным, если он виден только на uCoz или только локально. Нельзя специально отключать generated visual art только потому, что `location.protocol==='file:'`.

Generated presentation art не должно быть единственной формой критической информации.

- DOM image: `src` = стабильный fallback, `data-generated-src` = generated art, `data-fallback-src` = явный fallback.
- `catalog.js` активирует generated DOM/CSS art и на HTTP/HTTPS, и на `file://`. Канонический `gameAssetUrl()` сначала разрешает runtime `assets/...` относительно `document.baseURI`; build query `?v=<build>` добавляется только на HTTP(S). Это делает один URL безопасным и для DOM-свойств, и для CSS custom properties.
- Нельзя передавать сырой относительный `url("assets/...")` через CSS custom property, которую потребляет внешний `src/styles/game.css`: такой URL браузер может разрешить относительно stylesheet и ошибочно запросить `src/styles/assets/...`. Для динамических CSS URL использовать уже разрешённый URL из `GAME_ASSETS`/`gameAssetUrl()`; статические литералы внутри `game.css` остаются stylesheet-relative `../../assets/...`.
- Perk/medal/headshot generated art выбирается protocol-neutral и всегда имеет SVG fallback на реальную ошибку загрузки/декодирования.
- Если браузерное ограничение не позволяет какой-то категории файлов использовать один и тот же loader в `file://`, должен существовать отдельный local consumer или функциональный fallback; молча выключать asset/feature нельзя.
- Perk generated art всегда имеет per-id SVG fallback.
- Чисто декоративный CSS asset может исчезнуть при 404, только если текст/shape рядом полностью сохраняет смысл.

Нельзя скрывать HP, ammo, objective state или control hint внутри изображения без текстового/DOM эквивалента.

## 5. WebGL/uCoz safety invariant

Generated PNG/WebP/JPEG presentation assets **не использовать** как постоянные texture planes/sprites в `src/core/engine.js` и bot scene.

Причина: проект уже устранял hosting-specific black texture-quads. Поэтому generated art остаётся DOM/CSS-only, а 3D scene использует procedural geometry/materials.

Запрещённый drift для generated UI art:
- `gameTexture(generatedPath)`;
- `makeAssetPlane(generatedPath,...)`;
- `makeAssetSprite(generatedPath,...)`;
- прямой `TextureLoader` в engine только ради HUD/decal art.

Исключение возможно только отдельной задачей с runtime/browser/uCoz evidence и новым regression contract.

### Player-held generated weapons

Сгенерированные FPS-рендеры оружия не являются 3D-моделями и не должны подменять bot geometry. World pickup presentation использует отдельный DOM-projection contract ниже.

**Reference lock перед генерацией.** Если пользователь дал пример посадки оружия, он является обязательным composition contract, а не просто style reference. До генерации зафиксировать:
- камера — first-person, оружие выходит из нижнего правого сектора и направлено влево/вверх в глубину сцены;
- видна правильная ведущая рука на рукояти; для двуручного оружия видна supporting hand/forearm;
- ствол не должен смотреть фронтально в камеру и не должен быть боковым showroom/profile render;
- оружие не центрируется как постер и не перекрывает центральный reticle;
- muzzle должен оставаться читаемым и иметь стабильную экранную anchor-точку;
- фон обязательно прозрачный, без baked black rectangle/scene/background.

**Hand ownership mode — нельзя смешивать.** Для каждого pack заранее выбрать ровно один режим:
1. `baked-hands` — изображение уже содержит финальные руки/предплечья; при успешной загрузке скрывается **весь procedural first-person rig** (weapon body + procedural hands), иначе появятся двойные/блочные руки;
2. `weapon-only` — изображение не содержит рук; procedural hands могут остаться только после отдельной проверки совпадения grip/scale/perspective.

Текущий approved V3 pack pistol/shotgun/rifle/plasma/rocket/sniper — **baked-hands**. Mine и smoke теперь используют тот же baked-hands DOM pipeline; bomb пока остаётся procedural. V3 использует intentional transparent headroom/left-space, уменьшенный runtime silhouette и HUD-safe positioning.

**Подтверждённый success baseline (28.09.2026).** Этот вариант был визуально принят в реальной игре и теперь является эталоном для следующих first-person assets:
- runtime canvas — 960×720 с реальной alpha-прозрачностью;
- объект не tight-crop: сохраняется большой transparent headroom/left-space, чтобы runtime не раздувал картинку;
- baked FPS angle создаётся в самом asset; runtime только слегка двигает его, а не пытается исправить перспективу большим rotate;
- основной силуэт остаётся в нижнем правом секторе и не закрывает reticle, HP, Score/Kills и critical HUD;
- HUD имеет stacking priority над декоративным оружием, но правильная композиция обязательна сама по себе;
- per-weapon `width/right/bottom/muzzleX/muzzleY` настраиваются после реального screenshot, не по standalone preview;
- raster sway/recoil ограничивается clamp-ами; approved baked angle нельзя разрушать большой динамической ротацией;
- visual recoil должен быть отдельным runtime transform и быть frame-rate independent;
- muzzle flash не запекается в статический weapon asset: это отдельный effect layer с собственным anchor, цветом/масштабом по weapon key и без прямоугольной/обрубленной подложки;
- финальный gate: generate → runtime derivative → integrate → screenshot in game → tune → только после визуального принятия считать framing подтверждённым.

Runtime contract:
- runtime derivative: прозрачный WebP в `assets/ui/weapons/fp/**`, сейчас 960×720 и <=250 KiB;
- consumer: `#fp-weapon-art` / `#fp-weapon-art-stage` поверх canvas только для локального игрока;
- при `baked-hands` успешная загрузка скрывает все children текущего procedural `gunGrp`; fallback/error возвращает весь rig;
- gameplay state, ballistics, hitboxes, recoil logic и bots не меняются; world pickups имеют отдельный DOM presentation, но сохраняют прежнюю pickup economy/3D fallback;
- recoil/equip/reload/sprint/cycle поза DOM-art синхронизируется с существующим `gunGrp`, а muzzle flash имеет отдельный DOM feedback;
- для player-only pack `file://` поддерживается: WebP лениво загружается только после `running` по локальному `assets/...` пути; 404/decode error обязаны автоматически вернуть procedural first-person rig;
- mine и smoke используют отдельные approved baked-hands utility assets; bomb остаётся procedural, пока для него не создан отдельный утверждённый FPS asset;
- запрещено загружать generated weapon WebP через `TextureLoader`, `gameTexture`, `makeAssetPlane` или `makeAssetSprite`.

**Framing/acceptance gate перед upload.** Для каждого FPS weapon:
- сравнить с утверждённым reference montage, а не только с соседними generated картинками;
- проверить 16:9 desktop screenshot: оружие визуально сидит в нижнем правом секторе, а muzzle уходит к левому/верхнему направлению;
- руки анатомически держат grip/fore-end, нет второго procedural комплекта рук;
- generated canvas должен сохранять осмысленное прозрачное пространство слева/сверху: tight crop вокруг оружия запрещён, потому что он заставляет раздувать poster-scale в runtime;
- weapon silhouette не занимает чрезмерно весь экран и не закрывает HUD/reticle;
- в idle-состоянии видимая часть оружия должна оставаться в правом секторе экрана: ориентир — левый край основного силуэта не левее ~58% viewport на desktop 16:9;
- центральная safe-zone reticle и нижняя центральная safe-zone HP/Score/Kills не должны пересекаться основным силуэтом оружия;
- `#hp-wrap`, `#hud`, `#whud` и reticle всегда имеют stacking priority выше decorative weapon art; это страховка, а не замена правильной композиции;
- right-bottom weapon HUD может находиться поверх силуэта только как читаемый HUD-слой; generated art не должен визуально уничтожать его контраст;
- отдельные `width/right/bottom/muzzleX/muzzleY` tuning значения задаются по weapon key, а не одной глобальной трансформацией;
- dynamic sway/recoil для raster weapon art должен быть ограничен clamp-ами: baked first-person angle не вращать на большие углы и не таскать через HUD;
- visual recoil должен быть заметным, но не менять gameplay aim: использовать отдельный per-weapon push/pitch/roll profile; decay считать от `dt`, а не «на кадр», чтобы 60/120/144 FPS выглядели одинаково;
- muzzle feedback строить слоями (hot core + directional flame/starburst + glow), привязывать к muzzle anchor и не использовать короткий непрозрачный oval/cone, который выглядит как «обрубок» и закрывает пламя;
- desktop runtime stage ограничивать по абсолютному размеру (сейчас max 980 px), чтобы ultra-wide/high-DPI viewport не превращал оружие в огромный постер;
- если визуальная посадка не проверена screenshot-ом, итог маркировать `NOT VERIFIED: visual framing`, даже если CI зелёный.

### Подбираемые предметы: парящие подробные 3D-рендеры

Owner — `src/entities/pickups.js`. Оружие/снаряжение/аптечки используют изометрические alpha-рендеры того же дизайна, что и player-held art. Это DOM-изображения с фиксированным ракурсом; WebGL raster quads не используются. Геометрия общего FPS/bot factory остаётся decode fallback, её детали объединены по материалу с сохранением nested transforms/effective visibility.

- Pack44: pistol/shotgun/rifle/rocket/plasma/bomb/smoke/sniper и medkit —1024×768 alpha-WebP≤240KiB каждый. Восемь weapon assets выбираются через `detailedWorldWeaponPickups`, аптечка через `detailedMedkitPickup`. Старые `generatedWorldWeaponPickups` и `presentation.medkitPickup` сохранены для HUD/toast и decode fallback. При error нового изображения пробуется старое, затем procedural body. FPS и deployed equipment assets не менялись.
- Smoke pickup44 содержит только cell6 (col2,row1) padded atlas Pack42, window[887,443,1330,887], затем alpha crop/resize. Другие семь кадров, включая venting, не попадают в pickup. Derivation — `asset-staging/2026-10-06-pickups-44/build_smoke_pickup.py`, source/window/SHA256 — manifest.json.
- Rifle/rocket/shotgun/pistol/plasma/bomb/smoke производны от сохранённых исходников1200–1774px, sniper и medkit догенерированы по текущему дизайну. Mine/grenade используют прежние world pickups. Source/hashes/derivation/prompts — `asset-staging/2026-10-06-pickups-44`.
- Gameplay root y=.20м, тело парит на.48м выше baseY с bob±.08м. `tickPickupPresentation()` обновляет bob/yaw каждый frame независимо от30Hz collection gate. Напольная analytic shadow удалена, fallback castShadow=false, CSS filter:none.
- `syncWorldWeaponPickupArt()` вызывается из `engine.renderFrame()` каждый кадр: position/width по world center, camera depth/FOV и viewport. Offscreen/distance60м culling предшествует raycast. Стены используют LOS cache100мс с немедленной invalidation при движении камеры или root; поворот камеры меняет projection каждый frame и не меняет LOS. Дым проверяется каждый frame.
-38 weapon pickups (5pistol,4shotgun,6rifle,3rocket,4plasma,3mine,2bomb,4smoke,3sniper,4grenade),40 health normal/24 mobile/PERF. При новой игре grid6м в пределах±72м получает random jitter±1.3м. Точки проверяются против wallAABBs с clearance1.6м; размещение предпочитает distance≥6м от игрока и≥3.2м от видимых предметов. Respawn всех типов выбирает другую точку≥6м от предыдущей; при отсутствии точки остаётся hidden и повторяет выбор через.5с.
- Каждый weapon pickup выдаёт в резерв соответствующего оружия равномерное целое3–100. Выдача owner — src/player/state.js::grantWeapon; прибавка идёт к persisted weaponReserve, а не testing virtual reserve. После автоматического switch текущие ammo/uAmmo восстанавливаются из реальных массивов; обычный switchW для owned-slot сохраняет реальный резерв. Testing unowned-slot остаётся виртуальным и не пишет ownership/reserve. Первый подбор сохраняет filling clip; reserveCap9999 общий и для grenade. Healing/armor и collection radius сохраняются. Универсальные ammo crates отсутствуют. Reset очищает DOM callbacks/children и scene; respawn сохраняет art entry.

Regression owner: `scripts/pickup-presentation-owner.test.mjs` — bounded per-frame hover, collection/relocation, heal/armor, failed grant/no feasible location, все98 RNG-интервалов, wall clearance/spacing/quadrants/fresh random positions. Browser oracle — real camera-turn projection, actual map positions, grant endpoints all10, wall/smoke/fallback/reset, HTTP/file normal/PERF.

### Кровавая рамка низкого HP

`#low-health-overlay` в game.css явно отключён по запросу пользователя. Runtime lowHP gameplay и HP/save/restart не меняются; прочие короткие сигналы попадания сохраняются. Кровавый layer остаётся скрытым приHP1, паузе и новой игре.

## 6. Catalog и cache identity

Новый runtime asset должен:
1. лежать в каноническом каталоге;
2. быть внесён в `GAME_ASSETS`;
3. использовать `gameAssetUrl()`/общий build key на HTTP(S);
4. попасть в `scripts/validate-structure.mjs`;
5. изменить web build identity через `node scripts/stamp-web-build.mjs`.

Не хардкодить случайные query-version. Единственный cache key — текущий build ID.

## 7. Validation перед commit

Для каждого нового generated image проверить:
- он реально загружается и на uCoz/HTTP(S), и при прямом `file://` запуске;
- локальный режим использует generated visual asset, а fallback включается только при фактической ошибке load/decode;
- файл существует и не пуст;
- magic/envelope соответствует PNG/JPEG/WebP;
- для binary upload через API/base64 до commit сверить Git blob SHA с локальным исходным файлом; после commit повторно проверить, что GitHub blob начинается с ожидаемого binary envelope (для WebP — RIFF....WEBP), а не с UTF-8/base64-текста;
- размер разумный для callsite;
- catalog содержит путь;
- реальный HTML/CSS/JS consumer содержит wiring;
- fallback/degradation path существует;
- generated presentation path отсутствует в WebGL engine;
- для player-held weapon art проверены DOM consumer, procedural fallback, pose sync и отсутствие влияния на bots;
- для baked-hands pack проверено, что procedural weapon **и procedural hands** скрываются одновременно, а на fallback возвращаются вместе;
- для world pickup art проверены DOM projection, distance scaling, wall occlusion, procedural world-model fallback и отсутствие WebGL raster texture quads;
- FPS framing сопоставлен с утверждённым reference screenshot/montage; CI не заменяет визуальную проверку композиции;
- `node --check` проходит;
- `node scripts/stamp-web-build.mjs --check` проходит после stamp;
- `node scripts/validate-structure.mjs` проходит;
- browser boot + local file smoke проходят в CI.

Нельзя считать «файл лежит в assets» достаточной интеграцией.

## 8. GitHub upload — один логический change

Перед записью:
1. re-fetch exact `main` SHA;
2. прочитать `.github/workflows/**` и оценить push-runs;
3. re-fetch изменяемые файлы/blob SHA;
4. подготовить все binary blobs + code/docs/changelog; для WebP/PNG/JPEG использовать binary-safe base64 upload и записывать в tree только SHA проверенного Git blob;
5. перед сборкой tree сравнить каждый созданный binary blob SHA с SHA, рассчитанным из локальных bytes; mismatch = STOP, не коммитить;
6. собрать один Git tree/commit;
7. fast-forward `main` с `force=false`.

Не загружать шесть картинок шестью отдельными commits через Contents API: это создаёт лишние Actions runs и временно неконсистентный catalog.

Любое изменение runtime/code/assets сопровождается записью в `CHANGELOG.md`.

## 9. После GitHub write

Проверить exact new SHA:
- найти Actions run с `event=push&head_sha=<SHA>`;
- проверить run conclusion;
- при failure: jobs → первый failed step → logs → root cause → один минимальный follow-up;
- не продолжать серию несвязанных commits пока current HEAD красный.

Green run другого SHA не является доказательством для текущего HEAD.

## 10. Ручная публикация на uCoz/static hosting

Порядок публикации:
1. новые/изменённые `assets/**`;
2. изменённые `src/**`;
3. CSS/другие runtime files;
4. `index.html`;
5. **`version.json` последним**.

`version.json` объявляет сборку доступной, поэтому его нельзя выкладывать раньше asset/code payload.

После публикации:
- открыть сайт обычным reload без Ctrl+F5;
- проверить новый build;
- проверить menu + один generated HUD asset + fallback-sensitive flow;
- проверить DevTools Network/Console на 404/decoding ошибки;
- отдельно открыть локальный `index.html` через `file://` и подтвердить тот же menu background/logo/generated HUD art;
- отсутствие asset только в одном из двух режимов (uCoz HTTP(S) или local file) = regression и блокирует завершение задачи.

## 11. AI handoff checklist

Следующий AI перед asset-задачей читает только:
1. этот файл;
2. `assets/README.md`;
3. конкретный consumer/module;
4. `scripts/validate-structure.mjs`;
5. workflow Validate, если будет write.

Текущее состояние кода/GitHub/CI всегда важнее этого документа, если они разошлись.


### Vector derivative rule (Pack 9+)
For generated geometric HUD art, prefer a small SVG runtime derivative when it preserves the visual intent. Keep the generated raster/contact sheet as source/reference rather than forcing it into runtime. The SVG still requires a concrete consumer, catalog entry, text/procedural fallback and structural validation. Use WebP/PNG for painterly, smoky, photographic or first-person art where raster detail is materially useful.

## Perk icons V2 — окно улучшений

Все 52 улучшения имеют отдельные generated WebP 256×256 с alpha в `assets/ui/perks/icons-v2/`.
`GAME_ASSETS.perkGeneratedIcons` и `perkAsset(id,path)` — единый resolver для окна выбора и активных улучшений;
`assets/perks/<id>.svg` сохраняется как load/decode fallback на HTTP(S) и `file://`.
Значки загружаются по мере отображения. Source atlas, prompts, cell mapping, alpha ranges и SHA-256 находятся в `asset-staging/perk-icons-v2/`.
Карточки используют CSS-рамку, не raster rarity frame: отдельные строки icon/rarity/title/description/footer
растут по содержимому, padding удерживает текст внутри рамки. Сетка 5/3/2/1, диалог прокручивается в низком окне.
Карточки — native buttons; focus при открытии и Tab остаются внутри диалога. Механика и баланс улучшений сохранены.

## Pack46 bot role variants + mechanical presentation (2026-10-07)

Canonical builder remains `asset-staging/2026-10-06-bot-3d-pack-46/build_bot_3d.py` → editable `.blend` + canonical GLB + direct-file runtime derivative.

Pack46 now exports 15 components: 10 shared body modules plus five presentation-only role modules. Runtime mapping is owned by `src/entities/bot-model3d.js`. Existing tactical roles are unchanged: Assault/Engineer/Anchor map directly, both flank directions share Flanker, and Sniper appearance is selected when current weapon is `sniper`. Role meshes are torso children and must never become gameplay hit/collision/LOS owners.

Mechanical pose composition is owned by `src/entities/bot-presentation.js::updateBotMechanicalPresentation()`: bounded head tracking, torso twist, shoulder recoil, aim raise/lower, reload pose, visual crouch and landing compression. `src/entities/bots.js` supplies live facts and calls it immediately before the existing two-hand grip solver.

Current generated budget: **15 components, 40,712 triangles, GLB 2,111,808 bytes, direct-file runtime derivative 1,958,998 bytes**. Regression owners: `scripts/bot-model3d-owner.test.mjs`, `scripts/bot-presentation-owner.test.mjs`, `scripts/validate-structure.mjs`. Detailed authoring/export rules live in `docs/BLENDER_ASSET_PIPELINE.md`.

Live Pack46 browser regression owner: `scripts/browser-bot-pack46-smoke.mjs`. It reloads HTTP without cache, checks current build-id, all 15 components, all five role selections, mechanical presentation response and stale-script/diagnostic absence without requiring a match to be started.
