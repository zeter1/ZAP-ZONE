# Task 006 — Inspect per-bot tactical positioning owner

## Goal
После отделения perception исследовать следующий cohesive seam в `src/entities/bots.js`: локальный выбор cover/flank positions и связанные candidate-scoring helpers. Выносить positioning owner только если fresh dependency closure отделяет **where to move** от FSM state transitions и от navigation mechanics.

## Why now / evidence
- После Task 005 `bots.js` уменьшился примерно с 1484 до 1289 строк, а perception algorithms получили отдельный owner.
- В верхней части `Enemy` теперь остаётся компактный соседний блок `findTacticalCover()` + `findFlankPoint()`, который оценивает `COVER_POINTS`, LOS/smoke, crowding, route penalty и Frontline/objective bias.
- `src/ai/bot-navigation.js` уже владеет **how to move**, `src/ai/tactics.js` — squad/map policy; возможный positioning seam должен не дублировать ни один из этих owners.

## Scope
1. Fresh `main`, task, workflow и Actions preflight.
2. Repo-wide closure для `findTacticalCover`, `findFlankPoint`, их inputs/callers и source-oracles.
3. Разделить candidate scoring, FSM decision (`cover/flank`) и locomotion execution.
4. Проверить, нужен ли отдельный `src/ai/bot-positioning.js` или seam слишком связан с `Enemy`.
5. Если seam чистый — owner + focused regressions + structural guards + narrow spec.
6. Если нет — оставить ownership на месте и выбрать меньший evidence-based seam.
7. Canonical build stamp; exact PR Actions; post-merge main Actions.

## Non-goals
- Не менять cover/flank probabilities, role biases, distances, objective weights или commit timers.
- Не менять squad doctrine / Map Tactics.
- Не менять movement speed, steering, collision substeps или dodge.
- Не менять weapon/combat balance.
- Не ослаблять validation/browser smoke.

## Invariants
- `src/ai/tactics.js` остаётся owner-ом team/map policy.
- `src/ai/bot-navigation.js` остаётся owner-ом movement mechanics.
- FSM переходы и tactical execution не переносятся только ради contiguous extraction.
- Existing cover/flank scores и Frontline bias сохраняются буквально при pure refactor.
- HTTP(S) и реальный `file://` boot/menu остаются зелёными.

## Files to inspect first
- `src/entities/bots.js`
- `src/ai/bot-navigation.js`
- `src/ai/tactics.js`
- `src/game/frontline.js`
- `scripts/validate-structure.mjs`
- `docs/ARCHITECTURE.md`
- `docs/AI_WORKFLOW.md`
- `.github/workflows/validate.yml`

## Verification
1. Node syntax all `src/**/*.js` + changed scripts.
2. Focused behavior tests if extraction occurs.
3. Owner/consumer/reverse guards.
4. `node scripts/stamp-web-build.mjs --check`.
5. HTTP Chrome boot smoke.
6. Real `file://` Chrome/CDP menu smoke.
7. Repo-wide reference closure.
8. Exact PR and post-merge main Actions green.

## Done
Закрыть только если context cost уменьшается без semantic drift и новый owner не смешивает policy, intent и locomotion mechanics. Выполненный task удалить; следующую bounded задачу создавать только из fresh review/CI/runtime evidence.
