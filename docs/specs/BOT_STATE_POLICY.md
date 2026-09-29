# Bot state-selection policy — owner contract

## Purpose

`src/ai/bot-state-policy.js` is the canonical owner of the periodic **high-level AI state selection ladder**. It receives facts that `src/entities/bots.js` has already derived and chooses one `Enemy.aiState`.

This owner exists to keep transition priority, strict threshold semantics and observable RNG behavior reviewable without forcing an AI/Codex session to read the full bot runtime.

## Boundary

The call chain is:

`bots.js fact production + stateCD lifecycle → applyBotStateSelectionPolicy(...) → bots.js state execution`

The owner **does own**:

- ordered state choice;
- ally/enemy engage-range multiplier at the transition boundary;
- final objective/patrol fallback;
- post-selection `stateCD=.22+Math.random()*.30` scheduling.

The owner **does not own**:

- `stateCD` decrement or the `stateCD<=0` gate;
- perception, target acquisition, tactical-plan derivation or health-pickup search;
- cover/flank point scoring;
- movement, cover/peek/flank execution or navigation;
- reloads, deployables, broad fire gate, shot execution or post-shot cadence;
- constructor RNG/state initialization.

Those responsibilities remain with their existing owners.

## Inputs are already-derived facts

The caller passes:

- `targetPos`
- `hpPct`
- `strategicRetreat`
- `localThreats`
- `supportReady`
- `mapOrderWanted`
- `mapObjective`
- `dist`

The policy also reads bot-owned state already present on `Enemy`: pickup visibility, tactical mode, cover/flank commitment, LOS, role, reload/suppression state, weapon range, team and `lastSeenT`.

Do not move those producers into this file merely to make the function “self-contained”. Doing so would create duplicate authority.

## Exact priority contract

The first matching row wins:

| Priority | State | Predicate |
|---:|---|---|
| 1 | `resupply` | visible `pickupTarget` and `hpPct < .48` |
| 2 | `retreat` | target + `strategicRetreat` + either `hpPct < .25 && dist < 20` or `localThreats >= 3 && hpPct < .58` |
| 3 | `support` | target + `supportReady` + `tacticalMode === 'support'` |
| 4 | `cover` | target + cover point + existing LOS/anchor/reload/threat-low-HP/suppression predicate |
| 5 | `flank` | target + committed flank point + `tacticalMode === 'flank'` |
| 6 | `objective` | `mapOrderWanted` |
| 7 | `engage` | target visible and distance `<= weapon.range * 1.14` for ally, `* 1.08` otherwise |
| 8 | `hunt` | target and `lastSeenT < 8.5` |
| 9 | `search` | target and `lastSeenT < 14.5` |
| 10 | fallback | `mapObjective ? 'objective' : 'patrol'` |

Priority is gameplay behavior. Reordering rows is a balance/AI behavior change, not a cleanup.

## Boundary semantics that must stay exact

- Resupply uses strict `hpPct < .48`; `.48` itself does not qualify.
- The low-HP retreat path uses strict `hpPct < .25`.
- The local-threat retreat path uses `localThreats >= 3` and strict `hpPct < .58`.
- Cover's local-threat low-HP branch remains strict `hpPct < .72`.
- Engage distance is inclusive `<=`.
- Hunt/search are strict `< 8.5` / `< 14.5`; exact boundary values fall through.
- `mapOrderWanted` beats engage/hunt/search.
- Every actual policy invocation consumes **exactly one** RNG draw, after state choice, for `stateCD`.
- When `stateCD > 0`, `bots.js` must not call this owner and therefore consumes zero state-selection RNG.

## Change discipline

For a pure refactor:

1. Read this spec.
2. Read `src/ai/bot-state-policy.js`.
3. Read only the caller seam around `stateCD` in `src/entities/bots.js`.
4. Read `scripts/bot-state-policy-owner.test.mjs` and relevant structural guards.
5. Preserve priority, threshold strictness, side-effect order and RNG count literally.

If a future task intentionally changes state priorities or thresholds, treat it as a gameplay change: document the design reason, update deterministic regressions and evaluate browser/runtime behavior separately.

## Verification

After a source change:

```bash
node --check src/ai/bot-state-policy.js
node --check scripts/bot-state-policy-owner.test.mjs
node --test scripts/bot-state-policy-owner.test.mjs
node scripts/stamp-web-build.mjs --check
node scripts/validate-structure.mjs
```

Then run the repository HTTP browser boot smoke and real `file://` menu smoke through Validate. The classic-script graph must load `bot-state-policy.js` before `tactics.js` and before `entities/bots.js`.
