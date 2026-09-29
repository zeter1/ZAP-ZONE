# Task 008 — Inspect per-bot weapon-selection policy owner

## Goal

После выделения fire-control execution исследовать следующий небольшой seam в `src/entities/bots.js`: выбор/удержание bot weapon и switch triggers. Выносить отдельный policy owner только если fresh dependency closure отделяет **какое оружие выбрать** от weapon data/factories, fire-control execution, FSM и tactical doctrine.

## Why now / evidence

- Task 007 уменьшил `src/entities/bots.js` примерно с 1217 до 1046 строк без переноса burst/FSM policy.
- `chooseWeapon(distHint,force)` и switch conditions в `update()` всё ещё заставляют читать большой `Enemy` class ради range-fit/hysteresis policy.
- `src/weapons/system.js` уже является canonical source of truth для weapon definitions и `chooseBotWeaponByDistance(...)`; следующий seam не должен дублировать эти данные.
- `src/ai/bot-fire-control.js` теперь владеет только execution уже выбранного weapon, поэтому policy/execution boundary можно исследовать отдельно.

## Scope

1. Fresh `main`, current task, workflow и Actions preflight.
2. Repo-wide closure для `chooseWeapon`, `chooseBotWeaponByDistance`, `weaponSwitchT`, distance/range switch triggers и presentation refresh.
3. Разделить weapon-selection policy, weapon-data authority, visual equip side effects и fire-control execution.
4. Проверить, нужен ли узкий `src/ai/bot-weapon-policy.js` либо seam слишком мал/связан с `Enemy`.
5. Если extraction оправдан — pure refactor + focused behavior tests + owner/consumer/reverse guards + narrow spec.
6. Если нет — оставить owner на месте и выбрать меньший evidence-based seam.
7. Canonical build stamp; exact PR Validate; post-merge current-main Validate.

## Non-goals

- Не менять weapon stats, damage, spread, rate, clip/reload, ammo economy или distance preferences.
- Не менять fire-control/hit resolution в `src/ai/bot-fire-control.js`.
- Не менять squad doctrine, target acquisition или FSM transitions.
- Не менять player weapon lifecycle.
- Не ослаблять validation/browser smokes.

## Invariants

- `src/weapons/system.js` остаётся source of truth weapon definitions/factories.
- `src/ai/bot-fire-control.js` остаётся owner-ом execution выбранного weapon.
- `src/entities/bots.js` сохраняет FSM/tactical transition authority, пока fresh closure не докажет обратное.
- Pure refactor сохраняет switch hysteresis, random hold chances, timers и visual refresh order.
- HTTP(S) и реальный `file://` boot/menu остаются зелёными.

## Files to inspect first

- `src/entities/bots.js`
- `src/weapons/system.js`
- `src/ai/bot-fire-control.js`
- `src/entities/bot-presentation.js`
- `scripts/validate-structure.mjs`
- `docs/ARCHITECTURE.md`
- `docs/specs/BOT_FIRE_CONTROL.md`
- `.github/workflows/validate.yml`

## Verification

Syntax → focused behavior tests if extraction occurs → structure/source-oracle guards → build stamp → HTTP smoke → real `file://` smoke → exact PR Validate → current merged-main Validate.

## Done

Закрыть только если новый boundary реально снижает context cost и не создаёт второй weapon source of truth. Выполненный task удалить; следующий формировать только из fresh review/CI/runtime evidence.
