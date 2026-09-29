# Bot cover / peek execution contract

**Canonical owner:** `src/ai/bot-cover-execution.js`.

Этот owner исполняет индивидуальную cover/peek policy после того, как остальные слои уже дали боту target, squad doctrine и tactical cover candidates. Он намеренно не владеет scoring укрытий и не выполняет collision-limited locomotion.

## Ownership boundary

- `src/ai/bot-positioning.js` выбирает tactical cover/flank **destination** через `findBotTacticalCover(...)` / `findBotFlankPoint(...)`.
- `src/ai/bot-cover-execution.js` владеет cover reevaluation, peek-side probing, LOS/smoke acceptance, peek timing/envelope, cover hold/chaining и cover exit.
- `src/ai/bot-navigation.js` владеет wall/smoke steering, speed caps и collision substeps после того, как cover owner вернул movement intent.
- `src/entities/bots.js` остаётся orchestrator-ом timer lifecycle, FSM dispatch, final movement application и presentation smoothing.

## Cover reevaluation invariant

`updateBotCoverSelection(bot,dt,targetPos,dist,hpPct)` сначала уменьшает `coverEvalT`. Scoring вызывается только при `coverEvalT <= 0`, существующем target и `coverCooldownT <= 0`.

Legacy `needCover` остаётся точным OR-контрактом: невидимый target при `dist > 10`; `hpPct < 0.52`; reload; anchor при `dist > 12`; recent damage при `dist > 8`; active suppression.

Если новая точка отличается от текущей более чем на `distanceToSquared > 0.64`, RNG идёт: `coverHoldT = 0.28 + random * 0.42`, затем всегда `coverEvalT = 0.82 + random * 0.48`.

## Peek probing invariant

Peek стартует только при coverPoint, отсутствии active peek, `peekCooldownT <= 0`, наличии target и отсутствии reload.

Probe order строго `[sideBias, -sideBias]`. Каждый кандидат смещён на `1.35`; collision candidate отбрасывается только при correction `> 0.55`; eye Y = `1.38`, target LOS Y += `1.15`; acceptance остаётся short-circuit `!wallBetween(...) && !smokeBlocksSight(...)`.

Первый accepted probe расходует RNG строго: `peekDuration = 0.92 + random * 0.34`, затем `peekCooldownT = 1.25 + random * 0.85`, затем accepted sign становится новым sideBias. Rejected probes peek RNG не расходуют.

## Canonical peek envelope

`botCoverPeekEnvelope(peekT,peekDuration)` — единственный owner: `p = clamp(1 - peekT / peekDuration, 0, 1)`; `p < 0.24 → p / 0.24`; `p > 0.72 → (1 - p) / 0.28`; иначе `1`.

Movement и presentation lean используют один helper. Active peek movement multiplier остаётся `0.68` вместо обычного `0.98`; arrival radius — `0.42` для peek и `1.4` для cover.

## Chain / exit invariant

После достижения cover уменьшается `coverHoldT`; transition разрешён только при `reloadT <= 0` и `coverHoldT <= 0`.

Chain разрешён только doctrine `breach`/`retake`, active assault wave, target+objective и `coverChainT <= 0`. Advancement требует `distanceToSquared(currentPosition) > 6.25` и `nextCover.distanceTo(mapObjective) + 1.2 < currentPosition.distanceTo(mapObjective)`.

Advancement RNG: `coverHoldT = 0.16 + random * 0.22`, затем `coverChainT = 0.72 + random * 0.35`. Иначе exit: `coverCooldownT = 0.95 + random * 0.70`, state = visible target ? `engage` : `hunt`, `stateCD = 0.32`.

## Lifecycle left in bots.js

Constructor RNG, decrement/expiry `coverChainT`, `peekT`, `peekCooldownT`, очистка `peekPoint`, FSM dispatch, final velocity/collision application и visual lean smoothing остаются в `src/entities/bots.js`.

## Verification route

1. `scripts/bot-cover-execution-owner.test.mjs` — deterministic envelope, reevaluation, side-order, LOS/smoke short-circuit, RNG, chain and exit regressions.
2. `scripts/validate-structure.mjs` — canonical owner, reverse leakage, authority boundary and classic-script load order.
3. `scripts/stamp-web-build.mjs --check`.
4. HTTP Chrome boot + real `file://` smoke.
5. Exact GitHub Actions Validate run on the reviewed PR head.
