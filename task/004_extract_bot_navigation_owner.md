# Task 004 — Inspect/extract bot navigation + locomotion utilities

## Goal
После отделения bot presentation выполнить следующий bounded pass: исследовать cohesive navigation/locomotion seam в начале `src/entities/bots.js` и, **только если fresh dependency closure подтверждает чистую границу**, вынести его в отдельный canonical owner (предварительно `src/ai/bot-navigation.js`).

## Why now / evidence
- После Task 003 presentation/model code больше не смешан с AI runtime.
- Сразу после owner bridge в `bots.js` остаётся плотный блок navigation/locomotion helpers: `WPTS`, `steerBotAroundWalls()`, `BOT_MOVE_CFG`, `clampBotVelocity()`, smoke-route penalty/steering и `moveBotWithSubsteps()`.
- Этот блок содержит уже задокументированные anti-teleport invariants и collision/smoke routing, но сейчас находится рядом с perception/noise/FSM code.
- `nearestHostileGrenade()` находится на границе movement/threat perception и **не должен переноситься автоматически**: сначала классифицировать его owner по callers.

## Scope
1. Fresh `main`, текущий task, workflow и exact Actions preflight.
2. Построить repo-wide reference/dependency closure для:
   - `WPTS`;
   - `BOT_MOVE_CFG`;
   - wall/smoke steering and route-penalty helpers;
   - `clampBotVelocity()`;
   - `moveBotWithSubsteps()`;
   - callers внутри `Enemy`.
3. Отдельно классифицировать `nearestHostileGrenade()` и не смешивать threat perception с navigation ради удобного contiguous move.
4. Разделить evaluation-time и invocation-time dependencies (`THREE`, collision helpers, smoke state, constants).
5. Если seam чистый — вынести owner + focused behavioral tests + structural owner/consumer guards + narrow spec.
6. Если seam оказывается слишком связанным с FSM/perception — не форсировать extraction; вместо этого оформить smaller evidence-based task.
7. Re-stamp build и проверить exact PR + post-merge main Actions.

## Non-goals
- Не менять speed multipliers, acceleration caps, substep size, patrol points, collision bounds или smoke penalty weights в pure refactor.
- Не менять bot FSM, target selection, hearing/noise, cover/flank doctrine или shooting.
- Не менять Map Tactics / Adaptive Commander policy.
- Не переносить grenade/rocket threat perception без подтверждённого owner boundary.
- Не ослаблять browser/structure gates.

## Invariants
- Anti-teleport contract сохраняется буквально: speed/acceleration caps, substep `.16`, collision correction cap и final displacement cap.
- `collideWalls()` / `wallBetween()` остаются единственным collision source; никакой второй physics model.
- Smoke avoidance сохраняет team semantics и действующие density/radius thresholds.
- Patrol point data не меняется.
- HTTP(S) и реальный `file://` boot/menu остаются зелёными.

## Files to inspect first
- `src/entities/bots.js` — navigation block + all callers
- `src/core/engine.js` — collision helpers / wall ownership
- `src/ai/tactics.js` — policy boundary, чтобы не смешать planning с locomotion
- `scripts/validate-structure.mjs`
- `docs/ARCHITECTURE.md`
- `docs/AI_WORKFLOW.md`
- `.github/workflows/validate.yml`

## Required verification
1. Node syntax all `src/**/*.js` + changed scripts.
2. Focused behavioral tests for velocity clamp/substep/collision contract if extraction occurs.
3. Structure owner/consumer/reverse guards.
4. `node scripts/stamp-web-build.mjs --check`.
5. HTTP Chrome boot smoke.
6. Real `file://` Chrome/CDP menu smoke.
7. Repo-wide reference closure.
8. Exact PR Actions and exact post-merge main Actions green.

## Done
Задача закрывается только если navigation owner реально уменьшает ambiguity/context cost без semantic drift. Выполненный task удалить, а следующий bounded task создать только из свежего code/review/CI evidence.
