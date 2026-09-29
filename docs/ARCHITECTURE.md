# Архитектура ZAP ZONE

## Порядок загрузки

1. Three.js r128.
2. `src/assets/catalog.js` — пути visual assets и helpers для Three.js textures/sprites/planes.
3. `src/core/engine.js` — renderer, arena, collision, environment decoration и particles.
4. `src/weapons/system.js` — каталог оружия и общий 3D weapon factory.
5. `src/player/state.js` — player state, perks, save/resume.
6. `src/settings/settings.js` — user settings, Web Audio SFX и presentation feedback.
7. `src/combat/combat.js` — input и combat.
8. `src/ai/bot-perception.js` — combat-noise bus, hearing, target acquisition, LOS memory и explosive/rocket sensing.
9. `src/ai/bot-navigation.js` — patrol points, wall/smoke steering, movement caps и collision substeps.
10. `src/ai/bot-positioning.js` — per-bot cover/flank destination filtering и scoring.
11. `src/ai/bot-fire-control.js` — aim/muzzle/reload и concrete shot/hit execution для уже принятого fire intent.
12. `src/ai/tactics.js` — squad coordination, Map Tactics и Adaptive Commander policy.
13. `src/game/frontline.js` — Frontline objective state/capture/rotation/save/HUD/marker.
14. `src/entities/bot-presentation.js` — procedural bot body, hit meshes, weapon pivot и two-hand arm rig.
15. `src/entities/bots.js` — per-bot FSM, fire gate/burst/weapon-selection policy и tactical execution; perception/navigation/positioning/fire-control owners используются как consumer dependencies.
16. `src/entities/pickups.js` — ammo/health/bomb/weapon pickups.
17. `src/progression/progression.js` — HUD, XP, damage, death/respawn.
18. `src/game/session.js` — Pointer Lock, пауза/возврат, браузерный lifecycle и reset frame clock.
19. `src/ui/minimap.js` — тактическая миникарта.
20. `src/game/runtime.js` — frame simulation/render loop и boot.

## Bot perception / threat-sensing owner

**Canonical owner:** `src/ai/bot-perception.js`. Узкий контракт — **[specs/BOT_PERCEPTION.md](specs/BOT_PERCEPTION.md)**. Owner владеет сбором и интерпретацией сенсорных сигналов: bounded combat-noise bus, hearing attenuation/uncertainty, target acquisition/scoring, LOS memory refresh, hostile grenade/mine scan cadence и incoming-rocket prediction.

Граница проходит по схеме **sense → decide → execute**. `src/combat/combat.js` и `src/weapons/system.js` остаются producer-ами projectile/mine/grenade/shot state. Perception читает эти данные и обновляет per-bot sensory memory. `src/entities/bots.js` остаётся owner-ом FSM-переходов (`hunt`, `retreat`, dodge), fire gate/burst cadence, weapon-selection policy, tactical execution и damage reaction; concrete shot execution принадлежит `src/ai/bot-fire-control.js`. `src/ai/tactics.js` может читать canonical `BOT_NOISE_EVENTS` для team-level awareness, но не владеет его lifecycle.

Хранение `targetEn`, `lastKnown`, `heardT`, scan timers и cached threat на объекте `Enemy` не делает `bots.js` owner-ом алгоритма perception: это per-entity state, которым canonical sensing functions управляют через явный bot argument. Такой seam уменьшает context cost без создания второго AI object model.

Pure extraction сохраняет прежние thresholds и cadence буквально: noise queue cap 36, stale prune 2200 ms, hearing age 1.75 s, wall attenuation ×0.52, heard memory 1.65 s, target visibility 72/76 m, mine scan 0.16–0.28 s, grenade scan 0.10–0.18 s и rocket scan 0.12–0.18 s. Target weights, reaction/lock timers и LOS semantics не являются balance change в этом refactor.

Structural validation требует одного perception owner-а, consumer calls в `bots.js`, canonical noise-bus consumption в tactics и запрещает FSM/combat/navigation/tactics implementation внутри perception. `scripts/bot-perception-owner.test.mjs` отдельно проверяет grenade ranking, bounded noise bus, hearing/FSM boundary, target selection и incoming rocket sensing.

## Bot navigation / locomotion owner

