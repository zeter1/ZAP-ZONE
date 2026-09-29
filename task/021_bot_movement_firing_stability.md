# Task 021 — Bot movement-aware firing stability and recovery

## WHY

Review `src/ai/bot-fire-control.js` после Task 020 показал конкретную асимметрию: projectile spread/hitscan hit chance учитывают suppression и скорость **цели**, но не фактическую скорость самого стрелка (`bot.velX/velZ`). Поэтому активно strafe/reposition бот может сохранять ту же baseline firing stability, что стоящий бот. У игрока movement/air spread уже входит в handling model.

Task 020 намеренно не смешивает ricochet physics и AI accuracy balance.

## SCOPE

1. Fresh `main`, этот task, `BOT_FIRE_CONTROL` spec, movement owners, current Validate.
2. Использовать canonical motion signal из существующих `velX/velZ`, без второго source of truth.
3. Ввести bounded stability policy: settled < moving < hard strafe penalty.
4. Recovery после остановки — только с явным owner и frame-rate-independent timer.
5. Сохранить suppression, target-motion penalty, weapon spread, role/difficulty scaling, friendly-fire и rocket-safety semantics.
6. Deterministic tests: standing/moving/fast-moving, suppression composition, weapon classes, recovery boundaries.
7. Docs/changelog/oracles + full Validate + HTTP/`file://` smoke + queue rotation.

## NON-GOALS

- Не менять player recoil/spread.
- Не делать общий rebalance damage/fire rate/reload/HP.
- Не переписывать perception, doctrine или navigation.
- Не добавлять hidden aim assist/debuff.

## INVARIANTS

- Shooter movement не может улучшать baseline stability.
- Standing bot не получает movement penalty.
- Policy зависит от фактического motion, а не AI-state label.
- RNG count/order не менять без regression.
- Friendly-fire/rocket-safety gates остаются до damage application.

## FILES TO INSPECT

- `src/ai/bot-fire-control.js`
- `src/entities/bots.js`
- `src/ai/bot-navigation.js`
- `src/ai/bot-engagement-movement.js`
- `src/weapons/system.js`
- `docs/specs/BOT_FIRE_CONTROL.md`
- related tests / `scripts/validate-structure.mjs`
- `.github/workflows/validate.yml`

## VERIFICATION

Node 22 syntax → focused controlled-RNG tests → existing fire-control/cadence/navigation regressions → structure → build stamp → HTTP smoke → real `file://` smoke → exact Actions head.

## DONE

Movement affects bot firing predictably; standing/suppression/target-motion contracts remain covered; no unrelated rebalance; exactly one evidence-based next task remains.
