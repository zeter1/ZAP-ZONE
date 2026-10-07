# Bot presentation / arm rig — owner spec

Открывать этот документ **только** когда задача касается bot body/Blender Pack46, hit-mesh geometry/order, visual armor/readability, articulated visual legs, bot weapon pivot, grip metadata consumption или two-hand arm rig. Для общего Blender/export/runtime workflow сначала читать `docs/BLENDER_ASSET_PIPELINE.md`; этот spec описывает именно bot presentation ownership и rig invariants.

## 1. Canonical ownership

| Responsibility | Owner |
|---|---|
| Blender Pack46 component geometry/material instancing + procedural fallback selection | `src/entities/bot-model3d.js` |
| procedural bot body + decorative fallback/readability | `src/entities/bot-presentation.js` |
| gameplay hit-mesh creation and stable `pts[]` order | `src/entities/bot-presentation.js` |
| non-gameplay articulated visual leg hierarchy (`legRig`) | `src/entities/bot-presentation.js` |
| bot `weaponPivot`, real body hands and `armRig` references | `src/entities/bot-presentation.js` |
| two-bone arm solver + grip coordinate conversion | `src/entities/bot-presentation.js` |
| weapon definitions and per-weapon pose/grip metadata | `src/weapons/system.js` |
| individual bot FSM, perception, locomotion and combat execution | `src/entities/bots.js` |
| bot health-bar DOM lifecycle | `src/entities/bots.js` |

**Rule:** создание модели внутри `Enemy` не делает `bots.js` owner-ом presentation. `Enemy` получает `{g, pts, weaponPivot, armRig, legRig, model46}` через `mkHuman()` и дальше только исполняет AI/movement/combat.

## 2. Classic-script load contract

Load order Pack46: `zap-bot-modular-46.runtime.js → bot-model3d.js → bot-presentation.js → bots.js`.

`zap-bot-modular-46.runtime.js` — generated q16/Base64 geometry derivative из canonical Blender mesh с Blender corner normals; он не является независимым hand-edited owner-ом. `src/entities/bot-model3d.js` декодирует position/normal streams, строит shared BufferGeometry/materials и устанавливает их поверх существующего rig. `src/entities/bot-presentation.js` должен быть загружен **раньше** `src/entities/bots.js`.

Evaluation-time dependency owner-ов — глобальный `THREE`. Pack46 не должен отключаться только из-за desktop `PERF_MODE/MOBILE_LOW`: low-power fallback разрешён лишь когда одновременно есть coarse pointer + touch points, либо Pack46 отсутствует/неполон. Это защищает direct `file://` desktop-запуск от случайного возврата к procedural body. Arm solver принимает runtime bot/weapon objects через аргументы и не владеет weapon data.

Текущий общий участок graph: `combat → tactics → frontline → Pack46 geometry → bot-model3d → bot-presentation → bots`. Это порядок загрузки; semantic presentation edge остаётся направленным к `bots`.

### Blender Pack46 contract

Canonical model artifact: `assets/characters/models/zap-bot-modular-46.glb`. Editable source/builder/provenance находятся в `asset-staging/2026-10-06-bot-3d-pack-46/`.

- один набор component geometry переиспользуется обеими командами;
- team identity задаётся runtime materials: high-visibility blue/cyan ally и crimson/red enemy; это presentation-only contract. Крупный `MAT_ACCENT` остаётся окрашенной PBR-поверхностью с низким metalness и слабым emissive lift, а не gameplay marker/flat-neon replacement;
- Pack46 не загружает PNG/WebP/JPEG как bot-scene textures;
- direct `file://` использует generated vertex/normal derivative из того же Blender builder;
- отсутствие/неполнота Pack46 не должна ломать gameplay — остаётся procedural fallback;
- Blender component meshes являются presentation-only и не становятся `pts[]`.

### Forward-axis contract

Gameplay convention бота — **local +Z = forward**: `desiredYaw = atan2(dx,dz)`, `group.rotation.y` и `getBotMuzzlePos()` используют именно +Z. Blender Pack46 authored facing — Blender +Y, а runtime bridge `(x,y,z) → (x,z,-y)` превращает это в local **-Z**. Поэтому без presentation correction бот визуально смотрел спиной к цели, хотя AI и projectile math корректно стреляли по +Z.

Исправление обязано оставаться presentation-only:
- `group.rotation`, `desiredYaw`, hit meshes и fire-control +Z math не разворачивать;
- Pack46 body components получают local yaw `Math.PI` при attach; weapon-driven hand components не получают его второй раз, потому что hand quaternion уже наследует corrected weapon pivot;
- procedural fallback visual root/limb decor также разворачивается на `Math.PI`;
- canonical `BOT_WEAPON_POSES` держит оружие на положительной Z-стороне и yaw около `Math.PI`, потому что procedural weapon mesh authored along -Z;
- после этого recoil двигает weapon pivot назад по **-Z**;
- runtime proof обязан сравнивать gameplay muzzle +Z и реальный weapon muzzle. Current facing proof требует `weaponForwardDot > 0.90` и показывает visor/оружие со стороны цели.

