# Архитектура ZAP ZONE

## Порядок загрузки

1. Three.js r128.
2. `src/assets/catalog.js` — пути visual assets и helpers для Three.js textures/sprites/planes.
3. `src/core/engine.js` — renderer, arena, collision, environment decoration и particles.
4. `src/weapons/system.js` — каталог оружия и общий 3D weapon factory.
5. `src/player/state.js` — player state, perks, save/resume.
6. `src/settings/settings.js` — user settings, Web Audio SFX и presentation feedback.
7. `src/combat/combat.js` — input и combat.
8. `src/entities/bots.js` — AI.
9. `src/entities/pickups.js` — ammo/health/bomb/weapon pickups.
10. `src/progression/progression.js` — HUD, XP, damage, death/respawn.
11. `src/game/runtime.js` — main loop и boot.

## Asset layer

`GAME_ASSETS` — единый каталог неоружейных визуальных ресурсов. `gameTexture()` кеширует Three.js textures. `makeAssetPlane()` используется для environment decals, `makeAssetSprite()` — для billboard icons над pickups.

Каталог разделён на:

- `pickups`;
- `environment`;
- `ui`.

Оружейные SVG остаются привязаны к `WEAPONS[].asset`, чтобы баланс и визуальная идентичность оружия оставались в одном источнике данных.

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

Поверх индивидуального state machine введён командный слой `BOT_TEAM_TACTICS`. Он не заменяет perception/target selection, а агрегирует уже полученную информацию: текущие цели ботов, LOS, память и `TEAM_INTEL`. План пересчитывается с небольшим cache-window и выбирает общий focus, suppressor, число доступных flankers и наиболее раненого союзника.

`flankL` и `flankR` сохраняют разные стороны обхода. `findFlankPoint()` сначала оценивает существующие `COVER_POINTS` по стороне относительно цели, длине маршрута, crowding и будущей линии огня; procedural fallback используется только если подходящей cover-точки нет. Flank-state имеет commit timer, поэтому бот не меняет решение каждый кадр.

Suppressor — это не бонус к урону. Для suppress-mode увеличивается длина очереди и уменьшается accuracy. Промах по AI-цели может вызвать `registerSuppression()`: pressure временно ухудшает ответную точность и ускоряет reevaluation укрытия. Для игрока сохранён прежний fairness-контракт: suppression выражается объёмом огня и near-miss/whiz feedback, без скрытого замедления или debuff.

Support-state доступен `anchor` и `engineer`: при сильно раненом союзнике они могут сблизиться и удерживать боевую позицию рядом с ним. Это прикрытие, а не бесплатное лечение, поэтому существующая экономика HP и pickups не меняется.

`canPressurePlayer()` по-прежнему ограничивает число одновременно стреляющих по игроку врагов, но сортировка внутри этого лимита теперь предпочитает назначенного suppressor и понижает приоритет flankers. Так координация не превращается в неконтролируемый рост входящего DPS.


## Combat AI 2.1 / Map Tactics v22.5

Тактический слой теперь имеет два уровня: Tactical AI 2.0 отвечает за локальную координацию вокруг общей цели, а Map Tactics отвечает за то, **где** команда в целом должна вести бой. Карта представлена небольшим набором логических зон `BOT_MAP_ZONES`: центр и четыре основных направления арены. Это намеренно data-driven слой поверх существующей геометрии, без ложного предположения о высотах или navmesh, которых в текущей карте нет.

`refreshBotMapOrder()` оценивает friendly/hostile presence в каждой зоне, живую численность команд и глубину зоны относительно направления атаки команды. Из этого выбирается doctrine:
- `push` — при явном численном преимуществе или наличии общего боевого контакта без критической угрозы своей стороне;
- `retake` — когда противник получил заметный контроль на своей половине карты;
- `hold` — при существенном численном отставании либо когда выгоднее сохранить район, чем продолжать погоню.

Решение имеет `orderUntil` commit window: краткий переход противника через границу зоны не заставляет весь squad метаться между приказами каждый кадр. Emergency retake может сменить doctrine раньше.

`botObjectivePoint()` превращает командную зону в индивидуальную позицию с учётом роли. Assault смещается вперёд, anchor остаётся глубже, flankL/flankR разводятся по разным сторонам, engineer получает support offset. Точка проверяется существующей `collideWalls()`, поэтому map tactics использует те же collision boundaries, что и обычное движение ботов.

State `objective` не заменяет combat states. Mine dodge, retreat, resupply, cover, suppression/flank/support и видимая непосредственная угроза остаются выше по приоритету. Map-order в основном управляет repositioning между контактами. Для `hold` добавлен мягкий leash даже во время engage: он не телепортирует и не запрещает стрелять, а только постепенно возвращает бойца к назначенному сектору.

HUD союзников показывает текущую doctrine, выбранную зону и разницу живой численности, чтобы поведение команды было объяснимо игроку, а не выглядело случайным.
