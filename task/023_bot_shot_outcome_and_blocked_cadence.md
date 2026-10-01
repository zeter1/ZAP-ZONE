# Task 023 — Bot shot outcome contract and blocked-attempt cadence review

## WHY

Task 022 deliberately keeps the legacy cadence/RNG contract unchanged while exposing a structural ambiguity: `executeBotShot(...)` has several early exits where no firearm shot is emitted (LOS/smoke fail-close, friendly-fire block, unsafe rocket), but it currently returns no outcome and `src/entities/bots.js` unconditionally calls `applyBotPostShotCadence(...)` after the attempt.

That means future AI work cannot tell from the public seam whether burst/cadence consumed a real shot or only a blocked attempt. Changing this casually could alter pressure, burst length and RNG ordering, so the next pass should make the outcome explicit before deciding any gameplay adjustment.

## SCOPE

1. Start from fresh `main`; read `BOT_FIRE_CONTROL`, `BOT_FIRE_CADENCE`, owner tests and the exact fire branch in `src/entities/bots.js`.
2. Give `executeBotShot(...)` a small explicit outcome contract that distinguishes at least emitted shot vs LOS/smoke block vs friendly-fire block vs rocket-safety block.
3. Preserve current damage/ammo/recoil/near-miss behavior while introducing the outcome seam; do not add hidden RNG.
4. Add deterministic direct tests for every outcome and structural guards that prevent callers from ignoring the result once cadence behavior is intentionally split.
5. Review whether blocked attempts should:
   - keep consuming full cadence exactly as today, or
   - use a dedicated bounded retry path without decrementing a real burst.
   Make that gameplay decision only from controlled tests/reasoning; document the chosen semantics and exact RNG consequences.
6. If cadence semantics change, preserve safety against rapid retry loops, wall spam and friendly-fire deadlock; verify bot pressure does not become accidentally stronger.
7. Update specs/patterns/README/CHANGELOG only where the final contract actually changes.

## NON-GOALS

- No global weapon damage/fire-rate/burst-size rebalance.
- No navigation, perception or squad-doctrine rewrite.
- No player weapon handling changes in the same task.
- No new randomness merely to hide deterministic blocked-attempt behavior.

## INVARIANTS

- An emitted-shot outcome means ammo/projectile/hitscan execution really occurred.
- A blocked outcome cannot consume ammo or add `fireBurstRecoil`.
- Fire-control owns shot outcome; cadence owns post-attempt/post-shot scheduling policy.
- RNG count/order per documented branch is explicit and regression-tested.
- No blocked branch may create a zero-delay retry loop.

## FILES TO INSPECT

- `src/ai/bot-fire-control.js`
- `src/ai/bot-fire-cadence.js`
- `src/entities/bots.js`
- `scripts/bot-fire-control-owner.test.mjs`
- `scripts/bot-fire-cadence-owner.test.mjs`
- `scripts/validate-structure.mjs`
- `docs/specs/BOT_FIRE_CONTROL.md`
- `docs/specs/BOT_FIRE_CADENCE.md`
- `docs/patterns/COMPOSED_FIRE_STABILITY.md`

## VERIFICATION

Node 22 syntax → fire-control outcome regressions → cadence controlled-RNG regressions → structure/build stamp → HTTP boot smoke → real `file://` smoke → exact PR/main Actions evidence.

## DONE

The bot fire seam explicitly communicates whether a shot was emitted or blocked, cadence behavior for each outcome is intentional/tested rather than implicit, and no new retry loop, ammo/recoil bug or RNG drift is introduced. Exactly one evidence-based next task remains.
