# Task 015 — Isolate bot post-shot burst/cadence policy owner

## WHY

Fresh `main` after progression-scaling extraction still keeps a compact, balance-critical post-shot policy inside `Enemy.update()`: after a firearm shot it decrements `burstLeft`, chooses the next burst length, computes suppressing/player-target pause timing, schedules the next `sT`, and may hand off to reload.

This seam is narrower than the full fire gate and has an observable RNG order. Keeping it embedded in the large bot orchestrator raises review/context cost and makes accidental cadence/balance drift hard to detect. `src/ai/bot-fire-control.js` intentionally owns concrete shot execution, not burst/fire-gate policy, so a separate cadence owner is the current evidence-based boundary.

## SCOPE

1. Start from fresh `main`, this task, `AGENTS.md`, `docs/AI_WORKFLOW.md`, `docs/specs/BOT_FIRE_CONTROL.md` and the exact latest Validate evidence.
2. Read the constructor initialization of `burstLeft`, `burstPauseT`, `sT`, the per-update timer decay, the complete fire gate, `executeBotShot(...)`, reload handoff and all consumers of cadence state.
3. Prove the semantic boundary before moving code; prefer a narrow `src/ai/bot-fire-cadence.js` only if fresh evidence still supports one canonical post-shot owner.
4. Preserve the public/orchestration flow and exact post-shot behavior: burst decrement, weapon/player/suppressing branches, base/extra burst formulas, pauses, minimum shot interval, `fireRateMul`, reload handoff and exact `Math.random()` short-circuit/order.
5. Add controlled-RNG `node:test` regressions for continuing bursts, burst reset by weapon class, enemy-vs-player pauses, suppression modifiers, sniper/rocket/shotgun special cases, cadence floor and empty-mag reload handoff.
6. Add owner/consumer/reverse/load-order guards, a narrow spec and AI routing; migrate any source-location oracle to the new owner instead of restoring duplicate code.
7. Update `CHANGELOG.md`; after verified main CI remove this task and create exactly one next evidence-based task.

## NON-GOALS

- Do not rebalance burst length, pause timing, fire rate, pressure limits, weapon stats or accuracy.
- Do not move LOS/smoke/friendly-fire/rocket safety, muzzle/aim, projectile/hit execution or ammo mutation out of `src/ai/bot-fire-control.js`.
- Do not move the broad `Enemy.update()` fire gate, target acquisition, player-pressure eligibility, mine/bomb ordering, reload implementation or weapon selection without fresh evidence.
- Do not reorder constructor RNG merely to centralize cadence-state initialization.
- Do not introduce a generic AI state-machine framework.

## INVARIANTS

- Accepted firearm shots consume cadence RNG in the same order and only in the same branches as current `main`.
- `burstLeft > 0` does not consume burst-reset/pause RNG.
- Suppressing and enemy-target-player branches preserve exact burst/pause formulas.
- `sT` keeps its current minimum clamp and `weapon.rate * fireRateMul * (.96 + random*.24)` semantics.
- Empty-mag reload handoff occurs in the same order relative to cadence mutation.
- Utility deployment order `bomb → mine → firearm` is unchanged.

## FILES TO INSPECT

- `src/entities/bots.js`
- `src/ai/bot-fire-control.js`
- `src/ai/bot-deployables.js`
- `src/ai/bot-progression-scaling.js`
- `src/weapons/system.js`
- `src/combat/combat.js`
- `scripts/bot-fire-control-owner.test.mjs`
- `scripts/validate-structure.mjs`
- `index.html`
- `docs/specs/BOT_FIRE_CONTROL.md`
- `docs/AI_WORKFLOW.md`
- `docs/ARCHITECTURE.md`

## VERIFICATION

Syntax/compile → controlled-RNG cadence regressions → existing fire-control/deployables regressions → owner/consumer/reverse/load-order guards → `stamp-web-build --check` → structure validation → HTTP browser boot smoke → `file://` menu smoke → exact GitHub Actions run on exact main head.

## DONE

- post-shot burst/cadence policy has one canonical owner and no duplicate implementation;
- concrete shot execution, utility ordering and broad fire gate remain at their existing boundaries;
- exact branch formulas and RNG order are regression-protected;
- docs/spec/AI routing match current source;
- exact main head and Validate result are verified.
