# Projectile ricochet contract

## Canonical owner
`src/combat/projectile-ricochet.js` владеет вероятностной политикой рикошета, retention-профилем и математикой отражения обычных firearm projectiles игрока и ботов. Читайте этот spec перед изменениями углов/шансов, energy retention, cap или reflection.

## Ownership boundaries
- `src/core/engine.js` — collision geometry, world-space normal, impact material и penetration profile.
- `src/weapons/system.js` — muzzle velocity, gravity, range, damage и weapon penetration data.
- `src/combat/projectile-ricochet.js` — eligibility/probability, max-bounce count, speed/damage retention, offset, reflection helper.
- `src/combat/combat.js` — swept collision, impact ordering, projectile state mutation, FX/audio и terminal destruction.
- `src/ai/bot-fire-control.js` — bot shot до projectile spawn; после spawn bounce принадлежит combat subsystem.

Runtime order: `engine.js → weapons/system.js → player/state.js → settings/settings.js → combat/projectile-ricochet.js → combat/combat.js`.

## Preserved likelihood profiles
Task 020 исправляет semantic parity без скрытого rebalance.

| Owner | Material | incidence limit | chance |
|---|---|---:|---:|
| player | metal | 0.48 | 0.82 |
| player | concrete | 0.30 | 0.42 |
| player | wood | 0.16 | 0.08 |
| enemy | metal | 0.46 | 0.76 |
| enemy | concrete | 0.27 | 0.30 |
| enemy | wood | 0.12 | 0.04 |

Условие строгое: `incidence < limit` и random sample `< chance`.

## Shared bounce execution
- max **1** ricochet;
- metal speed retention **0.66**;
- concrete/wood speed retention **0.54**;
- damage retention **0.56**;
- post-impact offset **0.09**;
- player уменьшает `damageScale`; enemy — `damage` и `playerDamage`.
Retention никогда не повышает speed/damage.

## Impact order
**swept segment → nearer target hit → wall penetration → ricochet → terminal impact**. Penetration всегда раньше ricochet. Plasma не входит в ballistic ricochet path.

## RNG invariant
`rollProjectileRicochet(..., random=Math.random)` вызывает random только после angle/cap eligibility. Steep/capped impact не сдвигает RNG sequence.

## Verification
`node --test scripts/projectile-ricochet.test.mjs` → structure validation → build stamp → HTTP smoke → real `file://` smoke → exact Actions head review.

## Forbidden drift
Не менять damage/spread/recoil, weapon catalog, hitscan SR-9, rocket/grenade physics или penetration resistance в ricochet-only задаче.
