# Bot damage-reaction policy

## Назначение

**Canonical owner:** `src/ai/bot-damage-reaction.js`.

Этот owner отвечает только за реакцию AI-состояния на уже произошедший damage event: кого считать источником ответного огня, как обновить target memory/lock и какие reaction/FSM timers ускорить.

Публичная точка входа для producers остаётся `Enemy.hurt(dmg, dir, fromTeam, source)` в `src/entities/bots.js`.

## Граница ownership

### Owner делает

- распознаёт живого hostile bot source;
- распознаёт player-origin damage для enemy bot;
- сохраняет точный retaliation predicate;
- обновляет `targetEn` / `targetIsPlayer`;
- обновляет `lastKnown`, `lastKnownVel`, `lastSeenT`, `lastTargetSeenAt`, `losT`;
- обновляет `targetLockT`, `searchPoint`, `searchStep`;
- ускоряет `reactionT`, `burstPauseT`, `stateCD`;
- переводит только `patrol/search → hunt`.

### Owner не делает

- HP mutation и damage formulas;
- hit flash/emissive presentation;
- dodge RNG и concrete dodge execution;
- suppression/near-miss policy;
- perception scans/hearing/LOS acquisition;
- weapon selection/fire-control;
- `die()`, gibs, cleanup, score/XP/kill-feed.

## Event order — runtime contract

`Enemy.hurt()` сохраняет порядок:

1. reject dead target;
2. mutate HP;
3. set hit/cover feedback state;
4. update hit presentation;
5. если target пережил hit — выполнить прежний dodge chance;
6. вызвать `applyBotDamageReaction(...)`;
7. если HP <= 0 — выполнить прежний `die(...)`.

Порядок важен: pure extraction не переносит и не добавляет `Math.random()`, поэтому observable RNG consumption не меняется.

## Source semantics

`botSource` существует только когда `source`:

- не `'player'`;
- не сам target bot;
- жив;
- принадлежит другой команде.

`playerSource` существует только для enemy bot, если `source==='player'` либо `fromTeam` равен `'player'` или `'ally'`.

Если одновременно валидны botSource и playerSource (например allied bot попал по enemy bot), botSource имеет приоритет — это сохраняет прежний `if / else if` contract.

## Retaliation threshold

Retarget разрешён, если выполнено хотя бы одно:

- current target сейчас не видим;
- `targetLockT <= 0.15`;
- входящий `dmg >= maxHp * 0.10`.

Граница **10% включительная**. Не заменять её на `>`, округление или другой threshold в refactor.

Если retarget не выполняется, owner всё равно:

- ограничивает `lastSeenT` максимумом `1.15`;
- clamp-ит `reactionT <= 0.07`;
- clamp-ит `burstPauseT <= 0.06`;
- переводит `patrol/search` в `hunt`;
- clamp-ит `stateCD <= 0.14`.

## Verification oracle

- `scripts/bot-damage-reaction-owner.test.mjs` фиксирует bot/player source semantics, memory/lock timers и точную границу 10%;
- `scripts/validate-structure.mjs` требует единственный canonical owner, consumer call, запрет HP/dodge/death/RNG authority и порядок dodge → reaction → death;
- classic-script loader обязан загружать owner до `src/entities/bots.js`;
- после source-изменения обязательны canonical build stamp, HTTP boot smoke и реальный `file://` smoke.
