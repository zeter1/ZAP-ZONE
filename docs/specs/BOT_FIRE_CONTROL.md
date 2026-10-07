# Bot fire-control execution contract

**Canonical owner:** `src/ai/bot-fire-control.js`

Читайте этот spec перед изменениями bot aim, muzzle origin, reload lifecycle, movement/burst firing stability, конкретного shot execution, hit/near-miss resolution или bot kill accounting. Owner отвечает на вопрос **«как уже принятое решение выстрелить исполняется?»** и не получает власть над FSM, выбором оружия, squad doctrine или burst policy.

## Owner scope

- `getBotAimPoint(bot,target)` — lead + smoothing aim point для уже выбранной цели.
- `getBotMuzzlePos(bot)` — canonical muzzle origin для выстрелов и coordinated utility.
- `startBotReload(bot)` / `finishBotReload(bot)` — execution lifecycle текущего магазина.
- `updateBotFireMovementStability(bot,dt)` — continuous measured-movement instability/recovery.
- `updateBotFireRecoilRecovery(bot,dt)` / `registerBotEmittedShotRecoil(bot,weapon)` — bounded per-bot burst recoil and emitted-shot event ownership.
- `getBotShotStabilityModifiers(...)` — deterministic composition movement + burst recoil + suppression without owning RNG.
- `executeBotShot(bot,target,dist,suppressMemory)` — LOS/smoke fail-close, spread, friendly-fire/rocket safety, emitted-shot recoil event, noise/audio/muzzle/casing, hitscan/projectile spawn, ammo consumption и near-miss suppression; всегда возвращает один `BOT_SHOT_OUTCOME`.
- `dealBotDamageToCurrentTarget(bot,amount,dir)` — передача damage текущей цели, bot kill counters, team score и kill feed.
- `botShotClosestApproachToPlayer(...)` — геометрия физического near-miss для suppression feedback.

## Ownership boundaries

- `src/entities/bots.js` — **when/why to enter the fire branch**: FSM, reaction timers, broad fire gate, cadence initialization/timer decay, weapon-switch policy, utility planting и suppression-state reaction.
- `src/ai/bot-fire-cadence.js` — единственный owner next-attempt `sT`: outcome-aware burst consumption, safety retry, burst reset/pause, exact cadence RNG order и empty-mag reload handoff. См. `docs/specs/BOT_FIRE_CADENCE.md`.
- `src/ai/tactics.js` — squad doctrine, suppressor/flanker assignment и coordinated utility policy; muzzle origin берёт у fire-control owner.
- `src/weapons/system.js` — weapon definitions, damage/range/spread/rate/clip/reload data и shared weapon factories.
- `src/combat/combat.js` — projectile/collision primitives, player-pressure limiter, friendly-fire queries и suppression plumbing.
- `src/ai/bot-perception.js` — target/threat sensing; fire-control не выбирает цель.
- `src/entities/bot-presentation.js` — weapon/body visual rig; fire-control не владеет pose.

Итого: **sense → squad/FSM policy → fire gate → fire-control execution → post-shot cadence → combat primitives**.

## Shot outcome contract

`executeBotShot(...)` сообщает **факт исполнения**, а не планирует следующую попытку. Закрытый набор `BOT_SHOT_OUTCOME`:

- `EMITTED` — projectile/hitscan реально исполнен и магазин уменьшен;
- `OCCLUDED` — wall или smoke fail-close остановили попытку до spread/safety/emission; suppress-memory fire через smoke остаётся разрешённым существующим контрактом;
- `FRIENDLY_FIRE` — направление после spread пересекает союзника;
- `ROCKET_SAFETY` — ракета слишком близко или её impact-zone небезопасна для союзника.
- `ROCKET_COOLDOWN` — после выпущенной ракеты ещё не прошло 10 активных секунд; проверка выполняется до aim/spread и не расходует ammo, burst или RNG. Cadence откладывает следующую попытку до окончания оставшегося интервала.

Инварианты seam:
- fire-control **не пишет `bot.sT`** и не декрементирует `burstLeft`; caller обязан передать outcome в `applyBotFireCadence(bot,shotOutcome)`;
- blocked outcome не расходует ammo и не регистрирует emitted-shot recoil/noise/muzzle/projectile;
- `weaponSwitchT=0` для unsafe rocket остаётся execution-side safety signal, но retry delay принадлежит cadence owner;
- unknown outcome не должен silently превращаться в обычный shot: cadence fail-fast защищает closed contract;
- emitted и occluded ветки сохраняют legacy cadence/RNG order; friendly-fire сохраняет один bounded retry draw `.10 + random*.12`, но больше не запускает generic cadence tail; rocket-safety использует fixed `.18` без cadence RNG. Это намеренное изменение RNG **только** для safety-blocked попыток.

Reusable attempt-vs-event pattern: `docs/patterns/OUTCOME_DRIVEN_CADENCE.md`.

## Occlusion-consistent blocked-shot feedback

Wall and smoke occlusion intentionally share the same gameplay outcome but not the same presentation endpoint:

- opaque geometry distance is owned by `src/core/engine.js` through `firstWallHitDistance(from,to,list)`; fire-control consumes that fact instead of performing a second raycast implementation;
- a wall-blocked 20% visual-only miss trace is clamped to `min(dist, 18, firstWallHitDistance)`, so feedback terminates at the first opaque surface and cannot imply a projectile continued through cover;
- smoke-only occlusion keeps the legacy `min(dist, 18)` visual trace because smoke is a visibility volume, not an opaque collision surface; suppress-memory fire through smoke remains unchanged;
- the feedback decision still consumes exactly one `Math.random()` draw. The geometry query and clamp are deterministic and add no hidden RNG;
- both cases still return `OCCLUDED`, consume no ammo/recoil/noise/damage/projectile authority and retain the Task 023 cadence contract.

