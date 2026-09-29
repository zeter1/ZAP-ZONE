# Bot navigation / locomotion contract

**Canonical owner:** `src/ai/bot-navigation.js`

Читайте этот spec перед изменениями patrol points, collision-aware steering, smoke route cost, speed/acceleration caps или collision substeps. Он намеренно не описывает весь bot AI.

## Owner scope

- `WPTS` — статические patrol/navigation точки.
- `steerBotAroundWalls()` — локальный wall avoidance поверх canonical collision.
- `BOT_MOVE_CFG`, `clampBotVelocity()` — speed/acceleration limits.
- `smokeRoutePenalty()`, `botRoutePenalty()`, `steerBotAroundSmoke()` — стоимость/обход вражеского smoke.
- `moveBotWithSubsteps()` — collision micro-steps и anti-teleport final displacement cap.

`src/entities/bots.js` остаётся consumer-ом: FSM решает **зачем/куда** двигаться, navigation owner ограничивает и физически проводит выбранное движение.

## Границы ownership

- `src/core/engine.js` — единственный source of truth для `collideWalls()`, `wallBetween()`, `wallMeshes`, `BOT_R`; здесь не создаётся вторая physics model.
- `src/ai/bot-perception.js` — individual sensing: mine/grenade/rocket threats, noise/hearing и target acquisition.
- `src/ai/bot-positioning.js` — cover/flank destination filtering/scoring; он потребляет route cost, но не владеет locomotion.
- `src/entities/bots.js` — individual FSM, tactical execution и combat execution.
- `src/ai/tactics.js` — squad/map policy и doctrine.
- `src/game/frontline.js` — objective state/capture.
- `src/entities/bot-presentation.js` — model/hit meshes/arm rig.

## Dependency contract

External dependencies используются invocation-time: engine даёт `collideWalls`, `wallBetween`, `wallMeshes`, `BOT_R`, `THREE.Vector3`; combat даёт `smokeClouds`; bot consumer — `group.position`, `team`, `sideBias`, `strafeDir`.

Canonical classic-script route: `combat.js → ai/bot-perception.js → ai/bot-navigation.js → ai/bot-positioning.js → ai/tactics.js → game/frontline.js → entities/bot-presentation.js → entities/bots.js`. Navigation не зависит от perception/positioning/tactics/frontline/presentation, но должен быть определён до positioning и bot consumer-ов.

## Pure-refactor invariants

Без отдельной behavior-задачи не менять: `normalMaxM=1.18`, `retreatMaxM=1.30`, `mineMaxM=1.38`, `dodgeMaxM=1.48`, `maxAccelM=4.4`, `urgentAccelM=6.2`, `substep=.16`, correction cap `intended*1.35+.035`, final cap `total*1.10+.035`, world clamp `[-93,93]`, smoke route threshold `.16`, smoke steering threshold `.20`, friendly-smoke exclusion, radius/penalty weights и полный порядок `WPTS`.

## Verification oracles

1. `node --test scripts/bot-navigation-owner.test.mjs` — config/patrol, velocity clamp, smoke semantics, exact free substeps, adversarial anti-teleport cap.
2. `node scripts/validate-structure.mjs` — owner/consumer/reverse guards и запрет утечки threat perception.
3. `node scripts/stamp-web-build.mjs --check`.
4. HTTP Chrome boot + реальный `file://` menu smoke.
5. Exact-head GitHub Actions green; старый green SHA после нового write не считается доказательством.

Для pure extraction сначала сохраняйте observable/failure semantics буквально; cleanup/tuning — отдельная задача.
