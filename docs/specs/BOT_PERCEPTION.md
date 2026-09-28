# Bot perception owner contract

## Purpose

`src/ai/bot-perception.js` — единственный semantic owner индивидуального bot sensing. Он отвечает за данные, которые бот **воспринял**, но не за то, что FSM решит сделать после этого.

## Owns

- `BOT_NOISE_EVENTS`, weapon-noise radius/strength и player-shot synchronization;
- hearing scan, wall attenuation, uncertainty, heard source/position memory;
- target acquisition/scoring, target lock/reaction refresh и visible/heard/memory inputs;
- current target position helper;
- hostile grenade/mine scan cadence и cached threat validation;
- LOS refresh, last-known position/velocity и `TEAM_INTEL` observation update;
- incoming rocket path prediction и scan cadence.

## Does not own

- projectile, mine, grenade or smoke production — `src/combat/combat.js` / `src/weapons/system.js`;
- `Enemy` FSM transitions, retreat/hunt/dodge policy, shooting and damage reaction — `src/entities/bots.js`;
- movement caps, steering or collision substeps — `src/ai/bot-navigation.js`;
- squad doctrine / map orders / coordinated utility — `src/ai/tactics.js`;
- Frontline capture/state — `src/game/frontline.js`.

## Boundary: sense → decide → execute

Perception functions may update sensory state on a bot and return an observation. The consumer owns actions produced from that observation. Example: `updateBotHearingPerception(bot,dt)` may return `true`; only `bots.js` is allowed to convert that into `aiState='hunt'`. Mine/grenade sensing may return a threat; only the bot FSM chooses `retreat`. Rocket sensing returns a predicted threat; only the bot consumer triggers dodge.

This separation prevents sensing helpers from silently acquiring tactical authority.

## Preserved behavior invariants

Pure ownership refactors must preserve:

- noise event cap: **36**;
- stale event pruning: **2200 ms**; hearing candidate max age: **1.75 s**;
- wall-occluded hearing radius multiplier: **0.52**;
- heard memory duration: **1.65 s**;
- bot/player visibility acquisition ranges: **72 m / 76 m**;
- target scores, role/threat/crowding biases and switch margin;
- mine scan: **0.16 + random 0.12 s**;
- grenade scan: **0.10 + random 0.08 s**;
- LOS cadence: ally **0.16 + random 0.09 s**, enemy **0.22 + random 0.12 s**;
- rocket scan: **0.12 + random 0.06 s**;
- grenade danger score `distance + max(0,fuse-0.75)*3.2`;
- rocket closest-approach horizon **1.35 s** and danger radius `blastRadius + 2.0`.

Do not alter these values inside an ownership-only change.

## Dependency / load-order contract

Classic-script load order is part of runtime behavior:

`combat.js → bot-perception.js → bot-navigation.js → tactics.js → frontline.js → bot-presentation.js → bots.js`

Evaluation of the perception file only defines functions/state. Combat/projectile globals, `enemies`, camera/player state and `TEAM_INTEL` are invocation-time dependencies and are consumed after sequential bootstrap. `BOT_NOISE_EVENTS` must exist before tactics executes functions that inspect it.

## Verification

- direct: `node --test scripts/bot-perception-owner.test.mjs`;
- syntax: all `src/**/*.js` plus test/validation scripts;
- structure: `node scripts/validate-structure.mjs`;
- build parity: `node scripts/stamp-web-build.mjs --check`;
- runtime: HTTP boot smoke and real `file://` Chrome/CDP menu smoke;
- CI: exact PR head and exact merged `main` Validate runs.

Structural guards distinguish:
1. owner definitions required in `bot-perception.js`;
2. moved definitions forbidden in `bots.js`;
3. consumer calls required in `bots.js`;
4. tactics may consume the canonical noise bus but may not become its owner.
