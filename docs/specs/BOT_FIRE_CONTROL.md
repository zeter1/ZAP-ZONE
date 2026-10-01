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
- `executeBotShot(bot,target,dist,suppressMemory)` — LOS/smoke fail-close, spread, friendly-fire/rocket safety, emitted-shot recoil event, noise/audio/muzzle/casing, hitscan/projectile spawn, ammo consumption и near-miss suppression.
- `dealBotDamageToCurrentTarget(bot,amount,dir)` — передача damage текущей цели, bot kill counters, team score и kill feed.
- `botShotClosestApproachToPlayer(...)` — геометрия физического near-miss для suppression feedback.

## Ownership boundaries

- `src/entities/bots.js` — **when/why to enter the fire branch**: FSM, reaction timers, broad fire gate, cadence initialization/timer decay, weapon-switch policy, utility planting и suppression-state reaction.
- `src/ai/bot-fire-cadence.js` — post-shot `burstLeft`, burst reset/pause, next-shot `sT`, exact cadence RNG order и empty-mag reload handoff. См. `docs/specs/BOT_FIRE_CADENCE.md`.
- `src/ai/tactics.js` — squad doctrine, suppressor/flanker assignment и coordinated utility policy; muzzle origin берёт у fire-control owner.
- `src/weapons/system.js` — weapon definitions, damage/range/spread/rate/clip/reload data и shared weapon factories.
- `src/combat/combat.js` — projectile/collision primitives, player-pressure limiter, friendly-fire queries и suppression plumbing.
- `src/ai/bot-perception.js` — target/threat sensing; fire-control не выбирает цель.
- `src/entities/bot-presentation.js` — weapon/body visual rig; fire-control не владеет pose.

Итого: **sense → squad/FSM policy → fire gate → fire-control execution → post-shot cadence → combat primitives**.

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
- post-attempt burst/cadence остаётся отдельным owner-ом. В текущем legacy contract caller вызывает cadence после firearm attempt даже когда fire-control safety gate не emitted a shot; менять attempt-vs-emitted cadence разрешено только отдельной задачей с controlled-RNG regression.

Reusable cross-channel pattern: `docs/patterns/COMPOSED_FIRE_STABILITY.md`.

## Pure-refactor invariants

Без отдельной gameplay-задачи не менять:

- rocket lead clamp `1.05`, plasma lead clamp `.42`, aim smoothing `.16 + aimSkill*.18`;
- muzzle height `+1.22` и forward offset `.96`;
- reload randomization `.86 .. 1.04`;
- blocked-shot behavior и 20% short visual miss trace;
- suppression accuracy multipliers, friendly-fire gate и rocket safety distances;
- hitscan range penalty / hit chance / player alignment threshold;
- near-miss threshold `1.78` и cooldown semantics;
- pellet damage multipliers, player damage scale и ammo decrement order;
- bot kill/team-score/kill-feed side-effect order.

Нельзя одновременно с ownership extraction тюнить accuracy, DPS, reload cadence, burst sizes или ammo economy.

## Verification oracles

1. `node --test scripts/bot-fire-control-owner.test.mjs`.
2. `node scripts/validate-structure.mjs` — owner/consumer/reverse guards и load graph.
3. `node scripts/stamp-web-build.mjs --check`.
4. HTTP Chrome boot + реальный `file://` menu smoke.
5. Exact PR head Validate green; после merge — текущий main Validate либо явный `NOT VERIFIED`.

Behavior test важнее source grep: structural oracle фиксирует ownership, а `node:test` — observable semantics.
