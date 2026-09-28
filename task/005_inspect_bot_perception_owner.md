# Task 005 — Inspect bot perception / threat-sensing owner

## Goal
После отделения navigation исследовать следующий cohesive seam в `src/entities/bots.js`: grenade/mine danger, combat noise/hearing и target-scan helpers. Выносить perception owner только если fresh dependency closure докажет чистую границу с FSM/combat execution.

## Why now / evidence
- Task 004 намеренно оставляет `nearestHostileGrenade()` в `bots.js`: это threat perception, не navigation.
- Рядом остаются `BOT_NOISE_EVENTS`, hearing helpers, scan timers и cached threat state.
- После удаления navigation-блока эта граница стала виднее, а `bots.js` остаётся главным AI context-cost.

## Scope
1. Fresh `main`, task, workflow и Actions preflight.
2. Repo-wide closure: grenade/mine danger, noise/hearing, target scan и callers в `Enemy`.
3. Разделить perception data collection, FSM decision, combat execution и external combat producers.
4. Не переносить чужие producers/policy ради contiguous move.
5. Если seam чистый — owner + focused regressions + structural guards + narrow spec.
6. Если сцепление сильное — выбрать меньший evidence-based seam.
7. Re-stamp; exact PR Actions; post-merge main Actions.

## Non-goals
- Не менять sight/hearing ranges, reaction timers, threat priorities, target weights или accuracy.
- Не менять FSM transitions, cover/flank doctrine, shooting, navigation physics или squad/map tactics.
- Не ослаблять validation/browser smoke.

## Invariants
- Grenade/mine danger semantics и scan cadence сохраняются.
- Noise source/team/radius semantics и shot-event cardinality сохраняются.
- Perception не получает право менять navigation physics или squad doctrine.
- HTTP(S) и реальный `file://` boot/menu остаются зелёными.

## Files to inspect first
- `src/entities/bots.js`
- `src/combat/combat.js`
- `src/ai/bot-navigation.js`
- `src/ai/tactics.js`
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
Закрыть только при уменьшении ambiguity/context cost без semantic drift. Выполненный task удалить; следующую bounded задачу создать только из fresh code/review/CI evidence.
