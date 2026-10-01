# Архитектура ZAP ZONE

## Порядок загрузки

1. Three.js r128.
2. `src/assets/catalog.js` — пути visual assets и helpers для Three.js textures/sprites/planes.
3. `src/core/engine.js` — renderer, arena, collision, environment decoration и particles.
4. `src/weapons/system.js` — каталог оружия и общий 3D weapon factory.
5. `src/player/state.js` — player state, perks, save/resume.
6. `src/settings/settings.js` — user settings, Web Audio SFX и presentation feedback.
7. `src/combat/combat.js` — input и combat.
8. `src/ai/bot-progression-scaling.js` — deterministic level/kills/role stat scaling и HP rescale.
9. `src/ai/bot-perception.js` — combat-noise bus, hearing, target acquisition, LOS memory и explosive/rocket sensing.
10. `src/ai/bot-damage-reaction.js` — retaliation/memory/reaction timers после damage event.
11. `src/ai/bot-suppression-response.js` — near-miss suppression response policy.
12. `src/ai/bot-dodge-response.js` — concrete dodge state/RNG execution.
13. `src/ai/bot-navigation.js` — patrol points, wall/smoke steering, movement caps и collision substeps.
14. `src/ai/bot-positioning.js` — per-bot cover/flank destination filtering и scoring.
15. `src/ai/bot-weapon-policy.js` — post-spawn weapon reselection, hold hysteresis и switch timing.
16. `src/ai/bot-fire-control.js` — aim/muzzle/reload, measured movement stability, emitted-shot burst recoil/settle, concrete shot/hit execution и closed outcome fact для уже принятого fire intent.
17. `src/ai/bot-fire-cadence.js` — outcome-aware burst consumption, safety retry, pause, next-attempt schedule и точный RNG order.
18. `src/ai/bot-deployables.js` — individual mine/bomb eligibility, role/doctrine probability и deployment side effects.
19. `src/ai/bot-state-policy.js` — periodic high-level state selection priority и post-selection `stateCD` schedule.
20. `src/ai/tactics.js` — squad coordination, Map Tactics и Adaptive Commander policy.
21. `src/game/frontline.js` — Frontline objective state/capture/rotation/save/HUD/marker.
22. `src/entities/bot-presentation.js` — procedural bot body, hit meshes, weapon pivot и two-hand arm rig.
23. `src/entities/bots.js` — per-bot state execution, event-driven state overrides, broad fire gate и tactical execution; state/cadence timer lifecycle остаётся здесь, а progression-scaling/perception/damage-reaction/suppression-response/dodge-response/navigation/positioning/weapon-policy/fire-control/fire-cadence/deployables/state-policy owners используются как consumer dependencies.
24. `src/entities/pickups.js` — ammo/health/bomb/weapon pickups.
25. `src/progression/progression.js` — HUD, XP, damage, death/respawn.
26. `src/game/session.js` — Pointer Lock, пауза/возврат, браузерный lifecycle и reset frame clock.
27. `src/ui/minimap.js` — тактическая миникарта.
28. `src/game/runtime.js` — frame simulation/render loop и boot.

## Bot progression-scaling policy owner

**Canonical owner:** `src/ai/bot-progression-scaling.js`. Узкий контракт — **[specs/BOT_PROGRESSION_SCALING.md](specs/BOT_PROGRESSION_SCALING.md)**.

`Enemy.syncScale(force=false)` остаётся стабильной lifecycle seam в `src/entities/bots.js`: constructor вызывает `syncScale(true)`, а update — обычный `syncScale()`. Owner владеет только детерминированным переводом глобальных `level`/`kills`, base stats и role в `aimSkill`, `maxHp/hp`, `speed`, `baseDmgMul`, `curAcc`, `fireRateMul` и `levelSync`.

Граница отделяет **progression policy** от исполнения: `bots.js` по-прежнему владеет HP damage/death, FSM и fire gate; `bot-navigation.js` только потребляет рассчитанную скорость; `bot-fire-control.js` потребляет accuracy/damage/fire-rate derived state; `weapons/system.js` остаётся owner-ом weapon data. Новый owner не получает weapon selection, perception, dodge, damage reaction или movement authority.

Pure extraction сохраняет формулы буквально, включая три легко ломаемые детали: `force=true` заполняет HP до нового max и обходит same-level early return; normal rescale использует минимум 24% прежнего HP ratio **и затем** legacy growth-heal `max(10, maxHp*0.05)`; fire-rate floor `0.62` применяется до assault multiplier `0.92`, поэтому effective assault minimum остаётся ниже 0.62. Owner не содержит RNG.

