# BOT_PROGRESSION_SCALING — contract

## Canonical owner

`src/ai/bot-progression-scaling.js` owns deterministic per-bot stat scaling from the current global player progression (`level`, `kills`) plus immutable bot base stats and role.

Stable consumer seam: `Enemy.syncScale(force=false)` in `src/entities/bots.js`.

## Boundary

The owner mutates only progression-derived bot fields:

- `aimSkill`;
- `maxHp` and rescaled `hp`;
- `speed`;
- `baseDmgMul`;
- `curAcc`;
- `fireRateMul`;
- `levelSync`.

`src/entities/bots.js` still owns constructor/update lifecycle, HP damage/death, movement/FSM/fire gate and presentation. Weapon definitions remain in `src/weapons/system.js`; concrete bot shot damage/accuracy consumption remains in `src/ai/bot-fire-control.js`; locomotion consumes `speed` but does not own progression formulas.

## Exact compatibility contract

For a call accepted by the level-sync guard:

```text
oldMax = maxHp || 1
oldHp  = hp || oldMax
hpRatio = force ? 1 : clamp(oldHp / oldMax, 0.24, 1)

roleHp:
  anchor=1.18, assault=1.02, engineer=1.10, other=1.05
roleSpd:
  flankL/flankR=1.12, anchor=0.96, other=1.03
roleDmg:
  anchor=1.10, engineer=1.02, other=1.06

lvl = max(1, level)
dominance    = min(0.55, kills * 0.009)
combatGrowth = min(0.28, kills * 0.0045)

aimSkill   = min(0.97, 0.58 + skillSeed + lvl*0.013 + min(0.13, kills*0.0018))
maxHp      = baseHp * (1.08 + lvl*0.082 + dominance) * roleHp
hp(force)  = maxHp
hp(normal) = min(maxHp, maxHp*hpRatio + max(10, maxHp*0.05))
speed      = baseSpeed * (1.02 + min(0.28,lvl*0.012) + min(0.12,kills*0.0020)) * roleSpd
baseDmgMul = (0.86 + type*0.06) * (1 + lvl*0.038 + combatGrowth) * roleDmg
curAcc     = max(0.0075, baseAcc * (1.03 - min(lvl*0.019,0.58) - min(0.18,kills*0.0022)) * (anchor?0.82:1))
fireRateMul= max(0.62, 1.08 - lvl*0.013 - min(0.20,kills*0.0025)) * (assault?0.92:1)
levelSync  = level
```

Two subtle compatibility points are intentional:

1. `force=true` bypasses the same-level guard and fills HP to the newly computed max.
2. The fire-rate floor is applied **before** the assault multiplier, so an assault bot can end at `0.62 * 0.92`; moving the clamp after the role multiplier would be a balance change.
3. Non-force scaling is not pure percentage preservation: the prior HP ratio is clamped to at least 24%, then the legacy growth-heal term `max(10, maxHp*0.05)` is added before the final max-HP cap.

## Determinism

This policy consumes no RNG. Adding `Math.random()` here changes combat sequencing indirectly and is prohibited unless handled as an explicit gameplay/balance change.

## Verification

```bash
node --test scripts/bot-progression-scaling-owner.test.mjs
```

The focused suite covers force initialization, same-level early return, level/kills caps, role asymmetry, clamp ordering, HP rescale semantics and no-RNG ownership. Structural validation additionally enforces one owner, the stable `Enemy.syncScale()` seam, reverse-owner guards and classic-script load order.
