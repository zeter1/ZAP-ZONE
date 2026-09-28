# Task 003 — Extract bot presentation / arm-rig owner

## Goal
После отделения Frontline выполнить следующий bounded refactor: исследовать и, если fresh dependency closure подтверждает seam, вынести procedural bot model/presentation + two-hand arm-rig helpers из начала `src/entities/bots.js` в отдельный canonical owner (предварительно `src/entities/bot-presentation.js`).

## Why now / evidence
- После Task 002 `bots.js` остаётся главным крупным owner-ом индивидуального AI.
- В текущем main до locomotion/FSM расположен cohesive presentation block: `mkHuman()`, arm/grip scratch vectors, `setBotLimbBetween()`, `solveBotTwoBoneArm()`, `updateBotWeaponHands()`.
- Этот блок отвечает за geometry/pose/readability, а не за perception, decisions, damage, locomotion policy или weapon balance.
- Вынос уменьшит context cost для AI-задач по FSM/AI и позволит направлять visual/model задачи сразу в узкий owner.

## Scope
1. Fresh main + current task + workflow + exact Actions preflight.
2. Построить reference closure для `mkHuman`, arm rig/grip helpers, bot weapon-presentation fields и их callers.
3. Проверить evaluation-time dependencies (THREE, weapon factory/data) и invocation-time bot state.
4. Вынести только подтверждённый presentation/model seam; не тащить locomotion/AI decision state ради удобства.
5. Перенести/добавить owner guards и focused regression oracle, который ломается при реальном pose/rig contract regression, а не при harmless rename.
6. Обновить AI owner map/spec только по фактической новой границе.
7. Re-stamp build и получить exact PR + post-merge Actions evidence.

## Non-goals
- Не менять bot stats, aim, damage, speed, pathing, dodge, cover/flank или doctrine.
- Не редизайнить модели/оружие в чистом refactor.
- Не переносить `BOT_MOVE_CFG`/route/smoke/grenade logic без отдельного seam analysis.
- Не ослаблять browser/structure gates.

## Invariants
- Внешний вид, hit-mesh order, weapon grip/hand placement и health-bar behavior остаются прежними.
- Individual bot FSM остаётся в `src/entities/bots.js`.
- Один semantic owner для presentation helpers; никаких копий helper-ов между файлами.
- HTTP(S) и `file://` boot остаются зелёными.

## Files to inspect first
- `src/entities/bots.js` (особенно начало до movement helpers)
- `src/weapons/system.js`
- `scripts/validate-structure.mjs`
- `index.html`
- `docs/ARCHITECTURE.md`
- `docs/AI_WORKFLOW.md`
- `.github/workflows/validate.yml`

## Required verification
1. Node syntax all `src/**/*.js` + scripts.
2. Focused owner/pose regression + structure validation.
3. `node scripts/stamp-web-build.mjs --check`.
4. HTTP Chrome boot smoke.
5. real `file://` Chrome/CDP menu smoke.
6. repo-wide owner/reference closure.
7. exact PR and post-merge main Actions green.

## Done
Только если presentation owner действительно уменьшает ambiguity/context cost без semantic drift; выполненный task удалён, а следующий task создан из свежего evidence.
