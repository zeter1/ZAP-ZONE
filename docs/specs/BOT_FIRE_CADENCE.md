# Bot post-shot fire-cadence contract

**Canonical owner:** `src/ai/bot-fire-cadence.js`

Читайте этот spec перед изменениями длины bot burst, пауз между очередями, post-shot `sT`, suppressing cadence или RNG-порядка после уже принятого firearm attempt. Owner отвечает на вопрос **«какая очередь/пауза и когда разрешён следующий выстрел после текущей попытки?»** и не получает власть над broad fire gate или concrete shot execution.

## Owner scope

- `applyBotPostShotCadence(bot)` вызывается сразу после `executeBotShot(...)` в firearm-ветке.
- Декрементирует `burstLeft`; только при исчерпании burst вычисляет следующий burst и `burstPauseT`.
- Сохраняет legacy RNG consumption буквально, включая вычисление `normalPause` перед альтернативной enemy-vs-player pause.
- Всегда после firearm attempt планирует следующий `sT` через текущий weapon rate и `fireRateMul`.
- После cadence mutation передаёт пустой магазин в существующий `startBotReload(bot)`.
- Emitted-shot recoil **не** принадлежит cadence: `src/ai/bot-fire-control.js` увеличивает `fireBurstRecoil` только после успешных safety gates. Текущий cadence по-прежнему обслуживает firearm **attempt** и не меняет RNG semantics из-за recoil state.

## Ownership boundaries

- `src/entities/bots.js` — constructor RNG/initial cadence state, per-frame timer decay, broad fire gate, reaction/player-pressure checks и порядок `bomb → mine → firearm`.
- `src/ai/bot-fire-control.js` — aim/muzzle/reload implementation, shot attempt, ammo/hit/projectile/near-miss side effects.
- `src/weapons/system.js` — weapon rate/classification/data.
- `src/ai/bot-progression-scaling.js` — вычисляет `fireRateMul`; cadence owner только читает его.
- `src/ai/tactics.js` / bot FSM — формируют `tacticalMode`; cadence owner только читает suppress state.

Constructor `burstLeft` и `sT` намеренно остаются в `Enemy`: перенос их initialization RNG изменил бы global constructor draw order и уже не был бы pure refactor.

## Exact stochastic contract

После принятой firearm attempt:

1. `burstLeft--`.
2. Если burst ещё положительный, reset/pause RNG **не вызывается**.
3. При reset:
   - enemy→player: base = `1` для rocket/shotgun/sniper, иначе `2`; extra = `1` для sniper, иначе `2`;
   - прочая цель: sniper base `1`; rifle/plasma `4`; pistol `3`; прочие `1`; extra = sniper `1`, rifle/plasma `5`, прочие `3`;
   - suppressing (не rocket/sniper) добавляет `+2` к base и extra;
   - burst = `base + floor(random * extra)`.
4. `normalPause` всегда потребляет следующий RNG: base `.72` sniper / `.58` rocket / `.34` shotgun / `.16` other, плюс `random * (.18 + (1-aimSkill)*.22)`; suppressing умножает результат на `.48`.
5. Enemy→player после этого потребляет **ещё один** RNG и заменяет pause на `.24 + random*.22` при suppressing или `.42 + random*.42` иначе. Вычисленный `normalPause` в этой ветке не используется, но его RNG draw — часть legacy observable ordering.
6. `sT = max(enemy→player ? .095 : .055, weapon.rate * fireRateMul * (.96 + random*.24))`.
7. Только после этих mutations `mag<=0` вызывает reload handoff.

Не «оптимизировать» вычисление discarded `normalPause`, не объединять random draws и не переносить constructor RNG без отдельной gameplay/change task.

Отдельно: превращение cadence из **attempt-based** в **emitted-shot-based** поведение — это не «маленькая правка fire-control». Оно меняет burst consumption, fire pressure и RNG timing при LOS/friendly/rocket safety blocks, поэтому требует отдельной задачи и controlled-RNG evidence.

## Dependency / load-order contract

Classic-script segment:

`bot-weapon-policy.js → bot-fire-control.js → bot-fire-cadence.js → bot-deployables.js → tactics.js → frontline.js → bots.js`.

Cadence загружается после fire-control, потому что reload handoff использует `startBotReload(bot)`, и до `bots.js`, который является consumer-ом.

## Verification oracles

1. `node --test scripts/bot-fire-cadence-owner.test.mjs` — controlled RNG sequence, branch call counts/order, weapon/player/suppressing formulas, floors и reload ordering.
2. `node scripts/validate-structure.mjs` — owner/consumer/reverse/authority/order/load guards.
3. Existing fire-control/deployables regressions.
4. `node scripts/stamp-web-build.mjs --check`.
5. HTTP Chrome boot + real `file://` menu smoke.
6. Exact GitHub Actions Validate на exact source commit.

Behavior oracle главнее source grep: structural guard защищает ownership, controlled-RNG regression — observable cadence semantics.