**Canonical owner:** `src/ai/bot-navigation.js`. Здесь живут patrol points, локальный wall/smoke steering, route penalty, movement speed caps и collision micro-steps. Узкий контракт — **[specs/BOT_NAVIGATION.md](specs/BOT_NAVIGATION.md)**.

`src/core/engine.js` остаётся единственным владельцем collision primitives, `src/combat/combat.js` — producer-ом smoke state, а `src/entities/bots.js` выбирает AI state/intention и потребляет navigation helpers. Grenade/mine/rocket threat perception, noise/hearing и target acquisition принадлежат `src/ai/bot-perception.js`; squad doctrine — `src/ai/tactics.js`. `nearestHostileGrenade()` намеренно не относится к navigation только из-за того, что его результат может вызвать retreat.

Pure extraction сохраняет `WPTS`, movement multipliers, smoke thresholds/weights, `substep=.16`, correction cap `intended*1.35+.035` и final cap `total*1.10+.035`. Structural validation запрещает возврат реализации в `bots.js`, а `scripts/bot-navigation-owner.test.mjs` проверяет behavior отдельно от расположения кода.

## Bot tactical positioning owner

**Canonical owner:** `src/ai/bot-positioning.js`. Узкий контракт — **[specs/BOT_POSITIONING.md](specs/BOT_POSITIONING.md)**. Owner выбирает **куда** конкретному боту выгоднее переместиться для cover/flank: фильтрует `COVER_POINTS`, учитывает LOS/smoke, route cost, crowding, Frontline bias, doctrine и side preference, а для flank сохраняет collision-checked procedural fallback.

Граница намеренно уже Tactical AI: `src/ai/tactics.js` выбирает командную doctrine/focus, `src/entities/bots.js` решает **когда** reevaluate cover/flank, владеет FSM/commit timers/peek execution, а `src/ai/bot-navigation.js` отвечает **как физически двигаться** к уже выбранной destination. Positioning owner не меняет `aiState`, `coverPoint`, `flankPoint` или timers — он только возвращает destination/`null`.

Pure extraction сохраняет исходные thresholds/weights буквально. Behavior закреплён `scripts/bot-positioning-owner.test.mjs`, а structural validation одновременно требует owner definitions, consumer calls и запрещает возврат scoring implementation в `bots.js`.

## Bot fire-control execution owner

**Canonical owner:** `src/ai/bot-fire-control.js`. Узкий контракт — **[specs/BOT_FIRE_CONTROL.md](specs/BOT_FIRE_CONTROL.md)**. Он исполняет уже принятое решение о выстреле: считает lead/smoothed aim и muzzle origin, ведёт reload lifecycle, выполняет LOS/smoke/friendly-fire/rocket-safety gates конкретного shot, создаёт hitscan/projectile effects, применяет hit/near-miss semantics и расходует магазин.

Граница проходит между **policy** и **execution**. `src/entities/bots.js` по-прежнему решает когда стрелять, сколько держать burst, когда делать pause/reload, когда менять weapon и когда вместо выстрела использовать mine/bomb. `src/ai/tactics.js` владеет doctrine/coordinated utility, но использует canonical `getBotMuzzlePos(bot)`. `src/combat/combat.js` остаётся owner-ом projectile/collision primitives и player-pressure/friendly-fire plumbing, а `src/weapons/system.js` — weapon data.

Owner намеренно принимает явный `bot` argument вместо создания второго object model. Per-bot state (`aimPoint`, `reloadT`, `mag`, target refs) остаётся на `Enemy`, но алгоритм его fire-control execution живёт в одном месте. Pure extraction сохраняет lead/spread/reload/damage/ammo/near-miss constants и порядок side effects; tuning этих значений — отдельная gameplay-задача.

Behavior закреплён `scripts/bot-fire-control-owner.test.mjs`; structural validation требует owner functions, consumers в `bots.js`/tactics, переносит ballistic source-oracles в новый owner и запрещает возврат старых methods в `Enemy`.

## Session lifecycle owner

`src/game/session.js` — единственный владелец переходов между меню/паузой/активной игрой и состоянием браузера. Здесь живут Pointer Lock request/change/error, start/resume, Escape sequencing, blur/focus/visibility/pagehide persistence и общий `lastT`, который сбрасывается после lifecycle-переходов.

**Не-владельцы:**

