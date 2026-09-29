# Bot suppression-response policy

## Назначение

**Canonical owner:** `src/ai/bot-suppression-response.js`.

Этот owner отвечает только за AI-response на уже обнаруженный bullet near-miss: валидирует источник подавления, нормализует pressure и ускоряет cover/FSM reevaluation timers.

Публичная точка входа для producers остаётся `Enemy.registerSuppression(source, intensity)` в `src/entities/bots.js`. Near-miss geometry и выбор ближайшего bot остаются в `src/combat/combat.js`.

## Граница ownership

### Owner делает

- отклоняет dead target, пустой source, self-source и same-team source;
- сохраняет допустимость player token `'player'`, как и прежний guard;
- clamp-ит pressure в диапазон `0.3..1.4`;
- продлевает `suppressedT` через `max(current, 0.62 + pressure * 0.78)`;
- записывает `suppressionSource`;
- clamp-ит `coverCooldownT <= 0.12`;
- при `hp/maxHp < 0.72` **или** `pressure > 0.9` clamp-ит `coverEvalT <= 0.05` и `stateCD <= 0.08`.

### Owner не делает

- bullet sweep / closest-point / near-miss detection;
- projectile physics, collision или weapon balance;
- decay `suppressedT` и очистку `suppressionSource`;
- cover candidate scoring или locomotion;
- FSM transition selection;
- perception/hearing/target acquisition;
- damage retaliation;
- RNG.

## Source semantics

Сохраняется исходный guard буквально по смыслу:

`!bot.alive || !source || source===bot || source.team===bot.team`

Поэтому same-team bot source отклоняется, а строковый player token `'player'` остаётся валидным: у него нет `team`, и прежняя реализация также принимала такой source.

## Pressure и строгие thresholds

Pressure нормализуется как:

`Math.max(0.3, Math.min(1.4, intensity))`

Thresholds намеренно строгие:

- `hp/maxHp < 0.72` — значение ровно `0.72` не ускоряет cover/state timers само по себе;
- `pressure > 0.9` — значение ровно `0.9` не ускоряет их само по себе.

Pure extraction не меняет эти сравнения на включительные.

## Event boundary

`src/combat/combat.js` остаётся единственным owner-ом swept-bullet near-miss detection и продолжает вызывать `nearest.registerSuppression(...)`.

`Enemy.registerSuppression(...)` остаётся compatibility seam и только делегирует в `applyBotSuppressionResponse(...)`. Combat producer не должен знать внутренности response policy.

Owner не вызывает `Math.random()`, поэтому extraction не меняет observable RNG consumption/order.

## Lifecycle и consumers

`src/entities/bots.js` пока сохраняет:

- decay `suppressedT` и очистку `suppressionSource`;
- использование suppression при cover reevaluation;
- использование suppression при FSM выборе `cover`.

Это отдельные lifecycle/consumer seams и не должны незаметно мигрировать в response owner.

## Verification oracle

- `scripts/bot-suppression-response-owner.test.mjs` фиксирует source semantics, clamps, monotonic duration и строгие boundary cases;
- `scripts/validate-structure.mjs` требует canonical owner, stable consumer seam, reverse guard, producer boundary и classic-script load order;
- `src/combat/combat.js` должен продолжать вызывать `Enemy.registerSuppression(...)`, а не owner напрямую;
- после source change обязательны canonical build stamp, structure validation, HTTP boot smoke и реальный `file://` smoke.
