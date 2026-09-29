# Task 019 — Extract bot engage movement policy from Enemy.update()

## WHY

После Task 018 в `src/entities/bots.js` остаётся плотный `case 'engage'`: strafe-switch RNG, role-dependent ranges, opponent-weapon matchup, Frontline objective pull и flank/anchor positional bias смешаны в одном orchestration block.

Fire execution уже принадлежит `bot-fire-control.js`, weapon reselection — `bot-weapon-policy.js`, collision/speed caps — `bot-navigation.js`, cover/peek execution — отдельному owner. Engage movement intent стал следующим узким semantic seam.

## SCOPE

1. Начать с fresh `main`, текущих owner/spec/CI evidence.
2. Вынести smallest owner (candidate `src/ai/bot-engagement-movement.js`) для strafe timer/switch, role ranges, suppress multiplier, opponent-weapon adjustments, objective pull, flank/anchor additive terms и close/far pressure.
3. Сохранить exact RNG count/order и literal thresholds.
4. Оставить broad fire gate, shot execution, weapon selection, cover execution и final navigation/collision вне owner.
5. Добавить deterministic regressions, source/reverse/authority/load-order guards и spec.
6. Обновить routing/changelog, full verification и ротировать task queue.

## NON-GOALS

- Без AI rebalance.
- Без изменения weapon stats/fire-control.
- Без navigation rewrite.
- Без cover/peek, flank-destination или squad-doctrine redesign.
- Не объединять patrol/search/retreat extraction.

## INVARIANTS

- `strafeSwitchT` decrement/flip и `0.55 + random * 0.75` scheduling остаются exact.
- Sniper-matchup сохраняет дополнительный timer clamp и RNG draw в прежней ветке/порядке.
- Role/opponent range multipliers и thresholds не меняются.
- Objective pull и flank/anchor additive terms сохраняют порядок.
- Новый owner возвращает movement intent; navigation остаётся collision/speed-cap owner.
- Duplicate engage implementation в `bots.js` не остаётся.

## FILES TO INSPECT

- `src/entities/bots.js`
- `src/ai/bot-navigation.js`
- `src/ai/bot-weapon-policy.js`
- `src/ai/bot-fire-control.js`
- `src/ai/bot-cover-execution.js`
- `src/ai/tactics.js`
- `src/game/frontline.js`
- `scripts/validate-structure.mjs`
- related specs/tests and `.github/workflows/validate.yml`

## VERIFICATION

1. Node 22 syntax.
2. Controlled-RNG normal-strafe + sniper-extra-draw tests.
3. Boundary tests for close/far and role/opponent adjustments.
4. Structure owner/boundary/load-order validation.
5. Build stamp + HTTP boot + real `file://` smoke.
6. Exact PR-head Validate review before merge.
7. Merged-main evidence if exposed; otherwise `NOT VERIFIED`.

## DONE

- engage movement intent has one owner;
- `Enemy.update()` is smaller without gameplay drift;
- RNG/range/objective behavior is regression-covered;
- docs/guards match reality;
- exact reviewed head is green;
- task removed and exactly one next evidence-based task queued.