Behavior закреплён `scripts/bot-progression-scaling-owner.test.mjs`; structural validation требует canonical formulas, stable consumer seam, запрещает duplicate implementation в `bots.js`, unrelated AI authority в owner и неверный classic-script load order.

## Bot perception / threat-sensing owner

**Canonical owner:** `src/ai/bot-perception.js`. Узкий контракт — **[specs/BOT_PERCEPTION.md](specs/BOT_PERCEPTION.md)**. Owner владеет сбором и интерпретацией сенсорных сигналов: bounded combat-noise bus, hearing attenuation/uncertainty, target acquisition/scoring, LOS memory refresh, hostile grenade/mine scan cadence и incoming-rocket prediction.

Граница проходит по схеме **sense → decide → execute**. `src/combat/combat.js` и `src/weapons/system.js` остаются producer-ами projectile/mine/grenade/shot state. Perception читает эти данные и обновляет per-bot sensory memory. `src/entities/bots.js` остаётся owner-ом event-driven overrides (`hunt`, `retreat`, dodge), broad fire gate и tactical execution; periodic ordered state selection принадлежит `src/ai/bot-state-policy.js`, а damage-event reaction — отдельному owner; post-spawn weapon-selection policy принадлежит `src/ai/bot-weapon-policy.js`, concrete shot execution — `src/ai/bot-fire-control.js`, а post-shot burst/cadence — `src/ai/bot-fire-cadence.js`. `src/ai/tactics.js` может читать canonical `BOT_NOISE_EVENTS` для team-level awareness, но не владеет его lifecycle.

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

## Bot weapon-selection policy owner

**Canonical owner:** `src/ai/bot-weapon-policy.js`. Узкий контракт — **[specs/BOT_WEAPON_POLICY.md](specs/BOT_WEAPON_POLICY.md)**. Owner решает post-spawn reevaluation, current-weapon hold/hysteresis и next-switch timing.

Граница: **weapon data/scoring → selection policy → combat execution**. `weapons/system.js` остаётся source of truth для pool/scoring/visual rebuild; `bots.js` хранит state/FSM, декрементирует timer и вызывает policy; `bot-fire-control.js` только исполняет выбранный weapon. Unsafe rocket shot может выставить `weaponSwitchT=0` как reselection request, но не выбирает replacement.

Spawn-selection намеренно остаётся в `Enemy`: forced scorer + clip fill + visual refresh при уже заданном отдельном initial switch timer. Повторное использование post-spawn helper изменило бы cadence и нарушило pure-refactor contract.

Behavior закреплён `scripts/bot-weapon-policy-owner.test.mjs`; structural guards разрешают ровно один direct scorer call в `bots.js` для spawn и запрещают перенос pool/scoring, presentation, FSM или shot execution в policy.

## Bot fire-control execution owner

**Canonical owner:** `src/ai/bot-fire-control.js`. Узкий контракт — **[specs/BOT_FIRE_CONTROL.md](specs/BOT_FIRE_CONTROL.md)**. Он исполняет уже принятое решение о выстреле: считает lead/smoothed aim и muzzle origin, ведёт reload lifecycle, владеет двумя независимыми stability channels (`fireMoveInstability` и `fireBurstRecoil`), выполняет LOS/smoke/friendly-fire/rocket-safety gates, создаёт hitscan/projectile effects, применяет hit/near-miss semantics, расходует магазин и возвращает closed `BOT_SHOT_OUTCOME`. Next-attempt `sT` здесь не планируется.

Граница проходит между **policy** и **execution**. `src/entities/bots.js` по-прежнему решает когда разрешить fire/utility attempt и хранит cadence initialization/timer decay; post-shot burst/pause/next-shot policy делегирована `src/ai/bot-fire-cadence.js`, individual mine/bomb choice+deployment — `src/ai/bot-deployables.js`, а смена уже выбранного primary weapon — `src/ai/bot-weapon-policy.js`. `src/ai/tactics.js` владеет doctrine/coordinated utility, но использует canonical `getBotMuzzlePos(bot)`. `src/combat/combat.js` остаётся owner-ом projectile/collision primitives и player-pressure/friendly-fire plumbing, а `src/weapons/system.js` — weapon data.

