# Task 024 — Occluded bot miss trace must not visually pass through cover

## WHY

Task 023 made shot outcomes explicit and deliberately kept wall/smoke occlusion on the legacy full attempt cadence. During that review a separate presentation bug remained visible in `executeBotShot(...)`: an occluded attempt has a 20% visual-only miss trace, but the trace uses the aim direction and a fixed `min(dist,18)` length without clamping to the first opaque wall hit.

Gameplay already fails closed — no ammo, recoil, noise, damage or projectile is emitted — yet the short tracer can visually extend beyond cover and imply that a bot fired through a wall. This should be fixed as a bounded presentation/collision task without mixing it into cadence balance.

## SCOPE

1. Start from fresh `main`; read `BOT_FIRE_CONTROL`, `OUTCOME_DRIVEN_CADENCE`, the exact occluded branch, trace primitives and the existing wall/raycast helpers.
2. Separate opaque-wall and smoke presentation semantics if needed: a wall-blocked visual trace must stop at or before the first blocking surface; smoke behavior must remain intentional and documented.
3. Preserve the visual-only 20% decision draw unless evidence supports a deliberate gameplay/presentation change; do not add hidden RNG.
4. Keep the `OCCLUDED` outcome and full legacy cadence from Task 023 unchanged.
5. Add deterministic regression coverage for trace length/endpoint and no gameplay side effects; prefer a small pure geometry helper if that improves testability without creating a second collision owner.
6. Update structural/docs oracles only for the final seam actually introduced.

## NON-GOALS

- No burst/cadence/retry rebalance.
- No damage, ammo, recoil, hit-chance or weapon-stat changes.
- No broad raycast/collision rewrite.
- No new generated VFX asset in the same pass.

## INVARIANTS

- Opaque cover cannot visually suggest a projectile continued through it when the gameplay outcome is `OCCLUDED`.
- Occluded visual feedback never consumes ammo/recoil/noise/damage/projectile authority.
- RNG count/order for the 20% visual-only decision is explicit and regression-tested.
- Fire-control remains execution/outcome owner; cadence remains next-attempt scheduler.

## FILES TO INSPECT

- `src/ai/bot-fire-control.js`
- `src/combat/combat.js`
- `src/core/engine.js`
- `scripts/bot-fire-control-owner.test.mjs`
- `scripts/validate-structure.mjs`
- `docs/specs/BOT_FIRE_CONTROL.md`
- `docs/patterns/OUTCOME_DRIVEN_CADENCE.md`

## VERIFICATION

Node 22 syntax → focused fire-control regressions → structure/build stamp → HTTP boot smoke → real `file://` smoke → exact main Actions evidence.

## DONE

Wall-blocked visual miss traces terminate at blocking geometry (or are intentionally suppressed), smoke semantics are explicit, gameplay/cadence/RNG invariants remain controlled, and exactly one evidence-based next task remains.