Не исправлять этот баг через `desiredYaw += Math.PI`: это снова рассинхронизирует movement stability, mine/bomb placement, minimap heading, muzzle и projectile owners.

## 3. Hit-mesh invariant

`pts[]` — gameplay surface. Его порядок намеренно стабилен, потому что movement/animation и hit processing адресуют части тела по индексам.

- Не вставлять decorative armor/visor/insignia в `pts[]`.
- Не менять порядок существующих gameplay meshes в чистом presentation-refactor.
- Decorative meshes добавляются в group отдельно.
- Visual limb shells могут быть children существующих hit meshes, а `legRig` — отдельной decorative hierarchy; ни один из них не входит в `pts[]`.
- Hit-mesh material разрешено использовать как тёмный undersuit под shell-геометрией, пока collision/raycast geometry/order не меняются.
- Изменение hit geometry/order — gameplay change и требует отдельной задачи, regression evidence и changelog rationale.

## 4. Weapon-hold contract

`src/weapons/system.js` задаёт pose metadata. Каждый key из canonical `WEAPONS` catalog обязан иметь явную запись в `BOT_WEAPON_POSES` — включая utility/grenade; rifle fallback остаётся только defensive path для неизвестного внешнего key. Structural validation проверяет полноту catalog → pose.

Presentation owner потребляет:
- `pose.gripR` и `pose.gripL` — обязательны для двухручного solver;
- `pose.elbowR` / `pose.elbowL` — optional bend hints;
- `weaponPivot.quaternion` — ориентация кистей.

`updateBotWeaponHands(bot)` обязан:
1. обновить world matrices bot group и weapon mesh;
2. преобразовать grip из weapon-local через `mesh.localToWorld()`;
3. преобразовать world point в bot-local через `bot.group.worldToLocal()`;
4. решить обе руки и поставить реальные hand meshes точно на grip points;
5. вернуть `false` без mutation, если rig/mesh/grip metadata неполны.

Scratch vectors переиспользуются между кадрами; не добавлять бессмысленные allocations в hot path без измеренной причины.

## 5. Boundary with locomotion

`bots.js` остаётся владельцем gait/breath/strafe/combat motion: он вычисляет stride/lift/bob/sway/strafe значения, передаёт их в `applyBotLegVisualPose(...)`, затем меняет `weaponPivot` и вызывает `updateBotWeaponHands(this)`. Presentation owner только применяет готовую visual pose к decorative `hip → knee → ankle` hierarchy и не читает velocity/FSM самостоятельно.

Visible weapon recoil также является consumer-ом уже рассчитанного `fireBurstRecoil`: presentation motion может использовать этот measured state для небольшого `weaponPivot` push/pitch, но kick/max/recovery и firing accuracy остаются у `src/ai/bot-fire-control.js`.

Presentation owner **не** выбирает tactical state, скорость, target, recoil policy или movement intent — он только превращает уже выбранную pose в geometry.

Health-bar DOM пока остаётся в `Enemy`: он связан с alive/UI lifecycle и не нужен для arm-rig seam. Не расширять owner «заодно».

## 6. Safe change pattern

Перед изменением:
1. если задача про объёмную модель — сначала `docs/BLENDER_ASSET_PIPELINE.md`, затем `src/entities/bot-model3d.js` + `asset-staging/2026-10-06-bot-3d-pack-46/` + generated `manifest.json`;
2. `src/entities/bot-presentation.js`;
3. конкретный consumer в `src/entities/bots.js`;
4. pose/grip metadata в `src/weapons/system.js`, только если задача действительно про weapon pose;
5. `scripts/bot-model3d-owner.test.mjs` + `scripts/bot-presentation-owner.test.mjs`;
6. owner guards в `scripts/validate-structure.mjs`;
7. load graph в `index.html`.

Pure refactor сохраняет mesh order, dimensions, colors/material settings, default weapon pivot, shoulder constants, arm lengths, scale clamp и coordinate-conversion order.

## 7. Verification

Для source change:
1. `node --check` затронутых JS и validation/test scripts;
2. `node --test scripts/bot-model3d-owner.test.mjs scripts/bot-presentation-owner.test.mjs`;
3. `node scripts/stamp-web-build.mjs --check`;
4. `node scripts/validate-structure.mjs`;
5. полный `node --test scripts/*.test.mjs`;
6. HTTP Chrome boot smoke;
7. Pack46 runtime proof в HTTP и direct `file://`; menu smoke остаётся отдельным input/session oracle;
8. exact GitHub Actions result, если изменение публикуется в repo.

Model test проверяет полный component contract, q16 decode, shared geometry/team materials, скрытие legacy surfaces и policy `desktop MOBILE_LOW → Pack46`, `coarse-touch MOBILE_LOW → fallback`. Presentation test проверяет arm solver/grip conversion и visual leg hierarchy. Structural guards проверяют GLB/runtime derivative/load graph и запрещают вернуть unconditional `MOBILE_LOW` fallback. Ни один из этих слоёв сам по себе не заменяет browser/runtime proof.
