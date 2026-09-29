# Bot fire-control execution contract

**Canonical owner:** `src/ai/bot-fire-control.js`

Читайте этот spec перед изменениями bot aim, muzzle origin, reload lifecycle, конкретного shot execution, hit/near-miss resolution или bot kill accounting. Owner отвечает на вопрос **«как уже принятое решение выстрелить исполняется?»** и не получает власть над FSM, выбором оружия, squad doctrine или burst policy.

## Owner scope

- `getBotAimPoint(bot,target)` — lead + smoothing aim point для уже выбранной цели.
- `getBotMuzzlePos(bot)` — canonical muzzle origin для выстрелов и coordinated utility.
- `startBotReload(bot)` / `finishBotReload(bot)` — execution lifecycle текущего магазина.
- `executeBotShot(bot,target,dist,suppressMemory)` — LOS/smoke fail-close, spread, friendly-fire/rocket safety, noise/audio/muzzle/casing, hitscan/projectile spawn, ammo consumption и near-miss suppression.
- `dealBotDamageToCurrentTarget(bot,amount,dir)` — передача damage текущей цели, bot kill counters, team score и kill feed.
- `botShotClosestApproachToPlayer(...)` — геометрия физического near-miss для suppression feedback.

## Ownership boundaries

- `src/entities/bots.js` — **when/why to fire**: FSM, reaction timers, fire gate, burst size/pause, `sT`, weapon-switch policy, utility planting и suppression-state reaction.
- `src/ai/tactics.js` — squad doctrine, suppressor/flanker assignment и coordinated utility policy; muzzle origin берёт у fire-control owner.
- `src/weapons/system.js` — weapon definitions, damage/range/spread/rate/clip/reload data и shared weapon factories.
- `src/combat/combat.js` — projectile/collision primitives, player-pressure limiter, friendly-fire queries и suppression plumbing.
- `src/ai/bot-perception.js` — target/threat sensing; fire-control не выбирает цель.
- `src/entities/bot-presentation.js` — weapon/body visual rig; fire-control не владеет pose.

Итого: **sense → squad/FSM policy → fire gate/burst policy → fire-control execution → combat primitives**.

## Dependency / load-order contract

Canonical classic-script segment:

`combat.js → bot-perception.js → bot-navigation.js → bot-positioning.js → bot-fire-control.js → tactics.js → frontline.js → bot-presentation.js → bots.js`.

Fire-control загружается до `tactics.js`, потому что coordinated smoke/frag использует `getBotMuzzlePos(bot)`. Большинство combat/runtime dependencies являются invocation-time: функции вызываются после завершения bootstrap, когда `bots.js` уже создал per-bot state и kill counters.

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