- `src/player/state.js` хранит player/save/weapon/mobile state и helpers, но не должен регистрировать браузерные session listeners;
- `src/game/runtime.js` владеет симуляцией кадра и boot; он может вызывать `showPauseUI()` как публичную session-команду, но не должен повторно регистрировать Pointer Lock/visibility/Escape handlers.

**Инварианты:**

- активная desktop-игра начинается только после успешного Pointer Lock и завершённого preload;
- потеря Pointer Lock во время матча переводит симуляцию в паузу, кроме специально обработанных death/perk/level состояний;
- `visibilitychange` в hidden-state сохраняет прогресс и останавливает активную сессию; `focus` только сбрасывает frame clock;
- Escape-resume выполняется на `keyup`, чтобы браузер не снял только что полученный Pointer Lock тем же Escape;
- `file://` и HTTP(S) должны сохранять один и тот же session contract;
- lifecycle listeners не дублируются между `state.js`, `session.js` и `runtime.js`.

**Verification oracle:** `scripts/validate-structure.mjs` проверяет ownership/load-order; CI дополнительно выполняет HTTP boot smoke и настоящий `file://` Chrome/CDP menu smoke.

При рефакторинге сохраняйте порядок browser events, а не только итоговые boolean-флаги. Для browser semantics сверяйтесь с MDN Pointer Lock API и Page Visibility API.


## Asset layer

`GAME_ASSETS` — единый каталог визуальных ресурсов и их presentation/fallback identity. Generated raster/WebP для HUD подключаются только через DOM/CSS и не должны возвращаться в `src/core/engine.js` как `gameTexture()`, `makeAssetPlane()` или `makeAssetSprite()`: постоянная WebGL-сцена сохраняет procedural/material-only invariant для совместимости с uCoz.

Каталог разделён по владельцам: gameplay SVG/fallback, UI/presentation, medals/status/fx, first-person weapon assets и generated presentation packs. Оружейные SVG остаются привязаны к `WEAPONS[].asset`, чтобы баланс и визуальная идентичность оружия оставались в одном источнике данных.

Полный operational contract для генерации, именования, оптимизации, wiring, CI и публикации находится в **[ASSETS.md](ASSETS.md)**; локальная карта дерева — в **[../assets/README.md](../assets/README.md)**.

## Arena visuals

Коллизии не менялись: базовые box meshes остаются источником AABB. Декали, рамки, терминальные экраны и emissive-детали добавляются дочерними визуальными объектами и не создают лишние collision volumes.

Это позволяет улучшать графику без изменения физики карты.

## Проверка

`scripts/validate-structure.mjs` проверяет существование и wiring assets. GitHub Actions дополнительно запускает browser boot smoke test через локальный HTTP server и headless Chrome.


## Visual layer v21.7

Новые декоративные meshes ботов не входят в `pts[]`: массив hit meshes и его порядок сохранены, поэтому визуальная броня не меняет hit detection или анимационные индексы.

`spawnHeadshotFx(position, lethal)` разделяет обычное попадание в голову и lethal finisher. Для смертельного попадания создаются отдельные transient Three.js объекты; `tickHeadshotFx()` отвечает за их анимацию и cleanup.

`tickEnvironment()` обновляет UV-offset воды и лёгкое качание деревьев. Эти эффекты не участвуют в коллизиях.


## Asset identity v21.8

Каталог `GAME_ASSETS.perkIcons` содержит явное соответствие `perk id -> SVG`. Интерфейс передаёт `perkAsset(id, path)` конкретный id, а прежняя иконка направления остаётся только fallback.

Combat medals не меняют score или XP. `showKillMedal()` читает уже вычисленные kill/combo/critical/distance flags и выбирает только визуальную награду.

`spawnCombatImpact()` создаёт краткоживущие world-space sprites и rings поверх существующей particle-системы. Очистка выполняется в `tickCombatImpactFx()`.

Status HUD также read-only относительно gameplay state: он отображает существующие поля `plr`, HP и armor. Отдельный armor-break overlay срабатывает только при переходе брони через ноль.


## Player presentation layer v21.9

`src/settings/settings.js` отделяет пользовательские presentation-настройки от gameplay state. Он хранит только чувствительность, громкость SFX и визуальные предпочтения — прогресс, баланс, HP/XP и perks остаются в прежних модулях.

