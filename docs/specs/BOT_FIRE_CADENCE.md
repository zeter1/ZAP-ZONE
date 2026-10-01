# Bot outcome-aware fire-cadence contract

**Canonical owner:** `src/ai/bot-fire-cadence.js`

Читайте этот spec перед изменениями длины bot burst, пауз между очередями, next-attempt `sT`, blocked-shot retry или RNG-порядка после firearm execution. Fire-control сообщает **что произошло**, cadence отвечает **когда разрешена следующая попытка и считается ли текущий outcome реальным burst shot**.

Reusable cross-owner pattern: `docs/patterns/OUTCOME_DRIVEN_CADENCE.md`.

## Public seam

`applyBotFireCadence(bot,shotOutcome)` принимает только значения закрытого `BOT_SHOT_OUTCOME`, объявленного fire-control owner-ом:

| Outcome | Burst | Next-attempt schedule | Cadence RNG | Причина |
|---|---|---|---:|---|
| `EMITTED` | decrement/reset | legacy weapon cadence | 1 или 3/4 при reset | реальный shot |
| `OCCLUDED` | decrement/reset | legacy weapon cadence | как legacy attempt | консервативно не усиливать wall/smoke pressure |
| `FRIENDLY_FIRE` | **не менять** | `.10 + random*.12` | **1** | bounded safety retry; союзник не «съедает» burst |
| `ROCKET_SAFETY` | **не менять** | fixed `.18` | **0** | bounded explosive-safety retry |
| неизвестный | no mutation | throw | 0 | fail-fast closed contract |

Fire-control не имеет права писать `bot.sT`. `src/entities/bots.js` обязан сохранить результат `executeBotShot(...)` и без преобразования передать его cadence owner-у.

## Почему occluded и safety blocks различаются

Wall/smoke `OCCLUDED` оставлен attempt-based намеренно. Старое поведение уже ограничивало pressure через полный weapon cadence и burst reset; превращение его в короткий retry могло бы увеличить wall spam и частоту reacquisition без отдельного balance evidence.

Friendly-fire и rocket-safety — другое: это safety veto после выбранного направления/оружия. До этой правки fire-control ставил `sT=.10+random*.12` или `.18`, но caller сразу запускал generic cadence и **перезаписывал этот backoff**. Теперь scheduler один:
- friendly-fire сохраняет intended bounded retry и реальный burst;
- unsafe rocket сохраняет `.18`, сбрасывает `weaponSwitchT=0` в fire-control и не расходует burst;
- ни одна safety ветка не создаёт zero-delay retry loop.

## Exact stochastic contract для EMITTED / OCCLUDED

Для `EMITTED` и `OCCLUDED` прежний алгоритм сохраняется буквально:

1. `burstLeft--`.
2. Если burst ещё положительный, reset/pause RNG не вызывается.
3. При reset:
   - enemy→player: base = `1` для rocket/shotgun/sniper, иначе `2`; extra = `1` для sniper, иначе `2`;
   - прочая цель: sniper base `1`; rifle/plasma `4`; pistol `3`; прочие `1`; extra = sniper `1`, rifle/plasma `5`, прочие `3`;
   - suppressing (не rocket/sniper) добавляет `+2` к base и extra;
   - burst = `base + floor(random * extra)`.
4. `normalPause` всегда потребляет следующий RNG: base `.72` sniper / `.58` rocket / `.34` shotgun / `.16` other, плюс `random * (.18 + (1-aimSkill)*.22)`; suppressing умножает результат на `.48`.
5. Enemy→player после этого потребляет ещё один RNG и заменяет pause на `.24 + random*.22` при suppressing или `.42 + random*.42` иначе. Discarded `normalPause` draw остаётся частью observable legacy ordering.
6. `sT = max(enemy→player ? .095 : .055, weapon.rate * fireRateMul * (.96 + random*.24))`.
7. Только после этих mutations `mag<=0` передаётся в `startBotReload(bot)`.

Не «оптимизировать» discarded `normalPause`, не объединять draws и не переносить constructor RNG.

## RNG consequences safety blocks

Изменение safety веток намеренное и локальное:
- friendly-fire по-прежнему потребляет свой один retry RNG draw; он перемещён в cadence owner, но остаётся сразу после fire-control return;
- generic weapon-cadence/reset draws после friendly-fire теперь **не потребляются**, потому что shot не emitted и burst не продвинут;
- rocket-safety cadence не потребляет RNG и использует fixed `.18`; generic cadence tail также пропускается;
- emitted и occluded paths сохраняют прежнее количество/порядок cadence draws.

Если будущая правка хочет унифицировать occluded с safety retry, это отдельный balance change с pressure/RNG regression, а не refactor.

## Ownership boundaries

- `src/entities/bots.js` — constructor cadence state/RNG, per-frame timer decay, broad fire gate, reaction/player-pressure checks и порядок `bomb → mine → firearm`.
- `src/ai/bot-fire-control.js` — aim/muzzle/reload, safety gates, concrete shot execution, ammo/recoil/noise и closed outcome fact; **не scheduler**.
- `src/weapons/system.js` — weapon rate/classification/data.
- `src/ai/bot-progression-scaling.js` — вычисляет `fireRateMul`.
- `src/ai/tactics.js` / bot FSM — формируют tactical state; cadence только читает нужные факты.

## Dependency / load-order contract

Classic-script segment:

`bot-weapon-policy.js → bot-fire-control.js → bot-fire-cadence.js → bot-deployables.js → tactics.js → frontline.js → bots.js`.

Cadence загружается после fire-control, потому что использует `BOT_SHOT_OUTCOME` и reload handoff, и до `bots.js`, который является consumer-ом.

## Verification oracles

1. `node --test scripts/bot-fire-control-owner.test.mjs` — concrete outcomes, no scheduling leakage, ammo/recoil invariants.
2. `node --test scripts/bot-fire-cadence-owner.test.mjs` — exact controlled RNG, safety retry, burst preservation, fail-fast unknown outcome.
3. `node scripts/validate-structure.mjs` — owner/consumer/order/no-ignored-outcome guards.
4. `node scripts/stamp-web-build.mjs --check`.
5. HTTP Chrome boot + real `file://` menu smoke.
6. Exact GitHub Actions Validate на exact source commit.

Behavior oracle главнее source grep: structural guard защищает ownership, controlled-RNG regression — observable cadence semantics.