Owner намеренно принимает явный `bot` argument вместо создания второго object model. Per-bot state (`aimPoint`, `reloadT`, `mag`, target refs, `fireMoveInstability`, `fireBurstRecoil`) остаётся на `Enemy`, но алгоритм fire-control state transitions живёт в одном месте. Movement state обновляется из measured post-collision velocity; burst recoil восстанавливается по `dt` и увеличивается только после LOS/friendly/rocket safety gates, когда firearm shot действительно emitted. Stability helpers не добавляют RNG. Caller обязан передать shot outcome в cadence owner; shared attempt-vs-event contract — **[patterns/OUTCOME_DRIVEN_CADENCE.md](patterns/OUTCOME_DRIVEN_CADENCE.md)**, stability composition — **[patterns/COMPOSED_FIRE_STABILITY.md](patterns/COMPOSED_FIRE_STABILITY.md)**.

Behavior закреплён `scripts/bot-fire-control-owner.test.mjs`; structural validation требует owner functions, consumers в `bots.js`/tactics, переносит ballistic source-oracles в новый owner и запрещает возврат старых methods в `Enemy`.

## Bot outcome-aware fire-cadence owner

**Canonical owner:** `src/ai/bot-fire-cadence.js`. Узкий контракт — **[specs/BOT_FIRE_CADENCE.md](specs/BOT_FIRE_CADENCE.md)**. Owner получает explicit `BOT_SHOT_OUTCOME` из fire-control и единолично владеет next-attempt `sT`, burst consumption/reset/pause, safety retry и empty-mag reload handoff.

Граница: **broad fire gate → concrete execution/outcome → outcome-aware cadence**. `bots.js` сохраняет constructor RNG, timer decay, player-pressure/reaction checks и порядок utility/fire; `bot-fire-control.js` сохраняет safety/shot/ammo/recoil/hit side effects и не пишет `sT`; cadence читает weapon classification, `aimSkill`, `fireRateMul` и tactical mode, но не выбирает цель/оружие и не исполняет shot.

Outcome policy намеренно не симметрична. `EMITTED` и wall/smoke `OCCLUDED` сохраняют legacy full cadence/RNG — это защищает от скрытого усиления pressure. `FRIENDLY_FIRE` и `ROCKET_SAFETY` не расходуют реальный burst и используют bounded retry (`.10+random*.12` и fixed `.18`). Так исправлен прежний double-owner bug, где fire-control выставлял safety backoff, а generic cadence сразу его перезаписывал. Closed-contract unknown outcome fail-fast.

Controlled-RNG regression фиксирует legacy emitted/occluded formulas и отдельные safety draw counts. Reusable seam — **[patterns/OUTCOME_DRIVEN_CADENCE.md](patterns/OUTCOME_DRIVEN_CADENCE.md)**.

## Bot high-level state-selection policy owner

**Canonical owner:** `src/ai/bot-state-policy.js`. Узкий контракт — **[specs/BOT_STATE_POLICY.md](specs/BOT_STATE_POLICY.md)**. Owner получает уже вычисленные в `Enemy.update()` факты и выбирает только periodic high-level `aiState`, после чего назначает legacy `stateCD`.

Граница: **fact production + cooldown lifecycle → ordered state decision → state execution**. `src/entities/bots.js` сохраняет `stateCD` decrement/gate, hearing/explosive event overrides, tactical/perception fact production и весь movement/combat switch; `bot-positioning.js` продолжает владеть cover/flank destination scoring, `tactics.js` — squad doctrine, а fire/deployable owners не получают FSM authority.

Pure extraction сохраняет приоритет буквально: `resupply → retreat → support → cover → flank → map objective → engage → hunt → search → objective/patrol fallback`. Сохраняются strict thresholds `.48/.25/.58/.72`, inclusive engage range (`<= range*1.14` ally, `<= range*1.08` enemy), strict `lastSeenT < 8.5/<14.5` и то, что `mapOrderWanted` опережает engage/hunt/search.

Stochastic contract также является частью поведения: один реальный policy call потребляет ровно один `Math.random()` для `stateCD=.22+random*.30`; при `stateCD>0` caller не вызывает policy и state-selection RNG не расходуется. Controlled-RNG regression плюс structural gate фиксируют это отдельно от state execution.