Звуки синтезируются через Web Audio API после пользовательского жеста. Это убирает внешние аудиозависимости и не блокирует boot при недоступном аудиоконтексте.

`showHitMarker()` и `showDamageDirection()` являются read-only feedback относительно уже произошедшего combat event. Указатель урона вычисляет угол источника относительно `yaw`, но не вмешивается в AI, hit detection или damage calculation.

`triggerScreenShake()` двигает только CSS transform canvas и не модифицирует `camera.position`, поэтому эффект не способен изменить collision, projectile origins или сохранённую позицию игрока.

`tickGamePresentation()` вызывается независимо от active gameplay branch, чтобы FPS и затухание screen shake корректно восстанавливались даже при паузе или потере pointer lock.


## Weapon handling model v22.0

`WEAPONS[]` теперь является не только каталогом урона и моделей, но и единым источником handling-профиля оружия. Для огнестрельных систем используются:

- `fireMode` / `automatic` — semi, auto, pump, launcher или bolt;
- `rate`, `reload`, `clip` — cadence и ammo economy;
- `spread`, `adsSpread`, `moveSpread`, `airSpread` — точность по состоянию игрока;
- `falloffStart`, `falloffEnd`, `minDamageM` — дистанционная потеря урона;
- `recoilX`, `recoilY`, `recoilReturn`, `recoilDelay` — отдача и восстановление;
- `muzzleVelocity`, `bulletGravity`, `range` — физика ballistic projectile; `zoomFov` используется только scoped-профилем.

`weaponDamageScaleAtDistance()` является общей функцией falloff для игрока и AI, чтобы бот и игрок не жили в разных моделях баланса.

SR-9 использует `isSniper` и bolt-action profile. Scope — presentation-only слой: FOV, overlay и sensitivity меняются, но world collision/hit meshes и camera position не подменяются.

Старые индексы mine/bomb/smoke сохранены: SR-9 добавлена девятым слотом. Это специально уменьшает migration risk для сохранений и существующей логики взрывчатки.


## Ballistics and scope isolation v22.1

Обычные firearm-профили создают элементы в `pBullets[]`. Они двигаются по скорости `muzzleVelocity`, получают вертикальное ускорение `bulletGravity` и проверяются swept ray segment от предыдущей позиции к новой. Это предотвращает tunneling быстрых пуль между кадрами.

Damage применяется только в момент фактического пересечения projectile с hit sphere. Falloff использует накопленный `travel`, а penetration сохраняет projectile и уменьшает `damageScale`.

SR-9 намеренно является исключением: `hitscan:true` означает немедленный ray hit в момент выстрела. Для неё нет artificial travel delay или bullet drop. Визуальный shot trace краткоживущий и не участвует в damage timing.

RMB/ADS изолирован через `aimMode:'scope'`. Этот флаг есть только у SR-9. Input не меняет `zooming` у остальных профилей, а runtime дополнительно проверяет тот же `aimMode`, поэтому случайный `zoomFov` или stale state не может включить прицел другого оружия.

У SR-9 обычный center crosshair скрыт и в hip state, и внутри scope. У остальных оружий динамический crosshair визуализирует текущий итоговый spread с учётом movement, air penalty и weapon bloom.


## Weapon lifecycle v22.2

Оружие теперь имеет отдельный runtime lifecycle поверх `rate` и `reload`:

- `equipTime` блокирует огонь сразу после смены оружия;
- `sprintRecover` задаёт sprint-to-fire delay;
- `weaponReadyT`, `weaponEquipT`, `sprintExitT` и `cycleT` являются независимыми readiness-состояниями;
- `cycleTime` моделирует pump/bolt action отдельно от fire cooldown;
- `reloadStyle:'shell'` включает поштучную зарядку;
- `tacticalReloadM` и `emptyReloadM` разделяют reload с патроном в оружии и reload после полного опустошения;
- `firstShotM` влияет только на первый стабильный выстрел после сброса shot sequence.

`weaponActionBlocked()` является центральным guard для огня/перезарядки и предотвращает обход handling через sprint, equip или cycle. Quick-switch по `Q` вызывает обычный `switchW()`, поэтому также проходит equip time.

Shell reload использует `completePlayerReloadStep()`: каждый завершённый этап переносит ровно один патрон из reserve в shotgun. При наличии хотя бы одного патрона ЛКМ вызывает `cancelPlayerReload()` и затем разрешает выстрел без искусственного settle delay.

