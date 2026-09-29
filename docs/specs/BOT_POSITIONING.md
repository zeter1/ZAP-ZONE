# Bot tactical positioning contract

**Canonical owner:** `src/ai/bot-positioning.js`

Читайте этот spec перед изменениями выбора укрытий, фланговых точек или scoring tactical destinations. Owner отвечает только на вопрос **«какая точка предпочтительнее?»** и не получает власть над FSM или физикой движения.

## Owner scope

- `findBotTacticalCover(bot,target)` фильтрует и ранжирует `COVER_POINTS` по расстоянию, реальному cover LOS, route cost, crowding, Frontline bias, doctrine и `sideBias`.
- `findBotFlankPoint(bot,target,sideSign)` выбирает flank candidate по стороне обхода, firing lane, smoke, route cost, crowding и objective distance.
- Если подходящей flank cover-точки нет, owner строит прежний procedural fallback и принимает его только после canonical collision correction.

Функции возвращают destination или `null`. Они не меняют `aiState`, commit timers, `coverPoint`, `flankPoint` или движение бота.

## Ownership boundaries

- `src/ai/tactics.js` — squad/map policy: doctrine, focus, suppressor, assault wave и coordinated utility.
- `src/entities/bots.js` — individual FSM, условия reevaluation, cover/flank commit timers, peek/hold/execution и combat decisions.
- `src/ai/bot-navigation.js` — **how to move**: route penalty, wall/smoke steering, speed caps и collision substeps.
- `src/ai/bot-perception.js` — sensed threats/targets; positioning не выбирает цель.
- `src/game/frontline.js` — objective state и canonical `frontlineZone()`.
- `src/core/engine.js` — `COVER_POINTS`, LOS/collision primitives и `BOT_R`.

Так сохраняется граница **sense → decide policy/state → choose destination → move** без второго source of truth.

## Dependency / load-order contract

`combat.js → bot-perception.js → bot-navigation.js → bot-positioning.js → tactics.js → frontline.js → bot-presentation.js → bots.js`.

`botRoutePenalty()` должен быть определён до positioning owner. `frontlineZone()`, `enemies`, smoke/LOS/collision globals являются invocation-time dependencies: positioning functions вызываются только после завершения последовательного bootstrap.

## Pure-refactor invariants

Без отдельной gameplay-задачи не менять:
- cover: `dFrom 4..32`, `targetDist >= 7`, candidate обязан быть закрыт от target через `wallBetween`;
- crowding: radius `4.5` / weight `1.6`; preferred target distance `15` / weight `.17`;
- hold/retake objective `.78r / .42`, other doctrine `1.10r / .12`; advance clamp `[-3,10]` / `.46`; objective bonus `-3.4`; side-bias `-2.4`;
- flank: `dFrom 6..44`, `dTarget 10..29`, side `>=4.5`; firing lane requires no wall and no smoke, score `-5.0`, blocked `+3.8`;
- flank score weights `.46/.70/-.20`, crowd radius `5` / weight `1.5`, objective excess over `1.25r` / `.10`;
- fallback radius `clamp(dist*.48,12,22)`, rear offset `3.5`, world clamp `[-90,90]`, collision correction `<2.6`.

Не смешивайте extraction с tuning этих чисел.

## Verification oracles

1. `node --test scripts/bot-positioning-owner.test.mjs`.
2. `node scripts/validate-structure.mjs`.
3. `node scripts/stamp-web-build.mjs --check`.
4. HTTP Chrome boot + реальный `file://` menu smoke.
5. Exact PR head и exact merged `main` Validate run green.

При изменении scoring обновляйте behavior test и spec как единый контракт; source-presence grep не заменяет regression test.
