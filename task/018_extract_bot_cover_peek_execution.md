# Task 018 — Extract bot cover / peek execution policy from Enemy.update()

## WHY

Fresh review after Task 017 shows that `src/entities/bots.js` still owns a dense cover/peek execution block inside `Enemy.update()`: cover reevaluation, peek-side probing, LOS/smoke validation, peek timing/envelope, cover-chain decisions and exit cooldowns are interleaved with movement/state execution.

Current evidence on `main`:
- `src/ai/bot-positioning.js` already owns tactical cover/flank **destination scoring**;
- `src/ai/bot-navigation.js` already owns locomotion/collision mechanics;
- `src/entities/bots.js` still contains cover/peek execution state and timers, including duplicate peek-envelope math used by movement and presentation;
- the project owner rule is one semantic owner per behavior, with exact RNG order and threshold semantics preserved during extraction.

This is a bounded refactor opportunity that can reduce `Enemy.update()` complexity without changing gameplay balance.

## SCOPE

1. Start from fresh `main`; read `AGENTS.md`, `docs/AI_WORKFLOW.md`, `docs/specs/BOT_POSITIONING.md`, `src/ai/bot-positioning.js`, `src/ai/bot-navigation.js`, the relevant `Enemy.update()` cover/peek block, current structure validator and newest Validate log.
2. Define the smallest semantic owner for **cover/peek execution policy** (candidate: `src/ai/bot-cover-execution.js`). Do not move cover destination scoring or low-level collision locomotion into it.
3. Extract pure/testable policy for:
   - whether/when cover is reevaluated;
   - peek candidate side order and eligibility;
   - LOS + smoke acceptance contract;
   - peek duration/cooldown scheduling and exact RNG consumption order;
   - canonical peek-envelope calculation;
   - cover hold / chain-cover transition / exit cooldown decisions.
4. Keep `Enemy.update()` as orchestration consumer: timer lifecycle, state dispatch and final movement application may stay there when they are not part of the extracted policy.
5. Preserve `findBotTacticalCover(...)` as the existing positioning owner. Avoid duplicate cover scoring.
6. Add a focused spec `docs/specs/BOT_COVER_EXECUTION.md`, update `AGENTS.md` and `docs/AI_WORKFLOW.md` routing only after the owner exists.
7. Add deterministic `node:test` regressions with controlled RNG and source/structure guards. Include classic-script load order if the new file is a global script.
8. Update `CHANGELOG.md` with the factual extraction and verification evidence.
9. Run the full repository verification path and inspect exact GitHub Actions evidence before merging.

## NON-GOALS

- No gameplay rebalance of cover distances, timers, peek widths, LOS/smoke behavior or doctrine probabilities.
- Do not rewrite `bot-positioning.js` scoring.
- Do not move general movement/collision mechanics out of `bot-navigation.js`.
- Do not redesign presentation/animation; only share a canonical peek-envelope helper if needed to remove duplicated behavior math.
- Do not combine flank execution, fire control, weapon selection or state-selection refactors into this pass.

## INVARIANTS

- Exact side probe order stays `[sideBias, -sideBias]`.
- Peek point collision rejection threshold remains unchanged.
- LOS and smoke checks preserve current short-circuit/acceptance behavior.
- Successful peek scheduling preserves exact `Math.random()` count and order for duration and cooldown.
- Peek envelope keeps the same piecewise timing edges and movement multiplier.
- Cover chaining preserves doctrine/assault-wave/objective gates, advancement threshold and exact RNG order.
- Cover exit preserves current cooldown, next-state choice and `stateCD`.
- No duplicate semantic owner remains after extraction.
- All existing regression/browser gates remain enabled.

## FILES TO INSPECT

- `src/entities/bots.js`
- `src/ai/bot-positioning.js`
- `src/ai/bot-navigation.js`
- `docs/specs/BOT_POSITIONING.md`
- `AGENTS.md`
- `docs/AI_WORKFLOW.md`
- `scripts/validate-structure.mjs`
- related bot owner tests and `.github/workflows/validate.yml`

## VERIFICATION

1. Syntax-check every changed/new JS file with the repository's current Node 22 path.
2. Run focused cover/peek regressions with controlled RNG and exact boundary/oracle assertions.
3. Run structure validation and prove:
   - one canonical cover/peek execution owner;
   - `bots.js` is a consumer, not duplicate implementation;
   - positioning and navigation ownership boundaries remain intact;
   - new classic-script load order is valid if applicable.
4. Run `stamp-web-build --check` and update the stamp only when required by the repository contract.
5. Run HTTP browser boot smoke and real `file://` smoke.
6. Open one bounded PR, inspect the exact Validate run/jobs/logs on the exact head, and fix root cause for any failure rather than weakening gates.
7. Merge with expected-head protection; verify merged-main Actions when tooling exposes the push run.

## DONE

- cover/peek execution policy has one clear semantic owner;
- `Enemy.update()` is smaller without gameplay/balance drift;
- exact RNG/threshold/side-order/LOS-smoke behavior is regression-covered;
- specs/routing/structure guards reflect the new owner;
- full Validate is green on the exact reviewed head;
- this task is removed and exactly one next bounded evidence-based task is queued.
