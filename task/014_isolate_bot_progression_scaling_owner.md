# Task 014 — Isolate bot progression-scaling policy owner

## WHY

Fresh `main` after the dodge-response extraction still keeps a compact but balance-critical seam inside `Enemy.syncScale(force=false)`: level/kills/role scaling computes max HP, HP preservation, movement speed, damage multiplier, accuracy, fire-rate multiplier and `levelSync`.

This policy is deterministic and has two stable consumers — constructor initialization through `syncScale(true)` and per-update synchronization through `syncScale()`. Keeping the formulas buried in the large bot orchestrator raises context cost and makes accidental balance drift hard to review.

## SCOPE

1. Start from fresh `main`, this task, `AGENTS.md`, `docs/AI_WORKFLOW.md` and the exact latest Validate run.
2. Read `Enemy.syncScale()`, constructor base stats/role initialization, update call, all consumers of `maxHp/hp/speed/baseDmgMul/curAcc/fireRateMul/levelSync`, and relevant weapon/combat scaling boundaries.
3. Prove the semantic boundary before moving code; prefer `src/ai/bot-progression-scaling.js` only if fresh evidence still supports it.
4. Preserve constructor/per-update compatibility seams and exact formulas, caps/floors, role multipliers, `force` behavior and HP-ratio preservation.
5. Add deterministic `node:test` regressions for force initialization, unchanged-level early return, level/kills growth, role modifiers, accuracy/fire-rate floors and HP preservation.
6. Add owner/consumer/reverse/load-order guards, a narrow spec and AI routing.
7. Update `CHANGELOG.md`; after verified main CI remove this task and create exactly one next evidence-based task.

## NON-GOALS

- Do not rebalance bot HP, speed, accuracy, damage or fire rate.
- Do not change level/kills progression rules.
- Do not move weapon selection, damage reaction, dodge response, perception or locomotion into the scaling owner.
- Do not introduce a generic bot-stats framework without evidence.

## INVARIANTS

- Scaling formulas and exact caps/floors remain semantically identical.
- `force=true` still initializes HP to the new max.
- Non-force scaling preserves the current HP ratio/floor behavior exactly.
- Same-level calls keep the existing early-return behavior.
- No new RNG is introduced.

## FILES TO INSPECT

- `src/entities/bots.js`
- `src/player/state.js`
- `src/weapons/system.js`
- `src/combat/combat.js`
- `scripts/validate-structure.mjs`
- `index.html`
- `docs/AI_WORKFLOW.md`
- `docs/ARCHITECTURE.md`
- relevant `docs/specs/*`

## VERIFICATION

Syntax/compile → focused deterministic scaling regressions → owner/consumer/reverse/load-order guards → `stamp-web-build --check` → structure validation → HTTP browser boot smoke → `file://` menu smoke → exact GitHub Actions run on exact main head.

## DONE

- scaling policy has one canonical owner and no duplicate implementation;
- constructor/update consumers and exact balance semantics are preserved;
- focused regression proves boundary behavior and formulas;
- docs/spec/AI routing match current source;
- exact main head and Validate result are verified.
