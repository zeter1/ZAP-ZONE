# Bot deployables contract

## Purpose

`src/ai/bot-deployables.js` — canonical owner individual bot mine/bomb eligibility, probability и deployment side effects. Документ нужен для refactor/debug задач вокруг `tryPlantBotMine()` и `tryPlantBotBomb()`, чтобы не читать весь `Enemy` runtime.

## Ownership

Owner:
- range/visibility/cooldown/limit gates после того, как bot fire/utility gate уже разрешил попытку;
- role + command-doctrine probability;
- mine/bomb placement через canonical constructors/collision/shared collection;
- success cooldown assignment.

Non-owners:
- `src/entities/bots.js`: FSM, fire/utility gate, `bomb → mine → shot` ordering, cooldown initialization/decrement, burst/`sT` cadence;
- `src/ai/tactics.js`: coordinated smoke/frag doctrine;
- `src/combat/combat.js`: shared `mines` state, `mkMine()`/`mkBomb()`, `MAX_MINES`, bomb counters/spacing, collision and player deployables;
- `src/weapons/system.js`: `BOT_MINE_CFG`, `BOT_BOMB_CFG`, team/active limits, fuse/damage data;
- `src/ai/bot-perception.js`: hostile mine/bomb sensing.

## Behavior invariants

Pure refactor must preserve:
- mine range/limit checks and probability base `.42/.30/.18`;
- mine role multipliers engineer ×1.55, anchor ×0.65; hold/retake ×1.22; breach ×0.72;
- bomb range/limit/spacing checks, role base `.19/.12/.075`, level/kills scaling, breach/hold multipliers;
- velocity/arm/fuse/damage/radius fields; bomb placement now uses shared swept footprint to stay on the near side of thin walls (Pack41 user-authorized change);
- successful bomb cooldown exactly180s per bot and player; initial bot delay/decrement remain in bots.js. The old24s jitter is removed by explicit user request;
- RNG consumption and order: mine decision → arm delay → check delay; bomb decision → preserved post-success decoration draw (no longer changes cooldown);
- failed guard paths consume no later decision/spawn randomness;
- owner does not mutate FSM, burst, tactical-mode or fire-gate state.

## Call-order invariant

Inside the existing `bots.js` fire gate: `tryPlantBotBomb(...) → tryPlantBotMine(...) → executeBotShot(...)`.
Changing this order changes gameplay and requires a separate balance/behavior task.

## Verification

1. `node --check src/ai/bot-deployables.js`
2. `node --test scripts/bot-deployables-owner.test.mjs`
3. `node scripts/stamp-web-build.mjs --check`
4. `node scripts/validate-structure.mjs`
5. HTTP browser boot smoke
6. real `file://` menu smoke
7. exact PR-head Validate
8. exact merged-main push Validate
