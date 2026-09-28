# Task 002 — Extract Frontline objective owner

## Goal
После уже завершённого разделения team/map tactics вынести один следующий cohesive seam: Frontline objective state + capture/rotation/HUD/marker/save contract из `src/entities/bots.js` в отдельный canonical owner (предварительно `src/game/frontline.js`; точный путь подтвердить fresh inspection).

## Why now / evidence
- `src/ai/tactics.js` теперь владеет map zones, squad plan, doctrine и Adaptive Commander policy.
- `src/entities/bots.js` всё ещё содержит отдельный game-mode слой Frontline: `FRONTLINE_CFG`, objective state, zone owners, save/restore, marker/HUD, capture/rotation/tick.
- Этот слой использует bot presence/tactics как dependency, но сам не является индивидуальным bot FSM; отдельный owner уменьшит context cost и owner ambiguity.
- CI #81 на commit `3edc686dfc67ec3c47c7977fcff4ac743bb5dd61` подтвердил текущий tactics split в HTTP и `file://`.

## Scope
1. Fresh inspection current `main`, текущего task, workflow и exact Actions state.
2. Построить reference/dependency closure для:
   - `FRONTLINE_CFG`;
   - `frontlineObjective`, `frontlineZoneOwners`, `frontlineZone()`;
   - serialize/reset/restore;
   - marker/HUD/capture/rotate/tick;
   - callers из player save/runtime/minimap/tactics.
3. Выбрать load-order seam по реальным evaluation-time и invocation-time dependencies.
4. Вынести только Frontline objective/game-mode orchestration.
5. Перенести source-oracles к новому owner, оставить consumer guards у bots/runtime/minimap/state.
6. Обновить `AGENTS.md`, `docs/AI_WORKFLOW.md`, `docs/ARCHITECTURE.md` и changelog только по фактической новой границе.
7. Пересчитать web build stamp и проверить exact Actions.

## Non-goals
- Не менять capture time, scoring, zone weights, rotation cadence, rewards или UI copy без отдельной evidence-based причины.
- Не менять Map Tactics/Adaptive Commander policy.
- Не рефакторить individual bot FSM, locomotion, shooting, cover/flank или weapon balance.
- Не отключать structural/browser gates ради green CI.

## Invariants
- Frontline capture/save/restore behavior остаётся прежним.
- `BOT_MAP_ZONES` имеет одного owner-а в `src/ai/tactics.js`; Frontline только потребляет zone model.
- `frontlineZoneOwners` остаётся доступен minimap после boot.
- Tactics может читать active Frontline zone без circular duplicate owner.
- HTTP(S) и реальный `file://` boot/menu smoke остаются зелёными.
- Classic-script dependency order явно закреплён validation.

## Inspect first
- `src/ai/tactics.js`
- `src/entities/bots.js`
- `src/player/state.js`
- `src/game/runtime.js`
- `src/ui/minimap.js`
- `scripts/validate-structure.mjs`
- `index.html`
- `docs/ARCHITECTURE.md`
- `.github/workflows/validate.yml`

## Required verification
1. Node syntax for every `src/**/*.js` + validation/build scripts.
2. `node scripts/stamp-web-build.mjs --check`.
3. `node scripts/validate-structure.mjs`.
4. HTTP Chrome boot smoke.
5. Real `file://` Chrome/CDP menu smoke.
6. Repo-wide reference closure: one Frontline owner, no duplicate extracted implementation.
7. Exact push Actions run for current implementation SHA.

## Done gate
Task закрывается только когда новый owner действительно уменьшает ambiguity, behavior/oracles/docs/load graph согласованы, exact CI green, выполненный task удалён и создан один следующий bounded evidence-based task.