`scripts/bot-state-policy-owner.test.mjs` проверяет priority conflicts, exact threshold boundaries, ally/enemy engage range, hunt/search boundaries, fallback и RNG count. `scripts/validate-structure.mjs` дополнительно запрещает возврат ladder в `bots.js`, leakage movement/perception/tactics/combat authority в policy owner и неправильный classic-script load order.
## Bot individual deployables owner

**Canonical owner:** `src/ai/bot-deployables.js`. Узкий контракт — **[specs/BOT_DEPLOYABLES.md](specs/BOT_DEPLOYABLES.md)**. Owner получает уже разрешённый individual utility attempt и решает eligibility/probability для mine/bomb, после чего выполняет placement через существующие shared combat primitives.

Граница: **fire/utility gate → individual deployable policy+execution → shared combat state**. `src/entities/bots.js` сохраняет FSM, broad fire gate, порядок `bomb → mine → firearm shot`, cooldown initialization/decrement; firearm post-shot cadence принадлежит `src/ai/bot-fire-cadence.js`, а deployable-success `sT` значения остаются в orchestrator branch. `src/ai/bot-deployables.js` владеет range/limit/role/doctrine checks, decision probability и device creation side effects после вызова. `src/ai/tactics.js` отдельно владеет coordinated smoke/frag doctrine. `src/combat/combat.js` остаётся owner-ом shared mine collection, constructors/collision helpers и player deployables, а `src/weapons/system.js` — deployable data/config.

Pure extraction сохраняет thresholds, role/doctrine multipliers, limits, damage formulas, placement physics и observable RNG consumption буквально: mine — decision → arm delay → check delay; bomb — decision → success cooldown jitter. Refactor не меняет balance и не вводит новый RNG abstraction только ради теста.

Behavior закреплён `scripts/bot-deployables-owner.test.mjs`; structural validation требует owner functions и consumer order, запрещает возврат implementation в `Enemy`, запрещает FSM/squad/fire-control authority в deployables owner и фиксирует classic-script dependency order.

## Bot damage-reaction policy owner

**Canonical owner:** `src/ai/bot-damage-reaction.js`. Узкий контракт — **[specs/BOT_DAMAGE_REACTION.md](specs/BOT_DAMAGE_REACTION.md)**.

Owner получает уже произошедший damage event из стабильной public seam `Enemy.hurt(...)` и владеет только retaliatory AI policy: hostile bot/player source semantics, точным retarget predicate, target memory/velocity, target lock и ускорением reaction/burst/FSM timers.

Граница намеренно отделяет **damage application/lifecycle** от **AI response policy**. `src/entities/bots.js` по-прежнему мутирует HP, показывает hit emissive, сохраняет прежний survived-damage dodge chance и вызывает стабильную `Enemy.triggerDodge()` seam; concrete dodge-response execution принадлежит `src/ai/bot-dodge-response.js`, после чего damage-reaction owner всё так же вызывается до `die()`. `src/ai/bot-perception.js` остаётся owner-ом active sensing/hearing/LOS target acquisition; near-miss suppression остаётся отдельной event seam, теперь с собственным response owner `src/ai/bot-suppression-response.js`, и не смешивается с damage reaction.

Pure extraction сохраняет точную включительную границу `dmg >= maxHp * 0.10`, source precedence, target-memory fields и timer clamps. Новый owner не содержит `Math.random()`, поэтому RNG consumption/order `Enemy.hurt()` не меняется.

Behavior закреплён `scripts/bot-damage-reaction-owner.test.mjs`; structural validation требует canonical definition + consumer, запрещает возврат implementation в `bots.js`, запрещает HP/dodge/death/RNG authority в owner и фиксирует event order `dodge → damage reaction → death`.

## Bot suppression-response policy owner

**Canonical owner:** `src/ai/bot-suppression-response.js`. Узкий контракт — **[specs/BOT_SUPPRESSION_RESPONSE.md](specs/BOT_SUPPRESSION_RESPONSE.md)**.

`src/combat/combat.js` остаётся owner-ом swept-bullet near-miss detection и вызывает стабильную seam `Enemy.registerSuppression(...)`. `src/entities/bots.js` сохраняет эту public seam, suppression decay/source expiry и потребление suppression в cover/FSM, но сама near-miss response policy теперь делегируется в owner.

Owner сохраняет прежний source guard, clamp `0.3..1.4`, duration `max(current, 0.62 + pressure * 0.78)`, `coverCooldownT <= 0.12` и строгие thresholds `hp/maxHp < 0.72` / `pressure > 0.9` для `coverEvalT <= 0.05` и `stateCD <= 0.08`. Строковый player token остаётся допустимым source, как и до extraction.