Pump/bolt casing ejection синхронизирован с `cycleT`, а не с моментом muzzle flash.

SR-9 имеет `oneShot:true`, но guaranteed lethal применяется только к primary hit через `oneShotEligible`. Penetration target получает обычный ослабленный damage scale.

## Crosshair ownership v22.2

Gameplay-reticle имеет один источник истины: DOM-элементы `.xh-arm` + `.xh-dot`. Старый `assets/ui/crosshair.svg` удалён. Это исключает одновременный static + dynamic overlay.

SR-9 не использует gameplay-reticle: runtime скрывает `#xhair` для любого `aimMode:'scope'`, а sniper optic рендерится отдельно через `#sniper-scope`.


## Tactical AI 2.0 v22.4

**Canonical owner:** `src/ai/tactics.js` владеет `BOT_TEAM_TACTICS`, общим squad focus, suppressor selection, role labels и общими тактическими фазами. `src/entities/bots.js` остаётся владельцем индивидуального FSM, cover/flank execution, fire gate/burst cadence и weapon-selection policy; concrete shot execution принадлежит `src/ai/bot-fire-control.js`, а locomotion mechanics — `src/ai/bot-navigation.js`. Это граница policy → execution: командный слой выбирает общий plan, bot FSM формирует intent, navigation owner безопасно исполняет movement intent.

Classic-script порядок `combat.js → ai/bot-perception.js → ai/bot-navigation.js → ai/bot-positioning.js → ai/bot-fire-control.js → ai/tactics.js → game/frontline.js → entities/bot-presentation.js → entities/bots.js` является частью runtime-контракта. Navigation должен существовать до bot consumer, `BOT_MAP_ZONES` — до инициализации Frontline state, а bot-presentation — до создания `Enemy`; функции этих owners могут обращаться к invocation-time bot/runtime globals только после завершения последовательного bootstrap.

Поверх индивидуального state machine введён командный слой `BOT_TEAM_TACTICS`. Он не заменяет perception/target selection, а агрегирует уже полученную информацию: текущие цели ботов, LOS, память и `TEAM_INTEL`. План пересчитывается с небольшим cache-window и выбирает общий focus, suppressor, число доступных flankers и наиболее раненого союзника.

`flankL` и `flankR` сохраняют разные стороны обхода. `findBotFlankPoint()` в `src/ai/bot-positioning.js` оценивает существующие `COVER_POINTS` по стороне относительно цели, длине маршрута, crowding и будущей линии огня; procedural fallback используется только если подходящей cover-точки нет. Сам flank-state и его commit timer остаются в `src/entities/bots.js`, поэтому destination scoring не получает FSM authority.

Suppressor — это не бонус к урону. Для suppress-mode увеличивается длина очереди и уменьшается accuracy. Промах по AI-цели может вызвать `registerSuppression()`: pressure временно ухудшает ответную точность и ускоряет reevaluation укрытия. Для игрока сохранён прежний fairness-контракт: suppression выражается объёмом огня и near-miss/whiz feedback, без скрытого замедления или debuff.

Support-state доступен `anchor` и `engineer`: при сильно раненом союзнике они могут сблизиться и удерживать боевую позицию рядом с ним. Это прикрытие, а не бесплатное лечение, поэтому существующая экономика HP и pickups не меняется.

`canPressurePlayer()` по-прежнему ограничивает число одновременно стреляющих по игроку врагов, но сортировка внутри этого лимита теперь предпочитает назначенного suppressor и понижает приоритет flankers. Так координация не превращается в неконтролируемый рост входящего DPS.


## Combat AI 2.1 / Map Tactics v22.5

`BOT_MAP_ZONES`, `refreshBotMapOrder()` и `botObjectivePoint()` принадлежат `src/ai/tactics.js`. Frontline capture/save/HUD state принадлежит `src/game/frontline.js`; он использует zone model как consumer, но не владеет doctrine selection. `src/entities/bots.js` потребляет active objective для tactical execution, не создавая второго source of truth.

Тактический слой теперь имеет два уровня: Tactical AI 2.0 отвечает за локальную координацию вокруг общей цели, а Map Tactics отвечает за то, **где** команда в целом должна вести бой. Карта представлена небольшим набором логических зон `BOT_MAP_ZONES`: центр и четыре основных направления арены. Это намеренно data-driven слой поверх существующей геометрии, без ложного предположения о высотах или navmesh, которых в текущей карте нет.

