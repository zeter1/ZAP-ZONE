# Task 025 — Regression-proof nearest-wall geometry contract

## WHY

Task 024 made `firstWallHitDistance(...)` the canonical nearest opaque-wall fact in `src/core/engine.js` and made `wallBetween(...)` delegate to it. Fire-control owner tests intentionally stub that geometry owner, while browser smoke proves loading rather than exact ray-distance semantics. The remaining coverage gap is a focused project-level regression for nearest-hit ordering, `Infinity` no-hit behavior and the existing endpoint tolerance.

## SCOPE

1. Start from fresh `main`; read `AGENTS.md`, `docs/patterns/OCCLUSION_CONSISTENT_PRESENTATION.md`, the wall-raycaster block in `src/core/engine.js`, and current structure/test harnesses.
2. Add the smallest focused regression that exercises the canonical geometry contract without introducing a second raycast implementation.
3. Cover at least: no blocker → `Infinity`/false; multiple blockers → nearest distance wins; blocker inside the existing target-end tolerance is not treated as an intervening wall; `wallBetween(...)` stays equivalent to finite nearest-hit distance.
4. Prefer test-only work. Change runtime geometry code only if the regression exposes a real defect.
5. Update structural/docs oracles only if the owner seam actually changes.

## NON-GOALS

- No broad collision/AABB/raycast rewrite.
- No LOS mesh-composition changes.
- No AI accuracy, cadence, damage or weapon-balance changes.
- No generated asset work.

## INVARIANTS

- `src/core/engine.js` remains the single owner of wall raycast semantics.
- `wallBetween(...)` and nearest-hit distance cannot silently diverge.
- Existing `dist - 0.15` endpoint tolerance is preserved unless a reproduced bug justifies changing it.
- Tests verify behavior, not Three.js internal implementation details.

## FILES TO INSPECT

- `src/core/engine.js`
- `docs/patterns/OCCLUSION_CONSISTENT_PRESENTATION.md`
- `scripts/validate-structure.mjs`
- existing test harnesses under `scripts/*.test.mjs`
- `.github/workflows/validate.yml`

## VERIFICATION

Node 22 syntax → focused geometry regression → structure/build-stamp as applicable → HTTP boot smoke → real `file://` smoke → exact main Actions evidence.

## DONE

Nearest-wall distance/boolean semantics have deterministic project-level coverage with no duplicate collision owner, and exactly one evidence-based next task remains.
