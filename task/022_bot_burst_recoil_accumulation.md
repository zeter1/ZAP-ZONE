# Task 022 — Bot burst recoil accumulation and settle recovery

## WHY

Task 021 makes firing depend on measured shooter motion, but fresh review of `src/ai/bot-fire-control.js` + `src/ai/bot-fire-cadence.js` shows another realism gap: burst structure exists (`burstLeft`, pause and next-shot cadence), while consecutive bullets in a burst still have no persistent shot-to-shot recoil/bloom state. A moving penalty therefore improves platform stability, but the first and later rounds of an automatic burst still start from the same base weapon stability unless suppression/motion changes.

## SCOPE

1. Fresh `main`, `BOT_FIRE_CONTROL`, `BOT_FIRE_CADENCE`, current player recoil behavior and weapon definitions.
2. Add one bounded per-bot burst recoil/settle state owned by fire-control; cadence remains timing/RNG owner.
3. First shot must remain the most settled; rifle/plasma sustained bursts accumulate more than pistol, while sniper/rocket/shotgun keep weapon-appropriate single-shot handling.
4. Recovery must be `dt`-based and must compose with movement stability from Task 021 rather than replacing it.
5. Increment recoil only for an actually emitted firearm shot; blocked LOS/friendly-fire/rocket-safety attempts must not fake recoil.
6. Preserve existing damage, cadence, magazine/reload, suppression, target-motion, friendly-fire and RNG order unless a dedicated regression proves an intentional change.
7. Add deterministic tests + spec/changelog/oracles + full Validate/browser smoke.

## NON-GOALS

- No global damage/fire-rate/HP rebalance.
- No player recoil rewrite in the same pass.
- No navigation/perception/doctrine rewrite.
- No camera animation for bots; this is ballistic/weapon-settle state.

## INVARIANTS

- Recoil accumulation cannot make a later round more stable than the first at otherwise equal state.
- Recovery is frame-rate independent.
- Movement stability and burst recoil have separate named state/ownership.
- Cadence RNG count/order stays in `bot-fire-cadence.js`.
- Failed safety-gated shots do not consume ammo or accumulate recoil.

## FILES TO INSPECT

- `src/ai/bot-fire-control.js`
- `src/ai/bot-fire-cadence.js`
- `src/entities/bots.js`
- `src/combat/combat.js` (player recoil reference only)
- `src/weapons/system.js`
- `docs/specs/BOT_FIRE_CONTROL.md`
- `docs/specs/BOT_FIRE_CADENCE.md`
- focused owner tests + `scripts/validate-structure.mjs`

## VERIFICATION

Node 22 syntax → deterministic first/later-shot + recovery + safety-gate/RNG tests → fire-control/cadence regressions → structure → build stamp → HTTP smoke → real `file://` smoke → exact Actions head.

## DONE

Automatic bot bursts have readable, weapon-class-aware shot-to-shot recoil and deterministic settle recovery without changing cadence ownership or safety semantics; exactly one evidence-based next task remains.
