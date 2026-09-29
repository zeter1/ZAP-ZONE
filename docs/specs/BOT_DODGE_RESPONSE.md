# BOT_DODGE_RESPONSE — contract

## Canonical owner

`src/ai/bot-dodge-response.js` owns the **execution policy for an already-requested individual bot dodge**.

Stable public seam: `Enemy.triggerDodge(preferredDir=0, urgency=1)` in `src/entities/bots.js`.

## Producer / owner / consumer boundary

Producers decide **when and why** to request a dodge:

- survived-damage branch in `Enemy.hurt()` decides whether a hit requests a dodge;
- rocket-threat branch in `Enemy.update()` resolves threat side and urgency.

The owner decides only **how the accepted request mutates dodge state**: active/cooldown rejection, fallback direction, duration, speed, cooldown, and optional jump.

`src/entities/bots.js` still owns dodge timer decay and movement consumption. `src/ai/bot-navigation.js` still owns collision-limited locomotion helpers and speed caps. Rocket sensing remains in `src/ai/bot-perception.js`.

## Exact behavior contract

```text
reject when dodgeCD > 0 OR dodgeT > 0

dodgeDir = preferredDir || randomSign
dodgeT   = (0.34 + random * 0.24) * clamp(urgency, 0.86, 1.14)
dodgeSpd = speed * (1.30 + aimSkill * 0.16) * clamp(urgency, 0.96, 1.08)
dodgeCD  = 0.88 + random * 0.62

if random < 0.16 * urgency AND jV === 0:
    jV = 4.6 + random * 1.6
```

The jump probability intentionally uses **raw urgency**, not either duration/speed clamp.

## RNG order is observable

For an accepted dodge, RNG consumption is part of the gameplay contract:

1. direction draw only when `preferredDir` is falsy;
2. duration draw;
3. cooldown draw;
4. jump-predicate draw;
5. jump-impulse draw only when the predicate passes and `jV === 0`.

The jump-predicate random draw happens **before** the `jV === 0` check, so a bot already moving vertically still consumes that predicate draw. A non-zero `preferredDir` skips the direction draw because of JavaScript `||` short-circuiting. Rejected requests consume zero RNG.

## Non-goals

This owner must not absorb survived-damage dodge chance, rocket sensing/urgency thresholds, timer decay, movement/collision, HP/death, damage reaction, cover/FSM policy, or gameplay balance tuning.

## Verification

```bash
node --test scripts/bot-dodge-response-owner.test.mjs
```

The regression suite uses a controlled RNG queue and proves zero-draw rejection, preferred-direction short-circuiting, exact draw order, urgency clamps, and jump semantics.

Structural validation additionally requires the canonical owner, stable public seam, both producers, no duplicate implementation in `bots.js`, and classic-script order with the owner loaded before `bots.js`.

After any source change, also run the canonical build-stamp/structure/runtime gates documented in `docs/AI_WORKFLOW.md`.
