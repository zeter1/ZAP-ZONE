# Task 009 — Inspect individual bot deployable policy / execution boundary

## Goal

После weapon-selection extraction исследовать `maybePlantMine(...)` и `maybePlantBomb(...)`. Выносить owner только если fresh closure отделяет individual deployable decision/execution от FSM, squad coordinated utility и canonical combat/weapon primitives без второго source of truth.

## Why now / evidence

- Следующий соседний cluster в `src/entities/bots.js` — два deployable methods примерно на 40 строк.
- Они смешивают eligibility, doctrine/role probability, cooldown/limit checks и device creation side effects.
- `src/ai/tactics.js` уже владеет coordinated smoke/frag doctrine; competing utility owner недопустим.

## Scope

1. Fresh `main`, task, workflow и Actions preflight.
2. Closure для `maybePlantMine`, `maybePlantBomb`, `BOT_MINE_CFG`, `BOT_BOMB_CFG`, constructors, limits/counters, doctrine consumers и damage/tick authority.
3. Разделить individual use policy, deployable execution, shared combat state и squad coordinated utility.
4. Проверить узкий owner вроде `src/ai/bot-deployables.js`; если граница не чистая — оставить на месте.
5. При extraction сохранить probabilities/timers/random-call order буквально, добавить focused regressions, reverse guards и narrow spec.
6. Canonical build stamp; exact PR Validate; merged-main Validate.

## Non-goals

Не менять damage/radius/fuse/cooldown/limits/spawn physics, doctrine weights/chances, роли, Frontline, coordinated smoke/frag или player deployables. Не ослаблять validation/browser smokes.

## Invariants

Один semantic owner на device data/primitives и один на AI policy; `bots.js` сохраняет FSM/fire-gate authority; pure refactor сохраняет random/side-effect order; HTTP(S) и real `file://` остаются зелёными.

## Files to inspect first

`src/entities/bots.js`, `src/weapons/system.js`, `src/combat/combat.js`, `src/ai/tactics.js`, `scripts/validate-structure.mjs`, `docs/ARCHITECTURE.md`, `.github/workflows/validate.yml`.

## Verification

Syntax → focused tests if extraction occurs → structure/source-oracle guards → build stamp → HTTP smoke → real `file://` smoke → exact PR Validate → merged-main Validate.

## Done

Закрыть только если новая граница уменьшает context cost и не создаёт конкурирующую utility/combat authority. Выполненный task удалить; следующий — только из fresh evidence.