Owner не содержит `Math.random()`, near-miss geometry, perception, cover scoring или FSM transition selection. Structural validation запрещает duplicate implementation в `bots.js`, прямой обход seam из `combat.js` и неправильный classic-script load order.

## Bot dodge-response execution owner

**Canonical owner:** `src/ai/bot-dodge-response.js`. Узкий контракт — **[specs/BOT_DODGE_RESPONSE.md](specs/BOT_DODGE_RESPONSE.md)**.

`Enemy.triggerDodge(preferredDir=0, urgency=1)` остаётся стабильной public seam в `src/entities/bots.js`. Survived-damage и rocket-threat branches решают **когда** вызвать dodge и с какими direction/urgency; owner решает только **как** применить уже принятый запрос.

Owner сохраняет ранний reject при active dodge/cooldown, fallback direction, duration/speed urgency clamps, cooldown и optional jump. Здесь намеренно остаётся `Math.random()`, потому что concrete RNG consumption — часть этой execution policy: preferred direction short-circuit пропускает direction draw; rejected request не потребляет RNG; jump predicate всегда потребляет свой draw до проверки `jV===0`, а impulse draw появляется только после успешного predicate и нулевой вертикальной скорости.

Dodge timer decay, movement-vector consumption, speed cap/collision остаются в `src/entities/bots.js` + `src/ai/bot-navigation.js`; rocket sensing остаётся в perception. `scripts/bot-dodge-response-owner.test.mjs` фиксирует controlled-RNG semantics, а structure validation запрещает duplicate implementation, producer bypass и неверный classic-script load order.

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


## Projectile ricochet ownership v23.9

**Canonical policy owner:** `src/combat/projectile-ricochet.js`; узкий контракт — **[specs/PROJECTILE_RICOCHET.md](specs/PROJECTILE_RICOCHET.md)**. `src/combat/combat.js` сохраняет swept collision, penetration-first ordering, projectile mutation и FX/audio; `src/core/engine.js` — geometry/material mapping и world-space normals.

После Task 020 player и bot ballistic projectiles используют одну bounce execution model: max-one ricochet, reflection по surface normal, post-impact offset и монотонное уменьшение speed/damage. Прежние player/enemy material chance profiles сохранены раздельно, чтобы bugfix не стал скрытым rebalance.

Критичный порядок: **target hit → wall penetration → ricochet → terminal impact**. Ineligible/capped impacts не расходуют RNG. Plasma и hitscan SR-9 не переводятся в эту ветку.


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

**Canonical owner:** `src/ai/tactics.js` владеет `BOT_TEAM_TACTICS`, общим squad focus, suppressor selection, role labels и общими тактическими фазами. `src/entities/bots.js` остаётся владельцем индивидуального FSM orchestration и broad fire gate; cover/peek execution принадлежит `src/ai/bot-cover-execution.js`, engage-state movement intent — `src/ai/bot-engagement-movement.js`; weapon reselection принадлежит `src/ai/bot-weapon-policy.js`, concrete shot execution — `src/ai/bot-fire-control.js`, post-shot cadence — `src/ai/bot-fire-cadence.js`, а locomotion mechanics — `src/ai/bot-navigation.js`. Это граница policy → execution: командный слой выбирает общий plan, bot FSM формирует intent, navigation owner безопасно исполняет movement intent.

Classic-script порядок `combat.js → ai/bot-progression-scaling.js → ai/bot-perception.js → ai/bot-damage-reaction.js → ai/bot-suppression-response.js → ai/bot-dodge-response.js → ai/bot-navigation.js → ai/bot-positioning.js → ai/bot-cover-execution.js → ai/bot-engagement-movement.js → ai/bot-weapon-policy.js → ai/bot-fire-control.js → ai/bot-fire-cadence.js → ai/bot-deployables.js → ai/bot-state-policy.js → ai/tactics.js → game/frontline.js → entities/bot-presentation.js → entities/bots.js` является частью runtime-контракта. Каждый policy/execution owner должен существовать до bot consumer; `BOT_MAP_ZONES` — до инициализации Frontline state, а bot-presentation — до создания `Enemy`. Функции owners могут обращаться к invocation-time bot/runtime globals только после завершения последовательного bootstrap.

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

