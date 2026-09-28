# Bot presentation / arm rig — owner spec

Открывать этот документ **только** когда задача касается procedural bot body, hit-mesh geometry/order, visual armor/readability, bot weapon pivot, grip metadata consumption или two-hand arm rig.

## 1. Canonical ownership

| Responsibility | Owner |
|---|---|
| procedural bot body + decorative armor/readability | `src/entities/bot-presentation.js` |
| gameplay hit-mesh creation and stable `pts[]` order | `src/entities/bot-presentation.js` |
| bot `weaponPivot`, real body hands and `armRig` references | `src/entities/bot-presentation.js` |
| two-bone arm solver + grip coordinate conversion | `src/entities/bot-presentation.js` |
| weapon definitions and per-weapon pose/grip metadata | `src/weapons/system.js` |
| individual bot FSM, perception, locomotion and combat execution | `src/entities/bots.js` |
| bot health-bar DOM lifecycle | `src/entities/bots.js` |

**Rule:** создание модели внутри `Enemy` не делает `bots.js` owner-ом presentation. `Enemy` получает `{g, pts, weaponPivot, armRig}` через `mkHuman()` и дальше только исполняет AI/movement/combat.

## 2. Classic-script load contract

`src/entities/bot-presentation.js` должен быть загружен **раньше** `src/entities/bots.js`.

Evaluation-time dependency owner-а — глобальный `THREE`: scratch vectors создаются при загрузке script. `MOBILE_LOW` используется только внутри `mkHuman()` при создании модели после завершения bootstrap. Arm solver принимает runtime bot/weapon objects через аргументы и не владеет weapon data.

Текущий общий участок graph: `combat → tactics → frontline → bot-presentation → bots`. Это порядок загрузки, а не ложная зависимость presentation от Frontline: semantic edge здесь `bot-presentation → bots`.

## 3. Hit-mesh invariant

`pts[]` — gameplay surface. Его порядок намеренно стабилен, потому что movement/animation и hit processing адресуют части тела по индексам.

- Не вставлять decorative armor/visor/insignia в `pts[]`.
- Не менять порядок существующих gameplay meshes в чистом presentation-refactor.
- Decorative meshes добавляются в group отдельно.
- Изменение hit geometry/order — gameplay change и требует отдельной задачи, regression evidence и changelog rationale.

## 4. Weapon-hold contract

`src/weapons/system.js` задаёт pose metadata. Presentation owner потребляет:
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

`bots.js` остаётся владельцем gait/breath/strafe/combat motion и меняет `weaponPivot` перед вызовом `updateBotWeaponHands(this)`. Presentation owner **не** выбирает tactical state, скорость, target, recoil policy или movement intent — он только превращает уже выбранную pose в geometry.

Health-bar DOM пока остаётся в `Enemy`: он связан с alive/UI lifecycle и не нужен для arm-rig seam. Не расширять owner «заодно».

## 6. Safe change pattern

Перед изменением:
1. `src/entities/bot-presentation.js`;
2. конкретный consumer в `src/entities/bots.js`;
3. pose/grip metadata в `src/weapons/system.js`, только если задача действительно про weapon pose;
4. `scripts/bot-presentation-owner.test.mjs`;
5. owner guards в `scripts/validate-structure.mjs`;
6. load graph в `index.html`.

Pure refactor сохраняет mesh order, dimensions, colors/material settings, default weapon pivot, shoulder constants, arm lengths, scale clamp и coordinate-conversion order.

## 7. Verification

Для source change:
1. `node --check` всех `src/**/*.js` и validation/test scripts;
2. `node --test scripts/bot-presentation-owner.test.mjs`;
3. `node scripts/stamp-web-build.mjs --check`;
4. `node scripts/validate-structure.mjs`;
5. HTTP Chrome boot smoke;
6. реальный `file://` Chrome/CDP menu smoke;
7. exact GitHub Actions result на изменённом SHA.

Direct test проверяет contract solver-а, а structural guards — одного owner-а и consumer bridge. Ни один из этих слоёв не заменяет browser smoke.
