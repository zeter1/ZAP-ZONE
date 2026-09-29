# Bot engagement movement — semantic owner contract

## Canonical owner

`src/ai/bot-engagement-movement.js` owns movement intent for the `engage` state only.

It owns:
- engage-facing yaw;
- `strafeSwitchT` decrement, direction flip and reschedule;
- role/tactical-mode optimal-range adjustments;
- opponent-weapon matchup adjustments;
- base strafe intent;
- Frontline objective pull while engaging;
- flank-role lateral bias;
- close/far range correction;
- anchor cover tether.

`src/entities/bots.js` remains the state orchestrator and passes already-derived tactical facts into this owner. `src/ai/bot-navigation.js` still owns wall/smoke steering, velocity caps, collision substeps and final locomotion.

## Non-ownership boundaries

This module must not own:
- state selection or `stateCD`;
- cover/peek selection or execution;
- weapon selection/reselection;
- broad fire gating, aim, projectiles, reload or shot execution;
- squad-plan refresh, doctrine selection or Frontline state production;
- separation, wall/smoke steering, collision or movement caps.

## Exact behavior invariants

### Strafe timer and RNG

The order is contractual:
1. `strafeSwitchT -= dt`;
2. only when `strafeSwitchT <= 0`, flip `strafeDir`;
3. then consume exactly one RNG draw for `.55 + random * .75`;
4. if the opponent is a sniper, consume the sniper timer RNG draw later in that branch and clamp with `Math.min(current, .48 + random * .22)`.

A sniper matchup therefore consumes its branch RNG draw even when the existing timer remains smaller.

### Range policy

Base optimal range is:
- anchor: `weapon.opt * 1.24`;
- assault: `weapon.opt * 0.78`;
- other roles: `weapon.opt`.

Then:
- engineer multiplies by `0.92`;
- suppress mode multiplies optimal range by `1.08` and uses strafe multiplier `0.48`;
- normal strafe multiplier is `0.82`;
- opponent shotgun floors optimal range at `18`;
- opponent rocket floors optimal range at `17` and sets strafe multiplier to `1.02`;
- opponent sniper sets strafe multiplier to `1.08`; assault/shotgun users cap optimal range at `21`, otherwise it is floored at `30`.

Opponent checks remain the same mutually exclusive `if / else if / else if` chain.

### Movement-addition order

Floating-point addition order is part of the refactor contract:

`base strafe → objective pull → flank bias → close/far correction → anchor cover tether`.

Do not reorder these terms in a pure refactor.

Frontline pull keeps priority:
- contested: `0.40`;
- else behind: `0.31`;
- else hold doctrine: `0.46`;
- otherwise `0`.

Pull applies only when `objectivePull > 0`, an objective exists and `objectiveDist > zoneRadius * .58`.

Close/far checks stay strict and mutually exclusive:
- close: `dist < optRange * .54`;
- else far: `dist > weapon.range * .82`.

## Snapshot-input invariant

The caller passes `myX` and `myZ` captured before state execution. The owner must use those snapshots instead of re-reading position during its calculation, preserving legacy within-frame semantics.

## Verification

Run:
- `node --check src/ai/bot-engagement-movement.js`
- `node --test scripts/bot-engagement-movement-owner.test.mjs`
- `node scripts/stamp-web-build.mjs --check`
- `node scripts/validate-structure.mjs`
- HTTP browser boot smoke
- real `file://` browser smoke
- exact GitHub Actions run for the reviewed commit

Focused tests intentionally pin RNG order, strict close/far boundaries, role/suppress/opponent adjustments and additive Frontline/flank/anchor terms.