`PLAYER_TACTICAL_PROFILE`, doctrine/recovery decisions, assault-wave planning и coordinated smoke/frag policy принадлежат `src/ai/tactics.js`. `BOT_MOVE_CFG` и velocity/substep guards принадлежат `src/ai/bot-navigation.js`. Fire gate остаётся в `src/entities/bots.js`, individual mine/bomb choice+deployment принадлежат `src/ai/bot-deployables.js`, а concrete firearm execution — `src/ai/bot-fire-control.js`, а post-shot burst/pause/next-shot RNG policy — `src/ai/bot-fire-cadence.js`. При pure refactor эти слои нельзя одновременно «улучшать»: ownership extraction обязан сохранять прежние probabilities, timers и balance constants буквально.

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

Evaluation-time зависимость Frontline — `BOT_MAP_ZONES`, поэтому Frontline остаётся между tactics и bot consumer. Текущий общий graph — `combat → bot-progression-scaling → bot-perception → bot-damage-reaction → bot-suppression-response → bot-dodge-response → bot-navigation → bot-positioning → bot-cover-execution → bot-weapon-policy → bot-fire-control → bot-fire-cadence → bot-deployables → tactics → frontline → bot-presentation → bots`; navigation, positioning, cover-execution, weapon-policy, fire-control, fire-cadence, deployables, Frontline и presentation являются отдельными prerequisites `bots.js`, при этом presentation не зависит от Frontline. Остальные зависимости (`botZonePresence`, `updateTeamScore`, player score/XP, audio, save, DOM/Three.js) используются только при вызове функций после завершения последовательного bootstrap и не становятся вторыми owners.

Pure extraction сохраняет буквально `rotateSeconds:44`, `captureSeconds:8.5`, `capturePoints:3`, clamp/restore semantics, capture reward `+150 score / +35 XP`, UI copy и side-effect order. Эти значения нельзя «заодно улучшать» в ownership-refactor; balance/UX change требует отдельной задачи и отдельного evidence.

Regression contract состоит из двух независимых слоёв: `scripts/frontline-owner.test.mjs` напрямую проверяет restore/reset/capture semantics через публичные classic-script функции, а `scripts/validate-structure.mjs` проверяет одного owner-а, consumer markers и load graph. HTTP Chrome boot и реальный `file://` Chrome/CDP smoke доказывают wiring/runtime parity.


## Bot presentation ownership v23.9

**Canonical owner:** `src/entities/bot-presentation.js`. Он владеет procedural body construction, стабильным gameplay `pts[]` hit-mesh order, decorative armor/readability, `weaponPivot`, real body hands/`armRig` и two-bone grip solver. Полный узкий контракт — `docs/specs/BOT_PRESENTATION.md`.

Граница намеренно не совпадает со всем visual code внутри `Enemy`. `src/entities/bots.js` остаётся owner-ом FSM, gait/combat motion и health-bar lifecycle: он создаёт presentation через `mkHuman()`, потребляет `src/ai/bot-navigation.js` для locomotion mechanics, двигает `weaponPivot` по уже выбранной gait/combat pose и затем вызывает `updateBotWeaponHands(this)`. `src/weapons/system.js` остаётся owner-ом weapon data и per-weapon `gripR/gripL/elbowR/elbowL` metadata.

Evaluation-time dependency presentation owner-а — глобальный `THREE`, потому что scratch vectors создаются при загрузке script. Поэтому `bot-presentation.js` обязан быть раньше `bots.js`. `MOBILE_LOW` и bot/weapon runtime objects используются только при вызове функций после bootstrap. Текущий canonical load sequence содержит `frontline → bot-presentation → bots`, но presentation не зависит от Frontline; оба являются независимыми prerequisites consumer-а.

Pure extraction сохраняет geometry/material constants, gameplay hit-mesh order, default weapon pivot, shoulder constants, arm lengths, scale clamp и coordinate transform `weapon local → world → bot local`. Вынесенные helpers запрещены в `bots.js` structural guard-ом, а consumer markers обязаны остаться там. `scripts/bot-presentation-owner.test.mjs` отдельно проверяет pin рук к grip points, coordinate-space conversion и fail-closed no-op при неполной pose metadata.


## Reusable cross-system patterns

- measured runtime fact → deterministic derived policy → one semantic owner: `docs/patterns/MEASURED_RUNTIME_STATE.md`. Use this instead of duplicating post-collision velocity/state from an intent or FSM label.