`refreshBotMapOrder()` оценивает friendly/hostile presence в каждой зоне, живую численность команд и глубину зоны относительно направления атаки команды. Из этого выбирается doctrine:
- `push` — при явном численном преимуществе или наличии общего боевого контакта без критической угрозы своей стороне;
- `retake` — когда противник получил заметный контроль на своей половине карты;
- `hold` — при существенном численном отставании либо когда выгоднее сохранить район, чем продолжать погоню.

Решение имеет `orderUntil` commit window: краткий переход противника через границу зоны не заставляет весь squad метаться между приказами каждый кадр. Emergency retake может сменить doctrine раньше.

`botObjectivePoint()` превращает командную зону в индивидуальную позицию с учётом роли. Assault смещается вперёд, anchor остаётся глубже, flankL/flankR разводятся по разным сторонам, engineer получает support offset. Точка проверяется существующей `collideWalls()`, поэтому map tactics использует те же collision boundaries, что и обычное движение ботов.

State `objective` не заменяет combat states. Mine dodge, retreat, resupply, cover, suppression/flank/support и видимая непосредственная угроза остаются выше по приоритету. Map-order в основном управляет repositioning между контактами. Для `hold` добавлен мягкий leash даже во время engage: он не телепортирует и не запрещает стрелять, а только постепенно возвращает бойца к назначенному сектору.

HUD союзников показывает текущую doctrine, выбранную зону и разницу живой численности, чтобы поведение команды было объяснимо игроку, а не выглядело случайным.


## Combat AI 2.2 / Adaptive Commander + locomotion stability v22.6

`PLAYER_TACTICAL_PROFILE`, doctrine/recovery decisions, assault-wave planning и coordinated smoke/frag policy принадлежат `src/ai/tactics.js`. `BOT_MOVE_CFG` и velocity/substep guards принадлежат `src/ai/bot-navigation.js`. Mine/bomb choice и fire gate остаются в `src/entities/bots.js`, а concrete firearm execution — в `src/ai/bot-fire-control.js`. При pure refactor эти слои нельзя одновременно «улучшать»: ownership extraction обязан сохранять прежние probabilities, timers и balance constants буквально.

Adaptive Commander работает поверх Map Tactics, не заменяя perception и локальный squad-plan. `PLAYER_TACTICAL_PROFILE` периодически семплирует положение игрока, сглаженную скорость перемещения и время недавнего огня. Длительное нахождение в радиусе небольшой anchor-зоны вместе с недавней стрельбой повышает `campScore`; глубокое продвижение по оси союзной→вражеской стороны классифицируется как rush. Это поведенческий сигнал для выбора командного приказа, а не скрытый debuff игрока.

Для красной команды camping-сигнал может включить doctrine `breach`. Она нацеливает map-order на район игрока, дольше удерживает flank commit и делает assault более глубоким. Существующий suppressor/pincer слой Tactical AI 2.0 остаётся механизмом исполнения приказа. Deep rush игрока, наоборот, усиливает `retake` ближайшей зоны.

Commander также отслеживает изменение team score. Потери во время `push` или `breach` увеличивают setback counter; после двух неудач включается короткий recovery window с `hold`. Это не rubber-band по HP/урону: меняется только тактический темп и позиционирование.

Utility зависит от doctrine. Мины немного предпочтительнее при `hold/retake`, а бомбы — при `breach`, особенно у engineer. Базовые cooldown, лимиты активных устройств и friendly-team semantics не меняются.

### Anti-teleport locomotion

Root cause визуальных рывков был в сочетании трёх факторов: dodge до ~3× base speed, очень быстрый urgent velocity response и использование того же dodge как stuck recovery. На высоком уровне дополнительный speed growth усиливал эффект.

v22.6 вводит:
- `BOT_MOVE_CFG` с отдельными speed multipliers и acceleration limits;
- более умеренный `triggerDodge()`;
- отдельный `unstuckT/unstuckDir` вместо вызова dodge при блокировке;
- `clampBotVelocity()` до и после velocity smoothing;
- `moveBotWithSubsteps()`, который дробит displacement на короткие collision-шаги;
- hard cap фактического displacement после collision push-out;
- ограниченный progression multiplier для `this.speed`.