Reusable geometry/presentation seam: `docs/patterns/OCCLUSION_CONSISTENT_PRESENTATION.md`.

## Dependency / load-order contract

Canonical classic-script segment:

`combat.js → bot-perception.js → bot-navigation.js → bot-positioning.js → bot-fire-control.js → bot-fire-cadence.js → bot-deployables.js → tactics.js → frontline.js → bot-presentation.js → bots.js`.

Fire-control загружается до `tactics.js`, потому что coordinated smoke/frag использует `getBotMuzzlePos(bot)`. Большинство combat/runtime dependencies являются invocation-time: функции вызываются после завершения bootstrap, когда `bots.js` уже создал per-bot state и kill counters.

## Movement-aware firing stability pattern

Fire-control consumes the **measured post-collision motion** already produced by `src/entities/bots.js`: `bot.velX/bot.velZ`. It must not infer shooter motion from `aiState`, strafe intent or a second velocity estimate.

Pipeline:

`collision-resolved velX/velZ → getBotMovementFireInstabilityTarget → updateBotFireMovementStability(dt) → getBotShotStabilityModifiers → executeBotShot`.

Contract:
- a near-stationary bot has zero movement penalty;
- forward movement increases instability, and equally fast lateral movement/strafe increases it more because the weapon platform is less settled;
- entry and recovery use exponential `dt` smoothing, so behavior is independent of 60/120/144 Hz frame partitioning;
- stopping does not instantly restore perfect stability: recovery has an explicit bounded owner state `bot.fireMoveInstability`;
- movement modifies projectile spread and hitscan probability without adding random draws or changing their order;
- weapon classes react differently: precision weapons are most movement-sensitive, while rocket/shotgun execution keeps a softer spread penalty;
- suppression remains a separate multiplicative pressure source and composes with movement instead of replacing it;
- friendly-fire, rocket-safety, damage, ammo, burst/cadence and target-motion semantics remain unchanged.

Reusable cross-system pattern: `docs/patterns/MEASURED_RUNTIME_STATE.md`.

## Burst recoil / settle pattern

Burst recoil — отдельный **event-driven** канал, а не расширение movement state. Canonical per-bot state: `bot.fireBurstRecoil` + `bot.fireRecoilWeaponKey`; profile выбирается по текущему weapon key внутри fire-control owner.

Pipeline:

`frame dt → updateBotFireRecoilRecovery → pre-shot stability modifiers → LOS/smoke + friendly-fire + rocket-safety gates → registerBotEmittedShotRecoil → emitted-shot effects`.

Contract:
- первый выстрел после полного settle использует recoil = 0; recoil регистрируется только **после** расчёта этого выстрела, поэтому последующий round не может оказаться устойчивее при прочих равных;
- rifle/plasma накапливают заметно больше sustained-burst instability, pistol — меньше; shotgun/sniper/rocket имеют низкие bounded profiles, соответствующие редким/single-shot cycles;
- recovery — exponential по `dt`, поэтому разбиение одного и того же времени на 60/120/144 Hz frames не меняет итоговое состояние;
- смена weapon key сбрасывает recoil state: старое оружие не «переносит» kick на новое;
- wall/smoke fail-close, friendly-fire block и unsafe rocket attempt не расходуют магазин и **не увеличивают** `fireBurstRecoil`;
- recoil composition не вызывает `Math.random()`: существующие spread/hit/cadence draws сохраняют прежний count/order;
- movement и recoil имеют разные имена, lifecycle и tests; не сводить их в один generic `accuracyPenalty`, иначе следующий AI не сможет понять источник нестабильности;
- outcome-aware burst/cadence остаётся отдельным owner-ом: safety-blocked friendly/rocket attempts не расходуют реальный burst, а wall/smoke `OCCLUDED` намеренно сохраняет legacy attempt-cadence, чтобы не усилить pressure незаметно.

Reusable cross-channel pattern: `docs/patterns/COMPOSED_FIRE_STABILITY.md`.

## Pure-refactor invariants

Без отдельной gameplay-задачи не менять:

- rocket lead clamp `1.05`, plasma lead clamp `.42`, aim smoothing `.16 + aimSkill*.18`;
- muzzle height `+1.22` и forward offset `.96`;
- reload randomization `.86 .. 1.04`;
- 20% short visual miss trace для occluded attempts; outcome/safety-retry semantics меняются только отдельной gameplay-задачей с controlled-RNG evidence;
- suppression accuracy multipliers, friendly-fire gate и rocket safety distances;
- hitscan range penalty / hit chance / player alignment threshold;
- near-miss threshold `1.78` и cooldown semantics;
- pellet damage multipliers, player damage scale и ammo decrement order;
- bot kill/team-score/kill-feed side-effect order.

Нельзя одновременно с ownership extraction тюнить accuracy, DPS, reload cadence, burst sizes или ammo economy.

## Verification oracles

1. `node --test scripts/bot-fire-control-owner.test.mjs`.
2. `node --test scripts/bot-fire-cadence-owner.test.mjs`.
3. `node scripts/validate-structure.mjs` — owner/consumer/reverse guards и load graph.
4. `node scripts/stamp-web-build.mjs --check`.
5. HTTP Chrome boot + реальный `file://` menu smoke.
6. Exact PR/head or main Validate green на exact source commit.

Behavior test важнее source grep: structural oracle фиксирует ownership, а `node:test` — observable semantics.