Runtime всё ещё использует общий `dt <= 0.033`, поэтому новые caps дополняют существующий frame-time clamp и защищают именно AI locomotion/collision path. Mine avoidance, retreat и dodge остаются различимыми по скорости, но не должны превращаться в визуальную телепортацию.


## Frontline objective ownership v23.9

**Canonical owner:** `src/game/frontline.js`. Он владеет `FRONTLINE_CFG`, `frontlineObjective`, `frontlineZoneOwners`, control-score state, serialize/reset/restore, capture/rotation tick, world marker и objective HUD. Полный узкий контракт — `docs/specs/FRONTLINE.md`.

Граница намеренно не совпадает с «всё, где упоминается Frontline». `src/ai/tactics.js` остаётся owner-ом `BOT_MAP_ZONES` и doctrine/map policy; `src/entities/bots.js` остаётся owner-ом индивидуального bot FSM и только читает active objective/presence для tactical execution; `src/ui/minimap.js` только визуализирует objective/zone ownership; `src/player/state.js` вызывает публичный save/restore contract; `src/game/runtime.js` только вызывает tick и boot HUD/marker.

Evaluation-time зависимость Frontline — `BOT_MAP_ZONES`, поэтому Frontline остаётся между tactics и bot consumer. Текущий общий graph — `combat → bot-perception → bot-navigation → tactics → frontline → bot-presentation → bots`; navigation, Frontline и presentation являются отдельными prerequisites `bots.js`, при этом presentation не зависит от Frontline. Остальные зависимости (`botZonePresence`, `updateTeamScore`, player score/XP, audio, save, DOM/Three.js) используются только при вызове функций после завершения последовательного bootstrap и не становятся вторыми owners.

Pure extraction сохраняет буквально `rotateSeconds:44`, `captureSeconds:8.5`, `capturePoints:3`, clamp/restore semantics, capture reward `+150 score / +35 XP`, UI copy и side-effect order. Эти значения нельзя «заодно улучшать» в ownership-refactor; balance/UX change требует отдельной задачи и отдельного evidence.

Regression contract состоит из двух независимых слоёв: `scripts/frontline-owner.test.mjs` напрямую проверяет restore/reset/capture semantics через публичные classic-script функции, а `scripts/validate-structure.mjs` проверяет одного owner-а, consumer markers и load graph. HTTP Chrome boot и реальный `file://` Chrome/CDP smoke доказывают wiring/runtime parity.


## Bot presentation ownership v23.9

**Canonical owner:** `src/entities/bot-presentation.js`. Он владеет procedural body construction, стабильным gameplay `pts[]` hit-mesh order, decorative armor/readability, `weaponPivot`, real body hands/`armRig` и two-bone grip solver. Полный узкий контракт — `docs/specs/BOT_PRESENTATION.md`.

Граница намеренно не совпадает со всем visual code внутри `Enemy`. `src/entities/bots.js` остаётся owner-ом FSM, gait/combat motion и health-bar lifecycle: он создаёт presentation через `mkHuman()`, потребляет `src/ai/bot-navigation.js` для locomotion mechanics, двигает `weaponPivot` по уже выбранной gait/combat pose и затем вызывает `updateBotWeaponHands(this)`. `src/weapons/system.js` остаётся owner-ом weapon data и per-weapon `gripR/gripL/elbowR/elbowL` metadata.

Evaluation-time dependency presentation owner-а — глобальный `THREE`, потому что scratch vectors создаются при загрузке script. Поэтому `bot-presentation.js` обязан быть раньше `bots.js`. `MOBILE_LOW` и bot/weapon runtime objects используются только при вызове функций после bootstrap. Текущий canonical load sequence содержит `frontline → bot-presentation → bots`, но presentation не зависит от Frontline; оба являются независимыми prerequisites consumer-а.

Pure extraction сохраняет geometry/material constants, gameplay hit-mesh order, default weapon pivot, shoulder constants, arm lengths, scale clamp и coordinate transform `weapon local → world → bot local`. Вынесенные helpers запрещены в `bots.js` structural guard-ом, а consumer markers обязаны остаться там. `scripts/bot-presentation-owner.test.mjs` отдельно проверяет pin рук к grip points, coordinate-space conversion и fail-closed no-op при неполной pose metadata.
